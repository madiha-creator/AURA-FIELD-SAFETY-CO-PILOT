"""
BE-003: Tool Dispatcher

Full tool.call → execute → tool.result round trip with interruption handling.

Handles:
- Tool execution with confirmation gate (BE-004)
- Interruption-safe handling (if tool call interrupted mid-reply)
- Audit logging of all tool executions
- Idempotency for create_near_miss (INT-002)
"""

from abc import ABC, abstractmethod
from typing import Any, Optional
from dataclasses import dataclass

from ..core.state_manager import (
    ConversationState, StateManager, ProvenanceSource, ProvenanceField
)
from ..services.confirmation_gate import ConfirmationGate, WriteAction
from ..services.audit_logger import AuditLogger, AuditAction
from ..integrations.database import DatabaseInterface, get_database


@dataclass
class ToolResult:
    """Standardized tool result."""
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    confirmation_required: bool = False
    confirmation_payload: Optional[dict] = None


class ToolHandler(ABC):
    """Abstract base for tool handlers."""

    @abstractmethod
    def execute(self, arguments: dict, state: ConversationState) -> ToolResult:
        """Execute the tool with given arguments and state."""
        pass

    @abstractmethod
    def get_name(self) -> str:
        """Return the tool name."""
        pass

    @property
    def requires_confirmation(self) -> bool:
        """Whether this tool requires confirmation gate."""
        return True


class LogMaintenanceEntryHandler(ToolHandler):
    """INT-001: log_maintenance_entry - structured write to Salesforce/Jira/SQL."""

    def get_name(self) -> str:
        return "log_maintenance_entry"

    @property
    def requires_confirmation(self) -> bool:
        return True

    def execute(self, arguments: dict, state: ConversationState) -> ToolResult:
        location = arguments.get("location")
        equipment = arguments.get("equipment")
        issue_description = arguments.get("issue_description")
        severity = arguments.get("severity", "medium")
        provenance = arguments.get("provenance", {})

        if not all([location, equipment, issue_description]):
            return ToolResult(success=False, error="Missing required fields")

        db = get_database()
        # TODO: Verify real Salesforce/Jira field names
        # This is a mock implementation - replace with real integration
        entry_id = db.create_maintenance_entry({
            "location": location,
            "equipment": equipment,
            "issue_description": issue_description,
            "severity": severity,
            "provenance": provenance,
            "worker_id": state.user_id,
        })

        return ToolResult(
            success=True,
            data={"entry_id": entry_id, "status": "logged"},
        )


class CreateNearMissHandler(ToolHandler):
    """INT-002: create_near_miss - confirmed report with idempotency key."""

    def get_name(self) -> str:
        return "create_near_miss"

    @property
    def requires_confirmation(self) -> bool:
        return True

    def execute(self, arguments: dict, state: ConversationState) -> ToolResult:
        idempotency_key = arguments.get("idempotency_key")
        if not idempotency_key:
            return ToolResult(success=False, error="Missing idempotency_key")

        # Idempotency check - prevent duplicate writes
        db = get_database()
        existing = db.get_report_by_idempotency_key(idempotency_key)
        if existing:
            return ToolResult(
                success=True,
                data={"report_id": existing["id"], "status": "already_exists", "duplicate": True},
            )

        # Build report from state + arguments (arguments should match state.report)
        report_data = {
            "location": arguments.get("location"),
            "equipment": arguments.get("equipment"),
            "hazard_type": arguments.get("hazard_type"),
            "injury": arguments.get("injury"),
            "narrative": arguments.get("narrative", ""),
            "provenance": arguments.get("provenance", state.report.get_provenance_dict()),
            "status": "awaiting_review",  # UI contract: awaiting_review, in_progress, approved/rejected
            "worker_id": state.user_id,
            "idempotency_key": idempotency_key,
        }

        # Validate required fields
        required = ["location", "equipment", "hazard_type", "injury"]
        for field in required:
            if not report_data[field]:
                return ToolResult(success=False, error=f"Missing required field: {field}")

        report_id = db.create_report(report_data)

        # Clear report state after successful creation
        state.report = state.report.__class__()  # Reset
        state.confirmation_status = state.confirmation_status.__class__.NOT_REQUIRED

        return ToolResult(
            success=True,
            data={"report_id": report_id, "status": "awaiting_review"},
        )


class NotifySafetyContactHandler(ToolHandler):
    """INT-003: notify_safety_contact - route notifications per site policy."""

    def get_name(self) -> str:
        return "notify_safety_contact"

    @property
    def requires_confirmation(self) -> bool:
        return True

    def execute(self, arguments: dict, state: ConversationState) -> ToolResult:
        # TODO: Implement site policy routing logic
        # This is a stub - real implementation queries site policy config
        recipient_role = arguments.get("recipient_role")
        if not recipient_role:
            return ToolResult(success=False, error="Missing recipient_role")

        # Extract safety threshold data for notification
        measured_value = arguments.get("measured_value")
        unit = arguments.get("unit")
        expected_range = arguments.get("expected_range")
        deviation_percentage = arguments.get("deviation_percentage")
        required_acknowledgments = arguments.get("required_acknowledgments", [])

        db = get_database()
        notification_id = db.create_notification({
            "alert_type": arguments.get("alert_type"),
            "severity": arguments.get("severity"),
            "location": arguments.get("location"),
            "equipment": arguments.get("equipment"),
            "measured_value": measured_value,
            "unit": unit,
            "expected_range": expected_range,
            "deviation_percentage": deviation_percentage,
            "required_acknowledgments": required_acknowledgments,
            "recipient_role": recipient_role,
            "sender_id": state.user_id,
        })

        return ToolResult(
            success=True,
            data={"notification_id": notification_id, "status": "sent"},
        )


class DraftCorrectiveActionHandler(ToolHandler):
    """INT-004: draft_corrective_action - proposed action for supervisor approval."""

    def get_name(self) -> str:
        return "draft_corrective_action"

    @property
    def requires_confirmation(self) -> bool:
        return True

    def execute(self, arguments: dict, state: ConversationState) -> ToolResult:
        report_id = arguments.get("report_id")
        pattern_signal = arguments.get("pattern_signal", {})
        proposed_action = arguments.get("proposed_action")

        if not report_id or not pattern_signal:
            return ToolResult(success=False, error="Missing report_id or pattern_signal")

        # Pattern signal must be structurable into human-readable sentence
        # (per UI contract: "3rd near miss involving Forklift 12 this month")
        recurrence_sentence = pattern_signal.get("recurrence_sentence")
        if not recurrence_sentence:
            return ToolResult(success=False, error="Pattern signal missing recurrence_sentence")

        db = get_database()
        action_id = db.create_corrective_action({
            "report_id": report_id,
            "pattern_signal": pattern_signal,
            "proposed_action": proposed_action or "Investigate and implement preventive measures",
            "supervisor_review_required": arguments.get("supervisor_review_required", True),
            "status": "pending_approval",
        })

        return ToolResult(
            success=True,
            data={"action_id": action_id, "status": "pending_approval"},
        )


class CheckSafetyThresholdHandler(ToolHandler):
    """
    Safety threshold check - NOT a write action, no confirmation needed.

    Returns structured data matching UI contract alert screen:
    - measured value, unit, expected range, deviation metric (percentage-over-tolerance)
    """

    def get_name(self) -> str:
        return "check_safety_threshold"

    @property
    def requires_confirmation(self) -> bool:
        return False  # Read-only, no confirmation

    def execute(self, arguments: dict, state: ConversationState) -> ToolResult:
        measurement_name = arguments.get("measurement_name")
        measured_value = arguments.get("measured_value")
        unit = arguments.get("unit")
        equipment = arguments.get("equipment")
        location = arguments.get("location")

        if None in [measurement_name, measured_value, unit, equipment, location]:
            return ToolResult(success=False, error="Missing required fields")

        # TODO: Implement real threshold lookup from safety config/database
        # Stub implementation with example values
        expected_ranges = {
            "temperature": (20.0, 80.0),
            "pressure": (1.0, 10.0),
            "vibration": (0.0, 5.0),
        }

        expected_range = expected_ranges.get(measurement_name, (0.0, 100.0))
        min_val, max_val = expected_range

        # Calculate deviation percentage over tolerance
        # Deviation = how far past the limit as % of the range
        if measured_value > max_val:
            deviation = ((measured_value - max_val) / (max_val - min_val)) * 100
            status = "exceeded"
        elif measured_value < min_val:
            deviation = ((min_val - measured_value) / (max_val - min_val)) * 100
            status = "below_minimum"
        else:
            deviation = 0.0
            status = "normal"

        # Update state for alert if needed
        if status != "normal":
            state.active_alert = {
                "measurement": measurement_name,
                "measured_value": measured_value,
                "unit": unit,
                "expected_range": f"{min_val}-{max_val} {unit}",
                "deviation_percentage": round(deviation, 1),
                "status": status,
                "equipment": equipment,
                "location": location,
            }

        return ToolResult(
            success=True,
            data={
                "measurement_name": measurement_name,
                "measured_value": measured_value,
                "unit": unit,
                "expected_range": f"{min_val}-{max_val} {unit}",
                "deviation_percentage": round(deviation, 1),
                "status": status,
                # Additional fields for UI alert screen
                "severity_tag": "CRITICAL ANOMALY" if deviation > 100 else "WARNING",
                "required_acknowledgments": ["Line isolated", "Vent open"] if deviation > 100 else [],
            },
        )


class ToolDispatcher:
    """
    Central tool dispatcher managing tool.call → execute → tool.result flow.

    Handles:
    - Tool registration and lookup
    - Confirmation gate integration
    - Interruption-safe execution (BE-003)
    - Audit logging (BE-005)
    """

    def __init__(self, state_manager: StateManager, audit_logger: AuditLogger):
        self.state_manager = state_manager
        self.audit_logger = audit_logger
        self.confirmation_gate = ConfirmationGate(state_manager, audit_logger)

        # Register all tool handlers
        self.handlers = {
            h.get_name(): h
            for h in [
                LogMaintenanceEntryHandler(),
                CreateNearMissHandler(),
                NotifySafetyContactHandler(),
                DraftCorrectiveActionHandler(),
                CheckSafetyThresholdHandler(),
            ]
        }

    def execute(self, tool_name: str, arguments: dict, state_manager: Optional[StateManager] = None) -> Any:
        """
        Execute a tool by name with arguments.

        Returns tool result (for tool.result message to AssemblyAI).

        Interruption handling: If reply.done with status=interrupted arrives
        during tool execution, the tool should be idempotent or cancellable.
        """
        sm = state_manager or self.state_manager
        state = sm.get_state(arguments.get("session_id", ""))

        # Log tool call attempt
        self.audit_logger.log_action(
            user_id=arguments.get("user_id", state.user_id if state else "unknown"),
            action=AuditAction.TOOL_CALL,
            session_id=arguments.get("session_id"),
            metadata={"tool": tool_name, "arguments": arguments},
        )

        handler = self.handlers.get(tool_name)
        if not handler:
            self.audit_logger.log_action(
                user_id=arguments.get("user_id", "unknown"),
                action=AuditAction.TOOL_CALL,
                session_id=arguments.get("session_id"),
                metadata={"tool": tool_name, "error": "Unknown tool"},
            )
            return {"error": f"Unknown tool: {tool_name}"}

        # Check confirmation gate
        try:
            action = WriteAction(tool_name)
            if handler.requires_confirmation and self.confirmation_gate.requires_confirmation(action):
                state = sm.get_state(arguments.get("session_id", ""))
                if not state or state.confirmation_status != ConfirmationStatus.CONFIRMED:
                    # Request confirmation - return special result for agent to prompt worker
                    return self.confirmation_gate.request_confirmation(
                        action=action,
                        payload=arguments,
                        session_id=arguments.get("session_id", ""),
                        user_id=arguments.get("user_id", state.user_id if state else "unknown"),
                    )
        except ValueError:
            pass  # Not a WriteAction, no confirmation needed

        # Execute the tool
        try:
            result = handler.execute(arguments, state)

            # Log successful execution
            self.audit_logger.log_action(
                user_id=arguments.get("user_id", state.user_id if state else "unknown"),
                action=AuditAction.TOOL_EXECUTED,
                session_id=arguments.get("session_id"),
                metadata={"tool": tool_name, "result": result.data if result.success else result.error},
                provenance=state.report.get_provenance_dict() if state and state.report else None,
            )

            if not result.success:
                return {"error": result.error}

            if result.confirmation_required:
                # This shouldn't happen - gate should have caught it
                # But return confirmation request if needed
                return result.confirmation_payload or {"confirmation_required": True}

            return result.data

        except Exception as e:
            self.audit_logger.log_action(
                user_id=arguments.get("user_id", "unknown"),
                action=AuditAction.TOOL_EXECUTED,
                session_id=arguments.get("session_id"),
                metadata={"tool": tool_name, "error": str(e)},
            )
            return {"error": f"Tool execution failed: {str(e)}"}

    def handle_interruption(self, session_id: str, tool_call_id: str) -> None:
        """Handle tool call interrupted mid-execution (BE-003).

        Called when reply.done with status=interrupted arrives.
        Log the interruption and clean up any pending state.
        """
        state = self.state_manager.get_state(session_id)
        if state:
            self.audit_logger.log_action(
                user_id=state.user_id,
                action=AuditAction.TOOL_INTERRUPTED,
                session_id=session_id,
                metadata={"tool_call_id": tool_call_id},
                interrupted=True,
            )

            # Reset confirmation if it was pending for the interrupted tool
            if state.confirmation_status == ConfirmationStatus.PENDING:
                state.confirmation_status = ConfirmationStatus.NOT_REQUIRED
                self.state_manager.update_state(state)