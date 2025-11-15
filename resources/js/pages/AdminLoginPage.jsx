import { useState } from 'react';
import { Alert, Box, Button, Link, Stack, TextField } from '@mui/material';
import LoginLayout from '../components/LoginLayout.jsx';
import TokenPreview from '../components/TokenPreview.jsx';
import { loginAdmin } from '../services/auth.js';

const initialState = { login: '', password: '' };

const AdminLoginPage = () => {
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
            const response = await loginAdmin(form);
            localStorage.setItem('admin_session', JSON.stringify(response));
            setPayload(response);
        } catch (err) {
            setPayload(null);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <LoginLayout title="منطقة التحكم" subtitle="دخول آمن لإدارة الأسطول ومتابعة العمليات لحظة بلحظة.">
            <Stack component="form" spacing={3} onSubmit={handleSubmit}>
                {error && <Alert severity="error">{error}</Alert>}
                {payload && <Alert severity="success">مرحباً أيها المشرف! البيانات أدناه جاهزة للاستهلاك في الواجهة.</Alert>}

                <TextField
                    name="login"
                    label="البريد الإلكتروني / اسم المستخدم"
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
                    {loading ? 'جار التحقق...' : 'تسجيل الدخول كمسؤول'}
                </Button>
                <Link href="/" underline="hover" sx={{ textAlign: 'center' }}>
                    العودة إلى بوابة العملاء
                </Link>
            </Stack>

            {payload && (
                <Box mt={5}>
                    <TokenPreview title="بيانات جلسة المشرف" payload={payload} />
                </Box>
            )}
        </LoginLayout>
    );
};

export default AdminLoginPage;
