const ADMIN_SESSION_KEY = 'admin_session';
const USER_SESSION_KEY = 'user_session';

const safeParse = (value) => {
    try {
        return JSON.parse(value);
    } catch (error) {
        return null;
    }
};

export const getAdminSession = () => {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(ADMIN_SESSION_KEY);
    return raw ? safeParse(raw) : null;
};

export const setAdminSession = (payload) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(payload));
};

export const clearAdminSession = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(ADMIN_SESSION_KEY);
};

export const updateAdminSession = (payload) => {
    if (typeof window === 'undefined') return null;
    const existing = getAdminSession() ?? {};
    const updated = {
        ...existing,
        ...payload,
        admin: payload?.admin ?? existing.admin,
    };

    setAdminSession(updated);
    return updated;
};

export const setUserSession = (payload) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(USER_SESSION_KEY, JSON.stringify(payload));
};

export const getUserSession = () => {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(USER_SESSION_KEY);
    return raw ? safeParse(raw) : null;
};

export const clearUserSession = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(USER_SESSION_KEY);
};

export const updateUserSession = (payload) => {
    if (typeof window === 'undefined') return null;
    const existing = getUserSession() ?? {};
    const updated = {
        ...existing,
        ...payload,
        user: payload?.user ?? existing.user,
    };

    setUserSession(updated);
    return updated;
};
