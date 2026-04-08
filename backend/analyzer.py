from __future__ import annotations

try:
    from .ai_scorer import analyze_resume_with_openai
    from .job_matcher import tfidf_job_match_percentage
    from .job_recommender import recommend_jobs
    from .nlp_skills import extract_skills
    from .resume_parser import extract_text, parse_resume_text
except ImportError:  # Allows imports when backend is cwd
    from ai_scorer import analyze_resume_with_openai
    from job_matcher import tfidf_job_match_percentage
    from job_recommender import recommend_jobs
    from nlp_skills import extract_skills
    from resume_parser import extract_text, parse_resume_text


def _structured_score(
    *,
    skills: list[str],
    education: list[str],
    experience: list[str],
    projects: list[str],
) -> tuple[int, dict]:
    """
    0-100 score for structured resume completeness:
    - skills count (up to 45)
    - experience presence/detail (up to 30)
    - education presence/detail (up to 20)
    - projects signal (up to 5)
    """
    skills_points = min(45.0, len(skills) * 4.5)
    experience_points = 0.0 if not experience else min(30.0, 15.0 + len(experience) * 3.0)
    education_points = 0.0 if not education else min(20.0, 10.0 + len(education) * 2.5)
    projects_points = min(5.0, len(projects) * 1.5)
    total = int(round(max(0.0, min(100.0, skills_points + experience_points + education_points + projects_points))))
    return total, {
        "skills_points": round(skills_points, 2),
        "experience_points": round(experience_points, 2),
        "education_points": round(education_points, 2),
        "projects_points": round(projects_points, 2),
    }


def analyze_resume(
    *,
    filename: str,
    content_type: str | None,
    content: bytes,
    job_description: str | None,
    location: str | None = None,
) -> dict:
    """
    Pipeline: file -> text -> structured parsing -> scoring -> job matching.
    """
    text = extract_text(filename=filename, content_type=content_type, content=content)
    if not text:
        raise ValueError("Could not extract text from the uploaded file.")

    parsed = parse_resume_text(text)
    score, score_breakdown = _structured_score(
        skills=parsed.skills,
        education=parsed.education,
        experience=parsed.experience,
        projects=parsed.projects,
    )
    match_percentage = tfidf_job_match_percentage(parsed.text, job_description)
    jd_skills = extract_skills(job_description or "")
    resume_skill_set = set(parsed.skills)
    jd_skill_set = set(jd_skills)
    matched_skills = sorted(resume_skill_set & jd_skill_set) if jd_skill_set else []
    missing_skills = sorted(jd_skill_set - resume_skill_set) if jd_skill_set else []
    recommended_jobs = recommend_jobs(parsed.skills, top_k=5, location=location)
    ai = analyze_resume_with_openai(
        resume_text=parsed.text,
        job_description=job_description,
        fallback_score=score,
    )

    strengths: list[str] = []
    weaknesses: list[str] = []
    suggestions: list[str] = []
    if len(parsed.skills) >= 6:
        strengths.append("Strong skill coverage across technical areas.")
    else:
        weaknesses.append("Limited number of clearly identified technical skills.")
        suggestions.append("Add a dedicated Skills section with core tools and frameworks.")
    if parsed.experience:
        strengths.append("Experience section detected with role history.")
    else:
        weaknesses.append("Experience details are missing or minimal.")
        suggestions.append("Add role-wise achievements with measurable impact.")
    if parsed.education:
        strengths.append("Education information is present.")
    else:
        weaknesses.append("Education details are not clearly listed.")
        suggestions.append("Add degree, institution, and graduation timeline.")
    if parsed.projects:
        strengths.append("Projects demonstrate practical application.")
    else:
        suggestions.append("Include 1-2 projects with outcomes and technologies used.")
    if missing_skills:
        suggestions.append(f"To improve job fit, prioritize: {', '.join(missing_skills[:5])}.")
    if not suggestions:
        suggestions.append("Tailor resume keywords and achievements to the target role.")

    return {
        "resume": {
            "name": parsed.name or "",
            "email": parsed.email or "",
            "skills": parsed.skills,
            "education": "\n".join(parsed.education),
            "experience": "\n".join(parsed.experience),
            "projects": parsed.projects,
        },
        "analysis": {
            "score": score,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "suggestions": suggestions,
            "ai_feedback": ai.ai_feedback,
            "ai_score": ai.ai_score,
        },
        "job_match": {
            "match_percentage": match_percentage,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
        },
        # Kept for dashboard compatibility and richer UI sections.
        "recommended_jobs": recommended_jobs,
        "meta": {
            "sections": parsed.sections,
            "text_length": len(parsed.text),
            "text_preview": parsed.text[:1200],
            "score_breakdown": score_breakdown,
            "counts": {
                "skills": len(parsed.skills),
                "education": len(parsed.education),
                "experience": len(parsed.experience),
                "projects": len(parsed.projects),
            },
            "file": {"filename": filename, "content_type": content_type},
        },
    }
