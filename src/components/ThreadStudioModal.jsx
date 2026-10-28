import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  X, Maximize2, Minimize2, RefreshCw, FileCode, Download, Copy, Check,
  Play, Settings, AlertTriangle, ShieldCheck, Box, Grid, ListFilter,
  Info, RotateCcw, Cpu, Clock, Sparkles, Sliders, CheckCircle2,
  Wrench, Disc, Crosshair, ChevronRight, Eye
} from 'lucide-react';
import {
  THREAD_CATALOG,
  ALL_THREADS,
  THREAD_TOOL_PRESETS,
  matchHoleToThread,
  generateThreadMillingToolpath,
  generateRigidTappingToolpath,
  generateThreadGCode
} from '../utils/threadEngine.js';
import { detectHoleFeatures } from '../utils/toolpathEngine.js';

export default function ThreadStudioModal({
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
  const [activeTab, setActiveTab] = useState('3d'); // '3d' | 'gcode' | 'specs'
  const [copiedGCode, setCopiedGCode] = useState(false);
  const [appliedToCAM, setAppliedToCAM] = useState(false);

  // Three.js References
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const animFrameRef = useRef(null);
  const toolpathGroupRef = useRef(null);

  // Operation Mode: 'thread_mill' | 'rigid_tap'
  const [operationMode, setOperationMode] = useState('thread_mill');

  // Thread Standard & Specification
  const [selectedStandard, setSelectedStandard] = useState('METRIC_COARSE');
  const [selectedThreadId, setSelectedThreadId] = useState('M8x1.25');
  const [threadType, setThreadType] = useState('internal'); // 'internal' | 'external'
  const [threadHand, setThreadHand] = useState('RH'); // 'RH' | 'LH'
  const [millingMode, setMillingMode] = useState('climb'); // 'climb' | 'conventional'

  // Depth & Features
  const [threadDepth, setThreadDepth] = useState(16.0);
  const [selectedToolId, setSelectedToolId] = useState('TM_SINGLE_D6');
  const [radialPasses, setRadialPasses] = useState(2);
  const [leadInArcDeg, setLeadInArcDeg] = useState(180);
  const [spindleRpm, setSpindleRpm] = useState(4500);
  const [cutFeedMmMin, setCutFeedMmMin] = useState(480);

  // Detected CAD Holes
  const detectedHoles = useMemo(() => {
    if (!isOpen) return [];
    return detectHoleFeatures(model, partMetrics);
  }, [isOpen, model, partMetrics]);

  const [selectedHoleIndex, setSelectedHoleIndex] = useState(0);

  // Active Selected Hole
  const activeHole = useMemo(() => {
    if (detectedHoles && detectedHoles.length > selectedHoleIndex) {
      return detectedHoles[selectedHoleIndex];
    }
    return { x: 0, z: 0, y: 0, radius: 3.4, depth: 25.0, name: 'Default Bore Hole Ø6.8mm' };
  }, [detectedHoles, selectedHoleIndex]);

  // Active Thread Definition
  const activeThread = useMemo(() => {
    return ALL_THREADS.find(t => t.id === selectedThreadId) || THREAD_CATALOG.METRIC_COARSE[4]; // M8x1.25
  }, [selectedThreadId]);

  // Active Tool Definition
  const activeTool = useMemo(() => {
    return THREAD_TOOL_PRESETS.find(t => t.id === selectedToolId) || THREAD_TOOL_PRESETS[0];
  }, [selectedToolId]);

  // Auto-Match Thread when hole changes
  const autoMatchResult = useMemo(() => {
    const holeDia = (activeHole.radius || 3.4) * 2;
    return matchHoleToThread(holeDia, selectedStandard);
  }, [activeHole, selectedStandard]);

  const handleApplyAutoMatch = () => {
    if (autoMatchResult && autoMatchResult.thread) {
      setSelectedThreadId(autoMatchResult.thread.id);
      setThreadDepth(Math.min(activeHole.depth || 20, Math.round(autoMatchResult.thread.majorDia * 1.75)));
    }
  };

  // Generate Toolpath Result
  const toolpathResult = useMemo(() => {
    if (!isOpen) return null;

    if (operationMode === 'rigid_tap') {
      return generateRigidTappingToolpath(activeHole, activeThread, activeTool, {
        threadDepth,
        spindleRpm: Math.min(800, spindleRpm / 5)
      });
    }

    return generateThreadMillingToolpath(activeHole, activeThread, activeTool, {
      threadDepth,
      threadType,
      threadHand,
      millingMode,
      radialPasses,
      leadInArcDeg,
      spindleRpm,
      cutFeedMmMin
    });
  }, [
    isOpen,
    operationMode,
    activeHole,
    activeThread,
    activeTool,
    threadDepth,
    threadType,
    threadHand,
    millingMode,
    radialPasses,
    leadInArcDeg,
    spindleRpm,
    cutFeedMmMin
  ]);

  // Generate ISO G-Code
  const gcodeOutput = useMemo(() => {
    if (!toolpathResult) return '';
    return generateThreadGCode(toolpathResult);
  }, [toolpathResult]);

  // --------------------------------------------------------------------------
  // THREE.JS 3D VIEWPORT INITIALIZATION & HELICAL PATH RENDERING
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen || !mountRef.current) return;

    const width = mountRef.current.clientWidth || 700;
    const height = mountRef.current.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#070c17');
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(25, 30, 45);
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
    controls.target.set(0, -threadDepth / 2, 0);
    controlsRef.current = controls;

    // Ambient and Directional Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight1.position.set(40, 60, 40);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa855f7, 0.8);
    dirLight2.position.set(-40, -20, -40);
    scene.add(dirLight2);

    // Coordinate Grid at Z = 0 Top Face
    const grid = new THREE.GridHelper(60, 30, 0x38bdf8, 0x1e293b);
    grid.position.y = 0;
    scene.add(grid);

    // Toolpath Geometry Group
    const tpGroup = new THREE.Group();
    scene.add(tpGroup);
    toolpathGroupRef.current = tpGroup;

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
  }, [isOpen]);

  // Update 3D Visualizer when toolpath points change
  useEffect(() => {
    if (!toolpathGroupRef.current || !toolpathResult || !toolpathResult.points) return;
    const group = toolpathGroupRef.current;

    // Clear previous geometries
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    }

    // 1. Render Pre-Drilled Hole Cylinder (Translucent)
    const holeRadius = activeThread.tapDrill / 2.0;
    const holeCylGeo = new THREE.CylinderGeometry(holeRadius, holeRadius, threadDepth + 4, 32, 1, true);
    const holeMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.5,
      metalness: 0.8,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    const holeMesh = new THREE.Mesh(holeCylGeo, holeMat);
    holeMesh.position.set(0, -(threadDepth + 4) / 2, 0);
    group.add(holeMesh);

    // 2. Render Major Diameter Pitch Cylinder (Green Wireframe outline)
    const majorRadius = activeThread.majorDia / 2.0;
    const majorCylGeo = new THREE.CylinderGeometry(majorRadius, majorRadius, threadDepth, 32, 4, true);
    const majorWire = new THREE.WireframeGeometry(majorCylGeo);
    const majorLine = new THREE.LineSegments(majorWire, new THREE.LineBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.25
    }));
    majorLine.position.set(0, -threadDepth / 2, 0);
    group.add(majorLine);

    // 3. Render 3D Helical Toolpath Lines
    const points = toolpathResult.points;
    const threadPoints = [];
    const rapidPoints = [];
    const leadInPoints = [];

    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      const vec = new THREE.Vector3(pt.x, pt.z, pt.y); // Map CNC Z to Three.js Y

      if (pt.type === 'rapid') {
        rapidPoints.push(vec);
      } else if (pt.type.startsWith('lead')) {
        leadInPoints.push(vec);
      } else {
        threadPoints.push(vec);
      }
    }

    // Continuous cutting path line
    const cutVecs = points.filter(p => p.type !== 'rapid').map(p => new THREE.Vector3(p.x, p.z, p.y));
    if (cutVecs.length > 1) {
      const cutGeo = new THREE.BufferGeometry().setFromPoints(cutVecs);
      const cutMat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        linewidth: 2.5
      });
      const cutLine = new THREE.Line(cutGeo, cutMat);
      group.add(cutLine);
    }

    // Rapid Retracts Line (Red Dashed)
    const rapidVecs = points.map(p => new THREE.Vector3(p.x, p.z, p.y));
    if (rapidVecs.length > 1) {
      const rGeo = new THREE.BufferGeometry().setFromPoints(rapidVecs);
      const rMat = new THREE.LineDashedMaterial({
        color: 0xf43f5e,
        dashSize: 1.5,
        gapSize: 0.8,
        transparent: true,
        opacity: 0.35
      });
      const rLine = new THREE.Line(rGeo, rMat);
      rLine.computeLineDistances();
      group.add(rLine);
    }

    // 4. Thread Mill Tool Representation at Top
    const toolRadius = activeTool.diameter / 2.0;
    const toolGeo = new THREE.CylinderGeometry(toolRadius, toolRadius, 10, 16);
    const toolMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.9,
      roughness: 0.2
    });
    const toolMesh = new THREE.Mesh(toolGeo, toolMat);
    toolMesh.position.set(0, 5, 0);
    group.add(toolMesh);

    // Update orbit controls center
    if (controlsRef.current) {
      controlsRef.current.target.set(0, -threadDepth / 2, 0);
    }
  }, [toolpathResult, activeThread, activeTool, threadDepth]);

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
    link.download = `Argus_Thread_${activeThread.id}_${Date.now()}.nc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Apply Thread Operation to Main CAM Operations Tree
  const handleApplyToCAM = () => {
    if (!toolpathResult || !onAddOperation) return;

    const isTap = operationMode === 'rigid_tap';
    const newOp = {
      id: `op_thread_${activeThread.id}_${Date.now()}`,
      name: `${isTap ? 'Rigid Tapping' : 'Helical Thread Mill'} ${activeThread.name} (Z-${threadDepth}mm)`,
      type: isTap ? 'Tapping / Rigid Tap (G84)' : 'Thread Milling (Helical G02/G03)',
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
        thread: activeThread.name,
        majorDiameter: `Ø${activeThread.majorDia}mm`,
        pitch: `${activeThread.pitch}mm`,
        tapDrill: `Ø${activeThread.tapDrill}mm`,
        targetDepth: `-${threadDepth}mm`,
        radialPasses: isTap ? 1 : radialPasses,
        spindleRpm: toolpathResult.options?.spindleRpm || spindleRpm,
        feedrate: isTap ? toolpathResult.syncFeedMmMin : cutFeedMmMin,
        toleranceClass: 'ISO 6H / ASME 2B'
      },
      time: `${toolpathResult.metrics?.estimatedCycleTimeSec || 30}s`,
      isRegenerated: true,
      hasValidPath: true
    };

    onAddOperation(newOp);
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
    estimatedCycleTimeSec: 25,
    chipLoadMmTooth: 0.035,
    radialStepoverAeMm: 0.35,
    cuttingForceN: 45,
    toolDeflectionUm: 0.5,
    toleranceClass: 'ISO 6H / ASME 2B'
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
                background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(168, 85, 247, 0.4)'
              }}
            >
              <Disc size={20} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: 700, fontSize: '16px', letterSpacing: '0.3px', color: '#f8fafc' }}>
                  CNC Feature-Based Thread Milling &amp; Tapping Studio
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: 'rgba(168, 85, 247, 0.15)',
                    color: '#c084fc',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    fontWeight: 600
                  }}
                >
                  ISO Metric &bull; Unified UNC/UNF &bull; NPT Pipe
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Active Spec: {activeThread.name} (Pitch: {activeThread.pitch} mm) &bull; Tap Drill: &Oslash;{activeThread.tapDrill} mm &bull; Class: {metrics.toleranceClass}
              </div>
            </div>
          </div>

          {/* Center Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Sparkles size={15} color="#38bdf8" />
              <div>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8' }}>Strategy</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8' }}>
                  {operationMode === 'rigid_tap' ? 'Rigid Tap (G84)' : 'Helical Thread Mill (G03)'}
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
                  {metrics.estimatedCycleTimeSec}s
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
              title="Close Thread Studio (ESC)"
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
          {/* LEFT SIDEBAR: PARAMETERS & GEOMETRY CONFIGURATION */}
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
              {/* SECTION 1: OPERATION MODE TOGGLE */}
              <div
                style={{
                  background: '#0e172a',
                  borderRadius: '10px',
                  padding: '12px',
                  border: '1px solid #1e293b',
                  marginBottom: '16px'
                }}
              >
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                  Operation Strategy Mode:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    onClick={() => setOperationMode('thread_mill')}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: operationMode === 'thread_mill' ? '#1e293b' : '#0b1320',
                      border: `1px solid ${operationMode === 'thread_mill' ? '#38bdf8' : '#334155'}`,
                      color: operationMode === 'thread_mill' ? '#38bdf8' : '#94a3b8',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Thread Milling (Helical)
                  </button>
                  <button
                    onClick={() => setOperationMode('rigid_tap')}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: operationMode === 'rigid_tap' ? '#1e293b' : '#0b1320',
                      border: `1px solid ${operationMode === 'rigid_tap' ? '#f59e0b' : '#334155'}`,
                      color: operationMode === 'rigid_tap' ? '#f59e0b' : '#94a3b8',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Rigid Tapping (G84)
                  </button>
                </div>
              </div>

              {/* SECTION 2: CAD HOLE SELECTION & AUTO-MATCHING */}
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
                    <Crosshair size={15} />
                    Feature Bore Holes ({detectedHoles.length} Found)
                  </div>
                  {autoMatchResult?.isCloseMatch && (
                    <button
                      onClick={handleApplyAutoMatch}
                      style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        color: '#10b981',
                        borderRadius: '4px',
                        padding: '2px 8px',
                        fontSize: '10px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Match {autoMatchResult.thread.name}
                    </button>
                  )}
                </div>

                {/* Hole Selector Buttons */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                  {detectedHoles.map((h, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedHoleIndex(idx)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        background: selectedHoleIndex === idx ? '#0284c7' : '#090f1d',
                        border: `1px solid ${selectedHoleIndex === idx ? '#38bdf8' : '#334155'}`,
                        color: selectedHoleIndex === idx ? '#ffffff' : '#cbd5e1',
                        fontSize: '11px',
                        cursor: 'pointer',
                        fontWeight: selectedHoleIndex === idx ? 700 : 500
                      }}
                    >
                      Hole {idx + 1} (&Oslash;{(h.radius * 2).toFixed(1)}mm)
                    </button>
                  ))}
                </div>

                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Target Hole: {activeHole.name} at X{activeHole.x.toFixed(1)}, Y{(activeHole.z || 0).toFixed(1)} &bull; Depth: {activeHole.depth}mm
                </div>
              </div>

              {/* SECTION 3: THREAD STANDARD & SIZE SPECIFICATION */}
              <div
                style={{
                  background: '#0e172a',
                  borderRadius: '10px',
                  padding: '14px',
                  border: '1px solid #1e293b',
                  marginBottom: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#c084fc', marginBottom: '12px' }}>
                  <Disc size={15} />
                  Thread Standard &amp; Size
                </div>

                {/* Standard Select */}
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Thread Family Standard:
                  </label>
                  <select
                    value={selectedStandard}
                    onChange={(e) => {
                      setSelectedStandard(e.target.value);
                      const cat = THREAD_CATALOG[e.target.value];
                      if (cat && cat[0]) setSelectedThreadId(cat[0].id);
                    }}
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
                    <option value="METRIC_COARSE">ISO Metric Coarse (M3 to M36)</option>
                    <option value="METRIC_FINE">ISO Metric Fine (M8 to M20)</option>
                    <option value="UNC">Unified National Coarse UNC (#4 to 1")</option>
                    <option value="UNF">Unified National Fine UNF (#10 to 1/2")</option>
                    <option value="NPT">National Pipe Taper NPT (1/8" to 1")</option>
                  </select>
                </div>

                {/* Size Select */}
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Specific Thread Nominal Size:
                  </label>
                  <select
                    value={selectedThreadId}
                    onChange={(e) => setSelectedThreadId(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#0b1320',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#f8fafc',
                      padding: '7px 10px',
                      fontSize: '12px',
                      fontWeight: 700
                    }}
                  >
                    {(THREAD_CATALOG[selectedStandard] || THREAD_CATALOG.METRIC_COARSE).map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} (Major: &Oslash;{t.majorDia}mm, Pitch: {t.pitch.toFixed(3)}mm, Drill: &Oslash;{t.tapDrill}mm)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Depth & Thread Hand */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: '#94a3b8' }}>Thread Depth (Z mm)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={threadDepth}
                      onChange={(e) => setThreadDepth(parseFloat(e.target.value) || 1.0)}
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
                    <label style={{ fontSize: '10px', color: '#94a3b8' }}>Thread Direction</label>
                    <select
                      value={threadHand}
                      onChange={(e) => setThreadHand(e.target.value)}
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
                      <option value="RH">Right-Hand (RH Standard)</option>
                      <option value="LH">Left-Hand (LH Reverse)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 4: CUTTING TOOL & PASS PARAMETERS */}
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
                  Tooling &amp; Cut Passes
                </div>

                {/* Tool Selection */}
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Assigned Thread Mill / Tap:
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
                    {THREAD_TOOL_PRESETS.map(tool => (
                      <option key={tool.id} value={tool.id}>
                        {tool.name} &bull; &Oslash;{tool.diameter}mm
                      </option>
                    ))}
                  </select>
                </div>

                {/* Passes & Feeds */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: '#94a3b8' }}>Radial Passes</label>
                    <select
                      value={radialPasses}
                      onChange={(e) => setRadialPasses(parseInt(e.target.value, 10))}
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
                      <option value="1">1 Pass (Light / Brass)</option>
                      <option value="2">2 Passes (Rough + Spring)</option>
                      <option value="3">3 Passes (Alloy Steels)</option>
                      <option value="4">4 Passes (Titanium / Inconel)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#94a3b8' }}>Helical Roll-In Arc</label>
                    <select
                      value={leadInArcDeg}
                      onChange={(e) => setLeadInArcDeg(parseInt(e.target.value, 10))}
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
                      <option value="180">180&deg; Tangential Arc</option>
                      <option value="90">90&deg; Quarter Arc</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: '#94a3b8' }}>Spindle RPM</label>
                    <input
                      type="number"
                      step="100"
                      value={spindleRpm}
                      onChange={(e) => setSpindleRpm(parseInt(e.target.value, 10) || 1000)}
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
                    <label style={{ fontSize: '10px', color: '#94a3b8' }}>Cut Feed (mm/min)</label>
                    <input
                      type="number"
                      step="20"
                      value={cutFeedMmMin}
                      onChange={(e) => setCutFeedMmMin(parseInt(e.target.value, 10) || 100)}
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
                  3D Helical Backplot
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
                <button
                  onClick={() => setActiveTab('specs')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: activeTab === 'specs' ? '#1e293b' : 'transparent',
                    color: activeTab === 'specs' ? '#a855f7' : '#94a3b8',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Info size={14} />
                  Thread Engineering Data Sheet
                </button>
              </div>

              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Rotate: Left Click + Drag | Pan: Right Click | Zoom: Scroll
              </div>
            </div>

            {/* TAB CONTENT 1: 3D VIEWPORT */}
            {activeTab === '3d' && (
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

                {/* Floating Engineering Physics HUD */}
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
                    minWidth: '240px'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '12px', color: '#38bdf8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Cpu size={14} />
                    Thread Cutting Dynamics
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: '#94a3b8' }}>
                    <div>Chip Load per Tooth: <strong style={{ color: '#e2e8f0' }}>{metrics.chipLoadMmTooth} mm</strong></div>
                    <div>Radial Stepover Ae: <strong style={{ color: '#e2e8f0' }}>{metrics.radialStepoverAeMm} mm</strong></div>
                    <div>Cutting Force: <strong style={{ color: '#e2e8f0' }}>{metrics.cuttingForceN} N</strong></div>
                    <div>Tool Deflection: <strong style={{ color: metrics.toolDeflectionUm < 5 ? '#10b981' : '#f59e0b' }}>{metrics.toolDeflectionUm} &mu;m</strong></div>
                    <div>Tolerance Fit: <strong style={{ color: '#10b981' }}>{metrics.toleranceClass}</strong></div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: G-CODE EDITOR */}
            {activeTab === 'gcode' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#090f1d' }}>
                <div style={{ padding: '10px 16px', background: '#0e172a', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Production Ready ISO G-Code &bull; Helical Interpolation G02/G03 or Rigid Tap G84
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

            {/* TAB CONTENT 3: THREAD ENGINEERING SPECS */}
            {activeTab === 'specs' && (
              <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
                <div style={{ background: '#0e172a', borderRadius: '10px', padding: '20px', border: '1px solid #1e293b', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', marginBottom: '14px' }}>
                    {activeThread.name} Geometric Engineering Parameters
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', fontSize: '12px' }}>
                    <div>
                      <div style={{ color: '#94a3b8' }}>Nominal Major Diameter:</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#38bdf8', marginTop: '2px' }}>
                        &Oslash;{activeThread.majorDia} mm
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#94a3b8' }}>Pitch Diameter (D2):</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>
                        &Oslash;{activeThread.pitchDia} mm
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#94a3b8' }}>Minor Diameter (D1):</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#f59e0b', marginTop: '2px' }}>
                        &Oslash;{activeThread.minorDia} mm
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#94a3b8' }}>Thread Pitch (P):</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0', marginTop: '2px' }}>
                        {activeThread.pitch} mm {activeThread.tpi ? `(${activeThread.tpi} TPI)` : ''}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#94a3b8' }}>Recommended Tap Drill Size:</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#ec4899', marginTop: '2px' }}>
                        &Oslash;{activeThread.tapDrill} mm
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#94a3b8' }}>Included Flank Angle:</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#a855f7', marginTop: '2px' }}>
                        {activeThread.angleDeg}&deg; (Symmetrical)
                      </div>
                    </div>
                  </div>
                </div>
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
                <span>Thread: {activeThread.name}</span>
                <span>Depth: Z-{threadDepth} mm</span>
                <span>Spindle: {spindleRpm} RPM</span>
                <span>Feed: {cutFeedMmMin} mm/min</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={13} color="#10b981" />
                <span>Estimated Cycle: <strong>{metrics.estimatedCycleTimeSec}s</strong></span>
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
              Export Thread .NC G-Code
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleApplyToCAM}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: appliedToCAM ? '#10b981' : 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
                border: 'none',
                color: '#ffffff',
                padding: '8px 18px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(168, 85, 247, 0.4)'
              }}
            >
              {appliedToCAM ? <Check size={14} /> : <Play size={14} />}
              {appliedToCAM ? 'Thread Operation Added to CAM!' : 'Apply Thread Operation to CAM'}
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
