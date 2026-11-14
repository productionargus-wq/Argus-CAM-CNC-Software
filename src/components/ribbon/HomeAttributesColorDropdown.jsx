import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

// Mastercam Standard 16 CAD Colors
export const MASTERCAM_STANDARD_COLORS = [
  '#000000', '#000080', '#008000', '#008080', '#800000', '#800080', '#808000', '#808080',
  '#c0c0c0', '#0000ff', '#00ff00', '#00ffff', '#ff0000', '#ff00ff', '#ffff00', '#ffffff'
];

// Mastercam Default Colors Grid (10 columns x 6 rows)
export const MASTERCAM_DEFAULT_COLORS = [
  // Row 1: Header / Pure base row
  '#71717a', '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e',
  // Row 2: Very light / tint row
  '#ffffff', '#fee2e2', '#ffedd5', '#fef9c3', '#dcfce7', '#cffafe', '#dbeafe', '#ede9fe', '#fae8ff', '#ffe4e6',
  // Row 3: Soft tint row
  '#e4e4e7', '#fca5a5', '#fdba74', '#fde047', '#86efac', '#67e8f9', '#93c5fd', '#c4b5fd', '#f0abfc', '#fda4af',
  // Row 4: Medium tint row
  '#a1a1aa', '#f87171', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#60a5fa', '#a78bfa', '#e879f9', '#fb7185',
  // Row 5: Deep shade row
  '#52525b', '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0891b2', '#2563eb', '#7c3aed', '#c026d3', '#e11d48',
  // Row 6: Darkest shade row
  '#18181b', '#991b1b', '#9a3412', '#854d0e', '#166534', '#155e75', '#1e40af', '#5b21b6', '#86198f', '#9f1239'
];

export default function HomeAttributesColorDropdown({
  activeColor = '#3b82f6',
  onChangeColor
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const nativeColorInputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelectColor = (col) => {
    onChangeColor?.(col);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Dropdown Toggle Button Matching Mastercam Home Attributes (Image 3) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Default and Standard Colors Palette (Attributes)"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          height: '24px',
          padding: '2px 4px',
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '3px',
          cursor: 'pointer',
          outline: 'none',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)'
        }}
      >
        {/* Overlapping double-sheet icon matching Mastercam Image 3 */}
        <div style={{ position: 'relative', width: '16px', height: '16px' }}>
          <div style={{
            position: 'absolute',
            top: '0px',
            left: '0px',
            width: '10px',
            height: '10px',
            border: '1px solid #475569',
            background: '#94a3b8',
            borderRadius: '1px'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '0px',
            right: '0px',
            width: '10px',
            height: '10px',
            border: '1px solid #000000',
            backgroundColor: activeColor || '#3b82f6',
            borderRadius: '1px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.25)'
          }} />
        </div>
        <ChevronDown size={11} color="#64748b" />
      </button>

      {/* Hidden native input for 'More Colors...' */}
      <input
        ref={nativeColorInputRef}
        type="color"
        value={activeColor || '#3b82f6'}
        onChange={(e) => handleSelectColor(e.target.value)}
        style={{ display: 'none' }}
      />

      {/* Dropdown Palette Popup (Exact Replica of Mastercam Image 3) */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            zIndex: 9999,
            marginTop: '3px',
            background: '#ffffff',
            border: '1px solid #94a3b8',
            boxShadow: '0 4px 16px rgba(0,0,0,0.22)',
            padding: '6px',
            borderRadius: '2px',
            width: '210px',
            fontFamily: "'Segoe UI', Tahoma, sans-serif",
            userSelect: 'none'
          }}
        >
          {/* Section 1: Default Colors Header */}
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
            Default Colors
          </div>

          {/* 10 x 6 Default Colors Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(10, 1fr)',
            gap: '2px',
            marginBottom: '8px'
          }}>
            {MASTERCAM_DEFAULT_COLORS.map((hex, idx) => {
              const isSelected = activeColor?.toLowerCase() === hex.toLowerCase();
              return (
                <div
                  key={`${hex}-${idx}`}
                  onClick={() => handleSelectColor(hex)}
                  title={hex}
                  style={{
                    width: '16px',
                    height: '16px',
                    backgroundColor: hex,
                    border: isSelected ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                    borderRadius: '1px',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; e.currentTarget.style.zIndex = 2; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.zIndex = 1; }}
                />
              );
            })}
          </div>

          {/* Section 2: Standard Colors Header */}
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
            Standard Colors
          </div>

          {/* 8 x 2 Standard Colors Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gap: '2px',
            marginBottom: '8px'
          }}>
            {MASTERCAM_STANDARD_COLORS.map((hex, idx) => {
              const isSelected = activeColor?.toLowerCase() === hex.toLowerCase();
              return (
                <div
                  key={`std-${hex}-${idx}`}
                  onClick={() => handleSelectColor(hex)}
                  title={hex}
                  style={{
                    width: '19px',
                    height: '16px',
                    backgroundColor: hex,
                    border: isSelected ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                    borderRadius: '1px',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; e.currentTarget.style.zIndex = 2; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.zIndex = 1; }}
                />
              );
            })}
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0 6px' }} />

          {/* Section 3: More Colors... Button */}
          <button
            type="button"
            onClick={() => nativeColorInputRef.current?.click()}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 6px',
              background: 'transparent',
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer',
              fontSize: '11px',
              color: '#1e293b',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            {/* 4-quadrant mini color swatch icon */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 6px)',
              gap: '1px',
              border: '1px solid #94a3b8',
              padding: '1px',
              background: '#ffffff'
            }}>
              <div style={{ width: '5px', height: '5px', background: '#ef4444' }} />
              <div style={{ width: '5px', height: '5px', background: '#22c55e' }} />
              <div style={{ width: '5px', height: '5px', background: '#3b82f6' }} />
              <div style={{ width: '5px', height: '5px', background: '#f59e0b' }} />
            </div>
            <span>More Colors...</span>
          </button>
        </div>
      )}
    </div>
  );
}
