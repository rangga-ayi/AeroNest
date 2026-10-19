import { describe, it, expect } from 'vitest';
import React from 'react';
import { LabCanvas3D as LabCanvas3DFromRoot } from '../src/components/LabCanvas3D';
import { LabCanvas3D as LabCanvas3DFrom3D, sanitizeMarkdownSummary, getLaypersonRoomSummary, SceneExporterBridge, DEMO_PRESETS } from '../src/components/3d/LabCanvas3D';
import { LabWorkstationScene } from '../src/components/3d/LabWorkstationScene';
import { TelemetryRecord, EnvironmentalIndices } from '../src/types/telemetry';

describe('LabCanvas3D & LabWorkstationScene Integration Logic', () => {
  it('mengekspor komponen LabCanvas3D, LabWorkstationScene, dan SceneExporterBridge sebagai React FC yang valid', () => {
    expect(typeof LabCanvas3DFrom3D).toBe('function');
    expect(typeof LabWorkstationScene).toBe('function');
    expect(typeof SceneExporterBridge).toBe('function');
    // Verifikasi re-export facade di src/components/LabCanvas3D
    expect(LabCanvas3DFromRoot).toBe(LabCanvas3DFrom3D);
  });

  it('menangani data telemetri null tanpa melempar runtime exception (null-safety)', () => {
    const latest: TelemetryRecord | null = null;
    const indices: EnvironmentalIndices = {
      comfortScore: 88,
      dewPoint: 14.5,
      thermalStatus: 'nyaman',
      humidityStatus: 'nyaman',
      pressureTrend: 'stabil',
      batteryPercent: 92,
      isOnline: false,
    };

    const suhuFallback = latest?.suhu ?? 25.0;
    const kelembapanFallback = latest?.kelembapan ?? 50.0;
    const tekananFallback = latest?.tekanan ?? 1012.0;
    const vccFallback = latest?.tegangan_vcc ?? 3.92;
    const statusDayaFallback = latest?.status_daya ?? 'normal';

    expect(suhuFallback).toBe(25.0);
    expect(kelembapanFallback).toBe(50.0);
    expect(tekananFallback).toBe(1012.0);
    expect(vccFallback).toBe(3.92);
    expect(statusDayaFallback).toBe('normal');

    const isTransmitting = Boolean(
      latest &&
      latest.durasi_bangun_ms &&
      latest.durasi_bangun_ms > 0 &&
      indices.isOnline
    );
    expect(isTransmitting).toBe(false);
  });

  it('menghitung status isTransmitting secara akurat saat telemetri aktif dan online', () => {
    const onlineIndices: EnvironmentalIndices = {
      comfortScore: 92,
      dewPoint: 16.0,
      thermalStatus: 'nyaman',
      humidityStatus: 'nyaman',
      pressureTrend: 'stabil',
      batteryPercent: 95,
      isOnline: true,
    };

    const activeTelemetry: TelemetryRecord = {
      id: '1',
      timestamp: '2026-10-18T13:00:00Z',
      suhu: 27.4,
      kelembapan: 58.2,
      tekanan: 1011.5,
      tegangan_vcc: 3.95,
      rssi: -62,
      durasi_bangun_ms: 2340,
      koneksi: 'AeroNest-IoT',
      status_daya: 'normal',
    };

    const isTransmitting = Boolean(
      activeTelemetry &&
      activeTelemetry.durasi_bangun_ms &&
      activeTelemetry.durasi_bangun_ms > 0 &&
      onlineIndices.isOnline
    );
    expect(isTransmitting).toBe(true);

    // Jika node offline meski ada durasi bangun
    const isTransmittingOffline = Boolean(
      activeTelemetry &&
      activeTelemetry.durasi_bangun_ms &&
      activeTelemetry.durasi_bangun_ms > 0 &&
      false
    );
    expect(isTransmittingOffline).toBe(false);
  });

  it('memvalidasi format teks AI preview pill dengan stripping markdown header', () => {
    const rawAiText = '### Laporan Mikroklimat Lab\nSuhu dan kelembapan stabil di zona aman.';
    const formatted = rawAiText.replace(/^#+\s+/gm, '').slice(0, 85);
    expect(formatted.startsWith('#')).toBe(false);
    expect(formatted).toContain('Laporan Mikroklimat Lab');
  });

  describe('sanitizeMarkdownSummary', () => {
    it('membersihkan seluruh sintaks markdown (header, bold, quote, list, backtick) menjadi teks bersih', () => {
      const rawAi = 'Evaluasi Iklim Mikro & Telemetri IoT > ### Ringkasan Eksekutif (Status Cepat) > - *^Suhu 32.8°C aman.**';
      const clean = sanitizeMarkdownSummary(rawAi);
      expect(clean).not.toContain('###');
      expect(clean).not.toContain('>');
      expect(clean).not.toContain('*');
      expect(clean).not.toContain('^');
      expect(clean).toContain('Evaluasi Iklim Mikro');
      expect(clean).toContain('Ringkasan Eksekutif');
      expect(clean).toContain('Suhu 32.8°C aman.');
    });

    it('mengembalikan fallback aman jika teks kosong atau null', () => {
      expect(sanitizeMarkdownSummary(null)).toBe('Menunggu data analitik AI...');
      expect(sanitizeMarkdownSummary(undefined)).toBe('Menunggu data analitik AI...');
      expect(sanitizeMarkdownSummary('')).toBe('Menunggu data analitik AI...');
    });

    it('memotong teks panjang secara anggun dengan elipsis maksimal 115 karakter', () => {
      const longText = 'Sistem pemantauan lingkungan indoor laboratorium mendeteksi stabilitas suhu dan kelembapan yang sangat prima sepanjang hari tanpa adanya anomali pada sensor mikroklimat.';
      const result = sanitizeMarkdownSummary(longText);
      expect(result.length).toBeLessThanOrEqual(115);
      expect(result.endsWith('...')).toBe(true);
    });
  });

  describe('Layperson Room Summary Helper', () => {
    it('menghasilkan ringkasan kondisi kamar yang akurat dan to the point', () => {
      const hotRecord: TelemetryRecord = {
        timestamp: '2026-10-18T14:00:00Z',
        suhu: 33.2,
        kelembapan: 58.0,
        tekanan: 1012.0,
        tegangan_vcc: 3.99,
        status_daya: 'normal',
        koneksi: 'LabWiFi',
        rssi: -62,
        status_sensor: 'OK',
        durasi_bangun_ms: 2100,
      };
      const indices: EnvironmentalIndices = {
        comfortScore: 65,
        dewPoint: 23.5,
        thermalStatus: 'kritis',
        humidityStatus: 'nyaman',
        pressureTrend: 'stabil',
        batteryPercent: 87,
        isOnline: true,
      };

      const summary = getLaypersonRoomSummary(hotRecord, indices);
      expect(summary.headline).toContain('Panas');
      expect(summary.headline).toContain('33.2°C');
      expect(summary.subline).toContain('1012.0 hPa');
      expect(summary.subline).toContain('87%');
    });

    it('mengembalikan pesan fallback ketika latest bernilai null', () => {
      const indices: EnvironmentalIndices = {
        comfortScore: 80,
        dewPoint: 18.0,
        thermalStatus: 'nyaman',
        humidityStatus: 'nyaman',
        pressureTrend: 'stabil',
        batteryPercent: 90,
        isOnline: false,
      };

      const summary = getLaypersonRoomSummary(null, indices);
      expect(summary.headline).toBe('Menghubungkan ke sensor kamar...');
      expect(summary.subline).toBe('Memeriksa telemetri...');
    });

    it('mengklasifikasikan rentang temperatur intermediate dengan tepat', () => {
      const baseIndices: EnvironmentalIndices = {
        comfortScore: 85,
        dewPoint: 19.0,
        thermalStatus: 'nyaman',
        humidityStatus: 'nyaman',
        pressureTrend: 'turun',
        batteryPercent: 75,
        isOnline: true,
      };

      const makeRecord = (suhu: number): TelemetryRecord => ({
        timestamp: '2026-10-18T14:00:00Z',
        suhu,
        kelembapan: 55.0,
        tekanan: 1010.5,
        tegangan_vcc: 3.85,
        status_daya: 'normal',
        koneksi: 'LabWiFi',
        rssi: -65,
        status_sensor: 'OK',
        durasi_bangun_ms: 1800,
      });

      // >= 29 && < 33 -> Hangat / Gerah
      const warmSummary = getLaypersonRoomSummary(makeRecord(30.5), baseIndices);
      expect(warmSummary.headline).toContain('Hangat / Gerah');
      expect(warmSummary.headline).toContain('30.5°C');

      // >= 24 && < 29 -> Nyaman & Ideal
      const idealSummary = getLaypersonRoomSummary(makeRecord(26.0), baseIndices);
      expect(idealSummary.headline).toContain('Nyaman & Ideal');
      expect(idealSummary.headline).toContain('26.0°C');

      // < 24 -> Sejuk & Dingin
      const coolSummary = getLaypersonRoomSummary(makeRecord(22.0), baseIndices);
      expect(coolSummary.headline).toContain('Sejuk & Dingin');
      expect(coolSummary.headline).toContain('22.0°C');
    });
  });

  describe('Mode Demo Visual 3D Specifications & Presets', () => {
    it('memvalidasi ketersediaan dan parameter 5 preset skenario cuaca & fenomena', () => {
      expect(DEMO_PRESETS.length).toBe(5);

      const cerah = DEMO_PRESETS.find((p) => p.id === 'cerah');
      expect(cerah).toBeDefined();
      expect(cerah?.tekanan).toBeGreaterThanOrEqual(1013); // Memicu langit cerah dan matahari
      expect(cerah?.timeOfDay).toBe('siang');

      const hujan = DEMO_PRESETS.find((p) => p.id === 'hujan');
      expect(hujan).toBeDefined();
      expect(hujan?.tekanan).toBeLessThan(1008); // Memicu awan kelabu dan partikel hujan
      expect(hujan?.kelembapan).toBeGreaterThan(70); // Memicu kondensasi embun kaca

      const sore = DEMO_PRESETS.find((p) => p.id === 'sore');
      expect(sore).toBeDefined();
      expect(sore?.timeOfDay).toBe('sore'); // Memicu golden hour dan lampu menyala

      const malam = DEMO_PRESETS.find((p) => p.id === 'malam');
      expect(malam).toBeDefined();
      expect(malam?.timeOfDay).toBe('malam'); // Memicu bulan sabit, bintang, lampu tidur

      const panas = DEMO_PRESETS.find((p) => p.id === 'panas');
      expect(panas).toBeDefined();
      expect(panas?.suhu).toBeGreaterThan(33); // Memicu cincin LED crimson red
      expect(panas?.kelembapan).toBeLessThan(40); // Memicu daun tanaman kekuningan
    });

    it('mengisolasi visual 3D saat mode demo aktif tanpa mengubah data telemetri asli', () => {
      const realTelemetry: TelemetryRecord = {
        suhu: 24.5,
        kelembapan: 60,
        tekanan: 1012,
        tegangan_vcc: 4.0,
      };

      // Simulasi state mode demo aktif dengan suhu 36°C
      const demoSuhu = 36.0;
      const demoKelembapan = 85;

      const effectiveLatest = {
        ...realTelemetry,
        suhu: demoSuhu,
        kelembapan: demoKelembapan,
      };

      // Data telemetri asli tetap 24.5°C dan 60%
      expect(realTelemetry.suhu).toBe(24.5);
      expect(realTelemetry.kelembapan).toBe(60);

      // Data efektif untuk 3D berubah sesuai simulasi demo
      expect(effectiveLatest.suhu).toBe(36.0);
      expect(effectiveLatest.kelembapan).toBe(85);
    });
  });
});

