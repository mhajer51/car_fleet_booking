import { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { getAdminSession, getUserSession } from '../services/session.js';

const RequireUser = ({ children }) => {
    const adminSession = useMemo(() => getAdminSession(), []);
    const userSession = useMemo(() => getUserSession(), []);

    if (adminSession?.token) {
        return <Navigate to="/admin/dashboard" replace />;
    }

    if (!userSession?.token) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default RequireUser;
