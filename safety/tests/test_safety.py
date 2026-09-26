"""
Unit tests for SAF-001 through SAF-004 modules.
"""

import pytest
from safety.safe_ranges import load_safe_ranges, get_safe_range
from safety.threshold import check_safety_threshold
from safety.status import check_safety_status
from safety.decision_boundaries import classify_action


def test_saf_001_safe_ranges():
    data = load_safe_ranges()
    assert "proc_coolant_flush" in data

    # Test alias match
    range_info = get_safe_range("coolant pressure")
    assert range_info is not None
    assert range_info["min"] == 4.0
    assert range_info["max"] == 10.0
    assert range_info["unit"] == "PSI"


def test_saf_002_threshold_in_range():
    res = check_safety_threshold("coolant line pressure", 7.0)
    assert res["in_range"] is True
    assert res["measured_value"] == 7.0
    assert res["severity"] == "ok"
    assert res["deviation_pct"] == 0.0


def test_saf_002_threshold_below_min():
    res = check_safety_threshold("coolant line pressure", 2.0)
    assert res["in_range"] is False
    assert res["severity"] == "critical"  # (4-2)/6 = 33.3% > 30%
    assert res["deviation_pct"] == 33.3


def test_saf_002_threshold_above_max():
    res = check_safety_threshold("coolant line pressure", 11.0)
    assert res["in_range"] is False
    assert res["severity"] == "warn"  # (11-10)/6 = 16.7% <= 30%
    assert res["deviation_pct"] == 16.7


def test_saf_002_threshold_unknown_parameter():
    res = check_safety_threshold("non_existent_param_123", 42.0)
    assert res["in_range"] is False
    assert res["severity"] == "unknown"
    assert res["expected_range"] == {"min": 0, "max": 0}


def test_saf_003_status_exposed():
    res = check_safety_status(mode="reporting", self_reported_clear=False)
    assert res["safe_to_report"] is False
    assert res["exposure_state"] == "exposed"
    assert res["recommended_action"] == "evacuate_or_isolate"


def test_saf_003_status_critical_reading():
    crit_threshold = {
        "severity": "critical",
        "parameter": "coolant_line_pressure",
        "measured_value": 15.0,
        "unit": "PSI"
    }
    res = check_safety_status(mode="reporting", self_reported_clear=None, last_threshold=crit_threshold)
    assert res["safe_to_report"] is False
    assert res["exposure_state"] == "exposed"
    assert res["recommended_action"] == "evacuate_or_isolate"


def test_saf_003_status_clear():
    res = check_safety_status(mode="reporting", self_reported_clear=True)
    assert res["safe_to_report"] is True
    assert res["exposure_state"] == "clear"
    assert res["recommended_action"] == "proceed"


def test_saf_004_decision_boundaries():
    # Speak warning -> automatic
    res = classify_action("speak_safety_warning")
    assert res["boundary"] == "automatic"
    assert res["allowed"] is True

    # Advance step -> confirm
    res = classify_action("get_next_step")
    assert res["boundary"] == "confirm"
    assert res["requires_confirmation"] is True

    # log maintenance -> confirm
    res = classify_action("log_maintenance_entry")
    assert res["boundary"] == "confirm"
    assert res["requires_confirmation"] is True

    # create near miss when clear -> confirm & allowed
    res = classify_action("create_near_miss", {"self_reported_clear": True})
    assert res["boundary"] == "confirm"
    assert res["allowed"] is True

    # create near miss when exposed -> blocked
    res = classify_action("create_near_miss", {"self_reported_clear": False})
    assert res["boundary"] == "confirm"
    assert res["allowed"] is False

    # notify safety contact without report_id -> forbidden/never
    res = classify_action("notify_safety_contact", {})
    assert res["boundary"] == "never"
    assert res["allowed"] is False

    # notify safety contact with report_id -> confirm
    res = classify_action("notify_safety_contact", {"report_id": "rep-123"})
    assert res["boundary"] == "confirm"
    assert res["allowed"] is True

    # Medical advice -> never
    res = classify_action("medical_advice")
    assert res["boundary"] == "never"
    assert res["allowed"] is False


# --- New tests for the fail-open fix and threshold-to-status integration ---

def test_create_near_miss_blocked_when_no_prior_safety_check():
    """
    (a) create_near_miss with no prior check_safety_status call is BLOCKED.
    No safety_status in context, no raw inputs -> fail-safe triggers.
    """
    res = classify_action("create_near_miss", {})
    assert res["boundary"] == "confirm"
    assert res["allowed"] is False
    assert "reason" in res
    assert "safety status" in res["reason"].lower()


def test_create_near_miss_allowed_when_prior_clear_check():
    """
    (b) With a prior "clear" check_safety_status call it's ALLOWED (pending confirmation).
    """
    clear_status = {
        "safe_to_report": True,
        "exposure_state": "clear",
        "reason": "Site area verified safe and worker confirmed clear of exposure.",
        "recommended_action": "proceed"
    }
    res = classify_action("create_near_miss", {"safety_status": clear_status})
    assert res["boundary"] == "confirm"
    assert res["allowed"] is True


def test_critical_threshold_blocks_reporting_via_check_safety_status():
    """
    (c) A critical check_safety_threshold reading followed by check_safety_status
    correctly returns safe_to_report: False via Rule 2.
    """
    crit_threshold = {
        "severity": "critical",
        "parameter": "coolant_line_pressure",
        "measured_value": 15.0,
        "unit": "PSI"
    }
    # check_safety_status with last_threshold critical and no self_reported_clear=True
    res = check_safety_status(mode="reporting", self_reported_clear=None, last_threshold=crit_threshold)
    assert res["safe_to_report"] is False
    assert res["exposure_state"] == "exposed"
    assert res["recommended_action"] == "evacuate_or_isolate"
    assert "Critical threshold breach" in res["reason"]


def test_create_near_miss_blocked_by_critical_threshold_via_persisted_status():
    """
    End-to-end: critical threshold persisted -> check_safety_status uses it -> create_near_miss blocked.
    """
    crit_threshold = {
        "severity": "critical",
        "parameter": "coolant_line_pressure",
        "measured_value": 15.0,
        "unit": "PSI"
    }
    # First, check_safety_status evaluates the critical threshold (Rule 2)
    status_res = check_safety_status(mode="reporting", self_reported_clear=None, last_threshold=crit_threshold)
    assert status_res["safe_to_report"] is False

    # Then, create_near_miss receives that persisted status
    res = classify_action("create_near_miss", {"safety_status": status_res})
    assert res["allowed"] is False
    assert res["boundary"] == "confirm"
