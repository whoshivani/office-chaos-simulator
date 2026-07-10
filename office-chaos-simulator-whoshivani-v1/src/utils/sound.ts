// SoundManager.ts - Web Audio API synthesizer for retro office sounds and dynamic music loop
class SoundManager {
  private ctx: AudioContext | null = null;
  private musicNode: OscillatorNode[] = [];
  private musicGainNode: GainNode | null = null;
  private masterGainNode: GainNode | null = null;
  private isMusicPlaying: boolean = false;
  private sfxVolume: number = 0.5;
  private musicVolume: number = 0.06;
  private sfxEnabled: boolean = true;
  private musicEnabled: boolean = true;
  private musicIntervalId: any = null;
  private musicStep: number = 0;

  constructor() {
    // Lazy loaded context to satisfy browser policies
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGainNode = this.ctx.createGain();
      this.masterGainNode.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.masterGainNode.connect(this.ctx.destination);

      this.musicGainNode = this.ctx.createGain();
      this.musicGainNode.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.musicGainNode.connect(this.masterGainNode);

      // Restore settings from localStorage if they exist
      const storedSfx = localStorage.getItem('sfx_enabled');
      const storedMusic = localStorage.getItem('music_enabled');
      const storedSfxVol = localStorage.getItem('sfx_volume');
      const storedMusicVol = localStorage.getItem('music_volume');

      if (storedSfx !== null) this.sfxEnabled = storedSfx === 'true';
      if (storedMusic !== null) this.musicEnabled = storedMusic === 'true';
      if (storedSfxVol !== null) this.sfxVolume = parseFloat(storedSfxVol);
      if (storedMusicVol !== null) this.musicVolume = parseFloat(storedMusicVol);

      if (this.musicGainNode) {
        this.musicGainNode.gain.setValueAtTime(this.musicEnabled ? this.musicVolume : 0, this.ctx.currentTime);
      }
    } catch (e) {
      console.warn("Failed to initialize Web Audio API:", e);
    }
  }

  private resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- SETTERS & STORAGE ---
  public setSfxEnabled(val: boolean) {
    this.sfxEnabled = val;
    localStorage.setItem('sfx_enabled', String(val));
  }

  public setMusicEnabled(val: boolean) {
    this.musicEnabled = val;
    localStorage.setItem('music_enabled', String(val));
    if (this.musicGainNode && this.ctx) {
      this.musicGainNode.gain.setValueAtTime(val ? this.musicVolume : 0, this.ctx.currentTime);
    }
    if (val) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
  }

  public setSfxVolume(val: number) {
    this.sfxVolume = val;
    localStorage.setItem('sfx_volume', String(val));
  }

  public setMusicVolume(val: number) {
    this.musicVolume = val;
    localStorage.setItem('music_volume', String(val));
    if (this.musicGainNode && this.ctx && this.musicEnabled) {
      this.musicGainNode.gain.setValueAtTime(val, this.ctx.currentTime);
    }
  }

  public getSfxEnabled() { return this.sfxEnabled; }
  public getMusicEnabled() { return this.musicEnabled; }
  public getSfxVolume() { return this.sfxVolume; }
  public getMusicVolume() { return this.musicVolume; }

  // --- SOUND SYNTHESIZERS ---

  // Create temporary noise buffer for splash, whoosh, explosions
  private createNoiseBuffer(): AudioBuffer {
    if (!this.ctx) return new AudioBuffer({ length: 1, sampleRate: 44100 });
    const bufferSize = this.ctx.sampleRate * 1.5; // 1.5 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // WHOOSH: Sound of a paper airplane throwing
  public playWhoosh() {
    this.init();
    this.resume();
    if (!this.sfxEnabled || !this.ctx || !this.masterGainNode) return;

    try {
      const now = this.ctx.currentTime;
      // Synthesize noise whoosh
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer();

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.setValueAtTime(3.0, now);
      filter.frequency.setValueAtTime(200, now);
      filter.frequency.exponentialRampToValueAtTime(1800, now + 0.15);
      filter.frequency.exponentialRampToValueAtTime(300, now + 0.4);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.4, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGainNode);

      // Low pitch tone hum along whoosh
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(450, now + 0.15);
      osc.frequency.linearRampToValueAtTime(100, now + 0.4);

      oscGain.gain.setValueAtTime(0, now);
      oscGain.gain.linearRampToValueAtTime(this.sfxVolume * 0.25, now + 0.05);
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      osc.connect(oscGain);
      oscGain.connect(this.masterGainNode);

      noise.start(now);
      noise.stop(now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {
      // Ignored
    }
  }

  // IMPACT: Paper airplane hits wall or object
  public playImpact() {
    this.init();
    this.resume();
    if (!this.sfxEnabled || !this.ctx || !this.masterGainNode) return;

    try {
      const now = this.ctx.currentTime;
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer();

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.exponentialRampToValueAtTime(100, now + 0.15);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(this.sfxVolume * 0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGainNode);

      noise.start(now);
      noise.stop(now + 0.2);
    } catch (e) {
      // Ignored
    }
  }

  // COFFEE SPLASH: Sizzly, splashy liquid splatter
  public playCoffeeSplash() {
    this.init();
    this.resume();
    if (!this.sfxEnabled || !this.ctx || !this.masterGainNode) return;

    try {
      const now = this.ctx.currentTime;
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer();

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.linearRampToValueAtTime(1200, now + 0.08);
      filter.frequency.linearRampToValueAtTime(300, now + 0.35);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(this.sfxVolume * 0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGainNode);

      // Low bubbly blop
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);

      oscGain.gain.setValueAtTime(this.sfxVolume * 0.5, now);
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc.connect(oscGain);
      oscGain.connect(this.masterGainNode);

      noise.start(now);
      noise.stop(now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {
      // Ignored
    }
  }

  // PRINTER JAM: Sparks and mechanical grinding noise
  public playPrinterJam() {
    this.init();
    this.resume();
    if (!this.sfxEnabled || !this.ctx || !this.masterGainNode) return;

    try {
      const now = this.ctx.currentTime;
      // High spark beep
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1800, now);
      osc.frequency.setValueAtTime(2400, now + 0.08);
      osc.frequency.setValueAtTime(900, now + 0.16);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(this.sfxVolume * 0.35, now);
      gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.35, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGainNode);

      // Mechanical noise grinding
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer();
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(400, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(this.sfxVolume * 0.4, now);
      noiseGain.gain.linearRampToValueAtTime(this.sfxVolume * 0.1, now + 0.2);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGainNode);

      osc.start(now);
      osc.stop(now + 0.3);
      noise.start(now);
      noise.stop(now + 0.3);
    } catch (e) {
      // Ignored
    }
  }

  // ALERT: Boss spots player, high pitch warning
  public playAlert() {
    this.init();
    this.resume();
    if (!this.sfxEnabled || !this.ctx || !this.masterGainNode) return;

    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'square';
      osc1.frequency.setValueAtTime(880, now); // A5
      osc1.frequency.setValueAtTime(1174, now + 0.12); // D6

      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(587, now + 0.12);

      gain.gain.setValueAtTime(this.sfxVolume * 0.4, now);
      gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.4, now + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.masterGainNode);

      osc1.start(now);
      osc1.stop(now + 0.4);
      osc2.start(now);
      osc2.stop(now + 0.4);
    } catch (e) {
      // Ignored
    }
  }

  // SMOKE BOMB: Poof sound
  public playSmokeBomb() {
    this.init();
    this.resume();
    if (!this.sfxEnabled || !this.ctx || !this.masterGainNode) return;

    try {
      const now = this.ctx.currentTime;
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer();

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.exponentialRampToValueAtTime(80, now + 0.5);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(this.sfxVolume * 0.9, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGainNode);

      noise.start(now);
      noise.stop(now + 0.65);
    } catch (e) {
      // Ignored
    }
  }

  // POWER-UP: Charming ascending chime
  public playPowerUp() {
    this.init();
    this.resume();
    if (!this.sfxEnabled || !this.ctx || !this.masterGainNode) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C Major scale chime
      const noteDuration = 0.06;

      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * noteDuration);

        gain.gain.setValueAtTime(0, now + idx * noteDuration);
        gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.35, now + idx * noteDuration + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.005, now + idx * noteDuration + 0.12);

        osc.connect(gain);
        gain.connect(this.masterGainNode!);

        osc.start(now + idx * noteDuration);
        osc.stop(now + idx * noteDuration + 0.15);
      });
    } catch (e) {
      // Ignored
    }
  }

  // BOSS FOOTSTEP: Low frequency thud, volume depends on boss distance.
  // distancePercent: 0 = close, 1 = far. Volume peaks when distance is 0.
  public playFootstep(distancePercent: number) {
    this.init();
    this.resume();
    if (!this.sfxEnabled || !this.ctx || !this.masterGainNode) return;

    try {
      const now = this.ctx.currentTime;
      const volMultiplier = Math.max(0, 1 - distancePercent);
      if (volMultiplier <= 0.05) return; // Silent if too far

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(75, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.18);

      gain.gain.setValueAtTime(this.sfxVolume * 0.8 * volMultiplier, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGainNode);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {
      // Ignored
    }
  }

  // SLIPPING: Slide whistly sound
  public playSlipping() {
    this.init();
    this.resume();
    if (!this.sfxEnabled || !this.ctx || !this.masterGainNode) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);

      gain.gain.setValueAtTime(this.sfxVolume * 0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGainNode);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      // Ignored
    }
  }

  // COWORKER SCREAM: Custom retro pitch screech
  public playCoworkerScream() {
    this.init();
    this.resume();
    if (!this.sfxEnabled || !this.ctx || !this.masterGainNode) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      // Funny startled pitch sweep
      const startPitch = 250 + Math.random() * 200;
      osc.frequency.setValueAtTime(startPitch, now);
      osc.frequency.linearRampToValueAtTime(startPitch * 2.5, now + 0.1);
      osc.frequency.exponentialRampToValueAtTime(startPitch * 0.8, now + 0.35);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1500, now);

      gain.gain.setValueAtTime(this.sfxVolume * 0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGainNode);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {
      // Ignored
    }
  }

  // BEEP: Clear, high-pitched countdown beep
  public playBeep() {
    this.init();
    this.resume();
    if (!this.sfxEnabled || !this.ctx || !this.masterGainNode) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // 880Hz (A5 pitch beep)

      gain.gain.setValueAtTime(this.sfxVolume * 0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGainNode);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {
      // Ignored
    }
  }

  // KEYBOARD CLICK: Little woody click sound
  public playKeyboardClick() {
    this.init();
    this.resume();
    if (!this.sfxEnabled || !this.ctx || !this.masterGainNode) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(3000 + Math.random() * 1500, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.02);

      gain.gain.setValueAtTime(this.sfxVolume * 0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.02);

      osc.connect(gain);
      gain.connect(this.masterGainNode);

      osc.start(now);
      osc.stop(now + 0.03);
    } catch (e) {
      // Ignored
    }
  }

  // --- BACKGROUND MUSIC GENERATOR (PRODUCING THE OFFICE SERIES THEME HOOK) ---
  public startMusic() {
    this.init();
    this.resume();
    if (!this.musicEnabled) return;
    if (this.isMusicPlaying) return;

    this.isMusicPlaying = true;
    this.musicStep = 0;

    const stepDuration = 0.22; // Bouncy tempo

    // G Major chord structure for low bass
    const bassNotes = [98.00, 73.42, 65.41, 98.00]; // G2, D2, C2, G2 (in Hz)

    // The iconic "The Office" series theme song hook notes (melody)
    const melodyNotes: (number | null)[] = [
      493.88, // B4
      523.25, // C5
      587.33, // D5
      783.99, // G5 (high peak!)
      392.00, // G4
      493.88, // B4
      440.00, // A4
      392.00, // G4
      493.88, // B4
      523.25, // C5
      587.33, // D5
      783.99, // G5
      783.99, // G5
      739.99, // F#5
      783.99, // G5
      880.00  // A5
    ];

    const playStep = () => {
      if (!this.isMusicPlaying || !this.ctx || !this.musicGainNode) return;
      const now = this.ctx.currentTime;

      const isDownbeat = this.musicStep % 4 === 0;

      // 1. Bass Synth
      if (isDownbeat) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();

        bassOsc.type = 'triangle';
        const bassIdx = Math.floor(this.musicStep / 4) % bassNotes.length;
        bassOsc.frequency.setValueAtTime(bassNotes[bassIdx], now);

        bassGain.gain.setValueAtTime(this.musicVolume * 0.35, now);
        bassGain.gain.exponentialRampToValueAtTime(0.005, now + stepDuration * 1.5);

        bassOsc.connect(bassGain);
        bassGain.connect(this.musicGainNode);

        bassOsc.start(now);
        bassOsc.stop(now + stepDuration * 1.6);
      }

      // 2. Ambience Typing Click
      if (Math.random() < 0.25) {
        this.playKeyboardClick();
      }

      // 3. Melody Synth (The Office series theme hook)
      const noteFreq = melodyNotes[this.musicStep];
      if (noteFreq !== null) {
        const plinkOsc = this.ctx.createOscillator();
        const plinkGain = this.ctx.createGain();

        // Use a lovely square / sine blend by using triangle oscillator for retro toy vibe
        plinkOsc.type = 'sine';
        plinkOsc.frequency.setValueAtTime(noteFreq, now);

        // Make it sound like an acoustic toy piano / melodica
        plinkGain.gain.setValueAtTime(this.musicVolume * 0.28, now);
        plinkGain.gain.exponentialRampToValueAtTime(0.002, now + stepDuration * 0.95);

        plinkOsc.connect(plinkGain);
        plinkGain.connect(this.musicGainNode);

        plinkOsc.start(now);
        plinkOsc.stop(now + stepDuration);
      }

      this.musicStep = (this.musicStep + 1) % 16;
      this.musicIntervalId = setTimeout(playStep, stepDuration * 1000);
    };

    playStep();
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicIntervalId) {
      clearTimeout(this.musicIntervalId);
      this.musicIntervalId = null;
    }
  }
}

export const soundManager = new SoundManager();
