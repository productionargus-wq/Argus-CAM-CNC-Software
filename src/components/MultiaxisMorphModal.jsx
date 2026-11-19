import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Check, AlertTriangle, ShieldCheck, Cpu, Sliders,
  HelpCircle, Compass, Layers, RotateCw, Activity, Sparkles, Orbit
} from 'lucide-react';

import {
  MULTIAXIS_MORPH_PAGE_TITLES,
  MULTIAXIS_MORPH_MATERIALS,
  MULTIAXIS_MORPH_PRESETS,
  MULTIAXIS_KINEMATICS_OPTIONS,
  MULTIAXIS_TCPM_OPTIONS,
  calculateMultiaxisMorphPhysics,
  createDefaultMultiaxisMorphState
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
  const [editedPages, setEditedPages] = useState(new Set(['toolpath_type', 'cut_pattern', 'tool', 'tool_axis_control']));

  // Update on operation prop change
  useEffect(() => {
    if (operation && (operation.strategyKey === 'multiaxis_morph' || operation.badgeClass === 'multi_morph')) {
      setFormState({
        ...createDefaultMultiaxisMorphState({ bounds: null, tools, activeMachine }),
        ...operation
      });
    }
  }, [operation]);

  // Nested property updater
  const updateField = (pageKey, field, value) => {
    setFormState((prev) => ({
      ...prev,
      [pageKey]: {
        ...prev[pageKey],
        [field]: value
      }
    }));
    setEditedPages((prev) => new Set(prev).add(pageKey));
  };

  // Top level updater
  const updateTopLevel = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  // Active Tool Resolution
  const selectedTool = useMemo(() => {
    const tId = formState.tool?.id;
    const match = tools.find((t) => String(t.id) === String(tId));
    if (match) return match;
    return formState.tool || { diameter: 10, flutes: 4, type: 'ball' };
  }, [tools, formState.tool]);

  // Real-time Physics HUD calculation
  const physics = useMemo(() => {
    const cutParams = {
      leadAngleDeg: formState.toolAxisControl?.leadAngleDeg ?? 10.0,
      tiltAngleDeg: formState.toolAxisControl?.tiltAngleDeg ?? 15.0,
      stepoverMm: formState.cutPattern?.stepoverDistanceMm ?? 1.5,
      depthOfCutMm: 0.5
    };
    return calculateMultiaxisMorphPhysics(
      {
        ...selectedTool,
        spindleSpeed: formState.tool?.spindleSpeed,
        feedRate: formState.tool?.feedRate
      },
      cutParams,
      formState.selectedMaterialKey || 'ALU_6061'
    );
  }, [selectedTool, formState.tool, formState.toolAxisControl, formState.cutPattern, formState.selectedMaterialKey]);

  // Kinematics and TCPM info
  const currentKinematics = useMemo(() => {
    const kId = formState.machineKinematics?.kinematicsId || 'table_table_ac';
    return MULTIAXIS_KINEMATICS_OPTIONS.find((k) => k.id === kId) || MULTIAXIS_KINEMATICS_OPTIONS[0];
  }, [formState.machineKinematics]);

  const currentTcpm = useMemo(() => {
    const tId = formState.machineKinematics?.tcpmMode || 'fanuc';
    return MULTIAXIS_TCPM_OPTIONS.find((t) => t.id === tId) || MULTIAXIS_TCPM_OPTIONS[0];
  }, [formState.machineKinematics]);

  // Apply Material Preset
  const handleApplyPreset = (presetId) => {
    const preset = MULTIAXIS_MORPH_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setFormState((prev) => ({
      ...prev,
      selectedPresetKey: preset.id,
      selectedMaterialKey: preset.materialKey,
      cutPattern: {
        ...prev.cutPattern,
        numberOfCuts: preset.passes,
        stepoverDistanceMm: preset.stepoverMm,
        cuttingMethod: preset.cuttingMethod
      },
      tool: {
        ...prev.tool,
        spindleSpeed: preset.spindleSpeed,
        feedRate: preset.feedRate,
        plungeRate: preset.plungeRate
      },
      toolAxisControl: {
        ...prev.toolAxisControl,
        leadAngleDeg: preset.leadAngleDeg,
        tiltAngleDeg: preset.tiltAngleDeg
      },
      machineKinematics: {
        ...prev.machineKinematics,
        kinematicsId: preset.kinematicsId,
        tcpmMode: preset.tcpmMode
      }
    }));

    onNotify?.(`Applied 5-Axis Preset: ${preset.name}`, 'info');
  };

  // Recommended Values 1-Click Optimization
  const handleRecommendedValues = () => {
    const matKey = formState.selectedMaterialKey || 'ALU_6061';
    const mat = MULTIAXIS_MORPH_MATERIALS[matKey] || MULTIAXIS_MORPH_MATERIALS.ALU_6061;
    const dia = Number(selectedTool.diameter || 10);
    const rpm = Math.round((mat.vc * 1000) / (Math.PI * dia));
    const feed = Math.round(rpm * (selectedTool.flutes || 4) * mat.fzNominal);
    const plunge = Math.round(feed * 0.25);

    setFormState((prev) => ({
      ...prev,
      cutPattern: {
        ...prev.cutPattern,
        numberOfCuts: mat.recommendedPasses,
        stepoverDistanceMm: mat.recommendedStepoverMm
      },
      tool: {
        ...prev.tool,
        spindleSpeed: rpm,
        feedRate: feed,
        plungeRate: plunge
      },
      toolAxisControl: {
        ...prev.toolAxisControl,
        leadAngleDeg: mat.recommendedLeadDeg,
        tiltAngleDeg: mat.recommendedTiltDeg
      }
    }));

    onNotify?.(`Recommended values loaded for ${mat.name}`, 'success');
  };

  // Save / OK Handler
  const handleOk = () => {
    if (onSaveOperation) {
      onSaveOperation({
        ...formState,
        strategyKey: 'multiaxis_morph',
        badgeClass: 'multi_morph',
        opType: 'multiaxis',
        toolId: selectedTool.id,
        toolName: `T${formState.tool.number} - ${selectedTool.name || formState.tool.name}`,
        spindleSpeed: formState.tool.spindleSpeed,
        feedRate: formState.tool.feedRate,
        plungeRate: formState.tool.plungeRate,
        leadAngleDeg: formState.toolAxisControl.leadAngleDeg,
        tiltAngleDeg: formState.toolAxisControl.tiltAngleDeg,
        passes: formState.cutPattern.numberOfCuts,
        kinematicsId: formState.machineKinematics.kinematicsId,
        tcpmMode: formState.machineKinematics.tcpmMode,
        rapidHeight: formState.linkingParameters.clearancePlaneZ || 50.0,
        visible: true
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-[#f0f2f5] w-[940px] max-w-[98vw] h-[700px] max-h-[96vh] rounded border border-[#717b87] shadow-2xl flex flex-col font-sans text-xs text-slate-800 select-none overflow-hidden">
        
        {/* Title Bar (Mastercam Classic Slate Header) */}
        <div className="bg-gradient-to-r from-[#1e293b] via-[#334155] to-[#1e293b] text-white px-3 py-1.5 flex items-center justify-between border-b border-slate-700 select-none">
          <div className="flex items-center gap-2">
            <Orbit className="w-4 h-4 text-purple-400 animate-spin-slow" />
            <span className="font-semibold text-xs tracking-wide">
              5-Axis Multiaxis Morph - [Morph Between 2 Curves / Surfaces]
            </span>
            <span className="text-[10px] bg-purple-900/80 text-purple-200 px-1.5 py-0.5 rounded border border-purple-500/40">
              SIMULTANEOUS 5-AXIS
            </span>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-red-600 p-1 rounded transition-colors text-slate-300 hover:text-white"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Top 5-Axis Dynamics & Physics HUD */}
        <div className="bg-[#e2e8f0] border-b border-[#cbd5e1] px-3 py-2 flex items-center justify-between gap-2 text-[11px] shadow-sm">
          <div className="flex items-center gap-4">
            {/* Lead & Tilt Badges */}
            <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded border border-slate-300">
              <Compass className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-slate-500 font-medium">Lead:</span>
              <span className="font-bold text-slate-800">{formState.toolAxisControl?.leadAngleDeg}°</span>
              <span className="text-slate-300 mx-1">|</span>
              <span className="text-slate-500 font-medium">Tilt:</span>
              <span className="font-bold text-slate-800">{formState.toolAxisControl?.tiltAngleDeg}°</span>
            </div>

            {/* Dynamics: Vc, hm, MRR, Power */}
            <div className="flex items-center gap-3 text-slate-700">
              <span title="Effective cutting speed at tilted contact diameter">
                <span className="text-slate-500">Vc:</span>{' '}
                <strong className="text-slate-900">{physics.surfaceSpeedMpm} m/min</strong>
              </span>
              <span title="Chip load">
                <span className="text-slate-500">fz:</span>{' '}
                <strong className="text-slate-900">{physics.feedPerToothMm} mm</strong>
              </span>
              <span title="Material Removal Rate">
                <span className="text-slate-500">MRR:</span>{' '}
                <strong className="text-purple-700">{physics.mrrCm3Min} cm³/min</strong>
              </span>
              <span title="Spindle Power">
                <span className="text-slate-500">Power:</span>{' '}
                <strong className="text-emerald-700">{physics.powerKw} kW</strong>
              </span>
              <span title="TCPM Protocol">
                <span className="text-slate-500">TCPM:</span>{' '}
                <strong className="text-blue-700 uppercase">{formState.machineKinematics?.tcpmMode}</strong>
              </span>
            </div>
          </div>

          {/* Preset Selector & Recommended Values */}
          <div className="flex items-center gap-2">
            <select
              value={formState.selectedPresetKey}
              onChange={(e) => handleApplyPreset(e.target.value)}
              className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              {MULTIAXIS_MORPH_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleRecommendedValues}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium px-2.5 py-1 rounded shadow-sm text-xs flex items-center gap-1 transition-all"
              title="Auto-calculate speeds, feeds, lead, and tilt for chosen material"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Recommended Values</span>
            </button>
          </div>
        </div>

        {/* Main 2-Column Body */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Navigation Column */}
          <div className="w-[240px] bg-white border-r border-[#cbd5e1] flex flex-col justify-between overflow-y-auto">
            <div className="p-1.5 space-y-0.5">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Multiaxis Parameters
              </div>
              {Object.entries(MULTIAXIS_MORPH_PAGE_TITLES).map(([key, label]) => {
                const isActive = activePage === key;
                const isEdited = editedPages.has(key);
                return (
                  <button
                    key={key}
                    onClick={() => setActivePage(key)}
                    className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between text-xs transition-colors ${
                      isActive
                        ? 'bg-[#3b82f6] text-white font-semibold shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate">{label}</span>
                    <div className="flex items-center gap-1">
                      {isEdited && !isActive && (
                        <Check className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick View Settings HUD */}
            <div className="p-2.5 m-2 bg-slate-50 border border-slate-200 rounded text-[11px] space-y-1">
              <div className="font-semibold text-slate-700 flex items-center justify-between">
                <span>Kinematic Safety</span>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                  <ShieldCheck className="w-3 h-3" /> Safe
                </span>
              </div>
              <div className="text-slate-500 text-[10px]">
                <div>Kinematics: <strong>{currentKinematics.name.split('(')[0]}</strong></div>
                <div>Passes: <strong>{formState.cutPattern?.numberOfCuts} cuts</strong></div>
                <div>Method: <strong>{formState.cutPattern?.cuttingMethod}</strong></div>
              </div>
            </div>
          </div>

          {/* Right Parameter Form Panel */}
          <div className="flex-1 bg-[#f8fafc] p-4 overflow-y-auto">
            
            {/* PAGE 1: Toolpath Type */}
            {activePage === 'toolpath_type' && (
              <div className="space-y-4 max-w-xl">
                <div className="border border-slate-300 bg-white p-3.5 rounded shadow-sm">
                  <h4 className="font-semibold text-slate-800 border-b border-slate-200 pb-1.5 mb-3 flex items-center gap-2">
                    <Orbit className="w-4 h-4 text-purple-600" />
                    Multiaxis Pattern Selection
                  </h4>
                  <div className="space-y-2.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="morph_strategy"
                        checked={formState.toolpathType?.strategy === 'morph_between_2_curves'}
                        onChange={() => updateField('toolpathType', 'strategy', 'morph_between_2_curves')}
                        className="text-purple-600"
                      />
                      <div>
                        <strong className="text-slate-800">Morph Between 2 Curves</strong>
                        <p className="text-[11px] text-slate-500">Interpolates continuous tool passes blending seamlessly between Curve 1 and Curve 2.</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="morph_strategy"
                        checked={formState.toolpathType?.strategy === 'morph_between_2_surfaces'}
                        onChange={() => updateField('toolpathType', 'strategy', 'morph_between_2_surfaces')}
                        className="text-purple-600"
                      />
                      <div>
                        <strong className="text-slate-800">Morph Between 2 Surfaces</strong>
                        <p className="text-[11px] text-slate-500">Morphs across drive geometry between two bounding guide surfaces.</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="morph_strategy"
                        checked={formState.toolpathType?.strategy === 'parallel_to_curve'}
                        onChange={() => updateField('toolpathType', 'strategy', 'parallel_to_curve')}
                        className="text-purple-600"
                      />
                      <div>
                        <strong className="text-slate-800">Parallel to Curve</strong>
                        <p className="text-[11px] text-slate-500">Follows a single primary guide curve maintaining constant stepover distance.</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="border border-slate-300 bg-white p-3.5 rounded shadow-sm">
                  <h4 className="font-semibold text-slate-800 border-b border-slate-200 pb-1.5 mb-3">Workpiece Drive Geometry</h4>
                  <div className="space-y-2">
                    <label className="flex items-center justify-between">
                      <span className="text-slate-700">Drive Surfaces Selection:</span>
                      <select
                        value={formState.cutPattern?.driveSurfaceSelection}
                        onChange={(e) => updateField('cutPattern', 'driveSurfaceSelection', e.target.value)}
                        className="border border-slate-300 rounded px-2 py-1 text-xs bg-white w-56"
                      >
                        <option value="all_drive_surfaces">All Model Drive Surfaces</option>
                        <option value="selected_faces">Selected Faces / Entities</option>
                        <option value="cad_body">Entire Solid CAD Body</option>
                      </select>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* PAGE 2: Cut Pattern (Morph Guides) */}
            {activePage === 'cut_pattern' && (
              <div className="space-y-4 max-w-xl">
                <div className="border border-slate-300 bg-white p-3.5 rounded shadow-sm">
                  <h4 className="font-semibold text-slate-800 border-b border-slate-200 pb-1.5 mb-3 flex items-center justify-between">
                    <span>Guide Curves Definition</span>
                    <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 font-medium">
                      Curve 1 ➔ Curve 2 Morph
                    </span>
                  </h4>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded space-y-1.5">
                      <div className="font-semibold text-slate-700 flex items-center justify-between">
                        <span>First Curve (Start)</span>
                        <input
                          type="checkbox"
                          checked={formState.cutPattern?.firstCurveFlipped}
                          onChange={(e) => updateField('cutPattern', 'firstCurveFlipped', e.target.checked)}
                          id="flip_c1"
                        />
                      </div>
                      <input
                        type="text"
                        value={formState.cutPattern?.firstCurveName}
                        onChange={(e) => updateField('cutPattern', 'firstCurveName', e.target.value)}
                        className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white"
                      />
                      <label htmlFor="flip_c1" className="text-[10px] text-slate-500 cursor-pointer block">
                        Reverse curve direction
                      </label>
                    </div>

                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded space-y-1.5">
                      <div className="font-semibold text-slate-700 flex items-center justify-between">
                        <span>Second Curve (End)</span>
                        <input
                          type="checkbox"
                          checked={formState.cutPattern?.secondCurveFlipped}
                          onChange={(e) => updateField('cutPattern', 'secondCurveFlipped', e.target.checked)}
                          id="flip_c2"
                        />
                      </div>
                      <input
                        type="text"
                        value={formState.cutPattern?.secondCurveName}
                        onChange={(e) => updateField('cutPattern', 'secondCurveName', e.target.value)}
                        className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white"
                      />
                      <label htmlFor="flip_c2" className="text-[10px] text-slate-500 cursor-pointer block">
                        Reverse curve direction
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-700">Stepover Calculation:</span>
                      <select
                        value={formState.cutPattern?.stepoverCalculation}
                        onChange={(e) => updateField('cutPattern', 'stepoverCalculation', e.target.value)}
                        className="border border-slate-300 rounded px-2 py-1 text-xs bg-white w-48"
                      >
                        <option value="number_of_cuts">Number of Cuts</option>
                        <option value="distance">Distance along Surface</option>
                        <option value="scallop">Maximum Scallop Height</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-700">Number of Passes:</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="3"
                          max="150"
                          value={formState.cutPattern?.numberOfCuts}
                          onChange={(e) => updateField('cutPattern', 'numberOfCuts', Number(e.target.value))}
                          className="w-20 border border-slate-300 rounded px-2 py-1 text-xs text-right bg-white"
                        />
                        <span className="text-slate-500">cuts</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-700">Stepover Distance:</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="20"
                          value={formState.cutPattern?.stepoverDistanceMm}
                          onChange={(e) => updateField('cutPattern', 'stepoverDistanceMm', Number(e.target.value))}
                          className="w-20 border border-slate-300 rounded px-2 py-1 text-xs text-right bg-white"
                        />
                        <span className="text-slate-500">mm</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-300 bg-white p-3.5 rounded shadow-sm">
                  <h4 className="font-semibold text-slate-800 border-b border-slate-200 pb-1.5 mb-3">Cutting Direction & Sequence</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-600 block mb-1">Cutting Method:</label>
                      <select
                        value={formState.cutPattern?.cuttingMethod}
                        onChange={(e) => updateField('cutPattern', 'cuttingMethod', e.target.value)}
                        className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white"
                      >
                        <option value="zigzag">Zigzag (Continuous Bi-Directional)</option>
                        <option value="oneway">One Way (Climb with Retract)</option>
                        <option value="spiral">Spiral (Closed Helical Sweep)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-600 block mb-1">Cut Sequence Order:</label>
                      <select
                        value={formState.cutPattern?.cutOrder}
                        onChange={(e) => updateField('cutPattern', 'cutOrder', e.target.value)}
                        className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white"
                      >
                        <option value="curve1_to_curve2">Curve 1 ➔ Curve 2</option>
                        <option value="curve2_to_curve1">Curve 2 ➔ Curve 1</option>
                        <option value="center_out">Center Outwards</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PAGE 3: Tool Selection & Speeds/Feeds */}
            {activePage === 'tool' && (
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-4">
                  {/* Tool Selection Table */}
                  <div className="col-span-7 border border-slate-300 bg-white p-3 rounded shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                      <h4 className="font-semibold text-slate-800">5-Axis Tool Selection</h4>
                      <button
                        onClick={onOpenToolLibrary}
                        className="text-purple-600 hover:text-purple-700 text-xs font-semibold underline"
                      >
                        Tool Library...
                      </button>
                    </div>
                    <div className="max-h-56 overflow-y-auto border border-slate-200 rounded">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                          <tr>
                            <th className="p-1.5">#</th>
                            <th className="p-1.5">Type</th>
                            <th className="p-1.5">Name</th>
                            <th className="p-1.5 text-right">Dia (mm)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tools.map((t) => {
                            const isSelected = String(t.id) === String(formState.tool?.id);
                            return (
                              <tr
                                key={t.id}
                                onClick={() => {
                                  updateField('tool', 'id', t.id);
                                  updateField('tool', 'number', t.number || t.id);
                                  updateField('tool', 'name', t.name);
                                  updateField('tool', 'diameter', Number(t.diameter || 10));
                                  updateField('tool', 'type', t.type || 'ball');
                                }}
                                className={`cursor-pointer border-b border-slate-100 hover:bg-purple-50 transition-colors ${
                                  isSelected ? 'bg-purple-100 font-semibold text-purple-900' : ''
                                }`}
                              >
                                <td className="p-1.5">T{t.number || t.id}</td>
                                <td className="p-1.5 uppercase text-[10px] text-slate-500">{t.type || 'ball'}</td>
                                <td className="p-1.5 truncate max-w-[140px]">{t.name}</td>
                                <td className="p-1.5 text-right">{t.diameter}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Speeds & Feeds Inputs */}
                  <div className="col-span-5 border border-slate-300 bg-white p-3 rounded shadow-sm space-y-2.5">
                    <h4 className="font-semibold text-slate-800 border-b border-slate-200 pb-1.5 mb-2">
                      Speeds & Feeds
                    </h4>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Spindle Speed:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={formState.tool?.spindleSpeed}
                          onChange={(e) => updateField('tool', 'spindleSpeed', Number(e.target.value))}
                          className="w-20 border border-slate-300 rounded px-1.5 py-0.5 text-right text-xs"
                        />
                        <span className="text-[10px] text-slate-500">RPM</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Feed Rate:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={formState.tool?.feedRate}
                          onChange={(e) => updateField('tool', 'feedRate', Number(e.target.value))}
                          className="w-20 border border-slate-300 rounded px-1.5 py-0.5 text-right text-xs"
                        />
                        <span className="text-[10px] text-slate-500">mm/min</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Plunge Rate:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={formState.tool?.plungeRate}
                          onChange={(e) => updateField('tool', 'plungeRate', Number(e.target.value))}
                          className="w-20 border border-slate-300 rounded px-1.5 py-0.5 text-right text-xs"
                        />
                        <span className="text-[10px] text-slate-500">mm/min</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-200">
                      <div className="text-[11px] text-slate-500">
                        Effective Diameter: <strong>{physics.effectiveDiameterMm} mm</strong>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Surface Speed: <strong>{physics.surfaceSpeedMpm} m/min</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PAGE 5: Tool Axis Control (Lead / Tilt) */}
            {activePage === 'tool_axis_control' && (
              <div className="space-y-4 max-w-xl">
                <div className="border border-slate-300 bg-white p-3.5 rounded shadow-sm space-y-3">
                  <h4 className="font-semibold text-slate-800 border-b border-slate-200 pb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-purple-600" />
                      5-Axis Tool Orientation Mode
                    </span>
                    <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 font-semibold">
                      FRENET T-N-B DYNAMICS
                    </span>
                  </h4>

                  <div className="space-y-2">
                    <label className="text-slate-600 block mb-1">Tool Axis Mode:</label>
                    <select
                      value={formState.toolAxisControl?.toolAxisMode}
                      onChange={(e) => updateField('toolAxisControl', 'toolAxisMode', e.target.value)}
                      className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white"
                    >
                      <option value="lead_tilt_normal">Surface Normal with Forward Lead & Side Tilt</option>
                      <option value="fixed_angle">Fixed Angle Relative to Direction</option>
                      <option value="to_point">Tilt Towards Point (Laser / Pivot Focus)</option>
                      <option value="from_point">Tilt Away from Point</option>
                      <option value="rotary_4axis">4-Axis Rotary (Fixed tilt around X/Y)</option>
                    </select>
                  </div>

                  {/* Lead Angle Slider */}
                  <div className="p-3 bg-purple-50/50 border border-purple-200 rounded space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-purple-900">Forward Lead Angle (Lead / Lag):</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="45"
                          value={formState.toolAxisControl?.leadAngleDeg}
                          onChange={(e) => updateField('toolAxisControl', 'leadAngleDeg', Number(e.target.value))}
                          className="w-16 border border-purple-300 rounded px-1.5 py-0.5 text-right font-bold text-purple-900 text-xs bg-white"
                        />
                        <span className="font-bold text-purple-900">°</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="45"
                      step="0.5"
                      value={formState.toolAxisControl?.leadAngleDeg}
                      onChange={(e) => updateField('toolAxisControl', 'leadAngleDeg', Number(e.target.value))}
                      className="w-full accent-purple-600 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-500">
                      Tilts the cutter forward in the feed direction. Eliminates 0-speed cutting at the ballnose dead tip.
                    </p>
                  </div>

                  {/* Side Tilt Angle Slider */}
                  <div className="p-3 bg-indigo-50/50 border border-indigo-200 rounded space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-indigo-900">Sideways Tilt Angle (Lean Angle):</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.5"
                          min="-45"
                          max="45"
                          value={formState.toolAxisControl?.tiltAngleDeg}
                          onChange={(e) => updateField('toolAxisControl', 'tiltAngleDeg', Number(e.target.value))}
                          className="w-16 border border-indigo-300 rounded px-1.5 py-0.5 text-right font-bold text-indigo-900 text-xs bg-white"
                        />
                        <span className="font-bold text-indigo-900">°</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="-45"
                      max="45"
                      step="0.5"
                      value={formState.toolAxisControl?.tiltAngleDeg}
                      onChange={(e) => updateField('toolAxisControl', 'tiltAngleDeg', Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-500">
                      Leans the tool sideways perpendicular to cutting direction to avoid shank rub against steep walls.
                    </p>
                  </div>

                  {/* Tilt Limits */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formState.toolAxisControl?.tiltAxisLimitsActive}
                        onChange={(e) => updateField('toolAxisControl', 'tiltAxisLimitsActive', e.target.checked)}
                      />
                      <span className="text-slate-700">Enforce Machine Tilt Limits</span>
                    </label>
                    <div className="flex items-center gap-2 text-slate-600 text-xs">
                      <span>Min: {formState.toolAxisControl?.minTiltAngleDeg}°</span>
                      <span>Max: {formState.toolAxisControl?.maxTiltAngleDeg}°</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PAGE 8: Machine Kinematics & Post Dialect */}
            {activePage === 'machine_kinematics' && (
              <div className="space-y-4 max-w-xl">
                <div className="border border-slate-300 bg-white p-3.5 rounded shadow-sm space-y-3">
                  <h4 className="font-semibold text-slate-800 border-b border-slate-200 pb-1.5 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-purple-600" />
                    Machine Kinematic Architecture
                  </h4>

                  <div className="space-y-2">
                    {MULTIAXIS_KINEMATICS_OPTIONS.map((k) => (
                      <label
                        key={k.id}
                        className={`p-2.5 rounded border flex items-start gap-2.5 cursor-pointer transition-all ${
                          formState.machineKinematics?.kinematicsId === k.id
                            ? 'bg-purple-50/70 border-purple-400'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="kinematics_arch"
                          checked={formState.machineKinematics?.kinematicsId === k.id}
                          onChange={() => updateField('machineKinematics', 'kinematicsId', k.id)}
                          className="mt-1 text-purple-600"
                        />
                        <div className="space-y-0.5">
                          <strong className="text-slate-800 text-xs">{k.name}</strong>
                          <div className="text-[10px] text-purple-800 font-medium">{k.primaryAxis} &bull; {k.secondaryAxis}</div>
                          <p className="text-[10px] text-slate-500">{k.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="border border-slate-300 bg-white p-3.5 rounded shadow-sm space-y-2.5">
                  <h4 className="font-semibold text-slate-800 border-b border-slate-200 pb-1.5">
                    Tool Center Point Management (TCPM / RTCP) Protocol
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {MULTIAXIS_TCPM_OPTIONS.map((t) => (
                      <label
                        key={t.id}
                        className={`p-2 rounded border cursor-pointer ${
                          formState.machineKinematics?.tcpmMode === t.id
                            ? 'bg-blue-50 border-blue-400 font-semibold'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="tcpm_mode"
                          checked={formState.machineKinematics?.tcpmMode === t.id}
                          onChange={() => updateField('machineKinematics', 'tcpmMode', t.id)}
                          className="mr-1.5 text-blue-600"
                        />
                        <span className="text-xs">{t.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PAGE 7: Linking Parameters */}
            {activePage === 'linking_parameters' && (
              <div className="space-y-4 max-w-xl">
                <div className="border border-slate-300 bg-white p-3.5 rounded shadow-sm space-y-3">
                  <h4 className="font-semibold text-slate-800 border-b border-slate-200 pb-1.5">
                    Clearance & Retract Planes
                  </h4>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-700">Clearance Area Type:</span>
                      <select
                        value={formState.linkingParameters?.clearanceAreaType}
                        onChange={(e) => updateField('linkingParameters', 'clearanceAreaType', e.target.value)}
                        className="border border-slate-300 rounded px-2 py-1 text-xs bg-white w-44"
                      >
                        <option value="cylinder">Cylinder around Spindle</option>
                        <option value="plane">Planar (Z Clearance)</option>
                        <option value="sphere">Spherical Enclosure</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-700">Clearance Plane (Z):</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={formState.linkingParameters?.clearancePlaneZ}
                          onChange={(e) => updateField('linkingParameters', 'clearancePlaneZ', Number(e.target.value))}
                          className="w-20 border border-slate-300 rounded px-2 py-1 text-xs text-right bg-white"
                        />
                        <span className="text-slate-500">mm</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-700">Retract Distance:</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={formState.linkingParameters?.retractDistanceMm}
                          onChange={(e) => updateField('linkingParameters', 'retractDistanceMm', Number(e.target.value))}
                          className="w-20 border border-slate-300 rounded px-2 py-1 text-xs text-right bg-white"
                        />
                        <span className="text-slate-500">mm</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-300 bg-white p-3.5 rounded shadow-sm space-y-3">
                  <h4 className="font-semibold text-slate-800 border-b border-slate-200 pb-1.5">
                    Lead-In / Lead-Out Tangential Moves
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-600 block mb-1">Lead-In Arc Radius:</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={formState.linkingParameters?.leadInRadiusMm}
                          onChange={(e) => updateField('linkingParameters', 'leadInRadiusMm', Number(e.target.value))}
                          className="w-full border border-slate-300 rounded px-2 py-1 text-xs text-right bg-white"
                        />
                        <span className="text-slate-500 text-xs">mm</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-600 block mb-1">Lead-Out Arc Radius:</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={formState.linkingParameters?.leadOutRadiusMm}
                          onChange={(e) => updateField('linkingParameters', 'leadOutRadiusMm', Number(e.target.value))}
                          className="w-full border border-slate-300 rounded px-2 py-1 text-xs text-right bg-white"
                        />
                        <span className="text-slate-500 text-xs">mm</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Other Pages: Fallback standard view */}
            {['holder', 'collision_control', 'arc_filter', 'planes_coolant'].includes(activePage) && (
              <div className="border border-slate-300 bg-white p-4 rounded shadow-sm max-w-xl space-y-3">
                <h4 className="font-semibold text-slate-800 border-b border-slate-200 pb-1.5">
                  {MULTIAXIS_MORPH_PAGE_TITLES[activePage]}
                </h4>
                <p className="text-xs text-slate-600">
                  Standard Mastercam Multiaxis settings loaded and optimized for simultaneous 5-axis morphing.
                </p>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1">
                  <div>Holder: <strong>CAT40 Precision 5X Collet Chuck</strong></div>
                  <div>Gouge Check: <strong>Active (Tilt Away with 1.5mm Shank Clearance)</strong></div>
                  <div>Tolerance: <strong>0.015 mm (High-Speed Smoothing Active)</strong></div>
                  <div>Coolant: <strong>High-Pressure Flood & Through-Spindle Active</strong></div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Modal Footer (Standard Mastercam OK / Cancel / Apply) */}
        <div className="bg-[#e2e8f0] border-t border-[#cbd5e1] px-4 py-2.5 flex items-center justify-between select-none">
          <div className="flex items-center gap-2 text-slate-600 text-xs">
            <span className="font-medium">Active Machine:</span>
            <span className="font-semibold text-slate-800">{activeMachine?.name || 'Fanuc Robodrill 5X'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOk}
              className="px-4 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold rounded text-xs shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>OK / Regenerate</span>
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
    </div>
  );
}
