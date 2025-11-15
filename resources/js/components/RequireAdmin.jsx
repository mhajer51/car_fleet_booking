import { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { getAdminSession } from '../services/session.js';

const RequireAdmin = ({ children }) => {
    const session = useMemo(() => getAdminSession(), []);

    if (!session?.token) {
        return <Navigate to="/admin" replace />;
    }

    return children;
};

export default RequireAdmin;
