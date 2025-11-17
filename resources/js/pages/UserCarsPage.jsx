import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
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
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Typography,
    Switch,
} from '@mui/material';
import UserLayout from '../components/UserLayout.jsx';
import { createUserCar, fetchUserCars } from '../services/user.js';

const statusTone = {
    available: { bg: 'rgba(59,130,246,.12)', color: '#1d4ed8', label: 'Available' },
    booked: { bg: 'rgba(234,179,8,.18)', color: '#92400e', label: 'Booked' },
};

const activeTone = {
    true: { bg: 'rgba(16,185,129,.12)', color: '#0f766e', label: 'Enabled' },
    false: { bg: 'rgba(248,113,113,.12)', color: '#b91c1c', label: 'Disabled' },
};

const emirateOptions = [
    { value: 'dubai', label: 'Dubai' },
    { value: 'abu_dhabi', label: 'Abu Dhabi' },
    { value: 'sharjah', label: 'Sharjah' },
    { value: 'ajman', label: 'Ajman' },
    { value: 'umm_al_quwain', label: 'Umm Al Quwain' },
    { value: 'ras_al_khaimah', label: 'Ras Al Khaimah' },
    { value: 'fujairah', label: 'Fujairah' },
];

const getEmirateLabel = (value) => emirateOptions.find((option) => option.value === value)?.label ?? value;

const badge = ({ bg, color, label }) => (
    <Chip
        label={label}
        size="small"
        sx={{ backgroundColor: bg, color, fontWeight: 600, mr: 1 }}
    />
);

const UserCarsPage = () => {
    const [cars, setCars] = useState([]);
    const [meta, setMeta] = useState({ total: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [availabilityFilter, setAvailabilityFilter] = useState('all');
    const [activeFilter, setActiveFilter] = useState('all');
    const [pagination, setPagination] = useState({ page: 0, pageSize: 10 });
    const [formOpen, setFormOpen] = useState(false);
    const [formError, setFormError] = useState('');
    const [formErrors, setFormErrors] = useState({});
    const [formValues, setFormValues] = useState({
        name: '',
        model: '',
        color: '',
        number: '',
        emirate: 'dubai',
        notes: '',
        is_active: true,
    });
    const [saving, setSaving] = useState(false);

    const totalRecords = meta?.total ?? 0;

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const payload = await fetchUserCars({
                page: pagination.page + 1,
                per_page: pagination.pageSize,
                search: search || undefined,
                status: availabilityFilter !== 'all' ? availabilityFilter : undefined,
                is_active:
                    activeFilter === 'all'
                        ? undefined
                        : activeFilter === 'enabled'
                            ? true
                            : false,
            });
            setCars(payload.cars ?? []);
            setMeta(payload.meta ?? {});
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [activeFilter, availabilityFilter, pagination, search]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        const handler = setTimeout(() => setSearch(searchInput.trim()), 400);
        return () => clearTimeout(handler);
    }, [searchInput]);

    useEffect(() => {
        setPagination((prev) => ({ ...prev, page: 0 }));
    }, [search, availabilityFilter, activeFilter]);

    const visibleRange = useMemo(() => {
        const from = totalRecords === 0 ? 0 : pagination.page * pagination.pageSize + 1;
        const to = Math.min(totalRecords, (pagination.page + 1) * pagination.pageSize);
        return { from, to };
    }, [pagination.page, pagination.pageSize, totalRecords]);

    const handlePageChange = (_event, newPage) => {
        setPagination((prev) => ({ ...prev, page: newPage }));
    };

    const handleRowsPerPageChange = (event) => {
        setPagination({ page: 0, pageSize: parseInt(event.target.value, 10) });
    };

    const openCreateForm = () => {
        setFormValues({ name: '', model: '', color: '', number: '', emirate: 'dubai', notes: '', is_active: true });
        setFormError('');
        setFormErrors({});
        setFormOpen(true);
    };

    const handleFormChange = (field) => (event) => {
        const value = field === 'is_active' ? event.target.checked : event.target.value;
        setFormValues((prev) => ({ ...prev, [field]: value }));
        setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const validateForm = useCallback(() => {
        const errors = {};

        if (!formValues.name.trim()) {
            errors.name = ['Vehicle name is required.'];
        }

        if (!formValues.model.trim()) {
            errors.model = ['Model is required.'];
        }

        if (!formValues.color.trim()) {
            errors.color = ['Color is required.'];
        }

        if (!formValues.number.trim()) {
            errors.number = ['Plate number is required.'];
        }

        if (!formValues.emirate) {
            errors.emirate = ['Select the vehicle emirate.'];
        }

        return errors;
    }, [formValues]);

    const handleFormSubmit = async () => {
        const errors = validateForm();
        if (Object.keys(errors).length) {
            setFormErrors(errors);
            setFormError('Please correct the highlighted fields.');
            return;
        }

        setSaving(true);
        setFormError('');
        setFormErrors({});

        try {
            await createUserCar(formValues);
            setFormOpen(false);
            await load();
        } catch (err) {
            setFormError(err.message);

            if (err?.response?.data?.data) {
                setFormErrors(err.response.data.data);
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <UserLayout
            title="Your vehicles"
            description="See the cars assigned to your account and add more to the fleet."
            actions={
                <Stack direction="row" spacing={1}>
                    <Button variant="contained" onClick={openCreateForm}>
                        Add vehicle
                    </Button>
                </Stack>
            }
        >
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
                <CardContent>
                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={2}
                        mb={3}
                        justifyContent="space-between"
                        alignItems={{ xs: 'flex-start', md: 'center' }}
                    >
                        <Box>
                            <Typography variant="h6" fontWeight={600}>
                                Fleet roster
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {totalRecords} vehicles · Showing {visibleRange.from} - {visibleRange.to}
                            </Typography>
                        </Box>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} width={{ xs: '100%', md: 'auto' }}>
                            <TextField
                                value={searchInput}
                                onChange={(event) => setSearchInput(event.target.value)}
                                placeholder="Search name, model, or plate number"
                                size="small"
                                sx={{ minWidth: { xs: '100%', md: 260 } }}
                            />
                            <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 180 } }}>
                                <InputLabel id="car-availability-filter">Availability</InputLabel>
                                <Select
                                    labelId="car-availability-filter"
                                    label="Availability"
                                    value={availabilityFilter}
                                    onChange={(event) => setAvailabilityFilter(event.target.value)}
                                >
                                    <MenuItem value="all">All vehicles</MenuItem>
                                    <MenuItem value="available">Available</MenuItem>
                                    <MenuItem value="booked">Booked</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 160 } }}>
                                <InputLabel id="car-active-filter">Status</InputLabel>
                                <Select
                                    labelId="car-active-filter"
                                    label="Status"
                                    value={activeFilter}
                                    onChange={(event) => setActiveFilter(event.target.value)}
                                >
                                    <MenuItem value="all">Active + disabled</MenuItem>
                                    <MenuItem value="enabled">Enabled only</MenuItem>
                                    <MenuItem value="disabled">Disabled only</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>
                    </Stack>

                    <Box sx={{ borderRadius: 2, border: '1px solid #e2e8f0', overflowX: 'auto' }}>
                        <Table sx={{ minWidth: 650 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Model</TableCell>
                                    <TableCell>Color</TableCell>
                                    <TableCell>Number</TableCell>
                                    <TableCell>Emirate</TableCell>
                                    <TableCell>Notes</TableCell>
                                    <TableCell>Statuses</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center">
                                            <Stack alignItems="center" py={3} spacing={1}>
                                                <CircularProgress size={24} />
                                                <Typography variant="body2" color="text.secondary">
                                                    Loading cars…
                                                </Typography>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ) : cars.length ? (
                                    cars.map((car) => (
                                        <TableRow key={car.id} hover>
                                            <TableCell>{car.name}</TableCell>
                                            <TableCell>{car.model}</TableCell>
                                            <TableCell>{car.color}</TableCell>
                                            <TableCell>
                                                <Typography fontWeight={600}>{car.number}</Typography>
                                            </TableCell>
                                            <TableCell>{getEmirateLabel(car.emirate)}</TableCell>
                                            <TableCell sx={{ maxWidth: 240 }}>
                                                <Typography variant="body2" color="text.secondary" noWrap>
                                                    {car.notes || '—'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {badge(statusTone[car.status] ?? statusTone.available)}
                                                {badge(activeTone[car.is_active] ?? activeTone.true)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center">
                                            <Typography variant="body2" color="text.secondary">
                                                No vehicles match the current filters.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        <TablePagination
                            component="div"
                            count={totalRecords}
                            page={pagination.page}
                            onPageChange={handlePageChange}
                            rowsPerPage={pagination.pageSize}
                            onRowsPerPageChange={handleRowsPerPageChange}
                            rowsPerPageOptions={[10, 20, 50]}
                            showFirstButton
                            showLastButton
                        />
                    </Box>
                </CardContent>
            </Card>

            <Dialog open={formOpen} onClose={() => setFormOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Add new vehicle</DialogTitle>
                <DialogContent dividers sx={{ pt: 1 }}>
                    {formError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {formError}
                        </Alert>
                    )}
                    <Stack spacing={2} mt={1}>
                        <TextField
                            label="Name"
                            value={formValues.name}
                            onChange={handleFormChange('name')}
                            fullWidth
                            required
                            error={!!formErrors.name}
                            helperText={formErrors.name?.[0] || formErrors.name}
                        />
                        <TextField
                            label="Model"
                            value={formValues.model}
                            onChange={handleFormChange('model')}
                            fullWidth
                            required
                            error={!!formErrors.model}
                            helperText={formErrors.model?.[0] || formErrors.model}
                        />
                        <TextField
                            label="Color"
                            value={formValues.color}
                            onChange={handleFormChange('color')}
                            fullWidth
                            required
                            error={!!formErrors.color}
                            helperText={formErrors.color?.[0] || formErrors.color}
                        />
                        <TextField
                            label="Number"
                            value={formValues.number}
                            onChange={handleFormChange('number')}
                            fullWidth
                            required
                            error={!!formErrors.number}
                            helperText={formErrors.number?.[0] || formErrors.number}
                        />
                        <FormControl fullWidth error={!!formErrors.emirate}>
                            <InputLabel id="car-emirate-select">Emirate</InputLabel>
                            <Select
                                labelId="car-emirate-select"
                                label="Emirate"
                                value={formValues.emirate}
                                onChange={handleFormChange('emirate')}
                                required
                            >
                                {emirateOptions.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                            {formErrors.emirate && (
                                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1 }}>
                                    {formErrors.emirate?.[0] || formErrors.emirate}
                                </Typography>
                            )}
                        </FormControl>
                        <TextField
                            label="Notes"
                            value={formValues.notes}
                            onChange={handleFormChange('notes')}
                            fullWidth
                            multiline
                            minRows={2}
                            error={!!formErrors.notes}
                            helperText={formErrors.notes?.[0] || formErrors.notes}
                        />
                        <FormControlLabel
                            control={<Switch checked={!!formValues.is_active} onChange={handleFormChange('is_active')} />}
                            label="Vehicle is active"
                        />
                    </Stack>
                </DialogContent>
                <DialogActions dividers>
                    <Button onClick={() => setFormOpen(false)} disabled={saving}>
                        Cancel
                    </Button>
                    <Button variant="contained" onClick={handleFormSubmit} disabled={saving}>
                        Add vehicle
                    </Button>
                </DialogActions>
            </Dialog>
        </UserLayout>
    );
};

export default UserCarsPage;
