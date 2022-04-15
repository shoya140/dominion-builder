import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware


class ConnectionManager:
    def __init__(self):
        self.connections = {}

    async def connect(self, websocket: WebSocket, room_id: str, user_id: str):
        await websocket.accept()
        if not room_id in self.connections:
            self.connections[room_id] = {}
        self.connections[room_id][user_id] = {
            "user_name": user_id,
            "websocket": websocket,
            "selections": []
        }
        await self.broadcast_room_status(room_id)

    async def disconnect(self, room_id: str, user_id: str):
        del self.connections[room_id][user_id]
        if len(self.connections[room_id]) == 0:
            del self.connections[room_id]
            return  # do not broadcast if the room is empty
        await self.broadcast_room_status(room_id)

    async def handle_message(self, room_id: str, user_id, message: str):
        data = json.loads(message)

        if data["event_type"] == "submit selections":
            self.connections[room_id][user_id]["selections"] = data["selections"]
            n_users = int(room_id[0]) // 3 + 2  # defined in the frontend
            if len([x for x in self.connections[room_id].values() if len(x["selections"]) > 0]) == (n_users):
                await self.broadcast_results(room_id)

        if data["event_type"] == "update user name":
            self.connections[room_id][user_id]["user_name"] = data["user_name"]

        await self.broadcast_room_status(room_id)

    async def broadcast_room_status(self, room_id):
        filtered_user_status = [
            {
                "userId": user_id,
                "userName": x["user_name"],
                "submitted": len(x["selections"])
            } for user_id, x in self.connections[room_id].items()
        ]
        payload = {
            "eventType": "users updated",
            "users": filtered_user_status
        }
        await self.broadcast(json.dumps(payload), room_id)

    async def broadcast_results(self, room_id: str):
        cards = {}
        logs = []
        for user in self.connections[room_id].values():
            selections = "と".join(["「" + x + "」" for x in user["selections"]])
            logs.append(user["user_name"] + "は" + selections + "を指定しました。")
            for selection in user["selections"]:
                cards[selection] = 1
        payload = {
            "eventType": "voting completed",
            "cards": list(cards.keys()),
            "logs": logs
        }
        await self.broadcast(json.dumps(payload), room_id)

    async def broadcast(self, message: str, room_id: str):
        try:
            for user in self.connections[room_id].values():
                await user["websocket"].send_text(message)
        except:
            print("warning: The connection was already closed")


manager = ConnectionManager()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    clients = {}
    for room, users in manager.connections.items():
        clients[room] = list(users.keys())
    return clients


@app.websocket("/{room_id}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, user_id: str):
    await manager.connect(websocket, room_id, user_id)

    try:
        while True:
            message = await websocket.receive_text()
            await manager.handle_message(room_id, user_id, message)
    except WebSocketDisconnect:
        await manager.disconnect(room_id, user_id)
