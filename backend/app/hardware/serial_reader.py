import asyncio
import serial
from app.core.config import SERIAL_PORT, BAUD_RATE
from app.core.game_logic import game_state, load_random_question
from app.api.websocket import manager


def process_serial_signal(signal: str) -> dict | None:
    """Mapeia o sinal bruto da FPGA para uma ação do jogo."""
    print(f"Sinal recebido da placa: {signal}")

    if signal.startswith("BTN_"):
        # Exemplo: converte "BTN_1" no índice 0 (opção 1 do JSON)
        option_index = int(signal.split("_")[1]) - 1
        return {"type": "ANSWER_SELECTED", "payload": {"selectedIndex": option_index}}

    elif signal in ["SET_EASY", "SET_MEDIUM", "SET_HARD"]:
        game_state["difficulty"] = signal.split("_")[1].lower()
        return {"type": "CONFIG_UPDATE", "payload": game_state}

    elif signal in ["AUDIO_ON", "AUDIO_OFF"]:
        game_state["audio_enabled"] = signal == "AUDIO_ON"
        return {"type": "CONFIG_UPDATE", "payload": game_state}

    elif signal == "START_GAME":
        game_state["game_active"] = True
        game_state["level"] = 1  # reseta o nível
        question = load_random_question(game_state["difficulty"], game_state["level"])
        return {
            "type": "GAME_STARTED",
            "payload": {"state": game_state, "firstQuestion": question},
        }
    return None


async def serial_reader_task():
    """Loop assíncrono que escuta a PySerial e dispara o broadcast."""
    try:
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=0.1)
        print(f"Conectado à FPGA em {SERIAL_PORT}")

        while True:
            if ser.in_waiting > 0:
                line = ser.readline().decode("utf-8").strip()
                event_data = process_serial_signal(line)

                if event_data:
                    await manager.broadcast(event_data)

            await asyncio.sleep(0.01)

    except serial.SerialException as e:
        print(f"Erro na porta serial: {e}. Verifique o cabo ou as permissões do Linux.")
    except Exception as e:
        print(f"Erro inesperado: {e}")
