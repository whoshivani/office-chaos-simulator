import React, { useRef, useEffect } from 'react';
import { HATS, OUTFITS } from '../data';
import { Lock, Check, Award, ArrowLeft } from 'lucide-react';
import { soundManager } from '../utils/sound';

interface OutfitSelectorProps {
  highScore: number;
  currentHat: string;
  currentOutfit: string;
  onSelectHat: (id: string) => void;
  onSelectOutfit: (id: string) => void;
  onBack: () => void;
}

export default function OutfitSelector({
  highScore,
  currentHat,
  currentOutfit,
  onSelectHat,
  onSelectOutfit,
  onBack
}: OutfitSelectorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Redraw the tiny preview player character when selections change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and draw background
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw reference floor grid
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let j = 0; j < canvas.height; j += 20) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(canvas.width, j);
      ctx.stroke();
    }

    const cx = canvas.width / 2;
    const cy = canvas.height / 2 + 10;
    const r = 24; // Character radius size for preview

    // Get current outfit configuration
    const outfit = OUTFITS.find(o => o.id === currentOutfit) || OUTFITS[0];
    const hat = HATS.find(h => h.id === currentHat) || HATS[0];

    // 1. Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + r - 3, r * 1.2, r * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Body/Outfit (Bouncy drawing)
    ctx.fillStyle = outfit.color;
    ctx.beginPath();
    ctx.arc(cx, cy + 4, r * 0.95, 0, Math.PI, false);
    ctx.lineTo(cx - r * 0.95, cy + r * 0.8);
    ctx.lineTo(cx + r * 0.95, cy + r * 0.8);
    ctx.closePath();
    ctx.fill();

    // Draw little details like a tie or a pocket
    ctx.fillStyle = outfit.accentColor;
    if (currentOutfit === 'manager_suit') {
      // Draw tie
      ctx.beginPath();
      ctx.moveTo(cx - 3, cy + r * 0.2);
      ctx.lineTo(cx + 3, cy + r * 0.2);
      ctx.lineTo(cx + 4, cy + r * 0.7);
      ctx.lineTo(cx, cy + r * 0.9);
      ctx.lineTo(cx - 4, cy + r * 0.7);
      ctx.closePath();
      ctx.fill();
    } else {
      // Small stripe or circle decoration
      ctx.fillRect(cx - r * 0.3, cy + r * 0.2, r * 0.6, r * 0.15);
    }

    // 3. Hands (Tiny circular toy hands)
    ctx.fillStyle = '#fed7aa'; // Skin peach
    ctx.beginPath();
    ctx.arc(cx - r * 1.0, cy + r * 0.3, r * 0.25, 0, Math.PI * 2);
    ctx.arc(cx + r * 1.0, cy + r * 0.3, r * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // 4. Head
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.4, r * 0.75, 0, Math.PI * 2);
    ctx.fill();

    // 5. Smiling cute toy eyes
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(cx - r * 0.25, cy - r * 0.5, r * 0.1, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.25, cy - r * 0.5, r * 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Red blushing cheeks
    ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.beginPath();
    ctx.arc(cx - r * 0.45, cy - r * 0.35, r * 0.12, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.45, cy - r * 0.35, r * 0.12, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.3, r * 0.18, 0.1, Math.PI - 0.1, false);
    ctx.stroke();

    // 6. Draw Hat
    ctx.save();
    hat.draw(ctx, cx, cy - r * 0.8, r * 0.75);
    ctx.restore();

    // Text label
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText("PREVIEW AVATAR", canvas.width / 2, 25);
  }, [currentHat, currentOutfit]);

  const selectHat = (id: string, reqScore: number) => {
    if (highScore >= reqScore) {
      onSelectHat(id);
      soundManager.playWhoosh();
    }
  };

  const selectOutfit = (id: string, reqScore: number) => {
    if (highScore >= reqScore) {
      onSelectOutfit(id);
      soundManager.playWhoosh();
    }
  };

  return (
    <div id="outfit_selector_panel" className="w-full max-w-5xl mx-auto bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-8 text-slate-100 font-sans relative overflow-hidden flex flex-col md:flex-row gap-8">
      {/* Subtle decorative grid lines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

      {/* LEFT COLUMN: Avatar preview and score metrics */}
      <div className="relative z-10 w-full md:w-1/3 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-slate-800 pb-6 md:pb-0 md:pr-8 animate-fade-in">
        <div className="w-full text-center">
          <button
            id="back_to_menu_btn"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white font-mono font-bold text-xs uppercase tracking-wider mb-6 transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} /> BACK TO MENU
          </button>
          <h2 className="text-4xl font-black tracking-tighter uppercase italic text-yellow-400 transform -skew-x-3 mb-2 leading-none">
            👕 LOCKER ROOM
          </h2>
          <p className="text-xs text-slate-400 font-sans font-light leading-relaxed max-w-xs mx-auto">
            Stand out in the cubicles! Unlock customized office gear by boosting your high score.
          </p>
        </div>

        {/* Live Canvas Preview */}
        <div className="my-6 p-2 bg-slate-950 border border-slate-800 rounded-xl shadow-inner">
          <canvas
            id="outfit_preview_canvas"
            ref={canvasRef}
            width={180}
            height={200}
            className="rounded-lg bg-slate-800"
          />
        </div>

        {/* High Score Panel */}
        <div className="w-full bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between font-mono">
          <span className="text-xs text-slate-400 font-bold flex items-center gap-1.5 uppercase tracking-wider">
            <Award className="text-yellow-400" size={18} /> YOUR HIGH SCORE:
          </span>
          <span className="text-lg font-black text-yellow-400">{highScore.toLocaleString()} pts</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Selector Categories (Hats and Outfits) */}
      <div className="relative z-10 w-full md:w-2/3 space-y-6 overflow-y-auto max-h-[580px] pr-2 animate-fade-in">
        {/* HATS SELECTOR */}
        <div>
          <h3 className="text-xs uppercase font-bold tracking-widest text-slate-400 border-b border-slate-850 pb-2 mb-4">
            👒 CHOOSE A HEADPIECE
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {HATS.map((hat) => {
              const isLocked = highScore < hat.requiredScore;
              const isSelected = currentHat === hat.id;

              return (
                <button
                  key={hat.id}
                  id={`hat_select_${hat.id}`}
                  disabled={isLocked}
                  onClick={() => selectHat(hat.id, hat.requiredScore)}
                  className={`flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all ${
                    isLocked
                      ? 'bg-slate-950/40 border-slate-850 opacity-55 cursor-not-allowed'
                      : isSelected
                      ? 'bg-slate-950 border-yellow-400 ring-2 ring-yellow-400/30 cursor-pointer'
                      : 'bg-slate-850 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800 cursor-pointer'
                  }`}
                >
                  <div className={`p-2 rounded-md flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-yellow-400/20 text-yellow-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isLocked ? <Lock size={16} /> : isSelected ? <Check size={16} /> : <div className="w-4 h-4 rounded-full" style={{ backgroundColor: hat.color }} />}
                  </div>
                  <div>
                    <div className="font-mono text-sm font-bold flex justify-between items-center w-full">
                      <span className={isSelected ? 'text-yellow-400 font-black' : 'text-slate-100'}>
                        {hat.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{hat.description}</p>
                    {isLocked && (
                      <span className="inline-block mt-1.5 bg-slate-950 text-yellow-400 border border-slate-800 text-[9px] font-bold px-2 py-0.5 rounded-sm font-mono uppercase tracking-wider">
                        🔒 REQUIRES {hat.requiredScore.toLocaleString()} PTS
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* OUTFITS SELECTOR */}
        <div>
          <h3 className="text-xs uppercase font-bold tracking-widest text-slate-400 border-b border-slate-850 pb-2 mb-4">
            👔 CHOOSE AN OUTFIT
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {OUTFITS.map((outfit) => {
              const isLocked = highScore < outfit.requiredScore;
              const isSelected = currentOutfit === outfit.id;

              return (
                <button
                  key={outfit.id}
                  id={`outfit_select_${outfit.id}`}
                  disabled={isLocked}
                  onClick={() => selectOutfit(outfit.id, outfit.requiredScore)}
                  className={`flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all ${
                    isLocked
                      ? 'bg-slate-950/40 border-slate-850 opacity-55 cursor-not-allowed'
                      : isSelected
                      ? 'bg-slate-950 border-yellow-400 ring-2 ring-yellow-400/30 cursor-pointer'
                      : 'bg-slate-850 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800 cursor-pointer'
                  }`}
                >
                  <div className={`p-2 rounded-md flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-yellow-400/20 text-yellow-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isLocked ? <Lock size={16} /> : isSelected ? <Check size={16} /> : <div className="w-4 h-4 rounded-md" style={{ backgroundColor: outfit.color }} />}
                  </div>
                  <div>
                    <div className="font-mono text-sm font-bold flex justify-between items-center w-full">
                      <span className={isSelected ? 'text-yellow-400 font-black' : 'text-slate-100'}>
                        {outfit.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{outfit.description}</p>
                    {isLocked && (
                      <span className="inline-block mt-1.5 bg-slate-950 text-yellow-400 border border-slate-800 text-[9px] font-bold px-2 py-0.5 rounded-sm font-mono uppercase tracking-wider">
                        🔒 REQUIRES {outfit.requiredScore.toLocaleString()} PTS
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
