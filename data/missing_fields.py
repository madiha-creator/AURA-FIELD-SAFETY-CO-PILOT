"""
DAT-004: get_missing_fields adaptive follow-up logic
"""

from typing import Dict, Any, List
from data.report_schema import REQUIRED_FIELDS, OPTIONAL_FIELDS


FIELD_QUESTIONS = {
    "location": "Where did the incident or near miss occur?",
    "equipment": "What specific equipment or component was involved?",
    "hazard_type": "What type of safety hazard was observed?",
    "injury": "Were there any injuries or medical treatment required?",
    "narrative": "Can you briefly describe what happened?",
    "site_id": "What is the site ID or facility name?",
    "severity": "What is the severity level of this hazard?",
    "witnesses": "Were there any witnesses present?",
    "immediate_actions": "What immediate actions were taken?",
    "time_local": "When did this occur?"
}


def get_missing_fields(schema_state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluates schema_state for missing required fields and unconfirmed AI-inferred fields.
    Empty string, null, and {value: null} are considered missing.
    Priority order: location, equipment, hazard_type, injury, narrative.
    ai_inferred but unconfirmed fields generate a short confirmation question after missing fields.

    Returns:
    {
      "missing": [{"field": string, "question": "short voice question"}],
      "complete": bool
    }
    """
    missing_list = []

    # 1. Process Required Fields in Priority Order
    for field in REQUIRED_FIELDS:
        field_obj = schema_state.get(field)
        val = None
        status = "missing"

        if isinstance(field_obj, dict):
            val = field_obj.get("value")
            status = field_obj.get("status", "missing")
        elif field_obj is not None:
            val = field_obj
            status = "you_said" if val != "" else "missing"

        is_missing = (
            val is None or
            (isinstance(val, str) and val.strip() == "") or
            status == "missing"
        )

        if is_missing:
            q = FIELD_QUESTIONS.get(field, f"Please provide the {field}.")
            missing_list.append({"field": field, "question": q})

    # 2. Process AI-Inferred Unconfirmed Fields for Confirmation
    for field in REQUIRED_FIELDS + OPTIONAL_FIELDS:
        field_obj = schema_state.get(field)
        if isinstance(field_obj, dict):
            status = field_obj.get("status")
            val = field_obj.get("value")
            if status == "ai_inferred" and val is not None and str(val).strip() != "":
                q = f"I inferred {field} as '{val}'. Is that correct?"
                missing_list.append({"field": field, "question": q})

    return {
        "missing": missing_list,
        "complete": len(missing_list) == 0
    }
