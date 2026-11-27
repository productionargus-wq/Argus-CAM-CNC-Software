import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Activity, Compass, Layers, ShieldCheck, Zap, Info } from 'lucide-react';

export default function MultiaxisBladeModal({
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
    name: operation?.name || '5-Axis Blade Expert (Impeller / Blisk)',
    strategyKey: '5axis_blade',
    bladeGeometry: {
      componentType: 'impeller',
      bladeCount: 12,
      splittersCount: 0,
      machiningPass: 'blade_flank_finish'
    },
    tool: {
      diameter: 8.0,
      type: 'tapered_ball',
      taperAngleDeg: 3.0,
      spindleSpeed: 14000,
      feedRate: 3200
    },
    cutParameters: {
      hubStock: 0.1,
      shroudStock: 0.1,
      bladeStock: 0.0
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
      badge: '5X-BLADE',
      badgeClass: '5axis_blade',
      badgeText: '5X-BLADE',
      color: '#0284c7'
    });
    onClose?.();
  };

  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(2px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px' }}>
      <div className="modal-window" style={{ width: 'min(880px, calc(100vw - 12px))', maxWidth: 'calc(100vw - 12px)', height: 'min(600px, calc(100dvh - 12px))', maxHeight: 'calc(100dvh - 12px)', backgroundColor: '#f1f5f9', border: '1px solid #94a3b8', borderRadius: '6px', boxShadow: '0 20px 40px rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column', overflow: 'hidden', transform: `translate(${position.x}px, ${position.y}px)` }}>
        {/* Header */}
        <div className="modal-header" onMouseDown={handleMouseDown} style={{ height: '36px', flexShrink: 0, backgroundColor: '#1e293b', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', cursor: 'grab' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={17} color="#0284c7" />
            <strong style={{ fontSize: '13px' }}>Argus CAM Intelligence 5-Axis Blade Expert Studio</strong>
            <span style={{ fontSize: '10px', backgroundColor: '#0284c7', color: '#fff', padding: '1px 6px', borderRadius: '3px', fontWeight: 700 }}>BLADE EXPERT</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}><X size={16} /></button>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <div style={{ width: '220px', backgroundColor: '#e2e8f0', borderRight: '1px solid #cbd5e1', padding: '8px 0', fontSize: '11.5px' }}>
            {['Toolpath Type', 'Impeller Geometry & Hub', 'Tool (Tapered Ball)', 'Cut Parameters', 'Linking & Collisions'].map((t, i) => (
              <div key={t} style={{ padding: '8px 12px', backgroundColor: i === 0 ? '#ffffff' : 'transparent', fontWeight: i === 0 ? 600 : 400, borderLeft: i === 0 ? '3px solid #0284c7' : '3px solid transparent' }}>{t}</div>
            ))}
          </div>

          <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto' }}>
            <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px 14px', backgroundColor: '#ffffff', marginBottom: '14px' }}>
              <legend style={{ padding: '0 4px', color: '#334155', fontWeight: 600, fontSize: '11.5px' }}>Blade &amp; Blisk Definition</legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontSize: '11px' }}>Part Type</label>
                  <select value={formState.bladeGeometry.componentType} onChange={(e) => setFormState({ ...formState, bladeGeometry: { ...formState.bladeGeometry, componentType: e.target.value } })} style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}>
                    <option value="impeller">Centrifugal Impeller</option>
                    <option value="blisk">Integrally Bladed Disk (Blisk)</option>
                    <option value="turbine">Axial Turbine Wheel</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontSize: '11px' }}>Operation Phase</label>
                  <select value={formState.bladeGeometry.machiningPass} onChange={(e) => setFormState({ ...formState, bladeGeometry: { ...formState.bladeGeometry, machiningPass: e.target.value } })} style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '3px' }}>
                    <option value="blade_flank_finish">Blade Flank Swarf Finish</option>
                    <option value="hub_surface_finish">Hub Surface Multiaxis Finish</option>
                    <option value="floor_roughing">Between Blade Channel Roughing</option>
                  </select>
                </div>
              </div>
            </fieldset>

            <div style={{ padding: '12px', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '4px', color: '#0369a1', fontSize: '11.5px', lineHeight: '1.5' }}>
              <strong>Argus CAM Intelligence Blade Expert Features:</strong>
              <br />
              Automates complex multiaxis toolpaths for impellers and bladed disks. Handles hub, shroud, main blades, and splitter blades with smooth 5-axis collision-free tool axis tilting.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ height: '44px', backgroundColor: '#ffffff', borderTop: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 14px', gap: '8px' }}>
          <button onClick={onClose} style={{ padding: '5px 12px', fontSize: '11px', border: '1px solid #cbd5e1', backgroundColor: '#fff', borderRadius: '3px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} style={{ padding: '5px 14px', fontSize: '11px', fontWeight: 600, border: '1px solid #0284c7', backgroundColor: '#0284c7', color: '#fff', borderRadius: '3px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Check size={14} /> OK / Generate Toolpath
          </button>
        </div>
      </div>
    </div>
  );
}
