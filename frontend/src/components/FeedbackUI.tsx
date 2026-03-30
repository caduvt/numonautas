import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { Star } from "lucide-react";
import { motion } from "framer-motion";

interface FeedbackUIProps {
  isCorrect: boolean | null;
  audioEnabled: boolean;
  animacoesEnabled: boolean;
  onContinue: () => void;
}

export function FeedbackUI({ isCorrect, audioEnabled, animacoesEnabled, onContinue }: FeedbackUIProps) {
  const [show, setShow] = useState<boolean>(false);

  useEffect(() => {
    if (isCorrect === null) {
      setShow(false);
      return;
    }

    setShow(true);

    if (isCorrect) {
      if (animacoesEnabled) {
        // Trigger subtle confetti
        const defaults = {
          origin: { y: 0.7 },
          colors: ['#818CF8', '#A78BFA', '#C084FC', '#F472B6', '#38BDF8'], // Soft palette
          ticks: 200,
        };

        fire(0.25, { spread: 26, startVelocity: 45, ...defaults });
        fire(0.2, { spread: 60, ...defaults });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, ...defaults });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, ...defaults });
        fire(0.1, { spread: 120, startVelocity: 45, ...defaults });
      }

      if (audioEnabled) {
        // play soft chime sound (mock for now)
        // new Audio('/sounds/success_chime.mp3').play();
      }

      // Auto continue after success
      const timer = setTimeout(() => {
        onContinue();
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      // Wrong answer
      if (audioEnabled) {
        // play gentle pop sound (no buzzer)
        // new Audio('/sounds/gentle_pop.mp3').play();
      }
    }
  }, [isCorrect, audioEnabled, onContinue]);

  function fire(particleRatio: number, opts: any) {
    confetti(Object.assign({}, opts, {
      particleCount: Math.floor(100 * particleRatio)
    }));
  }

  if (!show) return null;

  return (
    <div className={`fixed inset-0 z-50 pointer-events-none flex items-center justify-center transition-opacity duration-500 ease-in-out`}>
      {isCorrect && (
        <motion.div 
          initial={animacoesEnabled ? { opacity: 0, y: 18 } : { opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-indigo-900/40 backdrop-blur-sm border border-indigo-400/30 rounded-3xl p-8 flex flex-col items-center shadow-[0_0_40px_rgba(99,102,241,0.3)]"
        >
          <div className="relative mb-4">
            <motion.div
              animate={animacoesEnabled ? { scale: [1, 1.15, 1], opacity: [1, 0.8, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Star className="text-yellow-300 w-16 h-16" fill="currentColor" />
            </motion.div>
            <div className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full"></div>
          </div>
          <h2 className="text-3xl font-bold text-indigo-100 font-nunito tracking-wide astro-title">
            MUITO BEM!
          </h2>
          <p className="text-indigo-200 mt-2 font-nunito text-lg">
            Avançando na expedição...
          </p>
        </motion.div>
      )}
    </div>
  );
}
