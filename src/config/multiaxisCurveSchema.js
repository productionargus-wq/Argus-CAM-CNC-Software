/**
 * MASTERCAM 5-AXIS CURVE MACHINING SCHEMA & CONFIGURATION
 * 
 * 10-Page Mastercam Parameter Taxonomy:
 * 1. Toolpath Type (5-Axis Curve Contouring, 3D Wireframe / Edge Drive Curve)
 * 2. Curve Selection & Surface Normals (Drive Curves, Surface Normal Alignment)
 * 3. Tool Selection & 5X Dynamics (Flat, Ball, Bullnose, Chamfer cutters)
 * 4. Holder Definition & Clearance (CAT40, BT40, HSK63)
 * 5. Cut Parameters (Climb/Conventional, Compensation Left/Right/Center, Side Offset, Axial Depths)
 * 6. Tool Axis Control (Surface Normal, Lead & Tilt, Fixed Angle, Towards/From Point/Line)
 * 7. Collision Control & Check Surfaces (Auto-tilt collision avoidance)
 * 8. Linking Parameters (Clearance Plane, Retract along Tool Axis, 3D Lead-In/Out)
 * 9. Machine Kinematics & Post Dialect (Table-Table AC/BC, Head-Table BC, Head-Head AB, TCPM G43.4)
 * 10. Planes (WCS) & Coolant Management (WCS G54, Flood & Thru-Spindle)
 */

export const MULTIAXIS_CURVE_PAGE_TITLES = {
  toolpath_type: 'Toolpath Type',
  curve_selection: 'Curve Selection & Surface Reference',
  tool: 'Tool Selection & 5X Dynamics',
  holder: 'Holder Definition & Clearance',
  cut_parameters: 'Cut Parameters & Depth Passes',
  tool_axis_control: 'Tool Axis Control (Lead & Tilt)',
  collision_control: 'Collision Control & Avoidance',
  linking_parameters: 'Linking & 3D Lead-In/Out',
  machine_kinematics: 'Machine Kinematics & TCPM Post',
  planes_coolant: 'Planes (WCS) & Coolant Management'
};

export const MULTIAXIS_CURVE_MATERIALS = {
  ALU_6061: {
    id: 'ALU_6061',
    name: 'Aluminum 6061-T6 Aerospace (95 HB)',
    vc: 350,
    fz: 0.08,
    kc: 750,
    mc: 0.25,
    recommendedPointAngle: 0
  },
  STEEL_4140: {
    id: 'STEEL_4140',
    name: 'Alloy Steel 4140 Annealed (200 HB)',
    vc: 180,
    fz: 0.05,
    kc: 1800,
    mc: 0.26,
    recommendedPointAngle: 0
  },
  STAINLESS_316L: {
    id: 'STAINLESS_316L',
    name: 'Stainless Steel 316L (180 HB)',
    vc: 130,
    fz: 0.04,
    kc: 2100,
    mc: 0.25,
    recommendedPointAngle: 0
  },
  TITANIUM_TI6AL4V: {
    id: 'TITANIUM_TI6AL4V',
    name: 'Titanium Ti-6Al-4V Grade 5 (36 HRC)',
    vc: 65,
    fz: 0.03,
    kc: 2800,
    mc: 0.23,
    recommendedPointAngle: 0
  },
  CARBON_COMPOSITE: {
    id: 'CARBON_COMPOSITE',
    name: 'Carbon Fiber CFRP / Composite',
    vc: 220,
    fz: 0.06,
    kc: 900,
    mc: 0.20,
    recommendedPointAngle: 0
  }
};

export const MULTIAXIS_CURVE_PRESETS = {
  carbon_edge_trim: {
    id: 'carbon_edge_trim',
    name: 'Aerospace Carbon Fiber Edge Trim (Normal to Surface)',
    materialKey: 'CARBON_COMPOSITE',
    toolDia: 8.0,
    leadDeg: 0.0,
    tiltDeg: 0.0,
    axisMode: 'surface_normal',
    compSide: 'left',
    stepdownMm: 5.0,
    desc: 'High speed edge trimming on 3D curved composite panels normal to outer mold line'
  },
  bevel_chamfer_3d: {
    id: 'bevel_chamfer_3d',
    name: '3D Bevel Chamfering (Fixed 45° Tilt)',
    materialKey: 'ALU_6061',
    toolDia: 10.0,
    leadDeg: 0.0,
    tiltDeg: 45.0,
    axisMode: 'lead_tilt',
    compSide: 'center',
    stepdownMm: 1.5,
    desc: 'Uniform 45-degree bevel chamfer along non-planar 3D contours'
  },
  laser_waterjet_5x: {
    id: 'laser_waterjet_5x',
    name: '5-Axis Scribing / Laser Head Trim (Lead 5°)',
    materialKey: 'STAINLESS_316L',
    toolDia: 3.0,
    leadDeg: 5.0,
    tiltDeg: 0.0,
    axisMode: 'lead_tilt',
    compSide: 'center',
    stepdownMm: 0.5,
    desc: 'Fine 5-axis profile tracing with 5° forward lead to prevent dragging'
  },
  turbine_blade_tip: {
    id: 'turbine_blade_tip',
    name: 'Turbine Blade Tip Profiling (Lead 10° / Tilt 15°)',
    materialKey: 'TITANIUM_TI6AL4V',
    toolDia: 6.0,
    leadDeg: 10.0,
    tiltDeg: 15.0,
    axisMode: 'lead_tilt',
    compSide: 'left',
    stepdownMm: 0.8,
    desc: 'Precision 5-axis sculptured tip profiling with compound orientation'
  }
};

export const MULTIAXIS_CURVE_KINEMATICS = [
  { id: 'table_table_ac', name: '5-Axis Trunnion Table-Table (A/C)', primary: 'A', secondary: 'C', maxRpm: 50 },
  { id: 'table_table_bc', name: '5-Axis Trunnion Table-Table (B/C)', primary: 'B', secondary: 'C', maxRpm: 50 },
  { id: 'head_table_bc', name: '5-Axis Head-Table Swivel (B Head / C Table)', primary: 'B', secondary: 'C', maxRpm: 60 },
  { id: 'head_head_ab', name: '5-Axis Articulated Head-Head (A/B Spindle)', primary: 'A', secondary: 'B', maxRpm: 90 }
];

export const MULTIAXIS_CURVE_POST_DIALECTS = [
  { id: 'fanuc_tcpm', name: 'Fanuc 30i / 31i / 0i-MF (G43.4 H.. Simultaneous TCPM)', tcpmCode: 'G43.4', cancelCode: 'G49' },
  { id: 'haas_tcpc', name: 'Haas Automation 5-Axis (G234 H.. Simultaneous TCPC)', tcpmCode: 'G234', cancelCode: 'G49' },
  { id: 'siemens_traori', name: 'Siemens Sinumerik 840D (TRAORI Simultaneous 5-Axis)', tcpmCode: 'TRAORI', cancelCode: 'TRAFOOF' },
  { id: 'heidenhain_tcpm', name: 'Heidenhain TNC 640 (FUNCTION TCPM F CONT AXIS SPAT)', tcpmCode: 'FUNCTION TCPM', cancelCode: 'FUNCTION RESET TCPM' }
];

/**
 * Calculates cutting physics for 5-Axis Curve Machining
 */
export function calculateMultiaxisCurvePhysics(tool = {}, cutParams = {}, materialKey = 'ALU_6061') {
  const mat = MULTIAXIS_CURVE_MATERIALS[materialKey] || MULTIAXIS_CURVE_MATERIALS.ALU_6061;
  const dia = Math.max(0.5, Number(tool.diameter || 10.0));
  const flutes = Math.max(1, Number(tool.flutes || 2));
  const rpm = Math.max(100, Number(tool.spindleSpeed || Math.round((mat.vc * 1000) / (Math.PI * dia))));
  const fz = Math.max(0.005, Number(tool.feedPerTooth || mat.fz));
  const feedRate = Math.round(rpm * fz * flutes);

  // Surface Cutting Speed Vc = (PI * D * RPM) / 1000 [m/min]
  const vc = (Math.PI * dia * rpm) / 1000;

  // Axial Depth ap & Radial Engagement ae
  const ap = Math.max(0.1, Number(cutParams.axialStepdownMm || 2.0));
  const ae = Math.max(0.05, Math.min(dia, Number(cutParams.radialOffsetMm || dia * 0.25)));

  // Material Removal Rate MRR = (ap * ae * Feed) / 1000 [cm3/min]
  const mrr = (ap * ae * feedRate) / 1000;

  // Tangential Cutting Force Fc = kc * ap * hm [N]
  const hm = fz * Math.sqrt(Math.max(0.01, ae / dia));
  const cuttingForceN = Math.round(mat.kc * ap * hm);

  // Spindle Torque Mc = (Fc * D) / (2000) [Nm]
  const torqueNm = Number(((cuttingForceN * dia) / 2000).toFixed(2));

  // Cutting Power Pc = (Mc * 2 * PI * RPM) / 60000 [kW]
  const powerKw = Number(((torqueNm * 2 * Math.PI * rpm) / 60000).toFixed(2));

  return {
    surfaceSpeedMpm: Math.round(vc),
    vcMMin: Math.round(vc),
    feedRateMmMin: feedRate,
    feedPerToothMm: Number(fz.toFixed(4)),
    mrrCm3Min: Number(mrr.toFixed(2)),
    cuttingForceN,
    spindleTorqueNm: torqueNm,
    torqueNm,
    cuttingPowerKw: powerKw,
    powerKw,
    materialName: mat.name
  };
}

/**
 * Resolves the default milling tool for 5-Axis Curve from inventory
 */
export function resolveDefaultCurveTool(tools = []) {
  if (Array.isArray(tools) && tools.length > 0) {
    const endmill = tools.find((t) => t.type === 'flat' || t.type === 'bullnose' || t.type === 'ball');
    if (endmill) return endmill;
    return tools[0];
  }
  return {
    id: 1,
    number: 1,
    name: '10.0mm 4-Flute Carbide Endmill',
    type: 'flat',
    diameter: 10.0,
    flutes: 4,
    fluteLength: 30,
    overallLength: 75,
    spindleSpeed: 11140,
    feedRate: 3565
  };
}

/**
 * Creates default 10-page parameters for 5-Axis Curve Machining
 */
export function createDefaultMultiaxisCurveParams(tools = [], activeMachine = null) {
  const tool = resolveDefaultCurveTool(tools);
  const physics = calculateMultiaxisCurvePhysics(tool, { axialStepdownMm: 2.0, radialOffsetMm: 2.5 }, 'ALU_6061');

  return {
    strategyKey: '5axis_curve',
    name: '5-Axis Curve Contouring (Wireframe & 3D Edge)',
    selectedPresetKey: 'carbon_edge_trim',
    selectedMaterialKey: 'ALU_6061',

    // Page 1: Toolpath Type
    toolpathType: {
      strategy: '5axis_curve',
      machiningPattern: 'edge_contour',
      subProgram: false
    },

    // Page 2: Curve Selection
    curveSelection: {
      driveCurveType: '3d_cad_edge',
      selectedEntities: 1,
      surfaceReference: 'underlying_cad_faces',
      contactPointMode: 'tip_tangent'
    },

    // Page 3: Tool
    tool: {
      id: tool.id || 1,
      number: tool.number || 1,
      name: tool.name || '10mm Carbide Endmill',
      type: tool.type || 'flat',
      diameter: Number(tool.diameter || 10.0),
      flutes: Number(tool.flutes || 4),
      fluteLength: Number(tool.fluteLength || 30.0),
      overallLength: Number(tool.overallLength || 75.0),
      spindleSpeed: physics.surfaceSpeedMpm ? Math.round((physics.surfaceSpeedMpm * 1000) / (Math.PI * Number(tool.diameter || 10.0))) : 11140,
      feedRate: physics.feedRateMmMin || 3565,
      feedPerTooth: 0.08
    },

    // Page 4: Holder
    holder: {
      type: 'CAT40_ER32',
      gaugeLength: 65.0,
      shankClearanceMm: 2.0,
      holderClearanceMm: 4.0
    },

    // Page 5: Cut Parameters
    cutParameters: {
      cuttingDirection: 'climb',
      cutterCompensation: 'left',
      sideOffsetMm: 0.0,
      axialStepdownMm: 2.0,
      totalDepthMm: 6.0,
      passesCount: 3,
      stockToLeaveXY: 0.0,
      stockToLeaveZ: 0.0
    },

    // Page 6: Tool Axis Control
    toolAxisControl: {
      axisMode: 'surface_normal',
      leadAngleDeg: 0.0,
      tiltAngleDeg: 0.0,
      maxTiltAngleDeg: 45.0,
      singularityHandling: 'damped_least_squares'
    },

    // Page 7: Collision Control
    collisionControl: {
      enableCheckSurfaces: true,
      checkSurfacesCount: 1,
      retractOnCollision: true,
      tiltAroundCuttingDirection: true,
      minClearanceMm: 2.0
    },

    // Page 8: Linking Parameters
    linkingParameters: {
      clearancePlaneZ: 25.0,
      retractDistanceMm: 5.0,
      leadInType: 'tangent_arc',
      leadInRadiusMm: 5.0,
      leadInAngleDeg: 90.0,
      leadOutType: 'tangent_arc',
      leadOutRadiusMm: 5.0,
      leadOutAngleDeg: 90.0
    },

    // Page 9: Machine Kinematics
    machineKinematics: {
      kinematicsId: activeMachine?.kinematicsId || 'table_table_ac',
      postDialect: 'fanuc_tcpm',
      tcpmMode: 'simultaneous',
      enableAICC2Lookahead: true
    },

    // Page 10: Planes & Coolant
    planesCoolant: {
      wcs: 'Top (G54)',
      coolantFlood: true,
      coolantThruSpindle: false,
      airBlast: false,
      operatorMessage: '5-AXIS CURVE EDGE CONTOURING'
    }
  };
}
