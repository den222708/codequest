import { describe, it, expect } from 'vitest';
import {
  stripCommentsAndStrings,
  normalizeIdentifiers,
  computeKgramHashes,
  winnow,
  fingerprint,
  comparePair,
  detectPlagiarism,
  SENSITIVITY_THRESHOLDS,
  DEFAULT_CONFIG,
  LANGUAGE_KEYWORDS,
  type SubmissionInput,
} from './plagiarismDetector.js';

// ── stripCommentsAndStrings ─────────────────────────────────────────────

describe('stripCommentsAndStrings', () => {
  it('strips Python single-line comments', () => {
    const code = 'x = 1 # this is a comment\ny = 2';
    const result = stripCommentsAndStrings(code, 'python');
    expect(result).not.toContain('this is a comment');
    expect(result).toContain('x = 1');
    expect(result).toContain('y = 2');
  });

  it('strips Python triple-quoted strings', () => {
    const code = '"""docstring"""\nx = 1';
    const result = stripCommentsAndStrings(code, 'python');
    expect(result).not.toContain('docstring');
    expect(result).toContain('x = 1');
  });

  it('strips JavaScript block comments', () => {
    const code = '/* block comment */\nlet x = 1;';
    const result = stripCommentsAndStrings(code, 'javascript');
    expect(result).not.toContain('block comment');
    expect(result).toContain('let x = 1;');
  });

  it('strips C++ line comments', () => {
    const code = 'int x = 1; // inline comment\nint y = 2;';
    const result = stripCommentsAndStrings(code, 'cpp');
    expect(result).not.toContain('inline comment');
  });

  it('replaces string literals with empty strings', () => {
    const code = 'console.log("hello world");';
    const result = stripCommentsAndStrings(code, 'javascript');
    expect(result).not.toContain('hello world');
    expect(result).toContain('console.log');
  });

  it('returns code unchanged for unknown language', () => {
    const code = '# comment\nx = 1';
    const result = stripCommentsAndStrings(code, 'unknown');
    expect(result).toBe(code);
  });
});

// ── normalizeIdentifiers ────────────────────────────────────────────────

describe('normalizeIdentifiers', () => {
  it('replaces user identifiers with V', () => {
    const result = normalizeIdentifiers('x = myVar + other', 'python');
    expect(result.normalized).toContain('v');
    // Keywords like 'x' (single char non-keyword) should become V
    expect(result.normalized).not.toContain('myvar');
  });

  it('preserves language keywords', () => {
    const result = normalizeIdentifiers('for i in range(10):\n  print(i)', 'python');
    expect(result.normalized).toContain('for');
    expect(result.normalized).toContain('in');
    expect(result.normalized).toContain('range');
    expect(result.normalized).toContain('print');
  });

  it('builds correct line map', () => {
    const result = normalizeIdentifiers('hello\nworld', 'python');
    expect(result.lineMap.length).toBeGreaterThan(0);
    // First character should map to line 1
    expect(result.lineMap[0]).toBe(1);
  });

  it('skips empty lines', () => {
    const result = normalizeIdentifiers('x = 1\n\n\ny = 2', 'python');
    // Empty lines should not appear in normalized output
    expect(result.normalized).not.toContain('\n');
  });

  it('collapses whitespace', () => {
    const result = normalizeIdentifiers('x   =   1', 'python');
    expect(result.normalized).not.toContain('   ');
  });
});

// ── computeKgramHashes ──────────────────────────────────────────────────

describe('computeKgramHashes', () => {
  it('returns empty for text shorter than k', () => {
    const hashes = computeKgramHashes('abc', 5);
    expect(hashes).toHaveLength(0);
  });

  it('returns correct number of hashes for text of length n', () => {
    const text = 'abcdefgh'; // length 8
    const k = 3;
    const hashes = computeKgramHashes(text, k);
    // Should produce n - k + 1 = 8 - 3 + 1 = 6 hashes
    expect(hashes).toHaveLength(6);
  });

  it('hashes are deterministic', () => {
    const h1 = computeKgramHashes('hello world', 4);
    const h2 = computeKgramHashes('hello world', 4);
    expect(h1).toEqual(h2);
  });

  it('different texts produce different hashes', () => {
    const h1 = computeKgramHashes('abcde', 3);
    const h2 = computeKgramHashes('vwxyz', 3);
    const hashes1 = h1.map(h => h.hash);
    const hashes2 = h2.map(h => h.hash);
    // At least some hashes should differ
    expect(hashes1).not.toEqual(hashes2);
  });

  it('positions are sequential', () => {
    const hashes = computeKgramHashes('abcdefgh', 3);
    for (let i = 0; i < hashes.length; i++) {
      expect(hashes[i].position).toBe(i);
    }
  });
});

// ── winnow ──────────────────────────────────────────────────────────────

describe('winnow', () => {
  it('returns empty for empty input', () => {
    const fps = winnow([], 4, []);
    expect(fps).toHaveLength(0);
  });

  it('returns single fingerprint when input smaller than window', () => {
    const kgrams = [
      { hash: 10, position: 0 },
      { hash: 5, position: 1 },
    ];
    const lineMap = [1, 1];
    const fps = winnow(kgrams, 4, lineMap);
    expect(fps).toHaveLength(1);
    expect(fps[0].hash).toBe(5); // minimum
  });

  it('selects minimum in each window', () => {
    // Window of size 3, sliding over [10, 5, 8, 3, 7]
    const kgrams = [
      { hash: 10, position: 0 },
      { hash: 5, position: 1 },
      { hash: 8, position: 2 },
      { hash: 3, position: 3 },
      { hash: 7, position: 4 },
    ];
    const lineMap = [1, 1, 1, 2, 2];
    const fps = winnow(kgrams, 3, lineMap);

    // Windows: [10,5,8]=5, [5,8,3]=3, [8,3,7]=3
    // Unique selections: position 1 (hash 5), position 3 (hash 3)
    const hashes = fps.map(f => f.hash);
    expect(hashes).toContain(5);
    expect(hashes).toContain(3);
  });

  it('does not emit duplicate fingerprints for same min position', () => {
    // If min stays the same across consecutive windows, only emit once
    const kgrams = [
      { hash: 10, position: 0 },
      { hash: 1, position: 1 },
      { hash: 8, position: 2 },
      { hash: 9, position: 3 },
    ];
    const lineMap = [1, 1, 1, 1];
    const fps = winnow(kgrams, 3, lineMap);
    // Windows: [10,1,8]=1@pos1, [1,8,9]=1@pos1 → same, emitted once
    expect(fps).toHaveLength(1);
    expect(fps[0].hash).toBe(1);
  });
});

// ── fingerprint (end-to-end pipeline) ───────────────────────────────────

describe('fingerprint', () => {
  it('produces fingerprints for valid code', () => {
    const code = `
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(10))
`;
    const result = fingerprint(code, 'python');
    expect(result.fingerprints.length).toBeGreaterThan(0);
    expect(result.normalized.normalized.length).toBeGreaterThan(0);
  });

  it('returns empty fingerprints for very short code', () => {
    const result = fingerprint('x', 'python');
    // After normalization, the code may be too short for k-grams
    expect(result.fingerprints.length).toBe(0);
  });

  it('identical code produces identical fingerprints', () => {
    const code = 'for i in range(10):\n  print(i)';
    const r1 = fingerprint(code, 'python');
    const r2 = fingerprint(code, 'python');
    expect(r1.fingerprints.map(f => f.hash)).toEqual(r2.fingerprints.map(f => f.hash));
  });

  it('variable renaming produces same fingerprints', () => {
    const code1 = 'total = 0\nfor item in data:\n  total += item\nprint(total)';
    const code2 = 'sum_val = 0\nfor element in collection:\n  sum_val += element\nprint(sum_val)';

    const r1 = fingerprint(code1, 'python');
    const r2 = fingerprint(code2, 'python');

    // After identifier normalization, both should produce the same fingerprints
    expect(r1.fingerprints.map(f => f.hash)).toEqual(r2.fingerprints.map(f => f.hash));
  });
});

// ── comparePair ─────────────────────────────────────────────────────────

describe('comparePair', () => {
  const makeSubmission = (id: string, code: string): SubmissionInput => ({
    id,
    studentId: `student-${id}`,
    studentName: `Student ${id}`,
    code,
    language: 'python',
    questionId: 'q1',
  });

  it('returns null for unrelated code', () => {
    const sub1 = makeSubmission('1', 'def add(a, b):\n  return a + b\nprint(add(1, 2))');
    const sub2 = makeSubmission('2', 'import os\nfor f in os.listdir("."):\n  if f.endswith(".txt"):\n    print(f)');

    const fp1 = fingerprint(sub1.code, 'python');
    const fp2 = fingerprint(sub2.code, 'python');

    const result = comparePair(
      { submission: sub1, fingerprints: fp1.fingerprints },
      { submission: sub2, fingerprints: fp2.fingerprints },
      'medium'
    );
    expect(result).toBeNull();
  });

  it('detects identical code as high similarity', () => {
    const code = `
def fibonacci(n):
    if n <= 1:
        return n
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b

for i in range(20):
    print(fibonacci(i))
`;
    const sub1 = makeSubmission('1', code);
    const sub2 = makeSubmission('2', code);

    const fp1 = fingerprint(sub1.code, 'python');
    const fp2 = fingerprint(sub2.code, 'python');

    const result = comparePair(
      { submission: sub1, fingerprints: fp1.fingerprints },
      { submission: sub2, fingerprints: fp2.fingerprints },
      'medium'
    );

    expect(result).not.toBeNull();
    expect(result!.similarity).toBe(100);
  });

  it('detects renamed variables as plagiarism', () => {
    const code1 = `
def calculate_sum(numbers):
    total = 0
    for num in numbers:
        total += num
    return total

result = calculate_sum([1, 2, 3, 4, 5])
print(result)
`;
    const code2 = `
def compute_total(data):
    accumulator = 0
    for item in data:
        accumulator += item
    return accumulator

output = compute_total([1, 2, 3, 4, 5])
print(output)
`;
    const sub1 = makeSubmission('1', code1);
    const sub2 = makeSubmission('2', code2);

    const fp1 = fingerprint(sub1.code, 'python');
    const fp2 = fingerprint(sub2.code, 'python');

    const result = comparePair(
      { submission: sub1, fingerprints: fp1.fingerprints },
      { submission: sub2, fingerprints: fp2.fingerprints },
      'medium'
    );

    expect(result).not.toBeNull();
    // Should have high similarity since only identifiers changed
    expect(result!.similarity).toBeGreaterThan(80);
  });

  it('includes matched regions', () => {
    const code = `
def solve(n):
    if n == 0:
        return 0
    if n == 1:
        return 1
    return solve(n - 1) + solve(n - 2)

print(solve(10))
`;
    const sub1 = makeSubmission('1', code);
    const sub2 = makeSubmission('2', code);

    const fp1 = fingerprint(sub1.code, 'python');
    const fp2 = fingerprint(sub2.code, 'python');

    const result = comparePair(
      { submission: sub1, fingerprints: fp1.fingerprints },
      { submission: sub2, fingerprints: fp2.fingerprints },
      'medium'
    );

    expect(result).not.toBeNull();
    expect(result!.matchedRegions.length).toBeGreaterThan(0);
  });
});

// ── detectPlagiarism (batch) ────────────────────────────────────────────

describe('detectPlagiarism', () => {
  it('returns empty pairs for single submission', () => {
    const submissions: SubmissionInput[] = [{
      id: '1',
      studentId: 's1',
      studentName: 'Alice',
      code: 'print("hello")',
      language: 'python',
      questionId: 'q1',
    }];

    const result = detectPlagiarism(submissions);
    expect(result.pairs).toHaveLength(0);
    expect(result.flaggedStudentIds.size).toBe(0);
  });

  it('finds plagiarism pairs among multiple submissions', () => {
    const sharedCode = `
def binary_search(arr, target):
    low = 0
    high = len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1

print(binary_search([1,2,3,4,5,6,7,8,9,10], 7))
`;

    const differentCode = `
import os
import sys

def list_files(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            path = os.path.join(root, file)
            size = os.path.getsize(path)
            print(f"{path}: {size} bytes")

list_files(sys.argv[1] if len(sys.argv) > 1 else ".")
`;

    const submissions: SubmissionInput[] = [
      { id: '1', studentId: 's1', studentName: 'Alice', code: sharedCode, language: 'python', questionId: 'q1' },
      { id: '2', studentId: 's2', studentName: 'Bob', code: sharedCode.replace('binary_search', 'bin_search').replace('target', 'val'), language: 'python', questionId: 'q1' },
      { id: '3', studentId: 's3', studentName: 'Charlie', code: differentCode, language: 'python', questionId: 'q1' },
    ];

    const result = detectPlagiarism(submissions, { sensitivity: 'medium' });

    // Alice-Bob pair should be detected, Charlie should not match
    expect(result.pairs.length).toBeGreaterThan(0);
    const aliceBobPair = result.pairs.find(
      p => (p.studentIdA === 's1' && p.studentIdB === 's2') ||
           (p.studentIdA === 's2' && p.studentIdB === 's1')
    );
    expect(aliceBobPair).toBeDefined();
    expect(aliceBobPair!.similarity).toBeGreaterThan(50);
  });

  it('sorts pairs by similarity descending', () => {
    const code1 = 'def f(x):\n  return x * 2\nprint(f(5))';
    const code2 = 'def g(y):\n  return y * 2\nprint(g(5))';
    const code3 = 'import math\nprint(math.sqrt(16))\nprint(math.pi)';

    const submissions: SubmissionInput[] = [
      { id: '1', studentId: 's1', studentName: 'A', code: code1, language: 'python', questionId: 'q1' },
      { id: '2', studentId: 's2', studentName: 'B', code: code2, language: 'python', questionId: 'q1' },
      { id: '3', studentId: 's3', studentName: 'C', code: code3, language: 'python', questionId: 'q1' },
    ];

    const result = detectPlagiarism(submissions, { sensitivity: 'high' });

    for (let i = 1; i < result.pairs.length; i++) {
      expect(result.pairs[i - 1].similarity).toBeGreaterThanOrEqual(result.pairs[i].similarity);
    }
  });
});

// ── Config / Constants ──────────────────────────────────────────────────

describe('constants', () => {
  it('has valid sensitivity thresholds', () => {
    expect(SENSITIVITY_THRESHOLDS.low.flag).toBeGreaterThan(SENSITIVITY_THRESHOLDS.medium.flag);
    expect(SENSITIVITY_THRESHOLDS.medium.flag).toBeGreaterThan(SENSITIVITY_THRESHOLDS.high.flag);
  });

  it('has valid default config', () => {
    expect(DEFAULT_CONFIG.kgramSize).toBeGreaterThan(0);
    expect(DEFAULT_CONFIG.windowSize).toBeGreaterThan(0);
  });

  it('has keywords for all supported languages', () => {
    for (const lang of ['python', 'javascript', 'java', 'cpp', 'c']) {
      expect(LANGUAGE_KEYWORDS[lang]).toBeDefined();
      expect(LANGUAGE_KEYWORDS[lang].size).toBeGreaterThan(0);
    }
  });
});
