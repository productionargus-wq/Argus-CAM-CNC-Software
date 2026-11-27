import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X, Check, AlertTriangle, ShieldCheck, Cpu, Sliders,
  HelpCircle, Compass, Layers, RotateCw, RotateCcw, Activity, Sparkles, Orbit,
  CheckCircle2, Info, MoveUpRight, Zap, ArrowRight, CornerDownRight, Crosshair,
  Ruler, Eye
} from 'lucide-react';

import {
  MULTIAXIS_CURVE_PAGE_TITLES,
  MULTIAXIS_CURVE_MATERIALS,
  MULTIAXIS_CURVE_PRESETS,
  MULTIAXIS_CURVE_KINEMATICS,
  MULTIAXIS_CURVE_POST_DIALECTS,
  calculateMultiaxisCurvePhysics,
  createDefaultMultiaxisCurveParams,
  resolveDefaultCurveTool
} from '../config/multiaxisCurveSchema.js';

import { generateMultiaxisCurveToolpath, extract3DDriveCurve } from '../utils/multiaxisCurveEngine.js';

export default function MultiaxisCurveModal({
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

  const defaultTool = useMemo(() => resolveDefaultCurveTool(tools), [tools]);

  // Form State
  const [formState, setFormState] = useState(() => {
    if (operation && (operation.strategyKey === '5axis_curve' || operation.badgeClass === '5axis_curve')) {
      return {
        ...createDefaultMultiaxisCurveParams(tools, activeMachine),
        ...operation,
        tool: {
          ...operation.tool,
          id: operation.tool?.id || operation.toolId || (defaultTool?.id ?? 1),
          number: operation.tool?.number || operation.toolNumber || (defaultTool?.number ?? 1),
          name: operation.tool?.name || operation.toolName || (defaultTool?.name ?? '10.0mm Carbide Endmill'),
          type: operation.tool?.type || defaultTool?.type || 'flat',
          diameter: Number(operation.tool?.diameter || defaultTool?.diameter || 10.0),
          flutes: Number(operation.tool?.flutes || defaultTool?.flutes || 4),
          spindleSpeed: operation.tool?.spindleSpeed || operation.spindleSpeed || 11140,
          feedRate: operation.tool?.feedRate || operation.feedRate || 3565
        }
      };
    }
    const def = createDefaultMultiaxisCurveParams(tools, activeMachine);
    if (lastDefinedTool) {
      def.tool = {
        ...def.tool,
        id: lastDefinedTool.id || def.tool.id,
        number: lastDefinedTool.number || def.tool.number,
        name: lastDefinedTool.name || def.tool.name,
        type: lastDefinedTool.type || def.tool.type,
        diameter: Number(lastDefinedTool.diameter || def.tool.diameter),
        flutes: Number(lastDefinedTool.flutes || def.tool.flutes)
      };
    }
    return def;
  });

  const [activePage, setActivePage] = useState('toolpath_type');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState('ALU_6061');
  const [editedPages, setEditedPages] = useState(new Set(['toolpath_type', 'curve_selection', 'tool']));

  // Safe window dragging
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, posX: 0, posY: 0 });

  useEffect(() => {
    if (isOpen) {
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

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

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const targetY = dragRef.current.posY + dy;
    const modalH = Math.min(650, window.innerHeight - 120);
    const initialTop = (window.innerHeight - modalH) / 2;
    const minTopAllowed = 55;
    const clampedY = Math.max(minTopAllowed - initialTop, targetY);
    setPosition({ x: dragRef.current.posX + dx, y: clampedY });
  };

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const updateField = (pageKey, field, val) => {
    setFormState((prev) => ({
      ...prev,
      [pageKey]: {
        ...prev[pageKey],
        [field]: val
      }
    }));
    setEditedPages((prev) => new Set([...prev, pageKey]));
  };

  const handleApplyPreset = (presetKey) => {
    const pr = MULTIAXIS_CURVE_PRESETS[presetKey];
    if (!pr) return;
    setSelectedMaterial(pr.materialKey);
    setFormState((prev) => ({
      ...prev,
      selectedPresetKey: presetKey,
      selectedMaterialKey: pr.materialKey,
      tool: {
        ...prev.tool,
        diameter: pr.toolDia
      },
      cutParameters: {
        ...prev.cutParameters,
        cutterCompensation: pr.compSide,
        axialStepdownMm: pr.stepdownMm
      },
      toolAxisControl: {
        ...prev.toolAxisControl,
        axisMode: pr.axisMode,
        leadAngleDeg: pr.leadDeg,
        tiltAngleDeg: pr.tiltDeg
      }
    }));
    onNotify?.(`Applied 5-Axis Curve Preset: ${pr.name}`, 'info');
  };

  const physics = useMemo(() => {
    return calculateMultiaxisCurvePhysics(
      formState.tool,
      formState.cutParameters,
      selectedMaterial
    );
  }, [formState.tool, formState.cutParameters, selectedMaterial]);

  const handleSave = () => {
    onSaveOperation?.({
      ...formState,
      strategyKey: '5axis_curve',
      badgeClass: '5axis_curve',
      badgeText: '5X-CURVE',
      color: '#ec4899',
      physics
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(2px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: isDragging ? 'none' : 'auto'
      }}
    >
      <div
        style={{
          width: '940px',
          maxWidth: '96vw',
          height: '650px',
          maxHeight: 'calc(100vh - 100px)',
          backgroundColor: '#f1f5f9',
          border: '1px solid #94a3b8',
          borderRadius: '6px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: '12px',
          color: '#1e293b',
          transform: `translate(${position.x}px, ${position.y}px)`,
          transition: isDragging ? 'none' : 'transform 0.08s ease-out'
        }}
      >
        {/* Mastercam Header */}
        <div
          onMouseDown={handleMouseDown}
          onDoubleClick={() => setPosition({ x: 0, y: 0 })}
          style={{
            height: '38px',
            backgroundColor: '#1e293b',
            color: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 12px',
            cursor: isDragging ? 'grabbing' : 'grab',
            borderBottom: '1px solid #0f172a',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={17} color="#ec4899" />
            <span style={{ fontWeight: 600, fontSize: '13px', letterSpacing: '0.3px' }}>
              Argus CAM Intelligence 5-Axis Curve Machining Studio
            </span>
            <span
              style={{
                fontSize: '10px',
                backgroundColor: '#ec4899',
                color: '#ffffff',
                padding: '1px 6px',
                borderRadius: '3px',
                fontWeight: 700,
                letterSpacing: '0.5px'
              }}
            >
              5X-CURVE
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setIsGuideOpen(!isGuideOpen)}
              style={{
                background: 'none',
                border: 'none',
                color: isGuideOpen ? '#f472b6' : '#94a3b8',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '3px'
              }}
              title="Machinist Reference Guide"
            >
              <HelpCircle size={16} />
            </button>
            <button
              onClick={() => setPosition({ x: 0, y: 0 })}
              style={{
                background: 'none',
                border: '1px solid #475569',
                color: '#cbd5e1',
                cursor: 'pointer',
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '10px'
              }}
              title="Re-center dialog"
            >
              Re-center
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#cbd5e1',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '3px'
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
          {Object.values(MULTIAXIS_CURVE_PRESETS).map((pr) => (
            <button
              key={pr.id}
              onClick={() => handleApplyPreset(pr.id)}
              style={{
                padding: '3px 8px',
                fontSize: '11px',
                backgroundColor: formState.selectedPresetKey === pr.id ? '#fdf2f8' : '#f1f5f9',
                border: `1px solid ${formState.selectedPresetKey === pr.id ? '#ec4899' : '#cbd5e1'}`,
                borderRadius: '3px',
                color: formState.selectedPresetKey === pr.id ? '#be185d' : '#334155',
                cursor: 'pointer',
                fontWeight: formState.selectedPresetKey === pr.id ? 600 : 400,
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
          {/* Left Tree */}
          <div
            style={{
              width: '240px',
              backgroundColor: '#e2e8f0',
              borderRight: '1px solid #cbd5e1',
              display: 'flex',
              flexDirection: 'column',
              padding: '6px 0',
              overflowY: 'auto',
              flexShrink: 0
            }}
          >
            <div style={{ padding: '4px 12px 6px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Multiaxis Curve Pages
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', flex: 1 }}>
              {Object.entries(MULTIAXIS_CURVE_PAGE_TITLES).map(([key, title]) => {
                const isActive = activePage === key;
                return (
                  <div
                    key={key}
                    onClick={() => setActivePage(key)}
                    style={{
                      padding: '7px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      fontSize: '11.5px',
                      backgroundColor: isActive ? '#ffffff' : 'transparent',
                      color: isActive ? '#0f172a' : '#475569',
                      fontWeight: isActive ? 600 : 400,
                      borderLeft: isActive ? '3px solid #ec4899' : '3px solid transparent'
                    }}
                  >
                    <span>{title}</span>
                  </div>
                );
              })}
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
                    5-Axis Curve Contouring Strategy
                  </legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px', border: '1px solid #ec4899', backgroundColor: '#fdf2f8', borderRadius: '4px', cursor: 'pointer' }}>
                      <input type="radio" checked readOnly style={{ marginTop: '2px' }} />
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>Curve 5-Axis (Continuous 3D Contour)</div>
                        <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                          Drives the tool along 3D wireframe splines or CAD boundary edges with normal and lead/tilt vector orientation.
                        </div>
                      </div>
                    </label>
                  </div>
                </fieldset>

                {/* SVG 5-Axis Curve & Orientation Preview */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                    <div style={{ fontWeight: 600, fontSize: '11.5px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Activity size={14} color="#ec4899" />
                      <span>5-Axis Tool Orientation &amp; Vector Alignment</span>
                    </div>
                    <span style={{ fontSize: '10.5px', color: '#be185d', backgroundColor: '#fdf2f8', padding: '2px 8px', borderRadius: '3px', border: '1px solid #fbcfe8', fontWeight: 600 }}>
                      Lead: {formState.toolAxisControl?.leadAngleDeg}° | Tilt: {formState.toolAxisControl?.tiltAngleDeg}°
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', alignItems: 'center' }}>
                    {/* SVG Curve Diagram */}
                    <div style={{ backgroundColor: '#0f172a', borderRadius: '4px', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid #334155' }}>
                      <svg width="270" height="90" viewBox="0 0 270 90" style={{ overflow: 'visible' }}>
                        {/* 3D Drive Curve */}
                        <path d="M 30 70 Q 100 25 150 50 T 240 30" fill="none" stroke="#ec4899" strokeWidth="2.5" />

                        {/* Tool orientation needles along curve */}
                        <line x1="60" y1="52" x2="52" y2="20" stroke="#38bdf8" strokeWidth="1.8" />
                        <circle cx="52" cy="20" r="3" fill="#38bdf8" />

                        <line x1="120" y1="36" x2="115" y2="6" stroke="#38bdf8" strokeWidth="1.8" />
                        <circle cx="115" cy="6" r="3" fill="#38bdf8" />

                        <line x1="185" y1="42" x2="190" y2="12" stroke="#38bdf8" strokeWidth="1.8" />
                        <circle cx="190" cy="12" r="3" fill="#38bdf8" />

                        {/* Cutter silhouette at active contact */}
                        <rect x="110" y="4" width="10" height="24" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="1" transform="rotate(-10 115 16)" />
                        <circle cx="119" cy="36" r="4" fill="#ec4899" />

                        <text x="30" y="85" fill="#94a3b8" fontSize="8">Drive Curve (3D Spline)</text>
                        <text x="140" y="16" fill="#38bdf8" fontSize="8" fontWeight="600">5-Axis Spindle Vector</text>
                      </svg>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ padding: '6px 8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11px', color: '#475569' }}>Cutter Comp:</span>
                        <strong style={{ fontSize: '11px', color: '#be185d', textTransform: 'capitalize' }}>
                          {formState.cutParameters?.cutterCompensation} (Offset: {formState.cutParameters?.sideOffsetMm}mm)
                        </strong>
                      </div>
                      <div style={{ padding: '6px 8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11px', color: '#475569' }}>Depth Passes:</span>
                        <strong style={{ fontSize: '11px', color: '#0369a1' }}>
                          {formState.cutParameters?.passesCount} passes ({formState.cutParameters?.axialStepdownMm}mm / pass)
                        </strong>
                      </div>
                      <div style={{ padding: '6px 8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11px', color: '#475569' }}>TCPM Post:</span>
                        <strong style={{ fontSize: '11px', color: '#16a34a' }}>
                          Fanuc G43.4 / Haas G234
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PAGE 2: CURVE SELECTION */}
            {activePage === 'curve_selection' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px 14px', backgroundColor: '#ffffff' }}>
                  <legend style={{ padding: '0 4px', color: '#334155', fontWeight: 600, fontSize: '11.5px' }}>
                    Drive Geometry &amp; Surface Normal Source
                  </legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Drive Curve Type</label>
                      <select
                        value={formState.curveSelection?.driveCurveType || '3d_cad_edge'}
                        onChange={(e) => updateField('curveSelection', 'driveCurveType', e.target.value)}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', color: '#1e293b' }}
                      >
                        <option value="3d_cad_edge">3D Solid CAD Edges (Boundary Loops)</option>
                        <option value="wireframe_spline">Wireframe 3D Spline / Curves</option>
                        <option value="silhouette_edge">Part Silhouette Boundary</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Surface Reference for Normals</label>
                      <select
                        value={formState.curveSelection?.surfaceReference || 'underlying_cad_faces'}
                        onChange={(e) => updateField('curveSelection', 'surfaceReference', e.target.value)}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', color: '#1e293b' }}
                      >
                        <option value="underlying_cad_faces">Underlying CAD Drive Faces</option>
                        <option value="user_selected_surfaces">User Selected Guide Surfaces</option>
                        <option value="plane_projection">Projected Normal Plane</option>
                      </select>
                    </div>
                  </div>
                </fieldset>
              </div>
            )}

            {/* PAGE 5: CUT PARAMETERS */}
            {activePage === 'cut_parameters' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px 14px', backgroundColor: '#ffffff' }}>
                  <legend style={{ padding: '0 4px', color: '#334155', fontWeight: 600, fontSize: '11.5px' }}>
                    Cutter Compensation &amp; Depths
                  </legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Compensation Side</label>
                      <select
                        value={formState.cutParameters?.cutterCompensation || 'left'}
                        onChange={(e) => updateField('cutParameters', 'cutterCompensation', e.target.value)}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', color: '#1e293b' }}
                      >
                        <option value="left">Left (Climb Milling)</option>
                        <option value="right">Right (Conventional)</option>
                        <option value="center">Center (On Curve)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Axial Stepdown (ap)</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          step="0.5"
                          min="0.1"
                          value={formState.cutParameters?.axialStepdownMm || 2.0}
                          onChange={(e) => updateField('cutParameters', 'axialStepdownMm', parseFloat(e.target.value) || 2.0)}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', color: '#1e293b' }}
                        />
                        <span style={{ color: '#64748b' }}>mm</span>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Total Depth</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          value={formState.cutParameters?.totalDepthMm || 6.0}
                          onChange={(e) => updateField('cutParameters', 'totalDepthMm', parseFloat(e.target.value) || 6.0)}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', color: '#1e293b' }}
                        />
                        <span style={{ color: '#64748b' }}>mm</span>
                      </div>
                    </div>
                  </div>
                </fieldset>
              </div>
            )}

            {/* PAGE 6: TOOL AXIS CONTROL */}
            {activePage === 'tool_axis_control' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px 14px', backgroundColor: '#ffffff' }}>
                  <legend style={{ padding: '0 4px', color: '#334155', fontWeight: 600, fontSize: '11.5px' }}>
                    5-Axis Tool Orientation
                  </legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Orientation Mode</label>
                      <select
                        value={formState.toolAxisControl?.axisMode || 'surface_normal'}
                        onChange={(e) => updateField('toolAxisControl', 'axisMode', e.target.value)}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', color: '#1e293b' }}
                      >
                        <option value="surface_normal">Normal to Drive Surface</option>
                        <option value="lead_tilt">Surface Normal + Lead &amp; Tilt</option>
                        <option value="fixed_angle">Fixed Angle to Z-Axis</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Forward Lead Angle (α)</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          step="1"
                          value={formState.toolAxisControl?.leadAngleDeg || 0.0}
                          onChange={(e) => updateField('toolAxisControl', 'leadAngleDeg', parseFloat(e.target.value) || 0.0)}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', color: '#1e293b' }}
                        />
                        <span style={{ color: '#64748b' }}>deg</span>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Sideways Tilt Angle (β)</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          step="1"
                          value={formState.toolAxisControl?.tiltAngleDeg || 0.0}
                          onChange={(e) => updateField('toolAxisControl', 'tiltAngleDeg', parseFloat(e.target.value) || 0.0)}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', color: '#1e293b' }}
                        />
                        <span style={{ color: '#64748b' }}>deg</span>
                      </div>
                    </div>
                  </div>
                </fieldset>
              </div>
            )}

            {/* OTHER PAGES FALLBACK */}
            {activePage !== 'toolpath_type' && activePage !== 'curve_selection' && activePage !== 'cut_parameters' && activePage !== 'tool_axis_control' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '14px', backgroundColor: '#ffffff' }}>
                  <legend style={{ padding: '0 4px', color: '#334155', fontWeight: 600, fontSize: '11.5px' }}>
                    {MULTIAXIS_CURVE_PAGE_TITLES[activePage] || 'Parameters'}
                  </legend>
                  <p style={{ color: '#64748b', fontSize: '11.5px' }}>
                    Standard Argus CAM Intelligence 5-axis parameters configured for <strong>{MULTIAXIS_CURVE_PAGE_TITLES[activePage]}</strong>.
                  </p>
                </fieldset>
              </div>
            )}
          </div>
        </div>

        {/* Footer Bar */}
        <div
          style={{
            height: '48px',
            backgroundColor: '#ffffff',
            borderTop: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 14px',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#475569' }}>
            <span>Material:</span>
            <select
              value={selectedMaterial}
              onChange={(e) => setSelectedMaterial(e.target.value)}
              style={{ padding: '2px 6px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
            >
              {Object.values(MULTIAXIS_CURVE_MATERIALS).map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <span>Cutting Speed: <strong>{physics.vcMMin} m/min</strong></span>
            <span>Feed Rate: <strong>{physics.feedRateMmMin} mm/min</strong></span>
            <span>Power: <strong>{physics.cuttingPowerKw} kW</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '5px 12px',
                fontSize: '11px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#334155',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: '5px 14px',
                fontSize: '11px',
                fontWeight: 600,
                border: '1px solid #db2777',
                backgroundColor: '#ec4899',
                color: '#ffffff',
                borderRadius: '3px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Check size={14} /> OK / Generate Toolpath
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
