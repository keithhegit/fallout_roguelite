/**
 * Equipment Template System
 * Extracts all equippable items from item templates.
 */

import { ItemType, ItemRarity, EquipmentSlot } from '../types';
import { ITEM_TEMPLATES } from './itemTemplates';

/**
 * Equipment template interface
 */
export interface EquipmentTemplate {
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  slot: EquipmentSlot;
  effect?: {
    attack?: number;
    defense?: number;
    hp?: number;
    exp?: number;
    spirit?: number;
    physique?: number;
    speed?: number;
    lifespan?: number;
  };
  description?: string;
}

/**
 * Equipment template list (extracts all equippable items from item templates)
 */
export const EQUIPMENT_TEMPLATES: EquipmentTemplate[] = ITEM_TEMPLATES.filter(
  (item) => item.isEquippable && item.equipmentSlot
).map((item) => ({
  name: item.name,
  type: item.type === '材料' ? ItemType.Material : item.type,
  rarity: item.rarity || 'Common',
  slot: item.equipmentSlot!,
  effect: item.effect,
  description: item.description,
}));
