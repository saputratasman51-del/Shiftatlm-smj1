import React, { useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  compact = false,
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installing, setInstalling] = useState(false);

  // If already running as standalone PWA app, hide button
  if (isInstalled) {
    return null;
  }

  const handleInstall = async () => {
    try {
      setInstalling(true);
      await install();
    } finally {
      setInstalling(false);
    }
  };

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (compact) {
      return (
        <button
          onClick={handleInstall}
          disabled={installing}
          title="Pasang Aplikasi (PWA)"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer ${className}`}
        >
          <Download className="w-3.5 h-3.5 animate-bounce" />
          <span className="hidden sm:inline">Install PWA</span>
        </button>
      );
    }

    return (
      <div className={`p-3 rounded-2xl bg-gradient-to-r from-teal-900/60 to-slate-900 border border-teal-500/30 text-white ${className}`}>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center shrink-0 text-teal-300">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-teal-200">Aplikasi PWA Siap Dipasang</h4>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
              Akses cepat tanpa browser, responsif offline &amp; hemat kuota.
            </p>
            <button
              onClick={handleInstall}
              disabled={installing}
              className="mt-2.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow transition cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{installing ? 'Memasang...' : 'Pasang di Layar Utama'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        {compact ? (
          <button
            onClick={() => setShowIOSGuide(true)}
            title="Pasang di iPhone/iPad"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-teal-700/80 hover:bg-teal-600 text-teal-100 text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer ${className}`}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Install iOS</span>
          </button>
        ) : (
          <div className={`p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-white ${className}`}>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 text-teal-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-teal-200">Pasang di iPhone / iPad</h4>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                  Jadikan aplikasi layar utama iOS Anda.
                </p>
                <button
                  onClick={() => setShowIOSGuide(true)}
                  className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold border border-teal-500/30 transition cursor-pointer"
                >
                  <Share className="w-3 h-3" />
                  <span>Petunjuk Pasang</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-teal-500/40 p-5 shadow-2xl text-white">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-teal-400" />
                  <h3 className="text-sm font-bold text-white">Pasang di iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                  <div className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </div>
                  <div>
                    Buka aplikasi ini di <strong>Safari</strong> browser, lalu tekan tombol <strong>Bagikan (Share)</strong> <Share className="w-3.5 h-3.5 inline mx-1 text-teal-400" /> di bilah bawah.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                  <div className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <div>
                    Gulir ke bawah pada menu opsi lalu ketuk <strong>Tambah ke Layar Utama (Add to Home Screen)</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-teal-400" />.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                  <div className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </div>
                  <div>
                    Ketik nama atau gunakan default <strong>ShiftATLM</strong> lalu ketuk <strong>Tambah (Add)</strong> di pojok kanan atas.
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold text-xs text-white shadow-lg transition"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback for browsers when beforeinstallprompt has not fired yet or manual browser menu install
  return (
    <>
      {compact ? (
        <button
          onClick={() => setShowIOSGuide(true)}
          title="Pasang Aplikasi (PWA)"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/20 text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5 text-teal-400" />
          <span className="hidden sm:inline">PWA</span>
        </button>
      ) : (
        <div className={`p-3 rounded-2xl bg-slate-900/90 border border-teal-900/50 text-white ${className}`}>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center shrink-0 text-teal-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-teal-200">Mendukung Progressive Web App</h4>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                Bisa dipasang langsung ke Home Screen HP / Desktop via menu browser.
              </p>
              <button
                onClick={() => setShowIOSGuide(true)}
                className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-900/60 hover:bg-teal-800 text-teal-200 text-[11px] font-semibold border border-teal-500/30 transition cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Cara Pasang Aplikasi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-teal-500/40 p-5 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-teal-400" />
                <h3 className="text-sm font-bold text-white">Pasang Aplikasi PWA</h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5 text-xs text-slate-300">
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <p className="font-semibold text-teal-300 mb-1">Di Google Chrome / Android:</p>
                <p>Klik menu titik tiga di pojok kanan atas browser, lalu pilih <strong>&quot;Tambahkan ke Layar Utama&quot;</strong> atau <strong>&quot;Pasang Aplikasi&quot;</strong>.</p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <p className="font-semibold text-teal-300 mb-1">Di iPhone / iPad (Safari):</p>
                <p>Tekan tombol <strong>Bagikan (Share)</strong> lalu pilih <strong>&quot;Tambah ke Layar Utama&quot;</strong>.</p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <p className="font-semibold text-teal-300 mb-1">Di Komputer / Laptop (Edge &amp; Chrome):</p>
                <p>Klik ikon install di ujung kanan bilah alamat (URL bar) untuk memasang sebagai aplikasi desktop mandiri.</p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold text-xs text-white shadow-lg transition"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
};
