"""
x402 Payment Gate Module.

Implements the standard x402 Payment Protocol as a stateless FastAPI dependency.
Knows nothing about contract extraction or AI — only enforces payment proof headers.
"""

import uuid
from fastapi import Request, HTTPException, status
from app.services.payment_verifier import verify_transaction_proof

# x402 Payment Parameters
REQUIRED_AMOUNT = 0.001
PAYMENT_ASSET = "ALGO"
RECIPIENT_ADDRESS = "ALGO_DEMO_RECIPIENT_ADDRESS_PHASE2_STUB"

HEADER_PAYMENT_PROOF = "X-Payment-Proof"
HEADER_ALT_PROOF = "X-402-Payment-Proof"

async def require_x402_payment(request: Request) -> dict:
    """
    FastAPI Dependency enforcing x402 payment requirements.
    
    Returns:
        dict: Verified payment details containing txid, amount, and recipient.
        
    Raises:
        HTTPException(402): If no payment proof header is provided or proof is invalid.
    """
    # 1. Extract payment proof header
    proof_header = request.headers.get(HEADER_PAYMENT_PROOF) or request.headers.get(HEADER_ALT_PROOF)

    # 2. If missing proof header, return HTTP 402 Payment Required with x402 specification payload
    if not proof_header or not proof_header.strip():
        reference_id = f"req_{uuid.uuid4().hex[:12]}"
        
        challenge_payload = {
            "error": "Payment Required",
            "message": f"Contract clause analysis requires a payment of {REQUIRED_AMOUNT} {PAYMENT_ASSET}.",
            "x402": {
                "amount": REQUIRED_AMOUNT,
                "asset": PAYMENT_ASSET,
                "pay_to": RECIPIENT_ADDRESS,
                "reference_id": reference_id,
                "instructions": f"Pay {REQUIRED_AMOUNT} {PAYMENT_ASSET} to '{RECIPIENT_ADDRESS}' and provide the transaction ID in the '{HEADER_PAYMENT_PROOF}' header."
            }
        }
        
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=challenge_payload
        )

    proof_txid = proof_header.strip()

    # 3. Verify proof using independent verifier module
    is_valid = verify_transaction_proof(proof_txid)
    if not is_valid:
        reference_id = f"req_{uuid.uuid4().hex[:12]}"
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "error": "Invalid Payment Proof",
                "message": f"Transaction proof '{proof_txid}' could not be verified.",
                "x402": {
                    "amount": REQUIRED_AMOUNT,
                    "asset": PAYMENT_ASSET,
                    "pay_to": RECIPIENT_ADDRESS,
                    "reference_id": reference_id
                }
            }
        )

    # 4. Verification successful — allow request to proceed
    return {
        "txid": proof_txid,
        "amount": REQUIRED_AMOUNT,
        "asset": PAYMENT_ASSET,
        "recipient": RECIPIENT_ADDRESS,
        "wallet": "stub_wallet_phase2"
    }
