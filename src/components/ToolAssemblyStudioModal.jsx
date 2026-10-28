import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  X, Wrench, Sliders, ShieldCheck, AlertTriangle, CheckCircle2,
  Plus, Check, Sparkles, RefreshCw, Layers, Compass, ArrowUpRight, Zap
} from 'lucide-react';
import {
  TOOL_TYPES,
  HOLDER_TAPERS,
  CHUCK_TYPES,
  TOOL_PRESETS,
  build3DToolAssembly,
  auditHolderClearance
} from '../utils/toolAssemblyEngine.js';

export default function ToolAssemblyStudioModal({
  isOpen,
  onClose,
  tools = [],
  activeToolId = null,
  partMetrics = null,
  onSaveTool,
  onAddTool
}) {
  const dialogRef = useRef(null);
  const mountRef = useRef(null);

  // Form State
  const [name, setName] = useState('12mm Carbide Rougher BT40-ER32');
  const [type, setType] = useState('flat');
  const [diameter, setDiameter] = useState(12.0);
  const [fluteLength, setFluteLength] = useState(32.0);
  const [overallLength, setOverallLength] = useState(83.0);
  const [shankDia, setShankDia] = useState(12.0);
  const [overhang, setOverhang] = useState(45.0);
  const [cornerRad, setCornerRad] = useState(1.0);
  const [taperAngleDeg, setTaperAngleDeg] = useState(3.0);
  const [dovetailAngle, setDovetailAngle] = useState(45);
  const [neckDia, setNeckDia] = useState(6.0);
  const [neckLength, setNeckLength] = useState(25.0);
  const [pointAngle, setPointAngle] = useState(140);
  const [taperId, setTaperId] = useState('bt40');
  const [chuckId, setChuckId] = useState('er32');
  const [coating, setCoating] = useState('AlTiN');

  // Spindle speeds & feeds defaults
  const [rpm, setRpm] = useState(6500);
  const [feedRate, setFeedRate] = useState(1800);

  // Three.js Scene Refs
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const toolGroupRef = useRef(null);
  const animFrameRef = useRef(null);

  // Maximum cavity cut depth from part metrics
  const maxPartDepth = useMemo(() => {
    if (partMetrics?.dimensions?.y) {
      return Number(partMetrics.dimensions.y.toFixed(1));
    }
    return 25.0;
  }, [partMetrics]);

  // Load active tool when opened
  useEffect(() => {
    if (activeToolId && tools.length > 0) {
      const active = tools.find((t) => t.id === activeToolId);
      if (active) {
        setName(active.name || 'Custom Tool Assembly');
        setType(active.type || 'flat');
        setDiameter(active.diameter || 10.0);
        setFluteLength(active.fluteLength || 25.0);
        setOverallLength(active.overallLength || 75.0);
        setShankDia(active.shankDia || active.diameter || 10.0);
        setOverhang(active.overhang || 45.0);
        setCornerRad(active.cornerRad || 0.0);
        setTaperId(active.taperId || 'bt40');
        setChuckId(active.chuckId || 'er32');
        setRpm(active.rpm || 6000);
        setFeedRate(active.feedRate || 1200);
      }
    }
  }, [isOpen, activeToolId, tools]);

  // Modal backdrop handling
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

  // Calculate Clearance Audit
  const audit = useMemo(() => {
    return auditHolderClearance({
      overhang,
      diameter,
      chuck: chuckId
    }, partMetrics, maxPartDepth);
  }, [overhang, diameter, chuckId, partMetrics, maxPartDepth]);

  // Three.js Mount Setup
  useEffect(() => {
    if (!isOpen || !mountRef.current) return;

    const width = mountRef.current.clientWidth || 360;
    const height = mountRef.current.clientHeight || 450;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#070a10');
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.5, 1000);
    camera.position.set(110, 85, 130);
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
    controls.target.set(0, 60, 0);
    controlsRef.current = controls;

    // Lighting
    const amb = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(amb);

    const dir1 = new THREE.DirectionalLight(0xffffff, 0.95);
    dir1.position.set(60, 100, 60);
    scene.add(dir1);

    const dir2 = new THREE.DirectionalLight(0x38bdf8, 0.45);
    dir2.position.set(-60, 30, -60);
    scene.add(dir2);

    // Floor Reference Grid
    const grid = new THREE.GridHelper(180, 18, 0x334155, 0x1e293b);
    grid.position.y = 0;
    scene.add(grid);

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
  }, [isOpen]);

  // Update 3D Assembly Mesh when configuration changes
  useEffect(() => {
    if (!sceneRef.current || !isOpen) return;

    if (toolGroupRef.current) {
      sceneRef.current.remove(toolGroupRef.current);
    }

    const assembly = build3DToolAssembly({
      type,
      diameter,
      fluteLength,
      overallLength,
      shankDia,
      overhang,
      cornerRad,
      taperAngleDeg,
      dovetailAngle,
      neckDia,
      neckLength,
      pointAngle,
      taperId,
      chuckId,
      coating
    });

    sceneRef.current.add(assembly);
    toolGroupRef.current = assembly;
  }, [
    isOpen, type, diameter, fluteLength, overallLength, shankDia, overhang,
    cornerRad, taperAngleDeg, dovetailAngle, neckDia, neckLength, pointAngle,
    taperId, chuckId, coating
  ]);

  // Load Preset
  const handleLoadPreset = (preset) => {
    setName(preset.name);
    setType(preset.type);
    setDiameter(preset.diameter);
    setFluteLength(preset.fluteLength);
    setOverallLength(preset.overallLength);
    setShankDia(preset.shankDia);
    setOverhang(preset.overhang);
    setTaperId(preset.taper);
    setChuckId(preset.chuck);
    setRpm(preset.rpm);
    setFeedRate(preset.feedRate);
    if (preset.cornerRad !== undefined) setCornerRad(preset.cornerRad);
    if (preset.taperAngleDeg !== undefined) setTaperAngleDeg(preset.taperAngleDeg);
    if (preset.dovetailAngle !== undefined) setDovetailAngle(preset.dovetailAngle);
    if (preset.neckDia !== undefined) setNeckDia(preset.neckDia);
    if (preset.neckLength !== undefined) setNeckLength(preset.neckLength);
    if (preset.coating !== undefined) setCoating(preset.coating);
  };

  const handleApplyToActiveTool = () => {
    const updated = {
      id: activeToolId || tools[0]?.id || 1,
      name,
      type,
      diameter: Number(diameter),
      fluteLength: Number(fluteLength),
      overallLength: Number(overallLength),
      shankDia: Number(shankDia),
      overhang: Number(overhang),
      cornerRad: Number(cornerRad),
      taperId,
      chuckId,
      coating,
      rpm: Number(rpm),
      feedRate: Number(feedRate)
    };
    if (onSaveTool) onSaveTool(updated);
    onClose();
  };

  const handleSaveAsNew = () => {
    const newTool = {
      id: Date.now(),
      number: tools.length + 1,
      name,
      type,
      diameter: Number(diameter),
      fluteLength: Number(fluteLength),
      overallLength: Number(overallLength),
      shankDia: Number(shankDia),
      overhang: Number(overhang),
      cornerRad: Number(cornerRad),
      taperId,
      chuckId,
      coating,
      rpm: Number(rpm),
      feedRate: Number(feedRate)
    };
    if (onAddTool) onAddTool(newTool);
    onClose();
  };

  const selectedChuck = CHUCK_TYPES[chuckId.toUpperCase()] || CHUCK_TYPES.ER32;

  return (
    <dialog
      ref={dialogRef}
      id="tool-assembly-studio-dialog"
      aria-labelledby="tool-assembly-title"
      closedby="any"
      onClose={onClose}
    >
      <div className="modal-window" style={{ width: '980px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: '#0284c7', padding: '4px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}>
              <Wrench size={16} color="#ffffff" />
            </div>
            <div>
              <span id="tool-assembly-title" style={{ fontWeight: 600, fontSize: '13.5px' }}>
                Parametric Custom Tool &amp; Toolholder Assembly Studio
              </span>
              <span style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8' }}>
                Mastercam / NX Grade 3D Form Cutters &bull; Spindle Tapers &bull; Cavity Clearance Collision Auditor
              </span>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close Dialog">
            <X size={15} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', padding: '14px' }}>

          {/* Quick Preset Selector Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            <span style={{ fontSize: '10.5px', color: '#94a3b8', whiteSpace: 'nowrap', marginRight: '4px' }}>
              Industrial Presets:
            </span>
            {TOOL_PRESETS.map((p) => (
              <button
                key={p.id}
                className="btn-secondary"
                onClick={() => handleLoadPreset(p)}
                style={{ fontSize: '10px', padding: '3px 8px', whiteSpace: 'nowrap', gap: '4px' }}
              >
                <Sparkles size={11} color="#f59e0b" />
                <span>{p.name.split(' in ')[0]}</span>
              </button>
            ))}
          </div>

          {/* Main 2-Column Layout: Controls (Left) & 3D Interactive Viewport (Right) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>

            {/* Left Column: Form Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* Tool Identity */}
              <div className="nc2check-section">
                <div className="section-label">TOOL IDENTITY &amp; CUTTER TYPE</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label>Tool Assembly Description:</label>
                    <input
                      type="text"
                      className="text-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Cutter Profile Type:</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="text-input"
                    >
                      {Object.values(TOOL_TYPES).map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Parametric Cutter Dimensions */}
              <div className="nc2check-section">
                <div className="section-label">PARAMETRIC CUTTER GEOMETRY (mm)</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div className="form-group">
                    <label>Cutting Diameter &Oslash;:</label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      className="text-input"
                      value={diameter}
                      onChange={(e) => setDiameter(Number(e.target.value))}
                    />
                  </div>

                  <div className="form-group">
                    <label>Flute Length (Lc):</label>
                    <input
                      type="number"
                      step="1"
                      min="2"
                      className="text-input"
                      value={fluteLength}
                      onChange={(e) => setFluteLength(Number(e.target.value))}
                    />
                  </div>

                  <div className="form-group">
                    <label>Shank Diameter &Oslash;:</label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      className="text-input"
                      value={shankDia}
                      onChange={(e) => setShankDia(Number(e.target.value))}
                    />
                  </div>

                  {/* Conditional type-specific inputs */}
                  {type === 'bull' && (
                    <div className="form-group">
                      <label>Corner Radius (R):</label>
                      <input
                        type="number"
                        step="0.25"
                        min="0.2"
                        className="text-input"
                        value={cornerRad}
                        onChange={(e) => setCornerRad(Number(e.target.value))}
                      />
                    </div>
                  )}

                  {type === 'tapered' && (
                    <div className="form-group">
                      <label>Draft Angle (&deg;):</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="45"
                        className="text-input"
                        value={taperAngleDeg}
                        onChange={(e) => setTaperAngleDeg(Number(e.target.value))}
                      />
                    </div>
                  )}

                  {type === 'dovetail' && (
                    <div className="form-group">
                      <label>Dovetail Angle (&deg;):</label>
                      <input
                        type="number"
                        step="5"
                        className="text-input"
                        value={dovetailAngle}
                        onChange={(e) => setDovetailAngle(Number(e.target.value))}
                      />
                    </div>
                  )}

                  {(type === 'dovetail' || type === 'lollipop') && (
                    <div className="form-group">
                      <label>Neck Diameter &Oslash;:</label>
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        className="text-input"
                        value={neckDia}
                        onChange={(e) => setNeckDia(Number(e.target.value))}
                      />
                    </div>
                  )}

                  {type === 'drill' && (
                    <div className="form-group">
                      <label>Point Angle (&deg;):</label>
                      <input
                        type="number"
                        step="1"
                        className="text-input"
                        value={pointAngle}
                        onChange={(e) => setPointAngle(Number(e.target.value))}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label>PVD Coating:</label>
                    <select
                      value={coating}
                      onChange={(e) => setCoating(e.target.value)}
                      className="text-input"
                    >
                      <option value="AlTiN">AlTiN (Dark Blue - General Steel/Inox)</option>
                      <option value="TiN">TiN (Gold - Aluminum/Plastics)</option>
                      <option value="TiSiN">TiSiN (Copper Red - Hardened &gt;55HRC)</option>
                      <option value="DLC">DLC Diamond-Like (Graphite &amp; Composites)</option>
                      <option value="Uncoated">Bright Carbide (Mirror Polish)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Toolholder Assembly & Chuck Interface */}
              <div className="nc2check-section">
                <div className="section-label">TOOLHOLDER &amp; COLLET CHUCK ASSEMBLY</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label>Machine Spindle Taper:</label>
                    <select
                      value={taperId}
                      onChange={(e) => setTaperId(e.target.value)}
                      className="text-input"
                    >
                      {Object.values(HOLDER_TAPERS).map((tp) => (
                        <option key={tp.id} value={tp.id}>
                          {tp.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Chuck Clamping Style:</label>
                    <select
                      value={chuckId}
                      onChange={(e) => setChuckId(e.target.value)}
                      className="text-input"
                    >
                      {Object.values(CHUCK_TYPES).map((ck) => (
                        <option key={ck.id} value={ck.id}>
                          {ck.name} (&Oslash;{ck.nutDia}mm)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Overhang / Stick-out Slider */}
                <div style={{ marginTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#cbd5e1', marginBottom: '2px' }}>
                    <span>Tool Stick-Out / Overhang (Lo):</span>
                    <strong style={{ color: '#38bdf8' }}>{overhang} mm</strong>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="110"
                    step="1"
                    value={overhang}
                    onChange={(e) => setOverhang(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#38bdf8' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#64748b' }}>
                    <span>Min: 15mm</span>
                    <span>Max Cavity Depth: {maxPartDepth}mm</span>
                    <span>Max: 110mm</span>
                  </div>
                </div>
              </div>

              {/* Holder Clearance & Rigidity Interference Auditor */}
              <div className="nc2check-section">
                <div className="section-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {audit.status === 'safe' ? (
                      <ShieldCheck size={13} color="#10b981" />
                    ) : audit.status === 'caution' ? (
                      <AlertTriangle size={13} color="#f59e0b" />
                    ) : (
                      <AlertTriangle size={13} color="#ef4444" />
                    )}
                    <span>HOLDER CLEARANCE &amp; RIGIDITY AUDIT</span>
                  </div>
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: audit.status === 'safe' ? '#10b981' : audit.status === 'caution' ? '#f59e0b' : '#ef4444',
                      color: '#fff'
                    }}
                  >
                    {audit.status === 'safe' ? 'SAFE CLEARANCE' : audit.status === 'caution' ? 'LOW CLEARANCE' : 'HOLDER COLLISION GOUGE'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '10.5px', marginBottom: '6px' }}>
                  <div style={{ background: '#090d14', padding: '6px 8px', borderRadius: '4px' }}>
                    <div style={{ color: '#94a3b8' }}>Cavity Depth:</div>
                    <strong style={{ color: '#f1f5f9' }}>{audit.maxCutDepth} mm</strong>
                  </div>
                  <div style={{ background: '#090d14', padding: '6px 8px', borderRadius: '4px' }}>
                    <div style={{ color: '#94a3b8' }}>Clearance Margin:</div>
                    <strong style={{ color: audit.clearanceMargin < 0 ? '#ef4444' : '#10b981' }}>
                      {audit.clearanceMargin > 0 ? `+${audit.clearanceMargin}` : audit.clearanceMargin} mm
                    </strong>
                  </div>
                  <div style={{ background: '#090d14', padding: '6px 8px', borderRadius: '4px' }}>
                    <div style={{ color: '#94a3b8' }}>Rigidity Score:</div>
                    <strong style={{ color: audit.rigidityScore > 70 ? '#10b981' : '#f59e0b' }}>
                      {audit.rigidityScore}% (L/D: {audit.ldRatio})
                    </strong>
                  </div>
                </div>

                {audit.warnings.length > 0 && (
                  <div style={{ fontSize: '10px', color: '#fca5a5', marginBottom: '6px' }}>
                    {audit.warnings[0]}
                  </div>
                )}

                {audit.status !== 'safe' && (
                  <button
                    className="btn-secondary"
                    onClick={() => setOverhang(audit.recommendedOverhang)}
                    style={{ width: '100%', fontSize: '10.5px', padding: '4px', gap: '6px', color: '#38bdf8' }}
                  >
                    <Zap size={12} color="#38bdf8" />
                    <span>Auto-Optimize Stick-Out to {audit.recommendedOverhang}mm (Clearance + Rigidity)</span>
                  </button>
                )}
              </div>

            </div>

            {/* Right Column: 3D Interactive Assembly Viewport */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ flex: 1, minHeight: '360px', position: 'relative', borderRadius: '6px', overflow: 'hidden', border: '1px solid #1e293b' }}>
                <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

                {/* 3D Viewport Badges */}
                <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(9, 13, 20, 0.85)', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {HOLDER_TAPERS[taperId.toUpperCase()]?.name.split(' (')[0]} &bull; {selectedChuck.name}
                </div>

                <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(9, 13, 20, 0.85)', padding: '4px 8px', borderRadius: '4px', fontSize: '9.5px', color: '#38bdf8', border: '1px solid rgba(255,255,255,0.08)' }}>
                  Drag to Orbit &bull; Scroll to Zoom
                </div>
              </div>

              {/* Assembly Dimension Summary Card */}
              <div style={{ background: '#0a0d14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px 12px', fontSize: '10.5px', display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                <span>Tool &Oslash;: <strong style={{ color: '#f1f5f9' }}>{diameter}mm</strong></span>
                <span>Overhang: <strong style={{ color: '#38bdf8' }}>{overhang}mm</strong></span>
                <span>Chuck &Oslash;: <strong style={{ color: '#f59e0b' }}>{selectedChuck.nutDia}mm</strong></span>
                <span>Gauge L: <strong style={{ color: '#f1f5f9' }}>{selectedChuck.gaugeLength}mm</strong></span>
              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '12px 16px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            Assembly fully synthesized with PBR materials and collision envelope.
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-secondary" onClick={handleSaveAsNew} style={{ color: '#38bdf8' }}>
              <Plus size={13} />
              <span>Add as New Assembly</span>
            </button>
            <button className="btn-primary" onClick={handleApplyToActiveTool} style={{ background: '#0284c7' }}>
              <Check size={14} />
              <span>Save &amp; Apply to Tool</span>
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}

