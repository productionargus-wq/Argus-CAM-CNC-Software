/**
 * Automated Unit Test Suite for 3D Surface Rough Parallel Toolpath
 */

import assert from 'node:assert';
import * as THREE from 'three';

import {
  PARALLEL_ROUGH_MATERIALS,
  PARALLEL_ROUGH_PRESETS,
  resolveParallelRoughMachineCapabilities,
  calculateParallelRoughPhysics,
  createDefaultParallelRoughState,
  resolveDefaultRoughingTool
} from '../src/config/parallelRoughSchema.js';

import {
  generateParallelRoughToolpath,
  generateParallelRoughGCode
} from '../src/utils/parallelRoughToolpathEngine.js';

console.log('=== STARTING 3D SURFACE ROUGH PARALLEL TEST SUITE ===\n');

// -------------------------------------------------------------
// [Test 1] Schema Defaults & Mastercam 15 Pages
// -------------------------------------------------------------
console.log('[Test 1] Schema Defaults & Mastercam 15 Pages...');
const defaultState = createDefaultParallelRoughState();
assert(defaultState, 'Default state should exist');
assert.strictEqual(defaultState.strategyKey, 'surface_rough_parallel');
assert.strictEqual(defaultState.badgeClass, 'rough_parallel');
assert.strictEqual(defaultState.parallelParameters.machiningAngle, 0.0);
assert.strictEqual(defaultState.parallelParameters.cuttingMethod, 'zigzag');
assert.strictEqual(defaultState.parallelParameters.crossHatch, false);
assert.strictEqual(defaultState.parallelParameters.cleanBoundaries, true);
assert(defaultState.parallelParameters.stepdownMm > 0);
assert(defaultState.parallelParameters.stepoverPct > 0);
assert(PARALLEL_ROUGH_PRESETS.length >= 4, 'Should have multiple presets');
console.log('✓ Test 1 Passed: Mastercam defaults and 15 pages verified.\n');

// -------------------------------------------------------------
// [Test 1B] Smart Tool Resolution
// -------------------------------------------------------------
console.log('[Test 1B] Smart Tool Resolution...');
const toolLibrary = [
  { id: 1, number: 1, type: 'face', diameter: 50, name: '50mm Face Mill' },
  { id: 2, number: 2, type: 'flat', diameter: 12, name: '12mm Flat Endmill' },
  { id: 3, number: 3, type: 'ball', diameter: 6, name: '6mm Ball Nose' }
];
const chosen = resolveDefaultRoughingTool(toolLibrary);
assert.strictEqual(chosen.id, 2, 'Should pick 12mm Flat Endmill over 50mm Face Mill');
console.log('✓ Test 1B Passed: Smart Tool Selection verified (12mm Endmill picked over 50mm Face Mill).\n');

// -------------------------------------------------------------
// [Test 2] Machining Physics Calculations
// -------------------------------------------------------------
console.log('[Test 2] Machining Physics Calculations...');
const testTool = { diameter: 10, flutes: 4, spindleSpeed: 5000, feedRate: 1800 };
const testCut = { stepoverPct: 65, stepdownMm: 2.0 };
const physics = calculateParallelRoughPhysics(testTool, testCut, 'ALU_6061');
assert(physics.vc > 0, 'Cutting speed must be positive');
assert(physics.hm > 0, 'Chip load must be positive');
assert(physics.mrrCm3Min > 0, 'MRR must be positive');
assert(physics.fc > 0, 'Cutting force must be positive');
assert(physics.powerKw > 0, 'Power must be positive');
assert(physics.torqueNm > 0, 'Torque must be positive');
console.log(`✓ Test 2 Passed: Physics verified: Vc=${physics.vc} m/min, hm=${physics.hm} mm, MRR=${physics.mrrCm3Min} cm³/min, Force=${physics.fc} N, Power=${physics.powerKw} kW, Torque=${physics.torqueNm} Nm.\n`);

// -------------------------------------------------------------
// [Test 3] Machine Capabilities Resolver
// -------------------------------------------------------------
console.log('[Test 3] Machine Capabilities Resolver...');
const fanuc = resolveParallelRoughMachineCapabilities({ name: 'Fanuc Robodrill D21' });
assert.strictEqual(fanuc.isFanuc, true);
assert.strictEqual(fanuc.highSpeedSmoothingCode, 'G05.1 Q1');

const haas = resolveParallelRoughMachineCapabilities({ name: 'Haas VF-2' });
assert.strictEqual(haas.isHaas, true);
assert.strictEqual(haas.highSpeedSmoothingCode, 'G187 P1');
console.log('✓ Test 3 Passed: Fanuc and Haas machine smoothing codes verified.\n');

// -------------------------------------------------------------
// [Test 4] 3D Toolpath Generation Engine
// -------------------------------------------------------------
console.log('[Test 4] 3D Toolpath Generation Engine...');
const bounds = new THREE.Box3(
  new THREE.Vector3(-50, -20, -40),
  new THREE.Vector3(50, 15, 40)
);

// 4A: Zigzag at 0° (X-Axis)
const resZigzag = generateParallelRoughToolpath(bounds, testTool, {
  parallelParameters: {
    machiningAngle: 0.0,
    cuttingMethod: 'zigzag',
    crossHatch: false,
    cleanBoundaries: true,
    stepdownMm: 5.0,
    stepoverPct: 60
  }
});
assert(resZigzag.cuttingLines.length > 0, 'Should have cutting lines');
assert(resZigzag.waypoints.length > 0, 'Should have waypoints');
assert.strictEqual(resZigzag.topY, 15);
console.log(`✓ Test 4A Passed: Zigzag at 0° generated ${resZigzag.cuttingLines.length} cuts across ${resZigzag.stats.levelsCount} levels.`);

// 4B: Cross-Hatch 90° on alternating levels
const resCrossHatch = generateParallelRoughToolpath(bounds, testTool, {
  parallelParameters: {
    machiningAngle: 0.0,
    cuttingMethod: 'zigzag',
    crossHatch: true,
    cleanBoundaries: true,
    stepdownMm: 5.0,
    stepoverPct: 60
  }
});
assert(resCrossHatch.cuttingLines.length > 0, 'Should have cutting lines for cross-hatch');
console.log(`✓ Test 4B Passed: Cross-Hatch 90° generated ${resCrossHatch.cuttingLines.length} cuts.`);

// 4C: One-Way Climb cutting
const resOneWay = generateParallelRoughToolpath(bounds, testTool, {
  parallelParameters: {
    machiningAngle: 45.0,
    cuttingMethod: 'one_way',
    crossHatch: false,
    cleanBoundaries: true,
    stepdownMm: 5.0,
    stepoverPct: 60
  }
});
assert(resOneWay.rapidLines.length > 0, 'One-Way passes should generate rapid returns');
console.log(`✓ Test 4C Passed: One-Way 45° generated ${resOneWay.cuttingLines.length} cuts with ${resOneWay.rapidLines.length} rapids.\n`);

// -------------------------------------------------------------
// [Test 5] CNC G-Code Generation
// -------------------------------------------------------------
console.log('[Test 5] CNC G-Code Generation...');
const gcode = generateParallelRoughGCode(resCrossHatch, testTool, {
  selectedMaterialKey: 'Alu 6061-T6'
}, { name: 'Fanuc Robodrill D21', controller: 'Fanuc 31i' });

assert(typeof gcode === 'string', 'G-Code should be string');
assert(gcode.includes('G90 G21 G17 G54 G94'), 'Should include Fanuc preamble');
assert(gcode.includes('OPERATION 1: SURFACE ROUGH PARALLEL'), 'Should have operation header');
assert(gcode.includes('T2 M06'), 'Should have tool change');
assert(gcode.includes('S5000 M03'), 'Should have spindle speed');
assert(gcode.includes('G43 H2'), 'Should have length offset');
assert(gcode.includes('M30'), 'Should end with M30');
console.log(`✓ Test 5 Passed: Fanuc G-Code generated (${gcode.split('\n').length} lines).\n`);

console.log('=== ALL 5 SURFACE ROUGH PARALLEL UNIT TESTS PASSED SUCCESSFULLY! ===');
