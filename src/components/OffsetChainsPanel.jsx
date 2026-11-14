import React, { useState } from 'react';
import {
  HelpCircle, Check, Plus, X, ChevronDown, ChevronRight,
  Move, Link
} from 'lucide-react';

/**
 * Mastercam Docked Offset Chains Manager Panel (Images 4 & 5 replica)
 * Docks directly into the left manager pane (OperationsTree).
 */
export default function OffsetChainsPanel({
  onApply,
  onCancel,
  onChangePreview,
  onOpenChaining,
  onReselectChains
}) {
  const [activeSubTab, setActiveSubTab] = useState('Basic'); // 'Basic' | 'Advanced'
  
  // Instances
  const [instances, setInstances] = useState(1);
  const [distance, setDistance] = useState(10.0);
  const [depth, setDepth] = useState(0.0);
  const [angle, setAngle] = useState(0.0);
  const [styleMode, setStyleMode] = useState('incremental'); // 'incremental' | 'absolute'

  // Direction (Matching Image 4)
  const [direction, setDirection] = useState('opposite'); // 'defined' | 'opposite' | 'both'

  // Corner treatment
  const [modifyFillet, setModifyFillet] = useState(true);
  const [filletType, setFilletType] = useState('sharp'); // 'sharp' | 'all'

  // Infinite Look Ahead
  const [infiniteLookAhead, setInfiniteLookAhead] = useState(true);
  const [tolerance, setTolerance] = useState(0.02);

  // Foldable sections
  const [isSelectionOpen, setIsSelectionOpen] = useState(true);
  const [isInstancesOpen, setIsInstancesOpen] = useState(true);
  const [isDirectionOpen, setIsDirectionOpen] = useState(true);
  const [isCornersOpen, setIsCornersOpen] = useState(true);
  const [isLookAheadOpen, setIsLookAheadOpen] = useState(true);

  const handleDistanceChange = (val) => {
    const num = parseFloat(val) || 0;
    setDistance(num);
    if (onChangePreview) {
      onChangePreview({
        type: 'offset_chains',
        distance: num,
        direction,
        instances,
        depth,
        tolerance
      });
    }
  };

  const handleDirectionChange = (dir) => {
    setDirection(dir);
    if (onChangePreview) {
      onChangePreview({
        type: 'offset_chains',
        distance,
        direction: dir,
        instances,
        depth,
        tolerance
      });
    }
  };

  const handleApply = (stayOpen = false) => {
    if (onApply) {
      onApply({
        type: 'offset_chains',
        distance,
        direction,
        instances,
        depth,
        tolerance,
        modifyFillet,
        filletType,
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
      {/* 1. Header Bar matching Image 4 */}
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
          Offset Chains
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => alert('Offset Chains: Offsets connected tangent chains of curves or wireframe contours.')}
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

      {/* 2. Sub Tabs (Basic / Advanced) matching Image 4 */}
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
            <div style={{ padding: '8px 10px', display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={onReselectChains || onOpenChaining}
                style={{
                  flex: 1,
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
              <button
                type="button"
                onClick={onOpenChaining}
                title="Open Chaining Palette"
                style={{
                  padding: '4px 8px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px'
                }}
              >
                <Link size={12} color="#0284c7" />
                <span>Chains</span>
              </button>
            </div>
          )}
        </div>

        {/* Section: Instances (Matching Image 4) */}
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
            <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#475569' }}>Number:</span>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={instances}
                  onChange={(e) => setInstances(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{ width: '100px', padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1', borderRadius: '2px' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#0284c7', fontWeight: 600 }}>Distance:</span>
                <input
                  type="number"
                  step="0.5"
                  value={distance}
                  onChange={(e) => handleDistanceChange(e.target.value)}
                  style={{ width: '100px', padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1', borderRadius: '2px' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#475569' }}>Depth:</span>
                <input
                  type="number"
                  step="0.5"
                  value={depth}
                  onChange={(e) => setDepth(parseFloat(e.target.value) || 0)}
                  style={{ width: '100px', padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1', borderRadius: '2px' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#475569' }}>Angle:</span>
                <input
                  type="number"
                  step="0.5"
                  value={angle}
                  onChange={(e) => setAngle(parseFloat(e.target.value) || 0)}
                  style={{ width: '100px', padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1', borderRadius: '2px' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '2px' }}>
                <span style={{ color: '#475569' }}>Style:</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="offsetStyle"
                    checked={styleMode === 'incremental'}
                    onChange={() => setStyleMode('incremental')}
                  />
                  <span>Incremental</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="offsetStyle"
                    checked={styleMode === 'absolute'}
                    onChange={() => setStyleMode('absolute')}
                  />
                  <span>Absolute</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Section: Direction (Matching Image 4) */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '3px' }}>
          <div
            onClick={() => setIsDirectionOpen(!isDirectionOpen)}
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
            <span>Direction</span>
            {isDirectionOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </div>
          {isDirectionOpen && (
            <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="offsetDirection"
                  checked={direction === 'defined'}
                  onChange={() => handleDirectionChange('defined')}
                />
                <span>Defined side</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="offsetDirection"
                  checked={direction === 'opposite'}
                  onChange={() => handleDirectionChange('opposite')}
                />
                <span>Opposite side</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="offsetDirection"
                  checked={direction === 'both'}
                  onChange={() => handleDirectionChange('both')}
                />
                <span>Both sides</span>
              </label>
            </div>
          )}
        </div>

        {/* Section: Modify Fillet Corners (Matching Image 4) */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '3px' }}>
          <div
            onClick={() => setIsCornersOpen(!isCornersOpen)}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="checkbox"
                checked={modifyFillet}
                onChange={(e) => setModifyFillet(e.target.checked)}
                onClick={(e) => e.stopPropagation()}
              />
              <span>Modify Fillet Corners</span>
            </div>
            {isCornersOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </div>
          {isCornersOpen && modifyFillet && (
            <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="filletCornerType"
                  checked={filletType === 'sharp'}
                  onChange={() => setFilletType('sharp')}
                />
                <span>Sharp</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="filletCornerType"
                  checked={filletType === 'all'}
                  onChange={() => setFilletType('all')}
                />
                <span>All</span>
              </label>
            </div>
          )}
        </div>

        {/* Section: Infinite Look Ahead (Matching Image 4) */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '3px' }}>
          <div
            onClick={() => setIsLookAheadOpen(!isLookAheadOpen)}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="checkbox"
                checked={infiniteLookAhead}
                onChange={(e) => setInfiniteLookAhead(e.target.checked)}
                onClick={(e) => e.stopPropagation()}
              />
              <span>Infinite Look Ahead</span>
            </div>
            {isLookAheadOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </div>
          {isLookAheadOpen && infiniteLookAhead && (
            <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#475569' }}>Tolerance:</span>
              <input
                type="number"
                step="0.005"
                value={tolerance}
                onChange={(e) => setTolerance(parseFloat(e.target.value) || 0.02)}
                style={{ width: '100px', padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1', borderRadius: '2px' }}
              />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
