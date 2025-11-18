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
import { clearAdminSession, getAdminSession } from '../services/session.js';

const NAV_LINKS = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
    { label: 'Users', href: '/admin/users', icon: '👥' },
    { label: 'Drivers', href: '/admin/drivers', icon: '🧑‍✈️' },
    { label: 'Cars', href: '/admin/cars', icon: '🚗' },
    { label: 'Plates', href: '/admin/plates', icon: '🔖' },
    { label: 'Bookings', href: '/admin/bookings', icon: '📅' },
    { label: 'Profile', href: '/admin/profile', icon: '👤' },
];

const AdminLayout = ({ title, description, actions, children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const session = useMemo(() => getAdminSession(), []);
    const initials = session?.admin?.name
        ?.split(' ')
        .map((chunk) => chunk[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const handleLogout = () => {
        clearAdminSession();
        navigate('/admin', { replace: true });
    };

    return (
        <Box minHeight="100vh" sx={{ backgroundColor: '#f5f7fb' }}>
            <AppBar position="sticky" elevation={0} color="inherit" sx={{ borderBottom: '1px solid #e2e8f0' }}>
                <Toolbar sx={{ gap: 2, flexWrap: 'wrap' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        Fleet Operations
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
                                {session?.admin?.name ?? 'Administrator'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {session?.admin?.email ?? 'ops@fleet.io'}
                            </Typography>
                        </Stack>
                        <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>{initials || 'AD'}</Avatar>
                        <IconButton color="error" onClick={handleLogout} aria-label="Sign out">
                            ⏻
                        </IconButton>
                    </Stack>
                </Toolbar>
            </AppBar>

            <Container maxWidth="xl" sx={{ py: 5 }}>
                <Stack spacing={1.5} mb={4} direction="row" justifyContent="space-between" alignItems="flex-end">
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

export default AdminLayout;
