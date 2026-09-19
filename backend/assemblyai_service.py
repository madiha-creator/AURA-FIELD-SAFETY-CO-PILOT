"""
BE-001: AssemblyAI Voice Agent Service

Builds session.update payload and provides a local WebSocket server fallback for testing/demo.

AssemblyAI Voice Agent API Specification:
- session.update message structure sent over WebSocket
- System prompt, greeting, tool declarations from packages/contracts/tools.schema.json
- Turn detection and voice configuration
"""

from dataclasses import dataclass, field
from typing import Optional, Any
import json
from backend.config import get_config

# Load tools directly from shared contract schema
def load_contract_tools() -> list:
    try:
        with open("packages/contracts/tools.schema.json", "r") as f:
            return json.load(f)
    except Exception:
        return []

TOOLS = load_contract_tools()

@dataclass
class TurnDetectionConfig:
    """Turn detection tuning for frequent interruptions (AUD-005)."""
    vad_threshold: float = 0.5            # Voice Activity Detection sensitivity threshold (0.0 to 1.0)
    interruption_delay: int = 200         # ms delay before triggering barge-in interruption
    silence_duration_ms: int = 500        # ms of silence before considering turn complete
    prefix_padding_ms: int = 300          # ms of pre-speech padding to keep


@dataclass
class VoiceConfig:
    """Voice configuration for AssemblyAI agent."""
    voice_id: str = "nova"
    speed: float = 1.0


@dataclass
class SessionUpdatePayload:
    """Complete session.update payload for AssemblyAI Voice Agent."""
    type: str = "session.update"
    agent_id: str = ""
    system_prompt: str = ""
    greeting: str = ""
    tools: list = field(default_factory=list)
    voice: Optional[VoiceConfig] = None
    turn_detection: Optional[TurnDetectionConfig] = None

    def to_dict(self) -> dict:
        payload = {
            "type": self.type,
            "session": {
                "agent_id": self.agent_id,
            },
        }

        if self.system_prompt:
            payload["session"]["system_prompt"] = self.system_prompt
        if self.greeting:
            payload["session"]["greeting"] = self.greeting
        if self.tools:
            payload["session"]["tools"] = self.tools
        if self.voice:
            payload["session"]["voice"] = self.voice.__dict__
        if self.turn_detection:
            payload["session"]["turn_detection"] = self.turn_detection.__dict__

        return payload


def build_session_update(
    agent_id: str = "aura_field_copilot",
    system_prompt: str = "",
    greeting: str = "Aura here. I can walk you through a procedure or take a near-miss report hands-free. What do you need?",
    mode: str = "guided_ops",
    voice_id: str = "nova",
    turn_detection_config: Optional[TurnDetectionConfig] = None,
) -> dict:
    """Build the session.update payload for AssemblyAI Voice Agent or Mock Session."""
    if not system_prompt:
        system_prompt = SYSTEM_PROMPT_GUIDED_OPS if mode == "guided_ops" or mode == "field_ops" else SYSTEM_PROMPT_REPORTING

    tools = TOOLS if TOOLS else []

    payload = SessionUpdatePayload(
        agent_id=agent_id,
        system_prompt=system_prompt,
        greeting=greeting,
        tools=tools,
        voice=VoiceConfig(voice_id=voice_id),
        turn_detection=turn_detection_config or TurnDetectionConfig(),
    )

    return payload.to_dict()


SYSTEM_PROMPT_GUIDED_OPS = """You are Aura, a field safety co-pilot for technicians whose hands are on equipment.
Speak in short sentences. One question or one step at a time. Never ask the worker to type.

MODE: field_ops
- Trigger phrases like “walk me through…”, “next step”, named procedures.
- Call query_manual_db / get_next_step.
- Read the current step. Wait for explicit confirmation (“got it”, “next”, “done”) before get_next_step.
- If interrupted with a reading or question, answer, then resume the same step. Do not lose position.

BOTH MODES
- On any spoken numeric reading, call check_safety_threshold. If severity is warn or critical, interrupt with the returned message before continuing the original task.
- Never invent safe ranges. If threshold returns unknown, ask for unit and equipment, then retry the tool.
- Distinguish what the worker said from what you inferred. If unsure, ask.
- Do not claim a database write succeeded unless the tool result says so.
"""

SYSTEM_PROMPT_REPORTING = """You are Aura, a field safety co-pilot for technicians whose hands are on equipment.
Speak in short sentences. One question or one step at a time. Never ask the worker to type.

MODE: reporting
- Trigger phrases like “report a near miss”, “log an incident”.
- First call check_safety_status. If safe_to_report is false, do not collect the report. Tell them to get clear, then retry.
- Use get_missing_fields to ask only for missing details.
- Read back the full report. Require an explicit confirm phrase before create_near_miss.
- After create, you may call search_similar_reports, then draft_corrective_action and notify_safety_contact only if policy and confirmation allow.

BOTH MODES
- On any spoken numeric reading, call check_safety_threshold. If severity is warn or critical, interrupt with the returned message before continuing the original task.
- Never invent safe ranges. If threshold returns unknown, ask for unit and equipment, then retry the tool.
- Distinguish what the worker said from what you inferred. If unsure, ask.
- Do not claim a database write succeeded unless the tool result says so.
"""


def handle_assemblyai_message(message: dict, state_manager, tool_dispatcher) -> list[dict]:
    """Handle inbound messages from AssemblyAI or Mock WebSocket."""
    msg_type = message.get("type")

    if msg_type == "tool.call":
        return handle_tool_call(message, state_manager, tool_dispatcher)
    elif msg_type == "transcript.user":
        return handle_user_transcript(message, state_manager)
    elif msg_type == "reply.done":
        return handle_reply_done(message, state_manager)
    elif msg_type == "session.ready":
        return handle_session_ready(message, state_manager)

    return []


def handle_tool_call(message: dict, state_manager, tool_dispatcher) -> list[dict]:
    """Handle tool.call execution and return tool.result."""
    tool_call_id = message.get("tool_call_id", message.get("id"))
    name = message.get("name")
    arguments = message.get("arguments", {})

    result = tool_dispatcher.execute(name, arguments, state_manager)

    return [{
        "type": "tool.result",
        "tool_call_id": tool_call_id,
        "result": result,
    }]


def handle_user_transcript(message: dict, state_manager) -> list[dict]:
    """Handle transcript.user."""
    return []


def handle_reply_done(message: dict, state_manager) -> list[dict]:
    """Handle reply.done status (completed vs interrupted)."""
    return []


def handle_session_ready(message: dict, state_manager) -> list[dict]:
    """Handle session.ready initialization."""
    return []
