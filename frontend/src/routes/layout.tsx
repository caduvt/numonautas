import { Outlet } from "react-router-dom";
import { GameProvider } from "../context/GameContext";
import { useGameHardware } from "../hooks/useGameHardware";

function HardwareInitializer({ children }: { children: React.ReactNode }) {
  // Hook mounting initializes WebSocket
  useGameHardware();
  return <>{children}</>;
}

export function Layout() {
  return (
    <GameProvider>
      <HardwareInitializer>
        <div className="min-h-screen bg-slate-900 text-slate-100 font-nunito overflow-hidden selection:bg-indigo-500/30">
          {/* New Image Background with blur and darken overlays */}
          <div
            className="fixed inset-0 z-0 pointer-events-none bg-cover bg-center scale-[1.05] filter blur-xs opacity-50 transition-opacity duration-[2s]"
            style={{ backgroundImage: "url('/805180.jpg')" }}
          ></div>
          <div className="fixed inset-0 z-1 pointer-events-none bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-900/40 via-slate-900/80 to-black"></div>

          <div className="relative z-10 min-h-screen">
            <Outlet />
          </div>
        </div>
      </HardwareInitializer>
    </GameProvider>
  );
}
