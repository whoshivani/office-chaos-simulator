export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAMEOVER = 'GAMEOVER',
  OUTFITS = 'OUTFITS',
  HOWTOPLAY = 'HOWTOPLAY',
  COMPLETED = 'COMPLETED'
}

export enum BossState {
  PATROL = 'PATROL',
  INVESTIGATE = 'INVESTIGATE',
  CHASE = 'CHASE',
  BLINDED = 'BLINDED'
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface Hat {
  id: string;
  name: string;
  description: string;
  requiredScore: number;
  color: string;
  draw: (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) => void;
}

export interface Outfit {
  id: string;
  name: string;
  description: string;
  requiredScore: number;
  color: string;
  accentColor: string;
}

export interface Character {
  id: string;
  x: number;
  y: number;
  radius: number;
  speed: number;
  angle: number;
  targetX?: number;
  targetY?: number;
  isHit?: boolean;
  hitTimer?: number;
  animationFrame?: number;
  isSlipping?: boolean;
  slipTimer?: number;
  slipAngle?: number;
}

export interface Player extends Character {
  selectedHat?: string;
  selectedOutfit?: string;
  score: number;
  paperCount: number;
  hasInfinitePaper: boolean;
  infinitePaperTimer: number;
  hasCoffeeRush: boolean;
  coffeeRushTimer: number;
  hasGoldenStapler: boolean;
  goldenStaplerTimer: number;
  isSlipping: boolean;
  slipTimer: number;
  slipAngle: number;
}

export interface Boss extends Character {
  state: BossState;
  alertMeter: number; // 0 to 100
  visionAngle: number; // central aiming angle
  visionCone: number; // sweep width in radians
  investigateTarget?: Vector2D;
  investigateTimer: number;
  blindTimer: number;
  patrolNodes: Vector2D[];
  currentPatrolNodeIndex: number;
}

export interface Coworker extends Character {
  name: string;
  deskId?: string;
  state: 'WORKING' | 'PANICKED' | 'WANDERING';
  panicTimer: number;
  panicMessage: string;
  wanderTimer: number;
  gender: 'MALE' | 'FEMALE';
  isIntern?: boolean;
  originalName?: string;
}

export enum OfficeObjectType {
  CUBICLE_WALL = 'CUBICLE_WALL',
  DESK = 'DESK',
  COMPUTER = 'COMPUTER',
  COFFEE_MUG = 'COFFEE_MUG',
  PRINTER = 'PRINTER',
  PLANT = 'PLANT',
  WATER_COOLER = 'WATER_COOLER',
  CONFERENCE_TABLE = 'CONFERENCE_TABLE',
  CONFERENCE_CHAIR = 'CONFERENCE_CHAIR',
  WALL = 'WALL',
  DOOR = 'DOOR'
}

export interface OfficeObject {
  id: string;
  type: OfficeObjectType;
  x: number;
  y: number;
  width: number;
  height: number;
  isHit: boolean;
  hitTimer: number;
  health: number; // For multi-hit objects
  data?: any; // Custom metadata, e.g. whether coffee spilled, printer jammed, etc.
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  type: 'PAPER_AIRPLANE' | 'STICKY_NOTE';
  angle: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'PAPER' | 'SPARK' | 'COFFEE' | 'LEAF' | 'WATER' | 'CONFETTI' | 'SMOKE' | 'SHADOW' | 'HEART';
}

export interface Cat {
  id: string;
  x: number;
  y: number;
  radius: number;
  speed: number;
  angle: number;
  state: 'ROAMING' | 'SLEEPING' | 'CHASING' | 'PETTED';
  stateTimer: number;
  targetX?: number;
  targetY?: number;
  meowTimer: number;
  meowText?: string;
  meowTextTimer: number;
  color: string;
}

export interface PowerUp {
  id: string;
  type: 'INFINITE_PAPER' | 'COFFEE_RUSH' | 'SMOKE_BOMB' | 'GOLDEN_STAPLER' | 'STICKY_NOTES';
  x: number;
  y: number;
  radius: number;
  pulseTimer: number;
  duration: number; // Duration of effect in ms
}

export interface SlipperySpot {
  id: string;
  x: number;
  y: number;
  radius: number;
  life: number; // Fade out over time
}
