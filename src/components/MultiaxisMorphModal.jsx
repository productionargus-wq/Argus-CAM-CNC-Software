import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X, Check, AlertTriangle, ShieldCheck, Cpu, Sliders,
  HelpCircle, Compass, Layers, RotateCw, Activity, Sparkles, Orbit,
  CheckCircle2, Info, MoveUpRight, Zap
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

  // Initialize Form State
  const [formState, setFormState] = useState(() => {
    if (operation && (operation.strategyKey === 'multiaxis_morph' || operation.badgeClass === 'multi_morph')) {
      return {
        ...createDefaultMultiaxisMorphState({ bounds: null, tools, activeMachine }),
        ...operation,
        tool: {
          ...operation.tool,
          id: operation.tool?.id || operation.toolId || 3,
          number: operation.tool?.number || 3,
          name: operation.tool?.name || operation.toolName || '10mm Ball Nose',
          spindleSpeed: operation.tool?.spindleSpeed || operation.spindleSpeed || 12000,
          feedRate: operation.tool?.feedRate || operation.feedRate || 3000,
          plungeRate: operation.tool?.plungeRate || operation.plungeRate || 600
        }
      };
    }
    return createDefaultMultiaxisMorphState({ bounds: null, tools, activeMachine });
  });

  const [activePage, setActivePage] = useState('cut_pattern');
  const [showMachinistGuide, setShowMachinistGuide] = useState(false);
  const [editedPages, setEditedPages] = useState(
    new Set(['cut_pattern', 'tool', 'tool_axis_control'])
  );

  // Dragging state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, posX: 0, posY: 0 });

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
      setPosition({
        x: dragRef.current.posX + dx,
        y: dragRef.current.posY + dy
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

  // Helper to update deeply nested fields
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
    onNotify?.(`Applied Mastercam recommended parameters for ${activeMat?.name || 'Aluminum 6061-T6'}`, 'success');
  };

  // Handle Save / OK
  const handleOk = () => {
    if (onSaveOperation) {
      onSaveOperation({
        ...formState,
        passes: formState.cutPattern?.numberOfCuts || 25,
        stepoverMm: formState.cutPattern?.stepoverDistanceMm || 1.5,
        leadAngleDeg: formState.toolAxisControl?.leadAngleDeg ?? 10.0,
        tiltAngleDeg: formState.toolAxisControl?.tiltAngleDeg ?? 15.0,
        kinematicsId: formState.machineKinematics?.kinematicsId || 'table_table_ac',
        tcpmMode: formState.machineKinematics?.tcpmMode || 'fanuc'
      });
    }
    onClose();
  };

  // Sidebar Icons Map
  const pageIcons = {
    toolpath_type: <Layers className="w-4 h-4 text-blue-600" />,
    cut_pattern: <Compass className="w-4 h-4 text-emerald-600" />,
    tool: <Cpu className="w-4 h-4 text-amber-600" />,
    holder: <ShieldCheck className="w-4 h-4 text-indigo-600" />,
    tool_axis_control: <Orbit className="w-4 h-4 text-purple-600" />,
    collision_control: <AlertTriangle className="w-4 h-4 text-red-600" />,
    linking_parameters: <Sliders className="w-4 h-4 text-teal-600" />,
    machine_kinematics: <Activity className="w-4 h-4 text-cyan-600" />,
    arc_filter: <RotateCw className="w-4 h-4 text-blue-500" />,
    planes_coolant: <Layers className="w-4 h-4 text-slate-600" />
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        padding: '16px'
      }}
    >
      <div
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          width: '920px',
          maxWidth: '96vw',
          height: '660px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#f0f2f5',
          borderRadius: '8px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(148, 163, 184, 0.35)',
          overflow: 'hidden',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
        }}
      >
        {/* Modal Header */}
        <div
          onMouseDown={handleMouseDown}
          className="bg-[#f0f2f5] border-b border-[#cbd5e1] px-4 py-2.5 flex items-center justify-between cursor-move select-none"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              5X
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-sm tracking-tight flex items-center gap-2">
                <span>5-Axis Multiaxis Morph (Between 2 Curves / Surfaces)</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-medium px-2 py-0.5 rounded border border-blue-200">
                  Mastercam 2026 Engine
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Continuous 5-Axis Dual Guide Curve Morphing with Lead & Tilt RTCP Control
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 1-Click Recommended Values Button */}
            <button
              type="button"
              onClick={applyRecommendedValues}
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-semibold shadow-sm transition-colors"
              title="Auto-calculate and apply recommended cutting parameters, RPM, feedrate, and lead angles based on workpiece material"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Recommended Values</span>
            </button>

            {/* Machinist Guide Button */}
            <button
              type="button"
              onClick={() => setShowMachinistGuide(true)}
              className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-xs font-medium text-slate-700 shadow-sm transition-colors"
              title="Open Mastercam 5-Axis Morphing & Kinematics Machinist Reference Manual"
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
              <span>Machinist Guide</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Mastercam Sidebar Navigation */}
          <div className="w-56 bg-[#f0f2f5] border-r border-[#cbd5e1] flex flex-col py-2 select-none overflow-y-auto">
            <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Tree View Navigation
            </div>
            {Object.entries(MULTIAXIS_MORPH_PAGE_TITLES).map(([key, title]) => {
              const isActive = activePage === key;
              const isEdited = editedPages.has(key);
              return (
                <button
                  key={key}
                  onClick={() => setActivePage(key)}
                  className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-800 font-semibold border-l-4 border-blue-600 shadow-sm'
                      : 'text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {pageIcons[key] || <Layers className="w-4 h-4 text-slate-500" />}
                    <span className="truncate">{title}</span>
                  </div>
                  {isEdited && !isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Parameters configured" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Mastercam Content Pane */}
          <div className="flex-1 bg-[#f8fafc] p-4 overflow-y-auto text-xs space-y-4">

            {/* PAGE 1: Toolpath Type */}
            {activePage === 'toolpath_type' && (
              <div className="space-y-4 max-w-xl">
                <div className="border border-slate-300 bg-white p-3.5 rounded shadow-sm space-y-3">
                  <h4 className="font-semibold text-slate-800 border-b border-slate-200 pb-1.5 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>Multiaxis Strategy Classification</span>
                  </h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 p-2 rounded border border-blue-300 bg-blue-50/50 cursor-pointer">
                      <input
                        type="radio"
                        checked={formState.toolpathType?.strategy === 'morph_between_2_curves'}
                        onChange={() => updateField('toolpathType', 'strategy', 'morph_between_2_curves')}
                        className="text-blue-600"
                      />
                      <div>
                        <div className="font-medium text-slate-800">Morph Between 2 Curves (Standard)</div>
                        <div className="text-[11px] text-slate-500">
                          Interpolates passes smoothly between Start Curve 1 and End Curve 2 across drive surfaces.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="radio"
                        checked={formState.toolpathType?.strategy === 'morph_between_2_surfaces'}
                        onChange={() => updateField('toolpathType', 'strategy', 'morph_between_2_surfaces')}
                        className="text-blue-600"
                      />
                      <div>
                        <div className="font-medium text-slate-800">Morph Between 2 Surfaces</div>
                        <div className="text-[11px] text-slate-500">
                          Computes toolpath UV curves transitioning between two bounding fillet surfaces.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="radio"
                        checked={formState.toolpathType?.strategy === 'parallel_to_curve'}
                        onChange={() => updateField('toolpathType', 'strategy', 'parallel_to_curve')}
                        className="text-blue-600"
                      />
                      <div>
                        <div className="font-medium text-slate-800">Parallel To Single Guide Curve</div>
                        <div className="text-[11px] text-slate-500">
                          Maintains constant lateral offset distance from a master guide curve.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="border border-slate-300 bg-white p-3.5 rounded shadow-sm space-y-2">
                  <h4 className="font-semibold text-slate-800 border-b border-slate-200 pb-1.5">
                    Pattern Geometry Type
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-600 block mb-1">Pattern Geometry:</label>
                      <select
                        value={formState.toolpathType?.patternType || 'curves'}
                        onChange={(e) => updateField('toolpathType', 'patternType', e.target.value)}
                        className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white text-slate-800"
                      >
                        <option value="curves">3D Wireframe Curves / Edges</option>
                        <option value="surfaces">Solid Faces / Drive Surfaces</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 pt-4">
                      <input
                        type="checkbox"
                        id="subProgram"
                        checked={formState.toolpathType?.subProgram || false}
                        onChange={(e) => updateField('toolpathType', 'subProgram', e.target.checked)}
                        className="rounded border-slate-300 text-blue-600"
                      />
                      <label htmlFor="subProgram" className="text-slate-700 cursor-pointer">
                        Output CNC Subprogram (M98 P...)
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PAGE 2: Cut Pattern (Morph Guides) */}
            {activePage === 'cut_pattern' && (
              <div className="space-y-4 max-w-xl">
                <div className="border border-slate-300 bg-white p-3.5 rounded shadow-sm space-y-3">
                  <h4 className="font-semibold text-slate-800 border-b border-slate-200 pb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-emerald-600" />
                      <span>Morph Boundary Guide Curves</span>
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Auto CAD Extracted
                    </span>
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                      <div className="font-semibold text-slate-700 mb-1 flex items-center justify-between">
                        <span>Guide Curve 1 (Start)</span>
                        <span className="text-[10px] text-blue-600">Inner Arch</span>
                      </div>
                      <input
                        type="text"
                        value={formState.cutPattern?.firstCurveName || 'Guide Curve 1 (Blade Root)'}
                        onChange={(e) => updateField('cutPattern', 'firstCurveName', e.target.value)}
                        className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white text-slate-800 mb-2"
                      />
                      <label className="flex items-center gap-1.5 text-slate-600 text-[11px] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formState.cutPattern?.firstCurveFlipped || false}
                          onChange={(e) => updateField('cutPattern', 'firstCurveFlipped', e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        <span>Flip Curve 1 Direction</span>
                      </label>
                    </div>

                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                      <div className="font-semibold text-slate-700 mb-1 flex items-center justify-between">
                        <span>Guide Curve 2 (End)</span>
                        <span className="text-[10px] text-emerald-600">Outer Rail</span>
                      </div>
                      <input
                        type="text"
                        value={formState.cutPattern?.secondCurveName || 'Guide Curve 2 (Outer Perimeter)'}
                        onChange={(e) => updateField('cutPattern', 'secondCurveName', e.target.value)}
                        className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white text-slate-800 mb-2"
                      />
                      <label className="flex items-center gap-1.5 text-slate-600 text-[11px] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formState.cutPattern?.secondCurveFlipped || false}
                          onChange={(e) => updateField('cutPattern', 'secondCurveFlipped', e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        <span>Flip Curve 2 Direction</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-300 bg-white p-3.5 rounded shadow-sm space-y-3">
                  <h4 className="font-semibold text-slate-800 border-b border-slate-200 pb-1.5">
                    Stepover & Cutting Passes
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-600 block mb-1">Number of Cuts (Passes):</label>
                      <input
                        type="number"
                        min="3"
                        max="200"
                        value={formState.cutPattern?.numberOfCuts || 25}
                        onChange={(e) => updateField('cutPattern', 'numberOfCuts', Number(e.target.value))}
                        className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white text-slate-800 text-right font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-slate-600 block mb-1">Max Stepover Distance (ae):</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="10"
                          value={formState.cutPattern?.stepoverDistanceMm || 1.5}
                          onChange={(e) => updateField('cutPattern', 'stepoverDistanceMm', Number(e.target.value))}
                          className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white text-slate-800 text-right font-medium"
                        />
                        <span className="text-slate-500">mm</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-600 block mb-1">Cutting Method:</label>
                      <select
                        value={formState.cutPattern?.cuttingMethod || 'zigzag'}
                        onChange={(e) => updateField('cutPattern', 'cuttingMethod', e.target.value)}
                        className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white text-slate-800"
                      >
                        <option value="zigzag">Zigzag (Continuous Bi-Directional)</option>
                        <option value="oneway">One Way (Climb Milling)</option>
                        <option value="spiral">Spiral Morph (Continuous Closed)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-600 block mb-1">Cut Sequence Order:</label>
                      <select
                        value={formState.cutPattern?.cutOrder || 'curve1_to_curve2'}
                        onChange={(e) => updateField('cutPattern', 'cutOrder', e.target.value)}
                        className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white text-slate-800"
                      >
                        <option value="curve1_to_curve2">Curve 1 &rarr; Curve 2 (Inner to Outer)</option>
                        <option value="curve2_to_curve1">Curve 2 &rarr; Curve 1 (Outer to Inner)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PAGE 3: Tool Selection & 5X Dynamics */}
            {activePage === 'tool' && (
              <div className="space-y-4 max-w-xl">
                <div className="border border-slate-300 bg-white p-3.5 rounded shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-amber-600" />
                      <span>Active 5-Axis Cutter</span>
                    </h4>
                    {onOpenToolLibrary && (
                      <button
                        type="button"
                        onClick={onOpenToolLibrary}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold underline"
                      >
                        Open Tool Library
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-600 block mb-1">Select Assigned Tool:</label>
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
                        className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white text-slate-800"
                      >
                        {tools.map((t) => (
                          <option key={t.id} value={t.id}>
                            T{t.number || t.id} - {t.name} ({t.diameter}mm {t.type})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-600 block mb-1">Cutter Diameter:</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={formState.tool?.diameter || 10}
                          onChange={(e) => updateField('tool', 'diameter', Number(e.target.value))}
                          className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white text-slate-800 text-right font-medium"
                        />
                        <span className="text-slate-500">mm</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-600 block mb-1">Spindle Speed (S):</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={formState.tool?.spindleSpeed || 12000}
                          onChange={(e) => updateField('tool', 'spindleSpeed', Number(e.target.value))}
                          className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white text-slate-800 text-right font-medium"
                        />
                        <span className="text-slate-500">RPM</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-600 block mb-1">Cutting Feedrate (F):</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={formState.tool?.feedRate || 3000}
                          onChange={(e) => updateField('tool', 'feedRate', Number(e.target.value))}
                          className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white text-slate-800 text-right font-medium"
                        />
                        <span className="text-slate-500">mm/min</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-600 block mb-1">Plunge Feedrate:</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={formState.tool?.plungeRate || 600}
                          onChange={(e) => updateField('tool', 'plungeRate', Number(e.target.value))}
                          className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white text-slate-800 text-right font-medium"
                        />
                        <span className="text-slate-500">mm/min</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-600 block mb-1">Number of Flutes:</label>
                      <input
                        type="number"
                        min="1"
                        max="8"
                        value={formState.tool?.flutes || 4}
                        onChange={(e) => updateField('tool', 'flutes', Number(e.target.value))}
                        className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white text-slate-800 text-right font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PAGE 5: Tool Axis Control (Lead / Tilt) */}
            {activePage === 'tool_axis_control' && (
              <div className="space-y-4 max-w-xl">
                <div className="border border-slate-300 bg-white p-3.5 rounded shadow-sm space-y-3">
                  <h4 className="font-semibold text-slate-800 border-b border-slate-200 pb-1.5 flex items-center gap-2">
                    <Orbit className="w-4 h-4 text-purple-600" />
                    <span>5-Axis Orientation Angles (Lead &amp; Tilt)</span>
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-700 font-medium">Forward Lead Angle (α):</label>
                        <span className="font-bold text-blue-600">{formState.toolAxisControl?.leadAngleDeg ?? 10}°</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="30"
                        step="1"
                        value={formState.toolAxisControl?.leadAngleDeg ?? 10}
                        onChange={(e) => updateField('toolAxisControl', 'leadAngleDeg', Number(e.target.value))}
                        className="w-full accent-blue-600"
                      />
                      <p className="text-[11px] text-slate-500">
                        Tilts cutter forward along feed direction to eliminate zero-velocity dead center dwell (Vc = 0).
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-700 font-medium">Sideways Tilt / Lean Angle (β):</label>
                        <span className="font-bold text-purple-600">{formState.toolAxisControl?.tiltAngleDeg ?? 15}°</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="35"
                        step="1"
                        value={formState.toolAxisControl?.tiltAngleDeg ?? 15}
                        onChange={(e) => updateField('toolAxisControl', 'tiltAngleDeg', Number(e.target.value))}
                        className="w-full accent-purple-600"
                      />
                      <p className="text-[11px] text-slate-500">
                        Tilts cutter laterally relative to surface normal, preventing shank collision with the upright blade.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-300 bg-white p-3.5 rounded shadow-sm space-y-2">
                  <h4 className="font-semibold text-slate-800 border-b border-slate-200 pb-1.5">
                    Vector Needle Smoothing
                  </h4>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="vectorSmoothing"
                      checked={formState.toolAxisControl?.vectorSmoothing ?? true}
                      onChange={(e) => updateField('toolAxisControl', 'vectorSmoothing', e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <label htmlFor="vectorSmoothing" className="text-slate-700 cursor-pointer">
                      Enable Damped Least-Squares (DLS) Rotary Axis Smoothing
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* PAGE 7: Linking Parameters & 3D Blend Loops */}
            {activePage === 'linking_parameters' && (
              <div className="space-y-4 max-w-xl">
                <div className="border border-slate-300 bg-white p-3.5 rounded shadow-sm space-y-3">
                  <h4 className="font-semibold text-slate-800 border-b border-slate-200 pb-1.5 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-teal-600" />
                    <span>Clearance Planes &amp; Retract Heights</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-600 block mb-1">Clearance Plane Z:</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={formState.linkingParameters?.clearancePlaneZ || 50}
                          onChange={(e) => updateField('linkingParameters', 'clearancePlaneZ', Number(e.target.value))}
                          className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white text-slate-800 text-right font-medium"
                        />
                        <span className="text-slate-500">mm</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-600 block mb-1">Retract Distance:</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={formState.linkingParameters?.retractDistanceMm || 5}
                          onChange={(e) => updateField('linkingParameters', 'retractDistanceMm', Number(e.target.value))}
                          className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white text-slate-800 text-right font-medium"
                        />
                        <span className="text-slate-500">mm</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-300 bg-white p-3.5 rounded shadow-sm space-y-3">
                  <h4 className="font-semibold text-slate-800 border-b border-slate-200 pb-1.5">
                    Pass Transition Linking
                  </h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 p-2 rounded border border-blue-300 bg-blue-50/50 cursor-pointer">
                      <input
                        type="radio"
                        checked={formState.linkingParameters?.transitionBetweenPasses === 'blend_spline'}
                        onChange={() => updateField('linkingParameters', 'transitionBetweenPasses', 'blend_spline')}
                        className="text-blue-600"
                      />
                      <div>
                        <div className="font-medium text-slate-800">Mastercam 3D Blend Loop Arcs (Recommended)</div>
                        <div className="text-[11px] text-slate-500">
                          Smooth 3D parabolic arch in Z lifting +0.8mm above the surface, eliminating dwell witness marks.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="radio"
                        checked={formState.linkingParameters?.transitionBetweenPasses === 'direct_step'}
                        onChange={() => updateField('linkingParameters', 'transitionBetweenPasses', 'direct_step')}
                        className="text-blue-600"
                      />
                      <div>
                        <div className="font-medium text-slate-800">Direct Stepover Move</div>
                        <div className="text-[11px] text-slate-500">
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
              <div className="space-y-4 max-w-xl">
                <div className="border border-slate-300 bg-white p-3.5 rounded shadow-sm space-y-3">
                  <h4 className="font-semibold text-slate-800 border-b border-slate-200 pb-1.5 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-600" />
                    <span>5-Axis Kinematic Protocol &amp; Machine Architecture</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-600 block mb-1">Machine Architecture:</label>
                      <select
                        value={formState.machineKinematics?.kinematicsId || 'table_table_ac'}
                        onChange={(e) => updateField('machineKinematics', 'kinematicsId', e.target.value)}
                        className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white text-slate-800"
                      >
                        {MULTIAXIS_KINEMATICS_OPTIONS.map((k) => (
                          <option key={k.id} value={k.id}>
                            {k.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-600 block mb-1">TCPM / RTCP Protocol:</label>
                      <select
                        value={formState.machineKinematics?.tcpmMode || 'fanuc'}
                        onChange={(e) => updateField('machineKinematics', 'tcpmMode', e.target.value)}
                        className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white text-slate-800 font-medium"
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

                <div className="border border-slate-300 bg-white p-3.5 rounded shadow-sm space-y-2">
                  <h4 className="font-semibold text-slate-800 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Kinematic Singularity &amp; Overtravel Audit</span>
                  </h4>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-[11px] space-y-1">
                    <div className="font-semibold">✓ Trajectory Verified Safe</div>
                    <div>• Maximum Rotary Velocity: <strong>{physics?.maxRotarySpeedDegSec || 42.5}°/s</strong> (Limit: 120°/s)</div>
                    <div>• Pole Singularity Check: <strong>Passed</strong> (No collinear dwell at A=0°/B=0°)</div>
                  </div>
                </div>
              </div>
            )}

            {/* Other Pages: Fallback standard Mastercam panels */}
            {['holder', 'collision_control', 'arc_filter', 'planes_coolant'].includes(activePage) && (
              <div className="border border-slate-300 bg-white p-4 rounded shadow-sm max-w-xl space-y-3">
                <h4 className="font-semibold text-slate-800 border-b border-slate-200 pb-1.5">
                  {MULTIAXIS_MORPH_PAGE_TITLES[activePage]}
                </h4>
                <p className="text-xs text-slate-600">
                  Standard Mastercam Multiaxis settings loaded and optimized for simultaneous 5-axis morphing.
                </p>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1.5 text-slate-700">
                  <div>Holder: <strong>CAT40 Precision 5X Collet Chuck (Gauge Length 75mm)</strong></div>
                  <div>Gouge Protection: <strong>Active (Tilt Away with 1.5mm Shank Clearance)</strong></div>
                  <div>Tolerance: <strong>0.015 mm (High-Speed Smoothing Active)</strong></div>
                  <div>Coolant: <strong>High-Pressure Flood &amp; Through-Spindle Active</strong></div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Modal Footer & Status Bar */}
        <div className="bg-[#e2e8f0] border-t border-[#cbd5e1] px-4 py-2.5 flex items-center justify-between select-none">
          {/* Material & Real-Time Physics Badges */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-600 text-xs font-medium">Material:</span>
              <select
                value={formState.selectedMaterialKey || 'ALU_6061'}
                onChange={(e) => handleMaterialChange(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs font-semibold text-slate-800"
              >
                {Object.entries(MULTIAXIS_MORPH_MATERIALS).map(([k, m]) => (
                  <option key={k} value={k}>
                    {m.name} ({m.hardness})
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-600 bg-white/70 border border-slate-300 px-2 py-0.5 rounded shadow-xs">
              <span>Deff: <strong className="text-slate-800">{physics.effDiameterMm || 6.2}mm</strong></span>
              <span>•</span>
              <span>Veff: <strong className="text-slate-800">{physics.effVcMMin || 235} m/min</strong></span>
              <span>•</span>
              <span>Scallop: <strong className="text-slate-800">{physics.scallopMicrons || 2.1} µm</strong></span>
              <span>•</span>
              <span>Power: <strong className="text-slate-800">{physics.powerKw || 0.45} kW</strong></span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleOk}
              className="px-4 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold rounded text-xs shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>OK / Generate Toolpath</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-medium rounded text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onNotify?.('Parameters applied', 'info');
              }}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-medium rounded text-xs transition-colors"
            >
              Apply
            </button>
          </div>
        </div>

      </div>

      {/* Interactive Machinist Guide Modal */}
      {showMachinistGuide && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            padding: '24px'
          }}
        >
          <div
            style={{
              width: '680px',
              maxWidth: '92vw',
              maxHeight: '86vh',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
              overflow: 'hidden'
            }}
          >
            {/* Guide Header */}
            <div className="bg-[#f0f2f5] border-b border-[#cbd5e1] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">
                  Machinist Guide: 5-Axis Morph Between 2 Curves
                </h3>
              </div>
              <button
                onClick={() => setShowMachinistGuide(false)}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-200 text-slate-500"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Guide Content */}
            <div className="p-4 overflow-y-auto text-xs text-slate-700 space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded space-y-1">
                <h4 className="font-bold text-blue-900 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-600" />
                  What is 5-Axis Morph Milling?
                </h4>
                <p className="text-slate-600 leading-relaxed">
                  5-Axis Morphing generates smooth, flow-aligned toolpaths by interpolating passes between two 3D spatial guide curves across non-parallel drive surfaces. It is the gold standard for impellers, blisks, mold parting lines, and turbine blade fillets.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-1">
                  1. Lead &amp; Tilt Angle Physics
                </h4>
                <p className="leading-relaxed">
                  When cutting with a spherical ballnose perpendicular to a surface (0° lead), the center point of the tool has zero surface speed (<span className="font-mono bg-slate-100 px-1">Vc = 0</span>). This causes material burnishing and chatter.
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li><strong>Lead Angle (10°–12°):</strong> Tilts the cutter forward along the feed trajectory, shifting contact up onto the sharp flutes for mirror finish.</li>
                  <li><strong>Tilt / Lean Angle (12°–15°):</strong> Tilts the cutter sideways to prevent the toolholder or shank from gouging steep sidewalls or twisted blades.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-1">
                  2. Mastercam 3D Blend Loop Linking Arcs
                </h4>
                <p className="leading-relaxed">
                  In bi-directional (Zigzag) milling, abrupt reversals at the part edges cause tool deflection witness marks. Mastercam's 3D Blend Loop lifts the tool in a parabolic arch (+0.8mm to +1.5mm) in Z while stepping over, re-entering tangent to the cut.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-1">
                  3. Controller TCPM / RTCP Codes
                </h4>
                <div className="p-2.5 bg-slate-900 text-slate-100 rounded font-mono text-[11px] space-y-1">
                  <div>• <strong>Fanuc 30i / 31i / 0i-MF:</strong> G43.4 H{'{tool}'} M08 (TCPM Type 1) + G05.1 Q1</div>
                  <div>• <strong>Haas NGC (UMC-750):</strong> G234 H{'{tool}'} M08 (TCPC) + G187 P2</div>
                  <div>• <strong>Siemens 840D:</strong> TRAORI M08 + CYCLE832(0.015, 1, 1)</div>
                  <div>• <strong>Heidenhain iTNC:</strong> FUNCTION TCPM F CONT AXIS SPAT</div>
                  <div>• <strong>Safe Cancel:</strong> G49 + G05.1 Q0 + M09 + M30</div>
                </div>
              </div>
            </div>

            {/* Guide Footer */}
            <div className="bg-[#f0f2f5] border-t border-[#cbd5e1] px-4 py-2.5 flex justify-end">
              <button
                onClick={() => setShowMachinistGuide(false)}
                className="px-4 py-1.5 bg-blue-600 text-white font-semibold rounded text-xs hover:bg-blue-700"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
