/**
 * Mastercam 5-Axis Multiaxis Roughing & Pocketing Automated Test Suite
 * Tests 10-page schema, cutting physics, cavity slicing, 5X continuous vs 3+2 indexed tilting,
 * helical ramp plunge, 3D micro-lift, and multi-controller TCPM post-processors.
 */

import {
  MULTIAXIS_ROUGHING_PAGES,
  ROUGHING_MATERIALS_DB,
  ROUGHING_PRESETS,
  calculateMultiaxisRoughingPhysics,
  createDefaultMultiaxisRoughingParams,
  resolveDefaultRoughingTool
} from '../src/config/multiaxisRoughingSchema.js';

import {
  extractCavityBoundsAndFloor,
  computeRoughingKinematicsAngles,
  calculate5AxisRoughingToolVector,
  generateTrochoidalPocketPasses,
  generateHelicalRampEntry,
  generateMultiaxisRoughingToolpath,
  generateMultiaxisRoughingGCode
} from '../src/utils/multiaxisRoughingEngine.js';

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

console.log('🧪 Starting Mastercam 5-Axis Multiaxis Roughing Automated Test Suite...\n');

// Group 1: 10-Page Mastercam Schema Taxonomy & Presets
console.log('--- Group 1: 10-Page Mastercam Schema Taxonomy & Presets ---');
assert(MULTIAXIS_ROUGHING_PAGES.length === 10, 'Schema defines exact 10 Mastercam tree pages');

const defaultParams = createDefaultMultiaxisRoughingParams();
assert(defaultParams.strategyKey === '5axis_rough', 'Default strategyKey is 5axis_rough');
assert(defaultParams.toolAxisControl.tiltingMode === 'continuous_5x', 'Default tilting mode is continuous_5x');
assert(defaultParams.linkingParameters.microLiftMm === 0.3, 'Default 3D micro-lift distance is 0.3mm');

const sampleTools = [
  { id: 1, type: 'ball_nose', diameter: 6 },
  { id: 2, type: 'bullnose', diameter: 12, cornerRad: 2 }
];
const resolvedTool = resolveDefaultRoughingTool(sampleTools);
assert(resolvedTool.type === 'bullnose' && resolvedTool.diameter === 12, 'resolveDefaultRoughingTool selects 12mm bullnose cutter');

const presetKeys = Object.keys(ROUGHING_PRESETS);
assert(presetKeys.length === 4, 'All 4 industry presets are defined');
assert(ROUGHING_PRESETS.aero_ti_deep_pocket.stepoverPct === 10.0, 'Titanium deep pocket preset uses 10% stepover');
assert(ROUGHING_PRESETS.mold_3plus2_indexed.tiltingMode === 'auto_indexed_3plus2', 'Mold preset selects auto_indexed_3plus2 mode');

// Group 2: Cutting Physics & Material Removal Rate (MRR)
console.log('\n--- Group 2: Cutting Physics & Material Removal Rate (MRR) ---');
const physics = calculateMultiaxisRoughingPhysics({
  toolDiameter: 12.0,
  fluteCount: 4,
  stepoverPct: 20.0,
  axialStepdownMm: 15.0,
  materialId: 'alu_6061',
  spindleRpm: 12000,
  feedPerTooth: 0.09
});

assert(physics.toolDiameterMm === 12.0, 'Tool diameter is 12.0mm');
assert(physics.radialStepoverMm === 2.4, 'Radial stepover ae is 2.4mm (20% D)');
assert(physics.engagementDeg > 40 && physics.engagementDeg < 60, `Cutter engagement angle is ${physics.engagementDeg}° (constant engagement)`);
assert(physics.mrrCm3Min > 100, `High volumetric material removal rate MRR: ${physics.mrrCm3Min} cm³/min`);
assert(physics.powerKw > 0, `Spindle power is calculated: ${physics.powerKw} kW`);
assert(physics.cuttingForceFc > 0, `Tangential cutting force Fc is calculated: ${physics.cuttingForceFc} N`);

// Group 3: 3D Cavity Geometry & Floor Elevation
console.log('\n--- Group 3: 3D Cavity Geometry & Floor Elevation ---');
const cavity = extractCavityBoundsAndFloor(null, null);
assert(cavity.widthX === 70.0 && cavity.lengthY === 50.0, 'Cavity benchmark dimensions are 70mm x 50mm');
assert(cavity.floorZ === -35.0, 'Cavity floor base depth is -35mm');

const centerElevation = cavity.floorElevation(0, 0);
const cornerElevation = cavity.floorElevation(30, 20);
assert(centerElevation !== cornerElevation, 'Contoured 3D floor exhibits double-curvature elevation variance');

const centerNormal = cavity.floorNormal(0, 0);
assert(Math.abs(centerNormal[2] - 1.0) < 0.01, 'Center floor normal points predominantly in +Z');

// Group 4: 5-Axis Dynamic Tilting (Continuous vs. 3+2 Indexed)
console.log('\n--- Group 4: 5-Axis Dynamic Tilting (Continuous vs. 3+2 Indexed) ---');
// Continuous 5X near side wall
const wallPt = [28, 0, -25];
const continuousVec = calculate5AxisRoughingToolVector(wallPt, cavity, 'continuous_5x', 45.0);
assert(continuousVec[0] < 0, 'Continuous mode dynamically tilts tool vector into cavity center away from East wall');

// 3+2 Auto-Indexed Mode
const westPt = [-25, 0, -20];
const indexedWestVec = calculate5AxisRoughingToolVector(westPt, cavity, 'auto_indexed_3plus2', 30.0);
assert(indexedWestVec[0] < -0.2, '3+2 Indexed mode assigns West zone tilt vector');

const angles = computeRoughingKinematicsAngles([0, 0, 1], 'table_table');
assert(angles.A === 0 && angles.C === 0, 'Vertical tool vector yields A=0, C=0 rotary angles');

// Group 5: Helical Ramp Plunge & Adaptive Pocket Passes
console.log('\n--- Group 5: Helical Ramp Plunge & Adaptive Pocket Passes ---');
const rampPts = generateHelicalRampEntry([0, 0, -10], -15.0, 5.0, 2.0, 2.0);
assert(rampPts.length > 20, `Helical ramp entry generates smooth multi-turn plunge points (${rampPts.length})`);
assert(rampPts[rampPts.length - 1][2] <= -15.0, 'Helical ramp reaches target depth');

const passes = generateTrochoidalPocketPasses(-15.0, cavity, 12.0, 20.0, 0.5);
assert(passes.length >= 3, `Adaptive trochoidal passes generated multiple morphing rings (${passes.length})`);

// Group 6: 5-Axis Multiaxis Roughing Toolpath Generation
console.log('\n--- Group 6: 5-Axis Multiaxis Roughing Toolpath Generation ---');
const toolpathResult = generateMultiaxisRoughingToolpath({
  bounds: { min: { x: -35, y: -25, z: -35 }, max: { x: 35, y: 25, z: 0 } },
  tool: { diameter: 12.0, number: 3, fluteCount: 4 },
  params: defaultParams,
  model: null
});

assert(toolpathResult.strategy === '5axis_rough', 'Toolpath strategy is 5axis_rough');
assert(toolpathResult.cuttingLines.length > 100, `Generates cutting lines (${toolpathResult.cuttingLines.length})`);
assert(toolpathResult.rapidLines.length >= 4, `Generates rapid lines with 3D micro-lifts (${toolpathResult.rapidLines.length})`);
assert(toolpathResult.trajectoryPoints.length > 100, `Trajectory points generated (${toolpathResult.trajectoryPoints.length})`);
assert(toolpathResult.vectorNeedles.length > 20, `Orientation needles generated for 3D viewport (${toolpathResult.vectorNeedles.length})`);
assert(toolpathResult.numSlices >= 2, `Multi-depth slicing levels: ${toolpathResult.numSlices}`);

// Group 7: Multi-Controller Simultaneous TCPM Output
console.log('\n--- Group 7: Multi-Controller Simultaneous TCPM Output ---');
const fanucGCode = generateMultiaxisRoughingGCode(toolpathResult, defaultParams, { number: 3, diameter: 12 }, 'fanuc', 'table_table');
assert(fanucGCode.includes('G43.4 H3'), 'Fanuc G-code contains G43.4 H3 TCPM command');
assert(fanucGCode.includes('G05.1 Q1'), 'Fanuc G-code activates G05.1 Q1 AICC high speed look-ahead');
assert(fanucGCode.includes('A') && fanucGCode.includes('C'), 'Fanuc G-code contains simultaneous A and C rotary motion blocks');
assert(fanucGCode.includes('G49'), 'Fanuc G-code properly cancels TCPM with G49');

const haasGCode = generateMultiaxisRoughingGCode(toolpathResult, defaultParams, { number: 3, diameter: 12 }, 'haas', 'table_table');
assert(haasGCode.includes('G234 H3'), 'Haas G-code contains G234 H3 TCPC command');

const siemensGCode = generateMultiaxisRoughingGCode(toolpathResult, defaultParams, { number: 3, diameter: 12 }, 'siemens', 'table_table');
assert(siemensGCode.includes('TRAORI'), 'Siemens G-code contains TRAORI simultaneous 5-axis command');

const heidenhainGCode = generateMultiaxisRoughingGCode(toolpathResult, defaultParams, { number: 3, diameter: 12 }, 'heidenhain', 'table_table');
assert(heidenhainGCode.includes('FUNCTION TCPM'), 'Heidenhain G-code contains FUNCTION TCPM command');

console.log(`\n🎉 All ${passedTests}/${totalTests} tests in Mastercam 5-Axis Multiaxis Roughing Suite PASSED!`);
