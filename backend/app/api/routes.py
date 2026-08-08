import os
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Body
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db
from app.schemas import AnalysisResponse, HistoryItemResponse, ClauseAnalysis, UpdateClausesRequest
from app.services.extraction import extract_text_from_file
from app.services.ai_analyzer import analyze_contract_text
from app.services.persistence import save_contract_analysis, get_report_by_id, get_all_reports_history, update_report_clauses
from app.services.x402_gate import require_x402_payment
from app.services.algorand_payment import submit_algorand_payment
from app.services.document_editor import generate_edited_docx

router = APIRouter()

@router.post("/pay-challenge", status_code=status.HTTP_200_OK)
def process_challenge_payment(payload: Dict[str, Any] = Body(...)):
    """
    Programmatically executes an Algorand TestNet payment for an x402 challenge.
    Uses the backend-held funded account to sign and submit the payment on-chain,
    attaching the reference_id in the transaction 'note' field.
    
    SECURITY: Private key is kept ONLY in backend environment (.env).
    """
    reference_id = payload.get("reference_id")
    if not reference_id or not isinstance(reference_id, str):
        raise HTTPException(status_code=400, detail="Field 'reference_id' is required.")

    try:
        tx_result = submit_algorand_payment(reference_id)
        return {
            "status": "CONFIRMED",
            "message": "Payment confirmed on Algorand TestNet",
            "txid": tx_result["txid"],
            "amount": tx_result["amount"],
            "reference_id": reference_id
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Algorand payment submission failed: {str(e)}")


@router.post("/analyze", response_model=AnalysisResponse, status_code=status.HTTP_201_CREATED)
async def analyze_contract(
    file: UploadFile = File(...),
    payment_info: dict = Depends(require_x402_payment),
    db: Session = Depends(get_db)
):
    """
    Main endpoint for contract analysis protected by the x402 payment gate.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Uploaded file must have a valid filename.")

    try:
        contents = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read uploaded file: {str(e)}")

    # 2. Text extraction
    try:
        extracted_text = extract_text_from_file(contents, file.filename)
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text extraction error: {str(e)}")

    # 3. AI Risk Analysis
    try:
        report_data = analyze_contract_text(extracted_text)
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI clause analysis failed: {str(e)}")

    # 4. Persistence (saves contract, report, clauses, and transaction)
    try:
        db_report = save_contract_analysis(db, file.filename, report_data, payment_info)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to persist report to database: {str(e)}")

    # 5. Format and return response
    clauses_response = [
        ClauseAnalysis(
            name=c.clause_name,
            risk=c.risk,
            reason=c.explanation,
            suggestion=c.recommendation,
            original=c.original_text
        )
        for c in db_report.clauses
    ]

    payment_txid = payment_info.get("txid") if payment_info else None

    return AnalysisResponse(
        id=db_report.id,
        contract_id=db_report.contract_id,
        filename=db_report.contract.filename,
        upload_date=db_report.contract.upload_date,
        summary=db_report.summary,
        overallRisk=db_report.overall_risk,
        clauses=clauses_response,
        payment_txid=payment_txid
    )


@router.get("/reports", response_model=List[HistoryItemResponse])
def list_reports_history(db: Session = Depends(get_db)):
    """Returns a list of all historical contract risk analyses."""
    return get_all_reports_history(db)


@router.get("/reports/{report_id}", response_model=AnalysisResponse)
def get_report_details(report_id: int, db: Session = Depends(get_db)):
    """Retrieves full details for a specific analysis report by ID."""
    db_report = get_report_by_id(db, report_id)
    if not db_report:
        raise HTTPException(status_code=404, detail=f"Report with ID {report_id} not found.")

    clauses_response = [
        ClauseAnalysis(
            name=c.clause_name,
            risk=c.risk,
            reason=c.explanation,
            suggestion=c.recommendation,
            original=c.original_text
        )
        for c in db_report.clauses
    ]

    payment_txid = None
    if db_report.contract and db_report.contract.transactions:
        payment_txid = db_report.contract.transactions[0].algorand_txid

    return AnalysisResponse(
        id=db_report.id,
        contract_id=db_report.contract_id,
        filename=db_report.contract.filename if db_report.contract else "Contract",
        upload_date=db_report.contract.upload_date if db_report.contract else db_report.contract_id,
        summary=db_report.summary,
        overallRisk=db_report.overall_risk,
        clauses=clauses_response,
        payment_txid=payment_txid
    )


@router.get("/reports/{report_id}/download-edited")
def download_edited_contract_docx(report_id: int, db: Session = Depends(get_db)):
    """
    Generates and downloads a real Microsoft Word (.docx) document where all
    original high & medium risk clauses have been replaced with safer reworded alternatives.
    """
    db_report = get_report_by_id(db, report_id)
    if not db_report:
        raise HTTPException(status_code=404, detail=f"Report with ID {report_id} not found.")

    payment_txid = None
    if db_report.contract and db_report.contract.transactions:
        payment_txid = db_report.contract.transactions[0].algorand_txid

    filename = db_report.contract.filename if db_report.contract else "Contract.docx"

    file_path = generate_edited_docx(
        filename=filename,
        summary=db_report.summary,
        overall_risk=db_report.overall_risk,
        clauses=db_report.clauses,
        payment_txid=payment_txid
    )

    base_name = os.path.splitext(filename)[0]
    download_filename = f"{base_name}_REVISED_SAFE.docx"

    return FileResponse(
        path=file_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=download_filename
    )


@router.put("/reports/{report_id}/clauses", response_model=AnalysisResponse)
def update_clauses(report_id: int, payload: UpdateClausesRequest, db: Session = Depends(get_db)):
    """
    Updates the contract clause suggestions/amendments for a report in the database.
    """
    updated_report = update_report_clauses(db, report_id, payload.clauses)
    if not updated_report:
        raise HTTPException(status_code=404, detail=f"Report with ID {report_id} not found.")

    clauses_response = [
        ClauseAnalysis(
            name=c.clause_name,
            risk=c.risk,
            reason=c.explanation,
            suggestion=c.recommendation,
            original=c.original_text
        )
        for c in updated_report.clauses
    ]

    payment_txid = None
    if updated_report.contract and updated_report.contract.transactions:
        payment_txid = updated_report.contract.transactions[0].algorand_txid

    return AnalysisResponse(
        id=updated_report.id,
        contract_id=updated_report.contract_id,
        filename=updated_report.contract.filename if updated_report.contract else "Contract",
        upload_date=updated_report.contract.upload_date if updated_report.contract else updated_report.contract_id,
        summary=updated_report.summary,
        overallRisk=updated_report.overall_risk,
        clauses=clauses_response,
        payment_txid=payment_txid
    )


@router.post("/reports/{report_id}/download-amended")
def download_custom_amended_docx(report_id: int, payload: UpdateClausesRequest, db: Session = Depends(get_db)):
    """
    Generates and downloads a custom Word (.docx) document using user-customized clause amendments.
    """
    db_report = get_report_by_id(db, report_id)
    if not db_report:
        raise HTTPException(status_code=404, detail=f"Report with ID {report_id} not found.")

    # Update database first so edits persist
    update_report_clauses(db, report_id, payload.clauses)

    payment_txid = None
    if db_report.contract and db_report.contract.transactions:
        payment_txid = db_report.contract.transactions[0].algorand_txid

    filename = db_report.contract.filename if db_report.contract else "Contract.docx"

    file_path = generate_edited_docx(
        filename=filename,
        summary=db_report.summary,
        overall_risk=db_report.overall_risk,
        clauses=payload.clauses,
        payment_txid=payment_txid
    )

    base_name = os.path.splitext(filename)[0]
    download_filename = f"{base_name}_CUSTOM_AMENDED.docx"

    return FileResponse(
        path=file_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=download_filename
    )

