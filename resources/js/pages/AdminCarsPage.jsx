import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [query, setQuery] = useState('');

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const payload = await fetchAdminCars();
            setCars(payload.cars ?? []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const filteredCars = useMemo(() => {
        if (!query) return cars;
        return cars.filter((car) => {
            const value = `${car.name} ${car.model} ${car.color} ${car.number}`.toLowerCase();
            return value.includes(query.toLowerCase());
        });
    }, [cars, query]);

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
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={3} justifyContent="space-between">
                        <Box>
                            <Typography variant="h6" fontWeight={600}>
                                Fleet roster
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {filteredCars.length} vehicles visible
                            </Typography>
                        </Box>
                        <TextField
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search name, model, or plate number"
                            size="small"
                            sx={{ maxWidth: 320 }}
                        />
                    </Stack>

                    {loading ? (
                        <Stack alignItems="center" py={6}>
                            <CircularProgress size={32} />
                            <Typography mt={2} color="text.secondary">
                                Loading cars…
                            </Typography>
                        </Stack>
                    ) : (
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
                                {filteredCars.map((car) => (
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
                                ))}
                                {!filteredCars.length && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">
                                            <Typography variant="body2" color="text.secondary">
                                                No vehicles match your search.
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

export default AdminCarsPage;
