import { useMemo } from 'react';
import {
    AppBar,
    Avatar,
    Box,
    Button,
    Container,
    IconButton,
    Stack,
    Toolbar,
    Typography,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { clearUserSession, getUserSession } from '../services/session.js';

const NAV_LINKS = [
    { label: 'الرئيسية', href: '/portal/dashboard', icon: '🏠' },
    { label: 'الحجوزات', href: '/portal/bookings', icon: '📅' },
];

const UserLayout = ({ title, description, actions, children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const session = useMemo(() => getUserSession(), []);

    const initials = session?.user?.name
        ?.split(' ')
        .map((chunk) => chunk[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const handleLogout = () => {
        clearUserSession();
        navigate('/', { replace: true });
    };

    return (
        <Box minHeight="100vh" sx={{ backgroundColor: '#f5f7fb' }}>
            <AppBar position="sticky" elevation={0} color="inherit" sx={{ borderBottom: '1px solid #e2e8f0' }}>
                <Toolbar sx={{ gap: 2, flexWrap: 'wrap' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        بوابة العملاء
                    </Typography>

                    <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center" sx={{ flexGrow: 1 }}>
                        {NAV_LINKS.map((link) => {
                            const isActive = location.pathname === link.href;
                            return (
                                <Button
                                    key={link.href}
                                    color={isActive ? 'primary' : 'inherit'}
                                    startIcon={<Box component="span">{link.icon}</Box>}
                                    onClick={() => navigate(link.href)}
                                    sx={{ fontWeight: isActive ? 600 : 500 }}
                                >
                                    {link.label}
                                </Button>
                            );
                        })}
                    </Stack>

                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Stack sx={{ textAlign: 'left' }}>
                            <Typography variant="body2" fontWeight={600}>
                                {session?.user?.name ?? 'ضيف'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {session?.user?.email ?? session?.user?.username ?? 'بدون بريد'}
                            </Typography>
                        </Stack>
                        <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>{initials || 'US'}</Avatar>
                        <IconButton color="error" onClick={handleLogout} aria-label="تسجيل الخروج">
                            ⏻
                        </IconButton>
                    </Stack>
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ py: 5 }}>
                <Stack spacing={1.5} mb={4} direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                    <Box>
                        <Typography variant="h4" fontWeight={700} gutterBottom>
                            {title}
                        </Typography>
                        {description && (
                            <Typography variant="body1" color="text.secondary">
                                {description}
                            </Typography>
                        )}
                    </Box>
                    {actions}
                </Stack>

                {children}
            </Container>
        </Box>
    );
};

export default UserLayout;
