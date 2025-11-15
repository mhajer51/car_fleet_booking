import { useState } from 'react';
import { Alert, Box, Button, Link, Stack, TextField, Typography } from '@mui/material';
import LoginLayout from '../components/LoginLayout.jsx';
import TokenPreview from '../components/TokenPreview.jsx';
import { loginUser } from '../services/auth.js';

const initialState = { login: '', password: '' };

const UserLoginPage = () => {
    const [form, setForm] = useState(initialState);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [payload, setPayload] = useState(null);

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
            localStorage.setItem('user_session', JSON.stringify(response));
            setPayload(response);
        } catch (err) {
            setPayload(null);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <LoginLayout title="مرحبا بعودتك" subtitle="قم بتسجيل الدخول للوصول إلى لوحة متابعة حجوزاتك.">
            <Stack component="form" spacing={3} onSubmit={handleSubmit}>
                {error && <Alert severity="error">{error}</Alert>}
                {payload && <Alert severity="success">تم تسجيل الدخول بنجاح! تم تخزين التوكن في LocalStorage.</Alert>}

                <TextField
                    name="login"
                    label="البريد الإلكتروني / اسم المستخدم / رقم الموظف"
                    value={form.login}
                    onChange={handleChange}
                    required
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                />
                <TextField
                    name="password"
                    label="كلمة المرور"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                />
                <Button type="submit" variant="contained" size="large" disabled={loading}>
                    {loading ? 'جار التحقق...' : 'تسجيل الدخول'}
                </Button>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                    لست مشرفاً؟ انتقل إلى{' '}
                    <Link href="/admin" underline="hover">
                        تسجيل دخول المشرف
                    </Link>
                </Typography>
            </Stack>

            {payload && (
                <Box mt={5}>
                    <TokenPreview title="بيانات جلسة العميل" payload={payload} />
                </Box>
            )}
        </LoginLayout>
    );
};

export default UserLoginPage;
