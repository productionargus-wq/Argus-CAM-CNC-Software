import React, { useEffect, useRef, useState } from 'react';
import { X, Sliders, Check, RefreshCw, Scissors, Layers } from 'lucide-react';

export default function OperationModal({ isOpen, onClose, operation, tools, onSaveOperation }) {
  const dialogRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    toolId: 1,
    direction: 'climb',
    stepoverPct: 65,
    stepdown: 3.0,
    totalDepth: 15.0,
    stockToLeaveXY: 0.2,
    stockToLeaveZ: 0.0,
    rapidHeight: 15.0
  });

  useEffect(() => {
    if (operation) {
      setFormData({
        name: operation.name || '',
        toolId: operation.toolId || 1,
        direction: operation.direction || 'climb',
        stepoverPct: operation.stepoverPct ?? 65,
        stepdown: operation.stepdown ?? 3.0,
        totalDepth: operation.totalDepth ?? 15.0,
        stockToLeaveXY: operation.stockToLeaveXY ?? 0.2,
        stockToLeaveZ: operation.stockToLeaveZ ?? 0.0,
        rapidHeight: operation.rapidHeight ?? 15.0
      });
    }
  }, [operation]);

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

  const handleSave = () => {
    onSaveOperation({
      ...operation,
      ...formData,
      stepoverPct: Number(formData.stepoverPct),
      stepdown: Number(formData.stepdown),
      totalDepth: Number(formData.totalDepth),
      stockToLeaveXY: Number(formData.stockToLeaveXY),
      stockToLeaveZ: Number(formData.stockToLeaveZ),
      rapidHeight: Number(formData.rapidHeight)
    });
    onClose();
  };

  const selectedTool = tools.find((t) => t.id === Number(formData.toolId)) || tools[0];

  return (
    <dialog
      ref={dialogRef}
      id="operation-param-dialog"
      aria-labelledby="op-dialog-title"
      closedby="any"
      onClose={onClose}
    >
      <div className="modal-window" style={{ width: '600px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={16} color="#38bdf8" />
            <span id="op-dialog-title">Operation Parameters &bull; {operation?.name}</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close Dialog">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Operation & Tool Setup */}
          <div className="nc2check-section">
            <div className="section-label">OPERATION IDENTITY & TOOL SELECTION</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Operation Name:</label>
                <input
                  type="text"
                  className="text-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Assigned Tool:</label>
                <select
                  value={formData.toolId}
                  onChange={(e) => setFormData({ ...formData, toolId: Number(e.target.value) })}
                  className="text-input"
                >
                  {tools.map((t) => (
                    <option key={t.id} value={t.id}>
                      T{t.number} - {t.name} (&Oslash;{t.diameter}mm)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedTool && (
              <div style={{ fontSize: '10.5px', color: '#94a3b8', background: '#0a0d12', padding: '6px 8px', borderRadius: '4px', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Selected: <strong style={{ color: '#f1f5f9' }}>{selectedTool.name}</strong></span>
                <span style={{ color: '#10b981', fontFamily: 'monospace' }}>
                  S: {selectedTool.rpm} RPM &bull; F: {selectedTool.feedRate} mm/min
                </span>
              </div>
            )}
          </div>

          {/* Cutting Strategy */}
          <div className="nc2check-section">
            <div className="section-label">CUTTING STRATEGY & STEP PARAMETERS</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div className="form-group">
                <label>Milling Direction:</label>
                <select
                  value={formData.direction}
                  onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
                  className="text-input"
                >
                  <option value="climb">Climb Milling (Recommended)</option>
                  <option value="conventional">Conventional Milling</option>
                </select>
              </div>

              <div className="form-group">
                <label>Stepover (% of Tool &Oslash;):</label>
                <input
                  type="number"
                  step="5"
                  className="text-input"
                  value={formData.stepoverPct}
                  onChange={(e) => setFormData({ ...formData, stepoverPct: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Max Stepdown (mm):</label>
                <input
                  type="number"
                  step="0.5"
                  className="text-input"
                  value={formData.stepdown}
                  onChange={(e) => setFormData({ ...formData, stepdown: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Total Depth (mm):</label>
                <input
                  type="number"
                  step="1"
                  className="text-input"
                  value={formData.totalDepth}
                  onChange={(e) => setFormData({ ...formData, totalDepth: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Stock to Leave XY (mm):</label>
                <input
                  type="number"
                  step="0.05"
                  className="text-input"
                  value={formData.stockToLeaveXY}
                  onChange={(e) => setFormData({ ...formData, stockToLeaveXY: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Rapid Clearance Z (mm):</label>
                <input
                  type="number"
                  step="5"
                  className="text-input"
                  value={formData.rapidHeight}
                  onChange={(e) => setFormData({ ...formData, rapidHeight: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
            <button className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSave}>
              <RefreshCw size={14} />
              <span>Regenerate Toolpath</span>
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
