import assert from 'assert';
import * as THREE from 'three';
import {
  calculateScallopHeightFromStepover,
  calculateStepoverFromScallopHeight,
  computeRecommendedBlendParams
} from '../src/config/surfaceFinishSchema.js';
import {
  generateSurfaceBlendToolpath,
  generateToolpathForOperation
} from '../src/utils/toolpathEngine.js';
import { generateNCProgram, CONTROLLER_DIALECTS } from '../src/utils/postProcessor.js';

console.log('--- TESTING 3D SURFACE FINISH BLEND (DUAL-CURVE MORPHING) TOOLPATH & G-CODE GENERATION ---');

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
// Test 1: Math Reciprocity & Recommended Parameters
// ----------------------------------------------------
console.log('\n[Test 1] Testing Stepover <-> Cusp Height Math & Recommendations...');
const toolDia = 6.0;
const testH = 0.005; // 5 microns (0.005 mm)
const computedStep = calculateStepoverFromScallopHeight({ toolDiameter: toolDia, scallopHeight: testH, toolType: 'ball' });
const roundTripH = calculateScallopHeightFromStepover({ toolDiameter: toolDia, stepover: computedStep, toolType: 'ball' });

console.log(`  Target Cusp Height: ${testH} mm`);
console.log(`  Computed Stepover:  ${computedStep} mm`);
console.log(`  Round-trip Cusp:    ${roundTripH} mm`);
assert(Math.abs(roundTripH - testH) < 0.0005, 'Test 1 Failed: Scallop cusp round-trip mismatch!');

const rec = computeRecommendedBlendParams({ tool: ballTool, driveBounds: bounds });
console.log(`  Recommended Stepover: ${rec.stepover} mm, Cuts: ${rec.numberOfCuts}, Cusp: ${rec.scallopHeight} mm`);
assert(rec.stepover > 0 && rec.numberOfCuts >= 10, 'Test 1 Failed: Recommended params invalid!');
console.log('  ✓ Verified stepover/cusp math reciprocity and recommendation engine.');

// ----------------------------------------------------
// Test 2: Morphing Toolpath Along Curves (Zigzag)
// ----------------------------------------------------
console.log('\n[Test 2] Testing Morphing Toolpath Along Curves (Zigzag)...');
const alongToolpath = generateSurfaceBlendToolpath(bounds, ballTool, {
  rapidHeight: 25.0,
  feedPlane: 2.5,
  blendParams: {
    blendMethod: 'along',
    stepoverMode: 'cuts',
    numberOfCuts: 20,
    cuttingMethod: 'Zigzag',
    machiningDirection: 'climb'
  }
}, modelGroup);

console.log(`  ✓ Generated ${alongToolpath.cuttingLines.length} cutting segments and ${alongToolpath.rapidLines.length} rapid segments.`);
assert(alongToolpath.cuttingLines.length > 500, 'Test 2 Failed: Insufficient cutting segments in along mode!');
assert(alongToolpath.rapidLines.length >= 2, 'Test 2 Failed: Missing entry/exit rapids!');

// Check elevation span from raycasting
const yValues = alongToolpath.cuttingLines.flatMap(([p1, p2]) => [p1.y, p2.y]);
const minY = Math.min(...yValues);
const maxY = Math.max(...yValues);
console.log(`  ✓ Elevation span: Y_min=${minY.toFixed(3)}mm to Y_max=${maxY.toFixed(3)}mm (3D surface raycasting verified)`);
assert(minY < 0 && maxY >= -15.0, 'Test 2 Failed: 3D raycast depth out of bounds!');

// ----------------------------------------------------
// Test 3: Across Curves Transverse Morphing Passes
// ----------------------------------------------------
console.log('\n[Test 3] Testing Transverse Morphing Passes Across Curves...');
const acrossToolpath = generateSurfaceBlendToolpath(bounds, ballTool, {
  rapidHeight: 25.0,
  feedPlane: 2.5,
  blendParams: {
    blendMethod: 'across',
    stepoverMode: 'stepover',
    stepover: 1.0,
    cuttingMethod: 'Zigzag'
  }
}, modelGroup);

console.log(`  ✓ Across mode generated ${acrossToolpath.cuttingLines.length} cutting segments.`);
assert(acrossToolpath.cuttingLines.length > 300, 'Test 3 Failed: Across mode generated insufficient cuts!');
console.log('  ✓ Verified across-curves transverse toolpath generation.');

// ----------------------------------------------------
// Test 4: One-Way Mode Clearance Retracts
// ----------------------------------------------------
console.log('\n[Test 4] Testing One-Way Mode Clearance Retracts...');
const oneWayToolpath = generateSurfaceBlendToolpath(bounds, ballTool, {
  rapidHeight: 25.0,
  feedPlane: 2.5,
  blendParams: {
    blendMethod: 'along',
    stepoverMode: 'cuts',
    numberOfCuts: 10,
    cuttingMethod: 'One way'
  }
}, modelGroup);

console.log(`  One-Way Rapids: ${oneWayToolpath.rapidLines.length} | Zigzag Rapids: ${alongToolpath.rapidLines.length}`);
assert(oneWayToolpath.rapidLines.length > alongToolpath.rapidLines.length, 'Test 4 Failed: One-Way should have retract rapids per pass!');
console.log('  ✓ One-Way mode correctly enforces clearance retracts per morphing pass.');

// ----------------------------------------------------
// Test 5: Center-Out & Reverse Morphing Sequence
// ----------------------------------------------------
console.log('\n[Test 5] Testing Blend Directions (C1->C2, C2->C1, Center-Out)...');
const c2c1Toolpath = generateSurfaceBlendToolpath(bounds, ballTool, {
  rapidHeight: 25.0,
  feedPlane: 2.5,
  blendParams: {
    blendMethod: 'along',
    stepoverMode: 'cuts',
    numberOfCuts: 10,
    blendDirection: 'c2_to_c1'
  }
}, modelGroup);

const centerOutToolpath = generateSurfaceBlendToolpath(bounds, ballTool, {
  rapidHeight: 25.0,
  feedPlane: 2.5,
  blendParams: {
    blendMethod: 'along',
    stepoverMode: 'cuts',
    numberOfCuts: 10,
    blendDirection: 'center_out'
  }
}, modelGroup);

assert(c2c1Toolpath.cuttingLines.length > 0 && centerOutToolpath.cuttingLines.length > 0, 'Test 5 Failed: Directional toolpaths empty!');
console.log('  ✓ Blend directions (C2->C1 and Center-Out) successfully sequenced.');

// ----------------------------------------------------
// Test 6: Engine Dispatch & Fanuc Robodrill Post-Processor
// ----------------------------------------------------
console.log('\n[Test 6] Testing Engine Dispatch and Fanuc Robodrill NC Post-Processing...');
const mockOp = {
  id: 1,
  name: 'Surface Finish Blend 1',
  strategyKey: 'surface_finish_blend',
  badgeClass: 'blend',
  toolId: ballTool.id,
  toolNumber: ballTool.number,
  toolDiameter: ballTool.diameter,
  cornerRadius: ballTool.cornerRadius,
  feedRate: ballTool.feedRate,
  spindleSpeed: ballTool.rpm,
  rapidHeight: 25.0,
  feedPlane: 2.5,
  totalDepth: 20.0,
  stepdown: 0.45,
  cuttingMethod: 'zigzag',
  cuttingDirection: 'climb',
  blendParams: {
    blendMethod: 'along',
    stepoverMode: 'cuts',
    numberOfCuts: 20,
    stepover: 0.45,
    scallopHeight: 0.005,
    cuttingMethod: 'Zigzag',
    machiningDirection: 'climb'
  }
};

const dispatchResult = generateToolpathForOperation(mockOp, bounds, ballTool, modelGroup);
assert(dispatchResult && dispatchResult.cuttingLines && dispatchResult.cuttingLines.length > 0, 'Test 6 Failed: Dispatch returned empty toolpath!');
console.log(`  ✓ Dispatch generated ${dispatchResult.cuttingLines.length} cutting segments.`);

const opPoints = [];
dispatchResult.cuttingLines.forEach((seg) => {
  opPoints.push(seg[0], seg[1]);
});

const mockOpWithToolpath = {
  ...mockOp,
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
  programName: 'MOLD_BLEND_FINISH_SAMPLE',
  stockConfig: {
    wcsZZero: 'top',
    material: 'Alu 6061-T6'
  }
});

const gcodeText = ncResult.gcodeText;
assert(gcodeText && typeof gcodeText === 'string' && gcodeText.length > 0, 'Test 6 Failed: Post-processor failed to produce G-code!');
assert(gcodeText.includes('OPERATION 1: SURFACE FINISH BLEND'), 'Test 6 Failed: G-Code missing OPERATION 1: SURFACE FINISH BLEND header comment!');
assert(gcodeText.includes('T5 M06'), 'Test 6 Failed: Missing T5 M06 tool change block!');
assert(gcodeText.includes('G43 H5'), 'Test 6 Failed: Missing G43 H5 tool length compensation!');
assert(gcodeText.includes('M08') && gcodeText.includes('M09'), 'Test 6 Failed: Missing coolant M08/M09 commands!');
assert(gcodeText.includes('M30'), 'Test 6 Failed: Missing M30 program end command!');

console.log('  Preview G-Code (first 40 lines):');
gcodeText.split('\n').slice(0, 40).forEach((l) => console.log('    ' + l));

console.log('\n======================================================');
console.log('✅ ALL 6 SURFACE FINISH BLEND TESTS PASSED SUCCESSFULLY!');
console.log('======================================================');
