import json
import random
from pathlib import Path

# configs mockadas
game_state = {
    "difficulty": "easy",
    "level": 1,
    "audio_enabled": True,
    "game_active": False,
}


def load_random_question(difficulty: str, level: int):
    """Lê o arquivo JSON correspondente e sorteia uma questão do nível atual."""

    base_dir = Path(__file__).resolve().parent.parent
    filepath = base_dir / "data" / f"{difficulty}.json"

    try:
        with open(filepath, "r", encoding="utf-8") as file:
            all_questions = json.load(file)

        level_questions = [q for q in all_questions if q.get("level") == level]
        return random.choice(level_questions) if level_questions else None

    except FileNotFoundError:
        print(f"Erro: Arquivo não encontrado em {filepath}")
        return None
