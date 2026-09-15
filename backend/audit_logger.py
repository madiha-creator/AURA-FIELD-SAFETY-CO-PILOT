"""
BE-005: Audit Logger

Structured, append-only audit logging for all conversation state changes,
confirmations, tool executions, and database writes.

Log entries must be granular enough to reconstruct the confirmation screen's
provenance trail (what was said vs. inferred, and when it was confirmed).
"""

import sqlite3
import json
from datetime import datetime
from enum import Enum
from typing import Optional, Any
from dataclasses import dataclass, asdict
from pathlib import Path

from ..core.config import get_config


class AuditAction(Enum):
    """Categorization of audit log actions."""
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
    """A single audit log entry.

    Fields match UI contract requirements for provenance reconstruction.
    """
    timestamp: str  # ISO 8601
    user_id: str
    session_id: Optional[str]
    action: str  # AuditAction value
    metadata: dict  # JSON-serializable dict with arbitrary context
    # Provenance fields (per-field said vs. inferred tracking)
    provenance: Optional[dict] = None  # { field_name: {"source": "said"|"inferred", "value": ...} }
    # Confirmation tracking (BE-004)
    confirmation_status: Optional[str] = None  # pending / confirmed / rejected
    confirmation_timestamp: Optional[str] = None
    # Interruption tracking (BE-003)
    interrupted: bool = False

    def to_json(self) -> str:
        return json.dumps(asdict(self), default=str)


class AuditLogger:
    """Append-only audit logger backed by SQLite (configurable to other DBs).

    TODO: Make pluggable for PostgreSQL/MySQL as needed.
    The SQLite backend here is for local development; production should
    use a proper database with append-only tables.
    """

    def __init__(self, db_path: Optional[str] = None):
        config = get_config()
        db_path = db_path or config.DATABASE_URL.replace("sqlite:///", "") or "audit.db"
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        """Initialize audit log table if it doesn't exist."""
        conn = sqlite3.connect(self.db_path)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                user_id TEXT,
                session_id TEXT,
                action TEXT NOT NULL,
                metadata TEXT,  -- JSON
                provenance TEXT,  -- JSON
                confirmation_status TEXT,
                confirmation_timestamp TEXT,
                interrupted BOOLEAN DEFAULT 0
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_audit_session ON audit_log(session_id)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp)")
        conn.commit()
        conn.close()

    def log_action(
        self,
        user_id: str,
        action: str,
        metadata: Optional[dict] = None,
        session_id: Optional[str] = None,
        provenance: Optional[dict] = None,
        confirmation_status: Optional[str] = None,
        confirmation_timestamp: Optional[str] = None,
        interrupted: bool = False,
    ):
        """Append a single audit log entry.

        Args:
            user_id: Worker/user identifier
            action: AuditAction enum value
            metadata: Arbitrary context (tool args, error messages, etc.)
            session_id: AssemblyAI session ID if available
            provenance: Per-field provenance dict {field: {source, value}}
            confirmation_status: pending/confirmed/rejected
            confirmation_timestamp: ISO timestamp of confirmation
            interrupted: Whether this entry is about an interruption
        """
        entry = AuditEntry(
            timestamp=datetime.utcnow().isoformat(),
            user_id=user_id,
            session_id=session_id,
            action=action,
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
                entry.action.value if isinstance(entry.action, AuditAction) else entry.action,
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
        """Retrieve complete audit history for a session.

        Used to reconstruct the provenance trail for confirmation screens.
        """
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            "SELECT * FROM audit_log WHERE session_id = ? ORDER BY timestamp ASC",
            (session_id,),
        ).fetchall()
        conn.close()
        return [dict(row) for row in rows]
