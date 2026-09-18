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
