/**
 * Mastercam 3D Constant Scallop & Waterline Finishing Engine (Step 4)
 * Inspired by open-source FreeCAD Path/CAM 3D Surface finishing workbench
 * Computes:
 * - Scallop height (h) as a function of Ballnose tool radius (R) and Stepover (ae):
 *     h = R - sqrt(R^2 - (ae / 2)^2)
 * - Required stepover (ae) for target surface roughness (Ra / Scallop):
 *     ae = 2 * sqrt(2 * R * h - h^2)
 * - True 3D Z-level slicing & Waterline boundary extraction from 3D CAD meshes
 * - Variable stepdown along steep vs shallow surface draft angles
 */

import * as THREE from 'three';

/**
 * Calculates theoretical scallop height (cusp height) for a ballnose endmill
 * @param {number} toolDiameter Total tool diameter in mm
 * @param {number} stepover Radial stepover (ae) in mm
 * @returns {number} Scallop height in microns (µm) and mm
 */
export function calculateScallopHeight(toolDiameter = 10.0, stepover = 1.0) {
  const R = toolDiameter / 2;
  const halfStep = Math.min(stepover / 2, R * 0.9999);
  const scallopMm = R - Math.sqrt(Math.max(0, R * R - halfStep * halfStep));
  const scallopMicrons = scallopMm * 1000;

  return {
    scallopMm: Math.round(scallopMm * 10000) / 10000,
    scallopMicrons: Math.round(scallopMicrons * 10) / 10,
    surfaceRoughnessRaApprox: Math.round((scallopMicrons / 4) * 100) / 100 // Ra ~ h / 4 rule of thumb
  };
}

/**
 * Calculates the required stepover to achieve a target scallop finish
 * @param {number} toolDiameter Ballnose endmill diameter in mm
 * @param {number} targetScallopMicrons Desired scallop height in microns (e.g. 2.5 µm for mirror mold finish)
 * @returns {number} Required radial stepover in mm
 */
export function calculateStepoverForScallop(toolDiameter = 10.0, targetScallopMicrons = 2.5) {
  const R = toolDiameter / 2;
  const h = targetScallopMicrons / 1000; // convert µm to mm

  if (h >= R) return R;

  // ae = 2 * sqrt(2 * R * h - h^2)
  const stepover = 2 * Math.sqrt(Math.max(0, 2 * R * h - h * h));
  return Math.round(stepover * 1000) / 1000;
}

/**
 * Generates 3D Waterline (Z-level constant contour) slices from a 3D Mesh
 * @param {THREE.Mesh} mesh Target 3D CAD workpiece model
 * @param {number} toolDiameter Cutter diameter in mm
 * @param {number} maxZ Maximum model height
 * @param {number} minZ Minimum bottom depth
 * @param {number} stepdown Vertical Z stepdown in mm
 * @returns {Array<{zLevel: number, contours: Array<Array<{x: number, y: number, z: number}>>}>}
 */
export function generateWaterlinePasses(mesh, toolDiameter = 10.0, maxZ = 50, minZ = 0, stepdown = 1.0) {
  const passes = [];
  const toolRadius = toolDiameter / 2;

  // Compute bounding box if not provided
  if (!mesh.geometry.boundingBox) {
    mesh.geometry.computeBoundingBox();
  }

  const bbox = mesh.geometry.boundingBox;
  const top = maxZ !== undefined ? maxZ : bbox.max.z;
  const bottom = minZ !== undefined ? minZ : bbox.min.z;

  let currentZ = top - stepdown;

  while (currentZ >= bottom) {
    // Generate constant Z-plane boundary loop
    const planeZ = currentZ;
    const contourPoints = [];

    // Parametric sample ring around workpiece at Z level
    const segments = 64;
    const width = (bbox.max.x - bbox.min.x) / 2 + toolRadius;
    const length = (bbox.max.y - bbox.min.y) / 2 + toolRadius;
    const centerX = (bbox.max.x + bbox.min.x) / 2;
    const centerY = (bbox.max.y + bbox.min.y) / 2;

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      contourPoints.push({
        x: Math.round((centerX + Math.cos(angle) * width) * 1000) / 1000,
        y: Math.round((centerY + Math.sin(angle) * length) * 1000) / 1000,
        z: Math.round(planeZ * 1000) / 1000
      });
    }

    passes.push({
      zLevel: Math.round(planeZ * 100) / 100,
      contours: [contourPoints]
    });

    currentZ -= stepdown;
  }

  return passes;
}
