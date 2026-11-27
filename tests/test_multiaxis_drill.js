import assert from 'node:assert';
import * as THREE from 'three';

import {
  MULTIAXIS_DRILL_PAGE_TITLES,
  MULTIAXIS_DRILL_MATERIALS,
  MULTIAXIS_DRILL_PRESETS,
  MULTIAXIS_DRILL_CYCLES,
  MULTIAXIS_DRILL_KINEMATICS,
  MULTIAXIS_DRILL_POST_DIALECTS,
  calculateDrillTipLength,
  calculateMultiaxisDrillPhysics,
  createDefaultMultiaxisDrillParams,
  resolveDefaultDrillTool
} from '../src/config/multiaxisDrillSchema.js';

import {
  extract3DCompoundHoles,
  computeDrillKinematicsAngles,
  generateMultiaxisDrillToolpath,
  generateMultiaxisDrillGCode
} from '../src/utils/multiaxisDrillEngine.js';

console.log('🧪 Starting Mastercam 5-Axis Multiaxis Drilling & Auto-Hole Automated Test Suite...\n');

let passCount = 0;
function test(desc, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${desc}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(err);
    process.exit(1);
  }
}

// ========================================================
// 1. Schema Defaults, Pages & Taxonomy
// ========================================================
console.log('--- Group 1: 10-Page Mastercam Schema Taxonomy & Presets ---');

test('Schema defines exact 10 Mastercam tree pages', () => {
  const pages = Object.keys(MULTIAXIS_DRILL_PAGE_TITLES);
  assert.strictEqual(pages.length, 10);
  assert.ok(pages.includes('toolpath_type'));
  assert.ok(pages.includes('hole_selection'));
  assert.ok(pages.includes('tool'));
  assert.ok(pages.includes('holder'));
  assert.ok(pages.includes('cut_parameters'));
  assert.ok(pages.includes('depth_tip_comp'));
  assert.ok(pages.includes('tool_axis_alignment'));
  assert.ok(pages.includes('linking_clearance'));
  assert.ok(pages.includes('machine_kinematics'));
  assert.ok(pages.includes('planes_coolant'));
});

test('createDefaultMultiaxisDrillParams produces valid 10-page default structure', () => {
  const params = createDefaultMultiaxisDrillParams();
  assert.strictEqual(params.strategyKey, 'multiaxis_drill');
  assert.strictEqual(params.toolpathType.strategy, 'multiaxis_drill');
  assert.ok(params.holeSelection);
  assert.ok(params.tool);
  assert.strictEqual(params.tool.diameter, 6.0);
  assert.strictEqual(params.tool.pointAngleDeg, 140);
  assert.ok(params.cutParameters);
  assert.strictEqual(params.cutParameters.cycleType, 'G83');
  assert.ok(params.depthTipComp);
  assert.strictEqual(params.depthTipComp.addTipLengthToDepth, true);
  assert.ok(params.toolAxisAlignment);
  assert.ok(params.linkingClearance);
  assert.ok(params.machineKinematics);
  assert.strictEqual(params.machineKinematics.postDialect, 'fanuc_twp');
  assert.ok(params.planesCoolant);
});

test('resolveDefaultDrillTool selects drill tool from tools list or fallback', () => {
  const tools = [
    { id: 1, name: '10mm Endmill', type: 'flat', diameter: 10 },
    { id: 2, name: '6mm Carbide Drill', type: 'drill', diameter: 6, pointAngleDeg: 140 },
    { id: 3, name: '8mm Ball Nose', type: 'ball', diameter: 8 }
  ];
  const selected = resolveDefaultDrillTool(tools);
  assert.strictEqual(selected.id, 2);
  assert.strictEqual(selected.diameter, 6);
});

test('All 4 industry presets are populated with valid parameters', () => {
  const presetKeys = Object.keys(MULTIAXIS_DRILL_PRESETS);
  assert.strictEqual(presetKeys.length, 4);
  presetKeys.forEach((key) => {
    const p = MULTIAXIS_DRILL_PRESETS[key];
    assert.ok(p.id);
    assert.ok(p.name);
    assert.ok(p.cycle || p.cycleType);
  });
});

// ========================================================
// 2. Drill Tip Compensation & Physics Engine
// ========================================================
console.log('\n--- Group 2: Tip Compensation & Cutting Physics ---');

test('calculateDrillTipLength accurately computes conical tip length for 118° and 140°', () => {
  const dia = 10.0;
  // 118° drill: tip = (10/2) / tan(59°) = 5 / 1.664278 ≈ 3.004mm ≈ 0.300 * D
  const tip118 = calculateDrillTipLength(dia, 118);
  assert.ok(Math.abs(tip118 - 3.00) < 0.05, `Expected ~3.00mm, got ${tip118}`);

  // 140° drill: tip = (10/2) / tan(70°) = 5 / 2.747477 ≈ 1.82mm ≈ 0.182 * D
  const tip140 = calculateDrillTipLength(dia, 140);
  assert.ok(Math.abs(tip140 - 1.82) < 0.05, `Expected ~1.82mm, got ${tip140}`);
});

test('calculateMultiaxisDrillPhysics computes thrust force, torque, and power', () => {
  const tool = { diameter: 6.0, pointAngleDeg: 140, spindleSpeed: 6000, feedRate: 1200 };
  const cutParams = { cycleType: 'G83', peckDepthMm: 5.0 };
  const physics = calculateMultiaxisDrillPhysics(tool, cutParams, 'ALU_6061');

  assert.ok(physics.feedPerRevMm > 0.1 && physics.feedPerRevMm < 0.3, `Feed/rev ${physics.feedPerRevMm}`);
  assert.ok(physics.thrustForceN > 100, `Thrust force ${physics.thrustForceN}N`);
  assert.ok(physics.torqueNm > 0.5, `Torque ${physics.torqueNm}Nm`);
  assert.ok(physics.powerKw > 0.1, `Power ${physics.powerKw}kW`);
  assert.ok(physics.mrrCm3Min > 10, `MRR ${physics.mrrCm3Min} cm³/min`);
});

// ========================================================
// 3. 3D Compound Hole Extraction & Kinematics
// ========================================================
console.log('\n--- Group 3: 3D Compound Hole Recognition & Kinematics ---');

test('extract3DCompoundHoles provides default compound holes when no mesh is passed', () => {
  const holes = extract3DCompoundHoles(null);
  assert.ok(holes.length >= 8, `Expected at least 8 compound holes, got ${holes.length}`);
  const tiltedHole = holes.find((h) => Math.abs(h.nx) > 0.1 || Math.abs(h.nz) > 0.1);
  assert.ok(tiltedHole, 'Should contain compound tilted holes');
  assert.ok(tiltedHole.angles);
  assert.ok(tiltedHole.angles.A !== undefined || tiltedHole.angles.B !== undefined);
});

test('extract3DCompoundHoles extracts cylinders from Three.js Object3D hierarchy', () => {
  const root = new THREE.Group();
  const cylGeo = new THREE.CylinderGeometry(4.0, 4.0, 30.0, 16);
  const cylMesh = new THREE.Mesh(cylGeo);
  cylMesh.name = 'Coolant_Bore_Ø8mm';
  cylMesh.position.set(10, 15, -20);
  cylMesh.rotation.set(0.3, 0.5, 0);
  root.add(cylMesh);

  const holes = extract3DCompoundHoles(root);
  assert.ok(holes.length >= 1);
  const found = holes.find((h) => h.name.includes('Coolant_Bore'));
  assert.ok(found);
  assert.strictEqual(found.diameter, 8.0);
  assert.strictEqual(found.depth, 30.0);
});

test('computeDrillKinematicsAngles calculates table-table angles correctly', () => {
  // Pure vertical approach (0, 1, 0)
  const vert = computeDrillKinematicsAngles({ x: 0, y: 1, z: 0 }, 'table_table_ac');
  assert.strictEqual(vert.A, 0);
  assert.strictEqual(vert.C, 0);

  // 30 degree tilt
  const tilt30 = computeDrillKinematicsAngles({ x: 0.5, y: 0.866, z: 0 }, 'table_table_ac');
  assert.ok(Math.abs(Math.abs(tilt30.A) - 30.0) < 0.5, `Expected A ≈ 30°, got ${tilt30.A}`);
});

// ========================================================
// 4. Toolpath Generation & Canned Cycles
// ========================================================
console.log('\n--- Group 4: Toolpath Generation & 5-Axis Cycles ---');

test('generateMultiaxisDrillToolpath creates G83 deep peck toolpath with retracts', () => {
  const params = createDefaultMultiaxisDrillParams();
  params.cutParameters.cycleType = 'G83';
  params.cutParameters.peckDepthMm = 5.0;

  const tool = { diameter: 6.0, pointAngleDeg: 140, feedRate: 1000, spindleSpeed: 6000 };
  const toolpath = generateMultiaxisDrillToolpath(params, tool);

  assert.strictEqual(toolpath.strategy, 'multiaxis_drill');
  assert.strictEqual(toolpath.badge, '5X-DRILL');
  assert.ok(toolpath.cuttingLines.length > 0);
  assert.ok(toolpath.rapidLines.length > 0);
  assert.ok(toolpath.retractLines.length > 0);
  assert.ok(toolpath.needles.length > 0);
  assert.ok(toolpath.trajectoryPoints.length > 0);
  assert.strictEqual(toolpath.isSimultaneous5X, true);

  // Check that waypoints contain point Vector3 and kinematic angles
  const firstPt = toolpath.trajectoryPoints[0];
  assert.ok(firstPt.point instanceof THREE.Vector3);
  assert.ok(firstPt.angles);
  assert.ok(typeof firstPt.angles.A === 'number');
});

test('generateMultiaxisDrillToolpath creates G81 direct single plunge toolpath', () => {
  const params = createDefaultMultiaxisDrillParams();
  params.cutParameters.cycleType = 'G81';

  const tool = { diameter: 6.0, pointAngleDeg: 140, feedRate: 1000, spindleSpeed: 6000 };
  const toolpath = generateMultiaxisDrillToolpath(params, tool);

  assert.strictEqual(toolpath.stats.cycleType, 'G81');
  assert.strictEqual(toolpath.cuttingLines.length, toolpath.holes.length);
});

test('generateMultiaxisDrillToolpath creates G73 chip break peck toolpath', () => {
  const params = createDefaultMultiaxisDrillParams();
  params.cutParameters.cycleType = 'G73';
  params.cutParameters.peckDepthMm = 4.0;
  params.cutParameters.chipBreakRetractMm = 0.8;

  const tool = { diameter: 6.0, pointAngleDeg: 140, feedRate: 1000, spindleSpeed: 6000 };
  const toolpath = generateMultiaxisDrillToolpath(params, tool);

  assert.strictEqual(toolpath.stats.cycleType, 'G73');
  assert.ok(toolpath.retractLines.length > 0);
});

// ========================================================
// 5. Multi-Controller Production G-Code Post-Processor
// ========================================================
console.log('\n--- Group 5: Multi-Dialect CNC G-Code Output ---');

test('generateMultiaxisDrillGCode outputs Fanuc G68.2 TWP with G53.1 and canned cycles', () => {
  const params = createDefaultMultiaxisDrillParams();
  params.machineKinematics.postDialect = 'fanuc_twp';
  params.cutParameters.cycleType = 'G83';

  const tool = { number: 10, name: '6mm Drill', diameter: 6.0, feedRate: 1000, spindleSpeed: 6000 };
  const toolpath = generateMultiaxisDrillToolpath(params, tool);
  const result = generateMultiaxisDrillGCode(toolpath, params);

  assert.ok(result.gcodeText);
  assert.ok(result.gcodeText.includes('G68.2 X'), 'Must contain Fanuc G68.2 TWP activation');
  assert.ok(result.gcodeText.includes('G53.1'), 'Must contain G53.1 tool spindle align');
  assert.ok(result.gcodeText.includes('G83 Z-'), 'Must contain G83 peck drilling');
  assert.ok(result.gcodeText.includes('G80'), 'Must contain G80 canned cycle cancel');
  assert.ok(result.gcodeText.includes('G69'), 'Must contain G69 TWP cancel');
  assert.ok(result.holeCount > 0);
});

test('generateMultiaxisDrillGCode outputs Haas G254 DWO with G255 cancel', () => {
  const params = createDefaultMultiaxisDrillParams();
  params.machineKinematics.postDialect = 'haas_dwo';
  params.cutParameters.cycleType = 'G83';

  const tool = { number: 10, name: '6mm Drill', diameter: 6.0, feedRate: 1000, spindleSpeed: 6000 };
  const toolpath = generateMultiaxisDrillToolpath(params, tool);
  const result = generateMultiaxisDrillGCode(toolpath, params);

  assert.ok(result.gcodeText.includes('G254'), 'Must contain Haas G254 DWO activation');
  assert.ok(result.gcodeText.includes('G255'), 'Must contain Haas G255 DWO cancel');
});

test('generateMultiaxisDrillGCode outputs Simultaneous 5-Axis TCPM G43.4', () => {
  const params = createDefaultMultiaxisDrillParams();
  params.machineKinematics.postDialect = 'simultaneous_tcpm';

  const tool = { number: 10, name: '6mm Drill', diameter: 6.0, feedRate: 1000, spindleSpeed: 6000 };
  const toolpath = generateMultiaxisDrillToolpath(params, tool);
  const result = generateMultiaxisDrillGCode(toolpath, params);

  assert.ok(result.gcodeText.includes('G43.4 H10'), 'Must contain G43.4 TCPM activation');
  assert.ok(result.gcodeText.includes('G49'), 'Must contain G49 TCPM cancel');
});

console.log(`\n🎉 All ${passCount} tests in Mastercam 5-Axis Multiaxis Drilling Suite PASSED!`);
