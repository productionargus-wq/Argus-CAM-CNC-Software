import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  X, Crosshair, Target, CheckCircle2, ShieldCheck, Cpu, Code2,
  Sliders, Play, RefreshCw, Copy, Check, Info, AlertTriangle
} from 'lucide-react';
import { PROBING_STRATEGIES, generateProbingGCode, generateProbingToolpath } from '../utils/probingEngine.js';

export default function ProbingStudioModal({
  isOpen,
  onClose,
  onAddProbingOperation,
  activeWcs = 'G54',
  stockConfig = {},
  partMetrics = null,
  activeMachine = { name: "DMG MORI DMU 50", type: "5-Axis Mill-Turn" }
}) {
  const dialogRef = useRef(null);

  const [selectedStrategyKey, setSelectedStrategyKey] = useState('BORE_CENTERING');
  const [controllerDialect, setControllerDialect] = useState('fanuc');
  const [targetWcs, setTargetWcs] = useState(activeWcs || 'G54');
  const [copiedCode, setCopiedCode] = useState(false);

  // Parameter State
  const [params, setParams] = useState({
    nominalDiameter: 40,
    nominalWidth: 30,
    depthZ: -10,
    clearanceZ: 15,
    overTravel: 5,
    corner: 'top_left'
  });

  // Modal Lifecycle & Backdrop handler
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

  // Update strategy defaults
  const currentStrategy = useMemo(() => {
    return PROBING_STRATEGIES[selectedStrategyKey] || PROBING_STRATEGIES.BORE_CENTERING;
  }, [selectedStrategyKey]);

  // Generate live G-Code preview
  const liveGCode = useMemo(() => {
    const fakeOp = {
      name: currentStrategy.name,
      strategyKey: currentStrategy.id,
      probingParams: {
        nominalDiameter: Number(params.nominalDiameter) || 40,
        nominalWidth: Number(params.nominalWidth) || 30,
        depthZ: Number(params.depthZ) || -10,
        clearanceZ: Number(params.clearanceZ) || 15,
        overTravel: Number(params.overTravel) || 5,
        corner: params.corner
      }
    };
    return generateProbingGCode(fakeOp, controllerDialect, targetWcs);
  }, [currentStrategy, params, controllerDialect, targetWcs]);

  // Compute kinematic trajectory stats
  const trajectoryStats = useMemo(() => {
    try {
      const res = generateProbingToolpath(currentStrategy.id, { x: 0, y: 35, z: 0 }, {
        nominalDiameter: Number(params.nominalDiameter) || 40,
        nominalWidth: Number(params.nominalWidth) || 30,
        depthZ: Number(params.depthZ) || -10,
        clearanceZ: Number(params.clearanceZ) || 15
      });
      const estTimeSec = Math.round((res.totalDistance / 1000) * 60 + res.touchPointsCount * 3.5);
      return {
        waypointsCount: res.waypoints.length,
        touchPoints: res.touchPointsCount,
        totalTravelMm: res.totalDistance,
        estTimeSec
      };
    } catch {
      return { waypointsCount: 12, touchPoints: 4, totalTravelMm: 140, estTimeSec: 22 };
    }
  }, [currentStrategy, params]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(liveGCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleAddCycle = () => {
    onAddProbingOperation({
      strategyKey: currentStrategy.id,
      strategyName: currentStrategy.name,
      wcs: targetWcs,
      params: {
        nominalDiameter: Number(params.nominalDiameter) || 40,
        nominalWidth: Number(params.nominalWidth) || 30,
        depthZ: Number(params.depthZ) || -10,
        clearanceZ: Number(params.clearanceZ) || 15,
        overTravel: Number(params.overTravel) || 5,
        corner: params.corner
      }
    });
  };

  return (
    <dialog
      ref={dialogRef}
      id="probing-studio-dialog"
      aria-labelledby="probing-dialog-title"
      closedby="any"
      onClose={onClose}
    >
      <div className="modal-window" style={{ width: '840px', maxWidth: '96vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color, #334155)', padding: '12px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #d946ef, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 2px 8px rgba(217, 70, 239, 0.35)'
            }}>
              <Crosshair size={18} />
            </div>
            <div>
              <div id="probing-dialog-title" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary, #f8fafc)' }}>
                Renishaw Inspection Plus &amp; Haas WIPS Touch Probing Studio
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>
                In-Process Part Centering, WCS Work Coordinate Datum Setup &amp; In-Situ Feature Verification
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close Studio">
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Strategy Selection Grid */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted, #94a3b8)', marginBottom: '8px', textTransform: 'uppercase' }}>
              Select Probing Cycle Strategy
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {Object.entries(PROBING_STRATEGIES).map(([key, strat]) => {
                const isSelected = selectedStrategyKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedStrategyKey(key)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: isSelected ? 'rgba(217, 70, 239, 0.12)' : 'var(--bg-card, rgba(30, 41, 59, 0.5))',
                      border: isSelected ? '1.5px solid #d946ef' : '1px solid var(--border-color, #334155)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '4px' }}>
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: isSelected ? '#d946ef' : 'var(--border-color, #334155)',
                        color: 'white'
                      }}>
                        {strat.code}
                      </span>
                      {isSelected && <CheckCircle2 size={14} color="#d946ef" />}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: isSelected ? '#d946ef' : 'var(--text-primary, #f8fafc)', marginBottom: '2px' }}>
                      {strat.name}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted, #94a3b8)', lineHeight: 1.3 }}>
                      {strat.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Two-Column Setup: Parameters & Kinematic Specs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>

            {/* Left: Cycle Parameters */}
            <div style={{
              background: 'var(--bg-card, rgba(30, 41, 59, 0.5))',
              border: '1px solid var(--border-color, #334155)',
              borderRadius: '8px',
              padding: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted, #94a3b8)', marginBottom: '12px', textTransform: 'uppercase' }}>
                <Sliders size={13} color="#d946ef" />
                Cycle Parameters &amp; Work Coordinate
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Target WCS */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-primary, #f8fafc)' }}>
                    Target Coordinate System (WCS):
                  </label>
                  <select
                    value={targetWcs}
                    onChange={(e) => setTargetWcs(e.target.value)}
                    style={{
                      background: 'var(--bg-input, #0f172a)',
                      color: 'var(--text-primary, #f8fafc)',
                      border: '1px solid var(--border-color, #334155)',
                      borderRadius: '4px',
                      padding: '4px 10px',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                  >
                    <option value="G54">G54 (Primary Fixture)</option>
                    <option value="G55">G55 (Secondary Op)</option>
                    <option value="G56">G56 (Fixture 3)</option>
                    <option value="G57">G57 (Fixture 4)</option>
                    <option value="G58">G58 (Fixture 5)</option>
                    <option value="G59">G59 (Fixture 6)</option>
                  </select>
                </div>

                {/* Diameter for Bore / Boss */}
                {(currentStrategy.id === 'bore_centering' || currentStrategy.id === 'boss_centering') && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-primary, #f8fafc)' }}>
                      Nominal Diameter (D):
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        step="0.5"
                        value={params.nominalDiameter}
                        onChange={(e) => setParams({ ...params, nominalDiameter: e.target.value })}
                        style={{
                          width: '75px',
                          background: 'var(--bg-input, #0f172a)',
                          color: 'var(--text-primary, #f8fafc)',
                          border: '1px solid var(--border-color, #334155)',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '12px',
                          textAlign: 'right'
                        }}
                      />
                      <span style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>mm</span>
                    </div>
                  </div>
                )}

                {/* Width for Web / Rib */}
                {(currentStrategy.id === 'web_x' || currentStrategy.id === 'web_y') && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-primary, #f8fafc)' }}>
                      Nominal Width (W):
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        step="0.5"
                        value={params.nominalWidth}
                        onChange={(e) => setParams({ ...params, nominalWidth: e.target.value })}
                        style={{
                          width: '75px',
                          background: 'var(--bg-input, #0f172a)',
                          color: 'var(--text-primary, #f8fafc)',
                          border: '1px solid var(--border-color, #334155)',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '12px',
                          textAlign: 'right'
                        }}
                      />
                      <span style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>mm</span>
                    </div>
                  </div>
                )}

                {/* Measurement Depth Z */}
                {currentStrategy.id !== 'surface_z' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-primary, #f8fafc)' }}>
                      Measuring Depth (Z):
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        step="1"
                        value={params.depthZ}
                        onChange={(e) => setParams({ ...params, depthZ: e.target.value })}
                        style={{
                          width: '75px',
                          background: 'var(--bg-input, #0f172a)',
                          color: 'var(--text-primary, #f8fafc)',
                          border: '1px solid var(--border-color, #334155)',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '12px',
                          textAlign: 'right'
                        }}
                      />
                      <span style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>mm</span>
                    </div>
                  </div>
                )}

                {/* Clearance Height */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-primary, #f8fafc)' }}>
                    Clearance Retract Height:
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      step="1"
                      value={params.clearanceZ}
                      onChange={(e) => setParams({ ...params, clearanceZ: e.target.value })}
                      style={{
                        width: '75px',
                        background: 'var(--bg-input, #0f172a)',
                        color: 'var(--text-primary, #f8fafc)',
                        border: '1px solid var(--border-color, #334155)',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '12px',
                        textAlign: 'right'
                      }}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>mm</span>
                  </div>
                </div>

                {/* Corner Selection */}
                {currentStrategy.id === 'corner_wcs' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-primary, #f8fafc)' }}>
                      Corner Quadrant:
                    </label>
                    <select
                      value={params.corner}
                      onChange={(e) => setParams({ ...params, corner: e.target.value })}
                      style={{
                        background: 'var(--bg-input, #0f172a)',
                        color: 'var(--text-primary, #f8fafc)',
                        border: '1px solid var(--border-color, #334155)',
                        borderRadius: '4px',
                        padding: '4px 10px',
                        fontSize: '12px'
                      }}
                    >
                      <option value="top_left">Top-Left (-X, +Y)</option>
                      <option value="top_right">Top-Right (+X, +Y)</option>
                      <option value="bottom_left">Bottom-Left (-X, -Y)</option>
                      <option value="bottom_right">Bottom-Right (+X, -Y)</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Touch Probe Kinematics & Health */}
            <div style={{
              background: 'var(--bg-card, rgba(30, 41, 59, 0.5))',
              border: '1px solid var(--border-color, #334155)',
              borderRadius: '8px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted, #94a3b8)', marginBottom: '10px', textTransform: 'uppercase' }}>
                  <ShieldCheck size={13} color="#10b981" />
                  Probe Tool &amp; Kinematic Specs
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Probe Assembly:</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary, #f8fafc)' }}>T99 &bull; Renishaw OMP60 Optical</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Stylus Tip:</span>
                    <span style={{ fontWeight: 600, color: '#ef4444' }}>Ø6.000mm Precision Ruby Ball</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Stem:</span>
                    <span style={{ fontWeight: 600, color: '#22c55e' }}>50mm Ceramic / Carbon Fiber</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Repeatability:</span>
                    <span style={{ fontWeight: 600, color: '#38bdf8' }}>2σ ≤ 1.00 µm</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Touch Feedrate:</span>
                    <span style={{ fontWeight: 600, color: '#d946ef' }}>F150 mm/min</span>
                  </div>
                </div>
              </div>

              {/* Cycle Execution Summary Pill */}
              <div style={{
                marginTop: '12px',
                padding: '8px 10px',
                borderRadius: '6px',
                background: 'rgba(217, 70, 239, 0.08)',
                border: '1px solid rgba(217, 70, 239, 0.25)',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                textAlign: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted, #94a3b8)' }}>TOUCHES</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#d946ef' }}>{trajectoryStats.touchPoints} Pts</div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted, #94a3b8)' }}>DISTANCE</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary, #f8fafc)' }}>{trajectoryStats.totalTravelMm} mm</div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted, #94a3b8)' }}>EST. TIME</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#10b981' }}>~{trajectoryStats.estTimeSec}s</div>
                </div>
              </div>
            </div>
          </div>

          {/* CNC Dialect & Live G-Code Preview */}
          <div style={{
            background: 'var(--bg-card, rgba(30, 41, 59, 0.5))',
            border: '1px solid var(--border-color, #334155)',
            borderRadius: '8px',
            padding: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' }}>
                <Code2 size={13} color="#38bdf8" />
                Live Controller Macro Output
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Dialect selector */}
                <select
                  value={controllerDialect}
                  onChange={(e) => setControllerDialect(e.target.value)}
                  style={{
                    background: 'var(--bg-input, #0f172a)',
                    color: 'var(--text-primary, #f8fafc)',
                    border: '1px solid var(--border-color, #334155)',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 600
                  }}
                >
                  <option value="fanuc">Fanuc / Haas Inspection Plus (G65 P98xx)</option>
                  <option value="siemens">Siemens Sinumerik 840D (CYCLE977/978)</option>
                  <option value="heidenhain">Heidenhain TNC 640 (TCH PROBE 412/417)</option>
                </select>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'var(--bg-input, #0f172a)',
                    border: '1px solid var(--border-color, #334155)',
                    color: copiedCode ? '#10b981' : 'var(--text-primary, #f8fafc)',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  {copiedCode ? <Check size={12} /> : <Copy size={12} />}
                  {copiedCode ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <pre style={{
              margin: 0,
              padding: '10px 12px',
              borderRadius: '6px',
              background: 'var(--bg-input, #0b1120)',
              color: '#38bdf8',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '11px',
              lineHeight: 1.45,
              maxHeight: '120px',
              overflowY: 'auto',
              border: '1px solid rgba(56, 189, 248, 0.2)'
            }}>
              {liveGCode}
            </pre>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color, #334155)', padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            className="secondary-btn"
            onClick={onClose}
            style={{ padding: '7px 16px', fontSize: '12px', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAddCycle}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 18px',
              fontSize: '12px',
              fontWeight: 700,
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #d946ef, #a855f7)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(217, 70, 239, 0.35)'
            }}
          >
            <Crosshair size={14} />
            Generate &amp; Add Probing Cycle
          </button>
        </div>
      </div>
    </dialog>
  );
}

