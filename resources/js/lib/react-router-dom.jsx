import { Children, createContext, useContext, useEffect, useMemo, useState } from 'react';

const RouterContext = createContext({ path: '/', navigate: () => {} });

const getCurrentPath = () => window.location.pathname;

export const BrowserRouter = ({ children }) => {
    const [path, setPath] = useState(getCurrentPath());

    useEffect(() => {
        const handlePopState = () => setPath(getCurrentPath());
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const navigate = (to, { replace = false } = {}) => {
        if (replace) {
            window.history.replaceState({}, '', to);
        } else {
            window.history.pushState({}, '', to);
        }
        setPath(getCurrentPath());
    };

    const value = useMemo(() => ({ path, navigate }), [path]);

    return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
};

const normalizePath = (value) => {
    if (!value) return '/';
    if (value === '*') return '*';
    return value.endsWith('/') && value !== '/' ? value.slice(0, -1) : value;
};

const matchPath = (routePath, currentPath) => {
    if (routePath === '*') return true;
    return normalizePath(routePath) === normalizePath(currentPath);
};

export const Routes = ({ children }) => {
    const { path } = useContext(RouterContext);
    const childArray = Children.toArray(children);

    for (const child of childArray) {
        if (matchPath(child.props.path, path)) {
            return child.props.element || null;
        }
    }

    return null;
};

export const Route = ({ element }) => element || null;

export const Navigate = ({ to, replace = false }) => {
    const { navigate } = useContext(RouterContext);
    useEffect(() => {
        navigate(to, { replace });
    }, [navigate, replace, to]);
    return null;
};
