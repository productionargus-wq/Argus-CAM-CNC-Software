import React from 'react';
import { Check, HelpCircle, X } from 'lucide-react';

const SELECTION_METHODS = [
  {
    id: 'chain',
    label: 'Chain',
    title: 'Chain: Select contiguous wireframe entities into a loop',
    renderIcon: () => (
      <svg width="24" height="16" viewBox="0 0 28 18" fill="none">
        <ellipse cx="9" cy="9" rx="6" ry="5" stroke="#c2410c" strokeWidth="1.8" />
        <ellipse cx="14" cy="9" rx="6" ry="5" stroke="#c2410c" strokeWidth="1.8" />
        <ellipse cx="19" cy="9" rx="6" ry="5" stroke="#ea580c" strokeWidth="1.8" />
      </svg>
    )
  },
  {
    id: 'point',
    label: 'Point',
    title: 'Point: Select seed point on entity',
    renderIcon: () => (
      <svg width="20" height="16" viewBox="0 0 24 18" fill="none">
        <path d="M9 2h6v5h5v4h-5v5H9v-5H4V7h5V2z" fill="#ea580c" stroke="#9a3412" strokeWidth="1.2" />
      </svg>
    )
  },
  {
    id: 'window',
    label: 'Window',
    title: 'Window: Select chains inside rectangular marquee',
    renderIcon: () => (
      <svg width="24" height="16" viewBox="0 0 28 18" fill="none">
        <rect x="3" y="3" width="22" height="12" stroke="#c2410c" strokeWidth="1.6" strokeDasharray="3 2" />
      </svg>
    )
  },
  {
    id: 'single',
    label: 'Single',
    title: 'Single: Select single line/arc/circle entity without branching',
    renderIcon: () => (
      <svg width="24" height="16" viewBox="0 0 28 18" fill="none">
        <rect x="4" y="3" width="20" height="12" fill="#e2e8f0" stroke="#475569" strokeWidth="1.2" />
        <line x1="14" y1="6" x2="14" y2="12" stroke="#1e293b" strokeWidth="1.5" />
        <line x1="11" y1="9" x2="17" y2="9" stroke="#1e293b" strokeWidth="1.5" />
      </svg>
    )
  },
  {
    id: 'polygon',
    label: 'Polygon',
    title: 'Polygon: Select chains by polygonal boundary',
    renderIcon: () => (
      <svg width="24" height="16" viewBox="0 0 28 18" fill="none">
        <line x1="5" y1="14" x2="23" y2="4" stroke="#ea580c" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'vector',
    label: 'Vector',
    title: 'Vector: Select entities crossed by a directional line',
    renderIcon: () => (
      <svg width="24" height="16" viewBox="0 0 28 18" fill="none">
        <polygon points="8,4 24,4 20,14 4,14" stroke="#c2410c" strokeWidth="1.5" strokeDasharray="2.5 1.5" fill="rgba(234,88,12,0.1)" />
      </svg>
    )
  },
  {
    id: 'partial',
    label: 'Partial',
    title: 'Partial: Select start and end entities along chain',
    renderIcon: () => (
      <svg width="24" height="16" viewBox="0 0 28 18" fill="none">
        <line x1="6" y1="9" x2="22" y2="9" stroke="#c2410c" strokeWidth="2.2" />
        <polygon points="4,9 9,5.5 9,12.5" fill="#ea580c" />
        <polygon points="24,9 19,5.5 19,12.5" fill="#ea580c" />
      </svg>
    )
  },
  {
    id: 'area',
    label: 'Area',
    title: 'Area: Select closed loop around picked interior region',
    renderIcon: () => (
      <svg width="24" height="16" viewBox="0 0 28 18" fill="none">
        <circle cx="11" cy="9" r="5" stroke="#c2410c" strokeWidth="1.6" />
        <circle cx="17" cy="9" r="5" stroke="#ea580c" strokeWidth="1.6" />
      </svg>
    )
  }
];

/**
 * Mastercam 2018-style Floating Non-Blocking Chaining Dialog
 * Allows live canvas selection of wireframe contours with Wireframe/Solids, C-plane/3D,
 * Reverse direction, and Inside/Wait controls.
 */
export default function ChainingPalette({
  isOpen,
  chainMode = 'wireframe',
  onChangeChainMode,
  planeMode = '3d',
  onChangePlaneMode,
  selectionMethod = 'chain',
  onChangeSelectionMethod,
  containmentSide = 'inside',
  onChangeContainmentSide,
  waitMode = false,
  onToggleWaitMode,
  selectedChains = [],
  onReverseChain,
  onUnselectLast,
  onUnselectAll,
  onAddAllClosedChains,
  onConfirm,
  onCancel,
  promptText = 'Select Chain of Lines and Arcs or one closed spline'
}) {
  if (!isOpen) return null;

  return (
    <div
      data-testid="chaining-palette"
      style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        zIndex: 60,
        width: '188px',
        backgroundColor: '#f3f4f6',
        border: '1px solid #9ca3af',
        borderRadius: '2px',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.22)',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: '11px',
        color: '#1e293b',
        userSelect: 'none'
      }}
    >
      {/* Window Title Bar */}
      <div
        style={{
          height: '26px',
          background: '#ffffff',
          borderBottom: '1px solid #d1d5db',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 6px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M5 17L17 5M17 5H9M17 5V13" stroke="#1e3a8a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontWeight: 500, fontSize: '11.5px', color: '#1e293b' }}>Chaining</span>
        </div>
        <button
          type="button"
          onClick={onCancel}
          title="Close Chaining (Esc)"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#475569',
            cursor: 'pointer',
            width: '18px',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0
          }}
        >
          <X size={13} strokeWidth={2.2} />
        </button>
      </div>

      {/* Live Mastercam Guidance Tooltip Banner (positioned just to the right edge) */}
      <div
        style={{
          position: 'absolute',
          top: '34px',
          left: '182px',
          background: '#ffffff',
          border: '1px solid #94a3b8',
          padding: '3px 8px',
          fontSize: '11px',
          color: '#0f172a',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
          pointerEvents: 'none'
        }}
      >
        {selectedChains.length > 0
          ? `${selectedChains.length} Chain(s) Selected — Click Green Check to Extrude`
          : selectionMethod === 'window'
            ? 'Drag L→R (Window) or R→L (Crossing) on canvas to select chains'
            : `${promptText} 1`}
      </div>

      {/* Body Controls */}
      <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
        {/* 1. Wireframe vs Solids Mode */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          <button
            type="button"
            onClick={() => onChangeChainMode?.('wireframe')}
            title="Wireframe Chaining"
            style={{
              height: '30px',
              background: chainMode === 'wireframe' ? '#e0f2fe' : '#e5e7eb',
              border: chainMode === 'wireframe' ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <svg width="20" height="18" viewBox="0 0 24 22" fill="none">
              <polygon points="12,2 21,6.5 21,15.5 12,20 3,15.5 3,6.5" stroke="#c2410c" strokeWidth="1.6" />
              <line x1="12" y1="2" x2="12" y2="20" stroke="#ea580c" strokeWidth="1.2" />
              <line x1="3" y1="6.5" x2="21" y2="6.5" stroke="#c2410c" strokeWidth="1.2" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => onChangeChainMode?.('solids')}
            title="Solid Face / Edge Chaining"
            style={{
              height: '30px',
              background: chainMode === 'solids' ? '#e0f2fe' : '#e5e7eb',
              border: chainMode === 'solids' ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <svg width="20" height="18" viewBox="0 0 24 22" fill="none">
              <polygon points="12,2 21,6.5 21,15.5 12,20 3,15.5 3,6.5" fill="#94a3b8" stroke="#475569" strokeWidth="1.4" />
              <polygon points="12,2 21,6.5 12,11 3,6.5" fill="#cbd5e1" />
            </svg>
          </button>
        </div>

        {/* 2. C-plane vs 3D Radio */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '1px 0' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '11px' }}>
            <input
              type="radio"
              name="chainingPlaneMode"
              checked={planeMode === 'cplane'}
              onChange={() => onChangePlaneMode?.('cplane')}
              style={{ margin: 0 }}
            />
            C-plane
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '11px' }}>
            <input
              type="radio"
              name="chainingPlaneMode"
              checked={planeMode === '3d'}
              onChange={() => onChangePlaneMode?.('3d')}
              style={{ margin: 0 }}
            />
            3D
          </label>
        </div>

        {/* 3. Selection Methods (2x4 Grid matching Image 1) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
          {SELECTION_METHODS.map((m) => {
            const isActive = selectionMethod === m.id;
            return (
              <button
                key={m.id}
                type="button"
                title={m.title}
                onClick={() => onChangeSelectionMethod?.(m.id)}
                style={{
                  height: '26px',
                  background: isActive ? '#e0f2fe' : '#e5e7eb',
                  border: isActive ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
                  borderRadius: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {m.renderIcon()}
              </button>
            );
          })}
        </div>

        {/* 4. Containment & Wait */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', paddingTop: '2px' }}>
          <select
            value={containmentSide}
            onChange={(e) => onChangeContainmentSide?.(e.target.value)}
            style={{
              flex: 1,
              height: '22px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '2px',
              fontSize: '11px',
              color: '#1e293b',
              padding: '0 4px'
            }}
          >
            <option value="inside">Inside</option>
            <option value="outside">Outside</option>
          </select>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '11px' }}>
            <input
              type="checkbox"
              checked={waitMode}
              onChange={(e) => onToggleWaitMode?.(e.target.checked)}
              style={{ margin: 0 }}
            />
            Wait
          </label>
        </div>

        <div style={{ height: '1px', background: '#cbd5e1', margin: '1px 0' }} />

        {/* 5. Chain Editing Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
          <button
            type="button"
            title="Select all wireframe chains automatically"
            onClick={onAddAllClosedChains}
            style={{
              height: '24px',
              background: '#e5e7eb',
              border: '1px solid #cbd5e1',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 14l-4-4 4-4" stroke="#1d4ed8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 10h10a4 4 0 0 1 0 8h-3" stroke="#1d4ed8" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>

          <button
            type="button"
            title="Add next chain (+)"
            onClick={onAddAllClosedChains}
            style={{
              height: '24px',
              background: '#e5e7eb',
              border: '1px solid #cbd5e1',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#1d4ed8">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v10M7 12h10" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </button>

          <button
            type="button"
            title="Unselect Last Chain"
            onClick={onUnselectLast}
            style={{
              height: '24px',
              background: '#e5e7eb',
              border: '1px solid #cbd5e1',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="8" stroke="#991b1b" strokeWidth="2.2" />
              <line x1="7" y1="17" x2="17" y2="7" stroke="#991b1b" strokeWidth="2.2" />
            </svg>
          </button>

          <button
            type="button"
            title="Unselect All Chains"
            onClick={onUnselectAll}
            style={{
              height: '24px',
              background: '#e5e7eb',
              border: '1px solid #cbd5e1',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <svg width="18" height="15" viewBox="0 0 26 20" fill="none">
              <circle cx="9" cy="10" r="6.5" stroke="#991b1b" strokeWidth="2" />
              <line x1="5" y1="14" x2="13" y2="6" stroke="#991b1b" strokeWidth="2" />
              <text x="17" y="14" fill="#0284c7" fontSize="13" fontWeight="900">*</text>
            </svg>
          </button>
        </div>

        {/* Reverse Direction Full-Width Button */}
        <button
          type="button"
          title="Reverse Chain Arrow Direction"
          onClick={onReverseChain}
          disabled={selectedChains.length === 0}
          style={{
            height: '24px',
            background: selectedChains.length > 0 ? '#e5e7eb' : '#f1f5f9',
            border: '1px solid #cbd5e1',
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: selectedChains.length > 0 ? 'pointer' : 'not-allowed',
            opacity: selectedChains.length > 0 ? 1 : 0.55
          }}
        >
          <svg width="24" height="14" viewBox="0 0 30 16" fill="none">
            <line x1="2" y1="8" x2="26" y2="8" stroke="#1e293b" strokeWidth="1.5" />
            <polygon points="10,4 16,8 10,12" fill="#ea580c" />
            <polygon points="22,4 28,8 22,12" fill="#0284c7" />
          </svg>
        </button>

        {/* Active Chain Readout */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '2px',
            padding: '4px 6px',
            fontSize: '10px',
            color: selectedChains.length > 0 ? '#0369a1' : '#64748b',
            fontWeight: selectedChains.length > 0 ? 600 : 400,
            minHeight: '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedChains.length > 0
              ? selectedChains.map((c) => c.name).join(', ')
              : 'Click contour on canvas...'}
          </span>
          {selectedChains.length > 0 && (
            <span style={{ marginLeft: '4px', background: '#e0f2fe', padding: '0 4px', borderRadius: '2px' }}>
              {selectedChains.length}
            </span>
          )}
        </div>

        {/* Bottom OK (Green Check) & Help (?) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', paddingTop: '2px' }}>
          <button
            type="button"
            data-testid="chaining-confirm-btn"
            onClick={onConfirm}
            title="OK: Accept selected chain(s)"
            style={{
              height: '26px',
              background: '#e5e7eb',
              border: '1.5px solid #0284c7',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Check size={17} strokeWidth={3} color="#16a34a" />
          </button>

          <button
            type="button"
            title="Help on Chaining"
            onClick={() => {}}
            style={{
              height: '26px',
              background: '#e5e7eb',
              border: '1px solid #cbd5e1',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <HelpCircle size={15} strokeWidth={2.3} color="#475569" />
          </button>
        </div>
      </div>
    </div>
  );
}
