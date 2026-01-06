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
import {
  X,
  Package,
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

    return (
      <div
        className={`p-3 rounded border flex flex-col justify-between relative transition-colors ${isEquipped ? 'bg-ink-800 border-mystic-gold shadow-md' : `bg-ink-800 hover:bg-ink-700 ${getRarityBorder(rarity)}`}`}
        onMouseEnter={() => onHover(item)}
        onMouseLeave={() => onHover(null)}
      >
        {isEquipped && (
          <div className="absolute top-2 right-2 text-mystic-gold bg-mystic-gold/10 px-2 py-0.5 rounded text-xs border border-mystic-gold/30 flex items-center gap-1">
            <ShieldCheck size={12} /> Equipped
          </div>
        )}

        <div>
          <div className="flex justify-between items-start pr-16 mb-1">
            <h4 className={getRarityNameClasses(rarity)}>
              {item.name}{' '}
              {showLevel && (
                <span className="text-stone-500 text-xs font-normal ml-1">
                  + {item.level}
                </span>
              )}
            </h4>
            <span className="text-xs bg-stone-700 text-stone-300 px-1.5 py-0.5 rounded shrink-0 h-fit">
              x{item.quantity}
            </span>
          </div>

          <div className="flex gap-2 mb-2">
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded border ${getRarityBadge(rarity)}`}
            >
              {rarityLabel}
            </span>
            <span className="text-xs text-stone-500 py-0.5">{typeLabel}</span>
          </div>

          <p className="text-xs text-stone-500 italic mb-3">
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
                  className="flex-1 bg-stone-700 hover:bg-stone-600 text-stone-200 text-xs py-2 rounded transition-colors border border-stone-500"
                >
                  Unequip
                </button>
              ) : (
                <button
                  onClick={() => onEquipItem(item)}
                  className="flex-1 bg-mystic-gold/20 hover:bg-mystic-gold/30 text-mystic-gold text-xs py-2 rounded transition-colors border border-mystic-gold/50"
                >
                  Equip
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
                    className={`px-3 text-xs py-2 rounded transition-colors border ${isNatal
                      ? 'bg-mystic-gold/20 hover:bg-mystic-gold/30 text-mystic-gold border-mystic-gold/50'
                      : isDisabled
                        ? 'bg-stone-800/50 text-stone-500 border-stone-700/50 cursor-not-allowed opacity-50'
                        : 'bg-purple-900/20 hover:bg-purple-900/30 text-purple-300 border-purple-700/50'
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
                className="px-3 bg-stone-700 hover:bg-stone-600 text-stone-300 text-xs py-2 rounded transition-colors border border-stone-500"
                title="Upgrade"
              >
                <Hammer size={14} />
              </button>
              <button
                onClick={() => onDiscardItem(item)}
                className="px-3 bg-red-900 hover:bg-red-800 text-red-200 text-xs py-2 rounded transition-colors border border-red-700"
                title="Discard"
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
                    className="flex-1 bg-stone-700 hover:bg-stone-600 text-stone-200 text-xs py-2 rounded transition-colors"
                  >
                    {item.type === ItemType.Recipe ? 'Study' : 'Use'}
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
                    : 'Install Neural Mod';

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
                        'Confirm Link',
                        () => {
                          onRefineAdvancedItem(item);
                        }
                      );
                    }}
                    disabled={!canRefineItem || alreadyOwned}
                    className={`flex-1 text-xs py-2 rounded transition-colors border ${!canRefineItem || alreadyOwned
                      ? 'bg-stone-800/50 text-stone-500 border-stone-700/50 cursor-not-allowed opacity-50'
                      : 'bg-purple-900/20 hover:bg-purple-900/40 text-purple-300 border-purple-700/50'
                      }`}
                    title={tooltipMessage}
                  >
                    <Sparkles size={14} className="inline mr-1" />
                    Install
                  </button>
                );
              })()}
              <button
                onClick={() => onDiscardItem(item)}
                className="px-3 bg-red-900 hover:bg-red-800 text-red-200 text-xs py-2 rounded transition-colors border border-red-700"
                title="丢弃"
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
      className="fixed inset-0 bg-black/80 flex items-end md:items-center justify-center z-[60] p-0 md:p-4 backdrop-blur-sm touch-manipulation"
      onClick={onClose}
    >
      <div
        className="bg-paper-800 w-full h-[80vh] md:h-auto md:max-w-6xl md:rounded-t-2xl md:rounded-b-lg border-0 md:border border-stone-600 shadow-2xl flex flex-col md:max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 md:p-4 border-b border-stone-600 flex justify-between items-center bg-ink-800 md:rounded-t">
          <h3 className="text-lg md:text-xl font-serif text-mystic-gold flex items-center gap-2">
            <Package size={18} className="md:w-5 md:h-5" /> Inventory
          </h3>
          <div className="flex gap-2">
            {onOrganizeInventory && (
              <button
                onClick={() => {
                  onOrganizeInventory();
                  setSortByRarity(false); // 整理后切换到原始顺序，以显示整理后的分类排序
                }}
                className="px-2 md:px-3 py-1.5 md:py-1 rounded text-xs md:text-sm border transition-colors min-h-[44px] md:min-h-0 touch-manipulation bg-blue-900/20 border-blue-700 text-blue-300 hover:bg-blue-900/30"
                title="合并同类物品并按分类/品质排序"
              >
                <div className="flex items-center">
                  <ArrowUpDown size={14} className="inline mr-1" />
                  Auto-Catalog
                </div>
              </button>
            )}
            {onBatchUse && (
              <button
                onClick={() => setIsBatchUseOpen(true)}
                className="px-2 md:px-3 py-1.5 md:py-1 rounded text-xs md:text-sm border transition-colors min-h-[44px] md:min-h-0 touch-manipulation bg-green-900/20 border-green-700 text-green-300 hover:bg-green-900/30"
              >
                <div className="flex items-center">
                  <Zap size={14} className="inline mr-1" />
                  Bulk Use
                </div>
              </button>
            )}
            <button
              onClick={() => setIsBatchDiscardOpen(true)}
              className="px-2 md:px-3 py-1.5 md:py-1 rounded text-xs md:text-sm border transition-colors min-h-[44px] md:min-h-0 touch-manipulation bg-red-900/20 border-red-700 text-red-300 hover:bg-red-900/30"
            >
              <div className="flex items-center">
                <Trash size={14} className="inline mr-1" />
                Bulk Discard
              </div>
            </button>
            <button
              onClick={() => setShowEquipment(!showEquipment)}
              className={`hidden flex items-center justify-center md:flex px-3 py-1 rounded text-sm border transition-colors ${showEquipment
                ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                : 'bg-stone-700 border-stone-600 text-stone-300'
                }`}
            >
              {showEquipment ? 'Hide' : 'Show'} Gear
            </button>
            <button
              onClick={onClose}
              className="text-stone-400 active:text-white min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
              aria-label="Close"
              title="Close"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* 移动端Tab切换 */}
        <div className="md:hidden border-b border-stone-600 bg-ink-800">
          <div className="flex">
            <button
              onClick={() => setMobileActiveTab('equipment')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${mobileActiveTab === 'equipment'
                ? 'border-mystic-gold text-mystic-gold bg-mystic-gold/10'
                : 'border-transparent text-stone-400 hover:text-stone-300'
                }`}
            >
              <ShieldCheck size={16} className="inline mr-2" />
              Gear Slots
            </button>
            <button
              onClick={() => setMobileActiveTab('inventory')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${mobileActiveTab === 'inventory'
                ? 'border-mystic-gold text-mystic-gold bg-mystic-gold/10'
                : 'border-transparent text-stone-400 hover:text-stone-300'
                }`}
            >
              <Package size={16} className="inline mr-2" />
              Inventory
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* 装备面板 */}
          {(showEquipment || mobileActiveTab === 'equipment') && (
            <div
              className={`w-full md:w-1/2 border-b md:border-b-0 md:border-r border-stone-600 p-3 md:p-4 modal-scroll-container modal-scroll-content ${mobileActiveTab !== 'equipment' ? 'hidden md:block' : ''
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

          {/* 物品列表 */}
          <div
            className={`${showEquipment ? 'w-full md:w-1/2' : 'w-full'} modal-scroll-container modal-scroll-content p-4 flex flex-col ${mobileActiveTab !== 'inventory' ? 'hidden md:flex' : ''
              }`}
          >
            {/* 搜索和筛选 */}
            <div className="mb-4 flex flex-col gap-3">
              {/* 搜索框 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Scavenge for loot or descriptions..."
                  className="w-full pl-10 pr-4 py-2 bg-stone-700 border border-stone-600 rounded text-stone-200 placeholder-stone-500 focus:outline-none focus:border-mystic-gold focus:ring-1 focus:ring-mystic-gold"
                />
                {searchQuery && (
                  <button
                    title="Clear Search"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stone-400 hover:text-stone-200"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* 筛选工具栏 */}
              <div className="flex gap-2 items-center flex-wrap">
                {/* 高级筛选按钮 */}
                <button
                  onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
                  className={`px-3 py-1.5 rounded text-sm border transition-colors flex items-center gap-2 ${showAdvancedFilter || rarityFilter !== 'all' || statFilter !== 'all'
                    ? 'bg-purple-900/20 border-purple-600 text-purple-300'
                    : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                    }`}
                >
                  <SlidersHorizontal size={16} />
                  Advanced Filter
                  {(rarityFilter !== 'all' || statFilter !== 'all') && (
                    <span className="bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded">
                      Active
                    </span>
                  )}
                </button>

                {/* 稀有度快速筛选 */}
                <div className="flex gap-1">
                  {(['all', 'common', 'uncommon', 'rare', 'legendary'] as const).map((rarity) => (
                    <button
                      key={rarity}
                      onClick={() => setRarityFilter(rarity)}
                      className={`px-2 py-1 rounded text-xs border transition-colors ${rarityFilter === rarity
                        ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                        : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                        }`}
                    >
                      {rarity === 'all' ? 'All' : rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                    </button>
                  ))}
                </div>

                {/* 排序按钮 */}
                <button
                  onClick={() => setSortByRarity(!sortByRarity)}
                  className={`ml-auto px-3 py-1.5 rounded text-sm border transition-colors flex items-center gap-2 ${sortByRarity
                    ? 'bg-blue-900/20 border-blue-600 text-blue-300'
                    : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                    }`}
                >
                  <ArrowUpDown size={16} />
                  {sortByRarity ? 'Sort by Rarity' : 'No Sorting'}
                </button>
              </div>

              {/* 高级筛选面板 */}
              {showAdvancedFilter && (
                <div className="bg-stone-800 rounded p-4 border border-stone-600">
                  <div className="flex items-center gap-2 mb-3">
                    <Filter size={16} className="text-purple-400" />
                    <h4 className="text-sm font-bold text-purple-300">Advanced Filter</h4>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="block text-xs text-stone-400 mb-2">Stat Filter</label>
                    <div className="flex items-center gap-2">
                      {/* 属性筛选 */}
                      <div>
                        <div className="flex gap-2 mb-2">
                          <select
                            title="Stat Filter"
                            value={statFilter}
                            onChange={(e) => {
                              setStatFilter(e.target.value as typeof statFilter);
                              if (e.target.value === 'all') setStatFilterMin(0);
                            }}
                            className="flex-1 px-2 py-1.5 bg-stone-700 border border-stone-600 rounded text-sm text-stone-200"
                          >
                            <option value="all">All Stats</option>
                            <option value="attack">FP</option>
                            <option value="defense">DR</option>
                            <option value="hp">HP</option>
                            <option value="spirit">PER</option>
                            <option value="physique">END</option>
                            <option value="speed">AGI</option>
                          </select>
                        </div>
                        {statFilter !== 'all' && (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              value={statFilterMin}
                              onChange={(e) => setStatFilterMin(Math.max(0, parseInt(e.target.value) || 0))}
                              placeholder="Min Value"
                              className="w-full px-2 py-1.5 bg-stone-700 border border-stone-600 rounded text-sm text-stone-200"
                            />
                          </div>
                        )}
                      </div>

                      {/* 清除筛选按钮 */}
                      <div className="flex items-start" style={{ marginTop: '-10px' }}>
                        <button
                          onClick={() => {
                            setRarityFilter('all');
                            setStatFilter('all');
                            setStatFilterMin(0);
                          }}
                          className="w-full px-3 py-2 bg-red-900/20 hover:bg-red-900/30 border border-red-700 text-red-300 rounded text-sm transition-colors"
                        >
                          Clear All Filters
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 分类标签 */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => handleCategoryChange('all')}
                  disabled={isPending}
                  className={`px-3 py-1.5 rounded text-sm border transition-colors ${selectedCategory === 'all'
                    ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                    : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                    } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
                >
                  All
                </button>
                <button
                  onClick={() => handleCategoryChange('equipment')}
                  disabled={isPending}
                  className={`px-3 py-1.5 rounded text-sm border transition-colors ${selectedCategory === 'equipment'
                    ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                    : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                    } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
                >
                  Gear
                </button>
                <button
                  onClick={() => handleCategoryChange('pill')}
                  disabled={isPending}
                  className={`px-3 py-1.5 rounded text-sm border transition-colors ${selectedCategory === 'pill'
                    ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                    : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                    } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
                >
                  Meds
                </button>
                <button
                  onClick={() => handleCategoryChange('consumable')}
                  disabled={isPending}
                  className={`px-3 py-1.5 rounded text-sm border transition-colors ${selectedCategory === 'consumable'
                    ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                    : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                    } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
                >
                  Provs
                </button>
                <button
                  onClick={() => handleCategoryChange('recipe')}
                  disabled={isPending}
                  className={`px-3 py-1.5 rounded text-sm border transition-colors ${selectedCategory === 'recipe'
                    ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                    : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                    } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
                >
                  Schematics
                </button>
                <button
                  onClick={() => handleCategoryChange('advancedItem')}
                  disabled={isPending}
                  className={`px-3 py-1.5 rounded text-sm border transition-colors ${selectedCategory === 'advancedItem'
                    ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                    : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                    } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
                >
                  Mods
                </button>
              </div>
              {/* 装备部位细分（仅在装备分类时显示） */}
              {selectedCategory === 'equipment' && (
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleEquipmentSlotChange('all')}
                    disabled={isPending}
                    className={`px-2 py-1 rounded text-xs border transition-colors ${selectedEquipmentSlot === 'all'
                      ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                      : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                      } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    全部装备
                  </button>
                  <button
                    onClick={() =>
                      handleEquipmentSlotChange(EquipmentSlot.Weapon)
                    }
                    disabled={isPending}
                    className={`px-2 py-1 rounded text-xs border transition-colors ${selectedEquipmentSlot === EquipmentSlot.Weapon
                      ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                      : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                      } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    Weapon
                  </button>
                  <button
                    onClick={() =>
                      handleEquipmentSlotChange(EquipmentSlot.Head)
                    }
                    disabled={isPending}
                    className={`px-2 py-1 rounded text-xs border transition-colors ${selectedEquipmentSlot === EquipmentSlot.Head
                      ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                      : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                      } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    Head
                  </button>
                  <button
                    onClick={() =>
                      handleEquipmentSlotChange(EquipmentSlot.Shoulder)
                    }
                    disabled={isPending}
                    className={`px-2 py-1 rounded text-xs border transition-colors ${selectedEquipmentSlot === EquipmentSlot.Shoulder
                      ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                      : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                      } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    Shoulder
                  </button>
                  <button
                    onClick={() =>
                      handleEquipmentSlotChange(EquipmentSlot.Chest)
                    }
                    disabled={isPending}
                    className={`px-2 py-1 rounded text-xs border transition-colors ${selectedEquipmentSlot === EquipmentSlot.Chest
                      ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                      : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                      } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    Chest
                  </button>
                  <button
                    onClick={() =>
                      handleEquipmentSlotChange(EquipmentSlot.Gloves)
                    }
                    disabled={isPending}
                    className={`px-2 py-1 rounded text-xs border transition-colors ${selectedEquipmentSlot === EquipmentSlot.Gloves
                      ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                      : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                      } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    Gloves
                  </button>
                  <button
                    onClick={() =>
                      handleEquipmentSlotChange(EquipmentSlot.Legs)
                    }
                    disabled={isPending}
                    className={`px-2 py-1 rounded text-xs border transition-colors ${selectedEquipmentSlot === EquipmentSlot.Legs
                      ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                      : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                      } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    Legs
                  </button>
                  <button
                    onClick={() =>
                      handleEquipmentSlotChange(EquipmentSlot.Boots)
                    }
                    disabled={isPending}
                    className={`px-2 py-1 rounded text-xs border transition-colors ${selectedEquipmentSlot === EquipmentSlot.Boots
                      ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                      : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                      } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    Boots
                  </button>
                  <button
                    onClick={() =>
                      handleEquipmentSlotChange(EquipmentSlot.Ring1)
                    }
                    disabled={isPending}
                    className={`px-2 py-1 rounded text-xs border transition-colors ${selectedEquipmentSlot === EquipmentSlot.Ring1 ||
                      selectedEquipmentSlot === EquipmentSlot.Ring2 ||
                      selectedEquipmentSlot === EquipmentSlot.Ring3 ||
                      selectedEquipmentSlot === EquipmentSlot.Ring4
                      ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                      : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                      } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    Ring
                  </button>
                  <button
                    onClick={() =>
                      handleEquipmentSlotChange(EquipmentSlot.Accessory1)
                    }
                    disabled={isPending}
                    className={`px-2 py-1 rounded text-xs border transition-colors ${selectedEquipmentSlot === EquipmentSlot.Accessory1 ||
                      selectedEquipmentSlot === EquipmentSlot.Accessory2
                      ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                      : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                      } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    Accessory
                  </button>
                  <button
                    onClick={() =>
                      handleEquipmentSlotChange(EquipmentSlot.Artifact1)
                    }
                    disabled={isPending}
                    className={`px-2 py-1 rounded text-xs border transition-colors ${selectedEquipmentSlot === EquipmentSlot.Artifact1 ||
                      selectedEquipmentSlot === EquipmentSlot.Artifact2
                      ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                      : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                      } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    Signature
                  </button>
                </div>
              )}
              {/* 排序按钮 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSortByRarity(!sortByRarity)}
                  className={`px-3 py-1.5 rounded text-sm border transition-colors flex items-center gap-1.5 ${sortByRarity
                    ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                    : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                    }`}
                >
                  <ArrowUpDown size={14} />
                  {sortByRarity ? 'Sort by Quality' : 'Original Order'}
                </button>
                <span className="text-xs text-stone-500">
                  {filteredAndSortedInventory.length} Items
                </span>
              </div>
            </div>

            {/* 物品网格 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
              {filteredAndSortedInventory.length === 0 ? (
                <div className="col-span-full text-center text-stone-500 py-10 font-serif">
                  {selectedCategory === 'all'
                    ? 'No items found. Explore the wasteland for tech and resources!'
                    : `No items in this category.`}
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
        <div className="p-3 border-t border-stone-600 bg-ink-900 rounded-b text-sm font-serif">
          <div className="flex items-center justify-center gap-4 mb-2 min-h-[3rem]">
            {comparison ? (
              <div className="flex items-center gap-4">
                <span className="text-stone-400">Gear Preview:</span>
                {comparison.attack !== 0 && (
                  <span
                    className={`${comparison.attack > 0 ? 'text-mystic-jade' : 'text-mystic-blood'}`}
                  >
                    FP {formatValueChange(calculateTotalEquippedStats.attack, calculateTotalEquippedStats.attack + comparison.attack)}
                  </span>
                )}
                {comparison.defense !== 0 && (
                  <span
                    className={`${comparison.defense > 0 ? 'text-mystic-jade' : 'text-mystic-blood'}`}
                  >
                    DR {formatValueChange(calculateTotalEquippedStats.defense, calculateTotalEquippedStats.defense + comparison.defense)}
                  </span>
                )}
                {comparison.hp !== 0 && (
                  <span
                    className={`${comparison.hp > 0 ? 'text-mystic-jade' : 'text-mystic-blood'}`}
                  >
                    HP {formatValueChange(calculateTotalEquippedStats.hp, calculateTotalEquippedStats.hp + comparison.hp)}
                  </span>
                )}
                {comparison.attack === 0 &&
                  comparison.defense === 0 &&
                  comparison.hp === 0 && (
                    <span className="text-stone-500">No variation</span>
                  )}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <span className="text-stone-400">Gear Preview:</span>
                {calculateTotalEquippedStats.attack > 0 && (
                  <span className="text-mystic-jade">
                    FP {formatNumber(calculateTotalEquippedStats.attack)}
                  </span>
                )}
                {calculateTotalEquippedStats.defense > 0 && (
                  <span className="text-mystic-jade">
                    DR {formatNumber(calculateTotalEquippedStats.defense)}
                  </span>
                )}
                {calculateTotalEquippedStats.hp > 0 && (
                  <span className="text-mystic-jade">
                    HP {formatNumber(calculateTotalEquippedStats.hp)}
                  </span>
                )}
                {calculateTotalEquippedStats.attack === 0 &&
                  calculateTotalEquippedStats.defense === 0 &&
                  calculateTotalEquippedStats.hp === 0 && (
                    <span className="text-stone-500">No gear</span>
                  )}
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
