import React, { useEffect, useState } from 'react';

interface LevelIntroProps {
  floorNumber: number;
  floorName: string;
  onComplete: () => void;
  isEndless?: boolean;
}

export default function LevelIntro({ floorNumber, floorName, onComplete, isEndless = false }: LevelIntroProps) {
  const [visible, setVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Fade in shortly after mount
    const entryTimer = setTimeout(() => setVisible(true), 50);

    // Start fade out at 2.1 seconds
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 2100);

    // Complete at 2.5 seconds
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => {
      clearTimeout(entryTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/98 backdrop-blur-md transition-all duration-400 ease-out ${
        visible && !isExiting ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.02]'
      }`}
    >
      {/* Blueprint grid lines overlay inside intro */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(250,204,21,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(250,204,21,0.01)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

      <div className="max-w-2xl px-6 text-center space-y-6 z-10 font-mono">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 text-yellow-400 text-xs font-bold rounded-full uppercase tracking-widest animate-pulse">
          ⚡ SYSTEM INTRUSION DETECTED ⚡
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">
            Commencing Operation
          </h2>
          <h1 className="text-4xl md:text-6xl font-black text-slate-100 leading-none uppercase tracking-tight">
            {isEndless ? (
              <>Welcome to <span className="text-purple-400 block sm:inline">Endless Chaos</span></>
            ) : (
              <>Welcome to <span className="text-yellow-400 block sm:inline">Floor {floorNumber}</span></>
            )}
          </h1>
          <p className="text-xl md:text-2xl font-black text-amber-500 italic mt-2">
            — {isEndless ? "Infinite Office Panic" : floorName} —
          </p>
        </div>

        <div className="text-[10px] text-slate-500 uppercase tracking-widest pt-4">
          Loading office grid... Prepare to deploy paper airplanes
        </div>
      </div>
    </div>
  );
}
