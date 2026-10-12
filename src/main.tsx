import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register service worker with auto-update
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('PWA: Konten baru tersedia, memperbarui service worker...');
  },
  onOfflineReady() {
    console.log('PWA: Aplikasi siap digunakan offline!');
  },
});

createRoot(document.getElementById('root')!).render(<App />);
