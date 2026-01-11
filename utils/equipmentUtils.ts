/**
 * Equipment related utility functions
 * Unify management of equipment slot lookup, equipment status check, etc.
 */

import { Item, ItemType, EquipmentSlot, PlayerStats } from '../types';

/**
 * Get all available slots for a specified equipment type
 */
export const getEquipmentSlotsByType = (itemType: ItemType): EquipmentSlot[] => {
  switch (itemType) {
    case ItemType.Ring:
      return [
        EquipmentSlot.Ring1,
        EquipmentSlot.Ring2,
        EquipmentSlot.Ring3,
        EquipmentSlot.Ring4,
      ];
    case ItemType.Accessory:
      return [EquipmentSlot.Accessory1, EquipmentSlot.Accessory2];
    case ItemType.Artifact:
      return [EquipmentSlot.Artifact1, EquipmentSlot.Artifact2];
    default:
      return [];
  }
};

/**
 * Find an empty slot for an item to be equipped
 * @param item The item to equip
 * @param equippedItems Map of currently equipped items
 * @returns Available slot, or default slot if no empty slot found (Ring returns Ring1)
 */
export const findEmptyEquipmentSlot = (
  item: Item,
  equippedItems: Partial<Record<EquipmentSlot, string>>
): EquipmentSlot | null => {
  // For Rings, Accessories, Artifacts, even if they have equipmentSlot property, prioritize empty slots
  // Ignore item's equipmentSlot property because multi-slot equipment should prioritize empty slots
  const slots = getEquipmentSlotsByType(item.type as ItemType);
  if (slots.length > 0) {
    // Prioritize finding empty slots (explicitly check for undefined or null to ensure correct empty slot check)
    // Iterate through all possible slots, return the first empty one found
    for (const slot of slots) {
      const equippedItemId = equippedItems[slot];
      // If slot is empty (undefined or not exists), return this empty slot directly
      if (equippedItemId === undefined || equippedItemId === null || equippedItemId === '') {
        return slot;
      }
    }
    // Only return the first slot when all slots are full (for replacing existing equipment)
    return slots[0];
  }

  // Other equipment types (Weapon, Armor, etc.) require equipmentSlot
  if (!item.equipmentSlot) {
    return null;
  }

  // Other equipment types use default slot directly (replace if equipped)
  return item.equipmentSlot;
};

/**
 * Check if item is equipped
 * @param item Item to check
 * @param equippedItems Map of currently equipped items
 * @returns Whether it is equipped
 */
export const isItemEquipped = (
  item: Item,
  equippedItems: Partial<Record<EquipmentSlot, string>>
): boolean => {
  // For Rings, Accessories, Artifacts, even if no equipmentSlot, check all slots of the same type based on type
  const slots = getEquipmentSlotsByType(item.type as ItemType);
  if (slots.length > 0) {
    return slots.some((slot) => equippedItems[slot] === item.id);
  }

  // Other equipment types need equipmentSlot to check
  if (!item.equipmentSlot) {
    return false;
  }

  // Other equipment types check corresponding slot directly
  return equippedItems[item.equipmentSlot] === item.id;
};

/**
 * Find the actual slot where the item is equipped
 * @param item Item to find
 * @param equippedItems Map of currently equipped items
 * @returns Actual equipped slot, or null if not equipped
 */
export const findItemEquippedSlot = (
  item: Item,
  equippedItems: Partial<Record<EquipmentSlot, string>>
): EquipmentSlot | null => {
  // For Rings, Accessories, Artifacts, even if no equipmentSlot, find in all slots of the same type based on type
  const slots = getEquipmentSlotsByType(item.type as ItemType);
  if (slots.length > 0) {
    const equippedSlot = slots.find((slot) => equippedItems[slot] === item.id);
    return equippedSlot || null;
  }

  // Other equipment types need equipmentSlot to find
  if (!item.equipmentSlot) {
    return null;
  }

  // Other equipment types check corresponding slot directly
  return equippedItems[item.equipmentSlot] === item.id ? item.equipmentSlot : null;
};

/**
 * Get equipment slot configuration (for rendering equipment panel)
 */
export const getEquipmentSlotConfig = (): Array<{
  slot: EquipmentSlot;
  label: string;
  icon?: string;
}> => {
  return [
    { slot: EquipmentSlot.Head, label: 'Head' },
    { slot: EquipmentSlot.Shoulder, label: 'Shoulder' },
    { slot: EquipmentSlot.Chest, label: 'Chest' },
    { slot: EquipmentSlot.Gloves, label: 'Gloves' },
    { slot: EquipmentSlot.Legs, label: 'Legs' },
    { slot: EquipmentSlot.Boots, label: 'Boots' },
    { slot: EquipmentSlot.Ring1, label: 'Ring 1' },
    { slot: EquipmentSlot.Ring2, label: 'Ring 2' },
    { slot: EquipmentSlot.Ring3, label: 'Ring 3' },
    { slot: EquipmentSlot.Ring4, label: 'Ring 4' },
    { slot: EquipmentSlot.Accessory1, label: 'Accessory 1' },
    { slot: EquipmentSlot.Accessory2, label: 'Accessory 2' },
    { slot: EquipmentSlot.Artifact1, label: 'Artifact 1' },
    { slot: EquipmentSlot.Artifact2, label: 'Artifact 2' },
    { slot: EquipmentSlot.Weapon, label: 'Weapon' },
  ];
};

/**
 * Get display label for equipment slot
 * @param slot Equipment slot
 * @returns Display label, returns slot value itself if not found
 */
export const getEquipmentSlotLabel = (slot: EquipmentSlot): string => {
  const config = getEquipmentSlotConfig();
  const slotConfig = config.find((c) => c.slot === slot);
  return slotConfig?.label || slot;
};

/**
 * Get corresponding equipment type by slot
 */
export const getItemTypeBySlot = (slot: EquipmentSlot): ItemType | null => {
  const ringSlots = [
    EquipmentSlot.Ring1,
    EquipmentSlot.Ring2,
    EquipmentSlot.Ring3,
    EquipmentSlot.Ring4,
  ];
  const accessorySlots = [EquipmentSlot.Accessory1, EquipmentSlot.Accessory2];
  const artifactSlots = [EquipmentSlot.Artifact1, EquipmentSlot.Artifact2];

  if (ringSlots.includes(slot)) return ItemType.Ring;
  if (accessorySlots.includes(slot)) return ItemType.Accessory;
  if (artifactSlots.includes(slot)) return ItemType.Artifact;
  if (slot === EquipmentSlot.Weapon) return ItemType.Weapon;
  if (
    [
      EquipmentSlot.Head,
      EquipmentSlot.Shoulder,
      EquipmentSlot.Chest,
      EquipmentSlot.Gloves,
      EquipmentSlot.Legs,
      EquipmentSlot.Boots,
    ].includes(slot)
  ) {
    return ItemType.Armor;
  }

  return null;
};

/**
 * Check if slots belong to the same group (for filtering display)
 * e.g.: Ring1, Ring2, Ring3, Ring4 belong to the same group
 */
export const areSlotsInSameGroup = (slot1: EquipmentSlot, slot2: EquipmentSlot): boolean => {
  const ringSlots = [
    EquipmentSlot.Ring1,
    EquipmentSlot.Ring2,
    EquipmentSlot.Ring3,
    EquipmentSlot.Ring4,
  ];
  const accessorySlots = [EquipmentSlot.Accessory1, EquipmentSlot.Accessory2];
  const artifactSlots = [EquipmentSlot.Artifact1, EquipmentSlot.Artifact2];

  // Check if both are in Ring group
  if (ringSlots.includes(slot1) && ringSlots.includes(slot2)) return true;
  // Check if both are in Accessory group
  if (accessorySlots.includes(slot1) && accessorySlots.includes(slot2)) return true;
  // Check if both are in Artifact group
  if (artifactSlots.includes(slot1) && artifactSlots.includes(slot2)) return true;

  // Other cases, only if exactly same do they belong to same group
  return slot1 === slot2;
};

