import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  X, Compass, Sliders, CheckCircle2, ShieldCheck, Play,
  RefreshCw, Info, ArrowUpRight, RotateCw, Check, Code2
} from 'lucide-react';
import {
  LEAD_ENTRY_TYPES,
  DEFAULT_LEAD_CONFIG,
  buildTangentArcLeadIn,
  buildTangentArcLeadOut
} from '../utils/leadInOutEngine.js';

export default function LeadInOutDesignerModal({
  isOpen,
  onClose,
  operations = [],
  activeOpId = null,
  onUpdateOperations
}) {
  const dialogRef = useRef(null);

  const [entryType, setEntryType] = useState('tangent_arc');
  const [exitType, setExitType] = useState('tangent_arc');
  const [arcRadius, setArcRadius] = useState(5.0);
  const [sweepAngleDeg, setSweepAngleDeg] = useState(90);
  const [linearExtension, setLinearExtension] = useState(3.0);
  const [overlapDist, setOverlapDist] = useState(2.0);
  const [microLiftExit, setMicroLiftExit] = useState(0.35);
  const [cutterComp, setCutterComp] = useState('G41');
  const [targetScope, setTargetScope] = useState('all'); // 'all' | 'selected'

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

  // Generate live G-Code snippet preview
  const gcodeSnippet = useMemo(() => {
    const lines = [];
    lines.push(`; --- LEAD-IN WITH CUTTER RADIUS COMPENSATION ---`);
    if (cutterComp !== 'off') {
      lines.push(`N40 G01 ${cutterComp} D1 X-8.000 Y+5.000 F800. (COMPENSATION ON DURING LINEAR APPROACH)`);
    } else {
      lines.push(`N40 G01 X-8.000 Y+5.000 F800. (LINEAR APPROACH)`);
    }
    if (entryType === 'tangent_arc') {
      lines.push(`N50 G03 X+0.000 Y+0.000 R${arcRadius.toFixed(3)} F1500. (TANGENT ENTRY ARC R${arcRadius})`);
    } else {
      lines.push(`N50 G01 X+0.000 Y+0.000 F1500. (PERPENDICULAR CONTACT)`);
    }
    lines.push(`; ... [WORKPIECE CONTOUR PASS] ...`);
    if (overlapDist > 0) {
      lines.push(`N80 G01 X+${overlapDist.toFixed(3)} Y+0.000 (SEAM OVERLAP TO ERASE WITNESS MARK)`);
    }
    if (exitType === 'tangent_arc') {
      lines.push(`N90 G03 X+${(overlapDist + arcRadius).toFixed(3)} Y+${arcRadius.toFixed(3)} R${arcRadius.toFixed(3)} (TANGENT DEPARTURE ARC)`);
    }
    if (cutterComp !== 'off') {
      lines.push(`N100 G01 G40 X+${(overlapDist + arcRadius + linearExtension).toFixed(3)} Y+${arcRadius.toFixed(3)} (CANCEL COMPENSATION)`);
    }
    lines.push(`N110 G00 Z+15.000 (RAPID RETRACT)`);
    return lines.join('\n');
  }, [entryType, exitType, arcRadius, sweepAngleDeg, linearExtension, overlapDist, cutterComp]);

  const handleApply = () => {
    const config = {
      entryType,
      exitType,
      arcRadius: Number(arcRadius),
      sweepAngleDeg: Number(sweepAngleDeg),
      linearExtension: Number(linearExtension),
      overlapDist: Number(overlapDist),
      microLiftExit: Number(microLiftExit),
      cutterComp
    };

    const updated = operations.map((op) => {
      const isTarget = targetScope === 'all' || op.id === activeOpId;
      if (!isTarget) return op;
      return {
        ...op,
        leadConfig: config
      };
    });

    onUpdateOperations(updated);
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      id="lead-in-out-dialog"
      aria-labelledby="lead-dialog-title"
      closedby="any"
      onClose={onClose}
    >
      <div className="modal-window" style={{ width: '860px', maxWidth: '96vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color, #334155)', padding: '12px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #10b981, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)'
            }}>
              <Compass size={18} />
            </div>
            <div>
              <div id="lead-dialog-title" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary, #f8fafc)' }}>
                Toolpath Lead-In / Lead-Out &amp; Tangent Arc Designer
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>
                Smooth Tangential Arc Entry/Exit &bull; G41/G42 Cutter Radius Compensation &bull; Witness Mark Erasure
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close Lead Designer">
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Top: 2D Interactive SVG Visualizer & G-Code Preview */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '14px' }}>

            {/* SVG Visualizer */}
            <div style={{
              background: '#090d16',
              borderRadius: '8px',
              border: '1px solid #1f293d',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, marginBottom: '6px', width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                <span>2D TANGENT TRAJECTORY KINEMATICS</span>
                <span style={{ color: '#10b981' }}>R{arcRadius}mm &bull; {sweepAngleDeg}&deg; Sweep</span>
              </div>

              {/* Dynamic SVG Schematic */}
              <svg width="340" height="150" viewBox="0 0 340 150" style={{ background: '#0f172a', borderRadius: '6px' }}>
                {/* Finished Workpiece Wall */}
                <line x1="40" y1="90" x2="300" y2="90" stroke="#475569" strokeWidth="4" />
                <text x="170" y="106" fill="#94a3b8" fontSize="9" textAnchor="middle">FINISHED PART WALL</text>

                {/* Linear Lead-In Extension (Blue) */}
                <line x1="50" y1="35" x2="90" y2="35" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3,3" />
                <circle cx="50" cy="35" r="3" fill="#38bdf8" />
                <text x="50" y="26" fill="#38bdf8" fontSize="8" fontWeight="bold">G41 Lead-In</text>

                {/* Tangent Entry Arc (Green) */}
                <path d={`M 90 35 A 55 55 0 0 1 145 90`} fill="none" stroke="#10b981" strokeWidth="2.5" />
                <circle cx="145" cy="90" r="3" fill="#10b981" />
                <text x="110" y="55" fill="#10b981" fontSize="9" fontWeight="bold">R{arcRadius}</text>

                {/* Active Contour Pass (Gold) */}
                <line x1="145" y1="90" x2="225" y2="90" stroke="#f59e0b" strokeWidth="2.5" />

                {/* Overlap Zone (Purple) */}
                <line x1="225" y1="90" x2="245" y2="90" stroke="#a855f7" strokeWidth="2.5" strokeDasharray="2,2" />
                <text x="235" y="82" fill="#a855f7" fontSize="8">Overlap</text>

                {/* Tangent Departure Arc (Magenta) */}
                <path d={`M 245 90 A 50 50 0 0 1 295 40`} fill="none" stroke="#d946ef" strokeWidth="2.5" />
                <circle cx="295" cy="40" r="3" fill="#d946ef" />

                {/* Rapid Retract Arrow (Cyan) */}
                <line x1="295" y1="40" x2="325" y2="20" stroke="#06b6d4" strokeWidth="2" strokeDasharray="3,3" />
                <text x="310" y="15" fill="#06b6d4" fontSize="8">G00 Retract</text>
              </svg>
            </div>

            {/* Live G-Code Preview */}
            <div style={{
              background: '#090d16',
              borderRadius: '8px',
              border: '1px solid #1f293d',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#94a3b8', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>
                <Code2 size={13} color="#38bdf8" />
                CNC Compensation &amp; Arc Output
              </div>

              <pre style={{
                margin: 0,
                padding: '8px',
                borderRadius: '4px',
                background: '#0b1120',
                color: '#38bdf8',
                fontFamily: 'monospace',
                fontSize: '10px',
                lineHeight: 1.45,
                flex: 1,
                overflowY: 'auto'
              }}>
                {gcodeSnippet}
              </pre>
            </div>
          </div>

          {/* Bottom Controls: Two-Column Form */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

            {/* Left: Lead-In Arc Configuration */}
            <div style={{
              background: 'var(--bg-card, rgba(30, 41, 59, 0.5))',
              border: '1px solid var(--border-color, #334155)',
              borderRadius: '8px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>
                <ArrowUpRight size={14} />
                Lead-In (Entry) Parameters
              </div>

              {/* Entry Type */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted, #94a3b8)', marginBottom: '4px' }}>
                  Entry Strategy:
                </label>
                <select
                  value={entryType}
                  onChange={(e) => setEntryType(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input, #0f172a)',
                    color: 'var(--text-primary, #f8fafc)',
                    border: '1px solid var(--border-color, #334155)',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 600
                  }}
                >
                  {Object.values(LEAD_ENTRY_TYPES).map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} &bull; [{st.badge}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Arc Radius Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                  <span style={{ color: 'var(--text-primary, #f8fafc)' }}>Tangent Arc Radius (R):</span>
                  <span style={{ fontWeight: 800, color: '#10b981' }}>{arcRadius} mm</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="15"
                  step="0.5"
                  value={arcRadius}
                  onChange={(e) => setArcRadius(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#10b981' }}
                />
              </div>

              {/* Sweep Angle */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                  <span style={{ color: 'var(--text-primary, #f8fafc)' }}>Arc Sweep Angle (&alpha;):</span>
                  <span style={{ fontWeight: 800, color: '#38bdf8' }}>{sweepAngleDeg}&deg;</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="90"
                  step="5"
                  value={sweepAngleDeg}
                  onChange={(e) => setSweepAngleDeg(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#38bdf8' }}
                />
              </div>

              {/* Linear Extension Length */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-primary, #f8fafc)' }}>Linear Lead Distance:</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="number"
                    step="0.5"
                    value={linearExtension}
                    onChange={(e) => setLinearExtension(Number(e.target.value))}
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

            {/* Right: Lead-Out & Cutter Compensation */}
            <div style={{
              background: 'var(--bg-card, rgba(30, 41, 59, 0.5))',
              border: '1px solid var(--border-color, #334155)',
              borderRadius: '8px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#d946ef', textTransform: 'uppercase' }}>
                <RotateCw size={14} />
                Lead-Out (Exit) &amp; Cutter Comp
              </div>

              {/* Cutter Radius Compensation (G41/G42) */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted, #94a3b8)', marginBottom: '4px' }}>
                  Cutter Radius Compensation (CRC):
                </label>
                <select
                  value={cutterComp}
                  onChange={(e) => setCutterComp(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input, #0f172a)',
                    color: 'var(--text-primary, #f8fafc)',
                    border: '1px solid var(--border-color, #334155)',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 600
                  }}
                >
                  <option value="G41">G41 Left &bull; Climb Milling (Standard)</option>
                  <option value="G42">G42 Right &bull; Conventional Milling</option>
                  <option value="off">Off &bull; Centerline Toolpath</option>
                </select>
              </div>

              {/* Overlap Distance */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-primary, #f8fafc)' }}>Contour Overlap Distance:</div>
                  <div style={{ fontSize: '9px', color: '#94a3b8' }}>Erases seam marks at entry point</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="number"
                    step="0.5"
                    value={overlapDist}
                    onChange={(e) => setOverlapDist(Number(e.target.value))}
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

              {/* Micro-Lift on Departure */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-primary, #f8fafc)' }}>Exit Micro-Lift Z:</div>
                  <div style={{ fontSize: '9px', color: '#94a3b8' }}>Lifts off wall during departure arc</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="number"
                    step="0.05"
                    value={microLiftExit}
                    onChange={(e) => setMicroLiftExit(Number(e.target.value))}
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

              {/* Scope */}
              <div style={{ borderTop: '1px solid #334155', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>Apply Scope:</span>
                <select
                  value={targetScope}
                  onChange={(e) => setTargetScope(e.target.value)}
                  style={{
                    background: 'var(--bg-input, #0f172a)',
                    color: 'var(--text-primary, #f8fafc)',
                    border: '1px solid var(--border-color, #334155)',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '11px'
                  }}
                >
                  <option value="all">All Contour &amp; Pocket Operations ({operations.length})</option>
                  <option value="selected">Selected Operation Only</option>
                </select>
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
              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(16, 185, 129, 0.35)'
            }}
          >
            <Check size={14} />
            Apply Lead In/Out to Operations
          </button>
        </div>

      </div>
    </dialog>
  );
}

