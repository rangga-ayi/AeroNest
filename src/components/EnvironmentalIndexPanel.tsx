import React from 'react';
import { TelemetryRecord, EnvironmentalIndices } from '../types/telemetry';
import { Wind, Droplet, Activity, CloudSun, ShieldCheck } from 'lucide-react';

interface EnvironmentalIndexPanelProps {
  latest: TelemetryRecord | null;
  indices: EnvironmentalIndices;
}

export const EnvironmentalIndexPanel: React.FC<EnvironmentalIndexPanelProps> = ({ latest, indices }) => {
  return (
    <div className="m3-card p-4 sm:p-5 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h3 className="font-bold text-m3-on-surface text-sm sm:text-base font-ui">Indeks Kenyamanan</h3>
            <p className="text-[11px] text-m3-on-surface-variant font-mono">Mikroklimat & Keamanan Lab</p>
          </div>
          <div className="px-3 py-1 rounded-m3-full bg-m3-primary-container text-m3-on-primary-container font-mono text-xs font-bold">
            {indices.comfortScore}/100
          </div>
        </div>

        {/* Dynamic Multi-Vector Progress Bars */}
        <div className="mt-4 space-y-3.5">
          {/* Suhu */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-m3-on-surface-variant flex items-center gap-1.5"><Wind size={13} className="text-rose-400" /> Kenyamanan Termal</span>
              <span className="font-bold text-rose-300 uppercase">{indices.thermalStatus}</span>
            </div>
            <div className="h-2 w-full bg-m3-surface-container-low rounded-m3-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-400 via-emerald-400 to-rose-500 transition-all duration-500"
                style={{ width: `${Math.min(Math.max(((latest?.suhu || 20) / 45) * 100, 10), 100)}%` }}
              />
            </div>
          </div>

          {/* Kelembapan */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-m3-on-surface-variant flex items-center gap-1.5"><Droplet size={13} className="text-sky-400" /> Risiko Jamur & RH</span>
              <span className="font-bold text-sky-300 uppercase">{indices.humidityStatus}</span>
            </div>
            <div className="h-2 w-full bg-m3-surface-container-low rounded-m3-full overflow-hidden">
              <div
                className="h-full bg-sky-400 transition-all duration-500"
                style={{ width: `${latest?.kelembapan || 0}%` }}
              />
            </div>
          </div>

          {/* Titik Embun */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-m3-on-surface-variant flex items-center gap-1.5"><Activity size={13} className="text-emerald-400" /> Titik Embun (Dew Point)</span>
              <span className="font-bold text-emerald-300">{indices.dewPoint}°C</span>
            </div>
            <div className="h-2 w-full bg-m3-surface-container-low rounded-m3-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-500"
                style={{ width: `${Math.min((indices.dewPoint / 30) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Barometer */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-m3-on-surface-variant flex items-center gap-1.5"><CloudSun size={13} className="text-amber-400" /> Tren Barometer</span>
              <span className="font-bold text-amber-300 uppercase">{indices.pressureTrend}</span>
            </div>
            <div className="h-2 w-full bg-m3-surface-container-low rounded-m3-full overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-500"
                style={{ width: `${Math.min(Math.max((((latest?.tekanan || 1010) - 950) / 100) * 100, 10), 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-m3-on-surface-variant">
        <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-m3-secondary" /> Integritas Sensor</span>
        <span className="text-m3-secondary font-bold">{latest?.status_sensor || 'NOMINAL'}</span>
      </div>
    </div>
  );
};
