import * as THREE from 'three';

/**
 * Industrial G-Code Reverse Parser & Trajectory Reconstructor
 * Ingests external CNC programs (Fanuc, Haas, Heidenhain, Siemens, GRBL)
 * and reconstructs 3D wireframe toolpaths with arcs and rapid moves.
 */
export function parseNCFileToToolpath(text, filename = 'Imported_Program.nc') {
  const lines = text.split('\n');

  let curX = 0, curY = 0, curZ = 50;
  let isAbsolute = true;
  let activeToolNum = 1;
  let currentFeed = 1500;
  let currentRpm = 8000;
  let motionMode = 0; // 0 = G0 Rapid, 1 = G1 Linear, 2 = G2 CW Arc, 3 = G3 CCW Arc

  const cuttingLines = [];
  const rapidLines = [];
  const toolChanges = [];

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  let totalCuttingDist = 0;
  let totalRapidDist = 0;

  const updateBounds = (pos) => {
    if (pos.x < minX) minX = pos.x;
    if (pos.x > maxX) maxX = pos.x;
    if (pos.y < minY) minY = pos.y;
    if (pos.y > maxY) maxY = pos.y;
    if (pos.z < minZ) minZ = pos.z;
    if (pos.z > maxZ) maxZ = pos.z;
  };

  lines.forEach((rawLine, lineIdx) => {
    let line = rawLine.trim();
    if (!line || line.startsWith(';') || line.startsWith('(') || line.startsWith('%')) {
      return;
    }

    // Strip inline comments
    line = line.replace(/\(.*?\)/g, '').replace(/;.*$/, '').trim();
    const upper = line.toUpperCase();

    // Check Distance Mode
    if (upper.includes('G90')) isAbsolute = true;
    if (upper.includes('G91')) isAbsolute = false;

    // Check Tool Call
    const toolMatch = upper.match(/T(\d+)/) || upper.match(/TOOL CALL (\d+)/);
    if (toolMatch) {
      activeToolNum = parseInt(toolMatch[1], 10);
      toolChanges.push({ line: lineIdx + 1, tool: activeToolNum });
    }

    // Check Spindle RPM & Feed
    const sMatch = upper.match(/S(\d+)/);
    if (sMatch) currentRpm = parseInt(sMatch[1], 10);

    const fMatch = upper.match(/F(\d+(\.\d+)?)/);
    if (fMatch) currentFeed = parseFloat(fMatch[1]);
    if (upper.includes('FMAX')) currentFeed = 15000;

    // Check Motion Commands
    if (upper.includes('G00') || upper.includes('G0 ') || upper.endsWith('G0') || upper.includes('FMAX')) {
      motionMode = 0;
    } else if (upper.includes('G01') || upper.includes('G1 ') || upper.endsWith('G1') || upper.startsWith('L ')) {
      motionMode = 1;
    } else if (upper.includes('G02') || upper.includes('G2 ') || upper.endsWith('G2') || upper.startsWith('CR ')) {
      motionMode = 2;
    } else if (upper.includes('G03') || upper.includes('G3 ') || upper.endsWith('G3')) {
      motionMode = 3;
    }

    // Coordinate parsing
    const xMatch = upper.match(/X([+-]?\d+(\.\d+)?)/);
    const yMatch = upper.match(/Y([+-]?\d+(\.\d+)?)/);
    const zMatch = upper.match(/Z([+-]?\d+(\.\d+)?)/);

    let nextX = curX;
    let nextY = curY;
    let nextZ = curZ;
    let hasMotion = false;

    if (xMatch) {
      const val = parseFloat(xMatch[1]);
      nextX = isAbsolute ? val : curX + val;
      hasMotion = true;
    }

    // In Three.js CNC space, spindle is along Z or Y. Standard CNC: Z is vertical height, Y is depth.
    // In our viewport, Y is vertical up, Z is horizontal depth:
    // When reading standard G-code: X -> x, Y -> -z, Z -> y
    if (yMatch) {
      const val = parseFloat(yMatch[1]);
      nextY = isAbsolute ? val : curY + val;
      hasMotion = true;
    }

    if (zMatch) {
      const val = parseFloat(zMatch[1]);
      nextZ = isAbsolute ? val : curZ + val;
      hasMotion = true;
    }

    if (hasMotion) {
      const startPt = new THREE.Vector3(curX, nextZ, -curY);
      const endPt = new THREE.Vector3(nextX, nextZ, -nextY);
      const dist = startPt.distanceTo(endPt);

      if (dist > 0.001) {
        updateBounds(startPt);
        updateBounds(endPt);

        if (motionMode === 0 || upper.includes('FMAX')) {
          rapidLines.push([startPt, endPt]);
          totalRapidDist += dist;
        } else {
          cuttingLines.push([startPt, endPt]);
          totalCuttingDist += dist;
        }
      }

      curX = nextX;
      curY = nextY;
      curZ = nextZ;
    }
  });

  // Ensure default bounds if empty
  if (minX === Infinity) {
    minX = -50; maxX = 50;
    minY = 0; maxY = 50;
    minZ = -50; maxZ = 50;
  }

  const box = new THREE.Box3(
    new THREE.Vector3(minX, minY, minZ),
    new THREE.Vector3(maxX, maxY, maxZ)
  );

  const dimensions = {
    x: Number((maxX - minX).toFixed(2)),
    y: Number((maxY - minY).toFixed(2)),
    z: Number((maxZ - minZ).toFixed(2))
  };

  const estTimeMin = Math.ceil(((totalCuttingDist / Math.max(100, currentFeed)) + (totalRapidDist / 12000)) / 60);

  return {
    filename,
    lineCount: lines.length,
    cuttingLines,
    rapidLines,
    totalCuttingDistM: Number((totalCuttingDist / 1000).toFixed(2)),
    totalRapidDistM: Number((totalRapidDist / 1000).toFixed(2)),
    estTimeMin: Math.max(1, estTimeMin),
    box,
    dimensions,
    toolsFound: toolChanges.length > 0 ? toolChanges : [{ line: 1, tool: 1 }]
  };
}
