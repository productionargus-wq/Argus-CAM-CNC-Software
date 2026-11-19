import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X, Check, AlertTriangle, ShieldCheck, Cpu, Sliders,
  HelpCircle, Compass, Layers, RotateCw, RotateCcw, Activity, Sparkles, Orbit,
  CheckCircle2, Info, MoveUpRight, Zap, ArrowRight, CornerDownRight, Disc
} from 'lucide-react';

import {
  ROTARY_4AXIS_PAGE_TITLES,
  ROTARY_4AXIS_MATERIALS,
  ROTARY_4AXIS_PRESETS,
  calculateRotary4AxisPhysics,
  calculateRecommendedRotarySettings,
  createDefaultRotary4AxisParams,
  resolveDefaultRotaryTool
} from '../config/rotary4AxisSchema.js';

export default function Rotary4AxisModal({
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

  const defaultTool = useMemo(() => resolveDefaultRotaryTool(tools), [tools]);

  const [formState, setFormState] = useState(() => {
    if (operation && (operation.strategyKey === 'rotary_4axis' || operation.badgeClass === 'rotary_4axis')) {
      return {
        ...createDefaultRotary4AxisParams(tools),
        ...operation,
        tool: {
          ...operation.tool,
          id: operation.tool?.id || operation.toolId || (defaultTool?.id ?? 1),
          number: operation.tool?.number || operation.toolNumber || (defaultTool?.number ?? 1),
          name: operation.tool?.name || operation.toolName || (defaultTool?.name ?? '10mm Rotary Endmill'),
          type: operation.tool?.type || (defaultTool?.type ?? 'flat'),
          diameter: Number(operation.tool?.diameter || defaultTool?.diameter || 10),
          flutes: Number(operation.tool?.flutes || defaultTool?.flutes || 2),
          spindleSpeed: operation.tool?.spindleSpeed || operation.spindleSpeed || 10000,
          feedRate: operation.tool?.feedRate || operation.feedRate || 2000,
          plungeRate: operation.tool?.plungeRate || operation.plungeRate || 500
        }
      };
    }
    const def = createDefaultRotary4AxisParams(tools);
    if (defaultTool) {
      def.tool = {
        ...def.tool,
        id: defaultTool.id,
        number: defaultTool.number || defaultTool.id,
        name: defaultTool.name,
        type: defaultTool.type,
        diameter: Number(defaultTool.diameter) || 10,
        flutes: Number(defaultTool.flutes) || 2,
        spindleSpeed: defaultTool.rpm || defaultTool.spindleSpeed || 10000,
        feedRate: defaultTool.feedRate || 2000
      };
    }
    return def;
  });

  const [activePage, setActivePage] = useState('rotary_cut_pattern');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState('ALU_6061');
  const [editedPages, setEditedPages] = useState(
    new Set(['rotary_cut_pattern', 'tool', 'axis_control_offset'])
  );

  // Dragging state with safe bounds
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

  // Nested form state update helper
  const updateField = (section, field, value) => {
    setFormState((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    setEditedPages((prev) => new Set([...prev, section]));
  };

  // Live Physics Calculation
  const physics = useMemo(() => {
    return calculateRotary4AxisPhysics({
      cylinderDiameter: formState.cutPattern?.cylinderDiameter || 60.0,
      toolDiameter: formState.tool?.diameter || 10.0,
      toolCornerRadius: formState.tool?.cornerRadius || 0.0,
      isBallnose: formState.tool?.toolType === 'ball' || formState.tool?.toolType === 'ballnose',
      flutes: formState.tool?.flutes || 2,
      spindleRpm: formState.tool?.spindleSpeed || 10000,
      feedLinearMmMin: formState.tool?.feedRate || 2000,
      stepoverMm: formState.stepoverPasses?.stepoverMm || 1.2,
      depthOfCutMm: formState.stepoverPasses?.maxRoughStepdownMm || 2.0,
      materialKey: selectedMaterial,
      yOffsetMm: formState.axisControl?.yOffsetDistanceMm || 0.0
    });
  }, [formState, selectedMaterial]);

  // Apply Preset
  const handleApplyPreset = (presetKey) => {
    const preset = ROTARY_4AXIS_PRESETS[presetKey];
    if (!preset) return;
    setFormState((prev) => ({
      ...prev,
      presetKey: preset.id,
      cutPattern: {
        ...prev.cutPattern,
        machiningStyle: preset.machiningStyle,
        rotaryAxis: preset.rotaryAxis,
        cylinderDiameter: preset.cylinderDiameter,
        cuttingDirection: preset.cuttingDirection
      },
      tool: {
        ...prev.tool,
        spindleSpeed: preset.spindleSpeed,
        feedRate: preset.feedRate,
        plungeRate: preset.plungeRate
      },
      axisControl: {
        ...prev.axisControl,
        yOffsetDistanceMm: preset.yOffsetMm,
        leadAngleDeg: preset.leadAngleDeg
      },
      stepoverPasses: {
        ...prev.stepoverPasses,
        stepoverDeg: preset.stepoverDeg,
        stepoverMm: preset.stepoverMm
      },
      machineKinematics: {
        ...prev.machineKinematics,
        postDialect: preset.postDialect,
        cylindricalInterpEnabled: preset.cylindricalInterp,
        feedMode: preset.feedMode
      }
    }));
    setEditedPages(new Set(Object.keys(ROTARY_4AXIS_PAGE_TITLES)));
    onNotify?.(`Applied 4-Axis Preset: ${preset.name}`, 'info');
  };

  // Recommended Values
  const handleApplyRecommended = () => {
    const rec = calculateRecommendedRotarySettings({
      materialKey: selectedMaterial,
      tool: formState.tool,
      cylinderDiameter: formState.cutPattern?.cylinderDiameter || 60.0
    });
    setFormState((prev) => ({
      ...prev,
      tool: {
        ...prev.tool,
        spindleSpeed: rec.spindleSpeed,
        feedRate: rec.feedRate,
        plungeRate: rec.plungeRate
      },
      stepoverPasses: {
        ...prev.stepoverPasses,
        stepoverDeg: rec.stepoverDeg,
        stepoverMm: rec.stepoverMm,
        numberOfPasses: rec.numberOfPasses
      }
    }));
    onNotify?.(`Applied recommended values for ${ROTARY_4AXIS_MATERIALS[selectedMaterial]?.name}`, 'success');
  };

  // Tool change handler
  const handleSelectTool = (toolId) => {
    const selected = tools.find((t) => t.id === Number(toolId));
    if (!selected) return;
    setFormState((prev) => ({
      ...prev,
      tool: {
        ...prev.tool,
        id: selected.id,
        number: selected.number || selected.id,
        name: selected.name,
        type: selected.type,
        diameter: Number(selected.diameter) || 10,
        flutes: Number(selected.flutes) || 2,
        cornerRadius: Number(selected.corner_radius) || 0.0,
        spindleSpeed: selected.rpm || prev.tool.spindleSpeed,
        feedRate: selected.feedRate || prev.tool.feedRate
      }
    }));
  };

  // Save handler
  const handleSave = () => {
    const opData = {
      ...formState,
      strategyKey: 'rotary_4axis',
      name: `4-Axis Rotary (${formState.cutPattern?.machiningStyle?.toUpperCase()})`,
      toolId: formState.tool.id,
      toolNumber: formState.tool.number,
      toolName: formState.tool.name,
      feedRate: formState.tool.feedRate,
      spindleSpeed: formState.tool.spindleSpeed,
      badge: '4X',
      badgeClass: 'rotary_4axis',
      physics
    };

    onSaveOperation?.(opData);
    onClose?.();
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
        {/* Title Bar (Mastercam Classic Dark Slate Header) */}
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
            <Disc size={16} color="#38bdf8" />
            <span>Rotary 4-Axis Machining (Cylinder Wrapping &amp; Axis Substitution) &mdash; Mastercam Engine</span>
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
              4X ROTARY
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={handleApplyRecommended}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 9px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#0369a1',
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '3px',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              title="Calculate optimal speed/feed and stepover for selected material"
            >
              <Sparkles size={12} color="#0284c7" />
              <span>Recommended Values</span>
            </button>
            <button
              onClick={() => setIsGuideOpen(!isGuideOpen)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 9px',
                fontSize: '11px',
                fontWeight: 600,
                color: isGuideOpen ? '#0284c7' : '#e2e8f0',
                backgroundColor: isGuideOpen ? '#e0f2fe' : 'rgba(255,255,255,0.1)',
                border: isGuideOpen ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.2)',
                borderRadius: '3px',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <HelpCircle size={12} />
              <span>Machinist Guide</span>
            </button>
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
                transition: 'all 0.15s'
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
                transition: 'all 0.15s'
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

        {/* Presets Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '5px 12px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #cbd5e1',
            gap: '8px',
            flexShrink: 0,
            overflowX: 'auto'
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
            <Zap size={12} color="#f59e0b" /> Presets:
          </span>
          {Object.values(ROTARY_4AXIS_PRESETS).map((pr) => (
            <button
              key={pr.id}
              onClick={() => handleApplyPreset(pr.id)}
              style={{
                padding: '3px 8px',
                fontSize: '11px',
                backgroundColor: formState.presetKey === pr.id ? '#e0f2fe' : '#f1f5f9',
                border: `1px solid ${formState.presetKey === pr.id ? '#38bdf8' : '#cbd5e1'}`,
                borderRadius: '3px',
                color: formState.presetKey === pr.id ? '#0369a1' : '#334155',
                cursor: 'pointer',
                fontWeight: formState.presetKey === pr.id ? 600 : 400,
                whiteSpace: 'nowrap'
              }}
              title={pr.desc}
            >
              {pr.name}
            </button>
          ))}
        </div>

        {/* Main Body: 2-Column Mastercam Layout */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
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
              Rotary 4-Axis Pages
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', flex: 1 }}>
              {Object.entries(ROTARY_4AXIS_PAGE_TITLES).map(([key, title]) => {
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
                      padding: '7px 14px',
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
                      {key === 'rotary_cut_pattern' && <Disc size={13} color={isActive ? '#0284c7' : '#64748b'} />}
                      {key === 'tool' && <Sliders size={13} color={isActive ? '#0284c7' : '#64748b'} />}
                      {key === 'holder' && <ShieldCheck size={13} color={isActive ? '#0284c7' : '#64748b'} />}
                      {key === 'axis_control_offset' && <Compass size={13} color={isActive ? '#0284c7' : '#64748b'} />}
                      {key === 'stepover_passes' && <Layers size={13} color={isActive ? '#0284c7' : '#64748b'} />}
                      {key === 'collision_rotary_limits' && <AlertTriangle size={13} color={isActive ? '#0284c7' : '#64748b'} />}
                      {key === 'linking_parameters' && <CornerDownRight size={13} color={isActive ? '#0284c7' : '#64748b'} />}
                      {key === 'machine_kinematics' && <Cpu size={13} color={isActive ? '#0284c7' : '#64748b'} />}
                      {key === 'arc_filter' && <Activity size={13} color={isActive ? '#0284c7' : '#64748b'} />}
                      {key === 'planes_coolant' && <RotateCw size={13} color={isActive ? '#0284c7' : '#64748b'} />}
                      {key === 'toolpath_type' && <Orbit size={13} color={isActive ? '#0284c7' : '#64748b'} />}
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
                    </div>
                    {isEdited && !isActive && (
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#0284c7', marginLeft: '6px', flexShrink: 0 }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick Summary in Tree Footer */}
            <div style={{ padding: '8px 12px', borderTop: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Cylinder OD:</span>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>{formState.cutPattern?.cylinderDiameter} mm</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Rotary Axis:</span>
                <span style={{ fontWeight: 600, color: '#0369a1' }}>{formState.cutPattern?.rotaryAxis}-Axis ({formState.cutPattern?.rotaryAxis === 'X' ? 'A' : 'B'})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Style:</span>
                <span style={{ fontWeight: 600, color: '#1e293b', textTransform: 'capitalize' }}>{formState.cutPattern?.machiningStyle?.replace('_', ' ')}</span>
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
            {/* PAGE 1: TOOLPATH TYPE */}
            {activePage === 'toolpath_type' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px 14px', backgroundColor: '#ffffff' }}>
                  <legend style={{ padding: '0 4px', color: '#334155', fontWeight: 600, fontSize: '11.5px' }}>
                    4-Axis Rotary Multiaxis Strategy
                  </legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px', border: formState.cutPattern?.machiningStyle === 'axis_substitution' ? '1px solid #38bdf8' : '1px solid #e2e8f0', backgroundColor: formState.cutPattern?.machiningStyle === 'axis_substitution' ? '#f0f9ff' : '#ffffff', borderRadius: '4px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="tp_type"
                        checked={formState.cutPattern?.machiningStyle === 'axis_substitution'}
                        onChange={() => updateField('cutPattern', 'machiningStyle', 'axis_substitution')}
                        style={{ marginTop: '2px' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>Axis Substitution (2D/3D Wrapping)</div>
                        <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                          Wraps planar geometry (cams, slots, lettering) onto cylinder OD via A = (360° × Y) / (π × D).
                        </div>
                      </div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px', border: formState.cutPattern?.machiningStyle === 'axial' ? '1px solid #38bdf8' : '1px solid #e2e8f0', backgroundColor: formState.cutPattern?.machiningStyle === 'axial' ? '#f0f9ff' : '#ffffff', borderRadius: '4px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="tp_type"
                        checked={formState.cutPattern?.machiningStyle === 'axial'}
                        onChange={() => updateField('cutPattern', 'machiningStyle', 'axial')}
                        style={{ marginTop: '2px' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>Axial Rotary (Longitudinal Passes)</div>
                        <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                          Cuts longitudinally along X while the rotary axis steps over around the circumference.
                        </div>
                      </div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px', border: formState.cutPattern?.machiningStyle === 'spiral' ? '1px solid #38bdf8' : '1px solid #e2e8f0', backgroundColor: formState.cutPattern?.machiningStyle === 'spiral' ? '#f0f9ff' : '#ffffff', borderRadius: '4px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="tp_type"
                        checked={formState.cutPattern?.machiningStyle === 'spiral'}
                        onChange={() => updateField('cutPattern', 'machiningStyle', 'spiral')}
                        style={{ marginTop: '2px' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>Continuous Rotary Spiral</div>
                        <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                          Continuous 360° helical revolutions around cylinder with linear axial feed for mirror finish.
                        </div>
                      </div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px', border: formState.cutPattern?.machiningStyle === 'radial' ? '1px solid #38bdf8' : '1px solid #e2e8f0', backgroundColor: formState.cutPattern?.machiningStyle === 'radial' ? '#f0f9ff' : '#ffffff', borderRadius: '4px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="tp_type"
                        checked={formState.cutPattern?.machiningStyle === 'radial'}
                        onChange={() => updateField('cutPattern', 'machiningStyle', 'radial')}
                        style={{ marginTop: '2px' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>Radial Rings (Circumferential Passes)</div>
                        <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                          Full 360° rotation at discrete axial step locations along cylinder.
                        </div>
                      </div>
                    </label>
                  </div>
                </fieldset>
              </div>
            )}

            {/* PAGE 2: ROTARY CUT PATTERN */}
            {activePage === 'rotary_cut_pattern' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px 14px', backgroundColor: '#ffffff' }}>
                  <legend style={{ padding: '0 4px', color: '#334155', fontWeight: 600, fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Disc size={13} color="#0284c7" />
                    <span>Rotary Stock Cylinder Definition</span>
                  </legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Cylinder Diameter (OD)</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          value={formState.cutPattern?.cylinderDiameter || 60.0}
                          onChange={(e) => updateField('cutPattern', 'cylinderDiameter', parseFloat(e.target.value) || 60.0)}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', color: '#1e293b', backgroundColor: '#ffffff' }}
                        />
                        <span style={{ color: '#64748b' }}>mm</span>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Cylinder Length</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          step="1"
                          min="5"
                          value={formState.cutPattern?.cylinderLength || 100.0}
                          onChange={(e) => updateField('cutPattern', 'cylinderLength', parseFloat(e.target.value) || 100.0)}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', color: '#1e293b', backgroundColor: '#ffffff' }}
                        />
                        <span style={{ color: '#64748b' }}>mm</span>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Rotary Axis</label>
                      <select
                        value={formState.cutPattern?.rotaryAxis || 'X'}
                        onChange={(e) => updateField('cutPattern', 'rotaryAxis', e.target.value)}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', color: '#1e293b', backgroundColor: '#ffffff' }}
                      >
                        <option value="X">X-Axis (A-Axis Rotary)</option>
                        <option value="Y">Y-Axis (B-Axis Rotary)</option>
                        <option value="Z">Z-Axis (C-Axis Rotary)</option>
                      </select>
                    </div>
                  </div>
                </fieldset>

                <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px 14px', backgroundColor: '#ffffff' }}>
                  <legend style={{ padding: '0 4px', color: '#334155', fontWeight: 600, fontSize: '11.5px' }}>
                    Cutting Direction &amp; Depth Passes
                  </legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Cutting Method</label>
                      <select
                        value={formState.cutPattern?.cuttingDirection || 'climb'}
                        onChange={(e) => updateField('cutPattern', 'cuttingDirection', e.target.value)}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', color: '#1e293b', backgroundColor: '#ffffff' }}
                      >
                        <option value="climb">Climb Milling (Standard)</option>
                        <option value="conventional">Conventional Milling</option>
                        <option value="zigzag">Zigzag (Bi-Directional)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Axial Cut Sequence</label>
                      <select
                        value={formState.cutPattern?.cutSequence || 'positive_x_to_negative'}
                        onChange={(e) => updateField('cutPattern', 'cutSequence', e.target.value)}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', color: '#1e293b', backgroundColor: '#ffffff' }}
                      >
                        <option value="positive_x_to_negative">+X to -X (Headstock toward Tailstock)</option>
                        <option value="negative_x_to_positive">-X to +X (Tailstock toward Headstock)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Radial Depth (ap)</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          step="0.25"
                          min="0.1"
                          value={formState.stepoverPasses?.maxRoughStepdownMm || 2.0}
                          onChange={(e) => updateField('stepoverPasses', 'maxRoughStepdownMm', parseFloat(e.target.value) || 2.0)}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', color: '#1e293b', backgroundColor: '#ffffff' }}
                        />
                        <span style={{ color: '#64748b' }}>mm</span>
                      </div>
                    </div>
                  </div>
                </fieldset>

                {/* Visual 4-Axis Rotary Machining & Cylindrical Unroll Preview */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                    <div style={{ fontWeight: 600, fontSize: '11.5px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Activity size={14} color="#0284c7" />
                      <span>Cylinder Wrapping &amp; Axis Substitution Geometry</span>
                    </div>
                    <span style={{ fontSize: '10.5px', color: '#0369a1', backgroundColor: '#f0f9ff', padding: '2px 8px', borderRadius: '3px', border: '1px solid #bae6fd', fontWeight: 600 }}>
                      Fanuc G107 C{( (formState.cutPattern?.cylinderDiameter || 60) / 2 ).toFixed(1)} Active
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', alignItems: 'center' }}>
                    {/* SVG 4-Axis Cylinder Diagram */}
                    <div style={{ backgroundColor: '#0f172a', borderRadius: '4px', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid #334155' }}>
                      <svg width="270" height="75" viewBox="0 0 270 75" style={{ overflow: 'visible' }}>
                        {/* Workpiece Cylinder Outline */}
                        <rect x="50" y="18" width="160" height="38" rx="19" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                        <line x1="20" y1="37" x2="240" y2="37" stroke="#64748b" strokeWidth="1" strokeDasharray="4,3" />

                        {/* Rotary A-Axis Rotation Arrow */}
                        <path d="M 38 24 A 14 14 0 1 1 38 50" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3,1" />
                        <polygon points="40,20 44,27 36,26" fill="#f59e0b" />
                        <text x="14" y="30" fill="#f59e0b" fontSize="8" fontWeight="700">+A°</text>

                        {/* Tool Spindle and Cutter engaging top tangent */}
                        <rect x="125" y="4" width="10" height="15" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="1" />
                        <circle cx="130" cy="19" r="4" fill="#38bdf8" />
                        <text x="142" y="14" fill="#38bdf8" fontSize="8" fontWeight="600">Tool T5 (Z-2.0mm)</text>

                        {/* Helical / Axial Toolpath Path */}
                        <path d="M 60 22 Q 85 18 110 24 T 160 22 T 200 24" fill="none" stroke="#34d399" strokeWidth="1.8" />
                        <text x="60" y="66" fill="#94a3b8" fontSize="7.5">OD Ø{formState.cutPattern?.cylinderDiameter || 60}mm &bull; Circumference: {(Math.PI * (formState.cutPattern?.cylinderDiameter || 60)).toFixed(1)}mm</text>
                      </svg>
                      <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '4px', textAlign: 'center' }}>
                        Axis Substitution Mapping: <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>A = (360° &times; Y) / (&pi; &times; D)</span>
                      </div>
                    </div>

                    {/* Live Kinematics Telemetry */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <div style={{ padding: '4px 8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '10.5px', color: '#475569' }}>Unrolled Flat Width (W):</span>
                        <strong style={{ fontSize: '11px', color: '#0369a1' }}>
                          {(Math.PI * (formState.cutPattern?.cylinderDiameter || 60)).toFixed(2)} mm
                        </strong>
                      </div>
                      <div style={{ padding: '4px 8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '10.5px', color: '#475569' }}>Effective Cut Speed (Vc):</span>
                        <strong style={{ fontSize: '11px', color: '#2563eb' }}>
                          {(physics?.surfaceSpeedMpm ?? 160).toFixed(0)} m/min
                        </strong>
                      </div>
                      <div style={{ padding: '4px 8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '10.5px', color: '#475569' }}>Rotary Feedrate (DPM):</span>
                        <strong style={{ fontSize: '11px', color: '#16a34a' }}>
                          {(physics?.rotaryFeedDegMin ?? 1288.8).toFixed(1)} &deg;/min
                        </strong>
                      </div>
                      <div style={{ padding: '4px 8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '10.5px', color: '#475569' }}>Spindle Power Draw:</span>
                        <strong style={{ fontSize: '11px', color: '#0f172a' }}>
                          {(physics?.powerKw ?? 0.08).toFixed(2)} kW
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PAGE 3: TOOL SELECTION & DYNAMICS */}
            {activePage === 'tool' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px 14px', backgroundColor: '#ffffff' }}>
                  <legend style={{ padding: '0 4px', color: '#334155', fontWeight: 600, fontSize: '11.5px' }}>
                    Assigned 4-Axis Milling Tool
                  </legend>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <select
                      value={formState.tool?.id}
                      onChange={(e) => handleSelectTool(e.target.value)}
                      style={{ flex: 1, padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '3px', color: '#1e293b', fontWeight: 500, backgroundColor: '#ffffff' }}
                    >
                      {tools.map((t) => (
                        <option key={t.id} value={t.id}>
                          T{t.number || t.id} - {t.name} ({t.diameter}mm {t.type})
                        </option>
                      ))}
                    </select>
                    {onOpenToolLibrary && (
                      <button
                        onClick={onOpenToolLibrary}
                        style={{ padding: '6px 12px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '3px', color: '#334155', cursor: 'pointer', fontWeight: 500 }}
                      >
                        Select from Library...
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Spindle Speed</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          step="100"
                          value={formState.tool?.spindleSpeed || 10000}
                          onChange={(e) => updateField('tool', 'spindleSpeed', parseInt(e.target.value) || 10000)}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', color: '#1e293b', backgroundColor: '#ffffff' }}
                        />
                        <span style={{ color: '#64748b' }}>RPM</span>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Linear Feedrate</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          step="50"
                          value={formState.tool?.feedRate || 2000}
                          onChange={(e) => updateField('tool', 'feedRate', parseInt(e.target.value) || 2000)}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', color: '#1e293b', backgroundColor: '#ffffff' }}
                        />
                        <span style={{ color: '#64748b' }}>mm/min</span>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Plunge Feedrate</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          step="25"
                          value={formState.tool?.plungeRate || 500}
                          onChange={(e) => updateField('tool', 'plungeRate', parseInt(e.target.value) || 500)}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', color: '#1e293b', backgroundColor: '#ffffff' }}
                        />
                        <span style={{ color: '#64748b' }}>mm/min</span>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Flute Count</label>
                      <input
                        type="number"
                        min="1"
                        max="8"
                        value={formState.tool?.flutes || 2}
                        onChange={(e) => updateField('tool', 'flutes', parseInt(e.target.value) || 2)}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', color: '#1e293b', backgroundColor: '#ffffff' }}
                      />
                    </div>
                  </div>
                </fieldset>
              </div>
            )}

            {/* PAGE 4: HOLDER DEFINITION */}
            {activePage === 'holder' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px 14px', backgroundColor: '#ffffff' }}>
                  <legend style={{ padding: '0 4px', color: '#334155', fontWeight: 600, fontSize: '11.5px' }}>
                    Toolholder &amp; Gauge Length
                  </legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Holder Style</label>
                      <select
                        value={formState.holder?.type || 'CAT40_ER32'}
                        onChange={(e) => updateField('holder', 'type', e.target.value)}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', color: '#1e293b', backgroundColor: '#ffffff' }}
                      >
                        <option value="CAT40_ER32">CAT40 - ER32 Precision Collet</option>
                        <option value="BT30_BBT">BT30 - BBT Dual Contact (Robodrill)</option>
                        <option value="HSK_A63">HSK-A63 High Speed Hydraulic</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Gauge Length</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          value={formState.holder?.gaugeLength || 70.0}
                          onChange={(e) => updateField('holder', 'gaugeLength', parseFloat(e.target.value) || 70.0)}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', color: '#1e293b', backgroundColor: '#ffffff' }}
                        />
                        <span style={{ color: '#64748b' }}>mm</span>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Holder Clearance Margin</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          step="0.5"
                          value={formState.holder?.holderClearanceMargin || 3.0}
                          onChange={(e) => updateField('holder', 'holderClearanceMargin', parseFloat(e.target.value) || 3.0)}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', color: '#1e293b', backgroundColor: '#ffffff' }}
                        />
                        <span style={{ color: '#64748b' }}>mm</span>
                      </div>
                    </div>
                  </div>
                </fieldset>
              </div>
            )}

            {/* PAGE 5: AXIS CONTROL & CUTTER OFFSET (Y-OFFSET) */}
            {activePage === 'axis_control_offset' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px 14px', backgroundColor: '#ffffff' }}>
                  <legend style={{ padding: '0 4px', color: '#334155', fontWeight: 600, fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Compass size={13} color="#0284c7" />
                    <span>Cutter Offset Method (Centerline vs Y-Offset)</span>
                  </legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px', border: formState.axisControl?.cutterOffsetMethod === 'centerline' ? '1px solid #38bdf8' : '1px solid #e2e8f0', backgroundColor: formState.axisControl?.cutterOffsetMethod === 'centerline' ? '#f0f9ff' : '#ffffff', borderRadius: '4px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="offset_method"
                        checked={formState.axisControl?.cutterOffsetMethod === 'centerline'}
                        onChange={() => updateField('axisControl', 'cutterOffsetMethod', 'centerline')}
                        style={{ marginTop: '2px' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>Centerline Cutting (Y = 0.000 mm)</div>
                        <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                          Tool tip cuts directly on the rotary cylinder centerline axis (standard Fanuc G107).
                        </div>
                      </div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px', border: formState.axisControl?.cutterOffsetMethod === 'y_offset' ? '1px solid #38bdf8' : '1px solid #e2e8f0', backgroundColor: formState.axisControl?.cutterOffsetMethod === 'y_offset' ? '#f0f9ff' : '#ffffff', borderRadius: '4px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="offset_method"
                        checked={formState.axisControl?.cutterOffsetMethod === 'y_offset'}
                        onChange={() => updateField('axisControl', 'cutterOffsetMethod', 'y_offset')}
                        style={{ marginTop: '2px' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>Y-Offset Tangential Cutting</div>
                        <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                          Shifts cutter off-center to provide positive shear rake angle on cylinder OD.
                        </div>
                      </div>
                    </label>
                  </div>

                  {formState.axisControl?.cutterOffsetMethod === 'y_offset' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '10px', backgroundColor: '#f1f5f9', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                      <div>
                        <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Y-Offset Distance</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="number"
                            step="0.1"
                            value={formState.axisControl?.yOffsetDistanceMm || 1.5}
                            onChange={(e) => updateField('axisControl', 'yOffsetDistanceMm', parseFloat(e.target.value) || 1.5)}
                            style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', color: '#1e293b', backgroundColor: '#ffffff' }}
                          />
                          <span style={{ color: '#64748b' }}>mm</span>
                        </div>
                      </div>
                      <div style={{ color: '#64748b', fontSize: '11px', display: 'flex', alignItems: 'center' }}>
                        Positive Y shifts tool towards operator; produces positive chip shear angle and superior finish.
                      </div>
                    </div>
                  )}
                </fieldset>

                {/* SVG Visual Rake & Offset Diagram */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', padding: '12px 14px' }}>
                  <div style={{ fontWeight: 600, fontSize: '11.5px', color: '#0f172a', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                    Cylinder Cross-Section &amp; Tool Tangency Analysis
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', alignItems: 'center' }}>
                    <div style={{ backgroundColor: '#0f172a', borderRadius: '4px', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid #334155' }}>
                      <svg width="240" height="70" viewBox="0 0 240 70">
                        {/* Cylinder Cross Section */}
                        <circle cx="120" cy="45" r="24" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                        <line x1="120" y1="12" x2="120" y2="68" stroke="#64748b" strokeWidth="1" strokeDasharray="3,2" />
                        <line x1="85" y1="45" x2="155" y2="45" stroke="#64748b" strokeWidth="1" strokeDasharray="3,2" />

                        {/* Tool Centerline vs Offset */}
                        {formState.axisControl?.cutterOffsetMethod === 'centerline' ? (
                          <>
                            <rect x="116" y="5" width="8" height="18" fill="#38bdf8" />
                            <circle cx="120" cy="22" r="3" fill="#60a5fa" />
                            <text x="132" y="14" fill="#38bdf8" fontSize="8" fontWeight="600">Y = 0.000 mm (Radial)</text>
                          </>
                        ) : (
                          <>
                            <rect x="126" y="5" width="8" height="18" fill="#f59e0b" />
                            <circle cx="130" cy="22" r="3" fill="#fbbf24" />
                            <line x1="120" y1="12" x2="130" y2="12" stroke="#f59e0b" strokeWidth="1.5" />
                            <text x="140" y="14" fill="#f59e0b" fontSize="8" fontWeight="600">+Y Offset (+{formState.axisControl?.yOffsetDistanceMm || 1.5}mm)</text>
                          </>
                        )}
                      </svg>
                      <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '2px' }}>
                        Shear Rake: <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>&gamma; = arcsin(Y_off / R_cyl)</span>
                      </div>
                    </div>

                    <div style={{ padding: '8px 12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11px', lineHeight: '1.5', color: '#334155' }}>
                      <div>• Rotary Radius: <strong>{((formState.cutPattern?.cylinderDiameter || 60) / 2).toFixed(1)} mm</strong></div>
                      <div>• Effective Shear Rake: <strong>
                        {formState.axisControl?.cutterOffsetMethod === 'y_offset'
                          ? ((Math.asin(Math.min(0.9, (formState.axisControl?.yOffsetDistanceMm || 1.5) / ((formState.cutPattern?.cylinderDiameter || 60) / 2))) * 180) / Math.PI).toFixed(2) + '° Positive'
                          : '0.00° (Neutral Radial)'}
                      </strong></div>
                      <div>• Backplot Z Center: <strong>-2.000 mm (True physical depth)</strong></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PAGE 6: STEPOVER & DEPTH PASSES */}
            {activePage === 'stepover_passes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px 14px', backgroundColor: '#ffffff' }}>
                  <legend style={{ padding: '0 4px', color: '#334155', fontWeight: 600, fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Layers size={13} color="#0284c7" />
                    <span>Stepover &amp; Cut Spacing</span>
                  </legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Angular Stepover (Axial)</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          step="0.5"
                          min="0.1"
                          value={formState.stepoverPasses?.stepoverDeg || 3.5}
                          onChange={(e) => updateField('stepoverPasses', 'stepoverDeg', parseFloat(e.target.value) || 3.5)}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', color: '#1e293b', backgroundColor: '#ffffff' }}
                        />
                        <span style={{ color: '#64748b' }}>deg (°)</span>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Linear Stepover (ae)</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          step="0.1"
                          min="0.05"
                          value={formState.stepoverPasses?.stepoverMm || 1.2}
                          onChange={(e) => updateField('stepoverPasses', 'stepoverMm', parseFloat(e.target.value) || 1.2)}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', color: '#1e293b', backgroundColor: '#ffffff' }}
                        />
                        <span style={{ color: '#64748b' }}>mm</span>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Depth of Cut (ap)</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          step="0.25"
                          value={formState.stepoverPasses?.maxRoughStepdownMm || 2.0}
                          onChange={(e) => updateField('stepoverPasses', 'maxRoughStepdownMm', parseFloat(e.target.value) || 2.0)}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', color: '#1e293b', backgroundColor: '#ffffff' }}
                        />
                        <span style={{ color: '#64748b' }}>mm</span>
                      </div>
                    </div>
                  </div>
                </fieldset>

                {/* Surface Finish & Scallop Cusp Geometry Card */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', padding: '12px 14px' }}>
                  <div style={{ fontWeight: 600, fontSize: '11.5px', color: '#0f172a', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                    Rotary Surface Finish &amp; Scallop Cusp Prediction
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div style={{ padding: '8px 10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                      <div style={{ fontSize: '10.5px', color: '#64748b' }}>Total Axial Passes:</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#0284c7', marginTop: '2px' }}>
                        {Math.round(360 / (formState.stepoverPasses?.stepoverDeg || 3.5))} Passes
                      </div>
                      <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>around 360° circumference</div>
                    </div>

                    <div style={{ padding: '8px 10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                      <div style={{ fontSize: '10.5px', color: '#64748b' }}>Scallop Cusp Height:</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#16a34a', marginTop: '2px' }}>
                        {(physics?.scallopMicrons || 93.8).toFixed(1)} &mu;m
                      </div>
                      <div style={{ fontSize: '9.5px', color: '#16a34a' }}>Precision Finish Standard</div>
                    </div>

                    <div style={{ padding: '8px 10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                      <div style={{ fontSize: '10.5px', color: '#64748b' }}>Radial Tool Depth:</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                        Z = -{(formState.stepoverPasses?.maxRoughStepdownMm || 2.0).toFixed(3)} mm
                      </div>
                      <div style={{ fontSize: '9.5px', color: '#64748b' }}>G-code verified safe</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PAGE 7: COLLISION & ROTARY LIMITS */}
            {activePage === 'collision_rotary_limits' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px 14px', backgroundColor: '#ffffff' }}>
                  <legend style={{ padding: '0 4px', color: '#334155', fontWeight: 600, fontSize: '11.5px' }}>
                    Rotary Travel Limits &amp; Unwind Mode
                  </legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px', border: formState.collisionControl?.rotaryLimitsMode === 'continuous' ? '1px solid #38bdf8' : '1px solid #e2e8f0', backgroundColor: formState.collisionControl?.rotaryLimitsMode === 'continuous' ? '#f0f9ff' : '#ffffff', borderRadius: '4px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="rotary_limits"
                        checked={formState.collisionControl?.rotaryLimitsMode === 'continuous'}
                        onChange={() => updateField('collisionControl', 'rotaryLimitsMode', 'continuous')}
                        style={{ marginTop: '2px' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>Continuous Multi-Turn Unwind</div>
                        <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                          Allows seamless continuous rotation past 360° without intermediate table rewinds.
                        </div>
                      </div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px', border: formState.collisionControl?.rotaryLimitsMode === 'clamped' ? '1px solid #38bdf8' : '1px solid #e2e8f0', backgroundColor: formState.collisionControl?.rotaryLimitsMode === 'clamped' ? '#f0f9ff' : '#ffffff', borderRadius: '4px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="rotary_limits"
                        checked={formState.collisionControl?.rotaryLimitsMode === 'clamped'}
                        onChange={() => updateField('collisionControl', 'rotaryLimitsMode', 'clamped')}
                        style={{ marginTop: '2px' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>Clamped Rotary Window</div>
                        <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                          Restricts rotary travel within specified minimum and maximum angular boundaries.
                        </div>
                      </div>
                    </label>
                  </div>
                </fieldset>
              </div>
            )}

            {/* PAGE 8: LINKING & CLEARANCE CYLINDERS */}
            {activePage === 'linking_parameters' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px 14px', backgroundColor: '#ffffff' }}>
                  <legend style={{ padding: '0 4px', color: '#334155', fontWeight: 600, fontSize: '11.5px' }}>
                    Cylindrical Clearance Zones
                  </legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Clearance Cylinder Radius</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          step="1"
                          value={formState.linkingParameters?.clearanceRadiusMm || 45.0}
                          onChange={(e) => updateField('linkingParameters', 'clearanceRadiusMm', parseFloat(e.target.value) || 45.0)}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', color: '#1e293b', backgroundColor: '#ffffff' }}
                        />
                        <span style={{ color: '#64748b' }}>mm</span>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Retract Cylinder Radius</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          step="1"
                          value={formState.linkingParameters?.retractRadiusMm || 35.0}
                          onChange={(e) => updateField('linkingParameters', 'retractRadiusMm', parseFloat(e.target.value) || 35.0)}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', color: '#1e293b', backgroundColor: '#ffffff' }}
                        />
                        <span style={{ color: '#64748b' }}>mm</span>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Pass Transition</label>
                      <select
                        value={formState.linkingParameters?.transitionBetweenPasses || 'blend_loop'}
                        onChange={(e) => updateField('linkingParameters', 'transitionBetweenPasses', e.target.value)}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', color: '#1e293b', backgroundColor: '#ffffff' }}
                      >
                        <option value="blend_loop">3D Parabolic Blend Loop (Recommended)</option>
                        <option value="direct">Direct Stepover on Cylinder</option>
                        <option value="retract_cylinder">Full Retract to Clearance Radius</option>
                      </select>
                    </div>
                  </div>
                </fieldset>
              </div>
            )}

            {/* PAGE 9: MACHINE KINEMATICS & POST DIALECT */}
            {activePage === 'machine_kinematics' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px 14px', backgroundColor: '#ffffff' }}>
                  <legend style={{ padding: '0 4px', color: '#334155', fontWeight: 600, fontSize: '11.5px' }}>
                    Controller Dialect &amp; Rotary Interpolation
                  </legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Post Dialect</label>
                      <select
                        value={formState.machineKinematics?.postDialect || 'fanuc'}
                        onChange={(e) => updateField('machineKinematics', 'postDialect', e.target.value)}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', color: '#1e293b', backgroundColor: '#ffffff' }}
                      >
                        <option value="fanuc">Fanuc 30i / 31i / 0i-MF</option>
                        <option value="haas">Haas Automation 4-Axis</option>
                        <option value="siemens">Siemens Sinumerik 840D</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Feedrate Mode</label>
                      <select
                        value={formState.machineKinematics?.feedMode || 'deg_per_min'}
                        onChange={(e) => updateField('machineKinematics', 'feedMode', e.target.value)}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', color: '#1e293b', backgroundColor: '#ffffff' }}
                      >
                        <option value="deg_per_min">Degrees / Minute (G94)</option>
                        <option value="inverse_time">Inverse Time Feed (G93 - 1/min)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Rotary Axis Letter</label>
                      <input
                        type="text"
                        maxLength="1"
                        value={formState.machineKinematics?.rotaryAxisLetter || 'A'}
                        onChange={(e) => updateField('machineKinematics', 'rotaryAxisLetter', e.target.value.toUpperCase())}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', color: '#1e293b', fontWeight: 700, textTransform: 'uppercase', backgroundColor: '#ffffff' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                    <input
                      type="checkbox"
                      id="cyl_interp"
                      checked={formState.machineKinematics?.cylindricalInterpEnabled ?? true}
                      onChange={(e) => updateField('machineKinematics', 'cylindricalInterpEnabled', e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <label htmlFor="cyl_interp" style={{ color: '#334155', fontWeight: 500, cursor: 'pointer' }}>
                      Enable Fanuc G107 / G07.1 Cylindrical Interpolation
                    </label>
                  </div>
                </fieldset>
              </div>
            )}

            {/* PAGE 10: ARC FILTER & 4X TOLERANCE */}
            {activePage === 'arc_filter' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px 14px', backgroundColor: '#ffffff' }}>
                  <legend style={{ padding: '0 4px', color: '#334155', fontWeight: 600, fontSize: '11.5px' }}>
                    4-Axis Arc Filtering &amp; Tolerances
                  </legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Total Chordal Tolerance</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          step="0.005"
                          value={formState.arcFilter?.totalToleranceMm || 0.015}
                          onChange={(e) => updateField('arcFilter', 'totalToleranceMm', parseFloat(e.target.value) || 0.015)}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', color: '#1e293b', backgroundColor: '#ffffff' }}
                        />
                        <span style={{ color: '#64748b' }}>mm</span>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Max Angular Segment</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          step="1"
                          value={formState.arcFilter?.maxAngularSegmentDeg || 5.0}
                          onChange={(e) => updateField('arcFilter', 'maxAngularSegmentDeg', parseFloat(e.target.value) || 5.0)}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', color: '#1e293b', backgroundColor: '#ffffff' }}
                        />
                        <span style={{ color: '#64748b' }}>deg (°)</span>
                      </div>
                    </div>
                  </div>
                </fieldset>
              </div>
            )}

            {/* PAGE 11: PLANES & COOLANT */}
            {activePage === 'planes_coolant' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px 14px', backgroundColor: '#ffffff' }}>
                  <legend style={{ padding: '0 4px', color: '#334155', fontWeight: 600, fontSize: '11.5px' }}>
                    WCS &amp; Coolant Management
                  </legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Work Coordinate System (WCS)</label>
                      <select
                        value={formState.planesCoolant?.wcs || 'Top (G54)'}
                        onChange={(e) => updateField('planesCoolant', 'wcs', e.target.value)}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', color: '#1e293b', backgroundColor: '#ffffff' }}
                      >
                        <option value="Top (G54)">Top (G54 - Standard)</option>
                        <option value="G55">G55</option>
                        <option value="G56">G56</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Operator Message</label>
                      <input
                        type="text"
                        value={formState.planesCoolant?.operatorMessage || '4-AXIS ROTARY PASS'}
                        onChange={(e) => updateField('planesCoolant', 'operatorMessage', e.target.value)}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', color: '#1e293b', backgroundColor: '#ffffff' }}
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
                        checked={formState.planesCoolant?.coolantThruSpindle ?? false}
                        onChange={(e) => updateField('planesCoolant', 'coolantThruSpindle', e.target.checked)}
                      />
                      <span>Through Spindle (M88)</span>
                    </label>
                  </div>
                </fieldset>
              </div>
            )}
          </div>

          {/* Machinist Guide Drawer (Collapsible) */}
          {isGuideOpen && (
            <div
              style={{
                width: '280px',
                borderLeft: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                padding: '12px',
                overflowY: 'auto',
                fontSize: '11px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                flexShrink: 0
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
                  <Info size={13} color="#0284c7" /> 4-Axis Rotary Guide
                </span>
                <button
                  onClick={() => setIsGuideOpen(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', color: '#64748b' }}
                >
                  <X size={13} />
                </button>
              </div>

              <div>
                <h4 style={{ fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Axis Substitution Formula</h4>
                <p style={{ color: '#475569', lineHeight: 1.5 }}>
                  Converts planar Y positions into rotary A degrees around cylinder OD:
                </p>
                <div style={{ padding: '6px 8px', backgroundColor: '#f1f5f9', borderRadius: '3px', fontFamily: 'monospace', fontSize: '10.5px', margin: '4px 0', border: '1px solid #cbd5e1' }}>
                  A = (360° × Y) / (π × D_cyl)
                </div>
              </div>

              <div>
                <h4 style={{ fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Rotary Feedrate (deg/min)</h4>
                <p style={{ color: '#475569', lineHeight: 1.5 }}>
                  Linear feed F (mm/min) along cylinder circumference translates to:
                </p>
                <div style={{ padding: '6px 8px', backgroundColor: '#f1f5f9', borderRadius: '3px', fontFamily: 'monospace', fontSize: '10.5px', margin: '4px 0', border: '1px solid #cbd5e1' }}>
                  F_rot = (360° × F_lin) / (π × D_cyl)
                </div>
              </div>

              <div>
                <h4 style={{ fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Y-Offset Tangential Cutting</h4>
                <p style={{ color: '#475569', lineHeight: 1.5 }}>
                  Moving tool off-center produces positive cutting rake on cylindrical walls, eliminating rubbing and chatter.
                </p>
              </div>

              <div>
                <h4 style={{ fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Fanuc G107 / G07.1</h4>
                <p style={{ color: '#475569', lineHeight: 1.5 }}>
                  Enables CNC controller cylindrical interpolation, allowing circular arc programming (G02/G03) directly on cylinder face.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar: Telemetry HUD & Action Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 14px',
            backgroundColor: '#ffffff',
            borderTop: '1px solid #cbd5e1',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#64748b', fontWeight: 500 }}>Material:</span>
              <select
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                style={{ padding: '3px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', color: '#1e293b', backgroundColor: '#ffffff', fontWeight: 500 }}
              >
                {Object.values(ROTARY_4AXIS_MATERIALS).map((mat) => (
                  <option key={mat.id} value={mat.id.toUpperCase()}>
                    {mat.name.split(' ')[0]} ({mat.hardness})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ height: '16px', width: '1px', backgroundColor: '#cbd5e1' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#475569' }}>
              <div>
                <span style={{ color: '#94a3b8' }}>Cyl Dia: </span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{physics.cylinderDiameterMm}mm</span>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Rotary Feed: </span>
                <span style={{ fontWeight: 700, color: '#0284c7' }}>{physics.rotaryFeedDegMin}°/min</span>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Tool Vc: </span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{physics.toolVcMMin} m/min</span>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Scallop: </span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{physics.scallopMicrons} µm</span>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Power: </span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{physics.spindlePowerKw} kW</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleSave}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 14px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '3px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}
            >
              <Check size={13} />
              OK / Generate Toolpath
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '6px 12px',
                backgroundColor: '#f1f5f9',
                color: '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '3px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: '6px 12px',
                backgroundColor: '#f1f5f9',
                color: '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '3px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
