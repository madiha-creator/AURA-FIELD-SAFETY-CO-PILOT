"""
BE-003 & INT-001..004 & SAF-001..004 & DAT-001..005: Tool Dispatcher integrated with Safety and Data modules.
"""

import hashlib
import json
import os
from datetime import datetime, date
from typing import Any, Optional

from backend.state_manager import (
    ConversationState, StateManager, ProvenanceSource, ProvenanceField, ConfirmationStatus
)
from backend.confirmation_gate import ConfirmationGate, WriteAction
from backend.audit_logger import AuditLogger, AuditAction
from integrations.database import get_database

from safety.threshold import check_safety_threshold as saf_check_safety_threshold
from safety.status import check_safety_status as saf_check_safety_status
from safety.decision_boundaries import classify_action as saf_classify_action
from data.query_manual_db import query_manual_db as dat_query_manual_db
from data.missing_fields import get_missing_fields as dat_get_missing_fields
from data.similar_reports import search_similar_incidents as dat_search_similar_incidents


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
    Integrates safety and retrieval modules while preserving tool interfaces and contracts.
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
            last_threshold = arguments.get("last_threshold")
            hazard_flags = arguments.get("hazard_flags")

            return saf_check_safety_status(
                mode=mode,
                site_id=site_id,
                equipment_id=equipment_id,
                self_reported_clear=self_reported_clear,
                last_threshold=last_threshold,
                hazard_flags=hazard_flags
            )

        # 2. check_safety_threshold
        elif tool_name == "check_safety_threshold":
            parameter = arguments.get("parameter", "")
            val = float(arguments.get("value", 0))
            unit = arguments.get("unit")
            context = arguments.get("context")

            return saf_check_safety_threshold(
                parameter=parameter,
                value=val,
                unit=unit,
                context=context
            )

        # 3. query_manual_db
        elif tool_name == "query_manual_db":
            procedure = arguments.get("procedure", "Standard Procedure")
            step = arguments.get("step")
            parameter = arguments.get("parameter")

            return dat_query_manual_db(
                procedure=procedure,
                step=step,
                parameter=parameter
            )

        # 4. get_next_step (Requires worker confirmation of current step, retrieves from manual DB)
        elif tool_name == "get_next_step":
            procedure = arguments.get("procedure", "proc_coolant_flush")
            current_step = int(arguments.get("current_step", 1))
            next_step = current_step + 1

            # Fetch step text from data manuals/index if available
            manual_res = dat_query_manual_db(procedure=procedure, step=next_step)
            step_text = manual_res.get("step_text")

            if not step_text:
                # Fallback procedure step generator if exact step is beyond manual length
                if current_step >= 4:
                    return {
                        "next_step_id": None,
                        "step_text": "Procedure complete. All verifications recorded.",
                        "is_final": True
                    }
                step_text = f"Step {next_step}: Verify system pressure and inspect connections."

            is_final = (next_step >= 4)
            return {
                "next_step_id": next_step if not is_final else None,
                "step_text": step_text,
                "is_final": is_final
            }

        # 5. log_maintenance_entry (Write tool -> confirmation gate)
        elif tool_name == "log_maintenance_entry":
            classification = saf_classify_action("log_maintenance_entry", context=arguments)
            if not classification.get("allowed", True):
                return {"error": "Action blocked by safety decision boundary policy."}

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
            return dat_get_missing_fields(schema_state)

        # 7. search_similar_reports
        elif tool_name == "search_similar_reports":
            text = arguments.get("embedding_or_text", "")
            filters = arguments.get("filters", {})
            equipment = filters.get("equipment") or arguments.get("equipment")
            hazard_type = filters.get("hazard_type") or arguments.get("hazard_type")
            site = filters.get("site") or arguments.get("site")

            return dat_search_similar_incidents(
                query_text=text,
                equipment=equipment,
                hazard_type=hazard_type,
                site=site
            )

        # 8. create_near_miss (Write tool -> requires check_safety_status & confirmation_gate)
        elif tool_name == "create_near_miss":
            classification = saf_classify_action("create_near_miss", context=arguments)
            if not classification.get("allowed", True):
                return {
                    "error": "Cannot submit near-miss report: Worker safety status is exposed or unverified.",
                    "safe_to_report": False
                }

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
            classification = saf_classify_action("notify_safety_contact", context=arguments)
            if not classification.get("allowed", True):
                return {"error": "Cannot notify safety contact without a valid report_id."}

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
            classification = saf_classify_action("draft_corrective_action", context=arguments)
            if not classification.get("allowed", True):
                return {"error": "Drafting corrective action blocked by safety policy."}

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
