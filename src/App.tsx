import React, { useState, useEffect } from 'react';
import { GameState } from './types';
import GameCanvas from './components/GameCanvas';
import OutfitSelector from './components/OutfitSelector';
import GameOverModal from './components/GameOverModal';
import SettingsModal from './components/SettingsModal';
import LevelIntro from './components/LevelIntro';
import NewspaperCompletion from './components/NewspaperCompletion';
import { soundManager } from './utils/sound';
import { MAPS } from './data';
import { Play, RotateCcw, Volume2, Shield, Eye, Flame, AlertTriangle, HelpCircle, BookOpen, Settings, Shirt, Award } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [currentScore, setCurrentScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [roundIndex, setRoundIndex] = useState(0);
  const [username, setUsername] = useState('Employee');

  // Progression & multi-floor states
  const [unlockedFloors, setUnlockedFloors] = useState<boolean[]>([true, false, false, false, false, false, false]);
  const [activeFloorIndex, setActiveFloorIndex] = useState<number>(0);
  const [isIntroActive, setIsIntroActive] = useState(false);
  const [isEndlessMode, setIsEndlessMode] = useState(false);

  // Equipped Cosmetics
  const [currentHat, setCurrentHat] = useState('none');
  const [currentOutfit, setCurrentOutfit] = useState('unpaid_intern');

  // Modal views
  const [showSettings, setShowSettings] = useState(false);

  // Initialize and load saved High Scores / Selections
  useEffect(() => {
    // Lazy initialize sound context on first user click anywhere in document
    const initSoundOnInteraction = () => {
      soundManager.init();
      window.removeEventListener('click', initSoundOnInteraction);
    };
    window.addEventListener('click', initSoundOnInteraction);

    // Load states from localStorage
    const savedHighScore = localStorage.getItem('office_high_score');
    if (savedHighScore !== null) {
      setHighScore(parseInt(savedHighScore));
    }

    const savedUsername = localStorage.getItem('office_username');
    if (savedUsername !== null) {
      setUsername(savedUsername);
    }

    const savedHat = localStorage.getItem('equipped_hat');
    if (savedHat !== null) {
      setCurrentHat(savedHat);
    }

    const savedOutfit = localStorage.getItem('equipped_outfit');
    if (savedOutfit !== null) {
      setCurrentOutfit(savedOutfit);
    }

    const savedUnlocked = localStorage.getItem('office_unlocked_floors');
    if (savedUnlocked !== null) {
      try {
        const parsed = JSON.parse(savedUnlocked);
        if (Array.isArray(parsed) && parsed.length === 7) {
          setUnlockedFloors(parsed);
          // Set active floor to highest unlocked
          let highest = 0;
          for (let i = 0; i < 7; i++) {
            if (parsed[i]) {
              highest = i;
            }
          }
          setActiveFloorIndex(highest);
        }
      } catch (e) {
        console.error(e);
      }
    }

    return () => {
      window.removeEventListener('click', initSoundOnInteraction);
    };
  }, []);

  const handleSelectHat = (id: string) => {
    setCurrentHat(id);
    localStorage.setItem('equipped_hat', id);
  };

  const handleSelectOutfit = (id: string) => {
    setCurrentOutfit(id);
    localStorage.setItem('equipped_outfit', id);
  };

  const handleStartGame = () => {
    setIsEndlessMode(false);
    setCurrentScore(0);
    setRoundIndex(0);
    setGameState(GameState.PLAYING);
    setIsIntroActive(true);
    soundManager.init();
    soundManager.playPowerUp();
  };

  const handleRestartGame = () => {
    // Keep isEndlessMode as is (if they were playing endless chaos, stay in endless chaos!)
    setCurrentScore(0);
    setRoundIndex(prev => prev + 1);
    setGameState(GameState.PLAYING);
    setIsIntroActive(true);
    soundManager.init();
    soundManager.playPowerUp();
  };

  const handleStartOver = () => {
    // 1. Reset localStorage values
    localStorage.removeItem('office_high_score');
    localStorage.removeItem('equipped_hat');
    localStorage.removeItem('equipped_outfit');
    localStorage.removeItem('office_unlocked_floors');
    for (let i = 0; i < 7; i++) {
      localStorage.removeItem(`office_missions_floor_${i}`);
      localStorage.removeItem(`office_floor_replay_mode_${i}`);
      localStorage.removeItem(`office_floor_cleared_${i}`);
    }

    // 2. Reset React state
    setHighScore(0);
    setCurrentScore(0);
    setRoundIndex(0);
    setUnlockedFloors([true, false, false, false, false, false, false]);
    setActiveFloorIndex(0);
    setCurrentHat('none');
    setCurrentOutfit('unpaid_intern');

    // 3. Start the game!
    setGameState(GameState.PLAYING);
    setIsIntroActive(true);
    soundManager.init();
    soundManager.playPowerUp();
  };

  // Listen to global space key to play, pause, and resume
  useEffect(() => {
    const handleGlobalSpaceKey = (e: KeyboardEvent) => {
      // Ignore when focused in input/textarea (e.g., editing username)
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();

        if (gameState === GameState.MENU) {
          handleStartGame();
        } else if (isIntroActive) {
          setIsIntroActive(false);
        } else if (gameState === GameState.PLAYING) {
          handlePauseToggle();
        } else if (gameState === GameState.PAUSED) {
          handlePauseToggle();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalSpaceKey);
    return () => {
      window.removeEventListener('keydown', handleGlobalSpaceKey);
    };
  }, [gameState, isIntroActive, activeFloorIndex]);

  const handlePauseToggle = () => {
    if (gameState === GameState.PLAYING) {
      setGameState(GameState.PAUSED);
      soundManager.stopMusic();
    } else if (gameState === GameState.PAUSED) {
      setGameState(GameState.PLAYING);
      soundManager.startMusic();
    }
  };

  const handleFloorCleared = (clearedIdx: number) => {
    const nextIdx = clearedIdx + 1;
    if (nextIdx < 7) {
      setUnlockedFloors(prev => {
        const next = [...prev];
        next[nextIdx] = true;
        localStorage.setItem('office_unlocked_floors', JSON.stringify(next));
        return next;
      });
    } else {
      // Completed Floor 7!
      // Do not transition to GameState.COMPLETED here anymore.
      // This allows GameCanvas to display the natural celebratory overlay first!
    }
  };

  const handleNextFloor = () => {
    const nextIdx = activeFloorIndex + 1;
    if (nextIdx < 7) {
      setActiveFloorIndex(nextIdx);
      setRoundIndex(prev => prev + 1);
      setIsIntroActive(true);
      setGameState(GameState.PLAYING);
      soundManager.startMusic();
    } else {
      // Finished Floor 7! Transition to the newspaper completion screen.
      setGameState(GameState.COMPLETED);
      soundManager.stopMusic();
    }
  };

  const handleCallItADay = () => {
    setGameState(GameState.MENU);
    soundManager.stopMusic();
  };

  const getMissionsForFloorMenu = (floorIdx: number) => {
    const layout = MAPS[floorIdx];
    if (!layout) return [];
    
    // Check which set is active
    const replayMode = localStorage.getItem(`office_floor_replay_mode_${floorIdx}`) || '0';
    const isAlt = replayMode === '1' && layout.missionsAlt;
    const mapMissions = isAlt ? (layout.missionsAlt || []) : layout.missions;

    // Force completed if floor was cleared, or is unlocked and below the active floor index
    const isCleared = localStorage.getItem(`office_floor_cleared_${floorIdx}`) === 'true' || floorIdx < activeFloorIndex;
    if (isCleared) {
      return mapMissions.map((m: any) => ({
        ...m,
        currentProgress: m.targetValue,
        completed: true
      }));
    }

    try {
      const saved = localStorage.getItem(`office_missions_floor_${floorIdx}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return mapMissions.map((m: any) => ({ ...m, currentProgress: 0, completed: false }));
  };

  const handleGameOver = (finalScore: number) => {
    setGameState(GameState.GAMEOVER);
    soundManager.stopMusic();

    // Reset tasks on all levels because the character failed!
    for (let i = 0; i < 7; i++) {
      localStorage.removeItem(`office_missions_floor_${i}`);
      localStorage.removeItem(`office_floor_replay_mode_${i}`);
      localStorage.removeItem(`office_floor_cleared_${i}`);
    }

    // Persist new high score if broken
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('office_high_score', String(finalScore));
    }
  };

  const handleGoHome = () => {
    setIsEndlessMode(false);
    setGameState(GameState.MENU);
    soundManager.stopMusic();
  };

  const handleNextRound = () => {
    setRoundIndex(prev => prev + 1);
    setGameState(GameState.PLAYING);
    setIsIntroActive(true);
    soundManager.playPowerUp();
    soundManager.startMusic();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 select-none relative text-slate-100 overflow-x-hidden font-sans">
      {/* Background office blueprints ambient styling lines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>

      {/* MAIN LAYOUT WRAPPER CONTAINER */}
      <main className="w-full max-w-5xl z-10 space-y-6">
        
        {/* APP BRAND HEADER */}
        {gameState !== GameState.PLAYING && gameState !== GameState.PAUSED && (
          <header id="game_header" className="text-center space-y-3 animate-fade-in">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[9px] font-bold rounded-md uppercase tracking-widest">
              🚀 Corporate Boredom Simulator
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic text-yellow-400 transform -skew-x-6 drop-shadow-[0_4px_12px_rgba(250,204,21,0.15)] leading-none font-sans">
              OFFICE CHAOS
            </h1>
            <p className="text-lg md:text-2xl font-light text-slate-400 italic tracking-wide font-serif">
              The Ultimate Boredom Simulator
            </p>
          </header>
        )}

        {/* VIEW CONDITIONAL RENDERING */}
        {gameState === GameState.MENU && (
          <div id="main_menu_panel" className="w-full max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 md:p-8 relative overflow-hidden space-y-6">
            {/* Ambient decoration */}
            <div className="absolute -top-16 -right-16 w-36 h-36 bg-yellow-400/5 rounded-full blur-3xl pointer-events-none"></div>

            {/* Top row: Username & Highscore */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Editable Username Field */}
              <div className="space-y-1.5 font-mono">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  👤 EMPLOYEE USERNAME:
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    const val = e.target.value;
                    setUsername(val);
                    localStorage.setItem('office_username', val);

                    // Reset game progress to defaults from level 1
                    setActiveFloorIndex(0);
                    setUnlockedFloors([true, false, false, false, false, false, false]);
                    localStorage.setItem('office_unlocked_floors', JSON.stringify([true, false, false, false, false, false, false]));
                    setCurrentScore(0);
                    setRoundIndex(0);
                    for (let i = 0; i < 7; i++) {
                      localStorage.removeItem(`office_missions_floor_${i}`);
                    }
                  }}
                  maxLength={20}
                  placeholder="Enter your name..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/30 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-100 placeholder-slate-600 outline-none transition duration-150 shadow-inner"
                />
              </div>

              {/* High Score Chime card */}
              <div className="space-y-1.5 font-mono">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  🏆 YOUR HIGHSCORE:
                </label>
                <div className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-100 shadow-inner flex items-center min-h-[46px]">
                  {highScore.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Interactive Floor Selection Board */}
            <div className="space-y-2 font-mono">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-400 block">
                🏢 SELECT OFFICE FLOOR LAYOUT:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {MAPS.map((mapData, idx) => {
                  const isUnlocked = unlockedFloors[idx];
                  const isSelected = activeFloorIndex === idx;
                  const floorMissions = getMissionsForFloorMenu(idx);
                  const completedCount = floorMissions.filter((m: any) => m.completed).length;
                  const totalCount = floorMissions.length;

                  return (
                    <button
                      key={idx}
                      disabled={!isUnlocked}
                      onClick={() => {
                        setActiveFloorIndex(idx);
                        soundManager.playPowerUp();
                      }}
                      className={`relative flex flex-col justify-between p-2.5 rounded-xl border text-left transition-all select-none h-24 ${
                        !isUnlocked
                          ? 'bg-slate-950/40 border-slate-900 text-slate-600 cursor-not-allowed opacity-50'
                          : isSelected
                          ? 'bg-amber-950/40 border-amber-500 text-amber-200 ring-2 ring-amber-500/20'
                          : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900 cursor-pointer'
                      }`}
                    >
                      <div className="text-[10px] font-bold text-slate-400 uppercase">
                        FL-{idx + 1}
                      </div>
                      <div className="text-xs font-black truncate max-w-full">
                        {mapData.floorName.split(' ')[0]}
                      </div>
                      <div className="text-[9px] text-slate-500 mt-1 flex items-center justify-between">
                        {isUnlocked ? (
                          <span className={completedCount === totalCount ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                            {completedCount}/{totalCount} ⭐
                          </span>
                        ) : (
                          <span>🔒</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Floor Missions details */}
            <div className="bg-slate-950/95 border border-slate-800 rounded-xl p-4 space-y-3 font-mono">
              <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                <div>
                  <h2 className="text-base font-black text-amber-400">
                    Floor {activeFloorIndex + 1}: {MAPS[activeFloorIndex]?.floorName}
                  </h2>
                </div>
                <div className="text-right text-[10px] text-slate-500">
                  {MAPS[activeFloorIndex]?.floorDesc}
                </div>
              </div>

              {/* Mission board list */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">
                  MISSIONS CHECKLIST (CLEAR ALL TO UNLOCK NEXT FLOOR):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {getMissionsForFloorMenu(activeFloorIndex).map((mission: any, idx: number) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between ${
                        mission.completed
                          ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300'
                          : 'bg-slate-900/60 border-slate-850 text-slate-300'
                      }`}
                    >
                      <div className="font-bold mb-1 leading-tight">{mission.description}</div>
                      <div className="flex items-center justify-between text-[10px] font-mono mt-1 text-slate-400 border-t border-slate-800/50 pt-1">
                        <span>PROGRESS:</span>
                        <span className={mission.completed ? 'text-emerald-400 font-black' : 'text-yellow-400'}>
                          {mission.currentProgress} / {mission.targetValue}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

                {/* Main Action buttons list */}
            <div className="flex flex-col gap-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  id="start_chaos_btn"
                  onClick={handleStartGame}
                  className="flex items-center justify-center gap-2.5 px-6 py-4 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-sans font-black tracking-widest text-sm sm:text-base rounded-full uppercase transition-all shadow-lg active:scale-95 cursor-pointer hover:scale-[1.01]"
                >
                  <Play size={18} fill="currentColor" /> PUNCH IN & PLAY
                </button>
                <button
                  id="start_over_btn"
                  onClick={handleStartOver}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-transparent hover:bg-red-950/25 border border-slate-800 hover:border-red-900/40 text-slate-500 hover:text-red-400 font-mono font-bold text-xs uppercase tracking-wider rounded-full transition-all cursor-pointer"
                >
                  <RotateCcw size={14} /> START OVER
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  id="nav_locker_btn"
                  onClick={() => setGameState(GameState.OUTFITS)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-mono font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                >
                  <Shirt size={14} /> LOCKER ROOM
                </button>
                <button
                  id="nav_manual_btn"
                  onClick={() => setGameState(GameState.HOWTOPLAY)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-mono font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                >
                  <BookOpen size={14} /> OFFICE MANUAL
                </button>
              </div>

              <button
                id="nav_settings_btn"
                onClick={() => setShowSettings(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 font-mono font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                <Settings size={14} /> GAME AUDIO SETTINGS
              </button>
            </div>

            {/* Mini visual character display */}
            <div className="text-center pt-4 border-t border-slate-800">
              <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest block">Currently Wearing</span>
              <div className="inline-flex items-center gap-2 mt-2 px-4 py-1.5 bg-slate-950 rounded-lg text-xs font-mono text-yellow-400 font-bold border border-slate-850">
                🎩 {currentHat === 'none' ? 'Bare hair' : currentHat.replace('_', ' ')} &nbsp;|&nbsp; 👔 {currentOutfit.replace('_', ' ')}
              </div>
            </div>
          </div>
        )}

        {/* PLAYING / CANVAS SCREEN */}
        {(gameState === GameState.PLAYING || gameState === GameState.PAUSED) && (
          <>
            <GameCanvas
              gameState={gameState}
              currentHat={currentHat}
              currentOutfit={currentOutfit}
              roundIndex={roundIndex}
              activeFloorIndex={activeFloorIndex}
              onGameOver={handleGameOver}
              onScoreUpdate={setCurrentScore}
              onPauseToggle={handlePauseToggle}
              onFloorCleared={handleFloorCleared}
              onNextFloor={handleNextFloor}
              onCallItADay={handleCallItADay}
              username={username}
              isIntroActive={isIntroActive}
              isEndless={isEndlessMode}
            />

            {isIntroActive && (
              <LevelIntro
                floorNumber={activeFloorIndex + 1}
                floorName={MAPS[activeFloorIndex]?.floorName.includes(': ') ? MAPS[activeFloorIndex].floorName.split(': ')[1] : MAPS[activeFloorIndex].floorName}
                onComplete={() => setIsIntroActive(false)}
                isEndless={isEndlessMode}
              />
            )}
          </>
        )}
           {/* HOW TO PLAY PANEL */}
        {gameState === GameState.HOWTOPLAY && (
          <div id="manual_panel" className="w-full max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-8 text-slate-200 font-mono relative overflow-hidden space-y-6 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h2 className="text-3xl font-black text-yellow-400 tracking-tight">📖 EMPLOYEE HANDBOOK</h2>
              <button
                onClick={() => setGameState(GameState.MENU)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors border border-slate-700 cursor-pointer"
              >
                BACK TO MENU
              </button>
            </div>

            {/* Instruction grids */}
            <div className="space-y-4 text-xs leading-relaxed text-slate-300">
              <p className="text-slate-400 font-sans text-sm italic font-light">
                Welcome to accounting! You're extremely bored. Your objective is to fold paper airplanes and cause chaos to earn points before getting sacked by the Boss.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-yellow-400">🎯 GAMEPLAY CONTROLS</h3>
                  <ul className="space-y-1.5 list-disc pl-4 text-slate-400 font-sans">
                    <li>Move with <strong className="text-slate-200">W, A, S, D</strong> or <strong className="text-slate-200">ARROW KEYS</strong>.</li>
                    <li>Aim using your <strong className="text-slate-200">MOUSE CURSOR</strong>.</li>
                    <li>Left-Click to <strong className="text-slate-200">THROW AIRPLANE</strong>.</li>
                    <li>Break line-of-sight behind cubicle partitions or enter meeting rooms to hide from the Boss!</li>
                  </ul>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-yellow-400">🧪 INTERACTIVE ELEMENTS</h3>
                  <ul className="space-y-1.5 list-disc pl-4 text-slate-400 font-sans">
                    <li><strong className="text-slate-200">Coworkers</strong>: Hit them to trigger screaming run cycles.</li>
                    <li><strong className="text-slate-200">Coffee Mugs</strong>: Spill them to create slippery slide zones.</li>
                    <li><strong className="text-slate-200">Printers</strong>: Hit multiple times to jam/spark them.</li>
                  </ul>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-yellow-400">⭐ CHOP-SHOP POWERUPS</h3>
                <div className="grid grid-cols-2 gap-3 text-slate-400 font-sans text-xs">
                  <div className="flex items-center gap-1.5">📄 <span><strong className="text-slate-200">Papers</strong>: Rapid fires with no cooldown.</span></div>
                  <div className="flex items-center gap-1.5">☕ <span><strong className="text-slate-200">Coffee Rush</strong>: Injects rapid speed boost.</span></div>
                  <div className="flex items-center gap-1.5">👑 <span><strong className="text-slate-200">Gold Stapler</strong>: Doubles points on all hits.</span></div>
                  <div className="flex items-center gap-1.5">📝 <span><strong className="text-slate-300">Stickies</strong>: Throw at boss to temporarily blind them!</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* OUTFITS / LOCKER PANEL */}
        {gameState === GameState.OUTFITS && (
          <OutfitSelector
            highScore={highScore}
            currentHat={currentHat}
            currentOutfit={currentOutfit}
            onSelectHat={handleSelectHat}
            onSelectOutfit={handleSelectOutfit}
            onBack={handleGoHome}
          />
        )}

        {/* PAUSE MENU OVERLAY */}
        {gameState === GameState.PAUSED && (
          <div id="pause_overlay_container" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fade-in">
            <div id="pause_modal" className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-8 text-center space-y-6">
              <h2 className="text-4xl font-black font-sans tracking-tight italic uppercase text-yellow-400 transform -skew-x-6">GAME PAUSED</h2>
              
              <div className="flex flex-col gap-3">
                <button
                  id="resume_chaos_btn"
                  onClick={handlePauseToggle}
                  className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider rounded-lg transition-all active:scale-95 cursor-pointer shadow-md"
                >
                  ▶️ RESUME CHAOS
                </button>
                <button
                  id="restart_round_btn"
                  onClick={handleRestartGame}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-mono font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                >
                  🔄 RESTART ROUND
                </button>
                <button
                  id="quit_round_btn"
                  onClick={handleGoHome}
                  className="w-full py-3 bg-transparent hover:bg-slate-850 border border-slate-800 text-slate-500 hover:text-slate-300 font-mono font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                >
                  🚪 QUIT TO MAIN MENU
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GAMEOVER MODAL */}
        {gameState === GameState.GAMEOVER && (
          <GameOverModal
            score={currentScore}
            highScore={highScore}
            username={username}
            onRetry={handleRestartGame}
            onHome={handleGoHome}
          />
        )}

        {/* GAME COMPLETED SCREEN */}
        {gameState === GameState.COMPLETED && (
          <NewspaperCompletion
            score={currentScore}
            onPlayAgain={() => {
              // Reset game stats and start over from Floor 1
              localStorage.removeItem('office_high_score');
              localStorage.removeItem('office_unlocked_floors');
              for (let i = 0; i < 7; i++) {
                localStorage.removeItem(`office_missions_floor_${i}`);
                localStorage.removeItem(`office_floor_replay_mode_${i}`);
                localStorage.removeItem(`office_floor_cleared_${i}`);
              }
              // Reset statistics tracking in localStorage
              localStorage.removeItem('office_stat_airplanes_thrown');
              localStorage.removeItem('office_stat_coworkers_hit');
              localStorage.removeItem('office_stat_coffee_spills');
              localStorage.removeItem('office_stat_objects_destroyed');
              localStorage.removeItem('office_stat_boss_escapes');
              localStorage.removeItem('office_stat_play_time');
              localStorage.removeItem('office_stat_highest_combo');
              
              setUnlockedFloors([true, false, false, false, false, false, false]);
              setActiveFloorIndex(0);
              setRoundIndex(0);
              setCurrentScore(0);
              setGameState(GameState.PLAYING);
              setIsIntroActive(true);
              soundManager.init();
              soundManager.playPowerUp();
              soundManager.startMusic();
            }}
            onEndlessChaos={() => {
              // Endless Chaos Mode: Start Floor 7 in an endless mode!
              setIsEndlessMode(true);
              setUnlockedFloors(prev => {
                const next = [...prev];
                next[6] = true;
                return next;
              });
              setActiveFloorIndex(6);
              setRoundIndex(prev => prev + 1);
              setGameState(GameState.PLAYING);
              setIsIntroActive(true);
              soundManager.startMusic();
            }}
          />
        )}

        {/* SETTINGS MODAL */}
        {showSettings && (
          <SettingsModal onClose={() => setShowSettings(false)} />
        )}

        {/* FOOTER */}
        {gameState !== GameState.PLAYING && gameState !== GameState.PAUSED && (
          <footer className="w-full text-center text-[10px] text-slate-500 font-mono pt-4 select-none opacity-80 hover:opacity-100 transition-opacity">
            © 2026 Copyright | Game Vibecoded by Shivani
          </footer>
        )}

      </main>
    </div>
  );
}
