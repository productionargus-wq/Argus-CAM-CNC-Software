import * as THREE from 'three';
import {
  generateFacingToolpath,
  generatePocketToolpath,
  generateWaterlineToolpath,
  generateSwarfToolpath,
  generateDrillingToolpath
} from './toolpathEngine';

/**
 * Industrial G-Code Post-Processor Engine
 * Converts CAD/CAM Toolpath Trajectories into Machine-Specific NC Programs
 */

export const CONTROLLER_DIALECTS = {
  HEIDENHAIN: 'Heidenhain TNC 640 (Klartext)',
  FANUC: 'Fanuc 30i / 31i / 0i-MF',
  HAAS: 'Haas NGC (Next Gen Control)',
  SIEMENS: 'Siemens Sinumerik 840D sl',
  GRBL: 'GRBL / OpenBuilds / Shapeoko',
  MACH3: 'Mach3 / Mach4 / LinuxCNC'
};

/**
 * Generates an NC program from operations, tools, stock, and chosen controller dialect
 */
export function generateNCProgram({
  operations,
  tools,
  stockConfig,
  partMetrics,
  controller = CONTROLLER_DIALECTS.HEIDENHAIN,
  programName = 'DMU50_ZeroClamp_Job'
}) {
  const bounds = partMetrics?.box || new THREE.Box3(
    new THREE.Vector3(-40, 49, -35),
    new THREE.Vector3(40, 85, 35)
  );

  const lines = [];
  let blockNum = 10;
  const nextN = () => {
    const n = `N${blockNum}`;
    blockNum += 10;
    return n;
  };

  let totalCuttingDistanceMm = 0;
  let totalRapidDistanceMm = 0;
  let totalCuttingSeconds = 0;

  const dateStr = new Date().toISOString().slice(0, 10);

  // 1. Program Header based on Controller Dialect
  if (controller === CONTROLLER_DIALECTS.HEIDENHAIN) {
    lines.push(`0 BEGIN PGM ${programName.toUpperCase()} MM`);
    lines.push(`; --- ARGUS CAM 5-AXIS HEIDENHAIN TNC 640 POST ---`);
    lines.push(`; DATE: ${dateStr} | TIME STAMP`);
    lines.push(`; MACHINE: DMU 50 EVO 5-AXIS MILL-TURN`);
    lines.push(`; BLK FORM 0.1 Z X${bounds.min.x.toFixed(2)} Y${bounds.min.z.toFixed(2)} Z${bounds.min.y.toFixed(2)}`);
    lines.push(`; BLK FORM 0.2 X${bounds.max.x.toFixed(2)} Y${bounds.max.z.toFixed(2)} Z${(bounds.max.y + (stockConfig.allowanceTop || 2)).toFixed(2)}`);
    lines.push(`; ------------------------------------------------`);
  } else if (controller === CONTROLLER_DIALECTS.SIEMENS) {
    lines.push(`; %_N_${programName.toUpperCase()}_MPF`);
    lines.push(`; --- ARGUS CAM SIEMENS 840D sl 5-AXIS POST ---`);
    lines.push(`; DATE: ${dateStr}`);
    lines.push(`G90 G710 G64 G17 G54`);
    lines.push(`SOFT ; JERK LIMITATION`);
  } else {
    // Standard ISO (Fanuc, Haas, GRBL, Mach3)
    lines.push(`%`);
    lines.push(`O${Math.floor(1000 + Math.random() * 8000)} (${programName.toUpperCase()})`);
    lines.push(`(--- ARGUS CAM POST-PROCESSOR ---)`);
    lines.push(`(CONTROLLER: ${controller})`);
    lines.push(`(DATE: ${dateStr})`);
    lines.push(`(MATERIAL: ${stockConfig.material})`);
    lines.push(`${nextN()} G90 G21 G17 G54 G94`);
    lines.push(`${nextN()} G28 G91 Z0.`);
    lines.push(`${nextN()} G90`);
  }

  // 2. Process each enabled CAM Operation
  operations.filter((op) => op.visible).forEach((op, opIndex) => {
    const tool = tools.find((t) => t.id === op.toolId) || tools[0] || {
      number: 1,
      name: '10mm Endmill',
      diameter: 10,
      rpm: 6000,
      feedRate: 1200
    };

    // Calculate trajectory data
    let toolpathData;
    if (op.badgeClass === 'face') {
      toolpathData = generateFacingToolpath(bounds, tool, {
        stepoverPct: op.stepoverPct || 65,
        faceAllowance: stockConfig.allowanceTop || 2.0,
        depthOfCut: op.stepdown || 1.0,
        rapidHeight: op.rapidHeight || 15.0
      });
    } else if (op.badgeClass === 'pocket') {
      toolpathData = generatePocketToolpath(bounds, tool, {
        stepoverPct: op.stepoverPct || 50,
        totalDepth: op.totalDepth || 15.0,
        stepdown: op.stepdown || 5.0,
        rapidHeight: op.rapidHeight || 15.0
      });
    } else if (op.badgeClass === 'contour') {
      toolpathData = generateWaterlineToolpath(bounds, tool, {
        stepdown: op.stepdown || 3.0,
        rapidHeight: op.rapidHeight || 15.0
      });
    } else if (op.badgeClass === 'swarf') {
      toolpathData = generateSwarfToolpath(bounds, tool, {
        tiltAngleDeg: 15.0,
        passes: 2
      });
    } else if (op.badgeClass === 'drill') {
      toolpathData = generateDrillingToolpath(bounds, tool, {
        drillDepth: op.totalDepth || 25.0,
        peckDepth: op.stepdown || 5.0,
        rapidHeight: op.rapidHeight || 10.0
      });
    }

    if (!toolpathData) return;

    // Operation Section Header
    lines.push(``);
    lines.push(`; ================================================`);
    lines.push(`; OPERATION ${opIndex + 1}: ${op.name.toUpperCase()}`);
    lines.push(`; TOOL: T${tool.number} [${tool.name}] | DIA: ${tool.diameter}mm`);
    lines.push(`; ================================================`);

    // Tool Change & Spindle Start
    if (controller === CONTROLLER_DIALECTS.HEIDENHAIN) {
      lines.push(`${nextN()} TOOL CALL ${tool.number} Z S${tool.rpm} DL+0.00 DR+0.00`);
      lines.push(`${nextN()} M03 M08`);
      if (op.badgeClass === 'swarf') {
        lines.push(`${nextN()} PLANE SPATIAL SPA+15.00 SPB+0.00 SPC+0.00 TURN FMAX`);
        lines.push(`${nextN()} FUNCTION TCPM F CONT AXIS SPAT`);
      }
    } else if (controller === CONTROLLER_DIALECTS.SIEMENS) {
      lines.push(`${nextN()} T="T${tool.number}_${tool.type.toUpperCase()}" M6`);
      lines.push(`${nextN()} S${tool.rpm} M3`);
      lines.push(`${nextN()} D1 M8`);
      if (op.badgeClass === 'swarf') {
        lines.push(`${nextN()} TRAORI ; 5-AXIS TCP`);
      }
    } else {
      // Fanuc / Haas / GRBL / Mach3
      lines.push(`${nextN()} T${tool.number} M06 (${tool.name})`);
      lines.push(`${nextN()} S${tool.rpm} M03`);
      lines.push(`${nextN()} G43 H${tool.number} M08`);
    }

    let lastPos = new THREE.Vector3(0, bounds.max.y + 50, 0);

    // Initial Rapid Approach Move
    if (toolpathData.rapidLines.length > 0) {
      const firstRapid = toolpathData.rapidLines[0][0];
      if (controller === CONTROLLER_DIALECTS.HEIDENHAIN) {
        lines.push(`${nextN()} L X${firstRapid.x.toFixed(3)} Y${firstRapid.z.toFixed(3)} Z${firstRapid.y.toFixed(3)} FMAX M08`);
      } else {
        lines.push(`${nextN()} G00 X${firstRapid.x.toFixed(3)} Y${firstRapid.z.toFixed(3)} Z${firstRapid.y.toFixed(3)}`);
      }
      lastPos = firstRapid;
    }

    // Emit Cutting Passes (G01 / G02 / G03)
    toolpathData.cuttingLines.slice(0, 80).forEach(([p1, p2]) => {
      const dist = p1.distanceTo(p2);
      totalCuttingDistanceMm += dist;
      totalCuttingSeconds += (dist / (tool.feedRate || 1000)) * 60;

      // Coordinate mapping: Three.js Y is CNC Vertical Z; Three.js Z is CNC Table Y!
      const cncX = p2.x.toFixed(3);
      const cncY = p2.z.toFixed(3);
      const cncZ = p2.y.toFixed(3);

      if (controller === CONTROLLER_DIALECTS.HEIDENHAIN) {
        if (op.badgeClass === 'swarf') {
          lines.push(`${nextN()} L X${cncX} Y${cncY} Z${cncZ} B+15.000 C+45.300 F${tool.feedRate}`);
        } else {
          lines.push(`${nextN()} L X${cncX} Y${cncY} Z${cncZ} F${tool.feedRate}`);
        }
      } else if (controller === CONTROLLER_DIALECTS.SIEMENS) {
        if (op.badgeClass === 'swarf') {
          lines.push(`${nextN()} G01 X${cncX} Y${cncY} Z${cncZ} B=15.00 C=45.30 F${tool.feedRate}`);
        } else {
          lines.push(`${nextN()} G01 X${cncX} Y${cncY} Z${cncZ} F${tool.feedRate}`);
        }
      } else {
        // Fanuc / Haas / GRBL / Mach3
        if (op.badgeClass === 'swarf') {
          lines.push(`${nextN()} G01 X${cncX} Y${cncY} Z${cncZ} B15.000 C45.300 F${tool.feedRate}`);
        } else {
          lines.push(`${nextN()} G01 X${cncX} Y${cncY} Z${cncZ} F${tool.feedRate}`);
        }
      }
      lastPos = p2;
    });

    // Operation Retract
    if (controller === CONTROLLER_DIALECTS.HEIDENHAIN) {
      if (op.badgeClass === 'swarf') {
        lines.push(`${nextN()} FUNCTION RESET TCPM`);
        lines.push(`${nextN()} PLANE RESET STAY`);
      }
      lines.push(`${nextN()} L Z+${(bounds.max.y + 40).toFixed(3)} FMAX M09`);
    } else if (controller === CONTROLLER_DIALECTS.SIEMENS) {
      if (op.badgeClass === 'swarf') {
        lines.push(`${nextN()} TRAFOOF ; TCP OFF`);
      }
      lines.push(`${nextN()} G00 Z${(bounds.max.y + 40).toFixed(3)} M09`);
    } else {
      lines.push(`${nextN()} G00 Z${(bounds.max.y + 40).toFixed(3)} M09`);
    }
  });

  // 3. Program Footer & End of Program
  lines.push(``);
  lines.push(`; --- PROGRAM END ---`);
  if (controller === CONTROLLER_DIALECTS.HEIDENHAIN) {
    lines.push(`${nextN()} L Z+250.000 FMAX M05 M09`);
    lines.push(`${nextN()} L X+0.000 Y+200.000 FMAX M30`);
    lines.push(`${blockNum} END PGM ${programName.toUpperCase()} MM`);
  } else if (controller === CONTROLLER_DIALECTS.SIEMENS) {
    lines.push(`${nextN()} M05`);
    lines.push(`${nextN()} G00 SUPA Z0. D0`);
    lines.push(`${nextN()} M30`);
  } else {
    // Fanuc / Haas / GRBL
    lines.push(`${nextN()} M05`);
    lines.push(`${nextN()} G28 G91 Z0. M09`);
    lines.push(`${nextN()} G28 G91 X0. Y0.`);
    lines.push(`${nextN()} G90`);
    lines.push(`${nextN()} M30`);
    lines.push(`%`);
  }

  const estTimeMin = Math.ceil(totalCuttingSeconds / 60);

  return {
    gcodeText: lines.join('\n'),
    lineCount: lines.length,
    cuttingDistanceM: (totalCuttingDistanceMm / 1000).toFixed(2),
    estimatedTimeMin: estTimeMin > 0 ? estTimeMin : 4,
    controller,
    fileExtension: controller === CONTROLLER_DIALECTS.HEIDENHAIN ? '.h' : controller === CONTROLLER_DIALECTS.SIEMENS ? '.mpf' : '.nc'
  };
}

/**
 * Triggers file download of the generated NC code
 */
export function downloadNCFile(content, filename) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
