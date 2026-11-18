import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Check, HelpCircle, Plus, ChevronRight, Save, FolderOpen,
  Calculator, Layers, Box, Cpu, Flame, Gauge, Zap, AlertCircle,
  Eye, Crosshair, Ban, MousePointer
} from 'lucide-react';
import {
  POCKET_ROUGH_MATERIALS,
  POCKET_ROUGH_PRESETS,
  resolvePocketRoughMachineCapabilities,
  calculatePocketRoughPhysics,
  createDefaultPocketRoughState
} from '../config/pocketRoughSchema.js';

const CLASSIC_YELLOW = {
  background: '#ffffd4',
  border: '1px solid #9ca3af',
  borderRadius: '1px',
  fontSize: '11px',
  color: '#0f172a',
  padding: '2px 5px',
  height: '21px',
  width: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
  outline: 'none',
  fontFamily: "'Segoe UI', Tahoma, sans-serif"
};

const DISABLED_GRAY = {
  background: '#e5e7eb',
  border: '1px solid #cbd5e1',
  borderRadius: '1px',
  fontSize: '11px',
  color: '#64748b',
  padding: '2px 5px',
  height: '21px',
  width: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
  outline: 'none',
  fontFamily: "'Segoe UI', Tahoma, sans-serif"
};

const MC_BUTTON = {
  height: '22px',
  padding: '0 8px',
  background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
  border: '1px solid #9ca3af',
  borderRadius: '2px',
  fontSize: '11px',
  color: '#0f172a',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  whiteSpace: 'nowrap',
  boxSizing: 'border-box'
};

const MC_GROUPBOX = {
  border: '1px solid #cbd5e1',
  borderRadius: '2px',
  padding: '8px 10px',
  margin: '0 0 8px 0',
  background: '#ffffff',
  boxSizing: 'border-box'
};

const MC_LEGEND = {
  padding: '0 4px',
  fontSize: '11px',
  fontWeight: 600,
  color: '#334155'
};

/**
 * Mastercam Dynamic Containment Boundary Diagram
 */
function MastercamContainmentBoundarySvg({ strategy = 'stay_inside', compensateTo = 'center' }) {
  let circleX = 135;
  let circleY = 30;
  if (compensateTo === 'inside') {
    circleX = 115;
    circleY = 55;
  } else if (compensateTo === 'outside') {
    circleX = 135;
    circleY = 12;
  }

  return (
    <svg width="200" height="110" viewBox="0 0 200 110" style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '2px' }}>
      <rect x="25" y="30" width="130" height="60" fill="none" stroke="#0066cc" strokeWidth="2.5" />
      <circle cx={circleX} cy={circleY} r="17" fill="#94a3b8" stroke="#1e293b" strokeWidth="2" />
      {strategy === 'from_outside' ? (
        <g>
          <line x1="180" y1="18" x2="158" y2="26" stroke="#ea580c" strokeWidth="2" strokeDasharray="3,2" />
          <polygon points="154,28 160,22 163,28" fill="#ea580c" />
          <text x="135" y="102" fill="#ea580c" fontSize="8.5" fontWeight="bold">From Outside</text>
        </g>
      ) : (
        <text x="45" y="65" fill="#0066cc" fontSize="8.5" fontWeight="bold">Stay Inside</text>
      )}
      <text x="28" y="23" fill="#64748b" fontSize="8">Boundary Chain</text>
      <text x="120" y="102" fill="#1e293b" fontSize="8.5" fontWeight="600">{compensateTo.toUpperCase()}</text>
    </svg>
  );
}

/**
 * Mastercam 3D Cavity Diagram
 */
function MastercamPocket3DSvg() {
  return (
    <svg width="200" height="120" viewBox="0 0 200 120" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '2px' }}>
      <polygon points="40,25 140,20 175,45 75,52" fill="#475569" stroke="#334155" strokeWidth="1.5" />
      <polygon points="75,52 175,45 175,95 75,102" fill="#334155" stroke="#1e293b" strokeWidth="1.5" />
      <polygon points="40,25 75,52 75,102 40,75" fill="#64748b" stroke="#334155" strokeWidth="1.5" />
      <polygon points="80,50 160,45 145,85 70,88" fill="#1e293b" opacity="0.9" />
      <path d="M 85 53 L 155 48 L 150 62 L 80 67 Z" fill="none" stroke="#00e5ff" strokeWidth="1.2" />
      <path d="M 83 60 L 153 55 L 148 70 L 78 75 Z" fill="none" stroke="#00e5ff" strokeWidth="1.2" />
      <path d="M 81 68 L 151 63 L 146 78 L 76 83 Z" fill="none" stroke="#00e5ff" strokeWidth="1.2" />
      <path d="M 79 76 L 149 71 L 144 85 L 74 90 Z" fill="none" stroke="#00e5ff" strokeWidth="1.2" />
      <text x="15" y="18" fill="#334155" fontSize="8.5" fontWeight="bold">3D Cavity Constant-Z Slicing</text>
    </svg>
  );
}

/**
 * Mastercam Pocket Cutting Style Diagram (Constant Overlap Spiral vs TrueSpiral vs Zigzag)
 */
function MastercamPocketCuttingStyleSvg({ style = 'constant_overlap_spiral' }) {
  if (style === 'zigzag' || style === 'one_way') {
    return (
      <svg width="200" height="110" viewBox="0 0 200 110" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '2px' }}>
        <rect x="25" y="20" width="150" height="70" fill="#ffffff" stroke="#334155" strokeWidth="1.5" />
        <line x1="35" y1="30" x2="165" y2="30" stroke="#0284c7" strokeWidth="1.5" />
        <line x1="165" y1="30" x2="165" y2="42" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="2,2" />
        <line x1="165" y1="42" x2="35" y2="42" stroke="#0284c7" strokeWidth="1.5" />
        <line x1="35" y1="42" x2="35" y2="54" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="2,2" />
        <line x1="35" y1="54" x2="165" y2="54" stroke="#0284c7" strokeWidth="1.5" />
        <line x1="165" y1="54" x2="165" y2="66" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="2,2" />
        <line x1="165" y1="66" x2="35" y2="66" stroke="#0284c7" strokeWidth="1.5" />
        <line x1="35" y1="66" x2="35" y2="78" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="2,2" />
        <line x1="35" y1="78" x2="165" y2="78" stroke="#0284c7" strokeWidth="1.5" />
        <text x="30" y="14" fill="#0284c7" fontSize="8.5" fontWeight="bold">Zigzag Bi-Directional Hatch</text>
      </svg>
    );
  }

  if (style === 'true_spiral') {
    return (
      <svg width="200" height="110" viewBox="0 0 200 110" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '2px' }}>
        <rect x="25" y="15" width="150" height="80" fill="#ffffff" stroke="#334155" strokeWidth="1.5" />
        <circle cx="100" cy="55" r="8" fill="none" stroke="#0284c7" strokeWidth="1.5" />
        <circle cx="100" cy="55" r="18" fill="none" stroke="#0284c7" strokeWidth="1.5" />
        <circle cx="100" cy="55" r="28" fill="none" stroke="#0284c7" strokeWidth="1.5" />
        <circle cx="100" cy="55" r="36" fill="none" stroke="#0284c7" strokeWidth="1.5" />
        <text x="30" y="12" fill="#0284c7" fontSize="8.5" fontWeight="bold">TrueSpiral Continuous Curvature</text>
      </svg>
    );
  }

  // Constant Overlap Spiral (Default)
  return (
    <svg width="200" height="110" viewBox="0 0 200 110" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '2px' }}>
      <rect x="25" y="15" width="150" height="80" fill="#ffffff" stroke="#334155" strokeWidth="1.5" />
      <rect x="35" y="23" width="130" height="64" fill="none" stroke="#0284c7" strokeWidth="1.5" />
      <rect x="48" y="32" width="104" height="46" fill="none" stroke="#0284c7" strokeWidth="1.5" />
      <rect x="62" y="41" width="76" height="28" fill="none" stroke="#0284c7" strokeWidth="1.5" />
      <rect x="76" y="49" width="48" height="12" fill="none" stroke="#0284c7" strokeWidth="1.5" />
      <text x="30" y="12" fill="#0284c7" fontSize="8.5" fontWeight="bold">Constant Overlap Spiral</text>
    </svg>
  );
}

/**
 * Mastercam Steep/Shallow Elevation Diagram
 */
function MastercamSteepShallowSvg() {
  return (
    <svg width="200" height="110" viewBox="0 0 200 110" style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '2px' }}>
      <path d="M 35 80 L 70 80 L 70 50 A 25 25 0 0 1 120 50 L 120 70 L 165 70 L 165 80 Z" fill="#94a3b8" stroke="#1e293b" strokeWidth="1.5" />
      <line x1="105" y1="25" x2="185" y2="25" stroke="#ef4444" strokeWidth="1.8" />
      <line x1="125" y1="70" x2="185" y2="70" stroke="#ef4444" strokeWidth="1.8" />
      <text x="125" y="21" fill="#ef4444" fontSize="8" fontWeight="bold">Minimum Depth (Top)</text>
      <text x="125" y="66" fill="#ef4444" fontSize="8" fontWeight="bold">Maximum Depth (Bottom)</text>
    </svg>
  );
}

/**
 * Mastercam Helical Ramp Diagram
 */
function HelicalRampDiagramSvg({ method = 'helical_ramp' }) {
  if (method === 'linear_ramp') {
    return (
      <svg width="200" height="100" viewBox="0 0 200 100" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '2px' }}>
        <line x1="30" y1="20" x2="170" y2="20" stroke="#94a3b8" strokeDasharray="3,3" />
        <line x1="30" y1="80" x2="170" y2="80" stroke="#94a3b8" strokeDasharray="3,3" />
        <path d="M 40 20 L 160 50 L 40 80" fill="none" stroke="#ea580c" strokeWidth="2" />
        <text x="35" y="15" fill="#64748b" fontSize="8">Part Clearance</text>
        <text x="35" y="93" fill="#64748b" fontSize="8">Cut Depth Level</text>
        <text x="110" y="42" fill="#ea580c" fontSize="8.5" fontWeight="bold">Linear Ramp</text>
      </svg>
    );
  }

  return (
    <svg width="200" height="100" viewBox="0 0 200 100" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '2px' }}>
      <line x1="30" y1="20" x2="170" y2="20" stroke="#94a3b8" strokeDasharray="3,3" />
      <line x1="30" y1="80" x2="170" y2="80" stroke="#94a3b8" strokeDasharray="3,3" />
      <path d="M 70 20 C 130 20, 130 35, 70 35 C 130 35, 130 50, 70 50 C 130 50, 130 65, 70 65 C 130 65, 130 80, 70 80" fill="none" stroke="#0284c7" strokeWidth="2" />
      <text x="35" y="15" fill="#64748b" fontSize="8">Part Clearance</text>
      <text x="35" y="93" fill="#64748b" fontSize="8">Cut Depth Level</text>
      <text x="135" y="45" fill="#0284c7" fontSize="8.5" fontWeight="bold">Helical Ramp Entry</text>
    </svg>
  );
}

export default function SurfaceRoughPocketModal({
  isOpen,
  onClose,
  onGenerateToolpath,
  onSaveOperation,
  onNotify,
  currentModel = null,
  activeMachine = null,
  stockConfig = null,
  tools = [],
  operation = null,
  onOpenToolLibrary = null
}) {
  // Mastercam Tree Navigation Pages (Hierarchy matching screenshots)
  const TREE_PAGES = useMemo(() => [
    { id: 'toolpath_type', label: 'Toolpath Type', edited: true, level: 0 },
    { id: 'model_geometry', label: 'Model Geometry', edited: true, level: 0 },
    { id: 'toolpath_control', label: 'Toolpath Control', edited: true, level: 0 },
    { id: 'tool', label: 'Tool', edited: true, level: 0 },
    { id: 'holder', label: 'Holder', edited: false, level: 0 },
    { isDivider: true, id: 'div_1' },
    { id: 'stock', label: 'Stock', edited: false, disabled: true, level: 0 },
    { id: 'cut_parameters', label: 'Cut Parameters', edited: true, level: 0 },
    { id: 'pocket_parameters', label: 'Pocket Parameters', edited: true, level: 1 },
    { id: 'transitions', label: 'Transitions', edited: false, level: 1 },
    { id: 'steep_shallow', label: 'Steep / Shallow', edited: true, level: 1 },
    { id: 'linking_parameters', label: 'Linking Parameters', edited: false, level: 0 },
    { isDivider: true, id: 'div_2' },
    { id: 'arc_filter_tolerance', label: 'Arc Filter / Tolerance', edited: false, level: 0 },
    { id: 'planes', label: 'Planes (WCS)', edited: false, level: 0 },
    { id: 'coolant', label: 'Coolant', edited: false, level: 0 },
    { id: 'canned_text', label: 'Canned Text', edited: false, level: 0 }
  ], []);

  const [activePage, setActivePage] = useState('model_geometry');
  const [formData, setFormData] = useState(() => createDefaultPocketRoughState({ activeMachine, stockConfig, currentModel, tool: tools[0] }));

  // Synchronize state when opening or when operation changes
  useEffect(() => {
    if (isOpen) {
      if (operation) {
        setFormData({
          ...createDefaultPocketRoughState({ activeMachine, stockConfig, currentModel, tool: tools[0] }),
          ...operation,
          modelGeometry: {
            ...createDefaultPocketRoughState({ activeMachine, stockConfig, currentModel, tool: tools[0] }).modelGeometry,
            ...(operation.modelGeometry || {})
          },
          toolpathControl: {
            ...createDefaultPocketRoughState({ activeMachine, stockConfig, currentModel, tool: tools[0] }).toolpathControl,
            ...(operation.toolpathControl || {})
          },
          cutParameters: {
            ...createDefaultPocketRoughState({ activeMachine, stockConfig, currentModel, tool: tools[0] }).cutParameters,
            ...(operation.cutParameters || {})
          },
          pocketParameters: {
            ...createDefaultPocketRoughState({ activeMachine, stockConfig, currentModel, tool: tools[0] }).pocketParameters,
            ...(operation.pocketParameters || {})
          },
          transitions: {
            ...createDefaultPocketRoughState({ activeMachine, stockConfig, currentModel, tool: tools[0] }).transitions,
            ...(operation.transitions || {})
          },
          steepShallow: {
            ...createDefaultPocketRoughState({ activeMachine, stockConfig, currentModel, tool: tools[0] }).steepShallow,
            ...(operation.steepShallow || {})
          },
          linkingParameters: {
            ...createDefaultPocketRoughState({ activeMachine, stockConfig, currentModel, tool: tools[0] }).linkingParameters,
            ...(operation.linkingParameters || {})
          },
          tool: {
            ...createDefaultPocketRoughState({ activeMachine, stockConfig, currentModel, tool: tools[0] }).tool,
            ...(operation.tool || {})
          }
        });
      } else {
        setFormData(createDefaultPocketRoughState({ activeMachine, stockConfig, currentModel, tool: tools[0] }));
      }
    }
  }, [isOpen, operation, activeMachine, stockConfig, currentModel, tools]);

  // Real-Time Physics Calculation
  const physics = useMemo(() => {
    return calculatePocketRoughPhysics(
      formData.tool,
      formData.cutParameters,
      formData.selectedMaterialKey || 'ALU_6061'
    );
  }, [formData.tool, formData.cutParameters, formData.selectedMaterialKey]);

  // Machine Capabilities
  const machineCaps = useMemo(() => {
    return resolvePocketRoughMachineCapabilities(activeMachine);
  }, [activeMachine]);

  // Early return after all hooks are evaluated
  if (!isOpen) return null;

  // Handle Preset Switching
  const handleApplyPreset = (presetId) => {
    const preset = POCKET_ROUGH_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const toolDiam = Number(formData.tool.diameter || 10.0);
    const newStepoverMm = Number(((toolDiam * preset.stepoverPct) / 100).toFixed(2));

    setFormData((prev) => ({
      ...prev,
      selectedPresetId: preset.id,
      selectedMaterialKey: preset.materialKey,
      cutParameters: {
        ...prev.cutParameters,
        stepoverPct: preset.stepoverPct,
        stepoverMm: newStepoverMm,
        stepdownMm: preset.stepdownMm
      },
      pocketParameters: {
        ...prev.pocketParameters,
        cuttingStyle: preset.cuttingStyle || prev.pocketParameters.cuttingStyle
      },
      transitions: {
        ...prev.transitions,
        rampAngle: preset.rampAngle
      },
      tool: {
        ...prev.tool,
        spindleSpeed: preset.spindleSpeed || prev.tool.spindleSpeed,
        feedRate: preset.feedRate || prev.tool.feedRate,
        plungeRate: preset.plungeRate || prev.tool.plungeRate
      }
    }));
  };

  // Synchronize Tool changes (Feeds/Speeds & Stepover mm)
  const handleToolParamChange = (field, value) => {
    setFormData((prev) => {
      const nextTool = { ...prev.tool, [field]: value };
      const d = Math.max(1, Number(field === 'diameter' ? value : nextTool.diameter || 10.0));
      const rpm = Math.max(100, Number(field === 'spindleSpeed' ? value : nextTool.spindleSpeed || 5000));
      const feed = Math.max(50, Number(field === 'feedRate' ? value : nextTool.feedRate || 1800));

      if (field === 'spindleSpeed' || field === 'diameter') {
        nextTool.sfm = Number(((Math.PI * d * rpm) / 1000 * 3.28084).toFixed(1));
      }
      if (field === 'feedRate' || field === 'spindleSpeed') {
        nextTool.fpt = Number((feed / (rpm * 4)).toFixed(4));
      }

      let nextCutParams = { ...prev.cutParameters };
      if (field === 'diameter') {
        const pct = nextCutParams.stepoverPct || 60.0;
        nextCutParams.stepoverMm = Number(((d * pct) / 100).toFixed(2));
      }

      return {
        ...prev,
        tool: nextTool,
        cutParameters: nextCutParams
      };
    });
  };

  // Stepover % and mm bidirectional sync
  const handleStepoverPctChange = (pct) => {
    const p = Math.max(5, Math.min(95, Number(pct) || 60));
    const d = Number(formData.tool.diameter || 10.0);
    const mm = Number(((d * p) / 100).toFixed(2));
    setFormData((prev) => ({
      ...prev,
      cutParameters: {
        ...prev.cutParameters,
        stepoverPct: p,
        stepoverMm: mm
      }
    }));
  };

  const handleStepoverMmChange = (mm) => {
    const val = Math.max(0.2, Number(mm) || 2.0);
    const d = Number(formData.tool.diameter || 10.0);
    const pct = Number(((val / d) * 100).toFixed(1));
    setFormData((prev) => ({
      ...prev,
      cutParameters: {
        ...prev.cutParameters,
        stepoverPct: pct,
        stepoverMm: val
      }
    }));
  };

  // Wall / Floor stock sync
  const handleWallStockChange = (val) => {
    const n = Number(val) || 0;
    setFormData((prev) => ({
      ...prev,
      modelGeometry: {
        ...prev.modelGeometry,
        wallStock: n,
        floorStock: prev.modelGeometry.sameWallAndFloorStock ? n : prev.modelGeometry.floorStock,
        machiningGeometry: prev.modelGeometry.machiningGeometry.map((g) => ({
          ...g,
          wallStock: n,
          floorStock: prev.modelGeometry.sameWallAndFloorStock ? n : g.floorStock
        }))
      }
    }));
  };

  const handleFloorStockChange = (val) => {
    const n = Number(val) || 0;
    setFormData((prev) => ({
      ...prev,
      modelGeometry: {
        ...prev.modelGeometry,
        floorStock: n,
        machiningGeometry: prev.modelGeometry.machiningGeometry.map((g) => ({
          ...g,
          floorStock: n
        }))
      }
    }));
  };

  // Detect Z Limits from 3D Model Bounding Box
  const handleDetectLimits = () => {
    let top = 0.0;
    let bottom = -25.0;
    if (currentModel?.box) {
      top = Number(currentModel.box.max.z.toFixed(2));
      bottom = Number(currentModel.box.min.z.toFixed(2));
    } else if (stockConfig?.height) {
      top = 0.0;
      bottom = -Number(stockConfig.height);
    }
    setFormData((prev) => ({
      ...prev,
      steepShallow: {
        ...prev.steepShallow,
        useZDepths: true,
        minimumDepth: top,
        maximumDepth: bottom
      },
      linkingParameters: {
        ...prev.linkingParameters,
        topOfStock: top,
        depth: bottom
      }
    }));
  };

  // Mastercam Recommended Values Handler
  const handleApplyRecommended = () => {
    const toolDiam = Number(formData.tool.diameter || 10.0);
    const recStepdown = 2.0;
    const recStepoverPct = 60.0;
    const recStepoverMm = Number(((toolDiam * recStepoverPct) / 100).toFixed(2));
    const recHelicalRadius = Math.max(1.5, Math.min(toolDiam * 0.45, 4.0));

    let top = 0.0;
    let bottom = -25.0;
    if (currentModel?.box) {
      top = Number(currentModel.box.max.z.toFixed(2));
      bottom = Number(currentModel.box.min.z.toFixed(2));
    } else if (stockConfig?.height) {
      top = 0.0;
      bottom = -Number(stockConfig.height);
    }

    setFormData((prev) => ({
      ...prev,
      selectedPresetId: 'alu_high_speed_pocket',
      selectedMaterialKey: 'ALU_6061',
      modelGeometry: {
        ...prev.modelGeometry,
        sameWallAndFloorStock: true,
        wallStock: 0.5,
        floorStock: 0.5
      },
      toolpathControl: {
        ...prev.toolpathControl,
        strategy: 'stay_inside',
        compensateTo: 'center'
      },
      cutParameters: {
        ...prev.cutParameters,
        cuttingMethod: 'climb',
        stepdownMm: recStepdown,
        stepoverPct: recStepoverPct,
        stepoverMm: recStepoverMm,
        cutOrder: 'by_depth',
        roughingAngle: 0.0,
        cornerRoundingRadius: 0.5
      },
      pocketParameters: {
        ...prev.pocketParameters,
        cuttingStyle: 'constant_overlap_spiral',
        spiralDirection: 'inside_out',
        islandAvoidance: true,
        cleanCorners: true,
        finishPassEnabled: true,
        finishPassWidth: 0.35,
        finishFeedRate: 1200
      },
      transitions: {
        ...prev.transitions,
        entryMethod: 'helical_ramp',
        helicalRadiusMin: 2.5,
        helicalRadiusMax: recHelicalRadius,
        rampPitch: 2.0,
        rampAngle: 3.0,
        plungeClearance: 2.0,
        entryFeedRate: 450
      },
      steepShallow: {
        ...prev.steepShallow,
        useZDepths: true,
        minimumDepth: top,
        maximumDepth: bottom
      },
      linkingParameters: {
        ...prev.linkingParameters,
        clearancePlane: 25.0,
        clearanceType: 'absolute',
        retractPlane: 5.0,
        retractType: 'incremental',
        feedPlane: 2.5,
        topOfStock: top,
        depth: bottom
      },
      tool: {
        ...prev.tool,
        spindleSpeed: 5000,
        feedRate: 1800,
        plungeRate: 450,
        retractRate: 2500,
        rapidRetract: true
      }
    }));

    onNotify?.('Loaded Mastercam Recommended Surface Rough Pocket Values (2.0mm Stepdown, 60% Stepover, Constant Overlap Spiral, 0.5mm Stock)', 'success');
  };

  const handleApply = (closeAfter = true) => {
    if (onSaveOperation) {
      onSaveOperation(formData);
    } else if (onGenerateToolpath) {
      onGenerateToolpath(formData);
    }
    if (closeAfter) {
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: "'Segoe UI', Tahoma, sans-serif"
      }}
    >
      <div
        style={{
          width: '920px',
          maxWidth: '96vw',
          height: '670px',
          maxHeight: '92vh',
          backgroundColor: '#f1f5f9',
          border: '1px solid #64748b',
          borderRadius: '4px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.45)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Mastercam Classic Window Title Bar */}
        <div
          style={{
            height: '28px',
            background: 'linear-gradient(180deg, #ffffff 0%, #e2e8f0 100%)',
            borderBottom: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 8px',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={15} style={{ color: '#0284c7' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>
              Surface Rough Toolpaths - Pocket
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: '2px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Mastercam Action Icon Bar */}
        <div
          style={{
            height: '28px',
            background: '#ffffff',
            borderBottom: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            padding: '0 8px',
            gap: '6px'
          }}
        >
          <button style={MC_BUTTON} title="3D Model Geometry">
            <Box size={13} style={{ color: '#0284c7' }} />
          </button>
          <button style={MC_BUTTON} title="Levels / Layers">
            <Layers size={13} style={{ color: '#475569' }} />
          </button>
          <button style={MC_BUTTON} title="Save Operation Defaults">
            <Save size={13} style={{ color: '#059669' }} />
          </button>
          <button style={MC_BUTTON} title="Machining Calculator">
            <Calculator size={13} style={{ color: '#d97706' }} />
          </button>
          <button style={MC_BUTTON} title="Help Topics">
            <HelpCircle size={13} style={{ color: '#475569' }} />
          </button>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleApplyRecommended}
              style={{
                ...MC_BUTTON,
                height: '22px',
                fontSize: '11px',
                fontWeight: 700,
                background: 'linear-gradient(180deg, #ecfdf5 0%, #d1fae5 100%)',
                borderColor: '#10b981',
                color: '#047857',
                marginRight: '6px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                cursor: 'pointer'
              }}
              title="One-Click Mastercam Recommended Values (2.0mm Stepdown, 60% Stepover, Constant Overlap Spiral, 0.5mm Stock)"
            >
              ⭐ Recommended Values
            </button>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Roughing Preset:</span>
            <select
              value={formData.selectedPresetId || 'alu_high_speed_pocket'}
              onChange={(e) => handleApplyPreset(e.target.value)}
              style={{ ...CLASSIC_YELLOW, width: '220px', height: '22px' }}
            >
              {POCKET_ROUGH_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Physics HUD Banner */}
        <div
          style={{
            background: 'linear-gradient(90deg, #f0fdf4 0%, #e0f2fe 100%)',
            borderBottom: '1px solid #cbd5e1',
            padding: '4px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#0f172a'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Flame size={13} style={{ color: '#dc2626' }} />
              <strong>MRR:</strong> {physics.mrrCm3Min} cm³/min
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Zap size={13} style={{ color: '#ea580c' }} />
              <strong>Force:</strong> {physics.fc} N
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Gauge size={13} style={{ color: '#0284c7' }} />
              <strong>Power:</strong> {physics.powerKw} kW
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Cpu size={13} style={{ color: '#059669' }} />
              <strong>Torque:</strong> {physics.torqueNm} Nm
            </span>
            <span>
              <strong>Chip Load (hm):</strong> {physics.hm} mm
            </span>
          </div>
          <div style={{ fontSize: '10.5px', color: '#475569', fontWeight: 500 }}>
            Machine: {machineCaps.machineName} | Dialect: {machineCaps.highSpeedSmoothingCode}
          </div>
        </div>

        {/* Main Body: Tree Navigation & Active Page */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Left Navigation Tree & Quick View Settings */}
          <div
            style={{
              width: '235px',
              minWidth: '235px',
              borderRight: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0
            }}
          >
            {/* Tree Navigation List */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '4px 0',
                borderBottom: '1px solid #cbd5e1'
              }}
            >
              {TREE_PAGES.map((page) => {
                if (page.isDivider) {
                  return (
                    <div
                      key={page.id}
                      style={{ height: '1px', background: '#e2e8f0', margin: '4px 8px' }}
                    />
                  );
                }

                const isActive = activePage === page.id;
                const isChild = page.level === 1;

                return (
                  <div
                    key={page.id}
                    onClick={() => !page.disabled && setActivePage(page.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: `3px 8px 3px ${isChild ? '24px' : '10px'}`,
                      backgroundColor: isActive ? '#0284c7' : 'transparent',
                      color: isActive ? '#ffffff' : page.disabled ? '#94a3b8' : '#0f172a',
                      cursor: page.disabled ? 'not-allowed' : 'pointer',
                      fontSize: '11px',
                      userSelect: 'none',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <span style={{ width: '16px', display: 'inline-flex', alignItems: 'center' }}>
                      {page.disabled ? (
                        <Ban size={10} style={{ color: isActive ? '#ffffff' : '#ef4444' }} />
                      ) : page.edited ? (
                        <Check size={11} style={{ color: isActive ? '#ffffff' : '#16a34a' }} />
                      ) : null}
                    </span>
                    <span style={{ fontWeight: isActive ? 600 : 400 }}>{page.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Quick View Settings Panel */}
            <div
              style={{
                height: '210px',
                padding: '6px 8px',
                backgroundColor: '#f8fafc',
                fontSize: '10.5px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ fontWeight: 600, color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '2px' }}>
                Quick View Settings
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '85px 1fr', rowGap: '2px', color: '#1e293b' }}>
                <span style={{ color: '#64748b' }}>Tool:</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {formData.tool.name}
                </span>

                <span style={{ color: '#64748b' }}>Tool Diameter:</span>
                <span>{formData.tool.diameter} mm</span>

                <span style={{ color: '#64748b' }}>Corner Radius:</span>
                <span>{formData.tool.cornerRadius} mm</span>

                <span style={{ color: '#64748b' }}>Feed Rate:</span>
                <span>{formData.tool.feedRate} mm/min</span>

                <span style={{ color: '#64748b' }}>Spindle Speed:</span>
                <span>{formData.tool.spindleSpeed} RPM</span>

                <span style={{ color: '#64748b' }}>Coolant:</span>
                <span style={{ textTransform: 'capitalize' }}>{formData.coolant.mode}</span>

                <span style={{ color: '#64748b' }}>Length Offset:</span>
                <span>{formData.tool.lengthOffset}</span>

                <span style={{ color: '#64748b' }}>Diameter Off.:</span>
                <span>{formData.tool.diameterOffset}</span>

                <span style={{ color: '#64748b' }}>Cplane / Tpl.:</span>
                <span>{formData.planes.toolPlane}</span>
              </div>

              <div style={{ fontSize: '9.5px', color: '#64748b', display: 'flex', gap: '8px', paddingTop: '4px', borderTop: '1px solid #e2e8f0' }}>
                <span>✓ = edited</span>
                <span>⊘ = disabled</span>
              </div>
            </div>
          </div>

          {/* Right Content Area: Active Tree Page */}
          <div
            style={{
              flex: 1,
              backgroundColor: '#ffffff',
              padding: '12px 16px',
              overflowY: 'auto',
              minHeight: 0
            }}
          >
            {/* 1. TOOLPATH TYPE PAGE */}
            {activePage === 'toolpath_type' && (
              <div>
                <fieldset style={MC_GROUPBOX}>
                  <legend style={MC_LEGEND}>3D Surface Roughing Strategy</legend>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <MastercamPocket3DSvg />
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#0f172a' }}>
                        Surface Rough Pocket (3D Rough Pocketing)
                      </h4>
                      <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#475569', lineHeight: 1.5 }}>
                        Traditional 3D rough pocketing using constant-Z planar horizontal slicing from Z top to Z bottom.
                        Clears interior cavities and core boss perimeters with selectable spiral, morph, and zigzag cutting patterns.
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '4px', fontSize: '11px' }}>
                        <span style={{ color: '#64748b' }}>Strategy Type:</span>
                        <span style={{ fontWeight: 600 }}>Surface Rough Pocket (3D Mill)</span>
                        <span style={{ color: '#64748b' }}>Planar Slicing:</span>
                        <span>Constant-Z Horizontal Equidistant Slices</span>
                        <span style={{ color: '#64748b' }}>Helical Ramping:</span>
                        <span>Automatic Center Cavity Plunge Ramps</span>
                      </div>
                    </div>
                  </div>
                </fieldset>
              </div>
            )}

            {/* 2. MODEL GEOMETRY PAGE */}
            {activePage === 'model_geometry' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  {/* Machining Geometry Table */}
                  <fieldset style={MC_GROUPBOX}>
                    <legend style={MC_LEGEND}>Machining Geometry (Drive Surfaces)</legend>
                    <div style={{ border: '1px solid #cbd5e1', height: '180px', overflowY: 'auto', background: '#f8fafc' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead>
                          <tr style={{ background: '#e2e8f0', color: '#334155', textAlign: 'left' }}>
                            <th style={{ padding: '3px 6px' }}>Name</th>
                            <th style={{ padding: '3px 6px' }}>Entities</th>
                            <th style={{ padding: '3px 6px' }}>Wall Stock</th>
                            <th style={{ padding: '3px 6px' }}>Floor Stock</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ background: '#e0f2fe', color: '#0369a1' }}>
                            <td style={{ padding: '3px 6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ width: '8px', height: '8px', background: '#22c55e', display: 'inline-block' }} />
                              machining
                            </td>
                            <td style={{ padding: '3px 6px' }}>65</td>
                            <td style={{ padding: '3px 6px' }}>{formData.modelGeometry.wallStock}</td>
                            <td style={{ padding: '3px 6px' }}>{formData.modelGeometry.floorStock}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                      <button style={MC_BUTTON} onClick={() => alert('Selecting drive surfaces...')}>
                        <Plus size={11} style={{ marginRight: '4px' }} /> Add
                      </button>
                      <button style={MC_BUTTON} onClick={() => alert('Cleared drive geometry.')}>
                        Remove
                      </button>
                    </div>
                  </fieldset>

                  {/* Avoidance Geometry Table */}
                  <fieldset style={MC_GROUPBOX}>
                    <legend style={MC_LEGEND}>Avoidance Geometry (Check Surfaces)</legend>
                    <div style={{ border: '1px solid #cbd5e1', height: '180px', overflowY: 'auto', background: '#f8fafc' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead>
                          <tr style={{ background: '#e2e8f0', color: '#334155', textAlign: 'left' }}>
                            <th style={{ padding: '3px 6px' }}>Name</th>
                            <th style={{ padding: '3px 6px' }}>Entities</th>
                            <th style={{ padding: '3px 6px' }}>Wall Stock</th>
                            <th style={{ padding: '3px 6px' }}>Floor Stock</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ color: '#64748b' }}>
                            <td style={{ padding: '3px 6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ width: '8px', height: '8px', background: '#ef4444', display: 'inline-block' }} />
                              avoidance
                            </td>
                            <td style={{ padding: '3px 6px' }}>0</td>
                            <td style={{ padding: '3px 6px' }}>0.0</td>
                            <td style={{ padding: '3px 6px' }}>0.0</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                      <button style={MC_BUTTON} onClick={() => alert('Selecting avoidance surfaces...')}>
                        <Plus size={11} style={{ marginRight: '4px' }} /> Add
                      </button>
                      <button style={MC_BUTTON} onClick={() => alert('Cleared avoidance geometry.')}>
                        Remove
                      </button>
                    </div>
                  </fieldset>
                </div>

                {/* Stock Allowance Controls */}
                <fieldset style={MC_GROUPBOX}>
                  <legend style={MC_LEGEND}>Stock to Leave on Drive Surfaces</legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <input
                          type="checkbox"
                          id="sameStock"
                          checked={formData.modelGeometry.sameWallAndFloorStock}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setFormData((prev) => ({
                              ...prev,
                              modelGeometry: {
                                ...prev.modelGeometry,
                                sameWallAndFloorStock: checked,
                                floorStock: checked ? prev.modelGeometry.wallStock : prev.modelGeometry.floorStock
                              }
                            }));
                          }}
                        />
                        <label htmlFor="sameStock" style={{ fontSize: '11px', color: '#1e293b' }}>
                          Same wall and floor stock
                        </label>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '90px 100px 30px', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', color: '#475569' }}>Wall stock:</span>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.modelGeometry.wallStock}
                          onChange={(e) => handleWallStockChange(e.target.value)}
                          style={CLASSIC_YELLOW}
                        />
                        <span style={{ fontSize: '11px', color: '#64748b' }}>mm</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '90px 100px 30px', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', color: '#475569' }}>Floor stock:</span>
                        <input
                          type="number"
                          step="0.1"
                          disabled={formData.modelGeometry.sameWallAndFloorStock}
                          value={formData.modelGeometry.floorStock}
                          onChange={(e) => handleFloorStockChange(e.target.value)}
                          style={formData.modelGeometry.sameWallAndFloorStock ? DISABLED_GRAY : CLASSIC_YELLOW}
                        />
                        <span style={{ fontSize: '11px', color: '#64748b' }}>mm</span>
                      </div>
                    </div>

                    <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.5, background: '#f8fafc', padding: '8px', borderRadius: '2px', border: '1px solid #e2e8f0' }}>
                      <strong>Stock Allowance Guidance:</strong>
                      <br />• Recommended roughing wall stock: <strong>0.30 - 0.75 mm</strong>
                      <br />• Recommended floor stock: <strong>0.20 - 0.50 mm</strong>
                      <br />• Prevents gouging into finished walls during subsequent semi-finish and finish passes.
                    </div>
                  </div>
                </fieldset>
              </div>
            )}

            {/* 3. TOOLPATH CONTROL PAGE */}
            {activePage === 'toolpath_control' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
                  <div>
                    <fieldset style={MC_GROUPBOX}>
                      <legend style={MC_LEGEND}>Containment Boundary</legend>
                      <div style={{ display: 'grid', gridTemplateColumns: '120px 60px 1fr', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#475569' }}>Boundary chains:</span>
                        <input
                          type="number"
                          readOnly
                          value={formData.toolpathControl.boundaryChainsCount}
                          style={DISABLED_GRAY}
                        />
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button style={MC_BUTTON} onClick={() => alert('Selecting boundary chain...')}>
                            Select Chain
                          </button>
                        </div>
                      </div>

                      <div style={{ marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                          Strategy:
                        </span>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '11px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="radio"
                              name="strategy"
                              checked={formData.toolpathControl.strategy === 'from_outside'}
                              onChange={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  toolpathControl: { ...prev.toolpathControl, strategy: 'from_outside' }
                                }))
                              }
                            />
                            From outside (Core / Boss)
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="radio"
                              name="strategy"
                              checked={formData.toolpathControl.strategy === 'stay_inside'}
                              onChange={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  toolpathControl: { ...prev.toolpathControl, strategy: 'stay_inside' }
                                }))
                              }
                            />
                            Stay inside (Pocket / Cavity)
                          </label>
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                          Compensate to:
                        </span>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '11px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="radio"
                              name="compensate"
                              checked={formData.toolpathControl.compensateTo === 'inside'}
                              onChange={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  toolpathControl: { ...prev.toolpathControl, compensateTo: 'inside' }
                                }))
                              }
                            />
                            Inside
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="radio"
                              name="compensate"
                              checked={formData.toolpathControl.compensateTo === 'center'}
                              onChange={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  toolpathControl: { ...prev.toolpathControl, compensateTo: 'center' }
                                }))
                              }
                            />
                            Center
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="radio"
                              name="compensate"
                              checked={formData.toolpathControl.compensateTo === 'outside'}
                              onChange={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  toolpathControl: { ...prev.toolpathControl, compensateTo: 'outside' }
                                }))
                              }
                            />
                            Outside
                          </label>
                        </div>
                      </div>
                    </fieldset>
                  </div>

                  <div>
                    <MastercamContainmentBoundarySvg
                      strategy={formData.toolpathControl.strategy}
                      compensateTo={formData.toolpathControl.compensateTo}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 4. TOOL PAGE */}
            {activePage === 'tool' && (
              <div>
                <fieldset style={MC_GROUPBOX}>
                  <legend style={MC_LEGEND}>Tool Definition & Coupled Feeds / Speeds</legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', color: '#475569' }}>Tool name:</span>
                        <input
                          type="text"
                          value={formData.tool.name}
                          onChange={(e) => handleToolParamChange('name', e.target.value)}
                          style={CLASSIC_YELLOW}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '110px 100px 30px', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', color: '#475569' }}>Tool diameter:</span>
                        <input
                          type="number"
                          step="0.5"
                          value={formData.tool.diameter}
                          onChange={(e) => handleToolParamChange('diameter', e.target.value)}
                          style={CLASSIC_YELLOW}
                        />
                        <span style={{ fontSize: '11px', color: '#64748b' }}>mm</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '110px 100px 30px', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', color: '#475569' }}>Corner radius:</span>
                        <input
                          type="number"
                          step="0.25"
                          value={formData.tool.cornerRadius}
                          onChange={(e) => handleToolParamChange('cornerRadius', e.target.value)}
                          style={CLASSIC_YELLOW}
                        />
                        <span style={{ fontSize: '11px', color: '#64748b' }}>mm</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '110px 100px', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', color: '#475569' }}>Tool number:</span>
                        <input
                          type="number"
                          value={formData.tool.number}
                          onChange={(e) => handleToolParamChange('number', Number(e.target.value))}
                          style={CLASSIC_YELLOW}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '110px 100px', gap: '6px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#475569' }}>Length offset:</span>
                        <input
                          type="number"
                          value={formData.tool.lengthOffset}
                          onChange={(e) => handleToolParamChange('lengthOffset', Number(e.target.value))}
                          style={CLASSIC_YELLOW}
                        />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: '110px 100px 45px', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', color: '#475569' }}>Spindle speed:</span>
                        <input
                          type="number"
                          value={formData.tool.spindleSpeed}
                          onChange={(e) => handleToolParamChange('spindleSpeed', Number(e.target.value))}
                          style={CLASSIC_YELLOW}
                        />
                        <span style={{ fontSize: '11px', color: '#64748b' }}>RPM</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '110px 100px 45px', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', color: '#475569' }}>Feed rate:</span>
                        <input
                          type="number"
                          value={formData.tool.feedRate}
                          onChange={(e) => handleToolParamChange('feedRate', Number(e.target.value))}
                          style={CLASSIC_YELLOW}
                        />
                        <span style={{ fontSize: '11px', color: '#64748b' }}>mm/min</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '110px 100px 45px', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', color: '#475569' }}>Plunge rate:</span>
                        <input
                          type="number"
                          value={formData.tool.plungeRate}
                          onChange={(e) => handleToolParamChange('plungeRate', Number(e.target.value))}
                          style={CLASSIC_YELLOW}
                        />
                        <span style={{ fontSize: '11px', color: '#64748b' }}>mm/min</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '110px 100px 45px', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', color: '#475569' }}>Retract rate:</span>
                        <input
                          type="number"
                          value={formData.tool.retractRate}
                          onChange={(e) => handleToolParamChange('retractRate', Number(e.target.value))}
                          style={CLASSIC_YELLOW}
                        />
                        <span style={{ fontSize: '11px', color: '#64748b' }}>mm/min</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                        <input
                          type="checkbox"
                          id="rapidRetract"
                          checked={formData.tool.rapidRetract}
                          onChange={(e) => handleToolParamChange('rapidRetract', e.target.checked)}
                        />
                        <label htmlFor="rapidRetract" style={{ fontSize: '11px', color: '#1e293b' }}>
                          Rapid Retract (G00)
                        </label>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button
                      style={MC_BUTTON}
                      onClick={() => onOpenToolLibrary && onOpenToolLibrary()}
                    >
                      Select library tool...
                    </button>
                    <button style={MC_BUTTON} onClick={() => alert('Filter active.')}>
                      Filter Active
                    </button>
                  </div>
                </fieldset>
              </div>
            )}

            {/* 5. HOLDER PAGE */}
            {activePage === 'holder' && (
              <div>
                <fieldset style={MC_GROUPBOX}>
                  <legend style={MC_LEGEND}>Tool Holder Definition</legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '6px', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#475569' }}>Holder type:</span>
                        <select
                          value={formData.holder.type}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              holder: { ...prev.holder, type: e.target.value }
                            }))
                          }
                          style={CLASSIC_YELLOW}
                        >
                          <option value="BT30">BT30 / BBT30 Milling Chuck</option>
                          <option value="CAT40">CAT40 Precision Endmill Holder</option>
                          <option value="HSK63">HSK-A63 High Speed Chuck</option>
                          <option value="ER32">ER32 Collet Chuck</option>
                        </select>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '110px 100px 30px', gap: '6px', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#475569' }}>Projection (L):</span>
                        <input
                          type="number"
                          value={formData.holder.projection}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              holder: { ...prev.holder, projection: Number(e.target.value) }
                            }))
                          }
                          style={CLASSIC_YELLOW}
                        />
                        <span style={{ fontSize: '11px', color: '#64748b' }}>mm</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          id="holderCollision"
                          checked={formData.holder.collisionCheck}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              holder: { ...prev.holder, collisionCheck: e.target.checked }
                            }))
                          }
                        />
                        <label htmlFor="holderCollision" style={{ fontSize: '11px', color: '#1e293b' }}>
                          Enable holder collision gouge check
                        </label>
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '2px', fontSize: '11px', color: '#475569' }}>
                      <strong>Active Tool Holder:</strong>
                      <br />• Description: {formData.holder.name}
                      <br />• Gauge Projection: {formData.holder.projection} mm
                      <br />• Verification: 3D backplot & collision detection active against drive geometry.
                    </div>
                  </div>
                </fieldset>
              </div>
            )}

            {/* 7. CUT PARAMETERS PAGE */}
            {activePage === 'cut_parameters' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
                  <div>
                    <fieldset style={MC_GROUPBOX}>
                      <legend style={MC_LEGEND}>Cutting Passes & Stepdown</legend>
                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '6px', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#475569' }}>Cut method:</span>
                        <select
                          value={formData.cutParameters.cuttingMethod}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              cutParameters: { ...prev.cutParameters, cuttingMethod: e.target.value }
                            }))
                          }
                          style={CLASSIC_YELLOW}
                        >
                          <option value="climb">Climb (Down Milling)</option>
                          <option value="conventional">Conventional (Up Milling)</option>
                          <option value="bidirectional">Bi-directional</option>
                        </select>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '120px 100px 30px', gap: '6px', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#475569' }}>Stepdown (Max):</span>
                        <input
                          type="number"
                          step="0.25"
                          value={formData.cutParameters.stepdownMm}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              cutParameters: { ...prev.cutParameters, stepdownMm: Number(e.target.value) }
                            }))
                          }
                          style={CLASSIC_YELLOW}
                        />
                        <span style={{ fontSize: '11px', color: '#64748b' }}>mm</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '120px 80px 25px 80px 30px', gap: '6px', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#475569' }}>Stepover:</span>
                        <input
                          type="number"
                          value={formData.cutParameters.stepoverPct}
                          onChange={(e) => handleStepoverPctChange(e.target.value)}
                          style={CLASSIC_YELLOW}
                        />
                        <span style={{ fontSize: '11px', color: '#64748b' }}>%</span>
                        <input
                          type="number"
                          step="0.5"
                          value={formData.cutParameters.stepoverMm}
                          onChange={(e) => handleStepoverMmChange(e.target.value)}
                          style={CLASSIC_YELLOW}
                        />
                        <span style={{ fontSize: '11px', color: '#64748b' }}>mm</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '6px', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#475569' }}>Cut order:</span>
                        <select
                          value={formData.cutParameters.cutOrder}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              cutParameters: { ...prev.cutParameters, cutOrder: e.target.value }
                            }))
                          }
                          style={CLASSIC_YELLOW}
                        >
                          <option value="by_depth">By Depth (All pockets per level)</option>
                          <option value="by_pocket">By Pocket (Finish depth completely)</option>
                        </select>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '120px 100px 30px', gap: '6px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#475569' }}>Roughing angle:</span>
                        <input
                          type="number"
                          value={formData.cutParameters.roughingAngle}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              cutParameters: { ...prev.cutParameters, roughingAngle: Number(e.target.value) }
                            }))
                          }
                          style={CLASSIC_YELLOW}
                        />
                        <span style={{ fontSize: '11px', color: '#64748b' }}>deg</span>
                      </div>
                    </fieldset>
                  </div>

                  <div>
                    <MastercamPocket3DSvg />
                  </div>
                </div>
              </div>
            )}

            {/* 8. POCKET PARAMETERS PAGE */}
            {activePage === 'pocket_parameters' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
                  <div>
                    <fieldset style={MC_GROUPBOX}>
                      <legend style={MC_LEGEND}>Pocket Roughing Strategy & Patterns</legend>
                      <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '6px', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#475569' }}>Cutting style:</span>
                        <select
                          value={formData.pocketParameters.cuttingStyle}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              pocketParameters: { ...prev.pocketParameters, cuttingStyle: e.target.value }
                            }))
                          }
                          style={CLASSIC_YELLOW}
                        >
                          <option value="constant_overlap_spiral">Constant Overlap Spiral (Mastercam)</option>
                          <option value="parallel_spiral">Parallel Spiral</option>
                          <option value="morph_spiral">Morph Spiral</option>
                          <option value="true_spiral">TrueSpiral (Archimedean Smooth)</option>
                          <option value="zigzag">Zigzag (Bi-Directional Raster)</option>
                          <option value="one_way">One Way (Unidirectional Raster)</option>
                        </select>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '6px', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#475569' }}>Spiral direction:</span>
                        <select
                          value={formData.pocketParameters.spiralDirection}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              pocketParameters: { ...prev.pocketParameters, spiralDirection: e.target.value }
                            }))
                          }
                          style={CLASSIC_YELLOW}
                        >
                          <option value="inside_out">Inside Out (Center to Wall)</option>
                          <option value="outside_in">Outside In (Perimeter to Center)</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <input
                          type="checkbox"
                          id="islandAvoidance"
                          checked={formData.pocketParameters.islandAvoidance}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              pocketParameters: { ...prev.pocketParameters, islandAvoidance: e.target.checked }
                            }))
                          }
                        />
                        <label htmlFor="islandAvoidance" style={{ fontSize: '11px', color: '#1e293b' }}>
                          Automatic Island / Core Boss Avoidance
                        </label>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <input
                          type="checkbox"
                          id="cleanCorners"
                          checked={formData.pocketParameters.cleanCorners}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              pocketParameters: { ...prev.pocketParameters, cleanCorners: e.target.checked }
                            }))
                          }
                        />
                        <label htmlFor="cleanCorners" style={{ fontSize: '11px', color: '#1e293b' }}>
                          Corner Rounding / Clean Sharp Corners
                        </label>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <input
                          type="checkbox"
                          id="finishPassEnabled"
                          checked={formData.pocketParameters.finishPassEnabled}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              pocketParameters: { ...prev.pocketParameters, finishPassEnabled: e.target.checked }
                            }))
                          }
                        />
                        <label htmlFor="finishPassEnabled" style={{ fontSize: '11px', color: '#1e293b' }}>
                          Perimeter Wall Finish Pass at Each Level
                        </label>
                      </div>

                      {formData.pocketParameters.finishPassEnabled && (
                        <div style={{ display: 'grid', gridTemplateColumns: '130px 90px 45px', gap: '6px', alignItems: 'center', paddingLeft: '20px' }}>
                          <span style={{ fontSize: '11px', color: '#475569' }}>Finish feed rate:</span>
                          <input
                            type="number"
                            value={formData.pocketParameters.finishFeedRate}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                pocketParameters: { ...prev.pocketParameters, finishFeedRate: Number(e.target.value) }
                              }))
                            }
                            style={CLASSIC_YELLOW}
                          />
                          <span style={{ fontSize: '11px', color: '#64748b' }}>mm/min</span>
                        </div>
                      )}
                    </fieldset>
                  </div>

                  <div>
                    <MastercamPocketCuttingStyleSvg style={formData.pocketParameters.cuttingStyle} />
                  </div>
                </div>
              </div>
            )}

            {/* 9. TRANSITIONS PAGE */}
            {activePage === 'transitions' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
                  <div>
                    <fieldset style={MC_GROUPBOX}>
                      <legend style={MC_LEGEND}>Entry Transition into Material</legend>
                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '6px', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#475569' }}>Entry method:</span>
                        <select
                          value={formData.transitions.entryMethod}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              transitions: { ...prev.transitions, entryMethod: e.target.value }
                            }))
                          }
                          style={CLASSIC_YELLOW}
                        >
                          <option value="helical_ramp">Helical Ramp (Standard Mastercam)</option>
                          <option value="linear_ramp">Linear Ramp (Back & Forth)</option>
                          <option value="plunge">Plunge (Pre-drilled hole only)</option>
                        </select>
                      </div>

                      {formData.transitions.entryMethod === 'helical_ramp' && (
                        <>
                          <div style={{ display: 'grid', gridTemplateColumns: '120px 100px 30px', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '11px', color: '#475569' }}>Helical radius:</span>
                            <input
                              type="number"
                              step="0.5"
                              value={formData.transitions.helicalRadiusMax}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  transitions: { ...prev.transitions, helicalRadiusMax: Number(e.target.value) }
                                }))
                              }
                              style={CLASSIC_YELLOW}
                            />
                            <span style={{ fontSize: '11px', color: '#64748b' }}>mm</span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '120px 100px 30px', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '11px', color: '#475569' }}>Z Pitch per turn:</span>
                            <input
                              type="number"
                              step="0.5"
                              value={formData.transitions.rampPitch}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  transitions: { ...prev.transitions, rampPitch: Number(e.target.value) }
                                }))
                              }
                              style={CLASSIC_YELLOW}
                            />
                            <span style={{ fontSize: '11px', color: '#64748b' }}>mm</span>
                          </div>
                        </>
                      )}

                      {formData.transitions.entryMethod === 'linear_ramp' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '120px 100px 30px', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '11px', color: '#475569' }}>Ramp angle:</span>
                          <input
                            type="number"
                            step="0.5"
                            value={formData.transitions.rampAngle}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                transitions: { ...prev.transitions, rampAngle: Number(e.target.value) }
                              }))
                            }
                            style={CLASSIC_YELLOW}
                          />
                          <span style={{ fontSize: '11px', color: '#64748b' }}>deg</span>
                        </div>
                      )}

                      <div style={{ display: 'grid', gridTemplateColumns: '120px 100px 45px', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', color: '#475569' }}>Entry feed rate:</span>
                        <input
                          type="number"
                          value={formData.transitions.entryFeedRate}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              transitions: { ...prev.transitions, entryFeedRate: Number(e.target.value) }
                            }))
                          }
                          style={CLASSIC_YELLOW}
                        />
                        <span style={{ fontSize: '11px', color: '#64748b' }}>mm/min</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '120px 100px 30px', gap: '6px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#475569' }}>Plunge clearance:</span>
                        <input
                          type="number"
                          step="0.5"
                          value={formData.transitions.plungeClearance}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              transitions: { ...prev.transitions, plungeClearance: Number(e.target.value) }
                            }))
                          }
                          style={CLASSIC_YELLOW}
                        />
                        <span style={{ fontSize: '11px', color: '#64748b' }}>mm</span>
                      </div>
                    </fieldset>
                  </div>

                  <div>
                    <HelicalRampDiagramSvg method={formData.transitions.entryMethod} />
                  </div>
                </div>
              </div>
            )}

            {/* 10. STEEP / SHALLOW PAGE */}
            {activePage === 'steep_shallow' && (
              <div>
                <fieldset style={MC_GROUPBOX}>
                  <legend style={MC_LEGEND}>Z Depth Limits</legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <input
                          type="checkbox"
                          id="useZDepths"
                          checked={formData.steepShallow.useZDepths}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              steepShallow: { ...prev.steepShallow, useZDepths: e.target.checked }
                            }))
                          }
                        />
                        <label htmlFor="useZDepths" style={{ fontSize: '11px', fontWeight: 600, color: '#1e293b' }}>
                          Use Z depths
                        </label>

                        <button style={MC_BUTTON} onClick={handleDetectLimits}>
                          Detect limits
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '110px 100px 30px', gap: '6px', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#475569' }}>Minimum depth (Top):</span>
                        <input
                          type="number"
                          step="0.5"
                          disabled={!formData.steepShallow.useZDepths}
                          value={formData.steepShallow.minimumDepth}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              steepShallow: { ...prev.steepShallow, minimumDepth: Number(e.target.value) }
                            }))
                          }
                          style={formData.steepShallow.useZDepths ? CLASSIC_YELLOW : DISABLED_GRAY}
                        />
                        <span style={{ fontSize: '11px', color: '#64748b' }}>mm</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '110px 100px 30px', gap: '6px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#475569' }}>Maximum depth (Bottom):</span>
                        <input
                          type="number"
                          step="0.5"
                          disabled={!formData.steepShallow.useZDepths}
                          value={formData.steepShallow.maximumDepth}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              steepShallow: { ...prev.steepShallow, maximumDepth: Number(e.target.value) }
                            }))
                          }
                          style={formData.steepShallow.useZDepths ? CLASSIC_YELLOW : DISABLED_GRAY}
                        />
                        <span style={{ fontSize: '11px', color: '#64748b' }}>mm</span>
                      </div>
                    </div>

                    <div>
                      <MastercamSteepShallowSvg />
                    </div>
                  </div>
                </fieldset>
              </div>
            )}

            {/* 11. LINKING PARAMETERS PAGE */}
            {activePage === 'linking_parameters' && (
              <div>
                <fieldset style={MC_GROUPBOX}>
                  <legend style={MC_LEGEND}>Clearance & Retract Planes</legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '130px 100px 30px 120px', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#475569' }}>Clearance plane:</span>
                    <input
                      type="number"
                      value={formData.linkingParameters.clearancePlane}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          linkingParameters: { ...prev.linkingParameters, clearancePlane: Number(e.target.value) }
                        }))
                      }
                      style={CLASSIC_YELLOW}
                    />
                    <span style={{ fontSize: '11px', color: '#64748b' }}>mm</span>
                    <select
                      value={formData.linkingParameters.clearanceType}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          linkingParameters: { ...prev.linkingParameters, clearanceType: e.target.value }
                        }))
                      }
                      style={{ ...CLASSIC_YELLOW, height: '21px' }}
                    >
                      <option value="absolute">Absolute</option>
                      <option value="incremental">Incremental</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '130px 100px 30px 120px', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#475569' }}>Retract plane:</span>
                    <input
                      type="number"
                      value={formData.linkingParameters.retractPlane}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          linkingParameters: { ...prev.linkingParameters, retractPlane: Number(e.target.value) }
                        }))
                      }
                      style={CLASSIC_YELLOW}
                    />
                    <span style={{ fontSize: '11px', color: '#64748b' }}>mm</span>
                    <select
                      value={formData.linkingParameters.retractType}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          linkingParameters: { ...prev.linkingParameters, retractType: e.target.value }
                        }))
                      }
                      style={{ ...CLASSIC_YELLOW, height: '21px' }}
                    >
                      <option value="incremental">Incremental</option>
                      <option value="absolute">Absolute</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '130px 100px 30px', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#475569' }}>Part feed clearance:</span>
                    <input
                      type="number"
                      value={formData.linkingParameters.feedPlane}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          linkingParameters: { ...prev.linkingParameters, feedPlane: Number(e.target.value) }
                        }))
                      }
                      style={CLASSIC_YELLOW}
                    />
                    <span style={{ fontSize: '11px', color: '#64748b' }}>mm</span>
                  </div>
                </fieldset>
              </div>
            )}

            {/* 12. ARC FILTER / TOLERANCE PAGE */}
            {activePage === 'arc_filter_tolerance' && (
              <div>
                <fieldset style={MC_GROUPBOX}>
                  <legend style={MC_LEGEND}>Total Tolerance & Arc Filtering</legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 100px 30px', gap: '6px', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#475569' }}>Total tolerance:</span>
                    <input
                      type="number"
                      step="0.005"
                      value={formData.arcFilterTolerance.totalTolerance}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          arcFilterTolerance: { ...prev.arcFilterTolerance, totalTolerance: Number(e.target.value) }
                        }))
                      }
                      style={CLASSIC_YELLOW}
                    />
                    <span style={{ fontSize: '11px', color: '#64748b' }}>mm</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="checkbox"
                      id="lineArcFiltering"
                      checked={formData.arcFilterTolerance.lineArcFiltering}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          arcFilterTolerance: { ...prev.arcFilterTolerance, lineArcFiltering: e.target.checked }
                        }))
                      }
                    />
                    <label htmlFor="lineArcFiltering" style={{ fontSize: '11px', color: '#1e293b' }}>
                      Line / Arc filtering in XY (Generate G02 / G03 Arcs)
                    </label>
                  </div>
                </fieldset>
              </div>
            )}

            {/* 13. PLANES (WCS) PAGE */}
            {activePage === 'planes' && (
              <div>
                <fieldset style={MC_GROUPBOX}>
                  <legend style={MC_LEGEND}>Coordinate Planes (WCS & Tool Plane)</legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '100px 140px', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#475569' }}>WCS:</span>
                    <select value={formData.planes.wcs} style={CLASSIC_YELLOW} readOnly>
                      <option value="Top">Top (G54 X0 Y0 Z0)</option>
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '100px 140px', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#475569' }}>Tool Plane:</span>
                    <select value={formData.planes.toolPlane} style={CLASSIC_YELLOW} readOnly>
                      <option value="Top">Top</option>
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '100px 140px', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#475569' }}>Comp Plane:</span>
                    <select value={formData.planes.compPlane} style={CLASSIC_YELLOW} readOnly>
                      <option value="Top">Top</option>
                    </select>
                  </div>
                </fieldset>
              </div>
            )}

            {/* 14. COOLANT PAGE */}
            {activePage === 'coolant' && (
              <div>
                <fieldset style={MC_GROUPBOX}>
                  <legend style={MC_LEGEND}>Coolant Supply</legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '100px 150px', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#475569' }}>Coolant mode:</span>
                    <select
                      value={formData.coolant.mode}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          coolant: { ...prev.coolant, mode: e.target.value }
                        }))
                      }
                      style={CLASSIC_YELLOW}
                    >
                      <option value="flood">Flood (M08)</option>
                      <option value="mist">Mist</option>
                      <option value="thru">Through Spindle (M07)</option>
                      <option value="air">Air Blast</option>
                      <option value="off">Off (M09)</option>
                    </select>
                  </div>
                </fieldset>
              </div>
            )}

            {/* 15. CANNED TEXT PAGE */}
            {activePage === 'canned_text' && (
              <div>
                <fieldset style={MC_GROUPBOX}>
                  <legend style={MC_LEGEND}>Canned Text & Stop Codes</legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 180px', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#475569' }}>Before operation:</span>
                    <select
                      value={formData.cannedText.preOp}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          cannedText: { ...prev.cannedText, preOp: e.target.value }
                        }))
                      }
                      style={CLASSIC_YELLOW}
                    >
                      <option value="none">None</option>
                      <option value="m00">M00 (Program Stop)</option>
                      <option value="m01">M01 (Optional Stop)</option>
                    </select>
                  </div>
                </fieldset>
              </div>
            )}
          </div>
        </div>

        {/* Mastercam Standard Dialog Footer */}
        <div
          style={{
            height: '36px',
            background: '#f1f5f9',
            borderTop: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '0 12px',
            gap: '8px'
          }}
        >
          <button
            onClick={() => handleApply(true)}
            style={{
              ...MC_BUTTON,
              height: '24px',
              padding: '0 12px',
              background: 'linear-gradient(180deg, #dcfce7 0%, #bbf7d0 100%)',
              border: '1px solid #16a34a',
              color: '#15803d',
              fontWeight: 600
            }}
            title="Generate Surface Rough Pocket Toolpath & Close (OK)"
          >
            <Check size={14} style={{ marginRight: '4px' }} /> OK
          </button>

          <button
            onClick={onClose}
            style={{
              ...MC_BUTTON,
              height: '24px',
              padding: '0 12px',
              background: 'linear-gradient(180deg, #fee2e2 0%, #fecaca 100%)',
              border: '1px solid #dc2626',
              color: '#b91c1c',
              fontWeight: 600
            }}
            title="Cancel"
          >
            <X size={14} style={{ marginRight: '4px' }} /> Cancel
          </button>

          <button
            onClick={() => handleApply(false)}
            style={{
              ...MC_BUTTON,
              height: '24px',
              padding: '0 12px',
              background: 'linear-gradient(180deg, #e0f2fe 0%, #bae6fd 100%)',
              border: '1px solid #0284c7',
              color: '#0369a1',
              fontWeight: 600
            }}
            title="Apply & Create Another"
          >
            <Plus size={14} style={{ marginRight: '4px' }} /> Apply
          </button>

          <button
            onClick={() => alert('Surface Rough Pocket: Traditional 3D rough pocketing with constant-Z planar slicing, multi-pass spiral/zigzag clearing, and helical ramps.')}
            style={{
              ...MC_BUTTON,
              height: '24px',
              padding: '0 8px'
            }}
            title="Help"
          >
            <HelpCircle size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
