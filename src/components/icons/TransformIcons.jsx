import React from 'react';

/**
 * Authentic vector icons for Mastercam 2018 TRANSFORM tab
 * Styled with 3D gnomons, translation vectors, rotational rings,
 * projection paths, symmetry planes, nested parts, and scaling grids.
 */

// ==================== 1. POSITION GROUP ====================

export function DynamicIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* 3D Gnomon Coordinate Axes */}
      {/* Central sphere pivot */}
      <circle cx="14" cy="18" r="3.5" fill="#ca8a04" stroke="#a16207" strokeWidth="1" />
      {/* X Axis (Red) */}
      <line x1="14" y1="18" x2="27" y2="18" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" />
      <polygon points="27,18 23,16 23,20" fill="#ef4444" />
      {/* Y Axis (Green) */}
      <line x1="14" y1="18" x2="14" y2="5" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" />
      <polygon points="14,5 12,9 16,9" fill="#10b981" />
      {/* Z Axis (Blue - isometric oblique) */}
      <line x1="14" y1="18" x2="6" y2="25" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" />
      <polygon points="6,25 9,22 10,24" fill="#0284c7" />
      {/* Rotational arc ring */}
      <path d="M19 14 A 7 7 0 0 1 20 22" stroke="#f59e0b" strokeWidth="1.6" fill="none" />
      <polygon points="20,22 18,20 21,19" fill="#f59e0b" />
    </svg>
  );
}

export function TranslateIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Original ghost cube */}
      <rect x="5" y="15" width="10" height="10" rx="1" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="2,2" />
      {/* Translated golden 3D solid cube */}
      <polygon points="17,5 25,9 25,17 17,13" fill="#d97706" stroke="#b45309" strokeWidth="0.8" />
      <polygon points="17,5 21,3 29,7 25,9" fill="#fde68a" stroke="#d97706" strokeWidth="0.8" />
      <polygon points="17,5 17,13 13,11 13,3" fill="#b45309" stroke="#78350f" strokeWidth="0.8" />
      {/* Translation motion vector arrow */}
      <path d="M10 20 L20 10" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
      <polygon points="20,10 16,10 19,13" fill="#0284c7" />
    </svg>
  );
}

export function RotateIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Central pivot point */}
      <circle cx="16" cy="16" r="3" fill="#d97706" stroke="#b45309" strokeWidth="1" />
      {/* Circular revolution arrow */}
      <path d="M16 6 A 10 10 0 1 1 6 16" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <polygon points="6,16 9,13 9,18" fill="#0284c7" />
      {/* Crosshair guidelines */}
      <line x1="16" y1="2" x2="16" y2="7" stroke="#94a3b8" strokeWidth="1" strokeDasharray="1.5,1.5" />
      <line x1="2" y1="16" x2="7" y2="16" stroke="#94a3b8" strokeWidth="1" strokeDasharray="1.5,1.5" />
    </svg>
  );
}

export function ProjectIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Upper floating wireframe curve */}
      <path d="M6 7 Q 16 3 26 7" stroke="#0284c7" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Target surface / plane below */}
      <polygon points="4,24 14,20 28,20 18,24" fill="#fde68a" stroke="#d97706" strokeWidth="1.2" />
      {/* Projected shadow curve on surface */}
      <path d="M8 22 Q 16 21 24 22" stroke="#b45309" strokeWidth="1.6" fill="none" strokeDasharray="2,1.5" />
      {/* Downward projection vectors with arrow */}
      <line x1="16" y1="9" x2="16" y2="19" stroke="#ef4444" strokeWidth="1.8" strokeDasharray="2,2" />
      <polygon points="16,19 14,15 18,15" fill="#ef4444" />
    </svg>
  );
}

export function MoveToOriginIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Coordinate axes intersecting at (0,0,0) */}
      <line x1="6" y1="16" x2="26" y2="16" stroke="#ef4444" strokeWidth="1.5" />
      <line x1="16" y1="6" x2="16" y2="26" stroke="#10b981" strokeWidth="1.5" />
      {/* Origin crosshair bullseye */}
      <circle cx="16" cy="16" r="5" stroke="#0284c7" strokeWidth="1.2" fill="none" strokeDasharray="2,1.5" />
      <circle cx="16" cy="16" r="2.5" fill="#0284c7" />
      {/* Curved motion arrow jumping right into origin */}
      <path d="M26 6 Q 22 10 17 14" stroke="#0284c7" strokeWidth="2" fill="none" strokeLinecap="round" />
      <polygon points="17,14 20,11 18,16" fill="#0284c7" />
    </svg>
  );
}

export function MirrorIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Vertical symmetry mirror plane */}
      <line x1="16" y1="3" x2="16" y2="29" stroke="#64748b" strokeWidth="1.6" strokeDasharray="3,2" />
      {/* Left original geometry shape */}
      <path d="M6 10 L12 10 L12 22 L6 22 Z" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
      {/* Right mirrored geometry shape */}
      <path d="M26 10 L20 10 L20 22 L26 22 Z" fill="#fde68a" stroke="#d97706" strokeWidth="1" />
      {/* Horizontal bidirectional reflection arrow */}
      <line x1="10" y1="16" x2="22" y2="16" stroke="#ef4444" strokeWidth="1.5" />
      <polygon points="10,16 13,14 13,18" fill="#ef4444" />
      <polygon points="22,16 19,14 19,18" fill="#ef4444" />
    </svg>
  );
}

export function RollIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Rotary cylinder mandrel */}
      <ellipse cx="16" cy="10" rx="8" ry="4" fill="#93c5fd" stroke="#0284c7" strokeWidth="1.2" />
      <path d="M8 10 V 22 A 8 4 0 0 0 24 22 V 10" fill="#60a5fa" stroke="#0284c7" strokeWidth="1.2" />
      {/* Circumferential wrap/roll arrow */}
      <path d="M6 16 C 6 22 26 22 26 14" stroke="#d97706" strokeWidth="2" fill="none" strokeLinecap="round" />
      <polygon points="26,14 23,17 27,18" fill="#d97706" />
    </svg>
  );
}

// ==================== 2. OFFSET GROUP ====================

export function OffsetEntityIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Original wireframe entity bar */}
      <line x1="8" y1="5" x2="8" y2="27" stroke="#0f172a" strokeWidth="2.4" strokeLinecap="round" />
      {/* Offset parallel entity line */}
      <line x1="22" y1="5" x2="22" y2="27" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" />
      {/* Bidirectional offset dimension arrow */}
      <line x1="8" y1="16" x2="22" y2="16" stroke="#d97706" strokeWidth="1.8" />
      <polygon points="8,16 12,14 12,18" fill="#d97706" />
      <polygon points="22,16 18,14 18,18" fill="#d97706" />
    </svg>
  );
}

export function OffsetChainsIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Original tangent profile chain */}
      <path d="M5 24 Q 14 24 16 16 T 27 8" stroke="#0f172a" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {/* Offset parallel chain profile */}
      <path d="M8 28 Q 17 28 20 19 T 30 11" stroke="#0284c7" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="3,1.5" />
      {/* Offset distance arrows between chains */}
      <line x1="12" y1="21" x2="15" y2="24" stroke="#d97706" strokeWidth="1.5" />
      <polygon points="15,24 13,22 15,22" fill="#d97706" />
    </svg>
  );
}

// ==================== 3. LAYOUT GROUP ====================

export function GeometryNestingIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Stock sheet metal boundary */}
      <rect x="2" y="2" width="16" height="16" rx="1" fill="#f8fafc" stroke="#475569" strokeWidth="1.2" />
      {/* Nested part 1 (L-bracket) */}
      <polygon points="4,4 10,4 10,7 7,7 7,12 4,12" fill="#0284c7" />
      {/* Nested part 2 (Interlocking bracket) */}
      <polygon points="11,6 16,6 16,14 13,14 13,9 11,9" fill="#10b981" />
      {/* Nested part 3 (Small plate) */}
      <rect x="5" y="14" width="6" height="3" fill="#f59e0b" />
    </svg>
  );
}

export function RectangularArrayIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* 2x2 Matrix Grid of Coordinate Blocks */}
      <rect x="3" y="3" width="5" height="5" rx="0.5" fill="#0284c7" stroke="#0369a1" strokeWidth="0.8" />
      <rect x="12" y="3" width="5" height="5" rx="0.5" fill="#0284c7" stroke="#0369a1" strokeWidth="0.8" />
      <rect x="3" y="12" width="5" height="5" rx="0.5" fill="#0284c7" stroke="#0369a1" strokeWidth="0.8" />
      <rect x="12" y="12" width="5" height="5" rx="0.5" fill="#0284c7" stroke="#0369a1" strokeWidth="0.8" />
      {/* Connecting grid pitch lines */}
      <line x1="8" y1="5.5" x2="12" y2="5.5" stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="1,1" />
      <line x1="5.5" y1="8" x2="5.5" y2="12" stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="1,1" />
    </svg>
  );
}

export function DistributeIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Equal spacing distribution blocks */}
      <rect x="2" y="5" width="3" height="10" rx="0.5" fill="#0284c7" />
      <rect x="8.5" y="5" width="3" height="10" rx="0.5" fill="#0284c7" />
      <rect x="15" y="5" width="3" height="10" rx="0.5" fill="#0284c7" />
      {/* Spacing arrows */}
      <line x1="5" y1="10" x2="8.5" y2="10" stroke="#f59e0b" strokeWidth="1" />
      <line x1="11.5" y1="10" x2="15" y2="10" stroke="#f59e0b" strokeWidth="1" />
      <polygon points="5,10 6.5,9 6.5,11" fill="#f59e0b" />
      <polygon points="8.5,10 7,9 7,11" fill="#f59e0b" />
      <polygon points="11.5,10 13,9 13,11" fill="#f59e0b" />
      <polygon points="15,10 13.5,9 13.5,11" fill="#f59e0b" />
    </svg>
  );
}

// ==================== 4. SIZE GROUP ====================

export function StretchIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Original boundary rectangle */}
      <rect x="5" y="8" width="12" height="16" rx="1" fill="#fde68a" stroke="#d97706" strokeWidth="1.2" />
      {/* Stretched right boundary with dashed extension */}
      <rect x="17" y="8" width="8" height="16" rx="1" fill="none" stroke="#0284c7" strokeWidth="1.2" strokeDasharray="2,2" />
      {/* Horizontal stretch arrow */}
      <line x1="14" y1="16" x2="27" y2="16" stroke="#0284c7" strokeWidth="2.2" />
      <polygon points="27,16 23,13 23,19" fill="#0284c7" />
      {/* Vertical dimension reference line */}
      <line x1="5" y1="5" x2="5" y2="27" stroke="#475569" strokeWidth="1" />
    </svg>
  );
}

export function ScaleIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Smaller original square */}
      <rect x="7" y="15" width="8" height="8" rx="0.5" fill="#93c5fd" stroke="#0284c7" strokeWidth="1" />
      {/* Scaled expanding outer golden square */}
      <rect x="7" y="7" width="18" height="18" rx="1" fill="none" stroke="#d97706" strokeWidth="1.5" />
      {/* Diagonal 45 degree expansion vector arrow */}
      <line x1="15" y1="15" x2="25" y2="7" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
      <polygon points="25,7 21,7 25,11" fill="#ef4444" />
    </svg>
  );
}

// ==================== EXPORT MAP ====================

export const TRANSFORM_ICON_MAP = {
  Dynamic: DynamicIcon,
  Translate: TranslateIcon,
  Rotate: RotateIcon,
  Project: ProjectIcon,
  MoveToOrigin: MoveToOriginIcon,
  Mirror: MirrorIcon,
  Roll: RollIcon,
  OffsetEntity: OffsetEntityIcon,
  OffsetChains: OffsetChainsIcon,
  GeometryNesting: GeometryNestingIcon,
  RectangularArray: RectangularArrayIcon,
  Distribute: DistributeIcon,
  Stretch: StretchIcon,
  Scale: ScaleIcon
};
