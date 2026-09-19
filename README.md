# Aura Field Safety Co-Pilot

Hands-free voice AI agent for frontline field workers (technicians, mechanics, warehouse staff, medical device operators), built on the **AssemblyAI Voice Agent API**.

## Quick Start (Local Demo)

1. Install Python dependencies:
   `pip install -r requirements.txt`

2. Start Flask backend server (port 5000):
   `python3 -m backend.app`

3. Start Frontend application:
   `cd frontend && npm install && npm run dev`

4. Open `http://localhost:5173/worker` in browser:
   - Click "Start Session" (uses local mock WS if `ASSEMBLYAI_API_KEY` is not set).
   - Activate Mic or type text commands (e.g., "pressure is 15 PSI" or "report a near miss").

## Architecture & Features

- **Hands-Free Voice Spine**: AudioWorklet 24kHz PCM16 capture, instant interruption audio manager, and tuned turn detection (AUD-003, AUD-004, AUD-005).
- **Two Modes in One Session**: Guided Field Ops (`field_ops`) and Adaptive Near-Miss Reporting (`reporting`).
- **Safety Layer**: Safety threshold checks and status checks gating reports when exposed (SAF-002, SAF-003).
- **Confirmation Gate & Idempotency**: DB writes require explicit confirmation. Deduplication via stable SHA-256 idempotency key (BE-004, INT-002).

## Environment Variables

Copy `.env.example` to `.env`:
```env
ASSEMBLYAI_API_KEY=   # Optional: if empty, app runs with local mock WS agent
PORT=5000
JWT_SECRET=aura-dev-jwt-secret
ENV=development
```
