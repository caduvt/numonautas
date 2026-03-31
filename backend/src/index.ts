import { WS_PORT } from './config';
import { wsManager } from './websocket';
import { initSerial, sendToFPGA } from './serial';
import { gameState, loadRandomQuestion } from './gameLogic';

function initBackend() {
  console.log("Starting Numonautas Backend...");

  // Start WS Manager
  wsManager.init(WS_PORT);

  // Setup client response actions (like when frontend says REQUEST_NEXT_QUESTION)
  wsManager.onClientMessage = (data: any) => {
    if (data.type === 'REQUEST_NEXT_QUESTION') {
      const q = loadRandomQuestion(gameState.difficulty, gameState.level);
      if (q) {
        wsManager.broadcast({
          type: "NEW_QUESTION",
          question: q
        });
        sendToFPGA(1 << q.correct_index);
      }
    }
    // Handle mock start via WS
    else if (data.type === 'START_GAME') {
      gameState.game_active = true;
      gameState.level = 1;
      const q = loadRandomQuestion(gameState.difficulty, gameState.level);
      if (q) {
        wsManager.broadcast({
          type: "GAME_STARTED",
          state: "playing",
          first_question: q
        });
        sendToFPGA(1 << q.correct_index);
      }
    }
    // Handle mock answer via WS
    else if (data.type === 'ANSWER_SELECTED') {
        wsManager.broadcast({ type: "ANSWER_SELECTED", index: data.index });
    }
  };

  // Start Serial Hardware polling
  initSerial().catch(console.error);
}

initBackend();
