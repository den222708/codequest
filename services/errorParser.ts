import type * as monacoEditor from 'monaco-editor';

// Use numeric values to avoid runtime import of monacoEditor namespace
const MarkerSeverity = { Hint: 1, Info: 2, Warning: 4, Error: 8 } as const;

type IMarkerData = monacoEditor.editor.IMarkerData;

interface ParseInput {
  stderr?: string;
  compileOutput?: string;
  error?: string;
  statusId?: number;
}

/**
 * Parse Judge0 error output into Monaco IMarkerData[] for red squiggles.
 * Returns empty array for accepted/pending runs or when no parseable errors found.
 */
export function parseErrorsToMarkers(result: ParseInput, language: string): IMarkerData[] {
  const statusId = result.statusId;

  // No markers for accepted, in-queue, or processing
  if (statusId !== undefined && (statusId === 1 || statusId === 2 || statusId === 3)) {
    return [];
  }

  // Prefer the most specific error source for each language
  const errorText =
    result.compileOutput ||
    result.error ||
    result.stderr ||
    '';

  if (!errorText.trim()) return [];

  if (language === 'python') {
    return parsePythonError(errorText);
  }
  if (language === 'java') {
    return parseJavaCompileOutput(errorText);
  }
  if (language === 'cpp' || language === 'c') {
    return parseCppCompileOutput(errorText);
  }

  return [];
}

/**
 * Parse Python errors — handles both SyntaxErrors (compile_output) and
 * runtime errors (stderr) by looking for "File ..., line N" traceback entries.
 */
function parsePythonError(text: string): IMarkerData[] {
  if (!text) return [];

  // Collect all "File ..., line N" entries
  const fileLineRegex = /File ".*?", line (\d+)/g;
  const lineNumbers: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = fileLineRegex.exec(text)) !== null) {
    lineNumbers.push(parseInt(m[1], 10));
  }

  // Use the last (deepest) frame for the marker location
  const lineNumber = lineNumbers[lineNumbers.length - 1] || 1;

  // Extract the error type + message from the last line of the traceback
  const errorTypeMatch = text.match(
    /(SyntaxError|IndentationError|TabError|NameError|TypeError|ValueError|AttributeError|ImportError|KeyError|IndexError|ZeroDivisionError|RuntimeError|\w+Error|\w+Exception): (.+)/
  );
  const message = errorTypeMatch
    ? `${errorTypeMatch[1]}: ${errorTypeMatch[2].trim()}`
    : text.split('\n').filter(Boolean).pop()?.trim() || 'Python error';

  // For SyntaxErrors, try to extract column from the caret (^) line
  let startColumn = 1;
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*\^+\s*$/.test(lines[i])) {
      startColumn = lines[i].indexOf('^') + 1;
      break;
    }
  }

  return [
    {
      severity: MarkerSeverity.Error,
      startLineNumber: lineNumber,
      startColumn,
      endLineNumber: lineNumber,
      endColumn: startColumn + 1,
      message,
      source: 'judge0',
    },
  ];
}

/**
 * Parse Java compilation errors.
 * Pattern: Main.java:5: error: cannot find symbol
 */
function parseJavaCompileOutput(text: string): IMarkerData[] {
  if (!text) return [];

  const markers: IMarkerData[] = [];
  const regex = /[\w./\\-]+\.java:(\d+): (error|warning): (.+)/g;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(text)) !== null) {
    const lineNumber = parseInt(m[1], 10);
    const severity = m[2] === 'error' ? MarkerSeverity.Error : MarkerSeverity.Warning;
    const message = m[3].trim();

    markers.push({
      severity,
      startLineNumber: lineNumber,
      startColumn: 1,
      endLineNumber: lineNumber,
      endColumn: 200,
      message,
      source: 'judge0',
    });
  }

  return markers;
}

/**
 * Parse C/C++ compilation errors.
 * Pattern: main.cpp:5:10: error: 'x' was not declared in this scope
 */
function parseCppCompileOutput(text: string): IMarkerData[] {
  if (!text) return [];

  const markers: IMarkerData[] = [];
  const regex = /[\w./\\-]+:(\d+):(\d+): (error|warning|note): (.+)/g;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(text)) !== null) {
    const lineNumber = parseInt(m[1], 10);
    const colNumber = parseInt(m[2], 10);
    const severityStr = m[3];
    const message = m[4].trim();

    const severity =
      severityStr === 'error'
        ? MarkerSeverity.Error
        : severityStr === 'warning'
        ? MarkerSeverity.Warning
        : MarkerSeverity.Info;

    markers.push({
      severity,
      startLineNumber: lineNumber,
      startColumn: colNumber,
      endLineNumber: lineNumber,
      endColumn: colNumber + 1,
      message,
      source: 'judge0',
    });
  }

  // If there are errors, skip "note" markers to reduce noise
  const hasErrors = markers.some((m) => m.severity === MarkerSeverity.Error);
  return hasErrors ? markers.filter((m) => m.severity !== MarkerSeverity.Info) : markers;
}
