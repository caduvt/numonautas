from pydantic import BaseModel
from typing import List


class Question(BaseModel):
    id: str
    difficulty: str
    level: int
    type: str
    question: str
    options: List[str]
    correctIndex: int


class GameState(BaseModel):
    difficulty: str = "easy"
    level: int = 1
    audio_enabled: bool = True
    game_active: bool = False
