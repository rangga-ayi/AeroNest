import { describe, it, expect } from 'vitest';
import {
  TelemetryAtmosphere3D,
  getThermalColor,
  calculateMistFactor,
  getMistColor,
  THERMAL_COLOR_MAP,
  MIST_BOUNDS,
  ISOBAR_POSITION,
} from '../src/components/3d/effects/TelemetryAtmosphere3D';
import {
  SignalWave3D,
  SIGNAL_WAVE_POSITION,
  getSignalColor,
} from '../src/components/3d/effects/SignalWave3D';
import {
  DayNightAtmosphere3D,
  getTimeOfDay,
  getThermalLightColor,
  TIME_OF_DAY_PALETTE,
} from '../src/components/3d/effects/DayNightAtmosphere3D';

describe('Telemetry Atmosphere & Lighting Mapping', () => {
  it('memverifikasi komponen TelemetryAtmosphere3D dan SignalWave3D terdefinisi', () => {
    expect(TelemetryAtmosphere3D).toBeDefined();
    expect(SignalWave3D).toBeDefined();
  });

  describe('getThermalColor', () => {
    it('mengonversi nilai suhu ke warna ambient thermal secara konsisten sesuai spesifikasi', () => {
      // < 24°C: Sky Blue (#38bdf8)
      expect(getThermalColor(21.5)).toBe('#38bdf8');
      expect(getThermalColor(23.9)).toBe('#38bdf8');
      expect(getThermalColor(0)).toBe('#38bdf8');

      // 24°C - 29°C: Emerald Green (#10b981)
      expect(getThermalColor(24.0)).toBe('#10b981');
      expect(getThermalColor(26.5)).toBe('#10b981');
      expect(getThermalColor(29.0)).toBe('#10b981');

      // 29°C - 33°C: Amber (#f59e0b)
      expect(getThermalColor(29.1)).toBe('#f59e0b');
      expect(getThermalColor(31.2)).toBe('#f59e0b');
      expect(getThermalColor(33.0)).toBe('#f59e0b');

      // > 33°C: Crimson (#f43f5e)
      expect(getThermalColor(33.1)).toBe('#f43f5e');
      expect(getThermalColor(36.0)).toBe('#f43f5e');
      expect(getThermalColor(42.0)).toBe('#f43f5e');
    });

    it('memvalidasi palet warna THERMAL_COLOR_MAP', () => {
      expect(THERMAL_COLOR_MAP.cool).toBe('#38bdf8');
      expect(THERMAL_COLOR_MAP.comfortable).toBe('#10b981');
      expect(THERMAL_COLOR_MAP.warm).toBe('#f59e0b');
      expect(THERMAL_COLOR_MAP.hot).toBe('#f43f5e');
    });
  });

  describe('calculateMistFactor', () => {
    it('menghitung faktor kecepatan partikel berdasarkan kelembapan', () => {
      expect(calculateMistFactor(30)).toBeLessThan(1.0);
      expect(calculateMistFactor(50)).toBe(1.0);
      expect(calculateMistFactor(85)).toBeGreaterThan(1.5);
    });

    it('mengecek batas bawah (clamping min 0.4) dan batas atas (clamping max 2.2)', () => {
      // 10 / 50 = 0.2 -> clamped to 0.4
      expect(calculateMistFactor(10)).toBe(0.4);
      expect(calculateMistFactor(0)).toBe(0.4);

      // 120 / 50 = 2.4 -> clamped to 2.2
      expect(calculateMistFactor(120)).toBe(2.2);
      expect(calculateMistFactor(150)).toBe(2.2);
    });
  });

  describe('getMistColor', () => {
    it('mengembalikan warna partikel mist berdasarkan rentang AQI', () => {
      // default / undefined -> sky blue (#38bdf8)
      expect(getMistColor()).toBe('#38bdf8');
      expect(getMistColor(undefined)).toBe('#38bdf8');

      // <= 50 -> bersih (#38bdf8)
      expect(getMistColor(25)).toBe('#38bdf8');
      expect(getMistColor(50)).toBe('#38bdf8');

      // <= 100 -> sedang (#eab308)
      expect(getMistColor(51)).toBe('#eab308');
      expect(getMistColor(85)).toBe('#eab308');
      expect(getMistColor(100)).toBe('#eab308');

      // > 100 -> berpolusi (#f97316)
      expect(getMistColor(101)).toBe('#f97316');
      expect(getMistColor(160)).toBe('#f97316');
    });
  });

  describe('Atmosphere & Signal Wave Constants and Helpers', () => {
    it('memvalidasi bounding area partikel uap mist 3D', () => {
      expect(MIST_BOUNDS.xRange).toEqual([-2, 2]);
      expect(MIST_BOUNDS.yRange).toEqual([0.3, 2.5]);
      expect(MIST_BOUNDS.zRange).toEqual([-1.3, 1.3]);
      expect(MIST_BOUNDS.count).toBe(60);
    });

    it('memvalidasi posisi default isobar ring dan signal wave', () => {
      expect(ISOBAR_POSITION).toEqual([1.2, 0.38, 0.3]);
      expect(SIGNAL_WAVE_POSITION).toEqual([0, 0.15, -0.55]);
    });

    it('mengembalikan warna gelombang RF berdasarkan status transmisi dan online', () => {
      // Saat transmisi aktif: Cyan elektrik (#00f2fe)
      expect(getSignalColor(true, true)).toBe('#00f2fe');
      expect(getSignalColor(false, true)).toBe('#00f2fe');

      // Saat online (deep sleep standby): Hijau emerald (#10b981)
      expect(getSignalColor(true, false)).toBe('#10b981');

      // Saat offline: Slate (#64748b)
      expect(getSignalColor(false, false)).toBe('#64748b');
    });
  });

  describe('DayNightAtmosphere3D Specifications', () => {
    it('memverifikasi komponen DayNightAtmosphere3D terdefinisi', () => {
      expect(DayNightAtmosphere3D).toBeDefined();
    });

    it('mengklasifikasikan waktu hari secara akurat berdasarkan jam lokal', () => {
      expect(getTimeOfDay(7)).toBe('pagi');
      expect(getTimeOfDay(12)).toBe('siang');
      expect(getTimeOfDay(16)).toBe('sore');
      expect(getTimeOfDay(21)).toBe('malam');
      expect(getTimeOfDay(2)).toBe('malam');
    });

    it('menyesuaikan warna cahaya ambient berdasarkan suhu mikroklimat ruangan', () => {
      // Suhu sejuk (< 24°C): Cahaya soft icy daylight
      expect(getThermalLightColor(22)).toBe('#e0f2fe');
      // Suhu nyaman (24 - 28.9°C): Cahaya netral putih hangat
      expect(getThermalLightColor(26)).toBe('#fffbeb');
      // Suhu gerah/panas (>= 29°C): Cahaya oranye hangat
      expect(getThermalLightColor(33.2)).toBe('#fed7aa');
    });

    it('memverifikasi konfigurasi palet pencahayaan siang/malam', () => {
      expect(TIME_OF_DAY_PALETTE.pagi.sunColor).toBe('#fef3c7');
      expect(TIME_OF_DAY_PALETTE.siang.sunIntensity).toBeGreaterThanOrEqual(1.8);
      expect(TIME_OF_DAY_PALETTE.malam.isDeskLampOn).toBe(true);
    });
  });
});
