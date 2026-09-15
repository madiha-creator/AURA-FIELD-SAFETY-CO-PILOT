"""
BE-001: AssemblyAI Voice Agent Service

Builds session.update payload and handles WebSocket communication.

Confirmed fields from AssemblyAI Voice Agent API docs:
- session.update sent over WebSocket with: system_prompt, greeting, tools[], voice, turn-detection
- Frontend connects: wss://agents.assemblyai.com/v1/ws?token=<token>

UNVERIFIED - marked with TODO: verify against AssemblyAI docs
"""

from dataclasses import dataclass, field
from typing import Optional, Any
from ..core.config import get_config


# ============================================================================
# TOOL SCHEMAS (INT-001 through INT-004)
# ============================================================================

# These tool definitions are sent in session.update.tools[]
# TODO: Verify exact schema format AssemblyAI expects for tools[]
# (JSON Schema? OpenAPI? Custom format? Function calling format?)

TOOLS = [
    {
        "name": "log_maintenance_entry",
        "description": "Log a structured maintenance entry to Salesforce/Jira/SQL",
        "parameters": {
            "type": "object",
            "properties": {
                "location": {"type": "string", "description": "Site/warehouse/bay location"},
                "equipment": {"type": "string", "description": "Equipment identifier"},
                "issue_description": {"type": "string", "description": "What was observed"},
                "severity": {"type": "string", "enum": ["low", "medium", "high", "critical"]},
                "provenance": {
                    "type": "object",
                    "description": "Per-field provenance: {field: {source: said|inferred, value, confidence}}",
                    "additionalProperties": {
                        "type": "object",
                        "properties": {
                            "source": {"type": "string", "enum": ["said", "inferred"]},
                            "value": {"type": "string"},
                            "confidence": {"type": "number"},
                        },
                    },
                },
            },
            "required": ["location", "equipment", "issue_description"],
        },
    },
    {
        "name": "create_near_miss",
        "description": "Create a confirmed near-miss report with idempotency key",
        "parameters": {
            "type": "object",
            "properties": {
                "location": {"type": "string"},
                "equipment": {"type": "string"},
                "hazard_type": {"type": "string"},
                "injury": {"type": "string"},
                "narrative": {"type": "string", "description": "Quoted worker narrative"},
                "provenance": {
                    "type": "object",
                    "additionalProperties": {
                        "type": "object",
                        "properties": {
                            "source": {"type": "string", "enum": ["said", "inferred"]},
                            "value": {"type": "string"},
                            "confidence": {"type": "number"},
                        },
                    },
                },
                "idempotency_key": {"type": "string", "description": "Unique key to prevent duplicates"},
            },
            "required": ["location", "equipment", "hazard_type", "injury", "idempotency_key"],
        },
    },
    {
        "name": "notify_safety_contact",
        "description": "Route notification to correct role per site policy",
        "parameters": {
            "type": "object",
            "properties": {
                "alert_type": {"type": "string", "enum": ["critical_anomaly", "near_miss", "maintenance_issue"]},
                "severity": {"type": "string", "enum": ["low", "medium", "high", "critical"]},
                "location": {"type": "string"},
                "equipment": {"type": "string"},
                "measured_value": {"type": "number"},
                "unit": {"type": "string"},
                "expected_range": {"type": "string"},
                "deviation_percentage": {"type": "number"},
                "required_acknowledgments": {"type": "array", "items": {"type": "string"}},
                "recipient_role": {"type": "string", "description": "e.g., shift_supervisor, safety_officer, plant_manager"},
            },
            "required": ["alert_type", "severity", "location", "recipient_role"],
        },
    },
    {
        "name": "draft_corrective_action",
        "description": "Generate proposed corrective action tied to report + pattern signal",
        "parameters": {
            "type": "object",
            "properties": {
                "report_id": {"type": "string"},
                "pattern_signal": {
                    "type": "object",
                    "properties": {
                        "recurrence_sentence": {"type": "string", "description": "Human-readable e.g. '3rd near miss involving Forklift 12 this month'"},
                        "count": {"type": "integer"},
                        "equipment_reference": {"type": "string"},
                        "location_reference": {"type": "string"},
                    },
                    "required": ["recurrence_sentence", "count", "equipment_reference", "location_reference"],
                },
                "proposed_action": {"type": "string"},
                "supervisor_review_required": {"type": "boolean", "default": True},
            },
            "required": ["report_id", "pattern_signal"],
        },
    },
    {
        "name": "check_safety_threshold",
        "description": "Check if a measured value exceeds safety thresholds",
        "parameters": {
            "type": "object",
            "properties": {
                "measurement_name": {"type": "string"},
                "measured_value": {"type": "number"},
                "unit": {"type": "string"},
                "equipment": {"type": "string"},
                "location": {"type": "string"},
            },
            "required": ["measurement_name", "measured_value", "unit", "equipment", "location"],
        },
    },
]

# TODO: Verify if AssemblyAI expects any additional tool metadata:
# - "strict" mode flag?
# - "return_direct" for streaming?
# - Parameter for tool choice behavior (auto/required/none)?


# ============================================================================
# SESSION.UPDATE PAYLOAD BUILDER
# ============================================================================

@dataclass
class TurnDetectionConfig:
    """Turn detection tuning for frequent interruptions.

    UNVERIFIED - parameter names are best guesses. TODO: verify against AssemblyAI docs.
    """
    # Silencing thresholds for interruption handling
    silence_duration_ms: int = 500        # ms of silence before considering turn complete
    prefix_padding_ms: int = 300          # ms of pre-speech padding to keep
    # Interruption sensitivity
    interruption_sensitivity: str = "high"  # "low" | "medium" | "high"
    # TODO: Confirm exact parameter names AssemblyAI expects
    # May also include: max_duration_ms, min_speech_duration_ms, etc.


@dataclass
class VoiceConfig:
    """Voice configuration for AssemblyAI agent.

    UNVERIFIED - format unknown. TODO: verify against AssemblyAI docs.
    """
    # Could be: voice_id, voice_name, or full object
    # AssemblyAI may use: "nova", "alloy", "echo", "fable", "onyx", "shimmer"
    # Or custom voice IDs
    voice_id: str = "nova"
    # Additional params (speed, pitch, etc.)
    speed: float = 1.0


@dataclass
class SessionUpdatePayload:
    """Complete session.update payload for AssemblyAI Voice Agent.

    Confirmed from browser integration guide:
    {
      "type": "session.update",
      "session": {
        "agent_id": "..."
      }
    }

    Extended with configurable fields per BE-001.
    """
    type: str = "session.update"
    agent_id: str = ""
    system_prompt: str = ""
    greeting: str = ""
    tools: list = field(default_factory=list)
    voice: Optional[VoiceConfig] = None
    turn_detection: Optional[TurnDetectionConfig] = None

    def to_dict(self) -> dict:
        """Serialize to dict for WebSocket send."""
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
            # TODO: Verify exact nesting and parameter names
            payload["session"]["turn_detection"] = self.turn_detection.__dict__

        return payload


def build_session_update(
    agent_id: str,
    system_prompt: str,
    greeting: str,
    mode: str = "guided_ops",
    voice_id: str = "nova",
    turn_detection_config: Optional[TurnDetectionConfig] = None,
) -> dict:
    """
    Build the session.update payload for AssemblyAI Voice Agent.

    Args:
        agent_id: AssemblyAI agent ID (from your agent configuration)
        system_prompt: Full system prompt for the agent
        greeting: Initial greeting message
        mode: "guided_ops" or "reporting" - adjusts tool set
        voice_id: Voice identifier
        turn_detection_config: Interruption tuning

    Returns:
        Dict ready to send over WebSocket
    """
    # Select tools based on mode
    if mode == "reporting":
        selected_tools = [
            "create_near_miss",
            "log_maintenance_entry",
            "notify_safety_contact",
            "check_safety_threshold",
        ]
    else:
        selected_tools = [
            "log_maintenance_entry",
            "check_safety_threshold",
        ]

    tools = [t for t in TOOLS if t["name"] in selected_tools]

    payload = SessionUpdatePayload(
        agent_id=agent_id,
        system_prompt=system_prompt,
        greeting=greeting,
        tools=tools,
        voice=VoiceConfig(voice_id=voice_id),
        turn_detection=turn_detection_config or TurnDetectionConfig(),
    )

    return payload.to_dict()


# ============================================================================
# SYSTEM PROMPTS (configurable per mode)
# ============================================================================

SYSTEM_PROMPT_GUIDED_OPS = """You are Aura, a hands-free voice safety co-pilot for industrial workers.

MODE: GUIDED OPERATIONS
Walk the worker through a safety procedure step by step. Do NOT create reports unless explicitly asked.
Confirm each mandatory verification step before proceeding.
Use check_safety_threshold for any sensor readings mentioned.
If the worker reports an issue, use log_maintenance_entry (requires confirmation).
If critical anomaly detected, use notify_safety_contact.

Keep responses concise. Worker is wearing headset, hands busy.
"""

SYSTEM_PROMPT_REPORTING = """You are Aura, a hands-free voice safety co-pilot for industrial workers.

MODE: NEAR-MISS REPORTING
Guide the worker through creating a near-miss report. Collect all required fields:
- Location (site/warehouse/bay)
- Equipment involved
- Hazard type
- Injury (if any, or "none")
- Narrative (what happened, in worker's words)

Tag each field as YOU SAID (worker-provided) or AI INFERRED (you derived it).
Present the complete report for CONFIRMATION before submitting.
Use create_near_miss ONLY after explicit worker says "Yes, create report" or equivalent.
Use notify_safety_contact if report severity warrants escalation.

Worker is hands-free. Be concise. Confirm before any write action.
"""

# TODO: Verify these prompts are within AssemblyAI's token limits
# TODO: Consider if AssemblyAI supports system_prompt injection at session level vs per-turn


# ============================================================================
# WEBSOCKET MESSAGE HANDLERS (stubs for BE-003)
# ============================================================================

# Confirmed message types from AssemblyAI Voice Agent API:
# Client → Server: session.update, tool.result, input.audio, session.end
# Server → Client: session.ready, reply.audio, reply.done, transcript.user, transcript.agent,
#                  tool.call, session.error, session.ended

# UNVERIFIED: Exact payload shapes for tool.call and tool.result
# From browser integration guide: tool.call is mentioned but shape not shown
# From llms.txt: "Events reference" and "Message Sequence" specs have exact shapes

# Stub message structures (replace with verified shapes):
TOOL_CALL_SCHEMA = {
    # TODO: Verify exact fields
    "type": "tool.call",
    "tool_call_id": "string",     # unique ID for this call
    "name": "string",             # tool name
    "arguments": {},              # JSON arguments
}

TOOL_RESULT_SCHEMA = {
    # TODO: Verify exact fields AssemblyAI expects in tool.result
    "type": "tool.result",
    "tool_call_id": "string",     # must match tool.call
    "result": {},                 # tool output
    "error": None,                # if tool failed
}

REPLY_DONE_SCHEMA = {
    "type": "reply.done",
    "status": "completed",        # or "interrupted" (confirmed)
    # TODO: Verify other status values
}


def handle_assemblyai_message(message: dict, state_manager, tool_dispatcher) -> list[dict]:
    """
    Handle inbound messages from AssemblyAI WebSocket.

    Returns list of outbound messages to send back (tool.result, etc.).
    """
    msg_type = message.get("type")

    if msg_type == "tool.call":
        return handle_tool_call(message, state_manager, tool_dispatcher)

    elif msg_type == "transcript.user":
        return handle_user_transcript(message, state_manager)

    elif msg_type == "reply.done":
        return handle_reply_done(message, state_manager)

    elif msg_type == "session.ready":
        return handle_session_ready(message, state_manager)

    # TODO: Add handlers for other message types as verified
    return []


def handle_tool_call(message: dict, state_manager, tool_dispatcher) -> list[dict]:
    """Handle tool.call from AssemblyAI - execute tool and return tool.result."""
    tool_call_id = message.get("tool_call_id")
    name = message.get("name")
    arguments = message.get("arguments", {})

    # Execute tool (with confirmation gate for write actions)
    result = tool_dispatcher.execute(name, arguments, state_manager)

    return [{
        "type": "tool.result",
        "tool_call_id": tool_call_id,
        "result": result,
    }]


def handle_user_transcript(message: dict, state_manager) -> list[dict]:
    """Handle transcript.user - update state with what worker said."""
    text = message.get("text", "")
    confidence = message.get("confidence")  # TODO: Verify field name
    # Update state manager with transcript for provenance
    # TODO: Integrate with state_manager.update_report_field
    return []


def handle_reply_done(message: dict, state_manager) -> list[dict]:
    """Handle reply.done - track interruption status."""
    status = message.get("status", "completed")
    interrupted = (status == "interrupted")
    # Update state for interruption handling (BE-003)
    return []


def handle_session_ready(message: dict, state_manager) -> list[dict]:
    """Handle session.ready - session is initialized."""
    # Link AssemblyAI session to our internal session
    # assemblyai_session_id might be in message or need separate tracking
    return []