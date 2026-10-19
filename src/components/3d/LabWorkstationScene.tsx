import React from 'react';
import { TelemetryRecord, EnvironmentalIndices } from '../../types/telemetry';
import { AeroNestHub3D } from './hardware/AeroNestHub3D';
import { ESP32Board3D } from './hardware/ESP32Board3D';
import { CozyBedroom3D } from './environment/CozyBedroom3D';
import { DayNightAtmosphere3D, TimeOfDay } from './effects/DayNightAtmosphere3D';
import { SignalWave3D } from './effects/SignalWave3D';

export interface SceneProps {
  latest: TelemetryRecord | null;
  indices: EnvironmentalIndices;
  onInspectHardware: (type: 'wemos' | 'battery' | 'sensor') => void;
  timeOfDay?: TimeOfDay;
}

export const LabWorkstationScene: React.FC<SceneProps> = ({
  latest,
  indices,
  onInspectHardware,
  timeOfDay,
}) => {
  const suhu = latest?.suhu ?? 25.0;
  const kelembapan = latest?.kelembapan ?? 50.0;
  const tekanan = latest?.tekanan ?? 1012.0;
  const tegangan_vcc = latest?.tegangan_vcc ?? 3.92;

  // Deteksi status transmisi singkat saat sensor aktif mengirimkan data
  const isTransmitting = Boolean(
    latest &&
    latest.durasi_bangun_ms &&
    latest.durasi_bangun_ms > 0 &&
    indices.isOnline
  );

  return (
    <group position={[0, -0.4, 0]}>
      {/* 1. Lingkungan Kamar Nyaman & Cerah dengan Jendela Cuaca Dinamis */}
      <CozyBedroom3D
        suhu={suhu}
        tekanan={tekanan}
        kelembapan={kelembapan}
        timeOfDay={timeOfDay}
      />

      {/* 2. Desktop IoT Weather Station Enclosure (AeroNestHub3D) */}
      <AeroNestHub3D
        position={[0.62, 0.575, -1.40]}
        suhu={suhu}
        kelembapan={kelembapan}
        tegangan_vcc={tegangan_vcc}
        isOnline={indices.isOnline}
        isTransmitting={isTransmitting}
        onInspect={() => onInspectHardware('wemos')}
      />

      {/* 3. Animasi Gelombang Radio WiFi / Breathing Sleep */}
      <SignalWave3D
        position={[0.62, 0.745, -1.40]}
        isOnline={indices.isOnline}
        isTransmitting={isTransmitting}
      />

      {/* 4. Modul Development Board IoT ESP32 Low-Poly */}
      <ESP32Board3D
        position={[1.02, 0.575, -1.40]}
        isOnline={indices.isOnline}
        isTransmitting={isTransmitting}
        onInspect={() => onInspectHardware('wemos')}
      />

      {/* 5. Pencahayaan Sirkadian & Efek Termal Reaktif */}
      <DayNightAtmosphere3D
        suhu={suhu}
        kelembapan={kelembapan}
        tekanan={tekanan}
        timeOfDay={timeOfDay}
      />
    </group>
  );
};
