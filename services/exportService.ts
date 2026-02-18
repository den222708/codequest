import { Assessment, Submission, User, AnalyticsData, PlagiarismResult } from '../types';

// Export service for generating PDF, CSV, and Excel exports

// CSV generation utility
const generateCSV = (headers: string[], rows: string[][]): string => {
  const escapeCell = (cell: string): string => {
    if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
      return `"${cell.replace(/"/g, '""')}"`;
    }
    return cell;
  };
  
  const headerRow = headers.map(escapeCell).join(',');
  const dataRows = rows.map(row => row.map(escapeCell).join(',')).join('\n');
  
  return `${headerRow}\n${dataRows}`;
};

// Download file utility
const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Export assessment results to CSV
export const exportAssessmentResultsCSV = (
  assessment: Assessment,
  submissions: Submission[],
  users: User[]
) => {
  const headers = [
    'Student Name',
    'Email',
    'Question',
    'Score',
    'Max Score',
    'Percentage',
    'Status',
    'Execution Time (ms)',
    'Memory Used (MB)',
    'Submitted At',
  ];
  
  const getUserById = (id: string) => users.find(u => u.id === id);
  const getQuestionById = (id: string) => assessment.questions.find(q => q.id === id);
  
  const rows = submissions.map(sub => {
    const user = getUserById(sub.studentId);
    const question = getQuestionById(sub.questionId);
    const percentage = ((sub.score / sub.maxScore) * 100).toFixed(1);
    
    return [
      user?.name || 'Unknown',
      user?.email || 'Unknown',
      question?.title || 'Unknown',
      sub.score.toString(),
      sub.maxScore.toString(),
      `${percentage}%`,
      sub.status,
      sub.executionTime.toFixed(2),
      sub.memoryUsed.toFixed(2),
      new Date(sub.submittedAt).toLocaleString(),
    ];
  });
  
  const csv = generateCSV(headers, rows);
  const filename = `${assessment.title.replace(/\s+/g, '_')}_results_${new Date().toISOString().split('T')[0]}.csv`;
  downloadFile(csv, filename, 'text/csv');
};

// Export user list to CSV
export const exportUsersCSV = (users: User[]) => {
  const headers = [
    'Name',
    'Email',
    'Role',
    'Department',
    'Status',
    'Created At',
    'Last Login',
  ];
  
  const rows = users.map(user => [
    user.name,
    user.email,
    user.role || 'Unknown',
    user.department || '-',
    user.status,
    new Date(user.createdAt).toLocaleString(),
    user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never',
  ]);
  
  const csv = generateCSV(headers, rows);
  const filename = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
  downloadFile(csv, filename, 'text/csv');
};

// Export analytics data to CSV
export const exportAnalyticsCSV = (analytics: AnalyticsData) => {
  // Performance trend
  const trendHeaders = ['Date', 'Average Score'];
  const trendRows = analytics.performanceTrend.map(item => [
    item.date,
    item.score.toString(),
  ]);
  
  // Department stats
  const deptHeaders = ['Department', 'Students', 'Average Score'];
  const deptRows = analytics.departmentStats.map(item => [
    item.department,
    item.students.toString(),
    item.avgScore.toString(),
  ]);
  
  // Top performers
  const perfHeaders = ['Rank', 'Name', 'Score'];
  const perfRows = analytics.topPerformers.map(item => [
    item.rank.toString(),
    item.name,
    item.score.toString(),
  ]);
  
  // Combine all data
  let content = `# Analytics Export - ${new Date().toISOString().split('T')[0]}\n\n`;
  content += `## Summary\n`;
  content += `Total Students: ${analytics.totalStudents}\n`;
  content += `Total Professors: ${analytics.totalProfessors}\n`;
  content += `Total Assessments: ${analytics.totalAssessments}\n`;
  content += `Average Pass Rate: ${analytics.averagePassRate}%\n`;
  content += `Active Users: ${analytics.activeUsers}\n`;
  content += `Submissions Today: ${analytics.submissionsToday}\n\n`;
  
  content += `## Performance Trend\n`;
  content += generateCSV(trendHeaders, trendRows);
  content += `\n\n## Department Statistics\n`;
  content += generateCSV(deptHeaders, deptRows);
  content += `\n\n## Top Performers\n`;
  content += generateCSV(perfHeaders, perfRows);
  
  const filename = `analytics_export_${new Date().toISOString().split('T')[0]}.csv`;
  downloadFile(content, filename, 'text/csv');
};

// Export plagiarism report to CSV
export const exportPlagiarismReportCSV = (results: PlagiarismResult[]) => {
  const headers = [
    'Student Name',
    'Similarity Score',
    'Status',
    'Flagged',
    'Matched Students',
    'Reviewed By',
    'Reviewed At',
  ];
  
  const rows = results.map(result => [
    result.studentName,
    `${result.similarityScore}%`,
    result.status,
    result.flagged ? 'Yes' : 'No',
    result.matchedSubmissions.map(m => `${m.studentName} (${m.similarity}%)`).join('; ') || 'None',
    result.reviewedBy || '-',
    result.reviewedAt ? new Date(result.reviewedAt).toLocaleString() : '-',
  ]);
  
  const csv = generateCSV(headers, rows);
  const filename = `plagiarism_report_${new Date().toISOString().split('T')[0]}.csv`;
  downloadFile(csv, filename, 'text/csv');
};

// Generate PDF-style HTML for printing
export const generatePrintableReport = (
  title: string,
  content: string,
  metadata?: Record<string, string>
): string => {
  const metaHtml = metadata
    ? Object.entries(metadata)
        .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
        .join('')
    : '';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 { color: #208090; border-bottom: 2px solid #208090; padding-bottom: 10px; }
    h2 { color: #1a6873; margin-top: 30px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #f5f5f5; font-weight: 600; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .metadata { background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    .metadata p { margin: 5px 0; }
    .passed { color: #22c55e; }
    .failed { color: #c01530; }
    .warning { color: #a84b2f; }
    .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${metaHtml ? `<div class="metadata">${metaHtml}</div>` : ''}
  ${content}
  <div class="footer">
    <p>Generated by CodeQuest on ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>`;
};

// Export assessment results as printable PDF-style HTML
export const exportAssessmentResultsPDF = (
  assessment: Assessment,
  submissions: Submission[],
  users: User[]
) => {
  const getUserById = (id: string) => users.find(u => u.id === id);
  const getQuestionById = (id: string) => assessment.questions.find(q => q.id === id);
  
  // Group submissions by student
  const byStudent = new Map<string, Submission[]>();
  submissions.forEach(sub => {
    if (!byStudent.has(sub.studentId)) {
      byStudent.set(sub.studentId, []);
    }
    byStudent.get(sub.studentId)!.push(sub);
  });
  
  // Generate table rows
  let tableContent = `
    <table>
      <thead>
        <tr>
          <th>Student</th>
          <th>Question</th>
          <th>Score</th>
          <th>Status</th>
          <th>Time</th>
          <th>Submitted</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  submissions.forEach(sub => {
    const user = getUserById(sub.studentId);
    const question = getQuestionById(sub.questionId);
    const percentage = ((sub.score / sub.maxScore) * 100).toFixed(0);
    const statusClass = sub.status === 'passed' ? 'passed' : sub.status === 'failed' ? 'failed' : 'warning';
    
    tableContent += `
      <tr>
        <td>${user?.name || 'Unknown'}</td>
        <td>${question?.title || 'Unknown'}</td>
        <td>${sub.score}/${sub.maxScore} (${percentage}%)</td>
        <td class="${statusClass}">${sub.status.toUpperCase()}</td>
        <td>${sub.executionTime.toFixed(0)}ms</td>
        <td>${new Date(sub.submittedAt).toLocaleDateString()}</td>
      </tr>
    `;
  });
  
  tableContent += `</tbody></table>`;
  
  // Calculate stats
  const totalSubmissions = submissions.length;
  const passedSubmissions = submissions.filter(s => s.status === 'passed').length;
  const avgScore = totalSubmissions > 0
    ? submissions.reduce((acc, s) => acc + (s.score / s.maxScore) * 100, 0) / totalSubmissions
    : 0;
  
  const statsContent = `
    <h2>Statistics</h2>
    <ul>
      <li><strong>Total Submissions:</strong> ${totalSubmissions}</li>
      <li><strong>Passed:</strong> ${passedSubmissions} (${((passedSubmissions / totalSubmissions) * 100).toFixed(1)}%)</li>
      <li><strong>Average Score:</strong> ${avgScore.toFixed(1)}%</li>
      <li><strong>Unique Students:</strong> ${byStudent.size}</li>
    </ul>
  `;
  
  const html = generatePrintableReport(
    `Assessment Results: ${assessment.title}`,
    statsContent + tableContent,
    {
      'Assessment': assessment.title,
      'Type': assessment.type,
      'Duration': `${assessment.duration} minutes`,
      'Passing Score': `${assessment.passingScore}%`,
      'Total Points': assessment.totalPoints.toString(),
    }
  );
  
  // Open in new window for printing
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
};

// Export student results as printable certificate/report
export const exportStudentResultPDF = (
  studentName: string,
  assessment: Assessment,
  submissions: Submission[]
) => {
  const totalScore = submissions.reduce((acc, s) => acc + s.score, 0);
  const maxScore = submissions.reduce((acc, s) => acc + s.maxScore, 0);
  const percentage = maxScore > 0 ? ((totalScore / maxScore) * 100).toFixed(1) : '0';
  const passed = parseFloat(percentage) >= assessment.passingScore;
  
  let content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h2 style="color: ${passed ? '#22c55e' : '#c01530'};">
        ${passed ? '✓ PASSED' : '✗ NOT PASSED'}
      </h2>
      <p style="font-size: 24px; margin: 20px 0;">
        <strong>Final Score: ${totalScore}/${maxScore} (${percentage}%)</strong>
      </p>
      <p>Passing Score Required: ${assessment.passingScore}%</p>
    </div>
    
    <h2>Question-wise Results</h2>
    <table>
      <thead>
        <tr>
          <th>Question</th>
          <th>Score</th>
          <th>Tests Passed</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  submissions.forEach(sub => {
    const question = assessment.questions.find(q => q.id === sub.questionId);
    const testsPassed = sub.testResults.filter(t => t.passed).length;
    const totalTests = sub.testResults.length;
    const statusClass = sub.status === 'passed' ? 'passed' : sub.status === 'failed' ? 'failed' : 'warning';
    
    content += `
      <tr>
        <td>${question?.title || 'Unknown'}</td>
        <td>${sub.score}/${sub.maxScore}</td>
        <td>${testsPassed}/${totalTests}</td>
        <td class="${statusClass}">${sub.status.toUpperCase()}</td>
      </tr>
    `;
  });
  
  content += `</tbody></table>`;
  
  const html = generatePrintableReport(
    `Assessment Report: ${studentName}`,
    content,
    {
      'Student': studentName,
      'Assessment': assessment.title,
      'Course': assessment.courseName || '-',
      'Professor': assessment.professorName || '-',
      'Submitted': new Date().toLocaleDateString(),
    }
  );
  
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
};

// Export system logs to JSON
export const exportLogsJSON = (logs: any[]) => {
  const json = JSON.stringify(logs, null, 2);
  const filename = `system_logs_${new Date().toISOString().split('T')[0]}.json`;
  downloadFile(json, filename, 'application/json');
};

// Export any data to JSON
export const exportToJSON = (data: any, filename: string) => {
  const json = JSON.stringify(data, null, 2);
  downloadFile(json, `${filename}.json`, 'application/json');
};

export default {
  exportAssessmentResultsCSV,
  exportUsersCSV,
  exportAnalyticsCSV,
  exportPlagiarismReportCSV,
  exportAssessmentResultsPDF,
  exportStudentResultPDF,
  exportLogsJSON,
  exportToJSON,
};
