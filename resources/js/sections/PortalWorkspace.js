import React from 'react';
import LoginPanel from '../components/LoginPanel.js';
import { useDashboardData } from '../hooks/useDashboardData.js';

const h = React.createElement;

const portalActions = [
    { label: 'احجز رحلة فورية', detail: 'خلال أقل من 60 ثانية', icon: '⚡️', tone: 'from-violet-500/20' },
    { label: 'تتبع السائق', detail: 'مشاركة الموقع المباشر', icon: '📍', tone: 'from-sky-500/20' },
    { label: 'ارفع طلب VIP', detail: 'منسق شخصي 24/7', icon: '👑', tone: 'from-amber-500/20' },
];

const Metric = ({ metric }) =>
    h(
        'div',
        {
            key: metric.label,
            className: 'rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-4 shadow-inner',
        },
        h('p', { className: 'text-xs text-slate-400' }, metric.detail),
        h('p', { className: 'mt-1 text-base text-slate-200' }, metric.label),
        h('p', { className: 'mt-2 text-3xl font-semibold text-white' }, metric.value),
        h('p', { className: 'text-xs text-emerald-300' }, metric.trend)
    );

const TimelineItem = ({ step }) =>
    h(
        'div',
        { key: step.title, className: 'rounded-2xl border border-white/5 bg-white/5 p-4 flex flex-col gap-2' },
        h('div', { className: 'flex items-center justify-between text-xs text-slate-400' },
            h('span', null, step.time),
            h('span', { className: 'rounded-full bg-white/10 px-3 py-1 text-[11px]' }, step.status)
        ),
        h('p', { className: 'text-base font-semibold text-white' }, step.title),
        h('p', { className: 'text-sm text-slate-300' }, step.location)
    );

const Suggestion = ({ text }) =>
    h(
        'li',
        { className: 'rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300' },
        text
    );

const HeatBar = ({ item }) =>
    h(
        'div',
        { key: item.label },
        h('div', { className: 'flex items-center justify-between text-xs text-slate-300' },
            h('span', null, item.label),
            h('span', { className: 'text-white' }, `${item.value}%`)
        ),
        h('div', { className: 'mt-1 h-2 rounded-full bg-white/10' },
            h('div', {
                className: 'h-full rounded-full bg-gradient-to-r from-violet-400 via-sky-400 to-emerald-300',
                style: { width: `${item.value}%` },
            })
        )
    );

const QuickActions = () =>
    h(
        'div',
        { className: 'grid gap-3 sm:grid-cols-3' },
        portalActions.map((action) =>
            h(
                'div',
                {
                    key: action.label,
                    className: `rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200 backdrop-blur bg-gradient-to-br ${action.tone}`,
                },
                h('div', { className: 'text-2xl' }, action.icon),
                h('p', { className: 'mt-3 text-base font-semibold text-white' }, action.label),
                h('p', { className: 'text-xs text-slate-300' }, action.detail)
            )
        )
    );

export default function PortalWorkspace() {
    const { data } = useDashboardData('portal');
    const metrics = data?.metrics ?? [];
    const timeline = data?.timeline ?? [];
    const suggestions = data?.suggestions ?? [];
    const heatmap = data?.heatmap ?? [];

    return h(
        'section',
        { className: 'rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 via-slate-950/30 to-slate-950/60 p-6 backdrop-blur-xl space-y-6 shadow-2xl shadow-black/30' },
        h(
            'div',
            { className: 'flex flex-col gap-2' },
            h('div', { className: 'flex items-center justify-between text-xs uppercase tracking-[0.4em] text-slate-400' },
                h('span', null, 'PORTAL SPACE'),
                h('span', { className: 'text-[10px] text-slate-400' }, 'live beta')
            ),
            h('h2', { className: 'text-2xl font-semibold text-white' }, 'بوابة العملاء الفاخرة')
        ),
        h(QuickActions),
        h(LoginPanel, {
            role: 'portal',
            title: 'دخول العملاء والشركاء',
            subtitle: 'تتبع الرحلات، إدارة العضويات ومتابعة السائقين من مكان واحد.',
            accent: 'violet',
            fields: [
                { name: 'phone', label: 'رقم الجوال', placeholder: '05x xxx xxxx', type: 'tel', autoComplete: 'tel' },
                { name: 'pin', label: 'رمز التحقق', placeholder: '••••', type: 'password', autoComplete: 'one-time-code' },
            ],
        }),
        metrics.length > 0 &&
            h('div', { className: 'grid gap-4 sm:grid-cols-3' }, metrics.map((metric) => h(Metric, { metric }))),
        timeline.length > 0 &&
            h(
                'div',
                { className: 'space-y-3' },
                h('div', { className: 'flex items-center justify-between text-sm text-white' },
                    h('span', null, 'لوحة المتابعة الحية'),
                    h('span', { className: 'text-xs text-slate-400' }, 'يتم تحديثها كل دقيقتين')
                ),
                h('div', { className: 'space-y-3' }, timeline.map((step) => h(TimelineItem, { step })))
            ),
        suggestions.length > 0 &&
            h(
                'div',
                { className: 'rounded-2xl border border-white/10 bg-white/5 p-5' },
                h('p', { className: 'text-sm font-semibold text-white' }, 'أفكار لتحسين التجربة'),
                h('ul', { className: 'mt-3 space-y-2' }, suggestions.map((item) => h(Suggestion, { text: item, key: item })))
            ),
        heatmap.length > 0 &&
            h(
                'div',
                { className: 'rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3' },
                h('p', { className: 'text-sm font-semibold text-white' }, 'أكثر المدن طلباً الآن'),
                heatmap.map((item) => h(HeatBar, { item }))
            )
    );
}
