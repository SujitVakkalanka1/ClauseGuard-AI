from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

class Contract(Base):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    filename = Column(String(255), nullable=False)
    upload_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    reports = relationship("Report", back_populates="contract", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="contract", cascade="all, delete-orphan")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    contract_id = Column(Integer, ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False)
    summary = Column(Text, nullable=False)
    overall_risk = Column(String(50), nullable=False)  # High | Medium | Low

    contract = relationship("Contract", back_populates="reports")
    clauses = relationship("Clause", back_populates="report", cascade="all, delete-orphan")


class Clause(Base):
    __tablename__ = "clauses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    report_id = Column(Integer, ForeignKey("reports.id", ondelete="CASCADE"), nullable=False)
    clause_name = Column(String(255), nullable=False)
    original_text = Column(Text, nullable=False)
    risk = Column(String(50), nullable=False)  # High | Medium | Low
    explanation = Column(Text, nullable=False)
    recommendation = Column(Text, nullable=False)
    line_number = Column(Integer, nullable=True, default=1)
    topic = Column(String(255), nullable=True)

    report = relationship("Report", back_populates="clauses")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    contract_id = Column(Integer, ForeignKey("contracts.id", ondelete="CASCADE"), nullable=True)
    wallet = Column(String(255), nullable=False, default="stub_wallet_phase2")
    amount = Column(Float, nullable=False, default=0.5)
    algorand_txid = Column(String(255), nullable=False, index=True)
    payment_status = Column(String(50), nullable=False, default="COMPLETED")  # COMPLETED | PENDING | FAILED
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    contract = relationship("Contract", back_populates="transactions")
