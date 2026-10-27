import React, { useState, useEffect, useRef } from 'react';
import {
  X, Compass, Grid, RotateCcw, CheckCircle2, Plus, Trash2,
  Sliders, ArrowUp, ArrowDown, Disc, Eye, Layers, Table
} from 'lucide-react';
import {
  createCPlaneFrom3Points,
  createCPlaneFromAngles,
  DEFAULT_PLANES
} from '../utils/cplaneGeometry';

export default function CPlanesCADModal({
  isOpen,
  onClose,
  planes = DEFAULT_PLANES,
  activePlaneName = 'Top (G17)',
  onSelectPlane,
  onCreatePlane,
  onDeletePlane,
  onNotify
}) {
  const dialogRef = useRef(null);
  const [activeTab, setActiveTab] = useState('angled'); // 'angled' | '3pt' | 'offset'

  // Form: Angled Plane
  const [angledName, setAngledName] = useState('5X_Tilted_B30_C45');
  const [angledCode, setAngledCode] = useState('B30-C45');
  const [rotX, setRotX] = useState(30);
  const [rotY, setRotY] = useState(45);
  const [rotZ, setRotZ] = useState(0);
  const [originX, setOriginX] = useState(0);
  const [originY, setOriginY] = useState(0);
  const [originZ, setOriginZ] = useState(0);
  const [wcsCode, setWcsCode] = useState('G55');

  // Form: 3 Points Plane
  const [threePtName, setThreePtName] = useState('Compound_Slant_Face');
  const [p0, setP0] = useState({ x: 0, y: 35, z: 0 });
  const [p1, setP1] = useState({ x: 50, y: 35, z: 0 });
  const [p2, setP2] = useState({ x: 0, y: 55, z: 40 });

  // Form: Parallel Offset
  const [offsetBasePlane, setOffsetBasePlane] = useState('Top (G17)');
  const [offsetDist, setOffsetDist] = useState(25.0);
  const [offsetName, setOffsetName] = useState('Top_Offset_25mm');

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

  const handleCreateAngled = () => {
    const newPlane = createCPlaneFromAngles({
      name: angledName || `Plane_X${rotX}_Y${rotY}`,
      code: angledCode || 'ANGLED',
      wcsCode,
      origin: { x: Number(originX), y: Number(originY), z: Number(originZ) },
      rotX: Number(rotX),
      rotY: Number(rotY),
      rotZ: Number(rotZ)
    });

    if (onCreatePlane) onCreatePlane(newPlane);
    if (onSelectPlane) onSelectPlane(newPlane.name);
    if (onNotify) onNotify(`CPlane "${newPlane.name}" created and activated!`, 'success');
  };

  const handleCreate3Pt = () => {
    const newPlane = createCPlaneFrom3Points({
      name: threePtName || 'CPlane_3Points',
      code: '3PT',
      wcsCode,
      p0,
      p1,
      p2
    });

    if (onCreatePlane) onCreatePlane(newPlane);
    if (onSelectPlane) onSelectPlane(newPlane.name);
    if (onNotify) onNotify(`CPlane "${newPlane.name}" created from 3 points!`, 'success');
  };

  const handleCreateOffset = () => {
    const base = planes.find((p) => p.name === offsetBasePlane) || planes[0];
    const off = Number(offsetDist);
    const newPlane = {
      id: `cplane_${Date.now()}`,
      name: offsetName || `${base.name}_+${off}mm`,
      code: `OFF+${off}`,
      desc: `Parallel offset +${off}mm from ${base.name}`,
      wcsCode: base.wcsCode || 'G54',
      origin: {
        x: Number((base.origin.x + base.normal.x * off).toFixed(2)),
        y: Number((base.origin.y + base.normal.y * off).toFixed(2)),
        z: Number((base.origin.z + base.normal.z * off).toFixed(2))
      },
      normal: { ...base.normal },
      uAxis: { ...base.uAxis },
      vAxis: { ...base.vAxis },
      isStandard: false,
      isWCS: false,
      isCPlane: true,
      isTPlane: true
    };

    if (onCreatePlane) onCreatePlane(newPlane);
    if (onSelectPlane) onSelectPlane(newPlane.name);
    if (onNotify) onNotify(`CPlane "${newPlane.name}" created with +${off}mm offset!`, 'success');
  };

  return (
    <dialog
      ref={dialogRef}
      id="cplanes-dialog"
      aria-labelledby="cplanes-title"
      closedby="any"
      onClose={onClose}
    >
      <div className="modal-window" style={{ width: '840px', maxHeight: '92vh' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={16} color="#38bdf8" />
            <span id="cplanes-title" style={{ fontWeight: 700 }}>
              Construction Planes &amp; Dynamic WCS Origin Manager (CPlanes &amp; TPlanes)
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close Dialog">
            <X size={15} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '14px' }}>
          
          {/* Method Selector Tabs */}
          <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
            <button
              className={`btn-secondary ${activeTab === 'angled' ? 'active' : ''}`}
              onClick={() => setActiveTab('angled')}
              style={{
                background: activeTab === 'angled' ? '#0284c7' : '#141822',
                color: activeTab === 'angled' ? '#fff' : '#94a3b8',
                fontWeight: 600,
                fontSize: '11px'
              }}
            >
              5-Axis Compound Angled Plane
            </button>
            <button
              className={`btn-secondary ${activeTab === '3pt' ? 'active' : ''}`}
              onClick={() => setActiveTab('3pt')}
              style={{
                background: activeTab === '3pt' ? '#0284c7' : '#141822',
                color: activeTab === '3pt' ? '#fff' : '#94a3b8',
                fontWeight: 600,
                fontSize: '11px'
              }}
            >
              Plane by 3 Points (P0, P1, P2)
            </button>
            <button
              className={`btn-secondary ${activeTab === 'offset' ? 'active' : ''}`}
              onClick={() => setActiveTab('offset')}
              style={{
                background: activeTab === 'offset' ? '#0284c7' : '#141822',
                color: activeTab === 'offset' ? '#fff' : '#94a3b8',
                fontWeight: 600,
                fontSize: '11px'
              }}
            >
              Parallel Offset Plane
            </button>
          </div>

          {/* Creation Form Group */}
          <div className="nc2check-section">
            {activeTab === 'angled' && (
              <>
                <div className="section-label">CREATE COMPOUND 5-AXIS ANGLED PLANE (EULER / TRUNNION ROTATION)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label>Plane Name:</label>
                    <input
                      type="text"
                      className="text-input"
                      value={angledName}
                      onChange={(e) => setAngledName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Short Code:</label>
                    <input
                      type="text"
                      className="text-input"
                      value={angledCode}
                      onChange={(e) => setAngledCode(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>WCS Fixture Datum:</label>
                    <select
                      className="text-input"
                      value={wcsCode}
                      onChange={(e) => setWcsCode(e.target.value)}
                    >
                      <option value="G54">G54 (Primary Fixture)</option>
                      <option value="G55">G55 (Vise 2)</option>
                      <option value="G56">G56 (Fixture 3)</option>
                      <option value="G57">G57 (Sub-Spindle)</option>
                      <option value="G58">G58 (Pallet B)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div className="form-group">
                    <label>Rotation around X-axis (Tilt B°):</label>
                    <input
                      type="number"
                      step="5"
                      className="text-input"
                      value={rotX}
                      onChange={(e) => setRotX(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Rotation around Y-axis (Table C°):</label>
                    <input
                      type="number"
                      step="5"
                      className="text-input"
                      value={rotY}
                      onChange={(e) => setRotY(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Rotation around Z-axis (Spindle A°):</label>
                    <input
                      type="number"
                      step="5"
                      className="text-input"
                      value={rotZ}
                      onChange={(e) => setRotZ(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div className="form-group">
                    <label>Origin X Offset (mm):</label>
                    <input
                      type="number"
                      step="1"
                      className="text-input"
                      value={originX}
                      onChange={(e) => setOriginX(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Origin Y Offset (mm):</label>
                    <input
                      type="number"
                      step="1"
                      className="text-input"
                      value={originY}
                      onChange={(e) => setOriginY(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Origin Z Offset (mm):</label>
                    <input
                      type="number"
                      step="1"
                      className="text-input"
                      value={originZ}
                      onChange={(e) => setOriginZ(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  className="btn-primary"
                  onClick={handleCreateAngled}
                  style={{
                    alignSelf: 'flex-start',
                    marginTop: '4px',
                    background: 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)',
                    borderColor: '#38bdf8'
                  }}
                >
                  <Plus size={14} />
                  <span>Create &amp; Activate Angled Plane</span>
                </button>
              </>
            )}

            {activeTab === '3pt' && (
              <>
                <div className="section-label">CREATE CONSTRUCTION PLANE VIA 3 3D POINTS</div>
                <div className="form-group">
                  <label>Plane Name:</label>
                  <input
                    type="text"
                    className="text-input"
                    value={threePtName}
                    onChange={(e) => setThreePtName(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div className="form-group">
                    <label>P0 Plane Origin [X, Y, Z]:</label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input type="number" className="text-input" value={p0.x} onChange={(e) => setP0({ ...p0, x: Number(e.target.value) })} />
                      <input type="number" className="text-input" value={p0.y} onChange={(e) => setP0({ ...p0, y: Number(e.target.value) })} />
                      <input type="number" className="text-input" value={p0.z} onChange={(e) => setP0({ ...p0, z: Number(e.target.value) })} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>P1 along X-Axis [X, Y, Z]:</label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input type="number" className="text-input" value={p1.x} onChange={(e) => setP1({ ...p1, x: Number(e.target.value) })} />
                      <input type="number" className="text-input" value={p1.y} onChange={(e) => setP1({ ...p1, y: Number(e.target.value) })} />
                      <input type="number" className="text-input" value={p1.z} onChange={(e) => setP1({ ...p1, z: Number(e.target.value) })} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>P2 defining XY Plane [X, Y, Z]:</label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input type="number" className="text-input" value={p2.x} onChange={(e) => setP2({ ...p2, x: Number(e.target.value) })} />
                      <input type="number" className="text-input" value={p2.y} onChange={(e) => setP2({ ...p2, y: Number(e.target.value) })} />
                      <input type="number" className="text-input" value={p2.z} onChange={(e) => setP2({ ...p2, z: Number(e.target.value) })} />
                    </div>
                  </div>
                </div>

                <button
                  className="btn-primary"
                  onClick={handleCreate3Pt}
                  style={{
                    alignSelf: 'flex-start',
                    marginTop: '4px',
                    background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
                    borderColor: '#10b981'
                  }}
                >
                  <Plus size={14} />
                  <span>Create Plane via 3 Points</span>
                </button>
              </>
            )}

            {activeTab === 'offset' && (
              <>
                <div className="section-label">PARALLEL OFFSET FROM EXISTING CPLANE</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label>Select Base Plane:</label>
                    <select
                      className="text-input"
                      value={offsetBasePlane}
                      onChange={(e) => setOffsetBasePlane(e.target.value)}
                    >
                      {planes.map((p) => (
                        <option key={p.id} value={p.name}>{p.name} [{p.code}]</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Normal Offset Distance (mm):</label>
                    <input
                      type="number"
                      step="5"
                      className="text-input"
                      value={offsetDist}
                      onChange={(e) => setOffsetDist(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>New Plane Name:</label>
                    <input
                      type="text"
                      className="text-input"
                      value={offsetName}
                      onChange={(e) => setOffsetName(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  className="btn-primary"
                  onClick={handleCreateOffset}
                  style={{
                    alignSelf: 'flex-start',
                    marginTop: '4px',
                    background: 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)',
                    borderColor: '#38bdf8'
                  }}
                >
                  <Plus size={14} />
                  <span>Create Parallel Offset Plane</span>
                </button>
              </>
            )}
          </div>

          {/* Active Planes Matrix Table */}
          <div className="nc2check-section">
            <div className="section-label">ACTIVE PLANES &amp; WCS DEFINITIONS MATRIX</div>

            <div style={{
              maxHeight: '190px',
              overflowY: 'auto',
              border: '1px solid #1e293b',
              borderRadius: '4px',
              background: '#090d14'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1.5fr 70px 60px 1.2fr 1fr 80px',
                padding: '6px 10px',
                background: '#0f172a',
                fontSize: '10.5px',
                fontWeight: 700,
                color: '#94a3b8',
                borderBottom: '1px solid #1e293b'
              }}>
                <div>Plane Name</div>
                <div>Code</div>
                <div>WCS</div>
                <div>Origin (X, Y, Z)</div>
                <div>Normal (Nx, Ny, Nz)</div>
                <div style={{ textAlign: 'right' }}>Actions</div>
              </div>

              {planes.map((plane) => {
                const isActive = activePlaneName === plane.name;
                return (
                  <div
                    key={plane.id || plane.name}
                    onClick={() => onSelectPlane && onSelectPlane(plane.name)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.5fr 70px 60px 1.2fr 1fr 80px',
                      padding: '7px 10px',
                      fontSize: '11px',
                      alignItems: 'center',
                      background: isActive ? 'rgba(56,189,248,0.12)' : 'transparent',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Compass size={13} color={isActive ? '#38bdf8' : '#94a3b8'} />
                      <strong style={{ color: isActive ? '#38bdf8' : '#f8fafc' }}>{plane.name}</strong>
                    </div>
                    <div style={{ color: '#94a3b8', fontFamily: 'monospace' }}>[{plane.code}]</div>
                    <div style={{ color: '#10b981', fontWeight: 600 }}>{plane.wcsCode || 'G54'}</div>
                    <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>
                      {Number(plane.origin.x).toFixed(1)}, {Number(plane.origin.y).toFixed(1)}, {Number(plane.origin.z).toFixed(1)}
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>
                      {Number(plane.normal.x).toFixed(2)}, {Number(plane.normal.y).toFixed(2)}, {Number(plane.normal.z).toFixed(2)}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {!plane.isStandard && onDeletePlane ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeletePlane(plane.id || plane.name);
                          }}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                          title="Delete Custom Plane"
                        >
                          <Trash2 size={13} />
                        </button>
                      ) : (
                        <span style={{ fontSize: '9px', color: '#64748b' }}>Standard</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}>
            <span style={{ fontSize: '10.5px', color: '#64748b' }}>
              Active Plane: <strong style={{ color: '#38bdf8' }}>{activePlaneName}</strong> &bull; Sketching and 3D grid align to active CPlane.
            </span>
            <button className="btn-secondary" onClick={onClose}>
              Done
            </button>
          </div>

        </div>
      </div>
    </dialog>
  );
}
