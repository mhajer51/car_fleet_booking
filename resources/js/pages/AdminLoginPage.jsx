import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Link, Stack, TextField } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import LoginLayout from '../components/LoginLayout.jsx';
import TokenPreview from '../components/TokenPreview.jsx';
import { loginAdmin } from '../services/auth.js';
import { getAdminSession, getUserSession, setAdminSession } from '../services/session.js';

const initialState = { login: '', password: '' };

const AdminLoginPage = () => {
    const [form, setForm] = useState(initialState);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [payload, setPayload] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();
    const existingAdminSession = useMemo(() => getAdminSession(), []);
    const existingUserSession = useMemo(() => getUserSession(), []);

    useEffect(() => {
        if (existingUserSession?.token) {
            navigate('/portal/dashboard', { replace: true });
            return;
        }

        if (existingAdminSession?.token) {
            navigate('/admin/dashboard', { replace: true });
        }
    }, [existingAdminSession, existingUserSession, navigate]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await loginAdmin(form);
            setAdminSession(response);
            setPayload(response);
            navigate('/admin/dashboard', { replace: true });
        } catch (err) {
            setPayload(null);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <LoginLayout
            title="Admin Control Room"
            subtitle="Secure access to monitor fleet health and live bookings."
        >
            <Stack component="form" spacing={3} onSubmit={handleSubmit}>
                {location.state?.reason === 'unauthorized' && (
                    <Alert severity="warning">Please sign in to access admin tools.</Alert>
                )}
                {error && <Alert severity="error">{error}</Alert>}
                {payload && (
                    <Alert severity="success">
                        Welcome back! Your session details are available below.
                    </Alert>
                )}

                <TextField
                    name="login"
                    label="Email or username"
                    value={form.login}
                    onChange={handleChange}
                    required
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                />
                <TextField
                    name="password"
                    label="Password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                />
                <Button type="submit" variant="contained" size="large" disabled={loading}>
                    {loading ? 'Checking credentials…' : 'Sign in as admin'}
                </Button>
                <Link href="/" underline="hover" sx={{ textAlign: 'center' }}>
                    Back to the customer portal
                </Link>
            </Stack>

            {payload && (
                <Box mt={5}>
                    <TokenPreview title="Admin session payload" payload={payload} />
                </Box>
            )}
        </LoginLayout>
    );
};

export default AdminLoginPage;
