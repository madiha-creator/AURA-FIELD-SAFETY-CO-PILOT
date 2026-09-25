"""
Automated Test Suite for QA-001 through QA-004 + Authentication Security (AUD-001/002).
Runs behavioral tests against state manager, tool dispatcher, confirmation gate, and database.
"""

import os
import time
import unittest
import jwt
from datetime import datetime, timedelta, timezone
import integrations.database as db_module
from backend.state_manager import StateManager, SessionMode, ProvenanceSource, ConfirmationStatus, InMemoryStateBackend
from backend.audit_logger import AuditLogger
from backend.tool_dispatcher import ToolDispatcher, compute_idempotency_key


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

        # Initial fields filled
        self.state_manager.update_report_field(session_id, "location", "Bay 2", ProvenanceSource.SAID)
        self.state_manager.update_report_field(session_id, "equipment", "Valve 2", ProvenanceSource.INFERRED)

        # Worker correction action: "no, it was valve 4 not valve 2"
        self.state_manager.correct_report_field(session_id, "equipment", "Valve 4", ProvenanceSource.SAID)

        state_after = self.state_manager.get_state(session_id)
        self.assertEqual(state_after.report.location.value, "Bay 2")
        self.assertEqual(state_after.report.equipment.value, "Valve 4")
        self.assertEqual(state_after.report.equipment.source, ProvenanceSource.SAID)

        # Audit log automatically contains correction event from state_manager
        history = self.audit_logger.get_session_history(session_id)
        corrected_logs = [h for h in history if h["action"] == "field_corrected"]
        self.assertEqual(len(corrected_logs), 1)

        # Verify no create_near_miss tool execution occurred
        create_logs = [h for h in history if h["action"] == "tool_executed" and "create_near_miss" in str(h["metadata"])]
        self.assertEqual(len(create_logs), 0)

    def test_qa_002_interruption_mid_procedure_step(self):
        session_id = "test_qa002"
        worker_id = "worker_01"
        state = self.state_manager.create_session(user_id=worker_id, session_id=session_id)
        self.state_manager.set_mode(session_id, SessionMode.GUIDED_OPS)
        state.current_step = 2
        self.state_manager.update_state(state)

        # Barge-in action: "my gauge reads 15 PSI, is that safe?"
        self.dispatcher.handle_interruption(session_id, "call_step2_audio")

        # Call check_safety_threshold
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

        # State check: step remains 2, get_next_step was NOT called
        state_after = self.state_manager.get_state(session_id)
        self.assertEqual(state_after.current_step, 2)

    def test_qa_003_safety_sentinel_out_of_range(self):
        session_id = "test_qa003"
        worker_id = "worker_01"

        # "pressure is 15 PSI"
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

        # check_safety_status gates reporting when exposed
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

        # Stable idempotency key computation
        key = compute_idempotency_key(
            worker_id=worker_id,
            site="Site Bay 1",
            equipment="Compressor A",
            narrative="Oil leaking near high pressure valve",
            local_day="2026-03-30"
        )

        # Safety status must be verified before create_near_miss is allowed
        status_res = self.dispatcher.execute("check_safety_status", {
            "session_id": session_id,
            "mode": "reporting",
            "worker_id": worker_id,
            "self_reported_clear": True
        })
        self.assertTrue(status_res["safe_to_report"])

        # Confirm gate satisfied
        state.confirmation_status = ConfirmationStatus.CONFIRMED
        self.state_manager.update_state(state)

        # Create report call 1
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

        # Reconnect within 30s window (simulated immediately / t=20s): state restored
        resumed_state = self.state_manager.get_state(session_id)
        self.assertIsNotNone(resumed_state)
        self.assertEqual(resumed_state.mode, SessionMode.REPORTING)

        # Replaying create_near_miss with same idempotency key returns created: false, duplicate: true
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

        # Reconnect at t > 30s (e.g. simulate expiration): session expires, get_state returns None
        self.state_backend._store[session_id] = (resumed_state, time.time() - 35)
        expired_state = self.state_manager.get_state(session_id)
        self.assertIsNone(expired_state)

    def test_qa_005_token_route_and_mock_session(self):
        """Test JWT validation / dev bypass token route and mock session initialization."""
        import backend.app as flask_app
        client = flask_app.app.test_client()

        # Reject request without Bearer token
        res_no_auth = client.get("/v1/token")
        self.assertEqual(res_no_auth.status_code, 401)

        # Reject request with invalid JWT in non-dev mode
        res_invalid = client.get("/v1/token", headers={"Authorization": "Bearer invalid_jwt_token"})
        self.assertEqual(res_invalid.status_code, 401)

        # Accept dev bypass token
        res_dev = client.get("/v1/token", headers={"Authorization": "Bearer dev-token-bypass"})
        self.assertEqual(res_dev.status_code, 200)
        data = res_dev.get_json()
        self.assertIn("token", data)
        self.assertIn("ws_url", data)

    def test_qa_006_auth_and_401_paths(self):
        """Test authentication 401 paths and valid JWT verification for supervisor APIs."""
        import backend.app as flask_app
        client = flask_app.app.test_client()

        jwt_secret = "aura-dev-jwt-secret"

        # 1. 401 on missing Authorization header
        res_reviews_no_auth = client.get("/api/reviews")
        self.assertEqual(res_reviews_no_auth.status_code, 401)
        self.assertIn("Missing or invalid Authorization header", res_reviews_no_auth.get_json()["error"])

        # 2. 401 on invalid JWT signature
        bad_token = jwt.encode({"sub": "attacker"}, "wrong-secret", algorithm="HS256")
        res_bad_token = client.get("/api/reviews", headers={"Authorization": f"Bearer {bad_token}"})
        self.assertEqual(res_bad_token.status_code, 401)

        # 3. 401 on expired JWT
        expired_payload = {
            "sub": "supervisor_john",
            "exp": datetime.now(timezone.utc) - timedelta(seconds=10)
        }
        expired_token = jwt.encode(expired_payload, jwt_secret, algorithm="HS256")
        res_expired = client.get("/api/reviews", headers={"Authorization": f"Bearer {expired_token}"})
        self.assertEqual(res_expired.status_code, 401)
        self.assertIn("expired", res_expired.get_json()["error"])

        # 4. 200 on valid JWT
        valid_payload = {
            "sub": "supervisor_john",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=5)
        }
        valid_token = jwt.encode(valid_payload, jwt_secret, algorithm="HS256")
        res_valid = client.get("/api/reviews", headers={"Authorization": f"Bearer {valid_token}"})
        self.assertEqual(res_valid.status_code, 200)
        self.assertIn("reviews", res_valid.get_json())


if __name__ == "__main__":
    unittest.main()
