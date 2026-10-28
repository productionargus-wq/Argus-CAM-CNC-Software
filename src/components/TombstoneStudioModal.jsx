import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  X, Maximize2, Minimize2, Box, Compass, RotateCw, RotateCcw, Check, CheckCircle2,
  Download, Copy, FileCode, Clock, Sliders, Wrench, ShieldCheck, Eye, RefreshCw,
  Zap, Layers, Grid, ChevronRight, Info, Play, ArrowRight
} from 'lucide-react';
import {
  TOMBSTONE_PRESETS,
  generateTombstoneLayout,
  generateTombstoneGCode
} from '../utils/tombstoneEngine.js';

export default function TombstoneStudioModal({
  isOpen,
  onClose,
  operations = [],
  activeMachine = null,
  onApplyTombstoneToCAM = null
}) {
  if (!isOpen) return null;

  // View States
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('3d'); // '3d' | 'gcode' | 'offsets'
  const [copiedGCode, setCopiedGCode] = useState(false);
  const [appliedFeedback, setAppliedFeedback] = useState(false);

  // Configuration States
  const [selectedPresetId, setSelectedPresetId] = useState('HMC_4_SIDED_COLUMN');
  const [partsPerFace, setPartsPerFace] = useState(2); // 1 | 2 | 4
  const [schedulingMode, setSchedulingMode] = useState('tool_first'); // 'tool_first' | 'face_first'
  const [safeClearanceZ, setSafeClearanceZ] = useState(180.0);
  const [baseWcs, setBaseWcs] = useState('G54');
  const [activeFaceIndex, setActiveFaceIndex] = useState(0);

  // Three.js Canvas References
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const animFrameRef = useRef(null);
  const tombstoneGroupRef = useRef(null);
  const targetAngleRef = useRef(0);
  const currentAngleRef = useRef(0);

  // Generate Tombstone Layout
  const layout = useMemo(() => {
    return generateTombstoneLayout({
      presetId: selectedPresetId,
      partsPerFace,
      safeClearanceZ,
      schedulingMode,
      baseWcs
    });
  }, [selectedPresetId, partsPerFace, safeClearanceZ, schedulingMode, baseWcs]);

  // Generate G-Code Output
  const gcodeOutput = useMemo(() => {
    if (!layout) return '';
    return generateTombstoneGCode(layout, operations);
  }, [layout, operations]);

  // Handle Preset Change
  const handleSelectPreset = (pId) => {
    setSelectedPresetId(pId);
    const p = TOMBSTONE_PRESETS[pId];
    if (p) {
      setSafeClearanceZ(p.defaultClearanceZ || 180.0);
    }
    setActiveFaceIndex(0);
    targetAngleRef.current = 0;
  };

  // Rotate 3D View to Specific Face
  const handleRotateToFace = (faceIdx) => {
    setActiveFaceIndex(faceIdx);
    const face = layout.faces[faceIdx];
    if (face) {
      // Invert angle for column rotation
      targetAngleRef.current = -(face.angleDeg * Math.PI) / 180.0;
    }
  };

  // Copy G-Code
  const handleCopyGCode = () => {
    if (!gcodeOutput) return;
    navigator.clipboard.writeText(gcodeOutput);
    setCopiedGCode(true);
    setTimeout(() => setCopiedGCode(false), 2200);
  };

  // Download G-Code
  const handleDownloadGCode = () => {
    if (!gcodeOutput) return;
    const blob = new Blob([gcodeOutput], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ArgusCAM_Tombstone_${layout.preset.rotaryAxis}Axis_${layout.totalPartsCount}Parts_${schedulingMode}.nc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Apply to CAM
  const handleApplyToCAM = () => {
    if (onApplyTombstoneToCAM) {
      onApplyTombstoneToCAM(layout);
    }
    setAppliedFeedback(true);
    setTimeout(() => setAppliedFeedback(false), 2500);
  };

  // ==========================================================================
  // THREE.JS 3D TOMBSTONE RENDERING SCENE
  // ==========================================================================
  useEffect(() => {
    if (activeTab !== '3d' || !mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060911);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 1, 3000);
    camera.position.set(550, 480, 680);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 220, 0);
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(400, 600, 500);
    dirLight1.castShadow = true;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.4);
    dirLight2.position.set(-400, 200, -300);
    scene.add(dirLight2);

    // 6. Ground Grid
    const grid = new THREE.GridHelper(1000, 40, 0x1e293b, 0x0f172a);
    grid.position.y = -2;
    scene.add(grid);

    // 7. Base Pallet (Rotary Table Disc)
    const palletSize = layout.preset.palletSizeMm;
    const palletGeo = new THREE.CylinderGeometry(palletSize * 0.62, palletSize * 0.65, 30, 48);
    const palletMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.3
    });
    const palletMesh = new THREE.Mesh(palletGeo, palletMat);
    palletMesh.position.y = 15;
    scene.add(palletMesh);

    // Pallet T-Slots Pattern
    const ringGeo = new THREE.RingGeometry(palletSize * 0.3, palletSize * 0.55, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x334155, side: THREE.DoubleSide });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 30.5;
    scene.add(ringMesh);

    // 8. Tombstone Group (Rotates dynamically around Y / B axis)
    const tombGroup = new THREE.Group();
    tombGroup.position.y = 30; // on top of pallet
    scene.add(tombGroup);
    tombstoneGroupRef.current = tombGroup;

    // Tombstone Column Mesh
    const colW = layout.preset.columnWidthMm;
    const colD = layout.preset.columnDepthMm;
    const colH = layout.preset.columnHeightMm;

    let colGeo;
    if (layout.preset.facesCount === 8) {
      colGeo = new THREE.CylinderGeometry(colW * 0.55, colW * 0.55, colH, 8);
    } else {
      colGeo = new THREE.BoxGeometry(colW, colH, colD);
    }

    const colMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.75,
      roughness: 0.25
    });
    const columnMesh = new THREE.Mesh(colGeo, colMat);
    columnMesh.position.y = colH / 2;
    tombGroup.add(columnMesh);

    // Column Top Cap
    const capGeo = new THREE.BoxGeometry(colW * 1.05, 12, colD * 1.05);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 });
    const capMesh = new THREE.Mesh(capGeo, capMat);
    capMesh.position.y = colH + 6;
    tombGroup.add(capMesh);

    // Center Eye Bolt on Top
    const boltGeo = new THREE.TorusGeometry(18, 5, 16, 32);
    const boltMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.3 });
    const boltMesh = new THREE.Mesh(boltGeo, boltMat);
    boltMesh.position.y = colH + 28;
    boltMesh.rotation.y = Math.PI / 4;
    tombGroup.add(boltMesh);

    // 9. Add Vises & Workpieces for each face
    layout.faces.forEach((face) => {
      const faceAngleRad = (face.angleDeg * Math.PI) / 180.0;
      const faceGroup = new THREE.Group();
      faceGroup.rotation.y = faceAngleRad;

      face.parts.forEach((part) => {
        // Vise Body (Slate Dark)
        const viseGeo = new THREE.BoxGeometry(85, 38, 48);
        const viseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.4 });
        const viseMesh = new THREE.Mesh(viseGeo, viseMat);
        viseMesh.position.set(part.posX, part.posY, colD / 2 + 24);
        faceGroup.add(viseMesh);

        // Clamped Workpiece (Golden Machined Billet)
        const pGeo = new THREE.BoxGeometry(layout.partDimensions.width, layout.partDimensions.height, layout.partDimensions.depth);
        const pMat = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          metalness: 0.85,
          roughness: 0.2,
          emissive: 0x78350f,
          emissiveIntensity: 0.15
        });
        const partMesh = new THREE.Mesh(pGeo, pMat);
        partMesh.position.set(part.posX, part.posY + 8, colD / 2 + 48 + layout.partDimensions.depth / 2);
        faceGroup.add(partMesh);

        // Workpiece Feature Cavity (shows milled cavity)
        const pocketGeo = new THREE.BoxGeometry(layout.partDimensions.width * 0.6, layout.partDimensions.height * 0.5, 8);
        const pocketMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9, roughness: 0.1 });
        const pocketMesh = new THREE.Mesh(pocketGeo, pocketMat);
        pocketMesh.position.set(part.posX, part.posY + 8, colD / 2 + 48 + layout.partDimensions.depth);
        faceGroup.add(pocketMesh);
      });

      tombGroup.add(faceGroup);
    });

    // 10. Safety Clearance Envelope (Translucent Cyan Cylinder)
    const clearanceRadius = Math.hypot(colW / 2 + 100, colD / 2 + 100);
    const clearGeo = new THREE.CylinderGeometry(clearanceRadius, clearanceRadius, colH * 1.15, 36, 1, true);
    const clearMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.15
    });
    const clearMesh = new THREE.Mesh(clearGeo, clearMat);
    clearMesh.position.y = colH / 2 + 30;
    scene.add(clearMesh);

    // 11. Animation Loop with smooth rotary interpolation
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      // Smooth B-axis rotation interpolation
      if (tombGroup) {
        const diff = targetAngleRef.current - currentAngleRef.current;
        currentAngleRef.current += diff * 0.08;
        tombGroup.rotation.y = currentAngleRef.current;
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // 12. Resize Handler
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (renderer) renderer.dispose();
      if (container) container.innerHTML = '';
    };
  }, [activeTab, layout]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-hidden">
      <div
        className={`bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col transition-all duration-200 ${
          isFullscreen ? 'w-full h-full rounded-none m-0' : 'w-[95vw] max-w-7xl h-[92vh]'
        }`}
      >
        {/* ================================================================== */}
        {/* MODAL HEADER */}
        {/* ================================================================== */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400">
              <Compass size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-slate-100 tracking-tight">
                  Multi-WCS Tombstone &amp; 4th-Axis Rotary Studio
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-sky-500/20 text-sky-300 rounded border border-sky-500/30">
                  {layout.preset.machineType}
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                  {layout.totalPartsCount} Parts / Pallet
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                  -{layout.metrics.toolChangeSavingsPct}% Tool Changes
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated multi-part rotary indexing, collision-safe clearance plane unclamp/clamp, and work coordinate allocation
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

        {/* ================================================================== */}
        {/* MAIN BODY: 2-PANEL LAYOUT */}
        {/* ================================================================== */}
        <div className="flex-1 flex overflow-hidden">
          {/* ---------------------------------------------------------------- */}
          {/* LEFT PANEL: TOMBSTONE PARAMETERS & FIXTURE CONFIG */}
          {/* ---------------------------------------------------------------- */}
          <div className="w-80 md:w-96 border-r border-slate-800 bg-slate-900/90 flex flex-col overflow-y-auto custom-scrollbar p-5 space-y-6">
            {/* HARDWARE PRESETS */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Box size={14} className="text-sky-400" />
                Tombstone Column Hardware
              </label>
              <div className="space-y-2">
                {Object.values(TOMBSTONE_PRESETS).map(preset => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset.id)}
                      className={`w-full text-left p-3 rounded-lg border text-xs transition-all ${
                        isSelected
                          ? 'bg-sky-500/10 border-sky-500/50 text-slate-100 shadow-sm'
                          : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800/80 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span>{preset.name}</span>
                        <span className="text-[10px] text-sky-400 px-1.5 py-0.5 bg-sky-500/10 rounded font-mono">
                          {preset.rotaryAxis}-Axis
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
                        <span>{preset.facesCount} Faces ({preset.faceAngles.join('°, ')}°)</span>
                        <span>Pallet: {preset.palletSizeMm}mm</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FIXTURE DENSITY / PARTS PER FACE */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Grid size={14} className="text-emerald-400" />
                Parts Per Face Density
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { count: 1, label: '1 Part', sub: 'Single Vise' },
                  { count: 2, label: '2 Parts', sub: 'Upper / Lower' },
                  { count: 4, label: '4 Parts', sub: '2x2 Grid' }
                ].map(item => {
                  const isSelected = partsPerFace === item.count;
                  return (
                    <button
                      key={item.count}
                      onClick={() => setPartsPerFace(item.count)}
                      className={`p-2.5 text-center rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-500/60 text-slate-100'
                          : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-semibold text-xs">{item.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.sub}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SCHEDULING MODE */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={14} className="text-amber-400" />
                Scheduling &amp; Tool Optimization
              </label>
              <div className="space-y-2">
                {[
                  {
                    id: 'tool_first',
                    title: 'Tool-First Batching (Recommended)',
                    desc: 'Minimizes tool changes. Loads tool once, cuts all faces, then indexes next tool. Saves up to 88% tool change time.'
                  },
                  {
                    id: 'face_first',
                    title: 'Face-First Sequential Flow',
                    desc: 'Completes Face 1 completely before indexing to Face 2. Ideal for single-piece flow and first-article validation.'
                  }
                ].map(mode => {
                  const isSelected = schedulingMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setSchedulingMode(mode.id)}
                      className={`w-full text-left p-3 rounded-lg border text-xs transition-all ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/60 text-slate-100'
                          : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-semibold flex items-center justify-between">
                        <span>{mode.title}</span>
                        {isSelected && <Check size={13} className="text-amber-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        {mode.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ROTARY INDEXING & CLEARANCE PARAMETERS */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-cyan-400" />
                Safety Clearance &amp; WCS Offsets
              </label>
              <div className="space-y-3 bg-slate-950/50 p-3.5 rounded-lg border border-slate-800">
                {/* Safe Z Retract */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-slate-300">Safe Index Retract (Z)</span>
                    <span className="font-mono text-cyan-400 font-semibold">Z+{safeClearanceZ.toFixed(1)} mm</span>
                  </div>
                  <input
                    type="range"
                    min="100.0"
                    max="350.0"
                    step="10.0"
                    value={safeClearanceZ}
                    onChange={e => setSafeClearanceZ(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg"
                  />
                </div>

                {/* Base WCS */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-300">Base Work Offset</span>
                  <select
                    value={baseWcs}
                    onChange={e => setBaseWcs(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2.5 py-1 font-mono focus:outline-none focus:border-cyan-500"
                  >
                    <option value="G54">G54 (Standard)</option>
                    <option value="G55">G55</option>
                    <option value="G56">G56</option>
                  </select>
                </div>
              </div>
            </div>

            {/* LIVE FACE ROTATE NAVIGATOR */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <RotateCw size={14} className="text-purple-400" />
                Rotate 3D Face View
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {layout.faces.map((f, idx) => (
                  <button
                    key={f.faceNumber}
                    onClick={() => handleRotateToFace(idx)}
                    className={`px-3 py-2 rounded-lg text-xs font-mono font-semibold border flex items-center justify-between transition-all ${
                      activeFaceIndex === idx
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span>Face {f.faceNumber}</span>
                    <span className="text-[10px] text-slate-500">{f.angleDeg}°</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* RIGHT PANEL: 3D VIEWPORT, G-CODE & OFFSET TABLE */}
          {/* ---------------------------------------------------------------- */}
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
            {/* TABS HEADER */}
            <div className="flex items-center justify-between px-6 py-2.5 border-b border-slate-800 bg-slate-900/40">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('3d')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
                    activeTab === '3d'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Eye size={14} />
                  3D Tombstone &amp; Fixtures
                </button>
                <button
                  onClick={() => setActiveTab('gcode')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
                    activeTab === 'gcode'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <FileCode size={14} />
                  ISO Rotary G-Code ({layout.preset.rotaryAxis}-Axis)
                </button>
                <button
                  onClick={() => setActiveTab('offsets')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
                    activeTab === 'offsets'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Grid size={14} />
                  Work Offsets ({layout.totalPartsCount} Parts Assigned)
                </button>
              </div>

              {/* Quick Info Badges */}
              <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                <span>Pallet Cycle: ~{layout.metrics.estimatedPalletCycleMin} min</span>
                <span className="text-emerald-400">Saved: {Math.round(layout.metrics.toolChangeSecondsSaved / 60)}m {layout.metrics.toolChangeSecondsSaved % 60}s</span>
              </div>
            </div>

            {/* TAB CONTENT 1: 3D THREE.JS TOMBSTONE VIEWPORT */}
            {activeTab === '3d' && (
              <div className="flex-1 relative overflow-hidden select-none">
                {/* Three.js Canvas Container */}
                <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

                {/* 3D Viewport Overlay HUD */}
                <div className="absolute top-4 left-6 flex items-center gap-3 bg-slate-900/80 backdrop-blur border border-slate-800 px-3.5 py-2 rounded-lg text-xs z-10 shadow">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-[#334155]" />
                    <span className="text-slate-300">Tombstone Column</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-[#f59e0b]" />
                    <span className="text-amber-300">Clamped Workpieces</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full border border-cyan-400" />
                    <span className="text-cyan-300">Z-Clearance Cylinder</span>
                  </div>
                </div>

                {/* Bottom Rotary Controls Pill */}
                <div className="absolute bottom-4 inset-x-6 flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-2 pointer-events-auto bg-slate-900/90 border border-slate-800 px-3.5 py-2 rounded-lg text-xs font-mono">
                    <span className="text-slate-400">Active View:</span>
                    <span className="text-sky-300 font-bold">
                      Face {layout.faces[activeFaceIndex]?.faceNumber} ({layout.faces[activeFaceIndex]?.angleDeg}°)
                    </span>
                    <span className="text-slate-500">|</span>
                    <span className="text-slate-400">Parts:</span>
                    <span className="text-emerald-300 font-bold">{layout.partsPerFace} on this face</span>
                  </div>

                  <div className="pointer-events-auto flex items-center gap-2">
                    <button
                      onClick={() => handleRotateToFace((activeFaceIndex + 1) % layout.faces.length)}
                      className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 transition-colors shadow-lg shadow-sky-950/40"
                    >
                      <RotateCw size={14} />
                      Index to Next Face (+90°)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: ISO MULTI-WCS CNC G-CODE */}
            {activeTab === 'gcode' && (
              <div className="flex-1 flex flex-col p-6 overflow-hidden">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Multi-WCS Rotary CNC Program ({layout.preset.rotaryAxis}-Axis Indexing)
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
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Download size={14} />
                      Download .NC File
                    </button>
                  </div>
                </div>

                {/* Code Container */}
                <div className="flex-1 overflow-y-auto bg-slate-950 rounded-lg border border-slate-800/80 p-4 font-mono text-xs text-slate-300 leading-relaxed custom-scrollbar select-text">
                  {gcodeOutput.split('\n').map((line, idx) => {
                    const isComment = line.trim().startsWith(';') || line.trim().startsWith('(');
                    const isRotaryIndex = line.includes('B0.') || line.includes('B90.') || line.includes('B180.') || line.includes('B270.') || line.includes('A0.') || line.includes('A90.');
                    const isClampUnclamp = line.includes('M10') || line.includes('M11');
                    const isWcs = line.includes('G54') || line.includes('G55') || line.includes('G56') || line.includes('G57') || line.includes('G58') || line.includes('G59') || line.includes('G54.1');

                    return (
                      <div key={idx} className="flex hover:bg-slate-900/50 px-1 py-0.5 rounded">
                        <span className="w-10 text-slate-600 select-none text-right pr-4 font-mono text-[11px]">
                          {idx + 1}
                        </span>
                        <span
                          className={`flex-1 ${
                            isComment
                              ? 'text-slate-500 italic'
                              : isRotaryIndex
                              ? 'text-purple-400 font-bold'
                              : isClampUnclamp
                              ? 'text-amber-400 font-bold'
                              : isWcs
                              ? 'text-emerald-400 font-semibold'
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

            {/* TAB CONTENT 3: WORK OFFSETS & ANALYTICS */}
            {activeTab === 'offsets' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 font-mono block">Total Parts / Pallet</span>
                    <span className="text-2xl font-mono font-bold text-slate-100 mt-1 block">
                      {layout.totalPartsCount} Parts
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                      Across {layout.faces.length} Tombstone Faces
                    </span>
                  </div>

                  <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 font-mono block">Tool Changes Batched</span>
                    <span className="text-2xl font-mono font-bold text-emerald-400 mt-1 block">
                      {layout.metrics.toolChangesOptimized} Changes
                    </span>
                    <span className="text-[10px] text-emerald-400/80 font-mono mt-0.5 block">
                      vs {layout.metrics.toolChangesWithoutBatching} unbatched (-{layout.metrics.toolChangeSavingsPct}%)
                    </span>
                  </div>

                  <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 font-mono block">Tool Change Time Saved</span>
                    <span className="text-2xl font-mono font-bold text-cyan-400 mt-1 block">
                      {layout.metrics.toolChangeSecondsSaved} sec
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                      ~{Math.round(layout.metrics.toolChangeSecondsSaved / 60)} minutes per pallet cycle
                    </span>
                  </div>

                  <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 font-mono block">Estimated Cycle Time</span>
                    <span className="text-2xl font-mono font-bold text-amber-400 mt-1 block">
                      ~{layout.metrics.estimatedPalletCycleMin} min
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                      Complete Pallet Load Runtime
                    </span>
                  </div>
                </div>

                {/* Complete Work Coordinate Allocation Table */}
                <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5 space-y-3">
                  <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Grid size={16} className="text-sky-400" />
                    Tombstone Work Coordinate System (WCS) Allocation Table
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">Part #</th>
                          <th className="py-2.5 px-3">Face</th>
                          <th className="py-2.5 px-3">Rotary Angle</th>
                          <th className="py-2.5 px-3 text-emerald-400">Assigned WCS</th>
                          <th className="py-2.5 px-3">Grid Location</th>
                          <th className="py-2.5 px-3">Fixture Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                        {layout.faces.flatMap(f => f.parts).map((p) => (
                          <tr key={p.id} className="hover:bg-slate-800/30">
                            <td className="py-2 px-3 font-bold text-slate-100">#{p.partNumber}</td>
                            <td className="py-2 px-3 font-sans text-slate-300">Face {p.faceIndex + 1}</td>
                            <td className="py-2 px-3 text-purple-400">{layout.preset.rotaryAxis}{p.faceAngleDeg}.0°</td>
                            <td className="py-2 px-3 text-emerald-400 font-bold">{p.wcs}</td>
                            <td className="py-2 px-3 font-sans text-slate-300">Row {p.row}, Col {p.col}</td>
                            <td className="py-2 px-3 font-sans text-slate-400">Kurt-Style Precision Vise</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================================================================== */}
        {/* MODAL FOOTER ACTIONS */}
        {/* ================================================================== */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
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
                <Check size={14} /> Multi-WCS Configuration Applied to CAM!
              </span>
            )}
            <button
              onClick={handleApplyToCAM}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-2 shadow-lg shadow-sky-900/30 transition-all hover:scale-[1.02]"
            >
              <CheckCircle2 size={15} />
              Apply Multi-WCS Setup to Operations
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
