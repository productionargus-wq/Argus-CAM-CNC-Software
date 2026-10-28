import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  X, Wrench, Sliders, ShieldCheck, AlertTriangle, CheckCircle2,
  Check, Sparkles, RefreshCw, Layers, Compass, Zap, ShieldAlert,
  Maximize2, RotateCw, Eye, Box, Info
} from 'lucide-react';
import {
  FIXTURE_MODELS,
  DEFAULT_FIXTURE_CONFIG,
  calculateAutoFitFixture,
  createParametricFixture3D,
  auditFixtureCollisions,
  calculateClampingPhysics
} from '../utils/fixtureEngine.js';
import { resolveSafeBounds } from '../utils/toolpathEngine.js';

export default function FixtureStudioModal({
  isOpen,
  onClose,
  fixtureConfig = DEFAULT_FIXTURE_CONFIG,
  onSaveFixture,
  stockConfig = {},
  partMetrics = null,
  operations = [],
  tools = []
}) {
  const dialogRef = useRef(null);
  const mountRef = useRef(null);

  // Active Configuration State
  const [currentConfig, setCurrentConfig] = useState(DEFAULT_FIXTURE_CONFIG);
  const [activeTab, setActiveTab] = useState('parameters'); // 'parameters' | 'collision' | 'physics' | 'specs'
  const [feedback, setFeedback] = useState(null);

  // Three.js Scene References
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const fixtureGroupRef = useRef(null);
  const stockMeshRef = useRef(null);
  const animFrameRef = useRef(null);

  // Synchronize initial configuration when opened
  useEffect(() => {
    if (isOpen) {
      if (fixtureConfig) {
        setCurrentConfig({ ...DEFAULT_FIXTURE_CONFIG, ...fixtureConfig });
      }
    }
  }, [isOpen, fixtureConfig]);

  // Safe stock bounds derived from part metrics and stock configuration
  const stockBounds = useMemo(() => {
    const b = partMetrics?.box || partMetrics?.bounds;
    const allowanceSides = stockConfig?.allowanceSides || 4.0;
    const allowanceTop = stockConfig?.allowanceTop || 2.0;

    if (b && b.min && b.max) {
      return new THREE.Box3(
        new THREE.Vector3(b.min.x - allowanceSides, b.min.y, b.min.z - allowanceSides),
        new THREE.Vector3(b.max.x + allowanceSides, b.max.y + allowanceTop, b.max.z + allowanceSides)
      );
    }
    return new THREE.Box3(new THREE.Vector3(-40, 0, -30), new THREE.Vector3(40, 30, 30));
  }, [partMetrics, stockConfig]);

  // Model Definition
  const activeModel = useMemo(() => {
    return FIXTURE_MODELS[currentConfig.type] || FIXTURE_MODELS.LANG_MAKRO_GRIP;
  }, [currentConfig.type]);

  // Live Fixture Collision Audit Report
  const collisionReport = useMemo(() => {
    if (!isOpen) return { status: 'safe', totalIssues: 0, criticalCount: 0, nearMissCount: 0, opClearances: [], issues: [] };
    return auditFixtureCollisions(operations, tools, currentConfig, stockBounds);
  }, [isOpen, operations, tools, currentConfig, stockBounds]);

  // Clamping Force & Cutting Retention Physics
  const clampingPhysics = useMemo(() => {
    const activeOp = operations[0] || null;
    const activeTool = tools.find((t) => t.id === activeOp?.toolId) || tools[0] || null;
    return calculateClampingPhysics(currentConfig, activeOp, activeTool, 'ALUMINUM_6061');
  }, [currentConfig, operations, tools]);

  // Modal Lifecycle & Dialog Backdrop
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }

    const handleBackdrop = (e) => {
      if (e.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const inBox =
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width;
      if (!inBox) onClose();
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    dialog.addEventListener('click', handleBackdrop);
    dialog.addEventListener('keydown', handleKeyDown);

    return () => {
      dialog.removeEventListener('click', handleBackdrop);
      dialog.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // 3D Canvas Initialization
  useEffect(() => {
    if (!isOpen || !mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e131b);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 1, 2000);
    camera.position.set(160, 130, 180);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 30, 0);
    controlsRef.current = controls;

    // Lighting
    const ambLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.95);
    dirLight1.position.set(100, 150, 100);
    dirLight1.castShadow = true;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.4);
    dirLight2.position.set(-100, 50, -100);
    scene.add(dirLight2);

    // Bed Grid
    const grid = new THREE.GridHelper(300, 30, 0x334155, 0x1e293b);
    grid.position.y = -9;
    scene.add(grid);

    // Animation Loop
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (renderer.domElement && mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isOpen]);

  // Update 3D Fixture & Clamped Stock Geometry
  useEffect(() => {
    if (!sceneRef.current || !isOpen) return;

    // 1. Remove Previous Fixture Mesh
    if (fixtureGroupRef.current) {
      sceneRef.current.remove(fixtureGroupRef.current);
    }
    if (stockMeshRef.current) {
      sceneRef.current.remove(stockMeshRef.current);
    }

    // 2. Generate New Parametric Fixture
    const fixture3D = createParametricFixture3D(currentConfig, stockBounds);
    sceneRef.current.add(fixture3D);
    fixtureGroupRef.current = fixture3D;

    // 3. Render Clamped Stock Billet (Translucent Amber Glass with Wireframe)
    const sb = resolveSafeBounds(stockBounds);
    const sw = sb.max.x - sb.min.x;
    const sh = sb.max.y - sb.min.y;
    const sd = sb.max.z - sb.min.z;

    const stockGroup = new THREE.Group();
    const stockGeo = new THREE.BoxGeometry(sw, sh, sd);
    const stockMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.35,
      roughness: 0.4,
      metalness: 0.2
    });
    const stockMesh = new THREE.Mesh(stockGeo, stockMat);
    stockMesh.position.set((sb.min.x + sb.max.x) / 2, (sb.min.y + sb.max.y) / 2, (sb.min.z + sb.max.z) / 2);

    const wireMat = new THREE.LineBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.8 });
    const wireGeo = new THREE.EdgesGeometry(stockGeo);
    const wireMesh = new THREE.LineSegments(wireGeo, wireMat);
    stockMesh.add(wireMesh);

    stockGroup.add(stockMesh);
    sceneRef.current.add(stockGroup);
    stockMeshRef.current = stockGroup;

  }, [isOpen, currentConfig, stockBounds]);

  // Handlers
  const handleSelectModel = (typeKey) => {
    const model = FIXTURE_MODELS[typeKey];
    if (!model) return;
    setCurrentConfig((prev) => ({
      ...prev,
      type: typeKey,
      jawWidth: model.jawWidth,
      gripDepth: model.defaultGripDepth,
      clampingForceKn: model.recommendedForceKn,
      jawOpening: Math.max(model.minOpening, Math.min(model.maxOpening, prev.jawOpening))
    }));
    setFeedback(`Selected ${model.name}`);
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleAutoFitStock = () => {
    const fitted = calculateAutoFitFixture(stockBounds, currentConfig);
    setCurrentConfig(fitted);
    setFeedback(`Auto-fitted jaws to stock (Opening: ${fitted.jawOpening}mm, Grip: ${fitted.gripDepth}mm)`);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSetView = (viewType) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;

    if (viewType === 'iso') {
      cam.position.set(160, 130, 180);
      ctrl.target.set(0, 30, 0);
    } else if (viewType === 'top') {
      cam.position.set(0, 260, 0);
      ctrl.target.set(0, 0, 0);
    } else if (viewType === 'front') {
      cam.position.set(0, 30, 240);
      ctrl.target.set(0, 30, 0);
    } else if (viewType === 'side') {
      cam.position.set(240, 30, 0);
      ctrl.target.set(0, 30, 0);
    }
    cam.lookAt(ctrl.target);
  };

  const handleApply = () => {
    if (onSaveFixture) {
      onSaveFixture(currentConfig);
    }
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      style={{
        width: '94vw',
        maxWidth: '1360px',
        height: '92vh',
        background: '#12161f',
        color: '#f1f5f9',
        border: '1px solid #2d3545',
        borderRadius: '12px',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(56, 189, 248, 0.2)',
        padding: 0,
        margin: 'auto',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Modal Top Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            background: 'linear-gradient(90deg, #161b26 0%, #1a2233 100%)',
            borderBottom: '1px solid #283144'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(56, 189, 248, 0.35)'
              }}
            >
              <Wrench size={20} color="#38bdf8" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, letterSpacing: '0.5px' }}>
                  CNC WORKHOLDING &amp; FIXTURE SETUP STUDIO
                </h3>
                <span
                  style={{
                    background: 'rgba(56, 189, 248, 0.2)',
                    color: '#38bdf8',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid rgba(56, 189, 248, 0.4)'
                  }}
                >
                  Mastercam Grade Fixture Manager
                </span>
                {collisionReport.status === 'danger' && (
                  <span
                    style={{
                      background: 'rgba(239, 68, 68, 0.25)',
                      color: '#ef4444',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: '1px solid #ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <ShieldAlert size={13} /> {collisionReport.criticalCount} FIXTURE CRASHES
                  </span>
                )}
                {collisionReport.status === 'safe' && (
                  <span
                    style={{
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: '#10b981',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: '1px solid #10b981',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <CheckCircle2 size={13} /> Jaws Clear (≥{currentConfig.safetyClearanceMm}mm)
                  </span>
                )}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                Parametric 5-Axis Vises, Dovetail Step Jaws, Modular Toe Clamps &amp; Real-Time Cutter Collision Avoidance
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleAutoFitStock}
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                color: '#fbbf24',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Automatically resize jaw opening and grip depth to tightly clamp current stock workpiece"
            >
              <Zap size={14} /> Auto-Clamp Stock
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {feedback && (
          <div
            style={{
              padding: '6px 16px',
              background: '#0284c7',
              color: 'white',
              fontSize: '11px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Sparkles size={14} /> {feedback}
          </div>
        )}

        {/* Studio Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '410px 1fr', flex: 1, overflow: 'hidden' }}>
          {/* Left Parameter & Model Palette Sidebar */}
          <div
            style={{
              background: '#151922',
              borderRight: '1px solid #283144',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              padding: '16px',
              gap: '16px'
            }}
          >
            {/* 1. Fixture Model Selector */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
                1. Select Workholding Model
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.values(FIXTURE_MODELS).map((m) => {
                  const isSelected = currentConfig.type === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => handleSelectModel(m.id)}
                      style={{
                        padding: '10px 12px',
                        background: isSelected ? 'rgba(56, 189, 248, 0.12)' : '#1a202c',
                        border: isSelected ? '1px solid #38bdf8' : '1px solid #2d3748',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: isSelected ? '#38bdf8' : '#f1f5f9' }}>
                          {m.name}
                        </span>
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '3px',
                            background: `${m.badgeColor}22`,
                            color: m.badgeColor,
                            border: `1px solid ${m.badgeColor}44`
                          }}
                        >
                          {m.badge}
                        </span>
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#94a3b8', lineHeight: '1.4' }}>
                        {m.description}
                      </div>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '10px', color: '#64748b' }}>
                        <span>Width: <strong>{m.jawWidth}mm</strong></span>
                        <span>Max Open: <strong>{m.maxOpening}mm</strong></span>
                        <span>Rec. Force: <strong>{m.recommendedForceKn} kN</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Clamping Parameters Card */}
            <div style={{ background: '#1a202c', border: '1px solid #2d3748', borderRadius: '8px', padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                  2. Clamping Geometry &amp; Jaws
                </span>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                  Grip: {currentConfig.gripDepth}mm
                </span>
              </div>

              {/* Jaw Opening Slider */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ color: '#cbd5e1' }}>Jaw Opening (Stock Depth Z):</span>
                  <span style={{ fontWeight: 700, color: '#38bdf8' }}>{currentConfig.jawOpening} mm</span>
                </div>
                <input
                  type="range"
                  min={activeModel.minOpening}
                  max={activeModel.maxOpening}
                  step={0.5}
                  value={currentConfig.jawOpening}
                  onChange={(e) => setCurrentConfig({ ...currentConfig, jawOpening: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: '#38bdf8' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#64748b' }}>
                  <span>{activeModel.minOpening} mm</span>
                  <span>Max: {activeModel.maxOpening} mm</span>
                </div>
              </div>

              {/* Grip Depth Slider */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ color: '#cbd5e1' }}>Workpiece Seating Grip Depth:</span>
                  <span style={{ fontWeight: 700, color: '#f59e0b' }}>{currentConfig.gripDepth} mm</span>
                </div>
                <input
                  type="range"
                  min={1.0}
                  max={35.0}
                  step={0.5}
                  value={currentConfig.gripDepth}
                  onChange={(e) => setCurrentConfig({ ...currentConfig, gripDepth: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: '#f59e0b' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#64748b' }}>
                  <span>3.0 mm (5X Dovetail)</span>
                  <span>12.0 mm (Std Vise)</span>
                  <span>35 mm</span>
                </div>
              </div>

              {/* Clamping Force Slider */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ color: '#cbd5e1' }}>Clamping Retention Force:</span>
                  <span style={{ fontWeight: 700, color: '#10b981' }}>{currentConfig.clampingForceKn} kN</span>
                </div>
                <input
                  type="range"
                  min={5.0}
                  max={activeModel.maxForceKn || 50.0}
                  step={1.0}
                  value={currentConfig.clampingForceKn}
                  onChange={(e) => setCurrentConfig({ ...currentConfig, clampingForceKn: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: '#10b981' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#64748b' }}>
                  <span>5 kN</span>
                  <span>Rec: {activeModel.recommendedForceKn} kN</span>
                  <span>{activeModel.maxForceKn} kN</span>
                </div>
              </div>

              {/* Rotation & Safety Buffer Controls */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '3px' }}>
                    Vise Table Angle:
                  </label>
                  <select
                    value={currentConfig.rotationDeg || 0}
                    onChange={(e) => setCurrentConfig({ ...currentConfig, rotationDeg: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      background: '#12161f',
                      border: '1px solid #333d4e',
                      color: '#f1f5f9',
                      padding: '5px 8px',
                      borderRadius: '4px',
                      fontSize: '11px'
                    }}
                  >
                    <option value={0}>0° (Normal - Jaws along X)</option>
                    <option value={90}>90° (Rotated - Jaws along Z)</option>
                    <option value={180}>180° (Reversed)</option>
                    <option value={270}>270° (Rotated 270°)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '3px' }}>
                    Safety Buffer Envelope:
                  </label>
                  <select
                    value={currentConfig.safetyClearanceMm || 5.0}
                    onChange={(e) => setCurrentConfig({ ...currentConfig, safetyClearanceMm: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      background: '#12161f',
                      border: '1px solid #333d4e',
                      color: '#f1f5f9',
                      padding: '5px 8px',
                      borderRadius: '4px',
                      fontSize: '11px'
                    }}
                  >
                    <option value={3.0}>3.0 mm (Tight Clearance)</option>
                    <option value={5.0}>5.0 mm (Standard Industrial)</option>
                    <option value={8.0}>8.0 mm (Conservative)</option>
                    <option value={12.0}>12.0 mm (High Safety)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="showCollisionZone"
                  checked={currentConfig.showCollisionZone !== false}
                  onChange={(e) => setCurrentConfig({ ...currentConfig, showCollisionZone: e.target.checked })}
                  style={{ accentColor: '#ef4444', cursor: 'pointer' }}
                />
                <label htmlFor="showCollisionZone" style={{ fontSize: '11px', color: '#cbd5e1', cursor: 'pointer' }}>
                  Render 3D Exclusion Danger Envelope (Red Hull)
                </label>
              </div>
            </div>

            {/* 3. Clamping Physics & Part Slippage Safety Gauge */}
            <div style={{ background: '#1a202c', border: '1px solid #2d3748', borderRadius: '8px', padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>
                  3. Retention Security &amp; Mechanics
                </span>
                <span
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '3px',
                    background: `${clampingPhysics.badgeColor}22`,
                    color: clampingPhysics.badgeColor,
                    border: `1px solid ${clampingPhysics.badgeColor}55`
                  }}
                >
                  {clampingPhysics.securityRating}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10.5px', marginBottom: '8px' }}>
                <div style={{ background: '#12161f', padding: '6px 8px', borderRadius: '4px' }}>
                  <div style={{ color: '#64748b' }}>Holding Force:</div>
                  <div style={{ color: '#10b981', fontWeight: 700, fontSize: '12px' }}>
                    {clampingPhysics.holdingForceNewtons.toLocaleString()} N
                  </div>
                </div>
                <div style={{ background: '#12161f', padding: '6px 8px', borderRadius: '4px' }}>
                  <div style={{ color: '#64748b' }}>Est. Cut Force Fc:</div>
                  <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: '12px' }}>
                    ~{clampingPhysics.cuttingForceFc.toLocaleString()} N
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                Retention Safety Factor: <strong style={{ color: clampingPhysics.badgeColor }}>{clampingPhysics.safetyFactor}x</strong>
              </div>
              <div
                style={{
                  height: '6px',
                  background: '#0f172a',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  marginTop: '4px'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, (clampingPhysics.safetyFactor / 4.0) * 100)}%`,
                    background: clampingPhysics.badgeColor,
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right 3D Viewport & Audit Tabs */}
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* 3D Canvas Area */}
            <div style={{ flex: 1, position: 'relative', minHeight: '340px' }}>
              <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

              {/* Viewport Overlay Controls */}
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  display: 'flex',
                  gap: '6px',
                  background: 'rgba(15, 23, 42, 0.75)',
                  backdropFilter: 'blur(8px)',
                  padding: '4px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <button
                  onClick={() => handleSetView('iso')}
                  style={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    color: '#e2e8f0',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    cursor: 'pointer'
                  }}
                >
                  ISO
                </button>
                <button
                  onClick={() => handleSetView('top')}
                  style={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    color: '#e2e8f0',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    cursor: 'pointer'
                  }}
                >
                  Top
                </button>
                <button
                  onClick={() => handleSetView('front')}
                  style={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    color: '#e2e8f0',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    cursor: 'pointer'
                  }}
                >
                  Front
                </button>
                <button
                  onClick={() => handleSetView('side')}
                  style={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    color: '#e2e8f0',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    cursor: 'pointer'
                  }}
                >
                  Side
                </button>
              </div>

              {/* Legend Badges */}
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  backdropFilter: 'blur(8px)',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8' }}>
                  <span style={{ width: '8px', height: '8px', background: '#94a3b8', borderRadius: '2px' }} />
                  Hardened Steel Jaws
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b' }}>
                  <span style={{ width: '8px', height: '8px', background: '#f59e0b', borderRadius: '2px' }} />
                  Raw Stock Billet (Clamped)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444' }}>
                  <span style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '2px' }} />
                  {currentConfig.safetyClearanceMm}mm Danger Exclusion Hull
                </div>
              </div>
            </div>

            {/* Bottom Audit & Analytics Panel */}
            <div
              style={{
                height: '220px',
                background: '#151922',
                borderTop: '1px solid #283144',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Tab Header */}
              <div
                style={{
                  display: 'flex',
                  borderBottom: '1px solid #283144',
                  background: '#12161f',
                  padding: '0 16px'
                }}
              >
                <button
                  onClick={() => setActiveTab('parameters')}
                  style={{
                    padding: '8px 14px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === 'parameters' ? '2px solid #38bdf8' : '2px solid transparent',
                    color: activeTab === 'parameters' ? '#38bdf8' : '#94a3b8',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Toolpath Collision Audit ({collisionReport.issues.length} Events)
                </button>
                <button
                  onClick={() => setActiveTab('specs')}
                  style={{
                    padding: '8px 14px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === 'specs' ? '2px solid #38bdf8' : '2px solid transparent',
                    color: activeTab === 'specs' ? '#38bdf8' : '#94a3b8',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Workholding Specifications &amp; Pull Studs
                </button>
              </div>

              {/* Tab Body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
                {activeTab === 'parameters' && (
                  <div>
                    {collisionReport.issues.length === 0 ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '16px',
                          background: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          borderRadius: '8px',
                          color: '#10b981'
                        }}
                      >
                        <CheckCircle2 size={24} />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700 }}>
                            ZERO FIXTURE COLLISIONS DETECTED
                          </div>
                          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                            All cutting passes and rapid traverse motions maintain safe clearance (minimum clearance: {collisionReport.minObservedClearance} mm) above the vise jaws and clamping hardware.
                          </div>
                        </div>
                      </div>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', textAlign: 'left' }}>
                            <th style={{ padding: '6px' }}>Status</th>
                            <th style={{ padding: '6px' }}>Operation</th>
                            <th style={{ padding: '6px' }}>Nearest Fixture Part</th>
                            <th style={{ padding: '6px' }}>Clearance</th>
                            <th style={{ padding: '6px' }}>Diagnostic Message</th>
                          </tr>
                        </thead>
                        <tbody>
                          {collisionReport.issues.map((issue) => (
                            <tr key={issue.id} style={{ borderBottom: '1px solid #1e293b' }}>
                              <td style={{ padding: '6px' }}>
                                <span
                                  style={{
                                    padding: '2px 6px',
                                    borderRadius: '3px',
                                    fontSize: '9.5px',
                                    fontWeight: 700,
                                    background: issue.type === 'danger' ? '#ef444422' : '#f59e0b22',
                                    color: issue.type === 'danger' ? '#ef4444' : '#f59e0b',
                                    border: `1px solid ${issue.type === 'danger' ? '#ef4444' : '#f59e0b'}`
                                  }}
                                >
                                  {issue.severity}
                                </span>
                              </td>
                              <td style={{ padding: '6px', fontWeight: 600 }}>{issue.opName}</td>
                              <td style={{ padding: '6px', color: '#94a3b8' }}>{issue.hullName}</td>
                              <td style={{ padding: '6px', fontWeight: 700, color: issue.clearanceMm <= 0 ? '#ef4444' : '#f59e0b' }}>
                                {issue.clearanceMm} mm
                              </td>
                              <td style={{ padding: '6px', color: '#cbd5e1' }}>{issue.message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {activeTab === 'specs' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', fontSize: '11px' }}>
                    <div style={{ background: '#12161f', padding: '10px', borderRadius: '6px', border: '1px solid #283144' }}>
                      <div style={{ color: '#64748b' }}>Manufacturer:</div>
                      <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{activeModel.manufacturer}</div>
                    </div>
                    <div style={{ background: '#12161f', padding: '10px', borderRadius: '6px', border: '1px solid #283144' }}>
                      <div style={{ color: '#64748b' }}>Jaw Width:</div>
                      <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{activeModel.jawWidth} mm</div>
                    </div>
                    <div style={{ background: '#12161f', padding: '10px', borderRadius: '6px', border: '1px solid #283144' }}>
                      <div style={{ color: '#64748b' }}>Maximum Clamping Force:</div>
                      <div style={{ fontWeight: 600, color: '#10b981' }}>{activeModel.maxForceKn} kN</div>
                    </div>
                    <div style={{ background: '#12161f', padding: '10px', borderRadius: '6px', border: '1px solid #283144' }}>
                      <div style={{ color: '#64748b' }}>Zero-Point Interface:</div>
                      <div style={{ fontWeight: 600, color: '#38bdf8' }}>4x Ø25mm Pull Studs (96mm Grid)</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Footer */}
        <div
          style={{
            padding: '12px 20px',
            background: '#12161f',
            borderTop: '1px solid #283144',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            Current Workholding: <strong style={{ color: '#f1f5f9' }}>{activeModel.name}</strong> &bull; Opening:{' '}
            <strong style={{ color: '#38bdf8' }}>{currentConfig.jawOpening}mm</strong> &bull; Grip:{' '}
            <strong style={{ color: '#f59e0b' }}>{currentConfig.gripDepth}mm</strong> &bull; Force:{' '}
            <strong style={{ color: '#10b981' }}>{currentConfig.clampingForceKn} kN</strong>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#94a3b8',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                border: '1px solid #38bdf8',
                color: 'white',
                padding: '8px 20px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)'
              }}
            >
              <Check size={16} /> Apply Fixture to Setup
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}

