import React, { useEffect, useRef } from 'react';
import { X, HelpCircle, MousePointer, Layers, Cpu, Compass, BookOpen } from 'lucide-react';

export default function HelpGuideModal({ isOpen, onClose }) {
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

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      aria-label="Mastercam User Guide and Shortcuts"
      closedby="any"
    >
      <div className="modal-window" style={{ width: '740px', maxHeight: '88vh' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HelpCircle size={16} color="#38bdf8" />
            <span>Mastercam CAM User Guide &amp; Keyboard Shortcuts</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close (Esc)">
            <X size={15} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Quick Intro */}
          <div style={{ background: '#141822', border: '1px solid #2d3545', borderRadius: '6px', padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <BookOpen size={15} color="#38bdf8" />
              <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '13px' }}>Welcome to Argus Mastercam CAD/CAM</span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '11.5px', lineHeight: 1.5 }}>
              This desktop software brings the full power of Mastercam 5-Axis CNC programming, toolpath slicing, and NC2Check machine simulation to your workspace. Every ribbon button connects directly to the underlying CAD and CAM calculation engines.
            </p>
          </div>

          {/* Mouse & Navigation Controls */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MousePointer size={14} />
              <span>3D VIEWPORT NAVIGATION CONTROLS</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div style={{ background: '#0e1218', border: '1px solid #242c3d', borderRadius: '6px', padding: '10px' }}>
                <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '12px' }}>Left Click + Drag</span>
                <p style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px' }}>
                  Orbit and rotate the 3D camera around the workpiece WCS origin.
                </p>
              </div>

              <div style={{ background: '#0e1218', border: '1px solid #242c3d', borderRadius: '6px', padding: '10px' }}>
                <span style={{ color: '#10b981', fontWeight: 700, fontSize: '12px' }}>Right Click + Drag</span>
                <p style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px' }}>
                  Pan the 3D viewport horizontally and vertically across the machine bed.
                </p>
              </div>

              <div style={{ background: '#0e1218', border: '1px solid #242c3d', borderRadius: '6px', padding: '10px' }}>
                <span style={{ color: '#38bdf8', fontWeight: 700, fontSize: '12px' }}>Mouse Wheel Scroll</span>
                <p style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px' }}>
                  Smoothly zoom in to inspect cutter passes or zoom out to see table envelope.
                </p>
              </div>
            </div>
          </div>

          {/* Ribbon Workflow Guide */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={14} />
              <span>CAM PROGRAMMING WORKFLOW</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
              <div style={{ background: '#0e1218', padding: '8px 12px', borderRadius: '4px', border: '1px solid #1f2737' }}>
                <strong style={{ color: '#38bdf8' }}>1. Load or Create CAD Model:</strong> Use <em>File &gt; Import STL/OBJ</em> or select <em>Solids &gt; Block / Cylinder</em> to generate your workpiece.
              </div>
              <div style={{ background: '#0e1218', padding: '8px 12px', borderRadius: '4px', border: '1px solid #1f2737' }}>
                <strong style={{ color: '#f59e0b' }}>2. Setup Raw Stock &amp; Tools:</strong> Click <em>Stock Setup</em> to define raw stock allowances, material alloy, and G54 origin. Configure cutting speeds in <em>Tool Manager</em>.
              </div>
              <div style={{ background: '#0e1218', padding: '8px 12px', borderRadius: '4px', border: '1px solid #1f2737' }}>
                <strong style={{ color: '#10b981' }}>3. Apply Toolpaths:</strong> Select strategies from the <em>Toolpaths</em> ribbon (Face Milling, Dynamic Pocket, Waterline 3D, 5-Axis Swarf, Peck Drill).
              </div>
              <div style={{ background: '#0e1218', padding: '8px 12px', borderRadius: '4px', border: '1px solid #1f2737' }}>
                <strong style={{ color: '#a855f7' }}>4. Post &amp; Simulate:</strong> Click the highlighted <em>G1 Generate (Post)</em> button to configure NC2Check, verify collisions, and export multi-controller G-code (Heidenhain, Fanuc, Haas, Siemens, GRBL).
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid #242c3d' }}>
            <button className="btn-secondary" onClick={onClose}>Close Guide</button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
