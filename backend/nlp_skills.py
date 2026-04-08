from __future__ import annotations

from collections import defaultdict

import spacy
from spacy.matcher import PhraseMatcher
from spacy.language import Language

from .skills_taxonomy import DEFAULT_SKILLS, canonicalize_skill

_MAX_DOC_CHARS = 1_000_000

_nlp: Language | None = None
_matcher: PhraseMatcher | None = None


class SpacyModelError(RuntimeError):
    """Raised when the spaCy English model is missing or fails to load."""


def _ensure_nlp_and_matcher() -> tuple[Language, PhraseMatcher]:
    global _nlp, _matcher
    if _nlp is not None and _matcher is not None:
        return _nlp, _matcher

    try:
        _nlp = spacy.load("en_core_web_sm")
    except OSError as e:
        raise SpacyModelError(
            "spaCy model 'en_core_web_sm' is not installed. Run: "
            "python -m spacy download en_core_web_sm"
        ) from e

    by_canon: dict[str, list[str]] = defaultdict(list)
    for skill in DEFAULT_SKILLS:
        s = skill.strip()
        if not s:
            continue
        by_canon[canonicalize_skill(skill)].append(s)

    _matcher = PhraseMatcher(_nlp.vocab, attr="LOWER")
    for canon, variants in by_canon.items():
        uniq = sorted(set(variants), key=len, reverse=True)
        docs = [_nlp.make_doc(v) for v in uniq]
        if docs:
            _matcher.add(canon, docs)

    return _nlp, _matcher


def _resolve_overlaps(spans: list[tuple[int, int, str]]) -> list[tuple[int, int, str]]:
    spans.sort(key=lambda x: (x[0], -(x[1] - x[0])))
    chosen: list[tuple[int, int, str]] = []
    for s, e, sk in spans:
        if any(s < ce and e > cs for cs, ce, _ in chosen):
            continue
        chosen.append((s, e, sk))
    chosen.sort(key=lambda x: x[0])
    return chosen


def _skills_from_doc(doc, nlp: Language, matcher: PhraseMatcher) -> list[str]:
    raw_spans: list[tuple[int, int, str]] = []
    for match_id, start, end in matcher(doc):
        label = nlp.vocab.strings[match_id]
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
    One spaCy pass: taxonomy skills via PhraseMatcher + shallow linguistic stats for suggestions.
    """
    if not text or not text.strip():
        return [], {"verb_count": 0, "token_count": 0, "sentence_count": 0}

    nlp, matcher = _ensure_nlp_and_matcher()
    snippet = text if len(text) <= _MAX_DOC_CHARS else text[:_MAX_DOC_CHARS]
    doc = nlp(snippet)
    skills = _skills_from_doc(doc, nlp, matcher)
    stats = _nlp_stats(doc)
    return skills, stats


def extract_skills(text: str) -> list[str]:
    """Extract skills using spaCy PhraseMatcher over the skill taxonomy."""
    return extract_skills_and_stats(text)[0]
