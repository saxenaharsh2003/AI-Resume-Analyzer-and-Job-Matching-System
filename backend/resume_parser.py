from __future__ import annotations

import io
import os
import re
import tempfile
from dataclasses import dataclass

import docx2txt
from PyPDF2 import PdfReader
from PyPDF2.errors import PdfReadError

from .nlp_skills import extract_skills


_EMAIL_RE = re.compile(r"\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b")
_PHONE_RE = re.compile(
    r"(?:(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4})"
)
_BULLET_PREFIX_RE = re.compile(r"^[\-\*\u2022\u25AA\u25CF\+\>]+\s*")
_YEAR_RE = re.compile(r"\b(19\d{2}|20\d{2})\b")

_EDU_KEYWORDS = {
    "university",
    "college",
    "bachelor",
    "master",
    "phd",
    "b.tech",
    "m.tech",
    "b.e",
    "m.e",
    "bsc",
    "msc",
    "diploma",
    "school",
    "cgpa",
    "gpa",
}
_EXP_KEYWORDS = {
    "experience",
    "worked",
    "engineer",
    "developer",
    "intern",
    "analyst",
    "manager",
    "consultant",
    "lead",
    "responsible",
    "designed",
    "built",
    "implemented",
}
_PROJECT_KEYWORDS = {
    "project",
    "github",
    "developed",
    "built",
    "designed",
    "implemented",
    "application",
    "system",
    "platform",
    "api",
    "model",
}


class ResumeExtractionError(ValueError):
    """Base class for resume text extraction errors."""


class UnsupportedFileTypeError(ResumeExtractionError):
    """Raised when the uploaded file extension/content type is not supported."""


class EmptyFileError(ResumeExtractionError):
    """Raised when the uploaded file has no content."""


def _normalize_whitespace(text: str) -> str:
    text = text.replace("\x00", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _ext_from_filename(filename: str) -> str:
    parts = filename.lower().rsplit(".", 1)
    return f".{parts[1]}" if len(parts) == 2 else ""


def extract_text_from_pdf(content: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(content))
        pages = []
        for page in reader.pages:
            pages.append(page.extract_text() or "")
        text = "\n".join(pages)
    except PdfReadError as e:
        raise ResumeExtractionError("Invalid or corrupted PDF file.") from e
    except Exception as e:
        raise ResumeExtractionError("Failed to extract text from PDF.") from e

    normalized = _normalize_whitespace(text)
    if not normalized:
        raise ResumeExtractionError("PDF text extraction returned empty content.")
    return normalized


def extract_text_from_docx(content: bytes) -> str:
    temp_path = ""
    try:
        with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as tmp:
            tmp.write(content)
            temp_path = tmp.name
        text = docx2txt.process(temp_path) or ""
    except Exception as e:
        raise ResumeExtractionError("Failed to extract text from DOCX.") from e
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                # Best effort cleanup only.
                pass

    normalized = _normalize_whitespace(text)
    if not normalized:
        raise ResumeExtractionError("DOCX text extraction returned empty content.")
    return normalized


def extract_text(filename: str, content_type: str | None, content: bytes) -> str:
    """
    Best-effort text extraction from PDF/DOCX.
    """
    if not content:
        raise EmptyFileError("Uploaded file is empty.")

    ext = _ext_from_filename(filename)
    ctype = (content_type or "").lower()

    if ext == ".pdf" or ctype == "application/pdf":
        return extract_text_from_pdf(content)
    if ext == ".docx" or ctype in {
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    }:
        return extract_text_from_docx(content)

    raise UnsupportedFileTypeError("Unsupported file type. Please upload a .pdf or .docx.")


def _guess_name(text: str) -> str | None:
    # Heuristic: first non-empty line with 2-4 words and few punctuation characters.
    for line in text.splitlines()[:10]:
        s = line.strip()
        if not s:
            continue
        if len(s) > 60:
            continue
        if any(ch.isdigit() for ch in s):
            continue
        if re.search(r"[@/\\|]", s):
            continue
        words = [w for w in re.split(r"\s+", s) if w]
        if 2 <= len(words) <= 4:
            return s
    return None


def _clean_line(line: str) -> str:
    line = _BULLET_PREFIX_RE.sub("", line.strip())
    return re.sub(r"\s+", " ", line).strip(" -|\t")


def _is_probable_section_header(line: str) -> bool:
    s = _clean_line(line).lower().strip(":")
    if not s or len(s) > 40:
        return False
    if _YEAR_RE.search(s):
        return False
    return s in {
        "summary",
        "professional summary",
        "experience",
        "work experience",
        "education",
        "projects",
        "skills",
        "technical skills",
        "certifications",
        "awards",
        "publications",
    }


def _split_sections(text: str) -> dict[str, list[str]]:
    """
    Segment resume text by probable section headers.
    """
    lines = [ln.rstrip() for ln in text.splitlines()]
    sections: dict[str, list[str]] = {}
    current = "general"
    sections[current] = []

    for raw in lines:
        line = raw.strip()
        if not line:
            continue
        if _is_probable_section_header(line):
            current = _clean_line(line).lower().strip(":")
            sections.setdefault(current, [])
            continue
        sections.setdefault(current, []).append(line)

    return sections


def _top_lines_by_keywords(
    lines: list[str],
    keywords: set[str],
    *,
    limit: int = 10,
) -> list[str]:
    scored: list[tuple[int, str]] = []
    for line in lines:
        cleaned = _clean_line(line)
        if len(cleaned) < 3:
            continue
        low = cleaned.lower()
        hits = sum(1 for kw in keywords if kw in low)
        if hits == 0 and not _YEAR_RE.search(low):
            continue
        scored.append((hits + (1 if _YEAR_RE.search(low) else 0), cleaned))

    scored.sort(key=lambda x: (-x[0], -len(x[1])))
    out: list[str] = []
    seen: set[str] = set()
    for _, item in scored:
        key = item.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(item)
        if len(out) >= limit:
            break
    return out


def _extract_education(sections: dict[str, list[str]]) -> list[str]:
    edu_lines = sections.get("education", []) + sections.get("academic background", [])
    if edu_lines:
        out = [_clean_line(x) for x in edu_lines if _clean_line(x)]
        return out[:12]

    all_lines: list[str] = []
    for vals in sections.values():
        all_lines.extend(vals)
    return _top_lines_by_keywords(all_lines, _EDU_KEYWORDS, limit=8)


def _extract_experience(sections: dict[str, list[str]]) -> list[str]:
    exp_lines = sections.get("experience", []) + sections.get("work experience", [])
    if exp_lines:
        out = [_clean_line(x) for x in exp_lines if _clean_line(x)]
        return out[:18]

    all_lines: list[str] = []
    for vals in sections.values():
        all_lines.extend(vals)
    return _top_lines_by_keywords(all_lines, _EXP_KEYWORDS, limit=12)


def _extract_projects(sections: dict[str, list[str]]) -> list[str]:
    proj_lines = sections.get("projects", [])
    if proj_lines:
        out = [_clean_line(x) for x in proj_lines if _clean_line(x)]
        return out[:15]

    all_lines: list[str] = []
    for vals in sections.values():
        all_lines.extend(vals)
    return _top_lines_by_keywords(all_lines, _PROJECT_KEYWORDS, limit=10)


def _extract_skills(sections: dict[str, list[str]], text: str) -> list[str]:
    skill_text_parts = []
    for key in ("skills", "technical skills"):
        if key in sections:
            skill_text_parts.extend(sections[key])
    skill_text = "\n".join(skill_text_parts).strip() or text
    return extract_skills(skill_text)


@dataclass(frozen=True)
class ParsedResume:
    text: str
    name: str | None
    email: str | None
    phone: str | None
    sections: list[str]
    skills: list[str]
    education: list[str]
    experience: list[str]
    projects: list[str]


def parse_resume_text(text: str) -> ParsedResume:
    email = _EMAIL_RE.search(text)
    phone = _PHONE_RE.search(text)
    sections_map = _split_sections(text)
    section_names = sorted(k for k in sections_map.keys() if k != "general")
    skills = _extract_skills(sections_map, text)
    education = _extract_education(sections_map)
    experience = _extract_experience(sections_map)
    projects = _extract_projects(sections_map)
    return ParsedResume(
        text=text,
        name=_guess_name(text),
        email=email.group(0) if email else None,
        phone=phone.group(0) if phone else None,
        sections=section_names,
        skills=skills,
        education=education,
        experience=experience,
        projects=projects,
    )
