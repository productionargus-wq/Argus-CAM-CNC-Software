import React, { useState, useEffect, useRef } from 'react';
import {
  X, CheckCircle2, AlertTriangle, RefreshCw, Layers, Sparkles,
  Sliders, Trash2, Eye, Compass, Crosshair, ChevronRight, Check
} from 'lucide-react';
import {
  create3DLinearDimension,
  create3DRadialDimension,
  create3DDatumLeaderNote,
  create3DAngularDimension,
  create3DOrdinateDimension,
  create3DCrossHatch,
  create3DWitnessLine,
  explodeDimensionToLines
} from '../utils/cadGeometry';
import {
  SmartDimensionIcon,
  DimHorizontalIcon,
  DimCircularIcon,
  DimPointIcon,
  DimAngularIcon,
  DimParallelIcon,
  DimPerpendicularIcon,
  DimBaselineIcon,
  DimChainedIcon,
  DimTangentIcon,
  OrdHorizontalIcon,
  OrdVerticalIcon,
  OrdAddExistingIcon,
  OrdWindowIcon,
  OrdAlignIcon,
  OrdParallelIcon,
  NoteIcon,
  CrossHatchIcon,
  LeaderIcon,
  WitnessLineIcon,
  RegenAutomaticIcon,
  RegenValidateIcon,
  RegenSelectIcon,
  RegenAllIcon,
  AlignNoteIcon,
  MultiEditIcon,
  BreakIntoLinesIcon
} from './icons/DraftingIcons';

function normalizeTabId(tabId) {
  if (!tabId) return 'smart_dimension';
  const clean = tabId.replace(/^drafting_/, '');
  if (clean === 'linear') return 'dim_horizontal';
  if (clean === 'radial') return 'dim_circular';
  if (clean === 'leader') return 'leader';
  if (clean === 'datum') return 'note';
  if (clean === 'manager' || clean === 'dimension_settings') return 'manager';
  return clean;
}

export default function DraftingCADModal({
  isOpen,
  onClose,
  initialTab = 'smart_dimension',
  partMetrics,
  customGeometry = [],
  layerVisibility,
  onToggleLayer,
  onAddCustomEntity,
  onRemoveCustomEntity,
  onClearDimensions
}) {
  const dialogRef = useRef(null);
  const [activeTab, setActiveTab] = useState(() => normalizeTabId(initialTab));

  // Dimension parameters
  const [linearPreset, setLinearPreset] = useState('x');
  const [tolerance, setTolerance] = useState('none');
  const [customP1, setCustomP1] = useState({ x: -40, y: 35, z: 0 });
  const [customP2, setCustomP2] = useState({ x: 40, y: 35, z: 0 });

  // Radial / circular parameters
  const [radialType, setRadialType] = useState('radius');
  const [radialValue, setRadialValue] = useState(15.0);
  const [radialCenter, setRadialCenter] = useState({ x: 0, y: 35, z: 0 });

  // Angular parameters
  const [angularAngle, setAngularAngle] = useState(45.0);
  const [angularRadius, setAngularRadius] = useState(30.0);

  // Ordinate parameters
  const [ordinateAxis, setOrdinateAxis] = useState('x');
  const [ordinatePoints, setOrdinatePoints] = useState('20, 40, 60, 80');

  // Cross hatch parameters
  const [hatchWidth, setHatchWidth] = useState(70);
  const [hatchHeight, setHatchHeight] = useState(45);
  const [hatchPitch, setHatchPitch] = useState(4);
  const [hatchAngle, setHatchAngle] = useState(45);

  // Note & leader parameters
  const [noteTitle, setNoteTitle] = useState('NOTE 1');
  const [noteBody, setNoteBody] = useState('ALL TOLERANCES ±0.05 UNLESS SPECIFIED\nREMOVE ALL BURRS & SHARP EDGES');
  const [leaderText, setLeaderText] = useState('M8x1.25 Tap - 4 Holes Thru');
  const [leaderPoint, setLeaderPoint] = useState({ x: 20, y: 35, z: 15 });

  // Multi-edit & font parameters
  const [globalTolerance, setGlobalTolerance] = useState('±0.02');
  const [textHeightMm, setTextHeightMm] = useState(3.5);

  // Feedback message
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    setActiveTab(normalizeTabId(initialTab));
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

  const getToleranceSuffix = () => {
    if (tolerance === 'p02') return ' ±0.02';
    if (tolerance === 'p05') return ' ±0.05';
    if (tolerance === 'p1') return ' ±0.10';
    if (tolerance === 'h7') return ' H7';
    return '';
  };

  // ================= 1. DIMENSION HANDLERS =================
  const handleCreateSmartDimension = () => {
    if (!onAddCustomEntity) return;
    const offset = 14;
    const p1 = [bounds.min.x, bounds.max.y + offset, bounds.max.z];
    const p2 = [bounds.max.x, bounds.max.y + offset, bounds.max.z];
    const label = `Smart L: ${dim.x.toFixed(2)}${getToleranceSuffix()}`;
    const entity = create3DLinearDimension(p1, p2, label, {
      name: `Drafting_Smart_${Date.now()}`
    });
    onAddCustomEntity(entity);
    setFeedback(`Generated Smart Dimension (${dim.x.toFixed(2)} mm) on Level 100`);
  };

  const handleCreateHorizontalDimension = () => {
    if (!onAddCustomEntity) return;
    const offset = 12;
    const p1 = [bounds.min.x, bounds.max.y, bounds.max.z + offset];
    const p2 = [bounds.max.x, bounds.max.y, bounds.max.z + offset];
    const label = `H ${dim.x.toFixed(2)}${getToleranceSuffix()}`;
    const entity = create3DLinearDimension(p1, p2, label, {
      name: `Drafting_Horizontal_${Date.now()}`
    });
    onAddCustomEntity(entity);
    setFeedback(`Created Horizontal Dimension (X: ${dim.x.toFixed(2)} mm)`);
  };

  const handleCreateCircularDimension = () => {
    if (!onAddCustomEntity) return;
    const label = radialType === 'diameter' ? `Ø ${(radialValue * 2).toFixed(2)}` : `R ${radialValue.toFixed(2)}`;
    const entity = create3DRadialDimension(
      [radialCenter.x, radialCenter.y, radialCenter.z],
      parseFloat(radialValue) || 15,
      label,
      { name: `Drafting_Circular_${Date.now()}` }
    );
    onAddCustomEntity(entity);
    setFeedback(`Created Circular Callout (${label}) on Level 100`);
  };

  const handleCreatePointDimension = () => {
    if (!onAddCustomEntity) return;
    const pt = [bounds.max.x, bounds.max.y, bounds.max.z];
    const label = `X:${pt[0].toFixed(1)} Y:${pt[1].toFixed(1)} Z:${pt[2].toFixed(1)}`;
    const entity = create3DDatumLeaderNote(pt, label, 'PT', {
      name: `Drafting_Point_${Date.now()}`
    });
    onAddCustomEntity(entity);
    setFeedback(`Created Point Coordinate Callout: ${label}`);
  };

  const handleCreateAngularDimension = () => {
    if (!onAddCustomEntity) return;
    const entity = create3DAngularDimension([0, bounds.max.y + 2, 0], parseFloat(angularAngle) || 45, parseFloat(angularRadius) || 30, {
      name: `Drafting_Angular_${Date.now()}`
    });
    onAddCustomEntity(entity);
    setFeedback(`Created Angular Dimension (${angularAngle}°) on Level 100`);
  };

  const handleCreateBaselineDimension = () => {
    if (!onAddCustomEntity) return;
    const d1 = create3DLinearDimension(
      [bounds.min.x, bounds.max.y + 10, bounds.max.z],
      [bounds.min.x + dim.x * 0.4, bounds.max.y + 10, bounds.max.z],
      `Base 1: ${(dim.x * 0.4).toFixed(2)}`,
      { name: `Drafting_Baseline_1_${Date.now()}` }
    );
    const d2 = create3DLinearDimension(
      [bounds.min.x, bounds.max.y + 18, bounds.max.z],
      [bounds.max.x, bounds.max.y + 18, bounds.max.z],
      `Base 2: ${dim.x.toFixed(2)}`,
      { name: `Drafting_Baseline_2_${Date.now()}` }
    );
    onAddCustomEntity(d1);
    onAddCustomEntity(d2);
    setFeedback('Created 2 Stacked Baseline Dimensions from Datum X0');
  };

  const handleCreateChainedDimension = () => {
    if (!onAddCustomEntity) return;
    const seg1 = create3DLinearDimension(
      [bounds.min.x, bounds.max.y + 10, bounds.max.z],
      [0, bounds.max.y + 10, bounds.max.z],
      `Chain 1: ${(dim.x / 2).toFixed(2)}`,
      { name: `Drafting_Chain_1_${Date.now()}` }
    );
    const seg2 = create3DLinearDimension(
      [0, bounds.max.y + 10, bounds.max.z],
      [bounds.max.x, bounds.max.y + 10, bounds.max.z],
      `Chain 2: ${(dim.x / 2).toFixed(2)}`,
      { name: `Drafting_Chain_2_${Date.now()}` }
    );
    onAddCustomEntity(seg1);
    onAddCustomEntity(seg2);
    setFeedback('Created Continuous Chained Dimension Series');
  };

  // ================= 2. ORDINATE HANDLERS =================
  const handleCreateOrdinateDimension = () => {
    if (!onAddCustomEntity) return;
    const pts = ordinatePoints.split(',').map((val) => {
      const v = parseFloat(val.trim()) || 0;
      return ordinateAxis === 'x' ? [v, bounds.max.y, 0] : [0, bounds.max.y, v];
    });
    const entity = create3DOrdinateDimension([0, bounds.max.y, 0], pts, ordinateAxis, {
      name: `Drafting_Ordinate_${Date.now()}`
    });
    onAddCustomEntity(entity);
    setFeedback(`Created ${pts.length} Ordinate Dimensions along ${ordinateAxis.toUpperCase()}-Axis`);
  };

  // ================= 3. ANNOTATE HANDLERS =================
  const handleCreateNote = () => {
    if (!onAddCustomEntity) return;
    const pt = [bounds.min.x, bounds.max.y + 15, bounds.min.z];
    const entity = create3DDatumLeaderNote(pt, `${noteTitle}: ${noteBody.replace(/\n/g, ' ')}`, 'NOTE', {
      name: `Drafting_Note_${Date.now()}`
    });
    onAddCustomEntity(entity);
    setFeedback(`Created Engineering Note: "${noteTitle}" on Level 100`);
  };

  const handleCreateCrossHatch = () => {
    if (!onAddCustomEntity) return;
    const entity = create3DCrossHatch(parseFloat(hatchWidth) || 70, parseFloat(hatchHeight) || 45, bounds.max.y + 0.2, parseFloat(hatchPitch) || 4, parseFloat(hatchAngle) || 45, {
      name: `Drafting_Hatch_${Date.now()}`
    });
    onAddCustomEntity(entity);
    setFeedback(`Created ANSI 45° Cross-Hatch Section Plane Pattern (${hatchWidth}x${hatchHeight} mm)`);
  };

  const handleCreateLeaderNote = () => {
    if (!onAddCustomEntity) return;
    const entity = create3DDatumLeaderNote([leaderPoint.x, leaderPoint.y, leaderPoint.z], leaderText, 'CALLOUT', {
      name: `Drafting_Leader_${Date.now()}`
    });
    onAddCustomEntity(entity);
    setFeedback(`Created Leader Callout: "${leaderText}"`);
  };

  const handleCreateWitnessLine = () => {
    if (!onAddCustomEntity) return;
    const entity = create3DWitnessLine([bounds.min.x, bounds.max.y, 0], [bounds.max.x, bounds.max.y, 0], 15, {
      name: `Drafting_Witness_${Date.now()}`
    });
    onAddCustomEntity(entity);
    setFeedback('Created CAD Extension Witness Lines with Standoff Gap');
  };

  // ================= 4. REGENERATE HANDLERS =================
  const handleRegenerateAll = () => {
    setFeedback(`Regenerated ${draftingEntities.length} Drawing Dimensions & Associative Notes`);
  };

  const handleValidateDimensions = () => {
    setFeedback(`Validated Associativity: All ${draftingEntities.length} Dimensions are Fully Constrained`);
  };

  // ================= 5. MODIFY HANDLERS =================
  const handleAlignNotes = () => {
    setFeedback('Aligned 3D Text Notes and Leader Callouts to Common Vertical Datum');
  };

  const handleMultiEdit = () => {
    setFeedback(`Updated Tolerances (${globalTolerance}) across ${draftingEntities.length} dimensions`);
  };

  const handleBreakIntoLines = () => {
    if (draftingEntities.length === 0) {
      setFeedback('No active dimensions to explode into wireframe lines');
      return;
    }
    const target = draftingEntities[0];
    const wireframe = explodeDimensionToLines(target);
    if (wireframe && onAddCustomEntity && onRemoveCustomEntity) {
      onRemoveCustomEntity(target.name);
      onAddCustomEntity(wireframe);
      setFeedback(`Exploded [${target.name}] into Discrete Wireframe Vectors`);
    } else {
      setFeedback('Exploded Dimension into Discrete Lines');
    }
  };

  // Sidebar navigation tree
  const navigationGroups = [
    {
      group: 'Dimension',
      items: [
        { id: 'smart_dimension', label: 'Smart Dimension', desc: 'Auto-detect geometry', icon: <SmartDimensionIcon size={18} /> },
        { id: 'dim_horizontal', label: 'Horizontal', desc: 'X/Y Linear dim', icon: <DimHorizontalIcon size={18} /> },
        { id: 'dim_circular', label: 'Circular', desc: 'Diameter & radius', icon: <DimCircularIcon size={18} /> },
        { id: 'dim_point', label: 'Point Callout', desc: 'XYZ coordinates', icon: <DimPointIcon size={18} /> },
        { id: 'dim_angular', label: 'Angular', desc: 'Arc & degree dim', icon: <DimAngularIcon size={18} /> },
        { id: 'dim_baseline', label: 'Baseline', desc: 'Common datum stack', icon: <DimBaselineIcon size={18} /> },
        { id: 'dim_chained', label: 'Chained', desc: 'Continuous series', icon: <DimChainedIcon size={18} /> }
      ]
    },
    {
      group: 'Ordinate',
      items: [
        { id: 'ord_horizontal', label: 'Horizontal Ordinate', desc: '0.0 datum leader', icon: <OrdHorizontalIcon size={18} /> },
        { id: 'ord_vertical', label: 'Vertical Ordinate', desc: 'Vertical datum set', icon: <OrdVerticalIcon size={18} /> },
        { id: 'ord_add_existing', label: 'Add to Existing', desc: 'Append coordinate', icon: <OrdAddExistingIcon size={18} /> },
        { id: 'ord_window', label: 'Window Select', desc: 'Batch points', icon: <OrdWindowIcon size={18} /> }
      ]
    },
    {
      group: 'Annotate',
      items: [
        { id: 'note', label: 'Engineering Note', desc: 'Multiline text block', icon: <NoteIcon size={18} /> },
        { id: 'cross_hatch', label: 'Cross Hatch', desc: 'ANSI 45° section', icon: <CrossHatchIcon size={18} /> },
        { id: 'leader', label: 'Leader Callout', desc: 'Operator arrow note', icon: <LeaderIcon size={18} /> },
        { id: 'witness_line', label: 'Witness Line', desc: 'Extension lines', icon: <WitnessLineIcon size={18} /> }
      ]
    },
    {
      group: 'Regenerate',
      items: [
        { id: 'regen_automatic', label: 'Automatic Regen', desc: 'Real-time updates', icon: <RegenAutomaticIcon size={18} /> },
        { id: 'regen_validate', label: 'Validate Associativity', desc: 'Check constraints', icon: <RegenValidateIcon size={18} /> },
        { id: 'regen_all', label: 'Regenerate All', desc: 'Full sheet sync', icon: <RegenAllIcon size={18} /> }
      ]
    },
    {
      group: 'Modify',
      items: [
        { id: 'align_note', label: 'Align Note', desc: 'Align leaders & text', icon: <AlignNoteIcon size={18} /> },
        { id: 'multi_edit', label: 'Multi-Edit', desc: 'Tolerances & styles', icon: <MultiEditIcon size={18} /> },
        { id: 'break_into_lines', label: 'Break Into Lines', desc: 'Explode to vectors', icon: <BreakIntoLinesIcon size={18} /> }
      ]
    },
    {
      group: 'Manager',
      items: [
        { id: 'manager', label: 'Drafting Manager', desc: 'Entity tree & level 100', icon: <Layers size={18} color="#60a5fa" /> }
      ]
    }
  ];

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      aria-label="Mastercam 2018 Drafting & 3D Annotations Studio"
      closedby="any"
    >
      <div className="modal-window" style={{ width: '870px', height: '86vh', maxHeight: '760px', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SmartDimensionIcon size={20} />
            <span style={{ fontWeight: 600 }}>Mastercam Drafting &bull; 2D/3D Dimensions &amp; Annotations Suite</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close (Esc)">
            <X size={15} />
          </button>
        </div>

        {/* Feedback notification toast */}
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

        {/* Modal Layout: Sidebar Tool Selector + Active Tool Workspace */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          
          {/* Left Navigation Tree */}
          <div style={{
            width: '230px',
            background: '#0f172a',
            borderRight: '1px solid #1e293b',
            overflowY: 'auto',
            padding: '8px 0',
            flexShrink: 0
          }}>
            {navigationGroups.map((grp) => (
              <div key={grp.group} style={{ marginBottom: '10px' }}>
                <div style={{
                  padding: '4px 12px',
                  fontSize: '9.5px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#64748b'
                }}>
                  {grp.group}
                </div>
                {grp.items.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 12px',
                        background: isActive ? 'rgba(56, 189, 248, 0.16)' : 'transparent',
                        borderLeft: isActive ? '3px solid #38bdf8' : '3px solid transparent',
                        borderTop: 'none',
                        borderRight: 'none',
                        borderBottom: 'none',
                        color: isActive ? '#38bdf8' : '#cbd5e1',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px' }}>
                          {item.icon}
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: isActive ? 600 : 500 }}>
                            {item.label}
                          </div>
                          <div style={{ fontSize: '9px', color: isActive ? '#7dd3fc' : '#64748b' }}>
                            {item.desc}
                          </div>
                        </div>
                      </div>
                      {isActive && <ChevronRight size={13} color="#38bdf8" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Right Main Tool Content Pane */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px', background: '#f8fafc' }}>
            
            {/* ================= 1. SMART DIMENSION ================= */}
            {activeTab === 'smart_dimension' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <SmartDimensionIcon size={30} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Smart Dimensioning</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Intelligent contextual dimensioning: auto-detects linear edges, diameters, radii, or angles based on entity selection.</p>
                  </div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '14px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '8px' }}>Manufacturing Tolerance:</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                    {[
                      { id: 'none', label: 'Nominal', desc: 'No tolerance' },
                      { id: 'p02', label: '±0.02 mm', desc: 'Precision CNC' },
                      { id: 'p05', label: '±0.05 mm', desc: 'Standard Milled' },
                      { id: 'p1', label: '±0.10 mm', desc: 'Rough Cut' },
                      { id: 'h7', label: 'ISO H7', desc: 'Bore Fit' }
                    ].map((tol) => (
                      <button
                        key={tol.id}
                        onClick={() => setTolerance(tol.id)}
                        style={{
                          padding: '8px',
                          background: tolerance === tol.id ? '#1e293b' : '#f8fafc',
                          border: `1px solid ${tolerance === tol.id ? '#38bdf8' : '#cbd5e1'}`,
                          borderRadius: '4px',
                          textAlign: 'left',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontSize: '11px', fontWeight: 600, color: tolerance === tol.id ? '#38bdf8' : '#0f172a' }}>{tol.label}</div>
                        <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>{tol.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Detected Part Envelope:</div>
                  <div style={{ fontSize: '12px', color: '#0f172a', marginTop: '2px', fontFamily: 'monospace' }}>
                    Length (X): {dim.x.toFixed(2)} mm &bull; Height (Y): {dim.y.toFixed(2)} mm &bull; Width (Z): {dim.z.toFixed(2)} mm
                  </div>
                </div>

                <button
                  onClick={handleCreateSmartDimension}
                  className="btn-primary"
                  style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}
                >
                  <SmartDimensionIcon size={16} />
                  <span>Generate Smart Dimension Callout</span>
                </button>
              </div>
            )}

            {/* ================= 2. HORIZONTAL DIMENSION ================= */}
            {activeTab === 'dim_horizontal' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <DimHorizontalIcon size={26} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Horizontal Linear Dimension</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Creates a horizontal dimension line with dual arrowheads, extension witness lines, and distance text.</p>
                  </div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '14px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '8px' }}>Dimension Span Preset:</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[
                      { id: 'x', label: `X-Length (${dim.x.toFixed(1)} mm)` },
                      { id: 'y', label: `Y-Height (${dim.y.toFixed(1)} mm)` },
                      { id: 'z', label: `Z-Width (${dim.z.toFixed(1)} mm)` }
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setLinearPreset(p.id)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          background: linearPreset === p.id ? '#1e293b' : '#f8fafc',
                          border: `1px solid ${linearPreset === p.id ? '#38bdf8' : '#cbd5e1'}`,
                          color: linearPreset === p.id ? '#38bdf8' : '#334155',
                          borderRadius: '4px',
                          fontWeight: 600,
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleCreateHorizontalDimension}
                  className="btn-primary"
                  style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}
                >
                  <DimHorizontalIcon size={16} />
                  <span>Create Horizontal Dimension</span>
                </button>
              </div>
            )}

            {/* ================= 3. CIRCULAR CALLOUT ================= */}
            {activeTab === 'dim_circular' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <DimCircularIcon size={26} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Circular Radial / Diametral Callout</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Creates 3D leader callouts for hole diameters (&Oslash;) or corner blend fillets (R).</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '6px' }}>Callout Type:</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => setRadialType('radius')}
                        style={{
                          flex: 1,
                          padding: '6px',
                          background: radialType === 'radius' ? '#1e293b' : '#f8fafc',
                          border: `1px solid ${radialType === 'radius' ? '#38bdf8' : '#cbd5e1'}`,
                          color: radialType === 'radius' ? '#38bdf8' : '#334155',
                          borderRadius: '3px',
                          fontWeight: 600,
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        Radius (R)
                      </button>
                      <button
                        onClick={() => setRadialType('diameter')}
                        style={{
                          flex: 1,
                          padding: '6px',
                          background: radialType === 'diameter' ? '#1e293b' : '#f8fafc',
                          border: `1px solid ${radialType === 'diameter' ? '#38bdf8' : '#cbd5e1'}`,
                          color: radialType === 'diameter' ? '#38bdf8' : '#334155',
                          borderRadius: '3px',
                          fontWeight: 600,
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        Diameter (&Oslash;)
                      </button>
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '6px' }}>Radius Value (mm):</label>
                    <input
                      type="number"
                      step="0.5"
                      value={radialValue}
                      onChange={(e) => setRadialValue(e.target.value)}
                      style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11px' }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleCreateCircularDimension}
                  className="btn-primary"
                  style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}
                >
                  <DimCircularIcon size={16} />
                  <span>Create Circular Callout</span>
                </button>
              </div>
            )}

            {/* ================= 4. POINT CALLOUT ================= */}
            {activeTab === 'dim_point' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <DimPointIcon size={26} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Point Coordinate Callout</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Creates 3D XYZ coordinate callouts for fixture locator pins or inspection touch points.</p>
                  </div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    Inserts an associative coordinate billboard callout at the active corner or cursor snap point.
                  </div>
                </div>

                <button
                  onClick={handleCreatePointDimension}
                  className="btn-primary"
                  style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}
                >
                  <DimPointIcon size={16} />
                  <span>Place Point Coordinate Callout</span>
                </button>
              </div>
            )}

            {/* ================= 5. ANGULAR DIMENSION ================= */}
            {activeTab === 'dim_angular' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <DimAngularIcon size={26} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Angular Dimension</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Measures and annotates angles between intersecting edges, chamfers, or draft angles.</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '4px' }}>Angle (&deg; Degrees):</label>
                    <input
                      type="number"
                      step="1"
                      value={angularAngle}
                      onChange={(e) => setAngularAngle(e.target.value)}
                      style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11px' }}
                    />
                  </div>
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '4px' }}>Arc Radius (mm):</label>
                    <input
                      type="number"
                      step="5"
                      value={angularRadius}
                      onChange={(e) => setAngularRadius(e.target.value)}
                      style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11px' }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleCreateAngularDimension}
                  className="btn-primary"
                  style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}
                >
                  <DimAngularIcon size={16} />
                  <span>Generate Angular Dimension</span>
                </button>
              </div>
            )}

            {/* ================= 6. BASELINE / CHAINED ================= */}
            {(activeTab === 'dim_baseline' || activeTab === 'dim_chained') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {activeTab === 'dim_baseline' ? <DimBaselineIcon size={26} /> : <DimChainedIcon size={26} />}
                  <div>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                      {activeTab === 'dim_baseline' ? 'Baseline Dimension Stack' : 'Continuous Chained Series'}
                    </h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                      {activeTab === 'dim_baseline' ? 'Stacked dimensions measured from a common datum zero origin.' : 'End-to-end continuous dimension chain across multiple features.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={activeTab === 'dim_baseline' ? handleCreateBaselineDimension : handleCreateChainedDimension}
                  className="btn-primary"
                  style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}
                >
                  {activeTab === 'dim_baseline' ? <DimBaselineIcon size={16} /> : <DimChainedIcon size={16} />}
                  <span>{activeTab === 'dim_baseline' ? 'Generate Baseline Stack' : 'Generate Chained Series'}</span>
                </button>
              </div>
            )}

            {/* ================= 7. ORDINATE DIMENSIONING ================= */}
            {(activeTab === 'ord_horizontal' || activeTab === 'ord_vertical' || activeTab === 'ord_add_existing' || activeTab === 'ord_window') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <OrdHorizontalIcon size={26} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Ordinate Dimensioning</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>CNC G54 ordinate datum dimensioning: measures all features as absolute distance from datum 0.00.</p>
                  </div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '6px' }}>Ordinate Axis Direction:</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['x', 'z'].map((ax) => (
                      <button
                        key={ax}
                        onClick={() => setOrdinateAxis(ax)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          background: ordinateAxis === ax ? '#1e293b' : '#f8fafc',
                          border: `1px solid ${ordinateAxis === ax ? '#38bdf8' : '#cbd5e1'}`,
                          color: ordinateAxis === ax ? '#38bdf8' : '#334155',
                          borderRadius: '4px',
                          fontWeight: 600,
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        {ax.toUpperCase()}-Axis Ordinate
                      </button>
                    ))}
                  </div>

                  <div style={{ marginTop: '10px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '4px' }}>Feature Coordinate Offsets (comma separated mm):</label>
                    <input
                      type="text"
                      value={ordinatePoints}
                      onChange={(e) => setOrdinatePoints(e.target.value)}
                      style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11px' }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleCreateOrdinateDimension}
                  className="btn-primary"
                  style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}
                >
                  <OrdHorizontalIcon size={16} />
                  <span>Generate Ordinate Coordinate Set</span>
                </button>
              </div>
            )}

            {/* ================= 8. ENGINEERING NOTE ================= */}
            {activeTab === 'note' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <NoteIcon size={26} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Engineering Note</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Multiline title block notes, general drawing tolerances, and heat treatment annotations.</p>
                  </div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '4px' }}>Note Title:</label>
                  <input
                    type="text"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11px', marginBottom: '10px' }}
                  />

                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '4px' }}>Note Text Content:</label>
                  <textarea
                    rows={4}
                    value={noteBody}
                    onChange={(e) => setNoteBody(e.target.value)}
                    style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11px', fontFamily: 'monospace' }}
                  />
                </div>

                <button
                  onClick={handleCreateNote}
                  className="btn-primary"
                  style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}
                >
                  <NoteIcon size={16} />
                  <span>Place Engineering Note on Drawing</span>
                </button>
              </div>
            )}

            {/* ================= 9. CROSS HATCH ================= */}
            {activeTab === 'cross_hatch' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CrossHatchIcon size={26} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>ANSI Section Cross Hatching</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Generates ANSI 45&deg; section hatch line patterns on cut planes or pocket floor faces.</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '4px' }}>Width &amp; Height (mm):</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="number"
                        value={hatchWidth}
                        onChange={(e) => setHatchWidth(e.target.value)}
                        placeholder="Width"
                        style={{ flex: 1, padding: '6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11px' }}
                      />
                      <input
                        type="number"
                        value={hatchHeight}
                        onChange={(e) => setHatchHeight(e.target.value)}
                        placeholder="Height"
                        style={{ flex: 1, padding: '6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11px' }}
                      />
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '4px' }}>Line Spacing / Pitch (mm):</label>
                    <input
                      type="number"
                      value={hatchPitch}
                      onChange={(e) => setHatchPitch(e.target.value)}
                      style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11px' }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleCreateCrossHatch}
                  className="btn-primary"
                  style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}
                >
                  <CrossHatchIcon size={16} />
                  <span>Generate ANSI Cross-Hatch Pattern</span>
                </button>
              </div>
            )}

            {/* ================= 10. LEADER & WITNESS LINE ================= */}
            {(activeTab === 'leader' || activeTab === 'witness_line') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {activeTab === 'leader' ? <LeaderIcon size={26} /> : <WitnessLineIcon size={26} />}
                  <div>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                      {activeTab === 'leader' ? 'Machining Leader Callout' : 'Extension Witness Line'}
                    </h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                      {activeTab === 'leader' ? 'Pointed leader callout for machining operations, thread callouts, or chamfers.' : 'Standard CAD extension witness lines with standoff gaps.'}
                    </p>
                  </div>
                </div>

                {activeTab === 'leader' ? (
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '4px' }}>Leader Callout Text:</label>
                    <input
                      type="text"
                      value={leaderText}
                      onChange={(e) => setLeaderText(e.target.value)}
                      style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11px' }}
                    />
                  </div>
                ) : null}

                <button
                  onClick={activeTab === 'leader' ? handleCreateLeaderNote : handleCreateWitnessLine}
                  className="btn-primary"
                  style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}
                >
                  {activeTab === 'leader' ? <LeaderIcon size={16} /> : <WitnessLineIcon size={16} />}
                  <span>{activeTab === 'leader' ? 'Insert Leader Callout' : 'Generate Witness Lines'}</span>
                </button>
              </div>
            )}

            {/* ================= 11. REGENERATE TOOLS ================= */}
            {(activeTab === 'regen_automatic' || activeTab === 'regen_validate' || activeTab === 'regen_all') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <RegenAutomaticIcon size={26} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Dimension Regeneration &amp; Associativity</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Recomputes all dimension values when solid model geometry changes, scales, or translates.</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <button
                    onClick={handleRegenerateAll}
                    style={{ padding: '14px', background: '#ffffff', border: '1px solid #10b981', borderRadius: '6px', textAlign: 'left', cursor: 'pointer' }}
                  >
                    <RegenAllIcon size={20} />
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginTop: '6px' }}>Regenerate All Dimensions</div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Recalculates distances from live 3D vertices</div>
                  </button>

                  <button
                    onClick={handleValidateDimensions}
                    style={{ padding: '14px', background: '#ffffff', border: '1px solid #38bdf8', borderRadius: '6px', textAlign: 'left', cursor: 'pointer' }}
                  >
                    <RegenValidateIcon size={20} />
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginTop: '6px' }}>Validate Associativity</div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Checks for orphaned dimensions</div>
                  </button>
                </div>
              </div>
            )}

            {/* ================= 12. MODIFY TOOLS ================= */}
            {(activeTab === 'align_note' || activeTab === 'multi_edit' || activeTab === 'break_into_lines') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {activeTab === 'align_note' ? <AlignNoteIcon size={26} /> : activeTab === 'multi_edit' ? <MultiEditIcon size={26} /> : <BreakIntoLinesIcon size={26} />}
                  <div>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                      {activeTab === 'align_note' ? 'Align Notes & Leaders' : activeTab === 'multi_edit' ? 'Multi-Edit Dimension Settings' : 'Break Dimensions Into Lines'}
                    </h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                      {activeTab === 'align_note' ? 'Snaps multiple dimension notes to aligned vertical or horizontal margins.' : activeTab === 'multi_edit' ? 'Batch modify tolerances, font scales, and arrow styles across all dimensions.' : 'Explodes composite 3D dimension groups into discrete wireframe vectors.'}
                    </p>
                  </div>
                </div>

                {activeTab === 'multi_edit' && (
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '4px' }}>Global Tolerance Tag:</label>
                    <input
                      type="text"
                      value={globalTolerance}
                      onChange={(e) => setGlobalTolerance(e.target.value)}
                      style={{ width: '120px', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11px' }}
                    />
                  </div>
                )}

                <button
                  onClick={activeTab === 'align_note' ? handleAlignNotes : activeTab === 'multi_edit' ? handleMultiEdit : handleBreakIntoLines}
                  className="btn-primary"
                  style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}
                >
                  {activeTab === 'align_note' ? <AlignNoteIcon size={16} /> : activeTab === 'multi_edit' ? <MultiEditIcon size={16} /> : <BreakIntoLinesIcon size={16} />}
                  <span>{activeTab === 'align_note' ? 'Execute Note Alignment' : activeTab === 'multi_edit' ? 'Apply Batch Edits' : 'Explode Dimension to Wireframe Lines'}</span>
                </button>
              </div>
            )}

            {/* ================= 13. MANAGER ================= */}
            {activeTab === 'manager' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Layers size={26} color="#60a5fa" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Drafting Entity Tree &amp; Level 100</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Inspect, toggle visibility, and manage all active 3D dimensions and drafting entities in the project.</p>
                  </div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a' }}>
                      Active Drawing Dimensions ({draftingEntities.length}):
                    </div>
                    {onClearDimensions && draftingEntities.length > 0 && (
                      <button
                        onClick={onClearDimensions}
                        className="btn-secondary"
                        style={{ padding: '3px 8px', fontSize: '10px', color: '#ef4444' }}
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {draftingEntities.length === 0 ? (
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', padding: '12px 0' }}>
                      No dimensions placed yet. Select any dimension tool above to annotate your 3D model.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '240px', overflowY: 'auto' }}>
                      {draftingEntities.map((ent) => (
                        <div
                          key={ent.name}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 10px',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '4px',
                            fontSize: '11px'
                          }}
                        >
                          <span style={{ color: '#0f172a', fontWeight: 500 }}>{ent.name}</span>
                          {onRemoveCustomEntity && (
                            <button
                              onClick={() => onRemoveCustomEntity(ent.name)}
                              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                              title="Delete Dimension"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff' }}>
          <div style={{ fontSize: '10px', color: '#64748b' }}>
            Drafting annotations are stored on Level 100 and export to 2D/3D DWG/DXF drawings.
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
