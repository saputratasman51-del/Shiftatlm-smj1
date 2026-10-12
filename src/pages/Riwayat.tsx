import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  Search,
  Filter,
  FileSpreadsheet,
  Clock,
  User,
  Printer,
  ChevronRight,
  Eye,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Calendar,
  Layers,
  Wrench,
  Activity,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { Handover, Shift, UserProfile } from '../types';

export default function Riwayat() {
  const { activeProfile, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [handovers, setHandovers] = useState<Handover[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected for full detail modal
  const [selectedDetail, setSelectedDetail] = useState<Handover | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const loadData = async () => {
    setLoading(true);
    try {
      const [allHandovers, allShifts, allProfiles] = await Promise.all([
        dataService.getHandovers(),
        dataService.getShifts(),
        dataService.getProfiles(),
      ]);
      setHandovers(allHandovers);
      setShifts(allShifts);
      setProfiles(allProfiles);
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredHandovers = handovers.filter((h) => {
    const matchSearch =
      h.giver?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.receiver?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.shift_from?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.shift_to?.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchStatus = selectedStatus === 'all' || h.status === selectedStatus;
    const matchStart = !startDate || h.shift_date >= startDate;
    const matchEnd = !endDate || h.shift_date <= endDate;

    return matchSearch && matchStatus && matchStart && matchEnd;
  });

  const totalPages = Math.ceil(filteredHandovers.length / pageSize) || 1;
  const paginatedList = filteredHandovers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePrintDetail = (h: Handover) => {
    setSelectedDetail(h);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  return (
    <div className="space-y-5 animate-fade-in pb-8">
      {/* =========================================================================
          HEADER
      ========================================================================= */}
      <div className="no-print bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Riwayat & Arsip Serah Terima Jaga
            </h1>
            <span className="text-[10px] font-semibold bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full">
              {filteredHandovers.length} Arsip
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar seluruh rekap operan shift laboratorium, status konfirmasi, dan catatan revisi
          </p>
        </div>

        <button
          onClick={() => navigate('/serah-terima')}
          className="flex items-center gap-1.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all self-start md:self-auto min-h-[44px]"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Buat Serah Terima Baru</span>
        </button>
      </div>

      {/* =========================================================================
          SEARCH & FILTER BAR
      ========================================================================= */}
      <div className="no-print bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari nama petugas, shift..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-semibold"
          >
            <option value="all">Semua Status</option>
            <option value="received">Diterima</option>
            <option value="pending">Menunggu Penerimaan</option>
            <option value="draft">Draft</option>
            <option value="revision_needed">Perlu Revisi</option>
          </select>
        </div>

        <div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setCurrentPage(1);
            }}
            title="Dari Tanggal"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-mono"
          />
        </div>

        <div>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setCurrentPage(1);
            }}
            title="Sampai Tanggal"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-mono"
          />
        </div>
      </div>

      {/* =========================================================================
          HANDOVER ARCHIVE LIST
      ========================================================================= */}
      <div className="no-print space-y-3">
        {paginatedList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {paginatedList.map((ho) => (
              <div
                key={ho.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {ho.shift_date}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                        ho.status === 'received'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : ho.status === 'pending'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : ho.status === 'revision_needed'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {ho.status === 'received'
                        ? 'Diterima'
                        : ho.status === 'pending'
                        ? 'Menunggu'
                        : ho.status === 'revision_needed'
                        ? 'Revisi'
                        : 'Draft'}
                    </span>
                  </div>

                  <div className="mt-3">
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                      {ho.shift_from?.name || 'Shift Asal'} &rarr; {ho.shift_to?.name || 'Shift Tujuan'}
                    </h3>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Petugas Penyerah</p>
                        <p className="font-bold text-slate-800 truncate mt-0.5">
                          {ho.giver?.full_name || 'Petugas'}
                        </p>
                        <p className="text-[10px] font-mono text-slate-500 mt-0.5">{ho.given_at?.slice(11, 16)} WIB</p>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Petugas Penerima</p>
                        <p className="font-bold text-slate-800 truncate mt-0.5">
                          {ho.receiver?.full_name || 'Belum Dikonfirmasi'}
                        </p>
                        <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                          {ho.received_at ? `${ho.received_at.slice(11, 16)} WIB` : '-'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                      <span>Total Pemeriksaan:</span>
                      <span className="font-bold font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {ho.total_patients} Pasien
                      </span>
                    </div>

                    {ho.revision_notes && (
                      <div className="mt-2 text-[11px] text-rose-800 bg-rose-50 p-2 rounded-lg border border-rose-200">
                        <strong>Catatan Revisi:</strong> {ho.revision_notes}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                  <button
                    onClick={() => setSelectedDetail(ho)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors min-h-[40px]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Lihat Rincian</span>
                  </button>

                  <button
                    onClick={() => handlePrintDetail(ho)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors min-h-[40px]"
                    title="Cetak Arsip / PDF"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak PDF</span>
                  </button>

                  <button
                    onClick={() => navigate(`/serah-terima?id=${ho.id}`)}
                    className="bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center transition-colors min-h-[40px]"
                    title="Buka Formulir"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
            <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Tidak Ada Riwayat Serah Terima</p>
            <p className="text-xs text-slate-400 mt-0.5">Coba sesuaikan filter status atau tanggal di atas.</p>
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 px-2 text-xs text-slate-600">
            <span>
              Halaman {currentPage} dari {totalPages}
            </span>
            <div className="flex gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-100"
              >
                Sebelumnya
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-100"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL DETAIL / PRINTABLE PDF VIEW
      ========================================================================= */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-auto text-xs space-y-4 print-page">
            {/* Modal action bar (hidden when printing) */}
            <div className="no-print flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                <h3 className="font-bold text-sm text-slate-900">Arsip Serah Terima Jaga Digital</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / PDF</span>
                </button>
                <button
                  onClick={() => setSelectedDetail(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Hospital Letterhead (KOP SURAT RSUD SMJ I) */}
            <div className="text-center pb-3 border-b-2 border-slate-900">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Pemerintah Kabupaten Kayong Utara
              </h2>
              <h1 className="text-base font-extrabold uppercase text-slate-900">
                RSUD Sultan Muhammad Jamaludin I
              </h1>
              <p className="text-[11px] font-semibold text-slate-800">
                Instalasi Laboratorium Klinik & Bank Darah
              </p>
              <p className="text-[9px] text-slate-500">
                Jl. Provinsi Sukadana, Kabupaten Kayong Utara, Kalimantan Barat (Zona Waktu: Asia/Pontianak / WIB)
              </p>
              <h3 className="text-xs font-bold uppercase mt-2 bg-slate-100 py-1 border-t border-b border-slate-300">
                Formulir Serah Terima Jaga Petugas ATLM
              </h3>
            </div>

            {/* Identitas Ringkas */}
            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px]">
              <div>
                <p>
                  <strong className="text-slate-700">Tanggal:</strong> {selectedDetail.shift_date}
                </p>
                <p>
                  <strong className="text-slate-700">Shift Asal:</strong> {selectedDetail.shift_from?.name}
                </p>
                <p>
                  <strong className="text-slate-700">Penyerah:</strong> {selectedDetail.giver?.full_name}
                </p>
                <p>
                  <strong className="text-slate-700">Waktu Penyerahan:</strong> {selectedDetail.given_at?.slice(11, 16)} WIB
                </p>
              </div>
              <div>
                <p>
                  <strong className="text-slate-700">Status:</strong>{' '}
                  <span className="uppercase font-bold text-teal-800">{selectedDetail.status}</span>
                </p>
                <p>
                  <strong className="text-slate-700">Shift Tujuan:</strong> {selectedDetail.shift_to?.name}
                </p>
                <p>
                  <strong className="text-slate-700">Penerima:</strong>{' '}
                  {selectedDetail.receiver?.full_name || 'Menunggu Konfirmasi'}
                </p>
                <p>
                  <strong className="text-slate-700">Total Pasien:</strong>{' '}
                  <span className="font-bold font-mono">{selectedDetail.total_patients} Pasien</span>
                </p>
              </div>
            </div>

            {/* Ringkasan 17 Kategori */}
            {selectedDetail.categories_data && (
              <div>
                <h4 className="font-bold text-slate-800 mb-1.5 flex items-center gap-1.5 text-xs">
                  <Layers className="w-3.5 h-3.5 text-teal-600" />
                  Rincian Pemeriksaan Pasien Berdasarkan Unit Laboratorium:
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                      <tr>
                        <th className="p-2">Unit / Kategori</th>
                        <th className="p-2 text-center">Pasien</th>
                        <th className="p-2">Catatan / Sampel / Kendala</th>
                        <th className="p-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Object.entries(selectedDetail.categories_data)
                        .filter(([_, val]) => val.patient_count > 0 || val.issues_notes || val.ongoing_tests)
                        .map(([catId, val]) => (
                          <tr key={catId} className="hover:bg-slate-50">
                            <td className="p-2 font-semibold text-slate-900">{catId.toUpperCase()}</td>
                            <td className="p-2 text-center font-mono font-bold">{val.patient_count}</td>
                            <td className="p-2 text-slate-600">
                              {val.issues_notes || val.ongoing_tests || val.pending_samples || '-'}
                            </td>
                            <td className="p-2 text-center capitalize">{val.work_status}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tanda Tangan Digital Petugas */}
            <div className="pt-4 grid grid-cols-2 gap-6 text-center text-[11px]">
              <div>
                <p className="text-slate-500">Petugas Yang Menyerahkan,</p>
                <div className="h-14 flex items-center justify-center font-mono text-teal-700 font-bold">
                  [ Tervalidasi Digital ]
                </div>
                <p className="font-bold text-slate-900 underline">{selectedDetail.giver?.full_name}</p>
                <p className="text-[10px] text-slate-400">NIP: {selectedDetail.giver?.nip_str || '-'}</p>
              </div>

              <div>
                <p className="text-slate-500">Petugas Yang Menerima,</p>
                <div className="h-14 flex items-center justify-center font-mono text-teal-700 font-bold">
                  {selectedDetail.status === 'received' ? '[ Tervalidasi Digital ]' : '(Belum Konfirmasi)'}
                </div>
                <p className="font-bold text-slate-900 underline">
                  {selectedDetail.receiver?.full_name || '................................'}
                </p>
                <p className="text-[10px] text-slate-400">NIP: {selectedDetail.receiver?.nip_str || '-'}</p>
              </div>
            </div>

            {/* Close button (hidden when printing) */}
            <div className="no-print pt-3 border-t border-slate-200 text-right">
              <button
                onClick={() => setSelectedDetail(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold px-4 py-2 rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
