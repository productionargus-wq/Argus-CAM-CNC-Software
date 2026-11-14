import React, { useState } from 'react';
import {
  HelpCircle, Check, Plus, X, ChevronDown, ChevronRight,
  Move, RefreshCw
} from 'lucide-react';

/**
 * Mastercam Docked Translate Manager Panel (Image 3 replica)
 * Docks directly into the left manager pane (OperationsTree).
 */
export default function TranslatePanel({
  onApply,
  onCancel,
  onChangePreview,
  onReselectEntities,
  onReselectVector
}) {
  const [activeSubTab, setActiveSubTab] = useState('Basic'); // 'Basic' | 'Advanced'
  
  // Entity Method
  const [method, setMethod] = useState('copy'); // 'copy' | 'move' | 'join'

  // Instances
  const [instances, setInstances] = useState(1);
  const [distanceMode, setDistanceMode] = useState('between'); // 'between' | 'total'

  // Delta Coordinates (Matching Image 3)
  const [deltaX, setDeltaX] = useState(0.0);
  const [deltaY, setDeltaY] = useState(0.0);
  const [deltaZ, setDeltaZ] = useState(0.0);

  // Polar
  const [polarDistance, setPolarDistance] = useState(0.0);
  const [polarAngle, setPolarAngle] = useState(0.0);

  // Foldable sections
  const [isEntityOpen, setIsEntityOpen] = useState(true);
  const [isSelectionOpen, setIsSelectionOpen] = useState(true);
  const [isInstancesOpen, setIsInstancesOpen] = useState(true);
  const [isDeltaOpen, setIsDeltaOpen] = useState(true);
  const [isVectorOpen, setIsVectorOpen] = useState(true);
  const [isPolarOpen, setIsPolarOpen] = useState(false);

  const handleDeltaChange = (axis, val) => {
    const num = parseFloat(val) || 0;
    let nx = deltaX;
    let ny = deltaY;
    let nz = deltaZ;
    if (axis === 'x') { setDeltaX(num); nx = num; }
    if (axis === 'y') { setDeltaY(num); ny = num; }
    if (axis === 'z') { setDeltaZ(num); nz = num; }

    if (onChangePreview) {
      onChangePreview({
        type: 'translate',
        delta: { x: nx, y: ny, z: nz },
        instances,
        method
      });
    }
  };

  const handleApply = (stayOpen = false) => {
    if (onApply) {
      onApply({
        type: 'translate',
        delta: { x: deltaX, y: deltaY, z: deltaZ },
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
      {/* 1. Header Bar matching Image 3 */}
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
          Translate
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => alert('Translate Tool: Moves or copies geometry along a 3D delta vector.')}
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

      {/* 2. Sub Tabs (Basic / Advanced) matching Image 3 */}
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
                    name="transMethod"
                    checked={method === 'copy'}
                    onChange={() => setMethod('copy')}
                  />
                  <span>Copy</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="transMethod"
                    checked={method === 'move'}
                    onChange={() => setMethod('move')}
                  />
                  <span>Move</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="transMethod"
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

        {/* Section: Instances (Matching Image 3) */}
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ color: '#475569' }}>Distance:</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="transDistanceMode"
                    checked={distanceMode === 'between'}
                    onChange={() => setDistanceMode('between')}
                  />
                  <span>Between</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="transDistanceMode"
                    checked={distanceMode === 'total'}
                    onChange={() => setDistanceMode('total')}
                  />
                  <span>Total</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Section: Delta (Matching Image 3) */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '3px' }}>
          <div
            onClick={() => setIsDeltaOpen(!isDeltaOpen)}
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
            <span>Delta</span>
            {isDeltaOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </div>
          {isDeltaOpen && (
            <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#dc2626', fontWeight: 600 }}>X:</span>
                <input
                  type="number"
                  step="0.5"
                  value={deltaX}
                  onChange={(e) => handleDeltaChange('x', e.target.value)}
                  style={{ width: '140px', padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1', borderRadius: '2px' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#16a34a', fontWeight: 600 }}>Y:</span>
                <input
                  type="number"
                  step="0.5"
                  value={deltaY}
                  onChange={(e) => handleDeltaChange('y', e.target.value)}
                  style={{ width: '140px', padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1', borderRadius: '2px' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#0284c7', fontWeight: 600 }}>Z:</span>
                <input
                  type="number"
                  step="0.5"
                  value={deltaZ}
                  onChange={(e) => handleDeltaChange('z', e.target.value)}
                  style={{ width: '140px', padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1', borderRadius: '2px' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Section: Vector From/To */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '3px' }}>
          <div
            onClick={() => setIsVectorOpen(!isVectorOpen)}
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
            <span>Vector From/To</span>
            {isVectorOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </div>
          {isVectorOpen && (
            <div style={{ padding: '8px 10px' }}>
              <button
                type="button"
                onClick={onReselectVector}
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

        {/* Section: Polar (Foldable) */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '3px' }}>
          <div
            onClick={() => setIsPolarOpen(!isPolarOpen)}
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
            <span>Polar</span>
            {isPolarOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </div>
          {isPolarOpen && (
            <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#475569' }}>Distance:</span>
                <input
                  type="number"
                  value={polarDistance}
                  onChange={(e) => setPolarDistance(parseFloat(e.target.value) || 0)}
                  style={{ width: '120px', padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#475569' }}>Angle:</span>
                <input
                  type="number"
                  value={polarAngle}
                  onChange={(e) => setPolarAngle(parseFloat(e.target.value) || 0)}
                  style={{ width: '120px', padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
