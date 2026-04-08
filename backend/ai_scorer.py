from __future__ import annotations

import json
import os
from dataclasses import dataclass


@dataclass(frozen=True)
class AiScoreResult:
    ai_feedback: str
    ai_score: int


def _coerce_score(value: object, fallback: int = 0) -> int:
    try:
        score = int(float(value))
    except (TypeError, ValueError):
        score = fallback
    return max(0, min(100, score))


def analyze_resume_with_openai(
    *,
    resume_text: str,
    job_description: str | None,
    fallback_score: int = 0,
) -> AiScoreResult:
    """
    Use OpenAI to generate ATS-style feedback and score.
    Returns a safe fallback when API key/model call fails.
    """
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        return AiScoreResult(
            ai_feedback="OpenAI feedback unavailable. Set OPENAI_API_KEY to enable GPT resume analysis.",
            ai_score=fallback_score,
        )

    try:
        from openai import OpenAI
    except Exception:
        return AiScoreResult(
            ai_feedback="OpenAI package is not installed in the active backend environment.",
            ai_score=fallback_score,
        )

    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    client = OpenAI(api_key=api_key, timeout=15.0)

    prompt = f"""
You are an expert ATS resume reviewer.
Analyze the resume and provide:
1) ATS score (0-100)
2) Concise actionable improvements.

Return strict JSON only with this schema:
{{
  "ai_score": 0,
  "ai_feedback": "..."
}}

Resume:
\"\"\"{resume_text[:12000]}\"\"\"

Job Description:
\"\"\"{(job_description or '').strip()[:6000]}\"\"\"
"""

    try:
        response = client.responses.create(
            model=model,
            input=prompt,
            temperature=0.2,
            max_output_tokens=500,
        )
        raw = (response.output_text or "").strip()
        parsed = json.loads(raw) if raw else {}
        ai_feedback = str(parsed.get("ai_feedback") or "").strip()
        if not ai_feedback:
            ai_feedback = "AI analysis complete, but no feedback text was returned."
        ai_score = _coerce_score(parsed.get("ai_score"), fallback=fallback_score)
        return AiScoreResult(ai_feedback=ai_feedback, ai_score=ai_score)
    except Exception:
        return AiScoreResult(
            ai_feedback="AI feedback temporarily unavailable due to an OpenAI request error.",
            ai_score=fallback_score,
        )

