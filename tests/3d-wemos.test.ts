import { describe, it, expect } from 'vitest';
import {
  WemosD1Mini3D,
  WEMOS_DIMENSIONS,
  RESISTOR_100K_BANDS,
} from '../src/components/3d/hardware/WemosD1Mini3D';
import {
  ESP32Board3D,
  ProceduralESP32Fallback,
  ESP32_MODEL_PATH,
} from '../src/components/3d/hardware/ESP32Board3D';

// Uji validasi koordinat dan struktur dasar Wemos D1 Mini & ESP32
describe('WemosD1Mini3D Specifications', () => {
  it('memverifikasi komponen WemosD1Mini3D terdefinisi', () => {
    expect(WemosD1Mini3D).toBeDefined();
  });

  it('memverifikasi dimensi fisik proporsional Wemos D1 Mini dari konstanta komponen', () => {
    // Rasio skala Wemos D1 Mini (34.2mm x 25.6mm)
    const panjang = WEMOS_DIMENSIONS.length;
    const lebar = WEMOS_DIMENSIONS.width;
    const tebalPCB = WEMOS_DIMENSIONS.thickness;

    expect(panjang).toBe(1.37);
    expect(lebar).toBe(1.02);
    expect(tebalPCB).toBe(0.06);
    expect(panjang / lebar).toBeCloseTo(1.34, 1);
    expect(tebalPCB).toBeLessThan(0.1);
  });

  it('memverifikasi warna kode resistor pembagi tegangan 100k ohm dari konstanta komponen', () => {
    expect(RESISTOR_100K_BANDS).toHaveLength(4);
    expect(RESISTOR_100K_BANDS[0]).toBe('#854d0e'); // 1: Cokelat
    expect(RESISTOR_100K_BANDS[1]).toBe('#000000'); // 2: Hitam
    expect(RESISTOR_100K_BANDS[2]).toBe('#eab308'); // Pengali: Kuning (x10k)
    expect(RESISTOR_100K_BANDS[3]).toBe('#d97706'); // Toleransi: Emas (5%)
  });
});

describe('ESP32Board3D Specifications', () => {
  it('memverifikasi komponen ESP32Board3D dan fallback terdefinisi', () => {
    expect(ESP32Board3D).toBeDefined();
    expect(ProceduralESP32Fallback).toBeDefined();
    expect(ESP32_MODEL_PATH).toContain('models/esp32_lowpoly.glb');
  });
});
