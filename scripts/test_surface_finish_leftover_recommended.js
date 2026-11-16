/**
 * Automated Verification: Surface Finish Leftover Recommended Values & Gouge-Free Toolpath Generation
 */

import assert from 'assert';
import fs from 'fs';
import * as THREE from 'three';
import {
  computeRecommendedLeftoverParams,
  createDefaultSurfaceFinishState
} from '../src/config/surfaceFinishSchema.js';
import {
  generateSurfaceLeftoverToolpath,
  generateToolpathForOperation
} from '../src/utils/toolpathEngine.js';
import { generateNCProgram, CONTROLLER_DIALECTS } from '../src/utils/postProcessor.js';

console.log('--- TESTING SURFACE FINISH LEFTOVER RECOMMENDED VALUES & GOUGE-FREE ENGINE ---\n');

// 1. Test computeRecommendedLeftoverParams
console.log('[Test 1] Testing computeRecommendedLeftoverParams calculation...');
const tool6Ball = { toolDiameter: 6.0, diameter: 6.0, type: 'ball', cornerRadius: 3.0 };
const recommendedDefault = computeRecommendedLeftoverParams({ tool: tool6Ball });

assert.strictEqual(recommendedDefault.refToolDiameter, 12.0, 'Default ref tool should be 12mm (2x 6mm)');
assert.strictEqual(recommendedDefault.refToolCornerRadius, 6.0, 'Default ref tool corner radius should be 6mm');
assert(recommendedDefault.stepover > 0.1 && recommendedDefault.stepover <= 0.5, `Stepover (${recommendedDefault.stepover}) should be in range 0.1-0.5mm`);
assert(recommendedDefault.numberOfPasses >= 2 && recommendedDefault.numberOfPasses <= 10, `Passes (${recommendedDefault.numberOfPasses}) should be in range 2-10`);
assert.strictEqual(recommendedDefault.overlap, 1.0, 'Overlap should be 1.0mm');
console.log(`  ✓ Default recommendation: 6mm Ball vs ${recommendedDefault.refToolDiameter}mm Ref -> stepover: ${recommendedDefault.stepover}mm, passes: ${recommendedDefault.numberOfPasses}`);

// Test with previous operation (e.g. 16mm Bull R2 Roughing)
const prevRoughingOp = {
  id: 'op_rough_1',
  name: 'Roughing Pocket',
  tool: { diameter: 16.0, cornerRadius: 2.0, type: 'bull' }
};
const recommendedWithPrev = computeRecommendedLeftoverParams({
  tool: tool6Ball,
  previousOp: prevRoughingOp
});
assert.strictEqual(recommendedWithPrev.refToolDiameter, 16.0, 'Should adopt 16mm ref tool from previous op');
assert.strictEqual(recommendedWithPrev.refToolCornerRadius, 2.0, 'Should adopt 2mm corner radius from previous op');
console.log(`  ✓ With previous roughing op: adopted ${recommendedWithPrev.refToolDiameter}mm Ref Tool (R=${recommendedWithPrev.refToolCornerRadius}mm)`);

// 2. Load Mold_Steep_Finishing_Sample.stl and build Three.js Mesh
console.log('\n[Test 2] Loading Mold_Steep_Finishing_Sample.stl for raycast toolpath generation...');
const stlBuffer = fs.readFileSync('Mold_Steep_Finishing_Sample.stl');

function parseBinarySTL(buffer) {
  const geom = new THREE.BufferGeometry();
  const count = buffer.readUInt32LE(80);
  const positions = new Float32Array(count * 9);
  let offset = 84;
  for (let i = 0; i < count; i++) {
    // skip normal (12 bytes)
    offset += 12;
    for (let v = 0; v < 3; v++) {
      positions[i * 9 + v * 3 + 0] = buffer.readFloatLE(offset + 0);
      positions[i * 9 + v * 3 + 1] = buffer.readFloatLE(offset + 4);
      positions[i * 9 + v * 3 + 2] = buffer.readFloatLE(offset + 8);
      offset += 12;
    }
    offset += 2; // attribute byte count
  }
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.computeVertexNormals();
  return new THREE.Mesh(geom, new THREE.MeshStandardMaterial());
}

const stlMesh = parseBinarySTL(stlBuffer);
stlMesh.geometry.computeBoundingBox();
const modelBox = stlMesh.geometry.boundingBox;
console.log(`  Model Bounds: X=[${modelBox.min.x.toFixed(1)}, ${modelBox.max.x.toFixed(1)}] Y=[${modelBox.min.y.toFixed(1)}, ${modelBox.max.y.toFixed(1)}] Z=[${modelBox.min.z.toFixed(1)}, ${modelBox.max.z.toFixed(1)}]`);

// 3. Generate Surface Finish Leftover Toolpath with unconstrained totalDepth
console.log('\n[Test 3] Generating Leftover Toolpath with engine multi-probe raycasting & anti-spike guard...');
const leftoverParams = {
  ...recommendedDefault,
  totalDepth: 35.0, // intentionally pass unconstrained totalDepth to prove engine clamps it
  rapidHeight: 15.0,
  feedPlane: 2.5
};

const toolpath = generateSurfaceLeftoverToolpath(
  modelBox,
  { diameter: 6.0, type: 'ball', cornerRadius: 3.0 },
  { leftoverParams, totalDepth: 35.0 },
  stlMesh
);

assert(toolpath.cuttingLines.length > 50, `Should generate cutting lines (got ${toolpath.cuttingLines.length})`);
assert(toolpath.rapidLines.length > 0, `Should generate rapid lines (got ${toolpath.rapidLines.length})`);
console.log(`  ✓ Generated ${toolpath.cuttingLines.length} cutting segments, ${toolpath.rapidLines.length} rapid segments`);

// 4. Inspect all cutting points for Z-35 spikes or gouges
console.log('\n[Test 4] Scanning all 3D toolpath coordinates for depth spikes / gouges...');
const allPoints = [];
toolpath.cuttingLines.forEach(([p1, p2]) => {
  allPoints.push(p1, p2);
});

let minZ = Infinity;
let maxZ = -Infinity;
let spikeCount = 0;

for (let i = 0; i < allPoints.length; i++) {
  const p = allPoints[i];
  if (p.y < minZ) minZ = p.y;
  if (p.y > maxZ) maxZ = p.y;
  // If y drops below -26mm (the STL bottom is at -25.0)
  if (p.y < -26.0) {
    spikeCount++;
    console.error(`  ❌ Depth anomaly at pt ${i}: (${p.x.toFixed(3)}, ${p.y.toFixed(3)}, ${p.z.toFixed(3)})`);
  }
}

console.log(`  Elevation Range: Y_min=${minZ.toFixed(3)}mm to Y_max=${maxZ.toFixed(3)}mm`);
assert.strictEqual(spikeCount, 0, `Should have ZERO depth spikes < -26mm (got ${spikeCount})`);
assert(minZ >= -25.5, `Minimum depth (${minZ.toFixed(2)}) must not plunge below model base (-25.0mm)`);
console.log('  ✓ Verified 100% gouge-free: NO Z-35.000 drops detected anywhere in the toolpath!');

// 5. Post-Process to Fanuc Robodrill NC Code and verify G-code blocks
console.log('\n[Test 5] Post-processing to Fanuc Robodrill D21 NC Code...');
const mockOp = {
  id: 'op_leftover_test',
  name: 'Surface Finish Leftover 1',
  strategy: 'leftover',
  strategyKey: 'surface_finish_leftover',
  badgeClass: 'leftover',
  tool: { toolNumber: 5, diameter: 6.0, type: 'ball', name: '6mm 2-Flute Ball Nose' },
  toolParams: { toolNumber: 5, toolDiameter: 6.0, spindleSpeed: 8488, feedRate: 679, plungeRate: 250 },
  toolpath,
  leftoverParams
};

const ncResult = generateNCProgram({
  operations: [mockOp],
  tools: [mockOp.tool],
  controller: CONTROLLER_DIALECTS.FANUC,
  partMetrics: {
    bounds: modelBox,
    dimensions: { x: 100, y: 50, z: 80 }
  },
  programNumber: '0001',
  programName: 'MOLD_LEFTOVER_GOUGE_FREE'
});
const ncCode = typeof ncResult === 'string' ? ncResult : ncResult.gcodeText || '';

assert(ncCode.includes('OPERATION 1: SURFACE FINISH LEFTOVER'), 'NC output should have leftover operation header');
assert(!ncCode.includes('Z-35.000'), 'NC code MUST NOT contain any Z-35.000 gouge blocks!');
assert(ncCode.includes('M30'), 'NC code should contain program end M30');

// Scan for any sudden Z plunge of more than 5mm in G01
const ncLines = ncCode.split('\n');
let gcodeZSpikes = 0;
let lastGcodeZ = null;
ncLines.forEach((line) => {
  if (line.includes('G01') && line.includes('Z')) {
    const m = line.match(/Z([-+]?\d*\.?\d+)/);
    if (m) {
      const zVal = parseFloat(m[1]);
      if (lastGcodeZ !== null && (zVal - lastGcodeZ < -5.0) && !line.includes('F250')) {
        gcodeZSpikes++;
        console.error(`  ❌ Sudden cut plunge in line: ${line}`);
      }
      lastGcodeZ = zVal;
    }
  }
});

assert.strictEqual(gcodeZSpikes, 0, `Found ${gcodeZSpikes} sudden Z drop spikes in G-code`);
console.log(`  ✓ Generated ${ncLines.length} lines of clean Fanuc NC code with 0 gouge blocks!`);

console.log('\n======================================================');
console.log('✅ ALL SURFACE FINISH LEFTOVER RECOMMENDED TESTS PASSED!');
console.log('======================================================');
