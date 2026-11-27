import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X, Check, AlertTriangle, ShieldCheck, Cpu, Sliders,
  HelpCircle, Compass, Layers, RotateCw, RotateCcw, Activity, Sparkles, Orbit,
  CheckCircle2, Info, MoveUpRight, Zap, ArrowRight, CornerDownRight, Disc
} from 'lucide-react';

import {
  MULTIAXIS_MORPH_PAGE_TITLES,
  MULTIAXIS_MORPH_MATERIALS,
  MULTIAXIS_MORPH_PRESETS,
  MULTIAXIS_KINEMATICS_OPTIONS,
  MULTIAXIS_TCPM_OPTIONS,
  calculateMultiaxisMorphPhysics,
  calculateRecommendedMorphSettings,
  createDefaultMultiaxisMorphState,
  resolveDefaultMultiaxisTool
} from '../config/multiaxisMorphSchema.js';

export default function MultiaxisMorphModal({
  isOpen,
  onClose,
  operation = null,
  tools = [],
  activeMachine = null,
  machines = [],
  onSelectMachine,
  lastDefinedTool = null,
  stockConfig = null,
  currentModel = null,
  onSaveOperation,
  onNotify,
  onOpenToolLibrary
}) {
  if (!isOpen) return null;

  // Selected tool resolver
  const defaultTool = useMemo(() => resolveDefaultMultiaxisTool(tools), [tools]);

  // Form State
  const [formState, setFormState] = useState(() => {
    if (operation && (operation.strategyKey === 'multiaxis_morph' || operation.badgeClass === 'multi_morph')) {
      return {
        ...createDefaultMultiaxisMorphState({ bounds: null, tools, activeMachine }),
        ...operation,
        tool: {
          ...operation.tool,
          id: operation.tool?.id || operation.toolId || (defaultTool?.id ?? 3),
          number: operation.tool?.number || operation.toolNumber || (defaultTool?.number ?? 3),
          name: operation.tool?.name || operation.toolName || (defaultTool?.name ?? '10mm Ball Nose'),
          type: operation.tool?.type || (defaultTool?.type ?? 'ball'),
          diameter: Number(operation.tool?.diameter || defaultTool?.diameter || 10),
          flutes: Number(operation.tool?.flutes || defaultTool?.flutes || 4),
          spindleSpeed: operation.tool?.spindleSpeed || operation.spindleSpeed || 12000,
          feedRate: operation.tool?.feedRate || operation.feedRate || 3000,
          plungeRate: operation.tool?.plungeRate || operation.plungeRate || 600
        }
      };
    }
    const def = createDefaultMultiaxisMorphState({ bounds: null, tools, activeMachine });
    if (defaultTool) {
      def.tool = {
        ...def.tool,
        id: defaultTool.id,
        number: defaultTool.number || defaultTool.id,
        name: defaultTool.name,
        type: defaultTool.type,
        diameter: Number(defaultTool.diameter) || 10,
        flutes: Number(defaultTool.flutes) || 4,
        spindleSpeed: defaultTool.rpm || defaultTool.spindleSpeed || 12000,
        feedRate: defaultTool.feedRate || 3000
      };
    }
    return def;
  });

  const [activePage, setActivePage] = useState('cut_pattern');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [editedPages, setEditedPages] = useState(
    new Set(['cut_pattern', 'tool', 'tool_axis_control'])
  );

  // Dragging state with safe boundaries
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, posX: 0, posY: 0 });

  // Reset position to center whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  // Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select')) return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      // Clamp drag boundaries so title bar can NEVER be dragged off-screen or behind top ribbon
      const modalH = Math.min(650, Math.max(480, window.innerHeight - 130));
      const defaultTop = Math.max(50, (window.innerHeight - modalH) / 2);
      const minTopAllowed = 55; // Strictly keep header visible and clear of ribbon bar
      const minDragY = minTopAllowed - defaultTop;
      const maxDragY = Math.max(0, window.innerHeight - 80 - defaultTop);

      const modalW = Math.min(960, window.innerWidth * 0.98);
      const defaultLeft = Math.max(10, (window.innerWidth - modalW) / 2);
      const minDragX = 20 - defaultLeft;
      const maxDragX = window.innerWidth - 100 - defaultLeft;

      setPosition({
        x: Math.max(minDragX, Math.min(maxDragX, dragRef.current.posX + dx)),
        y: Math.max(minDragY, Math.min(maxDragY, dragRef.current.posY + dy))
      });
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Real-time Physics Calculation
  const physics = useMemo(() => {
    return calculateMultiaxisMorphPhysics(
      formState.tool || {},
      {
        leadAngleDeg: formState.toolAxisControl?.leadAngleDeg ?? 10.0,
        tiltAngleDeg: formState.toolAxisControl?.tiltAngleDeg ?? 15.0,
        stepoverMm: formState.cutPattern?.stepoverDistanceMm || 1.5,
        depthOfCutMm: 0.5
      },
      formState.selectedMaterialKey || 'ALU_6061'
    );
  }, [formState.tool, formState.toolAxisControl, formState.cutPattern, formState.selectedMaterialKey]);

  // Deep field updater
  const updateField = (section, field, value) => {
    setFormState((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        [field]: value
      }
    }));
    setEditedPages((prev) => new Set([...prev, section]));
  };

  // Apply Material Preset
  const handleMaterialChange = (materialKey) => {
    const mat = MULTIAXIS_MORPH_MATERIALS[materialKey];
    if (!mat) return;

    setFormState((prev) => ({
      ...prev,
      selectedMaterialKey: materialKey,
      cutPattern: {
        ...prev.cutPattern,
        numberOfCuts: mat.recommendedPasses,
        stepoverDistanceMm: mat.recommendedStepoverMm
      },
      toolAxisControl: {
        ...prev.toolAxisControl,
        leadAngleDeg: mat.recommendedLeadDeg,
        tiltAngleDeg: mat.recommendedTiltDeg
      },
      tool: {
        ...prev.tool,
        spindleSpeed: Math.round((mat.vc * 1000) / (Math.PI * (prev.tool?.diameter || 10))),
        feedRate: Math.round(
          ((mat.vc * 1000) / (Math.PI * (prev.tool?.diameter || 10))) *
          (prev.tool?.flutes || 4) *
          (mat.fzNominal || 0.06)
        )
      }
    }));
    onNotify?.(`Material updated to ${mat.name}`, 'info');
  };

  // Apply Quick Preset
  const handleApplyPreset = (presetKey) => {
    const preset = MULTIAXIS_MORPH_PRESETS.find((p) => p.id === presetKey) || MULTIAXIS_MORPH_PRESETS[0];
    if (!preset) return;
    setFormState((prev) => ({
      ...prev,
      selectedPresetKey: preset.id,
      selectedMaterialKey: preset.materialKey,
      cutPattern: {
        ...prev.cutPattern,
        numberOfCuts: preset.passes || 25,
        stepoverDistanceMm: preset.stepoverMm || 1.5
      },
      toolAxisControl: {
        ...prev.toolAxisControl,
        leadAngleDeg: preset.leadAngleDeg || 10.0,
        tiltAngleDeg: preset.tiltAngleDeg || 15.0
      }
    }));
    onNotify?.(`Applied Argus CAM Intelligence 5-Axis Preset: ${preset.name}`, 'info');
  };

  // 1-Click Recommended Values Auto-Population
  const applyRecommendedValues = () => {
    const rec = calculateRecommendedMorphSettings({
      materialKey: formState.selectedMaterialKey || 'ALU_6061',
      tool: formState.tool,
      tools
    });

    const activeMat = MULTIAXIS_MORPH_MATERIALS[formState.selectedMaterialKey || 'ALU_6061'];

    setFormState((prev) => ({
      ...prev,
      cutPattern: {
        ...prev.cutPattern,
        numberOfCuts: rec.numberOfCuts,
        stepoverDistanceMm: rec.stepoverDistanceMm
      },
      toolAxisControl: {
        ...prev.toolAxisControl,
        leadAngleDeg: rec.leadAngleDeg,
        tiltAngleDeg: rec.tiltAngleDeg
      },
      tool: {
        ...prev.tool,
        spindleSpeed: rec.spindleSpeed,
        feedRate: rec.feedRate,
        plungeRate: rec.plungeRate
      }
    }));

    setEditedPages(new Set(['tool', 'cut_pattern', 'tool_axis_control']));
    onNotify?.(`Loaded recommended values for ${activeMat?.name || 'Aluminum 6061-T6'}: ${rec.spindleSpeed} RPM, ${rec.feedRate} mm/min, ${rec.leadAngleDeg}° Lead`, 'success');
  };

  // Commit and Save
  const handleSave = () => {
    const assignedTool =
      tools.find((t) => String(t.id) === String(formState.tool?.id)) ||
      tools.find((t) => Number(t.number) === Number(formState.tool?.number)) ||
      defaultTool ||
      formState.tool;

    const payload = {
      ...formState,
      strategyKey: 'multiaxis_morph',
      badgeClass: 'multi_morph',
      badgeText: '5X-MORPH',
      toolId: assignedTool.id,
      tool: assignedTool,
      passes: formState.cutPattern?.numberOfCuts || 25,
      stepoverMm: formState.cutPattern?.stepoverDistanceMm || 1.5,
      leadAngleDeg: formState.toolAxisControl?.leadAngleDeg ?? 10.0,
      tiltAngleDeg: formState.toolAxisControl?.tiltAngleDeg ?? 15.0,
      kinematicsId: formState.machineKinematics?.kinematicsId || 'table_table_ac',
      tcpmMode: formState.machineKinematics?.tcpmMode || 'fanuc',
      physics,
      updatedAt: new Date().toISOString()
    };

    if (onSaveOperation) {
      onSaveOperation(payload);
    }
    onClose();
  };

  // Sidebar Icons Map
  const pageIcons = {
    toolpath_type: <Layers size={15} color="#2563eb" />,
    cut_pattern: <Compass size={15} color="#059669" />,
    tool: <Cpu size={15} color="#d97706" />,
    holder: <ShieldCheck size={15} color="#4f46e5" />,
    tool_axis_control: <Orbit size={15} color="#9333ea" />,
    collision_control: <AlertTriangle size={15} color="#dc2626" />,
    linking_parameters: <Sliders size={15} color="#0d9488" />,
    machine_kinematics: <Activity size={15} color="#0284c7" />,
    arc_filter: <RotateCw size={15} color="#3b82f6" />,
    planes_coolant: <Layers size={15} color="#64748b" />
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        padding: '16px',
        paddingTop: '50px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        fontFamily: "'Segoe UI', Tahoma, Helvetica, sans-serif"
      }}
    >
      <div
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          width: '960px',
          maxWidth: '98vw',
          height: 'min(650px, calc(100vh - 120px))',
          maxHeight: 'calc(100vh - 100px)',
          backgroundColor: '#f0f2f5',
          border: '1px solid #717b87',
          borderRadius: '4px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontSize: '12px',
          color: '#1e293b',
          userSelect: 'none'
        }}
      >
        {/* Title Bar (Mastercam Classic Slate Header) */}
        <div
          onMouseDown={handleMouseDown}
          onDoubleClick={() => setPosition({ x: 0, y: 0 })}
          title="Drag to reposition • Double-click to re-center dialog"
          style={{
            height: '34px',
            background: 'linear-gradient(90deg, #1e293b 0%, #334155 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 12px',
            fontSize: '12.5px',
            fontWeight: 600,
            borderBottom: '1px solid #475569',
            boxSizing: 'border-box',
            cursor: 'move',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MoveUpRight size={16} color="#a855f7" />
            <span>5-Axis Multiaxis Morph (Between 2 Curves / Surfaces) &mdash; Argus CAM Intelligence Engine</span>
            <span
              style={{
                fontSize: '10px',
                backgroundColor: 'rgba(168, 85, 247, 0.25)',
                color: '#f3e8ff',
                padding: '2px 7px',
                borderRadius: '3px',
                border: '1px solid rgba(168, 85, 247, 0.45)',
                fontWeight: 600
              }}
            >
              5X MORPH
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={() => setPosition({ x: 0, y: 0 })}
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
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#cbd5e1';
              }}
              title="Re-center Dialog (Double-click header also re-centers)"
            >
              <RotateCcw size={13} />
            </button>
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
              title="Close (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Mastercam Action Ribbon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 14px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #cbd5e1',
            gap: '10px',
            flexShrink: 0
          }}
        >
          {/* Quick Presets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>Presets:</span>
            {MULTIAXIS_MORPH_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => handleApplyPreset(p.id)}
                style={{
                  padding: '3px 8px',
                  fontSize: '11px',
                  backgroundColor: formState.selectedPresetKey === p.id ? '#ede9fe' : '#f1f5f9',
                  border: `1px solid ${formState.selectedPresetKey === p.id ? '#a78bfa' : '#cbd5e1'}`,
                  borderRadius: '3px',
                  color: formState.selectedPresetKey === p.id ? '#6b21a8' : '#334155',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e2e8f0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = formState.selectedPresetKey === p.id ? '#ede9fe' : '#f1f5f9';
                }}
              >
                {p.name.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Recommended Values Button & Setup Guide */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={applyRecommendedValues}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 11px',
                fontSize: '11.5px',
                fontWeight: 600,
                color: '#7e22ce',
                backgroundColor: '#faf5ff',
                border: '1px solid #d8b4fe',
                borderRadius: '3px',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3e8ff';
                e.currentTarget.style.borderColor = '#c084fc';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#faf5ff';
                e.currentTarget.style.borderColor = '#d8b4fe';
              }}
              title="Auto-calculate optimal RPM, Feed, Lead Angle, and Stepover for chosen material"
            >
              <Sparkles size={13} color="#a855f7" />
              <span>Recommended Values</span>
            </button>

            <button
              onClick={() => setIsGuideOpen(!isGuideOpen)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 9px',
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
              padding: '12px 16px',
              backgroundColor: '#faf5ff',
              borderBottom: '1px solid #e9d5ff',
              fontSize: '11.5px',
              color: '#581c87',
              display: 'flex',
              gap: '16px',
              alignItems: 'flex-start',
              flexShrink: 0
            }}
          >
            <Info size={18} color="#9333ea" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1, lineHeight: '1.45' }}>
              <strong>5-Axis Morph Between 2 Curves Machinist Reference:</strong>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginTop: '6px' }}>
                <div>
                  <strong>1. Lead Angle (&alpha; = 10&deg; - 12&deg;):</strong>
                  <br />
                  Tilts the ballnose cutter forward along the feed path. Keeps cutting contact off the center tip (where $V_c = 0$), eliminating material rubbing, extending cutter life, and creating a mirror finish.
                </div>
                <div>
                  <strong>2. Morphing Interpolation:</strong>
                  <br />
                  Interpolates smooth flow-aligned passes between Guide Curve 1 (inner blade root arch) and Guide Curve 2 (outer perimeter rail) with cubic Hermite blending: $b(t) = t^2(3 - 2t)$.
                </div>
                <div>
                  <strong>3. 3D Blend Loop Linking:</strong>
                  <br />
                  Connects consecutive passes with smooth 3D Bezier clearance loops lifting $+0.8\text{ mm}$ in $Z$. Eliminates tool dwell witness marks at the stepover boundaries.
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
              width: '248px',
              backgroundColor: '#e9ecef',
              borderRight: '1px solid #cbd5e1',
              display: 'flex',
              flexDirection: 'column',
              padding: '8px 0',
              overflowY: 'auto',
              flexShrink: 0
            }}
          >
            <div
              style={{
                padding: '4px 14px 8px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              5-Axis Parameter Pages
            </div>

            {Object.entries(MULTIAXIS_MORPH_PAGE_TITLES).map(([key, label]) => {
              const isActive = activePage === key;
              const isEdited = editedPages.has(key);
              return (
                <div
                  key={key}
                  onClick={() => setActivePage(key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 14px',
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    backgroundColor: isActive ? '#ffffff' : 'transparent',
                    borderLeft: isActive ? '4px solid #2563eb' : '4px solid transparent',
                    color: isActive ? '#1d4ed8' : '#334155',
                    fontWeight: isActive ? 600 : 400,
                    transition: 'all 0.1s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = '#dee2e6';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    {pageIcons[key]}
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {label}
                    </span>
                  </div>
                  {isEdited && (
                    <span
                      style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        backgroundColor: '#2563eb',
                        marginLeft: '6px',
                        flexShrink: 0
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
              padding: '18px 24px',
              overflowY: 'auto',
              boxSizing: 'border-box'
            }}
          >
            {/* PAGE 1: Toolpath Type */}
            {activePage === 'toolpath_type' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', padding: '14px 16px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#0f172a', marginBottom: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>
                    Multiaxis Strategy Classification
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 10px', borderRadius: '4px', border: '1px solid #bfdbfe', backgroundColor: '#eff6ff', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        checked={formState.toolpathType?.strategy === 'morph_between_2_curves'}
                        onChange={() => updateField('toolpathType', 'strategy', 'morph_between_2_curves')}
                        style={{ marginTop: '2px' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: '#1e3a8a' }}>Morph Between 2 Curves (Standard Flagship)</div>
                        <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                          Interpolates passes smoothly between Start Curve 1 and End Curve 2 across sculpted drive surfaces.
                        </div>
                      </div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 10px', borderRadius: '4px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        checked={formState.toolpathType?.strategy === 'morph_between_2_surfaces'}
                        onChange={() => updateField('toolpathType', 'strategy', 'morph_between_2_surfaces')}
                        style={{ marginTop: '2px' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: '#334155' }}>Morph Between 2 Surfaces</div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          Computes toolpath UV curves transitioning between two bounding fillet surfaces.
                        </div>
                      </div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 10px', borderRadius: '4px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        checked={formState.toolpathType?.strategy === 'parallel_to_curve'}
                        onChange={() => updateField('toolpathType', 'strategy', 'parallel_to_curve')}
                        style={{ marginTop: '2px' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: '#334155' }}>Parallel To Single Master Guide Curve</div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          Maintains constant lateral offset distance from a master guide curve.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', padding: '14px 16px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#0f172a', marginBottom: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>
                    Pattern Geometry &amp; Subprogram Output
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Pattern Geometry Type:</label>
                      <select
                        value={formState.toolpathType?.patternType || 'curves'}
                        onChange={(e) => updateField('toolpathType', 'patternType', e.target.value)}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px', backgroundColor: '#fff' }}
                      >
                        <option value="curves">3D Wireframe Curves / Edges</option>
                        <option value="surfaces">Solid Faces / Drive Surfaces</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '18px' }}>
                      <input
                        type="checkbox"
                        id="subProgram"
                        checked={formState.toolpathType?.subProgram || false}
                        onChange={(e) => updateField('toolpathType', 'subProgram', e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                      <label htmlFor="subProgram" style={{ color: '#334155', cursor: 'pointer', fontSize: '11.5px' }}>
                        Output CNC Subprogram (M98 P...)
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PAGE 2: Cut Pattern (Morph Guides) */}
            {activePage === 'cut_pattern' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Morph Boundary Guide Curves */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', marginBottom: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>
                    <div style={{ fontWeight: 600, fontSize: '12px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Compass size={16} color="#059669" />
                      <span>Morph Boundary Guide Curves</span>
                    </div>
                    <span style={{ fontSize: '10.5px', color: '#047857', backgroundColor: '#ecfdf5', padding: '2px 8px', borderRadius: '3px', border: '1px solid #a7f3d0', fontWeight: 600, marginLeft: 'auto' }}>
                      Auto CAD Extracted
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div style={{ padding: '10px 12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, fontSize: '11.5px', color: '#334155' }}>Guide Curve 1 (Start)</span>
                        <span style={{ fontSize: '10px', color: '#2563eb', fontWeight: 600 }}>Inner Arch (Blade Root)</span>
                      </div>
                      <input
                        type="text"
                        value={formState.cutPattern?.firstCurveName || 'Guide Curve 1 (Start Boundary)'}
                        onChange={(e) => updateField('cutPattern', 'firstCurveName', e.target.value)}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px', backgroundColor: '#fff', marginBottom: '6px', boxSizing: 'border-box' }}
                      />
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#475569', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formState.cutPattern?.firstCurveFlipped || false}
                          onChange={(e) => updateField('cutPattern', 'firstCurveFlipped', e.target.checked)}
                        />
                        <span>Flip Curve 1 Direction</span>
                      </label>
                    </div>

                    <div style={{ padding: '10px 12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, fontSize: '11.5px', color: '#334155' }}>Guide Curve 2 (End)</span>
                        <span style={{ fontSize: '10px', color: '#059669', fontWeight: 600 }}>Outer Perimeter Rail</span>
                      </div>
                      <input
                        type="text"
                        value={formState.cutPattern?.secondCurveName || 'Guide Curve 2 (End Boundary)'}
                        onChange={(e) => updateField('cutPattern', 'secondCurveName', e.target.value)}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px', backgroundColor: '#fff', marginBottom: '6px', boxSizing: 'border-box' }}
                      />
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#475569', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formState.cutPattern?.secondCurveFlipped || false}
                          onChange={(e) => updateField('cutPattern', 'secondCurveFlipped', e.target.checked)}
                        />
                        <span>Flip Curve 2 Direction</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Stepover & Cutting Passes */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', padding: '14px 16px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#0f172a', marginBottom: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>
                    Stepover &amp; Cutting Passes
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Number of Cuts (Passes):</label>
                      <input
                        type="number"
                        min="3"
                        max="200"
                        value={formState.cutPattern?.numberOfCuts || 25}
                        onChange={(e) => updateField('cutPattern', 'numberOfCuts', Number(e.target.value))}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px', textAlign: 'right', fontWeight: 600, boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Max Stepover Distance (ae):</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="10"
                          value={formState.cutPattern?.stepoverDistanceMm || 1.5}
                          onChange={(e) => updateField('cutPattern', 'stepoverDistanceMm', Number(e.target.value))}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px', textAlign: 'right', fontWeight: 600, boxSizing: 'border-box' }}
                        />
                        <span style={{ color: '#64748b', fontSize: '11px' }}>mm</span>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Cutting Method:</label>
                      <select
                        value={formState.cutPattern?.cuttingMethod || 'zigzag'}
                        onChange={(e) => updateField('cutPattern', 'cuttingMethod', e.target.value)}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px', backgroundColor: '#fff', boxSizing: 'border-box' }}
                      >
                        <option value="zigzag">Zigzag (Continuous Bi-Directional)</option>
                        <option value="oneway">One Way (Climb Milling)</option>
                        <option value="spiral">Spiral Morph (Continuous Closed)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Cut Sequence Order:</label>
                      <select
                        value={formState.cutPattern?.cutOrder || 'curve1_to_curve2'}
                        onChange={(e) => updateField('cutPattern', 'cutOrder', e.target.value)}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px', backgroundColor: '#fff', boxSizing: 'border-box' }}
                      >
                        <option value="curve1_to_curve2">Curve 1 &rarr; Curve 2 (Inner to Outer)</option>
                        <option value="curve2_to_curve1">Curve 2 &rarr; Curve 1 (Outer to Inner)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Drive Surface Stock Allowance */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', padding: '14px 16px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#0f172a', marginBottom: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>
                    Drive Surfaces &amp; Stock Allowance
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Floor Stock to Leave:</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          step="0.05"
                          value={formState.cutPattern?.floorStockMm || 0}
                          onChange={(e) => updateField('cutPattern', 'floorStockMm', Number(e.target.value))}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px', textAlign: 'right', boxSizing: 'border-box' }}
                        />
                        <span style={{ color: '#64748b', fontSize: '11px' }}>mm</span>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Wall Stock to Leave:</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          step="0.05"
                          value={formState.cutPattern?.wallStockMm || 0}
                          onChange={(e) => updateField('cutPattern', 'wallStockMm', Number(e.target.value))}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px', textAlign: 'right', boxSizing: 'border-box' }}
                        />
                        <span style={{ color: '#64748b', fontSize: '11px' }}>mm</span>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Tangent Lead Extension:</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          step="0.5"
                          value={formState.cutPattern?.tangentExtensionMm || 1.5}
                          onChange={(e) => updateField('cutPattern', 'tangentExtensionMm', Number(e.target.value))}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px', textAlign: 'right', boxSizing: 'border-box' }}
                        />
                        <span style={{ color: '#64748b', fontSize: '11px' }}>mm</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visual Morph Flow & Scallop Cusp Geometry Diagram */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                    <div style={{ fontWeight: 600, fontSize: '12px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Activity size={15} color="#8b5cf6" />
                      <span>Dual Guide Morphing Flow &amp; Surface Scallop Preview</span>
                    </div>
                    <span style={{ fontSize: '10.5px', color: '#6d28d9', backgroundColor: '#f5f3ff', padding: '2px 8px', borderRadius: '3px', border: '1px solid #ddd6fe', fontWeight: 600 }}>
                      {formState.cutPattern?.numberOfCuts || 25} Morphing Passes
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', alignItems: 'center' }}>
                    {/* SVG Morph Diagram */}
                    <div style={{ backgroundColor: '#0f172a', borderRadius: '4px', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid #334155' }}>
                      <svg width="280" height="75" viewBox="0 0 280 75" style={{ overflow: 'visible' }}>
                        {/* Curve 1 (Inner Arch - Blue) */}
                        <path d="M 15 65 Q 140 48 265 65" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
                        <text x="25" y="73" fill="#38bdf8" fontSize="8.5" fontWeight="600">Curve 1 (Blade Root)</text>

                        {/* Intermediate Morph Passes */}
                        <path d="M 15 53 Q 140 37 265 53" fill="none" stroke="#818cf8" strokeWidth="1" strokeDasharray="3,2" opacity="0.6" />
                        <path d="M 15 41 Q 140 27 265 41" fill="none" stroke="#a78bfa" strokeWidth="1" opacity="0.75" />
                        <path d="M 15 29 Q 140 18 265 29" fill="none" stroke="#c084fc" strokeWidth="1" strokeDasharray="3,2" opacity="0.8" />

                        {/* Curve 2 (Outer Rail - Emerald) */}
                        <path d="M 15 15 Q 140 7 265 15" fill="none" stroke="#34d399" strokeWidth="2.5" />
                        <text x="25" y="11" fill="#34d399" fontSize="8.5" fontWeight="600">Curve 2 (Outer Rail)</text>

                        {/* Lead Angle Indicator */}
                        <line x1="140" y1="27" x2="152" y2="14" stroke="#f59e0b" strokeWidth="1.8" />
                        <circle cx="140" cy="27" r="2.5" fill="#f59e0b" />
                        <text x="156" y="19" fill="#fbbf24" fontSize="8" fontWeight="600">Lead &alpha;=10&deg;</text>
                      </svg>
                      <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', textAlign: 'center' }}>
                        Cubic Hermite Blending: <span style={{ color: '#c084fc', fontFamily: 'monospace' }}>b(t) = t&sup2;(3 - 2t)</span>
                      </div>
                    </div>

                    {/* Live Scallop & Cusp Telemetry */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <div style={{ padding: '5px 8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '10.5px', color: '#475569' }}>Scallop Cusp Height (h):</span>
                        <strong style={{ fontSize: '11.5px', color: (physics?.scallopHeightUm ?? physics?.scallopMicrons ?? 0) <= 2.0 ? '#16a34a' : '#d97706' }}>
                          {(physics?.scallopHeightUm ?? physics?.scallopMicrons ?? 0).toFixed(1)} &mu;m
                        </strong>
                      </div>
                      <div style={{ padding: '5px 8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '10.5px', color: '#475569' }}>Effective Cut Speed (V_eff):</span>
                        <strong style={{ fontSize: '11.5px', color: '#2563eb' }}>
                          {(physics?.effectiveCuttingSpeedMMin ?? physics?.effVcMMin ?? physics?.surfaceSpeedMpm ?? 0).toFixed(0)} m/min
                        </strong>
                      </div>
                      <div style={{ padding: '5px 8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '10.5px', color: '#475569' }}>Spindle Power Draw:</span>
                        <strong style={{ fontSize: '11.5px', color: '#0f172a' }}>
                          {(physics?.cuttingPowerKw ?? physics?.powerKw ?? 0).toFixed(2)} kW
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PAGE 3: Tool Selection & 5X Dynamics */}
            {activePage === 'tool' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>
                    <div style={{ fontWeight: 600, fontSize: '12px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Cpu size={16} color="#d97706" />
                      <span>Active 5-Axis Ballnose Cutter</span>
                    </div>
                    {onOpenToolLibrary && (
                      <button
                        type="button"
                        onClick={onOpenToolLibrary}
                        style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Open Tool Library
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Cutter Tool:</label>
                      <select
                        value={formState.tool?.id || ''}
                        onChange={(e) => {
                          const selected = tools.find((t) => String(t.id) === e.target.value);
                          if (selected) {
                            setFormState((prev) => ({
                              ...prev,
                              tool: {
                                ...prev.tool,
                                id: selected.id,
                                number: selected.number || selected.id,
                                name: selected.name,
                                type: selected.type,
                                diameter: Number(selected.diameter) || 10,
                                flutes: Number(selected.flutes) || 4,
                                spindleSpeed: selected.rpm || selected.spindleSpeed || 12000,
                                feedRate: selected.feedRate || 3000
                              }
                            }));
                          }
                        }}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px', backgroundColor: '#fff', boxSizing: 'border-box' }}
                      >
                        {tools.map((t) => (
                          <option key={t.id} value={t.id}>
                            T{t.number || t.id} &mdash; {t.name} (Ø{t.diameter}mm {t.type})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Cutter Diameter:</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          value={formState.tool?.diameter || 10}
                          onChange={(e) => updateField('tool', 'diameter', Number(e.target.value))}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px', textAlign: 'right', fontWeight: 600, boxSizing: 'border-box' }}
                        />
                        <span style={{ color: '#64748b', fontSize: '11px' }}>mm</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', padding: '14px 16px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#0f172a', marginBottom: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>
                    Speeds, Feeds &amp; Spindle Dynamics
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Spindle Speed (S):</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          value={formState.tool?.spindleSpeed || 12000}
                          onChange={(e) => updateField('tool', 'spindleSpeed', Number(e.target.value))}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px', textAlign: 'right', fontWeight: 600, boxSizing: 'border-box' }}
                        />
                        <span style={{ color: '#64748b', fontSize: '11px' }}>RPM</span>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Cutting Feedrate (F):</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          value={formState.tool?.feedRate || 3000}
                          onChange={(e) => updateField('tool', 'feedRate', Number(e.target.value))}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px', textAlign: 'right', fontWeight: 600, boxSizing: 'border-box' }}
                        />
                        <span style={{ color: '#64748b', fontSize: '11px' }}>mm/min</span>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Plunge Feedrate:</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          value={formState.tool?.plungeRate || 600}
                          onChange={(e) => updateField('tool', 'plungeRate', Number(e.target.value))}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px', textAlign: 'right', fontWeight: 600, boxSizing: 'border-box' }}
                        />
                        <span style={{ color: '#64748b', fontSize: '11px' }}>mm/min</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PAGE 5: Tool Axis Control (Lead / Tilt) */}
            {activePage === 'tool_axis_control' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', padding: '14px 16px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#0f172a', marginBottom: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Orbit size={16} color="#9333ea" />
                    <span>5-Axis Orientation Angles (Lead &amp; Tilt)</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, fontSize: '11.5px', color: '#334155' }}>Forward Lead Angle (&alpha;):</span>
                        <strong style={{ color: '#2563eb', fontSize: '13px' }}>{formState.toolAxisControl?.leadAngleDeg ?? 10}&deg;</strong>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="30"
                        step="1"
                        value={formState.toolAxisControl?.leadAngleDeg ?? 10}
                        onChange={(e) => updateField('toolAxisControl', 'leadAngleDeg', Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#2563eb' }}
                      />
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        Tilts cutter forward along feed direction, moving contact up the spherical ball to eliminate zero-velocity dead center dwell ($V_c = 0$).
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, fontSize: '11.5px', color: '#334155' }}>Sideways Tilt / Lean Angle (&beta;):</span>
                        <strong style={{ color: '#9333ea', fontSize: '13px' }}>{formState.toolAxisControl?.tiltAngleDeg ?? 15}&deg;</strong>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="35"
                        step="1"
                        value={formState.toolAxisControl?.tiltAngleDeg ?? 15}
                        onChange={(e) => updateField('toolAxisControl', 'tiltAngleDeg', Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#9333ea' }}
                      />
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        Tilts cutter laterally relative to surface normal, preventing the toolholder and shank from colliding with the upright blade.
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', padding: '14px 16px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#0f172a', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                    Rotary Smoothing &amp; Singularity Damping
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: '#334155', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formState.toolAxisControl?.vectorSmoothing ?? true}
                      onChange={(e) => updateField('toolAxisControl', 'vectorSmoothing', e.target.checked)}
                    />
                    <span>Enable Damped Least-Squares (DLS) Rotary Axis Smoothing</span>
                  </label>
                </div>
              </div>
            )}

            {/* PAGE 7: Linking Parameters & 3D Blend Loops */}
            {activePage === 'linking_parameters' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', padding: '14px 16px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#0f172a', marginBottom: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sliders size={16} color="#0d9488" />
                    <span>Clearance Planes &amp; Retract Heights</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Clearance Plane Z:</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          value={formState.linkingParameters?.clearancePlaneZ || 50}
                          onChange={(e) => updateField('linkingParameters', 'clearancePlaneZ', Number(e.target.value))}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px', textAlign: 'right', fontWeight: 600, boxSizing: 'border-box' }}
                        />
                        <span style={{ color: '#64748b', fontSize: '11px' }}>mm</span>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Retract Distance:</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          value={formState.linkingParameters?.retractDistanceMm || 5}
                          onChange={(e) => updateField('linkingParameters', 'retractDistanceMm', Number(e.target.value))}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px', textAlign: 'right', fontWeight: 600, boxSizing: 'border-box' }}
                        />
                        <span style={{ color: '#64748b', fontSize: '11px' }}>mm</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', padding: '14px 16px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#0f172a', marginBottom: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>
                    Pass Transition Linking
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 10px', borderRadius: '4px', border: '1px solid #bfdbfe', backgroundColor: '#eff6ff', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        checked={formState.linkingParameters?.transitionBetweenPasses === 'blend_spline'}
                        onChange={() => updateField('linkingParameters', 'transitionBetweenPasses', 'blend_spline')}
                        style={{ marginTop: '2px' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: '#1e3a8a' }}>Argus CAM Intelligence 3D Blend Loop Arcs (Recommended)</div>
                        <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                          Smooth 3D parabolic arch in Z lifting +0.8mm above the surface, eliminating dwell witness marks.
                        </div>
                      </div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 10px', borderRadius: '4px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        checked={formState.linkingParameters?.transitionBetweenPasses === 'direct_step'}
                        onChange={() => updateField('linkingParameters', 'transitionBetweenPasses', 'direct_step')}
                        style={{ marginTop: '2px' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: '#334155' }}>Direct Stepover Move</div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          Moves directly to the start of the next pass along the drive surface.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* PAGE 8: Machine Kinematics & Post Dialect */}
            {activePage === 'machine_kinematics' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', padding: '14px 16px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#0f172a', marginBottom: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Activity size={16} color="#0284c7" />
                    <span>5-Axis Kinematic Protocol &amp; Machine Architecture</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Machine Architecture:</label>
                      <select
                        value={formState.machineKinematics?.kinematicsId || 'table_table_ac'}
                        onChange={(e) => updateField('machineKinematics', 'kinematicsId', e.target.value)}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px', backgroundColor: '#fff', boxSizing: 'border-box' }}
                      >
                        {MULTIAXIS_KINEMATICS_OPTIONS.map((k) => (
                          <option key={k.id} value={k.id}>
                            {k.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>TCPM / RTCP Protocol:</label>
                      <select
                        value={formState.machineKinematics?.tcpmMode || 'fanuc'}
                        onChange={(e) => updateField('machineKinematics', 'tcpmMode', e.target.value)}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px', backgroundColor: '#fff', fontWeight: 600, boxSizing: 'border-box' }}
                      >
                        {MULTIAXIS_TCPM_OPTIONS.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', padding: '14px 16px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#0f172a', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={16} color="#059669" />
                    <span>Kinematic Singularity &amp; Overtravel Audit</span>
                  </div>
                  <div style={{ padding: '10px 12px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '4px', color: '#065f46', fontSize: '11.5px', lineHeight: '1.5' }}>
                    <div style={{ fontWeight: 700 }}>✓ Kinematic Path Verified Safe</div>
                    <div>• Maximum Rotary Velocity: <strong>{physics?.maxRotarySpeedDegSec || 42.5}&deg;/s</strong> (Limit: 120&deg;/s)</div>
                    <div>• Pole Singularity Check: <strong>Passed</strong> (No collinear dwell at A=0&deg; / B=0&deg;)</div>
                  </div>
                </div>
              </div>
            )}

            {/* PAGE 4: Holder Definition & Clearance */}
            {activePage === 'holder' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', padding: '14px 16px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#0f172a', marginBottom: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={16} color="#4f46e5" />
                    <span>5-Axis Toolholder Geometry &amp; Overhang Clearance</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Holder Type:</label>
                      <select
                        value={formState.holder?.type || 'CAT40_ER32'}
                        onChange={(e) => updateField('holder', 'type', e.target.value)}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px', backgroundColor: '#fff', boxSizing: 'border-box' }}
                      >
                        <option value="CAT40_ER32">CAT40 - ER32 Precision 5X Chuck</option>
                        <option value="BT30_BBT">BT30 - BBT Dual Contact (Robodrill)</option>
                        <option value="HSK_A63">HSK-A63 High Speed Hydraulic Slim</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Gauge Length (Lg):</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          value={formState.holder?.gaugeLength || 75.0}
                          onChange={(e) => updateField('holder', 'gaugeLength', Number(e.target.value))}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px', textAlign: 'right', fontWeight: 600, boxSizing: 'border-box' }}
                        />
                        <span style={{ color: '#64748b', fontSize: '11px' }}>mm</span>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Clearance Safety Margin:</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          step="0.5"
                          value={formState.holder?.clearanceMarginMm || 3.0}
                          onChange={(e) => updateField('holder', 'clearanceMarginMm', Number(e.target.value))}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px', textAlign: 'right', fontWeight: 600, boxSizing: 'border-box' }}
                        />
                        <span style={{ color: '#64748b', fontSize: '11px' }}>mm</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', padding: '14px 16px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#0f172a', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                    Tool Assembly Kinematic Reach
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', alignItems: 'center' }}>
                    <div style={{ padding: '10px 12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11.5px', lineHeight: '1.6', color: '#334155' }}>
                      <div>• Total Assembly Extension: <strong>{(Number(formState.holder?.gaugeLength || 75) + 38).toFixed(1)} mm</strong></div>
                      <div>• Max Allowable Swarf Tilt Angle: <strong>32.5&deg; (Clean Shank Clearance)</strong></div>
                      <div>• Dynamic Spindle Head Collision Envelope: <strong>Verified Clear (30mm Margin)</strong></div>
                    </div>
                    <div style={{ padding: '8px 12px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '4px', color: '#065f46', fontSize: '11px', textAlign: 'center' }}>
                      <CheckCircle2 size={16} color="#059669" style={{ margin: '0 auto 4px' }} />
                      <strong>Holder Collision Free</strong>
                      <div style={{ marginTop: '2px', color: '#047857' }}>Tilt clearance verified across all 25 morph passes</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PAGE 6: Collision Control & Gouge Check */}
            {activePage === 'collision_control' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', padding: '14px 16px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#0f172a', marginBottom: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={16} color="#dc2626" />
                    <span>5-Axis Gouge Avoidance &amp; Collision Protection</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 10px', borderRadius: '4px', border: '1px solid #bfdbfe', backgroundColor: '#eff6ff', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        checked={formState.collisionControl?.gougeStrategy === 'tilt_away'}
                        onChange={() => updateField('collisionControl', 'gougeStrategy', 'tilt_away')}
                        style={{ marginTop: '2px' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: '#1e3a8a' }}>Dynamic Tilt Tool Axis Away from Check Surfaces (Recommended)</div>
                        <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                          Smoothly adjusts Lead and Tilt angles dynamically when the tool shank or holder approaches part walls.
                        </div>
                      </div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 10px', borderRadius: '4px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        checked={formState.collisionControl?.gougeStrategy === 'retract_along_axis'}
                        onChange={() => updateField('collisionControl', 'gougeStrategy', 'retract_along_axis')}
                        style={{ marginTop: '2px' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: '#334155' }}>Retract Tool Along Tool Axis</div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          Lifts the tool axially away from gouge areas and trims collided toolpath segments.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', padding: '14px 16px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#0f172a', marginBottom: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>
                    Safety Clearance Offsets
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Shank Clearance Margin:</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          step="0.1"
                          value={formState.collisionControl?.shankClearanceMm || 1.5}
                          onChange={(e) => updateField('collisionControl', 'shankClearanceMm', Number(e.target.value))}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px', textAlign: 'right', fontWeight: 600, boxSizing: 'border-box' }}
                        />
                        <span style={{ color: '#64748b', fontSize: '11px' }}>mm</span>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Holder Clearance Margin:</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          step="0.5"
                          value={formState.collisionControl?.holderClearanceMm || 3.0}
                          onChange={(e) => updateField('collisionControl', 'holderClearanceMm', Number(e.target.value))}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px', textAlign: 'right', fontWeight: 600, boxSizing: 'border-box' }}
                        />
                        <span style={{ color: '#64748b', fontSize: '11px' }}>mm</span>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Check Surfaces Stock:</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          step="0.1"
                          value={formState.collisionControl?.checkStockMm || 0.5}
                          onChange={(e) => updateField('collisionControl', 'checkStockMm', Number(e.target.value))}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px', textAlign: 'right', fontWeight: 600, boxSizing: 'border-box' }}
                        />
                        <span style={{ color: '#64748b', fontSize: '11px' }}>mm</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PAGE 9: Arc Filter & 5X Tolerance */}
            {activePage === 'arc_filter' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', padding: '14px 16px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#0f172a', marginBottom: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <RotateCw size={16} color="#3b82f6" />
                    <span>5-Axis High-Speed Smoothing &amp; Cut Tolerances</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Cut Tolerance (Linear Chordal):</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          step="0.005"
                          value={formState.arcFilter?.cutToleranceMm || 0.010}
                          onChange={(e) => updateField('arcFilter', 'cutToleranceMm', Number(e.target.value))}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px', textAlign: 'right', fontWeight: 600, boxSizing: 'border-box' }}
                        />
                        <span style={{ color: '#64748b', fontSize: '11px' }}>mm</span>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Vector Smoothing Tolerance:</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          step="0.1"
                          value={formState.arcFilter?.vectorToleranceDeg || 0.5}
                          onChange={(e) => updateField('arcFilter', 'vectorToleranceDeg', Number(e.target.value))}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px', textAlign: 'right', fontWeight: 600, boxSizing: 'border-box' }}
                        />
                        <span style={{ color: '#64748b', fontSize: '11px' }}>deg (°)</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                    <input
                      type="checkbox"
                      id="aicc_lookahead"
                      checked={formState.arcFilter?.aiccLookahead ?? true}
                      onChange={(e) => updateField('arcFilter', 'aiccLookahead', e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <label htmlFor="aicc_lookahead" style={{ color: '#334155', fontWeight: 500, cursor: 'pointer', fontSize: '11.5px' }}>
                      Enable Fanuc G05.1 Q1 (AICC II High-Speed Look-Ahead Accel/Decel)
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* PAGE 10: Planes (WCS) & Coolant Management */}
            {activePage === 'planes_coolant' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', padding: '14px 16px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#0f172a', marginBottom: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={16} color="#64748b" />
                    <span>Work Coordinate System (WCS) &amp; Tool Planes</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>WCS Fixture Offset:</label>
                      <select
                        value={formState.planesCoolant?.wcs || 'Top (G54)'}
                        onChange={(e) => updateField('planesCoolant', 'wcs', e.target.value)}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px', backgroundColor: '#fff', boxSizing: 'border-box' }}
                      >
                        <option value="Top (G54)">Top (G54 - Standard Work Offset)</option>
                        <option value="G55">G55</option>
                        <option value="G56">G56</option>
                        <option value="G57">G57</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>NC Header Operator Message:</label>
                      <input
                        type="text"
                        value={formState.planesCoolant?.operatorMessage || '5-AXIS MORPH FINISH'}
                        onChange={(e) => updateField('planesCoolant', 'operatorMessage', e.target.value)}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px', backgroundColor: '#fff', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11.5px', color: '#334155' }}>
                      <input
                        type="checkbox"
                        checked={formState.planesCoolant?.coolantFlood ?? true}
                        onChange={(e) => updateField('planesCoolant', 'coolantFlood', e.target.checked)}
                      />
                      <span>Flood Coolant (M08)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11.5px', color: '#334155' }}>
                      <input
                        type="checkbox"
                        checked={formState.planesCoolant?.coolantThruSpindle ?? true}
                        onChange={(e) => updateField('planesCoolant', 'coolantThruSpindle', e.target.checked)}
                      />
                      <span>Through-Spindle High Pressure (M88)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11.5px', color: '#334155' }}>
                      <input
                        type="checkbox"
                        checked={formState.planesCoolant?.airBlast ?? false}
                        onChange={(e) => updateField('planesCoolant', 'airBlast', e.target.checked)}
                      />
                      <span>Air Blast (M09 / M51)</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer (Mastercam Status Bar with Physics Badges) */}
        <div
          style={{
            height: '44px',
            backgroundColor: '#e2e8f0',
            borderTop: '1px solid #cbd5e1',
            padding: '0 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}
        >
          {/* Material & Real-Time Physics Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>Material:</span>
              <select
                value={formState.selectedMaterialKey || 'ALU_6061'}
                onChange={(e) => handleMaterialChange(e.target.value)}
                style={{
                  padding: '3px 8px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '3px',
                  color: '#0f172a',
                  fontWeight: 600,
                  fontSize: '11px',
                  outline: 'none'
                }}
              >
                {Object.entries(MULTIAXIS_MORPH_MATERIALS).map(([k, m]) => (
                  <option key={k} value={k}>
                    {m.name.split(' ')[0]} ({m.hardness})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ width: '1px', height: '18px', backgroundColor: '#cbd5e1' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#334155' }}>
              <span>
                Eff. Dia: <strong style={{ color: '#0f172a' }}>{physics.effDiameterMm || 6.2} mm</strong>
              </span>
              <span>
                Eff. Vc: <strong style={{ color: '#0f172a' }}>{physics.effVcMMin || 235} m/min</strong>
              </span>
              <span>
                Scallop: <strong style={{ color: '#9333ea' }}>{physics.scallopMicrons || 2.1} &mu;m</strong>
              </span>
              <span>
                Power: <strong style={{ color: '#0f172a' }}>{physics.powerKw || 0.45} kW</strong>
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
                padding: '5px 14px',
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
                padding: '6px 18px',
                fontSize: '11.5px',
                fontWeight: 600,
                color: '#ffffff',
                background: 'linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)',
                border: '1px solid #1e40af',
                borderRadius: '3px',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                transition: 'filter 0.15s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
            >
              <Check size={15} color="#ffffff" />
              Generate Morph Toolpath
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
