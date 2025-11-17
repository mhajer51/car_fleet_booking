import { useMemo, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import AdminLayout from '../components/AdminLayout.jsx';
import { updateAdminProfile } from '../services/admin.js';
import { getAdminSession, updateAdminSession } from '../services/session.js';

const AdminProfilePage = () => {
    const session = useMemo(() => getAdminSession(), []);
    const [form, setForm] = useState({
        name: session?.admin?.name ?? '',
        email: session?.admin?.email ?? '',
        username: session?.admin?.username ?? '',
    });
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
            const response = await updateAdminProfile(form);
            updateAdminSession({ admin: response?.admin });
            setSuccess('Profile updated successfully.');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout title="Profile settings" description="Update your admin details to keep your account current.">
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', maxWidth: 720 }}>
                <CardContent>
                    <Stack component="form" spacing={3} onSubmit={handleSubmit}>
                        <Typography variant="h6" fontWeight={700}>
                            Admin profile
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
                        </Stack>

                        <Box>
                            <Button type="submit" variant="contained" disabled={loading}>
                                {loading ? 'Saving…' : 'Save changes'}
                            </Button>
                        </Box>
                    </Stack>
                </CardContent>
            </Card>
        </AdminLayout>
    );
};

export default AdminProfilePage;
