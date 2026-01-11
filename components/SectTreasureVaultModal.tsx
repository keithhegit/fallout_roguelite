import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { PlayerStats, Item, ItemType, ItemRarity, RealmType } from '../types';
import { ASSETS } from '../constants/assets';
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
  // Helper function to generate vault items (use useCallback to avoid unnecessary recreation)
  const generateVaultItems = useCallback((realm: string): Item[] => {
    const items: Item[] = [];
    const itemCount = 5 + Math.floor(Math.random() * 4); // 5-8 items

    // Determine rarity distribution based on player realm
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
      let targetRarity: ItemRarity = 'Common';

      if (roll < rarityChances['Mythic']) {
        targetRarity = 'Mythic';
      } else if (roll < rarityChances['Mythic'] + rarityChances['Legendary']) {
        targetRarity = 'Legendary';
      } else if (roll < rarityChances['Mythic'] + rarityChances['Legendary'] + rarityChances['Rare']) {
        targetRarity = 'Rare';
      } else {
        targetRarity = 'Common';
      }
      
      // Filter items of the corresponding rarity
      let availableItems = allItems.filter(
        item => (item.rarity as any) === targetRarity && !selectedNames.has(item.name)
      );

      // If no items available for this rarity, downgrade search (but keep rarity label)
      if (availableItems.length === 0 && targetRarity !== 'Common') {
        availableItems = allItems.filter(
          item => (item.rarity === 'Common' || item.rarity === 'Rare') && !selectedNames.has(item.name)
        );
      }

      // If still none, allow duplicates (but keep rarity label)
      if (availableItems.length === 0) {
        availableItems = allItems.filter(
          item => (item.rarity as any) === targetRarity || targetRarity === 'Common'
        );
      }

      if (availableItems.length > 0) {
        const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
        selectedNames.add(randomItem.name);

        // Create item object
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

  // Initialize or get sect vault items (generate high-quality items based on player realm)
  const vaultItems = useMemo(() => {
    // If vault exists and has items, use existing items and filter out taken ones
    if (player.sectTreasureVault && player.sectTreasureVault.items.length > 0) {
      const takenIds = new Set(player.sectTreasureVault.takenItemIds || []);
      return player.sectTreasureVault.items.filter(item => !takenIds.has(item.id));
    }

    // Otherwise return empty array (initialization handled by useEffect)
    return [];
  }, [player.sectTreasureVault]);

  // Use useEffect for vault initialization to avoid side effects in useMemo
  useEffect(() => {
    // If vault is empty and modal is open, generate new vault
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

  // Calculate vault statistics
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
      <div className="bg-ink-950 w-full max-w-4xl md:rounded-none border border-stone-800 shadow-2xl relative flex flex-col max-h-[85vh] overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
        {/* CRT scanline effect */}
        <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none z-50"></div>

        <div className="p-4 border-b border-stone-800 flex justify-between items-center bg-stone-950 z-10">
          <h3 className="text-xl font-bold text-emerald-500 flex items-center gap-2 uppercase tracking-wider">
            <Package size={20} />
            FACTION_ARMORY_TERMINAL
            <Sparkles size={16} className="text-emerald-400" />
          </h3>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-white transition-colors relative z-10"
          >
            <X size={24} />
          </button>
        </div>

        <div className="modal-scroll-container modal-scroll-content p-6 z-10 overflow-y-auto bg-ink-950/50">
          <div className="mb-4 text-stone-300 text-[10px] uppercase tracking-widest border-l-2 border-emerald-500/50 pl-3 py-1">
            <p className="mb-2">TERMINAL_LOG: RESTRICTED_STOCK_ACCESS_GRANTED. ONE_REQUISITION_PER_PROTOCOL.</p>
            <p className="text-stone-500">STOCK_QUALITY: SCALES_WITH_CLEARANCE_RANK. HIGHER_RANK_UNLOCKS_SUPERIOR_TECH.</p>
            {vaultStats.total > 0 && (
              <p className="text-emerald-500/60 mt-2">
                REMAINING_ASSETS: {vaultStats.remaining}/{vaultStats.total} (CLAIMED: {vaultStats.taken})
              </p>
            )}
          </div>

          {vaultItems.length === 0 ? (
            <div className="text-center py-12 bg-stone-900/40 border border-stone-800 relative group overflow-hidden">
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
              <Package className="mx-auto text-stone-800 mb-4 relative z-10" size={48} />
              <p className="text-stone-400 text-lg mb-2 uppercase tracking-widest relative z-10">ARMORY_EMPTY</p>
              <p className="text-stone-600 text-[10px] uppercase tracking-tighter relative z-10">ALL_REQUISITIONS_FILLED.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vaultItems.map((item) => (
                <div
                  key={item.id}
                  className={`border rounded-none p-4 relative group overflow-hidden transition-all hover:scale-[1.02] cursor-pointer ${
                    (item.rarity as any) === 'Exotic' ? 'bg-yellow-900/10 border-yellow-500/30' :
                    (item.rarity as any) === 'Legendary' ? 'bg-purple-900/10 border-purple-500/30' :
                    (item.rarity as any) === 'Rare' ? 'bg-blue-900/10 border-blue-500/30' :
                    'bg-stone-900/40 border-stone-800'
                  }`}
                  onClick={() => {
                    onTakeItem(item);
                    onClose();
                  }}
                >
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
                  
                  <div className="flex items-start justify-between mb-2 relative z-10">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h4 className="font-bold text-stone-200 uppercase tracking-wider text-sm">{item.name.replace(/\s+/g, '_')}</h4>
                        {item.rarity && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-none border uppercase tracking-widest font-bold ${
                            (item.rarity as any) === 'Exotic' ? 'text-yellow-400 border-yellow-900/50 bg-yellow-950/30' :
                            (item.rarity as any) === 'Legendary' ? 'text-purple-400 border-purple-900/50 bg-purple-950/30' :
                            (item.rarity as any) === 'Rare' ? 'text-blue-400 border-blue-900/50 bg-blue-950/30' :
                            'text-stone-400 border-stone-800 bg-stone-950/30'
                          }`}>
                            {item.rarity === 'Mythic' ? 'LEGENDARY' : item.rarity === 'Legendary' ? 'EPIC' : item.rarity === 'Rare' ? 'RARE' : 'COMMON'}
                          </span>
                        )}
                        <span className="text-[9px] text-stone-500 px-1.5 py-0.5 rounded-none border border-stone-800 uppercase tracking-widest">
                          {item.type}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-500 mb-4 uppercase tracking-tighter leading-relaxed">{item.description}</p>

                      {item.effect && (
                        <div className="text-[9px] text-stone-400 space-y-1 mb-4 p-2 bg-stone-950/50 border border-stone-800/50 uppercase tracking-widest">
                          {item.effect.attack && <div>FP: +{item.effect.attack}</div>}
                          {item.effect.defense && <div>DR: +{item.effect.defense}</div>}
                          {item.effect.hp && <div>HP: +{item.effect.hp}</div>}
                          {item.effect.spirit && <div>PER: +{item.effect.spirit}</div>}
                          {item.effect.physique && <div>END: +{item.effect.physique}</div>}
                          {item.effect.speed && <div>AGI: +{item.effect.speed}</div>}
                          {item.effect.exp && <div>DATA: +{item.effect.exp}</div>}
                        </div>
                      )}

                      {item.permanentEffect && (
                        <div className="text-[9px] text-yellow-500/70 space-y-1 mt-1 p-2 bg-yellow-950/10 border border-yellow-900/20 uppercase tracking-widest animate-pulse">
                          {item.permanentEffect.attack && <div>✨ FP_PERMANENT: +{item.permanentEffect.attack}</div>}
                          {item.permanentEffect.defense && <div>✨ DR_PERMANENT: +{item.permanentEffect.defense}</div>}
                          {item.permanentEffect.spirit && <div>✨ PER_PERMANENT: +{item.permanentEffect.spirit}</div>}
                          {item.permanentEffect.physique && <div>✨ END_PERMANENT: +{item.permanentEffect.physique}</div>}
                          {item.permanentEffect.speed && <div>✨ AGI_PERMANENT: +{item.permanentEffect.speed}</div>}
                          {item.permanentEffect.maxHp && <div>✨ MAX_HP_PERMANENT: +{item.permanentEffect.maxHp}</div>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-stone-800 relative z-10">
                    <button
                      className="w-full px-4 py-2 bg-emerald-900/20 hover:bg-emerald-900/40 text-emerald-500 border border-emerald-800/50 rounded-none transition-all uppercase tracking-widest font-bold text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTakeItem(item);
                        onClose();
                      }}
                    >
                      [ CONFIRM_REQUISITION ]
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-stone-800 bg-stone-950 z-10">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-none transition-colors uppercase tracking-widest font-bold text-xs border border-stone-700 relative z-10"
          >
            [ CLOSE_TERMINAL ]
          </button>
        </div>
      </div>
    </div>
  );
};

export default SectTreasureVaultModal;

