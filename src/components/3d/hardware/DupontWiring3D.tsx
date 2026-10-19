import React, { useMemo } from 'react';
import * as THREE from 'three';

export interface WireDefinition {
  name: string;
  color: string;
  points: [number, number, number][];
  radius?: number;
  from?: string;
  to?: string;
}

export const DEFAULT_WIRE_RADIUS = 0.028;
export const TUBE_SEGMENTS = 32;
export const RADIAL_SEGMENTS = 8;

/**
 * Konfigurasi 7 kabel jumper Dupont realistis:
 * 1. I2C SCL (Kuning) - Wemos D1 (GPIO 5) ke Sensor SCL
 * 2. I2C SDA (Hijau) - Wemos D2 (GPIO 4) ke Sensor SDA
 * 3. 3V3 Power (Merah) - Wemos 3V3 ke Sensor VIN
 * 4. Ground (Cokelat) - Wemos G ke Sensor GND
 * 5. Deep Sleep Jumper (Oranye) - Wemos D0 (GPIO 16) ke RST
 * 6. Kabel Daya Baterai Positif (Merah) - Dari kutub baterai ke rel 5V Wemos
 * 7. Kabel Daya Baterai Ground (Hitam) - Dari kutub baterai ke GND Wemos
 */
export const DUPONT_WIRES: WireDefinition[] = [
  {
    name: 'I2C SCL (Kuning)',
    color: '#eab308',
    radius: DEFAULT_WIRE_RADIUS,
    from: 'Wemos D1 (GPIO 5)',
    to: 'Sensor SCL',
    points: [
      [0.45, 0.18, -0.22],
      [0.7, 0.38, -0.05],
      [1.0, 0.35, 0.2],
      [1.15, 0.15, 0.45],
    ],
  },
  {
    name: 'I2C SDA (Hijau)',
    color: '#22c55e',
    radius: DEFAULT_WIRE_RADIUS,
    from: 'Wemos D2 (GPIO 4)',
    to: 'Sensor SDA',
    points: [
      [0.45, 0.18, -0.08],
      [0.72, 0.42, 0.08],
      [1.02, 0.37, 0.28],
      [1.2, 0.15, 0.45],
    ],
  },
  {
    name: '3V3 Power (Merah)',
    color: '#ef4444',
    radius: DEFAULT_WIRE_RADIUS,
    from: 'Wemos 3V3',
    to: 'Sensor VIN',
    points: [
      [-0.45, 0.18, 0.2],
      [-0.1, 0.48, 0.4],
      [0.6, 0.42, 0.45],
      [1.05, 0.15, 0.45],
    ],
  },
  {
    name: 'Ground (Cokelat)',
    color: '#78350f',
    radius: DEFAULT_WIRE_RADIUS,
    from: 'Wemos G',
    to: 'Sensor GND',
    points: [
      [0.45, 0.18, 0.34],
      [0.75, 0.32, 0.38],
      [1.1, 0.15, 0.45],
    ],
  },
  {
    name: 'Deep Sleep Jumper (Oranye)',
    color: '#f97316',
    radius: 0.022,
    from: 'Wemos D0 (GPIO 16)',
    to: 'Wemos RST',
    points: [
      [-0.45, 0.18, -0.5],
      [-0.65, 0.32, -0.2],
      [-0.45, 0.18, 0.34],
    ],
  },
  {
    name: 'Battery Positive (Merah)',
    color: '#dc2626',
    radius: 0.036,
    from: 'Battery (+)',
    to: 'Wemos 5V',
    points: [
      [-1.0, 0.15, -0.98],
      [-0.7, 0.3, -0.4],
      [0.45, 0.18, 0.48],
    ],
  },
  {
    name: 'Battery Ground (Hitam)',
    color: '#0f172a',
    radius: 0.036,
    from: 'Battery (-)',
    to: 'Wemos GND',
    points: [
      [-1.6, 0.15, -0.98],
      [-1.0, 0.25, -0.2],
      [-0.45, 0.18, 0.48],
    ],
  },
];

/**
 * Helper untuk membuat THREE.CatmullRomCurve3 dari array titik 3D
 */
export function createWireCurve(
  points: ([number, number, number] | THREE.Vector3)[]
): THREE.CatmullRomCurve3 {
  const vectors = points.map((p) =>
    p instanceof THREE.Vector3 ? p : new THREE.Vector3(p[0], p[1], p[2])
  );
  return new THREE.CatmullRomCurve3(vectors);
}

export interface SingleWireProps {
  points: [number, number, number][];
  color: string;
  radius?: number;
}

export const CurvedWire: React.FC<SingleWireProps> = ({
  points,
  color,
  radius = DEFAULT_WIRE_RADIUS,
}) => {
  const geometry = useMemo(() => {
    const curve = createWireCurve(points);
    return new THREE.TubeGeometry(curve, TUBE_SEGMENTS, radius, RADIAL_SEGMENTS, false);
  }, [points, radius]);

  return (
    <mesh geometry={geometry} castShadow>
      <meshStandardMaterial color={color} roughness={0.35} metalness={0.1} />
    </mesh>
  );
};

export interface DupontWiringProps {
  position?: [number, number, number];
}

export const DupontWiring3D: React.FC<DupontWiringProps> = ({ position = [0, 0, 0] }) => {
  return (
    <group position={position}>
      {DUPONT_WIRES.map((wire, idx) => (
        <CurvedWire
          key={wire.name || idx}
          points={wire.points}
          color={wire.color}
          radius={wire.radius ?? DEFAULT_WIRE_RADIUS}
        />
      ))}
    </group>
  );
};
