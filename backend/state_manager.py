"""
BE-002: Conversation State Manager

Persistent state tracking that survives session interruption/reopen.
"""

import json
import uuid
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Optional, Any
from dataclasses import dataclass, field, asdict
from enum import Enum

try:
    import redis
except ImportError:
    redis = None

from backend.config import get_config


class SessionMode(Enum):
    GUIDED_OPS = "guided_ops"
    REPORTING = "reporting"
    IDLE = "idle"


class ConfirmationStatus(Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    REJECTED = "rejected"
    NOT_REQUIRED = "not_required"


class ProvenanceSource(Enum):
    SAID = "said"
    INFERRED = "inferred"


@dataclass
class ProvenanceField:
    value: Any
    source: ProvenanceSource
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    confidence: Optional[float] = None

    def to_dict(self) -> dict:
        return {
            "value": self.value,
            "source": self.source.value if isinstance(self.source, ProvenanceSource) else self.source,
            "timestamp": self.timestamp,
            "confidence": self.confidence,
        }


@dataclass
class ReportState:
    location: Optional[ProvenanceField] = None
    equipment: Optional[ProvenanceField] = None
    hazard_type: Optional[ProvenanceField] = None
    injury: Optional[ProvenanceField] = None
    narrative: Optional[ProvenanceField] = None
    idempotency_key: Optional[str] = None

    def get_provenance_dict(self) -> dict:
        return {
            "location": self.location.to_dict() if self.location else None,
            "equipment": self.equipment.to_dict() if self.equipment else None,
            "hazard_type": self.hazard_type.to_dict() if self.hazard_type else None,
            "injury": self.injury.to_dict() if self.injury else None,
            "narrative": self.narrative.to_dict() if self.narrative else None,
        }


@dataclass
class ConversationState:
    session_id: str
    user_id: str
    mode: SessionMode = SessionMode.IDLE
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    current_step: Optional[int] = None
    total_steps: Optional[int] = None
    steps: list = field(default_factory=list)
    procedure_name: Optional[str] = None
    report: ReportState = field(default_factory=ReportState)
    confirmation_status: ConfirmationStatus = ConfirmationStatus.NOT_REQUIRED
    confirmation_requested_at: Optional[str] = None
    confirmation_completed_at: Optional[str] = None
    active_alert: Optional[dict] = None
    assemblyai_session_id: Optional[str] = None

    def to_dict(self) -> dict:
        data = asdict(self)
        data["mode"] = self.mode.value if isinstance(self.mode, SessionMode) else self.mode
        data["confirmation_status"] = self.confirmation_status.value if isinstance(self.confirmation_status, ConfirmationStatus) else self.confirmation_status
        return data

    @classmethod
    def from_dict(cls, data: dict) -> "ConversationState":
        if "mode" in data and isinstance(data["mode"], str):
            data["mode"] = SessionMode(data["mode"])
        if "confirmation_status" in data and isinstance(data["confirmation_status"], str):
            data["confirmation_status"] = ConfirmationStatus(data["confirmation_status"])
        return cls(**data)


class StateBackend(ABC):
    @abstractmethod
    def get(self, session_id: str) -> Optional[ConversationState]: pass
    @abstractmethod
    def set(self, state: ConversationState) -> None: pass
    @abstractmethod
    def delete(self, session_id: str) -> None: pass
    @abstractmethod
    def exists(self, session_id: str) -> bool: pass


class InMemoryStateBackend(StateBackend):
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
    def __init__(self, redis_url: Optional[str] = None, ttl_seconds: int = 86400):
        config = get_config()
        redis_url = redis_url or getattr(config, "REDIS_URL", None)
        self.client = redis.from_url(redis_url) if (redis and redis_url) else None
        self.ttl = ttl_seconds

    def _key(self, session_id: str) -> str:
        return f"aura:session:{session_id}"

    def get(self, session_id: str) -> Optional[ConversationState]:
        if not self.client:
            return None
        data = self.client.get(self._key(session_id))
        return ConversationState.from_dict(json.loads(data)) if data else None

    def set(self, state: ConversationState) -> None:
        if not self.client:
            return
        state.updated_at = datetime.utcnow().isoformat()
        self.client.setex(self._key(state.session_id), self.ttl, json.dumps(state.to_dict()))

    def delete(self, session_id: str) -> None:
        if self.client:
            self.client.delete(self._key(session_id))

    def exists(self, session_id: str) -> bool:
        return (self.client.exists(self._key(session_id)) > 0) if self.client else False


class StateManager:
    def __init__(self, backend: Optional[StateBackend] = None):
        if backend is None:
            self.backend = InMemoryStateBackend()
        else:
            self.backend = backend

    def create_session(self, user_id: str, session_id: Optional[str] = None) -> ConversationState:
        session_id = session_id or str(uuid.uuid4())
        state = ConversationState(session_id=session_id, user_id=user_id)
        self.backend.set(state)
        return state

    def get_state(self, session_id: str) -> Optional[ConversationState]:
        return self.backend.get(session_id)

    def update_state(self, state: ConversationState) -> None:
        self.backend.set(state)

    def delete_session(self, session_id: str) -> None:
        self.backend.delete(session_id)

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
        state = self.get_state(session_id)
        if not state:
            return None
        field_obj = ProvenanceField(value=value, source=source, confidence=confidence)
        setattr(state.report, field_name, field_obj)
        self.update_state(state)
        return state


_state_manager: Optional[StateManager] = None

def get_state_manager() -> StateManager:
    global _state_manager
    if _state_manager is None:
        _state_manager = StateManager()
    return _state_manager
