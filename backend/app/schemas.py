from pydantic import BaseModel, Field, ConfigDict, model_validator
from typing import List, Literal, Optional, Dict, Any
from datetime import datetime

# Word-level diff segment schema
class DiffSegment(BaseModel):
    type: Literal["unchanged", "removed", "added"]
    text: str

# Single Clause Risk Analysis Schema (matches required LLM shape)
class ClauseAnalysis(BaseModel):
    clause_id: Optional[str] = Field(default=None, description="Unique identifier for the clause")
    original_text: Optional[str] = Field(default=None, description="Original clause text")
    amended_text: Optional[str] = Field(default=None, description="Amended clause text")
    diff_segments: List[DiffSegment] = Field(default_factory=list, description="Structured word-level diff segments")
    name: str = Field(description="Name or category of the clause e.g. Indemnity, Liability Cap")
    risk: Literal["High", "Medium", "Low"] = Field(description="Assigned risk level: High, Medium, or Low")
    reason: str = Field(description="Detailed explanation of why this clause is risky")
    suggestion: str = Field(description="Safer, reworded text suggestion for the clause")
    original: str = Field(description="Exact original clause text extracted from document")
    line_number: Optional[int] = Field(default=None, description="Line number of clause in source document")
    topic: Optional[str] = Field(default=None, description="Topic section or category of the clause")

    @model_validator(mode="after")
    def populate_defaults(self) -> "ClauseAnalysis":
        if not self.original_text:
            self.original_text = self.original
        if not self.amended_text:
            self.amended_text = self.suggestion
        return self




# Full Contract Analysis Report Schema (matches required LLM shape)
class ContractReport(BaseModel):
    summary: str = Field(description="Executive summary of the contract risk profile")
    overallRisk: Literal["High", "Medium", "Low"] = Field(description="Overall contract risk level: High, Medium, or Low")
    clauses: List[ClauseAnalysis] = Field(default_factory=list, description="List of analyzed clauses")

# API Response Schema returned by /analyze and /reports/{id}
class AnalysisResponse(BaseModel):
    id: int
    contract_id: int
    filename: str
    upload_date: datetime
    summary: str
    overallRisk: Literal["High", "Medium", "Low"]
    clauses: List[ClauseAnalysis]
    payment_txid: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# Brief summary schema for History Page
class HistoryItemResponse(BaseModel):
    id: int  # report_id
    contract_id: int
    filename: str
    upload_date: datetime
    overallRisk: str
    summary: str
    clause_count: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    payment_txid: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# x402 Protocol Challenge Requirements Schema
class X402Requirements(BaseModel):
    amount: float
    asset: str
    pay_to: str
    reference_id: str
    instructions: Optional[str] = None

class X402ChallengeResponse(BaseModel):
    error: str = "Payment Required"
    message: str
    x402: X402Requirements

# Transaction record schema
class TransactionResponse(BaseModel):
    id: int
    contract_id: Optional[int]
    wallet: str
    amount: float
    algorand_txid: str
    payment_status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UpdateClausesRequest(BaseModel):
    clauses: List[ClauseAnalysis]


class ScoreBreakdown(BaseModel):
    low: int = 0
    medium: int = 0
    high: int = 0


class RecalculateScoreRequest(BaseModel):
    clauses: List[Dict[str, Any]]


class RecalculateScoreResponse(BaseModel):
    score: float
    breakdown: ScoreBreakdown

