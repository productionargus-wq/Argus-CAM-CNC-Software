import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { X, Ruler, Box, Scale, Compass, CheckCircle2, Circle, Check, RotateCcw, ArrowRightLeft } from 'lucide-react';
import { summarizeSelectedEntities, getCustomEntityId } from '../utils/cadSelectionEngine';

export default function EntityAnalyzerModal({
  isOpen,
  onClose,
  partMetrics,
  stockConfig,
  currentProjectName,
  selectedEntities = [],
  onUpdateEntity = null
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

  const hasSelection = Array.isArray(selectedEntities) && selectedEntities.length > 0;
  const singleEntity = hasSelection && selectedEntities.length === 1 ? selectedEntities[0] : null;
  const singleUd = singleEntity?.userData || {};
  const isCircleOrArc = singleEntity ? (
    singleUd.cadType === 'circle' ||
    singleUd.type === 'circle' ||
    singleUd.type === 'arc' ||
    typeof singleUd.radius === 'number'
  ) : false;

  const isLine = singleEntity ? (
    singleUd.cadType === 'line' ||
    singleUd.type === 'line' ||
    (singleUd.p1 && singleUd.p2) ||
    singleEntity.name?.startsWith('Wireframe_Line') ||
    singleEntity.name?.startsWith('Wireframe_Tangent') ||
    singleEntity.name?.startsWith('Wireframe_Perp') ||
    singleEntity.name?.startsWith('Wireframe_Parallel')
  ) : false;

  const getLineInitialPoints = () => {
    if (!singleEntity) return { p1: { x: 0, y: 0, z: 0 }, p2: { x: 50, y: 0, z: 0 } };
    if (singleUd.p1 && singleUd.p2) {
      return { p1: singleUd.p1, p2: singleUd.p2 };
    }
    const pos = singleEntity.geometry?.attributes?.position;
    if (pos && pos.count >= 2) {
      return {
        p1: { x: pos.getX(0), y: pos.getY(0), z: pos.getZ(0) },
        p2: { x: pos.getX(1), y: pos.getY(1), z: pos.getZ(1) }
      };
    }
    return { p1: { x: 0, y: 0, z: 0 }, p2: { x: 50, y: 0, z: 0 } };
  };

  const selSummary = hasSelection ? summarizeSelectedEntities(selectedEntities) : null;
  const selDims = selSummary?.combinedBox ? selSummary.combinedBox.getSize(new THREE.Vector3()) : null;
  const selCenter = selSummary?.combinedBox ? selSummary.combinedBox.getCenter(new THREE.Vector3()) : null;

  // Circle Parametric Edit State
  const initialRadius = isCircleOrArc ? (singleUd.radius || (selDims ? selDims.x / 2 : 25)) : 25;
  const initialCx = isCircleOrArc ? (singleUd.center?.x ?? (selCenter ? selCenter.x : 0)) : 0;
  const initialCy = isCircleOrArc ? (singleUd.center?.z ?? singleUd.center?.y ?? (selCenter ? selCenter.z : 0)) : 0;
  const initialCz = isCircleOrArc ? (singleEntity.position?.y ?? singleUd.center?.y ?? (selCenter ? selCenter.y : 0)) : 0;

  const [paramRadius, setParamRadius] = useState(initialRadius);
  const [paramDiameter, setParamDiameter] = useState(initialRadius * 2);
  const [paramCx, setParamCx] = useState(initialCx);
  const [paramCy, setParamCy] = useState(initialCy);
  const [paramCz, setParamCz] = useState(initialCz);
  const [isModified, setIsModified] = useState(false);

  // Line Parametric Edit State (Mastercam G17 Top Plane: CNC X = p.x, CNC Y = -p.z, CNC Z_elev = p.y)
  const linePts = getLineInitialPoints();
  const initX1 = linePts.p1.x;
  const initY1 = -linePts.p1.z;
  const initZ1 = linePts.p1.y;
  const initX2 = linePts.p2.x;
  const initY2 = -linePts.p2.z;
  const initZ2 = linePts.p2.y;
  const initDx = initX2 - initX1;
  const initDy = initY2 - initY1;
  const initLen = Math.hypot(initDx, initDy);
  const initAng = (Math.atan2(initDy, initDx) * 180 / Math.PI + 360) % 360;

  const [lineLength, setLineLength] = useState(initLen.toFixed(4));
  const [lineAngle, setLineAngle] = useState(initAng.toFixed(2));
  const [lineX1, setLineX1] = useState(initX1.toFixed(4));
  const [lineY1, setLineY1] = useState(initY1.toFixed(4));
  const [lineZ1, setLineZ1] = useState(initZ1.toFixed(4));
  const [lineX2, setLineX2] = useState(initX2.toFixed(4));
  const [lineY2, setLineY2] = useState(initY2.toFixed(4));
  const [lineZ2, setLineZ2] = useState(initZ2.toFixed(4));
  const [isLineModified, setIsLineModified] = useState(false);

  useEffect(() => {
    if (isCircleOrArc && singleEntity) {
      const r = singleUd.radius || (selDims ? selDims.x / 2 : 25);
      const cx = singleUd.center?.x ?? (selCenter ? selCenter.x : 0);
      const cy = singleUd.center?.z ?? singleUd.center?.y ?? (selCenter ? selCenter.z : 0);
      const cz = singleEntity.position?.y ?? singleUd.center?.y ?? (selCenter ? selCenter.y : 0);
      setParamRadius(Number(r.toFixed(4)));
      setParamDiameter(Number((r * 2).toFixed(4)));
      setParamCx(Number(cx.toFixed(4)));
      setParamCy(Number(cy.toFixed(4)));
      setParamCz(Number(cz.toFixed(4)));
      setIsModified(false);
    } else if (isLine && singleEntity) {
      const pts = getLineInitialPoints();
      const x1 = pts.p1.x;
      const y1 = -pts.p1.z;
      const z1 = pts.p1.y;
      const x2 = pts.p2.x;
      const y2 = -pts.p2.z;
      const z2 = pts.p2.y;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy);
      const ang = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;

      setLineX1(x1.toFixed(4));
      setLineY1(y1.toFixed(4));
      setLineZ1(z1.toFixed(4));
      setLineX2(x2.toFixed(4));
      setLineY2(y2.toFixed(4));
      setLineZ2(z2.toFixed(4));
      setLineLength(len.toFixed(4));
      setLineAngle(ang.toFixed(2));
      setIsLineModified(false);
    }
  }, [singleEntity, isOpen, isLine, isCircleOrArc]);

  const handleDiameterChange = (val) => {
    const num = parseFloat(val);
    setParamDiameter(val);
    if (!isNaN(num) && num > 0) {
      setParamRadius(Number((num / 2).toFixed(4)));
      setIsModified(true);
    }
  };

  const handleRadiusChange = (val) => {
    const num = parseFloat(val);
    setParamRadius(val);
    if (!isNaN(num) && num > 0) {
      setParamDiameter(Number((num * 2).toFixed(4)));
      setIsModified(true);
    }
  };

  const handleReset = () => {
    if (isCircleOrArc && singleEntity) {
      const r = singleUd.radius || 25;
      const cx = singleUd.center?.x ?? 0;
      const cy = singleUd.center?.z ?? singleUd.center?.y ?? 0;
      const cz = singleEntity.position?.y ?? singleUd.center?.y ?? 0;
      setParamRadius(Number(r.toFixed(4)));
      setParamDiameter(Number((r * 2).toFixed(4)));
      setParamCx(Number(cx.toFixed(4)));
      setParamCy(Number(cy.toFixed(4)));
      setParamCz(Number(cz.toFixed(4)));
      setIsModified(false);
    }
  };

  const handleApplyUpdate = () => {
    const entityId = singleEntity ? getCustomEntityId(singleEntity) : null;
    if (!onUpdateEntity || !entityId) return;
    const r = parseFloat(paramRadius);
    const cx = parseFloat(paramCx);
    const cy = parseFloat(paramCy);
    const cz = parseFloat(paramCz);
    if (!isNaN(r) && r > 0) {
      onUpdateEntity(entityId, {
        radius: r,
        centerX: isNaN(cx) ? 0 : cx,
        centerY: isNaN(cy) ? 0 : cy,
        centerZ: isNaN(cz) ? 0 : cz
      });
      setIsModified(false);
    }
  };

  // Line Handlers
  const handleLineLengthChange = (val) => {
    setLineLength(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      const ang = parseFloat(lineAngle) || 0;
      const rad = (ang * Math.PI) / 180;
      const x1 = parseFloat(lineX1) || 0;
      const y1 = parseFloat(lineY1) || 0;
      const newX2 = x1 + Math.cos(rad) * num;
      const newY2 = y1 + Math.sin(rad) * num;
      setLineX2(newX2.toFixed(4));
      setLineY2(newY2.toFixed(4));
      setIsLineModified(true);
    }
  };

  const handleLineAngleChange = (val) => {
    setLineAngle(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      const len = parseFloat(lineLength) || 10;
      const rad = (num * Math.PI) / 180;
      const x1 = parseFloat(lineX1) || 0;
      const y1 = parseFloat(lineY1) || 0;
      const newX2 = x1 + Math.cos(rad) * len;
      const newY2 = y1 + Math.sin(rad) * len;
      setLineX2(newX2.toFixed(4));
      setLineY2(newY2.toFixed(4));
      setIsLineModified(true);
    }
  };

  const handleSetAnglePreset = (deg) => {
    handleLineAngleChange(String(deg));
  };

  const handleLineCoordChange = (field, val) => {
    let nextX1 = field === 'x1' ? val : lineX1;
    let nextY1 = field === 'y1' ? val : lineY1;
    let nextZ1 = field === 'z1' ? val : lineZ1;
    let nextX2 = field === 'x2' ? val : lineX2;
    let nextY2 = field === 'y2' ? val : lineY2;
    let nextZ2 = field === 'z2' ? val : lineZ2;

    if (field === 'x1') setLineX1(val);
    if (field === 'y1') setLineY1(val);
    if (field === 'z1') setLineZ1(val);
    if (field === 'x2') setLineX2(val);
    if (field === 'y2') setLineY2(val);
    if (field === 'z2') setLineZ2(val);

    const nx1 = parseFloat(nextX1);
    const ny1 = parseFloat(nextY1);
    const nx2 = parseFloat(nextX2);
    const ny2 = parseFloat(nextY2);
    if (!isNaN(nx1) && !isNaN(ny1) && !isNaN(nx2) && !isNaN(ny2)) {
      const dx = nx2 - nx1;
      const dy = ny2 - ny1;
      const len = Math.hypot(dx, dy);
      const ang = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
      setLineLength(len.toFixed(4));
      setLineAngle(ang.toFixed(2));
    }
    setIsLineModified(true);
  };

  const handleReverseLineDirection = () => {
    const curX1 = lineX1;
    const curY1 = lineY1;
    const curZ1 = lineZ1;
    setLineX1(lineX2);
    setLineY1(lineY2);
    setLineZ1(lineZ2);
    setLineX2(curX1);
    setLineY2(curY1);
    setLineZ2(curZ1);
    const newAng = (parseFloat(lineAngle || 0) + 180) % 360;
    setLineAngle(newAng.toFixed(2));
    setIsLineModified(true);
  };

  const handleResetLine = () => {
    if (isLine && singleEntity) {
      const pts = getLineInitialPoints();
      const x1 = pts.p1.x;
      const y1 = -pts.p1.z;
      const z1 = pts.p1.y;
      const x2 = pts.p2.x;
      const y2 = -pts.p2.z;
      const z2 = pts.p2.y;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy);
      const ang = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;

      setLineX1(x1.toFixed(4));
      setLineY1(y1.toFixed(4));
      setLineZ1(z1.toFixed(4));
      setLineX2(x2.toFixed(4));
      setLineY2(y2.toFixed(4));
      setLineZ2(z2.toFixed(4));
      setLineLength(len.toFixed(4));
      setLineAngle(ang.toFixed(2));
      setIsLineModified(false);
    }
  };

  const handleApplyLineUpdate = () => {
    const entityId = singleEntity ? getCustomEntityId(singleEntity) : null;
    if (!onUpdateEntity || !entityId) return;
    const x1 = parseFloat(lineX1);
    const y1 = parseFloat(lineY1);
    const z1 = parseFloat(lineZ1);
    const x2 = parseFloat(lineX2);
    const y2 = parseFloat(lineY2);
    const z2 = parseFloat(lineZ2);
    if (!isNaN(x1) && !isNaN(y1) && !isNaN(x2) && !isNaN(y2)) {
      onUpdateEntity(entityId, {
        cadType: 'line',
        p1: { x: x1, y: isNaN(z1) ? 0 : z1, z: -y1 },
        p2: { x: x2, y: isNaN(z2) ? 0 : z2, z: -y2 },
        length: parseFloat(lineLength),
        angle: parseFloat(lineAngle)
      });
      setIsLineModified(false);
    }
  };

  if (!isOpen) return null;

  const dim = selDims
    ? { x: Number(selDims.x.toFixed(2)), y: Number(selDims.y.toFixed(2)), z: Number(selDims.z.toFixed(2)) }
    : (partMetrics?.dimensions || { x: 0, y: 0, z: 0 });
  const center = selCenter
    ? { x: Number(selCenter.x.toFixed(2)), y: Number(selCenter.y.toFixed(2)), z: Number(selCenter.z.toFixed(2)) }
    : (partMetrics?.center || { x: 0, y: 0, z: 0 });
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
          {/* Mastercam Analyze Arc / Circle Parametric Inspector */}
          {isCircleOrArc && (
            <div style={{
              background: '#f8fafc',
              border: '1.5px solid #38bdf8',
              borderRadius: '6px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Circle size={16} color="#0284c7" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#0369a1' }}>
                    Mastercam Analyze Arc / Circle Properties & Live Resizer
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: '#0284c7', background: '#e0f2fe', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                  F4 Parametric Edit
                </span>
              </div>

              {/* Editable Dimensions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>Diameter (Ø mm):</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={paramDiameter}
                    onChange={(e) => handleDiameterChange(e.target.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      background: '#ffffff',
                      color: '#0f172a'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>Radius (R mm):</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.05"
                    value={paramRadius}
                    onChange={(e) => handleRadiusChange(e.target.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      background: '#ffffff',
                      color: '#0f172a'
                    }}
                  />
                </div>
              </div>

              {/* Center Coordinates */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '10.5px', color: '#64748b' }}>Center X (mm):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={paramCx}
                    onChange={(e) => { setParamCx(e.target.value); setIsModified(true); }}
                    style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', fontFamily: 'var(--font-mono)' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '10.5px', color: '#64748b' }}>Center Y (mm):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={paramCy}
                    onChange={(e) => { setParamCy(e.target.value); setIsModified(true); }}
                    style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', fontFamily: 'var(--font-mono)' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '10.5px', color: '#64748b' }}>Z Elevation (mm):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={paramCz}
                    onChange={(e) => { setParamCz(e.target.value); setIsModified(true); }}
                    style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              </div>

              {/* Arc Quick Stats & Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Circumference: <strong>{(Math.PI * Number(paramDiameter || 0)).toFixed(2)} mm</strong> | Area: <strong>{(Math.PI * Math.pow(Number(paramRadius || 0), 2)).toFixed(1)} mm²</strong>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {isModified && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <RotateCcw size={12} /> Reset
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleApplyUpdate}
                    className="btn-primary"
                    disabled={!onUpdateEntity}
                    style={{
                      padding: '5px 14px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: '#0284c7',
                      color: '#ffffff',
                      cursor: onUpdateEntity ? 'pointer' : 'not-allowed'
                    }}
                  >
                    <Check size={14} /> Apply / Resize Entity
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mastercam Analyze Line Parametric Inspector */}
          {isLine && (
            <div style={{
              background: '#f8fafc',
              border: '1.5px solid #0284c7',
              borderRadius: '6px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Ruler size={16} color="#0284c7" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#0369a1' }}>
                    Mastercam Analyze Line Properties & Live Resizer
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: '#0284c7', background: '#e0f2fe', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                  F4 Parametric Edit
                </span>
              </div>

              {/* Editable Dimensions: Length & Angle */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a' }}>Line Length (mm):</label>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>Locks Point 1</span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={lineLength}
                    onChange={(e) => handleLineLengthChange(e.target.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '4px',
                      border: '1.5px solid #0284c7',
                      fontSize: '13px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      background: '#ffffff',
                      color: '#0f172a'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a' }}>Angle (°):</label>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>[0° - 360°)</span>
                  </div>
                  <input
                    type="number"
                    step="0.5"
                    value={lineAngle}
                    onChange={(e) => handleLineAngleChange(e.target.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      background: '#ffffff',
                      color: '#0f172a'
                    }}
                  />
                </div>
              </div>

              {/* Quick Angle Presets */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Presets:</span>
                {[0, 45, 90, 180, 270].map((deg) => (
                  <button
                    key={deg}
                    type="button"
                    onClick={() => handleSetAnglePreset(deg)}
                    style={{
                      padding: '2px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1',
                      background: Math.abs(parseFloat(lineAngle) - deg) < 0.1 ? '#0284c7' : '#ffffff',
                      color: Math.abs(parseFloat(lineAngle) - deg) < 0.1 ? '#ffffff' : '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    {deg}°
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleReverseLineDirection}
                  title="Reverse direction (Swap Point 1 and Point 2)"
                  style={{
                    marginLeft: 'auto',
                    padding: '2px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '4px',
                    border: '1px solid #cbd5e1',
                    background: '#f1f5f9',
                    color: '#334155',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <ArrowRightLeft size={11} /> Reverse (P1 ↔ P2)
                </button>
              </div>

              {/* Point 1 (Start Point) Coordinates */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: '#f1f5f9', padding: '8px 10px', borderRadius: '4px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>
                  Start Point 1 (Anchor):
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <label style={{ fontSize: '10px', color: '#64748b' }}>X1 (mm):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={lineX1}
                      onChange={(e) => handleLineCoordChange('x1', e.target.value)}
                      style={{ padding: '3px 6px', borderRadius: '3px', border: '1px solid #cbd5e1', fontSize: '11.5px', fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <label style={{ fontSize: '10px', color: '#64748b' }}>Y1 (mm):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={lineY1}
                      onChange={(e) => handleLineCoordChange('y1', e.target.value)}
                      style={{ padding: '3px 6px', borderRadius: '3px', border: '1px solid #cbd5e1', fontSize: '11.5px', fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <label style={{ fontSize: '10px', color: '#64748b' }}>Z1 Elev (mm):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={lineZ1}
                      onChange={(e) => handleLineCoordChange('z1', e.target.value)}
                      style={{ padding: '3px 6px', borderRadius: '3px', border: '1px solid #cbd5e1', fontSize: '11.5px', fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Point 2 (End Point) Coordinates */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: '#f1f5f9', padding: '8px 10px', borderRadius: '4px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>
                  End Point 2:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <label style={{ fontSize: '10px', color: '#64748b' }}>X2 (mm):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={lineX2}
                      onChange={(e) => handleLineCoordChange('x2', e.target.value)}
                      style={{ padding: '3px 6px', borderRadius: '3px', border: '1px solid #cbd5e1', fontSize: '11.5px', fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <label style={{ fontSize: '10px', color: '#64748b' }}>Y2 (mm):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={lineY2}
                      onChange={(e) => handleLineCoordChange('y2', e.target.value)}
                      style={{ padding: '3px 6px', borderRadius: '3px', border: '1px solid #cbd5e1', fontSize: '11.5px', fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <label style={{ fontSize: '10px', color: '#64748b' }}>Z2 Elev (mm):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={lineZ2}
                      onChange={(e) => handleLineCoordChange('z2', e.target.value)}
                      style={{ padding: '3px 6px', borderRadius: '3px', border: '1px solid #cbd5e1', fontSize: '11.5px', fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Line Delta Readout & Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                  &Delta;X: <strong>{(parseFloat(lineX2) - parseFloat(lineX1)).toFixed(2)}</strong> | &Delta;Y: <strong>{(parseFloat(lineY2) - parseFloat(lineY1)).toFixed(2)}</strong> | &Delta;Z: <strong>{(parseFloat(lineZ2) - parseFloat(lineZ1)).toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {isLineModified && (
                    <button
                      type="button"
                      onClick={handleResetLine}
                      className="btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <RotateCcw size={12} /> Reset
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleApplyLineUpdate}
                    className="btn-primary"
                    disabled={!onUpdateEntity}
                    style={{
                      padding: '5px 14px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: '#0284c7',
                      color: '#ffffff',
                      cursor: onUpdateEntity ? 'pointer' : 'not-allowed'
                    }}
                  >
                    <Check size={14} /> Apply / Resize Line
                  </button>
                </div>
              </div>
            </div>
          )}
          <div style={{
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            padding: '10px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                {hasSelection ? 'Window-Selected Canvas Entities:' : 'Target CAD Entity:'}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0284c7' }}>
                {hasSelection ? `${selSummary.count} Selected (${selSummary.label})` : currentProjectName}
              </div>
              {hasSelection && selSummary.totalLengthMm > 0 && (
                <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
                  Total Selected Wireframe Length: <strong>{selSummary.totalLengthMm} mm</strong>
                </div>
              )}
            </div>
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#059669',
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
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px' }}>
              <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Dimensions (X x Y x Z)</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                {dim.x} &times; {dim.y} &times; {dim.z}
              </div>
              <div style={{ fontSize: '10px', color: '#0284c7', marginTop: '2px' }}>Millimeters (G21)</div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px' }}>
              <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Displacement Volume</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#059669', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                {volume.toLocaleString()} cm³
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Area: {area.toLocaleString()} mm²</div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px' }}>
              <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Surface Tessellation</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#7c3aed', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                {triangles.toLocaleString()}
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Triangles / Facets</div>
            </div>
          </div>

          {/* Center of Gravity & Mass Table */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '8px' }}>
                <Compass size={14} color="#0284c7" />
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#0284c7' }}>CENTER OF MASS (G54 DATUM)</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>X Centroid:</span>
                  <span style={{ color: '#0f172a', fontWeight: 600 }}>{center.x} mm</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Y Centroid:</span>
                  <span style={{ color: '#0f172a', fontWeight: 600 }}>{center.y} mm</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Z Centroid:</span>
                  <span style={{ color: '#0f172a', fontWeight: 600 }}>{center.z} mm</span>
                </div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '8px' }}>
                <Scale size={14} color="#d97706" />
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#d97706' }}>ESTIMATED MASS BY ALLOY</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Alu 6061-T6 (2.70 g/cm³):</span>
                  <span style={{ color: '#0284c7', fontWeight: 600 }}>{massAlu} kg</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Steel 4140 (7.85 g/cm³):</span>
                  <span style={{ color: '#d97706', fontWeight: 600 }}>{massSteel} kg</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Configured Stock:</span>
                  <span style={{ color: '#059669', fontWeight: 600 }}>{stockConfig.material} ({stockConfig.massKg} kg)</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
            <button className="btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
