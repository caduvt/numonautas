import { SerialPort } from 'serialport';
import { ByteLengthParser } from '@serialport/parser-byte-length';
import { getDefaultSerialPort, BAUD_RATE } from './config';
import { gameState, loadRandomQuestion } from './gameLogic';
import { wsManager } from './websocket';
import os from 'os';

export let activeSerialPort: SerialPort | null = null;

export function sendToFPGA(byte: number) {
  if (activeSerialPort && activeSerialPort.isOpen) {
    console.log(`[Serial -> FPGA] Sending byte: 0x${byte.toString(16).toUpperCase()}`);
    activeSerialPort.write(Buffer.from([byte]));
  }
}

export async function processSerialSignal(byte: number) {
  console.log(`\n[FPGA -> Serial] Signal byte received: 0x${byte.toString(16).padStart(2, '0').toUpperCase()}`);

  // Decode FPGA packet
  const somEnabled = (byte & 0x80) !== 0;       // Bit 7
  const animacoesEnabled = (byte & 0x40) !== 0; // Bit 6
  const difficultyBits = (byte >> 4) & 0x03;    // Bits 5:4
  const evento = byte & 0x0F;                   // Bits 3:0

  // Update Game State Configs
  gameState.audio_enabled = somEnabled;
  gameState.animacoes_enabled = animacoesEnabled;
  
  if (difficultyBits === 0) gameState.difficulty = 'easy';
  else if (difficultyBits === 1) gameState.difficulty = 'medium';
  else if (difficultyBits === 2) gameState.difficulty = 'hard';

  // Always broadcast config in case it changed
  wsManager.broadcast({ 
    type: "CONFIG_UPDATE", 
    difficulty: gameState.difficulty, 
    audio_enabled: gameState.audio_enabled, 
    animacoes_enabled: gameState.animacoes_enabled 
  });

  // Handle Eventos (Bits 3:0)
  switch (evento) {
    case 0x00: // Apenas Atualização de Configuração
      // Já manipulado acima pelo broadcast
      break;

    case 0x01: // Iniciar Jogo
      gameState.game_active = true;
      gameState.level = 1;
      const question = loadRandomQuestion(gameState.difficulty, gameState.level);
      if (question) {
        wsManager.broadcast({ type: "GAME_STARTED", state: "playing", first_question: question });
        // Enviar o gabarito para a FPGA imediatamente
        sendToFPGA(1 << question.correct_index);
      }
      break;

    case 0x02: // Pedir Próxima Fase
      gameState.level++;
      const nextQ = loadRandomQuestion(gameState.difficulty, gameState.level);
      if (nextQ) {
        wsManager.broadcast({ type: "NEW_QUESTION", question: nextQ });
        // Enviar gabarito da próxima fase
        sendToFPGA(1 << nextQ.correct_index);
      } else {
        // Se retornar undefined, provavel fim das questoes. Poderia sinalizar fim pro Frontend.
        // No momento apenas ignoramos (ou poderiamos enviar vitoria).
      }
      break;

    case 0x03: // Acertou a Questão
      wsManager.broadcast({ type: "ANSWER_SELECTED", status: "correct" }); // Adapte ao front
      break;

    case 0x04: // Errou a Questão
      wsManager.broadcast({ type: "ANSWER_SELECTED", status: "wrong" }); // Adapte ao front
      break;

    case 0x05: // Reset (Voltar Home)
      gameState.game_active = false;
      gameState.level = 1;
      wsManager.broadcast({ type: "GAME_STARTED", state: "start", first_question: null });
      break;
      
    default:
      console.warn(`[Serial] Evento não reconhecido: ${evento}`);
      break;
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
      activeSerialPort = port;
    });

    parser.on('data', (data: Buffer) => {
      if (data.length > 0) {
        processSerialSignal(data[0]);
      }
    });

    port.on('error', (err) => {
      console.error(`[Serial] Port Error:`, err.message);
      activeSerialPort = null;
    });

    port.on('close', () => {
      console.warn(`[Serial] Port Closed. Retrying in 3 seconds...`);
      activeSerialPort = null;
      setTimeout(initSerial, 3000); // Reconnection logic
    });

  } catch (error) {
    console.error(`[Serial] Setup Error. Check cable permissions:`, error);
  }
}
