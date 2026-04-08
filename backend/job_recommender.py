from __future__ import annotations

import os
import time
from typing import Any

import httpx

from .skills_taxonomy import DEFAULT_SKILLS
from .skills_taxonomy import canonicalize_skill

# Sample in-memory dataset. Replace with DB-backed jobs later.
SAMPLE_JOBS: list[dict] = [
    {
        "title": "Data Analyst",
        "company": "ABC Corp",
        "skills_required": ["python", "sql", "excel", "pandas", "power bi"],
        "description": "Analyze datasets, create dashboards, and present actionable insights.",
    },
    {
        "title": "Backend Python Developer",
        "company": "Nova Systems",
        "skills_required": ["python", "fastapi", "postgres", "docker", "git"],
        "description": "Build scalable APIs, optimize database performance, and deploy services.",
    },
    {
        "title": "Machine Learning Engineer",
        "company": "Insight AI",
        "skills_required": ["python", "scikit-learn", "tensorflow", "pytorch", "sql"],
        "description": "Design and productionize ML models with robust data pipelines.",
    },
    {
        "title": "Full Stack Developer",
        "company": "Pixel Cloud",
        "skills_required": ["react", "javascript", "node.js", "sql", "aws"],
        "description": "Deliver full-stack features with responsive frontend and reliable backend.",
    },
    {
        "title": "DevOps Engineer",
        "company": "CloudBridge",
        "skills_required": ["docker", "kubernetes", "terraform", "aws", "linux"],
        "description": "Automate CI/CD and manage cloud-native deployment infrastructure.",
    },
    {
        "title": "Data Engineer",
        "company": "River Data",
        "skills_required": ["python", "sql", "kafka", "aws", "postgres"],
        "description": "Build data ingestion, transformation, and orchestration pipelines.",
    },
]

_CACHE_TTL_SECONDS = 300
_CACHE: dict[tuple[str, str, int], tuple[float, list[dict[str, Any]]]] = {}
_COURSE_HINTS: dict[str, list[str]] = {
    "react": ["React - The Complete Guide (Udemy)", "Frontend Developer (Meta Professional Certificate)"],
    "aws": ["AWS Cloud Practitioner Essentials", "AWS Developer Associate Prep"],
    "sql": ["SQL for Data Analysis", "Advanced SQL for Analytics"],
    "python": ["Python for Everybody", "Python for Data Science and AI"],
    "docker": ["Docker Mastery", "Containerization Fundamentals"],
    "kubernetes": ["Kubernetes for Developers", "CKA/CKAD Foundations"],
    "fastapi": ["FastAPI - Modern Python APIs", "Building APIs with FastAPI"],
    "scikit-learn": ["Machine Learning with scikit-learn", "Applied ML with Python"],
    "tensorflow": ["DeepLearning.AI TensorFlow Developer", "TensorFlow in Practice"],
    "pytorch": ["Deep Learning with PyTorch", "PyTorch Fundamentals"],
}


def _normalize_skills(skills: list[str]) -> set[str]:
    return {canonicalize_skill(s) for s in skills if s and s.strip()}


def _extract_skills_from_description(text: str) -> list[str]:
    low = (text or "").lower()
    found: list[str] = []
    for skill in DEFAULT_SKILLS:
        s = skill.strip().lower()
        if not s:
            continue
        # Lightweight token containment with punctuation-aware fallback.
        if s in low:
            c = canonicalize_skill(s)
            if c not in found:
                found.append(c)
    return found


def _fetch_jobs_from_adzuna(keywords: list[str], location: str | None, max_results: int = 25) -> list[dict[str, Any]]:
    app_id = os.getenv("ADZUNA_APP_ID", "").strip()
    app_key = os.getenv("ADZUNA_APP_KEY", "").strip()
    country = os.getenv("ADZUNA_COUNTRY", "in").strip().lower() or "in"
    if not app_id or not app_key:
        return []

    query = " ".join(keywords[:6]).strip()
    if not query:
        return []

    params: dict[str, Any] = {
        "app_id": app_id,
        "app_key": app_key,
        "results_per_page": max(5, min(50, max_results)),
        "what": query,
        "content-type": "application/json",
    }
    if location and location.strip():
        params["where"] = location.strip()

    url = f"https://api.adzuna.com/v1/api/jobs/{country}/search/1"
    try:
        with httpx.Client(timeout=6.0) as client:
            response = client.get(url, params=params)
            response.raise_for_status()
            payload = response.json()
    except Exception:
        return []

    rows = payload.get("results", []) if isinstance(payload, dict) else []
    jobs: list[dict[str, Any]] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        title = str(row.get("title") or "").strip()
        company_obj = row.get("company") or {}
        company = str(company_obj.get("display_name") if isinstance(company_obj, dict) else "").strip()
        description = str(row.get("description") or "").strip()
        if not title:
            continue
        skills_required = _extract_skills_from_description(description)
        jobs.append(
            {
                "title": title,
                "company": company or "Unknown Company",
                "skills_required": skills_required,
                "description": description,
            }
        )
    return jobs


def _cache_key(resume_skills: list[str], location: str | None, top_k: int) -> tuple[str, str, int]:
    normalized = sorted(_normalize_skills(resume_skills))
    loc = (location or "").strip().lower()
    return ("|".join(normalized), loc, top_k)


def _cached_jobs(key: tuple[str, str, int]) -> list[dict[str, Any]] | None:
    item = _CACHE.get(key)
    if not item:
        return None
    ts, data = item
    if (time.time() - ts) > _CACHE_TTL_SECONDS:
        _CACHE.pop(key, None)
        return None
    return data


def _set_cached_jobs(key: tuple[str, str, int], data: list[dict[str, Any]]) -> None:
    _CACHE[key] = (time.time(), data)


def _build_improvement_suggestions(missing_skills: list[str], matched_skills: list[str]) -> dict[str, Any]:
    missing = [m for m in missing_skills if m]
    suggestions: list[str] = []
    courses: list[str] = []

    if missing:
        top_gaps = ", ".join(missing[:3])
        suggestions.append(f"Prioritize learning these role-critical skills: {top_gaps}.")
        suggestions.append("Add project bullets demonstrating measurable impact with these skills.")
        suggestions.append("Mirror job-description terminology in your resume summary and experience bullets.")
    else:
        suggestions.append("You already match core skills. Improve role fit with stronger quantified achievements.")
        suggestions.append("Tailor your resume headline and top projects to the job domain.")

    for skill in missing[:4]:
        for course in _COURSE_HINTS.get(skill, []):
            if course not in courses:
                courses.append(course)
    if not courses and missing:
        courses.append("Use targeted role-based courses on Coursera/Udemy/LinkedIn Learning.")

    return {
        "improvement_suggestions": suggestions,
        "recommended_courses": courses,
        "gap_severity": "high" if len(missing) >= 4 else ("medium" if len(missing) >= 2 else "low"),
        "matched_skills_count": len(matched_skills),
    }


def recommend_jobs(resume_skills: list[str], top_k: int = 5, location: str | None = None) -> list[dict]:
    """
    Rank jobs by skill overlap.
    match % = (matched skills / total job skills) * 100
    """
    cache_key = _cache_key(resume_skills, location, top_k)
    cached = _cached_jobs(cache_key)
    if cached is not None:
        return cached

    resume_set = _normalize_skills(resume_skills)
    live_jobs = _fetch_jobs_from_adzuna(sorted(resume_set), location, max_results=25)
    candidate_jobs = live_jobs if live_jobs else SAMPLE_JOBS
    results: list[dict] = []

    for job in candidate_jobs:
        job_skills_raw = [str(s) for s in job.get("skills_required", [])]
        job_set = _normalize_skills(job_skills_raw)
        if not job_set:
            # If API job doesn't include skills, try extracting on the fly from description.
            extracted = _extract_skills_from_description(str(job.get("description", "")))
            job_set = _normalize_skills(extracted)
        if not job_set:
            continue

        matched = sorted(resume_set & job_set)
        missing = sorted(job_set - resume_set)
        match_percentage = int(round((len(matched) / len(job_set)) * 100))
        improvements = _build_improvement_suggestions(missing, matched)

        results.append(
            {
                "title": str(job.get("title", "")),
                "company": str(job.get("company", "")),
                "match_percentage": match_percentage,
                "missing_skills": missing,
                "description": str(job.get("description", "")),
                "matched_skills": matched,
                "improvement_suggestions": improvements["improvement_suggestions"],
                "recommended_courses": improvements["recommended_courses"],
                "gap_severity": improvements["gap_severity"],
            }
        )

    results.sort(key=lambda x: (-x["match_percentage"], x["title"]))
    top = results[:top_k]
    _set_cached_jobs(cache_key, top)
    return top

