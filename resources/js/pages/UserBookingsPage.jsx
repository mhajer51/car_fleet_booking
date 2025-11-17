import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Autocomplete,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Grid,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Typography,
    Checkbox,
} from '@mui/material';
import UserLayout from '../components/UserLayout.jsx';
import {
    createUserBooking,
    fetchAvailableBookingCars,
    fetchAvailableBookingDrivers,
    fetchAvailableBookingUsers,
    fetchUserBookings,
    returnUserBooking,
} from '../services/user.js';
import { getUserSession } from '../services/session.js';

const STATUS_OPTIONS = [
    { label: 'All statuses', value: 'all' },
    { label: 'Scheduled', value: 'upcoming' },
    { label: 'Active', value: 'active' },
    { label: 'Completed', value: 'completed' },
];

const statusTone = {
    upcoming: { label: 'Scheduled', color: '#f97316', bg: 'rgba(249,115,22,.12)' },
    active: { label: 'Active', color: '#0f766e', bg: 'rgba(16,185,129,.12)' },
    completed: { label: 'Completed', color: '#1d4ed8', bg: 'rgba(59,130,246,.12)' },
};

const defaultStartDate = () => {
    const now = new Date();
    now.setSeconds(0, 0);
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
};

const formatUserLabel = (user) => {
    if (!user) {
        return '';
    }

    const primary = user.name || user.username || user.employee_number || '';
    const secondary = user.employee_number || user.username;

    return secondary && secondary !== primary ? `${primary} • ${secondary}` : primary;
};

const formatCarLabel = (car) => {
    if (!car) {
        return '';
    }

    const primary = car.name || car.number || '';
    const secondary = car.number && car.number !== primary ? car.emirate + ' ' + car.number : null;

    return secondary ? `${primary} • ${secondary}` : primary;
};

const formatDriverLabel = (driver) => {
    if (!driver) {
        return '';
    }

    const primary = driver.name || driver.license_number || '';
    const secondary = driver.license_number && driver.license_number !== primary ? driver.license_number : null;

    return secondary ? `${primary} • ${secondary}` : primary;
};

const initialForm = {
    userId: '',
    carId: '',
    driverId: '',
    price: '',
    startDate: defaultStartDate(),
    endDate: '',
    openBooking: false,
    note: '',
};

const formatDate = (value) => {
    if (!value) {
        return '—';
    }

    try {
        return new Date(value).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    } catch (error) {
        return value;
    }
};

const UserBookingsPage = () => {
    const session = useMemo(() => getUserSession(), []);
    const defaultUserId = session?.user?.id ?? '';
    const [bookings, setBookings] = useState([]);
    const [meta, setMeta] = useState({ total: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [filters, setFilters] = useState({
        status: 'all',
        from_date: '',
        to_date: '',
        user_id: defaultUserId,
        car_id: '',
        driver_id: '',
    });
    const [pagination, setPagination] = useState({ page: 0, pageSize: 10 });
    const [dialogOpen, setDialogOpen] = useState(false);
    const [form, setForm] = useState({ ...initialForm, userId: defaultUserId });
    const [formErrors, setFormErrors] = useState({});
    const [creating, setCreating] = useState(false);
    const [returningBooking, setReturningBooking] = useState(null);
    const [availability, setAvailability] = useState({ users: [], cars: [], drivers: [] });
    const [availabilityLoading, setAvailabilityLoading] = useState({ users: false, cars: false, drivers: false });

    const totalRecords = meta?.total ?? bookings.length ?? 0;

    const loadBookings = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const payload = await fetchUserBookings({
                page: pagination.page + 1,
                per_page: pagination.pageSize,
                status: filters.status !== 'all' ? filters.status : undefined,
                from_date: filters.from_date || undefined,
                to_date: filters.to_date || undefined,
                user_id: filters.user_id || undefined,
                car_id: filters.car_id || undefined,
                driver_id: filters.driver_id || undefined,
            });
            setBookings(payload.bookings ?? []);
            setMeta(payload.meta ?? {});
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.page, pagination.pageSize]);

    useEffect(() => {
        loadBookings();
    }, [loadBookings]);

    const searchAvailability = useCallback(async (type, search = '') => {
        const params = {
            start_date: form.startDate,
            end_date: form.openBooking ? undefined : form.endDate || undefined,
            search,
            per_page: 50,
        };

        const setLoadingKey = `${type}s`;
        setAvailabilityLoading((prev) => ({ ...prev, [setLoadingKey]: true }));
        try {
            let response = { meta: {}, [`${type}s`]: [] };
            if (type === 'user') {
                response = await fetchAvailableBookingUsers(params);
            } else if (type === 'car') {
                response = await fetchAvailableBookingCars(params);
            } else if (type === 'driver') {
                response = await fetchAvailableBookingDrivers(params);
            }
            setAvailability((prev) => ({ ...prev, [`${type}s`]: response[`${type}s`] ?? [] }));
        } catch (err) {
            setAvailability((prev) => ({ ...prev, [`${type}s`]: [] }));
        } finally {
            setAvailabilityLoading((prev) => ({ ...prev, [setLoadingKey]: false }));
        }
    }, [form.startDate, form.endDate, form.openBooking]);

    useEffect(() => {
        loadBookings();
        searchAvailability('user');
        searchAvailability('car');
        searchAvailability('driver');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFilterChange = (event) => {
        const { name, value } = event.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const handleFilterAutoChange = (name) => (_, value) => {
        setFilters((prev) => ({ ...prev, [name]: value?.id ?? '' }));
    };

    const applyFilters = (event) => {
        event.preventDefault();
        setPagination((prev) => ({ ...prev, page: 0 }));
        loadBookings();
    };

    const resetFilters = () => {
        const base = { status: 'all', from_date: '', to_date: '', user_id: defaultUserId, car_id: '', driver_id: '' };
        setFilters(base);
        setPagination({ page: 0, pageSize: 10 });
        loadBookings();
    };

    const handleChangePage = (_, newPage) => {
        setPagination((prev) => ({ ...prev, page: newPage }));
    };

    const handleChangeRowsPerPage = (event) => {
        setPagination({ page: 0, pageSize: parseInt(event.target.value, 10) });
    };

    const handleFormChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleUserSelect = (_, value) => {
        setForm((prev) => ({ ...prev, userId: value?.id ?? '' }));
    };

    const handleCarSelect = (_, value) => {
        setForm((prev) => ({ ...prev, carId: value?.id ?? '' }));
    };

    const handleDriverSelect = (_, value) => {
        setForm((prev) => ({ ...prev, driverId: value?.id ?? '' }));
    };

    const handleOpenToggle = (event) => {
        const checked = event.target.checked;
        setForm((prev) => ({
            ...prev,
            openBooking: checked,
            endDate: checked ? '' : prev.endDate,
        }));
    };

    const submitBooking = async (event) => {
        event.preventDefault();
        setCreating(true);
        setError('');
        setMessage('');
        setFormErrors({});
        try {
            await createUserBooking({
                user_id: form.userId || defaultUserId,
                car_id: form.carId,
                driver_id: form.driverId,
                price: Number(form.price),
                start_date: form.startDate,
                end_date: form.openBooking ? null : form.endDate || null,
                open_booking: form.openBooking,
                note: form.note || null,
            });
            setMessage('Booking saved successfully.');
            setForm({ ...initialForm, userId: defaultUserId });
            setDialogOpen(false);
            loadBookings();
        } catch (err) {
            setError(err.message);
            if (err.errors) {
                setFormErrors(err.errors);
            }
        } finally {
            setCreating(false);
        }
    };

    const closeBooking = async (bookingId) => {
        setReturningBooking(bookingId);
        setError('');
        setMessage('');
        try {
            await returnUserBooking(bookingId);
            setMessage('The booking was closed and the vehicle was returned.');
            loadBookings();
        } catch (err) {
            setError(err.message);
        } finally {
            setReturningBooking(null);
        }
    };

    const actions = (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button variant="outlined" onClick={() => loadBookings()} disabled={loading}>
                Refresh log
            </Button>
            <Button variant="contained" onClick={() => setDialogOpen(true)}>
                New booking
            </Button>
        </Stack>
    );

    return (
        <UserLayout
            title="Bookings"
            description="Search, filter, and manage bookings exactly like the admin view."
            actions={actions}
        >
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}
            {message && (
                <Alert severity="success" sx={{ mb: 3 }}>
                    {message}
                </Alert>
            )}

            <Grid container spacing={4}>
                <Grid item xs={12} md={4}>
                    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight={700} gutterBottom>
                                Filter bookings
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Use the same filters available to admins, including user, car, and driver.
                            </Typography>
                            <Stack component="form" spacing={2} onSubmit={applyFilters}>
                                <TextField
                                    select
                                    name="status"
                                    label="Status"
                                    value={filters.status}
                                    onChange={handleFilterChange}
                                    InputLabelProps={{ shrink: true }}
                                    SelectProps={{ native: true }}
                                >
                                    {STATUS_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </TextField>
                                <Autocomplete
                                    options={availability.users}
                                    loading={availabilityLoading.users}
                                    getOptionLabel={formatUserLabel}
                                    value={availability.users.find((user) => user.id === filters.user_id) || null}
                                    onChange={handleFilterAutoChange('user_id')}
                                    onInputChange={(_, value) => searchAvailability('user', value)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="User"
                                            InputLabelProps={{ shrink: true }}
                                            placeholder="Search users"
                                        />
                                    )}
                                />
                                <Autocomplete
                                    options={availability.cars}
                                    loading={availabilityLoading.cars}
                                    getOptionLabel={formatCarLabel}
                                    value={availability.cars.find((car) => car.id === filters.car_id) || null}
                                    onChange={handleFilterAutoChange('car_id')}
                                    onInputChange={(_, value) => searchAvailability('car', value)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Car"
                                            InputLabelProps={{ shrink: true }}
                                            placeholder="Search cars"
                                        />
                                    )}
                                />
                                <Autocomplete
                                    options={availability.drivers}
                                    loading={availabilityLoading.drivers}
                                    getOptionLabel={formatDriverLabel}
                                    value={availability.drivers.find((driver) => driver.id === filters.driver_id) || null}
                                    onChange={handleFilterAutoChange('driver_id')}
                                    onInputChange={(_, value) => searchAvailability('driver', value)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Driver"
                                            InputLabelProps={{ shrink: true }}
                                            placeholder="Search drivers"
                                        />
                                    )}
                                />
                                <TextField
                                    name="from_date"
                                    label="From date"
                                    type="date"
                                    value={filters.from_date}
                                    onChange={handleFilterChange}
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    name="to_date"
                                    label="To date"
                                    type="date"
                                    value={filters.to_date}
                                    onChange={handleFilterChange}
                                    InputLabelProps={{ shrink: true }}
                                />
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    <Button type="submit" variant="contained" fullWidth disabled={loading}>
                                        Apply filters
                                    </Button>
                                    <Button variant="text" fullWidth onClick={resetFilters}>
                                        Reset
                                    </Button>
                                </Stack>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={8}>
                    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
                        <CardContent>
                            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} mb={3}>
                                <Box>
                                    <Typography variant="h6" fontWeight={700}>
                                        Booking history
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {totalRecords} bookings • Matching your filters
                                    </Typography>
                                </Box>
                                <Button variant="outlined" onClick={() => loadBookings()} disabled={loading}>
                                    Refresh bookings
                                </Button>
                            </Stack>

                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>User</TableCell>
                                        <TableCell>Car</TableCell>
                                        <TableCell>Driver</TableCell>
                                        <TableCell>Price</TableCell>
                                        <TableCell>Start</TableCell>
                                        <TableCell>End</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={8} align="center">
                                                <Stack alignItems="center" py={4} spacing={1}>
                                                    <CircularProgress size={24} />
                                                    <Typography variant="body2" color="text.secondary">
                                                        Loading bookings…
                                                    </Typography>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ) : !bookings.length ? (
                                        <TableRow>
                                            <TableCell colSpan={8} align="center">
                                                <Typography color="text.secondary" py={3}>
                                                    No bookings match your filters.
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        bookings.map((booking) => {
                                            const tone = statusTone[booking.status] ?? { label: booking.status, color: '#94a3b8', bg: '#e2e8f0' };
                                            return (
                                                <TableRow key={booking.id} hover>
                                                    <TableCell>
                                                        <Typography fontWeight={600}>{booking.user?.name ?? booking.guest_name ?? 'Guest'}</Typography>
                                                        {booking.user?.username && (
                                                            <Typography variant="body2" color="text.secondary">
                                                                {booking.user.username}
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography fontWeight={600}>{booking.car?.name ?? ''}</Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {booking.car?.emirate} {booking.car?.number}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography fontWeight={600}>{booking.driver?.name ?? ''}</Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {booking.driver?.license_number}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography>{Number(booking.price ?? 0).toFixed(2)}</Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography>{formatDate(booking.start_date)}</Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography>{booking.end_date ? formatDate(booking.end_date) : 'Open booking'}</Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={tone.label}
                                                            size="small"
                                                            sx={{
                                                                color: tone.color,
                                                                backgroundColor: tone.bg,
                                                                fontWeight: 700,
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {booking.status === 'active' ? (
                                                            <Button
                                                                size="small"
                                                                color="success"
                                                                variant="contained"
                                                                onClick={() => closeBooking(booking.id)}
                                                                disabled={returningBooking === booking.id}
                                                            >
                                                                {returningBooking === booking.id ? 'Completing…' : 'Return vehicle'}
                                                            </Button>
                                                        ) : (
                                                            <Typography variant="body2" color="text.secondary">
                                                                —
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                            <TablePagination
                                component="div"
                                count={totalRecords}
                                page={pagination.page}
                                onPageChange={handleChangePage}
                                rowsPerPage={pagination.pageSize}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                                rowsPerPageOptions={[5, 10, 25, 50]}
                            />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="md" component="form" onSubmit={submitBooking}>
                <DialogTitle>New booking</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2} mt={1}>
                        <Autocomplete
                            options={availability.users}
                            loading={availabilityLoading.users}
                            getOptionLabel={formatUserLabel}
                            value={availability.users.find((user) => user.id === form.userId) || null}
                            onChange={handleUserSelect}
                            onInputChange={(_, value) => searchAvailability('user', value)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="User"
                                    placeholder="Search for a user"
                                    InputLabelProps={{ shrink: true }}
                                    error={Boolean(formErrors.user_id)}
                                    helperText={formErrors.user_id?.[0]}
                                />
                            )}
                        />
                        <Autocomplete
                            options={availability.cars}
                            loading={availabilityLoading.cars}
                            getOptionLabel={formatCarLabel}
                            value={availability.cars.find((car) => car.id === form.carId) || null}
                            onChange={handleCarSelect}
                            onInputChange={(_, value) => searchAvailability('car', value)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Car"
                                    placeholder="Search available cars"
                                    InputLabelProps={{ shrink: true }}
                                    required
                                    error={Boolean(formErrors.car_id)}
                                    helperText={formErrors.car_id?.[0]}
                                />
                            )}
                        />
                        <Autocomplete
                            options={availability.drivers}
                            loading={availabilityLoading.drivers}
                            getOptionLabel={formatDriverLabel}
                            value={availability.drivers.find((driver) => driver.id === form.driverId) || null}
                            onChange={handleDriverSelect}
                            onInputChange={(_, value) => searchAvailability('driver', value)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Driver"
                                    placeholder="Search available drivers"
                                    InputLabelProps={{ shrink: true }}
                                    required
                                    error={Boolean(formErrors.driver_id)}
                                    helperText={formErrors.driver_id?.[0]}
                                />
                            )}
                        />
                        <TextField
                            name="price"
                            label="Price"
                            type="number"
                            value={form.price}
                            onChange={handleFormChange}
                            required
                            InputLabelProps={{ shrink: true }}
                            error={Boolean(formErrors.price)}
                            helperText={formErrors.price?.[0]}
                        />
                        <TextField
                            name="startDate"
                            label="Start date"
                            type="datetime-local"
                            value={form.startDate}
                            onChange={handleFormChange}
                            required
                            InputLabelProps={{ shrink: true }}
                            error={Boolean(formErrors.start_date)}
                            helperText={formErrors.start_date?.[0]}
                        />
                        <TextField
                            name="endDate"
                            label="End date"
                            type="datetime-local"
                            value={form.endDate}
                            onChange={handleFormChange}
                            disabled={form.openBooking}
                            InputLabelProps={{ shrink: true }}
                            error={Boolean(formErrors.end_date)}
                            helperText={formErrors.end_date?.[0]}
                        />
                        <FormControlLabel
                            control={<Checkbox checked={form.openBooking} onChange={handleOpenToggle} />}
                            label="Open trip without a return date"
                        />
                        <TextField
                            name="note"
                            label="Note"
                            multiline
                            minRows={3}
                            value={form.note}
                            onChange={handleFormChange}
                            InputLabelProps={{ shrink: true }}
                            error={Boolean(formErrors.note)}
                            helperText={formErrors.note?.[0] || 'Add any special instructions for this booking.'}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" variant="contained" disabled={creating}>
                        {creating ? 'Creating booking…' : 'Confirm booking'}
                    </Button>
                </DialogActions>
            </Dialog>
        </UserLayout>
    );
};

export default UserBookingsPage;
