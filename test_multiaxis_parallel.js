/**
 * Comprehensive Automated Test Suite for 5-Axis Parallel Surface Finishing
 */

import * as THREE from 'three';
import {
  MULTIAXIS_PARALLEL_PAGES,
  MULTIAXIS_PARALLEL_MATERIALS,
  MULTIAXIS_PARALLEL_PRESETS,
  MULTIAXIS_PARALLEL_KINEMATICS,
  MULTIAXIS_PARALLEL_TCPM_DIALECTS,
  resolveDefaultParallelTool,
  calculateParallelPhysics,
  calculateRecommendedParallelSettings,
  DEFAULT_PARALLEL_CONFIG
} from './src/config/multiaxisParallelSchema.js';

import {
  extractDriveSurfacesFromModel,
  calculate5AxisParallelVectors,
  solveParallelMachineAngles,
  buildParallelBlendLoop,
  generateMultiaxisParallelToolpath,
  generateMultiaxisParallelGCode
} from './src/utils/multiaxisParallelEngine.js';

console.log('====================================================');
console.log('   MASTERCAM 5-AXIS PARALLEL TEST SUITE             ');
console.log('====================================================\n');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    testsPassed++;
  } else {
    console.error(`[FAIL] ${testName}`);
    testsFailed++;
  }
}

// TEST 1: Schema & Tree Structure
console.log('--- Test Group 1: Configuration Schema & Taxonomy ---');
assert(Object.keys(MULTIAXIS_PARALLEL_PAGES).length === 10, '10 Mastercam Tree Pages defined');
assert(MULTIAXIS_PARALLEL_PAGES.cut_pattern === 'Cut Pattern & Machining Angle', 'Page 2 is Cut Pattern & Machining Angle');
assert(MULTIAXIS_PARALLEL_MATERIALS.ALU_6061.vc === 420, 'Alu 6061 Vc = 420 m/min');
assert(MULTIAXIS_PARALLEL_MATERIALS.TITANIUM_5X.kc === 2800, 'Titanium kc = 2800 N/mm2');
assert(MULTIAXIS_PARALLEL_PRESETS.MOLD_CAVITY_FINISH !== undefined, 'Mold Cavity preset exists');
assert(MULTIAXIS_PARALLEL_KINEMATICS.TABLE_TABLE_AC !== undefined, 'Table-Table AC kinematics defined');

// TEST 2: Tool Auto-Resolver & Recommended Values
console.log('\n--- Test Group 2: Intelligent Tool Auto-Resolver & Recommendations ---');
const mockTools = [
  { id: 1, number: 1, name: '50mm Face Mill', type: 'face', diameter: 50 },
  { id: 2, number: 2, name: '8mm 2-Flute Ball Nose', type: 'ball', diameter: 8, flutes: 2 },
  { id: 3, number: 3, name: '10mm Flat Endmill', type: 'flat', diameter: 10, flutes: 4 }
];
const resolvedTool = resolveDefaultParallelTool(mockTools);
assert(resolvedTool && resolvedTool.id === 2, `Auto-resolved tool is 8mm Ball Nose (id: ${resolvedTool?.id})`);

const recSettings = calculateRecommendedParallelSettings({
  materialId: 'alu_6061',
  tool: resolvedTool,
  tools: mockTools
});
assert(recSettings.spindleRpm > 10000, `Recommended Spindle RPM: ${recSettings.spindleRpm}`);
assert(recSettings.feedRate > 1500, `Recommended Feed Rate: ${recSettings.feedRate} mm/min`);
assert(recSettings.leadAngleDeg === 12.0, `Recommended Lead Angle: ${recSettings.leadAngleDeg} deg`);
assert(recSettings.stepoverMm > 0 && recSettings.stepoverMm < 1.0, `Recommended Stepover: ${recSettings.stepoverMm} mm`);

// TEST 3: Physics, Effective Cutter Diameter & Scallop Height
console.log('\n--- Test Group 3: Physics, Effective Diameter & Scallop Height ---');
const physics = calculateParallelPhysics({
  material: MULTIAXIS_PARALLEL_MATERIALS.ALU_6061,
  tool: { diameter: 8, flutes: 2 },
  stepover: 0.35,
  feedRate: 2400,
  rpm: 12000,
  leadAngleDeg: 12.0,
  tiltAngleDeg: 0.0
});
assert(physics.effDiameterMm > 0 && physics.effDiameterMm < 8.0, `Effective cutting diameter off tip dead-spot: ${physics.effDiameterMm} mm`);
assert(physics.effVcMMin > 0, `Effective cutting speed: ${physics.effVcMMin} m/min`);
assert(physics.scallopMicrons < 10.0, `Calculated scallop height: ${physics.scallopMicrons} µm`);
assert(physics.estimatedRaMicrons > 0, `Estimated surface roughness Ra: ${physics.estimatedRaMicrons} µm`);
assert(physics.finishRating.includes('FINE') || physics.finishRating.includes('MIRROR') || physics.finishRating.includes('GOOD'), `Finish rating: ${physics.finishRating}`);

// TEST 4: 5-Axis Tool Orientation & Kinematics
console.log('\n--- Test Group 4: 5-Axis Vector Formulation & 4-Machine Kinematics ---');
const vRes = calculate5AxisParallelVectors({
  contactPt: new THREE.Vector3(0, 15, -20),
  tangent: new THREE.Vector3(1, 0, 0),
  surfaceNormal: new THREE.Vector3(0, 1, 0),
  leadAngleDeg: 12.0,
  tiltAngleDeg: 5.0
});
assert(Math.abs(vRes.toolVector.length() - 1.0) < 0.0001, `Tool vector is unit length: ${vRes.toolVector.length().toFixed(5)}`);
assert(vRes.toolVector.y > 0.8, `Tool vector tilted upward in spindle +Y (y: ${vRes.toolVector.y.toFixed(4)})`);

// Test kinematics for all 4 architectures
const ikAC = solveParallelMachineAngles(vRes.toolVector, 'table_table_ac');
assert(typeof ikAC.A === 'number' && typeof ikAC.C === 'number', `Table-Table AC Angles: A=${ikAC.A} deg, C=${ikAC.C} deg`);

const ikBC = solveParallelMachineAngles(vRes.toolVector, 'table_table_bc');
assert(typeof ikBC.B === 'number' && typeof ikBC.C === 'number', `Table-Table BC Angles: B=${ikBC.B} deg, C=${ikBC.C} deg`);

const ikHeadTable = solveParallelMachineAngles(vRes.toolVector, 'head_table_bc');
assert(typeof ikHeadTable.B === 'number' && typeof ikHeadTable.C === 'number', `Head-Table BC Angles: B=${ikHeadTable.B} deg, C=${ikHeadTable.C} deg`);

const ikHeadHead = solveParallelMachineAngles(vRes.toolVector, 'head_head_ab');
assert(typeof ikHeadHead.A === 'number' && typeof ikHeadHead.B === 'number', `Head-Head AB Angles: A=${ikHeadHead.A} deg, B=${ikHeadHead.B} deg`);

// TEST 5: Smooth 3D Blend Loop Linking
console.log('\n--- Test Group 5: 3D Blend Loop Linking Transitions ---');
const loop = buildParallelBlendLoop({
  endPt: new THREE.Vector3(20, 15, -20),
  nextStartPt: new THREE.Vector3(20, 15, -19.5),
  endToolVector: new THREE.Vector3(0, 1, 0),
  nextToolVector: new THREE.Vector3(0, 1, 0),
  endAngles: { A: 0, B: 0, C: 0 },
  nextAngles: { A: 0, B: 0, C: 0 },
  radius: 3.0,
  feedRate: 3500
});
assert(loop.length === 6, `Blend loop generated ${loop.length} waypoints`);
assert(loop[3].point.y > 15.0, `Blend loop apex lifts above cutting plane: ${loop[3].point.y.toFixed(2)} mm`);

// TEST 6: Toolpath Generation on Analytical Saddle & Real STEP Part
console.log('\n--- Test Group 6: 5-Axis Parallel Toolpath Generation ---');
const bounds = { min: { x: -40, y: 12, z: -32 }, max: { x: 40, y: 22, z: -10 } };
const parallelOp = generateMultiaxisParallelToolpath(
  bounds,
  resolvedTool,
  {
    machiningAngleDeg: 45.0,
    stepoverMm: 1.0,
    leadAngleDeg: 12.0,
    tiltAngleDeg: 0.0,
    cuttingMethod: 'zigzag',
    feedRate: 2400,
    spindleRpm: 12000,
    machineKinematics: 'table_table_ac'
  }
);
assert(parallelOp.cuttingLines.length > 50, `Cutting line segments: ${parallelOp.cuttingLines.length}`);
assert(parallelOp.rapidLines.length > 0, `Rapid line segments: ${parallelOp.rapidLines.length}`);
assert(parallelOp.arcLines.length > 0, `Blend loop arc lines: ${parallelOp.arcLines.length}`);
assert(parallelOp.vectorNeedles.length > 20, `5-Axis Tool Orientation Needles: ${parallelOp.vectorNeedles.length}`);
assert(parallelOp.contactRibbonVertices.length > 100, `Contact Ribbon Vertices: ${parallelOp.contactRibbonVertices.length / 3}`);
assert(parallelOp.trajectoryPoints.length > 50, `Trajectory waypoints: ${parallelOp.trajectoryPoints.length}`);
assert(parallelOp.color === '#d946ef', 'Color matches Mastercam 5-Axis Magenta (#d946ef)');

// TEST 7: Production TCPM G-Code Generation
console.log('\n--- Test Group 7: Production 5-Axis TCPM G-Code Generation ---');
const fanucGCode = generateMultiaxisParallelGCode(
  parallelOp,
  resolvedTool,
  { controllerDialect: 'fanuc', spindleRpm: 12000, feedRate: 2400 }
);
assert(fanucGCode.includes('G43.4 H2 M08'), 'Fanuc G-code contains G43.4 H2 M08 TCPM activation');
assert(fanucGCode.includes('G05.1 Q1'), 'Fanuc G-code contains G05.1 Q1 look-ahead');
assert(fanucGCode.includes('G49'), 'Fanuc G-code contains G49 cancellation');
assert(fanucGCode.includes('A') && fanucGCode.includes('C'), 'Fanuc G-code contains A and C rotary moves');

const haasGCode = generateMultiaxisParallelGCode(
  parallelOp,
  resolvedTool,
  { controllerDialect: 'haas', spindleRpm: 12000, feedRate: 2400 }
);
assert(haasGCode.includes('G234 H2 M08'), 'Haas G-code contains G234 H2 M08 TCPC activation');
assert(haasGCode.includes('G187 P2'), 'Haas G-code contains G187 P2 high-speed mode');

const siemensGCode = generateMultiaxisParallelGCode(
  parallelOp,
  resolvedTool,
  { controllerDialect: 'siemens', spindleRpm: 12000, feedRate: 2400 }
);
assert(siemensGCode.includes('TRAORI'), 'Siemens G-code contains TRAORI activation');
assert(siemensGCode.includes('TRAFOOF'), 'Siemens G-code contains TRAFOOF cancellation');

const heidenhainGCode = generateMultiaxisParallelGCode(
  parallelOp,
  resolvedTool,
  { controllerDialect: 'heidenhain', spindleRpm: 12000, feedRate: 2400 }
);
assert(heidenhainGCode.includes('FUNCTION TCPM'), 'Heidenhain G-code contains FUNCTION TCPM activation');
assert(heidenhainGCode.includes('FUNCTION RESET TCPM'), 'Heidenhain G-code contains FUNCTION RESET TCPM cancellation');

console.log('\n====================================================');
console.log(`TEST SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
console.log('====================================================');

if (testsFailed > 0) {
  process.exit(1);
}
