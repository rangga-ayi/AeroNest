import React, { useState, useMemo } from 'react';
import { TelemetryRecord } from '../types/telemetry';
import { fetchTelemetryFilter } from '../services/firebase';
import { exportToCSV } from '../utils/csvExport';
import {
  X,
  Download,
  Filter,
  Calendar,
  Clock,
  Radio,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Loader2,
  Wifi,
  SlidersHorizontal
} from 'lucide-react';

interface HistoryLogSheetProps {
  isOpen: boolean;
  onClose: () => void;
  history: TelemetryRecord[];
}

type FilterMode = 'live' | 'last' | 'date';
type SortField = 'timestamp' | 'suhu' | 'kelembapan' | 'tekanan' | 'tegangan_vcc' | 'koneksi';
type SortDirection = 'asc' | 'desc';

function getLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const HistoryLogSheet: React.FC<HistoryLogSheetProps> = ({ isOpen, onClose, history }) => {
  // Mode filter aktif & draft
  const [filterMode, setFilterMode] = useState<FilterMode>('live');
  const [customData, setCustomData] = useState<TelemetryRecord[] | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form parameter filter
  const [selectedMode, setSelectedMode] = useState<FilterMode>('live');
  const [lastDataCount, setLastDataCount] = useState<number>(100);
  const [startDate, setStartDate] = useState<string>(() => getLocalDateString());
  const [endDate, setEndDate] = useState<string>(() => getLocalDateString());

  // Sorting & Paginasi
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(12);

  // Tentukan sumber data aktif (data live stream atau hasil filter kustom)
  const sourceData = useMemo(() => {
    if (filterMode === 'live' || customData === null) {
      return history;
    }
    return customData;
  }, [filterMode, customData, history]);

  // Urutkan data berdasarkan kolom dan arah sorting
  const sortedData = useMemo(() => {
    const list = [...sourceData];
    return list.sort((a, b) => {
      let valA: string | number = a[sortField] ?? 0;
      let valB: string | number = b[sortField] ?? 0;

      if (sortField === 'timestamp') {
        valA = new Date(a.timestamp).getTime();
        valB = new Date(b.timestamp).getTime();
      } else if (sortField === 'koneksi') {
        valA = String(a.koneksi || '').toLowerCase();
        valB = String(b.koneksi || '').toLowerCase();
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [sourceData, sortField, sortDir]);

  // Paginasi
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  if (!isOpen) return null;

  // Toggle sorting pada kolom tabel
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setCurrentPage(1);
  };

  // Preset rentang tanggal cepat
  const applyDatePreset = (daysBack: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - daysBack);
    setStartDate(getLocalDateString(start));
    setEndDate(getLocalDateString(end));
  };

  // Eksekusi filter
  const handleApplyFilter = async () => {
    setErrorMessage(null);

    if (selectedMode === 'live') {
      setFilterMode('live');
      setCustomData(null);
      setCurrentPage(1);
      setIsFilterOpen(false);
      return;
    }

    if (selectedMode === 'date') {
      if (!startDate || !endDate) {
        setErrorMessage('Silakan tentukan tanggal mulai dan tanggal akhir.');
        return;
      }
      if (startDate > endDate) {
        setErrorMessage('Tanggal mulai tidak boleh lebih baru dari tanggal akhir.');
        return;
      }
    }

    setIsLoading(true);
    try {
      const records = await fetchTelemetryFilter({
        mode: selectedMode,
        limitCount: lastDataCount,
        startDate,
        endDate,
      });

      if (!records || records.length === 0) {
        setErrorMessage('Tidak ada data telemetri yang ditemukan pada rentang/kriteria ini.');
        setIsLoading(false);
        return;
      }

      setCustomData(records);
      setFilterMode(selectedMode);
      setCurrentPage(1);
      setIsFilterOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memuat data dari Firebase.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset filter ke mode live
  const handleResetToLive = () => {
    setSelectedMode('live');
    setFilterMode('live');
    setCustomData(null);
    setCurrentPage(1);
    setErrorMessage(null);
  };

  // Ekspor CSV
  const handleExportCSV = () => {
    let filename = `AeroNest_Riwayat_Live_${getLocalDateString()}.csv`;
    if (filterMode === 'last') {
      filename = `AeroNest_Riwayat_Terakhir_${customData?.length || lastDataCount}_Data.csv`;
    } else if (filterMode === 'date') {
      filename = `AeroNest_Riwayat_${startDate}_sd_${endDate}.csv`;
    }
    exportToCSV(sortedData, filename);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-5xl bg-m3-surface-container rounded-t-m3-xl sm:rounded-m3-xl border-t sm:border border-white/10 max-h-[92vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-8 sm:zoom-in-95">
        
        {/* M3 Drag Handle (Mobile) */}
        <div className="sm:hidden w-full h-9 flex items-center justify-center cursor-grab" onClick={onClose}>
          <div className="w-12 h-1 bg-white/20 rounded-m3-full" />
        </div>

        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-m3-md bg-m3-surface-container-high border border-white/10 text-m3-primary">
              <Calendar size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-m3-on-surface text-sm sm:text-base font-ui">Riwayat Telemetri Lab</h3>
                {filterMode === 'live' ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-m3-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live (60 Data)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-m3-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono">
                    <SlidersHorizontal size={10} />
                    {filterMode === 'date' ? `${startDate} s.d ${endDate}` : `${customData?.length || 0} Data`}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-m3-on-surface-variant font-mono mt-0.5">
                Total {sortedData.length} baris data • Hal {currentPage} dari {totalPages}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {filterMode !== 'live' && (
              <button
                onClick={handleResetToLive}
                className="touch-target px-2.5 py-1.5 rounded-m3-full bg-m3-surface-container-high text-m3-on-surface hover:text-white border border-white/10 text-xs font-mono gap-1.5 transition-all"
                title="Kembali ke mode live stream"
              >
                <RotateCcw size={12} className="text-emerald-400" />
                <span className="hidden sm:inline">Reset ke Live</span>
              </button>
            )}

            <button
              onClick={() => setIsFilterOpen((prev) => !prev)}
              className={`touch-target px-3 py-1.5 rounded-m3-full text-xs font-mono gap-1.5 border transition-all ${
                isFilterOpen || filterMode !== 'live'
                  ? 'bg-m3-primary/15 text-m3-primary border-m3-primary/30'
                  : 'bg-m3-surface-container-high text-m3-on-surface-variant hover:text-white border-white/10'
              }`}
              aria-label="Filter Data"
            >
              <Filter size={13} />
              <span>Filter Data</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="touch-target px-3 py-1.5 rounded-m3-full bg-m3-primary-container text-m3-on-primary-container hover:bg-m3-primary/20 text-xs font-mono gap-1.5 border border-m3-primary/20 transition-all"
              aria-label="Ekspor CSV"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Ekspor CSV</span>
            </button>

            <button
              onClick={onClose}
              className="touch-target p-2 rounded-m3-full text-m3-on-surface-variant hover:text-white hover:bg-white/5 transition-all"
              aria-label="Tutup"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Collapsible Filter Panel */}
        {isFilterOpen && (
          <div className="p-4 sm:p-5 border-b border-white/10 bg-m3-surface-container-low/95 animate-in slide-in-from-top-4">
            <div className="max-w-4xl mx-auto space-y-4">
              {/* Pilihan Mode Filter */}
              <div>
                <label className="text-xs font-semibold text-m3-on-surface-variant uppercase tracking-wider block mb-2 font-ui">
                  Pilih Mode Penarikan Data:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMode('live')}
                    className={`p-3 rounded-m3-md border text-left transition-all ${
                      selectedMode === 'live'
                        ? 'bg-m3-primary-container/20 border-m3-primary text-m3-primary font-semibold shadow-sm'
                        : 'bg-m3-surface-container border-white/5 text-m3-on-surface-variant hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <Radio size={14} className={selectedMode === 'live' ? 'text-m3-primary' : ''} />
                      <span className="font-ui font-medium">Live Real-time</span>
                    </div>
                    <p className="text-[10px] text-m3-on-surface-variant mt-1 font-mono">
                      Pantau 60 data terakhir secara otomatis
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMode('last')}
                    className={`p-3 rounded-m3-md border text-left transition-all ${
                      selectedMode === 'last'
                        ? 'bg-m3-primary-container/20 border-m3-primary text-m3-primary font-semibold shadow-sm'
                        : 'bg-m3-surface-container border-white/5 text-m3-on-surface-variant hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <Clock size={14} className={selectedMode === 'last' ? 'text-m3-primary' : ''} />
                      <span className="font-ui font-medium">N Data Terakhir</span>
                    </div>
                    <p className="text-[10px] text-m3-on-surface-variant mt-1 font-mono">
                      Tarik riwayat sejumlah N baris terakhir
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMode('date')}
                    className={`p-3 rounded-m3-md border text-left transition-all ${
                      selectedMode === 'date'
                        ? 'bg-m3-primary-container/20 border-m3-primary text-m3-primary font-semibold shadow-sm'
                        : 'bg-m3-surface-container border-white/5 text-m3-on-surface-variant hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar size={14} className={selectedMode === 'date' ? 'text-m3-primary' : ''} />
                      <span className="font-ui font-medium">Rentang Tanggal</span>
                    </div>
                    <p className="text-[10px] text-m3-on-surface-variant mt-1 font-mono">
                      Pilih tanggal mulai & tanggal akhir spesifik
                    </p>
                  </button>
                </div>
              </div>

              {/* Input Dinamis Sesuai Mode */}
              {selectedMode === 'last' && (
                <div className="p-3.5 rounded-m3-md bg-m3-surface-container border border-white/5 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs text-m3-on-surface font-ui">
                      Jumlah baris data yang ingin ditarik (1 - 5000):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={5000}
                        value={lastDataCount}
                        onChange={(e) => setLastDataCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-28 px-3 py-1.5 rounded-m3-sm bg-m3-surface-container-high border border-white/10 text-xs font-mono text-m3-on-surface focus:outline-none focus:border-m3-primary"
                      />
                      <span className="text-xs text-m3-on-surface-variant font-mono">baris</span>
                    </div>
                  </div>
                  {/* Preset Cepat Jumlah Data */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-m3-on-surface-variant font-mono mr-1">Opsi cepat:</span>
                    {[50, 100, 250, 500, 1000].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setLastDataCount(count)}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors ${
                          lastDataCount === count
                            ? 'bg-m3-primary/20 text-m3-primary border-m3-primary/40'
                            : 'bg-m3-surface-container-high text-m3-on-surface-variant border-white/5 hover:text-white'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedMode === 'date' && (
                <div className="p-3.5 rounded-m3-md bg-m3-surface-container border border-white/5 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-m3-on-surface-variant font-mono mr-1">Preset cepat:</span>
                    <button
                      type="button"
                      onClick={() => applyDatePreset(0)}
                      className="px-2.5 py-1 rounded text-xs font-mono bg-m3-surface-container-high text-m3-on-surface-variant hover:text-white border border-white/5"
                    >
                      Hari Ini
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDatePreset(3)}
                      className="px-2.5 py-1 rounded text-xs font-mono bg-m3-surface-container-high text-m3-on-surface-variant hover:text-white border border-white/5"
                    >
                      3 Hari Terakhir
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDatePreset(7)}
                      className="px-2.5 py-1 rounded text-xs font-mono bg-m3-surface-container-high text-m3-on-surface-variant hover:text-white border border-white/5"
                    >
                      7 Hari Terakhir
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDatePreset(30)}
                      className="px-2.5 py-1 rounded text-xs font-mono bg-m3-surface-container-high text-m3-on-surface-variant hover:text-white border border-white/5"
                    >
                      30 Hari Terakhir
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] text-m3-on-surface-variant font-mono block mb-1">Tanggal Mulai:</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-m3-sm bg-m3-surface-container-high border border-white/10 text-xs font-mono text-m3-on-surface focus:outline-none focus:border-m3-primary"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-m3-on-surface-variant font-mono block mb-1">Tanggal Akhir:</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-m3-sm bg-m3-surface-container-high border border-white/10 text-xs font-mono text-m3-on-surface focus:outline-none focus:border-m3-primary"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Feedback Error jika ada */}
              {errorMessage && (
                <div className="p-3 rounded-m3-sm bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono">
                  {errorMessage}
                </div>
              )}

              {/* Tombol Terapkan */}
              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(false)}
                  className="px-4 py-2 rounded-m3-full text-xs font-mono text-m3-on-surface-variant hover:text-white transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleApplyFilter}
                  className="px-5 py-2 rounded-m3-full bg-m3-primary text-m3-on-primary font-semibold text-xs font-ui flex items-center gap-1.5 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all cursor-pointer shadow-md shadow-m3-primary/10"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Menarik Data Firebase...</span>
                    </>
                  ) : (
                    <span>Terapkan Filter</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabel Data Telemetri */}
        <div className="p-3 sm:p-5 overflow-auto flex-1">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-m3-on-surface-variant select-none">
                <th
                  onClick={() => handleSort('timestamp')}
                  className="py-2.5 px-3 hover:text-m3-on-surface cursor-pointer whitespace-nowrap group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Waktu</span>
                    {sortField === 'timestamp' ? (
                      sortDir === 'asc' ? <ChevronUp size={13} className="text-m3-primary" /> : <ChevronDown size={13} className="text-m3-primary" />
                    ) : (
                      <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-40" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('suhu')}
                  className="py-2.5 px-3 hover:text-m3-on-surface cursor-pointer whitespace-nowrap group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Suhu (°C)</span>
                    {sortField === 'suhu' ? (
                      sortDir === 'asc' ? <ChevronUp size={13} className="text-rose-400" /> : <ChevronDown size={13} className="text-rose-400" />
                    ) : (
                      <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-40" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('kelembapan')}
                  className="py-2.5 px-3 hover:text-m3-on-surface cursor-pointer whitespace-nowrap group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Kelembapan (%)</span>
                    {sortField === 'kelembapan' ? (
                      sortDir === 'asc' ? <ChevronUp size={13} className="text-sky-400" /> : <ChevronDown size={13} className="text-sky-400" />
                    ) : (
                      <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-40" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('tekanan')}
                  className="py-2.5 px-3 hover:text-m3-on-surface cursor-pointer whitespace-nowrap group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Tekanan (hPa)</span>
                    {sortField === 'tekanan' ? (
                      sortDir === 'asc' ? <ChevronUp size={13} className="text-emerald-400" /> : <ChevronDown size={13} className="text-emerald-400" />
                    ) : (
                      <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-40" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('tegangan_vcc')}
                  className="py-2.5 px-3 hover:text-m3-on-surface cursor-pointer whitespace-nowrap group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Baterai (V)</span>
                    {sortField === 'tegangan_vcc' ? (
                      sortDir === 'asc' ? <ChevronUp size={13} className="text-amber-400" /> : <ChevronDown size={13} className="text-amber-400" />
                    ) : (
                      <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-40" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('koneksi')}
                  className="py-2.5 px-3 hover:text-m3-on-surface cursor-pointer whitespace-nowrap group hidden md:table-cell"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Koneksi (SSID)</span>
                    {sortField === 'koneksi' ? (
                      sortDir === 'asc' ? <ChevronUp size={13} className="text-m3-primary" /> : <ChevronDown size={13} className="text-m3-primary" />
                    ) : (
                      <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-40" />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-m3-on-surface">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-m3-on-surface-variant font-ui text-sm">
                    Tidak ada data riwayat yang dapat ditampilkan.
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, idx) => {
                  const dateObj = new Date(row.timestamp);
                  const timeStr = dateObj.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });
                  const dateStr = dateObj.toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit',
                  });

                  return (
                    <tr key={row.id || idx} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-semibold text-m3-on-surface leading-tight">{timeStr}</div>
                        <div className="text-[10px] text-m3-on-surface-variant">{dateStr}</div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-rose-400 font-bold">
                        {row.suhu.toFixed(1)}°C
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-sky-400 font-bold">
                        {row.kelembapan.toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-emerald-400 font-bold">
                        {row.tekanan.toFixed(1)}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-amber-400">
                        {row.tegangan_vcc.toFixed(2)}V
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-m3-on-surface-variant hidden md:table-cell">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 text-[11px]">
                          <Wifi size={11} className="text-white/40" />
                          {row.koneksi || '-'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer & Pagination */}
        <div className="flex flex-wrap items-center justify-between p-3.5 sm:px-6 border-t border-white/10 text-xs font-mono text-m3-on-surface-variant gap-3 bg-m3-surface-container-low/50">
          <div className="flex items-center gap-3">
            <span>
              Hal {currentPage} / {totalPages} ({sortedData.length} Data)
            </span>
            <div className="hidden sm:flex items-center gap-1 text-[11px]">
              <span className="text-white/40">Baris:</span>
              {[12, 25, 50, 100].map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                  className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                    pageSize === size
                      ? 'bg-m3-primary/20 text-m3-primary font-bold'
                      : 'hover:text-white text-white/50'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(1)}
              className="touch-target px-2.5 py-1 rounded-m3-sm bg-m3-surface-container-high disabled:opacity-30 hover:text-white transition-colors"
              title="Halaman Pertama"
            >
              «
            </button>
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="touch-target px-3 py-1 rounded-m3-sm bg-m3-surface-container-high disabled:opacity-30 hover:text-white transition-colors"
            >
              Sebelumnya
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="touch-target px-3 py-1 rounded-m3-sm bg-m3-surface-container-high disabled:opacity-30 hover:text-white transition-colors"
            >
              Berikutnya
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="touch-target px-2.5 py-1 rounded-m3-sm bg-m3-surface-container-high disabled:opacity-30 hover:text-white transition-colors"
              title="Halaman Terakhir"
            >
              »
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
