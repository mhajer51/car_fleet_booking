import axios from 'axios';

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
        return Promise.reject(new Error(message));
    },
);

http.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem('admin_session');
        if (raw) {
            try {
                const session = JSON.parse(raw);
                if (session?.token) {
                    config.headers.Authorization = `Bearer ${session.token}`;
                } else {
                    delete config.headers.Authorization;
                }
            } catch (error) {
                window.localStorage.removeItem('admin_session');
                delete config.headers.Authorization;
            }
        } else {
            delete config.headers.Authorization;
        }
    }

    return config;
});

export default http;
