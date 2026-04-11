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
```

This installs **spaCy** only (`requirements.txt`). The **`en_core_web_sm`** language model is not a pip dependency; install it in the **same** venv you use for uvicorn.

**Automatic model install:** When the backend imports `nlp_skills`, it tries `spacy.load("en_core_web_sm")`. If that fails, it runs `python -m spacy download en_core_web_sm` (via the current interpreter) and loads again. If download/load still fails, NLP-backed skill extraction is skipped and **`/api/v1/analyze` still returns 200**.

**Manual install** (recommended for production / offline):

```powershell
python -m spacy download en_core_web_sm
```

Then start the API:

```powershell
uvicorn backend.app:app --reload --host 127.0.0.1 --port 8000
```

If the model cannot be loaded or installed (e.g. offline), `nlp_skills` logs the error and **`POST /api/v1/analyze` still returns 200** with NLP-backed JD skill extraction empty; resume parsing and other scoring continue. Install the model in the same venv as uvicorn to restore full behavior.

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
