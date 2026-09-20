# DOC-002: Decision Boundaries and Escalation Policy

This document details the safety decision boundaries, action classification matrix, confirmation requirements, and escalation procedures within Aura Field Safety Co-Pilot for supervisor reviewers and safety managers.

---

## Overview

Aura operates under strict safety decision boundaries designed to protect frontline field workers while ensuring data integrity. Every action triggered by voice input or tool calls is evaluated against a strict classification matrix before execution.

---

## Action Classification Matrix

| Action Name | Boundary Level | Worker Confirmation | Supervisor Approval | Gating Rules & Conditions |
|---|---|---|---|---|
| `speak_safety_warning` | `automatic` | No | No | Immediately triggered when a reading exceeds parameter thresholds. |
| `draft_corrective_action` | `automatic` | No | No | Creates a pending proposed action tied to pattern signals; never auto-applies. |
| `get_next_step` | `confirm` | Yes | No | Advances step only on explicit confirmation ("got it", "next step"). |
| `log_maintenance_entry` | `confirm` | Yes | No | Requires worker confirmation ("yes, log entry"). |
| `create_near_miss` | `confirm` | Yes | No | **Requires `check_safety_status.safe_to_report === true` AND explicit confirmation.** |
| `notify_safety_contact` | `confirm` / `supervisor-approve` | Yes | Conditional | **NEVER allowed without a valid `report_id`.** Requires supervisor approval if site policy demands it. |
| `apply_corrective_action` | `supervisor-approve` | Yes | Yes | Requires formal supervisor review, edit, or approval in Review Inbox. |
| `medical_advice` | `never` | N/A | N/A | Strictly forbidden. Aura refers worker to site medical emergency services. |
| `ignore_ppe` | `never` | N/A | N/A | Strictly forbidden. Aura never suggests skipping personal protective equipment. |
| `silent_auto_write` | `never` | N/A | N/A | Strictly forbidden. Silent background database writes are blocked. |

---

## Safety Gating & Escalation Rules

### 1. Safety Status Gating
Before collecting or submitting a near-miss report (`create_near_miss`), Aura runs `check_safety_status`. If `safe_to_report` is `false` (e.g. active hazardous exposure, unverified area clearance):
- **Action**: Report creation is **BLOCKED**.
- **Agent Response**: Aura instructs the worker to evacuate or isolate the hazard area immediately, then retry once safe.

### 2. Threshold Sentinel & Barge-In
Any numeric reading spoken by the worker (e.g., "coolant pressure is 15 PSI") triggers `check_safety_threshold`:
- If `severity` is `warn` or `critical`, normal assistant audio is interrupted immediately.
- A prominent blocking safety banner is displayed in the worker UI.
- The worker must acknowledge the reading before continuing procedure steps.

### 3. Escalation to Supervisors
Near-miss reports with severity `high` or `critical` automatically populate the **Supervisor Review Inbox** (`/inbox`).
Supervisors can:
- Review full worker voice narrative, provenance tags, and historical pattern matches.
- Edit report details with mandatory audit reason logging.
- Approve or reject reports, triggering automated site notifications (`notify_safety_contact`).
