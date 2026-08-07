import pytest
from app.services.ai_analyzer import analyze_contract_text
from app.schemas import ContractReport

def test_ai_analyzer_heuristic_output():
    contract_text = """
    MASTER SERVICES AGREEMENT
    
    1. INDEMNIFICATION
    Client shall fully indemnify, defend, and hold harmless Service Provider against any and all liabilities, losses, damages, legal costs, or claims arising out of this agreement.
    
    2. LIMITATION OF LIABILITY
    In no event shall Service Provider be liable for any indirect, incidental, or consequential damages. Total aggregate liability shall not exceed $50.
    
    3. AUTOMATIC RENEWAL
    This Agreement shall automatically renew for additional 1-year terms unless Client provides written notice 90 days prior to expiration.
    """

    report = analyze_contract_text(contract_text)
    
    assert isinstance(report, ContractReport)
    assert report.overallRisk in ["High", "Medium", "Low"]
    assert len(report.clauses) > 0

    for clause in report.clauses:
        assert clause.risk in ["High", "Medium", "Low"]
        assert len(clause.name) > 0
        assert len(clause.reason) > 0
        assert len(clause.suggestion) > 0
        assert len(clause.original) > 0

def test_ai_analyzer_too_short_text():
    with pytest.raises(ValueError, match="too short"):
        analyze_contract_text("Short text")

def test_ai_analyzer_academic_document():
    academic_text = """
    DSA3 Project Abstract
    Title: Distributed Systems and Algorithmic Complexity Analysis
    Author: University Research Group
    This project explores graph partitioning techniques for large-scale data structures.
    """
    report = analyze_contract_text(academic_text)
    assert report.overallRisk == "Low"
    assert len(report.clauses) == 0
    assert "academic" in report.summary.lower() or "non-contract" in report.summary.lower()

