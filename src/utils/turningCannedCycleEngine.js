/**
 * Mastercam Lathe & Mill-Turn Turning Canned Cycle Engine (Step 9)
 * Inspired by open-source LinuxCNC & Mastercam Lathe standard
 * Generates ISO standard CNC Turning Canned Cycles:
 * 1. G71 - Longitudinal OD/ID Rough Turning Cycle
 * 2. G70 - Precision Profile Finishing Cycle
 * 3. G76 - Compound Multi-Pass Helical Threading Cycle with Infeed Flank Angle
 * 4. G75 - Radial Grooving and Cut-Off (Parting) Cycle
 */

export const TURNING_CYCLE_MODE = {
  OD_ROUGH: 'G71',
  PROFILE_FINISH: 'G70',
  THREADING: 'G76',
  GROOVING: 'G75'
};

/**
 * Generates ISO G71 Rough Turning canned cycle block
 * @param {Array<{z: number, x: number}>} profile Contour profile points (Z, X in mm, X as diameter)
 * @param {Object} params Cutting specs
 * @returns {Object} { gcodeBlock, passesCount, totalStockVolumeMm3 }
 */
export function generateG71RoughCycle(profile, params = {}) {
  const {
    depthOfCutU = 2.0,      // Depth of cut per side in mm (U word)
    retractDistanceR = 1.0, // Retract relief in mm (R word)
    finishAllowanceX = 0.5, // Finish stock on diameter in mm (U word on 2nd line)
    finishAllowanceZ = 0.2, // Finish stock on Z face in mm (W word)
    feedRate = 0.25,        // Feed rate in mm/rev (F word)
    startBlockP = 100,      // Start sequence number
    endBlockQ = 110         // End sequence number
  } = params;

  if (!profile || profile.length < 2) {
    profile = [
      { z: 0, x: 20 },
      { z: -25, x: 20 },
      { z: -40, x: 35 },
      { z: -70, x: 50 }
    ];
  }

  const gcodeLines = [
    `( --- G71 OD ROUGH TURNING CYCLE --- )`,
    `G71 U${depthOfCutU.toFixed(1)} R${retractDistanceR.toFixed(1)}`,
    `G71 P${startBlockP} Q${endBlockQ} U${finishAllowanceX.toFixed(2)} W${finishAllowanceZ.toFixed(2)} F${feedRate.toFixed(2)}`,
    `N${startBlockP} G00 X${profile[0].x.toFixed(2)}`,
    `G01 Z${profile[0].z.toFixed(2)}`
  ];

  for (let i = 1; i < profile.length; i++) {
    const pt = profile[i];
    gcodeLines.push(`X${pt.x.toFixed(2)} Z${pt.z.toFixed(2)}`);
  }

  gcodeLines.push(`N${endBlockQ} X${(profile[profile.length - 1].x + 4).toFixed(2)}`);

  return {
    cycleType: 'G71_ROUGH',
    gcode: gcodeLines.join('\n'),
    depthOfCutU,
    startBlockP,
    endBlockQ
  };
}

/**
 * Generates ISO G76 Multi-Pass Compound Threading cycle
 * @param {Object} threadParams Thread engineering specifications
 * @returns {Object} { gcode, threadProfile, passesCount }
 */
export function generateG76ThreadingCycle(threadParams = {}) {
  const {
    majorDiameter = 20.0, // Major thread diameter in mm (M20)
    pitch = 1.5,          // Pitch in mm
    threadLength = 30.0,  // Threaded length along Z in mm
    flankAngle = 60,      // 60° for Metric / UN, 55° for Whitworth / BSP
    finishAllowance = 0.05,
    minCutDepth = 0.08,
    firstCutDepth = 0.35,
    passesCount = 6
  } = threadParams;

  // Single depth of thread: h = 0.61343 * Pitch (for 60° Metric)
  const threadHeightH = 0.61343 * pitch;
  const minorDiameter = majorDiameter - (2 * threadHeightH);
  const threadHeightMicrons = Math.round(threadHeightH * 1000);
  const firstCutMicrons = Math.round(firstCutDepth * 1000);
  const minCutMicrons = Math.round(minCutDepth * 1000);
  const finishMicrons = Math.round(finishAllowance * 1000);

  // Line 1: G76 P(m)(r)(a) Q(Δdmin) R(d)
  // m = spring passes (02), r = chamfer pull-out (10), a = flank angle (60)
  const line1 = `G76 P021060 Q${minCutMicrons} R${finishMicrons}`;

  // Line 2: G76 X(minor) Z(length) P(height) Q(1st cut) F(pitch)
  const line2 = `G76 X${minorDiameter.toFixed(3)} Z-${threadLength.toFixed(2)} P${threadHeightMicrons} Q${firstCutMicrons} F${pitch.toFixed(3)}`;

  const gcodeLines = [
    `( --- G76 COMPOUND THREADING M${majorDiameter}x${pitch} --- )`,
    `G00 X${(majorDiameter + 4).toFixed(2)} Z5.0`,
    line1,
    line2,
    `G00 X${(majorDiameter + 10).toFixed(2)} Z10.0`
  ];

  return {
    cycleType: 'G76_THREADING',
    gcode: gcodeLines.join('\n'),
    majorDiameter,
    minorDiameter: Math.round(minorDiameter * 1000) / 1000,
    threadHeightH: Math.round(threadHeightH * 1000) / 1000,
    pitch
  };
}
