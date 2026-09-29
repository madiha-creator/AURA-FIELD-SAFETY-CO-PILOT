"""Regression tests for AssemblyAI agent transcript and reply completion wiring."""

import unittest
from types import SimpleNamespace

from backend.assemblyai_service import accumulate_agent_delta, handle_reply_done


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


if __name__ == "__main__":
    unittest.main()