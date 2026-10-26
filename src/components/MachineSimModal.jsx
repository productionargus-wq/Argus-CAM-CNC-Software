import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { X, Play, Pause, SkipForward, RotateCcw, ShieldCheck, AlertTriangle, Cpu, Gauge } from 'lucide-react';

export default function MachineSimModal({ isOpen, onClose }) {
  const dialogRef = useRef(null);
  const canvasRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [activeLineIdx, setActiveLineIdx] = useState(0);

  // Dynamic 5-Axis coordinates
  const [axisCoords, setAxisCoords] = useState({
    x: 120.45,
    y: -84.22,
    z: 45.8,
    b: 15.0,
    c: 45.3,
    feed: 1200,
    rpm: 12000
  });

  const gcodeLines = [
    "N10 ; --- DMU 50 EVO 5-AXIS HEADER ---",
    "N20 G90 G21 G17 G94 G54",
    "N30 T1 M6 ; 10MM BULLNOSE R1",
    "N40 S12000 M3 M8",
    "N50 TRAORI ; 5-AXIS TCP ENABLED",
    "N60 G0 X140.000 Y-95.000 Z120.000 B0.00 C0.00",
    "N70 G1 Z50.000 F3000",
    "N80 G1 X120.450 Y-84.220 Z45.800 B15.00 C45.30 F1200",
    "N90 G1 X115.200 Y-78.100 Z44.100 B18.50 C52.10",
    "N100 G1 X108.900 Y-69.400 Z42.500 B22.00 C60.40",
    "N110 G1 X95.300 Y-55.200 Z40.200 B25.00 C72.80",
    "N120 G1 X80.100 Y-40.000 Z38.900 B28.00 C88.50",
    "N130 G1 X62.400 Y-25.100 Z38.000 B30.00 C105.20",
    "N140 G1 X45.000 Y-10.000 Z37.500 B26.00 C120.00",
    "N150 G1 X20.000 Y15.000 Z37.000 B18.00 C145.00",
    "N160 G0 Z100.000",
    "N170 TRAFOOF ; TCP OFF",
    "N180 M5 M9",
    "N190 G0 Z250.000 B0.00 C0.00",
    "N200 M30"
  ];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
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

  // 3D Machine Simulation Canvas
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const container = canvasRef.current;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e1218);

    const camera = new THREE.PerspectiveCamera(40, width / height, 1, 3000);
    camera.position.set(280, 220, 320);
    camera.lookAt(0, 70, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lighting
    const amb = new THREE.AmbientLight(0xffffff, 0.8);
    const dir = new THREE.DirectionalLight(0xffffff, 1.3);
    dir.position.set(150, 300, 200);
    scene.add(amb, dir);

    // Floor Grid
    const grid = new THREE.GridHelper(500, 30, 0x334155, 0x1e293b);
    grid.position.y = -40;
    scene.add(grid);

    // Machine Column (Z axis column)
    const columnGeo = new THREE.BoxGeometry(160, 260, 120);
    const columnMat = new THREE.MeshStandardMaterial({ color: 0x1e2633, metalness: 0.8, roughness: 0.3 });
    const column = new THREE.Mesh(columnGeo, columnMat);
    column.position.set(0, 90, -110);
    scene.add(column);

    // Spindle Slide (moving Z)
    const spindleGroup = new THREE.Group();
    const slideGeo = new THREE.BoxGeometry(80, 70, 90);
    const slideMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.6, roughness: 0.4 });
    const slide = new THREE.Mesh(slideGeo, slideMat);
    spindleGroup.add(slide);

    // Spindle Motor Cylinder
    const motorGeo = new THREE.CylinderGeometry(24, 24, 60, 32);
    const motorMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });
    const motor = new THREE.Mesh(motorGeo, motorMat);
    motor.position.y = -35;
    spindleGroup.add(motor);

    // Tool Holder & Cutter (B-Axis tilt)
    const toolHolderGeo = new THREE.CylinderGeometry(14, 8, 25, 32);
    const toolHolderMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });
    const toolHolder = new THREE.Mesh(toolHolderGeo, toolHolderMat);
    toolHolder.position.y = -70;
    spindleGroup.add(toolHolder);

    const cutterGeo = new THREE.CylinderGeometry(3, 3, 20, 16);
    const cutterMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
    const cutter = new THREE.Mesh(cutterGeo, cutterMat);
    cutter.position.y = -85;
    spindleGroup.add(cutter);

    spindleGroup.position.set(0, 160, 0);
    scene.add(spindleGroup);

    // C-Axis Trunnion Table (Rotary Table)
    const trunnionGroup = new THREE.Group();
    const trunnionBaseGeo = new THREE.CylinderGeometry(85, 95, 35, 36);
    const trunnionBaseMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.4 });
    const trunnionBase = new THREE.Mesh(trunnionBaseGeo, trunnionBaseMat);
    trunnionBase.position.y = -10;
    trunnionGroup.add(trunnionBase);

    // Vise on Rotary Table
    const viseGeo = new THREE.BoxGeometry(70, 30, 90);
    const viseMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
    const vise = new THREE.Mesh(viseGeo, viseMat);
    vise.position.y = 15;
    trunnionGroup.add(vise);

    // Part in Vise
    const partGeo = new THREE.BoxGeometry(45, 20, 50);
    const partMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.7, roughness: 0.2 });
    const part = new THREE.Mesh(partGeo, partMat);
    part.position.y = 35;
    trunnionGroup.add(part);

    scene.add(trunnionGroup);

    // Animation Loop
    let time = 0;
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (isPlaying) {
        time += 0.02 * speedMultiplier;

        // Kinematics Calculation:
        // C-Axis rotary motion
        trunnionGroup.rotation.y = Math.sin(time) * 0.8;
        // B-Axis head tilting
        spindleGroup.rotation.x = Math.sin(time * 0.7) * 0.25;
        // Spindle Z plunge
        spindleGroup.position.y = 145 + Math.sin(time * 1.5) * 15;
        // X and Y motion
        spindleGroup.position.x = Math.cos(time) * 20;

        // Update real coordinates for UI
        setAxisCoords({
          x: (spindleGroup.position.x * 2.5).toFixed(3),
          y: (Math.sin(time * 0.9) * 45).toFixed(3),
          z: (spindleGroup.position.y - 100).toFixed(3),
          b: ((spindleGroup.rotation.x * 180) / Math.PI).toFixed(2),
          c: ((trunnionGroup.rotation.y * 180) / Math.PI).toFixed(2),
          feed: (1200 + Math.sin(time) * 200).toFixed(0),
          rpm: 12000
        });

        // Advance G-code line
        setActiveLineIdx((prev) => (prev + 1) % gcodeLines.length);
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
  }, [isOpen, isPlaying, speedMultiplier]);

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
            <span id="machine-sim-title">NC2Check &bull; 5-Axis Digital Twin Simulation (DMU 50 evo)</span>
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
              {/* Collision Indicator overlay */}
              <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10 }}>
                <div className="collision-badge safe">
                  <ShieldCheck size={16} />
                  <span>0 COLLISIONS DETECTED (Safe Clearance &gt; 4.8mm)</span>
                </div>
              </div>

              {/* Spindle RPM overlay */}
              <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10 }}>
                <div style={{ background: 'rgba(15,23,42,0.8)', padding: '4px 8px', borderRadius: '4px', border: '1px solid #334155', color: '#f59e0b', fontSize: '11px', fontFamily: 'monospace' }}>
                  ⚡ SPINDLE: {axisCoords.rpm} RPM | F: {axisCoords.feed} mm/min
                </div>
              </div>
            </div>

            {/* Right Control & Diagnostics Panel */}
            <div className="sim-controls-panel">
              {/* Axis Readouts Card */}
              <div className="sim-status-card">
                <span className="section-label">KINEMATICS AXIS COORDINATES</span>
                <div className="axis-readout-grid">
                  <div className="axis-item">
                    <span className="axis-label">X:</span>
                    <span className="axis-val">{axisCoords.x} mm</span>
                  </div>
                  <div className="axis-item">
                    <span className="axis-label">Y:</span>
                    <span className="axis-val">{axisCoords.y} mm</span>
                  </div>
                  <div className="axis-item">
                    <span className="axis-label">Z:</span>
                    <span className="axis-val">{axisCoords.z} mm</span>
                  </div>
                  <div className="axis-item">
                    <span className="axis-label">B (Tilt):</span>
                    <span className="axis-val" style={{ color: '#a855f7' }}>{axisCoords.b}&deg;</span>
                  </div>
                  <div className="axis-item" style={{ gridColumn: 'span 2' }}>
                    <span className="axis-label">C (Table):</span>
                    <span className="axis-val" style={{ color: '#06b6d4' }}>{axisCoords.c}&deg; (360&deg; Cont.)</span>
                  </div>
                </div>
              </div>

              {/* Synchronized G-Code Streamer */}
              <div className="sim-status-card" style={{ flex: 1 }}>
                <span className="section-label">NC PROGRAM EXECUTION (DMU_50.H)</span>
                <div className="gcode-stream-box">
                  {gcodeLines.map((line, idx) => (
                    <div
                      key={idx}
                      className={`gcode-line ${idx === activeLineIdx ? 'active' : ''}`}
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </div>

              {/* Playback Controls */}
              <div className="sim-playback-bar">
                <button
                  className="btn-primary"
                  onClick={() => setIsPlaying(!isPlaying)}
                  style={{ flex: 1, padding: '6px 10px' }}
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  <span>{isPlaying ? 'Pause' : 'Resume'}</span>
                </button>

                <button
                  className="btn-secondary"
                  onClick={() => setActiveLineIdx((prev) => (prev + 1) % gcodeLines.length)}
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
                  title="Reset to Start"
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
