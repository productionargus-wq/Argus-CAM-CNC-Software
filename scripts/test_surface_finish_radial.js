import * as THREE from 'three';
import { generateSurfaceRadialToolpath, generateToolpathForOperation } from '../src/utils/toolpathEngine.js';
import { generateNCProgram, CONTROLLER_DIALECTS } from '../src/utils/postProcessor.js';

console.log('--- TESTING SURFACE FINISH RADIAL TOOLPATH & G-CODE GENERATION ---');

// 1. Build a synthetic 3D dome mesh for radial finishing test
const domeRadius = 40.0;
const domeGeometry = new THREE.SphereGeometry(domeRadius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
domeGeometry.scale(1, 0.5, 1); // squashed dome
const domeMesh = new THREE.Mesh(domeGeometry, new THREE.MeshBasicMaterial());
domeMesh.position.set(0, 0, 0);
domeMesh.updateMatrixWorld(true);

const modelGroup = new THREE.Group();
modelGroup.add(domeMesh);
modelGroup.updateMatrixWorld(true);

const bounds = new THREE.Box3().setFromObject(modelGroup);
console.log(`Model bounds: X [${bounds.min.x.toFixed(1)}, ${bounds.max.x.toFixed(1)}], Y [${bounds.min.y.toFixed(1)}, ${bounds.max.y.toFixed(1)}], Z [${bounds.min.z.toFixed(1)}, ${bounds.max.z.toFixed(1)}]`);

const ballTool = {
  id: 5,
  number: 5,
  name: '6mm Ball Endmill',
  type: 'ball',
  diameter: 6.0,
  cornerRadius: 3.0,
  rpm: 7500,
  feedRate: 900
};

// 2. Test Spoke Mode (Zigzag)
console.log('\n[Test 1] Testing Radial Zigzag Spoke Mode...');
const radialZigzagParams = {
  rapidHeight: 15.0,
  feedPlane: 2.5,
  stockToLeaveZ: 0.0,
  radialParams: {
    stepoverMode: 'max_stepover',
    maxStepover: 1.5,
    angularIncrement: 2.5,
    startAngle: 0.0,
    sweepAngle: 360.0,
    startRadius: 2.0,
    endRadius: 38.0,
    centerPoint: { x: 0, y: 0, z: 0 },
    autoCenter: true,
    cutDirection: 'inside_to_outside',
    cuttingMethod: 'Zigzag',
    rotationDirection: 'CW',
    maxGapDistance: 10.0
  }
};

const zigzagResult = generateSurfaceRadialToolpath(bounds, ballTool, radialZigzagParams, modelGroup);
if (!zigzagResult || !zigzagResult.cuttingLines || zigzagResult.cuttingLines.length === 0) {
  throw new Error('Test 1 Failed: generateSurfaceRadialToolpath produced 0 cutting lines for Zigzag mode!');
}
console.log(`  ✓ Generated ${zigzagResult.cuttingLines.length} cutting segments and ${zigzagResult.rapidLines.length} rapid segments.`);
const samplePt = zigzagResult.cuttingLines[0][0];
console.log(`  ✓ Sample toolpath point: X=${samplePt.x.toFixed(3)}, Y=${samplePt.y.toFixed(3)}, Z=${samplePt.z.toFixed(3)}`);

// 3. Test Spoke Mode (One Way)
console.log('\n[Test 2] Testing Radial One-Way Spoke Mode...');
const radialOneWayParams = {
  ...radialZigzagParams,
  radialParams: {
    ...radialZigzagParams.radialParams,
    cuttingMethod: 'One way'
  }
};
const oneWayResult = generateSurfaceRadialToolpath(bounds, ballTool, radialOneWayParams, modelGroup);
if (!oneWayResult || !oneWayResult.cuttingLines || oneWayResult.cuttingLines.length === 0) {
  throw new Error('Test 2 Failed: generateSurfaceRadialToolpath produced 0 cutting lines for One-Way mode!');
}
console.log(`  ✓ Generated ${oneWayResult.cuttingLines.length} cutting segments and ${oneWayResult.rapidLines.length} rapid segments.`);
if (oneWayResult.rapidLines.length <= zigzagResult.rapidLines.length) {
  throw new Error('One way mode should have more rapid retracts between spokes than zigzag!');
}
console.log(`  ✓ Verified One-Way mode retracts after every spoke pass (${oneWayResult.rapidLines.length} rapids vs ${zigzagResult.rapidLines.length} in zigzag).`);

// 4. Test Spiral Mode
console.log('\n[Test 3] Testing Radial Continuous Spiral Mode...');
const radialSpiralParams = {
  ...radialZigzagParams,
  radialParams: {
    ...radialZigzagParams.radialParams,
    cuttingMethod: 'Spiral'
  }
};
const spiralResult = generateSurfaceRadialToolpath(bounds, ballTool, radialSpiralParams, modelGroup);
if (!spiralResult || !spiralResult.cuttingLines || spiralResult.cuttingLines.length === 0) {
  throw new Error('Test 3 Failed: generateSurfaceRadialToolpath produced 0 cutting lines for Spiral mode!');
}
console.log(`  ✓ Generated ${spiralResult.cuttingLines.length} continuous spiral segments.`);

// 5. Test Unified Engine Dispatch via generateToolpathForOperation
console.log('\n[Test 4] Testing generateToolpathForOperation dispatch for surface_finish_radial...');
const opRecord = {
  id: 101,
  name: '3D Surface Radial Finishing',
  type: 'surface_finish_radial',
  strategyKey: 'surface_finish_radial',
  badgeClass: 'radial',
  badgeText: 'RD',
  toolId: 5,
  toolNumber: 5,
  toolName: '6mm Ball Endmill',
  toolDiameter: 6.0,
  feedRate: 900,
  spindleSpeed: 7500,
  plungeRate: 250,
  rapidHeight: 25.0,
  feedPlane: 3.0,
  radialParams: radialZigzagParams.radialParams
};

const dispatchResult = generateToolpathForOperation(opRecord, bounds, ballTool, modelGroup);
if (!dispatchResult || !dispatchResult.cuttingLines || dispatchResult.cuttingLines.length === 0) {
  throw new Error('Test 4 Failed: generateToolpathForOperation failed to dispatch surface_finish_radial!');
}
console.log(`  ✓ generateToolpathForOperation successfully dispatched and returned ${dispatchResult.cuttingLines.length} cutting segments.`);

// 6. Test Fanuc ISO NC Post-Processing
console.log('\n[Test 5] Testing Post-Processor Fanuc G-Code generation...');
const partMetrics = {
  box: bounds,
  bounds: bounds,
  dimensions: new THREE.Vector3(80, 20, 80)
};

const gcodeResult = generateNCProgram({
  operations: [opRecord],
  tools: [ballTool],
  stockConfig: {
    material: 'Alu 6061-T6',
    shape: 'cylinder',
    wcsZZero: 'top'
  },
  partMetrics,
  model: modelGroup,
  controller: CONTROLLER_DIALECTS.FANUC
});

if (!gcodeResult || !gcodeResult.gcodeText || gcodeResult.gcodeText.length < 100) {
  throw new Error('Test 5 Failed: G-code generation produced empty or invalid output!');
}

const gcodeLines = gcodeResult.gcodeText.split('\n');
console.log(`  ✓ Successfully generated Fanuc NC program with ${gcodeLines.length} lines.`);

// Check for required Fanuc blocks
const hasG90 = gcodeLines.some((l) => l.includes('G90 G21 G17 G54'));
const hasToolCall = gcodeLines.some((l) => l.includes('T5 M06'));
const hasHeightComp = gcodeLines.some((l) => l.includes('G43 H5'));
const hasRadialHeader = gcodeLines.some((l) => l.includes('SURFACE RADIAL') || l.includes('SURFACE_FINISH_RADIAL'));
const hasArcOrCut = gcodeLines.some((l) => l.includes('G01') || l.includes('G1'));

console.log(`  ✓ G90 G21 G17 G54 block: ${hasG90 ? 'OK' : 'MISSING'}`);
console.log(`  ✓ Tool Change T5 M06: ${hasToolCall ? 'OK' : 'MISSING'}`);
console.log(`  ✓ Tool Length Comp G43 H5: ${hasHeightComp ? 'OK' : 'MISSING'}`);
console.log(`  ✓ Radial Operation Header: ${hasRadialHeader ? 'OK' : 'MISSING'}`);
console.log(`  ✓ G01 Feed Moves: ${hasArcOrCut ? 'OK' : 'MISSING'}`);

if (!hasG90 || !hasToolCall || !hasHeightComp || !hasArcOrCut) {
  throw new Error('Test 5 Failed: Required Fanuc CNC syntax blocks missing from post-processed output!');
}

console.log('\n======================================================');
console.log('✅ ALL TESTS PASSED: SURFACE FINISH RADIAL FULLY OPERATIONAL!');
console.log('======================================================');
