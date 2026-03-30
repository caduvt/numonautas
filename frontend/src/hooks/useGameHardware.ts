import { useEffect, useRef, useCallback } from "react";
import { useGameContext } from "../context/GameContext";
import type { WsMessage } from "../types/game";

export function useGameHardware() {
  const wsRef = useRef<WebSocket | null>(null);
  const {
    setGameState,
    setConfig,
    setCurrentQuestion,
    setSelectedAnswerIndex,
    setWsConnected,
  } = useGameContext();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    console.log("Connecting to WebSocket...");
    const ws = new WebSocket("ws://localhost:8000/ws");
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Connected to game hardware (WebSocket).");
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WsMessage;
        console.log("Received via WS:", data);

        switch (data.type) {
          case "CONFIG_UPDATE":
            setConfig({
              difficulty: data.difficulty,
              audio_enabled: data.audio_enabled,
              animacoes_enabled: data.animacoes_enabled,
            });
            break;
          case "GAME_STARTED":
            setGameState("playing");
            setCurrentQuestion(data.first_question);
            setSelectedAnswerIndex(null);
            break;
          case "ANSWER_SELECTED":
            // FPGA board sends answer index
            setSelectedAnswerIndex(data.index);
            break;
          case "NEW_QUESTION":
            setCurrentQuestion(data.question);
            setSelectedAnswerIndex(null);
            break;
        }
      } catch (err) {
        console.error("Failed to parse WS message", err);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected. Retrying in 3s...");
      setWsConnected(false);
      setTimeout(connect, 3000);
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      ws.close();
    };
  }, [
    setConfig,
    setGameState,
    setCurrentQuestion,
    setSelectedAnswerIndex,
    setWsConnected,
  ]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        // Remove onclose to prevent reconnection loops unmounting
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendAction = useCallback((action: { type: string; [key: string]: any }) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(action));
    }
  }, []);

  const requestNextQuestion = useCallback(() => {
    sendAction({ type: "REQUEST_NEXT_QUESTION" });
  }, [sendAction]);

  const mockStartGame = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      sendAction({ type: "START_GAME" });
    } else {
      // Offline fallback for testing UI
      setGameState("playing");
      setCurrentQuestion({
        expression: "5 + 3 =",
        options: [6, 7, 8, 9],
        correct_index: 2
      });
      setSelectedAnswerIndex(null);
    }
  }, [sendAction, setGameState, setCurrentQuestion, setSelectedAnswerIndex]);
  
  const mockAnswer = useCallback((index: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      sendAction({ type: "ANSWER_SELECTED", index });
    } else {
      // Offline fallback
      setSelectedAnswerIndex(index);
    }
  }, [sendAction, setSelectedAnswerIndex]);

  return {
    sendAction,
    requestNextQuestion,
    mockStartGame,
    mockAnswer,
  };
}
