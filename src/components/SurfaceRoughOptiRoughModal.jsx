import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Check, HelpCircle, Plus, ChevronRight, Save, FolderOpen,
  Calculator, Layers, Box, Cpu, Flame, Gauge, Zap, AlertCircle
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
  fontSize: '11.5px',
  color: '#0f172a',
  padding: '2px 5px',
  height: '22px',
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
  fontSize: '11.5px',
  color: '#64748b',
  padding: '2px 5px',
  height: '22px',
  width: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
  outline: 'none',
  fontFamily: "'Segoe UI', Tahoma, sans-serif"
};

const MC_BUTTON = {
  height: '23px',
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

/**
 * Custom SVG Schematics illustrating Mastercam OptiRough Dynamics
 */
function OptiRoughStepupDiagramSvg({ stepdown = 15, stepup = 1 }) {
  return (
    <svg width="220" height="130" viewBox="0 0 220 130" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '3px' }}>
      {/* Mold Cavity Sidewall & Floor */}
      <path d="M 15 15 L 75 15 L 115 105 L 205 105" fill="none" stroke="#64748b" strokeWidth="2.5" />
      <polygon points="15,15 75,15 115,105 205,105 205,120 15,120" fill="#e2e8f0" opacity="0.6" />

      {/* Deep Stepdown Major Cut */}
      <line x1="60" y1="65" x2="195" y2="65" stroke="#0284c7" strokeWidth="2" strokeDasharray="3,2" />
      <text x="120" y="60" fill="#0284c7" fontSize="9.5" fontWeight="bold">Stepdown 1: {stepdown}mm</text>

      <line x1="105" y1="105" x2="195" y2="105" stroke="#0284c7" strokeWidth="2" />
      <text x="120" y="100" fill="#0284c7" fontSize="9.5" fontWeight="bold">Stepdown 2 (Floor)</text>

      {/* Upward Stepup Rest Roughing Passes */}
      <line x1="100" y1="95" x2="140" y2="95" stroke="#ea580c" strokeWidth="1.5" />
      <polygon points="144,95 139,92.5 139,97.5" fill="#ea580c" />

      <line x1="93" y1="85" x2="135" y2="85" stroke="#ea580c" strokeWidth="1.5" />
      <polygon points="139,85 134,82.5 134,87.5" fill="#ea580c" />

      <line x1="86" y1="75" x2="130" y2="75" stroke="#ea580c" strokeWidth="1.5" />
      <polygon points="134,75 129,72.5 129,77.5" fill="#ea580c" />

      <text x="145" y="88" fill="#ea580c" fontSize="9" fontWeight="bold">Stepup: {stepup}mm</text>
      <text x="145" y="99" fill="#ea580c" fontSize="8">(Up-Milling)</text>

      {/* Wall Stock Offset Line */}
      <path d="M 72 15 L 111 103" fill="none" stroke="#16a34a" strokeWidth="1.2" strokeDasharray="2,2" />
      <text x="25" y="45" fill="#16a34a" fontSize="8.5" fontWeight="bold">Stock: 1.0mm</text>
    </svg>
  );
}

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
 * Authentic Mastercam 2025 3D High Speed Toolpaths - Dynamic OptiRough Modal
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

  // Mastercam Tree Navigation Pages
  const TREE_PAGES = [
    { id: 'toolpath_type', label: 'Toolpath Type' },
    { id: 'model_geometry', label: 'Model Geometry' },
    { id: 'toolpath_control', label: 'Toolpath Control' },
    { id: 'tool', label: 'Tool' },
    { id: 'holder', label: 'Holder' },
    { id: 'stock', label: 'Stock' },
    { id: 'cut_parameters', label: 'Cut Parameters' },
    { id: 'steep_shallow', label: 'Steep / Shallow' },
    { id: 'transitions', label: 'Transitions' },
    { id: 'linking_parameters', label: 'Linking Parameters' },
    { id: 'arc_filter_tolerance', label: 'Arc Filter / Tolerance' },
    { id: 'planes', label: 'Planes' },
    { id: 'coolant', label: 'Coolant' }
  ];

  const [activePage, setActivePage] = useState('cut_parameters');
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

  // Tool change handler
  const handleSelectTool = (selectedTool) => {
    if (!selectedTool) return;
    const d = Number(selectedTool.diameter || 10);
    const cr = Number(selectedTool.cornerRadius || 0);
    const rpm = Math.min(caps.maxRpm, Number(selectedTool.spindleSpeed || selectedTool.rpm || 5395));
    const feed = Number(selectedTool.feedRate || 2870);

    setFormData((prev) => ({
      ...prev,
      tool: {
        ...prev.tool,
        id: selectedTool.id,
        number: selectedTool.number || 1,
        name: selectedTool.name || 'Endmill',
        diameter: d,
        cornerRadius: cr,
        lengthOffset: selectedTool.lengthOffset ?? selectedTool.number ?? 1,
        diameterOffset: selectedTool.diameterOffset ?? selectedTool.number ?? 1,
        spindleSpeed: rpm,
        feedRate: feed,
        cs: Math.round((Math.PI * d * rpm) / 1000),
        fpt: Number((feed / (rpm * Math.max(1, selectedTool.flutes || 4))).toFixed(4))
      },
      cutParameters: {
        ...prev.cutParameters,
        stepoverMm: Number(((d * prev.cutParameters.stepoverPct) / 100).toFixed(2)),
        stepdownMm: Number((d * (prev.cutParameters.stepdownPct / 100)).toFixed(1)),
        stepupMm: Number((d * (prev.cutParameters.stepupPct / 100)).toFixed(1))
      }
    }));
  };

  // Preset application handler
  const handleApplyPreset = (preset) => {
    const mat = OPTIROUGH_MATERIALS[preset.materialKey];
    const toolDiam = Number(formData.tool.diameter || 10);
    const newStepdown = Number((toolDiam * preset.stepdownFactor).toFixed(1));
    const newStepoverMm = Number(((toolDiam * preset.stepoverPct) / 100).toFixed(2));

    setFormData((prev) => ({
      ...prev,
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

  // Submit / Save
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
          {/* Mastercam Red Mill Icon */}
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
          <span>3D High Speed Toolpaths - Dynamic OptiRough</span>
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
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>Quick Presets:</span>
          {OPTIROUGH_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleApplyPreset(p)}
              style={{
                ...MC_BUTTON,
                height: '21px',
                fontSize: '10.5px',
                background: formData.selectedMaterialKey === p.materialKey ? '#bae6fd' : '#ffffff',
                borderColor: formData.selectedMaterialKey === p.materialKey ? '#0284c7' : '#cbd5e1',
                color: formData.selectedMaterialKey === p.materialKey ? '#0369a1' : '#1e293b'
              }}
              title={p.desc}
            >
              {p.label}
            </button>
          ))}
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
            {/* Tree Pages List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
              {TREE_PAGES.map((page) => {
                const isSelected = activePage === page.id;
                return (
                  <div
                    key={page.id}
                    onClick={() => setActivePage(page.id)}
                    style={{
                      padding: '5px 10px',
                      fontSize: '11.5px',
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? '#0f5a9e' : '#334155',
                      background: isSelected ? '#e0f2fe' : 'transparent',
                      borderLeft: isSelected ? '3px solid #0f5a9e' : '3px solid transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <ChevronRight size={12} color={isSelected ? '#0f5a9e' : '#94a3b8'} />
                    <span>{page.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Quick View Settings Box (Mastercam Authentic Bottom Left) */}
            <div
              style={{
                borderTop: '1px solid #cbd5e1',
                background: '#ffffff',
                padding: '6px 8px',
                fontSize: '10.5px',
                color: '#334155'
              }}
            >
              <div style={{ fontWeight: 700, color: '#0f5a9e', marginBottom: '3px' }}>Quick View Settings</div>
              <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: '2px', lineHeight: '1.3' }}>
                <span style={{ color: '#64748b' }}>Tool:</span>
                <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {formData.tool.name}
                </span>
                <span style={{ color: '#64748b' }}>Diameter:</span>
                <span>{formData.tool.diameter} mm</span>
                <span style={{ color: '#64748b' }}>Corner Rad:</span>
                <span>{formData.tool.cornerRadius} mm</span>
                <span style={{ color: '#64748b' }}>Feed Rate:</span>
                <span>{formData.tool.feedRate} mm/min</span>
                <span style={{ color: '#64748b' }}>Spindle:</span>
                <span>{formData.tool.spindleSpeed} RPM</span>
                <span style={{ color: '#64748b' }}>Coolant:</span>
                <span style={{ textTransform: 'capitalize' }}>{formData.tool.coolant}</span>
                <span style={{ color: '#64748b' }}>WCS / Plane:</span>
                <span>{formData.planes.wcs} / {formData.planes.toolPlane}</span>
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
                      border: '2px solid #0284c7',
                      background: '#f0f9ff',
                      borderRadius: '4px',
                      padding: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <input type="radio" checked readOnly />
                      <span style={{ fontWeight: 700, color: '#0369a1' }}>Dynamic OptiRough</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.4' }}>
                      Mastercam's optimum roughing strategy. Removes large stock with deep axial stepdowns, constant tool engagement, and upward step-up passes.
                    </div>
                  </div>
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px', opacity: 0.6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <input type="radio" disabled />
                      <span style={{ fontWeight: 600 }}>Area Rough</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      Conventional pocket-style 3D roughing with constant Z waterline layers.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. MODEL GEOMETRY PAGE */}
            {activePage === 'model_geometry' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, color: '#0f5a9e' }}>Machining Geometry (Drive Surfaces)</span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                    <input
                      type="checkbox"
                      checked={formData.modelGeometry.sameWallAndFloorStock}
                      onChange={(e) => updateNested('modelGeometry', 'sameWallAndFloorStock', e.target.checked)}
                    />
                    Same wall and floor stock
                  </label>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px', fontSize: '11.5px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                      <th style={{ textAlign: 'left', padding: '4px' }}>Name</th>
                      <th style={{ textAlign: 'center', padding: '4px' }}>Entities</th>
                      <th style={{ textAlign: 'center', padding: '4px' }}>Wall Stock (mm)</th>
                      <th style={{ textAlign: 'center', padding: '4px' }}>Floor Stock (mm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '10px', height: '10px', background: '#22c55e', display: 'inline-block' }} />
                        Machining Drive
                      </td>
                      <td style={{ textAlign: 'center', padding: '4px' }}>{formData.modelGeometry.machiningEntitiesCount}</td>
                      <td style={{ textAlign: 'center', padding: '4px', width: '90px' }}>
                        <input
                          type="number"
                          step="0.1"
                          style={CLASSIC_YELLOW}
                          value={formData.modelGeometry.wallStock}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            updateNested('modelGeometry', 'wallStock', val);
                            if (formData.modelGeometry.sameWallAndFloorStock) {
                              updateNested('modelGeometry', 'floorStock', val);
                            }
                          }}
                        />
                      </td>
                      <td style={{ textAlign: 'center', padding: '4px', width: '90px' }}>
                        <input
                          type="number"
                          step="0.1"
                          style={formData.modelGeometry.sameWallAndFloorStock ? DISABLED_GRAY : CLASSIC_YELLOW}
                          disabled={formData.modelGeometry.sameWallAndFloorStock}
                          value={formData.modelGeometry.floorStock}
                          onChange={(e) => updateNested('modelGeometry', 'floorStock', Number(e.target.value))}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>

                <span style={{ fontWeight: 700, color: '#0f5a9e' }}>Avoidance Geometry (Check Surfaces)</span>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '6px', fontSize: '11.5px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                      <th style={{ textAlign: 'left', padding: '4px' }}>Name</th>
                      <th style={{ textAlign: 'center', padding: '4px' }}>Entities</th>
                      <th style={{ textAlign: 'center', padding: '4px' }}>Wall Stock (mm)</th>
                      <th style={{ textAlign: 'center', padding: '4px' }}>Floor Stock (mm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '10px', height: '10px', background: '#ef4444', display: 'inline-block' }} />
                        Avoidance Clamps
                      </td>
                      <td style={{ textAlign: 'center', padding: '4px' }}>{formData.modelGeometry.avoidanceEntitiesCount}</td>
                      <td style={{ textAlign: 'center', padding: '4px', width: '90px' }}>
                        <input
                          type="number"
                          step="0.1"
                          style={CLASSIC_YELLOW}
                          value={formData.modelGeometry.avoidanceWallStock}
                          onChange={(e) => updateNested('modelGeometry', 'avoidanceWallStock', Number(e.target.value))}
                        />
                      </td>
                      <td style={{ textAlign: 'center', padding: '4px', width: '90px' }}>
                        <input
                          type="number"
                          step="0.1"
                          style={CLASSIC_YELLOW}
                          value={formData.modelGeometry.avoidanceFloorStock}
                          onChange={(e) => updateNested('modelGeometry', 'avoidanceFloorStock', Number(e.target.value))}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* 3. TOOLPATH CONTROL PAGE */}
            {activePage === 'toolpath_control' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#0f5a9e', marginBottom: '8px' }}>Containment Strategy</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="radio"
                        name="strategy"
                        checked={formData.toolpathControl.strategy === 'stay_inside'}
                        onChange={() => updateNested('toolpathControl', 'strategy', 'stay_inside')}
                      />
                      <span>Stay inside (Pocket / Enclosed Cavity)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="radio"
                        name="strategy"
                        checked={formData.toolpathControl.strategy === 'from_outside'}
                        onChange={() => updateNested('toolpathControl', 'strategy', 'from_outside')}
                      />
                      <span>From outside (Core / Boss feature)</span>
                    </label>
                  </div>

                  <div style={{ fontWeight: 700, color: '#0f5a9e', marginBottom: '8px' }}>Compensate To</div>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                    {['inside', 'center', 'outside'].map((c) => (
                      <label key={c} style={{ display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'capitalize' }}>
                        <input
                          type="radio"
                          name="compensateTo"
                          checked={formData.toolpathControl.compensateTo === c}
                          onChange={() => updateNested('toolpathControl', 'compensateTo', c)}
                        />
                        <span>{c}</span>
                      </label>
                    ))}
                  </div>

                  <div style={{ fontWeight: 700, color: '#0f5a9e', marginBottom: '8px' }}>Automatic Boundary</div>
                  <select
                    style={CLASSIC_YELLOW}
                    value={formData.toolpathControl.automaticBoundary}
                    onChange={(e) => updateNested('toolpathControl', 'automaticBoundary', e.target.value)}
                  >
                    <option value="none">None (Use Model Drive Surfaces)</option>
                    <option value="silhouette">Silhouette Boundary</option>
                    <option value="stock">Stock Model Boundary</option>
                  </select>
                </div>

                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px', background: '#f8fafc' }}>
                  <div style={{ fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Containment Information</div>
                  <div style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.4' }}>
                    OptiRough restricts high-speed trochoidal loops within the selected containment boundaries, applying safe offset margins based on cutter radius and stock allowance.
                  </div>
                </div>
              </div>
            )}

            {/* 4. TOOL PAGE */}
            {activePage === 'tool' && (
              <div>
                <div style={{ fontWeight: 700, color: '#0f5a9e', marginBottom: '6px' }}>Tool Library & Selection</div>
                <div style={{ maxHeight: '130px', overflowY: 'auto', border: '1px solid #cbd5e1', marginBottom: '12px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                        <th style={{ padding: '3px 6px', textAlign: 'center' }}>#</th>
                        <th style={{ padding: '3px 6px', textAlign: 'left' }}>Tool Name</th>
                        <th style={{ padding: '3px 6px', textAlign: 'center' }}>Dia</th>
                        <th style={{ padding: '3px 6px', textAlign: 'center' }}>CR</th>
                        <th style={{ padding: '3px 6px', textAlign: 'center' }}>Flutes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tools.map((t) => {
                        const isCur = t.id === formData.tool.id;
                        return (
                          <tr
                            key={t.id}
                            onClick={() => handleSelectTool(t)}
                            style={{
                              background: isCur ? '#bae6fd' : '#ffffff',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f1f5f9'
                            }}
                          >
                            <td style={{ padding: '3px 6px', textAlign: 'center', fontWeight: isCur ? 700 : 400 }}>{t.number || t.id}</td>
                            <td style={{ padding: '3px 6px', fontWeight: isCur ? 700 : 400 }}>{t.name}</td>
                            <td style={{ padding: '3px 6px', textAlign: 'center' }}>{t.diameter}</td>
                            <td style={{ padding: '3px 6px', textAlign: 'center' }}>{t.cornerRadius || 0}</td>
                            <td style={{ padding: '3px 6px', textAlign: 'center' }}>{t.flutes || 4}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '11.5px' }}>
                  <div>
                    <label style={{ display: 'block', color: '#475569', marginBottom: '2px' }}>Feed rate (mm/min)</label>
                    <input
                      type="number"
                      style={CLASSIC_YELLOW}
                      value={formData.tool.feedRate}
                      onChange={(e) => updateNested('tool', 'feedRate', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#475569', marginBottom: '2px' }}>Spindle speed (RPM)</label>
                    <input
                      type="number"
                      style={CLASSIC_YELLOW}
                      value={formData.tool.spindleSpeed}
                      onChange={(e) => updateNested('tool', 'spindleSpeed', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#475569', marginBottom: '2px' }}>Plunge rate (mm/min)</label>
                    <input
                      type="number"
                      style={CLASSIC_YELLOW}
                      value={formData.tool.plungeRate}
                      onChange={(e) => updateNested('tool', 'plungeRate', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#475569', marginBottom: '2px' }}>Surface speed CS (m/min)</label>
                    <input type="number" style={DISABLED_GRAY} disabled value={formData.tool.cs} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#475569', marginBottom: '2px' }}>Feed / Tooth FPT (mm)</label>
                    <input type="number" style={DISABLED_GRAY} disabled value={formData.tool.fpt} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#475569', marginBottom: '2px' }}>Coolant</label>
                    <select
                      style={CLASSIC_YELLOW}
                      value={formData.tool.coolant}
                      onChange={(e) => updateNested('tool', 'coolant', e.target.value)}
                    >
                      <option value="flood">Flood</option>
                      <option value="mist">Mist</option>
                      <option value="thru">Through Spindle</option>
                      <option value="off">Off</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 5. CUT PARAMETERS PAGE (The Core of OptiRough!) */}
            {activePage === 'cut_parameters' && (
              <div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  {/* Left Parameter Column */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ color: '#475569' }}>Cutting method:</span>
                      <select
                        style={CLASSIC_YELLOW}
                        value={formData.cutParameters.cuttingMethod}
                        onChange={(e) => updateNested('cutParameters', 'cuttingMethod', e.target.value)}
                      >
                        <option value="climb">Climb</option>
                        <option value="conventional">Conventional</option>
                      </select>

                      <span style={{ color: '#475569' }}>Optimize stepups:</span>
                      <select
                        style={CLASSIC_YELLOW}
                        value={formData.cutParameters.optimizeStepups}
                        onChange={(e) => updateNested('cutParameters', 'optimizeStepups', e.target.value)}
                      >
                        <option value="by_depth">By depth</option>
                        <option value="next_closest">Next closest</option>
                        <option value="by_pocket">By pocket</option>
                      </select>

                      <span style={{ color: '#475569' }}>Optimize stepdowns:</span>
                      <select
                        style={CLASSIC_YELLOW}
                        value={formData.cutParameters.optimizeStepdowns}
                        onChange={(e) => updateNested('cutParameters', 'optimizeStepdowns', e.target.value)}
                      >
                        <option value="material">Material</option>
                        <option value="air">Air</option>
                        <option value="none">None</option>
                      </select>
                    </div>

                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginTop: '8px' }}>
                      <div style={{ fontWeight: 700, color: '#0f5a9e', marginBottom: '6px' }}>Passes & Depths</div>
                      
                      {/* Stepover */}
                      <div style={{ display: 'grid', gridTemplateColumns: '120px 70px 30px 80px', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ color: '#475569' }}>Stepover:</span>
                        <input
                          type="number"
                          style={CLASSIC_YELLOW}
                          value={formData.cutParameters.stepoverPct}
                          onChange={(e) => {
                            const pct = Number(e.target.value);
                            const mm = Number(((formData.tool.diameter * pct) / 100).toFixed(2));
                            updateNested('cutParameters', 'stepoverPct', pct);
                            updateNested('cutParameters', 'stepoverMm', mm);
                          }}
                        />
                        <span style={{ fontSize: '11px', color: '#64748b' }}>%</span>
                        <input
                          type="number"
                          style={CLASSIC_YELLOW}
                          value={formData.cutParameters.stepoverMm}
                          onChange={(e) => {
                            const mm = Number(e.target.value);
                            const pct = Number(((mm / formData.tool.diameter) * 100).toFixed(1));
                            updateNested('cutParameters', 'stepoverMm', mm);
                            updateNested('cutParameters', 'stepoverPct', pct);
                          }}
                        />
                      </div>

                      {/* Stepdown */}
                      <div style={{ display: 'grid', gridTemplateColumns: '120px 70px 30px 80px', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ color: '#475569', fontWeight: 600 }}>Stepdown:</span>
                        <input
                          type="number"
                          style={CLASSIC_YELLOW}
                          value={formData.cutParameters.stepdownPct}
                          onChange={(e) => {
                            const pct = Number(e.target.value);
                            const mm = Number(((formData.tool.diameter * pct) / 100).toFixed(1));
                            updateNested('cutParameters', 'stepdownPct', pct);
                            updateNested('cutParameters', 'stepdownMm', mm);
                          }}
                        />
                        <span style={{ fontSize: '11px', color: '#64748b' }}>%</span>
                        <input
                          type="number"
                          style={CLASSIC_YELLOW}
                          value={formData.cutParameters.stepdownMm}
                          onChange={(e) => {
                            const mm = Number(e.target.value);
                            const pct = Number(((mm / formData.tool.diameter) * 100).toFixed(1));
                            updateNested('cutParameters', 'stepdownMm', mm);
                            updateNested('cutParameters', 'stepdownPct', pct);
                          }}
                        />
                      </div>

                      {/* Stepup (Up-Milling Rest Steps) */}
                      <div style={{ display: 'grid', gridTemplateColumns: '120px 70px 30px 80px', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={formData.cutParameters.stepupEnabled}
                            onChange={(e) => updateNested('cutParameters', 'stepupEnabled', e.target.checked)}
                          />
                          <span style={{ color: '#ea580c', fontWeight: 700 }}>Stepup:</span>
                        </label>
                        <input
                          type="number"
                          disabled={!formData.cutParameters.stepupEnabled}
                          style={formData.cutParameters.stepupEnabled ? CLASSIC_YELLOW : DISABLED_GRAY}
                          value={formData.cutParameters.stepupPct}
                          onChange={(e) => {
                            const pct = Number(e.target.value);
                            const mm = Number(((formData.tool.diameter * pct) / 100).toFixed(1));
                            updateNested('cutParameters', 'stepupPct', pct);
                            updateNested('cutParameters', 'stepupMm', mm);
                          }}
                        />
                        <span style={{ fontSize: '11px', color: '#64748b' }}>%</span>
                        <input
                          type="number"
                          disabled={!formData.cutParameters.stepupEnabled}
                          style={formData.cutParameters.stepupEnabled ? CLASSIC_YELLOW : DISABLED_GRAY}
                          value={formData.cutParameters.stepupMm}
                          onChange={(e) => {
                            const mm = Number(e.target.value);
                            const pct = Number(((mm / formData.tool.diameter) * 100).toFixed(1));
                            updateNested('cutParameters', 'stepupMm', mm);
                            updateNested('cutParameters', 'stepupPct', pct);
                          }}
                        />
                      </div>

                      <div style={{ marginTop: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px' }}>
                          <input
                            type="checkbox"
                            checked={formData.cutParameters.millVerticalWalls}
                            onChange={(e) => updateNested('cutParameters', 'millVerticalWalls', e.target.checked)}
                          />
                          <span>Mill vertical walls (generate waterline passes on steep surfaces)</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Right Diagram Column */}
                  <div style={{ width: '230px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <OptiRoughStepupDiagramSvg
                      stepdown={formData.cutParameters.stepdownMm}
                      stepup={formData.cutParameters.stepupMm}
                    />
                    <div style={{ fontSize: '10.5px', color: '#64748b', textAlign: 'center', lineHeight: '1.3' }}>
                      <b>Step-up (Up-Milling):</b> Eliminates large steps along mold walls by machining upward from deep floor.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. STEEP / SHALLOW PAGE */}
            {activePage === 'steep_shallow' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#0f5a9e', marginBottom: '8px' }}>Z Cut Depths Limits</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ color: '#475569' }}>Z Top (mm):</span>
                    <input
                      type="number"
                      step="1"
                      style={CLASSIC_YELLOW}
                      value={formData.steepShallow.zTop}
                      onChange={(e) => updateNested('steepShallow', 'zTop', Number(e.target.value))}
                    />

                    <span style={{ color: '#475569' }}>Z Bottom (mm):</span>
                    <input
                      type="number"
                      step="1"
                      style={CLASSIC_YELLOW}
                      value={formData.steepShallow.zBottom}
                      onChange={(e) => updateNested('steepShallow', 'zBottom', Number(e.target.value))}
                    />
                  </div>
                  <button
                    onClick={() => {
                      updateNested('steepShallow', 'zTop', 0.0);
                      updateNested('steepShallow', 'zBottom', -25.0);
                      onNotify?.('Detected stock boundaries (Z Top: 0.0mm, Z Bottom: -25.0mm)', 'info');
                    }}
                    style={{ ...MC_BUTTON, marginTop: '8px' }}
                  >
                    Detect Stock Limits
                  </button>
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
              checked={formData.generateToolpath}
              onChange={(e) => setFormData((prev) => ({ ...prev, generateToolpath: e.target.checked }))}
            />
            <span>Generate toolpath</span>
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* OK (Green Checkmark) */}
            <button
              data-testid="optirough-btn-ok"
              onClick={handleConfirm}
              style={{
                ...MC_BUTTON,
                height: '27px',
                padding: '0 12px',
                borderColor: '#16a34a',
                color: '#15803d',
                fontWeight: 700
              }}
              title="OK — Save Parameters and Generate 3D Dynamic OptiRough Toolpath"
            >
              <Check size={16} color="#16a34a" style={{ marginRight: '4px' }} />
              OK
            </button>

            {/* Cancel (Red X) */}
            <button
              data-testid="optirough-btn-cancel"
              onClick={onClose}
              style={{
                ...MC_BUTTON,
                height: '27px',
                padding: '0 12px',
                borderColor: '#dc2626',
                color: '#b91c1c'
              }}
              title="Cancel"
            >
              <X size={15} color="#dc2626" style={{ marginRight: '4px' }} />
              Cancel
            </button>

            {/* Apply (Blue Plus) */}
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
                height: '27px',
                padding: '0 12px',
                borderColor: '#0284c7',
                color: '#0369a1'
              }}
              title="Apply changes without closing dialog"
            >
              <Plus size={15} color="#0284c7" style={{ marginRight: '4px' }} />
              Apply
            </button>

            {/* Help */}
            <button
              onClick={() => onNotify?.('Mastercam 3D Dynamic OptiRough Help: Constant engagement roughing with upward stepup passes.', 'info')}
              style={{
                ...MC_BUTTON,
                height: '27px',
                width: '27px',
                padding: 0
              }}
              title="Help on Dynamic OptiRough"
            >
              <HelpCircle size={15} color="#2563eb" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
