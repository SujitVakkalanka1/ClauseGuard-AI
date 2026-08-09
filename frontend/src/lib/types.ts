export type RiskLevel = 'High' | 'Medium' | 'Low';

export interface DiffSegment {
  type: 'unchanged' | 'removed' | 'added';
  text: string;
}

export interface ClauseAnalysis {
  clause_id?: string;
  original_text?: string;
  amended_text?: string;
  diff_segments?: DiffSegment[];
  name: string;
  risk: RiskLevel;
  reason: string;
  suggestion: string;
  original: string;
  line_number?: number;
  topic?: string;
}


export interface AnalysisResponse {
  id: number;
  contract_id: number;
  filename: string;
  upload_date: string;
  summary: string;
  overallRisk: RiskLevel;
  clauses: ClauseAnalysis[];
  payment_txid?: string;
}

export interface HistoryItemResponse {
  id: number;
  contract_id: number;
  filename: string;
  upload_date: string;
  overallRisk: RiskLevel;
  summary: string;
  clause_count: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  payment_txid?: string;
}

export interface X402Requirements {
  amount: number;
  asset: string;
  pay_to: string;
  reference_id: string;
  instructions?: string;
}
