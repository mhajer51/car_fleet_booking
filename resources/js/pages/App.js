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
        return 'صباح الخير، لننطلق مبكراً!';
    }
    if (hour < 17) {
        return 'نهار مليء بالحركة والتنقل.';
    }
    return 'مساء الأداء العالي لأسطولك.';
};

export default function App() {
    const now = React.useMemo(() => new Date(), []);
    const greeting = React.useMemo(() => greetingMessage(now), [now]);
    const heroDate = React.useMemo(() => formatDate(now), [now]);

    return h(
        'div',
        { className: 'bg-slate-950 text-slate-100 min-h-screen font-sans' },
        h(
            'div',
            { className: 'relative isolate overflow-hidden py-12 sm:py-20' },
            h('div', {
                className:
                    'absolute inset-0 -z-20 bg-gradient-to-br from-blue-900/70 via-slate-950 to-slate-950',
            }),
            h('div', {
                className:
                    'absolute inset-x-0 -top-32 -z-10 blur-3xl opacity-30',
                style: {
                    background:
                        'radial-gradient(circle at 20% 20%, rgba(59,130,246,.8), transparent 60%), radial-gradient(circle at 80% 0%, rgba(14,165,233,.5), transparent 55%)',
                    height: '400px',
                },
            }),
            h(
                'main',
                { className: 'relative z-10 mx-auto max-w-6xl px-4 sm:px-6 space-y-10' },
                h(
                    'header',
                    { className: 'flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-10' },
                    h(
                        'div',
                        { className: 'flex flex-col gap-3 text-center sm:text-left' },
                        h('p', { className: 'text-sm uppercase tracking-[0.3em] text-slate-400' }, 'CAR FLEET OS'),
                        h(
                            'h1',
                            { className: 'text-3xl sm:text-4xl font-semibold text-white' },
                            'لوحتان ذكيتان لإدارة الأسطول والعملاء'
                        ),
                        h('p', { className: 'text-base text-slate-300 max-w-3xl' }, greeting)
                    ),
                    h(
                        'div',
                        { className: 'flex flex-wrap items-center gap-4 justify-center sm:justify-between text-slate-200' },
                        h(
                            'div',
                            { className: 'flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-sm' },
                            h('span', { className: 'inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse' }),
                            h('span', null, 'منصة متصلة بالزمن الحقيقي')
                        ),
                        h(
                            'div',
                            { className: 'text-sm text-slate-300' },
                            heroDate
                        )
                    )
                ),
                h(
                    'div',
                    { className: 'grid gap-8 lg:grid-cols-2' },
                    h(AdminWorkspace),
                    h(PortalWorkspace)
                )
            )
        )
    );
}
