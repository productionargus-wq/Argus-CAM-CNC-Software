import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Download, FileText, Check } from 'lucide-react';

export default function SaveAsModal({
  isOpen,
  onClose,
  currentProjectName,
  onSaveAs
}) {
  const dialogRef = useRef(null);
  const [filename, setFilename] = useState(currentProjectName || 'Argus_Job.mcam');
  const [jobDescription, setJobDescription] = useState('5-Axis CNC Machining Job');
  const [programmerName, setProgrammerName] = useState('CAM Engineer');

  useEffect(() => {
    setFilename(currentProjectName || 'Argus_Job.mcam');
  }, [currentProjectName]);

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

  const handleSave = (e) => {
    e.preventDefault();
    const finalFilename = filename.endsWith('.mcam') ? filename : `${filename}.mcam`;
    onSaveAs(finalFilename, {
      jobDescription,
      programmerName
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      aria-label="Save Project As"
      closedby="any"
    >
      <div className="modal-window" style={{ width: '500px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Save size={16} color="#10b981" />
            <span>Mastercam &bull; Save Project Package As</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close (Esc)">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSave} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label>Package File Name (.mcam):</label>
            <input
              type="text"
              className="text-input"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Job Title / Part Description:</label>
            <input
              type="text"
              className="text-input"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Programmer / NC Specialist:</label>
            <input
              type="text"
              className="text-input"
              value={programmerName}
              onChange={(e) => setProgrammerName(e.target.value)}
            />
          </div>

          <div style={{ background: '#11151e', border: '1px solid #283344', borderRadius: '4px', padding: '10px', fontSize: '11px', color: '#94a3b8' }}>
            Package will contain: full 3D CAD workpiece geometry, all active CAM operations, cutting feeds/speeds, raw stock allowances, machine kinematics, and G54 origin datums.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px', borderTop: '1px solid #283344' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)', borderColor: '#10b981' }}>
              <Download size={14} />
              Save .mcam File
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
