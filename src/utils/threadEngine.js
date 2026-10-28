/**
 * Argus CAM Feature-Based Thread Milling & Tapping Engine
 * 
 * Supports:
 * - ISO Metric Coarse & Fine threads (M2 to M36)
 * - Imperial Unified National Coarse (UNC) & Fine (UNF) (#4 to 1")
 * - National Pipe Tapered (NPT) & British Standard Pipe (BSPP)
 * - Automatic hole matching: Maps CAD cylindrical bores to standard tap drill sizes
 * - Helical thread milling toolpath generation (G02/G03 with continuous Z ramp)
 * - Single-form 60° thread mills & Multi-form (multi-tooth) thread mills
 * - Tangential 90° & 180° helical roll-in / roll-out arc entries to protect thread crests
 * - Multi-pass radial stepover scheduling (roughing + spring/finish passes for 6H/2B tolerance)
 * - Climb milling (bottom-to-top RH) vs Conventional milling (top-to-bottom)
 * - Rigid tapping cycles (G84 / G74) with synchronized feed F = RPM * Pitch
 * - Precision tapping torque & tool deflection physics calculators
 */

// ============================================================================
// COMPREHENSIVE INDUSTRIAL THREAD CATALOG
// ============================================================================

export const THREAD_CATALOG = {
  // --------------------------------------------------------------------------
  // ISO METRIC COARSE THREADS (ISO 261 / ISO 965-1, 60° Angle)
  // --------------------------------------------------------------------------
  METRIC_COARSE: [
    { id: 'M3x0.5', name: 'M3 x 0.5', majorDia: 3.0, pitch: 0.5, tapDrill: 2.5, minorDia: 2.387, pitchDia: 2.675, standard: 'ISO Metric', category: 'Metric Coarse', angleDeg: 60 },
    { id: 'M4x0.7', name: 'M4 x 0.7', majorDia: 4.0, pitch: 0.7, tapDrill: 3.3, minorDia: 3.141, pitchDia: 3.545, standard: 'ISO Metric', category: 'Metric Coarse', angleDeg: 60 },
    { id: 'M5x0.8', name: 'M5 x 0.8', majorDia: 5.0, pitch: 0.8, tapDrill: 4.2, minorDia: 4.019, pitchDia: 4.480, standard: 'ISO Metric', category: 'Metric Coarse', angleDeg: 60 },
    { id: 'M6x1.0', name: 'M6 x 1.0', majorDia: 6.0, pitch: 1.0, tapDrill: 5.0, minorDia: 4.773, pitchDia: 5.350, standard: 'ISO Metric', category: 'Metric Coarse', angleDeg: 60 },
    { id: 'M8x1.25', name: 'M8 x 1.25', majorDia: 8.0, pitch: 1.25, tapDrill: 6.8, minorDia: 6.466, pitchDia: 7.188, standard: 'ISO Metric', category: 'Metric Coarse', angleDeg: 60 },
    { id: 'M10x1.5', name: 'M10 x 1.5', majorDia: 10.0, pitch: 1.5, tapDrill: 8.5, minorDia: 8.160, pitchDia: 9.026, standard: 'ISO Metric', category: 'Metric Coarse', angleDeg: 60 },
    { id: 'M12x1.75', name: 'M12 x 1.75', majorDia: 12.0, pitch: 1.75, tapDrill: 10.2, minorDia: 9.853, pitchDia: 10.863, standard: 'ISO Metric', category: 'Metric Coarse', angleDeg: 60 },
    { id: 'M14x2.0', name: 'M14 x 2.0', majorDia: 14.0, pitch: 2.0, tapDrill: 12.0, minorDia: 11.546, pitchDia: 12.701, standard: 'ISO Metric', category: 'Metric Coarse', angleDeg: 60 },
    { id: 'M16x2.0', name: 'M16 x 2.0', majorDia: 16.0, pitch: 2.0, tapDrill: 14.0, minorDia: 13.546, pitchDia: 14.701, standard: 'ISO Metric', category: 'Metric Coarse', angleDeg: 60 },
    { id: 'M20x2.5', name: 'M20 x 2.5', majorDia: 20.0, pitch: 2.5, tapDrill: 17.5, minorDia: 16.933, pitchDia: 18.376, standard: 'ISO Metric', category: 'Metric Coarse', angleDeg: 60 },
    { id: 'M24x3.0', name: 'M24 x 3.0', majorDia: 24.0, pitch: 3.0, tapDrill: 21.0, minorDia: 20.319, pitchDia: 22.051, standard: 'ISO Metric', category: 'Metric Coarse', angleDeg: 60 },
    { id: 'M30x3.5', name: 'M30 x 3.5', majorDia: 30.0, pitch: 3.5, tapDrill: 26.5, minorDia: 25.706, pitchDia: 27.727, standard: 'ISO Metric', category: 'Metric Coarse', angleDeg: 60 },
    { id: 'M36x4.0', name: 'M36 x 4.0', majorDia: 36.0, pitch: 4.0, tapDrill: 32.0, minorDia: 31.093, pitchDia: 33.402, standard: 'ISO Metric', category: 'Metric Coarse', angleDeg: 60 }
  ],

  // --------------------------------------------------------------------------
  // ISO METRIC FINE THREADS
  // --------------------------------------------------------------------------
  METRIC_FINE: [
    { id: 'M8x1.0', name: 'M8 x 1.0 (Fine)', majorDia: 8.0, pitch: 1.0, tapDrill: 7.0, minorDia: 6.773, pitchDia: 7.350, standard: 'ISO Metric', category: 'Metric Fine', angleDeg: 60 },
    { id: 'M10x1.0', name: 'M10 x 1.0 (Fine)', majorDia: 10.0, pitch: 1.0, tapDrill: 9.0, minorDia: 8.773, pitchDia: 9.350, standard: 'ISO Metric', category: 'Metric Fine', angleDeg: 60 },
    { id: 'M10x1.25', name: 'M10 x 1.25 (Fine)', majorDia: 10.0, pitch: 1.25, tapDrill: 8.8, minorDia: 8.466, pitchDia: 9.188, standard: 'ISO Metric', category: 'Metric Fine', angleDeg: 60 },
    { id: 'M12x1.25', name: 'M12 x 1.25 (Fine)', majorDia: 12.0, pitch: 1.25, tapDrill: 10.8, minorDia: 10.466, pitchDia: 11.188, standard: 'ISO Metric', category: 'Metric Fine', angleDeg: 60 },
    { id: 'M12x1.5', name: 'M12 x 1.5 (Fine)', majorDia: 12.0, pitch: 1.5, tapDrill: 10.5, minorDia: 10.160, pitchDia: 11.026, standard: 'ISO Metric', category: 'Metric Fine', angleDeg: 60 },
    { id: 'M16x1.5', name: 'M16 x 1.5 (Fine)', majorDia: 16.0, pitch: 1.5, tapDrill: 14.5, minorDia: 14.160, pitchDia: 15.026, standard: 'ISO Metric', category: 'Metric Fine', angleDeg: 60 },
    { id: 'M20x1.5', name: 'M20 x 1.5 (Fine)', majorDia: 20.0, pitch: 1.5, tapDrill: 18.5, minorDia: 18.160, pitchDia: 19.026, standard: 'ISO Metric', category: 'Metric Fine', angleDeg: 60 }
  ],

  // --------------------------------------------------------------------------
  // UNIFIED NATIONAL COARSE (UNC / ASME B1.1, 60° Angle)
  // --------------------------------------------------------------------------
  UNC: [
    { id: 'UNC_4_40', name: '#4-40 UNC', majorDia: 2.845, pitch: 25.4 / 40, tpi: 40, tapDrill: 2.35, minorDia: 2.156, pitchDia: 2.433, standard: 'ASME UNC', category: 'Imperial UNC', angleDeg: 60 },
    { id: 'UNC_6_32', name: '#6-32 UNC', majorDia: 3.505, pitch: 25.4 / 32, tpi: 32, tapDrill: 2.85, minorDia: 2.642, pitchDia: 2.990, standard: 'ASME UNC', category: 'Imperial UNC', angleDeg: 60 },
    { id: 'UNC_8_32', name: '#8-32 UNC', majorDia: 4.166, pitch: 25.4 / 32, tpi: 32, tapDrill: 3.50, minorDia: 3.302, pitchDia: 3.650, standard: 'ASME UNC', category: 'Imperial UNC', angleDeg: 60 },
    { id: 'UNC_10_24', name: '#10-24 UNC', majorDia: 4.826, pitch: 25.4 / 24, tpi: 24, tapDrill: 3.90, minorDia: 3.683, pitchDia: 4.138, standard: 'ASME UNC', category: 'Imperial UNC', angleDeg: 60 },
    { id: 'UNC_1_4_20', name: '1/4"-20 UNC', majorDia: 6.350, pitch: 25.4 / 20, tpi: 20, tapDrill: 5.10, minorDia: 4.978, pitchDia: 5.524, standard: 'ASME UNC', category: 'Imperial UNC', angleDeg: 60 },
    { id: 'UNC_5_16_18', name: '5/16"-18 UNC', majorDia: 7.938, pitch: 25.4 / 18, tpi: 18, tapDrill: 6.60, minorDia: 6.426, pitchDia: 7.021, standard: 'ASME UNC', category: 'Imperial UNC', angleDeg: 60 },
    { id: 'UNC_3_8_16', name: '3/8"-16 UNC', majorDia: 9.525, pitch: 25.4 / 16, tpi: 16, tapDrill: 8.00, minorDia: 7.823, pitchDia: 8.494, standard: 'ASME UNC', category: 'Imperial UNC', angleDeg: 60 },
    { id: 'UNC_7_16_14', name: '7/16"-14 UNC', majorDia: 11.112, pitch: 25.4 / 14, tpi: 14, tapDrill: 9.40, minorDia: 9.169, pitchDia: 9.934, standard: 'ASME UNC', category: 'Imperial UNC', angleDeg: 60 },
    { id: 'UNC_1_2_13', name: '1/2"-13 UNC', majorDia: 12.700, pitch: 25.4 / 13, tpi: 13, tapDrill: 10.80, minorDia: 10.617, pitchDia: 11.430, standard: 'ASME UNC', category: 'Imperial UNC', angleDeg: 60 },
    { id: 'UNC_5_8_11', name: '5/8"-11 UNC', majorDia: 15.875, pitch: 25.4 / 11, tpi: 11, tapDrill: 13.50, minorDia: 13.386, pitchDia: 14.376, standard: 'ASME UNC', category: 'Imperial UNC', angleDeg: 60 },
    { id: 'UNC_3_4_10', name: '3/4"-10 UNC', majorDia: 19.050, pitch: 25.4 / 10, tpi: 10, tapDrill: 16.50, minorDia: 16.307, pitchDia: 17.399, standard: 'ASME UNC', category: 'Imperial UNC', angleDeg: 60 },
    { id: 'UNC_1_8', name: '1"-8 UNC', majorDia: 25.400, pitch: 25.4 / 8, tpi: 8, tapDrill: 22.25, minorDia: 21.971, pitchDia: 23.338, standard: 'ASME UNC', category: 'Imperial UNC', angleDeg: 60 }
  ],

  // --------------------------------------------------------------------------
  // UNIFIED NATIONAL FINE (UNF / ASME B1.1)
  // --------------------------------------------------------------------------
  UNF: [
    { id: 'UNF_10_32', name: '#10-32 UNF', majorDia: 4.826, pitch: 25.4 / 32, tpi: 32, tapDrill: 4.10, minorDia: 3.962, pitchDia: 4.310, standard: 'ASME UNF', category: 'Imperial UNF', angleDeg: 60 },
    { id: 'UNF_1_4_28', name: '1/4"-28 UNF', majorDia: 6.350, pitch: 25.4 / 28, tpi: 28, tapDrill: 5.50, minorDia: 5.385, pitchDia: 5.761, standard: 'ASME UNF', category: 'Imperial UNF', angleDeg: 60 },
    { id: 'UNF_5_16_24', name: '5/16"-24 UNF', majorDia: 7.938, pitch: 25.4 / 24, tpi: 24, tapDrill: 6.90, minorDia: 6.782, pitchDia: 7.249, standard: 'ASME UNF', category: 'Imperial UNF', angleDeg: 60 },
    { id: 'UNF_3_8_24', name: '3/8"-24 UNF', majorDia: 9.525, pitch: 25.4 / 24, tpi: 24, tapDrill: 8.50, minorDia: 8.382, pitchDia: 8.837, standard: 'ASME UNF', category: 'Imperial UNF', angleDeg: 60 },
    { id: 'UNF_1_2_20', name: '1/2"-20 UNF', majorDia: 12.700, pitch: 25.4 / 20, tpi: 20, tapDrill: 11.50, minorDia: 11.328, pitchDia: 11.875, standard: 'ASME UNF', category: 'Imperial UNF', angleDeg: 60 }
  ],

  // --------------------------------------------------------------------------
  // NATIONAL PIPE TAPER (NPT / ANSI/ASME B1.20.1, 1°47' Taper)
  // --------------------------------------------------------------------------
  NPT: [
    { id: 'NPT_1_8', name: '1/8"-27 NPT', majorDia: 10.242, pitch: 25.4 / 27, tpi: 27, tapDrill: 8.70, minorDia: 8.43, pitchDia: 9.489, standard: 'ASME NPT', category: 'Tapered Pipe', angleDeg: 60, taper: '1:16' },
    { id: 'NPT_1_4', name: '1/4"-18 NPT', majorDia: 13.616, pitch: 25.4 / 18, tpi: 18, tapDrill: 11.10, minorDia: 10.74, pitchDia: 12.487, standard: 'ASME NPT', category: 'Tapered Pipe', angleDeg: 60, taper: '1:16' },
    { id: 'NPT_3_8', name: '3/8"-18 NPT', majorDia: 17.055, pitch: 25.4 / 18, tpi: 18, tapDrill: 14.50, minorDia: 14.15, pitchDia: 15.926, standard: 'ASME NPT', category: 'Tapered Pipe', angleDeg: 60, taper: '1:16' },
    { id: 'NPT_1_2', name: '1/2"-14 NPT', majorDia: 21.223, pitch: 25.4 / 14, tpi: 14, tapDrill: 17.80, minorDia: 17.47, pitchDia: 19.771, standard: 'ASME NPT', category: 'Tapered Pipe', angleDeg: 60, taper: '1:16' },
    { id: 'NPT_3_4', name: '3/4"-14 NPT', majorDia: 26.568, pitch: 25.4 / 14, tpi: 14, tapDrill: 23.00, minorDia: 22.79, pitchDia: 25.118, standard: 'ASME NPT', category: 'Tapered Pipe', angleDeg: 60, taper: '1:16' },
    { id: 'NPT_1', name: '1"-11.5 NPT', majorDia: 33.228, pitch: 25.4 / 11.5, tpi: 11.5, tapDrill: 29.00, minorDia: 28.52, pitchDia: 31.460, standard: 'ASME NPT', category: 'Tapered Pipe', angleDeg: 60, taper: '1:16' }
  ]
};

// Flattened list for quick lookup
export const ALL_THREADS = [
  ...THREAD_CATALOG.METRIC_COARSE,
  ...THREAD_CATALOG.METRIC_FINE,
  ...THREAD_CATALOG.UNC,
  ...THREAD_CATALOG.UNF,
  ...THREAD_CATALOG.NPT
];

// ============================================================================
// STANDARD THREAD MILL & TAP TOOLING CATALOG
// ============================================================================

export const THREAD_TOOL_PRESETS = [
  {
    id: 'TM_SINGLE_D6',
    name: 'Solid Carbide Single-Form 60° Thread Mill D6',
    type: 'Single-Form Thread Mill',
    diameter: 6.0,
    flutes: 3,
    toothHeight: 1.5,
    shankDia: 6.0,
    overallLength: 57.0,
    cutLength: 12.0,
    coating: 'AlTiN PVD',
    minThreadDia: 8.0,
    minPitch: 0.5,
    maxPitch: 2.0,
    recommendedVc: 120, // m/min
    feedPerTooth: 0.035, // mm/tooth
    badge: 'Universal 60° Single-Point',
    badgeColor: '#38bdf8'
  },
  {
    id: 'TM_MULTI_M6_D4_8',
    name: 'Solid Carbide Multi-Form Thread Mill M6x1.0 D4.8',
    type: 'Multi-Form Thread Mill',
    diameter: 4.8,
    flutes: 3,
    toothHeight: 1.0,
    shankDia: 6.0,
    overallLength: 57.0,
    cutLength: 14.0,
    pitch: 1.0,
    coating: 'TiAlN Extreme',
    minThreadDia: 6.0,
    minPitch: 1.0,
    maxPitch: 1.0,
    recommendedVc: 140,
    feedPerTooth: 0.040,
    badge: 'High Speed 1-Rev Full Thread',
    badgeColor: '#10b981'
  },
  {
    id: 'TM_MULTI_M8_D6_2',
    name: 'Solid Carbide Multi-Form Thread Mill M8x1.25 D6.2',
    type: 'Multi-Form Thread Mill',
    diameter: 6.2,
    flutes: 4,
    toothHeight: 1.25,
    shankDia: 8.0,
    overallLength: 63.0,
    cutLength: 18.0,
    pitch: 1.25,
    coating: 'AlTiN Micro',
    minThreadDia: 8.0,
    minPitch: 1.25,
    maxPitch: 1.25,
    recommendedVc: 130,
    feedPerTooth: 0.045,
    badge: 'High Speed M8 Multi-Tooth',
    badgeColor: '#10b981'
  },
  {
    id: 'TM_SINGLE_D10',
    name: 'Heavy Duty Single-Form 60° Thread Mill D10',
    type: 'Single-Form Thread Mill',
    diameter: 10.0,
    flutes: 4,
    toothHeight: 2.5,
    shankDia: 10.0,
    overallLength: 73.0,
    cutLength: 22.0,
    coating: 'TiSiN Nanocomposite',
    minThreadDia: 12.0,
    minPitch: 0.75,
    maxPitch: 3.5,
    recommendedVc: 110,
    feedPerTooth: 0.050,
    badge: 'Large Diameter Rigidity',
    badgeColor: '#a855f7'
  },
  {
    id: 'TAP_SPIRAL_FLUTE_M8',
    name: 'HSS-E-PM Spiral Flute Machine Tap M8x1.25',
    type: 'Spiral Flute Tap',
    diameter: 8.0,
    flutes: 3,
    helixAngleDeg: 45,
    shankDia: 6.2,
    overallLength: 90.0,
    pitch: 1.25,
    coating: 'TiN Gold',
    recommendedVc: 25,
    badge: 'Blind Hole Rigid Tapping G84',
    badgeColor: '#f59e0b'
  },
  {
    id: 'TAP_SPIRAL_POINT_M6',
    name: 'HSS-Co Spiral Point Gun Tap M6x1.0',
    type: 'Spiral Point Gun Tap',
    diameter: 6.0,
    flutes: 2,
    helixAngleDeg: 0,
    shankDia: 6.0,
    overallLength: 80.0,
    pitch: 1.0,
    coating: 'Vaporized Steam Oxide',
    recommendedVc: 28,
    badge: 'Through Hole Chip Push',
    badgeColor: '#f59e0b'
  }
];

// ============================================================================
// AUTOMATIC HOLE MATCHING & FEATURE RECOGNITION
// ============================================================================

/**
 * Matches a detected CAD cylindrical bore hole diameter to the best standard thread specification.
 * 
 * @param {number} holeDiameterMm - Measured bore hole diameter
 * @param {string} preferredStandard - 'METRIC_COARSE', 'UNC', 'UNF', or 'ALL'
 * @returns {Object} Best matching thread and deviation score
 */
export function matchHoleToThread(holeDiameterMm, preferredStandard = 'METRIC_COARSE') {
  let candidates = ALL_THREADS;
  if (preferredStandard !== 'ALL' && THREAD_CATALOG[preferredStandard]) {
    candidates = THREAD_CATALOG[preferredStandard];
  }

  let bestMatch = null;
  let minDiff = Infinity;

  for (const thread of candidates) {
    // Check difference against recommended tap drill size
    const diff = Math.abs(thread.tapDrill - holeDiameterMm);
    if (diff < minDiff) {
      minDiff = diff;
      bestMatch = thread;
    }
  }

  return {
    thread: bestMatch,
    holeDiameter: holeDiameterMm,
    recommendedTapDrill: bestMatch ? bestMatch.tapDrill : 0,
    differenceMm: parseFloat(minDiff.toFixed(3)),
    isExactMatch: minDiff <= 0.15,
    isCloseMatch: minDiff <= 0.40
  };
}

// ============================================================================
// HELICAL THREAD MILLING TOOLPATH GENERATOR (G02/G03 HELICAL INTERPOLATION)
// ============================================================================

/**
 * Generates continuous 3D helical interpolation thread milling toolpath points.
 * 
 * Strategy:
 * - Internal Thread, Right-Hand:
 *   Climb milling starts at BOTTOM of the thread (Z = -threadDepth) and ramps UPWARDS (Z -> 0).
 *   Helical roll-in arc tangentially enters the major/pitch radius.
 *   Tool circles counterclockwise (G03) advancing Z by pitch P per full 360° revolution.
 *   Helical roll-out arc tangentially leaves to center.
 * 
 * @param {Object} hole - Hole coordinate { x, y, z, radius, depth }
 * @param {Object} threadSpec - Thread definition (majorDia, pitch, minorDia, etc.)
 * @param {Object} toolSpec - Thread mill tool definition (diameter, type, etc.)
 * @param {Object} options - Passes, leadInAngle, climb, toleranceClass, etc.
 * @returns {Object} Toolpath data with 3D points, trajectory, cycle time, and diagnostics
 */
export function generateThreadMillingToolpath(hole, threadSpec, toolSpec, options = {}) {
  const {
    threadDepth = 15.0,             // total thread length (mm)
    threadType = 'internal',        // 'internal' (hole) | 'external' (boss/stud)
    threadHand = 'RH',              // 'RH' (Right-hand) | 'LH' (Left-hand)
    millingMode = 'climb',          // 'climb' (bottom-up for RH) | 'conventional' (top-down)
    radialPasses = 2,               // 1 to 4 radial passes (roughing + spring pass)
    leadInArcDeg = 180,             // 90° or 180° tangential helical roll-in
    rapidClearanceZ = 3.0,          // safety rapid clearance above top face (mm)
    spindleRpm = 4500,
    cutFeedMmMin = 480
  } = options;

  const toolDia = toolSpec.diameter || 6.0;
  const toolRadius = toolDia / 2.0;
  const pitch = threadSpec.pitch || 1.25;
  const majorRadius = (threadSpec.majorDia || 8.0) / 2.0;
  const pitchRadius = (threadSpec.pitchDia || 7.188) / 2.0;
  const minorRadius = (threadSpec.minorDia || 6.466) / 2.0;

  // Target cutting radius for cutter center path
  // In internal thread milling: tool center radius = MajorRadius - ToolRadius
  const targetCutterRadius = threadType === 'internal'
    ? Math.max(0.1, majorRadius - toolRadius)
    : majorRadius + toolRadius;

  const isInternal = threadType === 'internal';
  const isRH = threadHand === 'RH';
  const isClimb = millingMode === 'climb';

  // Multi-form thread mill cuts whole thread in only 1.25 revolutions!
  const isMultiForm = toolSpec.type === 'Multi-Form Thread Mill';
  const totalRevolutions = isMultiForm
    ? 1.25
    : Math.ceil(threadDepth / pitch) + 0.25;

  const centerPt = {
    x: hole.x || 0,
    y: hole.z || hole.y || 0 // Three.js Z corresponds to CNC Y coordinate
  };

  // 3D Toolpath trajectories array
  const points = [];
  const segments = [];

  // Radial stepover passes (e.g. 2 passes: 80% roughing, 100% finish pass)
  const passRatios = [];
  if (radialPasses === 1) {
    passRatios.push(1.0);
  } else if (radialPasses === 2) {
    passRatios.push(0.85, 1.0);
  } else if (radialPasses === 3) {
    passRatios.push(0.70, 0.90, 1.0);
  } else {
    passRatios.push(0.60, 0.80, 0.95, 1.0);
  }

  // Rapid travel to center point above hole
  points.push({ x: centerPt.x, y: centerPt.y, z: rapidClearanceZ, type: 'rapid' });

  passRatios.forEach((passRatio, passIdx) => {
    const currentRadius = targetCutterRadius * passRatio;
    const isFinishPass = passIdx === passRatios.length - 1;

    // Determine start and end Z heights
    // For Internal RH Climb Milling: Start at bottom, ramp up
    let startZ, endZ, zStepPerRev;
    if (isInternal && isRH && isClimb) {
      startZ = -threadDepth;
      endZ = 0.0;
      zStepPerRev = pitch; // upwards
    } else {
      startZ = 0.0;
      endZ = -threadDepth;
      zStepPerRev = -pitch; // downwards
    }

    // 1. Plunge down to start depth along center axis
    points.push({ x: centerPt.x, y: centerPt.y, z: startZ, type: 'rapid' });

    // 2. Tangential Helical Lead-In Arc (Roll-In)
    // Roll-in arc sweeps leadInArcDeg with a continuous Z ramp of (leadInArcDeg / 360) * pitch
    const leadInSteps = 16;
    const leadInZAdvance = (leadInArcDeg / 360.0) * (zStepPerRev / 2.0);
    const leadInRadius = currentRadius / 2.0;

    for (let i = 0; i <= leadInSteps; i++) {
      const t = i / leadInSteps;
      const angle = (t * (leadInArcDeg * Math.PI / 180.0));
      // Parametric arc from center (0,0) to (currentRadius, 0)
      const arcX = centerPt.x + leadInRadius * (1 - Math.cos(angle));
      const arcY = centerPt.y + leadInRadius * Math.sin(angle);
      const arcZ = startZ + t * leadInZAdvance;

      points.push({
        x: arcX,
        y: arcY,
        z: arcZ,
        type: isFinishPass ? 'leadInFinish' : 'leadInRough'
      });
    }

    // 3. Continuous 3D Helical Thread Milling Passes (G03 / G02)
    // 36 steps per full 360° circle for ultra-smooth 3D rendering
    const stepsPerRev = 36;
    const totalSteps = Math.round(totalRevolutions * stepsPerRev);

    let currentZ = startZ + leadInZAdvance;
    const zIncrementPerStep = zStepPerRev / stepsPerRev;

    for (let step = 0; step <= totalSteps; step++) {
      const angle = (step / stepsPerRev) * 2 * Math.PI;
      const helixX = centerPt.x + currentRadius * Math.cos(angle);
      const helixY = centerPt.y + currentRadius * Math.sin(angle);

      points.push({
        x: helixX,
        y: helixY,
        z: currentZ,
        type: isFinishPass ? 'threadCutFinish' : 'threadCutRough'
      });

      currentZ += zIncrementPerStep;
    }

    // 4. Tangential Helical Lead-Out Arc (Roll-Out back to center)
    const leadOutSteps = 16;
    const leadOutZAdvance = (leadInArcDeg / 360.0) * (zStepPerRev / 2.0);

    for (let i = 0; i <= leadOutSteps; i++) {
      const t = i / leadOutSteps;
      const angle = Math.PI - (t * (leadInArcDeg * Math.PI / 180.0));
      const arcX = centerPt.x + leadInRadius * (1 + Math.cos(angle));
      const arcY = centerPt.y + leadInRadius * Math.sin(angle);
      const arcZ = currentZ + t * leadOutZAdvance;

      points.push({
        x: arcX,
        y: arcY,
        z: arcZ,
        type: 'leadOut'
      });
    }

    // Return to center
    points.push({ x: centerPt.x, y: centerPt.y, z: currentZ + leadOutZAdvance, type: 'rapid' });
  });

  // Rapid retract to safety plane
  points.push({ x: centerPt.x, y: centerPt.y, z: rapidClearanceZ, type: 'rapid' });

  // Calculate Machining Physics & Cycle Time
  const toolCircumference = 2 * Math.PI * targetCutterRadius;
  const totalLinearTravel = (toolCircumference * totalRevolutions * radialPasses) + (radialPasses * 15.0); // mm
  const cutTimeSeconds = Math.max(3, Math.round((totalLinearTravel / cutFeedMmMin) * 60) + (radialPasses * 2));

  // Tapping Torque and Deflection
  const fluteCount = toolSpec.flutes || 3;
  const chipLoadFz = cutFeedMmMin / (spindleRpm * fluteCount);
  const radialDepthOfCutAe = (threadSpec.majorDia - threadSpec.minorDia) / (2 * radialPasses);
  
  // Cantilever beam deflection estimate: delta = (F * L^3) / (3 * E * I)
  // For solid carbide (E = 600 GPa)
  const cutForceN = 1800 * chipLoadFz * radialDepthOfCutAe * 1.5; // Tangential force approx
  const overhangMm = toolSpec.cutLength || 15.0;
  const momentOfInertiaI = (Math.PI * Math.pow(toolDia, 4)) / 64.0;
  const toolDeflectionUm = (cutForceN * Math.pow(overhangMm, 3)) / (3 * 600000 * momentOfInertiaI) * 1000.0;

  return {
    success: true,
    hole,
    threadSpec,
    toolSpec,
    options: {
      threadDepth,
      threadType,
      threadHand,
      millingMode,
      radialPasses,
      leadInArcDeg,
      spindleRpm,
      cutFeedMmMin
    },
    targetCutterRadius: parseFloat(targetCutterRadius.toFixed(3)),
    points,
    totalPoints: points.length,
    metrics: {
      totalRevolutions: parseFloat(totalRevolutions.toFixed(2)),
      totalLinearTravelMm: Math.round(totalLinearTravel),
      estimatedCycleTimeSec: cutTimeSeconds,
      chipLoadMmTooth: parseFloat(chipLoadFz.toFixed(4)),
      radialStepoverAeMm: parseFloat(radialDepthOfCutAe.toFixed(3)),
      cuttingForceN: Math.round(cutForceN),
      toolDeflectionUm: parseFloat(toolDeflectionUm.toFixed(2)),
      toleranceClass: 'ISO 6H / ASME 2B Precision Fit'
    }
  };
}

// ============================================================================
// RIGID TAPPING CYCLE GENERATOR (G84 / G74 SYNCHRONIZED CANNED CYCLE)
// ============================================================================

/**
 * Generates Rigid Tapping Canned Cycle (G84) simulation and G-code.
 * Synchronizes Feed = Spindle RPM * Thread Pitch.
 */
export function generateRigidTappingToolpath(hole, threadSpec, tapSpec, options = {}) {
  const {
    threadDepth = 15.0,
    spindleRpm = 650,
    rapidClearanceZ = 3.0,
    dwellBottomSec = 0.25,
    peckCount = 1
  } = options;

  const pitch = threadSpec.pitch || 1.25;
  const syncFeedMmMin = Math.round(spindleRpm * pitch);

  const centerPt = {
    x: hole.x || 0,
    y: hole.z || hole.y || 0
  };

  const points = [];
  // 1. Rapid above hole
  points.push({ x: centerPt.x, y: centerPt.y, z: rapidClearanceZ, type: 'rapid' });
  // 2. Rigid tap plunge down with synchronized feed
  points.push({ x: centerPt.x, y: centerPt.y, z: -threadDepth, type: 'tappingPlunge' });
  // 3. Spindle reversal & synchronized retract
  points.push({ x: centerPt.x, y: centerPt.y, z: rapidClearanceZ, type: 'tappingRetract' });

  // Tapping Torque Calculation: M = 0.5 * kc * (P^2) * D / 4
  // For medium alloy steel kc ≈ 2200 N/mm²
  const tappingTorqueNm = (0.5 * 2200 * Math.pow(pitch, 2) * threadSpec.majorDia) / 4000.0;
  const cycleTimeSec = Math.round(((threadDepth * 2) / syncFeedMmMin) * 60) + 2;

  return {
    success: true,
    hole,
    threadSpec,
    tapSpec,
    type: 'rigid_tapping',
    syncFeedMmMin,
    points,
    metrics: {
      syncFeedMmMin,
      spindleRpm,
      tappingTorqueNm: parseFloat(tappingTorqueNm.toFixed(2)),
      estimatedCycleTimeSec: cycleTimeSec,
      tapDrillSize: threadSpec.tapDrill
    }
  };
}

// ============================================================================
// CNC G-CODE GENERATION FOR THREAD MILLING & RIGID TAPPING
// ============================================================================

/**
 * Generates production-ready ISO CNC G-code with helical G02/G03 or G84 canned cycles.
 */
export function generateThreadGCode(toolpathResult, machineType = 'fanuc') {
  if (!toolpathResult) return '; Argus CAM - No thread toolpath data.';

  const { hole, threadSpec, toolSpec, options, metrics } = toolpathResult;
  const isTapping = toolpathResult.type === 'rigid_tapping';
  const majorDia = threadSpec.majorDia;
  const pitch = threadSpec.pitch;
  const threadDepth = options.threadDepth || 15.0;
  const safeZ = 5.0;
  const holeX = hole.x || 0;
  const holeY = hole.z || hole.y || 0;

  const lines = [
    `%`,
    `; ============================================================================`,
    `; ARGUS CAM MASTER THREAD STUDIO NC PROGRAM`,
    `; Operation: ${isTapping ? 'Rigid Tapping Canned Cycle (G84)' : 'Precision Helical Thread Milling (G03/G02)'}`,
    `; Thread Specification: ${threadSpec.name} (${threadSpec.category})`,
    `; Major Diameter: Ø${majorDia} mm | Pitch: ${pitch.toFixed(3)} mm | Tap Drill: Ø${threadSpec.tapDrill} mm`,
    `; Tool: ${toolSpec.name} (Ø${toolSpec.diameter}mm)`,
    `; Pitch Diameter: Ø${threadSpec.pitchDia} mm | Tolerance Class: ISO 6H / ASME 2B`,
    `; Target Depth: Z-${threadDepth.toFixed(2)} mm | Cycle Time: ${metrics.estimatedCycleTimeSec}s`,
    `; ============================================================================`,
    `G90 G21 G17 G94 G54 G40 G80 G49`,
    `G00 Z${safeZ.toFixed(2)}`,
    ``
  ];

  let n = 10;
  const nextN = () => {
    const s = `N${n}`;
    n += 10;
    return s;
  };

  if (isTapping) {
    // Rigid Tapping (G84)
    lines.push(`(Tool: M06 T05 - ${toolSpec.name})`);
    lines.push(`T05 M06`);
    lines.push(`S${options.spindleRpm || 650} M03`);
    lines.push(`M08 (Flood Coolant ON)`);
    lines.push(`G00 X${holeX.toFixed(3)} Y${holeY.toFixed(3)}`);
    lines.push(`G43 H05 Z${safeZ.toFixed(2)}`);
    lines.push(``);
    lines.push(`; RIGID TAPPING SYNCHRONIZED CANNED CYCLE`);
    lines.push(`M29 S${options.spindleRpm || 650} (Rigid Tap Sync Mode Enable)`);
    lines.push(`${nextN()} G84 X${holeX.toFixed(3)} Y${holeY.toFixed(3)} Z-${threadDepth.toFixed(3)} R2.000 F${metrics.syncFeedMmMin}.0 (Pitch Sync)`);
    lines.push(`${nextN()} G80 (Cancel Canned Cycle)`);
    lines.push(`M09`);
    lines.push(`G00 Z50.000 M05`);
  } else {
    // Helical Thread Milling (G03)
    const cutterRadius = toolpathResult.targetCutterRadius || (majorDia / 2 - toolSpec.diameter / 2);
    const rpm = options.spindleRpm || 4500;
    const feed = options.cutFeedMmMin || 480;
    const startZ = -(threadDepth);
    const revs = Math.ceil(threadDepth / pitch);

    lines.push(`(Tool: M06 T03 - ${toolSpec.name})`);
    lines.push(`T03 M06`);
    lines.push(`S${rpm} M03`);
    lines.push(`M08 (Flood Coolant ON)`);
    lines.push(`G00 X${holeX.toFixed(3)} Y${holeY.toFixed(3)}`);
    lines.push(`G43 H03 Z${safeZ.toFixed(2)}`);
    lines.push(``);

    for (let p = 1; p <= (options.radialPasses || 2); p++) {
      const isFinish = p === (options.radialPasses || 2);
      const passRatio = isFinish ? 1.0 : 0.85;
      const r = cutterRadius * passRatio;
      const leadInRadius = r / 2.0;

      lines.push(`; PASS ${p} of ${options.radialPasses || 2}: ${isFinish ? 'Finish Spring Pass (100% Dia)' : 'Roughing Pass (85% Dia)'}`);
      lines.push(`${nextN()} G00 Z${startZ.toFixed(3)} (Plunge down center)`);
      
      // Helical Lead-in
      lines.push(`${nextN()} G03 X${(holeX + r).toFixed(3)} Y${holeY.toFixed(3)} R${leadInRadius.toFixed(3)} Z${(startZ + pitch / 2).toFixed(3)} F${Math.round(feed * 0.75)} (Helical Roll-In)`);

      // Continuous 360 Helical Passes
      let curZ = startZ + pitch / 2;
      for (let rev = 1; rev <= revs; rev++) {
        curZ += pitch;
        lines.push(`${nextN()} G03 X${(holeX + r).toFixed(3)} Y${holeY.toFixed(3)} I-${r.toFixed(3)} J0.000 Z${curZ.toFixed(3)} F${feed} (Rev ${rev}/${revs})`);
      }

      // Helical Roll-out back to center
      lines.push(`${nextN()} G03 X${holeX.toFixed(3)} Y${holeY.toFixed(3)} R${leadInRadius.toFixed(3)} Z${(curZ + pitch / 2).toFixed(3)} (Helical Roll-Out)`);
      lines.push(``);
    }

    lines.push(`G00 Z${safeZ.toFixed(2)} M09`);
    lines.push(`G00 Z100.000 M05`);
  }

  lines.push(`G28 G91 Z0.0`);
  lines.push(`G28 G91 Y0.0`);
  lines.push(`M30 (End of Program)`);
  lines.push(`%`);

  return lines.join('\n');
}

