import fs from 'fs';
import * as THREE from 'three';
import { generateNCProgram, CONTROLLER_DIALECTS } from '../src/utils/postProcessor.js';

console.log('Generating CNC G-Code programs for real-world CNC machining...');

// 1. Circle Ø50mm
const circleBounds = new THREE.Box3(
  new THREE.Vector3(-25, 0, -25),
  new THREE.Vector3(25, 5, 25)
);

const circleChain = {
  id: 'circle-1',
  type: 'circle_loop',
  name: 'Circle Ø50mm Contour',
  center: new THREE.Vector3(0, 5, 0),
  radius: 25.0,
  isClosed: true,
  bounds: circleBounds
};

const circleOp = {
  id: 1,
  name: '2D Circle Contour Profile (Ø50mm)',
  toolId: 1,
  toolName: '10mm Flat Endmill',
  badgeClass: 'contour',
  badgeText: 'CT',
  visible: true,
  chain: circleChain,
  bounds: circleBounds,
  diameter: 50.0,
  stepdown: 1.0,
  totalDepth: 5.0,
  rapidHeight: 15.0
};

const tool1 = {
  id: 1,
  number: 1,
  name: '10mm Flat Endmill',
  diameter: 10.0,
  rpm: 6000,
  feedRate: 1200
};

const circleResult = generateNCProgram({
  operations: [circleOp],
  tools: [tool1],
  stockConfig: {
    material: '6061-T6 Aluminum',
    shape: 'box',
    allowanceTop: 0.0
  },
  partMetrics: {
    box: circleBounds,
    bounds: circleBounds,
    dimensions: new THREE.Vector3(50, 5, 50)
  },
  controller: CONTROLLER_DIALECTS.FANUC,
  programName: 'CIRCLE_DIA50MM'
});

fs.writeFileSync('Circle_Dia50mm_Contour.nc', circleResult.gcodeText, 'utf8');
console.log(`Generated Circle_Dia50mm_Contour.nc (${circleResult.lineCount} lines)`);

// 2. Rectangle 80x50mm
const rectBounds = new THREE.Box3(
  new THREE.Vector3(-40, 0, -25),
  new THREE.Vector3(40, 5, 25)
);

const rectChain = {
  id: 'rect-1',
  type: 'rectangle_loop',
  name: 'Rectangle 80x50mm Contour',
  center: new THREE.Vector3(0, 5, 0),
  isClosed: true,
  bounds: rectBounds
};

const rectOp = {
  id: 1,
  name: '2D Rectangle Contour Profile (80x50mm)',
  toolId: 1,
  toolName: '10mm Flat Endmill',
  badgeClass: 'contour',
  badgeText: 'CT',
  visible: true,
  chain: rectChain,
  bounds: rectBounds,
  stepdown: 1.0,
  totalDepth: 5.0,
  rapidHeight: 15.0
};

const rectResult = generateNCProgram({
  operations: [rectOp],
  tools: [tool1],
  stockConfig: {
    material: '6061-T6 Aluminum',
    shape: 'box',
    allowanceTop: 0.0
  },
  partMetrics: {
    box: rectBounds,
    bounds: rectBounds,
    dimensions: new THREE.Vector3(80, 5, 50)
  },
  controller: CONTROLLER_DIALECTS.FANUC,
  programName: 'RECTANGLE_80X50MM'
});

fs.writeFileSync('Rectangle_80x50mm_Contour.nc', rectResult.gcodeText, 'utf8');
console.log(`Generated Rectangle_80x50mm_Contour.nc (${rectResult.lineCount} lines)`);
