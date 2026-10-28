import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  X, Zap, Gauge, Sliders, CheckCircle2, ShieldCheck, Play,
  RefreshCw, Info, ArrowRight, Flame, Cpu, Check
} from 'lucide-react';
import {
  ADAPTIVE_MATERIALS,
  calculateAdaptivePhysics,
  generateAdaptiveTrochoidalToolpath
} from '../utils/adaptiveRoughingEngine.js';

export default function AdaptiveRoughingModal({
  isOpen,
  onClose,
  tools = [],
  operations = [],
  stockConfig = {},
  partMetrics = null,
  onAddAdaptiveOperation
}) {
  const dialogRef = useRef(null);

  const [selectedMaterialKey, setSelectedMaterialKey] = useState('TITANIUM');
  const [selectedToolId, setSelectedToolId] = useState(tools[0]?.id || 1);
  const [stepoverPct, setStepoverPct] = useState(12);
  const [axialDepth, setAxialDepth] = useState(18.0);
  const [totalDepth, setTotalDepth] = useState(20.0);
  const [microLift, setMicroLift] = useState(0.35);
  const [helicalRampAngle, setHelicalRampAngle] = useState(2.0);

  const selectedTool = useMemo(() => {
    return tools.find((t) => t.id === Number(selectedToolId)) || tools[0] || {
      id: 1, number: 1, name: '10mm 4-Flute Endmill', diameter: 10, flutes: 4, rpm: 8000, feedRate: 1500
    };
  }, [tools, selectedToolId]);

  // When material changes, update stepover to recommended
  const handleSelectMaterial = (key) => {
    setSelectedMaterialKey(key);
    const mat = ADAPTIVE_MATERIALS[key];
    if (mat) {
      setStepoverPct(mat.recommendedStepoverPct);
      setAxialDepth(Number((selectedTool.diameter * mat.recommendedAxialDepthFactor).toFixed(1)));
    }
  };

  // Real-time Physics Calculation
  const physics = useMemo(() => {
    return calculateAdaptivePhysics(
      selectedTool,
      { stepoverPct, stepdown: axialDepth },
      selectedMaterialKey
    );
  }, [selectedTool, stepoverPct, axialDepth, selectedMaterialKey]);

  // Modal lifecycle & backdrop handler
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

  const handleApply = () => {
    const nextId = operations.length > 0 ? Math.max(...operations.map((o) => o.id)) + 1 : 1;
    const op = {
      id: nextId,
      name: `Adaptive Trochoidal Roughing (${physics.material.name.split(' ')[0]})`,
      toolId: selectedTool.id,
      toolName: `T${selectedTool.number} - ${selectedTool.name}`,
      badgeClass: 'adaptive',
      badgeText: 'AD',
      visible: true,
      stepoverPct: Number(stepoverPct),
      stepdown: Number(axialDepth),
      totalDepth: Number(totalDepth),
      stockToLeaveXY: 0.25,
      stockToLeaveZ: 0.1,
      rapidHeight: 15.0,
      feedRate: physics.feedRate,
      spindleRpm: physics.rpm,
      adaptiveParams: {
        material: selectedMaterialKey,
        microLift: Number(microLift),
        helicalRampAngle: Number(helicalRampAngle),
        engagementDeg: physics.engagementDeg
      }
    };

    onAddAdaptiveOperation(op);
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      id="adaptive-roughing-dialog"
      aria-labelledby="adaptive-dialog-title"
      closedby="any"
      onClose={onClose}
    >
      <div className="modal-window" style={{ width: '880px', maxWidth: '96vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color, #334155)', padding: '12px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #06b6d4, #0284c7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 2px 8px rgba(6, 182, 212, 0.35)'
            }}>
              <Zap size={18} />
            </div>
            <div>
              <div id="adaptive-dialog-title" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary, #f8fafc)' }}>
                Adaptive Trochoidal High-Speed Roughing Studio (Dynamic Motion)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>
                Constant Tool Engagement Angle &bull; Radial Chip Thinning Feed Compensation &bull; Deep Axial Single-Pass
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close Studio">
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Material Presets Grid */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted, #94a3b8)', marginBottom: '8px', textTransform: 'uppercase' }}>
              Select Workpiece Material Machinability Preset
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
              {Object.entries(ADAPTIVE_MATERIALS).map(([key, mat]) => {
                const isSelected = selectedMaterialKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectMaterial(key)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '10px 8px',
                      borderRadius: '6px',
                      background: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-card, rgba(30, 41, 59, 0.5))',
                      border: isSelected ? '1.5px solid #06b6d4' : '1px solid var(--border-color, #334155)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '3px' }}>
                      <span style={{ fontSize: '9px', fontWeight: 700, color: isSelected ? '#06b6d4' : 'var(--text-muted, #94a3b8)' }}>
                        {mat.hardness}
                      </span>
                      {isSelected && <Check size={13} color="#06b6d4" />}
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: isSelected ? '#06b6d4' : 'var(--text-primary, #f8fafc)', lineHeight: 1.2, marginBottom: '2px' }}>
                      {mat.name.split(' ')[0]}
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted, #94a3b8)' }}>
                      Opt: {mat.recommendedStepoverPct}% ae
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Two-Column Setup: Parameters on Left, Physics Dashboard on Right */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.2fr', gap: '16px' }}>

            {/* Left: Milling Parameters */}
            <div style={{
              background: 'var(--bg-card, rgba(30, 41, 59, 0.5))',
              border: '1px solid var(--border-color, #334155)',
              borderRadius: '8px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' }}>
                <Sliders size={13} color="#06b6d4" />
                Adaptive Kinematic Parameters
              </div>

              {/* Tool Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted, #94a3b8)', marginBottom: '4px' }}>
                  Cutter Endmill:
                </label>
                <select
                  value={selectedToolId}
                  onChange={(e) => setSelectedToolId(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input, #0f172a)',
                    color: 'var(--text-primary, #f8fafc)',
                    border: '1px solid var(--border-color, #334155)',
                    borderRadius: '4px',
                    padding: '5px 8px',
                    fontSize: '11px',
                    fontWeight: 600
                  }}
                >
                  {tools.map((t) => (
                    <option key={t.id} value={t.id}>
                      T{t.number} &bull; {t.name} (Ø{t.diameter}mm, {t.flutes || 4}-Flute)
                    </option>
                  ))}
                </select>
              </div>

              {/* Radial Stepover ae slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                  <span style={{ color: 'var(--text-primary, #f8fafc)' }}>Radial Stepover (ae):</span>
                  <span style={{ fontWeight: 800, color: '#06b6d4' }}>{stepoverPct}% ({physics.stepoverMm} mm)</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  step="1"
                  value={stepoverPct}
                  onChange={(e) => setStepoverPct(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#06b6d4' }}
                />
              </div>

              {/* Axial Depth ap */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                  <span style={{ color: 'var(--text-primary, #f8fafc)' }}>Axial Stepdown Depth (ap):</span>
                  <span style={{ fontWeight: 800, color: '#10b981' }}>{axialDepth} mm ({(axialDepth / selectedTool.diameter).toFixed(1)}x D)</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max={Math.max(25, selectedTool.diameter * 3)}
                  step="0.5"
                  value={axialDepth}
                  onChange={(e) => setAxialDepth(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#10b981' }}
                />
              </div>

              {/* Total Depth */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-primary, #f8fafc)' }}>Total Cavity Depth:</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="number"
                    step="1"
                    value={totalDepth}
                    onChange={(e) => setTotalDepth(Number(e.target.value))}
                    style={{
                      width: '60px',
                      background: 'var(--bg-input, #0f172a)',
                      color: 'var(--text-primary, #f8fafc)',
                      border: '1px solid var(--border-color, #334155)',
                      borderRadius: '4px',
                      padding: '3px 6px',
                      fontSize: '11px',
                      textAlign: 'right'
                    }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>mm</span>
                </div>
              </div>

              {/* Micro-Lift Height */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-primary, #f8fafc)' }}>Micro-Lift Non-Cutting Retract:</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="number"
                    step="0.05"
                    value={microLift}
                    onChange={(e) => setMicroLift(Number(e.target.value))}
                    style={{
                      width: '60px',
                      background: 'var(--bg-input, #0f172a)',
                      color: 'var(--text-primary, #f8fafc)',
                      border: '1px solid var(--border-color, #334155)',
                      borderRadius: '4px',
                      padding: '3px 6px',
                      fontSize: '11px',
                      textAlign: 'right'
                    }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>mm</span>
                </div>
              </div>
            </div>

            {/* Right: Physics & Dynamic Motion Dashboard */}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted, #94a3b8)', marginBottom: '12px', textTransform: 'uppercase' }}>
                  <Gauge size={13} color="#10b981" />
                  Dynamic Motion Physics &amp; Chip Thinning
                </div>

                {/* 4-Box Key Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ background: '#161e2e', padding: '10px', borderRadius: '6px', border: '1px solid #283347' }}>
                    <div style={{ fontSize: '9px', color: '#94a3b8' }}>CONSTANT ENGAGEMENT</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#06b6d4' }}>{physics.engagementDeg}&deg;</div>
                    <div style={{ fontSize: '9px', color: '#10b981' }}>Constant Cutter Arc</div>
                  </div>

                  <div style={{ background: '#161e2e', padding: '10px', borderRadius: '6px', border: '1px solid #283347' }}>
                    <div style={{ fontSize: '9px', color: '#94a3b8' }}>FEED COMPENSATION (RCTF)</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#10b981' }}>+{physics.feedRateBoostPct}%</div>
                    <div style={{ fontSize: '9px', color: '#38bdf8' }}>{physics.rctfMultiplier}x Chip Thinning</div>
                  </div>

                  <div style={{ background: '#161e2e', padding: '10px', borderRadius: '6px', border: '1px solid #283347' }}>
                    <div style={{ fontSize: '9px', color: '#94a3b8' }}>MATERIAL REMOVAL RATE</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#f59e0b' }}>{physics.mrrCm3Min} <span style={{ fontSize: '10px' }}>cm&sup3;/min</span></div>
                    <div style={{ fontSize: '9px', color: '#94a3b8' }}>Volumetric Efficiency</div>
                  </div>

                  <div style={{ background: '#161e2e', padding: '10px', borderRadius: '6px', border: '1px solid #283347' }}>
                    <div style={{ fontSize: '9px', color: '#94a3b8' }}>SPINDLE CUTTING POWER</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#a855f7' }}>{physics.powerKw} <span style={{ fontSize: '10px' }}>kW</span></div>
                    <div style={{ fontSize: '9px', color: '#94a3b8' }}>Safe for 15kW Spindle</div>
                  </div>
                </div>

                {/* Operating RPM & Feed Banner */}
                <div style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: 'rgba(6, 182, 212, 0.08)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  fontSize: '11px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ color: 'var(--text-primary, #f8fafc)', fontWeight: 600 }}>Optimized Dynamic Feed:</span>
                  <span style={{ fontWeight: 800, color: '#06b6d4', fontFamily: 'monospace' }}>
                    S{physics.rpm} RPM &bull; F{physics.feedRate} mm/min
                  </span>
                </div>
              </div>

              {/* Safety & Tool Life summary */}
              <div style={{ marginTop: '10px', fontSize: '10px', color: '#94a3b8', lineHeight: 1.4 }}>
                <ShieldCheck size={12} color="#10b981" style={{ display: 'inline', marginRight: '4px' }} />
                <span>Constant cutter engagement prevents thermal shocks &amp; localized work-hardening in superalloys, extending carbide tool life by up to 300%.</span>
              </div>
            </div>
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
            onClick={handleApply}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 18px',
              fontSize: '12px',
              fontWeight: 700,
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #06b6d4, #0284c7)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(6, 182, 212, 0.35)'
            }}
          >
            <Zap size={14} />
            Generate Adaptive Roughing Operation
          </button>
        </div>

      </div>
    </dialog>
  );
}
