import json
import logging
import re
from typing import Dict, Any
from app.config import settings
from app.schemas import ContractReport, ClauseAnalysis, DiffSegment
from app.services.diff_engine import generate_word_diff

logger = logging.getLogger(__name__)

def _enrich_report_with_diffs(report: ContractReport) -> ContractReport:
    """Enriches each clause in the report with clause_id, original_text, amended_text, and structured diff_segments."""
    for i, clause in enumerate(report.clauses, 1):
        if not clause.clause_id:
            clause.clause_id = f"clause_{i}"
        orig = clause.original or clause.original_text or ""
        sug = clause.suggestion or clause.amended_text or ""
        if not clause.original_text:
            clause.original_text = orig
        if not clause.amended_text:
            clause.amended_text = sug
        if not clause.diff_segments:
            raw_diffs = generate_word_diff(orig, sug)
            clause.diff_segments = [DiffSegment(**d) for d in raw_diffs]
    return report


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

CRITICAL INSTRUCTIONS FOR EXTRACTION & THE "original" FIELD:
- "original": MUST contain ONLY the exact, substantive contract clause text directly stating the obligation extracted from the body of the document.
- NEVER set "original" to a table of contents, document index, section outline, page header, or listing of chapter titles.
- If a section header or number is near the clause, include only the sentence/paragraph containing the actual legal provision itself.

NOTE FOR NON-CONTRACT DOCUMENTS:
If the input text is an academic paper, project abstract, homework assignment, research report, resume, or non-contract document that does not contain legal contract clauses, you MUST:
1. Return an empty array for "clauses": []
2. Set "overallRisk": "Low"
3. In "summary", explicitly identify the specific document type detected (e.g., "This document appears to be an academic project abstract/paper rather than a commercial legal contract") and confirm that no high-risk legal contract terms were found.

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
      "original": "Exact original substantive clause text from contract body (excluding table of contents or index lists)",
      "line_number": 12,
      "topic": "Indemnity & Defense"
    }
  ]
}
Ensure:
- 'overallRisk' is exactly one of: "High", "Medium", "Low"
- 'risk' for each clause is exactly one of: "High", "Medium", "Low"
- Do NOT output markdown code fences (like ```json), output raw JSON string only.
"""

CONTRACT_TYPE_PLAYBOOKS = {
    "NDA": (
        "Focus heavily on definition of Confidential Information, exclusions, compelled disclosures, term of confidentiality obligations, "
        "return or destruction of materials, and residual knowledge clauses. Flag unilateral secrecy obligations, indefinite durations, "
        "and missing standard carve-outs."
    ),
    "SaaS Agreement": (
        "Focus heavily on service level agreements (SLAs), data security and breach notification, uptime guarantees, data ownership and portability, "
        "auto-renewal terms, service suspension rights, and API access limitations. Flag vendor liability disclaimers for data loss."
    ),
    "Employment Contract": (
        "Focus heavily on non-compete and non-solicitation restrictions, IP work-for-hire assignment, severance rights, termination without cause, "
        "non-disparagement, and dispute resolution venue. Flag overly broad non-competes and unrestricted assignment of pre-existing personal IP."
    ),
    "Freelance/Vendor Agreement": (
        "Focus heavily on payment terms, net payment days, deliverables acceptance criteria, independent contractor status, background IP retention "
        "vs client work product, indemnification for third-party claims, and termination notice periods. Flag payment terms exceeding 30 days."
    ),
    "General/Other": (
        "Focus on standard commercial contract risks including unilateral indemnity, uncapped liability, governing law, dispute resolution, "
        "auto-renewal, and termination for convenience."
    )
}


def calculate_overall_risk(clauses: list) -> Dict[str, Any]:
    """
    Pure function calculating weighted overall risk score and count breakdown for a list of clauses.
    Weights: high=3, medium=2, low=1.
    Counts ONLY clauses with status in ('original', 'accepted').
    
    Returns:
        dict: {"score": float, "breakdown": {"low": int, "medium": int, "high": int}}
    """
    breakdown = {"low": 0, "medium": 0, "high": 0}
    total_points = 0
    counted = 0

    for c in (clauses or []):
        if isinstance(c, dict):
            raw_risk = c.get("risk_level") or c.get("risk") or "low"
            raw_status = c.get("status") or "original"
        else:
            raw_risk = getattr(c, "risk_level", None) or getattr(c, "risk", None) or "low"
            raw_status = getattr(c, "status", None) or "original"

        risk_str = str(raw_risk).lower().strip()
        status_str = str(raw_status).lower().strip()

        if status_str not in ("original", "accepted"):
            continue

        if risk_str == "high":
            breakdown["high"] += 1
            total_points += 3
            counted += 1
        elif risk_str in ("medium", "med"):
            breakdown["medium"] += 1
            total_points += 2
            counted += 1
        elif risk_str in ("low", "info"):
            breakdown["low"] += 1
            total_points += 1
            counted += 1

    score = round(total_points / counted, 2) if counted > 0 else 0.0
    return {
        "score": float(score),
        "breakdown": breakdown
    }


def analyze_contract_text(text: str, contract_type: str = "General/Other") -> ContractReport:
    """
    Main entry point for contract analysis.
    Accepts plain text and optional contract_type, returns validated ContractReport.
    Supports Gemini API, OpenAI API, or a rule-based smart fallback analyzer.
    """
    if not text or len(text.strip()) < 20:
        raise ValueError("Contract text is too short or empty for risk analysis.")

    playbook_addon = CONTRACT_TYPE_PLAYBOOKS.get(contract_type, CONTRACT_TYPE_PLAYBOOKS["General/Other"])

    # 1. Try Gemini API first if API Key present
    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip():
        try:
            logger.info(f"Executing contract risk analysis via Google Gemini API ({contract_type})...")
            report = _analyze_with_gemini(text, playbook_addon=playbook_addon)
            return _enrich_report_with_diffs(report)
        except Exception as e:
            logger.warning(f"Gemini API analysis error: {e}. Trying OpenAI or fallback.")

    # 2. Try OpenAI API if API Key present
    if settings.OPENAI_API_KEY and settings.OPENAI_API_KEY.strip():
        try:
            logger.info(f"Executing contract risk analysis via OpenAI API ({contract_type})...")
            report = _analyze_with_openai(text, playbook_addon=playbook_addon)
            return _enrich_report_with_diffs(report)
        except Exception as e:
            logger.warning(f"OpenAI API analysis error: {e}. Falling back to rule-based analyzer.")

    # 3. Smart Heuristic Fallback Analyzer
    logger.info(f"Using smart rule-based clause risk analyzer fallback ({contract_type}).")
    report = _analyze_with_heuristic_fallback(text)
    return _enrich_report_with_diffs(report)


def _analyze_with_gemini(text: str, playbook_addon: str = "") -> ContractReport:
    """Calls Gemini API using google-genai structured JSON."""
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=settings.GEMINI_API_KEY.strip())
    prompt = f"{SYSTEM_PROMPT}\n\n[CONTRACT PLAYBOOK DOMAIN CRITERIA]\n{playbook_addon}\n\nAnalyze the following legal contract text:\n\n{text[:15000]}"


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
    Filters out Table of Contents and section index headers to ensure exact original clause text extraction.
    """
    detected_clauses = []
    raw_paragraphs = [p.strip() for p in text.split("\n\n") if len(p.strip()) > 15]

    if not raw_paragraphs or len(raw_paragraphs) < 2:
        raw_paragraphs = [p.strip() for p in text.split("\n") if len(p.strip()) > 15]

    # Helper to check if a paragraph is a Table of Contents or section index list
    def is_toc_or_index(p: str) -> bool:
        lower_p = p.lower()
        if "table of contents" in lower_p or "index of sections" in lower_p or "sections" in lower_p and len(p) < 150:
            return True
        # If paragraph contains multiple section item listing lines (e.g. "23. ... 24. ... 25. ...")
        num_listings = len(re.findall(r"\b\d{1,3}\.\s+[A-Z]", p))
        if num_listings >= 2:
            return True
        return False

    paragraphs = [p for p in raw_paragraphs if not is_toc_or_index(p)]

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
    text_lines = text.split("\n")

    for p in paragraphs:
        for pat in patterns:
            if pat["category"] not in found_categories and re.search(pat["regex"], p, re.IGNORECASE):
                # Isolate exact sentence containing the match to avoid pulling adjacent section index text
                sentences = re.split(r'(?<=[.!?])\s+', p)
                matching_sentences = [s for s in sentences if re.search(pat["regex"], s, re.IGNORECASE)]
                clause_text = " ".join(matching_sentences) if matching_sentences else p

                if len(clause_text) > 400:
                    clause_text = clause_text[:400] + "..."

                # Compute line number in original document text
                calc_line_no = 1
                snippet = clause_text[:30].strip()
                for line_idx, line_str in enumerate(text_lines, 1):
                    if snippet and snippet in line_str:
                        calc_line_no = line_idx
                        break
                if calc_line_no == 1:
                    calc_line_no = (len(detected_clauses) + 1) * 14 + 3

                found_categories.add(pat["category"])
                detected_clauses.append(ClauseAnalysis(
                    name=pat["category"],
                    risk=pat["risk"],
                    reason=pat["reason"],
                    suggestion=pat["suggestion"],
                    original=clause_text,
                    line_number=calc_line_no,
                    topic=pat["category"]
                ))


    # If document has no matching legal contract clauses (e.g. academic paper, abstract, or non-contract file)
    if not detected_clauses:
        overall = "Low"
        lower_text = text.lower()
        if any(w in lower_text for w in ["abstract", "thesis", "project", "university", "paper", "author", "introduction", "research", "dsa"]):
            doc_type = "an academic project abstract / research document"
        elif any(w in lower_text for w in ["resume", "curriculum vitae", "education", "experience"]):
            doc_type = "a resume / CV"
        else:
            doc_type = "a general non-contract document"

        summary = (
            f"Document analysis complete: This file appears to be {doc_type} rather than a commercial legal agreement. "
            f"No high-risk or predatory legal contract clauses were identified."
        )
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
