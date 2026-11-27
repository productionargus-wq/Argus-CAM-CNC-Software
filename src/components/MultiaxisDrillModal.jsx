import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X, Check, AlertTriangle, ShieldCheck, Cpu, Sliders,
  HelpCircle, Compass, Layers, RotateCw, RotateCcw, Activity, Sparkles, Orbit,
  CheckCircle2, Info, MoveUpRight, Zap, ArrowRight, CornerDownRight, Crosshair,
  Ruler, Eye
} from 'lucide-react';

import {
  MULTIAXIS_DRILL_PAGE_TITLES,
  MULTIAXIS_DRILL_MATERIALS,
  MULTIAXIS_DRILL_PRESETS,
  MULTIAXIS_DRILL_CYCLES,
  MULTIAXIS_DRILL_KINEMATICS,
  MULTIAXIS_DRILL_POST_DIALECTS,
  calculateDrillTipLength,
  calculateMultiaxisDrillPhysics,
  createDefaultMultiaxisDrillParams,
  resolveDefaultDrillTool
} from '../config/multiaxisDrillSchema.js';

import { extract3DCompoundHoles } from '../utils/multiaxisDrillEngine.js';

export default function MultiaxisDrillModal({
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

  const defaultTool = useMemo(() => resolveDefaultDrillTool(tools), [tools]);

  // Form State
  const [formState, setFormState] = useState(() => {
    if (operation && (operation.strategyKey === 'multiaxis_drill' || operation.badgeClass === 'multiaxis_drill')) {
      return {
        ...createDefaultMultiaxisDrillParams(tools, activeMachine),
        ...operation,
        tool: {
          ...operation.tool,
          id: operation.tool?.id || operation.toolId || (defaultTool?.id ?? 10),
          number: operation.tool?.number || operation.toolNumber || (defaultTool?.number ?? 10),
          name: operation.tool?.name || operation.toolName || (defaultTool?.name ?? '6.0mm Carbide Drill'),
          type: 'drill',
          diameter: Number(operation.tool?.diameter || defaultTool?.diameter || 6.0),
          pointAngleDeg: Number(operation.tool?.pointAngleDeg || 140),
          spindleSpeed: operation.tool?.spindleSpeed || operation.spindleSpeed || 6366,
          feedRate: operation.tool?.feedRate || operation.feedRate || 1146
        }
      };
    }
    const def = createDefaultMultiaxisDrillParams(tools, activeMachine);
    // Auto-detect holes from current CAD model
    const detected = extract3DCompoundHoles(currentModel);
    def.holeSelection.selectedHoles = detected;
    return def;
  });

  const [activePage, setActivePage] = useState('hole_selection');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [editedPages, setEditedPages] = useState(
    new Set(['hole_selection', 'tool', 'cut_parameters', 'depth_tip_comp'])
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
      const minTopAllowed = 55; // Keep header visible and clear of ribbon bar
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
    return calculateMultiaxisDrillPhysics(
      formState.tool || {},
      formState.cutParameters || {},
      formState.selectedMaterialKey || 'ALU_6061'
    );
  }, [formState.tool, formState.cutParameters, formState.selectedMaterialKey]);

  // Tip length calculation
  const tipLengthMm = useMemo(() => {
    return calculateDrillTipLength(
      formState.tool?.diameter || 6.0,
      formState.tool?.pointAngleDeg || 140
    );
  }, [formState.tool?.diameter, formState.tool?.pointAngleDeg]);

  // Nested field updater
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

  // Toggle single hole
  const toggleHole = (holeId) => {
    setFormState((prev) => ({
      ...prev,
      holeSelection: {
        ...prev.holeSelection,
        selectedHoles: prev.holeSelection.selectedHoles.map((h) =>
          h.id === holeId ? { ...h, enabled: !h.enabled } : h
        )
      }
    }));
  };

  // Apply Material Preset
  const handleMaterialChange = (matKey) => {
    const mat = MULTIAXIS_DRILL_MATERIALS[matKey];
    if (!mat) return;

    const dia = formState.tool?.diameter || 6.0;
    const rpm = Math.round((mat.vc * 1000) / (Math.PI * dia));
    const feed = Math.round(rpm * mat.fn);

    setFormState((prev) => ({
      ...prev,
      selectedMaterialKey: matKey,
      tool: {
        ...prev.tool,
        spindleSpeed: rpm,
        feedRate: feed,
        plungeRate: feed,
        pointAngleDeg: mat.recommendedPointAngle
      },
      cutParameters: {
        ...prev.cutParameters,
        feedPerRevMm: mat.fn,
        peckDepthMm: mat.recommendedPeckMm
      }
    }));
    onNotify?.(`Loaded drilling feeds & speeds for ${mat.name}`, 'info');
  };

  // Apply Quick Preset
  const handleApplyPreset = (presetKey) => {
    const preset = MULTIAXIS_DRILL_PRESETS.find((p) => p.id === presetKey) || MULTIAXIS_DRILL_PRESETS[0];
    if (!preset) return;

    const mat = MULTIAXIS_DRILL_MATERIALS[preset.materialKey] || MULTIAXIS_DRILL_MATERIALS.ALU_6061;
    const dia = formState.tool?.diameter || 6.0;
    const rpm = Math.round((mat.vc * 1000) / (Math.PI * dia));
    const feed = Math.round(rpm * mat.fn);

    setFormState((prev) => ({
      ...prev,
      selectedPresetKey: preset.id,
      selectedMaterialKey: preset.materialKey,
      cutParameters: {
        ...prev.cutParameters,
        cycleType: preset.cycle,
        peckDepthMm: preset.peckMm || mat.recommendedPeckMm
      },
      toolAxisAlignment: {
        ...prev.toolAxisAlignment,
        alignmentMode: preset.alignmentMode
      },
      tool: {
        ...prev.tool,
        pointAngleDeg: preset.pointAngleDeg,
        spindleSpeed: rpm,
        feedRate: feed
      }
    }));
    onNotify?.(`Applied 5-Axis Drill Preset: ${preset.name}`, 'info');
  };

  // 1-Click Recommended Values
  const applyRecommendedValues = () => {
    const mat = MULTIAXIS_DRILL_MATERIALS[formState.selectedMaterialKey || 'ALU_6061'];
    const dia = formState.tool?.diameter || 6.0;
    const rpm = Math.round((mat.vc * 1000) / (Math.PI * dia));
    const feed = Math.round(rpm * mat.fn);

    setFormState((prev) => ({
      ...prev,
      tool: {
        ...prev.tool,
        spindleSpeed: rpm,
        feedRate: feed,
        plungeRate: feed,
        pointAngleDeg: mat.recommendedPointAngle
      },
      cutParameters: {
        ...prev.cutParameters,
        feedPerRevMm: mat.fn,
        peckDepthMm: mat.recommendedPeckMm
      }
    }));
    onNotify?.(`Recommended values loaded: ${rpm} RPM, ${feed} mm/min, Q=${mat.recommendedPeckMm}mm Peck`, 'success');
  };

  // Commit and Save
  const handleSave = () => {
    const assignedTool =
      tools.find((t) => String(t.id) === String(formState.tool?.id)) ||
      tools.find((t) => Number(t.number) === Number(formState.tool?.number)) ||
      defaultTool ||
      formState.tool;

    const activeHoles = formState.holeSelection?.selectedHoles?.filter((h) => h.enabled !== false) || [];

    const payload = {
      ...formState,
      strategyKey: 'multiaxis_drill',
      badgeClass: 'multiaxis_drill',
      badgeText: '5X-DRILL',
      toolId: assignedTool.id,
      tool: {
        ...assignedTool,
        ...formState.tool
      },
      holes: activeHoles,
      cycleType: formState.cutParameters?.cycleType || 'G83',
      peckMm: formState.cutParameters?.peckDepthMm || 5.0,
      tipLengthMm,
      physics,
      updatedAt: new Date().toISOString()
    };

    onSaveOperation?.(payload);
    onClose();
  };

  // Left Sidebar Page Icons
  const pageIcons = {
    toolpath_type: <Layers size={14} color="#0284c7" />,
    hole_selection: <Crosshair size={14} color="#059669" />,
    tool: <Cpu size={14} color="#d97706" />,
    holder: <ShieldCheck size={14} color="#4f46e5" />,
    cut_parameters: <Sliders size={14} color="#0d9488" />,
    depth_tip_comp: <Ruler size={14} color="#9333ea" />,
    tool_axis_alignment: <Orbit size={14} color="#3b82f6" />,
    linking_clearance: <CornerDownRight size={14} color="#16a34a" />,
    machine_kinematics: <Activity size={14} color="#0284c7" />,
    planes_coolant: <Layers size={14} color="#64748b" />
  };

  const selectedHoles = formState.holeSelection?.selectedHoles || [];
  const enabledHoleCount = selectedHoles.filter((h) => h.enabled !== false).length;

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
            <Crosshair size={16} color="#38bdf8" />
            <span>5-Axis Multiaxis Drilling &amp; Hole Making &mdash; Argus CAM Intelligence Engine</span>
            <span
              style={{
                fontSize: '10px',
                backgroundColor: 'rgba(56, 189, 248, 0.25)',
                color: '#e0f2fe',
                padding: '2px 7px',
                borderRadius: '3px',
                border: '1px solid rgba(56, 189, 248, 0.45)',
                fontWeight: 600
              }}
            >
              5X DRILL
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
            padding: '5px 14px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #cbd5e1',
            gap: '10px',
            flexShrink: 0
          }}
        >
          {/* Quick Presets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>Presets:</span>
            {MULTIAXIS_DRILL_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => handleApplyPreset(p.id)}
                style={{
                  padding: '3px 8px',
                  fontSize: '11px',
                  backgroundColor: formState.selectedPresetKey === p.id ? '#e0f2fe' : '#f1f5f9',
                  border: `1px solid ${formState.selectedPresetKey === p.id ? '#38bdf8' : '#cbd5e1'}`,
                  borderRadius: '3px',
                  color: formState.selectedPresetKey === p.id ? '#0369a1' : '#334155',
                  cursor: 'pointer',
                  fontWeight: formState.selectedPresetKey === p.id ? 600 : 400
                }}
                title={p.desc}
              >
                {p.name.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Recommended Values & Guide */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={applyRecommendedValues}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                fontSize: '11.5px',
                fontWeight: 600,
                color: '#0369a1',
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
              title="Auto-calculate optimal RPM, Feed, Peck Q, and Tip Comp for chosen material"
            >
              <Sparkles size={13} color="#0284c7" />
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
              padding: '10px 16px',
              backgroundColor: '#f0fdf4',
              borderBottom: '1px solid #bbf7d0',
              fontSize: '11.5px',
              color: '#166534',
              display: 'flex',
              gap: '14px',
              alignItems: 'flex-start',
              flexShrink: 0
            }}
          >
            <Info size={16} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1, lineHeight: '1.45' }}>
              <strong>5-Axis Multiaxis Drilling Machinist Reference:</strong>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginTop: '4px' }}>
                <div>
                  <strong>1. Drill Tip Compensation:</strong>
                  <br />
                  L_tip = (D/2) / tan(&theta;/2). For 140&deg; split point carbide drills, cone height adds 0.182 &times; D to reach full-diameter hole depth.
                </div>
                <div>
                  <strong>2. 3+2 TWP vs TCPM:</strong>
                  <br />
                  Fanuc $G68.2$ Euler TWP or Haas $G254$ DWO positions the rotary table, allowing machine controllers to run standard hardware canned peck cycles ($G83$/$G73$).
                </div>
                <div>
                  <strong>3. Axial Clearance Retract:</strong>
                  <br />
                  The drill ALWAYS retracts along the hole axis out of the hole cavity before rotary axes ($A/C$) index to the next compound hole, preventing spindle collisions.
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
              5-Axis Drill Parameters
            </div>

            {Object.entries(MULTIAXIS_DRILL_PAGE_TITLES).map(([key, label]) => {
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
                    borderLeft: isActive ? '4px solid #0284c7' : '4px solid transparent',
                    color: isActive ? '#0369a1' : '#334155',
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
                        backgroundColor: '#0284c7',
                        marginLeft: '6px',
                        flexShrink: 0
                      }}
                    />
                  )}
                </div>
              );
            })}

            {/* Tree Footer Summary */}
            <div style={{ marginTop: 'auto', padding: '10px 14px', borderTop: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Active Holes:</span>
                <strong style={{ color: '#0369a1' }}>{enabledHoleCount} / {selectedHoles.length}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Cycle:</span>
                <strong style={{ color: '#0f172a' }}>{formState.cutParameters?.cycleType || 'G83'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Tip Comp:</span>
                <strong style={{ color: '#16a34a' }}>+{tipLengthMm} mm</strong>
              </div>
            </div>
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
            {/* PAGE 1: Toolpath Type */}
            {activePage === 'toolpath_type' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px 14px', backgroundColor: '#ffffff' }}>
                  <legend style={{ padding: '0 4px', color: '#334155', fontWeight: 600, fontSize: '11.5px' }}>
                    5-Axis Hole Making Strategy
                  </legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px', border: formState.toolpathType?.strategy === 'multiaxis_drill' ? '1px solid #38bdf8' : '1px solid #e2e8f0', backgroundColor: formState.toolpathType?.strategy === 'multiaxis_drill' ? '#f0f9ff' : '#ffffff', borderRadius: '4px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="tp_strat"
                        checked={formState.toolpathType?.strategy === 'multiaxis_drill'}
                        onChange={() => updateField('toolpathType', 'strategy', 'multiaxis_drill')}
                        style={{ marginTop: '2px' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>5-Axis Multiaxis Drill (Standard)</div>
                        <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                          Plunge and canned peck drilling along 3D compound hole centerlines with rotary table alignment.
                        </div>
                      </div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px', border: formState.toolpathType?.strategy === 'multiaxis_circle_mill' ? '1px solid #38bdf8' : '1px solid #e2e8f0', backgroundColor: formState.toolpathType?.strategy === 'multiaxis_circle_mill' ? '#f0f9ff' : '#ffffff', borderRadius: '4px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="tp_strat"
                        checked={formState.toolpathType?.strategy === 'multiaxis_circle_mill'}
                        onChange={() => updateField('toolpathType', 'strategy', 'multiaxis_circle_mill')}
                        style={{ marginTop: '2px' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>5-Axis Circle Mill / Bore</div>
                        <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                          Helical interpolation on large compound bore holes using smaller endmills.
                        </div>
                      </div>
                    </label>
                  </div>
                </fieldset>

                <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px 14px', backgroundColor: '#ffffff' }}>
                  <legend style={{ padding: '0 4px', color: '#334155', fontWeight: 600, fontSize: '11.5px' }}>
                    Hole Traverse &amp; Rotary Indexing Optimization
                  </legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Hole Sorting Sequence:</label>
                      <select
                        value={formState.toolpathType?.holeSortingMethod || 'shortest_rotary_path'}
                        onChange={(e) => updateField('toolpathType', 'holeSortingMethod', e.target.value)}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', backgroundColor: '#fff' }}
                      >
                        <option value="shortest_rotary_path">Shortest Rotary Table Traverse Path (Recommended)</option>
                        <option value="by_diameter">Group by Diameter Size</option>
                        <option value="by_angle">Group by Primary Tilt Angle (A/B)</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '18px' }}>
                      <input
                        type="checkbox"
                        id="drillSubProg"
                        checked={formState.toolpathType?.subProgram || false}
                        onChange={(e) => updateField('toolpathType', 'subProgram', e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                      <label htmlFor="drillSubProg" style={{ color: '#334155', cursor: 'pointer', fontSize: '11.5px' }}>
                        Output Modular CNC Subprogram (M98 P...)
                      </label>
                    </div>
                  </div>
                </fieldset>
              </div>
            )}

            {/* PAGE 2: Hole Selection & Geometry Matrix */}
            {activePage === 'hole_selection' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px 14px', backgroundColor: '#ffffff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                    <div style={{ fontWeight: 600, fontSize: '11.5px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Crosshair size={14} color="#059669" />
                      <span>Detected 3D Compound Holes Matrix ({enabledHoleCount} Selected)</span>
                    </div>
                    <span style={{ fontSize: '10.5px', color: '#047857', backgroundColor: '#ecfdf5', padding: '2px 8px', borderRadius: '3px', border: '1px solid #a7f3d0', fontWeight: 600 }}>
                      Auto 3D B-Rep Extracted
                    </span>
                  </div>

                  {/* Hole Table */}
                  <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: '3px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                      <thead style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#475569', position: 'sticky', top: 0 }}>
                        <tr>
                          <th style={{ padding: '5px 8px', width: '28px' }}>Inc</th>
                          <th style={{ padding: '5px 8px' }}>Hole Feature</th>
                          <th style={{ padding: '5px 8px' }}>Diameter</th>
                          <th style={{ padding: '5px 8px' }}>Depth</th>
                          <th style={{ padding: '5px 8px' }}>Compound Vector (A/C)</th>
                          <th style={{ padding: '5px 8px' }}>Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedHoles.map((h, idx) => (
                          <tr
                            key={h.id || idx}
                            style={{
                              backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                              borderBottom: '1px solid #e2e8f0',
                              opacity: h.enabled !== false ? 1 : 0.45
                            }}
                          >
                            <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={h.enabled !== false}
                                onChange={() => toggleHole(h.id)}
                                style={{ cursor: 'pointer' }}
                              />
                            </td>
                            <td style={{ padding: '5px 8px', fontWeight: 600, color: '#1e293b' }}>{h.name}</td>
                            <td style={{ padding: '5px 8px', color: '#0369a1', fontWeight: 600 }}>Ø{h.diameter} mm</td>
                            <td style={{ padding: '5px 8px', color: '#334155' }}>{h.depth} mm</td>
                            <td style={{ padding: '5px 8px', fontFamily: 'monospace', color: '#7c3aed' }}>
                              A{h.angles?.A ?? 0}&deg; / C{h.angles?.C ?? 0}&deg;
                            </td>
                            <td style={{ padding: '5px 8px' }}>
                              <span style={{ padding: '2px 6px', borderRadius: '3px', fontSize: '10px', fontWeight: 600, backgroundColor: h.type === 'through' ? '#ecfdf5' : '#eff6ff', color: h.type === 'through' ? '#047857' : '#1d4ed8' }}>
                                {h.type === 'through' ? 'Through' : 'Blind'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </fieldset>

                {/* SVG 3D Compound Hole Vector Diagram */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                    <div style={{ fontWeight: 600, fontSize: '11.5px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Activity size={14} color="#0284c7" />
                      <span>3D Compound Hole Approach Vectors &amp; Spindle Alignment</span>
                    </div>
                    <span style={{ fontSize: '10.5px', color: '#0369a1', backgroundColor: '#f0f9ff', padding: '2px 8px', borderRadius: '3px', border: '1px solid #bae6fd', fontWeight: 600 }}>
                      Axial Retract: 15.0mm
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', alignItems: 'center' }}>
                    {/* SVG Vector Graphic */}
                    <div style={{ backgroundColor: '#0f172a', borderRadius: '4px', padding: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid #334155' }}>
                      <svg width="270" height="75" viewBox="0 0 270 75" style={{ overflow: 'visible' }}>
                        {/* Part Cross Section */}
                        <polygon points="40,55 230,55 240,40 210,25 60,25 30,40" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />

                        {/* Vertical Hole */}
                        <line x1="80" y1="25" x2="80" y2="48" stroke="#38bdf8" strokeWidth="4" />
                        <line x1="80" y1="10" x2="80" y2="25" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3,2" />
                        <text x="70" y="8" fill="#38bdf8" fontSize="7.5" fontWeight="600">A0° C0°</text>

                        {/* Compound Angled Hole 1 (Left 15°) */}
                        <line x1="45" y1="35" x2="60" y2="50" stroke="#a855f7" strokeWidth="4" />
                        <line x1="32" y1="22" x2="45" y2="35" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="3,2" />
                        <text x="15" y="18" fill="#c084fc" fontSize="7.5" fontWeight="600">A-15°</text>

                        {/* Compound Angled Hole 2 (Right 30°) */}
                        <line x1="225" y1="35" x2="208" y2="50" stroke="#f59e0b" strokeWidth="4" />
                        <line x1="240" y1="22" x2="225" y2="35" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3,2" />
                        <text x="238" y="18" fill="#fbbf24" fontSize="7.5" fontWeight="600">A+30°</text>

                        {/* Drill Spindle with 140° Point */}
                        <rect x="135" y="4" width="8" height="14" fill="#94a3b8" />
                        <polygon points="135,18 143,18 139,23" fill="#38bdf8" />
                        <line x1="139" y1="23" x2="139" y2="48" stroke="#38bdf8" strokeWidth="3" />
                        <text x="148" y="14" fill="#38bdf8" fontSize="7.5" fontWeight="600">Ø6 Drill</text>
                      </svg>
                      <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '3px' }}>
                        Euler Angles: <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>Fanuc G68.2 I[A] J[B] K[C]</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <div style={{ padding: '4px 8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '10.5px', color: '#475569' }}>Total Holes to Drill:</span>
                        <strong style={{ fontSize: '11px', color: '#0369a1' }}>{enabledHoleCount} Holes</strong>
                      </div>
                      <div style={{ padding: '4px 8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '10.5px', color: '#475569' }}>Drill Tip Cone Height:</span>
                        <strong style={{ fontSize: '11px', color: '#16a34a' }}>+{tipLengthMm} mm</strong>
                      </div>
                      <div style={{ padding: '4px 8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '10.5px', color: '#475569' }}>Axial Retract Margin:</span>
                        <strong style={{ fontSize: '11px', color: '#2563eb' }}>15.0 mm</strong>
                      </div>
                      <div style={{ padding: '4px 8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '10.5px', color: '#475569' }}>Thrust Force (Fz):</span>
                        <strong style={{ fontSize: '11px', color: '#0f172a' }}>{physics.thrustForceN} N</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PAGE 3: Tool Selection & Dynamics */}
            {activePage === 'tool' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px 14px', backgroundColor: '#ffffff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                    <div style={{ fontWeight: 600, fontSize: '11.5px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Cpu size={14} color="#d97706" />
                      <span>Active Drill Tool Definition</span>
                    </div>
                    {onOpenToolLibrary && (
                      <button
                        type="button"
                        onClick={onOpenToolLibrary}
                        style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Select from Library...
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Tool Selection:</label>
                      <select
                        value={formState.tool?.id}
                        onChange={(e) => {
                          const t = tools.find((tool) => String(tool.id) === e.target.value);
                          if (t) {
                            setFormState((prev) => ({
                              ...prev,
                              tool: {
                                ...prev.tool,
                                id: t.id,
                                number: t.number || t.id,
                                name: t.name,
                                diameter: Number(t.diameter) || 6.0,
                                pointAngleDeg: Number(t.pointAngleDeg) || 140,
                                spindleSpeed: t.rpm || t.spindleSpeed || 6366,
                                feedRate: t.feedRate || 1146
                              }
                            }));
                          }
                        }}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', backgroundColor: '#fff' }}
                      >
                        {tools.map((t) => (
                          <option key={t.id} value={t.id}>
                            T{t.number || t.id} &mdash; {t.name} (Ø{t.diameter}mm)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Drill Diameter (D):</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          step="0.1"
                          value={formState.tool?.diameter || 6.0}
                          onChange={(e) => updateField('tool', 'diameter', Number(e.target.value))}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', textAlign: 'right', fontWeight: 600 }}
                        />
                        <span style={{ color: '#64748b' }}>mm</span>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Drill Point Angle (&theta;):</label>
                      <select
                        value={formState.tool?.pointAngleDeg || 140}
                        onChange={(e) => updateField('tool', 'pointAngleDeg', Number(e.target.value))}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', backgroundColor: '#fff', fontWeight: 600 }}
                      >
                        <option value="118">118° (Standard HSS Jobber Point)</option>
                        <option value="135">135° (Heavy Duty Split Point)</option>
                        <option value="140">140° (Carbide High-Performance Point)</option>
                        <option value="90">90° (Spot Drill / Chamfer Point)</option>
                        <option value="180">180° (Flat Bottom Drill)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Spindle Speed (S):</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          value={formState.tool?.spindleSpeed || 6366}
                          onChange={(e) => updateField('tool', 'spindleSpeed', Number(e.target.value))}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', textAlign: 'right', fontWeight: 600 }}
                        />
                        <span style={{ color: '#64748b' }}>RPM</span>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Plunge Feedrate (F):</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          value={formState.tool?.feedRate || 1146}
                          onChange={(e) => updateField('tool', 'feedRate', Number(e.target.value))}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', textAlign: 'right', fontWeight: 600 }}
                        />
                        <span style={{ color: '#64748b' }}>mm/min</span>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Feed Per Rev (fn):</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          step="0.01"
                          value={formState.cutParameters?.feedPerRevMm || 0.18}
                          onChange={(e) => updateField('cutParameters', 'feedPerRevMm', Number(e.target.value))}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', textAlign: 'right', fontWeight: 600 }}
                        />
                        <span style={{ color: '#64748b' }}>mm/rev</span>
                      </div>
                    </div>
                  </div>
                </fieldset>
              </div>
            )}

            {/* PAGE 5: Cut Parameters & Canned Cycles */}
            {activePage === 'cut_parameters' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px 14px', backgroundColor: '#ffffff' }}>
                  <legend style={{ padding: '0 4px', color: '#334155', fontWeight: 600, fontSize: '11.5px' }}>
                    Select Canned Drilling Cycle
                  </legend>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {MULTIAXIS_DRILL_CYCLES.map((c) => (
                      <label
                        key={c.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          padding: '8px 10px',
                          borderRadius: '4px',
                          border: formState.cutParameters?.cycleType === c.id ? '1px solid #38bdf8' : '1px solid #e2e8f0',
                          backgroundColor: formState.cutParameters?.cycleType === c.id ? '#f0f9ff' : '#ffffff',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="radio"
                          name="cycleType"
                          checked={formState.cutParameters?.cycleType === c.id}
                          onChange={() => updateField('cutParameters', 'cycleType', c.id)}
                          style={{ marginTop: '2px' }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, color: formState.cutParameters?.cycleType === c.id ? '#0369a1' : '#1e293b' }}>
                            {c.name}
                          </div>
                          <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>{c.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {/* Peck & Dwell Parameters */}
                {(formState.cutParameters?.cycleType === 'G83' || formState.cutParameters?.cycleType === 'G73') && (
                  <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px 14px', backgroundColor: '#ffffff' }}>
                    <legend style={{ padding: '0 4px', color: '#334155', fontWeight: 600, fontSize: '11.5px' }}>
                      Peck Depth Increments (Q Value)
                    </legend>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>First Peck Depth (Q):</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="number"
                            step="0.5"
                            value={formState.cutParameters?.peckDepthMm || 5.0}
                            onChange={(e) => updateField('cutParameters', 'peckDepthMm', Number(e.target.value))}
                            style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', textAlign: 'right', fontWeight: 600 }}
                          />
                          <span style={{ color: '#64748b' }}>mm</span>
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Chip Break Retract:</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="number"
                            step="0.1"
                            value={formState.cutParameters?.chipBreakRetractMm || 0.8}
                            onChange={(e) => updateField('cutParameters', 'chipBreakRetractMm', Number(e.target.value))}
                            style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', textAlign: 'right', fontWeight: 600 }}
                          />
                          <span style={{ color: '#64748b' }}>mm</span>
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Bottom Dwell (P):</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="number"
                            step="0.1"
                            value={formState.cutParameters?.dwellSeconds || 0.5}
                            onChange={(e) => updateField('cutParameters', 'dwellSeconds', Number(e.target.value))}
                            style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', textAlign: 'right', fontWeight: 600 }}
                          />
                          <span style={{ color: '#64748b' }}>sec</span>
                        </div>
                      </div>
                    </div>
                  </fieldset>
                )}
              </div>
            )}

            {/* PAGE 6: Depth & Drill Tip Compensation */}
            {activePage === 'depth_tip_comp' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px 14px', backgroundColor: '#ffffff' }}>
                  <legend style={{ padding: '0 4px', color: '#334155', fontWeight: 600, fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Ruler size={13} color="#9333ea" />
                    <span>Drill Tip Length Compensation Geometry</span>
                  </legend>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px', backgroundColor: '#faf5ff', borderRadius: '4px', border: '1px solid #e9d5ff', marginBottom: '12px' }}>
                    <input
                      type="checkbox"
                      id="addTipLen"
                      checked={formState.depthTipComp?.addTipLengthToDepth ?? true}
                      onChange={(e) => updateField('depthTipComp', 'addTipLengthToDepth', e.target.checked)}
                      style={{ marginTop: '2px', cursor: 'pointer' }}
                    />
                    <div>
                      <label htmlFor="addTipLen" style={{ fontWeight: 600, color: '#6b21a8', cursor: 'pointer' }}>
                        Add Drill Tip Cone Length (+{tipLengthMm} mm) to Programmed Depth
                      </label>
                      <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                        Automatically extends Z depth by cone height so the cylindrical full diameter breaks through or reaches specified depth.
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Through-Hole Breakthrough Margin:</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          step="0.5"
                          value={formState.depthTipComp?.throughHoleBreakthroughMm || 1.5}
                          onChange={(e) => updateField('depthTipComp', 'throughHoleBreakthroughMm', Number(e.target.value))}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', textAlign: 'right', fontWeight: 600 }}
                        />
                        <span style={{ color: '#64748b' }}>mm</span>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Tip Cone Angle:</label>
                      <input
                        type="text"
                        disabled
                        value={`${formState.tool?.pointAngleDeg || 140}° (${tipLengthMm}mm height)`}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', backgroundColor: '#f1f5f9', fontWeight: 600, color: '#64748b' }}
                      />
                    </div>
                  </div>
                </fieldset>
              </div>
            )}

            {/* PAGE 7: Tool Axis Control & Alignment */}
            {activePage === 'tool_axis_alignment' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px 14px', backgroundColor: '#ffffff' }}>
                  <legend style={{ padding: '0 4px', color: '#334155', fontWeight: 600, fontSize: '11.5px' }}>
                    5-Axis Alignment Strategy
                  </legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px', border: formState.toolAxisAlignment?.alignmentMode === 'twp_3_plus_2' ? '1px solid #38bdf8' : '1px solid #e2e8f0', backgroundColor: formState.toolAxisAlignment?.alignmentMode === 'twp_3_plus_2' ? '#f0f9ff' : '#ffffff', borderRadius: '4px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="alignMode"
                        checked={formState.toolAxisAlignment?.alignmentMode === 'twp_3_plus_2'}
                        onChange={() => updateField('toolAxisAlignment', 'alignmentMode', 'twp_3_plus_2')}
                        style={{ marginTop: '2px' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>3+2 Tilted Work Plane (Recommended)</div>
                        <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                          Fanuc G68.2 TWP / Haas G254 DWO: Swivels rotary table normal to hole, executes controller hardware canned cycles.
                        </div>
                      </div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px', border: formState.toolAxisAlignment?.alignmentMode === 'tcpm_simultaneous' ? '1px solid #38bdf8' : '1px solid #e2e8f0', backgroundColor: formState.toolAxisAlignment?.alignmentMode === 'tcpm_simultaneous' ? '#f0f9ff' : '#ffffff', borderRadius: '4px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="alignMode"
                        checked={formState.toolAxisAlignment?.alignmentMode === 'tcpm_simultaneous'}
                        onChange={() => updateField('toolAxisAlignment', 'alignmentMode', 'tcpm_simultaneous')}
                        style={{ marginTop: '2px' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>Simultaneous 5-Axis TCPM</div>
                        <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                          Continuous tool vector tracking using Fanuc G43.4 / Haas G234 TCPM mode.
                        </div>
                      </div>
                    </label>
                  </div>
                </fieldset>
              </div>
            )}

            {/* Other Pages: Holder, Linking, Kinematics, Planes */}
            {activePage === 'holder' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px 14px', backgroundColor: '#ffffff' }}>
                  <legend style={{ padding: '0 4px', color: '#334155', fontWeight: 600, fontSize: '11.5px' }}>
                    Toolholder &amp; Overhang Clearance
                  </legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Holder Style:</label>
                      <select
                        value={formState.holder?.type || 'CAT40_ER32'}
                        onChange={(e) => updateField('holder', 'type', e.target.value)}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', backgroundColor: '#fff' }}
                      >
                        <option value="CAT40_ER32">CAT40 - ER32 Precision Collet</option>
                        <option value="BT30_BBT">BT30 - BBT Dual Contact (Robodrill)</option>
                        <option value="HSK_A63">HSK-A63 High Speed Hydraulic</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Gauge Length:</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          value={formState.holder?.gaugeLength || 70.0}
                          onChange={(e) => updateField('holder', 'gaugeLength', Number(e.target.value))}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', textAlign: 'right', fontWeight: 600 }}
                        />
                        <span style={{ color: '#64748b' }}>mm</span>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Holder Safety Clearance:</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          step="0.5"
                          value={formState.holder?.holderClearanceMm || 3.5}
                          onChange={(e) => updateField('holder', 'holderClearanceMm', Number(e.target.value))}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', textAlign: 'right', fontWeight: 600 }}
                        />
                        <span style={{ color: '#64748b' }}>mm</span>
                      </div>
                    </div>
                  </div>
                </fieldset>
              </div>
            )}

            {activePage === 'linking_clearance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px 14px', backgroundColor: '#ffffff' }}>
                  <legend style={{ padding: '0 4px', color: '#334155', fontWeight: 600, fontSize: '11.5px' }}>
                    Safety Clearance Envelope &amp; Axial Retracts
                  </legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Axial Retract Before Table Rotate:</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          step="1"
                          value={formState.linkingClearance?.axialRetractBeforeIndexMm || 15.0}
                          onChange={(e) => updateField('linkingClearance', 'axialRetractBeforeIndexMm', Number(e.target.value))}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', textAlign: 'right', fontWeight: 600 }}
                        />
                        <span style={{ color: '#64748b' }}>mm</span>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Global Safety Sphere Radius:</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          step="5"
                          value={formState.linkingClearance?.safetyClearanceRadiusMm || 65.0}
                          onChange={(e) => updateField('linkingClearance', 'safetyClearanceRadiusMm', Number(e.target.value))}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', textAlign: 'right', fontWeight: 600 }}
                        />
                        <span style={{ color: '#64748b' }}>mm</span>
                      </div>
                    </div>
                  </div>
                </fieldset>
              </div>
            )}

            {activePage === 'machine_kinematics' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px 14px', backgroundColor: '#ffffff' }}>
                  <legend style={{ padding: '0 4px', color: '#334155', fontWeight: 600, fontSize: '11.5px' }}>
                    Controller Dialect &amp; Post-Processor Options
                  </legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Post Dialect:</label>
                      <select
                        value={formState.machineKinematics?.postDialect || 'fanuc_twp'}
                        onChange={(e) => updateField('machineKinematics', 'postDialect', e.target.value)}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', backgroundColor: '#fff', fontWeight: 600 }}
                      >
                        {MULTIAXIS_DRILL_POST_DIALECTS.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Machine Kinematics Architecture:</label>
                      <select
                        value={formState.machineKinematics?.kinematicsId || 'table_table_ac'}
                        onChange={(e) => updateField('machineKinematics', 'kinematicsId', e.target.value)}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', backgroundColor: '#fff' }}
                      >
                        {MULTIAXIS_DRILL_KINEMATICS.map((k) => (
                          <option key={k.id} value={k.id}>{k.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </fieldset>
              </div>
            )}

            {activePage === 'planes_coolant' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px 14px', backgroundColor: '#ffffff' }}>
                  <legend style={{ padding: '0 4px', color: '#334155', fontWeight: 600, fontSize: '11.5px' }}>
                    WCS &amp; High-Pressure Through-Tool Coolant
                  </legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>WCS Fixture Offset:</label>
                      <select
                        value={formState.planesCoolant?.wcs || 'Top (G54)'}
                        onChange={(e) => updateField('planesCoolant', 'wcs', e.target.value)}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', backgroundColor: '#fff' }}
                      >
                        <option value="Top (G54)">Top (G54 - Standard)</option>
                        <option value="G55">G55</option>
                        <option value="G56">G56</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Operator Message:</label>
                      <input
                        type="text"
                        value={formState.planesCoolant?.operatorMessage || '5-AXIS MULTIAXIS DRILLING'}
                        onChange={(e) => updateField('planesCoolant', 'operatorMessage', e.target.value)}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', backgroundColor: '#fff' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formState.planesCoolant?.coolantFlood ?? true}
                        onChange={(e) => updateField('planesCoolant', 'coolantFlood', e.target.checked)}
                      />
                      <span>Flood Coolant (M08)</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formState.planesCoolant?.coolantThruSpindle ?? true}
                        onChange={(e) => updateField('planesCoolant', 'coolantThruSpindle', e.target.checked)}
                      />
                      <span>Through-Spindle High Pressure Coolant (M88)</span>
                    </label>
                  </div>
                </fieldset>
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
          {/* Material & Physics Badges */}
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
                {Object.entries(MULTIAXIS_DRILL_MATERIALS).map(([k, m]) => (
                  <option key={k} value={k}>
                    {m.name.split(' ')[0]} ({m.category})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ width: '1px', height: '18px', backgroundColor: '#cbd5e1' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#334155' }}>
              <span>
                Thrust: <strong style={{ color: '#0f172a' }}>{physics.thrustForceN} N</strong>
              </span>
              <span>
                Torque: <strong style={{ color: '#0f172a' }}>{physics.spindleTorqueNm} Nm</strong>
              </span>
              <span>
                Power: <strong style={{ color: '#0f172a' }}>{physics.cuttingPowerKw} kW</strong>
              </span>
              <span>
                Tip Comp: <strong style={{ color: '#16a34a' }}>+{tipLengthMm} mm</strong>
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
                cursor: 'pointer'
              }}
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
                background: 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)',
                border: '1px solid #075985',
                borderRadius: '3px',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
              }}
            >
              <Check size={15} color="#ffffff" />
              OK / Generate Toolpath
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
