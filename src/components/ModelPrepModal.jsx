import React, { useState, useEffect, useRef } from 'react';
import {
  X, CheckCircle2, AlertTriangle, RefreshCw, Move, RotateCcw,
  Maximize2, Minimize2, Grid, Crosshair, Sparkles, Layers,
  Compass, Wrench, ShieldAlert, ArrowUp, ArrowDown, ArrowRight, ArrowLeft
} from 'lucide-react';
import {
  checkMeshManifoldIntegrity,
  repairMeshNormals,
  flipMeshNormals,
  createPlanarSurface
} from '../utils/cadGeometry';

export default function ModelPrepModal({
  isOpen,
  onClose,
  initialTab = 'pushpull',
  currentModel,
  partMetrics,
  partTransform,
  onUpdateTransform,
  onResetTransform,
  onAddSurfaceEntity
}) {
  const dialogRef = useRef(null);
  const [activeTab, setActiveTab] = useState(initialTab);

  // Push / Pull direct modeling state
  const [faceDirection, setFaceDirection] = useState('top');
  const [offsetMm, setOffsetMm] = useState(2.0);

  // Custom WCS coordinates state
  const [customX, setCustomX] = useState(0);
  const [customY, setCustomY] = useState(0);
  const [customZ, setCustomZ] = useState(0);

  // Diagnostics state
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
      runDiagnostics();
      if (partTransform?.position) {
        setCustomX(Number(partTransform.position.x?.toFixed(2) || 0));
        setCustomY(Number(partTransform.position.y?.toFixed(2) || 0));
        setCustomZ(Number(partTransform.position.z?.toFixed(2) || 0));
      }
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen, partTransform]);

  const runDiagnostics = () => {
    if (!currentModel) return;
    try {
      const result = checkMeshManifoldIntegrity(currentModel);
      setDiagnosticResult(result);
    } catch {
      setDiagnosticResult(null);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const dim = partMetrics?.dimensions || { x: 100, y: 35, z: 80 };

  // 1. Direct Modeling Push/Pull handler
  const handleApplyPushPull = () => {
    if (!onUpdateTransform) return;
    const delta = parseFloat(offsetMm);
    if (isNaN(delta) || delta === 0) return;

    const currentScale = partTransform?.scale || { x: 1, y: 1, z: 1 };
    const currentPos = partTransform?.position || { x: 0, y: 0, z: 0 };

    if (faceDirection === 'top') {
      const newScaleY = Math.max(0.1, currentScale.y + (delta / (dim.y || 35)));
      onUpdateTransform({
        ...partTransform,
        scale: { ...currentScale, y: newScaleY },
        position: { ...currentPos, y: currentPos.y + delta / 2 }
      });
      setActionMessage(`Pushed Top Face by ${delta > 0 ? '+' : ''}${delta} mm`);
    } else if (faceDirection === 'bottom') {
      const newScaleY = Math.max(0.1, currentScale.y + (delta / (dim.y || 35)));
      onUpdateTransform({
        ...partTransform,
        scale: { ...currentScale, y: newScaleY },
        position: { ...currentPos, y: currentPos.y - delta / 2 }
      });
      setActionMessage(`Pushed Bottom Face by ${delta > 0 ? '+' : ''}${delta} mm`);
    } else if (faceDirection === 'right' || faceDirection === 'left') {
      const newScaleX = Math.max(0.1, currentScale.x + (delta / (dim.x || 100)));
      const posShift = faceDirection === 'right' ? delta / 2 : -delta / 2;
      onUpdateTransform({
        ...partTransform,
        scale: { ...currentScale, x: newScaleX },
        position: { ...currentPos, x: currentPos.x + posShift }
      });
      setActionMessage(`Offset ${faceDirection} face by ${delta > 0 ? '+' : ''}${delta} mm`);
    } else if (faceDirection === 'front' || faceDirection === 'back') {
      const newScaleZ = Math.max(0.1, currentScale.z + (delta / (dim.z || 80)));
      const posShift = faceDirection === 'front' ? delta / 2 : -delta / 2;
      onUpdateTransform({
        ...partTransform,
        scale: { ...currentScale, z: newScaleZ },
        position: { ...currentPos, z: currentPos.z + posShift }
      });
      setActionMessage(`Offset ${faceDirection} face by ${delta > 0 ? '+' : ''}${delta} mm`);
    } else if (faceDirection === 'uniform') {
      const factor = 1 + (delta / Math.max(dim.x, dim.y, dim.z));
      onUpdateTransform({
        ...partTransform,
        scale: {
          x: Math.max(0.1, currentScale.x * factor),
          y: Math.max(0.1, currentScale.y * factor),
          z: Math.max(0.1, currentScale.z * factor)
        }
      });
      setActionMessage(`Applied uniform allowance of ${delta > 0 ? '+' : ''}${delta} mm`);
    }
  };

  // 2. Alignment presets
  const handleAlignTopToZ0 = () => {
    if (!onUpdateTransform) return;
    const currentRot = partTransform?.rotation || { x: 0, y: 0, z: 0 };
    const currentScale = partTransform?.scale || { x: 1, y: 1, z: 1 };
    // Sets top face flush to origin height (CNC Z0 Mastercam standard)
    const targetY = -((dim.y * currentScale.y) / 2);
    onUpdateTransform({
      scale: currentScale,
      rotation: currentRot,
      position: { x: 0, y: targetY, z: 0 }
    });
    setActionMessage('Aligned Workpiece Top Face flush to Z=0 Datum (G54)');
  };

  const handleAlignBottomToTable = () => {
    if (!onUpdateTransform) return;
    const currentRot = partTransform?.rotation || { x: 0, y: 0, z: 0 };
    const currentScale = partTransform?.scale || { x: 1, y: 1, z: 1 };
    onUpdateTransform({
      scale: currentScale,
      rotation: currentRot,
      position: { x: 0, y: -49, z: 0 }
    });
    setActionMessage('Aligned Workpiece Bottom Face resting on Machine Table / Vise');
  };

  const handleCenterXY = () => {
    if (!onUpdateTransform) return;
    const current = partTransform?.position || { x: 0, y: 0, z: 0 };
    onUpdateTransform({
      ...partTransform,
      position: { ...current, x: 0, z: 0 }
    });
    setActionMessage('Centered Workpiece over Machine Spindle Centerline (X0 Y0)');
  };

  const handleApplyCustomWCS = () => {
    if (!onUpdateTransform) return;
    onUpdateTransform({
      ...partTransform,
      position: { x: parseFloat(customX) || 0, y: parseFloat(customY) || 0, z: parseFloat(customZ) || 0 }
    });
    setActionMessage(`Set G54 Origin offset to (${customX}, ${customY}, ${customZ})`);
  };

  // 3. Rotation presets
  const handleRotate = (axis, angleDeg) => {
    if (!onUpdateTransform) return;
    const rad = (angleDeg * Math.PI) / 180;
    const currentRot = partTransform?.rotation || { x: 0, y: 0, z: 0 };
    onUpdateTransform({
      ...partTransform,
      rotation: {
        x: currentRot.x + (axis === 'x' ? rad : 0),
        y: currentRot.y + (axis === 'y' ? rad : 0),
        z: currentRot.z + (axis === 'z' ? rad : 0)
      }
    });
    setActionMessage(`Rotated ${angleDeg}° around ${axis.toUpperCase()} axis`);
  };

  // 4. Hole capping (prevents tool plunge)
  const handleAutoCapTopHoles = () => {
    if (!onAddSurfaceEntity) return;
    const topY = (dim.y / 2) + 0.1;
    const cap1 = createPlanarSurface(22, 22, topY, [-20, -15], 'G17', {
      color: 0x06b6d4,
      opacity: 0.85,
      role: 'check'
    });
    cap1.name = "Surface_Cap_Bore_1";

    const cap2 = createPlanarSurface(22, 22, topY, [20, 15], 'G17', {
      color: 0x06b6d4,
      opacity: 0.85,
      role: 'check'
    });
    cap2.name = "Surface_Cap_Bore_2";

    onAddSurfaceEntity(cap1);
    onAddSurfaceEntity(cap2);
    setActionMessage('Created 2 CAM Check Surface Capping Discs on Level 15');
  };

  // 5. Diagnostics actions
  const handleRepairNormals = () => {
    if (!currentModel) return;
    const count = repairMeshNormals(currentModel);
    runDiagnostics();
    setActionMessage(`Smoothed & Recomputed Normals across ${count} sub-meshes`);
  };

  const handleFlipNormals = () => {
    if (!currentModel) return;
    const count = flipMeshNormals(currentModel);
    runDiagnostics();
    setActionMessage(`Flipped Inverted Face Normals across ${count} sub-meshes`);
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      aria-label="Model Prep & Direct Modeling Suite"
      closedby="any"
    >
      <div className="modal-window" style={{ width: '740px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wrench size={16} color="#38bdf8" />
            <span>Mastercam Model Prep &bull; Direct Modeling &amp; Alignment Suite</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close (Esc)">
            <X size={15} />
          </button>
        </div>

        {/* Action feedback toast */}
        {actionMessage && (
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
              <span>{actionMessage}</span>
            </div>
            <button
              onClick={() => setActionMessage(null)}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
            >
              &times;
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #1f2737',
          backgroundColor: '#0c0f14',
          padding: '0 8px'
        }}>
          {[
            { id: 'pushpull', label: 'Direct Push / Pull', icon: <Maximize2 size={13} /> },
            { id: 'align', label: 'WCS & Table Align', icon: <Crosshair size={13} /> },
            { id: 'orient', label: 'Setup Rotation (Op 2)', icon: <RotateCcw size={13} /> },
            { id: 'defeature', label: 'CAM Defeaturing & Caps', icon: <ShieldAlert size={13} /> },
            { id: 'manifold', label: 'Manifold Diagnostics', icon: <CheckCircle2 size={13} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 13px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #38bdf8' : '2px solid transparent',
                color: activeTab === tab.id ? '#38bdf8' : '#94a3b8',
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
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* ================= 1. DIRECT PUSH / PULL ================= */}
          {activeTab === 'pushpull' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                background: '#141822',
                border: '1px solid #232c3d',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '11px',
                color: '#94a3b8'
              }}>
                Direct modeling modifies solid face offsets without requiring parametric sketch history. Perfect for adding face mill stock allowances or adjusting casting shrinkage.
              </div>

              {/* Select Face Direction */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#f8fafc', marginBottom: '8px' }}>
                  Select Target Face Direction:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'top', label: 'Top Face (+Y)', desc: 'Z Face Mill Allowance' },
                    { id: 'bottom', label: 'Bottom Face (-Y)', desc: 'Base Clamping Stock' },
                    { id: 'right', label: 'Right Face (+X)', desc: 'Length Extension' },
                    { id: 'left', label: 'Left Face (-X)', desc: 'Datum Stop Extension' },
                    { id: 'front', label: 'Front Face (+Z)', desc: 'Width Extension' },
                    { id: 'back', label: 'Back Face (-Z)', desc: 'Rear Vise Allowance' },
                    { id: 'uniform', label: 'Uniform (+XYZ)', desc: 'All-Over Skin Allowance' }
                  ].map((face) => (
                    <button
                      key={face.id}
                      onClick={() => setFaceDirection(face.id)}
                      style={{
                        padding: '8px',
                        background: faceDirection === face.id ? '#1e293b' : '#0e1218',
                        border: `1px solid ${faceDirection === face.id ? '#38bdf8' : '#232c3d'}`,
                        borderRadius: '4px',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontSize: '11px', fontWeight: 600, color: faceDirection === face.id ? '#38bdf8' : '#f8fafc' }}>
                        {face.label}
                      </div>
                      <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>
                        {face.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Offset Input with Quick Buttons */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#f8fafc', marginBottom: '6px' }}>
                  Offset Distance (mm):
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="number"
                    step="0.1"
                    value={offsetMm}
                    onChange={(e) => setOffsetMm(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      background: '#0e1218',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: '#f8fafc',
                      fontSize: '13px',
                      fontWeight: 600,
                      width: '120px'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {[0.5, 1.0, 2.0, 3.0, 5.0, -0.5, -1.0, -2.0].map((val) => (
                      <button
                        key={val}
                        onClick={() => setOffsetMm(val)}
                        style={{
                          padding: '4px 8px',
                          background: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '3px',
                          color: val > 0 ? '#38bdf8' : '#f43f5e',
                          fontSize: '10px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {val > 0 ? `+${val}` : val}mm
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Preview Delta Box */}
              <div style={{ background: '#0e1218', border: '1px solid #1f2737', borderRadius: '6px', padding: '10px 14px' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Active Part Dimensions:</div>
                <div style={{ fontSize: '12px', color: '#f8fafc', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                  X: {dim.x} mm &bull; Y: {dim.y} mm &bull; Z: {dim.z} mm
                </div>
              </div>

              <button
                onClick={handleApplyPushPull}
                className="btn-primary"
                style={{ padding: '9px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}
              >
                <Maximize2 size={14} />
                <span>Apply Push / Pull Face Offset</span>
              </button>
            </div>
          )}

          {/* ================= 2. WCS & TABLE ALIGN ================= */}
          {activeTab === 'align' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                background: '#141822',
                border: '1px solid #232c3d',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '11px',
                color: '#94a3b8'
              }}>
                Align workpiece datum with machine coordinate system (G54 / G55) or machine table bed.
              </div>

              {/* Quick One-Click Alignment Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <button
                  onClick={handleAlignTopToZ0}
                  style={{
                    padding: '12px',
                    background: '#0e1218',
                    border: '1px solid #38bdf8',
                    borderRadius: '6px',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <Crosshair size={18} color="#38bdf8" />
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc', marginTop: '6px' }}>Top Face to Z=0</div>
                  <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '2px' }}>Sets top of workpiece flush with G54 Z origin</div>
                </button>

                <button
                  onClick={handleAlignBottomToTable}
                  style={{
                    padding: '12px',
                    background: '#0e1218',
                    border: '1px solid #10b981',
                    borderRadius: '6px',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <Grid size={18} color="#10b981" />
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc', marginTop: '6px' }}>Drop to Machine Table</div>
                  <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '2px' }}>Rests bottom face on fixture plate / vise</div>
                </button>

                <button
                  onClick={handleCenterXY}
                  style={{
                    padding: '12px',
                    background: '#0e1218',
                    border: '1px solid #f59e0b',
                    borderRadius: '6px',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <Move size={18} color="#f59e0b" />
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc', marginTop: '6px' }}>Center on Spindle</div>
                  <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '2px' }}>Centers part in X and Y over spindle axis</div>
                </button>
              </div>

              {/* Manual WCS Coordinates Form */}
              <div style={{ background: '#0e1218', border: '1px solid #1f2737', borderRadius: '6px', padding: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#f8fafc', marginBottom: '8px' }}>
                  Manual WCS Datum Offset (G54 XYZ mm):
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>X Offset (mm):</label>
                    <input
                      type="number"
                      value={customX}
                      onChange={(e) => setCustomX(e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#f8fafc', fontSize: '11px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Y Offset (mm):</label>
                    <input
                      type="number"
                      value={customY}
                      onChange={(e) => setCustomY(e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#f8fafc', fontSize: '11px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Z Offset (mm):</label>
                    <input
                      type="number"
                      value={customZ}
                      onChange={(e) => setCustomZ(e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#f8fafc', fontSize: '11px' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px', gap: '8px' }}>
                  <button
                    onClick={onResetTransform}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '11px' }}
                  >
                    Reset Origin
                  </button>
                  <button
                    onClick={handleApplyCustomWCS}
                    className="btn-primary"
                    style={{ padding: '6px 14px', fontSize: '11px' }}
                  >
                    Apply Coordinates
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= 3. SETUP ROTATION (OP 2) ================= */}
          {activeTab === 'orient' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                background: '#141822',
                border: '1px solid #232c3d',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '11px',
                color: '#94a3b8'
              }}>
                Rotate CAD model for Setup 2 flips, 4th axis indexers, or 5-axis tombstone horizontal machining centers.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div style={{ background: '#0e1218', border: '1px solid #1f2737', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#f8fafc' }}>X-Axis Rotation (A)</div>
                  <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '2px' }}>Rotate around table width</div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                    <button
                      onClick={() => handleRotate('x', 90)}
                      className="btn-secondary"
                      style={{ flex: 1, padding: '6px', fontSize: '10px' }}
                    >
                      +90&deg;
                    </button>
                    <button
                      onClick={() => handleRotate('x', -90)}
                      className="btn-secondary"
                      style={{ flex: 1, padding: '6px', fontSize: '10px' }}
                    >
                      -90&deg;
                    </button>
                  </div>
                </div>

                <div style={{ background: '#0e1218', border: '1px solid #1f2737', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#f8fafc' }}>Y-Axis Rotation (B)</div>
                  <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '2px' }}>Rotate around spindle</div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                    <button
                      onClick={() => handleRotate('y', 90)}
                      className="btn-secondary"
                      style={{ flex: 1, padding: '6px', fontSize: '10px' }}
                    >
                      +90&deg;
                    </button>
                    <button
                      onClick={() => handleRotate('y', -90)}
                      className="btn-secondary"
                      style={{ flex: 1, padding: '6px', fontSize: '10px' }}
                    >
                      -90&deg;
                    </button>
                  </div>
                </div>

                <div style={{ background: '#0e1218', border: '1px solid #1f2737', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#38bdf8' }}>Z-Axis / Op 2 Flip (C)</div>
                  <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '2px' }}>180&deg; Flip for 2nd Setup</div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                    <button
                      onClick={() => handleRotate('z', 180)}
                      className="btn-primary"
                      style={{ flex: 1, padding: '6px', fontSize: '10px' }}
                    >
                      Flip 180&deg;
                    </button>
                    <button
                      onClick={() => handleRotate('z', 90)}
                      className="btn-secondary"
                      style={{ flex: 1, padding: '6px', fontSize: '10px' }}
                    >
                      +90&deg;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= 4. CAM DEFEATURING & CAPS ================= */}
          {activeTab === 'defeature' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                background: '#141822',
                border: '1px solid #232c3d',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '11px',
                color: '#94a3b8'
              }}>
                CAM defeaturing simplifies surfaces before toolpath calculation. Capping holes prevents 3D high-speed roughing cutters from dropping into bolt holes.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div style={{ background: '#0e1218', border: '1px solid #1f2737', borderRadius: '6px', padding: '14px' }}>
                  <ShieldAlert size={20} color="#06b6d4" />
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc', marginTop: '6px' }}>Auto-Cap Top Face Bolt Holes</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                    Creates planar capping patch discs on Level 15 (Check Surfaces). Toolpaths will skim over the holes without plunging.
                  </div>
                  <button
                    onClick={handleAutoCapTopHoles}
                    className="btn-secondary"
                    style={{ marginTop: '12px', width: '100%', padding: '7px', fontSize: '11px' }}
                  >
                    Generate Hole Capping Discs
                  </button>
                </div>

                <div style={{ background: '#0e1218', border: '1px solid #1f2737', borderRadius: '6px', padding: '14px' }}>
                  <Maximize2 size={20} color="#f59e0b" />
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc', marginTop: '6px' }}>Add Machining Allowance Skin</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                    Expands the solid envelope by +1.5mm uniform offset for casting/forging roughing passes.
                  </div>
                  <button
                    onClick={() => {
                      setFaceDirection('uniform');
                      setOffsetMm(1.5);
                      handleApplyPushPull();
                    }}
                    className="btn-secondary"
                    style={{ marginTop: '12px', width: '100%', padding: '7px', fontSize: '11px' }}
                  >
                    Add +1.5mm Roughing Skin
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= 5. MANIFOLD DIAGNOSTICS ================= */}
          {activeTab === 'manifold' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Manifold Status Banner */}
              <div style={{
                background: diagnosticResult?.isWatertight ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                border: `1px solid ${diagnosticResult?.isWatertight ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                borderRadius: '6px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {diagnosticResult?.isWatertight ? (
                    <CheckCircle2 size={20} color="#34d399" />
                  ) : (
                    <AlertTriangle size={20} color="#fbbf24" />
                  )}
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: diagnosticResult?.isWatertight ? '#34d399' : '#fbbf24' }}>
                      {diagnosticResult?.status || 'Analyzing Manifold Integrity...'}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                      {diagnosticResult?.isWatertight
                        ? 'Solid mesh has 0 open boundary edges and meets CNC toolpath collision standards.'
                        : 'Mesh contains boundary edges or open contours. Toolpath offset may require check surfaces.'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={runDiagnostics}
                  className="btn-secondary"
                  style={{ padding: '5px 10px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <RefreshCw size={11} />
                  Re-Test
                </button>
              </div>

              {/* Integrity Metrics Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                <div style={{ background: '#0e1218', border: '1px solid #1f2737', borderRadius: '4px', padding: '10px' }}>
                  <div style={{ fontSize: '9.5px', color: '#64748b' }}>TOTAL TRIANGLES</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                    {diagnosticResult?.totalTriangles?.toLocaleString() || partMetrics?.triangles || 0}
                  </div>
                </div>

                <div style={{ background: '#0e1218', border: '1px solid #1f2737', borderRadius: '4px', padding: '10px' }}>
                  <div style={{ fontSize: '9.5px', color: '#64748b' }}>TOTAL VERTICES</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8', marginTop: '2px' }}>
                    {diagnosticResult?.totalVertices?.toLocaleString() || 0}
                  </div>
                </div>

                <div style={{ background: '#0e1218', border: '1px solid #1f2737', borderRadius: '4px', padding: '10px' }}>
                  <div style={{ fontSize: '9.5px', color: '#64748b' }}>BOUNDARY EDGES</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: (diagnosticResult?.boundaryEdges || 0) === 0 ? '#10b981' : '#f59e0b', marginTop: '2px' }}>
                    {diagnosticResult?.boundaryEdges || 0}
                  </div>
                </div>

                <div style={{ background: '#0e1218', border: '1px solid #1f2737', borderRadius: '4px', padding: '10px' }}>
                  <div style={{ fontSize: '9.5px', color: '#64748b' }}>NON-MANIFOLD EDGES</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: (diagnosticResult?.nonManifoldEdges || 0) === 0 ? '#10b981' : '#ef4444', marginTop: '2px' }}>
                    {diagnosticResult?.nonManifoldEdges || 0}
                  </div>
                </div>
              </div>

              {/* Repair Operations */}
              <div style={{ background: '#0e1218', border: '1px solid #1f2737', borderRadius: '6px', padding: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#f8fafc', marginBottom: '8px' }}>
                  Mesh Normal Healing Operations:
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleRepairNormals}
                    className="btn-secondary"
                    style={{ padding: '8px 14px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <RefreshCw size={13} color="#38bdf8" />
                    Smooth &amp; Recompute Vertex Normals
                  </button>
                  <button
                    onClick={handleFlipNormals}
                    className="btn-secondary"
                    style={{ padding: '8px 14px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <RotateCcw size={13} color="#f59e0b" />
                    Flip Inverted Triangle Faces
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ borderTop: '1px solid #1f2737', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '10px', color: '#94a3b8' }}>
            Model Prep modifications update toolpath drive geometry and stock boundary in real-time.
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
