"""
Unit tests for DAT-001 through DAT-005 modules.
"""

import pytest
from data.query_manual_db import query_manual_db
from data.report_schema import create_empty_report, update_report_field, make_field_tag
from data.missing_fields import get_missing_fields
from data.similar_reports import search_similar_incidents


def test_dat_001_002_query_manual_db():
    res = query_manual_db(procedure="proc_coolant_flush", step=2, parameter="coolant line pressure")
    assert "excerpt" in res
    assert "step_text" in res
    assert len(res["related_ranges"]) > 0
    assert res["related_ranges"][0]["min"] == 4.0
    assert res["related_ranges"][0]["max"] == 10.0


def test_dat_003_report_schema():
    report = create_empty_report()
    assert report["location"]["status"] == "missing"
    assert report["equipment"]["status"] == "missing"

    update_report_field(report, "location", "Site Bay 2", status="you_said", provenance="worker")
    assert report["location"]["value"] == "Site Bay 2"
    assert report["location"]["status"] == "you_said"


def test_dat_004_missing_fields():
    # Blank schema state
    empty_schema = {}
    res = get_missing_fields(empty_schema)
    assert res["complete"] is False
    assert len(res["missing"]) == 5  # location, equipment, hazard_type, injury, narrative

    # Partial schema state
    partial_schema = {
        "location": make_field_tag("Site Bay 2", status="you_said"),
        "equipment": make_field_tag("Coolant Line Loop A", status="you_said"),
        "hazard_type": make_field_tag("Pressure Leak", status="you_said"),
        "injury": make_field_tag("None", status="you_said"),
        "narrative": make_field_tag("Coolant hose fitting spray observed.", status="you_said")
    }
    res_partial = get_missing_fields(partial_schema)
    assert res_partial["complete"] is True
    assert len(res_partial["missing"]) == 0

    # Inferred unconfirmed field
    inferred_schema = dict(partial_schema)
    inferred_schema["severity"] = make_field_tag("High", status="ai_inferred")
    res_inferred = get_missing_fields(inferred_schema)
    assert len(res_inferred["missing"]) == 1
    assert "I inferred severity as 'High'" in res_inferred["missing"][0]["question"]


def test_dat_005_similar_reports():
    res = search_similar_incidents(
        query_text="Coolant hose fitting spray near high voltage pump motor",
        equipment="Coolant Line Loop A",
        hazard_type="Pressure Leak",
        site="Site Bay 2"
    )
    assert len(res["matches"]) > 0
    assert res["matches"][0]["id"] in ["INC-1001", "INC-1002"]
    assert res["pattern_signal"]["recurring"] is True
    assert res["pattern_signal"]["count"] >= 2
