import * as THREE from 'three';
import {
  SWARF_MILLING_PAGES,
  SWARF_MILLING_MATERIALS,
  SWARF_MILLING_PRESETS,
  SWARF_MACHINE_KINEMATICS,
  SWARF_TCPM_DIALECTS,
  resolveDefaultSwarfTool,
  calculateSwarfPhysics,
  calculateRecommendedSwarfSettings,
  DEFAULT_SWARF_CONFIG
} from './src/config/swarfMillingSchema.js';

import {
  generateSampleSwarfRails,
  extractRuledRailsFromModel,
  resampleCurveByArcLength,
  synchronizeSwarfRails,
  calculateSwarfToolVector,
  solveSwarfMachineAngles,
  generateMastercamSwarfToolpath,
  generateSwarfMillingGCode
} from './src/utils/swarfMillingEngine.js';

console.log('====================================================');
console.log('   MASTERCAM 5-AXIS SWARF MILLING TEST SUITE        ');
console.log('====================================================\n');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    testsPassed++;
  } else {
    console.error(`[FAIL] ${testName}`);
    testsFailed++;
  }
}

// TEST 1: Schema & Pages Structure
console.log('--- Test Group 1: Configuration Schema & Taxonomy ---');
assert(Object.keys(SWARF_MILLING_PAGES).length === 10, '10 Mastercam Tree Pages defined');
assert(SWARF_MILLING_PAGES.cut_pattern === 'Cut Pattern & Rail Guides', 'Page 2 is Cut Pattern & Rail Guides');
assert(SWARF_MILLING_MATERIALS.ALU_6061.kc === 750, 'Alu 6061 kc = 750 N/mm2');
assert(SWARF_MILLING_MATERIALS.TITANIUM_5X.kc === 2800, 'Ti-6Al-4V kc = 2800 N/mm2');
assert(SWARF_MILLING_PRESETS.AERO_SPAR !== undefined, 'Aerospace Spar preset exists');

// TEST 2: Tool Auto-Resolver
console.log('\n--- Test Group 2: Intelligent Tool Auto-Resolver ---');
const mockTools = [
  { id: 1, number: 1, name: '50mm Face Mill', type: 'face', diameter: 50 },
  { id: 2, number: 2, name: '6mm Ball Nose', type: 'ball', diameter: 6 },
  { id: 3, number: 3, name: '10mm 4-Flute Flat Endmill', type: 'flat', diameter: 10, fluteLength: 25 },
  { id: 4, number: 4, name: '12mm Bullnose R1', type: 'bull', diameter: 12, fluteLength: 30 }
];
const resolvedTool = resolveDefaultSwarfTool(mockTools);
assert(resolvedTool && resolvedTool.id === 3, `Auto-resolved tool is 10mm Flat Endmill (id: ${resolvedTool?.id})`);

// 2b: Recommended Values Auto-Calculator
const recAlu = calculateRecommendedSwarfSettings({
  materialId: 'alu_6061',
  tool: resolvedTool,
  tools: mockTools,
  wallHeightMm: 22.0
});
assert(recAlu.spindleRpm > 5000, `Recommended Alu RPM: ${recAlu.spindleRpm}`);
assert(recAlu.feedRate > 1000, `Recommended Alu Feed: ${recAlu.feedRate} mm/min`);
assert(recAlu.leadAngleDeg === 0.0 || recAlu.leadAngleDeg === 0.5, `Recommended Lead Angle: ${recAlu.leadAngleDeg} deg`);
assert(recAlu.machineKinematics === 'table_table_ac', 'Recommended Kinematics: Table-Table AC Trunnion');
assert(recAlu.enableAxialSlices === false, 'Single pass finish (flute 25mm >= wall 22mm)');

// Test tall wall triggers axial slices
const recTall = calculateRecommendedSwarfSettings({
  materialId: 'alu_6061',
  tool: resolvedTool,
  tools: mockTools,
  wallHeightMm: 45.0
});
assert(recTall.enableAxialSlices === true, `Tall wall (45mm > 25mm) enables axial slices: ${recTall.axialSlices}`);

// TEST 3: Physics & Cantilever Beam Deflection
console.log('\n--- Test Group 3: Flank Physics & Cantilever Deflection ---');
// 3a. Fine Finishing Pass
const finishPhysics = calculateSwarfPhysics({
  material: SWARF_MILLING_MATERIALS.ALU_6061,
  tool: { diameter: 10, flutes: 4 },
  wallHeight: 12.0,
  stepover: 0.15,
  feedRate: 2200,
  rpm: 12000,
  axialSlices: 1,
  toolOverhangMm: 22.0
});
assert(finishPhysics.mrr > 0, `Finish MRR: ${finishPhysics.mrr} cm3/min`);
assert(finishPhysics.fc > 0, `Finish Tangential Cutting Force Fc: ${finishPhysics.fc} N`);
assert(finishPhysics.deflectionMm <= 0.02, `Finish deflection within tight tolerance: ${finishPhysics.deflectionMm} mm (${finishPhysics.deflectionMicrons} um)`);
assert(finishPhysics.deflectionRating === 'OPTIMAL', `Finish Deflection Rating: ${finishPhysics.deflectionRating}`);

// 3b. Heavy Flank Cut Warning Detection
const heavyPhysics = calculateSwarfPhysics({
  material: SWARF_MILLING_MATERIALS.ALU_6061,
  tool: { diameter: 10, flutes: 4 },
  wallHeight: 20.0,
  stepover: 0.5,
  feedRate: 2800,
  rpm: 12000,
  axialSlices: 1,
  toolOverhangMm: 45.0
});
assert(heavyPhysics.deflectionMm > 0.05, `Heavy cut accurately detects high deflection: ${heavyPhysics.deflectionMm} mm`);
assert(heavyPhysics.deflectionRating === 'EXCESSIVE', `Heavy cut correctly flags EXCESSIVE deflection warning`);

// TEST 4: Rail Curve Generation & Synchronization
console.log('\n--- Test Group 4: Geometry & Rail Synchronization ---');
const bounds = { min: { x: -40, y: -2, z: -20 }, max: { x: 40, y: 22, z: 20 } };
const rails = generateSampleSwarfRails(bounds, 24.0, 10.0);
assert(rails.lowerRail.length === 60, `Lower rail points count: ${rails.lowerRail.length}`);
assert(rails.upperRail.length === 60, `Upper rail points count: ${rails.upperRail.length}`);

const synced = synchronizeSwarfRails(rails.lowerRail, rails.upperRail, 'arclength', 50);
assert(synced.lowerStations.length === 50, `Synchronized lower stations: ${synced.lowerStations.length}`);
assert(synced.upperStations.length === 50, `Synchronized upper stations: ${synced.upperStations.length}`);

// TEST 5: Tool Vector & Inverse Kinematics
console.log('\n--- Test Group 5: Tool Vector & 4-Machine Kinematics ---');
const pBot = synced.lowerStations[10];
const pTop = synced.upperStations[10];
const pNextBot = synced.lowerStations[11];
const vectorResult = calculateSwarfToolVector({
  pBot,
  pTop,
  pNextBot,
  leadAngleDeg: 0.5,
  tiltOffsetDeg: 0.0
});

const vLen = vectorResult.toolVector.length();
assert(Math.abs(vLen - 1.0) < 0.0001, `Tool vector is unit length (length: ${vLen.toFixed(5)})`);
assert(vectorResult.toolVector.y > 0, `Tool vector points upward in spindle +Y (y: ${vectorResult.toolVector.y.toFixed(4)})`);

// Test kinematics for AC, BC, and AB
const ikAC = solveSwarfMachineAngles(vectorResult.toolVector, 'table_table_ac');
assert(typeof ikAC.A === 'number' && typeof ikAC.C === 'number', `Table-Table AC Angles: A=${ikAC.A} deg, C=${ikAC.C} deg`);

const ikBC = solveSwarfMachineAngles(vectorResult.toolVector, 'table_table_bc');
assert(typeof ikBC.B === 'number' && typeof ikBC.C === 'number', `Table-Table BC Angles: B=${ikBC.B} deg, C=${ikBC.C} deg`);

const ikAB = solveSwarfMachineAngles(vectorResult.toolVector, 'head_head_ab');
assert(typeof ikAB.A === 'number' && typeof ikAB.B === 'number', `Head-Head AB Angles: A=${ikAB.A} deg, B=${ikAB.B} deg`);

// TEST 6: Toolpath Generation (Multi-Depth & Multi-Pass)
console.log('\n--- Test Group 6: 5-Axis Swarf Toolpath Generation ---');
const swarfOp = generateMastercamSwarfToolpath(
  bounds,
  { id: 3, diameter: 10, flutes: 4 },
  {
    wallHeightMm: 24.0,
    enableAxialSlices: true,
    axialSlices: 2,
    enableRadialPasses: true,
    radialPasses: 2,
    radialStepover: 0.5,
    cutDirection: 'climb',
    cuttingMethod: 'one_way',
    feedRate: 2800,
    spindleRpm: 12000,
    machineKinematics: 'table_table_ac'
  }
);

assert(swarfOp.cuttingLines.length > 0, `Cutting line segments generated: ${swarfOp.cuttingLines.length}`);
assert(swarfOp.rapidLines.length > 0, `Rapid line segments generated: ${swarfOp.rapidLines.length}`);
assert(swarfOp.arcLines && swarfOp.arcLines.length > 0, `3D Roll-In/Out Arc line segments generated: ${swarfOp.arcLines.length}`);
assert(swarfOp.vectorNeedles && swarfOp.vectorNeedles.length > 0, `5-Axis Tool Orientation Needles generated: ${swarfOp.vectorNeedles.length}`);
assert(swarfOp.flankRibbonVertices && swarfOp.flankRibbonVertices.length > 0, `Flank Contact Ribbon Vertices generated: ${swarfOp.flankRibbonVertices.length / 3} vertices`);
assert(swarfOp.trajectoryPoints.length > 0, `Trajectory waypoints generated: ${swarfOp.trajectoryPoints.length}`);
assert(swarfOp.color === '#8b5cf6', 'Color matches Mastercam 5-Axis Violet (#8b5cf6)');

// TEST 6b: CAD Model Ruled Rail Extractor
console.log('\n--- Test Group 6b: Intelligent CAD Model Ruled Rail Extractor ---');
const mockModelGroup = new THREE.Group();
const mockWallGeom = new THREE.BufferGeometry();
const mockVerts = [];
for (let i = 0; i <= 30; i++) {
  const x = -40 + i * (80 / 30);
  const zBot = 15 + Math.sin(i * 0.2) * 5;
  const zTop = zBot + 8;
  // bottom vertex at y = 12, top vertex at y = 42
  mockVerts.push(x, 12, zBot);
  mockVerts.push(x, 42, zTop);
}
mockWallGeom.setAttribute('position', new THREE.Float32BufferAttribute(mockVerts, 3));
const mockWallMesh = new THREE.Mesh(mockWallGeom);
mockModelGroup.add(mockWallMesh);

const extractedRails = extractRuledRailsFromModel(mockModelGroup);
assert(extractedRails !== null, 'CAD Ruled Rails extracted successfully from mock mesh');
assert(extractedRails && extractedRails.lowerRail.length > 8, `Extracted lower rail has ${extractedRails?.lowerRail?.length} points`);
assert(extractedRails && extractedRails.upperRail.length > 8, `Extracted upper rail has ${extractedRails?.upperRail?.length} points`);
assert(extractedRails && Math.abs(extractedRails.wallHeight - 30.0) < 1.0, `Extracted wall height matches geometry: ${extractedRails?.wallHeight} mm`);

// Generate toolpath using extracted CAD rails
const cadSwarfOp = generateMastercamSwarfToolpath(
  bounds,
  { id: 3, diameter: 10, flutes: 4 },
  { model: mockModelGroup, feedRate: 2800, spindleRpm: 12000 }
);
assert(cadSwarfOp.cuttingLines.length > 0, `CAD-driven swarf toolpath generated ${cadSwarfOp.cuttingLines.length} cuts`);
assert(cadSwarfOp.stats.wallHeightMm === extractedRails.wallHeight, `Toolpath automatically adopted extracted wall height: ${cadSwarfOp.stats.wallHeightMm} mm`);

// Verify that all cuttingLines have valid pairs [p1, p2]
let allValidPairs = true;
for (const seg of swarfOp.cuttingLines) {
  if (!Array.isArray(seg) || seg.length !== 2 || !(seg[0] instanceof THREE.Vector3) || !(seg[1] instanceof THREE.Vector3)) {
    allValidPairs = false;
    break;
  }
}
assert(allValidPairs, 'All cuttingLines elements are valid [Vector3, Vector3] segment pairs');

// TEST 7: Production TCPM G-Code Generation
console.log('\n--- Test Group 7: Production TCPM G-Code Generation ---');
const fanucGCode = generateSwarfMillingGCode(
  swarfOp,
  { number: 3, name: '10mm 4-Flute Flat Endmill', diameter: 10 },
  { controllerDialect: 'fanuc', spindleRpm: 12000, feedRate: 2800 }
);
assert(fanucGCode.includes('G43.4 H3 M08'), 'Fanuc G-code contains G43.4 H3 M08 TCPM activation');
assert(fanucGCode.includes('G05.1 Q1'), 'Fanuc G-code contains G05.1 Q1 look-ahead');
assert(fanucGCode.includes('G49'), 'Fanuc G-code contains G49 cancellation');
assert(fanucGCode.includes('A') && fanucGCode.includes('C'), 'Fanuc G-code contains rotary moves with A and C axes');

const haasGCode = generateSwarfMillingGCode(
  swarfOp,
  { number: 3, name: '10mm 4-Flute Flat Endmill', diameter: 10 },
  { controllerDialect: 'haas', spindleRpm: 12000, feedRate: 2800 }
);
assert(haasGCode.includes('G234 H3 M08'), 'Haas G-code contains G234 H3 M08 TCPC activation');
assert(haasGCode.includes('G187 P2'), 'Haas G-code contains G187 P2 high-speed mode');

const siemensGCode = generateSwarfMillingGCode(
  swarfOp,
  { number: 3, name: '10mm 4-Flute Flat Endmill', diameter: 10 },
  { controllerDialect: 'siemens', spindleRpm: 12000, feedRate: 2800 }
);
assert(siemensGCode.includes('TRAORI'), 'Siemens G-code contains TRAORI activation');
assert(siemensGCode.includes('TRAFOOF'), 'Siemens G-code contains TRAFOOF cancellation');

const heidenhainGCode = generateSwarfMillingGCode(
  swarfOp,
  { number: 3, name: '10mm 4-Flute Flat Endmill', diameter: 10 },
  { controllerDialect: 'heidenhain', spindleRpm: 12000, feedRate: 2800 }
);
assert(heidenhainGCode.includes('FUNCTION TCPM'), 'Heidenhain G-code contains FUNCTION TCPM activation');
assert(heidenhainGCode.includes('FUNCTION RESET TCPM'), 'Heidenhain G-code contains FUNCTION RESET TCPM cancellation');

console.log('\n====================================================');
console.log(`TEST SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
console.log('====================================================');

if (testsFailed > 0) {
  process.exit(1);
}
