import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Send Core Web Vitals to GA4 when gtag is available (production),
// otherwise log to console in development.
reportWebVitals(({ name, value, id, delta }) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', name, {
      event_category: 'Web Vitals',
      event_label: id,
      value: Math.round(name === 'CLS' ? delta * 1000 : delta),
      non_interaction: true,
    });
  } else if (process.env.NODE_ENV === 'development') {
    console.log('[Web Vitals]', name, Math.round(value));
  }
});
