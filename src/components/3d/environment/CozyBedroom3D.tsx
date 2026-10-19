import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TimeOfDay, getTimeOfDay } from '../effects/DayNightAtmosphere3D';

export const COZY_ROOM_DIMENSIONS = {
  plinth: [6.4, 0.4, 5.2] as const,
  plinthBevel: [6.44, 0.03, 5.24] as const,
  backWall: [5.8, 2.82, 0.50] as const,
  leftWall: [0.48, 2.82, 4.77] as const,
  desk: [2.2, 0.08, 1.1] as const,
  windowFrame: [2.4, 1.5, 0.08] as const,
  windowGlass: [2.2, 1.3] as const,
  bed: [1.3, 0.45, 2.2] as const,
  rug: [2.2, 0.015, 1.6] as const,
  chair: [0.6, 0.85, 0.6] as const,
};

export const WINDOW_WEATHER_CONFIG = {
  sunnySky: '#38bdf8', // Tekanan >= 1013 hPa (Cerah)
  clearSky: '#7dd3fc', // Tekanan 1009 - 1012.9 hPa (Stabil)
  overcastSky: '#64748b', // Tekanan < 1008 hPa (Mendung/Hujan)
  sunsetSky: '#f97316', // Sore (Golden Hour)
  nightSky: '#0b1329', // Malam hari
};

/**
 * Membuat tekstur signage dinding AeroNest identik dengan logo Header
 * Dilengkapi logo heksagonal IoT gradasi emerald-cyan, tipografi AeroNest, badge M3 IoT, dan teks Digital Twin.
 */
export function createWallAeroNestTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, 1600, 360);

  const cy = 180; // Sumbu horizontal tengah sejajar persis antara ikon & teks
  const r = 96;

  // Ukur lebar teks "Aero" dan "Nest" terlebih dahulu untuk centering presisi
  ctx.font = 'bold 132px "Plus Jakarta Sans", "Inter", -apple-system, sans-serif';
  const aeroW = ctx.measureText('Aero').width;
  const nestW = ctx.measureText('Nest').width;
  const gap = 50;
  const iconWidth = r * 2;
  const totalContentWidth = iconWidth + gap + aeroW + nestW;

  // Titik awal X terpusat di kanvas 1600px
  const startX = Math.max((1600 - totalContentWidth) / 2, 40);
  const cx = startX + r;
  const textX = startX + iconWidth + gap;

  // Helper pemetaan titik SVG heksagon (viewBox 100x100)
  const mapSvgPoint = (sx: number, sy: number, radius: number): [number, number] => [
    cx + ((sx - 50) / 42) * radius,
    cy + ((sy - 50) / 42) * radius,
  ];

  // Efek Drop Shadow lembut arsitektural untuk kontras tajam di atas dinding greige
  ctx.shadowColor = 'rgba(15, 23, 42, 0.32)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 4;

  // 1. Outer Hexagon Solid Dark Slate & Emerald-to-Cyan Gradient Stroke
  const outerSvg = [[50, 8], [86, 29], [86, 71], [50, 92], [14, 71], [14, 29]];
  ctx.beginPath();
  outerSvg.forEach(([sx, sy], idx) => {
    const [px, py] = mapSvgPoint(sx, sy, r);
    if (idx === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
  ctx.fill();

  const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  grad.addColorStop(0, '#10b981');
  grad.addColorStop(1, '#00f2fe');
  ctx.strokeStyle = grad;
  ctx.lineWidth = 11;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // 2. Inner Dashed Hexagon
  const innerSvg = [[32, 38], [50, 28], [68, 38], [68, 58], [50, 68], [32, 58]];
  ctx.beginPath();
  innerSvg.forEach(([sx, sy], idx) => {
    const [px, py] = mapSvgPoint(sx, sy, r * 0.52);
    if (idx === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.strokeStyle = '#00f2fe';
  ctx.lineWidth = 6;
  ctx.setLineDash([10, 6]);
  ctx.stroke();
  ctx.setLineDash([]);

  // 3. Center Circle (Emerald)
  ctx.beginPath();
  ctx.arc(cx, cy - 2, 13, 0, Math.PI * 2);
  ctx.fillStyle = '#10b981';
  ctx.fill();

  // 4. Tipografi "Aero" dan "Nest" (Sejajar Vertikal di Sumbu cy)
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 132px "Plus Jakarta Sans", "Inter", -apple-system, sans-serif';

  // "Aero" - Deep rich charcoal slate (#0f172a)
  ctx.fillStyle = '#0f172a';
  ctx.fillText('Aero', textX, cy);

  // "Nest" - High-Contrast Deep Cyan Gradient (#0284c7 ke #0369a1) + Outline Halus
  // Mencegah warna cyan pudar / tersamar oleh cahaya lampu kuning & dinding greige hangat
  const nestX = textX + aeroW;
  const nestGrad = ctx.createLinearGradient(nestX, cy - 60, nestX, cy + 60);
  nestGrad.addColorStop(0, '#0284c7'); // Vivid cyan-600
  nestGrad.addColorStop(1, '#0369a1'); // Deep sapphire cyan-700
  ctx.fillStyle = nestGrad;
  ctx.fillText('Nest', nestX, cy);

  // Outline kontras tipis pada "Nest" agar tepi huruf selalu tegas terdefinisi
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.4)';
  ctx.lineWidth = 2.5;
  ctx.strokeText('Nest', nestX, cy);

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export function getSkyColor(tekanan: number = 1012, timeOfDay: TimeOfDay = 'siang'): string {
  if (timeOfDay === 'malam') return WINDOW_WEATHER_CONFIG.nightSky;
  if (timeOfDay === 'sore') return WINDOW_WEATHER_CONFIG.sunsetSky;
  if (timeOfDay === 'pagi') return WINDOW_WEATHER_CONFIG.clearSky;

  // Siang hari merespons tekanan barometer
  if (tekanan >= 1013) return WINDOW_WEATHER_CONFIG.sunnySky;
  if (tekanan >= 1009) return WINDOW_WEATHER_CONFIG.clearSky;
  return WINDOW_WEATHER_CONFIG.overcastSky;
}

export const getSkyColorByPressure = (tekanan: number = 1012): string => getSkyColor(tekanan, 'siang');

export function getCondensationOpacity(rh: number = 55): number {
  if (rh <= 70) return 0;
  return Math.min(Math.max((rh - 70) / 20, 0), 0.75);
}

// Komponen Hujan Animatif di Luar Jendela (Aktif saat Tekanan Rendah < 1008 hPa)
const RainParticles: React.FC = () => {
  const rainRef = useRef<THREE.Group>(null);
  const drops = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => ({
      x: ((i % 6) / 5 - 0.5) * 2.1 + (Math.sin(i * 1.7) * 0.12),
      initialY: ((i / 24) - 0.5) * 1.2,
      speed: 1.8 + (i % 4) * 0.4,
      length: 0.12 + (i % 3) * 0.04,
    }));
  }, []);

  useFrame((_, delta) => {
    if (rainRef.current) {
      rainRef.current.children.forEach((child, i) => {
        child.position.y -= drops[i].speed * delta;
        if (child.position.y < -0.65) {
          child.position.y = 0.65;
        }
      });
    }
  });

  return (
    <group ref={rainRef} position={[0, 0, -0.06]}>
      {drops.map((drop, i) => (
        <mesh key={i} position={[drop.x, drop.initialY, 0]} rotation={[0, 0, -0.1]}>
          <cylinderGeometry args={[0.003, 0.003, drop.length, 4]} />
          <meshBasicMaterial color="#94a3b8" transparent opacity={0.65} />
        </mesh>
      ))}
    </group>
  );
};

// Tanaman Hias Daun Bertingkat (Monstera / Ficus) yang Merespons Kelembapan Udara (RH)
const LushPottedPlant: React.FC<{ position: [number, number, number]; kelembapan?: number }> = ({
  position,
  kelembapan = 55,
}) => {
  // Palet warna daun dinamis sesuai kelembapan kamar:
  // - Kering (<40%): daun kekuningan pucat (thirsty)
  // - Ideal (50-65%): hijau zamrud segar cerah (vibrant & healthy)
  // - Sangat lembap (>70%): hijau rimba tua (humid saturated)
  const leafColors = useMemo(() => {
    if (kelembapan < 40) {
      return ['#84cc16', '#a3e635', '#65a30d', '#ca8a04', '#a3e635'];
    }
    if (kelembapan <= 65) {
      return ['#16a34a', '#22c55e', '#15803d', '#16a34a', '#22c55e'];
    }
    return ['#14532d', '#166534', '#052e16', '#14532d', '#166534'];
  }, [kelembapan]);

  return (
    <group position={position}>
      {/* Pot Keramik Putih Elegan */}
      <mesh castShadow>
        <cylinderGeometry args={[0.11, 0.08, 0.16, 16]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.1} />
      </mesh>
      {/* Tanah Pot Gelap Humus */}
      <mesh position={[0, 0.075, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.02, 16]} />
        <meshStandardMaterial color="#291e14" roughness={0.9} />
      </mesh>

      {/* Daun-daun Segar Berbagai Sudut & Tingkat */}
      {[
        { rot: [0.35, 0.2, -0.2] as [number, number, number], pos: [0.07, 0.14, 0.04] as [number, number, number], scale: [1, 1, 1] as [number, number, number] },
        { rot: [-0.3, 0.8, 0.3] as [number, number, number], pos: [-0.06, 0.16, 0.05] as [number, number, number], scale: [0.9, 0.9, 0.9] as [number, number, number] },
        { rot: [0.2, -0.9, -0.4] as [number, number, number], pos: [-0.05, 0.13, -0.06] as [number, number, number], scale: [1.1, 1.1, 1.1] as [number, number, number] },
        { rot: [-0.25, -0.4, 0.35] as [number, number, number], pos: [0.06, 0.17, -0.05] as [number, number, number], scale: [0.85, 0.85, 0.85] as [number, number, number] },
        { rot: [0.05, 0, 0] as [number, number, number], pos: [0, 0.2, 0] as [number, number, number], scale: [1.15, 1.15, 1.15] as [number, number, number] },
      ].map((leaf, idx) => (
        <group key={idx} position={leaf.pos} rotation={leaf.rot} scale={leaf.scale}>
          {/* Batang Daun */}
          <mesh position={[0, 0.035, 0]} castShadow>
            <cylinderGeometry args={[0.007, 0.007, 0.1, 6]} />
            <meshStandardMaterial color="#14532d" roughness={0.6} />
          </mesh>
          {/* Helaian Daun Lebar Melengkung */}
          <mesh position={[0, 0.1, 0.035]} rotation={[0.4, 0, 0]} castShadow>
            <boxGeometry args={[0.1, 0.005, 0.17]} />
            <meshStandardMaterial color={leafColors[idx]} roughness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export interface CozyBedroomProps {
  tekanan?: number;
  kelembapan?: number;
  suhu?: number;
  timeOfDay?: TimeOfDay;
  outdoorAqiColor?: string;
  position?: [number, number, number];
}

export const CozyBedroom3D: React.FC<CozyBedroomProps> = ({
  tekanan = 1012,
  kelembapan = 55,
  timeOfDay: timeOfDayProp,
  position = [0, 0, 0],
}) => {
  const currentHour = new Date().getHours();
  const timeOfDay = timeOfDayProp ?? getTimeOfDay(currentHour);
  const skyColor = getSkyColor(tekanan, timeOfDay);
  const condensationOpacity = getCondensationOpacity(kelembapan);
  const isNightOrEvening = timeOfDay === 'malam' || timeOfDay === 'sore';

  const wallLogoTexture = useMemo(() => createWallAeroNestTexture(), []);

  useEffect(() => {
    return () => {
      wallLogoTexture?.dispose();
    };
  }, [wallLogoTexture]);

  return (
    <group position={position}>
      {/* 1. Lantai Kamar Parket Kayu Hangat & Pedestal Plinth */}
      <mesh receiveShadow position={[0, -0.4, 0]}>
        <boxGeometry args={[...COZY_ROOM_DIMENSIONS.plinth]} />
        <meshStandardMaterial color="#c29b68" roughness={0.65} metalness={0.1} />
      </mesh>
      <mesh position={[0, -0.19, 0]}>
        <boxGeometry args={[...COZY_ROOM_DIMENSIONS.plinthBevel]} />
        <meshStandardMaterial color="#a17646" roughness={0.7} />
      </mesh>

      {/* Karpet Kamar Woven Hangat di Bawah Meja & Kursi */}
      <mesh receiveShadow position={[0.85, -0.185, -1.30]}>
        <boxGeometry args={[...COZY_ROOM_DIMENSIONS.rug]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.85} />
      </mesh>
      {/* Garis Aksen Aestetik Karpet */}
      <mesh position={[0.85, -0.18, -1.30]}>
        <boxGeometry args={[2.0, 0.002, 1.4]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
      </mesh>

      {/* 2. Dinding Kamar Arsitektural Hangat (Matte Greige) Menapak Kokoh di Lantai Plinth */}
      <group position={[0, 1.3, -2.1]}>
        {/* Dinding Belakang Kiri (di sebelah kiri jendela) - Menapak Solid ke Lantai (Tebal 0.50m) */}
        <mesh receiveShadow position={[-2.35, -0.11, -0.16]}>
          <boxGeometry args={[1.1, 2.82, 0.50]} />
          <meshStandardMaterial color="#dedad4" roughness={0.92} metalness={0.02} />
        </mesh>

        {/* Dinding Belakang Kanan (di sebelah kanan jendela) - Menapak Solid ke Lantai (Tebal 0.50m) */}
        <mesh receiveShadow position={[1.75, -0.11, -0.16]}>
          <boxGeometry args={[2.3, 2.82, 0.50]} />
          <meshStandardMaterial color="#dedad4" roughness={0.92} metalness={0.02} />
        </mesh>

        {/* Dinding Bawah Ambang Jendela - Menutup Rapat ke Lantai (Tebal 0.50m) */}
        <mesh receiveShadow position={[-0.6, -1.01, -0.16]}>
          <boxGeometry args={[2.4, 1.02, 0.50]} />
          <meshStandardMaterial color="#dedad4" roughness={0.92} metalness={0.02} />
        </mesh>

        {/* Dinding Atas Ambang Jendela (Tebal 0.50m) */}
        <mesh receiveShadow position={[-0.6, 1.15, -0.16]}>
          <boxGeometry args={[2.4, 0.3, 0.50]} />
          <meshStandardMaterial color="#dedad4" roughness={0.92} metalness={0.02} />
        </mesh>

        {/* ======================================================== */}
        {/* PEMANDANGAN DI LUAR JENDELA (Outdoor Weather Vista)       */}
        {/* ======================================================== */}
        <group position={[-0.6, 0.25, -0.15]}>
          {/* Latar Langit Luar Jendela (Ukuran Presisi Tertutup Rapi di Dalam Kusen) */}
          <mesh position={[0, 0, -0.2]}>
            <planeGeometry args={[2.35, 1.4]} />
            <meshBasicMaterial color={skyColor} />
          </mesh>

          {/* Sinar Matahari Cerah Terik (Aktif saat Siang/Pagi & Tekanan Tinggi >= 1013 hPa) */}
          {timeOfDay !== 'malam' && tekanan >= 1013 && (
            <group position={[0.7, 0.35, -0.15]}>
              <mesh>
                <sphereGeometry args={[0.18, 16, 16]} />
                <meshBasicMaterial color={timeOfDay === 'sore' ? '#fb923c' : '#fef08a'} />
              </mesh>
              <mesh position={[0, 0, -0.01]}>
                <ringGeometry args={[0.2, 0.36, 24]} />
                <meshBasicMaterial color={timeOfDay === 'sore' ? '#fed7aa' : '#fef9c3'} transparent opacity={0.4} />
              </mesh>
            </group>
          )}

          {/* Bulan Sabit & Bintang Tenang saat Malam Hari */}
          {timeOfDay === 'malam' && (
            <group position={[0.65, 0.35, -0.15]}>
              <mesh>
                <sphereGeometry args={[0.14, 16, 16]} />
                <meshBasicMaterial color="#fef9c3" />
              </mesh>
              {/* Mask bayangan bulan sabit */}
              <mesh position={[-0.04, 0.03, 0.02]}>
                <sphereGeometry args={[0.13, 16, 16]} />
                <meshBasicMaterial color="#0b1329" />
              </mesh>
              {/* Bintang-bintang kecil */}
              {[
                [-0.8, 0.38, 0.01],
                [-0.4, 0.45, 0.01],
                [-0.6, 0.2, 0.01],
                [0.1, 0.42, 0.01],
                [0.3, 0.22, 0.01],
              ].map(([sx, sy, sz], idx) => (
                <mesh key={idx} position={[sx, sy, sz]}>
                  <sphereGeometry args={[0.012, 6, 6]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
              ))}
            </group>
          )}

          {/* Gumpalan Awan Stylized 3D (Putih Tenang atau Kelabu Mendung) */}
          {timeOfDay !== 'malam' && (
            tekanan >= 1008 ? (
              <group position={[-0.4, 0.3, -0.12]}>
                <mesh position={[-0.18, 0, 0]}>
                  <sphereGeometry args={[0.13, 12, 12]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.9} />
                </mesh>
                <mesh position={[0, 0.06, 0]}>
                  <sphereGeometry args={[0.19, 12, 12]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.9} />
                </mesh>
                <mesh position={[0.18, 0, 0]}>
                  <sphereGeometry args={[0.13, 12, 12]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.9} />
                </mesh>
              </group>
            ) : (
              <group position={[-0.2, 0.3, -0.12]}>
                <mesh position={[-0.24, 0, 0]}>
                  <sphereGeometry args={[0.18, 12, 12]} />
                  <meshStandardMaterial color="#475569" roughness={0.9} />
                </mesh>
                <mesh position={[0, 0.06, 0]}>
                  <sphereGeometry args={[0.22, 12, 12]} />
                  <meshStandardMaterial color="#334155" roughness={0.9} />
                </mesh>
                <mesh position={[0.24, 0, 0]}>
                  <sphereGeometry args={[0.18, 12, 12]} />
                  <meshStandardMaterial color="#475569" roughness={0.9} />
                </mesh>
              </group>
            )
          )}

          {/* Cakrawala Bukit Hijau & Pohon di Kejauhan */}
          <group position={[0, -0.35, -0.1]}>
            <mesh position={[-0.6, 0, 0]} scale={[1.4, 0.55, 0.4]}>
              <sphereGeometry args={[0.7, 16, 16]} />
              <meshStandardMaterial color={timeOfDay === 'malam' ? '#064e3b' : '#22c55e'} roughness={0.8} />
            </mesh>
            <mesh position={[0.55, -0.04, -0.02]} scale={[1.5, 0.5, 0.4]}>
              <sphereGeometry args={[0.7, 16, 16]} />
              <meshStandardMaterial color={timeOfDay === 'malam' ? '#065f46' : '#16a34a'} roughness={0.8} />
            </mesh>
            {/* Siluet Pepohonan Hijau */}
            {[-0.5, -0.2, 0.2, 0.6].map((tx, idx) => (
              <group key={idx} position={[tx, 0.18, 0.04]}>
                <mesh position={[0, 0.07, 0]}>
                  <coneGeometry args={[0.06, 0.16, 8]} />
                  <meshStandardMaterial color={timeOfDay === 'malam' ? '#022c22' : '#15803d'} roughness={0.7} />
                </mesh>
                <mesh position={[0, -0.03, 0]}>
                  <cylinderGeometry args={[0.012, 0.012, 0.06, 6]} />
                  <meshStandardMaterial color="#78350f" roughness={0.9} />
                </mesh>
              </group>
            ))}
          </group>

          {/* Efek Hujan Rintik Jatuh jika Tekanan Rendah (< 1008 hPa) */}
          {tekanan < 1008 && <RainParticles />}
        </group>

        {/* ======================================================== */}
        {/* ARSITEKTUR BINGKAI JENDELA & KACA BERONGGA               */}
        {/* ======================================================== */}
        <group position={[-0.6, 0.25, 0.05]}>
          {/* Ambang Atas (Top Lintel) - Putih Bersih Satin Tegas */}
          <mesh position={[0, 0.75, 0]} castShadow>
            <boxGeometry args={[2.44, 0.06, 0.1]} />
            <meshStandardMaterial color="#ffffff" roughness={0.25} metalness={0.05} />
          </mesh>
          {/* Ambang Bawah / Window Sill (Menjorok ke Ruangan Kamar dengan Kontras Tajam) */}
          <mesh position={[0, -0.75, 0.06]} castShadow>
            <boxGeometry args={[2.54, 0.08, 0.22]} />
            <meshStandardMaterial color="#ffffff" roughness={0.25} metalness={0.05} />
          </mesh>
          {/* Tiang Bingkai Kiri */}
          <mesh position={[-1.19, 0, 0]} castShadow>
            <boxGeometry args={[0.06, 1.5, 0.1]} />
            <meshStandardMaterial color="#ffffff" roughness={0.25} metalness={0.05} />
          </mesh>
          {/* Tiang Bingkai Kanan */}
          <mesh position={[1.19, 0, 0]} castShadow>
            <boxGeometry args={[0.06, 1.5, 0.1]} />
            <meshStandardMaterial color="#ffffff" roughness={0.25} metalness={0.05} />
          </mesh>

          {/* Kisi Pembagi Kaca Minimalis (Mullions: Vertikal & Horizontal Arsitektural Slate Modern) */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.04, 1.44, 0.055]} />
            <meshStandardMaterial color="#475569" roughness={0.35} metalness={0.2} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[2.32, 0.04, 0.055]} />
            <meshStandardMaterial color="#475569" roughness={0.35} metalness={0.2} />
          </mesh>

          {/* Kaca Jendela Transparan Bening */}
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[2.32, 1.44]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.18} roughness={0.05} metalness={0.4} />
          </mesh>

          {/* Lapisan Kondensasi Embun Kaca (Merespons Kelembapan > 70%) */}
          {condensationOpacity > 0 && (
            <mesh position={[0, 0, 0.005]}>
              <planeGeometry args={[2.32, 1.44]} />
              <meshStandardMaterial color="#f8fafc" transparent opacity={condensationOpacity} roughness={0.8} />
            </mesh>
          )}

          {/* Sukulen Mini di Atas Ambang Jendela */}
          <group position={[0.7, -0.68, 0.08]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.05, 0.04, 0.08, 12]} />
              <meshStandardMaterial color="#fed7aa" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.05, 0]} castShadow>
              <sphereGeometry args={[0.055, 10, 10]} />
              <meshStandardMaterial color="#10b981" roughness={0.6} />
            </mesh>
          </group>

          {/* Batang Rel & Tirai Kain Kamar Lembut */}
          <mesh position={[0, 0.84, 0.08]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.015, 0.015, 2.7, 12]} />
            <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Tirai Sisi Kiri Terlipat Rapi */}
          <mesh position={[-1.24, 0, 0.07]} castShadow>
            <boxGeometry args={[0.22, 1.6, 0.08]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.85} />
          </mesh>
          {/* Tirai Sisi Kanan Terlipat Rapi */}
          <mesh position={[1.24, 0, 0.07]} castShadow>
            <boxGeometry args={[0.22, 1.6, 0.08]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.85} />
          </mesh>
        </group>

        {/* Rak Dinding Dekorasi Kamar & Koleksi Buku */}
        <group position={[1.8, 0.6, 0.15]}>
          <mesh castShadow>
            <boxGeometry args={[1.2, 0.05, 0.3]} />
            <meshStandardMaterial color="#c29b68" roughness={0.6} />
          </mesh>
          {/* Buku-buku Warna-warni di Atas Rak */}
          {[-0.3, -0.15, 0, 0.2].map((bx, idx) => (
            <mesh key={idx} position={[bx, 0.12, 0]} castShadow>
              <boxGeometry args={[0.08, 0.2, 0.2]} />
              <meshStandardMaterial color={['#38bdf8', '#fbbf24', '#34d399', '#f472b6'][idx]} roughness={0.5} />
            </mesh>
          ))}
          {/* Tanaman Ivy Menjuntai di Ujung Rak */}
          <group position={[0.42, 0.1, 0.05]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.07, 0.05, 0.1, 12]} />
              <meshStandardMaterial color="#ffffff" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.06, 0]}>
              <sphereGeometry args={[0.08, 8, 8]} />
              <meshStandardMaterial color="#16a34a" roughness={0.7} />
            </mesh>
            <mesh position={[0.04, -0.06, 0.05]}>
              <sphereGeometry args={[0.04, 6, 6]} />
              <meshStandardMaterial color="#22c55e" roughness={0.7} />
            </mesh>
          </group>
        </group>

        {/* Bingkai Lukisan Poster Aestetik Minimalis di Dinding Belakang */}
        <group position={[1.8, -0.2, 0.1]}>
          {/* Bingkai Kayu Hitam Elegan */}
          <mesh castShadow>
            <boxGeometry args={[0.8, 0.95, 0.03]} />
            <meshStandardMaterial color="#1e293b" roughness={0.4} />
          </mesh>
          {/* Kanvas Poster Sunset Minimalis */}
          <mesh position={[0, 0, 0.02]}>
            <planeGeometry args={[0.72, 0.87]} />
            <meshBasicMaterial color="#fed7aa" />
          </mesh>
          {/* Siluet Matahari Poster */}
          <mesh position={[0, 0.1, 0.025]}>
            <circleGeometry args={[0.18, 24]} />
            <meshBasicMaterial color="#ea580c" />
          </mesh>
        </group>
      </group>

      {/* Dinding Samping Kiri - Menembus Solid ke Lantai Plinth (Tebal 0.48m, Panjang 4.77m) */}
      <group position={[-2.94, 1.19, 0.0]}>
        <mesh receiveShadow>
          <boxGeometry args={[...COZY_ROOM_DIMENSIONS.leftWall]} />
          <meshStandardMaterial color="#dedad4" roughness={0.92} metalness={0.02} />
        </mesh>
      </group>

      {/* Wall Branding Signage "AeroNest" di Dinding Samping Kiri (Lebar ~72% Dinding, Sejajar & High-Contrast) */}
      {/* Offset X = -2.692 (8mm di depan permukaan dinding X = -2.70) + polygonOffset agar bebas Z-fighting / kelap-kelip */}
      {wallLogoTexture && (
        <mesh position={[-2.692, 1.70, 0.0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[3.15, 0.708]} />
          <meshBasicMaterial
            map={wallLogoTexture}
            transparent
            toneMapped={false}
            side={THREE.FrontSide}
            polygonOffset
            polygonOffsetFactor={-4}
            polygonOffsetUnits={-4}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Lis Profil Dinding Bawah (Skirting Boards / Plinth Lis Kayu Hangat) */}
      {/* Menghubungkan Dinding Belakang & Kiri Menapak Kuat ke Lantai Parket Tanpa Celah */}
      <mesh receiveShadow position={[0, -0.135, -2.0]}>
        <boxGeometry args={[5.8, 0.08, 0.025]} />
        <meshStandardMaterial color="#854d0e" roughness={0.6} />
      </mesh>
      <mesh receiveShadow position={[-2.70, -0.135, 0.0]}>
        <boxGeometry args={[0.025, 0.08, 4.77]} />
        <meshStandardMaterial color="#854d0e" roughness={0.6} />
      </mesh>

      {/* ======================================================== */}
      {/* 3. TEMPAT TIDUR KAMAR NYAMAN (Cozy Platform Bed)          */}
      {/* ======================================================== */}
      <group position={[-1.9, -0.05, -0.2]}>
        {/* Rangka Kayu Dipan Kasur Menapak Rapat di Lantai */}
        <mesh castShadow receiveShadow position={[0, -0.022, 0]}>
          <boxGeometry args={[1.3, 0.25, 2.2]} />
          <meshStandardMaterial color="#a16207" roughness={0.65} />
        </mesh>
        {/* Sandaran Kepala Tempat Tidur (Headboard) - Selaras di dekat Bantal & Merapat ke Dinding */}
        <mesh castShadow position={[-0.764, 0.303, -0.395]}>
          <boxGeometry args={[0.12, 0.85, 1.3]} />
          <meshStandardMaterial color="#854d0e" roughness={0.6} />
        </mesh>

        {/* Kasur Busa Empuk & Bersih */}
        <mesh castShadow receiveShadow position={[0.02, 0.173, 0]}>
          <boxGeometry args={[1.2, 0.22, 2.1]} />
          <meshStandardMaterial color="#fdfdfd" roughness={0.8} />
        </mesh>

        {/* Selimut / Quilt Lipat Kasur Warna Cozy Denim Blue */}
        <mesh castShadow receiveShadow position={[0.02, 0.193, 0.38]}>
          <boxGeometry args={[1.24, 0.24, 1.3]} />
          <meshStandardMaterial color="#93c5fd" roughness={0.7} />
        </mesh>
        {/* Lipatan Ujung Selimut (Cuff Bed) */}
        <mesh position={[0.02, 0.295, -0.268]}>
          <boxGeometry args={[1.25, 0.06, 0.18]} />
          <meshStandardMaterial color="#bfdbfe" roughness={0.8} />
        </mesh>

        {/* Bantal Empuk Tempat Tidur Menempel Rapi di Kasur */}
        <mesh position={[-0.25, 0.333, -0.75]} rotation={[0.2, 0, 0]} castShadow>
          <boxGeometry args={[0.45, 0.14, 0.32]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.8} />
        </mesh>
        <mesh position={[0.25, 0.333, -0.75]} rotation={[0.2, 0, 0]} castShadow>
          <boxGeometry args={[0.45, 0.14, 0.32]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.8} />
        </mesh>

        {/* Meja Nakas Samping Tempat Tidur (Bedside Nightstand) - Ketinggian Selaras Kasur */}
        <group position={[-0.05, -0.125, -1.35]}>
          <mesh castShadow position={[0, 0.19, 0]}>
            <boxGeometry args={[0.4, 0.38, 0.4]} />
            <meshStandardMaterial color="#b45309" roughness={0.6} />
          </mesh>
          {/* Laci Nakas */}
          <mesh position={[0, 0.26, 0.21]}>
            <boxGeometry args={[0.32, 0.14, 0.02]} />
            <meshStandardMaterial color="#92400e" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.26, 0.23]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.04, 8]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.8} />
          </mesh>

          {/* Lampu Tidur Meja Nakas Hangat (Menyala Otomatis saat Sore / Malam) */}
          <group position={[0, 0.38, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.08, 0.1, 0.02, 12]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.7} />
            </mesh>
            <mesh position={[0, 0.12, 0]} castShadow>
              <coneGeometry args={[0.1, 0.16, 12, 1, true]} />
              <meshStandardMaterial color="#fef3c7" roughness={0.4} side={THREE.DoubleSide} />
            </mesh>
            <pointLight
              position={[0, 0.1, 0]}
              intensity={isNightOrEvening ? 1.4 : 0.4}
              distance={2.5}
              color="#f59e0b"
              decay={2}
            />
          </group>
        </group>
      </group>

      {/* ======================================================== */}
      {/* 4. KURSI KERJA ERGONOMIS MEJA (Ergonomic Study Chair)     */}
      {/* ======================================================== */}
      <group position={[0.85, 0.20, -0.85]}>
        {/* Kaki Roda Bintang 5 Kursi */}
        {[0, 1, 2, 3, 4].map((i) => {
          const angle = (i * Math.PI * 2) / 5;
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * 0.25, -0.36, Math.sin(angle) * 0.25]}
              rotation={[0, -angle, 0]}
            >
              <boxGeometry args={[0.25, 0.03, 0.04]} />
              <meshStandardMaterial color="#0f172a" roughness={0.5} />
            </mesh>
          );
        })}
        {/* Tiang Hidrolik Kursi */}
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.35, 12]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Dudukan Kursi Berbusa Nyaman */}
        <mesh position={[0, -0.02, 0]} castShadow>
          <boxGeometry args={[0.54, 0.08, 0.5]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} />
        </mesh>
        {/* Sandaran Punggung Ergonomis */}
        <mesh position={[0, 0.28, 0.24]} rotation={[-0.1, 0, 0]} castShadow>
          <boxGeometry args={[0.5, 0.52, 0.05]} />
          <meshStandardMaterial color="#334155" roughness={0.5} />
        </mesh>
        {/* Sandaran Tangan (Armrests) */}
        <mesh position={[-0.28, 0.1, 0]}>
          <boxGeometry args={[0.05, 0.16, 0.32]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </mesh>
        <mesh position={[0.28, 0.1, 0]}>
          <boxGeometry args={[0.05, 0.16, 0.32]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </mesh>
      </group>

      {/* ======================================================== */}
      {/* 5. MEJA KERJA KAMAR & AKSESORIS ESTETIK (Skala 2.2x1.1m) */}
      {/* ======================================================== */}
      <group position={[0.85, 0.295, -1.40]}>
        {/* Tabletop Meja Kayu Cerah Bersih */}
        <mesh castShadow receiveShadow position={[0, 0.22, 0]}>
          <boxGeometry args={[...COZY_ROOM_DIMENSIONS.desk]} />
          <meshStandardMaterial color="#fdfdfd" roughness={0.35} metalness={0.08} />
        </mesh>

        {/* Desk Mat Kulit Hitam Slate untuk Tempat Kerja Minimalis */}
        <mesh position={[0, 0.262, 0.02]}>
          <boxGeometry args={[1.5, 0.004, 0.65]} />
          <meshStandardMaterial color="#1e293b" roughness={0.55} />
        </mesh>

        {/* 4 Kaki Meja Kayu Ramping & Presisi (Menyambung Daun Meja ke Lantai) */}
        {[
          [-0.95, -0.15, -0.42],
          [0.95, -0.15, -0.42],
          [-0.95, -0.15, 0.42],
          [0.95, -0.15, 0.42],
        ].map(([kx, ky, kz], idx) => (
          <mesh key={idx} castShadow position={[kx, ky, kz]}>
            <cylinderGeometry args={[0.035, 0.035, 0.64, 16]} />
            <meshStandardMaterial color="#c29b68" roughness={0.45} />
          </mesh>
        ))}

        {/* Tanaman Pot Meja Alami yang Merespons Kelembapan Udara */}
        <LushPottedPlant position={[-0.8, 0.27, -0.28]} kelembapan={kelembapan} />

        {/* Lampu Meja Warm Light (Cozy Desk Lamp) */}
        <group position={[0.8, 0.27, -0.28]}>
          {/* Alas Lampu */}
          <mesh castShadow>
            <cylinderGeometry args={[0.08, 0.1, 0.02, 16]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.8} />
          </mesh>
          {/* Tiang Lampu Kuningan */}
          <mesh position={[0, 0.16, 0]} castShadow>
            <cylinderGeometry args={[0.012, 0.012, 0.32, 12]} />
            <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Kap Lampu Kerucut */}
          <mesh position={[0, 0.32, 0]} castShadow>
            <coneGeometry args={[0.13, 0.15, 16, 1, true]} />
            <meshStandardMaterial color="#fef3c7" roughness={0.25} side={THREE.DoubleSide} />
          </mesh>
          {/* Titik Cahaya Bohlam Warm Lampu Meja (Menyala Otomatis saat Sore / Malam) */}
          <pointLight
            position={[0, 0.30, 0]}
            intensity={isNightOrEvening ? 2.2 : 0.8}
            distance={3.0}
            color="#fbbf24"
            decay={2}
          />
        </group>
      </group>
    </group>
  );
};

export default CozyBedroom3D;
