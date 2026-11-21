/**
 * cadSpeechNormalizer.js
 * High-Accuracy Phonetic & Acoustic Normalizer for Argus Master CAM.
 * Resolves regional accent variations and common Speech-to-Text mishearings:
 * - "more" -> "move"
 * - "tap view" -> "top view"
 * - "feed/feet view" -> "fit view"
 * - "ice metric" -> "isometric"
 * - Multi-hypothesis reranking from SpeechRecognition alternatives
 */

// Core CAM Domain Vocabulary for ranking
export const CAM_VOCABULARY = [
  'move', 'translate', 'shift', 'nudge', 'slide', 'offset',
  'rotate', 'turn', 'spin', 'flip',
  'top', 'front', 'isometric', 'iso', 'right', 'left', 'bottom', 'back', 'fit', 'extents', 'view',
  'simulation', 'simulate', 'backplot', 'toolpath', 'toolpaths', 'regenerate',
  'tools', 'tool', 'manager', 'stock', 'setup', 'gcode', 'code',
  'wireframe', 'shaded', 'dark', 'light', 'dimensions', 'size',
  'stop', 'wait', 'quiet', 'cancel', 'reset', 'origin', 'center'
];

// Direct phrase and phonetic substitutions
const PHRASE_CORRECTIONS = [
  // Top view confusions
  { regex: /\b(tap\s*view|tab\s*view|tub\s*view|stop\s*view)\b/gi, replacement: 'top view' },
  { regex: /\b(tap|tab)\b(?=\s*(side|face|plane)?$)/gi, replacement: 'top' },

  // Isometric confusions
  { regex: /\b(ice\s*metric|ice\s*metric\s*view|i\s*saw\s*metric|iso\s*metric)\b/gi, replacement: 'isometric view' },

  // Fit view confusions
  { regex: /\b(feed\s*view|feet\s*view|pit\s*view|hit\s*view|fat\s*view)\b/gi, replacement: 'fit view' },
  { regex: /\bfit\s*extent\b/gi, replacement: 'fit extents' },

  // Front view confusions
  { regex: /\b(font\s*view|fraud\s*view)\b/gi, replacement: 'front view' },

  // Rotation confusions
  { regex: /\b(row\s*tate|rotat|rotary\s*it|rote\s*it)\b/gi, replacement: 'rotate' },

  // Wireframe / Shaded confusions
  { regex: /\b(wire\s*front|free\s*frame|why\s*frame)\b/gi, replacement: 'wireframe' },
  { regex: /\b(shadow\s*mode|shed\s*mode)\b/gi, replacement: 'shaded mode' },

  // Backplot confusions
  { regex: /\b(back\s*plot|back\s*lot|black\s*plot)\b/gi, replacement: 'backplot' },

  // G-code confusions
  { regex: /\b(g\s*chord|g\s*cord|decode|the\s*code)\b/gi, replacement: 'gcode' }
];

// "move" vs "more" context patterns
const MOVE_REPLACEMENTS = [
  // "more 20 mm", "more 50", "more -10"
  { regex: /\b(more|moo|mood|mow|mue)\s+(-?\d+(\.\d+)?)/gi, replacement: 'move $2' },
  // "more on x", "more on z", "more workpiece", "more it"
  { regex: /\b(more|moo|mood|mow|mue)\s+(on|in|along|to|the|workpiece|part|material|it|up|down|left|right|forward|backward)/gi, replacement: 'move $2' },
  // Standalone "more", "moo"
  { regex: /^(more|moo|mood|mow|mue)$/gi, replacement: 'move' }
];

/**
 * Calculates Levenshtein distance between two strings
 */
export function levenshteinDistance(s1, s2) {
  const m = s1.length;
  const n = s2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1].toLowerCase() === s2[j - 1].toLowerCase() ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[m][n];
}

/**
 * Scores a transcript based on presence of CAM domain terms
 */
export function scoreCAMDomainRelevance(text) {
  if (!text) return 0;
  const lower = text.toLowerCase();
  let score = 0;

  for (const term of CAM_VOCABULARY) {
    if (new RegExp(`\\b${term}\\b`, 'i').test(lower)) {
      score += 10;
    }
  }

  // Bonus for numbers paired with axes or units (e.g. "20 mm", "180 degree")
  if (/\d+\s*(mm|degrees?|deg|inch|inches)/i.test(lower)) score += 8;
  if (/\b(x|y|z)\s*axis\b/i.test(lower)) score += 6;

  // Penalize generic non-CAM fillers if present
  if (/\b(more\s+than|give\s+me\s+more|read\s+more)\b/i.test(lower)) score -= 15;

  return score;
}

/**
 * Selects the best candidate from a list of speech recognition hypotheses
 * @param {Array<string|object>} alternatives - list of transcripts or SpeechRecognitionAlternative objects
 * @returns {string} best transcript
 */
export function selectBestAlternative(alternatives) {
  if (!alternatives || alternatives.length === 0) return '';
  if (alternatives.length === 1) {
    const item = alternatives[0];
    return typeof item === 'string' ? item : item?.transcript || '';
  }

  let bestTranscript = '';
  let highestScore = -Infinity;

  for (const alt of alternatives) {
    const raw = typeof alt === 'string' ? alt : alt?.transcript || '';
    if (!raw) continue;

    // Normalize candidate
    const norm = normalizeTranscript(raw).normalized;
    const score = scoreCAMDomainRelevance(norm);

    if (score > highestScore) {
      highestScore = score;
      bestTranscript = raw;
    }
  }

  return bestTranscript || (typeof alternatives[0] === 'string' ? alternatives[0] : alternatives[0]?.transcript || '');
}

/**
 * Normalizes speech text to fix phonetic mishearings and accent confusions
 * @param {string} rawText - user's speech transcript
 * @returns {object} { normalized, correctedFrom, isCorrected }
 */
export function normalizeTranscript(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { normalized: '', correctedFrom: null, isCorrected: false };
  }

  let text = rawText.trim();
  const original = text;

  // 1. Apply Phrase-Level Corrections
  for (const { regex, replacement } of PHRASE_CORRECTIONS) {
    text = text.replace(regex, replacement);
  }

  // 2. Apply Move Context Corrections ("more" -> "move")
  for (const { regex, replacement } of MOVE_REPLACEMENTS) {
    text = text.replace(regex, replacement);
  }

  // 3. Word-level Fuzzy Correction for Close CAM Verbs
  const words = text.split(/\s+/);
  const correctedWords = words.map((w) => {
    const lower = w.toLowerCase().replace(/[^a-z]/g, '');
    if (!lower || lower.length < 3) return w;

    // Preserve valid domain words that shouldn't be mutated
    if (lower === 'mode' || lower === 'wire' || lower === 'fast' || lower === 'slow') return w;

    // Check specific known confusions
    if (lower === 'more' || lower === 'moo' || lower === 'mood') return 'move';
    if (lower === 'tap' || lower === 'tab') return 'top';

    // Check Levenshtein distance against key CAM keywords
    for (const key of ['move', 'rotate', 'view', 'fit', 'shaded']) {
      if (levenshteinDistance(lower, key) === 1 && lower.length === key.length) {
        return key;
      }
    }

    return w;
  });

  text = correctedWords.join(' ');

  const isCorrected = text.toLowerCase() !== original.toLowerCase();

  return {
    normalized: text,
    correctedFrom: isCorrected ? original : null,
    isCorrected
  };
}
