import { TelemetryRecord } from '../types/telemetry';

export const AMBANG = {
  suhu: [24, 29, 33] as const,
  kelembapan: [40, 65, 80] as const,
};

export const RENTANG_WAJAR = {
  suhu: { min: -10, max: 60 },
  kelembapan: { min: 1, max: 100 },
  tekanan: { min: 950, max: 1050 },
  baterai: { min: 0.5, max: 4.5 }
};

export const KURVA_BATERAI: [number, number][] = [
  [3.27, 0],
  [3.61, 5],
  [3.69, 10],
  [3.71, 15],
  [3.73, 20],
  [3.75, 25],
  [3.77, 30],
  [3.79, 35],
  [3.80, 40],
  [3.82, 50],
  [3.84, 60],
  [3.87, 70],
  [3.92, 80],
  [4.02, 90],
  [4.10, 95],
  [4.20, 100],
];

export function hitungPersenBaterai(volt: number): number {
  if (typeof volt !== 'number' || isNaN(volt) || volt <= KURVA_BATERAI[0][0]) return 0;
  if (volt >= KURVA_BATERAI[KURVA_BATERAI.length - 1][0]) return 100;

  for (let i = 1; i < KURVA_BATERAI.length; i++) {
    const [v1, p1] = KURVA_BATERAI[i - 1];
    const [v2, p2] = KURVA_BATERAI[i];
    if (volt <= v2) {
      const rasio = (volt - v1) / (v2 - v1);
      return Math.round(p1 + rasio * (p2 - p1));
    }
  }
  return 0;
}

export function hitungTitikEmbun(suhu: number, rh: number): number {
  const a = 17.27;
  const b = 237.7;
  const alpha = ((a * suhu) / (b + suhu)) + Math.log(Math.max(rh, 1) / 100.0);
  const td = (b * alpha) / (a - alpha);
  return Math.round(td * 10) / 10;
}

export function evaluasiAmbangSuhu(suhu: number): 'sejuk' | 'nyaman' | 'hangat' | 'kritis' {
  const [s1, s2, s3] = AMBANG.suhu;
  if (suhu < s1) return 'sejuk';
  if (suhu <= s2) return 'nyaman';
  if (suhu <= s3) return 'hangat';
  return 'kritis';
}

export function evaluasiAmbangKelembapan(rh: number): 'kering' | 'nyaman' | 'lembap' | 'jamur' {
  const [h1, h2, h3] = AMBANG.kelembapan;
  if (rh < h1) return 'kering';
  if (rh <= h2) return 'nyaman';
  if (rh <= h3) return 'lembap';
  return 'jamur';
}

export function validasiDataFisik(data: Partial<TelemetryRecord>): boolean {
  if (data.suhu !== undefined) {
    if (data.suhu < RENTANG_WAJAR.suhu.min || data.suhu > RENTANG_WAJAR.suhu.max) return false;
  }
  if (data.kelembapan !== undefined) {
    if (data.kelembapan < RENTANG_WAJAR.kelembapan.min || data.kelembapan > RENTANG_WAJAR.kelembapan.max) return false;
  }
  if (data.tekanan !== undefined) {
    if (data.tekanan < RENTANG_WAJAR.tekanan.min || data.tekanan > RENTANG_WAJAR.tekanan.max) return false;
  }
  return true;
}
