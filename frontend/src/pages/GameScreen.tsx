/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { useGameContext } from "../context/GameContext";
import { useGameHardware } from "../hooks/useGameHardware";
import { useNavigate } from "react-router-dom";
import { FeedbackUI } from "../components/FeedbackUI";
import { SpaceAvatar } from "../components/SpaceAvatar";
import { motion } from "framer-motion";

export function GameScreen() {
  const { gameState, currentQuestion, selectedAnswerIndex, config } =
    useGameContext();
  const { requestNextQuestion, mockAnswer } = useGameHardware();
  const navigate = useNavigate();

  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // If we go back to start state or not playing, return to start
  useEffect(() => {
    if (gameState !== "playing") {
      navigate("/");
    }
  }, [gameState, navigate]);

  // Evaluate the answer when there's a selection via FPGA (or mock button)
  useEffect(() => {
    if (selectedAnswerIndex !== null && currentQuestion) {
      if (selectedAnswerIndex === currentQuestion.correct_index) {
        setIsCorrect(true);
      } else {
        setIsCorrect(false);
      }
    } else {
      setIsCorrect(null);
    }
  }, [selectedAnswerIndex, currentQuestion, config.audio_enabled]);

  const handleContinue = () => {
    setIsCorrect(null);
    requestNextQuestion();
  };

  const getAvatarStatus = () => {
    if (isCorrect === true) return "happy";
    if (isCorrect === false) return "surprised";
    return "thinking";
  };

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center text-indigo-200 astro-title text-2xl animate-pulse">
        Carregando coordenadas...
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen relative p-2 md:p-6 overflow-hidden">
      <FeedbackUI
        isCorrect={isCorrect}
        audioEnabled={config.audio_enabled}
        animacoesEnabled={config.animacoes_enabled}
        onContinue={handleContinue}
      />

      {/* Main Grid Layout */}
      <div className="flex-1 w-full grid grid-cols-1 lg:grid-cols-[1fr_3.5fr] gap-4 md:gap-8 relative z-10 items-stretch">
        {/* Left Column: Avatar & Controls */}
        <div className="flex flex-col items-center justify-center gap-8 bg-slate-800/20 backdrop-blur-md rounded-[3rem] p-4 lg:p-8 border border-white/5 shadow-xl">
          <div className="transform scale-125 lg:scale-150 mb-8 mt-32 relative z-10">
            <SpaceAvatar status={getAvatarStatus()} scale={1.7} />
          </div>

          <div className="text-center font-nunito mt-32">
            <h2 className="text-2xl md:text-3xl font-bold text-indigo-200/80 mb-3 drop-shadow-md">
              Comandante Numonauta
            </h2>
            <p className="text-lg md:text-xl px-6 py-3 bg-indigo-900/50 rounded-full text-indigo-100/90 border border-indigo-500/30 shadow-inner">
              Expedição Exploratória Ativa
            </p>
          </div>
        </div>

        {/* Right Column: Game Board */}
        <div className="flex flex-col h-full bg-slate-800/30 backdrop-blur-lg rounded-[3rem] p-6 lg:p-10 border border-indigo-400/10 shadow-[0_0_50px_rgba(30,27,75,0.5)]">
          {/* Question Display */}
          <div className="flex-1 flex items-center justify-center bg-indigo-950/40 rounded-3xl border border-indigo-500/20 p-8 mb-8 shadow-inner shadow-indigo-950/80 min-h-[35vh]">
            <h1 className="text-8xl md:text-[8rem] lg:text-[12rem] font-bold tracking-wider text-center text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] astro-title leading-none">
              {currentQuestion.expression}
            </h1>
          </div>

          {/* Options Display */}
          <div className="flex w-full gap-4 md:gap-6 min-h-[15vh]">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswerIndex === index;
              const isCorrectOption = index === currentQuestion.correct_index;

              // ASD Friendly Correction Logic
              const wrongFeedback = isCorrect === false;

              let classes =
                "relative flex-1 overflow-hidden transition-all duration-300 ease-out transform ";

              // Cores: Vermelho, Amarelo, Verde, Azul
              const colorClasses = [
                "bg-red-600 hover:bg-red-500 border-red-400 shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(239,68,68,0.6)] text-white hover:-translate-y-2 ",
                "bg-yellow-500 hover:bg-yellow-400 border-yellow-300 shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:shadow-[0_0_30px_rgba(250,204,21,0.6)] text-white hover:-translate-y-2 ",
                "bg-emerald-600 hover:bg-emerald-500 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(52,211,153,0.6)] text-white hover:-translate-y-2 ",
                "bg-blue-600 hover:bg-blue-500 border-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] text-white hover:-translate-y-2 ",
              ];

              if (wrongFeedback) {
                if (isSelected) {
                  // Gently fade the selected wrong answer
                  classes +=
                    "bg-slate-800/60 border-slate-700/50 text-slate-500 opacity-50 grayscale ";
                } else if (isCorrectOption) {
                  // Softly highlight the right one
                  classes += `${
                    colorClasses[index % 4]
                  } ring-4 ring-white/70 scale-105 ${
                    config.animacoes_enabled ? "animate-pulse" : ""
                  } `;
                } else {
                  classes +=
                    "bg-slate-800/60 border-slate-700/50 text-slate-400 opacity-60 grayscale ";
                }
              } else if (isSelected && isCorrect === true) {
                classes += `${
                  colorClasses[index % 4]
                } ring-8 ring-white scale-110 z-10 `;
              } else {
                classes += colorClasses[index % 4];
              }

              // Configuração do "Shake" do botão errado
              const buttonShakeConfig = {
                x: [-10, 10, -8, 8, -6, 6, 0],
                transition: { duration: 0.5, ease: "easeInOut" as const },
              };

              return (
                <motion.button
                  key={index}
                  onClick={() => mockAnswer(index)} // Allow overriding state on click for Dev mostly
                  disabled={isCorrect !== null} // Disable while showing feedback
                  animate={
                    wrongFeedback && isSelected && config.animacoes_enabled
                      ? { x: buttonShakeConfig.x }
                      : { x: 0 }
                  }
                  transition={
                    wrongFeedback && isSelected && config.animacoes_enabled
                      ? buttonShakeConfig.transition
                      : {}
                  }
                  className={`
                    flex items-center justify-center p-4 md:p-6 rounded-3xl border-4 
                    text-5xl md:text-[5rem] lg:text-[6rem] font-bold font-nunito tracking-widest min-w-[2rem]
                    ${classes}
                  `}
                >
                  <span className="relative z-10 drop-shadow-md">{option}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Correction helper text */}
          {isCorrect === false && (
            <motion.div
              initial={
                config.animacoes_enabled
                  ? { opacity: 0, y: 10 }
                  : { opacity: 1, y: 0 }
              }
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 text-center"
            >
              <p className="text-2xl lg:text-3xl text-indigo-100 font-nunito bg-slate-900/60 py-4 px-8 rounded-full inline-block border-2 border-indigo-400/30 shadow-xl backdrop-blur-sm">
                Vamos tentar uma outra rota! Talvez esta seja uma opção melhor!
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
