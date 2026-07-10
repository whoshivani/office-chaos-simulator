import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState, Vector2D, Player, Boss, BossState, Coworker, Projectile, OfficeObject, Particle, PowerUp, SlipperySpot, OfficeObjectType, Cat } from '../types';
import { MAPS, HATS, OUTFITS } from '../data';
import { soundManager } from '../utils/sound';
import { Play, RotateCcw, Volume2, Shield, Eye, Flame, AlertTriangle, Paperclip } from 'lucide-react';

interface GameCanvasProps {
  gameState: GameState;
  currentHat: string;
  currentOutfit: string;
  roundIndex: number;
  activeFloorIndex: number; // For progression
  onGameOver: (finalScore: number) => void;
  onScoreUpdate: (currentScore: number) => void;
  onPauseToggle: () => void;
  onFloorCleared: (clearedFloorIdx: number) => void; // Unlocks next floor
  onNextFloor: () => void;
  onCallItADay: () => void;
  username: string;
  isIntroActive?: boolean;
  isEndless?: boolean;
}

export default function GameCanvas({
  gameState,
  currentHat,
  currentOutfit,
  roundIndex,
  activeFloorIndex,
  onGameOver,
  onScoreUpdate,
  onPauseToggle,
  onFloorCleared,
  onNextFloor,
  onCallItADay,
  username,
  isIntroActive = false,
  isEndless = false
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Core Game loop states kept in ref to prevent React stale state issues
  const stateRef = useRef<{
    player: Player;
    boss: Boss;
    coworkers: Coworker[];
    obstacles: OfficeObject[];
    projectiles: Projectile[];
    particles: Particle[];
    powerUps: PowerUp[];
    slipperySpots: SlipperySpot[];
    keys: { [key: string]: boolean };
    mousePos: Vector2D;
    camera: Vector2D;
    screenShake: number;
    gameTime: number;
    mapWidth: number;
    mapHeight: number;
    lastShotTime: number;
    chaosLevel: number; // For scaling difficulty
    bossStepTimer: number;
    powerUpSpawnTimer: number;
    cat: Cat;
    warpMessage?: string;
    warpMessageTimer?: number;
    teleportGlow: number;

    // Multi-floor progression & missions state
    currentFloorIdx: number;
    unlockedFloors: boolean[];
    missions: { id: string; description: string; targetValue: number; currentProgress: number; completed: boolean }[];
    floorClearedAnimationTimer: number;

    // Advanced Evolving Boss AI levels
    securityGuard: { x: number; y: number; radius: number; speed: number; angle: number; state: 'PATROL' | 'CHASE'; targetNodeIdx: number } | null;
    ceoBoss: Boss | null;
    securityCameras: { x: number; y: number; angle: number; sweepRange: number; sweepSpeed: number; radius: number; state: 'SWEEPING' | 'ALARM'; alarmTimer: number }[];

    // Combo multiplier engine
    comboCount: number;
    comboTimer: number;
    maxComboThisGame: number;

    // Timer for spawning a new meeting room attendee on Level 3
    meetingRespawnTimer?: number;

    // Level 7: Crash 15 IT computers task state
    crashedComputersThisWave?: number;
    computerReplacementTimer?: number;

    // Floating feedback popup indicators
    activePopups: { id: string; x: number; y: number; text: string; color: string; life: number; maxLife: number; vy: number }[];

    // Life system states
    lives: number;
    invincibleTimer: number;
    caughtResumeTimer: number;
    redFlashTimer: number;
    isLevelFailed: boolean;
    isTouchDevice?: boolean;
    touchDestination?: Vector2D | null;
    touchPath?: Vector2D[];
    touchRipple?: { x: number; y: number; timer: number; maxTimer: number } | null;
    activeTargetHighlight?: { x: number; y: number; radius: number; timer: number } | null;
    touchTargetObj?: any;
    touchTargetType?: string | null;
    autoThrowWhenReached?: boolean;
    touchStartClientX?: number;
    touchStartClientY?: number;
    isDraggingActive?: boolean;
    dragTrail?: { x: number; y: number }[];
  }>({
    player: {
      id: 'player', x: 100, y: 100, radius: 18, speed: 4.2, angle: 0,
      score: 0, paperCount: 50, hasInfinitePaper: false, infinitePaperTimer: 0,
      hasCoffeeRush: false, coffeeRushTimer: 0, hasGoldenStapler: false, goldenStaplerTimer: 0,
      isSlipping: false, slipTimer: 0, slipAngle: 0
    },
    boss: {
      id: 'boss', x: 700, y: 500, radius: 24, speed: 3.0, angle: 0,
      state: BossState.PATROL, alertMeter: 0, visionAngle: 0, visionCone: Math.PI / 4.5,
      investigateTimer: 0, blindTimer: 0, patrolNodes: [], currentPatrolNodeIndex: 0
    },
    coworkers: [],
    obstacles: [],
    projectiles: [],
    particles: [],
    powerUps: [],
    slipperySpots: [],
    keys: {},
    mousePos: { x: 0, y: 0 },
    camera: { x: 0, y: 0 },
    screenShake: 0,
    gameTime: 0,
    mapWidth: 1200,
    mapHeight: 900,
    lastShotTime: 0,
    chaosLevel: 1.0,
    bossStepTimer: 0,
    powerUpSpawnTimer: 0,
    cat: {
      id: 'cat', x: 400, y: 300, radius: 14, speed: 1.8, angle: 0,
      state: 'ROAMING', stateTimer: 100, meowTimer: 200, meowTextTimer: 0, color: '#f97316'
    },
    warpMessage: '',
    warpMessageTimer: 0,
    teleportGlow: 0,

    currentFloorIdx: 0,
    unlockedFloors: [true, false, false, false, false, false, false],
    missions: [],
    floorClearedAnimationTimer: 0,

    securityGuard: null,
    ceoBoss: null,
    securityCameras: [],

    comboCount: 0,
    comboTimer: 0,
    maxComboThisGame: 0,
    meetingRespawnTimer: 0,
    crashedComputersThisWave: 0,
    computerReplacementTimer: 0,

    activePopups: [],

    lives: 2,
    invincibleTimer: 0,
    caughtResumeTimer: 0,
    redFlashTimer: 0,
    isLevelFailed: false,
    isTouchDevice: false,
    touchDestination: null,
    touchPath: [],
    touchRipple: null,
    activeTargetHighlight: null,
    touchTargetObj: null,
    touchTargetType: null,
    autoThrowWhenReached: false,
    touchStartClientX: 0,
    touchStartClientY: 0,
    isDraggingActive: false,
    dragTrail: []
  });

  // UI readable states
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isTouchDeviceState, setIsTouchDeviceState] = useState(false);
  const [hudLives, setHudLives] = useState(2);
  const [isPortrait, setIsPortrait] = useState(false);
  const isPortraitRef = useRef(false);
  const [isLevelFailedState, setIsLevelFailedState] = useState(false);
  const [caughtResumeTimerState, setCaughtResumeTimerState] = useState(0);
  const [localRestartCount, setLocalRestartCount] = useState(0);
  const [heartLostTrigger, setHeartLostTrigger] = useState(false); // To trigger anim on heart loss
  const [hudScore, setHudScore] = useState(0);
  const [hudAlert, setHudAlert] = useState(0);
  const [hudPaperTime, setHudPaperTime] = useState(0);
  const [hudSpeedTime, setHudSpeedTime] = useState(0);
  const [hudGoldTime, setHudGoldTime] = useState(0);
  const [hudComputerTimer, setHudComputerTimer] = useState(0);
  const [bossStatus, setBossStatus] = useState<BossState>(BossState.PATROL);

  // Monitor orientation changes for mobile landscape enforcement
  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || window.innerWidth < 768;
      if (isMobile) {
        const portrait = window.innerHeight > window.innerWidth;
        setIsPortrait(portrait);
        isPortraitRef.current = portrait;
      } else {
        setIsPortrait(false);
        isPortraitRef.current = false;
      }
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // Initialize Round and Map Layout
  useEffect(() => {
    soundManager.init();

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    // Select map layout based on activeFloorIndex
    const layout = MAPS[activeFloorIndex];

    const initialPlayer: Player = {
      id: 'player',
      x: 100,
      y: 150,
      radius: 17,
      speed: 4.2,
      angle: 0,
      selectedHat: currentHat,
      selectedOutfit: currentOutfit,
      score: 0,
      paperCount: 100,
      hasInfinitePaper: false,
      infinitePaperTimer: 0,
      hasCoffeeRush: false,
      coffeeRushTimer: 0,
      hasGoldenStapler: false,
      goldenStaplerTimer: 0,
      isSlipping: false,
      slipTimer: 0,
      slipAngle: 0
    };

    // Calculate Boss attributes based on Floor difficulty
    let bossSpeed = 2.0;
    let bossVisionCone = Math.PI / 4.5;
    if (activeFloorIndex === 0) { bossSpeed = 2.0; bossVisionCone = Math.PI / 4.5; }
    else if (activeFloorIndex === 1) { bossSpeed = 2.3; bossVisionCone = Math.PI / 4.0; }
    else if (activeFloorIndex === 2) { bossSpeed = 2.6; bossVisionCone = Math.PI / 3.8; }
    else if (activeFloorIndex === 3) { bossSpeed = 2.9; bossVisionCone = Math.PI / 3.6; }
    else if (activeFloorIndex === 4) { bossSpeed = 3.1; bossVisionCone = Math.PI / 3.4; }
    else if (activeFloorIndex === 5) { bossSpeed = 3.4; bossVisionCone = Math.PI / 3.2; }
    else if (activeFloorIndex === 6) { bossSpeed = 3.6; bossVisionCone = Math.PI / 3.0; }

    const initialBoss: Boss = {
      id: 'boss',
      x: layout.bossPatrolNodes[0].x,
      y: layout.bossPatrolNodes[0].y,
      radius: 22,
      speed: bossSpeed,
      angle: 0,
      state: BossState.PATROL,
      alertMeter: 0,
      visionAngle: 0,
      visionCone: bossVisionCone,
      investigateTimer: 0,
      blindTimer: 0,
      patrolNodes: layout.bossPatrolNodes,
      currentPatrolNodeIndex: 0
    };

    const sanitizeCoworkerName = (name: string): string => {
      let sanitized = name.replace(/unpaid\s*intern/gi, 'Senior Associate').replace(/intern/gi, 'Assistant Manager');
      if (sanitized.trim() === '') sanitized = 'Coworker';
      return sanitized;
    };

    const initialCoworkers: Coworker[] = layout.coworkerSpawns.map((s, idx) => {
      const sanitizedName = sanitizeCoworkerName(s.name);
      return {
        id: `coworker_${idx}`,
        x: s.x,
        y: s.y,
        radius: 17,
        speed: 2.0,
        angle: Math.random() * Math.PI * 2,
        name: sanitizedName,
        originalName: sanitizedName,
        state: 'WORKING',
        panicTimer: 0,
        panicMessage: '',
        wanderTimer: 0,
        gender: idx % 2 === 0 ? 'MALE' : 'FEMALE'
      };
    });

    // Deep copy obstacles
    const initialObstacles: OfficeObject[] = layout.obstacles.map((obs, idx) => ({
      id: `obs_${idx}`,
      type: obs.type as OfficeObjectType,
      x: obs.x,
      y: obs.y,
      width: obs.w,
      height: obs.h,
      isHit: false,
      hitTimer: 0,
      health: (obs.type === 'PRINTER' || obs.type === 'WATER_COOLER') ? 3 : 1,
      data: { jammed: false, spilled: false, leavesBlown: false }
    }));

    const initialCat: Cat = {
      id: 'cat',
      x: layout.width / 2,
      y: layout.height / 2,
      radius: 14,
      speed: 1.8,
      angle: Math.random() * Math.PI * 2,
      state: 'ROAMING',
      stateTimer: 120,
      meowTimer: 300,
      meowText: 'Meow~',
      meowTextTimer: 90,
      color: '#f97316'
    };

    // Load missions progress
    let savedMissions = [];
    const wasCleared = localStorage.getItem(`office_floor_cleared_${activeFloorIndex}`) === 'true';
    if (wasCleared) {
      // Toggle replay mode
      const currentReplayMode = localStorage.getItem(`office_floor_replay_mode_${activeFloorIndex}`) || '0';
      const nextReplayMode = currentReplayMode === '0' ? '1' : '0';
      localStorage.setItem(`office_floor_replay_mode_${activeFloorIndex}`, nextReplayMode);
      localStorage.setItem(`office_floor_cleared_${activeFloorIndex}`, 'false');
      localStorage.removeItem(`office_missions_floor_${activeFloorIndex}`);
    } else {
      try {
        const storedMissions = localStorage.getItem(`office_missions_floor_${activeFloorIndex}`);
        if (storedMissions) {
          savedMissions = JSON.parse(storedMissions);
        }
      } catch (e) {
        console.error(e);
      }
    }

    // Determine active mission set
    const replayMode = localStorage.getItem(`office_floor_replay_mode_${activeFloorIndex}`) || '0';
    const isAlt = replayMode === '1' && layout.missionsAlt;
    const mapMissions = isAlt ? (layout.missionsAlt || []) : layout.missions;

    const initialMissions = isEndless ? [] : mapMissions.map(m => {
      const match = savedMissions.find((sm: any) => sm.id === m.id);
      return {
        id: m.id,
        description: m.description,
        targetValue: m.targetValue,
        currentProgress: match ? match.currentProgress : 0,
        completed: match ? match.completed : false
      };
    });

    // Unlocked floors loading
    let savedUnlocked = [true, false, false, false, false, false, false];
    try {
      const stored = localStorage.getItem('office_unlocked_floors');
      if (stored) {
        savedUnlocked = JSON.parse(stored);
      }
    } catch (e) {
      console.error(e);
    }

    // Security Cameras for Floor 5 (HR Department)
    const initialCameras = activeFloorIndex === 4 ? [
      { x: 300, y: 200, angle: 0, sweepRange: Math.PI / 3, sweepSpeed: 0.02, radius: 250, state: 'SWEEPING' as const, alarmTimer: 0 },
      { x: 900, y: 200, angle: Math.PI, sweepRange: Math.PI / 3, sweepSpeed: 0.025, radius: 250, state: 'SWEEPING' as const, alarmTimer: 0 },
      { x: 600, y: 700, angle: -Math.PI / 2, sweepRange: Math.PI / 3, sweepSpeed: 0.015, radius: 250, state: 'SWEEPING' as const, alarmTimer: 0 }
    ] : [];

    // Second Boss: CEO Boss for Floor 7 (IT Department)
    const initialCeo: Boss | null = activeFloorIndex === 6 ? {
      id: 'ceo_boss',
      x: layout.bossPatrolNodes[layout.bossPatrolNodes.length - 1].x,
      y: layout.bossPatrolNodes[layout.bossPatrolNodes.length - 1].y,
      radius: 22,
      speed: 3.2,
      angle: 0,
      state: BossState.PATROL,
      alertMeter: 0,
      visionAngle: Math.PI,
      visionCone: Math.PI / 3.5,
      investigateTimer: 0,
      blindTimer: 0,
      patrolNodes: layout.bossPatrolNodes.slice().reverse(), // Patrols backward!
      currentPatrolNodeIndex: 0
    } : null;

    stateRef.current = {
      player: initialPlayer,
      boss: initialBoss,
      coworkers: initialCoworkers,
      obstacles: initialObstacles,
      projectiles: [],
      particles: [],
      powerUps: [],
      slipperySpots: [],
      keys: {},
      mousePos: { x: 0, y: 0 },
      camera: { x: 0, y: 0 },
      screenShake: 0,
      gameTime: 0,
      mapWidth: layout.width,
      mapHeight: layout.height,
      lastShotTime: 0,
      chaosLevel: 1.0 + (activeFloorIndex * 0.15),
      bossStepTimer: 0,
      powerUpSpawnTimer: 200, // Spawn first powerup soon!
      cat: initialCat,

      currentFloorIdx: activeFloorIndex,
      unlockedFloors: savedUnlocked,
      missions: initialMissions,
      floorClearedAnimationTimer: 0,

      securityGuard: null,
      ceoBoss: initialCeo,
      securityCameras: initialCameras,

      comboCount: 0,
      comboTimer: 0,
      maxComboThisGame: 0,

      activePopups: [],

      // Reset life system fields for the level start/restart
      lives: 2,
      invincibleTimer: 0,
      caughtResumeTimer: 0,
      redFlashTimer: 0,
      isLevelFailed: false,
      isTouchDevice: ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || window.innerWidth < 768,
      touchDestination: null,
      touchPath: [],
      touchRipple: null,
      activeTargetHighlight: null,
      touchTargetObj: null,
      touchTargetType: null,
      autoThrowWhenReached: false,
      touchStartClientX: 0,
      touchStartClientY: 0,
      isDraggingActive: false,
      dragTrail: []
    };

    const isMobile = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || window.innerWidth < 768;
    setIsTouchDeviceState(isMobile);
    setHudLives(2);
    setIsLevelFailedState(false);
    setCaughtResumeTimerState(0);

    // Pre-populate some power-ups on all floors!
    spawnPowerUpAtRandom();
    spawnPowerUpAtRandom();

    // Start background office beat
    soundManager.startMusic();

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [roundIndex, activeFloorIndex, currentHat, currentOutfit, localRestartCount]);

  // HELPER FUNCTIONS FOR MOVEMENT & TAP-TO-MOVE PATHFINDING
  const isLocationBlocked = (state: any, x: number, y: number, radius: number): boolean => {
    if (x < 25 || x > state.mapWidth - 25 || y < 90 || y > state.mapHeight - 25) {
      return true;
    }
    for (let obs of state.obstacles) {
      if (obs.type === 'DOOR') continue; // Glass doors are passable
      if (obs.type === OfficeObjectType.COMPUTER && obs.data?.broken) continue;
      if (obs.type === OfficeObjectType.PRINTER && obs.data?.jammed) continue;
      if (obs.type === OfficeObjectType.PLANT && obs.data?.broken) continue;
      if (obs.type === OfficeObjectType.WATER_COOLER && obs.data?.broken) continue;
      if (obs.type === OfficeObjectType.CONFERENCE_CHAIR && obs.data?.broken) continue;
      if (obs.type === OfficeObjectType.COFFEE_MUG) continue;

      const closestX = Math.max(obs.x, Math.min(x, obs.x + obs.width));
      const closestY = Math.max(obs.y, Math.min(y, obs.y + obs.height));
      const dx = x - closestX;
      const dy = y - closestY;
      if (dx * dx + dy * dy < radius * radius) {
        return true;
      }
    }
    return false;
  };

  const isLineOfSightClear = (state: any, x1: number, y1: number, x2: number, y2: number, radius: number): boolean => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const step = 15;
    const steps = Math.ceil(dist / step);
    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps;
      const px = x1 + dx * t;
      const py = y1 + dy * t;
      if (isLocationBlocked(state, px, py, radius)) {
        return false;
      }
    }
    return true;
  };

  const findPath = (state: any, startX: number, startY: number, endX: number, endY: number): Vector2D[] => {
    const safetyRadius = 22;
    // 1. Direct path check
    if (isLineOfSightClear(state, startX, startY, endX, endY, safetyRadius)) {
      return [{ x: endX, y: endY }];
    }

    // 2. A* Grid Setup
    const CELL_SIZE = 35;
    const cols = Math.ceil(state.mapWidth / CELL_SIZE);
    const rows = Math.ceil(state.mapHeight / CELL_SIZE);

    const toGrid = (x: number, y: number) => {
      const col = Math.max(0, Math.min(cols - 1, Math.floor(x / CELL_SIZE)));
      const row = Math.max(0, Math.min(rows - 1, Math.floor(y / CELL_SIZE)));
      return { col, row };
    };

    const toWorld = (col: number, row: number) => {
      return {
        x: col * CELL_SIZE + CELL_SIZE / 2,
        y: row * CELL_SIZE + CELL_SIZE / 2
      };
    };

    const start = toGrid(startX, startY);
    let end = toGrid(endX, endY);

    const isCellBlocked = (c: number, r: number) => {
      const w = toWorld(c, r);
      return isLocationBlocked(state, w.x, w.y, safetyRadius);
    };

    // If destination cell is blocked, find nearest free cell
    if (isCellBlocked(end.col, end.row)) {
      let found = false;
      for (let rDist = 1; rDist <= 4 && !found; rDist++) {
        for (let dc = -rDist; dc <= rDist && !found; dc++) {
          for (let dr = -rDist; dr <= rDist && !found; dr++) {
            if (Math.abs(dc) !== rDist && Math.abs(dr) !== rDist) continue;
            const nc = end.col + dc;
            const nr = end.row + dr;
            if (nc >= 0 && nc < cols && nr >= 0 && nr < rows) {
              if (!isCellBlocked(nc, nr)) {
                end = { col: nc, row: nr };
                found = true;
              }
            }
          }
        }
      }
    }

    // If start cell is blocked, find nearest free cell to get out of it
    if (isCellBlocked(start.col, start.row)) {
      let found = false;
      for (let rDist = 1; rDist <= 3 && !found; rDist++) {
        for (let dc = -rDist; dc <= rDist && !found; dc++) {
          for (let dr = -rDist; dr <= rDist && !found; dr++) {
            const nc = start.col + dc;
            const nr = start.row + dr;
            if (nc >= 0 && nc < cols && nr >= 0 && nr < rows) {
              if (!isCellBlocked(nc, nr)) {
                start.col = nc;
                start.row = nr;
                found = true;
              }
            }
          }
        }
      }
    }

    interface Node {
      col: number;
      row: number;
      g: number;
      h: number;
      f: number;
      parent: Node | null;
    }

    const openList: Node[] = [];
    const closedSet = new Set<string>();

    const startH = Math.abs(start.col - end.col) + Math.abs(start.row - end.row);
    openList.push({
      col: start.col,
      row: start.row,
      g: 0,
      h: startH,
      f: startH,
      parent: null
    });

    let targetNode: Node | null = null;
    const maxIterations = 350;
    let iter = 0;

    while (openList.length > 0 && iter++ < maxIterations) {
      openList.sort((a, b) => a.f - b.f);
      const current = openList.shift()!;

      if (current.col === end.col && current.row === end.row) {
        targetNode = current;
        break;
      }

      const key = `${current.col},${current.row}`;
      closedSet.add(key);

      const directions = [
        { dc: 0, dr: -1, cost: 1 },
        { dc: 0, dr: 1, cost: 1 },
        { dc: -1, dr: 0, cost: 1 },
        { dc: 1, dr: 0, cost: 1 },
        { dc: -1, dr: -1, cost: 1.414 },
        { dc: 1, dr: -1, cost: 1.414 },
        { dc: -1, dr: 1, cost: 1.414 },
        { dc: 1, dr: 1, cost: 1.414 }
      ];

      for (const dir of directions) {
        const nc = current.col + dir.dc;
        const nr = current.row + dir.dr;

        if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) continue;
        if (closedSet.has(`${nc},${nr}`)) continue;
        if (isCellBlocked(nc, nr)) continue;

        // Prevent cutting corners through diagonal blocks
        if (dir.dc !== 0 && dir.dr !== 0) {
          if (isCellBlocked(current.col + dir.dc, current.row) || isCellBlocked(current.col, current.row + dir.dr)) {
            continue;
          }
        }

        const g = current.g + dir.cost;
        const h = Math.abs(nc - end.col) + Math.abs(nr - end.row);
        const f = g + h;

        const existing = openList.find(n => n.col === nc && n.row === nr);
        if (existing) {
          if (g < existing.g) {
            existing.g = g;
            existing.f = f;
            existing.parent = current;
          }
        } else {
          openList.push({
            col: nc,
            row: nr,
            g,
            h,
            f,
            parent: current
          });
        }
      }
    }

    if (!targetNode) {
      const endWorld = toWorld(end.col, end.row);
      return [{ x: endWorld.x, y: endWorld.y }];
    }

    const pathNodes: Vector2D[] = [];
    let curr: Node | null = targetNode;
    while (curr) {
      pathNodes.push(toWorld(curr.col, curr.row));
      curr = curr.parent;
    }
    pathNodes.reverse();

    // Smooth path via Line of Sight pulling
    const smoothedPath: Vector2D[] = [];
    if (pathNodes.length > 0) {
      smoothedPath.push({ x: startX, y: startY });
      let currentIdx = 0;
      while (currentIdx < pathNodes.length - 1) {
        let nextVisibleIdx = currentIdx + 1;
        for (let i = pathNodes.length - 1; i > currentIdx; i--) {
          if (isLineOfSightClear(state, pathNodes[currentIdx].x, pathNodes[currentIdx].y, pathNodes[i].x, pathNodes[i].y, safetyRadius)) {
            nextVisibleIdx = i;
            break;
          }
        }
        smoothedPath.push(pathNodes[nextVisibleIdx]);
        currentIdx = nextVisibleIdx;
      }
      const finalSmoothedNode = pathNodes[pathNodes.length - 1];
      smoothedPath.push({ x: finalSmoothedNode.x, y: finalSmoothedNode.y });
      smoothedPath.shift();
    }

    if (smoothedPath.length === 0) {
      smoothedPath.push({ x: endX, y: endY });
    }

    return smoothedPath;
  };

  const findTapTarget = (worldX: number, worldY: number) => {
    const state = stateRef.current;
    const tapThreshold = 35;

    // 1. Check Coworkers
    for (let cw of state.coworkers) {
      const dist = Math.sqrt(Math.pow(worldX - cw.x, 2) + Math.pow(worldY - cw.y, 2));
      if (dist < cw.radius + tapThreshold) {
        return { type: 'coworker', obj: cw, x: cw.x, y: cw.y };
      }
    }

    // 2. Check Boss
    const distToBoss = Math.sqrt(Math.pow(worldX - state.boss.x, 2) + Math.pow(worldY - state.boss.y, 2));
    if (distToBoss < state.boss.radius + tapThreshold) {
      return { type: 'boss', obj: state.boss, x: state.boss.x, y: state.boss.y };
    }

    // 3. Check Interactive Obstacles
    for (let obs of state.obstacles) {
      if (obs.type === OfficeObjectType.COFFEE_MUG && !obs.data?.spilled) {
        const cx = obs.x + obs.width / 2;
        const cy = obs.y + obs.height / 2;
        const dist = Math.sqrt(Math.pow(worldX - cx, 2) + Math.pow(worldY - cy, 2));
        if (dist < 35) {
          return { type: 'obstacle', obj: obs, x: cx, y: cy };
        }
      } else if (
        (obs.type === OfficeObjectType.COMPUTER && !obs.data?.broken) ||
        (obs.type === OfficeObjectType.PRINTER && !obs.data?.jammed) ||
        (obs.type === OfficeObjectType.PLANT && !obs.data?.broken) ||
        (obs.type === OfficeObjectType.WATER_COOLER && !obs.data?.broken) ||
        (obs.type === OfficeObjectType.CONFERENCE_CHAIR && !obs.data?.broken)
      ) {
        const cx = obs.x + obs.width / 2;
        const cy = obs.y + obs.height / 2;
        const insideX = worldX >= obs.x - 10 && worldX <= obs.x + obs.width + 10;
        const insideY = worldY >= obs.y - 10 && worldY <= obs.y + obs.height + 10;
        if (insideX && insideY) {
          return { type: 'obstacle', obj: obs, x: cx, y: cy };
        }
      }
    }

    return null;
  };

  const handleFloorTap = (worldX: number, worldY: number) => {
    const state = stateRef.current;

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }

    state.touchRipple = {
      x: worldX,
      y: worldY,
      timer: 20,
      maxTimer: 20
    };

    const tappedTarget = findTapTarget(worldX, worldY);

    if (tappedTarget) {
      state.touchTargetObj = tappedTarget.obj;
      state.touchTargetType = tappedTarget.type;

      state.activeTargetHighlight = {
        x: tappedTarget.x,
        y: tappedTarget.y,
        radius: tappedTarget.type === 'obstacle' ? 24 : 20,
        timer: 30
      };

      const dx = tappedTarget.x - state.player.x;
      const dy = tappedTarget.y - state.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const throwRange = 250;

      if (dist <= throwRange) {
        state.player.angle = Math.atan2(dy, dx);
        state.mousePos = { x: tappedTarget.x, y: tappedTarget.y };
        shootProjectile();

        state.touchPath = [];
        state.touchDestination = null;
      } else {
        const angleToPlayer = Math.atan2(state.player.y - tappedTarget.y, state.player.x - tappedTarget.x);
        const targetDist = throwRange - 30;
        const destX = tappedTarget.x + Math.cos(angleToPlayer) * targetDist;
        const destY = tappedTarget.y + Math.sin(angleToPlayer) * targetDist;

        const clampedDestX = Math.max(25, Math.min(state.mapWidth - 25, destX));
        const clampedDestY = Math.max(90, Math.min(state.mapHeight - 25, destY));

        state.touchDestination = { x: clampedDestX, y: clampedDestY };
        state.touchPath = findPath(state, state.player.x, state.player.y, clampedDestX, clampedDestY);
        state.autoThrowWhenReached = true;
      }
    } else {
      state.touchTargetObj = null;
      state.touchTargetType = null;
      state.activeTargetHighlight = null;
      state.autoThrowWhenReached = false;

      state.touchDestination = { x: worldX, y: worldY };
      state.touchPath = findPath(state, state.player.x, state.player.y, worldX, worldY);
    }
  };

  // Handle key listeners and mouse events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isIntroActive) return;
      const keys = stateRef.current.keys;
      const k = e.key.toLowerCase();
      keys[k] = true;

      // Handle Escape for Pausing
      if (e.key === 'Escape') {
        onPauseToggle();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (isIntroActive) return;
      const keys = stateRef.current.keys;
      const k = e.key.toLowerCase();
      keys[k] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const state = stateRef.current;

      // Map client screen mouse coordinates into the canvas internal 2D camera coordinates
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const canvasX = (e.clientX - rect.left) * scaleX;
      const canvasY = (e.clientY - rect.top) * scaleY;

      state.mousePos = {
        x: canvasX + state.camera.x,
        y: canvasY + state.camera.y
      };
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (isIntroActive) return;
      if (e.button === 0) { // Left click
        shootProjectile();
      }
    };

    const canvas = canvasRef.current;
    const state = stateRef.current;

    if (typeof window !== 'undefined' && ('touchstart' in window || navigator.maxTouchPoints > 0)) {
      state.isTouchDevice = true;
    }

    const handleTouchStart = (e: TouchEvent) => {
      if (gameState !== GameState.PLAYING || isIntroActive) return;
      e.preventDefault();

      if (e.touches.length === 0) return;
      const touch = e.touches[0];

      const rect = canvas?.getBoundingClientRect();
      if (!rect) return;

      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const canvasX = (touch.clientX - rect.left) * scaleX;
      const canvasY = (touch.clientY - rect.top) * scaleY;

      const worldX = canvasX + state.camera.x;
      const worldY = canvasY + state.camera.y;

      state.isTouchDevice = true;
      state.touchStartClientX = touch.clientX;
      state.touchStartClientY = touch.clientY;
      state.isDraggingActive = false;
      state.dragTrail = [{ x: state.player.x, y: state.player.y }];

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
      }

      const tappedTarget = findTapTarget(worldX, worldY);
      if (tappedTarget) {
        state.touchTargetObj = tappedTarget.obj;
        state.touchTargetType = tappedTarget.type;
        
        state.touchDestination = null;
        state.touchPath = [];
        state.autoThrowWhenReached = false;
      } else {
        state.touchTargetObj = null;
        state.touchTargetType = null;
        state.activeTargetHighlight = null;
        state.autoThrowWhenReached = false;

        state.touchRipple = {
          x: worldX,
          y: worldY,
          timer: 20,
          maxTimer: 20
        };

        state.touchDestination = { x: worldX, y: worldY };
        state.touchPath = findPath(state, state.player.x, state.player.y, worldX, worldY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (gameState !== GameState.PLAYING || isIntroActive) return;
      e.preventDefault();

      if (e.touches.length === 0) return;
      const touch = e.touches[0];

      const rect = canvas?.getBoundingClientRect();
      if (!rect) return;

      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const canvasX = (touch.clientX - rect.left) * scaleX;
      const canvasY = (touch.clientY - rect.top) * scaleY;

      const worldX = canvasX + state.camera.x;
      const worldY = canvasY + state.camera.y;

      const dist = Math.hypot(touch.clientX - (state.touchStartClientX || 0), touch.clientY - (state.touchStartClientY || 0));

      if (dist > 12) {
        state.isDraggingActive = true;
        
        state.touchTargetObj = null;
        state.touchTargetType = null;
        state.autoThrowWhenReached = false;

        state.touchDestination = { x: worldX, y: worldY };

        const isLineClear = isLineOfSightClear(state, state.player.x, state.player.y, worldX, worldY, 16);
        
        if (isLineClear) {
          state.touchPath = [{ x: worldX, y: worldY }];
        } else if (state.gameTime % 8 === 0) {
          state.touchPath = findPath(state, state.player.x, state.player.y, worldX, worldY);
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (gameState !== GameState.PLAYING || isIntroActive) return;
      e.preventDefault();

      if (state.isDraggingActive) {
        state.touchDestination = null;
        state.touchPath = [];
        state.dragTrail = [];
        state.isDraggingActive = false;
      } else {
        if (state.touchTargetObj) {
          const obj = state.touchTargetObj;
          const type = state.touchTargetType;

          let tx = obj.x;
          let ty = obj.y;
          if (obj.width) {
            tx = obj.x + obj.width / 2;
            ty = obj.y + obj.height / 2;
          }

          state.activeTargetHighlight = {
            x: tx,
            y: ty,
            radius: type === 'obstacle' ? Math.max(obj.width || 32, obj.height || 32) * 0.75 : 20,
            timer: 30
          };

          const dx = tx - state.player.x;
          const dy = ty - state.player.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const throwRange = 250;

          if (dist <= throwRange) {
            state.player.angle = Math.atan2(dy, dx);
            state.mousePos = { x: tx, y: ty };
            shootProjectile();

            state.touchPath = [];
            state.touchDestination = null;
            state.touchTargetObj = null;
            state.autoThrowWhenReached = false;
          } else {
            const angleToPlayer = Math.atan2(state.player.y - ty, state.player.x - tx);
            const targetDist = throwRange - 35;
            const destX = tx + Math.cos(angleToPlayer) * targetDist;
            const destY = ty + Math.sin(angleToPlayer) * targetDist;

            const clampedDestX = Math.max(25, Math.min(state.mapWidth - 25, destX));
            const clampedDestY = Math.max(90, Math.min(state.mapHeight - 25, destY));

            state.touchDestination = { x: clampedDestX, y: clampedDestY };
            state.touchPath = findPath(state, state.player.x, state.player.y, clampedDestX, clampedDestY);
            state.autoThrowWhenReached = true;
          }
        } else {
          state.dragTrail = [];
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);

    if (canvas) {
      canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
      canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      if (canvas) {
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [gameState, isIntroActive]);

  // LINE-OF-SIGHT RAY CASTING HELPER FUNCTIONS
  const lineIntersectsLine = (a1x: number, a1y: number, a2x: number, a2y: number, b1x: number, b1y: number, b2x: number, b2y: number): boolean => {
    const denom = (b2y - b1y) * (a2x - a1x) - (b2x - b1x) * (a2y - a1y);
    if (denom === 0) return false;
    const ua = ((b2x - b1x) * (a1y - b1y) - (b2y - b1y) * (a1x - b1x)) / denom;
    const ub = ((a2x - a1x) * (a1y - b1y) - (a2y - a1y) * (a1x - b1x)) / denom;
    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
  };

  const lineIntersectsRect = (x1: number, y1: number, x2: number, y2: number, rx: number, ry: number, rw: number, rh: number): boolean => {
    // Check if endpoints are inside rectangle
    if (x1 >= rx && x1 <= rx + rw && y1 >= ry && y1 <= ry + rh) return true;
    if (x2 >= rx && x2 <= rx + rw && y2 >= ry && y2 <= ry + rh) return true;

    // Check intersections with four edges
    const left = lineIntersectsLine(x1, y1, x2, y2, rx, ry, rx, ry + rh);
    const right = lineIntersectsLine(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh);
    const top = lineIntersectsLine(x1, y1, x2, y2, rx, ry, rx + rw, ry);
    const bottom = lineIntersectsLine(x1, y1, x2, y2, rx, ry + rh, rx + rw, ry + rh);

    return left || right || top || bottom;
  };

  const checkLineOfSight = (x1: number, y1: number, x2: number, y2: number, obstacles: OfficeObject[]): boolean => {
    for (let obs of obstacles) {
      if (obs.type === OfficeObjectType.WALL || obs.type === OfficeObjectType.CUBICLE_WALL || obs.type === OfficeObjectType.DESK) {
        if (lineIntersectsRect(x1, y1, x2, y2, obs.x, obs.y, obs.width, obs.height)) {
          return false; // Vision ray blocked!
        }
      }
    }
    return true; // Vision is clear
  };

  // POWER UP SPAWNER
  const spawnPowerUpAtRandom = () => {
    const state = stateRef.current;
    const types: ('INFINITE_PAPER' | 'COFFEE_RUSH' | 'SMOKE_BOMB' | 'GOLDEN_STAPLER' | 'STICKY_NOTES')[] = [
      'INFINITE_PAPER', 'COFFEE_RUSH', 'SMOKE_BOMB', 'GOLDEN_STAPLER', 'STICKY_NOTES'
    ];
    const randType = types[Math.floor(Math.random() * types.length)];

    // Find safe spot away from obstacles
    let validSpot = false;
    let rx = 0;
    let ry = 0;
    let attempts = 0;

    while (!validSpot && attempts < 50) {
      rx = 100 + Math.random() * (state.mapWidth - 200);
      ry = 100 + Math.random() * (state.mapHeight - 200);
      attempts++;

      // Check distance to obstacles
      let collides = false;
      for (let obs of state.obstacles) {
        if (rx >= obs.x - 30 && rx <= obs.x + obs.width + 30 &&
            ry >= obs.y - 30 && ry <= obs.y + obs.height + 30) {
          collides = true;
          break;
        }
      }
      if (!collides) {
        validSpot = true;
      }
    }

    state.powerUps.push({
      id: `powerup_${Date.now()}_${Math.random()}`,
      type: randType,
      x: rx,
      y: ry,
      radius: 15,
      pulseTimer: 0,
      duration: 10000 // 10 seconds default
    });
  };

  // HANDLE PLAYER CAUGHT (LIFE SYSTEM)
  const handlePlayerCaught = () => {
    const state = stateRef.current;
    
    // Safety check in case they are already failed or invincible
    if (state.invincibleTimer > 0) return;
    
    if (isEndless) {
      // Endless mode: Just stun, flash, and alert, but no lives lost and no game over
      soundManager.playAlert();
      createParticles(state.player.x, state.player.y, '#ef4444', 30, 'SPARK');
      state.redFlashTimer = 40;
      state.screenShake = 15;
      
      state.boss.alertMeter = 0;
      state.boss.state = BossState.PATROL;
      if (state.ceoBoss) {
        state.ceoBoss.alertMeter = 0;
        state.ceoBoss.state = BossState.PATROL;
      }
      if (state.securityGuard) {
        state.securityGuard.state = 'PATROL';
      }
      
      state.invincibleTimer = 180; // 3 seconds invincibility
      addFloatingPopup(state.player.x, state.player.y - 40, "🚨 CAUGHT! (ENDLESS MODE)", "#38bdf8");
      return;
    }
    
    state.lives--;
    setHudLives(state.lives);
    
    // Play alert sound and generate collision particles
    soundManager.playAlert();
    createParticles(state.player.x, state.player.y, '#ef4444', 30, 'SPARK');
    
    // Flash the screen red
    state.redFlashTimer = 40; // 40 frames (~0.66 seconds) of red flash
    
    // Shake the screen for dramatic feedback
    state.screenShake = 15;

    if (state.lives > 0) {
      // First caught: Countdown to resume
      state.caughtResumeTimer = 180; // 3 seconds at 60 FPS
      setCaughtResumeTimerState(3);
      
      // Trigger heart lost visual effect/animation
      setHeartLostTrigger(true);
      setTimeout(() => setHeartLostTrigger(false), 1000);
      
      // Reset boss states/alert meters so they don't immediately recapture
      state.boss.alertMeter = 0;
      state.boss.state = BossState.PATROL;
      if (state.ceoBoss) {
        state.ceoBoss.alertMeter = 0;
        state.ceoBoss.state = BossState.PATROL;
      }
      if (state.securityGuard) {
        state.securityGuard.state = 'PATROL';
      }
      
      // Give player a brief period of invincibility (3 seconds of flashing/shield)
      state.invincibleTimer = 180;
      
      // Show dynamic floating alert
      addFloatingPopup(state.player.x, state.player.y - 40, "💔 CAUGHT! 1 Life Left!", "#ef4444");

      // Play initial tick beep
      soundManager.playBeep();

      // Start precise 3-second countdown interval to resume the game and close overlay
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }

      let secondsLeft = 3;
      countdownIntervalRef.current = setInterval(() => {
        secondsLeft--;
        const s = stateRef.current;
        if (secondsLeft <= 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          s.caughtResumeTimer = 0;
          setCaughtResumeTimerState(0);
        } else {
          soundManager.playBeep();
          s.caughtResumeTimer = secondsLeft * 60;
          setCaughtResumeTimerState(secondsLeft);
        }
      }, 1000);

    } else {
      // Second caught: Level Ends (Game Over)
      soundManager.playPrinterJam(); // alert/fail sound
      soundManager.stopMusic();
      onGameOver(state.player.score);
    }
  };

  // FIRE PROJECTILE
  const shootProjectile = () => {
    const state = stateRef.current;
    if (gameState !== GameState.PLAYING || isIntroActive) return;

    const now = Date.now();
    const cooldown = state.player.hasInfinitePaper ? 80 : 380; // Rapid fire powerup
    if (now - state.lastShotTime < cooldown) return;

    state.lastShotTime = now;

    // Track airplanes thrown stat
    localStorage.setItem('office_stat_airplanes_thrown', String(Number(localStorage.getItem('office_stat_airplanes_thrown') || 0) + 1));

    // Determine target vector
    const dx = state.mousePos.x - state.player.x;
    const dy = state.mousePos.y - state.player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return;

    const angle = Math.atan2(dy, dx);
    const speed = 12;

    const isSticky = state.player.paperCount % 5 === 0 && !state.player.hasInfinitePaper; // Occasional sticky note
    const type = isSticky ? 'STICKY_NOTE' : 'PAPER_AIRPLANE';

    state.projectiles.push({
      id: `proj_${now}_${Math.random()}`,
      x: state.player.x + Math.cos(angle) * 15,
      y: state.player.y + Math.sin(angle) * 15,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      radius: 6,
      type,
      angle
    });

    incrementMissionProgress('throw_airplanes_40', 1);

    soundManager.playWhoosh();

    // Trigger Boss Investigation if they are close enough and hear the throw sound (within 200px)
    const distToBoss = Math.sqrt(Math.pow(state.boss.x - state.player.x, 2) + Math.pow(state.boss.y - state.player.y, 2));
    if (distToBoss < 280 && state.boss.state === BossState.PATROL) {
      state.boss.state = BossState.INVESTIGATE;
      state.boss.investigateTarget = { x: state.player.x, y: state.player.y };
      state.boss.investigateTimer = 180; // Investigate for 3 seconds
      state.boss.alertMeter = Math.min(100, state.boss.alertMeter + 20);
    }
  };

  // SPARK / IMPACT PARTICLES GENERATOR
  const createParticles = (x: number, y: number, color: string, count: number, type: 'PAPER' | 'SPARK' | 'COFFEE' | 'LEAF' | 'WATER' | 'CONFETTI' | 'SMOKE' | 'HEART') => {
    const state = stateRef.current;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.0 + Math.random() * (type === 'SPARK' || type === 'CONFETTI' ? 5.0 : 2.5);
      const maxL = 30 + Math.random() * 40;
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + (type === 'COFFEE' || type === 'WATER' ? 0.8 : 0), // gravity-like drop
        color,
        radius: type === 'SMOKE' ? 8 + Math.random() * 8 : type === 'COFFEE' || type === 'WATER' ? 2 + Math.random() * 3 : 1.5 + Math.random() * 2,
        alpha: 1.0,
        life: maxL,
        maxLife: maxL,
        type
      });
    }
  };

  // FLOATING NOTIFICATIONS ADDER
  const addFloatingPopup = (x: number, y: number, text: string, color: string = '#facc15') => {
    const state = stateRef.current;
    state.activePopups.push({
      id: `popup_${state.gameTime}_${Math.random()}`,
      x,
      y,
      text,
      color,
      life: 80,
      maxLife: 80,
      vy: -0.6 - Math.random() * 0.4
    });
  };

  // MISSION ENGINE UPDATE CONTROLLER
  const getMissionPrefix = (missionId: string): string => {
    const parts = missionId.split('_');
    if (parts.length > 1 && !isNaN(Number(parts[parts.length - 1]))) {
      return parts.slice(0, parts.length - 1).join('_');
    }
    return missionId;
  };

  const incrementMissionProgress = (id: string, amt: number) => {
    if (isEndless) return;
    const state = stateRef.current;
    const callPrefix = getMissionPrefix(id);
    const mission = state.missions.find(m => {
      const mPrefix = getMissionPrefix(m.id);
      return mPrefix === callPrefix;
    });
    if (!mission || mission.completed) return;

    const prevProgress = mission.currentProgress;
    mission.currentProgress = Math.min(mission.targetValue, mission.currentProgress + amt);

    if (mission.currentProgress > prevProgress) {
      addFloatingPopup(
        state.player.x + (Math.random() - 0.5) * 30,
        state.player.y - 35,
        `🎯 ${mission.description.split(' ').slice(0, 2).join(' ')}: ${mission.currentProgress}/${mission.targetValue}`,
        '#38bdf8'
      );
    }

    if (mission.currentProgress >= mission.targetValue && !mission.completed) {
      mission.completed = true;
      soundManager.playPowerUp();

      addFloatingPopup(
        state.player.x,
        state.player.y - 55,
        "⭐ MISSION COMPLETED! ⭐",
        "#facc15"
      );

      createParticles(state.player.x, state.player.y, '#fbbf24', 25, 'CONFETTI');
      createParticles(state.player.x, state.player.y, '#f43f5e', 15, 'HEART');

      // Save to localStorage
      localStorage.setItem(`office_missions_floor_${state.currentFloorIdx}`, JSON.stringify(state.missions));

      // Check if ALL missions of current floor are completed!
      const allDone = state.missions.every(m => m.completed);
      if (allDone) {
        state.floorClearedAnimationTimer = 240; // 4 seconds animation timer
        soundManager.playPowerUp();

        // Save progress using localStorage
        localStorage.setItem(`office_floor_cleared_${state.currentFloorIdx}`, 'true');
        
        // Accumulate score for final report
        const previousTotal = Number(localStorage.getItem('office_stat_total_score') || 0);
        localStorage.setItem('office_stat_total_score', String(previousTotal + state.player.score));

        const nextIdx = state.currentFloorIdx + 1;
        if (nextIdx < MAPS.length) {
          state.unlockedFloors[nextIdx] = true;
          localStorage.setItem('office_unlocked_floors', JSON.stringify(state.unlockedFloors));
        }
        onFloorCleared(state.currentFloorIdx);
      }
    } else {
      localStorage.setItem(`office_missions_floor_${state.currentFloorIdx}`, JSON.stringify(state.missions));
    }
  };

  // GAME LOOP PROCESSING
  useEffect(() => {
    let animationId: number;

    const updateAndRender = () => {
      if (isPortraitRef.current) {
        renderScene();
        animationId = requestAnimationFrame(updateAndRender);
        return;
      }

      if (gameState !== GameState.PLAYING || isIntroActive) {
        if (isIntroActive) {
          renderScene();
        }
        animationId = requestAnimationFrame(updateAndRender);
        return;
      }

      const state = stateRef.current;

      // Handle screen red flash decay even during pause
      if (state.redFlashTimer > 0) {
        state.redFlashTimer--;
      }

      // Handle invincibility timer
      if (state.invincibleTimer > 0) {
        state.invincibleTimer--;
      }

      // Handle countdown pause after losing first life
      if (state.caughtResumeTimer > 0) {
        // Update particles only for juicy explosion/effects
        state.particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.life--;
        });
        state.particles = state.particles.filter(p => p.life > 0);

        renderScene();
        animationId = requestAnimationFrame(updateAndRender);
        return;
      }

      // Pause the background play activity of the game when the floor is cleared!
      if (state.floorClearedAnimationTimer > 0) {
        renderScene();
        animationId = requestAnimationFrame(updateAndRender);
        return;
      }

      state.gameTime++;

      // Track play time in seconds (every 60 frames approx 1 second)
      if (state.gameTime % 60 === 0) {
        localStorage.setItem('office_stat_play_time', String(Number(localStorage.getItem('office_stat_play_time') || 0) + 1));
      }

      // Track highest combo in localStorage
      if (state.comboCount > Number(localStorage.getItem('office_stat_highest_combo') || 0)) {
        localStorage.setItem('office_stat_highest_combo', String(state.comboCount));
      }

      // Level 3: meeting attendee respawn timer countdown
      if (state.currentFloorIdx === 2 && state.meetingRespawnTimer !== undefined && state.meetingRespawnTimer > 0) {
        state.meetingRespawnTimer--;
        if (state.meetingRespawnTimer === 0) {
          const names = ["Michael Scott", "Dwight Schrute", "Jim Halpert", "Pam Beesly", "Ryan Howard", "Andy Bernard", "Stanley Hudson", "Phyllis Vance", "Angela Martin", "Oscar Martinez", "Kevin Malone", "Toby Flenderson", "Kelly Kapoor", "Creed Bratton", "Meredith Palmer"];
          const newName = names[Math.floor(Math.random() * names.length)];
          const newCw: Coworker = {
            id: `coworker_meeting_${state.gameTime}`,
            x: 550 + Math.random() * 350,
            y: 400 + Math.random() * 200,
            radius: 17,
            speed: 1.8,
            angle: Math.random() * Math.PI * 2,
            name: newName,
            originalName: newName,
            state: 'WORKING',
            panicTimer: 0,
            panicMessage: '',
            wanderTimer: 0,
            gender: Math.random() > 0.5 ? 'MALE' : 'FEMALE'
          };
          state.coworkers.push(newCw);
          createParticles(newCw.x, newCw.y, '#3b82f6', 20, 'CONFETTI');
          addFloatingPopup(newCw.x, newCw.y - 30, "💼 New attendee arrived!", "#3b82f6");
        }
      }

      // Level 7: computer replacement timer countdown
      if (state.currentFloorIdx === 6 && state.computerReplacementTimer !== undefined && state.computerReplacementTimer > 0) {
        state.computerReplacementTimer--;
        
        // Show periodic feedback popup to show countdown
        if (state.computerReplacementTimer % 300 === 0 && state.computerReplacementTimer > 0) {
          const secs = Math.ceil(state.computerReplacementTimer / 60);
          addFloatingPopup(state.player.x, state.player.y - 45, `🔧 Computers shipping... ${secs}s!`, "#a855f7");
        }

        if (state.computerReplacementTimer === 0) {
          // Reset wave crash count
          state.crashedComputersThisWave = 0;
          
          // Reset broken state for all computer obstacles on Level 7 to FALSE
          let replacedCount = 0;
          state.obstacles.forEach(obs => {
            if (obs.type === OfficeObjectType.COMPUTER && obs.data?.broken) {
              obs.data.broken = false;
              obs.isHit = false;
              obs.hitTimer = 0;
              replacedCount++;
              // Create vibrant neon spark tech sparkles at each computer location to show it's replaced!
              createParticles(obs.x + obs.width/2, obs.y + obs.height/2, '#39ff14', 15, 'SPARK');
              createParticles(obs.x + obs.width/2, obs.y + obs.height/2, '#00ffff', 15, 'SPARK');
            }
          });
          
          soundManager.playPowerUp(); // play satisfying sound
          addFloatingPopup(state.player.x, state.player.y - 35, `💻 ${replacedCount} New IT Computers Installed!`, "#39ff14");
        }
      }

      // 1. UPDATE TIMER-BASED STATE & POWER-UPS
      if (state.player.hasInfinitePaper) {
        state.player.infinitePaperTimer -= 16.67; // approx ms per frame
        if (state.player.infinitePaperTimer <= 0) state.player.hasInfinitePaper = false;
      }
      if (state.player.hasCoffeeRush) {
        state.player.coffeeRushTimer -= 16.67;
        if (state.player.coffeeRushTimer <= 0) state.player.hasCoffeeRush = false;
      }
      if (state.player.hasGoldenStapler) {
        state.player.goldenStaplerTimer -= 16.67;
        if (state.player.goldenStaplerTimer <= 0) state.player.hasGoldenStapler = false;
      }
      if (state.player.isSlipping) {
        state.player.slipTimer--;
        state.player.slipAngle += 0.25;
        if (state.player.slipTimer <= 0) state.player.isSlipping = false;
      }

      // Update Combo Timer
      if (state.comboCount > 0) {
        state.comboTimer--;
        if (state.comboTimer <= 0) {
          state.comboCount = 0;
        }
      }

      // Update Floor Cleared Animation Timer (cap at 1 so the persistent celebratory overlay with CTAs stays visible!)
      if (state.floorClearedAnimationTimer > 1) {
        state.floorClearedAnimationTimer--;
      }

      // Decelerate teleport glow animation
      if (state.teleportGlow > 0) {
        state.teleportGlow -= 0.03;
        if (state.teleportGlow < 0) state.teleportGlow = 0;
      }

      // Update Floating Popups
      state.activePopups = state.activePopups.filter(popup => {
        popup.life--;
        popup.y += popup.vy; // float upwards
        return popup.life > 0;
      });

      if (state.warpMessageTimer && state.warpMessageTimer > 0) {
        state.warpMessageTimer--;
        if (state.warpMessageTimer <= 0) {
          state.warpMessage = '';
        }
      }

      // Update UI state throttled
      if (state.gameTime % 5 === 0) {
        setHudScore(state.player.score);
        setHudAlert(Math.round(state.boss.alertMeter));
        setBossStatus(state.boss.state);
        setHudPaperTime(state.player.hasInfinitePaper ? Math.ceil(state.player.infinitePaperTimer / 1000) : 0);
        setHudSpeedTime(state.player.hasCoffeeRush ? Math.ceil(state.player.coffeeRushTimer / 1000) : 0);
        setHudGoldTime(state.player.hasGoldenStapler ? Math.ceil(state.player.goldenStaplerTimer / 1000) : 0);
        setHudComputerTimer(state.computerReplacementTimer ? Math.ceil(state.computerReplacementTimer / 60) : 0);
      }

      // 2. POWER-UP PERIODIC SPAWNING
      state.powerUpSpawnTimer--;
      if (state.powerUpSpawnTimer <= 0) {
        spawnPowerUpAtRandom();
        state.powerUpSpawnTimer = 600 + Math.random() * 400; // 10-15 seconds
      }

      // 3. PROCESS PLAYER INPUT & COLLISIONS
      let moveSpeed = state.player.hasCoffeeRush ? 7.0 : 4.0;
      if (state.player.isSlipping) moveSpeed = 8.5; // Slip slide speed!

      let dx = 0;
      let dy = 0;

      const isKeyboardMoving = state.keys['w'] || state.keys['s'] || state.keys['a'] || state.keys['d'] ||
                            state.keys['arrowup'] || state.keys['arrowdown'] || state.keys['arrowleft'] || state.keys['arrowright'];

      if (isKeyboardMoving) {
        state.touchPath = [];
        state.touchDestination = null;
        state.touchTargetObj = null;
        state.autoThrowWhenReached = false;
      }

      if (!state.player.isSlipping) {
        if (isKeyboardMoving) {
          if (state.keys['w'] || state.keys['arrowup']) dy -= 1;
          if (state.keys['s'] || state.keys['arrowdown']) dy += 1;
          if (state.keys['a'] || state.keys['arrowleft']) dx -= 1;
          if (state.keys['d'] || state.keys['arrowright']) dx += 1;

          // Diagonal normalization
          if (dx !== 0 && dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;
          }

          // Apply movement velocity
          state.player.x += dx * moveSpeed;
          state.player.y += dy * moveSpeed;

          // Face movement direction while walking
          state.player.angle = Math.atan2(dy, dx);
        } else if (state.touchPath && state.touchPath.length > 0) {
          const nextWaypoint = state.touchPath[0];
          const wdx = nextWaypoint.x - state.player.x;
          const wdy = nextWaypoint.y - state.player.y;
          const distToWaypoint = Math.sqrt(wdx * wdx + wdy * wdy);

          if (distToWaypoint <= moveSpeed + 0.1) {
            state.player.x = nextWaypoint.x;
            state.player.y = nextWaypoint.y;
            state.touchPath.shift();

            if (state.touchPath.length === 0) {
              state.touchDestination = null;

              if (state.autoThrowWhenReached && state.touchTargetObj) {
                let tx = state.touchTargetObj.x;
                let ty = state.touchTargetObj.y;
                if (state.touchTargetObj.width) {
                  tx = state.touchTargetObj.x + state.touchTargetObj.width / 2;
                  ty = state.touchTargetObj.y + state.touchTargetObj.height / 2;
                }
                const tdx = tx - state.player.x;
                const tdy = ty - state.player.y;
                state.player.angle = Math.atan2(tdy, tdx);
                state.mousePos = { x: tx, y: ty };
                shootProjectile();

                state.autoThrowWhenReached = false;
                state.touchTargetObj = null;
              }
            }
          } else {
            dx = wdx / distToWaypoint;
            dy = wdy / distToWaypoint;
            state.player.x += dx * moveSpeed;
            state.player.y += dy * moveSpeed;

            // Always face movement direction while walking
            state.player.angle = Math.atan2(dy, dx);
          }
        }
      } else {
        // Slide in the direction of the slip angle
        state.player.x += Math.cos(state.player.slipAngle) * moveSpeed;
        state.player.y += Math.sin(state.player.slipAngle) * moveSpeed;
      }

      // Keep Player in bounds
      state.player.x = Math.max(25, Math.min(state.mapWidth - 25, state.player.x));
      state.player.y = Math.max(90, Math.min(state.mapHeight - 25, state.player.y));

      // Resolve Obstacle Collisions for Player
      for (let obs of state.obstacles) {
        if (obs.type === 'DOOR') continue; // Glass doors are passable

        // Skip collision with destroyed/broken objects so player never gets stuck after destroying them
        if (obs.type === OfficeObjectType.COMPUTER && obs.data?.broken) continue;
        if (obs.type === OfficeObjectType.PRINTER && obs.data?.jammed) continue;
        if (obs.type === OfficeObjectType.PLANT && obs.data?.broken) continue;
        if (obs.type === OfficeObjectType.WATER_COOLER && obs.data?.broken) continue;
        if (obs.type === OfficeObjectType.CONFERENCE_CHAIR && obs.data?.broken) continue;
        if (obs.type === OfficeObjectType.COFFEE_MUG) continue;

        // AABB-Circle collision resolution
        const closestX = Math.max(obs.x, Math.min(state.player.x, obs.x + obs.width));
        const closestY = Math.max(obs.y, Math.min(state.player.y, obs.y + obs.height));

        const distanceX = state.player.x - closestX;
        const distanceY = state.player.y - closestY;
        const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

        if (distanceSquared < (state.player.radius * state.player.radius)) {
          // Push player back
          const dist = Math.sqrt(distanceSquared);
          let pushX = 0;
          let pushY = 0;

          if (dist < 0.1) {
            // Player center is inside or extremely close to the obstacle.
            // Find closest edge of the rectangle to push them out.
            const dl = state.player.x - obs.x;
            const dr = (obs.x + obs.width) - state.player.x;
            const dt = state.player.y - obs.y;
            const db = (obs.y + obs.height) - state.player.y;
            
            const minDist = Math.min(dl, dr, dt, db);
            if (minDist === dl) {
              pushX = -state.player.radius - dl;
            } else if (minDist === dr) {
              pushX = state.player.radius + dr;
            } else if (minDist === dt) {
              pushY = -state.player.radius - dt;
            } else {
              pushY = state.player.radius + db;
            }
          } else {
            const overlap = state.player.radius - dist;
            pushX = (distanceX / dist) * overlap;
            pushY = (distanceY / dist) * overlap;
          }

          state.player.x += pushX;
          state.player.y += pushY;
        }
      }

      // Update drag trail for mobile dragging visuals
      if (state.isDraggingActive) {
        if (!state.dragTrail) state.dragTrail = [];
        state.dragTrail.push({ x: state.player.x, y: state.player.y });
        if (state.dragTrail.length > 12) {
          state.dragTrail.shift();
        }
      } else {
        if (state.dragTrail && state.dragTrail.length > 0) {
          state.dragTrail.shift();
        }
      }

      // Check Power-up collection
      state.powerUps = state.powerUps.filter(pu => {
        const dist = Math.sqrt(Math.pow(state.player.x - pu.x, 2) + Math.pow(state.player.y - pu.y, 2));
        if (dist < state.player.radius + pu.radius) {
          // Trigger powerup!
          soundManager.playPowerUp();
          createParticles(pu.x, pu.y, '#f59e0b', 15, 'SMOKE');

          if (pu.type === 'INFINITE_PAPER') {
            state.player.hasInfinitePaper = true;
            state.player.infinitePaperTimer = pu.duration;
          } else if (pu.type === 'COFFEE_RUSH') {
            state.player.hasCoffeeRush = true;
            state.player.coffeeRushTimer = pu.duration;
          } else if (pu.type === 'GOLDEN_STAPLER') {
            state.player.hasGoldenStapler = true;
            state.player.goldenStaplerTimer = pu.duration;
          } else if (pu.type === 'STICKY_NOTES') {
            // Blind the boss!
            state.boss.state = BossState.BLINDED;
            state.boss.blindTimer = 300; // 5 seconds blinded
            state.boss.alertMeter = Math.max(0, state.boss.alertMeter - 15);
            createParticles(state.boss.x, state.boss.y, '#ecc94b', 20, 'CONFETTI');
          } else if (pu.type === 'SMOKE_BOMB') {
            // Instantly lose aggro! Teleport to opposite side of boss or safe meetings room
            soundManager.playSmokeBomb();
            createParticles(state.player.x, state.player.y, '#a0aec0', 40, 'SMOKE');

            // Set boss to patrol and drop alert meter
            state.boss.state = BossState.PATROL;
            state.boss.alertMeter = 0;

            // Teleport player to opposite corner
            let targetX = 100;
            let targetY = 100;
            if (state.boss.x < state.mapWidth / 2) {
              targetX = state.mapWidth - 100;
              targetY = state.mapHeight - 100;
            }
            state.player.x = targetX;
            state.player.y = targetY;

            // Snap camera instantly to destination to keep visuals perfectly centered
            const canvas = canvasRef.current;
            if (canvas) {
              state.camera.x = Math.max(0, Math.min(state.mapWidth - canvas.width, targetX - canvas.width / 2));
              state.camera.y = Math.max(0, Math.min(state.mapHeight - canvas.height, targetY - canvas.height / 2));
            }

            state.teleportGlow = 1.0; // Trigger visual warp animation overlay
          }
          return false; // remove
        }
        return true;
      });

      // Check slippery coffee puddle stepping
      state.slipperySpots.forEach(spot => {
        const dist = Math.sqrt(Math.pow(state.player.x - spot.x, 2) + Math.pow(state.player.y - spot.y, 2));
        if (dist < state.player.radius + spot.radius && !state.player.isSlipping) {
          state.player.isSlipping = true;
          state.player.slipTimer = 45; // slip for 45 frames
          state.player.slipAngle = Math.random() * Math.PI * 2;
          soundManager.playSlipping();
          createParticles(state.player.x, state.player.y, '#8b4513', 8, 'COFFEE');
        }
      });

      // 4. PROCESS PROJECTILES PHYSICS & COLLISIONS
      state.projectiles = state.projectiles.filter(proj => {
        proj.x += proj.vx;
        proj.y += proj.vy;

        // Check map boundary hits
        if (proj.x < 0 || proj.x > state.mapWidth || proj.y < 0 || proj.y > state.mapHeight) {
          soundManager.playImpact();
          createParticles(proj.x, proj.y, '#e2e8f0', 6, 'PAPER');
          return false;
        }

        // Check Obstacle Collsions (with multi-pass prioritizing so coffee mugs on top of desks don't get blocked)
        let hitObstacle: OfficeObject | null = null;

        // 1st pass: check coffee mugs (generous radial hitbox!)
        for (let obs of state.obstacles) {
          if (obs.type === OfficeObjectType.COFFEE_MUG && !obs.data?.spilled) {
            const cx = obs.x + obs.width / 2;
            const cy = obs.y + obs.height / 2;
            const dist = Math.sqrt(Math.pow(proj.x - cx, 2) + Math.pow(proj.y - cy, 2));
            if (dist < 26) { // extremely generous radius so throwing at mugs always registers successfully!
              hitObstacle = obs;
              break;
            }
          }
        }

        // 2nd pass: check other interactive objects (computers, printers, plants, water coolers)
        if (!hitObstacle) {
          for (let obs of state.obstacles) {
            if (obs.type !== OfficeObjectType.WALL && 
                obs.type !== OfficeObjectType.CUBICLE_WALL && 
                obs.type !== OfficeObjectType.DESK && 
                obs.type !== OfficeObjectType.CONFERENCE_TABLE &&
                obs.type !== OfficeObjectType.COFFEE_MUG) {
              if (proj.x >= obs.x && proj.x <= obs.x + obs.width &&
                  proj.y >= obs.y && proj.y <= obs.y + obs.height) {
                hitObstacle = obs;
                break;
              }
            }
          }
        }

        // 3rd pass: check physical desk/wall background barriers
        if (!hitObstacle) {
          for (let obs of state.obstacles) {
            if (obs.type === OfficeObjectType.WALL || 
                obs.type === OfficeObjectType.CUBICLE_WALL || 
                obs.type === OfficeObjectType.DESK || 
                obs.type === OfficeObjectType.CONFERENCE_TABLE) {
              if (proj.x >= obs.x && proj.x <= obs.x + obs.width &&
                  proj.y >= obs.y && proj.y <= obs.y + obs.height) {
                hitObstacle = obs;
                break;
              }
            }
          }
        }

        if (hitObstacle) {
          const obs = hitObstacle;
          // Collision!
          soundManager.playImpact();
          state.screenShake = Math.max(state.screenShake, 5);

          // Boss hears paper airplane impact (Evolving AI hearing, Floor 3+)
          const distToBoss = Math.sqrt(Math.pow(proj.x - state.boss.x, 2) + Math.pow(proj.y - state.boss.y, 2));
          if (distToBoss < 350 && state.boss.state === BossState.PATROL) {
            state.boss.state = BossState.INVESTIGATE;
            state.boss.investigateTarget = { x: proj.x, y: proj.y };
            state.boss.investigateTimer = 180;
            addFloatingPopup(state.boss.x, state.boss.y - 35, "👂 Heard Sound!", "#facc15");
          }

          // Handle object reactions
          obs.isHit = true;
          obs.hitTimer = 15;

          if (obs.type === OfficeObjectType.COFFEE_MUG && !obs.data.spilled) {
              obs.data.spilled = true;
              localStorage.setItem('office_stat_coffee_spills', String(Number(localStorage.getItem('office_stat_coffee_spills') || 0) + 1));
              obs.health = 0;
              soundManager.playCoffeeSplash();
              // Spawn slippery spot
              state.slipperySpots.push({
                id: `spill_${Date.now()}`,
                x: obs.x + obs.width / 2,
                y: obs.y + obs.height / 2 + 15,
                radius: 25,
                life: 600 // lasts 10 seconds
              });
              createParticles(obs.x + obs.width/2, obs.y + obs.height/2, '#7c2d12', 15, 'COFFEE');
              addScore(100);

              // Mission Tracking
              incrementMissionProgress('coffee_spills_3', 1);
              incrementMissionProgress('food_splatter_5', 1);
              triggerComboHit();
            } else if (obs.type === OfficeObjectType.PRINTER && !obs.data.jammed) {
              obs.health--;
              createParticles(obs.x + obs.width/2, obs.y + obs.height/2, '#f59e0b', 8, 'SPARK');
              if (obs.health <= 0) {
                obs.data.jammed = true;
                localStorage.setItem('office_stat_objects_destroyed', String(Number(localStorage.getItem('office_stat_objects_destroyed') || 0) + 1));
                soundManager.playPrinterJam();
                addScore(250);
                createParticles(obs.x + obs.width/2, obs.y + obs.height/2, '#e53e3e', 20, 'SPARK');
                createParticles(obs.x + obs.width/2, obs.y + obs.height/2, '#718096', 30, 'SMOKE');

                // Mission Tracking
                incrementMissionProgress('jam_servers_4', 1);
                incrementMissionProgress('break_objects_8', 1);
                triggerComboHit();
              }
            } else if (obs.type === OfficeObjectType.PLANT) {
              if (!obs.data) obs.data = {};
              if (!obs.data.broken) {
                obs.data.broken = true;
                localStorage.setItem('office_stat_objects_destroyed', String(Number(localStorage.getItem('office_stat_objects_destroyed') || 0) + 1));
              }
              createParticles(obs.x + obs.width/2, obs.y + obs.height/2, '#48bb78', 8, 'LEAF');
              addScore(20);

              // Mission Tracking
              incrementMissionProgress('break_executive_6', 1);
              incrementMissionProgress('break_objects_8', 1);
              triggerComboHit();
            } else if (obs.type === OfficeObjectType.WATER_COOLER) {
              if (!obs.data) obs.data = {};
              if (!obs.data.broken) {
                obs.health--;
                createParticles(obs.x + obs.width/2, obs.y + obs.height/2, '#3182ce', 6, 'WATER');
                if (obs.health <= 0) {
                  obs.data.broken = true;
                  localStorage.setItem('office_stat_objects_destroyed', String(Number(localStorage.getItem('office_stat_objects_destroyed') || 0) + 1));
                  createParticles(obs.x + obs.width/2, obs.y + obs.height/2, '#3182ce', 20, 'WATER');
                  addScore(150);

                  // Mission Tracking
                  incrementMissionProgress('water_cooler_floods_2', 1);
                  incrementMissionProgress('water_cooler_floods_3', 1);
                  incrementMissionProgress('water_cooler_floods_4', 1);
                  incrementMissionProgress('break_objects_8', 1);
                  triggerComboHit();
                }
              }
            } else if (obs.type === OfficeObjectType.COMPUTER) {
              if (!obs.data) obs.data = {};
              if (!obs.data.broken) {
                obs.data.broken = true;
                localStorage.setItem('office_stat_objects_destroyed', String(Number(localStorage.getItem('office_stat_objects_destroyed') || 0) + 1));
                
                createParticles(obs.x + obs.width/2, obs.y + obs.height/2, '#f59e0b', 12, 'SPARK');
                addScore(150);

                // Mission Tracking
                incrementMissionProgress('break_filing_5', 1);
                incrementMissionProgress('hit_computers_15', 1);
                incrementMissionProgress('break_objects_8', 1);
                triggerComboHit();

                // Level 7: replacement timer trigger logic
                if (state.currentFloorIdx === 6) {
                  state.crashedComputersThisWave = (state.crashedComputersThisWave || 0) + 1;
                  if (state.crashedComputersThisWave === 5) {
                    state.computerReplacementTimer = 25 * 60; // 25 seconds at 60 FPS
                    addFloatingPopup(obs.x, obs.y - 35, "⚠️ 5 Computers crashed! Replacements ordered (25s)!", "#a855f7");
                    soundManager.playPrinterJam(); // alert sound
                  } else if (state.crashedComputersThisWave < 5) {
                    const remaining = 5 - state.crashedComputersThisWave;
                    addFloatingPopup(obs.x, obs.y - 35, `💻 ${state.crashedComputersThisWave}/5 crashed!`, "#f59e0b");
                  }
                }
              }
            } else if (obs.type === OfficeObjectType.CONFERENCE_CHAIR) {
              if (!obs.data) obs.data = {};
              if (!obs.data.broken) {
                obs.data.broken = true;
                localStorage.setItem('office_stat_objects_destroyed', String(Number(localStorage.getItem('office_stat_objects_destroyed') || 0) + 1));
              }
              createParticles(obs.x + obs.width/2, obs.y + obs.height/2, '#475569', 10, 'SPARK');
              addScore(50);

              // Mission Tracking
              incrementMissionProgress('break_objects_8', 1);
              triggerComboHit();
            } else {
              // Standard wall or desk spark
              createParticles(proj.x, proj.y, '#e2e8f0', 5, 'PAPER');
            }

            return false; // destroy projectile
          }

        // Check Coworker hits
        for (let cw of state.coworkers) {
          const dist = Math.sqrt(Math.pow(proj.x - cw.x, 2) + Math.pow(proj.y - cw.y, 2));
          if (dist < cw.radius + proj.radius) {
            // HIT COWORKER!
            soundManager.playCoworkerScream();
            state.screenShake = Math.max(state.screenShake, 10);

            // Boss hears sound
            const distToBoss = Math.sqrt(Math.pow(proj.x - state.boss.x, 2) + Math.pow(proj.y - state.boss.y, 2));
            if (distToBoss < 350 && state.boss.state === BossState.PATROL) {
              state.boss.state = BossState.INVESTIGATE;
              state.boss.investigateTarget = { x: proj.x, y: proj.y };
              state.boss.investigateTimer = 180;
              addFloatingPopup(state.boss.x, state.boss.y - 35, "👂 Heard Sound!", "#facc15");
            }

            cw.isHit = true;
            cw.hitTimer = 25;
            cw.state = 'PANICKED';
            cw.panicTimer = 180; // Panicked for 3 seconds
            cw.angle = Math.atan2(cw.y - proj.y, cw.x - proj.x) + (Math.random() - 0.5);

            // Funny speech comic lines
            const lines = ["WHAT THE?!", "MY EYE!", "AVIATION DANGER!", "AAARGH!", "REPORTED!", "WHO DID THIS?!"];
            cw.panicMessage = lines[Math.floor(Math.random() * lines.length)];

            // Check if coworker is HR before they are hit
            const isHr = cw.name.includes('HR') || 
                         cw.name.includes('Compliance') || 
                         cw.name.includes('Investigator') || 
                         cw.name.includes('Auditor') || 
                         cw.name.includes('Case Lead') || 
                         state.currentFloorIdx === 4; // Floor 5 is the HR Department!

            addScore(300);
            createParticles(cw.x, cw.y, '#e2e8f0', 12, 'PAPER');

            // Mission Tracking
            localStorage.setItem('office_stat_coworkers_hit', String(Number(localStorage.getItem('office_stat_coworkers_hit') || 0) + 1));
            incrementMissionProgress('hit_coworkers_10', 1);
            incrementMissionProgress('hit_coworkers_5', 1);
            incrementMissionProgress('hit_distracted_15', 1);
            incrementMissionProgress('hit_distracted_10', 1);
            if (isHr) {
              incrementMissionProgress('hit_hr_5', 1);
              incrementMissionProgress('hit_hr_workers_12', 1);
            }
            if (state.currentFloorIdx === 2 && cw.x >= 450 && cw.x <= 1050 && cw.y >= 350 && cw.y <= 750) {
              incrementMissionProgress('interrupt_meetings_4', 1);
              state.meetingRespawnTimer = 45 * 60; // 45 seconds at 60 FPS
            }
            triggerComboHit();

            // Confetti milestone!
            if (state.player.score % 2500 === 0) {
              createParticles(cw.x, cw.y, '#f6e05e', 25, 'CONFETTI');
            }

            // Move character ahead to different parts of the office!
            const currentLayout = MAPS[state.currentFloorIdx];
            if (currentLayout && currentLayout.coworkerSpawns.length > 1) {
              const playerX = state.player.x;
              const playerY = state.player.y;
              const bossX = state.boss.x;
              const bossY = state.boss.y;

              // Find coworker spawns that are far from player and safe from boss
              const candidates = currentLayout.coworkerSpawns.filter(s => {
                const distToPlayer = Math.sqrt(Math.pow(s.x - playerX, 2) + Math.pow(s.y - playerY, 2));
                const distToBoss = Math.sqrt(Math.pow(s.x - bossX, 2) + Math.pow(s.y - bossY, 2));
                return distToPlayer > 250 && distToBoss > 250;
              });

              // Fallback if no safe far ones found
              const finalCandidates = candidates.length > 0 ? candidates : currentLayout.coworkerSpawns.filter(s => {
                return Math.sqrt(Math.pow(s.x - playerX, 2) + Math.pow(s.y - playerY, 2)) > 150;
              });

              if (finalCandidates.length > 0) {
                const dest = finalCandidates[Math.floor(Math.random() * finalCandidates.length)];
                
                // Portal exit particles at previous position
                createParticles(state.player.x, state.player.y, '#38bdf8', 25, 'CONFETTI');
                createParticles(state.player.x, state.player.y, '#f59e0b', 12, 'SPARK');

                // Teleport!
                state.player.x = dest.x;
                state.player.y = dest.y;

                // Snap camera instantly to destination to avoid long, dizzying, off-screen glides
                const canvas = canvasRef.current;
                if (canvas) {
                  state.camera.x = Math.max(0, Math.min(state.mapWidth - canvas.width, dest.x - canvas.width / 2));
                  state.camera.y = Math.max(0, Math.min(state.mapHeight - canvas.height, dest.y - canvas.height / 2));
                }

                state.teleportGlow = 1.0; // Trigger visual warp animation overlay

                // Portal entry particles at destination
                createParticles(dest.x, dest.y, '#a855f7', 30, 'CONFETTI');
                createParticles(dest.x, dest.y, '#e0f2fe', 15, 'PAPER');

                // Inject coffee speed rush to escape!
                state.player.hasCoffeeRush = true;
                state.player.coffeeRushTimer = 2500; // 2.5 seconds

                // Sound effect
                soundManager.playPowerUp();

                // Warp message toast
                state.warpMessage = `🌀 VENTED TO ${dest.name.split(' ')[0].toUpperCase()}'S DESK!`;
                state.warpMessageTimer = 120;
              }
            }

            return false; // destroy airplane
          }
        }

        // Check Boss hits
        const distToBoss = Math.sqrt(Math.pow(proj.x - state.boss.x, 2) + Math.pow(proj.y - state.boss.y, 2));
        if (distToBoss < state.boss.radius + proj.radius) {
          // HIT THE BOSS!
          soundManager.playCoworkerScream();
          state.screenShake = Math.max(state.screenShake, 15);

          if (proj.type === 'STICKY_NOTE') {
            state.boss.state = BossState.BLINDED;
            state.boss.blindTimer = 200; // 3.3 seconds blind
            state.boss.alertMeter = Math.max(0, state.boss.alertMeter - 20);
            createParticles(state.boss.x, state.boss.y, '#fef08a', 20, 'CONFETTI');
          } else {
            // Throwing standard paper at boss makes them immediately CHASE you!
            state.boss.state = BossState.CHASE;
            state.boss.alertMeter = 100;
            createParticles(state.boss.x, state.boss.y, '#e53e3e', 12, 'SPARK');
          }
          return false;
        }

        return true;
      });

      // 5. UPDATE COWORKERS (NPC AI Patrols or Panics)
      state.coworkers.forEach(cw => {
        if (cw.state === 'PANICKED') {
          cw.panicTimer--;
          // Run fast away or randomly
          const runSpeed = 4.5;
          cw.x += Math.cos(cw.angle) * runSpeed;
          cw.y += Math.sin(cw.angle) * runSpeed;

          // Bounce off maps
          if (cw.x < 30 || cw.x > state.mapWidth - 30) {
            cw.angle = Math.PI - cw.angle;
            cw.x = Math.max(30, Math.min(state.mapWidth - 30, cw.x));
          }
          if (cw.y < 30 || cw.y > state.mapHeight - 30) {
            cw.angle = -cw.angle;
            cw.y = Math.max(30, Math.min(state.mapHeight - 30, cw.y));
          }

          if (cw.panicTimer <= 0) {
            cw.state = 'WORKING';
            cw.panicMessage = '';
          }
        } else {
          // Standing working / idle breathing
          cw.animationFrame = (cw.animationFrame || 0) + 0.05;
        }
      });

      // 5b. UPDATE THE ROAMING CAT AI
      const cat = state.cat;
      if (cat) {
        // Decrease meow timers
        if (cat.meowTextTimer > 0) {
          cat.meowTextTimer--;
          if (cat.meowTextTimer <= 0) {
            cat.meowText = '';
          }
        }

        cat.meowTimer--;
        if (cat.meowTimer <= 0) {
          // Meow randomly!
          const sounds = ['Meow~', 'Mew? 🐾', '*stretch*', 'Purrr...', 'Mrrph!', '*yawns*'];
          cat.meowText = sounds[Math.floor(Math.random() * sounds.length)];
          cat.meowTextTimer = 100;
          cat.meowTimer = 350 + Math.random() * 300; // meow again in 6-10 seconds
        }

        // Cat State Machine
        cat.stateTimer--;

        // Check if there are flying paper airplanes to chase!
        const airplanes = state.projectiles.filter(p => p.type !== 'STICKY_NOTE');
        if (airplanes.length > 0 && cat.state !== 'PETTED') {
          // Find closest airplane
          let closestPlane = airplanes[0];
          let minDist = Math.sqrt(Math.pow(closestPlane.x - cat.x, 2) + Math.pow(closestPlane.y - cat.y, 2));
          for (let i = 1; i < airplanes.length; i++) {
            const dist = Math.sqrt(Math.pow(airplanes[i].x - cat.x, 2) + Math.pow(airplanes[i].y - cat.y, 2));
            if (dist < minDist) {
              minDist = dist;
              closestPlane = airplanes[i];
            }
          }

          // If within 250px, chase it!
          if (minDist < 250) {
            cat.state = 'CHASING';
            cat.targetX = closestPlane.x;
            cat.targetY = closestPlane.y;
            
            // Move toward airplane
            const chaseAngle = Math.atan2(closestPlane.y - cat.y, closestPlane.x - cat.x);
            cat.angle = chaseAngle;
            cat.x += Math.cos(chaseAngle) * 3.2; // Cat runs faster when chasing!
            cat.y += Math.sin(chaseAngle) * 3.2;

            // If close enough, "pounce" and bat it down!
            if (minDist < 25) {
              // Destroy airplane with sparks!
              state.projectiles = state.projectiles.filter(p => p !== closestPlane);
              createParticles(closestPlane.x, closestPlane.y, '#f59e0b', 8, 'SPARK');
              cat.meowText = '*POUNCE!* 🐾';
              cat.meowTextTimer = 80;
              cat.state = 'ROAMING';
              cat.stateTimer = 120;
            }
          }
        }

        if (cat.state === 'PETTED') {
          // Stay still and purr
          if (cat.stateTimer <= 0) {
            cat.state = 'ROAMING';
            cat.stateTimer = 150;
          }
        } else if (cat.state === 'SLEEPING') {
          if (cat.stateTimer <= 0) {
            cat.state = 'ROAMING';
            cat.stateTimer = 200 + Math.random() * 200;
            cat.targetX = undefined;
            cat.targetY = undefined;
          }
        } else if (cat.state === 'ROAMING') {
          // Wander around
          if (!cat.targetX || !cat.targetY || cat.stateTimer <= 0) {
            // Pick a random spot nearby on map
            cat.targetX = Math.max(50, Math.min(state.mapWidth - 50, cat.x + (Math.random() - 0.5) * 300));
            cat.targetY = Math.max(50, Math.min(state.mapHeight - 50, cat.y + (Math.random() - 0.5) * 300));
            cat.stateTimer = 150 + Math.random() * 150;

            // Occasionally sleep!
            if (Math.random() < 0.2) {
              cat.state = 'SLEEPING';
              cat.stateTimer = 180 + Math.random() * 180; // sleep for 3-6 seconds
              cat.meowText = 'Zzz... 🐾';
              cat.meowTextTimer = 100;
            }
          }

          if (cat.state === 'ROAMING') {
            const distToTarget = Math.sqrt(Math.pow(cat.targetX - cat.x, 2) + Math.pow(cat.targetY - cat.y, 2));
            if (distToTarget > 15) {
              const wanderAngle = Math.atan2(cat.targetY - cat.y, cat.targetX - cat.x);
              cat.angle = wanderAngle;
              cat.x += Math.cos(wanderAngle) * cat.speed;
              cat.y += Math.sin(wanderAngle) * cat.speed;
            } else {
              cat.targetX = undefined;
              cat.targetY = undefined;
            }
          }
        }

        // Check bounds
        cat.x = Math.max(40, Math.min(state.mapWidth - 40, cat.x));
        cat.y = Math.max(40, Math.min(state.mapHeight - 40, cat.y));

        // Interact with player (Petting!)
        const distToPlayer = Math.sqrt(Math.pow(cat.x - state.player.x, 2) + Math.pow(cat.y - state.player.y, 2));
        if (distToPlayer < 42 && cat.state !== 'PETTED') {
          // Pet the cat!
          cat.state = 'PETTED';
          cat.stateTimer = 100; // 1.6 seconds petting state
          
          cat.meowText = 'Purrrr~ ❤️🐾';
          cat.meowTextTimer = 90;

          // Erupt heart particles!
          createParticles(cat.x, cat.y, '#f43f5e', 12, 'HEART');

          // Award cute bonus score!
          addScore(150);
          soundManager.playPowerUp();
        }
      }

      // 6. UPDATE BOSS PATROL & CHASE AI
      const boss = state.boss;

      // Make footsteps thud proportional to proximity
      state.bossStepTimer++;
      if (state.bossStepTimer > 25) {
        state.bossStepTimer = 0;
        const distToPlayer = Math.sqrt(Math.pow(boss.x - state.player.x, 2) + Math.pow(boss.y - state.player.y, 2));
        const maxDistanceAudible = 600;
        const volumeCoeff = Math.min(1, distToPlayer / maxDistanceAudible);
        soundManager.playFootstep(volumeCoeff);
      }

      // Boss Line-Of-Sight Check
      const hasLos = checkLineOfSight(boss.x, boss.y, state.player.x, state.player.y, state.obstacles);

      // Vision cone direction
      if (boss.state === BossState.PATROL) {
        // Direct cone facing patrol node direction
        const currentNode = boss.patrolNodes[boss.currentPatrolNodeIndex];
        const angleToNode = Math.atan2(currentNode.y - boss.y, currentNode.x - boss.x);
        // Slowly sweep vision angle around walking direction
        boss.visionAngle = angleToNode + Math.sin(state.gameTime * 0.05) * 0.4;
      } else if (boss.state === BossState.CHASE) {
        // Point vision directly at player
        boss.visionAngle = Math.atan2(state.player.y - boss.y, state.player.x - boss.x);
      }

      // Check if Player is within Boss Vision Cone
      let playerSpotted = false;
      if (hasLos && boss.state !== BossState.BLINDED) {
        const dxToPlayer = state.player.x - boss.x;
        const dyToPlayer = state.player.y - boss.y;
        const dist = Math.sqrt(dxToPlayer * dxToPlayer + dyToPlayer * dyToPlayer);

        if (dist < 350) { // Vision range
          const angleToPlayer = Math.atan2(dyToPlayer, dxToPlayer);
          let angleDiff = Math.abs(angleToPlayer - boss.visionAngle);
          // Normalize angleDiff
          while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - Math.PI * 2);

          if (angleDiff < boss.visionCone) {
            playerSpotted = true;
          }
        }
      }

      // Handle Boss states (with evolving AI behaviors per floor)
      switch (boss.state) {
        case BossState.BLINDED:
          boss.blindTimer--;
          // Wander around aimlessly and slowly
          const wanderAngle = (state.gameTime * 0.04) % (Math.PI * 2);
          boss.x += Math.cos(wanderAngle) * 0.8;
          boss.y += Math.sin(wanderAngle) * 0.8;

          if (boss.blindTimer <= 0) {
            boss.state = BossState.PATROL;
          }
          break;

        case BossState.CHASE:
          // Chase Player directly
          const chAngle = Math.atan2(state.player.y - boss.y, state.player.x - boss.x);
          boss.angle = chAngle;
          // Boss runs faster during chase, gets even speedier on higher floors
          const speedFactor = 1.45 + (activeFloorIndex * 0.05);
          boss.x += Math.cos(chAngle) * boss.speed * speedFactor;
          boss.y += Math.sin(chAngle) * boss.speed * speedFactor;

          if (playerSpotted) {
            boss.alertMeter = 100;
          } else {
            // Player broke line of sight
            boss.state = BossState.INVESTIGATE;
            localStorage.setItem('office_stat_boss_escapes', String(Number(localStorage.getItem('office_stat_boss_escapes') || 0) + 1));
            boss.investigateTimer = activeFloorIndex >= 1 ? 240 : 180; // Level 2+ searches longer!

            // Level 6: Predicts player's last known position
            if (activeFloorIndex >= 5) {
              const predictionDist = 200;
              const predictedX = state.player.x + Math.cos(state.player.angle) * predictionDist;
              const predictedY = state.player.y + Math.sin(state.player.angle) * predictionDist;
              boss.investigateTarget = {
                x: Math.max(50, Math.min(state.mapWidth - 50, predictedX)),
                y: Math.max(50, Math.min(state.mapHeight - 50, predictedY))
              };
              addFloatingPopup(boss.x, boss.y - 35, "🔮 Predicting Path!", "#f59e0b");
            } else {
              boss.investigateTarget = { x: state.player.x, y: state.player.y };
            }
          }

          // Catch Check
          const catchDist = Math.sqrt(Math.pow(boss.x - state.player.x, 2) + Math.pow(boss.y - state.player.y, 2));
          if (catchDist < boss.radius + state.player.radius) {
            handlePlayerCaught();
          }
          break;

        case BossState.INVESTIGATE:
          boss.investigateTimer--;
          if (boss.investigateTarget) {
            const invAngle = Math.atan2(boss.investigateTarget.y - boss.y, boss.investigateTarget.x - boss.x);
            boss.angle = invAngle;
            boss.x += Math.cos(invAngle) * boss.speed * 1.1;
            boss.y += Math.sin(invAngle) * boss.speed * 1.1;

            // Arrived at target location
            const targetDist = Math.sqrt(Math.pow(boss.x - boss.investigateTarget.x, 2) + Math.pow(boss.y - boss.investigateTarget.y, 2));
            if (targetDist < 30 || boss.investigateTimer <= 0) {
              boss.investigateTarget = undefined;

              // Floor 3+ Level 3: Check nearby hiding spots (cubicles, desks, computers)
              if (activeFloorIndex >= 2 && Math.random() < 0.7) {
                const nearbyObstacles = state.obstacles.filter(obs => {
                  const dist = Math.sqrt(Math.pow(boss.x - (obs.x + obs.width / 2), 2) + Math.pow(boss.y - (obs.y + obs.height / 2), 2));
                  return dist < 250;
                });
                if (nearbyObstacles.length > 0) {
                  const targetObs = nearbyObstacles[Math.floor(Math.random() * nearbyObstacles.length)];
                  boss.investigateTarget = {
                    x: targetObs.x + targetObs.width / 2,
                    y: targetObs.y + targetObs.height / 2
                  };
                  boss.investigateTimer = 150;
                  addFloatingPopup(boss.x, boss.y - 35, "🔍 Checking Cubicle!", "#f59e0b");
                } else {
                  boss.state = BossState.PATROL;
                }
              } else {
                boss.state = BossState.PATROL;
              }
            }
          }

          if (playerSpotted) {
            boss.state = BossState.CHASE;
            boss.alertMeter = 100;
            soundManager.playAlert();
          } else {
            boss.alertMeter = Math.max(0, boss.alertMeter - 0.25);
          }
          break;

        case BossState.PATROL:
        default:
          const targetNode = boss.patrolNodes[boss.currentPatrolNodeIndex];
          const patAngle = Math.atan2(targetNode.y - boss.y, targetNode.x - boss.x);
          boss.angle = patAngle;
          boss.x += Math.cos(patAngle) * boss.speed * 0.8;
          boss.y += Math.sin(patAngle) * boss.speed * 0.8;

          // Arrived at patrol node? Move to next node
          const distToNode = Math.sqrt(Math.pow(boss.x - targetNode.x, 2) + Math.pow(boss.y - targetNode.y, 2));
          if (distToNode < 25) {
            boss.currentPatrolNodeIndex = (boss.currentPatrolNodeIndex + 1) % boss.patrolNodes.length;
          }

          if (playerSpotted) {
            boss.alertMeter = Math.min(100, boss.alertMeter + (activeFloorIndex >= 4 ? 4.5 : 2.5)); // Fast rise on high floors
            if (boss.alertMeter >= 60) {
              boss.state = BossState.CHASE;
              soundManager.playAlert();

              // Floor 4+ Level 4: Spawn Security Guard
              if (activeFloorIndex >= 3 && !state.securityGuard) {
                const nodes = MAPS[state.currentFloorIdx].bossPatrolNodes;
                const farNode = nodes[nodes.length - 1];
                state.securityGuard = {
                  x: farNode.x,
                  y: farNode.y,
                  radius: 18,
                  speed: 3.5,
                  angle: 0,
                  state: 'CHASE',
                  targetNodeIdx: 0
                };
                addFloatingPopup(boss.x, boss.y - 45, "🚨 CALLING SECURITY!", "#ef4444");
              }
            }
          } else {
            boss.alertMeter = Math.max(0, boss.alertMeter - 0.15);
          }
          break;
      }

      // Constrain Boss inside walls
      boss.x = Math.max(25, Math.min(state.mapWidth - 25, boss.x));
      boss.y = Math.max(25, Math.min(state.mapHeight - 25, boss.y));

      // --- UPDATE SECURITY GUARD (Level 4, Floor 4+) ---
      if (state.securityGuard) {
        const guard = state.securityGuard;
        if (guard.state === 'CHASE') {
          const angle = Math.atan2(state.player.y - guard.y, state.player.x - guard.x);
          guard.angle = angle;
          guard.x += Math.cos(angle) * guard.speed;
          guard.y += Math.sin(angle) * guard.speed;
        } else {
          // Patrol boss nodes
          const nodes = MAPS[state.currentFloorIdx].bossPatrolNodes;
          const targetNode = nodes[guard.targetNodeIdx];
          const angle = Math.atan2(targetNode.y - guard.y, targetNode.x - guard.x);
          guard.angle = angle;
          guard.x += Math.cos(angle) * guard.speed * 0.8;
          guard.y += Math.sin(angle) * guard.speed * 0.8;

          if (Math.sqrt(Math.pow(guard.x - targetNode.x, 2) + Math.pow(guard.y - targetNode.y, 2)) < 25) {
            guard.targetNodeIdx = (guard.targetNodeIdx + 1) % nodes.length;
          }
        }

        // If boss loses track, guard patrols after 4 seconds
        if (boss.state !== BossState.CHASE && Math.random() < 0.004) {
          guard.state = 'PATROL';
        } else if (boss.state === BossState.CHASE) {
          guard.state = 'CHASE';
        }

        // Guard caught check
        const guardDist = Math.sqrt(Math.pow(guard.x - state.player.x, 2) + Math.pow(guard.y - state.player.y, 2));
        if (guardDist < guard.radius + state.player.radius) {
          handlePlayerCaught();
        }

        guard.x = Math.max(25, Math.min(state.mapWidth - 25, guard.x));
        guard.y = Math.max(25, Math.min(state.mapHeight - 25, guard.y));
      }

      // --- UPDATE SECURITY CAMERAS (Level 5, Floor 5) ---
      for (let camera of state.securityCameras) {
        // Sweep camera back and forth
        camera.angle += Math.sin(state.gameTime * camera.sweepSpeed) * 0.015;

        // Alarm status timer
        if (camera.state === 'ALARM') {
          camera.alarmTimer--;
          if (camera.alarmTimer <= 0) {
            camera.state = 'SWEEPING';
          }
        }

        // Check detection cone
        const hasCamLos = checkLineOfSight(camera.x, camera.y, state.player.x, state.player.y, state.obstacles);
        if (hasCamLos && camera.state !== 'ALARM') {
          const dx = state.player.x - camera.x;
          const dy = state.player.y - camera.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < camera.radius) {
            const angleToPlayer = Math.atan2(dy, dx);
            let diff = Math.abs(angleToPlayer - camera.angle);
            while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);

            if (diff < Math.PI / 7) { // 25 degree detection cone
              camera.state = 'ALARM';
              camera.alarmTimer = 180;
              
              if (boss.state !== BossState.CHASE) {
                boss.state = BossState.CHASE;
                boss.alertMeter = 100;
                soundManager.playAlert();
                addFloatingPopup(camera.x, camera.y, "🚨 CAM DETECTED PLAYER!", "#ef4444");
              }
            }
          }
        }
      }

      // --- UPDATE CEO BOSS (Level 7, Floor 7) ---
      if (state.ceoBoss) {
        const ceo = state.ceoBoss;
        const ceoLos = checkLineOfSight(ceo.x, ceo.y, state.player.x, state.player.y, state.obstacles);

        let ceoSpotted = false;
        if (ceoLos && ceo.state !== BossState.BLINDED) {
          const dx = state.player.x - ceo.x;
          const dy = state.player.y - ceo.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 350) {
            const angleToPlayer = Math.atan2(dy, dx);
            let diff = Math.abs(angleToPlayer - ceo.visionAngle);
            while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
            if (diff < ceo.visionCone) {
              ceoSpotted = true;
            }
          }
        }

        // CEO Footsteps
        if (state.gameTime % 25 === 0) {
          const dToPlayer = Math.sqrt(Math.pow(ceo.x - state.player.x, 2) + Math.pow(ceo.y - state.player.y, 2));
          if (dToPlayer < 500) {
            soundManager.playFootstep(0.75);
          }
        }

        switch (ceo.state) {
          case BossState.CHASE:
            const chCeoAngle = Math.atan2(state.player.y - ceo.y, state.player.x - ceo.x);
            ceo.angle = chCeoAngle;
            ceo.visionAngle = chCeoAngle;
            ceo.x += Math.cos(chCeoAngle) * ceo.speed * 1.5;
            ceo.y += Math.sin(chCeoAngle) * ceo.speed * 1.5;

            if (ceoSpotted) {
              ceo.alertMeter = 100;
            } else {
              ceo.state = BossState.INVESTIGATE;
              ceo.investigateTarget = { x: state.player.x, y: state.player.y };
              ceo.investigateTimer = 240;
            }
            break;

          case BossState.INVESTIGATE:
            ceo.investigateTimer--;
            if (ceo.investigateTarget) {
              const invCeoAngle = Math.atan2(ceo.investigateTarget.y - ceo.y, ceo.investigateTarget.x - ceo.x);
              ceo.angle = invCeoAngle;
              ceo.visionAngle = invCeoAngle;
              ceo.x += Math.cos(invCeoAngle) * ceo.speed * 1.1;
              ceo.y += Math.sin(invCeoAngle) * ceo.speed * 1.1;

              const targetDist = Math.sqrt(Math.pow(ceo.x - ceo.investigateTarget.x, 2) + Math.pow(ceo.y - ceo.investigateTarget.y, 2));
              if (targetDist < 30 || ceo.investigateTimer <= 0) {
                ceo.investigateTarget = undefined;
                ceo.state = BossState.PATROL;
              }
            }

            if (ceoSpotted) {
              ceo.state = BossState.CHASE;
              ceo.alertMeter = 100;
              soundManager.playAlert();
            } else {
              ceo.alertMeter = Math.max(0, ceo.alertMeter - 0.25);
            }
            break;

          case BossState.PATROL:
          default:
            const tNode = ceo.patrolNodes[ceo.currentPatrolNodeIndex];
            const patCeoAngle = Math.atan2(tNode.y - ceo.y, tNode.x - ceo.x);
            ceo.angle = patCeoAngle;
            ceo.visionAngle = patCeoAngle + Math.sin(state.gameTime * 0.05) * 0.4;
            ceo.x += Math.cos(patCeoAngle) * ceo.speed * 0.8;
            ceo.y += Math.sin(patCeoAngle) * ceo.speed * 0.8;

            if (Math.sqrt(Math.pow(ceo.x - tNode.x, 2) + Math.pow(ceo.y - tNode.y, 2)) < 25) {
              ceo.currentPatrolNodeIndex = (ceo.currentPatrolNodeIndex + 1) % ceo.patrolNodes.length;
            }

            if (ceoSpotted) {
              ceo.alertMeter = Math.min(100, ceo.alertMeter + 2.5);
              if (ceo.alertMeter >= 60) {
                ceo.state = BossState.CHASE;
                soundManager.playAlert();
              }
            } else {
              ceo.alertMeter = Math.max(0, ceo.alertMeter - 0.15);
            }
            break;
        }

        // CEO Catch Check
        const catchCeoDist = Math.sqrt(Math.pow(ceo.x - state.player.x, 2) + Math.pow(ceo.y - state.player.y, 2));
        if (catchCeoDist < ceo.radius + state.player.radius) {
          handlePlayerCaught();
        }

        ceo.x = Math.max(25, Math.min(state.mapWidth - 25, ceo.x));
        ceo.y = Math.max(25, Math.min(state.mapHeight - 25, ceo.y));
      }

      // --- UPDATE SLIPPERY SPOTS (Decay 45 seconds / 2700 frames) ---
      state.slipperySpots = state.slipperySpots.filter(spot => {
        spot.life--;
        return spot.life > 0;
      });

      // --- NPC COWORKERS SLIP ON SLIPPERY COFFEE SPOTS ---
      state.coworkers.forEach(cw => {
        if (cw.isSlipping) {
          cw.slipTimer = (cw.slipTimer || 0) - 1;
          cw.angle += 0.25; // Spin!
          cw.x += Math.cos(cw.slipAngle || 0) * 1.5;
          cw.y += Math.sin(cw.slipAngle || 0) * 1.5;
          if (cw.slipTimer <= 0) {
            cw.isSlipping = false;
          }
        } else {
          // Check collision with slippery spots
          state.slipperySpots.forEach(spot => {
            const dist = Math.sqrt(Math.pow(cw.x - spot.x, 2) + Math.pow(cw.y - spot.y, 2));
            if (dist < cw.radius + spot.radius) {
              cw.isSlipping = true;
              cw.slipTimer = 60; // Spin for 1 second (60 frames)
              cw.slipAngle = Math.random() * Math.PI * 2;
              createParticles(cw.x, cw.y, '#7c2d12', 6, 'COFFEE');

              // Funny panic/slipping state trigger
              cw.state = 'PANICKED';
              cw.panicTimer = 120;
              const slipPhrases = ["Whoa! Too slippery! ☕", "Ah! Coffee slick!", "Watch out! Spill! 💀", "My shoes are wet! 😭", "Need a mop! 🧼"];
              cw.panicMessage = slipPhrases[Math.floor(Math.random() * slipPhrases.length)];
            }
          });
        }
      });

      // --- BOSS SLIPS ON SLIPPERY COFFEE SPOTS ---
      if (boss.isSlipping) {
        boss.slipTimer = (boss.slipTimer || 0) - 1;
        boss.angle += 0.25; // Spin!
        boss.x += Math.cos(boss.slipAngle || 0) * 2.0;
        boss.y += Math.sin(boss.slipAngle || 0) * 2.0;
        if (boss.slipTimer <= 0) {
          boss.isSlipping = false;
        }
      } else {
        // Check collision with slippery spots
        state.slipperySpots.forEach(spot => {
          const dist = Math.sqrt(Math.pow(boss.x - spot.x, 2) + Math.pow(boss.y - spot.y, 2));
          if (dist < boss.radius + spot.radius) {
            boss.isSlipping = true;
            boss.slipTimer = 80; // Spin for 1.3 seconds
            boss.slipAngle = Math.random() * Math.PI * 2;
            createParticles(boss.x, boss.y, '#7c2d12', 12, 'COFFEE');
            addFloatingPopup(boss.x, boss.y - 35, "⚠️ BOSS SLIPPED!", "#f43f5e");
            soundManager.playSlipping();
          }
        });
      }

      // --- COFFEE RESPOND SYSTEM & DESK DECAY FADING ---
      state.obstacles.forEach(obs => {
        // Decrement fade visual effect if active
        if (obs.type === OfficeObjectType.COFFEE_MUG && obs.data) {
          if (obs.data.respawnFade && obs.data.respawnFade > 0) {
            obs.data.respawnFade--;
          }
          
          // Handle respawning if spilled
          if (obs.data.spilled) {
            if (obs.data.respawnTimer === undefined) {
              obs.data.respawnTimer = 120 * 60; // 120 seconds * 60 frames = 7200 frames
            }
            obs.data.respawnTimer--;
            if (obs.data.respawnTimer <= 0) {
              obs.data.spilled = false;
              obs.data.respawnFade = 60; // 1 second fade-in visual
              delete obs.data.respawnTimer;
              obs.health = 1; // restore health
              // Small sparkle spawn animation
              createParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, '#fbbf24', 12, 'SPARK');
            }
          }
        }
      });

      // 7. PARTICLES ENGINE UPDATE
      state.particles = state.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        p.alpha = Math.max(0, p.life / p.maxLife);

        if (p.type === 'COFFEE' || p.type === 'WATER') {
          p.vy += 0.08; // apply simple splash gravity
        }
        return p.life > 0;
      });

      // 8. UPDATE CAMERA POSITION (BOUNDED BY MAP)
      const canvas = canvasRef.current;
      if (canvas) {
        const destCamX = state.player.x - canvas.width / 2;
        const destCamY = state.player.y - canvas.height / 2;
        // Smooth camera follow
        state.camera.x += (destCamX - state.camera.x) * 0.12;
        state.camera.y += (destCamY - state.camera.y) * 0.12;

        // Clamp camera to map bounds
        state.camera.x = Math.max(0, Math.min(state.mapWidth - canvas.width, state.camera.x));
        state.camera.y = Math.max(0, Math.min(state.mapHeight - canvas.height, state.camera.y));
      }

      // Apply screen shake decay
      if (state.screenShake > 0) {
        state.screenShake *= 0.9;
        if (state.screenShake < 0.2) state.screenShake = 0;
      }

      // 9. RENDER SCENE ON HTML5 CANVAS
      renderScene();

      // Next Loop Frame
      animationId = requestAnimationFrame(updateAndRender);
    };

    const triggerComboHit = () => {
      const state = stateRef.current;
      state.comboCount++;
      state.comboTimer = 150; // 2.5s window
      state.maxComboThisGame = Math.max(state.maxComboThisGame, state.comboCount);

      if (state.comboCount >= 2) {
        addFloatingPopup(state.player.x, state.player.y - 45, `🔥 ${state.comboCount}X COMBO!`, '#fbbf24');
        incrementMissionProgress('combo_chain_4', state.comboCount);
        incrementMissionProgress('combo_chain_5', state.comboCount);
      }
    };

    const addScore = (amount: number) => {
      const state = stateRef.current;
      const comboMult = state.comboCount >= 2 ? state.comboCount : 1;
      const finalAmt = (state.player.hasGoldenStapler ? amount * 2 : amount) * comboMult;
      state.player.score += finalAmt;
      onScoreUpdate(state.player.score);

      addFloatingPopup(state.player.x, state.player.y - 25, `+${finalAmt} CHAOS`, '#f43f5e');

      incrementMissionProgress('chaos_points_200', finalAmt);
      incrementMissionProgress('chaos_points_500', finalAmt);
      incrementMissionProgress('chaos_points_700', finalAmt);
      incrementMissionProgress('chaos_points_1000', finalAmt);
      incrementMissionProgress('chaos_points_1200', finalAmt);
      incrementMissionProgress('chaos_points_1500', finalAmt);
      incrementMissionProgress('chaos_points_2000', finalAmt);
    };

    // --- CANVAS RENDERING CORE METHOD ---
    const renderScene = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const state = stateRef.current;
      const cam = state.camera;

      // Save normal transformation state before screen shake
      ctx.save();
      if (state.screenShake > 0) {
        const dx = (Math.random() - 0.5) * state.screenShake;
        const dy = (Math.random() - 0.5) * state.screenShake;
        ctx.translate(dx, dy);
      }

      // A. BACKGROUND COLOR & CARPET TILE SYSTEM
      ctx.fillStyle = '#f1f5f9'; // Cozy office slate/grey/blue light carpet
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw subtle grid texture representing carpets
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      const startGridX = Math.floor(cam.x / 40) * 40;
      const startGridY = Math.floor(cam.y / 40) * 40;

      for (let x = startGridX; x < startGridX + canvas.width + 40; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x - cam.x, 0);
        ctx.lineTo(x - cam.x, canvas.height);
        ctx.stroke();
      }
      for (let y = startGridY; y < startGridY + canvas.height + 40; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y - cam.y);
        ctx.lineTo(canvas.width, y - cam.y);
        ctx.stroke();
      }

      // B. DRAW SLIPPERY COFFEE SPOTS
      state.slipperySpots.forEach(spot => {
        const sx = spot.x - cam.x;
        const sy = spot.y - cam.y;

        // Visual fade out in the last 5 seconds (300 frames) of 45-second duration
        const opacity = Math.min(1.0, spot.life / 300);
        ctx.save();
        ctx.globalAlpha = opacity;

        // Outer organic splash brown puddle color
        ctx.fillStyle = 'rgba(120, 53, 4, 0.45)';
        ctx.beginPath();
        ctx.arc(sx, sy, spot.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw smaller coffee droplets surrounding the puddle for high fidelity splash aesthetic
        for (let i = 0; i < 4; i++) {
          const dropAngle = (i * Math.PI / 2) + (state.gameTime * 0.005);
          const dropDist = spot.radius * 1.12;
          const dx = sx + Math.cos(dropAngle) * dropDist;
          const dy = sy + Math.sin(dropAngle) * dropDist;
          ctx.beginPath();
          ctx.arc(dx, dy, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Inner richer puddle core details
        ctx.fillStyle = 'rgba(74, 22, 4, 0.65)';
        ctx.beginPath();
        ctx.arc(sx + 3, sy - 2, spot.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // High contrast yellow/orange warning indicator
        ctx.fillStyle = '#ea580c';
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText("⚠️ COFFEE SPILL", sx, sy + 3);

        ctx.restore();
      });

      // C. DRAW POWER-UPS
      state.powerUps.forEach(pu => {
        pu.pulseTimer += 0.08;
        const rPulse = pu.radius + Math.sin(pu.pulseTimer) * 3;

        // Glowing halo aura ring
        let glowColor = 'rgba(56, 189, 248, 0.2)'; // blue
        let sym = '📄';
        if (pu.type === 'COFFEE_RUSH') { glowColor = 'rgba(16, 185, 129, 0.25)'; sym = '☕'; }
        else if (pu.type === 'GOLDEN_STAPLER') { glowColor = 'rgba(245, 158, 11, 0.3)'; sym = '👑'; }
        else if (pu.type === 'STICKY_NOTES') { glowColor = 'rgba(234, 179, 8, 0.3)'; sym = '📝'; }
        else if (pu.type === 'SMOKE_BOMB') { glowColor = 'rgba(148, 163, 184, 0.3)'; sym = '💨'; }

        ctx.fillStyle = glowColor;
        ctx.beginPath();
        ctx.arc(pu.x - cam.x, pu.y - cam.y, rPulse * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Inner solid gem
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = pu.type === 'GOLDEN_STAPLER' ? '#f59e0b' : '#334155';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pu.x - cam.x, pu.y - cam.y, rPulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Emoji Icon
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sym, pu.x - cam.x, pu.y - cam.y);
      });

      // D. DRAW STATIC OBSTACLES (DESKS, CUBICLES, PLANTS, PRINTERS)
      state.obstacles.forEach(obs => {
        const ox = obs.x - cam.x;
        const oy = obs.y - cam.y;

        // Simple conditional coloring based on types
        switch (obs.type) {
          case OfficeObjectType.WALL:
            if (activeFloorIndex === 6 && obs.width === 60 && obs.height === 250) {
              // Draw a sleek high-tech server rack!
              ctx.fillStyle = '#0f172a'; // Deep background
              ctx.fillRect(ox, oy, obs.width, obs.height);
              
              // Drawn outer metallic casing
              ctx.fillStyle = '#1e293b'; 
              ctx.fillRect(ox, oy, 6, obs.height); // left frame
              ctx.fillRect(ox + obs.width - 6, oy, 6, obs.height); // right frame
              ctx.fillRect(ox, oy, obs.width, 10); // top frame
              ctx.fillRect(ox, oy + obs.height - 10, obs.width, 10); // bottom frame

              // Dark grill background
              ctx.fillStyle = '#020617';
              ctx.fillRect(ox + 6, oy + 10, obs.width - 12, obs.height - 20);

              // Server units slot segments
              ctx.fillStyle = '#1e293b';
              for (let sy = 16; sy < obs.height - 20; sy += 18) {
                ctx.fillRect(ox + 8, oy + sy, obs.width - 16, 12);
                
                // Server unit face plates
                ctx.fillStyle = '#334155';
                ctx.fillRect(ox + 10, oy + sy + 2, obs.width - 20, 8);

                // LED lights blinking
                const ledSeed = Math.sin(state.gameTime * 0.08 + obs.x + sy);
                if (ledSeed > 0.4) {
                  ctx.fillStyle = '#22c55e'; // Green LED active
                } else if (ledSeed < -0.4) {
                  ctx.fillStyle = '#ef4444'; // Red LED activity
                } else {
                  ctx.fillStyle = '#3b82f6'; // Blue LED power
                }
                ctx.fillRect(ox + 14, oy + sy + 4, 3, 3);
                
                // Second tiny LED next to it
                const ledSeed2 = Math.cos(state.gameTime * 0.12 + obs.y + sy);
                ctx.fillStyle = ledSeed2 > 0 ? '#fbbf24' : '#64748b';
                ctx.fillRect(ox + 20, oy + sy + 4, 3, 3);

                // Tiny text/grill lines
                ctx.strokeStyle = '#475569';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(ox + 28, oy + sy + 5);
                ctx.lineTo(ox + obs.width - 14, oy + sy + 5);
                ctx.stroke();
              }
            } else {
              ctx.fillStyle = '#334155'; // Dark grey/blue border wall
              ctx.fillRect(ox, oy, obs.width, obs.height);
            }
            break;

          case OfficeObjectType.DOOR:
            ctx.fillStyle = 'rgba(148, 163, 184, 0.3)'; // transparent conference meeting door
            ctx.fillRect(ox, oy, obs.width, obs.height);
            // Draw glass borders
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 1;
            ctx.strokeRect(ox, oy, obs.width, obs.height);
            break;

          case OfficeObjectType.CUBICLE_WALL:
            ctx.fillStyle = '#94a3b8'; // Grey partitions
            ctx.fillRect(ox, oy, obs.width, obs.height);
            // Top trim wood line
            ctx.fillStyle = '#64748b';
            ctx.fillRect(ox, oy, obs.width, Math.min(3, obs.height));
            break;

          case OfficeObjectType.DESK:
            ctx.fillStyle = '#a16207'; // Oak wood office desks
            ctx.fillRect(ox, oy, obs.width, obs.height);
            // Darker wood shadow/trim
            ctx.fillStyle = '#713f12';
            ctx.fillRect(ox, oy + obs.height - 4, obs.width, 4);
            break;

          case OfficeObjectType.COMPUTER:
            // Back/base
            ctx.fillStyle = '#475569';
            ctx.fillRect(ox + obs.width*0.2, oy + obs.height*0.8, obs.width*0.6, obs.height*0.2);
            // Monitor Screen
            ctx.fillStyle = obs.isHit ? '#dc2626' : '#0f172a'; // red alert or terminal screen
            ctx.fillRect(ox, oy, obs.width, obs.height * 0.75);

            // Screen code text simulation
            if (!obs.isHit) {
              ctx.fillStyle = '#22c55e'; // Green pixels
              ctx.fillRect(ox + 4, oy + 4, obs.width - 8, 2);
            }
            break;

          case OfficeObjectType.COFFEE_MUG:
            if (obs.data && !obs.data.spilled) {
              const cx = ox + obs.width / 2;
              const cy = oy + obs.height / 2;
              const rSize = 16; // Visual size is bigger, so it stands out!

              ctx.save();
              if (obs.data.respawnFade !== undefined && obs.data.respawnFade > 0) {
                ctx.globalAlpha = 1 - (obs.data.respawnFade / 60);
              }

              // Draw Mug shadow
              ctx.fillStyle = 'rgba(0,0,0,0.15)';
              ctx.beginPath();
              ctx.ellipse(cx, cy + rSize/2 - 1, rSize * 0.6, rSize * 0.25, 0, 0, Math.PI * 2);
              ctx.fill();

              // Draw Mug Ceramic body (vibrant red so it pops against grey desks!)
              ctx.fillStyle = '#ef4444'; 
              ctx.beginPath();
              ctx.arc(cx, cy + 2, rSize * 0.45, 0, Math.PI, false);
              ctx.lineTo(cx - rSize * 0.45, cy - rSize * 0.2);
              ctx.lineTo(cx + rSize * 0.45, cy - rSize * 0.2);
              ctx.closePath();
              ctx.fill();

              // Mug handle
              ctx.strokeStyle = '#ef4444';
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.arc(cx - rSize * 0.45, cy, rSize * 0.25, Math.PI * 0.5, Math.PI * 1.5, false);
              ctx.stroke();

              // Hot Coffee surface inside mug
              ctx.fillStyle = '#451a03'; // deep coffee brown
              ctx.beginPath();
              ctx.ellipse(cx, cy - rSize * 0.2, rSize * 0.38, rSize * 0.15, 0, 0, Math.PI * 2);
              ctx.fill();

              // Rising Steam effect
              const steamOffset = (state.gameTime % 60) / 60;
              ctx.strokeStyle = 'rgba(200, 200, 200, 0.4)';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              // First steam line
              ctx.moveTo(cx - 3, cy - rSize * 0.3);
              ctx.bezierCurveTo(
                cx - 5, cy - rSize * 0.5 - steamOffset * 8,
                cx - 1, cy - rSize * 0.7 - steamOffset * 8,
                cx - 3, cy - rSize * 0.9 - steamOffset * 8
              );
              // Second steam line
              ctx.moveTo(cx + 3, cy - rSize * 0.3);
              ctx.bezierCurveTo(
                ctx + 1, cy - rSize * 0.5 - steamOffset * 8,
                ctx + 5, cy - rSize * 0.7 - steamOffset * 8,
                ctx + 3, cy - rSize * 0.9 - steamOffset * 8
              );
              ctx.stroke();

              // Hover label "☕ COFFEE" when player is somewhat near (within 150px) to make it super obvious
              const distToPl = Math.sqrt(Math.pow(obs.x - state.player.x, 2) + Math.pow(obs.y - state.player.y, 2));
              if (distToPl < 150) {
                ctx.fillStyle = '#fef08a';
                ctx.font = 'bold 8px monospace';
                ctx.textAlign = 'center';
                ctx.fillText("☕ COFFEE", cx, cy - rSize * 0.95);
              }

              ctx.restore();
            }
            break;

          case OfficeObjectType.PRINTER:
            ctx.fillStyle = obs.data.jammed ? '#475569' : '#cbd5e1'; // Dark charred or clean off-white copier
            ctx.fillRect(ox, oy, obs.width, obs.height);
            // Status light led
            ctx.fillStyle = obs.data.jammed ? '#ef4444' : '#22c55e';
            ctx.beginPath();
            ctx.arc(ox + 8, oy + 8, 3, 0, Math.PI*2);
            ctx.fill();
            // Paper drawer slot
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(ox + 5, oy + obs.height - 12, obs.width - 10, 3);
            break;

          case OfficeObjectType.PLANT:
            {
              // Ceramic Pot (Tapered Terracotta)
              const pLeftTop = ox + obs.width * 0.22;
              const pRightTop = ox + obs.width * 0.78;
              const pLeftBottom = ox + obs.width * 0.32;
              const pRightBottom = obs.width * 0.68;
              const pTop = oy + obs.height * 0.5;
              const pBottom = oy + obs.height;

              // Shadow under pot
              ctx.fillStyle = 'rgba(0,0,0,0.15)';
              ctx.beginPath();
              ctx.ellipse(ox + obs.width / 2, pBottom, obs.width * 0.3, 4, 0, 0, Math.PI * 2);
              ctx.fill();

              // Pot Body
              ctx.fillStyle = '#ea580c'; // Terracotta orange
              ctx.beginPath();
              ctx.moveTo(pLeftTop, pTop);
              ctx.lineTo(pRightTop, pTop);
              ctx.lineTo(ox + pRightBottom, pBottom);
              ctx.lineTo(ox + pLeftBottom, pBottom);
              ctx.closePath();
              ctx.fill();

              // Pot Rim
              ctx.fillStyle = '#c2410c'; // Darker terracotta rim
              ctx.fillRect(ox + obs.width * 0.16, pTop, obs.width * 0.68, 5);

              // Houseplant leaves growing out of the pot center
              const cx = ox + obs.width / 2;
              const cy = pTop; // where leaves emerge

              ctx.fillStyle = '#15803d'; // Lush green forest color

              // Left leaf
              ctx.beginPath();
              ctx.ellipse(cx - 8, cy - 10, 7, 13, -Math.PI / 6, 0, Math.PI * 2);
              ctx.fill();

              // Right leaf
              ctx.beginPath();
              ctx.ellipse(cx + 8, cy - 10, 7, 13, Math.PI / 6, 0, Math.PI * 2);
              ctx.fill();

              // Center leaf
              ctx.beginPath();
              ctx.ellipse(cx, cy - 15, 8, 14, 0, 0, Math.PI * 2);
              ctx.fill();

              // Leaf highlights
              ctx.fillStyle = '#22c55e'; // Bright green
              ctx.beginPath();
              ctx.ellipse(cx - 8, cy - 11, 3.5, 9, -Math.PI / 6, 0, Math.PI * 2);
              ctx.ellipse(cx + 8, cy - 11, 3.5, 9, Math.PI / 6, 0, Math.PI * 2);
              ctx.ellipse(cx, cy - 16, 4, 10, 0, 0, Math.PI * 2);
              ctx.fill();
            }
            break;

          case OfficeObjectType.WATER_COOLER:
            // Bottom white plastic dispenser box
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(ox, oy + obs.height*0.5, obs.width, obs.height*0.5);
            if (obs.data?.broken) {
              // Shattered blue bottle with no water
              ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
              ctx.lineWidth = 1.5;
              ctx.strokeRect(ox + 3, oy + obs.height * 0.2, obs.width - 6, obs.height * 0.3);
              // Draw some blue puddle on floor
              ctx.fillStyle = 'rgba(59, 130, 246, 0.5)';
              ctx.fillRect(ox - 5, oy + obs.height - 5, obs.width + 10, 5);
            } else {
              // Blue bubbly tank bottle
              ctx.fillStyle = 'rgba(59, 130, 246, 0.7)';
              ctx.fillRect(ox + 3, oy, obs.width - 6, obs.height * 0.5);
              // Water line level curves
              ctx.fillStyle = 'rgba(59, 130, 246, 0.95)';
              ctx.fillRect(ox + 3, oy + obs.height*0.25, obs.width - 6, obs.height * 0.25);
            }
            break;

          case OfficeObjectType.CONFERENCE_TABLE:
            ctx.fillStyle = '#854d0e'; // Rich walnut brown meeting table
            ctx.fillRect(ox, oy, obs.width, obs.height);
            ctx.strokeStyle = '#451a03';
            ctx.lineWidth = 3;
            ctx.strokeRect(ox, oy, obs.width, obs.height);
            break;

          case OfficeObjectType.CONFERENCE_CHAIR:
            if (obs.data?.broken) {
              // Draw broken/shattered comfortable executive chair
              ctx.strokeStyle = '#475569';
              ctx.lineWidth = 2;
              const cx = ox + obs.width / 2;
              const cy = oy + obs.height / 2;
              const r = obs.width * 0.45;
              
              ctx.beginPath();
              ctx.arc(cx - 3, cy - 3, r * 0.4, 0.5, Math.PI);
              ctx.stroke();
              
              ctx.beginPath();
              ctx.arc(cx + 4, cy + 2, r * 0.4, Math.PI + 0.2, Math.PI * 2 - 0.5);
              ctx.stroke();
              
              // Draw some broken splinters
              ctx.fillStyle = '#334155';
              ctx.fillRect(cx - 10, cy + r - 2, 8, 2);
              ctx.fillRect(cx + 4, cy - r, 6, 2);
            } else {
              ctx.fillStyle = '#334155'; // Comfortable executive revolving chair
              ctx.beginPath();
              ctx.arc(ox + obs.width/2, oy + obs.height/2, obs.width * 0.45, 0, Math.PI * 2);
              ctx.fill();
            }
            break;
        }
      });

      // 6.5 DRAW DANGLING WIRES FOR FLOOR 7
      if (activeFloorIndex === 6) {
        // Draw sagging/dangling wires between server racks
        const wireColors = [
          'rgba(59, 130, 246, 0.85)',  // Ethernet Blue
          'rgba(239, 68, 68, 0.85)',   // Power Red
          'rgba(245, 158, 11, 0.85)',  // Yellow Data
          'rgba(34, 197, 94, 0.85)',   // Green fiber
          'rgba(168, 85, 247, 0.85)'   // Purple core
        ];

        // Define cable connections between racks
        const connections = [
          // Row 1 racks connections
          { x1: 230, y1: 200, x2: 480, y2: 220, color: 0, sag: 30 },
          { x1: 240, y1: 300, x2: 470, y2: 320, color: 1, sag: 45 },
          { x1: 480, y1: 250, x2: 920, y2: 230, color: 2, sag: 60 },
          { x1: 920, y1: 280, x2: 1170, y2: 260, color: 3, sag: 35 },
          { x1: 910, y1: 180, x2: 1160, y2: 190, color: 4, sag: 25 },

          // Row 2 racks connections
          { x1: 230, y1: 650, x2: 480, y2: 670, color: 3, sag: 40 },
          { x1: 240, y1: 750, x2: 470, y2: 770, color: 0, sag: 50 },
          { x1: 480, y1: 700, x2: 920, y2: 720, color: 4, sag: 55 },
          { x1: 920, y1: 730, x2: 1170, y2: 710, color: 1, sag: 30 },
          { x1: 910, y1: 630, x2: 1160, y2: 640, color: 2, sag: 20 },

          // Vertical/hanging down from ceiling dangling wires
          { x1: 150, y1: 0, x2: 160, y2: 120, color: 1, sag: 15, isHanging: true },
          { x1: 350, y1: 0, x2: 370, y2: 180, color: 0, sag: 20, isHanging: true },
          { x1: 580, y1: 0, x2: 590, y2: 140, color: 4, sag: 25, isHanging: true },
          { x1: 800, y1: 0, x2: 780, y2: 110, color: 2, sag: 10, isHanging: true },
          { x1: 1050, y1: 0, x2: 1080, y2: 160, color: 3, sag: 30, isHanging: true },
          { x1: 1280, y1: 0, x2: 1260, y2: 130, color: 1, sag: 22, isHanging: true },
        ];

        connections.forEach(conn => {
          const x1 = conn.x1 - cam.x;
          const y1 = conn.y1 - cam.y;
          const x2 = conn.x2 - cam.x;
          const y2 = conn.y2 - cam.y;

          ctx.beginPath();
          ctx.strokeStyle = wireColors[conn.color];
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';

          if (conn.isHanging) {
            // Draws a wire hanging loose from the ceiling that sways gently!
            const sway = Math.sin(state.gameTime * 0.02 + conn.x1) * 12;
            ctx.moveTo(x1, y1);
            // Control points for organic dangle/sway
            const cp1x = x1;
            const cp1y = y1 + (y2 - y1) * 0.5;
            const cp2x = x2 + sway * 0.5;
            const cp2y = y2 - 20;
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2 + sway, y2);
            ctx.stroke();

            // Draw a shiny silver/copper tip on the exposed end of the dangling wire!
            ctx.fillStyle = '#e2e8f0';
            ctx.beginPath();
            ctx.arc(x2 + sway, y2, 2.5, 0, Math.PI * 2);
            ctx.fill();
            
            // occasional tiny yellow spark/flash at the tip of the loose wire!
            if (Math.random() < 0.01 && state.gameTime % 20 === 0) {
              ctx.fillStyle = '#facc15';
              ctx.beginPath();
              ctx.arc(x2 + sway, y2, 5, 0, Math.PI * 2);
              ctx.fill();
            }
          } else {
            // Draw a sagging wire between two points
            ctx.moveTo(x1, y1);
            const cx = (x1 + x2) / 2;
            const cy = (y1 + y2) / 2 + conn.sag;
            ctx.quadraticCurveTo(cx, cy, x2, y2);
            ctx.stroke();
          }
        });
      }

      // DRAW THE ROAMING CAT
      const cat = state.cat;
      if (cat) {
        const cx = cat.x - cam.x;
        const cy = cat.y - cam.y;
        const r = cat.radius;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + r - 3, r * 1.0, r * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(cat.angle);

        // Tail (wiggly!)
        const tailOsc = Math.sin(state.gameTime * 0.12) * 0.3;
        ctx.strokeStyle = cat.color;
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-r * 0.7, 0);
        ctx.quadraticCurveTo(-r * 1.3, -r * 0.5 + tailOsc * 8, -r * 1.5, tailOsc * 10);
        ctx.stroke();

        // Body (Orange Tabby pill shape)
        ctx.fillStyle = cat.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.1, r * 0.75, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tabby stripes
        ctx.strokeStyle = '#c2410c'; // darker orange
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-r * 0.3, -r * 0.6);
        ctx.lineTo(-r * 0.2, -r * 0.1);
        ctx.moveTo(0, -r * 0.7);
        ctx.lineTo(0, -r * 0.1);
        ctx.moveTo(r * 0.3, -r * 0.6);
        ctx.lineTo(r * 0.2, -r * 0.1);
        ctx.stroke();

        // Cute pointy ears
        ctx.fillStyle = cat.color;
        ctx.beginPath();
        ctx.moveTo(r * 0.4, -r * 0.5);
        ctx.lineTo(r * 0.8, -r * 1.0);
        ctx.lineTo(r * 0.9, -r * 0.3);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#fecdd3'; // pink inside ear
        ctx.beginPath();
        ctx.moveTo(r * 0.5, -r * 0.48);
        ctx.lineTo(r * 0.75, -r * 0.82);
        ctx.lineTo(r * 0.8, -r * 0.35);
        ctx.closePath();
        ctx.fill();

        // Face details
        ctx.fillStyle = '#1e293b';
        if (cat.state === 'SLEEPING') {
          // Closed sleeping eyes
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(r * 0.5, -r * 0.15, 1.8, Math.PI, 0, false);
          ctx.stroke();
        } else {
          // Open big eyes
          ctx.beginPath();
          ctx.arc(r * 0.5, -r * 0.15, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }

        // Little nose
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.moveTo(r * 0.8, 0);
        ctx.lineTo(r * 0.88, -r * 0.08);
        ctx.lineTo(r * 0.88, r * 0.08);
        ctx.closePath();
        ctx.fill();

        // Whiskers
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(r * 0.7, r * 0.1);
        ctx.lineTo(r * 1.1, r * 0.25);
        ctx.moveTo(r * 0.7, 0);
        ctx.lineTo(r * 1.2, 0);
        ctx.moveTo(r * 0.7, -r * 0.1);
        ctx.lineTo(r * 1.1, -r * 0.25);
        ctx.stroke();

        ctx.restore();

        // Meow Speech Bubble
        if (cat.meowText && cat.meowTextTimer > 0) {
          const mx = cx;
          const my = cy - r * 1.3;
          
          ctx.save();
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 1.2;
          
          ctx.font = 'bold 9px sans-serif';
          const tw = ctx.measureText(cat.meowText).width;
          const padX = 8;
          const padY = 4;
          
          ctx.beginPath();
          ctx.roundRect(mx - tw / 2 - padX, my - 12 - padY, tw + padX * 2, 14 + padY * 2, 6);
          ctx.fill();
          ctx.stroke();

          // Bubble pointer
          ctx.beginPath();
          ctx.moveTo(mx - 4, my);
          ctx.lineTo(mx, my + 4);
          ctx.lineTo(mx + 4, my);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#1e293b';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(cat.meowText, mx, my - 3);
          ctx.restore();
        }
      }

      // E. DRAW COWORKERS
      state.coworkers.forEach(cw => {
        const cx = cw.x - cam.x;
        const cy = cw.y - cam.y;
        const r = cw.radius;

        // Circular Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + r - 3, r * 1.0, r * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        // Standing body (Bouncing dynamic walking oscillation)
        const bounce = cw.state === 'PANICKED' ? Math.sin(state.gameTime * 0.35) * 4 : Math.sin((cw.animationFrame || 0)) * 1.5;
        if (cw.isIntern) {
          ctx.fillStyle = '#64748b'; // Slate gray intern hoodie
        } else {
          ctx.fillStyle = cw.gender === 'MALE' ? '#1e3a8a' : '#831843'; // Blue shirt or pink skirt
        }
        ctx.beginPath();
        ctx.arc(cx, cy + 4 + bounce, r * 0.9, 0, Math.PI, false);
        ctx.lineTo(cx - r * 0.9, cy + r * 0.8 + bounce);
        ctx.lineTo(cx + r * 0.9, cy + r * 0.8 + bounce);
        ctx.closePath();
        ctx.fill();

        // Cute face circle
        ctx.fillStyle = '#ffedd5'; // Skin peach
        ctx.beginPath();
        ctx.arc(cx, cy - r * 0.3 + bounce, r * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // Draw hairs if not an intern
        if (!cw.isIntern) {
          ctx.fillStyle = '#2d3748'; // Dark charcoal hair
          if (cw.gender === 'MALE') {
            // Male hair style (Comb over / dynamic swept hair)
            ctx.beginPath();
            ctx.arc(cx, cy - r * 0.7 + bounce, r * 0.55, Math.PI * 0.9, Math.PI * 2.1);
            ctx.fill();
            // Sideburns
            ctx.fillRect(cx - r * 0.7, cy - r * 0.6 + bounce, r * 0.15, r * 0.3);
            ctx.fillRect(cx + r * 0.55, cy - r * 0.6 + bounce, r * 0.15, r * 0.3);
          } else {
            // Female hair style (Elegant hair bob / curls)
            ctx.beginPath();
            ctx.arc(cx, cy - r * 0.6 + bounce, r * 0.65, Math.PI * 0.8, Math.PI * 2.2);
            ctx.fill();
            // Curls left and right
            ctx.beginPath();
            ctx.ellipse(cx - r * 0.5, cy - r * 0.3 + bounce, r * 0.25, r * 0.45, 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(cx + r * 0.5, cy - r * 0.3 + bounce, r * 0.25, r * 0.45, -0.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Face features
        ctx.fillStyle = '#334155';
        if (cw.state === 'PANICKED') {
          // Open circles funny startled eyes
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = '#334155';
          ctx.beginPath();
          ctx.arc(cx - 3, cy - r*0.35 + bounce, 2, 0, Math.PI*2);
          ctx.arc(cx + 3, cy - r*0.35 + bounce, 2, 0, Math.PI*2);
          ctx.stroke();
          // Screaming open mouth
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.arc(cx, cy - r*0.1 + bounce, 3, 0, Math.PI*2);
          ctx.fill();
        } else {
          // Relaxed normal face
          ctx.beginPath();
          ctx.arc(cx - 3, cy - r*0.35 + bounce, 1.5, 0, Math.PI*2);
          ctx.arc(cx + 3, cy - r*0.35 + bounce, 1.5, 0, Math.PI*2);
          ctx.fill();
          // smile
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cx, cy - r*0.2 + bounce, r*0.15, 0.1, Math.PI - 0.1, false);
          ctx.stroke();
        }

        // Draw beautiful name tag above head
        ctx.fillStyle = cw.isIntern ? 'rgba(100, 116, 139, 0.85)' : 'rgba(15, 23, 42, 0.75)';
        ctx.beginPath();
        const tagText = cw.name;
        ctx.font = 'bold 9px monospace';
        const tw = ctx.measureText(tagText).width;
        ctx.roundRect(cx - (tw / 2) - 4, cy - r * 1.35 + bounce, tw + 8, 12, 3);
        ctx.fill();

        ctx.fillStyle = cw.isIntern ? '#cbd5e1' : '#fef08a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tagText, cx, cy - r * 1.35 + bounce + 6);

        // Draw cartoon panicky bubble (Larger and positioned higher)
        if (cw.state === 'PANICKED' && cw.panicMessage) {
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(cx - 62, cy - r * 3.3 + bounce, 124, 26, 6);
          ctx.fill();
          ctx.stroke();

          // Bubble pointer pointing down at coworker
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(cx - 8, cy - r * 2.3 + bounce);
          ctx.lineTo(cx, cy - r * 1.8 + bounce);
          ctx.lineTo(cx + 8, cy - r * 2.3 + bounce);
          ctx.fill();
          ctx.strokeStyle = '#1e293b';
          ctx.beginPath();
          ctx.moveTo(cx - 8, cy - r * 2.3 + bounce);
          ctx.lineTo(cx, cy - r * 1.8 + bounce);
          ctx.lineTo(cx + 8, cy - r * 2.3 + bounce);
          ctx.stroke();

          ctx.fillStyle = '#dc2626'; // Vibrant red text
          ctx.font = 'bold 12px monospace'; // Bigger text!
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(cw.panicMessage, cx, cy - r * 3.3 + bounce + 13);
        }
      });

      // F. DRAW THE BOSS VISION CONE (SWEPT ALONG PATROL OR CHASE MODE)
      const boss = state.boss;
      const bx = boss.x - cam.x;
      const by = boss.y - cam.y;

      if (boss.state !== BossState.BLINDED) {
        // Linear gradient vision sweep
        const visionGrad = ctx.createRadialGradient(bx, by, 15, bx, by, 350);
        if (boss.state === BossState.CHASE) {
          visionGrad.addColorStop(0, 'rgba(239, 68, 68, 0.4)'); // Aggressive solid chase red!
          visionGrad.addColorStop(1, 'rgba(239, 68, 68, 0.0)');
        } else {
          visionGrad.addColorStop(0, 'rgba(251, 191, 36, 0.25)'); // Suspicious yellow sweep
          visionGrad.addColorStop(1, 'rgba(251, 191, 36, 0.0)');
        }

        ctx.fillStyle = visionGrad;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.arc(
          bx, by, 350,
          boss.visionAngle - boss.visionCone,
          boss.visionAngle + boss.visionCone
        );
        ctx.closePath();
        ctx.fill();
      }

      // G. DRAW THE BOSS
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(bx, by + boss.radius - 3, boss.radius * 1.0, boss.radius * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body (Boss wears elegant formal black suit and red tie)
      const bBounce = boss.state === BossState.CHASE ? Math.sin(state.gameTime * 0.4) * 4 : Math.sin(state.gameTime * 0.08) * 1.2;
      ctx.fillStyle = boss.state === BossState.CHASE ? '#1e293b' : '#090d16'; // deep charcoal-black suit or classic pitch black suit
      ctx.beginPath();
      ctx.arc(bx, by + 4 + bBounce, boss.radius * 0.95, 0, Math.PI, false);
      ctx.lineTo(bx - boss.radius * 0.95, by + boss.radius * 0.8 + bBounce);
      ctx.lineTo(bx + boss.radius * 0.95, by + boss.radius * 0.8 + bBounce);
      ctx.closePath();
      ctx.fill();

      // Tie/Lapel
      ctx.fillStyle = '#dc2626'; // bright red angry tie
      ctx.fillRect(bx - 3, by + 6 + bBounce, 6, boss.radius * 0.5);

      // Bald head peach circle
      ctx.fillStyle = '#ffedd5';
      ctx.beginPath();
      ctx.arc(bx, by - boss.radius * 0.35 + bBounce, boss.radius * 0.75, 0, Math.PI * 2);
      ctx.fill();

      // Grey hair ring on the sides (Bald/Executive ring)
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(bx - boss.radius * 0.5, by - boss.radius * 0.35 + bBounce, boss.radius * 0.25, 0, Math.PI * 2);
      ctx.arc(bx + boss.radius * 0.5, by - boss.radius * 0.35 + bBounce, boss.radius * 0.25, 0, Math.PI * 2);
      ctx.fill();

      // Angry expressions
      ctx.fillStyle = '#0f172a';
      if (boss.state === BossState.CHASE) {
        // Red glowing demon chase eyes
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(bx - 4, by - boss.radius * 0.4 + bBounce, 3, 0, Math.PI * 2);
        ctx.arc(bx + 4, by - boss.radius * 0.4 + bBounce, 3, 0, Math.PI * 2);
        ctx.fill();

        // Angry scowling eyebrows
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(bx - 9, by - boss.radius * 0.6 + bBounce);
        ctx.lineTo(bx - 2, by - boss.radius * 0.45 + bBounce);
        ctx.moveTo(bx + 9, by - boss.radius * 0.6 + bBounce);
        ctx.lineTo(bx + 2, by - boss.radius * 0.45 + bBounce);
        ctx.stroke();
      } else {
        // Calm patrol/skeptical eyes
        ctx.beginPath();
        ctx.arc(bx - 4, by - boss.radius * 0.4 + bBounce, 2, 0, Math.PI * 2);
        ctx.arc(bx + 4, by - boss.radius * 0.4 + bBounce, 2, 0, Math.PI * 2);
        ctx.fill();

        // Heavy straight brow
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx - 8, by - boss.radius * 0.5 + bBounce);
        ctx.lineTo(bx - 2, by - boss.radius * 0.55 + bBounce);
        ctx.moveTo(bx + 8, by - boss.radius * 0.5 + bBounce);
        ctx.lineTo(bx + 2, by - boss.radius * 0.55 + bBounce);
        ctx.stroke();
      }

      // Draw Sticky Notes blindfold if Blinded
      if (boss.state === BossState.BLINDED) {
        ctx.fillStyle = '#fef08a'; // sticky note yellow square block
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 1;
        ctx.fillRect(bx - 8, by - boss.radius * 0.6 + bBounce, 16, 12);
        ctx.strokeRect(bx - 8, by - boss.radius * 0.6 + bBounce, 16, 12);

        // Sticky notes text "?"
        ctx.fillStyle = '#ca8a04';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("❔", bx, by - boss.radius * 0.4 + bBounce);
      }

      // Exclamation alert above boss's head
      if (boss.state === BossState.CHASE || boss.state === BossState.INVESTIGATE) {
        ctx.fillStyle = '#ef4444';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(bx - 12, by - boss.radius * 1.8 + bBounce, 24, 24, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("🚨", bx, by - boss.radius * 1.35 + bBounce);
      }

      // --- RENDER SECURITY GUARD (Level 4, Floor 4+) ---
      if (state.securityGuard) {
        const guard = state.securityGuard;
        const gx = guard.x - cam.x;
        const gy = guard.y - cam.y;
        const gr = guard.radius;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(gx, gy + gr - 2, gr * 1.0, gr * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Blue Uniform / Body
        const gBounce = Math.sin(state.gameTime * 0.3) * 3;
        ctx.fillStyle = '#1e3a8a'; // Security blue
        ctx.beginPath();
        ctx.arc(gx, gy + 3 + gBounce, gr * 0.95, 0, Math.PI, false);
        ctx.lineTo(gx - gr * 0.95, gy + gr * 0.8 + gBounce);
        ctx.lineTo(gx + gr * 0.95, gy + gr * 0.8 + gBounce);
        ctx.closePath();
        ctx.fill();

        // Safety Vest (High-vis neon yellow)
        ctx.fillStyle = '#eab308';
        ctx.fillRect(gx - 4, gy + 6 + gBounce, 8, gr * 0.6);

        // Head
        ctx.fillStyle = '#ffedd5';
        ctx.beginPath();
        ctx.arc(gx, gy - gr * 0.35 + gBounce, gr * 0.75, 0, Math.PI * 2);
        ctx.fill();

        // Blue Security Hat
        ctx.fillStyle = '#172554';
        ctx.fillRect(gx - gr * 0.6, gy - gr * 1.0 + gBounce, gr * 1.2, 5);
        ctx.beginPath();
        ctx.arc(gx, gy - gr * 0.9 + gBounce, gr * 0.5, Math.PI, 0, false);
        ctx.fill();

        // Badge icon or title above head
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#1e3a8a';
        ctx.lineWidth = 1;
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("👮 SEC", gx, gy - gr * 1.4 + gBounce);
      }

      // --- RENDER SECURITY CAMERAS (Level 5, Floor 5) ---
      for (let camera of state.securityCameras) {
        const cx = camera.x - cam.x;
        const cy = camera.y - cam.y;

        // Draw detection sweep cone
        ctx.fillStyle = camera.state === 'ALARM' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(59, 130, 246, 0.12)';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(
          cx, cy, camera.radius,
          camera.angle - Math.PI / 7,
          camera.angle + Math.PI / 7
        );
        ctx.closePath();
        ctx.fill();

        // Draw sweeping scan outline
        ctx.strokeStyle = camera.state === 'ALARM' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(59, 130, 246, 0.25)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw physical camera mount
        ctx.fillStyle = '#475569'; // steel mounting base
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fill();

        // Lens indicator
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(camera.angle);
        ctx.fillStyle = '#1e293b'; // lens body
        ctx.fillRect(0, -6, 16, 12);
        ctx.fillStyle = camera.state === 'ALARM' ? '#ef4444' : '#22c55e'; // status LED
        ctx.beginPath();
        ctx.arc(12, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // --- RENDER CEO BOSS (Level 7, Floor 7) ---
      if (state.ceoBoss) {
        const ceo = state.ceoBoss;
        const cx = ceo.x - cam.x;
        const cy = ceo.y - cam.y;

        // Draw CEO vision cone
        if (ceo.state !== BossState.BLINDED) {
          const ceoGrad = ctx.createRadialGradient(cx, cy, 15, cx, cy, 350);
          if (ceo.state === BossState.CHASE) {
            ceoGrad.addColorStop(0, 'rgba(225, 29, 72, 0.45)');
            ceoGrad.addColorStop(1, 'rgba(225, 29, 72, 0)');
          } else {
            ceoGrad.addColorStop(0, 'rgba(168, 85, 247, 0.25)');
            ceoGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
          }

          ctx.fillStyle = ceoGrad;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.arc(
            cx, cy, 350,
            ceo.visionAngle - ceo.visionCone,
            ceo.visionAngle + ceo.visionCone
          );
          ctx.closePath();
          ctx.fill();
        }

        // Draw Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + ceo.radius - 3, ceo.radius * 1.0, ceo.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw CEO Suit Body
        const ceoBounce = ceo.state === BossState.CHASE ? Math.sin(state.gameTime * 0.45) * 4 : Math.sin(state.gameTime * 0.08) * 1.5;
        ctx.fillStyle = '#0f172a'; // Tuxedo
        ctx.beginPath();
        ctx.arc(cx, cy + 4 + ceoBounce, ceo.radius * 0.95, 0, Math.PI, false);
        ctx.lineTo(cx - ceo.radius * 0.95, cy + ceo.radius * 0.8 + ceoBounce);
        ctx.lineTo(cx + ceo.radius * 0.95, cy + ceo.radius * 0.8 + ceoBounce);
        ctx.closePath();
        ctx.fill();

        // Gold tie
        ctx.fillStyle = '#eab308';
        ctx.fillRect(cx - 3, cy + 6 + ceoBounce, 6, ceo.radius * 0.5);

        // Head
        ctx.fillStyle = '#ffedd5';
        ctx.beginPath();
        ctx.arc(cx, cy - ceo.radius * 0.35 + ceoBounce, ceo.radius * 0.75, 0, Math.PI * 2);
        ctx.fill();

        // CEO Classy Grey Hair
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.arc(cx, cy - ceo.radius * 0.8 + ceoBounce, ceo.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Badge above CEO
        ctx.fillStyle = '#fef08a';
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 1.5;
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("👑 CEO", cx, cy - ceo.radius * 1.4 + ceoBounce);
      }

      // --- RENDER FLOATING POPUPS ---
      for (let popup of state.activePopups) {
        const rx = popup.x - cam.x;
        const ry = popup.y - cam.y;

        ctx.font = 'bold 15px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText(popup.text, rx, ry);

        ctx.fillStyle = popup.color;
        ctx.fillText(popup.text, rx, ry);
      }

      // H. DRAW PLAYER CHARACTER
      const player = state.player;
      const px = player.x - cam.x;
      const py = player.y - cam.y;
      const pr = player.radius;

      // Circular shadow
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath();
      ctx.ellipse(px, py + pr - 3, pr * 1.1, pr * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();

      // Glow halo trails if player has special active power-ups
      if (player.hasCoffeeRush) {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.2)'; // Green energy speed aura
        ctx.beginPath();
        ctx.arc(px, py, pr * 1.5, 0, Math.PI*2);
        ctx.fill();
      }
      if (player.hasGoldenStapler) {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.2)'; // Golden point multiplier aura
        ctx.beginPath();
        ctx.arc(px, py, pr * 1.6, 0, Math.PI*2);
        ctx.fill();
      }

      // Body (Equipped Outfit Color)
      const isMoving = state.keys['w'] || state.keys['s'] || state.keys['a'] || state.keys['d'] ||
                      state.keys['arrowup'] || state.keys['arrowdown'] || state.keys['arrowleft'] || state.keys['arrowright'] ||
                      (state.touchPath && state.touchPath.length > 0);
      const pBounce = player.isSlipping ? Math.sin(state.gameTime * 0.5) * 6 : (isMoving ? Math.sin(state.gameTime * 0.2) * 2.5 : 0);
      const equippedOutfit = OUTFITS.find(o => o.id === player.selectedOutfit) || OUTFITS[0];

      // Body (Equipped Outfit Color)
      ctx.fillStyle = equippedOutfit.color;
      ctx.beginPath();
      ctx.arc(px, py + 4 + pBounce, pr * 0.95, 0, Math.PI, false);
      ctx.lineTo(px - pr * 0.95, py + pr * 0.8 + pBounce);
      ctx.lineTo(px + pr * 0.95, py + pr * 0.8 + pBounce);
      ctx.closePath();
      ctx.fill();

      // Tie / Outfit Decorator
      ctx.fillStyle = equippedOutfit.accentColor;
      if (player.selectedOutfit === 'manager_suit') {
        ctx.beginPath();
        ctx.moveTo(px - 3, py + 4 + pBounce);
        ctx.lineTo(px + 3, py + 4 + pBounce);
        ctx.lineTo(px + 4, py + pr * 0.6 + pBounce);
        ctx.lineTo(px, py + pr * 0.8 + pBounce);
        ctx.lineTo(px - 4, py + pr * 0.6 + pBounce);
        ctx.closePath();
        ctx.fill();
      } else {
        // Striping / shirt decoration
        ctx.fillRect(px - pr*0.3, py + 4 + pBounce, pr*0.6, pr*0.15);
      }

      // Skin head circle
      ctx.fillStyle = '#fed7aa'; // light healthy orange/peach
      ctx.beginPath();
      ctx.arc(px, py - pr * 0.45 + pBounce, pr * 0.75, 0, Math.PI * 2);
      ctx.fill();

      // Eyes & Expressions
      ctx.fillStyle = '#1e293b';
      if (player.isSlipping) {
        // Starry shocked x x eyes
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("😵", px, py - pr * 0.4 + pBounce);
      } else {
        // Smiling focused eyes
        ctx.beginPath();
        ctx.arc(px - 3, py - pr*0.5 + pBounce, 1.5, 0, Math.PI*2);
        ctx.arc(px + 3, py - pr*0.5 + pBounce, 1.5, 0, Math.PI*2);
        ctx.fill();

        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(px, py - pr*0.3 + pBounce, pr*0.18, 0.1, Math.PI - 0.1, false);
        ctx.stroke();
      }

      // Equipped Hat Drawing
      const equippedHat = HATS.find(h => h.id === player.selectedHat);
      if (equippedHat) {
        ctx.save();
        equippedHat.draw(ctx, px, py - pr * 0.9 + pBounce, pr * 0.75);
        ctx.restore();
      }

      // Draw Player's Username Tag Above Head/Hat
      ctx.save();
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      const displayName = username || 'unpaid intern';
      const nameTagWidth = ctx.measureText(displayName).width;
      const padX = 6;
      const padY = 3;
      const tagY = py - pr * 1.5 - (equippedHat ? 8 : 0) + pBounce;

      // Small translucent dark background tag
      ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(px - nameTagWidth / 2 - padX, tagY - 6 - padY, nameTagWidth + padX * 2, 12 + padY * 2, 4);
      ctx.fill();
      ctx.stroke();

      // Yellow/White high-contrast name text
      ctx.fillStyle = '#fef08a'; // bright yellow so the active player is immediately clear!
      ctx.fillText(displayName, px, tagY + 2);
      ctx.restore();

      // Draw warp message toast if active
      if (state.warpMessage && state.warpMessageTimer && state.warpMessageTimer > 0) {
        ctx.save();
        ctx.globalAlpha = Math.min(1.0, state.warpMessageTimer / 20); // Nice smooth fade out
        ctx.font = 'bold 10px sans-serif';
        const textWidth = ctx.measureText(state.warpMessage).width;

        // Draw pill background
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)'; // Slate 900 translucent
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.8)'; // Purple border
        ctx.lineWidth = 1.5;
        
        const bbx = px - textWidth / 2 - 12;
        const bby = py - pr * 2.2 - 20 + pBounce;
        const bbw = textWidth + 24;
        const bbh = 22;
        const bbrad = 11;
        
        ctx.beginPath();
        ctx.roundRect(bbx, bby, bbw, bbh, bbrad);
        ctx.fill();
        ctx.stroke();

        // Draw text
        ctx.fillStyle = '#fef08a'; // Bright yellow
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(state.warpMessage, px, bby + bbh / 2);
        ctx.restore();
      }

      // I. DRAW PROJECTILES (PAPER AIRPLANES OR STICKY NOTES)
      state.projectiles.forEach(proj => {
        const xproj = proj.x - cam.x;
        const yproj = proj.y - cam.y;

        ctx.save();
        ctx.translate(xproj, yproj);
        ctx.rotate(proj.angle);

        if (proj.type === 'STICKY_NOTE') {
          // Sleek paper airplane with yellow sticky note accent color!
          ctx.fillStyle = '#fef08a';
          ctx.strokeStyle = '#eab308';
          ctx.lineWidth = 1.6;

          ctx.beginPath();
          ctx.moveTo(13, 0);       // Nose
          ctx.lineTo(-12, -8);     // Left wingtips
          ctx.lineTo(-8, 0);      // Inner body fold
          ctx.lineTo(-12, 8);      // Right wingtips
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Center spine crease line
          ctx.beginPath();
          ctx.moveTo(13, 0);
          ctx.lineTo(-8, 0);
          ctx.stroke();
        } else {
          // Sleek classic white paper airplane triangle paths (scaled up for high visibility!)
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#64748b'; // slightly darker grey for better floor contrast
          ctx.lineWidth = 1.6;

          ctx.beginPath();
          ctx.moveTo(13, 0);       // Nose
          ctx.lineTo(-12, -8);     // Left wingtips
          ctx.lineTo(-8, 0);      // Inner body fold
          ctx.lineTo(-12, 8);      // Right wingtips
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Center spine crease line
          ctx.beginPath();
          ctx.moveTo(13, 0);
          ctx.lineTo(-8, 0);
          ctx.stroke();
        }
        ctx.restore();
      });

      // I.4 DRAW DRAG TRAIL (GLOWING MOTION RIBBON)
      if (state.dragTrail && state.dragTrail.length > 1) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (let i = 1; i < state.dragTrail.length; i++) {
          const p1 = state.dragTrail[i - 1];
          const p2 = state.dragTrail[i];
          const alpha = (i / state.dragTrail.length) * 0.45;
          ctx.strokeStyle = `rgba(57, 255, 20, ${alpha})`;
          ctx.lineWidth = 12 * (i / state.dragTrail.length);
          ctx.beginPath();
          ctx.moveTo(p1.x - cam.x, p1.y - cam.y);
          ctx.lineTo(p2.x - cam.x, p2.y - cam.y);
          ctx.stroke();
        }
        ctx.restore();
      }

      // I.5 DRAW TOUCH PATH, TAP RIPPLE & TARGET HIGHLIGHTS
      if (state.touchPath && state.touchPath.length > 0 && !state.isDraggingActive) {
        ctx.save();
        ctx.strokeStyle = 'rgba(57, 255, 20, 0.35)'; // Bright translucent neon green path
        ctx.lineWidth = 2.0;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(state.player.x - cam.x, state.player.y - cam.y);
        for (const wp of state.touchPath) {
          ctx.lineTo(wp.x - cam.x, wp.y - cam.y);
        }
        ctx.stroke();
        ctx.restore();
      }

      if (state.touchRipple && state.touchRipple.timer > 0) {
        ctx.save();
        const ripple = state.touchRipple;
        const rx = ripple.x - cam.x;
        const ry = ripple.y - cam.y;
        const pct = 1 - (ripple.timer / ripple.maxTimer); // 0 to 1
        const radius = 28 * pct;
        const alpha = 1 - pct;

        ctx.strokeStyle = `rgba(57, 255, 20, ${alpha})`; // Bright neon green ripple
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(rx, ry, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner solid dot
        ctx.fillStyle = `rgba(57, 255, 20, ${alpha * 0.4})`;
        ctx.beginPath();
        ctx.arc(rx, ry, 6 * (1 - pct), 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        ripple.timer--;
      }

      if (state.activeTargetHighlight && state.activeTargetHighlight.timer > 0) {
        ctx.save();
        const hl = state.activeTargetHighlight;
        const hlx = hl.x - cam.x;
        const hly = hl.y - cam.y;
        const pulse = 1 + Math.sin(state.gameTime * 0.3) * 0.12;
        const angle = state.gameTime * 0.05; // spinning reticle!

        // Outer red pulsing reticle
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 8]);
        ctx.beginPath();
        ctx.arc(hlx, hly, hl.radius * pulse, angle, angle + Math.PI * 2);
        ctx.stroke();

        // Inner four target brackets
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.8)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([]);
        const bracketLen = 8;
        const innerRad = hl.radius * pulse * 0.7;

        for (let a = 0; a < 4; a++) {
          const baseAngle = angle + (Math.PI / 2) * a;
          const bx = hlx + Math.cos(baseAngle) * innerRad;
          const by = hly + Math.sin(baseAngle) * innerRad;
          
          ctx.beginPath();
          ctx.moveTo(bx - Math.cos(baseAngle) * bracketLen, by - Math.sin(baseAngle) * bracketLen);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }

        ctx.restore();
        hl.timer--;
      }

      // J. DRAW PARTICLES
      state.particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;

        if (p.type === 'CONFETTI') {
          // Rotating colorful squares
          ctx.translate(p.x - cam.x, p.y - cam.y);
          ctx.rotate(state.gameTime * 0.15);
          ctx.fillRect(-p.radius, -p.radius, p.radius * 2, p.radius * 2);
        } else if (p.type === 'LEAF') {
          // Twisting organic leaf shape
          ctx.translate(p.x - cam.x, p.y - cam.y);
          ctx.rotate(state.gameTime * 0.08);
          ctx.beginPath();
          ctx.ellipse(0, 0, p.radius * 1.5, p.radius * 0.7, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Falling circular droplet splash or spark puff
          ctx.beginPath();
          ctx.arc(p.x - cam.x, p.y - cam.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });
      
      // L. DRAW TELEPORT WARP TRANSITION EFFECT
      if (state.teleportGlow > 0) {
        ctx.save();
        ctx.globalAlpha = state.teleportGlow;
        // Radial gradient centered on the player
        const px = state.player.x - cam.x;
        const py = state.player.y - cam.y;
        const grad = ctx.createRadialGradient(px, py, 10, px, py, 150);
        grad.addColorStop(0, 'rgba(168, 85, 247, 0.45)');
        grad.addColorStop(0.5, 'rgba(56, 189, 248, 0.25)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, 200, 0, Math.PI * 2);
        ctx.fill();
        
        // Dynamic circular expanding ripple line
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 3 * state.teleportGlow;
        ctx.beginPath();
        ctx.arc(px, py, 150 * (1 - state.teleportGlow), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Restore normal transformations
      ctx.restore();

      // Red flash screen overlay when caught
      if (state.redFlashTimer > 0) {
        ctx.save();
        ctx.fillStyle = `rgba(239, 68, 68, ${Math.min(0.5, state.redFlashTimer / 40)})`; // Max 50% opacity red flash fading out
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
    };

    // Trigger animation frame loop
    animationId = requestAnimationFrame(updateAndRender);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [gameState, roundIndex, currentHat, currentOutfit, isIntroActive]);

  return (
    <div id="game_layout_wrapper" className="w-full flex flex-col md:flex-row gap-4 items-stretch select-none">
      {/* LEFT CANVAS STAGE PANEL */}
      <div id="canvas_stage_panel" className="relative flex-1 bg-slate-950 border-4 border-slate-800 rounded-2xl shadow-2xl overflow-hidden aspect-[4/3] max-h-[640px] md:max-h-none">
        <canvas
          id="office_canvas"
          ref={canvasRef}
          width={800}
          height={600}
          className="w-full h-full block bg-slate-900 cursor-crosshair"
        />

        {/* PORTRAIT ENFORCEMENT OVERLAY */}
        <AnimatePresence>
          {isPortrait && (
            <motion.div
              id="portrait_enforcement_overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 z-55 select-none no-select-touch"
            >
              <div className="space-y-6 max-w-sm flex flex-col items-center">
                <div className="w-24 h-24 flex items-center justify-center text-amber-400 bg-amber-500/10 rounded-full border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <svg
                    className="w-12 h-12 animate-rotate-phone text-amber-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                    <line x1="12" y1="18" x2="12" y2="18.01" strokeWidth={3} strokeLinecap="round" />
                  </svg>
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-black font-mono tracking-tight text-white uppercase">
                    📱 Rotate your device
                  </h2>
                  <p className="text-xs font-mono text-slate-400 leading-relaxed">
                    The game is only playable in landscape orientation. Please rotate your phone or screen to continue your office chaos!
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* BOSS AGGRESSION WARNING FLASH */}
        {bossStatus === BossState.CHASE && (
          <div id="chase_flash_border" className="absolute inset-0 border-4 border-red-600/60 pointer-events-none animate-pulse z-25"></div>
        )}

        {/* ON-SCREEN SUSPICION ALERTS OVERLAY */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none z-30 font-mono">
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            {/* SKEPTICAL BOSS ALERTMETER PANEL */}
            <div className="flex items-center gap-3 bg-slate-950/90 border-2 border-slate-700/80 px-4 py-2.5 rounded-xl shadow-lg shrink-0">
              <span className="text-xs font-black text-slate-300 flex items-center gap-1.5">
                👮 BOSS SIGHTING:
              </span>
              <div className="w-28 h-3.5 bg-slate-800 border border-slate-700 rounded-full overflow-hidden relative">
                <div
                  id="alert_meter_bar"
                  className={`h-full rounded-full transition-all duration-100 ${
                    hudAlert >= 80 ? 'bg-red-500 animate-pulse' : hudAlert >= 50 ? 'bg-amber-500' : 'bg-sky-500'
                  }`}
                  style={{ width: `${hudAlert}%` }}
                />
              </div>
              <span className={`text-xs font-black shrink-0 ${
                hudAlert >= 80 ? 'text-red-400 font-extrabold animate-pulse' : hudAlert >= 50 ? 'text-amber-400' : 'text-sky-400'
              }`}>
                {hudAlert}%
              </span>
            </div>

            {/* LIVES SYSTEM HEART HUD */}
            {!isEndless && (
              <div id="lives_hud_panel" className="flex items-center gap-2 bg-slate-950/90 border-2 border-slate-700/80 px-4 py-2.5 rounded-xl shadow-lg shrink-0 select-none">
                <span className="text-xs font-black text-slate-300 flex items-center gap-1.5">
                  ❤️ LIVES:
                </span>
                <div className="flex gap-2 items-center">
                  {[0, 1].map((i) => {
                    const active = i < hudLives;
                    return (
                      <motion.span
                        key={i}
                        id={`heart_icon_${i}`}
                        animate={active ? { scale: [1, 1.15, 1] } : { scale: [1, 1.5, 0.85], opacity: [1, 0.3, 0.4] }}
                        transition={active ? { repeat: Infinity, duration: 1.5, repeatDelay: 1 } : { duration: 0.4 }}
                        className={`text-xl inline-block ${
                          active 
                            ? 'text-red-500 filter drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]' 
                            : 'text-slate-700'
                        }`}
                      >
                        ❤️
                      </motion.span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ACTIVE POWERUP STATUS */}
          <div className="flex flex-col gap-1.5 items-end">
            {hudPaperTime > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-sky-950/90 border border-sky-500 text-sky-400 text-[10px] font-black rounded-lg shadow-md">
                <span>📄 PAPERS INF:</span>
                <span className="bg-sky-500 text-slate-950 px-1 rounded-sm">{hudPaperTime}s</span>
              </div>
            )}
            {hudSpeedTime > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-950/90 border border-emerald-500 text-emerald-400 text-[10px] font-black rounded-lg shadow-md">
                <span>☕ COFFEE RUSH:</span>
                <span className="bg-emerald-500 text-slate-950 px-1 rounded-sm">{hudSpeedTime}s</span>
              </div>
            )}
            {hudGoldTime > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-950/90 border border-amber-500 text-amber-400 text-[10px] font-black rounded-lg shadow-md">
                <span>👑 GOLD MULTIPLIER:</span>
                <span className="bg-amber-500 text-slate-950 px-1 rounded-sm">{hudGoldTime}s</span>
              </div>
            )}
            {hudComputerTimer > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-purple-950/90 border-2 border-purple-500 text-purple-400 text-[10px] font-black rounded-lg shadow-md animate-pulse">
                <span>🔧 IT REPLACEMENTS:</span>
                <span className="bg-purple-500 text-slate-950 px-1 rounded-sm">{hudComputerTimer}s</span>
              </div>
            )}
          </div>
        </div>

        {/* BOSS STATE INDICATOR FLOATER */}
        <div className="absolute bottom-4 left-4 pointer-events-none z-30 font-mono">
          <div className={`px-3.5 py-1.5 rounded-lg border text-xs font-bold shadow-md flex items-center gap-2 bg-slate-950/90 ${
            bossStatus === BossState.CHASE
              ? 'border-red-600 text-red-500 animate-pulse'
              : bossStatus === BossState.INVESTIGATE
              ? 'border-amber-500 text-amber-500'
              : bossStatus === BossState.BLINDED
              ? 'border-yellow-400 text-yellow-400'
              : 'border-slate-700 text-slate-400'
          }`}>
            <Shield size={14} className={bossStatus === BossState.CHASE ? 'animate-spin' : ''} />
            <span>
              BOSS STATE: {bossStatus.toUpperCase()}
            </span>
          </div>
        </div>

        {/* RESUME COUNTDOWN OVERLAY */}
        {caughtResumeTimerState > 0 && (
          <div
            id="resume_countdown_overlay"
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6 z-40 select-none"
          >
            <div className="space-y-4">
              <div className="text-red-500 font-extrabold text-xl md:text-2xl font-mono tracking-wide">
                💥 You narrowly escaped! One life remaining.
              </div>
              <div className="text-xs text-slate-400 font-mono tracking-wider">
                BRACE YOURSELF! RESUMING IN
              </div>
              <div className="text-7xl font-black font-mono text-amber-400 select-none">
                {caughtResumeTimerState}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FLOOR CLEARED CELEBRATORY OVERLAY */}
      {stateRef.current.floorClearedAnimationTimer > 0 && (
        <div id="floor_cleared_overlay" className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-50 select-none">
          <div className="space-y-4 max-w-md">
            <div className="inline-flex p-4 bg-amber-500/20 border-2 border-amber-500 rounded-full text-amber-400 animate-pulse">
              <Flame size={48} />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold font-mono text-amber-400 tracking-wider animate-bounce">
              {activeFloorIndex === 6 ? "GAME COMPLETED!" : "FLOOR CLEARED!"}
            </h1>
            <p className="text-sm font-bold font-mono text-sky-400 uppercase tracking-widest">
              {activeFloorIndex === 6 ? "Ultimate Office Chaos Achieved!" : "All Corporate Missions Cleared!"}
            </p>
            <div className="text-xs text-slate-400 bg-slate-900 border border-slate-800 p-3.5 rounded-xl font-mono leading-relaxed">
              {activeFloorIndex === 6 ? (
                <span>🎉 INCREDIBLE! You have fully compromised Floor 7 (IT Server Room) and conquered all office floors! Prepare to read the final corporate news reports on your historic mischief...</span>
              ) : (
                <span>🎉 Awesome work! Floor {activeFloorIndex + 1} has been fully compromised. Saving progress... The next floor is now unlocked.</span>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center">
              <button
                onClick={onNextFloor}
                className="w-full sm:w-auto px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-lg active:scale-95 hover:scale-[1.01]"
              >
                {activeFloorIndex === 6 ? "See Final Report ➔" : "Next Floor ➔"}
              </button>
              {activeFloorIndex !== 6 && (
                <button
                  onClick={onCallItADay}
                  className="w-full sm:w-auto px-6 py-3 bg-transparent hover:bg-slate-850 border border-slate-800 text-slate-500 hover:text-slate-300 font-mono font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-md active:scale-95"
                >
                  Call It A Day
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RIGHT METRICS SIDEBAR / PERMANENT MISSION BOARD */}
      <div id="metrics_sidebar" className="w-full md:w-64 bg-slate-900 border-4 border-slate-800 rounded-2xl shadow-xl p-5 text-slate-200 font-sans flex flex-col justify-between relative overflow-hidden">
        {/* Subtle background lines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:12px_12px] pointer-events-none"></div>

        <div className="relative z-10 space-y-4 flex-1 flex flex-col justify-between">
          <div>
            {/* Floor Header Info */}
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-xs text-sky-400 font-black font-mono uppercase tracking-widest">
                Floor {activeFloorIndex + 1}
              </h3>
              <h2 className="text-lg font-black font-mono tracking-tight text-amber-400 mt-0.5 leading-tight">
                {MAPS[activeFloorIndex].floorName.split(': ')[1]}
              </h2>
              <p className="text-[10px] text-slate-400 leading-snug mt-1 font-sans font-medium">
                {MAPS[activeFloorIndex].floorDesc}
              </p>
            </div>

            {/* Real-time score readout */}
            <div className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl text-center space-y-1 mt-3">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">Chaos Score</span>
              <div id="hud_score_readout" className="text-2xl font-black font-mono text-white tracking-tight flex items-center justify-center gap-1">
                {hudScore.toLocaleString()}
              </div>
            </div>

            {/* ACTIVE MISSION OBJECTIVES (Permanent Panel) */}
            <div className="border-t border-slate-800 pt-3.5 mt-3 space-y-2">
              <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider block font-mono">
                {isEndless ? "♾️ Endless Chaos Mode" : "🎯 Floor Missions"}
              </span>
              <div className="space-y-1.5 font-mono text-xs">
                {isEndless ? (
                  <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-950/20 text-purple-200">
                    <p className="text-[11px] leading-relaxed text-purple-300">
                      No missions, no limits! Create infinite office panic and run wild! 🚀
                    </p>
                  </div>
                ) : (
                  stateRef.current.missions.map((m, idx) => (
                    <div
                      key={m.id || idx}
                      className={`p-2 rounded-lg border transition-all ${
                        m.completed
                          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 line-through opacity-85'
                          : 'bg-slate-950/70 border-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-[10px] leading-tight font-medium">{m.description}</span>
                        <span className={`text-[9px] font-bold shrink-0 ${m.completed ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {m.completed ? '✓' : `${m.currentProgress}/${m.targetValue}`}
                        </span>
                      </div>
                      {/* Tiny progress bar */}
                      {!m.completed && (
                        <div className="w-full h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="h-full bg-amber-500 transition-all duration-300"
                            style={{ width: `${Math.min(100, (m.currentProgress / m.targetValue) * 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Quick Shortcuts */}
          {isTouchDeviceState ? (
            <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800 space-y-1 text-[9px] font-mono text-slate-400 mt-2">
              <div>👇 <strong className="text-slate-300">TAP FLOOR</strong> - Walk & avoid obstacles</div>
              <div>🎯 <strong className="text-slate-300">TAP TARGET</strong> - Auto-aim & throw</div>
            </div>
          ) : (
            <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800 space-y-1 text-[9px] font-mono text-slate-400 mt-2">
              <div>⌨️ <strong className="text-slate-300">WASD</strong> - Move employee</div>
              <div>🖱️ <strong className="text-slate-300">AIM + CLICK</strong> - Throw plane</div>
            </div>
          )}
        </div>

        <button
          id="pause_game_btn"
          onClick={onPauseToggle}
          className="relative z-10 w-full mt-4 flex items-center justify-center gap-1.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono font-bold text-xs rounded-xl border border-slate-700 transition-colors active:scale-95 cursor-pointer"
        >
          <span>⏸️ PAUSE CHAOS</span>
        </button>
      </div>
    </div>
  );
}
