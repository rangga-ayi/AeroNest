import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface WemosProps {
  isOnline: boolean;
  isTransmitting?: boolean;
  onInspect?: () => void;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

export const WEMOS_DIMENSIONS = {
  width: 1.02,
  thickness: 0.06,
  length: 1.37,
};

export const RESISTOR_100K_BANDS = [
  '#854d0e', // 1: Cokelat
  '#000000', // 2: Hitam
  '#eab308', // Pengali: Kuning (x10k)
  '#d97706', // Toleransi: Emas (5%)
] as const;

export const WemosD1Mini3D: React.FC<WemosProps> = ({
  isOnline,
  isTransmitting = false,
  onInspect,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}) => {
  const ledRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    if (ledRef.current) {
      if (isTransmitting) {
        // Kedip cepat saat transmisi data
        ledRef.current.opacity = Math.sin(state.clock.elapsedTime * 25) > 0 ? 0.95 : 0.1;
      } else if (isOnline) {
        // Breathing pulse pelan saat mode sleep hemat daya
        const pulse = (Math.sin(state.clock.elapsedTime * 1.5) + 1) / 2;
        ledRef.current.opacity = 0.15 + pulse * 0.35;
      } else {
        ledRef.current.opacity = 0.05;
      }
    }
  });

  return (
    <group position={position} rotation={rotation} onClick={onInspect}>
      {/* 1. Substrat PCB Biru Wemos D1 Mini */}
      <mesh castShadow receiveShadow position={[0, 0.03, 0]}>
        <boxGeometry args={[WEMOS_DIMENSIONS.width, WEMOS_DIMENSIONS.thickness, WEMOS_DIMENSIONS.length]} />
        <meshStandardMaterial color="#00878f" roughness={0.35} metalness={0.2} />
      </mesh>

      {/* 2. Metal RF Shield ESP-12F */}
      <mesh castShadow position={[0, 0.09, -0.1]}>
        <boxGeometry args={[0.62, 0.07, 0.65]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.18} metalness={0.95} />
      </mesh>

      {/* 3. Antena Meander Emas 2.4 GHz di ujung PCB */}
      <group position={[0, 0.065, -0.54]}>
        {/* Latar hitam modul RF */}
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.7, 0.2]} />
          <meshBasicMaterial color="#0b1118" />
        </mesh>
        {/* Trace emas meander */}
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.55, 0.12]} />
          <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* 4. Dual 8-Pin Female Header di sisi kiri & kanan */}
      {[-0.45, 0.45].map((x, colIdx) => (
        <group key={colIdx} position={[x, 0.12, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.1, 0.12, 1.2]} />
            <meshStandardMaterial color="#0f172a" roughness={0.7} />
          </mesh>
          {/* Lubang pin emas */}
          {Array.from({ length: 8 }).map((_, pinIdx) => (
            <mesh key={pinIdx} position={[0, 0.065, -0.5 + pinIdx * 0.14]}>
              <boxGeometry args={[0.04, 0.01, 0.04]} />
              <meshStandardMaterial color="#ca8a04" metalness={0.95} roughness={0.1} />
            </mesh>
          ))}
        </group>
      ))}

      {/* 5. Resistor Pembagi Tegangan 100k Ohm ke Pin A0 */}
      <group position={[-0.32, 0.09, 0.42]} rotation={[0, 0.3, 0]}>
        {/* Badan keramik resistor */}
        <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.03, 0.03, 0.18, 12]} />
          <meshStandardMaterial color="#fef3c7" roughness={0.4} />
        </mesh>
        {/* Gelang warna: Cokelat, Hitam, Kuning, Emas */}
        <mesh position={[-0.05, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.031, 0.031, 0.02, 12]} />
          <meshBasicMaterial color={RESISTOR_100K_BANDS[0]} />
        </mesh>
        <mesh position={[-0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.031, 0.031, 0.02, 12]} />
          <meshBasicMaterial color={RESISTOR_100K_BANDS[1]} />
        </mesh>
        <mesh position={[0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.031, 0.031, 0.02, 12]} />
          <meshBasicMaterial color={RESISTOR_100K_BANDS[2]} />
        </mesh>
        <mesh position={[0.05, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.031, 0.031, 0.02, 12]} />
          <meshBasicMaterial color={RESISTOR_100K_BANDS[3]} />
        </mesh>
        {/* Kaki kawat resistor */}
        <mesh position={[0, -0.02, 0]}>
          <boxGeometry args={[0.26, 0.01, 0.01]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
        </mesh>
      </group>

      {/* 6. Port Micro-USB Logam */}
      <mesh castShadow position={[0, 0.08, 0.68]}>
        <boxGeometry args={[0.3, 0.08, 0.22]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.2} />
      </mesh>

      {/* 7. LED Biru Onboard D4 */}
      <mesh position={[0.2, 0.07, 0.25]}>
        <boxGeometry args={[0.04, 0.02, 0.04]} />
        <meshBasicMaterial ref={ledRef} color="#38bdf8" transparent opacity={0.8} />
      </mesh>
    </group>
  );
};
