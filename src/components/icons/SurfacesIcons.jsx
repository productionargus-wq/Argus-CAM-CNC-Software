import React from 'react';

/**
 * Authentic vector icons for Mastercam 2018 Surfaces tab
 * Styled with golden sand gradients, isometric projections, and sharp CAD vectors.
 */

// Common colors for authentic Mastercam CAD styling
const GOLD_TOP = '#ecd599';
const GOLD_MID = '#d8af5c';
const GOLD_BASE = '#b88934';
const GOLD_DARK = '#8e621c';

// ==================== 1. SIMPLE GROUP ====================

export function CylinderIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <defs>
        <linearGradient id="mc_cyl_side" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={GOLD_TOP} />
          <stop offset="35%" stopColor={GOLD_MID} />
          <stop offset="75%" stopColor={GOLD_BASE} />
          <stop offset="100%" stopColor={GOLD_DARK} />
        </linearGradient>
        <linearGradient id="mc_cyl_top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff3d1" />
          <stop offset="100%" stopColor={GOLD_MID} />
        </linearGradient>
      </defs>
      {/* Body */}
      <path d="M7 9v14c0 3 4 5 9 5s9-2 9-5V9H7z" fill="url(#mc_cyl_side)" stroke={GOLD_DARK} strokeWidth="1" />
      {/* Bottom curved seam */}
      <ellipse cx="16" cy="23" rx="9" ry="4.5" fill="none" stroke={GOLD_DARK} strokeWidth="0.8" opacity="0.6" />
      {/* Top cap */}
      <ellipse cx="16" cy="9" rx="9" ry="4.5" fill="url(#mc_cyl_top)" stroke={GOLD_DARK} strokeWidth="1" />
    </svg>
  );
}

export function BlockIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Top Face */}
      <polygon points="16,5 28,11 16,17 4,11" fill="#fde68a" stroke="#b45309" strokeWidth="1" />
      {/* Left Face */}
      <polygon points="4,11 16,17 16,27 4,21" fill="#d97706" stroke="#b45309" strokeWidth="1" />
      {/* Right Face */}
      <polygon points="16,17 28,11 28,21 16,27" fill="#b45309" stroke="#78350f" strokeWidth="1" />
      {/* Wire edges */}
      <line x1="16" y1="17" x2="16" y2="27" stroke="#78350f" strokeWidth="1.2" />
    </svg>
  );
}

export function SphereIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <defs>
        <radialGradient id="mc_sph_grad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="40%" stopColor="#eab308" />
          <stop offset="85%" stopColor="#ca8a04" />
          <stop offset="100%" stopColor="#854d0e" />
        </radialGradient>
      </defs>
      <circle cx="10" cy="10" r="8" fill="url(#mc_sph_grad)" stroke="#854d0e" strokeWidth="0.8" />
      {/* Specular highlight */}
      <ellipse cx="7" cy="7" rx="3" ry="2" fill="#ffffff" opacity="0.45" />
    </svg>
  );
}

export function ConeIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <defs>
        <linearGradient id="mc_cone_grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="45%" stopColor="#eab308" />
          <stop offset="80%" stopColor="#ca8a04" />
          <stop offset="100%" stopColor="#854d0e" />
        </linearGradient>
      </defs>
      {/* Cone Body */}
      <path d="M10 2 L17 15 C17 17 13.8 18 10 18 C6.2 18 3 17 3 15 Z" fill="url(#mc_cone_grad)" stroke="#854d0e" strokeWidth="0.8" />
      {/* Base ellipse line */}
      <ellipse cx="10" cy="15" rx="7" ry="2.5" fill="none" stroke="#713f12" strokeWidth="0.7" opacity="0.6" />
    </svg>
  );
}

export function TorusIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <defs>
        <radialGradient id="mc_torus_grad" cx="50%" cy="40%" r="55%">
          <stop offset="20%" stopColor="#fef08a" />
          <stop offset="60%" stopColor="#eab308" />
          <stop offset="90%" stopColor="#ca8a04" />
          <stop offset="100%" stopColor="#713f12" />
        </radialGradient>
      </defs>
      {/* Outer torus ring */}
      <ellipse cx="10" cy="10" rx="8" ry="5.5" fill="url(#mc_torus_grad)" stroke="#854d0e" strokeWidth="0.8" />
      {/* Inner hole */}
      <ellipse cx="10" cy="10" rx="3.5" ry="2.2" fill="#ffffff" stroke="#854d0e" strokeWidth="0.8" />
    </svg>
  );
}

// ==================== 2. CREATE GROUP ====================

export function FromSolidIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Wireframe solid cube with top extracted sheet */}
      {/* Lower cube wire */}
      <polygon points="16,14 26,19 16,24 6,19" fill="#f8fafc" stroke="#3b82f6" strokeWidth="1" strokeDasharray="2,2" opacity="0.7" />
      <line x1="6" y1="19" x2="6" y2="25" stroke="#3b82f6" strokeWidth="1" />
      <line x1="26" y1="19" x2="26" y2="25" stroke="#3b82f6" strokeWidth="1" />
      <line x1="16" y1="24" x2="16" y2="30" stroke="#3b82f6" strokeWidth="1" />
      <polygon points="6,25 16,30 26,25 16,20" fill="none" stroke="#3b82f6" strokeWidth="1" />
      
      {/* Extracted Surface Sheet (Gold floating top face) */}
      <polygon points="16,4 27,9 17,14 6,9" fill="#fbbf24" stroke="#d97706" strokeWidth="1.2" />
      <line x1="11" y1="6.5" x2="21.5" y2="11.5" stroke="#b45309" strokeWidth="0.8" strokeDasharray="1.5,1.5" />
      <line x1="21.5" y1="6.5" x2="11.5" y2="11.5" stroke="#b45309" strokeWidth="0.8" strokeDasharray="1.5,1.5" />
      {/* Lifting arrows */}
      <path d="M16 17 L16 14" stroke="#0284c7" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 15.5 L16 13.5 L18 15.5" stroke="#0284c7" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function FlatBoundaryIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Planar surface grid with curved corner cutout */}
      <path
        d="M5 6 H22 C26 6 27 10 27 15 V26 H5 Z"
        fill="#fef3c7"
        stroke="#d97706"
        strokeWidth="1.2"
      />
      {/* UV Grid lines */}
      <line x1="11" y1="6" x2="11" y2="26" stroke="#b45309" strokeWidth="0.8" />
      <line x1="17" y1="6" x2="17" y2="26" stroke="#b45309" strokeWidth="0.8" />
      <line x1="22" y1="6" x2="22" y2="26" stroke="#b45309" strokeWidth="0.8" strokeDasharray="2,2" />
      
      <line x1="5" y1="12" x2="26" y2="12" stroke="#b45309" strokeWidth="0.8" />
      <line x1="5" y1="18" x2="27" y2="18" stroke="#b45309" strokeWidth="0.8" />
      <line x1="5" y1="23" x2="27" y2="23" stroke="#b45309" strokeWidth="0.8" />
      {/* Bold boundary curve */}
      <path d="M22 6 C26 6 27 10 27 15" stroke="#b45309" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function LoftIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Loft Surface blending across multiple profile ribs */}
      <path
        d="M5 8 C12 6 20 10 27 8 L27 24 C20 22 12 26 5 24 Z"
        fill="#fde68a"
        stroke="#d97706"
        strokeWidth="1.2"
      />
      {/* Guide Rails */}
      <path d="M5 8 C12 6 20 10 27 8" stroke="#b45309" strokeWidth="1.5" />
      <path d="M5 24 C12 22 20 26 5 24" stroke="#b45309" strokeWidth="1.5" />
      {/* Loft cross ribs */}
      <line x1="12" y1="7" x2="12" y2="23" stroke="#b45309" strokeWidth="0.9" />
      <line x1="19" y1="8.5" x2="19" y2="24" stroke="#b45309" strokeWidth="0.9" />
      <line x1="5" y1="16" x2="27" y2="16" stroke="#d97706" strokeWidth="0.7" strokeDasharray="2,1.5" />
    </svg>
  );
}

export function ExtrudeIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Extruded cylinder shell with blue vector arrow */}
      <ellipse cx="10" cy="15" rx="6" ry="2.5" fill="#fde68a" stroke="#d97706" strokeWidth="0.8" />
      <path d="M4 8 v7 c0 1.5 2.7 2.5 6 2.5 s6-1 6-2.5 V8 Z" fill="#fde68a" stroke="#d97706" strokeWidth="0.8" />
      <ellipse cx="10" cy="8" rx="6" ry="2.5" fill="#fef08a" stroke="#d97706" strokeWidth="0.8" />
      {/* Upward blue arrow */}
      <path d="M10 13 L10 3" stroke="#0284c7" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8 5 L10 2.5 L12 5" stroke="#0284c7" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SweepIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Swept surface ribbon with red guide trajectory */}
      <path d="M3 16 C6 12 12 16 16 10 L18 12 C13 18 7 14 4 18 Z" fill="#fde68a" stroke="#d97706" strokeWidth="0.8" />
      {/* Swept red centerline */}
      <path d="M2 17 C6 10 13 15 18 8" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function RevolveIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Half-revolved dome surface */}
      <path d="M10 3 C14 3 17 8 17 15 H10 Z" fill="#fde68a" stroke="#d97706" strokeWidth="0.8" />
      <line x1="10" y1="2" x2="10" y2="18" stroke="#64748b" strokeWidth="1" strokeDasharray="2,1" />
      {/* Circular revolution arrow */}
      <path d="M7 16 C5 14 5 10 7 7" stroke="#0284c7" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M8 8 L7 6.5 L5.5 8" stroke="#0284c7" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

export function DraftIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Tapered trapezoid prism */}
      <polygon points="7,4 13,4 17,16 3,16" fill="#fde68a" stroke="#d97706" strokeWidth="0.9" />
      <line x1="5" y1="10" x2="15" y2="10" stroke="#d97706" strokeWidth="0.7" strokeDasharray="1.5,1.5" />
      {/* Angular draft indicator */}
      <line x1="3" y1="16" x2="3" y2="4" stroke="#94a3b8" strokeWidth="0.7" strokeDasharray="1.5,1.5" />
      <path d="M3 8 A 6 6 0 0 1 6 7" stroke="#ef4444" strokeWidth="1" fill="none" />
    </svg>
  );
}

export function NetIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* 4-sided Coons UV net mesh */}
      <rect x="3" y="3" width="14" height="14" rx="1" fill="#fef3c7" stroke="#d97706" strokeWidth="0.9" />
      <line x1="3" y1="7.5" x2="17" y2="7.5" stroke="#b45309" strokeWidth="0.7" />
      <line x1="3" y1="12.5" x2="17" y2="12.5" stroke="#b45309" strokeWidth="0.7" />
      <line x1="7.5" y1="3" x2="7.5" y2="17" stroke="#b45309" strokeWidth="0.7" />
      <line x1="12.5" y1="3" x2="12.5" y2="17" stroke="#b45309" strokeWidth="0.7" />
    </svg>
  );
}

export function OffsetIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Two parallel offset surface sheets */}
      <path d="M3 15 C7 11 13 14 17 11" stroke="#d97706" strokeWidth="1.2" fill="none" />
      <path d="M3 9 C7 5 13 8 17 5" stroke="#b45309" strokeWidth="1.4" fill="none" />
      {/* Offset arrow */}
      <line x1="10" y1="12" x2="10" y2="7" stroke="#0284c7" strokeWidth="1.3" />
      <polygon points="8.5,8.5 10,6.5 11.5,8.5" fill="#0284c7" />
    </svg>
  );
}

// ==================== 3. MODIFY GROUP ====================

export function TrimCurvesIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Golden circular surface patch with crosslines inside an outer ring */}
      <circle cx="16" cy="16" r="13" fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2" />
      <circle cx="16" cy="16" r="10" fill="#fde68a" stroke="#d97706" strokeWidth="1.2" />
      {/* Trim Crosslines */}
      <line x1="16" y1="6" x2="16" y2="26" stroke="#b45309" strokeWidth="1" />
      <line x1="6" y1="16" x2="26" y2="16" stroke="#b45309" strokeWidth="1" />
      {/* Scissors accent */}
      <path d="M22 6 L26 10 M26 6 L22 10" stroke="#ef4444" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function FillHolesIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Square surface grid with filled center circular hole */}
      <rect x="5" y="5" width="22" height="22" fill="#f8fafc" stroke="#64748b" strokeWidth="1" />
      {/* Grid lines */}
      <line x1="12" y1="5" x2="12" y2="27" stroke="#cbd5e1" strokeWidth="0.8" />
      <line x1="19" y1="5" x2="19" y2="27" stroke="#cbd5e1" strokeWidth="0.8" />
      <line x1="5" y1="12" x2="27" y2="12" stroke="#cbd5e1" strokeWidth="0.8" />
      <line x1="5" y1="19" x2="27" y2="19" stroke="#cbd5e1" strokeWidth="0.8" />
      {/* Filled golden hole patch */}
      <circle cx="16" cy="16" r="6.5" fill="#fbbf24" stroke="#d97706" strokeWidth="1.4" />
      <ellipse cx="16" cy="16" rx="4.5" ry="4.5" fill="none" stroke="#b45309" strokeWidth="0.6" strokeDasharray="1.5,1.5" />
    </svg>
  );
}

export function ExtendIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Surface sheet with extending arrow pointing right */}
      <rect x="5" y="8" width="13" height="16" fill="#fde68a" stroke="#d97706" strokeWidth="1.2" />
      {/* Extended dotted ghost sheet */}
      <rect x="18" y="8" width="8" height="16" fill="#fef3c7" stroke="#d97706" strokeWidth="1" strokeDasharray="2,2" opacity="0.8" />
      {/* Strong horizontal black/dark extending arrow */}
      <path d="M12 16 H24" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M20 12.5 L24.5 16 L20 19.5" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FilletSurfacesIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Two angled surface sheets connected by smooth curved fillet strip */}
      <polygon points="5,7 13,7 13,17 5,17" fill="#fde68a" stroke="#d97706" strokeWidth="1" />
      <polygon points="17,17 27,17 27,25 17,25" fill="#fde68a" stroke="#d97706" strokeWidth="1" />
      {/* Smooth transitional fillet blend */}
      <path
        d="M13 7 C21 7 21 17 27 17"
        stroke="#b45309"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M13 15 C17 15 17 23 27 23"
        stroke="#d97706"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}

export function TwoSurfaceBlendIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Two stepped surface lines blended by a central strip */}
      <line x1="2" y1="6" x2="7" y2="6" stroke="#d97706" strokeWidth="1.4" />
      <line x1="13" y1="14" x2="18" y2="14" stroke="#d97706" strokeWidth="1.4" />
      <path d="M7 6 C10 6 10 14 13 14" stroke="#60a5fa" strokeWidth="1.8" />
    </svg>
  );
}

export function ThreeSurfaceBlendIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Three surface patches converging with blend */}
      <polygon points="4,4 10,8 4,12" fill="#fde68a" stroke="#d97706" strokeWidth="0.8" />
      <polygon points="16,4 10,8 16,12" fill="#fde68a" stroke="#d97706" strokeWidth="0.8" />
      <polygon points="10,8 14,16 6,16" fill="#fde68a" stroke="#d97706" strokeWidth="0.8" />
      <circle cx="10" cy="8.5" r="2" fill="#a855f7" />
    </svg>
  );
}

export function ThreeFilletBlendIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Three fillets meeting at a corner ball vertex blend */}
      <line x1="10" y1="10" x2="3" y2="5" stroke="#d97706" strokeWidth="1.5" />
      <line x1="10" y1="10" x2="17" y2="5" stroke="#d97706" strokeWidth="1.5" />
      <line x1="10" y1="10" x2="10" y2="18" stroke="#d97706" strokeWidth="1.5" />
      <circle cx="10" cy="10" r="3" fill="#f59e0b" stroke="#78350f" strokeWidth="0.8" />
    </svg>
  );
}

export function UntrimIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Untrim: rectangular sheet with dashed cut loop restored */}
      <rect x="3" y="3" width="14" height="14" fill="#fef3c7" stroke="#d97706" strokeWidth="0.9" />
      <circle cx="10" cy="10" r="4" stroke="#ef4444" strokeWidth="1" strokeDasharray="1.5,1.5" fill="none" />
      <path d="M14 6 L17 3 M14 3 L17 6" stroke="#10b981" strokeWidth="1" />
    </svg>
  );
}

export function RemoveBoundaryIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Surface with scalloped/gear hole boundary removal */}
      <rect x="3" y="3" width="14" height="14" fill="#fef3c7" stroke="#d97706" strokeWidth="0.9" />
      <circle cx="10" cy="10" r="4" stroke="#ef4444" strokeWidth="1.2" fill="#ffffff" />
      <line x1="8" y1="8" x2="12" y2="12" stroke="#ef4444" strokeWidth="1.2" />
      <line x1="12" y1="8" x2="8" y2="12" stroke="#ef4444" strokeWidth="1.2" />
    </svg>
  );
}

export function SplitIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Tan surface patch split by a horizontal seam curve */}
      <rect x="3" y="3" width="14" height="6.5" fill="#fde68a" stroke="#d97706" strokeWidth="0.8" />
      <rect x="3" y="10.5" width="14" height="6.5" fill="#fde68a" stroke="#d97706" strokeWidth="0.8" />
      <line x1="2" y1="10" x2="18" y2="10" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="2,1" />
    </svg>
  );
}

// ==================== 4. NORMALS GROUP ====================

export function NormalsChangeIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Surface patch with normal vector arrows flipping / two curved arrows */}
      <ellipse cx="10" cy="14" rx="7" ry="2.5" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.7" />
      <path d="M6 10 C6 6 10 4 14 6" stroke="#0284c7" strokeWidth="1.3" fill="none" />
      <path d="M14 6 L12 4 M14 6 L12 8" stroke="#0284c7" strokeWidth="1.2" />
      <path d="M14 10 C14 14 10 16 6 14" stroke="#0284c7" strokeWidth="1.3" fill="none" />
      <path d="M6 14 L8 12 M6 14 L8 16" stroke="#0284c7" strokeWidth="1.2" />
    </svg>
  );
}

export function NormalsSetIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Surface patch with single normal vector arrow pointing up */}
      <ellipse cx="10" cy="15" rx="7" ry="2.5" fill="#fde68a" stroke="#d97706" strokeWidth="0.8" />
      <line x1="10" y1="15" x2="10" y2="4" stroke="#10b981" strokeWidth="1.8" />
      <polygon points="7.5,6.5 10,2.5 12.5,6.5" fill="#10b981" />
    </svg>
  );
}

export function NormalsOrientIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Grid of patches with aligned normal arrows */}
      <polygon points="3,15 10,12 17,15 10,18" fill="#fde68a" stroke="#d97706" strokeWidth="0.7" />
      <line x1="7" y1="14" x2="7" y2="6" stroke="#f59e0b" strokeWidth="1.4" />
      <polygon points="5.5,7.5 7,4.5 8.5,7.5" fill="#f59e0b" />
      <line x1="13" y1="14" x2="13" y2="6" stroke="#f59e0b" strokeWidth="1.4" />
      <polygon points="11.5,7.5 13,4.5 14.5,7.5" fill="#f59e0b" />
    </svg>
  );
}

// Icon dictionary mapped to config IDs
export const SURFACES_ICON_MAP = {
  Cylinder: CylinderIcon,
  Block: BlockIcon,
  Sphere: SphereIcon,
  Cone: ConeIcon,
  Torus: TorusIcon,
  FromSolid: FromSolidIcon,
  FlatBoundary: FlatBoundaryIcon,
  Loft: LoftIcon,
  Extrude: ExtrudeIcon,
  Sweep: SweepIcon,
  Revolve: RevolveIcon,
  Draft: DraftIcon,
  Net: NetIcon,
  Offset: OffsetIcon,
  TrimCurves: TrimCurvesIcon,
  FillHoles: FillHolesIcon,
  Extend: ExtendIcon,
  FilletSurfaces: FilletSurfacesIcon,
  TwoSurfaceBlend: TwoSurfaceBlendIcon,
  ThreeSurfaceBlend: ThreeSurfaceBlendIcon,
  ThreeFilletBlend: ThreeFilletBlendIcon,
  Untrim: UntrimIcon,
  RemoveBoundary: RemoveBoundaryIcon,
  Split: SplitIcon,
  NormalsChange: NormalsChangeIcon,
  NormalsSet: NormalsSetIcon,
  NormalsOrient: NormalsOrientIcon
};
