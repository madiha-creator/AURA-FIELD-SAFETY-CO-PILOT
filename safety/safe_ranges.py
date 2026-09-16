"""
SAF-001: Safe Range Reference Data Loader and Lookup
"""

import json
import os
from typing import Dict, Any, Optional

_RANGES_FILE = os.path.join(os.path.dirname(__file__), "safe_ranges.json")
_RANGES_CACHE: Optional[Dict[str, Any]] = None


def load_safe_ranges() -> Dict[str, Any]:
    """Loads and caches safe ranges from safety/safe_ranges.json."""
    global _RANGES_CACHE
    if _RANGES_CACHE is None:
        if os.path.exists(_RANGES_FILE):
            with open(_RANGES_FILE, "r", encoding="utf-8") as f:
                _RANGES_CACHE = json.load(f)
        else:
            _RANGES_CACHE = {}
    return _RANGES_CACHE


def get_safe_range(parameter: str, procedure_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Looks up a safe range definition by parameter name and optional procedure_id.
    Matches exact parameter name, parameter key, or aliases (case-insensitive).
    """
    data = load_safe_ranges()
    norm_param = parameter.strip().lower()

    procedures_to_search = []
    if procedure_id and procedure_id in data:
        procedures_to_search.append(data[procedure_id])

    for proc_data in data.values():
        if proc_data not in procedures_to_search:
            procedures_to_search.append(proc_data)

    for proc in procedures_to_search:
        for p_key, p_info in proc.items():
            if norm_param == p_key.lower():
                res = dict(p_info)
                res["parameter"] = p_key
                return res
            aliases = [a.lower() for a in p_info.get("aliases", [])]
            if norm_param in aliases:
                res = dict(p_info)
                res["parameter"] = p_key
                return res

    return None
