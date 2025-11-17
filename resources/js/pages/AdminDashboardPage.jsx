import { useEffect, useState } from 'react';
import {
    Alert,
    Avatar,
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

const SectionCard = ({ children, ...props }) => (
    <Card
        elevation={0}
        sx={{
            borderRadius: 3,
            border: '1px solid #e2e8f0',
            height: '100%',
            background: '#fff',
        }}
        {...props}
    >
        <CardContent>{children}</CardContent>
    </Card>
);

const MetricCard = ({ metric }) => (
    <SectionCard>
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
    </SectionCard>
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
            <Box
                key={`${highlight.title}-${index}`}
                sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#f8fafc',
                }}
            >
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
            </Box>
        ))}
    </Stack>
);

const HeroStat = ({ label, value, helper }) => (
    <Stack spacing={0.5}>
        <Typography variant="h4" fontWeight={700}>
            {value}
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
            {label}
        </Typography>
        <Typography variant="caption" color="text.secondary">
            {helper}
        </Typography>
    </Stack>
);

const StatusBreakdown = ({ items }) => (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        {items.map((item) => (
            <Box
                key={item.status}
                sx={{
                    flex: 1,
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid #e2e8f0',
                    backgroundColor: `${toneColors[item.tone] ?? '#e2e8f0'}11`,
                }}
            >
                <Typography variant="caption" color="text.secondary">
                    {item.label}
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                    {item.count}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {item.detail}
                </Typography>
            </Box>
        ))}
    </Stack>
);

const DailyBookings = ({ series }) => {
    if (!series.length) {
        return (
            <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                    7-day demand trend
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    No bookings recorded in the past week.
                </Typography>
            </Box>
        );
    }

    const maxValue = Math.max(...series.map((point) => point.value), 1);

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Box>
                    <Typography variant="h6" fontWeight={600}>
                        7-day demand trend
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Tracking new bookings captured each day
                    </Typography>
                </Box>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="flex-end" sx={{ height: 140 }}>
                {series.map((point) => (
                    <Stack key={point.date} alignItems="center" spacing={1} sx={{ flex: 1 }}>
                        <Box
                            sx={{
                                width: '100%',
                                borderRadius: 1,
                                background: 'linear-gradient(180deg, #0ea5e9 0%, #38bdf8 100%)',
                                minHeight: 4,
                                height: `${(point.value / maxValue) * 100}%`,
                                transition: 'height 0.3s ease',
                            }}
                        />
                        <Typography variant="caption" color="text.secondary">
                            {point.label}
                        </Typography>
                        <Typography variant="caption" fontWeight={600}>
                            {point.value}
                        </Typography>
                    </Stack>
                ))}
            </Stack>
        </Box>
    );
};

const Leaderboard = ({ leaders }) => (
    <Stack spacing={2}>
        {leaders.map((leader) => {
            const safeName = leader.name ?? '';
            const initials =
                safeName
                    .split(' ')
                    .filter(Boolean)
                    .map((chunk) => chunk[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase() || 'CF';

            return (
                <Stack
                    key={`${leader.name}-${leader.number}`}
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    sx={{ p: 1.5, borderRadius: 2, border: '1px solid #e2e8f0' }}
                >
                    <Avatar sx={{ bgcolor: '#0ea5e9', color: '#fff' }}>{initials}</Avatar>
                    <Box flex={1}>
                        <Typography fontWeight={600}>{leader.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {leader.number}
                        </Typography>
                    </Box>
                    <Stack spacing={0.5} textAlign="right">
                        <Typography variant="body2" color="text.secondary">
                            Completed
                        </Typography>
                        <Typography variant="subtitle1" fontWeight={700}>
                            {leader.completedTrips}
                        </Typography>
                        <Chip label={`${leader.activeTrips} active`} size="small" />
                    </Stack>
                </Stack>
            );
        })}
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



    const meta = data?.meta ?? {};
    const statusBreakdown = data?.statusBreakdown ?? [];
    const dailySeries = data?.dailyBookings ?? [];
    const leaders = data?.leaders ?? [];

    const heroStats = [
        {
            label: 'Vehicles in fleet',
            value: meta.fleet ?? 0,
            helper: `${meta.available ?? 0} available now`,
        },
        {
            label: 'Live bookings',
            value: meta.activeBookings ?? 0,
            helper: 'Trips currently in motion',
        },
        {
            label: 'Bookings today',
            value: meta.bookingsToday ?? 0,
            helper: `${meta.newUsersToday ?? 0} new riders`,
        },
    ];

    return (
        <AdminLayout
            title="Mission dashboard"
            description="Live visibility into bookings, users, and fleet usage."
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
                <Stack container spacing={4}>
                    <SectionCard>
                        <Stack
                            direction={{ xs: 'column', md: 'row' }}
                            spacing={4}
                            alignItems={{ xs: 'flex-start', md: 'center' }}
                        >
                            <Box flex={1}>
                                <Typography variant="overline" color="text.secondary">
                                    Operations pulse
                                </Typography>
                                <Typography variant="h5" fontWeight={700}>
                                    Full-scope telemetry for the booking fleet
                                </Typography>
                                <Typography variant="body2" color="text.secondary" mt={1}>
                                    Monitor utilization, rider activity, and vehicle health from a single
                                    view.
                                </Typography>
                            </Box>
                            <Grid container spacing={3} flex={1}>
                                {heroStats.map((stat) => (
                                    <Grid key={stat.label} item xs={12} sm={4}>
                                        <HeroStat {...stat} />
                                    </Grid>
                                ))}
                            </Grid>
                        </Stack>
                    </SectionCard>
                    <Stack>
                        <Grid container spacing={3}>
                        {data.metrics?.map((metric) => (
                            <Grid key={metric.label} item xs={12} md={4}>
                                <MetricCard metric={metric} />
                            </Grid>
                        ))}
                    </Grid>
                    </Stack>
                    <Stack>
                        <Grid container spacing={3}>
                        <Grid item xs={12} lg={8}>
                            <SectionCard>
                                <DailyBookings series={dailySeries} />
                                <Divider sx={{ my: 3 }} />
                                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                    Status focus
                                </Typography>
                                {statusBreakdown.length ? (
                                    <StatusBreakdown items={statusBreakdown} />
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        No bookings to analyze yet.
                                    </Typography>
                                )}
                            </SectionCard>
                        </Grid>
                        <Grid item xs={12} lg={4}>
                            <SectionCard>
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
                            </SectionCard>
                        </Grid>
                    </Grid>
                    </Stack>
                    <Stack>
                        <Grid container spacing={3}>
                        <Grid item xs={12} md={7}>
                            <SectionCard>
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
                            </SectionCard>
                        </Grid>
                        <Grid item xs={12} md={5}>
                            <SectionCard>
                                <Typography variant="h6" fontWeight={600} gutterBottom>
                                    Vehicle leaderboard
                                </Typography>
                                {leaders.length ? (
                                    <Leaderboard leaders={leaders} />
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        No vehicles have completed trips yet.
                                    </Typography>
                                )}
                            </SectionCard>
                        </Grid>
                    </Grid>
                    </Stack>
                </Stack>
            )}
        </AdminLayout>
    );
};

export default AdminDashboardPage;
