import './bootstrap';
import './i18n';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './pages/App.js';

const mount = document.getElementById('app');

if (mount) {
    const page = mount.dataset.page ?? 'showcase';
    const mode = mount.dataset.mode ?? 'dashboard';
    const root = createRoot(mount);
    root.render(React.createElement(App, { page, mode }));
}
