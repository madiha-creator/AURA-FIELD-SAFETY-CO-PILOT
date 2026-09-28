"""
BE-001: AssemblyAI Voice Agent Service

Builds session.update payload and provides WebSocket message handlers.

AssemblyAI Voice Agent API Specification:
- session.update message structure sent over WebSocket
- System prompt, greeting, tool declarations from packages/contracts/tools.schema.json
- Turn detection, audio encoding formats, keyterms, transcription_prompt, and voice_focus.
"""

from dataclasses import dataclass, field
from typing import Optional, Any
import json
from backend.config import get_config

# Load tools directly from shared contract schema
def load_contract_tools() -> list:
    try:
        with open("packages/contracts/tools.schema.json", "r") as f:
            tools = json.load(f)
            for t in tools:
                t.setdefault("type", "function")
            return tools
    except Exception:
        return []

TOOLS = load_contract_tools()

SYSTEM_PROMPT_COMBINED = """You are Aura, a field safety co-pilot for technicians whose hands are on equipment.
Speak in short spoken sentences. One question or one step at a time. Never ask the worker to type.

MODES & WORKFLOWS:
1. GUIDED PROCEDURES:
   - Trigger phrases: "walk me through...", "next step", procedure names (e.g. coolant flush).
   - Read the current step. Wait for explicit confirmation ("got it", "next", "done", "confirm") before calling get_next_step.
   - If interrupted with a reading or question, answer or handle threshold, then resume the procedure step.

2. NEAR-MISS REPORTING:
   - Trigger phrases: "report a near miss", "log an incident", "report hazard".
   - FIRST call check_safety_status. If safe_to_report is false, DO NOT collect the report. Tell them to get clear, then retry.
   - Collect location, equipment, hazard_type, injury/consequence, and narrative using get_missing_fields.
   - Read back the full report summary to the worker.
   - Require explicit confirmation ("yes", "confirm", "file it") before calling create_near_miss.

SAFETY & RULES FOR ALL TURNS:
- On ANY numeric reading spoken by the worker (e.g. "15 PSI", "180 F"), IMMEDIATELY call check_safety_threshold FIRST.
- If check_safety_threshold returns an unsafe/warning/critical reading, interrupt with the spoken warning, DO NOT advance the procedure step, and advise safety action.
- Never invent safe ranges.
- Never claim a database write succeeded unless the tool result explicitly returns written/created: true.
- Keep responses brief, direct, and hands-free friendly.
"""

KEYTERMS = [
    "PSI", "PPE", "near miss", "coolant flush", "hydraulic",
    "reservoir", "gauge", "lockout", "tagout", "bay", "valve",
    "generator", "pressure", "temperature", "Aura"
]

TRANSCRIPTION_PROMPT = "Industrial field technician. Expect equipment IDs, PSI/bar readings, procedure names, and safety phrases."


def build_session_update(
    agent_id: str = "",
    system_prompt: str = "",
    greeting: str = "Aura here. I can walk you through a procedure or take a near-miss report hands-free. What do you need?",
    mode: str = "field_ops",
    voice_id: str = "alba",
) -> dict:
    """Build the session.update payload for AssemblyAI Voice Agent.

    Note: agent_id is mutually exclusive with inline session fields in AssemblyAI's API contract.
    When sending system_prompt/tools inline, agent_id must NOT be included.
    """
    tools = TOOLS if TOOLS else load_contract_tools()
    prompt = system_prompt or SYSTEM_PROMPT_COMBINED

    session_data = {
        "system_prompt": prompt,
        "greeting": greeting,
        "input": {
            "format": {"encoding": "audio/pcm", "sample_rate": 24000},
            "keyterms": KEYTERMS,
            "transcription_prompt": TRANSCRIPTION_PROMPT,
            "voice_focus": "near-field",
            "turn_detection": {
                "vad_threshold": 0.5,
                "interruption_delay": 200,
                "silence_duration_ms": 500
            }
        },
        "output": {
            "voice": voice_id,
            "format": {"encoding": "audio/pcm", "sample_rate": 24000}
        },
        "tools": tools
    }

    if agent_id:
        session_data["agent_id"] = agent_id

    return {
        "type": "session.update",
        "session": session_data
    }


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
    return []


def handle_reply_done(message: dict, state_manager) -> list[dict]:
    return []


def handle_session_ready(message: dict, state_manager) -> list[dict]:
    return []
