import asyncio
import json
from typing import Dict, Set, Any
from datetime import datetime, timezone


class WSManager:
    """In-memory websocket connection manager for real-time messaging."""

    def __init__(self):
        # user_id -> set of websocket connections (a user may have multiple tabs/devices)
        self.connections: Dict[str, Set[Any]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, user_id: str, ws):
        async with self._lock:
            self.connections.setdefault(user_id, set()).add(ws)

    async def disconnect(self, user_id: str, ws):
        async with self._lock:
            if user_id in self.connections:
                self.connections[user_id].discard(ws)
                if not self.connections[user_id]:
                    del self.connections[user_id]

    def is_online(self, user_id: str) -> bool:
        return user_id in self.connections and len(self.connections[user_id]) > 0

    def online_users(self) -> Set[str]:
        return set(self.connections.keys())

    async def send_to_user(self, user_id: str, message: dict):
        if user_id not in self.connections:
            return
        dead = []
        for ws in list(self.connections[user_id]):
            try:
                await ws.send_text(json.dumps(message, default=str))
            except Exception:
                dead.append(ws)
        for ws in dead:
            await self.disconnect(user_id, ws)

    async def broadcast_to_users(self, user_ids, message: dict):
        for uid in user_ids:
            await self.send_to_user(uid, message)


ws_manager = WSManager()
