import React, { useEffect, useRef, useState } from 'react';
import { X, Box, Check, RefreshCw, Circle, Cylinder, Square, HelpCircle } from 'lucide-react';

export default function StockSetupModal({
  isOpen,
  onClose,
  partMetrics,
  stockConfig,
  onUpdateStock,
  unitSystem = 'metric',
  onUpdateUnitSystem
}) {
  const dialogRef = useRef(null);

  // Active Unit: 'metric' (mm) vs 'imperial' (inch)
  const [activeUnit, setActiveUnit] = useState(unitSystem || 'metric');

  // Stock Shape: 'box' | 'cylinder' | 'tube' | 'solid'
  const [shape, setShape] = useState(stockConfig?.shape || 'box');

  // Cylinder / Tube Axis: 'X' | 'Y' | 'Z'
  const [axis, setAxis] = useState(stockConfig?.axis || 'X');

  // Part dimensions state (editable)
  const [dimX, setDimX] = useState(partMetrics?.dimensions?.x || 145);
  const [dimY, setDimY] = useState(partMetrics?.dimensions?.y || 70);
  const [dimZ, setDimZ] = useState(partMetrics?.dimensions?.z || 56);

  // Allowances state (editable)
  const [allowanceTop, setAllowanceTop] = useState(stockConfig?.allowanceTop ?? 2.0);
  const [allowanceSides, setAllowanceSides] = useState(stockConfig?.allowanceSides ?? 4.0);

  // Cylindrical parameters
  const [cylDiameter, setCylDiameter] = useState(70);
  const [cylLength, setCylLength] = useState(145);
  const [tubeInnerDia, setTubeInnerDia] = useState(30);

  // Material and WCS
  const [material, setMaterial] = useState(stockConfig?.material || 'Alu 6061-T6');
  const [originPoint, setOriginPoint] = useState(stockConfig?.originPoint || 'top-center');

  // Sync with partMetrics when opening or when part changes
  useEffect(() => {
    if (partMetrics?.dimensions) {
      const isInch = activeUnit === 'imperial';
      const factor = isInch ? 1 / 25.4 : 1;
      const dx = Number((partMetrics.dimensions.x * factor).toFixed(3));
      const dy = Number((partMetrics.dimensions.y * factor).toFixed(3));
      const dz = Number((partMetrics.dimensions.z * factor).toFixed(3));
      setDimX(dx);
      setDimY(dy);
      setDimZ(dz);

      // Auto-compute cylindrical diameter and length based on selected axis
      if (axis === 'X') {
        setCylDiameter(Math.max(dy, dz));
        setCylLength(dx);
      } else if (axis === 'Y') {
        setCylDiameter(Math.max(dx, dz));
        setCylLength(dy);
      } else {
        setCylDiameter(Math.max(dx, dy));
        setCylLength(dz);
      }
    }
  }, [partMetrics, isOpen]);

  // Handle Unit Switch (Metric <-> Imperial) with dynamic conversion
  const handleUnitToggle = (newUnit) => {
    if (newUnit === activeUnit) return;
    const toInch = newUnit === 'imperial';
    const conv = toInch ? 1 / 25.4 : 25.4;
    const precision = toInch ? 3 : 1;

    setDimX((prev) => Number((Number(prev) * conv).toFixed(precision)));
    setDimY((prev) => Number((Number(prev) * conv).toFixed(precision)));
    setDimZ((prev) => Number((Number(prev) * conv).toFixed(precision)));
    setAllowanceTop((prev) => Number((Number(prev) * conv).toFixed(precision)));
    setAllowanceSides((prev) => Number((Number(prev) * conv).toFixed(precision)));
    setCylDiameter((prev) => Number((Number(prev) * conv).toFixed(precision)));
    setCylLength((prev) => Number((Number(prev) * conv).toFixed(precision)));
    setTubeInnerDia((prev) => Number((Number(prev) * conv).toFixed(precision)));

    setActiveUnit(newUnit);
    if (onUpdateUnitSystem) {
      onUpdateUnitSystem(newUnit);
    }
  };

  // Re-read and fit exact dimensions from 3D model
  const handleAutoFitFromSolid = () => {
    if (partMetrics?.dimensions) {
      const isInch = activeUnit === 'imperial';
      const factor = isInch ? 1 / 25.4 : 1;
      const precision = isInch ? 3 : 1;
      const dx = Number((partMetrics.dimensions.x * factor).toFixed(precision));
      const dy = Number((partMetrics.dimensions.y * factor).toFixed(precision));
      const dz = Number((partMetrics.dimensions.z * factor).toFixed(precision));
      setDimX(dx);
      setDimY(dy);
      setDimZ(dz);

      if (axis === 'X') {
        setCylDiameter(Number((Math.max(dy, dz) + allowanceSides * 2).toFixed(precision)));
        setCylLength(Number((dx + allowanceTop * 2).toFixed(precision)));
      } else if (axis === 'Y') {
        setCylDiameter(Number((Math.max(dx, dz) + allowanceSides * 2).toFixed(precision)));
        setCylLength(Number((dy + allowanceTop * 2).toFixed(precision)));
      } else {
        setCylDiameter(Number((Math.max(dx, dy) + allowanceSides * 2).toFixed(precision)));
        setCylLength(Number((dz + allowanceTop * 2).toFixed(precision)));
      }
    }
  };

  // Materials and densities (metric: g/cm³, imperial: lbs/in³)
  const materials = [
    { name: 'Alu 6061-T6', densityMetric: 2.7, densityImperial: 0.0975 },
    { name: 'Steel 4140', densityMetric: 7.85, densityImperial: 0.2836 },
    { name: 'Stainless 304', densityMetric: 8.0, densityImperial: 0.289 },
    { name: 'Brass C360', densityMetric: 8.5, densityImperial: 0.307 },
    { name: 'Delrin / POM', densityMetric: 1.41, densityImperial: 0.0509 }
  ];

  const isMetric = activeUnit === 'metric';
  const unitLabel = isMetric ? 'mm' : 'in';
  const massUnit = isMetric ? 'kg' : 'lbs';
  const volUnit = isMetric ? 'cm³' : 'in³';

  // Calculated Raw Stock dimensions
  const numDimX = Number(dimX) || 0;
  const numDimY = Number(dimY) || 0;
  const numDimZ = Number(dimZ) || 0;
  const numTop = Number(allowanceTop) || 0;
  const numSides = Number(allowanceSides) || 0;

  let rawX = 0, rawY = 0, rawZ = 0;
  let stockVol = 0;

  if (shape === 'box' || shape === 'solid') {
    rawX = Number((numDimX + numSides * 2).toFixed(isMetric ? 1 : 3));
    rawY = Number((numDimY + numTop).toFixed(isMetric ? 1 : 3));
    rawZ = Number((numDimZ + numSides * 2).toFixed(isMetric ? 1 : 3));
    stockVol = isMetric ? (rawX * rawY * rawZ) / 1000 : rawX * rawY * rawZ;
  } else if (shape === 'cylinder') {
    const d = Number(cylDiameter) || (Math.max(numDimY, numDimZ) + numSides * 2);
    const l = Number(cylLength) || (numDimX + numTop * 2);
    rawX = d;
    rawY = l;
    rawZ = d;
    const r = d / 2;
    const crossArea = Math.PI * r * r;
    stockVol = isMetric ? (crossArea * l) / 1000 : crossArea * l;
  } else if (shape === 'tube') {
    const od = Number(cylDiameter) || (Math.max(numDimY, numDimZ) + numSides * 2);
    const id = Number(tubeInnerDia) || 0;
    const l = Number(cylLength) || (numDimX + numTop * 2);
    rawX = od;
    rawY = l;
    rawZ = od;
    const outerR = od / 2;
    const innerR = id / 2;
    const crossArea = Math.PI * (outerR * outerR - innerR * innerR);
    stockVol = isMetric ? (crossArea * l) / 1000 : Math.max(0, crossArea * l);
  }

  const selectedMatObj = materials.find((m) => m.name === material) || materials[0];
  const density = isMetric ? selectedMatObj.densityMetric : selectedMatObj.densityImperial;
  const stockMass = isMetric
    ? ((stockVol * density) / 1000).toFixed(2)
    : (stockVol * density).toFixed(2);

  // Dialog Backdrop and Escape
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

  const handleApply = () => {
    // If in imperial, convert rawDimensions to metric internally for 3D engine consistency
    const toMm = isMetric ? 1 : 25.4;
    onUpdateStock({
      shape,
      axis,
      units: activeUnit,
      allowanceTop: Number(allowanceTop) * toMm,
      allowanceSides: Number(allowanceSides) * toMm,
      material,
      originPoint,
      diameter: Number(cylDiameter) * toMm,
      innerDiameter: Number(tubeInnerDia) * toMm,
      length: Number(cylLength) * toMm,
      rawDimensions: {
        x: Number((rawX * toMm).toFixed(2)),
        y: Number((rawY * toMm).toFixed(2)),
        z: Number((rawZ * toMm).toFixed(2))
      },
      dimensions: {
        x: Number((numDimX * toMm).toFixed(2)),
        y: Number((numDimY * toMm).toFixed(2)),
        z: Number((numDimZ * toMm).toFixed(2))
      },
      massKg: isMetric ? stockMass : (Number(stockMass) * 0.453592).toFixed(2)
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
      <div className="modal-window" style={{ width: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Box size={16} color="#f59e0b" />
            <span id="stock-setup-title" style={{ fontWeight: 600 }}>Stock Setup & Raw Material Definition</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close Dialog">
            <X size={15} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Top Bar: Shape Selection & Units Selector */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
            {/* Shape Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#475569', fontWeight: 700, letterSpacing: '0.5px' }}>Stock Shape:</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShape('box')}
                  className={`btn-secondary ${shape === 'box' ? 'active-shape' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 12px',
                    fontSize: '11px',
                    fontWeight: shape === 'box' ? 600 : 500,
                    backgroundColor: shape === 'box' ? '#0284c7' : '#ffffff',
                    color: shape === 'box' ? '#ffffff' : '#334155',
                    border: shape === 'box' ? '1px solid #0284c7' : '1px solid #cbd5e1',
                    borderRadius: '4px',
                    boxShadow: shape === 'box' ? '0 1px 2px rgba(2, 132, 199, 0.25)' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Square size={13} />
                  <span>Rectangular Box</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShape('cylinder')}
                  className={`btn-secondary ${shape === 'cylinder' ? 'active-shape' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 12px',
                    fontSize: '11px',
                    fontWeight: shape === 'cylinder' ? 600 : 500,
                    backgroundColor: shape === 'cylinder' ? '#0284c7' : '#ffffff',
                    color: shape === 'cylinder' ? '#ffffff' : '#334155',
                    border: shape === 'cylinder' ? '1px solid #0284c7' : '1px solid #cbd5e1',
                    borderRadius: '4px',
                    boxShadow: shape === 'cylinder' ? '0 1px 2px rgba(2, 132, 199, 0.25)' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Circle size={13} />
                  <span>Cylinder</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShape('tube')}
                  className={`btn-secondary ${shape === 'tube' ? 'active-shape' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 12px',
                    fontSize: '11px',
                    fontWeight: shape === 'tube' ? 600 : 500,
                    backgroundColor: shape === 'tube' ? '#0284c7' : '#ffffff',
                    color: shape === 'tube' ? '#ffffff' : '#334155',
                    border: shape === 'tube' ? '1px solid #0284c7' : '1px solid #cbd5e1',
                    borderRadius: '4px',
                    boxShadow: shape === 'tube' ? '0 1px 2px rgba(2, 132, 199, 0.25)' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Circle size={13} style={{ strokeDasharray: '2,2' }} />
                  <span>Tube / Pipe</span>
                </button>
              </div>
            </div>

            {/* Units Segmented Switcher */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#475569', fontWeight: 700, letterSpacing: '0.5px' }}>Unit System:</span>
              <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '4px', padding: '2px', border: '1px solid #cbd5e1' }}>
                <button
                  type="button"
                  onClick={() => handleUnitToggle('metric')}
                  style={{
                    padding: '4px 12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '3px',
                    border: 'none',
                    backgroundColor: isMetric ? '#0284c7' : 'transparent',
                    color: isMetric ? '#ffffff' : '#475569',
                    boxShadow: isMetric ? '0 1px 2px rgba(2, 132, 199, 0.25)' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  Metric (mm)
                </button>
                <button
                  type="button"
                  onClick={() => handleUnitToggle('imperial')}
                  style={{
                    padding: '4px 12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '3px',
                    border: 'none',
                    backgroundColor: !isMetric ? '#0284c7' : 'transparent',
                    color: !isMetric ? '#ffffff' : '#475569',
                    boxShadow: !isMetric ? '0 1px 2px rgba(2, 132, 199, 0.25)' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  Imperial (inch)
                </button>
              </div>
            </div>
          </div>

          {/* Section 1: Part Bounding Box & Dimensions (Fully Editable + Auto-fit) */}
          <div className="nc2check-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div className="section-label">PART GEOMETRY & BOUNDING DIMENSIONS</div>
              <button
                type="button"
                onClick={handleAutoFitFromSolid}
                className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '2px 8px', height: '24px' }}
                title="Reset / pull exact dimensions from loaded 3D CAD Solid"
              >
                <RefreshCw size={12} />
                <span>Auto-Fit from Solid</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div className="form-group">
                <label>Part Length (X):</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="number"
                    step={isMetric ? "0.5" : "0.02"}
                    className="text-input"
                    value={dimX}
                    onChange={(e) => setDimX(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: '11px', color: '#94a3b8', width: '22px' }}>{unitLabel}</span>
                </div>
              </div>

              <div className="form-group">
                <label>Part Height (Y):</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="number"
                    step={isMetric ? "0.5" : "0.02"}
                    className="text-input"
                    value={dimY}
                    onChange={(e) => setDimY(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: '11px', color: '#94a3b8', width: '22px' }}>{unitLabel}</span>
                </div>
              </div>

              <div className="form-group">
                <label>Part Width (Z):</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="number"
                    step={isMetric ? "0.5" : "0.02"}
                    className="text-input"
                    value={dimZ}
                    onChange={(e) => setDimZ(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: '11px', color: '#94a3b8', width: '22px' }}>{unitLabel}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Shape-Specific Raw Stock Definition */}
          {shape === 'box' || shape === 'solid' ? (
            <div className="nc2check-section">
              <div className="section-label">PRISMATIC STOCK ALLOWANCES</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div className="form-group">
                  <label>Top Face Allowance (+Y):</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      step={isMetric ? "0.5" : "0.02"}
                      className="text-input"
                      value={allowanceTop}
                      onChange={(e) => setAllowanceTop(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <span style={{ fontSize: '11px', color: '#94a3b8', width: '22px' }}>{unitLabel}</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Sides Allowance (&plusmn; X, Z):</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      step={isMetric ? "0.5" : "0.02"}
                      className="text-input"
                      value={allowanceSides}
                      onChange={(e) => setAllowanceSides(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <span style={{ fontSize: '11px', color: '#94a3b8', width: '22px' }}>{unitLabel}</span>
                  </div>
                </div>
              </div>

              {/* Calculated Raw Stock Block Result */}
              <div style={{ background: '#f0f9ff', padding: '8px 12px', borderRadius: '4px', border: '1px solid #bae6fd', marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: '12px', color: '#0369a1' }}>
                  <span>RAW STOCK BLOCK:</span>
                  <span style={{ fontWeight: 700, color: '#0284c7' }}>{rawX} &times; {rawY} &times; {rawZ} {unitLabel}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="nc2check-section">
              <div className="section-label">
                {shape === 'cylinder' ? 'CYLINDRICAL / ROUND BAR STOCK DEFINITION' : 'TUBULAR / HOLLOW STOCK DEFINITION'}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '8px' }}>
                <div className="form-group">
                  <label>Cylinder Alignment Axis:</label>
                  <select value={axis} onChange={(e) => setAxis(e.target.value)} className="text-input">
                    <option value="X">Along X-Axis</option>
                    <option value="Y">Along Y-Axis</option>
                    <option value="Z">Along Z-Axis (Vertical)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Outer Diameter (&empty; OD):</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      step={isMetric ? "0.5" : "0.02"}
                      className="text-input"
                      value={cylDiameter}
                      onChange={(e) => setCylDiameter(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <span style={{ fontSize: '11px', color: '#94a3b8', width: '22px' }}>{unitLabel}</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Total Length (L):</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      step={isMetric ? "0.5" : "0.02"}
                      className="text-input"
                      value={cylLength}
                      onChange={(e) => setCylLength(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <span style={{ fontSize: '11px', color: '#94a3b8', width: '22px' }}>{unitLabel}</span>
                  </div>
                </div>
              </div>

              {shape === 'tube' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '8px' }}>
                  <div className="form-group">
                    <label>Inner Bore Diameter (&empty; ID):</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        step={isMetric ? "0.5" : "0.02"}
                        className="text-input"
                        value={tubeInnerDia}
                        onChange={(e) => setTubeInnerDia(e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <span style={{ fontSize: '11px', color: '#94a3b8', width: '22px' }}>{unitLabel}</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Wall Thickness (Calculated):</label>
                    <input
                      type="text"
                      readOnly
                      className="text-input"
                      value={`${((Number(cylDiameter) - Number(tubeInnerDia)) / 2).toFixed(isMetric ? 1 : 3)} ${unitLabel}`}
                    />
                  </div>
                </div>
              )}

              {/* Calculated Cylindrical Raw Stock Result */}
              <div style={{ background: '#f0f9ff', padding: '8px 12px', borderRadius: '4px', border: '1px solid #bae6fd' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: '12px', color: '#0369a1' }}>
                  <span>ROUND STOCK BAR:</span>
                  <span style={{ fontWeight: 700, color: '#0284c7' }}>
                    &empty;{cylDiameter} &times; {cylLength} {unitLabel} (Axis: {axis})
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Material & WCS Origin Picker */}
          <div className="nc2check-section">
            <div className="section-label">MATERIAL & WCS (G54) ORIGIN SELECTION</div>
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
                        {m.name} ({isMetric ? `${m.densityMetric} g/cm³` : `${m.densityImperial} lbs/in³`})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
                  <span>Est. Weight: </span>
                  <span style={{ color: '#f59e0b', fontWeight: 700 }}>{stockMass} {massUnit}</span>
                  <span> &bull; Vol: {Number(stockVol).toFixed(1)} {volUnit}</span>
                </div>
              </div>

              {/* 9-Point Origin Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <label style={{ fontSize: '10px', color: '#94a3b8' }}>WCS (G54) Anchor:</label>
                <div className="origin-selector-grid">
                  {originPositions.map((pos) => (
                    <button
                      key={pos.id}
                      type="button"
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
                <span style={{ fontSize: '9px', color: '#0284c7', fontWeight: 600, fontFamily: 'monospace' }}>
                  {originPoint.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={handleApply}>
              <Check size={14} />
              <span>Apply Stock Setup</span>
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
