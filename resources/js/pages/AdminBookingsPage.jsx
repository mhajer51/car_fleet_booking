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
    MenuItem,
    Radio,
    RadioGroup,
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
import AdminLayout from '../components/AdminLayout.jsx';
import { createAdminBooking, fetchAdminBookings, fetchAdminCars, fetchAdminUsers } from '../services/admin.js';

const STATUS_OPTIONS = [
    { label: 'All statuses', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Closed', value: 'closed' },
    { label: 'Cancelled', value: 'cancelled' },
];

const statusTone = {
    active: { label: 'Active', color: '#0f766e', bg: 'rgba(16,185,129,.12)' },
    closed: { label: 'Closed', color: '#1d4ed8', bg: 'rgba(59,130,246,.12)' },
    cancelled: { label: 'Cancelled', color: '#b91c1c', bg: 'rgba(248,113,113,.12)' },
};

const initialForm = {
    mode: 'existing',
    userId: '',
    guestName: '',
    carId: '',
    startDate: '',
    endDate: '',
    openBooking: false,
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

const AdminBookingsPage = () => {
    const [bookings, setBookings] = useState([]);
    const [meta, setMeta] = useState({ total: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [filters, setFilters] = useState({ status: 'all', from_date: '', to_date: '', user_id: '', car_id: '' });
    const [pagination, setPagination] = useState({ page: 0, pageSize: 10 });
    const [dialogOpen, setDialogOpen] = useState(false);
    const [form, setForm] = useState(initialForm);
    const [formError, setFormError] = useState('');
    const [creating, setCreating] = useState(false);
    const [lookupsLoading, setLookupsLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [cars, setCars] = useState([]);

    const totalRecords = meta?.total ?? bookings.length ?? 0;

    const loadBookings = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const payload = await fetchAdminBookings({
                page: pagination.page + 1,
                per_page: pagination.pageSize,
                status: filters.status !== 'all' ? filters.status : undefined,
                from_date: filters.from_date || undefined,
                to_date: filters.to_date || undefined,
                user_id: filters.user_id || undefined,
                car_id: filters.car_id || undefined,
            });
            setBookings(payload.bookings ?? []);
            setMeta(payload.meta ?? {});
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.page, pagination.pageSize]);

    const loadLookups = useCallback(async () => {
        setLookupsLoading(true);
        try {
            const [usersPayload, carsPayload] = await Promise.all([
                fetchAdminUsers({ per_page: 100, status: 'active' }),
                fetchAdminCars({ per_page: 100 }),
            ]);
            setUsers(usersPayload.users ?? []);
            setCars(carsPayload.cars ?? []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLookupsLoading(false);
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
    }, [filters.status, filters.from_date, filters.to_date, filters.user_id, filters.car_id]);

    const visibleRange = useMemo(() => {
        const from = totalRecords === 0 ? 0 : pagination.page * pagination.pageSize + 1;
        const to = Math.min(totalRecords, (pagination.page + 1) * pagination.pageSize);
        return { from, to };
    }, [pagination.page, pagination.pageSize, totalRecords]);

    const selectedUser = useMemo(() => {
        if (!filters.user_id) {
            return null;
        }
        const id = Number(filters.user_id);
        return users.find((user) => user.id === id) ?? null;
    }, [filters.user_id, users]);

    const selectedCar = useMemo(() => {
        if (!filters.car_id) {
            return null;
        }
        const id = Number(filters.car_id);
        return cars.find((car) => car.id === id) ?? null;
    }, [filters.car_id, cars]);

    const handlePaginationChange = (_event, newPage) => {
        setPagination((prev) => ({ ...prev, page: newPage }));
    };

    const handleRowsPerPageChange = (event) => {
        setPagination({ page: 0, pageSize: parseInt(event.target.value, 10) });
    };

    const updateFilter = (field, value) => {
        setFilters((prev) => ({ ...prev, [field]: value }));
    };

    const resetFilters = () => {
        setFilters({ status: 'all', from_date: '', to_date: '', user_id: '', car_id: '' });
    };

    const openDialog = () => {
        setDialogOpen(true);
        setForm(initialForm);
        setFormError('');
        setMessage('');
    };

    const closeDialog = () => {
        setDialogOpen(false);
        setForm(initialForm);
        setFormError('');
    };

    const handleFormChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const submitBooking = async (event) => {
        event.preventDefault();
        setFormError('');
        setMessage('');

        if (form.mode === 'existing' && !form.userId) {
            setFormError('Please choose a user for this booking.');
            return;
        }

        if (form.mode === 'guest' && !form.guestName.trim()) {
            setFormError('Please enter the guest name.');
            return;
        }

        if (!form.carId) {
            setFormError('Please choose a car before continuing.');
            return;
        }

        if (!form.startDate) {
            setFormError('Please set the booking start date.');
            return;
        }

        const payload = {
            car_id: Number(form.carId),
            start_date: form.startDate,
            end_date: form.openBooking ? null : form.endDate || null,
            open_booking: form.openBooking,
        };

        if (form.mode === 'existing') {
            payload.user_id = Number(form.userId);
        } else {
            payload.guest_name = form.guestName.trim();
        }

        setCreating(true);
        try {
            await createAdminBooking(payload);
            setMessage('Booking created successfully.');
            closeDialog();
            loadBookings();
        } catch (err) {
            setFormError(err.message);
        } finally {
            setCreating(false);
        }
    };

    const actions = (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button variant="outlined" onClick={loadBookings} disabled={loading}>
                Refresh
            </Button>
            <Button variant="contained" onClick={openDialog}>
                New Booking
            </Button>
        </Stack>
    );

    return (
        <AdminLayout
            title="Bookings"
            description="Review reservation history, filter quickly, and confirm new trips."
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
                    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight={700} gutterBottom>
                                Filters
                            </Typography>
                            <Stack spacing={2}>
                                <TextField
                                    select
                                    label="Booking status"
                                    value={filters.status}
                                    onChange={(event) => updateFilter('status', event.target.value)}
                                >
                                    {STATUS_OPTIONS.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <Autocomplete
                                    options={users}
                                    value={selectedUser}
                                    onChange={(_event, value) => updateFilter('user_id', value?.id ?? '')}
                                    getOptionLabel={(option) => option?.name ?? ''}
                                    loading={lookupsLoading}
                                    renderInput={(params) => (
                                        <TextField {...params} label="User" placeholder="Search by name" />
                                    )}
                                />
                                <Autocomplete
                                    options={cars}
                                    value={selectedCar}
                                    onChange={(_event, value) => updateFilter('car_id', value?.id ?? '')}
                                    getOptionLabel={(option) => option?.name ?? ''}
                                    loading={lookupsLoading}
                                    renderInput={(params) => (
                                        <TextField {...params} label="Car" placeholder="Search by name" />
                                    )}
                                />
                                <TextField
                                    label="From date"
                                    type="date"
                                    InputLabelProps={{ shrink: true }}
                                    value={filters.from_date}
                                    onChange={(event) => updateFilter('from_date', event.target.value)}
                                />
                                <TextField
                                    label="To date"
                                    type="date"
                                    InputLabelProps={{ shrink: true }}
                                    value={filters.to_date}
                                    onChange={(event) => updateFilter('to_date', event.target.value)}
                                />
                                <Stack direction="row" spacing={2}>
                                    <Button variant="contained" fullWidth onClick={loadBookings} disabled={loading}>
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
                                        Bookings table
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {totalRecords} bookings • Showing {visibleRange.from} - {visibleRange.to}
                                    </Typography>
                                </Box>
                            </Stack>

                            <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflowX: 'auto' }}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>ID</TableCell>
                                            <TableCell>User</TableCell>
                                            <TableCell>Car</TableCell>
                                            <TableCell>Start</TableCell>
                                            <TableCell>End</TableCell>
                                            <TableCell>Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center">
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
                                                <TableCell colSpan={6} align="center">
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
                                                        <TableCell>{formatDate(booking.start_date)}</TableCell>
                                                        <TableCell>{formatDate(booking.end_date)}</TableCell>
                                                        <TableCell>
                                                            <Chip label={tone.label} size="small" sx={{ backgroundColor: tone.bg, color: tone.color, fontWeight: 600 }} />
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
                </Grid>
            </Grid>

            <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm" component="form" onSubmit={submitBooking}>
                <DialogTitle>New booking</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={3} mt={1}>
                        <Stack spacing={1}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Customer type
                            </Typography>
                            <RadioGroup
                                row
                                value={form.mode}
                                onChange={(event) => handleFormChange('mode', event.target.value)}
                            >
                                <FormControlLabel value="existing" control={<Radio />} label="Existing user" />
                                <FormControlLabel value="guest" control={<Radio />} label="Guest" />
                            </RadioGroup>
                        </Stack>

                        {form.mode === 'existing' ? (
                            <Autocomplete
                                options={users}
                                value={users.find((user) => user.id === Number(form.userId)) ?? null}
                                onChange={(_event, value) => handleFormChange('userId', value?.id ?? '')}
                                getOptionLabel={(option) => option?.name ?? ''}
                                renderInput={(params) => <TextField {...params} label="User" required />}
                            />
                        ) : (
                            <TextField
                                label="Guest name"
                                value={form.guestName}
                                onChange={(event) => handleFormChange('guestName', event.target.value)}
                                required
                            />
                        )}

                        <TextField
                            select
                            label="Car"
                            value={form.carId}
                            onChange={(event) => handleFormChange('carId', event.target.value)}
                            required
                        >
                            <MenuItem value="" disabled>
                                Select a car
                            </MenuItem>
                            {cars.map((car) => (
                                <MenuItem key={car.id} value={car.id}>
                                    {car.name} • {car.number}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            type="datetime-local"
                            label="Start date"
                            value={form.startDate}
                            onChange={(event) => handleFormChange('startDate', event.target.value)}
                            InputLabelProps={{ shrink: true }}
                            required
                        />

                        <TextField
                            type="datetime-local"
                            label="End date"
                            value={form.endDate}
                            onChange={(event) => handleFormChange('endDate', event.target.value)}
                            InputLabelProps={{ shrink: true }}
                            disabled={form.openBooking}
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

                        {formError && (
                            <Alert severity="error">{formError}</Alert>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDialog}>Cancel</Button>
                    <Button type="submit" variant="contained" disabled={creating}>
                        {creating ? 'Creating…' : 'Confirm booking'}
                    </Button>
                </DialogActions>
            </Dialog>
        </AdminLayout>
    );
};

export default AdminBookingsPage;
