import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X, Check, Activity, Compass, Layers, ShieldCheck, Zap, Sliders,
  RefreshCw, CornerUpRight, Cpu, AlertTriangle
} from 'lucide-react';
import {
  MULTIAXIS_ROUGHING_PAGES,
  ROUGHING_MATERIALS_DB,
  ROUGHING_PRESETS,
  calculateMultiaxisRoughingPhysics,
  createDefaultMultiaxisRoughingParams,
  resolveDefaultRoughingTool
} from '../config/multiaxisRoughingSchema.js';

export default function MultiaxisRoughingModal({
  isOpen,
  onClose,
  operation = null,
  tools = [],
  activeMachine = null,
  machines = [],
  onSelectMachine = null,
  lastDefinedTool = null,
  stockConfig = null,
  currentModel = null,
  onSaveOperation,
  onNotify,
  onOpenToolLibrary = null
}) {
  if (!isOpen) return null;

  const [activePage, setActivePage] = useState('toolpath_type');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, posX: 0, posY: 0 });

  // Initialize form state
  const [formState, setFormState] = useState(() => {
    const defaultTool = resolveDefaultRoughingTool(tools);
    const initial = createDefaultMultiaxisRoughingParams(operation || {}, defaultTool);
    if (operation) {
      return {
        ...initial,
        ...operation,
        tool: { ...initial.tool, ...(operation.tool || {}) },
        cavityGeometry: { ...initial.cavityGeometry, ...(operation.cavityGeometry || {}) },
        cutParameters: { ...initial.cutParameters, ...(operation.cutParameters || {}) },
        restRoughing: { ...initial.restRoughing, ...(operation.restRoughing || {}) },
        toolAxisControl: { ...initial.toolAxisControl, ...(operation.toolAxisControl || {}) },
        collisionControl: { ...initial.collisionControl, ...(operation.collisionControl || {}) },
        linkingParameters: { ...initial.linkingParameters, ...(operation.linkingParameters || {}) },
        machineKinematics: { ...initial.machineKinematics, ...(operation.machineKinematics || {}) }
      };
    }
    return initial;
  });

  // Calculate live cutting physics
  const livePhysics = useMemo(() => {
    return calculateMultiaxisRoughingPhysics({
      toolDiameter: formState.tool.diameter,
      fluteCount: formState.tool.fluteCount,
      stepoverPct: formState.cutParameters.stepoverPct,
      axialStepdownMm: formState.cutParameters.axialStepdownMm,
      materialId: formState.tool.materialId,
      spindleRpm: formState.tool.spindleSpeed,
      feedPerTooth: formState.tool.feedPerTooth
    });
  }, [
    formState.tool.diameter,
    formState.tool.fluteCount,
    formState.cutParameters.stepoverPct,
    formState.cutParameters.axialStepdownMm,
    formState.tool.materialId,
    formState.tool.spindleSpeed,
    formState.tool.feedPerTooth
  ]);

  // Window Drag Clamping & Mouse Handlers
  const handleMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select')) return;
    setIsDragging(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, posX: position.x, posY: position.y };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPosition({
      x: dragRef.current.posX + dx,
      y: Math.max(-200, Math.min(window.innerHeight - 300, dragRef.current.posY + dy))
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Preset Selection
  const applyPreset = (presetKey) => {
    const preset = ROUGHING_PRESETS[presetKey];
    if (!preset) return;
    setFormState((prev) => ({
      ...prev,
      tool: {
        ...prev.tool,
        feedRate: preset.feedRate,
        spindleSpeed: preset.spindleSpeed,
        materialId: preset.materialId
      },
      cutParameters: {
        ...prev.cutParameters,
        stepoverPct: preset.stepoverPct,
        axialStepdownMm: preset.axialStepdownMm
      },
      toolAxisControl: {
        ...prev.toolAxisControl,
        tiltingMode: preset.tiltingMode,
        maxTiltAngleDeg: preset.maxTiltAngleDeg
      },
      linkingParameters: {
        ...prev.linkingParameters,
        helicalRampAngleDeg: preset.rampAngleDeg,
        microLiftMm: preset.microLiftMm
      }
    }));
    onNotify?.(`Applied 5-Axis Roughing Preset: ${preset.name}`, 'info');
  };

  // Save Operation
  const handleSave = () => {
    onSaveOperation?.({
      ...formState,
      id: operation?.id,
      strategy: '5axis_rough',
      strategyKey: '5axis_rough',
      badge: '5X-ROUGH',
      badgeClass: '5axis_rough',
      badgeText: '5X-ROUGH',
      color: '#06b6d4',
      physics: livePhysics
    });
    onClose?.();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.55)',
      backdropFilter: 'blur(2px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        width: '950px',
        maxWidth: '96vw',
        height: '675px',
        maxHeight: 'calc(100vh - 80px)',
        backgroundColor: '#f1f5f9',
        border: '1px solid #94a3b8',
        borderRadius: '6px',
        boxShadow: '0 20px 45px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transform: `translate(${position.x}px, ${position.y}px)`,
        fontFamily: 'Segoe UI, -apple-system, BlinkMacSystemFont, sans-serif'
      }}>
        {/* Title Bar */}
        <div
          onMouseDown={handleMouseDown}
          style={{
            height: '38px',
            backgroundColor: '#1e293b',
            color: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 12px',
            cursor: 'grab',
            userSelect: 'none',
            borderBottom: '1px solid #0f172a'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={17} color="#06b6d4" />
            <strong style={{ fontSize: '12.5px', letterSpacing: '0.2px' }}>
              Argus CAM Intelligence 5-Axis Multiaxis Roughing &amp; Pocketing Studio
            </strong>
            <span style={{
              fontSize: '10px',
              backgroundColor: '#06b6d4',
              color: '#0f172a',
              padding: '1px 6px',
              borderRadius: '3px',
              fontWeight: 800
            }}>
              ROUGH 5X
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
              borderRadius: '3px'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Sidebar Navigation Tree */}
          <div style={{
            width: '235px',
            backgroundColor: '#e2e8f0',
            borderRight: '1px solid #cbd5e1',
            display: 'flex',
            flexDirection: 'column',
            userSelect: 'none'
          }}>
            <div style={{ padding: '8px 12px', fontSize: '10.5px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Roughing Tree Navigation
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {MULTIAXIS_ROUGHING_PAGES.map((page) => {
                const isActive = activePage === page.id;
                return (
                  <div
                    key={page.id}
                    onClick={() => setActivePage(page.id)}
                    style={{
                      padding: '8px 14px',
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: isActive ? '#ffffff' : 'transparent',
                      color: isActive ? '#0f172a' : '#475569',
                      fontWeight: isActive ? 600 : 400,
                      borderLeft: isActive ? '4px solid #06b6d4' : '4px solid transparent',
                      transition: 'all 0.1s ease'
                    }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = '#ecf0f5'; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <span style={{ color: isActive ? '#06b6d4' : '#64748b' }}>•</span>
                    {page.label}
                  </div>
                );
              })}
            </div>

            {/* Live Physics Quick Readout in Sidebar */}
            <div style={{ padding: '10px 12px', borderTop: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '10.5px', lineHeight: '1.5' }}>
              <div style={{ color: '#0f172a', fontWeight: 700, marginBottom: '2px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Material Removal (MRR):</span>
                <span style={{ color: '#0284c7', fontWeight: 800 }}>{livePhysics.mrrCm3Min} cm³/min</span>
              </div>
              <div style={{ color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                <span>Spindle Power:</span>
                <span>{livePhysics.powerKw} kW</span>
              </div>
              <div style={{ color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                <span>Cutting Force Fc:</span>
                <span>{livePhysics.cuttingForceFc} N</span>
              </div>
              <div style={{ color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                <span>Engagement:</span>
                <span>{livePhysics.engagementDeg}° ({livePhysics.stepoverPct}%)</span>
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {/* Industry Presets Quick Selector */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              backgroundColor: '#ffffff',
              borderRadius: '4px',
              border: '1px solid #cbd5e1',
              marginBottom: '14px'
            }}>
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#334155' }}>Presets:</span>
              {Object.entries(ROUGHING_PRESETS).map(([k, p]) => (
                <button
                  key={k}
                  onClick={() => applyPreset(k)}
                  style={{
                    padding: '3px 8px',
                    fontSize: '10.5px',
                    borderRadius: '3px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#f1f5f9',
                    color: '#334155',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
                >
                  {p.name}
                </button>
              ))}
            </div>

            {/* Page 1: Toolpath Type */}
            {activePage === 'toolpath_type' && (
              <div>
                <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px 14px', backgroundColor: '#ffffff', marginBottom: '14px' }}>
                  <legend style={{ padding: '0 4px', color: '#1e293b', fontWeight: 600, fontSize: '11.5px' }}>Multiaxis Cavity Clearing Strategy</legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Operation Name</label>
                      <input
                        type="text"
                        value={formState.name}
                        onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Roughing Motion Style</label>
                      <select
                        value={formState.toolpathType.motionType}
                        onChange={(e) => setFormState({ ...formState, toolpathType: { ...formState.toolpathType, motionType: e.target.value } })}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px' }}
                      >
                        <option value="dynamic_trochoidal">Adaptive Dynamic Motion (Constant Engagement)</option>
                        <option value="offset_pocket">Morphing Offset Pocketing</option>
                        <option value="zigzag">Zigzag Raster Cavity Clearing</option>
                      </select>
                    </div>
                  </div>
                </fieldset>

                {/* Interactive SVG 3D Cavity Diagram */}
                <div style={{
                  padding: '12px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px'
                }}>
                  <svg width="220" height="130" viewBox="0 0 220 130" style={{ background: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                    {/* Deep Cavity Wall with Draft */}
                    <path d="M 20 20 L 50 110 Q 110 120 170 110 L 200 20 Z" fill="#94a3b8" stroke="#475569" strokeWidth="1.5" />
                    {/* Contoured 3D Floor */}
                    <path d="M 50 110 Q 110 120 170 110" fill="none" stroke="#06b6d4" strokeWidth="2.5" />

                    {/* Multi-depth roughing slice lines */}
                    <path d="M 32 45 Q 110 52 188 45" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" />
                    <path d="M 40 75 Q 110 82 180 75" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" />

                    {/* Helical Ramp Plunge in center */}
                    <path d="M 110 20 C 120 30 100 40 110 50 C 120 60 100 70 110 80" stroke="#f59e0b" strokeWidth="1.5" fill="none" />

                    {/* 5-Axis Tilted Tool clearing undercut corner */}
                    <g transform="translate(62, 95) rotate(-22)">
                      <rect x="-6" y="-30" width="12" height="30" fill="#06b6d4" stroke="#0e7490" strokeWidth="1" />
                      <circle cx="0" cy="0" r="6" fill="#0891b2" />
                      <line x1="0" y1="-30" x2="0" y2="-45" stroke="#0284c7" strokeWidth="1.5" />
                    </g>

                    <text x="75" y="40" fontSize="9" fill="#0f172a" fontWeight="700">Helical Ramp</text>
                    <text x="12" y="105" fontSize="9" fill="#0891b2" fontWeight="700">5X Tilt</text>
                    <text x="90" y="125" fontSize="9" fill="#0e7490" fontWeight="600">3D Contoured Floor</text>
                  </svg>

                  <div style={{ flex: 1, fontSize: '11px', color: '#334155', lineHeight: '1.5' }}>
                    <strong style={{ color: '#0f172a', fontSize: '11.5px' }}>5-Axis Dynamic Cavity Clearing:</strong>
                    <br />
                    Eliminates long, vibration-prone tool overhangs (L/D &gt; 8). The cutter dynamically tilts to reach under drafted walls and overhangs while keeping tool gage length short and rigid (L/D &le; 3).
                    <br /><br />
                    Constant radial engagement ($a_e = {formState.cutParameters.stepoverPct}\% D$) allows heavy axial depths ($a_p = {formState.cutParameters.axialStepdownMm} \text{ mm}$), yielding maximum material removal rate (<span style={{ color: '#0284c7', fontWeight: 800 }}>{livePhysics.mrrCm3Min} cm³/min</span>).
                  </div>
                </div>
              </div>
            )}

            {/* Page 2: Cavity & Floor Geometry */}
            {activePage === 'cavity_geometry' && (
              <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '14px', backgroundColor: '#ffffff' }}>
                <legend style={{ padding: '0 4px', color: '#1e293b', fontWeight: 600, fontSize: '11.5px' }}>Cavity &amp; 3D Floor Definition</legend>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Floor Surface Type</label>
                    <select
                      value={formState.cavityGeometry.floorType}
                      onChange={(e) => setFormState({ ...formState, cavityGeometry: { ...formState.cavityGeometry, floorType: e.target.value } })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    >
                      <option value="contoured_3d_floor">Contoured 3D Freeform Floor</option>
                      <option value="planar_floor">Flat Planar Bottom Floor</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Draft Wall Angle (°)</label>
                    <input
                      type="number"
                      step="1"
                      value={formState.cavityGeometry.wallDraftAngleDeg}
                      onChange={(e) => setFormState({ ...formState, cavityGeometry: { ...formState.cavityGeometry, wallDraftAngleDeg: Number(e.target.value) } })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Top Stock Z (mm)</label>
                    <input
                      type="number"
                      value={formState.cavityGeometry.topStockZ}
                      onChange={(e) => setFormState({ ...formState, cavityGeometry: { ...formState.cavityGeometry, topStockZ: Number(e.target.value) } })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Floor Depth Z (mm)</label>
                    <input
                      type="number"
                      value={formState.cavityGeometry.floorDepthZ}
                      onChange={(e) => setFormState({ ...formState, cavityGeometry: { ...formState.cavityGeometry, floorDepthZ: Number(e.target.value) } })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    />
                  </div>
                </div>
              </fieldset>
            )}

            {/* Page 3: Tool & Physics */}
            {activePage === 'tool' && (
              <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '14px', backgroundColor: '#ffffff' }}>
                <legend style={{ padding: '0 4px', color: '#1e293b', fontWeight: 600, fontSize: '11.5px' }}>Tool Definition &amp; Cutting Dynamics</legend>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Cutter Type</label>
                    <select
                      value={formState.tool.type}
                      onChange={(e) => setFormState({ ...formState, tool: { ...formState.tool, type: e.target.value } })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    >
                      <option value="bullnose">Bullnose End Mill (Toroidal with Corner Rad)</option>
                      <option value="flat_end">Flat End Mill (Solid Carbide)</option>
                      <option value="high_feed">High-Feed Milling Cutter</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Diameter (mm)</label>
                    <input
                      type="number"
                      step="1"
                      value={formState.tool.diameter}
                      onChange={(e) => setFormState({ ...formState, tool: { ...formState.tool, diameter: Number(e.target.value) } })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Workpiece Material</label>
                    <select
                      value={formState.tool.materialId}
                      onChange={(e) => setFormState({ ...formState, tool: { ...formState.tool, materialId: e.target.value } })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    >
                      {Object.values(ROUGHING_MATERIALS_DB).map((m) => (
                        <option key={m.id} value={m.id}>{m.name} ({m.hardness})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Spindle Speed (RPM)</label>
                    <input
                      type="number"
                      value={formState.tool.spindleSpeed}
                      onChange={(e) => setFormState({ ...formState, tool: { ...formState.tool, spindleSpeed: Number(e.target.value) } })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    />
                  </div>
                </div>

                {/* Physics Summary Box */}
                <div style={{ padding: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11px' }}>
                  <strong style={{ color: '#0f172a' }}>Cutting Physics &amp; Volumetric Removal:</strong>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '6px' }}>
                    <div>MRR: <strong style={{ color: '#0284c7' }}>{livePhysics.mrrCm3Min} cm³/min</strong></div>
                    <div>Cutting Power: <strong>{livePhysics.powerKw} kW</strong></div>
                    <div>Cutting Force: <strong>{livePhysics.cuttingForceFc} N</strong></div>
                    <div>Spindle Torque: <strong>{livePhysics.torqueNm} N·m</strong></div>
                    <div>Table Feed: <strong>{livePhysics.tableFeedMmMin} mm/min</strong></div>
                    <div>Engagement: <strong>{livePhysics.engagementDeg}°</strong></div>
                  </div>
                </div>
              </fieldset>
            )}

            {/* Page 4: Holder & Overhang */}
            {activePage === 'holder' && (
              <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '14px', backgroundColor: '#ffffff' }}>
                <legend style={{ padding: '0 4px', color: '#1e293b', fontWeight: 600, fontSize: '11.5px' }}>Holder Definition &amp; Tool Overhang</legend>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Holder Type</label>
                    <select
                      value={formState.holder.type}
                      onChange={(e) => setFormState({ ...formState, holder: { ...formState.holder, type: e.target.value } })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    >
                      <option value="HSK63_HYDRAULIC">HSK-A63 Heavy Hydraulic Chuck</option>
                      <option value="BT40_POWER_MILL">BT40 Power Milling Chuck</option>
                      <option value="CAT40_SHRINK">CAT40 Heavy Shrink-Fit</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Gage Length (mm)</label>
                    <input
                      type="number"
                      value={formState.holder.gaugeLengthMm}
                      onChange={(e) => setFormState({ ...formState, holder: { ...formState.holder, gaugeLengthMm: Number(e.target.value) } })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Shank Clearance Buffer (mm)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formState.holder.shankClearanceMm}
                      onChange={(e) => setFormState({ ...formState, holder: { ...formState.holder, shankClearanceMm: Number(e.target.value) } })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Holder Clearance Buffer (mm)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formState.holder.holderClearanceMm}
                      onChange={(e) => setFormState({ ...formState, holder: { ...formState.holder, holderClearanceMm: Number(e.target.value) } })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    />
                  </div>
                </div>
              </fieldset>
            )}

            {/* Page 5: Cut Parameters */}
            {activePage === 'cut_parameters' && (
              <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '14px', backgroundColor: '#ffffff' }}>
                <legend style={{ padding: '0 4px', color: '#1e293b', fontWeight: 600, fontSize: '11.5px' }}>Dynamic Cut Parameters &amp; Stock Allowances</legend>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>
                      Radial Stepover: <strong>{formState.cutParameters.stepoverPct}% ({livePhysics.radialStepoverMm} mm)</strong>
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="70"
                      step="1"
                      value={formState.cutParameters.stepoverPct}
                      onChange={(e) => setFormState({
                        ...formState,
                        cutParameters: { ...formState.cutParameters, stepoverPct: Number(e.target.value) }
                      })}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Axial Stepdown ap (mm)</label>
                    <input
                      type="number"
                      step="1"
                      value={formState.cutParameters.axialStepdownMm}
                      onChange={(e) => setFormState({
                        ...formState,
                        cutParameters: { ...formState.cutParameters, axialStepdownMm: Number(e.target.value) }
                      })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Stock to Leave on Walls (mm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formState.cutParameters.wallStockToLeaveMm}
                      onChange={(e) => setFormState({
                        ...formState,
                        cutParameters: { ...formState.cutParameters, wallStockToLeaveMm: Number(e.target.value) }
                      })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Stock to Leave on Floors (mm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formState.cutParameters.floorStockToLeaveMm}
                      onChange={(e) => setFormState({
                        ...formState,
                        cutParameters: { ...formState.cutParameters, floorStockToLeaveMm: Number(e.target.value) }
                      })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    />
                  </div>
                </div>
              </fieldset>
            )}

            {/* Page 6: Rest Roughing */}
            {activePage === 'rest_roughing' && (
              <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '14px', backgroundColor: '#ffffff' }}>
                <legend style={{ padding: '0 4px', color: '#1e293b', fontWeight: 600, fontSize: '11.5px' }}>Rest Material Detection</legend>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formState.restRoughing.enabled}
                      onChange={(e) => setFormState({
                        ...formState,
                        restRoughing: { ...formState.restRoughing, enabled: e.target.checked }
                      })}
                    />
                    <strong>Enable Rest Material Roughing (Clear unmachined corners from previous tool)</strong>
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', opacity: formState.restRoughing.enabled ? 1 : 0.5 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Previous Tool Diameter (mm)</label>
                      <input
                        type="number"
                        disabled={!formState.restRoughing.enabled}
                        value={formState.restRoughing.previousToolDiameterMm}
                        onChange={(e) => setFormState({
                          ...formState,
                          restRoughing: { ...formState.restRoughing, previousToolDiameterMm: Number(e.target.value) }
                        })}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Previous Corner Radius (mm)</label>
                      <input
                        type="number"
                        disabled={!formState.restRoughing.enabled}
                        value={formState.restRoughing.previousCornerRadMm}
                        onChange={(e) => setFormState({
                          ...formState,
                          restRoughing: { ...formState.restRoughing, previousCornerRadMm: Number(e.target.value) }
                        })}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                      />
                    </div>
                  </div>
                </div>
              </fieldset>
            )}

            {/* Page 7: Tool Axis Tilting */}
            {activePage === 'tool_axis_control' && (
              <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '14px', backgroundColor: '#ffffff' }}>
                <legend style={{ padding: '0 4px', color: '#1e293b', fontWeight: 600, fontSize: '11.5px' }}>5-Axis Tilting Strategy &amp; Limit Envelope</legend>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Tilting Mode</label>
                    <select
                      value={formState.toolAxisControl.tiltingMode}
                      onChange={(e) => setFormState({ ...formState, toolAxisControl: { ...formState.toolAxisControl, tiltingMode: e.target.value } })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    >
                      <option value="continuous_5x">Continuous Simultaneous 5-Axis Dynamic Tilting</option>
                      <option value="auto_indexed_3plus2">3+2 Auto-Indexed Multi-Directional Zones</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Maximum Tilt Angle (°)</label>
                    <input
                      type="number"
                      step="5"
                      value={formState.toolAxisControl.maxTiltAngleDeg}
                      onChange={(e) => setFormState({ ...formState, toolAxisControl: { ...formState.toolAxisControl, maxTiltAngleDeg: Number(e.target.value) } })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Primary Orientation Reference</label>
                    <select
                      value={formState.toolAxisControl.primaryAxis}
                      onChange={(e) => setFormState({ ...formState, toolAxisControl: { ...formState.toolAxisControl, primaryAxis: e.target.value } })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    >
                      <option value="floor_normal">3D Contoured Floor Surface Normal</option>
                      <option value="cavity_centerline">Cavity Draft Centerline</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Side Tilt Safety Bias (°)</label>
                    <input
                      type="number"
                      step="1"
                      value={formState.toolAxisControl.sideTiltAngleDeg}
                      onChange={(e) => setFormState({ ...formState, toolAxisControl: { ...formState.toolAxisControl, sideTiltAngleDeg: Number(e.target.value) } })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    />
                  </div>
                </div>
              </fieldset>
            )}

            {/* Page 8: Collision Control & Auto-Tilt */}
            {activePage === 'collision_control' && (
              <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '14px', backgroundColor: '#ffffff' }}>
                <legend style={{ padding: '0 4px', color: '#1e293b', fontWeight: 600, fontSize: '11.5px' }}>Collision Avoidance &amp; Wall Leaning</legend>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formState.collisionControl.enableAutoTilt}
                      onChange={(e) => setFormState({
                        ...formState,
                        collisionControl: { ...formState.collisionControl, enableAutoTilt: e.target.checked }
                      })}
                    />
                    <strong>Enable Automatic Tool Tilting to Avoid Cavity Walls &amp; Clamps</strong>
                  </label>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Reaction Strategy</label>
                    <select
                      value={formState.collisionControl.tiltStrategy}
                      onChange={(e) => setFormState({ ...formState, collisionControl: { ...formState.collisionControl, tiltStrategy: e.target.value } })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    >
                      <option value="tilt_away_normal">Tilt Tool Away from Wall (Maintain Tool Tip Contact)</option>
                      <option value="retract_along_vector">Retract along Tool Vector</option>
                    </select>
                  </div>
                </div>
              </fieldset>
            )}

            {/* Page 9: Linking & 3D Micro-Lift */}
            {activePage === 'linking_parameters' && (
              <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '14px', backgroundColor: '#ffffff' }}>
                <legend style={{ padding: '0 4px', color: '#1e293b', fontWeight: 600, fontSize: '11.5px' }}>Linking &amp; 3D Micro-Lift Return Moves</legend>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>3D Micro-Lift Distance (mm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formState.linkingParameters.microLiftMm}
                      onChange={(e) => setFormState({ ...formState, linkingParameters: { ...formState.linkingParameters, microLiftMm: Number(e.target.value) } })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    />
                    <span style={{ fontSize: '10px', color: '#64748b' }}>Prevents cutter rubbing on non-cutting returns</span>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Helical Ramp Entry Angle (°)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formState.linkingParameters.helicalRampAngleDeg}
                      onChange={(e) => setFormState({ ...formState, linkingParameters: { ...formState.linkingParameters, helicalRampAngleDeg: Number(e.target.value) } })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Clearance Plane Z (mm)</label>
                    <input
                      type="number"
                      value={formState.linkingParameters.clearancePlaneMm}
                      onChange={(e) => setFormState({ ...formState, linkingParameters: { ...formState.linkingParameters, clearancePlaneMm: Number(e.target.value) } })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Micro-Lift Feedrate (mm/min)</label>
                    <input
                      type="number"
                      value={formState.linkingParameters.microLiftFeedRate}
                      onChange={(e) => setFormState({ ...formState, linkingParameters: { ...formState.linkingParameters, microLiftFeedRate: Number(e.target.value) } })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    />
                  </div>
                </div>
              </fieldset>
            )}

            {/* Page 10: Machine Kinematics & Post */}
            {activePage === 'machine_kinematics' && (
              <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '14px', backgroundColor: '#ffffff' }}>
                <legend style={{ padding: '0 4px', color: '#1e293b', fontWeight: 600, fontSize: '11.5px' }}>Machine Kinematics &amp; Multi-Controller TCPM</legend>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>5-Axis Machine Architecture</label>
                    <select
                      value={formState.machineKinematics.kinematicsType}
                      onChange={(e) => setFormState({ ...formState, machineKinematics: { ...formState.machineKinematics, kinematicsType: e.target.value } })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    >
                      <option value="table_table">Table-Table (A-Tilt / C-Rotary Trunnion)</option>
                      <option value="head_table">Head-Table (B-Swivel Head / C-Table)</option>
                      <option value="head_head">Head-Head (A/B Spindle Gantry)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Controller Post Dialect</label>
                    <select
                      value={formState.machineKinematics.controllerDialect}
                      onChange={(e) => setFormState({ ...formState, machineKinematics: { ...formState.machineKinematics, controllerDialect: e.target.value } })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    >
                      <option value="fanuc">Fanuc 30i/31i (G43.4 TCPM / G68.2 TWP)</option>
                      <option value="haas">Haas NGC (G234 TCPC / G254 DWO)</option>
                      <option value="siemens">Siemens Sinumerik 840D (TRAORI)</option>
                      <option value="heidenhain">Heidenhain TNC 640 (FUNCTION TCPM)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Work Coordinate System</label>
                    <input
                      type="text"
                      value={formState.machineKinematics.workCoordinateSystem}
                      onChange={(e) => setFormState({ ...formState, machineKinematics: { ...formState.machineKinematics, workCoordinateSystem: e.target.value } })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Coolant Supply</label>
                    <select
                      value={formState.machineKinematics.coolantMode}
                      onChange={(e) => setFormState({ ...formState, machineKinematics: { ...formState.machineKinematics, coolantMode: e.target.value } })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    >
                      <option value="flood">Flood Coolant (M08)</option>
                      <option value="thru_spindle">Thru-Spindle High Pressure (M88)</option>
                      <option value="air_blast">Cold Air Blast (M07)</option>
                    </select>
                  </div>
                </div>
              </fieldset>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          height: '46px',
          backgroundColor: '#ffffff',
          borderTop: '1px solid #cbd5e1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 14px',
          gap: '8px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '6px 14px',
              fontSize: '11.5px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#fff',
              color: '#334155',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '6px 16px',
              fontSize: '11.5px',
              fontWeight: 700,
              border: '1px solid #0891b2',
              backgroundColor: '#06b6d4',
              color: '#0f172a',
              borderRadius: '3px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}
          >
            <Check size={15} /> OK / Generate Toolpath
          </button>
        </div>
      </div>
    </div>
  );
}
