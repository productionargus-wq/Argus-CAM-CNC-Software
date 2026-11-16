import * as THREE from 'three';
import { generateSurfaceLeftoverToolpath, generateToolpathForOperation } from '../src/utils/toolpathEngine.js';
import { generateNCProgram, CONTROLLER_DIALECTS } from '../src/utils/postProcessor.js';

console.log('--- TESTING SURFACE FINISH LEFTOVER (REST MILLING) TOOLPATH & G-CODE GENERATION ---');

// 1. Build a synthetic 3D cavity mold mesh for leftover test
const cavityGeometry = new THREE.BoxGeometry(60, 20, 60);
const cavityMesh = new THREE.Mesh(cavityGeometry, new THREE.MeshBasicMaterial());
cavityMesh.position.set(0, -10, 0);
cavityMesh.updateMatrixWorld(true);

const modelGroup = new THREE.Group();
modelGroup.add(cavityMesh);
modelGroup.updateMatrixWorld(true);

const bounds = new THREE.Box3().setFromObject(modelGroup);
console.log(`Mold cavity bounds: X [${bounds.min.x.toFixed(1)}, ${bounds.max.x.toFixed(1)}], Y [${bounds.min.y.toFixed(1)}, ${bounds.max.y.toFixed(1)}], Z [${bounds.min.z.toFixed(1)}, ${bounds.max.z.toFixed(1)}]`);

const finishingTool = {
  id: 5,
  number: 5,
  name: '6mm 2-Flute Ball Nose',
  type: 'ball',
  diameter: 6.0,
  cornerRadius: 3.0,
  rpm: 8488,
  feedRate: 679
};

// 2. Test 1: Longitudinal ('Along Surface') Leftover Passes
console.log('\n[Test 1] Testing Along Surface (Longitudinal) Leftover Toolpath...');
const alongParams = {
  rapidHeight: 25.0,
  feedPlane: 2.5,
  stockToLeaveZ: 0.0,
  leftoverParams: {
    refToolDiameter: 16.0,
    refToolCornerRadius: 2.0,
    machiningMethod: 'along',
    stepover: 0.4,
    numberOfPasses: 3,
    overlap: 1.0,
    cuttingMethod: 'Zigzag',
    maxGapDistance: 10.0
  }
};

const alongResult = generateSurfaceLeftoverToolpath(bounds, finishingTool, alongParams, modelGroup);
if (!alongResult || !alongResult.cuttingLines || alongResult.cuttingLines.length === 0) {
  throw new Error('Test 1 Failed: generateSurfaceLeftoverToolpath produced 0 cutting lines for along mode!');
}
console.log(`  ✓ Generated ${alongResult.cuttingLines.length} cutting segments and ${alongResult.rapidLines.length} rapid segments.`);

// 3. Test 2: Transverse ('Across Surface') Leftover Passes
console.log('\n[Test 2] Testing Across Surface (Transverse Ribs) Leftover Toolpath...');
const acrossParams = {
  rapidHeight: 25.0,
  feedPlane: 2.5,
  stockToLeaveZ: 0.0,
  leftoverParams: {
    refToolDiameter: 12.0,
    refToolCornerRadius: 6.0,
    machiningMethod: 'across',
    stepover: 1.0,
    numberOfPasses: 3,
    overlap: 1.5,
    cuttingMethod: 'Zigzag',
    maxGapDistance: 10.0
  }
};

const acrossResult = generateSurfaceLeftoverToolpath(bounds, finishingTool, acrossParams, modelGroup);
if (!acrossResult || !acrossResult.cuttingLines || acrossResult.cuttingLines.length === 0) {
  throw new Error('Test 2 Failed: generateSurfaceLeftoverToolpath produced 0 cutting lines for across mode!');
}
console.log(`  ✓ Generated ${acrossResult.cuttingLines.length} cutting segments and ${acrossResult.rapidLines.length} rapid segments.`);

// 4. Test 3: Overlap Extension Verification
console.log('\n[Test 3] Testing Overlap Extension in Leftover Zone...');
const zeroOverlapParams = {
  ...alongParams,
  leftoverParams: { ...alongParams.leftoverParams, overlap: 0.0 }
};
const withOverlapParams = {
  ...alongParams,
  leftoverParams: { ...alongParams.leftoverParams, overlap: 2.0 }
};
const resZero = generateSurfaceLeftoverToolpath(bounds, finishingTool, zeroOverlapParams, modelGroup);
const resWith = generateSurfaceLeftoverToolpath(bounds, finishingTool, withOverlapParams, modelGroup);

// Extract bounding dimensions of cut paths
let minZeroX = Infinity, maxZeroX = -Infinity;
resZero.cuttingLines.forEach(([p1, p2]) => {
  minZeroX = Math.min(minZeroX, p1.x, p2.x);
  maxZeroX = Math.max(maxZeroX, p1.x, p2.x);
});
let minWithX = Infinity, maxWithX = -Infinity;
resWith.cuttingLines.forEach(([p1, p2]) => {
  minWithX = Math.min(minWithX, p1.x, p2.x);
  maxWithX = Math.max(maxWithX, p1.x, p2.x);
});
const spanZero = maxZeroX - minZeroX;
const spanWith = maxWithX - minWithX;
console.log(`  Span with 0mm overlap: ${spanZero.toFixed(2)} mm | Span with 2mm overlap: ${spanWith.toFixed(2)} mm`);
if (spanWith < spanZero) {
  throw new Error('Test 3 Failed: Overlap extension should produce equal or wider cutting coverage!');
}
console.log('  ✓ Overlap extension correctly expands cutting passes.');

// 5. Test 4: One-Way Mode Retract Count vs Zigzag
console.log('\n[Test 4] Testing One-Way Mode Retract Count vs Zigzag...');
const oneWayParams = {
  ...acrossParams,
  leftoverParams: { ...acrossParams.leftoverParams, cuttingMethod: 'One way' }
};
const oneWayResult = generateSurfaceLeftoverToolpath(bounds, finishingTool, oneWayParams, modelGroup);
console.log(`  Zigzag rapids: ${acrossResult.rapidLines.length} | One-way rapids: ${oneWayResult.rapidLines.length}`);
if (oneWayResult.rapidLines.length < acrossResult.rapidLines.length) {
  throw new Error('Test 4 Failed: One-way mode should generate more retract rapids than Zigzag!');
}
console.log('  ✓ One-way mode generates appropriate clearance retracts.');

// 6. Test 5: Toolpath Engine Operation Dispatch
console.log('\n[Test 5] Testing Engine Dispatch via generateToolpathForOperation...');
const leftoverOp = {
  id: 1,
  name: 'Surface Finish Leftover 1',
  strategyKey: 'surface_finish_leftover',
  badgeClass: 'leftover',
  badgeText: 'LO',
  toolId: finishingTool.id,
  toolNumber: finishingTool.number,
  toolName: finishingTool.name,
  toolType: finishingTool.type,
  toolDiameter: finishingTool.diameter,
  cornerRadius: finishingTool.cornerRadius,
  feedRate: finishingTool.feedRate,
  spindleSpeed: finishingTool.rpm,
  rapidHeight: 25.0,
  feedPlane: 2.5,
  stockToLeaveZ: 0.0,
  leftoverParams: {
    refToolDiameter: 16.0,
    refToolCornerRadius: 2.0,
    machiningMethod: 'along',
    stepover: 0.4,
    numberOfPasses: 3,
    overlap: 1.0,
    cuttingMethod: 'Zigzag'
  }
};

const dispatchResult = generateToolpathForOperation(leftoverOp, bounds, finishingTool, modelGroup);
if (!dispatchResult || !dispatchResult.cuttingLines || dispatchResult.cuttingLines.length === 0) {
  throw new Error('Test 5 Failed: generateToolpathForOperation failed to dispatch surface_finish_leftover!');
}
console.log(`  ✓ Dispatch generated ${dispatchResult.cuttingLines.length} cutting moves.`);

// 7. Test 6: Fanuc Robodrill G-Code Post-Processing
console.log('\n[Test 6] Testing Fanuc Robodrill G-Code Post-Processing...');
leftoverOp.toolpath = dispatchResult;

const partMetrics = {
  partBox: bounds,
  stockBox: new THREE.Box3(
    new THREE.Vector3(bounds.min.x - 5, bounds.min.y - 5, bounds.min.z - 5),
    new THREE.Vector3(bounds.max.x + 5, bounds.max.y + 5, bounds.max.z + 5)
  )
};

const gcodeResult = generateNCProgram({
  operations: [leftoverOp],
  tools: [finishingTool],
  controller: CONTROLLER_DIALECTS.FANUC,
  partMetrics,
  programNumber: 1001,
  programName: 'MOLD_LEFTOVER_FINISH_SAMPLE',
  stockConfig: {
    wcsZZero: 'top',
    material: 'Alu 6061-T6'
  }
});

const gcodeText = gcodeResult.gcodeText;
if (!gcodeText || typeof gcodeText !== 'string' || gcodeText.length === 0) {
  throw new Error('Test 6 Failed: Post-processor failed to produce G-code!');
}

console.log('  Preview G-Code (first 40 lines):');
const lines = gcodeText.split('\n');
lines.slice(0, 40).forEach((l) => console.log('    ' + l));

// Assertions on G-code content
const hasG90 = gcodeText.includes('G90 G21 G17 G54 G94');
const hasToolCall = gcodeText.includes('T5 M06') || gcodeText.includes('T05 M06');
const hasSpindle = gcodeText.includes('S8488 M03');
const hasG43 = gcodeText.includes('G43 H5') || gcodeText.includes('G43 H05');
const hasG01 = gcodeText.includes('G01');
const hasZRetract = gcodeText.includes('G00') && gcodeText.includes('Z');

if (!hasG90) throw new Error('Test 6 Failed: G-code missing standard safety block G90 G21 G17 G54 G94!');
if (!hasToolCall) throw new Error('Test 6 Failed: G-code missing T5 M06 tool change block!');
if (!hasSpindle) throw new Error('Test 6 Failed: G-code missing S8488 M03 spindle start block!');
if (!hasG43) throw new Error('Test 6 Failed: G-code missing G43 H5 length offset block!');
if (!hasG01) throw new Error('Test 6 Failed: G-code missing G01 linear cutting feed moves!');
if (!hasZRetract) throw new Error('Test 6 Failed: G-code missing rapid clearance retracts!');

console.log('\n✅ ALL 6 SURFACE FINISH LEFTOVER TESTS PASSED SUCCESSFULLY!');
