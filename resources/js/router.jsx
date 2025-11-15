import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import AdminUsersPage from './pages/AdminUsersPage.jsx';
import AdminCarsPage from './pages/AdminCarsPage.jsx';
import UserLoginPage from './pages/UserLoginPage.jsx';
import RequireAdmin from './components/RequireAdmin.jsx';

const AppRouter = () => (
    <Routes>
        <Route path="/" element={<UserLoginPage />} />
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route
            path="/admin/dashboard"
            element={
                <RequireAdmin>
                    <AdminDashboardPage />
                </RequireAdmin>
            }
        />
        <Route
            path="/admin/users"
            element={
                <RequireAdmin>
                    <AdminUsersPage />
                </RequireAdmin>
            }
        />
        <Route
            path="/admin/cars"
            element={
                <RequireAdmin>
                    <AdminCarsPage />
                </RequireAdmin>
            }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
);

export default AppRouter;
