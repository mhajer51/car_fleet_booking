import ReactLite from './react-lite.js';

export function createRoot(container) {
    return {
        render(tree) {
            ReactLite.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.registerRoot(tree, container);
        },
    };
}

export const unstable_batchedUpdates = ReactLite.unstable_scheduleRender;
