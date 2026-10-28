import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  X, Orbit, Sliders, CheckCircle2, AlertTriangle, ShieldCheck,
  RefreshCw, Info, ArrowUpRight, Play, Check, Code2, Compass, Layers, Cpu
} from 'lucide-react';
import {
  FIVE_AXIS_STRATEGIES,
  MACHINE_KINEMATICS,
  TCPM_MODES,
  calculateToolOrientationVector,
  vectorToMachineAngles,
  audit5AxisKinematics,
  generate5AxisSwarfToolpath,
  generate5AxisFlowlineToolpath,
  generate5AxisGCode
} from '../utils/fiveAxisEngine.js';

export default function FiveAxisStudioModal({
  isOpen,
  onClose,
  tools = [],
  operations = [],
  activeOpId = null,
  partMetrics = null,
  onAddOperation,
  onUpdateOperations
}) {
  const dialogRef = useRef(null);

  // Strategy & Kinematics State
  const [selectedStrategy, setSelectedStrategy] = useState('swarf_flank');
  const [selectedKinematics, setSelectedKinematics] = useState('table_table_ac');
  const [selectedController, setSelectedController] = useState('fanuc');
  const [selectedToolId, setSelectedToolId] = useState(tools[0]?.id || 1);

  // Multiaxis Orientation Angles
  const [leadAngleDeg, setLeadAngleDeg] = useState(10.0);
  const [tiltAngleDeg, setTiltAngleDeg] = useState(15.0);
  const [passes, setPasses] = useState(3);
  const [autoSmoothSingularities, setAutoSmoothSingularities] = useState(true);

  // Active Tool
  const activeTool = useMemo(() => {
    return tools.find((t) => t.id === Number(selectedToolId)) || tools[0] || {
      id: 1, number: 1, name: '10mm Ball Nose', diameter: 10, rpm: 10000, feedRate: 1500
    };
  }, [tools, selectedToolId]);

  // Model bounds fallback
  const bounds = useMemo(() => {
    const b = partMetrics?.box || partMetrics?.bounds;
    if (b && b.min && b.max) return b;
    return {
      min: { x: -30, y: -20, z: -30 },
      max: { x: 30, y: 15, z: 30 }
    };
  }, [partMetrics]);

  // Modal backdrop & escape handling
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

  // Generate Toolpath & Kinematic Audit
  const toolpathResult = useMemo(() => {
    const params = {
      leadAngleDeg: Number(leadAngleDeg),
      tiltAngleDeg: Number(tiltAngleDeg),
      passes: Number(passes),
      kinematicsId: selectedKinematics,
      numStripes: Math.max(4, Number(passes) * 3)
    };

    if (selectedStrategy === 'flowline_surface' || selectedStrategy === 'lead_tilt_ballnose') {
      return generate5AxisFlowlineToolpath(bounds, activeTool, params);
    }
    return generate5AxisSwarfToolpath(bounds, activeTool, params);
  }, [selectedStrategy, selectedKinematics, leadAngleDeg, tiltAngleDeg, passes, bounds, activeTool]);

  // Generate Live G-Code Preview
  const gcodePreview = useMemo(() => {
    const opMock = {
      name: FIVE_AXIS_STRATEGIES[selectedStrategy.toUpperCase()]?.name || '5-Axis Simultaneous',
      fiveAxisStrategy: selectedStrategy
    };
    return generate5AxisGCode(toolpathResult, opMock, activeTool, selectedController, selectedKinematics);
  }, [toolpathResult, selectedStrategy, activeTool, selectedController, selectedKinematics]);

  // Compute Current Vector Demo Coordinates for SVG
  const sampleVector = useMemo(() => {
    const dummyTangent = { x: 1, y: 0, z: 0, clone: () => ({ ...dummyTangent, normalize: () => dummyTangent }) };
    const dummyNormal = { x: 0, y: 1, z: 0, clone: () => ({ ...dummyNormal, normalize: () => dummyNormal, applyAxisAngle: () => {} }) };
    // Simplified sample orientation calculation for SVG cone display
    const leadRad = (leadAngleDeg * Math.PI) / 180;
    const tiltRad = (tiltAngleDeg * Math.PI) / 180;
    const vx = Math.sin(tiltRad);
    const vz = Math.sin(leadRad);
    const vy = Math.cos(leadRad) * Math.cos(tiltRad);
    const len = Math.hypot(vx, vy, vz) || 1;
    return {
      I: (vx / len).toFixed(4),
      J: (vz / len).toFixed(4),
      K: (vy / len).toFixed(4),
      A: (Math.atan2(vz, vy) * (180 / Math.PI)).toFixed(2),
      B: (Math.atan2(vx, vy) * (180 / Math.PI)).toFixed(2),
      C: (Math.atan2(vx, vz) * (180 / Math.PI)).toFixed(2)
    };
  }, [leadAngleDeg, tiltAngleDeg]);

  // Handlers
  const handleCreate5AxisOp = () => {
    const strategyDef = Object.values(FIVE_AXIS_STRATEGIES).find((s) => s.id === selectedStrategy) || FIVE_AXIS_STRATEGIES.SWARF_FLANK;
    const nextOpId = operations.length > 0 ? Math.max(...operations.map((o) => o.id)) + 1 : 1;

    const newOp = {
      id: nextOpId,
      name: strategyDef.name,
      badge: '5-AXIS',
      badgeClass: 'swarf',
      toolId: activeTool.id,
      toolName: `T${activeTool.number} - ${activeTool.name}`,
      stepdown: 6.0,
      stepoverPct: 20,
      totalDepth: 20.0,
      stockToLeaveXY: 0.0,
      stockToLeaveZ: 0.0,
      rapidHeight: 15.0,
      direction: 'climb',
      visible: true,
      fiveAxis: {
        strategy: selectedStrategy,
        kinematicsId: selectedKinematics,
        controller: selectedController,
        leadAngleDeg: Number(leadAngleDeg),
        tiltAngleDeg: Number(tiltAngleDeg),
        passes: Number(passes)
      }
    };

    if (onAddOperation) {
      onAddOperation(newOp);
    }
    onClose();
  };

  const currentKinematics = MACHINE_KINEMATICS[selectedKinematics.toUpperCase()] || MACHINE_KINEMATICS.TABLE_TABLE_AC;
  const audit = toolpathResult.audit;

  return (
    <dialog
      ref={dialogRef}
      id="five-axis-studio-dialog"
      aria-labelledby="five-axis-studio-title"
      closedby="any"
      onClose={onClose}
    >
      <div className="modal-window" style={{ width: '880px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: '#8b5cf6', padding: '4px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}>
              <Orbit size={16} color="#ffffff" />
            </div>
            <div>
              <span id="five-axis-studio-title" style={{ fontWeight: 600, fontSize: '13.5px' }}>
                Simultaneous 5-Axis Multiaxis Studio &bull; TCPM Kinematics Engine
              </span>
              <span style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8' }}>
                Continuous RTCP / TCPM Flank Swarf &amp; Flowline UV Surface Contouring (Mastercam / NX Grade)
              </span>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close Dialog">
            <X size={15} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px' }}>

          {/* Strategy Selector Tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {Object.values(FIVE_AXIS_STRATEGIES).map((strat) => {
              const isActive = selectedStrategy === strat.id;
              return (
                <div
                  key={strat.id}
                  onClick={() => setSelectedStrategy(strat.id)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: isActive ? '1px solid #8b5cf6' : '1px solid rgba(255,255,255,0.08)',
                    background: isActive ? 'rgba(139, 92, 246, 0.14)' : '#0d1117',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '3px', background: isActive ? '#8b5cf6' : '#21262d', color: '#fff' }}>
                      {strat.badge}
                    </span>
                    {isActive && <CheckCircle2 size={13} color="#8b5cf6" />}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: isActive ? '#f8fafc' : '#cbd5e1', lineHeight: '1.2' }}>
                    {strat.name.split('(')[0]}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Kinematics & Tool Configuration */}
          <div className="nc2check-section">
            <div className="section-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Cpu size={13} color="#8b5cf6" />
                <span>MACHINE KINEMATICS &amp; CONTROLLER PROTOCOL</span>
              </div>
              <span style={{ fontSize: '10px', color: '#8b5cf6' }}>
                {currentKinematics.primaryAxis} &bull; {currentKinematics.secondaryAxis}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Machine Kinematics Architecture:</label>
                <select
                  value={selectedKinematics}
                  onChange={(e) => setSelectedKinematics(e.target.value)}
                  className="text-input"
                >
                  <option value="table_table_ac">Table-Table AC Trunnion (Haas UMC / DMU 50)</option>
                  <option value="head_table_bc">Head-Table BC Swivel (Mazak Integrex / Hermle)</option>
                  <option value="head_head_ab">Head-Head AB Articulated (5-Axis Gantry)</option>
                </select>
              </div>

              <div className="form-group">
                <label>TCPM / RTCP Protocol:</label>
                <select
                  value={selectedController}
                  onChange={(e) => setSelectedController(e.target.value)}
                  className="text-input"
                >
                  <option value="fanuc">Fanuc G43.4 (High-Speed TCPM)</option>
                  <option value="haas">Haas G234 (Tool Center Point Control)</option>
                  <option value="siemens">Siemens 840D / ONE TRAORI</option>
                  <option value="heidenhain">Heidenhain FUNCTION TCPM</option>
                </select>
              </div>

              <div className="form-group">
                <label>Assigned Tool:</label>
                <select
                  value={selectedToolId}
                  onChange={(e) => setSelectedToolId(Number(e.target.value))}
                  className="text-input"
                >
                  {tools.map((t) => (
                    <option key={t.id} value={t.id}>
                      T{t.number} - {t.name} (&Oslash;{t.diameter}mm)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Interactive Tool Vector Orientation Visualizer & Sliders */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: '14px' }}>

            {/* Left: Interactive 3D Vector Cone SVG */}
            <div style={{ background: '#0a0d14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#e2e8f0', letterSpacing: '0.04em' }}>
                  TOOL AXIS ORIENTATION CONE
                </span>
                <span style={{ fontSize: '10px', color: '#10b981', fontFamily: 'monospace' }}>
                  I: {sampleVector.I} &bull; J: {sampleVector.J} &bull; K: {sampleVector.K}
                </span>
              </div>

              {/* Vector Geometry Schematic */}
              <svg width="280" height="170" viewBox="-140 -90 280 170" style={{ background: '#06090e', borderRadius: '4px', border: '1px solid #1e293b' }}>
                {/* Grid & Reference Axes */}
                <line x1="-120" y1="50" x2="120" y2="50" stroke="#334155" strokeWidth="1.5" strokeDasharray="3,3" />
                <line x1="0" y1="50" x2="0" y2="-75" stroke="#334155" strokeWidth="1.5" strokeDasharray="3,3" />
                <text x="125" y="53" fill="#64748b" fontSize="9" fontFamily="monospace">+X</text>
                <text x="-5" y="-80" fill="#64748b" fontSize="9" fontFamily="monospace">+Z</text>

                {/* Surface Contact Point (Origin) */}
                <circle cx="0" cy="50" r="4.5" fill="#ef4444" />
                <text x="-28" y="65" fill="#ef4444" fontSize="9" fontWeight="bold">Cut Contact (0,0,0)</text>

                {/* Lead / Tilt Vector Line */}
                {(() => {
                  const radTilt = (tiltAngleDeg * Math.PI) / 180;
                  const radLead = (leadAngleDeg * Math.PI) / 180;
                  const vx = Math.sin(radTilt) * 90;
                  const vy = 50 - Math.cos(radLead) * Math.cos(radTilt) * 95;
                  return (
                    <g>
                      {/* Orientation Cone Shadow */}
                      <polygon
                        points={`0,50 ${vx - 14},${vy} ${vx + 14},${vy}`}
                        fill="rgba(139, 92, 246, 0.15)"
                        stroke="#8b5cf6"
                        strokeWidth="1"
                        strokeDasharray="2,2"
                      />
                      {/* Tool Shank / Axis Vector */}
                      <line x1="0" y1="50" x2={vx} y2={vy} stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" />
                      {/* Cutter Head Cap */}
                      <circle cx={vx} cy={vy} r="5" fill="#8b5cf6" />
                      <line x1={vx - 8} y1={vy} x2={vx + 8} y2={vy} stroke="#c084fc" strokeWidth="2" />
                      {/* Vector Label */}
                      <text x={vx + 10} y={vy - 2} fill="#38bdf8" fontSize="9" fontFamily="monospace" fontWeight="bold">
                        V ({sampleVector.I}, {sampleVector.J}, {sampleVector.K})
                      </text>
                    </g>
                  );
                })()}

                {/* Angles annotations */}
                <text x="-125" y="-60" fill="#a855f7" fontSize="9.5" fontWeight="bold">
                  Lead &alpha;: {leadAngleDeg}&deg; (Fwd)
                </text>
                <text x="-125" y="-45" fill="#38bdf8" fontSize="9.5" fontWeight="bold">
                  Tilt &beta;: {tiltAngleDeg}&deg; (Lean)
                </text>
                <text x="-125" y="-30" fill="#10b981" fontSize="9" fontFamily="monospace">
                  Rotary A: {sampleVector.A}&deg; | C: {sampleVector.C}&deg;
                </text>
              </svg>

              <div style={{ width: '100%', fontSize: '10px', color: '#94a3b8', marginTop: '6px', textAlign: 'center' }}>
                Tool axis vector rotates dynamically along surface tangency to eliminate 0-velocity dead center dwell.
              </div>
            </div>

            {/* Right: Sliders & Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="nc2check-section" style={{ flex: 1 }}>
                <div className="section-label">ORIENTATION ANGLES &amp; PASSES</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Lead Angle Slider */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#cbd5e1', marginBottom: '2px' }}>
                      <span>Lead Angle (&alpha;):</span>
                      <strong style={{ color: '#a855f7' }}>{leadAngleDeg}&deg;</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      step="0.5"
                      value={leadAngleDeg}
                      onChange={(e) => setLeadAngleDeg(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#8b5cf6' }}
                    />
                    <div style={{ fontSize: '9.5px', color: '#64748b' }}>
                      Tilts cutter forward along cut vector to shift contact away from stationary ball tip.
                    </div>
                  </div>

                  {/* Tilt Angle Slider */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#cbd5e1', marginBottom: '2px' }}>
                      <span>Tilt / Lean Angle (&beta;):</span>
                      <strong style={{ color: '#38bdf8' }}>{tiltAngleDeg}&deg;</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="35"
                      step="0.5"
                      value={tiltAngleDeg}
                      onChange={(e) => setTiltAngleDeg(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#38bdf8' }}
                    />
                    <div style={{ fontSize: '9.5px', color: '#64748b' }}>
                      Sideways lean angle relative to surface normal preventing shank interference.
                    </div>
                  </div>

                  {/* Multiaxis Passes Slider */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#cbd5e1', marginBottom: '2px' }}>
                      <span>Continuous Multiaxis Passes:</span>
                      <strong style={{ color: '#10b981' }}>{passes}</strong>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="6"
                      step="1"
                      value={passes}
                      onChange={(e) => setPasses(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#10b981' }}
                    />
                  </div>

                  {/* Auto-Smooth Singularity Damping Checkbox */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '4px', fontSize: '11px', color: '#e2e8f0' }}>
                    <input
                      type="checkbox"
                      checked={autoSmoothSingularities}
                      onChange={(e) => setAutoSmoothSingularities(e.target.checked)}
                      style={{ accentColor: '#8b5cf6' }}
                    />
                    <span>Enable Damped Least-Squares (DLS) Rotary Pole Smoothing</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Kinematic Singularity & Gimbal Lock Auditor */}
          <div className="nc2check-section">
            <div className="section-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {audit.hasSingularity ? (
                  <AlertTriangle size={13} color="#ef4444" />
                ) : audit.status === 'warning' ? (
                  <AlertTriangle size={13} color="#f59e0b" />
                ) : (
                  <ShieldCheck size={13} color="#10b981" />
                )}
                <span>KINEMATIC SINGULARITY &amp; OVERTRAVEL AUDIT</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                  Max Angular Velocity: <strong style={{ color: audit.maxRotaryVelocityDegSec > 180 ? '#ef4444' : '#10b981' }}>{audit.maxRotaryVelocityDegSec}&deg;/s</strong>
                </span>
                <span
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: audit.hasSingularity ? '#ef4444' : audit.status === 'warning' ? '#f59e0b' : '#10b981',
                    color: '#fff'
                  }}
                >
                  {audit.hasSingularity ? 'POLE SINGULARITY' : audit.status === 'warning' ? 'HIGH ROTARY VELOCITY' : 'NOMINAL SAFE'}
                </span>
              </div>
            </div>

            {audit.warnings.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '70px', overflowY: 'auto' }}>
                {audit.warnings.map((w, idx) => (
                  <div key={idx} style={{ fontSize: '10.5px', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#ef4444' }}>&bull;</span>
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={13} color="#10b981" />
                <span>Zero kinematic singularities or gimbal locks detected across all {audit.evaluatedPoints} trajectory points. Machine rotary axis motion within nominal limits.</span>
              </div>
            )}
          </div>

          {/* Live 5-Axis G-Code Preview */}
          <div className="nc2check-section">
            <div className="section-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Code2 size={13} color="#38bdf8" />
                <span>LIVE 5-AXIS SIMULTANEOUS NC BLOCK STREAM</span>
              </div>
              <span style={{ fontSize: '10px', color: '#38bdf8' }}>
                {toolpathResult.trajectoryPoints.length} Multi-Axis Blocks &bull; {TCPM_MODES[selectedController.toUpperCase()]?.name || selectedController.toUpperCase()}
              </span>
            </div>

            <pre
              style={{
                background: '#04070b',
                color: '#38bdf8',
                padding: '10px',
                borderRadius: '4px',
                fontSize: '10.5px',
                fontFamily: 'monospace',
                maxHeight: '120px',
                overflowY: 'auto',
                lineHeight: '1.45',
                border: '1px solid #1e293b'
              }}
            >
              {gcodePreview}
            </pre>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '12px 16px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={13} color="#8b5cf6" />
            <span>Generates {toolpathResult.cuttingLines.length} cutting segments with 3D orientation needles.</span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleCreate5AxisOp} style={{ background: '#8b5cf6', borderColor: '#7c3aed' }}>
              <Orbit size={14} />
              <span>Create 5-Axis Operation</span>
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
