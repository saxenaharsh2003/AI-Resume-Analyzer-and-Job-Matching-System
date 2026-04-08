from __future__ import annotations

import re

# Curated taxonomy; extend or load from DB/YAML in production.
DEFAULT_SKILLS: list[str] = [
    "python",
    "java",
    "react",
    "reactjs",
    "react.js",
    "javascript",
    "typescript",
    "go",
    "c++",
    "c#",
    "sql",
    "fastapi",
    "django",
    "flask",
    "spring",
    "node.js",
    ".net",
    "pandas",
    "numpy",
    "scikit-learn",
    "pytorch",
    "tensorflow",
    "docker",
    "kubernetes",
    "aws",
    "gcp",
    "azure",
    "terraform",
    "linux",
    "git",
    "ci/cd",
    "postgres",
    "postgresql",
    "mysql",
    "mongodb",
    "redis",
    "elasticsearch",
    "kafka",
    "rabbitmq",
    "pytest",
    "unit testing",
    "integration testing",
]


def canonicalize_skill(skill: str) -> str:
    s = skill.strip().lower()
    s = s.replace("postgresql", "postgres")
    s = s.replace("node.js", "node")
    s = s.replace("ci/cd", "cicd")
    return s


def skill_regex_pattern(skill: str) -> re.Pattern[str]:
    escaped = re.escape(skill)
    if any(ch.isalnum() for ch in skill):
        return re.compile(rf"(?i)(?<!\w){escaped}(?!\w)")
    return re.compile(rf"(?i){escaped}")
