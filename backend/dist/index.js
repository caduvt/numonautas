"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const websocket_1 = require("./websocket");
const serial_1 = require("./serial");
const gameLogic_1 = require("./gameLogic");
function initBackend() {
    console.log("Starting Numonautas Backend...");
    // Start WS Manager
    websocket_1.wsManager.init(config_1.WS_PORT);
    // Setup client response actions (like when frontend says REQUEST_NEXT_QUESTION)
    websocket_1.wsManager.onClientMessage = (data) => {
        if (data.type === 'REQUEST_NEXT_QUESTION') {
            const q = (0, gameLogic_1.loadRandomQuestion)(gameLogic_1.gameState.difficulty, gameLogic_1.gameState.level);
            if (q) {
                websocket_1.wsManager.broadcast({
                    type: "NEW_QUESTION",
                    question: q
                });
            }
        }
        // Handle mock start via WS
        else if (data.type === 'START_GAME') {
            gameLogic_1.gameState.game_active = true;
            gameLogic_1.gameState.level = 1;
            const q = (0, gameLogic_1.loadRandomQuestion)(gameLogic_1.gameState.difficulty, gameLogic_1.gameState.level);
            if (q) {
                websocket_1.wsManager.broadcast({
                    type: "GAME_STARTED",
                    state: "playing",
                    first_question: q
                });
            }
        }
        // Handle mock answer via WS
        else if (data.type === 'ANSWER_SELECTED') {
            websocket_1.wsManager.broadcast({ type: "ANSWER_SELECTED", index: data.index });
        }
    };
    // Start Serial Hardware polling
    (0, serial_1.initSerial)().catch(console.error);
}
initBackend();
