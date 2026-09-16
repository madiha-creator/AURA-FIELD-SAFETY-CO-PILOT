"""
DAT-003: Incident Report Schema Helper Functions
"""

import json
import os
from typing import Dict, Any, Optional

SCHEMA_FILE = os.path.join(os.path.dirname(__file__), "report_schema.json")

REQUIRED_FIELDS = ["location", "equipment", "hazard_type", "injury", "narrative"]
OPTIONAL_FIELDS = ["site_id", "severity", "witnesses", "immediate_actions", "time_local"]


def make_field_tag(
    value: Any = None,
    status: str = "missing",
    provenance: str = "worker"
) -> Dict[str, Any]:
    """
    Creates a standardized report field object tag:
    {
      "value": value,
      "status": "missing|you_said|ai_inferred|confirmed",
      "provenance": "worker|agent|system"
    }
    """
    if value is None or value == "":
        status = "missing"

    valid_statuses = {"missing", "you_said", "ai_inferred", "confirmed"}
    valid_provenances = {"worker", "agent", "system"}

    if status not in valid_statuses:
        status = "missing"
    if provenance not in valid_provenances:
        provenance = "worker"

    return {
        "value": value if status != "missing" else None,
        "status": status,
        "provenance": provenance
    }


def create_empty_report() -> Dict[str, Dict[str, Any]]:
    """Creates a blank report dict with all required and optional fields initialized to missing."""
    report = {}
    for f in REQUIRED_FIELDS + OPTIONAL_FIELDS:
        report[f] = make_field_tag(value=None, status="missing", provenance="worker")
    return report


def update_report_field(
    report: Dict[str, Any],
    field_name: str,
    value: Any,
    status: str = "you_said",
    provenance: str = "worker"
) -> Dict[str, Any]:
    """Updates a single field in the report schema."""
    report[field_name] = make_field_tag(value=value, status=status, provenance=provenance)
    return report
