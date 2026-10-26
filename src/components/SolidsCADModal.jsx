import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Box, Orbit, Compass, Sliders, Disc, Plus, Trash2,
  CheckCircle2, RefreshCw, Eye, Grid, Maximize2, Layers,
  ShieldCheck, ArrowRight, Scale, Sparkles
} from 'lucide-react';
import {
  createBoxGeometry,
  createCylinderGeometry,
  createConeGeometry,
  createTorusGeometry,
  createExtrudedSolid,
  createPocketedBillet
} from '../utils/cadGeometry';

const MATERIALS = [
  { id: 'alu_6061', name: '6061-T6 Aluminum', density: 2.70, color: '#38bdf8' },
  { id: 'steel_4140', name: '4140 Alloy Steel', density: 7.85, color: '#94a3b8' },
  { id: 'steel_p20', name: 'P20 Tool Steel', density: 7.85, color: '#64748b' },
  { id: 'titanium_6al4v', name: 'Ti-6Al-4V Titanium', density: 4.43, color: '#a855f7' },
  { id: 'brass_c360', name: 'C360 Free-Cutting Brass', density: 8.50, color: '#f59e0b' },
  { id: 'delrin_pom', name: 'Delrin / Acetal POM', density: 1.41, color: '#ffffff' },
  { id: 'stainless_304', name: '304 Stainless Steel', density: 8.00, color: '#cbd5e1' }
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

  useEffect(() => {
    if (initialTool) {
      setActiveTool(initialTool);
    }
  }, [initialTool, isOpen]);

  // Selected Material
  const [selectedMatId, setSelectedMatId] = useState('alu_6061');
  const activeMaterial = MATERIALS.find((m) => m.id === selectedMatId) || MATERIALS[0];

  // 1. Box Billet State
  const [boxW, setBoxW] = useState(80);
  const [boxH, setBoxH] = useState(35);
  const [boxD, setBoxD] = useState(60);
  const [boxOrigin, setBoxOrigin] = useState('center'); // 'center' or 'corner'

  // 2. Cylinder Blank State
  const [cylRadius, setCylRadius] = useState(35);
  const [cylHeight, setCylHeight] = useState(45);
  const [cylInnerR, setCylInnerR] = useState(0); // 0 = solid, >0 = hollow bore
  const [cylAxis, setCylAxis] = useState('Y'); // 'Y' (vertical), 'Z' (horizontal), 'X' (lathe)

  // 3. Cone / Frustum State
  const [coneRBot, setConeRBot] = useState(35);
  const [coneRTop, setConeRTop] = useState(15);
  const [coneHeight, setConeHeight] = useState(45);

  // 4. Torus State
  const [torusRadius, setTorusRadius] = useState(30);
  const [torusTube, setTorusTube] = useState(10);

  // 5. Extruded Solid State
  const [extW, setExtW] = useState(70);
  const [extD, setExtD] = useState(50);
  const [extH, setExtH] = useState(35);
  const [extDraft, setExtDraft] = useState(2);

  // 6. Pocketed Cavity Billet State
  const [pBaseW, setPBaseW] = useState(90);
  const [pBaseH, setPBaseH] = useState(40);
  const [pBaseD, setPBaseD] = useState(70);
  const [pockW, setPockW] = useState(55);
  const [pockD, setPockD] = useState(40);
  const [pockDepth, setPockDepth] = useState(18);
  const [pockFillet, setPockFillet] = useState(6);

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
  const pocketVol = useMemo(
    () => (pBaseW * pBaseH * pBaseD - pockW * pockD * pockDepth) / 1000,
    [pBaseW, pBaseH, pBaseD, pockW, pockD, pockDepth]
  );

  if (!isOpen) return null;

  // Handlers
  const handleCreateBox = (asPrimary = true) => {
    const box = createBoxGeometry(Number(boxW), Number(boxH), Number(boxD), `Billet_${boxW}x${boxH}x${boxD}`, {
      origin: boxOrigin,
      material: activeMaterial.name,
      color: parseInt(activeMaterial.color.replace('#', '0x'))
    });
    if (asPrimary && onSetPrimaryModel) {
      onSetPrimaryModel(box, `Parametric_Billet_${boxW}x${boxD}.mcam`);
    } else if (onAddSolidBody) {
      onAddSolidBody(box, `Solid_Block_${boxW}x${boxD}`);
    }
    alert(`Rectangular Solid Billet (${boxW}x${boxH}x${boxD} mm, Mass: ${calcMassKg(boxVol)} kg) created.`);
  };

  const handleCreateCylinder = (asPrimary = true) => {
    const cyl = createCylinderGeometry(
      Number(cylRadius),
      Number(cylHeight),
      `Cylindrical_Blank_Dia${cylRadius * 2}_H${cylHeight}`,
      {
        innerRadius: Number(cylInnerR),
        axis: cylAxis,
        material: activeMaterial.name,
        color: parseInt(activeMaterial.color.replace('#', '0x'))
      }
    );
    if (asPrimary && onSetPrimaryModel) {
      onSetPrimaryModel(cyl, `Cylindrical_Blank_Dia${cylRadius * 2}.mcam`);
    } else if (onAddSolidBody) {
      onAddSolidBody(cyl, `Solid_Cylinder_Dia${cylRadius * 2}`);
    }
    alert(`Cylindrical Solid Blank (Ø${cylRadius * 2}mm x ${cylHeight}mm, Mass: ${calcMassKg(cylVol)} kg) created.`);
  };

  const handleCreateCone = (asPrimary = true) => {
    const cone = createConeGeometry(
      Number(coneRBot),
      Number(coneRTop),
      Number(coneHeight),
      `Cone_Frustum_R${coneRBot}to${coneRTop}`,
      {
        material: activeMaterial.name,
        color: parseInt(activeMaterial.color.replace('#', '0x'))
      }
    );
    if (asPrimary && onSetPrimaryModel) {
      onSetPrimaryModel(cone, `Conical_Solid_Frustum.mcam`);
    } else if (onAddSolidBody) {
      onAddSolidBody(cone, `Solid_Cone_Frustum`);
    }
    alert(`Conical Frustum Solid (R${coneRBot} to R${coneRTop}, Height: ${coneHeight}mm) created.`);
  };

  const handleCreateTorus = (asPrimary = true) => {
    const torus = createTorusGeometry(
      Number(torusRadius),
      Number(torusTube),
      `Torus_Ring_R${torusRadius}_r${torusTube}`,
      {
        material: activeMaterial.name,
        color: parseInt(activeMaterial.color.replace('#', '0x'))
      }
    );
    if (asPrimary && onSetPrimaryModel) {
      onSetPrimaryModel(torus, `Torus_Ring.mcam`);
    } else if (onAddSolidBody) {
      onAddSolidBody(torus, `Solid_Torus_Ring`);
    }
    alert(`Torus Solid Ring (Major R${torusRadius}, Tube r${torusTube}) created.`);
  };

  const handleCreateExtrude = (asPrimary = true) => {
    const ext = createExtrudedSolid(
      Number(extW),
      Number(extD),
      Number(extH),
      Number(extDraft),
      `Extruded_Solid_${extW}x${extD}_H${extH}`,
      {
        material: activeMaterial.name,
        color: parseInt(activeMaterial.color.replace('#', '0x'))
      }
    );
    if (asPrimary && onSetPrimaryModel) {
      onSetPrimaryModel(ext, `Extruded_Draft_Solid.mcam`);
    } else if (onAddSolidBody) {
      onAddSolidBody(ext, `Solid_Extrusion_${extW}x${extD}`);
    }
    alert(`Extruded Solid (${extW}x${extD}x${extH} mm, Draft: ${extDraft}°) created.`);
  };

  const handleCreatePocketedBillet = (asPrimary = true) => {
    const pocketSolid = createPocketedBillet(
      Number(pBaseW),
      Number(pBaseH),
      Number(pBaseD),
      Number(pockW),
      Number(pockD),
      Number(pockDepth),
      Number(pockFillet),
      `Pocketed_Workpiece_${pBaseW}x${pBaseD}`,
      {
        material: activeMaterial.name,
        color: parseInt(activeMaterial.color.replace('#', '0x'))
      }
    );
    if (asPrimary && onSetPrimaryModel) {
      onSetPrimaryModel(pocketSolid, `Pocketed_Cavity_Workpiece.mcam`);
    } else if (onAddSolidBody) {
      onAddSolidBody(pocketSolid, `Solid_Pocketed_Billet`);
    }
    alert(`CNC Pocketed Workpiece (${pBaseW}x${pBaseD}mm with ${pockW}x${pockD}x${pockDepth}mm Pocket, R${pockFillet}) created.`);
  };

  const navTools = [
    { id: 'box', label: 'Billet Block', icon: Box, badge: 'Prismatic' },
    { id: 'cylinder', label: 'Cylindrical Blank', icon: Orbit, badge: 'Turned/Bore' },
    { id: 'cone', label: 'Cone / Frustum', icon: Compass, badge: 'Taper' },
    { id: 'torus', label: 'Torus / Ring', icon: Disc, badge: 'Annular' },
    { id: 'extrude', label: 'Extruded Solid', icon: Sliders, badge: 'Draft Angle' },
    { id: 'pocket', label: 'Pocketed Cavity', icon: Sparkles, badge: 'CNC Pocket' },
    { id: 'manager', label: 'Solids Manager', icon: Layers, badge: `${solidsList.length}` }
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
            <Box size={22} color="#38bdf8" />
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '0.5px' }}>
                SOLIDS CAD MODELING &amp; BILLET GENERATOR
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', gap: '12px', marginTop: '2px' }}>
                <span>Mastercam 2024 Parametric B-Rep Solids</span>
                <span>•</span>
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>Active Material: {activeMaterial.name} ({activeMaterial.density} g/cm³)</span>
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
              Solid Primitives
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

            {/* Material Selector in Sidebar */}
            <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #1f2737' }}>
              <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                <Scale size={12} color="#f59e0b" />
                <span>Workpiece Material</span>
              </label>
              <select
                value={selectedMatId}
                onChange={(e) => setSelectedMatId(e.target.value)}
                style={inputStyle}
              >
                {MATERIALS.map((mat) => (
                  <option key={mat.id} value={mat.id}>
                    {mat.name} ({mat.density} g/cm³)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Main Solid Configuration Panel */}
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
            {/* 1. RECTANGULAR BILLET (BOX) */}
            {activeTool === 'box' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #232c3d', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#38bdf8' }}>Rectangular Solid Billet</div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                    Generate a parametric prismatic stock billet with precise Cartesian extents $(W \times H \times D)$.
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <div style={{ background: '#161b26', padding: '12px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Width X (mm)</label>
                    <input
                      type="number"
                      step="5"
                      value={boxW}
                      onChange={(e) => setBoxW(parseFloat(e.target.value) || 10)}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ background: '#161b26', padding: '12px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Height Y (mm)</label>
                    <input
                      type="number"
                      step="5"
                      value={boxH}
                      onChange={(e) => setBoxH(parseFloat(e.target.value) || 5)}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ background: '#161b26', padding: '12px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Depth Z (mm)</label>
                    <input
                      type="number"
                      step="5"
                      value={boxD}
                      onChange={(e) => setBoxD(parseFloat(e.target.value) || 10)}
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Alignment Origin */}
                <div style={{ background: '#161b26', padding: '12px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '6px', display: 'block' }}>
                    WCS Datum Alignment
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => setBoxOrigin('center')}
                      style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: boxOrigin === 'center' ? '#1e293b' : '#141822',
                        border: `1px solid ${boxOrigin === 'center' ? '#38bdf8' : '#232c3d'}`,
                        borderRadius: '4px',
                        color: boxOrigin === 'center' ? '#38bdf8' : '#94a3b8',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '11.5px'
                      }}
                    >
                      Centered on Table (G54 Origin at Center)
                    </button>
                    <button
                      onClick={() => setBoxOrigin('corner')}
                      style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: boxOrigin === 'corner' ? '#1e293b' : '#141822',
                        border: `1px solid ${boxOrigin === 'corner' ? '#38bdf8' : '#232c3d'}`,
                        borderRadius: '4px',
                        color: boxOrigin === 'corner' ? '#38bdf8' : '#94a3b8',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '11.5px'
                      }}
                    >
                      Lower Left Corner (X0, Y0, Z0)
                    </button>
                  </div>
                </div>

                {/* Mass & Volume metrics card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#0e1219', borderRadius: '6px', border: '1px solid #1f2737' }}>
                  <div>
                    <div style={{ fontSize: '10.5px', color: '#64748b' }}>Displaced Volume</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                      {boxVol.toFixed(1)} cm³
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10.5px', color: '#64748b' }}>Estimated Part Mass ({activeMaterial.name})</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                      {calcMassKg(boxVol)} kg
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleCreateBox(true)} style={primaryBtnStyle}>
                    <Box size={16} />
                    <span>Set as Active Workpiece Solid</span>
                  </button>
                  <button onClick={() => handleCreateBox(false)} style={secondaryBtnStyle}>
                    <Plus size={16} />
                    <span>Add as Additional Body</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. CYLINDRICAL BLANK */}
            {activeTool === 'cylinder' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #232c3d', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#60a5fa' }}>Cylindrical Solid Blank</div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                    Parametric cylindrical blank for turning, 4-axis rotary milling, or circular billet stock.
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>Outer Radius R (mm)</label>
                    <input
                      type="number"
                      step="1"
                      value={cylRadius}
                      onChange={(e) => setCylRadius(parseFloat(e.target.value) || 5)}
                      style={inputStyle}
                    />
                    <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>
                      Outer Ø{(cylRadius * 2).toFixed(1)} mm
                    </div>
                  </div>
                  <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>Height / Length (mm)</label>
                    <input
                      type="number"
                      step="5"
                      value={cylHeight}
                      onChange={(e) => setCylHeight(parseFloat(e.target.value) || 10)}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>Inner Bore Radius (mm)</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max={cylRadius - 1}
                      value={cylInnerR}
                      onChange={(e) => setCylInnerR(parseFloat(e.target.value) || 0)}
                      style={inputStyle}
                    />
                    <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>
                      {cylInnerR > 0 ? `Bore ID: Ø${(cylInnerR * 2).toFixed(1)} mm` : 'Solid Bar'}
                    </div>
                  </div>
                  <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>Spindle Axis</label>
                    <select
                      value={cylAxis}
                      onChange={(e) => setCylAxis(e.target.value)}
                      style={inputStyle}
                    >
                      <option value="Y">Vertical (Y - VMC)</option>
                      <option value="Z">Horizontal (Z - HMC)</option>
                      <option value="X">Rotary (X - Lathe/Turn)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#0e1219', borderRadius: '6px', border: '1px solid #1f2737' }}>
                  <div>
                    <div style={{ fontSize: '10.5px', color: '#64748b' }}>Displaced Volume</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                      {cylVol.toFixed(1)} cm³
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10.5px', color: '#64748b' }}>Estimated Part Mass ({activeMaterial.name})</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                      {calcMassKg(cylVol)} kg
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleCreateCylinder(true)} style={primaryBtnStyle}>
                    <Orbit size={16} />
                    <span>Set as Active Workpiece Solid</span>
                  </button>
                  <button onClick={() => handleCreateCylinder(false)} style={secondaryBtnStyle}>
                    <Plus size={16} />
                    <span>Add as Additional Body</span>
                  </button>
                </div>
              </div>
            )}

            {/* 3. CONE / FRUSTUM */}
            {activeTool === 'cone' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #232c3d', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#f59e0b' }}>Conical Frustum Solid</div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                    Parametric tapered cone or draft frustum with independent base and top radii.
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <div style={{ background: '#161b26', padding: '12px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Bottom Radius R1 (mm)</label>
                    <input
                      type="number"
                      step="1"
                      value={coneRBot}
                      onChange={(e) => setConeRBot(parseFloat(e.target.value) || 5)}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ background: '#161b26', padding: '12px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Top Radius R2 (mm)</label>
                    <input
                      type="number"
                      step="1"
                      value={coneRTop}
                      onChange={(e) => setConeRTop(parseFloat(e.target.value) || 0)}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ background: '#161b26', padding: '12px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Frustum Height (mm)</label>
                    <input
                      type="number"
                      step="5"
                      value={coneHeight}
                      onChange={(e) => setConeHeight(parseFloat(e.target.value) || 10)}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleCreateCone(true)} style={{ ...primaryBtnStyle, backgroundColor: '#d97706' }}>
                    <Compass size={16} />
                    <span>Set as Active Workpiece Solid</span>
                  </button>
                  <button onClick={() => handleCreateCone(false)} style={secondaryBtnStyle}>
                    <Plus size={16} />
                    <span>Add as Additional Body</span>
                  </button>
                </div>
              </div>
            )}

            {/* 4. TORUS / RING */}
            {activeTool === 'torus' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #232c3d', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#a855f7' }}>Torus Solid Ring</div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                    Generates a toroidal ring, circular boss, or annular seal flange solid.
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: '#161b26', padding: '12px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Major Center Radius R (mm)</label>
                    <input
                      type="number"
                      step="1"
                      value={torusRadius}
                      onChange={(e) => setTorusRadius(parseFloat(e.target.value) || 10)}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ background: '#161b26', padding: '12px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Tube Cross-Section Radius r (mm)</label>
                    <input
                      type="number"
                      step="1"
                      value={torusTube}
                      onChange={(e) => setTorusTube(parseFloat(e.target.value) || 2)}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleCreateTorus(true)} style={{ ...primaryBtnStyle, backgroundColor: '#9333ea' }}>
                    <Disc size={16} />
                    <span>Set as Active Workpiece Solid</span>
                  </button>
                  <button onClick={() => handleCreateTorus(false)} style={secondaryBtnStyle}>
                    <Plus size={16} />
                    <span>Add as Additional Body</span>
                  </button>
                </div>
              </div>
            )}

            {/* 5. EXTRUDED SOLID WITH DRAFT */}
            {activeTool === 'extrude' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #232c3d', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#10b981' }}>Extruded Solid with Draft Angle</div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                    Extrudes a rectangular profile with mold release draft angles for casting dies and injection mold cores.
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>Width X (mm)</label>
                    <input
                      type="number"
                      step="5"
                      value={extW}
                      onChange={(e) => setExtW(parseFloat(e.target.value) || 10)}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>Depth Z (mm)</label>
                    <input
                      type="number"
                      step="5"
                      value={extD}
                      onChange={(e) => setExtD(parseFloat(e.target.value) || 10)}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>Height (mm)</label>
                    <input
                      type="number"
                      step="5"
                      value={extH}
                      onChange={(e) => setExtH(parseFloat(e.target.value) || 10)}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ background: '#161b26', padding: '10px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>Draft Angle (Deg)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={extDraft}
                      onChange={(e) => setExtDraft(parseFloat(e.target.value) || 0)}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleCreateExtrude(true)} style={{ ...primaryBtnStyle, backgroundColor: '#059669' }}>
                    <Sliders size={16} />
                    <span>Set as Active Workpiece Solid</span>
                  </button>
                  <button onClick={() => handleCreateExtrude(false)} style={secondaryBtnStyle}>
                    <Plus size={16} />
                    <span>Add as Additional Body</span>
                  </button>
                </div>
              </div>
            )}

            {/* 6. POCKETED CAVITY BILLET */}
            {activeTool === 'pocket' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #232c3d', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#38bdf8' }}>CNC Milled Pocket Workpiece</div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                    Generates a solid billet containing an internal CNC milled pocket cavity with tangent corner fillets.
                  </div>
                </div>

                {/* Base Billet Dimensions */}
                <div style={{ background: '#161b26', padding: '12px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#f59e0b', marginBottom: '8px' }}>
                    Base Billet Stock Dimensions
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '10px', color: '#94a3b8' }}>Billet Width X</label>
                      <input
                        type="number"
                        step="5"
                        value={pBaseW}
                        onChange={(e) => setPBaseW(parseFloat(e.target.value) || 20)}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', color: '#94a3b8' }}>Billet Height Y</label>
                      <input
                        type="number"
                        step="5"
                        value={pBaseH}
                        onChange={(e) => setPBaseH(parseFloat(e.target.value) || 10)}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', color: '#94a3b8' }}>Billet Depth Z</label>
                      <input
                        type="number"
                        step="5"
                        value={pBaseD}
                        onChange={(e) => setPBaseD(parseFloat(e.target.value) || 20)}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>

                {/* Internal Pocket Cavity */}
                <div style={{ background: '#161b26', padding: '12px', borderRadius: '6px', border: '1px solid #232c3d' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#10b981', marginBottom: '8px' }}>
                    Milled Pocket Cavity Dimensions
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '10px', color: '#94a3b8' }}>Pocket Width X</label>
                      <input
                        type="number"
                        step="5"
                        value={pockW}
                        onChange={(e) => setPockW(parseFloat(e.target.value) || 10)}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', color: '#94a3b8' }}>Pocket Depth Z</label>
                      <input
                        type="number"
                        step="5"
                        value={pockD}
                        onChange={(e) => setPockD(parseFloat(e.target.value) || 10)}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', color: '#94a3b8' }}>Pocket Depth (Y cut)</label>
                      <input
                        type="number"
                        step="2"
                        value={pockDepth}
                        onChange={(e) => setPockDepth(parseFloat(e.target.value) || 5)}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', color: '#94a3b8' }}>Corner Fillet R</label>
                      <input
                        type="number"
                        step="1"
                        value={pockFillet}
                        onChange={(e) => setPockFillet(parseFloat(e.target.value) || 0)}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleCreatePocketedBillet(true)} style={primaryBtnStyle}>
                    <Sparkles size={16} />
                    <span>Set as Active Workpiece Solid</span>
                  </button>
                  <button onClick={() => handleCreatePocketedBillet(false)} style={secondaryBtnStyle}>
                    <Plus size={16} />
                    <span>Add as Additional Body</span>
                  </button>
                </div>
              </div>
            )}

            {/* 7. SOLIDS MANAGER */}
            {activeTool === 'manager' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #232c3d', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#38bdf8' }}>Solids Entity Manager</div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                    Inspect active B-Rep solid bodies, manage material densities, and toggle visibility.
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Primary Workpiece Solid Card */}
                  <div
                    style={{
                      background: '#161b26',
                      border: '1px solid #2563eb',
                      borderRadius: '6px',
                      padding: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Box size={20} color="#38bdf8" />
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#f8fafc' }}>
                          {currentModel?.name || 'Active_Workpiece_Solid'}
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                          Primary Machined B-Rep Solid | Material: {activeMaterial.name}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#2563eb33', color: '#38bdf8', fontWeight: 600 }}>
                      PRIMARY SOLID
                    </span>
                  </div>

                  {/* Additional Solid Bodies */}
                  {solidsList.map((solid, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: '#161b26',
                        border: '1px solid #232c3d',
                        borderRadius: '6px',
                        padding: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Box size={20} color="#10b981" />
                        <div>
                          <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#f8fafc' }}>{solid.name}</div>
                          <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                            Type: {solid.userData?.type || 'Solid Body'} {solid.userData?.volumeCm3 ? `| Vol: ${solid.userData.volumeCm3} cm³` : ''}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={() => onRemoveSolidBody && onRemoveSolidBody(solid)}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                          title="Delete solid body"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
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
            Solids generated can be seamlessly toolpathed with 3D roughing, pocketing, and contouring passes.
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
            Close Solids Suite
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
  flex: 1,
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

const secondaryBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  padding: '10px 14px',
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '5px',
  color: '#cbd5e1',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer'
};
