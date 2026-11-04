import React from 'react';

/**
 * Authentic vector icons for Mastercam 2018 MODEL PREP tab
 * Styled with direct modeling split faces, defeaturing markers, assembly blocks, and color tools.
 */

// ==================== 1. CREATE GROUP ====================

export function HoleAxisIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Golden block with hole */}
      <polygon points="16,5 27,11 16,17 5,11" fill="#fde68a" stroke="#d97706" strokeWidth="1" />
      <polygon points="5,11 16,17 16,27 5,21" fill="#d97706" stroke="#b45309" strokeWidth="1" />
      <polygon points="16,17 27,11 27,21 16,27" fill="#b45309" stroke="#78350f" strokeWidth="1" />
      
      {/* Hole cavity ellipse */}
      <ellipse cx="16" cy="11" rx="4.5" ry="2.2" fill="#0f172a" opacity="0.75" stroke="#b45309" strokeWidth="0.8" />
      
      {/* Vertical Dashed Centerline Axis */}
      <line x1="16" y1="2" x2="16" y2="28" stroke="#0f172a" strokeWidth="1.6" strokeDasharray="3,1.5" />
    </svg>
  );
}

// ==================== 2. DIRECT EDITING GROUP ====================

export function PushPullIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Square face divided into blue and golden regions */}
      <rect x="5" y="5" width="22" height="22" rx="1" fill="#fde68a" stroke="#d97706" strokeWidth="1.2" />
      {/* Blue active sub-region */}
      <rect x="5" y="5" width="11" height="11" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
      {/* Cursor arrow pushing/pulling */}
      <path d="M15 15 L23 23 M17 24 L24 24 L24 17" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points="13,13 18,15 15,18" fill="#0f172a" />
    </svg>
  );
}

export function MoveFacesIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Solid block with inclined blue face and translation arrow */}
      <polygon points="5,24 5,14 16,10 27,14 27,24 16,28" fill="#d97706" stroke="#b45309" strokeWidth="1" />
      <polygon points="5,14 16,10 27,14 16,18" fill="#0284c7" stroke="#0369a1" strokeWidth="1.2" />
      {/* Vertical translation arrow */}
      <path d="M16 19 L16 6" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />
      <polygon points="13,8 16,3 19,8" fill="#0f172a" />
    </svg>
  );
}

export function SplitSolidFacesIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Golden solid block */}
      <polygon points="16,5 27,11 16,17 5,11" fill="#fde68a" stroke="#d97706" strokeWidth="1" />
      <polygon points="5,11 16,17 16,27 5,21" fill="#d97706" stroke="#b45309" strokeWidth="1" />
      <polygon points="16,17 27,11 27,21 16,27" fill="#b45309" stroke="#78350f" strokeWidth="1" />
      
      {/* Vertical dashed splitting line seam */}
      <line x1="21.5" y1="14" x2="21.5" y2="24" stroke="#0f172a" strokeWidth="1.6" strokeDasharray="2,1.5" />
      <line x1="10.5" y1="14" x2="10.5" y2="24" stroke="#0f172a" strokeWidth="1.6" strokeDasharray="2,1.5" />
      <line x1="16" y1="5" x2="16" y2="17" stroke="#0f172a" strokeWidth="1.6" strokeDasharray="2,1.5" />
    </svg>
  );
}

// ==================== 3. MODIFY GROUP ====================

export function ModifyFeatureIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Stepped block */}
      <polygon points="4,24 4,14 12,14 12,8 20,8 20,24" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
      <polygon points="12,8 20,8 25,4 17,4" fill="#38bdf8" stroke="#0369a1" strokeWidth="0.8" />
      <polygon points="20,8 25,4 25,20 20,24" fill="#0369a1" stroke="#075985" strokeWidth="0.8" />
      
      {/* Pencil icon editing the feature */}
      <g transform="translate(14, 10) rotate(-35)">
        <polygon points="0,0 4,-2 14,8 10,10" fill="#f59e0b" stroke="#78350f" strokeWidth="0.8" />
        <polygon points="0,0 2,4 0,6 -2,4" fill="#fde68a" stroke="#78350f" strokeWidth="0.8" />
        <polygon points="0,6 -1,8 1,8" fill="#0f172a" />
      </g>
    </svg>
  );
}

export function ModifyFilletIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Block with curved fillet */}
      <polygon points="5,24 5,12 14,12 24,18 24,24" fill="#d97706" stroke="#b45309" strokeWidth="1" />
      <path d="M5 12 C13 12 17 16 17 24 L24 24 C24 14 18 8 10 8 Z" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
      {/* Pencil icon */}
      <g transform="translate(18, 12) rotate(-35)">
        <polygon points="0,0 4,-2 12,6 8,8" fill="#f59e0b" stroke="#78350f" strokeWidth="0.8" />
        <polygon points="0,0 2,3 0,5 -2,3" fill="#fde68a" stroke="#78350f" strokeWidth="0.8" />
        <polygon points="0,5 -1,7 1,7" fill="#0f172a" />
      </g>
    </svg>
  );
}

export function RemoveFacesIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Golden block */}
      <polygon points="16,5 27,11 16,17 5,11" fill="#fde68a" stroke="#d97706" strokeWidth="1" />
      <polygon points="5,11 16,17 16,27 5,21" fill="#d97706" stroke="#b45309" strokeWidth="1" />
      <polygon points="16,17 27,11 27,21 16,27" fill="#b45309" stroke="#78350f" strokeWidth="1" />
      
      {/* Red 'X' deletion marker */}
      <line x1="8" y1="14" x2="14" y2="22" stroke="#ef4444" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="14" y1="14" x2="8" y2="22" stroke="#ef4444" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function RemoveFilletsIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Solid block with blue fillet */}
      <polygon points="5,24 5,12 14,12 24,18 24,24" fill="#d97706" stroke="#b45309" strokeWidth="1" />
      <path d="M5 12 C13 12 17 16 17 24 L24 24 C24 14 18 8 10 8 Z" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
      
      {/* Red 'X' fillet removal marker */}
      <line x1="17" y1="14" x2="25" y2="22" stroke="#ef4444" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="25" y1="14" x2="17" y2="22" stroke="#ef4444" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function RemoveHistoryIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Block with red curved undo/strip arrow */}
      <rect x="3" y="5" width="10" height="10" rx="1" fill="#fde68a" stroke="#d97706" strokeWidth="0.8" />
      {/* Curved red undo history arrow */}
      <path d="M17 14 C17 9 13 8 9 8" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <polygon points="10,6 6,8 10,10" fill="#ef4444" />
    </svg>
  );
}

export function SimplifySolidIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Simplified analytical prism */}
      <polygon points="10,3 17,7 10,11 3,7" fill="#7dd3fc" stroke="#0284c7" strokeWidth="0.8" />
      <polygon points="3,7 10,11 10,17 3,13" fill="#0284c7" stroke="#0369a1" strokeWidth="0.8" />
      <polygon points="10,11 17,7 17,13 10,17" fill="#0369a1" stroke="#075985" strokeWidth="0.8" />
    </svg>
  );
}

export function FindFeaturesIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Block with magnifying glass */}
      <rect x="2" y="4" width="10" height="10" rx="1" fill="#fde68a" stroke="#d97706" strokeWidth="0.8" />
      {/* Magnifying glass */}
      <circle cx="12" cy="11" r="4" fill="#ffffff" stroke="#0284c7" strokeWidth="1.4" />
      <line x1="15" y1="14" x2="18" y2="17" stroke="#0284c7" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// ==================== 4. LAYOUT GROUP ====================

export function DisassembleIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* 3 separated multi-color stacked components */}
      {/* Top Blue Block */}
      <polygon points="16,3 23,6 16,9 9,6" fill="#7dd3fc" stroke="#0284c7" strokeWidth="0.8" />
      <polygon points="9,6 16,9 16,12 9,9" fill="#0284c7" stroke="#0369a1" strokeWidth="0.8" />
      <polygon points="16,9 23,6 23,9 16,12" fill="#0369a1" stroke="#075985" strokeWidth="0.8" />
      
      {/* Middle Golden Block */}
      <polygon points="16,12 23,15 16,18 9,15" fill="#fde68a" stroke="#d97706" strokeWidth="0.8" />
      <polygon points="9,15 16,18 16,21 9,18" fill="#d97706" stroke="#b45309" strokeWidth="0.8" />
      <polygon points="16,18 23,15 23,18 16,21" fill="#b45309" stroke="#78350f" strokeWidth="0.8" />
      
      {/* Bottom Green Block */}
      <polygon points="16,21 23,24 16,27 9,24" fill="#86efac" stroke="#16a34a" strokeWidth="0.8" />
      <polygon points="9,24 16,27 16,30 9,27" fill="#16a34a" stroke="#15803d" strokeWidth="0.8" />
      <polygon points="16,27 23,24 23,27 16,30" fill="#15803d" stroke="#14532d" strokeWidth="0.8" />
    </svg>
  );
}

export function PositionAssemblyIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Multi-body stacked column aligned in position */}
      {/* Top Blue Block */}
      <polygon points="16,5 23,8 16,11 9,8" fill="#7dd3fc" stroke="#0284c7" strokeWidth="0.8" />
      <polygon points="9,8 16,11 16,14 9,11" fill="#0284c7" stroke="#0369a1" strokeWidth="0.8" />
      <polygon points="16,11 23,8 23,11 16,14" fill="#0369a1" stroke="#075985" strokeWidth="0.8" />
      
      {/* Middle Golden Block */}
      <polygon points="9,14 16,17 16,20 9,17" fill="#d97706" stroke="#b45309" strokeWidth="0.8" />
      <polygon points="16,17 23,14 23,17 16,20" fill="#b45309" stroke="#78350f" strokeWidth="0.8" />
      
      {/* Bottom Green Block */}
      <polygon points="9,20 16,23 16,26 9,23" fill="#16a34a" stroke="#15803d" strokeWidth="0.8" />
      <polygon points="16,23 23,20 23,23 16,26" fill="#15803d" stroke="#14532d" strokeWidth="0.8" />
    </svg>
  );
}

// ==================== 5. COLOR GROUP ====================

export function ClearAllColorIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Stepped block with eraser wiping color */}
      <polygon points="4,24 4,14 14,14 14,8 24,8 24,24" fill="#e2e8f0" stroke="#64748b" strokeWidth="1" />
      {/* Pink & Blue Eraser */}
      <g transform="translate(14, 14) rotate(45)">
        <rect x="0" y="0" width="10" height="5" fill="#f43f5e" rx="1" />
        <rect x="10" y="0" width="8" height="5" fill="#38bdf8" rx="1" />
      </g>
    </svg>
  );
}

export function ChangeFaceColorIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Block with pink/magenta face */}
      <polygon points="10,3 17,7 10,11 3,7" fill="#f43f5e" stroke="#be123c" strokeWidth="0.9" />
      <polygon points="3,7 10,11 10,17 3,13" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.8" />
      <polygon points="10,11 17,7 17,13 10,17" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.8" />
    </svg>
  );
}

export function ClearFeatureColorIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Block with eraser symbol */}
      <rect x="3" y="4" width="12" height="12" rx="1" fill="#f8fafc" stroke="#64748b" strokeWidth="0.8" />
      <line x1="4" y1="15" x2="14" y2="5" stroke="#ef4444" strokeWidth="1.4" />
    </svg>
  );
}

export function SetFeatureColorIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Block with purple/magenta feature set */}
      <rect x="3" y="4" width="12" height="12" rx="1" fill="#f8fafc" stroke="#64748b" strokeWidth="0.8" />
      <circle cx="9" cy="10" r="4" fill="#a855f7" stroke="#7e22ce" strokeWidth="0.8" />
    </svg>
  );
}

// Icon dictionary mapped to config IDs
export const MODEL_PREP_ICON_MAP = {
  HoleAxis: HoleAxisIcon,
  PushPull: PushPullIcon,
  MoveFaces: MoveFacesIcon,
  SplitSolidFaces: SplitSolidFacesIcon,
  ModifyFeature: ModifyFeatureIcon,
  ModifyFillet: ModifyFilletIcon,
  RemoveFaces: RemoveFacesIcon,
  RemoveFillets: RemoveFilletsIcon,
  RemoveHistory: RemoveHistoryIcon,
  SimplifySolid: SimplifySolidIcon,
  FindFeatures: FindFeaturesIcon,
  Disassemble: DisassembleIcon,
  PositionAssembly: PositionAssemblyIcon,
  ClearAllColor: ClearAllColorIcon,
  ChangeFaceColor: ChangeFaceColorIcon,
  ClearFeatureColor: ClearFeatureColorIcon,
  SetFeatureColor: SetFeatureColorIcon
};
