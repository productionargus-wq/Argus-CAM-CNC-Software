import React from 'react';

/**
 * Authentic vector icons for Mastercam 2018 SOLIDS tab
 * Distinctive solid CAD blue shading, CSG boolean assemblies, chamfers, and drawing layouts.
 */

// Common Solid CAD Blue Palette
const BLUE_TOP = '#7dd3fc';
const BLUE_MID = '#0284c7';
const BLUE_BASE = '#0369a1';
const BLUE_DARK = '#075985';

// ==================== 1. SIMPLE GROUP ====================

export function SolidCylinderIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <defs>
        <linearGradient id="mc_solid_cyl_side" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={BLUE_TOP} />
          <stop offset="35%" stopColor={BLUE_MID} />
          <stop offset="75%" stopColor={BLUE_BASE} />
          <stop offset="100%" stopColor={BLUE_DARK} />
        </linearGradient>
        <linearGradient id="mc_solid_cyl_top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#bae6fd" />
          <stop offset="100%" stopColor={BLUE_MID} />
        </linearGradient>
      </defs>
      {/* Body */}
      <path d="M7 9v14c0 3 4 5 9 5s9-2 9-5V9H7z" fill="url(#mc_solid_cyl_side)" stroke={BLUE_DARK} strokeWidth="1" />
      {/* Bottom subtle edge */}
      <ellipse cx="16" cy="23" rx="9" ry="4.5" fill="none" stroke={BLUE_DARK} strokeWidth="0.8" opacity="0.5" />
      {/* Top cap */}
      <ellipse cx="16" cy="9" rx="9" ry="4.5" fill="url(#mc_solid_cyl_top)" stroke={BLUE_DARK} strokeWidth="1" />
    </svg>
  );
}

export function SolidBlockIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Top Face */}
      <polygon points="16,5 28,11 16,17 4,11" fill="#38bdf8" stroke="#0369a1" strokeWidth="1" />
      {/* Left Face */}
      <polygon points="4,11 16,17 16,27 4,21" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
      {/* Right Face */}
      <polygon points="16,17 28,11 28,21 16,27" fill="#0369a1" stroke="#075985" strokeWidth="1" />
      {/* Center edge */}
      <line x1="16" y1="17" x2="16" y2="27" stroke="#075985" strokeWidth="1.2" />
    </svg>
  );
}

export function SolidSphereIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <defs>
        <radialGradient id="mc_solid_sph_grad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#bae6fd" />
          <stop offset="40%" stopColor="#0284c7" />
          <stop offset="85%" stopColor="#0369a1" />
          <stop offset="100%" stopColor="#082f49" />
        </radialGradient>
      </defs>
      <circle cx="10" cy="10" r="8" fill="url(#mc_solid_sph_grad)" stroke="#0369a1" strokeWidth="0.8" />
      <ellipse cx="7" cy="7" rx="3" ry="2" fill="#ffffff" opacity="0.45" />
    </svg>
  );
}

export function SolidConeIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <defs>
        <linearGradient id="mc_solid_cone_grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="45%" stopColor="#0284c7" />
          <stop offset="80%" stopColor="#0369a1" />
          <stop offset="100%" stopColor="#0c4a6e" />
        </linearGradient>
      </defs>
      <path d="M10 2 L17 15 C17 17 13.8 18 10 18 C6.2 18 3 17 3 15 Z" fill="url(#mc_solid_cone_grad)" stroke="#0369a1" strokeWidth="0.8" />
      <ellipse cx="10" cy="15" rx="7" ry="2.5" fill="none" stroke="#075985" strokeWidth="0.7" opacity="0.6" />
    </svg>
  );
}

export function SolidTorusIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <defs>
        <radialGradient id="mc_solid_torus_grad" cx="50%" cy="40%" r="55%">
          <stop offset="20%" stopColor="#7dd3fc" />
          <stop offset="60%" stopColor="#0284c7" />
          <stop offset="90%" stopColor="#0369a1" />
          <stop offset="100%" stopColor="#082f49" />
        </radialGradient>
      </defs>
      <ellipse cx="10" cy="10" rx="8" ry="5.5" fill="url(#mc_solid_torus_grad)" stroke="#0369a1" strokeWidth="0.8" />
      <ellipse cx="10" cy="10" rx="3.5" ry="2.2" fill="#ffffff" stroke="#0369a1" strokeWidth="0.8" />
    </svg>
  );
}

// ==================== 2. CREATE GROUP ====================

export function SolidExtrudeIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Golden base profile */}
      <path d="M6 18 v6 c0 2.5 4.5 4 10 4 s10-1.5 10-4 v-6 Z" fill="#fde68a" stroke="#d97706" strokeWidth="1" />
      <ellipse cx="16" cy="18" rx="10" ry="4" fill="#fde68a" stroke="#d97706" strokeWidth="1" />
      
      {/* Extruded Blue Upper Solid Body */}
      <path d="M6 8 v10 c0 2.5 4.5 4 10 4 s10-1.5 10-4 V8 Z" fill="#0284c7" stroke="#0369a1" strokeWidth="1" opacity="0.9" />
      <ellipse cx="16" cy="8" rx="10" ry="4" fill="#38bdf8" stroke="#0369a1" strokeWidth="1" />
      
      {/* Strong Vertical Extrusion Vector Arrow */}
      <path d="M22 17 L22 4" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />
      <polygon points="19,6 22,2 25,6" fill="#0f172a" />
    </svg>
  );
}

export function SolidRevolveIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Revolved cylinder with circular arrow */}
      <ellipse cx="10" cy="6" rx="6" ry="2.5" fill="#38bdf8" stroke="#0284c7" strokeWidth="0.8" />
      <path d="M4 6 v8 c0 1.5 2.7 2.5 6 2.5 s6-1 6-2.5 V6 Z" fill="#0284c7" stroke="#0369a1" strokeWidth="0.8" />
      <ellipse cx="10" cy="14" rx="6" ry="2.5" fill="none" stroke="#0369a1" strokeWidth="0.6" strokeDasharray="1.5,1.5" />
      {/* Circular revolution arrow */}
      <path d="M7 6 C5 4 5 2 10 2 C13 2 15 3 15 5" stroke="#0f172a" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <polygon points="14,3.5 16,5 14,6.5" fill="#0f172a" />
    </svg>
  );
}

export function SolidLoftIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Loft transitional shape blending two profiles */}
      <polygon points="4,16 16,16 13,4 7,4" fill="#0284c7" stroke="#0369a1" strokeWidth="0.9" />
      <ellipse cx="10" cy="4" rx="3" ry="1.2" fill="#38bdf8" stroke="#0369a1" strokeWidth="0.8" />
      <ellipse cx="10" cy="16" rx="6" ry="2" fill="#0369a1" stroke="#075985" strokeWidth="0.8" />
      <line x1="7" y1="4" x2="4" y2="16" stroke="#bae6fd" strokeWidth="0.8" />
      <line x1="13" y1="4" x2="16" y2="16" stroke="#bae6fd" strokeWidth="0.8" />
    </svg>
  );
}

export function SolidSweepIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Curved swept solid tube */}
      <path d="M3 15 C6 11 12 15 16 9 L18 11 C13 17 7 13 4 17 Z" fill="#0284c7" stroke="#0369a1" strokeWidth="0.8" />
      <ellipse cx="3.5" cy="16" rx="1.5" ry="2" fill="#38bdf8" stroke="#0369a1" strokeWidth="0.8" />
      <ellipse cx="17" cy="10" rx="1.5" ry="2" fill="#38bdf8" stroke="#0369a1" strokeWidth="0.8" />
      {/* Guide trajectory */}
      <path d="M2 16 C6 9 13 14 18 7" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function SolidBooleanIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Two interlocking solid blocks: Blue block merged with Golden block */}
      {/* Golden base block */}
      <polygon points="12,12 24,6 24,18 12,24" fill="#d97706" stroke="#b45309" strokeWidth="1" />
      <polygon points="12,12 24,6 18,3 6,9" fill="#fde68a" stroke="#b45309" strokeWidth="1" />
      <polygon points="6,9 12,12 12,24 6,21" fill="#b45309" stroke="#78350f" strokeWidth="1" />
      
      {/* Interlocking Blue Solid Block */}
      <polygon points="16,14 28,8 28,22 16,28" fill="#0369a1" stroke="#075985" strokeWidth="1.2" />
      <polygon points="16,14 28,8 22,5 10,11" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.2" />
      <polygon points="10,11 16,14 16,28 10,25" fill="#0284c7" stroke="#0369a1" strokeWidth="1.2" />
    </svg>
  );
}

export function SolidImpressionIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Golden mold block with blue cavity stamp impression */}
      <polygon points="16,4 28,10 16,16 4,10" fill="#fde68a" stroke="#d97706" strokeWidth="1" />
      <polygon points="4,10 16,16 16,28 4,22" fill="#d97706" stroke="#b45309" strokeWidth="1" />
      <polygon points="16,16 28,10 28,22 16,28" fill="#b45309" stroke="#78350f" strokeWidth="1" />
      
      {/* Inset Blue Core Impression Stamp */}
      <polygon points="16,10 22,13 16,16 10,13" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
      <polygon points="10,13 16,16 16,21 10,18" fill="#0369a1" stroke="#075985" strokeWidth="1" />
      <polygon points="16,16 22,13 22,18 16,21" fill="#075985" stroke="#0c4a6e" strokeWidth="1" />
    </svg>
  );
}

export function RectPatternIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* 2x2 grid of blue square nodes with pattern line */}
      <rect x="3" y="3" width="4" height="4" fill="#0284c7" stroke="#0369a1" strokeWidth="0.8" />
      <rect x="13" y="3" width="4" height="4" fill="#0284c7" stroke="#0369a1" strokeWidth="0.8" />
      <rect x="3" y="13" width="4" height="4" fill="#0284c7" stroke="#0369a1" strokeWidth="0.8" />
      <rect x="13" y="13" width="4" height="4" fill="#0284c7" stroke="#0369a1" strokeWidth="0.8" />
      <line x1="7" y1="5" x2="13" y2="5" stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="1.5,1.5" />
      <line x1="5" y1="7" x2="5" y2="13" stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="1.5,1.5" />
      <line x1="7" y1="15" x2="13" y2="15" stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="1.5,1.5" />
      <line x1="15" y1="7" x2="15" y2="13" stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="1.5,1.5" />
    </svg>
  );
}

export function CircPatternIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Circular pattern of blue dots around center */}
      <circle cx="10" cy="10" r="6" stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="2,1.5" fill="none" />
      <circle cx="10" cy="4" r="2" fill="#0284c7" />
      <circle cx="16" cy="10" r="2" fill="#0284c7" />
      <circle cx="10" cy="16" r="2" fill="#0284c7" />
      <circle cx="4" cy="10" r="2" fill="#0284c7" />
      <circle cx="10" cy="10" r="1" fill="#f59e0b" />
    </svg>
  );
}

export function ManualPatternIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Irregular / Coordinate Points Pattern */}
      <circle cx="4" cy="15" r="2" fill="#0284c7" />
      <circle cx="12" cy="13" r="2" fill="#0284c7" />
      <circle cx="16" cy="5" r="2" fill="#0284c7" />
      <polyline points="4,15 12,13 16,5" stroke="#64748b" strokeWidth="0.8" strokeDasharray="2,2" />
    </svg>
  );
}

export function FromSurfacesIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Stitched surface mesh into watertight solid */}
      <polygon points="16,5 28,11 16,17 4,11" fill="#fde68a" stroke="#d97706" strokeWidth="1" />
      <polygon points="4,11 16,17 16,27 4,21" fill="#d97706" stroke="#b45309" strokeWidth="1" />
      <polygon points="16,17 28,11 28,21 16,27" fill="#b45309" stroke="#78350f" strokeWidth="1" />
      {/* Stitching / Grid Net seams */}
      <line x1="10" y1="8" x2="22" y2="14" stroke="#78350f" strokeWidth="0.8" strokeDasharray="2,1" />
      <line x1="22" y1="8" x2="10" y2="14" stroke="#78350f" strokeWidth="0.8" strokeDasharray="2,1" />
      <line x1="10" y1="14" x2="10" y2="24" stroke="#78350f" strokeWidth="0.8" strokeDasharray="2,1" />
      <line x1="22" y1="14" x2="22" y2="24" stroke="#78350f" strokeWidth="0.8" strokeDasharray="2,1" />
    </svg>
  );
}

// ==================== 3. MODIFY GROUP ====================

export function ConstantFilletIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Golden solid block with smooth curved blue corner fillet */}
      <polygon points="6,24 6,10 18,10 26,16 26,24" fill="#d97706" stroke="#b45309" strokeWidth="1" />
      <polygon points="18,10 26,16 18,16" fill="#fde68a" stroke="#b45309" strokeWidth="0.8" />
      {/* Smooth Blue Cylindrical Corner Fillet */}
      <path
        d="M6 10 C14 10 18 14 18 22 L26 22 C26 14 20 8 10 8 Z"
        fill="#0284c7"
        stroke="#0369a1"
        strokeWidth="1.2"
      />
      <path
        d="M6 10 C14 10 18 14 18 22"
        stroke="#38bdf8"
        strokeWidth="2.2"
        fill="none"
      />
    </svg>
  );
}

export function OneDistanceChamferIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Golden solid block with 45° planar chamfer cut */}
      <polygon points="6,24 6,12 12,6 26,6 26,24" fill="#d97706" stroke="#b45309" strokeWidth="1" />
      <polygon points="6,12 12,6 20,6 14,12" fill="#0284c7" stroke="#0369a1" strokeWidth="1.2" />
      <polygon points="12,6 26,6 20,12 6,12" fill="#fde68a" stroke="#b45309" strokeWidth="0.8" opacity="0.7" />
      {/* Dimension marker "1" triangle */}
      <polygon points="18,18 24,18 24,24" fill="none" stroke="#0f172a" strokeWidth="1" />
      <text x="21" y="23" fontSize="8" fontWeight="bold" fill="#0f172a" fontFamily="sans-serif">1</text>
    </svg>
  );
}

export function ShellIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Hollow cube with thin walls */}
      <polygon points="10,3 17,7 10,11 3,7" fill="#fde68a" stroke="#d97706" strokeWidth="0.8" />
      <polygon points="3,7 10,11 10,17 3,13" fill="#d97706" stroke="#b45309" strokeWidth="0.8" />
      <polygon points="10,11 17,7 17,13 10,17" fill="#b45309" stroke="#78350f" strokeWidth="0.8" />
      {/* Hollow cavity cutout */}
      <polygon points="10,6 14,8.5 10,11 6,8.5" fill="#0f172a" opacity="0.65" stroke="#d97706" strokeWidth="0.7" />
    </svg>
  );
}

export function ThickenIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Surface sheet with bidirectional thicken arrow */}
      <polygon points="3,13 10,9 17,13 10,17" fill="#0284c7" stroke="#0369a1" strokeWidth="0.8" />
      <polygon points="3,7 10,3 17,7 10,11" fill="#38bdf8" stroke="#0369a1" strokeWidth="0.8" opacity="0.7" />
      {/* Bidirectional vertical thicken arrow */}
      <line x1="10" y1="5" x2="10" y2="15" stroke="#0f172a" strokeWidth="1.4" />
      <polygon points="8.5,7 10,4 11.5,7" fill="#0f172a" />
      <polygon points="8.5,13 10,16 11.5,13" fill="#0f172a" />
    </svg>
  );
}

export function SolidDraftIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Tapered prism with draft angle */}
      <polygon points="7,4 13,4 17,16 3,16" fill="#0284c7" stroke="#0369a1" strokeWidth="0.9" />
      <line x1="3" y1="16" x2="3" y2="4" stroke="#94a3b8" strokeWidth="0.7" strokeDasharray="1.5,1.5" />
      <path d="M3 8 A 6 6 0 0 1 6 7" stroke="#ef4444" strokeWidth="1" fill="none" />
    </svg>
  );
}

export function TrimByPlaneIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Cylinder sliced by planar knife blade */}
      <ellipse cx="16" cy="23" rx="9" ry="4.5" fill="#d97706" stroke="#b45309" strokeWidth="1" />
      <path d="M7 14 v9 c0 2.5 4 4.5 9 4.5 s9-2 9-4.5 V14 Z" fill="#fde68a" stroke="#d97706" strokeWidth="1" />
      
      {/* Inclined Planar Knife Blade */}
      <polygon points="4,18 24,6 28,10 8,22" fill="#0284c7" stroke="#0f172a" strokeWidth="1.2" opacity="0.85" />
      
      {/* Double-ended knife translation arrow */}
      <path d="M8 20 L24 8" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
      <polygon points="6,21 11,21 9,17" fill="#0f172a" />
      <polygon points="26,7 21,7 23,11" fill="#0f172a" />
    </svg>
  );
}

// ==================== 4. DRAWING GROUP ====================

export function DrawingLayoutIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* 2D Drawing Sheet Border Frame */}
      <rect x="4" y="4" width="24" height="24" rx="2" fill="#ffffff" stroke="#0284c7" strokeWidth="1.4" />
      <rect x="6" y="6" width="20" height="20" fill="none" stroke="#94a3b8" strokeWidth="0.6" strokeDasharray="1,1" />
      {/* Top View (Top Left Circle) */}
      <circle cx="11" cy="11" r="3" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
      {/* Front View (Bottom Left Rectangle) */}
      <rect x="8" y="18" width="6" height="5" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
      {/* Side View (Bottom Right Rectangle) */}
      <rect x="18" y="18" width="5" height="5" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
      {/* Isometric View (Top Right 3D Cube) */}
      <polygon points="21,9 25,11 21,13 17,11" fill="#7dd3fc" stroke="#0284c7" strokeWidth="0.8" />
      <polygon points="17,11 21,13 21,16 17,14" fill="#0284c7" stroke="#0369a1" strokeWidth="0.8" />
      <polygon points="21,13 25,11 25,14 21,16" fill="#0369a1" stroke="#075985" strokeWidth="0.8" />
    </svg>
  );
}

// Icon dictionary mapped to config IDs
export const SOLIDS_ICON_MAP = {
  SolidCylinder: SolidCylinderIcon,
  SolidBlock: SolidBlockIcon,
  SolidSphere: SolidSphereIcon,
  SolidCone: SolidConeIcon,
  SolidTorus: SolidTorusIcon,
  SolidExtrude: SolidExtrudeIcon,
  SolidRevolve: SolidRevolveIcon,
  SolidLoft: SolidLoftIcon,
  SolidSweep: SolidSweepIcon,
  SolidBoolean: SolidBooleanIcon,
  SolidImpression: SolidImpressionIcon,
  RectPattern: RectPatternIcon,
  CircPattern: CircPatternIcon,
  ManualPattern: ManualPatternIcon,
  FromSurfaces: FromSurfacesIcon,
  ConstantFillet: ConstantFilletIcon,
  OneDistanceChamfer: OneDistanceChamferIcon,
  Shell: ShellIcon,
  Thicken: ThickenIcon,
  SolidDraft: SolidDraftIcon,
  TrimByPlane: TrimByPlaneIcon,
  DrawingLayout: DrawingLayoutIcon
};
