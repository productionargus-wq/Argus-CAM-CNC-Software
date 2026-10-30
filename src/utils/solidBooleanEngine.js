/**
 * Mastercam Solid Boolean & Feature Engine (Step 1)
 * Powered by open-source BVH Constructive Solid Geometry (three-bvh-csg)
 * Enables real Union, Subtract/Cut, and Intersect operations on 3D CAD models.
 */

import * as THREE from 'three';
import { Evaluator, Brush, SUBTRACTION, ADDITION, INTERSECTION } from 'three-bvh-csg';

export const BOOLEAN_OPERATIONS = {
  SUBTRACT: 'SUBTRACT', // Cut / Cavity / Pocket
  UNION: 'UNION',       // Join solids into monolithic body
  INTERSECT: 'INTERSECT' // Common core overlap
};

/**
 * Perform a real solid 3D Boolean operation between two meshes
 * @param {THREE.Mesh} targetMesh The base solid workpiece
 * @param {THREE.Mesh} toolMesh The cutting / joining body (pocket, hole, boss)
 * @param {string} operation SUBTRACT | UNION | INTERSECT
 * @returns {THREE.Mesh} Resulting solid body mesh
 */
export function performSolidBoolean(targetMesh, toolMesh, operation = BOOLEAN_OPERATIONS.SUBTRACT) {
  if (!targetMesh || !toolMesh) {
    throw new Error('Target mesh and tool mesh are required for Solid Boolean operations');
  }

  // Ensure world matrices are fully computed
  targetMesh.updateMatrixWorld(true);
  toolMesh.updateMatrixWorld(true);

  // Initialize CSG Brushes from input geometries
  const baseBrush = new Brush(targetMesh.geometry, targetMesh.material);
  baseBrush.position.copy(targetMesh.position);
  baseBrush.rotation.copy(targetMesh.rotation);
  baseBrush.scale.copy(targetMesh.scale);
  baseBrush.updateMatrixWorld(true);

  const cuttingBrush = new Brush(toolMesh.geometry, toolMesh.material);
  cuttingBrush.position.copy(toolMesh.position);
  cuttingBrush.rotation.copy(toolMesh.rotation);
  cuttingBrush.scale.copy(toolMesh.scale);
  cuttingBrush.updateMatrixWorld(true);

  const evaluator = new Evaluator();
  evaluator.useGroups = true;

  let resultBrush;
  if (operation === BOOLEAN_OPERATIONS.SUBTRACT) {
    resultBrush = evaluator.evaluate(baseBrush, cuttingBrush, SUBTRACTION);
  } else if (operation === BOOLEAN_OPERATIONS.UNION) {
    resultBrush = evaluator.evaluate(baseBrush, cuttingBrush, ADDITION);
  } else if (operation === BOOLEAN_OPERATIONS.INTERSECT) {
    resultBrush = evaluator.evaluate(baseBrush, cuttingBrush, INTERSECTION);
  } else {
    throw new Error(`Unsupported boolean operation: ${operation}`);
  }

  // Build high-performance resulting solid mesh
  resultBrush.geometry.computeVertexNormals();
  const material = (targetMesh.material && targetMesh.material.clone) 
    ? targetMesh.material.clone() 
    : new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        metalness: 0.8,
        roughness: 0.25,
        side: THREE.DoubleSide
      });

  const resultMesh = new THREE.Mesh(resultBrush.geometry, material);
  resultMesh.castShadow = true;
  resultMesh.receiveShadow = true;
  resultMesh.name = `Solid_${operation.toLowerCase()}_result`;

  return resultMesh;
}

/**
 * Creates a standard parametric cutting tool solid for boolean subtraction (Pocket / Hole / Slot)
 * @param {string} type 'pocket' | 'cylinder' | 'slot'
 * @param {Object} params Dimensions (width, length, depth, radius)
 * @returns {THREE.Mesh}
 */
export function createParametricCutterSolid(type = 'pocket', params = {}) {
  let geom;
  const {
    width = 40,
    length = 60,
    depth = 15,
    radius = 12
  } = params;

  if (type === 'cylinder' || type === 'hole') {
    geom = new THREE.CylinderGeometry(radius, radius, depth, 36);
  } else if (type === 'pocket') {
    geom = new THREE.BoxGeometry(width, depth, length);
  } else {
    geom = new THREE.BoxGeometry(width, depth, length);
  }

  const mat = new THREE.MeshStandardMaterial({
    color: 0xf43f5e,
    wireframe: false,
    transparent: true,
    opacity: 0.6
  });

  const mesh = new THREE.Mesh(geom, mat);
  mesh.name = `Cutter_${type}`;
  return mesh;
}

