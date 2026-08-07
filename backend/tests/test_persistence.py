import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.schemas import ContractReport, ClauseAnalysis
from app.services.persistence import save_contract_analysis, get_report_by_id, get_all_reports_history

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()

def test_save_and_retrieve_analysis(db_session):
    report_data = ContractReport(
        summary="High risk contract detected due to broad indemnity terms.",
        overallRisk="High",
        clauses=[
            ClauseAnalysis(
                name="Indemnity",
                risk="High",
                reason="Unilateral indemnification",
                suggestion="Mutual indemnification",
                original="Client shall indemnify Provider."
            )
        ]
    )

    db_report = save_contract_analysis(db_session, "sample_contract.pdf", report_data)
    assert db_report.id is not None
    assert db_report.contract_id is not None
    assert db_report.overall_risk == "High"

    fetched = get_report_by_id(db_session, db_report.id)
    assert fetched is not None
    assert fetched.contract.filename == "sample_contract.pdf"
    assert len(fetched.clauses) == 1
    assert fetched.clauses[0].clause_name == "Indemnity"

    history = get_all_reports_history(db_session)
    assert len(history) == 1
    assert history[0].high_risk_count == 1
