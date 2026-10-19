import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface SignalProps {
  isOnline: boolean;
  isTransmitting?: boolean;
  position?: [number, number, number];
}

export const SIGNAL_WAVE_POSITION: [number, number, number] = [0, 0.15, -0.55]; // Tepat di atas antena emas ESP-12F

/**
 * Menentukan warna indikasi gelombang RF:
 * - Transmisi aktif (burst TX data): Cyan elektrik (#00f2fe)
 * - Online (standby sleep pulse): Emerald green (#10b981)
 * - Offline: Slate muted (#64748b)
 */
export const getSignalColor = (isOnline: boolean, isTransmitting = false): string => {
  if (isTransmitting) return '#00f2fe';
  if (isOnline) return '#10b981';
  return '#64748b';
};

export const SignalWave3D: React.FC<SignalProps> = ({
  isOnline,
  isTransmitting = false,
  position = SIGNAL_WAVE_POSITION,
}) => {
  const waveRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (waveRef.current) {
      if (isTransmitting) {
        // Gelombang memancar cepat ke atas saat kirim data
        const t = (state.clock.elapsedTime * 2.2) % 1;
        const scale = 0.2 + t * 1.5;
        waveRef.current.scale.set(scale, scale, scale);
        const mat = waveRef.current.material as THREE.MeshBasicMaterial;
        if (mat) mat.opacity = (1 - t) * 0.8;
      } else if (isOnline) {
        // Denyut pelan sleep pulse
        const t = (state.clock.elapsedTime * 0.5) % 1;
        const scale = 0.2 + t * 0.6;
        waveRef.current.scale.set(scale, scale, scale);
        const mat = waveRef.current.material as THREE.MeshBasicMaterial;
        if (mat) mat.opacity = (1 - t) * 0.25;
      } else {
        const mat = waveRef.current.material as THREE.MeshBasicMaterial;
        if (mat) mat.opacity = 0;
      }
    }
  });

  const signalColor = getSignalColor(isOnline, isTransmitting);

  return (
    <group position={position}>
      <mesh ref={waveRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.15, 0.18, 32]} />
        <meshBasicMaterial
          color={signalColor}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};
