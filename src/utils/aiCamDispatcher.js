/**
 * aiCamDispatcher.js
 * Natural Language Command Processor for Argus Master CAM.
 * Parses user voice transcripts or text input and executes corresponding
 * CAD/CAM operations, returning spoken feedback and execution status.
 */

// Number word to digit converter
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
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
  'one eighty': 180,
  'three sixty': 360
};

/**
 * Extracts a numeric value from text, supporting digits and common words
 */
function extractNumber(text) {
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
 * Parses user transcript into a CAD/CAM action
 * @param {string} rawTranscript - What the user said
 * @param {object} appContext - Current state (partTransform, partMetrics, operations, etc.)
 * @returns {object} { actionType, payload, speechText, toastText, success }
 */
export function processVoiceCommand(rawTranscript, appContext = {}) {
  if (!rawTranscript || typeof rawTranscript !== 'string') {
    return {
      actionType: 'UNKNOWN',
      speechText: "I didn't catch that. Try saying show top view or rotate 180 degrees.",
      toastText: 'No voice command recognized',
      success: false
    };
  }

  const text = rawTranscript.toLowerCase().trim();

  // -------------------------------------------------------------
  // 1. CAMERA VIEW PRESETS
  // -------------------------------------------------------------
  if (/\b(top\s*view|show\s*top|switch\s*to\s*top|view\s*top)\b/i.test(text)) {
    return {
      actionType: 'CAMERA_VIEW',
      payload: { preset: 'top' },
      speechText: 'Showing top view.',
      toastText: 'Camera: Top View (G17 XY)',
      success: true
    };
  }

  if (/\b(front\s*view|show\s*front|switch\s*to\s*front)\b/i.test(text)) {
    return {
      actionType: 'CAMERA_VIEW',
      payload: { preset: 'front' },
      speechText: 'Showing front view.',
      toastText: 'Camera: Front View (G19 YZ)',
      success: true
    };
  }

  if (/\b(isometric|iso\s*view|show\s*isometric|show\s*iso|switch\s*to\s*iso)\b/i.test(text)) {
    return {
      actionType: 'CAMERA_VIEW',
      payload: { preset: 'iso' },
      speechText: 'Switched to isometric view.',
      toastText: 'Camera: Isometric View',
      success: true
    };
  }

  if (/\b(right\s*view|show\s*right|switch\s*to\s*right)\b/i.test(text)) {
    return {
      actionType: 'CAMERA_VIEW',
      payload: { preset: 'right' },
      speechText: 'Showing right view.',
      toastText: 'Camera: Right View (G18 XZ)',
      success: true
    };
  }

  if (/\b(left\s*view|show\s*left|switch\s*to\s*left)\b/i.test(text)) {
    return {
      actionType: 'CAMERA_VIEW',
      payload: { preset: 'left' },
      speechText: 'Showing left view.',
      toastText: 'Camera: Left View',
      success: true
    };
  }

  if (/\b(bottom\s*view|show\s*bottom|switch\s*to\s*bottom)\b/i.test(text)) {
    return {
      actionType: 'CAMERA_VIEW',
      payload: { preset: 'bottom' },
      speechText: 'Showing bottom view.',
      toastText: 'Camera: Bottom View',
      success: true
    };
  }

  if (/\b(back\s*view|show\s*back|switch\s*to\s*back|rear\s*view)\b/i.test(text)) {
    return {
      actionType: 'CAMERA_VIEW',
      payload: { preset: 'back' },
      speechText: 'Showing back view.',
      toastText: 'Camera: Back View',
      success: true
    };
  }

  if (/\b(fit\s*(to\s*)?(screen|view|all|extents)|zoom\s*extents|fit\s*all)\b/i.test(text)) {
    return {
      actionType: 'CAMERA_VIEW',
      payload: { preset: 'fit' },
      speechText: 'Fitting part to view extents.',
      toastText: 'Camera: Fit Extents',
      success: true
    };
  }

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
  if (/\b(rotate|turn|spin)\b/i.test(text) || /\b(upside\s*down)\b/i.test(text)) {
    // Check for "upside down"
    if (/\bupside\s*down\b/i.test(text)) {
      return {
        actionType: 'ROTATE_PART',
        payload: { axis: 'x', degrees: 180 },
        speechText: 'Flipped workpiece upside down 180 degrees.',
        toastText: 'Rotated Workpiece 180° around X-Axis',
        success: true
      };
    }

    const degrees = extractNumber(text) ?? 90; // Default to 90 if unspecified

    // Determine axis: x, y, or z (default z for rotary table)
    let axis = 'z';
    if (/\b(x\s*axis|x|around\s*x|on\s*x)\b/i.test(text)) {
      axis = 'x';
    } else if (/\b(y\s*axis|y|around\s*y|on\s*y)\b/i.test(text)) {
      axis = 'y';
    } else if (/\b(z\s*axis|z|around\s*z|on\s*z)\b/i.test(text)) {
      axis = 'z';
    }

    // Direction (counter-clockwise or negative)
    let finalDegrees = degrees;
    if (/\b(counter\s*clockwise|anticlockwise|negative|left)\b/i.test(text) && finalDegrees > 0) {
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
  // 3. WORKPIECE TRANSLATION / MOVE
  // -------------------------------------------------------------
  if (/\b(move|translate|shift|offset)\b/i.test(text)) {
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

    if (/\b(up|above|higher)\b/i.test(text)) {
      dy = dist;
    } else if (/\b(down|below|lower)\b/i.test(text)) {
      dy = -dist;
    } else if (/\b(right)\b/i.test(text)) {
      dx = dist;
    } else if (/\b(left)\b/i.test(text)) {
      dx = -dist;
    } else if (/\b(forward|front)\b/i.test(text)) {
      dz = dist;
    } else if (/\b(back|backward|rear)\b/i.test(text)) {
      dz = -dist;
    } else if (/\b(x\s*axis|x)\b/i.test(text)) {
      dx = dist;
    } else if (/\b(y\s*axis|y)\b/i.test(text)) {
      dy = dist;
    } else if (/\b(z\s*axis|z)\b/i.test(text)) {
      dz = dist;
    } else {
      // Default to X axis
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
  if (/\b(reset\s*(part|material|workpiece|rotation|position|transform)|zero\s*out)\b/i.test(text)) {
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

  if (/\b(generate\s*toolpath|regenerate|calc\s*toolpath|compute\s*toolpath)\b/i.test(text)) {
    return {
      actionType: 'CAM_ACTION',
      payload: { command: 'regenerate_toolpaths' },
      speechText: 'Regenerating toolpaths.',
      toastText: 'Toolpaths Regenerated',
      success: true
    };
  }

  if (/\b(tool\s*manager|tools\s*list|open\s*tools|show\s*tools)\b/i.test(text)) {
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

  if (/\b(g\s*code|show\s*g\s*code|open\s*g\s*code|nc\s*code)\b/i.test(text)) {
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
  if (/\b(dimensions|size|bounding\s*box|how\s*big|workpiece\s*size)\b/i.test(text)) {
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

  if (/\b(operations|how\s*many\s*operations|toolpaths\s*count)\b/i.test(text)) {
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
