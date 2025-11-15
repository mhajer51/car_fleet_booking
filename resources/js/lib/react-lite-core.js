const TEXT_ELEMENT = 'text';
const FRAGMENT = Symbol('Fragment');
const hookStore = new Map();
const cleanupStore = new Map();
let currentOwner = null;
let hookCursor = 0;
let rootContainer = null;
let rootTree = null;
let isRendering = false;
const effectQueue = [];

const flatten = (children = []) =>
    children
        .flat()
        .filter((child) => child !== null && child !== undefined && child !== false)
        .map((child) => (typeof child === 'object' ? child : createTextElement(child)));

function createTextElement(value) {
    return {
        type: TEXT_ELEMENT,
        props: { nodeValue: value },
        children: [],
    };
}

export function createElement(type, props, ...children) {
    const normalizedChildren = flatten(children);
    return {
        type,
        props: props || {},
        children: normalizedChildren,
    };
}

const areDepsEqual = (next, prev) => {
    if (!prev) {
        return false;
    }
    if (!next || next.length !== prev.length) {
        return false;
    }
    for (let i = 0; i < next.length; i += 1) {
        if (!Object.is(next[i], prev[i])) {
            return false;
        }
    }
    return true;
};

const getHookBucket = (owner) => {
    if (!hookStore.has(owner)) {
        hookStore.set(owner, []);
    }
    return hookStore.get(owner);
};

const queueEffect = (owner, index, effect, depsChanged) => {
    if (!depsChanged) {
        return;
    }
    effectQueue.push(() => {
        const existing = cleanupStore.get(`${owner}_${index}`);
        if (existing) {
            existing();
            cleanupStore.delete(`${owner}_${index}`);
        }
        const cleanup = effect();
        if (typeof cleanup === 'function') {
            cleanupStore.set(`${owner}_${index}`, cleanup);
        }
    });
};

export function useState(initialValue) {
    const bucket = getHookBucket(currentOwner);
    const stateIndex = hookCursor;
    if (bucket[stateIndex] === undefined) {
        bucket[stateIndex] = typeof initialValue === 'function' ? initialValue() : initialValue;
    }
    const setState = (value) => {
        const current = bucket[stateIndex];
        const nextValue = typeof value === 'function' ? value(current) : value;
        if (!Object.is(current, nextValue)) {
            bucket[stateIndex] = nextValue;
            scheduleRender();
        }
    };
    hookCursor += 1;
    return [bucket[stateIndex], setState];
}

export function useRef(initialValue) {
    const bucket = getHookBucket(currentOwner);
    const refIndex = hookCursor;
    if (!bucket[refIndex]) {
        bucket[refIndex] = { current: initialValue };
    }
    hookCursor += 1;
    return bucket[refIndex];
}

export function useMemo(factory, deps) {
    const bucket = getHookBucket(currentOwner);
    const memoIndex = hookCursor;
    const entry = bucket[memoIndex];
    const shouldCreate = !entry || !deps || !areDepsEqual(deps, entry.deps);
    if (shouldCreate) {
        bucket[memoIndex] = { value: factory(), deps };
    }
    hookCursor += 1;
    return bucket[memoIndex].value;
}

export function useEffect(effect, deps) {
    const bucket = getHookBucket(currentOwner);
    const effectIndex = hookCursor;
    const entry = bucket[effectIndex];
    const depsChanged = !entry || !deps || !areDepsEqual(deps, entry.deps);
    bucket[effectIndex] = { deps };
    queueEffect(currentOwner, effectIndex, effect, depsChanged);
    hookCursor += 1;
}

const setProp = (node, key, value) => {
    if (key === 'children' || key === 'key' || key === 'ref') {
        return;
    }
    if (key === 'className') {
        node.className = value || '';
        return;
    }
    if (key === 'style' && value && typeof value === 'object') {
        Object.assign(node.style, value);
        return;
    }
    if (key.startsWith('on') && typeof value === 'function') {
        const eventName = key.slice(2).toLowerCase();
        node.addEventListener(eventName, value);
        return;
    }
    if (key === 'dangerouslySetInnerHTML' && value && typeof value.__html === 'string') {
        node.innerHTML = value.__html;
        return;
    }
    if (value === false || value === undefined || value === null) {
        return;
    }
    if (key in node) {
        node[key] = value;
    } else {
        node.setAttribute(key, value);
    }
};

const appendChildren = (parent, children, ownerPrefix, visited) => {
    children.forEach((child, index) => {
        const childNode = createNode(child, `${ownerPrefix}.${index}`, visited);
        if (childNode) {
            parent.appendChild(childNode);
        }
    });
};

const createNode = (element, ownerId, visited) => {
    if (element === null || element === undefined || element === false) {
        return null;
    }
    if (typeof element === 'string' || typeof element === 'number') {
        return document.createTextNode(String(element));
    }
    if (element.type === TEXT_ELEMENT) {
        return document.createTextNode(String(element.props.nodeValue ?? ''));
    }
    if (element.type === FRAGMENT) {
        const fragment = document.createDocumentFragment();
        appendChildren(fragment, element.children, ownerId, visited);
        return fragment;
    }
    if (typeof element.type === 'function') {
        visited.add(ownerId);
        const previousOwner = currentOwner;
        const previousCursor = hookCursor;
        currentOwner = ownerId;
        hookCursor = 0;
        const child = element.type({ ...(element.props || {}), children: element.children });
        const node = createNode(child, ownerId, visited);
        currentOwner = previousOwner;
        hookCursor = previousCursor;
        return node;
    }
    const dom = element.type === TEXT_ELEMENT ? document.createTextNode('') : document.createElement(element.type);
    Object.entries(element.props || {}).forEach(([key, value]) => setProp(dom, key, value));
    appendChildren(dom, element.children, ownerId, visited);
    return dom;
};

const cleanupRemovedOwners = (visited) => {
    for (const ownerId of hookStore.keys()) {
        if (!visited.has(ownerId)) {
            const bucket = hookStore.get(ownerId) || [];
            bucket.forEach((_, index) => {
                const cleanupKey = `${ownerId}_${index}`;
                const handler = cleanupStore.get(cleanupKey);
                if (handler) {
                    handler();
                    cleanupStore.delete(cleanupKey);
                }
            });
            hookStore.delete(ownerId);
        }
    }
};

const flushEffects = () => {
    while (effectQueue.length) {
        const effect = effectQueue.shift();
        effect();
    }
};

export const Fragment = FRAGMENT;

export const scheduleRender = () => {
    if (isRendering || !rootContainer || !rootTree) {
        return;
    }
    isRendering = true;
    queueMicrotask(() => {
        if (!rootContainer || !rootTree) {
            isRendering = false;
            return;
        }
        const visited = new Set();
        const node = createNode(rootTree, 'root', visited);
        rootContainer.replaceChildren();
        if (node) {
            rootContainer.appendChild(node);
        }
        cleanupRemovedOwners(visited);
        flushEffects();
        isRendering = false;
    });
};

export const registerRoot = (tree, container) => {
    rootTree = tree;
    rootContainer = container;
    scheduleRender();
};
