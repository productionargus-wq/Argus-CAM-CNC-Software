import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X, Maximize2, Minimize2, ZoomIn, ZoomOut, RefreshCw, Layers,
  Scissors, FileCode, Download, Copy, Check, Play, Settings,
  AlertTriangle, ShieldCheck, Box, Grid, ListFilter, Trash2,
  Plus, Info, Move, RotateCcw, Cpu, Clock, HardDrive, Printer,
  Sparkles, Sliders, CheckCircle2, ChevronRight, Eye
} from 'lucide-react';
import {
  SHEET_PRESETS,
  SHEET_MATERIALS,
  DEFAULT_SAMPLE_PARTS,
  runTrueShapeNesting,
  generateNestingGCode,
  exportNestingSVG,
  createPartFromCADWorkpiece
} from '../utils/nestingEngine.js';

export default function NestingStudioModal({
  isOpen,
  onClose,
  partMetrics = null,
  onAddOperation = null
}) {
  const dialogRef = useRef(null);
  const svgContainerRef = useRef(null);

  // Modal State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('canvas'); // 'canvas' | 'analytics' | 'gcode' | 'bom'
  const [copiedGCode, setCopiedGCode] = useState(false);
  const [appliedToCAM, setAppliedToCAM] = useState(false);

  // Sheet Stock Configuration
  const [selectedPresetKey, setSelectedPresetKey] = useState('SHEET_4X8');
  const [sheetWidth, setSheetWidth] = useState(2440.0);
  const [sheetHeight, setSheetHeight] = useState(1220.0);
  const [sheetThickness, setSheetThickness] = useState(6.35);
  const [selectedMaterialKey, setSelectedMaterialKey] = useState('AL_6061_T6');

  // Nesting Parameters
  const [kerf, setKerf] = useState(6.0); // 6mm endmill or kerf
  const [margin, setMargin] = useState(15.0); // border margin
  const [allowPartInPart, setAllowPartInPart] = useState(true);
  const [allowRotation, setAllowRotation] = useState(true);
  const [tabCount, setTabCount] = useState(2);
  const [tabWidth, setTabWidth] = useState(4.0);
  const [machineType, setMachineType] = useState('router'); // 'router' | 'laser'

  // Multi-Part Production Queue
  const [partsQueue, setPartsQueue] = useState(() => JSON.parse(JSON.stringify(DEFAULT_SAMPLE_PARTS)));
  const [hoveredPart, setHoveredPart] = useState(null);
  const [selectedPartInstance, setSelectedPartInstance] = useState(null);

  // Canvas Viewport Pan & Zoom
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Handle Sheet Preset Changes
  const handlePresetChange = (presetKey) => {
    setSelectedPresetKey(presetKey);
    const p = SHEET_PRESETS[presetKey];
    if (p) {
      setSheetWidth(p.width);
      setSheetHeight(p.height);
      setSheetThickness(p.standardThickness);
    }
  };

  // Synchronize Active CAD Model into Part Queue
  const handleSyncCADModel = () => {
    if (!partMetrics) return;
    const cadPart = createPartFromCADWorkpiece(partMetrics);
    setPartsQueue(prev => {
      const filtered = prev.filter(p => p.id !== 'ACTIVE_CAD_MODEL');
      return [cadPart, ...filtered];
    });
  };

  // Add Custom Rectangular Part to Queue
  const handleAddCustomPart = () => {
    const id = `CUSTOM_PART_${Date.now()}`;
    const newPart = {
      id,
      name: `Custom Plate ${partsQueue.length + 1}`,
      category: 'User Custom',
      width: 150.0,
      height: 100.0,
      polygon: [
        { x: 0, y: 0 },
        { x: 150, y: 0 },
        { x: 150, y: 100 },
        { x: 0, y: 100 }
      ],
      holes: [
        { type: 'circle', cx: 75, cy: 50, radius: 12.0 }
      ],
      quantity: 4,
      priority: 2,
      allowedRotations: [0, 90, 180, 270],
      color: '#06b6d4'
    };
    setPartsQueue(prev => [...prev, newPart]);
  };

  // Update Part Quantity
  const handleUpdateQty = (partId, delta) => {
    setPartsQueue(prev => prev.map(p => {
      if (p.id === partId) {
        return { ...p, quantity: Math.max(0, p.quantity + delta) };
      }
      return p;
    }));
  };

  // Remove Part from Queue
  const handleRemovePart = (partId) => {
    setPartsQueue(prev => prev.filter(p => p.id !== partId));
  };

  // Run Nesting Engine computation
  const nestingResult = useMemo(() => {
    if (!isOpen) return null;
    const sheetCfg = {
      name: SHEET_PRESETS[selectedPresetKey]?.name || 'Custom Sheet',
      width: sheetWidth,
      height: sheetHeight,
      thickness: sheetThickness,
      materialId: selectedMaterialKey
    };

    return runTrueShapeNesting(partsQueue, sheetCfg, {
      kerf,
      margin,
      allowPartInPart,
      tabCount,
      tabWidth,
      allowRotation
    });
  }, [
    isOpen,
    partsQueue,
    selectedPresetKey,
    sheetWidth,
    sheetHeight,
    sheetThickness,
    selectedMaterialKey,
    kerf,
    margin,
    allowPartInPart,
    tabCount,
    tabWidth,
    allowRotation
  ]);

  // Generate ISO G-Code from nesting results
  const gcodeOutput = useMemo(() => {
    if (!nestingResult) return '';
    return generateNestingGCode(nestingResult, machineType);
  }, [nestingResult, machineType]);

  // SVG String for Direct Export
  const svgOutput = useMemo(() => {
    if (!nestingResult) return '';
    return exportNestingSVG(nestingResult);
  }, [nestingResult]);

  // Copy G-Code to clipboard
  const handleCopyGCode = () => {
    if (!gcodeOutput) return;
    navigator.clipboard.writeText(gcodeOutput).then(() => {
      setCopiedGCode(true);
      setTimeout(() => setCopiedGCode(false), 2000);
    });
  };

  // Download G-Code as .NC file
  const handleDownloadGCode = () => {
    if (!gcodeOutput) return;
    const blob = new Blob([gcodeOutput], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Argus_Nesting_${selectedPresetKey}_${Date.now()}.nc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download SVG vector layout
  const handleDownloadSVG = () => {
    if (!svgOutput) return;
    const blob = new Blob([svgOutput], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Argus_Nesting_${selectedPresetKey}_${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Push Nesting Toolpaths to Main CAM Operations Tree
  const handleApplyToCAM = () => {
    if (!nestingResult || !onAddOperation) return;

    // Create 2D Sheet Profiling Operation
    const newOp = {
      id: `op_sheet_nesting_${Date.now()}`,
      name: `Sheet Nesting Profiling (${nestingResult.placedParts.length} Parts)`,
      type: 'Contour 2D / Sheet Profiling',
      tool: {
        id: 'T01_NESTING_ENDMILL',
        name: `${machineType === 'laser' ? 'Laser Kerf Nozzle' : '1-Flute Carbide Sheet Endmill'} D${kerf}mm`,
        diameter: kerf,
        type: machineType === 'laser' ? 'Laser Nozzle' : 'Flat Endmill',
        flutes: 1
      },
      wcs: 'G54',
      plane: 'Top (G17)',
      parameters: {
        totalParts: nestingResult.placedParts.length,
        sheetDimensions: `${sheetWidth} x ${sheetHeight} x ${sheetThickness} mm`,
        material: nestingResult.sheetConfig.material.name,
        utilization: `${nestingResult.metrics.utilizationPercent}%`,
        tabCount,
        tabWidth,
        feedrate: nestingResult.sheetConfig.material.cutFeedMmMin
      },
      time: nestingResult.metrics.estimatedCutTimeFormatted,
      isRegenerated: true,
      hasValidPath: true
    };

    onAddOperation(newOp);
    setAppliedToCAM(true);
    setTimeout(() => setAppliedToCAM(false), 2500);
  };

  // Canvas Pan Handlers
  const handleMouseDown = (e) => {
    if (e.button === 0 || e.button === 1) { // Left or Middle click to pan
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    setZoomLevel(prev => Math.max(0.2, Math.min(6.0, prev * zoomFactor)));
  };

  const handleResetZoom = () => {
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  // Keyboard shortcut ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const metrics = nestingResult?.metrics || {
    utilizationPercent: 0,
    totalPartsPlaced: 0,
    totalPartsRequested: 0,
    scrapPercent: 100,
    remnantPercent: 0,
    skeletonScrapPercent: 100,
    totalCutPerimeterM: 0,
    sheetWeightKg: 0,
    netPartsWeightKg: 0,
    estimatedCutTimeFormatted: '0s'
  };

  // Utilization color badge
  const getUtilBadgeStyle = (pct) => {
    if (pct >= 75) return { bg: 'rgba(16, 185, 129, 0.2)', text: '#10b981', border: '#10b981' };
    if (pct >= 55) return { bg: 'rgba(56, 189, 248, 0.2)', text: '#38bdf8', border: '#38bdf8' };
    if (pct >= 35) return { bg: 'rgba(245, 158, 11, 0.2)', text: '#f59e0b', border: '#f59e0b' };
    return { bg: 'rgba(244, 63, 94, 0.2)', text: '#f43f5e', border: '#f43f5e' };
  };
  const utilBadge = getUtilBadgeStyle(metrics.utilizationPercent);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(3, 7, 18, 0.88)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isFullscreen ? '0px' : '20px'
      }}
    >
      <div
        style={{
          width: isFullscreen ? '100vw' : '96vw',
          maxWidth: isFullscreen ? '100vw' : '1720px',
          height: isFullscreen ? '100vh' : '94vh',
          background: '#0d1527',
          borderRadius: isFullscreen ? '0px' : '14px',
          border: '1px solid #1e293b',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#e2e8f0'
        }}
      >
        {/* ================================================================== */}
        {/* MODAL HEADER */}
        {/* ================================================================== */}
        <div
          style={{
            height: '56px',
            borderBottom: '1px solid #1e293b',
            background: 'linear-gradient(90deg, #090f1d 0%, #0e172a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(2, 132, 199, 0.4)'
              }}
            >
              <Scissors size={20} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: 700, fontSize: '16px', letterSpacing: '0.3px', color: '#f8fafc' }}>
                  True-Shape CNC Sheet Nesting &amp; Multi-Part Studio
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    fontWeight: 600
                  }}
                >
                  2D / 2.5D Router &bull; Laser &bull; Waterjet
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Stock Sheet: {sheetWidth} &times; {sheetHeight} &times; {sheetThickness} mm &bull;{' '}
                {SHEET_MATERIALS[selectedMaterialKey]?.name}
              </div>
            </div>
          </div>

          {/* Center Utilization Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '6px 14px',
                borderRadius: '8px',
                background: utilBadge.bg,
                border: `1px solid ${utilBadge.border}`
              }}
            >
              <Sparkles size={16} color={utilBadge.text} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>
                  Sheet Utilization
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: utilBadge.text, lineHeight: 1.1 }}>
                  {metrics.utilizationPercent}%{' '}
                  <span style={{ fontSize: '11px', fontWeight: 500, color: '#cbd5e1' }}>
                    ({metrics.totalPartsPlaced} of {metrics.totalPartsRequested} nested)
                  </span>
                </div>
              </div>
            </div>

            {metrics.remnantPercent > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)'
                }}
              >
                <ShieldCheck size={16} color="#10b981" />
                <div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Reusable Remnant</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#10b981' }}>
                    {metrics.remnantPercent}% Recovered
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Header Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Restore standard window' : 'Full screen'}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px'
              }}
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button
              onClick={onClose}
              title="Close Nesting Studio (ESC)"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#f87171',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ================================================================== */}
        {/* MAIN BODY: 2-COLUMN SPLIT */}
        {/* ================================================================== */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* ================================================================ */}
          {/* LEFT SIDEBAR: STOCK & MULTI-PART PRODUCTION CONTROLS */}
          {/* ================================================================ */}
          <div
            style={{
              width: '390px',
              borderRight: '1px solid #1e293b',
              background: '#090f1d',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0
            }}
          >
            <div style={{ overflowY: 'auto', flex: 1, padding: '16px' }}>
              {/* SECTION 1: STOCK SHEET SPECIFICATIONS */}
              <div
                style={{
                  background: '#0e172a',
                  borderRadius: '10px',
                  padding: '14px',
                  border: '1px solid #1e293b',
                  marginBottom: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#38bdf8' }}>
                    <HardDrive size={15} />
                    Stock Sheet Bed Dimensions
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>W &times; H &times; T</span>
                </div>

                {/* Preset Dropdown */}
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Standard Stock Sheet Preset:
                  </label>
                  <select
                    value={selectedPresetKey}
                    onChange={(e) => handlePresetChange(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#0b1320',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#f8fafc',
                      padding: '7px 10px',
                      fontSize: '12px'
                    }}
                  >
                    {Object.entries(SHEET_PRESETS).map(([key, item]) => (
                      <option key={key} value={key}>
                        {item.name} &bull; {item.badge}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dimension Inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: '#94a3b8' }}>Width (X mm)</label>
                    <input
                      type="number"
                      value={sheetWidth}
                      onChange={(e) => {
                        setSheetWidth(parseFloat(e.target.value) || 0);
                        setSelectedPresetKey('SHEET_CUSTOM');
                      }}
                      style={{
                        width: '100%',
                        background: '#0b1320',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        padding: '6px 8px',
                        fontSize: '12px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#94a3b8' }}>Height (Y mm)</label>
                    <input
                      type="number"
                      value={sheetHeight}
                      onChange={(e) => {
                        setSheetHeight(parseFloat(e.target.value) || 0);
                        setSelectedPresetKey('SHEET_CUSTOM');
                      }}
                      style={{
                        width: '100%',
                        background: '#0b1320',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        padding: '6px 8px',
                        fontSize: '12px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#94a3b8' }}>Thick (Z mm)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={sheetThickness}
                      onChange={(e) => setSheetThickness(parseFloat(e.target.value) || 0)}
                      style={{
                        width: '100%',
                        background: '#0b1320',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        padding: '6px 8px',
                        fontSize: '12px'
                      }}
                    />
                  </div>
                </div>

                {/* Material Selection */}
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Sheet Material &amp; Cutting Target:
                  </label>
                  <select
                    value={selectedMaterialKey}
                    onChange={(e) => setSelectedMaterialKey(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#0b1320',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#f8fafc',
                      padding: '7px 10px',
                      fontSize: '12px'
                    }}
                  >
                    {Object.entries(SHEET_MATERIALS).map(([key, item]) => (
                      <option key={key} value={key}>
                        {item.name} &bull; {item.cutFeedMmMin} mm/min
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SECTION 2: MULTI-PART PRODUCTION QUEUE */}
              <div
                style={{
                  background: '#0e172a',
                  borderRadius: '10px',
                  padding: '14px',
                  border: '1px solid #1e293b',
                  marginBottom: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#10b981' }}>
                    <Box size={15} />
                    Multi-Part Production Queue
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      color: '#10b981',
                      background: 'rgba(16, 185, 129, 0.15)',
                      padding: '1px 6px',
                      borderRadius: '4px'
                    }}
                  >
                    {partsQueue.reduce((acc, p) => acc + (p.quantity || 0), 0)} Parts
                  </span>
                </div>

                {/* Queue Actions */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <button
                    onClick={handleSyncCADModel}
                    disabled={!partMetrics}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      background: partMetrics ? 'rgba(56, 189, 248, 0.15)' : 'rgba(51, 65, 85, 0.3)',
                      border: `1px solid ${partMetrics ? 'rgba(56, 189, 248, 0.4)' : '#334155'}`,
                      color: partMetrics ? '#38bdf8' : '#64748b',
                      borderRadius: '6px',
                      padding: '6px 8px',
                      fontSize: '11px',
                      cursor: partMetrics ? 'pointer' : 'not-allowed',
                      fontWeight: 600
                    }}
                  >
                    <Layers size={13} />
                    Sync Active CAD Solid
                  </button>
                  <button
                    onClick={handleAddCustomPart}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      color: '#10b981',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    <Plus size={13} />
                    Add Part
                  </button>
                </div>

                {/* Part Item Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '230px', overflowY: 'auto' }}>
                  {partsQueue.map((part) => (
                    <div
                      key={part.id}
                      style={{
                        background: '#090f1d',
                        borderRadius: '6px',
                        border: '1px solid #1e293b',
                        padding: '8px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '3px',
                            background: part.color || '#38bdf8',
                            flexShrink: 0
                          }}
                        />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {part.name}
                          </div>
                          <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                            {Math.round(part.width)} &times; {Math.round(part.height)} mm &bull; {part.holes?.length || 0} holes
                          </div>
                        </div>
                      </div>

                      {/* Quantity Stepper */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <button
                          onClick={() => handleUpdateQty(part.id, -1)}
                          style={{
                            width: '22px',
                            height: '22px',
                            background: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '4px',
                            color: '#e2e8f0',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          -
                        </button>
                        <span style={{ fontSize: '12px', fontWeight: 700, minWidth: '22px', textAlign: 'center' }}>
                          {part.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQty(part.id, 1)}
                          style={{
                            width: '22px',
                            height: '22px',
                            background: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '4px',
                            color: '#e2e8f0',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          +
                        </button>
                        <button
                          onClick={() => handleRemovePart(part.id)}
                          title="Remove part from queue"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#64748b',
                            cursor: 'pointer',
                            padding: '3px',
                            marginLeft: '4px'
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 3: NESTING CONSTRAINTS & TOOLING */}
              <div
                style={{
                  background: '#0e172a',
                  borderRadius: '10px',
                  padding: '14px',
                  border: '1px solid #1e293b'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#f59e0b', marginBottom: '10px' }}>
                  <Sliders size={15} />
                  Nesting Toolpath Parameters
                </div>

                {/* Cutter Kerf & Margin */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: '#94a3b8' }}>Cutter Kerf / Spacing</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        step="0.5"
                        value={kerf}
                        onChange={(e) => setKerf(Math.max(0.5, parseFloat(e.target.value) || 1.0))}
                        style={{
                          width: '100%',
                          background: '#0b1320',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          color: '#f8fafc',
                          padding: '6px 8px',
                          fontSize: '12px'
                        }}
                      />
                      <span style={{ fontSize: '11px', color: '#64748b' }}>mm</span>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#94a3b8' }}>Sheet Edge Margin</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        step="1"
                        value={margin}
                        onChange={(e) => setMargin(Math.max(0, parseFloat(e.target.value) || 0))}
                        style={{
                          width: '100%',
                          background: '#0b1320',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          color: '#f8fafc',
                          padding: '6px 8px',
                          fontSize: '12px'
                        }}
                      />
                      <span style={{ fontSize: '11px', color: '#64748b' }}>mm</span>
                    </div>
                  </div>
                </div>

                {/* Tabs & Part-In-Part Toggles */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={allowPartInPart}
                      onChange={(e) => setAllowPartInPart(e.target.checked)}
                      style={{ accentColor: '#10b981' }}
                    />
                    <span><strong>Part-in-Part Nesting:</strong> Pack small parts into large cutouts</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={allowRotation}
                      onChange={(e) => setAllowRotation(e.target.checked)}
                      style={{ accentColor: '#38bdf8' }}
                    />
                    <span><strong>True-Shape Rotation Search:</strong> Index at 0°, 90°, 180°, 270°</span>
                  </label>
                </div>

                {/* Tab Bridges Config */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: '#94a3b8' }}>Holding Tabs / Part</label>
                    <select
                      value={tabCount}
                      onChange={(e) => setTabCount(parseInt(e.target.value, 10))}
                      style={{
                        width: '100%',
                        background: '#0b1320',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        padding: '6px',
                        fontSize: '12px'
                      }}
                    >
                      <option value="0">None (Laser / Vac Bed)</option>
                      <option value="2">2 Tabs (Standard)</option>
                      <option value="4">4 Tabs (Secure)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#94a3b8' }}>Machine Mode</label>
                    <select
                      value={machineType}
                      onChange={(e) => setMachineType(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#0b1320',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        padding: '6px',
                        fontSize: '12px'
                      }}
                    >
                      <option value="router">CNC Router (Tabs)</option>
                      <option value="laser">Fiber Laser / Waterjet</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* CENTER & RIGHT: INTERACTIVE CANVAS & DIAGNOSTICS WORKSPACE */}
          {/* ================================================================ */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0b1320', overflow: 'hidden' }}>
            {/* Top Workspace Navigation Tabs */}
            <div
              style={{
                height: '42px',
                borderBottom: '1px solid #1e293b',
                background: '#090f1d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 16px',
                flexShrink: 0
              }}
            >
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setActiveTab('canvas')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: activeTab === 'canvas' ? '#1e293b' : 'transparent',
                    color: activeTab === 'canvas' ? '#38bdf8' : '#94a3b8',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Grid size={14} />
                  2D Sheet Visualizer
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: activeTab === 'analytics' ? '#1e293b' : 'transparent',
                    color: activeTab === 'analytics' ? '#10b981' : '#94a3b8',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Cpu size={14} />
                  Scrap &amp; Remnant Analytics
                </button>
                <button
                  onClick={() => setActiveTab('gcode')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: activeTab === 'gcode' ? '#1e293b' : 'transparent',
                    color: activeTab === 'gcode' ? '#f59e0b' : '#94a3b8',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <FileCode size={14} />
                  Nesting G-Code ({gcodeOutput ? gcodeOutput.split('\n').length : 0} lines)
                </button>
                <button
                  onClick={() => setActiveTab('bom')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: activeTab === 'bom' ? '#1e293b' : 'transparent',
                    color: activeTab === 'bom' ? '#a855f7' : '#94a3b8',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <ListFilter size={14} />
                  Schedule &amp; BOM
                </button>
              </div>

              {/* Viewport Zoom Controls */}
              {activeTab === 'canvas' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => setZoomLevel(prev => Math.min(6.0, prev * 1.25))}
                    title="Zoom in"
                    style={{ background: '#1e293b', border: 'none', color: '#cbd5e1', padding: '5px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    <ZoomIn size={14} />
                  </button>
                  <button
                    onClick={() => setZoomLevel(prev => Math.max(0.2, prev * 0.8))}
                    title="Zoom out"
                    style={{ background: '#1e293b', border: 'none', color: '#cbd5e1', padding: '5px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    <ZoomOut size={14} />
                  </button>
                  <button
                    onClick={handleResetZoom}
                    title="Fit to sheet"
                    style={{ background: '#1e293b', border: 'none', color: '#cbd5e1', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                  >
                    Fit {Math.round(zoomLevel * 100)}%
                  </button>
                </div>
              )}
            </div>

            {/* TAB CONTENT 1: INTERACTIVE 2D SHEET CANVAS */}
            {activeTab === 'canvas' && (
              <div
                ref={svgContainerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onWheel={handleWheel}
                style={{
                  flex: 1,
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: isPanning ? 'grabbing' : 'grab',
                  background: '#070c17',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {/* SVG Sheet Render */}
                <div
                  style={{
                    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                    transformOrigin: 'center center',
                    transition: isPanning ? 'none' : 'transform 0.08s ease-out',
                    userSelect: 'none'
                  }}
                >
                  <svg
                    width={`${Math.min(1300, sheetWidth * 0.55)}px`}
                    height={`${Math.min(700, sheetHeight * 0.55)}px`}
                    viewBox={`0 0 ${sheetWidth} ${sheetHeight}`}
                    style={{
                      border: '2px solid #3b82f6',
                      borderRadius: '6px',
                      background: '#0b1320',
                      boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
                    }}
                  >
                    <defs>
                      <pattern id="canvas-grid" width="100" height="100" patternUnits="userSpaceOnUse">
                        <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#17223b" strokeWidth="0.8" />
                      </pattern>
                    </defs>

                    {/* Spoilboard Grid */}
                    <rect x="0" y="0" width={sheetWidth} height={sheetHeight} fill="url(#canvas-grid)" />

                    {/* Margin Boundary Line */}
                    <rect
                      x={margin}
                      y={margin}
                      width={sheetWidth - margin * 2}
                      height={sheetHeight - margin * 2}
                      fill="none"
                      stroke="#475569"
                      strokeWidth="1.5"
                      strokeDasharray="8 6"
                    />

                    {/* Remnant Offcut Zone (Green Dashed) */}
                    {nestingResult?.remnantRect && (
                      <g>
                        <rect
                          x={nestingResult.remnantRect.x}
                          y={nestingResult.remnantRect.y}
                          width={nestingResult.remnantRect.width}
                          height={nestingResult.remnantRect.height}
                          fill="rgba(16, 185, 129, 0.12)"
                          stroke="#10b981"
                          strokeWidth="2.5"
                          strokeDasharray="10 6"
                        />
                        <text
                          x={nestingResult.remnantRect.x + 20}
                          y={nestingResult.remnantRect.y + 35}
                          fill="#10b981"
                          fontWeight="700"
                          fontSize="22"
                          letterSpacing="0.5px"
                        >
                          RECOVERED REMNANT: {Math.round(nestingResult.remnantRect.width)} &times; {Math.round(nestingResult.remnantRect.height)} mm
                        </text>
                      </g>
                    )}

                    {/* Nested Parts */}
                    {nestingResult?.placedParts.map((part, pIdx) => {
                      const isHovered = hoveredPart?.instanceId === part.instanceId;
                      const isSelected = selectedPartInstance?.instanceId === part.instanceId;
                      const ptsStr = part.polygon.map(p => `${p.x},${p.y}`).join(' ');

                      return (
                        <g
                          key={part.instanceId}
                          onMouseEnter={() => setHoveredPart(part)}
                          onMouseLeave={() => setHoveredPart(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPartInstance(part);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          {/* Outer Contour */}
                          <polygon
                            points={ptsStr}
                            fill={part.color || '#38bdf8'}
                            fillOpacity={isHovered ? 1.0 : 0.88}
                            stroke={isSelected ? '#ffffff' : (isHovered ? '#f8fafc' : '#1e293b')}
                            strokeWidth={isSelected ? 3.0 : (isHovered ? 2.0 : 1.2)}
                            strokeLinejoin="round"
                          />

                          {/* Inner Cavities / Holes */}
                          {part.holes?.map((hole, hIdx) => {
                            if (hole.type === 'circle') {
                              return (
                                <circle
                                  key={hIdx}
                                  cx={hole.cx}
                                  cy={hole.cy}
                                  r={hole.radius}
                                  fill="#0b1320"
                                  stroke="#f43f5e"
                                  strokeWidth="1.2"
                                />
                              );
                            } else if (hole.type === 'rect') {
                              return (
                                <rect
                                  key={hIdx}
                                  x={hole.x}
                                  y={hole.y}
                                  width={hole.width}
                                  height={hole.height}
                                  rx={hole.rx || 0}
                                  fill="#0b1320"
                                  stroke="#f43f5e"
                                  strokeWidth="1.2"
                                />
                              );
                            }
                            return null;
                          })}

                          {/* Holding Tabs */}
                          {part.tabs?.map((t, tIdx) => (
                            <circle
                              key={tIdx}
                              cx={t.x}
                              cy={t.y}
                              r={3.5}
                              fill="#f59e0b"
                              stroke="#d97706"
                              strokeWidth="1.0"
                            />
                          ))}

                          {/* Part Label */}
                          <text
                            x={part.x + part.width / 2}
                            y={part.y + part.height / 2}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="#ffffff"
                            fontSize="13"
                            fontWeight="700"
                            pointerEvents="none"
                            filter="drop-shadow(0 1px 2px rgba(0,0,0,0.9))"
                          >
                            P{pIdx + 1}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Hover / Selected Part Floating Inspector Card */}
                {(hoveredPart || selectedPartInstance) && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      background: 'rgba(15, 23, 42, 0.95)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      fontSize: '12px',
                      color: '#f8fafc',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                      pointerEvents: 'none',
                      minWidth: '220px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <div
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '2px',
                          background: (hoveredPart || selectedPartInstance).color
                        }}
                      />
                      <strong style={{ fontSize: '13px' }}>
                        {(hoveredPart || selectedPartInstance).name}
                      </strong>
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div>Envelope: {Math.round((hoveredPart || selectedPartInstance).width)} &times; {Math.round((hoveredPart || selectedPartInstance).height)} mm</div>
                      <div>Sheet Position: X {(hoveredPart || selectedPartInstance).x.toFixed(1)}, Y {(hoveredPart || selectedPartInstance).y.toFixed(1)} mm</div>
                      <div>Rotation Applied: {(hoveredPart || selectedPartInstance).rotation}&deg;</div>
                      <div>Holding Tabs: {(hoveredPart || selectedPartInstance).tabs?.length || 0} bridges</div>
                      <div>Perimeter Cut: {Math.round((hoveredPart || selectedPartInstance).cutPerimeter)} mm</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 2: ANALYTICS & SCRAP BREAKDOWN */}
            {activeTab === 'analytics' && (
              <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ background: '#0e172a', padding: '16px', borderRadius: '10px', border: '1px solid #1e293b' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Sheet Utilization</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
                      {metrics.utilizationPercent}%
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                      Net parts: {(metrics.totalPartAreaMm2 / 1000000).toFixed(3)} m&sup2;
                    </div>
                  </div>

                  <div style={{ background: '#0e172a', padding: '16px', borderRadius: '10px', border: '1px solid #1e293b' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Reusable Remnant</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                      {metrics.remnantPercent}%
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                      Remnant area: {(metrics.remnantAreaMm2 / 1000000).toFixed(3)} m&sup2;
                    </div>
                  </div>

                  <div style={{ background: '#0e172a', padding: '16px', borderRadius: '10px', border: '1px solid #1e293b' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Skeleton Scrap</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#f43f5e', marginTop: '4px' }}>
                      {metrics.skeletonScrapPercent}%
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                      Unrecoverable offcut skeleton
                    </div>
                  </div>

                  <div style={{ background: '#0e172a', padding: '16px', borderRadius: '10px', border: '1px solid #1e293b' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Estimated Cut Cycle</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
                      {metrics.estimatedCutTimeFormatted}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                      Total cut length: {metrics.totalCutPerimeterM} m
                    </div>
                  </div>
                </div>

                {/* Material Weight & Cost Analysis */}
                <div style={{ background: '#0e172a', borderRadius: '10px', padding: '20px', border: '1px solid #1e293b', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <HardDrive size={16} color="#38bdf8" />
                    Material Consumption &amp; Stock Weight Analytics
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>Total Raw Sheet Weight:</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0', marginTop: '2px' }}>
                        {metrics.sheetWeightKg} kg
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Based on {SHEET_MATERIALS[selectedMaterialKey]?.densityGcm3} g/cm&sup3; density
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>Finished Net Parts Weight:</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>
                        {metrics.netPartsWeightKg} kg
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Yield of sellable precision components</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>Scrap / Skeleton Loss:</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#f43f5e', marginTop: '2px' }}>
                        {metrics.scrapWeightKg} kg
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Recyclable chip and skeleton remnants</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: G-CODE PREVIEW */}
            {activeTab === 'gcode' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#090f1d' }}>
                <div style={{ padding: '10px 16px', background: '#0e172a', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Production Ready ISO G-Code &bull; Lead-In Arcs &bull; Holding Tab Micro-Joints
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={handleCopyGCode}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: copiedGCode ? '#10b981' : '#1e293b',
                        border: '1px solid #334155',
                        color: '#ffffff',
                        padding: '5px 12px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {copiedGCode ? <Check size={13} /> : <Copy size={13} />}
                      {copiedGCode ? 'Copied!' : 'Copy Code'}
                    </button>
                    <button
                      onClick={handleDownloadGCode}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#0284c7',
                        border: 'none',
                        color: '#ffffff',
                        padding: '5px 12px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <Download size={13} />
                      Download .NC
                    </button>
                  </div>
                </div>
                <textarea
                  readOnly
                  value={gcodeOutput}
                  style={{
                    flex: 1,
                    width: '100%',
                    background: '#070c17',
                    border: 'none',
                    color: '#38bdf8',
                    fontFamily: 'Consolas, Monaco, monospace',
                    fontSize: '12px',
                    lineHeight: '1.6',
                    padding: '16px',
                    resize: 'none',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            )}

            {/* TAB CONTENT 4: BOM & PRODUCTION SCHEDULE */}
            {activeTab === 'bom' && (
              <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: '#e2e8f0' }}>
                  <thead>
                    <tr style={{ background: '#0e172a', borderBottom: '1px solid #334155', textAlign: 'left' }}>
                      <th style={{ padding: '10px 12px' }}>Color</th>
                      <th style={{ padding: '10px 12px' }}>Part Name</th>
                      <th style={{ padding: '10px 12px' }}>Dimensions</th>
                      <th style={{ padding: '10px 12px' }}>Qty Req</th>
                      <th style={{ padding: '10px 12px' }}>Qty Nested</th>
                      <th style={{ padding: '10px 12px' }}>Priority</th>
                      <th style={{ padding: '10px 12px' }}>Holding Tabs</th>
                      <th style={{ padding: '10px 12px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partsQueue.map(p => {
                      const nestedCount = nestingResult?.placedParts.filter(placed => placed.partId === p.id).length || 0;
                      const isComplete = nestedCount >= p.quantity;

                      return (
                        <tr key={p.id} style={{ borderBottom: '1px solid #1e293b' }}>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: p.color }} />
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 600 }}>{p.name}</td>
                          <td style={{ padding: '10px 12px', color: '#94a3b8' }}>
                            {Math.round(p.width)} &times; {Math.round(p.height)} mm
                          </td>
                          <td style={{ padding: '10px 12px' }}>{p.quantity}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: isComplete ? '#10b981' : '#f59e0b' }}>
                            {nestedCount}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: '#1e293b' }}>
                              Priority {p.priority}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px' }}>{tabCount} tabs</td>
                          <td style={{ padding: '10px 12px' }}>
                            {isComplete ? (
                              <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle2 size={13} /> 100% Nested
                              </span>
                            ) : (
                              <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <AlertTriangle size={13} /> Partial ({nestedCount}/{p.quantity})
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bottom Status & Metrics Strip */}
            <div
              style={{
                height: '40px',
                borderTop: '1px solid #1e293b',
                background: '#090f1d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 16px',
                fontSize: '11px',
                color: '#94a3b8',
                flexShrink: 0
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span>Bed Area: {((sheetWidth * sheetHeight) / 1000000).toFixed(2)} m&sup2;</span>
                <span>Cut Feed: {SHEET_MATERIALS[selectedMaterialKey]?.cutFeedMmMin} mm/min</span>
                <span>Kerf Spacing: {kerf} mm</span>
                <span>Border Margin: {margin} mm</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={13} color="#f59e0b" />
                <span>Estimated Cycle: <strong>{metrics.estimatedCutTimeFormatted}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* FOOTER ACTION BAR */}
        {/* ================================================================== */}
        <div
          style={{
            height: '56px',
            borderTop: '1px solid #1e293b',
            background: '#090f1d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleDownloadSVG}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#e2e8f0',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Printer size={14} />
              Export SVG Vector
            </button>
            <button
              onClick={handleDownloadGCode}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#e2e8f0',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Download size={14} />
              Download .NC G-Code
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleApplyToCAM}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: appliedToCAM ? '#10b981' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                border: 'none',
                color: '#ffffff',
                padding: '8px 18px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(2, 132, 199, 0.4)'
              }}
            >
              {appliedToCAM ? <Check size={14} /> : <Play size={14} />}
              {appliedToCAM ? 'Toolpath Sent to CAM!' : 'Apply Nested Toolpaths to CAM'}
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid #334155',
                color: '#cbd5e1',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
