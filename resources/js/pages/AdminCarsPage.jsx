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
    Switch, IconButton,
} from '@mui/material';
import AdminLayout from '../components/AdminLayout.jsx';
import {
    createAdminCar,
    deleteAdminCar,
    fetchAdminCars,
    updateAdminCar,
    updateAdminCarStatus,
} from '../services/admin.js';
import EditOutlinedIcon from "../components/icons/EditOutlinedIcon.jsx";
import DeleteOutlineIcon from "../components/icons/DeleteOutlineIcon.jsx";

const statusTone = {
    available: { bg: 'rgba(59,130,246,.12)', color: '#1d4ed8', label: 'Available' },
    booked: { bg: 'rgba(234,179,8,.18)', color: '#92400e', label: 'Booked' },
};

const activeTone = {
    true: { bg: 'rgba(16,185,129,.12)', color: '#0f766e', label: 'Enabled' },
    false: { bg: 'rgba(248,113,113,.12)', color: '#b91c1c', label: 'Disabled' },
};

const badge = ({ bg, color, label }) => (
    <Chip
        label={label}
        size="small"
        sx={{ backgroundColor: bg, color, fontWeight: 600, mr: 1 }}
    />
);

const AdminCarsPage = () => {
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
    const [formMode, setFormMode] = useState('create');
    const [formError, setFormError] = useState('');
    const [formValues, setFormValues] = useState({
        id: null,
        name: '',
        model: '',
        color: '',
        number: '',
        is_active: true,
    });
    const [saving, setSaving] = useState(false);
    const [statusUpdatingId, setStatusUpdatingId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const totalRecords = meta?.total ?? 0;

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const payload = await fetchAdminCars({
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
        setFormMode('create');
        setFormValues({ id: null, name: '', model: '', color: '', number: '', is_active: true });
        setFormError('');
        setFormOpen(true);
    };

    const openEditForm = (car) => {
        setFormMode('edit');
        setFormValues(car);
        setFormError('');
        setFormOpen(true);
    };

    const handleFormChange = (field) => (event) => {
        const value = field === 'is_active' ? event.target.checked : event.target.value;
        setFormValues((prev) => ({ ...prev, [field]: value }));
    };

    const handleFormSubmit = async () => {
        setSaving(true);
        setFormError('');

        try {
            if (formMode === 'create') {
                await createAdminCar(formValues);
            } else {
                await updateAdminCar(formValues.id, formValues);
            }

            setFormOpen(false);
            await load();
        } catch (err) {
            setFormError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleStatusToggle = async (car) => {
        setStatusUpdatingId(car.id);
        try {
            await updateAdminCarStatus(car.id, { is_active: !car.is_active });
            await load();
        } catch (err) {
            setError(err.message);
        } finally {
            setStatusUpdatingId(null);
        }
    };

    const confirmDelete = (car) => {
        setDeleteTarget(car);
        setDeleting(false);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        setDeleting(true);
        try {
            await deleteAdminCar(deleteTarget.id);
            setDeleteTarget(null);
            await load();
        } catch (err) {
            setError(err.message);
            setDeleting(false);
        }
    };

    return (
        <AdminLayout
            title="Garage overview"
            description="Every vehicle with its availability, trim, and booking status."
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
                                    <TableCell>Statuses</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">
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
                                            <TableCell>
                                                {badge(statusTone[car.status] ?? statusTone.available)}
                                                {badge(activeTone[car.is_active] ?? activeTone.true)}
                                                <FormControlLabel
                                                    control={(
                                                        <Switch
                                                            color="primary"
                                                            checked={!!car.is_active}
                                                            onChange={() => handleStatusToggle(car)}
                                                            size="small"
                                                            disabled={statusUpdatingId === car.id}
                                                        />
                                                    )}
                                                    label={car.is_active ? 'Disable' : 'Enable'}
                                                    sx={{ ml: 1 }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                                                    <IconButton
                                                        color="primary"
                                                        size="small"
                                                        onClick={() => openEditForm(car)}
                                                        aria-label={`Edit ${car.name}`}
                                                    >
                                                        <EditOutlinedIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        color="error"
                                                        size="small"
                                                        onClick={() => confirmDelete(car)}
                                                        aria-label={`Disable ${car.name}`}
                                                    >
                                                        <DeleteOutlineIcon fontSize="small" />
                                                    </IconButton>
                                                </Stack>
                                            </TableCell>

                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">
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
                <DialogTitle>{formMode === 'create' ? 'Add new vehicle' : 'Edit vehicle'}</DialogTitle>
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
                        />
                        <TextField
                            label="Model"
                            value={formValues.model}
                            onChange={handleFormChange('model')}
                            fullWidth
                        />
                        <TextField
                            label="Color"
                            value={formValues.color}
                            onChange={handleFormChange('color')}
                            fullWidth
                        />
                        <TextField
                            label="Number"
                            value={formValues.number}
                            onChange={handleFormChange('number')}
                            fullWidth
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
                        {formMode === 'create' ? 'Add vehicle' : 'Save changes'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
                <DialogTitle>Delete vehicle</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete
                        {' '}
                        <strong>{deleteTarget?.name}</strong>
                        ? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
                        Cancel
                    </Button>
                    <Button color="error" variant="contained" onClick={handleDelete} disabled={deleting}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </AdminLayout>
    );
};

export default AdminCarsPage;
