import { TelemetryRecord } from '../types/telemetry';

export function exportToCSV(records: TelemetryRecord[], filename = 'AeroNest_Riwayat_Lab.csv') {
  if (!records.length) return;
  const headers = ['Timestamp ISO', 'Waktu Lokal', 'Suhu (°C)', 'Kelembapan (%)', 'Tekanan (hPa)', 'Baterai (V)', 'WiFi SSID', 'Status Daya'];
  const rows = records.map(r => {
    const d = new Date(r.timestamp);
    return [
      d.toISOString(),
      `"${d.toLocaleString('id-ID')}"`,
      r.suhu,
      r.kelembapan,
      r.tekanan,
      r.tegangan_vcc,
      `"${r.koneksi}"`,
      r.status_daya
    ];
  });
  const blob = new Blob([[headers.join(','), ...rows.map(row => row.join(','))].join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
