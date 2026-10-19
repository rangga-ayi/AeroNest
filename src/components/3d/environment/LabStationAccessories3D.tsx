import React from 'react';

export interface LabStationAccessoriesProps {
  position?: [number, number, number];
}

export const LabStationAccessories3D: React.FC<LabStationAccessoriesProps> = ({
  position = [1.5, 0.25, -0.7],
}) => {
  return (
    <group position={position}>
      {/* 1. Miniatur Osiloskop / Multimeter Teknis Meja */}
      <mesh castShadow receiveShadow position={[0, 0.3, 0]}>
        <boxGeometry args={[0.9, 0.6, 0.7]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.4} />
      </mesh>

      {/* Bezel / frame layar instrumen */}
      <mesh position={[0, 0.35, 0.352]}>
        <boxGeometry args={[0.66, 0.4, 0.01]} />
        <meshStandardMaterial color="#0f172a" roughness={0.7} />
      </mesh>

      {/* Layar display instrumen LCD/OLED biru teknikal */}
      <mesh position={[0, 0.35, 0.36]}>
        <planeGeometry args={[0.6, 0.35]} />
        <meshBasicMaterial color="#0284c7" />
      </mesh>

      {/* Grid waveform grafis pada layar */}
      <mesh position={[0, 0.35, 0.362]}>
        <planeGeometry args={[0.54, 0.28]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} />
      </mesh>

      {/* Tombol rotary dial instrumen */}
      <mesh position={[0.25, 0.15, 0.36]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.04, 16]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Tombol sekunder */}
      <mesh position={[0.1, 0.15, 0.36]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.03, 16]} />
        <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Port terminal probe BNC (Merah & Hitam) */}
      <mesh position={[-0.2, 0.15, 0.36]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.03, 12]} />
        <meshStandardMaterial color="#dc2626" metalness={0.6} />
      </mesh>
      <mesh position={[-0.1, 0.15, 0.36]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.03, 12]} />
        <meshStandardMaterial color="#0f172a" metalness={0.6} />
      </mesh>

      {/* Indikator daya LED instrumen */}
      <mesh position={[-0.32, 0.48, 0.36]}>
        <circleGeometry args={[0.015, 12]} />
        <meshBasicMaterial color="#22c55e" />
      </mesh>
    </group>
  );
};
