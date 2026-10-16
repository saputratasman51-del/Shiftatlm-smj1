/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { Layout } from './components/Layout';

import Dashboard from './pages/Dashboard';
import JadwalShift from './pages/JadwalShift';
import TukarShift from './pages/TukarShift';
import SerahTerima from './pages/SerahTerima';
import Petugas from './pages/Petugas';
import Riwayat from './pages/Riwayat';
import Profil from './pages/Profil';
import AdminSettings from './pages/AdminSettings';
import Login from './pages/Login';

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
