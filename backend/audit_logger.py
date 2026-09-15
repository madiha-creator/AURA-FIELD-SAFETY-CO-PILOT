"""
BE-005: Audit Logger
"""

import sqlite3
import json
from datetime import datetime
from enum import Enum
from typing import Optional, Any
from dataclasses import dataclass, asdict

from backend.config import get_config


class AuditAction(Enum):
    TOKEN_ISSUED = "token_issued"
    TOKEN_ISSUANCE_FAILED = "token_issuance_failed"
    SESSION_UPDATED = "session_updated"
    TRANSCRIPT_USER = "transcript_user"
    TRANSCRIPT_AGENT = "transcript_agent"
    TOOL_CALL = "tool_call"
    TOOL_EXECUTED = "tool_executed"
    TOOL_INTERRUPTED = "tool_interrupted"
    CONFIRMATION_REQUESTED = "confirmation_requested"
    CONFIRMATION_RECEIVED = "confirmation_received"
    REPORT_CREATED = "report_created"
    MAINTENANCE_LOGGED = "maintenance_logged"
    NOTIFICATION_SENT = "notification_sent"
    CORRECTIVE_ACTION_DRAFTED = "corrective_action_drafted"
    STATE_RESTORED = "state_restored"
    STATE_SAVED = "state_saved"


@dataclass
class AuditEntry:
    timestamp: str
    user_id: str
    session_id: Optional[str]
    action: str
    metadata: dict
    provenance: Optional[dict] = None
    confirmation_status: Optional[str] = None
    confirmation_timestamp: Optional[str] = None
    interrupted: bool = False

    def to_json(self) -> str:
        return json.dumps(asdict(self), default=str)


class AuditLogger:
    def __init__(self, db_path: Optional[str] = None):
        config = get_config()
        self.db_path = db_path or "aura.db"
        self._init_db()

    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                user_id TEXT,
                session_id TEXT,
                action TEXT NOT NULL,
                metadata TEXT,
                provenance TEXT,
                confirmation_status TEXT,
                confirmation_timestamp TEXT,
                interrupted BOOLEAN DEFAULT 0
            )
        """)
        conn.commit()
        conn.close()

    def log_action(
        self,
        user_id: str,
        action: Any,
        metadata: Optional[dict] = None,
        session_id: Optional[str] = None,
        provenance: Optional[dict] = None,
        confirmation_status: Optional[str] = None,
        confirmation_timestamp: Optional[str] = None,
        interrupted: bool = False,
    ):
        entry = AuditEntry(
            timestamp=datetime.utcnow().isoformat(),
            user_id=user_id,
            session_id=session_id,
            action=action.value if isinstance(action, AuditAction) else str(action),
            metadata=metadata or {},
            provenance=provenance,
            confirmation_status=confirmation_status,
            confirmation_timestamp=confirmation_timestamp,
            interrupted=interrupted,
        )

        conn = sqlite3.connect(self.db_path)
        conn.execute(
            """
            INSERT INTO audit_log (
                timestamp, user_id, session_id, action, metadata,
                provenance, confirmation_status, confirmation_timestamp, interrupted
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                entry.timestamp,
                entry.user_id,
                entry.session_id,
                entry.action,
                json.dumps(entry.metadata),
                json.dumps(entry.provenance) if entry.provenance else None,
                entry.confirmation_status,
                entry.confirmation_timestamp,
                int(entry.interrupted),
            ),
        )
        conn.commit()
        conn.close()

    def get_session_history(self, session_id: str) -> list[dict]:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            "SELECT * FROM audit_log WHERE session_id = ? ORDER BY timestamp ASC",
            (session_id,),
        ).fetchall()
        conn.close()
        return [dict(row) for row in rows]
