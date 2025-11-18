import http from '../api/http.js';

const unwrap = (response) => response.data?.data ?? response.data;

export const fetchPortalOverview = () =>
    http.get('/portal/overview').then((response) => unwrap(response));

export const fetchUserBookings = (params = {}) =>
    http.get('/user/bookings', { params }).then((response) => unwrap(response));

export const createUserBooking = (payload) =>
    http.post('/user/bookings', payload).then((response) => unwrap(response));

export const updateUserBooking = (bookingId, payload) =>
    http.put(`/user/bookings/${bookingId}`, payload).then((response) => unwrap(response));

export const returnUserBooking = (bookingId) =>
    http.post(`/user/bookings/${bookingId}/return`).then((response) => unwrap(response));

export const fetchAvailableBookingUsers = (params = {}) =>
    http.get('/user/bookings/available/users', { params }).then((response) => unwrap(response));

export const fetchAvailableBookingCars = (params = {}) =>
    http.get('/user/bookings/available/cars', { params }).then((response) => unwrap(response));

export const fetchAvailableBookingDrivers = (params = {}) =>
    http.get('/user/bookings/available/drivers', { params }).then((response) => unwrap(response));

export const fetchAvailableCars = (params = {}) =>
    http.get('/user/cars/available', { params }).then((response) => unwrap(response));

export const fetchUserCars = (params = {}) =>
    http.get('/user/cars', { params }).then((response) => unwrap(response));

export const createUserCar = (payload) =>
    http.post('/user/cars', payload).then((response) => unwrap(response));

export const fetchPlateSources = (params = {}) =>
    http.get('/user/plates/sources', { params }).then((response) => unwrap(response));

export const fetchPlateCategories = (params = {}) =>
    http.get('/user/plates/categories', { params }).then((response) => unwrap(response));

export const fetchPlateCodes = (params = {}) =>
    http.get('/user/plates/codes', { params }).then((response) => unwrap(response));

export const fetchUserDrivers = (params = {}) =>
    http.get('/user/drivers', { params }).then((response) => unwrap(response));

export const createUserDriver = (payload) =>
    http.post('/user/drivers', payload).then((response) => unwrap(response));

export const updateUserProfile = (payload) =>
    http.put('/user/profile', payload).then((response) => unwrap(response));

export const updateUserPassword = (payload) =>
    http.put('/user/profile/password', payload).then((response) => unwrap(response));
