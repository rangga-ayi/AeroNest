import { describe, it, expect } from 'vitest';
import {
  hitungPersenBaterai,
  hitungTitikEmbun,
  evaluasiAmbangSuhu,
  evaluasiAmbangKelembapan,
  validasiDataFisik
} from '../src/utils/physics';

describe('physics & calibration utilities', () => {
  it('menghitung persentase baterai Li-ion secara non-linear', () => {
    expect(hitungPersenBaterai(3.2)).toBe(0);
    expect(hitungPersenBaterai(4.25)).toBe(100);
    expect(hitungPersenBaterai(3.82)).toBeCloseTo(50, 1);
    expect(hitungPersenBaterai(0.0)).toBe(0);
  });

  it('menghitung titik embun (dew point) Magnus formula', () => {
    const td = hitungTitikEmbun(25, 50);
    expect(td).toBeGreaterThan(13);
    expect(td).toBeLessThan(15);
  });

  it('mengevaluasi ambang batas kenyamanan termal dan kelembapan', () => {
    expect(evaluasiAmbangSuhu(22)).toBe('sejuk');
    expect(evaluasiAmbangSuhu(26)).toBe('nyaman');
    expect(evaluasiAmbangSuhu(30)).toBe('hangat');
    expect(evaluasiAmbangSuhu(35)).toBe('kritis');

    expect(evaluasiAmbangKelembapan(30)).toBe('kering');
    expect(evaluasiAmbangKelembapan(55)).toBe('nyaman');
    expect(evaluasiAmbangKelembapan(72)).toBe('lembap');
    expect(evaluasiAmbangKelembapan(85)).toBe('jamur');
  });

  it('memvalidasi batas fisik sensor dan membuang outlier', () => {
    expect(validasiDataFisik({ suhu: 27, kelembapan: 60, tekanan: 1010, tegangan_vcc: 3.9 })).toBe(true);
    expect(validasiDataFisik({ suhu: 100, kelembapan: 60, tekanan: 1010, tegangan_vcc: 3.9 })).toBe(false);
  });
});
