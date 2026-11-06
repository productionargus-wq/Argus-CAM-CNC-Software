import React from 'react';

/**
 * Authentic vector CAD icons for Mastercam 2018 TOOLPATHS tab
 * 1:1 reproduction of 2D/3D/Multiaxis milling toolpaths, Dynamic Motion badges,
 * stock displays, and toolpath utilities.
 */

// Helper component for Mastercam's iconic Red Dynamic Motion badge
function DynamicMotionBadge({ x = 16, y = 16 }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle cx="5" cy="5" r="4.8" fill="#dc2626" />
      {/* Dynamic Motion White Arrow Curve */}
      <path d="M2.5 5 C 2.5 3 4 2.5 6 3.5 L 7 4.5" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <polygon points="8,4 6,5.5 5,3" fill="#ffffff" />
    </g>
  );
}

// ==================== 1. 2D GROUP ====================

export function Tp2dContourIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Beige machined rectangular workpiece */}
      <rect x="5" y="8" width="16" height="16" rx="1" fill="#fde68a" stroke="#d97706" strokeWidth="1" />
      {/* Blue contour cutter trajectory line around corner */}
      <path d="M21 8 H 25 C 27 8 27 10 27 12 V 24" stroke="#0284c7" strokeWidth="1.6" strokeLinecap="round" />
      {/* Cyan cutter circle at lead out */}
      <circle cx="21" cy="8" r="2.5" fill="#38bdf8" stroke="#0284c7" strokeWidth="0.8" />
      <circle cx="27" cy="24" r="2.5" fill="#38bdf8" stroke="#0284c7" strokeWidth="0.8" />
    </svg>
  );
}

export function Tp2dDrillIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Beige machined block with drilled hole */}
      <rect x="6" y="14" width="20" height="14" rx="1" fill="#fde68a" stroke="#d97706" strokeWidth="1" />
      <rect x="13.5" y="14" width="5" height="14" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.8" />
      {/* Twist drill bit shank & flutes */}
      <rect x="14" y="2" width="4" height="6" fill="#94a3b8" stroke="#64748b" strokeWidth="0.8" />
      <path d="M14 8 L 18 11 M14 11 L 18 14 M14 14 L 18 17 M14 17 L 18 20" stroke="#0284c7" strokeWidth="1" />
      {/* Drill point */}
      <polygon points="14,20 18,20 16,23" fill="#64748b" />
    </svg>
  );
}

export function Tp2dDynamicIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Trochoidal concentric high-speed toolpath loops */}
      <rect x="4" y="4" width="22" height="22" rx="1.5" fill="#f8fafc" stroke="#64748b" strokeWidth="0.8" />
      <ellipse cx="14" cy="14" rx="9" ry="9" stroke="#0284c7" strokeWidth="1.2" fill="none" />
      <ellipse cx="14" cy="14" rx="6" ry="6" stroke="#38bdf8" strokeWidth="1.2" fill="none" />
      <ellipse cx="14" cy="14" rx="3" ry="3" stroke="#0284c7" strokeWidth="1" fill="none" />
      {/* Red Dynamic Motion badge */}
      <DynamicMotionBadge x="17" y="17" />
    </svg>
  );
}

export function Tp2dFaceIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Facing cutter raster passes */}
      <rect x="4" y="5" width="22" height="21" rx="1" fill="#f8fafc" stroke="#64748b" strokeWidth="0.8" />
      <path d="M6 9 H 24 M24 9 V 15 M24 15 H 6 M6 15 V 21 M6 21 H 20" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Red Dynamic Motion badge */}
      <DynamicMotionBadge x="17" y="17" />
    </svg>
  );
}

export function Tp2dPocketIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="2" y="2" width="16" height="16" rx="1" fill="#fde68a" stroke="#d97706" strokeWidth="0.8" />
      <rect x="5" y="5" width="10" height="10" rx="1" fill="#ffffff" stroke="#0284c7" strokeWidth="0.8" />
      <rect x="7.5" y="7.5" width="5" height="5" stroke="#38bdf8" strokeWidth="0.8" fill="none" />
    </svg>
  );
}

export function Tp2dSlotMillIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="2" y="2" width="16" height="16" rx="1" fill="#fde68a" stroke="#d97706" strokeWidth="0.8" />
      <rect x="4" y="8" width="12" height="4" rx="2" fill="#ffffff" stroke="#0284c7" strokeWidth="1" />
      <line x1="6" y1="10" x2="14" y2="10" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function Tp2dHelixBoreIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="7.5" stroke="#d97706" strokeWidth="0.8" fill="#fde68a" />
      <circle cx="10" cy="10" r="5" fill="#ffffff" stroke="#0284c7" strokeWidth="0.8" />
      <path d="M10 5 A 5 5 0 0 1 15 10 A 5 5 0 0 1 10 15 A 5 5 0 0 1 5 10" stroke="#0284c7" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

export function Tp2dThreadMillIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="7.5" fill="#fde68a" stroke="#d97706" strokeWidth="0.8" />
      <line x1="5" y1="7" x2="15" y2="7" stroke="#0284c7" strokeWidth="1" />
      <line x1="5" y1="10" x2="15" y2="10" stroke="#0284c7" strokeWidth="1" />
      <line x1="5" y1="13" x2="15" y2="13" stroke="#0284c7" strokeWidth="1" />
    </svg>
  );
}

export function Tp2dCircleMillIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="7.5" fill="#fde68a" stroke="#d97706" strokeWidth="0.8" />
      <circle cx="10" cy="10" r="4" stroke="#0284c7" strokeWidth="1.2" fill="none" />
      <path d="M10 14 C 12 14 14 12 14 10" stroke="#10b981" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

export function Tp2dEngraveIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="2" y="2" width="16" height="16" rx="1" fill="#fde68a" stroke="#d97706" strokeWidth="0.8" />
      <text x="5" y="14" fontSize="11" fill="#0284c7" fontWeight="bold" fontFamily="serif">A</text>
    </svg>
  );
}

// ==================== 2. 3D GROUP ====================

export function Tp3dOptiRoughIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* 3D stepped machined block */}
      <polygon points="13,4 25,10 17,14 5,8" fill="#fde68a" stroke="#d97706" strokeWidth="0.8" />
      <polygon points="5,8 17,14 17,24 5,18" fill="#d97706" stroke="#b45309" strokeWidth="0.8" />
      <polygon points="17,14 25,10 25,20 17,24" fill="#b45309" stroke="#92400e" strokeWidth="0.8" />
      {/* Stepped pocket cuts inside */}
      <polygon points="13,8 21,12 17,14 9,10" fill="#ffffff" />
      {/* Red Dynamic Motion badge */}
      <DynamicMotionBadge x="17" y="17" />
    </svg>
  );
}

export function Tp3dPocketIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* 3D cavity pocket in solid block */}
      <polygon points="14,4 27,10 18,14 5,8" fill="#fde68a" stroke="#d97706" strokeWidth="0.8" />
      <polygon points="5,8 18,14 18,26 5,20" fill="#d97706" stroke="#b45309" strokeWidth="0.8" />
      <polygon points="18,14 27,10 27,22 18,26" fill="#b45309" stroke="#92400e" strokeWidth="0.8" />
      {/* Pocket step */}
      <polygon points="12,9 20,13 16,15 8,11" fill="#92400e" />
      {/* Blue cutter step lines */}
      <line x1="9" y1="12" x2="17" y2="16" stroke="#38bdf8" strokeWidth="1" />
      <line x1="8" y1="14" x2="16" y2="18" stroke="#38bdf8" strokeWidth="1" />
    </svg>
  );
}

export function Tp3dProjectIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* 3D cylinder / hemisphere surface */}
      <path d="M8 20 C 8 12 24 12 24 20 L 24 24 C 24 26 8 26 8 24 Z" fill="#fde68a" stroke="#d97706" strokeWidth="1" />
      {/* Projected blue toolpath curves conforming to surface */}
      <path d="M6 10 Q 16 4 26 10" stroke="#0284c7" strokeWidth="1.4" strokeDasharray="2 1.5" fill="none" />
      <path d="M8 15 Q 16 11 24 15" stroke="#0284c7" strokeWidth="1.5" fill="none" />
      <path d="M8 18 Q 16 14 24 18" stroke="#38bdf8" strokeWidth="1.5" fill="none" />
      {/* Downward projection arrow */}
      <line x1="16" y1="7" x2="16" y2="11" stroke="#ef4444" strokeWidth="1.2" />
    </svg>
  );
}

export function Tp3dParallelIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* 3D inclined slope surface wedge */}
      <polygon points="4,22 22,8 28,12 10,26" fill="#fde68a" stroke="#d97706" strokeWidth="0.8" />
      <polygon points="4,22 10,26 10,28 4,24" fill="#d97706" />
      <polygon points="10,26 28,12 28,14 10,28" fill="#b45309" />
      {/* Parallel blue linear finishing toolpaths across slope */}
      <line x1="7" y1="20" x2="23" y2="8" stroke="#0284c7" strokeWidth="1.2" />
      <line x1="10" y1="22" x2="26" y2="10" stroke="#0284c7" strokeWidth="1.2" />
      <line x1="13" y1="24" x2="28" y2="12" stroke="#0284c7" strokeWidth="1.2" />
    </svg>
  );
}

export function Tp3dEqualScallopIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M2 16 Q 10 4 18 16" fill="#fde68a" stroke="#d97706" strokeWidth="0.8" />
      <path d="M4 16 Q 10 7 16 16" stroke="#0284c7" strokeWidth="1" fill="none" />
      <path d="M6 16 Q 10 10 14 16" stroke="#38bdf8" strokeWidth="1" fill="none" />
    </svg>
  );
}

export function Tp3dWaterlineIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <polygon points="10,2 18,16 2,16" fill="#fde68a" stroke="#d97706" strokeWidth="0.8" />
      <line x1="5" y1="13" x2="15" y2="13" stroke="#0284c7" strokeWidth="1.2" />
      <line x1="7" y1="9.5" x2="13" y2="9.5" stroke="#0284c7" strokeWidth="1.2" />
      <line x1="8.5" y1="6" x2="11.5" y2="6" stroke="#0284c7" strokeWidth="1.2" />
    </svg>
  );
}

export function Tp3dSpiralIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="8" fill="#fde68a" stroke="#d97706" strokeWidth="0.8" />
      <path d="M10 10 A 2 2 0 0 1 12 10 A 4 4 0 0 1 8 10 A 6 6 0 0 1 16 10" stroke="#0284c7" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

export function Tp3dRadialIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="8" fill="#fde68a" stroke="#d97706" strokeWidth="0.8" />
      <line x1="10" y1="10" x2="10" y2="2" stroke="#0284c7" strokeWidth="1.2" />
      <line x1="10" y1="10" x2="17" y2="5" stroke="#0284c7" strokeWidth="1.2" />
      <line x1="10" y1="10" x2="17" y2="14" stroke="#0284c7" strokeWidth="1.2" />
      <line x1="10" y1="10" x2="10" y2="18" stroke="#0284c7" strokeWidth="1.2" />
      <line x1="10" y1="10" x2="3" y2="14" stroke="#0284c7" strokeWidth="1.2" />
    </svg>
  );
}

export function Tp3dPencilIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* 90 degree corner fillet */}
      <path d="M4 2 V 12 C 4 15 7 18 10 18 H 18" stroke="#d97706" strokeWidth="1.5" fill="none" />
      <path d="M6 4 V 12 C 6 14 8 16 10 16 H 18" stroke="#0284c7" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

export function Tp3dHybridIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <polygon points="10,2 18,16 2,16" fill="#fde68a" stroke="#d97706" strokeWidth="0.8" />
      <line x1="6" y1="12" x2="14" y2="12" stroke="#0284c7" strokeWidth="1" />
      <path d="M8 8 Q 10 6 12 8" stroke="#10b981" strokeWidth="1" fill="none" />
    </svg>
  );
}

// ==================== 3. MULTIAXIS GROUP ====================

export function TpMultiCurveIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* 3D curved surface sheet */}
      <path d="M6 24 C 6 10 18 8 26 18 C 24 22 14 26 6 24 Z" fill="#fde68a" stroke="#d97706" strokeWidth="1" />
      {/* 5-axis normal tool vectors standing on the curve */}
      <line x1="9" y1="18" x2="6" y2="8" stroke="#0284c7" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="16" y1="14" x2="16" y2="4" stroke="#0284c7" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="23" y1="17" x2="26" y2="7" stroke="#0284c7" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function TpMultiSwarfIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Ruled wall cut by side of tool flute */}
      <polygon points="8,8 20,4 24,20 12,24" fill="#fde68a" stroke="#d97706" strokeWidth="1" />
      {/* Flute contact cutting vector line */}
      <line x1="10" y1="6" x2="14" y2="22" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="10" cy="6" r="2" fill="#38bdf8" />
    </svg>
  );
}

export function TpMultiParallelIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* 3D double curved surface */}
      <path d="M4 22 C 10 14 22 14 28 22 L 26 26 C 20 18 10 18 4 26 Z" fill="#fde68a" stroke="#d97706" strokeWidth="1" />
      {/* Parallel 5-axis trajectory lines */}
      <path d="M6 18 C 11 12 21 12 26 18" stroke="#0284c7" strokeWidth="1.2" fill="none" />
      <path d="M5 20 C 11 14 21 14 27 20" stroke="#38bdf8" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

export function TpMultiDrillIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* 3D hemisphere dome with radial 5-axis drill holes */}
      <path d="M6 24 A 10 10 0 0 1 26 24 Z" fill="#fde68a" stroke="#d97706" strokeWidth="1" />
      {/* 3 Angled drill tool vectors */}
      <line x1="16" y1="14" x2="16" y2="4" stroke="#0284c7" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="11" y1="17" x2="5" y2="9" stroke="#0284c7" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="21" y1="17" x2="27" y2="9" stroke="#0284c7" strokeWidth="1.8" strokeLinecap="round" />
      {/* Drill holes in dome */}
      <circle cx="16" cy="14" r="1.5" fill="#1e293b" />
      <circle cx="11" cy="17" r="1.5" fill="#1e293b" />
      <circle cx="21" cy="17" r="1.5" fill="#1e293b" />
    </svg>
  );
}

export function TpMultiMorphIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M3 4 Q 10 2 17 6" stroke="#d97706" strokeWidth="1.2" fill="none" />
      <path d="M3 16 Q 10 14 17 18" stroke="#d97706" strokeWidth="1.2" fill="none" />
      <path d="M3 10 Q 10 8 17 12" stroke="#0284c7" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

export function TpMultiPortIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M4 14 C 4 8 8 6 12 6 H 17" stroke="#d97706" strokeWidth="2.5" fill="none" />
      <circle cx="15" cy="6" r="2" fill="#0284c7" />
    </svg>
  );
}

export function TpMultiBladeIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Impeller blade curve */}
      <path d="M5 16 C 5 10 12 8 15 4" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M8 17 C 8 12 14 10 17 6" stroke="#38bdf8" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

export function TpMultiRotaryIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <ellipse cx="6" cy="10" rx="3" ry="6" fill="#fde68a" stroke="#d97706" strokeWidth="0.8" />
      <rect x="6" y="4" width="10" height="12" fill="#fde68a" />
      <ellipse cx="16" cy="10" rx="3" ry="6" fill="#fde68a" stroke="#d97706" strokeWidth="0.8" />
      {/* Rotary circular cut line */}
      <path d="M6 10 C 6 6 16 6 16 10" stroke="#0284c7" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

// ==================== 4. STOCK GROUP ====================

export function TpStockShadingIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Orange stock billet block */}
      <polygon points="12,5 24,10 16,14 4,9" fill="#f97316" stroke="#ea580c" strokeWidth="1" />
      <polygon points="4,9 16,14 16,24 4,19" fill="#ea580c" stroke="#c2410c" strokeWidth="1" />
      <polygon points="16,14 24,10 24,20 16,24" fill="#c2410c" stroke="#9a3412" strokeWidth="1" />
      {/* Black diagonal slash indicating shading mode */}
      <line x1="20" y1="4" x2="6" y2="25" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function TpStockDisplayIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Stock Display block with diagonal toggle line */}
      <polygon points="12,5 24,10 16,14 4,9" fill="#f97316" stroke="#ea580c" strokeWidth="1" />
      <polygon points="4,9 16,14 16,24 4,19" fill="#ea580c" stroke="#c2410c" strokeWidth="1" />
      <polygon points="16,14 24,10 24,20 16,24" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
      {/* Diagonal black toggle slash */}
      <line x1="20" y1="4" x2="6" y2="25" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function TpStockModelIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Machined fillet corner stock model */}
      <path d="M6 8 H 22 V 14 C 18 14 16 16 16 20 V 26 H 6 Z" fill="#ea580c" stroke="#c2410c" strokeWidth="1" />
      {/* Fillet curve */}
      <path d="M22 14 C 18 14 16 16 16 20" stroke="#fde047" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

// ==================== 5. UTILITIES GROUP ====================

export function TpUtilToolManagerIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Toolholder Body */}
      <rect x="11" y="4" width="10" height="8" rx="1" fill="#475569" stroke="#334155" strokeWidth="1" />
      <polygon points="10,12 22,12 19,16 13,16" fill="#64748b" />
      {/* Golden Endmill Shank & Flutes */}
      <rect x="14.5" y="16" width="3" height="11" fill="#ca8a04" stroke="#a16207" strokeWidth="0.8" />
      <line x1="14.5" y1="18" x2="17.5" y2="20" stroke="#fef08a" strokeWidth="0.8" />
      <line x1="14.5" y1="21" x2="17.5" y2="23" stroke="#fef08a" strokeWidth="0.8" />
      <line x1="14.5" y1="24" x2="17.5" y2="26" stroke="#fef08a" strokeWidth="0.8" />
    </svg>
  );
}

export function TpUtilProbeIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Renishaw touch probe shank */}
      <rect x="8.5" y="2" width="3" height="7" fill="#475569" />
      <line x1="10" y1="9" x2="10" y2="15" stroke="#94a3b8" strokeWidth="1.2" />
      {/* Ruby ball stylus tip */}
      <circle cx="10" cy="16" r="2.2" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.8" />
    </svg>
  );
}

export function TpUtilMultiaxisLinkingIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Multi-axis linking clearance curve */}
      <path d="M4 16 L 8 6 C 10 4 14 4 16 8 L 18 16" stroke="#0284c7" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <polygon points="12,3 15,6 12,6" fill="#f59e0b" />
    </svg>
  );
}

export function TpUtilTransformIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Matrix transform pattern grid with plus icon */}
      <rect x="3" y="3" width="14" height="14" rx="1" fill="#f8fafc" stroke="#64748b" strokeWidth="0.8" />
      <line x1="10" y1="3" x2="10" y2="17" stroke="#cbd5e1" strokeWidth="0.8" />
      <line x1="3" y1="10" x2="17" y2="10" stroke="#cbd5e1" strokeWidth="0.8" />
      <path d="M6 14 L 14 6" stroke="#0284c7" strokeWidth="1.4" strokeLinecap="round" />
      <polygon points="15,6 11,6 14,9" fill="#0284c7" />
    </svg>
  );
}

export function TpUtilCheckSurfaceIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Workholding clamp / fixture with shield */}
      <rect x="4" y="6" width="12" height="9" rx="1" fill="#475569" stroke="#334155" strokeWidth="0.8" />
      <path d="M10 2 L 14 4 V 7 C 14 10 10 11 10 11 C 10 11 6 10 6 7 V 4 Z" fill="#10b981" />
    </svg>
  );
}

export function TpUtilTrimIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Toolpath line trimmed by boundary box */}
      <rect x="3" y="3" width="14" height="14" rx="1" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 1.5" fill="none" />
      <line x1="1" y1="10" x2="19" y2="10" stroke="#0284c7" strokeWidth="1.4" />
      <line x1="9" y1="7" x2="13" y2="13" stroke="#ef4444" strokeWidth="1.2" />
      <line x1="13" y1="7" x2="9" y2="13" stroke="#ef4444" strokeWidth="1.2" />
    </svg>
  );
}

export function TpUtilFilterIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* HSM look-ahead arc filter with smooth curve */}
      <path d="M3 14 C 7 4 13 4 17 14" stroke="#0284c7" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <circle cx="5" cy="12" r="1.2" fill="#ef4444" />
      <circle cx="10" cy="5" r="1.2" fill="#10b981" />
      <circle cx="15" cy="12" r="1.2" fill="#ef4444" />
    </svg>
  );
}

export function TpVerifyBackplotIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <path d="M4 14 C 8 8, 12 8, 16 14 C 20 20, 24 20, 28 14" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M4 8 C 8 3, 12 3, 16 8 C 20 13, 24 13, 28 8" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 2" />
      <polygon points="12,18 23,23 12,28" fill="#16a34a" stroke="#15803d" strokeWidth="1" />
    </svg>
  );
}

export function TpVerifySolidIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <path d="M16 3 L28 9 L28 23 L16 29 L4 23 L4 9 Z" fill="#22c55e" fillOpacity="0.25" stroke="#16a34a" strokeWidth="2" strokeLinejoin="round" />
      <path d="M16 3 L16 29" stroke="#16a34a" strokeWidth="1.5" />
      <path d="M4 9 L16 15 L28 9" stroke="#16a34a" strokeWidth="1.5" />
      <polyline points="10,18 14,22 22,12" stroke="#15803d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TpVerifyPostIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <rect x="5" y="4" width="22" height="24" rx="3" fill="#eff6ff" stroke="#2563eb" strokeWidth="2" />
      <rect x="9" y="8" width="14" height="2" rx="1" fill="#93c5fd" />
      <rect x="9" y="12" width="10" height="2" rx="1" fill="#93c5fd" />
      <text x="16" y="24" textAnchor="middle" fill="#1d4ed8" fontSize="10" fontWeight="900" fontFamily="monospace">G1</text>
    </svg>
  );
}

// ==================== EXPORT MAP ====================

export const TOOLPATHS_ICON_MAP = {
  Tp2dContour: Tp2dContourIcon,
  Tp2dDrill: Tp2dDrillIcon,
  Tp2dDynamic: Tp2dDynamicIcon,
  Tp2dFace: Tp2dFaceIcon,
  Tp2dPocket: Tp2dPocketIcon,
  Tp2dSlotMill: Tp2dSlotMillIcon,
  Tp2dHelixBore: Tp2dHelixBoreIcon,
  Tp2dThreadMill: Tp2dThreadMillIcon,
  Tp2dCircleMill: Tp2dCircleMillIcon,
  Tp2dEngrave: Tp2dEngraveIcon,
  Tp3dOptiRough: Tp3dOptiRoughIcon,
  Tp3dPocket: Tp3dPocketIcon,
  Tp3dProject: Tp3dProjectIcon,
  Tp3dParallel: Tp3dParallelIcon,
  Tp3dEqualScallop: Tp3dEqualScallopIcon,
  Tp3dWaterline: Tp3dWaterlineIcon,
  Tp3dSpiral: Tp3dSpiralIcon,
  Tp3dRadial: Tp3dRadialIcon,
  Tp3dPencil: Tp3dPencilIcon,
  Tp3dHybrid: Tp3dHybridIcon,
  TpMultiCurve: TpMultiCurveIcon,
  TpMultiSwarf: TpMultiSwarfIcon,
  TpMultiParallel: TpMultiParallelIcon,
  TpMultiDrill: TpMultiDrillIcon,
  TpMultiMorph: TpMultiMorphIcon,
  TpMultiPort: TpMultiPortIcon,
  TpMultiBlade: TpMultiBladeIcon,
  TpMultiRotary: TpMultiRotaryIcon,
  TpStockShading: TpStockShadingIcon,
  TpStockDisplay: TpStockDisplayIcon,
  TpStockModel: TpStockModelIcon,
  TpUtilToolManager: TpUtilToolManagerIcon,
  TpUtilProbe: TpUtilProbeIcon,
  TpUtilMultiaxisLinking: TpUtilMultiaxisLinkingIcon,
  TpUtilTransform: TpUtilTransformIcon,
  TpUtilCheckSurface: TpUtilCheckSurfaceIcon,
  TpUtilTrim: TpUtilTrimIcon,
  TpUtilFilter: TpUtilFilterIcon,
  TpVerifyBackplot: TpVerifyBackplotIcon,
  TpVerifySolid: TpVerifySolidIcon,
  TpVerifyPost: TpVerifyPostIcon
};
