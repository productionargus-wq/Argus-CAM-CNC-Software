import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  X, Maximize2, Minimize2, RefreshCw, FileCode, Download, Copy, Check,
  Play, Settings, AlertTriangle, ShieldCheck, Box, Grid, ListFilter,
  Info, RotateCcw, Cpu, Clock, Sparkles, Sliders, CheckCircle2,
  Wrench, Disc, Crosshair, ChevronRight, Eye, Type, Compass,
  Hash, Calendar, Layers, Printer
} from 'lucide-react';
import {
  ENGRAVING_TOOLS,
  generateEngravingToolpath,
  generateEngravingGCode,
  exportEngravingSVG,
  expandTextTemplate
} from '../utils/engravingEngine.js';

export default function EngravingStudioModal({
  isOpen,
  onClose,
  model = null,
  partMetrics = null,
  onAddOperation = null
}) {
  const dialogRef = useRef(null);
  const mountRef = useRef(null);

  // Modal State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('3d'); // '3d' | '2d' | 'gcode'
  const [copiedGCode, setCopiedGCode] = useState(false);
  const [appliedToCAM, setAppliedToCAM] = useState(false);

  // Three.js References
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const animFrameRef = useRef(null);
  const textGroupRef = useRef(null);

  // Engraving Parameters
  const [rawText, setRawText] = useState('ARGUS-CAM-{SERIAL}');
  const [textHeight, setTextHeight] = useState(8.0);
  const [targetDepth, setTargetDepth] = useState(0.35);
  const [originX, setOriginX] = useState(0.0);
  const [originY, setOriginY] = useState(0.0);
  const [layoutMode, setLayoutMode] = useState('linear'); // 'linear' | 'arc'
  const [arcRadius, setArcRadius] = useState(40.0);
  const [arcStartAngleDeg, setArcStartAngleDeg] = useState(90.0);
  const [alignment, setAlignment] = useState('center'); // 'left' | 'center' | 'right'
  const [tracking, setTracking] = useState(1.15);
  const [vCarve3D, setVCarve3D] = useState(true);

  // Tool Selection
  const [selectedToolId, setSelectedToolId] = useState('TOOL_V60_D6');
  const [spindleRpm, setSpindleRpm] = useState(16000);
  const [cutFeedMmMin, setCutFeedMmMin] = useState(1200);

  // Serial Number State
  const [currentSerial, setCurrentSerial] = useState(1);
  const [serialPadding, setSerialPadding] = useState(4);
  const [autoIncrement, setAutoIncrement] = useState(true);

  // Active Tool Definition
  const activeTool = useMemo(() => {
    const t = ENGRAVING_TOOLS.find(tool => tool.id === selectedToolId) || ENGRAVING_TOOLS[0];
    return {
      ...t,
      spindleRpm: t.type === 'Diamond Drag Scribe' ? 0 : spindleRpm,
      feedMmMin: cutFeedMmMin
    };
  }, [selectedToolId, spindleRpm, cutFeedMmMin]);

  // Insert token at cursor
  const handleInsertToken = (token) => {
    setRawText(prev => `${prev}${token}`);
  };

  // Generate Toolpath Result
  const toolpathResult = useMemo(() => {
    if (!isOpen) return null;

    return generateEngravingToolpath(rawText, {
      textHeight,
      targetDepth,
      originX,
      originY,
      layoutMode,
      arcRadius,
      arcStartAngleDeg,
      alignment,
      tracking,
      vCarve3D,
      tool: activeTool,
      serialContext: {
        serial: currentSerial,
        serialPadding,
        partId: partMetrics?.name || 'DMU50_PART'
      }
    });
  }, [
    isOpen,
    rawText,
    textHeight,
    targetDepth,
    originX,
    originY,
    layoutMode,
    arcRadius,
    arcStartAngleDeg,
    alignment,
    tracking,
    vCarve3D,
    activeTool,
    currentSerial,
    serialPadding,
    partMetrics
  ]);

  // Generate ISO G-Code
  const gcodeOutput = useMemo(() => {
    if (!toolpathResult) return '';
    return generateEngravingGCode(toolpathResult);
  }, [toolpathResult]);

  // Generate SVG Vector Output
  const svgOutput = useMemo(() => {
    if (!toolpathResult) return '';
    return exportEngravingSVG(toolpathResult);
  }, [toolpathResult]);

  // --------------------------------------------------------------------------
  // THREE.JS 3D VIEWPORT INITIALIZATION
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen || !mountRef.current) return;

    const width = mountRef.current.clientWidth || 700;
    const height = mountRef.current.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#070c17');
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 45, 65);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight1.position.set(30, 50, 30);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa855f7, 0.8);
    dirLight2.position.set(-30, -30, -30);
    scene.add(dirLight2);

    // Top Workpiece Surface Bed
    const plateWidth = partMetrics?.dx ? Math.max(80, partMetrics.dx) : 100;
    const plateHeight = partMetrics?.dy ? Math.max(60, partMetrics.dy) : 80;
    const plateGeo = new THREE.BoxGeometry(plateWidth, 4, plateHeight);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.8
    });
    const plateMesh = new THREE.Mesh(plateGeo, plateMat);
    plateMesh.position.y = -2;
    scene.add(plateMesh);

    // Coordinate Grid on Top Face
    const grid = new THREE.GridHelper(Math.max(plateWidth, plateHeight), 20, 0x38bdf8, 0x334155);
    grid.position.y = 0.02;
    scene.add(grid);

    // Text Strokes Group
    const tg = new THREE.Group();
    scene.add(tg);
    textGroupRef.current = tg;

    // Animation Loop
    let isRunning = true;
    const animate = () => {
      if (!isRunning) return;
      controls.update();
      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (mountRef.current) mountRef.current.innerHTML = '';
    };
  }, [isOpen, partMetrics]);

  // Update 3D Strokes
  useEffect(() => {
    if (!textGroupRef.current || !toolpathResult || !toolpathResult.strokes) return;
    const group = textGroupRef.current;

    // Clear previous strokes
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    }

    // Render Each Vector Stroke
    toolpathResult.strokes.forEach((stroke) => {
      if (stroke.length < 2) return;

      const vecs = stroke.map(pt => new THREE.Vector3(pt.x, pt.z + 0.1, -pt.y)); // Map CNC Y to -Z in Three.js
      const geo = new THREE.BufferGeometry().setFromPoints(vecs);
      const mat = new THREE.LineBasicMaterial({
        color: vCarve3D ? 0xa855f7 : 0x38bdf8,
        linewidth: vCarve3D ? 3.0 : 2.0
      });
      const line = new THREE.Line(geo, mat);
      group.add(line);
    });

    // Render Rapid Jumps in Translucent Red
    const rapidVecs = (toolpathResult.points || []).map(pt => new THREE.Vector3(pt.x, pt.z + 0.1, -pt.y));
    if (rapidVecs.length > 1) {
      const rGeo = new THREE.BufferGeometry().setFromPoints(rapidVecs);
      const rMat = new THREE.LineDashedMaterial({
        color: 0xf43f5e,
        dashSize: 1.0,
        gapSize: 0.6,
        transparent: true,
        opacity: 0.3
      });
      const rLine = new THREE.Line(rGeo, rMat);
      rLine.computeLineDistances();
      group.add(rLine);
    }
  }, [toolpathResult, vCarve3D]);

  // Copy G-Code
  const handleCopyGCode = () => {
    if (!gcodeOutput) return;
    navigator.clipboard.writeText(gcodeOutput).then(() => {
      setCopiedGCode(true);
      setTimeout(() => setCopiedGCode(false), 2000);
    });
  };

  // Download G-Code
  const handleDownloadGCode = () => {
    if (!gcodeOutput) return;
    const blob = new Blob([gcodeOutput], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Argus_Engraving_${String(toolpathResult?.text || 'Engrave').replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.nc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download SVG
  const handleDownloadSVG = () => {
    if (!svgOutput) return;
    const blob = new Blob([svgOutput], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Argus_Engraving_${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Apply to CAM Operations Tree
  const handleApplyToCAM = () => {
    if (!toolpathResult || !onAddOperation) return;

    const newOp = {
      id: `op_engrave_${Date.now()}`,
      name: `${vCarve3D ? '3D V-Carve' : 'Engrave'} "${toolpathResult.text}" (Z-${targetDepth}mm)`,
      type: vCarve3D ? '3D V-Carve Prism' : 'Single-Line Engraving / Marking',
      tool: {
        id: activeTool.id,
        name: activeTool.name,
        diameter: activeTool.diameter,
        type: activeTool.type,
        flutes: activeTool.flutes
      },
      wcs: 'G54',
      plane: 'Top (G17)',
      parameters: {
        text: toolpathResult.text,
        textHeight: `${textHeight}mm`,
        targetDepth: `-${targetDepth}mm`,
        layoutMode,
        vCarve3D: vCarve3D ? 'Yes (Variable Z Depth)' : 'No (Constant Trace)',
        spindleRpm: activeTool.spindleRpm,
        feedrate: activeTool.feedMmMin,
        strokes: toolpathResult.metrics.totalStrokes
      },
      time: toolpathResult.metrics.estimatedCycleTimeFormatted,
      isRegenerated: true,
      hasValidPath: true
    };

    onAddOperation(newOp);
    if (autoIncrement) {
      setCurrentSerial(prev => prev + 1);
    }
    setAppliedToCAM(true);
    setTimeout(() => setAppliedToCAM(false), 2500);
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

  const metrics = toolpathResult?.metrics || {
    totalStrokes: 0,
    totalPoints: 0,
    totalCutDistanceMm: 0,
    totalRapidDistanceMm: 0,
    estimatedCycleTimeFormatted: '0m 00s'
  };

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
          maxWidth: isFullscreen ? '100vw' : '1680px',
          height: isFullscreen ? '100vh' : '92vh',
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
        {/* HEADER */}
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
                background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)'
              }}
            >
              <Type size={20} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: 700, fontSize: '16px', letterSpacing: '0.3px', color: '#f8fafc' }}>
                  CNC 2.5D &amp; 3D Engraving &amp; V-Carve Studio
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: 'rgba(6, 182, 212, 0.15)',
                    color: '#22d3ee',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    fontWeight: 600
                  }}
                >
                  {vCarve3D ? '3D V-Carve Prism' : 'Single-Line Stick Trace'}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Active Text: "{toolpathResult?.text}" &bull; {metrics.totalStrokes} Vector Strokes &bull; Height: {textHeight} mm &bull; Tool: {activeTool.name}
              </div>
            </div>
          </div>

          {/* Center Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                background: 'rgba(168, 85, 247, 0.12)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Sparkles size={15} color="#c084fc" />
              <div>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8' }}>Stroke Count</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#c084fc' }}>
                  {metrics.totalStrokes} Strokes ({toolpathResult?.charCount} Chars)
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Clock size={15} color="#10b981" />
              <div>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8' }}>Est. Cycle Time</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#10b981' }}>
                  {metrics.estimatedCycleTimeFormatted}
                </div>
              </div>
            </div>
          </div>

          {/* Right Header Buttons */}
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
              title="Close Engraving Studio (ESC)"
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
          {/* LEFT SIDEBAR: TEXT & TYPOGRAPHY PARAMETERS */}
          {/* ================================================================ */}
          <div
            style={{
              width: '410px',
              borderRight: '1px solid #1e293b',
              background: '#090f1d',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0
            }}
          >
            <div style={{ overflowY: 'auto', flex: 1, padding: '16px' }}>
              {/* SECTION 1: TEXT STRING & DYNAMIC TOKENS */}
              <div
                style={{
                  background: '#0e172a',
                  borderRadius: '10px',
                  padding: '14px',
                  border: '1px solid #1e293b',
                  marginBottom: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#38bdf8' }}>
                    <Type size={15} />
                    Engraving Text Template
                  </div>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>UPPERCASE STICK</span>
                </div>

                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Enter text or {SERIAL} token..."
                  rows={2}
                  style={{
                    width: '100%',
                    background: '#0b1320',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: '#f8fafc',
                    padding: '8px 10px',
                    fontSize: '13px',
                    fontWeight: 600,
                    fontFamily: 'Consolas, monospace',
                    resize: 'none',
                    boxSizing: 'border-box',
                    marginBottom: '8px'
                  }}
                />

                {/* Token Quick Insertion Buttons */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                  <button
                    onClick={() => handleInsertToken('{SERIAL}')}
                    style={{ background: '#1e293b', border: '1px solid #334155', color: '#c084fc', padding: '3px 7px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    +{'{SERIAL}'}
                  </button>
                  <button
                    onClick={() => handleInsertToken('{DATE}')}
                    style={{ background: '#1e293b', border: '1px solid #334155', color: '#38bdf8', padding: '3px 7px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    +{'{DATE}'}
                  </button>
                  <button
                    onClick={() => handleInsertToken('{TIME}')}
                    style={{ background: '#1e293b', border: '1px solid #334155', color: '#10b981', padding: '3px 7px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    +{'{TIME}'}
                  </button>
                  <button
                    onClick={() => handleInsertToken('{PART_ID}')}
                    style={{ background: '#1e293b', border: '1px solid #334155', color: '#f59e0b', padding: '3px 7px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    +{'{PART_ID}'}
                  </button>
                </div>

                {/* Serial Number Stepper */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: '#94a3b8' }}>Current Serial Number</label>
                    <input
                      type="number"
                      value={currentSerial}
                      onChange={(e) => setCurrentSerial(parseInt(e.target.value, 10) || 1)}
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
                    <label style={{ fontSize: '10px', color: '#94a3b8' }}>Zero Padding Digits</label>
                    <select
                      value={serialPadding}
                      onChange={(e) => setSerialPadding(parseInt(e.target.value, 10))}
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
                      <option value="2">2 Digits (01)</option>
                      <option value="3">3 Digits (001)</option>
                      <option value="4">4 Digits (0001)</option>
                      <option value="5">5 Digits (00001)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: TYPOGRAPHY & LAYOUT GEOMETRY */}
              <div
                style={{
                  background: '#0e172a',
                  borderRadius: '10px',
                  padding: '14px',
                  border: '1px solid #1e293b',
                  marginBottom: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#10b981', marginBottom: '12px' }}>
                  <Sliders size={15} />
                  Typography &amp; Placement
                </div>

                {/* Layout Mode */}
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Text Placement Mode:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      onClick={() => setLayoutMode('linear')}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        background: layoutMode === 'linear' ? '#1e293b' : '#0b1320',
                        border: `1px solid ${layoutMode === 'linear' ? '#10b981' : '#334155'}`,
                        color: layoutMode === 'linear' ? '#10b981' : '#94a3b8',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Linear Horizontal
                    </button>
                    <button
                      onClick={() => setLayoutMode('arc')}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        background: layoutMode === 'arc' ? '#1e293b' : '#0b1320',
                        border: `1px solid ${layoutMode === 'arc' ? '#10b981' : '#334155'}`,
                        color: layoutMode === 'arc' ? '#10b981' : '#94a3b8',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Circular Arc Dial
                    </button>
                  </div>
                </div>

                {/* Dimensions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: '#94a3b8' }}>Text Height (mm)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={textHeight}
                      onChange={(e) => setTextHeight(Math.max(1.0, parseFloat(e.target.value) || 1.0))}
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
                    <label style={{ fontSize: '10px', color: '#94a3b8' }}>Engrave Depth (mm)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={targetDepth}
                      onChange={(e) => setTargetDepth(Math.max(0.05, parseFloat(e.target.value) || 0.1))}
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

                {/* Origin XY or Arc Radius */}
                {layoutMode === 'linear' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ fontSize: '10px', color: '#94a3b8' }}>Origin X (mm)</label>
                      <input
                        type="number"
                        step="1"
                        value={originX}
                        onChange={(e) => setOriginX(parseFloat(e.target.value) || 0)}
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
                      <label style={{ fontSize: '10px', color: '#94a3b8' }}>Origin Y (mm)</label>
                      <input
                        type="number"
                        step="1"
                        value={originY}
                        onChange={(e) => setOriginY(parseFloat(e.target.value) || 0)}
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
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ fontSize: '10px', color: '#94a3b8' }}>Arc Radius (mm)</label>
                      <input
                        type="number"
                        step="1"
                        value={arcRadius}
                        onChange={(e) => setArcRadius(Math.max(5.0, parseFloat(e.target.value) || 10))}
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
                      <label style={{ fontSize: '10px', color: '#94a3b8' }}>Arc Center Angle (&deg;)</label>
                      <input
                        type="number"
                        step="5"
                        value={arcStartAngleDeg}
                        onChange={(e) => setArcStartAngleDeg(parseFloat(e.target.value) || 90)}
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
                )}

                {/* Alignment */}
                <div>
                  <label style={{ fontSize: '10px', color: '#94a3b8' }}>Text Alignment</label>
                  <select
                    value={alignment}
                    onChange={(e) => setAlignment(e.target.value)}
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
                    <option value="center">Center Justified</option>
                    <option value="left">Left Aligned</option>
                    <option value="right">Right Aligned</option>
                  </select>
                </div>
              </div>

              {/* SECTION 3: TOOLING & 3D V-CARVE BEVEL */}
              <div
                style={{
                  background: '#0e172a',
                  borderRadius: '10px',
                  padding: '14px',
                  border: '1px solid #1e293b'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#f59e0b', marginBottom: '12px' }}>
                  <Wrench size={15} />
                  Tooling &amp; V-Bit Strategy
                </div>

                {/* Tool Selector */}
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Assigned Engraving Tool:
                  </label>
                  <select
                    value={selectedToolId}
                    onChange={(e) => setSelectedToolId(e.target.value)}
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
                    {ENGRAVING_TOOLS.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} &bull; {t.angleDeg}&deg;
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3D V-Carve Toggle */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={vCarve3D}
                      onChange={(e) => setVCarve3D(e.target.checked)}
                      style={{ accentColor: '#a855f7' }}
                    />
                    <span><strong>True 3D V-Carve Prism:</strong> Dynamically vary Z depth along strokes for crisp beveled corners</span>
                  </label>
                </div>

                {/* Speeds & Feeds */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: '#94a3b8' }}>Spindle RPM</label>
                    <input
                      type="number"
                      step="1000"
                      disabled={activeTool.type === 'Diamond Drag Scribe'}
                      value={spindleRpm}
                      onChange={(e) => setSpindleRpm(parseInt(e.target.value, 10) || 10000)}
                      style={{
                        width: '100%',
                        background: '#0b1320',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: activeTool.type === 'Diamond Drag Scribe' ? '#64748b' : '#f8fafc',
                        padding: '6px 8px',
                        fontSize: '12px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#94a3b8' }}>Cut Feed (mm/min)</label>
                    <input
                      type="number"
                      step="50"
                      value={cutFeedMmMin}
                      onChange={(e) => setCutFeedMmMin(parseInt(e.target.value, 10) || 500)}
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
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* CENTER & RIGHT WORKSPACE */}
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
                  onClick={() => setActiveTab('3d')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: activeTab === '3d' ? '#1e293b' : 'transparent',
                    color: activeTab === '3d' ? '#38bdf8' : '#94a3b8',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Eye size={14} />
                  3D Part Engraving Backplot
                </button>
                <button
                  onClick={() => setActiveTab('2d')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: activeTab === '2d' ? '#1e293b' : 'transparent',
                    color: activeTab === '2d' ? '#10b981' : '#94a3b8',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Grid size={14} />
                  2D Typography Vector Strokes
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
                  NC G-Code ({gcodeOutput ? gcodeOutput.split('\n').length : 0} lines)
                </button>
              </div>

              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Rotate: Left Drag | Pan: Right Drag | Zoom: Scroll
              </div>
            </div>

            {/* TAB CONTENT 1: 3D VIEWPORT */}
            {activeTab === '3d' && (
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

                {/* Floating HUD */}
                <div
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: 'rgba(15, 23, 42, 0.92)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    fontSize: '11px',
                    color: '#f8fafc',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    pointerEvents: 'none',
                    minWidth: '220px'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '12px', color: '#38bdf8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Cpu size={14} />
                    Engraving Metrics
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: '#94a3b8' }}>
                    <div>Text: <strong style={{ color: '#e2e8f0' }}>"{toolpathResult?.text}"</strong></div>
                    <div>Strokes: <strong style={{ color: '#c084fc' }}>{metrics.totalStrokes} paths</strong></div>
                    <div>Cut Distance: <strong style={{ color: '#e2e8f0' }}>{metrics.totalCutDistanceMm} mm</strong></div>
                    <div>Rapid Travel: <strong style={{ color: '#e2e8f0' }}>{metrics.totalRapidDistanceMm} mm</strong></div>
                    <div>Depth Range: <strong style={{ color: '#10b981' }}>Z-{targetDepth} mm {vCarve3D ? '(3D Prism)' : ''}</strong></div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: 2D VECTOR STROKE CANVAS */}
            {activeTab === '2d' && (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#070c17',
                  padding: '20px'
                }}
              >
                <div
                  dangerouslySetInnerHTML={{ __html: svgOutput }}
                  style={{
                    maxWidth: '90%',
                    maxHeight: '90%',
                    boxShadow: '0 15px 40px rgba(0,0,0,0.7)',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}
                />
              </div>
            )}

            {/* TAB CONTENT 3: G-CODE EDITOR */}
            {activeTab === 'gcode' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#090f1d' }}>
                <div style={{ padding: '10px 16px', background: '#0e172a', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Production Ready ISO G-Code &bull; 3D V-Carve Variable Z Depth or Fast Single-Line Scribe
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

            {/* Bottom Status Strip */}
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
                <span>Height: {textHeight} mm</span>
                <span>Depth: Z-{targetDepth} mm</span>
                <span>Spindle: {activeTool.spindleRpm} RPM</span>
                <span>Feed: {activeTool.feedMmMin} mm/min</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={13} color="#10b981" />
                <span>Estimated Cycle: <strong>{metrics.estimatedCycleTimeFormatted}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* FOOTER */}
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
              {appliedToCAM ? 'Engraving Added to CAM!' : 'Apply Engraving Operation to CAM'}
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

