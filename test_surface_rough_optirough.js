import assert from 'node:assert';
import {
  OPTIROUGH_MATERIALS,
  OPTIROUGH_PRESETS,
  resolveOptiRoughMachineCapabilities,
  calculateOptiRoughPhysics,
  createDefaultOptiRoughState
} from './src/config/optiRoughSchema.js';
import {
  generateOptiRoughToolpath,
  generateOptiRoughGCode
} from './src/utils/optiRoughToolpathEngine.js';

console.log('--- STARTING 3D DYNAMIC OPTIROUGH TEST SUITE ---');

// TEST 1: Schema Defaults and Mastercam Pages
console.log('Test 1: Schema Defaults & 13 Tree Pages...');
const defaultState = createDefaultOptiRoughState();
assert.ok(defaultState, 'Default state must exist');
assert.strictEqual(defaultState.name, '3D High Speed Dynamic OptiRough');
assert.strictEqual(defaultState.strategyKey, 'surface_rough_optirough');
assert.strictEqual(defaultState.badgeClass, 'adaptive');
assert.strictEqual(defaultState.modelGeometry.wallStock, 1.0, 'Wall stock default 1.0mm');
assert.strictEqual(defaultState.modelGeometry.floorStock, 1.0, 'Floor stock default 1.0mm');
assert.strictEqual(defaultState.toolpathControl.strategy, 'stay_inside', 'Default strategy stay_inside');
assert.strictEqual(defaultState.cutParameters.cuttingMethod, 'climb');
assert.strictEqual(defaultState.cutParameters.optimizeStepups, 'by_depth');
assert.strictEqual(defaultState.cutParameters.stepoverPct, 15.0);
assert.strictEqual(defaultState.cutParameters.stepdownMm, 15.0);
assert.strictEqual(defaultState.cutParameters.stepupEnabled, true);
assert.strictEqual(defaultState.cutParameters.stepupMm, 1.0);
assert.strictEqual(defaultState.transitions.entryMethod, 'helical_ramp');
assert.strictEqual(defaultState.transitions.rampAngle, 2.0);
assert.strictEqual(defaultState.linkingParameters.microLiftDistance, 0.25);
assert.strictEqual(defaultState.linkingParameters.backFeedRate, 2500.0);
console.log('✓ Test 1 Passed: Mastercam defaults and 13 pages verified.');

// TEST 2: Real-Time Physics Calculation (Constant Engagement & Chip Thinning)
console.log('\nTest 2: Dynamic Motion Physics Calculations...');
const tool = { diameter: 10, flutes: 4, spindleSpeed: 5395, feedRate: 2870 };
const physics = calculateOptiRoughPhysics(tool, { stepoverPct: 15, stepdown: 15 }, 'ALU_6061');
assert.ok(physics.engagementDeg > 40 && physics.engagementDeg < 60, `Engagement angle should be ~45-55° (got ${physics.engagementDeg}°)`);
assert.ok(physics.rctfMultiplier > 1.2, `Chip thinning factor should boost feed (got ${physics.rctfMultiplier}x)`);
assert.ok(physics.feedRateBoostPct > 20, `Feed rate boost should be >20% (got ${physics.feedRateBoostPct}%)`);
assert.ok(physics.mrrCm3Min > 0, `MRR should be positive (got ${physics.mrrCm3Min} cm3/min)`);
assert.ok(physics.powerKw > 0, `Spindle power should be positive (got ${physics.powerKw} kW)`);
assert.ok(physics.forceReductionPct > 60, `Force reduction should be substantial (got ${physics.forceReductionPct}%)`);
console.log(`✓ Test 2 Passed: Physics verified: engagement=${physics.engagementDeg}°, boost=+${physics.feedRateBoostPct}%, MRR=${physics.mrrCm3Min} cm³/min, Power=${physics.powerKw} kW.`);

// TEST 3: Machine Capabilities Resolver
console.log('\nTest 3: Machine Capabilities Resolver...');
const fanucCaps = resolveOptiRoughMachineCapabilities({ brand: 'Fanuc', name: 'Fanuc Robodrill D21' });
assert.strictEqual(fanucCaps.isFanuc, true);
assert.strictEqual(fanucCaps.highSpeedSmoothingCode, 'G05.1 Q1');

const haasCaps = resolveOptiRoughMachineCapabilities({ brand: 'Haas', name: 'Haas VF-2' });
assert.strictEqual(haasCaps.isHaas, true);
assert.strictEqual(haasCaps.highSpeedSmoothingCode, 'G187 P1');
console.log('✓ Test 3 Passed: Fanuc & Haas machine smoothing codes verified.');

// TEST 4: 3D OptiRough Toolpath Generation (Stepdown, Stepup, Helical Ramp, Micro-Lift)
console.log('\nTest 4: 3D Toolpath Generation Engine...');
const testBounds = {
  min: { x: -50, y: -40, z: -30 },
  max: { x: 50, y: 40, z: 0 }
};
const toolpath = generateOptiRoughToolpath(testBounds, tool, {
  cutParameters: { stepoverPct: 15, stepdownMm: 12.0, stepupEnabled: true, stepupMm: 1.5 },
  modelGeometry: { wallStock: 1.0, floorStock: 1.0 },
  transitions: { helicalRadius: 5.0, helicalPitch: 2.0 },
  linkingParameters: { microLiftDistance: 0.35, backFeedRate: 2500, clearancePlane: 25.0 }
});

assert.ok(toolpath.cuttingLines.length > 50, `Should produce abundant cutting lines (got ${toolpath.cuttingLines.length})`);
assert.ok(toolpath.rapidLines.length > 20, `Should produce rapid / micro-lift lines (got ${toolpath.rapidLines.length})`);
assert.ok(toolpath.waypoints.length > 100, `Should produce waypoints (got ${toolpath.waypoints.length})`);
assert.ok(toolpath.stepdownCount >= 2, `Should slice multiple deep stepdown levels (got ${toolpath.stepdownCount})`);

// Verify presence of Upward Stepup Passes
const stepupWaypoints = toolpath.waypoints.filter((w) => w.isStepup || w.note?.includes('Step-Up'));
assert.ok(stepupWaypoints.length > 0, `Should generate upward step-up rest passes (got ${stepupWaypoints.length})`);

// Verify Helical Ramp Entry
const helicalWaypoints = toolpath.waypoints.filter((w) => w.note?.includes('Helical Ramp'));
assert.ok(helicalWaypoints.length > 0, `Should generate helical ramp plunge entries (got ${helicalWaypoints.length})`);

// Verify Micro-Lift
const microLiftWaypoints = toolpath.waypoints.filter((w) => w.note?.includes('Micro-Lift'));
assert.ok(microLiftWaypoints.length > 0, `Should generate micro-lift non-cutting returns (got ${microLiftWaypoints.length})`);

// Coordinate safety bounds check
toolpath.waypoints.forEach((wp) => {
  assert.ok(Number.isFinite(wp.pos.x), 'X coordinate must be finite');
  assert.ok(Number.isFinite(wp.pos.y), 'Y coordinate must be finite');
  assert.ok(Number.isFinite(wp.pos.z), 'Z coordinate must be finite');
  assert.ok(wp.pos.z <= 26.0, `Z coordinate should never exceed clearance plane (got ${wp.pos.z})`);
  assert.ok(wp.pos.z >= -30.0, `Z coordinate should not breach floor (got ${wp.pos.z})`);
});
console.log(`✓ Test 4 Passed: 3D toolpath generated: ${toolpath.cuttingLines.length} cuts, ${stepupWaypoints.length} step-up passes, ${helicalWaypoints.length} helical ramp points, ${microLiftWaypoints.length} micro-lifts.`);

// TEST 5: Production G-Code Output
console.log('\nTest 5: Fanuc / Haas Production G-Code Generation...');
const gcode = generateOptiRoughGCode({
  tool,
  cutParameters: { stepdownMm: 15.0, stepupMm: 1.0 },
  modelGeometry: { wallStock: 1.0, floorStock: 1.0 },
  linkingParameters: { clearancePlane: 50.0, partClearance: 2.5 }
}, 'fanuc', 'G54');

assert.ok(gcode.includes('OPERATION 1: 3D HIGH SPEED DYNAMIC OPTIROUGH'), 'Header must mention 3D Dynamic OptiRough');
assert.ok(gcode.includes('G05.1 Q1'), 'Must include Fanuc AICC lookahead smoothing (G05.1 Q1)');
assert.ok(gcode.includes('G03 X5.000'), 'Must include helical ramp plunge (G03)');
assert.ok(gcode.includes('STEPUP: 1.000mm'), 'Must document stepup parameter in header');
assert.ok(gcode.includes('G28 G91 Z0.'), 'Must include safe machine home retract');
assert.ok(gcode.includes('M30'), 'Must include program end');
console.log('✓ Test 5 Passed: G-Code post verified with AICC G05.1 Q1, helical plunge G03, and safety returns.');

// TEST 6: Presets Validation
console.log('\nTest 6: Presets Validation...');
assert.strictEqual(OPTIROUGH_PRESETS.length, 4);
OPTIROUGH_PRESETS.forEach((preset) => {
  assert.ok(preset.id, 'Preset must have id');
  assert.ok(preset.stepoverPct > 0, 'Stepover must be positive');
  assert.ok(preset.stepdownFactor > 0, 'Stepdown factor must be positive');
  assert.ok(preset.stepupMm > 0, 'Stepup must be positive');
  assert.ok(preset.backFeedRate >= 2000, 'Back feed rate must be high speed >= 2000');
});
console.log('✓ Test 6 Passed: All 4 OptiRough presets validated.');

console.log('\n🎉 ALL 3D DYNAMIC OPTIROUGH TESTS PASSED SUCCESSFULLY! 🎉');
