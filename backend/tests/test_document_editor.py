import os
import pytest
import docx
from app.services.document_editor import generate_edited_docx
from app.schemas import ClauseAnalysis

def test_generate_edited_docx_clean_format(tmp_path):
    clauses = [
        ClauseAnalysis(
            name="Indemnity",
            risk="High",
            reason="Unilateral obligation",
            suggestion="Each party shall be responsible for its own actions.",
            original="Client agrees to hold Provider harmless against all losses."
        ),
        ClauseAnalysis(
            name="Limitation of Liability",
            risk="High",
            reason="Zero cap",
            suggestion="Liability is capped at the total amount paid in 12 months.",
            original="Provider shall not be liable for any damages whatsoever."
        )
    ]

    file_path = generate_edited_docx(
        filename="Test_Agreement.docx",
        summary="High risk profile.",
        overall_risk="High",
        clauses=clauses,
        payment_txid="STUB_TXID"
    )

    assert os.path.exists(file_path)
    
    # Read the docx document to verify contents
    doc = docx.Document(file_path)
    full_text = "\n".join([p.text for p in doc.paragraphs])

    # 1. Assert reworded suggestion text IS present directly in the document
    assert "Each party shall be responsible for its own actions." in full_text
    assert "Liability is capped at the total amount paid in 12 months." in full_text

    # 2. Assert removed metadata/headers/explanations ARE NOT present in the clean document
    assert "Audit Verification:" not in full_text
    assert "On-Chain Proof TxID:" not in full_text
    assert "Revision Status:" not in full_text
    assert "WHY THIS IS CONSIDERED A RISK" not in full_text
    assert "ALTERNATIVE WAY TO OVERCOME" not in full_text
    assert "Superseded Original Contract Text" not in full_text
