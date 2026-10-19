import React, { useMemo } from 'react';

export type TimeOfDay = 'pagi' | 'siang' | 'sore' | 'malam';

export const TIME_OF_DAY_PALETTE = {
  pagi: {
    sunColor: '#fef3c7',
    sunIntensity: 2.0,
    sunPosition: [16, 18, 12] as [number, number, number],
    ambientIntensity: 0.85,
    isDeskLampOn: false,
  },
  siang: {
    sunColor: '#ffffff',
    sunIntensity: 2.4,
    sunPosition: [12, 24, 10] as [number, number, number],
    ambientIntensity: 0.95,
    isDeskLampOn: false,
  },
  sore: {
    sunColor: '#fb923c',
    sunIntensity: 1.8,
    sunPosition: [20, 10, 14] as [number, number, number],
    ambientIntensity: 0.75,
    isDeskLampOn: true,
  },
  malam: {
    sunColor: '#818cf8',
    sunIntensity: 0.5,
    sunPosition: [10, 16, 10] as [number, number, number],
    ambientIntensity: 0.4,
    isDeskLampOn: true,
  },
};

export function getTimeOfDay(hour: number = new Date().getHours()): TimeOfDay {
  if (hour >= 6 && hour < 10) return 'pagi';
  if (hour >= 10 && hour < 15) return 'siang';
  if (hour >= 15 && hour < 18.5) return 'sore';
  return 'malam';
}

export function getThermalLightColor(suhu: number = 26): string {
  if (suhu < 24) return '#e0f2fe'; // Cool fresh daylight
  if (suhu < 29) return '#fffbeb'; // Comfortable warm-white
  return '#fed7aa'; // Warm amber/orange heat tint
}

export interface DayNightAtmosphereProps {
  suhu?: number;
  kelembapan?: number;
  tekanan?: number;
  timeOfDay?: TimeOfDay;
  simulatedHour?: number;
}

export const DayNightAtmosphere3D: React.FC<DayNightAtmosphereProps> = ({
  suhu = 26.5,
  timeOfDay: timeOfDayProp,
  simulatedHour,
}) => {
  const currentHour = simulatedHour !== undefined ? simulatedHour : new Date().getHours();
  const timeOfDay = useMemo(() => timeOfDayProp ?? getTimeOfDay(currentHour), [timeOfDayProp, currentHour]);
  const lighting = TIME_OF_DAY_PALETTE[timeOfDay];
  const thermalTint = useMemo(() => getThermalLightColor(suhu), [suhu]);

  return (
    <group>
      {/* 1. Ambient Light Menyesuaikan Suhu Ruangan dan Waktu */}
      <ambientLight intensity={lighting.ambientIntensity} color={thermalTint} />

      {/* 2. Cahaya Hemisphere untuk Gradasi Langit-Lantai Ruangan Alami */}
      <hemisphereLight
        color={thermalTint}
        groundColor="#c29b68"
        intensity={suhu >= 33 ? 0.65 : suhu >= 29 ? 0.5 : 0.4}
      />

      {/* 3. Cahaya Matahari / Sinar Luar Jendela Utama */}
      <directionalLight
        castShadow
        position={lighting.sunPosition}
        intensity={lighting.sunIntensity}
        color={lighting.sunColor}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0004}
      />

      {/* 4. Lampu Interior Hangat Otomatis Menyala saat Sore / Malam */}
      {lighting.isDeskLampOn && (
        <pointLight
          position={[0, 2.0, 0]}
          intensity={1.4}
          distance={6}
          color="#f59e0b"
          decay={2}
        />
      )}
    </group>
  );
};
