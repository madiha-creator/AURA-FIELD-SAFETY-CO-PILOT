"""
INT-001/002/003/004: Database Interface

SQLite database implementation for INT-001 (log_maintenance_entry) and
INT-002 (create_near_miss). This is the final implementation for the demo.

Field names match the UI contract exactly:
- Location, Equipment, Hazard type, Injury
- Each with provenance: said vs. inferred
"""

import uuid
import sqlite3
from datetime import datetime
from abc import ABC, abstractmethod
from typing import Optional, Any
from dataclasses import dataclass

from ..core.config import get_config


@dataclass
class ReportFields:
    """Report field schema matching UI contract exactly.

    Fields: Location, Equipment, Hazard type, Injury
    Each with provenance: said vs. inferred
    """
    location: str
    equipment: str
    hazard_type: str
    injury: str
    narrative: str = ""
    status: str = "awaiting_review"  # awaiting_review | in_progress | approved | rejected
    provenance: Optional[dict] = None  # Per-field provenance {field: {source, value, confidence}}
    idempotency_key: str = ""
    worker_id: str = ""
    created_at: str = ""
    pattern_detected: bool = False
    recurrence_sentence: str = ""  # "3rd near miss involving Forklift 12 this month"

    def __post_init__(self):
        if not self.created_at:
            self.created_at = datetime.utcnow().isoformat()
        if not self.idempotency_key:
            self.idempotency_key = str(uuid.uuid4())


class DatabaseInterface(ABC):
    """Abstract database interface - implement for any backend."""

    @abstractmethod
    def create_maintenance_entry(self, data: dict) -> str:
        """INT-001: Log a structured maintenance entry.

        Returns entry ID.
        """
        pass

    @abstractmethod
    def create_report(self, data: dict) -> str:
        """INT-002: Create a near-miss report with idempotency key.

        Returns report ID.
        """
        pass

    @abstractmethod
    def get_report_by_idempotency_key(self, key: str) -> Optional[dict]:
        """INT-002: Check for duplicate report by idempotency key."""
        pass

    @abstractmethod
    def create_notification(self, data: dict) -> str:
        """INT-003: Create notification entry.

        Returns notification ID.
        """
        pass

    @abstractmethod
    def create_corrective_action(self, data: dict) -> str:
        """INT-004: Draft corrective action.

        Returns action ID.
        """
        pass

    @abstractmethod
    def get_reports_list(
        self,
        limit: int = 50,
        offset: int = 0,
        status_filter: str = None,
        pattern_filter: bool = False,
    ) -> list[dict]:
        """Supervisor dashboard: Reports list."""
        pass

    @abstractmethod
    def get_report_detail(self, report_id: str) -> Optional[dict]:
        """Supervisor dashboard: Report detail."""
        pass

    @abstractmethod
    def get_dashboard_summary(self) -> dict:
        """Supervisor dashboard: Summary tiles."""
        pass

    @abstractmethod
    def update_report_status(self, report_id: str, status: str) -> bool:
        """Supervisor dashboard: Approve/Edit/Reject report."""
        pass



class SQLiteDatabase(DatabaseInterface):
    """SQLite database implementation - the final backend for this demo.

    Schema is created automatically on first connection. All tables
    (reports, maintenance_entries, notifications, corrective_actions,
    audit_log) are created with the correct schema matching the UI contract.
    """

    def __init__(self, db_path: str = None):
        config = get_config()
        self.db_path = db_path or config.DATABASE_URL.replace("sqlite:///", "") or "aura.db"
        self._init_db()

    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS reports (
                id TEXT PRIMARY KEY,
                location TEXT NOT NULL,
                equipment TEXT NOT NULL,
                hazard_type TEXT NOT NULL,
                injury TEXT NOT NULL,
                narrative TEXT DEFAULT '',
                status TEXT DEFAULT 'awaiting_review',
                provenance TEXT DEFAULT '{}',
                idempotency_key TEXT UNIQUE NOT NULL,
                worker_id TEXT,
                created_at TEXT NOT NULL,
                pattern_detected INTEGER DEFAULT 0,
                recurrence_sentence TEXT DEFAULT ''
            );

            CREATE TABLE IF NOT EXISTS maintenance_entries (
                id TEXT PRIMARY KEY,
                location TEXT NOT NULL,
                equipment TEXT NOT NULL,
                issue_description TEXT NOT NULL,
                severity TEXT DEFAULT 'medium',
                provenance TEXT DEFAULT '{}',
                worker_id TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS notifications (
                id TEXT PRIMARY KEY,
                alert_type TEXT NOT NULL,
                severity TEXT NOT NULL,
                location TEXT NOT NULL,
                recipient_role TEXT NOT NULL,
                equipment TEXT,
                measured_value REAL,
                unit TEXT,
                expected_range TEXT,
                deviation_percentage REAL,
                required_acknowledgments TEXT DEFAULT '[]',
                sender_id TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS corrective_actions (
                id TEXT PRIMARY KEY,
                report_id TEXT NOT NULL,
                pattern_signal TEXT DEFAULT '{}',
                proposed_action TEXT,
                supervisor_review_required INTEGER DEFAULT 1,
                status TEXT DEFAULT 'pending_approval',
                created_at TEXT NOT NULL
            );

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
            );
        """)
        conn.commit()
        conn.close()

    def create_maintenance_entry(self, data: dict) -> str:
        entry_id = str(uuid.uuid4())
        conn = sqlite3.connect(self.db_path)
        conn.execute(
            """INSERT INTO maintenance_entries
               (id, location, equipment, issue_description, severity, provenance, worker_id, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                entry_id,
                data.get("location", ""),
                data.get("equipment", ""),
                data.get("issue_description", ""),
                data.get("severity", "medium"),
                str(data.get("provenance", {})),
                data.get("worker_id", ""),
                datetime.utcnow().isoformat(),
            ),
        )
        conn.commit()
        conn.close()
        return entry_id

    def create_report(self, data: dict) -> str:
        report_id = str(uuid.uuid4())
        conn = sqlite3.connect(self.db_path)
        conn.execute(
            """INSERT INTO reports
               (id, location, equipment, hazard_type, injury, narrative, status,
                provenance, idempotency_key, worker_id, created_at, pattern_detected, recurrence_sentence)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                report_id,
                data.get("location", ""),
                data.get("equipment", ""),
                data.get("hazard_type", ""),
                data.get("injury", ""),
                data.get("narrative", ""),
                data.get("status", "awaiting_review"),
                str(data.get("provenance", {})),
                data.get("idempotency_key", ""),
                data.get("worker_id", ""),
                datetime.utcnow().isoformat(),
                1 if data.get("pattern_detected") else 0,
                data.get("recurrence_sentence", ""),
            ),
        )
        conn.commit()
        conn.close()
        return report_id

    def get_report_by_idempotency_key(self, key: str) -> Optional[dict]:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        row = conn.execute(
            "SELECT * FROM reports WHERE idempotency_key = ?", (key,)
        ).fetchone()
        conn.close()
        if row:
            return dict(row)
        return None

    def create_notification(self, data: dict) -> str:
        notification_id = str(uuid.uuid4())
        conn = sqlite3.connect(self.db_path)
        conn.execute(
            """INSERT INTO notifications
               (id, alert_type, severity, location, recipient_role, equipment,
                measured_value, unit, expected_range, deviation_percentage,
                required_acknowledgments, sender_id, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                notification_id,
                data.get("alert_type", ""),
                data.get("severity", "medium"),
                data.get("location", ""),
                data.get("recipient_role", ""),
                data.get("equipment"),
                data.get("measured_value"),
                data.get("unit", ""),
                data.get("expected_range", ""),
                data.get("deviation_percentage"),
                str(data.get("required_acknowledgments", [])),
                data.get("sender_id", ""),
                datetime.utcnow().isoformat(),
            ),
        )
        conn.commit()
        conn.close()
        return notification_id

    def create_corrective_action(self, data: dict) -> str:
        action_id = str(uuid.uuid4())
        conn = sqlite3.connect(self.db_path)
        conn.execute(
            """INSERT INTO corrective_actions
               (id, report_id, pattern_signal, proposed_action,
                supervisor_review_required, status, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                action_id,
                data.get("report_id", ""),
                str(data.get("pattern_signal", {})),
                data.get("proposed_action", ""),
                1 if data.get("supervisor_review_required", True) else 0,
                data.get("status", "pending_approval"),
                datetime.utcnow().isoformat(),
            ),
        )
        conn.commit()
        conn.close()
        return action_id

    def get_reports_list(
        self,
        limit: int = 50,
        offset: int = 0,
        status_filter: str = None,
        pattern_filter: bool = False,
    ) -> list[dict]:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        query = "SELECT * FROM reports WHERE 1=1"
        params = []

        if status_filter:
            query += " AND status = ?"
            params.append(status_filter)
        if pattern_filter:
            query += " AND pattern_detected = 1"

        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        rows = conn.execute(query, params).fetchall()
        conn.close()
        return [dict(row) for row in rows]

    def get_report_detail(self, report_id: str) -> Optional[dict]:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        row = conn.execute("SELECT * FROM reports WHERE id = ?", (report_id,)).fetchone()
        conn.close()
        if row:
            return dict(row)
        return None

    def get_dashboard_summary(self) -> dict:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row

        open_reports = conn.execute(
            "SELECT COUNT(*) as count FROM reports WHERE status IN ('awaiting_review', 'in_progress')"
        ).fetchone()["count"]

        pattern_flags = conn.execute(
            "SELECT COUNT(*) as count FROM reports WHERE pattern_detected = 1"
        ).fetchone()["count"]

        corrective_actions = conn.execute(
            "SELECT COUNT(*) as count FROM corrective_actions WHERE status = 'pending_approval'"
        ).fetchone()["count"]

        avg_time = conn.execute(
            "SELECT AVG(0) as avg_seconds FROM reports WHERE 1=0"  # Stub - implement real calculation
        ).fetchone()["avg_seconds"] or 0

        conn.close()
        return {
            "open_reports": open_reports,
            "pattern_flags": pattern_flags,
            "corrective_actions_pending": corrective_actions,
            "avg_time_to_report_seconds": avg_time,
            # Week-over-week deltas would need historical data
            "week_over_week": {
                "open_reports_delta": None,  # TODO: implement real calculation
                "pattern_flags_delta": None,
            },
        }

    def update_report_status(self, report_id: str, status: str) -> bool:
        """Approve/Edit/Reject - status must be awaiting_review, in_progress, approved, or rejected."""
        valid_statuses = {"awaiting_review", "in_progress", "approved", "rejected"}
        if status not in valid_statuses:
            return False

        conn = sqlite3.connect(self.db_path)
        conn.execute(
            "UPDATE reports SET status = ? WHERE id = ?", (status, report_id)
        )
        conn.commit()
        conn.close()
        return True


# Module-level singleton
_db_instance: Optional[DatabaseInterface] = None


def get_database() -> DatabaseInterface:
    """Get the database instance (lazy initialization)."""
    global _db_instance
    if _db_instance is None:
        config = get_config()
        if config.DATABASE_URL.startswith("sqlite"):
            _db_instance = SQLiteDatabase()
        else:
            # TODO: Factory pattern for other database types
            # Salesforce, Jira, PostgreSQL, MySQL, etc.
            _db_instance = SQLiteDatabase()
    return _db_instance
