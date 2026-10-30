/**
 * Mastercam Cutter Radius Compensation & Multi-Island Pocketing Engine (Step 2)
 * Powered by industrial ClipperLib (Angus Johnson's Polygon Offsetting & Clipping)
 * Implements G41 (Left / Climb) and G42 (Right / Conventional) toolpath offsets
 * and contour parallel pocket stepovers without self-intersecting tool loops.
 */

import ClipperLib from 'clipper-lib';

const SCALE = 10000; // Integer precision multiplier for Clipper

export const CUTTER_COMP_SIDE = {
  OFF: 'G40',
  LEFT: 'G41',  // Climb Milling
  RIGHT: 'G42'  // Conventional Milling
};

/**
 * Computes exact 2D Cutter Radius Compensation offset path
 * @param {Array<{x: number, y: number}>} points Contour vertices in mm
 * @param {number} cutterRadius Tool radius in mm (e.g. 5mm for 10mm endmill)
 * @param {string} compSide G41 (Left) | G42 (Right)
 * @param {string} joinType 'miter' | 'round' | 'square'
 * @returns {Array<{x: number, y: number}>} Offset tool centerline trajectory
 */
export function computeCutterCompensationPath(
  points,
  cutterRadius = 5.0,
  compSide = CUTTER_COMP_SIDE.LEFT,
  joinType = 'round'
) {
  if (!points || points.length < 2) return points;

  // Convert mm floats to scaled Clipper integers
  const path = points.map(pt => ({
    X: Math.round(pt.x * SCALE),
    Y: Math.round(pt.y * SCALE)
  }));

  const co = new ClipperLib.ClipperOffset();

  let jt = ClipperLib.JoinType.jtRound;
  if (joinType === 'miter') jt = ClipperLib.JoinType.jtMiter;
  if (joinType === 'square') jt = ClipperLib.JoinType.jtSquare;

  co.AddPath(path, jt, ClipperLib.EndType.etClosedPolygon);

  // G41 offsets outward (positive delta), G42 offsets inward (negative delta)
  const delta = (compSide === CUTTER_COMP_SIDE.LEFT ? 1 : -1) * (cutterRadius * SCALE);

  const solution = new ClipperLib.Paths();
  co.Execute(solution, delta);

  if (solution.length === 0) {
    return points; // Fallback if offset collapses
  }

  // Convert back to mm floats
  return solution[0].map(pt => ({
    x: pt.X / SCALE,
    y: pt.Y / SCALE
  }));
}

/**
 * Generates Mastercam-grade Contour-Parallel Pocketing stepover passes with Island Avoidance
 * @param {Array<{x: number, y: number}>} boundary Outer pocket polygon
 * @param {Array<Array<{x: number, y: number}>>} islands List of inner keep-out bosses/clamps
 * @param {number} toolDiameter Cutter diameter in mm
 * @param {number} stepoverPct Stepover percentage (e.g. 60 = 60% of tool dia)
 * @returns {Array<Array<{x: number, y: number}>>} Concentric pocketing clearing rings
 */
export function generateContourPocketPasses(
  boundary,
  islands = [],
  toolDiameter = 10.0,
  stepoverPct = 65
) {
  const stepover = toolDiameter * (stepoverPct / 100);
  const toolRadius = toolDiameter / 2;

  const resultPasses = [];

  // Initialize initial offset from outer boundary
  let currentOffset = toolRadius;
  let hasValidGeometry = true;
  let maxPasses = 50;

  const scaledBoundary = boundary.map(p => ({ X: Math.round(p.x * SCALE), Y: Math.round(p.y * SCALE) }));

  while (hasValidGeometry && maxPasses-- > 0) {
    const co = new ClipperLib.ClipperOffset();
    co.AddPath(scaledBoundary, ClipperLib.JoinType.jtRound, ClipperLib.EndType.etClosedPolygon);

    const offsetSolution = new ClipperLib.Paths();
    // Inward offset for interior pocket clearing
    co.Execute(offsetSolution, -(currentOffset * SCALE));

    if (offsetSolution.length === 0) {
      hasValidGeometry = false;
      break;
    }

    // If islands exist, subtract island buffers
    let currentPassPaths = offsetSolution;
    if (islands.length > 0) {
      const islandClipper = new ClipperLib.Clipper();
      islandClipper.AddPaths(offsetSolution, ClipperLib.PolyType.ptSubject, true);

      islands.forEach(island => {
        const islandOffset = new ClipperLib.ClipperOffset();
        const scaledIsland = island.map(p => ({ X: Math.round(p.x * SCALE), Y: Math.round(p.y * SCALE) }));
        islandOffset.AddPath(scaledIsland, ClipperLib.JoinType.jtRound, ClipperLib.EndType.etClosedPolygon);
        const expandedIsland = new ClipperLib.Paths();
        islandOffset.Execute(expandedIsland, toolRadius * SCALE);

        islandClipper.AddPaths(expandedIsland, ClipperLib.PolyType.ptClip, true);
      });

      const cutPasses = new ClipperLib.Paths();
      islandClipper.Execute(ClipperLib.ClipType.ctDifference, cutPasses, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
      currentPassPaths = cutPasses;
    }

    // Convert valid rings to millimeter output
    currentPassPaths.forEach(path => {
      if (path.length > 2) {
        resultPasses.push(path.map(pt => ({
          x: pt.X / SCALE,
          y: pt.Y / SCALE
        })));
      }
    });

    currentOffset += stepover;
  }

  return resultPasses;
}

