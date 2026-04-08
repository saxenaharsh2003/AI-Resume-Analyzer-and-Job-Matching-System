from __future__ import annotations

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .analyzer import analyze_resume
from .auth import authenticate_user, create_user, init_auth_db, issue_token
from .nlp_skills import SpacyModelError


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


def create_app() -> FastAPI:
    app = FastAPI(
        title="Resume Analyzer API",
        version="0.1.0",
        description="Upload a resume (PDF/DOCX) to extract skills and compute an ATS-style score.",
    )

    # Safe defaults for local dev; tighten origins in production.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    init_auth_db()

    @app.get("/healthz")
    def healthz() -> dict:
        return {"status": "ok"}

    @app.post("/signup")
    def signup(payload: SignupRequest) -> dict:
        try:
            user = create_user(payload.name, payload.email, payload.password)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e
        return {"name": user["name"], "email": user["email"], "token": issue_token()}

    @app.post("/login")
    def login(payload: LoginRequest) -> dict:
        user = authenticate_user(payload.email, payload.password)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password.")
        return {"name": user["name"], "email": user["email"], "token": issue_token()}

    @app.post("/api/v1/analyze")
    async def analyze(
        resume: UploadFile = File(...),
        job_description: str | None = Form(None),
        location: str | None = Form(None),
    ) -> dict:
        """
        Multipart form-data endpoint.

        - `resume`: PDF/DOCX file
        - `job_description`: optional text to score against
        """
        filename = (resume.filename or "").strip()
        if not filename:
            raise HTTPException(status_code=400, detail="Missing filename.")

        content = await resume.read()
        if not content:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        try:
            result = analyze_resume(
                filename=filename,
                content_type=resume.content_type,
                content=content,
                job_description=job_description,
                location=location,
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e
        except SpacyModelError as e:
            raise HTTPException(status_code=503, detail=str(e)) from e
        except Exception as e:
            raise HTTPException(status_code=500, detail="Failed to analyze resume.") from e

        return result

    return app


app = create_app()
