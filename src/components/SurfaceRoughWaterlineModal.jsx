import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Check, HelpCircle, Plus, ChevronRight, Save, FolderOpen,
  Calculator, Layers, Box, Cpu, Flame, Gauge, Zap, AlertCircle,
  Eye, Crosshair, Ban, MousePointer
} from 'lucide-react';
import {
  WATERLINE_ROUGH_MATERIALS,
  WATERLINE_ROUGH_PRESETS,
  resolveWaterlineRoughMachineCaps,
  calculateWaterlineRoughPhysics,
  createDefaultWaterlineRoughState,
  resolveDefaultRoughingTool
} from '../config/waterlineRoughSchema.js';

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
 * Visual SVG diagram representing Constant-Z Waterline Contour Clearing Rings.
 */
function MastercamWaterlineDiagram({ cutDirection = 'outside_in', cuttingMethod = 'climb' }) {
  const isClimb = cuttingMethod === 'climb';

  return (
    <svg width="210" height="120" viewBox="0 0 210 120" style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '2px' }}>
      {/* Mold Cavity Draft Walls */}
      <rect x="20" y="15" width="170" height="90" rx="6" fill="#f8fafc" stroke="#64748b" strokeWidth="1.5" />
      <rect x="45" y="32" width="120" height="56" rx="4" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />

      {/* Outer Waterline Ring */}
      <rect x="28" y="21" width="154" height="78" rx="5" fill="none" stroke="#0284c7" strokeWidth="2" />
      
      {/* Intermediate Offset Ring */}
      <rect x="36" y="26" width="138" height="68" rx="4" fill="none" stroke="#06b6d4" strokeWidth="1.5" />

      {/* Inner Offset Ring */}
      <rect x="52" y="37" width="106" height="46" rx="3" fill="none" stroke="#10b981" strokeWidth="1.5" />

      {/* Center Island / Core */}
      <rect x="75" y="48" width="60" height="24" rx="2" fill="#e2e8f0" stroke="#475569" strokeWidth="1" />
      <text x="105" y="63" fontSize="8" fill="#475569" textAnchor="middle" fontWeight="bold">MOLD CORE</text>

      {/* Direction Arrows */}
      <polygon points={isClimb ? "105,19 110,21 105,23" : "105,23 100,21 105,19"} fill="#0284c7" />
      <polygon points={isClimb ? "105,35 110,37 105,39" : "105,39 100,37 105,35"} fill="#10b981" />

      {/* Label */}
      <text x="105" y="112" fontSize="9" fill="#0369a1" textAnchor="middle" fontWeight="600">
        {cutDirection === 'outside_in' ? 'Outside-In (Cavity)' : 'Inside-Out (Core)'} • {isClimb ? 'Climb (CCW)' : 'Conventional (CW)'}
      </text>
    </svg>
  );
}

export default function SurfaceRoughWaterlineModal({
  isOpen = false,
  onClose = () => {},
  operation = null,
  tools = [],
  activeMachine = null,
  machines = [],
  onSelectMachine = () => {},
  lastDefinedTool = null,
  stockConfig = { dimensions: { x: 120, y: 80, z: 25 }, height: 25 },
  currentModel = null,
  onSaveOperation = () => {},
  onNotify = () => {}
}) {
  const [activePage, setActivePage] = useState('tool');
  const [formData, setFormData] = useState(null);

  // Initialize or rehydrate Form State
  useEffect(() => {
    if (!isOpen) return;

    if (operation && (operation.strategyKey === 'surface_rough_waterline' || operation.badgeClass === 'rough_waterline')) {
      setFormData({
        ...createDefaultWaterlineRoughState({ activeMachine, stockConfig, tools, currentModel }),
        ...operation,
        tool: {
          ...operation.tool,
          diameter: operation.tool?.diameter || operation.toolDiameter || 10,
          spindleSpeed: operation.tool?.spindleSpeed || operation.spindleSpeed || 12000,
          feedRate: operation.tool?.feedRate || operation.feedRate || 4800,
          plungeRate: operation.tool?.plungeRate || operation.plungeRate || 450
        }
      });
    } else {
      const freshState = createDefaultWaterlineRoughState({ activeMachine, stockConfig, tools, currentModel });
      if (lastDefinedTool) {
        freshState.tool = {
          ...freshState.tool,
          id: lastDefinedTool.id || 3,
          number: lastDefinedTool.number || 3,
          name: lastDefinedTool.name,
          diameter: lastDefinedTool.diameter,
          cornerRad: lastDefinedTool.cornerRad || 0,
          spindleSpeed: lastDefinedTool.spindleSpeed || 12000,
          feedRate: lastDefinedTool.feedRate || 4800
        };
      }
      setFormData(freshState);
    }
  }, [isOpen, operation, activeMachine, stockConfig, tools, currentModel, lastDefinedTool]);

  // Real-Time Physics Calculation
  const physics = useMemo(() => {
    if (!formData) return null;
    return calculateWaterlineRoughPhysics(
      formData.tool,
      formData.cutParameters,
      formData.selectedMaterialKey || 'ALU_6061'
    );
  }, [formData?.tool, formData?.cutParameters, formData?.selectedMaterialKey]);

  if (!isOpen || !formData) return null;

  const caps = resolveWaterlineRoughMachineCaps(activeMachine);

  // Field updater
  const updateField = (pageKey, fieldKey, value) => {
    setFormData((prev) => ({
      ...prev,
      [pageKey]: {
        ...(prev[pageKey] || {}),
        [fieldKey]: value
      }
    }));
  };

  // Tool selector
  const handleSelectTool = (selectedTool) => {
    if (!selectedTool) return;
    const diam = Number(selectedTool.diameter || 10);
    const stepoverPct = Number(formData.cutParameters.stepoverPct || 60);
    const newStepoverMm = Number(((diam * stepoverPct) / 100).toFixed(2));

    setFormData((prev) => ({
      ...prev,
      toolId: selectedTool.id,
      toolName: selectedTool.name,
      tool: {
        ...prev.tool,
        id: selectedTool.id,
        number: selectedTool.number || selectedTool.id,
        name: selectedTool.name,
        type: selectedTool.type || 'flat',
        diameter: diam,
        cornerRad: Number(selectedTool.cornerRad ?? selectedTool.cornerRadius ?? 0),
        flutes: Number(selectedTool.flutes || 4),
        spindleSpeed: selectedTool.spindleSpeed || 12000,
        feedRate: selectedTool.feedRate || 4800,
        plungeRate: selectedTool.plungeRate || 450,
        retractRate: selectedTool.retractRate || 5000,
        lengthOffset: selectedTool.number || selectedTool.id,
        diameterOffset: selectedTool.number || selectedTool.id
      },
      cutParameters: {
        ...prev.cutParameters,
        stepoverMm: newStepoverMm
      }
    }));
  };

  // Preset applicator
  const handleApplyPreset = (presetId) => {
    const preset = WATERLINE_ROUGH_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const diam = Number(formData.tool.diameter || 10);
    const newStepoverMm = Number(((diam * preset.stepoverPct) / 100).toFixed(2));

    setFormData((prev) => ({
      ...prev,
      selectedPresetId: preset.id,
      selectedMaterialKey: preset.materialKey,
      cutParameters: {
        ...prev.cutParameters,
        stepdownMm: preset.stepdownMm,
        stepoverPct: preset.stepoverPct,
        stepoverMm: newStepoverMm,
        cuttingMethod: preset.cuttingMethod,
        cutDirection: preset.cutDirection
      },
      modelGeometry: {
        ...prev.modelGeometry,
        wallStock: preset.wallStock,
        floorStock: preset.floorStock
      },
      transitions: {
        ...prev.transitions,
        helicalRadius: preset.helicalRadius,
        rampPitch: preset.rampPitch
      },
      waterlineParameters: {
        ...prev.waterlineParameters,
        cleanWalls: preset.cleanWalls
      }
    }));
    onNotify(`Applied preset: ${preset.name}`, 'info');
  };

  // Recommended Values button
  const handleApplyRecommendedValues = () => {
    const diam = Number(formData.tool.diameter || 10);
    const recStepoverPct = 60.0;
    const recStepoverMm = Number(((diam * recStepoverPct) / 100).toFixed(2));
    const recStepdown = 2.0;

    setFormData((prev) => ({
      ...prev,
      cutParameters: {
        ...prev.cutParameters,
        stepdownMm: recStepdown,
        stepoverPct: recStepoverPct,
        stepoverMm: recStepoverMm,
        cuttingMethod: 'climb',
        cutDirection: 'outside_in'
      },
      modelGeometry: {
        ...prev.modelGeometry,
        wallStock: 0.50,
        floorStock: 0.50,
        sameWallAndFloorStock: true
      },
      transitions: {
        ...prev.transitions,
        entryMethod: 'helical_ramp',
        helicalRadius: 4.0,
        rampPitch: 2.0
      },
      waterlineParameters: {
        ...prev.waterlineParameters,
        cleanWalls: true,
        detectCriticalDepths: true,
        cornerSmoothing: true
      }
    }));
    onNotify('Loaded Argus CAM Intelligence recommended parameters for Surface Rough Waterline', 'success');
  };

  const handleSaveAndRegenerate = () => {
    onSaveOperation({
      ...formData,
      strategyKey: 'surface_rough_waterline',
      badgeClass: 'rough_waterline',
      opType: 'waterline'
    });
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(2px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Segoe UI', Tahoma, Helvetica, sans-serif"
      }}
    >
      <div
        style={{
          width: '920px',
          height: '680px',
          backgroundColor: '#f1f5f9',
          border: '1px solid #64748b',
          borderRadius: '4px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Title Bar */}
        <div
          style={{
            height: '28px',
            backgroundColor: '#0284c7',
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
            <Layers size={14} />
            <span>Surface Rough Toolpaths - Waterline (Constant-Z Roughing)</span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
            title="Close dialog"
          >
            <X size={15} />
          </button>
        </div>

        {/* Real-Time Physics HUD */}
        <div
          style={{
            padding: '4px 10px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            fontSize: '11px',
            flexWrap: 'nowrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span title="Material Removal Rate" style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#0369a1', fontWeight: 600 }}>
              <Flame size={12} color="#0284c7" />
              MRR: {physics?.mrrCm3Min || 0} cm³/min
            </span>
            <span title="Tangential Cutting Force" style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#334155' }}>
              <Gauge size={12} color="#f59e0b" />
              Force: {physics?.cuttingForceN || 0} N
            </span>
            <span title="Spindle Cutting Power" style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#334155' }}>
              <Zap size={12} color="#16a34a" />
              Power: {physics?.powerKw || 0} kW
            </span>
            <span title="Spindle Torque" style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#334155' }}>
              Torque: {physics?.torqueNm || 0} Nm
            </span>
            <span title="Average Chip Thickness hm" style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#64748b' }}>
              Chip Load (hm): {physics?.averageChipThicknessMm || 0} mm
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={handleApplyRecommendedValues}
              style={{
                ...MC_BUTTON,
                background: 'linear-gradient(180deg, #ecfdf5 0%, #d1fae5 100%)',
                borderColor: '#10b981',
                color: '#065f46',
                fontWeight: 600
              }}
              title="Apply Argus CAM Intelligence verified recommended roughing stepover & stepdown"
            >
              ⭐ Recommended Values
            </button>

            <select
              value={formData.selectedPresetId || 'alu_hsm_waterline'}
              onChange={(e) => handleApplyPreset(e.target.value)}
              style={{ ...CLASSIC_YELLOW, width: '190px', height: '22px', fontSize: '10.5px' }}
              title="Select Argus CAM Intelligence Waterline Rough Preset"
            >
              {WATERLINE_ROUGH_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Modal Main Body (2 Columns) */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left Navigation Tree Column */}
          <div
            style={{
              width: '210px',
              backgroundColor: '#ffffff',
              borderRight: '1px solid #cbd5e1',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              userSelect: 'none'
            }}
          >
            <div style={{ padding: '6px 0' }}>
              {[
                { id: 'toolpath_type', label: 'Toolpath Type' },
                { id: 'model_geometry', label: 'Model Geometry' },
                { id: 'toolpath_control', label: 'Toolpath Control' },
                { id: 'tool', label: 'Tool' },
                { id: 'holder', label: 'Holder' },
                { id: 'stock', label: 'Stock' },
                { id: 'cut_parameters', label: 'Cut Parameters' },
                { id: 'waterline_parameters', label: 'Waterline Parameters' },
                { id: 'steep_shallow', label: 'Steep / Shallow' },
                { id: 'transitions', label: 'Transitions' },
                { id: 'linking_parameters', label: 'Linking Parameters' },
                { id: 'arc_filter', label: 'Arc Filter / Tolerance' },
                { id: 'planes', label: 'Planes (WCS)' },
                { id: 'coolant', label: 'Coolant' },
                { id: 'canned_text', label: 'Canned Text' }
              ].map((item) => {
                const isActive = activePage === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setActivePage(item.id)}
                    style={{
                      padding: '4px 10px 4px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '11px',
                      cursor: 'pointer',
                      backgroundColor: isActive ? '#0284c7' : 'transparent',
                      color: isActive ? '#ffffff' : '#1e293b',
                      fontWeight: isActive ? 600 : 400
                    }}
                  >
                    <span>{item.label}</span>
                    {isActive && <ChevronRight size={12} color="#ffffff" />}
                  </div>
                );
              })}
            </div>

            {/* Quick View Settings HUD */}
            <div
              style={{
                marginTop: 'auto',
                padding: '8px 10px',
                borderTop: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                fontSize: '10px',
                color: '#475569',
                lineHeight: '1.4'
              }}
            >
              <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '3px' }}>Quick View Settings:</div>
              <div>Tool: {formData.tool.name}</div>
              <div>Diameter: {formData.tool.diameter} mm</div>
              <div>Stepdown: {formData.cutParameters.stepdownMm} mm</div>
              <div>Stepover: {formData.cutParameters.stepoverPct}%</div>
              <div>Wall Stock: {formData.modelGeometry.wallStock} mm</div>
              <div>Floor Stock: {formData.modelGeometry.floorStock} mm</div>
              <div>Machine: {activeMachine?.name || 'Fanuc Robodrill'}</div>
            </div>
          </div>

          {/* Right Page View Area */}
          <div
            style={{
              flex: 1,
              backgroundColor: '#ffffff',
              padding: '12px 16px',
              overflowY: 'auto'
            }}
          >
            {/* ================= PAGE 4: TOOL SELECTION & SPEEDS ================= */}
            {activePage === 'tool' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '10px' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#0f172a' }}>
                  Tool Selection & Cutting Dynamics
                </div>

                <div style={{ display: 'flex', gap: '12px', flex: 1, minHeight: 0 }}>
                  {/* Left Column: Tool Table */}
                  <div style={{ flex: 1.2, border: '1px solid #cbd5e1', borderRadius: '2px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1', padding: '4px 6px', fontSize: '10.5px', fontWeight: 600, display: 'grid', gridTemplateColumns: '40px 1fr 60px 50px 40px 60px', color: '#475569' }}>
                      <div>Tool #</div>
                      <div>Tool Name</div>
                      <div>Type</div>
                      <div>Dia</div>
                      <div>Flutes</div>
                      <div style={{ textAlign: 'center' }}>Action</div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#ffffff' }}>
                      {tools.map((t) => {
                        const isSelected = String(t.id) === String(formData.tool.id);
                        return (
                          <div
                            key={t.id}
                            onClick={() => handleSelectTool(t)}
                            style={{
                              padding: '4px 6px',
                              borderBottom: '1px solid #f1f5f9',
                              display: 'grid',
                              gridTemplateColumns: '40px 1fr 60px 50px 40px 60px',
                              alignItems: 'center',
                              fontSize: '11px',
                              cursor: 'pointer',
                              backgroundColor: isSelected ? '#dbeafe' : 'transparent',
                              color: isSelected ? '#1e3a8a' : '#0f172a',
                              fontWeight: isSelected ? 600 : 400
                            }}
                          >
                            <div>T{t.number || t.id}</div>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.name}>{t.name}</div>
                            <div style={{ textTransform: 'capitalize' }}>{t.type || 'flat'}</div>
                            <div>{t.diameter} mm</div>
                            <div>{t.flutes || 4}</div>
                            <div style={{ textAlign: 'center' }}>
                              {isSelected ? (
                                <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓ ACTIVE</span>
                              ) : (
                                <button style={{ ...MC_BUTTON, height: '18px', padding: '0 4px', fontSize: '9.5px' }}>Select</button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Feeds & Speeds Inputs */}
                  <div style={{ flex: 0.9, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <fieldset style={MC_GROUPBOX}>
                      <legend style={MC_LEGEND}>Tool Parameters</legend>
                      <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '6px', alignItems: 'center' }}>
                        <label style={{ fontSize: '11px', color: '#334155' }}>Tool name:</label>
                        <input
                          type="text"
                          value={formData.tool.name}
                          onChange={(e) => updateField('tool', 'name', e.target.value)}
                          style={CLASSIC_YELLOW}
                        />

                        <label style={{ fontSize: '11px', color: '#334155' }}>Tool diameter:</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="number"
                            step="0.1"
                            value={formData.tool.diameter}
                            onChange={(e) => updateField('tool', 'diameter', Number(e.target.value))}
                            style={CLASSIC_YELLOW}
                          />
                          <span style={{ fontSize: '10px', color: '#64748b' }}>mm</span>
                        </div>

                        <label style={{ fontSize: '11px', color: '#334155' }}>Corner radius:</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="number"
                            step="0.1"
                            value={formData.tool.cornerRad}
                            onChange={(e) => updateField('tool', 'cornerRad', Number(e.target.value))}
                            style={CLASSIC_YELLOW}
                          />
                          <span style={{ fontSize: '10px', color: '#64748b' }}>mm</span>
                        </div>
                      </div>
                    </fieldset>

                    <fieldset style={MC_GROUPBOX}>
                      <legend style={MC_LEGEND}>Cutting Speeds & Feeds</legend>
                      <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '6px', alignItems: 'center' }}>
                        <label style={{ fontSize: '11px', color: '#334155' }}>Spindle speed:</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="number"
                            value={formData.tool.spindleSpeed}
                            onChange={(e) => updateField('tool', 'spindleSpeed', Number(e.target.value))}
                            style={CLASSIC_YELLOW}
                          />
                          <span style={{ fontSize: '10px', color: '#64748b' }}>RPM</span>
                        </div>

                        <label style={{ fontSize: '11px', color: '#334155' }}>Feed rate:</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="number"
                            value={formData.tool.feedRate}
                            onChange={(e) => updateField('tool', 'feedRate', Number(e.target.value))}
                            style={CLASSIC_YELLOW}
                          />
                          <span style={{ fontSize: '10px', color: '#64748b' }}>mm/min</span>
                        </div>

                        <label style={{ fontSize: '11px', color: '#334155' }}>Plunge rate:</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="number"
                            value={formData.tool.plungeRate}
                            onChange={(e) => updateField('tool', 'plungeRate', Number(e.target.value))}
                            style={CLASSIC_YELLOW}
                          />
                          <span style={{ fontSize: '10px', color: '#64748b' }}>mm/min</span>
                        </div>

                        <label style={{ fontSize: '11px', color: '#334155' }}>Retract rate:</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="number"
                            value={formData.tool.retractRate}
                            onChange={(e) => updateField('tool', 'retractRate', Number(e.target.value))}
                            style={CLASSIC_YELLOW}
                          />
                          <span style={{ fontSize: '10px', color: '#64748b' }}>mm/min</span>
                        </div>
                      </div>
                    </fieldset>
                  </div>
                </div>
              </div>
            )}

            {/* ================= PAGE 7: CUT PARAMETERS ================= */}
            {activePage === 'cut_parameters' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#0f172a' }}>
                  Cut Parameters - Surface Rough Waterline
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <fieldset style={MC_GROUPBOX}>
                      <legend style={MC_LEGEND}>Cutting Depth & Stepover</legend>
                      <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '6px', alignItems: 'center' }}>
                        <label style={{ fontSize: '11px', color: '#334155' }}>Stepdown (ap):</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="number"
                            step="0.5"
                            value={formData.cutParameters.stepdownMm}
                            onChange={(e) => updateField('cutParameters', 'stepdownMm', Number(e.target.value))}
                            style={CLASSIC_YELLOW}
                          />
                          <span style={{ fontSize: '10px', color: '#64748b' }}>mm</span>
                        </div>

                        <label style={{ fontSize: '11px', color: '#334155' }}>Stepover percentage:</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="number"
                            step="5"
                            value={formData.cutParameters.stepoverPct}
                            onChange={(e) => {
                              const pct = Number(e.target.value);
                              const mm = Number(((Number(formData.tool.diameter || 10) * pct) / 100).toFixed(2));
                              updateField('cutParameters', 'stepoverPct', pct);
                              updateField('cutParameters', 'stepoverMm', mm);
                            }}
                            style={CLASSIC_YELLOW}
                          />
                          <span style={{ fontSize: '10px', color: '#64748b' }}>%</span>
                        </div>

                        <label style={{ fontSize: '11px', color: '#334155' }}>Stepover distance (ae):</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="number"
                            step="0.1"
                            value={formData.cutParameters.stepoverMm}
                            onChange={(e) => updateField('cutParameters', 'stepoverMm', Number(e.target.value))}
                            style={DISABLED_GRAY}
                            readOnly
                          />
                          <span style={{ fontSize: '10px', color: '#64748b' }}>mm</span>
                        </div>
                      </div>
                    </fieldset>

                    <fieldset style={MC_GROUPBOX}>
                      <legend style={MC_LEGEND}>Milling Motion & Direction</legend>
                      <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '6px', alignItems: 'center' }}>
                        <label style={{ fontSize: '11px', color: '#334155' }}>Cutting method:</label>
                        <select
                          value={formData.cutParameters.cuttingMethod}
                          onChange={(e) => updateField('cutParameters', 'cuttingMethod', e.target.value)}
                          style={CLASSIC_YELLOW}
                        >
                          <option value="climb">Climb Milling (Recommended)</option>
                          <option value="conventional">Conventional Milling</option>
                        </select>

                        <label style={{ fontSize: '11px', color: '#334155' }}>Cutting direction:</label>
                        <select
                          value={formData.cutParameters.cutDirection}
                          onChange={(e) => updateField('cutParameters', 'cutDirection', e.target.value)}
                          style={CLASSIC_YELLOW}
                        >
                          <option value="outside_in">Outside to Inside (Cavity Pocket)</option>
                          <option value="inside_out">Inside to Outside (Core Boss)</option>
                        </select>

                        <label style={{ fontSize: '11px', color: '#334155' }}>Cut order:</label>
                        <select
                          value={formData.cutParameters.cutOrder}
                          onChange={(e) => updateField('cutParameters', 'cutOrder', e.target.value)}
                          style={CLASSIC_YELLOW}
                        >
                          <option value="optimize">Optimize (Shortest Air Moves)</option>
                          <option value="top_to_bottom">Strict Top-to-Bottom</option>
                        </select>
                      </div>
                    </fieldset>
                  </div>

                  {/* Visual Diagram */}
                  <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                    <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#475569' }}>Waterline Preview</div>
                    <MastercamWaterlineDiagram
                      cutDirection={formData.cutParameters.cutDirection}
                      cuttingMethod={formData.cutParameters.cuttingMethod}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ================= PAGE 8: WATERLINE PARAMETERS ================= */}
            {activePage === 'waterline_parameters' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#0f172a' }}>
                  Waterline Parameters & Wall Control
                </div>

                <fieldset style={MC_GROUPBOX}>
                  <legend style={MC_LEGEND}>Critical Depths & Features</legend>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.waterlineParameters.detectCriticalDepths}
                        onChange={(e) => updateField('waterlineParameters', 'detectCriticalDepths', e.target.checked)}
                      />
                      <span>Detect critical depths (insert cuts at flat face elevations)</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.waterlineParameters.detectFlatSurfaces}
                        onChange={(e) => updateField('waterlineParameters', 'detectFlatSurfaces', e.target.checked)}
                      />
                      <span>Clear horizontal flat surfaces at full boundary</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.waterlineParameters.cornerSmoothing}
                        onChange={(e) => updateField('waterlineParameters', 'cornerSmoothing', e.target.checked)}
                      />
                      <span>Apply corner smoothing radius to eliminate sharp directional reversals</span>
                    </label>
                  </div>
                </fieldset>

                <fieldset style={MC_GROUPBOX}>
                  <legend style={MC_LEGEND}>Wall Cleanup Pass</legend>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.waterlineParameters.cleanWalls}
                        onChange={(e) => updateField('waterlineParameters', 'cleanWalls', e.target.checked)}
                      />
                      <span>Perform perimeter wall cleanup pass at each Z-level</span>
                    </label>

                    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '6px', alignItems: 'center', paddingLeft: '20px' }}>
                      <label style={{ fontSize: '11px', color: '#334155' }}>Minimum toolpath radius:</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.waterlineParameters.minToolpathRadiusMm}
                          onChange={(e) => updateField('waterlineParameters', 'minToolpathRadiusMm', Number(e.target.value))}
                          style={CLASSIC_YELLOW}
                        />
                        <span style={{ fontSize: '10px', color: '#64748b' }}>mm</span>
                      </div>
                    </div>
                  </div>
                </fieldset>
              </div>
            )}

            {/* ================= PAGE 2: MODEL GEOMETRY ================= */}
            {activePage === 'model_geometry' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#0f172a' }}>
                  Model Geometry - Drive & Avoidance Surfaces
                </div>

                <fieldset style={MC_GROUPBOX}>
                  <legend style={MC_LEGEND}>Drive Surfaces & Allowances</legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '6px', alignItems: 'center' }}>
                    <label style={{ fontSize: '11px', color: '#334155' }}>Stock to leave on walls:</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        step="0.05"
                        value={formData.modelGeometry.wallStock}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          updateField('modelGeometry', 'wallStock', val);
                          if (formData.modelGeometry.sameWallAndFloorStock) {
                            updateField('modelGeometry', 'floorStock', val);
                          }
                        }}
                        style={CLASSIC_YELLOW}
                      />
                      <span style={{ fontSize: '10px', color: '#64748b' }}>mm</span>
                    </div>

                    <label style={{ fontSize: '11px', color: '#334155' }}>Stock to leave on floors:</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        step="0.05"
                        value={formData.modelGeometry.floorStock}
                        onChange={(e) => updateField('modelGeometry', 'floorStock', Number(e.target.value))}
                        style={formData.modelGeometry.sameWallAndFloorStock ? DISABLED_GRAY : CLASSIC_YELLOW}
                        readOnly={formData.modelGeometry.sameWallAndFloorStock}
                      />
                      <span style={{ fontSize: '10px', color: '#64748b' }}>mm</span>
                    </div>

                    <div style={{ gridColumn: 'span 2', marginTop: '4px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formData.modelGeometry.sameWallAndFloorStock}
                          onChange={(e) => {
                            const chk = e.target.checked;
                            updateField('modelGeometry', 'sameWallAndFloorStock', chk);
                            if (chk) {
                              updateField('modelGeometry', 'floorStock', formData.modelGeometry.wallStock);
                            }
                          }}
                        />
                        <span>Same wall and floor stock</span>
                      </label>
                    </div>
                  </div>
                </fieldset>
              </div>
            )}

            {/* ================= PAGE 10: TRANSITIONS ================= */}
            {activePage === 'transitions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#0f172a' }}>
                  Transitions & Entry Dynamics
                </div>

                <fieldset style={MC_GROUPBOX}>
                  <legend style={MC_LEGEND}>Entry Plunge Style</legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '6px', alignItems: 'center' }}>
                    <label style={{ fontSize: '11px', color: '#334155' }}>Entry method:</label>
                    <select
                      value={formData.transitions.entryMethod}
                      onChange={(e) => updateField('transitions', 'entryMethod', e.target.value)}
                      style={CLASSIC_YELLOW}
                    >
                      <option value="helical_ramp">Helical Ramp Plunge (Recommended)</option>
                      <option value="linear_ramp">Linear Zigzag Ramp</option>
                      <option value="direct_plunge">Direct Plunge at Feed</option>
                    </select>

                    <label style={{ fontSize: '11px', color: '#334155' }}>Helical radius:</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        step="0.5"
                        value={formData.transitions.helicalRadius}
                        onChange={(e) => updateField('transitions', 'helicalRadius', Number(e.target.value))}
                        style={CLASSIC_YELLOW}
                      />
                      <span style={{ fontSize: '10px', color: '#64748b' }}>mm</span>
                    </div>

                    <label style={{ fontSize: '11px', color: '#334155' }}>Ramp pitch (Z/rev):</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        step="0.5"
                        value={formData.transitions.rampPitch}
                        onChange={(e) => updateField('transitions', 'rampPitch', Number(e.target.value))}
                        style={CLASSIC_YELLOW}
                      />
                      <span style={{ fontSize: '10px', color: '#64748b' }}>mm</span>
                    </div>
                  </div>
                </fieldset>
              </div>
            )}

            {/* ================= PAGE 11: LINKING PARAMETERS ================= */}
            {activePage === 'linking_parameters' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#0f172a' }}>
                  Linking Parameters & Heights
                </div>

                <fieldset style={MC_GROUPBOX}>
                  <legend style={MC_LEGEND}>Z Heights (WCS Reference)</legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 90px', gap: '6px', alignItems: 'center' }}>
                    <label style={{ fontSize: '11px', color: '#334155' }}>Clearance plane:</label>
                    <input
                      type="number"
                      value={formData.linkingParameters.clearancePlane}
                      onChange={(e) => updateField('linkingParameters', 'clearancePlane', Number(e.target.value))}
                      style={CLASSIC_YELLOW}
                    />
                    <span style={{ fontSize: '10px', color: '#64748b' }}>Absolute</span>

                    <label style={{ fontSize: '11px', color: '#334155' }}>Retract height:</label>
                    <input
                      type="number"
                      value={formData.linkingParameters.retractHeight}
                      onChange={(e) => updateField('linkingParameters', 'retractHeight', Number(e.target.value))}
                      style={CLASSIC_YELLOW}
                    />
                    <span style={{ fontSize: '10px', color: '#64748b' }}>Incremental</span>

                    <label style={{ fontSize: '11px', color: '#334155' }}>Feed plane:</label>
                    <input
                      type="number"
                      value={formData.linkingParameters.feedPlane}
                      onChange={(e) => updateField('linkingParameters', 'feedPlane', Number(e.target.value))}
                      style={CLASSIC_YELLOW}
                    />
                    <span style={{ fontSize: '10px', color: '#64748b' }}>Incremental</span>

                    <label style={{ fontSize: '11px', color: '#334155' }}>Top of stock:</label>
                    <input
                      type="number"
                      value={formData.linkingParameters.topOfStock}
                      onChange={(e) => updateField('linkingParameters', 'topOfStock', Number(e.target.value))}
                      style={CLASSIC_YELLOW}
                    />
                    <span style={{ fontSize: '10px', color: '#64748b' }}>Absolute</span>

                    <label style={{ fontSize: '11px', color: '#334155' }}>Total depth:</label>
                    <input
                      type="number"
                      value={formData.linkingParameters.depth}
                      onChange={(e) => updateField('linkingParameters', 'depth', Number(e.target.value))}
                      style={CLASSIC_YELLOW}
                    />
                    <span style={{ fontSize: '10px', color: '#64748b' }}>Absolute</span>
                  </div>
                </fieldset>
              </div>
            )}

            {/* Other Pages Fallback */}
            {!['tool', 'cut_parameters', 'waterline_parameters', 'model_geometry', 'transitions', 'linking_parameters'].includes(activePage) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: '#334155', fontSize: '11px' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#0f172a' }}>
                  {activePage.replace(/_/g, ' ').toUpperCase()} Configuration
                </div>
                <div style={{ padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '2px' }}>
                  Standard Argus CAM Intelligence Mill 3D Waterline Rough parameters configured and active for {activeMachine?.name || 'Fanuc Robodrill D21'}.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div
          style={{
            height: '38px',
            backgroundColor: '#e2e8f0',
            borderTop: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '0 10px',
            gap: '8px'
          }}
        >
          <button
            onClick={handleSaveAndRegenerate}
            style={{
              ...MC_BUTTON,
              background: 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)',
              borderColor: '#15803d',
              color: '#ffffff',
              fontWeight: 600,
              gap: '4px'
            }}
          >
            <Check size={13} />
            <span>OK (Save & Regenerate)</span>
          </button>

          <button
            onClick={onClose}
            style={{ ...MC_BUTTON, gap: '4px' }}
          >
            <X size={13} />
            <span>Cancel</span>
          </button>
        </div>
      </div>
    </div>
  );
}
