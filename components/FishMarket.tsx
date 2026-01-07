
import React, { useState } from 'react';
import { Inventory, Crop } from '../types';
import { FISH_MARKET_ITEMS, CROPS, COLORS, ASSET_PATHS } from '../constants';

interface FishMarketProps {
  fish: number;
  gold: number;
  inventory: Inventory;
  onPurchase: (itemId: string) => void;
}

export const FishMarket: React.FC<FishMarketProps> = ({ fish, gold, inventory, onPurchase }) => {
  const [activeTab, setActiveTab] = useState<'SHOP' | 'BAG'>('SHOP');

  // Filter for inventory items that actually exist
  const inventoryItems = Object.entries(inventory).filter(([_, item]) => item.count > 0);

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 text-white relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
         <div className="absolute top-[-50px] left-[-50px] w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20"></div>
         <div className="absolute bottom-[-50px] right-[-50px] w-64 h-64 bg-cyan-500 rounded-full blur-[100px] opacity-20"></div>
      </div>

      {/* Header */}
      <div className="z-10 p-4 border-b border-blue-800 bg-slate-900/80 backdrop-blur-md">
         <div className="flex justify-between items-center mb-4">
             <h2 className="text-xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center gap-2">
               <img src={ASSET_PATHS.ICONS.FISH} alt="Fish" className="w-6 h-6 object-contain" />
               FISH EXCHANGE
             </h2>
             <div className="bg-blue-900/50 border border-blue-700 px-3 py-1 rounded-full flex items-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
               <img src={ASSET_PATHS.ICONS.FISH} alt="Fish" className="w-5 h-5 object-contain" />
               <span className="font-mono font-bold text-cyan-300 text-lg">{fish}</span>
             </div>
         </div>

         {/* Tabs */}
         <div className="flex p-1 bg-slate-800 rounded-lg">
            <button 
              onClick={() => setActiveTab('SHOP')}
              className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'SHOP' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
               🛒 Premium Store
            </button>
            <button 
              onClick={() => setActiveTab('BAG')}
              className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'BAG' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
               🎒 My Inventory
            </button>
         </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar z-10 pb-20">
         
         {/* --- SHOP TAB --- */}
         {activeTab === 'SHOP' && (
           <div className="grid grid-cols-1 gap-4">
             {FISH_MARKET_ITEMS.map(item => {
               const canAfford = fish >= item.cost;
               return (
                 <div key={item.id} className={`relative p-[1px] rounded-xl bg-gradient-to-br ${canAfford ? 'from-cyan-400 to-blue-600' : 'from-slate-700 to-slate-600'}`}>
                   <div className="bg-slate-900 rounded-xl p-4 h-full flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-contain filter drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                        <div className={`px-3 py-1 rounded font-black font-mono ${canAfford ? 'bg-cyan-900 text-cyan-300' : 'bg-slate-800 text-slate-500'}`}>
                           {item.cost} 🐟
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1">{item.name}</h3>
                      <p className="text-xs text-blue-200 mb-4 leading-relaxed">{item.description}</p>
                      <button 
                        disabled={!canAfford}
                        onClick={() => onPurchase(item.id)}
                        className={`mt-auto w-full py-2 rounded-lg font-bold uppercase tracking-wider transition-all active:scale-95 ${canAfford ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)]' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                      >
                        {canAfford ? 'Buy Now' : 'Not Enough Fish'}
                      </button>
                   </div>
                 </div>
               );
             })}
           </div>
         )}

         {/* --- INVENTORY TAB --- */}
         {activeTab === 'BAG' && (
           <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center mb-2 px-1">
                 <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">Net Worth</span>
                 <span className="font-mono text-amber-400 font-bold">{gold.toLocaleString()} G</span>
              </div>
              
              {inventoryItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500 border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/50">
                   <img src={ASSET_PATHS.NPCS.CAT_SCARED} alt="empty" className="w-16 h-16 opacity-30 grayscale mb-2" />
                   <span>Empty Bag</span>
                </div>
              ) : (
                inventoryItems.map(([cropId, item]) => {
                  const crop = CROPS.find(c => c.id === cropId);
                  if (!crop) return null;
                  
                  let freshnessColor = COLORS.FRESH_HIGH;
                  if (item.freshness < 70) freshnessColor = COLORS.FRESH_MED;
                  if (item.freshness < 30) freshnessColor = COLORS.FRESH_LOW;
                  const isFrozen = item.frozenUntil > Date.now();

                  return (
                    <div key={cropId} className="flex items-center gap-3 p-3 bg-slate-800/80 rounded-xl border border-slate-700 shadow-sm backdrop-blur-sm">
                      <div className="bg-slate-700/50 p-2 rounded-lg">
                        <img src={crop.imageUrl} alt={crop.name} className="w-10 h-10 object-contain" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div className="font-bold text-slate-200">{crop.name}</div>
                          <div className="text-xs bg-slate-900 text-slate-400 px-2 py-0.5 rounded-full font-bold border border-slate-700">x{item.count}</div>
                        </div>
                        <div className="mt-2 w-full flex items-center gap-2">
                           <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                              <div className="h-full transition-all" style={{ width: `${item.freshness}%`, backgroundColor: freshnessColor }}></div>
                           </div>
                           <span className="text-[10px] font-bold text-slate-500 w-8 text-right">{Math.round(item.freshness)}%</span>
                           {isFrozen && <img src={ASSET_PATHS.STATUS.FROZEN} alt="Frozen" className="w-4 h-4 object-contain" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
           </div>
         )}
      </div>
    </div>
  );
};
    