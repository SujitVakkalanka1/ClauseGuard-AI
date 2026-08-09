import pytest
from app.services.diff_engine import generate_word_diff

def test_generate_word_diff_no_changes():
    orig = "Client shall pay all fees within thirty days."
    amended = "Client shall pay all fees within thirty days."
    result = generate_word_diff(orig, amended)
    
    assert len(result) == 1
    assert result[0]["type"] == "unchanged"
    assert result[0]["text"] == "Client shall pay all fees within thirty days."

def test_generate_word_diff_full_replacement():
    orig = "Party A agrees to full liability."
    amended = "Party B is completely exempt from loss."
    result = generate_word_diff(orig, amended)
    
    types = [segment["type"] for segment in result]
    assert "removed" in types
    assert "added" in types
    
    removed_text = " ".join(s["text"] for s in result if s["type"] in ("unchanged", "removed"))
    added_text = " ".join(s["text"] for s in result if s["type"] in ("unchanged", "added"))
    assert removed_text == orig
    assert added_text == amended

def test_generate_word_diff_partial_word_changes():
    orig = "The quick brown fox jumps"
    amended = "The slow brown fox leaps"
    result = generate_word_diff(orig, amended)
    
    types = [segment["type"] for segment in result]
    assert "unchanged" in types
    assert "removed" in types
    assert "added" in types

    removed_words = [s["text"] for s in result if s["type"] == "removed"]
    added_words = [s["text"] for s in result if s["type"] == "added"]
    assert "quick" in removed_words
    assert "slow" in added_words

def test_generate_word_diff_added_trailing_text():
    orig = "The contract is valid"
    amended = "The contract is valid for five years"
    result = generate_word_diff(orig, amended)
    
    assert result[0]["type"] == "unchanged"
    assert result[0]["text"] == "The contract is valid"
    assert result[1]["type"] == "added"
    assert result[1]["text"] == "for five years"

def test_generate_word_diff_removed_trailing_text():
    orig = "The contract is valid for five years"
    amended = "The contract is valid"
    result = generate_word_diff(orig, amended)
    
    assert result[0]["type"] == "unchanged"
    assert result[0]["text"] == "The contract is valid"
    assert result[1]["type"] == "removed"
    assert result[1]["text"] == "for five years"
