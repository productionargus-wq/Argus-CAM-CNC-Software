import React, { useState, useEffect, useRef } from 'react';
import {
  X, Scissors, FileText, CheckCircle2, Crosshair, Plus, Trash2,
  Eye, Compass, Sparkles, Sliders, Disc, CornerDownRight, Tag
} from 'lucide-react';
import {
  create3DLinearDimension,
  create3DRadialDimension,
  create3DDatumLeaderNote
} from '../utils/cadGeometry';

export default function DraftingCADModal({
  isOpen,
  onClose,
  initialTab = 'linear',
  partMetrics,
  customGeometry = [],
  layerVisibility,
  onToggleLayer,
  onAddCustomEntity,
  onRemoveCustomEntity,
  onClearDimensions
}) {
  const dialogRef = useRef(null);
  const [activeTab, setActiveTab] = useState(initialTab);

  // Linear dimension state
  const [linearPreset, setLinearPreset] = useState('x');
  const [tolerance, setTolerance] = useState('none');
  const [customP1, setCustomP1] = useState({ x: -40, y: 0, z: 0 });
  const [customP2, setCustomP2] = useState({ x: 40, y: 0, z: 0 });

  // Radial dimension state
  const [radialType, setRadialType] = useState('radius');
  const [radialValue, setRadialValue] = useState(15);
  const [radialCenter, setRadialCenter] = useState({ x: 0, y: 35, z: 0 });

  // Datum tag state
  const [datumTag, setDatumTag] = useState('G54');
  const [datumNote, setDatumNote] = useState('X0.00 Y0.00 Z0.00 - Master Part Datum');
  const [datumPoint, setDatumPoint] = useState({ x: 0, y: 35, z: 0 });

  // Leader note state
  const [leaderText, setLeaderText] = useState('M8x1.25 Tap - 4 Holes Thru');
  const [leaderPoint, setLeaderPoint] = useState({ x: 20, y: 35, z: 15 });

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

  const dim = partMetrics?.dimensions || { x: 100, y: 35, z: 80 };
  const bounds = partMetrics?.box || {
    min: { x: -50, y: 0, z: -40 },
    max: { x: 50, y: 35, z: 40 }
  };

  // Filter drafting dimensions from customGeometry
  const draftingEntities = customGeometry.filter(
    (item) => item.name?.startsWith('Drafting_')
  );

  // 1. Create Linear Dimension
  const handleCreateLinear = () => {
    if (!onAddCustomEntity) return;
    let p1, p2, val, label;

    const tolText =
      tolerance === 'p02'
        ? ' ±0.02'
        : tolerance === 'p05'
        ? ' ±0.05'
        : tolerance === 'p1'
        ? ' ±0.10'
        : tolerance === 'h7'
        ? ' H7'
        : '';

    const offset = 14;

    if (linearPreset === 'x') {
      p1 = [bounds.min.x, bounds.min.y, bounds.max.z + offset];
      p2 = [bounds.max.x, bounds.min.y, bounds.max.z + offset];
      val = dim.x;
      label = `X ${val.toFixed(2)}${tolText}`;
    } else if (linearPreset === 'y') {
      p1 = [bounds.max.x + offset, bounds.min.y, bounds.max.z + offset];
      p2 = [bounds.max.x + offset, bounds.max.y, bounds.max.z + offset];
      val = dim.y;
      label = `Y ${val.toFixed(2)}${tolText}`;
    } else if (linearPreset === 'z') {
      p1 = [bounds.max.x + offset, bounds.min.y, bounds.min.z];
      p2 = [bounds.max.x + offset, bounds.min.y, bounds.max.z];
      val = dim.z;
      label = `Z ${val.toFixed(2)}${tolText}`;
    } else {
      p1 = [parseFloat(customP1.x) || 0, parseFloat(customP1.y) || 0, parseFloat(customP1.z) || 0];
      p2 = [parseFloat(customP2.x) || 0, parseFloat(customP2.y) || 0, parseFloat(customP2.z) || 0];
      const dx = p2[0] - p1[0];
      const dy = p2[1] - p1[1];
      const dz = p2[2] - p1[2];
      val = Math.sqrt(dx * dx + dy * dy + dz * dz);
      label = `L ${val.toFixed(2)}${tolText}`;
    }

    const entity = create3DLinearDimension(p1, p2, label, {
      name: `Drafting_Linear_${Date.now()}`
    });

    onAddCustomEntity(entity);
    if (onToggleLayer && !layerVisibility?.dimensions) {
      onToggleLayer('dimensions');
    }
    setFeedback(`Created Linear Dimension: "${label}" on Level 100`);
  };

  // 2. Create Radial Dimension
  const handleCreateRadial = () => {
    if (!onAddCustomEntity) return;
    const r = parseFloat(radialValue) || 10;
    const prefix = radialType === 'radius' ? 'R ' : 'Ø ';
    const dispVal = radialType === 'radius' ? r : r * 2;
    const label = `${prefix}${dispVal.toFixed(2)}`;

    const center = [
      parseFloat(radialCenter.x) || 0,
      parseFloat(radialCenter.y) || 0,
      parseFloat(radialCenter.z) || 0
    ];

    const entity = create3DRadialDimension(center, r, label, {
      name: `Drafting_Radial_${Date.now()}`
    });

    onAddCustomEntity(entity);
    if (onToggleLayer && !layerVisibility?.dimensions) {
      onToggleLayer('dimensions');
    }
    setFeedback(`Created Radial Callout: "${label}" on Level 100`);
  };

  // 3. Create Datum Note
  const handleCreateDatum = () => {
    if (!onAddCustomEntity) return;
    const p = [
      parseFloat(datumPoint.x) || 0,
      parseFloat(datumPoint.y) || 0,
      parseFloat(datumPoint.z) || 0
    ];

    const entity = create3DDatumLeaderNote(p, datumNote, datumTag, {
      name: `Drafting_Datum_${Date.now()}`
    });

    onAddCustomEntity(entity);
    if (onToggleLayer && !layerVisibility?.dimensions) {
      onToggleLayer('dimensions');
    }
    setFeedback(`Created WCS Datum Tag: "[${datumTag}] ${datumNote}" on Level 100`);
  };

  // 4. Create Leader Note
  const handleCreateLeader = () => {
    if (!onAddCustomEntity) return;
    const p = [
      parseFloat(leaderPoint.x) || 0,
      parseFloat(leaderPoint.y) || 0,
      parseFloat(leaderPoint.z) || 0
    ];

    const entity = create3DDatumLeaderNote(p, leaderText, 'NOTE', {
      name: `Drafting_Note_${Date.now()}`
    });

    onAddCustomEntity(entity);
    if (onToggleLayer && !layerVisibility?.dimensions) {
      onToggleLayer('dimensions');
    }
    setFeedback(`Created Operator Leader Note: "${leaderText}" on Level 100`);
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      aria-label="Drafting & 3D Annotations Suite"
      closedby="any"
    >
      <div className="modal-window" style={{ width: '740px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Scissors size={16} color="#38bdf8" />
            <span>Mastercam Drafting &bull; 3D Dimensions, GD&amp;T &amp; Shop Annotations (Level 100)</span>
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
            { id: 'linear', label: 'Linear Dimensions', icon: <Scissors size={13} /> },
            { id: 'radial', label: 'Radial / Diameter', icon: <Disc size={13} /> },
            { id: 'datum', label: 'WCS Datum Tags', icon: <Crosshair size={13} /> },
            { id: 'leader', label: 'Machining Notes', icon: <Tag size={13} /> },
            { id: 'manager', label: `Manager (${draftingEntities.length})`, icon: <FileText size={13} /> }
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
          
          {/* ================= 1. LINEAR DIMENSIONS ================= */}
          {activeTab === 'linear' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                background: '#141822',
                border: '1px solid #232c3d',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '11px',
                color: '#94a3b8'
              }}>
                Add 3D dimension arrows and tolerance callouts to the part solid. Dimensions are placed on Level 100 with billboard text that always faces the camera.
              </div>

              {/* Preset Selection */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#f8fafc', display: 'block', marginBottom: '8px' }}>
                  Select Dimension Axis / Preset:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'x', label: 'X Length', val: `${dim.x} mm`, desc: 'Horizontal Extents' },
                    { id: 'y', label: 'Y Height', val: `${dim.y} mm`, desc: 'Vertical Thickness' },
                    { id: 'z', label: 'Z Depth', val: `${dim.z} mm`, desc: 'Front-to-Back Depth' },
                    { id: 'custom', label: 'Custom 2 Pts', val: 'P1 -> P2', desc: 'Arbitrary 3D Vector' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setLinearPreset(p.id)}
                      style={{
                        padding: '10px',
                        background: linearPreset === p.id ? '#1e293b' : '#0e1218',
                        border: `1px solid ${linearPreset === p.id ? '#38bdf8' : '#232c3d'}`,
                        borderRadius: '4px',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontSize: '11px', fontWeight: 600, color: linearPreset === p.id ? '#38bdf8' : '#f8fafc' }}>
                        {p.label}
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                        {p.val}
                      </div>
                      <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tolerance Selector */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#f8fafc', display: 'block', marginBottom: '6px' }}>
                  Machining Tolerance Callout:
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'none', label: 'Nominal (No Tol)' },
                    { id: 'p02', label: '±0.02 mm (Precision)' },
                    { id: 'p05', label: '±0.05 mm (Standard Mill)' },
                    { id: 'p1', label: '±0.10 mm (Roughing)' },
                    { id: 'h7', label: 'H7 (+0.015 / -0.000)' }
                  ].map((tol) => (
                    <button
                      key={tol.id}
                      onClick={() => setTolerance(tol.id)}
                      style={{
                        padding: '5px 10px',
                        background: tolerance === tol.id ? '#1e293b' : '#0e1218',
                        border: `1px solid ${tolerance === tol.id ? '#38bdf8' : '#334155'}`,
                        borderRadius: '3px',
                        color: tolerance === tol.id ? '#38bdf8' : '#94a3b8',
                        fontSize: '10.5px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {tol.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Points Form if custom selected */}
              {linearPreset === 'custom' && (
                <div style={{ background: '#0e1218', border: '1px solid #1f2737', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#f8fafc', marginBottom: '8px' }}>Custom Point Coordinates (XYZ mm):</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: '#38bdf8', marginBottom: '4px' }}>Point 1 (Start):</div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <input type="number" placeholder="X" value={customP1.x} onChange={(e) => setCustomP1({ ...customP1, x: e.target.value })} style={{ width: '33%', padding: '4px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#fff', fontSize: '10px' }} />
                        <input type="number" placeholder="Y" value={customP1.y} onChange={(e) => setCustomP1({ ...customP1, y: e.target.value })} style={{ width: '33%', padding: '4px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#fff', fontSize: '10px' }} />
                        <input type="number" placeholder="Z" value={customP1.z} onChange={(e) => setCustomP1({ ...customP1, z: e.target.value })} style={{ width: '33%', padding: '4px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#fff', fontSize: '10px' }} />
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: '#10b981', marginBottom: '4px' }}>Point 2 (End):</div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <input type="number" placeholder="X" value={customP2.x} onChange={(e) => setCustomP2({ ...customP2, x: e.target.value })} style={{ width: '33%', padding: '4px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#fff', fontSize: '10px' }} />
                        <input type="number" placeholder="Y" value={customP2.y} onChange={(e) => setCustomP2({ ...customP2, y: e.target.value })} style={{ width: '33%', padding: '4px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#fff', fontSize: '10px' }} />
                        <input type="number" placeholder="Z" value={customP2.z} onChange={(e) => setCustomP2({ ...customP2, z: e.target.value })} style={{ width: '33%', padding: '4px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#fff', fontSize: '10px' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleCreateLinear}
                className="btn-primary"
                style={{ padding: '9px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}
              >
                <Plus size={14} />
                <span>Add 3D Linear Dimension to Level 100</span>
              </button>
            </div>
          )}

          {/* ================= 2. RADIAL / DIAMETER ================= */}
          {activeTab === 'radial' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                background: '#141822',
                border: '1px solid #232c3d',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '11px',
                color: '#94a3b8'
              }}>
                Call out cylinder radii, hole bores, or boss diameters with 3D leader arrows and text tags.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: '#0e1218', border: '1px solid #1f2737', borderRadius: '6px', padding: '12px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#f8fafc', display: 'block', marginBottom: '6px' }}>
                    Callout Type:
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setRadialType('radius')}
                      style={{
                        flex: 1,
                        padding: '8px',
                        background: radialType === 'radius' ? '#1e293b' : '#141822',
                        border: `1px solid ${radialType === 'radius' ? '#f59e0b' : '#334155'}`,
                        borderRadius: '4px',
                        color: radialType === 'radius' ? '#f59e0b' : '#94a3b8',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Radius (R)
                    </button>
                    <button
                      onClick={() => setRadialType('diameter')}
                      style={{
                        flex: 1,
                        padding: '8px',
                        background: radialType === 'diameter' ? '#1e293b' : '#141822',
                        border: `1px solid ${radialType === 'diameter' ? '#f59e0b' : '#334155'}`,
                        borderRadius: '4px',
                        color: radialType === 'diameter' ? '#f59e0b' : '#94a3b8',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Diameter (&Oslash;)
                    </button>
                  </div>

                  <div style={{ marginTop: '12px' }}>
                    <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                      Radius Value (mm):
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={radialValue}
                      onChange={(e) => setRadialValue(e.target.value)}
                      style={{ width: '100%', padding: '7px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#f8fafc', fontSize: '12px' }}
                    />
                  </div>
                </div>

                <div style={{ background: '#0e1218', border: '1px solid #1f2737', borderRadius: '6px', padding: '12px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#f8fafc', display: 'block', marginBottom: '6px' }}>
                    Center Point Coordinates (XYZ mm):
                  </label>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                    <input type="number" placeholder="X" value={radialCenter.x} onChange={(e) => setRadialCenter({ ...radialCenter, x: e.target.value })} style={{ width: '33%', padding: '6px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#fff', fontSize: '11px' }} />
                    <input type="number" placeholder="Y" value={radialCenter.y} onChange={(e) => setRadialCenter({ ...radialCenter, y: e.target.value })} style={{ width: '33%', padding: '6px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#fff', fontSize: '11px' }} />
                    <input type="number" placeholder="Z" value={radialCenter.z} onChange={(e) => setRadialCenter({ ...radialCenter, z: e.target.value })} style={{ width: '33%', padding: '6px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#fff', fontSize: '11px' }} />
                  </div>

                  <div style={{ marginTop: '14px', fontSize: '10px', color: '#94a3b8' }}>
                    Preview Label: <strong style={{ color: '#f59e0b' }}>{radialType === 'radius' ? `R ${parseFloat(radialValue || 0).toFixed(2)}` : `Ø ${(parseFloat(radialValue || 0) * 2).toFixed(2)}`}</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCreateRadial}
                className="btn-primary"
                style={{ padding: '9px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Plus size={14} />
                <span>Add Radial / Diametral Callout</span>
              </button>
            </div>
          )}

          {/* ================= 3. WCS DATUM TAGS ================= */}
          {activeTab === 'datum' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                background: '#141822',
                border: '1px solid #232c3d',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '11px',
                color: '#94a3b8'
              }}>
                Tag critical fixture datums (G54, G55, G56, Primary Datum -A-, -B-) with 3D leader arrows and coordinate callouts.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#f8fafc', display: 'block', marginBottom: '6px' }}>
                    Datum Code:
                  </label>
                  <select
                    value={datumTag}
                    onChange={(e) => setDatumTag(e.target.value)}
                    style={{ width: '100%', padding: '7px', background: '#0e1218', border: '1px solid #334155', borderRadius: '4px', color: '#38bdf8', fontSize: '12px', fontWeight: 700 }}
                  >
                    <option value="G54">G54 (Primary)</option>
                    <option value="G55">G55 (Fixture 2)</option>
                    <option value="G56">G56 (Rotary A)</option>
                    <option value="Datum -A-">Datum -A-</option>
                    <option value="Datum -B-">Datum -B-</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#f8fafc', display: 'block', marginBottom: '6px' }}>
                    Datum Description / Coordinate Note:
                  </label>
                  <input
                    type="text"
                    value={datumNote}
                    onChange={(e) => setDatumNote(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', background: '#0e1218', border: '1px solid #334155', borderRadius: '4px', color: '#f8fafc', fontSize: '12px' }}
                  />
                </div>
              </div>

              <div style={{ background: '#0e1218', border: '1px solid #1f2737', borderRadius: '6px', padding: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#f8fafc', display: 'block', marginBottom: '6px' }}>
                  Datum Target Coordinates (XYZ mm):
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="number" placeholder="X" value={datumPoint.x} onChange={(e) => setDatumPoint({ ...datumPoint, x: e.target.value })} style={{ width: '33%', padding: '6px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#fff', fontSize: '11px' }} />
                  <input type="number" placeholder="Y" value={datumPoint.y} onChange={(e) => setDatumPoint({ ...datumPoint, y: e.target.value })} style={{ width: '33%', padding: '6px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#fff', fontSize: '11px' }} />
                  <input type="number" placeholder="Z" value={datumPoint.z} onChange={(e) => setDatumPoint({ ...datumPoint, z: e.target.value })} style={{ width: '33%', padding: '6px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#fff', fontSize: '11px' }} />
                </div>
              </div>

              <button
                onClick={handleCreateDatum}
                className="btn-primary"
                style={{ padding: '9px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Crosshair size={14} />
                <span>Add WCS Datum Callout</span>
              </button>
            </div>
          )}

          {/* ================= 4. MACHINING LEADER NOTES ================= */}
          {activeTab === 'leader' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                background: '#141822',
                border: '1px solid #232c3d',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '11px',
                color: '#94a3b8'
              }}>
                Attach manufacturing instructions directly to CAD surfaces for the machine operator.
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#f8fafc', display: 'block', marginBottom: '6px' }}>
                  Leader Note Text:
                </label>
                <input
                  type="text"
                  value={leaderText}
                  onChange={(e) => setLeaderText(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', background: '#0e1218', border: '1px solid #334155', borderRadius: '4px', color: '#f8fafc', fontSize: '12px' }}
                />
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {[
                    'M10x1.5 Tap Thru - 4X',
                    'Surface Finish Ra 0.8',
                    'C-Bore Ø16 x 10 Deep',
                    'Vise Clamping Zone'
                  ].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setLeaderText(preset)}
                      style={{ padding: '3px 8px', background: '#1e293b', border: '1px solid #334155', borderRadius: '3px', color: '#38bdf8', fontSize: '9.5px', cursor: 'pointer' }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ background: '#0e1218', border: '1px solid #1f2737', borderRadius: '6px', padding: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#f8fafc', display: 'block', marginBottom: '6px' }}>
                  Leader Arrow Anchor Point (XYZ mm):
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="number" placeholder="X" value={leaderPoint.x} onChange={(e) => setLeaderPoint({ ...leaderPoint, x: e.target.value })} style={{ width: '33%', padding: '6px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#fff', fontSize: '11px' }} />
                  <input type="number" placeholder="Y" value={leaderPoint.y} onChange={(e) => setLeaderPoint({ ...leaderPoint, y: e.target.value })} style={{ width: '33%', padding: '6px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#fff', fontSize: '11px' }} />
                  <input type="number" placeholder="Z" value={leaderPoint.z} onChange={(e) => setLeaderPoint({ ...leaderPoint, z: e.target.value })} style={{ width: '33%', padding: '6px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#fff', fontSize: '11px' }} />
                </div>
              </div>

              <button
                onClick={handleCreateLeader}
                className="btn-primary"
                style={{ padding: '9px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Tag size={14} />
                <span>Add Machining Leader Note</span>
              </button>
            </div>
          )}

          {/* ================= 5. DRAFTING ENTITY MANAGER ================= */}
          {activeTab === 'manager' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>
                  Active Drafting Entities on Level 100 ({draftingEntities.length}):
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => onToggleLayer && onToggleLayer('dimensions')}
                    className="btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Eye size={12} />
                    {layerVisibility?.dimensions ? 'Hide Level 100' : 'Show Level 100'}
                  </button>
                  <button
                    onClick={onClearDimensions}
                    className="btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '10px', color: '#f43f5e', borderColor: '#e11d4844' }}
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '280px', overflowY: 'auto' }}>
                {draftingEntities.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '11px', background: '#0e1218', borderRadius: '6px', border: '1px dashed #232c3d' }}>
                    No 3D drafting dimensions or annotations on Level 100 yet. Use the tabs above to add linear dimensions, radial callouts, or WCS datum notes.
                  </div>
                ) : (
                  draftingEntities.map((ent, idx) => (
                    <div
                      key={ent.name || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: '#0e1218',
                        border: '1px solid #1f2737',
                        borderRadius: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Scissors size={14} color="#38bdf8" />
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: '#f8fafc' }}>
                            {ent.userData?.text || ent.userData?.noteText || ent.name}
                          </div>
                          <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>
                            Type: {ent.userData?.type || 'Dimension'} &bull; Level 100
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => onRemoveCustomEntity && onRemoveCustomEntity(ent)}
                        style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '4px' }}
                        title="Delete Dimension"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ borderTop: '1px solid #1f2737', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '10px', color: '#94a3b8' }}>
            Level 100 dimensions are saved into your Mastercam .mcam project file.
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
