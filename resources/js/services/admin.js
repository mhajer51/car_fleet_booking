import http from '../api/http.js';

export const fetchAdminDashboard = () =>
    http.get('/admin/dashboard').then((response) => response.data?.data ?? response.data);

export const fetchAdminUsers = (params = {}) =>
    http
        .get('/admin/users', { params })
        .then((response) => response.data?.data ?? response.data);

export const createAdminUser = (payload) =>
    http
        .post('/admin/users', payload)
        .then((response) => response.data?.data ?? response.data);

export const updateAdminUser = (id, payload) =>
    http
        .put(`/admin/users/${id}`, payload)
        .then((response) => response.data?.data ?? response.data);

export const updateAdminUserStatus = (id, payload) =>
    http
        .patch(`/admin/users/${id}/status`, payload)
        .then((response) => response.data?.data ?? response.data);

export const deleteAdminUser = (id) =>
    http
        .delete(`/admin/users/${id}`)
        .then((response) => response.data?.data ?? response.data);

export const fetchAdminCars = (params = {}) =>
    http
        .get('/admin/cars', { params })
        .then((response) => response.data?.data ?? response.data);

export const fetchAdminDrivers = (params = {}) =>
    http
        .get('/admin/drivers', { params })
        .then((response) => response.data?.data ?? response.data);

export const fetchAdminBookings = (params = {}) =>
    http
        .get('/admin/bookings', { params })
        .then((response) => response.data?.data ?? response.data);

export const createAdminBooking = (payload) =>
    http
        .post('/admin/bookings', payload)
        .then((response) => response.data?.data ?? response.data);
