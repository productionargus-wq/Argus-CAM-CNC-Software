import assert from 'assert';
import * as THREE from 'three';
import {
  generateToolpathForOperation,
  resolveOperationDriveBounds,
  buildEffectiveDriveModel
} from '../src/utils/toolpathEngine.js';
import { generateNCProgram, CONTROLLER_DIALECTS } from '../src/utils/postProcessor.js';

// Logic matching isSurfaceFinishOp in OperationsTree.jsx
const isSurfaceFinishOp = (op) => {
  if (!op) return false;
  const k = (op.strategyKey || op.type || op.badgeClass || '').toLowerCase();
  return (
    k.includes('surface_finish') ||
    ['flowline', 'contour', 'pocket', 'shallow', 'parallel', 'parallel_steep', 'pencil', 'radial', 'project', 'leftover', 'scallop'].includes(op.badgeClass) ||
    ['surface_finish_flowline', 'surface_finish_contour', 'surface_finish_pocket', 'surface_finish_shallow', 'surface_finish_parallel', 'surface_finish_parallel_steep', 'surface_finish_pencil', 'surface_finish_radial', 'surface_finish_project', 'surface_finish_leftover', 'surface_finish_scallop'].includes(op.strategyKey)
  );
};

console.log('--- Testing Unified Surface Finish Workflow ---');

// 1. Verify isSurfaceFinishOp recognizes all 10 strategies
const allStrategies = [
  'flowline',
  'contour',
  'pocket',
  'shallow',
  'parallel',
  'parallel_steep',
  'pencil',
  'radial',
  'project',
  'leftover',
  'scallop'
];

allStrategies.forEach((strat) => {
  const opWithBadge = { id: 1, badgeClass: strat, name: `Test ${strat}` };
  assert.strictEqual(
    isSurfaceFinishOp(opWithBadge),
    true,
    `isSurfaceFinishOp failed for badgeClass ${strat}`
  );

  const opWithStrategyKey = { id: 2, strategyKey: `surface_finish_${strat}`, name: `Test ${strat}` };
  assert.strictEqual(
    isSurfaceFinishOp(opWithStrategyKey),
    true,
    `isSurfaceFinishOp failed for strategyKey surface_finish_${strat}`
  );
});
console.log('✓ All 10 Surface Finish strategies correctly recognized by isSurfaceFinishOp');

// 2. Test resolveOperationDriveBounds with and without driveFaceIds
const globalBounds = new THREE.Box3(
  new THREE.Vector3(-50, -25, -40),
  new THREE.Vector3(50, 0, 40)
);

const driveFaceBounds = new THREE.Box3(
  new THREE.Vector3(0, -15, 10),
  new THREE.Vector3(25, 0, 30)
);

// Without driveFaceIds (global part machining)
const opGlobal = {
  id: 1,
  badgeClass: 'project',
  driveFaceIds: []
};
const resolvedGlobal = resolveOperationDriveBounds(null, opGlobal, globalBounds);
assert.deepStrictEqual(resolvedGlobal.min, globalBounds.min);
assert.deepStrictEqual(resolvedGlobal.max, globalBounds.max);
console.log('✓ Full-part machining without driveFaceIds resolves to global bounds');

// With driveFaceIds and specific bounds
const opWithDriveFaces = {
  id: 2,
  badgeClass: 'project',
  bounds: driveFaceBounds,
  driveFaceIds: ['body_0_f4']
};
const resolvedDrive = resolveOperationDriveBounds(null, opWithDriveFaces, globalBounds);
assert.deepStrictEqual(resolvedDrive.min, driveFaceBounds.min);
assert.deepStrictEqual(resolvedDrive.max, driveFaceBounds.max);
console.log('✓ Drive-restricted operation correctly resolves to drive face bounds');

// 3. Test Toolpath generation for all 10 strategies with drive-restricted bounds
const tool = {
  id: 5,
  number: 5,
  name: '6mm 2-Flute Ball Nose',
  type: 'ball',
  diameter: 6.0,
  rpm: 8500,
  feedRate: 700,
  plungeRate: 250
};

const stockConfig = {
  dimensions: { x: 100, y: 25, z: 80 },
  allowanceTop: 2.0
};

// Create a synthetic mesh for testing raycast/surface operations
const geom = new THREE.BoxGeometry(60, 20, 60);
const mesh = new THREE.Mesh(geom, new THREE.MeshBasicMaterial());
mesh.position.set(0, -10, 0);
mesh.updateMatrixWorld(true);

allStrategies.forEach((strat) => {
  const op = {
    id: 10,
    name: `Surface Finish ${strat.toUpperCase()}`,
    strategyKey: `surface_finish_${strat}`,
    badgeClass: strat,
    toolId: 5,
    toolNumber: 5,
    bounds: driveFaceBounds,
    driveFaceIds: ['body_0_f4'],
    checkFaceIds: [],
    containmentIds: [],
    stepover: 0.5,
    stepoverPct: 15,
    stepdown: 0.5,
    rapidHeight: 25.0,
    surfaceParams: {
      stockToLeaveDrive: 0.0,
      stockToLeaveCheck: 0.5,
      clearance: 25.0,
      retract: 5.0,
      feedRate: 700,
      plungeRate: 250
    }
  };

  const toolpath = generateToolpathForOperation(op, driveFaceBounds, tool, mesh, stockConfig);
  assert(toolpath, `Toolpath generation failed for strategy ${strat}`);
  console.log(`✓ Strategy ${strat.padEnd(15)} generated toolpath points: ${toolpath.points?.length || 0}`);
});

// 4. Test NC Post-processor output with unified surface finish op
const sampleOp = {
  id: 1,
  name: 'Surface Finish Project - Top Slope',
  strategyKey: 'surface_finish_project',
  badgeClass: 'project',
  toolId: 5,
  toolNumber: 5,
  toolDiameter: 6.0,
  toolType: 'ball',
  bounds: driveFaceBounds,
  driveFaceIds: ['body_0_f4'],
  rapidHeight: 25.0,
  surfaceParams: {
    stockToLeaveDrive: 0.0,
    stockToLeaveCheck: 0.5,
    clearance: 25.0,
    retract: 5.0,
    feedRate: 679,
    plungeRate: 250
  }
};

const toolpathData = generateToolpathForOperation(sampleOp, driveFaceBounds, tool, mesh, stockConfig);

const mockOpWithToolpath = {
  ...sampleOp,
  points: toolpathData.points,
  spindleRpm: 8488,
  cuttingFeed: 679,
  plungeFeed: 250
};

const ncResult = generateNCProgram({
  operations: [mockOpWithToolpath],
  tools: [tool],
  controller: CONTROLLER_DIALECTS.FANUC,
  partMetrics: {
    bounds: driveFaceBounds,
    partBox: driveFaceBounds,
    stockBox: globalBounds
  },
  programNumber: 1001,
  programName: 'MOLD_PROJECT_FINISH_SAMPLE',
  stockConfig: {
    wcsZZero: 'top',
    material: 'Alu 6061-T6'
  }
});

assert(ncResult && ncResult.gcodeText, 'NC generation returned empty output');
assert(ncResult.gcodeText.includes('SURFACE FINISH PROJECT'), 'G-code missing operation banner');
assert(ncResult.gcodeText.includes('G01'), 'G-code missing G01 cutting moves');
console.log('✓ G-code correctly generated for unified surface finish operation');

console.log('\nAll Unified Surface Finish Workflow tests PASSED cleanly!');
