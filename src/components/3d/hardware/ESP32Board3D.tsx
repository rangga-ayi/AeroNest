import React, { useRef, useMemo, Suspense, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

export interface ESP32BoardProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number] | number;
  isOnline?: boolean;
  isTransmitting?: boolean;
  onInspect?: () => void;
}

// Menyesuaikan base path Vite (e.g. '/AeroNest/') agar tidak 404 saat fetch aset statis di public/
const rawBase = typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL ? import.meta.env.BASE_URL : '/';
const normalizedBase = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
export const ESP32_MODEL_PATH = `${normalizedBase}models/esp32_lowpoly.glb`;

/**
 * Procedural Fallback Mesh saat model GLB sedang dimuat, offline, atau di lingkungan pengujian tanpa WebGL GLTF loader.
 */
export const ProceduralESP32Fallback: React.FC<{ isOnline?: boolean; isTransmitting?: boolean }> = ({
  isOnline = true,
  isTransmitting = false,
}) => {
  return (
    <group>
      {/* Black PCB Board */}
      <mesh castShadow receiveShadow position={[0, 0.008, 0]}>
        <boxGeometry args={[0.22, 0.016, 0.28]} />
        <meshStandardMaterial color="#0f172a" roughness={0.7} metalness={0.2} />
      </mesh>
      {/* ESP-WROOM-32 Metal RF Shield */}
      <mesh castShadow position={[0.01, 0.024, -0.02]}>
        <boxGeometry args={[0.16, 0.016, 0.16]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.3} metalness={0.85} />
      </mesh>
      {/* Micro-USB Port */}
      <mesh castShadow position={[0, 0.022, 0.13]}>
        <boxGeometry args={[0.06, 0.018, 0.04]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.25} metalness={0.9} />
      </mesh>
      {/* Dual Header Pins */}
      <mesh position={[-0.095, 0.012, 0]}>
        <boxGeometry args={[0.015, 0.024, 0.24]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh position={[0.095, 0.012, 0]}>
        <boxGeometry args={[0.015, 0.024, 0.24]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.3} metalness={0.8} />
      </mesh>
      {/* Power Status LED */}
      <mesh position={[-0.06, 0.022, 0.09]}>
        <boxGeometry args={[0.008, 0.006, 0.008]} />
        <meshBasicMaterial color={isOnline ? '#ef4444' : '#475569'} />
      </mesh>
      {/* Activity Status LED (Berkedip hijau saat transmisi, cyan saat online, mati saat offline) */}
      <mesh position={[-0.035, 0.022, 0.09]}>
        <boxGeometry args={[0.008, 0.006, 0.008]} />
        <meshBasicMaterial color={isTransmitting ? '#10b981' : (isOnline ? '#00f2fe' : '#334155')} />
      </mesh>
    </group>
  );
};

interface ErrorBoundaryState {
  hasError: boolean;
}

class ModelErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn('Gagal memuat GLB ESP32, beralih ke fallback prosedural:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const LowPolyESP32Model: React.FC<{
  isOnline?: boolean;
}> = ({ isOnline = true }) => {
  const gltf = useGLTF(ESP32_MODEL_PATH);
  const clonedScene = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [gltf.scene]);

  // Efek LED statis (ON saat online, OFF saat offline - tanpa kedip/pulsing)
  useEffect(() => {
    clonedScene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh && mesh.material) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mesh.name.includes('LedSMDRED')) {
          if (mat.emissive) {
            mat.emissive.set(isOnline ? '#ef4444' : '#000000');
            mat.emissiveIntensity = isOnline ? 0.9 : 0;
          }
        }
        if (mesh.name.includes('LedSMDBLUE')) {
          if (mat.emissive) {
            mat.emissive.set(isOnline ? '#00f2fe' : '#000000');
            mat.emissiveIntensity = isOnline ? 0.9 : 0;
          }
        }
      }
    });
  }, [clonedScene, isOnline]);

  return (
    <group>
      <primitive object={clonedScene} />
      {/* Micro Point Light statis ON/OFF */}
      <pointLight
        position={[0, 0.04, 0.05]}
        distance={0.8}
        decay={2}
        intensity={isOnline ? 0.45 : 0}
        color="#00f2fe"
      />
    </group>
  );
};

export const ESP32Board3D: React.FC<ESP32BoardProps> = ({
  position = [0.85, 0.575, -1.40],
  rotation = [0, 0, 0],
  scale = 1,
  isOnline = true,
  isTransmitting = false,
  onInspect,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  const handlePointerOver = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (typeof document !== 'undefined') {
      document.body.style.cursor = 'pointer';
    }
  };

  const handlePointerOut = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (typeof document !== 'undefined') {
      document.body.style.cursor = 'auto';
    }
  };

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onInspect?.();
  };

  const fallback = <ProceduralESP32Fallback isOnline={isOnline} isTransmitting={isTransmitting} />;

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={scale}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      <ModelErrorBoundary fallback={fallback}>
        <Suspense fallback={fallback}>
          <LowPolyESP32Model isOnline={isOnline} />
        </Suspense>
      </ModelErrorBoundary>
    </group>
  );
};

// Preload the lightweight 148KB GLB for instant 0ms mount
if (typeof window !== 'undefined') {
  try {
    useGLTF.preload(ESP32_MODEL_PATH);
  } catch {
    // Ignore preload errors in non-browser runner
  }
}

export default ESP32Board3D;
