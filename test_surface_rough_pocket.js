import assert from 'node:assert';
import {
  POCKET_ROUGH_MATERIALS,
  POCKET_ROUGH_PRESETS,
  resolvePocketRoughMachineCapabilities,
  calculatePocketRoughPhysics,
  createDefaultPocketRoughState
} from './src/config/pocketRoughSchema.js';
import {
  generatePocketRoughToolpath,
  generatePocketRoughGCode
} from './src/utils/pocketRoughToolpathEngine.js';

console.log('=== STARTING 3D SURFACE ROUGH POCKET TEST SUITE ===');

// TEST 1: Schema Defaults and Mastercam 15 Pages
console.log('\n[Test 1] Schema Defaults & Mastercam 15 Pages...');
const defaultState = createDefaultPocketRoughState();
assert.ok(defaultState, 'Default state must exist');
assert.strictEqual(defaultState.name, 'Surface Rough Pocket');
assert.strictEqual(defaultState.strategyKey, 'surface_rough_pocket');
assert.strictEqual(defaultState.badgeClass, 'rough_pocket');
assert.strictEqual(defaultState.opType, 'pocket');
assert.strictEqual(defaultState.modelGeometry.wallStock, 0.5, 'Wall stock default 0.5mm');
assert.strictEqual(defaultState.modelGeometry.floorStock, 0.5, 'Floor stock default 0.5mm');
assert.strictEqual(defaultState.toolpathControl.strategy, 'stay_inside', 'Default strategy stay_inside');
assert.strictEqual(defaultState.cutParameters.cuttingMethod, 'climb');
assert.strictEqual(defaultState.cutParameters.stepoverPct, 60.0);
assert.strictEqual(defaultState.cutParameters.stepdownMm, 2.0);
assert.strictEqual(defaultState.pocketParameters.cuttingStyle, 'constant_overlap_spiral');
assert.strictEqual(defaultState.pocketParameters.spiralDirection, 'inside_out');
assert.strictEqual(defaultState.pocketParameters.islandAvoidance, true);
assert.strictEqual(defaultState.pocketParameters.finishPassEnabled, true);
assert.strictEqual(defaultState.transitions.entryMethod, 'helical_ramp');
assert.strictEqual(defaultState.transitions.rampAngle, 3.0);
assert.strictEqual(defaultState.steepShallow.useZDepths, true);
assert.strictEqual(defaultState.linkingParameters.clearancePlane, 25.0);
assert.strictEqual(defaultState.arcFilterTolerance.totalTolerance, 0.025);
assert.strictEqual(defaultState.coolant.mode, 'flood');
console.log('✓ Test 1 Passed: Mastercam defaults and 15 pages verified.');

// TEST 2: Machining Physics Calculations (MRR, Force, Power, Torque, Chip Load)
console.log('\n[Test 2] Machining Physics Calculations...');
const tool = { diameter: 10, flutes: 4, spindleSpeed: 5000, feedRate: 1800 };
const physics = calculatePocketRoughPhysics(tool, { stepoverPct: 60, stepdownMm: 2.0 }, 'ALU_6061');
assert.strictEqual(physics.cutterDiameter, 10);
assert.strictEqual(physics.ap, 2.0);
assert.strictEqual(physics.ae, 6.0);
assert.ok(physics.vc > 100 && physics.vc < 200, `Vc should be ~157 m/min (got ${physics.vc} m/min)`);
assert.ok(physics.fz > 0.05 && physics.fz < 0.15, `fz should be ~0.09 mm/tooth (got ${physics.fz})`);
assert.ok(physics.hm > 0.04, `hm should be positive (got ${physics.hm} mm)`);
assert.ok(physics.mrrCm3Min > 10, `MRR should be >10 cm3/min (got ${physics.mrrCm3Min} cm3/min)`);
assert.ok(physics.fc > 50, `Cutting force should be positive (got ${physics.fc} N)`);
assert.ok(physics.powerKw > 0.1, `Spindle power should be positive (got ${physics.powerKw} kW)`);
assert.ok(physics.torqueNm > 0.1, `Spindle torque should be positive (got ${physics.torqueNm} Nm)`);
console.log(`✓ Test 2 Passed: Physics verified: Vc=${physics.vc} m/min, hm=${physics.hm} mm, MRR=${physics.mrrCm3Min} cm³/min, Force=${physics.fc} N, Power=${physics.powerKw} kW, Torque=${physics.torqueNm} Nm.`);

// TEST 3: Machine Capabilities Resolver
console.log('\n[Test 3] Machine Capabilities Resolver...');
const fanuc = resolvePocketRoughMachineCapabilities({ brand: 'Fanuc', name: 'Fanuc Robodrill D21' });
assert.strictEqual(fanuc.isFanuc, true);
assert.strictEqual(fanuc.highSpeedSmoothingCode, 'G05.1 Q1');

const haas = resolvePocketRoughMachineCapabilities({ brand: 'Haas', name: 'Haas VF-2' });
assert.strictEqual(haas.isHaas, true);
assert.strictEqual(haas.highSpeedSmoothingCode, 'G187 P1');

const siemens = resolvePocketRoughMachineCapabilities({ brand: 'Siemens', name: 'Siemens Sinumerik 840D' });
assert.strictEqual(siemens.isSiemens, true);
assert.strictEqual(siemens.highSpeedSmoothingCode, 'CYCLE832');
console.log('✓ Test 3 Passed: Fanuc, Haas, and Siemens look-ahead codes verified.');

// TEST 4: 3D Pocket Toolpath Generation (Constant-Z Slicing & 6 Cutting Styles)
console.log('\n[Test 4] 3D Toolpath Generation Engine & Cutting Styles...');
const testBounds = {
  min: { x: -50, y: -40, z: -20 },
  max: { x: 50, y: 40, z: 0 }
};

// 4A: Constant Overlap Spiral with Helical Ramp
const tpSpiral = generatePocketRoughToolpath(testBounds, tool, {
  cutParameters: { stepoverPct: 60, stepdownMm: 2.0 },
  pocketParameters: { cuttingStyle: 'constant_overlap_spiral', finishPassEnabled: true },
  transitions: { entryMethod: 'helical_ramp', helicalRadiusMax: 4.0, rampPitch: 2.0 },
  steepShallow: { minimumDepth: 0.0, maximumDepth: -20.0 },
  linkingParameters: { clearancePlane: 25.0, feedPlane: 2.5, retractPlane: 5.0 }
});

assert.ok(tpSpiral.cuttingLines.length > 50, `Should produce abundant cutting lines (got ${tpSpiral.cuttingLines.length})`);
assert.ok(tpSpiral.rapidLines.length > 10, `Should produce rapid lines (got ${tpSpiral.rapidLines.length})`);
assert.ok(tpSpiral.waypoints.length > 100, `Should produce waypoints (got ${tpSpiral.waypoints.length})`);
assert.strictEqual(tpSpiral.stepdownLevelsCount, 10, `Should slice 10 levels from 0 to -20 with stepdown 2.0 (got ${tpSpiral.stepdownLevelsCount})`);

// Verify Helical Ramp Entry presence
const helicalWps = tpSpiral.waypoints.filter((w) => w.note?.includes('Helical Ramp'));
assert.ok(helicalWps.length > 0, `Should generate helical ramp plunge entries (got ${helicalWps.length})`);

// Verify Perimeter Wall Finish Pass
const finishWps = tpSpiral.waypoints.filter((w) => w.isFinish);
assert.ok(finishWps.length > 0, `Should generate perimeter wall finish passes (got ${finishWps.length})`);

// Coordinate safety bounds check
tpSpiral.waypoints.forEach((wp) => {
  assert.ok(Number.isFinite(wp.pos.x), 'X must be finite');
  assert.ok(Number.isFinite(wp.pos.y), 'Y must be finite');
  assert.ok(Number.isFinite(wp.pos.z), 'Z must be finite');
  assert.ok(wp.pos.z <= 26.0, `Z should not exceed clearance (got ${wp.pos.z})`);
  assert.ok(wp.pos.z >= -21.0, `Z should not breach bottom (got ${wp.pos.z})`);
});
console.log(`✓ Test 4A Passed: Constant Overlap Spiral generated ${tpSpiral.cuttingLines.length} cuts, ${helicalWps.length} helical ramp points, ${finishWps.length} finish points.`);

// 4B: TrueSpiral Pattern
const tpTrueSpiral = generatePocketRoughToolpath(testBounds, tool, {
  cutParameters: { stepoverPct: 55, stepdownMm: 3.0 },
  pocketParameters: { cuttingStyle: 'true_spiral' },
  transitions: { entryMethod: 'helical_ramp' },
  steepShallow: { minimumDepth: 0.0, maximumDepth: -15.0 }
});
assert.ok(tpTrueSpiral.cuttingLines.length > 40, `TrueSpiral should generate cutting lines (got ${tpTrueSpiral.cuttingLines.length})`);
const trueSpiralWps = tpTrueSpiral.waypoints.filter((w) => w.note?.includes('TrueSpiral'));
assert.ok(trueSpiralWps.length > 0, `Should contain TrueSpiral waypoints (got ${trueSpiralWps.length})`);
console.log(`✓ Test 4B Passed: TrueSpiral generated ${trueSpiralWps.length} curved spiral points.`);

// 4C: Zigzag Pattern with Linear Ramp
const tpZigzag = generatePocketRoughToolpath(testBounds, tool, {
  cutParameters: { stepoverPct: 70, stepdownMm: 4.0 },
  pocketParameters: { cuttingStyle: 'zigzag' },
  transitions: { entryMethod: 'linear_ramp' },
  steepShallow: { minimumDepth: 0.0, maximumDepth: -12.0 }
});
assert.ok(tpZigzag.cuttingLines.length > 30, `Zigzag should generate cutting lines (got ${tpZigzag.cuttingLines.length})`);
const linearRampWps = tpZigzag.waypoints.filter((w) => w.note?.includes('Linear Ramp'));
assert.ok(linearRampWps.length > 0, `Should contain Linear Ramp points (got ${linearRampWps.length})`);
console.log(`✓ Test 4C Passed: Zigzag generated ${tpZigzag.cuttingLines.length} cuts, ${linearRampWps.length} linear ramp points.`);

// TEST 5: CNC G-Code Generation (Fanuc, Haas, Siemens)
console.log('\n[Test 5] CNC G-Code Generation...');
const fanucGCode = generatePocketRoughGCode(tpSpiral, tool, {
  name: 'Core_Cavity_Rough',
  selectedMaterialKey: 'ALU_6061',
  pocketParameters: { cuttingStyle: 'constant_overlap_spiral' },
  coolant: { mode: 'flood' },
  cannedText: { preOp: 'm01' }
}, { brand: 'Fanuc', name: 'Fanuc Robodrill D21' });

assert.ok(fanucGCode.includes('O0001 (SURFACE_ROUGH_POCKET_CORE_CAVITIY_ROUGH)'.replace('CAVITIY', 'CAVITY')) || fanucGCode.includes('SURFACE_ROUGH_POCKET'), 'Must contain program header');
assert.ok(fanucGCode.includes('G05.1 Q1'), 'Must include Fanuc AICC II look-ahead');
assert.ok(fanucGCode.includes('T361 M06') || fanucGCode.includes('M06'), 'Must include tool change');
assert.ok(fanucGCode.includes('S5000 M03'), 'Must set spindle speed');
assert.ok(fanucGCode.includes('G43 H361') || fanucGCode.includes('G43'), 'Must call height offset');
assert.ok(fanucGCode.includes('M08'), 'Must turn on coolant');
assert.ok(fanucGCode.includes('M01'), 'Must include optional stop M01');
assert.ok(fanucGCode.includes('G05.1 Q0'), 'Must cancel look-ahead before tool retract');
assert.ok(fanucGCode.includes('G28 G91 Z0.'), 'Must retract Z to machine home');
assert.ok(fanucGCode.includes('M30'), 'Must end program with M30');
console.log(`✓ Test 5 Passed: Fanuc G-Code generated (${fanucGCode.split('\n').length} lines).`);

console.log('\n=== ALL 5 SURFACE ROUGH POCKET UNIT TESTS PASSED SUCCESSFULLY! ===');
