# AGENTS.md — Aura Field Safety Co-Pilot Agent Guidelines

Welcome, AI Agent! This guide summarizes codebase structure, task SKUs, shared contracts, coding standards, and verification commands.

## Architecture & Top-Level Folder Map

- `audio/` (**AUD-***): Token minting (`GET /v1/token`), mic capture AudioWorklet, audio playback manager, VAD turn-detection config.
- `backend/` (**BE-***): Flask backend server (`backend/app.py` listening on port 5000), state manager (`ConversationState`), tool dispatcher, confirmation gate, audit logger.
- `safety/` (**SAF-***): Parameter safe ranges (`safe_ranges.py`), threshold checking (`check_safety_threshold`), safety status gating (`check_safety_status`), decision boundary classification.
- `data/` (**DAT-***): Offline TF-IDF manual index (`data/indexes/manual_index.json`), manual search (`query_manual_db`), missing field follow-ups, similar incident pattern search.
- `integrations/` (**INT-***): SQLite default database interface, near-miss creation with idempotency, maintenance logging, safety notifications, corrective action drafting.
- `frontend/` (**FE-***): React + Vite + TypeScript web app containing Worker Voice Spine view (`/worker`) and Supervisor Review Dashboard (`/inbox`, `/patterns`, `/maintenance`).
- `qa/` (**QA-***): Automated test suite (`qa/test_qa_suite.py`) testing field corrections (QA-001), step playback barge-in (QA-002), threshold sentinel triggering (QA-003), and 30s session resume with idempotency deduplication (QA-004).
- `docs/` (**DOC-***): System prompt & tool schemas reference (`DOC-001`), decision boundaries & escalation policy (`DOC-002`).
- `packages/contracts/`: Canonical JSON tool schemas (`tools.schema.json`) and TypeScript types (`index.ts`).

## Core Shared Contracts

1. **Tool Schemas**: `packages/contracts/tools.schema.json` is the single source of truth for tool definitions sent in `session.update.tools[]`.
2. **Idempotency Key Contract**: `create_near_miss` MUST hash `SHA256(worker_id:site:equipment:normalized_narrative:local_day)` and deduplicate on replay across restarts.
3. **Safety Status Gating**: `check_safety_status` must return `safe_to_report: true` before `create_near_miss` can write a near-miss report.
4. **Confirmation Gate**: Any database write (`log_maintenance_entry`, `create_near_miss`, `notify_safety_contact`) requires explicit worker confirmation (`confirmation_status == CONFIRMED`). Silent auto-write is strictly forbidden.

## Local Running & Verification Commands

- **Python Tests**:
  ```bash
  python3 -m unittest qa/test_qa_suite.py
  ```
- **Frontend Build Check**:
  ```bash
  cd frontend && npm run build
  ```
- **Backend Flask Server**:
  ```bash
  python3 -m backend.app
  ```
