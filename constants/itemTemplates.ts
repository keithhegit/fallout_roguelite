/**
 * Item Template System
 * Contains base templates for Equipment, Pills, Herbs, and Materials
 * 10 items for each rarity of each item type, totaling 160 items
 */

import { Item, ItemType, ItemRarity, EquipmentSlot } from '../types';
import { EQUIPMENT_MIN_STATS } from '../utils/itemUtils';

// Name generation word bank
const NAME_COMPONENTS = {
  // Material words (Common)
  commonMaterials: ['Scrap', 'Iron', 'Steel', 'Wooden', 'Plastic', 'Stone', 'Bone', 'Fiber', 'Rubber', 'Cloth', 'Leather', 'Hemp', 'Rag', 'Copper'],
  // Material words (Rare)
  rareMaterials: ['Hardened', 'Refined', 'Carbon', 'Treated', 'Chrome', 'Lead-Lined', 'Polymer', 'Titanium', 'Neon', 'Obsidian', 'Tungsten', 'Cobalt', 'Kevlar', 'Silicone'],
  // Material words (Legendary)
  legendaryMaterials: ['Vault', 'Enclave', 'Bos', 'Raider', 'Mutant', 'Plasma', 'Nuclear', 'Cyber', 'Atomic', 'Relic', 'Titan', 'Apex', 'Zenith', 'Nova'],
  // Material words (Mythic)
  immortalMaterials: ['Ultimate', 'Celestial', 'Void', 'Eternal', 'Primordial', 'Omega', 'Absolute', 'Unstoppable', 'God-King', 'Genesis', 'Infinity', 'Supreme'],

  // Weapon types
  weaponTypes: ['Sword', 'Blade', 'Spear', 'Halberd', 'Axe', 'Hammer', 'Whip', 'Club', 'Pipe', 'Knife', 'Dagger', 'Machete', 'Ripper', 'Sledge', 'Crowbar'],
  // Armor types
  armorTypes: ['Suit', 'Armor', 'Vest', 'Plate', 'Outfit', 'Uniform', 'Gear', 'Harness'],
  // Armor parts
  armorParts: {
    head: ['Helmet', 'Mask', 'Goggles', 'Cap', 'Hat', 'Hood', 'Visor', 'Headpiece'],
    shoulder: ['Pauldrons', 'Shoulder Pad', 'Guards', 'Plate', 'Cape', 'Mantle'],
    chest: ['Chestplate', 'Breastplate', 'Torso', 'Vest', 'Armor', 'Suit', 'Tunic', 'Shirt'],
    gloves: ['Gloves', 'Gauntlets', 'Mittens'],
    legs: ['Legguards', 'Pants', 'Leggings', 'Greaves', 'Trousers'],
    boots: ['Boots', 'Shoes', 'Greaves', 'Footwear'],
  },
  // Accessory types
  accessoryTypes: ['Medallion', 'Bracelet', 'Necklace', 'Amulet', 'Pendant', 'Charm', 'Badge', 'Band'],
  // Ring types
  ringTypes: ['Ring', 'Band', 'Loop', 'Signet'],
  // Artifact types
  artifactTypes: ['Relic', 'Tech', 'Device', 'Cube', 'Orb', 'Module', 'Core', 'Unit'],

  // Chem effects (Pills)
  pillEffects: ['Exp', 'Healing', 'Might', 'Mind', 'Recovery', 'Wits', 'Speed', 'Soul', 'Survival', 'Tier-Aid'],
  // Chem size prefixes
  pillSizePrefixes: {
    Common: ['Small'],
    Rare: ['Standard', 'Potent'],
    Legendary: ['Great', 'Superior'],
    Mythic: ['Extreme', 'Ultimate', 'Divine'],
  },

  // Herb effects (Reagents)
  herbEffects: ['Healing', 'Energy', 'Stamina', 'Focus', 'Rad-Away', 'X-Cell', 'Glow', 'Berry', 'Root', 'Leaf'],
  // Herb types
  herbTypes: ['Plant', 'Flower', 'Fruit', 'Root', 'Fungus', 'Herb', 'Seed', 'Nuts'],
  // Herb rarity prefixes
  herbRarityPrefixes: {
    Common: [],
    Rare: ['Bio', 'Mutant'],
    Legendary: ['Rare', 'Ancient'],
    Mythic: ['Mythic', 'Godlike'],
  },

  // Material types
  materialTypes: ['Ingot', 'Plate', 'Crystal', 'Jade', 'Stone', 'Dust', 'Powder', 'Chunk', 'Bar', 'Core', 'Wire', 'Thread'],
  // Material bases
  materialBases: ['Iron', 'Copper', 'Wood', 'Stone', 'Bone', 'Fiber', 'Plastic', 'Steel', 'Lead', 'Aluminum', 'Titanium'],
  // Material rarity prefixes
  materialRarityPrefixes: {
    Common: [],
    Rare: ['Refined', 'Alloy'],
    Legendary: ['High-Grade', 'Pure'],
    Mythic: ['Absolute', 'True'],
  },
};

/**
 * Generate weapon name
 */
function generateWeaponName(rarity: ItemRarity, index: number): string {
  const materials =
    rarity === 'Common' ? NAME_COMPONENTS.commonMaterials :
      rarity === 'Rare' ? NAME_COMPONENTS.rareMaterials :
        rarity === 'Legendary' ? NAME_COMPONENTS.legendaryMaterials :
          NAME_COMPONENTS.immortalMaterials;

  const material = materials[index % materials.length];
  const weaponType = NAME_COMPONENTS.weaponTypes[Math.floor(index / materials.length) % NAME_COMPONENTS.weaponTypes.length];

  return `${material}${weaponType}`;
}

/**
 * Generate armor name
 * @param rarity Rarity
 * @param index Index
 * @param slot Equipment slot (optional, if provided, generates part name based on slot)
 */
function generateArmorName(rarity: ItemRarity, index: number, slot?: EquipmentSlot): string {
  const materials =
    rarity === 'Common' ? NAME_COMPONENTS.commonMaterials :
      rarity === 'Rare' ? NAME_COMPONENTS.rareMaterials :
        rarity === 'Legendary' ? NAME_COMPONENTS.legendaryMaterials :
          NAME_COMPONENTS.immortalMaterials;

  const material = materials[index % materials.length];

  // If slot provided, generate corresponding part name
  if (slot) {
    const slotPartsMap: Partial<Record<EquipmentSlot, string[]>> = {
      [EquipmentSlot.Head]: NAME_COMPONENTS.armorParts.head,
      [EquipmentSlot.Shoulder]: NAME_COMPONENTS.armorParts.shoulder,
      [EquipmentSlot.Chest]: NAME_COMPONENTS.armorParts.chest,
      [EquipmentSlot.Gloves]: NAME_COMPONENTS.armorParts.gloves,
      [EquipmentSlot.Legs]: NAME_COMPONENTS.armorParts.legs,
      [EquipmentSlot.Boots]: NAME_COMPONENTS.armorParts.boots,
    };

    const parts = slotPartsMap[slot];
    if (parts && parts.length > 0) {
      const partIndex = Math.floor(index / materials.length) % parts.length;
      return `${material}${parts[partIndex]}`;
    }
  }

  // Fallback logic if no slot provided
  // Toggle between type and part based on index
  if (index % 2 === 0) {
    const armorType = NAME_COMPONENTS.armorTypes[Math.floor(index / materials.length) % NAME_COMPONENTS.armorTypes.length];
    return `${material}${armorType}`;
  } else {
    // Select randomly from all parts (maintained for backward compatibility)
    const allParts = [
      ...NAME_COMPONENTS.armorParts.head,
      ...NAME_COMPONENTS.armorParts.shoulder,
      ...NAME_COMPONENTS.armorParts.chest,
      ...NAME_COMPONENTS.armorParts.gloves,
      ...NAME_COMPONENTS.armorParts.legs,
      ...NAME_COMPONENTS.armorParts.boots,
    ];
    const armorPart = allParts[Math.floor(index / materials.length) % allParts.length];
    return `${material}${armorPart}`;
  }
}

/**
 * Generate accessory name
 */
function generateAccessoryName(rarity: ItemRarity, index: number): string {
  const materials =
    rarity === 'Common' ? NAME_COMPONENTS.commonMaterials :
      rarity === 'Rare' ? NAME_COMPONENTS.rareMaterials :
        rarity === 'Legendary' ? NAME_COMPONENTS.legendaryMaterials :
          NAME_COMPONENTS.immortalMaterials;

  const material = materials[index % materials.length];
  const accessoryType = NAME_COMPONENTS.accessoryTypes[Math.floor(index / materials.length) % NAME_COMPONENTS.accessoryTypes.length];
  return `${material} ${accessoryType}`;
}

/**
 * Generate ring name
 */
function generateRingName(rarity: ItemRarity, index: number): string {
  const materials =
    rarity === 'Common' ? NAME_COMPONENTS.commonMaterials :
      rarity === 'Rare' ? NAME_COMPONENTS.rareMaterials :
        rarity === 'Legendary' ? NAME_COMPONENTS.legendaryMaterials :
          NAME_COMPONENTS.immortalMaterials;

  const material = materials[index % materials.length];
  const ringType = NAME_COMPONENTS.ringTypes[Math.floor(index / materials.length) % NAME_COMPONENTS.ringTypes.length];

  if (rarity === 'Rare') {
    const effects = ['Focus', 'Power', 'Shield', 'Spirit', 'Agility', 'Vitality', 'Might', 'Mind', 'Speed', 'Soul'];
    const effect = effects[index % effects.length];
    return `${effect} ${ringType}`;
  }

  return `${material} ${ringType}`;
}

/**
 * Generate artifact name
 */
function generateArtifactName(rarity: ItemRarity, index: number): string {
  const materials =
    rarity === 'Common' ? NAME_COMPONENTS.commonMaterials :
      rarity === 'Rare' ? NAME_COMPONENTS.rareMaterials :
        rarity === 'Legendary' ? NAME_COMPONENTS.legendaryMaterials :
          NAME_COMPONENTS.immortalMaterials;

  const material = materials[index % materials.length];
  const artifactType = NAME_COMPONENTS.artifactTypes[Math.floor(index / materials.length) % NAME_COMPONENTS.artifactTypes.length];

  if (rarity === 'Rare') {
    const effects = ['Focus', 'Guard', 'Battery', 'Mind', 'Core', 'Vigor', 'Wits', 'Swift', 'Soul', 'Life'];
    const effect = effects[index % effects.length];
    return `${effect} ${artifactType}`;
  }

  return `${material} ${artifactType}`;
}

/**
 * Generate shot name (formerly pill)
 */
function generatePillName(rarity: ItemRarity, index: number): string {
  const effect = NAME_COMPONENTS.pillEffects[index % NAME_COMPONENTS.pillEffects.length];
  const sizePrefixes = NAME_COMPONENTS.pillSizePrefixes[rarity];
  const sizePrefix = sizePrefixes[index % sizePrefixes.length];
  return `${sizePrefix} ${effect} Shot`;
}

/**
 * Generate material name
 */
function generateMaterialName(rarity: ItemRarity, index: number): string {
  const materialBase = NAME_COMPONENTS.materialBases[index % NAME_COMPONENTS.materialBases.length];
  const materialType = NAME_COMPONENTS.materialTypes[Math.floor(index / NAME_COMPONENTS.materialBases.length) % NAME_COMPONENTS.materialTypes.length];
  const rarityPrefixes = NAME_COMPONENTS.materialRarityPrefixes[rarity];
  const rarityPrefix = rarityPrefixes.length > 0 ? rarityPrefixes[index % rarityPrefixes.length] : '';
  return `${rarityPrefix} ${materialBase} ${materialType}`;
}

/**
 * Generate biological sample name (formerly herb)
 */
function generateHerbName(rarity: ItemRarity, index: number): string {
  const effect = NAME_COMPONENTS.herbEffects[index % NAME_COMPONENTS.herbEffects.length];
  const herbType = NAME_COMPONENTS.herbTypes[Math.floor(index / NAME_COMPONENTS.herbEffects.length) % NAME_COMPONENTS.herbTypes.length];
  const rarityPrefixes = NAME_COMPONENTS.herbRarityPrefixes[rarity];
  const rarityPrefix = rarityPrefixes.length > 0 ? rarityPrefixes[index % rarityPrefixes.length] : '';
  return `${rarityPrefix} ${effect} ${herbType}`;
}

// Rarity attribute multipliers
const RARITY_MULTIPLIERS: Record<ItemRarity, number> = {
  Common: 1,
  Rare: 1.5,
  Legendary: 2.5,
  Mythic: 6.0,
};

// Equipment types
type EquipmentType = 'weapon' | 'armor' | 'accessory' | 'ring' | 'artifact';

/**
 * Generate equipment name
 * @param type Equipment type
 * @param rarity Rarity
 * @param index Index
 * @param slot Equipment slot (optional, only for armor)
 */
function generateEquipmentName(
  type: EquipmentType,
  rarity: ItemRarity,
  index: number,
  slot?: EquipmentSlot
): string {
  switch (type) {
    case 'weapon':
      return generateWeaponName(rarity, index);
    case 'armor':
      return generateArmorName(rarity, index, slot);
    case 'accessory':
      return generateAccessoryName(rarity, index);
    case 'ring':
      return generateRingName(rarity, index);
    case 'artifact':
      return generateArtifactName(rarity, index);
    default:
      return 'Unknown Equipment';
  }
}

/**
 * Generate basic stats for equipment
 * Applies minimum stats (EQUIPMENT_MIN_STATS) and then adjusts
 */
function generateEquipmentStats(
  type: EquipmentType,
  rarity: ItemRarity,
  index: number
): Pick<Item['effect'], 'attack' | 'defense' | 'hp' | 'spirit' | 'physique' | 'speed'> {
  const multiplier = RARITY_MULTIPLIERS[rarity];
  const baseValue = 10 + index * 5; // Base value increases with index

  // Get minimum stats for this rarity
  const minStats = EQUIPMENT_MIN_STATS[rarity];

  const stats: Pick<Item['effect'], 'attack' | 'defense' | 'hp' | 'spirit' | 'physique' | 'speed'> = {};

  switch (type) {
    case 'weapon': {
      // Weapon: Apply min stats then adjust
      const baseAttack = minStats.attack + Math.floor(baseValue * multiplier * (1 + Math.random() * 0.5));
      const baseSpirit = minStats.spirit + Math.floor(baseValue * multiplier * 0.3 * (1 + Math.random() * 0.5));

      // Ensure not below minimum
      stats.attack = Math.max(baseAttack, minStats.attack);
      stats.spirit = Math.max(baseSpirit, minStats.spirit);
      break;
    }
    case 'armor': {
      // Armor: Apply min stats then adjust
      const baseDefense = minStats.defense + Math.floor(baseValue * multiplier * (1 + Math.random() * 0.5));
      const baseHp = minStats.hp + Math.floor(baseValue * multiplier * 0.8 * (1 + Math.random() * 0.5));
      const basePhysique = minStats.physique + Math.floor(baseValue * multiplier * 0.2 * (1 + Math.random() * 0.5));

      // Ensure not below minimum
      stats.defense = Math.max(baseDefense, minStats.defense);
      stats.hp = Math.max(baseHp, minStats.hp);
      stats.physique = Math.max(basePhysique, minStats.physique);
      break;
    }
    case 'accessory':
    case 'ring': {
      // Accessory/Ring: Apply min stats then adjust
      const baseSpirit = minStats.spirit + Math.floor(baseValue * multiplier * 0.8 * (1 + Math.random() * 0.5));
      const baseSpeed = minStats.speed + Math.floor(baseValue * multiplier * 0.6 * (1 + Math.random() * 0.5));
      const baseHp = minStats.hp + Math.floor(baseValue * multiplier * 0.4 * (1 + Math.random() * 0.5));

      // Ensure not below minimum
      stats.spirit = Math.max(baseSpirit, minStats.spirit);
      stats.speed = Math.max(baseSpeed, minStats.speed);
      stats.hp = Math.max(baseHp, minStats.hp);
      break;
    }
    case 'artifact': {
      // Artifact: Apply min stats then adjust
      const baseAttack = minStats.attack + Math.floor(baseValue * multiplier * 0.5 * (1 + Math.random() * 0.5));
      const baseDefense = minStats.defense + Math.floor(baseValue * multiplier * 0.5 * (1 + Math.random() * 0.5));
      const baseSpirit = minStats.spirit + Math.floor(baseValue * multiplier * (1 + Math.random() * 0.5));
      const baseHp = minStats.hp + Math.floor(baseValue * multiplier * 0.6 * (1 + Math.random() * 0.5));

      // Ensure not below minimum
      stats.attack = Math.max(baseAttack, minStats.attack);
      stats.defense = Math.max(baseDefense, minStats.defense);
      stats.spirit = Math.max(baseSpirit, minStats.spirit);
      stats.hp = Math.max(baseHp, minStats.hp);
      break;
    }
  }

  return stats;
}

/**
 * Generate equipment description
 */
function generateEquipmentDescription(
  type: EquipmentType,
  name: string,
  rarity: ItemRarity,
  index: number
): string {
  // Generate different descriptions based on equipment type and rarity
  const weaponDescriptions: Record<ItemRarity, string[]> = {
    Common: [
      'A standard wasteland weapon. Simple but effective.',
      'Common weapon for survivors, providing basic combat capability.',
      'A crude tool for self-defense in the wastes.',
      'Plain and reliable, a staple for any drifter.',
      'Mass-produced from scrap, but it gets the job done.',
      'Simple design, easy to maintain in the field.',
      'Basic combat gear, essential for early survival.',
      'Ordinary weapon, infused with minor kinetic enhancements.',
      'Cheap and common, easy to replace if broken.',
      'A reliable piece of scrap for any basic survivor.',
    ],
    Rare: [
      'Precision-crafted weapon, sharp enough to cut through thin plate.',
      'Specially forged with advanced materials, showing great power.',
      'High-quality weaponry with a lethal edge.',
      'Finely tuned combat gear, glowing with a faint energy field.',
      'Expertly crafted with intricate details, offering superior performance.',
      'Forged using rare alloys for increased durability and lethality.',
      'Sleek design with a polished finish, clearly superior quality.',
      'Intricately crafted, favored by elite survivalists.',
      'Masterfully forged weapon, far exceeding standard scrap tools.',
      'A weapon built for real combat, where every hit counts.',
    ],
    Legendary: [
      'A legendary relic of the pre-war era, hums with massive power.',
      'An ancient masterpiece, capable of cutting through the toughest armor.',
      'A legendary weapon with a storied history in the wasteland.',
      'Infused with raw nuclear energy, it glows with a dangerous light.',
      'A masterpiece of lost technology, priceless beyond measure.',
      'An ancient artifact, every strike carries the weight of history.',
      'A legendary combat tool, scarred but still remarkably powerful.',
      'Concentrated energy pulses through its frame, a true marvel.',
      'A weapon of myth, sought after by the powerful of the wastes.',
      'Ancient technology that can change the outcome of any battle.',
    ],
    Mythic: [
      'An ultimate weapon of celestial origin, transcends mortality.',
      'Born from the genesis of the new world, possessing world-ending power.',
      'A mythic artifact of god-like proportions, beyond all comprehension.',
      'A weapon that defies reality, its strikes can sever fate itself.',
      'Crafted by lost gods, it emits a divine aura of pure energy.',
      'A relic of singular power, every hit resonates with cosmic energy.',
      'Legendary beyond legends, fused with forbidden technologies.',
      'Transcendental gear, its presence alone marks a new era.',
      'An ultimate tool of destruction, the apex of wasteland power.',
      'Possesses absolute power, capable of shattering any defense.',
    ],
  };

  const armorDescriptions: Record<ItemRarity, string[]> = {
    Common: [
      'Basic protective gear, though defense is limited.',
      'Simple scrap armor, can stop minor impacts.',
      'Common protection worn by drifters and scavengers.',
      'A plain and reliable set of protective rags.',
      'Inexpensive armor for the budget-conscious survivor.',
      'Basic gear for those just starting out in the wastes.',
      'Reliable enough for daily travel through low-risk areas.',
      'Ordinary protection, reinforced with some metal plates.',
      'Easy to find, easy to fix, and better than nothing.',
      'A staple for the average wastelander.',
    ],
    Rare: [
      'Well-crafted armor offering substantial protection.',
      'High-quality plating with a polished finish.',
      'Treated with special materials for extra durability.',
      'A favorite among veteran scavengers for its balance.',
      'Reinforced with heavy-duty components for combat.',
      'Superior crafting evident in its intricate design.',
      'Built to withstand more than just casual radiation.',
      'Polished and sturdy, a significant step up from scrap.',
      'Crafted with precision, offering reliable defense.',
      'Durable plates joined by high-quality fibers.',
    ],
    Legendary: [
      'A legendary pre-war suit, almost indestructible.',
      'Ancient technology provides nearly perfect protection.',
      'Made from exotic alloys found in the heart of the wastes.',
      'Scarred by history, but its defensive power remains absolute.',
      'Lost technology that defies all standard kinetic weapons.',
      'Every plate is a masterpiece of pre-war engineering.',
      'Survives where everything else fails. A true legend.',
      'Its surface hums with a protective energy field.',
      'Only few such pieces exist. A treasure of the wastes.',
      'The ultimate protection for a legendary adventurer.',
    ],
    Mythic: [
      'Celestial-grade armor, transcending physical limits.',
      'A divine shield of pure energy and forbidden tech.',
      'Light as air but can deflect a nuclear blast.',
      'Absolute defense. No force in the wasteland can penetrate it.',
      'Forged by cosmic forces, its presence is felt by all.',
      'The pinnacle of protective technology, beyond comprehension.',
      'Resonates with the frequency of the stars themselves.',
      'The ultimate suit for the master of the wastes.',
      'Grants a literal god-like protection to its wearer.',
      'Closer to a living entity than just mere equipment.',
    ],
  };

  const accessoryDescriptions: Record<ItemRarity, string[]> = {
    Common: [
      'A simple accessory, providing a minor boost to your survival capabilities.',
      'A common piece of jewelry found in pre-war ruins, still holding a faint charge.',
      'Basic accessory for any wastelander, reliable and easy to maintain.',
      'A functional piece of tech, unremarkable but effective.',
      'Cheaply made from scrap metal, but better than nothing.',
      'Standard issue gear for bottom-tier scavengers.',
      'A simple charm to ward off bad luck in the wastes.',
      'Plain and sturdy, a staple for any humble drifter.',
      'An ordinary find, but every little bit of armor helps.',
      'Reliable equipment for those who can’t afford better.',
    ],
    Rare: [
      'Expertly crafted accessory with a steady energy output.',
      'Made from refined alloys, this piece hums with suppressed power.',
      'A favorite among veteran mercenaries for its tactical advantages.',
      'Treated with rad-resistant coating, offering superior protection.',
      'Finely tuned electronics provide a noticeable performance boost.',
      'Favored by faction officers for its sleek and effective design.',
      'Provides a consistent edge in high-stakes survival situations.',
      'Polished and precise, it represents a step above common scrap.',
      'High-grade materials were used to forge this reliable equipment.',
      'Balanced for both defense and agility, a rare find indeed.',
    ],
    Legendary: [
      'A legendary pre-war relic of immense value and power.',
      'Ancient technology that seems to anticipate its owner’s needs.',
      'Every component is a masterpiece of a lost civilization.',
      'Its surface radiates a protective aura, unfathomable to modern science.',
      'A legendary combat tool, scarred but still remarkably functional.',
      'Concentrated energy pulses through its frame, a true marvel of tech.',
      'Survives where everything else fails. A true legend of the wastes.',
      'Possesses abilities that defy standard biological limits.',
      'A relic of singular power, highly sought after by wasteland kings.',
      'The ultimate accessory for a true apex survivor.',
    ],
    Mythic: [
      'An ultimate artifact of celestial origin, transcending all tech.',
      'A divine shield of pure energy, born from cosmic forces.',
      'Light as air but can deflect the most powerful energy beams.',
      'Absolute power contained in a small, elegant frame.',
      'The pinnacle of pre-war engineering, borderline magic.',
      'Resonates with the frequency of the new world itself.',
      'A relic of singular power, granting god-like attributes.',
      'Transcends mortality itself, the ultimate prize for any being.',
      'Possesses absolute power, capable of altering one’s destiny.',
      'The apex of all wasteland artifacts, truly one of a kind.',
    ],
  };

  const ringDescriptions: Record<ItemRarity, string[]> = {
    Common: [
      'A simple ring, providing a small but reliable attribute boost.',
      'Common finger-gear for scavengers, tough and practical.',
      'Basic ring made from scrap wire, surprisingly effective.',
      'Unremarkable but functional, a common find in any debris pile.',
      'Provides a minor edge in daily survival tasks.',
      'Standard issue for the lower ranks of any faction.',
      'Cheaply produced but better than going bare-handed.',
      'A plain band that holds a tiny bit of pre-war tech.',
      'Reliable enough for a rookie wastelander.',
      'Easy to replace and provides a necessary boost.',
    ],
    Rare: [
      'A finely crafted ring with a stable energy circuit.',
      'Made from refined metals, it pulses with a soft blue light.',
      'Offers a significant tactical benefit to its wearer.',
      'Trusted by elite scouts for its consistent performance.',
      'Reinforced with high-quality alloys for maximum durability.',
      'A superior band that shows clear signs of professional crafting.',
      'Well-balanced for high-speed combat and agility.',
      'Polished and sturdy, a favorite among faction officers.',
      'Crafted with precision, offering a reliable edge in trials.',
      'A rare piece of jewelry that combines style with survival.',
    ],
    Legendary: [
      'A legendary band that contains compressed data of a hero.',
      'Ancient technology provides a constant stream of performance data.',
      'Every link is a masterpiece of precision engineering.',
      'Radiates a powerful energy field, protecting the wearer’s soul.',
      'A legendary relic from the heart of a fallen city.',
      'Concentrated pulses of energy enhance every move.',
      'A legendary combat ring, sought after by the powerful.',
      'Its surface hums with an ancient, forgotten power.',
      'A relic of singular power, a treasure beyond caps.',
      'The ultimate ring for those who would conquer the wastes.',
    ],
    Mythic: [
      'An ultimate ring of celestial origin, transcends all knowledge.',
      'A divine band of pure energy, pulsing with cosmic power.',
      'Absolute control over one’s biological limits.',
      'The pinnacle of technological miniaturization.',
      'Resonates with the very essence of the new world.',
      'A relic of singular power, granting god-like stamina.',
      'Transcends the normal flow of time and space.',
      'The ultimate prize, forged from the heart of a nova.',
      'Possesses absolute power, the mark of a wasteland god.',
      'One of the few artifacts that can truly be called mythic.',
    ],
  };

  const artifactDescriptions: Record<ItemRarity, string[]> = {
    Common: [
      'A simple pre-war artifact, still functional but limited.',
      'Basic tech fragment providing a small performance boost.',
      'Common device used by survivors for various tasks.',
      'Unremarkable but useful, a standard find for scavengers.',
      'Proves that even pre-war junk has its uses.',
      'Standard issue gear for basic vault security.',
      'Reliable enough for daily use in non-combat zones.',
      'A small piece of history that still works surprisingly well.',
      'Cheap and common, the backbone of early survival.',
      'A simple tool to help you through another day.',
    ],
    Rare: [
      'A well-preserved piece of pre-war technology.',
      'Advanced circuits provide a steady energy boost.',
      'A favorite among professional scavengers for its utility.',
      'Specially treated with protective coatings.',
      'Finely tuned electronics offer a clear tactical edge.',
      'Superior crafting makes this a reliable choice in combat.',
      'Built to withstand harsh radioactive environments.',
      'Polished and precise, a significant upgrade for any kit.',
      'High-grade components ensure peak performance.',
      'Reliable and powerful, a rare find in any ruin.',
    ],
    Legendary: [
      'A legendary pre-war device with incredible processing power.',
      'Ancient technology that seems almost sentient.',
      'Every circuit is a masterpiece of lost manufacturing.',
      'Its core hums with a power that defies modern science.',
      'A legendary combat module, scarred but perfect.',
      'Concentrated energy pulses through its frame, a true marvel.',
      'Survives where everything else fails. A pinnacle of tech.',
      'Possesses abilities that transcend standard biological data.',
      'A relic of singular power, highly prized by overseers.',
      'The ultimate artifact for the master of the wasteland.',
    ],
    Mythic: [
      'A mythic device of celestial origin, beyond comprehension.',
      'A divine core of pure energy, pulsing with forbidden logic.',
      'Absolute control over the surrounding reality.',
      'The pinnacle of all technological development.',
      'Resonates with the frequency of the cosmos itself.',
      'A relic of singular power, granting god-like foresight.',
      'Transcends the limits of standard artificial intelligence.',
      'The ultimate tool, forged from the heart of a dying star.',
      'Possesses absolute power, the apex of all human creation.',
      'A singular object that could reshape the entire wasteland.',
    ],
  };

  const descriptionMap: Record<EquipmentType, Record<ItemRarity, string[]>> = {
    weapon: weaponDescriptions,
    armor: armorDescriptions,
    accessory: accessoryDescriptions,
    ring: ringDescriptions,
    artifact: artifactDescriptions,
  };

  const descriptions = descriptionMap[type][rarity];
  return descriptions[index % descriptions.length];
}

/**
 * Generate equipment templates
 */
function generateEquipmentTemplates(): Item[] {
  const items: Item[] = [];
  const rarities: ItemRarity[] = ['Common', 'Rare', 'Legendary', 'Mythic'];

  // Equipment types and corresponding ItemType and EquipmentSlot
  const equipmentTypes: Array<{
    type: EquipmentType;
    itemType: ItemType;
    slots: EquipmentSlot[];
  }> = [
      { type: 'weapon', itemType: ItemType.Weapon, slots: [EquipmentSlot.Weapon] },
      { type: 'armor', itemType: ItemType.Armor, slots: [EquipmentSlot.Head, EquipmentSlot.Shoulder, EquipmentSlot.Chest, EquipmentSlot.Gloves, EquipmentSlot.Legs, EquipmentSlot.Boots] },
      { type: 'accessory', itemType: ItemType.Accessory, slots: [EquipmentSlot.Accessory1, EquipmentSlot.Accessory2] },
      { type: 'ring', itemType: ItemType.Ring, slots: [EquipmentSlot.Ring1, EquipmentSlot.Ring2, EquipmentSlot.Ring3, EquipmentSlot.Ring4] },
      { type: 'artifact', itemType: ItemType.Artifact, slots: [EquipmentSlot.Artifact1, EquipmentSlot.Artifact2] },
    ];

  let idCounter = 1;

  equipmentTypes.forEach(({ type, itemType, slots }) => {
    rarities.forEach(rarity => {
      for (let i = 0; i < 10; i++) {
        const slot = slots[i % slots.length];
        // Determine slot first, then generate name based on slot (ensure name and slot correspond)
        const name = generateEquipmentName(type, rarity, i, slot);
        const stats = generateEquipmentStats(type, rarity, i);

        items.push({
          id: `equip-${type}-${rarity}-${i + 1}`,
          name,
          type: itemType,
          description: generateEquipmentDescription(type, name, rarity, i),
          quantity: 1,
          rarity,
          level: 0,
          isEquippable: true,
          equipmentSlot: slot,
          effect: stats,
        });

        idCounter++;
      }
    });
  });

  return items;
}

// generatePillName is defined above

/**
 * Generate pill stats
 */
function generatePillStats(
  rarity: ItemRarity,
  index: number
): { effect?: Item['effect']; permanentEffect?: Item['permanentEffect'] } {
  const multiplier = RARITY_MULTIPLIERS[rarity];
  const baseValue = 10 + index * 10;

  // Randomly select effect type
  const effectType = index % 4;

  switch (effectType) {
    case 0: // Increase Exp
      return {
        effect: { exp: Math.floor(baseValue * multiplier) },
      };
    case 1: // Restore HP
      return {
        effect: { hp: Math.floor(baseValue * multiplier * 2) },
      };
    case 2: // Permanently increase stats
      return {
        permanentEffect: {
          spirit: Math.floor(baseValue * multiplier * 0.3),
          physique: Math.floor(baseValue * multiplier * 0.3),
        },
      };
    case 3: // Mixed effect
      return {
        effect: { exp: Math.floor(baseValue * multiplier * 0.5), hp: Math.floor(baseValue * multiplier) },
        permanentEffect: {
          spirit: Math.floor(baseValue * multiplier * 0.2),
        },
      };
  }
}

/**
 * Generate pill description
 */
function generatePillDescription(rarity: ItemRarity, index: number, name: string): string {
  const descriptions: Record<ItemRarity, string[]> = {
    Common: [
      'A standard issue medical shot. Provides basic biological support.',
      'Common survival chem, simple to use and provides a small vitality boost.',
      'Every wastelander knows this shot. Reliable and easy to find.',
      'Basic chemical compound, functional and stable.',
      'Ordinary medical kit, smells of old antiseptic but still works.',
      'Basic survival aid, essential for those new to the wastes.',
      'A standard shot for routine bio-maintenance.',
      'Cheaply produced but better than nothing when hurt.',
      'Common medical supply, a staple for any drifter.',
      'Simple composition, but effective in a pinch.',
    ],
    Rare: [
      'Expertly refined medical shot, providing a significant boost to vitality.',
      'Superior quality chem, prepared with advanced knowledge and rare reagents.',
      'Specialized formula that provides long-lasting biological enhancement.',
      'Favored by faction officers for its tactical benefits.',
      'Finely tuned chemical balance, perfect for demanding survival situations.',
      'High-grade medical supply, much more effective than standard scrap shots.',
      'Triple-distilled for maximum purity and energy output.',
      'A rare find in any pre-war medical facility.',
      'Noticeably improves neural response and physical strength.',
      'Well-balanced formula suitable for experienced survivors.',
    ],
    Legendary: [
      'A legendary pre-war serum that can pull a survivor back from the brink.',
      'Ancient masterwork of biological engineering, with massive potential.',
      'Concentrated life energy that can reshape one’s physical limits.',
      'Survives from the most advanced pre-war labs, priceless today.',
      'Legendary drug that was once issued only to the most elite units.',
      'Every drop is a marvel of lost pharmaceutical technology.',
      'Its presence is felt immediately upon injection. Absolute power.',
      'A relic of singular power, highly sought after by wasteland overseers.',
      'Induces temporary god-like states of physical and mental prowess.',
      'The ultimate medical find, capable of working real miracles.',
    ],
    Mythic: [
      'An ultimate mythic serum of celestial origin, transcending all biology.',
      'A divine catalyst of pure energy, capable of fundamentally altering life.',
      'Beyond all mortal comprehension, its effects are truly singular.',
      'The pinnacle of all human biological research, nearly impossible to find.',
      'Resonates with the very frequency of life itself.',
      'A relic of singular power, granting abilities beyond human imagining.',
      'Possesses absolute power, the apex of all pharmaceutical development.',
      'A device of such power it could restart a heart that has been cold for years.',
      'One of the few substances that can truly be called a myth.',
      'The final word in survival technology, the ultimate prize.',
    ],
  };

  const descList = descriptions[rarity];
  return descList[index % descList.length];
}

/**
 * Generate pill templates
 */
function generatePillTemplates(): Item[] {
  const items: Item[] = [];
  const rarities: ItemRarity[] = ['Common', 'Rare', 'Legendary', 'Mythic'];

  rarities.forEach(rarity => {
    for (let i = 0; i < 10; i++) {
      const name = generatePillName(rarity, i);
      const stats = generatePillStats(rarity, i);

      items.push({
        id: `pill-${rarity}-${i + 1}`,
        name,
        type: ItemType.Pill,
        description: generatePillDescription(rarity, i, name),
        quantity: 1,
        rarity,
        ...stats,
      });
    }
  });

  return items;
}

// generateHerbName 已在上面定义

/**
 * 生成草药属性
 */
function generateHerbStats(
  rarity: ItemRarity,
  index: number
): { effect?: Item['effect']; permanentEffect?: Item['permanentEffect'] } {
  const multiplier = RARITY_MULTIPLIERS[rarity];
  const baseValue = 10 + index * 5;

  // 随机选择效果类型
  const effectType = index % 3;

  switch (effectType) {
    case 0: // 恢复气血
      return {
        effect: { hp: Math.floor(baseValue * multiplier) },
      };
    case 1: // 增加修为
      return {
        effect: { exp: Math.floor(baseValue * multiplier * 0.3) },
      };
    case 2: // 永久增加属性
      return {
        permanentEffect: {
          spirit: Math.floor(baseValue * multiplier * 0.2),
          physique: Math.floor(baseValue * multiplier * 0.2),
          maxHp: Math.floor(baseValue * multiplier * 0.5),
        },
      };
  }
}

/**
 * 生成草药描述
 */
function generateHerbDescription(rarity: ItemRarity, index: number, name: string): string {
  const descriptions: Record<ItemRarity, string[]> = {
    Common: [
      'A simple herb, although its energy is thin, it can provide basic healing effects.',
      'Common plants found in many ruins, plain but practical.',
      'Basic medicinal herb, easy to gather, frequently used by survivors.',
      'Ordinary plant with a faint scent, limited effectiveness but easy to find.',
      'Common survival flora, can still be useful in a pinch.',
      'Basic reagent for crafting simple medical supplies.',
      'A simple plant containing a trace of energy, suitable for basic chems.',
      'Common and inexpensive, good for mass-producing simple aids.',
      'Basic medicinal plant providing rudimentary healing and support.',
      'An ordinary herb that can be effective in the hands of a skilled chem-maker.',
    ],
    Rare: [
      'A carefully cultivated mutant plant with thick energy, essential for rare chems.',
      'High-quality herb grown in energy-rich ruins, possessing potent medicinal properties.',
      'Specially bred survival flora with stable and long-lasting effects.',
      'High-grade reagents that can significantly improve chem quality.',
      'Carefully selected mutant flora, its properties perfectly balanced.',
      'Superior herb that has absorbed significant ambient radiation energy.',
      'Exotic plant with minimal impurities, its essence is pure and strong.',
      'Highly valued reagent, its surface glows with a faint bioluminescence.',
      'Potent mutant plant, a necessary ingredient for specialized survival chems.',
      'Premium survival flora, suitable for a wide range of medical applications.',
    ],
    Legendary: [
      'A legendary relic plant of immense value and potent biological power.',
      'Ancient masterwork of nature, every leaf is a rare and precious resource.',
      'Concentrated life energy found only in the most pristine pre-war zones.',
      'Legendary herb with a storied history, its effects are nearly miraculous.',
      'Grown in extreme environments, it possesses power that defies comprehension.',
      'An ancient biological artifact, every fiber hums with suppressed energy.',
      'Survives where everything else fails. A true pinnacle of mutant flora.',
      'Possesses abilities that transcend standard biological data.',
      'A relic of singular power, highly prized by wasteland overseers.',
      'The ultimate reagent for the master of the wasteland labs.',
    ],
    Mythic: [
      'A mythic plant of celestial origin, transcends all known biology.',
      'A divine catalyst of pure energy, capable of fundamentally altering life.',
      'Beyond all mortal comprehension, its effects are truly singular.',
      'The pinnacle of all biological research, nearly impossible to find.',
      'Resonates with the very frequency of life itself.',
      'A relic of singular power, granting abilities beyond human imagining.',
      'Possesses absolute power, the apex of all pharmaceutical development.',
      'A device of such power it could restart a heart that has been cold for years.',
      'One of the few substances that can truly be called a myth.',
      'The final word in survival technology, the ultimate prize.',
    ],
  };

  const descList = descriptions[rarity];
  return descList[index % descList.length];
}

/**
 * 生成草药模板
 */
function generateHerbTemplates(): Item[] {
  const items: Item[] = [];
  const rarities: ItemRarity[] = ['Common', 'Rare', 'Legendary', 'Mythic'];

  rarities.forEach(rarity => {
    for (let i = 0; i < 10; i++) {
      const name = generateHerbName(rarity, i);
      const stats = generateHerbStats(rarity, i);

      items.push({
        id: `herb-${rarity}-${i + 1}`,
        name,
        type: ItemType.Herb,
        description: generateHerbDescription(rarity, i, name),
        quantity: 1,
        rarity,
        ...stats,
      });
    }
  });

  return items;
}

// generateMaterialName 已在上面定义

/**
 * 生成材料描述
 */
function generateMaterialDescription(rarity: ItemRarity, index: number, name: string): string {
  const descriptions: Record<ItemRarity, string[]> = {
    Common: [
      'A standard material, unremarkable but adequate for basic crafting.',
      'Commonly available scrap, suitable for basic equipment and medicine.',
      'Basic crafting component, practical and reliable for any scavenger.',
      'Ordinary material with limited potential, but invaluable for its price.',
      'A staple of early-game crafting, often found in various debris piles.',
      'Standard issue raw materials, perfect for entry-level gear.',
      'A simple material with a trace of usefulness in basic blueprints.',
      'Common and easy to source, reliable for daily maintenance.',
      'Basic resource used by many survivors for rudimentary repairs.',
      'An ordinary find that can still be put to good use by a skilled hand.',
    ],
    Rare: [
      'A carefully refined material, possessing superior properties for crafting.',
      'High-quality raw resource with excellent durability and conductivity.',
      'A favorite among professional smiths for its reliable performance.',
      'Specially treated alloy offering enhanced stability in high-risk zones.',
      'Finely tuned material with a noticeable edge in tactical applications.',
      'Superior grade resource that shows clear signs of expert purification.',
      'Exotic material with minimal impurities, highly sought after in labs.',
      'Polished and sturdy, it represents a significant upgrade from scrap.',
      'High-grade component ensuring peak performance in specialized gear.',
      'Reliable and versatile, a rare find in any pre-war industrial site.',
    ],
    Legendary: [
      'A legendary relic material of immense value and structural integrity.',
      'Ancient masterwork of metallurgy, almost impossible to replicate today.',
      'Concentrated energy pulses through its frame, a true marvel of science.',
      'Legendary resource found only in the most advanced pre-war vaults.',
      'A material of such rare quality it defies standard classification.',
      'Every link or fiber is a masterpiece of precision manufacturing.',
      'Survives where everything else fails. A true pinnacle of engineering.',
      'Possesses properties that transcend standard physical limits.',
      'A relic of singular power, highly prized by faction leaders.',
      'The ultimate material for those who would rebuild the world.',
    ],
    Mythic: [
      'An ultimate material of celestial origin, transcending all known science.',
      'A divine catalyst of pure energy and structural perfection.',
      'Absolute control over its own molecular state, nearly indestructible.',
      'The pinnacle of human material development, bordering on myth.',
      'Resonates with the very frequency of the cosmos itself.',
      'A relic of singular power, granting near-immortal properties to gear.',
      'Transcends the limits of standard chemical and physical laws.',
      'The final word in material technology, the ultimate prize for any smith.',
      'Possesses absolute power, the mark of a wasteland legend.',
      'A singular substance that could reshape the entire known world.',
    ],
  };

  const descList = descriptions[rarity];
  return descList[index % descList.length];
}

/**
 * 生成材料模板
 */
function generateMaterialTemplates(): Item[] {
  const items: Item[] = [];
  const rarities: ItemRarity[] = ['Common', 'Rare', 'Legendary', 'Mythic'];

  rarities.forEach(rarity => {
    for (let i = 0; i < 10; i++) {
      const name = generateMaterialName(rarity, i);

      items.push({
        id: `material-${rarity}-${i + 1}`,
        name,
        type: ItemType.Material,
        description: generateMaterialDescription(rarity, i, name),
        quantity: 1,
        rarity,
      });
    }
  });

  return items;
}

/**
 * 生成所有物品模板
 */
export const ITEM_TEMPLATES: Item[] = [
  ...generateEquipmentTemplates(),
  ...generatePillTemplates(),
  ...generateHerbTemplates(),
  ...generateMaterialTemplates(),
];

/**
 * 根据物品类型和稀有度获取物品模板
 */
export function getItemTemplatesByTypeAndRarity(
  type: ItemType,
  rarity: ItemRarity
): Item[] {
  return ITEM_TEMPLATES.filter(
    item => item.type === type && item.rarity === rarity
  );
}

/**
 * 根据物品类型获取物品模板
 */
export function getItemTemplatesByType(type: ItemType): Item[] {
  return ITEM_TEMPLATES.filter(item => item.type === type);
}

/**
 * 根据稀有度获取物品模板
 */
export function getItemTemplatesByRarity(rarity: ItemRarity): Item[] {
  return ITEM_TEMPLATES.filter(item => item.rarity === rarity);
}
