const FALLBACK_DATA = {
    '/dashboard/orders': {
        totals: {
            totalOrders: { count: 1280, change: { value: 12, unit: 'percent', period: 'آخر 30 يوم' } },
            pendingOrders: { count: 56, change: { value: -4, unit: 'percent', period: 'أسبوع' } },
            successfulOrders: { count: 1164, change: { value: 8, unit: 'percent', period: 'أسبوع' } },
            rejectedOrders: { count: 60, change: { value: -2, unit: 'percent', period: 'أسبوع' } },
            openTickets: { count: 12, change: { value: 3, unit: 'percent', period: '24 ساعة' } },
        },
    },
    '/dashboard/announcements': {
        announcements: [
            { id: 1, title: 'إشعار صيانة', message: 'تمت جدولة صيانة لخمسة مركبات يوم الخميس.' },
            { id: 2, title: 'تذكير السلامة', message: 'يرجى التأكد من تحديث سجل الرحلات لكل سائق قبل نهاية اليوم.' },
        ],
    },
    '/dashboard/sales': {
        totals: {
            totalSales: { amount: 920000, change: { value: 6, unit: 'percent', period: 'ربع سنوي' } },
            totalRevenue: { amount: 1850000, change: { value: 9, unit: 'percent', period: 'ربع سنوي' } },
        },
        series: Array.from({ length: 12 }, (_, index) => ({
            month: index + 1,
            totalSales: Math.round(50000 + Math.random() * 75000),
            serviceBreakdown: {
                flight: Math.round(15000 + Math.random() * 15000),
                hotel: Math.round(10000 + Math.random() * 15000),
                visa: Math.round(5000 + Math.random() * 8000),
                transport: Math.round(8000 + Math.random() * 12000),
            },
        })),
    },
};

function buildHeaders(options) {
    const headers = new Headers(options?.headers || {});

    if (!headers.has('Content-Type') && options?.method && options.method !== 'GET') {
        headers.set('Content-Type', 'application/json');
    }

    if (options?.auth) {
        const tokenMeta = document.head?.querySelector('meta[name="csrf-token"]');
        const token = tokenMeta?.getAttribute('content');
        if (token) {
            headers.set('X-CSRF-TOKEN', token);
        }
    }

    return headers;
}

export async function apiRequest(endpoint, options = {}) {
    const { method = 'GET', data, auth = false, headers: customHeaders } = options;
    const headers = buildHeaders({ headers: customHeaders, method, auth });
    const controller = new AbortController();

    const fetchOptions = {
        method,
        headers,
        signal: controller.signal,
        credentials: 'include',
    };

    if (data && method !== 'GET') {
        fetchOptions.body = JSON.stringify(data);
    }

    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
        const response = await fetch(endpoint, fetchOptions);
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            return response.json();
        }

        return { data: await response.text() };
    } catch (error) {
        console.warn(`Falling back to mocked data for ${endpoint}`, error);
        if (FALLBACK_DATA[endpoint]) {
            return { data: FALLBACK_DATA[endpoint] };
        }
        throw error;
    }
}
