import React, { useMemo, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { LaporanAI } from '../types/telemetry';
import { Bot, X, Clock, Copy, Check } from 'lucide-react';

interface AIInsightSheetProps {
  isOpen: boolean;
  onClose: () => void;
  laporan: LaporanAI | null;
}

function bersihkanLatex(teks: string): string {
  return teks
    .replace(/\$\$([^$]+)\$\$/g, '$1')
    .replace(/\$([^$]+)\$/g, '$1');
}

function formatWaktuLaporan(ts: string | number | undefined): string {
  if (!ts) return '--';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return String(ts);
  const tgl = d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const jam = d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${tgl}, ${jam}`;
}

export const AIInsightSheet: React.FC<AIInsightSheetProps> = ({ isOpen, onClose, laporan }) => {
  const [copied, setCopied] = useState(false);

  const sanitizedHtml = useMemo(() => {
    if (!laporan?.laporan_text) {
      return '<div class="p-6 text-center text-m3-on-surface-variant font-ui text-sm">Belum ada laporan analisis AI yang diunggah. Skrip Ollama AI belum dijalankan atau data sedang dimuat.</div>';
    }
    try {
      const clean = bersihkanLatex(String(laporan.laporan_text));
      const parsed = marked.parse(clean, { async: false }) as string;
      return DOMPurify.sanitize(parsed);
    } catch (err) {
      console.error('Gagal memproses markdown AI:', err);
      return `<div class="p-4 text-rose-400 font-mono text-xs">Terjadi kesalahan pemrosesan laporan: ${err instanceof Error ? err.message : String(err)}</div>`;
    }
  }, [laporan?.laporan_text]);

  const handleCopyText = async () => {
    if (!laporan?.laporan_text) return;
    try {
      await navigator.clipboard.writeText(laporan.laporan_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Gagal menyalin teks laporan:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Container: Bottom Sheet di Mobile, Centered Card di Desktop */}
      <div className="w-full sm:max-w-3xl bg-m3-surface-container rounded-t-m3-xl sm:rounded-m3-xl border-t sm:border border-white/10 max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95">
        
        {/* M3 Drag Handle (Touch target 48dp) */}
        <div className="sm:hidden w-full h-10 flex items-center justify-center cursor-grab" onClick={onClose}>
          <div className="w-12 h-1 bg-white/20 rounded-m3-full" />
        </div>

        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-m3-md bg-m3-primary/10 border border-m3-primary/25 text-m3-primary shadow-sm shadow-m3-primary/10">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="font-bold text-m3-on-surface text-sm sm:text-base font-ui tracking-tight">
                Analisis AI Lingkungan & Telemetri
              </h3>
              <p className="text-[11px] text-m3-on-surface-variant font-mono flex items-center gap-1.5 mt-0.5">
                <Clock size={12} className="text-white/40" />
                <span>Terakhir diperbarui: {formatWaktuLaporan(laporan?.timestamp)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {laporan?.laporan_text && (
              <button
                onClick={handleCopyText}
                className="touch-target px-2.5 py-1.5 rounded-m3-full bg-m3-surface-container-high hover:bg-white/10 text-m3-on-surface-variant hover:text-white border border-white/5 text-xs font-mono gap-1.5 transition-all"
                title="Salin isi laporan ke clipboard"
              >
                {copied ? (
                  <>
                    <Check size={13} className="text-emerald-400" />
                    <span className="hidden sm:inline text-emerald-400 font-semibold">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span className="hidden sm:inline">Salin</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={onClose}
              className="touch-target p-2 rounded-m3-full text-m3-on-surface-variant hover:text-white hover:bg-white/5 transition-all"
              aria-label="Tutup"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body dengan Tipografi Bersih & Hierarki Jelas */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1">
          <div
            className="ai-markdown-content selection:bg-m3-primary/30 selection:text-white"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />
        </div>

        {/* Footer Bar (V1-style: Tombol Tutup di Sudut Kanan Bawah) */}
        <div className="px-5 sm:px-6 py-3 border-t border-white/10 flex items-center justify-between bg-m3-surface-container-low/60">
          <span className="text-[11px] text-m3-on-surface-variant font-mono hidden sm:inline">
            AeroNest • Ollama DeepSeek/Qwen Micro-Climate Engine
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 rounded-m3-md bg-white/10 hover:bg-white/15 text-white font-ui font-semibold text-xs transition-all active:scale-95 cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
