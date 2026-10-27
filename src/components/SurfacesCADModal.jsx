import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Layers, Orbit, Box, Plus, Trash2, CheckCircle2,
  Sliders, Eye, RefreshCw, ShieldAlert, Sparkles, Disc,
  Grid, Compass, Maximize2, ShieldCheck, ArrowRight
} from 'lucide-react';
import {
  createPlanarSurface,
  createCylinderSurface,
  createExtrudedSurface,
  createRevolvedSurface,
  createRuledLoftSurface,
  createHoleCapSurface,
  createFilletBlendSurface
} from '../utils/cadGeometry';

export default function SurfacesCADModal({
  isOpen,
  onClose,
  initialTool = 'plane',
  partMetrics,
  customGeometry = [],
  onAddSurfaceEntity,
  onRemoveSurfaceEntity,
  onClearSurfaces
}) {
  const [activeTool, setActiveTool] = useState(initialTool);

  const [feedback, setFeedback] = useState(null);
  const notify = (msg, type = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3500);
  };

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

  // 1. Planar Surface State
  const [planeW, setPlaneW] = useState(Math.round(defaultDim.x) || 80);
  const [planeD, setPlaneD] = useState(Math.round(defaultDim.z) || 60);
  const [planeY, setPlaneY] = useState(topY);
  const [planeCenter, setPlaneCenter] = useState({ x: defaultCenter.x, z: defaultCenter.z });
  const [planePlane, setPlanePlane] = useState('G17');
  const [planeRole, setPlaneRole] = useState('drive'); // 'drive' or 'check'
  const [planeOpacity, setPlaneOpacity] = useState(0.75);

  // 2. Cylinder Surface State
  const [cylRadius, setCylRadius] = useState(30);
  const [cylHeight, setCylHeight] = useState(40);
  const [cylY, setCylY] = useState(botY);
  const [cylCenter, setCylCenter] = useState({ x: defaultCenter.x, z: defaultCenter.z });
  const [cylRole, setCylRole] = useState('drive');

  // 3. Extruded Surface State
  const [extW, setExtW] = useState(60);
  const [extD, setExtD] = useState(40);
  const [extHeight, setExtHeight] = useState(30);
  const [extY, setExtY] = useState(botY);
  const [extCenter, setExtCenter] = useState({ x: defaultCenter.x, z: defaultCenter.z });
  const [extRole, setExtRole] = useState('drive');

  // 4. Revolved Surface State
  const [revRBot, setRevRBot] = useState(35);
  const [revRTop, setRevRTop] = useState(20);
  const [revHeight, setRevHeight] = useState(45);
  const [revSweep, setRevSweep] = useState(360);
  const [revY, setRevY] = useState(botY);
  const [revCenter, setRevCenter] = useState({ x: defaultCenter.x, z: defaultCenter.z });
  const [revRole, setRevRole] = useState('drive');

  // 5. Ruled Loft State
  const [loftBotW, setLoftBotW] = useState(Math.round(defaultDim.x) || 80);
  const [loftBotD, setLoftBotD] = useState(Math.round(defaultDim.z) || 60);
  const [loftTopW, setLoftTopW] = useState(Math.round((defaultDim.x || 80) * 0.7));
  const [loftTopD, setLoftTopD] = useState(Math.round((defaultDim.z || 60) * 0.7));
  const [loftHeight, setLoftHeight] = useState(35);
  const [loftY, setLoftY] = useState(botY);
  const [loftCenter, setLoftCenter] = useState({ x: defaultCenter.x, z: defaultCenter.z });
  const [loftRole, setLoftRole] = useState('drive');

  // 6. Cap Hole State
  const [capRadius, setCapRadius] = useState(6);
  const [capY, setCapY] = useState(topY);
  const [capCenter, setCapCenter] = useState({ x: defaultCenter.x, z: defaultCenter.z });

  // 7. Fillet Blend State
  const [filletRad, setFilletRad] = useState(8);
  const [filletLen, setFilletLen] = useState(60);
  const [filletAngle, setFilletAngle] = useState(90);
  const [filletY, setFilletY] = useState(topY - 8);
  const [filletCenter, setFilletCenter] = useState({ x: defaultCenter.x, z: defaultCenter.z });

  // List of active Surface entities
  const surfaceEntities = useMemo(() => {
    return customGeometry.filter(
      (g) => g.name?.startsWith('Surface_') || g.name?.startsWith('CAD_')
    );
  }, [customGeometry]);

  if (!isOpen) return null;

  // Handlers
  const handleAddPlane = () => {
    const plane = createPlanarSurface(
      Number(planeW),
      Number(planeD),
      Number(planeY),
      [Number(planeCenter.x), Number(planeCenter.z)],
      planePlane,
      { role: planeRole, opacity: Number(planeOpacity) }
    );
    if (onAddSurfaceEntity) onAddSurfaceEntity(plane);
    notify(`Planar Surface (${planeW}x${planeD} mm - ${planeRole.toUpperCase()}) added to Level 15.`);
  };

  const handleAddCylinder = () => {
    const cyl = createCylinderSurface(
      Number(cylRadius),
      Number(cylHeight),
      Number(cylY),
      [Number(cylCenter.x), Number(cylCenter.z)],
      { role: cylRole }
    );
    if (onAddSurfaceEntity) onAddSurfaceEntity(cyl);
    notify(`Cylindrical Surface (Radius: ${cylRadius}mm, Height: ${cylHeight}mm) added to Level 15.`);
  };

  const handleAddExtrude = () => {
    const ext = createExtrudedSurface(
      Number(extW),
      Number(extD),
      Number(extHeight),
      Number(extY),
      [Number(extCenter.x), Number(extCenter.z)],
      { role: extRole }
    );
    if (onAddSurfaceEntity) onAddSurfaceEntity(ext);
    notify(`Extruded Surface Shell (${extW}x${extD}x${extHeight}mm) added to Level 15.`);
  };

  const handleAddRevolved = () => {
    const rev = createRevolvedSurface(
      Number(revRBot),
      Number(revRTop),
      Number(revHeight),
      Number(revSweep),
      Number(revY),
      [Number(revCenter.x), Number(revCenter.z)],
      { role: revRole }
    );
    if (onAddSurfaceEntity) onAddSurfaceEntity(rev);
    notify(`Revolved Surface (R${revRBot} to R${revRTop}, ${revSweep}°) added to Level 15.`);
  };

  const handleAddLoft = () => {
    const loft = createRuledLoftSurface(
      Number(loftBotW),
      Number(loftBotD),
      Number(loftTopW),
      Number(loftTopD),
      Number(loftHeight),
      Number(loftY),
      [Number(loftCenter.x), Number(loftCenter.z)],
      { role: loftRole }
    );
    if (onAddSurfaceEntity) onAddSurfaceEntity(loft);
    notify(`Ruled Loft Surface (${loftBotW}x${loftBotD} to ${loftTopW}x${loftTopD}) added to Level 15.`);
  };

  const handleAddHoleCap = () => {
    const cap = createHoleCapSurface(
      Number(capRadius),
      Number(capY),
      [Number(capCenter.x), Number(capCenter.z)]
    );
    if (onAddSurfaceEntity) onAddSurfaceEntity(cap);
    notify(`Hole Cap Surface Patch (Ø${(capRadius * 2).toFixed(1)}mm) added to Level 15.`);
  };

  const handleAddFilletBlend = () => {
    const fillet = createFilletBlendSurface(
      Number(filletRad),
      Number(filletLen),
      Number(filletAngle),
      Number(filletY),
      [Number(filletCenter.x), Number(filletCenter.z)]
    );
    if (onAddSurfaceEntity) onAddSurfaceEntity(fillet);
    notify(`Fillet Blend Sheet (R${filletRad}mm, Length: ${filletLen}mm) added to Level 15.`);
  };

  const navTools = [
    { id: 'plane', label: 'Planar Surface Sheet', icon: Layers, badge: 'G17/18/19' },
    { id: 'cylinder', label: 'Cylindrical Surface', icon: Orbit, badge: 'Open Sleeve' },
    { id: 'extrude', label: 'Extruded Wall Surface', icon: Box, badge: 'Perimeter' },
    { id: 'revolve', label: 'Revolved Surface', icon: Disc, badge: 'Turned/Cone' },
    { id: 'loft', label: 'Ruled Loft Surface', icon: Sliders, badge: 'Transition' },
    { id: 'cap', label: 'Cap Holes / Patches', icon: ShieldCheck, badge: 'CAM Patch' },
    { id: 'fillet', label: 'Fillet Blend Sheet', icon: Sparkles, badge: 'Corner R' },
    { id: 'list', label: 'Drive / Check Manager', icon: ShieldAlert, badge: `${surfaceEntities.length}` }
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
          width: '950px',
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
            <Layers size={22} color="#06b6d4" />
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '0.5px' }}>
                SURFACES CAD SUITE &amp; CHECK PATCH GENERATOR
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', gap: '12px', marginTop: '2px' }}>
                <span>Mastercam 2024 Style Drive &amp; Avoidance Check Surfaces</span>
                <span>•</span>
                <span style={{ color: '#06b6d4', fontWeight: 600 }}>Target: Level 15 (Surface Sheets)</span>
                <span>•</span>
                <span style={{ color: '#10b981' }}>{surfaceEntities.length} Active Surfaces</span>
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

        {/* Inline Feedback Banner */}
        {feedback && (
          <div style={{
            margin: '8px 16px',
            padding: '8px 14px',
            background: feedback.type === 'warning' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)',
            border: `1px solid ${feedback.type === 'warning' ? '#f59e0b' : '#10b981'}`,
            borderRadius: '4px',
            color: '#fff',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={15} color={feedback.type === 'warning' ? '#f59e0b' : '#10b981'} />
            <span>{feedback.msg}</span>
          </div>
        )}

        {/* Modal Layout: Sidebar Tool Navigator + Content Body */}
        <div style={{ display: 'flex', flex: 1, minHeight: '490px', overflow: 'hidden' }}>
          {/* Navigation Sidebar */}
          <div
            style={{
              width: '235px',
              backgroundColor: '#0e1219',
              borderRight: '1px solid #232c3d',
              padding: '12px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', padding: '4px 8px', letterSpacing: '0.8px' }}>
              Surface Tools
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
                    border: `1px solid ${isActive ? '#0284c7' : 'transparent'}`,
                    backgroundColor: isActive ? '#162232' : 'transparent',
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
                      backgroundColor: isActive ? '#0284c733' : '#1e2430',
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
            <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #1f2737' }}>
              <button
                onClick={() => {
                  if (confirm("Clear all added 3D surface sheets from Level 15?")) {
                    onClearSurfaces();
                  }
                }}
                disabled={surfaceEntities.length === 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  justifyContent: 'center',
                  width: '100%',
                  padding: '7px',
                  backgroundColor: '#1f1519',
                  border: '1px solid #4a1d24',
                  borderRadius: '4px',
                  color: surfaceEntities.length === 0 ? '#64748b' : '#f87171',
                  fontSize: '11px',
                  cursor: surfaceEntities.length === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                <Trash2 size={13} />
                <span>Clear All Surfaces</span>
              </button>
            </div>
          </div>

          {/* Main Surface Configuration Panel */}
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
            {/* 1. PLANAR SURFACE SHEET */}
            {activeTool === 'plane' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #232c3d', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#06b6d4' }}>Planar Surface Sheet</div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                    Generate a 2D/3D planar sheet entity for face boundaries, table patches, or collision check surfaces.
                  </div>
                </div>

                {/* Role Switcher: Drive Surface (Machined) vs Check Surface (Avoided) */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setPlaneRole('drive')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      backgroundColor: planeRole === 'drive' ? '#083344' : '#141822',
                      border: `1px solid ${planeRole === 'drive' ? '#06b6d4' : '#232c3d'}`,
                      borderRadius: '5px',
                      color: planeRole === 'drive' ? '#38bdf8' : '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <Layers size={15} color="#06b6d4" />
                    <span>Drive Surface (Cutter Target)</span>
                  </button>
                  <button
                    onClick={() => setPlaneRole('check')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      backgroundColor: planeRole === 'check' ? '#3b2308' : '#141822',
                      border: `1px solid ${planeRole === 'check' ? '#f59e0b' : '#232c3d'}`,
                      borderRadius: '5px',
                      color: planeRole === 'check' ? '#f59e0b' : '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <ShieldAlert size={15} color="#f59e0b" />
                    <span>Check Surface (Avoidance / Fixture)</span>
                  </button>
                </div>

                {/* Dimensions */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>Width X (mm)</label>
                    <input
                      type="number"
                      step="1"
                      value={planeW}
                      onChange={(e) => setPlaneW(parseFloat(e.target.value) || 10)}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>Depth Z (mm)</label>
                    <input
                      type="number"
                      step="1"
                      value={planeD}
                      onChange={(e) => setPlaneD(parseFloat(e.target.value) || 10)}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>Elevation Y (mm)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={planeY}
                      onChange={(e) => setPlaneY(parseFloat(e.target.value) || 0)}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>Orientation Plane</label>
                    <select
                      value={planePlane}
                      onChange={(e) => setPlanePlane(e.target.value)}
                      style={inputStyle}
                    >
                      <option value="G17">Top (G17 - XZ)</option>
                      <option value="G18">Front (G18 - XY)</option>
                      <option value="G19">Right (G19 - YZ)</option>
                    </select>
                  </div>
                </div>

                {/* Center Coordinates & Snaps */}
                <div style={{ background: '#161b26', padding: '12px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#06b6d4' }}>Center Offset &amp; Presets</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="modal-preset-btn"
                        onClick={() => {
                          setPlaneW(Math.round(defaultDim.x));
                          setPlaneD(Math.round(defaultDim.z));
                          setPlaneY(topY);
                          setPlaneCenter({ x: defaultCenter.x, z: defaultCenter.z });
                        }}
                      >
                        Snap Top Face
                      </button>
                      <button
                        className="modal-preset-btn"
                        onClick={() => {
                          setPlaneW(Math.round(defaultDim.x) + 10);
                          setPlaneD(Math.round(defaultDim.z) + 10);
                          setPlaneY(botY);
                          setPlaneCenter({ x: defaultCenter.x, z: defaultCenter.z });
                        }}
                      >
                        Snap Bottom Baseplate
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '10.5px', color: '#94a3b8' }}>Center X (mm)</label>
                      <input
                        type="number"
                        step="1"
                        value={planeCenter.x}
                        onChange={(e) => setPlaneCenter({ ...planeCenter, x: parseFloat(e.target.value) || 0 })}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10.5px', color: '#94a3b8' }}>Center Z (mm)</label>
                      <input
                        type="number"
                        step="1"
                        value={planeCenter.z}
                        onChange={(e) => setPlaneCenter({ ...planeCenter, z: parseFloat(e.target.value) || 0 })}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>

                {/* Opacity slider */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#0e1219', borderRadius: '6px', border: '1px solid #1f2737' }}>
                  <span style={{ fontSize: '12px', color: '#cbd5e1' }}>
                    Surface Transparency: <strong>{Math.round(planeOpacity * 100)}% Opacity</strong>
                  </span>
                  <input
                    type="range"
                    min="0.2"
                    max="1.0"
                    step="0.05"
                    value={planeOpacity}
                    onChange={(e) => setPlaneOpacity(parseFloat(e.target.value))}
                    style={{ width: '180px', accentColor: planeRole === 'check' ? '#f59e0b' : '#06b6d4' }}
                  />
                </div>

                <button
                  onClick={handleAddPlane}
                  style={{ ...primaryBtnStyle, backgroundColor: planeRole === 'check' ? '#d97706' : '#0891b2' }}
                >
                  <Plus size={16} />
                  <span>Insert Planar Surface Sheet into Level 15</span>
                </button>
              </div>
            )}

            {/* 2. CYLINDRICAL SURFACE */}
            {activeTool === 'cylinder' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #232c3d', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#10b981' }}>Cylindrical Surface Sleeve</div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                    Create open-ended cylindrical surface wraps, boss envelopes, or rotary avoidance barriers.
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>Radius R (mm)</label>
                    <input
                      type="number"
                      step="1"
                      value={cylRadius}
                      onChange={(e) => setCylRadius(parseFloat(e.target.value) || 1)}
                      style={inputStyle}
                    />
                    <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>
                      Ø{(cylRadius * 2).toFixed(1)} mm
                    </div>
                  </div>
                  <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>Height (mm)</label>
                    <input
                      type="number"
                      step="1"
                      value={cylHeight}
                      onChange={(e) => setCylHeight(parseFloat(e.target.value) || 1)}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>Base Elevation Y</label>
                    <input
                      type="number"
                      step="0.5"
                      value={cylY}
                      onChange={(e) => setCylY(parseFloat(e.target.value) || 0)}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>CAM Role</label>
                    <select
                      value={cylRole}
                      onChange={(e) => setCylRole(e.target.value)}
                      style={inputStyle}
                    >
                      <option value="drive">Drive Surface</option>
                      <option value="check">Check (Avoid)</option>
                    </select>
                  </div>
                </div>

                <div style={{ background: '#161b26', padding: '12px', borderRadius: '6px', border: '1px solid #232c3d', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8' }}>Center X (mm)</label>
                    <input
                      type="number"
                      step="1"
                      value={cylCenter.x}
                      onChange={(e) => setCylCenter({ ...cylCenter, x: parseFloat(e.target.value) || 0 })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8' }}>Center Z (mm)</label>
                    <input
                      type="number"
                      step="1"
                      value={cylCenter.z}
                      onChange={(e) => setCylCenter({ ...cylCenter, z: parseFloat(e.target.value) || 0 })}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <button onClick={handleAddCylinder} style={{ ...primaryBtnStyle, backgroundColor: '#059669' }}>
                  <Plus size={16} />
                  <span>Insert Cylindrical Surface into Level 15</span>
                </button>
              </div>
            )}

            {/* 3. EXTRUDED WALL SURFACE */}
            {activeTool === 'extrude' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #232c3d', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#8b5cf6' }}>Extruded Surface Shell</div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                    Extrudes a rectangular boundary upward along the vertical vector to form open side walls and pocket draft faces.
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>Width X (mm)</label>
                    <input
                      type="number"
                      step="1"
                      value={extW}
                      onChange={(e) => setExtW(parseFloat(e.target.value) || 10)}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>Depth Z (mm)</label>
                    <input
                      type="number"
                      step="1"
                      value={extD}
                      onChange={(e) => setExtD(parseFloat(e.target.value) || 10)}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>Extrusion Height</label>
                    <input
                      type="number"
                      step="1"
                      value={extHeight}
                      onChange={(e) => setExtHeight(parseFloat(e.target.value) || 5)}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>Base Elevation Y</label>
                    <input
                      type="number"
                      step="0.5"
                      value={extY}
                      onChange={(e) => setExtY(parseFloat(e.target.value) || 0)}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <button onClick={handleAddExtrude} style={{ ...primaryBtnStyle, backgroundColor: '#7c3aed' }}>
                  <Plus size={16} />
                  <span>Insert Extruded Surface into Level 15</span>
                </button>
              </div>
            )}

            {/* 4. REVOLVED SURFACE */}
            {activeTool === 'revolve' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #232c3d', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#ec4899' }}>Revolved / Conical Surface</div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                    Revolve a profile curve around the vertical spindle axis (turned surfaces, taper cones, and draft cones).
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>Bottom Radius R1</label>
                    <input
                      type="number"
                      step="1"
                      value={revRBot}
                      onChange={(e) => setRevRBot(parseFloat(e.target.value) || 1)}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>Top Radius R2</label>
                    <input
                      type="number"
                      step="1"
                      value={revRTop}
                      onChange={(e) => setRevRTop(parseFloat(e.target.value) || 0)}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>Height (mm)</label>
                    <input
                      type="number"
                      step="1"
                      value={revHeight}
                      onChange={(e) => setRevHeight(parseFloat(e.target.value) || 1)}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>Sweep Angle (Deg)</label>
                    <input
                      type="number"
                      step="15"
                      min="15"
                      max="360"
                      value={revSweep}
                      onChange={(e) => setRevSweep(parseFloat(e.target.value) || 360)}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <button onClick={handleAddRevolved} style={{ ...primaryBtnStyle, backgroundColor: '#db2777' }}>
                  <Plus size={16} />
                  <span>Insert Revolved Surface into Level 15</span>
                </button>
              </div>
            )}

            {/* 5. RULED LOFT SURFACE */}
            {activeTool === 'loft' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #232c3d', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#3b82f6' }}>Ruled Loft Surface</div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                    Generates a ruled loft surface linearly blending between a lower profile frame and an upper profile frame.
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: '#161b26', padding: '12px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#38bdf8', marginBottom: '6px' }}>Bottom Profile (Stage 1)</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ fontSize: '10px', color: '#94a3b8' }}>Width (mm)</label>
                        <input
                          type="number"
                          step="1"
                          value={loftBotW}
                          onChange={(e) => setLoftBotW(parseFloat(e.target.value) || 10)}
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', color: '#94a3b8' }}>Depth (mm)</label>
                        <input
                          type="number"
                          step="1"
                          value={loftBotD}
                          onChange={(e) => setLoftBotD(parseFloat(e.target.value) || 10)}
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ background: '#161b26', padding: '12px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#a855f7', marginBottom: '6px' }}>Top Profile (Stage 2)</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ fontSize: '10px', color: '#94a3b8' }}>Width (mm)</label>
                        <input
                          type="number"
                          step="1"
                          value={loftTopW}
                          onChange={(e) => setLoftTopW(parseFloat(e.target.value) || 10)}
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', color: '#94a3b8' }}>Depth (mm)</label>
                        <input
                          type="number"
                          step="1"
                          value={loftTopD}
                          onChange={(e) => setLoftTopD(parseFloat(e.target.value) || 10)}
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button onClick={handleAddLoft} style={{ ...primaryBtnStyle, backgroundColor: '#2563eb' }}>
                  <Plus size={16} />
                  <span>Insert Ruled Loft Surface into Level 15</span>
                </button>
              </div>
            )}

            {/* 6. CAP HOLES / PATCH */}
            {activeTool === 'cap' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #232c3d', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#38bdf8' }}>Cap Holes / Surface Patch (CAM Feature)</div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                    Mastercam standard hole capping patch: prevents 3D surface finishing endmills from plunging or dipping into holes.
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>Hole Radius R (mm)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={capRadius}
                      onChange={(e) => setCapRadius(parseFloat(e.target.value) || 1)}
                      style={inputStyle}
                    />
                    <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>
                      Covers Hole Ø{(capRadius * 2).toFixed(1)} mm
                    </div>
                  </div>
                  <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>Elevation Y (mm)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={capY}
                      onChange={(e) => setCapY(parseFloat(e.target.value) || 0)}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>Preset Holes</label>
                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                      <button className="modal-preset-btn" onClick={() => setCapRadius(3.4)}>M8 (Ø6.8)</button>
                      <button className="modal-preset-btn" onClick={() => setCapRadius(4.25)}>M10 (Ø8.5)</button>
                      <button className="modal-preset-btn" onClick={() => setCapRadius(5.1)}>M12 (Ø10.2)</button>
                    </div>
                  </div>
                </div>

                <button onClick={handleAddHoleCap} style={primaryBtnStyle}>
                  <ShieldCheck size={16} />
                  <span>Insert Hole Capping Patch into Level 15</span>
                </button>
              </div>
            )}

            {/* 7. FILLET BLEND SHEET */}
            {activeTool === 'fillet' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #232c3d', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#14b8a6' }}>Surface Fillet Blend Sheet</div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                    Create smooth radial blend transition sheets between adjacent planar or perpendicular surfaces.
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>Fillet Radius R (mm)</label>
                    <input
                      type="number"
                      step="1"
                      value={filletRad}
                      onChange={(e) => setFilletRad(parseFloat(e.target.value) || 1)}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>Span Length (mm)</label>
                    <input
                      type="number"
                      step="1"
                      value={filletLen}
                      onChange={(e) => setFilletLen(parseFloat(e.target.value) || 10)}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>Blend Arc Angle</label>
                    <input
                      type="number"
                      step="15"
                      value={filletAngle}
                      onChange={(e) => setFilletAngle(parseFloat(e.target.value) || 90)}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <button onClick={handleAddFilletBlend} style={{ ...primaryBtnStyle, backgroundColor: '#0d9488' }}>
                  <Plus size={16} />
                  <span>Insert Fillet Blend Surface into Level 15</span>
                </button>
              </div>
            )}

            {/* 8. DRIVE & CHECK SURFACE MANAGER */}
            {activeTool === 'list' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #232c3d', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#38bdf8' }}>Level 15 Surface Manager</div>
                    <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                      Inspect, classify as Drive or Check surface, or remove 3D surface sheets.
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("Clear all surfaces from Level 15?")) onClearSurfaces();
                    }}
                    disabled={surfaceEntities.length === 0}
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
                      cursor: surfaceEntities.length === 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Clear All</span>
                  </button>
                </div>

                {surfaceEntities.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                    <Layers size={36} color="#334155" style={{ margin: '0 auto 10px' }} />
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>No surface entities created on Level 15 yet</div>
                    <div style={{ fontSize: '11px', marginTop: '4px' }}>
                      Use the surface tools on the left to create planar sheets, cylindrical sleeves, or CAM hole caps.
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {surfaceEntities.map((ent, idx) => {
                      const isCheck = ent.userData?.role === 'check';
                      return (
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
                            <div style={{ width: '9px', height: '9px', borderRadius: '2px', backgroundColor: isCheck ? '#f59e0b' : '#06b6d4' }} />
                            <div>
                              <div style={{ fontWeight: 600, color: '#f8fafc' }}>{ent.name || `Surface_${idx + 1}`}</div>
                              <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                                Type: {ent.userData?.type || 'Surface'} | Role: <strong style={{ color: isCheck ? '#f59e0b' : '#38bdf8' }}>{isCheck ? 'CHECK (Avoid)' : 'DRIVE (Machine)'}</strong>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              onClick={() => {
                                ent.visible = !ent.visible;
                                alert(`Surface visibility toggled.`);
                              }}
                              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                              title="Toggle visibility"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              onClick={() => onRemoveSurfaceEntity && onRemoveSurfaceEntity(ent)}
                              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                              title="Delete surface"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
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
            Check surfaces (amber) prevent collision and are protected during 3D waterline and swarf finishing passes.
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '6px 16px',
              backgroundColor: '#0891b2',
              border: 'none',
              borderRadius: '4px',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close Surfaces Suite
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
  backgroundColor: '#0891b2',
  border: 'none',
  borderRadius: '5px',
  color: '#ffffff',
  fontSize: '12.5px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background-color 0.15s ease',
  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
};
