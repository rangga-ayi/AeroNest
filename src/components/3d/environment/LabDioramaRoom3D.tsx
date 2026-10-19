import React from 'react';
import { LabStationAccessories3D } from './LabStationAccessories3D';

export {
  CozyBedroom3D,
  COZY_ROOM_DIMENSIONS,
  WINDOW_WEATHER_CONFIG,
  getSkyColorByPressure,
  getCondensationOpacity,
} from './CozyBedroom3D';
export type { CozyBedroomProps } from './CozyBedroom3D';

export const ROOM_DIMENSIONS = {
  plinth: [6.4, 0.4, 5.2] as const,
  plinthBevel: [6.44, 0.03, 5.24] as const,
  backWall: [5.8, 2.6, 0.18] as const,
  leftWall: [0.18, 2.6, 4.4] as const,
  windowFrame: [2.0, 1.2, 0.08] as const,
  windowGlass: [1.8, 1.0] as const,
  hvacVent: [1.2, 0.4, 0.08] as const,
};

export const WORKBENCH_DIMENSIONS = {
  tabletop: [4.2, 0.1, 2.6] as const,
  mat: [4.0, 0.01, 2.4] as const,
  legArgs: [0.06, 0.06, 0.8, 12] as const,
  legPositions: [
    [-1.9, -0.4, -1.1],
    [1.9, -0.4, -1.1],
    [-1.9, -0.4, 1.1],
    [1.9, -0.4, 1.1],
  ] as [number, number, number][],
};

export const TASK_LAMP_DIMENSIONS = {
  arm: [0.04, 1.4, 0.04] as const,
  hood: [1.8, 0.08, 0.22] as const,
  diffuser: [1.72, 0.02, 0.18] as const,
};

export interface RoomProps {
  outdoorAqiColor?: string;
  position?: [number, number, number];
}

export const LabDioramaRoom3D: React.FC<RoomProps> = ({
  outdoorAqiColor = '#38bdf8',
  position = [0, 0, 0],
}) => {
  return (
    <group position={position}>
      {/* 1. Beveled Elevated Diorama Plinth Base */}
      <mesh receiveShadow position={[0, -0.4, 0]}>
        <boxGeometry args={[...ROOM_DIMENSIONS.plinth]} />
        <meshStandardMaterial color="#0d1520" roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Lis Tepi Bevel Slate Plinth */}
      <mesh position={[0, -0.19, 0]}>
        <boxGeometry args={[...ROOM_DIMENSIONS.plinthBevel]} />
        <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* 2. Meja Kerja Lab ESD Antistatik */}
      <group position={[0, 0, 0]}>
        {/* Permukaan Meja (Tabletop) */}
        <mesh castShadow receiveShadow position={[0, 0.22, 0]}>
          <boxGeometry args={[...WORKBENCH_DIMENSIONS.tabletop]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.2} />
        </mesh>

        {/* Lis Mat Antistatik Biru/Abu-abu */}
        <mesh position={[0, 0.275, 0]}>
          <boxGeometry args={[...WORKBENCH_DIMENSIONS.mat]} />
          <meshStandardMaterial color="#253346" roughness={0.5} metalness={0.15} />
        </mesh>

        {/* 4 Kaki Meja Baja Industrial */}
        {WORKBENCH_DIMENSIONS.legPositions.map(([kx, ky, kz], idx) => (
          <mesh key={idx} castShadow position={[kx, ky, kz]}>
            <cylinderGeometry args={[...WORKBENCH_DIMENSIONS.legArgs]} />
            <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.25} />
          </mesh>
        ))}
      </group>

      {/* 3. Dinding Potong L-Shape (Cutaway Walls) */}
      {/* Dinding Belakang (Back Wall) */}
      <group position={[0, 1.3, -2.1]}>
        <mesh receiveShadow>
          <boxGeometry args={[...ROOM_DIMENSIONS.backWall]} />
          <meshStandardMaterial color="#16202f" roughness={0.7} metalness={0.15} />
        </mesh>

        {/* Jendela Kaca Ruangan Lab */}
        <group position={[-0.8, 0.3, 0.1]}>
          {/* Bingkai Aluminium Jendela */}
          <mesh castShadow>
            <boxGeometry args={[...ROOM_DIMENSIONS.windowFrame]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
          </mesh>

          {/* Kaca Jendela Transparan merespons Outdoor AQI Color */}
          <mesh position={[0, 0, 0.01]}>
            <planeGeometry args={[...ROOM_DIMENSIONS.windowGlass]} />
            <meshStandardMaterial
              color={outdoorAqiColor}
              transparent
              opacity={0.35}
              roughness={0.05}
              metalness={0.3}
            />
          </mesh>

          {/* Palang Bingkai Kaca (Mullion Vertikal & Horizontal) */}
          <mesh position={[0, 0, 0.02]}>
            <boxGeometry args={[0.03, ROOM_DIMENSIONS.windowGlass[1], 0.02]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0, 0.02]}>
            <boxGeometry args={[ROOM_DIMENSIONS.windowGlass[0], 0.03, 0.02]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>

        {/* Kisi-kisi Ventilasi AC (HVAC Diffuser) dengan Sirip Louver */}
        <group position={[1.5, 0.7, 0.1]}>
          {/* Bingkai Luar Ventilasi */}
          <mesh castShadow>
            <boxGeometry args={[...ROOM_DIMENSIONS.hvacVent]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} />
          </mesh>

          {/* Dasar Kisi Gelap */}
          <mesh position={[0, 0, 0.045]}>
            <planeGeometry args={[1.05, 0.28]} />
            <meshBasicMaterial color="#090d16" />
          </mesh>

          {/* Sirip Louver kisi-kisi ventilasi AC */}
          {[-0.09, -0.03, 0.03, 0.09].map((offsetY, idx) => (
            <mesh key={idx} position={[0, offsetY, 0.05]} rotation={[0.25, 0, 0]}>
              <boxGeometry args={[1.02, 0.02, 0.02]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
            </mesh>
          ))}
        </group>
      </group>

      {/* Dinding Samping Kiri (Left Wall) */}
      <group position={[-2.8, 1.3, 0.2]}>
        <mesh receiveShadow>
          <boxGeometry args={[...ROOM_DIMENSIONS.leftWall]} />
          <meshStandardMaterial color="#0f172a" roughness={0.85} metalness={0.1} />
        </mesh>
      </group>

      {/* Armature Lampu Kerja Lab Overhead */}
      <group position={[0, 1.6, -1.05]}>
        {/* Lengan Penyangga Lampu */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[...TASK_LAMP_DIMENSIONS.arm]} />
          <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Tudung Lampu (Hood) */}
        <mesh position={[0, 0.7, 0.5]} castShadow>
          <boxGeometry args={[...TASK_LAMP_DIMENSIONS.hood]} />
          <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Panel Diffuser LED Emissive */}
        <mesh position={[0, 0.66, 0.5]}>
          <boxGeometry args={[...TASK_LAMP_DIMENSIONS.diffuser]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.4} roughness={0.1} />
        </mesh>
      </group>

      {/* 4. Miniatur Aksesoris Meja Lab (Osiloskop / Multimeter Teknis) */}
      <LabStationAccessories3D />
    </group>
  );
};
