import { WS_PORT } from "./config";
import { wsManager } from "./websocket";
import { initSerial, sendToFPGA } from "./serial";
import { gameState, loadRandomQuestion } from "./gameLogic";

function initBackend() {
  console.log("Starting Numonautas Backend...");

  // Start WS Manager
  wsManager.init(WS_PORT);

  // Setup client response actions (like when frontend says REQUEST_NEXT_QUESTION)
  wsManager.onClientMessage = (data: any) => {
    if (data.type === "REQUEST_NEXT_QUESTION") {
      // 1. Se já completamos as 15 fases, finaliza o jogo!
      if (gameState.level >= 15) {
        console.log(
          "[Ação] Vitória! 15 fases concluídas. Retornando à tela inicial.",
        );
        gameState.game_active = false;
        gameState.level = 1;
        // resetPlayedQuestions(); // Chama a função para limpar a memória de questões

        wsManager.broadcast({
          type: "GAME_STARTED",
          state: "start",
          first_question: null,
        });
        return;
      }

      // 2. AVANÇA O NÍVEL AQUI! Sincronizado com o fim da animação do React.
      gameState.level++;
      console.log(
        `[Ação] Avançando para a fase ${gameState.level} sob comando do React.`,
      );

      // 3. Sorteia a questão, manda pro React e o Gabarito pra FPGA
      const q = loadRandomQuestion(gameState.difficulty, gameState.level);
      if (q) {
        wsManager.broadcast({
          type: "NEW_QUESTION",
          question: q,
        });
        sendToFPGA(1 << q.correct_index);
      }
    }
    // ... restante (START_GAME, ANSWER_SELECTED, etc)
    // Handle mock start via WS
    else if (data.type === "START_GAME") {
      gameState.game_active = true;
      gameState.level = 1;
      const q = loadRandomQuestion(gameState.difficulty, gameState.level);
      if (q) {
        wsManager.broadcast({
          type: "GAME_STARTED",
          state: "playing",
          first_question: q,
        });
        sendToFPGA(1 << q.correct_index);
      }
    }
    // Handle mock answer via WS
    else if (data.type === "ANSWER_SELECTED") {
      wsManager.broadcast({ type: "ANSWER_SELECTED", index: data.index });
    }
  };

  // Start Serial Hardware polling
  initSerial().catch(console.error);
}

initBackend();
