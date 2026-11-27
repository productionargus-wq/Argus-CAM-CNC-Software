import { processVoiceCommand, isRecognizableIntent } from '../src/utils/aiCamDispatcher.js';
import aiVoiceEngine from '../src/utils/aiVoiceEngine.js';

const testCases = [
  // Interruption
  {
    input: "stop",
    expectedAction: "INTERRUPT"
  },
  {
    input: "hold on a sec",
    expectedAction: "INTERRUPT"
  },
  // Advanced views
  {
    input: "show plan view",
    expectedAction: "CAMERA_VIEW",
    expectedPreset: "top"
  },
  {
    input: "bird's eye view",
    expectedAction: "CAMERA_VIEW",
    expectedPreset: "top"
  },
  {
    input: "elevation view",
    expectedAction: "CAMERA_VIEW",
    expectedPreset: "front"
  },
  // Advanced rotations
  {
    input: "rotate half turn",
    expectedAction: "ROTATE_PART",
    expectedDegrees: 180,
    expectedAxis: "z"
  },
  {
    input: "quarter turn on x",
    expectedAction: "ROTATE_PART",
    expectedDegrees: 90,
    expectedAxis: "x"
  },
  {
    input: "flip upside down",
    expectedAction: "ROTATE_PART",
    expectedDegrees: 180,
    expectedAxis: "x"
  },
  // Advanced translations
  {
    input: "move positive x 25 mm",
    expectedAction: "TRANSLATE_PART",
    expectedDx: 25
  },
  {
    input: "nudge -z 15 mm",
    expectedAction: "TRANSLATE_PART",
    expectedDz: -15
  }
];

let passed = 0;
console.log("Running Advanced AI Voice Dispatcher Unit Tests...\n");

for (const tc of testCases) {
  const result = processVoiceCommand(tc.input, {
    partMetrics: { dimensions: { x: 120, y: 30, z: 80 } },
    operations: [{ id: 1, name: "Roughing" }]
  });

  let ok = result.actionType === tc.expectedAction;
  if (tc.expectedPreset && result.payload?.preset !== tc.expectedPreset) ok = false;
  if (tc.expectedDegrees && result.payload?.degrees !== tc.expectedDegrees) ok = false;
  if (tc.expectedAxis && result.payload?.axis !== tc.expectedAxis) ok = false;
  if (tc.expectedDx !== undefined && result.payload?.dx !== tc.expectedDx) ok = false;
  if (tc.expectedDz !== undefined && result.payload?.dz !== tc.expectedDz) ok = false;

  if (ok) {
    console.log(`[PASS] "${tc.input}" -> ${result.actionType} | Spoken: "${result.speechText}"`);
    passed++;
  } else {
    console.error(`[FAIL] "${tc.input}" -> Expected ${tc.expectedAction}, got ${result.actionType}`, result);
  }
}

// Test isRecognizableIntent
const intentCases = ["stop", "show top view", "half turn", "random gibberish hello foo bar"];
console.log("\nTesting isRecognizableIntent helper...");
for (const phrase of intentCases) {
  const isIntent = isRecognizableIntent(phrase);
  console.log(`  "${phrase}": ${isIntent}`);
}

// Test Echo Rejection
console.log("\nTesting Echo Rejection...");
aiVoiceEngine.currentSpeakingText = "Rotated workpiece 180 degrees around Z axis.";
const isEcho1 = aiVoiceEngine.isEchoOfAISpeech("Rotated workpiece 180");
const isEcho2 = aiVoiceEngine.isEchoOfAISpeech("show top view");
console.log(`  Echo test (same text): ${isEcho1} (Expected true)`);
console.log(`  Echo test (different user command): ${isEcho2} (Expected false)`);

if (passed === testCases.length && isEcho1 === true && isEcho2 === false) {
  console.log(`\nAll ${passed}/${testCases.length} advanced unit tests passed successfully!`);
} else {
  console.error("\nSome tests failed.");
  process.exit(1);
}
