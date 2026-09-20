"""
AUD-002: Token-Minting Route

GET /v1/token - Authenticated route that mints short-lived session tokens
for the frontend to connect to AssemblyAI Voice Agent WebSocket (or local mock agent).

Security policy:
- Must NOT accept arbitrary Bearer tokens unless valid JWT or explicitly allowed in dev bypass.
- Verifies JWT signature & expiration using JWT_SECRET.
- Extracts sub / user_id onto request.user_id.
- Never logs raw tokens or API keys in audit logs or responses.
"""

import asyncio
import secrets
import aiohttp
import jwt
from datetime import datetime, timezone
from flask import Flask, request, jsonify
from functools import wraps
from backend.config import get_config
from backend.audit_logger import AuditLogger


def require_bearer_auth(f):
    """Decorator enforcing JWT authentication on protected routes or dev bypass when ENV=development."""
    @wraps(f)
    def decorated(*args, **kwargs):
        config = get_config()
        auth_header = request.headers.get("Authorization", "")

        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401

        token = auth_header.split(" ", 1)[1].strip()
        if not token:
            return jsonify({"error": "Empty Bearer token"}), 401

        # Check for development bypass if ENV=development
        if config.ENV == "development" and token == "dev-token-bypass":
            request.user_id = "dev_worker"
            return f(*args, **kwargs)

        # Real JWT Verification with JWT_SECRET
        try:
            jwt_secret = config.JWT_SECRET or "aura-dev-jwt-secret"
            payload = jwt.decode(token, jwt_secret, algorithms=["HS256"])
            request.user_id = payload.get("sub", payload.get("user_id", "unknown_user"))
            return f(*args, **kwargs)
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Unauthorized: JWT token has expired"}), 401
        except jwt.PyJWTError as e:
            return jsonify({"error": f"Unauthorized: Invalid JWT token ({str(e)})"}), 401

    return decorated


def mint_assemblyai_token(api_key: str, expires_in: int = 300) -> dict:
    """
    Call AssemblyAI Voice Agent token endpoint.

    Endpoint: GET https://agents.assemblyai.com/v1/token
    Header: Authorization: Bearer <API_KEY>
    Returns: { token: "...", expires_in_seconds: N }
    """
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
                    raise RuntimeError(f"AssemblyAI token endpoint returned {resp.status}")
                data = await resp.json()
                return data

    return asyncio.run(_fetch_token())


def register_token_routes(app: Flask):
    """Register token minting routes on the Flask app."""
    audit_logger = AuditLogger()

    @app.route("/v1/token", methods=["GET"])
    @require_bearer_auth
    def issue_token():
        """
        Issue a short-lived session token for the frontend.
        Never logs raw tokens or API keys.
        """
        config = get_config()
        user_id = getattr(request, "user_id", "unknown_user")

        if not config.ASSEMBLYAI_API_KEY:
            # Fallback for local development/demo mode when API key is missing
            mock_token = f"mock_token_{secrets.token_hex(8)}"
            audit_logger.log_action(
                user_id=user_id,
                action="mock_token_issued",
                metadata={"mock": True, "expires_in_seconds": 300},
            )
            return jsonify({
                "token": mock_token,
                "expires_in_seconds": 300,
                "ws_url": f"ws://127.0.0.1:5000/v1/ws?token={mock_token}",
                "mock": True
            })

        try:
            result = mint_assemblyai_token(config.ASSEMBLYAI_API_KEY)
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
                metadata={"error": "AssemblyAI minting error"},
            )
            # Safe local fallback even if external AssemblyAI fails
            mock_token = f"mock_token_{secrets.token_hex(8)}"
            return jsonify({
                "token": mock_token,
                "expires_in_seconds": 300,
                "ws_url": f"ws://127.0.0.1:5000/v1/ws?token={mock_token}",
                "mock": True,
                "warning": "AssemblyAI token service unavailable, using local mock"
            })
