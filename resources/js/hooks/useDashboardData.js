import React from 'react';
import { fetchAdminOverview, fetchPortalOverview } from '../services/api.js';

export function useDashboardData(role) {
    const [payload, setPayload] = React.useState({ status: 'loading', data: null });

    React.useEffect(() => {
        let mounted = true;
        const handler = role === 'admin' ? fetchAdminOverview : fetchPortalOverview;
        setPayload({ status: 'loading', data: null });
        handler()
            .then((data) => {
                if (!mounted) return;
                setPayload({ status: 'ready', data });
            })
            .catch(() => {
                if (!mounted) return;
                setPayload({ status: 'error', data: null });
            });
        const timer = setInterval(() => {
            handler()
                .then((data) => {
                    if (!mounted) return;
                    setPayload({ status: 'ready', data });
                })
                .catch(() => {
                    if (!mounted) return;
                    setPayload((prev) => ({ ...prev, status: 'error' }));
                });
        }, 180000);
        return () => {
            mounted = false;
            clearInterval(timer);
        };
    }, [role]);

    return payload;
}
