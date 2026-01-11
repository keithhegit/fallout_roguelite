import React, { useState, useMemo } from 'react';
import { X, Zap, Filter } from 'lucide-react';
import { Item, ItemType, ItemRarity, EquipmentSlot } from '../types';
import { ASSETS } from '../constants/assets';
import { getRarityTextColor, getRarityBorder } from '../utils/rarityUtils';
import { normalizeTypeLabel } from '../utils/itemUtils';
import { showConfirm } from '../utils/toastUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  inventory: Item[];
  equippedItems: Partial<Record<EquipmentSlot, string>>;
  onUseItems: (itemIds: string[]) => void;
}

type ItemCategory = 'all' | 'pill' | 'consumable';
type RarityFilter = 'all' | ItemRarity;

const BatchUseModal: React.FC<Props> = ({
  isOpen,
  onClose,
  inventory,
  equippedItems,
  onUseItems,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory>('all');
  const [selectedRarity, setSelectedRarity] = useState<RarityFilter>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [itemQuantities, setItemQuantities] = useState<Map<string, number>>(new Map());

  // Determine item category
  const getItemCategory = (item: Item): ItemCategory => {
    if (item.type === ItemType.Pill) {
      return 'pill';
    }
    return 'consumable';
  };

  // Determine if item is usable
  const isUsable = (item: Item): boolean => {
    // Equipment cannot be used
    if (item.isEquippable) return false;
    // Material packs and sect vault keys can be used
    const isMaterialPack = item.name.includes('Material Pack') && item.type === ItemType.Material;
    const isTreasureVaultKey = item.name === 'Sect Vault Key' && item.type === ItemType.Material;
    if (isMaterialPack || isTreasureVaultKey) return true;
    // Other materials cannot be used (unless they have an effect)
    if (item.type === ItemType.Material && !item.effect) return false;
    // Items with effect or Recipe type can be used
    return !!(item.effect || item.type === ItemType.Recipe);
  };

  // Filter items
  const filteredItems = useMemo(() => {
    const filtered = inventory.filter((item) => {
      // Only show usable items
      if (!isUsable(item)) return false;

      // Exclude equipped items
      const isEquipped = Object.values(equippedItems).includes(item.id);
      if (isEquipped) return false;

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
  }, [inventory, equippedItems, selectedCategory, selectedRarity]);

  const handleToggleItem = (itemId: string) => {
    const isSelected = selectedItems.has(itemId);

    if (isSelected) {
      // Deselect
      setSelectedItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
      setItemQuantities((prev) => {
        const newQty = new Map(prev);
        newQty.delete(itemId);
        return newQty;
      });
    } else {
      // Select
      setSelectedItems((prev) => {
        const newSet = new Set(prev);
        newSet.add(itemId);
        return newSet;
      });
      setItemQuantities((prev) => {
        const newQty = new Map(prev);
        newQty.set(itemId, 1); // 默认使用1个
        return newQty;
      });
    }
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    const item = inventory.find((i) => i.id === itemId);
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
        newQty.set(item.id, 1);
      });
      setSelectedItems(newSet);
      setItemQuantities(newQty);
    }
  };

  const handleUse = () => {
    if (selectedItems.size === 0) return;

    // 构建使用列表（考虑数量）
    const itemsToUse: string[] = [];
    selectedItems.forEach((itemId) => {
      const quantity = itemQuantities.get(itemId) || 1;
      for (let i = 0; i < quantity; i++) {
        itemsToUse.push(itemId);
      }
    });

    const totalCount = itemsToUse.length;
    const itemNames = Array.from(selectedItems)
      .map((id) => {
        const item = inventory.find((i) => i.id === id);
        const qty = itemQuantities.get(id) || 1;
        return item ? `${item.name} x${qty}` : '';
      })
      .filter(Boolean)
      .join('、');

    showConfirm(
      `确定要使用选中的 ${totalCount} 件物品吗？\n${itemNames}\n\n提示：物品将逐个使用，某些物品的效果可能会叠加。`,
      '确认使用',
      () => {
        onUseItems(itemsToUse);
        setSelectedItems(new Set());
        setItemQuantities(new Map());
        onClose();
      }
    );
  };

  if (!isOpen) return null;

  const totalSelectedQuantity = Array.from(selectedItems).reduce((sum, itemId) => {
    return sum + (itemQuantities.get(itemId) || 1);
  }, 0);

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-ink-950 w-full max-w-4xl max-h-[90vh] md:rounded-none border border-stone-800 shadow-2xl flex flex-col overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 背景纹理层 */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
        {/* CRT 扫描线效果 */}
        <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none z-50"></div>

        <div className="p-4 border-b border-stone-800 flex justify-between items-center bg-stone-950 md:rounded-none z-10">
          <h3 className="text-xl font-bold text-amber-400 flex items-center gap-2 uppercase tracking-tighter">
            <Zap size={20} /> Bulk Consumption
          </h3>
          <button onClick={onClose} className="text-stone-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="modal-scroll-container modal-scroll-content p-4 z-10">
          {/* 筛选器 */}
          <div className="mb-6 space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-stone-500 text-[10px] font-bold uppercase tracking-widest">
                <Filter size={14} />
                <span>Category:</span>
              </div>
              {(['all', 'pill', 'consumable'] as ItemCategory[]).map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category);
                    setSelectedItems(new Set());
                    setItemQuantities(new Map());
                  }}
                  className={`px-3 py-1 rounded-none text-[10px] font-bold uppercase tracking-widest border transition-all ${
                    selectedCategory === category
                      ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                      : 'bg-stone-900 border-stone-800 text-stone-500 hover:text-stone-300 hover:bg-stone-800'
                  }`}
                >
                  {category === 'all'
                    ? 'All'
                    : category === 'pill'
                      ? 'Meds'
                      : 'Provs'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-stone-500 text-[10px] font-bold uppercase tracking-widest">
                <Filter size={14} />
                <span>Rarity:</span>
              </div>
              {(['all', '普通', '稀有', '传说', '仙品'] as RarityFilter[]).map(
                (rarity) => (
                  <button
                    key={rarity}
                    onClick={() => {
                      setSelectedRarity(rarity);
                      setSelectedItems(new Set());
                      setItemQuantities(new Map());
                    }}
                    className={`px-3 py-1 rounded-none text-[10px] font-bold uppercase tracking-widest border transition-all ${
                      selectedRarity === rarity
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                        : 'bg-stone-900 border-stone-800 text-stone-500 hover:text-stone-300 hover:bg-stone-800'
                    }`}
                  >
                    {rarity === 'all' ? 'All' : rarity}
                  </button>
                )
              )}
            </div>
          </div>

          {/* 操作栏 */}
          <div className="mb-6 flex items-center justify-between flex-wrap gap-4 bg-stone-900/50 p-4 border border-stone-800">
            <div className="flex items-center gap-4 flex-wrap">
              <button
                onClick={handleSelectAll}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded-none text-[10px] font-bold uppercase tracking-widest border border-stone-800 transition-all active:scale-95"
              >
                {selectedItems.size === filteredItems.length
                  ? 'Deselect All'
                  : 'Select Current'}
              </button>
              <div className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">
                Selected: <span className="text-stone-300">{selectedItems.size} / {filteredItems.length}</span> (<span className="text-amber-400">{totalSelectedQuantity} Units</span>)
              </div>
            </div>
            <button
              onClick={handleUse}
              disabled={selectedItems.size === 0}
              className={`px-6 py-2 rounded-none text-xs font-bold uppercase tracking-widest transition-all ${
                selectedItems.size > 0
                  ? 'bg-green-900/20 hover:bg-green-900/30 text-green-400 border border-green-900/50 active:scale-95'
                  : 'bg-stone-900 text-stone-600 cursor-not-allowed border border-stone-800'
              }`}
            >
              Consume Selected ({totalSelectedQuantity})
            </button>
          </div>

          {/* 物品列表 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredItems.length === 0 ? (
              <div className="col-span-full text-center text-stone-600 py-12 font-bold uppercase tracking-widest text-sm border border-dashed border-stone-800">
                No consumable items.
              </div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = selectedItems.has(item.id);
                const rarity = item.rarity || '普通';
                const quantity = itemQuantities.get(item.id) || 1;

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-none border flex flex-col gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-green-950/20 border-green-800 shadow-lg'
                        : 'bg-stone-950/50 hover:bg-stone-900 border-stone-800'
                    }`}
                    onClick={() => handleToggleItem(item.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`mt-1 w-4 h-4 border border-stone-700 flex items-center justify-center transition-colors ${isSelected ? 'bg-amber-500 border-amber-500' : 'bg-stone-950'}`}>
                        {isSelected && <div className="w-2 h-2 bg-stone-950"></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4
                            className={`font-bold text-sm uppercase tracking-tight ${getRarityTextColor(rarity)}`}
                          >
                            {item.name}
                          </h4>
                          <span className="text-[10px] bg-stone-900 text-stone-400 px-2 py-0.5 rounded-none border border-stone-800 font-bold uppercase">
                            Own: {item.quantity}
                          </span>
                        </div>
                        <div className="flex gap-2 mb-2">
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-none border font-bold uppercase tracking-widest ${getRarityBorder(rarity).replace('border-2', 'border')}`}
                          >
                            {rarity}
                          </span>
                          <span className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">
                            {normalizeTypeLabel(item.type, item)}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed italic">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="flex items-center gap-3 pl-8 pt-2 border-t border-stone-800/50" onClick={(e) => e.stopPropagation()}>
                        <label className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Quantity:</label>
                        <div className="flex items-center gap-2 bg-stone-950 border border-stone-800 p-1">
                          <input
                            type="number"
                            min={1}
                            max={item.quantity}
                            value={quantity}
                            onChange={(e) =>
                              handleQuantityChange(item.id, parseInt(e.target.value) || 1)
                            }
                            className="w-16 px-2 py-1 bg-transparent text-sm text-stone-200 focus:outline-none font-bold text-center"
                          />
                        </div>
                        <span className="text-[10px] text-stone-600 font-bold">
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

export default BatchUseModal;
