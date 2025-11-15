import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import UserLoginPage from './pages/UserLoginPage.jsx';

const AppRouter = () => (
    <Routes>
        <Route path="/" element={<UserLoginPage />} />
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
);

export default AppRouter;
