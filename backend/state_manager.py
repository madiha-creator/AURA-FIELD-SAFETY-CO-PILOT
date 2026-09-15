"""
BE-002: Conversation State Manager

Persistent state tracking that survives session interruption/reopen.
The UI depends on this for the "Draft in progress → Resume" banner.

State includes:
- Current procedure step
- In-progress report fields (with provenance: said vs. inferred)
- Confirmation status
- Mode (guided-ops vs. reporting)

Two backends provided:
1. In-memory (development)
2. Redis (production, persistent across restarts)

TODO: Production should use Redis or database. Flag the tradeoff.
"""

import json
import uuid
import redis
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Optional, Any
from dataclasses import dataclass, field, asdict
from enum import Enum

from ..core.config import get_config


class SessionMode(Enum):
    """Conversation modes from UI contract."""
    GUIDED_OPS = "guided_ops"
    REPORTING = "reporting"
    IDLE = "idle"


class ConfirmationStatus(Enum):
    """Confirmation gate states (BE-004)."""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    REJECTED = "rejected"
    NOT_REQUIRED = "not_required"


class ProvenanceSource(Enum):
    """Per-field provenance (UI contract: YOU SAID vs AI INFERRED)."""
    SAID = "said"           # Worker-provided
    INFERRED = "inferred"   # Agent-derived


@dataclass
class ProvenanceField:
    """A single report field with provenance tracking."""
    value: Any
    source: ProvenanceSource
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    confidence: Optional[float] = None  # e.g., 99.2% from transcript

    def to_dict(self) -> dict:
        return {
            "value": self.value,
            "source": self.source.value,
            "timestamp": self.timestamp,
            "confidence": self.confidence,
        }


@dataclass
class ReportState:
    """In-progress near-miss/maintenance report with provenance.

    Matches UI contract fields exactly:
    - Location, Equipment, Hazard type, Injury
    Each tagged YOU SAID or AI INFERRED
    """
    location: Optional[ProvenanceField] = None
    equipment: Optional[ProvenanceField] = None
    hazard_type: Optional[ProvenanceField] = None
    injury: Optional[ProvenanceField] = None
    narrative: Optional[ProvenanceField] = None  # Quoted narrative
    idempotency_key: Optional[str] = None  # INT-002: prevent duplicate writes

    # Per-field provenance for confirmation screen
    def get_provenance_dict(self) -> dict:
        """Return provenance dict for audit logging."""
        return {
            "location": self.location.to_dict() if self.location else None,
            "equipment": self.equipment.to_dict() if self.equipment else None,
            "hazard_type": self.hazard_type.to_dict() if self.hazard_type else None,
            "injury": self.injury.to_dict() if self.injury else None,
            "narrative": self.narrative.to_dict() if self.narrative else None,
        }


@dataclass
class ProcedureStep:
    """Guided-ops procedure step (UI contract)."""
    step_number: int
    total_steps: int
    instruction_text: str
    mandatory_verification: bool = False
    confirmed: bool = False
    confirmed_timestamp: Optional[str] = None


@dataclass
class ConversationState:
    """Complete persistent conversation state."""
    session_id: str
    user_id: str
    mode: SessionMode = SessionMode.IDLE
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    # Procedure state (guided-ops)
    current_step: Optional[int] = None
    total_steps: Optional[int] = None
    steps: list = field(default_factory=list)
    procedure_name: Optional[str] = None

    # Report state (reporting mode)
    report: ReportState = field(default_factory=ReportState)
    confirmation_status: ConfirmationStatus = ConfirmationStatus.NOT_REQUIRED
    confirmation_requested_at: Optional[str] = None
    confirmation_completed_at: Optional[str] = None

    # Safety/alert state
    active_alert: Optional[dict] = None

    # AssemblyAI session tracking
    assemblyai_session_id: Optional[str] = None

    def to_dict(self) -> dict:
        """Serialize for storage."""
        data = asdict(self)
        # Convert enums to values
        data["mode"] = self.mode.value
        data["confirmation_status"] = self.confirmation_status.value
        # Report provenance is already dict
        return data

    @classmethod
    def from_dict(cls, data: dict) -> "ConversationState":
        """Deserialize from storage."""
        # Handle enums
        if "mode" in data and isinstance(data["mode"], str):
            data["mode"] = SessionMode(data["mode"])
        if "confirmation_status" in data and isinstance(data["confirmation_status"], str):
            data["confirmation_status"] = ConfirmationStatus(data["confirmation_status"])
        return cls(**data)


class StateBackend(ABC):
    """Abstract state storage backend."""

    @abstractmethod
    def get(self, session_id: str) -> Optional[ConversationState]:
        pass

    @abstractmethod
    def set(self, state: ConversationState) -> None:
        pass

    @abstractmethod
    def delete(self, session_id: str) -> None:
        pass

    @abstractmethod
    def exists(self, session_id: str) -> bool:
        pass


class InMemoryStateBackend(StateBackend):
    """In-memory state backend (development only - NOT persistent)."""

    def __init__(self):
        self._store: dict[str, ConversationState] = {}

    def get(self, session_id: str) -> Optional[ConversationState]:
        return self._store.get(session_id)

    def set(self, state: ConversationState) -> None:
        state.updated_at = datetime.utcnow().isoformat()
        self._store[state.session_id] = state

    def delete(self, session_id: str) -> None:
        self._store.pop(session_id, None)

    def exists(self, session_id: str) -> bool:
        return session_id in self._store


class RedisStateBackend(StateBackend):
    """Redis-backed state backend (production, persistent).

    Tradeoffs vs in-memory:
    - Pros: Survives restarts, shared across workers, TTL support
    - Cons: Additional infrastructure, latency, complexity
    """

    def __init__(self, redis_url: Optional[str] = None, ttl_seconds: int = 86400):
        config = get_config()
        redis_url = redis_url or config.REDIS_URL
        self.client = redis.from_url(redis_url) if redis_url else None
        self.ttl = ttl_seconds

    def _key(self, session_id: str) -> str:
        return f"aura:session:{session_id}"

    def get(self, session_id: str) -> Optional[ConversationState]:
        if not self.client:
            return None
        data = self.client.get(self._key(session_id))
        if not data:
            return None
        return ConversationState.from_dict(json.loads(data))

    def set(self, state: ConversationState) -> None:
        if not self.client:
            return
        state.updated_at = datetime.utcnow().isoformat()
        self.client.setex(
            self._key(state.session_id),
            self.ttl,
            json.dumps(state.to_dict()),
        )

    def delete(self, session_id: str) -> None:
        if self.client:
            self.client.delete(self._key(session_id))

    def exists(self, session_id: str) -> bool:
        if not self.client:
            return False
        return self.client.exists(self._key(session_id)) > 0


class StateManager:
    """High-level state manager with pluggable backend."""

    def __init__(self, backend: Optional[StateBackend] = None):
        config = get_config()
        if backend is None:
            if config.REDIS_URL:
                self.backend = RedisStateBackend(config.REDIS_URL)
            else:
                self.backend = InMemoryStateBackend()

    def create_session(self, user_id: str, session_id: Optional[str] = None) -> ConversationState:
        """Create a new conversation session."""
        session_id = session_id or str(uuid.uuid4())
        state = ConversationState(session_id=session_id, user_id=user_id)
        self.backend.set(state)
        return state

    def get_state(self, session_id: str) -> Optional[ConversationState]:
        """Retrieve state (for 'Resume' banner)."""
        return self.backend.get(session_id)

    def update_state(self, state: ConversationState) -> None:
        """Update existing state."""
        self.backend.set(state)

    def delete_session(self, session_id: str) -> None:
        """Delete session (after report submitted)."""
        self.backend.delete(session_id)

    def has_active_session(self, user_id: str) -> bool:
        """Check if user has any active session (for UI banner).
        NOTE: In-memory/Redis backends don't support efficient user_id lookups.
        For production, add a secondary index or use database.
        """
        # TODO: Implement efficient user_id lookup for banner
        return False

    # Convenience methods for common state transitions

    def set_mode(self, session_id: str, mode: SessionMode) -> Optional[ConversationState]:
        state = self.get_state(session_id)
        if state:
            state.mode = mode
            self.update_state(state)
        return state

    def update_report_field(
        self,
        session_id: str,
        field_name: str,
        value: Any,
        source: ProvenanceSource,
        confidence: Optional[float] = None,
    ) -> Optional[ConversationState]:
        """Update a single report field with provenance."""
        state = self.get_state(session_id)
        if not state:
            return None

        field = ProvenanceField(value=value, source=source, confidence=confidence)
        setattr(state.report, field_name, field)
        self.update_state(state)
        return state

    def set_confirmation_pending(self, session_id: str) -> Optional[ConversationState]:
        """Mark that confirmation is needed (BE-004)."""
        state = self.get_state(session_id)
        if state:
            state.confirmation_status = ConfirmationStatus.PENDING
            state.confirmation_requested_at = datetime.utcnow().isoformat()
            self.update_state(state)
        return state

    def confirm(self, session_id: str) -> Optional[ConversationState]:
        """Record worker confirmation."""
        state = self.get_state(session_id)
        if state:
            state.confirmation_status = ConfirmationStatus.CONFIRMED
            state.confirmation_completed_at = datetime.utcnow().isoformat()
            self.update_state(state)
        return state

    def reject(self, session_id: str) -> Optional[ConversationState]:
        """Record worker rejection."""
        state = self.get_state(session_id)
        if state:
            state.confirmation_status = ConfirmationStatus.REJECTED
            state.confirmation_completed_at = datetime.utcnow().isoformat()
            self.update_state(state)
        return state

    def set_assemblyai_session(self, session_id: str, assemblyai_session_id: str) -> Optional[ConversationState]:
        """Link internal session to AssemblyAI WebSocket session."""
        state = self.get_state(session_id)
        if state:
            state.assemblyai_session_id = assemblyai_session_id
            self.update_state(state)
        return state


# Module-level singleton for convenience
_state_manager: Optional[StateManager] = None


def get_state_manager() -> StateManager:
    """Get the global state manager instance."""
    global _state_manager
    if _state_manager is None:
        _state_manager = StateManager()
    return _state_manager