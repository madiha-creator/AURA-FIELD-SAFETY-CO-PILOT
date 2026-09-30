"""Regression tests for AssemblyAI agent transcript and reply completion wiring."""

import json
import unittest
from unittest.mock import Mock, patch
from types import SimpleNamespace

import backend.app as app_module
from backend.assemblyai_service import accumulate_agent_delta, handle_reply_done
from backend.state_manager import ConfirmationStatus, SessionMode


class FakeWebSocket:
    def __init__(self, messages=()):
        self.messages = [json.dumps(message) for message in messages] + [None]
        self.sent = []

    def receive(self):
        return self.messages.pop(0)

    def send(self, payload):
        self.sent.append(json.loads(payload))


class FakeStateManager:
    def __init__(self):
        self.state = SimpleNamespace(
            session_id="qa-confirmation-session",
            user_id="qa-worker",
            mode=SessionMode.IDLE,
            current_step=1,
            confirmation_status=ConfirmationStatus.PENDING,
            pending_action="create_near_miss",
            pending_payload={"report": "pending"},
        )

    def get_state(self, session_id):
        return self.state

    def create_session(self, user_id, session_id):
        return self.state

    def set_mode(self, session_id, mode):
        self.state.mode = SessionMode(mode)

    def update_state(self, state):
        self.state = state


class FakeConfirmationGate:
    def __init__(self, result=(False, None)):
        self.result = result
        self.verify_confirmation = Mock(side_effect=self._verify)

    def _verify(self, **kwargs):
        return self.result


class FakeToolDispatcher:
    def __init__(self, gate_result=(False, None), execute_result=None):
        self.confirmation_gate = FakeConfirmationGate(gate_result)
        self.execute = Mock(return_value=execute_result)


class FakeAssemblyAIProxy:
    def __init__(self, on_event, events=()):
        self.on_event = on_event
        self.events = events
        self.sent_json = []

    def start(self):
        for event in self.events:
            self.on_event(event)

    def send_json(self, payload):
        self.sent_json.append(payload)

    def close(self):
        pass


class TestAssemblyAIWiring(unittest.TestCase):
    def setUp(self):
        self.turn_state = {"last_agent_text": "", "last_audio_chunk": None}
        self.state_manager = SimpleNamespace(
            get_state=lambda _session_id: SimpleNamespace(mode=SimpleNamespace(value="guided_ops"))
        )

    def test_completed_reply_uses_accumulated_agent_deltas(self):
        accumulate_agent_delta({"delta": "Check "}, self.turn_state)
        accumulate_agent_delta({"delta": "the valve."}, self.turn_state)

        replies = handle_reply_done(
            {"type": "reply.done", "status": "completed", "session_id": "session-1"},
            self.state_manager,
            self.turn_state,
        )

        self.assertEqual(len(replies), 1)
        self.assertEqual(replies[0]["text"], "Check the valve.")
        self.assertNotEqual(replies[0]["text"], "Ready for the next step.")

    def test_interrupted_empty_reply_sends_no_fallback(self):
        replies = handle_reply_done(
            {"type": "reply.done", "status": "interrupted", "session_id": "session-1"},
            self.state_manager,
            self.turn_state,
        )

        self.assertEqual(replies, [])
        self.assertEqual(self.turn_state["last_agent_text"], "")
        self.assertIsNone(self.turn_state["last_audio_chunk"])

    def test_completed_reply_with_final_text_is_preserved(self):
        self.turn_state["last_agent_text"] = "Please confirm before I continue."

        replies = handle_reply_done(
            {"type": "reply.done", "status": "completed", "session_id": "session-1"},
            self.state_manager,
            self.turn_state,
        )

        self.assertEqual(len(replies), 1)
        self.assertEqual(replies[0]["text"], "Please confirm before I continue.")

    def test_completed_empty_reply_requests_repeat(self):
        replies = handle_reply_done(
            {"type": "reply.done", "status": "completed", "session_id": "session-1"},
            self.state_manager,
            self.turn_state,
        )

        self.assertEqual(len(replies), 1)
        self.assertEqual(replies[0]["text"], "Sorry, I didn't catch that. Could you repeat?")
        self.assertNotIn("Ready for the next step.", replies[0]["text"])

    def test_completed_audio_only_reply_does_not_add_nudge(self):
        self.turn_state["last_audio_chunk"] = "audio-chunk"

        replies = handle_reply_done(
            {"type": "reply.done", "status": "completed", "session_id": "session-1"},
            self.state_manager,
            self.turn_state,
        )

        self.assertEqual(len(replies), 1)
        self.assertEqual(replies[0]["text"], "")
        self.assertEqual(replies[0]["audio"], "audio-chunk")

    def run_ws(self, events=(), messages=(), gate_result=(False, None), execute_result=None, api_key="test-key"):
        state_manager = FakeStateManager()
        dispatcher = FakeToolDispatcher(gate_result, execute_result)
        proxy = FakeAssemblyAIProxy(None, events)
        proxy_factory = Mock()

        def create_proxy(**kwargs):
            proxy.on_event = kwargs["on_event"]
            return proxy

        proxy_factory.side_effect = create_proxy
        ws = FakeWebSocket(messages)
        route_view = app_module.app.view_functions["ws_agent_loop"]
        route_handler = dict(zip(route_view.__code__.co_freevars, route_view.__closure__)).get("f").cell_contents
        with patch.object(app_module, "state_manager", state_manager), \
                patch.object(app_module, "audit_logger"), \
                patch.object(app_module.config, "ASSEMBLYAI_API_KEY", api_key), \
                patch.object(app_module, "AssemblyAIProxy", proxy_factory), \
                patch.object(app_module.tool_dispatcher_mod, "ToolDispatcher", return_value=dispatcher), \
                app_module.app.test_request_context("/v1/ws?session_id=qa-confirmation-session"):
            route_handler(ws)
        return ws.sent, proxy, dispatcher

    def test_interrupted_reply_drops_pending_tool_calls(self):
        sent, proxy, dispatcher = self.run_ws(events=(
            {"type": "tool.call", "call_id": "call-1", "name": "create_near_miss", "arguments": {}},
            {"type": "reply.done", "status": "interrupted"},
        ))

        dispatcher.execute.assert_not_called()
        self.assertEqual(proxy.sent_json, [])
        self.assertFalse(any(message.get("type") == "tool.result" for message in sent))

    def test_blocked_confirmed_write_returns_error_text(self):
        result = {"error": "Report blocked because the worker is exposed.", "safe_to_report": False}
        sent, _, dispatcher = self.run_ws(
            events=({"type": "transcript.user", "text": "yes"},),
            gate_result=(True, {"report": "pending"}),
            execute_result=result,
        )

        dispatcher.execute.assert_called_once()
        replies = [message for message in sent if message.get("type") == "agent_reply"]
        self.assertEqual(replies[-1]["text"], "Report blocked because the worker is exposed.")
        self.assertNotEqual(replies[-1]["text"], "Report submitted.")
        tool_results = [message for message in sent if message.get("type") == "tool.result"]
        self.assertEqual(tool_results[-1], {"type": "tool.result", "tool": "create_near_miss", "result": result})

    def test_confirmed_voice_write_sends_spoken_and_structured_results(self):
        result = {"report_id": "report-123", "created": True, "duplicate": False}
        sent, _, dispatcher = self.run_ws(
            events=({"type": "transcript.user", "text": "yes"},),
            gate_result=(True, {"report": "pending"}),
            execute_result=result,
        )

        dispatcher.execute.assert_called_once()
        replies = [message for message in sent if message.get("type") == "agent_reply"]
        tool_results = [message for message in sent if message.get("type") == "tool.result"]
        self.assertEqual(replies[-1]["text"], "Report submitted.")
        self.assertEqual(tool_results[-1], {"type": "tool.result", "tool": "create_near_miss", "result": result})

    def test_voice_rejection_takes_priority_over_confirm_substring(self):
        sent, _, dispatcher = self.run_ws(events=(
            {"type": "transcript.user", "text": "No, do not confirm"},
        ))

        dispatcher.confirmation_gate.verify_confirmation.assert_called_once_with(
            session_id="qa-confirmation-session",
            user_id="qa-worker",
            confirmed=False,
        )
        replies = [message for message in sent if message.get("type") == "agent_reply"]
        self.assertEqual(replies[-1]["text"], "Okay, cancelled.")
        self.assertFalse(any(message.get("type") == "tool.result" for message in sent))

    def test_typed_rejection_uses_user_id_and_is_not_confirmed(self):
        sent, _, dispatcher = self.run_ws(
            messages=({"type": "text_input", "text": "No, do not confirm"},),
            api_key="",
        )

        dispatcher.confirmation_gate.verify_confirmation.assert_called_once_with(
            session_id="qa-confirmation-session",
            user_id="qa-worker",
            confirmed=False,
        )
        self.assertFalse(any(message.get("type") == "error" for message in sent))
        replies = [message for message in sent if message.get("type") == "agent_reply"]
        self.assertEqual(replies[-1]["text"], "Okay, cancelled.")


if __name__ == "__main__":
    unittest.main()