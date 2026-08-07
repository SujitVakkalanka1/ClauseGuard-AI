import { AnalysisResponse } from './types';

/**
 * Triggers a real backend download of the edited Microsoft Word (.docx) document
 * with all original high & medium risk clauses replaced by safer reworded alternatives.
 */
export function downloadEditedContractDocx(reportId: string | number, filename: string) {
  const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const cleanUrl = rawUrl.replace(/\/$/, '');
  const baseUrl = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  const downloadUrl = `${baseUrl}/reports/${reportId}/download-edited`;
  
  const link = document.createElement('a');
  link.href = downloadUrl;
  const baseName = filename.replace(/\.[^/.]+$/, '');
  link.download = `${baseName}_REVISED_SAFE.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates and downloads a complete Executive Risk Audit Report (.txt).
 */
export function downloadExecutiveAuditReport(report: AnalysisResponse) {
  const dateStr = new Date(report.upload_date || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let reportText = `================================================================================
CLAUSEGUARD AI - EXECUTIVE LEGAL RISK AUDIT REPORT
================================================================================
Target Document: ${report.filename}
Audit Timestamp: ${dateStr}
Overall Risk Level: ${report.overallRisk.toUpperCase()}
On-Chain Proof TxID: ${report.payment_txid || 'N/A'}
Protocol: Algorand TestNet x402 Micropayment Gate
================================================================================

1. EXECUTIVE RISK SUMMARY
--------------------------------------------------------------------------------
${report.summary}

2. DETAILED CLAUSE RISK BREAKDOWN & SAFE ALTERNATIVES
--------------------------------------------------------------------------------
`;

  report.clauses.forEach((clause, idx) => {
    reportText += `
[ITEM #${idx + 1}] ${clause.name.toUpperCase()}
• RISK ASSESSED: ${clause.risk.toUpperCase()} RISK
• WHY THIS IS CONSIDERED A RISK:
  ${clause.reason}

• ALTERNATIVE WAY TO OVERCOME:
  "${clause.suggestion}"

• ORIGINAL CONTRACT TEXT:
  "${clause.original}"
--------------------------------------------------------------------------------`;
  });

  reportText += `\n
================================================================================
CONFIDENTIAL LEGAL AUDIT REPORT - CLAUSEGUARD AI
================================================================================`;

  const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const baseName = report.filename.replace(/\.[^/.]+$/, '');
  link.download = `${baseName}_LEGAL_AUDIT_REPORT.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
