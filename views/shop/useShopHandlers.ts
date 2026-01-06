import React from 'react';
import { PlayerStats, ShopType, ShopItem, Item, Shop, ItemType, ItemRarity } from '../../types';
import { SHOPS, REALM_ORDER, FOUNDATION_TREASURES, HEAVEN_EARTH_ESSENCES, HEAVEN_EARTH_MARROWS, LONGEVITY_RULES } from '../../constants/index';
import { uid } from '../../utils/gameUtils';
import { calculateItemSellPrice } from '../../utils/itemUtils';
import { generateShopItems } from '../../services/shopService';

interface UseShopHandlersProps {
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
  currentShop: Shop | null;
  setCurrentShop: (shop: Shop | null) => void;
  setIsShopOpen: (open: boolean) => void;
  setPurchaseSuccess: (
    success: { item: string; quantity: number } | null
  ) => void;
}

/**
 * Shop Handlers
 * Handles opening shop, buying items, and selling items
 * @param player Player data
 * @param setPlayer Set player data
 * @param addLog Add log message
 * @param currentShop Current shop
 * @param setCurrentShop Set current shop
 * @param setIsShopOpen Set is shop open
 * @param setPurchaseSuccess Set purchase success
 * @returns handleOpenShop
 * @returns handleBuyItem
 * @returns handleSellItem
 */

export function useShopHandlers({
  player,
  setPlayer,
  addLog,
  currentShop,
  setCurrentShop,
  setIsShopOpen,
  setPurchaseSuccess,
}: UseShopHandlersProps) {
  const handleOpenShop = (shopType: ShopType) => {
    const shop = SHOPS.find((s) => s.type === shopType);
    if (shop) {
      // For dynamic shops (Black Market, Limited Time, Reputation), generate items
      const dynamicShopTypes = [
        ShopType.BlackMarket,
        ShopType.LimitedTime,
        ShopType.Reputation,
      ];

      if (dynamicShopTypes.includes(shopType)) {
        // Generate shop items
        const generatedItems = generateShopItems(shopType, player.realm, false);
        const shopWithItems: Shop = {
          ...shop,
          items: generatedItems,
        };
        setCurrentShop(shopWithItems);
      } else {
        // Regular shops use predefined items
        setCurrentShop(shop);
      }

      setIsShopOpen(true);
      addLog(`You have arrived at [${shop.name}].`, 'normal');
    }
  };

  const handleBuyItem = (shopItem: ShopItem, quantity: number = 1) => {
    setPlayer((prev) => {
      // Check reputation requirements (Reputation Shop)
      if (currentShop?.reputationRequired && (prev.reputation || 0) < currentShop.reputationRequired) {
        addLog(`Insufficient Reputation! Requires ${currentShop.reputationRequired} reputation to purchase.`, 'danger');
        return prev;
      }

      const totalPrice = shopItem.price * quantity;
      if (prev.spiritStones < totalPrice) {
        addLog('Insufficient Caps!', 'danger');
        return prev;
      }

      // Check realm (clearance) requirements
      if (shopItem.minRealm) {
        const itemRealmIndex = REALM_ORDER.indexOf(shopItem.minRealm);
        const playerRealmIndex = REALM_ORDER.indexOf(prev.realm);
        if (playerRealmIndex < itemRealmIndex) {
          addLog(`Insufficient Clearance! Requires ${shopItem.minRealm} to purchase.`, 'danger');
          return prev;
        }
      }

      // Check if advanced item
      if (shopItem.isAdvancedItem && shopItem.advancedItemType) {
        // Advanced Item: Add to inventory
        let selectedItem: { id: string; name: string; description: string; rarity: string } | null = null;
        let advancedItemType: 'foundationTreasure' | 'heavenEarthEssence' | 'heavenEarthMarrow' | 'longevityRule' | null = null;

        if (shopItem.advancedItemType === 'foundationTreasure') {
          const treasures = Object.values(FOUNDATION_TREASURES);
          const availableTreasures = treasures.filter(t =>
            !t.requiredLevel || prev.realmLevel >= t.requiredLevel
          );
          if (availableTreasures.length > 0) {
            const selected = availableTreasures[Math.floor(Math.random() * availableTreasures.length)];
            selectedItem = { id: selected.id, name: selected.name, description: selected.description, rarity: selected.rarity };
            advancedItemType = 'foundationTreasure';
          } else {
            addLog('No available Foundation Treasures!', 'danger');
            return prev;
          }
        } else if (shopItem.advancedItemType === 'heavenEarthEssence') {
          const essences = Object.values(HEAVEN_EARTH_ESSENCES);
          if (essences.length > 0) {
            const selected = essences[Math.floor(Math.random() * essences.length)];
            selectedItem = { id: selected.id, name: selected.name, description: selected.description, rarity: selected.rarity };
            advancedItemType = 'heavenEarthEssence';
          } else {
            addLog('No available Heaven Earth Essences!', 'danger');
            return prev;
          }
        } else if (shopItem.advancedItemType === 'heavenEarthMarrow') {
          const marrows = Object.values(HEAVEN_EARTH_MARROWS);
          if (marrows.length > 0) {
            const selected = marrows[Math.floor(Math.random() * marrows.length)];
            selectedItem = { id: selected.id, name: selected.name, description: selected.description, rarity: selected.rarity };
            advancedItemType = 'heavenEarthMarrow';
          } else {
            addLog('No available Heaven Earth Marrows!', 'danger');
            return prev;
          }
        } else if (shopItem.advancedItemType === 'longevityRule') {
          const rules = Object.values(LONGEVITY_RULES);
          const currentRules = prev.longevityRules || [];
          const availableRules = rules.filter(r => !currentRules.includes(r.id));
          const maxRules = prev.maxLongevityRules || 3;
          if (availableRules.length > 0 && currentRules.length < maxRules) {
            const selected = availableRules[Math.floor(Math.random() * availableRules.length)];
            selectedItem = { id: selected.id, name: selected.name, description: selected.description, rarity: 'Mythic' };
            advancedItemType = 'longevityRule';
          } else {
            addLog('You already possess all available perks!', 'danger');
            return prev;
          }
        }

        if (selectedItem && advancedItemType) {
          addLog(
            `✨ You spent ${totalPrice} Caps to buy [${selectedItem.name}]! This is a key item for breakthrough!`,
            'special'
          );
          setPurchaseSuccess({ item: selectedItem.name, quantity: 1 });
          setTimeout(() => setPurchaseSuccess(null), 2000);

          const newInventory = [...prev.inventory];
          newInventory.push({
            id: uid(),
            name: selectedItem.name,
            type: ItemType.AdvancedItem,
            description: selectedItem.description,
            quantity: 1,
            rarity: selectedItem.rarity as ItemRarity,
            advancedItemType,
            advancedItemId: selectedItem.id,
          });

          return {
            ...prev,
            spiritStones: prev.spiritStones - totalPrice,
            inventory: newInventory,
          };
        }
      }

      // Normal Item: Add to inventory
      const newInv = [...prev.inventory];
      const isEquipment = shopItem.isEquippable && shopItem.equipmentSlot;
      const existingIdx = newInv.findIndex((i) => i.name === shopItem.name);

      if (existingIdx >= 0 && !isEquipment) {
        // Non-equipment items can stack
        // Ensure all properties (including permanentEffect) are preserved when stacking
        newInv[existingIdx] = {
          ...newInv[existingIdx],
          ...shopItem,
          id: newInv[existingIdx].id, // Keep original ID
          quantity: newInv[existingIdx].quantity + quantity,
        };
      } else {
        // Equipment or new item, each takes a slot
        // If equipment, create new item for each purchase (quantity=1)
        // If non-equipment, create or stack
        const itemsToAdd = isEquipment ? quantity : 1; // Equipment always adds new items
        const addQuantity = isEquipment ? 1 : quantity; // Equipment quantity always 1

        for (let i = 0; i < itemsToAdd; i++) {
          const newItem: Item = {
            id: uid(),
            name: shopItem.name,
            type: shopItem.type,
            description: shopItem.description,
            quantity: addQuantity,
            rarity: shopItem.rarity,
            level: 0,
            isEquippable: shopItem.isEquippable,
            equipmentSlot: shopItem.equipmentSlot,
            effect: shopItem.effect,
            permanentEffect: shopItem.permanentEffect,
          };
          newInv.push(newItem);
        }
      }

      addLog(
        `You spent ${totalPrice} Caps to buy ${shopItem.name} x${quantity}.`,
        'gain'
      );
      // Show purchase success popup
      setPurchaseSuccess({ item: shopItem.name, quantity });
      setTimeout(() => setPurchaseSuccess(null), 2000);

      return {
        ...prev,
        spiritStones: prev.spiritStones - totalPrice,
        inventory: newInv,
      };
    });
  };

  const handleSellItem = (item: Item, quantity?: number) => {
    if (!currentShop) return;

    setPlayer((prev) => {
      // Check if equipped
      const isEquipped = Object.values(prev.equippedItems).includes(item.id);
      if (isEquipped) {
        addLog('Cannot sell equipped items! Please unequip first.', 'danger');
        return prev;
      }

      // Find corresponding shop item to calculate sell price
      const shopItem = currentShop.items.find((si) => si.name === item.name);
      const sellPrice = shopItem?.sellPrice || calculateItemSellPrice(item);

      // Ensure sellPrice is valid
      const validSellPrice = isNaN(sellPrice) || sellPrice <= 0 ? 1 : sellPrice;

      // Determine sell quantity (default 1, max item quantity)
      const sellQuantity = quantity !== undefined
        ? Math.min(quantity, item.quantity || 1)
        : 1;

      if (sellQuantity <= 0) return prev;

      const totalPrice = validSellPrice * sellQuantity;

      // Ensure totalPrice is valid
      if (isNaN(totalPrice) || totalPrice <= 0) {
        addLog('Error calculating sell price. Please try again.', 'danger');
        return prev;
      }

      const newInv = prev.inventory
        .map((i) => {
          if (i.id === item.id) {
            return { ...i, quantity: i.quantity - sellQuantity };
          }
          return i;
        })
        .filter((i) => i.quantity > 0);

      if (sellQuantity === 1) {
        addLog(`You sold ${item.name} for ${validSellPrice} Caps.`, 'gain');
      } else {
        addLog(`You sold ${item.name} x${sellQuantity} for ${totalPrice} Caps.`, 'gain');
      }

      // Ensure spiritStones is valid, prevent NaN
      const currentSpiritStones = prev.spiritStones || 0;
      const newSpiritStones = currentSpiritStones + totalPrice;

      // Re-check to ensure result is not NaN
      if (isNaN(newSpiritStones)) {
        addLog('Error calculating Caps. Please try again.', 'danger');
        return prev;
      }

      return {
        ...prev,
        spiritStones: newSpiritStones,
        inventory: newInv,
      };
    });
  };

  return {
    handleOpenShop,
    handleBuyItem,
    handleSellItem,
  };
}
