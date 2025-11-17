import { useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import AdminLayout from '../components/AdminLayout.jsx';
import { updateAdminPassword } from '../services/admin.js';

const AdminPasswordPage = () => {
    const [form, setForm] = useState({ current_password: '', password: '', password_confirmation: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

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
            await updateAdminPassword(form);
            setSuccess('Password updated successfully.');
            setForm({ current_password: '', password: '', password_confirmation: '' });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout title="Security" description="Update your password to keep your admin account secure.">
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', maxWidth: 720 }}>
                <CardContent>
                    <Stack component="form" spacing={3} onSubmit={handleSubmit}>
                        <Typography variant="h6" fontWeight={700}>
                            Change password
                        </Typography>
                        {error && <Alert severity="error">{error}</Alert>}
                        {success && <Alert severity="success">{success}</Alert>}

                        <Stack spacing={2}>
                            <TextField
                                label="Current password"
                                name="current_password"
                                type="password"
                                value={form.current_password}
                                onChange={handleChange}
                                required
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                            />
                            <TextField
                                label="New password"
                                name="password"
                                type="password"
                                value={form.password}
                                onChange={handleChange}
                                required
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                            />
                            <TextField
                                label="Confirm new password"
                                name="password_confirmation"
                                type="password"
                                value={form.password_confirmation}
                                onChange={handleChange}
                                required
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                            />
                        </Stack>

                        <Box>
                            <Button type="submit" variant="contained" color="primary" disabled={loading}>
                                {loading ? 'Updating…' : 'Update password'}
                            </Button>
                        </Box>
                    </Stack>
                </CardContent>
            </Card>
        </AdminLayout>
    );
};

export default AdminPasswordPage;
