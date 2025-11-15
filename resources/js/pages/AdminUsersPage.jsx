import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [query, setQuery] = useState('');

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const payload = await fetchAdminUsers();
            setUsers(payload.users ?? []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const filteredUsers = useMemo(() => {
        if (!query) return users;
        return users.filter((user) => {
            const value = `${user.name} ${user.email} ${user.username} ${user.number_employ}`.toLowerCase();
            return value.includes(query.toLowerCase());
        });
    }, [query, users]);

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
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={3} justifyContent="space-between">
                        <Box>
                            <Typography variant="h6" fontWeight={600}>
                                Team members
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {filteredUsers.length} records visible
                            </Typography>
                        </Box>
                        <TextField
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search name, email, or employee no."
                            size="small"
                            sx={{ maxWidth: 320 }}
                        />
                    </Stack>

                    {loading ? (
                        <Stack alignItems="center" py={6}>
                            <CircularProgress size={32} />
                            <Typography mt={2} color="text.secondary">
                                Loading roster…
                            </Typography>
                        </Stack>
                    ) : (
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
                                {filteredUsers.map((user) => (
                                    <TableRow key={user.id} hover>
                                        <TableCell>
                                            <Stack direction="row" spacing={1.5} alignItems="center">
                                                <Avatar sx={{ bgcolor: '#1d4ed8', color: 'white' }}>
                                                    {user.name
                                                        .split(' ')
                                                        .map((chunk) => chunk[0])
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
                                ))}
                                {!filteredUsers.length && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">
                                            <Typography variant="body2" color="text.secondary">
                                                No users match your search.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </AdminLayout>
    );
};

export default AdminUsersPage;
