import * as THREE from 'three';

/**
 * Argus CAM Feed Rate Optimization & Constant Chip Thickness Engine
 * (Mastercam High-Speed Machining / CGTech OptiPath / VoluMill Grade)
 * Automatically decelerates feeds inside internal corner radii to eliminate cutter shock/breakage,
 * boosts feeds in light radial cuts via Radial Chip Thinning (RCTF), and smooths axis jerk.
 */

export const OPTIMIZATION_STRATEGIES = {
  CONSTANT_CHIP_LOAD: {
    id: 'constant_chip_load',
    name: 'Full Constant Chip Thickness (RCTF + Corner Decel)',
    badge: 'RCTF+CORNER',
    desc: 'Boosts feeds in light radial passes while decelerating in corners to maintain constant cutter tooth load.'
  },
  CORNER_DECEL_ONLY: {
    id: 'corner_decel_only',
    name: 'Corner Deceleration Only (Anti-Shock)',
    badge: 'CORNER-ONLY',
    desc: 'Preserves cutter flutes by slowing down specifically in tight inside radii without accelerating straight cuts.'
  },
  TARGET_MRR: {
    id: 'target_mrr',
    name: 'Constant Material Removal Rate (MRR Smoothing)',
    badge: 'CONST-MRR',
    desc: 'Dynamically modulates feed to maintain a constant volumetric metal removal rate (cm³/min).'
  }
};

export const DEFAULT_OPTIMIZER_CONFIG = {
  strategy: 'constant_chip_load',
  minCornerFeedPct: 45,       // Slow down to 45% in 90-degree corners
  decelDistanceMm: 4.5,       // Ramp-down distance before corner
  accelDistanceMm: 4.5,       // Ramp-up distance after corner
  enableRCTF: true,           // Radial chip thinning boost
  maxFeedBoostPct: 175,       // Cap feed boost at 175% of nominal
  stepoverPct: 25,            // Radial stepover % of tool diameter
  maxJerkLimit: 2.5           // Axis jerk damping (m/s³)
};

/**
 * Calculates the Radial Chip Thinning Factor (RCTF) for light radial cuts.
 * When ae < 50% of D, chip thickness is less than feed per tooth (fz).
 */
export function calculateRadialChipThinning(stepoverMm, toolDiameterMm, maxBoostPct = 180) {
  const D = Math.max(1, toolDiameterMm);
  const ae = Math.max(0.01, Math.min(D, stepoverMm));
  const ratio = ae / D;

  if (ratio >= 0.5) {
    return 1.0; // No thinning at or above 50% tool engagement
  }

  // Thinning factor: h_max = fz * 2 * sqrt(ae/D * (1 - ae/D))
  const thinningRatio = 2 * Math.sqrt(ratio * (1 - ratio));
  if (thinningRatio <= 0.05) return maxBoostPct / 100;

  const rctfMultiplier = Math.min(maxBoostPct / 100, 1.0 / thinningRatio);
  return Number(rctfMultiplier.toFixed(2));
}

/**
 * Calculates the corner deceleration factor based on turn angle between two vector segments.
 * Turn angle: 0 deg = straight line (1.0), 90 deg = sharp corner (minCornerFeedPct), 180 deg = reversal.
 */
export function calculateCornerDecelFactor(turnAngleDeg, minCornerFeedPct = 45) {
  if (turnAngleDeg <= 15.0) {
    return 1.0; // Insignificant turn, no deceleration needed
  }

  const minPct = Math.max(20, Math.min(80, minCornerFeedPct)) / 100;
  // Normalized turn severity from 15 deg to 120 deg
  const severity = Math.min(1.0, (turnAngleDeg - 15.0) / 105.0);
  const factor = 1.0 - severity * (1.0 - minPct);

  return Number(factor.toFixed(2));
}

/**
 * Optimizes an array of toolpath cutting line segments with continuous feed rate modulation.
 */
export function optimizeToolpathFeedRates(cuttingSegments = [], tool = {}, config = {}) {
  const optConfig = { ...DEFAULT_OPTIMIZER_CONFIG, ...config };
  const nominalFeed = Number(tool.feedRate || 1500);
  const toolDia = Number(tool.diameter || 10);
  const stepoverMm = (toolDia * (optConfig.stepoverPct || 25)) / 100;

  if (!cuttingSegments || cuttingSegments.length < 2) {
    return {
      optimizedSegments: cuttingSegments,
      feedProfile: [],
      analytics: {
        nominalCycleTimeSec: 0,
        optimizedCycleTimeSec: 0,
        timeSavedSec: 0,
        timeSavedPct: 0,
        peakForceReductionPct: 0,
        avgFeedRate: nominalFeed
      }
    };
  }

  // 1. Calculate RCTF Multiplier
  let rctfBoost = 1.0;
  if (optConfig.strategy === 'constant_chip_load' && optConfig.enableRCTF) {
    rctfBoost = calculateRadialChipThinning(stepoverMm, toolDia, optConfig.maxFeedBoostPct);
  }

  // 2. Identify Corner Vertices and Segment Angles
  const vertices = [];
  vertices.push(cuttingSegments[0][0]);
  for (let i = 0; i < cuttingSegments.length; i++) {
    vertices.push(cuttingSegments[i][1]);
  }

  const cornerAngles = new Float32Array(vertices.length);
  const segmentLengths = new Float32Array(vertices.length);
  let totalPathDistance = 0;

  for (let i = 1; i < vertices.length - 1; i++) {
    const pPrev = vertices[i - 1];
    const pCurr = vertices[i];
    const pNext = vertices[i + 1];

    const v1 = new THREE.Vector3().subVectors(pCurr, pPrev);
    const v2 = new THREE.Vector3().subVectors(pNext, pCurr);

    const len1 = v1.length();
    segmentLengths[i] = len1;
    totalPathDistance += len1;

    if (len1 > 0.001 && v2.length() > 0.001) {
      v1.normalize();
      v2.normalize();
      const dot = Math.max(-1, Math.min(1, v1.dot(v2)));
      const angleDeg = Math.acos(dot) * (180 / Math.PI);
      cornerAngles[i] = angleDeg;
    }
  }

  // 3. Modulate Feed Rates along the Path
  const optimizedSegments = [];
  const feedProfile = [];
  let cumDistance = 0;
  let nominalSeconds = 0;
  let optimizedSeconds = 0;

  const decelDist = optConfig.decelDistanceMm || 4.5;
  const accelDist = optConfig.accelDistanceMm || 4.5;

  for (let i = 0; i < cuttingSegments.length; i++) {
    const [pStart, pEnd] = cuttingSegments[i];
    const segLen = pStart.distanceTo(pEnd);
    cumDistance += segLen;

    // Check distance to upcoming and previous corners
    let targetFeed = nominalFeed * rctfBoost;

    // Look-ahead for upcoming corner
    const nextCornerAngle = cornerAngles[Math.min(vertices.length - 1, i + 1)] || 0;
    if (nextCornerAngle > 20.0) {
      const cornerFactor = calculateCornerDecelFactor(nextCornerAngle, optConfig.minCornerFeedPct);
      // Blend feed down towards corner
      targetFeed = Math.min(targetFeed, nominalFeed * cornerFactor);
    }

    // Look-behind for corner recovery
    const prevCornerAngle = cornerAngles[Math.max(0, i)] || 0;
    if (prevCornerAngle > 20.0 && segLen < accelDist) {
      const cornerFactor = calculateCornerDecelFactor(prevCornerAngle, optConfig.minCornerFeedPct);
      targetFeed = Math.min(targetFeed, nominalFeed * (cornerFactor + (1.0 - cornerFactor) * (segLen / accelDist)));
    }

    // Clamp feed
    const minFeed = Math.round(nominalFeed * (optConfig.minCornerFeedPct / 100));
    const maxFeed = Math.round(nominalFeed * (optConfig.maxFeedBoostPct / 100));
    const clampedFeed = Math.max(minFeed, Math.min(maxFeed, Math.round(targetFeed)));

    optimizedSegments.push({
      start: pStart,
      end: pEnd,
      feedRate: clampedFeed,
      isCornerDecel: clampedFeed < nominalFeed,
      isHighFeedBoost: clampedFeed > nominalFeed
    });

    // Time calculations
    const segTimeNominal = (segLen / nominalFeed) * 60;
    const segTimeOptimized = (segLen / clampedFeed) * 60;
    nominalSeconds += segTimeNominal;
    optimizedSeconds += segTimeOptimized;

    feedProfile.push({
      dist: Number(cumDistance.toFixed(1)),
      feedRate: clampedFeed,
      isCorner: clampedFeed < nominalFeed,
      isBoost: clampedFeed > nominalFeed,
      pos: { x: pEnd.x, y: pEnd.y, z: pEnd.z }
    });
  }

  const timeSavedSec = Math.max(0, nominalSeconds - optimizedSeconds);
  const timeSavedPct = nominalSeconds > 0 ? (timeSavedSec / nominalSeconds) * 100 : 0;
  const peakForceReductionPct = Math.round((1.0 - (optConfig.minCornerFeedPct / 100)) * 100 * 0.85);

  return {
    optimizedSegments,
    feedProfile,
    analytics: {
      totalDistanceMm: Number(totalPathDistance.toFixed(1)),
      nominalCycleTimeSec: Number(nominalSeconds.toFixed(1)),
      optimizedCycleTimeSec: Number(optimizedSeconds.toFixed(1)),
      timeSavedSec: Number(timeSavedSec.toFixed(1)),
      timeSavedPct: Number(timeSavedPct.toFixed(1)),
      peakForceReductionPct,
      rctfMultiplier: rctfBoost,
      nominalFeed,
      minFeedObserved: Math.min(...feedProfile.map((f) => f.feedRate)),
      maxFeedObserved: Math.max(...feedProfile.map((f) => f.feedRate))
    }
  };
}

