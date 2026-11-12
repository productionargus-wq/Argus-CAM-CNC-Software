import assert from 'node:assert/strict';
import {
  createBoxGeometry,
  createSolidFillet,
  generateSampleSTEPString
} from '../src/utils/cadGeometry.js';
import { parseSTEPText } from '../src/utils/stepIgesParser.js';
import {
  buildSolidFaceCatalog,
  resolveSolidFaceSelectionAction,
  buildSolidFaceHighlightGroup
} from '../src/utils/solidFaceSelectionEngine.js';
import {
  buildFlowlinePreviewForFaces,
  generateSurfaceFlowlineToolpath
} from '../src/utils/flowlineToolpathEngine.js';
import {
  computeFlowlineStepoverFromScallop,
  createDefaultSurfaceFinishState
} from '../src/config/surfaceFinishSchema.js';
import {
  generateToolpathForOperation,
  compileBackplotTrajectory
} from '../src/utils/toolpathEngine.js';
import { generateNCProgram, CONTROLLER_DIALECTS } from '../src/utils/postProcessor.js';

async function runTests() {
  console.log('1. Testing solid face segmentation on Box & Filleted Solid...');
  const boxModel = createBoxGeometry(80, 35, 60, 'Test_Box');
  const boxCatalog = buildSolidFaceCatalog({ currentModel: boxModel });
  assert.equal(boxCatalog.faces.length, 6, `Expected 6 planar faces on box, got ${boxCatalog.faces.length}`);
  assert.ok(boxCatalog.faces.every((f) => f.kind === 'planar'), 'All box faces must classify as planar');

  const filletModel = createSolidFillet(80, 35, 60, 8, { name: 'Solid_Fillet_Test' });
  const filletCatalog = buildSolidFaceCatalog({ currentModel: filletModel });
  const filletFaces = filletCatalog.faces.filter((f) => f.kind === 'fillet');
  const planarFaces = filletCatalog.faces.filter((f) => f.kind === 'planar');
  assert.ok(filletFaces.length >= 2, `Expected >= 2 fillet faces, got ${filletFaces.length}`);
  assert.ok(planarFaces.length >= 4, `Expected >= 4 planar faces, got ${planarFaces.length}`);
  assert.ok(
    filletFaces.every((f) => Math.abs((f.radius || 0) - 8) < 0.8),
    `Expected fillet radius ~8mm, got ${filletFaces.map((f) => f.radius).join(', ')}`
  );
  assert.ok(
    filletFaces.some((f) => f.tangentNeighborIds.length >= 1),
    'Fillet face should link to tangent planar faces via tangentNeighborIds'
  );

  console.log('2. Testing Mastercam click / modifier selection modes...');
  const targetFillet = filletFaces[0];

  const singleRes = resolveSolidFaceSelectionAction(filletCatalog, targetFillet, { clickCount: 1 });
  assert.deepEqual(singleRes.faceIds, [targetFillet.id]);

  const shiftRes = resolveSolidFaceSelectionAction(filletCatalog, targetFillet, { shiftKey: true, clickCount: 1 });
  assert.ok(shiftRes.faceIds.length > 1, `Shift+click should expand across tangent faces, got ${shiftRes.faceIds.length}`);

  const ctrlRes = resolveSolidFaceSelectionAction(filletCatalog, targetFillet, { ctrlKey: true, clickCount: 1 });
  assert.ok(ctrlRes.faceIds.length >= 2, `Ctrl+click should match all fillets of same radius, got ${ctrlRes.faceIds.length}`);

  const dblRes = resolveSolidFaceSelectionAction(filletCatalog, targetFillet, { clickCount: 2 });
  assert.ok(dblRes.faceIds.length >= 1, 'Double-click should resolve feature faces');

  const tripleRes = resolveSolidFaceSelectionAction(filletCatalog, targetFillet, { clickCount: 3 });
  assert.equal(tripleRes.faceIds.length, filletCatalog.faces.length, 'Triple-click must select entire solid body');

  const altRes = resolveSolidFaceSelectionAction(filletCatalog, targetFillet, {
    altKey: true,
    clickCount: 1,
    rayHits: [
      { object: targetFillet.mesh, faceIndex: targetFillet.triIndices[0] },
      { object: planarFaces[0].mesh, faceIndex: planarFaces[0].triIndices[0] }
    ]
  });
  assert.equal(altRes.faceIds.length, 2, 'Alt+click vector select should collect pierced faces');

  const hlGroup = buildSolidFaceHighlightGroup(filletFaces);
  assert.ok(hlGroup.children.length >= 2, 'Face highlight group should include fill mesh & edge lines');

  console.log('3. Testing STEP B-Rep face tagging...');
  const stepGroup = await parseSTEPText(generateSampleSTEPString());
  const stepMesh = stepGroup.children.find((c) => c.isMesh);
  assert.ok(Array.isArray(stepMesh?.userData?.brepFaceMap) && stepMesh.userData.brepFaceMap.length > 0, 'STEP mesh should carry brepFaceMap');
  const stepCatalog = buildSolidFaceCatalog({ currentModel: stepGroup });
  assert.ok(stepCatalog.faces.length >= 5, `STEP catalog should segment B-rep faces, got ${stepCatalog.faces.length}`);

  console.log('4. Testing Flowline Data UV preview & flips...');
  const prevDefault = buildFlowlinePreviewForFaces(filletFaces, {
    offsetDir: 1,
    cutDir: 1,
    stepDir: 1,
    swapUV: false,
    startCorner: 0,
    edgeTolerance: 0.025,
    plotEdges: true
  });
  assert.ok(prevDefault.gridSegments.length > 10, 'Flowline preview should generate UV grid segments');
  assert.ok(prevDefault.edgeSegments.length > 0, 'Plot edges should emit boundary edge segments');
  assert.equal(prevDefault.arrows.length, filletFaces.length, 'Should emit green directional arrows per drive face');

  const prevFlipped = buildFlowlinePreviewForFaces(filletFaces, {
    offsetDir: 1,
    cutDir: -1,
    stepDir: 1,
    swapUV: true,
    startCorner: 1,
    edgeTolerance: 0.025,
    plotEdges: false
  });
  assert.ok(
    prevFlipped.arrows[0].cutDir.distanceTo(prevDefault.arrows[0].cutDir) > 0.1,
    'Flipping Cut/Step direction must alter green arrow vectors'
  );

  console.log('5. Testing Flowline stepover math, toolpath engine, gouge check & NC post...');
  const scallopStep = computeFlowlineStepoverFromScallop({
    scallopHeight: 0.5,
    toolDiameter: 12.0,
    cornerRadius: 0.6,
    toolType: 'bull'
  });
  assert.ok(scallopStep > 0.2 && scallopStep <= 9.0, `Unexpected scallop stepover: ${scallopStep}`);

  const bullTool = {
    id: 8,
    number: 8,
    name: '12 Bull-Nosed Endmill',
    type: 'bull',
    diameter: 12,
    cornerRad: 0.6,
    cornerRadius: 0.6,
    rpm: 10695,
    feedRate: 3000,
    plungeRate: 450
  };

  const defaults = createDefaultSurfaceFinishState({ strategyMode: 'flowline', tool: bullTool });
  const zigzagRes = generateSurfaceFlowlineToolpath(
    null,
    bullTool,
    {
      ...defaults.surfaceParams,
      flowlineData: defaults.flowlineData,
      flowlineParams: { ...defaults.flowlineParams, cuttingMethod: 'Zigzag', stepoverMode: 'scallop', scallopHeight: 0.5 }
    },
    filletFaces,
    []
  );
  assert.ok(zigzagRes.cuttingLines.length > 20, `Expected >20 Zigzag cutting segments, got ${zigzagRes.cuttingLines.length}`);

  const oneWayRes = generateSurfaceFlowlineToolpath(
    null,
    bullTool,
    {
      ...defaults.surfaceParams,
      flowlineData: defaults.flowlineData,
      flowlineParams: { ...defaults.flowlineParams, cuttingMethod: 'One way', stepoverMode: 'distance', stepoverDistance: 2.0, cutControlDistanceEnabled: true, cutControlDistance: 2.0 }
    },
    filletFaces,
    []
  );
  assert.ok(oneWayRes.rapidLines.length > zigzagRes.rapidLines.length, 'One way should produce more retract/rapid transitions than Zigzag');

  const singleRowRes = generateSurfaceFlowlineToolpath(
    null,
    bullTool,
    {
      ...defaults.surfaceParams,
      flowlineData: defaults.flowlineData,
      flowlineParams: { ...defaults.flowlineParams, singleRowOnly: true }
    },
    [filletFaces[0]],
    []
  );
  assert.ok(singleRowRes.cuttingLines.length >= 4 && singleRowRes.cuttingLines.length <= 85, `Single row should produce 1 pass, got ${singleRowRes.cuttingLines.length}`);

  // Gouge avoidance test: place a Check face above a planar drive face
  const drivePlane = planarFaces.find((f) => f.normal.y > 0.9) || planarFaces[0];
  const checkBox = createBoxGeometry(20, 45, 20, 'Check_Clamp');
  const checkCat = buildSolidFaceCatalog({ currentModel: checkBox });
  const gougeChecked = generateSurfaceFlowlineToolpath(
    null,
    bullTool,
    {
      ...defaults.surfaceParams,
      stockToLeaveCheck: 1.0,
      flowlineData: defaults.flowlineData,
      flowlineParams: { ...defaults.flowlineParams, checkGouge: true, stepoverMode: 'distance', stepoverDistance: 4.0 }
    },
    [drivePlane],
    checkCat.faces
  );
  const maxLiftedY = Math.max(...gougeChecked.cuttingLines.flatMap(([a, b]) => [a.y, b.y]));
  assert.ok(maxLiftedY > 40, `Gouge check should lift cutter over 45mm tall check clamp, maxY=${maxLiftedY}`);

  // End-to-end operation dispatch + backplot + NC posting
  const flowlineOp = {
    id: 1,
    name: 'Surface Finish Flowline',
    type: 'surface_finish_flowline',
    strategyKey: 'surface_finish_flowline',
    badgeClass: 'flowline',
    badgeText: 'SF',
    visible: true,
    toolId: 8,
    toolNumber: 8,
    toolType: 'bull',
    toolDiameter: 12,
    cornerRadius: 0.6,
    feedRate: 3000,
    spindleSpeed: 10695,
    plungeFeedRate: 450,
    rapidHeight: 25,
    usesCustomSurfaces: true,
    driveFaceIds: filletFaces.map((f) => f.id),
    checkFaceIds: [],
    surfaceParams: defaults.surfaceParams,
    flowlineData: defaults.flowlineData,
    flowlineParams: defaults.flowlineParams
  };

  const dispatched = generateToolpathForOperation(flowlineOp, null, bullTool, filletModel, null);
  assert.ok(dispatched && dispatched.cuttingLines.length > 20, 'generateToolpathForOperation must route flowline');

  const backplot = compileBackplotTrajectory([flowlineOp], [bullTool], null, filletModel, 1, 49, [], null);
  assert.ok(backplot.waypoints.length > 20, 'Backplot must compile flowline waypoints');
  assert.ok(backplot.waypoints.every((w) => Number.isFinite(w.pos.x) && Number.isFinite(w.pos.y) && Number.isFinite(w.pos.z)), 'All backplot waypoints must be finite');

  const nc = generateNCProgram({
    operations: [flowlineOp],
    tools: [bullTool],
    stockConfig: { material: 'Alu 6061-T6', shape: 'box', allowanceTop: 0 },
    partMetrics: null,
    controller: CONTROLLER_DIALECTS.FANUC,
    machineName: 'Fanuc Robodrill D21',
    programName: 'FLOWLINE_TEST',
    model: filletModel,
    customGeometry: []
  });
  assert.ok(!nc.gcodeText.includes('NaN'), 'Posted NC program must not contain NaN');
  assert.ok(nc.gcodeText.includes('G01') && nc.gcodeText.includes('SURFACE FINISH FLOWLINE'), 'NC program must contain Flowline G01 blocks');

  console.log('6. Testing .mcam JSON round-trip persistence of Flowline operation...');
  const serializedOp = JSON.parse(JSON.stringify(flowlineOp));
  assert.deepEqual(serializedOp.driveFaceIds, flowlineOp.driveFaceIds, 'driveFaceIds must survive JSON round-trip');
  assert.deepEqual(serializedOp.flowlineData, flowlineOp.flowlineData, 'flowlineData must survive JSON round-trip');
  assert.deepEqual(serializedOp.flowlineParams, flowlineOp.flowlineParams, 'flowlineParams must survive JSON round-trip');
  const regenerated = generateToolpathForOperation(serializedOp, null, bullTool, filletModel, null);
  assert.equal(regenerated.cuttingLines.length, dispatched.cuttingLines.length, 'Regenerated flowline toolpath after reload must match original');

  console.log(`ALL FLOWLINE & SOLID FACE SELECTION TESTS PASSED! (${nc.lineCount} NC lines, ${backplot.waypoints.length} waypoints)`);
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
