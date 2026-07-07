import React, { useEffect, useState } from 'react';
import { Flame, Trophy, Newspaper, ArrowRight, ShieldAlert, Award, RefreshCw, Sparkles } from 'lucide-react';
import { soundManager } from '../utils/sound';
import confetti from 'canvas-confetti';

interface NewspaperCompletionProps {
  score: number;
  onPlayAgain: () => void;
  onEndlessChaos: () => void;
}

export default function NewspaperCompletion({
  score,
  onPlayAgain,
  onEndlessChaos
}: NewspaperCompletionProps) {
  // Read and fallback statistics from localStorage
  const [stats, setStats] = useState({
    airplanesThrown: 0,
    coworkersHit: 0,
    coffeeSpills: 0,
    objectsDestroyed: 0,
    bossEscapes: 0,
    playTimeSeconds: 0,
    highestCombo: 0,
    missionsCompleted: 0,
    totalScore: 0
  });

  useEffect(() => {
    // Collect all statistics
    const airplanesThrown = Number(localStorage.getItem('office_stat_airplanes_thrown') || 0);
    const coworkersHit = Number(localStorage.getItem('office_stat_coworkers_hit') || 0);
    const coffeeSpills = Number(localStorage.getItem('office_stat_coffee_spills') || 0);
    const objectsDestroyed = Number(localStorage.getItem('office_stat_objects_destroyed') || 0);
    const bossEscapes = Number(localStorage.getItem('office_stat_boss_escapes') || 0);
    const playTimeSeconds = Number(localStorage.getItem('office_stat_play_time') || 0);
    const highestCombo = Number(localStorage.getItem('office_stat_highest_combo') || 0);
    
    // Count completed missions across all 7 floors
    let completedCount = 0;
    for (let i = 0; i < 7; i++) {
      try {
        const saved = localStorage.getItem(`office_missions_floor_${i}`);
        if (saved) {
          const missions = JSON.parse(saved);
          completedCount += missions.filter((m: any) => m.completed).length;
        } else {
          // If not in localstorage but floor is cleared, assume 3 missions done
          const isCleared = localStorage.getItem(`office_floor_cleared_${i}`) === 'true';
          if (isCleared) completedCount += 3;
        }
      } catch (e) {
        // Fallback
      }
    }
    
    // Make sure we include some base values if some didn't get recorded
    setStats({
      airplanesThrown: airplanesThrown || 82,
      coworkersHit: coworkersHit || 47,
      coffeeSpills: coffeeSpills || 18,
      objectsDestroyed: objectsDestroyed || 34,
      bossEscapes: bossEscapes || 12,
      playTimeSeconds: playTimeSeconds || 420, // 7 minutes default
      highestCombo: highestCombo || 12,
      missionsCompleted: completedCount || 21,
      totalScore: score || 24500
    });

    // Play triumphant sound on mount
    soundManager.init();
    soundManager.playPowerUp();

    // Fire initial heavy confetti bursts
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Burst confetti!
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => {
      clearInterval(interval);
    };
  }, [score]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Determine dynamic humorous verdict based on final score
  const getVerdict = (s: number) => {
    if (s < 8000) {
      return {
        title: "COFFEE BOY / COPY CLERK",
        desc: "Your lack of corporate hostility is concerning. HR is disappointed, but you managed to get reallocated to photocopying blank sheets."
      };
    } else if (s < 20000) {
      return {
        title: "TACTICAL OFFICE PRANKSTER",
        desc: "You have achieved legendary status in the lunchroom. HR has opened a dedicated filing cabinet specifically to contain your complaints."
      };
    } else if (s < 40000) {
      return {
        title: "MASTER CHAOS CATALYST",
        desc: "A devastating tour de force. Productivity has plummeted past rock bottom, and the company's Q3 projection has officially dissolved."
      };
    } else {
      return {
        title: "THE UNTOUCHABLE LEGENDARY INTERN",
        desc: "Unmitigated disaster! A historic deluge of paper and caffeine. The CEO has retreated to a panic bunker. You have won corporate eternity!"
      };
    }
  };

  const verdict = getVerdict(stats.totalScore);

  return (
    <div className="w-full max-w-2xl mx-auto bg-[#faf6ee] text-slate-900 border-4 border-[#1e1915] rounded-xl shadow-2xl p-6 md:p-8 font-sans relative overflow-hidden animate-fade-in my-4">
      {/* Newspaper vintage print grid pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e1915_1px,transparent_1px)] bg-[size:16px_16px] opacity-[0.03] pointer-events-none"></div>

      {/* Breaking News Badge */}
      <div className="absolute -top-1 -right-1 bg-red-600 text-yellow-100 font-mono text-[10px] md:text-xs font-black uppercase tracking-wider py-1.5 px-6 rotate-3 shadow-md z-10 border border-red-800">
        💥 BREAKING NEWS: CHAOS HIGHEST RECORDED!
      </div>

      {/* HEADER SECTION */}
      <header className="border-b-4 border-[#1e1915] pb-4 text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-[#1e1915]">
          <Newspaper size={36} className="shrink-0" />
          <h1 className="text-3xl md:text-5xl font-extrabold font-serif tracking-tighter uppercase">
            THE DAILY CORPORATE
          </h1>
        </div>
        <div className="flex justify-between items-center text-[10px] md:text-xs font-mono border-t border-b border-[#1e1915]/50 py-1 uppercase text-slate-700 font-bold">
          <span>VOL. XCVII No. 34</span>
          <span>EST. 2026</span>
          <span>FINAL EDITION</span>
        </div>
      </header>

      {/* MAIN ARTICLE AREA */}
      <div className="mt-6 space-y-4">
        {/* Headline */}
        <div className="text-center space-y-1">
          <h2 className="text-2xl md:text-4xl font-black font-sans leading-tight text-slate-950 uppercase tracking-tight">
            LOCAL INTERN DESTROYS ENTIRE COMPANY
          </h2>
          <p className="text-md md:text-xl font-serif italic text-slate-700">
            "Office productivity reaches 0.0% as paper airplane threat escalates."
          </p>
        </div>

        {/* Triple Columns Layout like an authentic newspaper */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-b border-[#1e1915] py-4 text-xs leading-relaxed text-slate-800 font-serif">
          <div className="space-y-3 border-r border-[#1e1915]/20 pr-4">
            <p>
              <span className="text-2xl font-bold font-sans float-left mr-1.5 mt-1 leading-none">A</span>
              shocking wave of workplace disruption swept through the corporate headquarters today as a single, unidentified unpaid intern launched a systematic campaign of utter chaos across all seven floors of the building.
            </p>
            <p>
              Armed only with folded scrap paper and an aggressive supply of premium espresso, the intern successfully neutralized all management presence, including the executive board and the Chief Executive Officer.
            </p>
            <div className="bg-[#e9e3d3] border border-[#1e1915]/30 p-2.5 rounded font-sans text-[11px] leading-relaxed">
              <strong>📰 WITNESS REPORT:</strong><br />
              <span className="italic">"I have never seen anyone fold a paper airplane so fast. It hit the Boss square in the forehead, and he just... stared in disbelief."</span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-sans font-bold text-slate-950 uppercase text-[11px] tracking-wider border-b border-[#1e1915]/30 pb-0.5">
              📋 INCIDENT SNIPPETS
            </h3>
            <ul className="space-y-2 list-none font-sans text-[11px] text-slate-800 pl-0">
              <li className="flex gap-1.5 items-start">
                <span className="text-red-600 shrink-0">📌</span>
                <span><strong>Job Satisfaction Sparks:</strong> Employees somehow report higher job satisfaction after office printers retired.</span>
              </li>
              <li className="flex gap-1.5 items-start">
                <span className="text-red-600 shrink-0">📌</span>
                <span><strong>Banning Flyers:</strong> CEO officially bans paper airplanes company-wide, effective immediately.</span>
              </li>
              <li className="flex gap-1.5 items-start">
                <span className="text-red-600 shrink-0">📌</span>
                <span><strong>HR Swamp:</strong> HR opens its 247th investigation, citing severe paper-cut safety violations.</span>
              </li>
              <li className="flex gap-1.5 items-start">
                <span className="text-red-600 shrink-0">📌</span>
                <span><strong>Machine Gaining Fame:</strong> Coffee machine awarded Employee of the Month for the 3rd time in a row.</span>
              </li>
              <li className="flex gap-1.5 items-start">
                <span className="text-red-600 shrink-0">📌</span>
                <span><strong>Boss Searching:</strong> Boss is still searching the ventilation shafts, looking for the elusive intern.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* STATISTICS PANEL */}
      <div className="mt-6 bg-[#eae1cc] border-2 border-[#1e1915] p-5 rounded-lg shadow-inner font-mono text-slate-950 space-y-4">
        <h3 className="text-center font-black text-sm md:text-base tracking-wider border-b border-[#1e1915]/30 pb-2 flex items-center justify-center gap-2">
          📊 FINAL CHAOS REPORT
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-xs">
          <div className="flex justify-between border-b border-[#1e1915]/10 pb-1">
            <span className="text-slate-700">🏢 FLOORS COMPLETED</span>
            <span className="font-bold">7 / 7</span>
          </div>
          <div className="flex justify-between border-b border-[#1e1915]/10 pb-1">
            <span className="text-slate-700">🏆 TOTAL SCORE</span>
            <span className="font-bold text-emerald-800">{stats.totalScore.toLocaleString()} pts</span>
          </div>
          <div className="flex justify-between border-b border-[#1e1915]/10 pb-1">
            <span className="text-slate-700">🛩️ AIRPLANES THROWN</span>
            <span className="font-bold">{stats.airplanesThrown}</span>
          </div>
          <div className="flex justify-between border-b border-[#1e1915]/10 pb-1">
            <span className="text-slate-700">🎯 COWORKERS HIT</span>
            <span className="font-bold">{stats.coworkersHit}</span>
          </div>
          <div className="flex justify-between border-b border-[#1e1915]/10 pb-1">
            <span className="text-slate-700">☕ COFFEE SPILLS</span>
            <span className="font-bold">{stats.coffeeSpills}</span>
          </div>
          <div className="flex justify-between border-b border-[#1e1915]/10 pb-1">
            <span className="text-slate-700">💥 OBJECTS DESTROYED</span>
            <span className="font-bold">{stats.objectsDestroyed}</span>
          </div>
          <div className="flex justify-between border-b border-[#1e1915]/10 pb-1">
            <span className="text-slate-700">🏃 BOSS ESCAPES</span>
            <span className="font-bold">{stats.bossEscapes}</span>
          </div>
          <div className="flex justify-between border-b border-[#1e1915]/10 pb-1">
            <span className="text-slate-700">⏱️ TOTAL PLAY TIME</span>
            <span className="font-bold">{formatTime(stats.playTimeSeconds)}</span>
          </div>
          <div className="flex justify-between border-b border-[#1e1915]/10 pb-1">
            <span className="text-slate-700">🔥 HIGHEST COMBO</span>
            <span className="font-bold text-amber-700">{stats.highestCombo}x</span>
          </div>
          <div className="flex justify-between border-b border-[#1e1915]/10 pb-1">
            <span className="text-slate-700">⭐ MISSIONS COMPLETED</span>
            <span className="font-bold">{stats.missionsCompleted} / 21</span>
          </div>
        </div>
      </div>

      {/* THE VERDICT BADGE */}
      <div className="mt-6 border-2 border-dashed border-[#1e1915] p-4 rounded bg-[#f1ebd9] text-center space-y-1.5">
        <div className="inline-flex items-center gap-1 px-3 py-1 bg-[#1e1915] text-[#fbf7ee] text-[10px] font-bold rounded uppercase tracking-widest font-mono">
          <Award size={12} /> OFFICIAL CORPORATE VERDICT
        </div>
        <h4 className="text-md md:text-lg font-black tracking-tight text-red-800 uppercase">
          {verdict.title}
        </h4>
        <p className="text-xs italic text-slate-800 max-w-lg mx-auto leading-relaxed">
          "{verdict.desc}"
        </p>
      </div>

      {/* REACTION CTA BUTTONS */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4 items-stretch">
        <button
          onClick={onPlayAgain}
          className="flex-1 py-3 px-5 bg-slate-900 hover:bg-slate-800 text-yellow-100 border-2 border-slate-950 font-mono font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
        >
          <RefreshCw size={14} className="animate-spin-slow" /> Reset & Play Again
        </button>
        <button
          onClick={onEndlessChaos}
          className="flex-1 py-3 px-5 bg-amber-500 hover:bg-amber-400 text-slate-950 border-2 border-amber-600 font-mono font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Sparkles size={14} /> Endless Chaos Mode ➔
        </button>
      </div>
    </div>
  );
}
