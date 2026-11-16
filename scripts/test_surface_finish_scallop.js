import assert from 'assert';
import * as THREE from 'three';
import {
  calculateScallopHeightFromStepover,
  calculateStepoverFromScallopHeight
} from '../src/config/surfaceFinishSchema.js';
import {
  generateSurfaceScallopToolpath,
  generateToolpathForOperation
} from '../src/utils/toolpathEngine.js';
import { generateNCProgram, CONTROLLER_DIALECTS } from '../src/utils/postProcessor.js';

console.log('--- TESTING 3D SURFACE FINISH SCALLOP (EQUAL SCALLOP) TOOLPATH & G-CODE GENERATION ---');

// Setup mock 3D geometry: a 60mm x 60mm mold workpiece with spherical dome
const bounds = new THREE.Box3(
  new THREE.Vector3(-30.0, -20.0, -30.0),
  new THREE.Vector3(30.0, 0.0, 30.0)
);

const ballTool = {
  id: 5,
  number: 5,
  name: '6mm 2-Flute Ball Nose',
  type: 'ball',
  diameter: 6.0,
  cornerRadius: 3.0,
  rpm: 8500,
  feedRate: 700,
  plungeRate: 250
};

// Create a synthetic 3D CAD mesh for surface raycast intersection
const geom = new THREE.SphereGeometry(35, 32, 16);
const mat = new THREE.MeshBasicMaterial();
const mesh = new THREE.Mesh(geom, mat);
mesh.position.set(0, -25, 0);
mesh.updateMatrixWorld(true);
const modelGroup = new THREE.Group();
modelGroup.add(mesh);
modelGroup.updateMatrixWorld(true);

// ----------------------------------------------------
// Test 1: Math Reciprocity between Stepover and Scallop Height
// ----------------------------------------------------
console.log('\n[Test 1] Testing Stepover <-> Scallop Height Mathematical Precision...');
const toolDia = 6.0;
const testH = 0.005; // 5 microns (0.005 mm)
const computedStep = calculateStepoverFromScallopHeight({ toolDiameter: toolDia, scallopHeight: testH, toolType: 'ball' });
const roundTripH = calculateScallopHeightFromStepover({ toolDiameter: toolDia, stepover: computedStep, toolType: 'ball' });

console.log(`  Target Scallop Height: ${testH} mm`);
console.log(`  Computed Stepover:     ${computedStep} mm`);
console.log(`  Round-trip Scallop:    ${roundTripH} mm`);
assert(Math.abs(roundTripH - testH) < 0.0005, 'Test 1 Failed: Scallop height round-trip mismatch!');
console.log('  ✓ Verified bidirectional stepover <-> cusp height formula reciprocity.');

// ----------------------------------------------------
// Test 2: Zigzag Scallop Passes with Contact Normal Raycasting
// ----------------------------------------------------
console.log('\n[Test 2] Testing Zigzag Scallop Passes on 3D Mold Surface...');
const zigzagParams = {
  rapidHeight: 25.0,
  feedPlane: 2.5,
  stockToLeaveZ: 0.0,
  totalDepth: 20.0,
  scallopParams: {
    stepoverMode: 'stepover',
    stepover: 0.5,
    scallopHeight: 0.01,
    stepDirection: 'outside_to_inside',
    cuttingMethod: 'Zigzag',
    machiningDirection: 'climb',
    maxGapDistance: 10.0
  }
};

const zigzagResult = generateSurfaceScallopToolpath(bounds, ballTool, zigzagParams, modelGroup);
assert(zigzagResult && zigzagResult.cuttingLines && zigzagResult.cuttingLines.length > 0, 'Test 2 Failed: No cutting lines generated!');
console.log(`  ✓ Generated ${zigzagResult.cuttingLines.length} cutting segments and ${zigzagResult.rapidLines.length} rapid segments.`);
console.log(`  ✓ Pass count (concentric collapse rings): ${zigzagResult.passCount}`);

// Verify that cutting lines have variable Z/Y elevations from raycasting
const sampledYValues = zigzagResult.cuttingLines.map((seg) => seg[0].y);
const minY = Math.min(...sampledYValues);
const maxY = Math.max(...sampledYValues);
console.log(`  ✓ Elevation span: Y_min=${minY.toFixed(3)}mm to Y_max=${maxY.toFixed(3)}mm (3D surface raycasting verified)`);
assert(maxY > minY, 'Test 2 Failed: Toolpath is flat instead of conforming to 3D surface elevation!');

// ----------------------------------------------------
// Test 3: One-Way Scallop Passes with Clearance Retracts
// ----------------------------------------------------
console.log('\n[Test 3] Testing One-Way Scallop Passes...');
const oneWayParams = {
  rapidHeight: 25.0,
  feedPlane: 2.5,
  stockToLeaveZ: 0.0,
  totalDepth: 20.0,
  scallopParams: {
    stepoverMode: 'stepover',
    stepover: 0.5,
    stepDirection: 'outside_to_inside',
    cuttingMethod: 'One way',
    maxGapDistance: 10.0
  }
};

const oneWayResult = generateSurfaceScallopToolpath(bounds, ballTool, oneWayParams, modelGroup);
console.log(`  One-Way Rapids: ${oneWayResult.rapidLines.length} | Zigzag Rapids: ${zigzagResult.rapidLines.length}`);
assert(oneWayResult.rapidLines.length > zigzagResult.rapidLines.length, 'Test 3 Failed: One-Way mode should have more rapid retracts between rings!');
console.log('  ✓ One-Way mode correctly enforces clearance retracts per collapse ring.');

// ----------------------------------------------------
// Test 4: Continuous 3D Archimedean Spiral Mode
// ----------------------------------------------------
console.log('\n[Test 4] Testing Continuous 3D Spiral Scallop Mode...');
const spiralParams = {
  rapidHeight: 25.0,
  feedPlane: 2.5,
  stockToLeaveZ: 0.0,
  totalDepth: 20.0,
  scallopParams: {
    stepoverMode: 'scallop_height',
    scallopHeight: 0.003,
    stepDirection: 'outside_to_inside',
    cuttingMethod: 'Spiral'
  }
};

const spiralResult = generateSurfaceScallopToolpath(bounds, ballTool, spiralParams, modelGroup);
assert(spiralResult && spiralResult.cuttingLines && spiralResult.cuttingLines.length > 500, 'Test 4 Failed: Spiral toolpath too short!');
console.log(`  ✓ Spiral mode generated ${spiralResult.cuttingLines.length} uninterrupted continuous spiral cutting segments.`);
console.log(`  ✓ Spiral rapids: ${spiralResult.rapidLines.length} (entry and exit only, no intermediate stepover witness marks).`);
assert(spiralResult.rapidLines.length <= 2, 'Test 4 Failed: Spiral should have only 1 entry and 1 exit rapid!');

// ----------------------------------------------------
// Test 5: Outside-to-Inside vs Inside-to-Outside Pass Ordering
// ----------------------------------------------------
console.log('\n[Test 5] Testing Step Direction (Outside -> In vs Inside -> Out)...');
const insideOutParams = {
  ...zigzagParams,
  scallopParams: {
    ...zigzagParams.scallopParams,
    stepDirection: 'inside_to_outside'
  }
};
const insideOutResult = generateSurfaceScallopToolpath(bounds, ballTool, insideOutParams, modelGroup);
const outsideFirstPt = zigzagResult.cuttingLines[0][0];
const insideFirstPt = insideOutResult.cuttingLines[0][0];
const distOutsideFromCenter = Math.hypot(outsideFirstPt.x, outsideFirstPt.z);
const distInsideFromCenter = Math.hypot(insideFirstPt.x, insideFirstPt.z);

console.log(`  Outside->In First Cut Dist from Center: ${distOutsideFromCenter.toFixed(2)}mm`);
console.log(`  Inside->Out First Cut Dist from Center: ${distInsideFromCenter.toFixed(2)}mm`);
assert(distOutsideFromCenter > distInsideFromCenter, 'Test 5 Failed: Outside->In should start farther from center than Inside->Out!');
console.log('  ✓ Step direction correctly controls inward vs outward expansion order.');

// ----------------------------------------------------
// Test 6: Engine Dispatch & Fanuc G-Code Post-Processing
// ----------------------------------------------------
console.log('\n[Test 6] Testing Engine Dispatch and Fanuc Robodrill NC Post-Processing...');
const scallopOp = {
  id: 1,
  name: 'Surface Finish Scallop 1',
  strategyKey: 'surface_finish_scallop',
  badgeClass: 'scallop',
  toolId: 5,
  toolNumber: 5,
  toolDiameter: 6.0,
  toolType: 'ball',
  bounds,
  rapidHeight: 25.0,
  stepdown: 0.5,
  stepover: 0.5,
  spindleRpm: 8488,
  cuttingFeed: 679,
  plungeFeed: 250,
  surfaceParams: {
    clearance: 25.0,
    retract: 5.0,
    feedPlane: 2.5,
    stockToLeaveDrive: 0.0,
    feedRate: 679,
    plungeRate: 250
  },
  scallopParams: {
    stepoverMode: 'stepover',
    stepover: 0.5,
    scallopHeight: 0.005,
    stepDirection: 'outside_to_inside',
    cuttingMethod: 'Zigzag',
    machiningDirection: 'climb',
    maxGapDistance: 10.0
  }
};

const dispatchResult = generateToolpathForOperation(scallopOp, bounds, ballTool, modelGroup);
assert(dispatchResult && dispatchResult.cuttingLines.length > 0, 'Test 6 Failed: generateToolpathForOperation failed to dispatch!');
console.log(`  ✓ Dispatch generated ${dispatchResult.cuttingLines.length} cutting segments.`);

// Convert cutting lines to points for post-processor
const opPoints = [];
dispatchResult.cuttingLines.forEach((seg) => {
  opPoints.push(seg[0], seg[1]);
});

const mockOpWithToolpath = {
  ...scallopOp,
  points: opPoints
};

const ncResult = generateNCProgram({
  operations: [mockOpWithToolpath],
  tools: [ballTool],
  controller: CONTROLLER_DIALECTS.FANUC,
  partMetrics: {
    bounds,
    partBox: bounds,
    stockBox: bounds
  },
  programNumber: 1001,
  programName: 'MOLD_SCALLOP_FINISH_SAMPLE',
  stockConfig: {
    wcsZZero: 'top',
    material: 'Alu 6061-T6'
  }
});

const gcodeText = ncResult.gcodeText;
assert(gcodeText && typeof gcodeText === 'string' && gcodeText.length > 0, 'Test 6 Failed: Post-processor failed to produce G-code!');
console.log('  Preview G-Code (first 40 lines):');
const lines = gcodeText.split('\n');
lines.slice(0, 40).forEach((l) => console.log('    ' + l));

// Assertions on G-code content
assert(gcodeText.includes('G90 G21 G17 G54 G94'), 'Missing G90 G21 header');
assert(gcodeText.includes('T5 M06'), 'Missing T5 M06 tool change');
assert(gcodeText.includes('G43 H5'), 'Missing G43 H5 tool length compensation');
assert(gcodeText.includes('SURFACE FINISH SCALLOP'), 'Missing operation banner');
assert(gcodeText.includes('G01'), 'Missing G01 cutting feeds');

console.log('\n======================================================');
console.log('✅ ALL 6 SURFACE FINISH SCALLOP TESTS PASSED SUCCESSFULLY!');
console.log('======================================================');
