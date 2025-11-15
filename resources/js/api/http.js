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
        const message = error.response?.data?.message || 'حدث خطأ غير متوقع. حاول مرة أخرى.';
        return Promise.reject(new Error(message));
    },
);

export default http;
