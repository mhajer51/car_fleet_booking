import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Avatar,
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
    FormControlLabel,
} from '@mui/material';
import UserLayout from '../components/UserLayout.jsx';
import { createUserDriver, fetchUserDrivers } from '../services/user.js';

const assignmentTone = {
    available: { bg: 'rgba(59,130,246,.12)', color: '#1d4ed8', label: 'Available' },
    assigned: { bg: 'rgba(249,115,22,.14)', color: '#c2410c', label: 'On a job' },
};

const activeTone = {
    true: { bg: 'rgba(16,185,129,.12)', color: '#0f766e', label: 'Enabled' },
    false: { bg: 'rgba(248,113,113,.12)', color: '#b91c1c', label: 'Disabled' },
};

const badge = ({ bg, color, label }) => (
    <Chip label={label} size="small" sx={{ backgroundColor: bg, color, fontWeight: 600, mr: 1 }} />
);

const UserDriversPage = () => {
    const [drivers, setDrivers] = useState([]);
    const [meta, setMeta] = useState({ total: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formError, setFormError] = useState('');
    const [formErrors, setFormErrors] = useState({});
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [pagination, setPagination] = useState({ page: 0, pageSize: 10 });
    const [dialogOpen, setDialogOpen] = useState(false);
    const [form, setForm] = useState({
        name: '',
        license_number: '',
        phone_number: '',
        is_active: true,
    });
    const [submitting, setSubmitting] = useState(false);

    const totalRecords = meta?.total ?? 0;

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const payload = await fetchUserDrivers({
                page: pagination.page + 1,
                per_page: pagination.pageSize,
                search: search || undefined,
                is_active:
                    activeFilter === 'all'
                        ? undefined
                        : activeFilter === 'enabled'
                            ? true
                            : false,
            });
            setDrivers(payload.drivers ?? []);
            setMeta(payload.meta ?? {});
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [activeFilter, pagination.page, pagination.pageSize, search]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        const handler = setTimeout(() => setSearch(searchInput.trim()), 400);
        return () => clearTimeout(handler);
    }, [searchInput]);

    useEffect(() => {
        setPagination((prev) => ({ ...prev, page: 0 }));
    }, [search, activeFilter]);

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

    const openDialog = () => {
        setForm({ name: '', license_number: '', phone_number: '', is_active: true });
        setFormErrors({});
        setFormError('');
        setDialogOpen(true);
    };

    const handleFormChange = (field) => (event) => {
        const value = field === 'is_active' ? event.target.checked : event.target.value;
        setForm((prev) => ({ ...prev, [field]: value }));
        setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const validateForm = () => {
        const errors = {};

        if (!form.name.trim()) {
            errors.name = ['Driver name is required.'];
        }

        if (!form.license_number.trim()) {
            errors.license_number = ['License number is required.'];
        }

        if (!form.phone_number.trim()) {
            errors.phone_number = ['Phone number is required.'];
        }

        return errors;
    };

    const handleSubmit = async () => {
        const errors = validateForm();
        if (Object.keys(errors).length) {
            setFormErrors(errors);
            setFormError('Please correct the highlighted fields.');
            return;
        }

        setSubmitting(true);
        setFormError('');
        setFormErrors({});

        try {
            await createUserDriver(form);
            setDialogOpen(false);
            await load();
        } catch (err) {
            setFormError(err.message);
            if (err?.response?.data?.data) {
                setFormErrors(err.response.data.data);
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <UserLayout
            title="Drivers"
            description="View the drivers available to your bookings and add new profiles."
            actions={
                <Button variant="contained" onClick={openDialog}>
                    Add driver
                </Button>
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
                                Driver directory
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {totalRecords} drivers · Showing {visibleRange.from} - {visibleRange.to}
                            </Typography>
                        </Box>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} width={{ xs: '100%', md: 'auto' }}>
                            <TextField
                                value={searchInput}
                                onChange={(event) => setSearchInput(event.target.value)}
                                placeholder="Search name, license, or phone"
                                size="small"
                                sx={{ minWidth: { xs: '100%', md: 260 } }}
                            />
                            <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 160 } }}>
                                <InputLabel id="driver-active-filter">Status</InputLabel>
                                <Select
                                    labelId="driver-active-filter"
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
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>License</TableCell>
                                    <TableCell>Phone</TableCell>
                                    <TableCell>Statuses</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">
                                            <Stack alignItems="center" py={3} spacing={1}>
                                                <CircularProgress size={24} />
                                                <Typography variant="body2" color="text.secondary">
                                                    Loading drivers…
                                                </Typography>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ) : drivers.length ? (
                                    drivers.map((driver) => (
                                        <TableRow key={driver.id} hover>
                                            <TableCell>
                                                <Stack direction="row" spacing={1.5} alignItems="center">
                                                    <Avatar sx={{ bgcolor: '#e0f2fe', color: '#0ea5e9' }}>
                                                        {driver.name
                                                            .split(' ')
                                                            .map((chunk) => chunk[0])
                                                            .slice(0, 2)
                                                            .join('')
                                                            .toUpperCase()}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography fontWeight={600}>{driver.name}</Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            ID: {driver.id}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </TableCell>
                                            <TableCell>{driver.license_number}</TableCell>
                                            <TableCell>
                                                <Typography fontWeight={600}>{driver.phone_number}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                {badge(assignmentTone[driver.status] ?? assignmentTone.available)}
                                                {badge(activeTone[driver.is_active] ?? activeTone.true)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">
                                            <Typography variant="body2" color="text.secondary">
                                                No drivers match the current filters.
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

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Add new driver</DialogTitle>
                <DialogContent dividers>
                    {formError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {formError}
                        </Alert>
                    )}
                    <Stack spacing={2} mt={1}>
                        <TextField
                            label="Name"
                            value={form.name}
                            onChange={handleFormChange('name')}
                            fullWidth
                            required
                            error={!!formErrors.name}
                            helperText={formErrors.name?.[0] || formErrors.name}
                        />
                        <TextField
                            label="License number"
                            value={form.license_number}
                            onChange={handleFormChange('license_number')}
                            fullWidth
                            required
                            error={!!formErrors.license_number}
                            helperText={formErrors.license_number?.[0] || formErrors.license_number}
                        />
                        <TextField
                            label="Phone number"
                            value={form.phone_number}
                            onChange={handleFormChange('phone_number')}
                            fullWidth
                            required
                            error={!!formErrors.phone_number}
                            helperText={formErrors.phone_number?.[0] || formErrors.phone_number}
                        />
                        <FormControlLabel
                            control={<Switch checked={!!form.is_active} onChange={handleFormChange('is_active')} />}
                            label="Driver is active"
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
                        Add driver
                    </Button>
                </DialogActions>
            </Dialog>
        </UserLayout>
    );
};

export default UserDriversPage;
