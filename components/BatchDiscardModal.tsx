import React, { useState, useMemo } from 'react';
import { X, Trash2, Filter } from 'lucide-react';
import { Item, ItemType, ItemRarity, EquipmentSlot } from '../types';
import { getRarityTextColor, getRarityBorder } from '../utils/rarityUtils';
import { normalizeTypeLabel } from '../utils/itemUtils';
import { showConfirm } from '../utils/toastUtils';
import { ASSETS } from '../constants/assets';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  inventory: Item[];
  equippedItems: Partial<Record<EquipmentSlot, string>>;
  onDiscardItems: (itemIds: string[]) => void;
}

type ItemCategory = 'all' | 'equipment' | 'pill' | 'consumable';
type RarityFilter = 'all' | ItemRarity;

const BatchDiscardModal: React.FC<Props> = ({
  isOpen,
  onClose,
  inventory,
  equippedItems,
  onDiscardItems,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory>('all');
  const [selectedRarity, setSelectedRarity] = useState<RarityFilter>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // 判断物品分类
  const getItemCategory = (item: Item): ItemCategory => {
    if (
      item.isEquippable ||
      item.type === ItemType.Weapon ||
      item.type === ItemType.Armor ||
      item.type === ItemType.Artifact ||
      item.type === ItemType.Accessory ||
      item.type === ItemType.Ring
    ) {
      return 'equipment';
    }
    if (item.type === ItemType.Pill) {
      return 'pill';
    }
    return 'consumable';
  };

  // 过滤物品
  const filteredItems = useMemo(() => {
    const filtered = inventory.filter((item) => {
      // 排除已装备的物品
      const isEquipped = Object.values(equippedItems).includes(item.id);
      if (isEquipped) return false;

      // 按分类过滤
      if (selectedCategory !== 'all') {
        const category = getItemCategory(item);
        if (category !== selectedCategory) return false;
      }

      // 按品质过滤
      if (selectedRarity !== 'all') {
        if (item.rarity !== selectedRarity) return false;
      }

      return true;
    });

    return filtered;
  }, [inventory, equippedItems, selectedCategory, selectedRarity]);

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
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map((item) => item.id)));
    }
  };

  const handleDiscard = () => {
    if (selectedItems.size === 0) return;
    showConfirm(
      `确定要丢弃选中的 ${selectedItems.size} 件物品吗？此操作不可撤销！`,
      '确认丢弃',
      () => {
        onDiscardItems(Array.from(selectedItems));
        setSelectedItems(new Set());
        onClose();
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4 crt-screen"
      onClick={onClose}
    >
      <div
        className="bg-ink-950 w-full max-w-4xl max-h-[90vh] rounded-none border border-stone-800 shadow-2xl flex flex-col overflow-hidden relative font-mono"
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
            <div className="w-12 h-12 bg-stone-900 border border-stone-800 flex items-center justify-center text-red-500/80 shadow-inner relative group overflow-hidden">
              <div 
                className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
                style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
              />
              <Trash2 size={24} className="relative z-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-stone-200 tracking-[0.2em] uppercase">
                BATCH_PURGE_PROTOCOL
              </h3>
              <p className="text-[10px] text-stone-600 tracking-widest uppercase">
                SYSTEM_CLEANUP // STORAGE_OPTIMIZATION
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center text-stone-600 hover:text-red-500 hover:bg-red-950/10 transition-all border border-stone-800 hover:border-red-900/50 relative group overflow-hidden"
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
                {(
                  ['all', 'equipment', 'pill', 'consumable'] as ItemCategory[]
                ).map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category);
                      setSelectedItems(new Set());
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
                        : category === 'equipment'
                          ? 'GEAR'
                          : category === 'pill'
                            ? 'NEURAL'
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
            <div className="flex items-center gap-4 relative z-10">
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
                    : 'SELECT_ALL_SIGNALS'}
                </span>
              </button>
              <div className="flex flex-col">
                <span className="text-[10px] text-stone-600 uppercase tracking-widest font-bold">
                  OBJECTS_IDENTIFIED:
                </span>
                <span className="text-xs text-emerald-600 font-mono">
                  {selectedItems.size} / {filteredItems.length}
                </span>
              </div>
            </div>
            <button
              onClick={handleDiscard}
              disabled={selectedItems.size === 0}
              className={`px-6 py-2 rounded-none text-xs font-bold transition-all uppercase tracking-[0.2em] border relative group overflow-hidden ${
                selectedItems.size > 0
                  ? 'bg-red-950/20 hover:bg-red-950/40 text-red-500 border-red-900/50 hover:border-red-500'
                  : 'bg-stone-950 text-stone-700 cursor-not-allowed border-stone-900'
              }`}
            >
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] transition-opacity"
                style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
              />
              <span className="relative z-10">EXECUTE_PURGE ({selectedItems.size})</span>
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
                <Trash2 size={40} className="opacity-20" />
                <div>NO_OBJECTS_DETECTED_FOR_PURGE</div>
              </div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = selectedItems.has(item.id);
                const rarity = item.rarity || '普通';

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-none border flex items-start gap-4 cursor-pointer transition-all relative overflow-hidden group ${
                      isSelected
                        ? 'bg-red-950/10 border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.1)]'
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
                    
                    <div className={`w-5 h-5 border mt-0.5 flex items-center justify-center shrink-0 transition-all relative z-10 ${
                      isSelected ? 'border-red-500 bg-red-950/30' : 'border-stone-700 bg-stone-950'
                    }`}>
                      {isSelected && <div className="w-2 h-2 bg-red-500 animate-pulse"></div>}
                    </div>

                    <div className="flex-1 min-w-0 relative z-10">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4
                          className={`font-bold text-[13px] uppercase tracking-wider truncate ${getRarityTextColor(rarity)}`}
                        >
                          {item.name}
                        </h4>
                        <span className="text-[10px] bg-stone-950 text-stone-500 px-1.5 py-0.5 rounded-none border border-stone-900 shrink-0 font-mono">
                          x{item.quantity}
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
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchDiscardModal;
