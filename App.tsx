//시작화면
// App.tsx 상단에 추가
console.log("고양이 이미지 경로 확인:", ASSET_PATHS.NPCS.CAT_NEUTRAL);

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { InventorySidebar } from './components/InventorySidebar';
import { FarmGrid } from './components/FarmGrid';
import { SeedShop } from './components/SeedShop';
import { MarketDashboard } from './components/MarketDashboard';
import { TopMarketSummary } from './components/TopMarketSummary';
import { FishMarket } from './components/FishMarket';
import { Cell, Crop, Inventory, MarketState, HighScore, Bug, ScoreDetails, Ufo, BingoLine, CriticalText } from './types';
import { 
  CROPS, GRID_SIZE, INITIAL_GOLD, GAME_DURATION_SECONDS, MARKET_UPDATE_INTERVAL, 
  FRESHNESS_DECAY_RATE, FRESHNESS_TICK_RATE, FISH_MARKET_ITEMS,
  BUG_SPAWN_MIN, BUG_SPAWN_MAX, BUG_TRAVEL_TIME,
  UFO_SPAWN_MIN, UFO_SPAWN_MAX, UFO_HOVER_DURATION, UFO_START_TIME_THRESHOLD, UFO_CLICKS_REQUIRED,
  COLORS, CAT_QUOTES, ASSET_PATHS
} from './constants';

// --- GLOBAL DECLARATION ---
declare global {
  interface Window {
    shopTimer: number;
  }
}

// Initialize global timer outside component to ensure persistence
window.shopTimer = 10;
const INITIAL_FISH = 1;
// Adjusted Score Threshold for 3 Minute Game (was 100k)
const MAX_SCORE_THRESHOLD = 60000; 

// --- INITIALIZATION HELPERS ---

const initGrid = (): Cell[] => {
  const cells: Cell[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      // Linear index 0-15 for 4x4 grid
      const index = y * GRID_SIZE + x;
      // Unlock specific 2x2 area in the center: indices 5, 6, 9, 10
      const isUnlocked = [5, 6, 9, 10].includes(index); 
      cells.push({ id: `cell_${x}_${y}`, x, y, isUnlocked, cropId: null, plantedAt: null, bingoMultiplier: 1 });
    }
  }
  return cells;
};

const initMarket = (): MarketState => {
  const market: MarketState = {};
  CROPS.forEach(crop => {
    market[crop.id] = {
      currentPrice: crop.baseSellPrice,
      history: Array(10).fill(crop.baseSellPrice), // Initialize with 10 entries for history
      trend: 'stable'
    };
  });
  return market;
};

// --- QUICK USE BAR COMPONENT ---
const QuickUseBar = ({ fish, onUse, activeBuffs, bingoMasterOwned }: { 
  fish: number, 
  onUse: (item: typeof FISH_MARKET_ITEMS[0]) => void,
  activeBuffs: { goldenPaw: number, emp: number },
  bingoMasterOwned: boolean
}) => {
  return (
    <div 
      style={{ 
        position: 'fixed',
        top: '155px',
        right: '140px',
        left: 'auto', 
        display: 'flex', 
        flexDirection: 'row',
        alignItems: 'center', 
        gap: '10px',
        zIndex: 9999,
        pointerEvents: 'auto',
        backgroundColor: 'rgba(15, 23, 42, 0.7)', 
        padding: '6px 12px', 
        borderRadius: '99px', 
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
      }}
    >
      <div className="flex items-center gap-1 text-cyan-300 text-xs font-black border-r border-slate-700 pr-3 mr-1">
        <img src={ASSET_PATHS.ICONS.FISH} alt="Fish" className="w-4 h-4 object-contain" />
        <span>{fish}</span>
      </div>

      <div className="flex flex-row gap-2">
        {FISH_MARKET_ITEMS.map(item => {
          const isAffordable = fish >= item.cost;
          let isActive = false;
          let duration = 0;
          let remaining = 0;
          let isMaxed = false;

          if (item.id === 'golden_paw') {
            isActive = activeBuffs.goldenPaw > Date.now();
            duration = 30000;
            remaining = activeBuffs.goldenPaw - Date.now();
          } else if (item.id === 'emp_jammer') {
            isActive = activeBuffs.emp > Date.now();
            duration = 60000;
            remaining = activeBuffs.emp - Date.now();
          } else if (item.id === 'bingo_master') {
            isMaxed = bingoMasterOwned;
          }

          const progressPct = isActive ? (remaining / duration) * 100 : 0;
          const isDisabled = (!isAffordable && !isActive) || isMaxed;

          let containerClass = "relative w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all shadow-lg ";
          if (isMaxed) containerClass += "bg-slate-800 border-slate-600 opacity-80 cursor-default";
          else if (isActive) containerClass += "bg-slate-900 border-slate-700 cursor-default";
          else if (isAffordable) containerClass += "bg-white border-cyan-400 cursor-pointer hover:scale-110 active:scale-95";
          else containerClass += "bg-slate-200 border-slate-300 grayscale opacity-60 cursor-not-allowed";

          return (
            <button 
              key={item.id}
              disabled={isDisabled || isActive}
              onClick={(e) => { e.stopPropagation(); onUse(item); }}
              className={containerClass}
            >
              {isActive && (
                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                  <circle cx="50%" cy="50%" r="16" stroke="#334155" strokeWidth="3" fill="none" />
                  <circle 
                    cx="50%" cy="50%" r="16" 
                    stroke={item.id === 'golden_paw' ? '#fbbf24' : '#60a5fa'} 
                    strokeWidth="3" fill="none" 
                    strokeDasharray={100} 
                    strokeDashoffset={100 - (100 * progressPct / 100)} 
                    className="transition-all duration-1000 linear"
                  />
                </svg>
              )}

              <img src={item.imageUrl} alt={item.name} className="w-6 h-6 object-contain z-10 filter drop-shadow-sm" />
              
              {!isActive && !isMaxed && isAffordable && (
                <div className="absolute -bottom-1 -right-1 bg-slate-900 text-cyan-300 text-[8px] font-bold px-1 rounded-full border border-slate-700">
                  {item.cost}
                </div>
              )}

              {isMaxed && <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 rounded-full font-bold text-[8px] text-green-400">ON</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// --- FLYING GOLD TEXT COMPONENT ---
const FlyingGoldText = ({ amount, startX, startY }: any) => (
  <div 
    className="absolute font-black text-yellow-400 pointer-events-none animate-float-up z-[60]"
    style={{ left: startX, top: startY }}
  >
    +{amount}G
  </div>
);

export default function App() {
  
  // ==========================================
  // 1. STATE MANAGEMENT
  // ==========================================

  // Global Game State
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_SECONDS);
  
  // Resource State
  const [gold, setGold] = useState(INITIAL_GOLD);
  const [fish, setFish] = useState(INITIAL_FISH);

  // Stats for Scoring
  const [totalBingos, setTotalBingos] = useState(0);
  const [totalKills, setTotalKills] = useState(0);
  const [totalHarvests, setTotalHarvests] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);

  // Grid & Inventory State
  const [cells, setCells] = useState<Cell[]>(initGrid());
  const [inventory, setInventory] = useState<Inventory>({});
  const [bingoLines, setBingoLines] = useState<BingoLine[]>([]); // Visual lines
  
  // Combo System State
  const [comboCount, setComboCount] = useState(0);
  const [lastHarvestTime, setLastHarvestTime] = useState(0);
  const [criticalTexts, setCriticalTexts] = useState<CriticalText[]>([]);
  
  // Market & Shop State
  const [marketState, setMarketState] = useState<MarketState>(initMarket());
  const [shopItems, setShopItems] = useState<Crop[]>([]);
  const [shopStock, setShopStock] = useState<number[]>([]);
  const [shopPhase, setShopPhase] = useState(1);
  const [shopCountdown, setShopCountdown] = useState(10); // Syncs with global window.shopTimer
  const [showFishShop, setShowFishShop] = useState(false); // Used for Floating Button (Legacy, can be removed)
  
  // Events State (Bugs, UFOs, Buffs, Cat)
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [ufo, setUfo] = useState<Ufo | null>(null);
  const [isCatPresent, setIsCatPresent] = useState(false);
  const [isGoldenCat, setIsGoldenCat] = useState(false);
  const [catPosition, setCatPosition] = useState({ x: 0, y: 0 });

  const [goldenPawUntil, setGoldenPawUntil] = useState(0);
  const [empJammerUntil, setEmpJammerUntil] = useState(0);
  const [bingoMasterActive, setBingoMasterActive] = useState(false);
  const [premiumMultiplier, setPremiumMultiplier] = useState(1.5); 
  
  // UI State
  const [activeTab, setActiveTab] = useState<'FARM' | 'MARKET' | 'FISH_SHOP'>('FARM');
  const [showShop, setShowShop] = useState(false);
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{message: string, emoji: string} | null>(null);
  const [miraeMood, setMiraeMood] = useState<'neutral' | 'happy' | 'scared'>('neutral');
  const [highlightedCropId, setHighlightedCropId] = useState<string | null>(null);

  // Scores & Achievements
  const [highScore, setHighScore] = useState<HighScore | null>(null);
  const [finalScore, setFinalScore] = useState<ScoreDetails | null>(null);

  // Visual Effects
  const [goldAnims, setGoldAnims] = useState<{id: number, text: string, type: 'gain' | 'loss'}[]>([]);
  const [flyingGold, setFlyingGold] = useState<{id: number, startX: number, startY: number, amount: number}[]>([]);
  const [balancePulse, setBalancePulse] = useState(false);
  const [fishAnim, setFishAnim] = useState(false);
  const [globalSparkle, setGlobalSparkle] = useState(false);

  // Refs
  const stateRef = useRef({
    cells, inventory, fish, gold, bugs, ufo, timeLeft, empJammerUntil
  });
  useEffect(() => {
    stateRef.current = { cells, inventory, fish, gold, bugs, ufo, timeLeft, empJammerUntil };
  }, [cells, inventory, fish, gold, bugs, ufo, timeLeft, empJammerUntil]);
  
  const shopPhaseRef = useRef(1);
  useEffect(() => { shopPhaseRef.current = shopPhase; }, [shopPhase]);

  const ufoActiveRef = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem('agroStonk_highScore');
    if (saved) {
      setHighScore(JSON.parse(saved));
    }
  }, []);

  // ==========================================
  // 2. HELPER FUNCTIONS
  // ==========================================

  const showNotification = useCallback((message: string, emoji: string = '😺') => {
    setNotification({ message, emoji });
    setTimeout(() => setNotification(null), 3500);
  }, []);

  const addGoldAnim = (amount: number) => {
    const id = Date.now() + Math.random();
    setGoldAnims(prev => [...prev, { id, text: amount >= 0 ? `+${amount}` : `${amount}`, type: amount >= 0 ? 'gain' : 'loss' }]);
    setBalancePulse(true);
    setTimeout(() => setBalancePulse(false), 300);
    setTimeout(() => setGoldAnims(prev => prev.filter(a => a.id !== id)), 1500);
  };

  const getRandomInterval = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const getUnlockCost = () => {
    const unlockedCount = cells.filter(cell => cell.isUnlocked).length;
    const initialCount = 4;
    return (unlockedCount - initialCount) + 1;
  };

  const checkAdjacency = (target: Cell) => {
    const neighbors = [
      { x: target.x, y: target.y - 1 },
      { x: target.x, y: target.y + 1 },
      { x: target.x - 1, y: target.y },
      { x: target.x + 1, y: target.y },
    ];
    return neighbors.some(n => cells.find(c => c.x === n.x && c.y === n.y)?.isUnlocked);
  };

  // --- BINGO LOGIC ---
  const recalculateBingos = (currentCells: Cell[]): { cells: Cell[], lines: BingoLine[] } => {
    const grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    const cellMap = new Map<string, Cell>();

    currentCells.forEach(c => {
      grid[c.y][c.x] = c;
      cellMap.set(c.id, { ...c, bingoMultiplier: 1, bingoGroupId: undefined }); 
    });

    const lines: BingoLine[] = [];
    const directions = [
      { x: 1, y: 0, type: 'horizontal' },
      { x: 0, y: 1, type: 'vertical' },
      { x: 1, y: 1, type: 'diagonal' },
      { x: 1, y: -1, type: 'diagonal' }
    ] as const;

    const parentMap = new Map<string, string>();
    const find = (id: string): string => {
        if (!parentMap.has(id)) parentMap.set(id, id);
        if (parentMap.get(id) !== id) {
            parentMap.set(id, find(parentMap.get(id)!));
        }
        return parentMap.get(id)!;
    };
    const union = (id1: string, id2: string) => {
        const root1 = find(id1);
        const root2 = find(id2);
        if (root1 !== root2) {
            parentMap.set(root1, root2);
        }
    };

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const startCell = grid[y][x];
        if (!startCell || !startCell.cropId || startCell.isRuined) continue;

        const cropId = startCell.cropId;

        directions.forEach(dir => {
           let count = 1;
           let nextX = x + dir.x;
           let nextY = y + dir.y;
           const path: Cell[] = [startCell];

           while(nextX >= 0 && nextX < GRID_SIZE && nextY >= 0 && nextY < GRID_SIZE) {
             const nextCell = grid[nextY][nextX];
             if (nextCell && nextCell.cropId === cropId && !nextCell.isRuined) {
               count++;
               path.push(nextCell);
               nextX += dir.x;
               nextY += dir.y;
             } else {
               break;
             }
           }

           if (count >= 3) {
             const lineId = `${startCell.id}-${path[path.length-1].id}`;
             let bonus = 0.5;
             if (count === 4) bonus = 1.0;
             if (count >= 5) bonus = 2.0;

             path.forEach((c, index) => {
               const mapped = cellMap.get(c.id)!;
               mapped.bingoMultiplier = (mapped.bingoMultiplier || 1) + bonus;
               cellMap.set(c.id, mapped);
               if (index > 0) {
                   union(c.id, path[index-1].id);
               }
             });

             lines.push({
               id: lineId,
               startX: startCell.x,
               startY: startCell.y,
               endX: path[path.length-1].x,
               endY: path[path.length-1].y,
               type: dir.type
             });
           }
        });
      }
    }

    const resultCells = Array.from(cellMap.values()).map(cell => {
        if (parentMap.has(cell.id)) {
            return { ...cell, bingoGroupId: find(cell.id) };
        }
        return cell;
    });
    return { cells: resultCells, lines };
  };

  // --- SHOP SYSTEM ---
  const refreshShop = useCallback((phase: number) => {
    let eligibleCrops = CROPS.filter(c => {
      if (phase === 1) return c.seedPrice <= 100;
      if (phase === 2) return c.seedPrice <= 150;
      if (phase === 3) return c.seedPrice <= 200;
      return true;
    });

    const currentCells = stateRef.current.cells;
    const plantedIds = new Set(currentCells.filter(c => c.cropId && !c.isRuined).map(c => c.cropId as string));

    eligibleCrops.sort((a, b) => {
      const weightA = plantedIds.has(a.id) ? 1.5 : 1.0;
      const weightB = plantedIds.has(b.id) ? 1.5 : 1.0;
      const scoreA = Math.random() * weightA;
      const scoreB = Math.random() * weightB;
      return scoreB - scoreA;
    });

    const selected = eligibleCrops.slice(0, 4);
    setShopItems(selected);
    setShopStock(selected.map(() => 3));
  }, []);

  // --- EVENTS SYSTEM (Bugs/UFOs) ---
  const spawnUfo = (now: number) => {
     if (ufoActiveRef.current) return;
     const targets = stateRef.current.cells.filter(c => c.isUnlocked && c.cropId && !c.isRuined && !c.isInfested);
     if (targets.length === 0) return;
     
     const target = targets[Math.floor(Math.random() * targets.length)];
     ufoActiveRef.current = true;
     setUfo({
        id: `ufo_${now}`,
        targetCellId: target.id,
        state: 'ENTERING',
        createdAt: now,
        clicksTaken: 0
     });
     showNotification("Look at the sky! Aliens!", "🛸");
     setMiraeMood('scared');
  };

  const cleanupEvents = () => {
    setBugs([]);
    setUfo(null);
    ufoActiveRef.current = false;
  };

  // ==========================================
  // 3. GAME LOOPS
  // ==========================================

  // --- LUCKY CAT LOOP ---
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const spawnCat = () => {
       setCatPosition({ 
         x: 10 + Math.random() * 70, 
         y: 10 + Math.random() * 60 
       });
       
       const isGold = Math.random() < 0.3;
       setIsGoldenCat(isGold);
       setIsCatPresent(true);

       if (isGold) {
           showNotification("A GOLDEN CAT appeared! (2x Fish)", "✨🐱");
       } else {
           showNotification("A lucky cat appeared!", "🐱");
       }
       setTimeout(() => setIsCatPresent(false), 10000);
    };

    const interval = setInterval(spawnCat, 40000);
    return () => clearInterval(interval);
  }, [gameState]);

  // --- INDEPENDENT SHOP TIMER LOOP ---
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    window.shopTimer = 10;
    setShopCountdown(10);
    refreshShop(shopPhaseRef.current);

    const updateShopUI = () => {
      setShopCountdown(window.shopTimer);
    };

    const timer = setInterval(() => {
      window.shopTimer -= 1;
      
      if (window.shopTimer <= 0) {
         window.shopTimer = 10;
         setShopCountdown(10);
         refreshShop(shopPhaseRef.current);
      }
      updateShopUI();
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  // --- MARKET UPDATE LOOP ---
  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    
    const marketInterval = setInterval(() => {
      setMarketState((prev) => {
        const newState = { ...prev };
        Object.keys(newState).forEach((cropId) => {
          const cropBase = CROPS.find(c => c.id === cropId);
          const basePrice = cropBase?.baseSellPrice || 100;
          const oldPrice = newState[cropId].currentPrice;
          const changeFactor = (Math.random() * 1.0) - 0.3; 
          const nextPrice = Math.floor(basePrice * (1 + changeFactor));
          const newHistory = [...newState[cropId].history, nextPrice];
          if (newHistory.length > 10) newHistory.shift();

          newState[cropId] = {
            ...newState[cropId],
            currentPrice: nextPrice,
            trend: nextPrice > oldPrice ? 'up' : nextPrice < oldPrice ? 'down' : 'flat',
            history: newHistory
          };
        });
        return newState;
      });
    }, 10000); 

    return () => clearInterval(marketInterval);
  }, [gameState]);

  // --- RANDOM EVENT LOOPS ---
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    let pestTimeout: ReturnType<typeof setTimeout>;
    const runPestSpawn = () => {
       const delay = getRandomInterval(BUG_SPAWN_MIN, BUG_SPAWN_MAX);
       pestTimeout = setTimeout(() => {
          if (Date.now() > stateRef.current.empJammerUntil) {
            const currentCells = stateRef.current.cells;
            const targets = currentCells.filter(c => c.isUnlocked && c.cropId && !c.isRuined && !c.isInfested);
            if (targets.length > 0) {
               const target = targets[Math.floor(Math.random() * targets.length)];
               const spawnEdge = ['top', 'bottom', 'left', 'right'][Math.floor(Math.random() * 4)] as Bug['spawnEdge'];
               setBugs(prev => [...prev, {
                  id: `bug_${Date.now()}`,
                  targetCellId: target.id,
                  spawnEdge,
                  state: 'MOVING',
                  createdAt: Date.now()
               }]);
               showNotification("A hungry caterpillar appears!", "🐛");
               setMiraeMood('scared');
            }
          }
          runPestSpawn(); 
       }, delay);
    };

    let ufoTimeout: ReturnType<typeof setTimeout>;
    const runUfoSpawn = () => {
       const delay = getRandomInterval(UFO_SPAWN_MIN, UFO_SPAWN_MAX);
       ufoTimeout = setTimeout(() => {
          if (stateRef.current.timeLeft <= UFO_START_TIME_THRESHOLD && Date.now() > stateRef.current.empJammerUntil) {
             spawnUfo(Date.now());
          }
          runUfoSpawn(); 
       }, delay);
    };

    runPestSpawn();
    runUfoSpawn();

    return () => {
      clearTimeout(pestTimeout);
      clearTimeout(ufoTimeout);
    };
  }, [gameState]);

  // --- IDLE CAT CHAT LOOP ---
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const idleInterval = setInterval(() => {
      const randomQuote = CAT_QUOTES[Math.floor(Math.random() * CAT_QUOTES.length)];
      showNotification(randomQuote, "🐱");
    }, 12000); 

    return () => clearInterval(idleInterval);
  }, [gameState, showNotification]);


  // --- MAIN GAME LOOP ---
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const loop = setInterval(() => {
      const now = Date.now();
      const elapsed = GAME_DURATION_SECONDS - timeLeft;

      try {
        setTimeLeft(prev => {
           if (prev <= 1) {
             setGameState('GAMEOVER');
             return 0;
           }
           return prev - 1;
        });

        // Adjusted phases for 3 minute (180s) game
        let nextPhase = 1;
        if (elapsed > 120) nextPhase = 4;
        else if (elapsed > 80) nextPhase = 3;
        else if (elapsed > 40) nextPhase = 2;
        
        if (nextPhase > shopPhase) {
          setShopPhase(nextPhase);
          showNotification("New higher-tier seeds available!", "🌱");
        }
        
        if (stateRef.current.ufo) {
           setUfo(curr => {
              if (!curr) return null;
              if (curr.state === 'ENTERING' && now - curr.createdAt > 1000) return { ...curr, state: 'HOVERING' as const, hoverStartedAt: now };
              if (curr.state === 'HOVERING' && curr.hoverStartedAt && now - curr.hoverStartedAt > UFO_HOVER_DURATION) return { ...curr, state: 'ABDUCTING' as const };
              if (curr.state === 'ABDUCTING') {
                 const nextCells = stateRef.current.cells.map(c => c.id === curr.targetCellId ? { ...c, cropId: null, plantedAt: null, isInfested: false, isPestDamaged: false, bingoMultiplier: 1, bingoGroupId: undefined } : c);
                 const { cells: processedCells, lines } = recalculateBingos(nextCells);
                 setCells(processedCells);
                 setBingoLines(lines);

                 showNotification("Crop abducted!", "🛸");
                 setMiraeMood('scared');
                 return { ...curr, state: 'LEAVING' as const };
              }
              if (curr.state === 'LEAVING' && now - curr.createdAt > 10000) {
                 ufoActiveRef.current = false;
                 return null;
              }
              return curr;
           });
        }
        
        if (stateRef.current.bugs.length > 0) {
           setBugs(curr => {
              let infested = false;
              const nextBugs = curr.map(b => {
                 if (b.state === 'MOVING' && now - b.createdAt >= BUG_TRAVEL_TIME) {
                    infested = true;
                    setCells(prev => prev.map(c => c.id === b.targetCellId ? { ...c, isInfested: true, isPestDamaged: true } : c));
                    return { ...b, state: 'ATTACKING' as const, attackStartedAt: now };
                 }
                 return b;
              });
              
              if (infested) { 
                 showNotification("Pests are eating your crops! -50% Value!", "🐛"); 
                 setMiraeMood('scared'); 
              }
              return nextBugs;
           });
        }

      } catch (e) {
        console.error("Game Loop Error:", e);
      }
    }, 1000);

    return () => clearInterval(loop);
  }, [gameState, shopPhase, empJammerUntil, timeLeft]);


  // Inventory Freshness Decay Loop
  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const interval = setInterval(() => {
      setInventory(prev => {
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach(key => {
           if (next[key].count > 0 && next[key].freshness > 0 && next[key].frozenUntil < Date.now()) {
              next[key] = { ...next[key], freshness: Math.max(0, next[key].freshness - FRESHNESS_DECAY_RATE) };
              changed = true;
           }
        });
        return changed ? next : prev;
      });
    }, FRESHNESS_TICK_RATE);
    return () => clearInterval(interval);
  }, [gameState]);


  // ==========================================
  // 4. PLAYER ACTIONS
  // ==========================================

  const startGame = () => {
    setGold(INITIAL_GOLD);
    setCells(initGrid());
    setInventory({});
    setMarketState(initMarket());
    setTimeLeft(GAME_DURATION_SECONDS);
    setGameState('PLAYING');
    setActiveTab('FARM');
    setHighlightedCropId(null);
    setFish(INITIAL_FISH);
    cleanupEvents();
    setIsCatPresent(false);
    setIsGoldenCat(false);
    setShopPhase(1);
    setMiraeMood('neutral');
    setTotalHarvests(0);
    setFinalScore(null);
    setPremiumMultiplier(1.5);
    setEmpJammerUntil(0);
    setGoldenPawUntil(0);
    setBingoMasterActive(false);
    setTotalBingos(0);
    setTotalKills(0);
    setComboCount(0);
    setMaxCombo(0);
    setLastHarvestTime(0);
    setCriticalTexts([]);
    window.shopTimer = 10;
    setShopCountdown(10);
    refreshShop(1);
    setBingoLines([]);
    setShowFishShop(false);
  };

  const handleUnlockCell = (cell: Cell) => {
    const cost = getUnlockCost();
    if (fish < cost) return;
    setFish(prev => prev - cost);
    setCells(prev => prev.map(c => c.id === cell.id ? { ...c, isUnlocked: true } : c));
    showNotification(`새로운 밭을 열었습니다! 다음 비용: ${cost + 1}마리`, "✨");
    setGlobalSparkle(true);
    setTimeout(() => setGlobalSparkle(false), 500);
  };

  const handleCellClick = (cell: Cell) => {
    if (gameState !== 'PLAYING') return;
    if (!cell.isUnlocked) return;

    // 1. Ruined Cleanup
    if (cell.isRuined) {
      setGold(g => g + 1);
      addGoldAnim(1);
      setCells(prev => prev.map(c => c.id === cell.id ? { ...c, cropId: null, plantedAt: null, isRuined: false, isInfested: false, isPestDamaged: false, bingoMultiplier: 1, bingoGroupId: undefined } : c));
      return;
    }

    // 2. Harvest Logic
    if (cell.cropId) {
       const crop = CROPS.find(c => c.id === cell.cropId);
       if (crop && cell.plantedAt) {
         const elapsed = (Date.now() - cell.plantedAt) / 1000;
         const isCropReady = elapsed >= crop.growthTime;
         
         if (cell.bingoGroupId) {
             const groupCells = cells.filter(c => c.bingoGroupId === cell.bingoGroupId);
             const allReady = groupCells.every(c => {
                 const cCrop = CROPS.find(cr => cr.id === c.cropId);
                 if (!cCrop || !c.plantedAt) return false;
                 return ((Date.now() - c.plantedAt) / 1000) >= cCrop.growthTime;
             });

             if (allReady) {
                 // Mass Harvest
                 setGlobalSparkle(true);
                 setTimeout(() => setGlobalSparkle(false), 800);
                 const now = Date.now();
                 const isCombo = now - lastHarvestTime < 2000;
                 const newComboCount = isCombo ? comboCount + 1 : 1;
                 setComboCount(newComboCount);
                 setMaxCombo(prev => Math.max(prev, newComboCount));
                 setLastHarvestTime(now);
                 let comboBonus = 1 + (Math.min(newComboCount, 5) * 0.2); 

                 const harvestedIds = new Set(groupCells.map(c => c.id));
                 let totalNewHarvests = 0;
                 let totalGoldReward = 0;

                 setInventory(prev => {
                    const newState = { ...prev };
                    groupCells.forEach(targetCell => {
                        const targetCrop = CROPS.find(c => c.id === targetCell.cropId);
                        if (!targetCrop) return;
                        const multiplier = targetCell.bingoMultiplier || 1.5;
                        const isDamaged = targetCell.isPestDamaged;
                        const freshnessToAdd = isDamaged ? 50 : 100;
                        const isPremium = multiplier > 1;
                        const bingoBonus = Math.pow(multiplier, 1.2);
                        const goldReward = Math.floor(targetCrop.baseSellPrice * 0.2 * bingoBonus * comboBonus);
                        totalGoldReward += goldReward;

                        const item = newState[targetCrop.id] || { count: 0, freshness: 0, frozenUntil: 0, premiumCount: 0 };
                        const totalFreshness = (item.count * item.freshness) + freshnessToAdd;
                        const newCount = item.count + 1;
                        newState[targetCrop.id] = {
                            count: newCount,
                            freshness: totalFreshness / newCount,
                            frozenUntil: Math.max(item.frozenUntil, Date.now() + 60000),
                            premiumCount: (item.premiumCount || 0) + (isPremium ? 1 : 0)
                        };
                        totalNewHarvests++;
                    });
                    return newState;
                 });
                 if (totalGoldReward > 0) {
                    setGold(g => g + totalGoldReward);
                    addGoldAnim(totalGoldReward);
                 }
                 const centerCell = groupCells[0]; 
                 const xPercent = (centerCell.x * 25) + 12.5;
                 const yPercent = (centerCell.y * 25) + 12.5;
                 
                 let comboMsg = `BINGO x${groupCells.length}`;
                 let colorClass = "text-orange-500 font-bold scale-125";
                 if (newComboCount > 1) {
                    comboMsg = `BINGO COMBO x${newComboCount}!!!`;
                    colorClass = "animate-bounce text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-600 font-black scale-150 drop-shadow-lg";
                 }
                 const newCritical: CriticalText = {
                    id: Date.now(),
                    text: comboMsg,
                    x: xPercent,
                    y: yPercent,
                    colorClass
                 };
                 setCriticalTexts(prev => [...prev, newCritical]);
                 setTimeout(() => setCriticalTexts(prev => prev.filter(t => t.id !== newCritical.id)), 1000);
                 setTotalHarvests(h => h + totalNewHarvests);
                 setMiraeMood('happy');
                 setFish(f => f + 1); 
                 const nextCells = cells.map(c => harvestedIds.has(c.id) ? { ...c, cropId: null, plantedAt: null, isInfested: false, isPestDamaged: false, bingoMultiplier: 1, bingoGroupId: undefined } : c);
                 const { cells: processedCells, lines } = recalculateBingos(nextCells);
                 setCells(processedCells);
                 setBingoLines(lines);
             } else {
                 showNotification("Wait for ALL Bingo crops! 🔒", "⏳");
             }
             return;
         }

         // Standard Harvest
         if (isCropReady) {
            const isDamaged = cell.isPestDamaged;
            const freshnessToAdd = isDamaged ? 50 : 100;
            const bingoMultiplier = cell.bingoMultiplier || 1;
            const now = Date.now();
            const isCombo = now - lastHarvestTime < 2000;
            const newComboCount = isCombo ? comboCount + 1 : 1;
            
            setComboCount(newComboCount);
            setMaxCombo(prev => Math.max(prev, newComboCount));
            setLastHarvestTime(now);

            let comboBonus = 1 + (Math.min(newComboCount, 5) * 0.2); 
            const bingoBonus = Math.pow(bingoMultiplier, 1.2);
            const goldReward = Math.floor(crop.baseSellPrice * 0.2 * bingoBonus * comboBonus);

            let comboMsg = "";
            let colorClass = "";

            if (newComboCount === 1) {
              comboMsg = "GOOD!";
              colorClass = "text-blue-400 font-bold";
            } else if (newComboCount === 2) {
              comboMsg = "GREAT!!";
              colorClass = "text-green-400 font-bold text-xl";
            } else if (newComboCount === 3) {
              comboMsg = "EXCELLENT!!!";
              colorClass = "text-yellow-400 font-black text-2xl";
            } else {
              comboMsg = "PERFECT!!!!";
              colorClass = "text-purple-500 font-black animate-bounce text-2xl";
            }

            const xPercent = (cell.x * 25) + 12.5;
            const yPercent = (cell.y * 25) + 12.5;

            const newCritical: CriticalText = {
               id: Date.now(),
               text: `${comboMsg} x${newComboCount}`,
               x: xPercent,
               y: yPercent,
               colorClass
            };
            setCriticalTexts(prev => [...prev, newCritical]);
            setTimeout(() => setCriticalTexts(prev => prev.filter(t => t.id !== newCritical.id)), 1000);

            if (goldReward > 0) {
                setGold(g => g + goldReward);
                addGoldAnim(goldReward);
            }

            setInventory(prev => {
              const item = prev[crop.id] || { count: 0, freshness: 0, frozenUntil: 0, premiumCount: 0 };
              const comboFreshnessBonus = (comboBonus - 1) * 20; 
              const totalFreshness = (item.count * item.freshness) + Math.min(100, freshnessToAdd + comboFreshnessBonus);
              const newCount = item.count + 1;
              return { ...prev, [crop.id]: {
                 count: newCount,
                 freshness: totalFreshness / newCount,
                 frozenUntil: Math.max(item.frozenUntil, Date.now() + 60000),
                 premiumCount: (item.premiumCount || 0)
              }};
            });
            setTotalHarvests(h => h + 1);
            setMiraeMood('happy');
            if (isDamaged) showNotification("Harvested Damaged Crop", "🥀");

            const nextCells = cells.map(c => c.id === cell.id ? { ...c, cropId: null, plantedAt: null, isInfested: false, isPestDamaged: false, bingoMultiplier: 1, bingoGroupId: undefined } : c);
            const { cells: processedCells, lines } = recalculateBingos(nextCells);
            setCells(processedCells);
            setBingoLines(lines);
         }
       }
    } else {
       setSelectedCellId(cell.id);
       setShowShop(true);
    }
  };

  const buySeed = (crop: Crop, index: number) => {
    if (gold >= crop.seedPrice && selectedCellId && shopStock[index] > 0) {
      setGold(g => g - crop.seedPrice);
      setShopStock(s => { const n = [...s]; n[index]--; return n; });
      const nextCells = cells.map(c => c.id === selectedCellId ? { ...c, cropId: crop.id, plantedAt: Date.now() } : c);
      const { cells: processedCells, lines } = recalculateBingos(nextCells);
      if (lines.length > bingoLines.length) {
         const newLines = lines.length - bingoLines.length;
         setTotalBingos(prev => prev + newLines); 
         showNotification("Bingo Line! Tiles Locked 🔒", "⭐");
      }
      setCells(processedCells);
      setBingoLines(lines);
      setShowShop(false);
      setSelectedCellId(null);
    }
  };

  const sellCrop = (cropId: string, amount: number) => {
    const market = marketState[cropId];
    const item = inventory[cropId];
    if (!item || item.count === 0) return;
    
    const premiumCount = item.premiumCount || 0;
    const normalCount = item.count - premiumCount;
    const soldNormal = Math.min(amount, normalCount);
    const soldPremium = amount - soldNormal;

    const multiplier = Date.now() < goldenPawUntil ? 2 : 1;
    const baseVal = market.currentPrice * (item.freshness / 100) * multiplier;
    
    const total = Math.floor((soldNormal * baseVal) + (soldPremium * baseVal * premiumMultiplier));

    setInventory(prev => ({ ...prev, [cropId]: { ...item, count: item.count - amount, premiumCount: premiumCount - soldPremium }}));
    setGold(g => g + total);
    addGoldAnim(total);
    if (multiplier > 1) showNotification("Golden Paw Bonus!", "🐾");
  };

  const handleBugClick = (bugId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const bug = bugs.find(b => b.id === bugId);
    if (!bug) return;

    setBugs(b => b.filter(x => x.id !== bugId));
    setCells(prev => prev.map(c => c.id === bug.targetCellId ? { ...c, isInfested: false } : c));
    setFish(prev => prev + 1);
    setTotalKills(prev => prev + 1);
    showNotification("Pest Removed!", "🐟");
  };

  const handleUfoClick = (e: React.MouseEvent) => {
     if (!ufo || ufo.state === 'LEAVING') return;
     const newClicks = ufo.clicksTaken + 1;
     if (newClicks < UFO_CLICKS_REQUIRED) {
       setUfo({ ...ufo, clicksTaken: newClicks });
       return;
     }
     cleanupEvents();
     setMiraeMood('happy');
     showNotification("UFO Defeated! +2 Fish", "🐟");
     setFish(f => f + 2);
     setTotalKills(prev => prev + 1);
     setGlobalSparkle(true);
     setTimeout(() => setGlobalSparkle(false), 800);
  };
  
  const handleCatClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isCatPresent) return;
    const reward = isGoldenCat ? 2 : 1;
    setFish(prev => prev + reward);
    setIsCatPresent(false);
    if (isGoldenCat) {
        showNotification("Golden Cat! +2 Fish", "✨🐟");
    } else {
        showNotification("Meow! +1 Fish", "🐟");
    }
    setMiraeMood('happy');
    setGlobalSparkle(true);
    setTimeout(() => setGlobalSparkle(false), 800);
  };

  const handleQuickFishAction = (item: typeof FISH_MARKET_ITEMS[0]) => {
     if (fish < item.cost) {
       showNotification("Not enough fish!", "🐟");
       return;
     }
     setFish(f => f - item.cost);
     showNotification(`ACTIVE: ${item.name}!`, item.emoji);
     setGlobalSparkle(true);
     setTimeout(() => setGlobalSparkle(false), 1000);

     if (item.id === 'instant_grow') {
       setCells(prev => prev.map(c => {
         if (c.cropId && c.plantedAt && !c.isRuined) {
           return { ...c, plantedAt: c.plantedAt - 300000 }; 
         }
         return c;
       }));
     } else if (item.id === 'golden_paw') {
       setGoldenPawUntil(Date.now() + 30000);
     } else if (item.id === 'emp_jammer') {
       setEmpJammerUntil(Date.now() + 60000);
       cleanupEvents(); 
     } else if (item.id === 'bingo_master') {
       setBingoMasterActive(true);
     }
  };

  // ==========================================
  // 5. RENDER
  // ==========================================

  if (gameState === 'START') return <StartScreen onStart={startGame} highScore={highScore} />;
  if (gameState === 'GAMEOVER') return (
    <GameOverScreen 
      gold={gold} 
      fish={fish}
      bingos={totalBingos}
      kills={totalKills}
      maxCombo={maxCombo}
      onRestart={startGame} 
      finalScore={finalScore} 
      setFinalScore={setFinalScore} 
    />
  );

  const isEmpActive = Date.now() < empJammerUntil;
  const isGoldenPawActive = Date.now() < goldenPawUntil;
  const isTimeCritical = timeLeft > 0 && timeLeft <= 10;
  const nextSlotCost = getUnlockCost();

  return (
    <div className="flex flex-col h-full w-full relative">
      {isEmpActive && <div className="absolute inset-0 z-40 border-[8px] border-blue-500/30 bg-blue-500/5 pointer-events-none" />}
      {globalSparkle && <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
        <img src={ASSET_PATHS.STATUS.SPARKLE} alt="Sparkle" className="w-24 h-24 animate-ping" />
      </div>}
      
      {isTimeCritical && (
        <div className="absolute inset-0 pointer-events-none z-[150] border-[8px] border-red-500/30 animate-pulse-fast">
          <div className="absolute inset-0 bg-red-500/10 shadow-[inset_0_0_100px_rgba(239,68,68,0.2)]"></div>
        </div>
      )}
      
      {flyingGold.map(fg => <FlyingGoldText key={fg.id} {...fg} />)}

      {/* Header */}
      <div className="bg-slate-900 text-white p-3 shadow-md z-30 flex flex-col gap-3 border-b border-slate-800">
        <div className="grid grid-cols-3 items-center h-16">
           <div className="flex flex-col items-start relative" onClick={() => setMiraeMood('happy')}>
              <img 
                src={miraeMood === 'happy' ? ASSET_PATHS.NPCS.CAT_HAPPY : miraeMood === 'scared' ? ASSET_PATHS.NPCS.CAT_SCARED : ASSET_PATHS.NPCS.CAT_NEUTRAL} 
                alt="Mirae" 
                className="w-14 h-14 drop-shadow-lg active:scale-95 transition-transform object-contain"
                onError={(e) => e.currentTarget.src = "https://placehold.co/128x128/facc15/black?text=Cat&font=roboto"}
              />
              {notification && <div className="absolute top-12 left-0 w-32 bg-white text-slate-900 p-2 rounded-xl rounded-tl-none text-[10px] font-bold shadow-xl z-50 animate-bounce-in">{notification.message}</div>}
           </div>
           
           <div className="flex flex-col items-center justify-center relative">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Balance</span>
              <div className={`flex items-center gap-1 text-4xl font-display font-black transition-transform ${balancePulse ? 'scale-110 text-yellow-300' : 'text-amber-400'}`}>
                 <img src={ASSET_PATHS.ICONS.GOLD} alt="G" className="w-6 h-6 object-contain" />
                 {gold.toLocaleString()}
              </div>
              {isGoldenPawActive && <div className="text-xs text-yellow-300 animate-bounce">2x Active!</div>}
              {goldAnims.map(a => (
                 <div key={a.id} className={`absolute top-full font-bold animate-float-up pointer-events-none ${a.type === 'gain' ? 'text-emerald-400' : 'text-red-400'}`}>{a.text}</div>
              ))}
           </div>

           <div className="flex justify-end">
              <div className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300
                ${isTimeCritical 
                  ? 'bg-red-500 text-white scale-110 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse' 
                  : 'bg-slate-800 text-white border border-slate-700'}
              `}>
                <img src={ASSET_PATHS.ICONS.TIMER} alt="Time" className="w-5 h-5 object-contain" />
                <span className={`font-mono font-black text-xl ${isTimeCritical ? 'animate-bounce' : ''}`}>
                  {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2,'0')}
                </span>
              </div>
           </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative bg-slate-50 overflow-hidden">
         <div className={`absolute inset-0 flex flex-col ${activeTab === 'FARM' ? 'z-10' : 'invisible'}`}>
            <TopMarketSummary 
               inventory={inventory} 
               marketState={marketState} 
               cells={cells} 
               currentTimestamp={Date.now()} 
               onItemClick={(id) => { setHighlightedCropId(id); setActiveTab('MARKET'); }} 
               onSell={sellCrop} 
            />
            
            <QuickUseBar 
              fish={fish} 
              onUse={handleQuickFishAction} 
              activeBuffs={{ goldenPaw: goldenPawUntil, emp: empJammerUntil }} 
              bingoMasterOwned={bingoMasterActive} 
            />

            <div className="flex-1 flex items-center justify-center p-2">
               <FarmGrid 
                  cells={cells} 
                  gold={gold} 
                  fish={fish} 
                  bugs={bugs} 
                  ufo={ufo} 
                  bingoLines={bingoLines} 
                  criticalTexts={criticalTexts}
                  onCellClick={handleCellClick} 
                  onUnlock={handleUnlockCell} 
                  onBugClick={handleBugClick} 
                  onUfoClick={handleUfoClick} 
                  timeNow={Date.now()} 
                  nextUnlockCost={getUnlockCost()} 
                  selectedCellId={selectedCellId} 
               />
            </div>
         </div>

         {/* Cat Overlay */}
         {isCatPresent && activeTab === 'FARM' && (
           <div 
             onClick={handleCatClick}
             className={`absolute z-50 cursor-pointer animate-bounce transition-transform hover:scale-110 active:scale-90 ${
               isGoldenCat ? 'drop-shadow-[0_0_15px_rgba(255,215,0,0.8)]' : 'drop-shadow-xl'
             }`}
             style={{ left: `${catPosition.x}%`, top: `${catPosition.y}%` }}
           >
             <div className="relative group w-20 h-20">
               <img 
                 src={isGoldenCat ? ASSET_PATHS.NPCS.CAT_GOLDEN : ASSET_PATHS.NPCS.CAT_NEUTRAL} 
                 alt="Lucky Cat" 
                 className={`w-full h-full object-contain ${isGoldenCat ? 'brightness-125' : ''}`}
                 onError={(e) => e.currentTarget.src = "https://placehold.co/128x128/facc15/black?text=Cat&font=roboto"}
               />
               
               <div className={`absolute -top-4 -right-6 text-white text-[10px] px-2 py-0.5 rounded-full font-black shadow-sm whitespace-nowrap ${
                 isGoldenCat ? 'bg-yellow-500 animate-pulse' : 'bg-emerald-500'
               }`}>
                 {isGoldenCat ? 'GOLD! +2' : 'FISH!'}
               </div>
               
               {isGoldenCat && (
                 <div className="absolute inset-0 animate-ping opacity-50 bg-yellow-400 rounded-full scale-50"></div>
               )}
             </div>
           </div>
         )}

         {activeTab === 'MARKET' && <div className="absolute inset-0 bg-slate-50 z-20"><MarketDashboard marketState={marketState} inventory={inventory} onSell={sellCrop} highlightedCropId={highlightedCropId} onBack={() => setActiveTab('FARM')} /></div>}
         {activeTab === 'FISH_SHOP' && <div className="absolute inset-0 bg-slate-50 z-20"><FishMarket fish={fish} gold={gold} inventory={inventory} onPurchase={(id) => { /* Simplified purchase logic call */ }} /></div>}
      </div>

      {/* Footer Nav */}
      <div className="h-16 bg-white border-t border-slate-200 flex shadow-inner z-30">
         <button onClick={() => setActiveTab('FARM')} className={`flex-1 flex flex-col items-center justify-center ${activeTab==='FARM'?'text-emerald-600':'text-slate-400'}`}>
            <img src={ASSET_PATHS.ICONS.FARM} alt="Farm" className="w-8 h-8 object-contain mb-1" />
            <span className="text-[10px] font-bold">FARM</span>
         </button>
         <button onClick={() => setActiveTab('MARKET')} className={`flex-1 flex flex-col items-center justify-center ${activeTab==='MARKET'?'text-blue-600':'text-slate-400'}`}>
            <img src={ASSET_PATHS.ICONS.MARKET} alt="Market" className="w-8 h-8 object-contain mb-1" />
            <span className="text-[10px] font-bold">MARKET</span>
         </button>
         <button onClick={() => setActiveTab('FISH_SHOP')} className={`flex-1 flex flex-col items-center justify-center ${activeTab==='FISH_SHOP'?'text-cyan-600':'text-slate-400'}`}>
            <div className="relative">
              <img src={ASSET_PATHS.ICONS.SHOP} alt="Shop" className="w-8 h-8 object-contain mb-1" />
              <span className="absolute -top-1 -right-2 bg-slate-800 text-white text-[9px] px-1 rounded-full">{fish}</span>
            </div>
            <span className="text-[10px] font-bold">SHOP</span>
         </button>
      </div>

      {showShop && <SeedShop gold={gold} shopItems={shopItems} shopStock={shopStock} secondsUntilRefresh={shopCountdown} phase={shopPhase} onBuy={buySeed} onSoldOutClick={() => showNotification("Sold out!", "😿")} onClose={() => { setShowShop(false); setSelectedCellId(null); }} />}
    </div>
  );
}

const StartScreen = ({ onStart, highScore }: { onStart: () => void, highScore: HighScore | null }) => {
  const [showGuide, setShowGuide] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const handleClick = () => {
    setShowGuide(true);
    setTimeout(() => {
      setShowGuide(false);
      setCountdown(3);
      
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev === 1) {
            clearInterval(timer);
            onStart();
            return null;
          }
          return prev !== null ? prev - 1 : null;
        });
      }, 1000);
    }, 3000);
  };

  if (countdown !== null) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-slate-900 p-6 text-white absolute inset-0 z-[120]">
        <div className="text-[180px] font-black animate-bounce text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-amber-600 drop-shadow-[0_0_30px_rgba(251,191,36,0.5)]">
          {countdown}
        </div>
        <div className="text-2xl font-black tracking-widest animate-pulse text-yellow-400">GET READY!</div>
      </div>
    );
  }

  if (showGuide) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-xl p-6 text-white absolute inset-0 z-[100]">
        <div className="w-full max-w-sm space-y-6 animate-in fade-in zoom-in duration-300">
           <h2 className="text-3xl font-black text-center text-yellow-400 tracking-wider">GAME GUIDE</h2>
           
           <div className="bg-white/10 p-4 rounded-2xl border border-white/10 flex items-center gap-4">
              <img src={ASSET_PATHS.ICONS.TARGET} alt="Goal" className="w-12 h-12 object-contain" />
              <div>
                <h3 className="font-bold text-emerald-300 text-sm tracking-wider">GOAL</h3>
                <p className="text-sm font-medium text-slate-200">Plant crops to form BINGO lines & Harvest for max profit!</p>
              </div>
           </div>

           <div className="bg-white/10 p-4 rounded-2xl border border-white/10 flex items-center gap-4">
              <img src={ASSET_PATHS.ICONS.FISH} alt="Unlock" className="w-12 h-12 object-contain" />
              <div>
                <h3 className="font-bold text-cyan-300 text-sm tracking-wider">UNLOCK</h3>
                <p className="text-sm font-medium text-slate-200">Spend Fish to unlock new land tiles.</p>
              </div>
           </div>

           <div className="bg-white/10 p-4 rounded-2xl border border-white/10 flex items-center gap-4">
              <img src={ASSET_PATHS.ICONS.HAND} alt="Control" className="w-12 h-12 object-contain" />
              <div>
                <h3 className="font-bold text-orange-300 text-sm tracking-wider">CONTROL</h3>
                <p className="text-sm font-medium text-slate-200">Tap empty tiles to Plant. Tap grown crops to Harvest.</p>
              </div>
           </div>
           
           <div className="text-center pt-8">
             <div className="inline-block px-4 py-1 rounded-full bg-white/20 text-xs font-mono animate-pulse">
               Starting in 3s...
             </div>
           </div>
        </div>
      </div>
    );
  }
//시작화면 고양이 얼굴 보이는 첫 로비 화면 
  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-400 to-cyan-500 p-6 text-white">
      <img 
        src={`${ASSET_PATHS.NPCS.CAT_NEUTRAL}?t=${Date.now()}`}
        alt="Cat" 
        className="w-40 h-40 mb-6 animate-bounce object-contain" 
        //onError={(e) => e.currentTarget.src = "https://placehold.co/128x128/facc15/black?text=Cat&font=roboto"}//
      />
      <h1 className="text-4xl font-black mb-2 text-center drop-shadow-md">미래의 황금 농장</h1>
      <p className="text-emerald-100 mb-8 text-center font-bold">3분 동안 최고의 수익을 올리세요!</p>
      
      {highScore && (
        <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl mb-8 border border-white/30 text-center">
          <p className="text-xs uppercase font-black opacity-80">최고 기록 (Best Score)</p>
          <p className="text-2xl font-display font-black">{highScore.score.toLocaleString()} G</p>
        </div>
      )}

      <button 
        onClick={handleClick}
        className="bg-white text-emerald-600 px-12 py-4 rounded-full text-xl font-black shadow-xl hover:scale-105 active:scale-95 transition-transform"
      >
        게임 시작하기
      </button>
    </div>
  );
};

const GameOverScreen = ({ gold, fish, bingos, kills, maxCombo, onRestart, finalScore, setFinalScore }: any) => {
  useEffect(() => {
    if (!finalScore) {
      const bingoScore = bingos * 200;
      const killScore = kills * 50;
      const fishScore = fish * 100;
      const total = gold + bingoScore + killScore + fishScore;

      const scoreDetails = { total, goldScore: gold, bingoBonus: bingoScore, killBonus: killScore, fishBonus: fishScore, totalScore: total, maxCombo, rank: 'C' };
      
      let rank: 'S' | 'A' | 'B' | 'C' = 'C';
      if (total >= MAX_SCORE_THRESHOLD * 0.8) rank = 'S';
      else if (total >= MAX_SCORE_THRESHOLD * 0.5) rank = 'A';
      else if (total >= MAX_SCORE_THRESHOLD * 0.3) rank = 'B';
      scoreDetails.rank = rank;

      setFinalScore(scoreDetails);

      const saved = localStorage.getItem('agroStonk_highScore');
      const currentHigh = saved ? JSON.parse(saved).score : 0;
      if (total > currentHigh) {
        localStorage.setItem('agroStonk_highScore', JSON.stringify({ score: total, date: Date.now(), rank }));
      }
    }
  }, []);

  if (!finalScore) return null;

  // ... (Rank logic same as before) ...
  const { level, title } = { level: 99, title: "Legend" }; // Placeholder to match existing logic structure or imported helper if defined

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-slate-900 p-6 overflow-y-auto">
      <div className="w-full max-w-sm flex flex-col items-center p-8 bg-gradient-to-b from-slate-800 to-slate-900 text-white rounded-[2.5rem] shadow-2xl border-4 border-yellow-400/50">
        <p className="text-yellow-400 font-black tracking-widest text-xs mb-2">FINAL RETIREMENT RANK</p>
        
        <h1 className="text-8xl font-black mb-4 drop-shadow-lg text-transparent bg-clip-text bg-gradient-to-br from-yellow-200 to-yellow-500 animate-pulse-subtle">
          #{level}
        </h1>

        <div className="bg-white/10 px-6 py-3 rounded-2xl mb-8 backdrop-blur-sm border border-white/20 w-full">
          <h2 className="text-xl font-black text-center text-white break-keep leading-snug">
            "{title}"
          </h2>
        </div>

        <div className="w-full grid grid-cols-2 gap-3 mb-8">
          <div className="bg-black/30 p-3 rounded-xl text-center border border-white/5">
            <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">Total Gold</p>
            <p className="text-lg font-black text-emerald-400">{finalScore.goldScore.toLocaleString()} G</p>
          </div>
          <div className="bg-black/30 p-3 rounded-xl text-center border border-white/5">
            <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">Bingos</p>
            <p className="text-lg font-black text-yellow-400">{bingos}</p>
          </div>
          <div className="bg-black/30 p-3 rounded-xl text-center border border-white/5">
            <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">Score</p>
            <p className="text-lg font-black text-white">{finalScore.totalScore.toLocaleString()}</p>
          </div>
        </div>

        <button 
          onClick={onRestart}
          className="w-full py-4 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-900 font-black text-lg rounded-2xl transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2"
        >
          <span>AGAIN RETIRE?</span> 
          <img 
            src={ASSET_PATHS.NPCS.CAT_NEUTRAL} 
            className="w-6 h-6 object-contain" 
            alt="cat"
            onError={(e) => e.currentTarget.src = "https://placehold.co/64x64/facc15/black?text=Cat&font=roboto"}
          />
        </button>
      </div>
    </div>
  );
};
