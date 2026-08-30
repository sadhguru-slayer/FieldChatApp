import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

if ('serviceWorker' in navigator) {
  const registerSW = () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    registerSW();
  } else {
    window.addEventListener('load', registerSW);
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
