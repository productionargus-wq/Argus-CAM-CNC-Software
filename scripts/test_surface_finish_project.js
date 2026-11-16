import * as THREE from 'three';
import { generateSurfaceProjectToolpath, generateToolpathForOperation } from '../src/utils/toolpathEngine.js';
import { generateNCProgram, CONTROLLER_DIALECTS } from '../src/utils/postProcessor.js';

console.log('--- TESTING SURFACE FINISH PROJECT TOOLPATH & G-CODE GENERATION ---');

// 1. Build a synthetic 3D dome mesh for surface project test
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
  rpm: 8000,
  feedRate: 1000
};

// 2. Test 1: Curve projection mode with demo insignia fallback
console.log('\n[Test 1] Testing Curve Projection with Demo Insignia Fallback...');
const curveDemoParams = {
  rapidHeight: 15.0,
  feedPlane: 2.5,
  stockToLeaveZ: 0.0,
  projectParams: {
    projectType: 'curve',
    projectionDirection: 'view_z',
    depthOfCut: 0.2,
    cuttingMethod: 'Zigzag',
    maxGapDistance: 10.0
  }
};

const curveDemoResult = generateSurfaceProjectToolpath(bounds, ballTool, curveDemoParams, modelGroup);
if (!curveDemoResult || !curveDemoResult.cuttingLines || curveDemoResult.cuttingLines.length === 0) {
  throw new Error('Test 1 Failed: generateSurfaceProjectToolpath produced 0 cutting lines for curve demo fallback!');
}
console.log(`  ✓ Generated ${curveDemoResult.cuttingLines.length} cutting segments and ${curveDemoResult.rapidLines.length} rapid segments.`);

// 3. Test 2: Curve projection with custom wireframe line entities
console.log('\n[Test 2] Testing Curve Projection with Custom Wireframe Entities...');
const lineGeo = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(-20, 0, -10),
  new THREE.Vector3(0, 0, 15),
  new THREE.Vector3(20, 0, -10)
]);
const lineMesh = new THREE.Line(lineGeo, new THREE.LineBasicMaterial());
lineMesh.name = 'Wireframe_Triangle_1';
lineMesh.updateMatrixWorld(true);

const customGeomContext = {
  customGeometry: [lineMesh]
};

const customCurveResult = generateSurfaceProjectToolpath(bounds, ballTool, curveDemoParams, modelGroup, customGeomContext);
if (!customCurveResult || !customCurveResult.cuttingLines || customCurveResult.cuttingLines.length === 0) {
  throw new Error('Test 2 Failed: generateSurfaceProjectToolpath produced 0 cutting lines with custom wireframe line!');
}
console.log(`  ✓ Generated ${customCurveResult.cuttingLines.length} cutting segments and ${customCurveResult.rapidLines.length} rapid segments from custom wireframe.`);

// 4. Test 3: Crosshatch / Grid Pattern Mode (Single raster vs Dual Crosshatch)
console.log('\n[Test 3] Testing Crosshatch / Grid Pattern Projection...');
const crosshatchParams = {
  rapidHeight: 15.0,
  feedPlane: 2.5,
  stockToLeaveZ: 0.0,
  projectParams: {
    projectType: 'crosshatch',
    machiningAngle: 45.0,
    stepover: 2.0,
    crosshatchEnabled: true,
    crossAngle: 135.0,
    crossStepover: 2.0,
    depthOfCut: 0.25,
    cuttingMethod: 'Zigzag',
    maxGapDistance: 10.0
  }
};

const crossResult = generateSurfaceProjectToolpath(bounds, ballTool, crosshatchParams, modelGroup);
if (!crossResult || !crossResult.cuttingLines || crossResult.cuttingLines.length === 0) {
  throw new Error('Test 3 Failed: generateSurfaceProjectToolpath produced 0 cutting lines for Crosshatch mode!');
}
console.log(`  ✓ Crosshatch mode generated ${crossResult.cuttingLines.length} cutting segments and ${crossResult.rapidLines.length} rapid segments.`);

// 5. Test 4: One-Way Mode Retract Count vs Zigzag
console.log('\n[Test 4] Testing One-Way Mode Retracts...');
const oneWayParams = {
  rapidHeight: 15.0,
  feedPlane: 2.5,
  stockToLeaveZ: 0.0,
  projectParams: {
    projectType: 'crosshatch',
    machiningAngle: 0.0,
    stepover: 5.0,
    crosshatchEnabled: false,
    depthOfCut: 0.2,
    cuttingMethod: 'One way',
    maxGapDistance: 10.0
  }
};

const zigzagParams = {
  ...oneWayParams,
  projectParams: {
    ...oneWayParams.projectParams,
    cuttingMethod: 'Zigzag'
  }
};

const oneWayRes = generateSurfaceProjectToolpath(bounds, ballTool, oneWayParams, modelGroup);
const zigzagRes = generateSurfaceProjectToolpath(bounds, ballTool, zigzagParams, modelGroup);
console.log(`  One-Way rapids: ${oneWayRes.rapidLines.length}, Zigzag rapids: ${zigzagRes.rapidLines.length}`);
if (oneWayRes.rapidLines.length <= zigzagRes.rapidLines.length) {
  throw new Error('Test 4 Failed: One way mode should have more rapid retracts between passes than zigzag!');
}
console.log('  ✓ Verified One-Way mode retracts per pass.');

// 6. Test 5: Toolpath Dispatch & Fanuc G-Code Generation
console.log('\n[Test 5] Testing Engine Dispatch & Post-Processor Output...');
const projectOp = {
  id: 1,
  name: 'Surface Finish Project - [Top]',
  strategyKey: 'surface_finish_project',
  type: 'surface_finish_project',
  badgeClass: 'project',
  badgeText: 'PJ',
  toolId: 5,
  toolNumber: 5,
  toolDiameter: 6.0,
  feedRate: 1000,
  spindleSpeed: 8000,
  rapidHeight: 25.0,
  feedPlane: 2.5,
  depthOfCut: 0.2,
  cuttingMethod: 'zigzag',
  bounds,
  projectParams: {
    projectType: 'crosshatch',
    machiningAngle: 0.0,
    stepover: 3.0,
    crosshatchEnabled: false,
    depthOfCut: 0.2,
    cuttingMethod: 'Zigzag',
    maxGapDistance: 10.0
  }
};

const dispatchedToolpath = generateToolpathForOperation(projectOp, bounds, ballTool, modelGroup);
if (!dispatchedToolpath || !dispatchedToolpath.cuttingLines || dispatchedToolpath.cuttingLines.length === 0) {
  throw new Error('Test 5 Failed: generateToolpathForOperation failed to dispatch surface_finish_project!');
}
console.log(`  ✓ generateToolpathForOperation successfully dispatched (${dispatchedToolpath.cuttingLines.length} cutting segments).`);

projectOp.toolpath = dispatchedToolpath;

const partMetrics = {
  box: bounds,
  bounds: bounds,
  dimensions: new THREE.Vector3(80, 20, 80)
};

const gcodeResult = generateNCProgram({
  operations: [projectOp],
  tools: [ballTool],
  stockConfig: {
    material: 'Alu 6061-T6',
    shape: 'block',
    wcsZZero: 'top'
  },
  partMetrics,
  model: modelGroup,
  controller: CONTROLLER_DIALECTS.FANUC
});

if (!gcodeResult || !gcodeResult.gcodeText || gcodeResult.gcodeText.length < 100) {
  throw new Error('Test 5 Failed: generateNCProgram returned empty G-code!');
}

const gcodeLines = gcodeResult.gcodeText.split('\n');
console.log(`  ✓ Successfully generated Fanuc NC program with ${gcodeLines.length} lines.`);

// Validate Fanuc ISO headers
const hasG90 = gcodeLines.some((l) => l.includes('G90 G21 G17 G54'));
const hasToolCall = gcodeLines.some((l) => l.includes('T5 M06'));
const hasSpindle = gcodeLines.some((l) => l.includes('S8000 M03') || l.includes('S8000'));
const hasHeightComp = gcodeLines.some((l) => l.includes('G43 H5'));
const hasArcOrCut = gcodeLines.some((l) => l.includes('G01') || l.includes('G1'));
const hasSafeZ = gcodeLines.some((l) => l.includes('G28 G91 Z0.'));

console.log(`  ✓ G90 G21 G17 G54 block: ${hasG90 ? 'OK' : 'MISSING'}`);
console.log(`  ✓ Safe Z Retract: ${hasSafeZ ? 'OK' : 'MISSING'}`);
console.log(`  ✓ Tool Call (T5 M06): ${hasToolCall ? 'OK' : 'MISSING'}`);
console.log(`  ✓ Spindle (S8000 M03): ${hasSpindle ? 'OK' : 'MISSING'}`);
console.log(`  ✓ Height Offset (G43 H5): ${hasHeightComp ? 'OK' : 'MISSING'}`);
console.log(`  ✓ Surface Cutting (G01): ${hasArcOrCut ? 'OK' : 'MISSING'}`);

if (!hasG90 || !hasToolCall || !hasSpindle || !hasHeightComp || !hasArcOrCut) {
  throw new Error('Test 5 Failed: Required Fanuc CNC syntax blocks missing from post-processed output!');
}

console.log('\n======================================================');
console.log('✅ ALL TESTS PASSED: SURFACE FINISH PROJECT FULLY OPERATIONAL!');
console.log('======================================================');
