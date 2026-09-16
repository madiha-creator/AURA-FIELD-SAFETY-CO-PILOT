"""
SAF-002: check_safety_threshold implementation
"""

from typing import Dict, Any, Optional
from safety.safe_ranges import get_safe_range


def check_safety_threshold(
    parameter: str,
    value: float,
    unit: Optional[str] = None,
    context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Compares measured parameter value against configured safe range.
    Normalizes names via aliases, computes deviation_pct, and evaluates severity.

    Returns exact dict schema:
    {
      "in_range": bool,
      "measured_value": number,
      "unit": string,
      "expected_range": {"min": number, "max": number},
      "deviation_pct": number,
      "severity": "ok|warn|critical|unknown",
      "message": "short voice-safe sentence"
    }
    """
    context = context or {}
    procedure_id = context.get("procedure_id") or context.get("procedure")
    val = float(value)

    range_info = get_safe_range(parameter, procedure_id=procedure_id)

    if not range_info:
        # Unknown parameter must not invent a numeric range
        display_unit = unit or ""
        return {
            "in_range": False,
            "measured_value": val,
            "unit": display_unit,
            "expected_range": {"min": 0, "max": 0},
            "deviation_pct": 0,
            "severity": "unknown",
            "message": f"Unknown safety range for parameter '{parameter}'. Please confirm equipment and baseline range."
        }

    min_v = float(range_info["min"])
    max_v = float(range_info["max"])
    std_unit = range_info.get("unit") or unit or ""
    param_display = range_info.get("parameter", parameter)

    in_range = min_v <= val <= max_v
    range_span = max_v - min_v if max_v != min_v else 1.0

    deviation_pct = 0.0
    if val > max_v:
        deviation_pct = round(((val - max_v) / range_span) * 100.0, 1)
    elif val < min_v:
        deviation_pct = round(((min_v - val) / range_span) * 100.0, 1)

    crit_threshold = range_info.get("critical_deviation_pct", 30.0)

    severity = "ok"
    if not in_range:
        if deviation_pct >= crit_threshold:
            severity = "critical"
        else:
            severity = "warn"

    if in_range:
        message = f"Reading {val} {std_unit} for {param_display} is within safe range ({min_v} to {max_v} {std_unit})."
    else:
        if val > max_v:
            message = f"WARNING: {param_display} reading of {val} {std_unit} exceeds maximum safe limit of {max_v} {std_unit} by {deviation_pct}%."
        else:
            message = f"WARNING: {param_display} reading of {val} {std_unit} is below minimum safe limit of {min_v} {std_unit} by {deviation_pct}%."

    return {
        "in_range": in_range,
        "measured_value": val,
        "unit": std_unit,
        "expected_range": {"min": min_v, "max": max_v},
        "deviation_pct": deviation_pct,
        "severity": severity,
        "message": message
    }
