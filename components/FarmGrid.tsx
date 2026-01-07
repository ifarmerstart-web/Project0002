
import React, { useEffect, useState, memo } from 'react';
import { Cell, Bug, Ufo, BingoLine, CriticalText } from '../types';
import { CROPS, GRID_SIZE, COLORS, BUG_TRAVEL_TIME, UFO_CLICKS_REQUIRED, ASSET_PATHS } from '../constants';

interface FarmGridProps {
  cells: Cell[];
  gold: number;
  fish: number;
  bugs: Bug[];
  ufo: Ufo | null;
  bingoLines: BingoLine[];
  criticalTexts: CriticalText[];
  onCellClick: (cell: Cell) => void;
  onUnlock: (cell: Cell) => void;
  onBugClick: (bugId: string, e: React.MouseEvent) => void;
  onUfoClick: (e: React.MouseEvent) => void;
  timeNow: number;
  nextUnlockCost: number;
  selectedCellId: string | null;
}

// --- SUB-COMPONENTS (Memoized for Performance) ---

const BugComponent = memo(({ bug, cell, onClick }: { bug: Bug, cell: Cell, onClick: (e: React.MouseEvent) => void }) => {
  const [style, setStyle] = useState<React.CSSProperties>({
    opacity: 0,
    top: bug.spawnEdge === 'top' ? '-10%' : bug.spawnEdge === 'bottom' ? '110%' : `${(cell.y * 100 / GRID_SIZE) + 8}%`,
    left: bug.spawnEdge === 'left' ? '-10%' : bug.spawnEdge === 'right' ? '110%' : `${(cell.x * 100 / GRID_SIZE) + 8}%`,
  });

  useEffect(() => {
    const targetTop = (cell.y * 100 / GRID_SIZE) + 8; 
    const targetLeft = (cell.x * 100 / GRID_SIZE) + 8;

    requestAnimationFrame(() => {
      setStyle({
        opacity: 1,
        top: `${targetTop}%`,
        left: `${targetLeft}%`,
        transition: `top ${BUG_TRAVEL_TIME}ms linear, left ${BUG_TRAVEL_TIME}ms linear`
      });
    });
  }, [bug.id, cell.x, cell.y]); 

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(e); }}
      style={style}
      className={`absolute w-20 h-20 -ml-4 -mt-4 z-40 flex items-center justify-center filter drop-shadow-md active:scale-90 transition-transform cursor-pointer touch-manipulation ${bug.state === 'ATTACKING' ? 'animate-bounce' : ''}`}
    >
      <img src={ASSET_PATHS.NPCS.BUG} alt="Bug" className="w-16 h-16 object-contain filter hue-rotate-90" />
    </button>
  );
});

const UfoComponent = memo(({ ufo, cell, onClick }: { ufo: Ufo, cell: Cell, onClick: (e: React.MouseEvent) => void }) => {
  const [style, setStyle] = useState<React.CSSProperties>({
    top: '-20%',
    left: '50%',
    opacity: 1,
  });
  
  const [isExploding, setIsExploding] = useState(false);
  const [showHitText, setShowHitText] = useState(false);

  useEffect(() => {
    const targetTop = (cell.y * 100 / GRID_SIZE) - 5; 
    const targetLeft = (cell.x * 100 / GRID_SIZE) + 8;

    if (ufo.state === 'ENTERING') {
      requestAnimationFrame(() => {
        setStyle({
          top: `${targetTop}%`,
          left: `${targetLeft}%`,
          opacity: 1,
          transition: 'top 1s cubic-bezier(0.175, 0.885, 0.32, 1.275), left 1s ease-in-out'
        });
      });
    } else if (ufo.state === 'LEAVING') {
      setStyle({
        top: '-50%',
        left: `${targetLeft}%`,
        opacity: 0,
        transition: 'all 0.5s ease-in'
      });
    } else {
      setStyle({
        top: `${targetTop}%`,
        left: `${targetLeft}%`,
        opacity: 1,
      });
    }
  }, [ufo.state, cell.x, cell.y]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const hitsLeft = UFO_CLICKS_REQUIRED - ufo.clicksTaken - 1;

    if (hitsLeft > 0) {
       setShowHitText(true);
       setTimeout(() => setShowHitText(false), 500);
    } else {
       setIsExploding(true);
    }
    
    onClick(e);
  };

  if (ufo.state === 'LEAVING' && style.opacity === 0) return null;

  return (
    <div style={style} className="absolute w-20 h-20 -ml-4 -mt-10 z-50 flex flex-col items-center justify-end pointer-events-none">
      {(ufo.state === 'HOVERING' || ufo.state === 'ABDUCTING') && !isExploding && (
        <div className="w-10 h-24 bg-gradient-to-b from-green-400/60 to-transparent absolute top-10 left-1/2 -translate-x-1/2 animate-pulse" 
             style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)' }}>
        </div>
      )}
      
      {showHitText && <div className="absolute -top-6 text-[10px] font-black text-red-500 bg-white px-1 rounded animate-bounce">1 HIT LEFT!</div>}

      <button 
        onClick={handleClick}
        className={`pointer-events-auto transform transition-transform ${ufo.state === 'HOVERING' ? 'animate-bounce' : ''}`}
      >
         <img 
           src={isExploding ? ASSET_PATHS.NPCS.EXPLOSION : ASSET_PATHS.NPCS.UFO} 
           alt="UFO" 
           className="w-16 h-16 object-contain filter drop-shadow-[0_0_10px_rgba(74,222,128,0.8)]"
         />
      </button>
    </div>
  );
});

// Single Grid Cell Component
const GridCell = memo(({ cell, fish, timeNow, ufoState, onCellClick, onUnlock, isUnlockable, isSelected, unlockCost }: any) => {
  const crop = cell.cropId ? CROPS.find((c: any) => c.id === cell.cropId) : null;
  
  const [isShaking, setIsShaking] = useState(false);

  let progress = 0;
  let isReady = false;
  if (cell.plantedAt && crop && !cell.isRuined) {
    const elapsed = (timeNow - cell.plantedAt) / 1000;
    progress = Math.min(100, (elapsed / crop.growthTime) * 100);
    isReady = progress >= 100;
  }

  // Render Locked Cell
  if (!cell.isUnlocked) {
    const canAfford = fish >= unlockCost;
    const handleLockedClick = () => {
      if (isUnlockable) {
        if (canAfford) {
          onUnlock(cell);
        } else {
          setIsShaking(true);
          setTimeout(() => setIsShaking(false), 500);
        }
      }
    };

    return (
      <button
        onClick={handleLockedClick}
        disabled={!isUnlockable && !isShaking} 
        className={`relative rounded-md border-2 border-dashed flex flex-col items-center justify-center transition-all w-full h-full
          ${isShaking ? 'animate-shake border-red-400 bg-red-50/50' : ''}
          ${isUnlockable && !isShaking
            ? canAfford 
              ? 'border-blue-400 bg-blue-50/30 active:scale-95 cursor-pointer hover:bg-blue-50/50' 
              : 'border-slate-300 bg-slate-100/50 opacity-80 cursor-pointer hover:bg-slate-100/70'
            : !isShaking ? 'border-slate-200 bg-slate-100/10 opacity-30 cursor-not-allowed' : ''}
        `}
      >
        {isUnlockable && (
          <>
            <img src={ASSET_PATHS.ICONS.LOCK} alt="Locked" className="w-8 h-8 object-contain mb-1 opacity-60" />
            <div className={`text-[11px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm transition-colors
              ${isShaking ? 'bg-red-500 text-white' : canAfford ? 'bg-blue-500 text-white animate-pulse' : 'bg-slate-400 text-white'}
            `}>
              <img src={ASSET_PATHS.ICONS.FISH} alt="Fish" className="w-3 h-3 object-contain" /> {unlockCost}
            </div>
          </>
        )}
      </button>
    );
  }

  // Render Active Cell
  const isInfested = cell.isInfested; 
  const isPestDamaged = cell.isPestDamaged; 
  const isRuined = cell.isRuined;
  const bingoMultiplier = cell.bingoMultiplier || 1;
  const isBingo = bingoMultiplier > 1;
  const isBingoLocked = !!cell.bingoGroupId;
  const isBeingAbducted = ufoState?.state === 'ABDUCTING' && ufoState?.targetCellId === cell.id;

  return (
    <div
      onClick={() => onCellClick(cell)}
      className={`relative rounded-md border flex flex-col items-center justify-center select-none active:scale-95 transition-transform overflow-hidden cursor-pointer
        ${isSelected ? 'selected-tile-highlight' : ''}
        ${isBingoLocked ? 'tile-locked bingo-progress-highlight' : ''}
        ${isRuined ? 'bg-slate-300 border-slate-400 grayscale' : 
          isPestDamaged ? 'bg-amber-100/50 border-amber-500 sepia-[0.6]' : 
          isInfested ? 'bg-red-50 border-red-500 animate-pulse' : 
          crop ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200 shadow-sm'} 
        ${isReady && !isRuined ? 'ring-2 ring-emerald-500' : ''}`}
    >
      {!crop ? (
        <>
          <span className="text-slate-300 text-2xl font-light">+</span>
        </>
      ) : (
        <>
          {isBingo && !isRuined && (
            <div className="absolute inset-0 bg-yellow-400/20 z-0 animate-pulse"></div>
          )}
          
          {isPestDamaged && !isRuined && (
             <div className="absolute top-0 left-0 bg-red-600 text-white text-[8px] font-black px-1 rounded-br-lg z-30 shadow-sm animate-pulse">
               50% OFF
             </div>
          )}

          {!isRuined && !isReady && (
            <div className="absolute bottom-1 left-1 right-1 h-1.5 bg-slate-700 rounded-full overflow-hidden z-20">
              <div className="h-full transition-all duration-1000 ease-linear" style={{ width: `${progress}%`, backgroundColor: COLORS.GROWTH_FILL }} />
            </div>
          )}
          
          <div className={`relative z-10 w-[70%] h-[70%] flex items-center justify-center transition-transform duration-500 ${isBeingAbducted ? 'animate-ping' : ''} ${isPestDamaged && !isRuined ? 'opacity-70 saturate-50' : ''}`} style={{ transform: `scale(${0.5 + (progress / 200)})` }}>
             {isRuined ? (
               <img src={ASSET_PATHS.STATUS.WITHERED} alt="Ruined" className="w-full h-full object-contain filter drop-shadow-sm" />
             ) : (
               <img 
                 src={crop.imageUrl} 
                 alt={crop.name} 
                 className="w-full h-full object-contain filter drop-shadow-sm" 
               />
             )}
             
             {isPestDamaged && !isRuined && (
               <img src={ASSET_PATHS.STATUS.WITHERED} alt="Damaged" className="absolute -bottom-1 -right-1 w-4 h-4 object-contain" />
             )}
          </div>
          {isInfested && <div className="absolute inset-0 bg-red-500/20 animate-pulse z-0"></div>}
        </>
      )}
    </div>
  );
}, (prev, next) => {
   if (!prev.cell.isUnlocked) {
      return prev.fish === next.fish && prev.isUnlockable === next.isUnlockable && prev.unlockCost === next.unlockCost;
   }
   const wasGrowing = prev.cell.cropId && !prev.cell.isRuined;
   const isGrowing = next.cell.cropId && !next.cell.isRuined;
   if (wasGrowing || isGrowing) {
     return prev.timeNow === next.timeNow && prev.cell === next.cell && prev.isSelected === next.isSelected;
   }
   return prev.cell === next.cell && prev.gold === next.gold && prev.isSelected === next.isSelected;
});

// --- MAIN GRID COMPONENT ---

export const FarmGrid: React.FC<FarmGridProps> = ({ cells, gold, fish, bugs, ufo, bingoLines, criticalTexts, onCellClick, onUnlock, onBugClick, onUfoClick, timeNow, nextUnlockCost, selectedCellId }) => {
  const checkAdjacency = (target: Cell) => {
    const neighbors = [
      { x: target.x, y: target.y - 1 },
      { x: target.x, y: target.y + 1 },
      { x: target.x - 1, y: target.y },
      { x: target.x + 1, y: target.y },
    ];
    return neighbors.some(n => cells.find(c => c.x === n.x && c.y === n.y)?.isUnlocked);
  };

  const unlockedCount = cells.filter(c => c.isUnlocked).length;
  const isMaxExpansion = unlockedCount >= GRID_SIZE * GRID_SIZE;
  const getCenterPercent = (index: number) => (index * 100 / GRID_SIZE) + (100 / (GRID_SIZE * 2));

  return (
    <div className="w-full h-full flex flex-col items-center justify-center overflow-hidden">
      <div 
        className="grid gap-1 relative"
        style={{ 
          gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
          width: 'min(95%, 95vh)', 
          aspectRatio: '1/1'
        }}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-30 overflow-visible">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          {bingoLines.map(line => (
             <line 
               key={line.id}
               x1={`${getCenterPercent(line.startX)}%`} 
               y1={`${getCenterPercent(line.startY)}%`} 
               x2={`${getCenterPercent(line.endX)}%`} 
               y2={`${getCenterPercent(line.endY)}%`} 
               stroke="#FBBF24" 
               strokeWidth="4"
               strokeLinecap="round"
               filter="url(#glow)"
               className="animate-pulse opacity-80"
             />
          ))}
        </svg>

        {bugs.map(bug => {
          const targetCell = cells.find(c => c.id === bug.targetCellId);
          if (!targetCell) return null;
          return <BugComponent key={bug.id} bug={bug} cell={targetCell} onClick={(e) => onBugClick(bug.id, e)} />;
        })}

        {ufo && (() => {
           const targetCell = cells.find(c => c.id === ufo.targetCellId);
           if (!targetCell) return null;
           return <UfoComponent key={ufo.id} ufo={ufo} cell={targetCell} onClick={onUfoClick} />;
        })()}

        {cells.map(cell => (
          <GridCell 
            key={cell.id} 
            cell={cell} 
            gold={gold} 
            fish={fish}
            timeNow={timeNow} 
            ufoState={ufo}
            onCellClick={onCellClick} 
            onUnlock={onUnlock} 
            isUnlockable={!cell.isUnlocked ? checkAdjacency(cell) : false} 
            isSelected={selectedCellId === cell.id}
            unlockCost={nextUnlockCost}
          />
        ))}

        {criticalTexts && criticalTexts.map(ct => (
          <div
            key={ct.id}
            className={`absolute z-[200] pointer-events-none font-black text-2xl italic animate-combo-float ${ct.colorClass}`}
            style={{ 
              left: `${ct.x}%`, 
              top: `${ct.y}%`,
              textShadow: '2px 2px 0px #000, -1px -1px 0px #fff',
              whiteSpace: 'nowrap'
            }}
          >
            {ct.text}
          </div>
        ))}
      </div>
      {isMaxExpansion && (
        <div className="mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
          Max Expansion Reached
        </div>
      )}
    </div>
  );
};
    