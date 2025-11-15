import React from 'react';
import AdminWorkspace from '../sections/AdminWorkspace.js';
import PortalWorkspace from '../sections/PortalWorkspace.js';

const h = React.createElement;

const formatDate = (date) =>
    new Intl.DateTimeFormat('ar', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    }).format(date);

const greetingMessage = (date) => {
    const hour = date.getHours();
    if (hour < 12) {
        return 'صباح مُفعم بالجاهزية.';
    }
    if (hour < 17) {
        return 'نهار مليء بالرحلات والقرارات.';
    }
    return 'مساء الأداء العالي لأسطولك.';
};

const heroCopy = {
    admin: (mode, greeting) => ({
        badge: mode === 'login' ? 'بوابة المشرفين' : 'لوحة تحكم المشرف',
        title:
            mode === 'login'
                ? 'تسجيل دخول فوري وإدارة متقدمة'
                : 'قرارات ذكية لإدارة الأسطول التنفيذي',
        description:
            mode === 'login'
                ? 'أدخل إلى مركز التحكم لمراقبة المركبات، الجداول، وطلبات الصيانة المباشرة.'
                : `${greeting} جميع مؤشرات الأداء يتم تحديثها تلقائياً كل بضع دقائق.`,
    }),
    portal: (mode, greeting) => ({
        badge: 'بوابة العملاء',
        title:
            mode === 'login'
                ? 'تجربة حجز مترفة للضيوف والشركاء'
                : 'لوحة متابعة فورية لرحلات العملاء',
        description:
            mode === 'login'
                ? 'سجّل دخولك لتتبع الطلبات، إدارة العضويات، واستلام الإشعارات بلغتك المفضلة.'
                : `${greeting} نُظهر لك أين السائق، حالة الطلب، ورصيدك مباشرةً.`,
    }),
    showcase: () => ({
        badge: 'CAR FLEET OS',
        title: 'لوحتان ذكيتان لإدارة الأسطول والعملاء',
        description: 'واجهة موحّدة لعرض لوحة المشرف ولوحة العملاء جنباً إلى جنب لمعاينة التجربة.',
    }),
};

const navSets = {
    admin: (mode) => [
        { label: 'تسجيل الدخول', href: '/admin/login', key: 'login', active: mode === 'login' },
        { label: 'لوحة التحكم', href: '/admin', key: 'dashboard', active: mode !== 'login' },
        { label: 'طلبات الحجز', href: '#orders', key: 'orders', disabled: true },
        { label: 'إعدادات النظام', href: '#settings', key: 'settings', disabled: true },
    ],
    portal: (mode) => [
        { label: 'دخول العملاء', href: '/', key: 'login', active: mode === 'login' },
        { label: 'لوحة المتابعة', href: '/portal/dashboard', key: 'dashboard', active: mode !== 'login' },
        { label: 'برنامج الولاء', href: '#loyalty', key: 'loyalty', disabled: true },
        { label: 'الدعم المباشر', href: '#support', key: 'support', disabled: true },
    ],
};

const PrimaryNav = ({ items, brand }) => {
    if (!items || items.length === 0) {
        return null;
    }

    return h(
        'div',
        {
            className:
                'flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between',
        },
        h(
            'div',
            { className: 'flex items-center gap-3 text-sm font-semibold text-white' },
            h(
                'div',
                { className: 'flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-lg' },
                '🚘'
            ),
            h('div', null, h('p', { className: 'text-xs text-slate-400' }, 'CAR FLEET BOOKING'), h('p', null, brand))
        ),
        h(
            'nav',
            { className: 'flex flex-wrap gap-2 text-sm' },
            items.map((item) =>
                item.disabled
                    ? h(
                          'span',
                          {
                              key: item.key,
                              className:
                                  'cursor-not-allowed rounded-full border border-white/5 px-4 py-2 text-slate-500 backdrop-blur-md',
                          },
                          item.label
                      )
                    : h(
                          'a',
                          {
                              key: item.key,
                              href: item.href,
                              className: `rounded-full border px-4 py-2 transition ${
                                  item.active
                                      ? 'border-white/50 bg-white/10 text-white shadow-lg'
                                      : 'border-white/5 text-slate-300 hover:border-white/20 hover:text-white'
                              }`,
                          },
                          item.label
                      )
            )
        )
    );
};

const Header = ({ hero, heroDate, navItems, brand }) =>
    h(
        'header',
        { className: 'flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-10' },
        h(PrimaryNav, { items: navItems, brand }),
        h(
            'div',
            { className: 'flex flex-col gap-3 text-center sm:text-left' },
            h('p', { className: 'text-sm uppercase tracking-[0.3em] text-slate-400' }, hero.badge),
            h('h1', { className: 'text-3xl sm:text-4xl font-semibold text-white' }, hero.title),
            h('p', { className: 'text-base text-slate-300 max-w-3xl' }, hero.description)
        ),
        h(
            'div',
            { className: 'flex flex-wrap items-center gap-4 justify-center sm:justify-between text-slate-200 text-sm' },
            h(
                'div',
                { className: 'flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-xs sm:text-sm' },
                h('span', { className: 'inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse' }),
                h('span', null, 'منصة متصلة بالزمن الحقيقي')
            ),
            h('div', { className: 'text-xs sm:text-sm text-slate-300' }, heroDate)
        )
    );

export default function App({ page = 'showcase', mode = 'dashboard' }) {
    const now = React.useMemo(() => new Date(), []);
    const greeting = React.useMemo(() => greetingMessage(now), [now]);
    const heroDate = React.useMemo(() => formatDate(now), [now]);
    const hero = (heroCopy[page] ?? heroCopy.showcase)(mode, greeting);
    const navItems = navSets[page]?.(mode) ?? [];
    const brand = page === 'admin' ? 'لوحة تحكم المشرف' : page === 'portal' ? 'بوابة العملاء' : 'العرض المتكامل';

    const content =
        page === 'admin'
            ? h('div', { className: 'space-y-8' }, h(AdminWorkspace))
            : page === 'portal'
              ? h('div', { className: 'space-y-8' }, h(PortalWorkspace))
              : h('div', { className: 'grid gap-8 lg:grid-cols-2' }, h(AdminWorkspace), h(PortalWorkspace));

    return h(
        'div',
        { className: 'bg-slate-950 text-slate-100 min-h-screen font-sans' },
        h(
            'div',
            { className: 'relative isolate overflow-hidden py-10 sm:py-16 min-h-screen' },
            h('div', {
                className: 'absolute inset-0 -z-20 bg-gradient-to-br from-blue-900/70 via-slate-950 to-slate-950',
            }),
            h('div', {
                className: 'absolute inset-x-0 -top-48 -z-10 blur-3xl opacity-30',
                style: {
                    background:
                        'radial-gradient(circle at 20% 20%, rgba(59,130,246,.8), transparent 60%), radial-gradient(circle at 80% 0%, rgba(14,165,233,.5), transparent 55%)',
                    height: '480px',
                },
            }),
            h(
                'main',
                { className: 'relative z-10 mx-auto max-w-6xl px-4 sm:px-6 space-y-10 pb-16' },
                h(Header, { hero, heroDate, navItems, brand }),
                page === 'showcase'
                    ? content
                    : h('div', { className: 'max-w-4xl mx-auto w-full' }, content)
            )
        )
    );
}
