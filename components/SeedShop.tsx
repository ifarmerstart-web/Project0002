import React from 'react';
import { Crop } from '../types';
import { ASSET_PATHS } from '../constants';

interface SeedShopProps {
  gold: number;
  shopItems: Crop[];
  shopStock: number[];
  secondsUntilRefresh: number;
  phase: number;
  onBuy: (crop: Crop, index: number) => void;
  onSoldOutClick: () => void;
  onClose: () => void;
}

export const SeedShop: React.FC<SeedShopProps> = ({ 
  gold, shopItems, shopStock, secondsUntilRefresh, phase, onBuy, onSoldOutClick, onClose 
}) => {
  const isCritical = secondsUntilRefresh <= 3;

  const getPhaseLabel = () => {
    switch(phase) {
      case 1: return "P1: Starter";
      case 2: return "P2: Advanced";
      case 3: return "P3: Expert";
      case 4: return "P4: Global";
      default: return "";
    }
  };

  return (
    <div className="shop-sidebar animate-pulse-subtle">
      
      {isCritical && (
         <div className="absolute inset-0 bg-red-50/50 animate-pulse z-0 pointer-events-none"></div>
      )}

      {/* Header */}
      <div className={`p-3 border-b flex justify-between items-center transition-colors duration-200 ${isCritical ? 'border-red-200 bg-red-100/50' : 'border-emerald-100 bg-emerald-50/50'}`}>
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 leading-none">
            <img src={ASSET_PATHS.ICONS.FARM} alt="Seeds" className="w-5 h-5 object-contain" />
            Seeds
          </h2>
          <div className="text-slate-500 text-[10px] flex items-center gap-1 mt-1">
             <span className="font-semibold text-emerald-600">{getPhaseLabel()}</span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center hover:bg-slate-200/50 rounded-full transition-colors"
        >
          <img src={ASSET_PATHS.ICONS.CLOSE} alt="Close" className="w-4 h-4 object-contain opacity-60" />
        </button>
      </div>

      {/* Timer Bar */}
      <div className={`px-3 py-1.5 border-b flex justify-between items-center text-xs transition-colors duration-200 ${isCritical ? 'bg-red-200/50 border-red-300' : 'bg-white border-emerald-100'}`}>
         <span className={`font-bold transition-colors ${isCritical ? 'text-red-900' : 'text-emerald-800'}`}>
           {isCritical ? "⚠️ RESTOCKING" : "Refresh in:"}
         </span>
         <div className="flex items-center gap-1 font-mono">
           <span className={`transition-all duration-200 ${isCritical ? 'text-xl font-black text-red-600 scale-110' : 'text-sm font-bold text-emerald-700'}`}>
             {secondsUntilRefresh}
           </span>
           <span className={`text-[10px] ${isCritical ? 'text-red-600 font-bold' : 'text-emerald-700'}`}>s</span>
         </div>
      </div>

      {/* Grid of Items */}
      <div className="flex-1 p-2 overflow-y-auto custom-scrollbar bg-white/50">
        <div className="grid grid-cols-2 gap-2">
          {shopItems.map((crop, index) => {
            const canAfford = gold >= crop.seedPrice;
            const stock = shopStock[index] !== undefined ? shopStock[index] : 0;
            const isSoldOut = stock <= 0;
            
            let containerClass = "relative p-2 rounded-lg border flex flex-col items-center text-center transition-all group overflow-hidden h-32 justify-between";
            
            if (isSoldOut) {
              containerClass += " bg-slate-100 border-slate-200 cursor-pointer grayscale opacity-70";
            } else if (canAfford) {
              containerClass += ` cursor-pointer active:scale-95 shadow-sm 
                ${isCritical 
                   ? 'bg-white border-red-300 hover:border-red-500' 
                   : 'bg-white border-emerald-100 hover:border-emerald-400'
                }`;
            } else {
              containerClass += " bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed";
            }

            return (
              <button
                key={`${crop.id}_${index}`}
                disabled={!canAfford && !isSoldOut}
                onClick={() => {
                  if (isSoldOut) {
                     onSoldOutClick();
                  } else if (canAfford) {
                     onBuy(crop, index);
                  }
                }}
                className={containerClass}
              >
                {/* Stock Badge */}
                <div className={`absolute top-1 left-1 text-[9px] px-1.5 py-[1px] rounded-full font-bold z-10 shadow-sm ${stock === 0 ? 'bg-red-500 text-white' : stock === 1 ? 'bg-orange-500 text-white' : 'bg-slate-700 text-white'}`}>
                  {stock}
                </div>

                {isSoldOut && (
                  <div className="absolute inset-0 bg-slate-900/40 z-20 flex items-center justify-center backdrop-blur-[1px] rounded-lg">
                     <span className="text-white font-black transform -rotate-12 border-2 border-white px-2 py-0.5 text-xs shadow-md">SOLD</span>
                  </div>
                )}

                {/* Icon */}
                <img 
                  src={crop.imageUrl} 
                  alt={crop.name} 
                  className="w-12 h-12 mt-2 object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-sm" 
                />
                
                {/* Name & Price Row */}
                <div className="w-full">
                   <h3 className="font-bold text-slate-800 text-[10px] leading-tight w-full truncate">{crop.name}</h3>
                   <div className={`font-mono font-bold text-xs leading-none mt-1 ${canAfford && !isSoldOut ? (isCritical ? 'text-red-600' : 'text-emerald-600') : 'text-slate-400'}`}>
                     {crop.seedPrice} G
                   </div>
                </div>
              </button>
            );
          })}
        </div>
        
        {shopItems.length === 0 && (
           <div className="text-center py-4 text-xs text-slate-400">
              Restocking...
           </div>
        )}
      </div>
    </div>
  );
};