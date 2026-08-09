import difflib
from typing import List, Dict

def generate_word_diff(original: str, amended: str) -> List[Dict[str, str]]:
    """
    Generates word-level diff segments between original and amended clause texts.
    Uses difflib.SequenceMatcher on word tokens.

    Returns:
        List[Dict[str, str]]: A list of segments, each having:
        - "type": "unchanged" | "removed" | "added"
        - "text": str
    """
    orig_text = (original or "").strip()
    amend_text = (amended or "").strip()

    if not orig_text and not amend_text:
        return []
    if not orig_text:
        return [{"type": "added", "text": amend_text}]
    if not amend_text:
        return [{"type": "removed", "text": orig_text}]

    orig_words = orig_text.split()
    amend_words = amend_text.split()

    matcher = difflib.SequenceMatcher(None, orig_words, amend_words)
    diff_segments = []

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal":
            segment_text = " ".join(orig_words[i1:i2])
            if segment_text:
                diff_segments.append({"type": "unchanged", "text": segment_text})
        elif tag == "replace":
            rem_text = " ".join(orig_words[i1:i2])
            add_text = " ".join(amend_words[j1:j2])
            if rem_text:
                diff_segments.append({"type": "removed", "text": rem_text})
            if add_text:
                diff_segments.append({"type": "added", "text": add_text})
        elif tag == "delete":
            rem_text = " ".join(orig_words[i1:i2])
            if rem_text:
                diff_segments.append({"type": "removed", "text": rem_text})
        elif tag == "insert":
            add_text = " ".join(amend_words[j1:j2])
            if add_text:
                diff_segments.append({"type": "added", "text": add_text})

    return diff_segments
