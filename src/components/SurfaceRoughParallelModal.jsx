import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Check, HelpCircle, Plus, ChevronRight, Save, FolderOpen,
  Calculator, Layers, Box, Cpu, Flame, Gauge, Zap, AlertCircle,
  Eye, Crosshair, Ban, MousePointer
} from 'lucide-react';
import {
  PARALLEL_ROUGH_MATERIALS,
  PARALLEL_ROUGH_PRESETS,
  resolveParallelRoughMachineCapabilities,
  calculateParallelRoughPhysics,
  createDefaultParallelRoughState,
  resolveDefaultRoughingTool
} from '../config/parallelRoughSchema.js';

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
 * Visual SVG diagram representing Parallel Raster Passes at the specified angle.
 */
function MastercamParallelDiagram({ angle = 0, crossHatch = false, cuttingMethod = 'zigzag' }) {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return (
    <svg width="210" height="120" viewBox="0 0 210 120" style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '2px' }}>
      <rect x="20" y="15" width="170" height="90" fill="#f8fafc" stroke="#0284c7" strokeWidth="2" strokeDasharray="3,2" />
      
      {/* Primary Parallel Raster Passes */}
      {[-30, -15, 0, 15, 30].map((offset, i) => {
        const cx = 105 - offset * sin;
        const cy = 60 + offset * cos;
        const len = 70;
        const x1 = cx - len * cos;
        const y1 = cy - len * sin;
        const x2 = cx + len * cos;
        const y2 = cy + len * sin;
        return (
          <line
            key={`p_${i}`}
            x1={Math.max(25, Math.min(185, x1))}
            y1={Math.max(20, Math.min(100, y1))}
            x2={Math.max(25, Math.min(185, x2))}
            y2={Math.max(20, Math.min(100, y2))}
            stroke="#16a34a"
            strokeWidth="2"
          />
        );
      })}

      {/* Cross-Hatch Alternating Passes if enabled */}
      {crossHatch && [-30, -15, 0, 15, 30].map((offset, i) => {
        const cx = 105 - offset * cos;
        const cy = 60 - offset * sin;
        const len = 70;
        const x1 = cx + len * sin;
        const y1 = cy - len * cos;
        const x2 = cx - len * sin;
        const y2 = cy + len * cos;
        return (
          <line
            key={`ch_${i}`}
            x1={Math.max(25, Math.min(185, x1))}
            y1={Math.max(20, Math.min(100, y1))}
            x2={Math.max(25, Math.min(185, x2))}
            y2={Math.max(20, Math.min(100, y2))}
            stroke="#ea580c"
            strokeWidth="1.5"
            strokeDasharray="4,2"
          />
        );
      })}

      <text x="25" y="112" fill="#334155" fontSize="9" fontWeight="bold">
        Angle: {angle}° {crossHatch ? '(Cross-Hatch 90°)' : ''} | {cuttingMethod === 'zigzag' ? 'Zigzag' : 'One-Way'}
      </text>
    </svg>
  );
}

export default function SurfaceRoughParallelModal({
  isOpen = false,
  onClose = () => {},
  onSaveOperation = () => {},
  activeMachine = null,
  currentModel = null,
  machines = [],
  onSelectMachine = null,
  lastDefinedTool = null,
  stockConfig = null,
  tools = [],
  operation = null,
  onOpenToolLibrary = null
}) {
  const TREE_PAGES = useMemo(() => [
    { id: 'toolpath_type', label: 'Toolpath Type', edited: true, level: 0 },
    { id: 'model_geometry', label: 'Model Geometry', edited: true, level: 0 },
    { id: 'toolpath_control', label: 'Toolpath Control', edited: true, level: 0 },
    { id: 'tool', label: 'Tool', edited: true, level: 0 },
    { id: 'holder', label: 'Holder', edited: false, level: 0 },
    { isDivider: true, id: 'div_1' },
    { id: 'stock', label: 'Stock', edited: false, disabled: true, level: 0 },
    { id: 'cut_parameters', label: 'Cut Parameters', edited: true, level: 0 },
    { id: 'parallel_parameters', label: 'Parallel Parameters', edited: true, level: 1 },
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
  const [filterActive, setFilterActive] = useState(false);
  const initialRoughTool = useMemo(() => resolveDefaultRoughingTool(tools), [tools]);
  const [formData, setFormData] = useState(() =>
    createDefaultParallelRoughState({ activeMachine, stockConfig, currentModel, tool: initialRoughTool, tools })
  );

  useEffect(() => {
    if (isOpen) {
      const defaultState = createDefaultParallelRoughState({
        activeMachine,
        stockConfig,
        currentModel,
        tool: initialRoughTool,
        tools
      });

      if (operation) {
        setFormData({
          ...defaultState,
          ...operation,
          modelGeometry: {
            ...defaultState.modelGeometry,
            ...(operation.modelGeometry || {})
          },
          toolpathControl: {
            ...defaultState.toolpathControl,
            ...(operation.toolpathControl || {})
          },
          cutParameters: {
            ...defaultState.cutParameters,
            ...(operation.cutParameters || {})
          },
          parallelParameters: {
            ...defaultState.parallelParameters,
            ...(operation.parallelParameters || {})
          },
          transitions: {
            ...defaultState.transitions,
            ...(operation.transitions || {})
          },
          steepShallow: {
            ...defaultState.steepShallow,
            ...(operation.steepShallow || {})
          },
          linkingParameters: {
            ...defaultState.linkingParameters,
            ...(operation.linkingParameters || {})
          },
          arcFilter: {
            ...defaultState.arcFilter,
            ...(operation.arcFilter || {})
          },
          tool: operation.tool || defaultState.tool
        });
      } else {
        setFormData(defaultState);
      }
      setActivePage('model_geometry');
    }
  }, [isOpen, operation, activeMachine, currentModel, tools]);

  const machineCaps = useMemo(() => resolveParallelRoughMachineCapabilities(activeMachine), [activeMachine]);

  const physics = useMemo(() => {
    return calculateParallelRoughPhysics(
      formData.tool,
      {
        stepoverPct: formData.parallelParameters.stepoverPct,
        stepdownMm: formData.parallelParameters.stepdownMm
      },
      formData.selectedMaterialKey
    );
  }, [formData.tool, formData.parallelParameters, formData.selectedMaterialKey]);

  // Filtered tools list for interactive table
  const displayedTools = useMemo(() => {
    if (!tools || tools.length === 0) return [formData.tool];
    if (!filterActive) return tools;
    return tools.filter(
      (t) =>
        t.type === 'flat' ||
        t.type === 'bull' ||
        t.type === 'endmill' ||
        (Number(t.diameter) <= 25 && t.type !== 'face')
    );
  }, [tools, filterActive]);

  const handleSelectTool = (selectedTool) => {
    if (!selectedTool) return;
    const d = Number(selectedTool.diameter || 10);
    const cr = Number(selectedTool.cornerRadius ?? selectedTool.cornerRad ?? 0);
    const maxR = machineCaps.maxRpm || 12000;
    const rpm = Math.min(maxR, Number(selectedTool.spindleSpeed || selectedTool.rpm || 5000));
    const feed = Number(selectedTool.feedRate || 1800);
    const plunge = Number(selectedTool.plungeRate || Math.round(feed * 0.25));
    const retract = Number(selectedTool.retractRate || Math.max(2500, feed * 1.5));
    const num = selectedTool.number || selectedTool.id || 1;

    setFormData((prev) => {
      const currentStepoverPct = Number(prev.parallelParameters.stepoverPct || 65);
      const newStepoverMm = Number(((d * currentStepoverPct) / 100).toFixed(2));
      return {
        ...prev,
        tool: {
          ...prev.tool,
          id: selectedTool.id,
          number: num,
          name: selectedTool.name || `${d}mm Flat Endmill`,
          diameter: d,
          cornerRadius: cr,
          lengthOffset: selectedTool.lengthOffset ?? num,
          diameterOffset: selectedTool.diameterOffset ?? num,
          spindleSpeed: rpm,
          feedRate: feed,
          plungeRate: plunge,
          retractRate: retract,
          flutes: selectedTool.flutes || 4,
          type: selectedTool.type || 'flat'
        },
        cutParameters: {
          ...prev.cutParameters,
          stepoverMm: newStepoverMm
        },
        parallelParameters: {
          ...prev.parallelParameters,
          stepoverMm: newStepoverMm
        }
      };
    });
  };

  const handleCycleLibraryTool = () => {
    if (!tools || !tools.length) {
      onOpenToolLibrary?.();
      return;
    }
    const currIndex = tools.findIndex((t) => t.id === formData.tool.id || t.number === formData.tool.number);
    const nextIndex = (currIndex + 1) % tools.length;
    handleSelectTool(tools[nextIndex]);
  };

  useEffect(() => {
    if (lastDefinedTool?.tool && isOpen) {
      handleSelectTool(lastDefinedTool.tool);
    }
  }, [lastDefinedTool]);

  if (!isOpen) return null;

  const handleApplyPreset = (presetId) => {
    const preset = PARALLEL_ROUGH_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const toolDiam = Number(formData.tool.diameter || 10.0);
    const newStepoverMm = Number(((toolDiam * preset.stepoverPct) / 100).toFixed(2));

    setFormData((prev) => ({
      ...prev,
      selectedPresetId: preset.id,
      selectedMaterialKey: preset.materialKey,
      parallelParameters: {
        ...prev.parallelParameters,
        machiningAngle: preset.machiningAngle,
        stepoverPct: preset.stepoverPct,
        stepoverMm: newStepoverMm,
        stepdownMm: preset.stepdownMm,
        cuttingMethod: preset.cuttingMethod,
        crossHatch: preset.crossHatch,
        cleanBoundaries: preset.cleanBoundaries
      },
      cutParameters: {
        ...prev.cutParameters,
        stepoverPct: preset.stepoverPct,
        stepoverMm: newStepoverMm,
        stepdownMm: preset.stepdownMm,
        cuttingMethod: preset.cuttingMethod
      },
      transitions: {
        ...prev.transitions,
        rampAngle: preset.rampAngle
      },
      tool: {
        ...prev.tool,
        spindleSpeed: Math.min(machineCaps.maxRpm, preset.spindleSpeed),
        feedRate: Math.min(machineCaps.maxFeed, preset.feedRate),
        plungeRate: preset.plungeRate
      }
    }));
  };

  const handleLoadRecommendedValues = () => {
    const mat = PARALLEL_ROUGH_MATERIALS[formData.selectedMaterialKey] || PARALLEL_ROUGH_MATERIALS.ALU_6061;
    const toolDiam = Number(formData.tool.diameter || 10.0);
    const recStepoverPct = mat.recommendedStepoverPct;
    const recStepoverMm = Number(((toolDiam * recStepoverPct) / 100).toFixed(2));
    const recStepdownMm = mat.recommendedStepdownMm;

    const rpm = Math.min(machineCaps.maxRpm, Math.round((mat.vc * 1000) / (Math.PI * toolDiam)));
    const z = formData.tool.flutes || 4;
    const feed = Math.min(machineCaps.maxFeed, Math.round(rpm * z * mat.fzNominal));
    const plunge = Math.round(feed * 0.25);

    setFormData((prev) => ({
      ...prev,
      parallelParameters: {
        ...prev.parallelParameters,
        stepoverPct: recStepoverPct,
        stepoverMm: recStepoverMm,
        stepdownMm: recStepdownMm
      },
      cutParameters: {
        ...prev.cutParameters,
        stepoverPct: recStepoverPct,
        stepoverMm: recStepoverMm,
        stepdownMm: recStepdownMm
      },
      tool: {
        ...prev.tool,
        spindleSpeed: rpm,
        feedRate: feed,
        plungeRate: plunge
      }
    }));
  };

  const handleToolParamChange = (field, val) => {
    setFormData((prev) => {
      const updatedTool = { ...prev.tool, [field]: val };
      let newStepoverMm = prev.parallelParameters.stepoverMm;
      if (field === 'diameter') {
        const d = Number(val || 10.0);
        newStepoverMm = Number(((d * Number(prev.parallelParameters.stepoverPct || 65)) / 100).toFixed(2));
      }
      return {
        ...prev,
        tool: updatedTool,
        cutParameters: {
          ...prev.cutParameters,
          stepoverMm: newStepoverMm
        },
        parallelParameters: {
          ...prev.parallelParameters,
          stepoverMm: newStepoverMm
        }
      };
    });
  };

  const handleSaveAndRegenerate = () => {
    onSaveOperation({
      ...formData,
      strategyKey: 'surface_rough_parallel',
      badgeClass: 'rough_parallel',
      opType: 'parallel'
    });
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(2px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6px',
        boxSizing: 'border-box',
        fontFamily: "'Segoe UI', Tahoma, Helvetica, sans-serif"
      }}
    >
      <div
        className="modal-window"
        style={{
          width: 'min(920px, calc(100vw - 12px))',
          maxWidth: 'calc(100vw - 12px)',
          height: 'min(670px, calc(100dvh - 12px))',
          maxHeight: 'calc(100dvh - 12px)',
          backgroundColor: '#f0f4f9',
          border: '1px solid #005a9e',
          borderRadius: '4px',
          boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Title Bar */}
        <div
          className="modal-header"
          style={{
            height: '28px',
            flexShrink: 0,
            background: 'linear-gradient(180deg, #0078d7 0%, #005a9e 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 8px',
            fontSize: '12px',
            fontWeight: 600,
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Box size={14} />
            <span>Surface Rough Toolpaths - Parallel</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '2px',
              borderRadius: '2px'
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Physics HUD & Presets Bar */}
        <div
          style={{
            background: '#ffffff',
            borderBottom: '1px solid #cbd5e1',
            padding: '4px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#334155'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Flame size={13} color="#ea580c" />
              <b>MRR:</b> {physics.mrrCm3Min} cm³/min
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Zap size={13} color="#ca8a04" />
              <b>Force:</b> {physics.fc} N
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Cpu size={13} color="#2563eb" />
              <b>Power:</b> {physics.powerKw} kW
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Gauge size={13} color="#16a34a" />
              <b>Torque:</b> {physics.torqueNm} Nm
            </span>
            <span style={{ color: '#64748b' }}>
              <b>Chip Load (hm):</b> {physics.hm} mm
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleLoadRecommendedValues}
              style={{
                ...MC_BUTTON,
                background: '#fef3c7',
                borderColor: '#d97706',
                color: '#92400e',
                fontWeight: 600
              }}
              title="Apply scientifically recommended feeds, speeds, stepover and stepdown"
            >
              ⭐ Recommended Values
            </button>

            <span style={{ fontSize: '11px', color: '#475569' }}>Roughing Preset:</span>
            <select
              value={formData.selectedPresetId}
              onChange={(e) => handleApplyPreset(e.target.value)}
              style={{ ...CLASSIC_YELLOW, width: '190px' }}
            >
              {PARALLEL_ROUGH_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Machine & WCS Info Banner */}
        <div
          style={{
            background: '#f8fafc',
            borderBottom: '1px solid #cbd5e1',
            padding: '2px 12px',
            fontSize: '10.5px',
            color: '#64748b',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            alignItems: 'center'
          }}
        >
          {machines && machines.length > 0 && onSelectMachine ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Cpu size={12} color="#0284c7" />
              <span>Machine:</span>
              <select
                value={activeMachine?.id || (machines[0] && machines[0].id) || ''}
                onChange={(e) => {
                  const m = machines.find((mac) => mac.id === e.target.value);
                  if (m && onSelectMachine) onSelectMachine(m);
                }}
                style={{
                  fontSize: '10.5px',
                  height: '18px',
                  padding: '0 4px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '2px',
                  background: '#ffffff',
                  color: '#0f172a'
                }}
              >
                {machines.map((mac) => (
                  <option key={mac.id} value={mac.id}>
                    {mac.name || mac.id}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <span>Machine: <b>{machineCaps.machineName}</b></span>
          )}
          <span>Cleared: <b>G05.1 Q1</b></span>
          <span>WCS: <b>Top (G54)</b></span>
        </div>

        {/* Main Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Navigation Tree */}
          <div
            style={{
              width: '185px',
              backgroundColor: '#ffffff',
              borderRight: '1px solid #cbd5e1',
              display: 'flex',
              flexDirection: 'column',
              userSelect: 'none',
              overflowY: 'auto'
            }}
          >
            {TREE_PAGES.map((item, idx) => {
              if (item.isDivider) {
                return (
                  <div
                    key={`div_${idx}`}
                    style={{
                      height: '1px',
                      backgroundColor: '#e2e8f0',
                      margin: '4px 8px'
                    }}
                  />
                );
              }
              const isSelected = activePage === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => !item.disabled && setActivePage(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px 8px 4px ' + (item.level ? '20px' : '10px'),
                    fontSize: '11px',
                    color: item.disabled ? '#94a3b8' : isSelected ? '#0078d7' : '#1e293b',
                    backgroundColor: isSelected ? '#e0f2fe' : 'transparent',
                    cursor: item.disabled ? 'default' : 'pointer',
                    fontWeight: isSelected ? 600 : 400,
                    borderLeft: isSelected ? '3px solid #0078d7' : '3px solid transparent'
                  }}
                >
                  <span style={{ width: '14px', display: 'inline-block' }}>
                    {item.edited && <Check size={11} color="#16a34a" />}
                  </span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                </div>
              );
            })}
          </div>

          {/* Right Page View */}
          <div
            style={{
              flex: 1,
              backgroundColor: '#ffffff',
              padding: '12px 16px',
              overflowY: 'auto',
              fontSize: '11px',
              color: '#1e293b'
            }}
          >
            {/* 1. TOOLPATH TYPE PAGE */}
            {activePage === 'toolpath_type' && (
              <div>
                <fieldset style={MC_GROUPBOX}>
                  <legend style={MC_LEGEND}>Toolpath Selection</legend>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <MastercamParallelDiagram
                      angle={formData.parallelParameters.machiningAngle}
                      crossHatch={formData.parallelParameters.crossHatch}
                      cuttingMethod={formData.parallelParameters.cuttingMethod}
                    />
                    <div>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#0f172a' }}>
                        Surface Rough Parallel
                      </h4>
                      <p style={{ margin: '0 0 8px 0', color: '#64748b', lineHeight: 1.4 }}>
                        Executes multi-level parallel raster passes across 3D CAD surfaces at any specified
                        machining angle. Ideal for rapid bulk stock removal in open and contoured cavities.
                      </p>
                      <ul style={{ margin: 0, paddingLeft: '16px', color: '#475569', lineHeight: 1.5 }}>
                        <li>Continuous linear raster strokes with minimal machine acceleration wear</li>
                        <li>Optional 90° Cross-Hatching on alternating Z stepdowns</li>
                        <li>Safe helical or linear ramp plunge entries</li>
                        <li>Automatic perimeter boundary cleanup</li>
                      </ul>
                    </div>
                  </div>
                </fieldset>
              </div>
            )}

            {/* 2. MODEL GEOMETRY PAGE */}
            {activePage === 'model_geometry' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <fieldset style={MC_GROUPBOX}>
                    <legend style={MC_LEGEND}>Machining Geometry (Drive Surfaces)</legend>
                    <div style={{ border: '1px solid #cbd5e1', height: '120px', background: '#f8fafc', padding: '4px', overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead>
                          <tr style={{ background: '#e2e8f0', color: '#475569', textAlign: 'left' }}>
                            <th style={{ padding: '2px 4px' }}>Name</th>
                            <th style={{ padding: '2px 4px' }}>Entities</th>
                            <th style={{ padding: '2px 4px' }}>Wall Stock</th>
                            <th style={{ padding: '2px 4px' }}>Floor Stock</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ background: '#e0f2fe' }}>
                            <td style={{ padding: '2px 4px' }}>■ machining</td>
                            <td style={{ padding: '2px 4px' }}>{formData.modelGeometry.machiningEntitiesCount}</td>
                            <td style={{ padding: '2px 4px' }}>{formData.modelGeometry.wallStock}</td>
                            <td style={{ padding: '2px 4px' }}>{formData.modelGeometry.floorStock}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div style={{ marginTop: '6px', display: 'flex', gap: '6px' }}>
                      <button style={MC_BUTTON} disabled>+ Add</button>
                      <button style={MC_BUTTON} disabled>Remove</button>
                    </div>
                  </fieldset>

                  <fieldset style={MC_GROUPBOX}>
                    <legend style={MC_LEGEND}>Avoidance Geometry (Check Surfaces)</legend>
                    <div style={{ border: '1px solid #cbd5e1', height: '120px', background: '#f8fafc', padding: '4px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead>
                          <tr style={{ background: '#e2e8f0', color: '#475569', textAlign: 'left' }}>
                            <th style={{ padding: '2px 4px' }}>Name</th>
                            <th style={{ padding: '2px 4px' }}>Entities</th>
                            <th style={{ padding: '2px 4px' }}>Wall Stock</th>
                            <th style={{ padding: '2px 4px' }}>Floor Stock</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={{ padding: '2px 4px' }}>■ avoidance</td>
                            <td style={{ padding: '2px 4px' }}>0</td>
                            <td style={{ padding: '2px 4px' }}>0.0</td>
                            <td style={{ padding: '2px 4px' }}>0.0</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div style={{ marginTop: '6px', display: 'flex', gap: '6px' }}>
                      <button style={MC_BUTTON} disabled>+ Add</button>
                      <button style={MC_BUTTON} disabled>Remove</button>
                    </div>
                  </fieldset>
                </div>

                <fieldset style={MC_GROUPBOX}>
                  <legend style={MC_LEGEND}>Stock to Leave on Drive Surfaces</legend>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.modelGeometry.sameWallAndFloorStock}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            modelGeometry: {
                              ...prev.modelGeometry,
                              sameWallAndFloorStock: e.target.checked,
                              floorStock: e.target.checked ? prev.modelGeometry.wallStock : prev.modelGeometry.floorStock
                            }
                          }))
                        }
                      />
                      Same wall and floor stock
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '120px 100px 30px', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                    <span>Wall stock:</span>
                    <input
                      type="number"
                      step="0.05"
                      value={formData.modelGeometry.wallStock}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setFormData((prev) => ({
                          ...prev,
                          modelGeometry: {
                            ...prev.modelGeometry,
                            wallStock: val,
                            floorStock: prev.modelGeometry.sameWallAndFloorStock ? val : prev.modelGeometry.floorStock
                          }
                        }));
                      }}
                      style={CLASSIC_YELLOW}
                    />
                    <span style={{ color: '#64748b' }}>mm</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '120px 100px 30px', gap: '6px', alignItems: 'center' }}>
                    <span>Floor stock:</span>
                    <input
                      type="number"
                      step="0.05"
                      disabled={formData.modelGeometry.sameWallAndFloorStock}
                      value={formData.modelGeometry.floorStock}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setFormData((prev) => ({
                          ...prev,
                          modelGeometry: { ...prev.modelGeometry, floorStock: val }
                        }));
                      }}
                      style={formData.modelGeometry.sameWallAndFloorStock ? DISABLED_GRAY : CLASSIC_YELLOW}
                    />
                    <span style={{ color: '#64748b' }}>mm</span>
                  </div>
                </fieldset>
              </div>
            )}

            {/* 3. TOOLPATH CONTROL PAGE */}
            {activePage === 'toolpath_control' && (
              <div>
                <fieldset style={MC_GROUPBOX}>
                  <legend style={MC_LEGEND}>Tool Containment & Compensation</legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '140px 140px', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <span>Compensate to:</span>
                    <select
                      value={formData.toolpathControl.compensateTo}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          toolpathControl: { ...prev.toolpathControl, compensateTo: e.target.value }
                        }))
                      }
                      style={CLASSIC_YELLOW}
                    >
                      <option value="center">Center</option>
                      <option value="inside">Inside</option>
                      <option value="outside">Outside</option>
                    </select>
                  </div>
                </fieldset>
              </div>
            )}

            {/* 4. TOOL PAGE */}
            {activePage === 'tool' && (
              <div>
                <fieldset style={MC_GROUPBOX}>
                  <legend style={MC_LEGEND}>Tool Selection & Coupled Feeds / Speeds</legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
                    {/* Left Column: Tool Library Table */}
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                        Tool Selection Table:
                      </div>
                      <div style={{ border: '1px solid #cbd5e1', maxHeight: '180px', overflowY: 'auto', background: '#ffffff', marginBottom: '8px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                          <thead>
                            <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#475569', position: 'sticky', top: 0, zIndex: 1 }}>
                              <th style={{ width: '28px', padding: '3px 2px' }}>#</th>
                              <th style={{ textAlign: 'left', padding: '3px 4px' }}>Tool Name</th>
                              <th style={{ textAlign: 'center', padding: '3px 4px', width: '38px' }}>Dia</th>
                              <th style={{ textAlign: 'center', padding: '3px 4px', width: '38px' }}>Rad</th>
                            </tr>
                          </thead>
                          <tbody>
                            {displayedTools.map((t) => {
                              const isSelected =
                                formData.tool.id === t.id ||
                                (t.number != null && formData.tool.number === t.number);
                              return (
                                <tr
                                  key={t.id || t.number}
                                  onClick={() => handleSelectTool(t)}
                                  style={{
                                    background: isSelected ? '#0078d7' : 'transparent',
                                    color: isSelected ? '#ffffff' : '#1e293b',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #f1f5f9'
                                  }}
                                >
                                  <td style={{ textAlign: 'center', padding: '3px 2px', fontWeight: isSelected ? 600 : 400 }}>
                                    {t.number || t.id}
                                  </td>
                                  <td
                                    style={{
                                      padding: '3px 4px',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      maxWidth: '140px'
                                    }}
                                    title={t.name}
                                  >
                                    {t.name || `${t.diameter}mm Endmill`}
                                  </td>
                                  <td style={{ textAlign: 'center', padding: '3px 4px' }}>{t.diameter}</td>
                                  <td style={{ textAlign: 'center', padding: '3px 4px' }}>
                                    {t.cornerRadius ?? t.cornerRad ?? 0}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button
                          onClick={handleCycleLibraryTool}
                          style={MC_BUTTON}
                          title="Cycle to next available tool in library"
                        >
                          Select library tool...
                        </button>
                        <label
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            color: '#334155'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={filterActive}
                            onChange={(e) => setFilterActive(e.target.checked)}
                          />
                          Filter Active
                        </label>
                        <button
                          onClick={() => onOpenToolLibrary && onOpenToolLibrary()}
                          style={MC_BUTTON}
                          title="Create or define a new cutting tool"
                        >
                          + Define Tool...
                        </button>
                      </div>
                    </div>

                    {/* Right Column: Active Tool Parameters */}
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', color: '#475569' }}>Tool name:</span>
                        <input
                          type="text"
                          value={formData.tool.name}
                          onChange={(e) => handleToolParamChange('name', e.target.value)}
                          style={CLASSIC_YELLOW}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '100px 100px 30px', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
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

                      <div style={{ display: 'grid', gridTemplateColumns: '100px 100px 30px', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
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

                      <div style={{ display: 'grid', gridTemplateColumns: '100px 100px', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', color: '#475569' }}>Tool number:</span>
                        <input
                          type="number"
                          value={formData.tool.number}
                          onChange={(e) => handleToolParamChange('number', Number(e.target.value))}
                          style={CLASSIC_YELLOW}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '100px 100px', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', color: '#475569' }}>Length offset:</span>
                        <input
                          type="number"
                          value={formData.tool.lengthOffset}
                          onChange={(e) => handleToolParamChange('lengthOffset', Number(e.target.value))}
                          style={CLASSIC_YELLOW}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '100px 100px 40px', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', color: '#475569' }}>Spindle speed:</span>
                        <input
                          type="number"
                          value={formData.tool.spindleSpeed}
                          onChange={(e) => handleToolParamChange('spindleSpeed', Number(e.target.value))}
                          style={CLASSIC_YELLOW}
                        />
                        <span style={{ fontSize: '11px', color: '#64748b' }}>RPM</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '100px 100px 40px', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', color: '#475569' }}>Feed rate:</span>
                        <input
                          type="number"
                          value={formData.tool.feedRate}
                          onChange={(e) => handleToolParamChange('feedRate', Number(e.target.value))}
                          style={CLASSIC_YELLOW}
                        />
                        <span style={{ fontSize: '11px', color: '#64748b' }}>mm/min</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '100px 100px 40px', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', color: '#475569' }}>Plunge rate:</span>
                        <input
                          type="number"
                          value={formData.tool.plungeRate}
                          onChange={(e) => handleToolParamChange('plungeRate', Number(e.target.value))}
                          style={CLASSIC_YELLOW}
                        />
                        <span style={{ fontSize: '11px', color: '#64748b' }}>mm/min</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '100px 100px 40px', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', color: '#475569' }}>Retract rate:</span>
                        <input
                          type="number"
                          value={formData.tool.retractRate}
                          onChange={(e) => handleToolParamChange('retractRate', Number(e.target.value))}
                          style={CLASSIC_YELLOW}
                        />
                        <span style={{ fontSize: '11px', color: '#64748b' }}>mm/min</span>
                      </div>

                      <div style={{ marginTop: '8px' }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '11px' }}>
                          <input
                            type="checkbox"
                            checked={formData.tool.rapidRetract}
                            onChange={(e) => handleToolParamChange('rapidRetract', e.target.checked)}
                          />
                          Rapid Retract (G00)
                        </label>
                      </div>
                    </div>
                  </div>
                </fieldset>
              </div>
            )}

            {/* 5. HOLDER PAGE */}
            {activePage === 'holder' && (
              <div>
                <fieldset style={MC_GROUPBOX}>
                  <legend style={MC_LEGEND}>Tool Holder Definition</legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 140px', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                    <span>Holder name:</span>
                    <input type="text" value={formData.holder.name} readOnly style={DISABLED_GRAY} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 100px 30px', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                    <span>Gage length:</span>
                    <input type="number" value={formData.holder.gageLength} readOnly style={DISABLED_GRAY} />
                    <span style={{ color: '#64748b' }}>mm</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 100px 30px', gap: '8px', alignItems: 'center' }}>
                    <span>Protrusion:</span>
                    <input type="number" value={formData.holder.protrusion} readOnly style={DISABLED_GRAY} />
                    <span style={{ color: '#64748b' }}>mm</span>
                  </div>
                </fieldset>
              </div>
            )}

            {/* 6. STOCK PAGE */}
            {activePage === 'stock' && (
              <div>
                <fieldset style={MC_GROUPBOX}>
                  <legend style={MC_LEGEND}>Stock Model Allowance</legend>
                  <p style={{ color: '#64748b' }}>Stock definition loaded from setup configuration.</p>
                </fieldset>
              </div>
            )}

            {/* 7. CUT PARAMETERS PAGE */}
            {activePage === 'cut_parameters' && (
              <div>
                <fieldset style={MC_GROUPBOX}>
                  <legend style={MC_LEGEND}>Cutting Style & Direction</legend>
                  <div style={{ display: 'flex', gap: '20px', marginBottom: '10px' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="cuttingMethod"
                        value="zigzag"
                        checked={formData.parallelParameters.cuttingMethod === 'zigzag'}
                        onChange={() =>
                          setFormData((prev) => ({
                            ...prev,
                            parallelParameters: { ...prev.parallelParameters, cuttingMethod: 'zigzag' },
                            cutParameters: { ...prev.cutParameters, cuttingMethod: 'zigzag' }
                          }))
                        }
                      />
                      Zigzag (Bi-directional)
                    </label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="cuttingMethod"
                        value="one_way"
                        checked={formData.parallelParameters.cuttingMethod === 'one_way'}
                        onChange={() =>
                          setFormData((prev) => ({
                            ...prev,
                            parallelParameters: { ...prev.parallelParameters, cuttingMethod: 'one_way' },
                            cutParameters: { ...prev.cutParameters, cuttingMethod: 'one_way' }
                          }))
                        }
                      />
                      One-Way (Climb / Conventional)
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '140px 100px 30px', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                    <span>Stepdown (Depth/Cut):</span>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.parallelParameters.stepdownMm}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setFormData((prev) => ({
                          ...prev,
                          parallelParameters: { ...prev.parallelParameters, stepdownMm: val },
                          cutParameters: { ...prev.cutParameters, stepdownMm: val }
                        }));
                      }}
                      style={CLASSIC_YELLOW}
                    />
                    <span style={{ color: '#64748b' }}>mm</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '140px 100px 30px', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                    <span>Stepover:</span>
                    <input
                      type="number"
                      step="5"
                      value={formData.parallelParameters.stepoverPct}
                      onChange={(e) => {
                        const pct = Number(e.target.value);
                        const mm = Number((((formData.tool.diameter || 10) * pct) / 100).toFixed(2));
                        setFormData((prev) => ({
                          ...prev,
                          parallelParameters: { ...prev.parallelParameters, stepoverPct: pct, stepoverMm: mm },
                          cutParameters: { ...prev.cutParameters, stepoverPct: pct, stepoverMm: mm }
                        }));
                      }}
                      style={CLASSIC_YELLOW}
                    />
                    <span style={{ color: '#64748b' }}>%</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '140px 100px 30px', gap: '8px', alignItems: 'center' }}>
                    <span>Stepover (Distance):</span>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.parallelParameters.stepoverMm}
                      onChange={(e) => {
                        const mm = Number(e.target.value);
                        const pct = Number(((mm / (formData.tool.diameter || 10)) * 100).toFixed(1));
                        setFormData((prev) => ({
                          ...prev,
                          parallelParameters: { ...prev.parallelParameters, stepoverMm: mm, stepoverPct: pct },
                          cutParameters: { ...prev.cutParameters, stepoverMm: mm, stepoverPct: pct }
                        }));
                      }}
                      style={CLASSIC_YELLOW}
                    />
                    <span style={{ color: '#64748b' }}>mm</span>
                  </div>
                </fieldset>
              </div>
            )}

            {/* 8. PARALLEL PARAMETERS PAGE */}
            {activePage === 'parallel_parameters' && (
              <div>
                <fieldset style={MC_GROUPBOX}>
                  <legend style={MC_LEGEND}>Machining Angle & Cross-Hatching</legend>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '140px 100px 30px', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontWeight: 600 }}>Machining Angle:</span>
                        <input
                          type="number"
                          step="5"
                          min="0"
                          max="360"
                          value={formData.parallelParameters.machiningAngle}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setFormData((prev) => ({
                              ...prev,
                              parallelParameters: { ...prev.parallelParameters, machiningAngle: val }
                            }));
                          }}
                          style={CLASSIC_YELLOW}
                        />
                        <span style={{ color: '#64748b' }}>deg</span>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                        <button
                          style={MC_BUTTON}
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              parallelParameters: { ...prev.parallelParameters, machiningAngle: 0.0 }
                            }))
                          }
                        >
                          0° (X-Axis)
                        </button>
                        <button
                          style={MC_BUTTON}
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              parallelParameters: { ...prev.parallelParameters, machiningAngle: 90.0 }
                            }))
                          }
                        >
                          90° (Y-Axis)
                        </button>
                        <button
                          style={MC_BUTTON}
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              parallelParameters: { ...prev.parallelParameters, machiningAngle: 45.0 }
                            }))
                          }
                        >
                          45° (Diagonal)
                        </button>
                      </div>

                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 600 }}>
                          <input
                            type="checkbox"
                            checked={formData.parallelParameters.crossHatch}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                parallelParameters: { ...prev.parallelParameters, crossHatch: e.target.checked }
                              }))
                            }
                          />
                          Alternate angle 90° at each stepdown (Cross-Hatch)
                        </label>
                        <p style={{ margin: '2px 0 0 20px', color: '#64748b', fontSize: '10.5px' }}>
                          Eliminates directional tool deflection, balances cutter engagement, and reduces chatter.
                        </p>
                      </div>

                      <div>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={formData.parallelParameters.cleanBoundaries}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                parallelParameters: { ...prev.parallelParameters, cleanBoundaries: e.target.checked }
                              }))
                            }
                          />
                          Clean perimeter boundaries along cavity walls
                        </label>
                      </div>
                    </div>

                    <MastercamParallelDiagram
                      angle={formData.parallelParameters.machiningAngle}
                      crossHatch={formData.parallelParameters.crossHatch}
                      cuttingMethod={formData.parallelParameters.cuttingMethod}
                    />
                  </div>
                </fieldset>
              </div>
            )}

            {/* 9. TRANSITIONS PAGE */}
            {activePage === 'transitions' && (
              <div>
                <fieldset style={MC_GROUPBOX}>
                  <legend style={MC_LEGEND}>Plunge & Ramp Entry</legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '140px 140px', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <span>Entry Method:</span>
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
                      <option value="helical_ramp">Helical Ramp (Recommended)</option>
                      <option value="linear_ramp">Linear Ramp</option>
                      <option value="plunge">Direct Plunge</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '140px 100px 30px', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                    <span>Helical Radius:</span>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.transitions.helicalRadius}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          transitions: { ...prev.transitions, helicalRadius: Number(e.target.value) }
                        }))
                      }
                      style={CLASSIC_YELLOW}
                    />
                    <span style={{ color: '#64748b' }}>mm</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '140px 100px 30px', gap: '8px', alignItems: 'center' }}>
                    <span>Ramp Pitch:</span>
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
                    <span style={{ color: '#64748b' }}>mm/rev</span>
                  </div>
                </fieldset>
              </div>
            )}

            {/* 10. STEEP / SHALLOW PAGE */}
            {activePage === 'steep_shallow' && (
              <div>
                <fieldset style={MC_GROUPBOX}>
                  <legend style={MC_LEGEND}>Z-Level Depth Limits</legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '140px 100px 30px', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                    <span>Top Depth (Minimum):</span>
                    <input
                      type="number"
                      step="1"
                      value={formData.steepShallow.minimumDepth}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          steepShallow: { ...prev.steepShallow, minimumDepth: Number(e.target.value) }
                        }))
                      }
                      style={CLASSIC_YELLOW}
                    />
                    <span style={{ color: '#64748b' }}>mm</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '140px 100px 30px', gap: '8px', alignItems: 'center' }}>
                    <span>Floor Depth (Maximum):</span>
                    <input
                      type="number"
                      step="1"
                      value={formData.steepShallow.maximumDepth}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          steepShallow: { ...prev.steepShallow, maximumDepth: Number(e.target.value) }
                        }))
                      }
                      style={CLASSIC_YELLOW}
                    />
                    <span style={{ color: '#64748b' }}>mm</span>
                  </div>
                </fieldset>
              </div>
            )}

            {/* 11. LINKING PARAMETERS PAGE */}
            {activePage === 'linking_parameters' && (
              <div>
                <fieldset style={MC_GROUPBOX}>
                  <legend style={MC_LEGEND}>Linking & Clearance Planes</legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '140px 100px 30px', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                    <span>Clearance Plane:</span>
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
                    <span style={{ color: '#64748b' }}>mm</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '140px 100px 30px', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                    <span>Retract Height:</span>
                    <input
                      type="number"
                      value={formData.linkingParameters.retractHeight}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          linkingParameters: { ...prev.linkingParameters, retractHeight: Number(e.target.value) }
                        }))
                      }
                      style={CLASSIC_YELLOW}
                    />
                    <span style={{ color: '#64748b' }}>mm</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '140px 100px 30px', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                    <span>Feed Plane:</span>
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
                    <span style={{ color: '#64748b' }}>mm</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '140px 100px 30px', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                    <span>Top of Stock:</span>
                    <input
                      type="number"
                      value={formData.linkingParameters.topOfStock}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          linkingParameters: { ...prev.linkingParameters, topOfStock: Number(e.target.value) }
                        }))
                      }
                      style={CLASSIC_YELLOW}
                    />
                    <span style={{ color: '#64748b' }}>mm</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '140px 100px 30px', gap: '8px', alignItems: 'center' }}>
                    <span>Depth:</span>
                    <input
                      type="number"
                      value={formData.linkingParameters.depth}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          linkingParameters: { ...prev.linkingParameters, depth: Number(e.target.value) }
                        }))
                      }
                      style={CLASSIC_YELLOW}
                    />
                    <span style={{ color: '#64748b' }}>mm</span>
                  </div>
                </fieldset>
              </div>
            )}

            {/* 12. ARC FILTER / TOLERANCE PAGE */}
            {activePage === 'arc_filter_tolerance' && (
              <div>
                <fieldset style={MC_GROUPBOX}>
                  <legend style={MC_LEGEND}>Smoothing & Look-Ahead Tolerances</legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '140px 100px 30px', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                    <span>Total Tolerance:</span>
                    <input type="number" value={formData.arcFilter.totalToleranceMm} readOnly style={DISABLED_GRAY} />
                    <span style={{ color: '#64748b' }}>mm</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '140px 140px', gap: '8px', alignItems: 'center' }}>
                    <span>Smoothing Code:</span>
                    <input type="text" value={formData.arcFilter.smoothingCode} readOnly style={DISABLED_GRAY} />
                  </div>
                </fieldset>
              </div>
            )}

            {/* 13. PLANES PAGE */}
            {activePage === 'planes' && (
              <div>
                <fieldset style={MC_GROUPBOX}>
                  <legend style={MC_LEGEND}>Coordinate Systems (WCS)</legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '140px 120px', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                    <span>WCS Plane:</span>
                    <input type="text" value={formData.planes.wcs} readOnly style={DISABLED_GRAY} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '140px 120px', gap: '8px', alignItems: 'center' }}>
                    <span>Tool Plane:</span>
                    <input type="text" value={formData.planes.toolPlane} readOnly style={DISABLED_GRAY} />
                  </div>
                </fieldset>
              </div>
            )}

            {/* 14. COOLANT PAGE */}
            {activePage === 'coolant' && (
              <div>
                <fieldset style={MC_GROUPBOX}>
                  <legend style={MC_LEGEND}>Coolant Control</legend>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.coolant.flood}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          coolant: { ...prev.coolant, flood: e.target.checked }
                        }))
                      }
                    />
                    Flood Coolant (M08)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.coolant.throughSpindle}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          coolant: { ...prev.coolant, throughSpindle: e.target.checked }
                        }))
                      }
                    />
                    Through-Spindle Coolant (M88)
                  </label>
                </fieldset>
              </div>
            )}

            {/* 15. CANNED TEXT PAGE */}
            {activePage === 'canned_text' && (
              <div>
                <fieldset style={MC_GROUPBOX}>
                  <legend style={MC_LEGEND}>Canned Text M-Codes</legend>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.cannedText.m01OptionalStop}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          cannedText: { ...prev.cannedText, m01OptionalStop: e.target.checked }
                        }))
                      }
                    />
                    M01 Optional Stop Before Tool Change
                  </label>
                </fieldset>
              </div>
            )}
          </div>
        </div>

        {/* Footer / Status Bar */}
        <div
          style={{
            height: '36px',
            background: '#e2e8f0',
            borderTop: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 12px',
            fontSize: '11px',
            userSelect: 'none'
          }}
        >
          <div style={{ color: '#475569' }}>
            Active Tool: <b>T{formData.tool.number} ({formData.tool.diameter}mm {formData.tool.type || 'Flat Endmill'})</b> | RPM: <b>{formData.tool.spindleSpeed}</b> | Feed: <b>{formData.tool.feedRate} mm/min</b>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={handleSaveAndRegenerate}
              style={{
                ...MC_BUTTON,
                background: 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)',
                borderColor: '#15803d',
                color: '#ffffff',
                fontWeight: 600,
                padding: '0 12px'
              }}
            >
              ✓ OK
            </button>
            <button onClick={onClose} style={{ ...MC_BUTTON, padding: '0 10px' }}>
              Cancel
            </button>
            <button onClick={handleSaveAndRegenerate} style={{ ...MC_BUTTON, padding: '0 10px' }}>
              Apply
            </button>
            <button style={{ ...MC_BUTTON, padding: '0 8px' }} title="Help">
              <HelpCircle size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
