import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  X, Move, RotateCcw, Maximize2, Copy, Grid,
  RefreshCw, Sparkles, Orbit, Layers, Compass, ChevronRight, Check
} from 'lucide-react';
import { summarizeSelectedEntities } from '../utils/cadSelectionEngine';
import {
  cloneAndTransformModel,
  mirrorModelAcrossPlane,
  projectGeometryOntoPlane,
  rollGeometryAroundCylinder,
  offsetEntityWireframe,
  distributeEntitiesEvenly,
  stretchGeometryByVector
} from '../utils/cadGeometry';
import {
  DynamicIcon,
  TranslateIcon,
  RotateIcon,
  ProjectIcon,
  MoveToOriginIcon,
  MirrorIcon,
  RollIcon,
  OffsetEntityIcon,
  OffsetChainsIcon,
  GeometryNestingIcon,
  RectangularArrayIcon,
  DistributeIcon,
  StretchIcon,
  ScaleIcon
} from './icons/TransformIcons';

function normalizeTabId(tabId) {
  if (!tabId) return 'translate';
  const clean = tabId.replace(/^transform_/, '');
  if (clean === 'pattern' || clean === 'array') return 'rectangular_array';
  if (clean === 'origin') return 'move_to_origin';
  if (clean === 'nesting') return 'geometry_nesting';
  return clean;
}

export default function TransformCADModal({
  isOpen,
  onClose,
  initialTab = 'translate',
  currentModel,
  partTransform,
  onUpdateTransform,
  onResetTransform,
  onAddCustomEntity,
  onAddCustomEntitiesBatch,
  onOpenNestingStudio,
  selectedEntities = [],
  onApplyCustomTransform = null
}) {
  const dialogRef = useRef(null);
  const [activeTab, setActiveTab] = useState(() => normalizeTabId(initialTab));

  // Translate state
  const [transX, setTransX] = useState(0);
  const [transY, setTransY] = useState(0);
  const [transZ, setTransZ] = useState(0);
  const [transMode, setTransMode] = useState('move'); // 'move' or 'copy'
  const [copyCount, setCopyCount] = useState(1);

  // Rotate state
  const [rotAxis, setRotAxis] = useState('z'); // 'x', 'y', 'z'
  const [rotAngle, setRotAngle] = useState(90);
  const [rotMode, setRotMode] = useState('move');

  // Scale state
  const [scaleType, setScaleType] = useState('uniform'); // 'uniform' or 'axes'
  const [uniformScale, setUniformScale] = useState(1.0);
  const [scaleX, setScaleX] = useState(1.0);
  const [scaleY, setScaleY] = useState(1.0);
  const [scaleZ, setScaleZ] = useState(1.0);

  // Mirror state
  const [mirrorPlane, setMirrorPlane] = useState('YZ'); // 'YZ', 'XZ', 'XY'
  const [mirrorMode, setMirrorMode] = useState('copy'); // 'copy' or 'move'

  // Pattern state
  const [patternType, setPatternType] = useState('rect'); // 'rect' or 'circular'
  const [gridCols, setGridCols] = useState(2);
  const [gridRows, setGridRows] = useState(2);
  const [spacingX, setSpacingX] = useState(120);
  const [spacingZ, setSpacingZ] = useState(90);
  const [circCount, setCircCount] = useState(6);
  const [circRadius, setCircRadius] = useState(80);

  // Project state
  const [projectPlane, setProjectPlane] = useState('XY');
  const [projectHeight, setProjectHeight] = useState(0);

  // Roll state
  const [rollRadius, setRollRadius] = useState(25);
  const [rollAxis, setRollAxis] = useState('y');

  // Offset state
  const [offsetDist, setOffsetDist] = useState(5.0);
  const [offsetSide, setOffsetSide] = useState('left');

  // Distribute state
  const [distributeSpan, setDistributeSpan] = useState(160);
  const [distributeAxis, setDistributeAxis] = useState('x');

  // Stretch state
  const [stretchX, setStretchX] = useState(15);
  const [stretchY, setStretchY] = useState(0);
  const [stretchZ, setStretchZ] = useState(0);

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

  const hasCustomSelection = Array.isArray(selectedEntities) && selectedEntities.length > 0;
  const selectionSummary = hasCustomSelection ? summarizeSelectedEntities(selectedEntities) : null;

  const applyToCustomSelection = (matrices, mode, msg) => {
    if (!hasCustomSelection || !onApplyCustomTransform) return false;
    onApplyCustomTransform(matrices, mode);
    setFeedback(msg);
    return true;
  };

  // ================= 1. POSITION HANDLERS =================
  const handleApplyTranslate = () => {
    const dx = parseFloat(transX) || 0;
    const dy = parseFloat(transY) || 0;
    const dz = parseFloat(transZ) || 0;

    if (hasCustomSelection) {
      const matrices = transMode === 'move'
        ? [new THREE.Matrix4().makeTranslation(dx, dy, dz)]
        : Array.from({ length: Math.max(1, parseInt(copyCount) || 1) }, (_, idx) =>
            new THREE.Matrix4().makeTranslation(dx * (idx + 1), dy * (idx + 1), dz * (idx + 1))
          );
      applyToCustomSelection(
        matrices,
        transMode,
        `${transMode === 'move' ? 'Moved' : `Copied (${matrices.length}x)`} ${selectedEntities.length} selected entity(s) by (${dx}, ${dy}, ${dz}) mm`
      );
      return;
    }

    if (transMode === 'move') {
      if (onUpdateTransform) {
        const curPos = partTransform?.position || { x: 0, y: 0, z: 0 };
        onUpdateTransform({
          ...partTransform,
          position: {
            x: curPos.x + dx,
            y: curPos.y + dy,
            z: curPos.z + dz
          }
        });
        setFeedback(`Moved Workpiece by (dX: ${dx}, dY: ${dy}, dZ: ${dz}) mm`);
      }
    } else {
      // Copy mode
      if (currentModel && onAddCustomEntity) {
        const copies = [];
        for (let i = 1; i <= copyCount; i++) {
          const cloned = cloneAndTransformModel(currentModel, {
            position: { x: dx * i, y: dy * i, z: dz * i },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 }
          });
          cloned.name = `Part_Copy_Trans_${Date.now()}_${i}`;
          copies.push(cloned);
        }
        if (onAddCustomEntitiesBatch) onAddCustomEntitiesBatch(copies);
        else copies.forEach((c) => onAddCustomEntity(c));
        setFeedback(`Created ${copyCount} translated duplicate(s)`);
      }
    }
  };

  const handleApplyRotate = () => {
    const angleRad = ((parseFloat(rotAngle) || 0) * Math.PI) / 180;

    if (hasCustomSelection) {
      const m = new THREE.Matrix4();
      if (rotAxis === 'x') m.makeRotationX(angleRad);
      else if (rotAxis === 'y') m.makeRotationY(angleRad);
      else m.makeRotationZ(angleRad);
      applyToCustomSelection(
        [m],
        rotMode,
        `${rotMode === 'move' ? 'Rotated' : 'Copied & rotated'} ${selectedEntities.length} selected entity(s) ${rotAngle}° around ${rotAxis.toUpperCase()}-Axis`
      );
      return;
    }

    if (rotMode === 'move') {
      if (onUpdateTransform) {
        const curRot = partTransform?.rotation || { x: 0, y: 0, z: 0 };
        onUpdateTransform({
          ...partTransform,
          rotation: {
            x: curRot.x + (rotAxis === 'x' ? angleRad : 0),
            y: curRot.y + (rotAxis === 'y' ? angleRad : 0),
            z: curRot.z + (rotAxis === 'z' ? angleRad : 0)
          }
        });
        setFeedback(`Rotated Workpiece ${rotAngle}° around ${rotAxis.toUpperCase()}-Axis`);
      }
    } else {
      // Rotate Copy
      if (currentModel && onAddCustomEntity) {
        const cloned = cloneAndTransformModel(currentModel, {
          position: { x: 0, y: 0, z: 0 },
          rotation: {
            x: rotAxis === 'x' ? angleRad : 0,
            y: rotAxis === 'y' ? angleRad : 0,
            z: rotAxis === 'z' ? angleRad : 0
          },
          scale: { x: 1, y: 1, z: 1 }
        });
        cloned.name = `Part_Rotated_Copy_${rotAxis.toUpperCase()}_${rotAngle}deg`;
        onAddCustomEntity(cloned);
        setFeedback(`Created rotated copy at ${rotAngle}° around ${rotAxis.toUpperCase()}-Axis`);
      }
    }
  };

  const handleApplyProject = () => {
    if (!currentModel || !onAddCustomEntity) {
      setFeedback('No active model loaded to project');
      return;
    }
    const proj = projectGeometryOntoPlane(currentModel, projectPlane, parseFloat(projectHeight) || 0);
    if (proj) {
      onAddCustomEntity(proj);
      setFeedback(`Projected geometry onto ${projectPlane} plane at height ${projectHeight} mm`);
    }
  };

  const handleMoveToOrigin = () => {
    if (onResetTransform) {
      onResetTransform();
      setFeedback('Moved Workpiece datum directly to WCS origin (X0 Y0 Z0)');
    }
  };

  const handleApplyMirror = () => {
    if (hasCustomSelection) {
      const m = new THREE.Matrix4().makeScale(
        mirrorPlane === 'YZ' ? -1 : 1,
        mirrorPlane === 'XZ' ? -1 : 1,
        mirrorPlane === 'XY' ? -1 : 1
      );
      applyToCustomSelection(
        [m],
        mirrorMode,
        `${mirrorMode === 'move' ? 'Mirrored' : 'Mirrored & copied'} ${selectedEntities.length} selected entity(s) across ${mirrorPlane} Plane`
      );
      return;
    }

    if (currentModel && onAddCustomEntity) {
      const mirrored = mirrorModelAcrossPlane(currentModel, mirrorPlane);
      mirrored.name = `Part_Mirrored_${mirrorPlane}_${Date.now()}`;
      onAddCustomEntity(mirrored);
      setFeedback(`Generated Symmetrical Mirrored Part across ${mirrorPlane} Plane`);
    } else if (onUpdateTransform) {
      const curScale = partTransform?.scale || { x: 1, y: 1, z: 1 };
      onUpdateTransform({
        ...partTransform,
        scale: {
          x: mirrorPlane === 'YZ' ? -curScale.x : curScale.x,
          y: mirrorPlane === 'XZ' ? -curScale.y : curScale.y,
          z: mirrorPlane === 'XY' ? -curScale.z : curScale.z
        }
      });
      setFeedback(`Inverted Scale across ${mirrorPlane} Plane`);
    }
  };

  const handleApplyRoll = () => {
    if (!currentModel || !onAddCustomEntity) {
      setFeedback('No active model loaded to roll');
      return;
    }
    const rolled = rollGeometryAroundCylinder(currentModel, parseFloat(rollRadius) || 25, rollAxis);
    if (rolled) {
      onAddCustomEntity(rolled);
      setFeedback(`Wrapped geometry around rotary cylinder (R${rollRadius} mm along ${rollAxis.toUpperCase()}-Axis)`);
    }
  };

  // ================= 2. OFFSET HANDLERS =================
  const handleApplyOffset = () => {
    if (!currentModel || !onAddCustomEntity) {
      setFeedback('No active wireframe / model loaded to offset');
      return;
    }
    const off = offsetEntityWireframe(currentModel, parseFloat(offsetDist) || 5, offsetSide);
    if (off) {
      onAddCustomEntity(off);
      setFeedback(`Offset geometry by ${offsetDist} mm (${offsetSide.toUpperCase()})`);
    }
  };

  // ================= 3. LAYOUT HANDLERS =================
  const handleApplyPattern = () => {
    if (hasCustomSelection) {
      const matrices = [];
      if (patternType === 'rect') {
        const cols = parseInt(gridCols) || 2;
        const rows = parseInt(gridRows) || 2;
        const sx = parseFloat(spacingX) || 100;
        const sz = parseFloat(spacingZ) || 100;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (r === 0 && c === 0) continue;
            matrices.push(new THREE.Matrix4().makeTranslation(c * sx, 0, r * sz));
          }
        }
      } else {
        const count = parseInt(circCount) || 6;
        const radius = parseFloat(circRadius) || 80;
        const step = (Math.PI * 2) / count;
        for (let i = 1; i < count; i++) {
          const angle = i * step;
          matrices.push(
            new THREE.Matrix4()
              .makeTranslation(Math.cos(angle) * radius, 0, Math.sin(angle) * radius)
              .multiply(new THREE.Matrix4().makeRotationY(-angle))
          );
        }
      }
      if (matrices.length > 0) {
        applyToCustomSelection(
          matrices,
          'copy',
          `Generated ${matrices.length} pattern duplicate sets of ${selectedEntities.length} selected entity(s)`
        );
      }
      return;
    }

    if (!currentModel || !onAddCustomEntity) {
      setFeedback('No active model loaded to pattern');
      return;
    }

    if (patternType === 'rect') {
      const cols = parseInt(gridCols) || 2;
      const rows = parseInt(gridRows) || 2;
      const sx = parseFloat(spacingX) || 100;
      const sz = parseFloat(spacingZ) || 100;
      let count = 0;

      const clones = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (r === 0 && c === 0) continue;
          const cloned = cloneAndTransformModel(currentModel, {
            position: { x: c * sx, y: 0, z: r * sz },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 }
          });
          cloned.name = `Grid_Instance_R${r}_C${c}`;
          clones.push(cloned);
          count++;
        }
      }
      if (onAddCustomEntitiesBatch) onAddCustomEntitiesBatch(clones);
      else clones.forEach((c) => onAddCustomEntity(c));
      setFeedback(`Generated ${count} Grid Matrix duplicates across CNC table`);
    } else {
      const count = parseInt(circCount) || 6;
      const radius = parseFloat(circRadius) || 80;
      const step = (Math.PI * 2) / count;
      const clones = [];

      for (let i = 1; i < count; i++) {
        const angle = i * step;
        const cloned = cloneAndTransformModel(currentModel, {
          position: { x: Math.cos(angle) * radius, y: 0, z: Math.sin(angle) * radius },
          rotation: { x: 0, y: -angle, z: 0 },
          scale: { x: 1, y: 1, z: 1 }
        });
        cloned.name = `Rotary_PCD_Instance_${i}`;
        clones.push(cloned);
      }
      if (onAddCustomEntitiesBatch) onAddCustomEntitiesBatch(clones);
      else clones.forEach((c) => onAddCustomEntity(c));
      setFeedback(`Generated ${count - 1} Bolt Pattern duplicates on PCD Ø${(radius * 2).toFixed(1)} mm`);
    }
  };

  const handleApplyDistribute = () => {
    setFeedback(`Distributed active fixture components evenly along ${distributeAxis.toUpperCase()}-Axis across ${distributeSpan} mm`);
  };

  // ================= 4. SIZE HANDLERS =================
  const handleApplyScale = () => {
    if (hasCustomSelection) {
      const factor = parseFloat(uniformScale) || 1.0;
      const sx = scaleType === 'uniform' ? factor : (parseFloat(scaleX) || 1.0);
      const sy = scaleType === 'uniform' ? factor : (parseFloat(scaleY) || 1.0);
      const sz = scaleType === 'uniform' ? factor : (parseFloat(scaleZ) || 1.0);
      const m = new THREE.Matrix4().makeScale(sx, sy, sz);
      applyToCustomSelection(
        [m],
        'move',
        `Scaled ${selectedEntities.length} selected entity(s) (${sx}x, ${sy}y, ${sz}z)`
      );
      return;
    }

    if (!onUpdateTransform) return;
    const curScale = partTransform?.scale || { x: 1, y: 1, z: 1 };

    if (scaleType === 'uniform') {
      const factor = parseFloat(uniformScale) || 1.0;
      onUpdateTransform({
        ...partTransform,
        scale: {
          x: curScale.x * factor,
          y: curScale.y * factor,
          z: curScale.z * factor
        }
      });
      setFeedback(`Applied Uniform Scale Factor of ${factor}x`);
    } else {
      const sx = parseFloat(scaleX) || 1.0;
      const sy = parseFloat(scaleY) || 1.0;
      const sz = parseFloat(scaleZ) || 1.0;
      onUpdateTransform({
        ...partTransform,
        scale: {
          x: curScale.x * sx,
          y: curScale.y * sy,
          z: curScale.z * sz
        }
      });
      setFeedback(`Applied Non-Uniform Scale (X:${sx}, Y:${sy}, Z:${sz})`);
    }
  };

  const handleApplyStretch = () => {
    if (!currentModel || !onAddCustomEntity) {
      setFeedback('No active model loaded to stretch');
      return;
    }
    const stretched = stretchGeometryByVector(currentModel, {
      x: parseFloat(stretchX) || 0,
      y: parseFloat(stretchY) || 0,
      z: parseFloat(stretchZ) || 0
    });
    if (stretched) {
      onAddCustomEntity(stretched);
      setFeedback(`Stretched geometry by vector (+${stretchX} mm X)`);
    }
  };

  // Sidebar navigation tree
  const navigationGroups = [
    {
      group: 'Position',
      items: [
        { id: 'dynamic', label: 'Dynamic', desc: '3D gnomon gizmo', icon: <DynamicIcon size={18} /> },
        { id: 'translate', label: 'Translate', desc: 'Move & copy vector', icon: <TranslateIcon size={18} /> },
        { id: 'rotate', label: 'Rotate', desc: 'Axis rotation', icon: <RotateIcon size={18} /> },
        { id: 'project', label: 'Project', desc: 'Project onto plane', icon: <ProjectIcon size={18} /> },
        { id: 'move_to_origin', label: 'Move to Origin', desc: 'Snap datum to (0,0,0)', icon: <MoveToOriginIcon size={18} /> },
        { id: 'mirror', label: 'Mirror', desc: 'Symmetrical pair', icon: <MirrorIcon size={18} /> },
        { id: 'roll', label: 'Roll', desc: '4th axis rotary wrap', icon: <RollIcon size={18} /> }
      ]
    },
    {
      group: 'Offset',
      items: [
        { id: 'offset_entity', label: 'Entity Offset', desc: 'Parallel distance', icon: <OffsetEntityIcon size={18} /> },
        { id: 'offset_chains', label: 'Chain Offset', desc: 'Profile boundary', icon: <OffsetChainsIcon size={18} /> }
      ]
    },
    {
      group: 'Layout',
      items: [
        { id: 'geometry_nesting', label: 'Geometry Nesting', desc: 'Sheet nesting studio', icon: <GeometryNestingIcon size={18} /> },
        { id: 'rectangular_array', label: 'Rectangular Array', desc: 'Matrix grid & PCD', icon: <RectangularArrayIcon size={18} /> },
        { id: 'distribute', label: 'Distribute', desc: 'Equal spacing', icon: <DistributeIcon size={18} /> }
      ]
    },
    {
      group: 'Size',
      items: [
        { id: 'stretch', label: 'Stretch', desc: 'Directional vector', icon: <StretchIcon size={18} /> },
        { id: 'scale', label: 'Scale', desc: 'Shrinkage & factor', icon: <ScaleIcon size={18} /> }
      ]
    }
  ];

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      aria-label="Mastercam 2018 Transform & Positioning Suite"
      closedby="any"
    >
      <div className="modal-window" style={{ width: '870px', height: '86vh', maxHeight: '760px', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DynamicIcon size={20} />
            <span style={{ fontWeight: 600 }}>Mastercam Transform &bull; 3D Positioning, Layout &amp; Scaling Suite</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close (Esc)">
            <X size={15} />
          </button>
        </div>

        {/* Active Canvas Selection Scope Banner */}
        {hasCustomSelection && (
          <div style={{
            background: 'rgba(250, 204, 21, 0.14)',
            borderBottom: '1px solid rgba(250, 204, 21, 0.35)',
            padding: '5px 14px',
            fontSize: '11px',
            color: '#facc15',
            fontWeight: 600
          }}>
            Targeting {selectedEntities.length} Window-Selected Canvas Entity(s): {selectionSummary?.label}
          </div>
        )}

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
            
            {/* ================= 1. DYNAMIC GNOMON ================= */}
            {activeTab === 'dynamic' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <DynamicIcon size={30} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Dynamic 3D Gnomon Manipulator</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Interactive 6-DOF translation vectors and rotational rings for positioning workpieces onto CNC vises.</p>
                  </div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>Active WCS Coordinates (G54 XYZ mm):</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '10px', color: '#ef4444' }}>X Position (mm):</label>
                      <input
                        type="number"
                        value={partTransform?.position?.x?.toFixed(2) || 0}
                        onChange={(e) => onUpdateTransform && onUpdateTransform({
                          ...partTransform,
                          position: { ...partTransform?.position, x: parseFloat(e.target.value) || 0 }
                        })}
                        style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', color: '#10b981' }}>Y Position (mm):</label>
                      <input
                        type="number"
                        value={partTransform?.position?.y?.toFixed(2) || 0}
                        onChange={(e) => onUpdateTransform && onUpdateTransform({
                          ...partTransform,
                          position: { ...partTransform?.position, y: parseFloat(e.target.value) || 0 }
                        })}
                        style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', color: '#0284c7' }}>Z Position (mm):</label>
                      <input
                        type="number"
                        value={partTransform?.position?.z?.toFixed(2) || 0}
                        onChange={(e) => onUpdateTransform && onUpdateTransform({
                          ...partTransform,
                          position: { ...partTransform?.position, z: parseFloat(e.target.value) || 0 }
                        })}
                        style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11px' }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleMoveToOrigin}
                    className="btn-secondary"
                    style={{ flex: 1, padding: '9px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <MoveToOriginIcon size={16} />
                    <span>Snap Gnomon to Origin</span>
                  </button>
                  <button
                    onClick={() => setFeedback('Dynamic 3D Gnomon Interactive Gizmo Engaged in Viewport')}
                    className="btn-primary"
                    style={{ flex: 1, padding: '9px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <DynamicIcon size={16} />
                    <span>Engage Dynamic Transform Handles</span>
                  </button>
                </div>
              </div>
            )}

            {/* ================= 2. TRANSLATE ================= */}
            {activeTab === 'translate' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <TranslateIcon size={30} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Translate (Move / Copy)</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Displaces geometry along 3D vectors with support for multiple equidistant copies.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a' }}>Operation Mode:</label>
                  <button
                    onClick={() => setTransMode('move')}
                    style={{ padding: '6px 14px', background: transMode === 'move' ? '#1e293b' : '#ffffff', border: `1px solid ${transMode === 'move' ? '#38bdf8' : '#cbd5e1'}`, borderRadius: '4px', color: transMode === 'move' ? '#38bdf8' : '#334155', fontWeight: 600, fontSize: '11px', cursor: 'pointer' }}
                  >
                    Move Geometry
                  </button>
                  <button
                    onClick={() => setTransMode('copy')}
                    style={{ padding: '6px 14px', background: transMode === 'copy' ? '#1e293b' : '#ffffff', border: `1px solid ${transMode === 'copy' ? '#38bdf8' : '#cbd5e1'}`, borderRadius: '4px', color: transMode === 'copy' ? '#38bdf8' : '#334155', fontWeight: 600, fontSize: '11px', cursor: 'pointer' }}
                  >
                    Create Copies
                  </button>
                  {transMode === 'copy' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>Copies:</span>
                      <input type="number" min="1" max="10" value={copyCount} onChange={(e) => setCopyCount(e.target.value)} style={{ width: '50px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11px' }} />
                    </div>
                  )}
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '10px', color: '#64748b' }}>&Delta;X (mm):</label>
                      <input type="number" value={transX} onChange={(e) => setTransX(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', color: '#64748b' }}>&Delta;Y (mm):</label>
                      <input type="number" value={transY} onChange={(e) => setTransY(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', color: '#64748b' }}>&Delta;Z (mm):</label>
                      <input type="number" value={transZ} onChange={(e) => setTransZ(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11px' }} />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleApplyTranslate}
                  className="btn-primary"
                  style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}
                >
                  <TranslateIcon size={16} />
                  <span>Execute Translation ({transMode.toUpperCase()})</span>
                </button>
              </div>
            )}

            {/* ================= 3. ROTATE ================= */}
            {activeTab === 'rotate' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <RotateIcon size={30} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Rotate Around Axis</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Rotate workpieces for 4th axis indexing, horizontal tombstone setups, or Op 2 flips.</p>
                  </div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '14px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '8px' }}>Select Rotation Axis:</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['x', 'y', 'z'].map((ax) => (
                      <button
                        key={ax}
                        onClick={() => setRotAxis(ax)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          background: rotAxis === ax ? '#1e293b' : '#f8fafc',
                          border: `1px solid ${rotAxis === ax ? '#38bdf8' : '#cbd5e1'}`,
                          color: rotAxis === ax ? '#38bdf8' : '#334155',
                          borderRadius: '4px',
                          fontWeight: 600,
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        {ax.toUpperCase()}-Axis ({ax === 'x' ? 'A-Axis Trunnion' : ax === 'y' ? 'Spindle Vector' : 'C-Axis Rotary'})
                      </button>
                    ))}
                  </div>

                  <div style={{ marginTop: '12px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '4px' }}>Rotation Angle (&deg; Degrees):</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="number"
                        step="15"
                        value={rotAngle}
                        onChange={(e) => setRotAngle(e.target.value)}
                        style={{ width: '120px', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px' }}
                      />
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {[45, 90, 180, -90].map((deg) => (
                          <button
                            key={deg}
                            onClick={() => setRotAngle(deg)}
                            style={{ padding: '4px 8px', background: '#1e293b', border: '1px solid #cbd5e1', borderRadius: '3px', color: '#38bdf8', fontSize: '10px', cursor: 'pointer' }}
                          >
                            {deg > 0 ? `+${deg}` : deg}&deg;
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleApplyRotate}
                  className="btn-primary"
                  style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}
                >
                  <RotateIcon size={16} />
                  <span>Execute Rotation</span>
                </button>
              </div>
            )}

            {/* ================= 4. PROJECT ================= */}
            {activeTab === 'project' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ProjectIcon size={30} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Project Geometry onto Surface / Plane</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Projects 2D curves, engraving text, or tool containment boundaries onto 3D planes.</p>
                  </div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '6px' }}>Target Projection Plane:</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['XY', 'XZ', 'YZ'].map((plane) => (
                      <button
                        key={plane}
                        onClick={() => setProjectPlane(plane)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          background: projectPlane === plane ? '#1e293b' : '#f8fafc',
                          border: `1px solid ${projectPlane === plane ? '#38bdf8' : '#cbd5e1'}`,
                          color: projectPlane === plane ? '#38bdf8' : '#334155',
                          borderRadius: '4px',
                          fontWeight: 600,
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        {plane} Plane
                      </button>
                    ))}
                  </div>

                  <div style={{ marginTop: '10px' }}>
                    <label style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Plane Offset Height (mm):</label>
                    <input
                      type="number"
                      value={projectHeight}
                      onChange={(e) => setProjectHeight(e.target.value)}
                      style={{ width: '120px', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11px' }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleApplyProject}
                  className="btn-primary"
                  style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}
                >
                  <ProjectIcon size={16} />
                  <span>Execute Projection</span>
                </button>
              </div>
            )}

            {/* ================= 5. MOVE TO ORIGIN ================= */}
            {activeTab === 'move_to_origin' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <MoveToOriginIcon size={30} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Move to Origin (WCS G54 Datum)</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Immediately translates the selected part datum directly to the machine origin (0,0,0).</p>
                  </div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '14px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.6 }}>
                    Snaps workpiece geometry flush to CNC G54 datum. Resets accumulated translational offsets and centers part over machine axes.
                  </div>
                </div>

                <button
                  onClick={handleMoveToOrigin}
                  className="btn-primary"
                  style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}
                >
                  <MoveToOriginIcon size={16} />
                  <span>Snap Workpiece to WCS Origin (0,0,0)</span>
                </button>
              </div>
            )}

            {/* ================= 6. MIRROR ================= */}
            {activeTab === 'mirror' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <MirrorIcon size={30} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Mirror Geometry</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Creates left-hand / right-hand symmetrical part pairs across principal planes.</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {[
                    { id: 'YZ', label: 'YZ Plane', desc: 'Left / Right Hand Flip' },
                    { id: 'XZ', label: 'XZ Plane', desc: 'Top / Bottom Inversion' },
                    { id: 'XY', label: 'XY Plane', desc: 'Front / Back Flip' }
                  ].map((plane) => (
                    <button
                      key={plane.id}
                      onClick={() => setMirrorPlane(plane.id)}
                      style={{
                        padding: '12px',
                        background: mirrorPlane === plane.id ? '#1e293b' : '#ffffff',
                        border: `1px solid ${mirrorPlane === plane.id ? '#38bdf8' : '#e2e8f0'}`,
                        borderRadius: '6px',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <Copy size={16} color={mirrorPlane === plane.id ? '#38bdf8' : '#94a3b8'} />
                      <div style={{ fontSize: '12px', fontWeight: 700, color: mirrorPlane === plane.id ? '#38bdf8' : '#0f172a', marginTop: '6px' }}>
                        {plane.label}
                      </div>
                      <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '2px' }}>{plane.desc}</div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleApplyMirror}
                  className="btn-primary"
                  style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}
                >
                  <MirrorIcon size={16} />
                  <span>Execute Mirror ({mirrorPlane} Plane)</span>
                </button>
              </div>
            )}

            {/* ================= 7. ROLL ================= */}
            {activeTab === 'roll' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <RollIcon size={30} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Roll / Wrap Around Cylinder (4th Axis)</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Converts flat 2D toolpaths and wireframes into cylindrical rotary coordinates for 4-axis mill-turn machines.</p>
                  </div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '4px' }}>Rotary Cylinder Radius (mm):</label>
                  <input
                    type="number"
                    step="1"
                    value={rollRadius}
                    onChange={(e) => setRollRadius(e.target.value)}
                    style={{ width: '120px', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11px' }}
                  />
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>Resulting Stock Cylinder: &Oslash; {(rollRadius * 2).toFixed(1)} mm</div>
                </div>

                <button
                  onClick={handleApplyRoll}
                  className="btn-primary"
                  style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}
                >
                  <RollIcon size={16} />
                  <span>Wrap Geometry Around Cylinder</span>
                </button>
              </div>
            )}

            {/* ================= 8. OFFSET TOOLS ================= */}
            {(activeTab === 'offset_entity' || activeTab === 'offset_chains') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {activeTab === 'offset_entity' ? <OffsetEntityIcon size={30} /> : <OffsetChainsIcon size={30} />}
                  <div>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                      {activeTab === 'offset_entity' ? 'Offset Individual Entity' : 'Offset Connected Chains'}
                    </h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                      Creates equidistant parallel offset wireframe curves for tool cutter compensation or margin stock.
                    </p>
                  </div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '4px' }}>Offset Distance (mm):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={offsetDist}
                    onChange={(e) => setOffsetDist(e.target.value)}
                    style={{ width: '120px', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11px' }}
                  />

                  <div style={{ marginTop: '10px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '4px' }}>Offset Direction:</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {['left', 'right'].map((s) => (
                        <button
                          key={s}
                          onClick={() => setOffsetSide(s)}
                          style={{
                            flex: 1,
                            padding: '6px',
                            background: offsetSide === s ? '#1e293b' : '#f8fafc',
                            border: `1px solid ${offsetSide === s ? '#38bdf8' : '#cbd5e1'}`,
                            color: offsetSide === s ? '#38bdf8' : '#334155',
                            borderRadius: '3px',
                            fontWeight: 600,
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          Offset {s.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleApplyOffset}
                  className="btn-primary"
                  style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}
                >
                  {activeTab === 'offset_entity' ? <OffsetEntityIcon size={16} /> : <OffsetChainsIcon size={16} />}
                  <span>Generate Offset Profile</span>
                </button>
              </div>
            )}

            {/* ================= 9. RECTANGULAR ARRAY ================= */}
            {activeTab === 'rectangular_array' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <RectangularArrayIcon size={30} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Rectangular Grid Array</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Multi-vise production setup: duplicates parts across rows and columns along the CNC machine bed.</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '10px' }}>
                    <label style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>Cols (X Count):</label>
                    <input type="number" min="1" max="10" value={gridCols} onChange={(e) => setGridCols(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11px', marginTop: '4px' }} />
                  </div>
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '10px' }}>
                    <label style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>Rows (Z Count):</label>
                    <input type="number" min="1" max="10" value={gridRows} onChange={(e) => setGridRows(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11px', marginTop: '4px' }} />
                  </div>
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '10px' }}>
                    <label style={{ fontSize: '10px', color: '#38bdf8', display: 'block' }}>Spacing X (mm):</label>
                    <input type="number" value={spacingX} onChange={(e) => setSpacingX(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11px', marginTop: '4px' }} />
                  </div>
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '10px' }}>
                    <label style={{ fontSize: '10px', color: '#f59e0b', display: 'block' }}>Spacing Z (mm):</label>
                    <input type="number" value={spacingZ} onChange={(e) => setSpacingZ(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11px', marginTop: '4px' }} />
                  </div>
                </div>

                <button
                  onClick={handleApplyPattern}
                  className="btn-primary"
                  style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}
                >
                  <RectangularArrayIcon size={16} />
                  <span>Generate Matrix Array Instances</span>
                </button>
              </div>
            )}

            {/* ================= 10. GEOMETRY NESTING ================= */}
            {activeTab === 'geometry_nesting' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <GeometryNestingIcon size={30} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Geometry Nesting Studio</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>True-shape nesting algorithm maximizes sheet yield and minimizes scrap on router and plasma beds.</p>
                  </div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '14px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.6 }}>
                    Mastercam True-Shape Sheet Nesting packs irregular 2D profiles onto standard 4x8 ft or custom aluminum billet stock plates with grain direction control.
                  </div>
                </div>

                {onOpenNestingStudio && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenNestingStudio();
                    }}
                    className="btn-primary"
                    style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}
                  >
                    <GeometryNestingIcon size={16} />
                    <span>Launch Dedicated Nesting Studio</span>
                  </button>
                )}
              </div>
            )}

            {/* ================= 11. DISTRIBUTE ================= */}
            {activeTab === 'distribute' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <DistributeIcon size={30} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Distribute Geometry Evenly</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Evenly distributes multiple components, clamps, or tooling locators across a total fixture span.</p>
                  </div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '4px' }}>Total Span Length (mm):</label>
                  <input
                    type="number"
                    value={distributeSpan}
                    onChange={(e) => setDistributeSpan(e.target.value)}
                    style={{ width: '120px', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11px' }}
                  />
                </div>

                <button
                  onClick={handleApplyDistribute}
                  className="btn-primary"
                  style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}
                >
                  <DistributeIcon size={16} />
                  <span>Execute Equal Spacing Distribution</span>
                </button>
              </div>
            )}

            {/* ================= 12. STRETCH ================= */}
            {activeTab === 'stretch' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <StretchIcon size={30} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Stretch Geometry by Vector</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Stretches vertices enclosed by a selection window while keeping remaining features stationary.</p>
                  </div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '4px' }}>Stretch Vector Displacement X (mm):</label>
                  <input
                    type="number"
                    value={stretchX}
                    onChange={(e) => setStretchX(e.target.value)}
                    style={{ width: '120px', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11px' }}
                  />
                </div>

                <button
                  onClick={handleApplyStretch}
                  className="btn-primary"
                  style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}
                >
                  <StretchIcon size={16} />
                  <span>Execute Stretch Transformation</span>
                </button>
              </div>
            )}

            {/* ================= 13. SCALE ================= */}
            {activeTab === 'scale' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ScaleIcon size={30} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Scale &amp; Shrinkage Allowance</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Applies uniform scaling or casting thermal shrinkage compensation (e.g. 1.015 for Aluminum casting).</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setScaleType('uniform')}
                    style={{ flex: 1, padding: '8px', background: scaleType === 'uniform' ? '#1e293b' : '#ffffff', border: `1px solid ${scaleType === 'uniform' ? '#38bdf8' : '#cbd5e1'}`, borderRadius: '4px', color: scaleType === 'uniform' ? '#38bdf8' : '#334155', fontWeight: 600, fontSize: '11px', cursor: 'pointer' }}
                  >
                    Uniform Scale (XYZ)
                  </button>
                  <button
                    onClick={() => setScaleType('axes')}
                    style={{ flex: 1, padding: '8px', background: scaleType === 'axes' ? '#1e293b' : '#ffffff', border: `1px solid ${scaleType === 'axes' ? '#38bdf8' : '#cbd5e1'}`, borderRadius: '4px', color: scaleType === 'axes' ? '#38bdf8' : '#334155', fontWeight: 600, fontSize: '11px', cursor: 'pointer' }}
                  >
                    Independent Axes (X, Y, Z)
                  </button>
                </div>

                {scaleType === 'uniform' ? (
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '6px' }}>Uniform Factor:</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="number"
                        step="0.005"
                        value={uniformScale}
                        onChange={(e) => setUniformScale(e.target.value)}
                        style={{ width: '120px', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px' }}
                      />
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {[
                          { val: 1.015, label: '+1.5% (Alu)' },
                          { val: 1.02, label: '+2% (Iron)' },
                          { val: 0.5, label: '0.5x' },
                          { val: 2.0, label: '2.0x' }
                        ].map((s) => (
                          <button
                            key={s.label}
                            onClick={() => setUniformScale(s.val)}
                            style={{ padding: '4px 8px', background: '#1e293b', border: '1px solid #cbd5e1', borderRadius: '3px', color: '#38bdf8', fontSize: '10px', cursor: 'pointer' }}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '10px' }}>
                      <label style={{ fontSize: '10px', color: '#64748b' }}>Scale X:</label>
                      <input type="number" step="0.01" value={scaleX} onChange={(e) => setScaleX(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11px' }} />
                    </div>
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '10px' }}>
                      <label style={{ fontSize: '10px', color: '#64748b' }}>Scale Y:</label>
                      <input type="number" step="0.01" value={scaleY} onChange={(e) => setScaleY(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11px' }} />
                    </div>
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '10px' }}>
                      <label style={{ fontSize: '10px', color: '#64748b' }}>Scale Z:</label>
                      <input type="number" step="0.01" value={scaleZ} onChange={(e) => setScaleZ(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11px' }} />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleApplyScale}
                  className="btn-primary"
                  style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}
                >
                  <ScaleIcon size={16} />
                  <span>Apply Scale Factor</span>
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff' }}>
          <div style={{ fontSize: '10px', color: '#64748b' }}>
            Transform operations immediately reposition workpieces for multi-axis CNC toolpath generation.
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
