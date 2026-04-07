"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameState = void 0;
exports.loadRandomQuestion = loadRandomQuestion;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
exports.gameState = {
    difficulty: 'easy',
    level: 1,
    audio_enabled: true,
    animacoes_enabled: true,
    game_active: false,
};
function loadRandomQuestion(difficulty, level) {
    const filepath = path_1.default.resolve(__dirname, '..', 'questions', `${difficulty}.json`);
    try {
        const data = fs_1.default.readFileSync(filepath, 'utf-8');
        const allQuestions = JSON.parse(data);
        const levelQuestions = allQuestions.filter((q) => q.level === level);
        if (levelQuestions.length > 0) {
            const randomIndex = Math.floor(Math.random() * levelQuestions.length);
            return levelQuestions[randomIndex];
        }
        return null;
    }
    catch (error) {
        console.error(`Erro: Arquivo não encontrado ou erro de leitura em ${filepath}`, error);
        return null;
    }
}
