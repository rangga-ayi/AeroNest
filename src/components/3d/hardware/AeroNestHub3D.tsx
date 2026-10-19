import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const AERONEST_HUB_DIMENSIONS = {
  casing: [0.28, 0.12, 0.22] as const,
  glowRing: [0.12, 0.145, 32] as const,
};

export function getHubGlowColor(suhu: number = 26): string {
  if (suhu < 24) return '#38bdf8'; // Sejuk - Cyan/Biru
  if (suhu < 29) return '#10b981'; // Nyaman - Hijau Zamrud
  if (suhu <= 33) return '#f59e0b'; // Hangat / Gerah - Amber
  return '#ef4444'; // Kritis / Panas - Merah
}

export interface AeroNestHubProps {
  suhu?: number;
  kelembapan?: number;
  tegangan_vcc?: number;
  isOnline?: boolean;
  isTransmitting?: boolean;
  onInspect?: () => void;
  position?: [number, number, number];
}

export const AeroNestHub3D: React.FC<AeroNestHubProps> = ({
  suhu = 26.5,
  isOnline = true,
  isTransmitting = false,
  onInspect,
  position = [0.35, 0.28, 0],
}) => {
  const ringRef = useRef<THREE.MeshBasicMaterial>(null);
  const auraRef = useRef<THREE.MeshBasicMaterial>(null);
  const ventParticlesRef = useRef<THREE.Group>(null);
  const glowColor = getHubGlowColor(suhu);

  // Titik partikel konveksi mikro ventilasi sensor (AHT20 & BMP280 air sampling)
  const ventParticles = useMemo(() => {
    return [
      { x: -0.05, z: 0, speed: 0.6, offset: 0 },
      { x: -0.02, z: 0.025, speed: 0.75, offset: 0.8 },
      { x: 0.025, z: -0.02, speed: 0.65, offset: 1.6 },
      { x: 0.05, z: 0.012, speed: 0.8, offset: 2.4 },
    ];
  }, []);

  useFrame((state) => {
    const elapsed = state.clock.elapsedTime;

    // 1. Animasi Cincin Status LED di Alas Alat
    if (ringRef.current) {
      if (isTransmitting) {
        ringRef.current.opacity = Math.sin(elapsed * 20) > 0 ? 0.95 : 0.2;
      } else if (isOnline) {
        const pulse = (Math.sin(elapsed * 1.8) + 1) / 2;
        ringRef.current.opacity = 0.5 + pulse * 0.4;
      } else {
        ringRef.current.opacity = 0.25;
      }
    }

    // 2. Animasi Denyut Aura Termal di Permukaan Meja (Aura Meja)
    if (auraRef.current) {
      const auraPulse = (Math.sin(elapsed * 1.4) + 1) / 2;
      auraRef.current.opacity = isOnline ? 0.22 + auraPulse * 0.22 : 0.1;
    }

    // 3. Animasi Partikel Aliran Udara Konveksi Mikro di Atas Kisi Ventilasi
    if (ventParticlesRef.current && isOnline) {
      ventParticlesRef.current.children.forEach((child, i) => {
        const item = ventParticles[i];
        const progress = ((elapsed * item.speed + item.offset) % 1.5) / 1.5;
        child.position.y = progress * 0.08;
        const meshMat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        if (meshMat) {
          meshMat.opacity = Math.sin(progress * Math.PI) * 0.7;
        }
      });
    }
  });

  return (
    <group
      position={position}
      onClick={onInspect}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      {/* ======================================================== */}
      {/* AURA TERMAL MEJA (Thermal Desk Aura & Tabletop Glow)     */}
      {/* ======================================================== */}
      {/* Piringan Aura Termal Proporsional di Permukaan Meja */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.15, 0.38, 32]} />
        <meshBasicMaterial ref={auraRef} color={glowColor} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      {/* Titik Cahaya Ambient ke Permukaan Meja & Alas Alat */}
      <pointLight position={[0, 0.04, 0]} intensity={0.9} distance={0.8} color={glowColor} decay={2} />

      {/* ======================================================== */}
      {/* CASING ENCLOSURE MINIMALIS ELEGAN (Ukuran Kompak 28x12x22cm) */}
      {/* ======================================================== */}
      <mesh castShadow receiveShadow position={[0, AERONEST_HUB_DIMENSIONS.casing[1] / 2, 0]}>
        <boxGeometry args={[...AERONEST_HUB_DIMENSIONS.casing]} />
        <meshStandardMaterial color="#1e293b" roughness={0.25} metalness={0.2} />
      </mesh>

      {/* Kisi Ventilasi Udara Sensor di Sisi Atas */}
      {[-0.05, 0, 0.05].map((zOffset, idx) => (
        <mesh key={idx} position={[0, AERONEST_HUB_DIMENSIONS.casing[1] + 0.001, zOffset]}>
          <planeGeometry args={[0.16, 0.015]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
      ))}

      {/* Partikel Animasi Aliran Udara Konveksi Mikro dari Ventilasi */}
      <group ref={ventParticlesRef} position={[0, AERONEST_HUB_DIMENSIONS.casing[1] + 0.005, 0]}>
        {ventParticles.map((vp, idx) => (
          <mesh key={idx} position={[vp.x, 0, vp.z]}>
            <sphereGeometry args={[0.005, 8, 8]} />
            <meshBasicMaterial color={glowColor} transparent opacity={0.6} />
          </mesh>
        ))}
      </group>

      {/* Layar OLED Mikro Digital di Sisi Depan Boks Perangkat */}
      <group position={[0, 0.06, AERONEST_HUB_DIMENSIONS.casing[2] / 2 + 0.001]}>
        {/* Panel Bezel Kaca Hitam Glossy */}
        <mesh>
          <planeGeometry args={[0.18, 0.07]} />
          <meshStandardMaterial color="#020617" roughness={0.05} metalness={0.9} />
        </mesh>
        {/* Indikator Telemetri Layar Menyala Emisif */}
        <mesh position={[0, 0, 0.001]}>
          <planeGeometry args={[0.16, 0.05]} />
          <meshBasicMaterial color={isOnline ? glowColor : '#475569'} />
        </mesh>
      </group>

      {/* ======================================================== */}
      {/* CINCIN CAHAYA LED (Status Glow Ring) DI ALAS PERANGKAT   */}
      {/* ======================================================== */}
      <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[AERONEST_HUB_DIMENSIONS.glowRing[0], AERONEST_HUB_DIMENSIONS.glowRing[1], AERONEST_HUB_DIMENSIONS.glowRing[2]]} />
        <meshBasicMaterial ref={ringRef} color={glowColor} transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};
