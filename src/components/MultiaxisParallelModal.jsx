import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Check, AlertTriangle, ShieldCheck, Cpu, Sliders,
  HelpCircle, Compass, Layers, RotateCw, Activity, Sparkles, Orbit,
  CheckCircle2, Info, MoveUpRight, Zap
} from 'lucide-react';

import {
  MULTIAXIS_PARALLEL_PAGES,
  MULTIAXIS_PARALLEL_MATERIALS,
  MULTIAXIS_PARALLEL_PRESETS,
  MULTIAXIS_PARALLEL_KINEMATICS,
  MULTIAXIS_PARALLEL_TCPM_DIALECTS,
  resolveDefaultParallelTool,
  calculateParallelPhysics,
  calculateRecommendedParallelSettings,
  DEFAULT_PARALLEL_CONFIG
} from '../config/multiaxisParallelSchema.js';

export default function MultiaxisParallelModal({
  isOpen,
  onClose,
  operation = null,
  tools = [],
  activeMachine = null,
  machines = [],
  onSelectMachine,
  stockConfig = null,
  currentModel = null,
  onSaveOperation,
  onNotify,
  onOpenToolLibrary
}) {
  if (!isOpen) return null;

  // Selected tool resolver
  const defaultTool = useMemo(() => resolveDefaultParallelTool(tools), [tools]);

  // Form State
  const [formState, setFormState] = useState(() => {
    const base = { ...DEFAULT_PARALLEL_CONFIG };
    if (defaultTool) {
      base.toolId = defaultTool.id;
      base.toolName = defaultTool.name;
      base.toolDiameter = Number(defaultTool.diameter) || 8;
      base.spindleRpm = defaultTool.rpm || 12000;
      base.feedRate = defaultTool.feedRate || 2400;
    }
    if (operation) {
      return { ...base, ...operation };
    }
    return base;
  });

  const [activePage, setActivePage] = useState('cut_pattern');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [editedPages, setEditedPages] = useState(
    new Set(['tool_holder', 'cut_pattern', 'tool_axis_control'])
  );

  // Sync when operation prop changes
  useEffect(() => {
    if (operation) {
      setFormState((prev) => ({
        ...prev,
        ...operation
      }));
    }
  }, [operation]);

  // Field updater
  const updateField = (field, value) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value
    }));
    setEditedPages((prev) => new Set(prev).add(activePage));
  };

  // Active Tool Resolution
  const selectedTool = useMemo(() => {
    const tId = formState.toolId;
    const match = tools.find((t) => String(t.id) === String(tId));
    if (match) return match;
    return (
      defaultTool || {
        id: 1,
        number: 1,
        name: '8mm 2-Flute Ball Nose Endmill',
        diameter: 8,
        flutes: 2,
        type: 'ball'
      }
    );
  }, [tools, formState.toolId, defaultTool]);

  // Real-time Physics Calculation
  const physics = useMemo(() => {
    const mat =
      MULTIAXIS_PARALLEL_MATERIALS[formState.materialId?.toUpperCase()] ||
      MULTIAXIS_PARALLEL_MATERIALS.ALU_6061;

    return calculateParallelPhysics({
      material: mat,
      tool: selectedTool,
      stepover: Number(formState.stepoverMm) || 0.35,
      feedRate: Number(formState.feedRate) || 2400,
      rpm: Number(formState.spindleRpm) || 12000,
      leadAngleDeg: Number(formState.leadAngleDeg) || 12.0,
      tiltAngleDeg: Number(formState.tiltAngleDeg) || 0.0
    });
  }, [
    formState.materialId,
    selectedTool,
    formState.stepoverMm,
    formState.feedRate,
    formState.spindleRpm,
    formState.leadAngleDeg,
    formState.tiltAngleDeg
  ]);

  // Apply Preset
  const handleApplyPreset = (presetKey) => {
    const preset = MULTIAXIS_PARALLEL_PRESETS[presetKey];
    if (!preset) return;
    setFormState((prev) => ({
      ...prev,
      ...preset,
      name: `${preset.name} - 5X Parallel`
    }));
    if (onNotify) {
      onNotify(`Applied Mastercam 5-Axis Preset: ${preset.name}`, 'info');
    }
  };

  // 1-Click "Recommended Values" Auto-Calculator
  const handleApplyRecommendedValues = () => {
    const rec = calculateRecommendedParallelSettings({
      materialId: formState.materialId,
      tool: selectedTool,
      tools
    });

    setFormState((prev) => ({
      ...prev,
      ...rec
    }));

    if (onNotify) {
      onNotify(`✨ Loaded Recommended 5-Axis Surfacing Values: ${rec.spindleRpm} RPM, ${rec.feedRate} mm/min, ${rec.leadAngleDeg}° Lead Tilt`, 'success');
    }
  };

  // Commit and Save
  const handleSave = () => {
    const payload = {
      ...formState,
      strategyKey: '5axis_parallel',
      badgeClass: 'multi_parallel',
      badgeText: '5X-PARALLEL',
      toolId: selectedTool.id,
      tool: selectedTool,
      physics,
      updatedAt: new Date().toISOString()
    };

    if (onSaveOperation) {
      onSaveOperation(payload);
    }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
        fontFamily: "'Segoe UI', Tahoma, Helvetica, sans-serif"
      }}
    >
      <div
        style={{
          width: '950px',
          maxWidth: '98vw',
          height: '710px',
          maxHeight: '94vh',
          backgroundColor: '#f0f2f5',
          border: '1px solid #717b87',
          borderRadius: '4px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontSize: '12px',
          color: '#1e293b',
          userSelect: 'none'
        }}
      >
        {/* Title Bar (Mastercam Classic Slate/Navy Header) */}
        <div
          style={{
            height: '32px',
            background: 'linear-gradient(90deg, #1e293b 0%, #334155 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 10px',
            fontSize: '12.5px',
            fontWeight: 600,
            borderBottom: '1px solid #475569',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MoveUpRight size={16} color="#d946ef" />
            <span>5-Axis Parallel (Surface Finishing) &mdash; Parameter Configuration</span>
            <span
              style={{
                fontSize: '10px',
                backgroundColor: 'rgba(217, 70, 239, 0.25)',
                color: '#f5d0fe',
                padding: '2px 6px',
                borderRadius: '3px',
                border: '1px solid rgba(217, 70, 239, 0.4)',
                fontWeight: 600
              }}
            >
              5X PARALLEL
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#cbd5e1',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '3px',
              transition: 'background 0.15s, color 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#cbd5e1';
            }}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Mastercam Action Ribbon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 12px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #cbd5e1',
            gap: '8px'
          }}
        >
          {/* Quick Presets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>Presets:</span>
            {Object.keys(MULTIAXIS_PARALLEL_PRESETS).map((k) => (
              <button
                key={k}
                onClick={() => handleApplyPreset(k)}
                style={{
                  padding: '3px 8px',
                  fontSize: '11px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '3px',
                  color: '#334155',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e2e8f0';
                  e.currentTarget.style.borderColor = '#94a3b8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f1f5f9';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
              >
                {MULTIAXIS_PARALLEL_PRESETS[k].name.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Recommended Values Button & Setup Guide */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleApplyRecommendedValues}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                fontSize: '11.5px',
                fontWeight: 600,
                color: '#86198f',
                backgroundColor: '#fdf4ff',
                border: '1px solid #f0abfc',
                borderRadius: '3px',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fae8ff';
                e.currentTarget.style.borderColor = '#e879f9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fdf4ff';
                e.currentTarget.style.borderColor = '#f0abfc';
              }}
              title="Auto-calculate optimal RPM, Feed, Lead Angle, and Stepover"
            >
              <Sparkles size={13} color="#d946ef" />
              <span>Recommended Values</span>
            </button>

            <button
              onClick={() => setIsGuideOpen(!isGuideOpen)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                fontSize: '11.5px',
                color: isGuideOpen ? '#0f766e' : '#475569',
                backgroundColor: isGuideOpen ? '#ccfbf1' : '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '3px',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              <HelpCircle size={14} color={isGuideOpen ? '#0d9488' : '#64748b'} />
              <span>Machinist Guide</span>
            </button>
          </div>
        </div>

        {/* Machinist Guide Panel (Collapsible) */}
        {isGuideOpen && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#fdf4ff',
              borderBottom: '1px solid #f0abfc',
              fontSize: '11.5px',
              color: '#701a75',
              display: 'flex',
              gap: '16px',
              alignItems: 'flex-start'
            }}
          >
            <Info size={18} color="#c026d3" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1, lineHeight: '1.45' }}>
              <strong>5-Axis Parallel Surface Finishing Guide:</strong>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '4px' }}>
                <div>
                  <strong>1. Lead Angle (&alpha; = 10&deg; - 15&deg;):</strong>
                  <br />
                  Tilts the ballnose forward along the feed path. Keeps cutting contact off the center tip (where $V_c = 0$), eliminating rubbing, extending cutter life, and creating a mirror finish.
                </div>
                <div>
                  <strong>2. Machining Angle (&theta;):</strong>
                  <br />
                  Slices across the drive surface at any angle ($0^\circ \dots 360^\circ$). $45^\circ$ balances cross-scallop uniformity on dual-curvature molds and saddle pockets.
                </div>
                <div>
                  <strong>3. 3D Blend Loop Linking:</strong>
                  <br />
                  Connects consecutive passes with smooth 3D Bezier loops. Keeps the machine feeding continuously without harsh deceleration or servo dwell marks.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Body: 2-Column Mastercam Layout */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Navigation Tree */}
          <div
            style={{
              width: '240px',
              backgroundColor: '#e9ecef',
              borderRight: '1px solid #cbd5e1',
              display: 'flex',
              flexDirection: 'column',
              padding: '8px 0',
              overflowY: 'auto'
            }}
          >
            <div
              style={{
                padding: '4px 12px 8px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              5-Axis Parameter Pages
            </div>

            {Object.entries(MULTIAXIS_PARALLEL_PAGES).map(([k, label]) => {
              const isSelected = activePage === k;
              const isEdited = editedPages.has(k);

              return (
                <div
                  key={k}
                  onClick={() => setActivePage(k)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 12px',
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#ffffff' : 'transparent',
                    color: isSelected ? '#0f172a' : '#334155',
                    fontWeight: isSelected ? 600 : 400,
                    borderLeft: isSelected ? '3px solid #d946ef' : '3px solid transparent',
                    boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.1s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = '#f1f5f9';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {label}
                  </span>
                  {isEdited && (
                    <span
                      style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        backgroundColor: '#d946ef',
                        marginLeft: '6px'
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Parameters Panel */}
          <div
            style={{
              flex: 1,
              backgroundColor: '#f8fafc',
              padding: '16px 20px',
              overflowY: 'auto',
              boxSizing: 'border-box'
            }}
          >
            {/* PAGE: Tool & Holder */}
            {activePage === 'tool_holder' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#0f172a', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                    Active Cutter Selection
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '2px' }}>Cutter Tool:</label>
                      <select
                        value={formState.toolId}
                        onChange={(e) => updateField('toolId', e.target.value)}
                        style={{ width: '100%', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px', backgroundColor: '#fff' }}
                      >
                        {tools.map((t) => (
                          <option key={t.id} value={t.id}>
                            T{t.number || 1} &mdash; {t.name} (Ø{t.diameter}mm {t.type})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '2px' }}>Cutter Diameter (mm):</label>
                      <input
                        type="number"
                        value={selectedTool?.diameter || 8}
                        disabled
                        style={{ width: '100%', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px', backgroundColor: '#f1f5f9' }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#0f172a', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                    Speeds & Feeds
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '2px' }}>Spindle Speed (RPM):</label>
                      <input
                        type="number"
                        value={formState.spindleRpm}
                        onChange={(e) => updateField('spindleRpm', Number(e.target.value))}
                        style={{ width: '100%', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px', backgroundColor: '#fff' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '2px' }}>Cutting Feed (mm/min):</label>
                      <input
                        type="number"
                        value={formState.feedRate}
                        onChange={(e) => updateField('feedRate', Number(e.target.value))}
                        style={{ width: '100%', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px', backgroundColor: '#fff' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '2px' }}>Plunge Feed (mm/min):</label>
                      <input
                        type="number"
                        value={formState.plungeFeed}
                        onChange={(e) => updateField('plungeFeed', Number(e.target.value))}
                        style={{ width: '100%', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px', backgroundColor: '#fff' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PAGE: Cut Pattern & Machining Angle */}
            {activePage === 'cut_pattern' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#0f172a', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                    Machining Angle & Stepover
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'center' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '2px' }}>
                        Machining Angle: <strong>{formState.machiningAngleDeg}&deg;</strong>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        step="5"
                        value={formState.machiningAngleDeg}
                        onChange={(e) => updateField('machiningAngleDeg', Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#d946ef' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b' }}>
                        <span>0&deg; (Along X)</span>
                        <span>45&deg; (Cross)</span>
                        <span>90&deg; (Along Y)</span>
                        <span>180&deg;</span>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '2px' }}>Stepover Distance (mm):</label>
                      <input
                        type="number"
                        step="0.05"
                        min="0.05"
                        max="5.0"
                        value={formState.stepoverMm}
                        onChange={(e) => updateField('stepoverMm', Number(e.target.value))}
                        style={{ width: '100%', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px', backgroundColor: '#fff' }}
                      />
                      <span style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px', display: 'block' }}>
                        Scallop Height: <strong>{physics.scallopMicrons} &mu;m</strong> ({physics.finishRating})
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#0f172a', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                    Cutting Motion Style
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '2px' }}>Cutting Method:</label>
                      <select
                        value={formState.cuttingMethod}
                        onChange={(e) => updateField('cuttingMethod', e.target.value)}
                        style={{ width: '100%', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px', backgroundColor: '#fff' }}
                      >
                        <option value="zigzag">Zigzag (Continuous Bi-Directional Cutting)</option>
                        <option value="oneway">One-Way (Consistent Climb Milling with Retracts)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '2px' }}>Cut Direction:</label>
                      <select
                        value={formState.cutDirection}
                        onChange={(e) => updateField('cutDirection', e.target.value)}
                        style={{ width: '100%', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px', backgroundColor: '#fff' }}
                      >
                        <option value="climb">Climb Milling (Left of Cut Path)</option>
                        <option value="conventional">Conventional Milling (Right of Cut Path)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PAGE: Tool Axis Control (Lead/Lag & Tilt) */}
            {activePage === 'tool_axis_control' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#0f172a', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                    Lead / Lag Angle (Forward Tilt along Feed Direction)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <input
                        type="range"
                        min="0"
                        max="30"
                        step="1"
                        value={formState.leadAngleDeg}
                        onChange={(e) => updateField('leadAngleDeg', Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#d946ef' }}
                      />
                    </div>
                    <div style={{ width: '80px' }}>
                      <input
                        type="number"
                        value={formState.leadAngleDeg}
                        onChange={(e) => updateField('leadAngleDeg', Number(e.target.value))}
                        style={{ width: '100%', padding: '3px 6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px', textAlign: 'center' }}
                      />
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>deg</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#059669', marginTop: '6px', backgroundColor: '#ecfdf5', padding: '6px 8px', borderRadius: '3px' }}>
                    &bull; Effective Diameter off tip: <strong>{physics.effDiameterMm} mm</strong> | Surface Speed: <strong>{physics.effVcMMin} m/min</strong>
                  </div>
                </div>

                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#0f172a', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                    Side Tilt Angle (Lateral Tilt around Feed Direction)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <input
                        type="range"
                        min="-25"
                        max="25"
                        step="1"
                        value={formState.tiltAngleDeg}
                        onChange={(e) => updateField('tiltAngleDeg', Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#d946ef' }}
                      />
                    </div>
                    <div style={{ width: '80px' }}>
                      <input
                        type="number"
                        value={formState.tiltAngleDeg}
                        onChange={(e) => updateField('tiltAngleDeg', Number(e.target.value))}
                        style={{ width: '100%', padding: '3px 6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px', textAlign: 'center' }}
                      />
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>deg</span>
                  </div>
                  <span style={{ fontSize: '10.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Tilts tool shank sideways to avoid deep pocket sidewalls and fixturing.
                  </span>
                </div>
              </div>
            )}

            {/* PAGE: Linking & 3D Blend Transitions */}
            {activePage === 'linking_transitions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#0f172a', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                    Clearance & Safe Heights
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '2px' }}>Clearance Height (mm):</label>
                      <input
                        type="number"
                        value={formState.rapidHeightMm}
                        onChange={(e) => updateField('rapidHeightMm', Number(e.target.value))}
                        style={{ width: '100%', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '2px' }}>Retract Height (mm):</label>
                      <input
                        type="number"
                        value={formState.retractHeightMm}
                        onChange={(e) => updateField('retractHeightMm', Number(e.target.value))}
                        style={{ width: '100%', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '2px' }}>Feed Plane (mm):</label>
                      <input
                        type="number"
                        value={formState.feedPlaneMm}
                        onChange={(e) => updateField('feedPlaneMm', Number(e.target.value))}
                        style={{ width: '100%', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px' }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#0f172a', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                    3D Blend Loop Linking Radius
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '2px' }}>Loop Arc Radius (mm):</label>
                      <input
                        type="number"
                        step="0.5"
                        value={formState.blendRadiusMm}
                        onChange={(e) => updateField('blendRadiusMm', Number(e.target.value))}
                        style={{ width: '100%', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px' }}
                      />
                    </div>
                  </div>
                  <span style={{ fontSize: '10.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Generates smooth continuous 3D Bezier blend loops connecting consecutive parallel passes.
                  </span>
                </div>
              </div>
            )}

            {/* PAGE: Machine Kinematics & Post Dialect */}
            {activePage === 'machine_kinematics' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#0f172a', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                    5-Axis Kinematic Machine Architecture
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {Object.values(MULTIAXIS_PARALLEL_KINEMATICS).map((k) => (
                      <label
                        key={k.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 10px',
                          borderRadius: '3px',
                          border: formState.machineKinematics === k.id ? '1px solid #d946ef' : '1px solid #cbd5e1',
                          backgroundColor: formState.machineKinematics === k.id ? '#fdf4ff' : '#ffffff',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="radio"
                          name="kinematics"
                          value={k.id}
                          checked={formState.machineKinematics === k.id}
                          onChange={(e) => updateField('machineKinematics', e.target.value)}
                          style={{ accentColor: '#d946ef' }}
                        />
                        <span style={{ fontSize: '11.5px', fontWeight: 500, color: '#1e293b' }}>{k.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#0f172a', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                    CNC Controller TCPM Dialect
                  </div>
                  <select
                    value={formState.controllerDialect}
                    onChange={(e) => updateField('controllerDialect', e.target.value)}
                    style={{ width: '100%', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px', backgroundColor: '#fff' }}
                  >
                    {Object.values(MULTIAXIS_PARALLEL_TCPM_DIALECTS).map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Other Pages Fallback */}
            {!['tool_holder', 'cut_pattern', 'tool_axis_control', 'linking_transitions', 'machine_kinematics'].includes(activePage) && (
              <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', padding: '16px' }}>
                <div style={{ fontWeight: 600, fontSize: '12px', color: '#0f172a', marginBottom: '8px' }}>
                  {MULTIAXIS_PARALLEL_PAGES[activePage]}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '2px' }}>Cut Tolerance (mm):</label>
                    <input
                      type="number"
                      step="0.001"
                      value={formState.toleranceMm || 0.005}
                      onChange={(e) => updateField('toleranceMm', Number(e.target.value))}
                      style={{ width: '100%', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '2px' }}>Stock to Leave (mm):</label>
                    <input
                      type="number"
                      step="0.05"
                      value={formState.stockToLeaveMm || 0.0}
                      onChange={(e) => updateField('stockToLeaveMm', Number(e.target.value))}
                      style={{ width: '100%', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Status Bar (Physics HUD & Action Buttons) */}
        <div
          style={{
            height: '42px',
            backgroundColor: '#ffffff',
            borderTop: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 12px',
            boxSizing: 'border-box'
          }}
        >
          {/* Real-time Physics & Geometry Feedback */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#475569' }}>
              <span style={{ fontWeight: 500 }}>Material:</span>
              <select
                value={formState.materialId}
                onChange={(e) => updateField('materialId', e.target.value)}
                style={{
                  padding: '2px 6px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '3px',
                  color: '#0f172a',
                  fontWeight: 600,
                  fontSize: '11px',
                  outline: 'none'
                }}
              >
                {Object.values(MULTIAXIS_PARALLEL_MATERIALS).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name.split(' ')[0]}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ width: '1px', height: '18px', backgroundColor: '#cbd5e1' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: '#334155' }}>
              <span>
                Eff. Dia: <strong style={{ color: '#0f172a' }}>{physics.effDiameterMm} mm</strong>
              </span>
              <span>
                Eff. Vc: <strong style={{ color: '#0f172a' }}>{physics.effVcMMin} m/min</strong>
              </span>
              <span>
                Scallop: <strong style={{ color: '#d946ef' }}>{physics.scallopMicrons} &mu;m</strong> ({physics.finishRating})
              </span>
              <span>
                MRR: <strong style={{ color: '#0f172a' }}>{physics.mrr}</strong> cm&sup3;/min
              </span>
            </div>
          </div>

          {/* Action Buttons: Cancel & Commit */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 12px',
                fontSize: '11.5px',
                fontWeight: 500,
                color: '#334155',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '3px',
                cursor: 'pointer',
                transition: 'background 0.1s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
            >
              <X size={14} color="#dc2626" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 16px',
                fontSize: '11.5px',
                fontWeight: 600,
                color: '#ffffff',
                background: 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)',
                border: '1px solid #166534',
                borderRadius: '3px',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                transition: 'filter 0.15s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
            >
              <Check size={15} color="#ffffff" />
              Generate Parallel Toolpath
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
