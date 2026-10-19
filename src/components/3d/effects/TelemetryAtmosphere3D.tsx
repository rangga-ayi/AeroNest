import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DayNightAtmosphere3D } from './DayNightAtmosphere3D';

export { DayNightAtmosphere3D } from './DayNightAtmosphere3D';

export interface AtmosphereProps {
  suhu?: number;
  kelembapan?: number;
  tekanan?: number;
  aqi?: number;
  simulatedHour?: number;
}

export const THERMAL_COLOR_MAP = {
  cool: '#38bdf8', // < 24°C: Sky Blue
  comfortable: '#10b981', // 24°C - 29°C: Emerald Green
  warm: '#f59e0b', // 29°C - 33°C: Amber
  hot: '#f43f5e', // > 33°C: Crimson
} as const;

export const MIST_BOUNDS = {
  xRange: [-2, 2] as [number, number],
  yRange: [0.3, 2.5] as [number, number],
  zRange: [-1.3, 1.3] as [number, number],
  count: 60,
} as const;

export const ISOBAR_POSITION: [number, number, number] = [1.2, 0.38, 0.3];

/**
 * Memetakan nilai suhu sensor ke warna pencahayaan atmosferik thermal.
 */
export const getThermalColor = (suhu: number): string => {
  if (suhu < 24) return THERMAL_COLOR_MAP.cool;
  if (suhu <= 29) return THERMAL_COLOR_MAP.comfortable;
  if (suhu <= 33) return THERMAL_COLOR_MAP.warm;
  return THERMAL_COLOR_MAP.hot;
};

/**
 * Menghitung faktor kecepatan drift partikel mist mikroklimat berdasarkan kelembapan RH.
 * Clamped antara 0.4 (kering) hingga 2.2 (sangat lembap).
 */
export const calculateMistFactor = (rh: number): number => {
  return Math.min(Math.max(rh / 50, 0.4), 2.2);
};

/**
 * Menentukan warna partikel aerosol mikroklimat berdasarkan indeks kualitas udara (AQI).
 */
export const getMistColor = (aqi?: number): string => {
  if (aqi === undefined) return '#38bdf8';
  if (aqi <= 50) return '#38bdf8'; // Bersih
  if (aqi <= 100) return '#eab308'; // Sedang
  return '#f97316'; // Berpolusi
};

export const TelemetryAtmosphere3D: React.FC<AtmosphereProps> = ({
  suhu = 26.5,
  kelembapan = 55.0,
  tekanan = 1011.8,
  aqi,
  simulatedHour,
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const isobarRef = useRef<THREE.Mesh>(null);

  // Tint warna partikel mist berdasarkan kualitas udara jika tersedia
  const mistColor = useMemo(() => getMistColor(aqi), [aqi]);

  // 2. Partikel mikroklimat udara (respons kelembapan)
  const particleCount = MIST_BOUNDS.count;
  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const spd = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 4.0; // [-2..2]
      pos[i * 3 + 1] = Math.random() * 2.2 + 0.3; // [0.3..2.5]
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2.6; // [-1.3..1.3]
      spd[i] = 0.003 + Math.random() * 0.006;
    }
    return [pos, spd];
  }, [particleCount]);

  useFrame((state) => {
    // Animasi partikel mist
    const posAttr = pointsRef.current?.geometry?.attributes?.position;
    if (posAttr) {
      const arr = posAttr.array as Float32Array;
      const factor = calculateMistFactor(kelembapan);
      for (let i = 0; i < particleCount; i++) {
        arr[i * 3 + 1] -= speeds[i] * factor;
        if (arr[i * 3 + 1] < 0.25) arr[i * 3 + 1] = 2.45;
      }
      posAttr.needsUpdate = true;
    }

    // Animasi piringan isobarik tekanan barometrik
    if (isobarRef.current) {
      const pulseSpeed = tekanan < 1008 ? 1.8 : 0.9;
      const t = (state.clock.elapsedTime * pulseSpeed) % 1;
      const scale = 0.8 + t * 0.7;
      isobarRef.current.scale.set(scale, scale, scale);
      const mat = isobarRef.current.material as THREE.MeshBasicMaterial;
      if (mat) mat.opacity = (1 - t) * 0.45;
    }
  });

  return (
    <group>
      {/* Dynamic Circadian and Thermal Lighting */}
      <DayNightAtmosphere3D
        suhu={suhu}
        kelembapan={kelembapan}
        tekanan={tekanan}
        simulatedHour={simulatedHour}
      />

      {/* Partikel Uap Mikroklimat */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial size={0.035} color={mistColor} transparent opacity={0.5} />
      </points>

      {/* Piringan Denyut Isobar Tekanan Barometrik di atas Sensor */}
      <mesh
        ref={isobarRef}
        position={ISOBAR_POSITION}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.22, 0.26, 32]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};
