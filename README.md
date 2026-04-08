## Resume Analyzer (FastAPI)

### What this backend does
- **File upload**: `POST /api/v1/analyze` accepts a resume as PDF/DOCX (`multipart/form-data`).
- **Resume parsing**: extracts text + basic fields (name/email/phone/section headers).
- **Skill extraction**: spaCy `en_core_web_sm` + **PhraseMatcher** over a curated taxonomy (`backend/skills_taxonomy.py`).
- **ATS scoring**: transparent 0–100 heuristic + breakdown (`backend/job_matcher.py`).
- **Suggestions**: prioritized tips (contact, structure, JD keywords, writing/spaCy verb signal) (`backend/suggestions.py`).

### Run locally (Windows / PowerShell)

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn backend.app:app --reload --host 127.0.0.1 --port 8000
```

If the spaCy model is missing, `POST /api/v1/analyze` returns **503** with install instructions.

Open docs at `http://127.0.0.1:8000/docs`.

### API usage
- **Health**: `GET /healthz`
- **Analyze**: `POST /api/v1/analyze`
  - form-data:
    - `resume` (file, required)
    - `job_description` *(optional)* — improves keyword overlap and suggestions for missing skills

Response includes `skills`, `ats` (`score`, `breakdown`), `nlp.stats`, and `suggestions`.

### Code map
- `backend/app.py`: FastAPI app + endpoints
- `backend/analyzer.py`: pipeline orchestrator
- `backend/resume_parser.py`: PDF/DOCX text extraction + basic parsing
- `backend/skills_taxonomy.py`: skill list + canonical names
- `backend/nlp_skills.py`: spaCy skill extraction + shallow NLP stats
- `backend/job_matcher.py`: ATS scoring (uses spaCy skills for JD)
- `backend/suggestions.py`: recommendation builder
