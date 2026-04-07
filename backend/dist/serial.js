"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processSerialSignal = processSerialSignal;
exports.initSerial = initSerial;
const serialport_1 = require("serialport");
const parser_byte_length_1 = require("@serialport/parser-byte-length");
const config_1 = require("./config");
const gameLogic_1 = require("./gameLogic");
const websocket_1 = require("./websocket");
const os_1 = __importDefault(require("os"));
async function processSerialSignal(byte) {
    console.log(`\n[Serial] Signal byte received: 0x${byte.toString(16).toUpperCase()}`);
    const isGameEvent = (byte & 0x80) !== 0; // Bit 7
    if (!isGameEvent) {
        // Config Events (Bit 7 = 0)
        if (byte & 0x20) { // Reset (0x20)
            gameLogic_1.gameState.game_active = false;
            websocket_1.wsManager.broadcast({ type: "GAME_STARTED", state: "start", first_question: null });
        }
        else if (byte & 0x10) { // Start (0x10)
            gameLogic_1.gameState.game_active = true;
            gameLogic_1.gameState.level = 1;
            const question = (0, gameLogic_1.loadRandomQuestion)(gameLogic_1.gameState.difficulty, gameLogic_1.gameState.level);
            if (question) {
                websocket_1.wsManager.broadcast({ type: "GAME_STARTED", state: "playing", first_question: question });
            }
        }
        else if (byte & 0x08) { // Animações (0x08)
            gameLogic_1.gameState.animacoes_enabled = !gameLogic_1.gameState.animacoes_enabled;
            websocket_1.wsManager.broadcast({ type: "CONFIG_UPDATE", difficulty: gameLogic_1.gameState.difficulty, audio_enabled: gameLogic_1.gameState.audio_enabled, animacoes_enabled: gameLogic_1.gameState.animacoes_enabled });
        }
        else if (byte & 0x04) { // Dificuldade (0x04)
            const diffs = ['easy', 'medium', 'hard'];
            const idx = (diffs.indexOf(gameLogic_1.gameState.difficulty) + 1) % diffs.length;
            gameLogic_1.gameState.difficulty = diffs[idx];
            websocket_1.wsManager.broadcast({ type: "CONFIG_UPDATE", difficulty: gameLogic_1.gameState.difficulty, audio_enabled: gameLogic_1.gameState.audio_enabled, animacoes_enabled: gameLogic_1.gameState.animacoes_enabled });
        }
        else if (byte & 0x02) { // Som (0x02)
            gameLogic_1.gameState.audio_enabled = !gameLogic_1.gameState.audio_enabled;
            websocket_1.wsManager.broadcast({ type: "CONFIG_UPDATE", difficulty: gameLogic_1.gameState.difficulty, audio_enabled: gameLogic_1.gameState.audio_enabled, animacoes_enabled: gameLogic_1.gameState.animacoes_enabled });
        }
    }
    else {
        // Game Events (Bit 7 = 1)
        if ((byte & 0xC0) === 0xC0) { // Request next question (0xC0)
            // Usually trigger is handled by index.ts via REQUEST_NEXT_QUESTION or handled here directly
            // we'll let index.ts do it if we want, or just do it here:
            const q = (0, gameLogic_1.loadRandomQuestion)(gameLogic_1.gameState.difficulty, gameLogic_1.gameState.level);
            if (q) {
                websocket_1.wsManager.broadcast({ type: "NEW_QUESTION", question: q });
            }
        }
        else { // Answer selection (0x80 to 0x83)
            const optionIndex = byte & 0x7F; // Filter out top bit
            websocket_1.wsManager.broadcast({ type: "ANSWER_SELECTED", index: optionIndex });
        }
    }
}
async function initSerial() {
    let portLocation = "";
    if (!portLocation) {
        // Dynamic port detection requested by user
        const ports = await serialport_1.SerialPort.list();
        console.log("[Serial] Detected available ports:", ports.map(p => p.path).join(', ') || 'None');
        // Look for generic USB mapping, specially FTDI / CH340 / CP210x boards often have specific manufacturer or paths.
        const platform = os_1.default.platform();
        const possiblePorts = ports.filter(p => {
            if (platform === 'linux' && p.path.includes('USB'))
                return true;
            if (platform === 'win32' && p.path.startsWith('COM'))
                return true;
            return false;
        });
        if (possiblePorts.length > 0) {
            portLocation = possiblePorts[0].path;
            console.log(`[Serial] dynamically selected port: ${portLocation}`);
        }
        else {
            portLocation = (0, config_1.getDefaultSerialPort)();
            console.log(`[Serial] Falling back to default OS port: ${portLocation}`);
        }
    }
    try {
        const port = new serialport_1.SerialPort({
            path: portLocation,
            baudRate: config_1.BAUD_RATE,
            dataBits: 8,
            stopBits: 1,
            parity: 'none'
        });
        const parser = port.pipe(new parser_byte_length_1.ByteLengthParser({ length: 1 }));
        port.on('open', () => {
            console.log(`[Serial] Successfully connected to FPGA at ${portLocation} @ ${config_1.BAUD_RATE} 8N1`);
        });
        parser.on('data', (data) => {
            if (data.length > 0) {
                processSerialSignal(data[0]);
            }
        });
        port.on('error', (err) => {
            console.error(`[Serial] Port Error:`, err.message);
        });
        port.on('close', () => {
            console.warn(`[Serial] Port Closed. Retrying in 3 seconds...`);
            setTimeout(initSerial, 3000); // Reconnection logic
        });
    }
    catch (error) {
        console.error(`[Serial] Setup Error. Check cable permissions:`, error);
    }
}
