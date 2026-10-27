import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X, Gauge, Zap, Disc, Cpu, ShieldAlert, CheckCircle2, AlertTriangle,
  RotateCcw, Sliders, ArrowRight, Layers, Flame, Droplets, Compass
} from 'lucide-react';
import { MACHINING_MATERIALS, calculateMachiningParameters } from '../utils/machiningPhysics';

export default function FeedsSpeedsModal({
  isOpen,
  onClose,
  tools = [],
  activeToolId = null,
  operations = [],
  activeOpId = null,
  activeMachine = { name: "DMG MORI DMU 50", type: "5-Axis Mill-Turn", maxRpm: 18000, powerKw: 15.0, torqueNm: 85.0 },
  onUpdateToolParams = null,
  onUpdateOpParams = null,
  onNotify = null
}) {
  const dialogRef = useRef(null);

  // Initial active tool
  const currentTool = useMemo(() => {
    return tools.find((t) => t.id === activeToolId) || tools[0] || {
      id: 1,
      number: 1,
      name: '10mm 4-Flute Endmill',
      diameter: 10,
      flutes: 4,
      fluteLength: 25,
      length: 65,
      rpm: 8000,
      feedRate: 1500
    };
  }, [tools, activeToolId]);

  // Form State
  const [selectedMatKey, setSelectedMatKey] = useState('ALUMINUM_6061_T6');
  const [selectedToolId, setSelectedToolId] = useState(currentTool.id);
  const [diameter, setDiameter] = useState(currentTool.diameter || 10);
  const [flutes, setFlutes] = useState(currentTool.flutes || 4);
  const [stickout, setStickout] = useState(currentTool.length ? currentTool.length - 20 : 45);
  const [axialAp, setAxialAp] = useState(4.0);
  const [radialAe, setRadialAe] = useState(5.0);
  const [customVc, setCustomVc] = useState('');
  const [customFz, setCustomFz] = useState('');

  // Sync when tool changes
  useEffect(() => {
    if (currentTool) {
      setSelectedToolId(currentTool.id);
      setDiameter(currentTool.diameter || 10);
      setFlutes(currentTool.flutes || 4);
      setStickout(currentTool.length ? currentTool.length - 20 : 45);
    }
  }, [currentTool]);

  // Modal Lifecycle
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
        event.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        event.clientX <= rect.left + rect.width;
      if (!inBox) onClose();
    };

    dialog.addEventListener('click', handleBackdrop);
    return () => dialog.removeEventListener('click', handleBackdrop);
  }, [isOpen, onClose]);

  // Physics calculation
  const physics = useMemo(() => {
    return calculateMachiningParameters({
      materialKey: selectedMatKey,
      toolDiameter: Number(diameter),
      flutes: Number(flutes),
      toolStickout: Number(stickout),
      axialDepthAp: Number(axialAp),
      radialDepthAe: Number(radialAe),
      targetVc: customVc ? Number(customVc) : null,
      targetFz: customFz ? Number(customFz) : null,
      machineMaxRpm: activeMachine?.maxRpm || 18000,
      machineMaxPowerKw: activeMachine?.powerKw || 15.0,
      machineMaxTorqueNm: activeMachine?.torqueNm || 85.0
    });
  }, [selectedMatKey, diameter, flutes, stickout, axialAp, radialAe, customVc, customFz, activeMachine]);

  const handleApplyToTool = () => {
    if (onUpdateToolParams) {
      onUpdateToolParams(selectedToolId, {
        rpm: physics.spindleRpm,
        feedRate: physics.feedRate,
        cuttingSpeedVc: physics.cuttingSpeedVc,
        feedPerTooth: physics.effectiveFz
      });
      if (onNotify) {
        onNotify(`Tool T${currentTool.number} updated: S${physics.spindleRpm} RPM, F${physics.feedRate} mm/min`, 'success');
      }
    }
  };

  const handleApplyToOp = () => {
    if (onUpdateOpParams && activeOpId) {
      onUpdateOpParams(activeOpId, {
        spindleRpm: physics.spindleRpm,
        feedRate: physics.feedRate,
        stepdown: physics.axialDepthAp,
        stepoverPct: physics.radialEngagementPct
      });
      if (onNotify) {
        onNotify(`Operation parameters updated: S${physics.spindleRpm} RPM, F${physics.feedRate} mm/min`, 'success');
      }
    }
  };

  const handleResetStandards = () => {
    setCustomVc('');
    setCustomFz('');
    setAxialAp(Number((diameter * 0.4).toFixed(1)));
    setRadialAe(Number((diameter * 0.5).toFixed(1)));
  };

  return (
    <dialog
      ref={dialogRef}
      id="feeds-speeds-dialog"
      aria-labelledby="feeds-speeds-title"
      closedby="any"
      onClose={onClose}
    >
      <div className="modal-window" style={{ width: '840px', maxHeight: '92vh' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Gauge size={16} color="#38bdf8" />
            <span id="feeds-speeds-title" style={{ fontWeight: 700 }}>
              Feeds, Speeds &amp; Material Machinability Physics Engine
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close Dialog">
            <X size={15} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '14px' }}>
          
          {/* 1. Material Selection Card */}
          <div className="nc2check-section">
            <div className="section-label">1. WORKPIECE MATERIAL MACHINABILITY DATABASE</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px', alignItems: 'center' }}>
              <div className="form-group">
                <label>Workpiece Material Preset:</label>
                <select
                  className="text-input"
                  value={selectedMatKey}
                  onChange={(e) => {
                    setSelectedMatKey(e.target.value);
                    setCustomVc('');
                    setCustomFz('');
                  }}
                  style={{ cursor: 'pointer', fontWeight: 600 }}
                >
                  {Object.values(MACHINING_MATERIALS).map((mat) => (
                    <option key={mat.id} value={mat.id}>
                      {mat.name} &bull; {mat.isoClass}
                    </option>
                  ))}
                </select>
              </div>

              {/* Material Quick Specs */}
              <div style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '11px',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Hardness:</span>
                  <span style={{ color: '#f8fafc', fontWeight: 600 }}>{physics.material.hardness}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Specific Cutting Force (kc1.1):</span>
                  <span style={{ color: '#38bdf8', fontWeight: 600 }}>{physics.material.kc1_1} N/mm&sup2;</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Machinability Index:</span>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>{physics.material.machinabilityPct}%</span>
                </div>
              </div>
            </div>

            {/* Coolant Recommendation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px', color: '#64748b', background: 'rgba(255,255,255,0.02)', padding: '4px 8px', borderRadius: '4px' }}>
              <Droplets size={12} color="#06b6d4" />
              <span>Recommended Coolant: <strong style={{ color: '#94a3b8' }}>{physics.material.cooling}</strong></span>
            </div>
          </div>

          {/* 2. Tool & Cut Geometry Configuration */}
          <div className="nc2check-section">
            <div className="section-label">2. CUTTER GEOMETRY &amp; CUT ENGAGEMENT</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              <div className="form-group">
                <label>Tool Diameter D (mm):</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="100"
                  className="text-input"
                  value={diameter}
                  onChange={(e) => setDiameter(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Flute Count z:</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="12"
                  className="text-input"
                  value={flutes}
                  onChange={(e) => setFlutes(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Tool Stickout L (mm):</label>
                <input
                  type="number"
                  step="1"
                  min="10"
                  max="200"
                  className="text-input"
                  value={stickout}
                  onChange={(e) => setStickout(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Radial Chip Thinning (RCTF):</label>
                <div style={{
                  background: '#090d14',
                  border: '1px solid #1e293b',
                  borderRadius: '4px',
                  padding: '5px 8px',
                  fontSize: '11px',
                  color: physics.rctf > 1.0 ? '#10b981' : '#94a3b8',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span>&times;{physics.rctf}</span>
                  <span style={{ fontSize: '9px', color: '#64748b' }}>
                    {physics.rctf > 1.0 ? 'Active' : 'Neutral'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '4px' }}>
              <div className="form-group">
                <label>Axial Depth ap (mm):</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  max="60"
                  className="text-input"
                  value={axialAp}
                  onChange={(e) => setAxialAp(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Radial Stepover ae (mm):</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  max={diameter}
                  className="text-input"
                  value={radialAe}
                  onChange={(e) => setRadialAe(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Target Vc (m/min):</label>
                <input
                  type="number"
                  step="5"
                  className="text-input"
                  placeholder={`Auto (${physics.material.defaultCarbideVc})`}
                  value={customVc}
                  onChange={(e) => setCustomVc(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Target fz (mm/tooth):</label>
                <input
                  type="number"
                  step="0.005"
                  className="text-input"
                  placeholder={`Auto (${physics.baseFz})`}
                  value={customFz}
                  onChange={(e) => setCustomFz(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 3. Physics Calculation Metrics & Telemetry */}
          <div className="nc2check-section">
            <div className="section-label">3. COMPUTED CUTTING DYNAMICS &amp; SPINDLE POWER LOAD</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {/* Spindle Speed */}
              <div style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}>
                <span style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>Spindle Speed</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace' }}>
                  {physics.spindleRpm.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: 500 }}>RPM</span>
                </span>
                <span style={{ fontSize: '9.5px', color: '#64748b' }}>Vc: {physics.cuttingSpeedVc} m/min</span>
              </div>

              {/* Feed Rate */}
              <div style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}>
                <span style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>Table Feed Rate</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#10b981', fontFamily: 'monospace' }}>
                  {physics.feedRate.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: 500 }}>mm/min</span>
                </span>
                <span style={{ fontSize: '9.5px', color: '#64748b' }}>fz: {physics.effectiveFz} mm/tooth</span>
              </div>

              {/* MRR */}
              <div style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}>
                <span style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>Material Removal (MRR)</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#f59e0b', fontFamily: 'monospace' }}>
                  {physics.mrrCm3Min} <span style={{ fontSize: '11px', fontWeight: 500 }}>cm&sup3;/min</span>
                </span>
                <span style={{ fontSize: '9.5px', color: '#64748b' }}>Force: {physics.cuttingForceN} N</span>
              </div>

              {/* Tool Deflection */}
              <div style={{
                background: '#090d14',
                border: `1px solid ${physics.deflectionUm > 25 ? '#ef4444' : '#1e293b'}`,
                borderRadius: '6px',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}>
                <span style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>Tool Deflection &delta;</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: physics.deflectionUm > 25 ? '#ef4444' : '#a855f7', fontFamily: 'monospace' }}>
                  {physics.deflectionUm} <span style={{ fontSize: '11px', fontWeight: 500 }}>&micro;m</span>
                </span>
                <span style={{ fontSize: '9.5px', color: physics.deflectionUm > 25 ? '#ef4444' : '#64748b' }}>
                  {physics.deflectionUm > 25 ? 'High deflection!' : 'Taper < 0.02mm'}
                </span>
              </div>
            </div>

            {/* Power & Torque Gauge Bars */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '6px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', marginBottom: '3px' }}>
                  <span style={{ color: '#94a3b8' }}>Spindle Power: <strong>{physics.powerKw} kW</strong> / {activeMachine?.powerKw || 15} kW</span>
                  <span style={{ color: physics.powerLoadPct > 100 ? '#ef4444' : '#38bdf8', fontWeight: 700 }}>
                    {physics.powerLoadPct}% Load
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                  <div style={{
                    width: `${Math.min(100, physics.powerLoadPct)}%`,
                    height: '100%',
                    background: physics.powerLoadPct > 100 ? '#ef4444' : physics.powerLoadPct > 80 ? '#f59e0b' : '#38bdf8',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', marginBottom: '3px' }}>
                  <span style={{ color: '#94a3b8' }}>Spindle Torque: <strong>{physics.torqueNm} N&bull;m</strong> / {activeMachine?.torqueNm || 85} N&bull;m</span>
                  <span style={{ color: physics.torqueLoadPct > 100 ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                    {physics.torqueLoadPct}% Load
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                  <div style={{
                    width: `${Math.min(100, physics.torqueLoadPct)}%`,
                    height: '100%',
                    background: physics.torqueLoadPct > 100 ? '#ef4444' : physics.torqueLoadPct > 80 ? '#f59e0b' : '#10b981',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            </div>

            {/* Safety & Integrity Status Banner */}
            <div style={{
              marginTop: '6px',
              padding: '8px 12px',
              borderRadius: '4px',
              background: physics.safetyStatus === 'CRITICAL_OVERLOAD' ? 'rgba(239, 68, 68, 0.15)' :
                          physics.safetyStatus === 'HIGH_DEFLECTION' ? 'rgba(245, 158, 11, 0.15)' :
                          physics.safetyStatus === 'WARNING_HIGH_LOAD' ? 'rgba(245, 158, 11, 0.12)' :
                          'rgba(16, 185, 129, 0.12)',
              border: `1px solid ${
                physics.safetyStatus === 'CRITICAL_OVERLOAD' ? '#ef4444' :
                physics.safetyStatus === 'HIGH_DEFLECTION' || physics.safetyStatus === 'WARNING_HIGH_LOAD' ? '#f59e0b' :
                '#10b981'
              }`,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '11px',
              color: '#f8fafc'
            }}>
              {physics.safetyStatus === 'CRITICAL_OVERLOAD' ? (
                <AlertTriangle size={15} color="#ef4444" />
              ) : physics.safetyStatus === 'HIGH_DEFLECTION' || physics.safetyStatus === 'WARNING_HIGH_LOAD' ? (
                <ShieldAlert size={15} color="#f59e0b" />
              ) : (
                <CheckCircle2 size={15} color="#10b981" />
              )}
              <span>{physics.safetyMsg}</span>
            </div>
          </div>

          {/* 4. Action Buttons Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}>
            <button className="btn-secondary" onClick={handleResetStandards} title="Reset to ISO standards">
              <RotateCcw size={13} style={{ marginRight: '4px' }} />
              Reset Standards
            </button>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn-secondary"
                onClick={handleApplyToTool}
                title="Save RPM and Feed to Tool Library"
              >
                Apply to Tool T{currentTool.number}
              </button>

              <button
                className="btn-primary"
                onClick={handleApplyToOp}
                style={{
                  background: 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)',
                  borderColor: '#38bdf8',
                  fontWeight: 600
                }}
                title="Apply calculated speed/feed to active CAM operation"
              >
                Apply to Active Operation
              </button>

              <button className="btn-secondary" onClick={onClose}>
                Done
              </button>
            </div>
          </div>

        </div>
      </div>
    </dialog>
  );
}

