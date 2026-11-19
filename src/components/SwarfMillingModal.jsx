import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Check, AlertTriangle, ShieldCheck, Cpu, Sliders,
  HelpCircle, Compass, Layers, RotateCw, Activity, Sparkles, Orbit
} from 'lucide-react';

import {
  SWARF_MILLING_PAGES,
  SWARF_DRIVE_MODES,
  SWARF_SYNC_MODES,
  SWARF_MILLING_MATERIALS,
  SWARF_MILLING_PRESETS,
  SWARF_MACHINE_KINEMATICS,
  SWARF_TCPM_DIALECTS,
  resolveDefaultSwarfTool,
  calculateSwarfPhysics,
  DEFAULT_SWARF_CONFIG
} from '../config/swarfMillingSchema.js';

export default function SwarfMillingModal({
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
  const defaultTool = useMemo(() => resolveDefaultSwarfTool(tools), [tools]);

  // Form State
  const [formState, setFormState] = useState(() => {
    const base = { ...DEFAULT_SWARF_CONFIG };
    if (defaultTool) {
      base.toolId = defaultTool.id;
      base.toolName = defaultTool.name;
      base.toolDiameter = Number(defaultTool.diameter) || 10;
      base.spindleRpm = defaultTool.rpm || 12000;
      base.feedRate = defaultTool.feedRate || 2800;
    }
    if (operation) {
      return { ...base, ...operation };
    }
    return base;
  });

  const [activePage, setActivePage] = useState('cut_pattern');
  const [editedPages, setEditedPages] = useState(
    new Set(['toolpath_type', 'cut_pattern', 'tool', 'tool_axis_control'])
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
        name: '10mm 4-Flute Flat Endmill',
        diameter: 10,
        flutes: 4,
        fluteLength: 25,
        type: 'flat'
      }
    );
  }, [tools, formState.toolId, defaultTool]);

  // Real-time Physics Calculation
  const material = SWARF_MILLING_MATERIALS[formState.materialId?.toUpperCase()] || SWARF_MILLING_MATERIALS.ALU_6061;
  const physics = useMemo(() => {
    return calculateSwarfPhysics({
      material,
      tool: selectedTool,
      wallHeight: Number(formState.wallHeightMm) || 22.0,
      stepover: Number(formState.radialStepover) || 0.5,
      feedRate: Number(formState.feedRate) || 2800,
      rpm: Number(formState.spindleRpm) || 12000,
      passes: formState.enableRadialPasses ? Number(formState.radialPasses) || 1 : 1,
      axialSlices: formState.enableAxialSlices ? Number(formState.axialSlices) || 1 : 1,
      toolOverhangMm: Number(formState.toolStickoutMm) || 45.0
    });
  }, [
    material,
    selectedTool,
    formState.wallHeightMm,
    formState.radialStepover,
    formState.feedRate,
    formState.spindleRpm,
    formState.enableRadialPasses,
    formState.radialPasses,
    formState.enableAxialSlices,
    formState.axialSlices,
    formState.toolStickoutMm
  ]);

  // Load Preset
  const handleApplyPreset = (presetKey) => {
    const preset = SWARF_MILLING_PRESETS[presetKey];
    if (!preset) return;
    setFormState((prev) => ({
      ...prev,
      presetId: preset.id,
      materialId: preset.materialId,
      driveMode: preset.driveMode,
      syncMode: preset.syncMode,
      cutDirection: preset.cutDirection,
      cuttingMethod: preset.cuttingMethod,
      enableAxialSlices: preset.axialSlices > 1,
      axialSlices: preset.axialSlices,
      enableRadialPasses: preset.radialPasses > 1,
      radialPasses: preset.radialPasses,
      radialStepover: preset.radialStepover,
      stockToLeaveWall: preset.stockToLeaveWall,
      stockToLeaveFloor: preset.stockToLeaveFloor,
      leadAngleDeg: preset.leadAngleDeg,
      tiltOffsetDeg: preset.tiltOffsetDeg,
      rollInRadiusMm: preset.rollInRadius,
      rollInAngleDeg: preset.rollInAngleDeg
    }));
    onNotify?.(`Applied Preset: ${preset.name}`, 'info');
  };

  // Commit and Save
  const handleSave = () => {
    const savedOp = {
      id: operation?.id || `op_swarf_${Date.now()}`,
      name: formState.name || '5-Axis Swarf Milling (Flank Contouring)',
      strategy: '5axis_swarf',
      strategyKey: '5axis_swarf',
      badgeClass: 'swarf',
      badgeText: '5X-SWARF',
      color: '#8b5cf6',
      toolId: selectedTool.id,
      tool: selectedTool,
      ...formState,
      physics,
      timestamp: Date.now()
    };

    onSaveOperation?.(savedOp);
    onNotify?.('5-Axis Swarf Milling toolpath generated successfully!', 'success');
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative flex flex-col w-full max-w-5xl h-[88vh] bg-[#1e2430] border border-[#3b455b] rounded-lg shadow-2xl overflow-hidden text-slate-200">
        {/* Mastercam Titlebar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#171c26] border-b border-[#2d3748] select-none">
          <div className="flex items-center gap-2">
            <Orbit className="w-5 h-5 text-purple-400" />
            <span className="font-semibold text-sm tracking-wide text-white">
              5-Axis Swarf Milling (Flank Contouring) &mdash; Parameter Configuration
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-700/50">
              5X FLANK
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Mastercam 2-Column Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Navigation Tree */}
          <div className="w-64 bg-[#141822] border-r border-[#2d3748] flex flex-col select-none">
            <div className="p-3 border-b border-[#2d3748] bg-[#171c26]">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Parameter Pages
              </span>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {Object.entries(SWARF_MILLING_PAGES).map(([pageKey, title]) => {
                const isActive = activePage === pageKey;
                const isEdited = editedPages.has(pageKey);
                return (
                  <button
                    key={pageKey}
                    onClick={() => setActivePage(pageKey)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors border-l-2 ${
                      isActive
                        ? 'bg-purple-950/40 text-purple-200 border-purple-500 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/60 border-transparent'
                    }`}
                  >
                    <span className="truncate">{title}</span>
                    {isEdited && (
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tool Information Snippet */}
            <div className="p-3 border-t border-[#2d3748] bg-[#10141d] text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Active Cutter:</span>
                <span className="font-semibold text-white truncate max-w-[120px]">
                  {selectedTool?.name}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Diameter:</span>
                <span className="text-purple-300 font-mono">{selectedTool?.diameter} mm</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Flute Length:</span>
                <span className="text-emerald-400 font-mono">
                  {selectedTool?.fluteLength || 25} mm
                </span>
              </div>
            </div>
          </div>

          {/* Right Parameter Workspace */}
          <div className="flex-1 flex flex-col overflow-y-auto p-5 bg-[#1a1f2c]">
            {/* Page 1: Toolpath Type */}
            {activePage === 'toolpath_type' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-white">5-Axis Swarf Milling Overview</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Machining with the cylindrical flank of the tool tangential to ruled sidewalls and blade surfaces.
                  </p>
                </div>

                {/* Preset Application Cards */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Industrial Presets</label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(SWARF_MILLING_PRESETS).map(([key, p]) => (
                      <div
                        key={key}
                        onClick={() => handleApplyPreset(key)}
                        className={`p-3 rounded border cursor-pointer transition-all ${
                          formState.presetId === p.id
                            ? 'bg-purple-950/40 border-purple-500 text-white'
                            : 'bg-[#151924] border-[#2d3748] hover:border-slate-500 text-slate-300'
                        }`}
                      >
                        <div className="font-semibold text-xs text-purple-300">{p.name}</div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          Direction: {p.cutDirection.toUpperCase()} &bull; Slices: {p.axialSlices} &bull; Passes: {p.radialPasses}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Operation Name */}
                <div className="pt-2 border-t border-[#2d3748] space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Toolpath Name</label>
                  <input
                    type="text"
                    value={formState.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-[#121620] border border-[#2d3748] rounded text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            )}

            {/* Page 2: Cut Pattern & Rail Guides */}
            {activePage === 'cut_pattern' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-white">Cut Pattern & Rail Guides</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Define ruled guide rails, curve synchronization, and multi-depth / multi-pass slicing.
                  </p>
                </div>

                {/* Drive Geometry Mode */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Geometry Drive Mode</label>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.values(SWARF_DRIVE_MODES).map((mode) => (
                      <div
                        key={mode.id}
                        onClick={() => updateField('driveMode', mode.id)}
                        className={`p-3 rounded border cursor-pointer transition-all ${
                          formState.driveMode === mode.id
                            ? 'bg-purple-950/40 border-purple-500 text-white'
                            : 'bg-[#151924] border-[#2d3748] hover:border-slate-500 text-slate-300'
                        }`}
                      >
                        <div className="text-xs font-semibold text-purple-300">{mode.name}</div>
                        <div className="text-[10px] text-slate-400 mt-1">{mode.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rail Synchronization */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Rail Synchronization</label>
                  <select
                    value={formState.syncMode}
                    onChange={(e) => updateField('syncMode', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-[#121620] border border-[#2d3748] rounded text-white focus:outline-none focus:border-purple-500"
                  >
                    {Object.values(SWARF_SYNC_MODES).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cutting Direction & Method */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Milling Direction</label>
                    <select
                      value={formState.cutDirection}
                      onChange={(e) => updateField('cutDirection', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-[#121620] border border-[#2d3748] rounded text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="climb">Climb Milling (Left of Guide Rail)</option>
                      <option value="conventional">Conventional Milling (Right of Guide Rail)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Cutting Motion</label>
                    <select
                      value={formState.cuttingMethod}
                      onChange={(e) => updateField('cuttingMethod', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-[#121620] border border-[#2d3748] rounded text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="one_way">One Way (Consistent Climb Direction)</option>
                      <option value="zig_zag">Zig-Zag (Bi-directional Flank Pass)</option>
                    </select>
                  </div>
                </div>

                {/* Multi-Depth & Multi-Pass Slicing */}
                <div className="grid grid-cols-2 gap-4 p-3 bg-[#141822] border border-[#2d3748] rounded">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="enableAxial"
                        checked={formState.enableAxialSlices}
                        onChange={(e) => updateField('enableAxialSlices', e.target.checked)}
                        className="rounded border-[#2d3748] bg-[#121620] text-purple-600 focus:ring-0"
                      />
                      <label htmlFor="enableAxial" className="text-xs font-semibold text-white cursor-pointer">
                        Axial Multi-Depth Slices
                      </label>
                    </div>
                    {formState.enableAxialSlices && (
                      <div className="pl-5 space-y-1.5">
                        <label className="text-[11px] text-slate-400">Number of Axial Slices</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={formState.axialSlices}
                          onChange={(e) => updateField('axialSlices', Number(e.target.value))}
                          className="w-24 px-2 py-1 text-xs bg-[#121620] border border-[#2d3748] rounded text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="enableRadial"
                        checked={formState.enableRadialPasses}
                        onChange={(e) => updateField('enableRadialPasses', e.target.checked)}
                        className="rounded border-[#2d3748] bg-[#121620] text-purple-600 focus:ring-0"
                      />
                      <label htmlFor="enableRadial" className="text-xs font-semibold text-white cursor-pointer">
                        Radial Multi-Pass (Stock Stepovers)
                      </label>
                    </div>
                    {formState.enableRadialPasses && (
                      <div className="pl-5 grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-slate-400">Passes Count</label>
                          <input
                            type="number"
                            min="1"
                            max="8"
                            value={formState.radialPasses}
                            onChange={(e) => updateField('radialPasses', Number(e.target.value))}
                            className="w-full px-2 py-1 text-xs bg-[#121620] border border-[#2d3748] rounded text-white focus:outline-none focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-400">Stepover (mm)</label>
                          <input
                            type="number"
                            step="0.05"
                            value={formState.radialStepover}
                            onChange={(e) => updateField('radialStepover', Number(e.target.value))}
                            className="w-full px-2 py-1 text-xs bg-[#121620] border border-[#2d3748] rounded text-white focus:outline-none focus:border-purple-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stock to Leave */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Wall Stock to Leave (mm)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={formState.stockToLeaveWall}
                      onChange={(e) => updateField('stockToLeaveWall', Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-[#121620] border border-[#2d3748] rounded text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Floor Stock to Leave (mm)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={formState.stockToLeaveFloor}
                      onChange={(e) => updateField('stockToLeaveFloor', Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-[#121620] border border-[#2d3748] rounded text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Page 3: Tool Selection & Dynamics */}
            {activePage === 'tool' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-white">Tool Selection & Dynamics</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Choose cutting tool and configure spindle speeds and feeds.
                    </p>
                  </div>
                  <button
                    onClick={onOpenToolLibrary}
                    className="px-3 py-1.5 text-xs font-semibold bg-purple-700 hover:bg-purple-600 text-white rounded transition-colors"
                  >
                    Tool Library...
                  </button>
                </div>

                {/* Tool Selector Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Selected Tool</label>
                  <select
                    value={formState.toolId}
                    onChange={(e) => updateField('toolId', Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs bg-[#121620] border border-[#2d3748] rounded text-white focus:outline-none focus:border-purple-500"
                  >
                    {tools.map((t) => (
                      <option key={t.id} value={t.id}>
                        T{t.number || t.id} - {t.name} (Dia: {t.diameter}mm, Flute: {t.fluteLength || 25}mm)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Flute Length vs Wall Height Checker */}
                <div className="p-3 bg-[#141822] border border-[#2d3748] rounded flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Tool Flute Contact Check</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Flute Length: {selectedTool?.fluteLength || 25}mm &bull; Wall Height: {formState.wallHeightMm}mm
                    </div>
                  </div>
                  {(selectedTool?.fluteLength || 25) >= Number(formState.wallHeightMm) ? (
                    <span className="text-xs px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-600/50 text-emerald-300 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Full Depth Flank Covered
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-1 rounded bg-amber-950/60 border border-amber-600/50 text-amber-300 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Multi-Depth Required
                    </span>
                  )}
                </div>

                {/* Speeds and Feeds */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Spindle Speed (RPM)</label>
                    <input
                      type="number"
                      value={formState.spindleRpm}
                      onChange={(e) => updateField('spindleRpm', Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-[#121620] border border-[#2d3748] rounded text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Cutting Feed (mm/min)</label>
                    <input
                      type="number"
                      value={formState.feedRate}
                      onChange={(e) => updateField('feedRate', Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-[#121620] border border-[#2d3748] rounded text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Plunge Feed (mm/min)</label>
                    <input
                      type="number"
                      value={formState.plungeFeed}
                      onChange={(e) => updateField('plungeFeed', Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-[#121620] border border-[#2d3748] rounded text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Page 4: Holder Definition & Clearance */}
            {activePage === 'holder' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-white">Holder Definition & Clearance</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage tool stickout and holder collision envelopes.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Holder Spindle Taper</label>
                    <select
                      value={formState.holderType}
                      onChange={(e) => updateField('holderType', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-[#121620] border border-[#2d3748] rounded text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="hsk_a63">HSK-A63 High-Precision Hydraulic Chuck</option>
                      <option value="bt40">BT40 Shrink-Fit Thermal Chuck</option>
                      <option value="cat40">CAT40 ER32 Collet Chuck</option>
                      <option value="capto_c6">Coromant Capto C6 Modular</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Tool Stickout (L_overhang mm)</label>
                    <input
                      type="number"
                      step="1"
                      value={formState.toolStickoutMm}
                      onChange={(e) => updateField('toolStickoutMm', Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-[#121620] border border-[#2d3748] rounded text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Holder Clearance Buffer (mm)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formState.holderClearanceMm}
                      onChange={(e) => updateField('holderClearanceMm', Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-[#121620] border border-[#2d3748] rounded text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Shank Clearance Buffer (mm)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formState.shankClearanceMm}
                      onChange={(e) => updateField('shankClearanceMm', Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-[#121620] border border-[#2d3748] rounded text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Page 5: Tool Axis Control (Lead / Tilt / Fanning) */}
            {activePage === 'tool_axis_control' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-white">Tool Axis Control & Orientation</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Control primary flank contact, lead/lag forward tilt, and rotary motion smoothing.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Lead / Lag Angle (Degrees)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="-5"
                      max="5"
                      value={formState.leadAngleDeg}
                      onChange={(e) => updateField('leadAngleDeg', Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-[#121620] border border-[#2d3748] rounded text-white focus:outline-none focus:border-purple-500"
                    />
                    <div className="text-[10px] text-slate-400">
                      Forward lean along feed direction (+0.5&deg; eliminates heel drag).
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Side Tilt Offset (Degrees)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="-10"
                      max="10"
                      value={formState.tiltOffsetDeg}
                      onChange={(e) => updateField('tiltOffsetDeg', Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-[#121620] border border-[#2d3748] rounded text-white focus:outline-none focus:border-purple-500"
                    />
                    <div className="text-[10px] text-slate-400">
                      Transverse tilt relative to ruled surface normal.
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#141822] border border-[#2d3748] rounded space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="smoothSing"
                      checked={formState.smoothSingularities}
                      onChange={(e) => updateField('smoothSingularities', e.target.checked)}
                      className="rounded border-[#2d3748] bg-[#121620] text-purple-600 focus:ring-0"
                    />
                    <label htmlFor="smoothSing" className="text-xs font-semibold text-white cursor-pointer">
                      Automatic Singularity & Gimbal Lock Smoothing
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-400 pl-5">
                    Maintains smooth rotary acceleration near vertical pole transitions (A &approx; 0&deg;).
                  </p>
                </div>
              </div>
            )}

            {/* Page 6: Collision Control & Gouge Protection */}
            {activePage === 'collision_control' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-white">Collision Control & Gouge Protection</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Verify floor clearance and prevent tool body / holder collisions.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Floor Clearance Lift (mm)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formState.floorClearanceMm}
                      onChange={(e) => updateField('floorClearanceMm', Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-[#121620] border border-[#2d3748] rounded text-white focus:outline-none focus:border-purple-500"
                    />
                    <div className="text-[10px] text-slate-400">
                      Axial elevation above floor curve to prevent bottom corner gouging.
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Collision Avoidance Action</label>
                    <select
                      value={formState.collisionRetractMode}
                      onChange={(e) => updateField('collisionRetractMode', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-[#121620] border border-[#2d3748] rounded text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="retract_along_tool_axis">Retract Tool Along Orientation Vector</option>
                      <option value="tilt_away">Tilt Tool Flank Away From Interference</option>
                      <option value="skip_pass">Trim and Skip Gouging Segment</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Page 7: Linking Parameters & Lead In/Out */}
            {activePage === 'linking_parameters' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-white">Linking Parameters & Lead In/Out</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Tangential roll-in / roll-out 3D arcs and safe clearance heights.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Clearance Z (mm)</label>
                    <input
                      type="number"
                      value={formState.clearanceZ}
                      onChange={(e) => updateField('clearanceZ', Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-[#121620] border border-[#2d3748] rounded text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Retract Z (mm)</label>
                    <input
                      type="number"
                      value={formState.retractZ}
                      onChange={(e) => updateField('retractZ', Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-[#121620] border border-[#2d3748] rounded text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Feed Plane Z (mm)</label>
                    <input
                      type="number"
                      value={formState.feedPlaneZ}
                      onChange={(e) => updateField('feedPlaneZ', Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-[#121620] border border-[#2d3748] rounded text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-3 bg-[#141822] border border-[#2d3748] rounded">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-purple-300">Roll-In Arc Radius (mm)</label>
                    <input
                      type="number"
                      step="1"
                      value={formState.rollInRadiusMm}
                      onChange={(e) => updateField('rollInRadiusMm', Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-[#121620] border border-[#2d3748] rounded text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-purple-300">Roll-In Arc Sweep (Deg)</label>
                    <input
                      type="number"
                      step="5"
                      value={formState.rollInAngleDeg}
                      onChange={(e) => updateField('rollInAngleDeg', Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-[#121620] border border-[#2d3748] rounded text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Page 8: Machine Kinematics & Post Dialect */}
            {activePage === 'machine_kinematics' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-white">Machine Kinematics & Post Dialect</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Select 5-axis machine kinematics solver and CNC controller post-processor dialect.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Machine Kinematic Architecture</label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.values(SWARF_MACHINE_KINEMATICS).map((k) => (
                      <div
                        key={k.id}
                        onClick={() => updateField('machineKinematics', k.id)}
                        className={`p-3 rounded border cursor-pointer transition-all ${
                          formState.machineKinematics === k.id
                            ? 'bg-purple-950/40 border-purple-500 text-white'
                            : 'bg-[#151924] border-[#2d3748] hover:border-slate-500 text-slate-300'
                        }`}
                      >
                        <div className="text-xs font-semibold text-purple-300">{k.name}</div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Axes: {k.primaryAxis} &bull; {k.secondaryAxis}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">CNC Controller Dialect</label>
                  <select
                    value={formState.controllerDialect}
                    onChange={(e) => updateField('controllerDialect', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-[#121620] border border-[#2d3748] rounded text-white focus:outline-none focus:border-purple-500"
                  >
                    {Object.values(SWARF_TCPM_DIALECTS).map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Page 9: Arc Filter & 5X Tolerance */}
            {activePage === 'arc_filter' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-white">Arc Filter & 5X Tolerance</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Control trajectory point density and look-ahead acceleration.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Linearization Tolerance (mm)</label>
                    <input
                      type="number"
                      step="0.005"
                      value={formState.linearizationToleranceMm}
                      onChange={(e) => updateField('linearizationToleranceMm', Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-[#121620] border border-[#2d3748] rounded text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Max Rotary Step Per Block (&deg;)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formState.maxRotaryAngleStepDeg}
                      onChange={(e) => updateField('maxRotaryAngleStepDeg', Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-[#121620] border border-[#2d3748] rounded text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Page 10: Planes (WCS) & Coolant */}
            {activePage === 'planes_coolant' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-white">Planes (WCS) & Coolant Management</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Select work coordinate system and cutting fluid mode.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Work Coordinate System (WCS)</label>
                    <select
                      value={formState.wcsPlane}
                      onChange={(e) => updateField('wcsPlane', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-[#121620] border border-[#2d3748] rounded text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="top_g17">Top (G17) - Standard Vertical</option>
                      <option value="front_g19">Front (G19)</option>
                      <option value="right_g18">Right (G18)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Coolant Mode</label>
                    <select
                      value={formState.coolantMode}
                      onChange={(e) => updateField('coolantMode', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-[#121620] border border-[#2d3748] rounded text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="flood_m08">Flood Coolant (M08)</option>
                      <option value="through_spindle_m88">High-Pressure TSC 70 bar (M88)</option>
                      <option value="mist_m07">Air-Oil Mist (M07)</option>
                      <option value="air_blast_m09">Cold Air Blast (M09)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer: Real-time Physics HUD & Commit Actions */}
        <div className="px-4 py-2.5 bg-[#141822] border-t border-[#2d3748] flex items-center justify-between text-xs select-none">
          {/* Real-time Physics HUD */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Material:</span>
              <select
                value={formState.materialId}
                onChange={(e) => updateField('materialId', e.target.value)}
                className="px-2 py-0.5 bg-[#1e2430] border border-[#3b455b] rounded text-white font-medium text-xs focus:outline-none focus:border-purple-500"
              >
                {Object.values(SWARF_MILLING_MATERIALS).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="h-4 w-px bg-slate-700" />

            <div className="flex items-center gap-3 text-[11px] text-slate-300 font-mono">
              <span>
                MRR: <strong className="text-white">{physics.mrr}</strong> cm&sup3;/min
              </span>
              <span>
                Power: <strong className="text-white">{physics.spindlePowerKw}</strong> kW
              </span>
              <span>
                Force: <strong className="text-white">{physics.fc}</strong> N
              </span>
              <span>
                Deflection:{' '}
                <strong style={{ color: physics.ratingColor }}>
                  {physics.deflectionMm} mm ({physics.deflectionMicrons} &mu;m)
                </strong>
              </span>
              <span>
                Taper Err: <strong className="text-purple-300">{physics.taperErrorDeg}&deg;</strong>
              </span>
            </div>
          </div>

          {/* Action Buttons: Green Checkmark (OK) & Red Cancel */}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-red-400" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded border border-emerald-500 shadow-md shadow-emerald-900/30 transition-all"
            >
              <Check className="w-4 h-4 text-white" />
              Generate Swarf Toolpath
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
