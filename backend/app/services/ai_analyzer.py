import json
import logging
import re
from typing import Dict, Any
from app.config import settings
from app.schemas import ContractReport, ClauseAnalysis

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an expert legal counsel and risk analysis engine specializing in commercial contract analysis.
Your job is to analyze contract text, extract legal clauses, classify each clause, assign a risk level, explain why it is risky, and suggest a safer rewording.

Focus especially on high-risk categories:
1. Indemnity (unilateral, uncapped, broad indemnification obligations)
2. Liability Caps (disclaimers of consequential damages, zero cap, or low cap)
3. Termination Terms (termination for convenience without cause, short cure periods)
4. Auto-Renewal (lock-in clauses, tight opt-out windows, automatic fee hikes)
5. IP Assignment (unrestricted assignment of background IP or work product)
6. Non-Compete / Non-Solicit (overly broad scope, long duration, geographic limits)
7. Arbitration & Governing Law (unfavorable jurisdiction, waiver of jury trial / class actions)

NOTE FOR NON-CONTRACT DOCUMENTS:
If the input text is an academic paper, project abstract, homework assignment, resume, or non-contract document that does not contain legal contract clauses, you MUST return an empty array for "clauses": [], set "overallRisk": "Low", and state in "summary" that no legal contract risks were found.

You MUST respond strictly with a valid JSON object adhering to this exact schema:
{
  "summary": "Executive summary of the contract risk profile and main points of concern",
  "overallRisk": "High" | "Medium" | "Low",
  "clauses": [
    {
      "name": "Clause Category Name (e.g. Indemnity, Liability Cap)",
      "risk": "High" | "Medium" | "Low",
      "reason": "Clear explanation of why this clause creates legal/financial risk",
      "suggestion": "Safer, reworded text for the clause that protects the client",
      "original": "Exact original clause text from the contract"
    }
  ]
}

Ensure:
- 'overallRisk' is exactly one of: "High", "Medium", "Low"
- 'risk' for each clause is exactly one of: "High", "Medium", "Low"
- Do NOT output markdown code fences (like ```json), output raw JSON string only.
"""

def clean_json_response(raw_text: str) -> str:
    """Strips markdown code fences and whitespace from AI output."""
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


def analyze_contract_text(text: str) -> ContractReport:
    """
    Main entry point for contract analysis.
    Accepts plain text, returns validated ContractReport (Pydantic model).
    Supports Gemini API, OpenAI API, or a rule-based smart fallback analyzer.
    """
    if not text or len(text.strip()) < 20:
        raise ValueError("Contract text is too short or empty for risk analysis.")

    # 1. Try Gemini API first if API Key present
    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip():
        try:
            logger.info("Executing contract risk analysis via Google Gemini API...")
            return _analyze_with_gemini(text)
        except Exception as e:
            logger.warning(f"Gemini API analysis error: {e}. Trying OpenAI or fallback.")

    # 2. Try OpenAI API if API Key present
    if settings.OPENAI_API_KEY and settings.OPENAI_API_KEY.strip():
        try:
            logger.info("Executing contract risk analysis via OpenAI API...")
            return _analyze_with_openai(text)
        except Exception as e:
            logger.warning(f"OpenAI API analysis error: {e}. Falling back to rule-based analyzer.")

    # 3. Smart Heuristic Fallback Analyzer (Guarantees zero-dependency demo capability)
    logger.info("Using smart rule-based clause risk analyzer fallback (no AI API keys configured).")
    return _analyze_with_heuristic_fallback(text)


def _analyze_with_gemini(text: str) -> ContractReport:
    """Calls Gemini API using google-genai structured JSON."""
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=settings.GEMINI_API_KEY.strip())
    prompt = f"{SYSTEM_PROMPT}\n\nAnalyze the following legal contract text:\n\n{text[:15000]}"

    models_to_try = ["gemini-flash-latest", "gemini-2.0-flash-lite", "gemini-2.0-flash", "gemini-2.5-flash"]
    last_err = None

    for model_name in models_to_try:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2,
                ),
            )
            cleaned = clean_json_response(response.text)
            data = json.loads(cleaned)
            logger.info(f"Gemini API ({model_name}) contract analysis completed successfully.")
            return ContractReport.model_validate(data)
        except Exception as e:
            last_err = e
            logger.warning(f"Gemini API model '{model_name}' failed: {e}. Trying next model.")

    if last_err:
        raise last_err
    raise RuntimeError("Gemini API call failed.")


def _analyze_with_openai(text: str) -> ContractReport:
    """Calls OpenAI API using structured JSON mode."""
    from openai import OpenAI
    client = OpenAI(api_key=settings.OPENAI_API_KEY.strip())

    prompt_content = f"Analyze the following legal contract text:\n\n{text[:15000]}"

    response = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt_content}
        ],
        response_format={"type": "json_object"},
        temperature=0.2
    )

    content = response.choices[0].message.content
    cleaned = clean_json_response(content)
    data = json.loads(cleaned)
    logger.info("OpenAI API contract analysis completed successfully.")
    return ContractReport.model_validate(data)


def _analyze_with_heuristic_fallback(text: str) -> ContractReport:
    """
    High-fidelity heuristic analyzer for legal contracts.
    Detects key clause categories (Indemnity, Liability, Termination, Auto-Renewal, IP Assignment, Non-Compete, Arbitration).
    """
    detected_clauses = []
    paragraphs = [p.strip() for p in text.split("\n\n") if len(p.strip()) > 30]

    if not paragraphs:
        paragraphs = [p.strip() for p in text.split("\n") if len(p.strip()) > 30]

    # Pattern definitions
    patterns = [
        {
            "category": "Indemnity & Defense",
            "regex": r"(indemnif|hold harmless|defend|indemnity)",
            "risk": "High",
            "reason": "Unilateral indemnification exposes your company to uncapped third-party liability, legal fees, and financial loss regardless of fault.",
            "suggestion": "Each party shall indemnify, defend, and hold harmless the other party from third-party claims arising solely out of gross negligence or willful misconduct, capped at total fees paid under this Agreement in the preceding 12 months."
        },
        {
            "category": "Limitation of Liability",
            "regex": r"(limitation of liability|aggregate liability|consequential damages|indirect damages|cap on liability)",
            "risk": "High",
            "reason": "Total waiver of indirect damages combined with an asymmetric liability cap severely limits recovery in case of breach or loss of revenue.",
            "suggestion": "Except for breach of confidentiality or gross negligence, neither party's total aggregate liability under this Agreement shall exceed the total amount paid by Client to Provider in the 12 months preceding the claim."
        },
        {
            "category": "Termination for Convenience",
            "regex": r"(terminate without cause|termination for convenience|immediate termination|cure period)",
            "risk": "Medium",
            "reason": "Short or immediate termination periods without cause create operational instability and revenue unpredictability.",
            "suggestion": "Either party may terminate this Agreement without cause upon providing at least thirty (30) days prior written notice to the other party."
        },
        {
            "category": "Automatic Renewal",
            "regex": r"(auto-renew|automatic renewal|automatically renew|written notice of non-renewal)",
            "risk": "Medium",
            "reason": "Automatic renewal clauses with short opt-out notification windows risk unwanted contract extension and unexpected recurring fees.",
            "suggestion": "This Agreement shall automatically renew for additional one (1) year terms unless either party gives written notice of non-renewal at least 30 days prior to the expiration of the then-current term."
        },
        {
            "category": "Intellectual Property Assignment",
            "regex": r"(intellectual property|work for hire|assigns all right|pre-existing ip|background ip)",
            "risk": "High",
            "reason": "Broad IP assignment clauses can inadvertently transfer pre-existing proprietary tools, frameworks, and background IP.",
            "suggestion": "Provider retains all right, title, and interest in pre-existing intellectual property and proprietary tools. Client receives a non-exclusive, worldwide, royalty-free license to use deliverables produced under this Agreement."
        },
        {
            "category": "Non-Compete & Non-Solicitation",
            "regex": r"(non-compete|non compete|solicit|solicitation|competing business)",
            "risk": "High",
            "reason": "Broad non-compete clauses restrict future business ventures and commercial relationships over wide geographic regions.",
            "suggestion": "During the term of this Agreement and for a period of six (6) months thereafter, neither party shall directly solicit for employment any current employee of the other party involved in performing services under this Agreement."
        },
        {
            "category": "Governing Law & Arbitration",
            "regex": r"(governing law|jurisdiction|arbitration|venue|waive jury)",
            "risk": "Low",
            "reason": "Designating distant court venues or mandatory binding arbitration increases litigation expenses and dispute friction.",
            "suggestion": "This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of law principles."
        }
    ]

    found_categories = set()

    for p in paragraphs:
        for pat in patterns:
            if pat["category"] not in found_categories and re.search(pat["regex"], p, re.IGNORECASE):
                found_categories.add(pat["category"])
                detected_clauses.append(ClauseAnalysis(
                    name=pat["category"],
                    risk=pat["risk"],
                    reason=pat["reason"],
                    suggestion=pat["suggestion"],
                    original=p[:400] + "..." if len(p) > 400 else p
                ))

    # If document has no matching legal contract clauses (e.g. academic paper, abstract, or non-contract file)
    if not detected_clauses:
        overall = "Low"
        summary = "Document analysis complete. No high-risk or predatory legal contract clauses were identified in this document."
    else:
        # Calculate overall risk
        high_count = sum(1 for c in detected_clauses if c.risk == "High")
        med_count = sum(1 for c in detected_clauses if c.risk == "Medium")

        if high_count >= 2:
            overall = "High"
        elif high_count == 1 or med_count >= 2:
            overall = "Medium"
        else:
            overall = "Low"

        summary = (
            f"Contract analysis complete. Identified {len(detected_clauses)} critical clauses. "
            f"The agreement presents an overall {overall} risk profile with {high_count} High-risk "
            f"and {med_count} Medium-risk terms requiring legal review before signing."
        )

    return ContractReport(
        summary=summary,
        overallRisk=overall,
        clauses=detected_clauses
    )
