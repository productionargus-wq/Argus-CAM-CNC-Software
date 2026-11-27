import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Check, X, HelpCircle, ArrowLeftRight, Move, Star } from 'lucide-react';
import { getCustomEntityColor, getCustomEntityId } from '../utils/cadSelectionEngine';

function useDraggablePalette(initialX, initialY, width) {
  const [pos, setPos] = useState(() => {
    const maxX = typeof window !== 'undefined' ? Math.max(8, window.innerWidth - width - 8) : initialX;
    const maxY = typeof window !== 'undefined' ? Math.max(64, window.innerHeight - 120) : initialY;
    return {
      x: Math.min(Math.max(8, initialX), maxX),
      y: Math.min(Math.max(64, initialY), maxY)
    };
  });
  const dragStateRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const drag = dragStateRef.current;
      if (!drag) return;
      const maxX = Math.max(8, window.innerWidth - width - 8);
      const maxY = Math.max(64, window.innerHeight - 48);
      const nextX = Math.min(Math.max(8, drag.startLeft + (e.clientX - drag.startX)), maxX);
      const nextY = Math.min(Math.max(64, drag.startTop + (e.clientY - drag.startY)), maxY);
      setPos({ x: nextX, y: nextY });
    };

    const handleMouseUp = () => {
      dragStateRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [width]);

  const handleTitleMouseDown = useCallback((e) => {
    if (e.button !== 0 || e.target.closest('button')) return;
    e.preventDefault();
    dragStateRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startLeft: pos.x,
      startTop: pos.y
    };
  }, [pos.x, pos.y]);

  return { pos, handleTitleMouseDown };
}

/**
 * Mastercam Arc & Line Properties Floating Dialog
 * Directly reproduces Images 4 & 5.
 */
export default function MastercamEntityPropertiesDialog({
  isOpen,
  onClose,
  entity = null,
  onUpdateEntity = null,
  promptText = 'Select entities to analyze',
  isMobile = false
}) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !entity) return null;

  const ud = entity.userData || {};
  const isArc = (
    ud.cadType === 'circle' ||
    ud.type === 'circle' ||
    ud.type === 'arc' ||
    entity.type === 'circle' ||
    entity.type === 'arc' ||
    typeof ud.radius === 'number'
  );

  return isArc ? (
    <ArcPropertiesPalette
      entity={entity}
      onClose={onClose}
      onUpdateEntity={onUpdateEntity}
      promptText={promptText}
      isMobile={isMobile}
    />
  ) : (
    <LinePropertiesPalette
      entity={entity}
      onClose={onClose}
      onUpdateEntity={onUpdateEntity}
      promptText={promptText}
      isMobile={isMobile}
    />
  );
}

// -------------------------------------------------------------
// Image 4: Arc Properties Dialog
// -------------------------------------------------------------
function ArcPropertiesPalette({ entity, onClose, onUpdateEntity, promptText, isMobile }) {
  const { pos, handleTitleMouseDown } = useDraggablePalette(isMobile ? 36 : 260, isMobile ? 84 : 192, 210);
  const ud = entity.userData || {};
  const initialRadius = Number(ud.radius ?? (entity.geometry?.parameters?.radius ?? 30.117));
  const initialCenter = ud.center || { x: -88.362, y: -16.633, z: 0.0 };
  const initialStartAngle = Number(ud.startAngle ?? 0.0);
  const initialEndAngle = Number(ud.endAngle ?? 360.0);

  const [radius, setRadius] = useState(initialRadius.toFixed(3));
  const [diameter, setDiameter] = useState((initialRadius * 2).toFixed(3));
  const [centerX, setCenterX] = useState(Number(initialCenter.x).toFixed(3));
  const [centerY, setCenterY] = useState(Number(initialCenter.y).toFixed(3));
  const [centerZ, setCenterZ] = useState(Number(initialCenter.z ?? 0).toFixed(3));
  const [sweepAngle, setSweepAngle] = useState(Math.abs(initialEndAngle - initialStartAngle || 360).toFixed(1));
  const [startAngle, setStartAngle] = useState(initialStartAngle.toFixed(1));
  const [endAngle, setEndAngle] = useState(initialEndAngle.toFixed(1));
  const [level, setLevel] = useState(ud.level || 1);
  const [colorIdx, setColorIdx] = useState(ud.colorIndex || 1);
  const [style, setStyle] = useState(ud.lineStyle || 'solid');
  const [width, setWidth] = useState(ud.lineWidth || '1');

  useEffect(() => {
    const r = Number(ud.radius ?? (entity.geometry?.parameters?.radius ?? 30.117));
    const c = ud.center || { x: -88.362, y: -16.633, z: 0.0 };
    setRadius(r.toFixed(3));
    setDiameter((r * 2).toFixed(3));
    setCenterX(Number(c.x).toFixed(3));
    setCenterY(Number(c.y).toFixed(3));
    setCenterZ(Number(c.z ?? 0).toFixed(3));
  }, [entity]);

  const handleRadiusChange = (val) => {
    setRadius(val);
    const r = parseFloat(val);
    if (!isNaN(r) && r > 0) {
      setDiameter((r * 2).toFixed(3));
      const len = 2 * Math.PI * r * (parseFloat(sweepAngle) / 360);
      setLen3D(len.toFixed(2));
    }
  };

  const handleDiameterChange = (val) => {
    setDiameter(val);
    const d = parseFloat(val);
    if (!isNaN(d) && d > 0) {
      setRadius((d / 2).toFixed(3));
    }
  };

  const rNum = parseFloat(radius) || 30.117;
  const swNum = parseFloat(sweepAngle) || 360.0;
  const len3D = (2 * Math.PI * rNum * (swNum / 360)).toFixed(2);

  const handleApply = () => {
    if (onUpdateEntity) {
      onUpdateEntity(getCustomEntityId(entity), {
        radius: parseFloat(radius) || rNum,
        center: { x: parseFloat(centerX) || 0, y: parseFloat(centerY) || 0, z: parseFloat(centerZ) || 0 },
        startAngle: parseFloat(startAngle) || 0,
        endAngle: parseFloat(endAngle) || 360,
        level: parseInt(level, 10) || 1
      });
    }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: `${pos.y}px`,
        left: `${pos.x}px`,
        zIndex: 1300,
        width: '210px',
        background: '#f1f5f9',
        border: '1px solid #94a3b8',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.28)',
        borderRadius: '2px',
        fontFamily: "'Segoe UI', Tahoma, sans-serif",
        fontSize: '11px',
        color: '#1e293b',
        userSelect: 'none'
      }}
    >
      {/* Title Bar matching Image 4 */}
      <div
        onMouseDown={handleTitleMouseDown}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 8px',
          background: '#ffffff',
          borderBottom: '1px solid #cbd5e1',
          cursor: 'move'
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
          Arc Properties
        </span>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '1px', color: '#64748b' }}
          title="Close (Esc)"
        >
          <X size={14} />
        </button>
      </div>

      <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {/* Row 1: View [ 1 ] and Reverse Vector Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#475569' }}>View</span>
            <input
              type="text"
              readOnly
              value="1"
              style={{ width: '32px', textAlign: 'center', background: '#e0f2fe', border: '1px solid #7dd3fc', padding: '1px' }}
            />
          </div>
          <button
            type="button"
            title="Reverse Arc Direction"
            style={{
              padding: '2px 8px',
              background: '#e2e8f0',
              border: '1px solid #cbd5e1',
              borderRadius: '2px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <ArrowLeftRight size={14} color="#0284c7" />
          </button>
        </div>

        {/* Row 2: Center Coordinates (X, Y, Z) with target quadrant icon and move cross */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Quadrant Circle Icon */}
          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#0284c7', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ position: 'absolute', width: '50%', height: '50%', background: '#ffffff', top: 0, left: 0 }} />
            <div style={{ position: 'absolute', width: '50%', height: '50%', background: '#ffffff', bottom: 0, right: 0 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', color: '#64748b' }}>X</span>
              <input
                type="text"
                value={centerX}
                onChange={(e) => setCenterX(e.target.value)}
                style={{ flex: 1, padding: '1px 3px', background: '#fef08a', border: '1px solid #ca8a04', textAlign: 'right', fontWeight: 600 }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', color: '#64748b' }}>Y</span>
              <input
                type="text"
                value={centerY}
                onChange={(e) => setCenterY(e.target.value)}
                style={{ flex: 1, padding: '1px 3px', background: '#fef08a', border: '1px solid #ca8a04', textAlign: 'right', fontWeight: 600 }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', color: '#64748b' }}>Z</span>
              <input
                type="text"
                value={centerZ}
                onChange={(e) => setCenterZ(e.target.value)}
                style={{ flex: 1, padding: '1px 3px', background: '#fef08a', border: '1px solid #ca8a04', textAlign: 'right', fontWeight: 600 }}
              />
            </div>
          </div>
          <button style={{ background: '#e2e8f0', border: '1px solid #cbd5e1', padding: '4px 3px', cursor: 'pointer' }} title="Pick New Center">
            <Move size={14} color="#475569" />
          </button>
        </div>

        {/* Row 3: Radius */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: '1.5px solid #0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '10px', color: '#b91c1c' }}>↗</span>
          </div>
          <input
            type="text"
            value={radius}
            onChange={(e) => handleRadiusChange(e.target.value)}
            style={{ flex: 1, padding: '2px 4px', background: '#fef08a', border: '1px solid #ca8a04', textAlign: 'right', fontWeight: 600 }}
          />
          <button style={{ background: '#e2e8f0', border: '1px solid #cbd5e1', padding: '2px 3px', cursor: 'pointer' }} title="Pick Radius">
            <Move size={14} color="#475569" />
          </button>
        </div>

        {/* Row 4: Diameter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: '1.5px solid #0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '10px', color: '#b91c1c' }}>↔</span>
          </div>
          <input
            type="text"
            value={diameter}
            onChange={(e) => handleDiameterChange(e.target.value)}
            style={{ flex: 1, padding: '2px 4px', background: '#fef08a', border: '1px solid #ca8a04', textAlign: 'right', fontWeight: 600 }}
          />
          <button style={{ background: '#0284c7', border: '1px solid #0369a1', padding: '2px 3px', cursor: 'pointer', borderRadius: '2px' }} title="Diameter Functions">
            <Star size={14} color="#ffffff" />
          </button>
        </div>

        {/* Row 5: Sweep Angle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '12px', color: '#0284c7' }}>∠</span>
          </div>
          <input
            type="text"
            value={sweepAngle}
            onChange={(e) => setSweepAngle(e.target.value)}
            style={{ flex: 1, padding: '2px 4px', background: '#fef08a', border: '1px solid #ca8a04', textAlign: 'right', fontWeight: 600 }}
          />
        </div>

        {/* Row 6: 3D Length */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '10px', color: '#64748b' }}>
            3D ➔
          </div>
          <input
            type="text"
            readOnly
            value={len3D}
            style={{ flex: 1, padding: '2px 4px', background: '#fef08a', border: '1px solid #ca8a04', textAlign: 'right', fontWeight: 600 }}
          />
        </div>

        {/* Row 7: Start & End Angles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1 }}>
            <span style={{ fontSize: '11px', color: '#16a34a' }}>⮑</span>
            <input
              type="text"
              value={startAngle}
              onChange={(e) => setStartAngle(e.target.value)}
              style={{ width: '100%', padding: '2px 4px', background: '#fef08a', border: '1px solid #ca8a04', textAlign: 'right', fontWeight: 600 }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1 }}>
            <span style={{ fontSize: '11px', color: '#dc2626' }}>⮐</span>
            <input
              type="text"
              value={endAngle}
              onChange={(e) => setEndAngle(e.target.value)}
              style={{ width: '100%', padding: '2px 4px', background: '#fef08a', border: '1px solid #ca8a04', textAlign: 'right', fontWeight: 600 }}
            />
          </div>
        </div>

        {/* Row 8: Level & Color */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderTop: '1px solid #cbd5e1', paddingTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flex: 1 }}>
            <div style={{ width: '16px', height: '16px', border: '1px solid #94a3b8', background: '#fef08a', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              <div style={{ background: '#ef4444' }} />
              <div style={{ background: '#3b82f6' }} />
              <div style={{ background: '#22c55e' }} />
              <div style={{ background: '#eab308' }} />
            </div>
            <input
              type="text"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              style={{ width: '100%', padding: '1px 3px', background: '#fef08a', border: '1px solid #ca8a04', textAlign: 'center' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flex: 1 }}>
            <div style={{ width: '16px', height: '16px', border: '1px solid #94a3b8', background: '#3b82f6' }} />
            <input
              type="text"
              value={colorIdx}
              onChange={(e) => setColorIdx(e.target.value)}
              style={{ width: '100%', padding: '1px 3px', background: '#ffffff', border: '1px solid #cbd5e1', textAlign: 'center' }}
            />
          </div>
        </div>

        {/* Style & Width */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#475569' }}>Style</span>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              style={{ width: '110px', padding: '1px', fontSize: '11px', border: '1px solid #cbd5e1' }}
            >
              <option value="solid">━━━━ Solid</option>
              <option value="dashed">╍ ╍ ╍ Dashed</option>
              <option value="dotted">┈┈┈ Dotted</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#475569' }}>Width</span>
            <select
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              style={{ width: '110px', padding: '1px', fontSize: '11px', border: '1px solid #cbd5e1' }}
            >
              <option value="1">1 (0.25mm)</option>
              <option value="2">2 (0.50mm)</option>
              <option value="3">3 (0.75mm)</option>
            </select>
          </div>
        </div>

        {/* Bottom Actions: Green Check, Red X, Help ? */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #cbd5e1', paddingTop: '6px' }}>
          <button
            type="button"
            onClick={handleApply}
            title="OK (Accept changes and close)"
            style={{ padding: '3px 12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '2px', cursor: 'pointer' }}
          >
            <Check size={14} color="#16a34a" strokeWidth={3} />
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Cancel"
            style={{ padding: '3px 12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '2px', cursor: 'pointer' }}
          >
            <X size={14} color="#dc2626" strokeWidth={3} />
          </button>
          <button
            type="button"
            onClick={() => alert('Arc Properties: Displays Argus CAM analytical properties for circle and arc entities.')}
            title="Help"
            style={{ padding: '3px 8px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '2px', cursor: 'pointer' }}
          >
            <HelpCircle size={14} color="#0284c7" />
          </button>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Image 5: Line Properties Dialog
// -------------------------------------------------------------
function LinePropertiesPalette({ entity, onClose, onUpdateEntity, promptText = 'Select entities to analyze', isMobile = false }) {
  const ud = entity.userData || {};

  const getPoints = () => {
    if (ud.p1 && ud.p2) return { p1: ud.p1, p2: ud.p2 };
    const pos = entity.geometry?.attributes?.position;
    if (pos && pos.count >= 2) {
      return {
        p1: { x: pos.getX(0), y: pos.getY(0), z: pos.getZ(0) },
        p2: { x: pos.getX(1), y: pos.getY(1), z: pos.getZ(1) }
      };
    }
    return { p1: { x: 17.413, y: -32.616, z: 0.0 }, p2: { x: 17.413, y: -98.628, z: 0.0 } };
  };

  const initialPts = getPoints();
  const [x1, setX1] = useState(Number(initialPts.p1.x).toFixed(3));
  const [y1, setY1] = useState(Number(initialPts.p1.y).toFixed(3));
  const [z1, setZ1] = useState(Number(initialPts.p1.z ?? 0).toFixed(3));
  const [x2, setX2] = useState(Number(initialPts.p2.x).toFixed(3));
  const [y2, setY2] = useState(Number(initialPts.p2.y).toFixed(3));
  const [z2, setZ2] = useState(Number(initialPts.p2.z ?? 0).toFixed(3));

  const [level, setLevel] = useState(ud.level || 1);
  const [colorIdx, setColorIdx] = useState(ud.colorIndex || 1);
  const [style, setStyle] = useState(ud.lineStyle || 'solid');
  const [width, setWidth] = useState(ud.lineWidth || '1');

  useEffect(() => {
    const pts = getPoints();
    setX1(Number(pts.p1.x).toFixed(3));
    setY1(Number(pts.p1.y).toFixed(3));
    setZ1(Number(pts.p1.z ?? 0).toFixed(3));
    setX2(Number(pts.p2.x).toFixed(3));
    setY2(Number(pts.p2.y).toFixed(3));
    setZ2(Number(pts.p2.z ?? 0).toFixed(3));
  }, [entity]);

  const p1x = parseFloat(x1) || 0;
  const p1y = parseFloat(y1) || 0;
  const p1z = parseFloat(z1) || 0;
  const p2x = parseFloat(x2) || 0;
  const p2y = parseFloat(y2) || 0;
  const p2z = parseFloat(z2) || 0;

  const dx = p2x - p1x;
  const dy = p2y - p1y;
  const dz = p2z - p1z;
  const len2D = Math.hypot(dx, dy);
  const len3D = Math.hypot(dx, dy, dz);
  const angleDeg = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;

  const handleApply = () => {
    if (onUpdateEntity) {
      onUpdateEntity(getCustomEntityId(entity), {
        p1: { x: p1x, y: p1y, z: p1z },
        p2: { x: p2x, y: p2y, z: p2z },
        level: parseInt(level, 10) || 1
      });
    }
    onClose();
  };

  const { pos, handleTitleMouseDown } = useDraggablePalette(isMobile ? 36 : 260, isMobile ? 84 : 192, 235);

  return (
    <div
      style={{
        position: 'fixed',
        top: `${pos.y}px`,
        left: `${pos.x}px`,
        zIndex: 1300,
        width: '235px',
        background: '#f1f5f9',
        border: '1px solid #94a3b8',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.28)',
        borderRadius: '2px',
        fontFamily: "'Segoe UI', Tahoma, sans-serif",
        fontSize: '11px',
        color: '#1e293b',
        userSelect: 'none'
      }}
    >
      {/* Floating Prompt Banner (Image 5) */}
      <div
        style={{
          position: 'absolute',
          top: '-26px',
          left: '0px',
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          padding: '2px 8px',
          fontSize: '11px',
          color: '#334155',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          whiteSpace: 'nowrap'
        }}
      >
        {promptText}
      </div>

      {/* Title Bar matching Image 5 */}
      <div
        onMouseDown={handleTitleMouseDown}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 8px',
          background: '#ffffff',
          borderBottom: '1px solid #cbd5e1',
          cursor: 'move'
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
          Line Properties
        </span>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '1px', color: '#64748b' }}
          title="Close (Esc)"
        >
          <X size={14} />
        </button>
      </div>

      <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {/* Row 1: Line Graphic with Green + and Red + */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '13px' }}>+</span>
          <div style={{ width: '80px', height: '2px', background: '#3b82f6', position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: '-3px', width: '2px', height: '8px', background: '#16a34a' }} />
            <div style={{ position: 'absolute', right: 0, top: '-3px', width: '2px', height: '8px', background: '#dc2626' }} />
          </div>
          <span style={{ color: '#dc2626', fontWeight: 700, fontSize: '13px' }}>+</span>
        </div>

        {/* Row 2: Endpoint 1 and Endpoint 2 Columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 20px 1fr', gap: '4px', alignItems: 'center' }}>
          {/* Endpoint 1 (+1) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <input
              type="text"
              value={x1}
              onChange={(e) => setX1(e.target.value)}
              style={{ width: '100%', padding: '1px 3px', background: '#fef08a', border: '1px solid #ca8a04', textAlign: 'right', fontWeight: 600 }}
            />
            <input
              type="text"
              value={y1}
              onChange={(e) => setY1(e.target.value)}
              style={{ width: '100%', padding: '1px 3px', background: '#fef08a', border: '1px solid #ca8a04', textAlign: 'right', fontWeight: 600 }}
            />
            <input
              type="text"
              value={z1}
              onChange={(e) => setZ1(e.target.value)}
              style={{ width: '100%', padding: '1px 3px', background: '#fef08a', border: '1px solid #ca8a04', textAlign: 'right', fontWeight: 600 }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', color: '#16a34a', fontWeight: 700, marginTop: '2px' }}>
              <span style={{ fontSize: '14px' }}>+</span>1
            </div>
          </div>

          {/* Labels X, Y, Z */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', textAlign: 'center', color: '#64748b', fontSize: '10px' }}>
            <div>X</div>
            <div>Y</div>
            <div>Z</div>
            <div>&nbsp;</div>
          </div>

          {/* Endpoint 2 (+2) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <input
              type="text"
              value={x2}
              onChange={(e) => setX2(e.target.value)}
              style={{ width: '100%', padding: '1px 3px', background: '#fef08a', border: '1px solid #ca8a04', textAlign: 'right', fontWeight: 600 }}
            />
            <input
              type="text"
              value={y2}
              onChange={(e) => setY2(e.target.value)}
              style={{ width: '100%', padding: '1px 3px', background: '#fef08a', border: '1px solid #ca8a04', textAlign: 'right', fontWeight: 600 }}
            />
            <input
              type="text"
              value={z2}
              onChange={(e) => setZ2(e.target.value)}
              style={{ width: '100%', padding: '1px 3px', background: '#fef08a', border: '1px solid #ca8a04', textAlign: 'right', fontWeight: 600 }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', color: '#dc2626', fontWeight: 700, marginTop: '2px' }}>
              <span style={{ fontSize: '14px' }}>+</span>2
            </div>
          </div>
        </div>

        {/* Row 3: Angle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '12px', color: '#0284c7' }}>∠</span>
          </div>
          <input
            type="text"
            readOnly
            value={angleDeg.toFixed(1)}
            style={{ flex: 1, padding: '2px 4px', background: '#fef08a', border: '1px solid #ca8a04', textAlign: 'right', fontWeight: 600 }}
          />
        </div>

        {/* Row 4: 3D Length */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '10px', color: '#64748b' }}>
            3D ➔
          </div>
          <input
            type="text"
            readOnly
            value={len3D.toFixed(3)}
            style={{ flex: 1, padding: '2px 4px', background: '#fef08a', border: '1px solid #ca8a04', textAlign: 'right', fontWeight: 600 }}
          />
        </div>

        {/* Row 5: 2D Length */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '10px', color: '#64748b' }}>
            2D ➔
          </div>
          <input
            type="text"
            readOnly
            value={len2D.toFixed(3)}
            style={{ flex: 1, padding: '2px 4px', background: '#e0f2fe', border: '1px solid #7dd3fc', textAlign: 'right', fontWeight: 600 }}
          />
        </div>

        {/* Row 6: Delta X, Delta Y, Delta Z */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', borderTop: '1px solid #cbd5e1', paddingTop: '4px' }}>
          <div>
            <div style={{ fontSize: '10px', color: '#64748b', textAlign: 'center' }}>ΔX</div>
            <input
              type="text"
              readOnly
              value={Math.abs(dx).toFixed(3)}
              style={{ width: '100%', padding: '1px', background: '#e0f2fe', border: '1px solid #7dd3fc', textAlign: 'right' }}
            />
          </div>
          <div>
            <div style={{ fontSize: '10px', color: '#64748b', textAlign: 'center' }}>ΔY</div>
            <input
              type="text"
              readOnly
              value={Math.abs(dy).toFixed(3)}
              style={{ width: '100%', padding: '1px', background: '#e0f2fe', border: '1px solid #7dd3fc', textAlign: 'right' }}
            />
          </div>
          <div>
            <div style={{ fontSize: '10px', color: '#64748b', textAlign: 'center' }}>ΔZ</div>
            <input
              type="text"
              readOnly
              value={Math.abs(dz).toFixed(3)}
              style={{ width: '100%', padding: '1px', background: '#e0f2fe', border: '1px solid #7dd3fc', textAlign: 'right' }}
            />
          </div>
        </div>

        {/* Row 7: Level & Color */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderTop: '1px solid #cbd5e1', paddingTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flex: 1 }}>
            <div style={{ width: '16px', height: '16px', border: '1px solid #94a3b8', background: '#fef08a', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              <div style={{ background: '#ef4444' }} />
              <div style={{ background: '#3b82f6' }} />
              <div style={{ background: '#22c55e' }} />
              <div style={{ background: '#eab308' }} />
            </div>
            <input
              type="text"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              style={{ width: '100%', padding: '1px 3px', background: '#fef08a', border: '1px solid #ca8a04', textAlign: 'center' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flex: 1 }}>
            <div style={{ width: '16px', height: '16px', border: '1px solid #94a3b8', background: '#3b82f6' }} />
            <input
              type="text"
              value={colorIdx}
              onChange={(e) => setColorIdx(e.target.value)}
              style={{ width: '100%', padding: '1px 3px', background: '#ffffff', border: '1px solid #cbd5e1', textAlign: 'center' }}
            />
          </div>
        </div>

        {/* Style & Width */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#475569' }}>Style</span>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              style={{ width: '110px', padding: '1px', fontSize: '11px', border: '1px solid #cbd5e1' }}
            >
              <option value="solid">━━━━ Solid</option>
              <option value="dashed">╍ ╍ ╍ Dashed</option>
              <option value="dotted">┈┈┈ Dotted</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#475569' }}>Width</span>
            <select
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              style={{ width: '110px', padding: '1px', fontSize: '11px', border: '1px solid #cbd5e1' }}
            >
              <option value="1">1 (0.25mm)</option>
              <option value="2">2 (0.50mm)</option>
              <option value="3">3 (0.75mm)</option>
            </select>
          </div>
        </div>

        {/* Bottom Actions: Green Check, Red X, Help ? */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #cbd5e1', paddingTop: '6px' }}>
          <button
            type="button"
            onClick={handleApply}
            title="OK (Accept changes and close)"
            style={{ padding: '3px 12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '2px', cursor: 'pointer' }}
          >
            <Check size={14} color="#16a34a" strokeWidth={3} />
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Cancel"
            style={{ padding: '3px 12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '2px', cursor: 'pointer' }}
          >
            <X size={14} color="#dc2626" strokeWidth={3} />
          </button>
          <button
            type="button"
            onClick={() => alert('Line Properties: Displays Argus CAM coordinates and endpoint vector properties for line entities.')}
            title="Help"
            style={{ padding: '3px 8px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '2px', cursor: 'pointer' }}
          >
            <HelpCircle size={14} color="#0284c7" />
          </button>
        </div>
      </div>
    </div>
  );
}
