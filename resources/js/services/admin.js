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

export const createAdminDriver = (payload) =>
    http
        .post('/admin/drivers', payload)
        .then((response) => response.data?.data ?? response.data);

export const updateAdminDriver = (driverId, payload) =>
    http
        .put(`/admin/drivers/${driverId}`, payload)
        .then((response) => response.data?.data ?? response.data);

export const updateAdminDriverStatus = (driverId, payload) =>
    http
        .patch(`/admin/drivers/${driverId}/status`, payload)
        .then((response) => response.data?.data ?? response.data);

export const fetchAdminBookings = (params = {}) =>
    http
        .get('/admin/bookings', { params })
        .then((response) => response.data?.data ?? response.data);

export const createAdminBooking = (payload) =>
    http
        .post('/admin/bookings', payload)
        .then((response) => response.data?.data ?? response.data);

export const updateAdminBooking = (bookingId, payload) =>
    http
        .put(`/admin/bookings/${bookingId}`, payload)
        .then((response) => response.data?.data ?? response.data);

export const fetchAvailableBookingUsers = (params = {}) =>
    http
        .get('/admin/bookings/available/users', { params })
        .then((response) => response.data?.data ?? response.data);

export const fetchAvailableBookingCars = (params = {}) =>
    http
        .get('/admin/bookings/available/cars', { params })
        .then((response) => response.data?.data ?? response.data);

export const fetchAvailableBookingDrivers = (params = {}) =>
    http
        .get('/admin/bookings/available/drivers', { params })
        .then((response) => response.data?.data ?? response.data);

export const updateAdminProfile = (payload) =>
    http.put('/admin/profile', payload).then((response) => response.data?.data ?? response.data);

export const updateAdminPassword = (payload) =>
    http
        .put('/admin/profile/password', payload)
        .then((response) => response.data?.data ?? response.data);
