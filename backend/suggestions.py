from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class Suggestion:
    category: str
    message: str
    priority: str  # "high" | "medium" | "low"

    def to_dict(self) -> dict[str, str]:
        return {
            "category": self.category,
            "message": self.message,
            "priority": self.priority,
        }


def build_suggestions(
    *,
    resume_text: str,
    has_email: bool,
    has_phone: bool,
    sections: list[str],
    skills: list[str],
    ats_score: int,
    ats_breakdown: dict[str, Any],
    job_description: str | None,
    nlp_stats: dict[str, int] | None = None,
) -> list[dict[str, str]]:
    """
    Actionable suggestions from ATS breakdown, contact/section heuristics, and JD gaps.
    """
    out: list[Suggestion] = []
    section_set = set(sections)
    jd = (job_description or "").strip()

    if not has_email:
        out.append(
            Suggestion(
                "contact",
                "Add a professional email address in the header so ATS and recruiters can reach you.",
                "high",
            )
        )
    if not has_phone:
        out.append(
            Suggestion(
                "contact",
                "Include a phone number (optional but common on ATS-friendly resumes).",
                "low",
            )
        )

    needed = {"experience", "education", "skills"}
    missing_sections = sorted(needed - section_set)
    if missing_sections:
        out.append(
            Suggestion(
                "structure",
                f"Use clear section headings for: {', '.join(missing_sections)}. "
                "ATS parsers look for standard labels like Experience, Education, Skills.",
                "high",
            )
        )

    n_chars = len(resume_text)
    if n_chars < 400:
        out.append(
            Suggestion(
                "length",
                "Resume text looks very short. Add impact bullets with metrics (%, $, time saved) under Experience.",
                "medium",
            )
        )
    elif n_chars > 20_000:
        out.append(
            Suggestion(
                "length",
                "Text is very long; consider tightening to 1–2 pages and moving older roles to brief lines.",
                "low",
            )
        )

    if len(skills) < 5:
        out.append(
            Suggestion(
                "keywords",
                "Surface more technical skills in a dedicated Skills section (tools, languages, frameworks).",
                "medium",
            )
        )

    jd_skills = list(ats_breakdown.get("job_skills") or [])
    if jd and jd_skills:
        resume_set = set(skills)
        missing_jd = [s for s in jd_skills if s not in resume_set]
        if missing_jd:
            preview = ", ".join(missing_jd[:12])
            suffix = f" (+{len(missing_jd) - 12} more)" if len(missing_jd) > 12 else ""
            out.append(
                Suggestion(
                    "job_match",
                    f"Job description emphasizes skills not clearly on your resume: {preview}{suffix}. "
                    "Add them honestly if you have the experience (wording can mirror the posting).",
                    "high",
                )
            )
    elif jd and not jd_skills:
        out.append(
            Suggestion(
                "job_match",
                "Fewer taxonomy skills matched in the job text; paste the full JD for stronger keyword overlap signals.",
                "low",
            )
        )

    if ats_score < 45:
        out.append(
            Suggestion(
                "ats",
                "Overall ATS signal is low: use a simple single-column layout, standard fonts, and bullets "
                "rather than text boxes or scanned images.",
                "high",
            )
        )
    elif ats_score < 65:
        out.append(
            Suggestion(
                "ats",
                "Good baseline; tighten keyword overlap with the role and ensure section headings match common ATS patterns.",
                "medium",
            )
        )

    stats = nlp_stats or {}
    sents = int(stats.get("sentence_count") or 0)
    verbs = int(stats.get("verb_count") or 0)
    if sents >= 4 and verbs > 0 and (verbs / sents) < 0.85:
        out.append(
            Suggestion(
                "writing",
                "Experience bullets look light on strong verbs (spaCy POS). Lead with past-tense "
                "verbs: Built, Led, Reduced, Automated, Shipped.",
                "medium",
            )
        )

    kb = ats_breakdown.get("keyword_points", 0) or 0
    if jd and float(kb) < 5:
        out.append(
            Suggestion(
                "keywords",
                "Increase overlap with the job description by mirroring role-relevant nouns and phrases "
                "(without keyword stuffing).",
                "medium",
            )
        )

    # Deduplicate by (category, message)
    seen: set[tuple[str, str]] = set()
    unique: list[Suggestion] = []
    for s in out:
        key = (s.category, s.message)
        if key in seen:
            continue
        seen.add(key)
        unique.append(s)

    priority_rank = {"high": 0, "medium": 1, "low": 2}
    unique.sort(key=lambda x: priority_rank.get(x.priority, 9))
    return [s.to_dict() for s in unique]
