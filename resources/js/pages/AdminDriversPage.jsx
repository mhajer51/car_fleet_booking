import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    AlertTitle,
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
    IconButton,
    InputLabel,
    Menu,
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
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, MoreHoriz } from '@mui/icons-material';
import AdminLayout from '../components/AdminLayout.jsx';
import {
    createAdminDriver,
    fetchAdminDrivers,
    updateAdminDriver,
    updateAdminDriverStatus,
} from '../services/admin.js';

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

const AdminDriversPage = () => {
    const [drivers, setDrivers] = useState([]);
    const [meta, setMeta] = useState({ total: 0 });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [statusUpdating, setStatusUpdating] = useState(null);
    const [error, setError] = useState('');
    const [submitError, setSubmitError] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [pagination, setPagination] = useState({ page: 0, pageSize: 10 });
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState('create');
    const [form, setForm] = useState({
        name: '',
        license_number: '',
        phone_number: '',
        is_active: true,
    });
    const [editingDriverId, setEditingDriverId] = useState(null);
    const [statusMenu, setStatusMenu] = useState({ id: null, anchorEl: null });

    const totalRecords = meta?.total ?? 0;

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const payload = await fetchAdminDrivers({
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
    }, [activeFilter, pagination, search]);

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

    const openCreateDialog = () => {
        setDialogMode('create');
        setForm({ name: '', license_number: '', phone_number: '', is_active: true });
        setEditingDriverId(null);
        setSubmitError('');
        setDialogOpen(true);
    };

    const openEditDialog = (driver) => {
        setDialogMode('edit');
        setForm({
            name: driver.name ?? '',
            license_number: driver.license_number ?? '',
            phone_number: driver.phone_number ?? '',
            is_active: Boolean(driver.is_active),
        });
        setEditingDriverId(driver.id);
        setSubmitError('');
        setDialogOpen(true);
    };

    const closeDialog = () => {
        if (submitting) return;
        setDialogOpen(false);
    };

    const openStatusMenu = (driver, event) => {
        setStatusMenu({ id: driver.id, anchorEl: event.currentTarget });
    };

    const closeStatusMenu = () => setStatusMenu({ id: null, anchorEl: null });

    const handleFormChange = (field) => (event) => {
        const value =
            field === 'is_active' ? event.target.value === 'true' || event.target.value === true : event.target.value;
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setSubmitError('');

        try {
            if (dialogMode === 'create') {
                await createAdminDriver(form);
            } else if (editingDriverId) {
                await updateAdminDriver(editingDriverId, form);
            }
            setDialogOpen(false);
            await load();
        } catch (err) {
            setSubmitError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (driver) => {
        const confirmed = window.confirm(
            `Disable ${driver.name}? This will remove them from the active fleet without deleting their history.`
        );
        if (!confirmed) return;

        setStatusUpdating(driver.id);
        setError('');
        try {
            await updateAdminDriverStatus(driver.id, { is_active: false });
            await load();
        } catch (err) {
            setError(err.message);
        } finally {
            setStatusUpdating(null);
        }
    };

    const handleStatusChange = async (driver, isActive) => {
        if (!driver) {
            closeStatusMenu();
            return;
        }

        if (statusUpdating === driver.id || driver.is_active === isActive) {
            closeStatusMenu();
            return;
        }

        setStatusUpdating(driver.id);
        setError('');
        try {
            await updateAdminDriverStatus(driver.id, { is_active: isActive });
            await load();
        } catch (err) {
            setError(err.message);
        } finally {
            setStatusUpdating(null);
            closeStatusMenu();
        }
    };

    return (
        <AdminLayout
            title="Driver roster"
            description="Manage every active and on-duty driver in the fleet."
            actions={
                <Stack direction="row" spacing={1}>
                    <Button variant="contained" onClick={openCreateDialog}>
                        Add new
                    </Button>
                    <Button variant="outlined" onClick={load} disabled={loading}>
                        Refresh list
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
                                People behind the wheel
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
                            <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 180 } }}>
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
                        <Table sx={{ minWidth: 650 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Driver</TableCell>
                                    <TableCell>License #</TableCell>
                                    <TableCell>Phone</TableCell>
                                    <TableCell>Assignment</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right" width={200}>
                                        Actions
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">
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
                                                    <Avatar sx={{ bgcolor: '#0ea5e9', color: 'white' }}>
                                                        {driver.name
                                                            .split(' ')
                                                            .map((chunk) => chunk[0])
                                                            .filter(Boolean)
                                                            .slice(0, 2)
                                                            .join('')
                                                            .toUpperCase()}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography fontWeight={600}>{driver.name}</Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {driver.license_number}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </TableCell>
                                            <TableCell>{driver.license_number}</TableCell>
                                            <TableCell>{driver.phone_number}</TableCell>
                                            <TableCell>
                                                {badge(assignmentTone[driver.status] ?? assignmentTone.available)}
                                            </TableCell>
                                            <TableCell>{badge(activeTone[driver.is_active] ?? activeTone.true)}</TableCell>
                                            <TableCell align="right">
                                                <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        onClick={(event) => openStatusMenu(driver, event)}
                                                        endIcon={<MoreHoriz fontSize="small" />}
                                                        disabled={statusUpdating === driver.id}
                                                    >
                                                        Update status
                                                    </Button>
                                                    <IconButton
                                                        color="primary"
                                                        size="small"
                                                        onClick={() => openEditDialog(driver)}
                                                        aria-label={`Edit ${driver.name}`}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        color="error"
                                                        size="small"
                                                        disabled={statusUpdating === driver.id}
                                                        onClick={() => handleDelete(driver)}
                                                        aria-label={`Disable ${driver.name}`}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">
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

            <Menu
                anchorEl={statusMenu.anchorEl}
                open={Boolean(statusMenu.anchorEl)}
                onClose={closeStatusMenu}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                {statusMenu.id && (
                    <Box px={2} py={1.5} sx={{ maxWidth: 260 }}>
                        <Alert severity="info" sx={{ mb: 1.5 }}>
                            <AlertTitle>Status options</AlertTitle>
                            Toggle driver availability to mirror the car roster experience.
                        </Alert>
                        <Stack spacing={1}>
                            <Button
                                variant="outlined"
                                size="small"
                                fullWidth
                                onClick={() => handleStatusChange(drivers.find((d) => d.id === statusMenu.id), true)}
                                disabled={statusUpdating === statusMenu.id}
                            >
                                Mark as enabled
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                color="error"
                                fullWidth
                                onClick={() => handleStatusChange(drivers.find((d) => d.id === statusMenu.id), false)}
                                disabled={statusUpdating === statusMenu.id}
                            >
                                Mark as disabled
                            </Button>
                        </Stack>
                    </Box>
                )}
            </Menu>

            <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm" component="form" onSubmit={handleSubmit}>
                <DialogTitle>{dialogMode === 'create' ? 'Add driver' : 'Edit driver'}</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                    {submitError && (
                        <Alert severity="error" onClose={() => setSubmitError('')}>
                            {submitError}
                        </Alert>
                    )}
                    <TextField
                        label="Full name"
                        value={form.name}
                        onChange={handleFormChange('name')}
                        required
                        autoFocus
                    />
                    <TextField
                        label="License number"
                        value={form.license_number}
                        onChange={handleFormChange('license_number')}
                        required
                    />
                    <TextField
                        label="Phone number"
                        value={form.phone_number}
                        onChange={handleFormChange('phone_number')}
                        required
                    />
                    <FormControl fullWidth>
                        <InputLabel id="driver-status-select">Status</InputLabel>
                        <Select
                            labelId="driver-status-select"
                            label="Status"
                            value={String(form.is_active)}
                            onChange={handleFormChange('is_active')}
                        >
                            <MenuItem value="true">Enabled</MenuItem>
                            <MenuItem value="false">Disabled</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={closeDialog} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="contained" disabled={submitting}>
                        {dialogMode === 'create' ? 'Create driver' : 'Save changes'}
                    </Button>
                </DialogActions>
            </Dialog>
        </AdminLayout>
    );
};

export default AdminDriversPage;
