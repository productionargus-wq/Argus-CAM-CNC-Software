import fs from 'fs';
import * as THREE from 'three';
import { parseSTEPText } from './src/utils/stepIgesParser.js';
import { segmentObjectIntoSolidFaces } from './src/utils/solidFaceSelectionEngine.js';
import { generateSurfaceFlowlineToolpath, simplifyCutterPolyline3D } from './src/utils/flowlineToolpathEngine.js';
import { buildToolpathMeshes, buildLinkedOperationSegments } from './src/utils/toolpathEngine.js';

console.log('--- Testing Industry-Grade CAM Toolpath & B-Rep Performance ---');

async function run() {
  console.log('\n[1] Testing industrial STEP parser on bush.stp...');
  const stepText = fs.readFileSync('bush.stp', 'utf8');
  const t0 = Date.now();
  const stepModel = await parseSTEPText(stepText);
  const parseTime = Date.now() - t0;
  console.log(`  ✓ Parsed bush.stp in ${parseTime} ms. Group children: ${stepModel.children.length}`);

  console.log('\n[2] Testing solid face segmentation across 167 B-Rep surfaces...');
  const t1 = Date.now();
  const faces = segmentObjectIntoSolidFaces(stepModel.children[0]);
  const segTime = Date.now() - t1;
  console.log(`  ✓ Segmented ${faces.length} drive faces in ${segTime} ms.`);
  if (faces.length !== 167) {
    throw new Error(`Expected 167 faces, got ${faces.length}`);
  }

  console.log('\n[3] Testing Surface Finish Flowline generation on all 167 surfaces...');
  const tool = { diameter: 10, type: 'ball' };
  const params = {
    stepoverDistance: 2.0,
    flowlineParams: {
      stepoverMode: 'distance',
      stepoverDistance: 2.0,
      cuttingMethod: 'Zigzag',
      totalTolerance: 0.025,
      checkGouge: true
    }
  };
  const bounds = new THREE.Box3().setFromObject(stepModel.children[0]);

  const t2 = Date.now();
  const tp = generateSurfaceFlowlineToolpath(bounds, tool, params, faces, []);
  const genTime = Date.now() - t2;
  console.log(`  ✓ Flowline computed across 167 surfaces in ${genTime} ms.`);
  console.log(`  ✓ Cutting segments: ${tp.cuttingLines.length}, Rapid segments: ${tp.rapidLines.length}`);

  if (tp.cuttingLines.length === 0) {
    throw new Error('Expected cutting lines to be generated!');
  }
  if (tp.cuttingLines.length > 100000) {
    throw new Error(`Uncompressed point explosion detected (${tp.cuttingLines.length} lines). Mastercam filter failed.`);
  }

  console.log('\n[4] Testing buildLinkedOperationSegments and typed BufferGeometry meshing...');
  const t3 = Date.now();
  const op = { badgeClass: 'flowline', strategyKey: 'surface_finish_flowline' };
  const linked = buildLinkedOperationSegments(tp, op, bounds, tool);
  const linkedRapidLines = linked.segments.filter(s => s.isRapid).map(s => [s.p1, s.p2]);
  const { cutGeo, rapidGeo } = buildToolpathMeshes(tp, linkedRapidLines);
  const meshTime = Date.now() - t3;
  console.log(`  ✓ Meshed into GPU Buffers in ${meshTime} ms.`);
  console.log(`  ✓ cutGeo vertex count: ${cutGeo.attributes.position.count}, rapidGeo vertex count: ${rapidGeo.attributes.position.count}`);

  console.log('\n[5] Testing polyline simplification filter...');
  const testPts = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(10, 0, 0),
    new THREE.Vector3(20, 0, 0),
    new THREE.Vector3(30, 0, 0),
    new THREE.Vector3(40, 0, 0)
  ];
  const simplified = simplifyCutterPolyline3D(testPts, 0.025);
  console.log(`  ✓ 5 collinear points compressed to ${simplified.length} points.`);
  if (simplified.length !== 2) {
    throw new Error(`Expected 2 points, got ${simplified.length}`);
  }

  console.log('\n=== ALL INDUSTRIAL TOOLPATH BENCHMARKS PASSED (100%) ===\n');
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
