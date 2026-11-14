import React, { useState } from 'react';
import {
  HelpCircle, Check, Plus, X, ChevronDown, ChevronRight
} from 'lucide-react';

/**
 * Mastercam Docked Drafting Manager Panel (Image 1 replica)
 * Docks directly into the left manager pane (OperationsTree).
 */
export default function DraftingPanel({
  onApply,
  onCancel,
  onChangeDimensionMode,
  activeMode = 'horizontal'
}) {
  const [activeSubTab, setActiveSubTab] = useState('Basic'); // 'Basic' | 'Advanced'

  // Entity Method (Image 1)
  const [entityMethod, setEntityMethod] = useState(activeMode || 'horizontal'); // 'auto' | 'horizontal' | 'vertical' | 'parallel'
  const [orientationAngle, setOrientationAngle] = useState(0.0);
  const [maintainPerpendicular, setMaintainPerpendicular] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Arc Symbol (Image 1)
  const [arcSymbol, setArcSymbol] = useState('radius'); // 'radius' | 'diameter'
  const [applyToLinear, setApplyToLinear] = useState(false);

  // Witness Lines (Image 1)
  const [showWitnessLines, setShowWitnessLines] = useState(true);
  const [witnessSide, setWitnessSide] = useState('both'); // 'both' | 'right' | 'left'

  // Leaders (Image 1)
  const [arrowsPosition, setArrowsPosition] = useState('inside'); // 'inside' | 'outside'

  // Foldable sections
  const [isEntityOpen, setIsEntityOpen] = useState(true);
  const [isArcOpen, setIsArcOpen] = useState(true);
  const [isWitnessOpen, setIsWitnessOpen] = useState(true);
  const [isLeadersOpen, setIsLeadersOpen] = useState(true);

  const handleMethodChange = (m) => {
    setEntityMethod(m);
    if (onChangeDimensionMode) {
      onChangeDimensionMode(m);
    }
  };

  const handleApply = (stayOpen = false) => {
    if (onApply) {
      onApply({
        method: entityMethod,
        orientationAngle,
        maintainPerpendicular,
        isLocked,
        arcSymbol,
        applyToLinear,
        showWitnessLines,
        witnessSide,
        arrowsPosition,
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
      {/* 1. Header Bar matching Image 1 */}
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
          Drafting
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => alert('Drafting Tool: Creates associative 2D/3D linear, angular, and radial dimensions.')}
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

      {/* 2. Sub Tabs (Basic / Advanced) matching Image 1 */}
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
        
        {/* Section: Entity (Matching Image 1) */}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: '#475569', fontWeight: 600 }}>Method:</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', marginLeft: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="draftingMethod"
                      checked={entityMethod === 'auto'}
                      onChange={() => handleMethodChange('auto')}
                    />
                    <span>Auto</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="draftingMethod"
                      checked={entityMethod === 'horizontal'}
                      onChange={() => handleMethodChange('horizontal')}
                    />
                    <span>Horizontal</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="draftingMethod"
                      checked={entityMethod === 'vertical'}
                      onChange={() => handleMethodChange('vertical')}
                    />
                    <span>Vertical</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="draftingMethod"
                      checked={entityMethod === 'parallel'}
                      onChange={() => handleMethodChange('parallel')}
                    />
                    <span>Parallel</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ color: '#475569' }}>Orientation angle:</span>
                <select
                  value={orientationAngle}
                  onChange={(e) => setOrientationAngle(parseFloat(e.target.value) || 0)}
                  style={{ width: '90px', padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }}
                >
                  <option value="0.0">0.0°</option>
                  <option value="45.0">45.0°</option>
                  <option value="90.0">90.0°</option>
                  <option value="180.0">180.0°</option>
                </select>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', marginTop: '2px' }}>
                <input
                  type="checkbox"
                  checked={maintainPerpendicular}
                  onChange={(e) => setMaintainPerpendicular(e.target.checked)}
                />
                <span>Maintain perpendicular to arc center</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isLocked}
                  onChange={(e) => setIsLocked(e.target.checked)}
                />
                <span>Lock</span>
              </label>
            </div>
          )}
        </div>

        {/* Section: Arc Symbol (Matching Image 1) */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '3px' }}>
          <div
            onClick={() => setIsArcOpen(!isArcOpen)}
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
            <span>Arc Symbol</span>
            {isArcOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </div>
          {isArcOpen && (
            <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="draftingArcSym"
                    checked={arcSymbol === 'radius'}
                    onChange={() => setArcSymbol('radius')}
                  />
                  <span>Radius</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="draftingArcSym"
                    checked={arcSymbol === 'diameter'}
                    onChange={() => setArcSymbol('diameter')}
                  />
                  <span>Diameter</span>
                </label>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', marginTop: '2px' }}>
                <input
                  type="checkbox"
                  checked={applyToLinear}
                  onChange={(e) => setApplyToLinear(e.target.checked)}
                />
                <span>Apply to linear dimension</span>
              </label>
            </div>
          )}
        </div>

        {/* Section: Witness Lines (Matching Image 1) */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '3px' }}>
          <div
            onClick={() => setIsWitnessOpen(!isWitnessOpen)}
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
                checked={showWitnessLines}
                onChange={(e) => setShowWitnessLines(e.target.checked)}
                onClick={(e) => e.stopPropagation()}
              />
              <span>Witness lines</span>
            </div>
            {isWitnessOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </div>
          {isWitnessOpen && showWitnessLines && (
            <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="witnessSide"
                  checked={witnessSide === 'both'}
                  onChange={() => setWitnessSide('both')}
                />
                <span>Both</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="witnessSide"
                  checked={witnessSide === 'right'}
                  onChange={() => setWitnessSide('right')}
                />
                <span>Right</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="witnessSide"
                  checked={witnessSide === 'left'}
                  onChange={() => setWitnessSide('left')}
                />
                <span>Left</span>
              </label>
            </div>
          )}
        </div>

        {/* Section: Leaders (Matching Image 1) */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '3px' }}>
          <div
            onClick={() => setIsLeadersOpen(!isLeadersOpen)}
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
            <span>Leaders</span>
            {isLeadersOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </div>
          {isLeadersOpen && (
            <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ color: '#475569' }}>Arrows:</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="arrowsPosition"
                  checked={arrowsPosition === 'inside'}
                  onChange={() => setArrowsPosition('inside')}
                />
                <span>Inside</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="arrowsPosition"
                  checked={arrowsPosition === 'outside'}
                  onChange={() => setArrowsPosition('outside')}
                />
                <span>Outside</span>
              </label>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
