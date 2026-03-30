import fs from 'fs';
import path from 'path';

export interface GameState {
  difficulty: 'easy' | 'medium' | 'hard';
  level: number;
  audio_enabled: boolean;
  animacoes_enabled: boolean;
  game_active: boolean;
}

export const gameState: GameState = {
  difficulty: 'easy',
  level: 1,
  audio_enabled: true,
  animacoes_enabled: true,
  game_active: false,
};

export interface Question {
  expression: string;
  options: number[];
  correct_index: number;
  level: number;
}

export function loadRandomQuestion(difficulty: string, level: number): Question | null {
  const filepath = path.resolve(__dirname, '..', 'questions', `${difficulty}.json`);

  try {
    const data = fs.readFileSync(filepath, 'utf-8');
    const allQuestions: Question[] = JSON.parse(data);

    const levelQuestions = allQuestions.filter((q) => q.level === level);
    
    if (levelQuestions.length > 0) {
      const randomIndex = Math.floor(Math.random() * levelQuestions.length);
      return levelQuestions[randomIndex];
    }
    
    return null;
  } catch (error) {
    console.error(`Erro: Arquivo não encontrado ou erro de leitura em ${filepath}`, error);
    return null;
  }
}
