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
    FormControlLabel,
    FormHelperText,
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
    Tooltip,
    Typography,
} from '@mui/material';
import IconButton from '@mui/material/IconButton';
import AdminLayout from '../components/AdminLayout.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import EditOutlinedIcon from '../components/icons/EditOutlinedIcon.jsx';
import DeleteOutlineIcon from '../components/icons/DeleteOutlineIcon.jsx';
import {
    createAdminUser,
    deleteAdminUser,
    fetchAdminUsers,
    updateAdminUser,
    updateAdminUserStatus,
} from '../services/admin.js';

const statusChip = (isActive) => (
    <Chip
        label={isActive ? 'Active' : 'Suspended'}
        size="small"
        sx={{
            backgroundColor: isActive ? 'rgba(34,197,94,.15)' : 'rgba(248,113,113,.15)',
            color: isActive ? '#15803d' : '#b91c1c',
            fontWeight: 600,
        }}
    />
);

const AdminUsersPage = () => {
    const [users, setUsers] = useState([]);
    const [meta, setMeta] = useState({ total: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [pagination, setPagination] = useState({ page: 0, pageSize: 10 });
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [selectedUser, setSelectedUser] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [form, setForm] = useState({
        name: '',
        username: '',
        email: '',
        number_employ: '',
        password: '',
        role: 'user',
        is_active: true,
    });

    const totalRecords = meta?.total ?? 0;

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const payload = await fetchAdminUsers({
                page: pagination.page + 1,
                per_page: pagination.pageSize,
                search: search || undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
            });
            setUsers(payload.users ?? []);
            setMeta(payload.meta ?? {});
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [pagination, search, statusFilter]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        const handler = setTimeout(() => setSearch(searchInput.trim()), 400);
        return () => clearTimeout(handler);
    }, [searchInput]);

    useEffect(() => {
        setPagination((prev) => ({ ...prev, page: 0 }));
    }, [search, statusFilter]);

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

    const handleOpenCreate = () => {
        setSelectedUser(null);
        setForm({
            name: '',
            username: '',
            email: '',
            number_employ: '',
            password: '',
            role: 'user',
            is_active: true,
        });
        setFormErrors({});
        setDialogOpen(true);
    };

    const handleOpenEdit = (user) => {
        setSelectedUser(user);
        setForm({ ...user, password: '' });
        setFormErrors({});
        setDialogOpen(true);
    };

    const handleDialogClose = () => {
        if (saving) return;
        setDialogOpen(false);
    };

    const handleFormChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const validateForm = useCallback(() => {
        const errors = {};

        if (!form.name.trim()) {
            errors.name = ['Full name is required.'];
        }

        if (!form.username.trim()) {
            errors.username = ['Username is required.'];
        }

        if (!form.email.trim()) {
            errors.email = ['Email is required.'];
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
            errors.email = ['Enter a valid email address.'];
        }

        if (!form.number_employ.trim()) {
            errors.number_employ = ['Employee number is required.'];
        }

        if (!selectedUser || form.password.trim()) {
            if (!form.password.trim()) {
                errors.password = ['Password is required for new users.'];
            } else if (form.password.trim().length < 8) {
                errors.password = ['Password must be at least 8 characters.'];
            }
        }

        return errors;
    }, [form, selectedUser]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        const errors = validateForm();
        if (Object.keys(errors).length) {
            setFormErrors(errors);
            setError('Please correct the highlighted fields.');
            return;
        }

        setSaving(true);
        setFormErrors({});

        try {
            const payload = { ...form };

            if (!payload.password) {
                delete payload.password;
            }

            if (selectedUser) {
                await updateAdminUser(selectedUser.id, payload);
            } else {
                await createAdminUser(payload);
            }

            setDialogOpen(false);
            await load();
        } catch (err) {
            if (err?.message && typeof err?.message === 'string') {
                setError(err.message);
            }

            if (err?.response?.data?.data) {
                setFormErrors(err.response.data.data);
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (user) => {
        setDeleteTarget(user);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        setError('');

        try {
            await deleteAdminUser(deleteTarget.id);
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
            title="People directory"
            description="Manage every driver and dispatcher connected to the fleet."
            actions={
                <Stack direction="row" spacing={1}>
                    <Button variant="contained" onClick={handleOpenCreate}>
                        Add user
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
                                Team members
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {totalRecords} total · Showing {visibleRange.from} - {visibleRange.to}
                            </Typography>
                        </Box>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} width={{ xs: '100%', md: 'auto' }}>
                            <TextField
                                value={searchInput}
                                onChange={(event) => setSearchInput(event.target.value)}
                                placeholder="Search name, email, or employee no."
                                size="small"
                                sx={{ minWidth: { xs: '100%', md: 280 } }}
                            />
                            <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 180 } }}>
                                <InputLabel id="user-status-filter">Status</InputLabel>
                                <Select
                                    labelId="user-status-filter"
                                    label="Status"
                                    value={statusFilter}
                                    onChange={(event) => setStatusFilter(event.target.value)}
                                >
                                    <MenuItem value="all">All statuses</MenuItem>
                                    <MenuItem value="active">Active only</MenuItem>
                                    <MenuItem value="suspended">Suspended</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>
                    </Stack>

                    <Box sx={{ borderRadius: 2, border: '1px solid #e2e8f0', overflowX: 'auto' }}>
                        <Table sx={{ minWidth: 650 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Username</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Employee #</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">
                                            <Stack alignItems="center" py={3} spacing={1}>
                                                <CircularProgress size={24} />
                                                <Typography variant="body2" color="text.secondary">
                                                    Loading roster…
                                                </Typography>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ) : users.length ? (
                                    users.map((user) => (
                                        <TableRow key={user.id} hover>
                                            <TableCell>
                                                <Stack direction="row" spacing={1.5} alignItems="center">
                                                    <Avatar sx={{ bgcolor: '#1d4ed8', color: 'white' }}>
                                                        {user.name
                                                            .split(' ')
                                                            .map((chunk) => chunk[0])
                                                            .filter(Boolean)
                                                            .slice(0, 2)
                                                            .join('')
                                                            .toUpperCase()}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography fontWeight={600}>{user.name}</Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {user.email}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </TableCell>
                                            <TableCell>{user.username}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>{user.number_employ}</TableCell>
                                            <TableCell>{statusChip(user.is_active)}</TableCell>
                                            <TableCell align="right">
                                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                    <Tooltip title="Edit">
                                                        <IconButton
                                                            size="small"
                                                            color="primary"
                                                            onClick={() => handleOpenEdit(user)}
                                                        >
                                                            <EditOutlinedIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleDelete(user)}
                                                    >
                                                        <DeleteOutlineIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">
                                            <Typography variant="body2" color="text.secondary">
                                                No users match the current filters.
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

            <Dialog open={dialogOpen} onClose={handleDialogClose} fullWidth maxWidth="sm">
                <form onSubmit={handleSubmit}>
                    <DialogTitle>{selectedUser ? 'Edit user' : 'Add new user'}</DialogTitle>
                    <DialogContent dividers>
                        <Stack spacing={2} mt={1}>
                            <TextField
                                label="Full name"
                                value={form.name}
                                onChange={(event) => handleFormChange('name', event.target.value)}
                                required
                                error={!!formErrors.name}
                                helperText={formErrors.name?.[0]}
                            />
                            <TextField
                                label="Username"
                                value={form.username}
                                onChange={(event) => handleFormChange('username', event.target.value)}
                                required
                                error={!!formErrors.username}
                                helperText={formErrors.username?.[0]}
                            />
                            <TextField
                                label="Email"
                                type="email"
                                value={form.email}
                                onChange={(event) => handleFormChange('email', event.target.value)}
                                required
                                error={!!formErrors.email}
                                helperText={formErrors.email?.[0]}
                            />
                            <TextField
                                label="Employee number"
                                value={form.number_employ}
                                onChange={(event) => handleFormChange('number_employ', event.target.value)}
                                required
                                error={!!formErrors.number_employ}
                                helperText={formErrors.number_employ?.[0]}
                            />

                            <TextField
                                label="Password"
                                type="password"
                                value={form.password}
                                onChange={(event) => handleFormChange('password', event.target.value)}
                                required={!selectedUser}
                                error={!!formErrors.password}
                                helperText={
                                    selectedUser
                                        ? formErrors.password?.[0] || 'Leave blank to keep the current password.'
                                        : formErrors.password?.[0]
                                }
                            />
                            <FormControlLabel
                                control={(
                                    <Switch
                                        checked={form.is_active}
                                        onChange={(event) => handleFormChange('is_active', event.target.checked)}
                                    />
                                )}
                                label={form.is_active ? 'Active' : 'Suspended'}
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions dividers>
                        <Button onClick={handleDialogClose} disabled={saving}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="contained" disabled={saving}>
                            {saving ? 'Saving…' : 'Save user'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            <ConfirmDialog
                open={!!deleteTarget}
                title="Delete user"
                description={
                    deleteTarget
                        ? `Are you sure you want to permanently delete ${deleteTarget.name}? This action cannot be undone.`
                        : ''
                }
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onCancel={() => setDeleteTarget(null)}
                onConfirm={handleConfirmDelete}
                loading={deleting}
                tone="error"
            />
        </AdminLayout>
    );
};

export default AdminUsersPage;
