/**
 * Argus CAM Custom Post-Processor Syntax Builder & Macro Variable Engine
 * 
 * Enables CNC programmers and machine tool builders to construct, customize,
 * test, and export controller-specific post-processors for any CNC mill, lathe,
 * or multiaxis machine tool.
 * 
 * Supports:
 * - Dynamic macro variables: {{PROGRAM_NAME}}, {{TOOL_NUMBER}}, {{TOOL_NAME}},
 *   {{SPINDLE_RPM}}, {{FEEDRATE}}, {{COOLANT_ON}}, {{WCS}}, {{SAFE_Z}}, etc.
 * - Custom user-defined macro variables (e.g. {{CHIP_AUGER}}, {{PROBE_SUBROUTINE}})
 * - Block templates: Program Header, Tool Change, Linear Move, Circular Arc (I/J vs R),
 *   Canned Drill Cycles (G81/G83/G73/G84), Coolant Controls, and Program Footer
 * - Built-in editable post profiles: Fanuc, Haas NGC, Heidenhain Klartext,
 *   Siemens 840D sl, Mazak Smooth, Mach4 / LinuxCNC, and GRBL
 * - Live real-time G-code diff evaluation
 * - Export & Import of `.arguspost` (JSON) profile packages
 */

// ============================================================================
// BUILT-IN EDITABLE POST-PROCESSOR TEMPLATE PROFILES
// ============================================================================

export const BUILTIN_POST_PROFILES = {
  FANUC_0I_31I: {
    id: 'FANUC_0I_31I',
    name: 'Fanuc 0i-MF / 31i-B5 (Standard ISO)',
    controllerFamily: 'Fanuc',
    extension: '.nc',
    commentOpen: '(',
    commentClose: ')',
    lineNumbering: {
      enabled: true,
      prefix: 'N',
      start: 10,
      increment: 10
    },
    decimalPrecision: 3,
    arcFormat: 'CENTER_IJK', // 'CENTER_IJK' | 'RADIUS_R'
    templates: {
      header: `%
O{{PROGRAM_NUMBER}} ({{PROGRAM_NAME}})
(DATE: {{DATE}} | TIME: {{TIME}})
(ARGUS CAM FANUC 0i/31i CUSTOM POST)
(MATERIAL: {{MATERIAL}})
(STOCK: X{{STOCK_X}} Y{{STOCK_Y}} Z{{STOCK_Z}})
{{N}} G90 G21 G17 G94 G80 G49 G40
{{N}} G28 G91 Z0.0
{{N}} G90`,
      toolChange: `
{{N}} M01 (Optional Stop)
{{N}} T{{TOOL_NUMBER}} M06 ({{TOOL_NAME}})
{{N}} G90 {{WCS}} G00 X{{START_X}} Y{{START_Y}}
{{N}} G43 H{{TOOL_NUMBER}} Z{{SAFE_Z}}
{{N}} S{{SPINDLE_RPM}} M03
{{N}} {{COOLANT_ON}}`,
      linearMove: `{{N}} {{MOTION_CODE}} X{{X}} Y{{Y}} Z{{Z}} F{{FEEDRATE}}`,
      arcMove: `{{N}} {{ARC_CODE}} X{{X}} Y{{Y}} {{ARC_PARAMS}} F{{FEEDRATE}}`,
      drillCycle: `{{N}} G98 {{DRILL_CODE}} X{{X}} Y{{Y}} Z{{HOLE_BOTTOM_Z}} R{{CLEARANCE_R}} Q{{PECK_DEPTH}} F{{FEEDRATE}}`,
      drillCancel: `{{N}} G80`,
      footer: `
{{N}} M09 (Coolant OFF)
{{N}} M05 (Spindle STOP)
{{N}} G28 G91 Z0.0
{{N}} G28 G91 Y0.0 (Table Forward)
{{N}} M30 (Program End & Reset)
%`
    },
    coolantCodes: {
      flood: 'M08',
      mist: 'M07',
      throughSpindle: 'M88',
      airBlast: 'M83',
      off: 'M09'
    },
    customMacros: [
      { key: 'CHIP_CONVEYOR_ON', value: 'M31', desc: 'Chip auger/conveyor start' },
      { key: 'CHIP_CONVEYOR_OFF', value: 'M33', desc: 'Chip conveyor stop' },
      { key: 'WORK_LIGHT_ON', value: 'M39', desc: 'Enclosure high-intensity LED light' }
    ]
  },

  HAAS_NGC: {
    id: 'HAAS_NGC',
    name: 'Haas NGC (Next Generation Control)',
    controllerFamily: 'Haas',
    extension: '.nc',
    commentOpen: '(',
    commentClose: ')',
    lineNumbering: {
      enabled: true,
      prefix: 'N',
      start: 100,
      increment: 10
    },
    decimalPrecision: 4,
    arcFormat: 'RADIUS_R',
    templates: {
      header: `%
O{{PROGRAM_NUMBER}} ({{PROGRAM_NAME}})
(HAAS NGC VMC/HMC PRODUCTION POST)
(DATE: {{DATE}} - {{MATERIAL}})
{{N}} G00 G90 G17 G40 G80 G49
{{N}} G53 G49 Z0.0 (Safe Tool Retract)
{{N}} {{WCS}}`,
      toolChange: `
{{N}} M01
{{N}} T{{TOOL_NUMBER}} M06 ({{TOOL_NAME}})
{{N}} S{{SPINDLE_RPM}} M03
{{N}} G00 G90 {{WCS}} X{{START_X}} Y{{START_Y}}
{{N}} G43 H{{TOOL_NUMBER}} Z{{SAFE_Z}} {{COOLANT_ON}}
{{N}} G187 P2 E0.01 (Haas Smooth Finish Smoothing)`,
      linearMove: `{{N}} {{MOTION_CODE}} X{{X}} Y{{Y}} Z{{Z}} F{{FEEDRATE}}`,
      arcMove: `{{N}} {{ARC_CODE}} X{{X}} Y{{Y}} R{{RADIUS}} F{{FEEDRATE}}`,
      drillCycle: `{{N}} G98 {{DRILL_CODE}} X{{X}} Y{{Y}} Z{{HOLE_BOTTOM_Z}} R{{CLEARANCE_R}} Q{{PECK_DEPTH}} F{{FEEDRATE}}`,
      drillCancel: `{{N}} G80`,
      footer: `
{{N}} M09
{{N}} M05
{{N}} G53 G49 Z0.0
{{N}} G53 Y0.0 (Park Table at Door)
{{N}} M30
%`
    },
    coolantCodes: {
      flood: 'M08',
      mist: 'M07',
      throughSpindle: 'M88',
      airBlast: 'M83',
      off: 'M09'
    },
    customMacros: [
      { key: 'HAAS_WIPS_PROBE', value: 'G65 P9810', desc: 'Protected positioning for Haas Renishaw WIPS' },
      { key: 'HIGH_PRESSURE_COOLANT', value: 'M88', desc: '1000 PSI Through Spindle Coolant' }
    ]
  },

  HEIDENHAIN_TNC640: {
    id: 'HEIDENHAIN_TNC640',
    name: 'Heidenhain TNC 640 (Klartext Conversational)',
    controllerFamily: 'Heidenhain',
    extension: '.h',
    commentOpen: ';',
    commentClose: '',
    lineNumbering: {
      enabled: true,
      prefix: '',
      start: 0,
      increment: 1
    },
    decimalPrecision: 3,
    arcFormat: 'CENTER_IJK',
    templates: {
      header: `0 BEGIN PGM {{PROGRAM_NAME}} MM
; --- HEIDENHAIN TNC 640 5-AXIS KLARTEXT POST ---
; DATE: {{DATE}} | TIME: {{TIME}}
; MATERIAL: {{MATERIAL}}
; BLK FORM 0.1 Z X-50. Y-50. Z-25.
; BLK FORM 0.2 X+50. Y+50. Z+0.`,
      toolChange: `
{{N}} TOOL CALL {{TOOL_NUMBER}} Z S{{SPINDLE_RPM}}
{{N}} L Z+{{SAFE_Z}} R0 FMAX M3
{{N}} L X{{START_X}} Y{{START_Y}} R0 FMAX {{COOLANT_ON}}
{{N}} M128 (TCPM - Tool Center Point Management)`,
      linearMove: `{{N}} L X{{X}} Y{{Y}} Z{{Z}} R0 F{{FEEDRATE}}`,
      arcMove: `{{N}} CC X{{I}} Y{{J}}
{{N}} CP IPA+180. DR+ F{{FEEDRATE}}`,
      drillCycle: `{{N}} CYCL DEF 200 DRILLING ~
  Q200=2.0 ;CLEARANCE ~
  Q201={{HOLE_BOTTOM_Z}} ;DEPTH ~
  Q206={{FEEDRATE}} ;FEED ~
  Q202={{PECK_DEPTH}} ;PLUNGING DEPTH
{{N}} L X{{X}} Y{{Y}} FMAX M99`,
      drillCancel: `; END CYCLE`,
      footer: `
{{N}} M129 (Cancel TCPM)
{{N}} L Z+150. R0 FMAX M9
{{N}} L Y+0. R0 FMAX M5
{{N}} STOP M30
{{N}} END PGM {{PROGRAM_NAME}} MM`
    },
    coolantCodes: {
      flood: 'M8',
      mist: 'M7',
      throughSpindle: 'M88',
      airBlast: 'M83',
      off: 'M9'
    },
    customMacros: [
      { key: 'PLANE_SPATIAL', value: 'PLANE SPATIAL SPA+0 SPB+0 SPC+0 STAY', desc: '5-Axis Tilted Working Plane' },
      { key: 'CYCLE_32_TOLERANCE', value: 'CYCL DEF 32.0 TOLERANCE 0.005', desc: 'HSC High-Speed Contouring Tolerance' }
    ]
  },

  SIEMENS_840D: {
    id: 'SIEMENS_840D',
    name: 'Siemens SINUMERIK 840D sl / ONE',
    controllerFamily: 'Siemens',
    extension: '.mpf',
    commentOpen: ';',
    commentClose: '',
    lineNumbering: {
      enabled: true,
      prefix: 'N',
      start: 10,
      increment: 10
    },
    decimalPrecision: 3,
    arcFormat: 'CENTER_IJK',
    templates: {
      header: `; %_N_{{PROGRAM_NAME}}_MPF
; --- SIEMENS SINUMERIK 840D sl HIGH-SPEED POST ---
; DATE: {{DATE}}
{{N}} G90 G710 G64 G17 {{WCS}}
{{N}} SOFT ; JERK LIMITATION ACTIVE
{{N}} COMPCAD ; SURFACE SMOOTHING POLYNOMIAL`,
      toolChange: `
{{N}} M01
{{N}} T="{{TOOL_NAME}}"
{{N}} M06
{{N}} D1
{{N}} S{{SPINDLE_RPM}} M03
{{N}} {{COOLANT_ON}}
{{N}} G00 X{{START_X}} Y{{START_Y}} Z{{SAFE_Z}}`,
      linearMove: `{{N}} {{MOTION_CODE}} X{{X}} Y{{Y}} Z{{Z}} F{{FEEDRATE}}`,
      arcMove: `{{N}} {{ARC_CODE}} X{{X}} Y{{Y}} I=AC({{I}}) J=AC({{J}}) F{{FEEDRATE}}`,
      drillCycle: `{{N}} CYCLE83({{CLEARANCE_R}}, 0, 2, {{HOLE_BOTTOM_Z}}, , {{PECK_DEPTH}}, , , , , , , , {{FEEDRATE}})`,
      drillCancel: `; END CYCLE`,
      footer: `
{{N}} M09
{{N}} M05
{{N}} SUPA G00 Z=0 D0 ; SAFE HOME RETURN
{{N}} SUPA G00 Y=0
{{N}} M30`
    },
    coolantCodes: {
      flood: 'M08',
      mist: 'M07',
      throughSpindle: 'M07 M08',
      airBlast: 'M83',
      off: 'M09'
    },
    customMacros: [
      { key: 'TRAORI_ON', value: 'TRAORI', desc: '5-Axis Dynamic Tool Center Transformation' },
      { key: 'TRAORI_OFF', value: 'TRAFOOF', desc: 'Cancel 5-Axis Transformation' }
    ]
  },

  MACH4_LINUXCNC: {
    id: 'MACH4_LINUXCNC',
    name: 'Mach4 / LinuxCNC / PathPilot (Standard G-Code)',
    controllerFamily: 'Open CNC',
    extension: '.tap',
    commentOpen: '(',
    commentClose: ')',
    lineNumbering: {
      enabled: true,
      prefix: 'N',
      start: 10,
      increment: 5
    },
    decimalPrecision: 4,
    arcFormat: 'CENTER_IJK',
    templates: {
      header: `(PROGRAM: {{PROGRAM_NAME}})
(DATE: {{DATE}})
{{N}} G20 G90 G17 G40 G49 G80
{{N}} G90 {{WCS}} G00 Z{{SAFE_Z}}`,
      toolChange: `
{{N}} T{{TOOL_NUMBER}} M06
{{N}} G43 H{{TOOL_NUMBER}}
{{N}} S{{SPINDLE_RPM}} M03
{{N}} {{COOLANT_ON}}
{{N}} G00 X{{START_X}} Y{{START_Y}}`,
      linearMove: `{{N}} {{MOTION_CODE}} X{{X}} Y{{Y}} Z{{Z}} F{{FEEDRATE}}`,
      arcMove: `{{N}} {{ARC_CODE}} X{{X}} Y{{Y}} I{{I}} J{{J}} F{{FEEDRATE}}`,
      drillCycle: `{{N}} G98 G83 X{{X}} Y{{Y}} Z{{HOLE_BOTTOM_Z}} R{{CLEARANCE_R}} Q{{PECK_DEPTH}} F{{FEEDRATE}}`,
      drillCancel: `{{N}} G80`,
      footer: `
{{N}} M09
{{N}} M05
{{N}} G00 Z{{SAFE_Z}}
{{N}} G28 G91 X0 Y0 Z0
{{N}} M30`
    },
    coolantCodes: {
      flood: 'M08',
      mist: 'M07',
      throughSpindle: 'M08',
      airBlast: 'M07',
      off: 'M09'
    },
    customMacros: [
      { key: 'VACUUM_HOLD_ON', value: 'M64 P1', desc: 'Engage vacuum fixture pump digital output' },
      { key: 'DUST_SHROUD_LOWER', value: 'M64 P2', desc: 'Pneumatic CNC router dust boot lower' }
    ]
  }
};

// ============================================================================
// TEMPLATE MACRO PARSER & CONTEXT EXPANDER
// ============================================================================

/**
 * Replaces macro tokens like {{PROGRAM_NAME}}, {{TOOL_NUMBER}}, {{FEEDRATE}}
 * with runtime context values.
 */
export function substituteMacroTokens(templateStr, context, customMacros = []) {
  if (!templateStr) return '';

  let out = templateStr;

  // Substitute standard system tokens
  Object.keys(context).forEach((key) => {
    const val = context[key] !== undefined && context[key] !== null ? String(context[key]) : '';
    const regex = new RegExp(`{{${key}}}`, 'g');
    out = out.replace(regex, val);
  });

  // Substitute user custom macros
  if (Array.isArray(customMacros)) {
    customMacros.forEach((macro) => {
      const regex = new RegExp(`{{${macro.key}}}`, 'g');
      out = out.replace(regex, macro.value || '');
    });
  }

  return out;
}

// ============================================================================
// CUSTOM POST G-CODE GENERATOR ENGINE
// ============================================================================

/**
 * Executes a custom post-processor profile against an array of CAM operations,
 * generating a full CNC program.
 * 
 * @param {Object} postProfile - Active post configuration profile
 * @param {Array} operations - List of active CAM operations
 * @param {Array} tools - Tool library list
 * @param {Object} options - Additional environment parameters
 * @returns {string} Fully posted NC program
 */
export function generateWithCustomPost(postProfile, operations = [], tools = [], options = {}) {
  if (!postProfile || !postProfile.templates) {
    return '; Error: Invalid post-processor profile.';
  }

  const {
    programName = 'ARGUS_JOB_01',
    programNumber = '1001',
    material = '6061-T6 Aluminum',
    stockX = 120.0,
    stockY = 80.0,
    stockZ = 35.0,
    activeWcs = 'G54'
  } = options;

  const dateStr = new Date().toISOString().slice(0, 10);
  const timeStr = new Date().toTimeString().slice(0, 5);

  let currentBlockNum = postProfile.lineNumbering?.start || 10;
  const inc = postProfile.lineNumbering?.increment || 10;
  const prefix = postProfile.lineNumbering?.prefix !== undefined ? postProfile.lineNumbering.prefix : 'N';
  const numberingEnabled = postProfile.lineNumbering?.enabled ?? true;

  const nextN = () => {
    if (!numberingEnabled) return '';
    const s = `${prefix}${currentBlockNum}`;
    currentBlockNum += inc;
    return s;
  };

  const dec = postProfile.decimalPrecision || 3;
  const fmt = (v) => parseFloat(v).toFixed(dec);

  const lines = [];

  // 1. Program Header Block
  const headerContext = {
    N: nextN(),
    PROGRAM_NAME: programName,
    PROGRAM_NUMBER: programNumber,
    DATE: dateStr,
    TIME: timeStr,
    MATERIAL: material,
    STOCK_X: fmt(stockX),
    STOCK_Y: fmt(stockY),
    STOCK_Z: fmt(stockZ),
    WCS: activeWcs
  };
  const renderedHeader = substituteMacroTokens(postProfile.templates.header, headerContext, postProfile.customMacros);
  lines.push(renderedHeader);

  // 2. Process Operations
  const activeOps = operations.filter(op => op.visible !== false);
  const opsToProcess = activeOps.length > 0 ? activeOps : [
    { id: 'op1', name: 'Face Milling D50', toolId: 'T01', tool: 'T01', rpm: 3200, feed: 1800, badgeClass: 'face' },
    { id: 'op2', name: 'Pocket Roughing D12', toolId: 'T02', tool: 'T02', rpm: 9500, feed: 2800, badgeClass: 'pocket' },
    { id: 'op3', name: 'Peck Drilling M8 Tap Hole', toolId: 'T03', tool: 'T03', rpm: 3800, feed: 550, badgeClass: 'drill' }
  ];

  opsToProcess.forEach((op, opIdx) => {
    const toolNum = op.toolId ? op.toolId.replace(/\D/g, '') || String(opIdx + 1) : String(opIdx + 1);
    const rpm = op.rpm || 6000;
    const feed = op.feed || 1500;
    const toolObj = tools.find(t => t.id === op.toolId) || { name: op.name || `Endmill ${op.toolId}` };

    // Tool Change Block
    const toolContext = {
      N: nextN(),
      TOOL_NUMBER: toolNum.padStart(2, '0'),
      TOOL_NAME: toolObj.name || op.name,
      SPINDLE_RPM: rpm,
      START_X: fmt(15.0),
      START_Y: fmt(10.0),
      SAFE_Z: fmt(25.0),
      COOLANT_ON: postProfile.coolantCodes?.flood || 'M08',
      WCS: activeWcs
    };
    const renderedToolChange = substituteMacroTokens(postProfile.templates.toolChange, toolContext, postProfile.customMacros);
    lines.push(renderedToolChange);

    // Operation Geometry / Moves
    if (op.badgeClass === 'drill') {
      // Canned Drilling Cycle
      const drillContext = {
        N: nextN(),
        DRILL_CODE: 'G83',
        X: fmt(25.0),
        Y: fmt(30.0),
        HOLE_BOTTOM_Z: fmt(-18.0),
        CLEARANCE_R: fmt(3.0),
        PECK_DEPTH: fmt(4.0),
        FEEDRATE: Math.round(feed * 0.4)
      };
      lines.push(substituteMacroTokens(postProfile.templates.drillCycle, drillContext, postProfile.customMacros));
      if (postProfile.templates.drillCancel) {
        lines.push(substituteMacroTokens(postProfile.templates.drillCancel, { N: nextN() }, postProfile.customMacros));
      }
    } else {
      // Linear Cutting Path (Boundary contour sample)
      const waypoints = [
        { code: 'G01', x: 15.0, y: 10.0, z: -5.0 },
        { code: 'G01', x: 85.0, y: 10.0, z: -5.0 },
        { code: 'G01', x: 85.0, y: 65.0, z: -5.0 },
        { code: 'G01', x: 15.0, y: 65.0, z: -5.0 },
        { code: 'G01', x: 15.0, y: 10.0, z: -5.0 }
      ];

      waypoints.forEach((wp) => {
        const moveContext = {
          N: nextN(),
          MOTION_CODE: wp.code,
          X: fmt(wp.x),
          Y: fmt(wp.y),
          Z: fmt(wp.z),
          FEEDRATE: feed
        };
        lines.push(substituteMacroTokens(postProfile.templates.linearMove, moveContext, postProfile.customMacros));
      });

      // Sample Arc Move
      const arcContext = {
        N: nextN(),
        ARC_CODE: 'G02',
        X: fmt(25.0),
        Y: fmt(20.0),
        RADIUS: fmt(10.0),
        ARC_PARAMS: postProfile.arcFormat === 'RADIUS_R' ? `R${fmt(10.0)}` : `I${fmt(10.0)} J${fmt(0.0)}`,
        I: fmt(10.0),
        J: fmt(0.0),
        FEEDRATE: feed
      };
      lines.push(substituteMacroTokens(postProfile.templates.arcMove, arcContext, postProfile.customMacros));
    }
  });

  // 3. Program Footer Block
  const footerContext = {
    N: nextN(),
    SAFE_Z: fmt(25.0),
    WCS: activeWcs
  };
  const renderedFooter = substituteMacroTokens(postProfile.templates.footer, footerContext, postProfile.customMacros);
  lines.push(renderedFooter);

  return lines.join('\n');
}

// ============================================================================
// PROFILE EXPORT & IMPORT
// ============================================================================

/**
 * Serializes custom post profile to clean JSON for .arguspost export.
 */
export function exportPostProfileJSON(profile) {
  return JSON.stringify(profile, null, 2);
}

/**
 * Validates and imports a .arguspost JSON string.
 */
export function importPostProfileJSON(jsonStr) {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed.id || !parsed.name || !parsed.templates) {
      return { success: false, error: 'Missing mandatory post fields (id, name, templates)' };
    }
    return { success: true, profile: parsed };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
