import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Compass, Circle, Square, Box, Crosshair, Plus,
  Trash2, Layers, CheckCircle2, Sliders, Eye, RefreshCw,
  Maximize2, ArrowRight, Grid, Disc, ShieldAlert
} from 'lucide-react';
import {
  createWireframeLine,
  createWireframeCircle,
  createBoltHoleCircle,
  createWireframeRect,
  createWireframePolygon,
  createParallelLine,
  extractEdgesFromModel,
  createPointMarker,
  createBoundingWireframe,
  createDrillPointsGrid
} from '../utils/cadGeometry';

export default function WireframeSketcherModal({
  isOpen,
  onClose,
  initialTool = 'line',
  partMetrics,
  activeModel,
  customGeometry = [],
  onAddEntity,
  onRemoveEntity,
  onClearEntities
}) {
  const [activeTool, setActiveTool] = useState(initialTool);

  useEffect(() => {
    if (initialTool) {
      setActiveTool(initialTool);
    }
  }, [initialTool, isOpen]);

  // Model reference values
  const defaultCenter = partMetrics?.center || { x: 0, y: 35, z: 0 };
  const defaultDim = partMetrics?.dimensions || { x: 80, y: 35, z: 60 };
  const topY = partMetrics?.box?.max?.y ?? 35;
  const botY = partMetrics?.box?.min?.y ?? 0;

  // 1. Line 2 Points state
  const [lineP1, setLineP1] = useState({ x: -40, y: topY, z: 0 });
  const [lineP2, setLineP2] = useState({ x: 40, y: topY, z: 0 });
  const [lineColor, setLineColor] = useState('#f43f5e');

  // 2. Parallel Line state
  const [parallelOffset, setParallelOffset] = useState(10);
  const [parallelPlane, setParallelPlane] = useState('G17');

  // 3. Circle / Arc state
  const [circleCenter, setCircleCenter] = useState({ x: defaultCenter.x, y: topY, z: defaultCenter.z });
  const [circleRadius, setCircleRadius] = useState(Math.round(Math.min(defaultDim.x, defaultDim.z) / 2.5) || 25);
  const [circleIsDiameter, setCircleIsDiameter] = useState(false);
  const [isArcMode, setIsArcMode] = useState(false);
  const [arcStartAngle, setArcStartAngle] = useState(0);
  const [arcSweepAngle, setArcSweepAngle] = useState(180);
  const [circlePlane, setCirclePlane] = useState('G17');
  const [circleColor, setCircleColor] = useState('#38bdf8');

  // 4. Bolt Hole Circle (PCD) state
  const [pcdCenter, setPcdCenter] = useState({ x: defaultCenter.x, y: topY, z: defaultCenter.z });
  const [pcdDiameter, setPcdDiameter] = useState(60);
  const [pcdHoles, setPcdHoles] = useState(6);
  const [pcdStartAngle, setPcdStartAngle] = useState(0);
  const [pcdHoleRadius, setPcdHoleRadius] = useState(3.4); // for M8 hole (6.8mm)

  // 5. Rectangle Boundary state
  const [rectWidth, setRectWidth] = useState(Math.round(defaultDim.x) || 80);
  const [rectDepth, setRectDepth] = useState(Math.round(defaultDim.z) || 60);
  const [rectY, setRectY] = useState(topY);
  const [rectFillet, setRectFillet] = useState(5);
  const [rectCenter, setRectCenter] = useState({ x: defaultCenter.x, z: defaultCenter.z });
  const [rectColor, setRectColor] = useState('#4ade80');

  // 6. Polygon state
  const [polySides, setPolySides] = useState(6);
  const [polyRadius, setPolyRadius] = useState(24);
  const [polyRotation, setPolyRotation] = useState(0);
  const [polyY, setPolyY] = useState(topY);
  const [polyCenter, setPolyCenter] = useState({ x: defaultCenter.x, z: defaultCenter.z });

  // 7. Extract Edges state
  const [edgeThreshold, setEdgeThreshold] = useState(25);
  const [extractedStatus, setExtractedStatus] = useState(null);

  // 8. Bounding Cage & Datum state
  const [cageMargin, setCageMargin] = useState(2);
  const [datumPoint, setDatumPoint] = useState({ x: 0, y: topY, z: 0 });
  const [drillCornerOffset, setDrillCornerOffset] = useState(8);

  // Computed line length
  const lineLength = useMemo(() => {
    const dx = lineP2.x - lineP1.x;
    const dy = lineP2.y - lineP1.y;
    const dz = lineP2.z - lineP1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz).toFixed(2);
  }, [lineP1, lineP2]);

  // Computed PCD Hole Coordinate List
  const pcdHoleList = useMemo(() => {
    const list = [];
    const r = pcdDiameter / 2;
    for (let i = 0; i < pcdHoles; i++) {
      const angleDeg = pcdStartAngle + i * (360 / pcdHoles);
      const rad = (angleDeg * Math.PI) / 180;
      const hx = pcdCenter.x + Math.cos(rad) * r;
      const hz = pcdCenter.z + Math.sin(rad) * r;
      list.push({
        id: i + 1,
        angle: angleDeg.toFixed(1),
        x: hx.toFixed(3),
        y: pcdCenter.y.toFixed(3),
        z: hz.toFixed(3)
      });
    }
    return list;
  }, [pcdCenter, pcdDiameter, pcdHoles, pcdStartAngle]);

  // List of active Level 10 wireframe entities
  const wireframeEntities = useMemo(() => {
    return customGeometry.filter(
      (g) => g.name?.startsWith('Wireframe_') || g.name?.startsWith('Drill_') || g.name?.startsWith('CAD_')
    );
  }, [customGeometry]);

  if (!isOpen) return null;

  // Handlers
  const handleAddLine = () => {
    const line = createWireframeLine(
      [Number(lineP1.x), Number(lineP1.y), Number(lineP1.z)],
      [Number(lineP2.x), Number(lineP2.y), Number(lineP2.z)],
      { color: parseInt(lineColor.replace('#', '0x')) }
    );
    if (onAddEntity) onAddEntity(line);
    alert(`3D Line (Length: ${lineLength} mm) added to Level 10.`);
  };

  const handleAddParallelLine = () => {
    const line = createParallelLine(
      [Number(lineP1.x), Number(lineP1.y), Number(lineP1.z)],
      [Number(lineP2.x), Number(lineP2.y), Number(lineP2.z)],
      Number(parallelOffset),
      parallelPlane
    );
    if (onAddEntity) onAddEntity(line);
    alert(`Parallel Line offset by ${parallelOffset} mm added to Level 10.`);
  };

  const handleAddCircle = () => {
    const r = circleIsDiameter ? Number(circleRadius) / 2 : Number(circleRadius);
    const sweep = isArcMode ? Number(arcSweepAngle) : 360;
    const start = isArcMode ? Number(arcStartAngle) : 0;
    const circle = createWireframeCircle(
      r,
      Number(circleCenter.y),
      [Number(circleCenter.x), Number(circleCenter.z)],
      start,
      sweep,
      circlePlane,
      { color: parseInt(circleColor.replace('#', '0x')) }
    );
    if (onAddEntity) onAddEntity(circle);
    alert(`${isArcMode ? 'Arc' : 'Circle'} (Radius ${r} mm) added to Level 10.`);
  };

  const handleAddPCD = () => {
    const group = createBoltHoleCircle(
      Number(pcdDiameter),
      Number(pcdHoles),
      Number(pcdCenter.y),
      [Number(pcdCenter.x), Number(pcdCenter.z)],
      Number(pcdStartAngle),
      Number(pcdHoleRadius)
    );
    if (onAddEntity) onAddEntity(group);
    alert(`PCD Bolt Pattern (${pcdHoles} holes on Ø${pcdDiameter}mm) added to Level 10.`);
  };

  const handleAddRect = () => {
    const rect = createWireframeRect(
      Number(rectWidth),
      Number(rectDepth),
      Number(rectY),
      Number(rectFillet),
      [Number(rectCenter.x), Number(rectCenter.z)],
      { color: parseInt(rectColor.replace('#', '0x')) }
    );
    if (onAddEntity) onAddEntity(rect);
    alert(`Rectangle Pocket Boundary (${rectWidth}x${rectDepth} mm${rectFillet > 0 ? `, R${rectFillet}` : ''}) added to Level 10.`);
  };

  const handleAddPolygon = () => {
    const poly = createWireframePolygon(
      Number(polySides),
      Number(polyRadius),
      Number(polyY),
      Number(polyRotation),
      [Number(polyCenter.x), Number(polyCenter.z)]
    );
    if (onAddEntity) onAddEntity(poly);
    alert(`${polySides}-Sided Regular Polygon (Radius ${polyRadius} mm) added to Level 10.`);
  };

  const handleExtractEdges = () => {
    if (!activeModel) {
      alert("No active 3D model loaded to extract edges from.");
      return;
    }
    const { group, totalSegments } = extractEdgesFromModel(activeModel, Number(edgeThreshold));
    if (totalSegments === 0) {
      alert("No sharp edges found with current threshold. Try lowering the threshold angle.");
      return;
    }
    if (onAddEntity) onAddEntity(group);
    setExtractedStatus(`Extracted ${totalSegments} feature curve segments at ${edgeThreshold}°!`);
    alert(`Extracted ${totalSegments} wireframe curve segments from 3D model onto Level 10.`);
  };

  const handleAddBoundingCage = () => {
    if (!partMetrics?.box) {
      alert("No 3D part metrics available for bounding cage.");
      return;
    }
    const m = Number(cageMargin);
    const cage = createBoundingWireframe(partMetrics.box, { x: m, y: m, z: m });
    if (onAddEntity) onAddEntity(cage);
    alert(`Bounding Wireframe Cage (+${m}mm margin) added to Level 10.`);
  };

  const handleAddDatumPoint = () => {
    const pt = createPointMarker(
      [Number(datumPoint.x), Number(datumPoint.y), Number(datumPoint.z)],
      `Wireframe_Point_X${datumPoint.x}_Y${datumPoint.y}_Z${datumPoint.z}`
    );
    if (onAddEntity) onAddEntity(pt);
    alert(`Datum Point [${datumPoint.x}, ${datumPoint.y}, ${datumPoint.z}] added to Level 10.`);
  };

  const handleAddDrillGrid = () => {
    if (!partMetrics?.box) {
      alert("No 3D part metrics available for 4-corner drill grid.");
      return;
    }
    const grid = createDrillPointsGrid(partMetrics.box, Number(drillCornerOffset));
    if (onAddEntity) onAddEntity(grid);
    alert(`4-Corner Drill Coordinate Grid (Offset: ${drillCornerOffset}mm) added to Level 10.`);
  };

  const navTools = [
    { id: 'line', label: 'Line 2 Points', icon: Compass, badge: '2-Pt' },
    { id: 'parallel', label: 'Parallel Line', icon: Sliders, badge: 'Offset' },
    { id: 'circle', label: 'Circle / Arc', icon: Circle, badge: 'G17/18/19' },
    { id: 'pcd', label: 'Bolt Circle (PCD)', icon: Disc, badge: 'CNC Drill' },
    { id: 'rect', label: 'Rectangle / Pocket', icon: Square, badge: 'Fillet R' },
    { id: 'polygon', label: 'Polygon (Hexagon)', icon: Grid, badge: 'N-Gon' },
    { id: 'edges', label: 'Extract 3D Edges', icon: Box, badge: 'Solid CAD' },
    { id: 'datum', label: 'Datum & Grid', icon: Crosshair, badge: 'WCS' },
    { id: 'list', label: 'Entity Manager', icon: Layers, badge: `${wireframeEntities.length}` }
  ];

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        className="modal-content"
        style={{
          width: '940px',
          maxWidth: '96vw',
          maxHeight: '90vh',
          backgroundColor: '#12161f',
          border: '1px solid #283548',
          borderRadius: '8px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#f8fafc'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 20px',
            backgroundColor: '#171c28',
            borderBottom: '1px solid #283548',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Compass size={22} color="#38bdf8" />
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '0.5px' }}>
                WIREFRAME CAD SKETCHER &amp; GEOMETRY GENERATOR
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', gap: '12px', marginTop: '2px' }}>
                <span>Mastercam 2024 Style Parametric CAD Tools</span>
                <span>•</span>
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>Target: Level 10 (Wireframe Curves)</span>
                <span>•</span>
                <span style={{ color: '#10b981' }}>{wireframeEntities.length} Active Entities</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Layout: Sidebar Tool Navigator + Content Body */}
        <div style={{ display: 'flex', flex: 1, minHeight: '480px', overflow: 'hidden' }}>
          {/* Tool Navigation Sidebar */}
          <div
            style={{
              width: '230px',
              backgroundColor: '#0e1219',
              borderRight: '1px solid #232c3d',
              padding: '12px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', padding: '4px 8px', letterSpacing: '0.8px' }}>
              CAD Tools
            </div>
            {navTools.map((tool) => {
              const Icon = tool.icon;
              const isActive = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '5px',
                    border: `1px solid ${isActive ? '#2563eb' : 'transparent'}`,
                    backgroundColor: isActive ? '#1e293b' : 'transparent',
                    color: isActive ? '#38bdf8' : '#cbd5e1',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: isActive ? 600 : 500,
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon size={16} color={isActive ? '#38bdf8' : '#94a3b8'} />
                    <span>{tool.label}</span>
                  </div>
                  <span
                    style={{
                      fontSize: '9px',
                      padding: '1px 5px',
                      borderRadius: '3px',
                      backgroundColor: isActive ? '#2563eb33' : '#1e2430',
                      color: isActive ? '#38bdf8' : '#64748b',
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    {tool.badge}
                  </span>
                </button>
              );
            })}

            {/* Quick Actions at bottom of sidebar */}
            <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #1f2737', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                onClick={() => {
                  if (confirm("Clear all added wireframe curves from Level 10?")) {
                    onClearEntities();
                  }
                }}
                disabled={wireframeEntities.length === 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  justifyContent: 'center',
                  padding: '7px',
                  backgroundColor: '#1f1519',
                  border: '1px solid #4a1d24',
                  borderRadius: '4px',
                  color: wireframeEntities.length === 0 ? '#64748b' : '#f87171',
                  fontSize: '11px',
                  cursor: wireframeEntities.length === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                <Trash2 size={13} />
                <span>Clear All Wireframes</span>
              </button>
            </div>
          </div>

          {/* Main Tool Configuration Panel */}
          <div
            style={{
              flex: 1,
              padding: '20px 24px',
              overflowY: 'auto',
              backgroundColor: '#12161f',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* 1. LINE 2 POINTS */}
            {activeTool === 'line' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #232c3d', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#38bdf8' }}>3D Line (2 Endpoints)</div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                    Construct a 3D Euclidean wireframe segment between Cartesian coordinates $(X_1, Y_1, Z_1)$ and $(X_2, Y_2, Z_2)$.
                  </div>
                </div>

                {/* Quick-Snap Preset Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Quick Snaps:</span>
                  <button
                    className="modal-preset-btn"
                    onClick={() => {
                      setLineP1({ x: -defaultDim.x / 2, y: topY, z: 0 });
                      setLineP2({ x: defaultDim.x / 2, y: topY, z: 0 });
                    }}
                  >
                    X-Centerline
                  </button>
                  <button
                    className="modal-preset-btn"
                    onClick={() => {
                      setLineP1({ x: 0, y: topY, z: -defaultDim.z / 2 });
                      setLineP2({ x: 0, y: topY, z: defaultDim.z / 2 });
                    }}
                  >
                    Z-Centerline
                  </button>
                  <button
                    className="modal-preset-btn"
                    onClick={() => {
                      setLineP1({ x: -defaultDim.x / 2, y: topY, z: -defaultDim.z / 2 });
                      setLineP2({ x: defaultDim.x / 2, y: topY, z: defaultDim.z / 2 });
                    }}
                  >
                    Diagonal
                  </button>
                  <button
                    className="modal-preset-btn"
                    onClick={() => {
                      setLineP1({ x: 0, y: botY, z: 0 });
                      setLineP2({ x: 0, y: topY, z: 0 });
                    }}
                  >
                    Vertical Axis (Y)
                  </button>
                </div>

                {/* Start Point P1 */}
                <div style={{ background: '#161b26', padding: '12px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#38bdf8', marginBottom: '8px' }}>
                    Start Endpoint (P1)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '10.5px', color: '#94a3b8' }}>X1 (mm)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={lineP1.x}
                        onChange={(e) => setLineP1({ ...lineP1, x: parseFloat(e.target.value) || 0 })}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10.5px', color: '#94a3b8' }}>Y1 (Elevation, mm)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={lineP1.y}
                        onChange={(e) => setLineP1({ ...lineP1, y: parseFloat(e.target.value) || 0 })}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10.5px', color: '#94a3b8' }}>Z1 (mm)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={lineP1.z}
                        onChange={(e) => setLineP1({ ...lineP1, z: parseFloat(e.target.value) || 0 })}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>

                {/* End Point P2 */}
                <div style={{ background: '#161b26', padding: '12px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#38bdf8', marginBottom: '8px' }}>
                    End Endpoint (P2)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '10.5px', color: '#94a3b8' }}>X2 (mm)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={lineP2.x}
                        onChange={(e) => setLineP2({ ...lineP2, x: parseFloat(e.target.value) || 0 })}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10.5px', color: '#94a3b8' }}>Y2 (Elevation, mm)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={lineP2.y}
                        onChange={(e) => setLineP2({ ...lineP2, y: parseFloat(e.target.value) || 0 })}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10.5px', color: '#94a3b8' }}>Z2 (mm)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={lineP2.z}
                        onChange={(e) => setLineP2({ ...lineP2, z: parseFloat(e.target.value) || 0 })}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>

                {/* Metrics & Options */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#0e1219', borderRadius: '6px', border: '1px solid #1f2737' }}>
                  <div style={{ fontSize: '12px' }}>
                    Computed Vector Length: <strong style={{ color: '#10b981', fontFamily: 'var(--font-mono)' }}>{lineLength} mm</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Curve Color:</span>
                    <input
                      type="color"
                      value={lineColor}
                      onChange={(e) => setLineColor(e.target.value)}
                      style={{ width: '28px', height: '24px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                    />
                  </div>
                </div>

                <button onClick={handleAddLine} style={primaryBtnStyle}>
                  <Plus size={16} />
                  <span>Insert 3D Line into Level 10</span>
                </button>
              </div>
            )}

            {/* 2. PARALLEL LINE */}
            {activeTool === 'parallel' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #232c3d', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#f59e0b' }}>Parallel / Offset Line</div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                    Generate an equidistant parallel wireframe offset line at a normal distance $\pm D$ from the reference line.
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: '#161b26', padding: '12px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Offset Distance (mm)</label>
                    <input
                      type="number"
                      step="1"
                      value={parallelOffset}
                      onChange={(e) => setParallelOffset(parseFloat(e.target.value) || 0)}
                      style={inputStyle}
                    />
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                      Positive = Right / Normal, Negative = Left
                    </div>
                  </div>

                  <div style={{ background: '#161b26', padding: '12px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Active Projection Plane</label>
                    <select
                      value={parallelPlane}
                      onChange={(e) => setParallelPlane(e.target.value)}
                      style={inputStyle}
                    >
                      <option value="G17">Top Plane (G17 - XZ)</option>
                      <option value="G18">Front Plane (G18 - XY)</option>
                    </select>
                  </div>
                </div>

                <div style={{ padding: '12px', background: '#0e1219', borderRadius: '6px', border: '1px solid #1f2737', fontSize: '11.5px', color: '#cbd5e1' }}>
                  <div>Reference Line: <strong>P1 [{lineP1.x}, {lineP1.y}, {lineP1.z}]</strong> &rarr; <strong>P2 [{lineP2.x}, {lineP2.y}, {lineP2.z}]</strong></div>
                  <div style={{ marginTop: '4px', color: '#94a3b8' }}>To change reference points, configure them in the "Line 2 Points" tab.</div>
                </div>

                <button onClick={handleAddParallelLine} style={{ ...primaryBtnStyle, backgroundColor: '#d97706' }}>
                  <Plus size={16} />
                  <span>Generate Parallel Offset Line into Level 10</span>
                </button>
              </div>
            )}

            {/* 3. CIRCLE / ARC */}
            {activeTool === 'circle' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #232c3d', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#38bdf8' }}>Circle / Arc CAD Entity</div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                    Create full circles ($360^\circ$) or partial arcs on Top G17, Front G18, or Right G19 WCS planes.
                  </div>
                </div>

                {/* Circle mode toggles */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setIsArcMode(false)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      backgroundColor: !isArcMode ? '#1e293b' : '#141822',
                      border: `1px solid ${!isArcMode ? '#38bdf8' : '#232c3d'}`,
                      borderRadius: '4px',
                      color: !isArcMode ? '#38bdf8' : '#94a3b8',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '12px'
                    }}
                  >
                    Full Circle (360°)
                  </button>
                  <button
                    onClick={() => setIsArcMode(true)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      backgroundColor: isArcMode ? '#1e293b' : '#141822',
                      border: `1px solid ${isArcMode ? '#38bdf8' : '#232c3d'}`,
                      borderRadius: '4px',
                      color: isArcMode ? '#38bdf8' : '#94a3b8',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '12px'
                    }}
                  >
                    Partial Arc Segment
                  </button>
                </div>

                {/* Center Coordinates */}
                <div style={{ background: '#161b26', padding: '12px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#38bdf8' }}>Center Position</span>
                    <button
                      className="modal-preset-btn"
                      onClick={() => setCircleCenter({ x: defaultCenter.x, y: topY, z: defaultCenter.z })}
                    >
                      Snap to Part Center
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '10.5px', color: '#94a3b8' }}>Center X (mm)</label>
                      <input
                        type="number"
                        step="1"
                        value={circleCenter.x}
                        onChange={(e) => setCircleCenter({ ...circleCenter, x: parseFloat(e.target.value) || 0 })}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10.5px', color: '#94a3b8' }}>Center Y (Elevation, mm)</label>
                      <input
                        type="number"
                        step="1"
                        value={circleCenter.y}
                        onChange={(e) => setCircleCenter({ ...circleCenter, y: parseFloat(e.target.value) || 0 })}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10.5px', color: '#94a3b8' }}>Center Z (mm)</label>
                      <input
                        type="number"
                        step="1"
                        value={circleCenter.z}
                        onChange={(e) => setCircleCenter({ ...circleCenter, z: parseFloat(e.target.value) || 0 })}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>

                {/* Radius / Diameter & Plane */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                  <div style={{ background: '#161b26', padding: '12px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                        {circleIsDiameter ? 'Diameter Ø (mm)' : 'Radius R (mm)'}
                      </label>
                      <button
                        onClick={() => setCircleIsDiameter(!circleIsDiameter)}
                        style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '10px', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Switch to {circleIsDiameter ? 'Radius' : 'Diameter'}
                      </button>
                    </div>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      value={circleRadius}
                      onChange={(e) => setCircleRadius(parseFloat(e.target.value) || 1)}
                      style={inputStyle}
                    />
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                      {circleIsDiameter ? `Radius = ${(circleRadius / 2).toFixed(2)} mm` : `Diameter Ø = ${(circleRadius * 2).toFixed(2)} mm`}
                    </div>
                  </div>

                  <div style={{ background: '#161b26', padding: '12px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Construction Plane</label>
                    <select
                      value={circlePlane}
                      onChange={(e) => setCirclePlane(e.target.value)}
                      style={inputStyle}
                    >
                      <option value="G17">Top Plane (G17 - XZ)</option>
                      <option value="G18">Front Plane (G18 - XY)</option>
                      <option value="G19">Right Plane (G19 - YZ)</option>
                    </select>
                  </div>
                </div>

                {/* Arc Angle Controls (if Arc mode active) */}
                {isArcMode && (
                  <div style={{ background: '#161b26', padding: '12px', borderRadius: '6px', border: '1px solid #232c3d', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '10.5px', color: '#94a3b8' }}>Start Angle (Deg)</label>
                      <input
                        type="number"
                        step="5"
                        value={arcStartAngle}
                        onChange={(e) => setArcStartAngle(parseFloat(e.target.value) || 0)}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10.5px', color: '#94a3b8' }}>Sweep Angle (Deg)</label>
                      <input
                        type="number"
                        step="5"
                        min="5"
                        max="360"
                        value={arcSweepAngle}
                        onChange={(e) => setArcSweepAngle(parseFloat(e.target.value) || 90)}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                )}

                <button onClick={handleAddCircle} style={primaryBtnStyle}>
                  <Plus size={16} />
                  <span>Insert {isArcMode ? 'Arc' : 'Circle'} into Level 10</span>
                </button>
              </div>
            )}

            {/* 4. BOLT HOLE CIRCLE (PCD) */}
            {activeTool === 'pcd' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #232c3d', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#f59e0b' }}>Bolt Hole Circle Pattern (PCD)</div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                    Mastercam standard pitch circle pattern generator for drill cycles, peck drilling, and tap coordinates.
                  </div>
                </div>

                {/* PCD Parameters */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>PCD Diameter (mm)</label>
                    <input
                      type="number"
                      step="1"
                      value={pcdDiameter}
                      onChange={(e) => setPcdDiameter(parseFloat(e.target.value) || 10)}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>Number of Holes</label>
                    <input
                      type="number"
                      step="1"
                      min="2"
                      max="32"
                      value={pcdHoles}
                      onChange={(e) => setPcdHoles(parseInt(e.target.value, 10) || 4)}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>Hole Radius (mm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={pcdHoleRadius}
                      onChange={(e) => setPcdHoleRadius(parseFloat(e.target.value) || 1)}
                      style={inputStyle}
                    />
                    <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>
                      Ø{(pcdHoleRadius * 2).toFixed(1)} mm
                    </div>
                  </div>
                  <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>Start Angle (Deg)</label>
                    <input
                      type="number"
                      step="5"
                      value={pcdStartAngle}
                      onChange={(e) => setPcdStartAngle(parseFloat(e.target.value) || 0)}
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* PCD Center */}
                <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8' }}>Center X (mm)</label>
                    <input
                      type="number"
                      step="1"
                      value={pcdCenter.x}
                      onChange={(e) => setPcdCenter({ ...pcdCenter, x: parseFloat(e.target.value) || 0 })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8' }}>Center Y (Elevation, mm)</label>
                    <input
                      type="number"
                      step="1"
                      value={pcdCenter.y}
                      onChange={(e) => setPcdCenter({ ...pcdCenter, y: parseFloat(e.target.value) || 0 })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8' }}>Center Z (mm)</label>
                    <input
                      type="number"
                      step="1"
                      value={pcdCenter.z}
                      onChange={(e) => setPcdCenter({ ...pcdCenter, z: parseFloat(e.target.value) || 0 })}
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Coordinate Preview Table */}
                <div style={{ background: '#0e1219', borderRadius: '6px', border: '1px solid #1f2737', overflow: 'hidden' }}>
                  <div style={{ padding: '6px 10px', backgroundColor: '#161b26', borderBottom: '1px solid #1f2737', fontSize: '11px', fontWeight: 600, color: '#38bdf8' }}>
                    Generated Drill Coordinates ({pcdHoleList.length} Holes)
                  </div>
                  <div style={{ maxHeight: '110px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px', fontFamily: 'var(--font-mono)' }}>
                      <thead>
                        <tr style={{ color: '#64748b', borderBottom: '1px solid #1f2737' }}>
                          <th style={{ padding: '4px 8px', textAlign: 'left' }}>#</th>
                          <th style={{ padding: '4px 8px', textAlign: 'left' }}>Angle</th>
                          <th style={{ padding: '4px 8px', textAlign: 'left' }}>X Coordinate</th>
                          <th style={{ padding: '4px 8px', textAlign: 'left' }}>Z Coordinate</th>
                          <th style={{ padding: '4px 8px', textAlign: 'left' }}>Y Depth</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pcdHoleList.map((h) => (
                          <tr key={h.id} style={{ borderBottom: '1px solid #141822', color: '#cbd5e1' }}>
                            <td style={{ padding: '3px 8px', color: '#f59e0b' }}>Hole {h.id}</td>
                            <td style={{ padding: '3px 8px' }}>{h.angle}°</td>
                            <td style={{ padding: '3px 8px' }}>X{h.x}</td>
                            <td style={{ padding: '3px 8px' }}>Z{h.z}</td>
                            <td style={{ padding: '3px 8px' }}>Y{h.y}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <button onClick={handleAddPCD} style={{ ...primaryBtnStyle, backgroundColor: '#d97706' }}>
                  <Plus size={16} />
                  <span>Generate PCD Pattern &amp; Drill Markers into Level 10</span>
                </button>
              </div>
            )}

            {/* 5. RECTANGLE / POCKET BOUNDARY */}
            {activeTool === 'rect' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #232c3d', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#4ade80' }}>Rectangle &amp; Pocket Boundary</div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                    Create 2D/3D rectangular pocket contours with optional corner fillet radii for CNC endmill pocketing.
                  </div>
                </div>

                {/* Dimensions */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>Width X (mm)</label>
                    <input
                      type="number"
                      step="1"
                      value={rectWidth}
                      onChange={(e) => setRectWidth(parseFloat(e.target.value) || 10)}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>Depth Z (mm)</label>
                    <input
                      type="number"
                      step="1"
                      value={rectDepth}
                      onChange={(e) => setRectDepth(parseFloat(e.target.value) || 10)}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>Elevation Y (mm)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={rectY}
                      onChange={(e) => setRectY(parseFloat(e.target.value) || 0)}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>Corner Fillet R (mm)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={rectFillet}
                      onChange={(e) => setRectFillet(parseFloat(e.target.value) || 0)}
                      style={inputStyle}
                    />
                    <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>
                      {rectFillet > 0 ? `R${rectFillet} mm` : 'Sharp Corners'}
                    </div>
                  </div>
                </div>

                {/* Center Coordinates & Snaps */}
                <div style={{ background: '#161b26', padding: '12px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#4ade80' }}>Center Offset &amp; Presets</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="modal-preset-btn"
                        onClick={() => {
                          setRectWidth(Math.round(defaultDim.x));
                          setRectDepth(Math.round(defaultDim.z));
                          setRectCenter({ x: defaultCenter.x, z: defaultCenter.z });
                        }}
                      >
                        Snap to Part Extents
                      </button>
                      <button
                        className="modal-preset-btn"
                        onClick={() => {
                          setRectWidth(Math.round(defaultDim.x) + 4);
                          setRectDepth(Math.round(defaultDim.z) + 4);
                        }}
                      >
                        +2mm Stock Offset
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '10.5px', color: '#94a3b8' }}>Center X (mm)</label>
                      <input
                        type="number"
                        step="1"
                        value={rectCenter.x}
                        onChange={(e) => setRectCenter({ ...rectCenter, x: parseFloat(e.target.value) || 0 })}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10.5px', color: '#94a3b8' }}>Center Z (mm)</label>
                      <input
                        type="number"
                        step="1"
                        value={rectCenter.z}
                        onChange={(e) => setRectCenter({ ...rectCenter, z: parseFloat(e.target.value) || 0 })}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>

                <button onClick={handleAddRect} style={{ ...primaryBtnStyle, backgroundColor: '#16a34a' }}>
                  <Plus size={16} />
                  <span>Insert Pocket Boundary into Level 10</span>
                </button>
              </div>
            )}

            {/* 6. POLYGON (HEXAGON / N-GON) */}
            {activeTool === 'polygon' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #232c3d', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#a855f7' }}>Regular Polygon (Hexagon, Octagon)</div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                    Create regular inscribed/circumscribed polygons for bolt heads, wrench flats, and prismatic pockets.
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>Number of Sides</label>
                    <input
                      type="number"
                      step="1"
                      min="3"
                      max="16"
                      value={polySides}
                      onChange={(e) => setPolySides(parseInt(e.target.value, 10) || 6)}
                      style={inputStyle}
                    />
                    <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>
                      {polySides === 6 ? 'Hexagon' : polySides === 8 ? 'Octagon' : `${polySides}-gon`}
                    </div>
                  </div>
                  <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>Outer Radius R (mm)</label>
                    <input
                      type="number"
                      step="1"
                      value={polyRadius}
                      onChange={(e) => setPolyRadius(parseFloat(e.target.value) || 10)}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>Rotation (Deg)</label>
                    <input
                      type="number"
                      step="5"
                      value={polyRotation}
                      onChange={(e) => setPolyRotation(parseFloat(e.target.value) || 0)}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>Elevation Y (mm)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={polyY}
                      onChange={(e) => setPolyY(parseFloat(e.target.value) || 0)}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <button onClick={handleAddPolygon} style={{ ...primaryBtnStyle, backgroundColor: '#9333ea' }}>
                  <Plus size={16} />
                  <span>Insert {polySides}-Sided Polygon into Level 10</span>
                </button>
              </div>
            )}

            {/* 7. EXTRACT 3D EDGES FROM SOLID */}
            {activeTool === 'edges' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #232c3d', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#38bdf8' }}>Curve on All Edges (From 3D Solid)</div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                    Traverses active 3D CAD solid model topology and extracts sharp feature curve edges into Level 10 wireframe curves for toolpath chaining.
                  </div>
                </div>

                <div style={{ background: '#161b26', padding: '14px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>
                      Feature Edge Detection Angle ({edgeThreshold}°)
                    </label>
                    <span style={{ fontSize: '11px', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                      Threshold: {edgeThreshold}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="60"
                    step="1"
                    value={edgeThreshold}
                    onChange={(e) => setEdgeThreshold(parseInt(e.target.value, 10))}
                    style={{ width: '100%', accentColor: '#38bdf8' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                    <span>1° (All facet edges)</span>
                    <span>25° (Recommended for CAM)</span>
                    <span>60° (Only sharp 90° corners)</span>
                  </div>
                </div>

                {extractedStatus && (
                  <div style={{ padding: '10px', background: '#0e231d', border: '1px solid #10b981', borderRadius: '6px', color: '#34d399', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} />
                    <span>{extractedStatus}</span>
                  </div>
                )}

                <button onClick={handleExtractEdges} style={primaryBtnStyle}>
                  <Box size={16} />
                  <span>Extract Solid CAD Edges to Level 10</span>
                </button>
              </div>
            )}

            {/* 8. DATUM & BOUNDING CAGE */}
            {activeTool === 'datum' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #232c3d', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#facc15' }}>Datum Points &amp; Bounding Cage</div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                    Generate WCS coordinate datum references, drill target coordinates, and bounding stock cages.
                  </div>
                </div>

                {/* Bounding Cage */}
                <div style={{ background: '#161b26', padding: '12px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#facc15', marginBottom: '8px' }}>
                    3D Bounding Wireframe Cage
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '10.5px', color: '#94a3b8' }}>Stock Offset Margin (mm)</label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={cageMargin}
                        onChange={(e) => setCageMargin(parseFloat(e.target.value) || 0)}
                        style={inputStyle}
                      />
                    </div>
                    <button onClick={handleAddBoundingCage} style={{ ...primaryBtnStyle, backgroundColor: '#ca8a04', marginTop: '16px' }}>
                      <Box size={15} />
                      <span>Add Bounding Cage</span>
                    </button>
                  </div>
                </div>

                {/* 4-Corner Drill Grid */}
                <div style={{ background: '#161b26', padding: '12px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#ef4444', marginBottom: '8px' }}>
                    4-Corner WCS Drill Grid
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '10.5px', color: '#94a3b8' }}>Corner Inset Margin (mm)</label>
                      <input
                        type="number"
                        step="1"
                        value={drillCornerOffset}
                        onChange={(e) => setDrillCornerOffset(parseFloat(e.target.value) || 0)}
                        style={inputStyle}
                      />
                    </div>
                    <button onClick={handleAddDrillGrid} style={{ ...primaryBtnStyle, backgroundColor: '#dc2626', marginTop: '16px' }}>
                      <Crosshair size={15} />
                      <span>Generate 4 Drill Points</span>
                    </button>
                  </div>
                </div>

                {/* Single Datum Coordinate Point */}
                <div style={{ background: '#161b26', padding: '12px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#38bdf8', marginBottom: '8px' }}>
                    Single Datum Point Marker
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ fontSize: '10.5px', color: '#94a3b8' }}>Point X</label>
                      <input
                        type="number"
                        step="1"
                        value={datumPoint.x}
                        onChange={(e) => setDatumPoint({ ...datumPoint, x: parseFloat(e.target.value) || 0 })}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10.5px', color: '#94a3b8' }}>Point Y</label>
                      <input
                        type="number"
                        step="1"
                        value={datumPoint.y}
                        onChange={(e) => setDatumPoint({ ...datumPoint, y: parseFloat(e.target.value) || 0 })}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10.5px', color: '#94a3b8' }}>Point Z</label>
                      <input
                        type="number"
                        step="1"
                        value={datumPoint.z}
                        onChange={(e) => setDatumPoint({ ...datumPoint, z: parseFloat(e.target.value) || 0 })}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  <button onClick={handleAddDatumPoint} style={primaryBtnStyle}>
                    <Plus size={15} />
                    <span>Insert Datum Point Marker</span>
                  </button>
                </div>
              </div>
            )}

            {/* 9. LEVEL 10 ENTITY MANAGER */}
            {activeTool === 'list' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #232c3d', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#38bdf8' }}>Level 10 Wireframe Entities</div>
                    <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                      Inspect, isolate, or delete individual wireframe curve entities residing on Level 10.
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("Clear all wireframes from Level 10?")) onClearEntities();
                    }}
                    disabled={wireframeEntities.length === 0}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 10px',
                      backgroundColor: '#1f1519',
                      border: '1px solid #ef4444',
                      borderRadius: '4px',
                      color: '#ef4444',
                      fontSize: '11px',
                      cursor: wireframeEntities.length === 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Clear All</span>
                  </button>
                </div>

                {wireframeEntities.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                    <Compass size={36} color="#334155" style={{ margin: '0 auto 10px' }} />
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>No wireframe entities on Level 10 yet</div>
                    <div style={{ fontSize: '11px', marginTop: '4px' }}>
                      Use the CAD tools on the left to create 3D lines, circles, PCD bolt circles, or pocket boundaries.
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {wireframeEntities.map((ent, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          backgroundColor: '#161b26',
                          border: '1px solid #232c3d',
                          borderRadius: '5px',
                          fontSize: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38bdf8' }} />
                          <div>
                            <div style={{ fontWeight: 600, color: '#f8fafc' }}>{ent.name || `Wireframe_Entity_${idx + 1}`}</div>
                            <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                              Type: {ent.userData?.type || '3D Curve'} {ent.userData?.length ? `| L: ${ent.userData.length}mm` : ''}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => onRemoveEntity && onRemoveEntity(ent)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '3px'
                          }}
                          title="Delete entity"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#171c28',
            borderTop: '1px solid #283548',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
            Entities on Level 10 can be directly selected as toolpath chains for 2D/3D pocketing and contouring.
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '6px 16px',
              backgroundColor: '#2563eb',
              border: 'none',
              borderRadius: '4px',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close Sketcher
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '6px 8px',
  backgroundColor: '#0e1219',
  border: '1px solid #2a3548',
  borderRadius: '4px',
  color: '#f8fafc',
  fontSize: '11.5px',
  fontFamily: 'var(--font-mono)',
  marginTop: '4px',
  boxSizing: 'border-box'
};

const primaryBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '10px 16px',
  backgroundColor: '#2563eb',
  border: 'none',
  borderRadius: '5px',
  color: '#ffffff',
  fontSize: '12.5px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background-color 0.15s ease',
  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
};
