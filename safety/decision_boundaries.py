"""
SAF-004: Decision Boundaries Policy Engine
"""

from typing import Dict, Any, Optional
from safety.status import check_safety_status


def classify_action(action: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Classifies actions into safety boundary levels:
    - automatic: Executed immediately without explicit human confirmation.
    - confirm: Requires explicit voice or UI confirmation from worker.
    - supervisor-approve: Requires explicit supervisor review/approval.
    - never: Strictly forbidden by safety policy.

    Returns dict schema:
    {
        "boundary": "automatic|confirm|supervisor-approve|never",
        "requires_confirmation": bool,
        "requires_supervisor": bool,
        "allowed": bool
    }
    """
    context = context or {}
    act = (action or "").strip().lower()

    # Boundary 1: NEVER (forbidden actions)
    # Medical advice, ignore PPE, silent auto-write of incidents
    forbidden_actions = {
        "medical_advice", "give_medical_advice", "diagnose_injury",
        "ignore_ppe", "bypass_safety", "override_ppe",
        "silent_auto_write", "auto_write_incident", "silent_create_report"
    }
    if act in forbidden_actions:
        return {
            "boundary": "never",
            "requires_confirmation": False,
            "requires_supervisor": False,
            "allowed": False
        }

    # Boundary 2: AUTOMATIC
    # Speak a safety warning, draft corrective action proposal
    if act in {"speak_safety_warning", "speak_warning", "announce_hazard"}:
        return {
            "boundary": "automatic",
            "requires_confirmation": False,
            "requires_supervisor": False,
            "allowed": True
        }

    if act in {"draft_corrective_action", "propose_corrective_action"}:
        return {
            "boundary": "automatic",
            "requires_confirmation": False,
            "requires_supervisor": False,
            "allowed": True
        }

    # Boundary 3: SUPERVISOR-APPROVE
    # Applying corrective action
    if act in {"apply_corrective_action", "execute_corrective_action"}:
        return {
            "boundary": "supervisor-approve",
            "requires_confirmation": True,
            "requires_supervisor": True,
            "allowed": True
        }

    # Boundary 4: CONFIRM (with specific pre-conditions)
    # Advance procedure step
    if act in {"get_next_step", "advance_procedure_step", "advance_step"}:
        return {
            "boundary": "confirm",
            "requires_confirmation": True,
            "requires_supervisor": False,
            "allowed": True
        }

    # log_maintenance_entry
    if act in {"log_maintenance_entry", "log_maintenance"}:
        return {
            "boundary": "confirm",
            "requires_confirmation": True,
            "requires_supervisor": False,
            "allowed": True
        }

    # create_near_miss: confirm, and ONLY if check_safety_status.safe_to_report is true
    if act in {"create_near_miss", "submit_near_miss"}:
        safety_status = context.get("safety_status")
        # Fail-safe: if safety_status is None AND no raw safety inputs provided,
        # block instead of falling through to check_safety_status()'s default-safe Rule 5
        has_raw_inputs = any([
            context.get("self_reported_clear") is not None,
            context.get("last_threshold") is not None,
            context.get("hazard_flags")
        ])
        if not safety_status and not has_raw_inputs:
            return {
                "boundary": "confirm",
                "requires_confirmation": True,
                "requires_supervisor": False,
                "allowed": False,
                "reason": "Safety status must be verified via check_safety_status before submitting a near-miss report."
            }
        if not safety_status:
            safety_status = check_safety_status(
                mode=context.get("mode", "reporting"),
                site_id=context.get("site_id"),
                equipment_id=context.get("equipment_id"),
                self_reported_clear=context.get("self_reported_clear"),
                last_threshold=context.get("last_threshold"),
                hazard_flags=context.get("hazard_flags")
            )
        safe_to_report = safety_status.get("safe_to_report", False)
        return {
            "boundary": "confirm",
            "requires_confirmation": True,
            "requires_supervisor": False,
            "allowed": bool(safe_to_report)
        }

    # notify_safety_contact: confirm; NEVER without report_id; supervisor-approve if site policy requires
    if act in {"notify_safety_contact", "send_safety_notification"}:
        report_id = context.get("report_id")
        if not report_id:
            return {
                "boundary": "never",
                "requires_confirmation": False,
                "requires_supervisor": False,
                "allowed": False
            }
        site_policy = context.get("site_policy", {})
        if site_policy.get("requires_supervisor_approval"):
            return {
                "boundary": "supervisor-approve",
                "requires_confirmation": True,
                "requires_supervisor": True,
                "allowed": True
            }
        return {
            "boundary": "confirm",
            "requires_confirmation": True,
            "requires_supervisor": False,
            "allowed": True
        }

    # Default fallback
    return {
        "boundary": "confirm",
        "requires_confirmation": True,
        "requires_supervisor": False,
        "allowed": True
    }
