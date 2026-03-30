import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGameContext } from "../context/GameContext";
import { useGameHardware } from "../hooks/useGameHardware";
import { Volume2, VolumeX, Settings, Play, Sparkles } from "lucide-react";
import { SpaceAvatar } from "../components/SpaceAvatar";
import { motion } from "framer-motion";

export function StartScreen() {
  const { gameState, config, wsConnected } = useGameContext();
  const navigate = useNavigate();
  const { mockStartGame } = useGameHardware(); // only for dev

  useEffect(() => {
    if (gameState === "playing") {
      navigate("/game");
    }
  }, [gameState, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen relative p-4">
      <div className="text-center z-10 astro-title mb-8 lg:mb-12">
        <motion.h1 
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          className="text-7xl md:text-9xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-br from-indigo-200 via-purple-100 to-indigo-400 drop-shadow-[0_0_20px_rgba(167,139,250,0.5)]"
        >
          Numonautas
        </motion.h1>
        <p className="text-2xl mt-4 text-indigo-200/80 font-nunito tracking-wide">
          Aventura Espacial Matemática
        </p>
      </div>

      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 relative z-10 items-center px-4">
        
        {/* Left Column: Settings */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4 mb-2 lg:mb-4">
            <Settings className="text-indigo-400 w-8 h-8 animate-spin-slow drop-shadow-lg" />
            <h2 className="text-3xl lg:text-4xl font-bold text-indigo-100 astro-title drop-shadow-md">Parâmetros da Missão</h2>
          </div>

          <div className="bg-slate-800/40 backdrop-blur-lg rounded-[2rem] p-6 lg:p-8 border-2 border-slate-600/30 shadow-[0_0_30px_rgba(30,27,75,0.6)] flex flex-col gap-6 w-full">
            {/* Box 1: Dificuldade */}
            <div className="bg-slate-800/60 rounded-2xl p-6 flex items-center justify-between border border-slate-700/50 hover:bg-slate-700/40 transition-colors">
              <span className="text-slate-300 font-semibold font-nunito text-xl lg:text-2xl">Dificuldade</span>
              <span className="px-6 py-2 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border-2 border-indigo-500/30 uppercase tracking-widest text-lg lg:text-xl astro-title shadow-inner">
                {config.difficulty === 'easy' ? 'Fácil' : config.difficulty === 'medium' ? 'Médio' : 'Difícil'}
              </span>
            </div>

            {/* Box 2: Áudio */}
            <div className="bg-slate-800/60 rounded-2xl p-6 flex items-center justify-between border border-slate-700/50 hover:bg-slate-700/40 transition-colors">
              <span className="text-slate-300 font-semibold font-nunito text-xl lg:text-2xl">Sons do Espaço</span>
              <div className={`p-4 rounded-xl transition-all duration-500 transform scale-125 ${config.audio_enabled ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-rose-500/20 text-rose-500 border-2 border-rose-500/30'}`}>
                {config.audio_enabled ? <Volume2 size={28} /> : <VolumeX size={28} />}
              </div>
            </div>

            {/* Box 3: FX */}
            <div className="bg-slate-800/60 rounded-2xl p-6 flex items-center justify-between border border-slate-700/50 hover:bg-slate-700/40 transition-colors">
              <span className="text-slate-300 font-semibold font-nunito text-xl lg:text-2xl">Efeitos Especiais</span>
              <div className={`p-4 rounded-xl transition-all duration-500 transform scale-125 ${config.animacoes_enabled ? 'bg-purple-500/20 text-purple-400 border-2 border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'bg-slate-700/40 text-slate-500 border-2 border-slate-600/30'}`}>
                <Sparkles size={28} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Astronaut */}
        <div className="mt-36 flex flex-col items-center justify-center gap-12 lg:gap-16">
          <div className="mt-8 mb-4">
             <SpaceAvatar status="idle" scale={2.5} />
          </div>

          <div className="mt-16 w-full flex justify-center">
            {wsConnected ? (
              <p className="text-indigo-100 font-nunito text-xl lg:text-2xl animate-pulse tracking-widest text-center bg-indigo-900/40 px-8 py-4 rounded-full border border-indigo-400/30 shadow-xl backdrop-blur-sm w-full max-w-lg">
                Pressione Iniciar no painel...
              </p>
            ) : (
               <div className="animate-pulse text-amber-300 bg-amber-500/15 px-8 py-4 rounded-full border border-amber-500/30 font-nunito font-bold text-xl lg:text-2xl shadow-[0_0_20px_rgba(245,158,11,0.2)] backdrop-blur-sm text-center w-full max-w-lg">
                 Comunicação com a nave... (WS)
               </div>
            )}
          </div>
          
          {/* DEV MODO START */}
          {
            !wsConnected && 
          <button 
            onClick={mockStartGame}
            className="mt-2 px-6 py-2 rounded-full bg-indigo-600/80 hover:bg-indigo-500 text-white font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-2 text-sm shadow-[0_0_15px_rgba(79,70,229,0.5)] border border-indigo-400/50"
          >
            <Play size={16} />
            Iniciar (Dev Mode)
          </button>
          }
        </div>
      </div>
    </div>
  );
}
