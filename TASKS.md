# Task Breakdown

Each task has a SKU (code) for assignment and tracking. Prefix indicates area: **AUD**=Audio/Voice, **BE**=Backend, **FE**=Frontend, **DAT**=Data/Retrieval, **SAF**=Safety Logic, **INT**=Integrations, **QA**=Testing/QA, **DOC**=Docs.

| SKU | Task | Area | Owner | Status |
|---|---|---|---|---|
| AUD-001 | Set up AssemblyAI API key + secure server-side storage | Audio/Voice |      |      |
| AUD-002 | Build token-minting backend route (GET /v1/token, Bearer auth) | Audio/Voice |      |      |
| AUD-003 | Implement mic capture: AudioWorklet, Float32→PCM16→base64, 24kHz | Audio/Voice |      |     |
| AUD-004 | Implement audio playback buffer for reply.audio (no sleep-scheduling) | Audio/Voice |      |      |
| AUD-005 | Tune turn detection (vad_threshold, interruption_delay) for frequent interruptions | Audio/Voice |      |     |
| BE-001 | Design session.update payload: system_prompt, greeting, tools, voice | Backend |      |      |
| BE-002 | Build conversation state tracking (current step / report fields / confirmation status) | Backend |       |      |
| BE-003 | Implement tool.call → tool.result round trip, incl. interrupted-reply handling | Backend |      |      |
| BE-004 | Build confirmation-gate logic before any write action | Backend |      |      |
| BE-005 | Build audit history logging (what was said, changed, confirmed, created) | Backend |      |      |
| SAF-001 | Define safe-range reference data per procedure/parameter | Safety Logic |      |      |
| SAF-002 | Implement check_safety_threshold — flags unsafe spoken readings | Safety Logic |      |      |
| SAF-003 | Implement check_safety_status — blocks reporting while worker is exposed | Safety Logic |       |      |
| SAF-004 | Define decision boundaries: automatic vs confirm vs supervisor-approve vs never | Safety Logic |      |      |
| DAT-001 | Build/index vector database of technical manuals | Data/Retrieval | rwilliamspbg-ops | done |
| DAT-002 | Implement query_manual_db similarity search + safe-range context return | Data/Retrieval | rwilliamspbg-ops | done |
| DAT-003 | Design incident report schema with field-status tags | Data/Retrieval | rwilliamspbg-ops | done |
| DAT-004 | Implement get_missing_fields adaptive follow-up logic | Data/Retrieval | rwilliamspbg-ops | done |
| DAT-005 | Build embedding + similarity search for incident pattern matching | Data/Retrieval | rwilliamspbg-ops | done |
| INT-001 | Implement log_maintenance_entry write to Salesforce/Jira/SQL | Integrations |      |      |
| INT-002 | Implement create_near_miss write + idempotency handling | Integrations |      |      |
| INT-003 | Implement notify_safety_contact per site policy | Integrations |      |      |
| INT-004 | Implement draft_corrective_action proposal flow | Integrations |      |      |
| FE-001 | Build mode-aware app UI: procedure-step view / report-field view | Frontend |     |  |
| FE-002 | Build live transcript + safety-alert banner UI | Frontend |     |     |
| FE-003 | Build text/keyboard fallback input path | Frontend |      |     |
| FE-004 | Build supervisor review UI: approve/edit/reject actions | Frontend |     |    |
| QA-001 | Test interruption handling end-to-end (correcting a report field mid-flow) | Testing/QA | rwilliamspbg-ops | done |
| QA-002 | Test interruption handling mid-procedure-step playback | Testing/QA | rwilliamspbg-ops | done |
| QA-003 | Test safety-sentinel triggering on out-of-range spoken values | Testing/QA | rwilliamspbg-ops | done |
| QA-004 | Test session resume after disconnect (30s window) | Testing/QA | rwilliamspbg-ops | done |
| DOC-001 | Write example system prompt and tool schema reference for the team | Docs | rwilliamspbg-ops | done |
| DOC-002 | Document decision boundaries and escalation rules for reviewers | Docs | rwilliamspbg-ops | done |
