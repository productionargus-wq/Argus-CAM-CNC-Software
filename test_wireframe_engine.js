/**
 * test_wireframe_engine.js
 * Comprehensive unit test suite for Mastercam Wireframe CAD & Trimming Engine
 */

import assert from 'assert';
import * as THREE from 'three';
import {
  computeArc3Points,
  computeBoltCircle,
  findLineIntersection2D,
  findLineCircleIntersection2D,
  findCurveIntersections,
  performDynamicTrim,
  computeFilletBetweenEntities,
  computeChamferBetweenEntities,
  computeModifyLength,
  computeCloseArc,
  computeBitangentLines,
  snapToGrid,
  snapToEntityPoints
} from './src/utils/cadDrawingEngine.js';
import { createWireframeCircle } from './src/utils/cadGeometry.js';

console.log('--- Testing Mastercam Wireframe CAD & Dynamic Trimming Engine ---');

// 1. Test computeArc3Points
console.log('\n[1] Testing computeArc3Points...');
{
  // 3 points on circle of radius 25 at (0, 0): (0, 25), (25, 0), (0, -25)
  // In CPlane coordinates: x and z (with y elevation 35)
  const p1 = new THREE.Vector3(0, 35, 25);
  const p2 = new THREE.Vector3(25, 35, 0);
  const p3 = new THREE.Vector3(0, 35, -25);

  const res = computeArc3Points(p1, p2, p3);
  assert(res !== null, 'computeArc3Points should solve valid circle');
  assert(Math.abs(res.center.x) < 1e-3, `Expected center.x ~ 0, got ${res.center.x}`);
  assert(Math.abs(res.center.z) < 1e-3, `Expected center.z ~ 0, got ${res.center.z}`);
  assert(Math.abs(res.radius - 25) < 1e-3, `Expected radius ~ 25, got ${res.radius}`);
  assert(Math.abs(res.center.y - 35) < 1e-3, `Expected center.y = 35, got ${res.center.y}`);
  console.log(`  ✓ Circumcenter: (${res.center.x.toFixed(2)}, ${res.center.z.toFixed(2)}), Radius: ${res.radius.toFixed(2)}, Sweep: ${res.startAngleDeg.toFixed(1)}° -> ${res.endAngleDeg.toFixed(1)}°`);
}

// 2. Test computeBoltCircle
console.log('\n[2] Testing computeBoltCircle...');
{
  const center = { x: 50, y: 35, z: -40 };
  const pcd = 100;
  const numHoles = 6;
  const res = computeBoltCircle(center, pcd, numHoles, 0, 4.5, 360);

  assert(res !== null, 'computeBoltCircle should return valid object');
  assert.strictEqual(res.holes.length, 6, 'Should generate 6 hole centers');
  assert.strictEqual(res.radius, 50, 'PCD 100 should have radius 50');

  // Verify first hole at 0 deg: (center.x + 50, center.z)
  assert(Math.abs(res.holes[0].x - 100) < 1e-3, `Hole 0 X expected 100, got ${res.holes[0].x}`);
  assert(Math.abs(res.holes[0].z - (-40)) < 1e-3, `Hole 0 Z expected -40, got ${res.holes[0].z}`);
  console.log(`  ✓ Generated 6 PCD holes correctly spaced along Ø${pcd}mm pitch circle`);
}

// 3. Test findLineIntersection2D
console.log('\n[3] Testing findLineIntersection2D...');
{
  const p1 = new THREE.Vector3(-50, 35, 0);
  const p2 = new THREE.Vector3(50, 35, 0);
  const p3 = new THREE.Vector3(0, 35, -50);
  const p4 = new THREE.Vector3(0, 35, 50);

  const hit = findLineIntersection2D(p1, p2, p3, p4);
  assert(hit !== null, 'Should find intersection');
  assert(hit.isSegmentA && hit.isSegmentB, 'Intersection should lie within both segments');
  assert(Math.abs(hit.point.x) < 1e-4, 'Intersection X should be 0');
  assert(Math.abs(hit.point.z) < 1e-4, 'Intersection Z should be 0');
  console.log(`  ✓ Orthogonal intersection found at (${hit.point.x.toFixed(2)}, ${hit.point.z.toFixed(2)}) with t=${hit.t.toFixed(2)}, u=${hit.u.toFixed(2)}`);

  // Parallel lines test
  const p5 = new THREE.Vector3(-50, 35, 10);
  const p6 = new THREE.Vector3(50, 35, 10);
  const noHit = findLineIntersection2D(p1, p2, p5, p6);
  assert(noHit === null, 'Parallel lines should have no intersection');
  console.log('  ✓ Parallel lines correctly returned null');
}

// 4. Test findLineCircleIntersection2D
console.log('\n[4] Testing findLineCircleIntersection2D...');
{
  const p1 = new THREE.Vector3(-50, 35, 0);
  const p2 = new THREE.Vector3(50, 35, 0);
  const center = new THREE.Vector3(0, 35, 0);
  const radius = 25;

  const hits = findLineCircleIntersection2D(p1, p2, center, radius);
  assert.strictEqual(hits.length, 2, 'Should find 2 intersection points with circle');
  const xCoords = hits.map((h) => h.point.x).sort((a, b) => a - b);
  assert(Math.abs(xCoords[0] - (-25)) < 1e-3, 'Hit 1 should be at X=-25');
  assert(Math.abs(xCoords[1] - 25) < 1e-3, 'Hit 2 should be at X=25');
  console.log(`  ✓ Line-Circle intersections at X=${xCoords[0].toFixed(2)} and X=${xCoords[1].toFixed(2)}`);
}

// 5. Test performDynamicTrim (Mastercam scissor snip)
console.log('\n[5] Testing performDynamicTrim...');
{
  // Create mock entities:
  // Entity A: Horizontal line from (-100, 35, 0) to (100, 35, 0)
  // Entity B: Vertical line from (0, 35, -50) to (0, 35, 50), intersecting Entity A at (0, 35, 0)
  const lineA = {
    uuid: 'line-A',
    name: 'Wireframe_Line_A',
    userData: {
      cadType: 'line',
      p1: new THREE.Vector3(-100, 35, 0),
      p2: new THREE.Vector3(100, 35, 0)
    }
  };
  const lineB = {
    uuid: 'line-B',
    name: 'Wireframe_Line_B',
    userData: {
      cadType: 'line',
      p1: new THREE.Vector3(0, 35, -50),
      p2: new THREE.Vector3(0, 35, 50)
    }
  };

  const allEntities = [lineA, lineB];

  // Scissor stroke crossing Line A at X = 50 (between intersection at X=0 and end at X=100)
  const scissorStart = new THREE.Vector3(50, 35, -20);
  const scissorEnd = new THREE.Vector3(50, 35, 20);

  const trimResult = performDynamicTrim(scissorStart, scissorEnd, allEntities);
  assert(trimResult !== null, 'Dynamic trim should detect intersected target');
  assert.strictEqual(trimResult.targetEntity.uuid, 'line-A', 'Target should be Line A');
  assert.strictEqual(trimResult.keptSegments.length, 1, 'Should keep exactly 1 segment (the uncut left side)');

  const kept = trimResult.keptSegments[0];
  assert(Math.abs(kept.p1.x - (-100)) < 1e-2, `Kept start X should be -100, got ${kept.p1.x}`);
  assert(Math.abs(kept.p2.x - 0) < 1e-2, `Kept end X should be 0 (the intersection), got ${kept.p2.x}`);
  console.log(`  ✓ Mastercam Dynamic Trim correctly snipped segment [0, 100], preserving [${kept.p1.x.toFixed(1)}, ${kept.p2.x.toFixed(1)}]`);
}

// 6. Test computeFilletBetweenEntities
console.log('\n[6] Testing computeFilletBetweenEntities...');
{
  const line1 = {
    userData: {
      cadType: 'line',
      p1: new THREE.Vector3(0, 35, 50),
      p2: new THREE.Vector3(50, 35, 50)
    }
  };
  const line2 = {
    userData: {
      cadType: 'line',
      p1: new THREE.Vector3(50, 35, 50),
      p2: new THREE.Vector3(50, 35, 0)
    }
  };

  const filletRes = computeFilletBetweenEntities(line1, line2, 10);
  assert(filletRes !== null, 'Fillet should succeed for corner lines');
  assert(Math.abs(filletRes.filletArcData.radius - 10) < 1e-3, 'Fillet arc radius should be 10');
  console.log(`  ✓ Fillet R10 solved at center (${filletRes.filletArcData.center[0].toFixed(2)}, ${filletRes.filletArcData.center[2].toFixed(2)})`);
}

// 7. Test computeChamferBetweenEntities
console.log('\n[7] Testing computeChamferBetweenEntities...');
{
  const line1 = {
    userData: {
      cadType: 'line',
      p1: new THREE.Vector3(0, 35, 50),
      p2: new THREE.Vector3(50, 35, 50)
    }
  };
  const line2 = {
    userData: {
      cadType: 'line',
      p1: new THREE.Vector3(50, 35, 50),
      p2: new THREE.Vector3(50, 35, 0)
    }
  };

  const chamferRes = computeChamferBetweenEntities(line1, line2, 5, 5);
  assert(chamferRes !== null, 'Chamfer should succeed');
  assert(chamferRes.chamferLine !== null, 'Chamfer bevel line should be calculated');
  console.log(`  ✓ Chamfer bevel line generated from (${chamferRes.chamferLine.p1.x}, ${chamferRes.chamferLine.p1.z}) to (${chamferRes.chamferLine.p2.x}, ${chamferRes.chamferLine.p2.z})`);
}

// 8. Test computeModifyLength
console.log('\n[8] Testing computeModifyLength...');
{
  const line = {
    userData: {
      cadType: 'line',
      p1: new THREE.Vector3(0, 35, 0),
      p2: new THREE.Vector3(100, 35, 0)
    }
  };

  // Delta +25
  const modDelta = computeModifyLength(line, 25, 'delta', 'end2');
  assert(modDelta !== null, 'Modify length delta should succeed');
  assert(Math.abs(modDelta.newLength - 125) < 1e-3, `Expected new length 125, got ${modDelta.newLength}`);

  // Total 150
  const modTotal = computeModifyLength(line, 150, 'total', 'end2');
  assert(Math.abs(modTotal.newLength - 150) < 1e-3, `Expected new length 150, got ${modTotal.newLength}`);

  // Percent 200%
  const modPercent = computeModifyLength(line, 200, 'percent', 'end2');
  assert(Math.abs(modPercent.newLength - 200) < 1e-3, `Expected new length 200, got ${modPercent.newLength}`);
  console.log(`  ✓ Modify Length verified: Delta (125mm), Total (150mm), Percent (200mm)`);
}

// 9. Test computeCloseArc
console.log('\n[9] Testing computeCloseArc...');
{
  const arc = {
    userData: {
      cadType: 'arc',
      center: new THREE.Vector3(10, 35, 20),
      radius: 30,
      startAngleDeg: 45,
      endAngleDeg: 180
    }
  };

  const closed = computeCloseArc(arc);
  assert(closed !== null, 'Close arc should succeed');
  assert.strictEqual(closed.isFullCircle, true, 'isFullCircle should be true');
  assert.strictEqual(closed.startAngleDeg, 0, 'startAngleDeg should be 0');
  assert.strictEqual(closed.endAngleDeg, 360, 'endAngleDeg should be 360');
  console.log(`  ✓ Converted open arc (45°-180°) into 360° closed circle`);
}

// 10. Test computeBitangentLines (Outer Tangent between Main Hub and Lobe B)
console.log('\n[10] Testing computeBitangentLines...');
{
  const c1 = { userData: { cadType: 'circle', center: { x: 0, y: 0, z: 0 }, radius: 60 } };
  const c2 = { userData: { cadType: 'circle', center: { x: 110, y: 0, z: 35 }, radius: 27.5 } };

  const bitan = computeBitangentLines(c1, c2);
  assert(bitan !== null, 'Should solve outer bitangents');
  assert(bitan.topTangent && bitan.bottomTangent, 'Should have top and bottom tangents');

  // Verify distance from center of c1 to topTangent.p1 is exactly R1 (60)
  const d1 = Math.hypot(bitan.topTangent.p1.x, bitan.topTangent.p1.z);
  assert(Math.abs(d1 - 60) < 1e-3, `P1 should lie on circle 1, got distance ${d1}`);

  // Verify distance from center of c2 to topTangent.p2 is exactly R2 (27.5)
  const d2 = Math.hypot(bitan.topTangent.p2.x - 110, bitan.topTangent.p2.z - 35);
  assert(Math.abs(d2 - 27.5) < 1e-3, `P2 should lie on circle 2, got distance ${d2}`);

  console.log(`  ✓ Exact Bitangent computed: Contact 1 at (${bitan.topTangent.p1.x.toFixed(2)}, ${bitan.topTangent.p1.z.toFixed(2)}), Contact 2 at (${bitan.topTangent.p2.x.toFixed(2)}, ${bitan.topTangent.p2.z.toFixed(2)})`);
}

// 11. Test snapToEntityPoints with Quadrant & Tangent Snapping
console.log('\n[11] Testing snapToEntityPoints (Quadrant & Tangent)...');
{
  const circle = {
    userData: {
      cadType: 'circle',
      center: { x: 110, y: 0, z: 35 },
      radius: 27.5
    }
  };

  // Test Quadrant Snap near top of circle: (110, 35 + 27.5) = (110, 62.5)
  const cursorNearTop = new THREE.Vector3(108, 0, 61);
  const snapQ = snapToEntityPoints(cursorNearTop, [circle], 8.0);
  assert(snapQ.snapped, 'Should snap near top of circle');
  assert.strictEqual(snapQ.type, 'quadrant', 'Should be quadrant snap');
  assert(Math.abs(snapQ.point.x - 110) < 1e-3, 'Quadrant X should be 110');
  assert(Math.abs(snapQ.point.z - 62.5) < 1e-3, 'Quadrant Z should be 62.5');
  console.log(`  ✓ Quadrant Snap verified: (${snapQ.point.x.toFixed(2)}, ${snapQ.point.z.toFixed(2)})`);

  // Test Tangent Snap from Anchor Point at (0, 0, 60)
  const anchor = new THREE.Vector3(0, 0, 60);
  const cursorNearTan = new THREE.Vector3(109, 0, 63);
  const snapTan = snapToEntityPoints(cursorNearTan, [circle], 12.0, { anchorPoint: anchor });
  assert(snapTan.snapped, 'Should snap to tangent');
  assert.strictEqual(snapTan.type, 'tangent', 'Should be tangent snap');
  console.log(`  ✓ Tangent Snap from (0, 60) verified: Touch point at (${snapTan.point.x.toFixed(2)}, ${snapTan.point.z.toFixed(2)})`);
}

// 12. Test snapToEntityPoints with full Three.js Wireframe Circles (65 tessellation points)
console.log('\n[12] Testing snapToEntityPoints with real Wireframe Circle meshes...');
{
  const mainCircle = createWireframeCircle(60, 35, [0, 0], 0, 360, 'G17');
  const lobeBOuter = createWireframeCircle(27.5, 35, [110, -35], 0, 360, 'G17');
  const lobeBInner = createWireframeCircle(12.5, 35, [110, -35], 0, 360, 'G17');

  const entities = [mainCircle, lobeBOuter, lobeBInner];
  const anchor = new THREE.Vector3(0, 35, -60);

  // Cursor near top rim of Lobe B outer circle: (108, 35, -61)
  const cursor = new THREE.Vector3(108, 35, -61);
  const snapResult = snapToEntityPoints(cursor, entities, 14.0, { anchorPoint: anchor });

  assert(snapResult.snapped, 'Should snap to Lobe B');
  assert.strictEqual(snapResult.type, 'tangent', 'Tessellation points must NOT hijack snap; must be tangent');
  assert(Math.abs(snapResult.point.x - 109.37) < 0.2, `Snap X should be ~109.37, got ${snapResult.point.x}`);
  assert(Math.abs(snapResult.point.z - (-62.49)) < 0.2, `Snap Z should be ~-62.49, got ${snapResult.point.z}`);
  console.log(`  ✓ Wireframe circle 65-point tessellation bypassed: Tangent Snap correctly locked onto (${snapResult.point.x.toFixed(2)}, ${snapResult.point.z.toFixed(2)})`);
}

console.log('\n=== ALL 12 MASTERCAM WIREFRAME CAD ENGINE TESTS PASSED (100%) ===\n');
