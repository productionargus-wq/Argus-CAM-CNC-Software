import React, { useState, useEffect, useRef } from 'react';
import {
  X, Sparkles, CheckCircle2, Play, Sliders, FileText,
  Clock, ShieldAlert, Wrench, Layers, ChevronRight, Check
} from 'lucide-react';
import { ATPIcon, ATPCurrentFileIcon, ATPReportsIcon, ATPOptionsIcon } from './icons/MachineIcons';

export default function ATPModal({
  isOpen,
  onClose,
  initialTab = 'wizard',
  currentModel,
  partMetrics,
  onApplyToolpaths
}) {
  const dialogRef = useRef(null);
  const [activeTab, setActiveTab] = useState(initialTab);

  // ATP Strategies state
  const [roughStepdown, setRoughStepdown] = useState(3.0);
  const [roughStepover, setRoughStepover] = useState(65);
  const [finishPasses, setFinishPasses] = useState(true);
  const [chamferDeBurr, setChamferDeBurr] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState('alu6061');

  // ATP Detected Features state
  const [detectedFeatures, setDetectedFeatures] = useState([
    { id: 'feat_face', type: 'Top Face', dim: '100 x 80 mm', tool: 'Ø50mm Face Mill', op: 'Face Milling', timeSec: 42, color: '#38bdf8' },
    { id: 'feat_pocket', type: 'Central Pocket', dim: '55 x 38 x 18 mm', tool: 'Ø16mm Flat Endmill', op: 'Dynamic Roughing', timeSec: 185, color: '#10b981' },
    { id: 'feat_finish', type: 'Pocket Floor & Walls', dim: 'Ra 0.8 µm Finish', tool: 'Ø12mm Flat Endmill', op: 'Contour Finishing', timeSec: 94, color: '#f59e0b' },
    { id: 'feat_holes', type: '2x Bolt Bores', dim: 'Ø12.0 mm x 35 mm Thru', tool: 'Ø12mm Carbide Drill', op: 'Peck Drilling', timeSec: 36, color: '#ec4899' },
    { id: 'feat_chamfer', type: 'Top Edge Break', dim: '0.5 mm x 45°', tool: 'Ø10mm 90° Chamfer Mill', op: 'Edge De-Burr', timeSec: 28, color: '#a855f7' }
  ]);

  // Feedback message
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

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

  const totalTimeSec = detectedFeatures.reduce((acc, f) => acc + f.timeSec, 0);
  const totalMins = Math.floor(totalTimeSec / 60);
  const totalSecs = totalTimeSec % 60;

  const handleGenerateAutomatedToolpaths = () => {
    if (onApplyToolpaths) {
      onApplyToolpaths(detectedFeatures);
    }
    setFeedback(`Generated ${detectedFeatures.length} automated CNC operations (Est. Cycle Time: ${totalMins}m ${totalSecs}s)`);
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      aria-label="Automatic Toolpathing (ATP) Studio"
      closedby="any"
    >
      <div className="modal-window" style={{ width: '840px', height: '80vh', maxHeight: '680px', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ATPIcon size={20} />
            <span style={{ fontWeight: 600 }}>Mastercam Automatic Toolpathing (ATP) &bull; Intelligent CAM Automation</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close (Esc)">
            <X size={15} />
          </button>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div style={{
            background: 'rgba(56, 189, 248, 0.15)',
            borderBottom: '1px solid rgba(56, 189, 248, 0.3)',
            padding: '6px 14px',
            fontSize: '11px',
            color: '#38bdf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={12} />
              <span>{feedback}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
            >
              &times;
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          padding: '0 8px'
        }}>
          {[
            { id: 'wizard', label: 'ATP Wizard & Features', icon: <ATPCurrentFileIcon size={14} /> },
            { id: 'reports', label: 'Cycle Time & Reports', icon: <ATPReportsIcon size={14} /> },
            { id: 'options', label: 'Tool Assignment Rules', icon: <ATPOptionsIcon size={14} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #0284c7' : '2px solid transparent',
                color: activeTab === tab.id ? '#0284c7' : '#64748b',
                fontWeight: activeTab === tab.id ? 600 : 400,
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px', background: '#f8fafc' }}>
          
          {/* ================= 1. ATP WIZARD ================= */}
          {activeTab === 'wizard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>Automatic Feature-Based Toolpath Generator</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>
                  ATP scans the 3D solid geometry, identifies analytical CAD features, selects optimal tools from the tooling library, and generates standard Mastercam 2.5D &amp; 3D toolpath operations automatically.
                </div>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
                  Detected CNC Machining Features &amp; Auto-Assigned Tools:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {detectedFeatures.map((feat) => (
                    <div
                      key={feat.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: feat.color }} />
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a' }}>{feat.op} &bull; {feat.type}</div>
                          <div style={{ fontSize: '9.5px', color: '#64748b' }}>{feat.dim} &bull; Tool: <strong style={{ color: '#0284c7' }}>{feat.tool}</strong></div>
                        </div>
                      </div>
                      <div style={{ fontSize: '10px', fontWeight: 600, color: '#10b981' }}>
                        ~{feat.timeSec}s
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerateAutomatedToolpaths}
                className="btn-primary"
                style={{ padding: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}
              >
                <Sparkles size={16} />
                <span>Execute ATP &bull; Create All Automated Toolpath Groups</span>
              </button>
            </div>
          )}

          {/* ================= 2. REPORTS ================= */}
          {activeTab === 'reports' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>ESTIMATED TOTAL CYCLE TIME</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#0284c7', marginTop: '4px' }}>
                    {totalMins}m {totalSecs}s
                  </div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>TOTAL OPERATIONS</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>
                    {detectedFeatures.length} Ops
                  </div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>REQUIRED TOOLS</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#f59e0b', marginTop: '4px' }}>
                    5 Cutters
                  </div>
                </div>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>Operation Sequence Summary:</div>
                <div style={{ fontSize: '10px', color: '#64748b', lineHeight: 1.8 }}>
                  1. Face Milling (Level 1) &bull; Ø50mm Face Mill &bull; Feed: 2200 mm/min &bull; RPM: 4500<br />
                  2. Central Pocket Dynamic Rough (Level 2) &bull; Ø16mm Flat Endmill &bull; Stepdown: 3.0mm &bull; Feed: 3800 mm/min<br />
                  3. Pocket Wall &amp; Floor Finishing &bull; Ø12mm Flat Endmill &bull; Ra 0.8 µm &bull; Feed: 1400 mm/min<br />
                  4. Peck Drilling 2x M12 Bores &bull; Ø12mm Carbide Drill &bull; Depth: 35mm &bull; Feed: 420 mm/min<br />
                  5. Corner Chamfer De-Burring &bull; Ø10mm 90° Chamfer Mill &bull; Feed: 1800 mm/min
                </div>
              </div>
            </div>
          )}

          {/* ================= 3. OPTIONS ================= */}
          {activeTab === 'options' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>ATP Machining Rules &amp; Allowances:</div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>Roughing Max Stepdown (mm):</label>
                    <input
                      type="number"
                      step="0.5"
                      value={roughStepdown}
                      onChange={(e) => setRoughStepdown(e.target.value)}
                      style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11px', marginTop: '4px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>Dynamic Radial Stepover (%):</label>
                    <input
                      type="number"
                      step="5"
                      value={roughStepover}
                      onChange={(e) => setRoughStepover(e.target.value)}
                      style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11px', marginTop: '4px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' }}>
                  <label style={{ fontSize: '11px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" checked={finishPasses} onChange={(e) => setFinishPasses(e.target.checked)} />
                    Auto-generate finish contour passes on floor and vertical walls
                  </label>
                  <label style={{ fontSize: '11px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" checked={chamferDeBurr} onChange={(e) => setChamferDeBurr(e.target.checked)} />
                    Auto-generate 0.5mm edge de-burring chamfers
                  </label>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff' }}>
          <div style={{ fontSize: '10px', color: '#64748b' }}>
            Automatic Toolpathing creates operations directly inside Toolpath Manager Group 1.
          </div>
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '6px 16px', fontSize: '11px' }}
          >
            Done
          </button>
        </div>
      </div>
    </dialog>
  );
}
