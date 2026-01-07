import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { UIProvider } from './context/UIContext';
import { LocaleProvider } from './context/LocaleContext';

if (
  import.meta.env.PROD &&
  typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  'serviceWorker' in navigator
) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <LocaleProvider>
      <UIProvider>
        <App />
      </UIProvider>
    </LocaleProvider>
  </React.StrictMode>
);
