import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { PlayerStats, Item, ItemType, ItemRarity, RealmType } from '../types';
import { LOOT_ITEMS } from '../services/battleService';
import { uid } from '../utils/gameUtils';
import { getRarityBadge } from '../utils/rarityUtils';
import { X, Package, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  onTakeItem: (item: Item) => void;
  onUpdateVault?: (vault: { items: Item[]; takenItemIds: string[] }) => void;
}

const SectTreasureVaultModal: React.FC<Props> = ({
  isOpen,
  onClose,
  player,
  onTakeItem,
  onUpdateVault,
}) => {
  // 生成宝库物品的辅助函数（使用 useCallback 避免不必要的重新创建）
  const generateVaultItems = useCallback((realm: string): Item[] => {
    const items: Item[] = [];
    const itemCount = 5 + Math.floor(Math.random() * 4); // 5-8个物品

    // 根据玩家境界决定稀有度分布
    const realmIndex = realm === RealmType.QiRefining ? 0 :
      realm === RealmType.Foundation ? 1 :
        realm === RealmType.GoldenCore ? 2 :
          realm === RealmType.NascentSoul ? 3 :
            realm === RealmType.SpiritSevering ? 4 :
              realm === RealmType.DaoCombining ? 5 : 6;

    const rarityChances = {
      'Exotic': Math.min(0.15 + realmIndex * 0.05, 0.4),
      'Legendary': Math.min(0.35 + realmIndex * 0.03, 0.6),
      'Rare': Math.min(0.4 - realmIndex * 0.02, 0.3),
      'Common': Math.max(0.1 - realmIndex * 0.01, 0.05),
    };

    const allItems = [
      ...LOOT_ITEMS.herbs,
      ...LOOT_ITEMS.pills,
      ...LOOT_ITEMS.materials,
      ...LOOT_ITEMS.weapons,
      ...LOOT_ITEMS.armors,
      ...LOOT_ITEMS.artifacts,
      ...LOOT_ITEMS.accessories,
    ];

    const selectedNames = new Set<string>();

    for (let i = 0; i < itemCount; i++) {
      const roll = Math.random();
      let targetRarity: ItemRarity = '普通';

      if (roll < rarityChances['Exotic']) {
        targetRarity = 'Exotic';
      } else if (roll < rarityChances['Exotic'] + rarityChances['Legendary']) {
        targetRarity = 'Legendary';
      } else if (roll < rarityChances['Exotic'] + rarityChances['Legendary'] + rarityChances['Rare']) {
        targetRarity = 'Rare';
      } else {
        targetRarity = 'Common';
      }

      // 筛选对应稀有度的物品
      let availableItems = allItems.filter(
        item => (item.rarity as any) === targetRarity && !selectedNames.has(item.name)
      );

      // 如果该稀有度没有可用物品，降级查找（但保持稀有度标签）
      if (availableItems.length === 0 && targetRarity !== 'Common') {
        availableItems = allItems.filter(
          item => (item.rarity === 'Common' || item.rarity === 'Rare') && !selectedNames.has(item.name)
        );
      }

      // 如果还是没有，允许重复（但保持稀有度标签）
      if (availableItems.length === 0) {
        availableItems = allItems.filter(
          item => (item.rarity as any) === targetRarity || targetRarity === 'Common'
        );
      }

      if (availableItems.length > 0) {
        const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
        selectedNames.add(randomItem.name);

        // 创建物品对象
        const item: Item = {
          id: uid(),
          name: randomItem.name,
          type: randomItem.type,
          description: (randomItem as any).description || `${randomItem.name}, requisitioned from the Faction Armory.`,
          quantity: 1,
          rarity: randomItem.rarity,
          isEquippable: (randomItem as any).isEquippable,
          equipmentSlot: (randomItem as any).equipmentSlot,
          effect: (randomItem as any).effect,
          permanentEffect: (randomItem as any).permanentEffect,
        };

        items.push(item);
      }
    }

    return items;
  }, []);

  // 初始化或获取宗门宝库物品（根据玩家境界生成高质量物品）
  const vaultItems = useMemo(() => {
    // 如果宝库已存在且有物品，使用现有物品并过滤已拿取的
    if (player.sectTreasureVault && player.sectTreasureVault.items.length > 0) {
      const takenIds = new Set(player.sectTreasureVault.takenItemIds || []);
      return player.sectTreasureVault.items.filter(item => !takenIds.has(item.id));
    }

    // 否则返回空数组（由 useEffect 处理初始化）
    return [];
  }, [player.sectTreasureVault]);

  // 使用 useEffect 处理宝库初始化，避免在 useMemo 中使用副作用
  useEffect(() => {
    // 如果宝库为空且弹窗打开，生成新宝库
    if (isOpen && onUpdateVault && (!player.sectTreasureVault || player.sectTreasureVault.items.length === 0)) {
      const items = generateVaultItems(player.realm);
      if (items.length > 0) {
        onUpdateVault({
          items,
          takenItemIds: [],
        });
      }
    }
  }, [isOpen, player.realm, player.sectTreasureVault, onUpdateVault, generateVaultItems]);

  // 计算宝库统计信息
  const vaultStats = useMemo(() => {
    if (!player.sectTreasureVault) {
      return { total: 0, taken: 0, remaining: 0 };
    }
    const total = player.sectTreasureVault.items.length;
    const taken = player.sectTreasureVault.takenItemIds?.length || 0;
    const remaining = total - taken;
    return { total, taken, remaining };
  }, [player.sectTreasureVault]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4 backdrop-blur-sm">
      <div className="bg-paper-800 w-full max-w-4xl rounded border border-gold-500 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="p-4 border-b border-gold-500 flex justify-between items-center bg-ink-800 rounded-t">
          <h3 className="text-xl font-serif text-mystic-gold flex items-center gap-2">
            <Package size={20} />
            Faction Armory
            <Sparkles size={16} className="text-yellow-400" />
          </h3>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <div className="modal-scroll-container modal-scroll-content p-6">
          <div className="mb-4 text-stone-300 text-sm">
            <p className="mb-2">✨ This is the Faction's restricted stock. You may requisition one item.</p>
            <p className="text-stone-400">Stock quality scales with your clearance Rank. Higher Rank unlocks superior tech.</p>
            {vaultStats.total > 0 && (
              <p className="text-stone-500 text-xs mt-2">
                Remaining: {vaultStats.remaining}/{vaultStats.total} (Claimed: {vaultStats.taken})
              </p>
            )}
          </div>

          {vaultItems.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto text-stone-500 mb-4" size={48} />
              <p className="text-stone-400 text-lg mb-2">Armory Empty</p>
              <p className="text-stone-500 text-sm">All requisitions filled.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vaultItems.map((item) => (
                <div
                  key={item.id}
                  className={`border rounded-lg p-4 bg-stone-800/30 border-stone-400/50 hover:scale-105 transition-transform cursor-pointer ${(item.rarity as any) === 'Mythic' ? 'bg-yellow-900/30 border-yellow-400/50' :
                    (item.rarity as any) === 'Legendary' ? 'bg-purple-900/30 border-purple-400/50' :
                      (item.rarity as any) === 'Rare' ? 'bg-blue-900/30 border-blue-400/50' :
                        'bg-stone-800/30 border-stone-400/50'
                    }`}
                  onClick={() => {
                    onTakeItem(item);
                    onClose();
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-white">{item.name}</h4>
                        {item.rarity && (
                          <span className={`text-xs px-2 py-0.5 rounded border ${getRarityBadge(item.rarity)}`}>
                            {item.rarity}
                          </span>
                        )}
                        <span className="text-xs text-stone-400 px-2 py-0.5 rounded border border-stone-600">
                          {item.type}
                        </span>
                      </div>
                      <p className="text-sm text-stone-300 mb-2">{item.description}</p>

                      {item.effect && (
                        <div className="text-xs text-stone-400 space-y-1">
                          {item.effect.attack && <div>FP +{item.effect.attack}</div>}
                          {item.effect.defense && <div>DR +{item.effect.defense}</div>}
                          {item.effect.hp && <div>HP +{item.effect.hp}</div>}
                          {item.effect.spirit && <div>PER +{item.effect.spirit}</div>}
                          {item.effect.physique && <div>END +{item.effect.physique}</div>}
                          {item.effect.speed && <div>AGI +{item.effect.speed}</div>}
                          {item.effect.exp && <div>Data +{item.effect.exp}</div>}
                        </div>
                      )}

                      {item.permanentEffect && (
                        <div className="text-xs text-yellow-400 space-y-1 mt-1">
                          {item.permanentEffect.attack && <div>✨ FP Permanent +{item.permanentEffect.attack}</div>}
                          {item.permanentEffect.defense && <div>✨ DR Permanent +{item.permanentEffect.defense}</div>}
                          {item.permanentEffect.spirit && <div>✨ PER Permanent +{item.permanentEffect.spirit}</div>}
                          {item.permanentEffect.physique && <div>✨ END Permanent +{item.permanentEffect.physique}</div>}
                          {item.permanentEffect.speed && <div>✨ AGI Permanent +{item.permanentEffect.speed}</div>}
                          {item.permanentEffect.maxHp && <div>✨ HP Max Permanent +{item.permanentEffect.maxHp}</div>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-stone-700">
                    <button
                      className="w-full px-4 py-2 bg-gold-600 hover:bg-gold-500 text-white rounded transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTakeItem(item);
                        onClose();
                      }}
                    >
                      Confirm Requisition
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gold-500 bg-ink-800 rounded-b">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-stone-700 hover:bg-stone-600 text-white rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SectTreasureVaultModal;

