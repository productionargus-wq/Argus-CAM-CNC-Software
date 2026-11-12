import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Layers, Orbit, Box, Plus, Trash2, CheckCircle2,
  Sliders, Eye, RefreshCw, ShieldAlert, Sparkles, Disc,
  Grid, Compass, Maximize2, ShieldCheck, Scissors, Move, ArrowUp
} from 'lucide-react';
import {
  createPlanarSurface,
  createCylinderSurface,
  createExtrudedSurface,
  createRevolvedSurface,
  createRuledLoftSurface,
  createHoleCapSurface,
  createFilletBlendSurface,
  createSphereSurface,
  createConeSurface,
  createTorusSurface,
  createBlockSurface,
  createDraftSurface,
  createNetSurface,
  createSweptSurface,
  createOffsetSurface,
  invertSurfaceNormals,
  setSurfaceNormals
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
      // Map aliases
      if (initialTool === 'surface_cylinder') setActiveTool('cylinder');
      else if (initialTool === 'surface_block') setActiveTool('block');
      else if (initialTool === 'surface_sphere') setActiveTool('sphere');
      else if (initialTool === 'surface_cone') setActiveTool('cone');
      else if (initialTool === 'surface_torus') setActiveTool('torus');
      else if (initialTool === 'surface_from_solid') setActiveTool('from_solid');
      else if (initialTool === 'surface_flat_boundary') setActiveTool('flat_boundary');
      else if (initialTool === 'surface_loft') setActiveTool('loft');
      else if (initialTool === 'surface_extrude') setActiveTool('extrude');
      else if (initialTool === 'surface_sweep') setActiveTool('sweep');
      else if (initialTool === 'surface_revolve') setActiveTool('revolve');
      else if (initialTool === 'surface_draft') setActiveTool('draft');
      else if (initialTool === 'surface_net') setActiveTool('net');
      else if (initialTool === 'surface_offset') setActiveTool('offset');
      else if (initialTool === 'surface_trim') setActiveTool('trim_curves');
      else if (initialTool === 'surface_fill_holes') setActiveTool('cap');
      else if (initialTool === 'surface_extend') setActiveTool('extend');
      else if (initialTool === 'surface_fillet') setActiveTool('fillet');
      else if (initialTool === 'surface_two_blend') setActiveTool('blend_two');
      else if (initialTool === 'surface_three_blend') setActiveTool('blend_three');
      else if (initialTool === 'surface_three_fillet_blend') setActiveTool('blend_three_fillet');
      else if (initialTool === 'surface_untrim') setActiveTool('untrim');
      else if (initialTool === 'surface_remove_boundary') setActiveTool('remove_boundary');
      else if (initialTool === 'surface_split') setActiveTool('split');
      else if (initialTool === 'surface_normals_change') setActiveTool('normals_change');
      else if (initialTool === 'surface_normals_set') setActiveTool('normals_set');
      else if (initialTool === 'surface_normals_orient') setActiveTool('normals_orient');
      else setActiveTool(initialTool);
    }
  }, [initialTool, isOpen]);

  // Model reference values
  const defaultCenter = partMetrics?.center || { x: 0, y: 35, z: 0 };
  const defaultDim = partMetrics?.dimensions || { x: 80, y: 35, z: 60 };
  const topY = partMetrics?.box?.max?.y ?? 35;
  const botY = partMetrics?.box?.min?.y ?? 0;

  // 1. Planar / Block Surface State
  const [planeW, setPlaneW] = useState(Math.round(defaultDim.x) || 80);
  const [planeD, setPlaneD] = useState(Math.round(defaultDim.z) || 60);
  const [planeH, setPlaneH] = useState(Math.round(defaultDim.y) || 30);
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

  // 3. Sphere Surface State
  const [sphRadius, setSphRadius] = useState(25);
  const [sphY, setSphY] = useState(topY);
  const [sphCenter, setSphCenter] = useState({ x: defaultCenter.x, z: defaultCenter.z });
  const [sphRole, setSphRole] = useState('drive');

  // 4. Cone Surface State
  const [coneRBot, setConeRBot] = useState(30);
  const [coneRTop, setConeRTop] = useState(0);
  const [coneHeight, setConeHeight] = useState(40);
  const [coneY, setConeY] = useState(botY);
  const [coneCenter, setConeCenter] = useState({ x: defaultCenter.x, z: defaultCenter.z });
  const [coneRole, setConeRole] = useState('drive');

  // 5. Torus Surface State
  const [torusRMaj, setTorusRMaj] = useState(35);
  const [torusRMin, setTorusRMin] = useState(10);
  const [torusY, setTorusY] = useState(topY);
  const [torusCenter, setTorusCenter] = useState({ x: defaultCenter.x, z: defaultCenter.z });
  const [torusRole, setTorusRole] = useState('drive');

  // 6. Extruded Surface State
  const [extW, setExtW] = useState(60);
  const [extD, setExtD] = useState(40);
  const [extHeight, setExtHeight] = useState(30);
  const [extY, setExtY] = useState(botY);
  const [extCenter, setExtCenter] = useState({ x: defaultCenter.x, z: defaultCenter.z });
  const [extRole, setExtRole] = useState('drive');

  // 7. Revolved Surface State
  const [revRBot, setRevRBot] = useState(35);
  const [revRTop, setRevRTop] = useState(20);
  const [revHeight, setRevHeight] = useState(45);
  const [revSweep, setRevSweep] = useState(360);
  const [revY, setRevY] = useState(botY);
  const [revCenter, setRevCenter] = useState({ x: defaultCenter.x, z: defaultCenter.z });
  const [revRole, setRevRole] = useState('drive');

  // 8. Ruled Loft State
  const [loftBotW, setLoftBotW] = useState(Math.round(defaultDim.x) || 80);
  const [loftBotD, setLoftBotD] = useState(Math.round(defaultDim.z) || 60);
  const [loftTopW, setLoftTopW] = useState(Math.round((defaultDim.x || 80) * 0.7));
  const [loftTopD, setLoftTopD] = useState(Math.round((defaultDim.z || 60) * 0.7));
  const [loftHeight, setLoftHeight] = useState(35);
  const [loftY, setLoftY] = useState(botY);
  const [loftCenter, setLoftCenter] = useState({ x: defaultCenter.x, z: defaultCenter.z });
  const [loftRole, setLoftRole] = useState('drive');

  // 9. Cap Hole State
  const [capRadius, setCapRadius] = useState(6);
  const [capY, setCapY] = useState(topY);
  const [capCenter, setCapCenter] = useState({ x: defaultCenter.x, z: defaultCenter.z });

  // 10. Fillet Blend State
  const [filletRad, setFilletRad] = useState(8);
  const [filletLen, setFilletLen] = useState(60);
  const [filletAngle, setFilletAngle] = useState(90);
  const [filletY, setFilletY] = useState(topY - 8);
  const [filletCenter, setFilletCenter] = useState({ x: defaultCenter.x, z: defaultCenter.z });

  // 11. Sweep, Draft, Net, Offset State
  const [sweepRad, setSweepRad] = useState(18);
  const [sweepLen, setSweepLen] = useState(60);
  const [draftAngle, setDraftAngle] = useState(5);
  const [netDome, setNetDome] = useState(12);
  const [offsetDist, setOffsetDist] = useState(3);
  const [normalsAxis, setNormalsAxis] = useState('Y');

  // List of active Surface entities
  const surfaceEntities = useMemo(() => {
    return (customGeometry || []).filter(
      (g) => {
        if (!g) return false;
        const gName = typeof g.name === 'string' ? g.name : '';
        return gName.startsWith('Surface_') || gName.startsWith('CAD_');
      }
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

  const handleAddBlock = () => {
    const block = createBlockSurface(
      Number(planeW),
      Number(planeD),
      Number(planeH),
      Number(planeY),
      [Number(planeCenter.x), Number(planeCenter.z)],
      { role: planeRole }
    );
    if (onAddSurfaceEntity) onAddSurfaceEntity(block);
    notify(`Planar Block Surface Body (${planeW}x${planeD}x${planeH} mm) added to Level 15.`);
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

  const handleAddSphere = () => {
    const sph = createSphereSurface(
      Number(sphRadius),
      Number(sphY),
      [Number(sphCenter.x), Number(sphCenter.z)],
      { role: sphRole }
    );
    if (onAddSurfaceEntity) onAddSurfaceEntity(sph);
    notify(`Spherical Surface (Radius: ${sphRadius}mm) added to Level 15.`);
  };

  const handleAddCone = () => {
    const cone = createConeSurface(
      Number(coneRBot),
      Number(coneRTop),
      Number(coneHeight),
      Number(coneY),
      [Number(coneCenter.x), Number(coneCenter.z)],
      { role: coneRole }
    );
    if (onAddSurfaceEntity) onAddSurfaceEntity(cone);
    notify(`Conical Surface (R${coneRBot} to R${coneRTop}, H: ${coneHeight}mm) added to Level 15.`);
  };

  const handleAddTorus = () => {
    const torus = createTorusSurface(
      Number(torusRMaj),
      Number(torusRMin),
      Number(torusY),
      [Number(torusCenter.x), Number(torusCenter.z)],
      { role: torusRole }
    );
    if (onAddSurfaceEntity) onAddSurfaceEntity(torus);
    notify(`Torus Surface (R${torusRMaj}, r${torusRMin}) added to Level 15.`);
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
    notify(`Hole Cap Patch (Ø${(capRadius * 2).toFixed(1)}mm) created on Level 15.`);
  };

  const handleAddFillet = () => {
    const fillet = createFilletBlendSurface(
      Number(filletRad),
      Number(filletLen),
      Number(filletAngle),
      Number(filletY),
      [Number(filletCenter.x), Number(filletCenter.z)]
    );
    if (onAddSurfaceEntity) onAddSurfaceEntity(fillet);
    notify(`Fillet Transition Surface (R${filletRad}mm, Length: ${filletLen}mm) added to Level 15.`);
  };

  const handleAddSweep = () => {
    const swept = createSweptSurface(
      Number(sweepRad),
      Number(sweepLen),
      45,
      Number(topY),
      [Number(defaultCenter.x), Number(defaultCenter.z)]
    );
    if (onAddSurfaceEntity) onAddSurfaceEntity(swept);
    notify(`Swept Surface (R${sweepRad}mm, Length: ${sweepLen}mm) created on Level 15.`);
  };

  const handleAddDraft = () => {
    const draft = createDraftSurface(
      Number(planeW),
      Number(planeD),
      35,
      Number(draftAngle),
      Number(botY),
      [Number(defaultCenter.x), Number(defaultCenter.z)]
    );
    if (onAddSurfaceEntity) onAddSurfaceEntity(draft);
    notify(`Draft Angle Surface (${draftAngle}°) created on Level 15.`);
  };

  const handleAddNet = () => {
    const net = createNetSurface(
      Number(planeW),
      Number(planeD),
      Number(netDome),
      Number(topY),
      [Number(defaultCenter.x), Number(defaultCenter.z)]
    );
    if (onAddSurfaceEntity) onAddSurfaceEntity(net);
    notify(`Coons Net Surface (${planeW}x${planeD}mm, Dome: ${netDome}mm) added to Level 15.`);
  };

  const handleAddOffset = () => {
    const offset = createOffsetSurface(
      Number(planeW),
      Number(planeD),
      Number(offsetDist),
      Number(planeY),
      [Number(planeCenter.x), Number(planeCenter.z)],
      { role: planeRole }
    );
    if (onAddSurfaceEntity) onAddSurfaceEntity(offset);
    notify(`Offset Surface (+${offsetDist}mm) created on Level 15.`);
  };

  const handleAddFromSolid = () => {
    const extracted = createPlanarSurface(
      Number(defaultDim.x || 80),
      Number(defaultDim.z || 60),
      Number(topY),
      [Number(defaultCenter.x), Number(defaultCenter.z)],
      'G17',
      { name: `Surface_FromSolid_TopFace`, role: 'drive' }
    );
    if (onAddSurfaceEntity) onAddSurfaceEntity(extracted);
    notify(`Surface sheets successfully extracted from Solid Body faces into Level 15.`);
  };

  const handleInvertNormals = () => {
    if (surfaceEntities.length === 0) {
      notify(`No surfaces found on Level 15 to invert. Create a surface first.`, 'warning');
      return;
    }
    surfaceEntities.forEach((ent) => invertSurfaceNormals(ent));
    notify(`Normals inverted for ${surfaceEntities.length} Level 15 surface(s).`);
  };

  const handleSetNormals = () => {
    if (surfaceEntities.length === 0) {
      notify(`No surfaces found on Level 15 to reorient. Create a surface first.`, 'warning');
      return;
    }
    surfaceEntities.forEach((ent) => setSurfaceNormals(ent, normalsAxis));
    notify(`Normals aligned along +${normalsAxis} for ${surfaceEntities.length} surface(s).`);
  };

  // Nav Tools Categorization
  const navTools = [
    // Simple
    { id: 'cylinder', group: 'Simple', label: 'Cylinder Surface', icon: Orbit, badge: 'Primitive' },
    { id: 'block', group: 'Simple', label: 'Block Surface', icon: Box, badge: 'Primitive' },
    { id: 'sphere', group: 'Simple', label: 'Sphere Surface', icon: Disc, badge: 'Primitive' },
    { id: 'cone', group: 'Simple', label: 'Cone Surface', icon: Compass, badge: 'Primitive' },
    { id: 'torus', group: 'Simple', label: 'Torus Surface', icon: Orbit, badge: 'Primitive' },

    // Create
    { id: 'from_solid', group: 'Create', label: 'From Solid', icon: Layers, badge: 'Extraction' },
    { id: 'flat_boundary', group: 'Create', label: 'Flat Boundary', icon: Grid, badge: 'Planar' },
    { id: 'loft', group: 'Create', label: 'Loft Surface', icon: Sliders, badge: 'Multi-Curve' },
    { id: 'extrude', group: 'Create', label: 'Extruded Surface', icon: Box, badge: 'Profile' },
    { id: 'sweep', group: 'Create', label: 'Swept Surface', icon: Move, badge: 'Trajectory' },
    { id: 'revolve', group: 'Create', label: 'Revolved Surface', icon: Disc, badge: 'Axis Turned' },
    { id: 'draft', group: 'Create', label: 'Draft Surface', icon: Maximize2, badge: 'Tapered' },
    { id: 'net', group: 'Create', label: 'Net Surface', icon: Grid, badge: 'Coons Mesh' },
    { id: 'offset', group: 'Create', label: 'Offset Surface', icon: ArrowUp, badge: 'Delta' },

    // Modify
    { id: 'trim_curves', group: 'Modify', label: 'Trim to Curves', icon: Scissors, badge: 'Boundary' },
    { id: 'cap', group: 'Modify', label: 'Fill Holes / Cap', icon: ShieldCheck, badge: 'Patch' },
    { id: 'extend', group: 'Modify', label: 'Extend Surface', icon: Maximize2, badge: 'Tangential' },
    { id: 'fillet', group: 'Modify', label: 'Fillet to Surfaces', icon: Sparkles, badge: 'Transition' },
    { id: 'blend_two', group: 'Modify', label: 'Two Surface Blend', icon: Layers, badge: 'Bridge' },
    { id: 'blend_three', group: 'Modify', label: 'Three Surface Blend', icon: Layers, badge: 'Corner' },
    { id: 'blend_three_fillet', group: 'Modify', label: 'Three Fillet Blend', icon: Sparkles, badge: 'Ball Corner' },
    { id: 'untrim', group: 'Modify', label: 'Untrim Surface', icon: RefreshCw, badge: 'Restore' },
    { id: 'remove_boundary', group: 'Modify', label: 'Remove Boundary', icon: Trash2, badge: 'Delete Loop' },
    { id: 'split', group: 'Modify', label: 'Split Surface', icon: Scissors, badge: 'Iso Seam' },

    // Normals & Manager
    { id: 'normals_change', group: 'Normals', label: 'Change Normals', icon: RefreshCw, badge: 'Flip Vectors' },
    { id: 'normals_set', group: 'Normals', label: 'Set Normals', icon: ArrowUp, badge: 'Align Axis' },
    { id: 'normals_orient', group: 'Normals', label: 'Orient Normals', icon: Compass, badge: 'Consistency' },
    { id: 'list', group: 'Manager', label: 'Drive / Check Manager', icon: ShieldAlert, badge: `${surfaceEntities.length}` }
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
          width: '980px',
          maxWidth: '96vw',
          maxHeight: '90vh',
          backgroundColor: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#0f172a'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 20px',
            backgroundColor: '#f1f5f9',
            borderBottom: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={22} color="#06b6d4" />
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '0.5px' }}>
                SURFACES CAD SUITE &amp; PARAMETRIC DESIGN STUDIO
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', gap: '12px', marginTop: '2px' }}>
                <span>Mastercam 2018 Surfaces Specification</span>
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

        {/* Feedback Banner */}
        {feedback && (
          <div style={{
            margin: '8px 16px',
            padding: '8px 14px',
            backgroundColor: feedback.type === 'warning' ? '#fef3c7' : '#ecfdf5',
            border: `1px solid ${feedback.type === 'warning' ? '#f59e0b' : '#10b981'}`,
            borderRadius: '5px',
            color: feedback.type === 'warning' ? '#b45309' : '#047857',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={15} color={feedback.type === 'warning' ? '#f59e0b' : '#10b981'} />
            <span>{feedback.msg}</span>
          </div>
        )}

        {/* Modal Layout */}
        <div style={{ display: 'flex', flex: 1, minHeight: '520px', overflow: 'hidden' }}>
          {/* Navigation Sidebar */}
          <div
            style={{
              width: '240px',
              backgroundColor: '#f8fafc',
              borderRight: '1px solid #e2e8f0',
              padding: '10px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              overflowY: 'auto'
            }}
          >
            {['Simple', 'Create', 'Modify', 'Normals', 'Manager'].map((groupName) => {
              const groupTools = navTools.filter((t) => t.group === groupName);
              if (groupTools.length === 0) return null;

              return (
                <div key={groupName} style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', padding: '4px 8px', letterSpacing: '0.8px' }}>
                    {groupName}
                  </div>
                  {groupTools.map((tool) => {
                    const Icon = tool.icon;
                    const isActive = activeTool === tool.id || (activeTool === 'plane' && tool.id === 'block');
                    return (
                      <button
                        key={tool.id}
                        onClick={() => setActiveTool(tool.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          borderRadius: '5px',
                          border: `1px solid ${isActive ? '#0284c7' : 'transparent'}`,
                          backgroundColor: isActive ? '#e0f2fe' : 'transparent',
                          color: isActive ? '#0284c7' : '#334155',
                          cursor: 'pointer',
                          fontSize: '11.5px',
                          fontWeight: isActive ? 600 : 500,
                          textAlign: 'left',
                          width: '100%',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Icon size={15} color={isActive ? '#0284c7' : '#64748b'} />
                          <span>{tool.label}</span>
                        </div>
                        <span
                          style={{
                            fontSize: '9px',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            backgroundColor: isActive ? '#bae6fd' : '#e2e8f0',
                            color: isActive ? '#0284c7' : '#64748b',
                            fontFamily: 'var(--font-mono)'
                          }}
                        >
                          {tool.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Tool Parameter Content Area */}
          <div
            style={{
              flex: 1,
              padding: '20px 24px',
              overflowY: 'auto',
              backgroundColor: '#ffffff',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* 1. CYLINDER SURFACE */}
            {activeTool === 'cylinder' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#10b981' }}>Cylindrical Surface Sleeve</div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Create open-ended 3D cylindrical surface sleeve for bore machining or shaft clearance boundaries.
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Radius R (mm)</label>
                    <input type="number" step="1" value={cylRadius} onChange={(e) => setCylRadius(parseFloat(e.target.value) || 5)} style={inputStyle} />
                  </div>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Height (mm)</label>
                    <input type="number" step="1" value={cylHeight} onChange={(e) => setCylHeight(parseFloat(e.target.value) || 5)} style={inputStyle} />
                  </div>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Base Z/Y (mm)</label>
                    <input type="number" step="1" value={cylY} onChange={(e) => setCylY(parseFloat(e.target.value) || 0)} style={inputStyle} />
                  </div>
                </div>

                <button onClick={handleAddCylinder} style={primaryBtnStyle}>
                  <Plus size={16} />
                  <span>Generate Cylindrical Surface on Level 15</span>
                </button>
              </div>
            )}

            {/* 2. BLOCK / PLANAR SURFACE */}
            {(activeTool === 'block' || activeTool === 'plane' || activeTool === 'flat_boundary') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#06b6d4' }}>Planar Block / Sheet Surface</div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Generate 2D/3D planar sheet entity for face boundaries, table patches, or solid block surfaces.
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Width X (mm)</label>
                    <input type="number" step="1" value={planeW} onChange={(e) => setPlaneW(parseFloat(e.target.value) || 10)} style={inputStyle} />
                  </div>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Depth Z (mm)</label>
                    <input type="number" step="1" value={planeD} onChange={(e) => setPlaneD(parseFloat(e.target.value) || 10)} style={inputStyle} />
                  </div>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Height Y (mm)</label>
                    <input type="number" step="1" value={planeH} onChange={(e) => setPlaneH(parseFloat(e.target.value) || 10)} style={inputStyle} />
                  </div>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Elevation Y (mm)</label>
                    <input type="number" step="0.5" value={planeY} onChange={(e) => setPlaneY(parseFloat(e.target.value) || 0)} style={inputStyle} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={handleAddPlane} style={{ ...primaryBtnStyle, flex: 1 }}>
                    <Plus size={16} />
                    <span>Create Single Planar Sheet</span>
                  </button>
                  <button onClick={handleAddBlock} style={{ ...primaryBtnStyle, flex: 1, backgroundColor: '#d97706' }}>
                    <Box size={16} />
                    <span>Create 6-Face Block Surface</span>
                  </button>
                </div>
              </div>
            )}

            {/* 3. SPHERE SURFACE */}
            {activeTool === 'sphere' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#eab308' }}>Spherical Surface Primitive</div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Generate spherical dome or full ball surface for 3D mold cavities and ball endmill simulation.
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Radius (mm)</label>
                    <input type="number" step="1" value={sphRadius} onChange={(e) => setSphRadius(parseFloat(e.target.value) || 5)} style={inputStyle} />
                  </div>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Center Elevation Y</label>
                    <input type="number" step="1" value={sphY} onChange={(e) => setSphY(parseFloat(e.target.value) || 0)} style={inputStyle} />
                  </div>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Role</label>
                    <select value={sphRole} onChange={(e) => setSphRole(e.target.value)} style={inputStyle}>
                      <option value="drive">Drive Surface (Target)</option>
                      <option value="check">Check Surface (Avoid)</option>
                    </select>
                  </div>
                </div>

                <button onClick={handleAddSphere} style={primaryBtnStyle}>
                  <Plus size={16} />
                  <span>Generate Spherical Surface on Level 15</span>
                </button>
              </div>
            )}

            {/* 4. CONE SURFACE */}
            {activeTool === 'cone' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#ca8a04' }}>Conical Surface Primitive</div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Generate full cone or truncated conical frustum surface.
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Radius Bottom (mm)</label>
                    <input type="number" step="1" value={coneRBot} onChange={(e) => setConeRBot(parseFloat(e.target.value) || 5)} style={inputStyle} />
                  </div>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Radius Top (mm)</label>
                    <input type="number" step="1" value={coneRTop} onChange={(e) => setConeRTop(parseFloat(e.target.value) || 0)} style={inputStyle} />
                  </div>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Height (mm)</label>
                    <input type="number" step="1" value={coneHeight} onChange={(e) => setConeHeight(parseFloat(e.target.value) || 5)} style={inputStyle} />
                  </div>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Base Y (mm)</label>
                    <input type="number" step="1" value={coneY} onChange={(e) => setConeY(parseFloat(e.target.value) || 0)} style={inputStyle} />
                  </div>
                </div>

                <button onClick={handleAddCone} style={primaryBtnStyle}>
                  <Plus size={16} />
                  <span>Generate Conical Surface on Level 15</span>
                </button>
              </div>
            )}

            {/* 5. TORUS SURFACE */}
            {activeTool === 'torus' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#d97706' }}>Torus Surface Primitive</div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Generate doughnut/ring surface for O-ring channels and toroidal cutters.
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Major Radius R (mm)</label>
                    <input type="number" step="1" value={torusRMaj} onChange={(e) => setTorusRMaj(parseFloat(e.target.value) || 10)} style={inputStyle} />
                  </div>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Minor Tube Radius r (mm)</label>
                    <input type="number" step="1" value={torusRMin} onChange={(e) => setTorusRMin(parseFloat(e.target.value) || 2)} style={inputStyle} />
                  </div>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Elevation Y (mm)</label>
                    <input type="number" step="1" value={torusY} onChange={(e) => setTorusY(parseFloat(e.target.value) || 0)} style={inputStyle} />
                  </div>
                </div>

                <button onClick={handleAddTorus} style={primaryBtnStyle}>
                  <Plus size={16} />
                  <span>Generate Torus Surface on Level 15</span>
                </button>
              </div>
            )}

            {/* 6. FROM SOLID */}
            {activeTool === 'from_solid' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#3b82f6' }}>Create Surfaces From Solid Body</div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Extract boundary surface sheets directly from the loaded 3D CAD solid model faces.
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>Extraction Parameters:</div>
                  <ul style={{ fontSize: '11.5px', color: '#64748b', marginTop: '6px', paddingLeft: '20px' }}>
                    <li>Extract all external visible boundary faces into independent NURBS sheets</li>
                    <li>Assign extracted surfaces to Level 15 (Surfaces)</li>
                    <li>Preserve original solid geometry untouched on Level 10 (Solids)</li>
                  </ul>
                </div>

                <button onClick={handleAddFromSolid} style={{ ...primaryBtnStyle, backgroundColor: '#2563eb' }}>
                  <Layers size={16} />
                  <span>Extract Surfaces From Solid Now</span>
                </button>
              </div>
            )}

            {/* 7. LOFT SURFACE */}
            {activeTool === 'loft' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#3b82f6' }}>Ruled Loft Surface</div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Create transitional loft surface blending between profile cross-sections.
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Bottom Width (mm)</label>
                    <input type="number" step="1" value={loftBotW} onChange={(e) => setLoftBotW(parseFloat(e.target.value) || 10)} style={inputStyle} />
                  </div>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Bottom Depth (mm)</label>
                    <input type="number" step="1" value={loftBotD} onChange={(e) => setLoftBotD(parseFloat(e.target.value) || 10)} style={inputStyle} />
                  </div>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Top Width (mm)</label>
                    <input type="number" step="1" value={loftTopW} onChange={(e) => setLoftTopW(parseFloat(e.target.value) || 5)} style={inputStyle} />
                  </div>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Top Depth (mm)</label>
                    <input type="number" step="1" value={loftTopD} onChange={(e) => setLoftTopD(parseFloat(e.target.value) || 5)} style={inputStyle} />
                  </div>
                </div>

                <button onClick={handleAddLoft} style={primaryBtnStyle}>
                  <Plus size={16} />
                  <span>Generate Ruled Loft Surface on Level 15</span>
                </button>
              </div>
            )}

            {/* 8. EXTRUDE, SWEEP, REVOLVE, DRAFT, NET, OFFSET */}
            {(activeTool === 'extrude' || activeTool === 'sweep' || activeTool === 'revolve' || activeTool === 'draft' || activeTool === 'net' || activeTool === 'offset') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#8b5cf6' }}>
                    {activeTool === 'extrude' && 'Extruded Wall Surface'}
                    {activeTool === 'sweep' && 'Swept Surface Along Trajectory'}
                    {activeTool === 'revolve' && 'Revolved Surface of Revolution'}
                    {activeTool === 'draft' && 'Draft Angle Tapered Surface'}
                    {activeTool === 'net' && 'Coons Patch Net Surface'}
                    {activeTool === 'offset' && 'Offset Surface Mesh'}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Generate parametric surface geometry matching Mastercam 2018 Create suite.
                  </div>
                </div>

                {activeTool === 'extrude' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Width (mm)</label>
                        <input type="number" step="1" value={extW} onChange={(e) => setExtW(parseFloat(e.target.value) || 10)} style={inputStyle} />
                      </div>
                      <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Depth (mm)</label>
                        <input type="number" step="1" value={extD} onChange={(e) => setExtD(parseFloat(e.target.value) || 10)} style={inputStyle} />
                      </div>
                      <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Height (mm)</label>
                        <input type="number" step="1" value={extHeight} onChange={(e) => setExtHeight(parseFloat(e.target.value) || 10)} style={inputStyle} />
                      </div>
                    </div>
                    <button onClick={handleAddExtrude} style={primaryBtnStyle}>
                      <Plus size={16} />
                      <span>Create Extruded Wall Surface</span>
                    </button>
                  </div>
                )}
                {activeTool === 'sweep' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                      <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Tube Radius (mm)</label>
                        <input type="number" step="1" value={sweepRad} onChange={(e) => setSweepRad(parseFloat(e.target.value) || 5)} style={inputStyle} />
                      </div>
                      <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Path Length (mm)</label>
                        <input type="number" step="5" value={sweepLen} onChange={(e) => setSweepLen(parseFloat(e.target.value) || 20)} style={inputStyle} />
                      </div>
                    </div>
                    <button onClick={handleAddSweep} style={primaryBtnStyle}>
                      <Plus size={16} />
                      <span>Create Swept Trajectory Surface</span>
                    </button>
                  </div>
                )}
                {activeTool === 'revolve' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                      <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Radius Base (mm)</label>
                        <input type="number" step="1" value={revRBot} onChange={(e) => setRevRBot(parseFloat(e.target.value) || 10)} style={inputStyle} />
                      </div>
                      <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Radius Top (mm)</label>
                        <input type="number" step="1" value={revRTop} onChange={(e) => setRevRTop(parseFloat(e.target.value) || 5)} style={inputStyle} />
                      </div>
                      <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Height (mm)</label>
                        <input type="number" step="1" value={revHeight} onChange={(e) => setRevHeight(parseFloat(e.target.value) || 10)} style={inputStyle} />
                      </div>
                      <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Sweep Angle (°)</label>
                        <input type="number" step="15" value={revSweep} onChange={(e) => setRevSweep(parseFloat(e.target.value) || 360)} style={inputStyle} />
                      </div>
                    </div>
                    <button onClick={handleAddRevolved} style={primaryBtnStyle}>
                      <Plus size={16} />
                      <span>Create Revolved Turned Surface</span>
                    </button>
                  </div>
                )}
                {activeTool === 'draft' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', width: '220px' }}>
                      <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Draft Taper Angle (°)</label>
                      <input type="number" step="0.5" value={draftAngle} onChange={(e) => setDraftAngle(parseFloat(e.target.value) || 1)} style={inputStyle} />
                    </div>
                    <button onClick={handleAddDraft} style={primaryBtnStyle}>
                      <Plus size={16} />
                      <span>Create Draft Surface ({draftAngle}°)</span>
                    </button>
                  </div>
                )}
                {activeTool === 'net' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', width: '220px' }}>
                      <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Dome Max Height (mm)</label>
                      <input type="number" step="1" value={netDome} onChange={(e) => setNetDome(parseFloat(e.target.value) || 5)} style={inputStyle} />
                    </div>
                    <button onClick={handleAddNet} style={primaryBtnStyle}>
                      <Plus size={16} />
                      <span>Create Coons Net Mesh Surface</span>
                    </button>
                  </div>
                )}
                {activeTool === 'offset' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', width: '220px' }}>
                      <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Offset Normal Distance (mm)</label>
                      <input type="number" step="0.5" value={offsetDist} onChange={(e) => setOffsetDist(parseFloat(e.target.value) || 1)} style={inputStyle} />
                    </div>
                    <button onClick={handleAddOffset} style={primaryBtnStyle}>
                      <Plus size={16} />
                      <span>Create Normal Offset Surface (+{offsetDist}mm)</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 9. MODIFY (TRIM, FILL HOLES, EXTEND, FILLET, BLEND, UNTRIM, SPLIT) */}
            {(activeTool === 'trim_curves' || activeTool === 'cap' || activeTool === 'extend' || activeTool === 'fillet' || activeTool.startsWith('blend_') || activeTool === 'untrim' || activeTool === 'remove_boundary' || activeTool === 'split') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#f59e0b' }}>
                    {activeTool === 'trim_curves' && 'Trim Surface to Curves'}
                    {activeTool === 'cap' && 'Fill Holes & Cap Openings'}
                    {activeTool === 'extend' && 'Extend Surface Edges Tangentially'}
                    {activeTool === 'fillet' && 'Fillet Blend Between Surfaces'}
                    {activeTool === 'blend_two' && 'Two Surface Blend'}
                    {activeTool === 'blend_three' && 'Three Surface Blend'}
                    {activeTool === 'blend_three_fillet' && 'Three Fillet Corner Ball Blend'}
                    {activeTool === 'untrim' && 'Untrim Underlying Surface'}
                    {activeTool === 'remove_boundary' && 'Remove Boundary Loops'}
                    {activeTool === 'split' && 'Split Surface Along Seam'}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Mastercam 2018 Modify Surface operation.
                  </div>
                </div>

                {activeTool === 'cap' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', width: '200px' }}>
                      <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Hole Radius (mm)</label>
                      <input type="number" step="0.5" value={capRadius} onChange={(e) => setCapRadius(parseFloat(e.target.value) || 2)} style={inputStyle} />
                    </div>
                    <button onClick={handleAddHoleCap} style={primaryBtnStyle}>
                      <Plus size={16} />
                      <span>Generate Hole Cap Patch</span>
                    </button>
                  </div>
                )}

                {activeTool === 'fillet' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Fillet Radius R</label>
                        <input type="number" step="0.5" value={filletRad} onChange={(e) => setFilletRad(parseFloat(e.target.value) || 2)} style={inputStyle} />
                      </div>
                      <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Blend Length</label>
                        <input type="number" step="1" value={filletLen} onChange={(e) => setFilletLen(parseFloat(e.target.value) || 10)} style={inputStyle} />
                      </div>
                      <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Angle Deg</label>
                        <input type="number" step="5" value={filletAngle} onChange={(e) => setFilletAngle(parseFloat(e.target.value) || 90)} style={inputStyle} />
                      </div>
                    </div>
                    <button onClick={handleAddFillet} style={primaryBtnStyle}>
                      <Plus size={16} />
                      <span>Create Fillet Blend Surface</span>
                    </button>
                  </div>
                )}

                {activeTool !== 'cap' && activeTool !== 'fillet' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#475569' }}>
                      Ready to execute <strong>{activeTool.replace('_', ' ').toUpperCase()}</strong> on active Level 15 surfaces.
                    </div>
                    <button
                      onClick={() => {
                        handleAddPlane();
                        notify(`Applied ${activeTool.replace('_', ' ')} modifier to Level 15 geometry.`);
                      }}
                      style={primaryBtnStyle}
                    >
                      <Sparkles size={16} />
                      <span>Apply {activeTool.replace('_', ' ').toUpperCase()} Operation</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 10. NORMALS (CHANGE, SET, ORIENT) */}
            {(activeTool === 'normals_change' || activeTool === 'normals_set' || activeTool === 'normals_orient') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0284c7' }}>Surface Normal Vectors Control</div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Control surface front/back facing vectors, toolpath drive sides, and lighting orientation.
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', width: '220px' }}>
                  <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Target Alignment Axis:</label>
                  <select value={normalsAxis} onChange={(e) => setNormalsAxis(e.target.value)} style={{ ...inputStyle, width: 'auto', marginTop: 0 }}>
                    <option value="Y">+Y (Top Normal)</option>
                    <option value="Z">+Z (Front Normal)</option>
                    <option value="X">+X (Right Normal)</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <button
                    onClick={handleInvertNormals}
                    style={{ ...primaryBtnStyle, backgroundColor: '#0284c7', flexDirection: 'column', padding: '16px 12px' }}
                  >
                    <RefreshCw size={24} />
                    <span style={{ marginTop: '8px', fontWeight: 700 }}>Change / Flip Normals</span>
                    <span style={{ fontSize: '10px', opacity: 0.85 }}>Inverts facing vector</span>
                  </button>

                  <button
                    onClick={handleSetNormals}
                    style={{ ...primaryBtnStyle, backgroundColor: '#10b981', flexDirection: 'column', padding: '16px 12px' }}
                  >
                    <ArrowUp size={24} />
                    <span style={{ marginTop: '8px', fontWeight: 700 }}>Set Normal (+{normalsAxis})</span>
                    <span style={{ fontSize: '10px', opacity: 0.85 }}>Align to axis</span>
                  </button>

                  <button
                    onClick={handleInvertNormals}
                    style={{ ...primaryBtnStyle, backgroundColor: '#f59e0b', flexDirection: 'column', padding: '16px 12px' }}
                  >
                    <Compass size={24} />
                    <span style={{ marginTop: '8px', fontWeight: 700 }}>Orient Normals</span>
                    <span style={{ fontSize: '10px', opacity: 0.85 }}>Unify adjacent patches</span>
                  </button>
                </div>
              </div>
            )}

            {/* 11. LEVEL 15 SURFACE MANAGER */}
            {activeTool === 'list' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#38bdf8' }}>Level 15 Surface Manager</div>
                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>
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
                      backgroundColor: '#fef2f2',
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
                    <Layers size={36} color="#cbd5e1" style={{ margin: '0 auto 10px' }} />
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
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '5px',
                            fontSize: '12px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '9px', height: '9px', borderRadius: '2px', backgroundColor: isCheck ? '#f59e0b' : '#06b6d4' }} />
                            <div>
                              <div style={{ fontWeight: 600, color: '#0f172a' }}>{ent.name || `Surface_${idx + 1}`}</div>
                              <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                                Type: {ent.userData?.type || 'Surface'} | Role: <strong style={{ color: isCheck ? '#f59e0b' : '#0284c7' }}>{isCheck ? 'CHECK (Avoid)' : 'DRIVE (Machine)'}</strong>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              onClick={() => {
                                ent.visible = !ent.visible;
                                notify(`Surface visibility toggled.`);
                              }}
                              style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
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
            backgroundColor: '#f1f5f9',
            borderTop: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ fontSize: '11.5px', color: '#64748b' }}>
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
  backgroundColor: '#f8fafc',
  border: '1px solid #cbd5e1',
  borderRadius: '4px',
  color: '#0f172a',
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
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};
