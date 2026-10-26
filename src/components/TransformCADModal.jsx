import React, { useState, useEffect, useRef } from 'react';
import {
  X, Move, RotateCcw, Maximize2, Minimize2, Copy, Grid,
  RefreshCw, CheckCircle2, Sparkles, Orbit, Layers, Compass
} from 'lucide-react';
import {
  cloneAndTransformModel,
  mirrorModelAcrossPlane
} from '../utils/cadGeometry';

export default function TransformCADModal({
  isOpen,
  onClose,
  initialTab = 'translate',
  currentModel,
  partTransform,
  onUpdateTransform,
  onResetTransform,
  onAddCustomEntity
}) {
  const dialogRef = useRef(null);
  const [activeTab, setActiveTab] = useState(initialTab);

  // Translate state
  const [transX, setTransX] = useState(0);
  const [transY, setTransY] = useState(0);
  const [transZ, setTransZ] = useState(0);
  const [transMode, setTransMode] = useState('move'); // 'move' or 'copy'
  const [copyCount, setCopyCount] = useState(1);

  // Rotate state
  const [rotAxis, setRotAxis] = useState('z'); // 'x', 'y', 'z'
  const [rotAngle, setRotAngle] = useState(90);
  const [rotMode, setRotMode] = useState('move');

  // Scale state
  const [scaleType, setScaleType] = useState('uniform'); // 'uniform' or 'axes'
  const [uniformScale, setUniformScale] = useState(1.0);
  const [scaleX, setScaleX] = useState(1.0);
  const [scaleY, setScaleY] = useState(1.0);
  const [scaleZ, setScaleZ] = useState(1.0);

  // Mirror state
  const [mirrorPlane, setMirrorPlane] = useState('YZ'); // 'YZ', 'XZ', 'XY'
  const [mirrorMode, setMirrorMode] = useState('copy'); // 'copy' or 'move'

  // Pattern state
  const [patternType, setPatternType] = useState('rect'); // 'rect' or 'circular'
  const [gridCols, setGridCols] = useState(2);
  const [gridRows, setGridRows] = useState(2);
  const [spacingX, setSpacingX] = useState(120);
  const [spacingZ, setSpacingZ] = useState(90);
  const [circCount, setCircCount] = useState(6);
  const [circRadius, setCircRadius] = useState(80);

  // Feedback message
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

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

  // 1. Execute Translation
  const handleApplyTranslate = () => {
    const dx = parseFloat(transX) || 0;
    const dy = parseFloat(transY) || 0;
    const dz = parseFloat(transZ) || 0;

    if (transMode === 'move') {
      if (onUpdateTransform) {
        const curPos = partTransform?.position || { x: 0, y: 0, z: 0 };
        onUpdateTransform({
          ...partTransform,
          position: {
            x: curPos.x + dx,
            y: curPos.y + dy,
            z: curPos.z + dz
          }
        });
        setFeedback(`Moved Workpiece by (dX: ${dx}, dY: ${dy}, dZ: ${dz}) mm`);
      }
    } else {
      // Copy Mode: creates duplicate solid instances in customGeometry
      if (!currentModel || !onAddCustomEntity) return;
      const count = Math.max(1, parseInt(copyCount) || 1);
      for (let i = 1; i <= count; i++) {
        const clone = cloneAndTransformModel(currentModel, {
          name: `CAD_Copy_${Date.now()}_${i}`,
          position: {
            x: (partTransform?.position?.x || 0) + dx * i,
            y: (partTransform?.position?.y || 0) + dy * i,
            z: (partTransform?.position?.z || 0) + dz * i
          },
          rotation: partTransform?.rotation,
          scale: partTransform?.scale
        });
        onAddCustomEntity(clone);
      }
      setFeedback(`Generated ${count} Workpiece Duplicate Instance(s) offset by (${dx * count}, ${dy * count}, ${dz * count}) mm`);
    }
  };

  // 2. Execute Rotation
  const handleApplyRotate = () => {
    const deg = parseFloat(rotAngle) || 0;
    const rad = (deg * Math.PI) / 180;

    if (rotMode === 'move') {
      if (onUpdateTransform) {
        const curRot = partTransform?.rotation || { x: 0, y: 0, z: 0 };
        onUpdateTransform({
          ...partTransform,
          rotation: {
            x: curRot.x + (rotAxis === 'x' ? rad : 0),
            y: curRot.y + (rotAxis === 'y' ? rad : 0),
            z: curRot.z + (rotAxis === 'z' ? rad : 0)
          }
        });
        setFeedback(`Rotated Workpiece ${deg}° around ${rotAxis.toUpperCase()} axis`);
      }
    } else {
      if (!currentModel || !onAddCustomEntity) return;
      const clone = cloneAndTransformModel(currentModel, {
        name: `CAD_Rotated_${rotAxis.toUpperCase()}_${Date.now()}`,
        position: partTransform?.position,
        rotation: {
          x: (partTransform?.rotation?.x || 0) + (rotAxis === 'x' ? rad : 0),
          y: (partTransform?.rotation?.y || 0) + (rotAxis === 'y' ? rad : 0),
          z: (partTransform?.rotation?.z || 0) + (rotAxis === 'z' ? rad : 0)
        },
        scale: partTransform?.scale
      });
      onAddCustomEntity(clone);
      setFeedback(`Created Rotated Copy (${deg}° around ${rotAxis.toUpperCase()})`);
    }
  };

  // 3. Execute Scale
  const handleApplyScale = () => {
    if (!onUpdateTransform) return;
    const curScale = partTransform?.scale || { x: 1, y: 1, z: 1 };

    if (scaleType === 'uniform') {
      const factor = parseFloat(uniformScale) || 1.0;
      onUpdateTransform({
        ...partTransform,
        scale: {
          x: curScale.x * factor,
          y: curScale.y * factor,
          z: curScale.z * factor
        }
      });
      setFeedback(`Scaled Workpiece uniformly by ${factor}x`);
    } else {
      const sx = parseFloat(scaleX) || 1.0;
      const sy = parseFloat(scaleY) || 1.0;
      const sz = parseFloat(scaleZ) || 1.0;
      onUpdateTransform({
        ...partTransform,
        scale: {
          x: curScale.x * sx,
          y: curScale.y * sy,
          z: curScale.z * sz
        }
      });
      setFeedback(`Scaled Workpiece axes independently: (X: ${sx}x, Y: ${sy}x, Z: ${sz}x)`);
    }
  };

  // 4. Execute Mirror
  const handleApplyMirror = () => {
    if (!currentModel) return;

    if (mirrorMode === 'copy') {
      if (!onAddCustomEntity) return;
      const mirrored = mirrorModelAcrossPlane(currentModel, mirrorPlane);
      onAddCustomEntity(mirrored);
      setFeedback(`Created Mirrored Workpiece Copy across ${mirrorPlane} Plane (Left/Right Hand Pair)`);
    } else {
      if (!onUpdateTransform) return;
      const curScale = partTransform?.scale || { x: 1, y: 1, z: 1 };
      onUpdateTransform({
        ...partTransform,
        scale: {
          x: mirrorPlane === 'YZ' ? -curScale.x : curScale.x,
          y: mirrorPlane === 'XZ' ? -curScale.y : curScale.y,
          z: mirrorPlane === 'XY' ? -curScale.z : curScale.z
        }
      });
      setFeedback(`Mirrored Original Workpiece across ${mirrorPlane} Plane`);
    }
  };

  // 5. Execute Multi-Cavity Pattern / Array
  const handleApplyPattern = () => {
    if (!currentModel || !onAddCustomEntity) return;

    if (patternType === 'rect') {
      const cols = Math.max(1, parseInt(gridCols) || 1);
      const rows = Math.max(1, parseInt(gridRows) || 1);
      const dx = parseFloat(spacingX) || 100;
      const dz = parseFloat(spacingZ) || 80;
      let total = 0;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (r === 0 && c === 0) continue; // skip original
          const clone = cloneAndTransformModel(currentModel, {
            name: `CAD_Array_R${r}_C${c}_${Date.now()}`,
            position: {
              x: (partTransform?.position?.x || 0) + c * dx,
              y: partTransform?.position?.y || 0,
              z: (partTransform?.position?.z || 0) + r * dz
            },
            rotation: partTransform?.rotation,
            scale: partTransform?.scale
          });
          onAddCustomEntity(clone);
          total++;
        }
      }
      setFeedback(`Created ${total} Workpieces in a ${cols}x${rows} Multi-Fixture Matrix`);
    } else {
      // Circular Pattern (Rotary Indexer / Spindle)
      const count = Math.max(2, parseInt(circCount) || 4);
      const r = parseFloat(circRadius) || 80;
      let total = 0;

      for (let i = 1; i < count; i++) {
        const theta = (i * 2 * Math.PI) / count;
        const clone = cloneAndTransformModel(currentModel, {
          name: `CAD_CircArray_${i}_${Date.now()}`,
          position: {
            x: (partTransform?.position?.x || 0) + Math.cos(theta) * r,
            y: partTransform?.position?.y || 0,
            z: (partTransform?.position?.z || 0) + Math.sin(theta) * r
          },
          rotation: {
            x: partTransform?.rotation?.x || 0,
            y: (partTransform?.rotation?.y || 0) + theta,
            z: partTransform?.rotation?.z || 0
          },
          scale: partTransform?.scale
        });
        onAddCustomEntity(clone);
        total++;
      }
      setFeedback(`Created ${total} Workpieces in a Circular Array (${count} Total along PCD Ø${r * 2}mm)`);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      aria-label="3D Transform Suite"
      closedby="any"
    >
      <div className="modal-window" style={{ width: '740px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Move size={16} color="#38bdf8" />
            <span>Mastercam Transform &bull; Dynamic 3D Translation, Rotation, Mirror &amp; Patterning</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close (Esc)">
            <X size={15} />
          </button>
        </div>

        {/* Feedback Banner */}
        {feedback && (
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
              <span>{feedback}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
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
            { id: 'translate', label: 'Translate (Move / Copy)', icon: <Move size={13} /> },
            { id: 'rotate', label: 'Rotate (Axis Index)', icon: <RotateCcw size={13} /> },
            { id: 'scale', label: 'Scale & Shrinkage', icon: <Maximize2 size={13} /> },
            { id: 'mirror', label: 'Mirror (LH / RH)', icon: <Copy size={13} /> },
            { id: 'pattern', label: 'Multi-Part Pattern', icon: <Grid size={13} /> }
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
          
          {/* Active Transform Readout Bar */}
          <div style={{ background: '#0e1218', border: '1px solid #1f2737', borderRadius: '6px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              Position: <strong style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>X: {partTransform?.position?.x?.toFixed(1) || 0}, Y: {partTransform?.position?.y?.toFixed(1) || 0}, Z: {partTransform?.position?.z?.toFixed(1) || 0}</strong> &bull;
              Rotation: <strong style={{ color: '#f59e0b', fontFamily: 'var(--font-mono)', marginLeft: '6px' }}>{Math.round(((partTransform?.rotation?.z || 0) * 180) / Math.PI)}&deg;</strong>
            </div>
            <button
              onClick={onResetTransform}
              className="btn-secondary"
              style={{ padding: '3px 8px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <RefreshCw size={11} />
              Reset Transforms
            </button>
          </div>

          {/* ================= 1. TRANSLATE ================= */}
          {activeTab === 'translate' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                background: '#141822',
                border: '1px solid #232c3d',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '11px',
                color: '#94a3b8'
              }}>
                Translate shifts geometry in X, Y, or Z space. Use "Copy" to populate multiple vice stations or tombstone fixtures.
              </div>

              {/* Mode Toggle */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#f8fafc' }}>Operation Mode:</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setTransMode('move')}
                    style={{
                      padding: '5px 12px',
                      background: transMode === 'move' ? '#1e293b' : '#0e1218',
                      border: `1px solid ${transMode === 'move' ? '#38bdf8' : '#334155'}`,
                      borderRadius: '3px',
                      color: transMode === 'move' ? '#38bdf8' : '#94a3b8',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Move Original
                  </button>
                  <button
                    onClick={() => setTransMode('copy')}
                    style={{
                      padding: '5px 12px',
                      background: transMode === 'copy' ? '#1e293b' : '#0e1218',
                      border: `1px solid ${transMode === 'copy' ? '#38bdf8' : '#334155'}`,
                      borderRadius: '3px',
                      color: transMode === 'copy' ? '#38bdf8' : '#94a3b8',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Copy Instance
                  </button>
                </div>

                {transMode === 'copy' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Number of Copies:</span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={copyCount}
                      onChange={(e) => setCopyCount(e.target.value)}
                      style={{ width: '60px', padding: '4px 6px', background: '#0e1218', border: '1px solid #334155', borderRadius: '3px', color: '#fff', fontSize: '11px' }}
                    />
                  </div>
                )}
              </div>

              {/* Delta Coordinates */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div style={{ background: '#0e1218', border: '1px solid #1f2737', borderRadius: '6px', padding: '12px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#38bdf8', display: 'block', marginBottom: '6px' }}>Delta X (mm):</label>
                  <input
                    type="number"
                    value={transX}
                    onChange={(e) => setTransX(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#f8fafc', fontSize: '12px' }}
                  />
                  <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                    {[-50, -10, 10, 50].map((val) => (
                      <button key={val} onClick={() => setTransX(val)} style={{ flex: 1, padding: '2px', background: '#1e293b', border: '1px solid #334155', borderRadius: '2px', color: val > 0 ? '#38bdf8' : '#f43f5e', fontSize: '9px', cursor: 'pointer' }}>
                        {val > 0 ? `+${val}` : val}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ background: '#0e1218', border: '1px solid #1f2737', borderRadius: '6px', padding: '12px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#10b981', display: 'block', marginBottom: '6px' }}>Delta Y (mm):</label>
                  <input
                    type="number"
                    value={transY}
                    onChange={(e) => setTransY(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#f8fafc', fontSize: '12px' }}
                  />
                  <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                    {[-20, -5, 5, 20].map((val) => (
                      <button key={val} onClick={() => setTransY(val)} style={{ flex: 1, padding: '2px', background: '#1e293b', border: '1px solid #334155', borderRadius: '2px', color: val > 0 ? '#10b981' : '#f43f5e', fontSize: '9px', cursor: 'pointer' }}>
                        {val > 0 ? `+${val}` : val}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ background: '#0e1218', border: '1px solid #1f2737', borderRadius: '6px', padding: '12px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#f59e0b', display: 'block', marginBottom: '6px' }}>Delta Z (mm):</label>
                  <input
                    type="number"
                    value={transZ}
                    onChange={(e) => setTransZ(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#f8fafc', fontSize: '12px' }}
                  />
                  <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                    {[-50, -10, 10, 50].map((val) => (
                      <button key={val} onClick={() => setTransZ(val)} style={{ flex: 1, padding: '2px', background: '#1e293b', border: '1px solid #334155', borderRadius: '2px', color: val > 0 ? '#f59e0b' : '#f43f5e', fontSize: '9px', cursor: 'pointer' }}>
                        {val > 0 ? `+${val}` : val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={handleApplyTranslate}
                className="btn-primary"
                style={{ padding: '9px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Move size={14} />
                <span>Execute Translation ({transMode === 'move' ? 'Move' : `Create ${copyCount} Copy`})</span>
              </button>
            </div>
          )}

          {/* ================= 2. ROTATE ================= */}
          {activeTab === 'rotate' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                background: '#141822',
                border: '1px solid #232c3d',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '11px',
                color: '#94a3b8'
              }}>
                Rotate workpiece around standard CNC rotary axes (X: A-axis trunnion, Y: B-axis swivel, Z: C-axis rotary table).
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: '#0e1218', border: '1px solid #1f2737', borderRadius: '6px', padding: '12px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#f8fafc', display: 'block', marginBottom: '8px' }}>
                    Select Rotary Axis:
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[
                      { id: 'x', label: 'X Axis (A)' },
                      { id: 'y', label: 'Y Axis (B)' },
                      { id: 'z', label: 'Z Axis (C)' }
                    ].map((axis) => (
                      <button
                        key={axis.id}
                        onClick={() => setRotAxis(axis.id)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          background: rotAxis === axis.id ? '#1e293b' : '#141822',
                          border: `1px solid ${rotAxis === axis.id ? '#38bdf8' : '#334155'}`,
                          borderRadius: '4px',
                          color: rotAxis === axis.id ? '#38bdf8' : '#94a3b8',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {axis.label}
                      </button>
                    ))}
                  </div>

                  <div style={{ marginTop: '12px' }}>
                    <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                      Rotation Angle (Degrees):
                    </label>
                    <input
                      type="number"
                      value={rotAngle}
                      onChange={(e) => setRotAngle(e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#f8fafc', fontSize: '12px' }}
                    />
                    <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                      {[45, 90, 180, -90].map((deg) => (
                        <button key={deg} onClick={() => setRotAngle(deg)} style={{ flex: 1, padding: '3px', background: '#1e293b', border: '1px solid #334155', borderRadius: '2px', color: '#38bdf8', fontSize: '10px', cursor: 'pointer' }}>
                          {deg}&deg;
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ background: '#0e1218', border: '1px solid #1f2737', borderRadius: '6px', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#f8fafc', display: 'block', marginBottom: '8px' }}>
                      Action Mode:
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => setRotMode('move')}
                        style={{ flex: 1, padding: '7px', background: rotMode === 'move' ? '#1e293b' : '#141822', border: `1px solid ${rotMode === 'move' ? '#38bdf8' : '#334155'}`, borderRadius: '3px', color: rotMode === 'move' ? '#38bdf8' : '#94a3b8', fontSize: '11px', cursor: 'pointer' }}
                      >
                        Rotate Original
                      </button>
                      <button
                        onClick={() => setRotMode('copy')}
                        style={{ flex: 1, padding: '7px', background: rotMode === 'copy' ? '#1e293b' : '#141822', border: `1px solid ${rotMode === 'copy' ? '#38bdf8' : '#334155'}`, borderRadius: '3px', color: rotMode === 'copy' ? '#38bdf8' : '#94a3b8', fontSize: '11px', cursor: 'pointer' }}
                      >
                        Create Rotated Copy
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleApplyRotate}
                    className="btn-primary"
                    style={{ width: '100%', padding: '9px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <RotateCcw size={14} />
                    <span>Apply Rotation</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= 3. SCALE & SHRINKAGE ================= */}
          {activeTab === 'scale' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                background: '#141822',
                border: '1px solid #232c3d',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '11px',
                color: '#94a3b8'
              }}>
                Apply uniform scaling for casting shrinkage allowances, unit conversions (Inch &harr; Metric), or independent axis scaling.
              </div>

              {/* Mode Toggle */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setScaleType('uniform')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: scaleType === 'uniform' ? '#1e293b' : '#0e1218',
                    border: `1px solid ${scaleType === 'uniform' ? '#38bdf8' : '#334155'}`,
                    borderRadius: '4px',
                    color: scaleType === 'uniform' ? '#38bdf8' : '#94a3b8',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Uniform Scaling (XYZ)
                </button>
                <button
                  onClick={() => setScaleType('axes')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: scaleType === 'axes' ? '#1e293b' : '#0e1218',
                    border: `1px solid ${scaleType === 'axes' ? '#38bdf8' : '#334155'}`,
                    borderRadius: '4px',
                    color: scaleType === 'axes' ? '#38bdf8' : '#94a3b8',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Independent Axes Scaling
                </button>
              </div>

              {scaleType === 'uniform' ? (
                <div style={{ background: '#0e1218', border: '1px solid #1f2737', borderRadius: '6px', padding: '14px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#f8fafc', display: 'block', marginBottom: '6px' }}>
                    Uniform Scaling Factor:
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={uniformScale}
                    onChange={(e) => setUniformScale(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', background: '#141822', border: '1px solid #334155', borderRadius: '4px', color: '#38bdf8', fontSize: '14px', fontWeight: 700 }}
                  />

                  <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                    {[
                      { label: '+2.5% Casting Shrinkage', val: 1.025 },
                      { label: '-2.5% Allowance', val: 0.975 },
                      { label: 'Inch to MM (25.4x)', val: 25.4 },
                      { label: 'MM to Inch (0.03937x)', val: 0.03937 },
                      { label: '2.0x Double', val: 2.0 },
                      { label: '0.5x Half', val: 0.5 }
                    ].map((p) => (
                      <button
                        key={p.label}
                        onClick={() => setUniformScale(p.val)}
                        style={{ padding: '4px 8px', background: '#1e293b', border: '1px solid #334155', borderRadius: '3px', color: '#f8fafc', fontSize: '10px', cursor: 'pointer' }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div style={{ background: '#0e1218', border: '1px solid #1f2737', borderRadius: '4px', padding: '10px' }}>
                    <label style={{ fontSize: '10px', color: '#38bdf8', display: 'block' }}>Scale X Factor:</label>
                    <input type="number" step="0.01" value={scaleX} onChange={(e) => setScaleX(e.target.value)} style={{ width: '100%', padding: '6px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#fff', fontSize: '11px', marginTop: '4px' }} />
                  </div>
                  <div style={{ background: '#0e1218', border: '1px solid #1f2737', borderRadius: '4px', padding: '10px' }}>
                    <label style={{ fontSize: '10px', color: '#10b981', display: 'block' }}>Scale Y Factor:</label>
                    <input type="number" step="0.01" value={scaleY} onChange={(e) => setScaleY(e.target.value)} style={{ width: '100%', padding: '6px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#fff', fontSize: '11px', marginTop: '4px' }} />
                  </div>
                  <div style={{ background: '#0e1218', border: '1px solid #1f2737', borderRadius: '4px', padding: '10px' }}>
                    <label style={{ fontSize: '10px', color: '#f59e0b', display: 'block' }}>Scale Z Factor:</label>
                    <input type="number" step="0.01" value={scaleZ} onChange={(e) => setScaleZ(e.target.value)} style={{ width: '100%', padding: '6px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#fff', fontSize: '11px', marginTop: '4px' }} />
                  </div>
                </div>
              )}

              <button
                onClick={handleApplyScale}
                className="btn-primary"
                style={{ padding: '9px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Maximize2 size={14} />
                <span>Apply Scale Factor</span>
              </button>
            </div>
          )}

          {/* ================= 4. MIRROR ================= */}
          {activeTab === 'mirror' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                background: '#141822',
                border: '1px solid #232c3d',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '11px',
                color: '#94a3b8'
              }}>
                Mirror creates symmetrical left-hand / right-hand part pairs (automotive brackets, aerospace ribs) across principal planes.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {[
                  { id: 'YZ', label: 'YZ Plane', desc: 'Left / Right Hand Flip' },
                  { id: 'XZ', label: 'XZ Plane', desc: 'Top / Bottom Inversion' },
                  { id: 'XY', label: 'XY Plane', desc: 'Front / Back Flip' }
                ].map((plane) => (
                  <button
                    key={plane.id}
                    onClick={() => setMirrorPlane(plane.id)}
                    style={{
                      padding: '12px',
                      background: mirrorPlane === plane.id ? '#1e293b' : '#0e1218',
                      border: `1px solid ${mirrorPlane === plane.id ? '#38bdf8' : '#232c3d'}`,
                      borderRadius: '6px',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <Copy size={16} color={mirrorPlane === plane.id ? '#38bdf8' : '#94a3b8'} />
                    <div style={{ fontSize: '12px', fontWeight: 700, color: mirrorPlane === plane.id ? '#38bdf8' : '#f8fafc', marginTop: '6px' }}>
                      {plane.label}
                    </div>
                    <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '2px' }}>{plane.desc}</div>
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#f8fafc' }}>Mirror Mode:</label>
                <button
                  onClick={() => setMirrorMode('copy')}
                  style={{ padding: '5px 12px', background: mirrorMode === 'copy' ? '#1e293b' : '#0e1218', border: `1px solid ${mirrorMode === 'copy' ? '#38bdf8' : '#334155'}`, borderRadius: '3px', color: mirrorMode === 'copy' ? '#38bdf8' : '#94a3b8', fontSize: '11px', cursor: 'pointer' }}
                >
                  Create Mirrored Copy (Keep Both)
                </button>
                <button
                  onClick={() => setMirrorMode('move')}
                  style={{ padding: '5px 12px', background: mirrorMode === 'move' ? '#1e293b' : '#0e1218', border: `1px solid ${mirrorMode === 'move' ? '#38bdf8' : '#334155'}`, borderRadius: '3px', color: mirrorMode === 'move' ? '#38bdf8' : '#94a3b8', fontSize: '11px', cursor: 'pointer' }}
                >
                  Mirror In-Place
                </button>
              </div>

              <button
                onClick={handleApplyMirror}
                className="btn-primary"
                style={{ padding: '9px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Copy size={14} />
                <span>Execute Mirror ({mirrorPlane} Plane)</span>
              </button>
            </div>
          )}

          {/* ================= 5. PATTERN / ARRAY ================= */}
          {activeTab === 'pattern' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                background: '#141822',
                border: '1px solid #232c3d',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '11px',
                color: '#94a3b8'
              }}>
                Multi-cavity production tooling: generates rectangular matrices (multiple vices on CNC bed) or circular arrays for 4th/5th axis rotary fixtures.
              </div>

              {/* Mode Toggle */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setPatternType('rect')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: patternType === 'rect' ? '#1e293b' : '#0e1218',
                    border: `1px solid ${patternType === 'rect' ? '#38bdf8' : '#334155'}`,
                    borderRadius: '4px',
                    color: patternType === 'rect' ? '#38bdf8' : '#94a3b8',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Rectangular Grid Matrix
                </button>
                <button
                  onClick={() => setPatternType('circular')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: patternType === 'circular' ? '#1e293b' : '#0e1218',
                    border: `1px solid ${patternType === 'circular' ? '#38bdf8' : '#334155'}`,
                    borderRadius: '4px',
                    color: patternType === 'circular' ? '#38bdf8' : '#94a3b8',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Circular Bolt Pattern (PCD)
                </button>
              </div>

              {patternType === 'rect' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  <div style={{ background: '#0e1218', border: '1px solid #1f2737', borderRadius: '4px', padding: '10px' }}>
                    <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Cols (X Count):</label>
                    <input type="number" min="1" max="10" value={gridCols} onChange={(e) => setGridCols(e.target.value)} style={{ width: '100%', padding: '6px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#fff', fontSize: '11px', marginTop: '4px' }} />
                  </div>
                  <div style={{ background: '#0e1218', border: '1px solid #1f2737', borderRadius: '4px', padding: '10px' }}>
                    <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Rows (Z Count):</label>
                    <input type="number" min="1" max="10" value={gridRows} onChange={(e) => setGridRows(e.target.value)} style={{ width: '100%', padding: '6px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#fff', fontSize: '11px', marginTop: '4px' }} />
                  </div>
                  <div style={{ background: '#0e1218', border: '1px solid #1f2737', borderRadius: '4px', padding: '10px' }}>
                    <label style={{ fontSize: '10px', color: '#38bdf8', display: 'block' }}>Spacing X (mm):</label>
                    <input type="number" value={spacingX} onChange={(e) => setSpacingX(e.target.value)} style={{ width: '100%', padding: '6px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#fff', fontSize: '11px', marginTop: '4px' }} />
                  </div>
                  <div style={{ background: '#0e1218', border: '1px solid #1f2737', borderRadius: '4px', padding: '10px' }}>
                    <label style={{ fontSize: '10px', color: '#f59e0b', display: 'block' }}>Spacing Z (mm):</label>
                    <input type="number" value={spacingZ} onChange={(e) => setSpacingZ(e.target.value)} style={{ width: '100%', padding: '6px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#fff', fontSize: '11px', marginTop: '4px' }} />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: '#0e1218', border: '1px solid #1f2737', borderRadius: '6px', padding: '12px' }}>
                    <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Total Instances along PCD:</label>
                    <input type="number" min="2" max="24" value={circCount} onChange={(e) => setCircCount(e.target.value)} style={{ width: '100%', padding: '6px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#38bdf8', fontSize: '13px', fontWeight: 700, marginTop: '4px' }} />
                  </div>
                  <div style={{ background: '#0e1218', border: '1px solid #1f2737', borderRadius: '6px', padding: '12px' }}>
                    <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Pattern Radius (mm):</label>
                    <input type="number" value={circRadius} onChange={(e) => setCircRadius(e.target.value)} style={{ width: '100%', padding: '6px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#10b981', fontSize: '13px', fontWeight: 700, marginTop: '4px' }} />
                  </div>
                </div>
              )}

              <button
                onClick={handleApplyPattern}
                className="btn-primary"
                style={{ padding: '9px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Grid size={14} />
                <span>Generate Multi-Part Pattern Array</span>
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ borderTop: '1px solid #1f2737', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '10px', color: '#94a3b8' }}>
            Transform operations immediately reposition workpieces for multi-axis CNC toolpath generation.
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
