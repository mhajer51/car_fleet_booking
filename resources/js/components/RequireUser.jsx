import { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getAdminSession, getUserSession } from '../services/session.js';

const RequireUser = ({ children }) => {
    const location = useLocation();
    const adminSession = useMemo(() => getAdminSession(), []);
    const userSession = useMemo(() => getUserSession(), []);

    if (adminSession?.token) {
        return <Navigate to="/admin/dashboard" replace />;
    }

    if (!userSession?.token) {
        return (
            <Navigate
                to="/"
                replace
                state={{ from: location.pathname, reason: 'unauthorized' }}
            />
        );
    }

    return children;
};

export default RequireUser;
