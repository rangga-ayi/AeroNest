import React from 'react';
import { Html } from '@react-three/drei';

export interface SensorBreakoutProps {
  suhu?: number;
  kelembapan?: number;
  tekanan?: number;
  onInspect?: () => void;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

export const AHT20_DIMENSIONS = {
  pcb: [0.5, 0.05, 0.5] as [number, number, number],
  chip: [0.18, 0.04, 0.18] as [number, number, number],
  membraneRadius: 0.04,
};

export const BMP280_DIMENSIONS = {
  pcb: [0.45, 0.05, 0.55] as [number, number, number],
  metalLid: [0.16, 0.035, 0.16] as [number, number, number],
  ventRadius: 0.02,
};

export const SensorBreakout3D: React.FC<SensorBreakoutProps> = ({
  suhu = 26.5,
  kelembapan = 55.0,
  tekanan = 1011.8,
  onInspect,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}) => {
  return (
    <group position={position} rotation={rotation} onClick={onInspect}>
      {/* 1. Modul AHT20 Breakout (Kiri) */}
      <group position={[-0.32, 0, 0]}>
        {/* PCB AHT20 Hitam */}
        <mesh castShadow receiveShadow position={[0, 0.03, 0]}>
          <boxGeometry args={AHT20_DIMENSIONS.pcb} />
          <meshStandardMaterial color="#0b1118" roughness={0.4} metalness={0.3} />
        </mesh>
        {/* IC Chip Sensor AHT20 dengan membran */}
        <mesh castShadow position={[0, 0.07, 0]}>
          <boxGeometry args={AHT20_DIMENSIONS.chip} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.092, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[AHT20_DIMENSIONS.membraneRadius, 16]} />
          <meshBasicMaterial color="#e2e8f0" />
        </mesh>
        {/* Pin Header 4-Pin (VIN, GND, SCL, SDA) */}
        <mesh position={[0, 0.08, 0.2]}>
          <boxGeometry args={[0.4, 0.08, 0.08]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
      </group>

      {/* 2. Modul BMP280 Breakout (Kanan - GY-BMP280 Ungu) */}
      <group position={[0.32, 0, 0]}>
        {/* PCB BMP280 Ungu */}
        <mesh castShadow receiveShadow position={[0, 0.03, 0]}>
          <boxGeometry args={BMP280_DIMENSIONS.pcb} />
          <meshStandardMaterial color="#4338ca" roughness={0.35} metalness={0.3} />
        </mesh>
        {/* Metal Lid Barometer BMP280 */}
        <mesh castShadow position={[0, 0.07, -0.05]}>
          <boxGeometry args={BMP280_DIMENSIONS.metalLid} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.15} />
        </mesh>
        {/* Lubang mikro ventilasi sensor tekanan */}
        <mesh position={[0.03, 0.089, -0.05]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[BMP280_DIMENSIONS.ventRadius, 12]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
        {/* Pin Header 6-Pin */}
        <mesh position={[0, 0.08, 0.22]}>
          <boxGeometry args={[0.38, 0.08, 0.08]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
      </group>

      {/* 3. HTML Hover Badge */}
      <Html position={[0, 0.45, 0]} center zIndexRange={[20, 0]}>
        <button
          onClick={onInspect}
          className="group flex items-center gap-1 px-2 py-0.5 rounded-m3-full bg-m3-surface-container-high/90 border border-m3-primary/30 backdrop-blur-md shadow-md hover:scale-105 active:scale-95 cursor-pointer select-none transition-all"
        >
          <span
            className="text-[10px] font-mono text-m3-primary font-bold whitespace-nowrap"
            title={`${tekanan.toFixed(1)} hPa`}
          >
            AHT20 • BMP280 • {suhu.toFixed(1)}°C | {kelembapan.toFixed(0)}%
          </span>
        </button>
      </Html>
    </group>
  );
};
