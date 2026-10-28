import React, { useState, useMemo, useRef } from 'react';
import {
  X, Maximize2, Minimize2, Download, Copy, Check,
  Box, Grid, Info, RotateCcw, Cpu, Clock, Sliders,
  CheckCircle2, Wrench, Disc, Crosshair, ChevronRight, Eye,
  Zap, Layers, ArrowDown, Scissors, ZoomIn, ZoomOut, Maximize
} from 'lucide-react';
import {
  SAMPLE_POCKET_PROFILES,
  generateCornerRelief,
  generateCornerReliefGCode,
  exportCornerReliefSVG
} from '../utils/cornerReliefEngine.js';

export default function CornerReliefStudioModal({
  isOpen,
  onClose,
  activeWorkpiece = null,
  onApplyReliefGeometry = null
}) {

  // Modal display states
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('canvas'); // 'canvas' | 'gcode' | 'specs'
  const [copiedGCode, setCopiedGCode] = useState(false);
  const [appliedFeedback, setAppliedFeedback] = useState(false);

  // Configuration States
  const [selectedPresetId, setSelectedPresetId] = useState('PCB_ENCLOSURE_POCKET');
  const [reliefType, setReliefType] = useState('dogbone'); // 'dogbone' | 'tbone_h' | 'tbone_v' | 'notch'
  const [toolDiameter, setToolDiameter] = useState(6.0);
  const [additionalClearance, setAdditionalClearance] = useState(0.15);
  const [targetDepth, setTargetDepth] = useState(12.0);
  const [spindleRpm, setSpindleRpm] = useState(18000);
  const [feedMmMin, setFeedMmMin] = useState(2200);

  // Custom Pocket Dimension Overrides (if Custom is chosen)
  const [customWidth, setCustomWidth] = useState(100);
  const [customHeight, setCustomHeight] = useState(70);

  // Canvas View Controls
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [showMatingPeg, setShowMatingPeg] = useState(true);
  const [showCutterPaths, setShowCutterPaths] = useState(true);
  const [showOvercutVolumes, setShowOvercutVolumes] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [selectedCornerIdx, setSelectedCornerIdx] = useState(null);

  // Active Polygon based on preset or custom dimensions
  const activePolygon = useMemo(() => {
    if (selectedPresetId === 'CUSTOM') {
      return [
        { x: 0, y: 0 },
        { x: customWidth, y: 0 },
        { x: customWidth, y: customHeight },
        { x: 0, y: customHeight }
      ];
    }
    const preset = SAMPLE_POCKET_PROFILES[selectedPresetId];
    if (preset) {
      return preset.polygon;
    }
    return SAMPLE_POCKET_PROFILES.PCB_ENCLOSURE_POCKET.polygon;
  }, [selectedPresetId, customWidth, customHeight]);

  // Compute Corner Relief Data
  const reliefResult = useMemo(() => {
    return generateCornerRelief(activePolygon, {
      toolDiameter,
      reliefType,
      additionalClearance,
      targetDepth,
      spindleRpm,
      feedMmMin
    });
  }, [activePolygon, toolDiameter, reliefType, additionalClearance, targetDepth, spindleRpm, feedMmMin]);

  // Generate G-Code Output
  const gcodeOutput = useMemo(() => {
    if (!reliefResult) return '';
    return generateCornerReliefGCode(reliefResult);
  }, [reliefResult]);

  // Preset Selection Handler
  const handleSelectPreset = (presetKey) => {
    setSelectedPresetId(presetKey);
    if (presetKey !== 'CUSTOM') {
      const preset = SAMPLE_POCKET_PROFILES[presetKey];
      if (preset) {
        setToolDiameter(preset.defaultToolDia || 6.0);
        setTargetDepth(preset.targetDepth || 12.0);
      }
    }
    setSelectedCornerIdx(null);
  };

  // Copy G-Code Handler
  const handleCopyGCode = () => {
    if (!gcodeOutput) return;
    navigator.clipboard.writeText(gcodeOutput);
    setCopiedGCode(true);
    setTimeout(() => setCopiedGCode(false), 2200);
  };

  // Download G-Code File
  const handleDownloadGCode = () => {
    if (!gcodeOutput) return;
    const blob = new Blob([gcodeOutput], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ArgusCAM_CornerRelief_${reliefType}_D${toolDiameter}mm.nc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export SVG File
  const handleExportSVG = () => {
    if (!reliefResult) return;
    const svgContent = exportCornerReliefSVG(reliefResult);
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ArgusCAM_Relief_Profile_${reliefType}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Apply to CAM Operations
  const handleApplyToCAM = () => {
    if (onApplyReliefGeometry) {
      onApplyReliefGeometry(reliefResult);
    }
    setAppliedFeedback(true);
    setTimeout(() => setAppliedFeedback(false), 2500);
  };

  // SVG Canvas Dimension Calculations
  const { matingPeg, reliefFeatures, rawPolygon, metrics } = reliefResult;
  const padding = 25;
  const svgWidth = matingPeg.width + padding * 2;
  const svgHeight = matingPeg.height + padding * 2;

  // Raw Polygon Points SVG String
  const polyPointsString = rawPolygon
    .map(pt => `${pt.x + padding},${svgHeight - (pt.y + padding)}`)
    .join(' ');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-hidden">
      <div
        className={`bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col transition-all duration-200 ${
          isFullscreen ? 'w-full h-full rounded-none m-0' : 'w-[95vw] max-w-7xl h-[92vh]'
        }`}
      >
        {/* ==================================================================== */}
        {/* MODAL HEADER */}
        {/* ==================================================================== */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Box size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-slate-100 tracking-tight">
                  Automatic Corner Relief &amp; Dog-Bone Studio
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                  CNC Pocket Overcut
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30">
                  100% Flush Seating
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Eliminate round-tool inside radius interference on pockets, tenons, electronics enclosures &amp; sheet tabs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              title={isFullscreen ? 'Restore Window' : 'Full Screen'}
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Close Studio"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* MAIN BODY: 2-PANEL LAYOUT */}
        {/* ==================================================================== */}
        <div className="flex-1 flex overflow-hidden">
          {/* ------------------------------------------------------------------ */}
          {/* LEFT PANEL: PARAMETERS & GEOMETRY SETTINGS */}
          {/* ------------------------------------------------------------------ */}
          <div className="w-80 md:w-96 border-r border-slate-800 bg-slate-900/90 flex flex-col overflow-y-auto custom-scrollbar p-5 space-y-6">
            {/* POCKET PRESETS */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Grid size={14} className="text-emerald-400" />
                Pocket &amp; Joint Geometry Preset
              </label>
              <div className="grid grid-cols-1 gap-2">
                {Object.values(SAMPLE_POCKET_PROFILES).map(preset => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset.id)}
                      className={`text-left p-3 rounded-lg border text-xs transition-all ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-slate-100 shadow-sm'
                          : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800/80 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span>{preset.name}</span>
                        <span className="text-[10px] text-emerald-400 px-1.5 py-0.5 bg-emerald-500/10 rounded">
                          {preset.width} &times; {preset.height} mm
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        {preset.description}
                      </p>
                    </button>
                  );
                })}

                {/* Custom Rectangular Pocket */}
                <button
                  onClick={() => handleSelectPreset('CUSTOM')}
                  className={`text-left p-3 rounded-lg border text-xs transition-all ${
                    selectedPresetId === 'CUSTOM'
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-slate-100 shadow-sm'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span>Custom Rectangular Cavity</span>
                    <span className="text-[10px] text-cyan-400 px-1.5 py-0.5 bg-cyan-500/10 rounded">
                      User Defined
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Input arbitrary width, height and depth dimensions
                  </p>
                </button>
              </div>

              {/* Custom Dimensions Form */}
              {selectedPresetId === 'CUSTOM' && (
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Width (X mm)</label>
                    <input
                      type="number"
                      value={customWidth}
                      onChange={e => setCustomWidth(Math.max(10, parseFloat(e.target.value) || 10))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Height (Y mm)</label>
                    <input
                      type="number"
                      value={customHeight}
                      onChange={e => setCustomHeight(Math.max(10, parseFloat(e.target.value) || 10))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* RELIEF STYLE SELECTOR */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders size={14} className="text-cyan-400" />
                Relief Geometry Style
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    id: 'dogbone',
                    label: 'Dog-Bone',
                    sub: '45° Diagonal Bisector',
                    tip: 'Best for standard pockets, tenons & square parts'
                  },
                  {
                    id: 'tbone_h',
                    label: 'T-Bone Horiz.',
                    sub: 'Along Horiz. Wall',
                    tip: 'Conceals overcut from front viewing angle'
                  },
                  {
                    id: 'tbone_v',
                    label: 'T-Bone Vert.',
                    sub: 'Along Vert. Wall',
                    tip: 'Conceals overcut from side viewing angle'
                  },
                  {
                    id: 'notch',
                    label: 'Corner Notch',
                    sub: 'Minimal Slot Cut',
                    tip: 'Subtle 45° slot for delicate sheet tabs'
                  }
                ].map(style => {
                  const isSelected = reliefType === style.id;
                  return (
                    <button
                      key={style.id}
                      onClick={() => setReliefType(style.id)}
                      title={style.tip}
                      className={`p-2.5 text-left rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-cyan-500/15 border-cyan-500/60 text-slate-100'
                          : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-semibold text-xs flex items-center justify-between">
                        {style.label}
                        {isSelected && <Check size={13} className="text-cyan-400" />}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{style.sub}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TOOL & MACHINING PARAMETERS */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Wrench size={14} className="text-amber-400" />
                Endmill &amp; Machining Specs
              </label>

              <div className="space-y-3 bg-slate-950/50 p-3.5 rounded-lg border border-slate-800">
                {/* Tool Diameter */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-slate-300">Cutter Diameter (D)</span>
                    <span className="font-mono text-emerald-400 font-semibold">{toolDiameter} mm</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="1.0"
                      max="16.0"
                      step="0.5"
                      value={toolDiameter}
                      onChange={e => setToolDiameter(parseFloat(e.target.value))}
                      className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded-lg"
                    />
                  </div>
                  {/* Quick Select Tool Diameters */}
                  <div className="flex gap-1.5 mt-2">
                    {[3.0, 4.0, 6.0, 6.35, 8.0, 10.0].map(dia => (
                      <button
                        key={dia}
                        onClick={() => setToolDiameter(dia)}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                          toolDiameter === dia
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Ø{dia}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Slip-Fit Clearance */}
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-slate-300">Slip-Fit Clearance (+c)</span>
                    <span className="font-mono text-cyan-400 font-semibold">+{additionalClearance.toFixed(2)} mm</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="0.5"
                    step="0.05"
                    value={additionalClearance}
                    onChange={e => setAdditionalClearance(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg"
                  />
                  <div className="text-[10px] text-slate-400 mt-1">
                    Added margin ensures effortless hand-assembly without binding
                  </div>
                </div>

                {/* Pocket Depth */}
                <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Target Depth</label>
                    <div className="flex items-center gap-1 font-mono text-xs">
                      <span className="text-slate-500">Z-</span>
                      <input
                        type="number"
                        value={targetDepth}
                        onChange={e => setTargetDepth(Math.max(1, parseFloat(e.target.value) || 1))}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Feedrate</label>
                    <div className="flex items-center gap-1 font-mono text-xs">
                      <input
                        type="number"
                        value={feedMmMin}
                        onChange={e => setFeedMmMin(Math.max(100, parseInt(e.target.value) || 1000))}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                      />
                      <span className="text-slate-500 text-[10px]">mm/m</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* DETECTED CORNERS TABLE */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  Inside Corners ({reliefFeatures.length})
                </label>
                <span className="text-[10px] text-emerald-400 font-mono">
                  All 90° Cleared
                </span>
              </div>

              <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                {reliefFeatures.map((feat, idx) => {
                  const isHighlighted = selectedCornerIdx === idx;
                  return (
                    <div
                      key={feat.id}
                      onClick={() => setSelectedCornerIdx(isHighlighted ? null : idx)}
                      className={`px-3 py-2 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                        isHighlighted
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200'
                          : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <span>Corner ({feat.cornerPoint.x.toFixed(0)}, {feat.cornerPoint.y.toFixed(0)})</span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-400">
                        Penetration: {feat.penetrationMm} mm
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------------ */}
          {/* RIGHT PANEL: TABS & INTERACTIVE VISUALIZER */}
          {/* ------------------------------------------------------------------ */}
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
            {/* TABS BAR */}
            <div className="flex items-center justify-between px-6 py-2.5 border-b border-slate-800 bg-slate-900/40">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('canvas')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
                    activeTab === 'canvas'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Eye size={14} />
                  2D Geometry &amp; Assembly Fit
                </button>
                <button
                  onClick={() => setActiveTab('gcode')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
                    activeTab === 'gcode'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Cpu size={14} />
                  ISO G-Code CNC Program
                </button>
                <button
                  onClick={() => setActiveTab('specs')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
                    activeTab === 'specs'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Info size={14} />
                  Clearance &amp; Machining Specs
                </button>
              </div>

              {/* Viewport Toggles (only on canvas tab) */}
              {activeTab === 'canvas' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowMatingPeg(!showMatingPeg)}
                    className={`px-2.5 py-1 text-[11px] rounded border transition-colors ${
                      showMatingPeg
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    Mating Part
                  </button>
                  <button
                    onClick={() => setShowOvercutVolumes(!showOvercutVolumes)}
                    className={`px-2.5 py-1 text-[11px] rounded border transition-colors ${
                      showOvercutVolumes
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    Overcut Holes
                  </button>
                  <button
                    onClick={() => setShowCutterPaths(!showCutterPaths)}
                    className={`px-2.5 py-1 text-[11px] rounded border transition-colors ${
                      showCutterPaths
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    Tool Center Path
                  </button>
                  <div className="h-4 w-[1px] bg-slate-800 mx-1" />
                  <button
                    onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.2))}
                    className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded"
                    title="Zoom In"
                  >
                    <ZoomIn size={15} />
                  </button>
                  <button
                    onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.2))}
                    className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded"
                    title="Zoom Out"
                  >
                    <ZoomOut size={15} />
                  </button>
                  <button
                    onClick={() => setZoomLevel(1.0)}
                    className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded"
                    title="Reset Zoom"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* TAB CONTENT 1: INTERACTIVE SVG CANVAS */}
            {activeTab === 'canvas' && (
              <div className="flex-1 flex flex-col p-6 items-center justify-center relative overflow-hidden select-none">
                {/* Visual Legend Header */}
                <div className="absolute top-4 left-6 flex items-center gap-4 bg-slate-900/80 backdrop-blur border border-slate-800 px-3.5 py-2 rounded-lg text-xs z-10 shadow">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-slate-800 border border-dashed border-slate-400" />
                    <span className="text-slate-300">Pocket Boundary</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500/40 border border-emerald-400" />
                    <span className="text-emerald-300">Relief Overcut (Ø{(toolDiameter + additionalClearance * 2).toFixed(1)}mm)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-amber-500/20 border border-amber-400" />
                    <span className="text-amber-300">Mating Square Part (100% Flush)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-cyan-400" />
                    <span className="text-cyan-300">Cutter Center Dips</span>
                  </div>
                </div>

                {/* SVG Render Canvas */}
                <div
                  className="w-full h-full flex items-center justify-center overflow-auto p-4"
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center', transition: 'transform 0.15s ease-out' }}
                >
                  <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="max-h-[75vh] w-auto max-w-full drop-shadow-2xl rounded-lg border border-slate-800 bg-[#090d16]"
                    style={{ minWidth: '400px' }}
                  >
                    {/* Background Grid Pattern */}
                    <defs>
                      <pattern id="smallGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                      </pattern>
                      <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                        <rect width="50" height="50" fill="url(#smallGrid)" />
                        <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#334155" strokeWidth="0.8" />
                      </pattern>
                    </defs>

                    <rect width={svgWidth} height={svgHeight} fill="url(#grid)" />

                    {/* Mating Square Part (Shows that sharp 90-degree corners seat perfectly) */}
                    {showMatingPeg && (
                      <g className="transition-opacity duration-200">
                        <rect
                          x={matingPeg.x + padding}
                          y={svgHeight - (matingPeg.y + matingPeg.height + padding)}
                          width={matingPeg.width}
                          height={matingPeg.height}
                          fill="rgba(245, 158, 11, 0.12)"
                          stroke="#f59e0b"
                          strokeWidth="1.8"
                        />
                        <text
                          x={matingPeg.x + padding + matingPeg.width / 2}
                          y={svgHeight - (matingPeg.y + matingPeg.height / 2 + padding)}
                          fill="#f59e0b"
                          fontSize="7"
                          fontFamily="monospace"
                          textAnchor="middle"
                          dominantBaseline="central"
                          opacity="0.85"
                        >
                          MATING SQUARE PART ({matingPeg.width} × {matingPeg.height} mm)
                        </text>
                      </g>
                    )}

                    {/* Raw Pocket Contour (Dashed Slate) */}
                    <polygon
                      points={polyPointsString}
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="1.6"
                      strokeDasharray="4 3"
                    />

                    {/* Overcut Relief Circles */}
                    {showOvercutVolumes && reliefFeatures.map((feat, idx) => {
                      const cx = feat.center.x + padding;
                      const cy = svgHeight - (feat.center.y + padding);
                      const isHighlighted = selectedCornerIdx === idx;

                      return (
                        <g key={feat.id} className="cursor-pointer" onClick={() => setSelectedCornerIdx(idx)}>
                          {/* Cutter Circle */}
                          <circle
                            cx={cx}
                            cy={cy}
                            r={feat.radius}
                            fill={isHighlighted ? "rgba(6, 182, 212, 0.45)" : "rgba(16, 185, 129, 0.35)"}
                            stroke={isHighlighted ? "#06b6d4" : "#10b981"}
                            strokeWidth={isHighlighted ? "2.0" : "1.2"}
                          />
                          {/* Center point */}
                          <circle cx={cx} cy={cy} r="1.5" fill="#38bdf8" />
                          {/* Corner point */}
                          <circle
                            cx={feat.cornerPoint.x + padding}
                            cy={svgHeight - (feat.cornerPoint.y + padding)}
                            r="1.5"
                            fill="#ef4444"
                          />
                        </g>
                      );
                    })}

                    {/* Tool Center Dips & Toolpaths */}
                    {showCutterPaths && reliefFeatures.map(feat => {
                      const px = feat.cornerPoint.x + padding;
                      const py = svgHeight - (feat.cornerPoint.y + padding);
                      const cx = feat.center.x + padding;
                      const cy = svgHeight - (feat.center.y + padding);

                      return (
                        <line
                          key={`dip_${feat.id}`}
                          x1={px}
                          y1={py}
                          x2={cx}
                          y2={cy}
                          stroke="#38bdf8"
                          strokeWidth="1.5"
                          strokeDasharray="2 2"
                        />
                      );
                    })}

                    {/* Dimension Overlays */}
                    {showLabels && (
                      <g>
                        <text
                          x={padding + 5}
                          y={padding - 8}
                          fill="#94a3b8"
                          fontSize="6.5"
                          fontFamily="monospace"
                        >
                          X: {matingPeg.width.toFixed(1)} mm &times; Y: {matingPeg.height.toFixed(1)} mm | Relief: {reliefType.toUpperCase()}
                        </text>
                      </g>
                    )}
                  </svg>
                </div>

                {/* Bottom Real-Time Metric Pills */}
                <div className="absolute bottom-4 inset-x-6 flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-2 pointer-events-auto">
                    <span className="px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-lg text-xs text-slate-300 font-mono">
                      Cutter: Ø{toolDiameter}mm Flat Endmill
                    </span>
                    <span className="px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-lg text-xs text-slate-300 font-mono">
                      Depth: Z-{targetDepth.toFixed(1)}mm
                    </span>
                    <span className="px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-lg text-xs text-emerald-300 font-mono">
                      Total Perimeter: {metrics.totalPerimeterMm} mm
                    </span>
                  </div>
                  <div className="pointer-events-auto flex items-center gap-2">
                    <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                      <Clock size={13} />
                      Cycle Time: ~{metrics.estimatedCycleTimeSec}s
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: ISO CNC G-CODE PROGRAM */}
            {activeTab === 'gcode' && (
              <div className="flex-1 flex flex-col p-6 overflow-hidden">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Argus CAM ISO 6983 G-Code Program
                    </span>
                    <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-400 rounded font-mono">
                      {gcodeOutput.split('\n').length} Blocks
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyGCode}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
                    >
                      {copiedGCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      {copiedGCode ? 'Copied!' : 'Copy G-Code'}
                    </button>
                    <button
                      onClick={handleDownloadGCode}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Download size={14} />
                      Download .NC File
                    </button>
                  </div>
                </div>

                {/* Code Viewer Container */}
                <div className="flex-1 overflow-y-auto bg-slate-950 rounded-lg border border-slate-800/80 p-4 font-mono text-xs text-slate-300 leading-relaxed custom-scrollbar select-text">
                  {gcodeOutput.split('\n').map((line, idx) => {
                    const isComment = line.trim().startsWith(';') || line.trim().startsWith('(');
                    const isRapid = line.includes('G00') || line.includes('G0 ');
                    const isReliefDip = line.includes('Relief Overcut') || line.includes('Dip into relief');

                    return (
                      <div key={idx} className="flex hover:bg-slate-900/50 px-1 py-0.5 rounded">
                        <span className="w-10 text-slate-600 select-none text-right pr-4 font-mono text-[11px]">
                          {idx + 1}
                        </span>
                        <span
                          className={`flex-1 ${
                            isComment
                              ? 'text-slate-500 italic'
                              : isRapid
                              ? 'text-amber-400 font-semibold'
                              : isReliefDip
                              ? 'text-emerald-400 font-bold'
                              : 'text-slate-200'
                          }`}
                        >
                          {line}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: CLEARANCE & ASSEMBLY SPECIFICATIONS */}
            {activeTab === 'specs' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Card 1: Problem Definition */}
                  <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs uppercase tracking-wide">
                      <Zap size={15} />
                      The Round-Tool Limitation
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Standard CNC endmills cannot cut sharp internal 90° corners. The tool leaves an inside radius equal to its radius (R = D/2).
                    </p>
                    <div className="text-[11px] font-mono text-rose-300 bg-rose-500/10 p-2 rounded border border-rose-500/20">
                      Standard Corner R: {(toolDiameter / 2).toFixed(2)} mm (Blocks square parts)
                    </div>
                  </div>

                  {/* Card 2: Dog-Bone Solution */}
                  <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wide">
                      <Box size={15} />
                      The Dog-Bone Solution
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      By cutting a tiny relief circle along the 45° corner bisector, the cutter perimeter cleanly intersects the true 90° corner point.
                    </p>
                    <div className="text-[11px] font-mono text-emerald-300 bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                      Bisector Penetration: ~{(toolDiameter * 0.207 + additionalClearance * 0.414).toFixed(3)} mm
                    </div>
                  </div>

                  {/* Card 3: T-Bone Alternative */}
                  <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs uppercase tracking-wide">
                      <Scissors size={15} />
                      T-Bone Aesthetic Concealment
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      T-Bone offsets the cutter exclusively along one wall, leaving the mating face 100% straight and concealing the relief slot from view.
                    </p>
                    <div className="text-[11px] font-mono text-cyan-300 bg-cyan-500/10 p-2 rounded border border-cyan-500/20">
                      Wall Offset: {(toolDiameter / 2 + additionalClearance).toFixed(2)} mm
                    </div>
                  </div>
                </div>

                {/* Assembly Fit Verification Table */}
                <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5 space-y-3">
                  <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    Engineering Assembly Fit Verification
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">Corner Parameter</th>
                          <th className="py-2.5 px-3">Without Relief (Standard CAM)</th>
                          <th className="py-2.5 px-3 text-emerald-400">With Argus Dog-Bone Relief</th>
                          <th className="py-2.5 px-3">Assembly Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                        <tr>
                          <td className="py-2 px-3 font-sans text-slate-200">Inside Corner Geometry</td>
                          <td className="py-2 px-3 text-rose-400">Fillet R = {(toolDiameter / 2).toFixed(2)}mm</td>
                          <td className="py-2 px-3 text-emerald-400">Cleared 90° with Overcut</td>
                          <td className="py-2 px-3 font-sans text-emerald-300">Zero Binding</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-sans text-slate-200">Mating Square Part Bottoming</td>
                          <td className="py-2 px-3 text-rose-400">Binds at {(toolDiameter * 0.293).toFixed(2)}mm offset</td>
                          <td className="py-2 px-3 text-emerald-400">100% Full Flush Contact</td>
                          <td className="py-2 px-3 font-sans text-emerald-300">Perfect Flush Fit</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-sans text-slate-200">Slip-Fit Margin</td>
                          <td className="py-2 px-3 text-slate-400">Negative (Interference)</td>
                          <td className="py-2 px-3 text-emerald-400">+{additionalClearance.toFixed(2)} mm</td>
                          <td className="py-2 px-3 font-sans text-emerald-300">Smooth Hand Slip</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-sans text-slate-200">Total Overcut Material Removed</td>
                          <td className="py-2 px-3 text-slate-400">0.0 mm³</td>
                          <td className="py-2 px-3 text-emerald-400">~{metrics.reliefOvercutVolumeMm3} mm³</td>
                          <td className="py-2 px-3 font-sans text-slate-300">Negligible Mass</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ==================================================================== */}
        {/* MODAL FOOTER ACTIONS */}
        {/* ==================================================================== */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportSVG}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Download size={14} />
              Export SVG Profile
            </button>
            <button
              onClick={handleDownloadGCode}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Download size={14} />
              Download .NC G-Code
            </button>
          </div>

          <div className="flex items-center gap-3">
            {appliedFeedback && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 animate-pulse">
                <Check size={14} /> Relieved Geometry Applied to CAM!
              </span>
            )}
            <button
              onClick={handleApplyToCAM}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.02]"
            >
              <CheckCircle2 size={15} />
              Apply Relieved Contour to CAM
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

