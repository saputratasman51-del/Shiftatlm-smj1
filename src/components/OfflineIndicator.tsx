/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, CloudCheck } from 'lucide-react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowNotification(true);
      const timer = setTimeout(() => setShowNotification(false), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showNotification) return null;

  return (
    <div className={`fixed bottom-5 left-5 z-40 px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold transition-all duration-300 animate-slide-up ${
      isOnline ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
    }`}>
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4" />
          <span>Koneksi Pulih - Data Tersinkronisasi</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span>Mode Offline - Jadwal &amp; Form Tersedia Lokal</span>
        </>
      )}
    </div>
  );
}
