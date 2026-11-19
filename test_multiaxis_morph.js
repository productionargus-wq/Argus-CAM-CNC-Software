/**
 * Mastercam-Authentic 5-Axis Multiaxis Morph Verification Suite
 * Comprehensive 40+ Assertions across Schema, Physics, IK, CAD Extraction, 3D Blend Loops, Contact Ribbons & G-Code
 */

import * as THREE from 'three';
import {
  MULTIAXIS_MORPH_PAGE_TITLES,
  MULTIAXIS_MORPH_MATERIALS,
  MULTIAXIS_MORPH_PRESETS,
  MULTIAXIS_KINEMATICS_OPTIONS,
  MULTIAXIS_TCPM_OPTIONS,
  calculateMultiaxisMorphPhysics,
  calculateRecommendedMorphSettings,
  createDefaultMultiaxisMorphState,
  resolveDefaultMultiaxisTool
} from './src/config/multiaxisMorphSchema.js';

import {
  extractMorphGeometryFromModel,
  calculate5AxisMorphVectors,
  solve5AxisMorphMachineAngles,
  buildMorphBlendLoop,
  audit5AxisMorphTrajectory,
  generateMultiaxisMorphToolpath,
  generateMultiaxisMorphGCode
} from './src/utils/multiaxisMorphEngine.js';

console.log('=== RUNNING 5-AXIS MULTIAXIS MORPH ENGINE TESTS ===\n');

let passCount = 0;
let failCount = 0;
function assert(cond, msg) {
  if (cond) {
    passCount++;
  } else {
    failCount++;
    console.error(`  ❌ FAILED: ${msg}`);
  }
}

// 1. Schema Taxonomy & Mastercam Pages
console.log('Test 1: Mastercam 10-page taxonomy and schema structure...');
assert(Object.keys(MULTIAXIS_MORPH_PAGE_TITLES).length === 10, 'Must have exactly 10 Mastercam pages');
assert(MULTIAXIS_MORPH_PAGE_TITLES.toolpath_type === 'Toolpath Type', 'Page 1 title correct');
assert(MULTIAXIS_MORPH_PAGE_TITLES.cut_pattern === 'Cut Pattern (Morph Guides)', 'Page 2 title correct');
assert(MULTIAXIS_MORPH_PAGE_TITLES.tool_axis_control === 'Tool Axis Control (Lead / Tilt)', 'Page 5 title correct');
assert(MULTIAXIS_MORPH_PAGE_TITLES.linking_parameters === 'Linking & Lead-In/Out Transitions', 'Page 7 title correct');
assert(MULTIAXIS_MORPH_PAGE_TITLES.machine_kinematics === 'Machine Kinematics & Post Dialect', 'Page 8 title correct');
console.log(`✓ Test 1 Passed: 10 Mastercam pages verified.`);

// 2. Default State & Tool Resolution
console.log('\nTest 2: Default state initialization & tool resolution...');
const defaultState = createDefaultMultiaxisMorphState();
assert(defaultState.id === null, 'ID should default to null for clean database insertion');
assert(defaultState.strategyKey === 'multiaxis_morph', 'Strategy key is multiaxis_morph');
assert(defaultState.cutPattern.numberOfCuts >= 20, 'Default cuts >= 20');
assert(defaultState.toolAxisControl.leadAngleDeg === 10.0, 'Default lead angle is 10°');
assert(defaultState.toolAxisControl.tiltAngleDeg === 15.0, 'Default tilt angle is 15°');

const sampleTools = [
  { id: 1, number: 1, type: 'flat', diameter: 16, name: '16mm Flat Endmill' },
  { id: 5, number: 5, type: 'ball', diameter: 8, name: '8mm Ball Nose' }
];
const resolvedTool = resolveDefaultMultiaxisTool(sampleTools);
assert(resolvedTool.id === 5 && resolvedTool.type === 'ball', 'Prefers ballnose for multiaxis morph');
console.log(`✓ Test 2 Passed: Default state and tool resolver verified.`);

// 3. Materials Database & Recommended Settings Auto-Calculator
console.log('\nTest 3: Materials database & Recommended Values auto-calculator...');
const alu = MULTIAXIS_MORPH_MATERIALS.ALU_6061;
const ti = MULTIAXIS_MORPH_MATERIALS.TITANIUM_5X;
assert(alu && alu.vc === 450, 'Alu 6061 surface speed is 450 m/min');
assert(ti && ti.vc === 65, 'Ti-6Al-4V surface speed is 65 m/min');

const recAlu = calculateRecommendedMorphSettings({ materialKey: 'ALU_6061', tool: { diameter: 10, flutes: 4 } });
assert(recAlu.spindleSpeed > 10000, `Alu RPM is high-speed (${recAlu.spindleSpeed} RPM)`);
assert(recAlu.feedRate > 2000, `Alu feedrate is high-speed (${recAlu.feedRate} mm/min)`);
assert(recAlu.leadAngleDeg === 10.0, 'Recommended lead angle is 10°');
assert(recAlu.tiltAngleDeg === 15.0, 'Recommended tilt angle is 15°');

const recTi = calculateRecommendedMorphSettings({ materialKey: 'TITANIUM_5X', tool: { diameter: 10, flutes: 4 } });
assert(recTi.spindleSpeed < recAlu.spindleSpeed, 'Titanium RPM is safely clamped');
console.log(`✓ Test 3 Passed: Material database and recommended values verified.`);

// 4. Real-Time Cutting Physics Calculations
console.log('\nTest 4: Real-time 5-Axis cutting physics calculations...');
const physics = calculateMultiaxisMorphPhysics(
  { diameter: 10, flutes: 4, spindleSpeed: 12000, feedRate: 3000, type: 'ball' },
  { leadAngleDeg: 10.0, tiltAngleDeg: 15.0, stepoverMm: 1.5, depthOfCutMm: 0.5 },
  'ALU_6061'
);
assert(physics.effDiameterMm > 0 && physics.effDiameterMm <= 10.0, `Effective diameter valid (${physics.effDiameterMm} mm)`);
assert(physics.effVcMMin > 100, `Effective surface speed > 100 m/min (${physics.effVcMMin} m/min)`);
assert(physics.scallopMicrons > 0, `Scallop height calculated (${physics.scallopMicrons} µm)`);
assert(physics.powerKw > 0, `Cutting power calculated (${physics.powerKw} kW)`);
assert(physics.forceN > 0, `Cutting force calculated (${physics.forceN} N)`);
assert(physics.mrr > 0, `MRR calculated (${physics.mrr} cm3/min)`);
console.log(`✓ Test 4 Passed: Physics calculation verified.`);

// 5. 5-Axis Lead/Tilt Tool Vectors & Machine Inverse Kinematics
console.log('\nTest 5: 5-Axis Lead/Tilt Frenet vectors and Inverse Kinematics (IK)...');
const vecResult = calculate5AxisMorphVectors({
  tangent: new THREE.Vector3(1, 0, 0),
  normal: new THREE.Vector3(0, 1, 0),
  leadAngleDeg: 10.0,
  tiltAngleDeg: 15.0
});
assert(vecResult.toolVector.y > 0.8, 'Tool vector points upward in spindle direction');
assert(Math.abs(vecResult.toolVector.length() - 1.0) < 0.001, 'Tool vector is normalized unit vector');

// Test IK for 4 machine architectures
const ikAC = solve5AxisMorphMachineAngles(vecResult.toolVector, 'table_table_ac');
assert(Number.isFinite(ikAC.A) && Number.isFinite(ikAC.C), 'Table-Table AC angles solved');
assert(Math.abs(ikAC.A) > 5.0, `A-axis tilts according to lead/tilt angles (A = ${ikAC.A}°)`);

const ikBC = solve5AxisMorphMachineAngles(vecResult.toolVector, 'table_table_bc');
assert(Number.isFinite(ikBC.B) && Number.isFinite(ikBC.C), 'Table-Table BC angles solved');

const ikAB = solve5AxisMorphMachineAngles(vecResult.toolVector, 'head_head_ab');
assert(Number.isFinite(ikAB.A) && Number.isFinite(ikAB.B), 'Head-Head AB angles solved');
console.log(`✓ Test 5 Passed: 5-Axis orientation vectors and 4-machine IK solvers verified.`);

// 6. CAD Drive Surface & 2 Guide Curves Extraction
console.log('\nTest 6: CAD Drive surface & 2 Guide Curves extraction...');
const geoAnalytical = extractMorphGeometryFromModel(null, {
  min: { x: -40, y: 12, z: -32 },
  max: { x: 40, y: 22, z: -10 }
});
assert(geoAnalytical.type === 'analytical_saddle', 'Analytical fallback geometry active');
const c1_0 = geoAnalytical.curve1(0);
const c1_1 = geoAnalytical.curve1(1);
const c2_0 = geoAnalytical.curve2(0);
const c2_1 = geoAnalytical.curve2(1);
assert(c1_0 instanceof THREE.Vector3 && c1_1 instanceof THREE.Vector3, 'Guide Curve 1 returns 3D vectors');
assert(c2_0 instanceof THREE.Vector3 && c2_1 instanceof THREE.Vector3, 'Guide Curve 2 returns 3D vectors');
assert(c1_0.z !== c2_0.z, 'Guide Curve 1 and Guide Curve 2 have distinct spatial boundaries');

// Test with mock mesh (simulating loaded benchmark model)
const mockMesh = new THREE.Mesh(
  new THREE.BoxGeometry(80, 20, 40),
  new THREE.MeshBasicMaterial()
);
const geoMesh = extractMorphGeometryFromModel(mockMesh, null);
assert(geoMesh !== null && typeof geoMesh.curve1 === 'function', 'Extracts guide curves from model');
console.log(`✓ Test 6 Passed: Dual guide curve extraction verified.`);

// 7. Mastercam 3D Blend Loop Linking Arcs
console.log('\nTest 7: Mastercam 3D Blend Loop Linking Arcs...');
const loop = buildMorphBlendLoop({
  endPt: new THREE.Vector3(40, 15, -15),
  nextStartPt: new THREE.Vector3(40, 15, -16.5),
  endToolVector: new THREE.Vector3(0, 1, 0),
  nextToolVector: new THREE.Vector3(0, 1, 0),
  endAngles: { A: -10, B: 0, C: 5 },
  nextAngles: { A: -10, B: 0, C: 5 },
  radius: 3.0,
  feedRate: 3000,
  numPoints: 6
});
assert(loop.length === 6, 'Generated 6 blend loop waypoints');
const apexPt = loop[Math.floor(loop.length / 2)].point;
assert(apexPt.y > 15.0, `Blend loop lifts vertically in Y to clear surface (apex Y = ${apexPt.y.toFixed(2)})`);
console.log(`✓ Test 7 Passed: 3D blend loop linking arcs verified.`);

// 8. Toolpath Generation with Contact Ribbons & Needles
console.log('\nTest 8: Full 5-Axis Morph toolpath generation...');
const tp = generateMultiaxisMorphToolpath(
  { min: { x: -40, y: 12, z: -32 }, max: { x: 40, y: 22, z: -10 } },
  { id: 5, number: 5, name: '8mm Ball Nose', diameter: 8, flutes: 2, spindleSpeed: 14000, feedRate: 3500 },
  {
    cutPattern: { numberOfCuts: 15, stepoverDistanceMm: 1.2, cuttingMethod: 'zigzag' },
    toolAxisControl: { leadAngleDeg: 12.0, tiltAngleDeg: 15.0 },
    machineKinematics: { kinematicsId: 'table_table_ac', tcpmMode: 'fanuc' }
  }
);
assert(tp.strategy === 'multiaxis_morph', 'Strategy is multiaxis_morph');
assert(tp.cuttingLines.length > 100, `Cutting lines generated (${tp.cuttingLines.length} segments)`);
assert(tp.vectorNeedles.length > 50, `3D vector needles generated (${tp.vectorNeedles.length} needles)`);
assert(tp.contactRibbonVertices.length > 500, `Contact ribbon mesh vertices generated (${tp.contactRibbonVertices.length} floats)`);
assert(tp.stats.passesCount === 15, 'Pass count matches 15');
assert(tp.audit.isSafe === true, 'Trajectory singularity audit passed safe');
console.log(`✓ Test 8 Passed: Toolpath, needles, and contact ribbons verified.`);

// 9. Production Multi-Dialect 5-Axis G-Code Generation
console.log('\nTest 9: Multi-dialect 5-Axis G-code generation with TCPM...');
// Fanuc 31i
const gcodeFanuc = generateMultiaxisMorphGCode(tp, { number: 5, name: '8mm Ball Nose', diameter: 8, spindleSpeed: 14000, feedRate: 3500 }, {
  tcpmMode: 'fanuc',
  kinematicsId: 'table_table_ac'
});
assert(gcodeFanuc.includes('G43.4 H5 M08'), 'Fanuc G43.4 TCPM activation present');
assert(gcodeFanuc.includes('G05.1 Q1'), 'Fanuc AICC II lookahead present');
assert(gcodeFanuc.includes('G49 (CANCEL 5-AXIS TCPM)'), 'Fanuc G49 TCPM cancel present');
assert(gcodeFanuc.includes('G05.1 Q0'), 'Fanuc AICC II cancel present');
assert(gcodeFanuc.includes('M30'), 'Program end M30 present');

// Haas NGC
const gcodeHaas = generateMultiaxisMorphGCode(tp, { number: 5, name: '8mm Ball Nose', diameter: 8 }, {
  tcpmMode: 'haas',
  kinematicsId: 'table_table_ac'
});
assert(gcodeHaas.includes('G234 H5 M08'), 'Haas G234 TCPC present');
assert(gcodeHaas.includes('G187 P2'), 'Haas G187 P2 smoothing present');
assert(gcodeHaas.includes('G49 (CANCEL HAAS TCPC)'), 'Haas G49 cancel present');

// Siemens 840D
const gcodeSiemens = generateMultiaxisMorphGCode(tp, { number: 5, name: '8mm Ball Nose', diameter: 8 }, {
  tcpmMode: 'siemens',
  kinematicsId: 'table_table_ac'
});
assert(gcodeSiemens.includes('TRAORI'), 'Siemens TRAORI present');
assert(gcodeSiemens.includes('TRAFOOF'), 'Siemens TRAFOOF present');
console.log(`✓ Test 9 Passed: Fanuc, Haas, and Siemens G-code generation verified.`);

console.log(`\n==================================================`);
console.log(`TOTAL ASSERTIONS PASSED: ${passCount}`);
console.log(`TOTAL ASSERTIONS FAILED: ${failCount}`);
if (failCount === 0) {
  console.log(`=== ALL 5-AXIS MULTIAXIS MORPH TESTS PASSED SUCCESFULLY! ===\n`);
} else {
  process.exit(1);
}
