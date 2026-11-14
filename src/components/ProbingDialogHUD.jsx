import React, { useState } from 'react';
import {
  Scissors, Copy, Clipboard, RotateCcw, RotateCw,
  X, Plus, HelpCircle
} from 'lucide-react';

export const PROBING_CYCLES = [
  { id: 'single_point', name: 'Single Point Surface Touch (Z / X / Y Datum)', macro: 'G65 P9811' },
  { id: 'web_slot', name: 'Web / Pocket Slot Centering (2-Point)', macro: 'G65 P9812' },
  { id: 'bore_boss', name: 'Bore / Boss Circular Centering (3-Point / 4-Point)', macro: 'G65 P9814' },
  { id: 'angled_plane', name: 'Angled Surface / Plane Inclination', macro: 'G65 P9811' },
  { id: 'corner_wcs', name: 'Workpiece Corner Datum Setup (3-Point)', macro: 'G65 P9815' },
  { id: 'block_3d', name: '3D Feature / Bounding Stock Datum', macro: 'G65 P9810' }
];

export default function ProbingDialogHUD({
  isOpen,
  onClose,
  activeProbe = null,
  activeCycleId = 'bore_boss',
  onSelectCycle,
  onApplyProbingOperation,
  targetFeature = null,
  onClearTargetFeature
}) {
  const [selectedCycle, setSelectedCycle] = useState(activeCycleId);
  const [isRenishawPPlusActive, setIsRenishawPPlusActive] = useState(true);
  const [isLiveLinkActive, setIsLiveLinkActive] = useState(true);

  if (!isOpen) return null;

  const handleCycleClick = (id) => {
    setSelectedCycle(id);
    onSelectCycle?.(id);
  };

  const handleApply = () => {
    onApplyProbingOperation?.({
      probe: activeProbe || { name: 'SampleProbe', diameter: 6, toolChangeId: 11 },
      cycleId: selectedCycle,
      targetFeature
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '75px',
        left: '260px',
        zIndex: 9998,
        width: '260px',
        background: '#f8fafc',
        border: '1.5px solid #64748b',
        borderRadius: '3px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        userSelect: 'none'
      }}
    >
      {/* Title Bar matching Mastercam Image 7 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 8px',
          background: '#e2e8f0',
          borderBottom: '1px solid #cbd5e1',
          cursor: 'move'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Probe Stylus Icon */}
          <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
            <circle cx="5" cy="13.5" r="2" fill="#ef4444" stroke="#991b1b" strokeWidth="1"/>
            <line x1="6.5" y1="12" x2="13" y2="5" stroke="#475569" strokeWidth="2"/>
            <rect x="11" y="2" width="5" height="5" fill="#3b82f6" rx="1"/>
          </svg>
          <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#1e293b' }}>
            Probing Dialog
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            lineHeight: 1,
            color: '#64748b'
          }}
          title="Close Probing Dialog"
        >
          <X size={13} />
        </button>
      </div>

      {/* Row 1: Editing Toolbar (Cut, Copy, Paste, Undo, Redo) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 8px',
          borderBottom: '1px solid #cbd5e1',
          background: '#ffffff'
        }}
      >
        <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }} title="Cut">
          <Scissors size={14} color="#0284c7" />
        </button>
        <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }} title="Copy">
          <Copy size={14} color="#3b82f6" />
        </button>
        <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }} title="Paste">
          <Clipboard size={14} color="#ca8a04" />
        </button>

        <div style={{ width: '1px', height: '14px', background: '#cbd5e1', margin: '0 4px' }} />

        <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }} title="Undo">
          <RotateCcw size={14} color="#0284c7" />
        </button>
        <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }} title="Redo">
          <RotateCw size={14} color="#0284c7" />
        </button>
      </div>

      {/* Row 2: Renishaw Productivity+ (P+) Mode & Machine Macro Link (Image 7) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 8px',
          borderBottom: '1px solid #cbd5e1',
          background: '#f8fafc'
        }}
      >
        {/* Renishaw P+ Badge Icon */}
        <button
          type="button"
          onClick={() => setIsRenishawPPlusActive(!isRenishawPPlusActive)}
          title="Renishaw Inspection Plus (Productivity+) Macro Engine"
          style={{
            background: isRenishawPPlusActive ? '#000000' : '#e2e8f0',
            border: '1px solid #000000',
            borderRadius: '2px',
            padding: '2px 4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '3px'
          }}
        >
          <span style={{ fontSize: '10px', fontWeight: 900, color: isRenishawPPlusActive ? '#ffffff' : '#475569', letterSpacing: '-0.3px', fontFamily: 'monospace' }}>
            P+
          </span>
        </button>

        {/* Plug / Machine Macro Link Icon */}
        <button
          type="button"
          onClick={() => setIsLiveLinkActive(!isLiveLinkActive)}
          title="Machine Live WCS & Macro Register Update Link"
          style={{
            background: isLiveLinkActive ? '#e0f2fe' : '#ffffff',
            border: isLiveLinkActive ? '1px solid #0284c7' : '1px solid #cbd5e1',
            borderRadius: '2px',
            padding: '2px 5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <svg width="16" height="12" viewBox="0 0 24 16" fill="none">
            <path d="M4 8h5M15 8h5M9 4v8h6V4H9z" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
            <line x1="12" y1="1" x2="12" y2="4" stroke="#0284c7" strokeWidth="2" />
          </svg>
        </button>
      </div>

      {/* Row 3: 6 Probing Cycle Buttons (Exact SVGs matching Image 7) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '2px',
          padding: '6px 8px',
          borderBottom: '1px solid #cbd5e1',
          background: '#ffffff'
        }}
      >
        {/* 1. Single Point (Red dot on plane) */}
        <button
          type="button"
          onClick={() => handleCycleClick('single_point')}
          title="Single Point Surface Touch (Z / X / Y Datum)"
          style={{
            height: '32px',
            background: selectedCycle === 'single_point' ? '#dbeafe' : 'transparent',
            border: selectedCycle === 'single_point' ? '1px solid #3b82f6' : '1px solid transparent',
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <line x1="2" y1="16" x2="22" y2="16" stroke="#94a3b8" strokeWidth="1.5" />
            <circle cx="12" cy="16" r="3.5" fill="#ef4444" stroke="#991b1b" strokeWidth="1" />
          </svg>
        </button>

        {/* 2. Web / Slot (Line with 2 red dots) */}
        <button
          type="button"
          onClick={() => handleCycleClick('web_slot')}
          title="Web / Slot Centering (2-Point)"
          style={{
            height: '32px',
            background: selectedCycle === 'web_slot' ? '#dbeafe' : 'transparent',
            border: selectedCycle === 'web_slot' ? '1px solid #3b82f6' : '1px solid transparent',
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <line x1="5" y1="7" x2="19" y2="17" stroke="#475569" strokeWidth="1.5" />
            <circle cx="5" cy="7" r="3" fill="#ef4444" stroke="#991b1b" strokeWidth="1" />
            <circle cx="19" cy="17" r="3" fill="#ef4444" stroke="#991b1b" strokeWidth="1" />
          </svg>
        </button>

        {/* 3. Bore / Boss (Triangle with 3 red dots inside circle) */}
        <button
          type="button"
          onClick={() => handleCycleClick('bore_boss')}
          title="Bore / Boss Circular Centering (3-Point / 4-Point)"
          style={{
            height: '32px',
            background: selectedCycle === 'bore_boss' ? '#dbeafe' : 'transparent',
            border: selectedCycle === 'bore_boss' ? '1px solid #3b82f6' : '1px solid transparent',
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 1.5" />
            <circle cx="12" cy="5" r="2.8" fill="#ef4444" stroke="#991b1b" strokeWidth="0.8" />
            <circle cx="6" cy="17" r="2.8" fill="#ef4444" stroke="#991b1b" strokeWidth="0.8" />
            <circle cx="18" cy="17" r="2.8" fill="#ef4444" stroke="#991b1b" strokeWidth="0.8" />
          </svg>
        </button>

        {/* 4. Angled Plane (Parallelogram with red dot) */}
        <button
          type="button"
          onClick={() => handleCycleClick('angled_plane')}
          title="Angled Surface / Plane Inclination"
          style={{
            height: '32px',
            background: selectedCycle === 'angled_plane' ? '#dbeafe' : 'transparent',
            border: selectedCycle === 'angled_plane' ? '1px solid #3b82f6' : '1px solid transparent',
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <polygon points="6,18 10,6 20,6 16,18" stroke="#475569" strokeWidth="1.2" fill="#f1f5f9" />
            <circle cx="13" cy="12" r="3" fill="#ef4444" stroke="#991b1b" strokeWidth="0.8" />
          </svg>
        </button>

        {/* 5. Corner (V-shape with 3 red dots) */}
        <button
          type="button"
          onClick={() => handleCycleClick('corner_wcs')}
          title="Workpiece Corner Datum (3-Point)"
          style={{
            height: '32px',
            background: selectedCycle === 'corner_wcs' ? '#dbeafe' : 'transparent',
            border: selectedCycle === 'corner_wcs' ? '1px solid #3b82f6' : '1px solid transparent',
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <polyline points="5,7 12,17 19,7" stroke="#475569" strokeWidth="1.5" />
            <circle cx="5" cy="7" r="2.8" fill="#ef4444" stroke="#991b1b" strokeWidth="0.8" />
            <circle cx="12" cy="17" r="2.8" fill="#ef4444" stroke="#991b1b" strokeWidth="0.8" />
            <circle cx="19" cy="7" r="2.8" fill="#ef4444" stroke="#991b1b" strokeWidth="0.8" />
          </svg>
        </button>

        {/* 6. Block / 3D Feature (Cube with red dot) */}
        <button
          type="button"
          onClick={() => handleCycleClick('block_3d')}
          title="3D Block / Feature Datum"
          style={{
            height: '32px',
            background: selectedCycle === 'block_3d' ? '#dbeafe' : 'transparent',
            border: selectedCycle === 'block_3d' ? '1px solid #3b82f6' : '1px solid transparent',
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="6" width="10" height="12" stroke="#475569" strokeWidth="1" fill="#f8fafc" />
            <polygon points="4,6 9,2 19,2 14,6" stroke="#475569" strokeWidth="1" fill="#e2e8f0" />
            <polygon points="14,6 19,2 19,14 14,18" stroke="#475569" strokeWidth="1" fill="#cbd5e1" />
            <circle cx="14" cy="6" r="3" fill="#ef4444" stroke="#991b1b" strokeWidth="0.8" />
          </svg>
        </button>
      </div>

      {/* Row 4: Controls (Cancel Red X, Apply Blue +, Clear |x|, Help ?) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '4px',
          padding: '6px 8px',
          background: '#f1f5f9'
        }}
      >
        {/* Red X Button: Cancel */}
        <button
          type="button"
          onClick={onClose}
          title="Cancel Probing Session"
          style={{
            height: '28px',
            background: '#fee2e2',
            border: '1px solid #ef4444',
            borderRadius: '2px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={16} color="#dc2626" strokeWidth={3} />
        </button>

        {/* Blue + Circle Button: Apply & Create Operation in Toolpaths Tree */}
        <button
          type="button"
          onClick={handleApply}
          title="Apply Probing Cycle & Add Operation to Tree (Image 1)"
          style={{
            height: '28px',
            background: '#e0f2fe',
            border: '1.5px solid #0284c7',
            borderRadius: '2px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={13} color="#ffffff" strokeWidth={3} />
          </div>
        </button>

        {/* |x| Button: Clear Targets */}
        <button
          type="button"
          onClick={onClearTargetFeature}
          title="Clear Picked Target Geometry"
          style={{
            height: '28px',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '2px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontFamily: 'monospace',
            fontWeight: 800,
            color: '#64748b'
          }}
        >
          |x|
        </button>

        {/* ? Help Button */}
        <button
          type="button"
          style={{
            height: '28px',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '2px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Help on Touch Probing Cycles"
        >
          <HelpCircle size={15} color="#475569" />
        </button>
      </div>
    </div>
  );
}
