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
} from '@mui/material';
import AdminLayout from '../components/AdminLayout.jsx';
import { fetchAdminUsers } from '../services/admin.js';

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
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [pagination, setPagination] = useState({ page: 0, pageSize: 10 });

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

    return (
        <AdminLayout
            title="People directory"
            description="Manage every driver and dispatcher connected to the fleet."
            actions={
                <Button variant="outlined" onClick={load} disabled={loading}>
                    Refresh list
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
        </AdminLayout>
    );
};

export default AdminUsersPage;
