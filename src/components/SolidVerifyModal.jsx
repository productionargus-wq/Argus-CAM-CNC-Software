import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  X, Play, Pause, RotateCcw, FastForward, Rewind, Download,
  Layers, ShieldAlert, CheckCircle2, Sliders, Box, Eye, Scissors,
  Maximize2, Activity, Gauge, Flame
} from 'lucide-react';
import {
  VoxelStockSimulator,
  STOCK_COLOR_MODES,
  TOOL_PALETTE
} from '../utils/voxelStockEngine.js';
import { compileBackplotTrajectory } from '../utils/toolpathEngine.js';

export default function SolidVerifyModal({
  isOpen,
  onClose,
  operations = [],
  tools = [],
  activeOpId = null,
  stockConfig = null,
  partMetrics = null
}) {
  const dialogRef = useRef(null);
  const mountRef = useRef(null);

  // Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0.0);
  const [speed, setSpeed] = useState(2.0); // 1x, 2x, 5x, 10x
  const [colorMode, setColorMode] = useState('tool'); // 'tool' | 'heatmap' | 'metallic'
  const [clipAxis, setClipAxis] = useState('off'); // 'off' | 'x' | 'z'
  const [clipValue, setClipValue] = useState(0);

  // Telemetry
  const [telemetry, setTelemetry] = useState({
    initialVolumeCm3: 0,
    removedVolumeCm3: 0,
    removedPct: 0,
    residualVolumeCm3: 0,
    instantaneousMRR: 0,
    gougeCount: 0,
    maxGougeMm: 0,
    currentPos: { x: 0, y: 0, z: 0 }
  });

  // Three.js Scene Refs
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const stockMeshRef = useRef(null);
  const toolMeshRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastTimeRef = useRef(null);

  // Stock Bounds
  const stockBounds = useMemo(() => {
    const b = partMetrics?.box || partMetrics?.bounds;
    if (b && b.min && b.max) {
      const allowanceSides = stockConfig?.allowanceSides || 4.0;
      const allowanceTop = stockConfig?.allowanceTop || 2.0;
      return new THREE.Box3(
        new THREE.Vector3(b.min.x - allowanceSides, b.min.y, b.min.z - allowanceSides),
        new THREE.Vector3(b.max.x + allowanceSides, b.max.y + allowanceTop, b.max.z + allowanceSides)
      );
    }
    return new THREE.Box3(new THREE.Vector3(-35, 0, -25), new THREE.Vector3(35, 25, 25));
  }, [partMetrics, stockConfig]);

  // Compile full trajectory waypoints across operations
  const trajectory = useMemo(() => {
    if (!stockBounds) return { waypoints: [], totalDistance: 0, totalDurationSec: 0 };
    return compileBackplotTrajectory(operations, tools, stockBounds);
  }, [operations, tools, stockBounds]);

  // Initialize Voxel Simulator
  const simulator = useMemo(() => {
    return new VoxelStockSimulator(stockBounds, partMetrics, { gridResX: 48, tolerance: 0.02 });
  }, [stockBounds, partMetrics]);

  // Modal lifecycle & backdrop
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) dialog.showModal();
      setIsPlaying(true);
      setProgress(0.0);
    } else {
      if (dialog.open) dialog.close();
      setIsPlaying(false);
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

    dialog.addEventListener('click', handleBackdrop);
    return () => dialog.removeEventListener('click', handleBackdrop);
  }, [isOpen, onClose]);

  // Three.js Mount Setup
  useEffect(() => {
    if (!isOpen || !mountRef.current) return;

    const width = mountRef.current.clientWidth || 800;
    const height = mountRef.current.clientHeight || 480;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#070a0f');
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    const center = new THREE.Vector3();
    stockBounds.getCenter(center);
    const size = stockBounds.getSize(new THREE.Vector3()).length();
    camera.position.set(center.x + size * 0.9, center.y + size * 0.8, center.z + size * 1.1);
    camera.lookAt(center);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.copy(center);
    controlsRef.current = controls;

    // Lighting
    const amb = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(amb);

    const dir1 = new THREE.DirectionalLight(0xffffff, 0.85);
    dir1.position.set(50, 80, 50);
    scene.add(dir1);

    const dir2 = new THREE.DirectionalLight(0x38bdf8, 0.45);
    dir2.position.set(-50, 40, -50);
    scene.add(dir2);

    // Coordinate Grid Helper
    const grid = new THREE.GridHelper(Math.max(100, size * 2), 20, 0x334155, 0x1e293b);
    grid.position.y = stockBounds.min.y;
    scene.add(grid);

    // Dynamic Tool Assembly Mesh
    const toolGroup = new THREE.Group();
    const cutterGeo = new THREE.CylinderGeometry(4, 4, 25, 16);
    const cutterMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 });
    const cutterMesh = new THREE.Mesh(cutterGeo, cutterMat);
    cutterMesh.position.y = 12.5;

    const holderGeo = new THREE.CylinderGeometry(14, 8, 30, 24);
    const holderMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.3 });
    const holderMesh = new THREE.Mesh(holderGeo, holderMat);
    holderMesh.position.y = 40;

    toolGroup.add(cutterMesh);
    toolGroup.add(holderMesh);
    scene.add(toolGroup);
    toolMeshRef.current = toolGroup;

    // Render loop
    const render = () => {
      controls.update();
      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(render);
    };
    render();

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
  }, [isOpen, stockBounds]);

  // Update Stock Mesh & Tool Position when Progress / Color / Clipping changes
  useEffect(() => {
    if (!sceneRef.current || !isOpen) return;

    // Simulate to current progress
    const tData = simulator.simulateToProgress(trajectory.waypoints, progress, tools);
    setTelemetry(tData);

    // Build or update carved stock mesh
    const clipSection = clipAxis !== 'off' ? { axis: clipAxis, value: clipValue } : null;
    const newMesh = simulator.buildMesh(colorMode, clipSection);

    if (stockMeshRef.current) {
      sceneRef.current.remove(stockMeshRef.current);
      if (stockMeshRef.current.geometry) stockMeshRef.current.geometry.dispose();
    }

    sceneRef.current.add(newMesh);
    stockMeshRef.current = newMesh;

    // Update Tool Assembly Position
    if (toolMeshRef.current && tData.currentPos) {
      toolMeshRef.current.position.set(tData.currentPos.x, tData.currentPos.y, tData.currentPos.z);
    }
  }, [progress, colorMode, clipAxis, clipValue, simulator, trajectory, tools, isOpen]);

  // Animation Playback Loop
  useEffect(() => {
    if (!isPlaying) {
      lastTimeRef.current = null;
      return;
    }

    let frameId;
    const animate = (time) => {
      if (lastTimeRef.current != null) {
        const deltaSec = (time - lastTimeRef.current) / 1000;
        // Total nominal cycle duration ~ 25s at 1x
        const advance = (deltaSec / 25) * speed;

        setProgress((prev) => {
          const next = prev + advance;
          if (next >= 1.0) {
            setIsPlaying(false);
            return 1.0;
          }
          return next;
        });
      }
      lastTimeRef.current = time;
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, speed]);

  // Export Carved Stock as STL
  const handleExportSTL = () => {
    const stlContent = simulator.exportSTL();
    const blob = new Blob([stlContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `argus_carved_stock_${Math.round(progress * 100)}pct.stl`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <dialog
      ref={dialogRef}
      id="solid-verify-modal-dialog"
      aria-labelledby="solid-verify-title"
      closedby="any"
      onClose={onClose}
    >
      <div className="modal-window" style={{ width: '960px', height: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: '#10b981', padding: '4px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}>
              <Box size={16} color="#ffffff" />
            </div>
            <div>
              <span id="solid-verify-title" style={{ fontWeight: 600, fontSize: '13.5px' }}>
                Solid Stock Material Removal Verification &bull; Real-Time Voxel Simulator
              </span>
              <span style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8' }}>
                Mastercam / Vericut Grade Dynamic Boolean Cutter Carving &bull; Gouge &amp; Tolerance Inspection
              </span>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close Dialog">
            <X size={15} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px', gap: '10px', overflow: 'hidden' }}>

          {/* Top Control Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0a0d14', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
            {/* Playback Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                className="btn-secondary"
                onClick={() => { setProgress(0); setIsPlaying(false); }}
                title="Rewind to Start"
                style={{ padding: '4px 8px' }}
              >
                <RotateCcw size={13} />
              </button>
              <button
                className="btn-secondary"
                onClick={() => setProgress((p) => Math.max(0, p - 0.05))}
                title="Step Backward"
                style={{ padding: '4px 8px' }}
              >
                <Rewind size={13} />
              </button>
              <button
                className="btn-primary"
                onClick={() => setIsPlaying(!isPlaying)}
                style={{ background: isPlaying ? '#ef4444' : '#10b981', padding: '5px 12px', minWidth: '75px' }}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>
              <button
                className="btn-secondary"
                onClick={() => setProgress((p) => Math.min(1, p + 0.05))}
                title="Step Forward"
                style={{ padding: '4px 8px' }}
              >
                <FastForward size={13} />
              </button>

              {/* Speed Preset Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginLeft: '8px' }}>
                <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>Speed:</span>
                {[0.5, 1.0, 2.0, 5.0, 10.0].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    style={{
                      fontSize: '10px',
                      padding: '2px 5px',
                      borderRadius: '3px',
                      background: speed === s ? '#38bdf8' : 'rgba(255,255,255,0.06)',
                      color: speed === s ? '#000' : '#cbd5e1',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: speed === s ? 700 : 400
                    }}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Color Mode & Section View */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>Render Mode:</span>
                <select
                  value={colorMode}
                  onChange={(e) => setColorMode(e.target.value)}
                  className="text-input"
                  style={{ fontSize: '11px', padding: '3px 8px', width: 'auto' }}
                >
                  <option value="tool">Color by Tool</option>
                  <option value="heatmap">Tolerance Heatmap</option>
                  <option value="metallic">Metallic Aluminum</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Scissors size={12} color="#f59e0b" />
                <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>Section Cut:</span>
                <select
                  value={clipAxis}
                  onChange={(e) => setClipAxis(e.target.value)}
                  className="text-input"
                  style={{ fontSize: '11px', padding: '3px 8px', width: 'auto' }}
                >
                  <option value="off">Off (Full Solid)</option>
                  <option value="x">X-Axis Cutaway</option>
                  <option value="z">Z-Axis Cutaway</option>
                </select>
              </div>

              <button
                className="btn-secondary"
                onClick={handleExportSTL}
                title="Export Carved Workpiece as STL"
                style={{ padding: '4px 10px', fontSize: '11px', gap: '4px' }}
              >
                <Download size={13} color="#10b981" />
                <span>Export STL</span>
              </button>
            </div>
          </div>

          {/* 3D Viewport Area */}
          <div style={{ flex: 1, position: 'relative', borderRadius: '6px', overflow: 'hidden', border: '1px solid #1e293b' }}>
            <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

            {/* In-Viewport Telemetry HUD Overlay */}
            <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(10, 13, 20, 0.85)', backdropFilter: 'blur(4px)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '10.5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '3px' }}>
                <span style={{ color: '#94a3b8', fontWeight: 600 }}>VOLUMETRIC REMOVAL</span>
                <span style={{ color: '#10b981', fontWeight: 700 }}>{telemetry.removedPct}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px' }}>
                <span style={{ color: '#cbd5e1' }}>Removed:</span>
                <strong style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{telemetry.removedVolumeCm3} cm&sup3;</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px' }}>
                <span style={{ color: '#cbd5e1' }}>Residual Stock:</span>
                <strong style={{ color: '#94a3b8', fontFamily: 'monospace' }}>{telemetry.residualVolumeCm3} cm&sup3;</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px' }}>
                <span style={{ color: '#cbd5e1' }}>Instant MRR:</span>
                <strong style={{ color: '#f59e0b', fontFamily: 'monospace' }}>{telemetry.instantaneousMRR} cm&sup3;/min</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px' }}>
                <span style={{ color: '#cbd5e1' }}>Gouges:</span>
                <strong style={{ color: telemetry.gougeCount > 0 ? '#ef4444' : '#10b981' }}>
                  {telemetry.gougeCount > 0 ? `${telemetry.gougeCount} GOUGES (${telemetry.maxGougeMm}mm)` : '0 (SAFE)'}
                </strong>
              </div>
            </div>

            {/* Position Display (Bottom Left) */}
            <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(10, 13, 20, 0.85)', padding: '4px 10px', borderRadius: '4px', fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}>
              X: <span style={{ color: '#f1f5f9' }}>{telemetry.currentPos.x}</span> &bull;
              Y: <span style={{ color: '#f1f5f9' }}>{telemetry.currentPos.y}</span> &bull;
              Z: <span style={{ color: '#f1f5f9' }}>{telemetry.currentPos.z}</span>
            </div>

            {/* Color Legend (Bottom Right) */}
            <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(10, 13, 20, 0.85)', padding: '6px 10px', borderRadius: '4px', fontSize: '10px', display: 'flex', gap: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              {colorMode === 'heatmap' ? (
                <>
                  <span style={{ color: '#ef4444', fontWeight: 700 }}>&bull; Gouge (&lt; -0.02mm)</span>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>&bull; Nominal (&plusmn;0.02mm)</span>
                  <span style={{ color: '#0284c7', fontWeight: 700 }}>&bull; Uncut Raw Stock</span>
                </>
              ) : colorMode === 'tool' ? (
                <>
                  <span style={{ color: '#64748b' }}>&bull; Raw Billet</span>
                  <span style={{ color: '#38bdf8' }}>&bull; T1</span>
                  <span style={{ color: '#f59e0b' }}>&bull; T2</span>
                  <span style={{ color: '#10b981' }}>&bull; T3</span>
                </>
              ) : (
                <span style={{ color: '#cbd5e1' }}>Billet: 6061-T6 Aluminum Specular PBR</span>
              )}
            </div>
          </div>

          {/* Bottom Scrubber & Progress Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: '#0a0d14', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
              <span>Simulation Progress: <strong style={{ color: '#f1f5f9' }}>{Math.round(progress * 100)}%</strong></span>
              <span>Total Trajectory Waypoints: <strong style={{ color: '#38bdf8' }}>{trajectory.waypoints.length}</strong></span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.002"
              value={progress}
              onChange={(e) => {
                setProgress(Number(e.target.value));
                setIsPlaying(false);
              }}
              style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }}
            />
          </div>

        </div>
      </div>
    </dialog>
  );
}

function boundsToMetrics(bounds) {
  if (!bounds || typeof bounds.getSize !== 'function') {
    return {
      dimensions: { x: 70, y: 25, z: 50 },
      min: { x: -35, y: 0, z: -25 },
      max: { x: 35, y: 25, z: 25 },
      bounds: {
        min: { x: -35, y: 0, z: -25 },
        max: { x: 35, y: 25, z: 25 }
      }
    };
  }
  const size = bounds.getSize(new THREE.Vector3());
  return {
    dimensions: { x: size.x, y: size.y, z: size.z },
    min: { x: bounds.min.x, y: bounds.min.y, z: bounds.min.z },
    max: { x: bounds.max.x, y: bounds.max.y, z: bounds.max.z },
    bounds: {
      min: { x: bounds.min.x, y: bounds.min.y, z: bounds.min.z },
      max: { x: bounds.max.x, y: bounds.max.y, z: bounds.max.z }
    }
  };
}

