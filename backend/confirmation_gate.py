"""
BE-004: Confirmation Gate Middleware
"""

from dataclasses import dataclass
from typing import Optional, Callable, Any
from enum import Enum

from backend.state_manager import ConversationState, ConfirmationStatus, StateManager
from backend.audit_logger import AuditLogger, AuditAction


class WriteAction(Enum):
    CREATE_NEAR_MISS = "create_near_miss"
    LOG_MAINTENANCE_ENTRY = "log_maintenance_entry"
    NOTIFY_SAFETY_CONTACT = "notify_safety_contact"
    DRAFT_CORRECTIVE_ACTION = "draft_corrective_action"


@dataclass
class ConfirmationContext:
    action: WriteAction
    payload: dict
    session_id: str
    user_id: str
    idempotency_key: Optional[str] = None


class ConfirmationGate:
    def __init__(self, state_manager: StateManager, audit_logger: AuditLogger):
        self.state_manager = state_manager
        self.audit_logger = audit_logger
        self.confirmation_required = {
            WriteAction.CREATE_NEAR_MISS,
            WriteAction.LOG_MAINTENANCE_ENTRY,
            WriteAction.NOTIFY_SAFETY_CONTACT,
            WriteAction.DRAFT_CORRECTIVE_ACTION,
        }

    def requires_confirmation(self, action: WriteAction) -> bool:
        return action in self.confirmation_required

    def request_confirmation(
        self,
        action: WriteAction,
        payload: dict,
        session_id: str,
        user_id: str,
    ) -> dict:
        state = self.state_manager.get_state(session_id)
        if not state:
            state = self.state_manager.create_session(user_id=user_id, session_id=session_id)

        state.confirmation_status = ConfirmationStatus.PENDING
        state.confirmation_requested_at = state.updated_at
        self.state_manager.update_state(state)

        self.audit_logger.log_action(
            user_id=user_id,
            action=AuditAction.CONFIRMATION_REQUESTED,
            session_id=session_id,
            metadata={
                "action": action.value,
                "payload": payload,
            },
            provenance=state.report.get_provenance_dict() if state.report else None,
            confirmation_status="pending",
        )

        return {
            "confirmation_required": True,
            "action": action.value,
            "payload": payload,
            "message": self._generate_confirmation_prompt(action, payload),
        }

    def verify_confirmation(
        self,
        session_id: str,
        user_id: str,
        confirmed: bool,
    ) -> tuple[bool, Optional[dict]]:
        state = self.state_manager.get_state(session_id)
        if not state or state.confirmation_status != ConfirmationStatus.PENDING:
            return False, None

        if confirmed:
            state.confirmation_status = ConfirmationStatus.CONFIRMED
            state.confirmation_completed_at = state.updated_at
        else:
            state.confirmation_status = ConfirmationStatus.REJECTED
            state.confirmation_completed_at = state.updated_at

        self.state_manager.update_state(state)

        self.audit_logger.log_action(
            user_id=user_id,
            action=AuditAction.CONFIRMATION_RECEIVED,
            session_id=session_id,
            metadata={"confirmed": confirmed},
            provenance=state.report.get_provenance_dict() if state.report else None,
            confirmation_status="confirmed" if confirmed else "rejected",
            confirmation_timestamp=state.confirmation_completed_at,
        )

        return confirmed, getattr(state, "_pending_payload", None)

    def _generate_confirmation_prompt(self, action: WriteAction, payload: dict) -> str:
        prompts = {
            WriteAction.CREATE_NEAR_MISS: (
                f"Confirm near-miss report for {payload.get('equipment', 'equipment')} "
                f"at {payload.get('location', 'location')}. Say 'Yes, create report' to confirm."
            ),
            WriteAction.LOG_MAINTENANCE_ENTRY: (
                f"Log maintenance entry for {payload.get('equipment', 'equipment')}. "
                "Say 'Yes, log it' to confirm."
            ),
            WriteAction.NOTIFY_SAFETY_CONTACT: (
                f"Notify safety contact. Say 'Yes, notify' to confirm."
            ),
            WriteAction.DRAFT_CORRECTIVE_ACTION: (
                f"Draft corrective action. Say 'Yes, draft it' to confirm."
            ),
        }
        return prompts.get(action, "Confirm this action?")
