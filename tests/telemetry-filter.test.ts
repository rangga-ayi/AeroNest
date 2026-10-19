import { describe, it, expect } from 'vitest';
import { parseRawTelemetry } from '../src/services/firebase';
import { TelemetryRecord } from '../src/types/telemetry';

describe('parseRawTelemetry', () => {
  it('harus mem-parsing data mentah Firebase ke tipe TelemetryRecord yang valid', () => {
    const raw = {
      suhu: '27.4',
      kelembapan: '65.2',
      tekanan: '1013.25',
      tegangan_vcc: '3.95',
      koneksi: 'Lab_WiFi_5G',
      status_daya: 'normal',
      timestamp: 1729300000000,
    };

    const record = parseRawTelemetry('-OAbc123', raw);

    expect(record.id).toBe('-OAbc123');
    expect(record.suhu).toBe(27.4);
    expect(record.kelembapan).toBe(65.2);
    expect(record.tekanan).toBe(1013.25);
    expect(record.tegangan_vcc).toBe(3.95);
    expect(record.koneksi).toBe('Lab_WiFi_5G');
    expect(record.status_daya).toBe('normal');
    expect(record.timestamp).toBe(1729300000000);
  });

  it('harus menyediakan nilai fallback yang aman saat beberapa properti bernilai null atau hilang', () => {
    const raw = {
      suhu: 25,
      kelembapan: 50,
      tekanan: 1010,
    };

    const record = parseRawTelemetry(null, raw);

    expect(record.id).toBeUndefined();
    expect(record.suhu).toBe(25);
    expect(record.tegangan_vcc).toBe(0);
    expect(record.koneksi).toBe('Unknown');
    expect(record.status_daya).toBe('normal');
    expect(typeof record.timestamp).toBe('number');
  });
});

describe('Sorting Telemetri', () => {
  const dummy: TelemetryRecord[] = [
    { suhu: 25, kelembapan: 60, tekanan: 1012, tegangan_vcc: 3.8, koneksi: 'WiFi-B', status_daya: 'normal', timestamp: 1000 },
    { suhu: 30, kelembapan: 40, tekanan: 1015, tegangan_vcc: 4.1, koneksi: 'WiFi-A', status_daya: 'normal', timestamp: 3000 },
    { suhu: 22, kelembapan: 80, tekanan: 1008, tegangan_vcc: 3.5, koneksi: 'WiFi-C', status_daya: 'rendah', timestamp: 2000 },
  ];

  it('dapat mengurutkan berdasarkan timestamp secara descending (terbaru duluan)', () => {
    const sorted = [...dummy].sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
    expect(sorted.map(d => d.timestamp)).toEqual([3000, 2000, 1000]);
  });

  it('dapat mengurutkan berdasarkan suhu secara ascending dan descending', () => {
    const asc = [...dummy].sort((a, b) => a.suhu - b.suhu);
    expect(asc.map(d => d.suhu)).toEqual([22, 25, 30]);

    const desc = [...dummy].sort((a, b) => b.suhu - a.suhu);
    expect(desc.map(d => d.suhu)).toEqual([30, 25, 22]);
  });
});
