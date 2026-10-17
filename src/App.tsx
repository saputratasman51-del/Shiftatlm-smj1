/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { Layout } from './components/Layout';
import { DashboardSkeleton } from './components/SkeletonLoader';
import Login from './pages/Login';

// Lazy-loaded routes for fast initial bundle and instant app launch
const Dashboard = lazy(() => import('./pages/Dashboard'));
const JadwalShift = lazy(() => import('./pages/JadwalShift'));
const TukarShift = lazy(() => import('./pages/TukarShift'));
const SerahTerima = lazy(() => import('./pages/SerahTerima'));
const Petugas = lazy(() => import('./pages/Petugas'));
const Riwayat = lazy(() => import('./pages/Riwayat'));
const Profil = lazy(() => import('./pages/Profil'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppContent() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-teal-950 flex flex-col items-center justify-center text-white p-6 animate-fade-in">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-white rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-semibold tracking-widest uppercase">Memuat Aplikasi...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Login />;
  }

  return (
    <Layout>
      <Suspense fallback={<DashboardSkeleton />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/jadwal" element={<JadwalShift />} />
          <Route path="/tukar-shift" element={<TukarShift />} />
          <Route path="/serah-terima" element={<SerahTerima />} />
          <Route path="/petugas" element={<Petugas />} />
          <Route path="/riwayat" element={<Riwayat />} />
          <Route path="/profil" element={<Profil />} />
          <Route path="/admin" element={<AdminSettings />} />
          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
