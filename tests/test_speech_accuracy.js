import { processVoiceCommand } from '../src/utils/aiCamDispatcher.js';
import { normalizeTranscript, selectBestAlternative } from '../src/utils/cadSpeechNormalizer.js';
import aiVoiceEngine from '../src/utils/aiVoiceEngine.js';

console.log("Running Speech Accuracy & Homophone Normalization Tests...\n");

let passed = 0;
let total = 0;

function assertTest(desc, condition, details = "") {
  total++;
  if (condition) {
    console.log(`[PASS] ${desc}`);
    passed++;
  } else {
    console.error(`[FAIL] ${desc} -> ${details}`);
  }
}

// 1. "more" -> "move" direct phonetic normalization
const testMore1 = normalizeTranscript("more");
assertTest('"more" normalizes to "move"', testMore1.normalized === "move", testMore1.normalized);

const testMore2 = normalizeTranscript("more 20 mm on x");
assertTest('"more 20 mm on x" normalizes to "move 20 mm on x"', testMore2.normalized === "move 20 mm on x", testMore2.normalized);

const testMore3 = normalizeTranscript("more workpiece");
assertTest('"more workpiece" normalizes to "move workpiece"', testMore3.normalized === "move workpiece", testMore3.normalized);

// 2. Dispatcher integration with "more"
const cmdMore = processVoiceCommand("more 20 mm on x", {
  partTransform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
});
assertTest('"more 20 mm on x" produces TRANSLATE_PART', cmdMore.actionType === "TRANSLATE_PART" && cmdMore.payload?.dx === 20, JSON.stringify(cmdMore));
assertTest('Identifies auto-correction from "more"', cmdMore.isCorrected === true && cmdMore.correctedFrom === "more 20 mm on x");

// 3. "tap view" -> "top view"
const cmdTap = processVoiceCommand("tap view");
assertTest('"tap view" produces CAMERA_VIEW top', cmdTap.actionType === "CAMERA_VIEW" && cmdTap.payload?.preset === "top", JSON.stringify(cmdTap));

// 4. "ice metric" -> "isometric"
const cmdIce = processVoiceCommand("ice metric view");
assertTest('"ice metric view" produces CAMERA_VIEW iso', cmdIce.actionType === "CAMERA_VIEW" && cmdIce.payload?.preset === "iso", JSON.stringify(cmdIce));

// 5. "feed view" -> "fit view"
const cmdFeed = processVoiceCommand("feed view");
assertTest('"feed view" produces CAMERA_VIEW fit', cmdFeed.actionType === "CAMERA_VIEW" && cmdFeed.payload?.preset === "fit", JSON.stringify(cmdFeed));

// 6. Multi-Hypothesis Alternative Ranking
const candidates = ["more 20", "move 20 mm", "mode 20"];
const best = selectBestAlternative(candidates);
assertTest('selectBestAlternative selects "move 20 mm" over "more 20"', best === "move 20 mm", best);

const cmdMulti = processVoiceCommand({
  alternatives: ["more 20 mm", "move 20 mm on x axis", "mode 20 mm"]
});
assertTest('processVoiceCommand with alternatives chooses best CAM command', cmdMulti.actionType === "TRANSLATE_PART" && cmdMulti.payload?.dx === 20, JSON.stringify(cmdMulti));

// 7. Pan Commands
const cmdPanLeft = processVoiceCommand("pan left");
assertTest('"pan left" produces CAMERA_PAN left', cmdPanLeft.actionType === "CAMERA_PAN" && cmdPanLeft.payload?.direction === "left", JSON.stringify(cmdPanLeft));

const cmdPanRight = processVoiceCommand("pan right 50");
assertTest('"pan right 50" produces CAMERA_PAN right with amount 50', cmdPanRight.actionType === "CAMERA_PAN" && cmdPanRight.payload?.direction === "right" && cmdPanRight.payload?.amount === 50, JSON.stringify(cmdPanRight));

// 8. Dialect & Language support
aiVoiceEngine.setLanguage('en-IN');
assertTest('aiVoiceEngine language is en-IN', aiVoiceEngine.getLanguage() === 'en-IN', aiVoiceEngine.getLanguage());

console.log(`\nAccuracy Tests completed: ${passed}/${total} passed.`);
if (passed === total) {
  console.log("All speech accuracy tests passed successfully!");
} else {
  process.exit(1);
}
