"""
Backend Server exposing REST API for Supervisor Web Dashboard and AssemblyAI Token minting.
"""

import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from integrations.database import get_database
from backend.audit_logger import AuditLogger
from backend.state_manager import get_state_manager, ConfirmationStatus
import backend.tool_dispatcher as tool_dispatcher_mod
from audio.token_routes import register_token_routes, require_bearer_auth
from backend.config import get_config

config = get_config()
print(
    "[AURA] AssemblyAI key loaded: " + ("YES (real voice enabled)" if config.ASSEMBLYAI_API_KEY
    else "NO (voice disabled - check your .env file in the project root)"),
    flush=True,
)
app = Flask(__name__)

# Restrict CORS to configured frontend origin
cors_origins = [config.FRONTEND_ORIGIN, "http://127.0.0.1:5173", "http://localhost:5173", "http://127.0.0.1:3000", "http://localhost:3000"]
CORS(app, origins=cors_origins, supports_credentials=True)

db = get_database()
audit_logger = AuditLogger()
state_manager = get_state_manager()

# Register /v1/token route
register_token_routes(app)

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

# ----------------------------------------------------------------------------
# REST API Read Models & Actions for Supervisor Web Dashboard
# Protected with require_bearer_auth
# ----------------------------------------------------------------------------

@app.route("/api/reviews", methods=["GET"])
@require_bearer_auth
def list_reviews():
    status = request.args.get("status")
    site = request.args.get("site")
    equipment = request.args.get("equipment")

    reports = db.get_reports_list(limit=100)

    filtered = []
    for r in reports:
        if status and r.get("status") != status:
            continue
        if site and site.lower() not in r.get("location", "").lower():
            continue
        if equipment and equipment.lower() not in r.get("equipment", "").lower():
            continue
        filtered.append(r)

    return jsonify({"reviews": filtered, "count": len(filtered)})

@app.route("/api/reviews/<report_id>", methods=["GET"])
@require_bearer_auth
def get_review_detail(report_id):
    report = db.get_report_detail(report_id)
    if not report:
        return jsonify({"error": "Report not found"}), 404

    ca = db.get_corrective_action_by_report(report_id)
    similar = db.search_similar_reports_db(report.get("narrative", "") or report.get("hazard_type", ""), site=report.get("location"))

    return jsonify({
        "report": report,
        "corrective_action": ca,
        "similar_reports": similar.get("matches", []),
        "pattern_signal": similar.get("pattern_signal", {})
    })

@app.route("/api/reviews/<report_id>/approve", methods=["POST"])
@require_bearer_auth
def approve_review(report_id):
    data = request.json or {}
    send_notify = data.get("notify_safety_contact", False)
    supervisor_id = getattr(request, "user_id", data.get("supervisor_id", "unknown_supervisor"))

    report = db.get_report_detail(report_id)
    if not report:
        return jsonify({"error": "Report not found"}), 404

    success = db.update_report_status(report_id, "approved")
    if not success:
        return jsonify({"error": "Failed to update report status"}), 400

    audit_logger.log_action(
        user_id=supervisor_id,
        action="report_approved",
        metadata={"report_id": report_id, "notify_sent": send_notify}
    )

    notified_roles = []
    if send_notify:
        notified_roles = ["safety_officer", "site_manager"]
        report_site = report.get("location") or "Unspecified Site"
        db.create_notification({
            "alert_type": "near_miss_approved",
            "severity": "medium",
            "location": report_site,
            "equipment": report.get("equipment"),
            "recipient_role": "safety_officer",
            "sender_id": supervisor_id
        })

    return jsonify({
        "status": "approved",
        "report_id": report_id,
        "notified": notified_roles
    })

@app.route("/api/reviews/<report_id>/edit", methods=["POST"])
@require_bearer_auth
def edit_review(report_id):
    data = request.json or {}
    changes = data.get("changes", {})
    reason = data.get("reason")
    supervisor_id = getattr(request, "user_id", data.get("supervisor_id", "unknown_supervisor"))

    if not reason or not reason.strip():
        return jsonify({"error": "Reason is required for editing a report"}), 400

    report = db.get_report_detail(report_id)
    if not report:
        return jsonify({"error": "Report not found"}), 404

    updated = db.update_report_fields(report_id, changes)

    audit_logger.log_action(
        user_id=supervisor_id,
        action="report_edited_by_supervisor",
        metadata={"report_id": report_id, "changes": changes, "reason": reason}
    )

    return jsonify({
        "status": "updated",
        "report_id": report_id,
        "report": updated
    })

@app.route("/api/reviews/<report_id>/reject", methods=["POST"])
@require_bearer_auth
def reject_review(report_id):
    data = request.json or {}
    reason = data.get("reason")
    supervisor_id = getattr(request, "user_id", data.get("supervisor_id", "unknown_supervisor"))

    if not reason or not reason.strip():
        return jsonify({"error": "Reason is required for rejection"}), 400

    success = db.update_report_status(report_id, "rejected")
    if not success:
        return jsonify({"error": "Report not found"}), 404

    audit_logger.log_action(
        user_id=supervisor_id,
        action="report_rejected",
        metadata={"report_id": report_id, "reason": reason}
    )

    return jsonify({
        "status": "rejected",
        "report_id": report_id,
        "reason": reason
    })

@app.route("/api/patterns", methods=["GET"])
@require_bearer_auth
def list_patterns():
    patterns = db.get_patterns_list()
    return jsonify({"patterns": patterns})

@app.route("/api/maintenance", methods=["GET"])
@require_bearer_auth
def list_maintenance():
    entries = db.get_maintenance_entries()
    return jsonify({"maintenance_entries": entries})

@app.route("/api/audit/<session_id>", methods=["GET"])
@require_bearer_auth
def get_session_audit(session_id):
    history = audit_logger.get_session_history(session_id)
    return jsonify({"session_id": session_id, "timeline": history})

# ----------------------------------------------------------------------------
# WebSocket Support for Local Voice Agent / Mock Session Loop (BE-001 / BE-003)
# ----------------------------------------------------------------------------
from flask_sock import Sock
from backend.assemblyai_service import build_session_update, handle_assemblyai_message
from backend.assemblyai_proxy import AssemblyAIProxy
import json
import threading

sock = Sock(app)

@sock.route("/v1/ws")
def ws_agent_loop(ws):
    """
    WebSocket endpoint for the local agent session loop.

    Always handles typed/tapped commands itself (deterministic demo logic).
    When ASSEMBLYAI_API_KEY is configured, also opens a real connection to
    AssemblyAI's Voice Agent API and proxies microphone audio to it, so real
    speech gets transcribed and AssemblyAI's own agent (using this app's
    system prompt + tool contracts) drives the spoken conversation. Without a
    key, incoming mic audio is acknowledged as unavailable and the worker is
    pointed at typed input instead.
    """
    session_id = request.args.get("session_id", "demo_session")

    # Initialize conversation state
    state = state_manager.get_state(session_id)
    if not state:
        state = state_manager.create_session(user_id="worker_01", session_id=session_id)

    tool_dispatcher = tool_dispatcher_mod.ToolDispatcher(state_manager, audit_logger)

    def get_current_state():
        """Never crash on a missing/expired session; recreate it in place."""
        current = state_manager.get_state(session_id)
        if current is None:
            current = state_manager.create_session(user_id="worker_01", session_id=session_id)
        return current

    send_lock = threading.Lock()

    def safe_send(payload: dict):
        try:
            with send_lock:
                ws.send(json.dumps(payload))
        except Exception:
            pass

    # Send session.ready
    safe_send({
        "type": "session.ready",
        "session_id": session_id,
        "message": "Aura Voice Co-Pilot Connected."
    })

    # Local session.update, sent to the browser for backward compatibility
    # with the mock/demo flow (the browser currently ignores unknown fields).
    local_session_update = build_session_update(mode=state.mode.value)
    safe_send(local_session_update)

    def handle_user_text(user_text: str):
        """Deterministic demo reply logic, shared by typed input and the
        no-API-key mock voice fallback. (When a real AssemblyAI key is
        configured, real voice turns are instead handled end-to-end by
        AssemblyAI's own agent via on_assemblyai_event below.)"""
        user_text = (user_text or "").strip()
        if not user_text:
            return

        # Pending confirmation reply — handle BEFORE trigger-phrase detection
        current_state = state_manager.get_state(session_id)
        if current_state and current_state.confirmation_status == ConfirmationStatus.PENDING:
            lowered = user_text.lower()
            confirmed = any(w in lowered for w in ["yes", "confirm", "ok", "yep"])
            rejected = any(w in lowered for w in ["no", "cancel", "stop"])
            pending_action = current_state.pending_action
            ok, payload = tool_dispatcher.confirmation_gate.verify_confirmation(
                session_id=session_id,
                worker_id=current_state.user_id,
                confirmed=confirmed,
            )
            if ok and payload:
                result = tool_dispatcher.execute(pending_action, payload)
                safe_send({
                    "type": "tool.result",
                    "tool": pending_action,
                    "result": result,
                })
            else:
                safe_send({
                    "type": "agent_reply",
                    "text": "Okay, cancelled." if rejected else "Please say 'yes' to confirm or 'no' to cancel.",
                    "mode": current_state.mode.value,
                })
            return

        import re
        numbers = re.findall(r"[-+]?\d*\.\d+|\d+", user_text)
        if numbers and any(k in user_text.lower() for k in ["psi", "temp", "f", "c", "bar", "pressure", "reading"]):
            val = float(numbers[0])
            param = "pressure" if "psi" in user_text.lower() or "pressure" in user_text.lower() else "temperature"
            unit = "PSI" if "psi" in user_text.lower() else "F"

            thresh_res = tool_dispatcher.execute("check_safety_threshold", {
                "session_id": session_id,
                "parameter": param,
                "value": val,
                "unit": unit
            })

            if not thresh_res.get("in_range", True):
                safe_send({
                    "type": "safety_alert",
                    "alert": thresh_res,
                    "message": thresh_res.get("message")
                })

        if "report" in user_text.lower() or "near miss" in user_text.lower():
            state_manager.set_mode(session_id, "reporting")

            current_state = state_manager.get_state(session_id)
            status_res = tool_dispatcher.execute("check_safety_status", {
                "session_id": session_id,
                "mode": "reporting",
                "worker_id": current_state.user_id if current_state else state.user_id,
                "self_reported_clear": ("clear" in user_text.lower() or "safe" in user_text.lower()),
                "last_threshold": current_state.last_threshold_reading if current_state else None
            })

            if not status_res.get("safe_to_report", True):
                safe_send({
                    "type": "agent_reply",
                    "text": status_res.get("reason", "Please move to a safe area before submitting report."),
                    "safe_to_report": False,
                    "mode": "reporting"
                })
                return

            safe_send({
                "type": "agent_reply",
                "text": "Starting near-miss report. What equipment and location were involved?",
                "mode": "reporting"
            })

        elif "walk me through" in user_text.lower() or "procedure" in user_text.lower() or "next step" in user_text.lower():
            state_manager.set_mode(session_id, "guided_ops")
            curr_step = state.current_step or 1

            if "next step" in user_text.lower() or "got it" in user_text.lower() or "done" in user_text.lower():
                step_res = tool_dispatcher.execute("get_next_step", {
                    "procedure": "proc_coolant_flush",
                    "current_step": curr_step
                })
                state.current_step = step_res.get("next_step_id") or curr_step
                state_manager.update_state(state)

                safe_send({
                    "type": "agent_reply",
                    "text": step_res.get("step_text"),
                    "current_step": state.current_step,
                    "mode": "guided_ops"
                })
            else:
                safe_send({
                    "type": "agent_reply",
                    "text": f"Step {curr_step}: Inspect secondary coolant reservoir line connections for leaks.",
                    "current_step": curr_step,
                    "mode": "guided_ops"
                })
        else:
            safe_send({
                "type": "agent_reply",
                "text": f"Aura received: '{user_text}'. Ready for next step or report field.",
                "mode": state_manager.get_state(session_id).mode.value
            })

    # ------------------------------------------------------------------
    # Real AssemblyAI Voice Agent proxy (only when a real key is set)
    # ------------------------------------------------------------------
    assemblyai_proxy = None
    voice_unavailable_notice_sent = False
    turn_state = {"last_agent_text": "", "last_audio_chunk": None, "pending_tools": []}

    if config.ASSEMBLYAI_API_KEY:
        # Inline agent config per AssemblyAI's schema (agent_id is mutually
        # exclusive with inline fields, so it is intentionally not sent).
        base_update = build_session_update(mode=state.mode.value)["session"]
        tools = [{**t, "type": "function"} for t in (base_update.get("tools") or [])]
        real_session_update = {
            "type": "session.update",
            "session": {
                "system_prompt": base_update.get("system_prompt", ""),
                "greeting": base_update.get("greeting", ""),
                "input": {"turn_detection": {"vad_threshold": 0.5}},
                "output": {"voice": "vera"},
                "tools": tools,
            },
        }

        def on_assemblyai_event(event: dict):
            etype = event.get("type")
            if etype not in ("reply.audio", "transcript.user.delta", "transcript.agent.delta"):
                print(f"[AssemblyAI] {etype}: " + json.dumps({k: v for k, v in event.items() if k != "data"})[:300], flush=True)

            if etype == "tool.call":
                turn_state["pending_tools"].append(event)

            elif etype == "transcript.user.delta":
                safe_send({"type": "transcript.user.delta", "text": event.get("text") or ""})

            elif etype == "transcript.user":
                text = event.get("text") or ""
                if text:
                    safe_send({"type": "transcript.user", "text": text})

            elif etype == "transcript.agent":
                turn_state["last_agent_text"] = event.get("text") or ""

            elif etype == "reply.audio":
                audio = event.get("data") or event.get("audio")
                if audio:
                    turn_state["last_audio_chunk"] = audio
                    safe_send({"type": "reply.audio", "audio": audio})

            elif etype == "reply.done":
                get_current_state()  # touch + recreate-if-expired so this turn can't crash
                pending = turn_state["pending_tools"]
                if pending:
                    # Tool-call reply: run the tools and hand results back now.
                    turn_state["pending_tools"] = []
                    for call in pending:
                        args = dict(call.get("arguments") or {})
                        args.setdefault("session_id", session_id)
                        try:
                            result = tool_dispatcher.execute(call.get("name"), args, state_manager)
                            payload = {"type": "tool.result", "call_id": call.get("call_id"),
                                       "result": json.dumps(result, default=str), "is_error": False}
                        except Exception as e:
                            payload = {"type": "tool.result", "call_id": call.get("call_id"),
                                       "result": json.dumps({"error": str(e)}), "is_error": True}
                        if assemblyai_proxy:
                            assemblyai_proxy.send_json(payload)
                        # Surface safety alerts to the browser UI
                        if call.get("name") == "check_safety_threshold" and isinstance(result, dict) \
                                and result.get("in_range") is False:
                            safe_send({"type": "safety_alert", "alert": result, "message": result.get("message")})
                else:
                    text = turn_state["last_agent_text"] or "Ready for the next step."
                    payload = {
                        "type": "agent_reply",
                        "text": text,
                        "mode": get_current_state().mode.value,
                    }
                    if turn_state["last_audio_chunk"]:
                        payload["audio"] = turn_state["last_audio_chunk"]
                    safe_send(payload)
                    turn_state["last_agent_text"] = ""
                    turn_state["last_audio_chunk"] = None

            elif etype == "session.error":
                safe_send({"type": "session.error",
                           "message": f"{event.get('code', '')} {event.get('message', 'AssemblyAI session error')} {event.get('param', '')}".strip()})

        assemblyai_proxy = AssemblyAIProxy(
            api_key=config.ASSEMBLYAI_API_KEY,
            ws_url=config.ASSEMBLYAI_WS_URL,
            session_update=real_session_update,
            on_event=on_assemblyai_event,
        )
        assemblyai_proxy.start()
        print(f"[AURA] Voice session {session_id}: connecting to AssemblyAI...", flush=True)
    else:
        print(f"[AURA] Voice session {session_id}: no API key, mock mode", flush=True)

    try:
        while True:
            data = ws.receive()
            if data is None:
                break

            try:
                msg = json.loads(data)
                msg_type = msg.get("type")

                if msg_type == "session.update":
                    new_mode = msg.get("session", {}).get("mode")
                    if new_mode:
                        state_manager.set_mode(session_id, new_mode)
                    safe_send({"type": "session.updated", "status": "ok"})

                elif msg_type == "input.audio":
                    if assemblyai_proxy:
                        assemblyai_proxy.send_audio(msg.get("audio"))
                    elif not voice_unavailable_notice_sent:
                        voice_unavailable_notice_sent = True
                        safe_send({
                            "type": "voice_unavailable",
                            "message": "Voice transcription isn't configured on this server (no ASSEMBLYAI_API_KEY). Use typed commands instead."
                        })

                elif msg_type == "user_turn" or msg_type == "text_input":
                    handle_user_text(msg.get("text", ""))

                elif msg_type == "tool.call":
                    responses = handle_assemblyai_message(msg, state_manager, tool_dispatcher)
                    for r in responses:
                        safe_send(r)

            except Exception as e:
                safe_send({"type": "error", "message": str(e)})
    finally:
        if assemblyai_proxy:
            assemblyai_proxy.close()

# ----------------------------------------------------------------------------
# Serve the built frontend (production). Only active if frontend/dist exists.
# ----------------------------------------------------------------------------
FRONTEND_DIST = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if not os.path.isdir(FRONTEND_DIST):
        return jsonify({"status": "ok", "note": "Frontend not built; run the Vite dev server."}), 200
    if path.startswith(("api/", "v1/")):
        return jsonify({"error": "Not found"}), 404
    candidate = os.path.join(FRONTEND_DIST, path)
    if path and os.path.isfile(candidate):
        return send_from_directory(FRONTEND_DIST, path)
    return send_from_directory(FRONTEND_DIST, "index.html")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), threaded=True)