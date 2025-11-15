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
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Stack,
    Typography,
} from '@mui/material';
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
                أحدث التحركات
            </Typography>
            <Stack spacing={2}>
                {timeline.map((item, index) => (
                    <Box key={`${item.title}-${index}`} sx={{ borderBottom: index !== timeline.length - 1 ? '1px solid #e2e8f0' : 'none', pb: 2 }}>
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
                            sx={{ mt: 1, backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 600 }}
                        />
                    </Box>
                ))}
            </Stack>
        </CardContent>
    </Card>
);

const SuggestionsCard = ({ suggestions }) => (
    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
        <CardContent>
            <Typography variant="h6" gutterBottom fontWeight={600}>
                توصيات فورية
            </Typography>
            <List dense>
                {suggestions.map((suggestion, index) => (
                    <ListItem key={`${suggestion}-${index}`} sx={{ alignItems: 'flex-start' }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>💡</ListItemIcon>
                        <ListItemText primary={suggestion} primaryTypographyProps={{ fontSize: 14 }} />
                    </ListItem>
                ))}
            </List>
        </CardContent>
    </Card>
);

const HeatmapCard = ({ heatmap }) => (
    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
        <CardContent>
            <Typography variant="h6" gutterBottom fontWeight={600}>
                نشاط المدن
            </Typography>
            <Stack spacing={2}>
                {heatmap.map((zone) => (
                    <Box key={zone.label}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography fontWeight={600}>{zone.label}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {zone.value}%
                            </Typography>
                        </Stack>
                        <Box sx={{ mt: 1, height: 10, borderRadius: 999, backgroundColor: '#e2e8f0', overflow: 'hidden' }}>
                            <Box sx={{ width: `${zone.value}%`, height: '100%', backgroundColor: '#0ea5e9' }} />
                        </Box>
                    </Box>
                ))}
            </Stack>
        </CardContent>
    </Card>
);

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
        <Button variant="outlined" onClick={load} disabled={loading}>
            تحديث البيانات
        </Button>
    );

    return (
        <UserLayout
            title="لوحة المؤشرات"
            description="تابع نشاط حجوزاتك والسيارات المتاحة في الوقت الفعلي."
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
                        يتم تحديث بيانات الرحلات…
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
                        <Grid item xs={12} md={6}>
                            <TimelineCard timeline={data.timeline ?? []} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <SuggestionsCard suggestions={data.suggestions ?? []} />
                        </Grid>
                        <Grid item xs={12}>
                            <HeatmapCard heatmap={data.heatmap ?? []} />
                        </Grid>
                    </Grid>
                </Stack>
            )}
        </UserLayout>
    );
};

export default UserDashboardPage;
