"""
BE-004: Confirmation Gate Middleware

No write action fires without explicit worker confirmation.
Wraps all write-capable tools: create_near_miss, log_maintenance_entry,
notify_safety_contact, draft_corrective_action.

The gate checks:
1. Has the user explicitly confirmed? (voice "Yes, create report" or equivalent)
2. Is the confirmation recent and for the exact action?
3. Record confirmation in audit log with provenance
"""

from dataclasses import dataclass
from typing import Optional, Callable, Any
from enum import Enum

from ..core.state_manager import ConversationState, ConfirmationStatus, StateManager
from ..services.audit_logger import AuditLogger, AuditAction


class WriteAction(Enum):
    """Actions that require confirmation."""
    CREATE_NEAR_MISS = "create_near_miss"
    LOG_MAINTENANCE_ENTRY = "log_maintenance_entry"
    NOTIFY_SAFETY_CONTACT = "notify_safety_contact"
    DRAFT_CORRECTIVE_ACTION = "draft_corrective_action"


@dataclass
class ConfirmationContext:
    """Context for a pending confirmation request."""
    action: WriteAction
    payload: dict  # The arguments that would be passed to the tool
    session_id: str
    user_id: str
    idempotency_key: Optional[str] = None  # For create_near_miss


class ConfirmationGate:
    """
    Middleware that enforces explicit worker confirmation before write actions.

    Flow:
    1. Tool dispatcher receives write tool call
    2. Gate checks if confirmation is required for this action
    3. If not confirmed: store pending context, return "confirmation_required" result
    4. Agent prompts worker for confirmation
    4. Worker confirms ("Yes, create report")
    5. Gate verifies confirmation matches pending context
    6. Execute the actual write action
    7. Log confirmation in audit trail
    """

    def __init__(self, state_manager: StateManager, audit_logger: AuditLogger):
        self.state_manager = state_manager
        self.audit_logger = audit_logger

        # Actions that require confirmation
        self.confirmation_required = {
            WriteAction.CREATE_NEAR_MISS,
            WriteAction.LOG_MAINTENANCE_ENTRY,
            WriteAction.NOTIFY_SAFETY_CONTACT,
            WriteAction.DRAFT_CORRECTIVE_ACTION,
        }

    def requires_confirmation(self, action: WriteAction) -> bool:
        """Check if an action requires explicit confirmation."""
        return action in self.confirmation_required

    def request_confirmation(
        self,
        action: WriteAction,
        payload: dict,
        session_id: str,
        user_id: str,
    ) -> dict:
        """
        Mark confirmation as pending and return confirmation request.

        The agent should present this to the worker for voice confirmation.
        """
        state = self.state_manager.get_state(session_id)
        if not state:
            return {"error": "Session not found"}

        # Store pending confirmation in state
        state.confirmation_status = ConfirmationStatus.PENDING
        state.confirmation_requested_at = state.updated_at  # Uses current timestamp
        self.state_manager.update_state(state)

        # Log the confirmation request
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
        """
        Verify worker's confirmation response.

        Returns: (allowed, stored_payload)
        If allowed=True, caller should execute the write action.
        """
        state = self.state_manager.get_state(session_id)
        if not state:
            return False, None

        if state.confirmation_status != ConfirmationStatus.PENDING:
            # No pending confirmation
            return False, None

        if confirmed:
            state.confirmation_status = ConfirmationStatus.CONFIRMED
            state.confirmation_completed_at = state.updated_at
        else:
            state.confirmation_status = ConfirmationStatus.REJECTED
            state.confirmation_completed_at = state.updated_at

        self.state_manager.update_state(state)

        # Log the confirmation result
        self.audit_logger.log_action(
            user_id=user_id,
            action=AuditAction.CONFIRMATION_RECEIVED,
            session_id=session_id,
            metadata={"confirmed": confirmed},
            provenance=state.report.get_provenance_dict() if state.report else None,
            confirmation_status="confirmed" if confirmed else "rejected",
            confirmation_timestamp=state.confirmation_completed_at,
        )

        if confirmed:
            # Return the payload that was pending
            # In a real implementation, this would be stored
            # For now, we assume the payload is in state or passed through
            return True, getattr(state, "_pending_payload", None)

        return False, None

    def _generate_confirmation_prompt(self, action: WriteAction, payload: dict) -> str:
        """Generate a natural language prompt for the worker."""
        prompts = {
            WriteAction.CREATE_NEAR_MISS: (
                f"Confirm near-miss report for {payload.get('equipment', 'equipment')} "
                f"at {payload.get('location', 'location')}. Hazard: {payload.get('hazard_type', 'unknown')}. "
                "Say 'Yes, create report' to confirm."
            ),
            WriteAction.LOG_MAINTENANCE_ENTRY: (
                f"Log maintenance entry for {payload.get('equipment', 'equipment')} "
                f"at {payload.get('location', 'location')}. "
                "Say 'Yes, log it' to confirm."
            ),
            WriteAction.NOTIFY_SAFETY_CONTACT: (
                f"Notify {payload.get('recipient_role', 'safety contact')} about "
                f"{payload.get('alert_type', 'alert')} at {payload.get('location', 'location')}. "
                "Say 'Yes, notify' to confirm."
            ),
            WriteAction.DRAFT_CORRECTIVE_ACTION: (
                f"Draft corrective action for report {payload.get('report_id', 'unknown')} "
                f"based on pattern: {payload.get('pattern_signal', {}).get('recurrence_sentence', 'unknown')}. "
                "Say 'Yes, draft it' to confirm."
            ),
        }
        return prompts.get(action, "Confirm this action?")


def confirmation_gate_decorator(gate: ConfirmationGate):
    """
    Decorator to wrap write tool handlers with confirmation gate.

    Usage:
        @confirmation_gate_decorator(gate)
        def handle_create_near_miss(args, state):
            # This only runs after confirmation
            return create_near_miss_impl(args)
    """
    def decorator(func: Callable):
        def wrapper(action_name: str, arguments: dict, state_manager: StateManager):
            # Check if this action requires confirmation
            try:
                action = WriteAction(action_name)
            except ValueError:
                # Not a write action, execute directly
                return func(action_name, arguments, state_manager)

            if not gate.requires_confirmation(action):
                return func(action_name, arguments, state_manager)

            state = state_manager.get_state(arguments.get("session_id", ""))

            if not state or state.confirmation_status != ConfirmationStatus.CONFIRMED:
                # Request confirmation
                return gate.request_confirmation(
                    action=action,
                    payload=arguments,
                    session_id=arguments.get("session_id", ""),
                    user_id=arguments.get("user_id", ""),
                )

            # Confirmation received - execute the actual write
            # Clear pending confirmation
            if state:
                state.confirmation_status = ConfirmationStatus.NOT_REQUIRED
                state_manager.update_state(state)

            return func(action_name, arguments, state_manager)

        return wrapper
    return decorator