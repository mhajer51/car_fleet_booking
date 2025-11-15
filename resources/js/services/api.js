import axios from 'axios';

const client = axios.create({
    baseURL: '/api',
    timeout: 4000,
});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const withMock = async (request, fallback) => {
    try {
        const response = await request();
        return response.data;
    } catch (error) {
        if (import.meta?.env?.DEV) {
            console.info('استخدام بيانات تجريبية بسبب عدم توفر الواجهة', error?.message);
        }
        await wait(300 + Math.random() * 400);
        return fallback;
    }
};

export const pingApi = (role) =>
    withMock(
        () => client.get('/health', { params: { role } }),
        {
            ok: true,
            role,
            latency: 120 + Math.round(Math.random() * 80),
            refreshedAt: new Date().toISOString(),
        }
    );

export const authenticate = (role, payload) =>
    withMock(
        () => client.post(`/auth/${role}`, payload),
        {
            status: 'simulated',
            message: 'تمت المصادقة افتراضياً لبيئة العرض',
            issuedAt: new Date().toISOString(),
        }
    );

const adminMock = {
    metrics: [
        {
            label: 'معدل إشغال الأسطول',
            value: '92%',
            detail: 'متوسط آخر 24 ساعة',
            trend: '+4% تحسن',
            accent: 'emerald',
        },
        {
            label: 'رحلات نشطة الآن',
            value: '37',
            detail: 'من أصل 40 مركبة جاهزة',
            trend: '+8 رحلات',
            accent: 'sky',
        },
        {
            label: 'طلبات صيانة عاجلة',
            value: '3',
            detail: 'فرع جدة الصناعي',
            trend: 'تم فتح 1 تذكرة جديدة',
            accent: 'amber',
        },
    ],
    activity: [
        {
            title: 'تفعيل عقد اشتراك لشركة مدار',
            time: 'قبل 6 دقائق',
            badge: 'إجراء تم',
            tone: 'emerald',
            description: 'تمت الموافقة على 12 مركبة تنفيذية مع مراقبة فورية للاستهلاك.',
        },
        {
            title: 'تنبيه صيانة مركبة XG-441',
            time: 'قبل 18 دقيقة',
            badge: 'تنبيه عاجل',
            tone: 'rose',
            description: 'تجاوزت الحرارة الحد المسموح وتم تحويل المركبة لمسار الصيانة.',
        },
        {
            title: 'مسار السائقين الليلي',
            time: 'قبل 1 ساعة',
            badge: 'جاهز',
            tone: 'sky',
            description: 'تمت جدولة 14 سائقاً للدوام الليلي وتأكيد نقاط التسليم.',
        },
    ],
    split: {
        ready: 68,
        enRoute: 22,
        maintenance: 10,
    },
    highlights: [
        {
            title: 'خريطة الحمولة الذكية',
            body: 'تحليل تلقائي لخطوط السير يعيد توزيع المركبات عالية الطلب بشكل آني.',
            icon: '🛰️',
        },
        {
            title: 'مراقبة الوقود',
            body: 'متابعة الاستهلاك مع مؤشر التبذير الذكي يقلل المصروف الشهري بنسبة 14%.',
            icon: '⛽',
        },
    ],
};

const portalMock = {
    metrics: [
        {
            label: 'حجوزات اليوم',
            value: '24',
            detail: '9 رحلات VIP و15 اقتصادية',
            trend: '+12% عن الأمس',
            accent: 'violet',
        },
        {
            label: 'متوسط زمن الوصول',
            value: '07:35 دقيقة',
            detail: 'منذ قبول الطلب حتى الوصول',
            trend: '-40 ثانية',
            accent: 'emerald',
        },
        {
            label: 'العملاء المميزون المتصلون',
            value: '18',
            detail: 'يستخدمون البوابة الآن',
            trend: '+3 عملاء',
            accent: 'sky',
        },
    ],
    timeline: [
        {
            title: 'استلام سيارة ليموزين - السيد فهد',
            time: '10:15',
            location: 'مطار الملك خالد',
            status: 'تم التوصيل',
        },
        {
            title: 'تأكيد حجز Corporate',
            time: '11:05',
            location: 'مركز الملك عبد الله المالي',
            status: 'بانتظار السائق',
        },
        {
            title: 'طلب نقل سريع - وجّه',
            time: '11:22',
            location: 'بوابة الشرق للأعمال',
            status: 'في الطريق',
        },
    ],
    suggestions: [
        'ارسال إشعار ترحيبي بالعربية والإنجليزية لكل مستخدم جديد.',
        'تفعيل وضع الحجز السريع للعملاء المتكررين خلال ساعات الذروة.',
        'عرض رصيد النقاط مباشرةً في أعلى البوابة.'
    ],
    heatmap: [
        { label: 'الرياض', value: 54 },
        { label: 'جدة', value: 28 },
        { label: 'الدمام', value: 18 },
    ],
};

export const fetchAdminOverview = () =>
    withMock(() => client.get('/admin/overview'), adminMock);

export const fetchPortalOverview = () =>
    withMock(() => client.get('/portal/overview'), portalMock);
