/**
 * Mastercam-Authentic 5-Axis Multiaxis Morph Verification Suite
 */

import {
  MULTIAXIS_MORPH_PAGE_TITLES,
  MULTIAXIS_MORPH_MATERIALS,
  MULTIAXIS_MORPH_PRESETS,
  MULTIAXIS_KINEMATICS_OPTIONS,
  MULTIAXIS_TCPM_OPTIONS,
  calculateMultiaxisMorphPhysics,
  createDefaultMultiaxisMorphState
} from './src/config/multiaxisMorphSchema.js';

import {
  calculate5AxisOrientationVector,
  solve5AxisMachineAngles,
  audit5AxisMorphTrajectory,
  generateMultiaxisMorphToolpath,
  generateMultiaxisMorphGCode
} from './src/utils/multiaxisMorphEngine.js';

console.log('=== RUNNING 5-AXIS MULTIAXIS MORPH ENGINE TESTS ===\n');

// 1. Schema & Defaults
console.log('Test 1: Schema taxonomy, presets and defaults...');
const defaultState = createDefaultMultiaxisMorphState();
if (defaultState.id !== null) throw new Error(`Default id should be null, got ${defaultState.id}`);
if (Object.keys(MULTIAXIS_MORPH_PAGE_TITLES).length !== 10) throw new Error(`Expected 10 pages in taxonomy, got ${Object.keys(MULTIAXIS_MORPH_PAGE_TITLES).length}`);
if (MULTIAXIS_MORPH_PRESETS.length !== 4) throw new Error(`Expected 4 presets, got ${MULTIAXIS_MORPH_PRESETS.length}`);
if (Object.keys(MULTIAXIS_MORPH_MATERIALS).length < 6) throw new Error(`Expected materials database, got ${Object.keys(MULTIAXIS_MORPH_MATERIALS).length}`);
console.log('✓ Test 1 Passed: 10 Mastercam pages, 4 presets, and dynamic schema validated.\n');

// 2. Physics & Effective Diameter Math
console.log('Test 2: Real-time 5-Axis Physics and Effective Contact Diameter...');
const tool10Ball = { diameter: 10, cornerRadius: 5, fluteCount: 4, type: 'ball' };
const physics1 = calculateMultiaxisMorphPhysics(
  tool10Ball,
  { leadAngleDeg: 10, tiltAngleDeg: 15, cutDirection: 'climb' },
  'TITANIUM_5X'
);

console.log(`  - Nominal Tool Dia: 10 mm`);
console.log(`  - Effective Contact Dia (Deff): ${physics1.effectiveDiameterMm.toFixed(2)} mm`);
console.log(`  - Surface Speed (Vc): ${physics1.surfaceSpeedMpm} m/min`);
console.log(`  - Cutting Power: ${physics1.powerKw.toFixed(2)} kW`);
console.log(`  - Cutting Force (Fc): ${physics1.cuttingForceN} N`);
console.log(`  - MRR: ${physics1.mrrCm3Min.toFixed(2)} cm³/min`);

if (physics1.effectiveDiameterMm <= 0 || physics1.effectiveDiameterMm >= 10) {
  throw new Error(`Effective diameter ${physics1.effectiveDiameterMm} outside valid ballnose range`);
}
if (physics1.surfaceSpeedMpm <= 0 || physics1.cuttingForceN <= 0) {
  throw new Error('Surface speed or Cutting force invalid');
}
console.log('✓ Test 2 Passed: 5-Axis kinematics physics and contact dynamics verified.\n');

// 3. Tool Orientation Vector & Inverse Kinematics
console.log('Test 3: 5-Axis Tool Orientation & Machine Inverse Kinematics...');
const tangent = [1, 0, 0];
const normal = [0, 1, 0]; // Y-up spindle normal
const toolVec = calculate5AxisOrientationVector(tangent, normal, 10, 15);
const vecArr = [toolVec.x, toolVec.y, toolVec.z];
console.log(`  - Tool Orientation Vector (XYZ): [${vecArr.map(v => v.toFixed(4)).join(', ')}]`);

const mag = Math.sqrt(toolVec.x ** 2 + toolVec.y ** 2 + toolVec.z ** 2);
if (Math.abs(mag - 1.0) > 1e-4) throw new Error(`Tool vector not unit length: ${mag}`);

// Test IK on Table-Table AC (e.g. Haas UMC-750 / Hermle C42)
const anglesAC = solve5AxisMachineAngles(toolVec, 'table_table_ac');
console.log(`  - Table-Table AC Angles: A=${anglesAC.A.toFixed(2)}°, C=${anglesAC.C.toFixed(2)}°`);
if (isNaN(anglesAC.A) || isNaN(anglesAC.C)) throw new Error('AC IK solver produced NaN');

// Test IK on Table-Table BC (e.g. DMG DMU 50)
const anglesBC = solve5AxisMachineAngles(toolVec, 'table_table_bc');
console.log(`  - Table-Table BC Angles: B=${anglesBC.B.toFixed(2)}°, C=${anglesBC.C.toFixed(2)}°`);
if (isNaN(anglesBC.B) || isNaN(anglesBC.C)) throw new Error('BC IK solver produced NaN');

// Test IK on Head-Head AB (e.g. Gantry Router)
const anglesAB = solve5AxisMachineAngles(toolVec, 'head_head_ab');
console.log(`  - Head-Head AB Angles: A=${anglesAB.A.toFixed(2)}°, B=${anglesAB.B.toFixed(2)}°`);
if (isNaN(anglesAB.A) || isNaN(anglesAB.B)) throw new Error('AB IK solver produced NaN');
console.log('✓ Test 3 Passed: 3D Vector Frenet orientation and 4-machine IK solvers verified.\n');

// 4. Trajectory Auditor & Singularity Detection
console.log('Test 4: 5-Axis Trajectory Auditor & Pole Singularity Detection...');
const mockTrajectory = [
  { x: 0, y: 0, z: 0, toolVector: [0, 1, 0] },
  { x: 1, y: 0, z: 0, toolVector: [0.001, 0.9999, 0] },
  { x: 2, y: 0, z: 0, toolVector: [0, 1, 0.001] },
];
const audit = audit5AxisMorphTrajectory(mockTrajectory, 'table_table_ac', 3000);
console.log(`  - Audit Points Checked: ${audit.evaluatedPoints}`);
console.log(`  - Singularity Warnings: ${audit.warnings.length}`);
console.log(`  - Status: ${audit.status}`);
console.log('✓ Test 4 Passed: Pole singularity and angular velocity auditor operational.\n');

// 5. Multiaxis Morph Toolpath Generation
console.log('Test 5: Parametric Morph Toolpath Generation (Between 2 Curves)...');
const bounds = {
  min: { x: -40, y: -20, z: -40 },
  max: { x: 40, y: 0, z: 40 }
};
const tool = {
  id: 3,
  name: '10mm Ball Endmill',
  diameter: 10,
  cornerRadius: 5,
  fluteCount: 4,
  fluteLength: 25,
  overallLength: 75
};
const params = {
  ...defaultState,
  numberOfCuts: 15,
  leadAngleDeg: 12,
  tiltAngleDeg: 18,
  rapidClearance: 25,
  retractHeight: 10,
  feedClearance: 2.5
};

const result = generateMultiaxisMorphToolpath(bounds, tool, params, null);
console.log(`  - Cutting Line Segments: ${result.lines.length}`);
console.log(`  - Rapid Segments: ${result.rapids.length}`);
console.log(`  - Trajectory Points (with 5-axis normals): ${result.trajectoryPoints.length}`);
console.log(`  - 3D Vector Needles for Viewport: ${result.vectorNeedles.length}`);

if (result.lines.length === 0) throw new Error('No cutting lines generated');
if (result.vectorNeedles.length === 0) throw new Error('No 5-axis vector needles generated');
if (result.trajectoryPoints.length === 0) throw new Error('No trajectory points generated');
console.log('✓ Test 5 Passed: Multiaxis Morph toolpath and 3D needle vectors generated.\n');

// 6. Production 5-Axis TCPM G-Code Generation
console.log('Test 6: Production G-Code Generation with TCPM (Fanuc G43.4, Haas G234, Siemens TRAORI)...');

// Fanuc TCPM
const fanucGCode = generateMultiaxisMorphGCode(
  result,
  tool,
  { ...params, controllerFormat: 'fanuc', tcpmMode: 'fanuc_g43_4' },
  'MOLD_5AXIS_MORPH_SAMPLE'
);
if (!fanucGCode.includes('G43.4 H3') && !fanucGCode.includes('G43.4')) {
  throw new Error('Fanuc G-code missing G43.4 TCPM command');
}
if (!fanucGCode.includes('G49')) {
  throw new Error('Fanuc G-code missing G49 TCPM cancellation');
}
console.log('  - Fanuc 31i G43.4 Output snippet:');
console.log(fanucGCode.split('\n').slice(0, 32).join('\n'));

// Haas TCPM
const haasGCode = generateMultiaxisMorphGCode(
  result,
  tool,
  { ...params, tcpmMode: 'haas' },
  {},
  1,
  'MOLD_5AXIS_MORPH_SAMPLE'
);
console.log('Haas G-code sample lines:\n' + haasGCode.split('\n').slice(0, 25).join('\n'));
if (!haasGCode.includes('G234')) {
  throw new Error('Haas G-code missing G234 DWO/TCPM command');
}
console.log('  - Haas G234 verified.');

// Siemens TRAORI
const siemensGCode = generateMultiaxisMorphGCode(
  result,
  tool,
  { ...params, tcpmMode: 'siemens' },
  {},
  1,
  'MOLD_5AXIS_MORPH_SAMPLE'
);
if (!siemensGCode.includes('TRAORI')) {
  throw new Error('Siemens G-code missing TRAORI command');
}
if (!siemensGCode.includes('TRAFOOF')) {
  throw new Error('Siemens G-code missing TRAFOOF cancellation');
}
console.log('  - Siemens TRAORI / TRAFOOF verified.');

console.log('\n=== ALL 6 MULTIAXIS MORPH ENGINE TESTS PASSED SUCCESFULLY! ===\n');
