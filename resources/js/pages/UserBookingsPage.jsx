import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Autocomplete,
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
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
    const defaultUserOption = session?.user
        ? { id: session.user.id, name: session.user.name, username: session.user.username }
        : null;

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
    const [form, setForm] = useState({ ...initialForm, userId: defaultUserId || '' });
    const [formError, setFormError] = useState('');
    const [formErrors, setFormErrors] = useState({});
    const [creating, setCreating] = useState(false);
    const [returningBooking, setReturningBooking] = useState(null);
    const [availability, setAvailability] = useState({
        users: defaultUserOption ? [defaultUserOption] : [],
        cars: [],
        drivers: [],
    });
    const [availabilityLoading, setAvailabilityLoading] = useState({ users: false, cars: false, drivers: false });

    const totalRecords = meta?.total ?? bookings.length ?? 0;

    const visibleRange = useMemo(() => {
        const from = totalRecords === 0 ? 0 : pagination.page * pagination.pageSize + 1;
        const to = Math.min(totalRecords, (pagination.page + 1) * pagination.pageSize);
        return { from, to };
    }, [pagination.page, pagination.pageSize, totalRecords]);

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
    }, [filters.car_id, filters.driver_id, filters.from_date, filters.status, filters.to_date, filters.user_id, pagination.page, pagination.pageSize]);

    useEffect(() => {
        loadBookings();
    }, [loadBookings]);

    useEffect(() => {
        setPagination((prev) => ({ ...prev, page: 0 }));
    }, [filters.status, filters.from_date, filters.to_date, filters.user_id, filters.car_id, filters.driver_id]);

    const buildAvailabilityParams = useCallback(
        () => ({
            start_date: form.startDate || defaultStartDate(),
            end_date: form.openBooking ? null : form.endDate || null,
            per_page: 20,
        }),
        [form.endDate, form.openBooking, form.startDate],
    );

    const loadAvailability = useCallback(
        async (resource, search = '') => {
            if (!form.startDate) {
                return;
            }

            setAvailabilityLoading((prev) => ({ ...prev, [resource]: true }));
            setFormError('');
            try {
                const params = { ...buildAvailabilityParams(), search };
                const payload = await (resource === 'users'
                    ? fetchAvailableBookingUsers(params)
                    : resource === 'cars'
                        ? fetchAvailableBookingCars(params)
                        : fetchAvailableBookingDrivers(params));

                setAvailability((prev) => ({
                    ...prev,
                    [resource]: payload?.[resource] ?? payload ?? [],
                }));
            } catch (err) {
                setFormError(err.message);
            } finally {
                setAvailabilityLoading((prev) => ({ ...prev, [resource]: false }));
            }
        },
        [buildAvailabilityParams, form.startDate],
    );

    useEffect(() => {
        if (!dialogOpen) {
            return;
        }

        loadAvailability('users');
        loadAvailability('cars');
        loadAvailability('drivers');
    }, [dialogOpen, loadAvailability]);

    const addToAvailability = (resource, item) => {
        if (!item?.id) {
            return;
        }

        setAvailability((prev) => {
            const list = prev[resource] ?? [];
            const exists = list.some((entry) => entry.id === item.id);

            if (exists) {
                return prev;
            }

            return {
                ...prev,
                [resource]: [...list, item],
            };
        });
    };

    const updateFilter = (field, value) => {
        setFilters((prev) => ({ ...prev, [field]: value }));
    };

    const resetFilters = () => {
        setFilters({ status: 'all', from_date: '', to_date: '', user_id: defaultUserId, car_id: '', driver_id: '' });
    };

    const handlePaginationChange = (_event, newPage) => {
        setPagination((prev) => ({ ...prev, page: newPage }));
    };

    const handleRowsPerPageChange = (event) => {
        setPagination({ page: 0, pageSize: parseInt(event.target.value, 10) });
    };

    const openDialog = () => {
        setDialogOpen(true);
        setForm({ ...initialForm, userId: defaultUserId || '', startDate: defaultStartDate() });
        setFormError('');
        setFormErrors({});
        setMessage('');
    };

    const closeDialog = () => {
        setDialogOpen(false);
        setForm({ ...initialForm, userId: defaultUserId || '' });
        setFormError('');
        setFormErrors({});
    };

    const handleFormChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const validateForm = useCallback(() => {
        const errors = {};

        const priceValue = Number(form.price);
        if (Number.isNaN(priceValue) || priceValue < 0) {
            errors.price = ['Price must be a positive number.'];
        }

        if (!form.userId) {
            errors.userId = ['User selection is required.'];
        }

        if (!form.carId) {
            errors.carId = ['Please choose a car.'];
        }

        if (!form.driverId) {
            errors.driverId = ['Please choose a driver.'];
        }

        if (!form.startDate) {
            errors.startDate = ['Start date is required.'];
        }

        if (!form.openBooking) {
            if (!form.endDate) {
                errors.endDate = ['End date is required unless booking is open.'];
            } else {
                const start = new Date(form.startDate);
                const end = new Date(form.endDate);

                if (start && end && end <= start) {
                    errors.endDate = ['End date must be after the start date.'];
                }
            }
        }

        return errors;
    }, [form.carId, form.driverId, form.endDate, form.openBooking, form.price, form.startDate, form.userId]);

    const submitBooking = async (event) => {
        event.preventDefault();
        setFormError('');
        setMessage('');

        const errors = validateForm();

        if (Object.keys(errors).length) {
            setFormErrors(errors);
            setFormError('Please correct the highlighted fields.');
            return;
        }

        const payload = {
            user_id: Number(form.userId),
            car_id: Number(form.carId),
            driver_id: Number(form.driverId),
            price: Number(form.price),
            start_date: form.startDate,
            end_date: form.openBooking ? null : form.endDate || null,
            open_booking: form.openBooking,
        };

        if (form.note.trim()) {
            payload.note = form.note.trim();
        }

        setCreating(true);
        try {
            await createUserBooking(payload);
            setMessage('Booking created successfully.');
            closeDialog();
            loadBookings();
        } catch (err) {
            setFormError(err.message);
            if (err?.response?.data?.data) {
                setFormErrors(err.response.data.data);
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

    const selectedUser = useMemo(() => {
        if (!filters.user_id) {
            return null;
        }
        const id = Number(filters.user_id);
        return availability.users.find((user) => user.id === id) ?? null;
    }, [availability.users, filters.user_id]);

    const selectedCar = useMemo(() => {
        if (!filters.car_id) {
            return null;
        }
        const id = Number(filters.car_id);
        return availability.cars.find((car) => car.id === id) ?? null;
    }, [availability.cars, filters.car_id]);

    const selectedDriver = useMemo(() => {
        if (!filters.driver_id) {
            return null;
        }
        const id = Number(filters.driver_id);
        return availability.drivers.find((driver) => driver.id === id) ?? null;
    }, [availability.drivers, filters.driver_id]);

    const actions = (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button variant="contained" onClick={openDialog}>
                New Booking
            </Button>
        </Stack>
    );

    return (
        <UserLayout
            title="Bookings"
            description="Browse, filter, and create bookings with the same layout as admin."
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

            <Stack spacing={4}>
                <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
                    <CardContent>
                        <Typography variant="h6" fontWeight={700} gutterBottom>
                            Filters
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Booking status"
                                    value={filters.status}
                                    onChange={(event) => updateFilter('status', event.target.value)}
                                    SelectProps={{ native: true }}
                                >
                                    {STATUS_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    type="date"
                                    fullWidth
                                    label="From date"
                                    InputLabelProps={{ shrink: true }}
                                    value={filters.from_date}
                                    onChange={(event) => updateFilter('from_date', event.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    type="date"
                                    fullWidth
                                    label="To date"
                                    InputLabelProps={{ shrink: true }}
                                    value={filters.to_date}
                                    onChange={(event) => updateFilter('to_date', event.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Autocomplete
                                    options={availability.users}
                                    value={selectedUser}
                                    loading={availabilityLoading.users}
                                    getOptionLabel={formatUserLabel}
                                    onChange={(_, value) => updateFilter('user_id', value?.id ?? '')}
                                    onInputChange={(_, value) => loadAvailability('users', value)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="User"
                                            placeholder="Search users"
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Autocomplete
                                    options={availability.cars}
                                    value={selectedCar}
                                    loading={availabilityLoading.cars}
                                    getOptionLabel={formatCarLabel}
                                    onChange={(_, value) => updateFilter('car_id', value?.id ?? '')}
                                    onInputChange={(_, value) => loadAvailability('cars', value)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Car"
                                            placeholder="Search cars"
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Autocomplete
                                    options={availability.drivers}
                                    value={selectedDriver}
                                    loading={availabilityLoading.drivers}
                                    getOptionLabel={formatDriverLabel}
                                    onChange={(_, value) => updateFilter('driver_id', value?.id ?? '')}
                                    onInputChange={(_, value) => loadAvailability('drivers', value)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Driver"
                                            placeholder="Search drivers"
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    <Button variant="contained" fullWidth onClick={loadBookings} disabled={loading}>
                                        Apply filters
                                    </Button>
                                    <Button variant="text" fullWidth onClick={resetFilters}>
                                        Reset
                                    </Button>
                                </Stack>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
                    <CardContent>
                        <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between" spacing={2} mb={3}>
                            <Box>
                                <Typography variant="h6" fontWeight={700} gutterBottom>
                                    Bookings table
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Showing {visibleRange.from}-{visibleRange.to} of {totalRecords} bookings
                                </Typography>
                            </Box>
                            <Button variant="outlined" onClick={loadBookings} disabled={loading}>
                                Refresh
                            </Button>
                        </Stack>

                        <Box sx={{ overflowX: 'auto' }}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>#</TableCell>
                                        <TableCell>User</TableCell>
                                        <TableCell>Car</TableCell>
                                        <TableCell>Driver</TableCell>
                                        <TableCell>Price</TableCell>
                                        <TableCell>Start</TableCell>
                                        <TableCell>End</TableCell>
                                        <TableCell>Note</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={10} align="center">
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
                                            <TableCell colSpan={10} align="center">
                                                <Typography color="text.secondary" py={3}>
                                                    No bookings match your filters.
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        bookings.map((booking) => {
                                            const tone = statusTone[booking.status] ?? {
                                                label: booking.status,
                                                color: '#334155',
                                                bg: 'rgba(148,163,184,.24)',
                                            };
                                            return (
                                                <TableRow key={booking.id} hover>
                                                    <TableCell>#{booking.id}</TableCell>
                                                    <TableCell>
                                                        <Typography fontWeight={600}>{booking.user?.name ?? '—'}</Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {booking.user?.username}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography fontWeight={600}>{booking.car?.name ?? '—'}</Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {booking.car?.number}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography fontWeight={600}>{booking.driver?.name ?? '—'}</Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {booking.driver?.license_number}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography fontWeight={700}>{booking.price ?? '—'}</Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography>{formatDate(booking.start_date)}</Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography>{booking.open_booking ? 'Open booking' : formatDate(booking.end_date)}</Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ maxWidth: 240 }}>
                                                        <Typography noWrap title={booking.note}>
                                                            {booking.note || '—'}
                                                        </Typography>
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
                                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                color="secondary"
                                                                disabled={returningBooking === booking.id || booking.status === 'completed'}
                                                                onClick={() => closeBooking(booking.id)}
                                                            >
                                                                {returningBooking === booking.id ? 'Closing…' : 'Return'}
                                                            </Button>
                                                        </Stack>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </Box>

                        <TablePagination
                            component="div"
                            count={totalRecords}
                            page={pagination.page}
                            onPageChange={handlePaginationChange}
                            rowsPerPage={pagination.pageSize}
                            onRowsPerPageChange={handleRowsPerPageChange}
                            rowsPerPageOptions={[10, 25, 50]}
                        />
                    </CardContent>
                </Card>
            </Stack>

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="md" component="form" onSubmit={submitBooking}>
                <DialogTitle>New booking</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={3} mt={1}>
                        <Stack spacing={1}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Booking window
                            </Typography>
                            <TextField
                                type="datetime-local"
                                label="Start date"
                                value={form.startDate}
                                onChange={(event) => handleFormChange('startDate', event.target.value)}
                                InputLabelProps={{ shrink: true }}
                                required
                                error={Boolean(formErrors.startDate)}
                                helperText={formErrors.startDate?.[0]}
                            />
                            <TextField
                                type="datetime-local"
                                label="End date"
                                value={form.endDate}
                                onChange={(event) => handleFormChange('endDate', event.target.value)}
                                InputLabelProps={{ shrink: true }}
                                disabled={form.openBooking}
                                error={Boolean(formErrors.endDate)}
                                helperText={
                                    formErrors.endDate?.[0]
                                        || (form.openBooking ? 'Open booking without a return time' : 'Specify an optional return time')
                                }
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={form.openBooking}
                                        onChange={(event) => handleFormChange('openBooking', event.target.checked)}
                                    />
                                }
                                label="Open booking without return date"
                            />
                        </Stack>

                        <Stack spacing={1}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Assignment
                            </Typography>
                            <Autocomplete
                                options={availability.users}
                                loading={availabilityLoading.users}
                                value={availability.users.find((user) => user.id === form.userId) || defaultUserOption || null}
                                getOptionLabel={formatUserLabel}
                                onChange={(_, value) => {
                                    handleFormChange('userId', value?.id ?? '');
                                    addToAvailability('users', value);
                                }}
                                onInputChange={(_, value) => loadAvailability('users', value)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="User"
                                        placeholder="Search for a user"
                                        InputLabelProps={{ shrink: true }}
                                        required
                                        error={Boolean(formErrors.userId)}
                                        helperText={formErrors.userId?.[0]}
                                    />
                                )}
                            />
                            <Autocomplete
                                options={availability.cars}
                                loading={availabilityLoading.cars}
                                value={availability.cars.find((car) => car.id === form.carId) || null}
                                getOptionLabel={formatCarLabel}
                                onChange={(_, value) => {
                                    handleFormChange('carId', value?.id ?? '');
                                    addToAvailability('cars', value);
                                }}
                                onInputChange={(_, value) => loadAvailability('cars', value)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Car"
                                        placeholder="Search available cars"
                                        InputLabelProps={{ shrink: true }}
                                        required
                                        error={Boolean(formErrors.carId)}
                                        helperText={formErrors.carId?.[0]}
                                    />
                                )}
                            />
                            <Autocomplete
                                options={availability.drivers}
                                loading={availabilityLoading.drivers}
                                value={availability.drivers.find((driver) => driver.id === form.driverId) || null}
                                getOptionLabel={formatDriverLabel}
                                onChange={(_, value) => {
                                    handleFormChange('driverId', value?.id ?? '');
                                    addToAvailability('drivers', value);
                                }}
                                onInputChange={(_, value) => loadAvailability('drivers', value)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Driver"
                                        placeholder="Search available drivers"
                                        InputLabelProps={{ shrink: true }}
                                        required
                                        error={Boolean(formErrors.driverId)}
                                        helperText={formErrors.driverId?.[0]}
                                    />
                                )}
                            />
                        </Stack>

                        <Stack spacing={1}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Details
                            </Typography>
                            <TextField
                                type="number"
                                label="Price"
                                value={form.price}
                                onChange={(event) => handleFormChange('price', event.target.value)}
                                InputLabelProps={{ shrink: true }}
                                required
                                error={Boolean(formErrors.price)}
                                helperText={formErrors.price?.[0]}
                            />
                            <TextField
                                label="Note"
                                multiline
                                minRows={3}
                                value={form.note}
                                onChange={(event) => handleFormChange('note', event.target.value)}
                                InputLabelProps={{ shrink: true }}
                                helperText={formErrors.note?.[0] || 'Add any special instructions for this booking.'}
                                error={Boolean(formErrors.note)}
                            />
                        </Stack>

                        {formError && (
                            <Alert severity="error">{formError}</Alert>
                        )}
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
