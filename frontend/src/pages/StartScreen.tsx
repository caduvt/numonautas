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
      <div className="text-center z-10 astro-title mb-12">
        <motion.h1 
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          className="text-6xl md:text-8xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-br from-indigo-200 via-purple-100 to-indigo-400 drop-shadow-[0_0_20px_rgba(167,139,250,0.5)]"
        >
          Numonautas
        </motion.h1>
        <p className="text-xl md:text-2xl mt-4 text-indigo-200/80 font-nunito tracking-wide">
          Aventura Espacial Matemática
        </p>
      </div>

      <div className="bg-slate-800/40 backdrop-blur-md rounded-3xl p-8 max-w-md w-full border border-indigo-500/20 shadow-2xl relative z-10 mb-8">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Settings className="text-indigo-400 w-6 h-6 animate-spin-slow" />
          <h2 className="text-2xl font-bold text-indigo-100 astro-title">Missão Atual</h2>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-800/60 rounded-2xl p-4 flex items-center justify-between border border-slate-700/50">
            <span className="text-slate-300 font-semibold font-nunito text-lg">Dificuldade</span>
            <span className="px-4 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30 uppercase tracking-wider text-sm astro-title">
              {config.difficulty === 'easy' ? 'Fácil' : config.difficulty === 'medium' ? 'Médio' : 'Difícil'}
            </span>
          </div>

          <div className="bg-slate-800/60 rounded-2xl p-4 flex items-center justify-between border border-slate-700/50">
            <span className="text-slate-300 font-semibold font-nunito text-lg">Sons do Espaço</span>
            <div className={`p-2 rounded-xl transition-colors duration-500 ${config.audio_enabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
              {config.audio_enabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-2xl p-4 flex items-center justify-between border border-slate-700/50">
            <span className="text-slate-300 font-semibold font-nunito text-lg">Efeitos Especiais</span>
            <div className={`p-2 rounded-xl transition-colors duration-500 ${config.animacoes_enabled ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-slate-600/20 text-slate-500 border border-slate-600/30'}`}>
              <Sparkles size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="z-10 flex flex-col items-center gap-4">
        <div className="flex flex-col items-center">
          <div className="mb-6 transform scale-75 md:scale-100">
             <SpaceAvatar status="idle" />
          </div>
          {wsConnected ? (
            <p className="text-indigo-200/80 font-nunito text-lg animate-pulse tracking-wide text-center">
              Pressione o botão de Iniciar no painel...
            </p>
          ) : (
             <div className="animate-pulse text-amber-300/80 bg-amber-500/10 px-6 py-3 rounded-full border border-amber-500/20 font-nunito font-bold">
               Estabelecendo comunicação com a nave... (Conectando WS)
             </div>
          )}
          {/* DEV MODO START */}
          <button 
            onClick={mockStartGame}
            className="mt-6 px-6 py-2 rounded-full bg-indigo-600/80 hover:bg-indigo-500 text-white font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-2 text-sm shadow-[0_0_15px_rgba(79,70,229,0.5)] border border-indigo-400/50"
          >
            <Play size={16} />
            Iniciar (Dev Mode)
          </button>
        </div>
      </div>
    </div>
  );
}
