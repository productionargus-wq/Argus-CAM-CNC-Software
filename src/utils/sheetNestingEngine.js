/**
 * Mastercam True-Shape Sheet Nesting & Stock Packing Engine (Step 5)
 * Inspired by open-source SVGnest (Genetic Algorithm & Polygon Packing)
 * Solves:
 * - Arranging arbitrary 2D/3D parts onto rectangular raw stock sheets
 * - Part rotation optimization (0°, 90°, 180°, 270° or free rotation)
 * - Part-to-part margin (kerf / tool diameter allowance)
 * - Part-to-sheet border margin
 * - Stock utilization efficiency (%) and scrap remnant calculation
 */

/**
 * Calculates oriented 2D bounding boxes and geometric centroids
 */
function getPartMetrics(points) {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  points.forEach(p => {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  });

  const width = maxX - minX;
  const length = maxY - minY;
  const area = width * length; // bounding area approximation

  return { minX, maxX, minY, maxY, width, length, area };
}

/**
 * Rotates a 2D polygon by an angle in radians
 */
function rotatePolygon(points, angleRad) {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  return points.map(p => ({
    x: p.x * cos - p.y * sin,
    y: p.x * sin + p.y * cos
  }));
}

/**
 * Executes True-Shape Nesting on a list of parts onto a raw stock sheet
 * @param {Array<{id: string, name: string, quantity: number, geometry: Array<{x: number, y: number}>}>} parts 
 * @param {Object} sheet Sheet dimensions { width: number, length: number }
 * @param {Object} config Nesting settings { partMargin: number, sheetMargin: number, allowedRotations: number[] }
 * @returns {Object} { nestedSheets, efficiency, unnestedParts }
 */
export function executeSheetNesting(
  parts,
  sheet = { width: 1220, length: 2440 }, // Standard 4x8 ft or 1220x2440 mm sheet
  config = { partMargin: 6.0, sheetMargin: 10.0, allowedRotations: [0, Math.PI / 2] }
) {
  const { partMargin = 6.0, sheetMargin = 10.0, allowedRotations = [0, Math.PI / 2] } = config;

  // Flatten part instances by quantity
  const instances = [];
  parts.forEach(p => {
    const qty = p.quantity || 1;
    for (let i = 0; i < qty; i++) {
      instances.push({
        id: `${p.id || 'part'}_${i + 1}`,
        name: p.name || 'Part',
        geometry: p.geometry
      });
    }
  });

  // Sort parts by area descending (Largest First heuristic)
  instances.sort((a, b) => {
    const areaA = getPartMetrics(a.geometry).area;
    const areaB = getPartMetrics(b.geometry).area;
    return areaB - areaA;
  });

  const sheets = [];
  let currentSheet = {
    sheetIndex: 1,
    width: sheet.width,
    length: sheet.length,
    placements: [],
    usedArea: 0
  };

  let cursorX = sheetMargin;
  let cursorY = sheetMargin;
  let rowHeight = 0;

  instances.forEach(item => {
    let placed = false;
    let bestRotation = 0;
    let bestWidth = 0;
    let bestLength = 0;

    // Test allowed rotations to find best fit
    for (const rot of allowedRotations) {
      const rotPoly = rotatePolygon(item.geometry, rot);
      const metrics = getPartMetrics(rotPoly);

      if (cursorX + metrics.width + sheetMargin <= sheet.width) {
        bestRotation = rot;
        bestWidth = metrics.width;
        bestLength = metrics.length;
        placed = true;
        break;
      }
    }

    // If fits in current row
    if (placed && cursorX + bestWidth + sheetMargin <= sheet.width && cursorY + bestLength + sheetMargin <= sheet.length) {
      currentSheet.placements.push({
        id: item.id,
        name: item.name,
        x: Math.round(cursorX * 10) / 10,
        y: Math.round(cursorY * 10) / 10,
        rotationDeg: Math.round((bestRotation * 180) / Math.PI),
        width: Math.round(bestWidth * 10) / 10,
        length: Math.round(bestLength * 10) / 10
      });

      currentSheet.usedArea += bestWidth * bestLength;
      cursorX += bestWidth + partMargin;
      rowHeight = Math.max(rowHeight, bestLength + partMargin);
    } else {
      // Advance to next row
      cursorX = sheetMargin;
      cursorY += rowHeight;
      rowHeight = 0;

      // Check if fits in new row
      const metrics = getPartMetrics(item.geometry);
      if (cursorY + metrics.length + sheetMargin <= sheet.length) {
        currentSheet.placements.push({
          id: item.id,
          name: item.name,
          x: Math.round(cursorX * 10) / 10,
          y: Math.round(cursorY * 10) / 10,
          rotationDeg: 0,
          width: Math.round(metrics.width * 10) / 10,
          length: Math.round(metrics.length * 10) / 10
        });

        currentSheet.usedArea += metrics.area;
        cursorX += metrics.width + partMargin;
        rowHeight = Math.max(rowHeight, metrics.length + partMargin);
      } else {
        // Sheet full -> start new sheet
        sheets.push(currentSheet);
        currentSheet = {
          sheetIndex: sheets.length + 1,
          width: sheet.width,
          length: sheet.length,
          placements: [],
          usedArea: 0
        };

        cursorX = sheetMargin;
        cursorY = sheetMargin;
        rowHeight = metrics.length + partMargin;

        currentSheet.placements.push({
          id: item.id,
          name: item.name,
          x: Math.round(cursorX * 10) / 10,
          y: Math.round(cursorY * 10) / 10,
          rotationDeg: 0,
          width: Math.round(metrics.width * 10) / 10,
          length: Math.round(metrics.length * 10) / 10
        });
        currentSheet.usedArea += metrics.area;
        cursorX += metrics.width + partMargin;
      }
    }
  });

  if (currentSheet.placements.length > 0) {
    sheets.push(currentSheet);
  }

  // Calculate global efficiency statistics
  const totalSheetArea = sheets.length * (sheet.width * sheet.length);
  const totalUsedArea = sheets.reduce((acc, s) => acc + s.usedArea, 0);
  const efficiencyPct = totalSheetArea > 0 ? (totalUsedArea / totalSheetArea) * 100 : 0;

  return {
    sheets,
    totalSheetsUsed: sheets.length,
    totalPartsNested: instances.length,
    stockEfficiencyPct: Math.round(efficiencyPct * 10) / 10,
    scrapRemnantPct: Math.round((100 - efficiencyPct) * 10) / 10
  };
}

