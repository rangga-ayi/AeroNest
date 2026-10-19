import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  DupontWiring3D,
  createWireCurve,
  DUPONT_WIRES,
  DEFAULT_WIRE_RADIUS,
  TUBE_SEGMENTS,
  RADIAL_SEGMENTS,
  WireDefinition,
} from '../src/components/3d/hardware/DupontWiring3D';

describe('DupontWiring3D & Spline Curve Specifications', () => {
  describe('Component Definition', () => {
    it('memverifikasi komponen DupontWiring3D terdefinisi', () => {
      expect(DupontWiring3D).toBeDefined();
    });
  });

  describe('createWireCurve Helper', () => {
    it('menghasilkan objek THREE.CatmullRomCurve3 dengan start dan end point yang tepat', () => {
      const points: [number, number, number][] = [
        [-0.5, 0.1, 0.5],
        [0, 0.6, 0.6],
        [0.5, 0.1, 0.5],
      ];

      const curve = createWireCurve(points);
      expect(curve).toBeInstanceOf(THREE.CatmullRomCurve3);

      const sampledPoints = curve.getPoints(20);
      expect(sampledPoints.length).toBe(21);

      expect(sampledPoints[0].x).toBeCloseTo(-0.5);
      expect(sampledPoints[0].y).toBeCloseTo(0.1);
      expect(sampledPoints[0].z).toBeCloseTo(0.5);

      expect(sampledPoints[20].x).toBeCloseTo(0.5);
      expect(sampledPoints[20].y).toBeCloseTo(0.1);
      expect(sampledPoints[20].z).toBeCloseTo(0.5);
    });

    it('menghitung panjang kurva yang positif dan lebih panjang dari garis lurus (arch effect)', () => {
      const p1: [number, number, number] = [0, 0, 0];
      const pMid: [number, number, number] = [0.5, 0.5, 0];
      const p2: [number, number, number] = [1.0, 0, 0];

      const curve = createWireCurve([p1, pMid, p2]);
      const length = curve.getLength();
      const straightDistance = 1.0;

      expect(length).toBeGreaterThan(straightDistance);
    });
  });

  describe('DUPONT_WIRES Configuration', () => {
    it('memiliki total 7 koneksi kabel jumper sesuai skema', () => {
      expect(DUPONT_WIRES.length).toBe(7);
    });

    it('memverifikasi konfigurasi kabel I2C SCL (Kuning)', () => {
      const wire = DUPONT_WIRES.find((w: WireDefinition) => w.name.includes('SCL'));
      expect(wire).toBeDefined();
      expect(wire?.color).toBe('#eab308');
      expect(wire?.points.length).toBeGreaterThanOrEqual(3);
    });

    it('memverifikasi konfigurasi kabel I2C SDA (Hijau)', () => {
      const wire = DUPONT_WIRES.find((w: WireDefinition) => w.name.includes('SDA'));
      expect(wire).toBeDefined();
      expect(wire?.color).toBe('#22c55e');
      expect(wire?.points.length).toBeGreaterThanOrEqual(3);
    });

    it('memverifikasi konfigurasi kabel 3V3 Power (Merah)', () => {
      const wire = DUPONT_WIRES.find((w: WireDefinition) => w.name.includes('3V3'));
      expect(wire).toBeDefined();
      expect(wire?.color).toBe('#ef4444');
      expect(wire?.points.length).toBeGreaterThanOrEqual(3);
    });

    it('memverifikasi konfigurasi kabel Ground (Cokelat)', () => {
      const wire = DUPONT_WIRES.find(
        (w: WireDefinition) => w.name.includes('Ground') && !w.name.includes('Battery')
      );
      expect(wire).toBeDefined();
      expect(wire?.color).toBe('#78350f');
      expect(wire?.points.length).toBeGreaterThanOrEqual(3);
    });

    it('memverifikasi konfigurasi Deep Sleep Jumper D0-RST (Oranye, radius 0.022)', () => {
      const wire = DUPONT_WIRES.find((w: WireDefinition) => w.name.includes('Deep Sleep'));
      expect(wire).toBeDefined();
      expect(wire?.color).toBe('#f97316');
      expect(wire?.radius).toBe(0.022);
      expect(wire?.points.length).toBeGreaterThanOrEqual(3);
    });

    it('memverifikasi konfigurasi kabel daya baterai (+ Merah dan - Hitam, radius 0.036)', () => {
      const battVcc = DUPONT_WIRES.find(
        (w: WireDefinition) => w.name.includes('Battery') && w.color === '#dc2626'
      );
      const battGnd = DUPONT_WIRES.find(
        (w: WireDefinition) => w.name.includes('Battery') && w.color === '#0f172a'
      );

      expect(battVcc).toBeDefined();
      expect(battVcc?.radius).toBe(0.036);

      expect(battGnd).toBeDefined();
      expect(battGnd?.radius).toBe(0.036);
    });

    it('memverifikasi konstanta geometri pipa tube', () => {
      expect(DEFAULT_WIRE_RADIUS).toBe(0.028);
      expect(TUBE_SEGMENTS).toBe(32);
      expect(RADIAL_SEGMENTS).toBe(8);
    });

    it('memastikan setiap kabel menghasilkan TubeGeometry yang valid', () => {
      DUPONT_WIRES.forEach((wire: WireDefinition) => {
        const curve = createWireCurve(wire.points);
        const radius = wire.radius ?? DEFAULT_WIRE_RADIUS;
        const geom = new THREE.TubeGeometry(curve, TUBE_SEGMENTS, radius, RADIAL_SEGMENTS, false);

        expect(geom.getAttribute('position').count).toBeGreaterThan(0);
        geom.dispose();
      });
    });
  });
});
