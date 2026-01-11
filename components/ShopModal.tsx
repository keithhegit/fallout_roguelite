import React, { useState, useMemo } from 'react';
import {
  X,
  ShoppingBag,
  Coins,
  Package,
  Filter,
  Trash,
  RefreshCw,
  Box,
} from 'lucide-react';
import {
  Shop,
  ShopItem,
  Item,
  PlayerStats,
  ItemRarity,
  ItemType,
} from '../types';
import { ASSETS } from '../constants/assets';
import { REALM_ORDER, RARITY_MULTIPLIERS } from '../constants/index';
import { generateShopItems } from '../services/shopService';
import { showError, showConfirm } from '../utils/toastUtils';
import { getRarityTextColor, getRarityBorder } from '../utils/rarityUtils';
import { calculateItemSellPrice, normalizeTypeLabel } from '../utils/itemUtils';
import { formatNumber } from '../utils/formatUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  shop: Shop;
  player: PlayerStats;
  onBuyItem: (shopItem: ShopItem, quantity?: number) => void;
  onSellItem: (item: Item, quantity?: number) => void;
  onRefreshShop?: (newItems: ShopItem[]) => void;
  onOpenInventory?: () => void;
}

type ItemTypeFilter = 'all' | ItemType;

const ShopModal: React.FC<Props> = ({
  isOpen,
  onClose,
  shop,
  player,
  onBuyItem,
  onSellItem,
  onRefreshShop,
  onOpenInventory,
}) => {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [buyQuantities, setBuyQuantities] = useState<Record<string, number>>(
    {}
  );
  const [selectedTypeFilter, setSelectedTypeFilter] =
    useState<ItemTypeFilter>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectedRarity, setSelectedRarity] = useState<'all' | ItemRarity>(
    'all'
  );

  const canBuyItem = (shopItem: ShopItem): boolean => {
    // Check reputation requirement (Reputation Shop)
    if (shop.reputationRequired && (player.reputation || 0) < shop.reputationRequired) {
      return false;
    }
    if (player.spiritStones < shopItem.price) return false;
    if (shopItem.minRealm) {
      const itemRealmIndex = REALM_ORDER.indexOf(shopItem.minRealm);
      const playerRealmIndex = REALM_ORDER.indexOf(player.realm);
      return playerRealmIndex >= itemRealmIndex;
    }
    return true;
  };

  const getShopTypeColor = (type: string) => {
    switch (type) {
      case 'Settlement':
        return 'text-green-400';
      case 'Hub':
        return 'text-blue-400';
      case 'Faction':
        return 'text-purple-400';
      default:
        return 'text-stone-400';
    }
  };

  // Filter items (by type, but not by realm, show all items)
  // Reputation shop should show all items, even if current realm cannot buy
  const availableItems = useMemo(() => {
    let filtered = shop.items;

    // Filter by type
    if (selectedTypeFilter !== 'all') {
      filtered = filtered.filter((item) => item.type === selectedTypeFilter);
    }

    return filtered;
  }, [shop.items, selectedTypeFilter]);

  // Sellable items (exclude equipped, and filter by type and rarity)
  const sellableItems = useMemo(() => {
    if (!Array.isArray(player.inventory)) return [];
    let filtered = player.inventory.filter((item) => {
      // Cannot sell equipped items
      const isEquipped = Object.values(player.equippedItems).includes(item.id);
      if (isEquipped) return false;

      // Filter by type
      if (selectedTypeFilter !== 'all' && item.type !== selectedTypeFilter) {
        return false;
      }

      // Filter by rarity
      if (selectedRarity !== 'all' && item.rarity !== selectedRarity) {
        return false;
      }

      return true;
    });

    return filtered;
  }, [
    player.inventory,
    player.equippedItems,
    selectedTypeFilter,
    selectedRarity,
  ]);

  // Get all available item types (for filter, based on unfiltered raw data)
  const availableTypes = useMemo(() => {
    if (activeTab === 'buy') {
      const types = new Set<ItemType>();
      // Use raw shop item list, do not filter by realm (show all item types)
      shop.items.forEach((item) => types.add(item.type as ItemType));
      return Array.from(types);
    } else {
      const types = new Set<ItemType>();
      // Use raw inventory list, only exclude equipped items
      player.inventory
        .filter((item) => {
          const isEquipped = Object.values(player.equippedItems).includes(
            item.id
          );
          return !isEquipped;
        })
        .forEach((item) =>
          types.add(item.type === 'Material' ? ItemType.Material : item.type)
        );
      return Array.from(types);
    }
  }, [
    activeTab,
    shop.items,
    player.inventory,
    player.equippedItems,
  ]);

  // When switching tabs, if current selected type does not exist in new tab, reset to 'all'
  React.useEffect(() => {
    if (
      selectedTypeFilter !== 'all' &&
      !availableTypes.includes(selectedTypeFilter as ItemType)
    ) {
      setSelectedTypeFilter('all');
    }
    // Clear selection when switching tabs
    setSelectedItems(new Set());
  }, [activeTab, availableTypes, selectedTypeFilter]);

  const handleToggleItem = (itemId: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === sellableItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(sellableItems.map((item) => item.id)));
    }
  };

  const handleBatchSell = () => {
    if (selectedItems.size === 0) return;
    const itemsToSell = sellableItems.filter((item) =>
      selectedItems.has(item.id)
    );
    let totalPrice = 0;
    itemsToSell.forEach((item) => {
      const shopItem = shop.items.find((si) => si.name === item.name);
      const sellPrice = shopItem?.sellPrice || calculateItemSellPrice(item);
      // Ensure sellPrice and quantity are valid numbers
      const validSellPrice = isNaN(sellPrice) || sellPrice <= 0 ? 1 : sellPrice;
      const validQuantity = item.quantity || 1;
      const itemPrice = validSellPrice * validQuantity;
      // Ensure not NaN before adding
      if (!isNaN(itemPrice)) {
        totalPrice += itemPrice;
      }
    });

    // Ensure totalPrice is valid number
    if (isNaN(totalPrice) || totalPrice <= 0) {
      showConfirm('Error calculating price. Please try again.', 'Error', () => { });
      return;
    }

    showConfirm(
      `Confirm selling ${selectedItems.size} items for ${totalPrice} Caps?`,
      'Confirm Transaction',
      () => {
        itemsToSell.forEach((item) => {
          // Sell all quantity
          onSellItem(item, item.quantity);
        });
        setSelectedItems(new Set());
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-end md:items-center justify-center z-50 p-0 md:p-4 backdrop-blur-sm touch-manipulation"
      onClick={onClose}
    >
      <div
        className="bg-ink-950 w-full h-[80vh] md:h-auto md:max-w-4xl md:rounded-none border-0 md:border border-stone-800 shadow-2xl flex flex-col md:max-h-[90vh] overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background texture layer */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
        {/* CRT scanline effect */}
        <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none z-50"></div>

        <div className="p-3 md:p-4 border-b border-stone-800 flex justify-between items-center bg-stone-950 md:rounded-none z-10">
          <div>
            <h3 className="text-lg md:text-xl font-bold text-amber-400 flex items-center gap-2 uppercase tracking-tighter">
              <ShoppingBag size={18} className="md:w-5 md:h-5" />
              {shop.name}
            </h3>
            <p className="text-[10px] text-stone-500 mt-1 uppercase font-bold tracking-widest">{shop.description}</p>
            {shop.reputationRequired && (
              <p className="text-xs text-yellow-400 mt-1">
                Rep Required: {shop.reputationRequired} (Current: {player.reputation || 0})
                {player.reputation < shop.reputationRequired && (
                  <span className="text-red-400 ml-2">⚠️ Low Rep</span>
                )}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onOpenInventory && (
              <button
                onClick={onOpenInventory}
                className="flex items-center gap-1 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-200 rounded-none border border-stone-800 transition-colors text-sm"
                title="View Inventory"
              >
                <Box size={16} />
                <span className="hidden md:inline">INV</span>
              </button>
            )}
            {onRefreshShop && (
              <button
                onClick={() => {
                  const refreshCost = shop.refreshCost || 100; // Use shop refresh cost, default 100
                  if (player.spiritStones < refreshCost) {
                    showError(`Low Caps! Restock requires ${refreshCost} Caps.`);
                    return;
                  }
                  showConfirm(
                    `Confirm spending ${refreshCost} Caps to restock vendor supplies?`,
                    'Confirm Restock',
                    () => {
                      const newItems = generateShopItems(
                        shop.type,
                        player.realm,
                        true
                      );
                      onRefreshShop(newItems);
                    }
                  );
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-200 rounded-none border border-stone-800 transition-colors text-sm"
                title={`Spend ${shop.refreshCost || 100} Caps to restock items`}
              >
                <RefreshCw size={16} />
                <span className="hidden md:inline">RESTOCK</span>
                <span className="text-xs text-stone-400">({shop.refreshCost || 100})</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-800 bg-stone-950 z-10">
          <button
            onClick={() => setActiveTab('buy')}
            className={`flex-1 px-4 py-3 font-bold transition-all text-xs tracking-widest ${activeTab === 'buy'
              ? 'bg-stone-900 text-amber-400 border-b-2 border-amber-500'
              : 'text-stone-500 hover:text-stone-300 hover:bg-stone-900'
              }`}
          >
            BUY ITEMS
          </button>
          <button
            onClick={() => setActiveTab('sell')}
            className={`flex-1 px-4 py-3 font-bold transition-all text-xs tracking-widest ${activeTab === 'sell'
              ? 'bg-stone-900 text-amber-400 border-b-2 border-amber-500'
              : 'text-stone-500 hover:text-stone-300 hover:bg-stone-900'
              }`}
          >
            SELL INVENTORY
          </button>
        </div>

        {/* Content Area */}
        <div className="modal-scroll-container modal-scroll-content p-4 z-10">
          {activeTab === 'buy' ? (
            <div>
              <div className="mb-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-stone-500 uppercase font-bold tracking-widest">
                    CAPS BALANCE:{' '}
                    <span className="text-amber-400">
                      {player.spiritStones}
                    </span>
                  </span>
                  <span className={`text-[10px] uppercase font-bold tracking-widest ${getShopTypeColor(shop.type)}`}>
                    {shop.type} VENDOR
                  </span>
                </div>
                {/* Item category filter */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 text-stone-500 text-[10px] uppercase font-bold tracking-widest">
                    <Filter size={12} />
                    <span>Filter:</span>
                  </div>
                  <button
                    onClick={() => setSelectedTypeFilter('all')}
                    className={`px-3 py-1 rounded-none text-[10px] font-bold uppercase tracking-widest transition-all ${selectedTypeFilter === 'all'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                      : 'bg-stone-900 text-stone-500 hover:text-stone-300 border border-stone-800'
                      }`}
                  >
                    All
                  </button>
                  {availableTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedTypeFilter(type)}
                      className={`px-3 py-1 rounded-none text-[10px] font-bold uppercase tracking-widest transition-all ${selectedTypeFilter === type
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                        : 'bg-stone-900 text-stone-500 hover:text-stone-300 border border-stone-800'
                        }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableItems.length === 0 ? (
                  <div className="col-span-full text-center text-stone-500 py-10">
                    No items available at current Rank.
                  </div>
                ) : (
                  availableItems.map((shopItem) => {
                    const canBuy = canBuyItem(shopItem);
                    return (
                      <div
                        key={shopItem.id}
                        className={`bg-stone-900/50 rounded-none p-4 border ${canBuy
                          ? getRarityBorder(shopItem.rarity).replace('border-2', 'border')
                          : 'border-stone-800 opacity-60'
                          }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4
                              className={`font-bold ${getRarityTextColor(shopItem.rarity)}`}
                            >
                              {shopItem.name}
                            </h4>
                            <span className="text-xs text-stone-500">
                              {normalizeTypeLabel(shopItem.type, shopItem)}
                            </span>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-none border ${getRarityBorder(shopItem.rarity).replace('border-2', 'border')} ${getRarityTextColor(shopItem.rarity)}`}
                          >
                            {shopItem.rarity}
                          </span>
                        </div>
                        <p className="text-sm text-stone-400 mb-3">
                          {shopItem.description}
                        </p>
                        {shopItem.effect && (
                          <div className="text-xs text-stone-400 mb-3 space-y-1">
                            {shopItem.effect.attack && (
                              <div>Damage +{formatNumber(shopItem.effect.attack)}</div>
                            )}
                            {shopItem.effect.defense && (
                              <div>Defense +{formatNumber(shopItem.effect.defense)}</div>
                            )}
                            {shopItem.effect.hp && (
                              <div>HP +{formatNumber(shopItem.effect.hp)}</div>
                            )}
                            {shopItem.effect.exp && (
                              <div>Data +{formatNumber(shopItem.effect.exp)}</div>
                            )}
                            {shopItem.effect.spirit && (
                              <div>Perception +{formatNumber(shopItem.effect.spirit)}</div>
                            )}
                            {shopItem.effect.physique && (
                              <div>Endurance +{formatNumber(shopItem.effect.physique)}</div>
                            )}
                            {shopItem.effect.speed && (
                              <div>Agility +{formatNumber(shopItem.effect.speed)}</div>
                            )}
                          </div>
                        )}
                        {shopItem.minRealm && (
                          <div className="text-xs text-stone-500 mb-2">
                            Rank Req: {shopItem.minRealm}
                          </div>
                        )}
                        <div className="mt-4 flex flex-col justify-between space-y-2">
                          {/* Price and description */}
                          <div className="flex flex-col space-y-1">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1 text-amber-400">
                                <Coins size={14} />
                                <span className="font-bold">{formatNumber(shopItem.price)}</span>
                              </div>
                              {buyQuantities[shopItem.id] > 1 && (
                                <div className="text-xs text-stone-400">
                                  Total: {formatNumber(shopItem.price * buyQuantities[shopItem.id])}
                                </div>
                              )}
                            </div>
                            {shopItem.minRealm && (
                              <div className="text-xs text-stone-500 self-end">
                                Rank: {shopItem.minRealm}
                              </div>
                            )}
                          </div>

                          {/* Quantity control and buy button */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1 border border-stone-800 rounded-none bg-stone-900">
                              <button
                                onClick={() =>
                                  setBuyQuantities((prev) => ({
                                    ...prev,
                                    [shopItem.id]: Math.max(
                                      1,
                                      (prev[shopItem.id] || 1) - 1
                                    ),
                                  }))
                                }
                                className="px-2 py-1 text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={buyQuantities[shopItem.id] || 1}
                                onChange={(e) => {
                                  const val = Math.max(
                                    1,
                                    parseInt(e.target.value) || 1
                                  );
                                  setBuyQuantities((prev) => ({
                                    ...prev,
                                    [shopItem.id]: val,
                                  }));
                                }}
                                className="w-12 text-center bg-transparent text-stone-200 border-0 focus:outline-none"
                              />
                              <button
                                onClick={() =>
                                  setBuyQuantities((prev) => ({
                                    ...prev,
                                    [shopItem.id]: (prev[shopItem.id] || 1) + 1,
                                  }))
                                }
                                className="px-2 py-1 text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                              >
                                +
                              </button>
                            </div>
                            <button
                              onClick={() => {
                                const qty = buyQuantities[shopItem.id] || 1;
                                onBuyItem(shopItem, qty);
                                setBuyQuantities((prev) => ({
                                  ...prev,
                                  [shopItem.id]: 1,
                                }));
                              }}
                              disabled={
                                !canBuy ||
                                shopItem.price *
                                (buyQuantities[shopItem.id] || 1) >
                                player.spiritStones
                              }
                              className={`px-3 py-1.5 rounded-none text-sm font-bold transition-all flex-1 min-w-[70px] ${canBuy &&
                                shopItem.price *
                                (buyQuantities[shopItem.id] || 1) <=
                                player.spiritStones
                                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/50 active:scale-95'
                                : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                                }`}
                              title={
                                !canBuy
                                  ? shop.reputationRequired && (player.reputation || 0) < shop.reputationRequired
                                    ? 'Low Rep'
                                    : shopItem.minRealm
                                      ? `Needs Rank: ${shopItem.minRealm}`
                                      : 'Cannot Buy'
                                  : shopItem.price * (buyQuantities[shopItem.id] || 1) > player.spiritStones
                                    ? 'Low Caps'
                                    : ''
                              }
                            >
                              PURCHASE
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-stone-500 uppercase font-bold tracking-widest">
                    CAPS BALANCE:{' '}
                    <span className="text-amber-400">
                      {player.spiritStones}
                    </span>
                  </span>
                  <span className="text-[10px] text-stone-500 uppercase font-bold tracking-widest">
                    SELECTED: <span className="text-amber-400">{selectedItems.size}</span>
                  </span>
                </div>
                {/* Batch operation bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSelectAll}
                      className="px-3 py-1 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded-none text-[10px] font-bold uppercase tracking-widest border border-stone-800 transition-all"
                    >
                      {selectedItems.size === sellableItems.length
                        ? 'DESELECT ALL'
                        : 'SELECT ALL'}
                    </button>
                  </div>
                  <button
                    onClick={handleBatchSell}
                    disabled={selectedItems.size === 0}
                    className={`px-4 py-1.5 rounded-none text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${selectedItems.size > 0
                      ? 'bg-red-900/20 hover:bg-red-900/30 text-red-400 border border-red-900/50 active:scale-95'
                      : 'bg-stone-900 text-stone-600 cursor-not-allowed border border-stone-800'
                      }`}
                  >
                    <Trash size={12} />
                    BULK SELL ({selectedItems.size})
                  </button>
                </div>
                {/* Filters */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-stone-500 text-[10px] uppercase font-bold tracking-widest">
                      <Filter size={12} />
                      <span>Type:</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedTypeFilter('all');
                        setSelectedItems(new Set());
                      }}
                      className={`px-3 py-1 rounded-none text-[10px] font-bold uppercase tracking-widest transition-all ${selectedTypeFilter === 'all'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                        : 'bg-stone-900 text-stone-500 hover:text-stone-300 border border-stone-800'
                        }`}
                    >
                      All
                    </button>
                    {availableTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setSelectedTypeFilter(type);
                          setSelectedItems(new Set());
                        }}
                        className={`px-3 py-1 rounded-none text-[10px] font-bold uppercase tracking-widest transition-all ${selectedTypeFilter === type
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                          : 'bg-stone-900 text-stone-500 hover:text-stone-300 border border-stone-800'
                          }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-stone-500 text-[10px] uppercase font-bold tracking-widest">
                      <Box size={12} />
                      <span>Rarity:</span>
                    </div>
                    {(['all', 'Common', 'Rare', 'Legendary', 'Mythic'] as const).map(
                      (rarity) => (
                        <button
                          key={rarity}
                          onClick={() => {
                            setSelectedRarity(rarity as any);
                            setSelectedItems(new Set());
                          }}
                          className={`px-3 py-1 rounded-none text-[10px] font-bold uppercase tracking-widest transition-all ${selectedRarity === rarity
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                            : 'bg-stone-900 text-stone-500 hover:text-stone-300 border border-stone-800'
                            }`}
                        >
                          {rarity === 'all' ? 'All' : rarity}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
              {sellableItems.length === 0 ? (
                <div className="text-center text-stone-500 py-10">
                  <Package size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Nothing to sell.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {sellableItems.map((item) => {
                    const shopItem = shop.items.find((si) => si.name === item.name);
                    const sellPrice = shopItem?.sellPrice || calculateItemSellPrice(item);
                    const rarity = item.rarity || 'Common';
                    const isSelected = selectedItems.has(item.id);

                    return (
                      <div
                        key={item.id}
                        className={`bg-stone-900/50 rounded-none p-4 border cursor-pointer transition-all ${isSelected
                          ? 'bg-amber-500/10 border-amber-500'
                          : getRarityBorder(rarity).replace('border-2', 'border')
                          }`}
                        onClick={() => handleToggleItem(item.id)}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <div className={`mt-1 w-4 h-4 border flex items-center justify-center ${isSelected ? 'bg-amber-500 border-amber-500' : 'border-stone-600'}`}>
                            {isSelected && <X size={12} className="text-ink-950" />}
                          </div>
                          <div className="flex-1">
                            <h4 className={`font-bold ${getRarityTextColor(rarity)}`}>
                              {item.name}
                              {item.level && item.level > 0 && (
                                <span className="text-xs text-stone-500 ml-1">+{item.level}</span>
                              )}
                            </h4>
                            <span className="text-xs text-stone-500">
                              {normalizeTypeLabel(item.type, item)}
                              {item.quantity > 1 && ` x${item.quantity}`}
                            </span>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-none border ${getRarityBorder(rarity).replace('border-2', 'border')} ${getRarityTextColor(rarity)}`}>
                            {rarity}
                          </span>
                        </div>
                        <p className="text-sm text-stone-400 mb-3 line-clamp-2">
                          {item.description}
                        </p>
                        {item.effect && (
                          <div className="text-xs text-stone-400 mb-3 space-y-1">
                            {item.effect.attack && <div>Damage +{formatNumber(item.effect.attack)}</div>}
                            {item.effect.defense && <div>Defense +{formatNumber(item.effect.defense)}</div>}
                            {item.effect.hp && <div>HP +{formatNumber(item.effect.hp)}</div>}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-1 text-amber-400">
                            <Coins size={14} />
                            <span className="font-bold">{formatNumber(sellPrice * (item.quantity || 1))}</span>
                          </div>
                            <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSellItem(item, item.quantity);
                            }}
                            className="px-3 py-1 text-xs bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 transition-colors rounded-none font-bold"
                          >
                            SELL
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(ShopModal);
