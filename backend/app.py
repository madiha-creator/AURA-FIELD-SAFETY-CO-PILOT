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
        if site and r.get("location") != site:
            continue
        if equipment and r.get("equipment") != equipment:
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

    success = db.update_report_status(report_id, "approved")
    if not success:
        return jsonify({"error": "Report not found or invalid status"}), 404

    audit_logger.log_action(
        user_id=data.get("supervisor_id", "supervisor_1"),
        action="report_approved",
        metadata={"report_id": report_id, "notify_sent": send_notify}
    )

    notified_roles = []
    if send_notify:
        notified_roles = ["safety_officer", "site_manager"]
        db.create_notification({
            "alert_type": "near_miss_approved",
            "severity": "medium",
            "location": "Site Main",
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
    reason = data.get("reason", "Supervisor correction")

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
    if not reason:
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
