import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Check, HelpCircle, Plus, ChevronRight, Save, FolderOpen,
  Calculator, Layers, Box, Cpu, Flame, Gauge, Zap, AlertCircle,
  Eye, Crosshair, Ban, MousePointer
} from 'lucide-react';
import {
  OPTIROUGH_MATERIALS,
  OPTIROUGH_PRESETS,
  resolveOptiRoughMachineCapabilities,
  calculateOptiRoughPhysics,
  createDefaultOptiRoughState
} from '../config/optiRoughSchema.js';

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
 * Mastercam Dynamic Containment Boundary Diagram (Screenshot 2)
 */
function MastercamContainmentBoundarySvg({ strategy = 'stay_inside', compensateTo = 'center' }) {
  let circleX = 135;
  let circleY = 30; // Center: on top edge
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
 * Mastercam 3D Pocket Cut Cavity Diagram (Screenshot 4)
 */
function MastercamPocket3DSvg() {
  return (
    <svg width="200" height="120" viewBox="0 0 200 120" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '2px' }}>
      <polygon points="40,25 140,20 175,45 75,52" fill="#475569" stroke="#334155" strokeWidth="1.5" />
      <polygon points="75,52 175,45 175,95 75,102" fill="#334155" stroke="#1e293b" strokeWidth="1.5" />
      <polygon points="40,25 75,52 75,102 40,75" fill="#64748b" stroke="#334155" strokeWidth="1.5" />
      <polygon points="80,50 160,45 145,85 70,88" fill="#1e293b" opacity="0.9" />
      <path d="M 85 53 L 155 48 L 150 62 L 80 67 Z" fill="none" stroke="#00e5ff" strokeWidth="1.2" />
      <path d="M 88 60 L 148 56 L 145 68 L 84 72 Z" fill="none" stroke="#00e5ff" strokeWidth="1.2" />
      <path d="M 91 67 L 142 64 L 140 74 L 88 77 Z" fill="none" stroke="#00e5ff" strokeWidth="1.2" />
      <path d="M 94 74 L 136 71 L 135 80 L 92 82 Z" fill="none" stroke="#00e5ff" strokeWidth="1.2" />
      <path d="M 98 81 L 130 78 L 128 85 L 96 86 Z" fill="none" stroke="#00e5ff" strokeWidth="1.2" />
      <line x1="115" y1="8" x2="115" y2="46" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="3,2" />
      <polygon points="115,50 112,44 118,44" fill="#fbbf24" />
      <text x="10" y="112" fill="#334155" fontSize="8" fontWeight="600">3D Dynamic Pocket Roughing</text>
    </svg>
  );
}

/**
 * Mastercam Steep / Shallow Z Limit Section Diagram (Screenshot 5)
 */
function MastercamSteepShallowLimitsSvg({ zTop = 0, zBottom = -2.25 }) {
  return (
    <svg width="200" height="110" viewBox="0 0 200 110" style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '2px' }}>
      <path d="M 25 75 L 55 75 L 55 50 Q 55 25 80 25 Q 105 25 105 50 L 105 75 L 145 75" fill="#cbd5e1" stroke="#64748b" strokeWidth="2" />
      <rect x="25" y="75" width="120" height="12" fill="#94a3b8" stroke="#64748b" strokeWidth="1.5" />

      <line x1="80" y1="25" x2="185" y2="25" stroke="#dc2626" strokeWidth="2" />
      <text x="125" y="20" fill="#dc2626" fontSize="8" fontWeight="bold">Min: {Number(zTop).toFixed(2)}</text>

      <line x1="105" y1="75" x2="185" y2="75" stroke="#dc2626" strokeWidth="2" />
      <text x="125" y="70" fill="#dc2626" fontSize="8" fontWeight="bold">Max: {Number(zBottom).toFixed(2)}</text>
    </svg>
  );
}

/**
 * Mastercam Tip Compensation Icon
 */
function MastercamTipCompIcon() {
  return (
    <svg width="20" height="18" viewBox="0 0 20 18" style={{ border: '1px solid #9ca3af', background: '#ffffff', flexShrink: 0 }}>
      <path d="M 4 2 L 4 11 Q 4 14 7 14 L 13 14 Q 16 14 16 11 L 16 2" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
      <line x1="2" y1="15" x2="18" y2="15" stroke="#dc2626" strokeWidth="2" />
    </svg>
  );
}

/**
 * Helical Ramp Entry Diagram (Transitions Tab)
 */
function HelicalRampDiagramSvg() {
  return (
    <svg width="180" height="90" viewBox="0 0 180 90" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '3px' }}>
      <ellipse cx="90" cy="20" rx="35" ry="10" fill="none" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="3,2" />
      <path d="M 55 20 C 55 35, 125 35, 125 45 C 125 55, 55 55, 55 65 C 55 75, 125 75, 125 82" fill="none" stroke="#2563eb" strokeWidth="2" />
      <polygon points="125,85 122,78 128,78" fill="#2563eb" />
      <text x="10" y="35" fill="#1e293b" fontSize="9.5" fontWeight="bold">Helical Ramp</text>
      <text x="10" y="48" fill="#64748b" fontSize="8.5">Radius: 5mm</text>
      <text x="10" y="60" fill="#64748b" fontSize="8.5">Angle: 2.0°</text>
    </svg>
  );
}

/**
 * Authentic Mastercam 3D High Speed Toolpaths - Dynamic OptiRough Modal
 */
export default function SurfaceRoughOptiRoughModal({
  isOpen,
  onClose,
  operation = null,
  tools = [],
  activeMachine = {},
  stockConfig = {},
  currentModel = null,
  onSaveOperation,
  onNotify
}) {
  const caps = useMemo(() => resolveOptiRoughMachineCapabilities(activeMachine), [activeMachine]);

  // Mastercam Tree Navigation Pages (Hierarchy matching screenshots)
  const TREE_PAGES = [
    { id: 'toolpath_type', label: 'Toolpath Type', edited: true, level: 0 },
    { id: 'model_geometry', label: 'Model Geometry', edited: true, level: 0 },
    { id: 'toolpath_control', label: 'Toolpath Control', edited: true, level: 0 },
    { id: 'tool', label: 'Tool', edited: true, level: 0 },
    { id: 'holder', label: 'Holder', edited: false, level: 0 },
    { isDivider: true, id: 'div_1' },
    { id: 'stock', label: 'Stock', edited: false, disabled: true, level: 0 },
    { id: 'cut_parameters', label: 'Cut Parameters', edited: true, level: 0 },
    { id: 'transitions', label: 'Transitions', edited: false, level: 1 },
    { id: 'steep_shallow', label: 'Steep / Shallow', edited: true, level: 1 },
    { id: 'linking_parameters', label: 'Linking Parameters', edited: false, level: 0 },
    { isDivider: true, id: 'div_2' },
    { id: 'arc_filter_tolerance', label: 'Arc Filter / Tolerance', edited: false, level: 0 },
    { id: 'planes', label: 'Planes (WCS)', edited: false, level: 0 },
    { id: 'coolant', label: 'Coolant', edited: false, level: 0 },
    { id: 'canned_text', label: 'Canned Text', edited: false, level: 0 }
  ];

  const [activePage, setActivePage] = useState('model_geometry');
  const [formData, setFormData] = useState(() => createDefaultOptiRoughState({ activeMachine, stockConfig, currentModel, tool: tools[0] }));

  // Synchronize state when opening or when operation changes
  useEffect(() => {
    if (isOpen) {
      if (operation) {
        setFormData((prev) => ({
          ...prev,
          ...operation,
          tool: { ...prev.tool, ...(operation.tool || {}) },
          cutParameters: { ...prev.cutParameters, ...(operation.cutParameters || {}) },
          modelGeometry: { ...prev.modelGeometry, ...(operation.modelGeometry || {}) },
          toolpathControl: { ...prev.toolpathControl, ...(operation.toolpathControl || {}) },
          transitions: { ...prev.transitions, ...(operation.transitions || {}) },
          linkingParameters: { ...prev.linkingParameters, ...(operation.linkingParameters || {}) },
          arcFilterTolerance: { ...prev.arcFilterTolerance, ...(operation.arcFilterTolerance || {}) }
        }));
      } else {
        setFormData(createDefaultOptiRoughState({ activeMachine, stockConfig, currentModel, tool: tools[0] }));
      }
    }
  }, [isOpen, operation, activeMachine, stockConfig, currentModel, tools]);

  // Real-time Physics Calculations
  const physics = useMemo(() => {
    return calculateOptiRoughPhysics(
      formData.tool,
      formData.cutParameters,
      formData.selectedMaterialKey || 'ALU_6061'
    );
  }, [formData.tool, formData.cutParameters, formData.selectedMaterialKey]);

  if (!isOpen) return null;

  // Handlers for nested state updates
  const updateNested = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // Stepover dual sync (% <-> mm)
  const handleStepoverSync = (type, val) => {
    const d = Number(formData.tool.diameter || 10);
    if (type === 'pct') {
      const pct = Number(val) || 0;
      const mm = Number(((d * pct) / 100).toFixed(3));
      setFormData((prev) => ({
        ...prev,
        cutParameters: { ...prev.cutParameters, stepoverPct: pct, stepoverMm: mm }
      }));
    } else {
      const mm = Number(val) || 0;
      const pct = d > 0 ? Number(((mm / d) * 100).toFixed(1)) : 0;
      setFormData((prev) => ({
        ...prev,
        cutParameters: { ...prev.cutParameters, stepoverPct: pct, stepoverMm: mm }
      }));
    }
  };

  // Stepdown dual sync (% <-> mm)
  const handleStepdownSync = (type, val) => {
    const d = Number(formData.tool.diameter || 10);
    if (type === 'pct') {
      const pct = Number(val) || 0;
      const mm = Number(((d * pct) / 100).toFixed(3));
      setFormData((prev) => ({
        ...prev,
        cutParameters: { ...prev.cutParameters, stepdownPct: pct, stepdownMm: mm }
      }));
    } else {
      const mm = Number(val) || 0;
      const pct = d > 0 ? Number(((mm / d) * 100).toFixed(1)) : 0;
      setFormData((prev) => ({
        ...prev,
        cutParameters: { ...prev.cutParameters, stepdownPct: pct, stepdownMm: mm }
      }));
    }
  };

  // Stepup dual sync (% <-> mm)
  const handleStepupSync = (type, val) => {
    const d = Number(formData.tool.diameter || 10);
    if (type === 'pct') {
      const pct = Number(val) || 0;
      const mm = Number(((d * pct) / 100).toFixed(3));
      setFormData((prev) => ({
        ...prev,
        cutParameters: { ...prev.cutParameters, stepupPct: pct, stepupMm: mm }
      }));
    } else {
      const mm = Number(val) || 0;
      const pct = d > 0 ? Number(((mm / d) * 100).toFixed(1)) : 0;
      setFormData((prev) => ({
        ...prev,
        cutParameters: { ...prev.cutParameters, stepupPct: pct, stepupMm: mm }
      }));
    }
  };

  // Min radius dual sync (% <-> mm)
  const handleMinRadiusSync = (type, val) => {
    const d = Number(formData.tool.diameter || 10);
    if (type === 'pct') {
      const pct = Number(val) || 0;
      const mm = Number(((d * pct) / 100).toFixed(3));
      setFormData((prev) => ({
        ...prev,
        cutParameters: { ...prev.cutParameters, minToolpathRadiusPct: pct, minToolpathRadiusMm: mm }
      }));
    } else {
      const mm = Number(val) || 0;
      const pct = d > 0 ? Number(((mm / d) * 100).toFixed(1)) : 0;
      setFormData((prev) => ({
        ...prev,
        cutParameters: { ...prev.cutParameters, minToolpathRadiusPct: pct, minToolpathRadiusMm: mm }
      }));
    }
  };

  // Tool dimension change
  const handleToolDimensionChange = (field, val) => {
    const numVal = Number(val) || 0;
    setFormData((prev) => {
      const updatedTool = { ...prev.tool, [field]: numVal };
      const d = field === 'diameter' ? numVal : Number(prev.tool.diameter || 10);
      const stepoverMm = Number(((d * (prev.cutParameters.stepoverPct || 15)) / 100).toFixed(3));
      const stepdownMm = Number(((d * (prev.cutParameters.stepdownPct || 150)) / 100).toFixed(3));
      const stepupMm = Number(((d * (prev.cutParameters.stepupPct || 10)) / 100).toFixed(3));
      const minRadiusMm = Number(((d * (prev.cutParameters.minToolpathRadiusPct || 7.5)) / 100).toFixed(3));

      return {
        ...prev,
        tool: updatedTool,
        cutParameters: {
          ...prev.cutParameters,
          stepoverMm,
          stepdownMm,
          stepupMm,
          minToolpathRadiusMm: minRadiusMm
        }
      };
    });
  };

  // Auto Detect Z Limits from stockConfig and model bounding box
  const handleDetectLimits = () => {
    const topZ = Number(stockConfig?.stockZMax ?? currentModel?.boundingBox?.max?.z ?? 0.0);
    const bottomZ = Number(stockConfig?.stockZMin ?? currentModel?.boundingBox?.min?.z ?? -2.25);
    setFormData((prev) => ({
      ...prev,
      steepShallow: {
        ...prev.steepShallow,
        useZDepths: true,
        zTop: topZ,
        zBottom: bottomZ
      }
    }));
    onNotify?.(`Detected Z depths: Min Depth (Top) ${topZ.toFixed(3)}mm, Max Depth (Floor) ${bottomZ.toFixed(3)}mm`, 'info');
  };

  // Tool selection handler
  const handleSelectTool = (selectedTool) => {
    if (!selectedTool) return;
    const d = Number(selectedTool.diameter || 10);
    const cr = Number(selectedTool.cornerRadius || 0.063585);
    const rpm = Math.min(caps.maxRpm, Number(selectedTool.spindleSpeed || selectedTool.rpm || 3056));
    const feed = Number(selectedTool.feedRate || 300);

    setFormData((prev) => ({
      ...prev,
      tool: {
        ...prev.tool,
        id: selectedTool.id,
        number: selectedTool.number || 501,
        name: selectedTool.name || '1 INCH High Feed Mill',
        diameter: d,
        cornerRadius: cr,
        lengthOffset: selectedTool.lengthOffset ?? selectedTool.number ?? 501,
        diameterOffset: selectedTool.diameterOffset ?? selectedTool.number ?? 501,
        spindleSpeed: rpm,
        feedRate: feed,
        cs: Math.round((Math.PI * d * rpm) / 1000),
        fpt: Number((feed / (rpm * Math.max(1, selectedTool.flutes || 4))).toFixed(4))
      },
      cutParameters: {
        ...prev.cutParameters,
        stepoverMm: Number(((d * prev.cutParameters.stepoverPct) / 100).toFixed(3)),
        stepdownMm: Number((d * (prev.cutParameters.stepdownPct / 100)).toFixed(3)),
        stepupMm: Number((d * (prev.cutParameters.stepupPct / 100)).toFixed(3))
      }
    }));
  };

  // Preset application handler
  const handleApplyPreset = (preset) => {
    const toolDiam = Number(formData.tool.diameter || 10);
    const newStepdown = Number((toolDiam * preset.stepdownFactor).toFixed(1));
    const newStepoverMm = Number(((toolDiam * preset.stepoverPct) / 100).toFixed(2));

    setFormData((prev) => ({
      ...prev,
      selectedPresetId: preset.id,
      selectedMaterialKey: preset.materialKey,
      cutParameters: {
        ...prev.cutParameters,
        stepoverPct: preset.stepoverPct,
        stepoverMm: newStepoverMm,
        stepdownMm: newStepdown,
        stepupMm: preset.stepupMm
      },
      transitions: {
        ...prev.transitions,
        rampAngle: preset.rampAngle
      },
      linkingParameters: {
        ...prev.linkingParameters,
        microLiftDistance: preset.microLiftMm,
        backFeedRate: preset.backFeedRate
      }
    }));
    onNotify?.(`Loaded OptiRough Preset: ${preset.label}`, 'success');
  };

  // Mastercam Recommended Values Handler
  const handleApplyRecommended = () => {
    const toolDiam = Number(formData.tool.diameter || 10);
    const newStepdown = Number((toolDiam * 1.5).toFixed(1));
    const newStepover = Number(((toolDiam * 15.0) / 100).toFixed(2));
    const newStepup = Number((toolDiam * 0.1).toFixed(1));

    setFormData((prev) => ({
      ...prev,
      selectedPresetId: 'alu_high_speed',
      selectedMaterialKey: 'ALU_6061',
      modelGeometry: {
        ...prev.modelGeometry,
        sameWallAndFloorStock: true,
        wallStock: 1.0,
        floorStock: 1.0
      },
      toolpathControl: {
        ...prev.toolpathControl,
        strategy: 'stay_inside',
        compensateTo: 'center'
      },
      cutParameters: {
        ...prev.cutParameters,
        cuttingMethod: 'climb',
        optimizeStepups: 'by_depth',
        optimizeStepdowns: 'material',
        stepoverPct: 15.0,
        stepoverMm: newStepover,
        stepdownPct: 150.0,
        stepdownMm: newStepdown,
        stepupEnabled: true,
        stepupPct: 10.0,
        stepupMm: newStepup,
        millVerticalWalls: true,
        minToolpathRadiusPct: 7.5,
        minToolpathRadiusMm: Number((toolDiam * 0.075).toFixed(3)),
        microLiftDistance: 0.25,
        backFeedrate: 2500.0
      },
      transitions: {
        ...prev.transitions,
        entryMethod: 'helical_ramp',
        rampAngle: 2.0,
        helicalRadius: 5.0,
        helicalPitch: 2.0
      },
      linkingParameters: {
        ...prev.linkingParameters,
        clearancePlane: 50.0,
        partClearance: 2.5,
        microLiftDistance: 0.25,
        backFeedRate: 2500.0
      }
    }));
    onNotify?.('Loaded Mastercam Recommended OptiRough Values (15mm Stepdown, 1mm Stepup, 15% Stepover, 1.0mm Stock)', 'success');
  };

  // Confirm and save operation
  const handleConfirm = () => {
    const finalOp = {
      ...formData,
      id: operation?.id || Date.now(),
      name: formData.name || '3D High Speed Dynamic OptiRough',
      strategyKey: 'surface_rough_optirough',
      badgeClass: 'adaptive',
      opType: 'adaptive',
      toolId: formData.tool.id,
      physics
    };
    onSaveOperation?.(finalOp);
    onClose?.();
  };

  return (
    <div
      data-testid="surface-rough-optirough-modal"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        zIndex: 99990,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          width: '920px',
          maxWidth: '96vw',
          maxHeight: '94vh',
          backgroundColor: '#f0f0f0',
          border: '1px solid #707070',
          boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: "'Segoe UI', Tahoma, sans-serif",
          fontSize: '12px',
          color: '#1e293b',
          userSelect: 'none',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}
      >
        {/* ================= Mastercam Window Title Bar ================= */}
        <div
          style={{
            height: '32px',
            background: 'linear-gradient(180deg, #0f5a9e 0%, #0c4a80 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            padding: '0 10px',
            fontWeight: 600,
            fontSize: '12px',
            gap: '8px',
            flexShrink: 0
          }}
        >
          <div
            style={{
              width: '16px',
              height: '16px',
              backgroundColor: '#dc2626',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 900
            }}
          >
            M
          </div>
          <span>Surface High Speed Toolpaths - Dynamic OptiRough</span>
          <span style={{ color: '#93c5fd', fontSize: '11px', fontWeight: 'normal', marginLeft: '6px' }}>
            [{caps.machineName}]
          </span>
          <div style={{ flex: 1 }} />
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* ================= Top Action Bar & Presets ================= */}
        <div
          style={{
            padding: '4px 10px',
            background: '#e2e8f0',
            borderBottom: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0,
            flexWrap: 'wrap'
          }}
        >
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
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
            title="One-Click Mastercam Recommended Values (15mm Stepdown, 1mm Stepup, 15% Stepover, 1.0mm Stock)"
          >
            ⭐ Recommended Values
          </button>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>Quick Presets:</span>
          {OPTIROUGH_PRESETS.map((p) => {
            const isSelected = (formData.selectedPresetId || 'alu_high_speed') === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleApplyPreset(p)}
                style={{
                  ...MC_BUTTON,
                  height: '21px',
                  fontSize: '10.5px',
                  background: isSelected ? '#bae6fd' : '#ffffff',
                  borderColor: isSelected ? '#0284c7' : '#cbd5e1',
                  color: isSelected ? '#0369a1' : '#1e293b',
                  fontWeight: isSelected ? 700 : 500
                }}
                title={p.desc}
              >
                {p.label}
              </button>
            );
          })}
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: '11px', color: '#0369a1', fontWeight: 600 }}>
            MRR: {physics.mrrCm3Min} cm³/min &bull; Power: {physics.powerKw} kW &bull; Constant θ: {physics.engagementDeg}°
          </span>
        </div>

        {/* ================= Main Split Body: Left Tree + Right Content ================= */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
          {/* Left Navigation Tree & Quick View Settings */}
          <div
            style={{
              width: '210px',
              background: '#f8fafc',
              borderRight: '1px solid #cbd5e1',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0
            }}
          >
            {/* Mastercam Mini-Toolbar above Tree */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '3px 6px', borderBottom: '1px solid #cbd5e1', background: '#f1f5f9' }}>
              <button style={{ ...MC_BUTTON, height: '22px', width: '24px', padding: 0 }} title="Select Library Tool"><Box size={13} color="#0f5a9e" /></button>
              <button style={{ ...MC_BUTTON, height: '22px', width: '24px', padding: 0 }} title="Copy parameters"><Layers size={13} color="#475569" /></button>
              <button style={{ ...MC_BUTTON, height: '22px', width: '24px', padding: 0 }} title="Save default parameters"><Save size={13} color="#475569" /></button>
              <button style={{ ...MC_BUTTON, height: '22px', width: '24px', padding: 0 }} title="Calculate Speeds & Feeds"><Calculator size={13} color="#475569" /></button>
              <button style={{ ...MC_BUTTON, height: '22px', width: '24px', padding: 0 }} title="Help"><HelpCircle size={13} color="#475569" /></button>
            </div>

            {/* Tree Pages List with Mastercam Hierarchy and Indicators */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
              {TREE_PAGES.map((page) => {
                if (page.isDivider) {
                  return <div key={page.id} style={{ height: '1px', background: '#cbd5e1', margin: '4px 8px' }} />;
                }
                const isSelected = activePage === page.id;
                const isSubItem = page.level === 1;

                return (
                  <div
                    key={page.id}
                    onClick={() => setActivePage(page.id)}
                    style={{
                      padding: '4px 8px',
                      paddingLeft: isSubItem ? '24px' : '8px',
                      fontSize: '11px',
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? '#0f5a9e' : page.disabled ? '#94a3b8' : '#334155',
                      background: isSelected ? '#e0f2fe' : 'transparent',
                      borderLeft: isSelected ? '3px solid #0f5a9e' : '3px solid transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    {/* Mastercam Edit / Disabled Status Icons */}
                    {page.disabled ? (
                      <span style={{ color: '#dc2626', fontSize: '11px', width: '12px', textAlign: 'center' }}>⊘</span>
                    ) : page.edited ? (
                      <span style={{ color: '#16a34a', fontSize: '11px', width: '12px', textAlign: 'center' }}>✓</span>
                    ) : (
                      <span style={{ width: '12px' }} />
                    )}

                    {isSubItem && <span style={{ color: '#94a3b8', fontSize: '10px' }}>└</span>}
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{page.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Quick View Settings Box (Mastercam Authentic 12 Parameters) */}
            <div
              style={{
                borderTop: '1px solid #cbd5e1',
                background: '#ffffff',
                padding: '5px 8px',
                fontSize: '10px',
                color: '#334155'
              }}
            >
              <div style={{ fontWeight: 700, color: '#0f5a9e', marginBottom: '2px', fontSize: '10.5px' }}>Quick View Settings</div>
              <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: '1px', lineHeight: '1.25' }}>
                <span style={{ color: '#64748b' }}>Tool:</span>
                <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {formData.tool.name}
                </span>
                <span style={{ color: '#64748b' }}>Tool Diameter:</span>
                <span>{formData.tool.diameter}</span>
                <span style={{ color: '#64748b' }}>Corner Radius:</span>
                <span>{formData.tool.cornerRadius}</span>
                <span style={{ color: '#64748b' }}>Feed Rate:</span>
                <span>{formData.tool.feedRate}</span>
                <span style={{ color: '#64748b' }}>Spindle Speed:</span>
                <span>{formData.tool.spindleSpeed}</span>
                <span style={{ color: '#64748b' }}>Coolant:</span>
                <span style={{ textTransform: 'capitalize' }}>{formData.tool.coolant || 'Off'}</span>
                <span style={{ color: '#64748b' }}>Tool Length:</span>
                <span>4</span>
                <span style={{ color: '#64748b' }}>Length Offset:</span>
                <span>{formData.tool.lengthOffset || 501}</span>
                <span style={{ color: '#64748b' }}>Diameter Off...:</span>
                <span>{formData.tool.diameterOffset || 501}</span>
                <span style={{ color: '#64748b' }}>Cplane / Tpl...:</span>
                <span>{formData.planes?.toolPlane || 'Top'}</span>
                <span style={{ color: '#64748b' }}>Formula File:</span>
                <span>Default.Formula</span>
                <span style={{ color: '#64748b' }}>Axis Combin...:</span>
                <span>Default (1)</span>
              </div>
              <div style={{ marginTop: '4px', paddingTop: '3px', borderTop: '1px dotted #e2e8f0', display: 'flex', gap: '8px', fontSize: '9.5px', color: '#64748b' }}>
                <span><b style={{ color: '#16a34a' }}>✓</b> = edited</span>
                <span><b style={{ color: '#dc2626' }}>⊘</b> = disabled</span>
              </div>
            </div>
          </div>

          {/* Right Contextual Content Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', background: '#ffffff' }}>
            {/* 1. TOOLPATH TYPE PAGE */}
            {activePage === 'toolpath_type' && (
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f5a9e', marginBottom: '10px' }}>
                  3D High Speed Roughing Strategies
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div
                    style={{
                      border: '2px solid #0f5a9e',
                      background: '#eff6ff',
                      padding: '10px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: 700, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Zap size={16} color="#0284c7" />
                      Dynamic OptiRough
                    </div>
                    <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                      Constant engagement high-speed roughing for core/cavities with stepdown and bi-directional upward stepup.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. MODEL GEOMETRY PAGE (Screenshot 1: Parallel Machining & Avoidance Tables) */}
            {activePage === 'model_geometry' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                  {/* Left Table: Machining Geometry */}
                  <fieldset style={MC_GROUPBOX}>
                    <legend style={MC_LEGEND}>Machining Geometry</legend>
                    <div style={{ border: '1px solid #cbd5e1', background: '#ffffff', minHeight: '170px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead>
                          <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#475569' }}>
                            <th style={{ width: '22px', padding: '2px' }}></th>
                            <th style={{ textAlign: 'left', padding: '2px 4px' }}>Name</th>
                            <th style={{ textAlign: 'center', padding: '2px 4px' }}>Entities</th>
                            <th style={{ textAlign: 'right', padding: '2px 4px' }}>Wall Stock</th>
                            <th style={{ textAlign: 'right', padding: '2px 4px' }}>Floor Stock</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ background: '#0078d7', color: '#ffffff' }}>
                            <td style={{ padding: '2px', textAlign: 'center' }}>
                              <span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#22c55e', border: '1px solid #ffffff' }} />
                            </td>
                            <td style={{ padding: '2px 4px' }}>machining</td>
                            <td style={{ padding: '2px 4px', textAlign: 'center' }}>{formData.modelGeometry.machiningEntitiesCount || 65}</td>
                            <td style={{ padding: '2px 4px', textAlign: 'right' }}>
                              <input
                                type="number"
                                step="0.1"
                                style={{ ...CLASSIC_YELLOW, width: '48px', height: '18px', textAlign: 'right', padding: '1px 3px' }}
                                value={formData.modelGeometry.wallStock}
                                onChange={(e) => updateNested('modelGeometry', 'wallStock', parseFloat(e.target.value) || 0)}
                              />
                            </td>
                            <td style={{ padding: '2px 4px', textAlign: 'right' }}>
                              <input
                                type="number"
                                step="0.1"
                                style={{ ...CLASSIC_YELLOW, width: '48px', height: '18px', textAlign: 'right', padding: '1px 3px' }}
                                value={formData.modelGeometry.floorStock}
                                onChange={(e) => updateNested('modelGeometry', 'floorStock', parseFloat(e.target.value) || 0)}
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    {/* Sub-toolbar */}
                    <div style={{ display: 'flex', gap: '4px', marginTop: '6px', justifyContent: 'flex-end' }}>
                      <button style={MC_BUTTON} title="Select Drive Surfaces"><MousePointer size={12} /></button>
                      <button style={MC_BUTTON} title="Add Geometry Row"><Plus size={12} /></button>
                      <button style={MC_BUTTON} title="Pick Entities"><Crosshair size={12} /></button>
                    </div>
                  </fieldset>

                  {/* Right Table: Avoidance Geometry */}
                  <fieldset style={MC_GROUPBOX}>
                    <legend style={MC_LEGEND}>Avoidance Geometry</legend>
                    <div style={{ border: '1px solid #cbd5e1', background: '#ffffff', minHeight: '170px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead>
                          <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#475569' }}>
                            <th style={{ width: '22px', padding: '2px' }}></th>
                            <th style={{ textAlign: 'left', padding: '2px 4px' }}>Name</th>
                            <th style={{ textAlign: 'center', padding: '2px 4px' }}>Entities</th>
                            <th style={{ textAlign: 'right', padding: '2px 4px' }}>Wall Stock</th>
                            <th style={{ textAlign: 'right', padding: '2px 4px' }}>Floor Stock</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ background: '#0078d7', color: '#ffffff' }}>
                            <td style={{ padding: '2px', textAlign: 'center' }}>
                              <span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#ef4444', border: '1px solid #ffffff' }} />
                            </td>
                            <td style={{ padding: '2px 4px' }}>avoidance</td>
                            <td style={{ padding: '2px 4px', textAlign: 'center' }}>{formData.modelGeometry.avoidanceEntitiesCount || 0}</td>
                            <td style={{ padding: '2px 4px', textAlign: 'right' }}>
                              <input
                                type="number"
                                step="0.1"
                                style={{ ...CLASSIC_YELLOW, width: '48px', height: '18px', textAlign: 'right', padding: '1px 3px' }}
                                value={formData.modelGeometry.avoidanceWallStock}
                                onChange={(e) => updateNested('modelGeometry', 'avoidanceWallStock', parseFloat(e.target.value) || 0)}
                              />
                            </td>
                            <td style={{ padding: '2px 4px', textAlign: 'right' }}>
                              <input
                                type="number"
                                step="0.1"
                                style={{ ...CLASSIC_YELLOW, width: '48px', height: '18px', textAlign: 'right', padding: '1px 3px' }}
                                value={formData.modelGeometry.avoidanceFloorStock}
                                onChange={(e) => updateNested('modelGeometry', 'avoidanceFloorStock', parseFloat(e.target.value) || 0)}
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    {/* Sub-toolbar */}
                    <div style={{ display: 'flex', gap: '4px', marginTop: '6px', justifyContent: 'flex-end' }}>
                      <button style={MC_BUTTON} title="Select Avoidance Surfaces"><MousePointer size={12} /></button>
                      <button style={MC_BUTTON} title="Add Avoidance Row"><Plus size={12} /></button>
                      <button style={MC_BUTTON} title="Pick Entities"><Crosshair size={12} /></button>
                    </div>
                  </fieldset>
                </div>

                {/* Display Remainder Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', marginTop: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="checkbox"
                      checked={formData.modelGeometry.displayRemainder ?? true}
                      onChange={(e) => updateNested('modelGeometry', 'displayRemainder', e.target.checked)}
                    />
                    <span>Display Remainder</span>
                  </label>
                  <input
                    type="number"
                    style={{ ...CLASSIC_YELLOW, width: '55px', height: '21px' }}
                    value={formData.modelGeometry.displayRemainderValue ?? 15}
                    onChange={(e) => updateNested('modelGeometry', 'displayRemainderValue', parseInt(e.target.value) || 15)}
                  />
                </div>
              </div>
            )}

            {/* 3. TOOLPATH CONTROL PAGE (Screenshot 2: Containment boundary & Dynamic Diagram) */}
            {activePage === 'toolpath_control' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '14px' }}>
                {/* Left: Containment boundary */}
                <fieldset style={MC_GROUPBOX}>
                  <legend style={MC_LEGEND}>Containment boundary</legend>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#334155', minWidth: '95px' }}>Boundary chains:</span>
                    <span style={{ fontSize: '11px', fontWeight: 600 }}>({formData.toolpathControl.boundaryChainsCount || 0})</span>
                    <button style={MC_BUTTON} title="Select Boundary Chains"><MousePointer size={12} /></button>
                    <button style={{ ...MC_BUTTON, color: '#dc2626' }} title="Clear Boundary Chains"><Ban size={12} /></button>
                  </div>

                  <div style={{ marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>Strategy:</span>
                    <div style={{ marginLeft: '12px', marginTop: '3px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                        <input
                          type="radio"
                          name="tc_strat"
                          checked={formData.toolpathControl.strategy === 'from_outside'}
                          onChange={() => updateNested('toolpathControl', 'strategy', 'from_outside')}
                        />
                        From outside
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                        <input
                          type="radio"
                          name="tc_strat"
                          checked={formData.toolpathControl.strategy === 'stay_inside'}
                          onChange={() => updateNested('toolpathControl', 'strategy', 'stay_inside')}
                        />
                        Stay inside
                      </label>
                    </div>
                  </div>

                  <div style={{ marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>Contain:</span>
                    <div style={{ marginLeft: '12px', marginTop: '3px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                        <input
                          type="radio"
                          name="tc_contain"
                          checked={formData.toolpathControl.contain === 'tool_tip'}
                          onChange={() => updateNested('toolpathControl', 'contain', 'tool_tip')}
                        />
                        Tool tip
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                        <input
                          type="radio"
                          name="tc_contain"
                          checked={formData.toolpathControl.contain === 'tool_contact_point'}
                          onChange={() => updateNested('toolpathControl', 'contain', 'tool_contact_point')}
                        />
                        Tool contact point
                      </label>
                    </div>
                  </div>

                  <div style={{ marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>Compensate to:</span>
                    <div style={{ marginLeft: '12px', marginTop: '3px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {['inside', 'center', 'outside'].map((c) => (
                        <label key={c} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', textTransform: 'capitalize' }}>
                          <input
                            type="radio"
                            name="tc_comp"
                            checked={formData.toolpathControl.compensateTo === c}
                            onChange={() => updateNested('toolpathControl', 'compensateTo', c)}
                          />
                          {c}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#475569' }}>Offset distance:</span>
                    <input
                      type="number"
                      step="0.1"
                      style={CLASSIC_YELLOW}
                      value={formData.toolpathControl.offsetDistance ?? 4.0}
                      onChange={(e) => updateNested('toolpathControl', 'offsetDistance', parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', marginBottom: '6px' }}>
                    <input
                      type="checkbox"
                      checked={formData.toolpathControl.includeToolRadius ?? true}
                      onChange={(e) => updateNested('toolpathControl', 'includeToolRadius', e.target.checked)}
                    />
                    Include tool radius
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#475569' }}>Total offset distance:</span>
                    <input
                      type="number"
                      style={DISABLED_GRAY}
                      disabled
                      value={formData.toolpathControl.totalOffsetDistance ?? 0.0}
                    />
                  </div>
                </fieldset>

                {/* Right: Dynamic Boundary Diagram & Pickers */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '6px', background: '#ffffff' }}>
                    <MastercamContainmentBoundarySvg
                      strategy={formData.toolpathControl.strategy}
                      compensateTo={formData.toolpathControl.compensateTo}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px', border: '1px solid #cbd5e1', background: '#f8fafc', borderRadius: '2px' }}>
                    <span style={{ fontSize: '11px' }}>Approximate start point</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button style={MC_BUTTON}><MousePointer size={12} /></button>
                      <button style={{ ...MC_BUTTON, color: '#dc2626' }}><Ban size={12} /></button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px', border: '1px solid #cbd5e1', background: '#f8fafc', borderRadius: '2px' }}>
                    <span style={{ fontSize: '11px' }}>Curves ({formData.toolpathControl.curvesCount || 0})</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button style={MC_BUTTON}><MousePointer size={12} /></button>
                      <button style={MC_BUTTON}><Eye size={12} /></button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px', border: '1px solid #cbd5e1', background: '#f8fafc', borderRadius: '2px' }}>
                    <span style={{ fontSize: '11px' }}>Points ({formData.toolpathControl.pointsCount || 0})</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button style={MC_BUTTON}><MousePointer size={12} /></button>
                      <button style={MC_BUTTON}><Eye size={12} /></button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. TOOL PAGE (Screenshot 3: Tool Library, Offsets, Feeds & Speeds) */}
            {activePage === 'tool' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: '14px', marginBottom: '10px' }}>
                  {/* Top Left: Tool Selection Table */}
                  <div>
                    <div style={{ border: '1px solid #cbd5e1', maxHeight: '150px', overflowY: 'auto', background: '#ffffff', marginBottom: '6px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead>
                          <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#475569' }}>
                            <th style={{ width: '22px' }}>#</th>
                            <th style={{ textAlign: 'left', padding: '2px 4px' }}>Tool Name</th>
                            <th style={{ textAlign: 'center', padding: '2px 4px' }}>Dia</th>
                            <th style={{ textAlign: 'center', padding: '2px 4px' }}>Cor. rad</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tools.map((t) => {
                            const isSelected = (formData.tool.id === t.id) || (formData.tool.number === t.number);
                            return (
                              <tr
                                key={t.id || t.number}
                                onClick={() => handleSelectTool(t)}
                                style={{
                                  background: isSelected ? '#0078d7' : 'transparent',
                                  color: isSelected ? '#ffffff' : '#1e293b',
                                  cursor: 'pointer'
                                }}
                              >
                                <td style={{ textAlign: 'center', padding: '2px' }}>{t.number || 501}</td>
                                <td style={{ padding: '2px 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '130px' }}>
                                  {t.name || `${t.diameter}mm Endmill`}
                                </td>
                                <td style={{ textAlign: 'center', padding: '2px 4px' }}>{t.diameter}</td>
                                <td style={{ textAlign: 'center', padding: '2px 4px' }}>{t.cornerRadius || 0}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <button style={MC_BUTTON}>Select library tool...</button>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px' }}>
                        <input type="checkbox" /> Filter Active
                      </label>
                      <button style={MC_BUTTON}>Filter...</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '11px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="checkbox"
                          checked={formData.tool.toolInspectionChange ?? false}
                          onChange={(e) => updateNested('tool', 'toolInspectionChange', e.target.checked)}
                        />
                        Tool inspection / change
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="checkbox"
                          checked={formData.tool.toBatch ?? false}
                          onChange={(e) => updateNested('tool', 'toBatch', e.target.checked)}
                        />
                        To batch
                      </label>
                    </div>
                  </div>

                  {/* Top Right: Tool Geometry & Offsets */}
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '95px 1fr', gap: '5px', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', color: '#475569' }}>Tool diameter:</span>
                      <input
                        type="number"
                        step="0.1"
                        style={CLASSIC_YELLOW}
                        value={formData.tool.diameter}
                        onChange={(e) => handleToolDimensionChange('diameter', parseFloat(e.target.value) || 10)}
                      />

                      <span style={{ fontSize: '11px', color: '#475569' }}>Corner radius:</span>
                      <input
                        type="number"
                        step="0.01"
                        style={CLASSIC_YELLOW}
                        value={formData.tool.cornerRadius}
                        onChange={(e) => handleToolDimensionChange('cornerRadius', parseFloat(e.target.value) || 0)}
                      />

                      <span style={{ fontSize: '11px', color: '#475569' }}>Tool name:</span>
                      <input
                        type="text"
                        style={{ ...CLASSIC_YELLOW, background: '#ffffff' }}
                        value={formData.tool.name}
                        onChange={(e) => updateNested('tool', 'name', e.target.value)}
                      />
                    </div>

                    {/* 4-Grid Tool Offsets */}
                    <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 70px 1fr', gap: '5px', alignItems: 'center', background: '#f8fafc', padding: '5px', border: '1px solid #cbd5e1', borderRadius: '2px' }}>
                      <span style={{ fontSize: '11px', color: '#475569' }}>Tool #:</span>
                      <input
                        type="number"
                        style={CLASSIC_YELLOW}
                        value={formData.tool.number}
                        onChange={(e) => updateNested('tool', 'number', parseInt(e.target.value) || 501)}
                      />
                      <span style={{ fontSize: '11px', color: '#475569' }}>Length offset:</span>
                      <input
                        type="number"
                        style={CLASSIC_YELLOW}
                        value={formData.tool.lengthOffset}
                        onChange={(e) => updateNested('tool', 'lengthOffset', parseInt(e.target.value) || 501)}
                      />
                      <span style={{ fontSize: '11px', color: '#475569' }}>Head #:</span>
                      <input
                        type="number"
                        style={CLASSIC_YELLOW}
                        value={formData.tool.headNumber ?? 0}
                        onChange={(e) => updateNested('tool', 'headNumber', parseInt(e.target.value) || 0)}
                      />
                      <span style={{ fontSize: '11px', color: '#475569' }}>Diameter offset:</span>
                      <input
                        type="number"
                        style={CLASSIC_YELLOW}
                        value={formData.tool.diameterOffset}
                        onChange={(e) => updateNested('tool', 'diameterOffset', parseInt(e.target.value) || 501)}
                      />
                    </div>
                  </div>
                </div>

                {/* Middle Right: Feeds, Speeds, RCTF */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', marginBottom: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '85px 1fr 85px 1fr', gap: '5px', alignItems: 'center' }}>
                    <label style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={formData.tool.rctf ?? false}
                        onChange={(e) => updateNested('tool', 'rctf', e.target.checked)}
                      />
                      RCTF (Radial Chip Thinning)
                    </label>
                    <span style={{ fontSize: '11px', color: '#475569' }}>Direction:</span>
                    <select
                      style={CLASSIC_YELLOW}
                      value={formData.tool.spindleDirection ?? 'CW'}
                      onChange={(e) => updateNested('tool', 'spindleDirection', e.target.value)}
                    >
                      <option value="CW">CW</option>
                      <option value="CCW">CCW</option>
                    </select>

                    <span style={{ fontSize: '11px', color: '#475569' }}>Feed rate:</span>
                    <input
                      type="number"
                      style={CLASSIC_YELLOW}
                      value={formData.tool.feedRate}
                      onChange={(e) => updateNested('tool', 'feedRate', parseFloat(e.target.value) || 0)}
                    />
                    <span style={{ fontSize: '11px', color: '#475569' }}>Spindle speed:</span>
                    <input
                      type="number"
                      style={CLASSIC_YELLOW}
                      value={formData.tool.spindleSpeed}
                      onChange={(e) => updateNested('tool', 'spindleSpeed', parseInt(e.target.value) || 0)}
                    />

                    <span style={{ fontSize: '11px', color: '#475569' }}>FPT:</span>
                    <input
                      type="number"
                      step="0.001"
                      style={CLASSIC_YELLOW}
                      value={formData.tool.fpt ?? 0.0245}
                      onChange={(e) => updateNested('tool', 'fpt', parseFloat(e.target.value) || 0)}
                    />
                    <span style={{ fontSize: '11px', color: '#475569' }}>SFM:</span>
                    <input
                      type="number"
                      style={CLASSIC_YELLOW}
                      value={formData.tool.sfm ?? 800.0}
                      onChange={(e) => updateNested('tool', 'sfm', parseFloat(e.target.value) || 0)}
                    />

                    <span style={{ fontSize: '11px', color: '#475569' }}>Plunge rate:</span>
                    <input
                      type="number"
                      style={CLASSIC_YELLOW}
                      value={formData.tool.plungeRate}
                      onChange={(e) => updateNested('tool', 'plungeRate', parseFloat(e.target.value) || 0)}
                    />
                    <span style={{ fontSize: '11px', color: '#475569' }}>Retract rate:</span>
                    <input
                      type="number"
                      style={CLASSIC_YELLOW}
                      value={formData.tool.retractRate}
                      onChange={(e) => updateNested('tool', 'retractRate', parseFloat(e.target.value) || 0)}
                    />

                    <label style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                      <input
                        type="checkbox"
                        checked={formData.tool.forceToolChange ?? false}
                        onChange={(e) => updateNested('tool', 'forceToolChange', e.target.checked)}
                      />
                      Force tool change
                    </label>
                    <label style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                      <input
                        type="checkbox"
                        checked={formData.tool.rapidRetract ?? true}
                        onChange={(e) => updateNested('tool', 'rapidRetract', e.target.checked)}
                      />
                      Rapid Retract
                    </label>
                  </div>

                  {/* Comment Box */}
                  <div>
                    <div style={{ fontSize: '11px', color: '#475569', marginBottom: '3px' }}>Comment</div>
                    <textarea
                      style={{ width: '100%', height: '100px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '2px', padding: '4px', resize: 'none', boxSizing: 'border-box' }}
                      value={formData.comment || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                      placeholder="Mastercam OptiRough notes..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 5. CUT PARAMETERS PAGE (Screenshot 4: Cut style, Passes, Micro-lift, 3D Cavity Diagram) */}
            {activePage === 'cut_parameters' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
                {/* Left Column: Cut style, Passes, Micro lift */}
                <div>
                  <fieldset style={MC_GROUPBOX}>
                    <legend style={MC_LEGEND}>Cut style</legend>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '5px', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', color: '#475569' }}>Cut method:</span>
                      <select
                        style={CLASSIC_YELLOW}
                        value={formData.cutParameters.cuttingMethod}
                        onChange={(e) => updateNested('cutParameters', 'cuttingMethod', e.target.value)}
                      >
                        <option value="climb">Climb</option>
                        <option value="conventional">Conventional</option>
                        <option value="dual">Dual (Zigzag)</option>
                      </select>

                      <span style={{ fontSize: '11px', color: '#475569' }}>Conventional feed rate:</span>
                      <input
                        type="number"
                        step="0.1"
                        style={formData.cutParameters.cuttingMethod === 'climb' ? DISABLED_GRAY : CLASSIC_YELLOW}
                        disabled={formData.cutParameters.cuttingMethod === 'climb'}
                        value={formData.cutParameters.conventionalFeedRate ?? 59.592}
                        onChange={(e) => updateNested('cutParameters', 'conventionalFeedRate', parseFloat(e.target.value) || 0)}
                      />

                      <span style={{ fontSize: '11px', color: '#475569' }}>Tip compensation:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MastercamTipCompIcon />
                        <select
                          style={{ ...CLASSIC_YELLOW, flex: 1 }}
                          value={formData.cutParameters.tipCompensation || 'tip'}
                          onChange={(e) => updateNested('cutParameters', 'tipCompensation', e.target.value)}
                        >
                          <option value="tip">Tip</option>
                          <option value="center">Center</option>
                        </select>
                      </div>

                      <span style={{ fontSize: '11px', color: '#475569' }}>Optimize stepups:</span>
                      <select
                        style={CLASSIC_YELLOW}
                        value={formData.cutParameters.optimizeStepups || 'by_depth'}
                        onChange={(e) => updateNested('cutParameters', 'optimizeStepups', e.target.value)}
                      >
                        <option value="by_depth">By depth</option>
                        <option value="by_pocket">By pocket</option>
                        <option value="next_closest">Next closest</option>
                      </select>

                      <span style={{ fontSize: '11px', color: '#475569' }}>Optimize stepdowns:</span>
                      <select
                        style={CLASSIC_YELLOW}
                        value={formData.cutParameters.optimizeStepdowns || 'material'}
                        onChange={(e) => updateNested('cutParameters', 'optimizeStepdowns', e.target.value)}
                      >
                        <option value="material">Material</option>
                        <option value="air">Air</option>
                        <option value="none">None</option>
                      </select>
                    </div>
                  </fieldset>

                  {/* Passes Group */}
                  <fieldset style={MC_GROUPBOX}>
                    <legend style={MC_LEGEND}>Passes</legend>
                    <div style={{ display: 'grid', gridTemplateColumns: '110px 55px 12px 55px', gap: '5px', alignItems: 'center', marginBottom: '5px' }}>
                      <span style={{ fontSize: '11px', color: '#475569' }}>Stepover:</span>
                      <input
                        type="number"
                        step="1"
                        style={CLASSIC_YELLOW}
                        value={formData.cutParameters.stepoverPct}
                        onChange={(e) => handleStepoverSync('pct', parseFloat(e.target.value) || 0)}
                      />
                      <span style={{ fontSize: '11px', textAlign: 'center' }}>%</span>
                      <input
                        type="number"
                        step="0.01"
                        style={CLASSIC_YELLOW}
                        value={formData.cutParameters.stepoverMm}
                        onChange={(e) => handleStepoverSync('mm', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '110px 55px 12px 55px', gap: '5px', alignItems: 'center', marginBottom: '5px' }}>
                      <span style={{ fontSize: '11px', color: '#475569' }}>Stepdown:</span>
                      <input
                        type="number"
                        step="1"
                        style={CLASSIC_YELLOW}
                        value={formData.cutParameters.stepdownPct ?? 150.0}
                        onChange={(e) => handleStepdownSync('pct', parseFloat(e.target.value) || 0)}
                      />
                      <span style={{ fontSize: '11px', textAlign: 'center' }}>%</span>
                      <input
                        type="number"
                        step="0.01"
                        style={CLASSIC_YELLOW}
                        value={formData.cutParameters.stepdownMm}
                        onChange={(e) => handleStepdownSync('mm', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '110px 55px 12px 55px', gap: '5px', alignItems: 'center', marginBottom: '5px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                        <input
                          type="checkbox"
                          checked={formData.cutParameters.stepupEnabled ?? true}
                          onChange={(e) => updateNested('cutParameters', 'stepupEnabled', e.target.checked)}
                        />
                        Stepup:
                      </label>
                      <input
                        type="number"
                        step="1"
                        disabled={!formData.cutParameters.stepupEnabled}
                        style={formData.cutParameters.stepupEnabled ? CLASSIC_YELLOW : DISABLED_GRAY}
                        value={formData.cutParameters.stepupPct ?? 10.0}
                        onChange={(e) => handleStepupSync('pct', parseFloat(e.target.value) || 0)}
                      />
                      <span style={{ fontSize: '11px', textAlign: 'center' }}>%</span>
                      <input
                        type="number"
                        step="0.01"
                        disabled={!formData.cutParameters.stepupEnabled}
                        style={formData.cutParameters.stepupEnabled ? CLASSIC_YELLOW : DISABLED_GRAY}
                        value={formData.cutParameters.stepupMm}
                        onChange={(e) => handleStepupSync('mm', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div style={{ marginBottom: '5px', marginLeft: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                        <input
                          type="checkbox"
                          checked={formData.cutParameters.millVerticalWalls ?? true}
                          onChange={(e) => updateNested('cutParameters', 'millVerticalWalls', e.target.checked)}
                        />
                        Mill vertical walls
                      </label>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '110px 55px 12px 55px', gap: '5px', alignItems: 'center' }}>
                      <span style={{ fontSize: '10.5px', color: '#475569' }}>Minimum toolpath radius:</span>
                      <input
                        type="number"
                        step="0.5"
                        style={CLASSIC_YELLOW}
                        value={formData.cutParameters.minToolpathRadiusPct ?? 7.5}
                        onChange={(e) => handleMinRadiusSync('pct', parseFloat(e.target.value) || 0)}
                      />
                      <span style={{ fontSize: '11px', textAlign: 'center' }}>%</span>
                      <input
                        type="number"
                        step="0.005"
                        style={CLASSIC_YELLOW}
                        value={formData.cutParameters.minToolpathRadiusMm ?? 0.075}
                        onChange={(e) => handleMinRadiusSync('mm', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </fieldset>

                  {/* Motion < Gap size, micro lift */}
                  <fieldset style={MC_GROUPBOX}>
                    <legend style={MC_LEGEND}>Motion &lt; Gap size, micro lift</legend>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '5px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#475569' }}>Micro lift distance:</span>
                      <input
                        type="number"
                        step="0.01"
                        style={CLASSIC_YELLOW}
                        value={formData.cutParameters.microLiftDistance ?? 0.25}
                        onChange={(e) => updateNested('cutParameters', 'microLiftDistance', parseFloat(e.target.value) || 0)}
                      />
                      <span style={{ fontSize: '11px', color: '#475569' }}>Back feedrate:</span>
                      <input
                        type="number"
                        style={CLASSIC_YELLOW}
                        value={formData.cutParameters.backFeedrate ?? 2500.0}
                        onChange={(e) => updateNested('cutParameters', 'backFeedrate', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </fieldset>
                </div>

                {/* Right Column: 3D Pocket Cut Diagram & Gap size retract */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                    <MastercamPocket3DSvg />
                  </div>

                  <fieldset style={MC_GROUPBOX}>
                    <legend style={MC_LEGEND}>Motion &gt; Gap size, retract</legend>
                    <select
                      style={{ ...CLASSIC_YELLOW, marginBottom: '6px' }}
                      value={formData.cutParameters.motionGapSizeRetract ?? 'never'}
                      onChange={(e) => updateNested('cutParameters', 'motionGapSizeRetract', e.target.value)}
                    >
                      <option value="never">Never</option>
                      <option value="broken">When stepover exceeds...</option>
                      <option value="always">Always retract</option>
                    </select>

                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '3px' }}>Gap size</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="radio"
                          name="gap_size_mode"
                          checked={formData.cutParameters.gapSizeMode === 'distance'}
                          onChange={() => updateNested('cutParameters', 'gapSizeMode', 'distance')}
                        />
                        <span style={{ fontSize: '11px', minWidth: '60px' }}>Distance</span>
                        <input
                          type="number"
                          step="0.5"
                          style={formData.cutParameters.gapSizeMode === 'distance' ? CLASSIC_YELLOW : DISABLED_GRAY}
                          disabled={formData.cutParameters.gapSizeMode !== 'distance'}
                          value={formData.cutParameters.gapSizeDistance ?? 5.0}
                          onChange={(e) => updateNested('cutParameters', 'gapSizeDistance', parseFloat(e.target.value) || 0)}
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="radio"
                          name="gap_size_mode"
                          checked={formData.cutParameters.gapSizeMode === 'pct_tool_dia'}
                          onChange={() => updateNested('cutParameters', 'gapSizeMode', 'pct_tool_dia')}
                        />
                        <span style={{ fontSize: '11px', minWidth: '60px' }}>% of tool dia</span>
                        <input
                          type="number"
                          step="10"
                          style={formData.cutParameters.gapSizeMode === 'pct_tool_dia' ? CLASSIC_YELLOW : DISABLED_GRAY}
                          disabled={formData.cutParameters.gapSizeMode !== 'pct_tool_dia'}
                          value={formData.cutParameters.gapSizePctToolDia ?? 500.0}
                          onChange={(e) => updateNested('cutParameters', 'gapSizePctToolDia', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  </fieldset>
                </div>
              </div>
            )}

            {/* 6. STEEP / SHALLOW PAGE (Screenshot 5: Z Depths, Detect Limits & 2D Limit Lines Diagram) */}
            {activePage === 'steep_shallow' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '14px', alignItems: 'start' }}>
                <fieldset style={MC_GROUPBOX}>
                  <legend style={MC_LEGEND}>Z depth</legend>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={formData.steepShallow.useZDepths ?? true}
                        onChange={(e) => updateNested('steepShallow', 'useZDepths', e.target.checked)}
                      />
                      Use Z depths
                    </label>
                    <button
                      onClick={handleDetectLimits}
                      style={MC_BUTTON}
                      title="Detect Top and Bottom Z from stock and model boundaries"
                    >
                      Detect Limits
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '105px 1fr', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#475569' }}>Minimum depth:</span>
                    <input
                      type="number"
                      step="0.1"
                      disabled={!formData.steepShallow.useZDepths}
                      style={formData.steepShallow.useZDepths ? CLASSIC_YELLOW : DISABLED_GRAY}
                      value={formData.steepShallow.zTop ?? 0.0}
                      onChange={(e) => updateNested('steepShallow', 'zTop', parseFloat(e.target.value) || 0)}
                    />

                    <span style={{ fontSize: '11px', color: '#475569' }}>Maximum depth:</span>
                    <input
                      type="number"
                      step="0.1"
                      disabled={!formData.steepShallow.useZDepths}
                      style={formData.steepShallow.useZDepths ? CLASSIC_YELLOW : DISABLED_GRAY}
                      value={formData.steepShallow.zBottom ?? -2.250001}
                      onChange={(e) => updateNested('steepShallow', 'zBottom', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </fieldset>

                <div style={{ display: 'flex', justifyContent: 'center', padding: '6px', background: '#ffffff' }}>
                  <MastercamSteepShallowLimitsSvg
                    zTop={formData.steepShallow.zTop ?? 0.0}
                    zBottom={formData.steepShallow.zBottom ?? -2.250001}
                  />
                </div>
              </div>
            )}

            {/* 7. TRANSITIONS PAGE */}
            {activePage === 'transitions' && (
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#0f5a9e', marginBottom: '8px' }}>Cavity Entry Method</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ color: '#475569' }}>Entry Method:</span>
                    <select
                      style={CLASSIC_YELLOW}
                      value={formData.transitions.entryMethod}
                      onChange={(e) => updateNested('transitions', 'entryMethod', e.target.value)}
                    >
                      <option value="helical_ramp">Helical Ramp</option>
                      <option value="profile_ramp">Profile Ramp</option>
                    </select>

                    <span style={{ color: '#475569' }}>Helical Radius (mm):</span>
                    <input
                      type="number"
                      step="0.5"
                      style={CLASSIC_YELLOW}
                      value={formData.transitions.helicalRadius}
                      onChange={(e) => updateNested('transitions', 'helicalRadius', Number(e.target.value))}
                    />

                    <span style={{ color: '#475569' }}>Ramp Angle (deg):</span>
                    <input
                      type="number"
                      step="0.5"
                      style={CLASSIC_YELLOW}
                      value={formData.transitions.rampAngle}
                      onChange={(e) => updateNested('transitions', 'rampAngle', Number(e.target.value))}
                    />

                    <span style={{ color: '#475569' }}>Plunge Clearance (mm):</span>
                    <input
                      type="number"
                      step="0.5"
                      style={CLASSIC_YELLOW}
                      value={formData.transitions.plungeClearance}
                      onChange={(e) => updateNested('transitions', 'plungeClearance', Number(e.target.value))}
                    />
                  </div>
                </div>

                <div style={{ width: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <HelicalRampDiagramSvg />
                </div>
              </div>
            )}

            {/* 8. LINKING PARAMETERS PAGE */}
            {activePage === 'linking_parameters' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#0f5a9e', marginBottom: '8px' }}>Retract & Clearance</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ color: '#475569' }}>Clearance plane (mm):</span>
                    <input
                      type="number"
                      style={CLASSIC_YELLOW}
                      value={formData.linkingParameters.clearancePlane}
                      onChange={(e) => updateNested('linkingParameters', 'clearancePlane', Number(e.target.value))}
                    />

                    <span style={{ color: '#475569' }}>Retract type:</span>
                    <select
                      style={CLASSIC_YELLOW}
                      value={formData.linkingParameters.retractType}
                      onChange={(e) => updateNested('linkingParameters', 'retractType', e.target.value)}
                    >
                      <option value="full_vertical">Full Vertical Retract</option>
                      <option value="minimum_vertical">Minimum Vertical Retract</option>
                      <option value="minimum_distance">Minimum Distance</option>
                    </select>

                    <span style={{ color: '#475569' }}>Part clearance (mm):</span>
                    <input
                      type="number"
                      style={CLASSIC_YELLOW}
                      value={formData.linkingParameters.partClearance}
                      onChange={(e) => updateNested('linkingParameters', 'partClearance', Number(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: 700, color: '#0f5a9e', marginBottom: '8px' }}>Micro Lift Retract</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ color: '#475569' }}>Micro lift retract:</span>
                    <select
                      style={CLASSIC_YELLOW}
                      value={formData.linkingParameters.microLiftRetract}
                      onChange={(e) => updateNested('linkingParameters', 'microLiftRetract', e.target.value)}
                    >
                      <option value="always">Always</option>
                      <option value="output">Output</option>
                      <option value="never">Never</option>
                    </select>

                    <span style={{ color: '#475569' }}>Micro lift distance (mm):</span>
                    <input
                      type="number"
                      step="0.05"
                      style={CLASSIC_YELLOW}
                      value={formData.linkingParameters.microLiftDistance}
                      onChange={(e) => updateNested('linkingParameters', 'microLiftDistance', Number(e.target.value))}
                    />

                    <span style={{ color: '#475569' }}>Back feed rate (mm/min):</span>
                    <input
                      type="number"
                      step="100"
                      style={CLASSIC_YELLOW}
                      value={formData.linkingParameters.backFeedRate}
                      onChange={(e) => updateNested('linkingParameters', 'backFeedRate', Number(e.target.value))}
                    />
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '6px' }}>
                    Elevates tool {formData.linkingParameters.microLiftDistance}mm during backtrack to avoid tool rubbing.
                  </div>
                </div>
              </div>
            )}

            {/* 9. ARC FILTER / TOLERANCE PAGE */}
            {activePage === 'arc_filter_tolerance' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#0f5a9e', marginBottom: '8px' }}>Filter & Smoothing</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px', alignItems: 'center' }}>
                    <span style={{ color: '#475569' }}>Total tolerance (mm):</span>
                    <input
                      type="number"
                      step="0.005"
                      style={CLASSIC_YELLOW}
                      value={formData.arcFilterTolerance.totalTolerance}
                      onChange={(e) => updateNested('arcFilterTolerance', 'totalTolerance', Number(e.target.value))}
                    />

                    <span style={{ color: '#475569' }}>Filter ratio:</span>
                    <input
                      type="number"
                      step="0.1"
                      style={CLASSIC_YELLOW}
                      value={formData.arcFilterTolerance.filterRatio}
                      onChange={(e) => updateNested('arcFilterTolerance', 'filterRatio', Number(e.target.value))}
                    />
                  </div>
                  <div style={{ marginTop: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="checkbox"
                        checked={formData.arcFilterTolerance.highSpeedCornerRounding}
                        onChange={(e) => updateNested('arcFilterTolerance', 'highSpeedCornerRounding', e.target.checked)}
                      />
                      <span>High-Speed Corner Rounding (Constant Engagement)</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 10. STOCK (REST MILLING) PAGE */}
            {activePage === 'stock' && (
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#0f5a9e', marginBottom: '10px' }}>
                  <input
                    type="checkbox"
                    checked={formData.stock.restMaterial}
                    onChange={(e) => updateNested('stock', 'restMaterial', e.target.checked)}
                  />
                  <span>Rest material (machine remaining stock left by previous roughing tools)</span>
                </label>
                <div style={{ paddingLeft: '20px', display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px', alignItems: 'center' }}>
                  <span style={{ color: '#475569' }}>Roughing Tool Dia (mm):</span>
                  <input
                    type="number"
                    disabled={!formData.stock.restMaterial}
                    style={formData.stock.restMaterial ? CLASSIC_YELLOW : DISABLED_GRAY}
                    value={formData.stock.roughingToolDiameter}
                    onChange={(e) => updateNested('stock', 'roughingToolDiameter', Number(e.target.value))}
                  />
                </div>
              </div>
            )}

            {/* 11. HOLDER / PLANES / COOLANT PAGES */}
            {activePage === 'holder' && (
              <div>
                <div style={{ fontWeight: 700, color: '#0f5a9e', marginBottom: '8px' }}>Tool Holder Assembly</div>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', alignItems: 'center' }}>
                  <span style={{ color: '#475569' }}>Holder Type:</span>
                  <select
                    style={CLASSIC_YELLOW}
                    value={formData.holder.type}
                    onChange={(e) => updateNested('holder', 'type', e.target.value)}
                  >
                    <option value="BT30">BT30 / BBT30 Milling Chuck</option>
                    <option value="BT40">BT40 Shrink Fit Chuck</option>
                    <option value="CAT40">CAT40 Collet Chuck</option>
                    <option value="HSK63A">HSK-A63 High Speed Chuck</option>
                  </select>

                  <span style={{ color: '#475569' }}>Gauge Length (mm):</span>
                  <input
                    type="number"
                    style={CLASSIC_YELLOW}
                    value={formData.holder.projection}
                    onChange={(e) => updateNested('holder', 'projection', Number(e.target.value))}
                  />
                </div>
              </div>
            )}

            {activePage === 'planes' && (
              <div>
                <div style={{ fontWeight: 700, color: '#0f5a9e', marginBottom: '8px' }}>Coordinate System & Planes</div>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', alignItems: 'center' }}>
                  <span style={{ color: '#475569' }}>Work Coordinate:</span>
                  <select
                    style={CLASSIC_YELLOW}
                    value={formData.planes.wcs}
                    onChange={(e) => updateNested('planes', 'wcs', e.target.value)}
                  >
                    <option value="G54">G54 (Fixture Datum 1)</option>
                    <option value="G55">G55 (Fixture Datum 2)</option>
                    <option value="G56">G56 (Fixture Datum 3)</option>
                  </select>

                  <span style={{ color: '#475569' }}>Tool Plane:</span>
                  <input type="text" style={DISABLED_GRAY} disabled value={formData.planes.toolPlane} />
                </div>
              </div>
            )}

            {activePage === 'coolant' && (
              <div>
                <div style={{ fontWeight: 700, color: '#0f5a9e', marginBottom: '8px' }}>Coolant Delivery</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="checkbox"
                      checked={formData.coolant.flood}
                      onChange={(e) => updateNested('coolant', 'flood', e.target.checked)}
                    />
                    <span>Flood Coolant (M08)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="checkbox"
                      checked={formData.coolant.mist}
                      onChange={(e) => updateNested('coolant', 'mist', e.target.checked)}
                    />
                    <span>Air Blast / Mist (M07)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="checkbox"
                      checked={formData.coolant.throughSpindle}
                      onChange={(e) => updateNested('coolant', 'throughSpindle', e.target.checked)}
                    />
                    <span>High-Pressure Through-Spindle Coolant (TSC M88)</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

                {/* ================= Mastercam Action Bar Footer ================= */}
        <div
          style={{
            height: '42px',
            background: '#f1f5f9',
            borderTop: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 14px',
            flexShrink: 0
          }}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#475569' }}>
            <input
              type="checkbox"
              checked={formData.generateToolpath ?? true}
              onChange={(e) => setFormData((prev) => ({ ...prev, generateToolpath: e.target.checked }))}
            />
            <span>Generate toolpath</span>
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* OK (Mastercam Green Check Square) */}
            <button
              data-testid="optirough-btn-ok"
              onClick={handleConfirm}
              style={{
                ...MC_BUTTON,
                height: '26px',
                padding: '0 12px',
                borderColor: '#16a34a',
                background: 'linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%)',
                color: '#15803d',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="OK - Accept parameters and regenerate"
            >
              <Check size={15} strokeWidth={2.5} color="#16a34a" />
              OK
            </button>

            {/* Cancel (Mastercam Red Cross Square) */}
            <button
              data-testid="optirough-btn-cancel"
              onClick={onClose}
              style={{
                ...MC_BUTTON,
                height: '26px',
                padding: '0 12px',
                borderColor: '#dc2626',
                background: 'linear-gradient(180deg, #fef2f2 0%, #fee2e2 100%)',
                color: '#b91c1c',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Cancel"
            >
              <X size={15} strokeWidth={2.5} color="#dc2626" />
              Cancel
            </button>

            {/* Apply (Mastercam Blue Plus Square) */}
            <button
              onClick={() => {
                const finalOp = {
                  ...formData,
                  id: operation?.id || Date.now(),
                  name: formData.name || '3D High Speed Dynamic OptiRough',
                  strategyKey: 'surface_rough_optirough',
                  badgeClass: 'adaptive',
                  opType: 'adaptive',
                  toolId: formData.tool.id,
                  physics
                };
                onSaveOperation?.(finalOp);
                onNotify?.('Applied 3D Dynamic OptiRough parameters.', 'success');
              }}
              style={{
                ...MC_BUTTON,
                height: '26px',
                padding: '0 12px',
                borderColor: '#0284c7',
                background: 'linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 100%)',
                color: '#0369a1',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Apply changes without closing dialog"
            >
              <Plus size={15} strokeWidth={2.5} color="#0284c7" />
              Apply
            </button>

            {/* Help */}
            <button
              onClick={() => onNotify?.('Mastercam 3D Dynamic OptiRough: High-Speed constant engagement roughing with upward stepup passes.', 'info')}
              style={{
                ...MC_BUTTON,
                height: '26px',
                width: '26px',
                padding: 0
              }}
              title="Help"
            >
              <HelpCircle size={15} color="#64748b" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
