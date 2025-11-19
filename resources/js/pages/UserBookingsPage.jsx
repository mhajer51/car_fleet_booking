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
    MenuItem,
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
import Checkbox from '@mui/material/Checkbox';
import UserLayout from '../components/UserLayout.jsx';
import {
    createUserBooking,
    updateUserBooking,
    fetchAvailableBookingCars,
    fetchAvailableBookingDrivers,
    fetchUserBookings,
    fetchUserCars,
    fetchUserDrivers,
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

const toLocalInputValue = (value) => {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());

    return date.toISOString().slice(0, 16);
};

const formatCarLabel = (car) => {
    if (!car) {
        return '';
    }

    const primary = car.name || car.number || '';
    const secondary = car.number && car.number !== primary ? car.number : null;

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

const initialForm = {
    carId: '',
    driverId: '',
    price: '',
    startDate: defaultStartDate(),
    endDate: '',
    openBooking: false,
    note: '',
};

const UserBookingsPage = () => {
    const session = useMemo(() => getUserSession(), []);

    const [bookings, setBookings] = useState([]);
    const [meta, setMeta] = useState({ total: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [filters, setFilters] = useState({
        status: 'all',
        from_date: '',
        to_date: '',
        car_id: '',
        driver_id: '',
    });
    const [pagination, setPagination] = useState({ page: 0, pageSize: 10 });
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingBooking, setEditingBooking] = useState(null);
    const isEditing = Boolean(editingBooking);
    const [form, setForm] = useState(initialForm);
    const [formError, setFormError] = useState('');
    const [formErrors, setFormErrors] = useState({});
    const [creating, setCreating] = useState(false);
    const [availability, setAvailability] = useState({ cars: [], drivers: [] });
    const [availabilityLoading, setAvailabilityLoading] = useState({ cars: false, drivers: false });
    const [cars, setCars] = useState([]);
    const [drivers, setDrivers] = useState([]);

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
                car_id: filters.car_id || undefined,
                driver_id: filters.driver_id || undefined,
                user_id: session?.user?.id,
            });
            setBookings(payload.bookings ?? []);
            setMeta(payload.meta ?? {});
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [filters.car_id, filters.driver_id, filters.from_date, filters.status, filters.to_date, pagination.page, pagination.pageSize, session?.user?.id]);

    const loadLookups = useCallback(async () => {
        try {
            const [carsPayload, driversPayload] = await Promise.all([
                fetchUserCars({ per_page: 100 }),
                fetchUserDrivers({ per_page: 100 }),
            ]);
            setCars(carsPayload.cars ?? []);
            setDrivers(driversPayload.drivers ?? []);
        } catch (err) {
            setError(err.message);
        }
    }, []);

    useEffect(() => {
        loadBookings();
    }, [loadBookings]);

    useEffect(() => {
        loadLookups();
    }, [loadLookups]);

    useEffect(() => {
        setPagination((prev) => ({ ...prev, page: 0 }));
    }, [filters.status, filters.from_date, filters.to_date, filters.car_id, filters.driver_id]);

    const visibleRange = useMemo(() => {
        const from = totalRecords === 0 ? 0 : pagination.page * pagination.pageSize + 1;
        const to = Math.min(totalRecords, (pagination.page + 1) * pagination.pageSize);
        return { from, to };
    }, [pagination.page, pagination.pageSize, totalRecords]);

    const selectedCar = useMemo(() => {
        if (!filters.car_id) {
            return null;
        }
        const id = Number(filters.car_id);
        return cars.find((car) => car.id === id) ?? null;
    }, [filters.car_id, cars]);

    const selectedDriver = useMemo(() => {
        if (!filters.driver_id) {
            return null;
        }
        const id = Number(filters.driver_id);
        return drivers.find((driver) => driver.id === id) ?? null;
    }, [drivers, filters.driver_id]);

    const handlePaginationChange = (_event, newPage) => {
        setPagination((prev) => ({ ...prev, page: newPage }));
    };

    const handleRowsPerPageChange = (event) => {
        setPagination({ page: 0, pageSize: parseInt(event.target.value, 10) });
    };

    const updateFilter = (field, value) => {
        setFilters((prev) => ({ ...prev, [field]: value }));
    };

    const openDialog = () => {
        setDialogOpen(true);
        setForm(initialForm);
        setFormError('');
        setFormErrors({});
        setEditingBooking(null);
    };

    const closeDialog = () => {
        setDialogOpen(false);
        setFormError('');
        setFormErrors({});
        setEditingBooking(null);
    };

    const handleFormChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    };

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

    const openEditDialog = (booking) => {
        setEditingBooking(booking);
        setForm({
            carId: booking.car?.id ?? '',
            driverId: booking.driver?.id ?? '',
            price: booking.price ?? '',
            startDate: toLocalInputValue(booking.start_date),
            endDate: booking.end_date ? toLocalInputValue(booking.end_date) : '',
            openBooking: booking.open_booking,
            note: booking.note ?? '',
        });
        addToAvailability('cars', booking.car);
        addToAvailability('drivers', booking.driver);
        setFormError('');
        setFormErrors({});
        setDialogOpen(true);
    };

    const buildAvailabilityParams = useCallback(() => {
        const params = {
            start_date: form.startDate,
            end_date: form.openBooking ? null : form.endDate || null,
            per_page: 50,
            booking_id: editingBooking?.id,
        };

        return params;
    }, [editingBooking?.id, form.endDate, form.openBooking, form.startDate]);

    const loadAvailability = useCallback(
        async (resource) => {
            if (!form.startDate) {
                return;
            }

            setAvailabilityLoading((prev) => ({ ...prev, [resource]: true }));
            setFormError('');
            try {
                const params = buildAvailabilityParams();
                const payload = await (resource === 'cars'
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

        loadAvailability('cars');
        loadAvailability('drivers');
    }, [dialogOpen, loadAvailability]);

    const validateForm = useCallback(() => {
        const errors = {};

        const priceValue = Number(form.price);
        if (Number.isNaN(priceValue) || priceValue < 0) {
            errors.price = ['Price must be a positive number.'];
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
    }, [form.carId, form.driverId, form.endDate, form.openBooking, form.price, form.startDate]);

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
            user_id: session?.user?.id,
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
            if (isEditing) {
                await updateUserBooking(editingBooking.id, payload);
                setMessage('Booking updated successfully.');
            } else {
                await createUserBooking(payload);
                setMessage('Booking created successfully.');
            }
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
            description="Book new trips and review your personal reservation history."
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
                                    label="Status"
                                    value={filters.status}
                                    onChange={(event) => updateFilter('status', event.target.value)}
                                    fullWidth
                                >
                                    {STATUS_OPTIONS.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            <Grid item xs={12} md={3}>
                                <Autocomplete
                                    options={cars}
                                    value={selectedCar}
                                    onChange={(_event, value) => updateFilter('car_id', value?.id ?? '')}
                                    getOptionLabel={formatCarLabel}
                                    isOptionEqualToValue={(option, value) => option?.id === value?.id}
                                    renderInput={(params) => <TextField {...params} label="Car" placeholder="Any" />}
                                />
                            </Grid>

                            <Grid item xs={12} md={3}>
                                <Autocomplete
                                    options={drivers}
                                    value={selectedDriver}
                                    onChange={(_event, value) => updateFilter('driver_id', value?.id ?? '')}
                                    getOptionLabel={formatDriverLabel}
                                    isOptionEqualToValue={(option, value) => option?.id === value?.id}
                                    renderInput={(params) => <TextField {...params} label="Driver" placeholder="Any" />}
                                />
                            </Grid>

                            <Grid item xs={12} md={3}>
                                <TextField
                                    label="From date"
                                    type="date"
                                    InputLabelProps={{ shrink: true }}
                                    fullWidth
                                    value={filters.from_date}
                                    onChange={(event) => updateFilter('from_date', event.target.value)}
                                />
                            </Grid>

                            <Grid item xs={12} md={3}>
                                <TextField
                                    label="To date"
                                    type="date"
                                    InputLabelProps={{ shrink: true }}
                                    fullWidth
                                    value={filters.to_date}
                                    onChange={(event) => updateFilter('to_date', event.target.value)}
                                />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
                    <CardContent>
                        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} mb={3}>
                            <Box>
                                <Typography variant="h6" fontWeight={700}>
                                    Your bookings
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Showing {visibleRange.from}–{visibleRange.to} of {totalRecords} bookings.
                                </Typography>
                            </Box>
                        </Stack>

                        <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflowX: 'auto' }}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>ID</TableCell>
                                        <TableCell>Car</TableCell>
                                        <TableCell>Driver</TableCell>
                                        <TableCell>Price</TableCell>
                                        <TableCell>Start</TableCell>
                                        <TableCell>End</TableCell>
                                        <TableCell>Notes</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={9} align="center">
                                                <Stack alignItems="center" py={4} spacing={1}>
                                                    <CircularProgress size={24} />
                                                    <Typography variant="body2" color="text.secondary">
                                                        Loading bookings…
                                                    </Typography>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ) : bookings.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} align="center">
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
                                                <TableRow key={booking.id}>
                                                    <TableCell>#{booking.id}</TableCell>
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
                                                    <TableCell>
                                                        <Button size="small" variant="outlined" onClick={() => openEditDialog(booking)}>
                                                            Edit
                                                        </Button>
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

            <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm" component="form" onSubmit={submitBooking}>
                <DialogTitle>{isEditing ? 'Edit booking' : 'New booking'}</DialogTitle>
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
                                        || (form.openBooking
                                            ? 'Open bookings have no end date.'
                                            : 'Specify an optional return time')
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
                                Vehicle & driver
                            </Typography>

                            <Autocomplete
                                options={availability.cars}
                                value={availability.cars.find((car) => car.id === Number(form.carId)) ?? null}
                                onChange={(_event, value) => handleFormChange('carId', value?.id ?? '')}
                                getOptionLabel={formatCarLabel}
                                loading={availabilityLoading.cars}
                                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Car"
                                        required
                                        placeholder="Search by car name or number"
                                        error={Boolean(formErrors.carId)}
                                        helperText={formErrors.carId?.[0]}
                                    />
                                )}
                            />

                            <Autocomplete
                                options={availability.drivers}
                                value={availability.drivers.find((driver) => driver.id === Number(form.driverId)) ?? null}
                                onChange={(_event, value) => handleFormChange('driverId', value?.id ?? '')}
                                getOptionLabel={formatDriverLabel}
                                loading={availabilityLoading.drivers}
                                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Driver"
                                        required
                                        placeholder="Search by driver name or license number"
                                        error={Boolean(formErrors.driverId)}
                                        helperText={formErrors.driverId?.[0]}
                                    />
                                )}
                            />
                        </Stack>

                        <Stack spacing={1}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Pricing & Notes
                            </Typography>
                            <TextField
                                type="number"
                                label="Price"
                                value={form.price}
                                onChange={(event) => handleFormChange('price', event.target.value)}
                                inputProps={{ min: 0, step: 0.01 }}
                                error={Boolean(formErrors.price)}
                                helperText={formErrors.price?.[0] ?? 'Enter the booking cost (e.g., 120.00)'}
                            />
                            <TextField
                                label="Notes"
                                value={form.note}
                                onChange={(event) => handleFormChange('note', event.target.value)}
                                multiline
                                minRows={2}
                                maxRows={5}
                                placeholder="Additional instructions or context"
                                error={Boolean(formErrors.note)}
                                helperText={formErrors.note?.[0]}
                            />
                        </Stack>

                        <Alert severity="info">
                            Booking will be created for <strong>{session?.user?.name ?? 'your account'}</strong>. Changing the
                            user or creating guest bookings is not allowed.
                        </Alert>

                        {formError && <Alert severity="error">{formError}</Alert>}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDialog}>Cancel</Button>
                    <Button type="submit" variant="contained" disabled={creating}>
                        {creating ? (isEditing ? 'Saving…' : 'Creating…') : isEditing ? 'Save changes' : 'Confirm booking'}
                    </Button>
                </DialogActions>
            </Dialog>
        </UserLayout>
    );
};

export default UserBookingsPage;
