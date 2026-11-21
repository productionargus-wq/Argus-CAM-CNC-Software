/**
 * Mastercam CAD Cursor Utilities
 * Provides authentic Mastercam SVG-based cursors (Scissors, AutoCursor Crosshair, Pick Box, etc.)
 */

// Mastercam Dynamic Trim Signature Red Scissors (32x32)
// Hotspot: (5, 3) at the tip of the upper-left cutting blade
export const MASTERCAM_SCISSORS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <defs>
    <filter id="mcam_scissor_shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="1" dy="1" stdDeviation="0.8" flood-color="#000000" flood-opacity="0.75"/>
    </filter>
  </defs>
  <g filter="url(#mcam_scissor_shadow)">
    <!-- High-contrast crisp border silhouette -->
    <path d="M 5,3 L 13,13 L 8,19 C 5.5,19 4,21 4,23.5 C 4,26.5 6.5,28.5 9.5,28.5 C 12,28.5 14,27 15,24.5 L 17,24.5 C 18,27 20,28.5 22.5,28.5 C 25.5,28.5 28,26.5 28,23.5 C 28,21 26.5,19 24,19 L 19,13 L 27,3 L 24,2 L 16,11 L 8,2 Z" fill="#ffffff" stroke="#0f172a" stroke-width="1.6" stroke-linejoin="round"/>
    
    <!-- Left Blade to top-right tip -->
    <path d="M 16,12 L 26,3 L 23.5,2 L 14,11 Z" fill="#e2e8f0" stroke="#334155" stroke-width="0.8"/>
    
    <!-- Right Blade to top-left tip (Hotspot at 5, 3) -->
    <path d="M 16,12 L 5,3 L 7.5,2 L 17,11 Z" fill="#cbd5e1" stroke="#1e293b" stroke-width="0.8"/>
    
    <!-- Left Handle Loop (Signature Mastercam Red) -->
    <ellipse cx="9" cy="23.5" rx="4.5" ry="4.5" fill="#ef4444" stroke="#991b1b" stroke-width="1.2"/>
    <ellipse cx="9" cy="23.5" rx="2.2" ry="2.2" fill="#ffffff" stroke="#991b1b" stroke-width="0.6"/>
    
    <!-- Right Handle Loop (Signature Mastercam Red) -->
    <ellipse cx="23" cy="23.5" rx="4.5" ry="4.5" fill="#ef4444" stroke="#991b1b" stroke-width="1.2"/>
    <ellipse cx="23" cy="23.5" rx="2.2" ry="2.2" fill="#ffffff" stroke="#991b1b" stroke-width="0.6"/>
    
    <!-- Center Pivot Brass Rivet -->
    <circle cx="16" cy="12" r="2.2" fill="#f59e0b" stroke="#78350f" stroke-width="0.8"/>
    <circle cx="16" cy="12" r="0.8" fill="#fef3c7"/>
  </g>
</svg>`;

// Base64 Data URL for CSS cursor property
const scissorsBase64 = typeof window !== 'undefined' && window.btoa 
  ? window.btoa(MASTERCAM_SCISSORS_SVG) 
  : Buffer.from(MASTERCAM_SCISSORS_SVG).toString('base64');

export const MASTERCAM_SCISSORS_CURSOR = `url("data:image/svg+xml;base64,${scissorsBase64}") 5 3, crosshair`;

export const isTrimTool = (tool) => {
  return ['dynamic_trim', 'trim', 'trim_1', 'trim_2', 'trim_3', 'divide'].includes(tool);
};
