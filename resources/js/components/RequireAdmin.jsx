import { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getAdminSession, getUserSession } from '../services/session.js';

const RequireAdmin = ({ children }) => {
    const location = useLocation();
    const adminSession = useMemo(() => getAdminSession(), []);
    const userSession = useMemo(() => getUserSession(), []);

    if (userSession?.token) {
        return <Navigate to="/portal/dashboard" replace />;
    }

    if (!adminSession?.token) {
        return (
            <Navigate
                to="/admin"
                replace
                state={{ from: location.pathname, reason: 'unauthorized' }}
            />
        );
    }

    return children;
};

export default RequireAdmin;
