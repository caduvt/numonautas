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
        // Play soft incorrect feedback if desired?
      }
    } else {
      setIsCorrect(null);
    }
  }, [selectedAnswerIndex, currentQuestion]);

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
    <div className="flex flex-col min-h-screen relative p-4 lg:p-12 overflow-hidden">
      <FeedbackUI
        isCorrect={isCorrect}
        audioEnabled={config.audio_enabled}
        animacoesEnabled={config.animacoes_enabled}
        onContinue={handleContinue}
      />

      {/* Main Grid Layout */}
      <div className="flex-1 max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8 relative z-10 items-center">
        {/* Left Column: Avatar & Controls */}
        <div className="flex flex-col items-center justify-center gap-8 bg-slate-800/20 backdrop-blur-md rounded-[3rem] p-8 border border-white/5 shadow-2xl">
          <SpaceAvatar status={getAvatarStatus()} />

          <div className="text-center font-nunito mt-4">
            <h2 className="text-xl text-indigo-200/80 mb-2">
              Comandante Numonauta
            </h2>
            <p className="text-sm px-4 py-2 bg-indigo-900/50 rounded-full text-indigo-100/90 border border-indigo-500/30">
              Expedição Exploratória Ativa
            </p>
          </div>
        </div>

        {/* Right Column: Game Board */}
        <div className="flex flex-col h-full bg-slate-800/30 backdrop-blur-lg rounded-[3rem] p-8 lg:p-16 border border-indigo-400/10 shadow-[0_0_50px_rgba(30,27,75,0.5)]">
          {/* Question Display */}
          <div className="flex-1 flex items-center justify-center bg-indigo-950/40 rounded-3xl border border-indigo-500/20 p-8 mb-8 shadow-inner shadow-indigo-950/80">
            <h1 className="text-6xl md:text-8xl font-bold tracking-wider text-center text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] astro-title">
              {currentQuestion.expression}
            </h1>
          </div>

          {/* Options Display */}
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswerIndex === index;
              const isCorrectOption = index === currentQuestion.correct_index;

              // ASD Friendly Correction Logic
              // If wrong was selected, softly highlight the correct option without harsh colors
              const wrongFeedback = isCorrect === false;

              let classes =
                "relative overflow-hidden transition-all duration-300 ease-out transform ";

              if (wrongFeedback) {
                if (isSelected) {
                  // Gently fade the selected wrong answer instead of a stark X or red
                  classes +=
                    "bg-slate-700/30 border-slate-600/30 text-slate-400 opacity-60 ";
                } else if (isCorrectOption) {
                  // Softly highlight the right one
                  classes += `bg-indigo-600/40 border-indigo-400/60 text-indigo-100 shadow-[0_0_20px_rgba(99,102,241,0.4)] ring-2 ring-indigo-300/50 ${
                    config.animacoes_enabled ? "animate-pulse" : ""
                  } `;
                } else {
                  classes +=
                    "bg-slate-800/40 border-indigo-500/20 text-indigo-100/70 ";
                }
              } else if (isSelected && isCorrect === true) {
                classes +=
                  "bg-emerald-500/80 border-emerald-400 text-white shadow-[0_0_30px_rgba(16,185,129,0.5)] scale-105 ";
              } else {
                classes +=
                  "bg-indigo-900/40 hover:bg-indigo-800/60 border-indigo-400/30 hover:border-indigo-400/60 text-indigo-50 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:-translate-y-1 ";
              }

              // Configuração do "Shake" do botão errado
              // Para mudar a intensidade do shake, altere os valores do array 'x' abaixo.
              // Para mudar a frequência (velocidade), modifique o 'duration' em 'transition'.
              const buttonShakeConfig = {
                x: [-8, 8, -6, 6, -4, 4, 0], 
                transition: { duration: 0.4, ease: "easeInOut" as const }
              };

              return (
                <motion.button
                  key={index}
                  onClick={() => mockAnswer(index)} // Allow overriding state on click for Dev mostly
                  disabled={isCorrect !== null} // Disable while showing feedback
                  animate={wrongFeedback && isSelected && config.animacoes_enabled ? { x: buttonShakeConfig.x } : { x: 0 }}
                  transition={wrongFeedback && isSelected && config.animacoes_enabled ? buttonShakeConfig.transition : {}}
                  className={`
                    flex items-center justify-center p-6 md:p-8 rounded-2xl border-2 
                    text-4xl md:text-5xl font-bold font-nunito tracking-wide
                    ${classes}
                  `}
                >
                  <span className="relative z-10">{option}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Correction helper text */}
          {isCorrect === false && (
            <motion.div
              initial={config.animacoes_enabled ? { opacity: 0, y: 10 } : { opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 text-center"
            >
              <p className="text-xl text-indigo-200/90 font-nunito bg-indigo-900/40 py-3 px-6 rounded-full inline-block border border-indigo-400/20">
                Hmm... vamos tentar uma nova rota. Aquela ali devia ser a
                correta! ✨
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
