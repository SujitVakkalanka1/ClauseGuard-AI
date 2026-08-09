"""
x402 Payment Gate Module.

Implements the standard x402 Payment Protocol as a stateless FastAPI dependency.
Enforces payment proof headers and verifies transactions on-chain via Algorand Indexer.
"""

import asyncio
import uuid
from fastapi import Request, HTTPException, status
from app.services.payment_verifier import verify_transaction_on_chain
from app.config import settings

# x402 Payment Parameters
REQUIRED_AMOUNT = 0.001
PAYMENT_ASSET = "ALGO"
HEADER_PAYMENT_PROOF = "X-Payment-Proof"
HEADER_ALT_PROOF = "X-402-Payment-Proof"
HEADER_NOTE_REF = "X-Payment-Reference"

async def require_x402_payment(request: Request) -> dict:
    """
    FastAPI Dependency enforcing x402 payment requirements with retry logic.
    
    Returns:
        dict: Verified payment details containing txid, amount, asset, recipient.
        
    Raises:
        HTTPException(402): If no payment proof header is provided or proof fails verification.
    """
    recipient_address = getattr(settings, "ALGORAND_RECIPIENT_ADDRESS", None) or "ALGO_DEMO_RECIPIENT_ADDRESS_PHASE2_STUB"
    if not recipient_address or not recipient_address.strip():
        recipient_address = "ALGO_DEMO_RECIPIENT_ADDRESS_PHASE2_STUB"

    # 1. Extract payment proof header
    proof_header = request.headers.get(HEADER_PAYMENT_PROOF) or request.headers.get(HEADER_ALT_PROOF)

    # 2. If missing proof header, return HTTP 402 Payment Required
    if not proof_header or not proof_header.strip():
        reference_id = f"req_{uuid.uuid4().hex[:12]}"
        
        challenge_payload = {
            "error": "Payment Required",
            "message": f"Contract clause analysis requires a payment of {REQUIRED_AMOUNT} {PAYMENT_ASSET}.",
            "x402": {
                "amount": REQUIRED_AMOUNT,
                "asset": PAYMENT_ASSET,
                "pay_to": recipient_address,
                "reference_id": reference_id,
                "instructions": f"Pay {REQUIRED_AMOUNT} {PAYMENT_ASSET} to '{recipient_address}' and provide the transaction ID in the '{HEADER_PAYMENT_PROOF}' header."
            }
        }
        
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=challenge_payload
        )

    proof_txid = proof_header.strip()
    expected_ref = request.headers.get(HEADER_NOTE_REF, "")

    # 3. Verify proof on-chain with up to 3 retries (2s delay) if not yet indexed
    verification = {"verified": False, "reason": "Verification failed", "confirmed_round": None}
    
    for attempt in range(3):
        verification = verify_transaction_on_chain(
            tx_id=proof_txid,
            expected_amount=REQUIRED_AMOUNT,
            expected_receiver="",  # Optional match to allow general testnet address config
            expected_note_reference=expected_ref
        )
        if verification["verified"]:
            break
        
        # Retry only if the failure reason is "not yet indexed"
        reason_msg = str(verification.get("reason", "")).lower()
        if "not yet indexed" in reason_msg or "retry" in reason_msg:
            if attempt < 2:
                await asyncio.sleep(2)
        else:
            break

    if not verification["verified"]:
        reference_id = f"req_{uuid.uuid4().hex[:12]}"
        failure_reason = verification.get("reason", "Verification failed")
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "error": "Invalid Payment Proof",
                "message": f"Transaction proof '{proof_txid}' could not be verified: {failure_reason}",
                "x402": {
                    "amount": REQUIRED_AMOUNT,
                    "asset": PAYMENT_ASSET,
                    "pay_to": recipient_address,
                    "reference_id": reference_id
                }
            }
        )

    # 4. Verification successful
    return {
        "txid": proof_txid,
        "amount": REQUIRED_AMOUNT,
        "asset": PAYMENT_ASSET,
        "recipient": recipient_address,
        "wallet": "stub_wallet_phase2",
        "confirmed_round": verification.get("confirmed_round")
    }
