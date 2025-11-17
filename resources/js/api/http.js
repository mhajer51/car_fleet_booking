import axios from 'axios';
import { getAdminSession, getUserSession } from '../services/session.js';

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

http.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.message || 'Something went wrong. Please try again.';
        const enhancedError = new Error(message);
        enhancedError.response = error.response;
        return Promise.reject(enhancedError);
    },
);

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

export default http;
