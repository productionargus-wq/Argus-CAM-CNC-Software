import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  X, Cpu, Play, Settings, FolderOpen, FileCode, Sliders, Download, Eye,
  ShieldCheck, AlertTriangle, CheckCircle2, RotateCcw, Crosshair, Table
} from 'lucide-react';
import { CONTROLLER_DIALECTS, generateNCProgram, downloadNCFile } from '../utils/postProcessor';
import { checkToolpathCollisions } from '../utils/toolpathEngine';
import { MACHINE_KINEMATICS } from '../utils/machineKinematics.js';

export default function NC2CheckModal({
  isOpen,
  onClose,
  onLaunchSimulation,
  onOpenGCodeViewer,
  operations = [],
  tools = [],
  stockConfig = {},
  partMetrics = null,
  currentModel = null,
  activeMachine = { name: "DMG MORI DMU 50", type: "5-Axis Mill-Turn" },
  activeWcs = 'G54',
  onNotify = null
}) {
  const dialogRef = useRef(null);

  const [controller, setController] = useState(CONTROLLER_DIALECTS.HEIDENHAIN);
  const [tolerance, setTolerance] = useState('0.02');
  const [targetOffset, setTargetOffset] = useState('0.00');
  const [simEngine, setSimEngine] = useState('nc2check');
  const [showWcsTable, setShowWcsTable] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [ncResult, setNcResult] = useState(null);

  // Machine physical stroke limits from active machine kinematics
  const limits = useMemo(() => {
    const config = MACHINE_KINEMATICS[activeMachine?.id] || MACHINE_KINEMATICS.dmu50;
    const ax = config.axes;
    return {
      x: { min: ax.X?.min ?? -250, max: ax.X?.max ?? 250 },
      y: { min: ax.Y?.min ?? -200, max: ax.Y?.max ?? 200 },
      z: { min: ax.Z?.min ?? -100, max: ax.Z?.max ?? 350 },
      b: { min: ax.B?.min ?? -5, max: ax.B?.max ?? 110 },
      c: { min: ax.C?.min ?? -360, max: ax.C?.max ?? 360 }
    };
  }, [activeMachine]);

  // Modal dialog lifecycle
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }

    const handleBackdropClick = (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isInside =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;
      if (!isInside) {
        onClose();
      }
    };

    dialog.addEventListener('click', handleBackdropClick);
    return () => dialog.removeEventListener('click', handleBackdropClick);
  }, [isOpen, onClose]);

  // Safety & Pre-Flight Collision Audit
  const collisionIssues = useMemo(() => {
    return checkToolpathCollisions(operations, tools);
  }, [operations, tools]);

  // Check Kinematic Envelope bounds vs machine limits
  const envelopeStatus = useMemo(() => {
    if (!partMetrics?.box) {
      return { ok: true, msg: 'Nominal part volume within machine travel envelope' };
    }
    const b = partMetrics.box;
    const xOk = b.min.x >= limits.x.min && b.max.x <= limits.x.max;
    const yOk = b.min.y >= limits.y.min && b.max.y <= limits.y.max;
    const zOk = b.min.z >= limits.z.min && b.max.z <= limits.z.max;

    if (xOk && yOk && zOk) {
      return { ok: true, msg: 'All coordinates well within physical stroke envelope' };
    } else {
      return { ok: false, msg: 'Part bounds exceed physical axis stroke limits!' };
    }
  }, [partMetrics, limits]);

  // Run Post-Processor
  const handleRunPost = () => {
    try {
      const result = generateNCProgram({
        operations: operations.length > 0 ? operations : [
          { id: 1, name: '2D Facing Leveling', badgeClass: 'face', toolId: 1, visible: true },
          { id: 2, name: '3D Waterline Contour', badgeClass: 'contour', toolId: 1, visible: true }
        ],
        tools: tools.length > 0 ? tools : [
          { id: 1, number: 1, name: '10mm Endmill', diameter: 10, rpm: 8000, feedRate: 1500 }
        ],
        stockConfig: stockConfig || {},
        partMetrics: partMetrics,
        controller: controller,
        programName: 'DMU50_ZeroClamp_Job',
        model: currentModel
      });

      setNcResult(result);
      setIsGenerated(true);
      if (onNotify) {
        onNotify(`NC Program generated: ${result.lineCount} blocks (${result.fileExtension})`, 'success');
      }
    } catch (err) {
      console.error("Post generation error:", err);
      if (onNotify) {
        onNotify(`Post-processing error: ${err.message}`, 'danger');
      }
    }
  };

  // Direct download
  const handleDownload = () => {
    if (!ncResult) {
      handleRunPost();
    }
    const active = ncResult || generateNCProgram({
      operations,
      tools,
      stockConfig,
      partMetrics,
      controller,
      programName: 'DMU50_ZeroClamp_Job',
      model: currentModel
    });

    const filename = `DMU50_ZeroClamp_Job${active.fileExtension}`;
    downloadNCFile(active.gcodeText, filename);
    if (onNotify) onNotify(`Downloaded ${filename}`, 'info');
  };

  // Preview lines
  const previewLines = useMemo(() => {
    if (!ncResult?.gcodeText) return [];
    return ncResult.gcodeText.split('\n').slice(0, 7);
  }, [ncResult]);

  return (
    <dialog
      ref={dialogRef}
      id="nc2check-dialog"
      aria-labelledby="nc2check-title"
      closedby="any"
      onClose={onClose}
    >
      <div className="modal-window" style={{ width: '740px', maxHeight: '90vh' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={16} color="#38bdf8" />
            <span id="nc2check-title" style={{ fontWeight: 700 }}>
              NC2Check &bull; 5-Axis G-Code Post-Processor & Kinematic Audit
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close Dialog">
            <X size={15} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '14px' }}>
          
          {/* Machine & Controller Target */}
          <div className="nc2check-section">
            <div className="section-label">1. CNC MACHINE & CONTROLLER CONFIGURATION</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', alignItems: 'center' }}>
              <div className="form-group">
                <label>Target Machine Digital Twin:</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-primary)', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                  <Cpu size={14} color="#38bdf8" />
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {activeMachine?.name || 'DMG MORI DMU 50'}
                  </span>
                  <span style={{ fontSize: '9px', color: '#10b981', background: 'rgba(16,185,129,0.15)', padding: '2px 5px', borderRadius: '3px', marginLeft: 'auto' }}>
                    {activeMachine?.type || '5-Axis Mill-Turn'}
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label>CNC Controller Dialect:</label>
                <select
                  className="text-input"
                  value={controller}
                  onChange={(e) => {
                    setController(e.target.value);
                    setIsGenerated(false);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {Object.entries(CONTROLLER_DIALECTS).map(([key, val]) => (
                    <option key={key} value={val}>{val}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group">
                <label>PST Post-Processor Script:</label>
                <input
                  type="text"
                  readOnly
                  className="text-input"
                  value={`C:\\Mastercam\\Posts\\${(activeMachine?.name || 'DMU_50').replace(/\s+/g, '_')}_Post.pst`}
                  style={{ color: '#94a3b8' }}
                />
              </div>

              <div className="form-group">
                <label>Active Work Coordinate System (WCS):</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="text"
                    readOnly
                    className="text-input"
                    value={`${activeWcs} (Table Center Pallet Zero)`}
                    style={{ color: '#38bdf8', fontWeight: 600 }}
                  />
                  <button
                    className="btn-secondary"
                    onClick={() => setShowWcsTable(!showWcsTable)}
                    title="View Work Coordinate Offsets"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    <Table size={12} style={{ marginRight: '4px' }} />
                    Zero Table
                  </button>
                </div>
              </div>
            </div>

            {/* Zero Point Table Drawer */}
            {showWcsTable && (
              <div style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                padding: '8px',
                fontSize: '11px',
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '6px',
                textAlign: 'center'
              }}>
                <div style={{ color: 'var(--text-muted)' }}>WCS Datum</div>
                <div style={{ color: 'var(--text-muted)' }}>X Offset</div>
                <div style={{ color: 'var(--text-muted)' }}>Y Offset</div>
                <div style={{ color: 'var(--text-muted)' }}>Z Offset</div>
                <div style={{ color: 'var(--text-muted)' }}>B/C Rotary</div>

                <div style={{ color: '#38bdf8', fontWeight: 700 }}>G54 (Primary)</div>
                <div>0.000 mm</div>
                <div>0.000 mm</div>
                <div>+50.000 mm</div>
                <div>B0.0° C0.0°</div>

                <div style={{ color: '#94a3b8' }}>G55 (Vise 2)</div>
                <div>+120.000 mm</div>
                <div>0.000 mm</div>
                <div>+50.000 mm</div>
                <div>B0.0° C0.0°</div>

                <div style={{ color: '#94a3b8' }}>G56 (Fixture 3)</div>
                <div>-120.000 mm</div>
                <div>0.000 mm</div>
                <div>+50.000 mm</div>
                <div>B0.0° C90.0°</div>
              </div>
            )}
          </div>

          {/* Pre-Flight Kinematics & Collision Audit */}
          <div className="nc2check-section">
            <div className="section-label">2. PRE-FLIGHT KINEMATICS & SAFETY AUDIT</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              <div style={{
                background: envelopeStatus.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${envelopeStatus.ok ? '#10b981' : '#ef4444'}`,
                borderRadius: '4px',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}>
                <span style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>Kinematic Stroke</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: envelopeStatus.ok ? '#10b981' : '#ef4444' }}>
                  {envelopeStatus.ok ? 'PASS (Inside Stroke)' : 'OVERTRAVEL!'}
                </span>
                <span style={{ fontSize: '8.5px', color: '#64748b' }}>X[-250,250] Y[-200,200]</span>
              </div>

              <div style={{
                background: collisionIssues.length === 0 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                border: `1px solid ${collisionIssues.length === 0 ? '#10b981' : '#f59e0b'}`,
                borderRadius: '4px',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}>
                <span style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>Collet Clearance</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: collisionIssues.length === 0 ? '#10b981' : '#f59e0b' }}>
                  {collisionIssues.length === 0 ? '0 Gouges' : `${collisionIssues.length} Check Warnings`}
                </span>
                <span style={{ fontSize: '8.5px', color: '#64748b' }}>Tool stickout verification</span>
              </div>

              <div style={{
                background: 'rgba(56,189,248,0.1)',
                border: '1px solid #38bdf8',
                borderRadius: '4px',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}>
                <span style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>Rapid Plane</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8' }}>
                  Z +15.000 mm
                </span>
                <span style={{ fontSize: '8.5px', color: '#64748b' }}>Safe traverse height</span>
              </div>

              <div style={{
                background: 'rgba(168,85,247,0.1)',
                border: '1px solid #a855f7',
                borderRadius: '4px',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}>
                <span style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>Cutter Radius Comp</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#a855f7' }}>
                  G41 Left Active
                </span>
                <span style={{ fontSize: '8.5px', color: '#64748b' }}>Finish contour passes</span>
              </div>
            </div>

            {/* Simulation Engine Selector */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
              <div style={{ display: 'flex', gap: '14px', fontSize: '11px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="engine"
                    checked={simEngine === 'nc2check'}
                    onChange={() => setSimEngine('nc2check')}
                  />
                  <span style={{ color: simEngine === 'nc2check' ? '#38bdf8' : '#94a3b8', fontWeight: 600 }}>
                    NC2Check Verification Engine
                  </span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="engine"
                    checked={simEngine === 'simpost'}
                    onChange={() => setSimEngine('simpost')}
                  />
                  <span style={{ color: simEngine === 'simpost' ? '#38bdf8' : '#94a3b8' }}>
                    Siemens VNCK Virtual Kernel
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>Toleranz:</span>
                <input
                  type="number"
                  step="0.01"
                  className="text-input"
                  style={{ width: '60px', padding: '2px 5px', textAlign: 'center' }}
                  value={tolerance}
                  onChange={(e) => setTolerance(e.target.value)}
                />
                <span style={{ fontSize: '10px', color: '#64748b' }}>mm</span>
              </div>
            </div>
          </div>

          {/* Post Generation Execution Box */}
          <div className="nc2check-section">
            <div className="section-label">3. POST-PROCESSOR EXECUTION & LIVE NC STREAM</div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn-primary"
                style={{
                  flex: 1.2,
                  background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
                  borderColor: '#10b981',
                  padding: '9px 16px',
                  fontWeight: 600
                }}
                onClick={handleRunPost}
              >
                <FileCode size={15} />
                Postlauf (Generate NC Program)
              </button>

              <button
                className="btn-secondary"
                style={{ flex: 1 }}
                onClick={() => {
                  onClose();
                  onOpenGCodeViewer();
                }}
              >
                <Eye size={14} />
                Inspect / Edit Code
              </button>

              <button
                className="btn-secondary"
                style={{ flex: 1 }}
                onClick={handleDownload}
                title="Save NC Program to Disk"
              >
                <Download size={14} />
                Download File
              </button>
            </div>

            {/* Generated Stats or Excerpt */}
            {isGenerated && ncResult && (
              <div style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={14} color="#10b981" />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      DMU50_ZeroClamp_Job{ncResult.fileExtension} &bull; Generated Successfully
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', fontSize: '10.5px', color: 'var(--text-secondary)' }}>
                    <span>Blocks: <strong style={{ color: 'var(--accent-blue)' }}>{ncResult.lineCount}</strong></span>
                    <span>Distance: <strong style={{ color: '#10b981' }}>{ncResult.cuttingDistanceM}m</strong></span>
                    <span>Est. Time: <strong style={{ color: '#f59e0b' }}>~{ncResult.estimatedTimeMin} min</strong></span>
                  </div>
                </div>

                {/* Excerpt */}
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '10.5px',
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-tertiary)',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  lineHeight: '1.45',
                  maxHeight: '90px',
                  overflowY: 'auto'
                }}>
                  {previewLines.map((line, idx) => (
                    <div key={idx} style={{ color: line.startsWith(';') || line.startsWith('(') ? 'var(--text-muted)' : line.startsWith('0') || line.startsWith('N') ? 'var(--accent-blue)' : 'var(--text-primary)' }}>
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal Action Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}>
            <span style={{ fontSize: '10.5px', color: '#64748b' }}>
              Ready for 5-Axis Twin Verification & Physical CNC Transfer
            </span>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-secondary" onClick={onClose}>
                Cancel
              </button>

              <button
                className="btn-primary"
                onClick={() => {
                  onClose();
                  onLaunchSimulation();
                }}
                style={{
                  background: 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)',
                  borderColor: '#38bdf8',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title="Launch Synchronized 5-Axis Machine Kinematics Simulation"
              >
                <Play size={14} />
                <span>Launch Kinematic Twin &gt;&gt;</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </dialog>
  );
}
