const fs = require('fs');
const path = require('path');

async function testAllImports() {
  console.log("=== Testing CAD Parser and Import Flow for STEP and STL ===");

  const { parseAnyCADFile } = await import('../src/utils/universalCadParser.js');

  // 1. Test STEP file
  const stepPath = path.resolve(__dirname, '../samples/cad/Mold_Steep_Finishing_Sample.step');
  const stepText = fs.readFileSync(stepPath, 'utf-8');
  const mockStepFile = {
    name: 'Mold_Steep_Finishing_Sample.step',
    text: async () => stepText,
    arrayBuffer: async () => Buffer.from(stepText)
  };

  const stepResult = await parseAnyCADFile(mockStepFile);
  const stepGroup = stepResult?.group || (stepResult?.isObject3D ? stepResult : null);
  if (!stepGroup) throw new Error("STEP group resolution failed");
  console.log("STEP Import Passed: Bounds =", stepGroup.userData?.bounds ? "OK" : "Missing");

  // 2. Test STL file
  const stlPath = path.resolve(__dirname, '../samples/cad/Mold_Steep_Finishing_Sample.stl');
  const stlBuffer = fs.readFileSync(stlPath);
  const mockStlFile = {
    name: 'Mold_Steep_Finishing_Sample.stl',
    text: async () => stlBuffer.toString('utf-8'),
    arrayBuffer: async () => stlBuffer.buffer.slice(stlBuffer.byteOffset, stlBuffer.byteOffset + stlBuffer.byteLength)
  };

  const stlResult = await parseAnyCADFile(mockStlFile);
  const stlGroup = stlResult?.group || (stlResult?.isObject3D ? stlResult : null);
  if (!stlGroup) throw new Error("STL group resolution failed");
  console.log("STL Import Passed: Bounds =", stlGroup.userData?.bounds ? "OK" : "Missing");

  console.log("=== ALL CAD IMPORT TESTS PASSED SUCCESSFULLY! ===");
}

testAllImports().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
