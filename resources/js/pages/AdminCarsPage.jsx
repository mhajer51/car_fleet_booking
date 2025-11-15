import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
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
import { fetchAdminCars } from '../services/admin.js';

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

    return (
        <AdminLayout
            title="Garage overview"
            description="Every vehicle with its availability, trim, and booking status."
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
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">
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
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">
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
        </AdminLayout>
    );
};

export default AdminCarsPage;
