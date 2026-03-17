import { PlagiarismResult, PlagiarismScanSummary } from '../types';
import { api } from './apiClient';

/**
 * Plagiarism Detection Service — thin client that delegates to the
 * server-side winnowing algorithm (POST /system/plagiarism/scan/:assessmentId).
 *
 * The old client-side Jaccard + n-gram detection has been replaced with
 * a server-side implementation using the winnowing algorithm from the
 * Stanford MOSS paper (Schleimer, Wilkerson, Aiken, 2003).
 */

export interface ScanResponse {
  message: string;
  results: PlagiarismResult[];
  summary: PlagiarismScanSummary;
}

// ── Trigger a plagiarism scan for an assessment ─────────────────────────

export const scanPlagiarism = async (
  assessmentId: string,
  sensitivity: 'low' | 'medium' | 'high' = 'medium'
): Promise<ScanResponse> => {
  const data = await api.post(`/system/plagiarism/scan/${assessmentId}`, { sensitivity });
  return data as ScanResponse;
};

// ── Fetch existing plagiarism results for an assessment ─────────────────

export const getPlagiarismResults = async (
  assessmentId: string
): Promise<PlagiarismResult[]> => {
  const data = await api.get(`/system/plagiarism/${assessmentId}`);
  return data as PlagiarismResult[];
};

// ── Review a plagiarism result ──────────────────────────────────────────

export const reviewPlagiarismResult = async (
  id: string,
  status: 'cleared' | 'confirmed'
): Promise<{ id: string; status: string; flagged: boolean; reviewedBy: string; reviewedAt: string }> => {
  const data = await api.put(`/system/plagiarism/${id}/review`, { status });
  return data as any;
};

// ── Get plagiarism statistics (computed client-side from results) ────────

export const getPlagiarismStats = (results: PlagiarismResult[]) => {
  const total = results.length;
  const flagged = results.filter(r => r.flagged).length;
  const pending = results.filter(r => r.status === 'pending').length;
  const cleared = results.filter(r => r.status === 'cleared').length;
  const confirmed = results.filter(r => r.status === 'confirmed').length;
  const avgSimilarity = total > 0
    ? results.reduce((acc, r) => acc + r.similarityScore, 0) / total
    : 0;

  return {
    total,
    flagged,
    pending,
    cleared,
    confirmed,
    avgSimilarity: Math.round(avgSimilarity * 100) / 100,
    flaggedPercentage: total > 0 ? Math.round((flagged / total) * 100) : 0,
  };
};

// ── Generate plagiarism report (Markdown) ───────────────────────────────

export const generatePlagiarismReport = (results: PlagiarismResult[]): string => {
  const stats = getPlagiarismStats(results);

  let report = `# Plagiarism Detection Report\n\n`;
  report += `Generated: ${new Date().toLocaleString()}\n`;
  report += `Algorithm: Winnowing (server-side)\n\n`;
  report += `## Summary\n\n`;
  report += `- Total Results: ${stats.total}\n`;
  report += `- Flagged: ${stats.flagged} (${stats.flaggedPercentage}%)\n`;
  report += `- Pending Review: ${stats.pending}\n`;
  report += `- Cleared: ${stats.cleared}\n`;
  report += `- Confirmed: ${stats.confirmed}\n`;
  report += `- Average Similarity: ${stats.avgSimilarity}%\n\n`;

  report += `## Flagged Submissions\n\n`;

  const flaggedResults = results.filter(r => r.flagged);

  if (flaggedResults.length === 0) {
    report += `No flagged submissions.\n`;
  } else {
    for (const result of flaggedResults) {
      report += `### ${result.studentName}\n`;
      report += `- Similarity Score: ${result.similarityScore}%\n`;
      report += `- Status: ${result.status}\n`;

      if (result.matchedSubmissions.length > 0) {
        report += `- Similar to:\n`;
        for (const match of result.matchedSubmissions.slice(0, 3)) {
          report += `  - ${match.studentName} (${match.similarity}% similar)\n`;
        }
      }
      report += `\n`;
    }
  }

  return report;
};

export default {
  scanPlagiarism,
  getPlagiarismResults,
  reviewPlagiarismResult,
  getPlagiarismStats,
  generatePlagiarismReport,
};
