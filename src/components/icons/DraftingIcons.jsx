import React from 'react';

/**
 * Authentic vector icons for Mastercam 2018 DRAFTING tab
 * Styled with CAD dimension lines, ordinate coordinates, engineering notes,
 * regeneration cycles, and modification tools.
 */

// ==================== 1. DIMENSION GROUP ====================

export function SmartDimensionIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Lightbulb glowing filament */}
      <path
        d="M16 4C11.5 4 8 7.5 8 12C8 14.8 9.5 17.2 11.8 18.6C12.4 19 12.8 19.8 12.8 20.6V22H19.2V20.6C19.2 19.8 19.6 19 20.2 18.6C22.5 17.2 24 14.8 24 12C24 7.5 20.5 4 16 4Z"
        fill="#fef08a"
        stroke="#ca8a04"
        strokeWidth="1.2"
      />
      {/* Bulb base */}
      <rect x="13" y="22" width="6" height="2" fill="#94a3b8" />
      <path d="M14 24C14 25.1 14.9 26 16 26C17.1 26 18 25.1 18 24H14Z" fill="#64748b" />
      {/* Dimension arrow caliper below bulb */}
      <path d="M5 28H27" stroke="#0284c7" strokeWidth="1.5" />
      <path d="M8 26L5 28L8 30" stroke="#0284c7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 26L27 28L24 30" stroke="#0284c7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="5" y1="24" x2="5" y2="30" stroke="#0284c7" strokeWidth="1" />
      <line x1="27" y1="24" x2="27" y2="30" stroke="#0284c7" strokeWidth="1" />
    </svg>
  );
}

export function DimHorizontalIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Witness lines */}
      <line x1="3" y1="3" x2="3" y2="17" stroke="#475569" strokeWidth="1.2" />
      <line x1="17" y1="3" x2="17" y2="17" stroke="#475569" strokeWidth="1.2" />
      {/* Horizontal dimension line with arrows */}
      <line x1="3" y1="10" x2="17" y2="10" stroke="#0284c7" strokeWidth="1.5" />
      <polygon points="3,10 6,8 6,12" fill="#0284c7" />
      <polygon points="17,10 14,8 14,12" fill="#0284c7" />
    </svg>
  );
}

export function DimCircularIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Circle */}
      <circle cx="10" cy="10" r="7" stroke="#475569" strokeWidth="1.2" fill="none" />
      {/* 45 degree diameter leader with arrows */}
      <line x1="5" y1="15" x2="15" y2="5" stroke="#0284c7" strokeWidth="1.5" />
      <polygon points="5,15 8,15 6,13" fill="#0284c7" />
      <polygon points="15,5 12,5 14,7" fill="#0284c7" />
      {/* Diameter symbol Ø */}
      <circle cx="10" cy="10" r="2" stroke="#0284c7" strokeWidth="0.8" fill="none" />
      <line x1="8" y1="12" x2="12" y2="8" stroke="#0284c7" strokeWidth="0.8" />
    </svg>
  );
}

export function DimPointIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Coordinate point crosshair */}
      <circle cx="10" cy="10" r="2.5" fill="#ef4444" />
      <circle cx="10" cy="10" r="5" stroke="#0284c7" strokeWidth="1" strokeDasharray="2,2" fill="none" />
      <line x1="10" y1="2" x2="10" y2="18" stroke="#0284c7" strokeWidth="1.2" />
      <line x1="2" y1="10" x2="18" y2="10" stroke="#0284c7" strokeWidth="1.2" />
    </svg>
  );
}

export function DimAngularIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Two angled intersecting rays */}
      <line x1="3" y1="16" x2="17" y2="16" stroke="#475569" strokeWidth="1.2" />
      <line x1="3" y1="16" x2="15" y2="4" stroke="#475569" strokeWidth="1.2" />
      {/* Dimension arc */}
      <path d="M10 16 A 8 8 0 0 0 8.5 10.5" stroke="#0284c7" strokeWidth="1.4" fill="none" />
      <polygon points="10,16 9,14 11,14" fill="#0284c7" />
      <polygon points="8.5,10.5 7,12 9,12.5" fill="#0284c7" />
    </svg>
  );
}

export function DimParallelIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Inclined parallel dimension line */}
      <line x1="2" y1="8" x2="8" y2="2" stroke="#475569" strokeWidth="1.2" />
      <line x1="12" y1="18" x2="18" y2="12" stroke="#475569" strokeWidth="1.2" />
      <line x1="5" y1="5" x2="15" y2="15" stroke="#0284c7" strokeWidth="1.5" />
      <polygon points="5,5 8,5 5,8" fill="#0284c7" />
      <polygon points="15,15 12,15 15,12" fill="#0284c7" />
    </svg>
  );
}

export function DimPerpendicularIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Perpendicular inverted T symbol */}
      <line x1="3" y1="16" x2="17" y2="16" stroke="#475569" strokeWidth="1.5" />
      <line x1="10" y1="3" x2="10" y2="16" stroke="#0284c7" strokeWidth="1.5" />
      {/* 90 deg corner square */}
      <rect x="10" y="12" width="4" height="4" stroke="#0284c7" strokeWidth="0.8" fill="none" />
    </svg>
  );
}

export function DimBaselineIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Common datum line */}
      <line x1="3" y1="2" x2="3" y2="18" stroke="#475569" strokeWidth="1.5" />
      {/* Stacked baseline dimensions */}
      <line x1="3" y1="6" x2="10" y2="6" stroke="#0284c7" strokeWidth="1.2" />
      <polygon points="10,6 8,5 8,7" fill="#0284c7" />
      <line x1="10" y1="4" x2="10" y2="8" stroke="#475569" strokeWidth="1" />

      <line x1="3" y1="12" x2="17" y2="12" stroke="#0284c7" strokeWidth="1.2" />
      <polygon points="17,12 15,11 15,13" fill="#0284c7" />
      <line x1="17" y1="10" x2="17" y2="14" stroke="#475569" strokeWidth="1" />
    </svg>
  );
}

export function DimChainedIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Chained dimension series */}
      <line x1="2" y1="10" x2="10" y2="10" stroke="#0284c7" strokeWidth="1.3" />
      <line x1="10" y1="10" x2="18" y2="10" stroke="#0284c7" strokeWidth="1.3" />
      {/* Witness lines */}
      <line x1="2" y1="6" x2="2" y2="14" stroke="#475569" strokeWidth="1" />
      <line x1="10" y1="6" x2="10" y2="14" stroke="#475569" strokeWidth="1.2" />
      <line x1="18" y1="6" x2="18" y2="14" stroke="#475569" strokeWidth="1" />
      {/* Arrowheads */}
      <polygon points="2,10 4,9 4,11" fill="#0284c7" />
      <polygon points="10,10 8,9 8,11" fill="#0284c7" />
      <polygon points="10,10 12,9 12,11" fill="#0284c7" />
      <polygon points="18,10 16,9 16,11" fill="#0284c7" />
    </svg>
  );
}

export function DimTangentIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Arc curve */}
      <path d="M4 16 A 12 12 0 0 1 16 4" stroke="#475569" strokeWidth="1.2" fill="none" />
      {/* Tangent line at crest */}
      <line x1="3" y1="4" x2="17" y2="4" stroke="#0284c7" strokeWidth="1.4" />
      <circle cx="10" cy="4" r="1.5" fill="#ef4444" />
      <line x1="10" y1="4" x2="10" y2="10" stroke="#0284c7" strokeWidth="1" strokeDasharray="1.5,1.5" />
    </svg>
  );
}

// ==================== 2. ORDINATE GROUP ====================

export function OrdHorizontalIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Horizontal leader line */}
      <line x1="2" y1="10" x2="18" y2="10" stroke="#0284c7" strokeWidth="1.4" />
      <polygon points="2,10 5,8 5,12" fill="#0284c7" />
      {/* Ordinate datum text representation (0.0) */}
      <text x="7" y="8" fontSize="6" fontWeight="bold" fill="#0f172a" fontFamily="sans-serif">0.0</text>
      <line x1="2" y1="4" x2="2" y2="16" stroke="#475569" strokeWidth="1" />
    </svg>
  );
}

export function OrdVerticalIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Vertical leader line */}
      <line x1="10" y1="2" x2="10" y2="18" stroke="#0284c7" strokeWidth="1.4" />
      <polygon points="10,2 8,5 12,5" fill="#0284c7" />
      {/* Ordinate datum marker */}
      <text x="12" y="11" fontSize="6" fontWeight="bold" fill="#0f172a" fontFamily="sans-serif">0.0</text>
      <line x1="4" y1="2" x2="16" y2="2" stroke="#475569" strokeWidth="1" />
    </svg>
  );
}

export function OrdAddExistingIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Ordinate leader with green plus sign */}
      <line x1="2" y1="12" x2="18" y2="12" stroke="#0284c7" strokeWidth="1.3" />
      <line x1="2" y1="6" x2="2" y2="18" stroke="#475569" strokeWidth="1" />
      {/* Plus symbol */}
      <circle cx="12" cy="6" r="4" fill="#10b981" />
      <line x1="12" y1="4" x2="12" y2="8" stroke="#ffffff" strokeWidth="1.2" />
      <line x1="10" y1="6" x2="14" y2="6" stroke="#ffffff" strokeWidth="1.2" />
    </svg>
  );
}

export function OrdWindowIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Selection dashed window marquee */}
      <rect x="3" y="3" width="14" height="14" rx="1" stroke="#0284c7" strokeWidth="1.2" strokeDasharray="2,2" fill="rgba(56, 189, 248, 0.15)" />
      {/* Selected ordinate points inside */}
      <circle cx="7" cy="8" r="1.5" fill="#ca8a04" />
      <circle cx="13" cy="12" r="1.5" fill="#ca8a04" />
    </svg>
  );
}

export function OrdAlignIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Vertical alignment line */}
      <line x1="10" y1="2" x2="10" y2="18" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="2,1.5" />
      {/* Aligned text blocks with guide arrows */}
      <rect x="2" y="4" width="6" height="3" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.8" />
      <rect x="12" y="4" width="6" height="3" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.8" />
      <path d="M6 5.5 L8 5.5" stroke="#0284c7" strokeWidth="1" />
      <path d="M14 5.5 L12 5.5" stroke="#0284c7" strokeWidth="1" />
    </svg>
  );
}

export function OrdParallelIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Inclined parallel ordinate dimension lines */}
      <line x1="3" y1="17" x2="17" y2="3" stroke="#475569" strokeWidth="1" />
      <line x1="6" y1="17" x2="17" y2="6" stroke="#0284c7" strokeWidth="1.4" />
      <polygon points="6,17 9,16 7,14" fill="#0284c7" />
    </svg>
  );
}

// ==================== 3. ANNOTATE GROUP ====================

export function NoteIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Document notepad sheet with folded corner */}
      <polygon points="6,4 20,4 26,10 26,28 6,28" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.2" />
      <polygon points="20,4 20,10 26,10" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
      {/* Text lines */}
      <line x1="10" y1="12" x2="22" y2="12" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="16" x2="22" y2="16" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="20" x2="18" y2="20" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
      {/* Pencil drafting note */}
      <g transform="translate(14, 12) rotate(45)">
        <rect x="0" y="0" width="14" height="4" rx="1" fill="#f59e0b" stroke="#b45309" strokeWidth="0.8" />
        <polygon points="14,0 18,2 14,4" fill="#1e293b" />
      </g>
    </svg>
  );
}

export function CrossHatchIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Section boundary box */}
      <rect x="3" y="3" width="14" height="14" stroke="#475569" strokeWidth="1.2" fill="none" />
      {/* ANSI 45-degree cross hatch lines */}
      <line x1="3" y1="8" x2="8" y2="3" stroke="#0284c7" strokeWidth="1" />
      <line x1="3" y1="14" x2="14" y2="3" stroke="#0284c7" strokeWidth="1" />
      <line x1="6" y1="17" x2="17" y2="6" stroke="#0284c7" strokeWidth="1" />
      <line x1="12" y1="17" x2="17" y2="12" stroke="#0284c7" strokeWidth="1" />
    </svg>
  );
}

export function LeaderIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Bent leader line */}
      <path d="M4 16 L11 8 L18 8" stroke="#0284c7" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points="4,16 7,14 5,12" fill="#0284c7" />
    </svg>
  );
}

export function WitnessLineIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Extension witness lines with gap */}
      <line x1="5" y1="17" x2="5" y2="9" stroke="#475569" strokeWidth="1.4" />
      <line x1="15" y1="17" x2="15" y2="9" stroke="#475569" strokeWidth="1.4" />
      {/* Cross dimension line */}
      <line x1="2" y1="5" x2="18" y2="5" stroke="#0284c7" strokeWidth="1.2" />
      <polygon points="5,5 7,4 7,6" fill="#0284c7" />
      <polygon points="15,5 13,4 13,6" fill="#0284c7" />
    </svg>
  );
}

// ==================== 4. REGENERATE GROUP ====================

export function RegenAutomaticIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Green circular refresh cycle arrows */}
      <circle cx="16" cy="16" r="11" stroke="#10b981" strokeWidth="2.4" strokeDasharray="22 14" fill="none" />
      {/* Arrowhead top */}
      <polygon points="20,5 24,7 21,11" fill="#10b981" />
      {/* Arrowhead bottom */}
      <polygon points="12,27 8,25 11,21" fill="#10b981" />
      {/* Central CAD entity cube */}
      <rect x="13" y="13" width="6" height="6" rx="1" fill="#0f172a" />
    </svg>
  );
}

export function RegenValidateIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Dimension ruler */}
      <line x1="3" y1="14" x2="17" y2="14" stroke="#475569" strokeWidth="1.2" />
      <line x1="6" y1="11" x2="6" y2="14" stroke="#475569" strokeWidth="1" />
      <line x1="10" y1="11" x2="10" y2="14" stroke="#475569" strokeWidth="1" />
      <line x1="14" y1="11" x2="14" y2="14" stroke="#475569" strokeWidth="1" />
      {/* Green validation checkmark */}
      <path d="M7 6 L10 9 L16 3" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function RegenSelectIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Cursor arrow selecting dimension */}
      <polygon points="4,3 4,14 8,11 12,17 14,16 10,10 14,9" fill="#0284c7" stroke="#0f172a" strokeWidth="1" strokeLinejoin="round" />
      {/* Dimension line behind cursor */}
      <line x1="11" y1="4" x2="18" y2="4" stroke="#ca8a04" strokeWidth="1.2" />
      <polygon points="18,4 16,3 16,5" fill="#ca8a04" />
    </svg>
  );
}

export function RegenAllIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* All drawing sheet icon */}
      <rect x="3" y="3" width="14" height="14" rx="1" fill="#f8fafc" stroke="#475569" strokeWidth="1" />
      {/* Small circular refresh inside */}
      <path d="M7 10 A 3 3 0 1 1 13 10" stroke="#10b981" strokeWidth="1.4" fill="none" />
      <polygon points="13,7 13,10 10,10" fill="#10b981" />
    </svg>
  );
}

// ==================== 5. MODIFY GROUP ====================

export function AlignNoteIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Note blocks */}
      <rect x="5" y="8" width="10" height="5" rx="1" fill="#e2e8f0" stroke="#64748b" strokeWidth="1" />
      <rect x="5" y="16" width="10" height="5" rx="1" fill="#e2e8f0" stroke="#64748b" strokeWidth="1" />
      {/* Vertical alignment datum line */}
      <line x1="19" y1="4" x2="19" y2="28" stroke="#ef4444" strokeWidth="1.4" strokeDasharray="2,2" />
      {/* Alignment arrows pulling notes to line */}
      <path d="M15 10.5 L19 10.5" stroke="#0284c7" strokeWidth="1.5" />
      <polygon points="19,10.5 16,9 16,12" fill="#0284c7" />
      <path d="M15 18.5 L19 18.5" stroke="#0284c7" strokeWidth="1.5" />
      <polygon points="19,18.5 16,17 16,20" fill="#0284c7" />
    </svg>
  );
}

export function MultiEditIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Dimension lines to edit */}
      <line x1="6" y1="10" x2="26" y2="10" stroke="#0284c7" strokeWidth="1.6" />
      <line x1="6" y1="22" x2="26" y2="22" stroke="#0284c7" strokeWidth="1.6" />
      {/* Bidirectional modification arrows */}
      <polygon points="6,10 10,8 10,12" fill="#0284c7" />
      <polygon points="26,10 22,8 22,12" fill="#0284c7" />
      <polygon points="6,22 10,20 10,24" fill="#0284c7" />
      <polygon points="26,22 22,20 22,24" fill="#0284c7" />
      {/* Central multi-edit sync links */}
      <line x1="16" y1="10" x2="16" y2="22" stroke="#f59e0b" strokeWidth="1.8" strokeDasharray="2,2" />
      <circle cx="16" cy="16" r="2.5" fill="#f59e0b" />
    </svg>
  );
}

export function BreakIntoLinesIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Dimension symbol breaking apart into line segments */}
      <line x1="6" y1="10" x2="13" y2="7" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="15" y1="14" x2="22" y2="10" stroke="#0284c7" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="10" y1="22" x2="18" y2="25" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="20" y1="19" x2="26" y2="23" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" />
      {/* Explosion spark dots */}
      <circle cx="16" cy="16" r="1.5" fill="#ef4444" />
      <circle cx="12" cy="15" r="1" fill="#f59e0b" />
      <circle cx="20" cy="14" r="1" fill="#0284c7" />
    </svg>
  );
}

// ==================== EXPORT MAP ====================

export const DRAFTING_ICON_MAP = {
  SmartDimension: SmartDimensionIcon,
  DimHorizontal: DimHorizontalIcon,
  DimCircular: DimCircularIcon,
  DimPoint: DimPointIcon,
  DimAngular: DimAngularIcon,
  DimParallel: DimParallelIcon,
  DimPerpendicular: DimPerpendicularIcon,
  DimBaseline: DimBaselineIcon,
  DimChained: DimChainedIcon,
  DimTangent: DimTangentIcon,
  OrdHorizontal: OrdHorizontalIcon,
  OrdVertical: OrdVerticalIcon,
  OrdAddExisting: OrdAddExistingIcon,
  OrdWindow: OrdWindowIcon,
  OrdAlign: OrdAlignIcon,
  OrdParallel: OrdParallelIcon,
  Note: NoteIcon,
  CrossHatch: CrossHatchIcon,
  Leader: LeaderIcon,
  WitnessLine: WitnessLineIcon,
  RegenAutomatic: RegenAutomaticIcon,
  RegenValidate: RegenValidateIcon,
  RegenSelect: RegenSelectIcon,
  RegenAll: RegenAllIcon,
  AlignNote: AlignNoteIcon,
  MultiEdit: MultiEditIcon,
  BreakIntoLines: BreakIntoLinesIcon
};
