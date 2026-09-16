"""
INT-001/002/003/004: Database Interface & Read Models for Supervisor Web Dashboard.
"""

import uuid
import sqlite3
from datetime import datetime
from abc import ABC, abstractmethod
from typing import Optional, Any
from dataclasses import dataclass

from backend.config import get_config


class DatabaseInterface(ABC):
    @abstractmethod
    def create_maintenance_entry(self, data: dict) -> str: pass
    @abstractmethod
    def create_report(self, data: dict) -> str: pass
    @abstractmethod
    def get_report_by_idempotency_key(self, key: str) -> Optional[dict]: pass
    @abstractmethod
    def create_notification(self, data: dict) -> str: pass
    @abstractmethod
    def create_corrective_action(self, data: dict) -> str: pass
    @abstractmethod
    def get_reports_list(self, limit: int = 50, offset: int = 0) -> list[dict]: pass
    @abstractmethod
    def get_report_detail(self, report_id: str) -> Optional[dict]: pass
    @abstractmethod
    def update_report_status(self, report_id: str, status: str) -> bool: pass


class SQLiteDatabase(DatabaseInterface):
    def __init__(self, db_path: str = None):
        config = get_config()
        self.db_path = db_path or "aura.db"
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
                status TEXT DEFAULT 'pending_supervisor',
                created_at TEXT NOT NULL
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
                data.get("location", "Site Main"),
                data.get("equipment", "Unknown"),
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
        row = conn.execute("SELECT * FROM reports WHERE idempotency_key = ?", (key,)).fetchone()
        conn.close()
        return dict(row) if row else None

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
                data.get("status", "pending_supervisor"),
                datetime.utcnow().isoformat(),
            ),
        )
        conn.commit()
        conn.close()
        return action_id

    def get_reports_list(self, limit: int = 50, offset: int = 0) -> list[dict]:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        rows = conn.execute("SELECT * FROM reports ORDER BY created_at DESC LIMIT ? OFFSET ?", (limit, offset)).fetchall()
        conn.close()
        return [dict(row) for row in rows]

    def get_report_detail(self, report_id: str) -> Optional[dict]:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        row = conn.execute("SELECT * FROM reports WHERE id = ?", (report_id,)).fetchone()
        conn.close()
        return dict(row) if row else None

    def update_report_status(self, report_id: str, status: str) -> bool:
        conn = sqlite3.connect(self.db_path)
        cursor = conn.execute("UPDATE reports SET status = ? WHERE id = ?", (status, report_id))
        conn.commit()
        updated = cursor.rowcount > 0
        conn.close()
        return updated

    def update_report_fields(self, report_id: str, changes: dict) -> Optional[dict]:
        conn = sqlite3.connect(self.db_path)
        sets = []
        params = []
        for k, v in changes.items():
            sets.append(f"{k} = ?")
            params.append(v)
        if sets:
            params.append(report_id)
            conn.execute(f"UPDATE reports SET {', '.join(sets)} WHERE id = ?", params)
            conn.commit()
        conn.close()
        return self.get_report_detail(report_id)

    def get_corrective_action_by_report(self, report_id: str) -> Optional[dict]:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        row = conn.execute("SELECT * FROM corrective_actions WHERE report_id = ?", (report_id,)).fetchone()
        conn.close()
        return dict(row) if row else None

    def search_similar_reports_db(self, query: str, site: str = None, equipment: str = None) -> dict:
        from data.similar_reports import search_similar_incidents
        return search_similar_incidents(query_text=query, site=site, equipment=equipment)

    def get_patterns_list(self) -> list[dict]:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        rows = conn.execute("""
            SELECT equipment, location, COUNT(*) as count, MAX(created_at) as last_seen
            FROM reports GROUP BY equipment, location
        """).fetchall()
        conn.close()
        res = []
        for r in rows:
            res.append({
                "equipment": r["equipment"],
                "location": r["location"],
                "count": r["count"],
                "last_seen": r["last_seen"],
                "draft_ca_status": "pending_supervisor"
            })
        return res

    def get_maintenance_entries(self) -> list[dict]:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        rows = conn.execute("SELECT * FROM maintenance_entries ORDER BY created_at DESC").fetchall()
        conn.close()
        return [dict(row) for row in rows]


_db_instance: Optional[DatabaseInterface] = None

def get_database() -> DatabaseInterface:
    global _db_instance
    if _db_instance is None:
        _db_instance = SQLiteDatabase()
    return _db_instance
