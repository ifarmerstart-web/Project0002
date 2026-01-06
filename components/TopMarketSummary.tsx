import React, { useState } from 'react';
import { Inventory, MarketState, Cell } from '../types';
import { CROPS, ASSET_PATHS } from '../constants';

interface TopMarketSummaryProps {
  inventory: Inventory;
  marketState: MarketState;
  cells: Cell[];
  currentTimestamp: number;
  onItemClick: (cropId: string) => void;
  onSell: (cropId: string, amount: number) => void;
}

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
}

export const TopMarketSummary: React.FC<TopMarketSummaryProps> = ({ 
  inventory, marketState, onSell 
}) => {
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);

  // Get all items with inventory > 0
  const inventoryItems = Object.keys(inventory).filter(id => (inventory[id]?.count || 0) > 0);

  const handleSellClick = (e: React.MouseEvent, cropId: string, count: number, price: number, freshness: number, premiumCount: number) => {
    // Calculate value for floating text display
    const freshnessMultiplier = freshness / 100;
    const normalPrice = Math.floor(price * freshnessMultiplier);
    const premiumPrice = Math.floor(price * 1.5 * freshnessMultiplier);
    const normalCount = count - premiumCount;
    const totalValue = (normalCount * normalPrice) + (premiumCount * premiumPrice);

    // Position floating text
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const newText: FloatingText = { 
        id: Date.now(), 
        text: `+${totalValue.toLocaleString()}`, 
        x: rect.left + (rect.width / 2), 
        y: rect.top 
    };
    
    setFloatingTexts(prev => [...prev, newText]);
    setTimeout(() => setFloatingTexts(prev => prev.filter(ft => ft.id !== newText.id)), 1000);

    // Execute Sell Action
    onSell(cropId, count);
  };

  return (
    <>
      <div className="sticky top-0 z-40 w-full bg-white shadow-lg border-b-4 border-slate-100 flex items-stretch h-20">
        {/* Background Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 to-blue-50/50 opacity-50 pointer-events-none" />
        
        {/* Full Width Crop Selling (Horizontal Scroll) */}
        <div className="relative w-full flex gap-3 p-3 overflow-x-auto custom-scrollbar scroll-smooth items-center">
          {inventoryItems.length === 0 ? (
            <div className="flex items-center justify-center w-full h-full text-slate-400 text-sm font-medium italic animate-pulse gap-2">
              <img src={ASSET_PATHS.ICONS.TARGET} className="w-4 h-4 opacity-50" alt="target" /> Harvest crops to sell them here...
            </div>
          ) : (
            inventoryItems.map((cropId) => {
              const item = inventory[cropId];
              const market = marketState[cropId];
              const crop = CROPS.find(c => c.id === cropId);
              
              if (!item || item.count <= 0 || !crop || !market) return null;

              // --- Recommendation Logic ---
              const isGoodPrice = market.currentPrice >= crop.baseSellPrice * 1.2;
              const isPriceRising = market.trend === 'up';
              const shouldSellNow = isGoodPrice || isPriceRising;

              return (
                <div
                  key={cropId}
                  onClick={(e) => handleSellClick(e, cropId, item.count, market.currentPrice, item.freshness, item.premiumCount || 0)}
                  className={`
                    group relative flex-shrink-0 flex items-center gap-4 p-2 px-4 rounded-2xl border-b-4 transition-all cursor-pointer active:scale-95 select-none h-14
                    ${shouldSellNow 
                      ? 'bg-white border-emerald-500 shadow-[0_4px_0_#d1fae5] -translate-y-1' 
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white'}
                  `}
                >
                  {/* Icon & Count */}
                  <div className="relative">
                    <img 
                      src={crop.imageUrl} 
                      alt={crop.name} 
                      className={`w-10 h-10 object-contain ${shouldSellNow ? 'animate-bounce' : ''}`} 
                    />
                    <span className="absolute -top-2 -right-2 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded-lg font-black shadow-sm">
                      {item.count}
                    </span>
                  </div>
                  
                  {/* Info */}
                  <div className="flex flex-col min-w-[60px]">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5 leading-none">
                      {crop.name}
                    </span>
                    <div className="flex items-center gap-1 leading-none">
                      <span className={`font-display font-black text-base ${shouldSellNow ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {market.currentPrice}
                      </span>
                      <span className={`text-[10px] font-black ${
                        market.trend === 'up' ? 'text-red-500 animate-pulse' : 'text-blue-500'
                      }`}>
                         <img src={market.trend === 'up' ? ASSET_PATHS.ICONS.TREND_UP : ASSET_PATHS.ICONS.TREND_DOWN} className="w-3 h-3 inline" alt="trend" />
                      </span>
                    </div>
                  </div>

                  {/* Sell Button Visual */}
                  {shouldSellNow && (
                    <div className="bg-emerald-500 text-white text-[9px] font-black px-2 py-1.5 rounded-xl shadow-[0_2px_0_#059669] animate-pulse whitespace-nowrap">
                      SELL
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Floating Texts Layer */}
      {floatingTexts.map(ft => (
        <div key={ft.id} className="fixed pointer-events-none z-[100] text-emerald-500 font-black text-xl animate-float-up text-shadow-white" style={{ left: ft.x, top: ft.y }}>
          {ft.text}
        </div>
      ))}
      <style>{`@keyframes float-up { 0% { opacity: 1; transform: translate(-50%, 0); } 100% { opacity: 0; transform: translate(-50%, -40px); } } .animate-float-up { animation: float-up 0.8s ease-out forwards; } .text-shadow-white { text-shadow: 1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff; }`}</style>
    </>
  );
};