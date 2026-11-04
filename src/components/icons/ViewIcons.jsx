import React from 'react';

/**
 * Authentic vector CAD icons for Mastercam 2018 VIEW tab
 * 1:1 reproduction of viewports, cameras, shading, managers, grids, and viewsheets.
 */

// ==================== 1. ZOOM GROUP ====================

export function ViewZoomFitIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Dashed outer boundary box */}
      <rect x="5" y="5" width="22" height="22" rx="1.5" stroke="#64748b" strokeWidth="1.2" strokeDasharray="2 2" fill="none" />
      {/* Centered blue workpiece bounding cube */}
      <rect x="10" y="10" width="12" height="12" rx="1" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
      {/* 4 Diagonal outward expansion arrows */}
      <path d="M10 10 L6 6 M6 6 H9 M6 6 V9" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 10 L26 6 M26 6 H23 M26 6 V9" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 22 L6 26 M6 26 H9 M6 26 V23" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 22 L26 26 M26 26 H23 M26 26 V23" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ViewZoomWindowIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Dashed selection window */}
      <rect x="2" y="2" width="16" height="16" rx="1" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="2 2" fill="#38bdf8" fillOpacity="0.1" />
      {/* Magnifier glass icon in center */}
      <circle cx="9" cy="9" r="4" stroke="#0284c7" strokeWidth="1.4" fill="#ffffff" fillOpacity="0.8" />
      <line x1="12" y1="12" x2="16.5" y2="16.5" stroke="#0284c7" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function ViewUnzoom50Icon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Magnifier glass */}
      <circle cx="8" cy="8" r="5" stroke="#64748b" strokeWidth="1.3" fill="#f8fafc" />
      <line x1="5.5" y1="8" x2="10.5" y2="8" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="12" x2="16" y2="16" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" />
      {/* 50% text badge */}
      <text x="11" y="18.5" fontSize="6.5" fill="#0284c7" fontWeight="bold" fontFamily="sans-serif">50</text>
    </svg>
  );
}

export function ViewUnzoom80Icon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Magnifier glass */}
      <circle cx="8" cy="8" r="5" stroke="#64748b" strokeWidth="1.3" fill="#f8fafc" />
      <line x1="5.5" y1="8" x2="10.5" y2="8" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="12" x2="16" y2="16" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" />
      {/* 80% text badge */}
      <text x="11" y="18.5" fontSize="6.5" fill="#0284c7" fontWeight="bold" fontFamily="sans-serif">80</text>
    </svg>
  );
}

// ==================== 2. GRAPHICS VIEW GROUP ====================

export function ViewGvTopIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* 3D Isometric cube */}
      {/* Top face (highlighted in cyan/emerald) */}
      <polygon points="16,4 27,10 16,16 5,10" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.2" />
      {/* Left face (shaded gray) */}
      <polygon points="5,10 16,16 16,28 5,22" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
      {/* Right face (shaded dark gray) */}
      <polygon points="16,16 27,10 27,22 16,28" fill="#94a3b8" stroke="#64748b" strokeWidth="1" />
      {/* G17 XY Top view indicator dot */}
      <circle cx="16" cy="10" r="2" fill="#ffffff" />
    </svg>
  );
}

export function ViewGvIsoIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* 3D Isometric cube with 3 visible faces */}
      <polygon points="10,2 17,6 10,10 3,6" fill="#60a5fa" stroke="#2563eb" strokeWidth="0.8" />
      <polygon points="3,6 10,10 10,18 3,14" fill="#93c5fd" stroke="#3b82f6" strokeWidth="0.8" />
      <polygon points="10,10 17,6 17,14 10,18" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="0.8" />
    </svg>
  );
}

export function ViewGvRightIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* 3D cube with Right face highlighted in green */}
      <polygon points="10,2 17,6 10,10 3,6" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.8" />
      <polygon points="3,6 10,10 10,18 3,14" fill="#94a3b8" stroke="#64748b" strokeWidth="0.8" />
      <polygon points="10,10 17,6 17,14 10,18" fill="#10b981" stroke="#047857" strokeWidth="0.8" />
    </svg>
  );
}

export function ViewGvFrontIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* 3D cube with Front face highlighted in cyan */}
      <polygon points="10,2 17,6 10,10 3,6" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.8" />
      <polygon points="3,6 10,10 10,18 3,14" fill="#06b6d4" stroke="#0891b2" strokeWidth="0.8" />
      <polygon points="10,10 17,6 17,14 10,18" fill="#94a3b8" stroke="#64748b" strokeWidth="0.8" />
    </svg>
  );
}

// ==================== 3. APPEARANCE GROUP ====================

export function ViewAppWireframeIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Wireframe CAD Sphere */}
      <circle cx="16" cy="16" r="11" stroke="#0284c7" strokeWidth="1.2" fill="none" />
      <ellipse cx="16" cy="16" rx="11" ry="4" stroke="#38bdf8" strokeWidth="1" fill="none" />
      <ellipse cx="16" cy="16" rx="4" ry="11" stroke="#38bdf8" strokeWidth="1" fill="none" />
      <line x1="5" y1="16" x2="27" y2="16" stroke="#0284c7" strokeWidth="0.8" />
      <line x1="16" y1="5" x2="16" y2="27" stroke="#0284c7" strokeWidth="0.8" />
    </svg>
  );
}

export function ViewAppOutlineShadedIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Shaded sphere with distinct dark outline rim */}
      <defs>
        <radialGradient id="outlineShadedGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#bae6fd" />
          <stop offset="45%" stopColor="#38bdf8" />
          <stop offset="85%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#0369a1" />
        </radialGradient>
      </defs>
      <circle cx="16" cy="16" r="11" fill="url(#outlineShadedGrad)" stroke="#0c4a6e" strokeWidth="1.8" />
      {/* Silhouette specular curve */}
      <path d="M8 12 Q 13 8 19 10" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.6" />
    </svg>
  );
}

export function ViewMatMetallicIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <defs>
        <radialGradient id="metalSphereGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#cbd5e1" />
          <stop offset="80%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#334155" />
        </radialGradient>
      </defs>
      <circle cx="10" cy="10" r="7" fill="url(#metalSphereGrad)" stroke="#475569" strokeWidth="0.8" />
    </svg>
  );
}

export function ViewMatPlasticIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <defs>
        <radialGradient id="plasticSphereGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#a7f3d0" />
          <stop offset="50%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </radialGradient>
      </defs>
      <circle cx="10" cy="10" r="7" fill="url(#plasticSphereGrad)" stroke="#065f46" strokeWidth="0.8" />
    </svg>
  );
}

export function ViewMatGlossyIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <defs>
        <radialGradient id="glossySphereGrad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="35%" stopColor="#f59e0b" />
          <stop offset="85%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#78350f" />
        </radialGradient>
      </defs>
      <circle cx="10" cy="10" r="7" fill="url(#glossySphereGrad)" stroke="#92400e" strokeWidth="0.8" />
    </svg>
  );
}

export function ViewMatTranslucencyIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Translucent glass sphere with refraction line */}
      <circle cx="10" cy="10" r="7" fill="#38bdf8" fillOpacity="0.35" stroke="#0284c7" strokeWidth="1" />
      <path d="M4 14 L16 6" stroke="#0284c7" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="8" cy="8" r="1.5" fill="#ffffff" fillOpacity="0.8" />
    </svg>
  );
}

export function ViewMatBacksideIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Shaded sphere split showing backside in red/gold */}
      <path d="M10 3 A7 7 0 0 0 10 17 Z" fill="#0284c7" stroke="#0369a1" strokeWidth="0.8" />
      <path d="M10 3 A7 7 0 0 1 10 17 Z" fill="#f59e0b" stroke="#d97706" strokeWidth="0.8" />
    </svg>
  );
}

// ==================== 4. MANAGERS GROUP ====================

export function ViewMgrToolpathsIcon({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      {/* Manager Pane with Toolpaths list */}
      <rect x="2" y="1" width="12" height="14" rx="1.5" fill="#ffffff" stroke="#0284c7" strokeWidth="1" />
      <rect x="3" y="2" width="10" height="3" fill="#0284c7" />
      <line x1="4" y1="7" x2="8" y2="7" stroke="#0284c7" strokeWidth="1" />
      <path d="M4 10 Q 6 9 8 10 T 12 10" stroke="#f59e0b" strokeWidth="1" fill="none" />
      <path d="M4 12 Q 6 11 8 12 T 12 12" stroke="#10b981" strokeWidth="1" fill="none" />
    </svg>
  );
}

export function ViewMgrSolidsIcon({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="2" y="1" width="12" height="14" rx="1.5" fill="#ffffff" stroke="#0284c7" strokeWidth="1" />
      <rect x="3" y="2" width="10" height="3" fill="#0284c7" />
      <polygon points="8,6 12,8 8,10 4,8" fill="#38bdf8" />
      <polygon points="4,8 8,10 8,13 4,11" fill="#0284c7" />
      <polygon points="8,10 12,8 12,11 8,13" fill="#0369a1" />
    </svg>
  );
}

export function ViewMgrPlanesIcon({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="2" y="1" width="12" height="14" rx="1.5" fill="#ffffff" stroke="#0284c7" strokeWidth="1" />
      <rect x="3" y="2" width="10" height="3" fill="#0284c7" />
      {/* Triad planes */}
      <polygon points="5,7 11,6 9,9 3,10" fill="#a855f7" fillOpacity="0.7" stroke="#7e22ce" strokeWidth="0.6" />
      <polygon points="6,9 12,8 11,13 5,14" fill="#38bdf8" fillOpacity="0.7" stroke="#0284c7" strokeWidth="0.6" />
    </svg>
  );
}

export function ViewMgrLevelsIcon({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="2" y="1" width="12" height="14" rx="1.5" fill="#ffffff" stroke="#0284c7" strokeWidth="1" />
      <rect x="3" y="2" width="10" height="3" fill="#0284c7" />
      {/* Stacked level sheets */}
      <polygon points="8,6 12,8 8,9.5 4,8" fill="#38bdf8" stroke="#0284c7" strokeWidth="0.6" />
      <polygon points="8,9 12,11 8,12.5 4,11" fill="#60a5fa" stroke="#2563eb" strokeWidth="0.6" />
    </svg>
  );
}

export function ViewMgrMultiThreadingIcon({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="2" y="1" width="12" height="14" rx="1.5" fill="#ffffff" stroke="#64748b" strokeWidth="1" />
      <rect x="3" y="2" width="10" height="3" fill="#64748b" />
      {/* CPU core threads */}
      <rect x="4.5" y="7" width="7" height="6" fill="#334155" rx="1" />
      <circle cx="6" cy="10" r="0.8" fill="#10b981" />
      <circle cx="8" cy="10" r="0.8" fill="#10b981" />
      <circle cx="10" cy="10" r="0.8" fill="#10b981" />
    </svg>
  );
}

export function ViewMgrArtIcon({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="2" y="1" width="12" height="14" rx="1.5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
      <rect x="3" y="2" width="10" height="3" fill="#94a3b8" />
      {/* Artist palette grayed */}
      <path d="M8 6 C 5.5 6 4 7.5 4 9.5 C 4 11.5 5.5 13 8 13 C 9.5 13 11 12.5 11.5 11.5 C 12 10.5 11 10 11.5 9 C 12 8 10 6 8 6 Z" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.6" />
    </svg>
  );
}

export function ViewMgrGroupsIcon({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="2" y="1" width="12" height="14" rx="1.5" fill="#ffffff" stroke="#64748b" strokeWidth="1" />
      <rect x="3" y="2" width="10" height="3" fill="#64748b" />
      {/* Group folders */}
      <rect x="4" y="6.5" width="4" height="3" fill="#f59e0b" rx="0.5" />
      <rect x="8.5" y="6.5" width="4" height="3" fill="#38bdf8" rx="0.5" />
      <rect x="6.5" y="10.5" width="4" height="3" fill="#10b981" rx="0.5" />
    </svg>
  );
}

export function ViewMgrRecentIcon({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="2" y="1" width="12" height="14" rx="1.5" fill="#ffffff" stroke="#0284c7" strokeWidth="1" />
      <rect x="3" y="2" width="10" height="3" fill="#0284c7" />
      {/* Clock icon for recent functions */}
      <circle cx="8" cy="9.5" r="3.5" stroke="#0284c7" strokeWidth="0.9" fill="none" />
      <polyline points="8,7.5 8,9.5 9.5,10" stroke="#0284c7" strokeWidth="0.9" strokeLinecap="round" />
    </svg>
  );
}

// ==================== 5. DISPLAY GROUP ====================

export function ViewDispAxesIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* 3D Coordinate Cross Axes (XYZ asterisks) */}
      <line x1="16" y1="4" x2="16" y2="28" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="4" y1="16" x2="28" y2="16" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="7" y1="23" x2="25" y2="9" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="16" cy="16" r="2.5" fill="#ffffff" stroke="#0f172a" strokeWidth="1" />
    </svg>
  );
}

export function ViewDispGnomonsIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* RGB 3D Dynamic Gnomon triad */}
      {/* Z Axis (Blue, vertical) */}
      <line x1="10" y1="24" x2="10" y2="6" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" />
      <polygon points="10,4 7,8 13,8" fill="#2563eb" />
      {/* X Axis (Red, horizontal right) */}
      <line x1="10" y1="24" x2="26" y2="24" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" />
      <polygon points="28,24 24,21 24,27" fill="#dc2626" />
      {/* Y Axis (Green, isometric diagonal) */}
      <line x1="10" y1="24" x2="22" y2="14" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" />
      <polygon points="24,12 20,13 22,17" fill="#16a34a" />
      {/* Curved rotation arrow */}
      <path d="M16 11 Q 20 14 18 19" stroke="#f59e0b" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <polygon points="17,21 20,18 16,17" fill="#f59e0b" />
    </svg>
  );
}

// ==================== 6. GRID GROUP ====================

export function ViewGridShowIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* 2D Coordinate Grid Matrix */}
      <rect x="5" y="5" width="22" height="22" rx="1" fill="#f8fafc" stroke="#64748b" strokeWidth="1.2" />
      <line x1="12" y1="5" x2="12" y2="27" stroke="#cbd5e1" strokeWidth="1" />
      <line x1="19" y1="5" x2="19" y2="27" stroke="#cbd5e1" strokeWidth="1" />
      <line x1="5" y1="12" x2="27" y2="12" stroke="#cbd5e1" strokeWidth="1" />
      <line x1="5" y1="19" x2="27" y2="19" stroke="#cbd5e1" strokeWidth="1" />
      {/* Diagonal drafting line across grid */}
      <line x1="5" y1="27" x2="27" y2="5" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ViewGridSnapIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Grid with magnet / crosshair snap point */}
      <rect x="5" y="5" width="22" height="22" rx="1" fill="#f8fafc" stroke="#64748b" strokeWidth="1.2" />
      <line x1="12" y1="5" x2="12" y2="27" stroke="#cbd5e1" strokeWidth="1" />
      <line x1="19" y1="5" x2="19" y2="27" stroke="#cbd5e1" strokeWidth="1" />
      <line x1="5" y1="12" x2="27" y2="12" stroke="#cbd5e1" strokeWidth="1" />
      <line x1="5" y1="19" x2="27" y2="19" stroke="#cbd5e1" strokeWidth="1" />
      {/* Snapped red crosshair point at intersection (19, 12) */}
      <circle cx="19" cy="12" r="2.5" fill="#ef4444" />
      {/* Snapping magnet arrow */}
      <path d="M25 21 L19 14" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" />
      <polygon points="18,13 19,16 22,15" fill="#10b981" />
    </svg>
  );
}

// ==================== 7. CONTROLLER GROUP ====================

export function ViewControllerRotationIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* 3D Trackball / SpaceMouse Rotation Knob */}
      <ellipse cx="16" cy="24" rx="10" ry="4" fill="#334155" stroke="#1e293b" strokeWidth="1" />
      <path d="M8 14 C 8 8 24 8 24 14 L 24 22 C 24 25 8 25 8 22 Z" fill="#64748b" stroke="#475569" strokeWidth="1" />
      <ellipse cx="16" cy="14" rx="8" ry="4" fill="#94a3b8" />
      {/* Circular Orbit Dial Arrow */}
      <path d="M9 13 C 11 10 21 10 23 13" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <polygon points="24,14 23,10 20,12" fill="#38bdf8" />
    </svg>
  );
}

// ==================== 8. VIEWSHEETS GROUP ====================

export function ViewsheetOnOffIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Viewsheets bar with active tab */}
      <rect x="4" y="6" width="24" height="20" rx="2" fill="#ffffff" stroke="#64748b" strokeWidth="1.2" />
      {/* Active blue bookmark tab strip */}
      <rect x="4" y="18" width="12" height="8" rx="1" fill="#0284c7" />
      <text x="6" y="24" fontSize="5.5" fill="#ffffff" fontWeight="bold" fontFamily="sans-serif">#1</text>
      {/* Plus button indicator */}
      <circle cx="21" cy="22" r="3" fill="#e2e8f0" />
      <line x1="21" y1="20.5" x2="21" y2="23.5" stroke="#475569" strokeWidth="1" />
      <line x1="19.5" y1="22" x2="22.5" y2="22" stroke="#475569" strokeWidth="1" />
      {/* Toggle light switch */}
      <circle cx="16" cy="11" r="3" fill="#10b981" />
    </svg>
  );
}

export function ViewsheetNewIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Document page with green plus badge */}
      <path d="M4 2 H12 L16 6 V18 H4 Z" fill="#ffffff" stroke="#64748b" strokeWidth="1" />
      <polygon points="12,2 12,6 16,6" fill="#cbd5e1" />
      <circle cx="13" cy="13" r="4.5" fill="#10b981" />
      <line x1="13" y1="10.5" x2="13" y2="15.5" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="10.5" y1="13" x2="15.5" y2="13" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function ViewsheetSaveBookmarkIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Document page with blue bookmark ribbon */}
      <path d="M4 2 H12 L16 6 V18 H4 Z" fill="#ffffff" stroke="#64748b" strokeWidth="1" />
      <polygon points="12,2 12,6 16,6" fill="#cbd5e1" />
      {/* Blue hanging bookmark ribbon */}
      <polygon points="8,2 12,2 12,12 10,10 8,12" fill="#0284c7" stroke="#0369a1" strokeWidth="0.8" />
    </svg>
  );
}

export function ViewsheetRestoreBookmarkIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Document page with restore/undo arrow */}
      <path d="M4 2 H12 L16 6 V18 H4 Z" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
      <polygon points="12,2 12,6 16,6" fill="#cbd5e1" />
      {/* Grayed bookmark ribbon */}
      <polygon points="8,2 12,2 12,10 10,8.5 8,10" fill="#94a3b8" stroke="#64748b" strokeWidth="0.6" />
      {/* Undo circular arrow */}
      <path d="M14 11 A 3 3 0 1 0 16 14" stroke="#0284c7" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <polygon points="14,9 14,12 17,11" fill="#0284c7" />
    </svg>
  );
}

// ==================== EXPORT MAP ====================

export const VIEW_ICON_MAP = {
  ViewZoomFit: ViewZoomFitIcon,
  ViewZoomWindow: ViewZoomWindowIcon,
  ViewUnzoom50: ViewUnzoom50Icon,
  ViewUnzoom80: ViewUnzoom80Icon,
  ViewGvTop: ViewGvTopIcon,
  ViewGvIso: ViewGvIsoIcon,
  ViewGvRight: ViewGvRightIcon,
  ViewGvFront: ViewGvFrontIcon,
  ViewAppWireframe: ViewAppWireframeIcon,
  ViewAppOutlineShaded: ViewAppOutlineShadedIcon,
  ViewMatMetallic: ViewMatMetallicIcon,
  ViewMatPlastic: ViewMatPlasticIcon,
  ViewMatGlossy: ViewMatGlossyIcon,
  ViewMatTranslucency: ViewMatTranslucencyIcon,
  ViewMatBackside: ViewMatBacksideIcon,
  ViewMgrToolpaths: ViewMgrToolpathsIcon,
  ViewMgrSolids: ViewMgrSolidsIcon,
  ViewMgrPlanes: ViewMgrPlanesIcon,
  ViewMgrLevels: ViewMgrLevelsIcon,
  ViewMgrMultiThreading: ViewMgrMultiThreadingIcon,
  ViewMgrArt: ViewMgrArtIcon,
  ViewMgrGroups: ViewMgrGroupsIcon,
  ViewMgrRecent: ViewMgrRecentIcon,
  ViewDispAxes: ViewDispAxesIcon,
  ViewDispGnomons: ViewDispGnomonsIcon,
  ViewGridShow: ViewGridShowIcon,
  ViewGridSnap: ViewGridSnapIcon,
  ViewControllerRotation: ViewControllerRotationIcon,
  ViewsheetOnOff: ViewsheetOnOffIcon,
  ViewsheetNew: ViewsheetNewIcon,
  ViewsheetSaveBookmark: ViewsheetSaveBookmarkIcon,
  ViewsheetRestoreBookmark: ViewsheetRestoreBookmarkIcon
};
