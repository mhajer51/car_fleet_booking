import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.js'],
            refresh: true,
        }),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            react: fileURLToPath(new URL('./resources/js/lib/react-lite.js', import.meta.url)),
            'react-dom/client': fileURLToPath(new URL('./resources/js/lib/react-lite-dom.js', import.meta.url)),
        },
    },
});
