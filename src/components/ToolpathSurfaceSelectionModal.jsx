import React, { useRef } from 'react';
import { Check, HelpCircle, X } from 'lucide-react';

function SelectCursorIcon({ disabled = false }) {
  return (
    <svg width="15" height="15" viewBox="0 0 18 18" fill="none" style={{ opacity: disabled ? 0.4 : 1 }}>
      <path d="M5 2.5L13.5 10.2L9.4 10.7L11.2 14.8L9.6 15.5L7.8 11.4L5 14V2.5Z" fill="#e2e8f0" stroke="#334155" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

function UnselectCursorIcon({ disabled = false }) {
  return (
    <svg width="16" height="15" viewBox="0 0 20 18" fill="none" style={{ opacity: disabled ? 0.4 : 1 }}>
      <path d="M4.5 2.5L11.5 9L8.2 9.5L9.7 13L8.3 13.6L6.8 10.1L4.5 12.2V2.5Z" fill="#e2e8f0" stroke="#334155" strokeWidth="1.1" strokeLinejoin="round" />
      <circle cx="14" cy="12" r="4" fill="#fee2e2" stroke="#dc2626" strokeWidth="1.3" />
      <line x1="11.5" y1="9.5" x2="16.5" y2="14.5" stroke="#dc2626" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function FlowlineButtonIcon({ disabled = false }) {
  return (
    <svg width="26" height="18" viewBox="0 0 28 20" fill="none" style={{ opacity: disabled ? 0.45 : 1 }}>
      <path d="M3 13 C 9 8, 17 16, 25 11" stroke="#2563eb" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M3 17 C 9 12, 17 20, 25 15" stroke="#38bdf8" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <path d="M6 6 H 20" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" />
      <polygon points="24,6 18.5,2.8 18.5,9.2" fill="#16a34a" />
    </svg>
  );
}

const MC_BTN = {
  height: '24px',
  background: 'linear-gradient(180deg, #f8fafc 0%, #e5e7eb 100%)',
  border: '1px solid #9ca3af',
  borderRadius: '2px',
  fontSize: '11.5px',
  color: '#0f172a',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxSizing: 'border-box',
  padding: '0 8px'
};

/**
 * Non-blocking Mastercam Toolpath/surface selection floating dialog (Drive / Check / Containment / Flowline).
 */
export default function ToolpathSurfaceSelectionModal({
  isOpen,
  mode = 'flowline',
  driveCount = 0,
  cadFileCount = 0,
  checkCount = 0,
  containmentCount = 0,
  activePickRole = null,
  onStartPick,
  onClearRole,
  onImportCadFile,
  onShowRole,
  onOpenFlowlineData,
  onConfirm,
  onCancel,
  onHelp
}) {
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const isFlowline = mode === 'flowline';

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onImportCadFile) {
      onImportCadFile(file);
    }
    e.target.value = '';
  };

  return (
    <div
      data-testid="toolpath-surface-selection-modal"
      style={{
        position: 'fixed',
        left: '12px',
        top: '132px',
        width: '214px',
        zIndex: 99960,
        background: '#f0f0f0',
        border: '1px solid #7f8c8d',
        boxShadow: '0 10px 28px rgba(15, 23, 42, 0.28)',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: '11.5px',
        color: '#0f172a',
        userSelect: 'none'
      }}
    >
      {/* Classic Title Bar */}
      <div
        style={{
          height: '28px',
          background: '#ffffff',
          borderBottom: '1px solid #d1d5db',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 8px 0 10px'
        }}
      >
        <span style={{ fontSize: '12px', color: '#111827', fontWeight: 500 }}>
          Toolpath/surface selection
        </span>
        <button
          type="button"
          onClick={onCancel}
          title="Cancel"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#475569',
            cursor: 'pointer',
            padding: '2px',
            display: 'inline-flex',
            alignItems: 'center'
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* 1. Drive */}
        <fieldset style={{ border: '1px solid #cbd5e1', padding: '8px', margin: 0 }}>
          <legend style={{ fontSize: '11px', padding: '0 4px', color: '#1e293b' }}>Drive</legend>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr', alignItems: 'center', gap: '6px' }}>
              <span data-testid="drive-face-count" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                ({driveCount})
              </span>
              <button
                type="button"
                data-testid="pick-drive-faces-btn"
                onClick={() => onStartPick?.('drive')}
                title="Select Drive Solid Faces or Surfaces in 3D Viewport"
                style={{
                  ...MC_BTN,
                  border: activePickRole === 'drive' ? '1.5px solid #0284c7' : '1px solid #9ca3af',
                  background: activePickRole === 'drive' ? '#dbeafe' : MC_BTN.background
                }}
              >
                <SelectCursorIcon />
              </button>
              <button
                type="button"
                data-testid="clear-drive-faces-btn"
                disabled={driveCount === 0}
                onClick={() => onClearRole?.('drive')}
                title="Unselect / Clear Drive Surfaces"
                style={{ ...MC_BTN, cursor: driveCount === 0 ? 'default' : 'pointer', opacity: driveCount === 0 ? 0.6 : 1 }}
              >
                <UnselectCursorIcon disabled={driveCount === 0} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr', alignItems: 'center', gap: '6px' }}>
              <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>({cadFileCount})</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Import CAD Surface File (STEP / IGES / STL)"
                style={{ ...MC_BTN, fontSize: '11px', padding: '0 4px' }}
              >
                CAD file...
              </button>
              <button
                type="button"
                disabled={cadFileCount === 0}
                onClick={() => onClearRole?.('cadfile')}
                title="Clear CAD File Surfaces"
                style={{ ...MC_BTN, cursor: cadFileCount === 0 ? 'default' : 'pointer', opacity: cadFileCount === 0 ? 0.6 : 1 }}
              >
                <UnselectCursorIcon disabled={cadFileCount === 0} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".step,.stp,.iges,.igs,.stl,.obj"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr', gap: '6px' }}>
              <span />
              <button
                type="button"
                disabled={driveCount === 0}
                onClick={() => onShowRole?.('drive')}
                title="Highlight & Focus Selected Drive Surfaces"
                style={{ ...MC_BTN, opacity: driveCount === 0 ? 0.6 : 1 }}
              >
                Show...
              </button>
              <span />
            </div>
          </div>
        </fieldset>

        {/* 2. Check */}
        <fieldset style={{ border: '1px solid #cbd5e1', padding: '8px', margin: 0 }}>
          <legend style={{ fontSize: '11px', padding: '0 4px', color: '#1e293b' }}>Check</legend>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr', alignItems: 'center', gap: '6px' }}>
              <span data-testid="check-face-count" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                ({checkCount})
              </span>
              <button
                type="button"
                data-testid="pick-check-faces-btn"
                onClick={() => onStartPick?.('check')}
                title="Select Check / Avoidance Surfaces in 3D Viewport"
                style={{
                  ...MC_BTN,
                  border: activePickRole === 'check' ? '1.5px solid #ea580c' : '1px solid #9ca3af',
                  background: activePickRole === 'check' ? '#ffedd5' : MC_BTN.background
                }}
              >
                <SelectCursorIcon />
              </button>
              <button
                type="button"
                disabled={checkCount === 0}
                onClick={() => onClearRole?.('check')}
                title="Clear Check Surfaces"
                style={{ ...MC_BTN, cursor: checkCount === 0 ? 'default' : 'pointer', opacity: checkCount === 0 ? 0.6 : 1 }}
              >
                <UnselectCursorIcon disabled={checkCount === 0} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr', gap: '6px' }}>
              <span />
              <button
                type="button"
                disabled={checkCount === 0}
                onClick={() => onShowRole?.('check')}
                title="Highlight Selected Check Surfaces"
                style={{ ...MC_BTN, opacity: checkCount === 0 ? 0.6 : 1 }}
              >
                Show...
              </button>
              <span />
            </div>
          </div>
        </fieldset>

        {/* 3. Containment */}
        <fieldset style={{ border: '1px solid #cbd5e1', padding: '8px', margin: 0 }}>
          <legend style={{ fontSize: '11px', padding: '0 4px', color: isFlowline ? '#94a3b8' : '#1e293b' }}>
            Containment
          </legend>
          <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr', alignItems: 'center', gap: '6px' }}>
            <span style={{ textAlign: 'right', color: isFlowline ? '#94a3b8' : '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
              ({containmentCount})
            </span>
            <button
              type="button"
              onClick={() => onStartPick?.('containment')}
              title="Select Containment Boundary Chain"
              style={{
                ...MC_BTN,
                opacity: isFlowline ? 0.75 : 1,
                border: activePickRole === 'containment' ? '1.5px solid #0284c7' : '1px solid #9ca3af',
                background: activePickRole === 'containment' ? '#dbeafe' : MC_BTN.background
              }}
            >
              <SelectCursorIcon disabled={isFlowline && containmentCount === 0} />
            </button>
            <button
              type="button"
              disabled={containmentCount === 0}
              onClick={() => onClearRole?.('containment')}
              title="Clear Containment Chains"
              style={{ ...MC_BTN, opacity: containmentCount === 0 ? 0.55 : 1 }}
            >
              <UnselectCursorIcon disabled={containmentCount === 0} />
            </button>
          </div>
        </fieldset>

        {/* 4. Flowline */}
        {isFlowline && (
          <fieldset style={{ border: '1px solid #cbd5e1', padding: '8px', margin: 0 }}>
            <legend style={{ fontSize: '11px', padding: '0 4px', color: '#1e293b' }}>Flowline</legend>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                data-testid="open-flowline-data-btn"
                disabled={driveCount === 0}
                onClick={onOpenFlowlineData}
                title={driveCount === 0 ? 'Select at least 1 Drive Face first' : 'Configure Flowline Cut/Step Directions (Flowline data)'}
                style={{
                  ...MC_BTN,
                  width: '68px',
                  height: '26px',
                  opacity: driveCount === 0 ? 0.55 : 1,
                  cursor: driveCount === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                <FlowlineButtonIcon disabled={driveCount === 0} />
              </button>
            </div>
          </fieldset>
        )}

        {/* Footer OK & Help */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', paddingTop: '2px' }}>
          <button
            type="button"
            data-testid="surface-selection-ok-btn"
            onClick={onConfirm}
            title="OK — Proceed to Surface Finish Parameters"
            style={{
              ...MC_BTN,
              width: '56px',
              height: '28px',
              background: '#ffffff',
              color: '#16a34a'
            }}
          >
            <Check size={16} strokeWidth={3} />
          </button>
          <button
            type="button"
            onClick={() => onHelp?.()}
            title="Help"
            style={{
              ...MC_BTN,
              width: '56px',
              height: '28px',
              background: '#ffffff',
              color: '#0284c7'
            }}
          >
            <HelpCircle size={15} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
