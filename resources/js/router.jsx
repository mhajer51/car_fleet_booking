import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import AdminUsersPage from './pages/AdminUsersPage.jsx';
import AdminDriversPage from './pages/AdminDriversPage.jsx';
import AdminCarsPage from './pages/AdminCarsPage.jsx';
import AdminBookingsPage from './pages/AdminBookingsPage.jsx';
import UserLoginPage from './pages/UserLoginPage.jsx';
import UserDashboardPage from './pages/UserDashboardPage.jsx';
import UserBookingsPage from './pages/UserBookingsPage.jsx';
import UserCarsPage from './pages/UserCarsPage.jsx';
import UserDriversPage from './pages/UserDriversPage.jsx';
import RequireAdmin from './components/RequireAdmin.jsx';
import RequireUser from './components/RequireUser.jsx';

const AppRouter = () => (
    <Routes>
        <Route path="/" element={<UserLoginPage />} />
        <Route
            path="/portal/dashboard"
            element={
                <RequireUser>
                    <UserDashboardPage />
                </RequireUser>
            }
        />
        <Route
            path="/portal/bookings"
            element={
                <RequireUser>
                    <UserBookingsPage />
                </RequireUser>
            }
        />
        <Route
            path="/portal/cars"
            element={
                <RequireUser>
                    <UserCarsPage />
                </RequireUser>
            }
        />
        <Route
            path="/portal/drivers"
            element={
                <RequireUser>
                    <UserDriversPage />
                </RequireUser>
            }
        />
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
            path="/admin/drivers"
            element={
                <RequireAdmin>
                    <AdminDriversPage />
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
        <Route
            path="/admin/bookings"
            element={
                <RequireAdmin>
                    <AdminBookingsPage />
                </RequireAdmin>
            }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
);

export default AppRouter;
