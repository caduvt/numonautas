/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import useSound from "use-sound";

interface FeedbackUIProps {
  isCorrect: boolean | null;
  audioEnabled: boolean;
  animacoesEnabled: boolean;
  currentLevel: number; // Precisamos saber em qual fase estamos (1 a 15)
  onContinue: () => void;
}

export function FeedbackUI({
  isCorrect,
  audioEnabled,
  animacoesEnabled,
  currentLevel,
  onContinue,
}: FeedbackUIProps) {
  const [showFinaleCard, setShowFinaleCard] = useState<boolean>(false);
  const [playSuccess] = useSound("/sounds/success.mp3", { volume: 0.5 });

  useEffect(() => {
    // 1. O usuário ainda não respondeu, reseta tudo e sai.
    if (isCorrect === null) {
      setShowFinaleCard(false);
      return;
    }

    if (isCorrect === true) {
      // É a última fase? (Vitória Final)
      const isFinalPhase = currentLevel === 15;

      // Se for a última fase, mostramos o Card de Vitória (independente das animações estarem ON ou OFF)
      if (isFinalPhase) {
        setShowFinaleCard(true);
      }

      // Soltamos confetes apenas se as animações estiverem ativadas
      if (animacoesEnabled) {
        const defaults = {
          origin: { y: 0.7 },
          colors: ["#818CF8", "#A78BFA", "#C084FC", "#F472B6", "#38BDF8"],
          ticks: 200,
        };

        // eslint-disable-next-line react-hooks/immutability
        fire(0.25, { spread: 26, startVelocity: 45, ...defaults });
        fire(0.2, { spread: 60, ...defaults });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, ...defaults });
        if (isFinalPhase) {
          // Mais confetes na vitória final!
          fire(0.1, {
            spread: 120,
            startVelocity: 25,
            decay: 0.92,
            scalar: 1.2,
            ...defaults,
          });
          fire(0.1, { spread: 120, startVelocity: 45, ...defaults });
        }
      }

      // Toca o som de acerto se o áudio estiver ativado
      if (audioEnabled) {
        playSuccess();
      }

      // Tempo de transição: demoramos um pouco mais para admirar a tela de vitória final
      const waitTime = isFinalPhase ? 5000 : 2500;

      const timer = setTimeout(() => {
        onContinue();
      }, waitTime);
      return () => clearTimeout(timer);
    }
  }, [
    isCorrect,
    audioEnabled,
    onContinue,
    animacoesEnabled,
    currentLevel,
    playSuccess,
  ]);

  function fire(particleRatio: number, opts: any) {
    confetti(
      Object.assign({}, opts, {
        particleCount: Math.floor(100 * particleRatio),
      }),
    );
  }

  // O componente visual do "Muito Bem!" agora só renderiza se o state autorizar (fase 15)
  if (!showFinaleCard) return null;

  return (
    <div
      className={`fixed inset-0 z-50 pointer-events-none flex items-center justify-center transition-opacity duration-500 ease-in-out`}
    >
      <motion.div
        initial={
          animacoesEnabled
            ? { opacity: 0, y: 18, scale: 0.8 }
            : { opacity: 1, y: 0, scale: 1 }
        }
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-indigo-900/80 backdrop-blur-md border-2 border-indigo-400/50 rounded-3xl p-12 flex flex-col items-center shadow-[0_0_80px_rgba(99,102,241,0.6)]"
      >
        <div className="relative mb-6">
          <motion.div
            animate={
              animacoesEnabled
                ? { scale: [1, 1.2, 1], opacity: [1, 0.9, 1] }
                : {}
            }
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Star className="text-yellow-300 w-24 h-24" fill="currentColor" />
          </motion.div>
          <div className="absolute inset-0 bg-yellow-400/30 blur-2xl rounded-full"></div>
        </div>
        <h2 className="text-5xl font-bold text-white font-nunito tracking-wide astro-title drop-shadow-lg">
          MUITO BEM!
        </h2>
        <p className="text-indigo-200 mt-4 font-nunito text-2xl bg-indigo-950/50 px-6 py-2 rounded-full border border-indigo-400/20">
          Expedição Numonauta Concluída!
        </p>
      </motion.div>
    </div>
  );
}
