import React, {
  useState,
  useMemo,
  useTransition,
  useCallback,
  memo,
} from 'react';
import {
  Item,
  ItemType,
  ItemRarity,
  PlayerStats,
  EquipmentSlot,
  RealmType,
} from '../types';
import { ASSETS } from '../constants/assets';
import {
  X,
  Package,
  Archive,
  FileText,
  ShieldCheck,
  Hammer,
  Trash2,
  Sparkles,
  ArrowUpDown,
  Trash,
  Zap,
  Search,
  Filter,
  SlidersHorizontal,
  Shield,
  Sword,
  FlaskConical,
  ScrollText,
  Boxes,
  Dna,
  CircleHelp,
} from 'lucide-react';
import { REALM_ORDER, SPIRITUAL_ROOT_NAMES, FOUNDATION_TREASURES, HEAVEN_EARTH_ESSENCES, HEAVEN_EARTH_MARROWS, LONGEVITY_RULES } from '../constants/index';
import EquipmentPanel from './EquipmentPanel';
import BatchDiscardModal from './BatchDiscardModal';
import BatchUseModal from './BatchUseModal';
import {
  getRarityNameClasses,
  getRarityBorder,
  getRarityBadge,
  getRarityOrder,
  getRarityDisplayName,
  getRarityTextColor,
  normalizeRarityValue,
} from '../utils/rarityUtils';
import { getItemStats, normalizeTypeLabel } from '../utils/itemUtils';
import {
  findEmptyEquipmentSlot,
  isItemEquipped as checkItemEquipped,
  findItemEquippedSlot,
  areSlotsInSameGroup,
  getEquipmentSlotsByType,
} from '../utils/equipmentUtils';
import { useDebounce } from '../hooks/useDebounce';
import { showConfirm } from '../utils/toastUtils';
import { formatValueChange, formatNumber } from '../utils/formatUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  inventory: Item[];
  equippedItems: Partial<Record<EquipmentSlot, string>>;
  natalArtifactId?: string;
  playerRealm: string;
  foundationTreasure?: string;
  heavenEarthEssence?: string;
  heavenEarthMarrow?: string;
  longevityRules?: string[];
  maxLongevityRules?: number;
  onUseItem: (item: Item) => void;
  onEquipItem: (item: Item, slot: EquipmentSlot) => void;
  onUnequipItem: (slot: EquipmentSlot) => void;
  onUpgradeItem: (item: Item) => void;
  onDiscardItem: (item: Item) => void;
  onBatchDiscard: (itemIds: string[]) => void;
  onBatchUse?: (itemIds: string[]) => void;
  onOrganizeInventory?: () => void;
  onRefineNatalArtifact?: (item: Item) => void;
  onUnrefineNatalArtifact?: () => void;
  onRefineAdvancedItem?: (item: Item) => void;
  setItemActionLog?: (log: { text: string; type: string } | null) => void;
}

type ItemCategory = 'all' | 'equipment' | 'pill' | 'consumable' | 'recipe' | 'advancedItem';

// Item Component - Optimized with memo
interface InventoryItemProps {
  item: Item;
  isNatal: boolean;
  canRefine: boolean;
  isEquipped: boolean;
  playerRealm: string;
  foundationTreasure?: string;
  heavenEarthEssence?: string;
  heavenEarthMarrow?: string;
  longevityRules?: string[];
  maxLongevityRules?: number;
  isCompact?: boolean;
  onHover: (item: Item | null) => void;
  onUseItem: (item: Item) => void;
  onEquipItem: (item: Item) => void;
  onUnequipItem: (item: Item) => void;
  onUpgradeItem: (item: Item) => void;
  onDiscardItem: (item: Item) => void;
  onRefineNatalArtifact?: (item: Item) => void;
  onUnrefineNatalArtifact?: () => void;
  onRefineAdvancedItem?: (item: Item) => void;
  setItemActionLog?: (log: { text: string; type: string } | null) => void;
}

const InventoryItem = memo<InventoryItemProps>(
  (props) => {
    const {
      item,
      isNatal,
      canRefine,
      isEquipped,
      playerRealm,
      foundationTreasure,
      heavenEarthEssence,
      heavenEarthMarrow,
      longevityRules,
      maxLongevityRules,
      onHover,
      onUseItem,
      onEquipItem,
      onUnequipItem,
      onUpgradeItem,
      onDiscardItem,
      onRefineNatalArtifact,
      onUnrefineNatalArtifact,
      onRefineAdvancedItem,
      setItemActionLog,
    } = props;
    const isCompact = !!props.isCompact;

    // Use unified utility functions for item stats
    const stats = getItemStats(item, isNatal);
    const rarity = normalizeRarityValue(item.rarity);
    const rarityLabel = getRarityDisplayName(rarity);
    const typeLabel = normalizeTypeLabel(item.type, item);
    const showLevel =
      typeof item.level === 'number' && Number.isFinite(item.level) && item.level > 0;
    const reviveChances =
      typeof item.reviveChances === 'number' && Number.isFinite(item.reviveChances)
        ? item.reviveChances
        : undefined;

    // Helper to get type icon
    const getTypeIcon = () => {
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

    const getRarityColor = (r: string) => {
      // Return tailwind text color class
      if (r === 'common') return 'text-stone-400';
      if (r === 'uncommon') return 'text-emerald-400';
      if (r === 'rare') return 'text-blue-400';
      if (r === 'epic') return 'text-purple-400';
      if (r === 'legendary') return 'text-amber-400';
      if (r === 'mythic') return 'text-red-500';
      return 'text-stone-400';
    };

    const rarityColorClass = getRarityColor(rarity);
    const rarityBorderClass = getRarityBorder(rarity);

    return (
      <div
        className={`relative flex flex-col justify-between group overflow-hidden transition-all duration-200 ${
          isEquipped 
            ? 'bg-stone-900/80 border-2 border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
            : `bg-black/60 hover:bg-stone-900/60 border border-stone-800 hover:border-stone-600`
        }`}
        onMouseEnter={() => onHover(item)}
        onMouseLeave={() => onHover(null)}
      >
        {/* CRT Visual Layers */}
        <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none"></div>
        {isEquipped && <div className="absolute inset-0 bg-amber-500/5 pointer-events-none animate-pulse"></div>}
        
        {/* Header Section */}
        <div className="p-2.5 flex gap-3 relative z-10">
           {/* Icon Box */}
          <div className={`w-10 h-10 shrink-0 border flex items-center justify-center bg-stone-950 shadow-inner ${rarityBorderClass} ${rarityColorClass}`}>
            {getTypeIcon()}
          </div>
          
          <div className="flex-1 min-w-0 flex flex-col justify-center">
             <div className="flex justify-between items-baseline gap-2">
                <h4 className={`text-xs font-bold uppercase tracking-wider truncate ${rarityColorClass} ${isEquipped ? 'text-amber-400' : ''}`}>
                  {item.name}
                </h4>
                {showLevel && (
                  <span className="text-[9px] text-stone-500 font-mono">
                    LVL.{item.level}
                  </span>
                )}
             </div>
             <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[9px] uppercase tracking-widest font-mono ${rarityColorClass} opacity-80`}>
                  {rarityLabel}
                </span>
                <span className="text-[8px] text-stone-600 uppercase tracking-widest font-mono border-l border-stone-800 pl-2">
                  {typeLabel}
                </span>
                {item.quantity > 1 && (
                  <span className="ml-auto text-[9px] bg-stone-800 text-stone-300 px-1 rounded-sm font-mono">
                    x{item.quantity}
                  </span>
                )}
             </div>
          </div>
        </div>

        {/* Content Section */}
        <div className={`${isCompact ? 'px-1.5 pb-1.5' : 'px-2.5 pb-2'} flex-1 relative z-10`}>
           {/* Description / Stats */}
           {!isCompact && (
           <div className="mb-2 min-h-[2.5em]">
              <p className="text-[10px] text-stone-500 italic line-clamp-2 leading-tight">
                {item.description}
              </p>
           </div>
           )}

          {/* Advanced Item Effects Display */}
          {item.type === ItemType.AdvancedItem && item.advancedItemType && item.advancedItemId && (() => {
            let advancedItemData: any = null;
            if (item.advancedItemType === 'foundationTreasure') {
              advancedItemData = FOUNDATION_TREASURES[item.advancedItemId];
            } else if (item.advancedItemType === 'heavenEarthEssence') {
              advancedItemData = HEAVEN_EARTH_ESSENCES[item.advancedItemId];
            } else if (item.advancedItemType === 'heavenEarthMarrow') {
              advancedItemData = HEAVEN_EARTH_MARROWS[item.advancedItemId];
            } else if (item.advancedItemType === 'longevityRule') {
              advancedItemData = LONGEVITY_RULES[item.advancedItemId];
            }

            if (advancedItemData && advancedItemData.effects) {
              const effects = advancedItemData.effects;
              const effectEntries: string[] = [];

              if (effects.hpBonus) effectEntries.push(`HP+${effects.hpBonus}`);
              if (effects.attackBonus) effectEntries.push(`FP+${effects.attackBonus}`);
              if (effects.defenseBonus) effectEntries.push(`DR+${effects.defenseBonus}`);
              if (effects.spiritBonus) effectEntries.push(`PER+${effects.spiritBonus}`);
              if (effects.physiqueBonus) effectEntries.push(`END+${effects.physiqueBonus}`);
              if (effects.speedBonus) effectEntries.push(`AGI+${effects.speedBonus}`);

              return (
                <div className="text-[10px] mb-2 p-1.5 bg-stone-950/50 border border-stone-800/50">
                  {effectEntries.length > 0 && (
                    <div className="text-stone-400 grid grid-cols-2 gap-x-2 gap-y-0.5">
                      {effectEntries.map((entry, idx) => (
                        <span key={idx}>{entry}</span>
                      ))}
                    </div>
                  )}
                  {effects.specialEffect && (
                    <div className="text-emerald-500/80 italic mt-1 border-t border-stone-800/50 pt-0.5">
                      {effects.specialEffect}
                    </div>
                  )}
                </div>
              );
            }
            return null;
          })()}

          {/* Supply utility notes */}
          {item.type === ItemType.Material && (
            <div className="text-[9px] text-blue-400/80 mb-2 p-1.5 bg-blue-950/10 border border-blue-900/30">
              <div className="space-y-0.5">
                {item.name.includes('crate') || item.name.includes('Package') ? (
                  <div>• Medical/Survival components</div>
                ) : item.name.includes('Key') ? (
                  <div>• Vault access protocol</div>
                ) : item.name.includes('Alloy') || item.name.includes('Steel') || item.name.includes('Circuit') ? (
                  <div>• Crafting component</div>
                ) : item.name.includes('Chem') || item.name.includes('Resource') || item.name.includes('Sample') ? (
                  <div>• Chemical synthesis base</div>
                ) : (
                  <div>• General wasteland scrap</div>
                )}
              </div>
            </div>
          )}

          {isNatal && (
            <div className="text-[9px] text-amber-500 mb-2 flex items-center gap-1 border border-amber-900/30 bg-amber-950/10 px-1.5 py-0.5">
              <Sparkles size={10} />
              <span className="font-bold uppercase">Signature Gear (+50%)</span>
            </div>
          )}

          {reviveChances !== undefined && (
             <div className={`text-[9px] mb-2 flex items-center gap-1 px-1.5 py-0.5 border ${reviveChances > 0 ? 'text-yellow-500 border-yellow-900/30 bg-yellow-950/10' : 'text-stone-500 border-stone-800 bg-stone-900/20'}`}>
                <Zap size={10} />
                <span className="uppercase">Charges: {reviveChances > 0 ? reviveChances : 'DEPLETED'}</span>
             </div>
          )}

          {(item.effect || item.permanentEffect) && (
            <div className="text-[10px] mb-2 p-1.5 bg-stone-950/50 border border-stone-800/50 space-y-1">
              {/* Temporary Effects */}
              {item.effect && (
                <div className="text-stone-400 grid grid-cols-2 gap-x-2 gap-y-0.5">
                  {stats.attack > 0 && <span>FP +{stats.attack}</span>}
                  {stats.defense > 0 && <span>DR +{stats.defense}</span>}
                  {stats.hp > 0 && <span>HP +{stats.hp}</span>}
                  {item.effect.exp && item.effect.exp > 0 && <span>XP +{item.effect.exp}</span>}
                  {stats.spirit > 0 && <span>PER +{stats.spirit}</span>}
                  {stats.physique > 0 && <span>END +{stats.physique}</span>}
                  {stats.speed > 0 && <span>AGI +{stats.speed}</span>}
                  {item.effect.lifespan && item.effect.lifespan > 0 && <span>Life +{item.effect.lifespan}</span>}
                </div>
              )}
              {/* Permanent Effects */}
              {item.permanentEffect && (
                <div className="text-emerald-500/90 grid grid-cols-2 gap-x-2 gap-y-0.5 border-t border-stone-800/50 pt-1 mt-1">
                  {item.permanentEffect.attack && item.permanentEffect.attack > 0 && (
                    <span>FP Perm +{item.permanentEffect.attack}</span>
                  )}
                  {item.permanentEffect.defense && item.permanentEffect.defense > 0 && (
                    <span>DR Perm +{item.permanentEffect.defense}</span>
                  )}
                  {item.permanentEffect.maxHp && item.permanentEffect.maxHp > 0 && (
                    <span>HP MAX Perm +{item.permanentEffect.maxHp}</span>
                  )}
                  {item.permanentEffect.spirit && item.permanentEffect.spirit > 0 && (
                    <span>PER Perm +{item.permanentEffect.spirit}</span>
                  )}
                  {item.permanentEffect.physique && item.permanentEffect.physique > 0 && (
                    <span>END Perm +{item.permanentEffect.physique}</span>
                  )}
                  {item.permanentEffect.speed && item.permanentEffect.speed > 0 && (
                    <span>AGI Perm +{item.permanentEffect.speed}</span>
                  )}
                  {item.permanentEffect.maxLifespan && item.permanentEffect.maxLifespan > 0 && (
                    <span>LIFE MAX Perm +{item.permanentEffect.maxLifespan}</span>
                  )}
                  {/* Aptitude Effects */}
                  {item.permanentEffect.spiritualRoots && (() => {
                    const roots = item.permanentEffect.spiritualRoots;
                    const rootEntries: string[] = [];

                    if (roots.metal && roots.metal > 0) rootEntries.push(`${SPIRITUAL_ROOT_NAMES.metal} +${roots.metal}`);
                    if (roots.wood && roots.wood > 0) rootEntries.push(`${SPIRITUAL_ROOT_NAMES.wood} +${roots.wood}`);
                    if (roots.water && roots.water > 0) rootEntries.push(`${SPIRITUAL_ROOT_NAMES.water} +${roots.water}`);
                    if (roots.fire && roots.fire > 0) rootEntries.push(`${SPIRITUAL_ROOT_NAMES.fire} +${roots.fire}`);
                    if (roots.earth && roots.earth > 0) rootEntries.push(`${SPIRITUAL_ROOT_NAMES.earth} +${roots.earth}`);

                    if (rootEntries.length > 0) {
                      const allSame = rootEntries.every(entry => {
                        const match = entry.match(/\+(\d+)$/);
                        return match && match[1] === rootEntries[0].match(/\+(\d+)$/)?.[1];
                      });

                      if (allSame && rootEntries.length === 5) {
                        const value = rootEntries[0].match(/\+(\d+)$/)?.[1] || '0';
                        return <span className="col-span-2">All S.P.E.C.I.A.L. Perm +{value}</span>;
                      } else {
                        return rootEntries.map((entry, idx) => (
                          <span key={idx}>{entry} Perm</span>
                        ));
                      }
                    }
                    return null;
                  })()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="mt-auto border-t border-stone-800 bg-stone-950/50 p-1 flex gap-1">
          {item.isEquippable && item.equipmentSlot ? (
            <>
              {isEquipped ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onUnequipItem(item); }}
                  className="flex-1 bg-stone-800 hover:bg-stone-700 text-stone-300 text-[9px] py-1.5 transition-all border border-stone-700 uppercase tracking-widest font-bold"
                >
                  UNEQUIP
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); onEquipItem(item); }}
                  className="flex-1 bg-blue-900/30 hover:bg-blue-800/50 text-blue-400 text-[9px] py-1.5 transition-all border border-blue-800 hover:border-blue-500 uppercase tracking-widest font-bold"
                >
                  EQUIP
                </button>
              )}
              
              {item.type === ItemType.Artifact && onRefineNatalArtifact && (() => {
                const isDisabled = !isNatal && !canRefine;
                return (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isNatal && onUnrefineNatalArtifact) {
                        onUnrefineNatalArtifact();
                      } else if (!isNatal && canRefine) {
                        onRefineNatalArtifact(item);
                      }
                    }}
                    disabled={isDisabled}
                    className={`px-2 py-1.5 border transition-all ${isNatal
                      ? 'bg-amber-900/30 border-amber-600 text-amber-500'
                      : isDisabled
                        ? 'bg-stone-900/50 border-stone-800 text-stone-600 cursor-not-allowed'
                        : 'bg-purple-900/30 border-purple-800 text-purple-400 hover:bg-purple-800/50'
                      }`}
                    title={isNatal ? 'Dissolve Neural Sync' : 'Establish Neural Sync'}
                  >
                    <Sparkles size={12} />
                  </button>
                );
              })()}
              
              <button
                onClick={(e) => { e.stopPropagation(); onUpgradeItem(item); }}
                className="px-2 bg-stone-900 hover:bg-stone-800 text-stone-400 border border-stone-800 hover:border-stone-600 transition-all"
                title="CALIBRATE"
              >
                <Hammer size={12} />
              </button>
              
              <button
                onClick={(e) => { e.stopPropagation(); onDiscardItem(item); }}
                className="px-2 bg-stone-900 hover:bg-red-900/30 text-stone-500 hover:text-red-500 border border-stone-800 hover:border-red-800 transition-all"
                title="PURGE"
              >
                <Trash2 size={12} />
              </button>
            </>
          ) : (
            <>
              {(() => {
                const isMaterialPack = (item.name.includes('Material Pack')) && item.type === ItemType.Material;
                const isTreasureVaultKey = (item.name === 'Faction Vault Key') && item.type === ItemType.Material;
                const hasEffect = item.effect || item.permanentEffect;
                const isRecipe = item.type === ItemType.Recipe;
                const isUsable = isMaterialPack || isTreasureVaultKey || (hasEffect && item.type !== ItemType.Material) || isRecipe;

                return isUsable ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); onUseItem(item); }}
                    className="flex-1 bg-emerald-900/30 hover:bg-emerald-800/50 text-emerald-400 text-[9px] py-1.5 border border-emerald-800 hover:border-emerald-500 uppercase tracking-widest font-bold transition-all"
                  >
                    {item.type === ItemType.Recipe ? 'ANALYZE' : 'USE'}
                  </button>
                ) : null;
              })()}
              
              {item.type === ItemType.AdvancedItem && item.advancedItemType && onRefineAdvancedItem && (() => {
                const currentRealmIndex = REALM_ORDER.indexOf(playerRealm as RealmType);
                let canRefineItem = false;
                let warningMessage = '';
                
                if (item.advancedItemType === 'foundationTreasure') {
                  canRefineItem = currentRealmIndex >= REALM_ORDER.indexOf(RealmType.QiRefining);
                  warningMessage = `Req: Scavenger`;
                } else if (item.advancedItemType === 'heavenEarthEssence') {
                  canRefineItem = currentRealmIndex >= REALM_ORDER.indexOf(RealmType.GoldenCore);
                  warningMessage = `Req: Mutant`;
                } else if (item.advancedItemType === 'heavenEarthMarrow') {
                  canRefineItem = currentRealmIndex >= REALM_ORDER.indexOf(RealmType.NascentSoul);
                  warningMessage = `Req: Evolved`;
                } else if (item.advancedItemType === 'longevityRule') {
                  canRefineItem = currentRealmIndex >= REALM_ORDER.indexOf(RealmType.DaoCombining);
                  warningMessage = `Req: Apex`;
                }

                // Check ownership logic (simplified for display)
                let alreadyOwned = false;
                 if (item.advancedItemType === 'foundationTreasure' && foundationTreasure) alreadyOwned = true;
                 else if (item.advancedItemType === 'heavenEarthEssence' && heavenEarthEssence) alreadyOwned = true;
                 else if (item.advancedItemType === 'heavenEarthMarrow' && heavenEarthMarrow) alreadyOwned = true;
                 else if (item.advancedItemType === 'longevityRule' && item.advancedItemId && (longevityRules || []).includes(item.advancedItemId)) alreadyOwned = true;

                return (
                  <button
                    onClick={(e) => {
                       e.stopPropagation();
                       if (!canRefineItem || alreadyOwned) return;
                       showConfirm(
                        `Initialize neural link with [${item.name}]?`,
                        'CONFIRM LINK',
                        () => onRefineAdvancedItem(item)
                      );
                    }}
                    disabled={!canRefineItem || alreadyOwned}
                    className={`flex-1 text-[9px] py-1.5 border uppercase tracking-widest font-bold ${!canRefineItem || alreadyOwned
                      ? 'bg-stone-900/50 text-stone-600 border-stone-800 cursor-not-allowed'
                      : 'bg-purple-900/30 hover:bg-purple-800/50 text-purple-400 border-purple-800 hover:border-purple-500'
                      }`}
                  >
                    {alreadyOwned ? 'INSTALLED' : !canRefineItem ? 'LOCKED' : 'INSTALL'}
                  </button>
                );
              })()}
              
              <button
                onClick={(e) => { e.stopPropagation(); onDiscardItem(item); }}
                className="px-2 bg-stone-900 hover:bg-red-900/30 text-stone-500 hover:text-red-500 border border-stone-800 hover:border-red-800 transition-all"
                title="PURGE"
              >
                <Trash2 size={12} />
              </button>
            </>
          )}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if critical props change
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.quantity === nextProps.item.quantity &&
      prevProps.item.level === nextProps.item.level &&
      prevProps.item.rarity === nextProps.item.rarity &&
      prevProps.item.reviveChances === nextProps.item.reviveChances &&
      prevProps.isEquipped === nextProps.isEquipped &&
      prevProps.isNatal === nextProps.isNatal &&
      prevProps.canRefine === nextProps.canRefine &&
      prevProps.playerRealm === nextProps.playerRealm &&
      prevProps.foundationTreasure === nextProps.foundationTreasure &&
      prevProps.heavenEarthEssence === nextProps.heavenEarthEssence &&
      prevProps.heavenEarthMarrow === nextProps.heavenEarthMarrow &&
      prevProps.longevityRules === nextProps.longevityRules &&
      prevProps.maxLongevityRules === nextProps.maxLongevityRules &&
      prevProps.isCompact === nextProps.isCompact
    );
  }
);

InventoryItem.displayName = 'InventoryItem';

const InventoryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  inventory,
  equippedItems,
  natalArtifactId,
  playerRealm,
  foundationTreasure,
  heavenEarthEssence,
  heavenEarthMarrow,
  longevityRules,
  maxLongevityRules,
  onUseItem,
  onEquipItem,
  onUnequipItem,
  onUpgradeItem,
  onDiscardItem,
  onBatchDiscard,
  onBatchUse,
  onOrganizeInventory,
  onRefineNatalArtifact,
  onUnrefineNatalArtifact,
  onRefineAdvancedItem,
  setItemActionLog,
}) => {
  const [hoveredItem, setHoveredItem] = useState<Item | null>(null);
  const [showEquipment, setShowEquipment] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory>('all');
  const [selectedEquipmentSlot, setSelectedEquipmentSlot] = useState<
    EquipmentSlot | 'all'
  >('all');
  const [sortByRarity, setSortByRarity] = useState(true);
  const [isBatchDiscardOpen, setIsBatchDiscardOpen] = useState(false);
  const [isBatchUseOpen, setIsBatchUseOpen] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<
    'equipment' | 'inventory'
  >('inventory');
  // Search and Advanced Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [rarityFilter, setRarityFilter] = useState<ItemRarity | 'all'>('all');
  const [statFilter, setStatFilter] = useState<'all' | 'attack' | 'defense' | 'hp' | 'spirit' | 'physique' | 'speed'>('all');
  const [statFilterMin, setStatFilterMin] = useState<number>(0);
  const [isCompact, setIsCompact] = useState(false);

  // Use useTransition to optimize category switching and avoid blocking UI
  const [isPending, startTransition] = useTransition();

  // Debounce search input to reduce unnecessary re-renders
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const handleBatchDiscard = (itemIds: string[]) => {
    onBatchDiscard(itemIds);
  };

  const handleBatchUse = (itemIds: string[]) => {
    if (onBatchUse) {
      onBatchUse(itemIds);
    }
  };

  // Use useCallback to optimize category change handler
  const handleCategoryChange = useCallback((category: ItemCategory) => {
    startTransition(() => {
      setSelectedCategory(category);
      setSelectedEquipmentSlot('all');
    });
  }, []);

  const handleEquipmentSlotChange = useCallback(
    (slot: EquipmentSlot | 'all') => {
      startTransition(() => {
        setSelectedEquipmentSlot(slot);
      });
    },
    []
  );

  const handleHoverItem = useCallback((item: Item | null) => {
    setHoveredItem(item);
  }, []);

  const handleEquipWrapper = useCallback((item: Item) => {
    // Use smart find function to automatically find the corresponding empty slot
    // For rings, jewelry, and artifacts, it prioritizes empty slots
    // For other equipment types, it uses the corresponding slot (replaces existing if none empty)
    const targetSlot = findEmptyEquipmentSlot(item, equippedItems);

    if (targetSlot) {
      onEquipItem(item, targetSlot);
    }
    // If findEmptyEquipmentSlot returns null, the item cannot be equipped
  }, [equippedItems, onEquipItem]);

  const handleUnequipWrapper = useCallback((item: Item) => {
    const actualSlot = findItemEquippedSlot(item, equippedItems);
    if (actualSlot) {
      onUnequipItem(actualSlot);
    }
  }, [equippedItems, onUnequipItem]);

  // Pre-calculate item equipped status mapping to avoid repetitive calculations during render
  const itemEquippedMap = useMemo(() => {
    const map = new Map<string, boolean>();
    inventory.forEach((item) => {
      map.set(item.id, checkItemEquipped(item, equippedItems));
    });
    return map;
  }, [inventory, equippedItems]);

  // Filter and sort items
  const filteredAndSortedInventory = useMemo(() => {
    // Determine item category
    const getItemCategory = (item: Item): ItemCategory => {
      const typeKey = String(item.type).toLowerCase();
      if (item.type === ItemType.Recipe || typeKey === 'recipe') {
        return 'recipe'; // Recipes have their own category
      }
      if (item.type === ItemType.AdvancedItem || typeKey === 'advanceditem') {
        return 'advancedItem'; // Advanced items have their own category
      }
      if (
        item.isEquippable ||
        item.type === ItemType.Weapon ||
        item.type === ItemType.Armor ||
        item.type === ItemType.Artifact ||
        item.type === ItemType.Accessory ||
        item.type === ItemType.Ring ||
        ['weapon', 'armor', 'artifact', 'accessory', 'ring'].includes(typeKey)
      ) {
        return 'equipment';
      }
      if (item.type === ItemType.Pill || ['pill', 'elixir', 'potion'].includes(typeKey)) {
        return 'pill';
      }
      return 'consumable';
    };

    let filtered = inventory;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = inventory.filter(
        (item) => getItemCategory(item) === selectedCategory
      );
    }

    // If equipment category, further filter by slot (using unified utility functions)
    if (selectedCategory === 'equipment' && selectedEquipmentSlot !== 'all') {
      filtered = filtered.filter((item) => {
        if (!item.equipmentSlot) return false;
        // Use utility function to check if slots belong to the same group
        return areSlotsInSameGroup(item.equipmentSlot, selectedEquipmentSlot);
      });
    }

    // Search filtering (by name and description) - Using debounced query
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase().trim();
      filtered = filtered.filter((item) => {
        const nameMatch = item.name.toLowerCase().includes(query);
        const descMatch = item.description?.toLowerCase().includes(query);
        return nameMatch || descMatch;
      });
    }

    // Rarity filtering
    if (rarityFilter !== 'all') {
      filtered = filtered.filter(
        (item) => normalizeRarityValue(item.rarity) === rarityFilter
      );
    }

    // Attribute filtering - Optimization: Only calculate stats when needed
    if (statFilter !== 'all' && statFilterMin > 0) {
      filtered = filtered.filter((item) => {
        const isNatal = item.id === natalArtifactId;
        const stats = getItemStats(item, isNatal);
        const statValue = stats[statFilter] || 0;
        return statValue >= statFilterMin;
      });
    }

    // Sort by grade (high to low)
    if (sortByRarity) {
      filtered = [...filtered].sort((a, b) => {
        const rarityA = getRarityOrder(normalizeRarityValue(a.rarity));
        const rarityB = getRarityOrder(normalizeRarityValue(b.rarity));
        if (rarityB !== rarityA) {
          return rarityB - rarityA; // High to low
        }
        // If same grade, sort alphabetically
        return a.name.localeCompare(b.name, 'en');
      });
    }

    return filtered;
  }, [inventory, selectedCategory, selectedEquipmentSlot, sortByRarity, debouncedSearchQuery, rarityFilter, statFilter, statFilterMin, natalArtifactId]);

  // Calculate total stats for all equipped items (using unified utility functions)
  const calculateTotalEquippedStats = useMemo(() => {
    let totalAttack = 0;
    let totalDefense = 0;
    let totalHp = 0;

    Object.values(equippedItems).forEach((itemId) => {
      if (itemId) {
        const item = inventory.find((i) => i.id === itemId);
        if (item) {
          // Use unified utility functions for stats
          const isNatal = item.id === natalArtifactId;
          const stats = getItemStats(item, isNatal);

          totalAttack += stats.attack;
          totalDefense += stats.defense;
          totalHp += stats.hp;
        }
      }
    });

    return { attack: totalAttack, defense: totalDefense, hp: totalHp };
  }, [equippedItems, inventory, natalArtifactId]);

  // Get item stats (for comparison) - Using unified utility functions
  const getItemStatsForComparison = useCallback(
    (item: Item) => {
      const isNatal = item.id === natalArtifactId;
      return getItemStats(item, isNatal);
    },
    [natalArtifactId]
  );

  // Use useMemo to cache equipment comparison results to avoid re-calculating every render
  // Note: Must be called before any early returns to obey React Hooks rules
  const comparison = useMemo(() => {
    if (!hoveredItem || !hoveredItem.isEquippable)
      return null;

    // 1. Get the slot to compare against
    let slot: EquipmentSlot | undefined = hoveredItem.equipmentSlot;

    // For items without equipmentSlot (like some Rings/Accessories/Artifacts),
    // try to find a relevant slot based on type
    if (!slot) {
      const slots = getEquipmentSlotsByType(hoveredItem.type as ItemType);
      if (slots.length > 0) {
        // Find an empty slot or use the first one
        slot = slots.find(s => !equippedItems[s]) || slots[0];
      }
    }

    if (!slot) return null;

    // 2. Get currently equipped stats for this slot
    const currentEquippedId = equippedItems[slot];
    let currentEquippedStats = { attack: 0, defense: 0, hp: 0 };
    if (currentEquippedId) {
      const currentEquippedItem = inventory.find(
        (i) => i.id === currentEquippedId
      );
      if (currentEquippedItem) {
        currentEquippedStats = getItemStatsForComparison(currentEquippedItem);
      }
    }

    // 3. Get hovered item stats
    const hoveredStats = getItemStatsForComparison(hoveredItem);

    // 4. Calculate difference
    return {
      attack: hoveredStats.attack - currentEquippedStats.attack,
      defense: hoveredStats.defense - currentEquippedStats.defense,
      hp: hoveredStats.hp - currentEquippedStats.hp,
    };
  }, [hoveredItem, equippedItems, inventory, getItemStatsForComparison]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-end md:items-center justify-center z-[60] p-0 md:p-4 touch-manipulation crt-screen"
      onClick={onClose}
    >
      <div
        className="bg-ink-950 w-full h-[85vh] md:h-auto md:max-w-7xl md:rounded-none border-0 md:border border-stone-800 shadow-2xl flex flex-col md:max-h-[90vh] overflow-hidden relative z-30"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
        {/* CRT Visual Layers */}
        <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none z-50"></div>
        <div className="crt-noise"></div>
        <div className="crt-vignette"></div>

        <div className="p-4 md:p-6 border-b border-stone-800 flex justify-between items-center bg-stone-950 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-stone-900 border border-stone-800 flex items-center justify-center text-yellow-500/80 shadow-inner">
              <Package size={28} />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-mono font-bold text-stone-200 tracking-[0.2em] uppercase">
                PIP-BOY_3000 // INVENTORY
              </h3>
              <p className="text-[10px] text-stone-600 font-mono tracking-widest uppercase">
                NEURAL_LINK_ESTABLISHED // OS_VER_1.0.4
              </p>
            </div>
          </div>
          <div className="flex gap-3 font-mono">
            {onOrganizeInventory && (
              <button
                onClick={() => {
                  onOrganizeInventory();
                  setSortByRarity(false);
                }}
                className="px-4 py-2 rounded-none text-[10px] border transition-all bg-stone-950 border-stone-800 text-stone-500 hover:bg-stone-900 hover:text-stone-200 hover:border-stone-700 uppercase tracking-widest"
                title="AUTO_CATALOG_PROTOCOL"
              >
                <div className="flex items-center">
                  <ArrowUpDown size={14} className="inline mr-2" />
                  AUTO_CATALOG
                </div>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center text-stone-600 hover:text-red-500 hover:bg-red-950/10 transition-all border border-stone-800 hover:border-red-900/50"
              aria-label="DISCONNECT"
              title="DISCONNECT"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="md:hidden border-b border-stone-800 bg-stone-950 relative z-10 font-mono">
          <div className="flex">
            <button
              onClick={() => setMobileActiveTab('equipment')}
              className={`flex-1 px-4 py-3 text-[10px] font-bold transition-colors border-b-2 uppercase tracking-widest ${mobileActiveTab === 'equipment'
                ? 'border-yellow-600 text-yellow-500 bg-yellow-950/10'
                : 'border-transparent text-stone-600 hover:text-stone-400'
                }`}
            >
              <ShieldCheck size={16} className="inline mr-2" />
              NEURAL_GEAR
            </button>
            <button
              onClick={() => setMobileActiveTab('inventory')}
              className={`flex-1 px-4 py-3 text-[10px] font-bold transition-colors border-b-2 uppercase tracking-widest ${mobileActiveTab === 'inventory'
                ? 'border-yellow-600 text-yellow-500 bg-yellow-950/10'
                : 'border-transparent text-stone-600 hover:text-stone-400'
                }`}
            >
              <Package size={16} className="inline mr-2" />
              STORAGE_UNITS
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row relative z-10">
          {/* Equipment Panel */}
          {(showEquipment || mobileActiveTab === 'equipment') && (
            <div
              className={`w-full md:w-1/2 border-b md:border-b-0 md:border-r border-stone-800 p-3 md:p-4 modal-scroll-container modal-scroll-content bg-stone-950/20 ${mobileActiveTab !== 'equipment' ? 'hidden md:block' : ''
                }`}
            >
              <EquipmentPanel
                equippedItems={equippedItems}
                inventory={inventory}
                natalArtifactId={natalArtifactId}
                onUnequip={onUnequipItem}
              />
            </div>
          )}

          {/* Item List */}
          <div
            className={`${showEquipment ? 'w-full md:w-1/2' : 'w-full'} modal-scroll-container modal-scroll-content p-4 flex flex-col bg-stone-950/5 ${mobileActiveTab !== 'inventory' ? 'hidden md:flex' : ''
              }`}
          >
            {/* Search and Filters */}
            <div className="mb-6 flex flex-col gap-4 font-mono">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-700" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="QUERY_STORAGE_DATABASE..."
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-950 border border-stone-800 rounded-none text-stone-300 placeholder-stone-800 focus:outline-none focus:border-yellow-900/50 font-mono text-sm tracking-widest uppercase"
                />
                {searchQuery && (
                  <button
                    title="CLEAR_QUERY"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stone-700 hover:text-stone-300"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Filter Toolbar */}
              <div className="flex gap-2 items-center flex-wrap">
                {/* Advanced Filter Button */}
                <button
                  onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
                  className={`px-3 py-1.5 rounded-none text-[10px] border transition-all flex items-center gap-2 uppercase tracking-widest ${showAdvancedFilter || rarityFilter !== 'all' || statFilter !== 'all'
                    ? 'bg-purple-950/40 border-purple-500/50 text-purple-400'
                    : 'bg-ink-950 border-stone-800 text-stone-500 hover:bg-stone-900 hover:text-stone-400'
                    }`}
                >
                  <SlidersHorizontal size={14} />
                  SENSORS
                  {(rarityFilter !== 'all' || statFilter !== 'all') && (
                    <span className="bg-purple-900/50 text-purple-300 text-[9px] px-1 py-0.5 border border-purple-800">
                      ACTIVE
                    </span>
                  )}
                </button>

                {/* Rarity Quick Filters */}
                <div className="flex gap-1">
                  {(['all', 'common', 'uncommon', 'rare', 'legendary'] as const).map((rarity) => (
                    <button
                      key={rarity}
                      onClick={() => setRarityFilter(rarity.charAt(0).toUpperCase() + rarity.slice(1) as ItemRarity)}
                      className={`px-3 py-1.5 rounded-none text-[10px] border transition-all uppercase tracking-widest ${rarityFilter === rarity
                        ? 'bg-yellow-950/40 border-yellow-600/50 text-yellow-500'
                        : 'bg-ink-950 border-stone-800 text-stone-500 hover:bg-stone-900 hover:text-stone-400'
                        }`}
                    >
                      {rarity === 'all' ? 'ALL' : rarity}
                    </button>
                  ))}
                </div>

                {/* Sort Button */}
                <button
                  onClick={() => setSortByRarity(!sortByRarity)}
                  className={`ml-auto px-3 py-1.5 rounded-none text-[10px] border transition-all flex items-center gap-2 uppercase tracking-widest ${sortByRarity
                    ? 'bg-blue-950/40 border-blue-500/50 text-blue-400'
                    : 'bg-ink-950 border-stone-800 text-stone-500 hover:bg-stone-900 hover:text-stone-400'
                    }`}
                >
                  <ArrowUpDown size={14} />
                  {sortByRarity ? 'QUALITY_INDEX' : 'ID_SEQUENCE'}
                </button>
              </div>

              {/* Advanced Filter Panel */}
              {showAdvancedFilter && (
                <div className="p-4 bg-ink-950 border border-stone-800 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <Filter size={16} className="text-purple-500" />
                      <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">ADVANCED_SCAN_PROTOCOLS</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Attribute Filter */}
                      <div className="space-y-2">
                        <label className="text-[10px] text-stone-500 uppercase tracking-widest block">Neural_Link_Attribute</label>
                        <div className="flex gap-2">
                          <select
                            title="Stat Filter"
                            value={statFilter}
                            onChange={(e) => {
                              setStatFilter(e.target.value as typeof statFilter);
                              if (e.target.value === 'all') setStatFilterMin(0);
                            }}
                            className="flex-1 bg-ink-950 border border-stone-800 text-stone-400 text-[10px] px-2 py-2 focus:outline-none focus:border-stone-600 rounded-none uppercase tracking-widest"
                          >
                            <option value="all">ANY_SIGNAL</option>
                            <option value="attack">FP_FIREPOWER</option>
                            <option value="defense">DR_REDUCTION</option>
                            <option value="hp">HP_VITALITY</option>
                            <option value="spirit">PER_COGNITION</option>
                            <option value="physique">END_STAMINA</option>
                            <option value="speed">AGI_REFLEX</option>
                          </select>
                          {statFilter !== 'all' && (
                            <input
                              type="number"
                              min={0}
                              value={statFilterMin}
                              onChange={(e) => setStatFilterMin(Math.max(0, parseInt(e.target.value) || 0))}
                              placeholder="MIN"
                              className="w-20 bg-ink-950 border border-stone-800 text-stone-300 text-[10px] px-2 py-2 focus:outline-none focus:border-stone-600 rounded-none uppercase tracking-widest"
                            />
                          )}
                        </div>
                      </div>

                      {/* Reset Button */}
                      <div className="flex items-end">
                        <button
                          onClick={() => {
                            setRarityFilter('all');
                            setStatFilter('all');
                            setStatFilterMin(0);
                          }}
                          className="w-full py-2 border border-red-900/50 text-red-500 hover:bg-red-950/20 text-[10px] transition-all uppercase tracking-widest"
                        >
                          RESET FILTERS
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Category Tabs */}
              <div className="flex gap-1 flex-wrap font-mono">
                {[
                  { id: 'all', label: 'ALL', icon: <Package size={14} /> },
                  { id: 'equipment', label: 'GEAR', icon: <ShieldCheck size={14} /> },
                  { id: 'pill', label: 'NEURAL', icon: <Zap size={14} /> },
                  { id: 'consumable', label: 'SUPPLY', icon: <Archive size={14} /> },
                  { id: 'recipe', label: 'BLUEPRINT', icon: <FileText size={14} /> },
                  { id: 'advancedItem', label: 'CORE', icon: <Sparkles size={14} /> },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.id as ItemCategory)}
                    disabled={isPending}
                    className={`flex items-center gap-2 px-3 py-2 border transition-all whitespace-nowrap text-[10px] uppercase tracking-widest ${selectedCategory === cat.id
                      ? 'bg-yellow-950/40 border-yellow-600 text-yellow-500'
                      : 'bg-ink-950 border-stone-800 text-stone-500 hover:bg-stone-900 hover:text-stone-300'
                      } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    {cat.icon}
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Equipment Slot Subdivision (Show only when Equipment category selected) */}
              {selectedCategory === 'equipment' && (
                <div className="flex gap-1 flex-wrap font-mono mt-2 p-3 bg-ink-950 border border-stone-800 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-[0.01] pointer-events-none" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
                  <div className="relative z-10 flex gap-1 flex-wrap">
                    <button
                      onClick={() => handleEquipmentSlotChange('all')}
                      disabled={isPending}
                      className={`px-2 py-1 rounded-none text-[9px] border transition-all uppercase tracking-widest ${selectedEquipmentSlot === 'all'
                        ? 'bg-yellow-950/40 border-yellow-600 text-yellow-500 font-bold'
                        : 'bg-stone-900/50 border-stone-800 text-stone-500 hover:text-stone-300'
                        } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
                    >
                      ALL SLOTS
                    </button>
                    {[
                      { slot: EquipmentSlot.Weapon, label: 'WEAPON' },
                      { slot: EquipmentSlot.Head, label: 'HEAD' },
                      { slot: EquipmentSlot.Shoulder, label: 'SHOULDER' },
                      { slot: EquipmentSlot.Chest, label: 'CHEST' },
                      { slot: EquipmentSlot.Gloves, label: 'GLOVES' },
                      { slot: EquipmentSlot.Legs, label: 'LEGS' },
                      { slot: EquipmentSlot.Boots, label: 'BOOTS' },
                      { slot: EquipmentSlot.Ring1, label: 'MODULE' },
                      { slot: EquipmentSlot.Accessory1, label: 'ACCESSORY' },
                      { slot: EquipmentSlot.Artifact1, label: 'SIGNATURE' },
                    ].map(({ slot, label }) => (
                      <button
                        key={slot}
                        onClick={() => handleEquipmentSlotChange(slot)}
                        disabled={isPending}
                        className={`px-2 py-1 rounded-none text-[9px] border transition-all uppercase tracking-widest ${selectedEquipmentSlot === slot ||
                          (slot === EquipmentSlot.Ring1 && (selectedEquipmentSlot === EquipmentSlot.Ring2 || selectedEquipmentSlot === EquipmentSlot.Ring3 || selectedEquipmentSlot === EquipmentSlot.Ring4)) ||
                          (slot === EquipmentSlot.Accessory1 && selectedEquipmentSlot === EquipmentSlot.Accessory2) ||
                          (slot === EquipmentSlot.Artifact1 && selectedEquipmentSlot === EquipmentSlot.Artifact2)
                          ? 'bg-yellow-950/40 border-yellow-600 text-yellow-500 font-bold'
                          : 'bg-stone-900/50 border-stone-800 text-stone-500 hover:text-stone-300'
                          } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Sorting and Stats */}
              <div className="flex items-center gap-3 font-mono">
                <div className="flex-1 h-px bg-stone-800/30"></div>
                <span className="text-[10px] text-stone-600 uppercase tracking-[0.2em]">
                  {filteredAndSortedInventory.length} OBJECTS DETECTED
                </span>
                <div className="flex-1 h-px bg-stone-800/30"></div>
              </div>
            </div>

            {/* Item Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 overflow-y-auto custom-scrollbar pr-1">
              {filteredAndSortedInventory.length === 0 ? (
                <div className="col-span-full text-center text-stone-600 py-20 font-mono border border-dashed border-stone-800/20 uppercase tracking-[0.3em] flex flex-col items-center gap-4">
                  <Package size={40} className="opacity-10" />
                  <div>No items found. Scavenge for resources.</div>
                </div>
              ) : (() => {
                const realmIndex = REALM_ORDER.indexOf(playerRealm as RealmType);
                const goldenCoreIndex = REALM_ORDER.indexOf(RealmType.GoldenCore);
                const canRefineGlobal = realmIndex >= goldenCoreIndex;

                return filteredAndSortedInventory.map((item) => (
                  <InventoryItem
                    key={item.id}
                    item={item}
                    isCompact={isCompact}
                    isNatal={item.id === natalArtifactId}
                    canRefine={canRefineGlobal}
                    isEquipped={itemEquippedMap.get(item.id) || false}
                    playerRealm={playerRealm}
                    foundationTreasure={foundationTreasure}
                    heavenEarthEssence={heavenEarthEssence}
                    heavenEarthMarrow={heavenEarthMarrow}
                    longevityRules={longevityRules}
                    maxLongevityRules={maxLongevityRules}
                    onHover={handleHoverItem}
                    onUseItem={onUseItem}
                    onEquipItem={handleEquipWrapper}
                    onUnequipItem={handleUnequipWrapper}
                    onUpgradeItem={onUpgradeItem}
                    onDiscardItem={onDiscardItem}
                    onRefineNatalArtifact={onRefineNatalArtifact}
                    onUnrefineNatalArtifact={onUnrefineNatalArtifact}
                    onRefineAdvancedItem={onRefineAdvancedItem}
                    setItemActionLog={setItemActionLog}
                  />
                ));
              })()}
            </div>
          </div>
        </div>

        {/* Stat Comparison Footer */}
        <div className="p-4 border-t border-stone-800 bg-ink-950 relative z-10 font-mono overflow-hidden">
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
          <div className="relative z-10 flex items-center justify-center gap-6 min-h-[3rem]">
            {comparison ? (
              <div className="flex items-center gap-4 bg-stone-900/50 p-2 border border-stone-800 rounded-none shadow-lg">
                <span className="text-[10px] text-stone-500 uppercase tracking-widest px-2 border-r border-stone-700">LINK PREVIEW</span>
                
                <div className="grid grid-cols-3 gap-6 px-2">
                  <div className="flex flex-col items-center min-w-[60px]">
                    <span className="text-[9px] text-stone-600 uppercase tracking-tighter mb-1">FP_FIREPOWER</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-stone-400">{formatNumber(calculateTotalEquippedStats.attack)}</span>
                      {comparison.attack !== 0 && (
                        <>
                          <span className="text-[9px] text-stone-700">→</span>
                          <span className={`text-xs font-bold ${comparison.attack > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {comparison.attack > 0 ? '+' : ''}{formatNumber(comparison.attack)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-center min-w-[60px] border-l border-stone-800/50 pl-6">
                    <span className="text-[9px] text-stone-600 uppercase tracking-tighter mb-1">DR_REDUCTION</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-stone-400">{formatNumber(calculateTotalEquippedStats.defense)}</span>
                      {comparison.defense !== 0 && (
                        <>
                          <span className="text-[9px] text-stone-700">→</span>
                          <span className={`text-xs font-bold ${comparison.defense > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {comparison.defense > 0 ? '+' : ''}{formatNumber(comparison.defense)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-center min-w-[60px] border-l border-stone-800/50 pl-6">
                    <span className="text-[9px] text-stone-600 uppercase tracking-tighter mb-1">HP_VITALITY</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-stone-400">{formatNumber(calculateTotalEquippedStats.hp)}</span>
                      {comparison.hp !== 0 && (
                        <>
                          <span className="text-[9px] text-stone-700">→</span>
                          <span className={`text-xs font-bold ${comparison.hp > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {comparison.hp > 0 ? '+' : ''}{formatNumber(comparison.hp)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <span className="text-[10px] text-stone-500 uppercase tracking-widest">Active Neural Links:</span>
                <div className="flex flex-col items-center">
                  <span className="text-[9px] text-stone-600 uppercase tracking-tighter mb-1">FP_FIREPOWER</span>
                  <span className="text-xs text-emerald-400">{formatNumber(calculateTotalEquippedStats.attack)}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[9px] text-stone-600 uppercase tracking-tighter mb-1">DR_REDUCTION</span>
                  <span className="text-xs text-emerald-400">{formatNumber(calculateTotalEquippedStats.defense)}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[9px] text-stone-600 uppercase tracking-tighter mb-1">HP_VITALITY</span>
                  <span className="text-xs text-emerald-400">{formatNumber(calculateTotalEquippedStats.hp)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <BatchDiscardModal
        isOpen={isBatchDiscardOpen}
        onClose={() => setIsBatchDiscardOpen(false)}
        inventory={inventory}
        equippedItems={equippedItems}
        onDiscardItems={handleBatchDiscard}
      />

      {
        onBatchUse && (
          <BatchUseModal
            isOpen={isBatchUseOpen}
            onClose={() => setIsBatchUseOpen(false)}
            inventory={inventory}
            equippedItems={equippedItems}
            onUseItems={handleBatchUse}
          />
        )
      }
    </div >
  );
};

export default React.memo(InventoryModal);
