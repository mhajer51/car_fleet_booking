import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Link, Stack, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LoginLayout from '../components/LoginLayout.jsx';
import TokenPreview from '../components/TokenPreview.jsx';
import { loginUser } from '../services/auth.js';
import { getAdminSession, getUserSession, setUserSession } from '../services/session.js';

const initialState = { login: '', password: '' };

const UserLoginPage = () => {
    const [form, setForm] = useState(initialState);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [payload, setPayload] = useState(null);
    const navigate = useNavigate();
    const existingUserSession = useMemo(() => getUserSession(), []);
    const existingAdminSession = useMemo(() => getAdminSession(), []);

    useEffect(() => {
        if (existingAdminSession?.token) {
            navigate('/admin/dashboard', { replace: true });
            return;
        }

        if (existingUserSession?.token) {
            navigate('/portal/dashboard', { replace: true });
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
            const response = await loginUser(form);
            setUserSession(response);
            setPayload(response);
            navigate('/portal/dashboard');
        } catch (err) {
            setPayload(null);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <LoginLayout title="Welcome back" subtitle="Sign in to view and manage your trips.">
            <Stack component="form" spacing={3} onSubmit={handleSubmit}>
                {error && <Alert severity="error">{error}</Alert>}
                {payload && (
                    <Alert severity="success">
                        Signed in successfully! Your token has been saved locally.
                    </Alert>
                )}

                <TextField
                    name="login"
                    label="Email / username / employee number"
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
                    {loading ? 'Authenticating…' : 'Sign in'}
                </Button>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                    Are you an admin?{' '}
                    <Link href="/admin" underline="hover">
                        Go to the admin sign-in
                    </Link>
                </Typography>
            </Stack>

            {payload && (
                <Box mt={5}>
                    <TokenPreview title="User session payload" payload={payload} />
                </Box>
            )}
        </LoginLayout>
    );
};

export default UserLoginPage;
