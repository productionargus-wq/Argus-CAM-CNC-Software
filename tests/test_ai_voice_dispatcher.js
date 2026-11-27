import { processVoiceCommand } from '../src/utils/aiCamDispatcher.js';

const testCases = [
  {
    input: "show the top view",
    expectedAction: "CAMERA_VIEW",
    expectedPreset: "top"
  },
  {
    input: "switch to isometric",
    expectedAction: "CAMERA_VIEW",
    expectedPreset: "iso"
  },
  {
    input: "rotate 180 degree",
    expectedAction: "ROTATE_PART",
    expectedDegrees: 180,
    expectedAxis: "z"
  },
  {
    input: "rotate 90 degrees around x axis",
    expectedAction: "ROTATE_PART",
    expectedDegrees: 90,
    expectedAxis: "x"
  },
  {
    input: "move 20 mm on x axis",
    expectedAction: "TRANSLATE_PART",
    expectedDx: 20
  },
  {
    input: "translate 10 mm up",
    expectedAction: "TRANSLATE_PART",
    expectedDy: 10
  },
  {
    input: "reset workpiece position",
    expectedAction: "RESET_TRANSFORM"
  },
  {
    input: "start simulation",
    expectedAction: "CAM_ACTION"
  },
  {
    input: "wireframe mode",
    expectedAction: "RENDER_MODE"
  },
  {
    input: "what is the workpiece size",
    expectedAction: "INFO_QUERY"
  }
];

let passed = 0;
console.log("Running AI Voice Dispatcher Unit Tests...\n");

for (const tc of testCases) {
  const result = processVoiceCommand(tc.input, {
    partMetrics: { dimensions: { x: 120, y: 30, z: 80 } },
    operations: [{ id: 1, name: "Roughing" }]
  });

  let ok = result.actionType === tc.expectedAction;
  if (tc.expectedPreset && result.payload?.preset !== tc.expectedPreset) ok = false;
  if (tc.expectedDegrees && result.payload?.degrees !== tc.expectedDegrees) ok = false;
  if (tc.expectedAxis && result.payload?.axis !== tc.expectedAxis) ok = false;
  if (tc.expectedDx && result.payload?.dx !== tc.expectedDx) ok = false;
  if (tc.expectedDy && result.payload?.dy !== tc.expectedDy) ok = false;

  if (ok) {
    console.log(`[PASS] "${tc.input}" -> ${result.actionType} | Spoken: "${result.speechText}"`);
    passed++;
  } else {
    console.error(`[FAIL] "${tc.input}" -> Expected ${tc.expectedAction}, got ${result.actionType}`, result);
  }
}

console.log(`\nTests completed: ${passed}/${testCases.length} passed.`);
if (passed === testCases.length) {
  console.log("All unit tests passed successfully!");
} else {
  process.exit(1);
}
