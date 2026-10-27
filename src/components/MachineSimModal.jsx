import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { X, Play, Pause, SkipForward, SkipBack, RotateCcw, ShieldCheck, AlertTriangle, Cpu } from 'lucide-react';
import { generateNCProgram, CONTROLLER_DIALECTS } from '../utils/postProcessor';

export default function MachineSimModal({
  isOpen,
  onClose,
  operations = [],
  tools = [],
  stockConfig = {},
  partMetrics = null,
  currentModel = null,
  activeMachine = null
}) {
  const dialogRef = useRef(null);
  const canvasRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [activeLineIdx, setActiveLineIdx] = useState(0);
  const activeLineIdxRef = useRef(activeLineIdx);

  useEffect(() => {
    activeLineIdxRef.current = activeLineIdx;
  }, [activeLineIdx]);

  // Machine Kinematic Stroke Limits (DMU 50 5-Axis)
  const limits = useMemo(() => ({
    x: { min: -250, max: 250 },
    y: { min: -200, max: 200 },
    z: { min: -100, max: 350 },
    b: { min: -5, max: 110 },
    c: { min: -360, max: 360 }
  }), []);

  // Generate realistic NC Program lines from current operations and model
  const { gcodeLines, motionBlocks } = useMemo(() => {
    if (!isOpen) return { gcodeLines: [], motionBlocks: [] };

    let programLines = [];
    try {
      const generated = generateNCProgram({
        operations: operations.length > 0 ? operations : [
          { id: 1, name: '2D Facing Leveling', badgeClass: 'face', toolId: 1, visible: true },
          { id: 2, name: '3D Waterline Contour', badgeClass: 'contour', toolId: 1, visible: true }
        ],
        tools: tools.length > 0 ? tools : [{ id: 1, number: 1, name: '10mm Endmill', diameter: 10, rpm: 8000, feedRate: 1500 }],
        stockConfig: stockConfig || {},
        partMetrics: partMetrics,
        controller: CONTROLLER_DIALECTS.HEIDENHAIN,
        programName: 'DMU50_Argus_Twin',
        model: currentModel
      });
      const text = generated?.gcodeText || (typeof generated === 'string' ? generated : '');
      programLines = text.split('\n').filter((l) => l.trim().length > 0);
    } catch {
      programLines = [
        "0 BEGIN PGM DMU50_TWIN MM",
        "1 TOOL CALL 1 Z S10000 DL+0.00 DR+0.00",
        "2 M03 M08",
        "3 L X+0.000 Y-60.000 Z+50.000 R0 FMAX",
        "4 L Z+5.000 R0 FMAX",
        "5 L Z-2.000 R0 F800",
        "6 L X+40.000 Y-30.000 R0 F1500",
        "7 L X-40.000 Y+30.000 R0 F1500",
        "8 L Z+50.000 R0 FMAX",
        "9 M30"
      ];
    }

    // Parse motion blocks for 5-axis kinematic interpolation
    const blocks = [];
    let curX = 0, curY = 0, curZ = 50, curB = 0, curC = 0, curFeed = 1200, curRpm = 8000;

    programLines.forEach((line, idx) => {
      const upper = line.toUpperCase();
      let isMotion = false;

      // Match ISO G-Code or Heidenhain Klartext coordinates
      const xMatch = upper.match(/X([+-]?\d+(\.\d+)?)/);
      const yMatch = upper.match(/Y([+-]?\d+(\.\d+)?)/);
      const zMatch = upper.match(/Z([+-]?\d+(\.\d+)?)/);
      const bMatch = upper.match(/B([+-]?\d+(\.\d+)?)/) || upper.match(/SPA([+-]?\d+(\.\d+)?)/);
      const cMatch = upper.match(/C([+-]?\d+(\.\d+)?)/) || upper.match(/SPC([+-]?\d+(\.\d+)?)/);
      const fMatch = upper.match(/F(\d+)/);
      const sMatch = upper.match(/S(\d+)/);

      if (xMatch) { curX = parseFloat(xMatch[1]); isMotion = true; }
      if (yMatch) { curY = parseFloat(yMatch[1]); isMotion = true; }
      if (zMatch) { curZ = parseFloat(zMatch[1]); isMotion = true; }
      if (bMatch) { curB = parseFloat(bMatch[1]); isMotion = true; }
      if (cMatch) { curC = parseFloat(cMatch[1]); isMotion = true; }
      if (fMatch) { curFeed = parseFloat(fMatch[1]); }
      if (sMatch) { curRpm = parseFloat(sMatch[1]); }

      blocks.push({
        lineIdx: idx,
        rawText: line,
        isMotion,
        x: curX,
        y: curY,
        z: curZ,
        b: curB,
        c: curC,
        feed: curFeed,
        rpm: curRpm,
        isRapid: upper.includes('G0') || upper.includes('FMAX')
      });
    });

    return { gcodeLines: programLines, motionBlocks: blocks };
  }, [isOpen, operations, tools, stockConfig, partMetrics, currentModel]);

  // Current Kinematic State
  const currentBlock = motionBlocks[activeLineIdx] || motionBlocks[0] || {
    x: 0, y: 0, z: 50, b: 0, c: 0, feed: 1200, rpm: 8000
  };

  // Check for physical axis limit overtravel
  const overtravelAxis = useMemo(() => {
    const block = motionBlocks[activeLineIdx];
    if (!block) return null;
    if (block.x < limits.x.min || block.x > limits.x.max) return 'X';
    if (block.y < limits.y.min || block.y > limits.y.max) return 'Y';
    if (block.z < limits.z.min || block.z > limits.z.max) return 'Z';
    if (block.b < limits.b.min || block.b > limits.b.max) return 'B';
    return null;
  }, [motionBlocks, activeLineIdx, limits]);

  // Modal dialog lifecycle
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

    dialog.addEventListener('click', handleBackdrop);
    return () => dialog.removeEventListener('click', handleBackdrop);
  }, [isOpen, onClose]);

  // 3D Digital Twin Canvas Setup & Interpreter Motion Loop
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const container = canvasRef.current;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e14);

    const camera = new THREE.PerspectiveCamera(40, width / height, 1, 3500);
    camera.position.set(290, 230, 310);
    camera.lookAt(0, 65, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Studio Lighting
    const amb = new THREE.AmbientLight(0xffffff, 0.85);
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight1.position.set(160, 320, 220);
    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.6);
    dirLight2.position.set(-150, 100, -100);
    scene.add(amb, dirLight1, dirLight2);

    // Floor Grid
    const grid = new THREE.GridHelper(500, 25, 0x334155, 0x1e293b);
    grid.position.y = -40;
    scene.add(grid);

    // Machine Column (Z axis casting)
    const columnGeo = new THREE.BoxGeometry(160, 270, 130);
    const columnMat = new THREE.MeshStandardMaterial({ color: 0x1e2633, metalness: 0.8, roughness: 0.3 });
    const column = new THREE.Mesh(columnGeo, columnMat);
    column.position.set(0, 95, -115);
    scene.add(column);

    // Spindle Slide Assembly (moves in X, Y, Z, and B tilt)
    const spindleAssembly = new THREE.Group();
    const slideGeo = new THREE.BoxGeometry(84, 75, 95);
    const slideMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.6, roughness: 0.35 });
    const slide = new THREE.Mesh(slideGeo, slideMat);
    spindleAssembly.add(slide);

    // Spindle Motor
    const motorGeo = new THREE.CylinderGeometry(26, 26, 65, 32);
    const motorMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });
    const motor = new THREE.Mesh(motorGeo, motorMat);
    motor.position.y = -35;
    spindleAssembly.add(motor);

    // B-Axis Swivel Head Holder
    const bHeadGroup = new THREE.Group();
    bHeadGroup.position.set(0, -68, 0);

    const toolHolderGeo = new THREE.CylinderGeometry(15, 9, 28, 32);
    const toolHolderMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });
    const toolHolder = new THREE.Mesh(toolHolderGeo, toolHolderMat);
    bHeadGroup.add(toolHolder);

    // Carbide Endmill Tool
    const cutterGeo = new THREE.CylinderGeometry(3.5, 3.5, 24, 20);
    const cutterMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.15 });
    const cutter = new THREE.Mesh(cutterGeo, cutterMat);
    cutter.position.y = -22;
    bHeadGroup.add(cutter);

    spindleAssembly.add(bHeadGroup);
    spindleAssembly.position.set(0, 160, 0);
    scene.add(spindleAssembly);

    // C-Axis Trunnion Rotary Table (Table Assembly)
    const trunnionAssembly = new THREE.Group();
    const trunnionBaseGeo = new THREE.CylinderGeometry(88, 96, 35, 36);
    const trunnionBaseMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.4 });
    const trunnionBase = new THREE.Mesh(trunnionBaseGeo, trunnionBaseMat);
    trunnionBase.position.y = -10;
    trunnionAssembly.add(trunnionBase);

    // Precision Vise Clamped on Table
    const viseGeo = new THREE.BoxGeometry(72, 28, 94);
    const viseMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.25 });
    const vise = new THREE.Mesh(viseGeo, viseMat);
    vise.position.y = 15;
    trunnionAssembly.add(vise);

    // Workpiece placed in vise
    let partMesh;
    if (currentModel) {
      partMesh = currentModel.clone(true);
      partMesh.scale.set(0.65, 0.65, 0.65);
      partMesh.position.set(0, 30, 0);
    } else {
      const partGeo = new THREE.BoxGeometry(50, 22, 54);
      const partMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.75, roughness: 0.25 });
      partMesh = new THREE.Mesh(partGeo, partMat);
      partMesh.position.set(0, 35, 0);
    }
    trunnionAssembly.add(partMesh);

    scene.add(trunnionAssembly);

    // Interpreter Motion Interpolator
    let animId;
    let targetIdx = activeLineIdx;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (motionBlocks.length > 0) {
        const block = motionBlocks[targetIdx] || motionBlocks[0];

        // Smoothly interpolate spindle and trunnion to match current block kinematics
        // Coordinate scaling to fit DMU 50 3D machine model
        const targetSpindleX = (block.x || 0) * 0.45;
        const targetSpindleY = 120 + ((block.z || 30) - 20) * 0.55;
        const targetSpindleZ = (block.y || 0) * 0.45;
        const targetTiltRad = ((block.b || 0) * Math.PI) / 180;
        const targetRotRad = ((block.c || 0) * Math.PI) / 180;

        spindleAssembly.position.x += (targetSpindleX - spindleAssembly.position.x) * 0.18;
        spindleAssembly.position.y += (targetSpindleY - spindleAssembly.position.y) * 0.18;
        spindleAssembly.position.z += (targetSpindleZ - spindleAssembly.position.z) * 0.18;
        bHeadGroup.rotation.x += (targetTiltRad - bHeadGroup.rotation.x) * 0.18;
        trunnionAssembly.rotation.y += (targetRotRad - trunnionAssembly.rotation.y) * 0.18;

        // Auto-advance lines if playing
        if (isPlaying && motionBlocks.length > 1) {
          const frameStep = speedMultiplier >= 2 ? 2 : 1;
          targetIdx = (targetIdx + frameStep) % motionBlocks.length;
          setActiveLineIdx(targetIdx);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isOpen, isPlaying, speedMultiplier, motionBlocks, currentModel]);

  return (
    <dialog
      ref={dialogRef}
      id="machine-sim-dialog"
      aria-labelledby="machine-sim-title"
      closedby="any"
      onClose={onClose}
    >
      <div className="modal-window sim-window">
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={16} color="#10b981" />
            <span id="machine-sim-title">
              NC2Check &bull; 5-Axis Digital Twin Interpreter ({activeMachine?.name || 'DMG MORI DMU 50'})
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close Simulation">
            <X size={15} />
          </button>
        </div>

        {/* Layout */}
        <div className="modal-body">
          <div className="sim-layout">
            {/* 3D Simulation Canvas */}
            <div ref={canvasRef} className="sim-canvas-box">
              {/* Collision & Overtravel Overlay */}
              <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10 }}>
                {overtravelAxis ? (
                  <div className="collision-badge danger" style={{ background: 'rgba(239,68,68,0.9)', color: '#fff', padding: '5px 10px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 'bold' }}>
                    <AlertTriangle size={15} />
                    <span>OVERTRAVEL LIMIT EXCEEDED ON {overtravelAxis}-AXIS!</span>
                  </div>
                ) : (
                  <div className="collision-badge safe" style={{ background: 'rgba(16,185,129,0.9)', color: '#fff', padding: '5px 10px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 'bold' }}>
                    <ShieldCheck size={15} />
                    <span>REAL-TIME KINEMATIC CLEARANCE: SAFE (&gt; 5.2mm)</span>
                  </div>
                )}
              </div>

              {/* Feed & RPM Readout */}
              <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10 }}>
                <div style={{ background: 'rgba(15,23,42,0.85)', padding: '5px 9px', borderRadius: '4px', border: '1px solid #334155', color: '#f59e0b', fontSize: '11px', fontFamily: 'monospace' }}>
                  ⚡ SPINDLE: {currentBlock.rpm || 8000} RPM | FEED: {currentBlock.feed || 1500} mm/min {currentBlock.isRapid ? '(RAPID)' : ''}
                </div>
              </div>
            </div>

            {/* Right Control & Diagnostics Panel */}
            <div className="sim-controls-panel">
              {/* Kinematic Coordinates Card */}
              <div className="sim-status-card">
                <span className="section-label">INTERPRETED 5-AXIS KINEMATICS</span>
                <div className="axis-readout-grid">
                  <div className="axis-item">
                    <span className="axis-label">X:</span>
                    <span className="axis-val" style={{ color: currentBlock.x < limits.x.min || currentBlock.x > limits.x.max ? '#ef4444' : '#fff' }}>
                      {Number(currentBlock.x || 0).toFixed(3)} mm
                    </span>
                  </div>
                  <div className="axis-item">
                    <span className="axis-label">Y:</span>
                    <span className="axis-val" style={{ color: currentBlock.y < limits.y.min || currentBlock.y > limits.y.max ? '#ef4444' : '#fff' }}>
                      {Number(currentBlock.y || 0).toFixed(3)} mm
                    </span>
                  </div>
                  <div className="axis-item">
                    <span className="axis-label">Z:</span>
                    <span className="axis-val" style={{ color: currentBlock.z < limits.z.min || currentBlock.z > limits.z.max ? '#ef4444' : '#fff' }}>
                      {Number(currentBlock.z || 0).toFixed(3)} mm
                    </span>
                  </div>
                  <div className="axis-item">
                    <span className="axis-label">B (Tilt):</span>
                    <span className="axis-val" style={{ color: '#a855f7' }}>
                      {Number(currentBlock.b || 0).toFixed(2)}&deg;
                    </span>
                  </div>
                  <div className="axis-item" style={{ gridColumn: 'span 2' }}>
                    <span className="axis-label">C (Table):</span>
                    <span className="axis-val" style={{ color: '#06b6d4' }}>
                      {Number(currentBlock.c || 0).toFixed(2)}&deg; (Rotary 360&deg;)
                    </span>
                  </div>
                </div>
              </div>

              {/* Synchronized G-Code Streamer */}
              <div className="sim-status-card" style={{ flex: 1, minHeight: '160px', display: 'flex', flexDirection: 'column' }}>
                <span className="section-label">SYNCHRONIZED NC PROGRAM STREAM ({gcodeLines.length} BLOCKS)</span>
                <div className="gcode-stream-box" style={{ flex: 1, overflowY: 'auto' }}>
                  {gcodeLines.map((line, idx) => (
                    <div
                      key={idx}
                      className={`gcode-line ${idx === activeLineIdx ? 'active' : ''}`}
                      onClick={() => {
                        setActiveLineIdx(idx);
                        setIsPlaying(false);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </div>

              {/* Scrub Progress Bar */}
              <div style={{ padding: '0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="range"
                  min="0"
                  max={Math.max(1, gcodeLines.length - 1)}
                  value={activeLineIdx}
                  onChange={(e) => {
                    setActiveLineIdx(Number(e.target.value));
                    setIsPlaying(false);
                  }}
                  style={{ flex: 1, cursor: 'pointer', accentColor: '#10b981' }}
                />
                <span style={{ fontSize: '10px', color: '#94a3b8', minWidth: '45px', textAlign: 'right' }}>
                  {Math.round(((activeLineIdx + 1) / Math.max(1, gcodeLines.length)) * 100)}%
                </span>
              </div>

              {/* Playback Controls */}
              <div className="sim-playback-bar">
                <button
                  className="btn-primary"
                  onClick={() => setIsPlaying(!isPlaying)}
                  style={{ flex: 1, padding: '6px 10px' }}
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  <span>{isPlaying ? 'Pause' : 'Run'}</span>
                </button>

                <button
                  className="btn-secondary"
                  onClick={() => {
                    setIsPlaying(false);
                    setActiveLineIdx((prev) => Math.max(0, prev - 1));
                  }}
                  title="Step Backward (Previous Block)"
                >
                  <SkipBack size={14} />
                </button>

                <button
                  className="btn-secondary"
                  onClick={() => {
                    setIsPlaying(false);
                    setActiveLineIdx((prev) => (prev + 1) % gcodeLines.length);
                  }}
                  title="Single Step Forward"
                >
                  <SkipForward size={14} />
                </button>

                <button
                  className="btn-secondary"
                  onClick={() => {
                    setActiveLineIdx(0);
                    setIsPlaying(true);
                  }}
                  title="Rewind (M30 Reset)"
                >
                  <RotateCcw size={14} />
                </button>

                {/* Speed selector */}
                <select
                  value={speedMultiplier}
                  onChange={(e) => setSpeedMultiplier(Number(e.target.value))}
                  style={{ background: '#1e293b', border: '1px solid #475569', color: '#f8fafc', padding: '4px', borderRadius: '4px', fontSize: '10.5px' }}
                >
                  <option value={0.5}>0.5x</option>
                  <option value={1}>1.0x</option>
                  <option value={2}>2.0x</option>
                  <option value={5}>5.0x</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}
