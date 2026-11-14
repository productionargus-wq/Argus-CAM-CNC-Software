import React, { useState } from 'react';
import {
  HelpCircle, Check, Plus, X, ChevronDown, ChevronRight,
  RotateCw, RefreshCw
} from 'lucide-react';

/**
 * Mastercam Docked Rotate Manager Panel (Image 2 replica)
 * Docks directly into the left manager pane (OperationsTree).
 */
export default function RotatePanel({
  onApply,
  onCancel,
  onChangePreview,
  onReselectEntities,
  onReselectCenterPoint
}) {
  const [activeSubTab, setActiveSubTab] = useState('Basic'); // 'Basic' | 'Advanced'
  
  // Entity Method
  const [method, setMethod] = useState('copy'); // 'copy' | 'move' | 'join'
  
  // Center Point
  const [centerX, setCenterX] = useState(0.0);
  const [centerY, setCenterY] = useState(0.0);
  const [centerZ, setCenterZ] = useState(0.0);

  // Instances & Angle
  const [instances, setInstances] = useState(1);
  const [angle, setAngle] = useState(90.0);
  const [distanceMode, setDistanceMode] = useState('between'); // 'between' | 'sweep'
  const [instanceMethod, setInstanceMethod] = useState('rotate'); // 'rotate' | 'translate'

  // Foldable sections
  const [isEntityOpen, setIsEntityOpen] = useState(true);
  const [isSelectionOpen, setIsSelectionOpen] = useState(true);
  const [isCenterOpen, setIsCenterOpen] = useState(true);
  const [isInstancesOpen, setIsInstancesOpen] = useState(true);
  const [isCircleStartOpen, setIsCircleStartOpen] = useState(false);

  // Trigger preview update
  const handleAngleChange = (newAngle) => {
    setAngle(newAngle);
    if (onChangePreview) {
      onChangePreview({
        type: 'rotate',
        angle: parseFloat(newAngle) || 0,
        center: { x: centerX, y: centerY, z: centerZ },
        instances,
        method
      });
    }
  };

  const handleApply = (stayOpen = false) => {
    if (onApply) {
      onApply({
        type: 'rotate',
        angle: parseFloat(angle) || 0,
        center: { x: centerX, y: centerY, z: centerZ },
        instances,
        method,
        stayOpen
      });
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#ffffff',
        fontFamily: "'Segoe UI', Tahoma, sans-serif",
        fontSize: '11.5px',
        color: '#1e293b'
      }}
    >
      {/* 1. Header Bar matching Image 2 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px',
          background: '#f1f5f9',
          borderBottom: '1px solid #cbd5e1'
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
          Rotate
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => alert('Rotate Tool: Rotates geometry about selected center pivot point.')}
            title="Help (?)"
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: '#0284c7',
              border: 'none',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <HelpCircle size={14} />
          </button>
          {/* Apply & Stay (Check with Plus) */}
          <button
            onClick={() => handleApply(true)}
            title="Apply & Stay (Ctrl+Enter)"
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: '#0284c7',
              border: 'none',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Check size={11} strokeWidth={3} />
              <Plus size={8} strokeWidth={3} style={{ marginLeft: '-1px' }} />
            </div>
          </button>
          {/* OK & Execute (Green check) */}
          <button
            onClick={() => handleApply(false)}
            title="OK & Execute (Enter)"
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: '#16a34a',
              border: 'none',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Check size={13} strokeWidth={3} />
          </button>
          {/* Cancel (Red Cross) */}
          <button
            onClick={onCancel}
            title="Cancel (Esc)"
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: '#dc2626',
              border: 'none',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={13} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* 2. Sub Tabs (Basic / Advanced) matching Image 2 */}
      <div
        style={{
          display: 'flex',
          background: '#0f172a',
          padding: '2px 8px 0 8px'
        }}
      >
        <button
          onClick={() => setActiveSubTab('Basic')}
          style={{
            padding: '4px 12px',
            background: activeSubTab === 'Basic' ? '#ffffff' : 'transparent',
            color: activeSubTab === 'Basic' ? '#0f172a' : '#94a3b8',
            border: 'none',
            borderTopLeftRadius: '3px',
            borderTopRightRadius: '3px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Basic
        </button>
        <button
          onClick={() => setActiveSubTab('Advanced')}
          style={{
            padding: '4px 12px',
            background: activeSubTab === 'Advanced' ? '#ffffff' : 'transparent',
            color: activeSubTab === 'Advanced' ? '#0f172a' : '#94a3b8',
            border: 'none',
            borderTopLeftRadius: '3px',
            borderTopRightRadius: '3px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Advanced
        </button>
      </div>

      {/* 3. Panel Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        
        {/* Section: Entity */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '3px' }}>
          <div
            onClick={() => setIsEntityOpen(!isEntityOpen)}
            style={{
              padding: '4px 8px',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '11px'
            }}
          >
            <span>Entity</span>
            {isEntityOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </div>
          {isEntityOpen && (
            <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ color: '#475569', minWidth: '46px' }}>Method:</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="rotMethod"
                    checked={method === 'copy'}
                    onChange={() => setMethod('copy')}
                  />
                  <span>Copy</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="rotMethod"
                    checked={method === 'move'}
                    onChange={() => setMethod('move')}
                  />
                  <span>Move</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="rotMethod"
                    checked={method === 'join'}
                    onChange={() => setMethod('join')}
                  />
                  <span>Join</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Section: Selection */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '3px' }}>
          <div
            onClick={() => setIsSelectionOpen(!isSelectionOpen)}
            style={{
              padding: '4px 8px',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '11px'
            }}
          >
            <span>Selection</span>
            {isSelectionOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </div>
          {isSelectionOpen && (
            <div style={{ padding: '8px 10px' }}>
              <button
                type="button"
                onClick={onReselectEntities}
                style={{
                  width: '100%',
                  padding: '4px 8px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  fontSize: '11px'
                }}
              >
                Reselect
              </button>
            </div>
          )}
        </div>

        {/* Section: Rotation Center Point */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '3px' }}>
          <div
            onClick={() => setIsCenterOpen(!isCenterOpen)}
            style={{
              padding: '4px 8px',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '11px'
            }}
          >
            <span>Rotation Center Point</span>
            {isCenterOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </div>
          {isCenterOpen && (
            <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                type="button"
                onClick={onReselectCenterPoint}
                style={{
                  width: '100%',
                  padding: '4px 8px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  fontSize: '11px'
                }}
              >
                Reselect
              </button>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                <div>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>X:</span>
                  <input
                    type="number"
                    value={centerX}
                    onChange={(e) => setCenterX(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>Y:</span>
                  <input
                    type="number"
                    value={centerY}
                    onChange={(e) => setCenterY(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>Z:</span>
                  <input
                    type="number"
                    value={centerZ}
                    onChange={(e) => setCenterZ(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section: Instances & Angle (Matching Image 2) */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '3px' }}>
          <div
            onClick={() => setIsInstancesOpen(!isInstancesOpen)}
            style={{
              padding: '4px 8px',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '11px'
            }}
          >
            <span>Instances</span>
            {isInstancesOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </div>
          {isInstancesOpen && (
            <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#475569' }}>Number:</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={instances}
                  onChange={(e) => setInstances(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{ width: '80px', padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1', borderRadius: '2px' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#475569' }}>Angle:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="number"
                    step="0.1"
                    value={angle}
                    onChange={(e) => handleAngleChange(e.target.value)}
                    style={{ width: '80px', padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1', borderRadius: '2px' }}
                  />
                  <select
                    onChange={(e) => handleAngleChange(e.target.value)}
                    value={angle}
                    style={{ padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1', background: '#f8fafc' }}
                  >
                    <option value="45.0">45°</option>
                    <option value="90.0">90°</option>
                    <option value="180.0">180°</option>
                    <option value="270.0">270°</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '2px' }}>
                <span style={{ color: '#475569' }}>Distance:</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="rotDistanceMode"
                    checked={distanceMode === 'between'}
                    onChange={() => setDistanceMode('between')}
                  />
                  <span>Angle between</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="rotDistanceMode"
                    checked={distanceMode === 'sweep'}
                    onChange={() => setDistanceMode('sweep')}
                  />
                  <span>Total sweep</span>
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ color: '#475569' }}>Method:</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="rotInstMethod"
                    checked={instanceMethod === 'rotate'}
                    onChange={() => setInstanceMethod('rotate')}
                  />
                  <span>Rotate</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="rotInstMethod"
                    checked={instanceMethod === 'translate'}
                    onChange={() => setInstanceMethod('translate')}
                  />
                  <span>Translate</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => handleAngleChange(0)}
                  style={{
                    flex: 1,
                    padding: '3px 6px',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '2px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Section: Circle Start Position (Foldable) */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '3px' }}>
          <div
            onClick={() => setIsCircleStartOpen(!isCircleStartOpen)}
            style={{
              padding: '4px 8px',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '11px'
            }}
          >
            <span>Circle Start Position</span>
            {isCircleStartOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </div>
          {isCircleStartOpen && (
            <div style={{ padding: '8px 10px', fontSize: '11px', color: '#64748b' }}>
              Angle relative to current construction plane X-axis.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
