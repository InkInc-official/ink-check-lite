"""
Ink Check Lite — バックエンドサーバー
Ink Inc. | AI Creation, Human Care. The Future Drawn Together.
https://github.com/InkInc-official/ink-check-lite
"""

import sqlite3
import os
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

DATABASE_PATH = os.getenv("DATABASE_PATH", "./ink_check_lite.db")


# ── DB ───────────────────────────────────────

def get_conn():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_conn()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS responses (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            liver_name    TEXT    NOT NULL,
            submitted_at  DATETIME NOT NULL,
            score_private INTEGER NOT NULL,
            score_rest    INTEGER NOT NULL,
            score_rhythm  INTEGER NOT NULL,
            score_mental  INTEGER NOT NULL,
            score_fan     INTEGER NOT NULL,
            score_stream  INTEGER NOT NULL,
            memo          TEXT,
            alert_level   TEXT    NOT NULL
        )
    """)
    conn.commit()
    conn.close()
    print("[Ink Check Lite] DB初期化完了")


# ── アラート判定（単発のみ）────────────────────

def analyze_simple(scores: list[int], has_text: bool) -> str:
    # RED: 5が2項目以上
    if sum(1 for s in scores if s == 5) >= 2:
        return "RED"
    # YELLOW: 4以上が1項目以上 or テキスト記入あり or 3以上が3項目以上
    if any(s >= 4 for s in scores):
        return "YELLOW"
    if sum(1 for s in scores if s >= 3) >= 3:
        return "YELLOW"
    if has_text:
        return "YELLOW"
    return "GREEN"


# ── モデル ────────────────────────────────────

class CheckForm(BaseModel):
    liver_name:    str = Field(..., min_length=1)
    score_private: int = Field(..., ge=1, le=5)
    score_rest:    int = Field(..., ge=1, le=5)
    score_rhythm:  int = Field(..., ge=1, le=5)
    score_mental:  int = Field(..., ge=1, le=5)
    score_fan:     int = Field(..., ge=1, le=5)
    score_stream:  int = Field(..., ge=1, le=5)
    memo:          Optional[str] = None


# ── FastAPI ───────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    print("[Ink Check Lite] 起動完了 → http://0.0.0.0:8080")
    yield


app = FastAPI(title="Ink Check Lite", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_DIR = Path(__file__).parent / "frontend"


# ── API ──────────────────────────────────────

@app.post("/api/submit")
def submit(form: CheckForm):
    scores = [
        form.score_private, form.score_rest, form.score_rhythm,
        form.score_mental, form.score_fan, form.score_stream,
    ]
    has_text = bool(form.memo and form.memo.strip())
    alert_level = analyze_simple(scores, has_text)
    submitted_at = datetime.now()

    conn = get_conn()
    conn.execute("""
        INSERT INTO responses (
            liver_name, submitted_at,
            score_private, score_rest, score_rhythm, score_mental,
            score_fan, score_stream, memo, alert_level
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        form.liver_name, submitted_at.isoformat(),
        form.score_private, form.score_rest, form.score_rhythm, form.score_mental,
        form.score_fan, form.score_stream,
        form.memo, alert_level,
    ))
    conn.commit()
    conn.close()

    return JSONResponse(content={
        "success": True,
        "alert_level": alert_level,
        "message": "回答を受け付けました。"
    })


@app.get("/api/responses")
def get_responses(liver: str = None):
    conn = get_conn()
    if liver:
        rows = conn.execute(
            "SELECT * FROM responses WHERE liver_name = ? ORDER BY submitted_at ASC",
            (liver,)
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM responses ORDER BY submitted_at DESC"
        ).fetchall()
    conn.close()
    return JSONResponse(content=[dict(r) for r in rows])


@app.get("/health")
def health():
    return {"status": "ok", "service": "Ink Check Lite"}


app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)
