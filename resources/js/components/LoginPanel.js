import React from 'react';
import { authenticate, pingApi } from '../services/api.js';

const h = React.createElement;

const accentMap = {
    emerald: 'from-emerald-500/20 via-emerald-400/5 to-transparent border-emerald-400/30',
    violet: 'from-violet-500/20 via-violet-400/5 to-transparent border-violet-400/30',
    sky: 'from-sky-500/20 via-sky-400/5 to-transparent border-sky-400/30',
};

export default function LoginPanel({ role, title, subtitle, accent = 'emerald', fields }) {
    const [formState, setFormState] = React.useState(() =>
        Object.fromEntries(fields.map((field) => [field.name, field.defaultValue ?? '']))
    );
    const [status, setStatus] = React.useState({ type: 'idle', message: 'أدخل بيانات الدخول' });
    const [pulse, setPulse] = React.useState({ ok: true, latency: 0, refreshedAt: null });

    React.useEffect(() => {
        let mounted = true;
        const fetchPulse = () =>
            pingApi(role)
                .then((state) => {
                    if (mounted) {
                        setPulse(state);
                    }
                })
                .catch(() => {
                    if (mounted) {
                        setPulse({ ok: false, latency: null, refreshedAt: null });
                    }
                });
        fetchPulse();
        const interval = setInterval(fetchPulse, 12000);
        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, [role]);

    const onSubmit = (event) => {
        event.preventDefault();
        setStatus({ type: 'loading', message: 'جاري المصادقة على البوابة...' });
        authenticate(role, formState)
            .then((response) => {
                setStatus({
                    type: 'success',
                    message: response?.message ?? 'تم الدخول بنجاح تجريبي.',
                });
            })
            .catch(() => {
                setStatus({ type: 'error', message: 'فشل الاتصال بالخادم، حاول مجدداً.' });
            });
    };

    const badgeClass = pulse.ok ? 'text-emerald-300 bg-emerald-400/15' : 'text-rose-300 bg-rose-400/15';
    const cardTone = accentMap[accent] ?? accentMap.emerald;

    return h(
        'section',
        {
            className: `rounded-2xl border bg-white/5 p-5 sm:p-6 backdrop-blur-xl shadow-xl shadow-black/10 ${cardTone}`,
        },
        h(
            'div',
            { className: 'flex flex-col gap-1' },
            h('p', { className: 'text-xs uppercase tracking-[0.3em] text-slate-400' }, role.toUpperCase()),
            h('h3', { className: 'text-xl font-semibold text-white' }, title),
            h('p', { className: 'text-sm text-slate-300' }, subtitle)
        ),
        h(
            'div',
            { className: 'mt-4 flex items-center justify-between text-xs text-slate-300' },
            h(
                'span',
                { className: `inline-flex items-center gap-2 rounded-full px-3 py-1 ${badgeClass}` },
                h('span', { className: `h-2 w-2 rounded-full ${pulse.ok ? 'bg-emerald-300' : 'bg-rose-300'} animate-pulse` }),
                pulse.ok ? `API متصل • ${pulse.latency}ms` : 'الاتصال متوقف'
            ),
            pulse.refreshedAt && h('span', null, new Date(pulse.refreshedAt).toLocaleTimeString('ar'))
        ),
        h(
            'form',
            { className: 'mt-4 flex flex-col gap-4', onSubmit },
            fields.map((field) =>
                h(
                    'label',
                    { key: field.name, className: 'flex flex-col gap-2 text-sm' },
                    h('span', { className: 'text-slate-200' }, field.label),
                    h('input', {
                        className:
                            'rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-white/40 focus:outline-none',
                        type: field.type ?? 'text',
                        required: field.required ?? true,
                        value: formState[field.name] ?? '',
                        onInput: (event) =>
                            setFormState((prev) => ({
                                ...prev,
                                [field.name]: event.target.value,
                            })),
                        placeholder: field.placeholder,
                        autoComplete: field.autoComplete,
                    })
                )
            ),
            h(
                'div',
                { className: 'flex items-center justify-between text-xs text-slate-400' },
                h(
                    'label',
                    { className: 'inline-flex items-center gap-2' },
                    h('input', {
                        type: 'checkbox',
                        className: 'h-4 w-4 rounded border-white/20 bg-transparent accent-emerald-400',
                        defaultChecked: true,
                    }),
                    'تذكرني 7 أيام'
                ),
                h(
                    'a',
                    { className: 'text-emerald-300 hover:text-emerald-200 cursor-pointer' },
                    'نسيت كلمة المرور؟'
                )
            ),
            h(
                'button',
                {
                    type: 'submit',
                    className:
                        'mt-2 rounded-2xl bg-gradient-to-r from-white/80 via-white to-emerald-200/80 px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-500/30 transition hover:translate-y-0.5',
                    disabled: status.type === 'loading',
                },
                status.type === 'loading' ? 'جاري المزامنة...' : 'تسجيل الدخول الآمن'
            )
        ),
        h(
            'p',
            {
                className: `mt-3 text-xs ${
                    status.type === 'error'
                        ? 'text-rose-300'
                        : status.type === 'success'
                          ? 'text-emerald-300'
                          : 'text-slate-400'
                }`,
            },
            status.message
        )
    );
}
