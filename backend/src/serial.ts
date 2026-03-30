import { SerialPort } from 'serialport';
import { ByteLengthParser } from '@serialport/parser-byte-length';
import { getDefaultSerialPort, BAUD_RATE } from './config';
import { gameState, loadRandomQuestion } from './gameLogic';
import { wsManager } from './websocket';
import os from 'os';

export async function processSerialSignal(byte: number) {
  console.log(`\n[Serial] Signal byte received: 0x${byte.toString(16).toUpperCase()}`);

  const isGameEvent = (byte & 0x80) !== 0; // Bit 7

  if (!isGameEvent) {
    // Config Events (Bit 7 = 0)
    if (byte & 0x20) { // Reset (0x20)
      gameState.game_active = false;
      wsManager.broadcast({ type: "GAME_STARTED", state: "start", first_question: null });
    } else if (byte & 0x10) { // Start (0x10)
      gameState.game_active = true;
      gameState.level = 1;
      const question = loadRandomQuestion(gameState.difficulty, gameState.level);
      if (question) {
        wsManager.broadcast({ type: "GAME_STARTED", state: "playing", first_question: question });
      }
    } else if (byte & 0x08) { // Animações (0x08)
      gameState.animacoes_enabled = !gameState.animacoes_enabled;
      wsManager.broadcast({ type: "CONFIG_UPDATE", difficulty: gameState.difficulty, audio_enabled: gameState.audio_enabled, animacoes_enabled: gameState.animacoes_enabled });
    } else if (byte & 0x04) { // Dificuldade (0x04)
      const diffs: any[] = ['easy', 'medium', 'hard'];
      const idx = (diffs.indexOf(gameState.difficulty) + 1) % diffs.length;
      gameState.difficulty = diffs[idx];
      wsManager.broadcast({ type: "CONFIG_UPDATE", difficulty: gameState.difficulty, audio_enabled: gameState.audio_enabled, animacoes_enabled: gameState.animacoes_enabled });
    } else if (byte & 0x02) { // Som (0x02)
      gameState.audio_enabled = !gameState.audio_enabled;
      wsManager.broadcast({ type: "CONFIG_UPDATE", difficulty: gameState.difficulty, audio_enabled: gameState.audio_enabled, animacoes_enabled: gameState.animacoes_enabled });
    }
  } else {
    // Game Events (Bit 7 = 1)
    if ((byte & 0xC0) === 0xC0) { // Request next question (0xC0)
      // Usually trigger is handled by index.ts via REQUEST_NEXT_QUESTION or handled here directly
      // we'll let index.ts do it if we want, or just do it here:
      const q = loadRandomQuestion(gameState.difficulty, gameState.level);
      if (q) {
        wsManager.broadcast({ type: "NEW_QUESTION", question: q });
      }
    } else { // Answer selection (0x80 to 0x83)
      const optionIndex = byte & 0x7F; // Filter out top bit
      wsManager.broadcast({ type: "ANSWER_SELECTED", index: optionIndex });
    }
  }
}

export async function initSerial() {
  let portLocation = "";

  if (!portLocation) {
    // Dynamic port detection requested by user
    const ports = await SerialPort.list();
    console.log("[Serial] Detected available ports:", ports.map(p => p.path).join(', ') || 'None');
    
    // Look for generic USB mapping, specially FTDI / CH340 / CP210x boards often have specific manufacturer or paths.
    const platform = os.platform();
    const possiblePorts = ports.filter(p => {
       if (platform === 'linux' && p.path.includes('USB')) return true;
       if (platform === 'win32' && p.path.startsWith('COM')) return true;
       return false;
    });

    if (possiblePorts.length > 0) {
      portLocation = possiblePorts[0].path;
      console.log(`[Serial] dynamically selected port: ${portLocation}`);
    } else {
      portLocation = getDefaultSerialPort();
      console.log(`[Serial] Falling back to default OS port: ${portLocation}`);
    }
  }

  try {
    const port = new SerialPort({
      path: portLocation,
      baudRate: BAUD_RATE,
      dataBits: 8,
      stopBits: 1,
      parity: 'none'
    });

    const parser = port.pipe(new ByteLengthParser({ length: 1 }));

    port.on('open', () => {
      console.log(`[Serial] Successfully connected to FPGA at ${portLocation} @ ${BAUD_RATE} 8N1`);
    });

    parser.on('data', (data: Buffer) => {
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

  } catch (error) {
    console.error(`[Serial] Setup Error. Check cable permissions:`, error);
  }
}
