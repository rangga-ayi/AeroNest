export interface TelemetryRecord {
  id?: string;
  suhu: number;
  kelembapan: number;
  tekanan: number;
  tegangan_vcc: number;
  koneksi: string;
  status_daya: 'normal' | 'rendah' | 'kritis' | string;
  durasi_bangun_ms?: number;
  rssi?: number;
  adc_raw?: number;
  status_sensor?: string;
  timestamp: string | number;
}

export interface LaporanAI {
  timestamp: string;
  laporan_text: string;
}

export interface EnvironmentalIndices {
  comfortScore: number; // 0 - 100
  dewPoint: number;
  thermalStatus: 'sejuk' | 'nyaman' | 'hangat' | 'kritis';
  humidityStatus: 'kering' | 'nyaman' | 'lembap' | 'jamur';
  pressureTrend: 'naik' | 'stabil' | 'turun';
  batteryPercent: number;
  isOnline: boolean;
}
