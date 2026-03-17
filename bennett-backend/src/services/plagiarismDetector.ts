/**
 * Server-Side Plagiarism Detection using the Winnowing Algorithm.
 *
 * Based on "Winnowing: Local Algorithms for Document Fingerprinting"
 * (Schleimer, Wilkerson, Aiken — Stanford, 2003 — the MOSS paper).
 *
 * Pipeline:
 *   1. Language-aware comment/string stripping
 *   2. Identifier normalization (user identifiers → `V`, built-ins preserved)
 *   3. Whitespace + case normalization
 *   4. K-gram rolling hash (Rabin–Karp)
 *   5. Winnowing: select minimum hash per window → fingerprints
 *   6. Pairwise fingerprint intersection → similarity score + matched regions
 */

// ── Types ───────────────────────────────────────────────────────────────

export interface FingerprintEntry {
  hash: number;
  position: number; // character offset in normalized code
  line: number;     // original line number (1-based)
}

export interface NormalizedCode {
  original: string;
  normalized: string;
  lineMap: number[]; // normalized char offset → original line number (1-based)
}

export interface PairwiseMatch {
  submissionIdA: string;
  submissionIdB: string;
  studentIdA: string;
  studentIdB: string;
  similarity: number; // 0-100
  sharedFingerprints: number;
  totalFingerprintsA: number;
  totalFingerprintsB: number;
  matchedRegions: MatchedRegion[];
}

export interface MatchedRegion {
  linesA: { start: number; end: number };
  linesB: { start: number; end: number };
}

export interface DetectionConfig {
  kgramSize: number;       // k in k-grams (default 5)
  windowSize: number;      // w in winnowing window (default 4)
  language: string;        // python | javascript | java | cpp | c
  sensitivity: 'low' | 'medium' | 'high';
}

export interface SubmissionInput {
  id: string;
  studentId: string;
  studentName: string;
  code: string;
  language: string;
  questionId: string;
}

export interface DetectionResult {
  assessmentId: string;
  questionId: string;
  pairs: PairwiseMatch[];
  flaggedStudentIds: Set<string>;
  timestamp: string;
}

// ── Constants ───────────────────────────────────────────────────────────

const SENSITIVITY_THRESHOLDS = {
  low:    { flag: 80, match: 70 },
  medium: { flag: 60, match: 50 },
  high:   { flag: 40, match: 30 },
} as const;

const DEFAULT_CONFIG: DetectionConfig = {
  kgramSize: 5,
  windowSize: 4,
  language: 'python',
  sensitivity: 'medium',
};

// Prime for Rabin-Karp rolling hash
const HASH_PRIME = 31;
const HASH_MOD = 1_000_000_007;

// ── Language-specific built-in keywords (preserved during normalization) ─

const LANGUAGE_KEYWORDS: Record<string, Set<string>> = {
  python: new Set([
    'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue',
    'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from',
    'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not',
    'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield',
    'True', 'False', 'None', 'print', 'len', 'range', 'int', 'str',
    'float', 'list', 'dict', 'set', 'tuple', 'type', 'input', 'map',
    'filter', 'sorted', 'enumerate', 'zip', 'open', 'super', 'self',
  ]),
  javascript: new Set([
    'abstract', 'arguments', 'await', 'boolean', 'break', 'byte', 'case',
    'catch', 'char', 'class', 'const', 'continue', 'debugger', 'default',
    'delete', 'do', 'double', 'else', 'enum', 'eval', 'export', 'extends',
    'false', 'final', 'finally', 'float', 'for', 'function', 'goto', 'if',
    'implements', 'import', 'in', 'instanceof', 'int', 'interface', 'let',
    'long', 'native', 'new', 'null', 'of', 'package', 'private', 'protected',
    'public', 'return', 'short', 'static', 'super', 'switch', 'synchronized',
    'this', 'throw', 'throws', 'transient', 'true', 'try', 'typeof', 'var',
    'void', 'volatile', 'while', 'with', 'yield', 'undefined', 'NaN',
    'console', 'log', 'Math', 'Array', 'Object', 'String', 'Number',
    'parseInt', 'parseFloat', 'JSON', 'Promise', 'Map', 'Set',
  ]),
  java: new Set([
    'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch',
    'char', 'class', 'const', 'continue', 'default', 'do', 'double',
    'else', 'enum', 'extends', 'false', 'final', 'finally', 'float',
    'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int',
    'interface', 'long', 'native', 'new', 'null', 'package', 'private',
    'protected', 'public', 'return', 'short', 'static', 'strictfp',
    'super', 'switch', 'synchronized', 'this', 'throw', 'throws',
    'transient', 'true', 'try', 'void', 'volatile', 'while',
    'System', 'out', 'println', 'String', 'Scanner', 'main', 'args',
    'Integer', 'Double', 'Float', 'Boolean', 'ArrayList', 'HashMap',
    'List', 'Map', 'Set', 'Collections', 'Arrays',
  ]),
  cpp: new Set([
    'alignas', 'alignof', 'and', 'asm', 'auto', 'bitand', 'bitor',
    'bool', 'break', 'case', 'catch', 'char', 'class', 'compl', 'concept',
    'const', 'consteval', 'constexpr', 'constinit', 'continue', 'co_await',
    'co_return', 'co_yield', 'decltype', 'default', 'delete', 'do',
    'double', 'else', 'enum', 'explicit', 'export', 'extern', 'false',
    'float', 'for', 'friend', 'goto', 'if', 'inline', 'int', 'long',
    'mutable', 'namespace', 'new', 'noexcept', 'not', 'nullptr', 'operator',
    'or', 'private', 'protected', 'public', 'register', 'return', 'short',
    'signed', 'sizeof', 'static', 'struct', 'switch', 'template', 'this',
    'throw', 'true', 'try', 'typedef', 'typeid', 'typename', 'union',
    'unsigned', 'using', 'virtual', 'void', 'volatile', 'while',
    'std', 'cout', 'cin', 'endl', 'string', 'vector', 'map', 'set',
    'pair', 'queue', 'stack', 'sort', 'include', 'iostream', 'algorithm',
    'printf', 'scanf', 'main', 'NULL', 'size_t',
  ]),
  c: new Set([
    'auto', 'break', 'case', 'char', 'const', 'continue', 'default',
    'do', 'double', 'else', 'enum', 'extern', 'float', 'for', 'goto',
    'if', 'inline', 'int', 'long', 'register', 'restrict', 'return',
    'short', 'signed', 'sizeof', 'static', 'struct', 'switch', 'typedef',
    'union', 'unsigned', 'void', 'volatile', 'while',
    'printf', 'scanf', 'malloc', 'free', 'calloc', 'realloc',
    'strlen', 'strcpy', 'strcmp', 'memcpy', 'memset',
    'NULL', 'EOF', 'stdin', 'stdout', 'stderr', 'main',
    'include', 'stdio', 'stdlib', 'string', 'math',
  ]),
};

// ── Step 1: Strip comments and strings ──────────────────────────────────

export function stripCommentsAndStrings(code: string, language: string): string {
  switch (language) {
    case 'python': {
      // Remove triple-quoted strings first, then single-line comments, then regular strings
      let result = code;
      result = result.replace(/'''[\s\S]*?'''/g, '""');
      result = result.replace(/"""[\s\S]*?"""/g, '""');
      result = result.replace(/#.*$/gm, '');
      result = result.replace(/'(?:[^'\\]|\\.)*'/g, '""');
      result = result.replace(/"(?:[^"\\]|\\.)*"/g, '""');
      return result;
    }
    case 'javascript':
    case 'java':
    case 'cpp':
    case 'c': {
      let result = code;
      // Block comments
      result = result.replace(/\/\*[\s\S]*?\*\//g, '');
      // Line comments
      result = result.replace(/\/\/.*$/gm, '');
      // String literals (single and double quoted)
      result = result.replace(/'(?:[^'\\]|\\.)*'/g, '""');
      result = result.replace(/"(?:[^"\\]|\\.)*"/g, '""');
      // Template literals (JS)
      if (language === 'javascript') {
        result = result.replace(/`(?:[^`\\]|\\.)*`/g, '""');
      }
      return result;
    }
    default:
      return code;
  }
}

// ── Step 2: Normalize identifiers ───────────────────────────────────────

/**
 * Replaces user-defined identifiers with a generic token 'V',
 * while preserving language keywords, operators, and structure.
 * This makes the algorithm robust against variable renaming.
 */
export function normalizeIdentifiers(code: string, language: string): NormalizedCode {
  const keywords = LANGUAGE_KEYWORDS[language] || LANGUAGE_KEYWORDS['python'];
  const lines = code.split('\n');
  const normalizedLines: string[] = [];
  const lineMap: number[] = [];

  let charOffset = 0;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    // Replace identifiers: word characters that aren't keywords or numbers
    const normalized = line.replace(/\b([a-zA-Z_]\w*)\b/g, (match) => {
      if (keywords.has(match)) return match;
      // Preserve numeric-looking tokens
      if (/^\d/.test(match)) return match;
      return 'V';
    });

    // Collapse whitespace
    const collapsed = normalized.replace(/\s+/g, ' ').trim();
    if (collapsed.length === 0) continue;

    // Track line mapping: each character in normalized output → original line number
    for (let i = 0; i < collapsed.length; i++) {
      lineMap[charOffset + i] = lineIdx + 1; // 1-based line numbers
    }
    charOffset += collapsed.length;

    normalizedLines.push(collapsed);
  }

  const normalizedText = normalizedLines.join('').toLowerCase();
  return {
    original: code,
    normalized: normalizedText,
    lineMap,
  };
}

// ── Step 3: K-gram rolling hash (Rabin–Karp) ───────────────────────────

export function computeKgramHashes(text: string, k: number): { hash: number; position: number }[] {
  if (text.length < k) return [];

  const hashes: { hash: number; position: number }[] = [];

  // Precompute base^(k-1) mod MOD for rolling hash removal
  let basePow = 1;
  for (let i = 0; i < k - 1; i++) {
    basePow = (basePow * HASH_PRIME) % HASH_MOD;
  }

  // Compute initial hash for first k-gram
  let h = 0;
  for (let i = 0; i < k; i++) {
    h = (h * HASH_PRIME + text.charCodeAt(i)) % HASH_MOD;
  }
  hashes.push({ hash: h, position: 0 });

  // Roll the hash
  for (let i = 1; i <= text.length - k; i++) {
    // Remove leftmost character, add rightmost
    h = (h - text.charCodeAt(i - 1) * basePow % HASH_MOD + HASH_MOD) % HASH_MOD;
    h = (h * HASH_PRIME + text.charCodeAt(i + k - 1)) % HASH_MOD;
    hashes.push({ hash: h, position: i });
  }

  return hashes;
}

// ── Step 4: Winnowing — select fingerprints from k-gram hashes ──────────

/**
 * Winnowing selects the minimum hash in each sliding window of size w.
 * Ties are broken by selecting the rightmost minimum.
 * This guarantees: if there is a shared substring of length ≥ k+w-1,
 * at least one fingerprint will match.
 */
export function winnow(
  kgramHashes: { hash: number; position: number }[],
  w: number,
  lineMap: number[]
): FingerprintEntry[] {
  if (kgramHashes.length === 0) return [];
  if (kgramHashes.length <= w) {
    // Window larger than input — take the single minimum
    let min = kgramHashes[0];
    for (let i = 1; i < kgramHashes.length; i++) {
      if (kgramHashes[i].hash <= min.hash) min = kgramHashes[i];
    }
    return [{
      hash: min.hash,
      position: min.position,
      line: lineMap[min.position] ?? 1,
    }];
  }

  const fingerprints: FingerprintEntry[] = [];
  let prevMinIdx = -1;

  for (let i = 0; i <= kgramHashes.length - w; i++) {
    // Find rightmost minimum in window [i, i+w)
    let minIdx = i;
    for (let j = i + 1; j < i + w; j++) {
      if (kgramHashes[j].hash <= kgramHashes[minIdx].hash) {
        minIdx = j;
      }
    }

    if (minIdx !== prevMinIdx) {
      const entry = kgramHashes[minIdx];
      fingerprints.push({
        hash: entry.hash,
        position: entry.position,
        line: lineMap[entry.position] ?? 1,
      });
      prevMinIdx = minIdx;
    }
  }

  return fingerprints;
}

// ── Step 5: Full fingerprinting pipeline ────────────────────────────────

export function fingerprint(code: string, language: string, config: Partial<DetectionConfig> = {}): {
  fingerprints: FingerprintEntry[];
  normalized: NormalizedCode;
} {
  const k = config.kgramSize ?? DEFAULT_CONFIG.kgramSize;
  const w = config.windowSize ?? DEFAULT_CONFIG.windowSize;

  const stripped = stripCommentsAndStrings(code, language);
  const normalized = normalizeIdentifiers(stripped, language);
  const kgrams = computeKgramHashes(normalized.normalized, k);
  const fps = winnow(kgrams, w, normalized.lineMap);

  return { fingerprints: fps, normalized };
}

// ── Step 6: Pairwise comparison ─────────────────────────────────────────

export function comparePair(
  a: { submission: SubmissionInput; fingerprints: FingerprintEntry[] },
  b: { submission: SubmissionInput; fingerprints: FingerprintEntry[] },
  sensitivity: 'low' | 'medium' | 'high'
): PairwiseMatch | null {
  const setA = new Map<number, FingerprintEntry[]>();
  for (const fp of a.fingerprints) {
    const arr = setA.get(fp.hash) || [];
    arr.push(fp);
    setA.set(fp.hash, arr);
  }

  const setB = new Map<number, FingerprintEntry[]>();
  for (const fp of b.fingerprints) {
    const arr = setB.get(fp.hash) || [];
    arr.push(fp);
    setB.set(fp.hash, arr);
  }

  // Find shared fingerprint hashes
  let sharedCount = 0;
  const matchedLinesA = new Set<number>();
  const matchedLinesB = new Set<number>();

  for (const [hash, entriesA] of setA) {
    const entriesB = setB.get(hash);
    if (!entriesB) continue;
    sharedCount += Math.min(entriesA.length, entriesB.length);
    for (const e of entriesA) matchedLinesA.add(e.line);
    for (const e of entriesB) matchedLinesB.add(e.line);
  }

  const totalA = a.fingerprints.length;
  const totalB = b.fingerprints.length;
  if (totalA === 0 && totalB === 0) return null;

  // Similarity = shared / min(totalA, totalB) — asymmetric containment metric
  // This catches cases where a small submission is fully contained in a larger one
  const denominator = Math.min(totalA, totalB) || 1;
  const similarity = Math.round((sharedCount / denominator) * 10000) / 100;

  const threshold = SENSITIVITY_THRESHOLDS[sensitivity].match;
  if (similarity < threshold) return null;

  // Build matched regions from contiguous line ranges
  const matchedRegions = buildMatchedRegions(matchedLinesA, matchedLinesB);

  return {
    submissionIdA: a.submission.id,
    submissionIdB: b.submission.id,
    studentIdA: a.submission.studentId,
    studentIdB: b.submission.studentId,
    similarity,
    sharedFingerprints: sharedCount,
    totalFingerprintsA: totalA,
    totalFingerprintsB: totalB,
    matchedRegions,
  };
}

function buildMatchedRegions(linesA: Set<number>, linesB: Set<number>): MatchedRegion[] {
  const toRanges = (lines: Set<number>): { start: number; end: number }[] => {
    const sorted = [...lines].sort((a, b) => a - b);
    if (sorted.length === 0) return [];
    const ranges: { start: number; end: number }[] = [];
    let start = sorted[0];
    let end = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] <= end + 2) { // Allow 1-line gap for contiguous regions
        end = sorted[i];
      } else {
        ranges.push({ start, end });
        start = sorted[i];
        end = sorted[i];
      }
    }
    ranges.push({ start, end });
    return ranges;
  };

  const rangesA = toRanges(linesA);
  const rangesB = toRanges(linesB);

  // Pair up ranges (best effort — zip by index)
  const maxLen = Math.max(rangesA.length, rangesB.length);
  const regions: MatchedRegion[] = [];
  for (let i = 0; i < maxLen; i++) {
    regions.push({
      linesA: rangesA[i] ?? rangesA[rangesA.length - 1] ?? { start: 0, end: 0 },
      linesB: rangesB[i] ?? rangesB[rangesB.length - 1] ?? { start: 0, end: 0 },
    });
  }
  return regions;
}

// ── Step 7: Batch detection — compare all submissions for a question ────

export function detectPlagiarism(
  submissions: SubmissionInput[],
  config: Partial<DetectionConfig> = {}
): DetectionResult {
  const sensitivity = config.sensitivity ?? DEFAULT_CONFIG.sensitivity;

  // Fingerprint all submissions
  const fingerprintedSubmissions = submissions.map(sub => ({
    submission: sub,
    ...fingerprint(sub.code, sub.language, config),
  }));

  // Pairwise comparison (n*(n-1)/2 pairs)
  const pairs: PairwiseMatch[] = [];
  const flaggedStudentIds = new Set<string>();
  const flagThreshold = SENSITIVITY_THRESHOLDS[sensitivity].flag;

  for (let i = 0; i < fingerprintedSubmissions.length; i++) {
    for (let j = i + 1; j < fingerprintedSubmissions.length; j++) {
      const match = comparePair(
        fingerprintedSubmissions[i],
        fingerprintedSubmissions[j],
        sensitivity,
      );
      if (match) {
        pairs.push(match);
        if (match.similarity >= flagThreshold) {
          flaggedStudentIds.add(match.studentIdA);
          flaggedStudentIds.add(match.studentIdB);
        }
      }
    }
  }

  // Sort by similarity descending
  pairs.sort((a, b) => b.similarity - a.similarity);

  return {
    assessmentId: '',
    questionId: submissions[0]?.questionId ?? '',
    pairs,
    flaggedStudentIds,
    timestamp: new Date().toISOString(),
  };
}

// ── Exported convenience for testing ────────────────────────────────────

export { SENSITIVITY_THRESHOLDS, DEFAULT_CONFIG, HASH_PRIME, HASH_MOD, LANGUAGE_KEYWORDS };
