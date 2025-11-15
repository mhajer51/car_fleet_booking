import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
    ar: {
        translation: {
            'dashboard-title': 'لوحة التحكم التنفيذية',
            'dashboard-total-orders': 'إجمالي الطلبات',
            'dashboard-pending-orders': 'الطلبات المعلّقة',
            'dashboard-successful-orders': 'الطلبات المكتملة',
            'dashboard-rejected-orders': 'الطلبات المرفوضة',
            'dashboard-open-tickets': 'تذاكر الدعم المفتوحة',
            'dashboard-total-sales': 'إجمالي المبيعات',
            'dashboard-total-revenue': 'إجمالي الإيرادات',
            'dashboard-sales': 'منحنى أداء المبيعات',
            'dashboard-announcements': 'آخر التنبيهات',
            'dashboard-no-announcements': 'لا توجد تنبيهات حالياً',
        },
    },
    en: {
        translation: {
            'dashboard-title': 'Executive Dashboard',
            'dashboard-total-orders': 'Total Orders',
            'dashboard-pending-orders': 'Pending Orders',
            'dashboard-successful-orders': 'Successful Orders',
            'dashboard-rejected-orders': 'Rejected Orders',
            'dashboard-open-tickets': 'Open Support Tickets',
            'dashboard-total-sales': 'Total Sales',
            'dashboard-total-revenue': 'Total Revenue',
            'dashboard-sales': 'Sales Performance',
            'dashboard-announcements': 'Announcements',
            'dashboard-no-announcements': 'No announcements at the moment',
        },
    },
};

i18n.use(initReactI18next).init({
    resources,
    lng: 'ar',
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false,
    },
});

export default i18n;
