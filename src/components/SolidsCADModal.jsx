import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Box, Orbit, Compass, Sliders, Disc, Plus, Trash2,
  CheckCircle2, RefreshCw, Eye, Grid, Maximize2, Layers,
  Scale, Sparkles, Scissors, Move, ArrowUp,
  FileText
} from 'lucide-react';
import {
  createBoxGeometry,
  createCylinderGeometry,
  createConeGeometry,
  createTorusGeometry,
  createExtrudedSolid,
  createSphereGeometry,
  createRevolvedSolid,
  createLoftSolid,
  createSweptSolid,
  createSolidPattern,
  createSolidFromSurfaces,
  createSolidChamfer,
  createSolidFillet,
  createSolidShell,
  createThickenedSolid,
  trimSolidByPlane,
  generateDrawingLayoutSheet,
  createMastercam2019TutorialPart,
  createTitan1MPart
} from '../utils/cadGeometry';
import {
  performSolidBoolean,
  performSolidImpression,
  BOOLEAN_OPERATIONS
} from '../utils/solidBooleanEngine';

const MATERIALS = [
  { id: 'alu_6061', name: '6061-T6 Aluminum', density: 2.70, color: '#38bdf8' },
  { id: 'steel_4140', name: '4140 Alloy Steel', density: 7.85, color: '#94a3b8' },
  { id: 'steel_p20', name: 'P20 Tool Steel', density: 7.85, color: '#64748b' },
  { id: 'titanium_6al4v', name: 'Ti-6Al-4V Titanium', density: 4.43, color: '#a855f7' },
  { id: 'brass_c360', name: 'C360 Free-Cutting Brass', density: 8.50, color: '#f59e0b' },
  { id: 'delrin_pom', name: 'Delrin / Acetal POM', density: 1.41, color: '#ffffff' },
  { id: 'stainless_304', name: '304 Stainless Steel', density: 8.00, color: '#334155' }
];

export default function SolidsCADModal({
  isOpen,
  onClose,
  initialTool = 'box',
  currentModel,
  solidsList = [],
  onSetPrimaryModel,
  onAddSolidBody,
  onRemoveSolidBody
}) {
  const [activeTool, setActiveTool] = useState(initialTool);
  const [feedback, setFeedback] = useState(null);
  const notify = (msg, type = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  useEffect(() => {
    if (initialTool) {
      if (initialTool === 'solid_cylinder') setActiveTool('cylinder');
      else if (initialTool === 'solid_block') setActiveTool('box');
      else if (initialTool === 'solid_sphere') setActiveTool('sphere');
      else if (initialTool === 'solid_cone') setActiveTool('cone');
      else if (initialTool === 'solid_torus') setActiveTool('torus');
      else if (initialTool === 'solid_extrude') setActiveTool('extrude');
      else if (initialTool === 'solid_revolve') setActiveTool('revolve');
      else if (initialTool === 'solid_loft') setActiveTool('loft');
      else if (initialTool === 'solid_sweep') setActiveTool('sweep');
      else if (initialTool === 'solid_boolean') setActiveTool('boolean');
      else if (initialTool === 'solid_impression') setActiveTool('impression');
      else if (initialTool === 'solid_pattern_rect') setActiveTool('pattern_rect');
      else if (initialTool === 'solid_pattern_circ') setActiveTool('pattern_circ');
      else if (initialTool === 'solid_pattern_manual') setActiveTool('pattern_manual');
      else if (initialTool === 'solid_from_surfaces') setActiveTool('from_surfaces');
      else if (initialTool === 'solid_fillet') setActiveTool('constant_fillet');
      else if (initialTool === 'solid_chamfer') setActiveTool('one_distance_chamfer');
      else if (initialTool === 'solid_shell') setActiveTool('shell');
      else if (initialTool === 'solid_thicken') setActiveTool('thicken');
      else if (initialTool === 'solid_draft') setActiveTool('draft');
      else if (initialTool === 'solid_trim_plane') setActiveTool('trim_by_plane');
      else if (initialTool === 'solid_drawing_layout') setActiveTool('drawing_layout');
      else setActiveTool(initialTool);
    }
  }, [initialTool, isOpen]);

  // Selected Material
  const [selectedMatId, setSelectedMatId] = useState('alu_6061');
  const activeMaterial = MATERIALS.find((m) => m.id === selectedMatId) || MATERIALS[0];

  // 1. Box Billet State
  const [boxW, setBoxW] = useState(80);
  const [boxH, setBoxH] = useState(35);
  const [boxD, setBoxD] = useState(60);

  // 2. Cylinder Blank State
  const [cylRadius, setCylRadius] = useState(35);
  const [cylHeight, setCylHeight] = useState(45);
  const [cylInnerR, setCylInnerR] = useState(0);

  // 3. Cone / Frustum State
  const [coneRBot, setConeRBot] = useState(35);
  const [coneRTop, setConeRTop] = useState(15);
  const [coneHeight, setConeHeight] = useState(45);

  // 4. Torus State
  const [torusRadius, setTorusRadius] = useState(30);
  const [torusTube, setTorusTube] = useState(10);

  // 5. Sphere State
  const [sphRadius, setSphRadius] = useState(25);

  // 6. Extruded Solid State
  const [extW, setExtW] = useState(70);
  const [extD, setExtD] = useState(50);
  const [extH, setExtH] = useState(35);
  const [extDraft, setExtDraft] = useState(2);

  // 7. Revolve, Loft, Sweep State
  const [revSweep, setRevSweep] = useState(360);
  const [sweepLen, setSweepLen] = useState(65);

  // 8. Modifiers (Fillet, Chamfer, Shell, Thicken, Cut Angle)
  const [filletR, setFilletR] = useState(6);
  const [chamferDist, setChamferDist] = useState(4);
  const [shellWall, setShellWall] = useState(4);
  const [thickenDist, setThickenDist] = useState(6);
  const [cutAngle, setCutAngle] = useState(30);

  // 9. Patterns State
  const [patCountX, setPatCountX] = useState(3);
  const [patCountY, setPatCountY] = useState(3);
  const [patSpacing, setPatSpacing] = useState(25);
  const [patCircCount, setPatCircCount] = useState(6);
  const [patPCD, setPatPCD] = useState(35);

  // 10. Boolean CSG State
  const [boolOp, setBoolOp] = useState(BOOLEAN_OPERATIONS.SUBTRACT);

  // 11. Plate with Cutouts & Fillets (Mastercam 2.5D Part)
  const [plateW, setPlateW] = useState(127);
  const [plateD, setPlateD] = useState(127);
  const [plateH, setPlateH] = useState(50.8);
  const [plateFillet, setPlateFillet] = useState(19.05);
  const [plateBore, setPlateBore] = useState(50.8);
  const [plateHoles, setPlateHoles] = useState(12.7);
  const [plateOffset, setPlateOffset] = useState(44.45);

  // Real-time mass calculation helper
  const calcMassKg = (volCm3) => {
    return ((volCm3 * activeMaterial.density) / 1000).toFixed(3);
  };

  // Computed Volumes (cm3)
  const boxVol = useMemo(() => (boxW * boxH * boxD) / 1000, [boxW, boxH, boxD]);
  const cylVol = useMemo(
    () => (Math.PI * (cylRadius * cylRadius - cylInnerR * cylInnerR) * cylHeight) / 1000,
    [cylRadius, cylInnerR, cylHeight]
  );
  const coneVol = useMemo(
    () => ((Math.PI * coneHeight) / 3) * (coneRBot * coneRBot + coneRBot * coneRTop + coneRTop * coneRTop) / 1000,
    [coneRBot, coneRTop, coneHeight]
  );

  if (!isOpen) return null;

  // Handlers
  const handleCreateBox = () => {
    const box = createBoxGeometry(boxW, boxH, boxD, {
      material: activeMaterial.name,
      density: activeMaterial.density
    });
    if (onAddSolidBody) onAddSolidBody(box);
    notify(`Solid Block (${boxW}x${boxH}x${boxD}mm - ${calcMassKg(boxVol)} kg) added to Level 10.`);
  };

  const handleCreateCylinder = () => {
    const cyl = createCylinderGeometry(cylRadius, cylHeight, {
      innerRadius: cylInnerR,
      axis: 'Y',
      material: activeMaterial.name,
      density: activeMaterial.density
    });
    if (onAddSolidBody) onAddSolidBody(cyl);
    notify(`Cylindrical Solid Blank (Ø${cylRadius * 2}x${cylHeight}mm) added to Level 10.`);
  };

  const handleCreateSphere = () => {
    const sph = createSphereGeometry(sphRadius, `Solid_Sphere_R${sphRadius}`);
    if (onAddSolidBody) onAddSolidBody(sph);
    notify(`Spherical Solid Body (Ø${sphRadius * 2}mm) added to Level 10.`);
  };

  const handleCreateCone = () => {
    const cone = createConeGeometry(coneRBot, coneRTop, coneHeight);
    if (onAddSolidBody) onAddSolidBody(cone);
    notify(`Conical Solid Frustum (R${coneRBot} to R${coneRTop}) added to Level 10.`);
  };

  const handleCreateTorus = () => {
    const torus = createTorusGeometry(torusRadius, torusTube);
    if (onAddSolidBody) onAddSolidBody(torus);
    notify(`Torus Solid Ring (R${torusRadius}, Tube ${torusTube}mm) added to Level 10.`);
  };

  const handleCreateExtrude = () => {
    const ext = createExtrudedSolid(extW, extD, extH, extDraft);
    if (onAddSolidBody) onAddSolidBody(ext);
    notify(`Extruded Solid Body (${extW}x${extD}x${extH}mm, Draft: ${extDraft}°) created.`);
  };

  const handleCreateRevolve = () => {
    const rev = createRevolvedSolid(cylRadius, coneRTop, cylHeight, revSweep);
    if (onAddSolidBody) onAddSolidBody(rev);
    notify(`Revolved Solid Body (${revSweep}°) added to Level 10.`);
  };

  const handleCreateLoft = () => {
    const loft = createLoftSolid(boxW, boxD, boxW * 0.7, boxD * 0.7, boxH);
    if (onAddSolidBody) onAddSolidBody(loft);
    notify(`Lofted Solid Body created successfully.`);
  };

  const handleCreateSweep = () => {
    const swp = createSweptSolid(cylRadius * 0.5, sweepLen);
    if (onAddSolidBody) onAddSolidBody(swp);
    notify(`Swept Solid Body (Length ${sweepLen}mm) created.`);
  };

  const handleCreateBoolean = () => {
    const targetMesh = new THREE.Mesh(
      new THREE.BoxGeometry(boxW, boxH, boxD),
      new THREE.MeshStandardMaterial({ color: 0x0284c7 })
    );
    const toolMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(cylRadius * 0.5, cylRadius * 0.5, boxH * 1.5, 32),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b })
    );
    const result = performSolidBoolean(targetMesh, toolMesh, boolOp);
    if (onAddSolidBody) onAddSolidBody(result);
    notify(`Boolean ${boolOp} operation executed successfully on solid.`);
  };

  const handleCreateImpression = () => {
    const billet = new THREE.Mesh(
      new THREE.BoxGeometry(boxW, boxH, boxD),
      new THREE.MeshStandardMaterial({ color: 0xd97706 })
    );
    const stamp = new THREE.Mesh(
      new THREE.CylinderGeometry(cylRadius * 0.6, cylRadius * 0.6, boxH * 0.8, 32),
      new THREE.MeshStandardMaterial({ color: 0x0284c7 })
    );
    const impression = performSolidImpression(billet, stamp, 1.002);
    if (onAddSolidBody) onAddSolidBody(impression);
    notify(`Mold Cavity Impression stamped with 0.2% shrinkage compensation.`);
  };

  const handleCreatePatternRect = () => {
    const pat = createSolidPattern('rect', {
      countX: patCountX,
      countY: patCountY,
      spacingX: patSpacing,
      spacingY: patSpacing,
      radius: 6,
      depth: boxH
    });
    if (onAddSolidBody) onAddSolidBody(pat);
    notify(`Rectangular Pattern (${patCountX}x${patCountY} grid) generated.`);
  };

  const handleCreatePatternCirc = () => {
    const pat = createSolidPattern('circ', {
      count: patCircCount,
      pcdRadius: patPCD,
      radius: 6,
      depth: boxH
    });
    if (onAddSolidBody) onAddSolidBody(pat);
    notify(`Circular Pattern (${patCircCount} holes, PCD ${patPCD * 2}mm) generated.`);
  };

  const handleCreatePatternManual = () => {
    const pat = createSolidPattern('manual', { radius: 6, depth: boxH });
    if (onAddSolidBody) onAddSolidBody(pat);
    notify(`Manual Coordinate Pattern instances generated.`);
  };

  const handleCreateFromSurfaces = () => {
    const solid = createSolidFromSurfaces(boxW, boxH, boxD);
    if (onAddSolidBody) onAddSolidBody(solid);
    notify(`Surface sheets stitched into watertight solid body.`);
  };

  const handleCreatePlateWithHoles = () => {
    const plate = createMastercam2019TutorialPart({
      width: plateW / 25.4,
      depth: plateD / 25.4,
      thickness: plateH / 25.4,
      filletRadius: plateFillet / 25.4,
      centerHoleDia: plateBore / 25.4,
      cornerHoleDia: plateHoles / 25.4,
      holeOffset: plateOffset / 25.4,
      color: activeMaterial.color
    });
    if (onAddSolidBody) onAddSolidBody(plate);
    notify(`Plate with Fillets & Holes (${plateW}x${plateD}x${plateH}mm) added to scene.`);
  };

  const handleCreateTitan1M = () => {
    const titan = createTitan1MPart({ color: activeMaterial.color });
    if (onAddSolidBody) onAddSolidBody(titan);
    notify(`TITAN-1M Aerospace Benchmark Solid Body added to scene.`);
  };

  const handleCreateFillet = () => {
    const fillet = createSolidFillet(boxW, boxH, boxD, filletR);
    if (onAddSolidBody) onAddSolidBody(fillet);
    notify(`Solid Body with Constant Fillet (R${filletR}mm) created.`);
  };

  const handleCreateChamfer = () => {
    const chamfer = createSolidChamfer(boxW, boxH, boxD, chamferDist);
    if (onAddSolidBody) onAddSolidBody(chamfer);
    notify(`Solid Body with 45° Chamfer (C${chamferDist}mm) created.`);
  };

  const handleCreateShell = () => {
    const shell = createSolidShell(boxW, boxH, boxD, shellWall);
    if (onAddSolidBody) onAddSolidBody(shell);
    notify(`Shelled Solid Body (Wall ${shellWall}mm) created.`);
  };

  const handleCreateThicken = () => {
    const thickened = createThickenedSolid(boxW, boxD, thickenDist);
    if (onAddSolidBody) onAddSolidBody(thickened);
    notify(`Surface thickened into 3D Solid Body (+${thickenDist}mm).`);
  };

  const handleTrimByPlane = () => {
    const trimmed = trimSolidByPlane(boxW, boxH, boxD, cutAngle);
    if (onAddSolidBody) onAddSolidBody(trimmed);
    notify(`Solid sliced along ${cutAngle}° planar knife blade.`);
  };

  const handleCreateDrawingLayout = () => {
    const layout = generateDrawingLayoutSheet(boxW, boxH, boxD);
    if (onAddSolidBody) onAddSolidBody(layout);
    notify(`2D Orthographic Drawing Sheet (4 Views) generated on Level 20.`);
  };

  // Nav tools list
  const navTools = [
    // Simple
    { id: 'cylinder', group: 'Simple', label: 'Cylinder Solid', icon: Orbit, badge: 'Primitive' },
    { id: 'box', group: 'Simple', label: 'Block Billet', icon: Box, badge: 'Primitive' },
    { id: 'sphere', group: 'Simple', label: 'Sphere Solid', icon: Disc, badge: 'Primitive' },
    { id: 'cone', group: 'Simple', label: 'Cone Frustum', icon: Compass, badge: 'Primitive' },
    { id: 'torus', group: 'Simple', label: 'Torus Ring', icon: Disc, badge: 'Primitive' },

    // Create
    { id: 'titan1m', group: 'Create', label: 'TITAN-1M Part', icon: Sparkles, badge: 'Titans CNC' },
    { id: 'plate_holes', group: 'Create', label: 'Plate with Holes & Fillets', icon: Sparkles, badge: '2.5D Part' },
    { id: 'extrude', group: 'Create', label: 'Extrude Solid', icon: Sliders, badge: 'Draft' },
    { id: 'revolve', group: 'Create', label: 'Revolve Solid', icon: RefreshCw, badge: 'Turned' },
    { id: 'loft', group: 'Create', label: 'Loft Solid', icon: Sliders, badge: 'Profile' },
    { id: 'sweep', group: 'Create', label: 'Sweep Solid', icon: Move, badge: 'Trajectory' },
    { id: 'boolean', group: 'Create', label: 'Boolean CSG', icon: Box, badge: 'CSG Cut' },
    { id: 'impression', group: 'Create', label: 'Impression', icon: Sparkles, badge: 'Mold' },
    { id: 'pattern_rect', group: 'Create', label: 'Rect Pattern', icon: Grid, badge: 'Grid' },
    { id: 'pattern_circ', group: 'Create', label: 'Circ Pattern', icon: Compass, badge: 'Radial' },
    { id: 'pattern_manual', group: 'Create', label: 'Manual Pattern', icon: Move, badge: 'Points' },
    { id: 'from_surfaces', group: 'Create', label: 'From Surfaces', icon: Layers, badge: 'Stitch' },

    // Modify
    { id: 'constant_fillet', group: 'Modify', label: 'Constant Fillet', icon: Sparkles, badge: 'Blend' },
    { id: 'one_distance_chamfer', group: 'Modify', label: 'Chamfer (45°)', icon: Scissors, badge: 'Bevel' },
    { id: 'shell', group: 'Modify', label: 'Shell Body', icon: Box, badge: 'Thin Wall' },
    { id: 'thicken', group: 'Modify', label: 'Thicken Sheet', icon: ArrowUp, badge: '3D Solid' },
    { id: 'draft', group: 'Modify', label: 'Draft Faces', icon: Maximize2, badge: 'Taper' },
    { id: 'trim_by_plane', group: 'Modify', label: 'Trim by Plane', icon: Scissors, badge: 'Knife Cut' },

    // Drawing & Manager
    { id: 'drawing_layout', group: 'Drawing', label: 'Drawing Layout', icon: FileText, badge: '4-View' },
    { id: 'manager', group: 'Manager', label: 'Solids Manager', icon: Layers, badge: `${solidsList.length}` }
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
            <Box size={22} color="#0284c7" />
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '0.5px' }}>
                SOLIDS CAD MODELING &amp; PARAMETRIC BILLET SUITE
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', gap: '12px', marginTop: '2px' }}>
                <span>Mastercam 2018 Specification</span>
                <span>•</span>
                <span style={{ color: '#0284c7', fontWeight: 600 }}>Material: {activeMaterial.name} ({activeMaterial.density} g/cm³)</span>
                <span>•</span>
                <span style={{ color: '#10b981' }}>{solidsList.length} Active Solids</span>
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
          {/* Sidebar */}
          <div
            style={{
              width: '230px',
              backgroundColor: '#f8fafc',
              borderRight: '1px solid #e2e8f0',
              padding: '10px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              overflowY: 'auto'
            }}
          >
            {['Simple', 'Create', 'Modify', 'Drawing', 'Manager'].map((grp) => {
              const tools = navTools.filter((t) => t.group === grp);
              if (tools.length === 0) return null;

              return (
                <div key={grp} style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', padding: '4px 8px', letterSpacing: '0.8px' }}>
                    {grp}
                  </div>
                  {tools.map((tool) => {
                    const Icon = tool.icon;
                    const isActive = activeTool === tool.id || (activeTool === 'block' && tool.id === 'box');
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

          {/* Parameter Content Area */}
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
            {/* Material Selector Bar */}
            <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Scale size={16} color="#0284c7" />
                <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155' }}>Raw Stock Material:</span>
                <select
                  value={selectedMatId}
                  onChange={(e) => setSelectedMatId(e.target.value)}
                  style={{ ...inputStyle, width: 'auto', marginTop: 0 }}
                >
                  {MATERIALS.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.density} g/cm³)</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 1. CYLINDER SOLID */}
            {activeTool === 'cylinder' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0284c7' }}>Cylindrical Solid Billet</div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Create solid cylindrical stock for turning, 4th axis indexing, or round bosses.
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Outer Radius R (mm)</label>
                    <input type="number" step="1" value={cylRadius} onChange={(e) => setCylRadius(parseFloat(e.target.value) || 5)} style={inputStyle} />
                  </div>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Length / Height (mm)</label>
                    <input type="number" step="1" value={cylHeight} onChange={(e) => setCylHeight(parseFloat(e.target.value) || 5)} style={inputStyle} />
                  </div>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Inner Bore Radius (mm)</label>
                    <input type="number" step="1" value={cylInnerR} onChange={(e) => setCylInnerR(parseFloat(e.target.value) || 0)} style={inputStyle} />
                  </div>
                </div>

                <div style={{ background: '#f0fdf4', padding: '10px 14px', borderRadius: '6px', border: '1px solid #86efac', fontSize: '11.5px', color: '#166534' }}>
                  Calculated Volume: <strong>{cylVol.toFixed(1)} cm³</strong> | Estimated Mass: <strong>{calcMassKg(cylVol)} kg</strong>
                </div>

                <button onClick={handleCreateCylinder} style={primaryBtnStyle}>
                  <Plus size={16} />
                  <span>Generate Cylindrical Solid Body</span>
                </button>
              </div>
            )}

            {/* 2. BLOCK / BOX BILLET */}
            {(activeTool === 'box' || activeTool === 'block') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0284c7' }}>Solid Block / Billet Body</div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Create rectangular solid blank with precise volumetric dimensions and mass properties.
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Width X (mm)</label>
                    <input type="number" step="1" value={boxW} onChange={(e) => setBoxW(parseFloat(e.target.value) || 10)} style={inputStyle} />
                  </div>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Height Y (mm)</label>
                    <input type="number" step="1" value={boxH} onChange={(e) => setBoxH(parseFloat(e.target.value) || 10)} style={inputStyle} />
                  </div>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Depth Z (mm)</label>
                    <input type="number" step="1" value={boxD} onChange={(e) => setBoxD(parseFloat(e.target.value) || 10)} style={inputStyle} />
                  </div>
                </div>

                <div style={{ background: '#f0fdf4', padding: '10px 14px', borderRadius: '6px', border: '1px solid #86efac', fontSize: '11.5px', color: '#166534' }}>
                  Calculated Volume: <strong>{boxVol.toFixed(1)} cm³</strong> | Estimated Mass: <strong>{calcMassKg(boxVol)} kg</strong>
                </div>

                <button onClick={handleCreateBox} style={primaryBtnStyle}>
                  <Plus size={16} />
                  <span>Generate Solid Block Body on Level 10</span>
                </button>
              </div>
            )}

            {/* 3. SPHERE, CONE, TORUS */}
            {(activeTool === 'sphere' || activeTool === 'cone' || activeTool === 'torus') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0284c7' }}>Solid Geometric Primitive ({activeTool.toUpperCase()})</div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Create solid body primitive on Level 10.
                  </div>
                </div>

                {activeTool === 'sphere' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', width: '220px' }}>
                      <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Sphere Radius (mm)</label>
                      <input type="number" step="1" value={sphRadius} onChange={(e) => setSphRadius(parseFloat(e.target.value) || 5)} style={inputStyle} />
                    </div>
                    <button onClick={handleCreateSphere} style={primaryBtnStyle}>
                      <Plus size={16} />
                      <span>Generate Solid Sphere</span>
                    </button>
                  </div>
                )}

                {activeTool === 'cone' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Radius Base (mm)</label>
                        <input type="number" step="1" value={coneRBot} onChange={(e) => setConeRBot(parseFloat(e.target.value) || 5)} style={inputStyle} />
                      </div>
                      <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Radius Top (mm)</label>
                        <input type="number" step="1" value={coneRTop} onChange={(e) => setConeRTop(parseFloat(e.target.value) || 0)} style={inputStyle} />
                      </div>
                      <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Height (mm)</label>
                        <input type="number" step="1" value={coneHeight} onChange={(e) => setConeHeight(parseFloat(e.target.value) || 10)} style={inputStyle} />
                      </div>
                    </div>
                    <div style={{ background: '#f0fdf4', padding: '10px 14px', borderRadius: '6px', border: '1px solid #86efac', fontSize: '11.5px', color: '#166534' }}>
                      Calculated Volume: <strong>{coneVol.toFixed(1)} cm³</strong> | Estimated Mass: <strong>{calcMassKg(coneVol)} kg</strong>
                    </div>

                    <button onClick={handleCreateCone} style={primaryBtnStyle}>
                      <Plus size={16} />
                      <span>Generate Solid Cone Frustum</span>
                    </button>
                  </div>
                )}

                {activeTool === 'torus' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                      <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Major Ring Radius (mm)</label>
                        <input type="number" step="1" value={torusRadius} onChange={(e) => setTorusRadius(parseFloat(e.target.value) || 10)} style={inputStyle} />
                      </div>
                      <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Tube Radius (mm)</label>
                        <input type="number" step="1" value={torusTube} onChange={(e) => setTorusTube(parseFloat(e.target.value) || 2)} style={inputStyle} />
                      </div>
                    </div>
                    <button onClick={handleCreateTorus} style={primaryBtnStyle}>
                      <Plus size={16} />
                      <span>Generate Solid Torus Ring</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 3A. TITAN-1M BENCHMARK MILLING PART */}
            {activeTool === 'titan1m' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0284c7' }}>
                    TITANS of CNC: TITAN-1M Aerospace Part
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Industry standard CNC benchmark part: 4.0"x1.9"x0.75" 6061-T6 aluminum with stepped outer profile, central triangular pocket, and 7x 10-32 tapped holes.
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#334155', lineHeight: 1.6 }}>
                  <div><strong>Workpiece:</strong> 4.000" x 1.900" x 0.750" (101.6mm x 48.26mm x 19.05mm)</div>
                  <div><strong>Material:</strong> 6061-T6 Aircraft-Grade Aluminum</div>
                  <div><strong>Features:</strong> 2.5D Stepped Shoulder, Triangular Machined Pocket, 7x 10-32 UNF Threaded Holes, 0.020" Deburr Chamfers</div>
                </div>

                <button onClick={handleCreateTitan1M} style={primaryBtnStyle}>
                  <Sparkles size={16} />
                  <span>Generate TITAN-1M Solid Body</span>
                </button>
              </div>
            )}

            {/* 3B. 2.5D MILLING PLATE WITH HOLES & FILLETS */}
            {activeTool === 'plate_holes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0284c7' }}>
                    2.5D Milling Plate Solid (Fillets, Bore &amp; Bolt Holes)
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Generate the standard Mastercam 2.5D milling tutorial part: filleted rectangular plate with central through-bore and 4 corner bolt holes.
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Width (mm / 5")</label>
                    <input type="number" step="1" value={plateW} onChange={(e) => setPlateW(parseFloat(e.target.value) || 127)} style={inputStyle} />
                  </div>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Depth (mm / 5")</label>
                    <input type="number" step="1" value={plateD} onChange={(e) => setPlateD(parseFloat(e.target.value) || 127)} style={inputStyle} />
                  </div>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Thickness (mm / 2")</label>
                    <input type="number" step="1" value={plateH} onChange={(e) => setPlateH(parseFloat(e.target.value) || 50.8)} style={inputStyle} />
                  </div>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Corner Fillet R (0.75")</label>
                    <input type="number" step="0.5" value={plateFillet} onChange={(e) => setPlateFillet(parseFloat(e.target.value) || 19.05)} style={inputStyle} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Center Bore Ø (mm / 2")</label>
                    <input type="number" step="1" value={plateBore} onChange={(e) => setPlateBore(parseFloat(e.target.value) || 50.8)} style={inputStyle} />
                  </div>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>4x Bolt Holes Ø (0.5")</label>
                    <input type="number" step="0.5" value={plateHoles} onChange={(e) => setPlateHoles(parseFloat(e.target.value) || 12.7)} style={inputStyle} />
                  </div>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Hole Offset (1.75")</label>
                    <input type="number" step="0.5" value={plateOffset} onChange={(e) => setPlateOffset(parseFloat(e.target.value) || 44.45)} style={inputStyle} />
                  </div>
                </div>

                <div style={{ background: '#eff6ff', padding: '10px 14px', borderRadius: '6px', border: '1px solid #bfdbfe', fontSize: '11.5px', color: '#1e40af' }}>
                  Parametric B-Rep solid model with through-cuts, feature cylinders, and arc center points for 2D Facing, Contour, Circle Mill, Spot Drill, and Peck Drill operations.
                </div>

                <button onClick={handleCreatePlateWithHoles} style={primaryBtnStyle}>
                  <Plus size={16} />
                  <span>Generate Parametric 2.5D Milling Plate Solid</span>
                </button>
              </div>
            )}

            {/* 4. EXTRUDE, REVOLVE, LOFT, SWEEP */}
            {(activeTool === 'extrude' || activeTool === 'revolve' || activeTool === 'loft' || activeTool === 'sweep') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0284c7' }}>
                    {activeTool === 'extrude' && 'Extrude Profile into Solid Body'}
                    {activeTool === 'revolve' && 'Revolve Profile into Turned Solid'}
                    {activeTool === 'loft' && 'Loft Solid Across Cross-Sections'}
                    {activeTool === 'sweep' && 'Sweep Profile Along Trajectory'}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Mastercam 2018 Solid Create feature.
                  </div>
                </div>

                {activeTool === 'extrude' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                      <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Width (mm)</label>
                        <input type="number" step="1" value={extW} onChange={(e) => setExtW(parseFloat(e.target.value) || 10)} style={inputStyle} />
                      </div>
                      <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Depth (mm)</label>
                        <input type="number" step="1" value={extD} onChange={(e) => setExtD(parseFloat(e.target.value) || 10)} style={inputStyle} />
                      </div>
                      <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Extrusion Height</label>
                        <input type="number" step="1" value={extH} onChange={(e) => setExtH(parseFloat(e.target.value) || 10)} style={inputStyle} />
                      </div>
                      <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Draft Angle (°)</label>
                        <input type="number" step="0.5" value={extDraft} onChange={(e) => setExtDraft(parseFloat(e.target.value) || 0)} style={inputStyle} />
                      </div>
                    </div>
                    <button onClick={handleCreateExtrude} style={primaryBtnStyle}>
                      <Plus size={16} />
                      <span>Extrude Solid Body</span>
                    </button>
                  </div>
                )}

                {activeTool === 'revolve' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', width: '220px' }}>
                      <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Revolution Angle (°)</label>
                      <input type="number" step="15" value={revSweep} onChange={(e) => setRevSweep(parseFloat(e.target.value) || 360)} style={inputStyle} />
                    </div>
                    <button onClick={handleCreateRevolve} style={primaryBtnStyle}>
                      <Plus size={16} />
                      <span>Revolve Solid Body</span>
                    </button>
                  </div>
                )}

                {activeTool === 'loft' && (
                  <button onClick={handleCreateLoft} style={primaryBtnStyle}>
                    <Plus size={16} />
                    <span>Create Lofted Solid</span>
                  </button>
                )}

                {activeTool === 'sweep' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', width: '220px' }}>
                      <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Trajectory Length (mm)</label>
                      <input type="number" step="5" value={sweepLen} onChange={(e) => setSweepLen(parseFloat(e.target.value) || 20)} style={inputStyle} />
                    </div>
                    <button onClick={handleCreateSweep} style={primaryBtnStyle}>
                      <Plus size={16} />
                      <span>Create Swept Solid Tube</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 5. BOOLEAN CSG & IMPRESSION */}
            {(activeTool === 'boolean' || activeTool === 'impression') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0284c7' }}>
                    {activeTool === 'boolean' ? 'Constructive Solid Geometry (CSG) Boolean' : 'Mold Cavity & Core Impression'}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Real 3D volumetric boolean computation powered by three-bvh-csg.
                  </div>
                </div>

                {activeTool === 'boolean' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => setBoolOp(BOOLEAN_OPERATIONS.SUBTRACT)}
                        style={{ ...primaryBtnStyle, flex: 1, backgroundColor: boolOp === BOOLEAN_OPERATIONS.SUBTRACT ? '#0284c7' : '#f1f5f9', color: boolOp === BOOLEAN_OPERATIONS.SUBTRACT ? '#fff' : '#475569' }}
                      >
                        Cut / Subtract
                      </button>
                      <button
                        onClick={() => setBoolOp(BOOLEAN_OPERATIONS.UNION)}
                        style={{ ...primaryBtnStyle, flex: 1, backgroundColor: boolOp === BOOLEAN_OPERATIONS.UNION ? '#0284c7' : '#f1f5f9', color: boolOp === BOOLEAN_OPERATIONS.UNION ? '#fff' : '#475569' }}
                      >
                        Union / Combine
                      </button>
                      <button
                        onClick={() => setBoolOp(BOOLEAN_OPERATIONS.INTERSECT)}
                        style={{ ...primaryBtnStyle, flex: 1, backgroundColor: boolOp === BOOLEAN_OPERATIONS.INTERSECT ? '#0284c7' : '#f1f5f9', color: boolOp === BOOLEAN_OPERATIONS.INTERSECT ? '#fff' : '#475569' }}
                      >
                        Intersect Common
                      </button>
                    </div>
                    <button onClick={handleCreateBoolean} style={primaryBtnStyle}>
                      <Plus size={16} />
                      <span>Execute Boolean {boolOp}</span>
                    </button>
                  </div>
                )}

                {activeTool === 'impression' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#475569' }}>
                      Stamps the workpiece solid body into a raw billet plate with automatic thermal shrinkage factor compensation (1.002).
                    </div>
                    <button onClick={handleCreateImpression} style={primaryBtnStyle}>
                      <Sparkles size={16} />
                      <span>Stamp Mold Impression Cavity</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 6. PATTERNS & FROM SURFACES */}
            {(activeTool.startsWith('pattern_') || activeTool === 'from_surfaces') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0284c7' }}>Solid Feature Pattern &amp; Stitching</div>
                </div>

                {activeTool === 'pattern_rect' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Count X</label>
                        <input type="number" step="1" value={patCountX} onChange={(e) => setPatCountX(parseInt(e.target.value) || 2)} style={inputStyle} />
                      </div>
                      <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Count Y</label>
                        <input type="number" step="1" value={patCountY} onChange={(e) => setPatCountY(parseInt(e.target.value) || 2)} style={inputStyle} />
                      </div>
                      <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Spacing (mm)</label>
                        <input type="number" step="5" value={patSpacing} onChange={(e) => setPatSpacing(parseFloat(e.target.value) || 10)} style={inputStyle} />
                      </div>
                    </div>
                    <button onClick={handleCreatePatternRect} style={primaryBtnStyle}>
                      <Grid size={16} />
                      <span>Create Rectangular Pattern Grid</span>
                    </button>
                  </div>
                )}

                {activeTool === 'pattern_circ' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                      <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Number of Holes/Features</label>
                        <input type="number" step="1" value={patCircCount} onChange={(e) => setPatCircCount(parseInt(e.target.value) || 3)} style={inputStyle} />
                      </div>
                      <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>PCD Radius (mm)</label>
                        <input type="number" step="5" value={patPCD} onChange={(e) => setPatPCD(parseFloat(e.target.value) || 10)} style={inputStyle} />
                      </div>
                    </div>
                    <button onClick={handleCreatePatternCirc} style={primaryBtnStyle}>
                      <Compass size={16} />
                      <span>Create Circular Radial Pattern</span>
                    </button>
                  </div>
                )}

                {activeTool === 'pattern_manual' && (
                  <button onClick={handleCreatePatternManual} style={primaryBtnStyle}>
                    <Move size={16} />
                    <span>Create Coordinate Instances</span>
                  </button>
                )}

                {activeTool === 'from_surfaces' && (
                  <button onClick={handleCreateFromSurfaces} style={primaryBtnStyle}>
                    <Layers size={16} />
                    <span>Stitch Surfaces into Watertight Solid</span>
                  </button>
                )}
              </div>
            )}

            {/* 7. MODIFY (FILLET, CHAMFER, SHELL, THICKEN, DRAFT, TRIM BY PLANE) */}
            {(activeTool === 'constant_fillet' || activeTool === 'one_distance_chamfer' || activeTool === 'shell' || activeTool === 'thicken' || activeTool === 'draft' || activeTool === 'trim_by_plane') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0284c7' }}>Solid Modifiers Studio</div>
                </div>

                {activeTool === 'constant_fillet' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', width: '220px' }}>
                      <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Fillet Radius R (mm)</label>
                      <input type="number" step="0.5" value={filletR} onChange={(e) => setFilletR(parseFloat(e.target.value) || 1)} style={inputStyle} />
                    </div>
                    <button onClick={handleCreateFillet} style={primaryBtnStyle}>
                      <Sparkles size={16} />
                      <span>Apply Constant Fillet Blend</span>
                    </button>
                  </div>
                )}

                {activeTool === 'one_distance_chamfer' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', width: '220px' }}>
                      <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Chamfer Distance (45° mm)</label>
                      <input type="number" step="0.5" value={chamferDist} onChange={(e) => setChamferDist(parseFloat(e.target.value) || 1)} style={inputStyle} />
                    </div>
                    <button onClick={handleCreateChamfer} style={primaryBtnStyle}>
                      <Scissors size={16} />
                      <span>Apply 45° Edge Chamfer</span>
                    </button>
                  </div>
                )}

                {activeTool === 'shell' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', width: '220px' }}>
                      <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Uniform Wall Thickness (mm)</label>
                      <input type="number" step="0.5" value={shellWall} onChange={(e) => setShellWall(parseFloat(e.target.value) || 1)} style={inputStyle} />
                    </div>
                    <button onClick={handleCreateShell} style={primaryBtnStyle}>
                      <Box size={16} />
                      <span>Shell Solid Body Cavity</span>
                    </button>
                  </div>
                )}

                {activeTool === 'thicken' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', width: '220px' }}>
                      <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Thicken Distance (mm)</label>
                      <input type="number" step="0.5" value={thickenDist} onChange={(e) => setThickenDist(parseFloat(e.target.value) || 1)} style={inputStyle} />
                    </div>
                    <button onClick={handleCreateThicken} style={primaryBtnStyle}>
                      <ArrowUp size={16} />
                      <span>Thicken Surface into Solid</span>
                    </button>
                  </div>
                )}

                {activeTool === 'trim_by_plane' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', width: '220px' }}>
                      <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Knife Slicing Angle (°)</label>
                      <input type="number" step="5" value={cutAngle} onChange={(e) => setCutAngle(parseFloat(e.target.value) || 10)} style={inputStyle} />
                    </div>
                    <button onClick={handleTrimByPlane} style={primaryBtnStyle}>
                      <Scissors size={16} />
                      <span>Trim Solid along Planar Knife</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 8. DRAWING LAYOUT */}
            {activeTool === 'drawing_layout' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0284c7' }}>2D Orthographic Drawing Layout Sheet</div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Generate ANSI / ISO A3 Multi-View Drawing Sheet (Top, Front, Right Side, and Isometric 3D projections).
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#475569' }}>
                  Creates drawing border frame, title block, and orthographic wireframe projections on Level 20 (Drafting/Drawing).
                </div>

                <button onClick={handleCreateDrawingLayout} style={primaryBtnStyle}>
                  <FileText size={16} />
                  <span>Generate Drawing Layout Sheet</span>
                </button>
              </div>
            )}

            {/* 9. SOLIDS MANAGER */}
            {activeTool === 'manager' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0284c7' }}>Level 10 Solids Manager</div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Inspect active solid bodies, manage visibility, or delete solids.
                  </div>
                </div>

                {solidsList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                    <Box size={36} color="#cbd5e1" style={{ margin: '0 auto 10px' }} />
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>No custom solid bodies created yet</div>
                    <div style={{ fontSize: '11px', marginTop: '4px' }}>
                      Use the Solid tools on the left to create blocks, cylinders, CSG booleans, or drawing layouts.
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {solidsList.map((sol, idx) => (
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
                          <Box size={16} color="#0284c7" />
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{sol.name || `Solid_${idx + 1}`}</div>
                            <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                              Type: {sol.userData?.type || 'Solid Body'} | Material: {sol.userData?.material || activeMaterial.name}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => {
                              sol.visible = !sol.visible;
                              notify(`Solid visibility toggled.`);
                            }}
                            style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                            title="Toggle visibility"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => onRemoveSolidBody && onRemoveSolidBody(sol)}
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                            title="Delete solid"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
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
            backgroundColor: '#f1f5f9',
            borderTop: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ fontSize: '11.5px', color: '#64748b' }}>
            Solids reside on Level 10 and are used as cutting stock, workpiece geometry, and CSG bodies.
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '6px 16px',
              backgroundColor: '#0284c7',
              border: 'none',
              borderRadius: '4px',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close Solids Studio
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
  backgroundColor: '#0284c7',
  border: 'none',
  borderRadius: '5px',
  color: '#ffffff',
  fontSize: '12.5px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background-color 0.15s ease',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};
