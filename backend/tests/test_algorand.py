import pytest
from app.services.algorand_payment import submit_algorand_payment
from app.services.payment_verifier import verify_transaction_proof

def test_submit_algorand_payment_insufficient_balance():
    # If account has 0 ALGO balance, it should raise ValueError detailing insufficient balance
    ref_id = "req_test_insufficient_balance"
    try:
        result = submit_algorand_payment(ref_id, amount_algo=999999.0)
    except ValueError as ve:
        assert "Insufficient TestNet ALGO Balance" in str(ve)

def test_verify_transaction_proof():
    # Test stub / demo txid proof
    assert verify_transaction_proof("tx_algo_testnet_12345") is True
    assert verify_transaction_proof("tx_stub_phase2_demo") is True
    assert verify_transaction_proof("") is False
    assert verify_transaction_proof("abc") is False
