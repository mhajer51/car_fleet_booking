import { useMemo, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import UserLayout from '../components/UserLayout.jsx';
import { updateUserPassword, updateUserProfile } from '../services/user.js';
import { getUserSession, updateUserSession } from '../services/session.js';

const UserProfilePage = () => {
    const session = useMemo(() => getUserSession(), []);
    const [form, setForm] = useState({
        name: session?.user?.name ?? '',
        email: session?.user?.email ?? '',
        username: session?.user?.username ?? '',
        employee_number: session?.user?.employee_number ?? '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [passwordForm, setPasswordForm] = useState({ current_password: '', password: '', password_confirmation: '' });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await updateUserProfile(form);
            updateUserSession({ user: response?.user });
            setSuccess('Profile updated successfully.');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = (event) => {
        const { name, value } = event.target;
        setPasswordForm((prev) => ({ ...prev, [name]: value }));
    };

    const handlePasswordSubmit = async (event) => {
        event.preventDefault();
        setPasswordLoading(true);
        setPasswordError('');
        setPasswordSuccess('');

        try {
            await updateUserPassword(passwordForm);
            setPasswordSuccess('Password updated successfully.');
            setPasswordForm({ current_password: '', password: '', password_confirmation: '' });
        } catch (err) {
            setPasswordError(err.message);
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <UserLayout
            title="Profile & security"
            description="Review your details and update your password without leaving the page."
        >
            <Stack spacing={3} maxWidth={900}>
                <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
                    <CardContent>
                        <Stack component="form" spacing={3} onSubmit={handleSubmit}>
                            <Typography variant="h6" fontWeight={700}>
                                Your profile
                            </Typography>
                            {error && <Alert severity="error">{error}</Alert>}
                            {success && <Alert severity="success">{success}</Alert>}

                            <Stack spacing={2}>
                                <TextField
                                    label="Full name"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    required
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    label="Username"
                                    name="username"
                                    value={form.username}
                                    onChange={handleChange}
                                    required
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    label="Employee number"
                                    name="employee_number"
                                    value={form.employee_number}
                                    onChange={handleChange}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Stack>

                            <Box>
                                <Button type="submit" variant="contained" disabled={loading}>
                                    {loading ? 'Saving…' : 'Save changes'}
                                </Button>
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>

                <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
                    <CardContent>
                        <Stack component="form" spacing={3} onSubmit={handlePasswordSubmit}>
                            <Typography variant="h6" fontWeight={700}>
                                Change password
                            </Typography>
                            {passwordError && <Alert severity="error">{passwordError}</Alert>}
                            {passwordSuccess && <Alert severity="success">{passwordSuccess}</Alert>}

                            <Stack spacing={2}>
                                <TextField
                                    label="Current password"
                                    name="current_password"
                                    type="password"
                                    value={passwordForm.current_password}
                                    onChange={handlePasswordChange}
                                    required
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    label="New password"
                                    name="password"
                                    type="password"
                                    value={passwordForm.password}
                                    onChange={handlePasswordChange}
                                    required
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    label="Confirm new password"
                                    name="password_confirmation"
                                    type="password"
                                    value={passwordForm.password_confirmation}
                                    onChange={handlePasswordChange}
                                    required
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Stack>

                            <Box>
                                <Button type="submit" variant="contained" color="primary" disabled={passwordLoading}>
                                    {passwordLoading ? 'Updating…' : 'Update password'}
                                </Button>
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>
            </Stack>
        </UserLayout>
    );
};

export default UserProfilePage;
