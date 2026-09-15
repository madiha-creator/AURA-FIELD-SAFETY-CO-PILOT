"""
AUD-002: Token-Minting Route

GET /v1/token - Bearer-authenticated route that mints short-lived session tokens
for the frontend to connect to AssemblyAI Voice Agent WebSocket.

AssemblyAI flow (from browser integration guide):
  1. Backend calls AssemblyAI's token endpoint with API key (Bearer auth)
  2. Frontend receives token and connects via wss://agents.assemblyai.com/v1/ws?token=<token>
  3. Token is single-use, expires in 1-600 seconds
"""

import asyncio
import secrets
import aiohttp
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from functools import wraps
from ..core.config import get_config
from ..services.audit_logger import AuditLogger


def require_bearer_auth(f):
    """Decorator requiring Bearer authentication on protected routes."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")

        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401

        token = auth_header.split(" ", 1)[1].strip()
        if not token:
            return jsonify({"error": "Empty Bearer token"}), 401

        # TODO: Verify against your auth system / token store
        # Could validate JWT, check database, etc.
        # For now, accept any Bearer token (stub behavior)
        # TODO: add user_id extraction from token

        return f(*args, **kwargs)
    return decorated


def mint_assemblyai_token(api_key: str, expires_in: int = 300) -> dict:
    """
    Call AssemblyAI Voice Agent token endpoint.

    Endpoint: GET https://agents.assemblyai.com/v1/token
    Header: Authorization: Bearer <API_KEY>  (the service's long-lived key)
    Returns: { token: "...", expires_in_seconds: N }

    TODO: This makes a real HTTP call to AssemblyAI. Verified:
    - Correct API host is agents.assemblyai.com (Voice Agent API, not plain STT)
    - Method is GET (confirmed from browser integration guide)
    - expires_in_seconds is a query parameter (confirmed from browser integration guide)
    """
    # Validate expiry within AssemblyAI allowed range (1–600 seconds)
    expires_in = max(1, min(expires_in, 600))

    config = get_config()

    async def _fetch_token() -> dict:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        params = {
            "expires_in_seconds": expires_in,
        }
        async with aiohttp.ClientSession() as session:
            async with session.get(
                config.ASSEMBLYAI_TOKEN_URL,
                headers=headers,
                params=params,
            ) as resp:
                if resp.status != 200:
                    body = await resp.text()
                    raise RuntimeError(f"AssemblyAI token endpoint returned {resp.status}: {body}")
                data = await resp.json()
                # TODO: Verify exact response shape AssemblyAI returns
                # Expected: { "token": "...", "expires_in_seconds": N }
                return data

    # Run async in sync context (Flask is synchronous by default)
    return asyncio.run(_fetch_token())


def register_token_routes(app: Flask):
    """Register token minting routes on the Flask app."""
    get_config()  # Ensure config loads
    audit_logger = AuditLogger()

    @app.route("/v1/token", methods=["GET"])
    @require_bearer_auth
    def issue_token():
        """
        Issue a short-lived session token for the frontend.

        Bearer auth required (from your frontend's auth system).
        Returns an AssemblyAI Voice Agent token for WebSocket connection.
        """
        config = get_config()
        if not config.ASSEMBLYAI_API_KEY:
            return jsonify({"error": "Server configuration error"}), 500

        # The Bearer token from the request authenticates the user
        auth_header = request.headers.get("Authorization", "")
        bearer_token = auth_header.split(" ", 1)[1].strip() if auth_header.startswith("Bearer ") else ""

        # TODO: Extract user_id from bearer token properly
        user_id = "unknown"  # stub - replace with real user extraction

        try:
            result = mint_assemblyai_token(config.ASSEMBLYAI_API_KEY)

            # Log the token issuance (without exposing the token value)
            audit_logger.log_action(
                user_id=user_id,
                action="token_issued",
                metadata={
                    "expires_in_seconds": result.get("expires_in_seconds", 300),
                },
            )

            return jsonify(result)

        except Exception as e:
            audit_logger.log_action(
                user_id=user_id,
                action="token_issuance_failed",
                metadata={"error": str(e)},
            )
            return jsonify({"error": "Failed to mint token"}), 502
