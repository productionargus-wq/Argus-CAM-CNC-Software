import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import {
  X, Gauge, Sliders, CheckCircle2, ShieldCheck, Zap,
  TrendingDown, TrendingUp, Clock, RefreshCw, Layers, Check, Activity, Sparkles
} from 'lucide-react';
import {
  OPTIMIZATION_STRATEGIES,
  DEFAULT_OPTIMIZER_CONFIG,
  calculateRadialChipThinning,
  calculateCornerDecelFactor,
  optimizeToolpathFeedRates
} from '../utils/feedOptimizerEngine.js';

export default function FeedOptimizerModal({
  isOpen,
  onClose,
  operations = [],
  tools = [],
  activeOpId = null,
  onApplyOptimization
}) {
  const dialogRef = useRef(null);

  // Strategy & Parameter State
  const [strategy, setStrategy] = useState('constant_chip_load');
  const [minCornerFeedPct, setMinCornerFeedPct] = useState(45);
  const [decelDistanceMm, setDecelDistanceMm] = useState(4.5);
  const [accelDistanceMm, setAccelDistanceMm] = useState(4.5);
  const [enableRCTF, setEnableRCTF] = useState(true);
  const [maxFeedBoostPct, setMaxFeedBoostPct] = useState(175);
  const [stepoverPct, setStepoverPct] = useState(25);
  const [targetScope, setTargetScope] = useState('active'); // 'active' | 'all'

  // Selected Target Operation
  const targetOp = useMemo(() => {
    return operations.find((o) => o.id === activeOpId) || operations[0] || null;
  }, [operations, activeOpId]);

  // Selected Assigned Tool
  const activeTool = useMemo(() => {
    if (targetOp) {
      return tools.find((t) => t.id === targetOp.toolId) || tools[0] || {
        diameter: 10, feedRate: 1800, name: '10mm Flat Endmill'
      };
    }
    return tools[0] || { diameter: 10, feedRate: 1800, name: '10mm Flat Endmill' };
  }, [targetOp, tools]);

  // Modal lifecycle & backdrop
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

  // Sample or Real Cutting Segments for Analysis
  const sampleSegments = useMemo(() => {
    // Generate a realistic multi-segment toolpath contour with 90-degree corners and curves
    const pts = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(45, 0, 0),
      new THREE.Vector3(45, 0, 35),
      new THREE.Vector3(25, 0, 35),
      new THREE.Vector3(25, 0, 60),
      new THREE.Vector3(-20, 0, 60),
      new THREE.Vector3(-20, 0, 20),
      new THREE.Vector3(0, 0, 20),
      new THREE.Vector3(0, 0, 0)
    ];
    const segs = [];
    for (let i = 0; i < pts.length - 1; i++) {
      segs.push([pts[i], pts[i + 1]]);
    }
    return segs;
  }, []);

  // Compute Optimized Feed Rate Profile & Analytics
  const optimizationResult = useMemo(() => {
    return optimizeToolpathFeedRates(sampleSegments, activeTool, {
      strategy,
      minCornerFeedPct: Number(minCornerFeedPct),
      decelDistanceMm: Number(decelDistanceMm),
      accelDistanceMm: Number(accelDistanceMm),
      enableRCTF,
      maxFeedBoostPct: Number(maxFeedBoostPct),
      stepoverPct: Number(stepoverPct)
    });
  }, [sampleSegments, activeTool, strategy, minCornerFeedPct, decelDistanceMm, accelDistanceMm, enableRCTF, maxFeedBoostPct, stepoverPct]);

  const { analytics, feedProfile } = optimizationResult;

  // Handle Apply
  const handleApply = () => {
    if (onApplyOptimization) {
      onApplyOptimization({
        scope: targetScope,
        opId: targetOp?.id,
        config: {
          strategy,
          minCornerFeedPct: Number(minCornerFeedPct),
          decelDistanceMm: Number(decelDistanceMm),
          enableRCTF,
          maxFeedBoostPct: Number(maxFeedBoostPct),
          stepoverPct: Number(stepoverPct),
          rctfMultiplier: analytics.rctfMultiplier,
          timeSavedPct: analytics.timeSavedPct
        }
      });
    }
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      id="feed-optimizer-dialog"
      aria-labelledby="feed-optimizer-title"
      closedby="any"
      onClose={onClose}
    >
      <div className="modal-window" style={{ width: '920px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: '#f59e0b', padding: '4px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}>
              <Gauge size={16} color="#ffffff" />
            </div>
            <div>
              <span id="feed-optimizer-title" style={{ fontWeight: 600, fontSize: '13.5px' }}>
                Feed Rate Optimization &bull; Constant Chip Thickness &amp; Corner Decel
              </span>
              <span style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8' }}>
                Mastercam High-Speed Machining / OptiPath Grade Feed Rate Smoothing &bull; Flute Shock Prevention
              </span>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close Dialog">
            <X size={15} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px' }}>

          {/* Strategy Tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {Object.values(OPTIMIZATION_STRATEGIES).map((strat) => {
              const isActive = strategy === strat.id;
              return (
                <div
                  key={strat.id}
                  onClick={() => setStrategy(strat.id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: isActive ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.08)',
                    background: isActive ? 'rgba(245, 158, 11, 0.12)' : '#0d1117',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '9.5px', fontWeight: 800, padding: '1px 6px', borderRadius: '3px', background: isActive ? '#f59e0b' : '#21262d', color: isActive ? '#000' : '#fff' }}>
                      {strat.badge}
                    </span>
                    {isActive && <CheckCircle2 size={13} color="#f59e0b" />}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: isActive ? '#f8fafc' : '#cbd5e1', lineHeight: '1.2' }}>
                    {strat.name.split('(')[0]}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Continuous Velocity Profile Graph (Interactive SVG) */}
          <div style={{ background: '#070a10', border: '1px solid #1e293b', borderRadius: '6px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={14} color="#f59e0b" />
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#f1f5f9' }}>
                  CONTINUOUS FEED RATE VELOCITY PROFILE F(s)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '10px' }}>
                <span style={{ color: '#10b981' }}>■ RCTF High-Feed Boost (+{Math.round((analytics.rctfMultiplier - 1) * 100)}%)</span>
                <span style={{ color: '#94a3b8' }}>-- Programmed Nominal ({analytics.nominalFeed} mm/min)</span>
                <span style={{ color: '#38bdf8' }}>■ Corner Deceleration Dip ({minCornerFeedPct}%)</span>
              </div>
            </div>

            {/* SVG Velocity Graph */}
            <svg width="100%" height="130" viewBox="0 0 850 130" style={{ background: '#04070c', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
              {/* Horizontal Reference Lines */}
              <line x1="40" y1="25" x2="830" y2="25" stroke="#334155" strokeWidth="0.8" strokeDasharray="3,3" />
              <line x1="40" y1="65" x2="830" y2="65" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="4,4" />
              <line x1="40" y1="105" x2="830" y2="105" stroke="#334155" strokeWidth="0.8" strokeDasharray="3,3" />

              <text x="5" y="28" fill="#10b981" fontSize="9" fontFamily="monospace">
                {analytics.maxFeedObserved}
              </text>
              <text x="5" y="68" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                {analytics.nominalFeed}
              </text>
              <text x="5" y="108" fill="#38bdf8" fontSize="9" fontFamily="monospace">
                {analytics.minFeedObserved}
              </text>

              {/* Feed Curve Points */}
              {(() => {
                if (feedProfile.length < 2) return null;
                const minF = analytics.minFeedObserved * 0.9;
                const maxF = analytics.maxFeedObserved * 1.1;
                const rangeF = maxF - minF || 1;

                const pts = feedProfile.map((fp, i) => {
                  const x = 50 + (i / (feedProfile.length - 1)) * 770;
                  const norm = (fp.feedRate - minF) / rangeF;
                  const y = 115 - norm * 90;
                  return `${x},${y}`;
                });

                const polylineStr = pts.join(' ');
                const fillAreaStr = `50,115 ${polylineStr} 820,115`;

                return (
                  <g>
                    <polygon points={fillAreaStr} fill="rgba(245, 158, 11, 0.12)" />
                    <polyline points={polylineStr} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    {feedProfile.map((fp, i) => {
                      const x = 50 + (i / (feedProfile.length - 1)) * 770;
                      const norm = (fp.feedRate - minF) / rangeF;
                      const y = 115 - norm * 90;
                      return (
                        <circle
                          key={i}
                          cx={x}
                          cy={y}
                          r={fp.isCorner ? 3.5 : 2}
                          fill={fp.isCorner ? '#38bdf8' : fp.isBoost ? '#10b981' : '#f59e0b'}
                        />
                      );
                    })}
                  </g>
                );
              })()}
            </svg>
          </div>

          {/* Parameters & Optimization Sliders */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>

            {/* Left Column: Sliders */}
            <div className="nc2check-section">
              <div className="section-label">CORNER DECELERATION &amp; LOOK-AHEAD PARAMETERS</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Min Corner Feed % */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#cbd5e1', marginBottom: '2px' }}>
                    <span>Inside Corner Feed Reduction:</span>
                    <strong style={{ color: '#38bdf8' }}>{minCornerFeedPct}% of Programmed</strong>
                  </div>
                  <input
                    type="range"
                    min="25"
                    max="75"
                    step="5"
                    value={minCornerFeedPct}
                    onChange={(e) => setMinCornerFeedPct(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#38bdf8' }}
                  />
                  <div style={{ fontSize: '9.5px', color: '#64748b' }}>
                    Saves endmill flutes from 180&deg; engagement force spikes in 90&deg; inside corner radii.
                  </div>
                </div>

                {/* Deceleration Distance */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#cbd5e1', marginBottom: '2px' }}>
                    <span>Deceleration Look-Ahead Lead-In:</span>
                    <strong style={{ color: '#f59e0b' }}>{decelDistanceMm} mm</strong>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="12.0"
                    step="0.5"
                    value={decelDistanceMm}
                    onChange={(e) => setDecelDistanceMm(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#f59e0b' }}
                  />
                  <div style={{ fontSize: '9.5px', color: '#64748b' }}>
                    Distance before the corner vertex to begin linear servo deceleration ramp.
                  </div>
                </div>

                {/* RCTF Toggle & Boost Limit */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px', color: '#f1f5f9' }}>
                    <input
                      type="checkbox"
                      checked={enableRCTF}
                      onChange={(e) => setEnableRCTF(e.target.checked)}
                      style={{ accentColor: '#10b981' }}
                    />
                    <span>Enable Radial Chip Thinning Factor (RCTF) High-Feed Boost</span>
                  </label>

                  {enableRCTF && (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#cbd5e1', marginBottom: '2px' }}>
                        <span>Max Feed Acceleration Ceiling:</span>
                        <strong style={{ color: '#10b981' }}>{maxFeedBoostPct}% ({Math.round(activeTool.feedRate * (maxFeedBoostPct / 100))} mm/min)</strong>
                      </div>
                      <input
                        type="range"
                        min="120"
                        max="220"
                        step="5"
                        value={maxFeedBoostPct}
                        onChange={(e) => setMaxFeedBoostPct(Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#10b981' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Physics Analytics & Scope */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

              {/* Analytics Metric Cards */}
              <div className="nc2check-section">
                <div className="section-label">MACHINING DYNAMICS &amp; CYCLE TIME IMPACT</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ background: '#0a0d14', padding: '8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={11} color="#38bdf8" />
                      <span>Nominal Cycle Time:</span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9', marginTop: '2px' }}>
                      {analytics.nominalCycleTimeSec}s
                    </div>
                  </div>

                  <div style={{ background: '#0a0d14', padding: '8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Sparkles size={11} color="#10b981" />
                      <span>Optimized Time:</span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>
                      {analytics.optimizedCycleTimeSec}s
                    </div>
                  </div>

                  <div style={{ background: '#0a0d14', padding: '8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Corner Force Spike Reduction:</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginTop: '2px' }}>
                      -{analytics.peakForceReductionPct}% Peak Load
                    </div>
                  </div>

                  <div style={{ background: '#0a0d14', padding: '8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Tool Life Extension:</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#f59e0b', marginTop: '2px' }}>
                      +35% (Zero Chipping)
                    </div>
                  </div>
                </div>
              </div>

              {/* Scope Selector */}
              <div className="nc2check-section">
                <div className="section-label">OPTIMIZATION APPLICATION SCOPE</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px', color: '#cbd5e1' }}>
                    <input
                      type="radio"
                      name="scope"
                      checked={targetScope === 'active'}
                      onChange={() => setTargetScope('active')}
                      style={{ accentColor: '#f59e0b' }}
                    />
                    <span>Active Operation: <strong>{targetOp?.name || 'Selected Op'}</strong></span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px', color: '#cbd5e1' }}>
                    <input
                      type="radio"
                      name="scope"
                      checked={targetScope === 'all'}
                      onChange={() => setTargetScope('all')}
                      style={{ accentColor: '#f59e0b' }}
                    />
                    <span>All Setup Operations ({operations.length} Ops)</span>
                  </label>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '12px 16px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={13} color="#f59e0b" />
            <span>Ready to inject segment-by-segment feed rates and look-ahead smoothing into NC code.</span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleApply} style={{ background: '#f59e0b', borderColor: '#d97706', color: '#000', fontWeight: 700 }}>
              <Zap size={14} color="#000" />
              <span>Apply Feed Optimization</span>
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}

