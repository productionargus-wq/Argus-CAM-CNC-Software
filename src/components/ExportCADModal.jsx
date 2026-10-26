import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Box, Layers, Check } from 'lucide-react';
import { exportSceneToSTL, exportSceneToOBJ } from '../utils/cadGeometry';

export default function ExportCADModal({
  isOpen,
  onClose,
  currentModel,
  currentProjectName
}) {
  const dialogRef = useRef(null);
  const [format, setFormat] = useState('stl_binary');
  const [filename, setFilename] = useState('');

  useEffect(() => {
    if (currentProjectName) {
      setFilename(currentProjectName.replace(/\.[^/.]+$/, ""));
    }
  }, [currentProjectName, isOpen]);

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

  const handleExport = async (e) => {
    e.preventDefault();
    if (!currentModel) return;

    const baseName = filename.trim() || 'Workpiece';

    if (format === 'stl_binary') {
      await exportSceneToSTL(currentModel, `${baseName}.stl`, true);
    } else if (format === 'stl_ascii') {
      await exportSceneToSTL(currentModel, `${baseName}_ascii.stl`, false);
    } else if (format === 'obj') {
      await exportSceneToOBJ(currentModel, `${baseName}.obj`);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      aria-label="Export 3D CAD Workpiece"
      closedby="any"
    >
      <div className="modal-window" style={{ width: '480px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={16} color="#a855f7" />
            <span>Mastercam &bull; Export 3D CAD Geometry</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close (Esc)">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleExport} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label>Output File Name:</label>
            <input
              type="text"
              className="text-input"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Export Format:</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
              <label
                style={{
                  background: format === 'stl_binary' ? '#1e293b' : '#11151e',
                  border: `1px solid ${format === 'stl_binary' ? '#38bdf8' : '#283344'}`,
                  borderRadius: '4px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <input
                  type="radio"
                  name="cad_format"
                  checked={format === 'stl_binary'}
                  onChange={() => setFormat('stl_binary')}
                />
                <div>
                  <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '12px' }}>Binary STL (.stl)</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>Compact binary format for 3D printing, CAM slicing, and CMM inspection.</div>
                </div>
              </label>

              <label
                style={{
                  background: format === 'stl_ascii' ? '#1e293b' : '#11151e',
                  border: `1px solid ${format === 'stl_ascii' ? '#38bdf8' : '#283344'}`,
                  borderRadius: '4px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <input
                  type="radio"
                  name="cad_format"
                  checked={format === 'stl_ascii'}
                  onChange={() => setFormat('stl_ascii')}
                />
                <div>
                  <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '12px' }}>ASCII Text STL (.stl)</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>Human-readable text file with triangular facet normals.</div>
                </div>
              </label>

              <label
                style={{
                  background: format === 'obj' ? '#1e293b' : '#11151e',
                  border: `1px solid ${format === 'obj' ? '#38bdf8' : '#283344'}`,
                  borderRadius: '4px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <input
                  type="radio"
                  name="cad_format"
                  checked={format === 'obj'}
                  onChange={() => setFormat('obj')}
                />
                <div>
                  <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '12px' }}>Wavefront OBJ (.obj)</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>Universal 3D geometry format with vertex normals and UV mappings.</div>
                </div>
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px', borderTop: '1px solid #283344' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ background: '#7c3aed', borderColor: '#8b5cf6' }}>
              <Download size={14} />
              Export 3D CAD
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
