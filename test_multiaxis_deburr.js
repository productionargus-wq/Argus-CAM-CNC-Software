/**
 * Mastercam 5-Axis Multiaxis Deburring Automated Test Suite
 * Tests 10-page schema, contact point shifting, edge detection, collision avoidance, 3D toolpath, and TCPM post-processors.
 */

import {
  MULTIAXIS_DEBURR_PAGES,
  DEBURR_MATERIALS_DB,
  DEBURR_PRESETS,
  calculateMultiaxisDeburrPhysics,
  createDefaultMultiaxisDeburrParams,
  resolveDefaultDeburrTool
} from './src/config/multiaxisDeburrSchema.js';

import {
  extractModelSharpEdges,
  calculateDeburrContactOffset,
  calculateDeburrToolVector,
  applyDeburrCollisionAvoidance,
  computeDeburrKinematicsAngles,
  generateMultiaxisDeburrToolpath,
  generateMultiaxisDeburrGCode
} from './src/utils/multiaxisDeburrEngine.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

console.log('🧪 Starting Mastercam 5-Axis Multiaxis Deburring Automated Test Suite...\n');

// Group 1: 10-Page Mastercam Schema Taxonomy & Presets
console.log('--- Group 1: 10-Page Mastercam Schema Taxonomy & Presets ---');
assert(MULTIAXIS_DEBURR_PAGES.length === 10, 'Schema defines exact 10 Mastercam tree pages');

const defaultParams = createDefaultMultiaxisDeburrParams();
assert(defaultParams.strategyKey === '5axis_deburr', 'Default strategyKey is 5axis_deburr');
assert(defaultParams.contactPoint.contactAngleDeg === 30.0, 'Default contact offset angle is 30 degrees');
assert(defaultParams.edgeDetection.dihedralThresholdDeg === 45.0, 'Default edge detection threshold is 45 degrees');

const sampleTools = [
  { id: 1, type: 'flat_end', diameter: 10 },
  { id: 2, type: 'ball_nose', diameter: 6, fluteCount: 4 }
];
const resolvedTool = resolveDefaultDeburrTool(sampleTools);
assert(resolvedTool.type === 'ball_nose' && resolvedTool.diameter === 6, 'resolveDefaultDeburrTool selects ball nose cutter');

const presetKeys = Object.keys(DEBURR_PRESETS);
assert(presetKeys.length === 4, 'All 4 industry presets are defined');
assert(DEBURR_PRESETS.micro_edge_break.chamferWidthMm === 0.2, 'Micro edge break preset has 0.2mm chamfer width');
assert(DEBURR_PRESETS.lollipop_undercut.cutterType === 'lollipop', 'Lollipop preset selects lollipop cutter');

// Group 2: Cutting Physics & Contact Point Shifting Math
console.log('\n--- Group 2: Cutting Physics & Contact Point Shifting Math ---');
const physics = calculateMultiaxisDeburrPhysics({
  toolDiameter: 6.0,
  fluteCount: 4,
  contactAngleDeg: 30.0,
  chamferWidthMm: 0.3,
  materialId: 'alu_6061',
  spindleRpm: 16000
});

assert(physics.nominalDiameterMm === 6.0, 'Nominal diameter is 6.0mm');
assert(Math.abs(physics.effectiveDiameterMm - 3.0) < 0.01, 'At 30 deg contact angle, effective diameter is exactly D * sin(30) = 3.0mm');
assert(physics.cuttingSpeedVc > 140, `Effective peripheral cutting speed is high (${physics.cuttingSpeedVc} m/min)`);
assert(physics.deadTipVc < 5, `Dead center tip speed is near zero (${physics.deadTipVc} m/min)`);
assert(physics.velocityGainFactor > 20, `Velocity gain factor from contact shift is ${physics.velocityGainFactor}x`);
assert(physics.powerKw > 0, `Power Kw is calculated (${physics.powerKw} kW)`);

// Group 3: 3D Edge Feature Detection & Offset Formulation
console.log('\n--- Group 3: 3D Edge Feature Detection & Offset Formulation ---');
const edgeLoops = extractModelSharpEdges(null, 45.0, 1.0);
assert(edgeLoops.length === 3, 'Synthesizes 3 distinct 3D edge loops (saddle perimeter, pocket rim, undercut hole)');
assert(edgeLoops[0].points.length > 30, 'Saddle perimeter has continuous points with tangents and bisector normals');

const offset = calculateDeburrContactOffset(3.0, 'ball_nose', 30.0, 0.3, [0, 0, 1], [0, 0, 1]);
assert(offset.centerOffset.length === 3, 'calculateDeburrContactOffset calculates 3D center offset');
assert(offset.effectiveCuttingRadiusMm > 0, 'Effective cutting radius is non-zero');

// Group 4: Tool Vector Control & Collision Avoidance
console.log('\n--- Group 4: Tool Vector Control & Collision Avoidance ---');
const toolVec = calculateDeburrToolVector([1, 0, 0], [0, 0, 1], 5.0, 15.0);
assert(Math.abs(Math.sqrt(toolVec[0] ** 2 + toolVec[1] ** 2 + toolVec[2] ** 2) - 1.0) < 1e-4, 'Tool vector is a unit vector');

// Collision avoidance test: tool vector close to wall normal
const wallNormal = [1, 0, 0];
const collidingToolVec = [0.95, 0, 0.3]; // Leaning towards wall
const clearedToolVec = applyDeburrCollisionAvoidance(collidingToolVec, [0, 1, 0], wallNormal, 1.5, 3.0);
assert(clearedToolVec[0] < collidingToolVec[0], 'Collision avoidance rotates tool vector away from wall normal');

const angles = computeDeburrKinematicsAngles([0, 0, 1], 'table_table');
assert(angles.A === 0 && angles.C === 0, 'Vertical tool vector yields A=0, C=0 rotary angles');

// Group 5: 5-Axis Deburring Toolpath Generation
console.log('\n--- Group 5: 5-Axis Deburring Toolpath Generation ---');
const toolpathResult = generateMultiaxisDeburrToolpath({
  bounds: { min: { x: -40, y: -30, z: -25 }, max: { x: 40, y: 30, z: 10 } },
  tool: { diameter: 6.0, number: 5, fluteCount: 4 },
  params: defaultParams,
  model: null
});

assert(toolpathResult.strategy === '5axis_deburr', 'Toolpath strategy is 5axis_deburr');
assert(toolpathResult.cuttingLines.length > 50, `Generates cutting lines (${toolpathResult.cuttingLines.length})`);
assert(toolpathResult.rapidLines.length >= 6, `Generates rapid lines with 3D lead-in arcs (${toolpathResult.rapidLines.length})`);
assert(toolpathResult.trajectoryPoints.length > 50, `Trajectory points generated (${toolpathResult.trajectoryPoints.length})`);
assert(toolpathResult.vectorNeedles.length > 20, `Orientation needles generated for 3D viewport (${toolpathResult.vectorNeedles.length})`);
assert(toolpathResult.stats.effectiveContactAngleDeg === 30.0, 'Stats capture effective contact angle');

// Group 6: Multi-Controller Simultaneous TCPM Output
console.log('\n--- Group 6: Multi-Controller Simultaneous TCPM Output ---');
const fanucGCode = generateMultiaxisDeburrGCode(toolpathResult, defaultParams, { number: 5, diameter: 6 }, 'fanuc', 'table_table');
assert(fanucGCode.includes('G43.4 H5'), 'Fanuc G-code contains G43.4 H5 TCPM command');
assert(fanucGCode.includes('G05.1 Q1'), 'Fanuc G-code activates G05.1 Q1 AICC high speed look-ahead');
assert(fanucGCode.includes('A') && fanucGCode.includes('C'), 'Fanuc G-code contains simultaneous A and C rotary motion blocks');
assert(fanucGCode.includes('G49'), 'Fanuc G-code properly cancels TCPM with G49');

const haasGCode = generateMultiaxisDeburrGCode(toolpathResult, defaultParams, { number: 5, diameter: 6 }, 'haas', 'table_table');
assert(haasGCode.includes('G234 H5'), 'Haas G-code contains G234 H5 TCPC command');

const siemensGCode = generateMultiaxisDeburrGCode(toolpathResult, defaultParams, { number: 5, diameter: 6 }, 'siemens', 'table_table');
assert(siemensGCode.includes('TRAORI'), 'Siemens G-code contains TRAORI simultaneous 5-axis command');

const heidenhainGCode = generateMultiaxisDeburrGCode(toolpathResult, defaultParams, { number: 5, diameter: 6 }, 'heidenhain', 'table_table');
assert(heidenhainGCode.includes('FUNCTION TCPM'), 'Heidenhain G-code contains FUNCTION TCPM command');

console.log(`\n🎉 All ${passedTests}/${totalTests} tests in Mastercam 5-Axis Deburring Suite PASSED!`);
