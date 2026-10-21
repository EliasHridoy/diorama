import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import './styles.css';
import { setEventSink } from './telemetry.ts';

// Research logging stays off unless asked for (docs/research.md).
if (new URLSearchParams(location.search).get('log') === 'console') {
  setEventSink((event) => console.info('[diorama]', event));
}

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
