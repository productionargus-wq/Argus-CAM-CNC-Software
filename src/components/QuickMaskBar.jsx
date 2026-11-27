import React, { useState, useRef, useEffect } from 'react';

/**
 * Mastercam Quick Mask (QM) Right-Side Viewport Toolbar
 * Exact 1:1 replica of Mastercam 2026 graphics viewport QM strip (Image 2):
 * - Circular badges with 45° diagonal slash lines
 * - 2x2 top grid: [Points, Settings], [Lines, Clear Mask]
 * - 1xN vertical column: Arcs, Splines, Wireframe, Drafting, Surfaces, Solids, Colors, Levels, Groups, Palette, Active Level
 * - Graphics scale ruler at bottom (|——— 24.94 mm ———| Metric)
 */

/* ─── Exact Mastercam Quick Mask Circular Button with 45° Diagonal Slash ─── */
function QMButton({
  id,
  title,
  active = false,
  onClick,
  showSlash = true,
  children
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{ position: 'relative' }}
      onPointerEnter={(e) => {
        if (e.pointerType !== 'touch') setIsHovered(true);
      }}
      onPointerLeave={() => setIsHovered(false)}
    >
      <button
        type="button"
        id={`qm-btn-${id}`}
        aria-label={title}
        onClick={() => onClick && onClick(id)}
        style={{
          position: 'relative',
          width: '26px',
          height: '26px',
          borderRadius: '50%',
          background: active ? '#e0f2fe' : isHovered ? '#f1f5f9' : '#ffffff',
          border: active ? '1.5px solid #0284c7' : isHovered ? '1px solid #64748b' : '1px solid #cbd5e1',
          boxShadow: isHovered
            ? '0 2px 5px rgba(0,0,0,0.2)'
            : '0 1px 2px rgba(0,0,0,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 0,
          outline: 'none',
          transition: 'all 0.12s ease'
        }}
      >
        {/* Mastercam 45° diagonal slash across circular badge */}
        {showSlash && (
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none'
            }}
            viewBox="0 0 26 26"
          >
            <line
              x1="5"
              y1="21"
              x2="21"
              y2="5"
              stroke="#94a3b8"
              strokeWidth="1.1"
              strokeLinecap="round"
              opacity="0.6"
            />
          </svg>
        )}

        {/* Foreground Icon */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {children}
        </div>
      </button>

      {/* Exact Mastercam Tooltip (matching Image 2) */}
      {isHovered && (
        <div
          style={{
            position: 'absolute',
            right: '32px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: '#ffffff',
            color: '#1e293b',
            border: '1px solid #94a3b8',
            boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
            borderRadius: '2px',
            padding: '3px 7px',
            fontSize: '11px',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            whiteSpace: 'nowrap',
            zIndex: 100,
            pointerEvents: 'none'
          }}
        >
          {title}
        </div>
      )}
    </div>
  );
}

/* ─── 1:1 SVG Icons Matching Image 2 ─── */

// 1. Points (+ cross)
function IconPoints() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <line x1="8" y1="2" x2="8" y2="14" stroke="#0284c7" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="2" y1="8" x2="14" y2="8" stroke="#0284c7" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

// 2. Settings (Gear)
function IconSettings() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2.4" stroke="#b45309" strokeWidth="1.5" fill="#fef3c7" />
      <path
        d="M8 1.5v1.8M8 12.7v1.8M1.5 8h1.8M12.7 8h1.8M3.4 3.4l1.3 1.3M11.3 11.3l1.3 1.3M12.6 3.4l-1.3 1.3M4.7 11.3l-1.3 1.3"
        stroke="#b45309"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

// 3. Lines (+---+ line with endpoint ticks)
function IconLines() {
  return (
    <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
      {/* Main line */}
      <line x1="4" y1="14" x2="14" y2="4" stroke="#0284c7" strokeWidth="1.8" strokeLinecap="round" />
      {/* Start endpoint tick */}
      <line x1="2" y1="12" x2="6" y2="16" stroke="#0284c7" strokeWidth="1.8" strokeLinecap="round" />
      {/* End endpoint tick */}
      <line x1="12" y1="2" x2="16" y2="6" stroke="#0284c7" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// 4. Clear Mask / Deselect All (Red circle with diagonal strike ⊘)
function IconClearMask() {
  return (
    <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="6.5" stroke="#dc2626" strokeWidth="1.8" fill="none" />
      <line x1="4.5" y1="4.5" x2="13.5" y2="13.5" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// 5. Arcs (Blue Circle ○)
function IconArcs() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="5.5" stroke="#0284c7" strokeWidth="2.0" fill="none" />
    </svg>
  );
}

// 6. Splines (Blue S-curve ~)
function IconSplines() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path
        d="M3 12.5 C4.5 7.5, 7.5 13.5, 10 9 C11.5 6, 12.5 4, 14 3.5"
        stroke="#0284c7"
        strokeWidth="2.0"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

// 7. Wireframe (Isometric 3D Box)
function IconWireframe() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      {/* Top face */}
      <polygon points="8,2 14,5 8,8 2,5" stroke="#0284c7" strokeWidth="1.4" fill="none" />
      {/* Left face */}
      <polygon points="2,5 8,8 8,14 2,11" stroke="#0284c7" strokeWidth="1.4" fill="none" />
      {/* Right face */}
      <polygon points="8,8 14,5 14,11 8,14" stroke="#0284c7" strokeWidth="1.4" fill="none" />
    </svg>
  );
}

// 8. Drafting / Dimensions (|<- ->|)
function IconDrafting() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      {/* Dimension line */}
      <line x1="2" y1="8" x2="14" y2="8" stroke="#0284c7" strokeWidth="1.4" />
      {/* Center tick */}
      <line x1="8" y1="4" x2="8" y2="12" stroke="#0284c7" strokeWidth="1.4" />
      {/* Left arrow */}
      <polyline points="5,5.5 2,8 5,10.5" stroke="#0284c7" strokeWidth="1.4" fill="none" strokeLinejoin="round" />
      {/* Right arrow */}
      <polyline points="11,5.5 14,8 11,10.5" stroke="#0284c7" strokeWidth="1.4" fill="none" strokeLinejoin="round" />
    </svg>
  );
}

// 9. Surfaces (Yellow/gold wavy sheet)
function IconSurfaces() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path
        d="M2.5 10 C4.5 7, 7 11, 10 8 C11.5 6.5, 13 8.5, 13.5 7 L12 4 C10.5 5.5, 9 3.5, 6 6.5 C3.5 9, 2 5, 1 8 Z"
        fill="#eab308"
        stroke="#ca8a04"
        strokeWidth="1"
      />
    </svg>
  );
}

// 10. Solids (Gold 3D Solid Cube with Shaded Faces)
function IconSolids() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16">
      {/* Top shaded face */}
      <polygon points="8,2 14,5.2 8,8.4 2,5.2" fill="#fde047" stroke="#ca8a04" strokeWidth="0.8" />
      {/* Left shaded face */}
      <polygon points="2,5.2 8,8.4 8,14 2,10.8" fill="#eab308" stroke="#ca8a04" strokeWidth="0.8" />
      {/* Right shaded face */}
      <polygon points="8,8.4 14,5.2 14,10.8 8,14" fill="#ca8a04" stroke="#a16207" strokeWidth="0.8" />
    </svg>
  );
}

// 11. Colors (Overlapping Yellow & Purple Squares)
function IconColors() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16">
      {/* Purple square (back) */}
      <rect x="6" y="2.5" width="7.5" height="7.5" fill="#a855f7" stroke="#7e22ce" strokeWidth="0.8" />
      {/* Yellow square (front) */}
      <rect x="2.5" y="6" width="7.5" height="7.5" fill="#fde047" stroke="#ca8a04" strokeWidth="0.8" />
    </svg>
  );
}

// 12. Levels (Level list bracket with 3 dots)
function IconLevels() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      {/* Bracket [ */}
      <path d="M12 2.5 H6 V13.5 H12" stroke="#0284c7" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Three level dots */}
      <circle cx="9" cy="5" r="1.2" fill="#f59e0b" />
      <circle cx="9" cy="8" r="1.2" fill="#f59e0b" />
      <circle cx="9" cy="11" r="1.2" fill="#f59e0b" />
    </svg>
  );
}

// 13. Groups (Group box with chain link)
function IconGroups() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <rect x="3" y="3" width="7" height="10" stroke="#0284c7" strokeWidth="1.4" strokeDasharray="1.8 1.4" fill="none" />
      <ellipse cx="10" cy="8" rx="2.5" ry="3.8" stroke="#0284c7" strokeWidth="1.4" fill="none" />
      <circle cx="10" cy="8" r="1.2" fill="#0284c7" />
    </svg>
  );
}

// 14. Color Palette (Grid of multi-color swatches)
function IconPalette() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16">
      <rect x="2" y="3" width="3.5" height="4" fill="#ef4444" />
      <rect x="6.2" y="3" width="3.5" height="4" fill="#eab308" />
      <rect x="10.5" y="3" width="3.5" height="4" fill="#10b981" />
      <rect x="2" y="8" width="3.5" height="4" fill="#06b6d4" />
      <rect x="6.2" y="8" width="3.5" height="4" fill="#3b82f6" />
      <rect x="10.5" y="8" width="3.5" height="4" fill="#a855f7" />
    </svg>
  );
}

// 15. Active Level Stack (3 stacked blue layers)
function IconActiveLevel() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      {/* Top layer */}
      <polygon points="8,2 14,5 8,8 2,5" fill="#38bdf8" stroke="#0284c7" strokeWidth="0.8" />
      {/* Middle layer */}
      <path d="M2 7.5 L8 10.5 L14 7.5" stroke="#0284c7" strokeWidth="1.2" fill="none" />
      {/* Bottom layer */}
      <path d="M2 10.5 L8 13.5 L14 10.5" stroke="#0284c7" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

/* ─── Graphics Viewport Scale Ruler ─── */
function ViewportScaleRuler({ value = '24.94', unit = 'mm' }) {
  return (
    <div
      style={{
        marginTop: '10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        userSelect: 'none',
        pointerEvents: 'none'
      }}
    >
      <div
        style={{
          fontSize: '11px',
          fontWeight: 700,
          color: '#1e293b',
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          whiteSpace: 'nowrap',
          lineHeight: 1.1
        }}
      >
        {value} {unit}
      </div>
      {/* Horizontal ruler with end ticks */}
      <div
        style={{
          width: '58px',
          height: '6px',
          borderLeft: '1.5px solid #1e293b',
          borderRight: '1.5px solid #1e293b',
          borderBottom: '1.5px solid #1e293b',
          marginTop: '2px'
        }}
      />
      <div
        style={{
          fontSize: '9.5px',
          fontWeight: 600,
          color: '#475569',
          marginTop: '1px'
        }}
      >
        {unit === 'in' ? 'Inch' : 'Metric'}
      </div>
    </div>
  );
}

/* ─── Main QuickMaskBar Component ─── */
export default function QuickMaskBar({
  activeMask = 'all',
  onSelectMask,
  scaleValue = '24.94',
  scaleUnit = 'mm',
  isMobile = false
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const idleTimerRef = useRef(null);

  const bumpActivity = () => {
    setIsInteracting(true);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setIsInteracting(false);
    }, 2800);
  };

  useEffect(() => {
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  const isActive = isHovered || isInteracting || (activeMask && activeMask !== 'all');

  const handleMaskClick = (id) => {
    bumpActivity();
    if (onSelectMask) {
      onSelectMask(id);
    }
  };

  return (
    <div
      className={`quick-mask-bar ${isActive ? 'is-active' : ''}`}
      data-testid="quick-mask-bar"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onPointerDown={bumpActivity}
      onScroll={bumpActivity}
      style={{
        position: 'absolute',
        ...(isMobile
          ? {
              top: '44px',
              bottom: '6px',
              right: '6px',
              overflowY: 'auto',
              overflowX: 'hidden',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              paddingRight: '2px'
            }
          : {
              top: '50%',
              right: '12px',
              transform: 'translateY(-50%)'
            }),
        zIndex: 35,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        userSelect: 'none',
        pointerEvents: 'auto',
        opacity: isActive ? 0.98 : 0.36,
        transition: 'opacity 0.24s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Top 2x2 Header: Points & Settings, Lines & Clear */}
      <div style={{ display: 'grid', gridTemplateColumns: '26px 26px', gap: '4px', marginBottom: '2px' }}>
        {/* Row 1 Left: Points */}
        <QMButton
          id="points"
          title="Select all point entities"
          active={activeMask === 'points'}
          onClick={handleMaskClick}
        >
          <IconPoints />
        </QMButton>

        {/* Row 1 Right: Settings / Filters */}
        <QMButton
          id="settings"
          title="Quick Mask Settings / Filters"
          active={activeMask === 'settings'}
          onClick={handleMaskClick}
        >
          <IconSettings />
        </QMButton>

        {/* Row 2 Left: Lines */}
        <QMButton
          id="lines"
          title="Select all line entities"
          active={activeMask === 'lines'}
          onClick={handleMaskClick}
        >
          <IconLines />
        </QMButton>

        {/* Row 2 Right: Clear Mask / Unselect All */}
        <QMButton
          id="clear"
          title="Clear selection mask / Unselect all"
          showSlash={false}
          active={false}
          onClick={handleMaskClick}
        >
          <IconClearMask />
        </QMButton>
      </div>

      {/* Main Single Column Stack: Arcs through Active Level */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
        {/* Arcs (Matches Image 2 hover tooltip: "Select all arc entities") */}
        <QMButton
          id="arcs"
          title="Select all arc entities"
          active={activeMask === 'arcs'}
          onClick={handleMaskClick}
        >
          <IconArcs />
        </QMButton>

        {/* Splines */}
        <QMButton
          id="splines"
          title="Select all spline entities"
          active={activeMask === 'splines'}
          onClick={handleMaskClick}
        >
          <IconSplines />
        </QMButton>

        {/* Wireframe */}
        <QMButton
          id="wireframe"
          title="Select all wireframe entities"
          active={activeMask === 'wireframe'}
          onClick={handleMaskClick}
        >
          <IconWireframe />
        </QMButton>

        {/* Drafting / Dimensions */}
        <QMButton
          id="drafting"
          title="Select all drafting / dimension entities"
          active={activeMask === 'drafting'}
          onClick={handleMaskClick}
        >
          <IconDrafting />
        </QMButton>

        {/* Surfaces */}
        <QMButton
          id="surfaces"
          title="Select all surface entities"
          active={activeMask === 'surfaces'}
          onClick={handleMaskClick}
        >
          <IconSurfaces />
        </QMButton>

        {/* Solids */}
        <QMButton
          id="solids"
          title="Select all solid entities"
          active={activeMask === 'solids'}
          onClick={handleMaskClick}
        >
          <IconSolids />
        </QMButton>

        {/* Colors */}
        <QMButton
          id="colors"
          title="Select entities by color"
          active={activeMask === 'colors'}
          onClick={handleMaskClick}
        >
          <IconColors />
        </QMButton>

        {/* Levels */}
        <QMButton
          id="levels"
          title="Select entities by level"
          active={activeMask === 'levels'}
          onClick={handleMaskClick}
        >
          <IconLevels />
        </QMButton>

        {/* Groups */}
        <QMButton
          id="groups"
          title="Select entities by group"
          active={activeMask === 'groups'}
          onClick={handleMaskClick}
        >
          <IconGroups />
        </QMButton>

        {/* Color Palette */}
        <QMButton
          id="palette"
          title="Select entities by color palette"
          active={activeMask === 'palette'}
          onClick={handleMaskClick}
        >
          <IconPalette />
        </QMButton>

        {/* Active Level */}
        <QMButton
          id="activeLevel"
          title="Select entities on active level"
          active={activeMask === 'activeLevel'}
          onClick={handleMaskClick}
        >
          <IconActiveLevel />
        </QMButton>
      </div>

      {/* Graphics Viewport Scale Ruler */}
      <ViewportScaleRuler value={scaleValue} unit={scaleUnit} />
    </div>
  );
}
