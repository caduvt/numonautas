import fs from "fs";
import path from "path";

export interface GameState {
  difficulty: "easy" | "medium" | "hard";
  level: number; // Fase do jogo (1 a 15)
  audio_enabled: boolean;
  animacoes_enabled: boolean;
  game_active: boolean;
}

export const gameState: GameState = {
  difficulty: "easy",
  level: 1,
  audio_enabled: true,
  animacoes_enabled: true,
  game_active: false,
};

export interface Question {
  id: string; // Adicionado para ajudar no rastreamento
  expression: string;
  options: number[];
  correct_index: number;
  level: number;
  game_level?: number;
}

// Guarda os IDs das questões já jogadas nesta partida para não repetir
let playedQuestionIds: Set<string> = new Set();

// Se o jogo for resetado (ou iniciado), limpamos as questões já jogadas
export function resetPlayedQuestions() {
  playedQuestionIds.clear();
}

export function loadRandomQuestion(
  difficulty: string,
  gameLevel: number,
): Question | null {
  // 1. Lógica de 15 fases: a cada 5 fases, a matemática fica mais difícil (level no JSON)
  let mathLevel = 1;
  if (gameLevel >= 1 && gameLevel <= 5) mathLevel = 1;
  else if (gameLevel >= 6 && gameLevel <= 10) mathLevel = 2;
  else if (gameLevel >= 11 && gameLevel <= 15) mathLevel = 3;
  else return null; // Jogo acabou (passou da 15)

  const filepath = path.resolve(
    __dirname,
    "..",
    "questions",
    `${difficulty}.json`,
  );

  try {
    const data = fs.readFileSync(filepath, "utf-8");
    const allQuestions: any[] = JSON.parse(data);

    // 2. Filtra questões pela dificuldade matemática correta
    const levelQuestions = allQuestions.filter((q) => q.level === mathLevel);

    // 3. Filtra apenas as que ainda não foram jogadas para evitar repetição
    const availableQuestions = levelQuestions.filter(
      (q) => !playedQuestionIds.has(q.id),
    );

    // Escolhe uma questão (se acabarem as inéditas, sorteia das repetidas mesmo)
    const pool =
      availableQuestions.length > 0 ? availableQuestions : levelQuestions;

    if (pool.length > 0) {
      const randomIndex = Math.floor(Math.random() * pool.length);
      const selectedRaw = pool[randomIndex];

      // Salva o ID na memória
      playedQuestionIds.add(selectedRaw.id);

      // --- LÓGICA DE EMBARALHAMENTO (SHUFFLE) ---
      // Pegamos o valor da resposta correta original antes de misturar
      const correctAnswerValue = selectedRaw.options[selectedRaw.correctIndex];

      // Criamos uma cópia embaralhada das opções
      const shuffledOptions = [...selectedRaw.options].sort(
        () => Math.random() - 0.5,
      );

      // Descobrimos onde a resposta correta foi parar (o novo correct_index)
      const newCorrectIndex = shuffledOptions.indexOf(correctAnswerValue);

      return {
        id: selectedRaw.id,
        expression: selectedRaw.question,
        level: selectedRaw.level,
        options: shuffledOptions.map((opt: string) => Number(opt)),
        correct_index: newCorrectIndex,
        game_level: gameLevel,
      };
    }
    return null;
  } catch (error) {
    console.error(
      `Erro: Arquivo não encontrado ou erro de leitura em ${filepath}`,
      error,
    );
    return null;
  }
}
