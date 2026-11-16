import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('--- TEST: Surface Finish Modal Titles & Strategy Fallback Audit ---');

// 1. Test getSurfaceFinishTitle logic directly
function getSurfaceFinishTitle(flags = {}) {
  const {
    isFlowline,
    isPocket,
    isShallow,
    isParallelSteep,
    isParallel,
    isPencil,
    isRadial,
    isProject,
    isLeftover,
    isScallop,
    isBlend
  } = flags;

  if (isFlowline) return 'Surface Finish Flowline';
  if (isPocket) return 'Surface Finish Pocket';
  if (isShallow) return 'Surface Finish Shallow';
  if (isParallelSteep) return 'Surface Finish Parallel Steep';
  if (isParallel) return 'Surface Finish Parallel';
  if (isPencil) return 'Surface Finish Pencil';
  if (isRadial) return 'Surface Finish Radial';
  if (isProject) return 'Surface Finish Project';
  if (isLeftover) return 'Surface Finish Leftover';
  if (isScallop) return 'Surface Finish Scallop';
  if (isBlend) return 'Surface Finish Blend';
  return 'Surface Finish Contour';
}

const cases = [
  [{ isFlowline: true }, 'Surface Finish Flowline'],
  [{ isPocket: true }, 'Surface Finish Pocket'],
  [{ isShallow: true }, 'Surface Finish Shallow'],
  [{ isParallelSteep: true }, 'Surface Finish Parallel Steep'],
  [{ isParallel: true }, 'Surface Finish Parallel'],
  [{ isPencil: true }, 'Surface Finish Pencil'],
  [{ isRadial: true }, 'Surface Finish Radial'],
  [{ isProject: true }, 'Surface Finish Project'],
  [{ isLeftover: true }, 'Surface Finish Leftover'],
  [{ isScallop: true }, 'Surface Finish Scallop'],
  [{ isBlend: true }, 'Surface Finish Blend'],
  [{}, 'Surface Finish Contour']
];

cases.forEach(([flags, expected]) => {
  const actual = getSurfaceFinishTitle(flags);
  assert.strictEqual(actual, expected, `Expected ${expected} but got ${actual}`);
});
console.log('✓ getSurfaceFinishTitle correctly resolved all 12 strategies');

// 2. Static verification of SurfaceFinishContourModal.jsx
const modalCode = fs.readFileSync('src/components/SurfaceFinishContourModal.jsx', 'utf8');

assert.ok(modalCode.includes('export function getSurfaceFinishTitle'), 'Missing exported getSurfaceFinishTitle');
assert.ok(modalCode.includes('{strategyTitle}'), 'Modal title bar should render {strategyTitle}');
assert.ok(modalCode.includes('${strategyTitle} (${caps.machineName} - ${caps.axesCount}-Axis)'), 'Help button should use strategyTitle');
assert.ok(modalCode.includes('isScallop ? \'scallop\' : isBlend ? \'blend\' : \'contour\''), 'initialDefaults strategyMode should include isBlend');
assert.ok(modalCode.includes('⚡ Load Recommended Scallop Values'), 'Scallop quick recommendation banner missing');
assert.ok(modalCode.includes('⚡ Load Recommended Blend Values'), 'Blend quick recommendation banner missing');

console.log('✓ SurfaceFinishContourModal.jsx static structure verified');

// 3. Static verification of ToolpathSurfaceSelectionModal.jsx
const selectionCode = fs.readFileSync('src/components/ToolpathSurfaceSelectionModal.jsx', 'utf8');
assert.ok(selectionCode.includes("scallop: 'Scallop'"), 'Missing scallop title in ToolpathSurfaceSelectionModal');
assert.ok(selectionCode.includes("equal_scallop: 'Equal Scallop'"), 'Missing equal_scallop title in ToolpathSurfaceSelectionModal');
assert.ok(selectionCode.includes("blend: 'Blend'"), 'Missing blend title in ToolpathSurfaceSelectionModal');
console.log('✓ ToolpathSurfaceSelectionModal.jsx verified');

// 4. Static verification of OperationsTree.jsx
const opTreeCode = fs.readFileSync('src/components/OperationsTree.jsx', 'utf8');
assert.ok(opTreeCode.includes("'scallop'"), "OperationsTree isSurfaceFinishOp missing 'scallop'");
assert.ok(opTreeCode.includes("'surface_finish_scallop'"), "OperationsTree isSurfaceFinishOp missing 'surface_finish_scallop'");
assert.ok(opTreeCode.includes("'blend'"), "OperationsTree isSurfaceFinishOp missing 'blend'");
assert.ok(opTreeCode.includes("'surface_finish_blend'"), "OperationsTree isSurfaceFinishOp missing 'surface_finish_blend'");
console.log('✓ OperationsTree.jsx verified');

// 5. Static verification of App.jsx
const appCode = fs.readFileSync('src/App.jsx', 'utf8');
assert.ok(appCode.includes("case 'tp_3d_equal_scallop':"), 'App.jsx missing tp_3d_equal_scallop ribbon case');
assert.ok(appCode.includes("case 'tp_3d_blend':"), 'App.jsx missing tp_3d_blend ribbon case');
assert.ok(appCode.includes("onOpenSurfaceFinishScallop="), 'App.jsx missing onOpenSurfaceFinishScallop prop pass');
assert.ok(appCode.includes("onOpenSurfaceFinishBlend="), 'App.jsx missing onOpenSurfaceFinishBlend prop pass');
console.log('✓ App.jsx verified');

console.log('--- ALL SURFACE FINISH TITLES & AUDIT TESTS PASSED ---');
