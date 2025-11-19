import { useMemo, useState } from 'react';
import {
    AppBar,
    Avatar,
    Box,
    Button,
    Container,
    Divider,
    Drawer,
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
    { label: 'Sponsors', href: '/admin/sponsors', icon: '🤝' },
    { label: 'Plates', href: '/admin/plates', icon: '🔖' },
    { label: 'Bookings', href: '/admin/bookings', icon: '📅' },
    { label: 'Profile', href: '/admin/profile', icon: '👤' },
];

const drawerWidth = 280;

const AdminLayout = ({ title, description, actions, children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const session = useMemo(() => getAdminSession(), []);
    const [mobileOpen, setMobileOpen] = useState(false);
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

    const handleDrawerToggle = () => {
        setMobileOpen((prev) => !prev);
    };

    const drawerContent = (
        <Stack
            spacing={3}
            sx={{
                height: '100%',
                p: 3,
                backgroundImage: 'linear-gradient(180deg, #020617 0%, #0f172a 100%)',
                color: 'white',
            }}
        >
            <Stack spacing={0.5}>
                <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.7)', letterSpacing: 2 }}>
                    Admin control
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                    Fleet intelligence
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    Manage users, assets, and operations with precision.
                </Typography>
            </Stack>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

            <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ width: 52, height: 52, bgcolor: 'rgba(255,255,255,0.15)' }}>{initials || 'AD'}</Avatar>
                <Stack spacing={0.3}>
                    <Typography fontWeight={600}>{session?.admin?.name ?? 'Administrator'}</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        {session?.admin?.email ?? 'ops@fleet.io'}
                    </Typography>
                </Stack>
            </Stack>

            <Stack spacing={1} flexGrow={1} pt={2}>
                {NAV_LINKS.map((link) => {
                    const isActive = location.pathname === link.href;
                    return (
                        <Button
                            key={link.href}
                            fullWidth
                            onClick={() => {
                                navigate(link.href);
                                setMobileOpen(false);
                            }}
                            startIcon={<Box component="span">{link.icon}</Box>}
                            sx={{
                                justifyContent: 'flex-start',
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: isActive ? 700 : 500,
                                color: 'inherit',
                                backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                                '&:hover': {
                                    backgroundColor: 'rgba(255,255,255,0.25)',
                                },
                            }}
                        >
                            {link.label}
                        </Button>
                    );
                })}
            </Stack>

            <Button
                variant="contained"
                onClick={handleLogout}
                sx={{
                    backgroundColor: 'white',
                    color: '#0f172a',
                    fontWeight: 600,
                    '&:hover': {
                        backgroundColor: '#e2e8f0',
                    },
                }}
            >
                Sign out
            </Button>
        </Stack>
    );

    return (
        <Box minHeight="100vh" sx={{ display: 'flex', backgroundColor: '#edf2fb', width: '100%' }}>
            <AppBar
                position="fixed"
                color="inherit"
                elevation={0}
                sx={{
                    display: { xs: 'flex', md: 'none' },
                    borderBottom: '1px solid #e2e8f0',
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(12px)',
                }}
            >
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    <Typography variant="h6" fontWeight={700} color="primary.main">
                        Admin Portal
                    </Typography>
                    <IconButton onClick={handleDrawerToggle} aria-label="Open navigation menu">
                        ☰
                    </IconButton>
                </Toolbar>
            </AppBar>

            <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }} aria-label="Admin navigation">
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        '& .MuiDrawer-paper': {
                            width: { xs: '100vw', sm: drawerWidth },
                            maxWidth: drawerWidth,
                            borderRight: 'none',
                        },
                    }}
                >
                    {drawerContent}
                </Drawer>
                <Drawer
                    variant="permanent"
                    open
                    sx={{
                        display: { xs: 'none', md: 'block' },
                        '& .MuiDrawer-paper': {
                            width: drawerWidth,
                            borderRight: 'none',
                            background: 'transparent',
                        },
                    }}
                >
                    {drawerContent}
                </Drawer>
            </Box>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    width: '100%',
                    minWidth: 0,
                    py: { xs: 9, md: 6 },
                    px: { xs: 3, sm: 4, lg: 6 },
                }}
            >
                <Container
                    disableGutters
                    maxWidth="xl"
                    sx={{
                        backgroundColor: 'transparent',
                        mx: 'auto',
                    }}
                >
                    <Stack
                        spacing={2}
                        mb={4}
                        direction={{ xs: 'column', lg: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'flex-start', lg: 'center' }}
                        sx={{
                            backgroundColor: 'white',
                            borderRadius: 4,
                            p: { xs: 3, md: 4 },
                            boxShadow: '0 20px 60px rgba(15,23,42,0.08)',
                            border: '1px solid #e2e8f0',
                        }}
                    >
                        <Box>
                            <Typography variant="overline" color="primary.main" fontWeight={700} letterSpacing={2}>
                                Command center
                            </Typography>
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
        </Box>
    );
};

export default AdminLayout;
