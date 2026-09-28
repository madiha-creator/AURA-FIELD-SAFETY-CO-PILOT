# Deployment Guide (Render / Container Service)

Aura Field Safety Co-Pilot is packaged as a single multi-stage Docker container that compiles the Vite React SPA frontend and serves it via Gunicorn/Flask alongside `/api/*` REST endpoints and the `/v1/ws` real-time WebSocket agent bridge.

## Required Environment Variables

| Variable | Description | Required in Production | Default / Example |
|---|---|---|---|
| `ASSEMBLYAI_API_KEY` | AssemblyAI Voice Agent API Key | **Yes** | `aai_...` |
| `ENV` | Application environment | **Yes** | `production` |
| `JWT_SECRET` | Secret key for JWT verification | **Yes** | `random-32-byte-secret` |
| `PORT` | Web server listening port | Optional | `10000` |
| `FRONTEND_ORIGIN` | Allowed origin for CORS | Optional | `https://your-app.onrender.com` |
| `SLACK_WEBHOOK_URL` | Webhook URL for outbound safety alerts | Optional | `https://hooks.slack.com/services/...` |

## Service Configuration on Render

1. **Service Type**: Web Service (Docker runtime)
2. **Health Check Path**: `/health` (returns `{"status": "ok"}`)
3. **WebSockets**: WebSockets are supported on Render by default on `/v1/ws`.
4. **Command**: Gunicorn uses 1 worker (`-w 1`) with 100 threads (`--threads 100`) to maintain persistent WebSocket connections and thread-safe in-memory session states.
