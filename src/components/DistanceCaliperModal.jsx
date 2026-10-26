import React, { useState, useEffect, useRef } from 'react';
import { X, Scissors, Compass, Check, ArrowRight, RotateCw, RefreshCw } from 'lucide-react';

export default function DistanceCaliperModal({
  isOpen,
  onClose,
  partMetrics
}) {
  const dialogRef = useRef(null);

  const dim = partMetrics?.dimensions || { x: 80, y: 35, z: 60 };
  const bounds = partMetrics?.box || {
    min: { x: -40, y: 0, z: -30 },
    max: { x: 40, y: 35, z: 30 }
  };

  const [p1, setP1] = useState({ x: (-dim.x / 2).toFixed(2), y: '0.00', z: (-dim.z / 2).toFixed(2) });
  const [p2, setP2] = useState({ x: (dim.x / 2).toFixed(2), y: dim.y.toFixed(2), z: (dim.z / 2).toFixed(2) });

  useEffect(() => {
    if (partMetrics) {
      setP1({ x: (-dim.x / 2).toFixed(2), y: '0.00', z: (-dim.z / 2).toFixed(2) });
      setP2({ x: (dim.x / 2).toFixed(2), y: dim.y.toFixed(2), z: (dim.z / 2).toFixed(2) });
    }
  }, [partMetrics, isOpen]);

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

  const dx = Math.abs(parseFloat(p2.x || 0) - parseFloat(p1.x || 0));
  const dy = Math.abs(parseFloat(p2.y || 0) - parseFloat(p1.y || 0));
  const dz = Math.abs(parseFloat(p2.z || 0) - parseFloat(p1.z || 0));
  const d2D = Math.sqrt(dx * dx + dz * dz);
  const d3D = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const angleDeg = (Math.atan2(dy, d2D || 0.0001) * (180 / Math.PI)).toFixed(2);

  const setPreset = (preset) => {
    if (preset === 'length_x') {
      setP1({ x: (-dim.x / 2).toFixed(2), y: '0.00', z: '0.00' });
      setP2({ x: (dim.x / 2).toFixed(2), y: '0.00', z: '0.00' });
    } else if (preset === 'height_y') {
      setP1({ x: '0.00', y: '0.00', z: '0.00' });
      setP2({ x: '0.00', y: dim.y.toFixed(2), z: '0.00' });
    } else if (preset === 'depth_z') {
      setP1({ x: '0.00', y: '0.00', z: (-dim.z / 2).toFixed(2) });
      setP2({ x: '0.00', y: '0.00', z: (dim.z / 2).toFixed(2) });
    } else if (preset === 'diagonal_3d') {
      setP1({ x: (-dim.x / 2).toFixed(2), y: '0.00', z: (-dim.z / 2).toFixed(2) });
      setP2({ x: (dim.x / 2).toFixed(2), y: dim.y.toFixed(2), z: (dim.z / 2).toFixed(2) });
    }
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      aria-label="Precision Distance & Angle Caliper"
      closedby="any"
    >
      <div className="modal-window" style={{ width: '640px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Scissors size={16} color="#f59e0b" />
            <span>Mastercam CAD &bull; Precision Distance &amp; Angle Caliper</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close (Esc)">
            <X size={15} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Quick Presets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '10.5px', color: '#94a3b8', textTransform: 'uppercase' }}>Quick Snap:</span>
            <button type="button" className="btn-secondary" style={{ padding: '3px 8px', fontSize: '10px' }} onClick={() => setPreset('length_x')}>
              X Length Extents
            </button>
            <button type="button" className="btn-secondary" style={{ padding: '3px 8px', fontSize: '10px' }} onClick={() => setPreset('height_y')}>
              Y Height Extents
            </button>
            <button type="button" className="btn-secondary" style={{ padding: '3px 8px', fontSize: '10px' }} onClick={() => setPreset('depth_z')}>
              Z Depth Extents
            </button>
            <button type="button" className="btn-secondary" style={{ padding: '3px 8px', fontSize: '10px' }} onClick={() => setPreset('diagonal_3d')}>
              3D Corner Diagonal
            </button>
          </div>

          {/* Coordinate Inputs (Point 1 and Point 2) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* Point 1 */}
            <div style={{ background: '#11151e', border: '1px solid #283344', borderRadius: '6px', padding: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
                POINT 1 (START DATUM)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#ef4444', fontWeight: 700, width: '16px' }}>X:</span>
                  <input
                    type="number"
                    step="0.01"
                    className="text-input"
                    value={p1.x}
                    onChange={(e) => setP1({ ...p1, x: e.target.value })}
                  />
                  <span style={{ fontSize: '10px', color: '#64748b' }}>mm</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#10b981', fontWeight: 700, width: '16px' }}>Y:</span>
                  <input
                    type="number"
                    step="0.01"
                    className="text-input"
                    value={p1.y}
                    onChange={(e) => setP1({ ...p1, y: e.target.value })}
                  />
                  <span style={{ fontSize: '10px', color: '#64748b' }}>mm</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#3b82f6', fontWeight: 700, width: '16px' }}>Z:</span>
                  <input
                    type="number"
                    step="0.01"
                    className="text-input"
                    value={p1.z}
                    onChange={(e) => setP1({ ...p1, z: e.target.value })}
                  />
                  <span style={{ fontSize: '10px', color: '#64748b' }}>mm</span>
                </div>
              </div>
            </div>

            {/* Point 2 */}
            <div style={{ background: '#11151e', border: '1px solid #283344', borderRadius: '6px', padding: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', marginBottom: '8px' }}>
                POINT 2 (TARGET DATUM)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#ef4444', fontWeight: 700, width: '16px' }}>X:</span>
                  <input
                    type="number"
                    step="0.01"
                    className="text-input"
                    value={p2.x}
                    onChange={(e) => setP2({ ...p2, x: e.target.value })}
                  />
                  <span style={{ fontSize: '10px', color: '#64748b' }}>mm</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#10b981', fontWeight: 700, width: '16px' }}>Y:</span>
                  <input
                    type="number"
                    step="0.01"
                    className="text-input"
                    value={p2.y}
                    onChange={(e) => setP2({ ...p2, y: e.target.value })}
                  />
                  <span style={{ fontSize: '10px', color: '#64748b' }}>mm</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#3b82f6', fontWeight: 700, width: '16px' }}>Z:</span>
                  <input
                    type="number"
                    step="0.01"
                    className="text-input"
                    value={p2.z}
                    onChange={(e) => setP2({ ...p2, z: e.target.value })}
                  />
                  <span style={{ fontSize: '10px', color: '#64748b' }}>mm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Caliper Measurement Readout Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {/* 3D True Distance */}
            <div style={{ background: '#0c0f16', border: '1px solid #3b82f6', borderRadius: '6px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 700 }}>3D TRUE DISTANCE</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                {d3D.toFixed(3)} mm
              </div>
              <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '2px' }}>Direct Euclidean vector</div>
            </div>

            {/* 2D Planar Distance */}
            <div style={{ background: '#0c0f16', border: '1px solid #283344', borderRadius: '6px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#10b981', textTransform: 'uppercase', fontWeight: 700 }}>2D PLANAR (XZ)</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                {d2D.toFixed(3)} mm
              </div>
              <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '2px' }}>Horizontal projection</div>
            </div>

            {/* True Angle */}
            <div style={{ background: '#0c0f16', border: '1px solid #283344', borderRadius: '6px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#f59e0b', textTransform: 'uppercase', fontWeight: 700 }}>INCLINATION ANGLE</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#f59e0b', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                {angleDeg}&deg;
              </div>
              <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '2px' }}>Relative to XY plane</div>
            </div>
          </div>

          {/* Delta Axis Components Table */}
          <div style={{ background: '#11151e', border: '1px solid #283344', borderRadius: '6px', padding: '10px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
              <div><span style={{ color: '#94a3b8' }}>&Delta;X: </span><strong style={{ color: '#ef4444' }}>{dx.toFixed(3)} mm</strong></div>
              <div><span style={{ color: '#94a3b8' }}>&Delta;Y (Height): </span><strong style={{ color: '#10b981' }}>{dy.toFixed(3)} mm</strong></div>
              <div><span style={{ color: '#94a3b8' }}>&Delta;Z: </span><strong style={{ color: '#3b82f6' }}>{dz.toFixed(3)} mm</strong></div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px', borderTop: '1px solid #283344' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Close Caliper</button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
