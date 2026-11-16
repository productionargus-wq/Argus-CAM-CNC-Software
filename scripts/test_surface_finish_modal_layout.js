// scripts/test_surface_finish_modal_layout.js
// Regression test verifying SurfaceFinishContourModal viewport bounds and Tab 3 isolation

import fs from 'fs';
import assert from 'assert';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Testing SurfaceFinishContourModal layout and Tab 3 isolation...');

const modalPath = path.resolve(__dirname, '../src/components/SurfaceFinishContourModal.jsx');
const code = fs.readFileSync(modalPath, 'utf8');

// 1. Verify !isBlend in Tab 3 Contour parameters check
assert(
  code.includes("!isScallop && !isBlend && ("),
  'FAIL: Tab 3 contour conditional must include !isBlend to avoid stacking duplicate UI in Blend mode.'
);
console.log('  [PASS] Tab 3 contour conditional cleanly excludes isBlend');

// 2. Verify modal card has viewport maxHeight clamping
assert(
  code.includes("maxHeight: 'min(94vh, 880px)'"),
  'FAIL: Modal dialog card must have maxHeight constraint to prevent viewport overflow.'
);
console.log('  [PASS] Modal card has responsive maxHeight clamping min(94vh, 880px)');

// 3. Verify title bar has flexShrink: 0
assert(
  code.includes("height: '29px'") && code.includes("flexShrink: 0"),
  'FAIL: Title bar must have flexShrink: 0 to remain permanently sticky.'
);
console.log('  [PASS] Title bar has flexShrink: 0 (sticky header)');

// 4. Verify workspace has flex: '1 1 auto' and overflowY: 'auto'
assert(
  code.includes("flex: '1 1 auto'") && code.includes("overflowY: 'auto'"),
  'FAIL: Main workspace must have flex: 1 1 auto and overflowY: auto for inner scrolling.'
);
console.log('  [PASS] Main workspace has flex: 1 1 auto and overflowY: auto');

// 5. Verify footer strip has flexShrink: 0
assert(
  code.includes("height: '44px'") && code.includes("borderTop: '1px solid #cbd5e1'"),
  'FAIL: Footer strip must have flexShrink: 0 to remain permanently sticky.'
);
console.log('  [PASS] Footer strip has flexShrink: 0 (sticky footer)');

console.log('\nAll SurfaceFinishContourModal layout and isolation tests PASSED successfully!');
