import React from 'react';
import { ArrowRight, Database, Bot, Monitor, Radio } from 'lucide-react';
import { EnvironmentalIndices } from '../types/telemetry';

export const SystemFlowCard: React.FC<{ indices: EnvironmentalIndices }> = ({ indices }) => {
  return (
    <div className="m3-card p-4 sm:p-5 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
          <h3 className="font-bold text-m3-on-surface text-sm font-ui">Pipeline Alur Data</h3>
          <span className="text-[10px] font-mono text-m3-secondary">REALTIME</span>
        </div>

        <div className="my-4 flex items-center justify-between gap-1 p-2.5 rounded-m3-md bg-m3-surface-container-low">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-m3-sm bg-m3-primary-container text-m3-primary flex items-center justify-center mb-1">
              <Radio size={15} />
            </div>
            <span className="text-[9px] font-mono font-bold text-m3-on-surface">ESP8266</span>
          </div>

          <ArrowRight size={12} className="text-slate-500" />

          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-m3-sm bg-amber-500/10 text-amber-400 flex items-center justify-center mb-1">
              <Database size={15} />
            </div>
            <span className="text-[9px] font-mono font-bold text-m3-on-surface">RTDB</span>
          </div>

          <ArrowRight size={12} className="text-slate-500" />

          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-m3-sm bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-1">
              <Bot size={15} />
            </div>
            <span className="text-[9px] font-mono font-bold text-m3-on-surface">Ollama</span>
          </div>

          <ArrowRight size={12} className="text-slate-500" />

          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-m3-sm bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-1">
              <Monitor size={15} />
            </div>
            <span className="text-[9px] font-mono font-bold text-m3-on-surface">AeroNest</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5 text-center text-xs font-mono">
          <div className="p-1.5 rounded-m3-xs bg-m3-surface-container-low">
            <span className="text-[9px] text-m3-on-surface-variant block">SIKLUS</span>
            <span className="text-white font-bold text-[11px]">5 Menit</span>
          </div>
          <div className="p-1.5 rounded-m3-xs bg-m3-surface-container-low">
            <span className="text-[9px] text-m3-on-surface-variant block">RETENSI</span>
            <span className="text-m3-primary font-bold text-[11px]">6 Bulan</span>
          </div>
          <div className="p-1.5 rounded-m3-xs bg-m3-surface-container-low">
            <span className="text-[9px] text-m3-on-surface-variant block">STREAM</span>
            <span className={`font-bold text-[11px] ${indices.isOnline ? 'text-emerald-400' : 'text-slate-400'}`}>
              {indices.isOnline ? 'Aktif' : 'Standby'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
