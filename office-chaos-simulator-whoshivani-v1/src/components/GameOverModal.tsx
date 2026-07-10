import React, { useEffect, useState } from 'react';
import { RefreshCw, Home, Flame, AlertCircle, Sparkles } from 'lucide-react';
import { FIRED_REASONS, HATS, OUTFITS } from '../data';
import { soundManager } from '../utils/sound';

interface GameOverModalProps {
  score: number;
  highScore: number;
  username: string;
  onRetry: () => void;
  onHome: () => void;
}

export default function GameOverModal({
  score,
  highScore,
  username,
  onRetry,
  onHome
}: GameOverModalProps) {
  const [firedReason, setFiredReason] = useState("");
  const [unlockedItems, setUnlockedItems] = useState<{ name: string; type: 'HAT' | 'OUTFIT' }[]>([]);

  useEffect(() => {
    // Select a funny fired reason
    const idx = Math.floor(Math.random() * FIRED_REASONS.length);
    setFiredReason(FIRED_REASONS[idx]);

    // Check if we unlocked any new skins this specific run (items whose requiredScore lies below the current high score, but above the previous one)
    // To make it simpler and reliable, we've unlocked items if the current score meets the requirement
    const newlyUnlocked: { name: string; type: 'HAT' | 'OUTFIT' }[] = [];

    HATS.forEach(hat => {
      if (hat.requiredScore > 0 && score >= hat.requiredScore) {
        newlyUnlocked.push({ name: hat.name, type: 'HAT' });
      }
    });

    OUTFITS.forEach(outfit => {
      if (outfit.requiredScore > 0 && score >= outfit.requiredScore) {
        newlyUnlocked.push({ name: outfit.name, type: 'OUTFIT' });
      }
    });

    setUnlockedItems(newlyUnlocked.slice(-3)); // Show up to last 3 unlocks for elegance
    soundManager.playAlert();
  }, [score, highScore]);

  const isNewHighScore = score >= highScore && score > 0;

  return (
    <div id="gameover_modal_container" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fade-in">
      <div id="gameover_modal" className="w-full max-w-lg bg-slate-950 border border-red-900 rounded-xl shadow-3xl p-8 text-slate-100 font-sans relative overflow-hidden">
        {/* Luminous Red Danger Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(239,68,68,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(239,68,68,0.015)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

        <div className="relative z-10 text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-7xl font-black tracking-tighter uppercase italic text-red-500 transform -skew-x-6 drop-shadow-[0_4px_12px_rgba(239,68,68,0.15)] leading-none font-sans">
              FIRED!
            </h1>
            <p className="text-xl text-red-200 italic font-serif leading-relaxed max-w-sm mx-auto mt-3">
              "{firedReason}"
            </p>
            <p className="text-xs uppercase tracking-widest text-slate-500 font-mono mt-1">
              Employee: <span className="text-slate-300 font-bold">{username || 'unpaid intern'}</span> | Your legacy ends here.
            </p>
          </div>

          {/* Scores Panel */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-col justify-center items-center">
              <span className="text-[10px] text-slate-500 font-mono uppercase font-bold tracking-widest">Total Score</span>
              <span className="text-4xl font-black text-white font-sans mt-1">
                {score.toLocaleString()}
              </span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-col justify-center items-center relative">
              {isNewHighScore && (
                <span className="absolute -top-2.5 -right-2 px-2 py-0.5 bg-yellow-400 text-slate-950 font-black font-sans text-[9px] rounded-full flex items-center gap-0.5 shadow-md uppercase tracking-wider">
                  <Sparkles size={8} /> NEW BEST
                </span>
              )}
              <span className="text-[10px] text-slate-500 font-mono uppercase font-bold tracking-widest">Personal Best</span>
              <span className="text-4xl font-black text-yellow-400 font-sans mt-1 flex items-center gap-1">
                {highScore.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Unlocked Gear Notice */}
          {unlockedItems.length > 0 && (
            <div className="bg-yellow-400/5 border border-yellow-400/10 p-4 rounded-xl space-y-2 text-left animate-fade-in">
              <div className="flex items-center gap-1.5 text-yellow-400 font-mono font-bold text-xs uppercase tracking-wider">
                <Sparkles size={14} /> NEW COSMETIC TOYS UNLOCKED:
              </div>
              <ul className="text-xs font-mono text-slate-300 space-y-1.5 pl-1">
                {unlockedItems.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-1">
                    🟢 Unlocked the <strong className="text-yellow-400">{item.name}</strong> ({item.type.toLowerCase()})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-3">
            <button
              id="request_appeal_btn"
              onClick={onRetry}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-yellow-400 hover:bg-yellow-350 text-slate-950 font-sans font-black text-xs uppercase tracking-widest rounded-full transition-all active:scale-95 shadow-lg cursor-pointer"
            >
              <RefreshCw size={14} className="animate-spin-slow" /> SUBMIT RE-HIRE FORM
            </button>
            <button
              id="return_home_btn"
              onClick={onHome}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-sans font-bold text-xs uppercase tracking-wider rounded-full transition-all cursor-pointer"
            >
              <Home size={14} /> SIGN OUT (MENU)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
