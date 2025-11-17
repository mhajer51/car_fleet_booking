import http from '../api/http.js';

export const fetchAdminDashboard = () =>
    http.get('/admin/dashboard').then((response) => response.data?.data ?? response.data);

export const fetchAdminUsers = (params = {}) =>
    http
        .get('/admin/users', { params })
        .then((response) => response.data?.data ?? response.data);

export const fetchAdminCars = (params = {}) =>
    http
        .get('/admin/cars', { params })
        .then((response) => response.data?.data ?? response.data);

export const createAdminCar = (payload) =>
    http
        .post('/admin/cars', payload)
        .then((response) => response.data?.data ?? response.data);

export const updateAdminCar = (carId, payload) =>
    http
        .put(`/admin/cars/${carId}`, payload)
        .then((response) => response.data?.data ?? response.data);

export const updateAdminCarStatus = (carId, payload) =>
    http
        .patch(`/admin/cars/${carId}/status`, payload)
        .then((response) => response.data?.data ?? response.data);

export const deleteAdminCar = (carId) =>
    http
        .delete(`/admin/cars/${carId}`)
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
