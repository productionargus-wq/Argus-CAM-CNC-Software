import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X, Check, AlertTriangle, ShieldCheck, Cpu, Sliders,
  HelpCircle, Compass, Layers, RotateCw, Activity, Sparkles, Orbit,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[1px]">
      <div
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          width: '920px',
          maxWidth: '96vw',
          maxHeight: '92vh',
          backgroundColor: '#f0f2f5',
          color: '#1e293b'
        }}
        className="flex flex-col rounded-lg shadow-2xl border border-slate-300 font-sans text-xs select-none overflow-hidden"
      >
        {/* Title Bar */}
        <div
          onMouseDown={handleMouseDown}
          className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 border-b border-slate-300 cursor-move"
        >
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white font-bold text-[10px] tracking-wider uppercase flex items-center gap-1">
              <Disc size={11} className="inline" /> 4X
            </span>
            <span className="font-semibold text-slate-800 text-[13px]">
              Rotary 4-Axis Machining (Cylinder Wrapping &amp; Axis Substitution)
            </span>
            <span className="text-slate-400 text-[11px]">Mastercam 2026 Engine</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleApplyRecommended}
              className="flex items-center gap-1 px-2 py-0.5 rounded border border-amber-400 bg-amber-50 text-amber-800 hover:bg-amber-100 font-medium text-[11px] transition-colors"
              title="Calculate optimal speed/feed and stepover for selected material"
            >
              <Sparkles size={11} className="text-amber-600" />
              Recommended Values
            </button>
            <button
              onClick={() => setIsGuideOpen(!isGuideOpen)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-medium transition-colors ${
                isGuideOpen
                  ? 'bg-blue-100 border-blue-400 text-blue-800'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <HelpCircle size={11} />
              Machinist Guide
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-slate-300 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Presets Bar */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 border-b border-slate-200 overflow-x-auto text-[11px]">
          <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] flex items-center gap-1">
            <Zap size={11} className="text-amber-500" /> Presets:
          </span>
          {Object.values(ROTARY_4AXIS_PRESETS).map((pr) => (
            <button
              key={pr.id}
              onClick={() => handleApplyPreset(pr.id)}
              className={`px-2 py-0.5 rounded border transition-colors whitespace-nowrap ${
                formState.presetKey === pr.id
                  ? 'bg-blue-600 text-white border-blue-600 font-medium shadow-xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
              title={pr.desc}
            >
              {pr.name}
            </button>
          ))}
        </div>

        {/* Main Body: 2-Column Mastercam Layout */}
        <div className="flex flex-1 min-h-[460px] max-h-[580px] overflow-hidden">
          {/* Left Navigation Tree */}
          <div className="w-[248px] shrink-0 border-r border-slate-300 bg-white flex flex-col justify-between">
            <div className="p-2 overflow-y-auto">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                Tree View Navigation
              </div>
              <div className="space-y-0.5">
                {Object.entries(ROTARY_4AXIS_PAGE_TITLES).map(([key, title]) => {
                  const isActive = activePage === key;
                  const isEdited = editedPages.has(key);
                  return (
                    <button
                      key={key}
                      onClick={() => setActivePage(key)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-left transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white font-medium shadow-xs'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {key === 'rotary_cut_pattern' && <Disc size={13} />}
                        {key === 'tool' && <Sliders size={13} />}
                        {key === 'holder' && <ShieldCheck size={13} />}
                        {key === 'axis_control_offset' && <Compass size={13} />}
                        {key === 'stepover_passes' && <Layers size={13} />}
                        {key === 'collision_rotary_limits' && <AlertTriangle size={13} />}
                        {key === 'linking_parameters' && <CornerDownRight size={13} />}
                        {key === 'machine_kinematics' && <Cpu size={13} />}
                        {key === 'arc_filter' && <Activity size={13} />}
                        {key === 'planes_coolant' && <RotateCw size={13} />}
                        {key === 'toolpath_type' && <Orbit size={13} />}
                        <span className="truncate">{title}</span>
                      </div>
                      {isEdited && !isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Summary Pill in Tree Footer */}
            <div className="p-2.5 border-t border-slate-200 bg-slate-50 text-[11px] space-y-1">
              <div className="flex justify-between text-slate-500">
                <span>Cylinder OD:</span>
                <span className="font-semibold text-slate-700">{formState.cutPattern?.cylinderDiameter} mm</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Rotary Axis:</span>
                <span className="font-semibold text-blue-700">{formState.cutPattern?.rotaryAxis}-Axis ({formState.cutPattern?.rotaryAxis === 'X' ? 'A' : 'B'})</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Style:</span>
                <span className="font-semibold text-slate-700 capitalize">{formState.cutPattern?.machiningStyle?.replace('_', ' ')}</span>
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-[#f0f2f5] space-y-4">
            {/* PAGE 1: TOOLPATH TYPE */}
            {activePage === 'toolpath_type' && (
              <div className="space-y-4">
                <fieldset className="border border-slate-300 rounded p-3 bg-white shadow-2xs">
                  <legend className="px-1 text-slate-700 font-semibold text-[11px]">
                    4-Axis Rotary Multiaxis Strategy
                  </legend>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-start gap-2 p-2 border border-blue-200 bg-blue-50/50 rounded cursor-pointer">
                      <input
                        type="radio"
                        name="tp_type"
                        checked={formState.cutPattern?.machiningStyle === 'axis_substitution'}
                        onChange={() => updateField('cutPattern', 'machiningStyle', 'axis_substitution')}
                        className="mt-0.5 text-blue-600"
                      />
                      <div>
                        <div className="font-semibold text-slate-800">Axis Substitution (2D/3D Wrapping)</div>
                        <div className="text-slate-500 text-[11px]">
                          Wraps planar geometry (cams, slots, lettering) onto cylinder OD via A = (360° × Y) / (π × D).
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-2 p-2 border border-slate-200 bg-white rounded cursor-pointer hover:bg-slate-50">
                      <input
                        type="radio"
                        name="tp_type"
                        checked={formState.cutPattern?.machiningStyle === 'axial'}
                        onChange={() => updateField('cutPattern', 'machiningStyle', 'axial')}
                        className="mt-0.5 text-blue-600"
                      />
                      <div>
                        <div className="font-semibold text-slate-800">Axial Rotary (Longitudinal Passes)</div>
                        <div className="text-slate-500 text-[11px]">
                          Cuts longitudinally along X while the rotary axis steps over around the circumference.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-2 p-2 border border-slate-200 bg-white rounded cursor-pointer hover:bg-slate-50">
                      <input
                        type="radio"
                        name="tp_type"
                        checked={formState.cutPattern?.machiningStyle === 'spiral'}
                        onChange={() => updateField('cutPattern', 'machiningStyle', 'spiral')}
                        className="mt-0.5 text-blue-600"
                      />
                      <div>
                        <div className="font-semibold text-slate-800">Continuous Rotary Spiral</div>
                        <div className="text-slate-500 text-[11px]">
                          Continuous 360° helical revolutions around cylinder with linear axial feed for mirror finish.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-2 p-2 border border-slate-200 bg-white rounded cursor-pointer hover:bg-slate-50">
                      <input
                        type="radio"
                        name="tp_type"
                        checked={formState.cutPattern?.machiningStyle === 'radial'}
                        onChange={() => updateField('cutPattern', 'machiningStyle', 'radial')}
                        className="mt-0.5 text-blue-600"
                      />
                      <div>
                        <div className="font-semibold text-slate-800">Radial Rings (Circumferential Passes)</div>
                        <div className="text-slate-500 text-[11px]">
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
              <div className="space-y-4">
                <fieldset className="border border-slate-300 rounded p-3 bg-white shadow-2xs">
                  <legend className="px-1 text-slate-700 font-semibold text-[11px]">
                    Rotary Stock Cylinder Definition
                  </legend>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-600 mb-1 font-medium">Cylinder Diameter (OD)</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          value={formState.cutPattern?.cylinderDiameter || 60.0}
                          onChange={(e) => updateField('cutPattern', 'cylinderDiameter', parseFloat(e.target.value) || 60.0)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-slate-800 bg-white focus:outline-blue-500"
                        />
                        <span className="text-slate-500">mm</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-600 mb-1 font-medium">Cylinder Length</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="1"
                          min="5"
                          value={formState.cutPattern?.cylinderLength || 100.0}
                          onChange={(e) => updateField('cutPattern', 'cylinderLength', parseFloat(e.target.value) || 100.0)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-slate-800 bg-white focus:outline-blue-500"
                        />
                        <span className="text-slate-500">mm</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-600 mb-1 font-medium">Rotary Axis</label>
                      <select
                        value={formState.cutPattern?.rotaryAxis || 'X'}
                        onChange={(e) => updateField('cutPattern', 'rotaryAxis', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-slate-800 bg-white focus:outline-blue-500"
                      >
                        <option value="X">X-Axis (A-Axis Rotary)</option>
                        <option value="Y">Y-Axis (B-Axis Rotary)</option>
                        <option value="Z">Z-Axis (C-Axis Rotary)</option>
                      </select>
                    </div>
                  </div>
                </fieldset>

                <fieldset className="border border-slate-300 rounded p-3 bg-white shadow-2xs">
                  <legend className="px-1 text-slate-700 font-semibold text-[11px]">
                    Cutting Direction &amp; Sequence
                  </legend>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 mb-1 font-medium">Cutting Method</label>
                      <select
                        value={formState.cutPattern?.cuttingDirection || 'climb'}
                        onChange={(e) => updateField('cutPattern', 'cuttingDirection', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-slate-800 bg-white focus:outline-blue-500"
                      >
                        <option value="climb">Climb Milling (Standard)</option>
                        <option value="conventional">Conventional Milling</option>
                        <option value="zigzag">Zigzag (Bi-Directional)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 mb-1 font-medium">Axial Cut Sequence</label>
                      <select
                        value={formState.cutPattern?.cutSequence || 'positive_x_to_negative'}
                        onChange={(e) => updateField('cutPattern', 'cutSequence', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-slate-800 bg-white focus:outline-blue-500"
                      >
                        <option value="positive_x_to_negative">+X to -X (Headstock toward Tailstock)</option>
                        <option value="negative_x_to_positive">-X to +X (Tailstock toward Headstock)</option>
                      </select>
                    </div>
                  </div>
                </fieldset>
              </div>
            )}

            {/* PAGE 3: TOOL SELECTION & DYNAMICS */}
            {activePage === 'tool' && (
              <div className="space-y-4">
                <fieldset className="border border-slate-300 rounded p-3 bg-white shadow-2xs">
                  <legend className="px-1 text-slate-700 font-semibold text-[11px]">
                    Assigned 4-Axis Milling Tool
                  </legend>
                  <div className="flex items-center gap-3 mb-3">
                    <select
                      value={formState.tool?.id}
                      onChange={(e) => handleSelectTool(e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-slate-300 rounded text-slate-800 font-medium bg-white focus:outline-blue-500"
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
                        className="px-3 py-1.5 bg-slate-100 border border-slate-300 rounded text-slate-700 hover:bg-slate-200 transition-colors font-medium"
                      >
                        Select from Library...
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="block text-slate-600 mb-1 font-medium">Spindle Speed</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="100"
                          value={formState.tool?.spindleSpeed || 10000}
                          onChange={(e) => updateField('tool', 'spindleSpeed', parseInt(e.target.value) || 10000)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-slate-800 bg-white focus:outline-blue-500"
                        />
                        <span className="text-slate-500">RPM</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-600 mb-1 font-medium">Linear Feedrate</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="50"
                          value={formState.tool?.feedRate || 2000}
                          onChange={(e) => updateField('tool', 'feedRate', parseInt(e.target.value) || 2000)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-slate-800 bg-white focus:outline-blue-500"
                        />
                        <span className="text-slate-500">mm/min</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-600 mb-1 font-medium">Plunge Feedrate</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="25"
                          value={formState.tool?.plungeRate || 500}
                          onChange={(e) => updateField('tool', 'plungeRate', parseInt(e.target.value) || 500)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-slate-800 bg-white focus:outline-blue-500"
                        />
                        <span className="text-slate-500">mm/min</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-600 mb-1 font-medium">Flute Count</label>
                      <input
                        type="number"
                        min="1"
                        max="8"
                        value={formState.tool?.flutes || 2}
                        onChange={(e) => updateField('tool', 'flutes', parseInt(e.target.value) || 2)}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-slate-800 bg-white focus:outline-blue-500"
                      />
                    </div>
                  </div>
                </fieldset>
              </div>
            )}

            {/* PAGE 4: HOLDER DEFINITION */}
            {activePage === 'holder' && (
              <div className="space-y-4">
                <fieldset className="border border-slate-300 rounded p-3 bg-white shadow-2xs">
                  <legend className="px-1 text-slate-700 font-semibold text-[11px]">
                    Toolholder &amp; Gauge Length
                  </legend>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-600 mb-1 font-medium">Holder Style</label>
                      <select
                        value={formState.holder?.type || 'CAT40_ER32'}
                        onChange={(e) => updateField('holder', 'type', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-slate-800 bg-white focus:outline-blue-500"
                      >
                        <option value="CAT40_ER32">CAT40 - ER32 Precision Collet</option>
                        <option value="BT30_BBT">BT30 - BBT Dual Contact (Robodrill)</option>
                        <option value="HSK_A63">HSK-A63 High Speed Hydraulic</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1 font-medium">Gauge Length</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={formState.holder?.gaugeLength || 70.0}
                          onChange={(e) => updateField('holder', 'gaugeLength', parseFloat(e.target.value) || 70.0)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-slate-800 bg-white focus:outline-blue-500"
                        />
                        <span className="text-slate-500">mm</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1 font-medium">Holder Clearance Margin</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.5"
                          value={formState.holder?.holderClearanceMargin || 3.0}
                          onChange={(e) => updateField('holder', 'holderClearanceMargin', parseFloat(e.target.value) || 3.0)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-slate-800 bg-white focus:outline-blue-500"
                        />
                        <span className="text-slate-500">mm</span>
                      </div>
                    </div>
                  </div>
                </fieldset>
              </div>
            )}

            {/* PAGE 5: AXIS CONTROL & CUTTER OFFSET (Y-OFFSET) */}
            {activePage === 'axis_control_offset' && (
              <div className="space-y-4">
                <fieldset className="border border-slate-300 rounded p-3 bg-white shadow-2xs">
                  <legend className="px-1 text-slate-700 font-semibold text-[11px]">
                    Cutter Offset Method (Centerline vs Y-Offset)
                  </legend>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <label className="flex items-start gap-2 p-2 border border-blue-200 bg-blue-50/50 rounded cursor-pointer">
                      <input
                        type="radio"
                        name="offset_method"
                        checked={formState.axisControl?.cutterOffsetMethod === 'centerline'}
                        onChange={() => updateField('axisControl', 'cutterOffsetMethod', 'centerline')}
                        className="mt-0.5 text-blue-600"
                      />
                      <div>
                        <div className="font-semibold text-slate-800">Centerline Cutting (Y = 0)</div>
                        <div className="text-slate-500 text-[11px]">
                          Tool tip cuts directly on the rotary cylinder centerline axis.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-2 p-2 border border-slate-200 bg-white rounded cursor-pointer hover:bg-slate-50">
                      <input
                        type="radio"
                        name="offset_method"
                        checked={formState.axisControl?.cutterOffsetMethod === 'y_offset'}
                        onChange={() => updateField('axisControl', 'cutterOffsetMethod', 'y_offset')}
                        className="mt-0.5 text-blue-600"
                      />
                      <div>
                        <div className="font-semibold text-slate-800">Y-Offset Tangential Cutting</div>
                        <div className="text-slate-500 text-[11px]">
                          Shifts cutter off-center to provide positive shear rake angle on cylinder OD.
                        </div>
                      </div>
                    </label>
                  </div>

                  {formState.axisControl?.cutterOffsetMethod === 'y_offset' && (
                    <div className="grid grid-cols-2 gap-3 p-2 bg-slate-50 rounded border border-slate-200">
                      <div>
                        <label className="block text-slate-600 mb-1 font-medium">Y-Offset Distance</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.1"
                            value={formState.axisControl?.yOffsetDistanceMm || 1.5}
                            onChange={(e) => updateField('axisControl', 'yOffsetDistanceMm', parseFloat(e.target.value) || 1.5)}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-slate-800 bg-white focus:outline-blue-500"
                          />
                          <span className="text-slate-500">mm</span>
                        </div>
                      </div>
                      <div className="text-slate-500 text-[11px] flex items-center">
                        Positive Y shifts tool towards operator; improves surface finish and chip shearing.
                      </div>
                    </div>
                  )}
                </fieldset>
              </div>
            )}

            {/* PAGE 6: STEPOVER & DEPTH PASSES */}
            {activePage === 'stepover_passes' && (
              <div className="space-y-4">
                <fieldset className="border border-slate-300 rounded p-3 bg-white shadow-2xs">
                  <legend className="px-1 text-slate-700 font-semibold text-[11px]">
                    Stepover &amp; Cut Spacing
                  </legend>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-600 mb-1 font-medium">Angular Stepover (Axial)</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.5"
                          min="0.1"
                          value={formState.stepoverPasses?.stepoverDeg || 3.5}
                          onChange={(e) => updateField('stepoverPasses', 'stepoverDeg', parseFloat(e.target.value) || 3.5)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-slate-800 bg-white focus:outline-blue-500"
                        />
                        <span className="text-slate-500">deg (°)</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-600 mb-1 font-medium">Linear Stepover (Radial/Spiral)</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.1"
                          min="0.05"
                          value={formState.stepoverPasses?.stepoverMm || 1.2}
                          onChange={(e) => updateField('stepoverPasses', 'stepoverMm', parseFloat(e.target.value) || 1.2)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-slate-800 bg-white focus:outline-blue-500"
                        />
                        <span className="text-slate-500">mm</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-600 mb-1 font-medium">Depth of Cut (ap)</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.25"
                          value={formState.stepoverPasses?.maxRoughStepdownMm || 2.0}
                          onChange={(e) => updateField('stepoverPasses', 'maxRoughStepdownMm', parseFloat(e.target.value) || 2.0)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-slate-800 bg-white focus:outline-blue-500"
                        />
                        <span className="text-slate-500">mm</span>
                      </div>
                    </div>
                  </div>
                </fieldset>
              </div>
            )}

            {/* PAGE 7: COLLISION & ROTARY LIMITS */}
            {activePage === 'collision_rotary_limits' && (
              <div className="space-y-4">
                <fieldset className="border border-slate-300 rounded p-3 bg-white shadow-2xs">
                  <legend className="px-1 text-slate-700 font-semibold text-[11px]">
                    Rotary Travel Limits &amp; Unwind Mode
                  </legend>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <label className="flex items-start gap-2 p-2 border border-blue-200 bg-blue-50/50 rounded cursor-pointer">
                      <input
                        type="radio"
                        name="rotary_limits"
                        checked={formState.collisionControl?.rotaryLimitsMode === 'continuous'}
                        onChange={() => updateField('collisionControl', 'rotaryLimitsMode', 'continuous')}
                        className="mt-0.5 text-blue-600"
                      />
                      <div>
                        <div className="font-semibold text-slate-800">Continuous Multi-Turn Unwind</div>
                        <div className="text-slate-500 text-[11px]">
                          Allows seamless continuous rotation past 360° without intermediate table rewinds.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-2 p-2 border border-slate-200 bg-white rounded cursor-pointer hover:bg-slate-50">
                      <input
                        type="radio"
                        name="rotary_limits"
                        checked={formState.collisionControl?.rotaryLimitsMode === 'clamped'}
                        onChange={() => updateField('collisionControl', 'rotaryLimitsMode', 'clamped')}
                        className="mt-0.5 text-blue-600"
                      />
                      <div>
                        <div className="font-semibold text-slate-800">Clamped Rotary Window</div>
                        <div className="text-slate-500 text-[11px]">
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
              <div className="space-y-4">
                <fieldset className="border border-slate-300 rounded p-3 bg-white shadow-2xs">
                  <legend className="px-1 text-slate-700 font-semibold text-[11px]">
                    Cylindrical Clearance Zones
                  </legend>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-600 mb-1 font-medium">Clearance Cylinder Radius</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="1"
                          value={formState.linkingParameters?.clearanceRadiusMm || 45.0}
                          onChange={(e) => updateField('linkingParameters', 'clearanceRadiusMm', parseFloat(e.target.value) || 45.0)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-slate-800 bg-white focus:outline-blue-500"
                        />
                        <span className="text-slate-500">mm</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-600 mb-1 font-medium">Retract Cylinder Radius</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="1"
                          value={formState.linkingParameters?.retractRadiusMm || 35.0}
                          onChange={(e) => updateField('linkingParameters', 'retractRadiusMm', parseFloat(e.target.value) || 35.0)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-slate-800 bg-white focus:outline-blue-500"
                        />
                        <span className="text-slate-500">mm</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-600 mb-1 font-medium">Pass Transition</label>
                      <select
                        value={formState.linkingParameters?.transitionBetweenPasses || 'blend_loop'}
                        onChange={(e) => updateField('linkingParameters', 'transitionBetweenPasses', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-slate-800 bg-white focus:outline-blue-500"
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
              <div className="space-y-4">
                <fieldset className="border border-slate-300 rounded p-3 bg-white shadow-2xs">
                  <legend className="px-1 text-slate-700 font-semibold text-[11px]">
                    Controller Dialect &amp; Rotary Interpolation
                  </legend>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <label className="block text-slate-600 mb-1 font-medium">Post Dialect</label>
                      <select
                        value={formState.machineKinematics?.postDialect || 'fanuc'}
                        onChange={(e) => updateField('machineKinematics', 'postDialect', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-slate-800 bg-white focus:outline-blue-500"
                      >
                        <option value="fanuc">Fanuc 30i / 31i / 0i-MF</option>
                        <option value="haas">Haas Automation 4-Axis</option>
                        <option value="siemens">Siemens Sinumerik 840D</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 mb-1 font-medium">Feedrate Mode</label>
                      <select
                        value={formState.machineKinematics?.feedMode || 'deg_per_min'}
                        onChange={(e) => updateField('machineKinematics', 'feedMode', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-slate-800 bg-white focus:outline-blue-500"
                      >
                        <option value="deg_per_min">Degrees / Minute (G94)</option>
                        <option value="inverse_time">Inverse Time Feed (G93 - 1/min)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 mb-1 font-medium">Rotary Axis Letter</label>
                      <input
                        type="text"
                        maxLength="1"
                        value={formState.machineKinematics?.rotaryAxisLetter || 'A'}
                        onChange={(e) => updateField('machineKinematics', 'rotaryAxisLetter', e.target.value.toUpperCase())}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-slate-800 uppercase font-bold bg-white focus:outline-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                    <input
                      type="checkbox"
                      id="cyl_interp"
                      checked={formState.machineKinematics?.cylindricalInterpEnabled ?? true}
                      onChange={(e) => updateField('machineKinematics', 'cylindricalInterpEnabled', e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <label htmlFor="cyl_interp" className="text-slate-700 font-medium cursor-pointer">
                      Enable Fanuc G107 / G07.1 Cylindrical Interpolation
                    </label>
                  </div>
                </fieldset>
              </div>
            )}

            {/* PAGE 10: ARC FILTER & 4X TOLERANCE */}
            {activePage === 'arc_filter' && (
              <div className="space-y-4">
                <fieldset className="border border-slate-300 rounded p-3 bg-white shadow-2xs">
                  <legend className="px-1 text-slate-700 font-semibold text-[11px]">
                    4-Axis Arc Filtering &amp; Tolerances
                  </legend>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 mb-1 font-medium">Total Chordal Tolerance</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.005"
                          value={formState.arcFilter?.totalToleranceMm || 0.015}
                          onChange={(e) => updateField('arcFilter', 'totalToleranceMm', parseFloat(e.target.value) || 0.015)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-slate-800 bg-white focus:outline-blue-500"
                        />
                        <span className="text-slate-500">mm</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1 font-medium">Max Angular Segment</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="1"
                          value={formState.arcFilter?.maxAngularSegmentDeg || 5.0}
                          onChange={(e) => updateField('arcFilter', 'maxAngularSegmentDeg', parseFloat(e.target.value) || 5.0)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-slate-800 bg-white focus:outline-blue-500"
                        />
                        <span className="text-slate-500">deg (°)</span>
                      </div>
                    </div>
                  </div>
                </fieldset>
              </div>
            )}

            {/* PAGE 11: PLANES & COOLANT */}
            {activePage === 'planes_coolant' && (
              <div className="space-y-4">
                <fieldset className="border border-slate-300 rounded p-3 bg-white shadow-2xs">
                  <legend className="px-1 text-slate-700 font-semibold text-[11px]">
                    WCS &amp; Coolant Management
                  </legend>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-slate-600 mb-1 font-medium">Work Coordinate System (WCS)</label>
                      <select
                        value={formState.planesCoolant?.wcs || 'Top (G54)'}
                        onChange={(e) => updateField('planesCoolant', 'wcs', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-slate-800 bg-white focus:outline-blue-500"
                      >
                        <option value="Top (G54)">Top (G54 - Standard)</option>
                        <option value="G55">G55</option>
                        <option value="G56">G56</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 mb-1 font-medium">Operator Message</label>
                      <input
                        type="text"
                        value={formState.planesCoolant?.operatorMessage || '4-AXIS ROTARY PASS'}
                        onChange={(e) => updateField('planesCoolant', 'operatorMessage', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-slate-800 bg-white focus:outline-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-2 border-t border-slate-200">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formState.planesCoolant?.coolantFlood ?? true}
                        onChange={(e) => updateField('planesCoolant', 'coolantFlood', e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span>Flood Coolant (M08)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formState.planesCoolant?.coolantThruSpindle ?? false}
                        onChange={(e) => updateField('planesCoolant', 'coolantThruSpindle', e.target.checked)}
                        className="rounded text-blue-600"
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
            <div className="w-[280px] shrink-0 border-l border-slate-300 bg-white p-3 overflow-y-auto text-[11px] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <Info size={13} className="text-blue-600" /> 4-Axis Rotary Guide
                </span>
                <button
                  onClick={() => setIsGuideOpen(false)}
                  className="p-0.5 rounded hover:bg-slate-200 text-slate-500"
                >
                  <X size={13} />
                </button>
              </div>

              <div>
                <h4 className="font-semibold text-slate-700 mb-1">Axis Substitution Formula</h4>
                <p className="text-slate-600 leading-relaxed">
                  Converts planar Y positions into rotary A degrees around cylinder OD:
                </p>
                <div className="p-2 bg-slate-100 rounded text-[10px] font-mono my-1 border border-slate-200">
                  A = (360° × Y) / (π × D_cyl)
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-700 mb-1">Rotary Feedrate (deg/min)</h4>
                <p className="text-slate-600 leading-relaxed">
                  Linear feed F (mm/min) along cylinder circumference translates to:
                </p>
                <div className="p-2 bg-slate-100 rounded text-[10px] font-mono my-1 border border-slate-200">
                  F_rot = (360° × F_lin) / (π × D_cyl)
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-700 mb-1">Y-Offset Tangential Cutting</h4>
                <p className="text-slate-600 leading-relaxed">
                  Moving tool off-center produces positive cutting rake on cylindrical walls, eliminating rubbing and chatter.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-700 mb-1">Fanuc G107 / G07.1</h4>
                <p className="text-slate-600 leading-relaxed">
                  Enables CNC controller cylindrical interpolation, allowing circular arc programming (G02/G03) directly on cylinder face.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar: Telemetry HUD & Action Buttons */}
        <div className="flex items-center justify-between px-3 py-2 bg-white border-t border-slate-300">
          <div className="flex items-center gap-4 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Material:</span>
              <select
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                className="px-2 py-0.5 border border-slate-300 rounded text-slate-800 bg-white font-medium focus:outline-blue-500"
              >
                {Object.values(ROTARY_4AXIS_MATERIALS).map((mat) => (
                  <option key={mat.id} value={mat.id.toUpperCase()}>
                    {mat.name} ({mat.hardness})
                  </option>
                ))}
              </select>
            </div>

            <div className="h-4 w-px bg-slate-300" />

            <div className="flex items-center gap-3 text-slate-600">
              <div>
                <span className="text-slate-400">Cyl Dia: </span>
                <span className="font-bold text-slate-800">{physics.cylinderDiameterMm}mm</span>
              </div>
              <div>
                <span className="text-slate-400">Rotary Feed: </span>
                <span className="font-bold text-blue-700">{physics.rotaryFeedDegMin}°/min</span>
              </div>
              <div>
                <span className="text-slate-400">Tool Vc: </span>
                <span className="font-bold text-slate-800">{physics.toolVcMMin} m/min</span>
              </div>
              <div>
                <span className="text-slate-400">Scallop: </span>
                <span className="font-bold text-slate-800">{physics.scallopMicrons} µm</span>
              </div>
              <div>
                <span className="text-slate-400">Power: </span>
                <span className="font-bold text-slate-800">{physics.spindlePowerKw} kW</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check size={13} />
              OK / Generate Toolpath
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded border border-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded border border-slate-300 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
