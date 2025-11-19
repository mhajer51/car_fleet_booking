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
    Switch,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Typography,
    IconButton,
} from '@mui/material';
import AdminLayout from '../components/AdminLayout.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import {
    createAdminSponsor,
    deleteAdminSponsor,
    fetchAdminSponsors,
    updateAdminSponsor,
    updateAdminSponsorStatus,
} from '../services/admin.js';
import EditOutlinedIcon from "../components/icons/EditOutlinedIcon.jsx";
import DeleteOutlineIcon from "../components/icons/DeleteOutlineIcon.jsx";

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

const AdminSponsorsPage = () => {
    const [sponsors, setSponsors] = useState([]);
    const [meta, setMeta] = useState({ total: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [pagination, setPagination] = useState({ page: 0, pageSize: 10 });
    const [formOpen, setFormOpen] = useState(false);
    const [formMode, setFormMode] = useState('create');
    const [formError, setFormError] = useState('');
    const [formErrors, setFormErrors] = useState({});
    const [formValues, setFormValues] = useState({
        id: null,
        title: '',
        traffic_file_number: '',
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
            const payload = await fetchAdminSponsors({
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
            setSponsors(payload.sponsors ?? []);
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

    const openCreateForm = () => {
        setFormMode('create');
        setFormValues({ id: null, title: '', traffic_file_number: '', is_active: true });
        setFormError('');
        setFormErrors({});
        setFormOpen(true);
    };

    const openEditForm = (sponsor) => {
        setFormMode('edit');
        setFormValues({ ...sponsor });
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

        if (!formValues.title.trim()) {
            errors.title = ['Sponsor title is required.'];
        }

        if (!formValues.traffic_file_number.trim()) {
            errors.traffic_file_number = ['Traffic file number is required.'];
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
                await createAdminSponsor(formValues);
            } else {
                await updateAdminSponsor(formValues.id, formValues);
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

    const handleStatusToggle = async (sponsor) => {
        setStatusUpdatingId(sponsor.id);
        try {
            await updateAdminSponsorStatus(sponsor.id, { is_active: !sponsor.is_active });
            await load();
        } catch (err) {
            setError(err.message);
        } finally {
            setStatusUpdatingId(null);
        }
    };

    const confirmDelete = (sponsor) => {
        setDeleteTarget(sponsor);
        setDeleting(false);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        setDeleting(true);
        try {
            await deleteAdminSponsor(deleteTarget.id);
            setDeleteTarget(null);
            await load();
        } catch (err) {
            setError(err.message);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <AdminLayout
            title="Sponsor management"
            description="Manage sponsor records and activity."
            actions={
                <Stack direction="row" spacing={1}>
                    <Button variant="contained" onClick={openCreateForm}>
                        Add sponsor
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
                                Sponsor roster
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {totalRecords} sponsors · Showing {visibleRange.from} - {visibleRange.to}
                            </Typography>
                        </Box>

                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} width={{ xs: '100%', md: 'auto' }}>
                            <TextField
                                value={searchInput}
                                onChange={(event) => setSearchInput(event.target.value)}
                                placeholder="Search sponsor or traffic file"
                                size="small"
                                sx={{ minWidth: { xs: '100%', md: 260 } }}
                            />
                            <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 180 } }}>
                                <InputLabel id="sponsor-status-filter">Status</InputLabel>
                                <Select
                                    labelId="sponsor-status-filter"
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
                                    <TableCell>Title</TableCell>
                                    <TableCell>Traffic file number</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">
                                            <Stack alignItems="center" py={3} spacing={1}>
                                                <CircularProgress size={24} />
                                                <Typography variant="body2" color="text.secondary">
                                                    Loading sponsors…
                                                </Typography>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ) : sponsors.length ? (
                                    sponsors.map((sponsor) => (
                                        <TableRow key={sponsor.id} hover>
                                            <TableCell>
                                                <Typography fontWeight={600}>{sponsor.title}</Typography>
                                            </TableCell>
                                            <TableCell>{sponsor.traffic_file_number}</TableCell>
                                            <TableCell>
                                                {badge(activeTone[String(sponsor.is_active)])}
                                                <FormControlLabel
                                                    control={(
                                                        <Switch
                                                            color="primary"
                                                            checked={!!sponsor.is_active}
                                                            onChange={() => handleStatusToggle(sponsor)}
                                                            size="small"
                                                            disabled={statusUpdatingId === sponsor.id}
                                                        />
                                                    )}
                                                    label={sponsor.is_active ? 'Disable' : 'Enable'}
                                                    sx={{ ml: 1 }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                                                    <IconButton color="primary" size="small" onClick={() => openEditForm(sponsor)}>
                                                        <EditOutlinedIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton color="error" size="small" onClick={() => confirmDelete(sponsor)}>
                                                        <DeleteOutlineIcon fontSize="small" />
                                                    </IconButton>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">
                                            <Typography variant="body2" color="text.secondary">
                                                No sponsors match the current filters.
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
                <DialogTitle>{formMode === 'create' ? 'Add Sponsor' : 'Edit Sponsor'}</DialogTitle>
                <DialogContent dividers>
                    {formError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {formError}
                        </Alert>
                    )}
                    <Stack spacing={2}>
                        <TextField
                            label="Title"
                            fullWidth
                            value={formValues.title}
                            onChange={handleFormChange('title')}
                            error={!!formErrors.title}
                            helperText={formErrors.title?.[0]}
                        />
                        <TextField
                            label="Traffic File Number"
                            fullWidth
                            value={formValues.traffic_file_number}
                            onChange={handleFormChange('traffic_file_number')}
                            error={!!formErrors.traffic_file_number}
                            helperText={formErrors.traffic_file_number?.[0]}
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formValues.is_active}
                                    onChange={handleFormChange('is_active')}
                                    color="success"
                                />
                            }
                            label="Active"
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setFormOpen(false)} sx={{ borderRadius: 2 }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleFormSubmit}
                        disabled={saving}
                        sx={{ borderRadius: 2 }}
                    >
                        {saving ? 'Saving...' : formMode === 'create' ? 'Create' : 'Update'}
                    </Button>
                </DialogActions>
            </Dialog>

            <ConfirmDialog
                open={!!deleteTarget}
                title="Delete Sponsor"
                description={`Are you sure you want to delete ${deleteTarget?.title}? This action cannot be undone.`}
                loading={deleting}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
            />
        </AdminLayout>
    );
};

export default AdminSponsorsPage;
