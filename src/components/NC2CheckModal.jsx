import React, { useEffect, useRef, useState } from 'react';
import { X, Cpu, Play, Settings, FolderOpen, FileCode, Sliders, Download, Eye } from 'lucide-react';

export default function NC2CheckModal({
  isOpen,
  onClose,
  onLaunchSimulation,
  onOpenGCodeViewer
}) {
  const dialogRef = useRef(null);

  const [simEngine, setSimEngine] = useState('nc2check');
  const [tolerance, setTolerance] = useState('0.05');
  const [targetOffset, setTargetOffset] = useState('0.00');
  const [postStatus, setPostStatus] = useState('Ready to Post');
  const [isGenerated, setIsGenerated] = useState(false);

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

  const handleRunPost = () => {
    setPostStatus('Generating 5-Axis NC Program...');
    setTimeout(() => {
      setPostStatus('NC Code Generated: DMU50_ZeroClamp_Job.h (Ready to simulate or download)');
      setIsGenerated(true);
    }, 400);
  };

  return (
    <dialog
      ref={dialogRef}
      id="nc2check-dialog"
      aria-labelledby="nc2check-title"
      closedby="any"
      onClose={onClose}
    >
      <div className="modal-window" style={{ width: '640px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={16} color="#38bdf8" />
            <span id="nc2check-title">NC2Check - G-Code & Kinematics Post-Processor</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close Dialog">
            <X size={15} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Post Group */}
          <div className="nc2check-section" style={{ marginBottom: '14px' }}>
            <div className="section-label">POST-PROCESSOR CONFIGURATION</div>

            <div className="form-group">
              <label>NC Output File:</label>
              <div className="form-input-row">
                <input
                  type="text"
                  readOnly
                  className="text-input"
                  value="C:\Users\Mastercam\Mill\NC\DMU50_ZeroClamp_Job.h"
                />
                <button className="btn-secondary" title="Browse NC Output Location">
                  <FolderOpen size={13} style={{ marginRight: '4px', verticalAlign: 'text-bottom' }} />
                  Browse
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>PST Post Processor:</label>
              <div className="form-input-row">
                <input
                  type="text"
                  readOnly
                  className="text-input"
                  value="C:\Shared Mastercam\Posts\DMU_50evo_turn.pst"
                />
                <button className="btn-secondary">Ersetzen</button>
              </div>
            </div>

            <div className="form-group">
              <label>PAR Parameter File:</label>
              <div className="form-input-row">
                <input
                  type="text"
                  readOnly
                  className="text-input"
                  value="C:\Shared Mastercam\Posts\DMU_50evo_turn.par"
                />
                <button className="btn-secondary">Ersetzen</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button
                className="btn-secondary"
                style={{ flex: 1 }}
                onClick={() => {
                  onClose();
                  onOpenGCodeViewer();
                }}
              >
                <Eye size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                Inspect / Download G-Code
              </button>

              <button
                className="btn-primary"
                style={{ flex: 1, background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)', borderColor: '#10b981' }}
                onClick={handleRunPost}
              >
                <FileCode size={14} />
                Postlauf (Generate NC)
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
              <span style={{ fontSize: '10px', color: '#38bdf8', fontFamily: 'monospace' }}>
                {postStatus}
              </span>
              {isGenerated && (
                <button
                  className="btn-secondary"
                  style={{ padding: '2px 8px', fontSize: '9.5px', color: '#10b981' }}
                  onClick={() => {
                    onClose();
                    onOpenGCodeViewer();
                  }}
                >
                  View Code &gt;
                </button>
              )}
            </div>
          </div>

          {/* Simulation Section */}
          <div className="nc2check-section">
            <div className="section-label">5-AXIS MACHINE SIMULATION (NC2CHECK)</div>

            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '14px', alignItems: 'center' }}>
              <div
                style={{
                  height: '110px',
                  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px',
                  textAlign: 'center'
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>
                  <Cpu size={22} color="white" />
                </div>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#f8fafc' }}>DMU 50 evo</span>
                <span style={{ fontSize: '8.5px', color: '#94a3b8' }}>5-Axis Mill-Turn</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '11px', color: '#94a3b8', width: '90px' }}>Maschine:</label>
                  <input
                    type="text"
                    readOnly
                    className="text-input"
                    value="DMU_50evo_turn"
                    style={{ flex: 1 }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8' }}>Toleranz (mm):</label>
                    <input
                      type="number"
                      step="0.01"
                      className="text-input"
                      value={tolerance}
                      onChange={(e) => setTolerance(e.target.value)}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8' }}>Zielversatz (mm):</label>
                    <input
                      type="number"
                      step="0.01"
                      className="text-input"
                      value={targetOffset}
                      onChange={(e) => setTargetOffset(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '14px', marginTop: '4px', fontSize: '11px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="engine"
                      checked={simEngine === 'nc2check'}
                      onChange={() => setSimEngine('nc2check')}
                    />
                    <span style={{ color: simEngine === 'nc2check' ? '#38bdf8' : '#94a3b8', fontWeight: 600 }}>
                      NC2Check
                    </span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="engine"
                      checked={simEngine === 'simpost'}
                      onChange={() => setSimEngine('simpost')}
                    />
                    <span>SimPost</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="engine"
                      checked={simEngine === 'vnck'}
                      onChange={() => setSimEngine('vnck')}
                    />
                    <span>VNCK</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Bottom Actions Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="btn-secondary">Nullpunkt Tabelle</button>
                <button className="btn-secondary">Werkstueck Versatz</button>
              </div>

              <button
                className="btn-primary"
                onClick={() => {
                  onClose();
                  onLaunchSimulation();
                }}
                title="Launch 5-Axis Machine Kinematics Simulation (Step 3)"
              >
                <Play size={15} />
                <span>Simulation &gt;&gt;</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}
