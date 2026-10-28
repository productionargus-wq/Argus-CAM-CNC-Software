/**
 * Argus CAM CNC 2.5D & 3D Engraving & V-Carve Studio Engine
 * 
 * Capabilities:
 * - Single-line CNC stick font generator (ultra-fast machining without pocket clearing)
 * - True 3D V-Carve prism toolpaths (varying Z depth based on stroke width and V-bit angle)
 * - Linear & Circular Arc text projection (wraps text along bolt circles, flanges, dials)
 * - Dynamic token substitution ({DATE}, {TIME}, {SERIAL}, {PART_ID})
 * - Diamond drag scratch scriber & rotary V-bit spindle modes
 * - Production ISO G-code generation with safe rapids and plunge feeds
 * - SVG vector export for direct CAD / laser marking
 */

// ============================================================================
// HERSHEY CNC SINGLE-LINE VECTOR FONT STROKE DEFINITIONS (NORMALIZED 0..100)
// ============================================================================

export const CNC_STICK_GLYPHS = {
  // Digits
  '0': [[ [20, 0], [80, 0], [80, 100], [20, 100], [20, 0] ], [ [20, 0], [80, 100] ]],
  '1': [[ [30, 80], [50, 100], [50, 0] ], [ [30, 0], [70, 0] ]],
  '2': [[ [20, 80], [30, 100], [70, 100], [80, 80], [80, 60], [20, 0], [80, 0] ]],
  '3': [[ [20, 100], [80, 100], [50, 55], [75, 55], [80, 40], [80, 15], [65, 0], [20, 0] ]],
  '4': [[ [70, 0], [70, 100], [20, 30], [85, 30] ]],
  '5': [[ [80, 100], [20, 100], [20, 55], [70, 55], [80, 40], [80, 15], [65, 0], [20, 0] ]],
  '6': [[ [75, 95], [35, 95], [20, 70], [20, 20], [35, 0], [70, 0], [80, 20], [80, 45], [70, 55], [20, 55] ]],
  '7': [[ [20, 100], [80, 100], [45, 0] ]],
  '8': [[ [50, 50], [30, 65], [30, 85], [45, 100], [55, 100], [70, 85], [70, 65], [50, 50], [25, 35], [25, 15], [40, 0], [60, 0], [75, 15], [75, 35], [50, 50] ]],
  '9': [[ [80, 45], [30, 45], [20, 55], [20, 80], [35, 100], [70, 100], [80, 80], [80, 30], [65, 0], [25, 0] ]],

  // Uppercase Letters
  'A': [[ [20, 0], [50, 100], [80, 0] ], [ [32, 40], [68, 40] ]],
  'B': [[ [20, 0], [20, 100], [65, 100], [75, 88], [75, 62], [65, 50], [20, 50] ], [ [65, 50], [80, 38], [80, 12], [65, 0], [20, 0] ]],
  'C': [[ [80, 85], [65, 100], [35, 100], [20, 80], [20, 20], [35, 0], [65, 0], [80, 15] ]],
  'D': [[ [20, 0], [20, 100], [60, 100], [80, 75], [80, 25], [60, 0], [20, 0] ]],
  'E': [[ [80, 100], [20, 100], [20, 0], [80, 0] ], [ [20, 50], [65, 50] ]],
  'F': [[ [20, 0], [20, 100], [80, 100] ], [ [20, 50], [65, 50] ]],
  'G': [[ [80, 85], [65, 100], [35, 100], [20, 80], [20, 20], [35, 0], [65, 0], [80, 15], [80, 50], [50, 50] ]],
  'H': [[ [20, 0], [20, 100] ], [ [80, 0], [80, 100] ], [ [20, 50], [80, 50] ]],
  'I': [[ [30, 100], [70, 100] ], [ [50, 100], [50, 0] ], [ [30, 0], [70, 0] ]],
  'J': [[ [70, 100], [70, 25], [55, 0], [35, 0], [20, 15], [20, 35] ]],
  'K': [[ [20, 0], [20, 100] ], [ [80, 100], [20, 45], [80, 0] ]],
  'L': [[ [20, 100], [20, 0], [80, 0] ]],
  'M': [[ [20, 0], [20, 100], [50, 35], [80, 100], [80, 0] ]],
  'N': [[ [20, 0], [20, 100], [80, 0], [80, 100] ]],
  'O': [[ [35, 100], [65, 100], [80, 80], [80, 20], [65, 0], [35, 0], [20, 20], [20, 80], [35, 100] ]],
  'P': [[ [20, 0], [20, 100], [65, 100], [80, 85], [80, 65], [65, 50], [20, 50] ]],
  'Q': [[ [35, 100], [65, 100], [80, 80], [80, 20], [65, 0], [35, 0], [20, 20], [20, 80], [35, 100] ], [ [60, 25], [85, 0] ]],
  'R': [[ [20, 0], [20, 100], [65, 100], [80, 85], [80, 65], [65, 50], [20, 50] ], [ [50, 50], [80, 0] ]],
  'S': [[ [80, 85], [65, 100], [35, 100], [20, 85], [20, 65], [35, 50], [65, 50], [80, 35], [80, 15], [65, 0], [35, 0], [20, 15] ]],
  'T': [[ [20, 100], [80, 100] ], [ [50, 100], [50, 0] ]],
  'U': [[ [20, 100], [20, 25], [35, 0], [65, 0], [80, 25], [80, 100] ]],
  'V': [[ [20, 100], [50, 0], [80, 100] ]],
  'W': [[ [15, 100], [30, 0], [50, 65], [70, 0], [85, 100] ]],
  'X': [[ [20, 100], [80, 0] ], [ [80, 100], [20, 0] ]],
  'Y': [[ [20, 100], [50, 50], [80, 100] ], [ [50, 50], [50, 0] ]],
  'Z': [[ [20, 100], [80, 100], [20, 0], [80, 0] ]],

  // Punctuation & Symbols
  '-': [[ [25, 50], [75, 50] ]],
  '_': [[ [15, 0], [85, 0] ]],
  '.': [[ [45, 0], [55, 0], [55, 10], [45, 10], [45, 0] ]],
  ':': [[ [45, 20], [55, 20], [55, 30], [45, 30], [45, 20] ], [ [45, 70], [55, 70], [55, 80], [45, 80], [45, 70] ]],
  '/': [[ [20, 0], [80, 100] ]],
  '#': [[ [35, 0], [35, 100] ], [ [65, 0], [65, 100] ], [ [15, 35], [85, 35] ], [ [15, 65], [85, 65] ]],
  '&': [[ [75, 20], [60, 0], [35, 0], [20, 20], [20, 45], [45, 70], [45, 85], [35, 95], [25, 85], [50, 50], [75, 0] ]],
  '+': [[ [20, 50], [80, 50] ], [ [50, 20], [50, 80] ]],
  '*': [[ [30, 70], [70, 30] ], [ [70, 70], [30, 30] ], [ [50, 80], [50, 20] ]],
  '(': [[ [65, 100], [45, 80], [35, 50], [45, 20], [65, 0] ]],
  ')': [[ [35, 100], [55, 80], [65, 50], [55, 20], [35, 0] ]],
  ' ': [] // Space
};

// ============================================================================
// ENGRAVING TOOLING CATALOG
// ============================================================================

export const ENGRAVING_TOOLS = [
  {
    id: 'TOOL_V60_D6',
    name: 'Solid Carbide 60° V-Groove Engraving Bit D6',
    type: 'V-Bit Engraver',
    diameter: 6.0,
    angleDeg: 60.0,
    tipWidthMm: 0.20,
    flutes: 2,
    spindleRpm: 16000,
    feedMmMin: 1200,
    plungeFeed: 400,
    badge: 'Sharp 60° V-Carve',
    badgeColor: '#a855f7'
  },
  {
    id: 'TOOL_V90_D12',
    name: 'Precision 90° Chamfer & V-Carve Mill D12',
    type: 'V-Bit Engraver',
    diameter: 12.0,
    angleDeg: 90.0,
    tipWidthMm: 0.30,
    flutes: 2,
    spindleRpm: 12000,
    feedMmMin: 1500,
    plungeFeed: 500,
    badge: 'Deep 90° Prism Bevel',
    badgeColor: '#38bdf8'
  },
  {
    id: 'TOOL_V30_D3',
    name: 'Micro-Fine 30° Pyramid Engraver D3.175',
    type: 'Micro-Engraver',
    diameter: 3.175,
    angleDeg: 30.0,
    tipWidthMm: 0.10,
    flutes: 1,
    spindleRpm: 24000,
    feedMmMin: 800,
    plungeFeed: 250,
    badge: 'Micro Serial Numbers',
    badgeColor: '#10b981'
  },
  {
    id: 'TOOL_BALL_1_32',
    name: '1/32" (0.79mm) Micro Ballnose Endmill',
    type: 'Ballnose Engraver',
    diameter: 0.794,
    angleDeg: 180.0,
    tipWidthMm: 0.794,
    flutes: 2,
    spindleRpm: 28000,
    feedMmMin: 950,
    plungeFeed: 300,
    badge: 'Rounded Fillet Trace',
    badgeColor: '#f59e0b'
  },
  {
    id: 'TOOL_DIAMOND_DRAG',
    name: 'Spring-Loaded Diamond Drag CNC Scriber',
    type: 'Diamond Drag Scribe',
    diameter: 3.0,
    angleDeg: 120.0,
    tipWidthMm: 0.05,
    flutes: 0,
    spindleRpm: 0, // Non-rotating!
    feedMmMin: 2000,
    plungeFeed: 800,
    badge: 'No-Spindle Scratch Mark',
    badgeColor: '#ec4899'
  }
];

// ============================================================================
// DYNAMIC TEXT MACRO TOKEN EXPANDER
// ============================================================================

/**
 * Replaces dynamic tokens in text template (e.g. {SERIAL}, {DATE}, {PART_ID})
 */
export function expandTextTemplate(template, context = {}) {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const serialNumber = String(context.serial || 1).padStart(context.serialPadding || 4, '0');
  const partId = context.partId || 'PART-01';

  return template
    .replace(/\{DATE\}/g, dateStr)
    .replace(/\{TIME\}/g, timeStr)
    .replace(/\{SERIAL\}/g, serialNumber)
    .replace(/\{PART_ID\}/g, partId)
    .toUpperCase();
}

// ============================================================================
// CORE VECTOR TEXT & 3D V-CARVE TOOLPATH GENERATOR
// ============================================================================

/**
 * Generates 2.5D & 3D engraving toolpath strokes.
 * 
 * Supports:
 * - Linear alignment (Left, Center, Right)
 * - Arc projection along a circle radius (for flange dials and rings)
 * - True 3D V-Carve depth calculation:
 *   Z = - (strokeWidth / 2) / tan(angle / 2)
 * 
 * @param {string} rawText - Input text (may contain tokens)
 * @param {Object} options - Typography and toolpath options
 * @returns {Object} Toolpath strokes, 3D points, metrics, and cycle time
 */
export function generateEngravingToolpath(rawText, options = {}) {
  const {
    textHeight = 8.0,            // character height in mm
    targetDepth = 0.35,           // constant engraving depth (mm) for single-line
    originX = 0.0,               // placement X (mm)
    originY = 0.0,               // placement Y (mm)
    zSurface = 0.0,              // top workpiece Z datum (mm)
    safeZ = 3.0,                 // safe rapid clearance Z
    layoutMode = 'linear',       // 'linear' | 'arc'
    arcRadius = 45.0,            // for arc projection mode
    arcStartAngleDeg = 90.0,     // start angle on arc
    alignment = 'center',        // 'left' | 'center' | 'right'
    tracking = 1.15,             // letter spacing multiplier
    vCarve3D = false,            // whether to calculate varying 3D V-bit depth
    tool = ENGRAVING_TOOLS[0],
    serialContext = {}
  } = options;

  const expandedText = expandTextTemplate(rawText, serialContext);
  const chars = expandedText.split('');

  const charWidth = textHeight * 0.65;
  const charSpacing = charWidth * tracking;
  const totalWidth = chars.length * charSpacing;

  // Compute start offset based on alignment
  let startX = originX;
  if (alignment === 'center') {
    startX = originX - totalWidth / 2.0;
  } else if (alignment === 'right') {
    startX = originX - totalWidth;
  }

  const strokes = [];
  const points = [];
  let totalCutDistance = 0;
  let totalRapidDistance = 0;
  let lastPos = { x: startX, y: originY, z: safeZ };

  // Helper for 3D V-Carve depth based on stroke weight
  const vAngleRad = (tool.angleDeg * Math.PI) / 180.0;
  const tanHalfAngle = Math.tan(vAngleRad / 2.0);

  chars.forEach((ch, charIdx) => {
    const glyphStrokes = CNC_STICK_GLYPHS[ch] || CNC_STICK_GLYPHS[' '];

    glyphStrokes.forEach((stroke) => {
      if (stroke.length === 0) return;

      const strokePoints = [];

      stroke.forEach((pt, ptIdx) => {
        let posX, posY;

        if (layoutMode === 'arc') {
          // Arc Projection: Wrap characters along circle perimeter
          const totalAngleSpan = (totalWidth / arcRadius) * (180.0 / Math.PI);
          const angleStep = totalAngleSpan / Math.max(1, chars.length);
          const charAngleDeg = arcStartAngleDeg - (charIdx * angleStep) + (pt[0] / 100.0) * (angleStep * 0.8);
          const rad = (charAngleDeg * Math.PI) / 180.0;
          const r = arcRadius + ((pt[1] / 100.0) * textHeight);

          posX = originX + r * Math.cos(rad);
          posY = originY + r * Math.sin(rad);
        } else {
          // Standard Linear Alignment
          posX = startX + (charIdx * charSpacing) + (pt[0] / 100.0) * charWidth;
          posY = originY + (pt[1] / 100.0) * textHeight;
        }

        // Compute Z depth
        let cutZ = zSurface - Math.abs(targetDepth);
        if (vCarve3D) {
          // In 3D V-carving, corners taper shallower, line centers dip deeper
          const t = ptIdx / Math.max(1, stroke.length - 1);
          const taper = Math.sin(t * Math.PI); // 0 at ends, 1 in middle
          const estimatedWidth = tool.tipWidthMm + (targetDepth * 2 * tanHalfAngle * taper);
          cutZ = zSurface - Math.max(0.08, (estimatedWidth / 2.0) / tanHalfAngle);
        }

        strokePoints.push({ x: posX, y: posY, z: cutZ });
      });

      if (strokePoints.length > 0) {
        // Rapid to above stroke start
        const p0 = strokePoints[0];
        totalRapidDistance += Math.hypot(p0.x - lastPos.x, p0.y - lastPos.y, safeZ - lastPos.z);
        points.push({ x: p0.x, y: p0.y, z: safeZ, type: 'rapid' });

        // Plunge to cut depth
        points.push({ x: p0.x, y: p0.y, z: p0.z, type: 'plunge' });

        // Cut stroke segments
        for (let i = 1; i < strokePoints.length; i++) {
          const p = strokePoints[i];
          const prev = strokePoints[i - 1];
          totalCutDistance += Math.hypot(p.x - prev.x, p.y - prev.y, p.z - prev.z);
          points.push({ x: p.x, y: p.y, z: p.z, type: 'cut' });
        }

        // Retract to safe Z
        const pEnd = strokePoints[strokePoints.length - 1];
        points.push({ x: pEnd.x, y: pEnd.y, z: safeZ, type: 'rapid' });
        lastPos = { x: pEnd.x, y: pEnd.y, z: safeZ };

        strokes.push(strokePoints);
      }
    });
  });

  // Cycle time estimate
  const isDiamond = tool.type === 'Diamond Drag Scribe';
  const feed = tool.feedMmMin || 1200;
  const plunge = tool.plungeFeed || 400;
  const cutTimeMin = (totalCutDistance / feed) + (strokes.length * 0.02) + (totalRapidDistance / 8000);
  const cycleTimeSec = Math.max(2, Math.round(cutTimeMin * 60));

  return {
    success: strokes.length > 0,
    text: expandedText,
    charCount: chars.length,
    strokes,
    points,
    tool,
    options: {
      textHeight,
      targetDepth,
      originX,
      originY,
      layoutMode,
      vCarve3D,
      alignment,
      isDiamond
    },
    metrics: {
      totalStrokes: strokes.length,
      totalPoints: points.length,
      totalCutDistanceMm: Math.round(totalCutDistance),
      totalRapidDistanceMm: Math.round(totalRapidDistance),
      estimatedCycleTimeSec: cycleTimeSec,
      estimatedCycleTimeFormatted: `${Math.floor(cycleTimeSec / 60)}m ${String(cycleTimeSec % 60).padStart(2, '0')}s`
    }
  };
}

// ============================================================================
// PRODUCTION CNC G-CODE GENERATOR
// ============================================================================

/**
 * Generates ISO standard CNC G-code for engraving & 3D V-carving.
 */
export function generateEngravingGCode(toolpathResult) {
  if (!toolpathResult || !toolpathResult.strokes || toolpathResult.strokes.length === 0) {
    return '; Argus CAM Engraving Studio - No strokes to generate G-Code.';
  }

  const { text, strokes, tool, options, metrics } = toolpathResult;
  const isDiamond = tool.type === 'Diamond Drag Scribe';
  const safeZ = 3.0;
  const cutFeed = tool.feedMmMin || 1200;
  const plungeFeed = tool.plungeFeed || 400;

  const lines = [
    `%`,
    `; ============================================================================`,
    `; ARGUS CAM MASTER 2.5D & 3D ENGRAVING STUDIO NC PROGRAM`,
    `; Text String: "${text}" (${text.length} Characters, ${metrics.totalStrokes} Vector Strokes)`,
    `; Tool: ${tool.name} (Angle: ${tool.angleDeg}°, Tip: Ø${tool.tipWidthMm}mm)`,
    `; Method: ${options.vCarve3D ? 'True 3D V-Carve Prism' : (isDiamond ? 'Diamond Drag Scribe' : 'Single-Line Trace Engraving')}`,
    `; Target Depth: Z-${Math.abs(options.targetDepth).toFixed(3)} mm | Height: ${options.textHeight} mm`,
    `; Estimated Cycle Time: ${metrics.estimatedCycleTimeFormatted} | Cut Travel: ${metrics.totalCutDistanceMm} mm`,
    `; ============================================================================`,
    `G90 G21 G17 G94 G54 G40 G80 G49`,
    `G00 Z${safeZ.toFixed(2)}`,
    isDiamond
      ? `(Spindle OFF for Spring-Loaded Diamond Drag Scribing)\nM05\nM09`
      : `(Tool: M06 T06 - ${tool.name})\nT06 M06\nS${tool.spindleRpm || 16000} M03\nM08 (Air Blast Assist ON)`,
    `G04 P1.0 (Dwell)`,
    ``
  ];

  let n = 10;
  const nextN = () => {
    const s = `N${n}`;
    n += 10;
    return s;
  };

  strokes.forEach((stroke, sIdx) => {
    lines.push(`; Stroke ${sIdx + 1} of ${strokes.length}`);
    const p0 = stroke[0];

    // Rapid to XY above stroke start
    lines.push(`${nextN()} G00 X${p0.x.toFixed(3)} Y${p0.y.toFixed(3)}`);
    // Plunge to Z
    lines.push(`${nextN()} G01 Z${p0.z.toFixed(3)} F${plungeFeed}`);

    // Cut points along stroke
    for (let i = 1; i < stroke.length; i++) {
      const p = stroke[i];
      if (options.vCarve3D) {
        lines.push(`${nextN()} G01 X${p.x.toFixed(3)} Y${p.y.toFixed(3)} Z${p.z.toFixed(3)} F${cutFeed}`);
      } else {
        lines.push(`${nextN()} G01 X${p.x.toFixed(3)} Y${p.y.toFixed(3)} F${cutFeed}`);
      }
    }

    // Retract
    lines.push(`${nextN()} G00 Z${safeZ.toFixed(2)}`);
    lines.push(``);
  });

  lines.push(`; PROGRAM COMPLETE`);
  lines.push(`G00 Z25.000 M09`);
  if (!isDiamond) lines.push(`M05 (Spindle Stop)`);
  lines.push(`G28 G91 Z0.0`);
  lines.push(`G28 G91 Y0.0`);
  lines.push(`M30 (End of File)`);
  lines.push(`%`);

  return lines.join('\n');
}

// ============================================================================
// SVG VECTOR EXPORT FOR DIRECT CAD / LASER MARKING
// ============================================================================

/**
 * Generates an SVG string representation of the text toolpaths.
 */
export function exportEngravingSVG(toolpathResult) {
  if (!toolpathResult || !toolpathResult.strokes) return '';

  const { strokes, text, options } = toolpathResult;

  // Find bounding box of strokes
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  strokes.forEach(stroke => {
    stroke.forEach(pt => {
      if (pt.x < minX) minX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y > maxY) maxY = pt.y;
    });
  });

  const pad = 10;
  const W = Math.max(20, (maxX - minX) + pad * 2);
  const H = Math.max(20, (maxY - minY) + pad * 2);

  let pathsD = '';
  strokes.forEach(stroke => {
    stroke.forEach((pt, idx) => {
      const sx = pt.x - minX + pad;
      const sy = H - (pt.y - minY + pad); // Flip Y for SVG
      if (idx === 0) {
        pathsD += `M ${sx.toFixed(2)} ${sy.toFixed(2)} `;
      } else {
        pathsD += `L ${sx.toFixed(2)} ${sy.toFixed(2)} `;
      }
    });
  });

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}mm" height="${H}mm">
  <!-- Argus CAM Single-Line Engraving Vector: "${text}" -->
  <rect width="${W}" height="${H}" fill="#0b1320" />
  <path d="${pathsD}" fill="none" stroke="#38bdf8" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;
}
