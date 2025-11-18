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
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { searchViolationsByPlate } from '../services/violations.js';
import {
    createAdminCar,
    deleteAdminCar,
    fetchAdminCars,
    fetchPlateCategories,
    fetchPlateCodes,
    fetchPlateSources,
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

const buildViolationSearchUrl = (car) => {
    const query = new URLSearchParams({
        plateNumber: car.number ?? '',
        plateSource: car.plate_source?.title ?? '',
        plateCategory: car.plate_category?.title ?? '',
        plateCode: car.plate_code?.title ?? '',
    });

    return `https://ums.rta.ae/violations/public-fines/fines-search?${query.toString()}`;
};

const extractViolations = (payload) => {
    const data = payload?.data ?? payload ?? {};

    if (Array.isArray(data)) return data;

    const candidates = [
        data.violations,
        data.fines,
        data.results,
        data.items,
        data.data,
    ];

    for (const candidate of candidates) {
        if (Array.isArray(candidate)) return candidate;
        if (candidate?.items && Array.isArray(candidate.items)) return candidate.items;
    }

    return [];
};

const resolveField = (violation, keys, fallback = '—') => {
    for (const key of keys) {
        if (violation?.[key]) return violation[key];
    }

    return fallback;
};

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
    const [formErrors, setFormErrors] = useState({});
    const [formValues, setFormValues] = useState({
        id: null,
        name: '',
        model: '',
        color: '',
        number: '',
        plate_source_id: '',
        plate_category_id: '',
        plate_code_id: '',
        emirate: 'dubai',
        notes: '',
        is_active: true,
    });
    const [saving, setSaving] = useState(false);
    const [statusUpdatingId, setStatusUpdatingId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [violationsState, setViolationsState] = useState({
        open: false,
        loading: false,
        error: '',
        car: null,
        results: [],
        raw: null,
    });

    const [sourceOptions, setSourceOptions] = useState([]);
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [codeOptions, setCodeOptions] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [loadingCodes, setLoadingCodes] = useState(false);

    const totalRecords = meta?.total ?? 0;

    const loadPlateSources = useCallback(async () => {
        try {
            const payload = await fetchPlateSources({ per_page: 100 });
            setSourceOptions(payload.sources ?? []);
        } catch (err) {
            console.error(err);
        }
    }, []);

    const loadPlateCategories = useCallback(async (plateSourceId) => {
        if (!plateSourceId) {
            setCategoryOptions([]);
            return;
        }

        setLoadingCategories(true);
        try {
            const payload = await fetchPlateCategories({ plate_source_id: plateSourceId, per_page: 100 });
            setCategoryOptions(payload.categories ?? []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingCategories(false);
        }
    }, []);

    const loadPlateCodes = useCallback(async (plateCategoryId) => {
        if (!plateCategoryId) {
            setCodeOptions([]);
            return;
        }

        setLoadingCodes(true);
        try {
            const payload = await fetchPlateCodes({ plate_category_id: plateCategoryId, per_page: 100 });
            setCodeOptions(payload.codes ?? []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingCodes(false);
        }
    }, []);

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
        loadPlateSources();
    }, [loadPlateSources]);

    useEffect(() => {
        if (formOpen && formValues.plate_source_id) {
            loadPlateCategories(formValues.plate_source_id);
        }
    }, [formOpen, formValues.plate_source_id, loadPlateCategories]);

    useEffect(() => {
        if (formOpen && formValues.plate_category_id) {
            loadPlateCodes(formValues.plate_category_id);
        }
    }, [formOpen, formValues.plate_category_id, loadPlateCodes]);

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
        setFormValues({
            id: null,
            name: '',
            model: '',
            color: '',
            number: '',
            plate_source_id: '',
            plate_category_id: '',
            plate_code_id: '',
            emirate: 'dubai',
            notes: '',
            is_active: true,
        });
        setFormError('');
        setFormErrors({});
        setCategoryOptions([]);
        setCodeOptions([]);
        setFormOpen(true);
    };

    const openEditForm = (car) => {
        setFormMode('edit');
        setFormValues({
            ...car,
            plate_source_id: car.plate_source_id || car.plate_source?.id || '',
            plate_category_id: car.plate_category_id || car.plate_category?.id || '',
            plate_code_id: car.plate_code_id || car.plate_code?.id || '',
            notes: car.notes ?? '',
        });
        setFormError('');
        setFormErrors({});
        setFormOpen(true);

        if (car.plate_source_id || car.plate_source?.id) {
            loadPlateCategories(car.plate_source_id || car.plate_source?.id);
        }
        if (car.plate_category_id || car.plate_category?.id) {
            loadPlateCodes(car.plate_category_id || car.plate_category?.id);
        }
    };

    const handleFormChange = (field) => (event) => {
        const value = field === 'is_active' ? event.target.checked : event.target.value;
        setFormValues((prev) => ({ ...prev, [field]: value }));
        setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const handlePlateSourceChange = async (event) => {
        const value = event.target.value;
        setFormValues((prev) => ({
            ...prev,
            plate_source_id: value,
            plate_category_id: '',
            plate_code_id: '',
        }));
        setFormErrors((prev) => ({ ...prev, plate_source_id: undefined, plate_category_id: undefined, plate_code_id: undefined }));
        setCodeOptions([]);
        await loadPlateCategories(value);
    };

    const handlePlateCategoryChange = async (event) => {
        const value = event.target.value;
        setFormValues((prev) => ({ ...prev, plate_category_id: value, plate_code_id: '' }));
        setFormErrors((prev) => ({ ...prev, plate_category_id: undefined, plate_code_id: undefined }));
        await loadPlateCodes(value);
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

        if (!formValues.plate_source_id) {
            errors.plate_source_id = ['Select a plate source.'];
        }

        if (!formValues.plate_category_id) {
            errors.plate_category_id = ['Select a plate category.'];
        }

        if (!formValues.plate_code_id) {
            errors.plate_code_id = ['Select a plate code.'];
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
            if (formMode === 'create') {
                await createAdminCar(formValues);
            } else {
                await updateAdminCar(formValues.id, formValues);
            }

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

    const handleCheckViolations = async (car) => {
        if (!car) return;

        setViolationsState({
            open: true,
            loading: true,
            error: '',
            car,
            results: [],
            raw: null,
        });

        try {
            const payload = {
                plateNumber: car.number,
                plateSource: car.plate_source?.title,
                plateCategory: car.plate_category?.title,
                plateCode: car.plate_code?.title,
            };

            const response = await searchViolationsByPlate(payload);
            const normalized = extractViolations(response);

            setViolationsState((prev) => ({
                ...prev,
                loading: false,
                results: normalized,
                raw: response,
            }));
        } catch (err) {
            setViolationsState((prev) => ({
                ...prev,
                loading: false,
                error: err.message || 'Unable to fetch violations right now.',
            }));
        }
    };

    const closeViolationsDialog = () => {
        setViolationsState({
            open: false,
            loading: false,
            error: '',
            car: null,
            results: [],
            raw: null,
        });
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
        } finally {
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
                                    <TableCell>Emirate</TableCell>
                                    <TableCell>Notes</TableCell>
                                    <TableCell>Statuses</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center">
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
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        onClick={() => handleCheckViolations(car)}
                                                        aria-label={`Check violations for ${car.name}`}
                                                    >
                                                        Violations
                                                    </Button>
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
                                        <TableCell colSpan={8} align="center">
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
                        <FormControl fullWidth error={!!formErrors.plate_source_id}>
                            <InputLabel id="car-plate-source-select">Plate source</InputLabel>
                            <Select
                                labelId="car-plate-source-select"
                                label="Plate source"
                                value={formValues.plate_source_id}
                                onChange={handlePlateSourceChange}
                                required
                            >
                                {sourceOptions.map((option) => (
                                    <MenuItem key={option.id} value={option.id}>
                                        {option.title}
                                    </MenuItem>
                                ))}
                            </Select>
                            {formErrors.plate_source_id && (
                                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1 }}>
                                    {formErrors.plate_source_id?.[0] || formErrors.plate_source_id}
                                </Typography>
                            )}
                        </FormControl>
                        <FormControl fullWidth error={!!formErrors.plate_category_id} disabled={!formValues.plate_source_id || loadingCategories}>
                            <InputLabel id="car-plate-category-select">Plate category</InputLabel>
                            <Select
                                labelId="car-plate-category-select"
                                label="Plate category"
                                value={formValues.plate_category_id}
                                onChange={handlePlateCategoryChange}
                                required
                            >
                                {categoryOptions.map((option) => (
                                    <MenuItem key={option.id} value={option.id}>
                                        {option.title}
                                    </MenuItem>
                                ))}
                            </Select>
                            {formErrors.plate_category_id && (
                                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1 }}>
                                    {formErrors.plate_category_id?.[0] || formErrors.plate_category_id}
                                </Typography>
                            )}
                        </FormControl>
                        <FormControl fullWidth error={!!formErrors.plate_code_id} disabled={!formValues.plate_category_id || loadingCodes}>
                            <InputLabel id="car-plate-code-select">Plate code</InputLabel>
                            <Select
                                labelId="car-plate-code-select"
                                label="Plate code"
                                value={formValues.plate_code_id}
                                onChange={handleFormChange('plate_code_id')}
                                required
                            >
                                {codeOptions.map((option) => (
                                    <MenuItem key={option.id} value={option.id}>
                                        {option.title}
                                    </MenuItem>
                                ))}
                            </Select>
                            {formErrors.plate_code_id && (
                                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1 }}>
                                    {formErrors.plate_code_id?.[0] || formErrors.plate_code_id}
                                </Typography>
                            )}
                        </FormControl>
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
                        {formMode === 'create' ? 'Add vehicle' : 'Save changes'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={violationsState.open}
                onClose={closeViolationsDialog}
                fullWidth
                maxWidth="md"
            >
                <DialogTitle>
                    {violationsState.car
                        ? `Violations for ${violationsState.car.name || violationsState.car.number}`
                        : 'Violations'}
                </DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2}>
                        {violationsState.error && <Alert severity="error">{violationsState.error}</Alert>}

                        {violationsState.loading ? (
                            <Stack alignItems="center" py={4} spacing={1}>
                                <CircularProgress size={28} />
                                <Typography variant="body2" color="text.secondary">
                                    Fetching violations…
                                </Typography>
                            </Stack>
                        ) : violationsState.results.length ? (
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Reference</TableCell>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Description</TableCell>
                                        <TableCell>Amount</TableCell>
                                        <TableCell>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {violationsState.results.map((violation, index) => {
                                        const reference = resolveField(violation, [
                                            'ticketNumber',
                                            'fineNumber',
                                            'referenceNumber',
                                            'violationNumber',
                                            'trafficNo',
                                            'id',
                                        ]);
                                        const date = resolveField(violation, [
                                            'violationDate',
                                            'issueDate',
                                            'offenceDate',
                                            'date',
                                            'createdAt',
                                        ]);
                                        const description = resolveField(violation, [
                                            'description',
                                            'offence',
                                            'offenceDescription',
                                            'remarks',
                                            'fineName',
                                        ]);
                                        const amount = resolveField(violation, [
                                            'amount',
                                            'fineAmount',
                                            'totalAmount',
                                            'dueAmount',
                                            'value',
                                        ]);
                                        const status = resolveField(violation, [
                                            'status',
                                            'state',
                                            'violationStatus',
                                            'paymentStatus',
                                        ]);

                                        return (
                                            <TableRow key={reference || `violation-${index}`}>
                                                <TableCell>{reference}</TableCell>
                                                <TableCell>{date}</TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" color="text.primary">
                                                        {description}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>{amount}</TableCell>
                                                <TableCell>{status}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                No violations were found for this plate.
                            </Typography>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeViolationsDialog}>Close</Button>
                    {violationsState.car && (
                        <Button
                            component="a"
                            href={buildViolationSearchUrl(violationsState.car)}
                            target="_blank"
                            rel="noreferrer noopener"
                        >
                            Open RTA site
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            <ConfirmDialog
                open={!!deleteTarget}
                title="Delete vehicle"
                description={
                    deleteTarget
                        ? `Are you sure you want to delete ${deleteTarget.name}? This action cannot be undone.`
                        : ''
                }
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onCancel={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                loading={deleting}
                tone="error"
            />
        </AdminLayout>
    );
};

export default AdminCarsPage;
