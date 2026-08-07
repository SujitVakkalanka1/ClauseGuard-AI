import os
import pytest
import fitz
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app.services.payment_verifier import verify_transaction_proof

TEST_DB_URL = "sqlite:///./test_x402.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists("./test_x402.db"):
        try:
            os.remove("./test_x402.db")
        except PermissionError:
            pass

def create_sample_pdf_bytes():
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 50), "SECTION 1. INDEMNIFICATION\nClient agrees to indemnify Provider.")
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes

def test_payment_verifier_stub():
    assert verify_transaction_proof("tx_stub_12345") is True
    assert verify_transaction_proof("") is False
    assert verify_transaction_proof("   ") is False
    assert verify_transaction_proof("a") is False

def test_analyze_without_payment_header_returns_402():
    pdf_bytes = create_sample_pdf_bytes()
    response = client.post(
        "/api/analyze",
        files={"file": ("contract.pdf", pdf_bytes, "application/pdf")}
    )
    assert response.status_code == 402
    data = response.json()
    assert "detail" in data
    detail = data["detail"]
    assert detail["error"] == "Payment Required"
    assert "x402" in detail
    x402 = detail["x402"]
    assert x402["amount"] == 0.001
    assert x402["asset"] == "ALGO"
    assert x402["pay_to"] == "ALGO_DEMO_RECIPIENT_ADDRESS_PHASE2_STUB"
    assert x402["reference_id"].startswith("req_")

def test_analyze_with_valid_payment_header_succeeds():
    pdf_bytes = create_sample_pdf_bytes()
    headers = {"X-Payment-Proof": "tx_stub_demo_88888"}
    
    response = client.post(
        "/api/analyze",
        files={"file": ("contract.pdf", pdf_bytes, "application/pdf")},
        headers=headers
    )
    assert response.status_code == 201
    res_data = response.json()
    assert res_data["filename"] == "contract.pdf"
    assert res_data["payment_txid"] == "tx_stub_demo_88888"
    assert res_data["overallRisk"] in ["High", "Medium", "Low"]

    # Verify history includes transaction info
    history_res = client.get("/api/reports")
    assert history_res.status_code == 200
    history = history_res.json()
    assert len(history) == 1
    assert history[0]["payment_txid"] == "tx_stub_demo_88888"
