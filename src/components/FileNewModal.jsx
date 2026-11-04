import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Cpu, Box, Compass, Layers, Check } from 'lucide-react';

export default function FileNewModal({
  isOpen,
  onClose,
  onCreateNewProject
}) {
  const dialogRef = useRef(null);

  const [selectedTemplate, setSelectedTemplate] = useState('blank_wireframe');
  const [projectName, setProjectName] = useState('Mastercam_Part1.mcam');
  const [unitSystem, setUnitSystem] = useState('metric');
  const [customDimensions, setCustomDimensions] = useState({ x: 80, y: 35, z: 60 });

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

  const handleCreate = (e) => {
    e.preventDefault();
    onCreateNewProject({
      template: selectedTemplate,
      projectName: projectName.endsWith('.mcam') ? projectName : `${projectName}.mcam`,
      unitSystem,
      customDimensions
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      aria-label="Create New Mastercam Project"
      closedby="any"
    >
      <div className="modal-window" style={{ width: '680px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} color="#38bdf8" />
            <span>Mastercam 2026 &bull; New Project Setup Wizard</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close (Esc)">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleCreate} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Project Name & Units */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: '12px' }}>
            <div className="form-group">
              <label>Project File Name (.mcam):</label>
              <input
                type="text"
                className="text-input"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Measurement Units:</label>
              <select
                className="text-input"
                value={unitSystem}
                onChange={(e) => setUnitSystem(e.target.value)}
              >
                <option value="metric">Metric (G21 - mm)</option>
                <option value="imperial">Imperial (G20 - Inch)</option>
              </select>
            </div>
          </div>

          {/* Template Selection Cards */}
          <div className="form-group">
            <label style={{ color: '#38bdf8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>
              Select Machine &amp; Part Template:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '4px' }}>
              {/* Template 0: Blank Mastercam 2D CAD Part */}
              <div
                onClick={() => setSelectedTemplate('blank_wireframe')}
                style={{
                  gridColumn: 'span 2',
                  background: selectedTemplate === 'blank_wireframe' ? '#1e2d4a' : '#11151e',
                  border: `2px solid ${selectedTemplate === 'blank_wireframe' ? '#38bdf8' : '#334155'}`,
                  borderRadius: '6px',
                  padding: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                  boxShadow: selectedTemplate === 'blank_wireframe' ? '0 0 16px rgba(56, 189, 248, 0.25)' : 'none'
                }}
              >
                <div style={{ background: '#0284c7', padding: '8px', borderRadius: '6px', fontSize: '20px' }}>
                  ✏️
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontWeight: 800, color: '#38bdf8', fontSize: '13px' }}>
                      Blank CAD Drawing Canvas (Mastercam 2D Workflow)
                    </div>
                    <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', fontSize: '9.5px', fontWeight: 700, padding: '1px 6px', borderRadius: '3px' }}>
                      RECOMMENDED
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px', lineHeight: 1.35 }}>
                    Clean graphics viewport with WCS (X0, Y0, Z0) datum origin. Draw Rectangles, Circles, Corner Fillets & Drill Points from scratch, then create CNC Toolpaths & Verify (just like Mastercam 2019 tutorial video)!
                  </div>
                </div>
              </div>

              {/* Template Mastercam 2019 Tutorial */}
              <div
                onClick={() => setSelectedTemplate('mastercam2019_tutorial')}
                style={{
                  background: selectedTemplate === 'mastercam2019_tutorial' ? '#1e2d4a' : '#11151e',
                  border: `1px solid ${selectedTemplate === 'mastercam2019_tutorial' ? '#38bdf8' : '#283344'}`,
                  borderRadius: '6px',
                  padding: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start'
                }}
              >
                <div style={{ background: '#0284c7', padding: '6px', borderRadius: '4px' }}>
                  <Box size={20} color="white" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '12px' }}>Mastercam 2019 Milling Tutorial (CAD CAM PDF)</span>
                    <span style={{ background: 'rgba(234, 179, 8, 0.2)', color: '#eab308', fontSize: '9.5px', fontWeight: 700, padding: '1px 6px', borderRadius: '3px' }}>
                      YOUTUBE
                    </span>
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>
                    5.0"x5.0" Plate with Corner Fillets &bull; Facing, 2D Contour, Circle Mill, Spot Drill, Peck Drill (G83)
                  </div>
                </div>
              </div>

              {/* Template 1 */}
              <div
                onClick={() => setSelectedTemplate('dmu50_impeller')}
                style={{
                  background: selectedTemplate === 'dmu50_impeller' ? '#1e2d4a' : '#11151e',
                  border: `1px solid ${selectedTemplate === 'dmu50_impeller' ? '#3b82f6' : '#283344'}`,
                  borderRadius: '6px',
                  padding: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start'
                }}
              >
                <div style={{ background: '#2563eb', padding: '6px', borderRadius: '4px' }}>
                  <Compass size={20} color="white" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '12px' }}>5-Axis Turbine Impeller</div>
                  <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>
                    DMG MORI DMU 50 (B/C Trunnion) &bull; Swarf &amp; 5X simultaneous contours
                  </div>
                </div>
              </div>

              {/* Template 2 */}
              <div
                onClick={() => setSelectedTemplate('haas_bracket')}
                style={{
                  background: selectedTemplate === 'haas_bracket' ? '#1e2d4a' : '#11151e',
                  border: `1px solid ${selectedTemplate === 'haas_bracket' ? '#3b82f6' : '#283344'}`,
                  borderRadius: '6px',
                  padding: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start'
                }}
              >
                <div style={{ background: '#06b6d4', padding: '6px', borderRadius: '4px' }}>
                  <Layers size={20} color="white" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '12px' }}>Aero Pocketing Bracket</div>
                  <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>
                    Haas VF-2 (3-Axis VMC) &bull; Dynamic adaptive high-speed pocketing
                  </div>
                </div>
              </div>

              {/* Template 3 */}
              <div
                onClick={() => setSelectedTemplate('mold_core')}
                style={{
                  background: selectedTemplate === 'mold_core' ? '#1e2d4a' : '#11151e',
                  border: `1px solid ${selectedTemplate === 'mold_core' ? '#3b82f6' : '#283344'}`,
                  borderRadius: '6px',
                  padding: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start'
                }}
              >
                <div style={{ background: '#f59e0b', padding: '6px', borderRadius: '4px' }}>
                  <Box size={20} color="white" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '12px' }}>Precision Mold Core</div>
                  <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>
                    High-precision 3D waterline cavity finishing &amp; spherical surfaces
                  </div>
                </div>
              </div>

              {/* Template 4 */}
              <div
                onClick={() => setSelectedTemplate('blank_billet')}
                style={{
                  background: selectedTemplate === 'blank_billet' ? '#1e2d4a' : '#11151e',
                  border: `1px solid ${selectedTemplate === 'blank_billet' ? '#3b82f6' : '#283344'}`,
                  borderRadius: '6px',
                  padding: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start'
                }}
              >
                <div style={{ background: '#10b981', padding: '6px', borderRadius: '4px' }}>
                  <Plus size={20} color="white" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '12px' }}>Custom Blank Billet</div>
                  <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>
                    Clean rectangular stock workpiece with user-defined X, Y, Z bounds
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Billet Dimensions (Only active if blank_billet selected) */}
          {selectedTemplate === 'blank_billet' && (
            <div style={{ background: '#f8fafc', border: '1px solid #283344', borderRadius: '6px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, marginBottom: '6px' }}>
                CUSTOM BILLET DIMENSIONS (mm):
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div className="form-group">
                  <label>Width X (mm):</label>
                  <input
                    type="number"
                    className="text-input"
                    value={customDimensions.x}
                    onChange={(e) => setCustomDimensions({ ...customDimensions, x: Number(e.target.value) })}
                    min="10"
                    max="500"
                  />
                </div>
                <div className="form-group">
                  <label>Height Y (mm):</label>
                  <input
                    type="number"
                    className="text-input"
                    value={customDimensions.y}
                    onChange={(e) => setCustomDimensions({ ...customDimensions, y: Number(e.target.value) })}
                    min="5"
                    max="300"
                  />
                </div>
                <div className="form-group">
                  <label>Depth Z (mm):</label>
                  <input
                    type="number"
                    className="text-input"
                    value={customDimensions.z}
                    onChange={(e) => setCustomDimensions({ ...customDimensions, z: Number(e.target.value) })}
                    min="10"
                    max="500"
                  />
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px', borderTop: '1px solid #283344' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">
              <Check size={14} />
              Create Project
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
