import React, { useEffect, useRef, useState } from 'react';
import { X, Box, Layers, Check, Calculator, RefreshCw } from 'lucide-react';

export default function StockSetupModal({ isOpen, onClose, partMetrics, stockConfig, onUpdateStock }) {
  const dialogRef = useRef(null);

  const [shape, setShape] = useState(stockConfig.shape || 'box');
  const [allowanceTop, setAllowanceTop] = useState(stockConfig.allowanceTop ?? 2.0);
  const [allowanceSides, setAllowanceSides] = useState(stockConfig.allowanceSides ?? 4.0);
  const [material, setMaterial] = useState(stockConfig.material || 'Alu 6061-T6');
  const [originPoint, setOriginPoint] = useState(stockConfig.originPoint || 'top-center');

  // Materials and densities (g/cm3)
  const materials = [
    { name: 'Alu 6061-T6', density: 2.7 },
    { name: 'Steel 4140', density: 7.85 },
    { name: 'Stainless 304', density: 8.0 },
    { name: 'Brass C360', density: 8.5 },
    { name: 'Delrin / POM', density: 1.41 }
  ];

  const partDim = partMetrics?.dimensions || { x: 80, y: 35, z: 70 };
  const rawX = (partDim.x + allowanceSides * 2).toFixed(1);
  const rawY = (partDim.y + allowanceTop).toFixed(1);
  const rawZ = (partDim.z + allowanceSides * 2).toFixed(1);

  const selectedDensity = materials.find((m) => m.name === material)?.density || 2.7;
  const stockVolumeCm3 = (Number(rawX) * Number(rawY) * Number(rawZ)) / 1000;
  const stockMassKg = ((stockVolumeCm3 * selectedDensity) / 1000).toFixed(2);

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

  const handleApply = () => {
    onUpdateStock({
      shape,
      allowanceTop: Number(allowanceTop),
      allowanceSides: Number(allowanceSides),
      material,
      originPoint,
      rawDimensions: { x: Number(rawX), y: Number(rawY), z: Number(rawZ) },
      massKg: stockMassKg
    });
    onClose();
  };

  const originPositions = [
    { id: 'top-left', label: 'TL' },
    { id: 'top-center', label: 'TC (G54)' },
    { id: 'top-right', label: 'TR' },
    { id: 'mid-left', label: 'ML' },
    { id: 'mid-center', label: 'MC' },
    { id: 'mid-right', label: 'MR' },
    { id: 'bot-left', label: 'BL' },
    { id: 'bot-center', label: 'BC' },
    { id: 'bot-right', label: 'BR' }
  ];

  return (
    <dialog
      ref={dialogRef}
      id="stock-setup-dialog"
      aria-labelledby="stock-setup-title"
      closedby="any"
      onClose={onClose}
    >
      <div className="modal-window" style={{ width: '560px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Box size={16} color="#f59e0b" />
            <span id="stock-setup-title">Stock Setup & Raw Material Definition</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close Dialog">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Shape & Automatic Part Dimensions */}
          <div className="nc2check-section">
            <div className="section-label">PART GEOMETRY & BOUNDING BOX</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div className="form-group">
                <label>Part Length (X):</label>
                <input type="text" readOnly className="text-input" value={`${partDim.x} mm`} />
              </div>
              <div className="form-group">
                <label>Part Height (Y):</label>
                <input type="text" readOnly className="text-input" value={`${partDim.y} mm`} />
              </div>
              <div className="form-group">
                <label>Part Width (Z):</label>
                <input type="text" readOnly className="text-input" value={`${partDim.z} mm`} />
              </div>
            </div>
          </div>

          {/* Stock Allowances */}
          <div className="nc2check-section">
            <div className="section-label">STOCK ALLOWANCES & RAW DIMENSIONS</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <div className="form-group">
                <label>Top Face Allowance (+Y mm):</label>
                <input
                  type="number"
                  step="0.5"
                  className="text-input"
                  value={allowanceTop}
                  onChange={(e) => setAllowanceTop(Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label>Sides Allowance (+/- X, Z mm):</label>
                <input
                  type="number"
                  step="0.5"
                  className="text-input"
                  value={allowanceSides}
                  onChange={(e) => setAllowanceSides(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Calculated Raw Stock Block Result */}
            <div style={{ background: '#0a0d12', padding: '8px 12px', borderRadius: '4px', border: '1px solid #1e293b', marginTop: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: '11px', color: '#38bdf8' }}>
                <span>RAW STOCK BLOCK:</span>
                <span style={{ fontWeight: 700 }}>{rawX} &times; {rawY} &times; {rawZ} mm</span>
              </div>
            </div>
          </div>

          {/* Material & WCS Origin Picker */}
          <div className="nc2check-section">
            <div className="section-label">MATERIAL & WCS ORIGIN SELECTION</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '16px', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="form-group">
                  <label>Material Grade:</label>
                  <select
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="text-input"
                  >
                    {materials.map((m) => (
                      <option key={m.name} value={m.name}>
                        {m.name} ({m.density} g/cm&sup3;)
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
                  <span>Est. Weight: </span>
                  <span style={{ color: '#f59e0b', fontWeight: 700 }}>{stockMassKg} kg</span>
                  <span> &bull; Vol: {stockVolumeCm3.toFixed(1)} cm&sup3;</span>
                </div>
              </div>

              {/* 9-Point Origin Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <label style={{ fontSize: '10px', color: '#94a3b8' }}>WCS (G54) Anchor:</label>
                <div className="origin-selector-grid">
                  {originPositions.map((pos) => (
                    <button
                      key={pos.id}
                      onClick={() => setOriginPoint(pos.id)}
                      className={`origin-point-btn ${originPoint === pos.id ? 'active' : ''}`}
                      title={`Set origin to ${pos.label}`}
                    >
                      <div
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: originPoint === pos.id ? '#ffffff' : '#94a3b8'
                        }}
                      />
                    </button>
                  ))}
                </div>
                <span style={{ fontSize: '9px', color: '#38bdf8', fontFamily: 'monospace' }}>
                  {originPoint.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
            <button className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleApply}>
              <Check size={14} />
              <span>Apply Stock Setup</span>
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
