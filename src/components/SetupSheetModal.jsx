import React, { useEffect, useRef } from 'react';
import { X, Printer, FileText, CheckCircle2, Clock, Wrench, Box } from 'lucide-react';

export default function SetupSheetModal({
  isOpen,
  onClose,
  currentProjectName,
  stockConfig,
  partMetrics,
  tools,
  operations,
  activeMachine
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const handleBackdropClick = (e) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  const dim = partMetrics?.dimensions || { x: 80, y: 35, z: 60 };
  const stockW = (dim.x + (stockConfig.allowanceSides || 4) * 2).toFixed(1);
  const stockH = (dim.y + (stockConfig.allowanceTop || 2)).toFixed(1);
  const stockD = (dim.z + (stockConfig.allowanceSides || 4) * 2).toFixed(1);

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      aria-label="CNC Machining Setup Sheet"
      closedby="any"
    >
      <div className="modal-window" style={{ width: '800px', maxHeight: '88vh' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} color="#38bdf8" />
            <span>CNC Machining Setup Sheet (Shop Floor Documentation)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handlePrint}
              style={{
                background: '#2563eb',
                border: 'none',
                color: 'white',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Printer size={13} />
              Print / Save PDF
            </button>
            <button className="modal-close-btn" onClick={onClose} title="Close (Esc)">
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header Summary Table */}
          <div style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '12px 16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            fontFamily: 'var(--font-sans)',
            fontSize: '11.5px'
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase' }}>Program / Part:</span>
              <div style={{ color: 'var(--accent-blue)', fontWeight: 700, fontSize: '13px' }}>{currentProjectName}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase' }}>Target Machine:</span>
              <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{activeMachine?.name || 'DMG MORI DMU 50 (5-Axis)'}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase' }}>Work Offset (WCS):</span>
              <div style={{ color: '#10b981', fontWeight: 700 }}>G54 (Top Center Stock)</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase' }}>Fixture / Vise:</span>
              <div style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>ZeroClamp Vise (Jaw 49mm)</div>
            </div>
          </div>

          {/* Stock & Material Specs */}
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '10px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Box size={16} color="#f59e0b" />
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Raw Stock Bounding Size: </span>
                <span style={{ color: '#f59e0b', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {stockW} &times; {stockH} &times; {stockD} mm
                </span>
              </div>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Material: </span>
              <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{stockConfig.material} ({stockConfig.massKg} kg)</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Finish Part: </span>
              <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {dim.x} &times; {dim.y} &times; {dim.z} mm
              </span>
            </div>
          </div>

          {/* Tooling List Table */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-blue)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Wrench size={13} />
              <span>SHOP TOOLING LIST</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                  <th style={{ padding: '6px 8px' }}>Tool#</th>
                  <th style={{ padding: '6px 8px' }}>Description</th>
                  <th style={{ padding: '6px 8px' }}>Diameter</th>
                  <th style={{ padding: '6px 8px' }}>Flute Length</th>
                  <th style={{ padding: '6px 8px' }}>Spindle Speed</th>
                  <th style={{ padding: '6px 8px' }}>Feed Rate</th>
                  <th style={{ padding: '6px 8px' }}>Coolant</th>
                </tr>
              </thead>
              <tbody>
                {tools.map((tool) => (
                  <tr key={tool.id} style={{ borderBottom: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)' }}>
                    <td style={{ padding: '6px 8px', color: 'var(--accent-blue)', fontWeight: 700 }}>T{tool.number}</td>
                    <td style={{ padding: '6px 8px', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>{tool.name}</td>
                    <td style={{ padding: '6px 8px', color: 'var(--text-secondary)' }}>&empty;{tool.diameter} mm</td>
                    <td style={{ padding: '6px 8px', color: 'var(--text-secondary)' }}>{tool.fluteLength} mm</td>
                    <td style={{ padding: '6px 8px', color: '#f59e0b' }}>{tool.rpm} RPM</td>
                    <td style={{ padding: '6px 8px', color: '#10b981' }}>{tool.feedRate} mm/min</td>
                    <td style={{ padding: '6px 8px', color: 'var(--text-muted)' }}>{tool.coolant || 'Flood'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Operations Sequence */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={13} />
              <span>OPERATION SEQUENCE & CUTTING PARAMETERS</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                  <th style={{ padding: '6px 8px' }}>Op#</th>
                  <th style={{ padding: '6px 8px' }}>Operation Name</th>
                  <th style={{ padding: '6px 8px' }}>Assigned Tool</th>
                  <th style={{ padding: '6px 8px' }}>Stepdown (ap)</th>
                  <th style={{ padding: '6px 8px' }}>Stepover (ae)</th>
                  <th style={{ padding: '6px 8px' }}>Total Depth</th>
                </tr>
              </thead>
              <tbody>
                {operations.map((op, idx) => (
                  <tr key={op.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '6px 8px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>#{idx + 1}</td>
                    <td style={{ padding: '6px 8px', color: 'var(--text-primary)', fontWeight: 600 }}>{op.name}</td>
                    <td style={{ padding: '6px 8px', color: 'var(--accent-blue)' }}>{op.toolName}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{op.stepdown || 1.0} mm</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{op.stepoverPct || 50}%</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'var(--font-mono)', color: '#f59e0b' }}>{op.totalDepth || 10.0} mm</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Quality Control & First Article Sign-off */}
          <div style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '10px 14px',
            fontSize: '11px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={13} color="#10b981" />
              <span>SHOP FLOOR OPERATOR INSPECTION & FIRST ARTICLE SIGN-OFF</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', color: 'var(--text-secondary)', fontSize: '10.5px' }}>
              <div>[ &nbsp; ] G54 Datum Probed &amp; Set</div>
              <div>[ &nbsp; ] Tool Stickouts Verified</div>
              <div>[ &nbsp; ] Flood Coolant Clean</div>
              <div>[ &nbsp; ] First Article Tolerance (&plusmn;0.02mm)</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-subtle)', paddingTop: '8px', fontSize: '10.5px', color: 'var(--text-muted)' }}>
              <span>CNC Machinist / Operator: _______________________</span>
              <span>QC Inspector: _______________________</span>
              <span>Date: ____ / ____ / 2026</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
            <button className="btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
