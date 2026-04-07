export type GameState = "start" | "playing" | "finished";

export interface GameConfig {
  difficulty: "easy" | "medium" | "hard";
  audio_enabled: boolean;
  animacoes_enabled: boolean;
}

export interface Question {
  expression: string;
  options: number[];
  correct_index: number;
}

export type WsMessage =
  | { type: "CONFIG_UPDATE"; difficulty: "easy" | "medium" | "hard"; audio_enabled: boolean; animacoes_enabled: boolean }
  | { type: "GAME_STARTED"; state: GameState; first_question: Question | null }
  | { type: "ANSWER_SELECTED"; index?: number; status?: "correct" | "wrong" }
  | { type: "NEW_QUESTION"; question: Question }
  | { type: "REQUEST_NEXT_QUESTION" }
  | { type: "START_GAME" }; // If we want to start from the web interface
