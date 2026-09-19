"""
Backend Server exposing REST API for Supervisor Web Dashboard and AssemblyAI Token minting.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from integrations.database import get_database
from backend.audit_logger import AuditLogger
from backend.state_manager import get_state_manager
import backend.tool_dispatcher as tool_dispatcher_mod
from audio.token_routes import register_token_routes

app = Flask(__name__)
CORS(app)

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
# ----------------------------------------------------------------------------

@app.route("/api/reviews", methods=["GET"])
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
def approve_review(report_id):
    data = request.json or {}
    send_notify = data.get("notify_safety_contact", False)

    report = db.get_report_detail(report_id)
    if not report:
        return jsonify({"error": "Report not found"}), 404

    success = db.update_report_status(report_id, "approved")
    if not success:
        return jsonify({"error": "Failed to update report status"}), 400

    audit_logger.log_action(
        user_id=data.get("supervisor_id", "supervisor_1"),
        action="report_approved",
        metadata={"report_id": report_id, "notify_sent": send_notify}
    )

    notified_roles = []
    if send_notify:
        notified_roles = ["safety_officer", "site_manager"]
        # Use report's actual location/site dynamically (do not hardcode "Site Main")
        report_site = report.get("location") or "Unspecified Site"
        db.create_notification({
            "alert_type": "near_miss_approved",
            "severity": "medium",
            "location": report_site,
            "equipment": report.get("equipment"),
            "recipient_role": "safety_officer",
            "sender_id": data.get("supervisor_id", "supervisor_1")
        })

    return jsonify({
        "status": "approved",
        "report_id": report_id,
        "notified": notified_roles
    })

@app.route("/api/reviews/<report_id>/edit", methods=["POST"])
def edit_review(report_id):
    data = request.json or {}
    changes = data.get("changes", {})
    reason = data.get("reason")

    if not reason or not reason.strip():
        return jsonify({"error": "Reason is required for editing a report"}), 400

    report = db.get_report_detail(report_id)
    if not report:
        return jsonify({"error": "Report not found"}), 404

    updated = db.update_report_fields(report_id, changes)

    audit_logger.log_action(
        user_id=data.get("supervisor_id", "supervisor_1"),
        action="report_edited_by_supervisor",
        metadata={"report_id": report_id, "changes": changes, "reason": reason}
    )

    return jsonify({
        "status": "updated",
        "report_id": report_id,
        "report": updated
    })

@app.route("/api/reviews/<report_id>/reject", methods=["POST"])
def reject_review(report_id):
    data = request.json or {}
    reason = data.get("reason")
    if not reason or not reason.strip():
        return jsonify({"error": "Reason is required for rejection"}), 400

    success = db.update_report_status(report_id, "rejected")
    if not success:
        return jsonify({"error": "Report not found"}), 404

    audit_logger.log_action(
        user_id=data.get("supervisor_id", "supervisor_1"),
        action="report_rejected",
        metadata={"report_id": report_id, "reason": reason}
    )

    return jsonify({
        "status": "rejected",
        "report_id": report_id,
        "reason": reason
    })

@app.route("/api/patterns", methods=["GET"])
def list_patterns():
    patterns = db.get_patterns_list()
    return jsonify({"patterns": patterns})

@app.route("/api/maintenance", methods=["GET"])
def list_maintenance():
    entries = db.get_maintenance_entries()
    return jsonify({"maintenance_entries": entries})

@app.route("/api/audit/<session_id>", methods=["GET"])
def get_session_audit(session_id):
    history = audit_logger.get_session_history(session_id)
    return jsonify({"session_id": session_id, "timeline": history})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

# ----------------------------------------------------------------------------
# WebSocket Support for Local Voice Agent / Mock Session Loop (BE-001 / BE-003)
# ----------------------------------------------------------------------------
from flask_sock import Sock
from backend.assemblyai_service import build_session_update, handle_assemblyai_message
import json

sock = Sock(app)

@sock.route("/v1/ws")
def ws_agent_loop(ws):
    """
    WebSocket endpoint for local agent session loop.
    Enables voice/text communication with tool execution and safety sentinel.
    """
    session_id = request.args.get("session_id", "demo_session")
    token = request.args.get("token", "")

    # Initialize conversation state
    state = state_manager.get_state(session_id)
    if not state:
        state = state_manager.create_session(user_id="worker_01", session_id=session_id)

    tool_dispatcher = tool_dispatcher_mod.ToolDispatcher(state_manager, audit_logger)

    # Send session.ready
    ws.send(json.dumps({
        "type": "session.ready",
        "session_id": session_id,
        "message": "Aura Voice Co-Pilot Connected."
    }))

    # Send initial session.update greeting
    session_update = build_session_update(mode=state.mode.value)
    ws.send(json.dumps(session_update))

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
                ws.send(json.dumps({"type": "session.updated", "status": "ok"}))

            elif msg_type == "user_turn" or msg_type == "text_input":
                user_text = msg.get("text", "").strip()

                # Check safety threshold on any numeric readings spoken or typed
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
                        ws.send(json.dumps({
                            "type": "safety_alert",
                            "alert": thresh_res,
                            "message": thresh_res.get("message")
                        }))

                # Mode switching logic
                if "report" in user_text.lower() or "near miss" in user_text.lower():
                    state_manager.set_mode(session_id, "reporting")

                    # Run safety status check before starting report
                    status_res = tool_dispatcher.execute("check_safety_status", {
                        "session_id": session_id,
                        "mode": "reporting",
                        "worker_id": state.user_id,
                        "self_reported_clear": ("clear" in user_text.lower() or "safe" in user_text.lower())
                    })

                    if not status_res.get("safe_to_report", True):
                        ws.send(json.dumps({
                            "type": "agent_reply",
                            "text": status_res.get("reason", "Please move to a safe area before submitting report."),
                            "safe_to_report": False,
                            "mode": "reporting"
                        }))
                        continue

                    ws.send(json.dumps({
                        "type": "agent_reply",
                        "text": "Starting near-miss report. What equipment and location were involved?",
                        "mode": "reporting"
                    }))

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

                        ws.send(json.dumps({
                            "type": "agent_reply",
                            "text": step_res.get("step_text"),
                            "current_step": state.current_step,
                            "mode": "guided_ops"
                        }))
                    else:
                        ws.send(json.dumps({
                            "type": "agent_reply",
                            "text": f"Step {curr_step}: Inspect secondary coolant reservoir line connections for leaks.",
                            "current_step": curr_step,
                            "mode": "guided_ops"
                        }))
                else:
                    # Echo response / standard assistant reply
                    ws.send(json.dumps({
                        "type": "agent_reply",
                        "text": f"Aura received: '{user_text}'. Ready for next step or report field.",
                        "mode": state_manager.get_state(session_id).mode.value
                    }))

            elif msg_type == "tool.call":
                responses = handle_assemblyai_message(msg, state_manager, tool_dispatcher)
                for r in responses:
                    ws.send(json.dumps(r))

        except Exception as e:
            ws.send(json.dumps({"type": "error", "message": str(e)}))
