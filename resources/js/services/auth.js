import http from '../api/http.js';

export const loginUser = (payload) =>
    http.post('/user', payload).then((response) => response.data?.data ?? response.data);

export const loginAdmin = (payload) =>
    http.post('/admin/login', payload).then((response) => response.data?.data ?? response.data);

export const refreshUserSession = (refreshToken) =>
    http
        .post(
            '/user/refresh',
            { refresh_token: refreshToken },
            { __isRefreshRequest: true },
        )
        .then((response) => response.data?.data ?? response.data);

export const refreshAdminSession = (refreshToken) =>
    http
        .post(
            '/admin/refresh',
            { refresh_token: refreshToken },
            { __isRefreshRequest: true },
        )
        .then((response) => response.data?.data ?? response.data);
