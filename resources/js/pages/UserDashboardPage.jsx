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
    Divider,
    Grid,
    LinearProgress,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { alpha } from '@mui/material/styles';
import UserLayout from '../components/UserLayout.jsx';
import { fetchPortalOverview } from '../services/user.js';

const accentColors = {
    emerald: '#10b981',
    sky: '#0ea5e9',
    rose: '#f43f5e',
    amber: '#f59e0b',
    violet: '#8b5cf6',
};

const MetricCard = ({ metric }) => (
    <Card
        elevation={0}
        sx={{
            borderRadius: 3,
            border: '1px solid #e2e8f0',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            height: '100%',
        }}
    >
        <CardContent>
            <Typography variant="subtitle2" color="text.secondary">
                {metric.label}
            </Typography>
            <Typography variant="h3" fontWeight={700} mt={1} lineHeight={1.1}>
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
                    backgroundColor: `${accentColors[metric.accent] ?? '#e2e8f0'}22`,
                    color: accentColors[metric.accent] ?? '#475569',
                    fontWeight: 600,
                }}
            />
        </CardContent>
    </Card>
);

const TimelineCard = ({ timeline }) => (
    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
        <CardContent>
            <Typography variant="h6" gutterBottom fontWeight={600}>
                Latest fleet movements
            </Typography>
            <Stack spacing={2} divider={<Divider flexItem sx={{ borderColor: '#e2e8f0' }} />}>
                {timeline.length === 0 && (
                    <Typography color="text.secondary">No rides captured yet today.</Typography>
                )}
                {timeline.map((item, index) => (
                    <Stack key={`${item.title}-${index}`} spacing={0.5}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography fontWeight={600}>{item.title}</Typography>
                            <Typography variant="caption" color="text.secondary">
                                {item.time}
                            </Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                            {item.location}
                        </Typography>
                        <Chip
                            label={item.status}
                            size="small"
                            sx={{
                                mt: 1,
                                backgroundColor: '#e0f2fe',
                                color: '#0369a1',
                                fontWeight: 600,
                                width: 'fit-content',
                            }}
                        />
                    </Stack>
                ))}
            </Stack>
        </CardContent>
    </Card>
);

const SuggestionsCard = ({ suggestions }) => (
    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
        <CardContent>
            <Typography variant="h6" gutterBottom fontWeight={600}>
                Instant recommendations
            </Typography>
            <List dense>
                {suggestions.length === 0 && (
                    <Typography color="text.secondary" px={1}>
                        We will surface tactical actions here once bookings start flowing.
                    </Typography>
                )}
                {suggestions.map((suggestion, index) => (
                    <ListItem key={`${suggestion}-${index}`} sx={{ alignItems: 'flex-start' }}>
                        <ListItemAvatar sx={{ minWidth: 36 }}>
                            <Avatar
                                sx={{
                                    bgcolor: alpha('#f59e0b', 0.12),
                                    color: '#b45309',
                                    width: 32,
                                    height: 32,
                                    fontSize: 16,
                                }}
                            >
                                💡
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText primary={suggestion} primaryTypographyProps={{ fontSize: 14, lineHeight: 1.4 }} />
                    </ListItem>
                ))}
            </List>
        </CardContent>
    </Card>
);

const TrendCard = ({ trend }) => {
    const labels = trend.map((item) => item.label);
    const values = trend.map((item) => item.value);

    return (
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box>
                        <Typography variant="h6" fontWeight={600}>
                            Booking velocity
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Rolling 7-day view of start dates
                        </Typography>
                    </Box>
                    <Chip label="Live" size="small" color="success" variant="outlined" />
                </Stack>
                {trend.length === 0 ? (
                    <Typography color="text.secondary">No historical bookings to visualize yet.</Typography>
                ) : (
                    <Box sx={{ flexGrow: 1, minHeight: 220 }}>
                        <LineChart
                            height={220}
                            series={[
                                {
                                    data: values,
                                    area: true,
                                    showMark: false,
                                    color: '#0ea5e9',
                                },
                            ]}
                            xAxis={[{ data: labels, scaleType: 'point' }]}
                            yAxis={[{ min: 0 }]}
                            margin={{ left: 20, right: 20, top: 20, bottom: 30 }}
                        />
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

const PerformanceCard = ({ performance }) => {
    const rows = [
        {
            label: 'Fleet utilization',
            helper: 'Share of cars currently on a trip',
            value: `${performance.utilizationRate ?? 0}%`,
        },
        {
            label: 'Average trip length',
            helper: 'Duration for completed bookings',
            value: formatDuration(performance.avgTripMinutes ?? 0),
        },
        {
            label: 'Completion rate',
            helper: 'Returned vs. total bookings',
            value: `${performance.completionRate ?? 0}%`,
        },
        {
            label: 'Service level',
            helper: 'Non-cancelled bookings',
            value: `${performance.serviceLevel ?? 0}%`,
        },
    ];

    return (
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
            <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                    Quality performance
                </Typography>
                <Stack divider={<Divider flexItem sx={{ borderColor: '#e2e8f0' }} />}>
                    {rows.map((row) => (
                        <Stack key={row.label} direction="row" justifyContent="space-between" py={1.5}>
                            <Box>
                                <Typography fontWeight={600}>{row.label}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {row.helper}
                                </Typography>
                            </Box>
                            <Typography variant="h5">{row.value}</Typography>
                        </Stack>
                    ))}
                </Stack>
            </CardContent>
        </Card>
    );
};

const CapacityCard = ({ capacity }) => {
    const buckets = [
        { key: 'available', label: 'Available now', color: '#10b981' },
        { key: 'engaged', label: 'On a trip', color: '#0ea5e9' },
        { key: 'inactive', label: 'Inactive / maintenance', color: '#f97316' },
    ];
    const total = buckets.reduce((sum, bucket) => sum + (capacity?.[bucket.key] ?? 0), 0);

    return (
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
            <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                    Fleet capacity snapshot
                </Typography>
                <Stack spacing={2} mt={2}>
                    {buckets.map((bucket) => {
                        const value = capacity?.[bucket.key] ?? 0;
                        const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

                        return (
                            <Box key={bucket.key}>
                                <Stack direction="row" justifyContent="space-between" mb={0.5}>
                                    <Typography fontWeight={600}>{bucket.label}</Typography>
                                    <Typography color="text.secondary">
                                        {value} • {percentage}%
                                    </Typography>
                                </Stack>
                                <LinearProgress
                                    variant="determinate"
                                    value={percentage}
                                    sx={{
                                        height: 8,
                                        borderRadius: 8,
                                        backgroundColor: '#f1f5f9',
                                        '& .MuiLinearProgress-bar': {
                                            backgroundColor: bucket.color,
                                        },
                                    }}
                                />
                            </Box>
                        );
                    })}
                </Stack>
            </CardContent>
        </Card>
    );
};

const StatusBreakdownCard = ({ breakdown }) => (
    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
        <CardContent>
            <Typography variant="h6" gutterBottom fontWeight={600}>
                Booking status mix
            </Typography>
            <Stack spacing={1.5} mt={1.5}>
                {breakdown.map((item) => (
                    <Stack key={item.label} direction="row" alignItems="center" spacing={1}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#0ea5e9' }} />
                        <Box flexGrow={1}>
                            <Typography fontWeight={600}>{item.label}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {item.value} bookings
                            </Typography>
                        </Box>
                        <Chip label={`${item.percentage}%`} size="small" />
                    </Stack>
                ))}
                {breakdown.length === 0 && (
                    <Typography color="text.secondary">No bookings to classify yet.</Typography>
                )}
            </Stack>
        </CardContent>
    </Card>
);

const HeatmapCard = ({ heatmap }) => (
    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
        <CardContent>
            <Typography variant="h6" gutterBottom fontWeight={600}>
                City demand heatmap
            </Typography>
            <Stack spacing={1.5} mt={2}>
                {heatmap.map((item) => (
                    <Box key={item.label}>
                        <Stack direction="row" justifyContent="space-between" mb={0.5}>
                            <Typography fontWeight={600}>{item.label}</Typography>
                            <Typography color="text.secondary">{item.value}%</Typography>
                        </Stack>
                        <LinearProgress
                            variant="determinate"
                            value={item.value}
                            sx={{
                                height: 8,
                                borderRadius: 8,
                                backgroundColor: '#f1f5f9',
                                '& .MuiLinearProgress-bar': {
                                    background: 'linear-gradient(90deg, #a855f7, #6366f1)',
                                },
                            }}
                        />
                    </Box>
                ))}
                {heatmap.length === 0 && (
                    <Typography color="text.secondary">No regional demand recorded.</Typography>
                )}
            </Stack>
        </CardContent>
    </Card>
);

const TopVehiclesCard = ({ vehicles }) => (
    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
        <CardContent>
            <Typography variant="h6" gutterBottom fontWeight={600}>
                Top performing vehicles
            </Typography>
            <List dense>
                {vehicles.length === 0 && (
                    <Typography color="text.secondary" px={1}>
                        Vehicles will appear here once bookings are assigned.
                    </Typography>
                )}
                {vehicles.map((vehicle) => (
                    <ListItem key={`${vehicle.vehicle}-${vehicle.identifier}`} sx={{ px: 0 }}>
                        <ListItemAvatar>
                            <Avatar sx={{ bgcolor: '#0ea5e9', color: 'white' }}>
                                {vehicle.vehicle?.[0] ?? 'V'}
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={vehicle.vehicle}
                            secondary={`${vehicle.model ?? 'Fleet'} • ${vehicle.identifier ?? 'N/A'}`}
                        />
                        <Tooltip title="Trips in the last 30 days">
                            <Chip label={`${vehicle.trips} trips`} size="small" />
                        </Tooltip>
                    </ListItem>
                ))}
            </List>
        </CardContent>
    </Card>
);

const formatDuration = (minutes) => {
    if (!minutes) {
        return '0 min';
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 0) {
        return `${remainingMinutes} min`;
    }

    if (remainingMinutes === 0) {
        return `${hours} h`;
    }

    return `${hours} h ${remainingMinutes} min`;
};

const UserDashboardPage = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const payload = await fetchPortalOverview();
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
        <Button variant="contained" color="primary" onClick={load} disabled={loading}>
            Refresh data
        </Button>
    );

    const metrics = useMemo(() => data?.metrics ?? [], [data]);

    return (
        <UserLayout
            title="Intelligence dashboard"
            description="Monitor live demand, fleet readiness, and rider experience in one view."
            actions={actions}
        >
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {loading && (
                <Stack alignItems="center" py={10} spacing={2}>
                    <CircularProgress />
                    <Typography color="text.secondary">Refreshing telematics feed…</Typography>
                </Stack>
            )}

            {!loading && data && (
                <Stack spacing={4}>
                    <Grid container spacing={3}>
                        {metrics.map((metric) => (
                            <Grid key={metric.label} item xs={12} md={4}>
                                <MetricCard metric={metric} />
                            </Grid>
                        ))}
                    </Grid>

                    <Grid container spacing={3}>
                        <Grid item xs={12} lg={8}>
                            <TrendCard trend={data.trend ?? []} />
                        </Grid>
                        <Grid item xs={12} lg={4}>
                            <PerformanceCard performance={data.performance ?? {}} />
                        </Grid>
                    </Grid>

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <CapacityCard capacity={data.capacity ?? {}} />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <StatusBreakdownCard breakdown={data.statusBreakdown ?? []} />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <HeatmapCard heatmap={data.heatmap ?? []} />
                        </Grid>
                    </Grid>

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <TimelineCard timeline={data.timeline ?? []} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TopVehiclesCard vehicles={data.topVehicles ?? []} />
                        </Grid>
                    </Grid>

                    <SuggestionsCard suggestions={data.suggestions ?? []} />
                </Stack>
            )}
        </UserLayout>
    );
};

export default UserDashboardPage;
