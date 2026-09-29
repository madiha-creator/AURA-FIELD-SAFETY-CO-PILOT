"""
Real-time proxy between a browser's local /v1/ws session and AssemblyAI's real
Voice Agent API (wss://agents.assemblyai.com/v1/ws).

flask-sock (used for the browser-facing /v1/ws route) is synchronous, but the
AssemblyAI client needs a persistent async WebSocket connection. This class
bridges the two: it runs its own asyncio event loop on a background thread,
holds the AssemblyAI connection open for the lifetime of the browser session,
and reports every event back to the caller via a plain callback so it can be
relayed to the browser (and, for tool.call events, executed locally and
answered with tool.result).
"""

import asyncio
import json
import threading
from typing import Callable, Optional

import websockets


class AssemblyAIProxy:
    """One instance per browser voice session. Not reused across sessions."""

    def __init__(
        self,
        api_key: str,
        ws_url: str,
        session_update: dict,
        on_event: Callable[[dict], None],
    ):
        self.api_key = api_key
        self.ws_url = ws_url
        self.session_update = session_update
        self.on_event = on_event

        self._loop: Optional[asyncio.AbstractEventLoop] = None
        self._thread: Optional[threading.Thread] = None
        self._ws = None
        self._connected_event = threading.Event()
        self._closed = False
        self._ready = False

    def start(self, wait_for_connect_seconds: float = 6.0):
        """Start the background connection thread. Blocks briefly so callers
        know (approximately) whether the connection succeeded before continuing."""
        self._thread = threading.Thread(target=self._run_loop, daemon=True)
        self._thread.start()
        self._connected_event.wait(timeout=wait_for_connect_seconds)

    def _run_loop(self):
        self._loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self._loop)
        try:
            self._loop.run_until_complete(self._connect_and_listen())
        except Exception as e:
            self._safe_emit({"type": "session.error", "message": f"AssemblyAI connection failed: {e}"})
        finally:
            self._connected_event.set()

    async def _connect_and_listen(self):
        try:
            async with websockets.connect(
                self.ws_url,
                additional_headers={"Authorization": f"Bearer {self.api_key}"},
                max_size=8 * 1024 * 1024,
            ) as ws:
                self._ws = ws
                await ws.send(json.dumps(self.session_update))
                self._connected_event.set()

                async for raw in ws:
                    if self._closed:
                        break
                    try:
                        event = json.loads(raw)
                    except (TypeError, ValueError):
                        continue
                    if event.get("type") == "session.ready":
                        self._ready = True
                    self._safe_emit(event)
        except Exception as e:
            self._safe_emit({"type": "session.error", "message": f"AssemblyAI connection error: {e}"})
        finally:
            self._ws = None

    def _safe_emit(self, event: dict):
        try:
            self.on_event(event)
        except Exception as e:
            # Never let a broken browser-side handler take down the AssemblyAI
            # receive loop; just report the failure as an event.
            try:
                self.on_event({"type": "session.error", "message": f"Event handler error: {e}"})
            except Exception:
                pass

    def send_audio(self, base64_audio: str):
        if not base64_audio or not self._ready:
            return
        self._send_json({"type": "input.audio", "audio": base64_audio})

    def send_json(self, payload: dict):
        self._send_json(payload)

    def _send_json(self, payload: dict):
        if self._closed or not self._loop or not self._ws:
            return
        try:
            asyncio.run_coroutine_threadsafe(self._ws.send(json.dumps(payload)), self._loop)
        except Exception:
            pass

    def close(self):
        if self._closed:
            return
        self._closed = True
        if self._loop and self._ws:
            try:
                fut = asyncio.run_coroutine_threadsafe(self._ws.close(), self._loop)
                fut.result(timeout=2)
            except Exception:
                pass