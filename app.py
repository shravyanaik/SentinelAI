from datetime import datetime, timezone
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# Demo-only, in-memory audit log. Entries reset whenever the server restarts.
audit_log = []
next_id = 1

HIGH_IMPACT_TERMS = (
    "delete all", "delete every", "drop database", "change permissions",
    "grant admin", "transfer funds", "wire money", "disable security",
    "wipe records", "erase all"
)
SENSITIVE_TERMS = ("confidential", "customer data", "personal data", "credentials", "secret", "private key")
UNAPPROVED_DESTINATION_HINTS = ("unknown", "external", "unapproved", "public paste", "personal email")


def evaluate_policy(payload):
    """Deterministic demo policy. This evaluates an action; it never executes it."""
    action = payload["action"].strip()
    resource = payload["resource"].strip()
    sensitivity = payload["sensitivity"].strip().lower()
    destination = payload["destination"].strip()
    combined = f"{action} {resource}".lower()
    destination_lower = destination.lower()

    is_high_impact = any(term in combined for term in HIGH_IMPACT_TERMS)
    is_sensitive = sensitivity in {"confidential", "customer data"} or any(
        term in combined for term in SENSITIVE_TERMS
    )
    destination_unapproved = any(hint in destination_lower for hint in UNAPPROVED_DESTINATION_HINTS)

    if is_high_impact:
        return {
            "decision": "REQUIRE HUMAN APPROVAL",
            "reason": "This action could have a high impact (for example, deleting records, changing permissions, or transferring funds), so a person must review it before proceeding.",
            "policy": "High-Impact Action Review",
        }
    if is_sensitive and destination_unapproved:
        return {
            "decision": "BLOCK",
            "reason": "Sensitive or confidential information must not be sent to an unapproved or unknown destination.",
            "policy": "Sensitive Data Protection",
        }
    if destination_unapproved:
        return {
            "decision": "REQUIRE HUMAN APPROVAL",
            "reason": "The destination appears unapproved or external. Verify the destination before sharing or uploading data.",
            "policy": "Destination Verification",
        }
    if is_sensitive:
        return {
            "decision": "REQUIRE HUMAN APPROVAL",
            "reason": "Sensitive information was detected. Confirm that the destination is authorized and that sharing is necessary.",
            "policy": "Sensitive Data Protection",
        }
    return {
        "decision": "ALLOW",
        "reason": "The action passed the prototype's deterministic policy checks for this demo.",
        "policy": "Baseline Safety Check",
    }


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "service": "SentinelAI demo policy engine", "mode": "simulation"})


@app.get("/api/logs")
def get_logs():
    return jsonify({"logs": audit_log, "total": len(audit_log)})


@app.post("/api/evaluate")
def evaluate():
    global next_id
    if not request.is_json:
        return jsonify({"error": "Send the action details as JSON."}), 400

    payload = request.get_json(silent=True) or {}
    required = ("action", "resource", "sensitivity", "destination")
    missing = [field for field in required if not isinstance(payload.get(field), str) or not payload[field].strip()]
    if missing:
        return jsonify({"error": "Please fill in all fields: " + ", ".join(missing) + "."}), 400

    if len(payload["action"]) > 240 or len(payload["resource"]) > 240 or len(payload["destination"]) > 240:
        return jsonify({"error": "Action, resource, and destination must each be 240 characters or fewer."}), 400
    if payload["sensitivity"].strip().lower() not in {"public", "internal", "confidential", "customer data"}:
        return jsonify({"error": "Choose a valid data sensitivity option."}), 400

    result = evaluate_policy(payload)
    entry = {
        "id": next_id,
        "time": datetime.now().astimezone().strftime("%H:%M:%S"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "action": payload["action"].strip(),
        "resource": payload["resource"].strip(),
        "sensitivity": payload["sensitivity"].strip(),
        "destination": payload["destination"].strip(),
        "decision": result["decision"],
        "reason": result["reason"],
        "policy": result["policy"],
    }
    next_id += 1
    audit_log.insert(0, entry)
    del audit_log[100:]  # Keep the demo log bounded.
    return jsonify({"result": result, "log": entry, "total": len(audit_log)})


@app.errorhandler(500)
def internal_error(_error):
    return jsonify({"error": "An unexpected server error occurred. Please try again."}), 500


if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
