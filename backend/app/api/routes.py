from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.api.websocket import manager
from app.core.game_logic import game_state, load_random_question

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Aguarda eventos vindos do React
            data = await websocket.receive_json()

            if data.get("type") == "REQUEST_NEXT_QUESTION":
                # Lógica simplificada: em um fluxo real, você verificaria se o nível precisa subir
                new_q = load_random_question(
                    game_state["difficulty"], game_state["level"]
                )
                await manager.broadcast({"type": "NEW_QUESTION", "payload": new_q})

    except WebSocketDisconnect:
        manager.disconnect(websocket)
