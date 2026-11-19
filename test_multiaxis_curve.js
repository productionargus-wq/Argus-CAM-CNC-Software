import assert from 'node:assert';
import * as THREE from 'three';

import {
  MULTIAXIS_CURVE_PAGE_TITLES,
  MULTIAXIS_CURVE_MATERIALS,
  MULTIAXIS_CURVE_PRESETS,
  MULTIAXIS_CURVE_KINEMATICS,
  MULTIAXIS_CURVE_POST_DIALECTS,
  calculateMultiaxisCurvePhysics,
  createDefaultMultiaxisCurveParams,
  resolveDefaultCurveTool
} from './src/config/multiaxisCurveSchema.js';

import {
  extract3DDriveCurve,
  calculateCurveToolVector,
  computeCurveKinematicsAngles,
  generateMultiaxisCurveToolpath,
  generateMultiaxisCurveGCode
} from './src/utils/multiaxisCurveEngine.js';

console.log('🧪 Starting Mastercam 5-Axis Multiaxis Curve Automated Test Suite...\n');

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
  const pages = Object.keys(MULTIAXIS_CURVE_PAGE_TITLES);
  assert.strictEqual(pages.length, 10);
  assert.ok(pages.includes('toolpath_type'));
  assert.ok(pages.includes('curve_selection'));
  assert.ok(pages.includes('tool'));
  assert.ok(pages.includes('holder'));
  assert.ok(pages.includes('cut_parameters'));
  assert.ok(pages.includes('tool_axis_control'));
  assert.ok(pages.includes('collision_control'));
  assert.ok(pages.includes('linking_parameters'));
  assert.ok(pages.includes('machine_kinematics'));
  assert.ok(pages.includes('planes_coolant'));
});

test('createDefaultMultiaxisCurveParams produces valid 10-page default structure', () => {
  const params = createDefaultMultiaxisCurveParams();
  assert.strictEqual(params.strategyKey, '5axis_curve');
  assert.strictEqual(params.toolpathType.strategy, '5axis_curve');
  assert.ok(params.curveSelection);
  assert.ok(params.tool);
  assert.strictEqual(params.tool.diameter, 10.0);
  assert.ok(params.cutParameters);
  assert.strictEqual(params.cutParameters.cutterCompensation, 'left');
  assert.ok(params.toolAxisControl);
  assert.strictEqual(params.toolAxisControl.axisMode, 'surface_normal');
  assert.ok(params.machineKinematics);
  assert.strictEqual(params.machineKinematics.postDialect, 'fanuc_tcpm');
});

test('resolveDefaultCurveTool selects appropriate milling tool or fallback', () => {
  const tools = [
    { id: 1, name: '10mm Endmill', type: 'flat', diameter: 10 },
    { id: 2, name: '6mm Carbide Drill', type: 'drill', diameter: 6 }
  ];
  const selected = resolveDefaultCurveTool(tools);
  assert.strictEqual(selected.id, 1);
  assert.strictEqual(selected.diameter, 10);
});

test('All 4 industry presets are populated with valid parameters', () => {
  const presetKeys = Object.keys(MULTIAXIS_CURVE_PRESETS);
  assert.strictEqual(presetKeys.length, 4);
  presetKeys.forEach((key) => {
    const p = MULTIAXIS_CURVE_PRESETS[key];
    assert.ok(p.id);
    assert.ok(p.name);
    assert.ok(p.materialKey);
    assert.ok(p.axisMode);
  });
});

// ========================================================
// 2. Physics & Kinematics Calculations
// ========================================================
console.log('\n--- Group 2: Cutting Physics & Machine Kinematics ---');

test('calculateMultiaxisCurvePhysics computes cutting speed, forces, torque, and power', () => {
  const tool = { diameter: 10.0, flutes: 4, spindleSpeed: 11000, feedPerTooth: 0.08 };
  const cutParams = { axialStepdownMm: 2.0, radialOffsetMm: 2.5 };
  const physics = calculateMultiaxisCurvePhysics(tool, cutParams, 'ALU_6061');

  assert.ok(physics.vcMMin > 300, `Expected Vc > 300 m/min, got ${physics.vcMMin}`);
  assert.ok(physics.feedRateMmMin > 2500, `Expected Feed > 2500 mm/min, got ${physics.feedRateMmMin}`);
  assert.ok(physics.cuttingForceN > 10, `Cutting force ${physics.cuttingForceN}N`);
  assert.ok(physics.spindleTorqueNm > 0.1, `Torque ${physics.spindleTorqueNm}Nm`);
  assert.ok(physics.cuttingPowerKw > 0.1, `Power ${physics.cuttingPowerKw}kW`);
});

test('computeCurveKinematicsAngles calculates table-table angles correctly', () => {
  // Tool vector pointing straight up along +Y (spindle down)
  const vert = computeCurveKinematicsAngles({ x: 0, y: 1, z: 0 }, 'table_table_ac');
  assert.strictEqual(vert.A, 0);
  assert.strictEqual(vert.C, 0);

  // 15 degree forward tilt
  const tilt15 = computeCurveKinematicsAngles({ x: 0, y: 0.9659, z: 0.2588 }, 'table_table_ac');
  assert.ok(Math.abs(Math.abs(tilt15.A) - 15.0) < 0.5, `Expected A ≈ 15°, got ${tilt15.A}`);
});

// ========================================================
// 3. 3D Drive Curve & Tool Vector Formulation
// ========================================================
console.log('\n--- Group 3: 3D Curve Extraction & Vector Control ---');

test('extract3DDriveCurve generates closed 3D saddle curve with tangents and normals', () => {
  const curve = extract3DDriveCurve(null);
  assert.ok(curve.length >= 50, `Expected >= 50 curve points, got ${curve.length}`);
  const firstPt = curve[0];
  assert.ok(firstPt.x !== undefined && firstPt.y !== undefined && firstPt.z !== undefined);
  assert.ok(firstPt.nx !== undefined && firstPt.ny !== undefined && firstPt.nz !== undefined);
  assert.ok(firstPt.tx !== undefined && firstPt.ty !== undefined && firstPt.tz !== undefined);
});

test('calculateCurveToolVector combines normal with lead and tilt angles', () => {
  const normal = { x: 0, y: 1, z: 0 };
  const tangent = { x: 1, y: 0, z: 0 };

  // Pure normal (0 lead, 0 tilt)
  const vecNormal = calculateCurveToolVector(normal, tangent, 0, 0);
  assert.strictEqual(vecNormal.x, 0);
  assert.strictEqual(vecNormal.y, 1);
  assert.strictEqual(vecNormal.z, 0);

  // 10 degree lead angle
  const vecLead = calculateCurveToolVector(normal, tangent, 10, 0);
  assert.ok(vecLead.y < 1.0, 'Y component should decrease with lead angle');
  assert.ok(Math.abs(vecLead.x) > 0.1 || Math.abs(vecLead.z) > 0.1, 'Lateral vector should tilt');
});

// ========================================================
// 4. Toolpath Generation & Multi-Pass Slicing
// ========================================================
console.log('\n--- Group 4: 5-Axis Curve Toolpath Generation ---');

test('generateMultiaxisCurveToolpath creates 5-axis curve toolpath with multi-pass depths', () => {
  const params = createDefaultMultiaxisCurveParams();
  params.cutParameters.cutterCompensation = 'left';
  params.cutParameters.axialStepdownMm = 2.0;
  params.cutParameters.totalDepthMm = 6.0; // 3 passes

  const tool = { diameter: 10.0, feedRate: 3500, spindleSpeed: 10000 };
  const toolpath = generateMultiaxisCurveToolpath(params, tool);

  assert.strictEqual(toolpath.strategy, '5axis_curve');
  assert.strictEqual(toolpath.badge, '5X-CURVE');
  assert.strictEqual(toolpath.color, '#ec4899');
  assert.strictEqual(toolpath.stats.passesCount, 3);
  assert.ok(toolpath.cuttingLines.length > 0);
  assert.ok(toolpath.rapidLines.length > 0);
  assert.ok(toolpath.needles.length > 0);
  assert.ok(toolpath.trajectoryPoints.length > 0);
  assert.strictEqual(toolpath.isSimultaneous5X, true);

  // Check trajectory waypoint structure
  const wp = toolpath.trajectoryPoints[0];
  assert.ok(wp.point instanceof THREE.Vector3);
  assert.ok(wp.angles);
  assert.ok(typeof wp.angles.A === 'number');
});

// ========================================================
// 5. Multi-Controller Simultaneous TCPM G-Code Output
// ========================================================
console.log('\n--- Group 5: Multi-Controller Simultaneous TCPM Output ---');

test('generateMultiaxisCurveGCode outputs Fanuc G43.4 TCPM G-code', () => {
  const params = createDefaultMultiaxisCurveParams();
  params.machineKinematics.postDialect = 'fanuc_tcpm';

  const tool = { number: 1, name: '10mm Endmill', diameter: 10.0, feedRate: 3500, spindleSpeed: 11000 };
  const toolpath = generateMultiaxisCurveToolpath(params, tool);
  const result = generateMultiaxisCurveGCode(toolpath, params);

  assert.ok(result.gcodeText);
  assert.ok(result.gcodeText.includes('G43.4 H1 M08'), 'Must contain Fanuc G43.4 TCPM activation');
  assert.ok(result.gcodeText.includes('G05.1 Q1'), 'Must contain AICC II look-ahead');
  assert.ok(result.gcodeText.includes('G49'), 'Must contain G49 TCPM cancel');
  assert.ok(result.lineCount > 50);
});

test('generateMultiaxisCurveGCode outputs Haas G234 TCPC G-code', () => {
  const params = createDefaultMultiaxisCurveParams();
  params.machineKinematics.postDialect = 'haas_tcpc';

  const tool = { number: 1, name: '10mm Endmill', diameter: 10.0, feedRate: 3500, spindleSpeed: 11000 };
  const toolpath = generateMultiaxisCurveToolpath(params, tool);
  const result = generateMultiaxisCurveGCode(toolpath, params);

  assert.ok(result.gcodeText.includes('G234 H1 M08'), 'Must contain Haas G234 TCPC activation');
  assert.ok(result.gcodeText.includes('G187 P2'), 'Must contain Haas G187 high-speed mode');
  assert.ok(result.gcodeText.includes('G49'), 'Must contain TCPC cancel');
});

console.log(`\n🎉 All ${passCount} tests in Mastercam 5-Axis Curve Suite PASSED!`);
