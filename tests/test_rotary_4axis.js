import assert from 'node:assert';
import {
  createDefaultRotary4AxisParams,
  calculateRotary4AxisPhysics,
  calculateRecommendedRotarySettings,
  ROTARY_4AXIS_MATERIALS,
  ROTARY_4AXIS_PRESETS,
  resolveDefaultRotaryTool
} from '../src/config/rotary4AxisSchema.js';

import {
  extractRotaryStockFromModel,
  wrapPlanarToCylinder,
  buildRotaryBlendLoop,
  generateRotary4AxisToolpath,
  generateRotary4AxisGCode
} from '../src/utils/rotary4AxisEngine.js';

console.log('🧪 Starting Mastercam Rotary 4-Axis Automated Test Suite...\n');

let passCount = 0;
function test(desc, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${desc}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(err);
    process.exit(1);
  }
}

// ========================================================
// 1. Schema Defaults & Presets
// ========================================================
console.log('--- Group 1: Schema Defaults & Presets ---');

test('createDefaultRotary4AxisParams produces valid 10-page structure', () => {
  const params = createDefaultRotary4AxisParams();
  assert.strictEqual(params.toolpathType, 'rotary_4axis');
  assert.ok(params.cutPattern);
  assert.strictEqual(params.cutPattern.cylinderDiameter, 60.0);
  assert.strictEqual(params.cutPattern.rotaryAxis, 'X');
  assert.ok(params.tool);
  assert.strictEqual(params.tool.diameter, 10.0);
  assert.ok(params.holder);
  assert.ok(params.axisControl);
  assert.ok(params.stepoverPasses);
  assert.ok(params.collisionControl);
  assert.ok(params.linkingParameters);
  assert.ok(params.machineKinematics);
  assert.ok(params.arcFilter);
  assert.ok(params.planesCoolant);
});

test('resolveDefaultRotaryTool selects appropriate tool from inventory', () => {
  const tools = [
    { id: 1, name: '50mm Face Mill', type: 'face', diameter: 50 },
    { id: 2, name: '10mm Flat Endmill', type: 'flat', diameter: 10 },
    { id: 3, name: '6mm Ballnose', type: 'ball', diameter: 6 }
  ];
  const selected = resolveDefaultRotaryTool(tools);
  assert.ok(selected);
  assert.strictEqual(selected.diameter, 6); // prefers ball <= 12mm
});

test('ROTARY_4AXIS_PRESETS all contain valid parameters', () => {
  const presets = Object.values(ROTARY_4AXIS_PRESETS);
  assert.strictEqual(presets.length, 4);
  presets.forEach((pr) => {
    assert.ok(pr.id);
    assert.ok(pr.name);
    assert.ok(pr.machiningStyle);
    assert.ok(pr.cylinderDiameter > 0);
    assert.ok(pr.spindleSpeed > 0);
    assert.ok(pr.feedRate > 0);
  });
});

// ========================================================
// 2. Physics & Kinematics Calculations
// ========================================================
console.log('\n--- Group 2: Physics & Kinematics Calculations ---');

test('calculateRotary4AxisPhysics calculates correct Vc and rotary feed deg/min', () => {
  // D_cyl = 60mm, D_tool = 10mm, N = 10000 RPM, F_lin = 2000 mm/min
  const phys = calculateRotary4AxisPhysics({
    cylinderDiameter: 60.0,
    toolDiameter: 10.0,
    spindleRpm: 10000,
    feedLinearMmMin: 2000,
    stepoverMm: 1.0,
    depthOfCutMm: 2.0,
    materialKey: 'ALU_6061'
  });

  // Tool Vc = pi * 10 * 10000 / 1000 = 314.159 m/min
  assert.ok(Math.abs(phys.toolVcMMin - 314.2) < 0.5);

  // Circumference = pi * 60 = 188.495 mm
  assert.ok(Math.abs(phys.cylinderCircumferenceMm - 188.5) < 0.5);

  // Rotary Feed = (360 * 2000) / 188.495 = 3819.7 deg/min
  assert.ok(Math.abs(phys.rotaryFeedDegMin - 3819.7) < 2.0);

  // Power and cutting force must be positive
  assert.ok(phys.spindlePowerKw > 0);
  assert.ok(phys.cuttingForceN > 0);
});

test('calculateRecommendedRotarySettings computes valid speeds and feeds for all materials', () => {
  Object.keys(ROTARY_4AXIS_MATERIALS).forEach((matKey) => {
    const rec = calculateRecommendedRotarySettings({
      materialKey: matKey,
      tool: { diameter: 10, flutes: 2 },
      cylinderDiameter: 60.0
    });
    assert.ok(rec.spindleSpeed >= 1200 && rec.spindleSpeed <= 24000);
    assert.ok(rec.feedRate >= 200 && rec.feedRate <= 8000);
    assert.ok(rec.plungeRate > 0);
    assert.ok(rec.stepoverDeg > 0);
  });
});

// ========================================================
// 3. Cylindrical Axis Wrapping & Unwrapping
// ========================================================
console.log('\n--- Group 3: Cylindrical Axis Wrapping & Geometry ---');

test('wrapPlanarToCylinder maps Y=0 to A=0 deg', () => {
  const wrapped = wrapPlanarToCylinder(15.0, 0.0, 2.0, 30.0, 0.0);
  assert.strictEqual(wrapped.aDeg, 0.0);
  assert.strictEqual(wrapped.machinePos.a, 0.0);
  assert.strictEqual(wrapped.partPos.x, 15.0);
  // At A=0, Y=0, Z=R_cut (30 - 2 = 28)
  assert.strictEqual(wrapped.partPos.y, 0.0);
  assert.strictEqual(wrapped.partPos.z, 28.0);
});

test('wrapPlanarToCylinder maps Y = circumference / 4 to A = 90 deg', () => {
  const R_cyl = 30.0;
  const circum = 2.0 * Math.PI * R_cyl;
  const yQuarter = circum / 4.0;

  const wrapped = wrapPlanarToCylinder(20.0, yQuarter, 2.0, R_cyl, 0.0);
  assert.ok(Math.abs(wrapped.aDeg - 90.0) < 0.01);
  // At A=90 deg: sin(90)=1, cos(90)=0 -> Y = 28, Z = 0
  assert.ok(Math.abs(wrapped.partPos.y - 28.0) < 0.01);
  assert.ok(Math.abs(wrapped.partPos.z - 0.0) < 0.01);
});

test('wrapPlanarToCylinder maps full circumference to A = 360 deg', () => {
  const R_cyl = 30.0;
  const circum = 2.0 * Math.PI * R_cyl;

  const wrapped = wrapPlanarToCylinder(10.0, circum, 2.0, R_cyl, 0.0);
  assert.ok(Math.abs(wrapped.aDeg - 360.0) < 0.01);
});

test('buildRotaryBlendLoop lifts radially over cylinder clearance', () => {
  const pEnd = { x: 50.0, aDeg: 0.0, radius: 28.0, feedRate: 2000 };
  const pStartNext = { x: 50.0, aDeg: 10.0, radius: 28.0, feedRate: 2000 };

  const loop = buildRotaryBlendLoop(pEnd, pStartNext, 30.0, 3.0, 8);
  assert.strictEqual(loop.length, 7);
  // Midpoint radius must exceed cylinder radius (30.0) + clearance lift
  const midPt = loop[3];
  const midR = Math.sqrt(midPt.y * midPt.y + midPt.z * midPt.z);
  assert.ok(midR > 30.0, `Midpoint radius ${midR} should exceed cylinder radius 30.0`);
  assert.strictEqual(midPt.isLinking, true);
});

// ========================================================
// 4. Toolpath Generation for All 3 Rotary Modes
// ========================================================
console.log('\n--- Group 4: Toolpath Generation ---');

test('generateRotary4AxisToolpath generates valid Axis Substitution path', () => {
  const params = createDefaultRotary4AxisParams();
  params.cutPattern.machiningStyle = 'axis_substitution';
  params.cutPattern.cylinderDiameter = 60.0;

  const tp = generateRotary4AxisToolpath(params);
  assert.ok(tp.points.length > 50);
  assert.ok(tp.vectorNeedles.length > 10);
  assert.ok(tp.contactRibbonVertices.length > 50);
  assert.strictEqual(tp.stats.machiningStyle, 'axis_substitution');
  assert.ok(tp.physics.rotaryFeedDegMin > 0);
});

test('generateRotary4AxisToolpath generates valid Axial multi-pass path', () => {
  const params = createDefaultRotary4AxisParams();
  params.cutPattern.machiningStyle = 'axial';
  params.stepoverPasses.stepoverDeg = 15.0; // 360 / 15 = 24 passes

  const tp = generateRotary4AxisToolpath(params);
  assert.ok(tp.points.length > 100);
  assert.strictEqual(tp.stats.machiningStyle, 'axial');
});

test('generateRotary4AxisToolpath generates valid Continuous Spiral path', () => {
  const params = createDefaultRotary4AxisParams();
  params.cutPattern.machiningStyle = 'spiral';
  params.stepoverPasses.stepoverMm = 2.0;

  const tp = generateRotary4AxisToolpath(params);
  assert.ok(tp.points.length > 100);
  assert.strictEqual(tp.stats.machiningStyle, 'spiral');
});

// ========================================================
// 5. Multi-Dialect G-Code Generation & Y-Offset
// ========================================================
console.log('\n--- Group 5: Multi-Dialect G-Code Generation & Advanced Kinematics ---');

test('wrapPlanarToCylinder handles tangential Y-offset correctly', () => {
  const wrapped = wrapPlanarToCylinder(0.0, 0.0, 0.0, 30.0, 2.5);
  // Machine Y should equal yOffset
  assert.strictEqual(wrapped.machinePos.y, 2.5);
  // Part Y should include offset component
  assert.strictEqual(wrapped.partPos.y, 2.5);
});

test('generateRotary4AxisToolpath incorporates Y-offset into machine coordinates', () => {
  const params = createDefaultRotary4AxisParams();
  params.axisControl.cutterOffsetMethod = 'y_offset';
  params.axisControl.yOffsetDistanceMm = 3.0;

  const tp = generateRotary4AxisToolpath(params);
  const cuttingPts = tp.points.filter(p => p.isCutting && p.machinePos);
  assert.ok(cuttingPts.length > 0);
  assert.strictEqual(cuttingPts[0].machinePos.y, 3.0);
});

test('generateRotary4AxisGCode produces valid Fanuc G-code with G107', () => {
  const params = createDefaultRotary4AxisParams();
  params.machineKinematics.postDialect = 'fanuc';
  params.machineKinematics.cylindricalInterpEnabled = true;

  const tp = generateRotary4AxisToolpath(params);
  const gcode = generateRotary4AxisGCode(tp, params);

  assert.ok(gcode.includes('O0001 (4AXIS_ROTARY_CYLINDRICAL_PART)'));
  assert.ok(gcode.includes('G90 G21 G17 G54 G94'));
  assert.ok(gcode.includes('G28 G91 A0.'));
  assert.ok(gcode.includes('G107 C30.000'));
  assert.ok(gcode.includes('G107 C0')); // Cancel
  assert.ok(gcode.includes('M30'));
  assert.ok(gcode.includes('A')); // Contains A-axis commands
});

test('generateRotary4AxisGCode produces valid Haas G-code with G93 Inverse Time', () => {
  const params = createDefaultRotary4AxisParams();
  params.machineKinematics.postDialect = 'haas';
  params.machineKinematics.feedMode = 'inverse_time';

  const tp = generateRotary4AxisToolpath(params);
  const gcode = generateRotary4AxisGCode(tp, params);

  assert.ok(gcode.includes('G93 (INVERSE TIME FEED MODE ON)'));
  assert.ok(gcode.includes('G94 (RESTORE FEED PER MINUTE MODE)'));
  assert.ok(gcode.includes('M30'));
});

test('generateRotary4AxisGCode includes AICC II lookahead when enabled', () => {
  const params = createDefaultRotary4AxisParams();
  params.machineKinematics.postDialect = 'fanuc';
  params.machineKinematics.enableAICC2Lookahead = true;

  const tp = generateRotary4AxisToolpath(params);
  const gcode = generateRotary4AxisGCode(tp, params);

  assert.ok(gcode.includes('G05.1 Q1 (HIGH SPEED AICC II LOOK-AHEAD)'));
  assert.ok(gcode.includes('G05.1 Q0 (AICC II OFF)'));
});

test('generateRotary4AxisGCode terminates cleanly with spindle stop and homing', () => {
  const params = createDefaultRotary4AxisParams();
  const tp = generateRotary4AxisToolpath(params);
  const gcode = generateRotary4AxisGCode(tp, params);

  assert.ok(gcode.includes('M05'));
  assert.ok(gcode.includes('G28 G91 Z0.'));
  assert.ok(gcode.includes('G28 G91 A0.'));
  assert.ok(gcode.includes('M30'));
});

console.log(`\n🎉 All ${passCount} tests passed successfully (100%)!\n`);
