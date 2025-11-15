import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Card, CardContent, Fade, List, ListItem, ListItemText, Skeleton, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';

const LazyLineChart = lazy(() => import('@mui/x-charts/LineChart').then((module) => ({ default: module.LineChart })));

import CustomChartTooltip from '@/components/charts/tooltip/custom-chart-tooltip.jsx';
import usePageTitle from '@/hooks/use-page-title.js';
import { apiRequest } from '@/lib/api.js';

const orderMetricsConfig = (t) => [
    { key: 'totalOrders', label: t('dashboard-total-orders') },
    { key: 'pendingOrders', label: t('dashboard-pending-orders') },
    { key: 'successfulOrders', label: t('dashboard-successful-orders') },
    { key: 'rejectedOrders', label: t('dashboard-rejected-orders') },
    { key: 'openTickets', label: t('dashboard-open-tickets') },
];

const salesMetricsConfig = (t) => [
    { key: 'totalSales', label: t('dashboard-total-sales') },
    { key: 'totalRevenue', label: t('dashboard-total-revenue') },
];

const cardSx = {
    borderRadius: 3,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(15,23,42,0.8))',
    color: 'white',
    boxShadow: '0 20px 45px rgba(15,23,42,0.45)',
};

const chartSkeleton = (
    <Skeleton
        variant="rectangular"
        height={300}
        animation="wave"
        sx={{ borderRadius: 2, bgcolor: 'rgba(255,255,255,0.08)' }}
    />
);

const formatChange = (change) => {
    if (!change) {
        return '0';
    }

    const value = Number(change.value ?? 0);
    const prefix = value >= 0 ? '+' : '';
    const suffix = change.unit === 'percent' ? '%' : '';

    return `${prefix}${value}${suffix}`;
};

function MetricCard({ data, label }) {
    const change = data?.change;
    const hasCount = typeof data?.count === 'number';
    const primaryValue = hasCount ? data.count : data?.amount ?? 0;

    return (
        <Card sx={cardSx}>
            <CardContent>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)', mb: 1 }}>
                    {label}
                </Typography>
                <Typography variant="h3" component="p" sx={{ fontWeight: 600, mb: 1 }}>
                    {primaryValue.toLocaleString('ar-EG')}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(94,234,212,0.9)' }}>
                    {formatChange(change)} {change?.period ? `/ ${change.period}` : ''}
                </Typography>
            </CardContent>
        </Card>
    );
}

export default function App() {
    const { t, i18n } = useTranslation();
    usePageTitle(t('dashboard-title'));

    const [orders, setOrders] = useState(null);
    const [announcements, setAnnouncements] = useState([]);
    const [sales, setSales] = useState(null);
    const [salesSeries, setSalesSeries] = useState([]);
    const [salesLoading, setSalesLoading] = useState(true);

    const loadDashboard = async () => {
        setSalesLoading(true);
        try {
            const [ordersRes, announcementsRes, salesRes] = await Promise.all([
                apiRequest('/dashboard/orders', { auth: true }),
                apiRequest('/dashboard/announcements', { auth: true }),
                apiRequest('/dashboard/sales', { auth: true }),
            ]);

            setOrders(ordersRes?.data?.totals ?? null);
            setAnnouncements(announcementsRes?.data?.announcements ?? []);
            setSales(salesRes?.data?.totals ?? null);
            setSalesSeries(salesRes?.data?.series ?? []);
        } catch (error) {
            console.error('Failed to load dashboard data', error);
        } finally {
            setSalesLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, [i18n.language]);

    const orderMetrics = useMemo(() => orderMetricsConfig(t), [t]);
    const salesMetrics = useMemo(() => salesMetricsConfig(t), [t]);

    const salesChartData = useMemo(
        () => salesSeries.map(({ month, totalSales }) => ({ month, totalSales })),
        [salesSeries]
    );

    return (
        <Box sx={{ backgroundColor: '#020617', minHeight: '100vh', py: 6, px: { xs: 2, md: 6 } }}>
            <Grid container spacing={4} sx={{ maxWidth: 1400, margin: '0 auto' }}>
                <Grid size={12}>
                    <Typography variant="h3" component="h1" sx={{ color: 'white', fontWeight: 600 }}>
                        {t('dashboard-title')}
                    </Typography>
                </Grid>

                {orderMetrics.map((metric) => (
                    <Grid key={metric.key} size={{ xs: 12, sm: 6, lg: 3 }}>
                        <MetricCard data={orders?.[metric.key]} label={metric.label} />
                    </Grid>
                ))}

                {salesMetrics.map((metric) => (
                    <Grid key={metric.key} size={{ xs: 12, sm: 6, lg: 3 }}>
                        <MetricCard data={sales?.[metric.key]} label={metric.label} />
                    </Grid>
                ))}

                <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={cardSx}>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2, color: 'rgba(255,255,255,0.75)' }}>
                                {t('dashboard-sales')}
                            </Typography>
                            {salesLoading ? (
                                chartSkeleton
                            ) : (
                                <Suspense fallback={chartSkeleton}>
                                    <Fade in timeout={400}>
                                        <Box>
                                            <LazyLineChart
                                                height={300}
                                                dataset={salesChartData}
                                                xAxis={[{ dataKey: 'month', scaleType: 'band' }]}
                                                series={[
                                                    {
                                                        dataKey: 'totalSales',
                                                        label: t('dashboard-total-sales'),
                                                        color: '#60a5fa',
                                                    },
                                                ]}
                                                margin={{ left: 20, right: 20 }}
                                                grid={{ horizontal: true }}
                                                slots={{ tooltip: CustomChartTooltip }}
                                            />
                                        </Box>
                                    </Fade>
                                </Suspense>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={cardSx}>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2, color: 'rgba(255,255,255,0.75)' }}>
                                {t('dashboard-announcements')}
                            </Typography>
                            <List>
                                {announcements.length > 0 ? (
                                    announcements.map((announcement) => (
                                        <ListItem key={announcement.id} sx={{ px: 0 }}>
                                            <ListItemText
                                                primary={announcement.title}
                                                secondary={announcement.message}
                                                primaryTypographyProps={{
                                                    sx: { color: 'white', fontWeight: 600 },
                                                }}
                                                secondaryTypographyProps={{
                                                    sx: { color: 'rgba(255,255,255,0.65)' },
                                                }}
                                            />
                                        </ListItem>
                                    ))
                                ) : (
                                    <ListItem sx={{ px: 0 }}>
                                        <ListItemText primary={t('dashboard-no-announcements')} />
                                    </ListItem>
                                )}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
