import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Music, Check, X } from 'lucide-react';
import { soundManager } from '../utils/sound';

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const [sfxEnabled, setSfxEnabled] = useState(soundManager.getSfxEnabled());
  const [musicEnabled, setMusicEnabled] = useState(soundManager.getMusicEnabled());
  const [sfxVolume, setSfxVolume] = useState(soundManager.getSfxVolume());
  const [musicVolume, setMusicVolume] = useState(soundManager.getMusicVolume());

  useEffect(() => {
    soundManager.init();
  }, []);

  const handleToggleSfx = () => {
    const nextVal = !sfxEnabled;
    setSfxEnabled(nextVal);
    soundManager.setSfxEnabled(nextVal);
    if (nextVal) {
      soundManager.playWhoosh();
    }
  };

  const handleToggleMusic = () => {
    const nextVal = !musicEnabled;
    setMusicEnabled(nextVal);
    soundManager.setMusicEnabled(nextVal);
  };

  const handleSfxVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setSfxVolume(val);
    soundManager.setSfxVolume(val);
  };

  const handleMusicVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setMusicVolume(val);
    soundManager.setMusicVolume(val);
  };

  return (
    <div id="settings_modal_container" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fade-in">
      <div id="settings_modal" className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-8 text-slate-100 font-sans relative overflow-hidden">
        {/* Subtle decorative grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

        <div className="relative z-10 flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
          <h2 className="text-2xl font-black font-sans tracking-tight uppercase italic text-yellow-400 transform -skew-x-3 flex items-center gap-2">
            ⚙️ OFFICE SETTINGS
          </h2>
          <button
            id="close_settings_btn"
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="relative z-10 space-y-6">
          {/* SFX SECTION */}
          <div className="space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center">
              <span className="font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-yellow-400">
                {sfxEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                Sound Effects (SFX)
              </span>
              <button
                id="toggle_sfx_btn"
                onClick={handleToggleSfx}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-hidden cursor-pointer ${
                  sfxEnabled ? 'bg-yellow-400' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full transition-transform ${
                    sfxEnabled ? 'translate-x-5 bg-slate-950' : 'translate-x-1 bg-slate-300'
                  }`}
                />
              </button>
            </div>
            {sfxEnabled && (
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] text-slate-400 font-mono uppercase">
                  <span>Volume</span>
                  <span>{Math.round(sfxVolume * 100)}%</span>
                </div>
                <input
                  id="sfx_volume_slider"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={sfxVolume}
                  onChange={handleSfxVolumeChange}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                />
              </div>
            )}
          </div>

          {/* MUSIC SECTION */}
          <div className="space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center">
              <span className="font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-yellow-400">
                <Music size={16} />
                Background Office Beat
              </span>
              <button
                id="toggle_music_btn"
                onClick={handleToggleMusic}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-hidden cursor-pointer ${
                  musicEnabled ? 'bg-yellow-400' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full transition-transform ${
                    musicEnabled ? 'translate-x-5 bg-slate-950' : 'translate-x-1 bg-slate-300'
                  }`}
                />
              </button>
            </div>
            {musicEnabled && (
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] text-slate-400 font-mono uppercase">
                  <span>Volume</span>
                  <span>{Math.round(musicVolume * 100)}%</span>
                </div>
                <input
                  id="music_volume_slider"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={musicVolume}
                  onChange={handleMusicVolumeChange}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                />
              </div>
            )}
          </div>

          {/* GAME TIPS */}
          <div className="text-[11px] text-slate-500 border-t border-slate-850 pt-4 font-mono leading-relaxed">
            <p className="font-sans font-light italic">💡 Tip: Break line of sight with the Boss by hiding behind cubicle partitions or entering conference rooms!</p>
          </div>
        </div>

        <div className="relative z-10 mt-6 flex justify-end">
          <button
            id="save_settings_btn"
            onClick={onClose}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 py-3 px-8 bg-yellow-400 hover:bg-yellow-350 text-slate-950 font-sans font-black text-xs uppercase tracking-widest rounded-full transition-all active:scale-95 cursor-pointer shadow-md"
          >
            <Check size={14} /> SAVE & EXIT
          </button>
        </div>
      </div>
    </div>
  );
}
