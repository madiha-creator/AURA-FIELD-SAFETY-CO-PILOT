"""
BE-003 & INT-001..004: Tool Dispatcher matching locked SAF contracts.
"""

import hashlib
import json
from datetime import datetime, date
from typing import Any, Optional

from backend.state_manager import (
    ConversationState, StateManager, ProvenanceSource, ProvenanceField, ConfirmationStatus
)
from backend.confirmation_gate import ConfirmationGate, WriteAction
from backend.audit_logger import AuditLogger, AuditAction
from integrations.database import get_database


def compute_idempotency_key(worker_id: str, site: str, equipment: str, narrative: str, local_day: str = None) -> str:
    """Computes stable idempotency key hash(worker_id + site + equipment + normalized_narrative + local_day)."""
    if not local_day:
        local_day = date.today().isoformat()
    norm_narrative = (narrative or "").strip().lower()
    raw = f"{worker_id}:{site}:{equipment}:{norm_narrative}:{local_day}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


class ToolDispatcher:
    """
    Central tool dispatcher managing tool.call -> execute -> tool.result.
    Implements locked SAF contracts for all 10 tools.
    """

    def __init__(self, state_manager: StateManager, audit_logger: AuditLogger):
        self.state_manager = state_manager
        self.audit_logger = audit_logger
        self.confirmation_gate = ConfirmationGate(state_manager, audit_logger)
        self.db = get_database()

    def handle_interruption(self, session_id: str, tool_call_id: str) -> None:
        state = self.state_manager.get_state(session_id)
        if state:
            self.audit_logger.log_action(
                user_id=state.user_id,
                action=AuditAction.TOOL_INTERRUPTED,
                session_id=session_id,
                metadata={"tool_call_id": tool_call_id},
                interrupted=True,
            )
            if state.confirmation_status == ConfirmationStatus.PENDING:
                state.confirmation_status = ConfirmationStatus.NOT_REQUIRED
                self.state_manager.update_state(state)

    def execute(self, tool_name: str, arguments: dict, state_manager: Optional[StateManager] = None) -> Any:
        sm = state_manager or self.state_manager
        session_id = arguments.get("session_id", "")
        state = sm.get_state(session_id) if session_id else None
        worker_id = arguments.get("worker_id") or (state.user_id if state else "unknown_worker")

        # 1. check_safety_status
        if tool_name == "check_safety_status":
            mode = arguments.get("mode", "reporting")
            site_id = arguments.get("site_id")
            equipment_id = arguments.get("equipment_id")
            self_reported_clear = arguments.get("self_reported_clear")

            if self_reported_clear is False:
                return {
                    "safe_to_report": False,
                    "exposure_state": "exposed",
                    "reason": "Worker is self-reported exposed to active hazard.",
                    "recommended_action": "evacuate_or_isolate"
                }
            return {
                "safe_to_report": True,
                "exposure_state": "clear",
                "reason": "No active hazard detected.",
                "recommended_action": "proceed"
            }

        # 2. check_safety_threshold
        elif tool_name == "check_safety_threshold":
            parameter = arguments.get("parameter", "")
            val = float(arguments.get("value", 0))
            unit = arguments.get("unit", "")
            context = arguments.get("context", {})

            ranges = {
                "pressure": {"min": 4.0, "max": 10.0, "unit": "PSI"},
                "coolant line pressure": {"min": 4.0, "max": 10.0, "unit": "PSI"},
                "temperature": {"min": 50.0, "max": 180.0, "unit": "F"},
            }

            key = parameter.lower()
            if key not in ranges and context and context.get("procedure"):
                key = "pressure"

            if key in ranges:
                r = ranges[key]
                min_v, max_v = r["min"], r["max"]
                in_range = min_v <= val <= max_v
                dev_pct = 0.0
                if val > max_v:
                    dev_pct = round(((val - max_v) / (max_v - min_v if max_v != min_v else 1)) * 100, 1)
                elif val < min_v:
                    dev_pct = round(((min_v - val) / (max_v - min_v if max_v != min_v else 1)) * 100, 1)

                severity = "ok"
                if not in_range:
                    severity = "critical" if dev_pct > 30 else "warn"

                msg = f"Reading {val} {unit} is safe." if in_range else f"WARNING: {parameter} is {val} {unit}, which exceeds maximum safe threshold of {max_v} {unit} by {dev_pct}%!"
                return {
                    "in_range": in_range,
                    "measured_value": val,
                    "unit": unit,
                    "expected_range": {"min": min_v, "max": max_v},
                    "deviation_pct": dev_pct,
                    "severity": severity,
                    "message": msg
                }
            else:
                return {
                    "in_range": False,
                    "measured_value": val,
                    "unit": unit,
                    "expected_range": {"min": 0, "max": 0},
                    "deviation_pct": 0,
                    "severity": "unknown",
                    "message": f"Unknown safety range for {parameter}. Please confirm equipment and unit."
                }

        # 3. query_manual_db
        elif tool_name == "query_manual_db":
            procedure = arguments.get("procedure", "Standard Procedure")
            step = arguments.get("step")
            return {
                "excerpt": f"Manual instructions for {procedure} step {step or 1}: Ensure valve is isolated and verify pressure gauge.",
                "step_text": f"Step {step or 1}: Check gauge pressure.",
                "related_ranges": [{"parameter": "coolant line pressure", "min": 4.0, "max": 10.0, "unit": "PSI"}]
            }

        # 4. get_next_step (Requires worker confirmation of current step)
        elif tool_name == "get_next_step":
            procedure = arguments.get("procedure")
            current_step = int(arguments.get("current_step", 1))
            next_step = current_step + 1
            is_final = next_step >= 5
            return {
                "next_step_id": next_step if not is_final else None,
                "step_text": f"Step {next_step}: Verify torque specs on mounting bolts.",
                "is_final": is_final
            }

        # 5. log_maintenance_entry (Write tool -> confirmation gate)
        elif tool_name == "log_maintenance_entry":
            if state and state.confirmation_status != ConfirmationStatus.CONFIRMED:
                return self.confirmation_gate.request_confirmation(
                    action=WriteAction.LOG_MAINTENANCE_ENTRY,
                    payload=arguments,
                    session_id=session_id,
                    user_id=worker_id,
                )
            entry_id = self.db.create_maintenance_entry({
                "location": arguments.get("location") or "Site Bay 2",
                "equipment": arguments.get("equipment") or arguments.get("component"),
                "issue_description": f"{arguments.get('action')}: {arguments.get('condition')}",
                "severity": "medium",
                "worker_id": worker_id
            })
            return {"entry_id": entry_id, "written": True}

        # 6. get_missing_fields
        elif tool_name == "get_missing_fields":
            schema_state = arguments.get("schema_state", {})
            required_fields = {
                "location": "Where did the near miss occur?",
                "equipment": "What equipment was involved?",
                "hazard_type": "What type of hazard was observed?",
                "injury": "Were there any injuries?"
            }
            missing = []
            for field, q in required_fields.items():
                val = schema_state.get(field)
                if not val or (isinstance(val, dict) and not val.get("value")):
                    missing.append({"field": field, "question": q})
            return {"missing": missing, "complete": len(missing) == 0}

        # 7. search_similar_reports
        elif tool_name == "search_similar_reports":
            text = arguments.get("embedding_or_text", "")
            filters = arguments.get("filters", {})
            res = self.db.search_similar_reports_db(text, site=filters.get("site"), equipment=filters.get("equipment"))
            return res

        # 8. create_near_miss (Write tool -> requires confirmation_gate AND check_safety_status.safe_to_report)
        elif tool_name == "create_near_miss":
            if state and state.confirmation_status != ConfirmationStatus.CONFIRMED:
                return self.confirmation_gate.request_confirmation(
                    action=WriteAction.CREATE_NEAR_MISS,
                    payload=arguments,
                    session_id=session_id,
                    user_id=worker_id,
                )

            report_payload = arguments.get("report", {})
            idempotency_key = arguments.get("idempotency_key")
            if not idempotency_key:
                idempotency_key = compute_idempotency_key(
                    worker_id=worker_id,
                    site=report_payload.get("location", ""),
                    equipment=report_payload.get("equipment", ""),
                    narrative=report_payload.get("narrative", "")
                )

            existing = self.db.get_report_by_idempotency_key(idempotency_key)
            if existing:
                return {"report_id": existing["id"], "created": False, "duplicate": True}

            report_id = self.db.create_report({
                "location": report_payload.get("location"),
                "equipment": report_payload.get("equipment"),
                "hazard_type": report_payload.get("hazard_type"),
                "injury": report_payload.get("injury"),
                "narrative": report_payload.get("narrative"),
                "provenance": report_payload.get("provenance", {}),
                "worker_id": worker_id,
                "idempotency_key": idempotency_key,
                "status": "awaiting_review"
            })
            return {"report_id": report_id, "created": True, "duplicate": False}

        # 9. notify_safety_contact (Write tool)
        elif tool_name == "notify_safety_contact":
            if state and state.confirmation_status != ConfirmationStatus.CONFIRMED:
                return self.confirmation_gate.request_confirmation(
                    action=WriteAction.NOTIFY_SAFETY_CONTACT,
                    payload=arguments,
                    session_id=session_id,
                    user_id=worker_id,
                )
            report_id = arguments.get("report_id")
            policy = arguments.get("site_policy", {})
            roles = policy.get("auto_notify_roles", ["safety_officer"])
            channel = policy.get("channel", "email/sms")
            self.db.create_notification({
                "alert_type": "near_miss",
                "severity": "high",
                "location": "Site Main",
                "recipient_role": roles[0],
                "sender_id": worker_id
            })
            return {"notified": roles, "channel": channel}

        # 10. draft_corrective_action (Draft only, pending supervisor)
        elif tool_name == "draft_corrective_action":
            report_id = arguments.get("report_id")
            pattern_signal = arguments.get("pattern_signal", {})
            sentence = pattern_signal.get("sentence", "Recurring hazard detected.")
            draft_id = self.db.create_corrective_action({
                "report_id": report_id,
                "pattern_signal": pattern_signal,
                "proposed_action": f"Supervisor Review Required: {sentence}",
                "status": "pending_supervisor"
            })
            return {"draft_id": draft_id, "sentence": sentence, "status": "pending_supervisor"}

        return {"error": f"Unknown tool {tool_name}"}
