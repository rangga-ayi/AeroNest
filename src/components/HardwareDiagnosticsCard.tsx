import React from 'react';
import { TelemetryRecord, EnvironmentalIndices } from '../types/telemetry';
import { Cpu, Battery, Wifi, Clock, CheckCircle } from 'lucide-react';

export const HardwareDiagnosticsCard: React.FC<{ latest: TelemetryRecord | null; indices: EnvironmentalIndices }> = ({
  latest,
  indices,
}) => {
  return (
    <div className="m3-card p-4 sm:p-5 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-m3-primary" />
            <h3 className="font-bold text-m3-on-surface text-sm font-ui">Hardware Diagnostics</h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-m3-xs bg-m3-primary-container text-m3-on-primary-container">
            ESP8266
          </span>
        </div>

        <div className="mt-3.5 space-y-3">
          {/* Baterai Li-ion */}
          <div className="p-3 rounded-m3-md bg-m3-surface-container-low border border-white/5">
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-m3-on-surface-variant flex items-center gap-1.5"><Battery size={14} /> Li-ion 1S</span>
              <span className={`font-bold ${indices.batteryPercent < 20 ? 'text-m3-error' : 'text-emerald-400'}`}>{indices.batteryPercent}% ({latest?.tegangan_vcc ? `${latest.tegangan_vcc.toFixed(2)}V` : '--'})</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-m3-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${indices.batteryPercent < 20 ? 'bg-m3-error' : 'bg-m3-secondary'}`}
                style={{ width: `${indices.batteryPercent}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-m3-sm bg-m3-surface-container-low">
              <span className="text-[10px] text-m3-on-surface-variant block">AHT20 Sensor</span>
              <span className="text-m3-secondary font-bold flex items-center gap-1 mt-0.5"><CheckCircle size={11} /> OK</span>
            </div>
            <div className="p-2.5 rounded-m3-sm bg-m3-surface-container-low">
              <span className="text-[10px] text-m3-on-surface-variant block">BMP280 Sensor</span>
              <span className="text-m3-secondary font-bold flex items-center gap-1 mt-0.5"><CheckCircle size={11} /> OK</span>
            </div>
            <div className="p-2.5 rounded-m3-sm bg-m3-surface-container-low">
              <span className="text-[10px] text-m3-on-surface-variant block flex items-center gap-1"><Wifi size={10} /> RSSI</span>
              <span className="text-m3-on-surface font-bold mt-0.5 block">{latest?.rssi != null ? `${latest.rssi} dBm` : '--'}</span>
            </div>
            <div className="p-2.5 rounded-m3-sm bg-m3-surface-container-low">
              <span className="text-[10px] text-m3-on-surface-variant block flex items-center gap-1"><Clock size={10} /> Wake</span>
              <span className="text-amber-300 font-bold mt-0.5 block">{latest?.durasi_bangun_ms != null ? `${latest.durasi_bangun_ms} ms` : '--'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
