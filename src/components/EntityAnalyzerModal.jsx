import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { X, Ruler, Box, Scale, Compass, CheckCircle2, Circle, Check, RotateCcw } from 'lucide-react';
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
    }
  }, [singleEntity, isOpen]);

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

          {/* Active File Banner */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #2d3545',
            borderRadius: '6px',
            padding: '10px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                {hasSelection ? 'Window-Selected Canvas Entities:' : 'Target CAD Entity:'}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8' }}>
                {hasSelection ? `${selSummary.count} Selected (${selSummary.label})` : currentProjectName}
              </div>
              {hasSelection && selSummary.totalLengthMm > 0 && (
                <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
                  Total Selected Wireframe Length: <strong>{selSummary.totalLengthMm} mm</strong>
                </div>
              )}
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
            <div style={{ background: '#f8fafc', border: '1px solid #242c3d', borderRadius: '6px', padding: '10px' }}>
              <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Dimensions (X x Y x Z)</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                {dim.x} &times; {dim.y} &times; {dim.z}
              </div>
              <div style={{ fontSize: '10px', color: '#38bdf8', marginTop: '2px' }}>Millimeters (G21)</div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #242c3d', borderRadius: '6px', padding: '10px' }}>
              <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Displacement Volume</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#10b981', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                {volume.toLocaleString()} cm³
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>Area: {area.toLocaleString()} mm²</div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #242c3d', borderRadius: '6px', padding: '10px' }}>
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
                  <span style={{ color: '#0f172a', fontWeight: 600 }}>{center.x} mm</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Y Centroid:</span>
                  <span style={{ color: '#0f172a', fontWeight: 600 }}>{center.y} mm</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Z Centroid:</span>
                  <span style={{ color: '#0f172a', fontWeight: 600 }}>{center.z} mm</span>
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
