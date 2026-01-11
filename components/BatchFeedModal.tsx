import React, { useState, useMemo } from 'react';
import { X, Filter, Heart } from 'lucide-react';
import { Item, ItemType, ItemRarity, PlayerStats } from '../types';
import { ASSETS } from '../constants/assets';
import { getRarityTextColor, getRarityBorder } from '../utils/rarityUtils';
import { normalizeTypeLabel } from '../utils/itemUtils';
import { showInfo } from '../utils/toastUtils';


interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  petId: string;
  onFeedItems: (petId: string, itemIds: string[]) => void;
}

type ItemCategory = 'all' | 'pill' | 'consumable' | 'equipment';
type RarityFilter = 'all' | ItemRarity;

const BatchFeedModal: React.FC<Props> = ({
  isOpen,
  onClose,
  player,
  petId,
  onFeedItems,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory>('all');
  const [selectedRarity, setSelectedRarity] = useState<RarityFilter>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [itemQuantities, setItemQuantities] = useState<Map<string, number>>(new Map());

  const pet = player.pets.find((p) => p.id === petId);

  // Determine item category
  const getItemCategory = (item: Item): ItemCategory => {
    if (item.type === ItemType.Pill) {
      return 'pill';
    }
    if (item.isEquippable ||
      item.type === ItemType.Weapon ||
      item.type === ItemType.Armor ||
      item.type === ItemType.Accessory ||
      item.type === ItemType.Ring ||
      item.type === ItemType.Artifact) {
      return 'equipment';
    }
    return 'consumable';
  };

  // Feedable items (all unequipped items)
  const equippedItemIds = new Set(Object.values(player.equippedItems).filter(Boolean));

  // All feedable items (regardless of filter)
  const allFeedableItems = useMemo(() => {
    return player.inventory.filter((item) => {
      // Only show feedable items (unequipped and quantity > 0)
      if (equippedItemIds.has(item.id)) return false;
      if (item.quantity <= 0) return false;
      return true;
    });
  }, [player.inventory, equippedItemIds]);

  // Filter items
  const filteredItems = useMemo(() => {
    let filtered = allFeedableItems.filter((item) => {
      // Filter by category
      if (selectedCategory !== 'all') {
        const category = getItemCategory(item);
        if (category !== selectedCategory) return false;
      }

      // Filter by rarity
      if (selectedRarity !== 'all') {
        if (item.rarity !== selectedRarity) return false;
      }

      return true;
    });

    return filtered;
  }, [allFeedableItems, selectedCategory, selectedRarity]);

  const handleToggleItem = (itemId: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
        setItemQuantities((prevQty) => {
          const newQty = new Map(prevQty);
          newQty.delete(itemId);
          return newQty;
        });
      } else {
        newSet.add(itemId);
        const item = player.inventory.find((i) => i.id === itemId);
        if (item) {
          setItemQuantities((prevQty) => {
            const newQty = new Map(prevQty);
            newQty.set(itemId, 1); // Default feed 1
            return newQty;
          });
        }
      }
      return newSet;
    });
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    const item = player.inventory.find((i) => i.id === itemId);
    if (!item) return;

    const maxQuantity = item.quantity;
    const validQuantity = Math.max(1, Math.min(quantity, maxQuantity));

    setItemQuantities((prev) => {
      const newQty = new Map(prev);
      newQty.set(itemId, validQuantity);
      return newQty;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
      setItemQuantities(new Map());
    } else {
      const newSet = new Set(filteredItems.map((item) => item.id));
      const newQty = new Map<string, number>();
      filteredItems.forEach((item) => {
        // 选中时设置为物品的全部数量
        newQty.set(item.id, item.quantity);
      });
      setSelectedItems(newSet);
      setItemQuantities(newQty);
    }
  };

  // 喂养全部物品（所有可喂养的物品，使用全部数量）
  const handleFeedAll = () => {
    if (allFeedableItems.length === 0 || !pet) return;

    // 构建喂养列表（使用所有数量）
    const itemsToFeed: string[] = [];
    allFeedableItems.forEach((item) => {
      for (let i = 0; i < item.quantity; i++) {
        itemsToFeed.push(item.id);
      }
    });

    const totalCount = itemsToFeed.length;
    const totalItems = allFeedableItems.length;

    showInfo(
      `Are you sure you want to process all ${totalItems} types of materials (Total ${totalCount} items) to feed [${pet.name}]?\nThis will consume all processable materials!`
      , 'Bulk Processing', () => {
        onFeedItems(petId, itemsToFeed);
        setSelectedItems(new Set());
        setItemQuantities(new Map());
        onClose();
      })

  };

  const handleFeed = () => {
    if (selectedItems.size === 0 || !pet) return;

    // 构建喂养列表（使用用户设置的数量）
    const itemsToFeed: string[] = [];
    const itemDetails: string[] = [];
    selectedItems.forEach((itemId) => {
      const item = player.inventory.find((i) => i.id === itemId);
      if (item) {
        const quantity = itemQuantities.get(itemId) || 1;
        // 使用用户设置的数量
        for (let i = 0; i < quantity; i++) {
          itemsToFeed.push(itemId);
        }
        itemDetails.push(`${item.name} x${quantity}`);
      }
    });

    const totalCount = itemsToFeed.length;
    const itemNames = itemDetails.join('、');

    showInfo(
      `Are you sure you want to process ${selectedItems.size} types of materials (Total ${totalCount} items) to feed [${pet.name}]?\n\n${itemNames}`
      , 'Bulk Processing', () => {
        onFeedItems(petId, itemsToFeed);
        setSelectedItems(new Set());
        setItemQuantities(new Map());
        onClose();
      })
  };

  if (!isOpen || !pet) return null;

  const totalSelectedQuantity = Array.from(selectedItems).reduce((sum, itemId) => {
    // 使用用户设置的数量
    return sum + (itemQuantities.get(itemId) || 1);
  }, 0);

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4 crt-screen"
      onClick={onClose}
    >
      <div
        className="bg-stone-950 w-full max-w-4xl max-h-[90vh] rounded-none border border-amber-500/30 shadow-2xl flex flex-col overflow-hidden relative font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 背景纹理层 */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03] z-0"
          style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
        />

        {/* CRT Visual Layers */}
        <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none z-50"></div>
        <div className="crt-noise"></div>
        <div className="crt-vignette"></div>

        <div className="p-4 md:p-6 border-b border-stone-800 flex justify-between items-center bg-stone-950/50 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-stone-950 border border-stone-800 flex items-center justify-center text-emerald-500/80 shadow-inner relative group overflow-hidden">
              <div 
                className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
                style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
              />
              <Heart size={24} className="relative z-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-amber-400 tracking-[0.2em] uppercase">
                PET_NOURISHMENT_PROTOCOL
              </h3>
              <p className="text-[10px] text-stone-600 tracking-widest uppercase">
                FEEDING: {pet.name} {'//'} RESOURCE_ALLOCATION
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center text-stone-600 hover:text-emerald-500 hover:bg-emerald-950/10 transition-all border border-stone-800 hover:border-emerald-900/50 relative group overflow-hidden"
            aria-label="DISCONNECT"
          >
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] transition-opacity"
              style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
            />
            <X size={24} className="relative z-10" />
          </button>
        </div>

        <div className="p-4 md:p-6 flex-1 overflow-y-auto relative z-10 custom-scrollbar">
          {/* 筛选器 */}
          <div className="mb-6 space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-stone-500 text-[10px] uppercase tracking-widest font-bold">
                <Filter size={14} />
                <span>CATEGORY_FILTER:</span>
              </div>
              <div className="flex gap-1 flex-wrap">
                {(['all', 'pill', 'consumable', 'equipment'] as ItemCategory[]).map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category);
                      setSelectedItems(new Set());
                      setItemQuantities(new Map());
                    }}
                    className={`px-3 py-1.5 rounded-none text-[10px] border transition-all uppercase tracking-widest relative group overflow-hidden ${
                      selectedCategory === category
                        ? 'bg-emerald-950/20 border-emerald-600 text-emerald-500'
                        : 'bg-stone-950 border-stone-800 text-stone-600 hover:bg-stone-900 hover:text-stone-400'
                    }`}
                  >
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] transition-opacity"
                      style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
                    />
                    <span className="relative z-10">
                      {category === 'all'
                        ? 'ALL'
                        : category === 'pill'
                          ? 'MEDS'
                          : category === 'equipment'
                            ? 'GEAR'
                            : 'SUPPLY'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-stone-500 text-[10px] uppercase tracking-widest font-bold">
                <Filter size={14} />
                <span>SIGNAL_STRENGTH:</span>
              </div>
              <div className="flex gap-1 flex-wrap">
                {(['all', '普通', '稀有', '传说', '仙品'] as RarityFilter[]).map(
                  (rarity) => (
                    <button
                      key={rarity}
                      onClick={() => {
                        setSelectedRarity(rarity);
                        setSelectedItems(new Set());
                        setItemQuantities(new Map());
                      }}
                      className={`px-3 py-1.5 rounded-none text-[10px] border transition-all uppercase tracking-widest relative group overflow-hidden ${
                        selectedRarity === rarity
                          ? 'bg-emerald-950/20 border-emerald-600 text-emerald-500'
                          : 'bg-stone-950 border-stone-800 text-stone-600 hover:bg-stone-900 hover:text-stone-400'
                      }`}
                    >
                      <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] transition-opacity"
                        style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
                      />
                      <span className="relative z-10">
                        {rarity === 'all' 
                          ? 'ALL_SIGNALS' 
                          : rarity === '普通' ? 'COMMON' 
                          : rarity === '稀有' ? 'RARE' 
                          : rarity === '传说' ? 'LEGENDARY' 
                          : 'DIVINE'}
                      </span>
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* 操作栏 */}
          <div className="mb-6 flex items-center justify-between p-4 bg-stone-950/50 border border-stone-800 relative group overflow-hidden">
            <div 
              className="absolute inset-0 opacity-[0.02] pointer-events-none"
              style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
            />
            <div className="flex items-center gap-4 relative z-10 flex-wrap">
              <button
                onClick={handleSelectAll}
                className="px-4 py-2 bg-stone-950 hover:bg-stone-900 text-stone-400 hover:text-emerald-500 rounded-none text-[10px] border border-stone-800 transition-all uppercase tracking-widest relative group overflow-hidden"
              >
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] transition-opacity"
                  style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
                />
                <span className="relative z-10">
                  {selectedItems.size === filteredItems.length
                    ? 'DESELECT_ALL'
                    : 'SELECT_CURRENT'}
                </span>
              </button>
              <button
                onClick={handleFeedAll}
                className="px-4 py-2 bg-emerald-950/10 hover:bg-emerald-950/20 text-emerald-500/80 hover:text-emerald-500 rounded-none text-[10px] border border-emerald-900/50 hover:border-emerald-500 transition-all uppercase tracking-widest relative group overflow-hidden"
                title="Process all processable items (Uses total quantity)"
              >
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] transition-opacity"
                  style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
                />
                <span className="relative z-10">PROCESS_ALL ({allFeedableItems.reduce((sum, item) => sum + item.quantity, 0)})</span>
              </button>
              <div className="flex flex-col">
                <span className="text-[10px] text-stone-600 uppercase tracking-widest font-bold">
                  RESOURCES_SELECTED:
                </span>
                <span className="text-xs text-emerald-600 font-mono">
                  {selectedItems.size} TYPES / {totalSelectedQuantity} UNITS
                </span>
              </div>
            </div>
            <button
              onClick={handleFeed}
              disabled={selectedItems.size === 0}
              className={`px-6 py-2 rounded-none text-xs font-bold transition-all uppercase tracking-[0.2em] border relative group overflow-hidden ${
                selectedItems.size > 0
                  ? 'bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-500 border-emerald-900/50 hover:border-emerald-500'
                  : 'bg-stone-950 text-stone-700 cursor-not-allowed border-stone-900'
              }`}
            >
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] transition-opacity"
                style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
              />
              <span className="relative z-10">EXECUTE_FEED ({totalSelectedQuantity})</span>
            </button>
          </div>

          {/* 物品列表 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredItems.length === 0 ? (
              <div className="col-span-full text-center text-stone-700 py-20 font-mono border border-dashed border-stone-800/30 uppercase tracking-[0.3em] flex flex-col items-center gap-4 relative">
                <div 
                  className="absolute inset-0 opacity-[0.01] pointer-events-none"
                  style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
                />
                <Heart size={40} className="opacity-20" />
                <div>NO_PROCESSABLE_OBJECTS_DETECTED</div>
              </div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = selectedItems.has(item.id);
                const rarity = item.rarity || '普通';

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-none border flex flex-col gap-3 transition-all cursor-pointer relative overflow-hidden group ${
                      isSelected
                        ? 'bg-emerald-950/10 border-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                        : 'bg-stone-950/40 hover:bg-stone-900 border-stone-800'
                    }`}
                    onClick={() => handleToggleItem(item.id)}
                  >
                    {/* Item Background Texture Layer */}
                    <div 
                      className={`absolute inset-0 pointer-events-none transition-opacity ${isSelected ? 'opacity-[0.05]' : 'opacity-0 group-hover:opacity-[0.02]'}`}
                      style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
                    />
                    
                    {/* Item Background Scanline Effect */}
                    <div className="absolute inset-0 bg-scanlines opacity-[0.02] pointer-events-none"></div>

                    <div className="flex items-start gap-4 relative z-10">
                      <div className={`mt-1 w-5 h-5 border flex items-center justify-center shrink-0 transition-all ${
                        isSelected ? 'border-emerald-500 bg-emerald-950/30' : 'border-stone-700 bg-stone-950'
                      }`}>
                        {isSelected && <div className="w-2 h-2 bg-emerald-500 animate-pulse"></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4
                            className={`font-bold text-[13px] uppercase tracking-wider truncate ${getRarityTextColor(rarity)}`}
                          >
                            {item.name}
                          </h4>
                          <span className="text-[10px] bg-stone-950 text-stone-500 px-1.5 py-0.5 rounded-none border border-stone-900 shrink-0 font-mono">
                            OWN: {item.quantity}
                          </span>
                        </div>
                        <div className="flex gap-2 mb-2">
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-none border uppercase font-bold tracking-widest ${getRarityBorder(rarity)}`}
                          >
                            {rarity === '普通' ? 'COMMON' : rarity === '稀有' ? 'RARE' : rarity === '传说' ? 'LEGENDARY' : 'DIVINE'}
                          </span>
                          <span className="text-[10px] text-stone-600 uppercase tracking-widest font-mono">
                            {normalizeTypeLabel(item.type, item)}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity font-mono italic">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="flex items-center gap-3 pl-9 pt-2 border-t border-stone-800/50 relative z-10">
                        <label className="text-[10px] text-stone-600 uppercase tracking-widest font-bold">QUANTITY:</label>
                        <div className="flex items-center gap-2 bg-stone-950 border border-stone-800 p-1">
                          <input
                            type="number"
                            min={1}
                            max={item.quantity}
                            value={itemQuantities.get(item.id) || ''}
                            onChange={(e) => {
                              const inputValue = e.target.value;
                              if (inputValue === '') {
                                setItemQuantities((prev) => {
                                  const newQty = new Map(prev);
                                  newQty.delete(item.id);
                                  return newQty;
                                });
                              } else {
                                const newValue = parseInt(inputValue, 10);
                                if (!isNaN(newValue)) {
                                  handleQuantityChange(item.id, newValue);
                                }
                              }
                            }}
                            onBlur={(e) => {
                              const inputValue = e.target.value;
                              if (inputValue === '' || isNaN(parseInt(inputValue, 10))) {
                                handleQuantityChange(item.id, 1);
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-16 px-2 py-1 bg-transparent text-sm text-emerald-500 focus:outline-none font-bold text-center font-mono"
                          />
                        </div>
                        <span className="text-[10px] text-stone-600 font-mono">
                          / {item.quantity}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchFeedModal;
