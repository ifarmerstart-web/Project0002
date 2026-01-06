export interface Crop {
  id: string;
  name: string;
  emoji: string; // Keeping for fallback or text contexts
  imageUrl: string; // New image asset path
  growthTime: number; // in seconds
  seedPrice: number;
  baseSellPrice: number;
  category: 'Vegetable' | 'Fruit' | 'Flower' | 'Fantasy';
}

export interface Cell {
  id: string;
  x: number;
  y: number;
  isUnlocked: boolean;
  cropId: string | null;
  plantedAt: number | null; // timestamp
  isInfested?: boolean; // Currently under attack by bug (Bug present)
  isPestDamaged?: boolean; // Result of successful bug attack (50% value loss)
  isRuined?: boolean; // Crop lost (e.g. by UFO or old logic)
  bingoMultiplier?: number; // 1 = Normal, 1.5 = 3-line, 2 = 4-line, etc. Stacks.
  bingoGroupId?: string; // ID for a connected group of bingo tiles (Mass Harvest)
}

export interface BingoLine {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  type: 'horizontal' | 'vertical' | 'diagonal';
}

export interface Bug {
  id: string;
  targetCellId: string;
  spawnEdge: 'top' | 'bottom' | 'left' | 'right';
  state: 'MOVING' | 'ATTACKING';
  createdAt: number;
  attackStartedAt?: number;
}

export interface Ufo {
  id: string;
  targetCellId: string;
  state: 'ENTERING' | 'HOVERING' | 'ABDUCTING' | 'LEAVING';
  createdAt: number;
  hoverStartedAt?: number;
  clicksTaken: number; // Track hits (needs 2)
}

export interface MarketEntry {
  currentPrice: number;
  history: number[]; // Store last prices
  trend: 'up' | 'down' | 'stable' | 'flat';
}

export type MarketState = Record<string, MarketEntry>;

export interface InventoryItemData {
  count: number;
  freshness: number; // 0 to 100
  frozenUntil: number; // timestamp, 0 if not frozen
  premiumCount?: number; // Number of items that have bonus
}

export type Inventory = Record<string, InventoryItemData>;

export interface HighScore {
  date: string;
  score: number;
  rank: string;
}

export interface ScoreDetails {
  goldScore: number;
  fishBonus: number;
  bingoBonus: number;
  killBonus: number;
  totalScore: number;
  maxCombo: number;
  rank: 'S' | 'A' | 'B' | 'C';
}

export interface CriticalText {
  id: number;
  text: string;
  x: number; // Percentage 0-100 relative to grid
  y: number; // Percentage 0-100 relative to grid
  colorClass: string;
}