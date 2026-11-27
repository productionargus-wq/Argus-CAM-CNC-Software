import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Activity, Compass, Layers, ShieldCheck, Zap, Info } from 'lucide-react';

export default function MultiaxisPortModal({
  isOpen,
  onClose,
  operation = null,
  tools = [],
  activeMachine = null,
  currentModel = null,
  onSaveOperation,
  onNotify
}) {
  if (!isOpen) return null;

  const [activePage, setActivePage] = useState('toolpath_type');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, posX: 0, posY: 0 });

  const [formState, setFormState] = useState(() => ({
    name: operation?.name || '5-Axis Port Expert (Cylinder Head Runners)',
    strategyKey: '5axis_port',
    portGeometry: {
      runnerType: 'intake',
      spineCurveSelection: 'central_axis_spine',
      cutMode: 'top_bottom_blend',
      blendOverlapMm: 2.0
    },
    tool: {
      diameter: 12.0,
      type: 'lollipop',
      neckDiameter: 6.0,
      spindleSpeed: 12000,
      feedRate: 2500
    },
    cutParameters: {
      axialStepoverMm: 1.0,
      stockToLeave: 0.2
    }
  }));

  const handleMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select')) return;
    setIsDragging(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, posX: position.x, posY: position.y };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPosition({ x: dragRef.current.posX + dx, y: Math.max(-200, dragRef.current.posY + dy) });
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

  const handleSave = () => {
    onSaveOperation?.({
      ...formState,
      id: operation?.id,
      badge: '5X-PORT',
      badgeClass: '5axis_port',
      badgeText: '5X-PORT',
      color: '#8b5cf6'
    });
    onClose?.();
  };

  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(2px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px' }}>
      <div className="modal-window" style={{ width: 'min(880px, calc(100vw - 12px))', maxWidth: 'calc(100vw - 12px)', height: 'min(600px, calc(100dvh - 12px))', maxHeight: 'calc(100dvh - 12px)', backgroundColor: '#f1f5f9', border: '1px solid #94a3b8', borderRadius: '6px', boxShadow: '0 20px 40px rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column', overflow: 'hidden', transform: `translate(${position.x}px, ${position.y}px)` }}>
        {/* Header */}
        <div className="modal-header" onMouseDown={handleMouseDown} style={{ height: '36px', flexShrink: 0, backgroundColor: '#1e293b', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', cursor: 'grab' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={17} color="#8b5cf6" />
            <strong style={{ fontSize: '13px' }}>Argus CAM Intelligence 5-Axis Port Expert Studio</strong>
            <span style={{ fontSize: '10px', backgroundColor: '#8b5cf6', color: '#fff', padding: '1px 6px', borderRadius: '3px', fontWeight: 700 }}>PORT EXPERT</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}><X size={16} /></button>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <div style={{ width: '220px', backgroundColor: '#e2e8f0', borderRight: '1px solid #cbd5e1', padding: '8px 0', fontSize: '11.5px' }}>
            {['Toolpath Type', 'Port Geometry & Spine', 'Tool (Lollipop / Spherical)', 'Cut Parameters', 'Linking & Collisions'].map((t, i) => (
              <div key={t} style={{ padding: '8px 12px', backgroundColor: i === 0 ? '#ffffff' : 'transparent', fontWeight: i === 0 ? 600 : 400, borderLeft: i === 0 ? '3px solid #8b5cf6' : '3px solid transparent' }}>{t}</div>
            ))}
          </div>

          <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto' }}>
            <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px 14px', backgroundColor: '#ffffff', marginBottom: '14px' }}>
              <legend style={{ padding: '0 4px', color: '#334155', fontWeight: 600, fontSize: '11.5px' }}>Port Machining Configuration</legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontSize: '11px' }}>Runner Type</label>
                  <select value={formState.portGeometry.runnerType} onChange={(e) => setFormState({ ...formState, portGeometry: { ...formState.portGeometry, runnerType: e.target.value } })} style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}>
                    <option value="intake">Intake Port (High Flow)</option>
                    <option value="exhaust">Exhaust Port (Thermal)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontSize: '11px' }}>Cutting Sequence</label>
                  <select value={formState.portGeometry.cutMode} onChange={(e) => setFormState({ ...formState, portGeometry: { ...formState.portGeometry, cutMode: e.target.value } })} style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}>
                    <option value="top_bottom_blend">Cut from Top and Bottom (Midpoint Overlap)</option>
                    <option value="top_only">Top Entry Only</option>
                    <option value="bottom_only">Bottom Entry Only</option>
                  </select>
                </div>
              </div>
            </fieldset>

            <div style={{ padding: '12px', backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '4px', color: '#5b21b6', fontSize: '11.5px', lineHeight: '1.5' }}>
              <strong>Argus CAM Intelligence Port Expert Features:</strong>
              <br />
              Eliminates manual tool axis vector programming in deep tubular cavities using spherical lollipop cutters. The tool automatically tilts tracking the internal spine curve while preventing shank gouging against cavity walls.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ height: '44px', backgroundColor: '#ffffff', borderTop: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 14px', gap: '8px' }}>
          <button onClick={onClose} style={{ padding: '5px 12px', fontSize: '11px', border: '1px solid #cbd5e1', backgroundColor: '#fff', borderRadius: '3px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} style={{ padding: '5px 14px', fontSize: '11px', fontWeight: 600, border: '1px solid #7c3aed', backgroundColor: '#8b5cf6', color: '#fff', borderRadius: '3px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Check size={14} /> OK / Generate Toolpath
          </button>
        </div>
      </div>
    </div>
  );
}
