/**
 * Automated Verification Test Suite for 3D Surface Rough Waterline Rough
 */
import {
  WATERLINE_ROUGH_MATERIALS,
  WATERLINE_ROUGH_PRESETS,
  calculateWaterlineRoughPhysics,
  resolveWaterlineRoughMachineCaps,
  createDefaultWaterlineRoughState
} from '../src/config/waterlineRoughSchema.js';

import {
  generateWaterlineRoughToolpath,
  generateWaterlineRoughGCode
} from '../src/utils/waterlineRoughToolpathEngine.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
    passedTests++;
  }
}

console.log('--- TEST 1: Schema, Materials & Presets ---');
const materialList = Object.values(WATERLINE_ROUGH_MATERIALS);
assert(materialList.length >= 4, 'At least 4 materials defined');
assert(materialList.some(m => m.id === 'alu_6061'), 'Alu 6061 defined');
assert(materialList.some(m => m.id === 'steel_p20'), 'P20 Mold Steel defined');
assert(WATERLINE_ROUGH_PRESETS.length >= 4, 'At least 4 presets defined');
const aluPreset = WATERLINE_ROUGH_PRESETS.find(p => p.id === 'alu_hsm_waterline');
assert(aluPreset && aluPreset.stepdownMm === 2.5, 'Alu preset has 2.5mm stepdown');
assert(aluPreset && aluPreset.stepoverPct === 65, 'Alu preset has 65% stepover');

console.log('\n--- TEST 2: Physics Calculations ---');
const testTool = { diameter: 10, flutes: 4, spindleSpeed: 12000, feedRate: 4800 };
const testCutParams = {
  stepdownMm: 2.0,
  stepoverPct: 60
};
const physics = calculateWaterlineRoughPhysics(testTool, testCutParams, 'ALU_6061');
assert(Number(physics.surfaceSpeedMpm) > 0, `Vc calculated: ${physics.surfaceSpeedMpm} m/min`);
assert(Number(physics.feedPerToothMm) === 0.1, `Fz calculated: ${physics.feedPerToothMm} mm/tooth`);
assert(Number(physics.averageChipThicknessMm) > 0, `Chip thickness calculated: ${physics.averageChipThicknessMm} mm`);
assert(Number(physics.mrrCm3Min) > 0, `MRR calculated: ${physics.mrrCm3Min} cm3/min`);
assert(Number(physics.cuttingForceN) > 0, `Cutting force calculated: ${physics.cuttingForceN} N`);
assert(Number(physics.powerKw) > 0, `Spindle power calculated: ${physics.powerKw} kW`);
assert(Number(physics.torqueNm) > 0, `Spindle torque calculated: ${physics.torqueNm} Nm`);

console.log('\n--- TEST 3: Machine Capability Resolver ---');
const fanucCaps = resolveWaterlineRoughMachineCaps({ name: 'Fanuc Robodrill D21' });
assert(fanucCaps.highSpeedSmoothingCode.includes('G05.1 Q1'), 'Fanuc machine resolves G05.1 Q1');
const haasCaps = resolveWaterlineRoughMachineCaps({ name: 'Haas VF-2SS' });
assert(haasCaps.highSpeedSmoothingCode.includes('G187 P2'), 'Haas machine resolves G187 P2');

console.log('\n--- TEST 4: Default State Generation & ID Hygiene ---');
const mockBounds = {
  min: { x: -50, y: -25, z: -40 },
  max: { x: 50, y: 5, z: 40 }
};
const defaultState = createDefaultWaterlineRoughState({
  bounds: mockBounds,
  tools: [testTool],
  activeMachine: { id: 'fanuc_robodrill', controller: 'Fanuc 30i' }
});
assert(defaultState.id === null, 'id is initialized to null (prevents NaN corruption)');
assert(defaultState.modelGeometry.wallStock === 0.5, 'Default wall stock is 0.50 mm');
assert(defaultState.modelGeometry.floorStock === 0.5, 'Default floor stock is 0.50 mm');
assert(defaultState.waterlineParameters.cleanWalls === true, 'Wall cleanup is enabled by default');
assert(defaultState.waterlineParameters.cornerSmoothing === true, 'Corner smoothing is enabled by default');

console.log('\n--- TEST 5: 3D Waterline Rough Toolpath Generation ---');
const toolpathData = generateWaterlineRoughToolpath(
  mockBounds,
  testTool,
  {
    tool: testTool,
    cutParameters: testCutParams,
    waterlineParameters: {
      criticalDepths: true,
      flatAreaDetection: true,
      wallCleanup: true,
      cornerSmoothingRadius: 1.5
    },
    modelGeometry: {
      wallStock: 0.5,
      floorStock: 0.5
    },
    transitions: {
      entryMethod: 'helical_ramp',
      helicalRadius: 4.0,
      rampPitch: 2.0
    },
    linkingParameters: {
      clearancePlane: 25.0
    }
  },
  null
);

assert(toolpathData.cuttingLines.length > 50, `Toolpath has ${toolpathData.cuttingLines.length} cutting segments`);
assert(toolpathData.rapidLines.length > 0, `Toolpath has ${toolpathData.rapidLines.length} rapid segments`);
assert(toolpathData.waypoints.length > 50, `Toolpath has ${toolpathData.waypoints.length} waypoints`);
assert(toolpathData.stats.levelsCount > 5, `Toolpath sliced ${toolpathData.stats.levelsCount} depth levels`);
assert(toolpathData.stats.cuttingDistanceMm > 0, `Toolpath cutting distance: ${toolpathData.stats.cuttingDistanceMm} mm`);
assert(toolpathData.stats.totalDistanceMm > toolpathData.stats.cuttingDistanceMm, `Total distance includes rapids: ${toolpathData.stats.totalDistanceMm} mm`);

console.log('\n--- TEST 6: Fanuc ISO CNC Post-Processor ---');
const gcode = generateWaterlineRoughGCode(
  toolpathData,
  testTool,
  {
    tool: testTool,
    cutParameters: testCutParams,
    materialKey: 'alu_6061'
  },
  {
    name: 'Fanuc Robodrill D21',
    controller: 'Fanuc 30i / 31i / 0i-MF'
  },
  1,
  'SURFACE_ROUGH_WATERLINE_SAMPLE'
);

assert(gcode.includes('O0001'), 'G-code contains program number O0001');
assert(gcode.includes('SURFACE ROUGH WATERLINE'), 'G-code operation header contains SURFACE ROUGH WATERLINE');
assert(gcode.includes('G05.1 Q1'), 'G-code includes Fanuc high-speed lookahead G05.1 Q1');
assert(gcode.includes('G43 H'), 'G-code includes tool length compensation G43 H');
assert(gcode.includes('G01'), 'G-code includes linear feeds G01');
assert(gcode.includes('M30'), 'G-code ends with M30');

console.log(`\n🎉 ALL ${passedTests} OF ${totalTests} TESTS PASSED SUCCESSFULLY!`);
