import React, { useState } from 'react';

/**
 * Mastercam Right-Side Vertical Quick-Access Toolbar
 * Exact replica of Mastercam 2026 right-edge viewport icon strip:
 *   + (Add), Gear (Attributes), Scissors (Delete), No (Deselect All),
 *   Cursor (Select All Arcs – default active), Spline, Globe (Circles),
 *   Extents, Paintbrush, Solid Cube, Surface Box, Levels, Planes,
 *   Groups, + 24.9mm scale badge at bottom.
 */

/* ─── SVG Icon Components ────────────────────────────────────────────── */

function IconAdd() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <line x1="9" y1="3" x2="9" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="3" y1="9" x2="15" y2="9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function IconGear() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.6 3.6l1.4 1.4M13 13l1.4 1.4M14.4 3.6l-1.4 1.4M5 13l-1.4 1.4"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function IconDelete() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <line x1="4" y1="4" x2="14" y2="14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="14" y1="4" x2="4" y2="14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function IconNo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.6"/>
      <line x1="4.4" y1="4.4" x2="13.6" y2="13.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

function IconCursorArrow({ active }) {
  const col = active ? '#1d6fbf' : 'currentColor';
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      {/* Arrow cursor */}
      <path d="M4 2.5L4 14.5L7.2 11.4L9.6 15.5L11.2 14.6L8.8 10.5L13 10.5Z"
        fill={active ? '#d0e8ff' : 'none'}
        stroke={col} strokeWidth="1.4" strokeLinejoin="round"/>
      {/* Small white dot next to cursor tip (the entity hover indicator) */}
      <rect x="10.5" y="13" width="3.5" height="3.5" rx="0.6"
        fill={active ? '#ffffff' : 'none'}
        stroke={col} strokeWidth="1.1"/>
    </svg>
  );
}

function IconSpline() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M2.5 13.5 C4 10 6 6 9 7.5 C12 9 14 5 15.5 4.5"
        stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
      <ellipse cx="9" cy="9" rx="3.2" ry="6.5" stroke="currentColor" strokeWidth="1.1"/>
      <line x1="2.5" y1="9" x2="15.5" y2="9" stroke="currentColor" strokeWidth="1.1"/>
    </svg>
  );
}

function IconExtents() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      {/* left tick */}
      <line x1="3" y1="6" x2="3" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      {/* right tick */}
      <line x1="15" y1="6" x2="15" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      {/* horizontal line */}
      <line x1="3" y1="9" x2="15" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      {/* left arrow */}
      <polyline points="6,6.5 3,9 6,11.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="none"/>
      {/* right arrow */}
      <polyline points="12,6.5 15,9 12,11.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

function IconProbeStylus() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      {/* probe ball tip */}
      <circle cx="5" cy="13.5" r="1.8" fill="none" stroke="currentColor" strokeWidth="1.4"/>
      {/* stem line */}
      <line x1="6.3" y1="12.2" x2="12.5" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      {/* angled upper tip */}
      <line x1="12.5" y1="6" x2="15" y2="3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function IconSolidCube() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      {/* front face */}
      <rect x="4" y="7" width="9" height="8" rx="0.5"
        fill="#f97316" stroke="#c2410c" strokeWidth="1.1"/>
      {/* top face */}
      <path d="M4 7 L8.5 3.5 L17 3.5 L13 7 Z"
        fill="#fb923c" stroke="#c2410c" strokeWidth="1.1"/>
      {/* right face */}
      <path d="M13 7 L17 3.5 L17 11.5 L13 15 Z"
        fill="#ea580c" stroke="#c2410c" strokeWidth="1.1"/>
    </svg>
  );
}

function IconSurfaceBox() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      {/* front face — purple/violet gradient look */}
      <rect x="3.5" y="7" width="9" height="8" rx="0.5"
        fill="#a78bfa" stroke="#7c3aed" strokeWidth="1.1"/>
      {/* top face */}
      <path d="M3.5 7 L8 3.5 L16.5 3.5 L12.5 7 Z"
        fill="#c4b5fd" stroke="#7c3aed" strokeWidth="1.1"/>
      {/* right face */}
      <path d="M12.5 7 L16.5 3.5 L16.5 11.5 L12.5 15 Z"
        fill="#8b5cf6" stroke="#7c3aed" strokeWidth="1.1"/>
      {/* surface grid lines on front face */}
      <line x1="3.5" y1="9.7" x2="12.5" y2="9.7" stroke="#7c3aed" strokeWidth="0.7" opacity="0.6"/>
      <line x1="3.5" y1="12.4" x2="12.5" y2="12.4" stroke="#7c3aed" strokeWidth="0.7" opacity="0.6"/>
      <line x1="7.5" y1="7" x2="7.5" y2="15" stroke="#7c3aed" strokeWidth="0.7" opacity="0.6"/>
    </svg>
  );
}

function IconLevels() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      {/* Three horizontal bars with label lines */}
      <rect x="2.5" y="4" width="5" height="2.5" rx="0.4" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="0.8"/>
      <line x1="9" y1="5.2" x2="15.5" y2="5.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <rect x="2.5" y="8" width="5" height="2.5" rx="0.4" fill="#6b7280" stroke="#374151" strokeWidth="0.8"/>
      <line x1="9" y1="9.2" x2="15.5" y2="9.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <rect x="2.5" y="12" width="5" height="2.5" rx="0.4" fill="#6b7280" stroke="#374151" strokeWidth="0.8"/>
      <line x1="9" y1="13.2" x2="15.5" y2="13.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

function IconPlanes() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      {/* Stacked horizontal planes */}
      <rect x="2.5" y="4" width="13" height="2.5" rx="0.4" fill="#10b981" stroke="#059669" strokeWidth="0.8"/>
      <line x1="2.5" y1="5.2" x2="15.5" y2="5.2" stroke="#059669" strokeWidth="0.5" strokeDasharray="2 1.5"/>
      <rect x="2.5" y="8" width="13" height="2.5" rx="0.4" fill="none" stroke="#6b7280" strokeWidth="0.8"/>
      <rect x="2.5" y="12" width="13" height="2.5" rx="0.4" fill="none" stroke="#6b7280" strokeWidth="0.8"/>
    </svg>
  );
}

function IconGroups() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      {/* 3D stacked boxes (groups/assembly) */}
      {/* bottom box */}
      <rect x="3" y="11" width="8" height="5" rx="0.5" fill="#60a5fa" stroke="#2563eb" strokeWidth="1"/>
      {/* middle box offset */}
      <rect x="5" y="8" width="8" height="5" rx="0.5" fill="#93c5fd" stroke="#2563eb" strokeWidth="1"/>
      {/* top box offset */}
      <rect x="7" y="5" width="8" height="4" rx="0.5" fill="#bfdbfe" stroke="#2563eb" strokeWidth="1"/>
    </svg>
  );
}

/* ─── Scale Badge at Bottom (Image 2 Replica) ────────────────────────── */
function ScaleBadge({ value = '16.9' }) {
  return (
    <div style={{
      marginTop: '4px',
      padding: '2px 3px',
      background: '#f8fafc',
      border: '1px solid #cbd5e1',
      borderRadius: '3px',
      fontSize: '9px',
      fontWeight: 700,
      color: '#0f172a',
      letterSpacing: '-0.3px',
      textAlign: 'center',
      lineHeight: 1.2,
      userSelect: 'none',
      whiteSpace: 'nowrap',
      fontFamily: 'Consolas, monospace',
      display: 'flex',
      alignItems: 'center',
      gap: '2px',
      justifyContent: 'center',
      width: '32px'
    }}>
      <span>{value}-</span>
      <span style={{ display: 'inline-block', width: '6px', height: '5px', background: '#0f172a', borderRadius: '1px' }} />
    </div>
  );
}

/* ─── Tooltip ───────────────────────────────────────────────────────── */
function Tooltip({ text, visible }) {
  if (!visible || !text) return null;
  return (
    <div style={{
      position: 'absolute',
      right: '110%',
      top: '50%',
      transform: 'translateY(-50%)',
      background: '#1e293b',
      color: '#f8fafc',
      fontSize: '11px',
      fontWeight: 500,
      padding: '3px 8px',
      borderRadius: '4px',
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      zIndex: 9999,
      boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {text}
      {/* Arrow pointing right */}
      <div style={{
        position: 'absolute',
        right: '-5px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: 0,
        height: 0,
        borderTop: '4px solid transparent',
        borderBottom: '4px solid transparent',
        borderLeft: '5px solid #1e293b'
      }}/>
    </div>
  );
}

/* ─── Single Icon Button ────────────────────────────────────────────── */
function IconBtn({ id, title, children, active, onClick, disabled }) {
  const [hovered, setHovered] = useState(false);

  const bg = active
    ? '#c8dffa'
    : hovered
      ? '#e2eaf4'
      : 'transparent';

  const border = active
    ? '1px solid #5b9bd5'
    : hovered
      ? '1px solid #b8ccdf'
      : '1px solid transparent';

  const color = active ? '#1d4e89' : '#374151';

  return (
    <div style={{ position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      <button
        type="button"
        disabled={!!disabled}
        onClick={() => onClick && onClick(id)}
        title={undefined /* managed by custom tooltip */}
        style={{
          width: '30px',
          height: '30px',
          border,
          borderRadius: '4px',
          background: bg,
          color,
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          outline: 'none',
          transition: 'background 0.1s, border 0.1s',
          opacity: disabled ? 0.4 : 1
        }}
      >
        {children}
      </button>
      <Tooltip text={title} visible={hovered}/>
    </div>
  );
}

/* ─── Divider line ──────────────────────────────────────────────────── */
function Divider() {
  return (
    <div style={{
      width: '22px',
      height: '1px',
      background: '#c8d6e2',
      margin: '2px auto'
    }}/>
  );
}

/* ─── Main QuickMaskBar Component ───────────────────────────────────── */
export default function QuickMaskBar({
  activeMask = 'arcs',
  onSelectMask,
  onAddEntity,
  onDeleteEntity,
  onDeselectAll,
  onAttributes,
  onZoomExtents,
  onOpenColorMask,
  onSwitchToLevels,
  onSwitchToPlanes,
  onOpenGroups,
  theme = 'light',
  scaleValue = '16.9',
  scaleUnit = 'mm'
}) {
  const handleMask = (id) => {
    if (onSelectMask) onSelectMask(id === activeMask && id !== 'all' ? 'all' : id);
  };

  return (
    <div
      className="quick-mask-bar"
      data-testid="quick-mask-bar"
      style={{
        position: 'absolute',
        top: '50%',
        right: '8px',
        transform: 'translateY(-50%)',
        zIndex: 25,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1px',
        background: 'rgba(236, 241, 247, 0.95)',
        border: '1px solid #b8c9d9',
        borderRadius: '5px',
        padding: '5px 3px',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.7)',
        userSelect: 'none',
        minWidth: '36px'
      }}
    >
      {/* ── Group 1: Entity Management ── */}
      <IconBtn id="add" title="Add / Create Entity" onClick={onAddEntity}>
        <IconAdd/>
      </IconBtn>

      <IconBtn id="attributes" title="Entity Attributes / Select All (Image 4)" onClick={onAttributes}>
        <IconGear/>
      </IconBtn>

      <IconBtn id="delete" title="Delete Selected Entities (Delete)" onClick={onDeleteEntity}>
        <IconDelete/>
      </IconBtn>

      <IconBtn id="deselect" title="Deselect All / Clear" onClick={onDeselectAll}>
        <IconNo/>
      </IconBtn>

      <Divider/>

      {/* ── Group 2: Entity Type Filters (Quick Mask) ── */}
      <IconBtn
        id="arcs"
        title="Select all arc entities"
        active={activeMask === 'arcs'}
        onClick={handleMask}
      >
        <IconCursorArrow active={activeMask === 'arcs'}/>
      </IconBtn>

      <IconBtn
        id="splines"
        title="Select all spline / curve entities"
        active={activeMask === 'splines'}
        onClick={handleMask}
      >
        <IconSpline/>
      </IconBtn>

      <IconBtn
        id="circles"
        title="Select all circle entities"
        active={activeMask === 'circles'}
        onClick={handleMask}
      >
        <IconGlobe/>
      </IconBtn>

      <IconBtn
        id="extents"
        title="Zoom Extents / Dimension Extents"
        active={activeMask === 'extents'}
        onClick={() => {
          handleMask('extents');
          if (onZoomExtents) onZoomExtents();
        }}
      >
        <IconExtents/>
      </IconBtn>

      <IconBtn
        id="points"
        title="Quick Mask: Point / Stylus Probe Entities"
        active={activeMask === 'points'}
        onClick={handleMask}
      >
        <IconProbeStylus/>
      </IconBtn>

      <Divider/>

      {/* ── Group 3: Geometry Type Filters ── */}
      <IconBtn
        id="solids"
        title="Quick Mask: Solid bodies"
        active={activeMask === 'solids'}
        onClick={handleMask}
      >
        <IconSolidCube/>
      </IconBtn>

      <IconBtn
        id="surfaces"
        title="Quick Mask: Surface entities"
        active={activeMask === 'surfaces'}
        onClick={handleMask}
      >
        <IconSurfaceBox/>
      </IconBtn>

      <IconBtn
        id="levels"
        title="Manage Levels (Entity Layers)"
        active={activeMask === 'levels'}
        onClick={() => {
          handleMask('levels');
          if (onSwitchToLevels) onSwitchToLevels();
        }}
      >
        <IconLevels/>
      </IconBtn>

      <IconBtn
        id="planes"
        title="Manage Construction Planes (CPlanes)"
        active={activeMask === 'planes'}
        onClick={() => {
          handleMask('planes');
          if (onSwitchToPlanes) onSwitchToPlanes();
        }}
      >
        <IconPlanes/>
      </IconBtn>

      <IconBtn
        id="groups"
        title="Manage Groups / Assemblies"
        active={activeMask === 'groups'}
        onClick={() => {
          handleMask('groups');
          if (onOpenGroups) onOpenGroups();
        }}
      >
        <IconGroups/>
      </IconBtn>

      {/* ── Scale Badge (Matching Image 2) ── */}
      <ScaleBadge value={scaleValue} unit={scaleUnit}/>
    </div>
  );
}
