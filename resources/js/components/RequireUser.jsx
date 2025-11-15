import { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { getUserSession } from '../services/session.js';

const RequireUser = ({ children }) => {
    const session = useMemo(() => getUserSession(), []);

    if (!session?.token) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default RequireUser;
