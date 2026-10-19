import { describe, it, expect } from 'vitest';
import {
  LabDioramaRoom3D,
  ROOM_DIMENSIONS,
  WORKBENCH_DIMENSIONS,
  TASK_LAMP_DIMENSIONS,
} from '../src/components/3d/environment/LabDioramaRoom3D';
import { LabStationAccessories3D } from '../src/components/3d/environment/LabStationAccessories3D';
import {
  CozyBedroom3D,
  COZY_ROOM_DIMENSIONS,
  WINDOW_WEATHER_CONFIG,
  getSkyColorByPressure,
  getCondensationOpacity,
  createWallAeroNestTexture,
} from '../src/components/3d/environment/CozyBedroom3D';

describe('Lab Diorama Room Specifications', () => {
  describe('Component Definitions', () => {
    it('memverifikasi komponen LabDioramaRoom3D dan LabStationAccessories3D terdefinisi', () => {
      expect(LabDioramaRoom3D).toBeDefined();
      expect(LabStationAccessories3D).toBeDefined();
    });
  });

  describe('ROOM_DIMENSIONS Specifications', () => {
    it('memverifikasi dimensi pedestal plinth dan lis bevel', () => {
      expect(ROOM_DIMENSIONS.plinth).toEqual([6.4, 0.4, 5.2]);
      expect(ROOM_DIMENSIONS.plinthBevel).toEqual([6.44, 0.03, 5.24]);
      // Plinth harus lebih luas dari bevel base dan meja kerja
      expect(ROOM_DIMENSIONS.plinth[0]).toBe(6.4);
      expect(ROOM_DIMENSIONS.plinth[1]).toBe(0.4);
      expect(ROOM_DIMENSIONS.plinth[2]).toBe(5.2);
    });

    it('memverifikasi dimensi arsitektur cutaway walls L-shape (dinding belakang dan dinding kiri)', () => {
      expect(ROOM_DIMENSIONS.backWall).toEqual([5.8, 2.6, 0.18]);
      expect(ROOM_DIMENSIONS.leftWall).toEqual([0.18, 2.6, 4.4]);
      // Tinggi dinding sama yaitu 2.6
      expect(ROOM_DIMENSIONS.backWall[1]).toBe(2.6);
      expect(ROOM_DIMENSIONS.leftWall[1]).toBe(2.6);
    });

    it('memverifikasi dimensi jendela lab dan kisi ventilasi HVAC', () => {
      expect(ROOM_DIMENSIONS.windowFrame).toEqual([2.0, 1.2, 0.08]);
      expect(ROOM_DIMENSIONS.windowGlass).toEqual([1.8, 1.0]);
      expect(ROOM_DIMENSIONS.hvacVent).toEqual([1.2, 0.4, 0.08]);

      // Kaca jendela harus muat di dalam bingkai
      expect(ROOM_DIMENSIONS.windowGlass[0]).toBeLessThan(ROOM_DIMENSIONS.windowFrame[0]);
      expect(ROOM_DIMENSIONS.windowGlass[1]).toBeLessThan(ROOM_DIMENSIONS.windowFrame[1]);
    });
  });

  describe('WORKBENCH_DIMENSIONS Specifications', () => {
    it('memverifikasi dimensi tabletop dan mat antistatik ESD', () => {
      expect(WORKBENCH_DIMENSIONS.tabletop).toEqual([4.2, 0.1, 2.6]);
      expect(WORKBENCH_DIMENSIONS.mat).toEqual([4.0, 0.01, 2.4]);

      const [tableWidth, , tableDepth] = WORKBENCH_DIMENSIONS.tabletop;
      const [matWidth, , matDepth] = WORKBENCH_DIMENSIONS.mat;
      const [plinthWidth, , plinthDepth] = ROOM_DIMENSIONS.plinth;

      // Mat antistatik berada di atas meja dengan batas margin rapi
      expect(matWidth).toBeLessThan(tableWidth);
      expect(matDepth).toBeLessThan(tableDepth);

      // Meja kerja proporsional dan muat di atas pedestal plinth
      expect(plinthWidth).toBeGreaterThan(tableWidth);
      expect(plinthDepth).toBeGreaterThan(tableDepth);
    });

    it('memverifikasi dimensi dan 4 posisi kaki meja baja industrial', () => {
      expect(WORKBENCH_DIMENSIONS.legArgs).toEqual([0.06, 0.06, 0.8, 12]);
      expect(WORKBENCH_DIMENSIONS.legPositions).toHaveLength(4);

      // Pastikan ada 4 kaki meja di 4 kuadran
      const positions = WORKBENCH_DIMENSIONS.legPositions;
      expect(positions).toContainEqual([-1.9, -0.4, -1.1]);
      expect(positions).toContainEqual([1.9, -0.4, -1.1]);
      expect(positions).toContainEqual([-1.9, -0.4, 1.1]);
      expect(positions).toContainEqual([1.9, -0.4, 1.1]);
    });
  });

  describe('TASK_LAMP_DIMENSIONS Specifications', () => {
    it('memverifikasi dimensi armature lampu kerja overhead meja lab', () => {
      expect(TASK_LAMP_DIMENSIONS).toBeDefined();
      expect(TASK_LAMP_DIMENSIONS.arm).toEqual([0.04, 1.4, 0.04]);
      expect(TASK_LAMP_DIMENSIONS.hood).toEqual([1.8, 0.08, 0.22]);
      expect(TASK_LAMP_DIMENSIONS.diffuser).toEqual([1.72, 0.02, 0.18]);
    });
  });
});

describe('CozyBedroom3D Specifications & Weather Metaphor', () => {
  it('memverifikasi komponen CozyBedroom3D terdefinisi', () => {
    expect(CozyBedroom3D).toBeDefined();
  });

  it('memverifikasi dimensi ruangan kamar yang proporsional dan terang', () => {
    expect(COZY_ROOM_DIMENSIONS.plinth).toEqual([6.4, 0.4, 5.2]);
    expect(COZY_ROOM_DIMENSIONS.backWall).toEqual([5.8, 2.82, 0.50]);
    expect(COZY_ROOM_DIMENSIONS.leftWall).toEqual([0.48, 2.82, 4.77]);
    expect(COZY_ROOM_DIMENSIONS.desk).toEqual([2.2, 0.08, 1.1]);
    expect(COZY_ROOM_DIMENSIONS.windowFrame).toEqual([2.4, 1.5, 0.08]);
    expect(COZY_ROOM_DIMENSIONS.bed).toEqual([1.3, 0.45, 2.2]);
    expect(COZY_ROOM_DIMENSIONS.rug).toEqual([2.2, 0.015, 1.6]);
    expect(COZY_ROOM_DIMENSIONS.chair).toEqual([0.6, 0.85, 0.6]);
  });

  it('memetakan tekanan barometrik ke warna langit luar jendela (hukum fisika cuaca)', () => {
    // Tekanan tinggi (>= 1013 hPa): Cerah terik (Sky Blue)
    expect(getSkyColorByPressure(1015)).toBe(WINDOW_WEATHER_CONFIG.sunnySky);
    // Tekanan normal (1009 - 1012.9 hPa): Cerah berawan tenang
    expect(getSkyColorByPressure(1011)).toBe(WINDOW_WEATHER_CONFIG.clearSky);
    // Tekanan rendah (< 1008 hPa): Mendung kelabu badai
    expect(getSkyColorByPressure(1005)).toBe(WINDOW_WEATHER_CONFIG.overcastSky);
  });

  it('menghitung opasitas embun kaca jendela berdasarkan kelembapan RH', () => {
    // Kelembapan normal (<= 65%): Kaca jernih (opasitas embun 0)
    expect(getCondensationOpacity(55)).toBe(0);
    // Kelembapan tinggi (> 70%): Kaca mulai berembun
    expect(getCondensationOpacity(75)).toBeGreaterThan(0.2);
    // Kelembapan sangat tinggi (90%): Embun tebal
    expect(getCondensationOpacity(90)).toBeGreaterThanOrEqual(0.6);
  });

  it('memverifikasi fungsi createWallAeroNestTexture terdefinisi dan aman dijalankan tanpa window/document', () => {
    expect(typeof createWallAeroNestTexture).toBe('function');
    // Di lingkungan Node tanpa DOM (SSR / test runner), fungsi harus mengembalikan null dengan aman
    const texture = createWallAeroNestTexture();
    expect(texture === null || typeof texture === 'object').toBe(true);
  });
});


