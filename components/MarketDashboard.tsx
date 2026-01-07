
import React, { useEffect } from 'react';
import { LineChart, Line, YAxis, ResponsiveContainer } from 'recharts';
import { MarketState, Inventory } from '../types';
import { CROPS, ASSET_PATHS } from '../constants';

interface MarketDashboardProps {
  marketState: MarketState;
  inventory: Inventory;
  onSell: (cropId: string, amount: number) => void;
  highlightedCropId?: string | null;
  onBack: () => void;
}

export const MarketDashboard: React.FC<MarketDashboardProps> = ({ 
  marketState, inventory, onSell, highlightedCropId, onBack 
}) => {
  // Sort by inventory count (desc), then name
  const sortedCrops = [...CROPS].sort((a, b) => {
    const qtyA = inventory[a.id]?.count || 0;
    const qtyB = inventory[b.id]?.count || 0;
    return qtyB !== qtyA ? qtyB - qtyA : a.name.localeCompare(b.name);
  });

  useEffect(() => {
    if (highlightedCropId) {
      const element = document.getElementById(`market-row-${highlightedCropId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('bg-blue-50');
        const timer = setTimeout(() => element.classList.remove('bg-blue-50'), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [highlightedCropId]);

  return (
    <div className="w-full h-full bg-slate-50 flex flex-col font-sans">
      <header className="flex-none p-4 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <img src={ASSET_PATHS.ICONS.MARKET} alt="Chart" className="w-6 h-6 object-contain" />
            실시간 마켓
          </h2>
          <p className="text-[10px] text-slate-500 font-bold">Live • 10초마다 시세 변동</p>
        </div>
        <button onClick={onBack} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-lg font-bold text-sm transition-colors">
          닫기
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar pb-24">
        <div className="grid grid-cols-1 gap-3">
          {sortedCrops.map(crop => {
            const marketData = marketState[crop.id];
            if (!marketData) return null;

            const qty = inventory[crop.id]?.count || 0;
            const chartData = marketData.history.map((val, idx) => ({ i: idx, val }));
            
            // Stock Concept: Up(Red), Down(Blue)
            const isUp = marketData.trend === 'up';
            const isDown = marketData.trend === 'down';
            const priceColor = isUp ? 'text-red-600' : isDown ? 'text-blue-600' : 'text-slate-600';
            const trendIcon = isUp ? ASSET_PATHS.ICONS.TREND_UP : isDown ? ASSET_PATHS.ICONS.TREND_DOWN : null;
            
            const percentDiff = ((marketData.currentPrice - crop.baseSellPrice) / crop.baseSellPrice) * 100;

            return (
              <div key={crop.id} id={`market-row-${crop.id}`} className={`bg-white p-4 rounded-2xl border border-slate-200 shadow-sm transition-all ${highlightedCropId === crop.id ? 'ring-2 ring-blue-400 bg-blue-50' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <img src={crop.imageUrl} alt={crop.name} className="w-12 h-12 object-contain transform hover:scale-110 transition-transform" />
                    <div>
                      <div className="font-black text-slate-800 text-lg leading-tight">{crop.name}</div>
                      <div className={`font-mono font-black text-lg ${priceColor} flex items-center gap-1`}>
                        {marketData.currentPrice.toLocaleString()} G
                        <span className="text-xs ml-2 inline-flex items-center gap-1">
                          {trendIcon && <img src={trendIcon} className="w-3 h-3" alt="trend" />}
                          {Math.abs(percentDiff).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  {qty > 0 && (
                    <div className="text-right">
                      <div className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm">보유: {qty}</div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-2">
                  <div className="h-12 flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <Line 
                          type="monotone" 
                          dataKey="val" 
                          stroke={isUp ? '#ef4444' : isDown ? '#2563eb' : '#94a3b8'} 
                          strokeWidth={3} 
                          dot={false}
                          isAnimationActive={true}
                        />
                        <YAxis domain={['dataMin - 5', 'dataMax + 5']} hide />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <button
                    disabled={qty === 0}
                    onClick={() => onSell(crop.id, qty)}
                    className={`px-5 py-2.5 rounded-xl font-black text-sm shadow-md transition-all active:scale-90 ${
                      qty > 0 ? 'bg-slate-900 text-white hover:bg-black' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    판매
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
    