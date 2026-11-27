import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X, Check, Activity, Compass, Layers, ShieldCheck, Zap, Sliders,
  Target, CornerUpRight, Cpu, Info, AlertTriangle, RefreshCw
} from 'lucide-react';
import {
  MULTIAXIS_DEBURR_PAGES,
  DEBURR_MATERIALS_DB,
  DEBURR_PRESETS,
  calculateMultiaxisDeburrPhysics,
  createDefaultMultiaxisDeburrParams,
  resolveDefaultDeburrTool
} from '../config/multiaxisDeburrSchema.js';

export default function MultiaxisDeburrModal({
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

  // Initialize or populate form state
  const [formState, setFormState] = useState(() => {
    const defaultTool = resolveDefaultDeburrTool(tools);
    const initial = createDefaultMultiaxisDeburrParams(operation || {}, defaultTool);
    if (operation) {
      return {
        ...initial,
        ...operation,
        tool: { ...initial.tool, ...(operation.tool || {}) },
        edgeDetection: { ...initial.edgeDetection, ...(operation.edgeDetection || {}) },
        cutParameters: { ...initial.cutParameters, ...(operation.cutParameters || {}) },
        contactPoint: { ...initial.contactPoint, ...(operation.contactPoint || {}) },
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
    return calculateMultiaxisDeburrPhysics({
      toolDiameter: formState.tool.diameter,
      fluteCount: formState.tool.fluteCount,
      contactAngleDeg: formState.contactPoint.contactAngleDeg,
      chamferWidthMm: formState.cutParameters.chamferWidthMm,
      materialId: formState.tool.materialId,
      spindleRpm: formState.tool.spindleSpeed,
      feedPerTooth: formState.tool.feedPerTooth
    });
  }, [
    formState.tool.diameter,
    formState.tool.fluteCount,
    formState.contactPoint.contactAngleDeg,
    formState.cutParameters.chamferWidthMm,
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
    const preset = DEBURR_PRESETS[presetKey];
    if (!preset) return;
    setFormState((prev) => ({
      ...prev,
      tool: {
        ...prev.tool,
        type: preset.cutterType,
        feedRate: preset.feedRate,
        spindleSpeed: preset.spindleSpeed
      },
      cutParameters: {
        ...prev.cutParameters,
        chamferWidthMm: preset.chamferWidthMm,
        numPasses: preset.numPasses
      },
      contactPoint: {
        ...prev.contactPoint,
        contactAngleDeg: preset.contactAngleDeg
      },
      toolAxisControl: {
        ...prev.toolAxisControl,
        leadAngleDeg: preset.leadAngleDeg,
        tiltAngleDeg: preset.tiltAngleDeg
      }
    }));
    onNotify?.(`Applied 5-Axis Deburr Preset: ${preset.name}`, 'info');
  };

  // Save Operation
  const handleSave = () => {
    onSaveOperation?.({
      ...formState,
      id: operation?.id,
      strategy: '5axis_deburr',
      strategyKey: '5axis_deburr',
      badge: '5X-DEBURR',
      badgeClass: '5axis_deburr',
      badgeText: '5X-DEBURR',
      color: '#f59e0b',
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
        width: '940px',
        maxWidth: '96vw',
        height: '670px',
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
            <Compass size={17} color="#f59e0b" />
            <strong style={{ fontSize: '12.5px', letterSpacing: '0.2px' }}>
              Argus CAM Intelligence 5-Axis Multiaxis Deburring Studio
            </strong>
            <span style={{
              fontSize: '10px',
              backgroundColor: '#f59e0b',
              color: '#0f172a',
              padding: '1px 6px',
              borderRadius: '3px',
              fontWeight: 800
            }}>
              DEBURR 5X
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
              Deburring Tree Navigation
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {MULTIAXIS_DEBURR_PAGES.map((page) => {
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
                      borderLeft: isActive ? '4px solid #f59e0b' : '4px solid transparent',
                      transition: 'all 0.1s ease'
                    }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = '#ecf0f5'; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <span style={{ color: isActive ? '#f59e0b' : '#64748b' }}>•</span>
                    {page.label}
                  </div>
                );
              })}
            </div>

            {/* Live Physics Quick Readout in Sidebar */}
            <div style={{ padding: '10px 12px', borderTop: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '10.5px', lineHeight: '1.5' }}>
              <div style={{ color: '#0f172a', fontWeight: 700, marginBottom: '2px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Contact Speed (Vc):</span>
                <span style={{ color: '#059669', fontWeight: 800 }}>{livePhysics.cuttingSpeedVc} m/min</span>
              </div>
              <div style={{ color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                <span>Dead Tip Vc:</span>
                <span style={{ color: '#dc2626', textDecoration: 'line-through' }}>{livePhysics.deadTipVc} m/min</span>
              </div>
              <div style={{ color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                <span>Effective Dia:</span>
                <span>{livePhysics.effectiveDiameterMm} mm</span>
              </div>
              <div style={{ color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                <span>Spindle RPM:</span>
                <span style={{ fontWeight: 600 }}>{livePhysics.spindleRpm}</span>
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
              {Object.entries(DEBURR_PRESETS).map(([k, p]) => (
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
                  <legend style={{ padding: '0 4px', color: '#1e293b', fontWeight: 600, fontSize: '11.5px' }}>Strategy Definition</legend>
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
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Edge Calculation Mode</label>
                      <select
                        value={formState.toolpathType.subStrategy}
                        onChange={(e) => setFormState({ ...formState, toolpathType: { ...formState.toolpathType, subStrategy: e.target.value } })}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px' }}
                      >
                        <option value="auto_edge_detection">Automatic 3D Edge Feature Recognition</option>
                        <option value="user_selected_chains">Selected Wireframe Edge Chains</option>
                      </select>
                    </div>
                  </div>
                </fieldset>

                {/* Interactive SVG 3D Deburring Diagram */}
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
                    {/* Workpiece with 45 chamfer edge */}
                    <path d="M 20 110 L 20 50 L 70 50 L 95 75 L 95 110 Z" fill="#94a3b8" stroke="#475569" strokeWidth="1.5" />
                    {/* Adjacent top face */}
                    <line x1="70" y1="50" x2="20" y2="50" stroke="#1e293b" strokeWidth="2" />
                    {/* Chamfer face */}
                    <line x1="70" y1="50" x2="95" y2="75" stroke="#f59e0b" strokeWidth="2.5" />
                    {/* Adjacent wall */}
                    <line x1="95" y1="75" x2="95" y2="110" stroke="#1e293b" strokeWidth="2" />

                    {/* Ball Nose Cutter shifted by contact angle */}
                    <circle cx="100" cy="45" r="28" fill="rgba(245, 158, 11, 0.25)" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" />
                    {/* Cutter Shank */}
                    <rect x="86" y="5" width="28" height="25" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />

                    {/* Tool Center and Contact Point Vector */}
                    <circle cx="100" cy="45" r="3" fill="#0f172a" />
                    <circle cx="82" cy="62" r="3.5" fill="#ef4444" />
                    <line x1="100" y1="45" x2="82" y2="62" stroke="#ef4444" strokeWidth="1.5" />

                    {/* Contact angle text */}
                    <text x="120" y="30" fontSize="9" fill="#0f172a" fontWeight="700">Tool Axis</text>
                    <text x="110" y="65" fontSize="9" fill="#ef4444" fontWeight="700">θ = {formState.contactPoint.contactAngleDeg}°</text>
                    <text x="35" y="85" fontSize="9" fill="#334155" fontWeight="600">Part Solid</text>
                  </svg>

                  <div style={{ flex: 1, fontSize: '11px', color: '#334155', lineHeight: '1.5' }}>
                    <strong style={{ color: '#0f172a', fontSize: '11.5px' }}>Why Contact Point Shifting Matters:</strong>
                    <br />
                    A standard ball end mill oriented perpendicular to a surface cuts with its dead center tip where surface speed is <strong>0 m/min</strong>. This causes material rubbing, tool chatter, and burrs.
                    <br /><br />
                    Argus CAM Intelligence 5-Axis Deburring enforces an angular offset (<span style={{ color: '#059669', fontWeight: 700 }}>θ = {formState.contactPoint.contactAngleDeg}°</span>), shifting contact to the flute periphery where cutting speed is <span style={{ color: '#059669', fontWeight: 800 }}>{livePhysics.cuttingSpeedVc} m/min</span> ({livePhysics.velocityGainFactor}x gain).
                  </div>
                </div>
              </div>
            )}

            {/* Page 2: Edge Detection */}
            {activePage === 'edge_detection' && (
              <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '14px', backgroundColor: '#ffffff' }}>
                <legend style={{ padding: '0 4px', color: '#1e293b', fontWeight: 600, fontSize: '11.5px' }}>3D Edge Feature Recognition Filters</legend>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>
                      Dihedral Angle Threshold: <strong>{formState.edgeDetection.dihedralThresholdDeg}°</strong>
                    </label>
                    <input
                      type="range"
                      min="15"
                      max="120"
                      step="5"
                      value={formState.edgeDetection.dihedralThresholdDeg}
                      onChange={(e) => setFormState({
                        ...formState,
                        edgeDetection: { ...formState.edgeDetection, dihedralThresholdDeg: Number(e.target.value) }
                      })}
                      style={{ width: '100%' }}
                    />
                    <span style={{ fontSize: '10px', color: '#64748b' }}>Filters edges sharper than {180 - formState.edgeDetection.dihedralThresholdDeg}°</span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Minimum Edge Length (mm)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formState.edgeDetection.minEdgeLengthMm}
                      onChange={(e) => setFormState({
                        ...formState,
                        edgeDetection: { ...formState.edgeDetection, minEdgeLengthMm: Number(e.target.value) }
                      })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: 'span 2' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formState.edgeDetection.filterConvexOnly}
                        onChange={(e) => setFormState({
                          ...formState,
                          edgeDetection: { ...formState.edgeDetection, filterConvexOnly: e.target.checked }
                        })}
                      />
                      <span>Convex Edges Only (Ignore internal concave fillets)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formState.edgeDetection.detectInteriorHoles}
                        onChange={(e) => setFormState({
                          ...formState,
                          edgeDetection: { ...formState.edgeDetection, detectInteriorHoles: e.target.checked }
                        })}
                      />
                      <span>Detect Interior Holes &amp; Cross-Bores</span>
                    </label>
                  </div>
                </div>
              </fieldset>
            )}

            {/* Page 3: Tool & Physics */}
            {activePage === 'tool' && (
              <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '14px', backgroundColor: '#ffffff' }}>
                <legend style={{ padding: '0 4px', color: '#1e293b', fontWeight: 600, fontSize: '11.5px' }}>Tool Definition &amp; Cutting Physics</legend>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Cutter Geometry Type</label>
                    <select
                      value={formState.tool.type}
                      onChange={(e) => setFormState({ ...formState, tool: { ...formState.tool, type: e.target.value } })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px' }}
                    >
                      <option value="ball_nose">Spherical Ball Nose End Mill</option>
                      <option value="lollipop">Spherical Lollipop Cutter (Undercut)</option>
                      <option value="chamfer_mill">Chamfer Mill / Tapered Ball</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Nominal Diameter (mm)</label>
                    <input
                      type="number"
                      step="0.5"
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
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11.5px' }}
                    >
                      {Object.values(DEBURR_MATERIALS_DB).map((m) => (
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

                {/* Physics Summary Panel */}
                <div style={{ padding: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11px' }}>
                  <strong style={{ color: '#0f172a' }}>Calculated Cutting Dynamics:</strong>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '6px' }}>
                    <div>Cutting Force: <strong>{livePhysics.cuttingForceFc} N</strong></div>
                    <div>Torque: <strong>{livePhysics.torqueNm} N·m</strong></div>
                    <div>Power: <strong>{livePhysics.powerKw} kW</strong></div>
                    <div>MRR: <strong>{livePhysics.mrrCm3Min} cm³/min</strong></div>
                    <div>Table Feed: <strong>{livePhysics.tableFeedMmMin} mm/min</strong></div>
                    <div>Effective Diameter: <strong>{livePhysics.effectiveDiameterMm} mm</strong></div>
                  </div>
                </div>
              </fieldset>
            )}

            {/* Page 4: Holder & Clearance */}
            {activePage === 'holder' && (
              <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '14px', backgroundColor: '#ffffff' }}>
                <legend style={{ padding: '0 4px', color: '#1e293b', fontWeight: 600, fontSize: '11.5px' }}>Holder &amp; Clearance Geometry</legend>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Holder Type</label>
                    <select
                      value={formState.holder.type}
                      onChange={(e) => setFormState({ ...formState, holder: { ...formState.holder, type: e.target.value } })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    >
                      <option value="HSK63_HYDRAULIC">HSK-A63 Hydraulic Precision Chuck</option>
                      <option value="BT40_ER32">BT40 ER32 Collet Chuck</option>
                      <option value="CAT40_SHRINK">CAT40 Shrink-Fit High-Clearance</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Gauge Length (mm)</label>
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
                <legend style={{ padding: '0 4px', color: '#1e293b', fontWeight: 600, fontSize: '11.5px' }}>Edge Break &amp; Chamfer Sizing</legend>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Edge Break Type</label>
                    <select
                      value={formState.cutParameters.edgeBreakType}
                      onChange={(e) => setFormState({ ...formState, cutParameters: { ...formState.cutParameters, edgeBreakType: e.target.value } })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    >
                      <option value="chamfer_45">Constant 45° Chamfer Width</option>
                      <option value="round_fillet">Continuous Edge Fillet Radius</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Chamfer Width (mm)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={formState.cutParameters.chamferWidthMm}
                      onChange={(e) => setFormState({ ...formState, cutParameters: { ...formState.cutParameters, chamferWidthMm: Number(e.target.value) } })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Number of Cuts</label>
                    <select
                      value={formState.cutParameters.numPasses}
                      onChange={(e) => setFormState({ ...formState, cutParameters: { ...formState.cutParameters, numPasses: Number(e.target.value) } })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    >
                      <option value={1}>Single Pass (Finishing)</option>
                      <option value={2}>2 Passes (Rough + Finish)</option>
                      <option value={3}>3 Passes (High-Nickel Alloys)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Cutting Direction</label>
                    <select
                      value={formState.cutParameters.cutDirection}
                      onChange={(e) => setFormState({ ...formState, cutParameters: { ...formState.cutParameters, cutDirection: e.target.value } })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    >
                      <option value="climb">Climb Milling (M03 CCW Edge)</option>
                      <option value="conventional">Conventional Milling</option>
                    </select>
                  </div>
                </div>
              </fieldset>
            )}

            {/* Page 6: Contact Point Shifting */}
            {activePage === 'contact_point' && (
              <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '14px', backgroundColor: '#ffffff' }}>
                <legend style={{ padding: '0 4px', color: '#1e293b', fontWeight: 600, fontSize: '11.5px' }}>Contact Point Shifting (Zero-Tip Prevention)</legend>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formState.contactPoint.enabled}
                      onChange={(e) => setFormState({
                        ...formState,
                        contactPoint: { ...formState.contactPoint, enabled: e.target.checked }
                      })}
                    />
                    <span>Enable Periphery Contact Shifting (Recommended)</span>
                  </label>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px' }}>
                      <label style={{ color: '#475569' }}>Contact Offset Angle from Tool Tip (θ):</label>
                      <strong style={{ color: '#059669' }}>{formState.contactPoint.contactAngleDeg}°</strong>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="75"
                      step="1"
                      value={formState.contactPoint.contactAngleDeg}
                      onChange={(e) => setFormState({
                        ...formState,
                        contactPoint: { ...formState.contactPoint, contactAngleDeg: Number(e.target.value) }
                      })}
                      style={{ width: '100%' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b' }}>
                      <span>10° (Near tip)</span>
                      <span>30° (Optimal ball balance)</span>
                      <span>75° (Upper flute edge)</span>
                    </div>
                  </div>

                  <div style={{ padding: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', color: '#166534', fontSize: '11px' }}>
                    <strong>Cutting Velocity at Contact Point:</strong> {livePhysics.cuttingSpeedVc} m/min
                    <br />
                    At θ = {formState.contactPoint.contactAngleDeg}°, the effective diameter is {livePhysics.effectiveDiameterMm} mm, providing full flute cutting action without smearing.
                  </div>
                </div>
              </fieldset>
            )}

            {/* Page 7: Tool Axis Control */}
            {activePage === 'tool_axis_control' && (
              <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '14px', backgroundColor: '#ffffff' }}>
                <legend style={{ padding: '0 4px', color: '#1e293b', fontWeight: 600, fontSize: '11.5px' }}>5-Axis Tool Orientation &amp; Tilting</legend>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Base Orientation Vector</label>
                    <select
                      value={formState.toolAxisControl.mode}
                      onChange={(e) => setFormState({ ...formState, toolAxisControl: { ...formState.toolAxisControl, mode: e.target.value } })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    >
                      <option value="surface_bisector">Adjacent Surface Normal Bisector</option>
                      <option value="fixed_angle_edge">Fixed Angle to Edge Tangent</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Forward Lead Angle (α) (°)</label>
                    <input
                      type="number"
                      step="1"
                      value={formState.toolAxisControl.leadAngleDeg}
                      onChange={(e) => setFormState({ ...formState, toolAxisControl: { ...formState.toolAxisControl, leadAngleDeg: Number(e.target.value) } })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Sideways Tilt Angle (β) (°)</label>
                    <input
                      type="number"
                      step="1"
                      value={formState.toolAxisControl.tiltAngleDeg}
                      onChange={(e) => setFormState({ ...formState, toolAxisControl: { ...formState.toolAxisControl, tiltAngleDeg: Number(e.target.value) } })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Maximum Tilt Limit (°)</label>
                    <input
                      type="number"
                      step="5"
                      value={formState.toolAxisControl.maxTiltAngleDeg}
                      onChange={(e) => setFormState({ ...formState, toolAxisControl: { ...formState.toolAxisControl, maxTiltAngleDeg: Number(e.target.value) } })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    />
                  </div>
                </div>
              </fieldset>
            )}

            {/* Page 8: Collision Control & Auto-Tilt */}
            {activePage === 'collision_control' && (
              <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '14px', backgroundColor: '#ffffff' }}>
                <legend style={{ padding: '0 4px', color: '#1e293b', fontWeight: 600, fontSize: '11.5px' }}>Collision Checking &amp; Dynamic Tilting</legend>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formState.collisionControl.enableAutoTilt}
                      onChange={(e) => setFormState({
                        ...formState,
                        collisionControl: { ...formState.collisionControl, enableAutoTilt: e.target.checked }
                      })}
                    />
                    <strong>Enable Automatic Collision Tilt Away from Walls</strong>
                  </label>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Collision Reaction Strategy</label>
                    <select
                      value={formState.collisionControl.tiltStrategy}
                      onChange={(e) => setFormState({ ...formState, collisionControl: { ...formState.collisionControl, tiltStrategy: e.target.value } })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    >
                      <option value="tilt_away_normal">Tilt Tool Away from Wall Normal (Preserve Contact Point)</option>
                      <option value="retract_along_axis">Retract Tool along Tool Axis</option>
                      <option value="skip_edge">Skip Interfering Edge Segments</option>
                    </select>
                  </div>
                </div>
              </fieldset>
            )}

            {/* Page 9: Linking & 3D Lead Arcs */}
            {activePage === 'linking_parameters' && (
              <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '14px', backgroundColor: '#ffffff' }}>
                <legend style={{ padding: '0 4px', color: '#1e293b', fontWeight: 600, fontSize: '11.5px' }}>Linking &amp; 3D Tangent Blend Arcs</legend>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Clearance Plane (mm)</label>
                    <input
                      type="number"
                      value={formState.linkingParameters.clearancePlaneMm}
                      onChange={(e) => setFormState({ ...formState, linkingParameters: { ...formState.linkingParameters, clearancePlaneMm: Number(e.target.value) } })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Lead-In 3D Arc Radius (mm)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formState.linkingParameters.leadInRadiusMm}
                      onChange={(e) => setFormState({ ...formState, linkingParameters: { ...formState.linkingParameters, leadInRadiusMm: Number(e.target.value) } })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Lead-In Sweep Angle (°)</label>
                    <input
                      type="number"
                      step="5"
                      value={formState.linkingParameters.leadInSweepDeg}
                      onChange={(e) => setFormState({ ...formState, linkingParameters: { ...formState.linkingParameters, leadInSweepDeg: Number(e.target.value) } })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Inter-Segment Transition</label>
                    <select
                      value={formState.linkingParameters.transitionMode}
                      onChange={(e) => setFormState({ ...formState, linkingParameters: { ...formState.linkingParameters, transitionMode: e.target.value } })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    >
                      <option value="smooth_3d_spline">Smooth 3D Splined Link</option>
                      <option value="retract_to_clearance">Retract to Clearance Plane</option>
                    </select>
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
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>5-Axis Kinematic Topology</label>
                    <select
                      value={formState.machineKinematics.kinematicsType}
                      onChange={(e) => setFormState({ ...formState, machineKinematics: { ...formState.machineKinematics, kinematicsType: e.target.value } })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    >
                      <option value="table_table">Table-Table (A-Tilt / C-Rotary Trunnion)</option>
                      <option value="head_table">Head-Table (B-Swivel Head / C-Table)</option>
                      <option value="head_head">Head-Head (A/B Articulated Spindle)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Controller Post Dialect</label>
                    <select
                      value={formState.machineKinematics.controllerDialect}
                      onChange={(e) => setFormState({ ...formState, machineKinematics: { ...formState.machineKinematics, controllerDialect: e.target.value } })}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    >
                      <option value="fanuc">Fanuc 30i/31i (G43.4 High-Speed TCPM)</option>
                      <option value="haas">Haas NGC (G234 Tool Center Point Control)</option>
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
                      <option value="thru_spindle">Thru-Spindle Coolant (M88)</option>
                      <option value="air_blast">Air Blast / Vortex (M07)</option>
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
              border: '1px solid #d97706',
              backgroundColor: '#f59e0b',
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
