# Aura Field Safety Co-Pilot — 5-Minute Demo Video Script

**Target Audience:** LabLab.ai AssemblyAI Voice Agent Hackathon Judges
**Duration:** 5 Minutes (0:00 – 5:00)

---

## Shot 1: The Problem & Solution Overview (0:00 – 0:20)
* **Visual:** Split screen — Frontline worker with heavy gloves near high-pressure equipment vs. Mobile Voice UI `/worker`.
* **Voiceover:**
  > "Frontline field technicians work with their hands on dangerous equipment. When an anomaly occurs, asking them to remove heavy gloves and type into a form leads to underreported near-misses. Meet **Aura** — an AI Field Safety Co-Pilot built on AssemblyAI's real-time Voice Agent API that guides technicians hands-free and captures safety near-misses before accidents happen."

---

## Shot 2: Guided Ops & Spoken Interruption (0:20 – 2:30)
* **Visual:** `/worker` screen open on mobile device.
* **Worker:** `"Walk me through the coolant flush."`
* **Aura (Voice - AssemblyAI Alba):** `"Aura here. Starting coolant flush procedure. Step 1: Inspect secondary coolant reservoir line connections for leaks. Let me know when you're ready for the next step."`
* **Worker (Spoken Barge-in Interrupt):** `"Pressure is 15 PSI."`
* **Visual Action:** Red warning banner appears instantly (`CRITICAL SENTINEL TRIP`). Audio playback flushes immediately.
* **Aura (Voice Interrupt Warning):** `"WARNING: Measured pressure 15 PSI exceeds safe operating range of 4.0 to 10.0 PSI. Cease operation immediately and close isolation valve SV-2."`
* **Narrator Note:** Demonstrates real-time Voice Agent tool execution (`check_safety_threshold`), immediate audio queue barge-in, and procedure lock.

---

## Shot 3: Safety Clearance & Adaptive Near-Miss Intake (2:30 – 3:30)
* **Worker:** `"Line is isolated and clear. I want to report a near miss."`
* **Aura:** `"Calling check safety status... Worker safety verified clear. What location and equipment were involved?"`
* **Worker:** `"Warehouse 03 Bay 7, Coolant Pump Line CP-2. Pressure spiked during flush."`
* **Aura (Read-back):** `"Near-miss report summary: Location: Warehouse 03 Bay 7, Equipment: Coolant Pump Line CP-2, Hazard: Pressure spike during coolant flush. Please say 'yes' or 'confirm' to file this report."`
* **Worker:** `"Confirm, file it."`
* **Aura:** `"Report created with idempotency key seed_key_001. Drafted supervisor corrective action for review."`

---

## Shot 4: Supervisor Review & Provenance Audit (3:30 – 4:30)
* **Visual:** Switch to Supervisor Review Dashboard (`/inbox`).
* **Supervisor Action:** Click on newly filed report for `Coolant Pump Line CP-2`.
* **Visual Details:**
  - Provenance badges visible (`SAID`, `INFERRED`, `CONFIRMED`).
  - Pattern signal highlighted (`3rd pressure anomaly on CP-2 line in 14 days`).
  - Click **Approve & Notify Safety Contact**.
* **System Action:** Outbound notification fires to configured Slack webhook (`SLACK_WEBHOOK_URL`).

---

## Shot 5: AssemblyAI Technical Highlights & Wrap-Up (4:30 – 5:00)
* **Visual:** Architecture slide showing AssemblyAI Voice Agent WebSocket connection, tool schemas, and safety decision gate.
* **Voiceover:**
  > "Aura leverages AssemblyAI's Voice Agent API over WebSockets, using custom keyterms, near-field audio tuning, and strict tool contracts. Safety status gating, confirmation gates, and cryptographic idempotency ensure enterprise reliability in high-risk environments. Thank you for reviewing Aura Field Safety Co-Pilot."
