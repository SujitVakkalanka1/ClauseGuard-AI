import { AnalysisResponse, HistoryItemResponse, X402Requirements } from './types';

const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const cleanUrl = rawUrl.replace(/\/$/, '');
const API_BASE_URL = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;

export class X402PaymentError extends Error {
  x402: X402Requirements;

  constructor(message: string, x402: X402Requirements) {
    super(message);
    this.name = 'X402PaymentError';
    this.x402 = x402;
  }
}

export async function payChallenge(referenceId: string): Promise<{ txid: string; status: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/pay-challenge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reference_id: referenceId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to submit payment transaction to Algorand TestNet.');
    }

    return response.json();
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message?.toLowerCase().includes('fetch')) {
      throw new Error(
        `Failed to reach backend API at ${API_BASE_URL}. Please verify your backend server is online and NEXT_PUBLIC_API_URL is set in Vercel.`
      );
    }
    throw err;
  }
}

export async function analyzeContract(file: File, paymentProofTxId?: string): Promise<AnalysisResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const headers: Record<string, string> = {};
  if (paymentProofTxId) {
    headers['X-Payment-Proof'] = paymentProofTxId;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers,
      body: formData,
    });
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message?.toLowerCase().includes('fetch')) {
      throw new Error(
        `Failed to reach backend API at ${API_BASE_URL}. Please verify your backend server is online and NEXT_PUBLIC_API_URL is set in Vercel.`
      );
    }
    throw err;
  }

  if (response.status === 402) {
    const errorData = await response.json().catch(() => ({}));
    const detail = errorData.detail || {};
    const x402Reqs: X402Requirements = detail.x402 || {
      amount: 0.001,
      asset: 'ALGO',
      pay_to: 'ULDGSMHBVIIXNZO3W4H6GTHSYPCAFQ6SV5CWZGONABA22RLBLTI4LBFWAQ',
      reference_id: 'req_default',
    };
    throw new X402PaymentError(detail.message || 'Payment Required', x402Reqs);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Server error: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchHistory(): Promise<HistoryItemResponse[]> {
  const response = await fetch(`${API_BASE_URL}/reports`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch history');
  }

  return response.json();
}

export async function fetchReportDetails(id: string | number): Promise<AnalysisResponse> {
  const response = await fetch(`${API_BASE_URL}/reports/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Report #${id} not found`);
  }

  return response.json();
}

export async function updateReportClauses(
  id: string | number,
  clauses: any[]
): Promise<AnalysisResponse> {
  const response = await fetch(`${API_BASE_URL}/reports/${id}/clauses`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ clauses }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to update report clauses');
  }

  return response.json();
}

