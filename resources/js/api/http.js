import axios from 'axios';
import { refreshAdminSession, refreshUserSession } from '../services/auth.js';
import {
    clearAdminSession,
    clearUserSession,
    getAdminSession,
    getUserSession,
    setAdminSession,
    setUserSession,
} from '../services/session.js';

const guessApiBaseUrl = () => {
    if (import.meta.env?.VITE_API_BASE_URL) {
        return import.meta.env.VITE_API_BASE_URL;
    }

    if (typeof window !== 'undefined') {
        if (window.APP_API_URL) {
            return window.APP_API_URL;
        }

        if (window.location.port === '5173') {
            return 'http://localhost:8000/api';
        }
    }

    return '/api';
};

const http = axios.create({
    baseURL: guessApiBaseUrl(),
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },
});

const resolveToken = (url) => {
    const path = url ?? '';

    const adminSession = getAdminSession();
    const userSession = getUserSession();

    const targetsAdmin = path.startsWith('/admin');
    const targetsUser = path.startsWith('/user');

    if (targetsAdmin) {
        return adminSession?.token ?? null;
    }

    if (targetsUser) {
        return userSession?.token ?? null;
    }

    return adminSession?.token ?? userSession?.token ?? null;
};

const resolveRole = (url) => {
    const path = url ?? '';

    if (path.startsWith('/admin')) {
        return 'admin';
    }

    if (path.startsWith('/user')) {
        return 'user';
    }

    if (getAdminSession()?.token) return 'admin';
    if (getUserSession()?.token) return 'user';

    return null;
};

const refreshState = {
    admin: { refreshing: false, queue: [] },
    user: { refreshing: false, queue: [] },
};

const processQueue = (role, error, session) => {
    refreshState[role].queue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve(session);
        }
    });

    refreshState[role].queue = [];
};

const redirectToLogin = (role) => {
    if (typeof window === 'undefined') return;

    if (role === 'admin') {
        clearAdminSession();
        window.location.replace('/admin');
        return;
    }

    clearUserSession();
    window.location.replace('/');
};

const enqueueRefresh = (role, refreshToken) =>
    new Promise((resolve, reject) => {
        const state = refreshState[role];
        state.queue.push({ resolve, reject });

        if (state.refreshing) {
            return;
        }

        state.refreshing = true;

        const refresher = role === 'admin' ? refreshAdminSession : refreshUserSession;

        refresher(refreshToken)
            .then((session) => {
                if (role === 'admin') {
                    setAdminSession(session);
                } else {
                    setUserSession(session);
                }

                processQueue(role, null, session);
            })
            .catch((error) => {
                processQueue(role, error, null);
            })
            .finally(() => {
                state.refreshing = false;
            });
    });

http.interceptors.request.use((config) => {
    if (typeof window === 'undefined') {
        return config;
    }

    const token = resolveToken(config.url);

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    } else {
        delete config.headers.Authorization;
    }

    return config;
});

http.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error.response?.status;
        const originalRequest = error.config || {};

        if (status === 401 && !originalRequest.__isRefreshRequest) {
            const role = resolveRole(originalRequest.url);

            if (role) {
                const session = role === 'admin' ? getAdminSession() : getUserSession();
                const refreshToken = session?.refresh_token;

                if (refreshToken) {
                    try {
                        const refreshedSession = await enqueueRefresh(role, refreshToken);

                        if (refreshedSession?.token) {
                            originalRequest._retry = true;
                            originalRequest.headers = originalRequest.headers ?? {};
                            originalRequest.headers.Authorization = `Bearer ${refreshedSession.token}`;
                            return http(originalRequest);
                        }
                    } catch (refreshError) {
                        redirectToLogin(role);
                        const refreshMessage =
                            refreshError.response?.data?.message || 'Session expired. Please sign in again.';
                        const enhancedRefreshError = new Error(refreshMessage);
                        enhancedRefreshError.response = refreshError.response;
                        return Promise.reject(enhancedRefreshError);
                    }
                }

                redirectToLogin(role);
            }
        }

        const message = error.response?.data?.message || 'Something went wrong. Please try again.';
        const enhancedError = new Error(message);
        enhancedError.response = error.response;
        return Promise.reject(enhancedError);
    },
);

export default http;
