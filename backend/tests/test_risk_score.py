import pytest
from app.services.ai_analyzer import calculate_overall_risk

def test_calculate_overall_risk_weights_and_status():
    clauses = [
        {"risk_level": "high", "status": "original"},       # weight 3
        {"risk_level": "medium", "status": "accepted"},     # weight 2
        {"risk_level": "high", "status": "rejected"},       # excluded!
        {"risk_level": "low", "status": "accepted"},        # weight 1
    ]
    
    res = calculate_overall_risk(clauses)
    
    # Total points = 3 + 2 + 1 = 6. Total counted = 3. Score = 6 / 3 = 2.0
    assert res["score"] == 2.0
    assert res["breakdown"]["high"] == 1
    assert res["breakdown"]["medium"] == 1
    assert res["breakdown"]["low"] == 1

def test_calculate_overall_risk_empty_list():
    res = calculate_overall_risk([])
    assert res["score"] == 0.0
    assert res["breakdown"] == {"low": 0, "medium": 0, "high": 0}

def test_calculate_overall_risk_all_rejected():
    clauses = [
        {"risk": "High", "status": "rejected"},
        {"risk": "Medium", "status": "rejected"}
    ]
    res = calculate_overall_risk(clauses)
    assert res["score"] == 0.0
    assert res["breakdown"] == {"low": 0, "medium": 0, "high": 0}
