import React from 'react';
import { Inventory, Crop, InventoryItemData } from '../types';
import { CROPS, COLORS, ASSET_PATHS } from '../constants';

interface InventorySidebarProps {
  inventory: Inventory;
  gold: number;
  fish: number;
  onOpenFishMarket: () => void;
}

export const InventorySidebar: React.FC<InventorySidebarProps> = ({ inventory, gold, fish, onOpenFishMarket }) => {
  const inventoryItems = (Object.entries(inventory) as [string, InventoryItemData][]).filter(([_, item]) => item.count > 0);

  return (
    <div className="w-full h-full flex flex-col bg-white">
      <div className="p-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md z-10">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <img src={ASSET_PATHS.ICONS.BAG} alt="Bag" className="w-6 h-6 object-contain" /> 
          Mirae's Bag
        </h2>
        <div className="flex justify-between items-end mt-2">
           <div>
             <div className="text-xs opacity-90">Total Net Worth</div>
             <div className="font-mono font-bold text-lg">{gold.toLocaleString()} G</div>
           </div>
           <button 
             onClick={onOpenFishMarket}
             className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg flex items-center gap-2 font-bold text-sm transition-colors border border-white/30"
           >
             <div className="flex items-center gap-1">
               <img src={ASSET_PATHS.ICONS.FISH} alt="Fish" className="w-4 h-4 object-contain" />
               <span>{fish}</span>
             </div>
             <span>Shop →</span>
           </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50 pb-20">
        {inventoryItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <img src={ASSET_PATHS.NPCS.CAT_SCARED} alt="Empty" className="w-16 h-16 opacity-50 grayscale mb-2" />
            <span>Your bag is empty.</span>
            <span className="text-xs mt-1">Grow crops to fill it up!</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {inventoryItems.map(([cropId, item]) => {
              const crop = CROPS.find(c => c.id === cropId);
              if (!crop) return null;
              
              let freshnessColor = COLORS.FRESH_HIGH;
              if (item.freshness < 70) freshnessColor = COLORS.FRESH_MED;
              if (item.freshness < 30) freshnessColor = COLORS.FRESH_LOW;
              const isFrozen = item.frozenUntil > Date.now();

              return (
                <div key={cropId} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="bg-slate-100 p-2 rounded-lg">
                    <img src={crop.imageUrl} alt={crop.name} className="w-10 h-10 object-contain" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div className="font-bold text-slate-800">{crop.name}</div>
                      <div className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">x{item.count}</div>
                    </div>
                    <div className="mt-2 w-full flex items-center gap-2">
                       <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full transition-all" style={{ width: `${item.freshness}%`, backgroundColor: freshnessColor }}></div>
                       </div>
                       <span className="text-[10px] font-bold text-slate-400 w-8 text-right">{Math.round(item.freshness)}%</span>
                       {isFrozen && <img src={ASSET_PATHS.STATUS.FROZEN} alt="Frozen" className="w-4 h-4 object-contain" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};