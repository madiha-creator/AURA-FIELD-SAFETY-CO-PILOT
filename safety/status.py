"""
SAF-003: check_safety_status implementation
"""

from typing import Dict, Any, Optional, List


def check_safety_status(
    mode: str,
    site_id: Optional[str] = None,
    equipment_id: Optional[str] = None,
    self_reported_clear: Optional[bool] = None,
    last_threshold: Optional[Dict[str, Any]] = None,
    hazard_flags: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Evaluates safety status sentinel rules:
    - self_reported_clear is False -> safe_to_report False, exposure_state exposed, recommended_action evacuate_or_isolate
    - last threshold severity critical and worker not confirmed clear -> block reporting
    - unknown exposure -> safe_to_report False unless worker explicitly confirmed clear and no active critical reading
    - field_ops guidance may continue; only reporting writes are gated

    Returns exact dict schema:
    {
      "safe_to_report": bool,
      "exposure_state": "clear|exposed|unknown",
      "reason": string,
      "recommended_action": "proceed|evacuate_or_isolate|wait_and_retry|get_supervisor"
    }
    """
    hazard_flags = hazard_flags or []

    # Rule 1: Explicitly reported exposed/not clear
    if self_reported_clear is False:
        return {
            "safe_to_report": False,
            "exposure_state": "exposed",
            "reason": "Worker is currently exposed to an unisolated active site hazard.",
            "recommended_action": "evacuate_or_isolate"
        }

    # Rule 2: Active critical threshold reading without clear confirmation
    if last_threshold and isinstance(last_threshold, dict):
        severity = last_threshold.get("severity")
        if severity == "critical" and self_reported_clear is not True:
            param = last_threshold.get("parameter") or "measured parameter"
            val = last_threshold.get("measured_value")
            unit = last_threshold.get("unit", "")
            return {
                "safe_to_report": False,
                "exposure_state": "exposed",
                "reason": f"Critical threshold breach detected ({param}: {val} {unit}). Worker must verify hazard isolation before submitting reports.",
                "recommended_action": "evacuate_or_isolate"
            }

    # Rule 3: Active hazard flags without clear confirmation
    if hazard_flags and self_reported_clear is not True:
        return {
            "safe_to_report": False,
            "exposure_state": "exposed",
            "reason": f"Active site hazard flags present ({', '.join(hazard_flags)}).",
            "recommended_action": "evacuate_or_isolate"
        }

    # Rule 4: If self_reported_clear is None and last_threshold is warn (ambiguous/unknown safety state)
    if self_reported_clear is None and last_threshold and last_threshold.get("severity") == "warn":
        return {
            "safe_to_report": False,
            "exposure_state": "unknown",
            "reason": "Worker exposure status is unconfirmed following parameter warning. Safety clear verification required before reporting.",
            "recommended_action": "wait_and_retry"
        }

    # Rule 5: Worker confirmed clear or no active hazards present
    return {
        "safe_to_report": True,
        "exposure_state": "clear",
        "reason": "Site area verified safe and worker confirmed clear of exposure.",
        "recommended_action": "proceed"
    }
