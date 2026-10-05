import json
from typing import Dict, List, Optional
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # Maps room_name -> List of WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Maps user_id -> List of WebSockets (a user can have multiple tabs open)
        self.user_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_name: str, user_id: int):
        await websocket.accept()
        
        # Add to room
        if room_name not in self.active_connections:
            self.active_connections[room_name] = []
        self.active_connections[room_name].append(websocket)
        
        # Add to user connections
        if user_id not in self.user_connections:
            self.user_connections[user_id] = []
        self.user_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, room_name: str, user_id: int):
        # Remove from room
        if room_name in self.active_connections:
            if websocket in self.active_connections[room_name]:
                self.active_connections[room_name].remove(websocket)
            if len(self.active_connections[room_name]) == 0:
                del self.active_connections[room_name]
                
        # Remove from user connections
        if user_id in self.user_connections:
            if websocket in self.user_connections[user_id]:
                self.user_connections[user_id].remove(websocket)
            if len(self.user_connections[user_id]) == 0:
                del self.user_connections[user_id]

    async def broadcast_to_room(self, room_name: str, message: dict):
        if room_name in self.active_connections:
            # We iterate over a copy to handle disconnects during broadcast safely
            for connection in list(self.active_connections[room_name]):
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

    async def send_personal_message(self, user_id: int, message: dict):
        if user_id in self.user_connections:
            for connection in list(self.user_connections[user_id]):
                try:
                    await connection.send_json(message)
                except Exception:
                    pass
    
    async def broadcast_to_branch(self, branch_id: int, message: dict):
        await self.broadcast_to_room(f"branch:{branch_id}", message)
        
    async def broadcast_to_admin(self, message: dict):
        await self.broadcast_to_room("admin:all", message)
        
    async def broadcast_to_queue(self, queue_id: int, message: dict):
        await self.broadcast_to_room(f"queue:{queue_id}", message)

manager = ConnectionManager()
