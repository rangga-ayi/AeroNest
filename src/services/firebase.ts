import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  query,
  limitToLast,
  onChildAdded,
  onValue,
  get,
  orderByChild,
  startAt,
  endAt
} from 'firebase/database';
import { TelemetryRecord, LaporanAI } from '../types/telemetry';
import { validasiDataFisik } from '../utils/physics';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "rangga-iot.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://rangga-iot-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "rangga-iot",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "rangga-iot.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "648903662748",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:648903662748:web:a85a1c2c245f5e40042159",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getDatabase(app);

export function parseRawTelemetry(key: string | null | undefined, raw: any): TelemetryRecord {
  return {
    id: key || undefined,
    suhu: Number(raw.suhu),
    kelembapan: Number(raw.kelembapan),
    tekanan: Number(raw.tekanan),
    tegangan_vcc: Number(raw.tegangan_vcc || 0),
    koneksi: String(raw.koneksi || 'Unknown'),
    status_daya: String(raw.status_daya || 'normal'),
    durasi_bangun_ms: raw.durasi_bangun_ms ? Number(raw.durasi_bangun_ms) : undefined,
    rssi: raw.rssi ? Number(raw.rssi) : undefined,
    adc_raw: raw.adc_raw ? Number(raw.adc_raw) : undefined,
    status_sensor: raw.status_sensor ? String(raw.status_sensor) : undefined,
    timestamp: raw.timestamp || Date.now(),
  };
}

export interface TelemetryFilterParams {
  mode: 'live' | 'last' | 'date' | 'all';
  limitCount?: number;
  startDate?: string; // Format 'YYYY-MM-DD'
  endDate?: string;   // Format 'YYYY-MM-DD'
}

export async function fetchTelemetryFilter(params: TelemetryFilterParams): Promise<TelemetryRecord[]> {
  const telemetryRef = ref(db, 'RIWAYAT_LAB');
  let q;

  if (params.mode === 'last') {
    const count = Math.max(1, Math.min(params.limitCount || 100, 5000));
    q = query(telemetryRef, limitToLast(count));
  } else if (params.mode === 'date') {
    if (!params.startDate || !params.endDate) {
      throw new Error('Tanggal mulai dan tanggal akhir harus diisi.');
    }
    const startTime = new Date(`${params.startDate}T00:00:00`).getTime();
    const endTime = new Date(`${params.endDate}T23:59:59.999`).getTime();
    q = query(telemetryRef, orderByChild('timestamp'), startAt(startTime), endAt(endTime));
  } else if (params.mode === 'all') {
    q = query(telemetryRef);
  } else {
    q = query(telemetryRef, limitToLast(60));
  }

  const snapshot = await get(q);
  if (!snapshot.exists()) {
    return [];
  }

  const records: TelemetryRecord[] = [];
  snapshot.forEach((child) => {
    const raw = child.val();
    if (raw) {
      const record = parseRawTelemetry(child.key, raw);
      if (validasiDataFisik(record)) {
        records.push(record);
      }
    }
  });

  records.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  return records;
}

export function listenRealtimeTelemetry(
  onUpdate: (latest: TelemetryRecord, allList: TelemetryRecord[]) => void,
  limitCount = 60
) {
  const telemetryRef = ref(db, 'RIWAYAT_LAB');
  const telemetryQuery = query(telemetryRef, limitToLast(limitCount));
  const cache: TelemetryRecord[] = [];

  return onChildAdded(telemetryQuery, (snapshot) => {
    const raw = snapshot.val();
    if (!raw) return;

    const record = parseRawTelemetry(snapshot.key, raw);

    if (validasiDataFisik(record)) {
      cache.push(record);
      cache.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      if (cache.length > limitCount) cache.shift();
      onUpdate(cache[cache.length - 1], [...cache]);
    }
  });
}

export function listenLaporanAI(onUpdate: (laporan: LaporanAI | null) => void) {
  const laporanRef = ref(db, 'LAPORAN_AI');
  return onValue(laporanRef, (snapshot) => {
    if (snapshot.exists()) {
      onUpdate(snapshot.val() as LaporanAI);
    } else {
      onUpdate(null);
    }
  });
}
