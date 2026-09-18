"""
HumanLens AI — Text Preprocessing & Language Detection Module
Member 3: Research / ML Lead

Implements:
1. Unicode Normalization (NFKC)
2. Language Identification & Code-Mixing Metadata (English, Hindi, Hinglish)
3. Stylistic & Emotional Intensity Text Metrics
4. Deterministic Low-Risk Communication Filter
"""

import re
import unicodedata
from typing import Dict, Any


# Common Romanized Hindi / Hinglish tokens
HINGLISH_LEXICON = {
    "kya", "hai", "nahi", "nahin", "yaar", "bhai", "theek", "accha", "acha",
    "kaise", "ho", "tu", "tum", "aap", "mera", "meri", "karo", "mat",
    "shant", "kuch", "bahut", "mujhe", "tere", "teri", "chal", "bakwaas",
    "pagal", "chup", "gussa", "samajh", "aaya", "bolo", "hoga", "hain", "kyun"
}

BENIGN_GREETINGS = {
    "hello", "hello there", "hi", "hi there", "hey", "hey there",
    "good morning", "good afternoon", "good evening", "good day",
    "how are you", "how are you doing", "how do you do",
    "thanks", "thank you", "thank you very much", "thanks a lot",
    "bye", "goodbye", "have a nice day", "sounds good", "okay", "ok",
    "got it", "sure", "no problem", "namaste", "dhanyawad", "shukriya"
}


def detect_language(text: str) -> Dict[str, Any]:
    """
    Detects language category and code-mixing metadata for HumanLens priority languages:
    - English
    - Hindi (Devanagari script)
    - Hinglish (Romanized code-mixed Hindi/English)
    - Other (detected via script/lexical characteristics)
    """
    if not isinstance(text, str) or not text.strip():
        return {
            "language": "unknown",
            "language_code": "und",
            "script": "unknown",
            "is_code_mixed": False,
            "confidence": 0.0,
        }

    raw = text.strip()
    
    # 1. Check for Devanagari script (Unicode range \u0900-\u097F)
    devanagari_chars = len(re.findall(r"[\u0900-\u097F]", raw))
    total_alpha = len([c for c in raw if c.isalpha()])

    if total_alpha > 0 and (devanagari_chars / total_alpha) > 0.30:
        return {
            "language": "Hindi",
            "language_code": "hi",
            "script": "Devanagari",
            "is_code_mixed": False,
            "confidence": round(float(devanagari_chars / total_alpha), 4),
        }

    # 2. Check for Romanized Hindi / Hinglish tokens
    words = [w.lower().strip(".,!?;:\"'") for w in raw.split()]
    hinglish_hits = sum(1 for w in words if w in HINGLISH_LEXICON)
    total_words = len(words) if words else 1

    if hinglish_hits >= 2 or (total_words <= 3 and hinglish_hits >= 1):
        return {
            "language": "Hinglish",
            "language_code": "hi-Latn",
            "script": "Latin",
            "is_code_mixed": True,
            "confidence": round(min(1.0, (hinglish_hits / total_words) * 1.5), 4),
        }

    # 3. Default Latin script classification (English / Multilingual Latin)
    if total_alpha > 0:
        return {
            "language": "English",
            "language_code": "en",
            "script": "Latin",
            "is_code_mixed": False,
            "confidence": 0.95,
        }

    return {
        "language": "unknown",
        "language_code": "und",
        "script": "non-alpha",
        "is_code_mixed": False,
        "confidence": 0.50,
    }


def clean_text(text: str, lowercase: bool = False) -> str:
    """
    Standardize, clean, and normalize text inputs across multilingual scripts.
    Preserves casing if lowercase=False to allow capitalization-intensity analysis.
    """
    if not isinstance(text, str) or not text.strip():
        return ""

    # Normalize Unicode characters (NFKC)
    normalized = unicodedata.normalize("NFKC", text)

    # Collapse repeated whitespace
    cleaned = re.sub(r"\s+", " ", normalized).strip()

    if lowercase:
        cleaned = cleaned.lower()

    return cleaned


def extract_text_features(text: str) -> Dict[str, Any]:
    """
    Extract linguistic and stylistic features relevant to emotional intensity
    and escalation detection (e.g. ALL-CAPS ratio, excessive punctuation).
    """
    if not isinstance(text, str) or not text.strip():
        return {
            "char_count": 0,
            "word_count": 0,
            "caps_ratio": 0.0,
            "exclamation_count": 0,
            "question_count": 0,
            "excessive_punctuation": False,
            "is_all_caps": False,
            "language_meta": detect_language(""),
        }

    raw = text.strip()
    char_count = len(raw)
    words = raw.split()
    word_count = len(words)

    # Capital letters ratio
    alpha_chars = [c for c in raw if c.isalpha()]
    upper_chars = [c for c in alpha_chars if c.isupper()]
    caps_ratio = len(upper_chars) / len(alpha_chars) if alpha_chars else 0.0

    # Punctuation counts
    exclamation_count = raw.count("!")
    question_count = raw.count("?")
    excessive_punct = bool(re.search(r"[!?]{2,}", raw))

    return {
        "char_count": char_count,
        "word_count": word_count,
        "caps_ratio": round(caps_ratio, 4),
        "exclamation_count": exclamation_count,
        "question_count": question_count,
        "excessive_punctuation": excessive_punct,
        "is_all_caps": caps_ratio > 0.70 and word_count >= 2,
        "language_meta": detect_language(raw),
    }


def is_low_risk_greeting_or_benign(text: str) -> bool:
    """
    Deterministic rule check: identifies obvious benign greetings or polite acknowledgments
    to safely skip heavy transformer processing in interactive systems.
    """
    cleaned = clean_text(text, lowercase=True).strip(" .!?,;:")
    if cleaned in BENIGN_GREETINGS:
        return True
    for g in BENIGN_GREETINGS:
        if cleaned == g or cleaned.startswith(g + " ") or cleaned.startswith(g + "!") or cleaned.startswith(g + ","):
            remainder = cleaned[len(g):].strip(" .!?,;:-")
            if not remainder or len(remainder) <= 50:
                hostile_keywords = {"hate", "kill", "die", "idiot", "stupid", "destroy", "bad", "worst", "shut up", "useless", "shut"}
                if not any(w in cleaned for w in hostile_keywords):
                    return True
    return False
