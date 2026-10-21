import React, { useState, useMemo, useRef, useEffect, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import {
  Lock,
  Unlock,
  RotateCcw,
  Cpu,
  Battery,
  Gauge,
  Activity,
  Thermometer,
  Droplets,
  Download,
  Sparkles,
  Sun,
  RefreshCw,
  X,
  Radio,
  Menu,
} from 'lucide-react';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { TelemetryRecord, EnvironmentalIndices, LaporanAI } from '../../types/telemetry';
import { LabWorkstationScene } from './LabWorkstationScene';
import { TimeOfDay } from './effects/DayNightAtmosphere3D';

export interface LabCanvas3DProps {
  latest: TelemetryRecord | null;
  indices: EnvironmentalIndices;
  laporanAI?: LaporanAI | null;
  onOpenAIDrawer?: () => void;
}

// Komponen Fallback ketika browser atau GPU tidak mendukung WebGL
export const WebGLFallbackCard: React.FC<{ latest: TelemetryRecord | null }> = ({ latest }) => (
  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-m3-surface-container-low select-none">
    <Cpu size={36} className="text-m3-primary mb-2" />
    <h3 className="text-sm font-bold text-m3-on-surface font-ui">3D Hardware Digital Twin</h3>
    <p className="text-xs text-m3-on-surface-variant max-w-sm mt-1">
      Akselerasi grafis WebGL tidak aktif di peramban ini. Menampilkan status telemetri hardware langsung:
    </p>
    <div className="flex gap-4 mt-4 font-mono text-xs">
      <span className="p-2 bg-m3-surface-container rounded-m3-md text-m3-on-surface">
        Suhu: {latest?.suhu !== undefined ? `${latest.suhu}°C` : '--'}
      </span>
      <span className="p-2 bg-m3-surface-container rounded-m3-md text-m3-on-surface">
        VCC: {latest?.tegangan_vcc !== undefined ? `${latest.tegangan_vcc}V` : '--'}
      </span>
      <span className="p-2 bg-m3-surface-container rounded-m3-md text-m3-on-surface">
        RH: {latest?.kelembapan !== undefined ? `${latest.kelembapan}%` : '--'}
      </span>
    </div>
  </div>
);

export const sanitizeMarkdownSummary = (rawText?: string | null): string => {
  if (!rawText || !rawText.trim()) {
    return 'Menunggu data analitik AI...';
  }

  const cleaned = rawText
    .replace(/#+/g, ' ')
    .replace(/[*_`>~^]/g, ' ')
    .replace(/^\s*-\s+/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return 'Menunggu data analitik AI...';

  const MAX_CHARS = 105;
  if (cleaned.length <= MAX_CHARS) return cleaned;
  return cleaned.slice(0, MAX_CHARS).trim() + '...';
};

export function getLaypersonRoomSummary(
  latest: TelemetryRecord | null,
  indices: EnvironmentalIndices
): { headline: string; subline: string } {
  if (!latest) {
    return {
      headline: 'Menghubungkan ke sensor kamar...',
      subline: 'Memeriksa telemetri...',
    };
  }

  let thermalLabel = 'Nyaman & Ideal';
  if (latest.suhu >= 33) thermalLabel = 'Panas / Perlu Kipas/AC';
  else if (latest.suhu >= 29) thermalLabel = 'Hangat / Gerah';
  else if (latest.suhu < 24) thermalLabel = 'Sejuk & Dingin';

  return {
    headline: `Status Kamar: ${thermalLabel} (${latest.suhu.toFixed(1)}°C, ${latest.kelembapan.toFixed(0)}%)`,
    subline: `Tekanan ${latest.tekanan.toFixed(1)} hPa (${indices.pressureTrend}) • Baterai ${indices.batteryPercent}%`,
  };
}

export interface Demo3DState {
  enabled: boolean;
  isExpanded: boolean;
  suhu: number;
  kelembapan: number;
  tekanan: number;
  tegangan_vcc: number;
  timeOfDay: TimeOfDay;
  isOnline: boolean;
  isTransmitting: boolean;
}

export interface DemoPreset {
  id: string;
  label: string;
  icon: string;
  badge: string;
  suhu: number;
  kelembapan: number;
  tekanan: number;
  tegangan_vcc: number;
  timeOfDay: TimeOfDay;
  isOnline: boolean;
  isTransmitting: boolean;
  desc: string;
}

export const DEMO_PRESETS: DemoPreset[] = [
  {
    id: 'cerah',
    label: 'Cerah Siang',
    icon: '☀️',
    badge: '1016 hPa • Cerah',
    suhu: 26.5,
    kelembapan: 52,
    tekanan: 1016,
    tegangan_vcc: 4.10,
    timeOfDay: 'siang',
    isOnline: true,
    isTransmitting: false,
    desc: 'Langit cerah membiru, matahari terik bersinar, suhu kamar nyaman',
  },
  {
    id: 'hujan',
    label: 'Hujan Badai',
    icon: '🌧️',
    badge: '1004 hPa • 88% RH',
    suhu: 22.0,
    kelembapan: 88,
    tekanan: 1004,
    tegangan_vcc: 3.90,
    timeOfDay: 'siang',
    isOnline: true,
    isTransmitting: true,
    desc: 'Tekanan rendah, awan gelap mendung, hujan animatif & embun kaca jendela',
  },
  {
    id: 'sore',
    label: 'Sore Santai',
    icon: '🌅',
    badge: 'Golden Hour • Sore',
    suhu: 27.5,
    kelembapan: 58,
    tekanan: 1012,
    tegangan_vcc: 3.95,
    timeOfDay: 'sore',
    isOnline: true,
    isTransmitting: false,
    desc: 'Langit sore oranye keemasan, lampu meja & lampu nakas menyala hangat',
  },
  {
    id: 'malam',
    label: 'Malam Tenang',
    icon: '🌙',
    badge: 'Malam • Bintang',
    suhu: 21.5,
    kelembapan: 64,
    tekanan: 1013,
    tegangan_vcc: 3.85,
    timeOfDay: 'malam',
    isOnline: true,
    isTransmitting: false,
    desc: 'Langit malam gelap, bulan sabit, taburan bintang & lampu tidur redup',
  },
  {
    id: 'panas',
    label: 'Panas Terik',
    icon: '🔥',
    badge: '35.5°C • Kritis',
    suhu: 35.5,
    kelembapan: 32,
    tekanan: 1009,
    tegangan_vcc: 3.70,
    timeOfDay: 'siang',
    isOnline: true,
    isTransmitting: true,
    desc: 'Suhu kritis >33°C, aura termal oranye, ring LED merah, daun tanaman menguning',
  },
];

export interface SceneExporterBridgeProps {
  exportTrigger: number;
  onExportDone: () => void;
}

export const SceneExporterBridge: React.FC<SceneExporterBridgeProps> = ({ exportTrigger, onExportDone }) => {
  const { scene } = useThree();

  React.useEffect(() => {
    if (exportTrigger === 0) return;

    try {
      const exporter = new GLTFExporter();
      exporter.parse(
        scene,
        (gltf) => {
          const blob = new Blob([gltf as ArrayBuffer], { type: 'model/gltf-binary' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `aeronest-scene-${new Date().toISOString().slice(0, 10)}.glb`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(link.href), 1000);
          onExportDone();
        },
        (error) => {
          console.error('Gagal mengekspor GLB:', error);
          alert('Gagal mengekspor 3D scene ke format .glb');
          onExportDone();
        },
        { binary: true }
      );
    } catch (err) {
      console.error('Ekspor GLB gagal:', err);
      onExportDone();
    }
  }, [exportTrigger, scene, onExportDone]);

  return null;
};



export const LabCanvas3D: React.FC<LabCanvas3DProps> = ({
  latest,
  indices,
}) => {
  const [controlsEnabled, setControlsEnabled] = useState(false);
  const [activeInspect, setActiveInspect] = useState<'wemos' | 'battery' | 'sensor' | null>(null);
  const [cameraKey, setCameraKey] = useState(0);
  const [showQuickSummary, setShowQuickSummary] = useState(false);
  const [isDemoMenuOpen, setIsDemoMenuOpen] = useState(false);
  const [exportTrigger, setExportTrigger] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const demoMenuRef = useRef<HTMLDivElement>(null);

  // Tutup popup ringkasan saat mengklik di luar area popup atau menekan tombol Escape
  useEffect(() => {
    if (!showQuickSummary) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (summaryRef.current && !summaryRef.current.contains(event.target as Node)) {
        setShowQuickSummary(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowQuickSummary(false);
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showQuickSummary]);

  // Tutup popup menu demo saat mengklik di luar area popup atau menekan tombol Escape
  useEffect(() => {
    if (!isDemoMenuOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (demoMenuRef.current && !demoMenuRef.current.contains(event.target as Node)) {
        setIsDemoMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDemoMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDemoMenuOpen]);

  // State Mode Demo Visual 3D (Hanya memengaruhi tampilan 3D lokal)
  const [demoState, setDemoState] = useState<Demo3DState>({
    enabled: false,
    isExpanded: true,
    suhu: latest?.suhu ?? 26.5,
    kelembapan: latest?.kelembapan ?? 55,
    tekanan: latest?.tekanan ?? 1012,
    tegangan_vcc: latest?.tegangan_vcc ?? 3.95,
    timeOfDay: 'siang',
    isOnline: indices.isOnline ?? true,
    isTransmitting: false,
  });

  // Nilai telemetri efektif (Mode Demo mengisolasi visual 3D dari data Firebase asli)
  const effectiveLatest = useMemo<TelemetryRecord | null>(() => {
    if (!demoState.enabled) return latest;
    return {
      id: latest?.id ?? 'demo-telemetry',
      timestamp: new Date().toISOString(),
      suhu: demoState.suhu,
      kelembapan: demoState.kelembapan,
      tekanan: demoState.tekanan,
      tegangan_vcc: demoState.tegangan_vcc,
      durasi_bangun_ms: demoState.isTransmitting ? 450 : 0,
      epoch: Math.floor(Date.now() / 1000),
      created_at: new Date().toISOString(),
      source: 'demo_simulation',
      dew_point: demoState.suhu - ((100 - demoState.kelembapan) / 5),
      heat_index: demoState.suhu,
      humidity_abs: 18.5,
      vapor_pressure: 2.34,
      vpd: 1.1,
      altitude_est: 650,
      air_density: 1.18,
      sealevel_pressure: demoState.tekanan + 75,
      battery_percent: Math.min(Math.max(Math.round(((demoState.tegangan_vcc - 3.2) / 1.0) * 100), 0), 100),
      is_battery_critical: demoState.tegangan_vcc < 3.3,
      rssi: -62,
      koneksi: 'AeroNest-Demo',
      status_daya: demoState.tegangan_vcc < 3.3 ? 'kritis' : 'normal',
    };
  }, [demoState, latest]);

  const effectiveIndices = useMemo<EnvironmentalIndices>(() => {
    if (!demoState.enabled) return indices;
    const batt = Math.min(Math.max(Math.round(((demoState.tegangan_vcc - 3.2) / 1.0) * 100), 0), 100);
    const dew = demoState.suhu - ((100 - demoState.kelembapan) / 5);
    const thermal: 'sejuk' | 'nyaman' | 'hangat' | 'kritis' =
      demoState.suhu >= 33 ? 'kritis' : demoState.suhu >= 29 ? 'hangat' : demoState.suhu < 24 ? 'sejuk' : 'nyaman';
    const humidity: 'kering' | 'nyaman' | 'lembap' | 'jamur' =
      demoState.kelembapan > 70 ? 'jamur' : demoState.kelembapan < 40 ? 'kering' : 'nyaman';
    const trend: 'naik' | 'stabil' | 'turun' =
      demoState.tekanan >= 1013 ? 'naik' : demoState.tekanan <= 1008 ? 'turun' : 'stabil';

    return {
      comfortScore: demoState.suhu >= 24 && demoState.suhu <= 28 ? 95 : 60,
      dewPoint: dew,
      thermalStatus: thermal,
      humidityStatus: humidity,
      pressureTrend: trend,
      batteryPercent: batt,
      isOnline: demoState.isOnline,
    };
  }, [demoState, indices]);

  const activeLatest = demoState.enabled ? effectiveLatest : latest;
  const activeIndices = demoState.enabled ? effectiveIndices : indices;
  const roomSummary = getLaypersonRoomSummary(activeLatest, activeIndices);

  const applyPreset = (preset: DemoPreset) => {
    setDemoState((prev) => ({
      ...prev,
      suhu: preset.suhu,
      kelembapan: preset.kelembapan,
      tekanan: preset.tekanan,
      tegangan_vcc: preset.tegangan_vcc,
      timeOfDay: preset.timeOfDay,
      isOnline: preset.isOnline,
      isTransmitting: preset.isTransmitting,
    }));
  };

  const resetToLiveSensor = () => {
    setDemoState((prev) => ({
      ...prev,
      suhu: latest?.suhu ?? 26.5,
      kelembapan: latest?.kelembapan ?? 55,
      tekanan: latest?.tekanan ?? 1012,
      tegangan_vcc: latest?.tegangan_vcc ?? 3.95,
      timeOfDay: 'siang',
      isOnline: indices.isOnline ?? true,
      isTransmitting: false,
    }));
  };

  const resetCamera = () => {
    setCameraKey((prev) => prev + 1);
  };

  const handleExportGLB = () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportTrigger((prev) => prev + 1);
  };

  return (
    <div className="relative w-full h-[300px] sm:h-[380px] md:h-[450px] m3-card overflow-hidden select-none">
      {/* 1. WebGL 3D Canvas (Lapisan Dasar / Background Layer - z-0) */}
      <div className="absolute inset-0 z-0">
        <Canvas
          key={cameraKey}
          fallback={<WebGLFallbackCard latest={activeLatest} />}
          shadows
          orthographic
          className="touch-pan-y-canvas"
          camera={{ position: [15.36, 8.19, 21.37], zoom: 75.2, near: 0.1, far: 1000 }}
        >
          {/* Fill light lembut pelengkap agar sudut ruangan tetap berdimensi tanpa overexposure */}
          <directionalLight
            position={[12, 20, 10]}
            intensity={0.35}
          />

          <Suspense fallback={null}>
            <LabWorkstationScene
              latest={activeLatest}
              indices={activeIndices}
              timeOfDay={demoState.enabled ? demoState.timeOfDay : undefined}
              onInspectHardware={(type) => setActiveInspect(type)}
            />
          </Suspense>

          <SceneExporterBridge
            exportTrigger={exportTrigger}
            onExportDone={() => setIsExporting(false)}
          />

          <OrbitControls
            makeDefault
            enableDamping
            dampingFactor={0.05}
            enableRotate={controlsEnabled}
            enableZoom={controlsEnabled}
            enablePan={false}
            target={[0, 0.75, 0]}
            minZoom={45}
            maxZoom={220}
            minPolarAngle={Math.PI / 5}
            maxPolarAngle={Math.PI / 2.15}
            minAzimuthAngle={0.08}
            maxAzimuthAngle={Math.PI / 2.1}
          />
        </Canvas>
      </div>

      {/* 2. Menu FAB Mode Demo di Sudut Kanan Atas (z-40) */}
      <div ref={demoMenuRef} className="absolute top-3 right-4 z-40">
        <button
          onClick={() => setIsDemoMenuOpen((prev) => !prev)}
          className={`touch-target relative p-2 rounded-m3-full border shadow-md backdrop-blur-md transition-all flex items-center justify-center cursor-pointer ${
            isDemoMenuOpen
              ? 'bg-amber-500 text-white border-amber-400 shadow-amber-500/30 ring-2 ring-amber-400/40'
              : demoState.enabled
              ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white border-amber-400/60 shadow-amber-500/25'
              : 'bg-m3-surface-container-high/90 text-slate-300 border-white/10 hover:border-amber-400/50 hover:text-amber-400 hover:scale-105 active:scale-95'
          }`}
          title={isDemoMenuOpen ? 'Tutup Pengatur Mode Demo' : 'Pengatur Mode Demo Visual 3D'}
          aria-label="Pengatur Mode Demo Visual 3D"
        >
          <Menu size={16} />
          {demoState.enabled && !isDemoMenuOpen && (
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5" title="Mode Demo Aktif">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500 border border-slate-900"></span>
            </span>
          )}
        </button>

        {/* Popup Pengatur Mode Demo Visual 3D */}
        {isDemoMenuOpen && (
          <div
            className="absolute top-full mt-2.5 right-0 w-[310px] sm:w-[340px] p-3 rounded-m3-xl bg-m3-surface-container-high/95 border border-amber-500/40 backdrop-blur-md shadow-2xl animate-in fade-in select-none max-h-[280px] sm:max-h-[350px] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Header Panel Demo */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Sparkles size={13} />
                </div>
                <div>
                  <h3 className="text-xs font-bold font-ui text-m3-on-surface flex items-center gap-1.5 leading-none">
                    Pengatur Visual 3D
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-semibold ${
                      demoState.enabled ? 'bg-amber-500/20 text-amber-300' : 'bg-white/10 text-slate-400'
                    }`}>
                      {demoState.enabled ? 'Demo Aktif' : 'Sensor Asli'}
                    </span>
                  </h3>
                  <p className="text-[10px] text-m3-on-surface-variant font-mono mt-0.5 leading-tight">
                    Hanya memengaruhi visual 3D • Sensor asli aman
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDemoMenuOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                title="Tutup Menu Demo"
              >
                <X size={15} />
              </button>
            </div>

            {/* Switch ON / OFF Mode Demo */}
            <div className="mt-2.5 p-2 rounded-m3-lg bg-m3-surface-container-low/90 border border-white/5 flex items-center justify-between">
              <div className="pr-2">
                <span className="text-[11px] font-bold font-ui text-m3-on-surface block leading-tight">
                  Status Mode Demo
                </span>
                <span className="text-[9px] text-m3-on-surface-variant font-mono block mt-0.5">
                  {demoState.enabled ? 'Simulasi visual aktif' : 'Sensor live IoT aktif'}
                </span>
              </div>

              {/* Segmented Buttons ON / OFF */}
              <div className="flex items-center bg-black/40 p-0.5 rounded-full border border-white/10 shrink-0">
                <button
                  type="button"
                  onClick={() => setDemoState((prev) => ({ ...prev, enabled: false }))}
                  className={`px-3 py-1 text-[10px] font-mono font-bold rounded-full transition-all cursor-pointer ${
                    !demoState.enabled
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Matikan Mode Demo (Kembali ke Sensor Live)"
                >
                  OFF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDemoState((prev) => ({
                      ...prev,
                      enabled: true,
                      suhu: !prev.enabled && latest?.suhu !== undefined ? latest.suhu : prev.suhu,
                      kelembapan: !prev.enabled && latest?.kelembapan !== undefined ? latest.kelembapan : prev.kelembapan,
                      tekanan: !prev.enabled && latest?.tekanan !== undefined ? latest.tekanan : prev.tekanan,
                      tegangan_vcc: !prev.enabled && latest?.tegangan_vcc !== undefined ? latest.tegangan_vcc : prev.tegangan_vcc,
                      isOnline: !prev.enabled && indices.isOnline !== undefined ? indices.isOnline : prev.isOnline,
                    }));
                  }}
                  className={`px-3 py-1 text-[10px] font-mono font-bold rounded-full transition-all cursor-pointer ${
                    demoState.enabled
                      ? 'bg-gradient-to-r from-amber-500 to-emerald-500 text-white shadow-sm shadow-emerald-500/25'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Aktifkan Mode Demo Visual 3D"
                >
                  ON
                </button>
              </div>
            </div>

            {!demoState.enabled ? (
              <div className="mt-2.5 p-3 rounded-m3-lg bg-white/5 border border-dashed border-white/10 text-center">
                <p className="text-[11px] text-slate-300 font-ui font-medium">
                  Mode Demo sedang <span className="text-rose-400 font-bold">OFF</span>
                </p>
                <p className="text-[10px] text-m3-on-surface-variant font-mono mt-1">
                  Tampilan 3D saat ini sinkron dengan data sensor live IoT ({latest?.suhu !== undefined ? `${latest.suhu.toFixed(1)}°C` : '--'} • {latest?.kelembapan !== undefined ? `${latest.kelembapan.toFixed(0)}%` : '--'} • {latest?.tekanan !== undefined ? `${latest.tekanan.toFixed(0)} hPa` : '--'}).
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setDemoState((prev) => ({
                      ...prev,
                      enabled: true,
                      suhu: latest?.suhu !== undefined ? latest.suhu : prev.suhu,
                      kelembapan: latest?.kelembapan !== undefined ? latest.kelembapan : prev.kelembapan,
                      tekanan: latest?.tekanan !== undefined ? latest.tekanan : prev.tekanan,
                      tegangan_vcc: latest?.tegangan_vcc !== undefined ? latest.tegangan_vcc : prev.tegangan_vcc,
                      isOnline: indices.isOnline !== undefined ? indices.isOnline : prev.isOnline,
                    }));
                  }}
                  className="mt-2.5 px-3 py-1.5 rounded-m3-md bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-white border border-amber-500/40 text-[10px] font-mono font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Sparkles size={11} /> Nyalakan Mode Demo (ON)
                </button>
              </div>
            ) : (
              <>
                {/* 1-Tap Presets Cuaca & Fenomena */}
                <div className="mt-2.5">
                  <label className="text-[10px] font-mono text-m3-on-surface-variant uppercase tracking-wider block mb-1">
                    Preset Skenario Cepat
                  </label>
                  <div className="grid grid-cols-5 gap-1">
                    {DEMO_PRESETS.map((p) => {
                      const isActive =
                        demoState.timeOfDay === p.timeOfDay &&
                        Math.abs(demoState.suhu - p.suhu) < 1.0 &&
                        Math.abs(demoState.kelembapan - p.kelembapan) < 5;
                      return (
                        <button
                          key={p.id}
                          onClick={() => applyPreset(p)}
                          className={`px-1 py-1 rounded-m3-md text-center transition-all cursor-pointer ${
                            isActive
                              ? 'bg-amber-500 text-white font-bold shadow-md shadow-amber-500/30'
                              : 'bg-m3-surface-container-low/90 text-m3-on-surface hover:bg-white/10'
                          }`}
                          title={p.desc}
                        >
                          <span className="text-xs block">{p.icon}</span>
                          <span className="text-[9px] font-ui truncate block">{p.label.split(' ')[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Interactive Fine-Tuning Sliders */}
                <div className="mt-2.5 space-y-2 text-xs font-mono">
                  {/* 1. Suhu Slider */}
                  <div className="p-1.5 rounded bg-m3-surface-container-low/90">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-m3-on-surface-variant flex items-center gap-1 text-[11px]">
                        <Thermometer size={12} className="text-rose-400" /> Suhu
                      </span>
                      <span className="font-bold text-m3-on-surface text-[11px]">
                        {demoState.suhu.toFixed(1)}°C
                        <span className={`text-[9px] ml-1 px-1 py-0.2 rounded font-semibold ${
                          demoState.suhu >= 33
                            ? 'bg-rose-500/20 text-rose-300'
                            : demoState.suhu >= 29
                            ? 'bg-amber-500/20 text-amber-300'
                            : demoState.suhu < 24
                            ? 'bg-sky-500/20 text-sky-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {demoState.suhu >= 33 ? 'Panas' : demoState.suhu >= 29 ? 'Hangat' : demoState.suhu < 24 ? 'Sejuk' : 'Nyaman'}
                        </span>
                      </span>
                    </div>
                    <input
                      type="range"
                      min="16.0"
                      max="40.0"
                      step="0.5"
                      value={demoState.suhu}
                      onChange={(e) => setDemoState((prev) => ({ ...prev, suhu: parseFloat(e.target.value) }))}
                      className="w-full accent-rose-500 cursor-pointer h-1.5 bg-white/20 rounded-lg"
                    />
                  </div>

                  {/* 2. Kelembapan Slider */}
                  <div className="p-1.5 rounded bg-m3-surface-container-low/90">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-m3-on-surface-variant flex items-center gap-1 text-[11px]">
                        <Droplets size={12} className="text-sky-400" /> RH
                      </span>
                      <span className="font-bold text-sky-300 text-[11px]">
                        {demoState.kelembapan.toFixed(0)}%
                        <span className={`text-[9px] ml-1 px-1 py-0.2 rounded font-semibold ${
                          demoState.kelembapan > 70
                            ? 'bg-sky-500/25 text-sky-200'
                            : demoState.kelembapan < 40
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {demoState.kelembapan > 70 ? 'Embun' : demoState.kelembapan < 40 ? 'Kering' : 'Segar'}
                        </span>
                      </span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="100"
                      step="1"
                      value={demoState.kelembapan}
                      onChange={(e) => setDemoState((prev) => ({ ...prev, kelembapan: parseInt(e.target.value) }))}
                      className="w-full accent-sky-400 cursor-pointer h-1.5 bg-white/20 rounded-lg"
                    />
                  </div>

                  {/* 3. Tekanan Barometer Slider */}
                  <div className="p-1.5 rounded bg-m3-surface-container-low/90">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-m3-on-surface-variant flex items-center gap-1 text-[11px]">
                        <Gauge size={12} className="text-amber-400" /> Tekanan
                      </span>
                      <span className="font-bold text-m3-on-surface text-[11px]">
                        {demoState.tekanan.toFixed(0)} hPa
                        <span className={`text-[9px] ml-1 px-1 py-0.2 rounded font-semibold ${
                          demoState.tekanan < 1008
                            ? 'bg-slate-500/30 text-slate-300'
                            : demoState.tekanan >= 1013
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-sky-500/20 text-sky-300'
                        }`}>
                          {demoState.tekanan < 1008 ? 'Hujan' : demoState.tekanan >= 1013 ? 'Terik' : 'Normal'}
                        </span>
                      </span>
                    </div>
                    <input
                      type="range"
                      min="995"
                      max="1025"
                      step="1"
                      value={demoState.tekanan}
                      onChange={(e) => setDemoState((prev) => ({ ...prev, tekanan: parseInt(e.target.value) }))}
                      className="w-full accent-amber-400 cursor-pointer h-1.5 bg-white/20 rounded-lg"
                    />
                  </div>

                  {/* 4. Suasana Waktu (Time of Day) */}
                  <div className="p-1.5 rounded bg-m3-surface-container-low/90">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-m3-on-surface-variant flex items-center gap-1 text-[11px]">
                        <Sun size={12} className="text-amber-300" /> Waktu
                      </span>
                      <span className="font-bold text-amber-300 capitalize text-[11px]">{demoState.timeOfDay}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {(['pagi', 'siang', 'sore', 'malam'] as TimeOfDay[]).map((t) => (
                        <button
                          key={t}
                          onClick={() => setDemoState((prev) => ({ ...prev, timeOfDay: t }))}
                          className={`py-0.5 rounded text-center font-ui text-[10px] transition-colors cursor-pointer ${
                            demoState.timeOfDay === t
                              ? 'bg-amber-500 text-white font-bold'
                              : 'bg-white/5 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          {t === 'pagi' && '🌅 Pagi'}
                          {t === 'siang' && '☀️ Siang'}
                          {t === 'sore' && '🌇 Sore'}
                          {t === 'malam' && '🌙 Malam'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 5. Toggles: Transmisi & Online */}
                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    <button
                      onClick={() => setDemoState((prev) => ({ ...prev, isTransmitting: !prev.isTransmitting }))}
                      className={`p-1 rounded flex items-center justify-center gap-1 transition-colors cursor-pointer text-[10px] ${
                        demoState.isTransmitting
                          ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                          : 'bg-m3-surface-container-low/90 text-slate-400 border border-white/5 hover:text-white'
                      }`}
                    >
                      <Radio size={11} className={demoState.isTransmitting ? 'animate-pulse text-emerald-400' : ''} />
                      <span>{demoState.isTransmitting ? 'TX Aktif' : 'Simulasi TX'}</span>
                    </button>

                    <button
                      onClick={() => setDemoState((prev) => ({ ...prev, isOnline: !prev.isOnline }))}
                      className={`p-1 rounded flex items-center justify-center gap-1 transition-colors cursor-pointer text-[10px] ${
                        demoState.isOnline
                          ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${demoState.isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      <span>{demoState.isOnline ? 'Online' : 'Standby'}</span>
                    </button>
                  </div>

                  {/* Tombol Reset ke Sensor Live */}
                  <div className="pt-1 flex items-center justify-between border-t border-white/10 text-[10px]">
                    <button
                      onClick={resetToLiveSensor}
                      className="text-m3-primary hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RefreshCw size={11} /> Reset Nilai Sensor
                    </button>
                    <button
                      onClick={() => setIsDemoMenuOpen(false)}
                      className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      Tutup Menu
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Icon Ringkasan Kamar Compact (z-30) */}
      <div ref={summaryRef} className="absolute top-3 left-4 z-30">
        <button
          onClick={() => setShowQuickSummary((prev) => !prev)}
          className={`touch-target p-2 rounded-m3-full border shadow-md backdrop-blur-md transition-all flex items-center justify-center cursor-pointer ${
            showQuickSummary
              ? 'bg-m3-primary text-m3-on-primary border-m3-primary shadow-m3-primary/20'
              : 'bg-m3-surface-container-high/90 text-m3-primary border-white/10 hover:border-m3-primary/60 hover:scale-105 active:scale-95'
          }`}
          title={showQuickSummary ? 'Tutup Ringkasan Kamar' : 'Buka Ringkasan Parameter Kamar'}
          aria-label="Ringkasan Parameter Kamar"
        >
          <Activity size={16} />
        </button>

        {/* Popover Ringkasan Metrik Kamar Penting */}
        {showQuickSummary && (
          <div
            className="absolute top-11 left-0 w-72 p-3.5 rounded-m3-xl bg-m3-surface-container-high/95 border border-m3-primary/40 backdrop-blur-md shadow-2xl animate-in fade-in select-none z-30"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div>
                <span className="text-xs font-bold font-ui text-m3-on-surface flex items-center gap-1.5">
                  <Activity size={14} className="text-m3-primary" />
                  Ringkasan Kondisi Kamar
                </span>
                <div className="text-[10px] text-m3-on-surface-variant mt-0.5 truncate max-w-[210px]">
                  {roomSummary.headline}
                </div>
              </div>
              <button
                onClick={() => setShowQuickSummary(false)}
                className="touch-target p-1 text-slate-400 hover:text-white cursor-pointer"
                title="Tutup Ringkasan"
              >
                ✕
              </button>
            </div>

            <div className="mt-2.5 space-y-1.5 text-xs font-mono">
              <div className="p-2 rounded bg-m3-surface-container-low/90 flex justify-between items-center">
                <span className="text-m3-on-surface-variant flex items-center gap-1.5">
                  <Thermometer size={13} className="text-rose-400" /> Suhu
                </span>
                <span className="font-bold text-m3-on-surface">
                  {activeLatest?.suhu !== undefined ? `${activeLatest.suhu.toFixed(1)}°C` : '--'}
                  <span className={`text-[10px] ml-1.5 px-1.5 py-0.2 rounded font-semibold ${
                    (activeLatest?.suhu ?? 25) >= 33
                      ? 'bg-rose-500/20 text-rose-300'
                      : (activeLatest?.suhu ?? 25) >= 29
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {(activeLatest?.suhu ?? 25) >= 33 ? 'Panas' : (activeLatest?.suhu ?? 25) >= 29 ? 'Hangat' : 'Nyaman'}
                  </span>
                </span>
              </div>

              <div className="p-2 rounded bg-m3-surface-container-low/90 flex justify-between items-center">
                <span className="text-m3-on-surface-variant flex items-center gap-1.5">
                  <Droplets size={13} className="text-sky-400" /> Kelembapan
                </span>
                <span className="font-bold text-sky-300">
                  {activeLatest?.kelembapan !== undefined ? `${activeLatest.kelembapan.toFixed(0)}%` : '--'}
                  <span className="text-[10px] ml-1.5 text-m3-on-surface-variant font-normal">
                    ({activeIndices.humidityStatus})
                  </span>
                </span>
              </div>

              <div className="p-2 rounded bg-m3-surface-container-low/90 flex justify-between items-center">
                <span className="text-m3-on-surface-variant flex items-center gap-1.5">
                  <Gauge size={13} className="text-amber-400" /> Tekanan
                </span>
                <span className="font-bold text-m3-on-surface">
                  {activeLatest?.tekanan !== undefined ? `${activeLatest.tekanan.toFixed(1)} hPa` : '--'}
                  <span className="text-[10px] ml-1.5 text-amber-300 font-normal">
                    ({activeIndices.pressureTrend})
                  </span>
                </span>
              </div>

              <div className="p-2 rounded bg-m3-surface-container-low/90 flex justify-between items-center">
                <span className="text-m3-on-surface-variant flex items-center gap-1.5">
                  <Battery size={13} className="text-emerald-400" /> Daya Baterai
                </span>
                <span className="font-bold text-emerald-400">
                  {activeIndices.batteryPercent}%
                  <span className="text-[10px] ml-1.5 text-m3-on-surface-variant font-normal">
                    ({activeLatest?.tegangan_vcc !== undefined ? `${activeLatest.tegangan_vcc.toFixed(2)}V` : '--'})
                  </span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Controls di Sudut Kanan Bawah (z-20) */}
      <div className="absolute bottom-3 right-4 z-20 flex items-center gap-2">
        <button
          onClick={handleExportGLB}
          disabled={isExporting}
          className="touch-target p-2 rounded-m3-full bg-m3-surface-container-high/90 text-m3-on-surface-variant border border-white/10 shadow-md hover:bg-white/10 hover:text-white active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center"
          title="Unduh 3D Scene (.GLB) untuk Blender"
          aria-label="Unduh 3D Scene .GLB"
        >
          <Download size={16} className={isExporting ? 'animate-bounce text-m3-primary' : ''} />
        </button>
        <button
          onClick={resetCamera}
          className="touch-target p-2 rounded-m3-full bg-m3-surface-container-high/90 text-m3-on-surface-variant border border-white/10 shadow-md hover:bg-white/10 hover:text-white active:scale-95 transition-all cursor-pointer flex items-center justify-center"
          title="Reset Sudut Pandang Kamera"
          aria-label="Reset Sudut Pandang Kamera"
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={() => setControlsEnabled(!controlsEnabled)}
          className={`touch-target p-2 rounded-m3-full transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center ${
            controlsEnabled
              ? 'bg-m3-primary text-m3-on-primary shadow-m3-primary/20'
              : 'bg-m3-surface-container-high/90 text-m3-on-surface-variant border border-white/10 hover:bg-white/10 hover:text-white'
          }`}
          title={controlsEnabled ? 'Kunci Kontrol 3D (Aktifkan Scroll Halaman)' : 'Buka Kunci Kontrol 3D (Putar / Zoom)'}
          aria-label={controlsEnabled ? 'Kunci Kontrol 3D' : 'Buka Kunci Kontrol 3D'}
        >
          {controlsEnabled ? <Unlock size={16} /> : <Lock size={16} />}
        </button>
      </div>



      {/* Modal Dialog Inspeksi Hardware Interaktif (z-50) */}
      {activeInspect && (
        <div
          className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveInspect(null)}
        >
          <div
            className="m3-card max-w-xs w-full p-4 rounded-m3-xl border border-m3-primary/40 animate-in fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <span className="font-bold text-xs font-mono text-m3-primary flex items-center gap-1.5">
                {activeInspect === 'wemos' && <Cpu size={14} />}
                {activeInspect === 'battery' && <Battery size={14} />}
                {activeInspect === 'sensor' && <Gauge size={14} />}
                {activeInspect === 'wemos' && 'WEMOS D1 MINI (ESP8266)'}
                {activeInspect === 'battery' && 'CATU DAYA 3X 18650 LI-ION'}
                {activeInspect === 'sensor' && 'SENSOR AHT20 & BMP280'}
              </span>
              <button
                onClick={() => setActiveInspect(null)}
                className="touch-target p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 text-xs font-mono space-y-2">
              {activeInspect === 'wemos' && (
                <>
                  <div className="p-2 rounded bg-m3-surface-container-low flex justify-between">
                    <span className="text-m3-on-surface-variant">SSID:</span>
                    <span className="text-m3-primary font-bold">{latest?.koneksi || '--'}</span>
                  </div>
                  <div className="p-2 rounded bg-m3-surface-container-low flex justify-between">
                    <span className="text-m3-on-surface-variant">RSSI:</span>
                    <span className="text-emerald-400 font-bold">{latest?.rssi !== undefined ? `${latest.rssi} dBm` : '--'}</span>
                  </div>
                  <div className="p-2 rounded bg-m3-surface-container-low flex justify-between">
                    <span className="text-m3-on-surface-variant">Bangun:</span>
                    <span className="text-m3-on-surface font-bold">{latest?.durasi_bangun_ms !== undefined ? `${latest.durasi_bangun_ms} ms` : '2450 ms'}</span>
                  </div>
                </>
              )}

              {activeInspect === 'battery' && (
                <>
                  <div className="p-2 rounded bg-m3-surface-container-low flex justify-between">
                    <span className="text-m3-on-surface-variant">Tegangan:</span>
                    <span className="text-emerald-400 font-bold">{latest?.tegangan_vcc !== undefined ? `${latest.tegangan_vcc.toFixed(2)} V` : '--'}</span>
                  </div>
                  <div className="p-2 rounded bg-m3-surface-container-low flex justify-between">
                    <span className="text-m3-on-surface-variant">Status Daya:</span>
                    <span className="text-m3-primary font-bold uppercase">{latest?.status_daya || 'NORMAL'}</span>
                  </div>
                  <div className="p-2 rounded bg-m3-surface-container-low flex justify-between">
                    <span className="text-m3-on-surface-variant">Ambang Kritis:</span>
                    <span className="text-rose-400 font-bold">3.40 V</span>
                  </div>
                </>
              )}

              {activeInspect === 'sensor' && (
                <>
                  <div className="p-2 rounded bg-m3-surface-container-low flex justify-between">
                    <span className="text-m3-on-surface-variant">I2C Bus:</span>
                    <span className="text-m3-primary font-bold">D1 (SCL) • D2 (SDA)</span>
                  </div>
                  <div className="p-2 rounded bg-m3-surface-container-low flex justify-between">
                    <span className="text-m3-on-surface-variant">Offset Tekanan:</span>
                    <span className="text-m3-on-surface font-bold">+1.53 hPa (8m Elevasi)</span>
                  </div>
                  <div className="p-2 rounded bg-m3-surface-container-low flex justify-between">
                    <span className="text-m3-on-surface-variant">Status:</span>
                    <span className="text-emerald-400 font-bold">Siap (Normal)</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
