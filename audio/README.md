# Audio Module (AUD-001 through AUD-005)

Provides browser audio capture, playback buffering, and token-minting routes for AssemblyAI Voice Agent API.

## Local Running Instructions

### Environment Variables
Set the following in `.env`:
```env
ASSEMBLYAI_API_KEY=your_assemblyai_api_key  # Optional: if omitted, app uses local mock WS
JWT_SECRET=aura-dev-jwt-secret
ENV=development
```

### Audio Pipeline Specs
- **Capture**: 24kHz PCM16 base64 streaming from browser AudioWorklet (`frontend/src/audio/pcmWorker.ts`).
- **Playback**: Playback buffer for `reply.audio` (24kHz PCM16 base64) with immediate queue flush on safety alert (`frontend/src/audio/audioManager.ts`).
- **Turn Detection Constants**: `vad_threshold=0.5`, `interruption_delay=200ms`, `silence_duration_ms=500ms` (`frontend/src/audio/config.ts`).

### Token Endpoint
`GET /v1/token`
Headers: `Authorization: Bearer <JWT_TOKEN>` (or `Authorization: Bearer dev-token-bypass` in `ENV=development`).
