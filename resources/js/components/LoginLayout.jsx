import { Box, Container, Paper, Stack, Typography } from '@mui/material';

const LoginLayout = ({ title, subtitle, children }) => (
    <Box
        component="section"
        sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            backgroundImage:
                'linear-gradient(135deg, rgba(14,165,233,.15), rgba(59,130,246,.05)), url(https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            py: { xs: 6, md: 10 },
        }}
    >
        <Container maxWidth="md">
            <Paper elevation={8} sx={{ p: { xs: 4, md: 6 }, borderRadius: 4, backdropFilter: 'blur(6px)' }}>
                <Stack spacing={2} textAlign="center" mb={4}>
                    <Typography variant="h4" fontWeight={700} color="primary.dark">
                        {title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        {subtitle}
                    </Typography>
                </Stack>
                {children}
            </Paper>
        </Container>
    </Box>
);

export default LoginLayout;
