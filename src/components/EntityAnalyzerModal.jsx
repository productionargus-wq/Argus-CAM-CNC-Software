import React, { useEffect, useRef } from 'react';
import { X, Ruler, Box, Scale, Compass, CheckCircle2 } from 'lucide-react';

export default function EntityAnalyzerModal({
  isOpen,
  onClose,
  partMetrics,
  stockConfig,
  currentProjectName
}) {
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

  const dim = partMetrics?.dimensions || { x: 0, y: 0, z: 0 };
  const center = partMetrics?.center || { x: 0, y: 0, z: 0 };
  const volume = partMetrics?.volumeCm3 || 0;
  const area = partMetrics?.surfaceAreaMm2 || 0;
  const triangles = partMetrics?.triangles || 0;
  const massAlu = partMetrics?.massAluKg || '0.95';
  const massSteel = partMetrics?.massSteelKg || '2.76';

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      aria-label="CAD Entity Analyzer"
      closedby="any"
    >
      <div className="modal-window" style={{ width: '640px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Ruler size={16} color="#38bdf8" />
            <span>Mastercam CAD Inspector &bull; Analyze Entity</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close (Esc)">
            <X size={15} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Active File Banner */}
          <div style={{
            background: '#141822',
            border: '1px solid #2d3545',
            borderRadius: '6px',
            padding: '10px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Target CAD Entity:</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8' }}>{currentProjectName}</div>
            </div>
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              padding: '3px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <CheckCircle2 size={12} />
              Manifold Solid Mesh
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            <div style={{ background: '#0e1218', border: '1px solid #242c3d', borderRadius: '6px', padding: '10px' }}>
              <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Dimensions (X x Y x Z)</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                {dim.x} &times; {dim.y} &times; {dim.z}
              </div>
              <div style={{ fontSize: '10px', color: '#38bdf8', marginTop: '2px' }}>Millimeters (G21)</div>
            </div>

            <div style={{ background: '#0e1218', border: '1px solid #242c3d', borderRadius: '6px', padding: '10px' }}>
              <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Displacement Volume</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#10b981', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                {volume.toLocaleString()} cm³
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>Area: {area.toLocaleString()} mm²</div>
            </div>

            <div style={{ background: '#0e1218', border: '1px solid #242c3d', borderRadius: '6px', padding: '10px' }}>
              <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Surface Tessellation</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#a855f7', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                {triangles.toLocaleString()}
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>Triangles / Facets</div>
            </div>
          </div>

          {/* Center of Gravity & Mass Table */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: '#11151e', border: '1px solid #242c3d', borderRadius: '6px', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid #242c3d', paddingBottom: '6px', marginBottom: '8px' }}>
                <Compass size={14} color="#38bdf8" />
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8' }}>CENTER OF MASS (G54 DATUM)</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>X Centroid:</span>
                  <span style={{ color: '#f8fafc', fontWeight: 600 }}>{center.x} mm</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Y Centroid:</span>
                  <span style={{ color: '#f8fafc', fontWeight: 600 }}>{center.y} mm</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Z Centroid:</span>
                  <span style={{ color: '#f8fafc', fontWeight: 600 }}>{center.z} mm</span>
                </div>
              </div>
            </div>

            <div style={{ background: '#11151e', border: '1px solid #242c3d', borderRadius: '6px', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid #242c3d', paddingBottom: '6px', marginBottom: '8px' }}>
                <Scale size={14} color="#f59e0b" />
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b' }}>ESTIMATED MASS BY ALLOY</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Alu 6061-T6 (2.70 g/cm³):</span>
                  <span style={{ color: '#38bdf8', fontWeight: 600 }}>{massAlu} kg</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Steel 4140 (7.85 g/cm³):</span>
                  <span style={{ color: '#f59e0b', fontWeight: 600 }}>{massSteel} kg</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Configured Stock:</span>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>{stockConfig.material} ({stockConfig.massKg} kg)</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px', borderTop: '1px solid #242c3d' }}>
            <button className="btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
