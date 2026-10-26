import React, { useState, useEffect, useRef } from 'react';
import { X, Clock, FolderOpen, RotateCcw, Box, Check, Trash2 } from 'lucide-react';
import { getRecentProjects, getAutoSaveSnapshot, clearAutoSaveSnapshot } from '../utils/projectStorage';

export default function RecentProjectsModal({
  isOpen,
  onClose,
  onLoadProject,
  onRestoreAutoSave,
  onSelectSampleModel
}) {
  const dialogRef = useRef(null);
  const [recentList, setRecentList] = useState([]);
  const [autoSaveData, setAutoSaveData] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setRecentList(getRecentProjects());
      setAutoSaveData(getAutoSaveSnapshot());
    }
  }, [isOpen]);

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

  const handleSelectRecent = (item) => {
    if (item.sampleType) {
      onSelectSampleModel(item.sampleType);
    } else {
      onLoadProject(item);
    }
    onClose();
  };

  const handleRestore = () => {
    if (autoSaveData) {
      onRestoreAutoSave(autoSaveData);
      onClose();
    }
  };

  const handleClearBackup = () => {
    clearAutoSaveSnapshot();
    setAutoSaveData(null);
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      aria-label="Recent Projects and Auto-Save Backups"
      closedby="any"
    >
      <div className="modal-window" style={{ width: '640px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} color="#38bdf8" />
            <span>Mastercam &bull; Recent Projects &amp; Auto-Save Recovery</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close (Esc)">
            <X size={15} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Auto-Save Alert Banner if available */}
          {autoSaveData && (
            <div style={{
              background: '#1c2214',
              border: '1px solid #4d7c0f',
              borderRadius: '6px',
              padding: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#a3e635', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RotateCcw size={14} />
                  Auto-Save Snapshot Available
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                  Project: <strong style={{ color: '#f1f5f9' }}>{autoSaveData.projectName}</strong> &bull; {new Date(autoSaveData.timestamp).toLocaleTimeString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleClearBackup}
                  className="btn-secondary"
                  style={{ fontSize: '10.5px' }}
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleRestore}
                  className="btn-primary"
                  style={{ background: '#65a30d', borderColor: '#84cc16', fontSize: '11px', padding: '5px 12px' }}
                >
                  Restore Backup
                </button>
              </div>
            </div>
          )}

          {/* Recent Files List */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
              RECENT PROJECTS &amp; SAMPLE JOBS:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '340px', overflowY: 'auto' }}>
              {recentList.map((item, index) => (
                <div
                  key={index}
                  onClick={() => handleSelectRecent(item)}
                  style={{
                    background: '#11151e',
                    border: '1px solid #283344',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#38bdf8')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#283344')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: '#1e293b', padding: '8px', borderRadius: '4px' }}>
                      <Box size={18} color="#38bdf8" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '12px' }}>{item.projectName}</div>
                      <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                        {item.filename} &bull; {item.machine}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10.5px', color: '#10b981', fontWeight: 600 }}>
                      {item.opsCount} Ops &bull; {item.toolsCount} Tools
                    </div>
                    <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '2px' }}>
                      {new Date(item.savedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid #283344' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
