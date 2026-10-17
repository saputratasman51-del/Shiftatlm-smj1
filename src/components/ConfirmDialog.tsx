/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, Undo2, X, Loader2 } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  type?: 'danger' | 'warning' | 'cancel' | 'neutral';
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isLoading = false,
  type = 'danger',
}: ConfirmDialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading && isOpen) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  // Configuration based on type
  const isDanger = type === 'danger';
  const isCancel = type === 'cancel';
  const isWarning = type === 'warning';

  const defaultConfirmLabel = isDanger
    ? 'Ya, Hapus'
    : isCancel
    ? 'Ya, Batalkan'
    : 'Ya, Lanjutkan';

  const defaultCancelLabel = isCancel ? 'Lanjut Mengedit' : 'Batal';

  const finalConfirmLabel = confirmLabel || defaultConfirmLabel;
  const finalCancelLabel = cancelLabel || defaultCancelLabel;

  const renderIcon = () => {
    if (isDanger) {
      return (
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
          <Trash2 className="w-7 h-7 text-rose-600" />
        </div>
      );
    }
    if (isCancel) {
      return (
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
          <Undo2 className="w-7 h-7 text-amber-600" />
        </div>
      );
    }
    if (isWarning) {
      return (
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
          <AlertTriangle className="w-7 h-7 text-amber-600" />
        </div>
      );
    }
    return (
      <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center mx-auto shadow-sm">
        <AlertTriangle className="w-7 h-7 text-slate-600" />
      </div>
    );
  };

  const getConfirmBtnClass = () => {
    if (isDanger) {
      return 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/20';
    }
    if (isCancel) {
      return 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-900/20';
    }
    if (isWarning) {
      return 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-900/20';
    }
    return 'bg-slate-800 hover:bg-slate-900 text-white shadow-slate-900/20';
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-fade-in"
    >
      <div
        className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-slate-200 animate-scale-up relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button top-right */}
        {!isLoading && (
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
            title="Tutup dialog"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Icon */}
        <div className="mb-4">{renderIcon()}</div>

        {/* Title & Message */}
        <div className="text-center space-y-2 mb-6">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{message}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs sm:text-sm transition-all active:scale-95 disabled:opacity-50"
          >
            {finalCancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-3 font-bold rounded-xl text-xs sm:text-sm transition-all active:scale-95 shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 ${getConfirmBtnClass()}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>{finalConfirmLabel}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
