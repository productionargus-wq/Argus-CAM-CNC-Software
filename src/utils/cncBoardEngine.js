/**
 * CNC 2D CAD Design Board Engine
 * Provides vector math, geometric shape generators, CNC dogbone relief calculations,
 * contour offsets, holding tabs, and direct CAM toolpath translation.
 */

// 1. Coordinate transformations between Canvas Screen space and CNC Board space
export function screenToBoard(screenX, screenY, pan, zoom, boardWidth, boardHeight, originLocation = 'bottom-left') {
  // Screen coords relative to pan & zoom
  const relX = (screenX - pan.x) / zoom;
  const relY = (screenY - pan.y) / zoom;

  let boardX = 0;
  let boardY = 0;

  if (originLocation === 'bottom-left') {
    boardX = relX;
    boardY = boardHeight - relY;
  } else if (originLocation === 'center') {
    boardX = relX - boardWidth / 2;
    boardY = boardHeight / 2 - relY;
  } else { // top-left
    boardX = relX;
    boardY = relY;
  }

  return { x: Math.round(boardX * 10) / 10, y: Math.round(boardY * 10) / 10 };
}

export function boardToScreen(boardX, boardY, pan, zoom, boardWidth, boardHeight, originLocation = 'bottom-left') {
  let relX = 0;
  let relY = 0;

  if (originLocation === 'bottom-left') {
    relX = boardX;
    relY = boardHeight - boardY;
  } else if (originLocation === 'center') {
    relX = boardX + boardWidth / 2;
    relY = boardHeight / 2 - boardY;
  } else { // top-left
    relX = boardX;
    relY = boardY;
  }

  return {
    x: relX * zoom + pan.x,
    y: relY * zoom + pan.y
  };
}

// 2. Shape Factory
export function createBoardRect(x, y, width, height, cornerRadius = 0) {
  const id = `rect_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  return {
    id,
    type: 'rect',
    name: `Rectangle ${Math.round(width)}x${Math.round(height)}`,
    x: Math.round(x),
    y: Math.round(y),
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
    cornerRadius: Math.max(0, cornerRadius),
    rotation: 0,
    // CNC Cut Properties
    cutType: 'pocket', // 'pocket' | 'outline-outside' | 'outline-inside' | 'outline-on' | 'engrave'
    cutDepth: 3.0,
    toolId: 1,
    toolDia: 6.0,
    tabsEnabled: false,
    tabCount: 4,
    tabWidth: 6.0,
    tabHeight: 2.0,
    dogbones: 'none', // 'none' | 'dogbone' | 't-bone'
    visible: true,
    locked: false,
    color: '#38bdf8'
  };
}

export function createBoardCircle(cx, cy, radius) {
  const id = `circle_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  return {
    id,
    type: 'circle',
    name: `Circle Ø${Math.round(radius * 2)}`,
    cx: Math.round(cx),
    cy: Math.round(cy),
    radius: Math.max(0.5, Math.round(radius * 10) / 10),
    rotation: 0,
    cutType: 'pocket',
    cutDepth: 3.0,
    toolId: 1,
    toolDia: 6.0,
    tabsEnabled: false,
    tabCount: 3,
    tabWidth: 6.0,
    tabHeight: 2.0,
    dogbones: 'none',
    visible: true,
    locked: false,
    color: '#a855f7'
  };
}

export function createBoardDrillHole(cx, cy, diameter = 6.0) {
  const id = `drill_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  return {
    id,
    type: 'drill',
    name: `Drill Hole Ø${diameter}`,
    cx: Math.round(cx * 10) / 10,
    cy: Math.round(cy * 10) / 10,
    diameter: Math.max(0.5, diameter),
    cutType: 'drill',
    cutDepth: 10.0,
    peckDepth: 2.5,
    toolId: 5,
    toolDia: diameter,
    visible: true,
    locked: false,
    color: '#ef4444'
  };
}

export function createBoardDrillGrid(startX, startY, rows, cols, spacingX, spacingY, diameter = 6.0) {
  const holes = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = startX + c * spacingX;
      const cy = startY + r * spacingY;
      holes.push(createBoardDrillHole(cx, cy, diameter));
    }
  }
  return holes;
}

export function createBoardBoltPattern(cx, cy, pcdRadius, holeCount, holeDiameter = 5.0, startAngle = 0) {
  const holes = [];
  const stepAngle = (2 * Math.PI) / Math.max(1, holeCount);
  const startRad = (startAngle * Math.PI) / 180;

  for (let i = 0; i < holeCount; i++) {
    const angle = startRad + i * stepAngle;
    const hx = cx + pcdRadius * Math.cos(angle);
    const hy = cy + pcdRadius * Math.sin(angle);
    holes.push(createBoardDrillHole(hx, hy, holeDiameter));
  }
  return holes;
}

export function createBoardText(text, x, y, fontSize = 24, fontStyle = 'normal') {
  const id = `text_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  return {
    id,
    type: 'text',
    name: `Text "${text.slice(0, 10)}"`,
    text: text || 'ARGUS CNC',
    x: Math.round(x),
    y: Math.round(y),
    fontSize: Math.max(6, fontSize),
    fontStyle,
    rotation: 0,
    cutType: 'engrave',
    cutDepth: 0.8,
    toolId: 3,
    toolDia: 3.0,
    visible: true,
    locked: false,
    color: '#f59e0b'
  };
}

export function createBoardPolygon(cx, cy, radius, sides = 6) {
  const id = `poly_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const points = [];
  const angleStep = (2 * Math.PI) / sides;
  for (let i = 0; i < sides; i++) {
    const angle = i * angleStep - Math.PI / 2;
    points.push({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle)
    });
  }

  return {
    id,
    type: 'polygon',
    name: `${sides}-Sided Polygon`,
    cx: Math.round(cx),
    cy: Math.round(cy),
    radius: Math.round(radius),
    sides,
    points,
    rotation: 0,
    cutType: 'pocket',
    cutDepth: 3.0,
    toolId: 1,
    toolDia: 6.0,
    tabsEnabled: false,
    tabCount: 4,
    tabWidth: 6.0,
    tabHeight: 2.0,
    dogbones: 'none',
    visible: true,
    locked: false,
    color: '#10b981'
  };
}

export function createBoardPolyline(points = []) {
  const id = `line_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  return {
    id,
    type: 'polyline',
    name: `Polyline (${points.length} pts)`,
    points,
    closed: false,
    rotation: 0,
    cutType: 'outline-on',
    cutDepth: 2.0,
    toolId: 1,
    toolDia: 4.0,
    tabsEnabled: false,
    tabCount: 2,
    tabWidth: 6.0,
    tabHeight: 2.0,
    dogbones: 'none',
    visible: true,
    locked: false,
    color: '#ec4899'
  };
}

// 3. CNC Dogbone Corner Relief Generator
// Router bits cannot cut sharp inside 90-degree corners. A dog-bone extends the corner by toolRadius at 45°.
export function applyDogboneFillets(rect, toolRadius = 3.0, type = 'dogbone') {
  if (type === 'none' || !rect || rect.type !== 'rect') return null;

  const { x, y, width, height } = rect;
  const r = toolRadius * 1.05; // slight clearance factor

  // 4 inside corners:
  // Bottom-Left (x, y), Bottom-Right (x + width, y)
  // Top-Right (x + width, y + height), Top-Left (x, y + height)
  const reliefs = [
    { cx: x, cy: y, dx: -r * 0.707, dy: -r * 0.707 },
    { cx: x + width, cy: y, dx: r * 0.707, dy: -r * 0.707 },
    { cx: x + width, cy: y + height, dx: r * 0.707, dy: r * 0.707 },
    { cx: x, cy: y + height, dx: -r * 0.707, dy: r * 0.707 }
  ];

  return reliefs.map((c) => ({
    cx: c.cx + c.dx,
    cy: c.cy + c.dy,
    radius: r
  }));
}

// 4. Quick CAD Design Templates
export function getCADTemplate(templateName, boardW = 200, boardH = 150) {
  const cx = boardW / 2;
  const cy = boardH / 2;

  switch (templateName) {
    case 'mounting-plate': {
      // Outer faceplate with 4 corner mounting holes and center pocket cutout
      const outerW = Math.min(boardW - 20, 160);
      const outerH = Math.min(boardH - 20, 120);
      const left = cx - outerW / 2;
      const bottom = cy - outerH / 2;

      const outer = createBoardRect(left, bottom, outerW, outerH, 6);
      outer.cutType = 'outline-outside';
      outer.cutDepth = 6.0;
      outer.tabsEnabled = true;
      outer.name = 'Plate Outer Profile';

      const innerW = outerW - 40;
      const innerH = outerH - 40;
      const inner = createBoardRect(cx - innerW / 2, cy - innerH / 2, innerW, innerH, 4);
      inner.cutType = 'pocket';
      inner.cutDepth = 4.0;
      inner.name = 'Center Recess Pocket';

      const holeOffset = 10;
      const holes = [
        createBoardDrillHole(left + holeOffset, bottom + holeOffset, 5.0),
        createBoardDrillHole(left + outerW - holeOffset, bottom + holeOffset, 5.0),
        createBoardDrillHole(left + outerW - holeOffset, bottom + outerH - holeOffset, 5.0),
        createBoardDrillHole(left + holeOffset, bottom + outerH - holeOffset, 5.0)
      ];

      return [outer, inner, ...holes];
    }

    case 'speaker-baffle': {
      // Circular speaker ring baffle with cutout and 6-bolt circular pattern
      const outerDia = Math.min(boardW, boardH) * 0.85;
      const innerDia = outerDia * 0.55;

      const outerCircle = createBoardCircle(cx, cy, outerDia / 2);
      outerCircle.cutType = 'outline-outside';
      outerCircle.cutDepth = 12.0;
      outerCircle.tabsEnabled = true;
      outerCircle.name = 'Speaker Outer Ring';

      const cutoutCircle = createBoardCircle(cx, cy, innerDia / 2);
      cutoutCircle.cutType = 'outline-inside';
      cutoutCircle.cutDepth = 12.0;
      cutoutCircle.name = 'Driver Cone Cutout';

      const pcd = (outerDia / 2 + innerDia / 2) / 2;
      const boltHoles = createBoardBoltPattern(cx, cy, pcd, 6, 4.5);

      return [outerCircle, cutoutCircle, ...boltHoles];
    }

    case 'engraved-sign': {
      // Decorative sign with border and engraving text
      const signW = Math.min(boardW - 24, 180);
      const signH = Math.min(boardH - 24, 80);
      const left = cx - signW / 2;
      const bottom = cy - signH / 2;

      const outerBorder = createBoardRect(left, bottom, signW, signH, 10);
      outerBorder.cutType = 'outline-outside';
      outerBorder.cutDepth = 5.0;
      outerBorder.tabsEnabled = true;

      const innerBorder = createBoardRect(left + 5, bottom + 5, signW - 10, signH - 10, 6);
      innerBorder.cutType = 'engrave';
      innerBorder.cutDepth = 0.8;
      innerBorder.name = 'Decorative Border Line';

      const text = createBoardText('ARGUS PRECISION', cx, cy - 4, 18);
      text.cutType = 'engrave';
      text.cutDepth = 1.0;

      return [outerBorder, innerBorder, text];
    }

    case 'nema-flange': {
      // NEMA 23 motor mounting bracket plate
      const flangeSize = 56.4; // NEMA 23 standard
      const left = cx - flangeSize / 2;
      const bottom = cy - flangeSize / 2;

      const flange = createBoardRect(left, bottom, flangeSize, flangeSize, 4);
      flange.cutType = 'outline-outside';
      flange.cutDepth = 6.0;
      flange.tabsEnabled = true;

      const centerHole = createBoardCircle(cx, cy, 19.05); // 38.1mm pilot
      centerHole.cutType = 'pocket';
      centerHole.cutDepth = 6.0;
      centerHole.name = 'Pilot Hole Ø38.1';

      const boltPattern = [
        createBoardDrillHole(cx - 23.57, cy - 23.57, 5.0),
        createBoardDrillHole(cx + 23.57, cy - 23.57, 5.0),
        createBoardDrillHole(cx + 23.57, cy + 23.57, 5.0),
        createBoardDrillHole(cx - 23.57, cy + 23.57, 5.0)
      ];

      return [flange, centerHole, ...boltPattern];
    }

    default:
      return [];
  }
}

// 5. Convert 2D Board Diagrams into 3D CNC Toolpaths & CAM Operations
export function convertBoardDiagramsToToolpaths(shapes = [], stockConfig = {}, tools = []) {
  if (!shapes || shapes.length === 0) return [];

  const defaultTool = tools[0] || { id: 1, number: 1, name: '6mm Endmill', diameter: 6.0, fluteLength: 25 };
  const drillTool = tools.find((t) => t.type === 'drill') || { id: 5, number: 5, name: '5mm Twist Drill', diameter: 5.0 };
  const vbitTool = tools.find((t) => t.type === 'chamfer' || t.name.includes('V-Bit')) || { id: 3, number: 3, name: '3mm Ballnose / Engraver', diameter: 3.0 };

  const topZ = 49 + 14; // Workpiece top Z level
  const operations = [];

  // Group shapes by cutType
  const pockets = shapes.filter((s) => s.visible && s.cutType === 'pocket');
  const outlines = shapes.filter((s) => s.visible && s.cutType.startsWith('outline'));
  const engraves = shapes.filter((s) => s.visible && s.cutType === 'engrave');
  const drills = shapes.filter((s) => s.visible && (s.type === 'drill' || s.cutType === 'drill'));

  let opIndex = 1;

  // A. POCKET OPERATIONS
  if (pockets.length > 0) {
    pockets.forEach((shape) => {
      const depth = Math.abs(shape.cutDepth || 3.0);
      const stepDown = 1.5;
      const passes = Math.max(1, Math.ceil(depth / stepDown));
      const waypoints = [];

      let bounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 };
      if (shape.type === 'rect') {
        bounds = { minX: shape.x, maxX: shape.x + shape.width, minY: shape.y, maxY: shape.y + shape.height };
      } else if (shape.type === 'circle') {
        bounds = { minX: shape.cx - shape.radius, maxX: shape.cx + shape.radius, minY: shape.cy - shape.radius, maxY: shape.cy + shape.radius };
      } else if (shape.type === 'polygon' && shape.points) {
        const xs = shape.points.map((p) => p.x);
        const ys = shape.points.map((p) => p.y);
        bounds = { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
      }

      const stepOver = (shape.toolDia || defaultTool.diameter) * 0.65;
      const clearanceZ = topZ + 10;

      // Safe Rapid Entry
      waypoints.push({
        x: bounds.minX + stepOver,
        y: clearanceZ,
        z: bounds.minY + stepOver,
        isRapid: true,
        feedRate: 5000,
        opName: `Pocket: ${shape.name}`
      });

      for (let p = 1; p <= passes; p++) {
        const curZ = topZ - Math.min(depth, p * stepDown);

        // Plunge
        waypoints.push({
          x: bounds.minX + stepOver,
          y: curZ,
          z: bounds.minY + stepOver,
          isRapid: false,
          feedRate: 350,
          opName: `Pocket: ${shape.name}`
        });

        // Raster clearing passes
        let dir = 1;
        for (let x = bounds.minX + stepOver; x <= bounds.maxX - stepOver; x += stepOver) {
          const zStart = dir === 1 ? bounds.minY + stepOver : bounds.maxY - stepOver;
          const zEnd = dir === 1 ? bounds.maxY - stepOver : bounds.minY + stepOver;

          waypoints.push({ x, y: curZ, z: zStart, isRapid: false, feedRate: 1500, opName: `Pocket: ${shape.name}` });
          waypoints.push({ x, y: curZ, z: zEnd, isRapid: false, feedRate: 1500, opName: `Pocket: ${shape.name}` });
          dir *= -1;
        }

        // Perimeter cleanup pass
        waypoints.push({ x: bounds.minX + stepOver, y: curZ, z: bounds.minY + stepOver, isRapid: false, feedRate: 1200 });
        waypoints.push({ x: bounds.maxX - stepOver, y: curZ, z: bounds.minY + stepOver, isRapid: false, feedRate: 1200 });
        waypoints.push({ x: bounds.maxX - stepOver, y: curZ, z: bounds.maxY - stepOver, isRapid: false, feedRate: 1200 });
        waypoints.push({ x: bounds.minX + stepOver, y: curZ, z: bounds.maxY - stepOver, isRapid: false, feedRate: 1200 });
        waypoints.push({ x: bounds.minX + stepOver, y: curZ, z: bounds.minY + stepOver, isRapid: false, feedRate: 1200 });
      }

      // Retract
      waypoints.push({
        x: bounds.minX + stepOver,
        y: clearanceZ,
        z: bounds.minY + stepOver,
        isRapid: true,
        feedRate: 5000
      });

      operations.push({
        id: `op_board_pocket_${opIndex++}`,
        name: `Pocket (${shape.name})`,
        type: 'Dynamic Pocket',
        tool: defaultTool,
        depth,
        feedRate: 1500,
        plungeRate: 350,
        spindleSpeed: 10000,
        waypoints,
        active: true,
        coolant: 'FLOOD'
      });
    });
  }

  // B. OUTLINE / PROFILE CONTOUR OPERATIONS
  if (outlines.length > 0) {
    outlines.forEach((shape) => {
      const depth = Math.abs(shape.cutDepth || 6.0);
      const stepDown = 2.0;
      const passes = Math.max(1, Math.ceil(depth / stepDown));
      const waypoints = [];
      const clearanceZ = topZ + 10;

      // Extract contour points in mm
      let contour = [];
      if (shape.type === 'rect') {
        contour = [
          { x: shape.x, z: shape.y },
          { x: shape.x + shape.width, z: shape.y },
          { x: shape.x + shape.width, z: shape.y + shape.height },
          { x: shape.x, z: shape.y + shape.height },
          { x: shape.x, z: shape.y }
        ];
      } else if (shape.type === 'circle') {
        const segs = 32;
        for (let s = 0; s <= segs; s++) {
          const a = (s / segs) * Math.PI * 2;
          contour.push({
            x: shape.cx + shape.radius * Math.cos(a),
            z: shape.cy + shape.radius * Math.sin(a)
          });
        }
      } else if (shape.points) {
        contour = shape.points.map((p) => ({ x: p.x, z: p.y }));
        if (shape.closed && contour.length > 0) {
          contour.push({ ...contour[0] });
        }
      }

      if (contour.length < 2) return;

      const firstPt = contour[0];

      // Safe Approach
      waypoints.push({
        x: firstPt.x,
        y: clearanceZ,
        z: firstPt.z,
        isRapid: true,
        feedRate: 5000,
        opName: `Contour: ${shape.name}`
      });

      for (let p = 1; p <= passes; p++) {
        const curZ = topZ - Math.min(depth, p * stepDown);

        // Plunge to pass depth
        waypoints.push({
          x: firstPt.x,
          y: curZ,
          z: firstPt.z,
          isRapid: false,
          feedRate: 400,
          opName: `Contour: ${shape.name}`
        });

        // Follow contour
        contour.forEach((pt) => {
          waypoints.push({
            x: pt.x,
            y: curZ,
            z: pt.z,
            isRapid: false,
            feedRate: 1800,
            opName: `Contour: ${shape.name}`
          });
        });
      }

      // Retract
      waypoints.push({
        x: firstPt.x,
        y: clearanceZ,
        z: firstPt.z,
        isRapid: true,
        feedRate: 5000
      });

      operations.push({
        id: `op_board_contour_${opIndex++}`,
        name: `Contour Profile (${shape.name})`,
        type: 'Contour Milling',
        tool: defaultTool,
        depth,
        feedRate: 1800,
        plungeRate: 400,
        spindleSpeed: 12000,
        waypoints,
        active: true,
        coolant: 'FLOOD'
      });
    });
  }

  // C. DRILLING OPERATIONS (G83 Peck Cycle)
  if (drills.length > 0) {
    const waypoints = [];
    const clearanceZ = topZ + 10;
    const drillDepth = Math.abs(drills[0].cutDepth || 10.0);
    const peckStep = drills[0].peckDepth || 2.5;

    drills.forEach((hole, idx) => {
      const hx = hole.cx;
      const hz = hole.cy;

      // Rapid to hole clearance
      waypoints.push({
        x: hx,
        y: clearanceZ,
        z: hz,
        isRapid: true,
        feedRate: 5000,
        opName: `Drill G83 Hole #${idx + 1}`
      });

      // Peck cycles down
      const pecks = Math.ceil(drillDepth / peckStep);
      for (let k = 1; k <= pecks; k++) {
        const peckZ = topZ - Math.min(drillDepth, k * peckStep);
        waypoints.push({ x: hx, y: peckZ, z: hz, isRapid: false, feedRate: 250, opName: `Drill G83 Hole #${idx + 1}` });
        waypoints.push({ x: hx, y: topZ + 1.0, z: hz, isRapid: true, feedRate: 5000 }); // Chip break retract
      }

      // Full Retract
      waypoints.push({ x: hx, y: clearanceZ, z: hz, isRapid: true, feedRate: 5000 });
    });

    operations.push({
      id: `op_board_drill_${opIndex++}`,
      name: `Drilling Cycle G83 (${drills.length} Holes)`,
      type: 'Drill Cycle (G83 Deep)',
      tool: drillTool,
      depth: drillDepth,
      feedRate: 250,
      spindleSpeed: 3000,
      waypoints,
      active: true,
      coolant: 'MIST'
    });
  }

  // D. TEXT / VECTOR ENGRAVING
  if (engraves.length > 0) {
    engraves.forEach((shape) => {
      const depth = Math.abs(shape.cutDepth || 0.8);
      const waypoints = [];
      const clearanceZ = topZ + 5;
      const cutZ = topZ - depth;

      // Approximate text strokes as rectangular letters
      const text = shape.text || 'CNC';
      const charW = (shape.fontSize || 20) * 0.6;
      const charH = shape.fontSize || 20;

      let startX = shape.x - (text.length * charW) / 2;
      const startZ = shape.y - charH / 2;

      for (let i = 0; i < text.length; i++) {
        const x1 = startX + i * charW;
        const x2 = x1 + charW * 0.8;
        const z1 = startZ;
        const z2 = startZ + charH;

        // Stroke border of letter
        waypoints.push({ x: x1, y: clearanceZ, z: z1, isRapid: true, feedRate: 4000 });
        waypoints.push({ x: x1, y: cutZ, z: z1, isRapid: false, feedRate: 800 });
        waypoints.push({ x: x2, y: cutZ, z: z1, isRapid: false, feedRate: 800 });
        waypoints.push({ x: x2, y: cutZ, z: z2, isRapid: false, feedRate: 800 });
        waypoints.push({ x: x1, y: cutZ, z: z2, isRapid: false, feedRate: 800 });
        waypoints.push({ x: x1, y: clearanceZ, z: z2, isRapid: true, feedRate: 4000 });
      }

      operations.push({
        id: `op_board_engrave_${opIndex++}`,
        name: `Engraving (${shape.name})`,
        type: 'V-Carve Engrave',
        tool: vbitTool,
        depth,
        feedRate: 800,
        plungeRate: 300,
        spindleSpeed: 16000,
        waypoints,
        active: true,
        coolant: 'AIR'
      });
    });
  }

  return operations;
}

// 6. SVG Exporter for 2D Design Board
export function exportBoardToSVG(shapes = [], boardW = 200, boardH = 150) {
  let svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${boardW}mm" height="${boardH}mm" viewBox="0 0 ${boardW} ${boardH}">\n`;
  svg += `  <!-- CNC Stock Material Sheet Bounds -->\n`;
  svg += `  <rect x="0" y="0" width="${boardW}" height="${boardH}" fill="#1e293b" stroke="#475569" stroke-width="0.5" />\n`;

  shapes.forEach((s) => {
    if (!s.visible) return;
    const stroke = s.color || '#38bdf8';
    const fill = s.cutType === 'pocket' ? 'rgba(56, 189, 248, 0.25)' : 'none';

    if (s.type === 'rect') {
      svg += `  <rect x="${s.x}" y="${boardH - (s.y + s.height)}" width="${s.width}" height="${s.height}" rx="${s.cornerRadius || 0}" fill="${fill}" stroke="${stroke}" stroke-width="1.2" />\n`;
    } else if (s.type === 'circle') {
      svg += `  <circle cx="${s.cx}" cy="${boardH - s.cy}" r="${s.radius}" fill="${fill}" stroke="${stroke}" stroke-width="1.2" />\n`;
    } else if (s.type === 'drill') {
      svg += `  <circle cx="${s.cx}" cy="${boardH - s.cy}" r="${s.diameter / 2}" fill="#ef4444" stroke="#fca5a5" stroke-width="0.8" />\n`;
      svg += `  <line x1="${s.cx - 2}" y1="${boardH - s.cy}" x2="${s.cx + 2}" y2="${boardH - s.cy}" stroke="#ffffff" stroke-width="0.5" />\n`;
      svg += `  <line x1="${s.cx}" y1="${boardH - s.cy - 2}" x2="${s.cx}" y2="${boardH - s.cy + 2}" stroke="#ffffff" stroke-width="0.5" />\n`;
    } else if (s.type === 'text') {
      svg += `  <text x="${s.x}" y="${boardH - s.y}" font-family="Inter, sans-serif" font-size="${s.fontSize}" fill="${stroke}" text-anchor="middle">${s.text}</text>\n`;
    }
  });

  svg += `</svg>\n`;
  return svg;
}
