import React from 'react';

/**
 * Authentic vector icons for Mastercam 2018 MACHINE tab
 * Styled with CNC machine spindles, lathe chucks, wire EDM guides,
 * controller terminals, simulators, G1 post badges, setup sheets, and ATP tools.
 */

// ==================== 1. MACHINE TYPE GROUP ====================

export function MachineMillIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Blue machine spindle casing */}
      <rect x="8" y="4" width="16" height="10" rx="1" fill="#0284c7" stroke="#0369a1" strokeWidth="1.2" />
      <line x1="8" y1="9" x2="24" y2="9" stroke="#38bdf8" strokeWidth="1" />
      {/* Spindle nose / collet chuck */}
      <polygon points="11,14 21,14 19,19 13,19" fill="#94a3b8" stroke="#64748b" strokeWidth="1" />
      {/* Endmill fluted cutter */}
      <rect x="14.5" y="19" width="3" height="8" fill="#ca8a04" stroke="#a16207" strokeWidth="0.8" />
      <line x1="14.5" y1="21" x2="17.5" y2="23" stroke="#fef08a" strokeWidth="0.8" />
      <line x1="14.5" y1="24" x2="17.5" y2="26" stroke="#fef08a" strokeWidth="0.8" />
    </svg>
  );
}

export function MachineLatheIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* 3-Jaw Lathe Chuck */}
      <rect x="4" y="6" width="7" height="20" rx="1" fill="#475569" stroke="#334155" strokeWidth="1.2" />
      <rect x="11" y="8" width="4" height="4" fill="#94a3b8" />
      <rect x="11" y="20" width="4" height="4" fill="#94a3b8" />
      {/* Cylindrical turned shaft workpiece */}
      <polygon points="15,10 27,10 27,22 15,22" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
      <ellipse cx="27" cy="16" rx="2" ry="6" fill="#38bdf8" />
      {/* Turning cutting insert tool */}
      <polygon points="23,4 27,8 24,10 20,6" fill="#f59e0b" stroke="#b45309" strokeWidth="0.8" />
    </svg>
  );
}

export function MachineMillTurnIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Dual spindle lathe chuck on left */}
      <rect x="3" y="10" width="5" height="14" rx="1" fill="#475569" />
      <rect x="8" y="13" width="8" height="8" fill="#0284c7" />
      {/* B-Axis pivoting milling head on top right */}
      <g transform="translate(16, 4) rotate(25)">
        <rect x="0" y="0" width="10" height="7" rx="1" fill="#0284c7" />
        <rect x="3" y="7" width="4" height="6" fill="#ca8a04" />
      </g>
    </svg>
  );
}

export function MachineWireIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Upper diamond wire guide */}
      <polygon points="16,3 20,7 16,11 12,7" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
      {/* Lower diamond wire guide */}
      <polygon points="16,21 20,25 16,29 12,25" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
      {/* Vertical brass EDM wire */}
      <line x1="16" y1="7" x2="16" y2="25" stroke="#f59e0b" strokeWidth="1.5" />
      {/* Electric discharge spark burst */}
      <circle cx="16" cy="16" r="2.5" fill="#38bdf8" />
      <line x1="13" y1="16" x2="19" y2="16" stroke="#ffffff" strokeWidth="1" />
      <line x1="16" y1="13" x2="16" y2="19" stroke="#ffffff" strokeWidth="1" />
    </svg>
  );
}

export function MachineRouterIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Overhead CNC router gantry bridge */}
      <rect x="4" y="4" width="24" height="5" rx="1" fill="#475569" stroke="#334155" strokeWidth="1" />
      {/* Router spindle carriage */}
      <rect x="12" y="9" width="8" height="9" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
      {/* High-speed router bit */}
      <polygon points="15,18 17,18 16.5,24 15.5,24" fill="#ca8a04" />
      {/* Wood/composite panel bed */}
      <rect x="3" y="24" width="26" height="4" fill="#d97706" />
    </svg>
  );
}

export function MachineDesignIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Set-square drafting triangle */}
      <polygon points="4,28 28,28 28,4" fill="#fde68a" stroke="#d97706" strokeWidth="1.2" />
      <polygon points="9,25 25,25 25,9" fill="#ffffff" stroke="#d97706" strokeWidth="1" />
      {/* Technical compass drafting arm */}
      <line x1="16" y1="4" x2="9" y2="22" stroke="#0284c7" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="16" y1="4" x2="23" y2="22" stroke="#0284c7" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="16" cy="4" r="2.5" fill="#0284c7" />
    </svg>
  );
}

// ==================== 2. JOB SETUP GROUP ====================

export function ControlDefinitionIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* CNC Operator Controller Cabinet */}
      <rect x="5" y="4" width="22" height="24" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.2" />
      {/* LCD Screen Display */}
      <rect x="8" y="7" width="16" height="10" rx="1" fill="#0284c7" />
      <line x1="10" y1="10" x2="16" y2="10" stroke="#ffffff" strokeWidth="1" />
      <line x1="10" y1="13" x2="20" y2="13" stroke="#ffffff" strokeWidth="1" />
      {/* Keypad & E-Stop */}
      <circle cx="9" cy="22" r="1.5" fill="#ef4444" />
      <circle cx="14" cy="20" r="1" fill="#94a3b8" />
      <circle cx="18" cy="20" r="1" fill="#94a3b8" />
      <circle cx="22" cy="20" r="1" fill="#94a3b8" />
      <circle cx="14" cy="24" r="1" fill="#94a3b8" />
      <circle cx="18" cy="24" r="1" fill="#94a3b8" />
      <circle cx="22" cy="24" r="1" fill="#94a3b8" />
    </svg>
  );
}

export function MachineDefinitionIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Machine tool enclosure */}
      <rect x="4" y="4" width="24" height="24" rx="2" fill="#1e293b" stroke="#64748b" strokeWidth="1.2" />
      {/* Safety glass observation window */}
      <rect x="7" y="7" width="12" height="14" fill="#38bdf8" opacity="0.3" stroke="#38bdf8" strokeWidth="1" />
      {/* Spindle inside machine */}
      <rect x="11" y="9" width="4" height="6" fill="#94a3b8" />
      {/* Machine status beacon on top */}
      <circle cx="8" cy="2" r="1.8" fill="#10b981" />
    </svg>
  );
}

export function MaterialDefinitionIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Stacked raw stock cylindrical billets */}
      {/* Bottom Billet */}
      <ellipse cx="14" cy="23" rx="9" ry="3.5" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
      <rect x="5" y="19" width="18" height="4" fill="#cbd5e1" />
      <ellipse cx="14" cy="19" rx="9" ry="3.5" fill="#e2e8f0" stroke="#475569" strokeWidth="1" />
      {/* Top Billet (Copper/Bronze alloy) */}
      <ellipse cx="18" cy="13" rx="8" ry="3.2" fill="#d97706" stroke="#b45309" strokeWidth="1" />
      <rect x="10" y="9" width="16" height="4" fill="#f59e0b" />
      <ellipse cx="18" cy="9" rx="8" ry="3.2" fill="#fde68a" stroke="#b45309" strokeWidth="1" />
    </svg>
  );
}

// ==================== 3. SIMULATOR GROUP ====================

export function SimulatorBackplotIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Wavy 3D toolpath motion curve */}
      <path d="M4 22 C 10 12, 14 26, 20 16 S 26 10, 28 8" stroke="#0284c7" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {/* Cutter vector cone at leading point */}
      <polygon points="28,8 24,14 28,14" fill="#ca8a04" stroke="#a16207" strokeWidth="0.8" />
      <line x1="28" y1="8" x2="28" y2="4" stroke="#475569" strokeWidth="1.5" />
    </svg>
  );
}

export function SimulatorVerifyIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Solid stock workpiece block */}
      <polygon points="16,5 27,11 16,17 5,11" fill="#fde68a" stroke="#d97706" strokeWidth="1" />
      <polygon points="5,11 16,17 16,27 5,21" fill="#d97706" stroke="#b45309" strokeWidth="1" />
      <polygon points="16,17 27,11 27,21 16,27" fill="#b45309" stroke="#78350f" strokeWidth="1" />
      {/* Excavated milled cavity inside */}
      <polygon points="16,9 22,12 16,15 10,12" fill="#0284c7" stroke="#0369a1" strokeWidth="0.8" />
    </svg>
  );
}

export function SimulatorSimulateIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Full 3D machine digital twin simulation */}
      <rect x="4" y="4" width="24" height="24" rx="2" fill="#0f172a" stroke="#10b981" strokeWidth="1.2" />
      {/* Trunnion rotary table & workpiece inside */}
      <ellipse cx="16" cy="22" rx="7" ry="3" fill="#64748b" />
      <rect x="13" y="16" width="6" height="5" fill="#f59e0b" />
      {/* Spindle cutting down */}
      <polygon points="14,8 18,8 16,14" fill="#38bdf8" />
    </svg>
  );
}

// ==================== 4. POST GROUP ====================

export function PostGenerateIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Post-processing badge */}
      <text x="3" y="24" fontSize="20" fontWeight="900" fill="#0284c7" fontFamily="sans-serif">G1</text>
      {/* Output NC program code file */}
      <path d="M22 6 L28 12 V 26 H 18 V 6 Z" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
      <polyline points="22,6 22,12 28,12" stroke="#94a3b8" strokeWidth="1" fill="#e2e8f0" />
      <line x1="20" y1="16" x2="26" y2="16" stroke="#0284c7" strokeWidth="1" />
      <line x1="20" y1="20" x2="26" y2="20" stroke="#0284c7" strokeWidth="1" />
    </svg>
  );
}

// ==================== 5. SETUP SHEET GROUP ====================

export function SetupSheetCreateIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Toolholder assembly */}
      <polygon points="6,6 12,6 10,13 8,13" fill="#ca8a04" stroke="#a16207" strokeWidth="0.8" />
      {/* Printable CNC setup sheet clipboard */}
      <rect x="12" y="8" width="16" height="20" rx="1.5" fill="#ffffff" stroke="#64748b" strokeWidth="1.2" />
      <rect x="16" y="6" width="8" height="4" rx="1" fill="#94a3b8" />
      {/* Checkmarks / operation list lines */}
      <line x1="15" y1="14" x2="25" y2="14" stroke="#0284c7" strokeWidth="1.2" />
      <line x1="15" y1="18" x2="25" y2="18" stroke="#0284c7" strokeWidth="1.2" />
      <line x1="15" y1="22" x2="22" y2="22" stroke="#0284c7" strokeWidth="1.2" />
    </svg>
  );
}

export function ImageCaptureIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Camera body */}
      <rect x="3" y="5" width="14" height="11" rx="2" fill="#475569" stroke="#334155" strokeWidth="1" />
      <path d="M7 5 L8 3 H 12 L13 5 Z" fill="#475569" />
      {/* Lens with reflection */}
      <circle cx="10" cy="11" r="3.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.8" />
      <circle cx="11.5" cy="9.5" r="1" fill="#ffffff" />
    </svg>
  );
}

export function ClearImageListIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Photo frame */}
      <rect x="3" y="3" width="14" height="14" rx="1.5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
      {/* Mountain & sun inside photo */}
      <circle cx="7" cy="7" r="1.5" fill="#f59e0b" />
      <polygon points="4,14 8,9 11,13 13,11 16,14" fill="#cbd5e1" />
      {/* Red clear / delete badge */}
      <circle cx="15" cy="5" r="3.5" fill="#ef4444" />
      <line x1="13" y1="5" x2="17" y2="5" stroke="#ffffff" strokeWidth="1.2" />
    </svg>
  );
}

// ==================== 6. MACHINE SIMULATION GROUP ====================

export function MachineSimRunIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Trunnion 5-axis rotary table */}
      <ellipse cx="14" cy="22" rx="9" ry="4" fill="#64748b" stroke="#475569" strokeWidth="1" />
      <rect x="9" y="16" width="10" height="6" fill="#38bdf8" />
      {/* Vibrant green run play triangle */}
      <polygon points="20,8 30,14 20,20" fill="#10b981" stroke="#047857" strokeWidth="1" />
    </svg>
  );
}

export function MachineSimBackplotIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Toolpath lines */}
      <path d="M3 15 Q 10 5 17 10" stroke="#0284c7" strokeWidth="1.5" fill="none" />
      <polygon points="17,10 14,8 15,11" fill="#0284c7" />
    </svg>
  );
}

export function MachineSimVerifyIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Milled block with checkmark */}
      <rect x="3" y="4" width="14" height="12" rx="1" fill="#fde68a" stroke="#d97706" strokeWidth="1" />
      <path d="M7 10 L9 12 L14 7" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ==================== 7. AUTOMATIC TOOLPATHING GROUP ====================

export function ATPIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Magic Wand */}
      <line x1="6" y1="26" x2="22" y2="10" stroke="#ca8a04" strokeWidth="3" strokeLinecap="round" />
      <polygon points="20,12 24,8 21,7 19,11" fill="#fef08a" />
      {/* Sparkling Stars */}
      <polygon points="24,3 25,6 28,7 25,8 24,11 23,8 20,7 23,6" fill="#eab308" />
      <polygon points="12,4 12.8,6 15,6.5 12.8,7 12,9 11.2,7 9,6.5 11.2,6" fill="#38bdf8" />
      <polygon points="27,15 27.5,16.5 29,17 27.5,17.5 27,19 26.5,17.5 25,17 26.5,16.5" fill="#f59e0b" />
    </svg>
  );
}

export function ATPCurrentFileIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Document */}
      <path d="M4 2 H 12 L 16 6 V 18 H 4 Z" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
      {/* ATP Wand across document */}
      <line x1="7" y1="14" x2="14" y2="7" stroke="#ca8a04" strokeWidth="1.5" />
      <circle cx="14" cy="7" r="1.5" fill="#eab308" />
    </svg>
  );
}

export function ATPReportsIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Report sheet with bar chart */}
      <rect x="3" y="2" width="14" height="16" rx="1" fill="#ffffff" stroke="#64748b" strokeWidth="1" />
      <rect x="5" y="12" width="2" height="4" fill="#0284c7" />
      <rect x="8.5" y="9" width="2" height="7" fill="#10b981" />
      <rect x="12" y="6" width="2" height="10" fill="#f59e0b" />
    </svg>
  );
}

export function ATPOptionsIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Settings Gear */}
      <circle cx="10" cy="10" r="3" stroke="#475569" strokeWidth="1.5" fill="none" />
      <path d="M10 2 V 4 M10 16 V 18 M2 10 H 4 M16 10 H 18 M4.5 4.5 L 6 6 M14 14 L 15.5 15.5 M4.5 15.5 L 6 14 M14 6 L 15.5 4.5" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ==================== EXPORT MAP ====================

export const MACHINE_ICON_MAP = {
  MachineMill: MachineMillIcon,
  MachineLathe: MachineLatheIcon,
  MachineMillTurn: MachineMillTurnIcon,
  MachineWire: MachineWireIcon,
  MachineRouter: MachineRouterIcon,
  MachineDesign: MachineDesignIcon,
  ControlDefinition: ControlDefinitionIcon,
  MachineDefinition: MachineDefinitionIcon,
  MaterialDefinition: MaterialDefinitionIcon,
  SimulatorBackplotIcon: SimulatorBackplotIcon,
  SimulatorBackplot: SimulatorBackplotIcon,
  SimulatorVerify: SimulatorVerifyIcon,
  SimulatorSimulate: SimulatorSimulateIcon,
  PostGenerate: PostGenerateIcon,
  SetupSheetCreate: SetupSheetCreateIcon,
  ImageCapture: ImageCaptureIcon,
  ClearImageList: ClearImageListIcon,
  MachineSimRun: MachineSimRunIcon,
  MachineSimBackplot: MachineSimBackplotIcon,
  MachineSimVerify: MachineSimVerifyIcon,
  ATP: ATPIcon,
  ATPCurrentFile: ATPCurrentFileIcon,
  ATPReports: ATPReportsIcon,
  ATPOptions: ATPOptionsIcon
};
