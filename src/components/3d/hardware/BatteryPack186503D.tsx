import React from 'react';
import { Html } from '@react-three/drei';

export interface BatteryPackProps {
  tegangan_vcc?: number;
  status_daya?: string;
  onInspect?: () => void;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

export const BATTERY_HOLDER_DIMENSIONS = {
  width: 1.4,
  height: 0.44,
  length: 2.3,
};

export const CELL_18650_DIMENSIONS = {
  radius: 0.16,
  height: 2.05,
  count: 3,
};

export function getBatteryStatusColor(tegangan_vcc: number, status_daya: string = 'normal'): string {
  if (tegangan_vcc < 3.40 || status_daya === 'kritis') return '#ef4444'; // Merah (Kritis)
  if (tegangan_vcc < 3.60 && status_daya !== 'kritis') return '#eab308'; // Kuning (Rendah)
  return '#22c55e'; // Hijau (Normal)
}

export const BatteryPack186503D: React.FC<BatteryPackProps> = ({
  tegangan_vcc = 3.92,
  status_daya = 'normal',
  onInspect,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}) => {
  const statusColor = getBatteryStatusColor(tegangan_vcc, status_daya);

  return (
    <group position={position} rotation={rotation} onClick={onInspect}>
      {/* 1. Holder Baterai 3-Slot Hitam Matte */}
      <mesh castShadow receiveShadow position={[0, BATTERY_HOLDER_DIMENSIONS.height / 2, 0]}>
        <boxGeometry
          args={[
            BATTERY_HOLDER_DIMENSIONS.width,
            BATTERY_HOLDER_DIMENSIONS.height,
            BATTERY_HOLDER_DIMENSIONS.length,
          ]}
        />
        <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.15} />
      </mesh>

      {/* 2. 3x Silinder Sel Li-ion 18650 Hijau Industrial */}
      {[-0.4, 0, 0.4].map((x, idx) => (
        <group key={idx} position={[x, 0.26, 0]}>
          {/* Tabung sel 18650 */}
          <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry
              args={[
                CELL_18650_DIMENSIONS.radius,
                CELL_18650_DIMENSIONS.radius,
                CELL_18650_DIMENSIONS.height,
                24,
              ]}
            />
            <meshStandardMaterial color="#15803d" roughness={0.25} metalness={0.2} />
          </mesh>
          {/* Terminal button-top kutub positif logam */}
          <mesh position={[0, 0, -1.05]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.06, 16]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.1} />
          </mesh>
          {/* Terminal pegas kutub negatif logam */}
          <mesh position={[0, 0, 1.05]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.04, 16]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* 3. Kabel Output Daya Utama Merah (+) & Hitam (-) */}
      <mesh position={[0.3, 0.15, -1.18]}>
        <boxGeometry args={[0.06, 0.06, 0.15]} />
        <meshStandardMaterial color="#dc2626" />
      </mesh>
      <mesh position={[-0.3, 0.15, -1.18]}>
        <boxGeometry args={[0.06, 0.06, 0.15]} />
        <meshStandardMaterial color="#090d16" />
      </mesh>

      {/* 4. Mini HUD Label Melayang */}
      <Html position={[0, 0.65, 0]} center zIndexRange={[20, 0]}>
        <button
          onClick={onInspect}
          className="group flex items-center gap-1.5 px-2.5 py-1 rounded-m3-full bg-m3-surface-container-high/90 border border-white/10 backdrop-blur-md shadow-md hover:scale-105 active:scale-95 cursor-pointer select-none transition-all"
        >
          <span
            className="w-2 h-2 rounded-full inline-block shrink-0 animate-pulse"
            style={{ backgroundColor: statusColor }}
          />
          <span className="text-[10px] font-mono font-bold text-m3-on-surface whitespace-nowrap">
            3x 18650 • {tegangan_vcc.toFixed(2)}V
          </span>
        </button>
      </Html>
    </group>
  );
};
