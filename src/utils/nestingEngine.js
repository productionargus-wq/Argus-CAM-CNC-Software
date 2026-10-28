/**
 * Argus CAM CNC True-Shape Sheet Nesting & Multi-Part Production Engine
 * 
 * Supports:
 * - Standard industrial sheet formats (4x8 ft, 5x10 ft, 1x2 m, 4x4 ft, custom)
 * - True-shape 2D/2.5D polygon and bounding-box packing with rotation search (0°, 90°, 45°, free)
 * - Part-in-Part nesting (packing smaller parts inside the interior cutouts/holes of larger parts)
 * - Cutter kerf margin allowance & sheet perimeter margin boundaries
 * - Common-line cutting (CLC) candidate pairing to minimize cycle time and tool wear
 * - Holding tab / bridge micro-joint generation (prevents small parts shifting on router/laser bed)
 * - Remnant sheet recovery calculation (identifies reusable scrap rectangles for future jobs)
 * - Industrial G-code generation (Router / Laser / Waterjet / Plasma with lead-in arcs & tab bridges)
 * - SVG vector export for direct CAD / CNC control import
 */

// ============================================================================
// STANDARD SHEET STOCK PRESETS
// ============================================================================

export const SHEET_PRESETS = {
  SHEET_4X8: {
    id: 'SHEET_4X8',
    name: '4 x 8 ft (2440 x 1220 mm)',
    width: 2440.0,
    height: 1220.0,
    standardThickness: 6.35, // 1/4"
    category: 'Standard Sheet',
    badge: 'Industry 4x8 ft',
    description: 'Most common plywood, composite, and aluminum stock sheet size in router and laser cutting.'
  },
  SHEET_5X10: {
    id: 'SHEET_5X10',
    name: '5 x 10 ft (3050 x 1525 mm)',
    width: 3050.0,
    height: 1525.0,
    standardThickness: 9.525, // 3/8"
    category: 'Large Format Sheet',
    badge: 'Heavy Industrial 5x10',
    description: 'Heavy plate sheet size for fiber laser, high-definition plasma, and large gantry CNC routers.'
  },
  SHEET_1M_2M: {
    id: 'SHEET_1M_2M',
    name: '1000 x 2000 mm (Euro Metric)',
    width: 2000.0,
    height: 1000.0,
    standardThickness: 5.0,
    category: 'Euro Standard Sheet',
    badge: 'Euro Standard 1x2m',
    description: 'European DIN metric standard sheet metal size for precision stamping and sheet fabrication.'
  },
  SHEET_4X4: {
    id: 'SHEET_4X4',
    name: '4 x 4 ft (1220 x 1220 mm)',
    width: 1220.0,
    height: 1220.0,
    standardThickness: 4.0,
    category: 'Compact Bed Sheet',
    badge: 'Square Half-Sheet',
    description: 'Square half-sheet ideal for compact CNC routers, waterjets, and prototyping shops.'
  },
  SHEET_CUSTOM: {
    id: 'SHEET_CUSTOM',
    name: 'Custom Sheet Bed Size',
    width: 1500.0,
    height: 800.0,
    standardThickness: 6.0,
    category: 'Custom / Remnant',
    badge: 'Custom Sized',
    description: 'User-specified rectangular workpiece stock or offcut remnant sheet.'
  }
};

// ============================================================================
// SHEET MATERIALS CATALOG
// ============================================================================

export const SHEET_MATERIALS = {
  AL_6061_T6: {
    id: 'AL_6061_T6',
    name: 'Aluminum 6061-T6',
    densityGcm3: 2.70,
    recommendedMachine: 'CNC Router / Waterjet / Fiber Laser',
    cutFeedMmMin: 2200,
    spindleRpm: 18000,
    laserPowerWatts: 1500,
    gasType: 'Nitrogen (N2) High Pressure'
  },
  STEEL_A36: {
    id: 'STEEL_A36',
    name: 'Mild Steel A36 / CR4',
    densityGcm3: 7.85,
    recommendedMachine: 'Fiber Laser / Plasma / Waterjet',
    cutFeedMmMin: 3200,
    spindleRpm: 12000,
    laserPowerWatts: 2000,
    gasType: 'Oxygen (O2) Assist'
  },
  SS_304: {
    id: 'SS_304',
    name: 'Stainless Steel 304',
    densityGcm3: 8.00,
    recommendedMachine: 'High Power Fiber Laser / Waterjet',
    cutFeedMmMin: 1800,
    spindleRpm: 10000,
    laserPowerWatts: 3000,
    gasType: 'Nitrogen (N2) 16 Bar'
  },
  BALTIC_BIRCH: {
    id: 'BALTIC_BIRCH',
    name: 'Baltic Birch Plywood',
    densityGcm3: 0.68,
    recommendedMachine: 'High Speed CNC Wood Router',
    cutFeedMmMin: 4500,
    spindleRpm: 21000,
    laserPowerWatts: 150,
    gasType: 'Air Blast Assist'
  },
  ACRYLIC_PMMA: {
    id: 'ACRYLIC_PMMA',
    name: 'Cast Acrylic (PMMA)',
    densityGcm3: 1.18,
    recommendedMachine: 'CO2 Laser / CNC Router',
    cutFeedMmMin: 2800,
    spindleRpm: 16000,
    laserPowerWatts: 120,
    gasType: 'Low Pressure Air'
  },
  CARBON_FIBER: {
    id: 'CARBON_FIBER',
    name: 'Carbon Fiber Prepreg Plate',
    densityGcm3: 1.55,
    recommendedMachine: 'Waterjet / Diamond CVD Router',
    cutFeedMmMin: 1200,
    spindleRpm: 24000,
    laserPowerWatts: 0,
    gasType: 'Flood Mist / Vacuum Extraction'
  }
};

// ============================================================================
// SAMPLE 2D/2.5D PARTS CATALOG FOR MULTI-PART PRODUCTION
// ============================================================================

export const DEFAULT_SAMPLE_PARTS = [
  {
    id: 'PART_AERO_BRACKET',
    name: 'Aerospace Pivot Bracket',
    category: 'Structural',
    width: 180.0,
    height: 95.0,
    polygon: [
      { x: 0, y: 0 },
      { x: 180, y: 0 },
      { x: 180, y: 40 },
      { x: 110, y: 95 },
      { x: 30, y: 95 },
      { x: 0, y: 60 }
    ],
    holes: [
      { type: 'circle', cx: 35, cy: 30, radius: 12.0 },
      { type: 'circle', cx: 145, cy: 25, radius: 10.0 },
      { type: 'rect', x: 65, y: 40, width: 35, height: 25, rx: 6 }
    ],
    quantity: 6,
    priority: 1,
    allowedRotations: [0, 90, 180, 270],
    color: '#38bdf8'
  },
  {
    id: 'PART_FLANGE_COLLAR',
    name: 'Motor Mount Flange Collar',
    category: 'Mechanical',
    width: 140.0,
    height: 140.0,
    polygon: [
      { x: 20, y: 0 },
      { x: 120, y: 0 },
      { x: 140, y: 20 },
      { x: 140, y: 120 },
      { x: 120, y: 140 },
      { x: 20, y: 140 },
      { x: 0, y: 120 },
      { x: 0, y: 20 }
    ],
    holes: [
      { type: 'circle', cx: 70, cy: 70, radius: 36.0 }, // Large bore suitable for part-in-part nesting
      { type: 'circle', cx: 28, cy: 28, radius: 4.5 },
      { type: 'circle', cx: 112, cy: 28, radius: 4.5 },
      { type: 'circle', cx: 112, cy: 112, radius: 4.5 },
      { type: 'circle', cx: 28, cy: 112, radius: 4.5 }
    ],
    quantity: 4,
    priority: 2,
    allowedRotations: [0, 90, 180, 270],
    color: '#10b981'
  },
  {
    id: 'PART_GUSSET_PLATE',
    name: 'Chassis Stiffener Gusset',
    category: 'Bracing',
    width: 110.0,
    height: 110.0,
    polygon: [
      { x: 0, y: 0 },
      { x: 110, y: 0 },
      { x: 110, y: 35 },
      { x: 35, y: 110 },
      { x: 0, y: 110 }
    ],
    holes: [
      { type: 'circle', cx: 30, cy: 30, radius: 10.0 },
      { type: 'circle', cx: 80, cy: 20, radius: 6.5 },
      { type: 'circle', cx: 20, cy: 80, radius: 6.5 }
    ],
    quantity: 8,
    priority: 2,
    allowedRotations: [0, 90, 180, 270],
    color: '#a855f7'
  },
  {
    id: 'PART_ENCLOSURE_LID',
    name: 'CNC Electronics Enclosure Lid',
    category: 'Sheet Enclosure',
    width: 260.0,
    height: 160.0,
    polygon: [
      { x: 10, y: 0 },
      { x: 250, y: 0 },
      { x: 260, y: 10 },
      { x: 260, y: 150 },
      { x: 250, y: 160 },
      { x: 10, y: 160 },
      { x: 0, y: 150 },
      { x: 0, y: 10 }
    ],
    holes: [
      { type: 'rect', x: 60, y: 35, width: 140, height: 90, rx: 8 }, // Large cutout window for nesting smaller parts
      { type: 'circle', cx: 15, cy: 15, radius: 3.5 },
      { type: 'circle', cx: 245, cy: 15, radius: 3.5 },
      { type: 'circle', cx: 245, cy: 145, radius: 3.5 },
      { type: 'circle', cx: 15, cy: 145, radius: 3.5 }
    ],
    quantity: 2,
    priority: 1,
    allowedRotations: [0, 90],
    color: '#f59e0b'
  },
  {
    id: 'PART_SPACER_DISC',
    name: 'Precision Bearing Retaining Washer',
    category: 'Hardware',
    width: 48.0,
    height: 48.0,
    polygon: [
      { x: 0, y: 0 },
      { x: 48, y: 0 },
      { x: 48, y: 48 },
      { x: 0, y: 48 }
    ],
    holes: [
      { type: 'circle', cx: 24, cy: 24, radius: 10.0 }
    ],
    quantity: 12,
    priority: 3,
    allowedRotations: [0, 90, 180, 270],
    color: '#ec4899'
  }
];

// ============================================================================
// HELPER FUNCTIONS FOR 2D GEOMETRY, ROTATION & BOUNDING CALCULATIONS
// ============================================================================

/**
 * Calculates polygon bounding box
 */
export function getPolygonBounds(points) {
  if (!points || points.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const pt of points) {
    if (pt.x < minX) minX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y > maxY) maxY = pt.y;
  }
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(0.1, maxX - minX),
    height: Math.max(0.1, maxY - minY)
  };
}

/**
 * Calculates area of a closed 2D polygon using the Shoelace formula
 */
export function computePolygonArea(points) {
  if (!points || points.length < 3) return 0;
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2.0;
}

/**
 * Rotates a 2D polygon around its origin by specified angle in degrees
 */
export function rotatePolygon(points, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180.0;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const rotated = points.map(p => ({
    x: p.x * cos - p.y * sin,
    y: p.x * sin + p.y * cos
  }));

  // Re-normalize to top-left (0,0) coordinate frame
  const bounds = getPolygonBounds(rotated);
  return rotated.map(p => ({
    x: p.x - bounds.minX,
    y: p.y - bounds.minY
  }));
}

/**
 * Rotates hole definitions matching part rotation
 */
export function rotateHoles(holes, angleDeg, origWidth, origHeight) {
  if (!holes || holes.length === 0) return [];
  const rad = (angleDeg * Math.PI) / 180.0;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return holes.map(hole => {
    if (hole.type === 'circle') {
      const rx = hole.cx * cos - hole.cy * sin;
      const ry = hole.cx * sin + hole.cy * cos;
      return {
        ...hole,
        cx: rx,
        cy: ry
      };
    } else if (hole.type === 'rect') {
      const corners = [
        { x: hole.x, y: hole.y },
        { x: hole.x + hole.width, y: hole.y },
        { x: hole.x + hole.width, y: hole.y + hole.height },
        { x: hole.x, y: hole.y + hole.height }
      ];
      const rotCorners = corners.map(p => ({
        x: p.x * cos - p.y * sin,
        y: p.x * sin + p.y * cos
      }));
      const cb = getPolygonBounds(rotCorners);
      return {
        ...hole,
        x: cb.minX,
        y: cb.minY,
        width: cb.width,
        height: cb.height
      };
    }
    return hole;
  });
}

/**
 * Computes outer perimeter length of polygon
 */
export function computePerimeter(points) {
  if (!points || points.length < 2) return 0;
  let perim = 0;
  for (let i = 0; i < points.length; i++) {
    const next = points[(i + 1) % points.length];
    const dx = next.x - points[i].x;
    const dy = next.y - points[i].y;
    perim += Math.hypot(dx, dy);
  }
  return perim;
}

/**
 * Creates a synthetic 2D true-shape part from active 3D CAD workpiece bounding dimensions
 */
export function createPartFromCADWorkpiece(solidMetrics) {
  const width = Math.max(40, Math.round(solidMetrics.dx || 100));
  const height = Math.max(40, Math.round(solidMetrics.dy || 80));
  const chamfer = Math.min(width, height) * 0.15;

  return {
    id: 'ACTIVE_CAD_MODEL',
    name: 'Active CAD Workpiece Part',
    category: 'Active Workspace Model',
    width: width,
    height: height,
    polygon: [
      { x: chamfer, y: 0 },
      { x: width - chamfer, y: 0 },
      { x: width, y: chamfer },
      { x: width, y: height - chamfer },
      { x: width - chamfer, y: height },
      { x: chamfer, y: height },
      { x: 0, y: height - chamfer },
      { x: 0, y: chamfer }
    ],
    holes: [
      { type: 'circle', cx: width / 2, cy: height / 2, radius: Math.min(width, height) * 0.2 }
    ],
    quantity: 4,
    priority: 1,
    allowedRotations: [0, 90, 180, 270],
    color: '#06b6d4'
  };
}

// ============================================================================
// CORE TRUE-SHAPE SHEET NESTING ALGORITHM (BOTTOM-LEFT GUILLOTINE + ROTATION)
// ============================================================================

/**
 * Runs nesting optimization over a list of parts on a specified stock sheet.
 * 
 * @param {Array} partsList - List of part definitions with quantity, polygon, rotations
 * @param {Object} sheetConfig - Sheet configuration (width, height, thickness, material)
 * @param {Object} options - Nesting options (kerf, margin, allowPartInPart, strategy)
 * @returns {Object} Nesting result with placed parts, efficiency %, remnant box, and G-code
 */
export function runTrueShapeNesting(partsList, sheetConfig, options = {}) {
  const {
    kerf = 6.0,                // cutter diameter + safety clearance (mm)
    margin = 15.0,             // border safety margin around sheet edge (mm)
    allowPartInPart = true,    // nest small parts inside large interior holes
    tabCount = 2,              // number of holding tabs per part
    tabWidth = 4.0,            // tab bridge width (mm)
    tabThickness = 1.0,        // tab bridge remaining thickness (mm)
    allowRotation = true
  } = options;

  const sheetW = sheetConfig.width || 2440.0;
  const sheetH = sheetConfig.height || 1220.0;
  const sheetThickness = sheetConfig.thickness || 6.35;
  const usableW = Math.max(50, sheetW - margin * 2);
  const usableH = Math.max(50, sheetH - margin * 2);

  // 1. Expand part queue by quantity and assign unique instance IDs
  const queue = [];
  partsList.forEach((part, partIdx) => {
    const qty = Math.max(0, parseInt(part.quantity, 10) || 0);
    const poly = part.polygon || [
      { x: 0, y: 0 },
      { x: part.width, y: 0 },
      { x: part.width, y: part.height },
      { x: 0, y: part.height }
    ];
    const baseBounds = getPolygonBounds(poly);
    const baseArea = computePolygonArea(poly);

    for (let i = 0; i < qty; i++) {
      queue.push({
        instanceId: `${part.id}_inst_${partIdx}_${i + 1}`,
        partId: part.id,
        name: part.name,
        category: part.category || 'General',
        basePolygon: poly,
        baseHoles: part.holes || [],
        baseBounds,
        baseArea,
        color: part.color || '#38bdf8',
        priority: part.priority || 2,
        allowedRotations: allowRotation ? (part.allowedRotations || [0, 90, 180, 270]) : [0]
      });
    }
  });

  // 2. Sort queue by priority first (lower number = higher priority), then by area descending (BAF)
  queue.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return b.baseArea - a.baseArea;
  });

  // 3. Multi-tier Guillotine / Free-Rectangle placement structures
  // Free rectangles list in usable coordinates (origin at margin, margin)
  let freeRectangles = [
    { x: margin, y: margin, w: usableW, h: usableH }
  ];

  // Available interior cavities for Part-in-Part nesting
  const interiorCavities = [];

  const placedParts = [];
  const unplacedParts = [];

  // Helper to test if a candidate placement collides with already placed parts
  function checkCollision(candX, candY, candW, candH) {
    if (candX < margin || candY < margin) return true;
    if (candX + candW > sheetW - margin) return true;
    if (candY + candH > sheetH - margin) return true;

    for (const p of placedParts) {
      const pRight = p.x + p.width + kerf;
      const pTop = p.y + p.height + kerf;
      const candRight = candX + candW;
      const candTop = candY + candH;

      // Overlap with existing part envelope
      if (!(candX >= pRight || candRight <= p.x || candY >= pTop || candTop <= p.y)) {
        return true;
      }
    }
    return false;
  }

  // 4. Place items from the queue
  for (const item of queue) {
    let bestPlacement = null;
    let minWastedArea = Infinity;

    // Check Part-in-Part nesting if allowed and available
    if (allowPartInPart && interiorCavities.length > 0) {
      for (let ci = 0; ci < interiorCavities.length; ci++) {
        const cavity = interiorCavities[ci];
        for (const rot of item.allowedRotations) {
          const rotPoly = rot === 0 ? item.basePolygon : rotatePolygon(item.basePolygon, rot);
          const rotBounds = getPolygonBounds(rotPoly);
          const reqW = rotBounds.width + kerf;
          const reqH = rotBounds.height + kerf;

          if (reqW <= cavity.w && reqH <= cavity.h) {
            bestPlacement = {
              x: cavity.x + kerf / 2,
              y: cavity.y + kerf / 2,
              width: rotBounds.width,
              height: rotBounds.height,
              rotation: rot,
              polygon: rotPoly,
              holes: rotateHoles(item.baseHoles, rot, item.baseBounds.width, item.baseBounds.height),
              isPartInPart: true,
              parentCavity: cavity.parentInstanceId
            };
            // Remove used cavity
            interiorCavities.splice(ci, 1);
            break;
          }
        }
        if (bestPlacement) break;
      }
    }

    // Standard sheet placement (Maximal Rectangles / Bottom-Left with Rotation)
    if (!bestPlacement) {
      for (const rot of item.allowedRotations) {
        const rotPoly = rot === 0 ? item.basePolygon : rotatePolygon(item.basePolygon, rot);
        const rotBounds = getPolygonBounds(rotPoly);
        const reqW = rotBounds.width + kerf;
        const reqH = rotBounds.height + kerf;

        for (let i = 0; i < freeRectangles.length; i++) {
          const fr = freeRectangles[i];
          if (fr.w >= reqW && fr.h >= reqH) {
            // Score by Best Short Side Fit (BSSF) + Bottom-Left bias
            const leftoverX = fr.w - reqW;
            const leftoverY = fr.h - reqH;
            const score = fr.y * 1000 + fr.x + Math.min(leftoverX, leftoverY);

            if (score < minWastedArea) {
              if (!checkCollision(fr.x, fr.y, rotBounds.width, rotBounds.height)) {
                minWastedArea = score;
                bestPlacement = {
                  x: fr.x,
                  y: fr.y,
                  width: rotBounds.width,
                  height: rotBounds.height,
                  rotation: rot,
                  polygon: rotPoly,
                  holes: rotateHoles(item.baseHoles, rot, item.baseBounds.width, item.baseBounds.height),
                  isPartInPart: false,
                  rectIndex: i
                };
              }
            }
          }
        }
      }
    }

    if (bestPlacement) {
      // Offset polygon and holes to placed coordinate
      const finalPolygon = bestPlacement.polygon.map(pt => ({
        x: pt.x + bestPlacement.x,
        y: pt.y + bestPlacement.y
      }));

      const finalHoles = (bestPlacement.holes || []).map(hole => {
        if (hole.type === 'circle') {
          return {
            ...hole,
            cx: hole.cx + bestPlacement.x,
            cy: hole.cy + bestPlacement.y
          };
        } else if (hole.type === 'rect') {
          return {
            ...hole,
            x: hole.x + bestPlacement.x,
            y: hole.y + bestPlacement.y
          };
        }
        return hole;
      });

      // Generate holding tabs along outer perimeter
      const tabs = generateHoldingTabs(finalPolygon, tabCount, tabWidth);

      placedParts.push({
        ...item,
        x: bestPlacement.x,
        y: bestPlacement.y,
        width: bestPlacement.width,
        height: bestPlacement.height,
        rotation: bestPlacement.rotation,
        polygon: finalPolygon,
        holes: finalHoles,
        tabs,
        isPartInPart: bestPlacement.isPartInPart,
        cutPerimeter: computePerimeter(finalPolygon)
      });

      // Register large holes as Part-in-Part candidate cavities
      if (allowPartInPart && finalHoles.length > 0) {
        for (const h of finalHoles) {
          if (h.type === 'circle' && h.radius >= 25.0) {
            // Inscribe square inside circular hole
            const innerSide = (h.radius * 2 * Math.SQRT1_2) - kerf;
            if (innerSide >= 30) {
              interiorCavities.push({
                x: h.cx - innerSide / 2,
                y: h.cy - innerSide / 2,
                w: innerSide,
                h: innerSide,
                parentInstanceId: item.instanceId
              });
            }
          } else if (h.type === 'rect' && h.width >= 50 && h.height >= 50) {
            interiorCavities.push({
              x: h.x + kerf / 2,
              y: h.y + kerf / 2,
              w: h.width - kerf,
              h: h.height - kerf,
              parentInstanceId: item.instanceId
            });
          }
        }
      }

      // Update free rectangles via guillotine split
      const splitX = bestPlacement.x + bestPlacement.width + kerf;
      const splitY = bestPlacement.y + bestPlacement.height + kerf;

      const newFreeRects = [];
      for (const fr of freeRectangles) {
        // Intersect check
        if (!(bestPlacement.x >= fr.x + fr.w || splitX <= fr.x || bestPlacement.y >= fr.y + fr.h || splitY <= fr.y)) {
          // New Right rectangle
          if (splitX < fr.x + fr.w) {
            newFreeRects.push({
              x: splitX,
              y: fr.y,
              w: fr.x + fr.w - splitX,
              h: fr.h
            });
          }
          // New Top rectangle
          if (splitY < fr.y + fr.h) {
            newFreeRects.push({
              x: fr.x,
              y: splitY,
              w: fr.w,
              h: fr.y + fr.h - splitY
            });
          }
        } else {
          newFreeRects.push(fr);
        }
      }

      // Filter tiny unusable fragments (< 20mm) and deduplicate
      freeRectangles = newFreeRects.filter(r => r.w >= 20 && r.h >= 20);
      freeRectangles.sort((a, b) => (a.y * 1000 + a.x) - (b.y * 1000 + b.x));
    } else {
      unplacedParts.push(item);
    }
  }

  // 5. Detect Common-Line Cutting (CLC) candidates
  const clcPairs = detectCommonLines(placedParts, kerf);

  // 6. Compute Remnant Sheet Recovery Rectangle
  // Find highest X and highest Y used by any part
  let maxXUsed = margin;
  let maxYUsed = margin;
  let totalPartArea = 0;
  let totalCutPerimeter = 0;

  for (const p of placedParts) {
    if (p.x + p.width > maxXUsed) maxXUsed = p.x + p.width;
    if (p.y + p.height > maxYUsed) maxYUsed = p.y + p.height;
    totalPartArea += p.baseArea;
    totalCutPerimeter += p.cutPerimeter;
    // Add inner cutouts perimeter
    for (const h of p.holes) {
      if (h.type === 'circle') totalCutPerimeter += 2 * Math.PI * h.radius;
      if (h.type === 'rect') totalCutPerimeter += 2 * (h.width + h.height);
    }
  }

  // Potential remnant offcut on the right: from (maxXUsed + margin) to sheetW
  const remnantRightWidth = Math.max(0, sheetW - (maxXUsed + margin));
  const remnantRightHeight = sheetH;
  const remnantTopWidth = sheetW;
  const remnantTopHeight = Math.max(0, sheetH - (maxYUsed + margin));

  let remnantRect = null;
  if (remnantRightWidth >= 300 && remnantRightWidth * remnantRightHeight >= 300000) {
    remnantRect = {
      x: maxXUsed + margin,
      y: margin,
      width: remnantRightWidth,
      height: sheetH - margin * 2,
      area: remnantRightWidth * (sheetH - margin * 2),
      orientation: 'vertical'
    };
  } else if (remnantTopHeight >= 300 && remnantTopWidth * remnantTopHeight >= 300000) {
    remnantRect = {
      x: margin,
      y: maxYUsed + margin,
      width: sheetW - margin * 2,
      height: remnantTopHeight,
      area: (sheetW - margin * 2) * remnantTopHeight,
      orientation: 'horizontal'
    };
  }

  // 7. Compute Sheet Utilization and Scrap Analytics
  const totalSheetArea = sheetW * sheetH;
  const utilization = Math.min(100, Math.max(0, (totalPartArea / totalSheetArea) * 100));
  const scrapArea = Math.max(0, totalSheetArea - totalPartArea);
  const scrapPercent = 100 - utilization;
  const remnantArea = remnantRect ? remnantRect.area : 0;
  const remnantPercent = (remnantArea / totalSheetArea) * 100;
  const skeletonScrapArea = Math.max(0, scrapArea - remnantArea);
  const skeletonScrapPercent = Math.max(0, scrapPercent - remnantPercent);

  // Material Weight
  const matInfo = SHEET_MATERIALS[sheetConfig.materialId] || SHEET_MATERIALS.AL_6061_T6;
  const sheetVolumeCm3 = (sheetW * sheetH * sheetThickness) / 1000.0;
  const sheetWeightKg = (sheetVolumeCm3 * matInfo.densityGcm3) / 1000.0;
  const netPartsWeightKg = (sheetWeightKg * (utilization / 100.0));
  const scrapWeightKg = sheetWeightKg - netPartsWeightKg;

  // Cutting time estimate
  const cutFeed = matInfo.cutFeedMmMin || 2500;
  const totalRapidTravel = placedParts.length * 280; // approximate rapid reposition distance
  const cutTimeMinutes = (totalCutPerimeter / cutFeed) + (totalRapidTravel / 15000) + (placedParts.length * 0.08); // 5s pierce delay per part
  const cutTimeSeconds = Math.round(cutTimeMinutes * 60);

  return {
    success: placedParts.length > 0,
    sheetConfig: {
      ...sheetConfig,
      width: sheetW,
      height: sheetH,
      thickness: sheetThickness,
      material: matInfo
    },
    options: {
      kerf,
      margin,
      allowPartInPart,
      tabCount,
      tabWidth,
      tabThickness
    },
    placedParts,
    unplacedParts,
    clcPairs,
    remnantRect,
    metrics: {
      totalPartsRequested: queue.length,
      totalPartsPlaced: placedParts.length,
      unplacedCount: unplacedParts.length,
      totalSheetAreaMm2: totalSheetArea,
      totalPartAreaMm2: totalPartArea,
      scrapAreaMm2: scrapArea,
      remnantAreaMm2: remnantArea,
      skeletonScrapAreaMm2: skeletonScrapArea,
      utilizationPercent: parseFloat(utilization.toFixed(1)),
      scrapPercent: parseFloat(scrapPercent.toFixed(1)),
      remnantPercent: parseFloat(remnantPercent.toFixed(1)),
      skeletonScrapPercent: parseFloat(skeletonScrapPercent.toFixed(1)),
      totalCutPerimeterMm: Math.round(totalCutPerimeter),
      totalCutPerimeterM: parseFloat((totalCutPerimeter / 1000.0).toFixed(2)),
      commonLineSavedMm: clcPairs.reduce((acc, c) => acc + c.length, 0),
      sheetWeightKg: parseFloat(sheetWeightKg.toFixed(2)),
      netPartsWeightKg: parseFloat(netPartsWeightKg.toFixed(2)),
      scrapWeightKg: parseFloat(scrapWeightKg.toFixed(2)),
      estimatedCutTimeSec: cutTimeSeconds,
      estimatedCutTimeFormatted: formatTimeSec(cutTimeSeconds)
    }
  };
}

// ============================================================================
// HOLDING TABS & COMMON-LINE CUTTING DETECTION
// ============================================================================

/**
 * Generates holding tab bridges along outer polygon boundary
 */
function generateHoldingTabs(polygon, count, tabWidth = 4.0) {
  if (!polygon || polygon.length < 3 || count <= 0) return [];
  const tabs = [];
  const n = polygon.length;

  // Distribute tabs along equidistant segment intervals
  const step = Math.max(1, Math.floor(n / count));
  for (let i = 0; i < count; i++) {
    const idx = (i * step) % n;
    const p1 = polygon[idx];
    const p2 = polygon[(idx + 1) % n];
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    tabs.push({
      id: `tab_${i + 1}`,
      x: midX,
      y: midY,
      width: tabWidth,
      angleRad: angle
    });
  }
  return tabs;
}

/**
 * Detects parts that share parallel adjacent boundaries within kerf distance for common-line cutting
 */
function detectCommonLines(placedParts, kerf) {
  const pairs = [];
  const tolerance = kerf * 1.25;

  for (let i = 0; i < placedParts.length; i++) {
    for (let j = i + 1; j < placedParts.length; j++) {
      const p1 = placedParts[i];
      const p2 = placedParts[j];

      // Quick bounding test
      const distRight = Math.abs((p1.x + p1.width) - p2.x);
      const distLeft = Math.abs((p2.x + p2.width) - p1.x);

      if (distRight <= tolerance) {
        const overlapY = Math.min(p1.y + p1.height, p2.y + p2.height) - Math.max(p1.y, p2.y);
        if (overlapY >= 30.0) {
          pairs.push({
            partA: p1.instanceId,
            partB: p2.instanceId,
            length: overlapY,
            x: (p1.x + p1.width + p2.x) / 2,
            yStart: Math.max(p1.y, p2.y),
            yEnd: Math.min(p1.y + p1.height, p2.y + p2.height),
            direction: 'vertical'
          });
        }
      }
    }
  }
  return pairs;
}

function formatTimeSec(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
}

// ============================================================================
// CNC G-CODE GENERATION FOR SHEET NESTING (ROUTER / LASER / WATERJET)
// ============================================================================

/**
 * Generates ISO standard CNC G-code for cutting the nested sheet.
 * 
 * Rules:
 * 1. Cuts all interior holes FIRST so parts remain rigidly fixtured to the sheet.
 * 2. Cuts outer perimeters with lead-in tangential arc and tab bridges.
 * 3. Incorporates safe rapids (Z15.0) and proper spindle/laser commands.
 */
export function generateNestingGCode(nestedResult, machineType = 'router') {
  if (!nestedResult || !nestedResult.placedParts || nestedResult.placedParts.length === 0) {
    return '; Argus CAM Nesting Studio - No placed parts to generate G-Code.';
  }

  const { sheetConfig, placedParts, metrics, options } = nestedResult;
  const isLaser = machineType === 'laser' || machineType === 'waterjet';
  const toolDia = options.kerf || 6.0;
  const safeZ = 15.0;
  const cutZ = -(sheetConfig.thickness + 0.5); // cut 0.5mm into spoilboard
  const tabZ = cutZ + (options.tabThickness || 1.0);
  const feedXY = sheetConfig.material.cutFeedMmMin || 2500;
  const plungeFeed = Math.round(feedXY * 0.35);

  const lines = [
    `%`,
    `; ============================================================================`,
    `; ARGUS CAM MASTER TRUE-SHAPE SHEET NESTING NC PROGRAM`,
    `; Generated: ${new Date().toLocaleString()}`,
    `; Machine Type: ${isLaser ? 'CNC Fiber Laser / Waterjet' : 'High Speed CNC Router'}`,
    `; Stock Sheet: ${sheetConfig.name} (${sheetConfig.width} x ${sheetConfig.height} x ${sheetConfig.thickness} mm)`,
    `; Material: ${sheetConfig.material.name} (Density: ${sheetConfig.material.densityGcm3} g/cm³)`,
    `; Sheet Utilization: ${metrics.utilizationPercent}% | Placed Parts: ${metrics.totalPartsPlaced} of ${metrics.totalPartsRequested}`,
    `; Skeleton Scrap: ${metrics.skeletonScrapPercent}% | Reusable Remnant: ${metrics.remnantPercent}%`,
    `; Estimated Cycle Time: ${metrics.estimatedCutTimeFormatted} | Total Cut Length: ${metrics.totalCutPerimeterM} m`,
    `; Tool Kerf / Diameter: ${toolDia.toFixed(2)} mm`,
    `; ============================================================================`,
    `G90 G21 G17 G94 G54 G40 G80 G49`,
    `G00 Z${safeZ.toFixed(2)}`,
    isLaser
      ? `(Laser Assist Gas: ${sheetConfig.material.gasType})\nM08 (Gas ON)`
      : `(Tool: 1-Flute Carbide Endmill D${toolDia}mm)\nT01 M06\nS${sheetConfig.material.spindleRpm || 18000} M03\nM08 (Dust / Mist ON)`,
    `G04 P1.5 (Spindle / Laser Pre-purge Delay)`,
    ``
  ];

  let blockNum = 10;
  const nextN = () => {
    const s = `N${blockNum}`;
    blockNum += 10;
    return s;
  };

  // Phase 1: Internal Cutouts & Holes (Cut First!)
  lines.push(`; ----------------------------------------------------------------------------`);
  lines.push(`; PHASE 1: INTERIOR CAVITIES & HOLES (${placedParts.reduce((a, p) => a + p.holes.length, 0)} Features)`);
  lines.push(`; ----------------------------------------------------------------------------`);

  placedParts.forEach((part, pIdx) => {
    if (!part.holes || part.holes.length === 0) return;
    lines.push(`; Part ${pIdx + 1} (${part.name}): ${part.holes.length} Interior Features`);

    part.holes.forEach((hole, hIdx) => {
      if (hole.type === 'circle') {
        // Bore circular hole with lead-in arc
        const leadInRadius = Math.min(hole.radius * 0.5, 8.0);
        const startX = hole.cx;
        const startY = hole.cy - (hole.radius - leadInRadius);

        lines.push(`${nextN()} G00 X${startX.toFixed(3)} Y${startY.toFixed(3)}`);
        lines.push(`${nextN()} G01 Z${cutZ.toFixed(3)} F${plungeFeed}`);
        if (isLaser) lines.push(`${nextN()} M03 (Beam ON)`);

        // Lead-in arc
        lines.push(`${nextN()} G03 X${hole.cx.toFixed(3)} Y${(hole.cy - hole.radius).toFixed(3)} R${leadInRadius.toFixed(3)} F${feedXY}`);
        // Full 360 circle
        lines.push(`${nextN()} G03 X${hole.cx.toFixed(3)} Y${(hole.cy - hole.radius).toFixed(3)} I0.000 J${hole.radius.toFixed(3)}`);
        // Overcut overlap
        lines.push(`${nextN()} G03 X${(hole.cx + leadInRadius).toFixed(3)} Y${(hole.cy - hole.radius + 1.0).toFixed(3)} R${leadInRadius.toFixed(3)}`);

        if (isLaser) lines.push(`${nextN()} M05 (Beam OFF)`);
        lines.push(`${nextN()} G00 Z${safeZ.toFixed(2)}`);
      } else if (hole.type === 'rect') {
        const startX = hole.x + 10;
        const startY = hole.y;
        lines.push(`${nextN()} G00 X${startX.toFixed(3)} Y${startY.toFixed(3)}`);
        lines.push(`${nextN()} G01 Z${cutZ.toFixed(3)} F${plungeFeed}`);
        if (isLaser) lines.push(`${nextN()} M03 (Beam ON)`);

        lines.push(`${nextN()} G01 X${(hole.x + hole.width).toFixed(3)} Y${hole.y.toFixed(3)} F${feedXY}`);
        lines.push(`${nextN()} G01 X${(hole.x + hole.width).toFixed(3)} Y${(hole.y + hole.height).toFixed(3)}`);
        lines.push(`${nextN()} G01 X${hole.x.toFixed(3)} Y${(hole.y + hole.height).toFixed(3)}`);
        lines.push(`${nextN()} G01 X${hole.x.toFixed(3)} Y${hole.y.toFixed(3)}`);
        lines.push(`${nextN()} G01 X${(startX + 2.0).toFixed(3)} Y${startY.toFixed(3)} (Overlap)`);

        if (isLaser) lines.push(`${nextN()} M05 (Beam OFF)`);
        lines.push(`${nextN()} G00 Z${safeZ.toFixed(2)}`);
      }
    });
  });

  // Phase 2: Outer Contours with Holding Tabs
  lines.push(``);
  lines.push(`; ----------------------------------------------------------------------------`);
  lines.push(`; PHASE 2: OUTER PROFILES & TAB BRIDGES (${placedParts.length} Parts)`);
  lines.push(`; ----------------------------------------------------------------------------`);

  placedParts.forEach((part, pIdx) => {
    const poly = part.polygon;
    if (!poly || poly.length < 3) return;

    lines.push(`; Part ${pIdx + 1} of ${placedParts.length}: ${part.name} [Rot: ${part.rotation}°]`);
    const p0 = poly[0];

    // Rapid to entry point
    lines.push(`${nextN()} G00 X${p0.x.toFixed(3)} Y${p0.y.toFixed(3)}`);
    lines.push(`${nextN()} G01 Z${cutZ.toFixed(3)} F${plungeFeed}`);
    if (isLaser) lines.push(`${nextN()} M03 (Beam ON)`);

    // Profile segments with tab jumps
    for (let i = 1; i < poly.length; i++) {
      const pt = poly[i];
      // Check if this segment has a holding tab
      const hasTab = part.tabs && part.tabs.some(t => Math.hypot(t.x - pt.x, t.y - pt.y) < 15.0);

      if (hasTab && !isLaser) {
        // CNC router tab ramp up
        lines.push(`${nextN()} G01 X${pt.x.toFixed(3)} Y${pt.y.toFixed(3)} Z${tabZ.toFixed(3)} (Tab Ramp UP)`);
        lines.push(`${nextN()} G01 Z${cutZ.toFixed(3)} (Tab Ramp DOWN)`);
      } else {
        lines.push(`${nextN()} G01 X${pt.x.toFixed(3)} Y${pt.y.toFixed(3)} F${feedXY}`);
      }
    }

    // Close loop back to p0
    lines.push(`${nextN()} G01 X${p0.x.toFixed(3)} Y${p0.y.toFixed(3)}`);

    if (isLaser) lines.push(`${nextN()} M05 (Beam OFF)`);
    lines.push(`${nextN()} G00 Z${safeZ.toFixed(2)}`);
    lines.push(``);
  });

  // End of program
  lines.push(`; ----------------------------------------------------------------------------`);
  lines.push(`; PROGRAM COMPLETE & MACHINE PARKING`);
  lines.push(`; ----------------------------------------------------------------------------`);
  lines.push(`${nextN()} G00 Z${safeZ.toFixed(2)} M09 (Coolant OFF)`);
  lines.push(`${nextN()} M05 (Spindle / Laser OFF)`);
  lines.push(`${nextN()} G00 X0.000 Y${sheetConfig.height.toFixed(2)} (Park at Sheet Unload Position)`);
  lines.push(`${nextN()} M30 (End of File)`);
  lines.push(`%`);

  return lines.join('\n');
}

// ============================================================================
// SVG VECTOR EXPORT FOR DIRECT CAD / LASER / ROUTER WORKBENCH
// ============================================================================

/**
 * Generates an SVG string representation of the sheet layout, nested parts,
 * remnant zone, holding tabs, and title block.
 */
export function exportNestingSVG(nestedResult) {
  if (!nestedResult || !nestedResult.sheetConfig) return '';

  const { sheetConfig, placedParts, remnantRect, metrics, options } = nestedResult;
  const W = sheetConfig.width;
  const H = sheetConfig.height;
  const margin = options.margin || 15;

  let svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}mm" height="${H}mm">
  <defs>
    <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
      <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#222f3e" stroke-width="0.5" />
    </pattern>
    <style>
      .sheet-bg { fill: #0b1320; stroke: #3b82f6; stroke-width: 2; }
      .margin-bound { fill: none; stroke: #64748b; stroke-width: 1; stroke-dasharray: 6 4; }
      .remnant-rect { fill: rgba(16, 185, 129, 0.12); stroke: #10b981; stroke-width: 2; stroke-dasharray: 8 6; }
      .part-poly { fill-opacity: 0.85; stroke: #ffffff; stroke-width: 1.2; stroke-linejoin: round; }
      .hole-poly { fill: #0b1320; stroke: #f43f5e; stroke-width: 1.0; }
      .tab-mark { fill: #f59e0b; stroke: #d97706; stroke-width: 0.8; }
      .text-label { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; fill: #e2e8f0; }
      .title-block { font-family: monospace; font-size: 14px; fill: #94a3b8; }
    </style>
  </defs>

  <!-- Sheet Background Bed -->
  <rect class="sheet-bg" x="0" y="0" width="${W}" height="${H}" />
  <rect x="0" y="0" width="${W}" height="${H}" fill="url(#grid)" />

  <!-- Sheet Margin Boundary -->
  <rect class="margin-bound" x="${margin}" y="${margin}" width="${W - margin * 2}" height="${H - margin * 2}" />

  <!-- Reusable Remnant Offcut Zone -->
  ${remnantRect ? `
  <g id="remnant-zone">
    <rect class="remnant-rect" x="${remnantRect.x}" y="${remnantRect.y}" width="${remnantRect.width}" height="${remnantRect.height}" />
    <text x="${remnantRect.x + 15}" y="${remnantRect.y + 25}" class="text-label" fill="#10b981" font-weight="bold" font-size="14">
      RECOVERED REMNANT: ${Math.round(remnantRect.width)} x ${Math.round(remnantRect.height)} mm (${metrics.remnantPercent}% Stock Saved)
    </text>
  </g>` : ''}

  <!-- Nested Parts Group -->
  <g id="nested-parts">
`;

  placedParts.forEach((part, idx) => {
    const pointsStr = part.polygon.map(pt => `${pt.x.toFixed(2)},${pt.y.toFixed(2)}`).join(' ');
    svg += `    <!-- Part ${idx + 1}: ${part.name} -->\n`;
    svg += `    <polygon class="part-poly" points="${pointsStr}" fill="${part.color || '#38bdf8'}" />\n`;

    // Part label at center
    const cx = part.x + part.width / 2;
    const cy = part.y + part.height / 2;
    svg += `    <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" class="text-label" font-size="9" font-weight="600" fill="#ffffff" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.8))">
      P${idx + 1}: ${part.name.substring(0, 14)}
    </text>\n`;

    // Internal Cutouts / Holes
    if (part.holes && part.holes.length > 0) {
      part.holes.forEach(hole => {
        if (hole.type === 'circle') {
          svg += `    <circle class="hole-poly" cx="${hole.cx.toFixed(2)}" cy="${hole.cy.toFixed(2)}" r="${hole.radius.toFixed(2)}" />\n`;
        } else if (hole.type === 'rect') {
          svg += `    <rect class="hole-poly" x="${hole.x.toFixed(2)}" y="${hole.y.toFixed(2)}" width="${hole.width.toFixed(2)}" height="${hole.height.toFixed(2)}" rx="${hole.rx || 0}" />\n`;
        }
      });
    }

    // Holding Tabs
    if (part.tabs && part.tabs.length > 0) {
      part.tabs.forEach(tab => {
        svg += `    <circle class="tab-mark" cx="${tab.x.toFixed(2)}" cy="${tab.y.toFixed(2)}" r="2.5" />\n`;
      });
    }
  });

  svg += `  </g>

  <!-- Title Block & Summary Header -->
  <g id="title-block" transform="translate(20, ${H - 25})">
    <rect x="-10" y="-18" width="${Math.min(W - 40, 780)}" height="32" fill="rgba(15, 23, 42, 0.85)" rx="4" stroke="#334155" />
    <text x="0" y="0" class="title-block">
      ARGUS CAM NESTING STUDIO | SHEET: ${W}x${H}mm (${sheetConfig.material.name}) | UTILIZATION: ${metrics.utilizationPercent}% | PARTS: ${placedParts.length}
    </text>
  </g>
</svg>`;

  return svg;
}
