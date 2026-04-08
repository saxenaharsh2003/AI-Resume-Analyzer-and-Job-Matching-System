from __future__ import annotations

import base64
import hashlib
import os
import re
import secrets
import sqlite3
from pathlib import Path

_EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
_DB_PATH = Path(__file__).resolve().parent / "auth.db"


def _db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_auth_db() -> None:
    with _db_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.commit()


def _hash_password(password: str) -> str:
    salt = os.urandom(16)
    iterations = 240000
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return f"{iterations}${base64.b64encode(salt).decode()}${base64.b64encode(key).decode()}"


def _verify_password(password: str, stored_hash: str) -> bool:
    try:
        iterations_str, salt_b64, hash_b64 = stored_hash.split("$", 2)
        iterations = int(iterations_str)
        salt = base64.b64decode(salt_b64.encode())
        expected = base64.b64decode(hash_b64.encode())
    except Exception:
        return False
    candidate = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return secrets.compare_digest(candidate, expected)


def _validate_email(email: str) -> bool:
    return bool(_EMAIL_RE.match(email.strip().lower()))


def create_user(name: str, email: str, password: str) -> dict:
    name = name.strip()
    email = email.strip().lower()
    if len(name) < 2:
        raise ValueError("Name must be at least 2 characters.")
    if not _validate_email(email):
        raise ValueError("Invalid email format.")
    if len(password) < 6:
        raise ValueError("Password must be at least 6 characters.")

    password_hash = _hash_password(password)

    try:
        with _db_connection() as conn:
            cur = conn.execute(
                "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
                (name, email, password_hash),
            )
            conn.commit()
            user_id = int(cur.lastrowid)
    except sqlite3.IntegrityError as e:
        raise ValueError("Email is already registered.") from e

    return {"id": user_id, "name": name, "email": email}


def authenticate_user(email: str, password: str) -> dict | None:
    email = email.strip().lower()
    with _db_connection() as conn:
        row = conn.execute(
            "SELECT id, name, email, password_hash FROM users WHERE email = ?",
            (email,),
        ).fetchone()
    if not row:
        return None
    if not _verify_password(password, str(row["password_hash"])):
        return None
    return {"id": int(row["id"]), "name": str(row["name"]), "email": str(row["email"])}


def issue_token() -> str:
    return secrets.token_urlsafe(32)

