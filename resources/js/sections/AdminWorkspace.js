import React from 'react';
import LoginPanel from '../components/LoginPanel.js';
import { useDashboardData } from '../hooks/useDashboardData.js';

const h = React.createElement;

const accentTone = {
    emerald: 'from-emerald-500/10 via-transparent to-transparent border-emerald-400/30',
    sky: 'from-sky-500/10 via-transparent to-transparent border-sky-400/30',
    amber: 'from-amber-500/10 via-transparent to-transparent border-amber-400/30',
};

const MetricCard = ({ metric }) =>
    h(
        'div',
        {
            key: metric.label,
            className: `rounded-2xl border bg-white/5 p-5 backdrop-blur-xl shadow-inner shadow-black/10 ${
                accentTone[metric.accent] ?? ''
            }`,
        },
        h('p', { className: 'text-xs text-slate-400' }, metric.detail),
        h('div', { className: 'mt-2 flex items-end justify-between' },
            h('div', null,
                h('p', { className: 'text-base text-slate-300' }, metric.label),
                h('p', { className: 'text-3xl font-semibold text-white' }, metric.value)
            ),
            h('span', { className: 'text-xs text-emerald-300' }, metric.trend)
        )
    );

const ActivityItem = ({ item }) =>
    h(
        'div',
        { key: item.title, className: 'rounded-2xl border border-white/5 bg-white/5 p-4' },
        h(
            'div',
            { className: 'flex items-center justify-between text-xs text-slate-400' },
            h('span', null, item.time),
            h(
                'span',
                {
                    className: `rounded-full px-3 py-1 text-[11px] font-semibold ${
                        item.tone === 'rose'
                            ? 'bg-rose-400/15 text-rose-200'
                            : item.tone === 'sky'
                              ? 'bg-sky-400/15 text-sky-200'
                              : 'bg-emerald-400/15 text-emerald-200'
                    }`,
                },
                item.badge
            )
        ),
        h('p', { className: 'mt-3 text-sm font-semibold text-white' }, item.title),
        h('p', { className: 'mt-1 text-sm text-slate-300' }, item.description)
    );

const SplitBar = ({ split }) => {
    const total = split.ready + split.enRoute + split.maintenance;
    const portions = [
        { value: split.ready, label: 'جاهز', tone: 'bg-emerald-400' },
        { value: split.enRoute, label: 'قيد التنفيذ', tone: 'bg-sky-400' },
        { value: split.maintenance, label: 'صيانة', tone: 'bg-amber-400' },
    ];
    return h(
        'div',
        { className: 'flex flex-col gap-3' },
        h('div', { className: 'flex h-3 overflow-hidden rounded-full bg-white/10' },
            portions.map((part) =>
                h('div', {
                    key: part.label,
                    className: `${part.tone} transition-all`,
                    style: { width: `${(part.value / total) * 100}%` },
                })
            )
        ),
        h(
            'div',
            { className: 'flex flex-wrap gap-3 text-xs text-slate-300' },
            portions.map((part) =>
                h(
                    'span',
                    { key: part.label, className: 'inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1' },
                    h('span', { className: `h-2 w-2 rounded-full ${part.tone}` }),
                    `${part.label} ${part.value}%`
                )
            )
        )
    );
};

export default function AdminWorkspace() {
    const { data, status } = useDashboardData('admin');
    const metrics = data?.metrics ?? [];
    const activity = data?.activity ?? [];
    const highlights = data?.highlights ?? [];

    return h(
        'section',
        { className: 'rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl space-y-6 shadow-2xl shadow-black/30' },
        h(
            'div',
            { className: 'flex flex-col gap-2' },
            h('div', { className: 'flex items-center justify-between text-xs uppercase tracking-[0.4em] text-slate-400' },
                h('span', null, 'ADMIN HUB'),
                status === 'loading' && h('span', { className: 'text-[10px] text-slate-400' }, 'تحديث البيانات')
            ),
            h('h2', { className: 'text-2xl font-semibold text-white' }, 'منصة التحكم الإدارية')
        ),
        h(LoginPanel, {
            role: 'admin',
            title: 'دخول المشرف العام',
            subtitle: 'الوصول إلى مؤشرات الأسطول وطلبات الصيانة المباشرة.',
            accent: 'emerald',
            fields: [
                { name: 'email', label: 'البريد المؤسسي', placeholder: 'fleet.ops@company.com', type: 'email', autoComplete: 'email' },
                { name: 'password', label: 'كلمة المرور', placeholder: '•••••••••', type: 'password', autoComplete: 'current-password' },
                { name: 'otp', label: 'رمز التحقق اللحظي', placeholder: '123-456', type: 'text', required: false },
            ],
        }),
        metrics.length > 0 &&
            h(
                'div',
                { className: 'grid gap-4 sm:grid-cols-3' },
                metrics.map((metric) => h(MetricCard, { metric }))
            ),
        data?.split &&
            h(
                'div',
                { className: 'rounded-2xl border border-white/5 bg-gradient-to-r from-white/10 to-transparent p-5' },
                h('p', { className: 'text-sm text-slate-300' }, 'نسبة جاهزية الأسطول'),
                h(SplitBar, { split: data.split })
            ),
        activity.length > 0 &&
            h(
                'div',
                { className: 'space-y-3' },
                h('div', { className: 'flex items-center justify-between text-sm text-white' },
                    h('span', null, 'آخر النشاطات'),
                    h('span', { className: 'text-xs text-slate-400' }, 'يتزامن كل 3 دقائق')
                ),
                h('div', { className: 'space-y-3' }, activity.map((item) => h(ActivityItem, { item })))
            ),
        highlights.length > 0 &&
            h(
                'div',
                { className: 'grid gap-3 sm:grid-cols-2' },
                highlights.map((highlight) =>
                    h(
                        'div',
                        {
                            key: highlight.title,
                            className: 'rounded-2xl border border-white/5 bg-white/5 p-4 text-sm text-slate-300',
                        },
                        h('span', { className: 'text-2xl' }, highlight.icon),
                        h('p', { className: 'mt-2 text-base font-semibold text-white' }, highlight.title),
                        h('p', { className: 'text-sm text-slate-300' }, highlight.body)
                    )
                )
            )
    );
}
