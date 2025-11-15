import { useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    Grid,
    Stack,
    Typography,
} from '@mui/material';
import AdminLayout from '../components/AdminLayout.jsx';
import { fetchAdminDashboard } from '../services/admin.js';

const toneColors = {
    emerald: '#10b981',
    sky: '#0ea5e9',
    rose: '#f43f5e',
    amber: '#f59e0b',
};

const MetricCard = ({ metric }) => (
    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
        <CardContent>
            <Typography variant="subtitle2" color="text.secondary">
                {metric.label}
            </Typography>
            <Typography variant="h4" fontWeight={700} mt={1}>
                {metric.value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
                {metric.detail}
            </Typography>
            <Chip
                label={metric.trend}
                size="small"
                sx={{
                    mt: 2,
                    backgroundColor: `${toneColors[metric.accent] ?? '#e2e8f0'}22`,
                    color: toneColors[metric.accent] ?? '#475569',
                    fontWeight: 600,
                }}
            />
        </CardContent>
    </Card>
);

const DistributionBar = ({ split }) => (
    <Box>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Fleet readiness split
        </Typography>
        <Box
            sx={{
                height: 14,
                borderRadius: 999,
                backgroundColor: '#e2e8f0',
                overflow: 'hidden',
                display: 'flex',
            }}
        >
            <Box sx={{ width: `${split.ready}%`, backgroundColor: '#14b8a6' }} />
            <Box sx={{ width: `${split.enRoute}%`, backgroundColor: '#0ea5e9' }} />
            <Box sx={{ width: `${split.maintenance}%`, backgroundColor: '#f97316' }} />
        </Box>
        <Stack direction="row" spacing={3} mt={1.5}>
            <Typography variant="caption" color="text.secondary">
                Ready {split.ready}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
                En route {split.enRoute}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
                Maintenance {split.maintenance}%
            </Typography>
        </Stack>
    </Box>
);

const Timeline = ({ activity }) => (
    <Stack spacing={3}>
        {activity.map((item, index) => (
            <Stack key={`${item.title}-${index}`} direction="row" spacing={2} alignItems="flex-start">
                <Box
                    sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: toneColors[item.tone] ?? '#0ea5e9',
                        mt: '6px',
                    }}
                />
                <Box flex={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle1" fontWeight={600}>
                            {item.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {item.time}
                        </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                        {item.description}
                    </Typography>
                    <Chip
                        size="small"
                        label={item.badge}
                        sx={{
                            mt: 1,
                            width: 'fit-content',
                            backgroundColor: `${toneColors[item.tone] ?? '#0ea5e9'}22`,
                            color: toneColors[item.tone] ?? '#0ea5e9',
                            fontWeight: 600,
                        }}
                    />
                </Box>
            </Stack>
        ))}
    </Stack>
);

const Highlights = ({ highlights }) => (
    <Stack spacing={2}>
        {highlights.map((highlight, index) => (
            <Card key={`${highlight.title}-${index}`} elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
                <CardContent>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Typography fontSize={32}>{highlight.icon}</Typography>
                        <Box>
                            <Typography variant="subtitle1" fontWeight={600}>
                                {highlight.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {highlight.body}
                            </Typography>
                        </Box>
                    </Stack>
                </CardContent>
            </Card>
        ))}
    </Stack>
);

const AdminDashboardPage = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const payload = await fetchAdminDashboard();
            setData(payload);
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
            Refresh data
        </Button>
    );

    return (
        <AdminLayout
            title="Mission dashboard"
            description="Live visibility into bookings, users, and fleet usage."
            actions={actions}
        >
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {loading && (
                <Stack alignItems="center" py={10}>
                    <CircularProgress />
                    <Typography mt={2} color="text.secondary">
                        Syncing the latest telemetry…
                    </Typography>
                </Stack>
            )}

            {!loading && data && (
                <Stack spacing={4}>
                    <Grid container spacing={3}>
                        {data.metrics?.map((metric) => (
                            <Grid key={metric.label} item xs={12} md={4}>
                                <MetricCard metric={metric} />
                            </Grid>
                        ))}
                    </Grid>

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
                                <CardContent>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                                        <Box>
                                            <Typography variant="h6" fontWeight={600}>
                                                Live trips timeline
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Latest five updates across the network
                                            </Typography>
                                        </Box>
                                    </Stack>
                                    {data.activity?.length ? (
                                        <Timeline activity={data.activity} />
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            No activity yet today.
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
                                <CardContent>
                                    <Typography variant="h6" fontWeight={600} gutterBottom>
                                        Utilization mix
                                    </Typography>
                                    <DistributionBar split={data.split ?? { ready: 0, enRoute: 0, maintenance: 0 }} />
                                    <Divider sx={{ my: 3 }} />
                                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                        Highlights
                                    </Typography>
                                    {data.highlights?.length ? (
                                        <Highlights highlights={data.highlights} />
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            Nothing to report.
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Stack>
            )}
        </AdminLayout>
    );
};

export default AdminDashboardPage;
