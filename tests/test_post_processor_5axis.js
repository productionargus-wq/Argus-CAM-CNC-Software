import { generateNCProgram, CONTROLLER_DIALECTS } from '../src/utils/postProcessor.js';
import { generateMultiaxisMorphToolpath } from '../src/utils/multiaxisMorphEngine.js';

const bounds = { min: { x: -40, y: -20, z: -40 }, max: { x: 40, y: 0, z: 40 } };
const tool = { id: 5, number: 5, name: '6mm Ball Nose', diameter: 6, fluteLength: 20, overallLength: 60 };
const op = {
  id: 1,
  name: '5-Axis Morph Between 2 Curves',
  badgeClass: 'multi_morph',
  strategyKey: 'multiaxis_morph',
  toolId: 5,
  toolNumber: 5,
  spindleSpeed: 12000,
  feedRate: 3000,
  passes: 10,
  stepoverMm: 1.0,
  rapidHeight: 25,
  retractHeight: 10
};

// Generate Fanuc Program
const fanucRes = generateNCProgram({ operations: [op], tools: [tool], controller: CONTROLLER_DIALECTS.FANUC, programNumber: '0001' });
const fanucGcode = fanucRes.gcodeText;

console.log('--- FANUC 5-AXIS POST TEST ---');
if (!fanucGcode.includes('G43.4 H5')) {
  throw new Error('Fanuc output missing G43.4 TCPM activation');
}
if (!fanucGcode.includes('A') || !fanucGcode.includes('C')) {
  throw new Error('Fanuc output missing rotary axis A / C words');
}
if (!fanucGcode.includes('G49')) {
  throw new Error('Fanuc output missing G49 TCPM cancellation');
}
console.log('✓ Fanuc G43.4 and A/C rotary angles verified!');
console.log(fanucGcode.split('\n').slice(0, 32).join('\n'));

// Generate Haas Program
const haasRes = generateNCProgram({ operations: [op], tools: [tool], controller: CONTROLLER_DIALECTS.HAAS, programNumber: '0001' });
const haasGcode = haasRes.gcodeText;

console.log('\n--- HAAS 5-AXIS POST TEST ---');
if (!haasGcode.includes('G234 H5')) {
  throw new Error('Haas output missing G234 TCPC activation');
}
if (!fanucGcode.includes('G49')) {
  throw new Error('Haas output missing G49 cancellation');
}
console.log('✓ Haas G234 verified!');

console.log('\nALL 5-AXIS POST-PROCESSOR TESTS PASSED!');
