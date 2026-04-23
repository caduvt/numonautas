import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { GameState, GameConfig, Question } from "../types/game";
import useSound from "use-sound";

interface GameContextType {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  config: GameConfig;
  setConfig: (config: GameConfig) => void;
  currentQuestion: Question | null;
  setCurrentQuestion: (q: Question | null) => void;
  selectedAnswerIndex: number | null;
  setSelectedAnswerIndex: (i: number | null) => void;
  wsConnected: boolean;
  setWsConnected: (v: boolean) => void;
  hardwareStatus: "correct" | "wrong" | null;
  setHardwareStatus: (s: "correct" | "wrong" | null) => void;
}

const defaultContext: GameContextType = {
  gameState: "start",
  setGameState: () => {},
  config: { difficulty: "easy", audio_enabled: true, animacoes_enabled: true },
  setConfig: () => {},
  currentQuestion: null,
  setCurrentQuestion: () => {},
  selectedAnswerIndex: null,
  setSelectedAnswerIndex: () => {},
  wsConnected: false,
  setWsConnected: () => {},
  hardwareStatus: null,
  setHardwareStatus: () => {},
};

const GameContext = createContext<GameContextType>(defaultContext);

export const GameProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [gameState, setGameState] = useState<GameState>("start");
  const [config, setConfig] = useState<GameConfig>({
    difficulty: "easy",
    audio_enabled: true,
    animacoes_enabled: true,
  });
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(
    null,
  );
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [hardwareStatus, setHardwareStatus] = useState<
    "correct" | "wrong" | null
  >(null);

  // Música ambiente global da aplicação
  const [playAmbient, { pause: pauseAmbient }] = useSound(
    "/sounds/ambient.mp3",
    {
      loop: true,
      volume: 0.08,
    },
  );

  // Toca ou pausa o áudio baseado nas configurações recebidas pela placa
  useEffect(() => {
    // Tenta tocar a música se estiver habilitada
    if (config.audio_enabled) {
      playAmbient();
    } else {
      pauseAmbient();
    }

    // DESBLOQUEIO DE AUTOPLAY: Se o navegador bloquear, o primeiro clique na tela libera a música
    const unlockAudio = () => {
      if (config.audio_enabled) {
        playAmbient();
      }
      window.removeEventListener("click", unlockAudio);
    };
    window.addEventListener("click", unlockAudio);

    return () => window.removeEventListener("click", unlockAudio);
  }, [config.audio_enabled, playAmbient, pauseAmbient]);

  return (
    <GameContext.Provider
      value={{
        gameState,
        setGameState,
        config,
        setConfig,
        currentQuestion,
        setCurrentQuestion,
        selectedAnswerIndex,
        setSelectedAnswerIndex,
        wsConnected,
        setWsConnected,
        hardwareStatus,
        setHardwareStatus,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useGameContext = () => useContext(GameContext);
