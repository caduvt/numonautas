import { AstronautSvg } from "./AstronautSvg";
import { motion, type Variants } from "framer-motion";

interface SpaceAvatarProps {
  status?: 'idle' | 'happy' | 'thinking' | 'surprised';
}

export function SpaceAvatar({ status = 'idle' }: SpaceAvatarProps) {
  // Configurações do "Shake" (Tremor/Surpresa)
  // Para mudar a intensidade (o quão longe ele vai pro lado), aumente ou diminua os valores de 'x' no array.
  // Para mudar o quanto ele inclina, mexa no 'rotate'.
  // Para mudar a frequência (a rapidez do tremor), diminua a 'duration' em transition (quanto menor, mais rápido).
  const shakeIntensityX = 15; // Experimente 15 para um tremor mais forte
  const shakeRotation = 8; // Experimente 15 para girar mais

  const variants: Variants = {
    idle: {
      y: [0, -12, 0],
      rotate: 0,
      scale: 1,
      transition: { duration: 3.5, repeat: Infinity, ease: "easeInOut" }
    },
    happy: {
      y: [0, -15, 0],
      rotate: 0,
      scale: 1,
      transition: { duration: 0.6, repeat: Infinity, ease: "easeOut" }
    },
    thinking: {
      rotate: [-15, 15, -15],
      y: [0, -8, 0],
      scale: 1,
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
    },
    surprised: {
      x: [0, -shakeIntensityX, shakeIntensityX, -shakeIntensityX, 0],
      rotate: [0, -shakeRotation, shakeRotation, -shakeRotation, 0],
      scale: [1, 0.95, 0.95, 0.95, 1],
      y: 15,
      transition: { duration: 0.35, ease: "easeInOut" }
    }
  };

  const getShadowClass = () => {
    switch (status) {
      case 'happy': return 'drop-shadow-[0_0_20px_rgba(52,211,153,0.8)]';
      case 'thinking': return 'drop-shadow-[0_0_15px_rgba(96,165,250,0.6)]';
      case 'surprised': return 'drop-shadow-[0_0_35px_rgba(251,191,36,0.9)]';
      case 'idle':
      default: return 'drop-shadow-[0_0_15px_rgba(129,140,248,0.5)]';
    }
  };

  return (
    <div className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
      <motion.div
        variants={variants}
        animate={status}
        initial="idle"
        className={`w-full h-full transition-shadow duration-500 ${getShadowClass()}`}
      >
        <AstronautSvg className="w-full h-full text-indigo-100" />
      </motion.div>
    </div>
  );
}
