import { describe, it, expect } from 'vitest';
import {
  BatteryPack186503D,
  getBatteryStatusColor,
  BATTERY_HOLDER_DIMENSIONS,
  CELL_18650_DIMENSIONS,
} from '../src/components/3d/hardware/BatteryPack186503D';
import {
  SensorBreakout3D,
  AHT20_DIMENSIONS,
  BMP280_DIMENSIONS,
} from '../src/components/3d/hardware/SensorBreakout3D';
import {
  AeroNestHub3D,
  getHubGlowColor,
  AERONEST_HUB_DIMENSIONS,
} from '../src/components/3d/hardware/AeroNestHub3D';

describe('BatteryPack186503D & SensorBreakout3D Logic and Specifications', () => {
  describe('BatteryPack186503D', () => {
    it('memverifikasi komponen BatteryPack186503D terdefinisi', () => {
      expect(BatteryPack186503D).toBeDefined();
    });

    it('mengembalikan warna indikator baterai sesuai tegangan dan status daya', () => {
      // < 3.40V atau status 'kritis' -> Merah (#ef4444)
      expect(getBatteryStatusColor(3.35, 'normal')).toBe('#ef4444');
      expect(getBatteryStatusColor(3.39, 'normal')).toBe('#ef4444');
      expect(getBatteryStatusColor(3.75, 'kritis')).toBe('#ef4444');

      // < 3.60V dan bukan kritis -> Kuning (#eab308)
      expect(getBatteryStatusColor(3.40, 'normal')).toBe('#eab308');
      expect(getBatteryStatusColor(3.55, 'rendah')).toBe('#eab308');
      expect(getBatteryStatusColor(3.59, 'normal')).toBe('#eab308');

      // >= 3.60V -> Hijau (#22c55e)
      expect(getBatteryStatusColor(3.60, 'normal')).toBe('#22c55e');
      expect(getBatteryStatusColor(3.92, 'normal')).toBe('#22c55e');
      expect(getBatteryStatusColor(4.20, 'normal')).toBe('#22c55e');
    });

    it('memvalidasi dimensi fisik 3-slot holder dan 3x sel 18650', () => {
      expect(BATTERY_HOLDER_DIMENSIONS.width).toBe(1.4);
      expect(BATTERY_HOLDER_DIMENSIONS.height).toBe(0.44);
      expect(BATTERY_HOLDER_DIMENSIONS.length).toBe(2.3);

      expect(CELL_18650_DIMENSIONS.radius).toBe(0.16);
      expect(CELL_18650_DIMENSIONS.height).toBe(2.05);
      expect(CELL_18650_DIMENSIONS.count).toBe(3);
    });
  });

  describe('SensorBreakout3D', () => {
    it('memverifikasi komponen SensorBreakout3D terdefinisi', () => {
      expect(SensorBreakout3D).toBeDefined();
    });

    it('memvalidasi dimensi modul dan chip sensor AHT20', () => {
      expect(AHT20_DIMENSIONS.pcb).toEqual([0.5, 0.05, 0.5]);
      expect(AHT20_DIMENSIONS.chip).toEqual([0.18, 0.04, 0.18]);
      expect(AHT20_DIMENSIONS.membraneRadius).toBe(0.04);
    });

    it('memvalidasi dimensi modul, metal lid, dan ventilasi sensor BMP280', () => {
      expect(BMP280_DIMENSIONS.pcb).toEqual([0.45, 0.05, 0.55]);
      expect(BMP280_DIMENSIONS.metalLid).toEqual([0.16, 0.035, 0.16]);
      expect(BMP280_DIMENSIONS.ventRadius).toBe(0.02);
    });
  });

  describe('AeroNestHub3D Specifications', () => {
    it('memverifikasi komponen AeroNestHub3D terdefinisi', () => {
      expect(AeroNestHub3D).toBeDefined();
      expect(AERONEST_HUB_DIMENSIONS.casing).toEqual([0.28, 0.12, 0.22]);
    });

    it('menentukan warna cincin LED status hub sesuai ambang kenyamanan suhu', () => {
      // Suhu nyaman (24 - 28.9°C): Hijau emerald
      expect(getHubGlowColor(25.5)).toBe('#10b981');
      // Suhu gerah/hangat (29 - 33°C): Amber
      expect(getHubGlowColor(31.0)).toBe('#f59e0b');
      // Suhu panas kritis (> 33°C): Crimson red
      expect(getHubGlowColor(33.2)).toBe('#ef4444');
      // Suhu dingin (< 24°C): Sky blue
      expect(getHubGlowColor(21.0)).toBe('#38bdf8');
    });
  });
});

