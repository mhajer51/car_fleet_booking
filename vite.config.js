import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.jsx',
                // لو عندك ملف منفصل للـ admin مثلاً:
                // 'resources/js/admin.jsx',
            ],
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],

    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./resources/js', import.meta.url)),
            // هذا إذا كنت فعلاً تستخدم ملف محلي بدل باكدج react-router-dom
            'react-router-dom': fileURLToPath(
                new URL('./resources/js/lib/react-router-dom.jsx', import.meta.url)
            ),
        },
    },

    server: {
        host: '0.0.0.0',
        port: 5173,
        hmr: {
            host: 'car_fleet_booking.localhost', // نفس الدومين اللي تفتحه في المتصفح
            protocol: 'ws',
            port: 5173,
        },
    },
});
