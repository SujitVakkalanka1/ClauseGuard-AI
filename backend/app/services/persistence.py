from sqlalchemy.orm import Session, joinedload
from app import models, schemas
from datetime import datetime, timezone
from typing import List, Optional

def save_contract_analysis(
    db: Session, 
    filename: str, 
    report_data: schemas.ContractReport,
    payment_info: Optional[dict] = None
) -> models.Report:
    """
    Saves Contract, Report, Clauses, and Transaction as one atomic linked unit in the database.
    """
    try:
        # 1. Create Contract
        contract = models.Contract(
            filename=filename,
            upload_date=datetime.now(timezone.utc)
        )
        db.add(contract)
        db.flush()  # gets contract.id

        # 2. Create Report
        report = models.Report(
            contract_id=contract.id,
            summary=report_data.summary,
            overall_risk=report_data.overallRisk
        )
        db.add(report)
        db.flush()  # gets report.id

        # 3. Create Clause entries
        for clause_item in report_data.clauses:
            clause = models.Clause(
                report_id=report.id,
                clause_name=clause_item.name,
                original_text=clause_item.original,
                risk=clause_item.risk,
                explanation=clause_item.reason,
                recommendation=clause_item.suggestion
            )
            db.add(clause)

        # 4. Create Transaction record (Phase 2 audit trail linked to Contract)
        if payment_info:
            transaction = models.Transaction(
                contract_id=contract.id,
                wallet=payment_info.get("wallet", "stub_wallet_phase2"),
                amount=payment_info.get("amount", 0.5),
                algorand_txid=payment_info.get("txid", "stub_txid"),
                payment_status="COMPLETED",
                created_at=datetime.now(timezone.utc)
            )
            db.add(transaction)

        db.commit()
        db.refresh(report)
        return report
    except Exception:
        db.rollback()
        raise


def get_report_by_id(db: Session, report_id: int) -> Optional[models.Report]:
    """Retrieves a single report with preloaded clauses and parent contract."""
    return db.query(models.Report)\
        .options(
            joinedload(models.Report.clauses),
            joinedload(models.Report.contract).joinedload(models.Contract.transactions)
        )\
        .filter(models.Report.id == report_id)\
        .first()


def get_all_reports_history(db: Session) -> List[schemas.HistoryItemResponse]:
    """Retrieves all past contract analyses for the History page."""
    reports = db.query(models.Report)\
        .options(
            joinedload(models.Report.clauses),
            joinedload(models.Report.contract).joinedload(models.Contract.transactions)
        )\
        .order_by(models.Report.id.desc())\
        .all()

    history_list = []
    for r in reports:
        high_count = sum(1 for c in r.clauses if c.risk == "High")
        med_count = sum(1 for c in r.clauses if c.risk == "Medium")
        low_count = sum(1 for c in r.clauses if c.risk == "Low")
        
        txid = None
        if r.contract and r.contract.transactions:
            txid = r.contract.transactions[0].algorand_txid

        history_list.append(schemas.HistoryItemResponse(
            id=r.id,
            contract_id=r.contract_id,
            filename=r.contract.filename if r.contract else "Unknown Document",
            upload_date=r.contract.upload_date if r.contract else datetime.now(timezone.utc),
            overallRisk=r.overall_risk,
            summary=r.summary,
            clause_count=len(r.clauses),
            high_risk_count=high_count,
            medium_risk_count=med_count,
            low_risk_count=low_count,
            payment_txid=txid
        ))

    return history_list


def update_report_clauses(db: Session, report_id: int, updated_clauses: List[schemas.ClauseAnalysis]) -> Optional[models.Report]:
    """Updates clause recommendations and information for a specific report."""
    report = get_report_by_id(db, report_id)
    if not report:
        return None

    existing_by_name = {c.clause_name: c for c in report.clauses}
    for item in updated_clauses:
        if item.name in existing_by_name:
            existing_clause = existing_by_name[item.name]
            existing_clause.recommendation = item.suggestion
            existing_clause.explanation = item.reason
            existing_clause.risk = item.risk
            existing_clause.original_text = item.original
        else:
            new_clause = models.Clause(
                report_id=report.id,
                clause_name=item.name,
                original_text=item.original,
                risk=item.risk,
                explanation=item.reason,
                recommendation=item.suggestion
            )
            db.add(new_clause)

    db.commit()
    db.refresh(report)
    return report

