import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    FormControlLabel,
    Grid,
    MenuItem,
    Stack,
    TextField,
    Typography,
    Checkbox,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TableContainer,
} from '@mui/material';
import UserLayout from '../components/UserLayout.jsx';
import {
    createUserBooking,
    fetchAvailableCars,
    fetchUserBookings,
    returnUserBooking,
} from '../services/user.js';
import { getUserSession } from '../services/session.js';

const STATUS_OPTIONS = [
    { value: '', label: 'All statuses' },
    { value: 'upcoming', label: 'Scheduled' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
];

const initialFilters = {
    status: '',
    from: '',
    to: '',
};

const initialBooking = {
    car_id: '',
    start_date: '',
    end_date: '',
    open_booking: false,
};

const formatDate = (value) => {
    if (!value) return '—';
    try {
        const date = new Date(value);
        return new Intl.DateTimeFormat('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(date);
    } catch (error) {
        return value;
    }
};

const statusTone = {
    upcoming: { label: 'Scheduled', color: '#f97316' },
    active: { label: 'Active', color: '#0ea5e9' },
    completed: { label: 'Completed', color: '#22c55e' },
};

const UserBookingsPage = () => {
    const session = useMemo(() => getUserSession(), []);
    const [filters, setFilters] = useState(initialFilters);
    const [bookings, setBookings] = useState([]);
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [returningId, setReturningId] = useState(null);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [bookingForm, setBookingForm] = useState(initialBooking);
    const [carsLoading, setCarsLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    const loadBookings = async (customFilters = filters) => {
        setLoading(true);
        setError('');
        try {
            const payload = await fetchUserBookings({
                ...customFilters,
                user_id: session?.user?.id,
            });
            setBookings(payload.bookings ?? payload ?? []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const buildAvailabilityParams = () => {
        if (!bookingForm.start_date) {
            return null;
        }

        const params = { start_date: bookingForm.start_date };
        if (!bookingForm.open_booking && bookingForm.end_date) {
            params.end_date = bookingForm.end_date;
        }

        return params;
    };

    const loadCars = async (range = null) => {
        const params = range ?? buildAvailabilityParams();
        if (!params) {
            setCars([]);
            return;
        }

        setCarsLoading(true);
        try {
            const payload = await fetchAvailableCars(params);
            setCars(payload.cars ?? payload ?? []);
        } catch (err) {
            setCars([]);
        } finally {
            setCarsLoading(false);
        }
    };

    useEffect(() => {
        loadBookings();
        loadCars();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!bookingForm.start_date) {
            setCars([]);
            return;
        }

        loadCars(buildAvailabilityParams());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookingForm.start_date, bookingForm.end_date, bookingForm.open_booking]);

    const handleFilterChange = (event) => {
        const { name, value } = event.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const applyFilters = (event) => {
        event.preventDefault();
        loadBookings();
    };

    const resetFilters = () => {
        setFilters(initialFilters);
        loadBookings(initialFilters);
    };

    const handleBookingChange = (event) => {
        const { name, value } = event.target;
        setBookingForm((prev) => {
            const next = { ...prev, [name]: value };
            if (name === 'start_date' || name === 'end_date') {
                next.car_id = '';
            }
            return next;
        });
    };

    const handleOpenToggle = (event) => {
        const checked = event.target.checked;
        setBookingForm((prev) => ({
            ...prev,
            car_id: '',
            open_booking: checked,
            end_date: checked ? '' : prev.end_date,
        }));
    };

    const submitBooking = async (event) => {
        event.preventDefault();
        setCreating(true);
        setError('');
        setMessage('');
        try {
            const payload = await createUserBooking({
                ...bookingForm,
                user_id: session?.user?.id,
                car_id: bookingForm.car_id ? Number(bookingForm.car_id) : null,
                end_date: bookingForm.open_booking ? null : bookingForm.end_date || null,
            });
            setMessage('Booking saved successfully.');
            setBookingForm(initialBooking);
            loadBookings();
            loadCars();
            return payload;
        } catch (err) {
            setError(err.message);
        } finally {
            setCreating(false);
        }
    };

    const openDialog = () => {
        setDialogOpen(true);
        setBookingForm(initialBooking);
        setMessage('');
        setError('');
    };

    const closeDialog = () => {
        setDialogOpen(false);
    };

    const closeBooking = async (bookingId) => {
        setReturningId(bookingId);
        setError('');
        setMessage('');
        try {
            await returnUserBooking(bookingId);
            setMessage('The booking was closed and the vehicle was returned.');
            loadBookings();
            loadCars();
        } catch (err) {
            setError(err.message);
        } finally {
            setReturningId(null);
        }
    };

    const actions = (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button variant="outlined" onClick={() => loadBookings()} disabled={loading}>
                Refresh log
            </Button>
            <Button variant="contained" onClick={openDialog}>
                New booking
            </Button>
        </Stack>
    );

    const carHelperText = !bookingForm.start_date
        ? 'Select a start date to display the available cars.'
        : carsLoading
            ? 'Updating the available cars…'
            : !cars.length
                ? 'No cars are available for the selected dates.'
                : '';

    return (
        <UserLayout
            title="My bookings"
            description="Create new bookings and monitor your open trips."
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
                                Match the admin filters with the same controls you already know.
                            </Typography>
                            <Stack component="form" spacing={2} onSubmit={applyFilters}>
                                <TextField
                                    select
                                    name="status"
                                    label="Status"
                                    value={filters.status}
                                    onChange={handleFilterChange}
                                    InputLabelProps={{ shrink: true }}
                                >
                                    {STATUS_OPTIONS.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <TextField
                                    name="from"
                                    label="From date"
                                    type="date"
                                    value={filters.from}
                                    onChange={handleFilterChange}
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    name="to"
                                    label="To date"
                                    type="date"
                                    value={filters.to}
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
                                        {bookings.length} bookings • Matching your filters
                                    </Typography>
                                </Box>
                                <Button variant="outlined" onClick={() => loadCars()} disabled={creating || carsLoading}>
                                    Refresh cars list
                                </Button>
                            </Stack>

                            <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Car</TableCell>
                                            <TableCell>Start</TableCell>
                                            <TableCell>End</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell align="right">Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center">
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
                                                <TableCell colSpan={5} align="center">
                                                    <Typography color="text.secondary" py={3}>
                                                        No bookings match your filters.
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            bookings.map((booking) => {
                                                const tone = statusTone[booking.status] ?? { label: booking.status, color: '#94a3b8' };
                                                return (
                                                    <TableRow key={booking.id}>
                                                        <TableCell>
                                                            <Typography fontWeight={600}>{booking.car?.name ?? '—'}</Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {booking.car?.model} • {booking.car?.number}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography>{formatDate(booking.start_date)}</Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography>{booking.open_booking ? 'Open booking' : formatDate(booking.end_date)}</Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={tone.label}
                                                                size="small"
                                                                sx={{
                                                                    color: tone.color,
                                                                    backgroundColor: `${tone.color}22`,
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
                                                                    disabled={returningId === booking.id}
                                                                >
                                                                    {returningId === booking.id ? 'Completing…' : 'Return vehicle'}
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
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm" component="form" onSubmit={submitBooking}>
                <DialogTitle>New booking</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2} mt={1}>
                        <TextField
                            select
                            name="car_id"
                            label="Choose a car"
                            value={bookingForm.car_id}
                            onChange={handleBookingChange}
                            required
                            helperText={carHelperText}
                            disabled={!bookingForm.start_date || carsLoading}
                            InputLabelProps={{ shrink: true }}
                        >
                            <MenuItem value="" disabled>
                                Pick an available vehicle
                            </MenuItem>
                            {carsLoading && (
                                <MenuItem value="" disabled>
                                    Loading cars…
                                </MenuItem>
                            )}
                            {!carsLoading && bookingForm.start_date && !cars.length && (
                                <MenuItem value="" disabled>
                                    No cars are available for this range
                                </MenuItem>
                            )}
                            {!carsLoading &&
                                cars.map((car) => (
                                    <MenuItem key={car.id} value={car.id}>
                                        {car.name} • {car.model}
                                    </MenuItem>
                                ))}
                        </TextField>
                        <TextField
                            name="start_date"
                            label="Start date"
                            type="datetime-local"
                            value={bookingForm.start_date}
                            onChange={handleBookingChange}
                            required
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            name="end_date"
                            label="End date"
                            type="datetime-local"
                            value={bookingForm.end_date}
                            onChange={handleBookingChange}
                            disabled={bookingForm.open_booking}
                            InputLabelProps={{ shrink: true }}
                        />
                        <FormControlLabel
                            control={<Checkbox checked={bookingForm.open_booking} onChange={handleOpenToggle} />}
                            label="Open trip without a return date"
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDialog}>Cancel</Button>
                    <Button type="submit" variant="contained" disabled={creating}>
                        {creating ? 'Creating booking…' : 'Confirm booking'}
                    </Button>
                </DialogActions>
            </Dialog>
        </UserLayout>
    );
};

export default UserBookingsPage;
