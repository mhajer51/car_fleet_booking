import './bootstrap';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './pages/App.js';

const mount = document.getElementById('app');

if (mount) {
    const root = createRoot(mount);
    root.render(React.createElement(App));
}
