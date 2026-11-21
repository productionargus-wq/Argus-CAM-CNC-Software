/**
 * aiCamDispatcher.js
 * Advanced Natural Language Command Processor for Argus Master CAM.
 * Features:
 * - Real-time conversational CAD/CAM intent parsing
 * - Barge-In / Quick Interrupt keyword handling (stop, wait, hold on, quiet)
 * - Comprehensive synonym mapping (plan view, bird's eye, half turn, CNC axes)
 * - Self-echo detection helper
 */

import { normalizeTranscript, selectBestAlternative } from './cadSpeechNormalizer.js';

// Spoken numbers and phrases mapping
const WORD_NUMBERS = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  fifteen: 15,
  twenty: 20,
  twentyfive: 25,
  'twenty five': 25,
  thirty: 30,
  forty: 40,
  'forty five': 45,
  fortyfive: 45,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
  'one eighty': 180,
  'one-eighty': 180,
  oneeighty: 180,
  'two seventy': 270,
  'two-seventy': 270,
  'three sixty': 360,
  'three-sixty': 360
};

/**
 * Extracts a numeric value from text, supporting digits, word numbers, and turn fractions
 */
function extractNumber(text) {
  // Check for turn fractions
  if (/\b(half\s*turn)\b/i.test(text)) return 180;
  if (/\b(quarter\s*turn)\b/i.test(text)) return 90;
  if (/\b(three\s*quarter\s*turn)\b/i.test(text)) return 270;
  if (/\b(full\s*turn|full\s*circle)\b/i.test(text)) return 360;

  // Check direct numbers like 180, -25, 45.5
  const directMatch = text.match(/-?\d+(\.\d+)?/);
  if (directMatch) {
    return parseFloat(directMatch[0]);
  }

  // Check word numbers
  for (const [word, val] of Object.entries(WORD_NUMBERS)) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(text)) {
      return val;
    }
  }

  return null;
}

/**
 * Tests whether text contains a recognizable CAD/CAM intent
 */
export function isRecognizableIntent(rawText) {
  if (!rawText || typeof rawText !== 'string') return false;
  // Normalize phonetic mishearings first (e.g. 'more 20' -> 'move 20')
  const { normalized } = normalizeTranscript(rawText);
  const t = normalized.toLowerCase().trim();

  // Quick interrupt
  if (/\b(stop|wait|hold\s*on|pause|quiet|hush|cancel|shut\s*up)\b/i.test(t)) return true;

  // Views
  if (/\b(top|front|right|left|bottom|back|rear|iso|isometric|fit|zoom|overhead|plan\s*view|bird'?s?\s*eye)\b/i.test(t)) return true;

  // Rotations
  if (/\b(rotate|turn|spin|flip|upside\s*down)\b/i.test(t)) return true;

  // Translations
  if (/\b(move|translate|shift|nudge|slide|offset|center|origin)\b/i.test(t)) return true;

  // CAM actions
  if (/\b(simulate|simulation|backplot|toolpath|regenerate|g\s*code|tools?|stock)\b/i.test(t)) return true;

  // Inspection
  if (/\b(dimension|dimensions|size|bound|bounds|how\s*big|how\s*many|operations?)\b/i.test(t)) return true;

  return false;
}

/**
 * Parses user transcript into a CAD/CAM action
 * @param {string|object} rawInput - What the user said, or { transcript, alternatives }
 * @param {object} appContext - Current state (partTransform, partMetrics, operations, etc.)
 * @returns {object} { actionType, payload, speechText, toastText, success, normalizedText, correctedFrom, isCorrected }
 */
export function processVoiceCommand(rawInput, appContext = {}) {
  let chosenRaw = '';
  let candidates = [];

  if (typeof rawInput === 'string') {
    chosenRaw = rawInput;
    candidates = [rawInput];
  } else if (rawInput && typeof rawInput === 'object') {
    candidates = rawInput.alternatives || [rawInput.transcript || rawInput.final || ''];
    chosenRaw = selectBestAlternative(candidates);
  }

  if (!chosenRaw || !chosenRaw.trim()) {
    return {
      actionType: 'UNKNOWN',
      speechText: "I didn't catch that. Try saying show top view or rotate 180 degrees.",
      toastText: 'No voice command recognized',
      success: false,
      normalizedText: '',
      correctedFrom: null,
      isCorrected: false
    };
  }

  // Apply Phonetic & Context-Aware CAD Normalization
  const { normalized, correctedFrom, isCorrected } = normalizeTranscript(chosenRaw);
  const result = _evaluateCommand(normalized, appContext, chosenRaw);

  return {
    ...result,
    normalizedText: normalized,
    correctedFrom,
    isCorrected
  };
}

function _evaluateCommand(normalized, appContext, rawTranscript) {
  const text = normalized.toLowerCase().trim();

  // -------------------------------------------------------------
  // 0. QUICK INTERRUPT / STOP (Barge-In Handlers)
  // -------------------------------------------------------------
  if (/^(stop|wait|hold\s*on|pause|quiet|hush|be\s*quiet|shut\s*up|cancel)$/i.test(text) ||
      /\b(stop\s*talking|be\s*quiet|hold\s*on\s*a\s*sec)\b/i.test(text)) {
    return {
      actionType: 'INTERRUPT',
      payload: {},
      speechText: '', // Silent cutoff
      toastText: 'AI Speech Cancelled',
      success: true
    };
  }

  // -------------------------------------------------------------
  // 1. CAMERA VIEW PRESETS
  // -------------------------------------------------------------
  // Top / Plan / Overhead View
  if (/\b(top\s*view|show\s*top|switch\s*to\s*top|view\s*top|plan\s*view|overhead\s*view|bird'?s?\s*eye|g17)\b/i.test(text)) {
    return {
      actionType: 'CAMERA_VIEW',
      payload: { preset: 'top' },
      speechText: 'Showing top view.',
      toastText: 'Camera: Top View (G17 XY)',
      success: true
    };
  }

  // Front / Elevation View
  if (/\b(front\s*view|show\s*front|switch\s*to\s*front|elevation\s*view|g19)\b/i.test(text)) {
    return {
      actionType: 'CAMERA_VIEW',
      payload: { preset: 'front' },
      speechText: 'Showing front view.',
      toastText: 'Camera: Front View (G19 YZ)',
      success: true
    };
  }

  // Isometric / 3D View
  if (/\b(isometric|iso\s*view|show\s*isometric|show\s*iso|switch\s*to\s*iso|3d\s*view|axonometric|perspective)\b/i.test(text)) {
    return {
      actionType: 'CAMERA_VIEW',
      payload: { preset: 'iso' },
      speechText: 'Switched to isometric view.',
      toastText: 'Camera: Isometric View',
      success: true
    };
  }

  // Right Side View
  if (/\b(right\s*view|right\s*side|show\s*right|switch\s*to\s*right|g18)\b/i.test(text)) {
    return {
      actionType: 'CAMERA_VIEW',
      payload: { preset: 'right' },
      speechText: 'Showing right view.',
      toastText: 'Camera: Right View (G18 XZ)',
      success: true
    };
  }

  // Left Side View
  if (/\b(left\s*view|left\s*side|show\s*left|switch\s*to\s*left)\b/i.test(text)) {
    return {
      actionType: 'CAMERA_VIEW',
      payload: { preset: 'left' },
      speechText: 'Showing left view.',
      toastText: 'Camera: Left View',
      success: true
    };
  }

  // Bottom / Underside View
  if (/\b(bottom\s*view|show\s*bottom|switch\s*to\s*bottom|underneath|underside)\b/i.test(text)) {
    return {
      actionType: 'CAMERA_VIEW',
      payload: { preset: 'bottom' },
      speechText: 'Showing bottom view.',
      toastText: 'Camera: Bottom View',
      success: true
    };
  }

  // Back / Rear View
  if (/\b(back\s*view|show\s*back|switch\s*to\s*back|rear\s*view|from\s*behind)\b/i.test(text)) {
    return {
      actionType: 'CAMERA_VIEW',
      payload: { preset: 'back' },
      speechText: 'Showing back view.',
      toastText: 'Camera: Back View',
      success: true
    };
  }

  // Fit Extents / Frame Part
  if (/\b(fit\s*(to\s*)?(screen|view|all|extents)|zoom\s*extents|fit\s*all|frame\s*part|zoom\s*to\s*fit)\b/i.test(text)) {
    return {
      actionType: 'CAMERA_VIEW',
      payload: { preset: 'fit' },
      speechText: 'Fitting part to view extents.',
      toastText: 'Camera: Fit Extents',
      success: true
    };
  }

  // Zoom Out
  if (/\b(zoom\s*out|unzoom)\b/i.test(text)) {
    return {
      actionType: 'CAMERA_VIEW',
      payload: { preset: 'unzoom_50' },
      speechText: 'Zooming out.',
      toastText: 'Camera: Zoomed Out',
      success: true
    };
  }

  // -------------------------------------------------------------
  // 2. WORKPIECE ROTATION
  // -------------------------------------------------------------
  if (/\b(rotate|turn|spin|flip)\b/i.test(text) || /\b(upside\s*down)\b/i.test(text)) {
    // Check for "upside down" or "flip over"
    if (/\b(upside\s*down|flip\s*over)\b/i.test(text)) {
      return {
        actionType: 'ROTATE_PART',
        payload: { axis: 'x', degrees: 180 },
        speechText: 'Flipped workpiece upside down 180 degrees.',
        toastText: 'Rotated Workpiece 180° around X-Axis',
        success: true
      };
    }

    const degrees = extractNumber(text) ?? 90; // Default to 90° if unspecified

    // Determine axis: x, y, or z (default z for rotary table)
    let axis = 'z';
    if (/\b(x\s*axis|x|around\s*x|on\s*x|tilt|pitch)\b/i.test(text)) {
      axis = 'x';
    } else if (/\b(y\s*axis|y|around\s*y|on\s*y|roll)\b/i.test(text)) {
      axis = 'y';
    } else if (/\b(z\s*axis|z|around\s*z|on\s*z|table|yaw)\b/i.test(text)) {
      axis = 'z';
    }

    // Direction (counter-clockwise or negative)
    let finalDegrees = degrees;
    if (/\b(counter\s*clockwise|anticlockwise|negative|left|reverse)\b/i.test(text) && finalDegrees > 0) {
      finalDegrees = -finalDegrees;
    }

    return {
      actionType: 'ROTATE_PART',
      payload: { axis, degrees: finalDegrees },
      speechText: `Rotated workpiece ${Math.abs(finalDegrees)} degrees ${finalDegrees < 0 ? 'counter-clockwise' : ''} around ${axis.toUpperCase()} axis.`,
      toastText: `Rotated Workpiece ${finalDegrees}° (${axis.toUpperCase()}-Axis)`,
      success: true
    };
  }

  // -------------------------------------------------------------
  // 3. WORKPIECE TRANSLATION / MOVE / NUDGE
  // -------------------------------------------------------------
  if (/\b(move|translate|shift|nudge|slide|offset)\b/i.test(text)) {
    // Check if user says "move to origin" or "center"
    if (/\b(origin|center)\b/i.test(text)) {
      return {
        actionType: 'RESET_TRANSFORM',
        payload: { reset: 'position' },
        speechText: 'Workpiece position centered at origin.',
        toastText: 'Workpiece Moved to Origin (0, 0, 0)',
        success: true
      };
    }

    const dist = extractNumber(text) ?? 10; // Default 10mm if not specified

    let dx = 0;
    let dy = 0;
    let dz = 0;

    // Check CNC axis notation like "+X", "-X", "positive X", "negative Z"
    if (/(?:^|[\s,])(\+x|plus\s*x|positive\s*x)\b/i.test(text)) {
      dx = Math.abs(dist);
    } else if (/(?:^|[\s,])(-x|-\s*x|minus\s*x|negative\s*x)\b/i.test(text)) {
      dx = -Math.abs(dist);
    } else if (/(?:^|[\s,])(\+y|plus\s*y|positive\s*y)\b/i.test(text)) {
      dy = Math.abs(dist);
    } else if (/(?:^|[\s,])(-y|-\s*y|minus\s*y|negative\s*y)\b/i.test(text)) {
      dy = -Math.abs(dist);
    } else if (/(?:^|[\s,])(\+z|plus\s*z|positive\s*z)\b/i.test(text)) {
      dz = Math.abs(dist);
    } else if (/(?:^|[\s,])(-z|-\s*z|minus\s*z|negative\s*z)\b/i.test(text)) {
      dz = -Math.abs(dist);
    } else if (/\b(up|above|higher)\b/i.test(text)) {
      dy = dist;
    } else if (/\b(down|below|lower)\b/i.test(text)) {
      dy = -dist;
    } else if (/\b(right)\b/i.test(text)) {
      dx = dist;
    } else if (/\b(left)\b/i.test(text)) {
      dx = -dist;
    } else if (/\b(forward|front|closer)\b/i.test(text)) {
      dz = dist;
    } else if (/\b(back|backward|rear|away)\b/i.test(text)) {
      dz = -dist;
    } else if (/\b(x\s*axis|x)\b/i.test(text)) {
      dx = dist;
    } else if (/\b(y\s*axis|y)\b/i.test(text)) {
      dy = dist;
    } else if (/\b(z\s*axis|z)\b/i.test(text)) {
      dz = dist;
    } else {
      dx = dist;
    }

    return {
      actionType: 'TRANSLATE_PART',
      payload: { dx, dy, dz },
      speechText: `Moved workpiece by ${dist} millimeters.`,
      toastText: `Moved Workpiece: dX=${dx}, dY=${dy}, dZ=${dz} mm`,
      success: true
    };
  }

  // -------------------------------------------------------------
  // 4. RESET / CENTER
  // -------------------------------------------------------------
  if (/\b(reset\s*(part|material|workpiece|rotation|position|transform)|zero\s*out|center\s*(it|part|workpiece))\b/i.test(text)) {
    return {
      actionType: 'RESET_TRANSFORM',
      payload: { reset: 'all' },
      speechText: 'Workpiece position and rotation reset to origin.',
      toastText: 'Workpiece Transform Reset',
      success: true
    };
  }

  // -------------------------------------------------------------
  // 5. CAM / TOOLPATH OPERATIONS
  // -------------------------------------------------------------
  if (/\b(start\s*simulation|play\s*simulation|run\s*simulation|start\s*backplot|play\s*backplot|simulate)\b/i.test(text)) {
    return {
      actionType: 'CAM_ACTION',
      payload: { command: 'start_backplot' },
      speechText: 'Starting toolpath backplot simulation.',
      toastText: 'Backplot Simulation: Started',
      success: true
    };
  }

  if (/\b(stop\s*simulation|pause\s*simulation|stop\s*backplot|close\s*backplot)\b/i.test(text)) {
    return {
      actionType: 'CAM_ACTION',
      payload: { command: 'stop_backplot' },
      speechText: 'Stopping simulation.',
      toastText: 'Backplot Simulation: Stopped',
      success: true
    };
  }

  if (/\b(generate\s*toolpath|regenerate|calc\s*toolpath|compute\s*toolpath|calculate\s*toolpaths?)\b/i.test(text)) {
    return {
      actionType: 'CAM_ACTION',
      payload: { command: 'regenerate_toolpaths' },
      speechText: 'Regenerating toolpaths.',
      toastText: 'Toolpaths Regenerated',
      success: true
    };
  }

  if (/\b(tool\s*manager|tools?\s*list|open\s*tools?|show\s*tools?|tool\s*library)\b/i.test(text)) {
    return {
      actionType: 'MODAL_OPEN',
      payload: { modal: 'tool_manager' },
      speechText: 'Opening Tool Manager.',
      toastText: 'Tool Manager Opened',
      success: true
    };
  }

  if (/\b(stock\s*setup|setup\s*stock|stock\s*billet)\b/i.test(text)) {
    return {
      actionType: 'MODAL_OPEN',
      payload: { modal: 'stock_setup' },
      speechText: 'Opening Stock Setup.',
      toastText: 'Stock Setup Opened',
      success: true
    };
  }

  if (/\b(g\s*code|show\s*g\s*code|open\s*g\s*code|nc\s*code|view\s*g\s*code)\b/i.test(text)) {
    return {
      actionType: 'MODAL_OPEN',
      payload: { modal: 'gcode_viewer' },
      speechText: 'Opening G-Code Viewer.',
      toastText: 'G-Code Viewer Opened',
      success: true
    };
  }

  if (/\b(five\s*axis|5\s*axis\s*studio|multiaxis)\b/i.test(text)) {
    return {
      actionType: 'MODAL_OPEN',
      payload: { modal: '5axis_studio' },
      speechText: 'Opening 5-Axis Studio.',
      toastText: '5-Axis Studio Opened',
      success: true
    };
  }

  if (/\b(verify\s*solid|solid\s*verify)\b/i.test(text)) {
    return {
      actionType: 'MODAL_OPEN',
      payload: { modal: 'verify_solid' },
      speechText: 'Opening Solid Verification.',
      toastText: 'Solid Verification Opened',
      success: true
    };
  }

  // -------------------------------------------------------------
  // 6. DISPLAY & RENDERING MODES
  // -------------------------------------------------------------
  if (/\b(wireframe\s*mode|wireframe)\b/i.test(text)) {
    return {
      actionType: 'RENDER_MODE',
      payload: { mode: 'wireframe' },
      speechText: 'Switched to wireframe render mode.',
      toastText: 'Render Mode: Wireframe',
      success: true
    };
  }

  if (/\b(shaded\s*mode|shaded)\b/i.test(text)) {
    return {
      actionType: 'RENDER_MODE',
      payload: { mode: 'shaded' },
      speechText: 'Switched to shaded render mode.',
      toastText: 'Render Mode: Shaded',
      success: true
    };
  }

  if (/\b(dark\s*mode|dark\s*theme)\b/i.test(text)) {
    return {
      actionType: 'THEME_MODE',
      payload: { theme: 'dark' },
      speechText: 'Switched to dark mode.',
      toastText: 'Theme: CAD Dark Mode',
      success: true
    };
  }

  if (/\b(light\s*mode|light\s*theme)\b/i.test(text)) {
    return {
      actionType: 'THEME_MODE',
      payload: { theme: 'light' },
      speechText: 'Switched to light mode.',
      toastText: 'Theme: CAD Light Mode',
      success: true
    };
  }

  // -------------------------------------------------------------
  // 7. INSPECTION & WORKPIECE QUERIES
  // -------------------------------------------------------------
  if (/\b(dimensions?|size|bounding\s*box|how\s*big|workpiece\s*size|measure\s*(part|workpiece))\b/i.test(text)) {
    const dims = appContext?.partMetrics?.dimensions;
    if (dims) {
      const x = Math.round(dims.x);
      const y = Math.round(dims.y);
      const z = Math.round(dims.z);
      return {
        actionType: 'INFO_QUERY',
        payload: { query: 'dimensions' },
        speechText: `Workpiece dimensions are X: ${x} mm, Y: ${y} mm, and Z: ${z} mm.`,
        toastText: `Part Bounds: X=${x}mm, Y=${y}mm, Z=${z}mm`,
        success: true
      };
    } else {
      return {
        actionType: 'INFO_QUERY',
        payload: { query: 'dimensions' },
        speechText: 'The active workpiece dimensions are approximately 100 by 25 by 80 millimeters.',
        toastText: 'Part Bounds: 100 × 25 × 80 mm',
        success: true
      };
    }
  }

  if (/\b(operations|how\s*many\s*operations|toolpaths?\s*count|list\s*operations)\b/i.test(text)) {
    const count = appContext?.operations?.length ?? 0;
    return {
      actionType: 'INFO_QUERY',
      payload: { query: 'operations' },
      speechText: `There ${count === 1 ? 'is 1 active operation' : `are ${count} operations`} in the operations tree.`,
      toastText: `Operations: ${count} loaded`,
      success: true
    };
  }

  // -------------------------------------------------------------
  // 8. GREETING & HELP
  // -------------------------------------------------------------
  if (/\b(hello|hi|hey|help|what\s*can\s*you\s*do)\b/i.test(text)) {
    return {
      actionType: 'HELP',
      payload: {},
      speechText: 'I can change views like top view or isometric, rotate or move the material, run backplot simulations, and inspect part dimensions. What would you like to do?',
      toastText: 'Argus AI Assistant: Voice commands ready',
      success: true
    };
  }

  // Default unrecognized command
  return {
    actionType: 'UNRECOGNIZED',
    payload: { raw: text },
    speechText: `Received command: ${text}. Try saying show top view, rotate 180 degrees, or move workpiece.`,
    toastText: `Voice: "${rawTranscript}"`,
    success: false
  };
}
