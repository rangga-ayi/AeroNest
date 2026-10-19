import React from 'react';
import { AeroNestLogo } from './AeroNestLogo';
import { TelemetryRecord, EnvironmentalIndices } from '../types/telemetry';
import { Sparkles, Calendar, Download } from 'lucide-react';

interface HeaderNavProps {
  latest: TelemetryRecord | null;
  indices: EnvironmentalIndices;
  onOpenAI: () => void;
  onOpenHistory: () => void;
  onExportCSV: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  latest,
  indices,
  onOpenAI,
  onOpenHistory,
  onExportCSV
}) => {
  return (
    <header className="w-full flex items-center justify-between py-2.5 px-4 sm:px-6 m3-card rounded-m3-lg mb-4 sm:mb-6">
      <AeroNestLogo />

      {/* Quick Telemetry Chips (Desktop only) */}
      <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-m3-full bg-m3-surface-container-low border border-white/5 text-xs font-mono">
        <span className={`w-2 h-2 rounded-full ${indices.isOnline ? 'bg-m3-secondary animate-pulse' : 'bg-m3-error'}`} />
        <span className="text-m3-on-surface-variant">{indices.isOnline ? 'ONLINE' : 'DEEP SLEEP'}</span>
        <span className="text-white/20">|</span>
        <span className="text-m3-primary font-bold">{latest?.suhu ? `${latest.suhu.toFixed(1)}°C` : '--'}</span>
        <span className="text-white/20">|</span>
        <span className="text-sky-300 font-bold">{latest?.kelembapan ? `${latest.kelembapan.toFixed(1)}%` : '--'}</span>
        <span className="text-white/20">|</span>
        <span className="text-emerald-400 font-bold">{indices.batteryPercent}%</span>
      </div>

      {/* Top Action Buttons (48dp Touch Target) */}
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={onOpenAI}
          aria-label="Buka Analisis AI Ollama"
          className="touch-target px-3 rounded-m3-full bg-m3-primary-container text-m3-on-primary-container hover:bg-m3-primary/20 text-xs font-medium transition-all gap-1.5"
        >
          <Sparkles size={16} className="text-m3-primary shrink-0" />
          <span className="hidden sm:inline">AI Insight</span>
        </button>

        <button
          onClick={onOpenHistory}
          aria-label="Buka Tabel Riwayat Data"
          className="touch-target p-2 rounded-m3-full hover:bg-m3-surface-container-high text-m3-on-surface-variant hover:text-m3-on-surface transition-all"
        >
          <Calendar size={18} />
        </button>

        <button
          onClick={onExportCSV}
          aria-label="Ekspor Riwayat ke CSV"
          className="touch-target p-2 rounded-m3-full hover:bg-m3-surface-container-high text-m3-on-surface-variant hover:text-m3-on-surface transition-all"
        >
          <Download size={18} />
        </button>
      </div>
    </header>
  );
};
