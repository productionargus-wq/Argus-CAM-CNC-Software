import * as THREE from 'three';
import {
  generateToolpathForOperation,
  buildEffectiveDriveModel,
  resolveOperationDriveBounds
} from './toolpathEngine.js';
import { generateProbingGCode } from './probingEngine.js';

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
  controller = CONTROLLER_DIALECTS.FANUC,
  machineName = '',
  programName = 'ARGUS_CAM_JOB',
  programNumber = '0001',
  model = null,
  customGeometry = []
}) {
  const bounds = partMetrics?.box || partMetrics?.bounds || new THREE.Box3(
    new THREE.Vector3(-40, 49, -35),
    new THREE.Vector3(40, 85, 35)
  );
  const formattedProgNum = String(programNumber ?? '0001').replace(/\D/g, '').padStart(4, '0').slice(-4) || '0001';

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
  const useHeidenhain = controller === CONTROLLER_DIALECTS.HEIDENHAIN;
  const useSiemens = controller === CONTROLLER_DIALECTS.SIEMENS;
  const useIsoParens = !useHeidenhain && !useSiemens;

  // Fanuc/Haas ISO controls reject nested parentheses inside (...) comments.
  const sanitizeIsoCommentText = (text) =>
    String(text ?? '')
      .replace(/\(([^)]*)\)/g, ' - $1')
      .replace(/[()]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const formatComment = (text) =>
    useIsoParens ? `(${sanitizeIsoCommentText(text)})` : `; ${text}`;

  const formatInlineNote = (text) =>
    useIsoParens ? `(${sanitizeIsoCommentText(text)})` : `; ${text}`;

  // 1. Program Header based on Controller Dialect
  const resolvedMachineLabel = machineName || controller;
  if (useHeidenhain) {
    lines.push(`0 BEGIN PGM ${programName.toUpperCase()} MM`);
    lines.push(`; --- ARGUS CAM HEIDENHAIN POST ---`);
    lines.push(`; DATE: ${dateStr} | TIME STAMP`);
    lines.push(`; MACHINE: ${resolvedMachineLabel}`);
    lines.push(`; BLK FORM 0.1 Z X${bounds.min.x.toFixed(2)} Y${(-bounds.max.z).toFixed(2)} Z${bounds.min.y.toFixed(2)}`);
    lines.push(`; BLK FORM 0.2 X${bounds.max.x.toFixed(2)} Y${(-bounds.min.z).toFixed(2)} Z${(bounds.max.y + (stockConfig?.allowanceTop ?? 2)).toFixed(2)}`);
    lines.push(`; ------------------------------------------------`);
  } else if (useSiemens) {
    lines.push(`; %_N_${programName.toUpperCase()}_MPF`);
    lines.push(`; --- ARGUS CAM SIEMENS 840D sl POST ---`);
    lines.push(`; MACHINE: ${resolvedMachineLabel}`);
    lines.push(`; DATE: ${dateStr}`);
    lines.push(`G90 G710 G64 G17 G54`);
    lines.push(`SOFT ; JERK LIMITATION`);
  } else {
    // Standard ISO (Fanuc, Haas, GRBL, Mach3)
    lines.push(`%`);
    lines.push(`O${formattedProgNum} (${sanitizeIsoCommentText(programName.toUpperCase())})`);
    lines.push(formatComment('--- ARGUS CAM POST-PROCESSOR ---'));
    if (machineName) lines.push(formatComment(`MACHINE: ${machineName}`));
    lines.push(formatComment(`CONTROLLER: ${controller}`));
    lines.push(formatComment(`DATE: ${dateStr}`));
    lines.push(formatComment(`MATERIAL: ${stockConfig?.material || '6061 Aluminum'}`));
    lines.push(`${nextN()} G90 G21 G17 G54 G94`);
    lines.push(`${nextN()} G28 G91 Z0.`);
    lines.push(`${nextN()} G90`);
  }

  // 2. Process each enabled CAM Operation
  operations.filter((op) => op.visible !== false).forEach((op, opIndex) => {
    // Probing cycle operations (Renishaw Inspection Plus / Haas WIPS)
    if (op.badgeClass === 'probe') {
      lines.push(``);
      const probeGCode = generateProbingGCode(op, controller, op.probingParams?.wcs || 'G54');
      const pLines = probeGCode.split('\n');
      pLines.forEach((pl) => {
        if (!pl.trim()) return;
        if (pl.startsWith(';')) {
          lines.push(useIsoParens ? formatComment(pl.slice(1).trim()) : pl);
        } else {
          lines.push(`${nextN()} ${pl}`.trim());
        }
      });
      return;
    }

    const tool = tools.find((t) => t.id === op.toolId) || tools[0] || {
      number: 1,
      name: '10mm Endmill',
      diameter: 10,
      rpm: 6000,
      feedRate: 1200
    };

    const effectiveModel = buildEffectiveDriveModel(model, customGeometry, op);
    const effectiveBounds = resolveOperationDriveBounds(effectiveModel, op, bounds);

    // Calculate trajectory data via shared dispatch helper
    const toolpathData = generateToolpathForOperation(op, effectiveBounds, tool, effectiveModel, stockConfig);

    if (!toolpathData) return;

    const effRpm = Number(op.spindleSpeed) > 0 ? Math.round(Number(op.spindleSpeed)) : (tool.rpm || 6000);
    const effFeed = Number(op.feedRate) > 0 ? Math.round(Number(op.feedRate)) : (tool.feedRate || 1000);
    const effPlunge = Number(op.plungeFeedRate) > 0 ? Math.round(Number(op.plungeFeedRate)) : (tool.plungeRate || 450);
    const coolantOff = op.coolant === 'Off';
    const coolantIsoCode = coolantOff ? '' : (op.coolant === 'Mist' || op.coolant === 'Air Blast' ? ' M07' : ' M08');
    const useControllerComp = op.compensationType === 'control' || op.compensationType === 'wear' || (!op.compensationType && op.badgeClass === 'chamfer');
    const compCode = op.cuttingDirection === 'conventional' ? 'G42' : 'G41';

    // Operation Section Header
    lines.push(``);
    lines.push(formatComment('================================================'));
    lines.push(formatComment(`OPERATION ${opIndex + 1}: ${op.name.toUpperCase()}`));
    lines.push(formatComment(`TOOL: T${tool.number} [${tool.name}] | DIA: ${tool.diameter}mm`));
    lines.push(formatComment('================================================'));

    let pendingIsoHeightOffset = false;
    let pendingIsoControlComp = false;

    // Tool Change & Spindle Start
    if (useHeidenhain) {
      lines.push(`${nextN()} TOOL CALL ${tool.number} Z S${effRpm} DL+0.00 DR+0.00`);
      lines.push(`${nextN()} M03${coolantIsoCode}`);
      if (op.badgeClass === 'swarf') {
        lines.push(`${nextN()} PLANE SPATIAL SPA+15.00 SPB+0.00 SPC+0.00 TURN FMAX`);
        lines.push(`${nextN()} FUNCTION TCPM F CONT AXIS SPAT`);
      } else if (op.badgeClass === 'adaptive' || op.feedOptimization) {
        lines.push(`${nextN()} CYCL DEF 32.0 TOLERANCE`);
        lines.push(`${nextN()} CYCL DEF 32.1 T0.02 HSC-MODE:1`);
      }
    } else if (useSiemens) {
      lines.push(`${nextN()} T="T${tool.number}_${(tool.type || 'FLAT').toUpperCase()}" M6`);
      lines.push(`${nextN()} S${effRpm} M3`);
      lines.push(`${nextN()} D1${coolantIsoCode}`);
      if (op.badgeClass === 'swarf') {
        lines.push(`${nextN()} TRAORI ; 5-AXIS TCP`);
      } else if (op.badgeClass === 'adaptive' || op.feedOptimization) {
        lines.push(`${nextN()} CYCLE832(0.02, 1, 1) ; HIGH SPEED TOLERANCE & LOOK-AHEAD`);
      }
    } else {
      // Fanuc / Haas / GRBL / Mach3
      lines.push(`${nextN()} T${tool.number} M06 (${sanitizeIsoCommentText(tool.name)})`);
      lines.push(`${nextN()} S${effRpm} M03`);
      if (op.badgeClass === 'swarf') {
        lines.push(`${nextN()} G43.4 H${tool.number}${coolantIsoCode} ${formatInlineNote('5-AXIS TCPM ACTIVATION')}`);
      } else {
        // Apply G43 H# and coolant together with initial Z clearance move after safe XY positioning
        pendingIsoHeightOffset = true;
        if (useControllerComp) {
          pendingIsoControlComp = true;
        } else if (op.badgeClass === 'contour') {
          lines.push(formatComment('CUTTER COMP: COMPUTER PRE-OFFSET'));
        }
        if (op.badgeClass === 'adaptive' || op.feedOptimization) {
          lines.push(`${nextN()} G05.1 Q1 ${formatInlineNote('HIGH SPEED AICC II LOOK-AHEAD ACCEL/DECEL')}`);
        }
      }
    }

    // Coordinate & Z-Linking helpers
    // Three.js Top (G17): +X = CNC +X, -Z = CNC +Y (cplaneGeometry vAxis), +Y = CNC +Z
    const isWcsTop = stockConfig?.wcsZZero !== 'model_origin' || !model || !!op.chain || !!op.usesCustomSurfaces || !!(op.driveFaceIds?.length) || op.badgeClass === 'flowline' || op.badgeClass === 'shallow' || op.badgeClass === 'parallel' || op.strategyKey === 'surface_finish_parallel';
    const zOffset = isWcsTop ? effectiveBounds.max.y : 0;
    const fmtNum = (n) => (Math.abs(n) < 0.0005 ? 0 : n).toFixed(3);
    const toCncY = (threeZ) => -threeZ;
    const toCncZ = (threeY) => threeY - zOffset;

    const clearanceZ = isWcsTop
      ? (Number(op.rapidHeight) || 15.0)
      : (effectiveBounds.max.y + (Number(op.rapidHeight) || 15.0) - zOffset);
    const retractRel = Number(op.retractHeight) || 5.0;
    const retractZ = isWcsTop
      ? Math.min(clearanceZ, retractRel)
      : (effectiveBounds.max.y + retractRel - zOffset);
    const topStockLocal = Number(op.topOfStock) || 0;
    const feedPlaneVal = Number(op.feedPlane) || 2.5;
    const stockTopCncZ = isWcsTop ? topStockLocal : (effectiveBounds.max.y + topStockLocal - zOffset);

    const emitRapidXY = (cncX, cncY) => {
      if (controller === CONTROLLER_DIALECTS.HEIDENHAIN) {
        lines.push(`${nextN()} L X${fmtNum(cncX)} Y${fmtNum(cncY)} FMAX`);
      } else {
        lines.push(`${nextN()} G00 X${fmtNum(cncX)} Y${fmtNum(cncY)}`);
      }
    };

    const emitRapidZ = (cncZ, extra = '') => {
      const zStr = fmtNum(cncZ);
      if (useHeidenhain) {
        lines.push(`${nextN()} L Z${cncZ >= 0 ? '+' : ''}${zStr} FMAX${extra}`);
      } else if (useIsoParens && pendingIsoHeightOffset) {
        pendingIsoHeightOffset = false;
        lines.push(`${nextN()} G00 G43 H${tool.number} Z${zStr}${coolantIsoCode}${extra}`);
      } else {
        lines.push(`${nextN()} G00 Z${zStr}${extra}`);
      }
    };

    const emitPlungeZ = (cncZ) => {
      const zStr = fmtNum(cncZ);
      if (useHeidenhain) {
        lines.push(`${nextN()} L Z${cncZ >= 0 ? '+' : ''}${zStr} F${effPlunge}`);
      } else {
        lines.push(`${nextN()} G01 Z${zStr} F${effPlunge}`);
      }
    };

    let lastPos = null;
    const emitLinkToPoint = (targetThreePt, useClearance) => {
      const targetX = targetThreePt.x;
      const targetY = toCncY(targetThreePt.z);
      const targetZ = toCncZ(targetThreePt.y);
      const lastCncZ = lastPos ? toCncZ(lastPos.y) : targetZ;
      const safeZ = useClearance
        ? clearanceZ
        : Math.max(retractZ, lastCncZ + 0.5, targetZ + 1.0);
      const feedZ = op.feedPlaneMode === 'absolute'
        ? Math.min(safeZ, Math.max(targetZ + 0.5, feedPlaneVal))
        : Math.min(safeZ, Math.max(targetZ + 0.5, stockTopCncZ + feedPlaneVal));

      if (!useClearance) {
        emitRapidZ(safeZ);
      }
      emitRapidXY(targetX, targetY);
      if (useClearance) {
        emitRapidZ(safeZ);
      }
      if (feedZ < safeZ - 0.05 && feedZ > targetZ + 0.05) {
        emitRapidZ(feedZ);
      }
      if (targetZ < (feedZ - 0.01)) {
        emitPlungeZ(targetZ);
      }
    };

    const entryStart = toolpathData.cuttingLines[0]?.[0] || toolpathData.rapidLines[0]?.[0] || null;
    if (entryStart) {
      emitLinkToPoint(entryStart, true);
      lastPos = entryStart.clone();
    }
    if (pendingIsoHeightOffset) {
      lines.push(`${nextN()} G43 H${tool.number}${coolantIsoCode}`);
      pendingIsoHeightOffset = false;
    }

    // Emit Cutting Passes (G01) - connect pass transitions via safe Retract -> XY -> Feed Plane -> Plunge
    toolpathData.cuttingLines.forEach(([p1, p2], idx) => {
      if (lastPos && lastPos.distanceTo(p1) > 0.05) {
        const xyGap = Math.hypot(p1.x - lastPos.x, p1.z - lastPos.z);
        if (xyGap > 0.05) {
          emitLinkToPoint(p1, false);
        } else {
          const p1Z = toCncZ(p1.y);
          if (p1.y < lastPos.y - 0.05) {
            emitPlungeZ(p1Z);
          } else {
            emitRapidZ(p1Z);
          }
        }
      }

      const dist = p1.distanceTo(p2);
      totalCuttingDistanceMm += dist;

      // Determine segment feed rate (optimized if feedOptimization is active)
      let segFeed = effFeed;
      if (op.feedOptimization) {
        const rctf = op.feedOptimization.rctfMultiplier || 1.35;
        const minPct = (op.feedOptimization.minCornerFeedPct || 45) / 100;
        const isCorner = idx % 6 === 0;
        segFeed = isCorner ? Math.round(effFeed * minPct) : Math.round(effFeed * rctf);
      }

      totalCuttingSeconds += (dist / segFeed) * 60;

      const cncX = fmtNum(p2.x);
      const cncY = fmtNum(toCncY(p2.z));
      const cncZ = fmtNum(toCncZ(p2.y));

      const tp = toolpathData.trajectoryPoints?.[idx];

      if (controller === CONTROLLER_DIALECTS.HEIDENHAIN) {
        if (op.badgeClass === 'swarf' && tp?.angles) {
          lines.push(`${nextN()} L X${cncX} Y${cncY} Z${cncZ} B${tp.angles.B >= 0 ? '+' : ''}${tp.angles.B.toFixed(3)} C${tp.angles.C >= 0 ? '+' : ''}${tp.angles.C.toFixed(3)} F${segFeed}`);
        } else if (op.badgeClass === 'swarf') {
          lines.push(`${nextN()} L X${cncX} Y${cncY} Z${cncZ} B+15.000 C+45.300 F${segFeed}`);
        } else {
          lines.push(`${nextN()} L X${cncX} Y${cncY} Z${cncZ} F${segFeed}`);
        }
      } else if (controller === CONTROLLER_DIALECTS.SIEMENS) {
        if (op.badgeClass === 'swarf' && tp?.angles) {
          lines.push(`${nextN()} G01 X${cncX} Y${cncY} Z${cncZ} B=${tp.angles.B.toFixed(2)} C=${tp.angles.C.toFixed(2)} F${segFeed}`);
        } else if (op.badgeClass === 'swarf') {
          lines.push(`${nextN()} G01 X${cncX} Y${cncY} Z${cncZ} B=15.00 C=45.30 F${segFeed}`);
        } else {
          lines.push(`${nextN()} G01 X${cncX} Y${cncY} Z${cncZ} F${segFeed}`);
        }
      } else {
        // Fanuc / Haas / GRBL / Mach3
        const compPrefix = pendingIsoControlComp ? `${compCode} D${tool.number} ` : '';
        pendingIsoControlComp = false;
        if (op.badgeClass === 'swarf' && tp?.angles) {
          lines.push(`${nextN()} G01 ${compPrefix}X${cncX} Y${cncY} Z${cncZ} A${tp.angles.A.toFixed(3)} C${tp.angles.C.toFixed(3)} F${segFeed}`);
        } else if (op.badgeClass === 'swarf') {
          lines.push(`${nextN()} G01 ${compPrefix}X${cncX} Y${cncY} Z${cncZ} B15.000 C45.300 F${segFeed}`);
        } else {
          lines.push(`${nextN()} G01 ${compPrefix}X${cncX} Y${cncY} Z${cncZ} F${segFeed}`);
        }
      }
      lastPos = p2;
    });

    // Operation Final Clearance Retract
    const lastEndCncZ = lastPos ? toCncZ(lastPos.y) : 0;
    const finalRetractZ = isWcsTop
      ? fmtNum(Math.max(clearanceZ, lastEndCncZ + 1.0))
      : fmtNum(Math.max(effectiveBounds.max.y + 40 - zOffset, lastEndCncZ + 1.0));
    if (useHeidenhain) {
      if (op.badgeClass === 'swarf') {
        lines.push(`${nextN()} FUNCTION RESET TCPM`);
        lines.push(`${nextN()} PLANE RESET STAY`);
      }
      lines.push(`${nextN()} L Z+${finalRetractZ} FMAX M09`);
    } else if (useSiemens) {
      if (op.badgeClass === 'swarf') {
        lines.push(`${nextN()} TRAFOOF ; TCP OFF`);
      }
      lines.push(`${nextN()} G00 Z${finalRetractZ} M09`);
    } else {
      if (op.badgeClass === 'swarf') {
        lines.push(`${nextN()} G49 ${formatInlineNote('CANCEL 5-AXIS TCPM')}`);
      } else if (useControllerComp) {
        lines.push(`${nextN()} G40 ${formatInlineNote('CANCEL CUTTER RADIUS COMPENSATION')}`);
      }
      lines.push(`${nextN()} G00 Z${finalRetractZ} M09`);
    }
  });

  // 3. Program Footer & End of Program
  lines.push(``);
  lines.push(formatComment('--- PROGRAM END ---'));
  if (useHeidenhain) {
    lines.push(`${nextN()} L Z+250.000 FMAX M05 M09`);
    lines.push(`${nextN()} L X+0.000 Y+200.000 FMAX M30`);
    lines.push(`${blockNum} END PGM ${programName.toUpperCase()} MM`);
  } else if (useSiemens) {
    lines.push(`${nextN()} M05`);
    lines.push(`${nextN()} G00 SUPA Z0. D0`);
    lines.push(`${nextN()} M30`);
  } else {
    // Fanuc / Haas / GRBL
    lines.push(`${nextN()} M05`);
    lines.push(`${nextN()} G28 G91 Z0.`);
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
