import { useState, useEffect, useMemo } from 'react';
import { TelemetryRecord, LaporanAI, EnvironmentalIndices } from '../types/telemetry';
import { listenRealtimeTelemetry, listenLaporanAI } from '../services/firebase';
import {
  hitungPersenBaterai,
  hitungTitikEmbun,
  evaluasiAmbangSuhu,
  evaluasiAmbangKelembapan
} from '../utils/physics';

export function useTelemetry(limit = 60) {
  const [history, setHistory] = useState<TelemetryRecord[]>([]);
  const [latest, setLatest] = useState<TelemetryRecord | null>(null);
  const [laporanAI, setLaporanAI] = useState<LaporanAI | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsubTelemetry = listenRealtimeTelemetry((lastRecord, list) => {
      setLatest(lastRecord);
      setHistory(list);
      setLoading(false);
    }, limit);

    const unsubAI = listenLaporanAI((aiData) => {
      setLaporanAI(aiData);
    });

    return () => {
      unsubTelemetry();
      unsubAI();
    };
  }, [limit]);

  const indices = useMemo<EnvironmentalIndices>(() => {
    if (!latest) {
      return {
        comfortScore: 0,
        dewPoint: 0,
        thermalStatus: 'nyaman',
        humidityStatus: 'nyaman',
        pressureTrend: 'stabil',
        batteryPercent: 0,
        isOnline: false,
      };
    }

    const lastTime = new Date(latest.timestamp).getTime();
    const isOnline = currentTime - lastTime < 420000; // 7 menit timeout

    const dewPoint = hitungTitikEmbun(latest.suhu, latest.kelembapan);
    const thermalStatus = evaluasiAmbangSuhu(latest.suhu);
    const humidityStatus = evaluasiAmbangKelembapan(latest.kelembapan);
    const batteryPercent = hitungPersenBaterai(latest.tegangan_vcc);

    let score = 100;
    if (thermalStatus !== 'nyaman') score -= 25;
    if (humidityStatus !== 'nyaman') score -= 25;
    if (latest.tegangan_vcc < 3.6 && latest.tegangan_vcc > 0) score -= 15;
    if (!isOnline) score -= 20;

    let pressureTrend: 'naik' | 'stabil' | 'turun' = 'stabil';
    if (history.length >= 5) {
      const delta = latest.tekanan - history[history.length - 5].tekanan;
      if (delta > 0.5) pressureTrend = 'naik';
      else if (delta < -0.5) pressureTrend = 'turun';
    }

    return {
      comfortScore: Math.max(score, 0),
      dewPoint,
      thermalStatus,
      humidityStatus,
      pressureTrend,
      batteryPercent,
      isOnline,
    };
  }, [latest, history, currentTime]);

  return { latest, history, laporanAI, indices, loading };
}
