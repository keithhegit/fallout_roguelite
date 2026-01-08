import React from 'react';
import { EquipmentSlot, Item } from '../types';
import { ShieldCheck, X, Sword, Shield, Zap, FlaskConical, ScrollText, Boxes, Dna, CircleHelp } from 'lucide-react';
import { getItemStats } from '../utils/itemUtils';
import { 
  getRarityBorder, 
  getRarityGlow, 
  getRarityTextColor, 
  getRarityBadge, 
  getRarityNameClasses, 
  getRarityDisplayName,
  normalizeRarityValue 
} from '../utils/rarityUtils';
import { getEquipmentSlotConfig } from '../utils/equipmentUtils';
import { ItemType } from '../types';

interface Props {
  equippedItems: Partial<Record<EquipmentSlot, string>>;
  inventory: Item[];
  natalArtifactId?: string;
  onUnequip: (slot: EquipmentSlot) => void;
}

const EquipmentPanel: React.FC<Props> = ({
  equippedItems,
  inventory,
  natalArtifactId,
  onUnequip,
}) => {
  const getItemById = (id: string | undefined): Item | null => {
    if (!id) return null;
    return inventory.find((item) => item.id === id) || null;
  };

  // 使用统一的工具函数获取槽位配置
  const slotConfig = getEquipmentSlotConfig();

  return (
    <div className="bg-stone-950/20 rounded-none border border-stone-800 p-5 relative overflow-hidden font-mono">
      {/* CRT Visual Layers */}
      <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none z-50"></div>

      <h3 className="text-xs font-bold mb-5 flex items-center gap-2 text-stone-300 uppercase tracking-[0.3em] relative z-10">
        <ShieldCheck size={16} className="text-yellow-500/80 animate-pulse" />
        NEURAL_LINK_INTERFACE
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 relative z-10">
        {slotConfig.map(({ slot, label }) => {
          const itemId = equippedItems[slot];
          const item = getItemById(itemId);
          const isNatal = item ? item.id === natalArtifactId : false;
          const stats = item ? getItemStats(item, isNatal) : null;
          const rarity = normalizeRarityValue(item?.rarity);
          const rarityLabel = getRarityDisplayName(rarity);
          const showLevel =
            item && typeof item.level === 'number' && Number.isFinite(item.level) && item.level > 0;
          const reviveChances =
            item && typeof item.reviveChances === 'number' && Number.isFinite(item.reviveChances)
              ? item.reviveChances
              : undefined;

          // Helper to get type icon
          const getTypeIcon = () => {
            if (!item) return null;
            switch (item.type) {
              case ItemType.Weapon: return <Sword size={16} />;
              case ItemType.Armor: return <Shield size={16} />;
              case ItemType.Pill: return <FlaskConical size={16} />;
              // case ItemType.Consumable: return <Zap size={16} />;
              case ItemType.Recipe: return <ScrollText size={16} />;
              case ItemType.Material: return <Boxes size={16} />;
              case ItemType.AdvancedItem: return <Dna size={16} />;
              default: return <CircleHelp size={16} />;
            }
          };

          return (
            <div
              key={slot}
              className={`group relative border rounded-none p-3 h-[180px] flex flex-col transition-all duration-300 ${
                item 
                  ? `bg-stone-950/50 ${getRarityBorder(rarity)} ${getRarityGlow(rarity)}` 
                  : 'border-stone-800/40 bg-stone-900/5 opacity-60 border-dashed'
              }`}
            >
              <div className="text-[9px] text-stone-500 mb-2 uppercase font-bold tracking-widest shrink-0">{label}</div>

              {item ? (
                <>
                  <div className="flex-1 min-h-0 flex flex-col">
                    <div className="flex gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-none border flex items-center justify-center shrink-0 ${getRarityBorder(rarity)} bg-stone-900/50 ${getRarityTextColor(rarity)} shadow-inner`}>
                        {getTypeIcon()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`${getRarityNameClasses(rarity)} font-bold text-[10px] leading-tight line-clamp-2 uppercase tracking-wider`}>
                          {item.name}
                          {showLevel && (
                            <span className="text-[9px] text-stone-500 font-normal ml-1">+{item.level}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-1.5 items-center mb-2">
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-none uppercase font-bold tracking-widest ${getRarityBadge(rarity)}`}>
                        {rarityLabel}
                      </span>
                    </div>

                    {reviveChances !== undefined && (
                      <div className={`text-[9px] mb-2 font-bold px-1.5 py-0.5 rounded-none border ${
                        reviveChances > 0 
                          ? 'text-yellow-500 border-yellow-900/30 bg-yellow-950/10' 
                          : 'text-stone-500 border-stone-800 bg-stone-900/20'
                      }`}>
                        {reviveChances > 0 ? `LINK_STABILITY: ${reviveChances}` : 'SIGNAL_LOST'}
                      </div>
                    )}

                    {stats && (
                      <div className="text-[9px] leading-relaxed space-y-0.5 flex-1 min-h-0 overflow-y-auto scrollbar-hide uppercase font-mono tracking-tighter">
                        {stats.attack > 0 && <div className="text-red-400/80 flex justify-between"><span>FP_FIREPOWER</span><span>+{stats.attack}</span></div>}
                        {stats.defense > 0 && <div className="text-blue-400/80 flex justify-between"><span>DR_REDUCTION</span><span>+{stats.defense}</span></div>}
                        {stats.hp > 0 && <div className="text-emerald-400/80 flex justify-between"><span>HP_VITALITY</span><span>+{stats.hp}</span></div>}
                        {stats.spirit > 0 && <div className="text-purple-400/80 flex justify-between"><span>PER_COGNITION</span><span>+{stats.spirit}</span></div>}
                        {stats.physique > 0 && <div className="text-amber-400/80 flex justify-between"><span>END_STAMINA</span><span>+{stats.physique}</span></div>}
                        {stats.speed > 0 && <div className="text-cyan-400/80 flex justify-between"><span>AGI_REFLEX</span><span>+{stats.speed}</span></div>}
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => onUnequip(slot)}
                    className="mt-3 w-full py-1.5 bg-stone-950 hover:bg-red-950/20 hover:text-red-500 hover:border-red-900/50 border border-stone-800 text-stone-600 text-[9px] rounded-none transition-all duration-300 flex items-center justify-center gap-1.5 shrink-0 uppercase font-bold tracking-widest group-hover:border-stone-700"
                  >
                    <X size={10} />
                    DISCONNECT
                  </button>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-stone-700 gap-2 opacity-30">
                  <div className="w-8 h-8 rounded-none border border-dashed border-stone-800 flex items-center justify-center">
                    <X size={14} className="opacity-50" />
                  </div>
                  <span className="text-[9px] uppercase font-bold tracking-widest">OFFLINE</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EquipmentPanel;

