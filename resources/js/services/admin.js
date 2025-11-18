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

export const fetchAdminSponsors = (params = {}) =>
    http
        .get('/admin/sponsors', { params })
        .then((response) => response.data?.data ?? response.data);

export const createAdminSponsor = (payload) =>
    http
        .post('/admin/sponsors', payload)
        .then((response) => response.data?.data ?? response.data);

export const updateAdminSponsor = (sponsorId, payload) =>
    http
        .put(`/admin/sponsors/${sponsorId}`, payload)
        .then((response) => response.data?.data ?? response.data);

export const updateAdminSponsorStatus = (sponsorId, payload) =>
    http
        .patch(`/admin/sponsors/${sponsorId}/status`, payload)
        .then((response) => response.data?.data ?? response.data);

export const deleteAdminSponsor = (sponsorId) =>
    http
        .delete(`/admin/sponsors/${sponsorId}`)
        .then((response) => response.data?.data ?? response.data);

export const fetchPlateSources = (params = {}) =>
    http
        .get('/admin/plates/sources', { params })
        .then((response) => response.data?.data ?? response.data);

export const createPlateSource = (payload) =>
    http
        .post('/admin/plates/sources', payload)
        .then((response) => response.data?.data ?? response.data);

export const updatePlateSource = (id, payload) =>
    http
        .put(`/admin/plates/sources/${id}`, payload)
        .then((response) => response.data?.data ?? response.data);

export const deletePlateSource = (id) =>
    http
        .delete(`/admin/plates/sources/${id}`)
        .then((response) => response.data?.data ?? response.data);

export const fetchPlateCategories = (params = {}) =>
    http
        .get('/admin/plates/categories', { params })
        .then((response) => response.data?.data ?? response.data);

export const createPlateCategory = (payload) =>
    http
        .post('/admin/plates/categories', payload)
        .then((response) => response.data?.data ?? response.data);

export const updatePlateCategory = (id, payload) =>
    http
        .put(`/admin/plates/categories/${id}`, payload)
        .then((response) => response.data?.data ?? response.data);

export const deletePlateCategory = (id) =>
    http
        .delete(`/admin/plates/categories/${id}`)
        .then((response) => response.data?.data ?? response.data);

export const fetchPlateCodes = (params = {}) =>
    http
        .get('/admin/plates/codes', { params })
        .then((response) => response.data?.data ?? response.data);

export const createPlateCode = (payload) =>
    http
        .post('/admin/plates/codes', payload)
        .then((response) => response.data?.data ?? response.data);

export const updatePlateCode = (id, payload) =>
    http
        .put(`/admin/plates/codes/${id}`, payload)
        .then((response) => response.data?.data ?? response.data);

export const deletePlateCode = (id) =>
    http
        .delete(`/admin/plates/codes/${id}`)
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
