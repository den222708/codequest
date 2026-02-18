import { PlagiarismResult, Submission } from '../types';

// Simulated plagiarism detection service
// In production, this would integrate with MOSS (Stanford Measure of Software Similarity)
// or similar plagiarism detection systems

interface SimilarityMatch {
  submissionId: string;
  studentId: string;
  studentName: string;
  similarity: number;
  matchedLines: { start: number; end: number }[];
}

// Tokenize code for comparison
const tokenizeCode = (code: string, language: string): string[] => {
  // Remove comments
  let cleanCode = code;
  
  switch (language) {
    case 'python':
      cleanCode = code.replace(/#.*$/gm, '').replace(/'''[\s\S]*?'''/g, '').replace(/"""[\s\S]*?"""/g, '');
      break;
    case 'javascript':
    case 'java':
    case 'cpp':
      cleanCode = code.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      break;
  }
  
  // Normalize whitespace and convert to lowercase
  cleanCode = cleanCode.toLowerCase().replace(/\s+/g, ' ').trim();
  
  // Tokenize
  const tokens = cleanCode.split(/[\s\(\)\[\]\{\};,=+\-*\/]+/).filter(t => t.length > 0);
  
  return tokens;
};

// Calculate similarity using Jaccard similarity coefficient
const calculateJaccardSimilarity = (tokens1: string[], tokens2: string[]): number => {
  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  if (union.size === 0) return 0;
  return (intersection.size / union.size) * 100;
};

// Calculate similarity using n-gram matching
const calculateNGramSimilarity = (code1: string, code2: string, n: number = 4): number => {
  const getNGrams = (str: string): Set<string> => {
    const ngrams = new Set<string>();
    const clean = str.replace(/\s+/g, ' ').toLowerCase();
    for (let i = 0; i <= clean.length - n; i++) {
      ngrams.add(clean.slice(i, i + n));
    }
    return ngrams;
  };
  
  const ngrams1 = getNGrams(code1);
  const ngrams2 = getNGrams(code2);
  
  const intersection = new Set([...ngrams1].filter(x => ngrams2.has(x)));
  const union = new Set([...ngrams1, ...ngrams2]);
  
  if (union.size === 0) return 0;
  return (intersection.size / union.size) * 100;
};

// Find matching line ranges
const findMatchingLines = (code1: string, code2: string): { start: number; end: number }[] => {
  const lines1 = code1.split('\n').map(l => l.trim().toLowerCase());
  const lines2 = code2.split('\n').map(l => l.trim().toLowerCase());
  
  const matches: { start: number; end: number }[] = [];
  let currentMatch: { start: number; end: number } | null = null;
  
  for (let i = 0; i < lines1.length; i++) {
    const line = lines1[i];
    if (line.length > 5 && lines2.includes(line)) {
      if (currentMatch && currentMatch.end === i - 1) {
        currentMatch.end = i;
      } else {
        if (currentMatch) matches.push(currentMatch);
        currentMatch = { start: i, end: i };
      }
    } else {
      if (currentMatch) {
        matches.push(currentMatch);
        currentMatch = null;
      }
    }
  }
  
  if (currentMatch) matches.push(currentMatch);
  
  // Filter out single-line matches that might be common patterns
  return matches.filter(m => m.end - m.start >= 2);
};

// Check submission against other submissions
export const checkPlagiarism = async (
  submission: Submission,
  allSubmissions: Submission[],
  studentNames: Record<string, string>,
  sensitivity: 'low' | 'medium' | 'high' = 'medium'
): Promise<PlagiarismResult> => {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
  
  const thresholds = {
    low: 70,
    medium: 50,
    high: 30,
  };
  
  const threshold = thresholds[sensitivity];
  const matchedSubmissions: SimilarityMatch[] = [];
  let maxSimilarity = 0;
  
  // Compare against all other submissions for the same question
  const relevantSubmissions = allSubmissions.filter(
    s => s.questionId === submission.questionId && 
         s.studentId !== submission.studentId &&
         s.id !== submission.id
  );
  
  for (const otherSubmission of relevantSubmissions) {
    // Calculate multiple similarity metrics
    const tokens1 = tokenizeCode(submission.code, submission.language);
    const tokens2 = tokenizeCode(otherSubmission.code, otherSubmission.language);
    
    const jaccardSim = calculateJaccardSimilarity(tokens1, tokens2);
    const ngramSim = calculateNGramSimilarity(submission.code, otherSubmission.code);
    
    // Weighted average of similarity metrics
    const similarity = (jaccardSim * 0.4 + ngramSim * 0.6);
    
    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
    }
    
    if (similarity >= threshold) {
      const matchedLines = findMatchingLines(submission.code, otherSubmission.code);
      
      matchedSubmissions.push({
        submissionId: otherSubmission.id,
        studentId: otherSubmission.studentId,
        studentName: studentNames[otherSubmission.studentId] || 'Unknown Student',
        similarity: Math.round(similarity * 100) / 100,
        matchedLines,
      });
    }
  }
  
  // Sort by similarity descending
  matchedSubmissions.sort((a, b) => b.similarity - a.similarity);
  
  // Determine if flagged based on sensitivity
  const flagThreshold = {
    low: 80,
    medium: 60,
    high: 40,
  };
  
  const flagged = maxSimilarity >= flagThreshold[sensitivity];
  
  return {
    id: `plag-${Date.now()}`,
    submissionId: submission.id,
    studentId: submission.studentId,
    studentName: studentNames[submission.studentId] || 'Unknown Student',
    similarityScore: Math.round(maxSimilarity * 100) / 100,
    matchedSubmissions,
    flagged,
    status: 'pending',
  };
};

// Batch check plagiarism for all submissions in an assessment
export const batchCheckPlagiarism = async (
  submissions: Submission[],
  studentNames: Record<string, string>,
  sensitivity: 'low' | 'medium' | 'high' = 'medium',
  onProgress?: (current: number, total: number) => void
): Promise<PlagiarismResult[]> => {
  const results: PlagiarismResult[] = [];
  const total = submissions.length;
  
  for (let i = 0; i < submissions.length; i++) {
    const result = await checkPlagiarism(
      submissions[i],
      submissions,
      studentNames,
      sensitivity
    );
    results.push(result);
    
    if (onProgress) {
      onProgress(i + 1, total);
    }
  }
  
  return results;
};

// Review plagiarism result
export const reviewPlagiarismResult = (
  result: PlagiarismResult,
  reviewerId: string,
  status: 'cleared' | 'confirmed'
): PlagiarismResult => {
  return {
    ...result,
    reviewedBy: reviewerId,
    reviewedAt: new Date().toISOString(),
    status,
    flagged: status === 'confirmed',
  };
};

// Get plagiarism statistics for an assessment
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

// Generate plagiarism report
export const generatePlagiarismReport = (results: PlagiarismResult[]): string => {
  const stats = getPlagiarismStats(results);
  
  let report = `# Plagiarism Detection Report\n\n`;
  report += `Generated: ${new Date().toLocaleString()}\n\n`;
  report += `## Summary\n\n`;
  report += `- Total Submissions: ${stats.total}\n`;
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
  checkPlagiarism,
  batchCheckPlagiarism,
  reviewPlagiarismResult,
  getPlagiarismStats,
  generatePlagiarismReport,
};
