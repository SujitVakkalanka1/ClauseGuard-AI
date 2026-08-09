import base64
import pytest
from unittest.mock import patch, MagicMock
from app.services.payment_verifier import verify_transaction_on_chain

def test_verify_transaction_stub():
    res = verify_transaction_on_chain("tx_stub_12345", 0.001, "", "")
    assert res["verified"] is True
    assert res["confirmed_round"] == 66072000

@patch("httpx.Client.get")
def test_verify_transaction_404_not_yet_indexed(mock_get):
    mock_resp = MagicMock()
    mock_resp.status_code = 404
    mock_get.return_value = mock_resp

    res = verify_transaction_on_chain("tx_real_testnet_hash_9999", 0.001, "", "")
    assert res["verified"] is False
    assert "not yet indexed" in res["reason"].lower()
    assert res["confirmed_round"] is None

@patch("httpx.Client.get")
def test_verify_transaction_success(mock_get):
    encoded_note = base64.b64encode(b"req_test12345").decode("utf-8")
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "transaction": {
            "id": "tx_real_testnet_hash_8888",
            "confirmed-round": 1234567,
            "payment-transaction": {
                "amount": 1000,
                "receiver": "TEST_RECIPIENT_ADDRESS"
            },
            "note": encoded_note
        }
    }
    mock_get.return_value = mock_resp

    res = verify_transaction_on_chain(
        tx_id="tx_real_testnet_hash_8888",
        expected_amount=0.001,
        expected_receiver="TEST_RECIPIENT_ADDRESS",
        expected_note_reference="req_test12345"
    )

    assert res["verified"] is True
    assert res["confirmed_round"] == 1234567

@patch("httpx.Client.get")
def test_verify_transaction_amount_mismatch(mock_get):
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "transaction": {
            "id": "tx_hash_amount_mismatch",
            "confirmed-round": 1234567,
            "payment-transaction": {
                "amount": 500,  # 500 microAlgos != 1000 expected
                "receiver": "TEST_RECIPIENT_ADDRESS"
            }
        }
    }
    mock_get.return_value = mock_resp

    res = verify_transaction_on_chain(
        tx_id="tx_hash_amount_mismatch",
        expected_amount=0.001,
        expected_receiver="TEST_RECIPIENT_ADDRESS",
        expected_note_reference=""
    )

    assert res["verified"] is False
    assert "Amount mismatch" in res["reason"]
