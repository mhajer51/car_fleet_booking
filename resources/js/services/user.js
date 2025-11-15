import http from '../api/http.js';

const unwrap = (response) => response.data?.data ?? response.data;

export const fetchPortalOverview = () =>
    http.get('/portal/overview').then((response) => unwrap(response));

export const fetchUserBookings = (params = {}) =>
    http.get('/user/bookings', { params }).then((response) => unwrap(response));

export const createUserBooking = (payload) =>
    http.post('/user/bookings', payload).then((response) => unwrap(response));

export const returnUserBooking = (bookingId) =>
    http.post(`/user/bookings/${bookingId}/return`).then((response) => unwrap(response));

export const fetchAvailableCars = (params = {}) =>
    http.get('/user/cars/available', { params }).then((response) => unwrap(response));
