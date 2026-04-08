from __future__ import annotations

import math
import re
from dataclasses import dataclass

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

try:
    from .nlp_skills import extract_skills
except ImportError:  # Allows imports when backend is cwd
    from nlp_skills import extract_skills

_WORD_RE = re.compile(r"[a-zA-Z][a-zA-Z0-9+#.-]{1,}")
_STOPWORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "has",
    "have",
    "in",
    "is",
    "it",
    "of",
    "on",
    "or",
    "that",
    "the",
    "to",
    "with",
    "you",
    "your",
}


def _tokens(text: str) -> set[str]:
    toks: set[str] = set()
    for w in _WORD_RE.findall(text.lower()):
        w = w.strip(".-")
        if len(w) < 3:
            continue
        if w in _STOPWORDS:
            continue
        toks.add(w)
    return toks


@dataclass(frozen=True)
class AtsScore:
    score: int
    breakdown: dict


def tfidf_job_match_percentage(resume_text: str, job_description: str | None) -> int:
    """
    Compute resume-to-JD match percentage using TF-IDF + cosine similarity.

    Returns an integer in range [0, 100].
    """
    jd = (job_description or "").strip()
    rt = (resume_text or "").strip()
    if not jd or not rt:
        return 0

    try:
        vectorizer = TfidfVectorizer(
            lowercase=True,
            stop_words="english",
            ngram_range=(1, 2),
            min_df=1,
            sublinear_tf=True,
            norm="l2",
        )
        matrix = vectorizer.fit_transform([rt, jd])
        similarity = float(cosine_similarity(matrix[0:1], matrix[1:2])[0][0])
    except ValueError:
        # Happens if vocabulary is empty after tokenization/stop-word filtering.
        similarity = 0.0

    return int(round(max(0.0, min(1.0, similarity)) * 100))


def ats_score(
    resume_text: str,
    resume_skills: list[str],
    job_description: str | None,
    *,
    has_email: bool,
    has_phone: bool,
    sections: list[str],
) -> AtsScore:
    """
    ATS-style heuristic score (0-100): hygiene, taxonomy skill match, keyword overlap.
    Skill lists for JD use the same spaCy-backed extract_skills().
    """
    jd = (job_description or "").strip()

    hygiene_points = 0.0
    hygiene_points += 4.0 if has_email else 0.0
    hygiene_points += 3.0 if has_phone else 0.0

    needed_sections = {"experience", "education", "skills"}
    section_hits = len({s for s in sections} & needed_sections)
    hygiene_points += min(5.0, section_hits * (5.0 / len(needed_sections)))

    n_chars = len(resume_text)
    if 500 <= n_chars <= 12000:
        hygiene_points += 3.0
    elif 200 <= n_chars <= 20000:
        hygiene_points += 1.5

    skill_points = 0.0
    keyword_points = 0.0
    jd_skills: list[str] = []

    if jd:
        jd_skills = extract_skills(jd)
        resume_set = set(resume_skills)
        jd_set = set(jd_skills)

        if jd_set:
            skill_match_ratio = len(resume_set & jd_set) / len(jd_set)
        else:
            skill_match_ratio = 0.0

        skill_points = 60.0 * skill_match_ratio

        r_tok = _tokens(resume_text)
        j_tok = _tokens(jd)
        if r_tok and j_tok:
            jacc = len(r_tok & j_tok) / len(r_tok | j_tok)
            keyword_points = 25.0 * math.sqrt(jacc)
    else:
        skill_points = min(35.0, 5.0 * math.log(1.0 + len(resume_skills)))
        keyword_points = 0.0

    total = hygiene_points + skill_points + keyword_points
    total_int = int(round(max(0.0, min(100.0, total))))

    return AtsScore(
        score=total_int,
        breakdown={
            "hygiene_points": round(hygiene_points, 2),
            "skill_points": round(skill_points, 2),
            "keyword_points": round(keyword_points, 2),
            "resume_skills_count": len(resume_skills),
            "job_skills_count": len(jd_skills),
            "job_skills": jd_skills,
        },
    )
