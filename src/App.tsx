/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

function AppContent() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-teal-950 flex items-center justify-center text-white text-sm font-semibold">
        Memuat Aplikasi SHIFT ATLM...
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
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
