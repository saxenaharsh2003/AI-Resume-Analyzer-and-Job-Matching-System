from __future__ import annotations

import subprocess
import sys
import threading
from collections import defaultdict

import spacy
from spacy.language import Language
from spacy.matcher import PhraseMatcher

try:
    from .skills_taxonomy import DEFAULT_SKILLS, canonicalize_skill
except ImportError:  # Allows imports when backend is cwd
    from skills_taxonomy import DEFAULT_SKILLS, canonicalize_skill

_MAX_DOC_CHARS = 1_000_000

SPACY_MODEL = "en_core_web_sm"


def load_spacy_model() -> Language | None:
    """Load spaCy English model; download into current Python env if missing. Never raises."""
    try:
        return spacy.load(SPACY_MODEL)
    except Exception:
        try:
            # sys.executable (not "python") so venv and uvicorn use the same interpreter.
            subprocess.run(
                [sys.executable, "-m", "spacy", "download", SPACY_MODEL],
                check=True,
                timeout=600,
            )
            return spacy.load(SPACY_MODEL)
        except Exception as e:
            print("SpaCy model load failed:", e)
            return None


nlp = load_spacy_model()

_matcher: PhraseMatcher | None = None
_matcher_lock = threading.Lock()


def _ensure_matcher() -> PhraseMatcher | None:
    """Build PhraseMatcher once when spaCy is available."""
    global _matcher
    if nlp is None:
        return None
    if _matcher is not None:
        return _matcher
    with _matcher_lock:
        if _matcher is not None:
            return _matcher
        by_canon: dict[str, list[str]] = defaultdict(list)
        for skill in DEFAULT_SKILLS:
            s = skill.strip()
            if not s:
                continue
            by_canon[canonicalize_skill(skill)].append(s)

        _matcher = PhraseMatcher(nlp.vocab, attr="LOWER")
        for canon, variants in by_canon.items():
            uniq = sorted(set(variants), key=len, reverse=True)
            docs = [nlp.make_doc(v) for v in uniq]
            if docs:
                _matcher.add(canon, docs)
    return _matcher


def _resolve_overlaps(spans: list[tuple[int, int, str]]) -> list[tuple[int, int, str]]:
    spans.sort(key=lambda x: (x[0], -(x[1] - x[0])))
    chosen: list[tuple[int, int, str]] = []
    for s, e, sk in spans:
        if any(s < ce and e > cs for cs, ce, _ in chosen):
            continue
        chosen.append((s, e, sk))
    chosen.sort(key=lambda x: x[0])
    return chosen


def _skills_from_doc(doc, nlp_model: Language, matcher: PhraseMatcher) -> list[str]:
    raw_spans: list[tuple[int, int, str]] = []
    for match_id, start, end in matcher(doc):
        label = nlp_model.vocab.strings[match_id]
        raw_spans.append((start, end, label))

    merged = _resolve_overlaps(raw_spans)
    out: list[str] = []
    seen: set[str] = set()
    for _, _, sk in merged:
        if sk not in seen:
            seen.add(sk)
            out.append(sk)
    return out


def _nlp_stats(doc) -> dict[str, int]:
    verb_count = sum(1 for t in doc if t.pos_ == "VERB")
    token_count = sum(1 for t in doc if not t.is_space)
    try:
        sentence_count = len(list(doc.sents))
    except ValueError:
        sentence_count = 0
    return {
        "verb_count": verb_count,
        "token_count": token_count,
        "sentence_count": sentence_count,
    }


def extract_skills_and_stats(text: str) -> tuple[list[str], dict[str, int]]:
    """
    Taxonomy skills via PhraseMatcher + shallow stats. If spaCy is unavailable, degrades
    to empty skills and zero stats (no exceptions).
    """
    empty_stats = {"verb_count": 0, "token_count": 0, "sentence_count": 0}
    if not text or not text.strip():
        return [], empty_stats

    matcher = _ensure_matcher()
    if not nlp or matcher is None:
        return [], empty_stats

    snippet = text if len(text) <= _MAX_DOC_CHARS else text[:_MAX_DOC_CHARS]
    if nlp:
        doc = nlp(snippet)
    else:
        return [], empty_stats

    skills = _skills_from_doc(doc, nlp, matcher)
    stats = _nlp_stats(doc)
    return skills, stats


def extract_skills(text: str) -> list[str]:
    """Extract skills using spaCy PhraseMatcher over the skill taxonomy."""
    return extract_skills_and_stats(text)[0]
