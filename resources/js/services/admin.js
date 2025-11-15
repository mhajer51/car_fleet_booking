import http from '../api/http.js';

export const fetchAdminDashboard = () =>
    http.get('/admin/dashboard').then((response) => response.data?.data ?? response.data);

export const fetchAdminUsers = () =>
    http.get('/admin/users').then((response) => response.data?.data ?? response.data);

export const fetchAdminCars = () =>
    http.get('/admin/cars').then((response) => response.data?.data ?? response.data);
