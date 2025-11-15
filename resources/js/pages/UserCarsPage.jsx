import { useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Grid,
    Stack,
    Typography,
} from '@mui/material';
import UserLayout from '../components/UserLayout.jsx';
import { fetchAvailableCars } from '../services/user.js';

const UserCarsPage = () => {
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const payload = await fetchAvailableCars();
            setCars(payload.cars ?? payload ?? []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const actions = (
        <Button variant="outlined" onClick={load} disabled={loading}>
            تحديث القائمة
        </Button>
    );

    return (
        <UserLayout title="السيارات المتاحة" description="اختر المركبة المناسبة وانطلق فوراً." actions={actions}>
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {loading && (
                <Stack alignItems="center" py={10}>
                    <CircularProgress />
                    <Typography mt={2} color="text.secondary">
                        يتم تحميل السيارات الجاهزة…
                    </Typography>
                </Stack>
            )}

            {!loading && !cars.length && (
                <Box textAlign="center" py={8}>
                    <Typography variant="h6" gutterBottom>
                        لا توجد سيارات متاحة حالياً
                    </Typography>
                    <Typography color="text.secondary">
                        سيتم إشعارك بمجرد تحرير مركبة جديدة.
                    </Typography>
                </Box>
            )}

            {!loading && !!cars.length && (
                <Grid container spacing={3}>
                    {cars.map((car) => (
                        <Grid key={car.id} item xs={12} md={6}>
                            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
                                <CardContent>
                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                        <Box>
                                            <Typography variant="h6" fontWeight={700}>
                                                {car.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                الموديل {car.model} • اللون {car.color}
                                            </Typography>
                                        </Box>
                                        <Chip label={`رقم ${car.number}`} color="primary" variant="outlined" />
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </UserLayout>
    );
};

export default UserCarsPage;
