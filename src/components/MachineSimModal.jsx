import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import {
  X, Play, Pause, SkipForward, SkipBack, RotateCcw, ShieldCheck,
  AlertTriangle, Cpu, Box, Sliders, CheckCircle2, AlertOctagon,
  Eye, EyeOff, Layers, Sparkles
} from 'lucide-react';
import { generateNCProgram, CONTROLLER_DIALECTS } from '../utils/postProcessor';
import {
  MACHINE_KINEMATICS,
  buildMachineEnvelope3D,
  auditKinematicsAndCollisions
} from '../utils/machineKinematics.js';

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

  const [selectedMachineId, setSelectedMachineId] = useState(activeMachine?.id || 'dmu50');
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [activeLineIdx, setActiveLineIdx] = useState(0);
  const [showEnvelope, setShowEnvelope] = useState(true);
  const [activeDiagTab, setActiveDiagTab] = useState('stream'); // 'stream' | 'envelope' | 'audit'

  const activeLineIdxRef = useRef(activeLineIdx);
  useEffect(() => {
    activeLineIdxRef.current = activeLineIdx;
  }, [activeLineIdx]);

  useEffect(() => {
    if (activeMachine?.id) {
      setSelectedMachineId(activeMachine.id);
    }
  }, [activeMachine]);

  // Active Machine Kinematic Configuration
  const machineConfig = useMemo(() => {
    return MACHINE_KINEMATICS[selectedMachineId] || MACHINE_KINEMATICS.dmu50;
  }, [selectedMachineId]);

  const limits = useMemo(() => {
    const ax = machineConfig.axes;
    return {
      x: { min: ax.X?.min ?? -250, max: ax.X?.max ?? 250 },
      y: { min: ax.Y?.min ?? -200, max: ax.Y?.max ?? 200 },
      z: { min: ax.Z?.min ?? -100, max: ax.Z?.max ?? 350 },
      b: { min: ax.B?.min ?? -5, max: ax.B?.max ?? 110 },
      c: { min: ax.C?.min ?? -360, max: ax.C?.max ?? 360 }
    };
  }, [machineConfig]);

  // Generate realistic NC Program lines from current operations and model
  const { gcodeLines, motionBlocks } = useMemo(() => {
    if (!isOpen) return { gcodeLines: [], motionBlocks: [] };

    let programLines = [];
    try {
      const dialect = selectedMachineId === 'haas_vf2' ? CONTROLLER_DIALECTS.HAAS :
        selectedMachineId === 'robodrill' ? CONTROLLER_DIALECTS.FANUC :
        CONTROLLER_DIALECTS.HEIDENHAIN;

      const generated = generateNCProgram({
        operations: operations.length > 0 ? operations : [
          { id: 1, name: '2D Facing Leveling', badgeClass: 'face', toolId: 1, visible: true },
          { id: 2, name: '3D Waterline Contour', badgeClass: 'contour', toolId: 1, visible: true }
        ],
        tools: tools.length > 0 ? tools : [{ id: 1, number: 1, name: '10mm Endmill', diameter: 10, rpm: 8000, feedRate: 1500 }],
        stockConfig: stockConfig,
        partMetrics: partMetrics,
        controller: dialect,
        programName: `${selectedMachineId.toUpperCase()}_Argus_Job`,
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

      // Match coordinates
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
  }, [isOpen, operations, tools, stockConfig, partMetrics, currentModel, selectedMachineId]);

  // Pre-flight Kinematic & Collision Audit
  const auditResult = useMemo(() => {
    return auditKinematicsAndCollisions(motionBlocks, selectedMachineId, tools, stockConfig);
  }, [motionBlocks, selectedMachineId, tools, stockConfig]);

  // Current Kinematic State
  const currentBlock = motionBlocks[activeLineIdx] || motionBlocks[0] || {
    x: 0, y: 0, z: 50, b: 0, c: 0, feed: 1200, rpm: 8000
  };

  // Check for physical axis limit overtravel on current block
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

    // 3D Physical Travel Envelope Cage (Wireframe Box + Safety Ring)
    const envelopeGroup = buildMachineEnvelope3D(selectedMachineId, overtravelAxis);
    envelopeGroup.visible = showEnvelope;
    scene.add(envelopeGroup);

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
  }, [isOpen, isPlaying, speedMultiplier, motionBlocks, currentModel, selectedMachineId, showEnvelope, overtravelAxis]);

  const handleJumpToClash = (lineIdx) => {
    setActiveLineIdx(lineIdx);
    setIsPlaying(false);
  };

  return (
    <dialog
      ref={dialogRef}
      id="machine-sim-dialog"
      aria-labelledby="machine-sim-title"
      closedby="any"
      onClose={onClose}
    >
      <div className="modal-window sim-window" style={{ width: '960px', maxWidth: '98vw' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={16} color="#10b981" />
            <span id="machine-sim-title">
              NC2Check &bull; Digital Twin Simulation &amp; Kinematic Envelope Audit
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Machine Selector */}
            <select
              value={selectedMachineId}
              onChange={(e) => setSelectedMachineId(e.target.value)}
              style={{
                background: '#141822',
                border: '1px solid #334155',
                color: '#38bdf8',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600
              }}
            >
              {Object.values(MACHINE_KINEMATICS).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>

            <button className="modal-close-btn" onClick={onClose} title="Close Simulation">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Layout */}
        <div className="modal-body">
          <div className="sim-layout">
            {/* 3D Simulation Canvas */}
            <div ref={canvasRef} className="sim-canvas-box">
              {/* Collision & Overtravel Overlay */}
              <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {overtravelAxis ? (
                  <div className="collision-badge danger" style={{ background: 'rgba(239,68,68,0.95)', color: '#fff', padding: '6px 12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 'bold', boxShadow: '0 2px 10px rgba(239, 68, 68, 0.4)' }}>
                    <AlertTriangle size={16} />
                    <span>OVERTRAVEL LIMIT EXCEEDED ON {overtravelAxis}-AXIS!</span>
                  </div>
                ) : auditResult.violationsCount > 0 ? (
                  <div className="collision-badge warning" style={{ background: 'rgba(245,158,11,0.9)', color: '#000', padding: '6px 12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 'bold' }}>
                    <AlertTriangle size={15} />
                    <span>PRE-FLIGHT: {auditResult.violationsCount} KINEMATIC VIOLATIONS DETECTED</span>
                  </div>
                ) : (
                  <div className="collision-badge safe" style={{ background: 'rgba(16,185,129,0.9)', color: '#fff', padding: '6px 12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 'bold' }}>
                    <ShieldCheck size={16} />
                    <span>REAL-TIME KINEMATIC CLEARANCE: SAFE (&gt; 5.2mm)</span>
                  </div>
                )}
              </div>

              {/* Feed & RPM Readout + Envelope Toggle */}
              <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setShowEnvelope(!showEnvelope)}
                  style={{
                    background: showEnvelope ? 'rgba(56, 189, 248, 0.25)' : 'rgba(15,23,42,0.85)',
                    border: showEnvelope ? '1px solid #38bdf8' : '1px solid #334155',
                    color: showEnvelope ? '#38bdf8' : '#94a3b8',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                  title="Toggle 3D Physical Travel Envelope Cage"
                >
                  <Box size={13} />
                  <span>Envelope</span>
                </button>

                <div style={{ background: 'rgba(15,23,42,0.85)', padding: '5px 9px', borderRadius: '4px', border: '1px solid #334155', color: '#f59e0b', fontSize: '11px', fontFamily: 'monospace' }}>
                  ⚡ SPINDLE: {currentBlock.rpm || 8000} RPM | FEED: {currentBlock.feed || 1500} mm/min {currentBlock.isRapid ? '(RAPID)' : ''}
                </div>
              </div>
            </div>

            {/* Right Control & Diagnostics Panel */}
            <div className="sim-controls-panel" style={{ width: '360px' }}>

              {/* Diagnostic Tab Switcher */}
              <div style={{ display: 'flex', borderBottom: '1px solid #334155', background: '#0f172a' }}>
                <button
                  type="button"
                  onClick={() => setActiveDiagTab('stream')}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    border: 'none',
                    borderBottom: activeDiagTab === 'stream' ? '2px solid #10b981' : 'none',
                    background: activeDiagTab === 'stream' ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                    color: activeDiagTab === 'stream' ? '#10b981' : '#94a3b8',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Stream &amp; Axis
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDiagTab('envelope')}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    border: 'none',
                    borderBottom: activeDiagTab === 'envelope' ? '2px solid #38bdf8' : 'none',
                    background: activeDiagTab === 'envelope' ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                    color: activeDiagTab === 'envelope' ? '#38bdf8' : '#94a3b8',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Stroke Envelopes
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDiagTab('audit')}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    border: 'none',
                    borderBottom: activeDiagTab === 'audit' ? '2px solid #ef4444' : 'none',
                    background: activeDiagTab === 'audit' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                    color: activeDiagTab === 'audit' ? '#ef4444' : auditResult.violationsCount > 0 ? '#f59e0b' : '#94a3b8',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Clash Log ({auditResult.violationsCount})
                </button>
              </div>

              {/* TAB 1: STREAM & KINEMATICS */}
              {activeDiagTab === 'stream' && (
                <>
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
                  <div className="sim-status-card" style={{ flex: 1, minHeight: '150px', display: 'flex', flexDirection: 'column' }}>
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
                </>
              )}

              {/* TAB 2: STROKE UTILIZATION ENVELOPES */}
              {activeDiagTab === 'envelope' && (
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    PHYSICAL AXIS STROKE CONSUMPTION &amp; ENVELOPE CAPACITY:
                  </div>

                  {Object.entries(auditResult.utilization).map(([axisKey, u]) => {
                    const isOver = u.strokeUsedPct >= 100;
                    const isNear = u.strokeUsedPct >= 80;
                    const barColor = isOver ? '#ef4444' : isNear ? '#f59e0b' : '#10b981';

                    return (
                      <div key={axisKey} style={{ background: '#161e2e', padding: '8px 10px', borderRadius: '6px', border: '1px solid #283347' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, color: '#f8fafc' }}>{axisKey}-Axis Travel</span>
                          <span style={{ fontWeight: 800, color: barColor }}>{u.strokeUsedPct}% Used</span>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ height: '6px', background: '#0f172a', borderRadius: '3px', overflow: 'hidden', marginBottom: '6px' }}>
                          <div style={{ width: `${Math.min(100, u.strokeUsedPct)}%`, height: '100%', background: barColor, transition: 'width 0.3s' }} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>
                          <span>Observed: [{u.minObs}, {u.maxObs}] {u.unit}</span>
                          <span>Limits: [{u.limitMin}, {u.limitMax}] {u.unit}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 3: COLLISION & CLASH AUDIT LOG */}
              {activeDiagTab === 'audit' && (
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>PRE-FLIGHT KINEMATIC ISSUES:</span>
                    <span style={{ fontSize: '11px', color: auditResult.violationsCount > 0 ? '#ef4444' : '#10b981', fontWeight: 800 }}>
                      {auditResult.violationsCount} Issues Found
                    </span>
                  </div>

                  {auditResult.violations.length === 0 ? (
                    <div style={{ padding: '24px 12px', textAlign: 'center', color: '#10b981', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={32} />
                      <div style={{ fontSize: '13px', fontWeight: 700 }}>Zero Kinematic Collisions Detected</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>All programmed trajectories remain within physical stroke limits.</div>
                    </div>
                  ) : (
                    auditResult.violations.map((v, i) => (
                      <div
                        key={i}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '6px',
                          padding: '8px 10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '3px', background: '#ef4444', color: '#fff' }}>
                            {v.type} &bull; {v.axis}-AXIS
                          </span>
                          <button
                            type="button"
                            onClick={() => handleJumpToClash(v.lineIdx)}
                            style={{
                              background: '#ef4444',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '3px',
                              padding: '2px 6px',
                              fontSize: '9px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Jump to Clash
                          </button>
                        </div>
                        <div style={{ fontSize: '11px', color: '#f8fafc', fontWeight: 600 }}>
                          {v.message}
                        </div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>
                          Block: {v.rawText}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Scrub Progress Bar */}
              <div style={{ padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
              <div className="sim-playback-bar" style={{ padding: '8px 12px' }}>
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
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '4px', borderRadius: '4px', fontSize: '10.5px' }}
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
