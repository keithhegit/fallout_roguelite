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
  normalizeRarityValue,
  getRarityGlow,
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
import { 
  Zap, 
  Shield, 
  Sword, 
  FlaskConical, 
  ScrollText, 
  Boxes, 
  Dna,
  CircleHelp
} from 'lucide-react';

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
  ({
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
  }) => {
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
        case ItemType.Weapon: return <Sword size={18} />;
        case ItemType.Armor: return <Shield size={18} />;
        case ItemType.Pill: return <FlaskConical size={18} />;
        case ItemType.Consumable: return <Zap size={18} />;
        case ItemType.Recipe: return <ScrollText size={18} />;
        case ItemType.Material: return <Boxes size={18} />;
        case ItemType.AdvancedItem: return <Dna size={18} />;
        default: return <CircleHelp size={18} />;
      }
    };

    return (
      <div
        className={`p-3 rounded-none border flex flex-col justify-between relative transition-all duration-300 group overflow-hidden font-mono ${
          isEquipped 
            ? 'bg-ink-950 border-yellow-600/50 shadow-[0_0_15px_rgba(202,138,4,0.1)]' 
            : `bg-stone-950/90 hover:bg-stone-900 ${getRarityBorder(rarity)}`
        }`}
        onMouseEnter={() => onHover(item)}
        onMouseLeave={() => onHover(null)}
      >
        {/* CRT Visual Layers */}
        <div className="absolute inset-0 bg-scanlines opacity-[0.02] pointer-events-none"></div>
        
        {isEquipped && (
          <div className="absolute top-2 right-2 text-yellow-500 bg-yellow-950/20 px-2 py-0.5 rounded-none text-[9px] border border-yellow-900/40 flex items-center gap-1 z-10 animate-pulse uppercase tracking-widest">
            <ShieldCheck size={10} /> ACTIVE_LINK
          </div>
        )}

        <div className="relative z-10">
          <div className="flex gap-3 mb-3">
            {/* Item Icon Container */}
            <div className={`w-12 h-12 rounded-none border flex items-center justify-center shrink-0 ${getRarityBorder(rarity)} bg-ink-950 ${getRarityTextColor(rarity)} shadow-inner`}>
              {getTypeIcon()}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <h4 className={`${getRarityNameClasses(rarity)} truncate text-sm font-bold uppercase tracking-wider`}>
                  {item.name}
                  {showLevel && (
                    <span className="text-stone-600 text-[10px] font-normal ml-1">
                      +{item.level}
                    </span>
                  )}
                </h4>
                <span className="text-[10px] bg-ink-950 text-stone-500 px-1.5 py-0.5 rounded-none border border-stone-900 ml-2">
                  x{item.quantity}
                </span>
              </div>
              
              <div className="flex gap-2 items-center">
                <span className={`text-[9px] px-1.5 py-0.5 rounded-none uppercase font-bold tracking-widest ${getRarityBadge(rarity)}`}>
                  {rarityLabel}
                </span>
                <span className="text-[10px] text-stone-600 uppercase tracking-widest font-mono">{typeLabel}</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-stone-500 leading-relaxed mb-3 line-clamp-2 italic opacity-80 group-hover:opacity-100 transition-opacity font-mono">
            {item.description}
          </p>

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
                <div className="text-xs mb-3 space-y-1">
                  {effectEntries.length > 0 && (
                    <div className="text-stone-400 grid grid-cols-2 gap-1">
                      {effectEntries.map((entry, idx) => (
                        <span key={idx}>{entry}</span>
                      ))}
                    </div>
                  )}
                  {effects.specialEffect && (
                    <div className="text-emerald-400 italic mt-1">
                      ✨ {effects.specialEffect}
                    </div>
                  )}
                </div>
              );
            }
            return null;
          })()}

          {/* Supply utility notes */}
          {item.type === ItemType.Material && (
            <div className="text-xs text-blue-400 mb-2 p-2 bg-blue-900/20 rounded border border-blue-800/50">
              <div className="font-bold mb-1">💡 Utility:</div>
              <div className="space-y-0.5 text-blue-300">
                {item.name.includes('crate') || item.name.includes('Package') ? (
                  <div>• Contains medical or survival components.</div>
                ) : item.name.includes('Key') ? (
                  <div>• Used to unlock old vaults or secure crates.</div>
                ) : null}
                {item.name.includes('Alloy') || item.name.includes('Steel') || item.name.includes('Circuit') ? (
                  <div>• Essential for gear and mod upgrades.</div>
                ) : null}
                {item.name.includes('Chem') || item.name.includes('Resource') || item.name.includes('Sample') ? (
                  <div>• Used for chem synthesis (see schematics).</div>
                ) : null}
                {!item.name.includes('crate') && !item.name.includes('Key') && (
                  <div>• Can be used to train captured creatures.</div>
                )}
                {!item.effect && !item.name.includes('crate') && !item.name.includes('Key') && (
                  <div className="text-stone-400">• This material has no confirmed direct utility.</div>
                )}
              </div>
            </div>
          )}

          {isNatal && (
            <div className="text-xs text-mystic-gold mb-2 flex items-center gap-1">
              <Sparkles size={12} />
              <span className="font-bold">Signature Gear (Stats +50%)</span>
            </div>
          )}


          {reviveChances !== undefined && reviveChances > 0 && (
            <div className="text-xs text-yellow-400 mb-2 flex items-center gap-1 font-bold">
              💫 Survival Charges: {reviveChances}
            </div>
          )}
          {reviveChances !== undefined && reviveChances <= 0 && (
            <div className="text-[11px] text-stone-500 mb-2 flex items-center gap-1">
              💫 Survival Charges: Depleted
            </div>
          )}

          {(item.effect || item.permanentEffect) && (
            <div className="text-xs mb-2 space-y-1">
              {/* Temporary Effects */}
              {item.effect && (
                <div className="text-stone-400 grid grid-cols-2 gap-1">
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
                <div className="text-emerald-400 grid grid-cols-2 gap-1">
                  {item.permanentEffect.attack && item.permanentEffect.attack > 0 && (
                    <span>✨ FP Perm +{item.permanentEffect.attack}</span>
                  )}
                  {item.permanentEffect.defense && item.permanentEffect.defense > 0 && (
                    <span>✨ DR Perm +{item.permanentEffect.defense}</span>
                  )}
                  {item.permanentEffect.maxHp && item.permanentEffect.maxHp > 0 && (
                    <span>✨ HP MAX Perm +{item.permanentEffect.maxHp}</span>
                  )}
                  {item.permanentEffect.spirit && item.permanentEffect.spirit > 0 && (
                    <span>✨ PER Perm +{item.permanentEffect.spirit}</span>
                  )}
                  {item.permanentEffect.physique && item.permanentEffect.physique > 0 && (
                    <span>✨ END Perm +{item.permanentEffect.physique}</span>
                  )}
                  {item.permanentEffect.speed && item.permanentEffect.speed > 0 && (
                    <span>✨ AGI Perm +{item.permanentEffect.speed}</span>
                  )}
                  {item.permanentEffect.maxLifespan && item.permanentEffect.maxLifespan > 0 && (
                    <span>✨ LIFE MAX Perm +{item.permanentEffect.maxLifespan}</span>
                  )}
                  {/* Aptitude Effects */}
                  {item.permanentEffect.spiritualRoots && (() => {
                    const roots = item.permanentEffect.spiritualRoots;
                    const rootEntries: string[] = [];

                    if (roots.metal && roots.metal > 0) {
                      rootEntries.push(`${SPIRITUAL_ROOT_NAMES.metal} Aptitude +${roots.metal}`);
                    }
                    if (roots.wood && roots.wood > 0) {
                      rootEntries.push(`${SPIRITUAL_ROOT_NAMES.wood} Aptitude +${roots.wood}`);
                    }
                    if (roots.water && roots.water > 0) {
                      rootEntries.push(`${SPIRITUAL_ROOT_NAMES.water} Aptitude +${roots.water}`);
                    }
                    if (roots.fire && roots.fire > 0) {
                      rootEntries.push(`${SPIRITUAL_ROOT_NAMES.fire} Aptitude +${roots.fire}`);
                    }
                    if (roots.earth && roots.earth > 0) {
                      rootEntries.push(`${SPIRITUAL_ROOT_NAMES.earth} Aptitude +${roots.earth}`);
                    }

                    // If all aptitudes are the same, merge display
                    if (rootEntries.length > 0) {
                      const allSame = rootEntries.every(entry => {
                        const match = entry.match(/\+(\d+)$/);
                        return match && match[1] === rootEntries[0].match(/\+(\d+)$/)?.[1];
                      });

                      if (allSame && rootEntries.length === 5) {
                        const value = rootEntries[0].match(/\+(\d+)$/)?.[1] || '0';
                        return <span className="col-span-2">✨ All SPECIAL Perm +{value}</span>;
                      } else {
                        return rootEntries.map((entry, idx) => (
                          <span key={idx}>✨ {entry} Perm</span>
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

        <div className="mt-2 flex gap-1.5 flex-wrap">
          {item.isEquippable && item.equipmentSlot ? (
            <>
              {isEquipped ? (
                <button
                  onClick={() => onUnequipItem(item)}
                  className="flex-1 bg-ink-950 hover:bg-stone-900 text-stone-400 text-[10px] py-2 rounded-none transition-all border border-stone-800 uppercase tracking-widest min-h-[36px]"
                >
                  DE-EQUIP
                </button>
              ) : (
                <button
                  onClick={() => onEquipItem(item)}
                  className="flex-1 bg-ink-950 hover:bg-blue-950/20 text-blue-400 text-[10px] py-2 rounded-none transition-all border border-blue-900/50 hover:border-blue-400 uppercase tracking-widest min-h-[36px]"
                >
                  INITIALIZE
                </button>
              )}
              {item.type === ItemType.Artifact && onRefineNatalArtifact && (() => {
                const isDisabled = !isNatal && !canRefine;

                return (
                  <button
                    onClick={() => {
                      if (isNatal && onUnrefineNatalArtifact) {
                        onUnrefineNatalArtifact();
                      } else if (!isNatal && canRefine) {
                        onRefineNatalArtifact(item);
                      }
                    }}
                    disabled={isDisabled}
                    className={`px-3 text-[10px] py-2 rounded-none transition-all border uppercase tracking-widest min-h-[36px] ${isNatal
                      ? 'bg-ink-950 hover:bg-mystic-gold/10 text-mystic-gold border-mystic-gold/50'
                      : isDisabled
                        ? 'bg-ink-950 text-stone-700 border-stone-900 cursor-not-allowed opacity-50'
                        : 'bg-ink-950 hover:bg-purple-950/20 text-purple-400 border-purple-900/50'
                      }`}
                    title={
                      isNatal
                        ? 'Dissolve Neural Sync'
                        : isDisabled
                          ? 'Neural Sync requires Mutant rank.'
                          : 'Establish Neural Sync'
                    }
                  >
                    <Sparkles size={14} />
                  </button>
                );
              })()}
              <button
                onClick={() => onUpgradeItem(item)}
                className="px-3 bg-ink-950 hover:bg-stone-900 text-stone-400 text-[10px] py-2 rounded-none transition-all border border-stone-800 uppercase tracking-widest min-h-[36px]"
                title="CALIBRATE"
              >
                <Hammer size={14} />
              </button>
              <button
                onClick={() => onDiscardItem(item)}
                className="px-3 bg-ink-950 hover:bg-red-950/20 text-red-500 text-[10px] py-2 rounded-none transition-all border border-red-900/50 hover:border-red-500 uppercase tracking-widest min-h-[36px]"
                title="PURGE"
              >
                <Trash2 size={14} />
              </button>
            </>
          ) : (
            <>
              {(() => {
                // Determine if the item is usable
                const isMaterialPack = (item.name.includes('Material Pack') || item.name.includes('材料包')) && item.type === ItemType.Material;
                const isTreasureVaultKey = (item.name === 'Faction Vault Key' || item.name === '宗门宝库钥匙') && item.type === ItemType.Material;
                const hasEffect = item.effect || item.permanentEffect;
                const isRecipe = item.type === ItemType.Recipe;
                const isUsable = isMaterialPack || isTreasureVaultKey || (hasEffect && item.type !== ItemType.Material) || isRecipe;

                return isUsable ? (
                  <button
                    onClick={() => onUseItem(item)}
                    className="flex-1 bg-ink-950 hover:bg-emerald-950/20 text-emerald-400 text-[10px] py-2 rounded-none border border-emerald-900/50 hover:border-emerald-400 uppercase tracking-widest transition-all min-h-[36px]"
                  >
                    {item.type === ItemType.Recipe ? 'ANALYZE' : 'EXECUTE'}
                  </button>
                ) : null;
              })()}
              {item.type === ItemType.AdvancedItem && item.advancedItemType && onRefineAdvancedItem && (() => {
                const currentRealmIndex = REALM_ORDER.indexOf(playerRealm as RealmType);
                let canRefineItem = false;
                let warningMessage = '';
                let requiredRealmName = '';

                if (item.advancedItemType === 'foundationTreasure') {
                  requiredRealmName = 'Scavenger';
                  canRefineItem = currentRealmIndex >= REALM_ORDER.indexOf(RealmType.QiRefining);
                  warningMessage = `Neural Link for Essential Gear requires ${requiredRealmName} rank\nCurrent rank: ${playerRealm}`;
                } else if (item.advancedItemType === 'heavenEarthEssence') {
                  requiredRealmName = 'Mutant';
                  canRefineItem = currentRealmIndex >= REALM_ORDER.indexOf(RealmType.GoldenCore);
                  warningMessage = `Neural Link for Core Essence requires ${requiredRealmName} rank\nCurrent rank: ${playerRealm}`;
                } else if (item.advancedItemType === 'heavenEarthMarrow') {
                  requiredRealmName = 'Evolved';
                  canRefineItem = currentRealmIndex >= REALM_ORDER.indexOf(RealmType.NascentSoul);
                  warningMessage = `Neural Link for Apex Marrow requires ${requiredRealmName} rank\nCurrent rank: ${playerRealm}`;
                } else if (item.advancedItemType === 'longevityRule') {
                  requiredRealmName = 'Apex';
                  canRefineItem = currentRealmIndex >= REALM_ORDER.indexOf(RealmType.DaoCombining);
                  warningMessage = `Neural Link for Wasteland Laws requires ${requiredRealmName} rank\nCurrent rank: ${playerRealm}`;
                }

                // 检查是否已经拥有
                let alreadyOwned = false;
                let alreadyOwnedMessage = '';
                if (item.advancedItemType === 'foundationTreasure' && foundationTreasure) {
                  alreadyOwned = true;
                  alreadyOwnedMessage = 'Essential Gear already linked.';
                } else if (item.advancedItemType === 'heavenEarthEssence' && heavenEarthEssence) {
                  alreadyOwned = true;
                  alreadyOwnedMessage = 'Core Essence already linked.';
                } else if (item.advancedItemType === 'heavenEarthMarrow' && heavenEarthMarrow) {
                  alreadyOwned = true;
                  alreadyOwnedMessage = 'Apex Marrow already linked.';
                } else if (item.advancedItemType === 'longevityRule' && item.advancedItemId) {
                  if ((longevityRules || []).includes(item.advancedItemId)) {
                    alreadyOwned = true;
                    alreadyOwnedMessage = 'Law already mastered.';
                  } else {
                    // 检查是否达到最大数量
                    const maxRules = maxLongevityRules || 3;
                    if ((longevityRules || []).length >= maxRules) {
                      alreadyOwned = true;
                      alreadyOwnedMessage = `You already have ${maxRules} Wasteland Laws (Limit reached).`;
                    }
                  }
                }

                // 生成完整的提示信息
                const tooltipMessage = alreadyOwned
                  ? alreadyOwnedMessage
                  : !canRefineItem
                    ? warningMessage
                    : 'INSTALL NEURAL MOD';

                return (
                  <button
                    onClick={() => {
                      if (!canRefineItem) {
                        if (setItemActionLog) {
                          setItemActionLog({ text: warningMessage.replace(/\n/g, ' '), type: 'danger' });
                        }
                        return;
                      }
                      if (alreadyOwned) {
                        if (setItemActionLog) {
                          setItemActionLog({ text: alreadyOwnedMessage, type: 'danger' });
                        }
                        return;
                      }
                      // confirm
                      const confirmMessage = item.advancedItemType === 'foundationTreasure'
                        ? `Initialize neural link with [${item.name}]?\n\n⚠️ WARNING: Essential Gear links are permanent and cannot be modified!`
                        : `Initialize neural link with [${item.name}]?`;
                      showConfirm(
                        confirmMessage,
                        'CONFIRM LINK',
                        () => {
                          onRefineAdvancedItem(item);
                        }
                      );
                    }}
                    disabled={!canRefineItem || alreadyOwned}
                    className={`flex-1 bg-ink-950 text-[10px] py-2 rounded-none transition-all border uppercase tracking-widest min-h-[36px] ${!canRefineItem || alreadyOwned
                      ? 'text-stone-700 border-stone-900/50 cursor-not-allowed'
                      : 'hover:bg-purple-950/20 text-purple-400 border-purple-900/50 hover:border-purple-400'
                      }`}
                    title={tooltipMessage}
                  >
                    <Sparkles size={14} className="inline mr-1" />
                    INSTALL
                  </button>
                );
              })()}
              <button
                onClick={() => onDiscardItem(item)}
                className="px-3 bg-ink-950 hover:bg-red-950/20 text-red-500 text-[10px] py-2 rounded-none border border-red-900/50 hover:border-red-500 transition-all uppercase tracking-widest min-h-[36px]"
                title="PURGE"
              >
                <Trash2 size={14} />
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
      prevProps.maxLongevityRules === nextProps.maxLongevityRules
    );
  }
);

InventoryItem.displayName = 'InventoryItem';

const InventoryModal: React.FC<Props> = ({
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
      if (item.type === ItemType.AdvancedItem || typeKey === 'advanceditem' || typeKey === '进阶物品') {
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
      const slots = getEquipmentSlotsByType(hoveredItem.type);
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
                      onClick={() => setRarityFilter(rarity)}
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

              {/* 分类标签 */}
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

              {/* 装备部位细分（仅在装备分类时显示） */}
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
              
              {/* 排序与统计 */}
              <div className="flex items-center gap-3 font-mono">
                <div className="flex-1 h-px bg-stone-800/30"></div>
                <span className="text-[10px] text-stone-600 uppercase tracking-[0.2em]">
                  {filteredAndSortedInventory.length} OBJECTS DETECTED
                </span>
                <div className="flex-1 h-px bg-stone-800/30"></div>
              </div>
            </div>

            {/* 物品网格 */}
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
              <div className="flex items-center gap-6">
                <span className="text-[10px] text-stone-500 uppercase tracking-widest">Neural Link Preview:</span>
                {comparison.attack !== 0 && (
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] text-stone-600 uppercase tracking-tighter mb-1">FP_FIREPOWER</span>
                    <span className={`text-xs ${comparison.attack > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatValueChange(calculateTotalEquippedStats.attack, calculateTotalEquippedStats.attack + comparison.attack)}
                    </span>
                  </div>
                )}
                {comparison.defense !== 0 && (
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] text-stone-600 uppercase tracking-tighter mb-1">DR_REDUCTION</span>
                    <span className={`text-xs ${comparison.defense > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatValueChange(calculateTotalEquippedStats.defense, calculateTotalEquippedStats.defense + comparison.defense)}
                    </span>
                  </div>
                )}
                {comparison.hp !== 0 && (
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] text-stone-600 uppercase tracking-tighter mb-1">HP_VITALITY</span>
                    <span className={`text-xs ${comparison.hp > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatValueChange(calculateTotalEquippedStats.hp, calculateTotalEquippedStats.hp + comparison.hp)}
                    </span>
                  </div>
                )}
                {comparison.attack === 0 && comparison.defense === 0 && comparison.hp === 0 && (
                  <span className="text-[10px] text-stone-700 uppercase tracking-widest">No variance detected</span>
                )}
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
