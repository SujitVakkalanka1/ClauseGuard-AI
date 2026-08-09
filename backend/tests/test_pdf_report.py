import os
import pytest
from app.services.pdf_report import generate_summary_pdf

def test_generate_summary_pdf_creates_file(tmp_path):
    pdf_path = generate_summary_pdf(
        contract_name="Test_Master_Agreement.pdf",
        overall_score=2.33,
        breakdown={"high": 2, "medium": 1, "low": 1},
        tx_id="tx_algorand_testnet_receipt_777"
    )

    assert os.path.exists(pdf_path)
    assert os.path.isfile(pdf_path)
    assert os.path.getsize(pdf_path) > 1000
