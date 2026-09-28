"""
Automated Test Suite for QA-001 through QA-004 + Authentication Security (AUD-001/002).
Runs behavioral tests against state manager, tool dispatcher, confirmation gate, and database.
"""

import os
import time
import json
import unittest
import jwt
from datetime import datetime, timedelta, timezone
import integrations.database as db_module
from backend.state_manager import StateManager, SessionMode, ProvenanceSource, ConfirmationStatus, InMemoryStateBackend
from backend.audit_logger import AuditLogger
from backend.tool_dispatcher import ToolDispatcher, compute_idempotency_key
from backend.config import Config, get_config


class TestQA001to004(unittest.TestCase):
    def setUp(self):
        self.db_file = "test_qa_suite.db"
        if os.path.exists(self.db_file):
            os.remove(self.db_file)

        # Override singleton DB instance to use isolated test DB
        db_module._db_instance = db_module.SQLiteDatabase(db_path=self.db_file)
        self.db = db_module.get_database()

        self.audit_logger = AuditLogger(db_path=self.db_file)
        self.state_backend = InMemoryStateBackend(ttl_seconds=30)
        self.state_manager = StateManager(backend=self.state_backend, audit_logger=self.audit_logger)
        self.dispatcher = ToolDispatcher(self.state_manager, self.audit_logger)

    def tearDown(self):
        db_module._db_instance = None
        if os.path.exists(self.db_file):
            os.remove(self.db_file)

    def test_qa_001_interruption_correcting_report_field(self):
        session_id = "test_qa001"
        worker_id = "worker_01"
        state = self.state_manager.create_session(user_id=worker_id, session_id=session_id)
        self.state_manager.set_mode(session_id, SessionMode.REPORTING)

        self.state_manager.update_report_field(session_id, "location", "Bay 2", ProvenanceSource.SAID)
        self.state_manager.update_report_field(session_id, "equipment", "Valve 2", ProvenanceSource.INFERRED)

        self.state_manager.correct_report_field(session_id, "equipment", "Valve 4", ProvenanceSource.SAID)

        state_after = self.state_manager.get_state(session_id)
        self.assertEqual(state_after.report.location.value, "Bay 2")
        self.assertEqual(state_after.report.equipment.value, "Valve 4")
        self.assertEqual(state_after.report.equipment.source, ProvenanceSource.SAID)

        history = self.audit_logger.get_session_history(session_id)
        corrected_logs = [h for h in history if h["action"] == "field_corrected"]
        self.assertEqual(len(corrected_logs), 1)

        create_logs = [h for h in history if h["action"] == "tool_executed" and "create_near_miss" in str(h["metadata"])]
        self.assertEqual(len(create_logs), 0)

    def test_qa_002_interruption_mid_procedure_step(self):
        session_id = "test_qa002"
        worker_id = "worker_01"
        state = self.state_manager.create_session(user_id=worker_id, session_id=session_id)
        self.state_manager.set_mode(session_id, SessionMode.GUIDED_OPS)
        state.current_step = 2
        self.state_manager.update_state(state)

        self.dispatcher.handle_interruption(session_id, "call_step2_audio")

        result = self.dispatcher.execute("check_safety_threshold", {
            "session_id": session_id,
            "parameter": "pressure",
            "value": 15,
            "unit": "PSI",
            "context": {"procedure": "standard_ops", "step": 2}
        })

        self.assertFalse(result["in_range"])
        self.assertEqual(result["severity"], "critical")
        self.assertIn("WARNING", result["message"])

        state_after = self.state_manager.get_state(session_id)
        self.assertEqual(state_after.current_step, 2)

    def test_qa_003_safety_sentinel_out_of_range(self):
        session_id = "test_qa003"
        worker_id = "worker_01"

        result = self.dispatcher.execute("check_safety_threshold", {
            "session_id": session_id,
            "parameter": "coolant line pressure",
            "value": 15.0,
            "unit": "PSI"
        })

        self.assertFalse(result["in_range"])
        self.assertEqual(result["expected_range"], {"min": 4.0, "max": 10.0})
        self.assertEqual(result["deviation_pct"], 83.3)
        self.assertEqual(result["severity"], "critical")

        status_res = self.dispatcher.execute("check_safety_status", {
            "session_id": session_id,
            "mode": "reporting",
            "worker_id": worker_id,
            "self_reported_clear": False
        })
        self.assertFalse(status_res["safe_to_report"])
        self.assertEqual(status_res["recommended_action"], "evacuate_or_isolate")

    def test_qa_004_session_resume_after_disconnect(self):
        session_id = "test_qa004_stable"
        worker_id = "worker_01"

        state = self.state_manager.create_session(user_id=worker_id, session_id=session_id)
        self.state_manager.set_mode(session_id, SessionMode.REPORTING)
        self.state_manager.update_report_field(session_id, "location", "Site Bay 1", ProvenanceSource.SAID)
        self.state_manager.update_report_field(session_id, "equipment", "Compressor A", ProvenanceSource.SAID)

        key = compute_idempotency_key(
            worker_id=worker_id,
            site="Site Bay 1",
            equipment="Compressor A",
            narrative="Oil leaking near high pressure valve",
            local_day="2026-03-30"
        )

        status_res = self.dispatcher.execute("check_safety_status", {
            "session_id": session_id,
            "mode": "reporting",
            "worker_id": worker_id,
            "self_reported_clear": True
        })
        self.assertTrue(status_res["safe_to_report"])

        state.confirmation_status = ConfirmationStatus.CONFIRMED
        self.state_manager.update_state(state)

        res1 = self.dispatcher.execute("create_near_miss", {
            "session_id": session_id,
            "worker_id": worker_id,
            "idempotency_key": key,
            "report": {
                "location": "Site Bay 1",
                "equipment": "Compressor A",
                "hazard_type": "Fluid Leak",
                "injury": "None",
                "narrative": "Oil leaking near high pressure valve"
            }
        })

        self.assertTrue(res1["created"])
        self.assertFalse(res1["duplicate"])

        resumed_state = self.state_manager.get_state(session_id)
        self.assertIsNotNone(resumed_state)
        self.assertEqual(resumed_state.mode, SessionMode.REPORTING)

        resumed_state.confirmation_status = ConfirmationStatus.CONFIRMED
        self.state_manager.update_state(resumed_state)
        res2 = self.dispatcher.execute("create_near_miss", {
            "session_id": session_id,
            "worker_id": worker_id,
            "idempotency_key": key,
            "report": {
                "location": "Site Bay 1",
                "equipment": "Compressor A",
                "hazard_type": "Fluid Leak",
                "injury": "None",
                "narrative": "Oil leaking near high pressure valve"
            }
        })

        self.assertFalse(res2["created"])
        self.assertTrue(res2["duplicate"])
        self.assertEqual(res1["report_id"], res2["report_id"])

        self.state_backend._store[session_id] = (resumed_state, time.time() - 35)
        expired_state = self.state_manager.get_state(session_id)
        self.assertIsNone(expired_state)

    def test_qa_005_token_route_and_mock_session(self):
        import backend.app as flask_app
        client = flask_app.app.test_client()

        res_no_auth = client.get("/v1/token")
        self.assertEqual(res_no_auth.status_code, 401)

        res_invalid = client.get("/v1/token", headers={"Authorization": "Bearer invalid_jwt_token"})
        self.assertEqual(res_invalid.status_code, 401)

        res_dev = client.get("/v1/token", headers={"Authorization": "Bearer dev-token-bypass"})
        self.assertEqual(res_dev.status_code, 200)
        data = res_dev.get_json()
        self.assertIn("token", data)
        self.assertIn("ws_url", data)

    def test_qa_006_auth_and_401_paths(self):
        import backend.app as flask_app
        client = flask_app.app.test_client()

        jwt_secret = "aura-dev-jwt-secret"

        res_reviews_no_auth = client.get("/api/reviews")
        self.assertEqual(res_reviews_no_auth.status_code, 401)
        self.assertIn("Missing or invalid Authorization header", res_reviews_no_auth.get_json()["error"])

        bad_token = jwt.encode({"sub": "attacker"}, "wrong-secret", algorithm="HS256")
        res_bad_token = client.get("/api/reviews", headers={"Authorization": f"Bearer {bad_token}"})
        self.assertEqual(res_bad_token.status_code, 401)

        expired_payload = {
            "sub": "supervisor_john",
            "exp": datetime.now(timezone.utc) - timedelta(seconds=10)
        }
        expired_token = jwt.encode(expired_payload, jwt_secret, algorithm="HS256")
        res_expired = client.get("/api/reviews", headers={"Authorization": f"Bearer {expired_token}"})
        self.assertEqual(res_expired.status_code, 401)
        self.assertIn("expired", res_expired.get_json()["error"])

        valid_payload = {
            "sub": "supervisor_john",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=5)
        }
        valid_token = jwt.encode(valid_payload, jwt_secret, algorithm="HS256")
        res_valid = client.get("/api/reviews", headers={"Authorization": f"Bearer {valid_token}"})
        self.assertEqual(res_valid.status_code, 200)
        self.assertIn("reviews", res_valid.get_json())

    def test_qa_007_confirmation_flow_end_to_end(self):
        session_id = "test_qa007"
        worker_id = "worker_01"
        self.state_manager.create_session(user_id=worker_id, session_id=session_id)

        payload = {
            "report": {
                "location": "Site Bay 1",
                "equipment": "Compressor A",
                "hazard_type": "Fluid Leak",
                "injury": "None",
                "narrative": "Oil leaking near high pressure valve"
            }
        }
        from backend.confirmation_gate import WriteAction
        result = self.dispatcher.confirmation_gate.request_confirmation(
            action=WriteAction.CREATE_NEAR_MISS,
            payload=payload,
            session_id=session_id,
            user_id=worker_id,
        )
        self.assertTrue(result["confirmation_required"])

        state = self.state_manager.get_state(session_id)
        self.assertEqual(state.pending_action, WriteAction.CREATE_NEAR_MISS.value)
        self.assertEqual(state.pending_payload, payload)

        ok, returned_payload = self.dispatcher.confirmation_gate.verify_confirmation(
            session_id=session_id, user_id=worker_id, confirmed=True
        )
        self.assertTrue(ok)
        self.assertEqual(returned_payload, payload)

        state = self.state_manager.get_state(session_id)
        self.assertIsNone(state.pending_action)
        self.assertIsNone(state.pending_payload)
        self.assertEqual(state.confirmation_status, ConfirmationStatus.CONFIRMED)

        self.dispatcher.confirmation_gate.request_confirmation(
            action=WriteAction.CREATE_NEAR_MISS,
            payload=payload,
            session_id=session_id,
            user_id=worker_id,
        )
        ok, returned_payload = self.dispatcher.confirmation_gate.verify_confirmation(
            session_id=session_id, user_id=worker_id, confirmed=False
        )
        self.assertFalse(ok)
        self.assertIsNone(returned_payload)

        state = self.state_manager.get_state(session_id)
        self.assertIsNone(state.pending_action)
        self.assertIsNone(state.pending_payload)
        self.assertEqual(state.confirmation_status, ConfirmationStatus.REJECTED)

    def test_qa_008_production_refuses_dev_token_bypass(self):
        import backend.app as flask_app
        import backend.config as config_mod

        old_env = config_mod.config.ENV
        try:
            config_mod.config.ENV = "production"
            client = flask_app.app.test_client()

            res = client.get("/v1/token", headers={"Authorization": "Bearer dev-token-bypass"})
            self.assertEqual(res.status_code, 401)
            self.assertIn("disabled in production", res.get_json()["error"])
        finally:
            config_mod.config.ENV = old_env

    def test_qa_009_tool_schema_type_function(self):
        schema_path = "packages/contracts/tools.schema.json"
        self.assertTrue(os.path.exists(schema_path))
        with open(schema_path, "r") as f:
            tools = json.load(f)
        self.assertGreater(len(tools), 0)
        for t in tools:
            self.assertIn("type", t)
            self.assertEqual(t["type"], "function")
            self.assertIn("name", t)
            self.assertIn("description", t)
            self.assertIn("parameters", t)

    def test_qa_010_check_safety_status_blocks_create(self):
        session_id = "test_qa010"
        worker_id = "worker_01"
        state = self.state_manager.create_session(user_id=worker_id, session_id=session_id)
        state.confirmation_status = ConfirmationStatus.CONFIRMED

        # Mark safety status as NOT safe
        state.last_safety_status = {
            "safe_to_report": False,
            "reason": "Active pressure spike hazard present"
        }
        self.state_manager.update_state(state)

        res = self.dispatcher.execute("create_near_miss", {
            "session_id": session_id,
            "worker_id": worker_id,
            "idempotency_key": "key_010",
            "report": {
                "location": "Bay 1",
                "equipment": "Pump 1",
                "hazard_type": "Pressure",
                "injury": "None",
                "narrative": "Spike"
            }
        })
        self.assertIn("error", res)
        self.assertFalse(res.get("safe_to_report", True))

    def test_qa_011_confirmation_gate_blocks_silent_write(self):
        session_id = "test_qa011"
        worker_id = "worker_01"
        state = self.state_manager.create_session(user_id=worker_id, session_id=session_id)
        state.confirmation_status = ConfirmationStatus.NOT_REQUIRED
        state.last_safety_status = {"safe_to_report": True}
        self.state_manager.update_state(state)

        res = self.dispatcher.execute("create_near_miss", {
            "session_id": session_id,
            "worker_id": worker_id,
            "idempotency_key": "key_011",
            "report": {
                "location": "Bay 1",
                "equipment": "Pump 1",
                "hazard_type": "Pressure",
                "injury": "None",
                "narrative": "Spike"
            }
        })
        self.assertTrue(res.get("confirmation_required"))
        self.assertEqual(self.db.get_reports_list(), [
            r for r in self.db.get_reports_list() if r["idempotency_key"] != "key_011"
        ])


if __name__ == "__main__":
    unittest.main()
