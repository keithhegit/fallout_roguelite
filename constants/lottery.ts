/**
 * Lottery (Recruitment) System Constants
 * Contains all lottery prize definitions.
 */

import { LotteryPrize, ItemType, EquipmentSlot, ItemRarity } from '../types'
import { generateLotteryPrizes } from '../utils/itemGenerator';
import { FOUNDATION_TREASURES, HEAVEN_EARTH_ESSENCES, HEAVEN_EARTH_MARROWS, LONGEVITY_RULES } from './advanced';

// --- Lottery System ---
export const LOTTERY_PRIZES: LotteryPrize[] = [
  // Common Rewards - Caps
  {
    id: 'lottery-stone-10',
    name: '10 Caps',
    type: 'spiritStones',
    rarity: 'Common',
    weight: 35,
    value: { spiritStones: 10 },
  },
  {
    id: 'lottery-stone-50',
    name: '50 Caps',
    type: 'spiritStones',
    rarity: 'Common',
    weight: 25,
    value: { spiritStones: 50 },
  },
  {
    id: 'lottery-stone-100',
    name: '100 Caps',
    type: 'spiritStones',
    rarity: 'Rare',
    weight: 18,
    value: { spiritStones: 100 },
  },
  {
    id: 'lottery-stone-500',
    name: '500 Caps',
    type: 'spiritStones',
    rarity: 'Rare',
    weight: 8,
    value: { spiritStones: 500 },
  },
  {
    id: 'lottery-stone-1000',
    name: '1000 Caps',
    type: 'spiritStones',
    rarity: 'Legendary',
    weight: 3,
    value: { spiritStones: 1000 },
  },

  // Common Rewards - Progression
  {
    id: 'lottery-exp-50',
    name: '50 Progression',
    type: 'exp',
    rarity: 'Common',
    weight: 30,
    value: { exp: 50 },
  },
  {
    id: 'lottery-exp-200',
    name: '200 Progression',
    type: 'exp',
    rarity: 'Common',
    weight: 20,
    value: { exp: 200 },
  },
  {
    id: 'lottery-exp-500',
    name: '500 Progression',
    type: 'exp',
    rarity: 'Rare',
    weight: 12,
    value: { exp: 500 },
  },
  {
    id: 'lottery-exp-2000',
    name: '2000 Progression',
    type: 'exp',
    rarity: 'Legendary',
    weight: 4,
    value: { exp: 2000 },
  },

  // Common Rewards - Stims
  {
    id: 'lottery-pill-qi',
    name: 'Energy Boost',
    type: 'item',
    rarity: 'Common',
    weight: 18,
    value: {
      item: {
        name: 'Energy Boost',
        type: ItemType.Pill,
        description: 'Greatly increases progression speed for a short duration.',
        quantity: 1,
        rarity: 'Common',
        effect: { exp: 50 },
      },
    },
  },
  {
    id: 'lottery-pill-qi-2',
    name: 'Energy Boost x3',
    type: 'item',
    rarity: 'Common',
    weight: 12,
    value: {
      item: {
        name: 'Energy Boost',
        type: ItemType.Pill,
        description: 'Greatly increases progression speed for a short duration.',
        quantity: 3,
        rarity: 'Common',
        effect: { exp: 50 },
      },
    },
  },
  {
    id: 'lottery-pill-heal',
    name: 'Heal Shot',
    type: 'item',
    rarity: 'Rare',
    weight: 15,
    value: {
      item: {
        name: 'Heal Shot',
        type: ItemType.Pill,
        description: 'A standard medical shot that quickly stabilizes wounds.',
        quantity: 1,
        rarity: 'Rare',
        effect: { hp: 200 },
      },
    },
  },
  {
    id: 'lottery-pill-marrow',
    name: 'Gen-Purge Chem',
    type: 'item',
    rarity: 'Rare',
    weight: 10,
    value: {
      item: {
        name: 'Gen-Purge Chem',
        type: ItemType.Pill,
        description: 'Purges genetic defects, resetting internal balance.',
        quantity: 1,
        rarity: 'Rare',
        effect: { hp: 50 },
      },
    },
  },
  {
    id: 'lottery-pill-foundation',
    name: 'Evolution Catalyst',
    type: 'item',
    rarity: 'Rare',
    weight: 8,
    value: {
      item: {
        name: 'Evolution Catalyst',
        type: ItemType.Pill,
        description: 'Increases the success rate of breakthrough to the next survival tier.',
        quantity: 1,
        rarity: 'Legendary',
        effect: { exp: 500 },
      },
    },
  },
  {
    id: 'lottery-pill-golden',
    name: 'Core Fusion Catalyst',
    type: 'item',
    rarity: 'Legendary',
    weight: 6,
    value: {
      item: {
        name: 'Core Fusion Catalyst',
        type: ItemType.Pill,
        description: 'A rare catalyst that aids in core fusion. Permanently increases perception.',
        quantity: 1,
        rarity: 'Rare',
        effect: { exp: 30000, spirit: 20 },
        permanentEffect: { spirit: 50, maxHp: 200 },
      },
    },
  },
  {
    id: 'lottery-pill-soul',
    name: 'Neural Link Stim',
    type: 'item',
    rarity: 'Legendary',
    weight: 4,
    value: {
      item: {
        name: 'Neural Link Stim',
        type: ItemType.Pill,
        description: 'A precious stim that enhances neural links. Permanently increases perception and resonance.',
        quantity: 1,
        rarity: 'Legendary',
        effect: { exp: 10000, spirit: 50, hp: 300 },
        permanentEffect: { spirit: 100, maxHp: 300, attack: 50 },
      },
    },
  },
  {
    id: 'lottery-pill-dragon',
    name: 'Titan Serum',
    type: 'item',
    rarity: 'Legendary',
    weight: 3,
    value: {
      item: {
        name: 'Titan Serum',
        type: ItemType.Pill,
        description: 'Infused with the essence of a titan-class mutant. Massively increases HP limit.',
        quantity: 1,
        rarity: 'Legendary',
        permanentEffect: { maxHp: 500, physique: 50 },
      },
    },
  },
  {
    id: 'lottery-pill-phoenix',
    name: 'Phoenix Protocol',
    type: 'item',
    rarity: 'Legendary',
    weight: 2,
    value: {
      item: {
        name: 'Phoenix Protocol',
        type: ItemType.Pill,
        description: 'A stim containing phoenix-regenerative data. Grants massive combat boosts.',
        quantity: 1,
        rarity: 'Legendary',
        effect: { hp: 800, exp: 1500, attack: 30 },
        permanentEffect: { maxHp: 400, attack: 100, defense: 100, spirit: 80, physique: 80, speed: 50 },
      },
    },
  },
  {
    id: 'lottery-pill-immortal',
    name: 'Singularity Stim',
    type: 'item',
    rarity: 'Mythic',
    weight: 1,
    value: {
      item: {
        name: 'Singularity Stim',
        type: ItemType.Pill,
        description: 'A mythic stimulus that pushes the body to its absolute limits, granting massive permanent boosts.',
        quantity: 1,
        rarity: 'Mythic',
        effect: { exp: 50000 },
        permanentEffect: { maxLifespan: 1000, spirit: 1000, attack: 1000, defense: 1000, physique: 1000, speed: 1000 },
      },
    },
  },

  // Common Rewards - Materials
  {
    id: 'lottery-material-refining',
    name: 'Scrap Metal',
    type: 'item',
    rarity: 'Common',
    weight: 16,
    value: {
      item: {
        name: 'Scrap Metal',
        type: ItemType.Material,
        description: 'Basic material used for strengthening equipment.',
        quantity: 5,
        rarity: 'Common',
      },
    },
  },
  {
    id: 'lottery-material-refining-2',
    name: 'Scrap Metal x10',
    type: 'item',
    rarity: 'Common',
    weight: 10,
    value: {
      item: {
        name: 'Scrap Metal',
        type: ItemType.Material,
        description: 'Basic material used for strengthening equipment.',
        quantity: 10,
        rarity: 'Common',
      },
    },
  },
  {
    id: 'lottery-material-upgrade-stone',
    name: 'Hardener',
    type: 'item',
    rarity: 'Rare',
    weight: 10,
    value: {
      item: {
        name: 'Hardener',
        type: ItemType.Material,
        description: 'A precious chemical that increases the success rate of gear optimization by 10%.',
        quantity: 1,
        rarity: 'Rare',
      },
    },
  },
  {
    id: 'lottery-material-upgrade-stone-3',
    name: 'Hardener x10',
    type: 'item',
    rarity: 'Legendary',
    weight: 3,
    value: {
      item: {
        name: 'Hardener',
        type: ItemType.Material,
        description: 'A precious chemical that increases the success rate of gear optimization by 10%.',
        quantity: 10,
        rarity: 'Rare',
      },
    },
  },
  {
    id: 'lottery-material-spirit',
    name: 'Caps Cache',
    type: 'item',
    rarity: 'Common',
    weight: 14,
    value: {
      item: {
        name: 'Caps Cache',
        type: ItemType.Material,
        description: 'A small cache of pre-war bottle caps.',
        quantity: 10,
        rarity: 'Common',
      },
    },
  },
  {
    id: 'lottery-material-iron',
    name: 'Refined Steel',
    type: 'item',
    rarity: 'Common',
    weight: 12,
    value: {
      item: {
        name: 'Refined Steel',
        type: ItemType.Material,
        description: 'Refined steel, ideal for crafting high-quality gear.',
        quantity: 5,
        rarity: 'Common',
      },
    },
  },
  {
    id: 'lottery-material-silver',
    name: 'Advanced Alloy',
    type: 'item',
    rarity: 'Rare',
    weight: 7,
    value: {
      item: {
        name: 'Advanced Alloy',
        type: ItemType.Material,
        description: 'A rare alloy that significantly improves tool quality.',
        quantity: 3,
        rarity: 'Rare',
      },
    },
  },
  {
    id: 'lottery-material-dragon-scale',
    name: 'Deathclaw Hide',
    type: 'item',
    rarity: 'Legendary',
    weight: 3,
    value: {
      item: {
        name: 'Deathclaw Hide',
        type: ItemType.Material,
        description: 'A thick, near-indestructible scale from a prime mutant.',
        quantity: 1,
        rarity: 'Legendary',
      },
    },
  },
  {
    id: 'lottery-material-herb',
    name: 'Glowing Fungus',
    type: 'item',
    rarity: 'Common',
    weight: 15,
    value: {
      item: {
        name: 'Glowing Fungus',
        type: ItemType.Herb,
        description: 'A neon-green mushroom. Essential for synthesizing RadAway.',
        quantity: 10,
        rarity: 'Common',
      },
    },
  },
  {
    id: 'lottery-material-herb-2',
    name: 'Glowing Fungus x20',
    type: 'item',
    rarity: 'Common',
    weight: 10,
    value: {
      item: {
        name: 'Glowing Fungus',
        type: ItemType.Herb,
        description: 'A neon-green mushroom. Essential for synthesizing RadAway.',
        quantity: 20,
        rarity: 'Common',
      },
    },
  },
  {
    id: 'lottery-material-rare',
    name: 'Mutated Fern',
    type: 'item',
    rarity: 'Rare',
    weight: 8,
    value: {
      item: {
        name: 'Mutated Fern',
        type: ItemType.Herb,
        description: 'A rare flower used in genetic purging chemicals.',
        quantity: 3,
        rarity: 'Rare',
      },
    },
  },
  {
    id: 'lottery-material-snow-lotus',
    name: 'Glow Pod',
    type: 'item',
    rarity: 'Rare',
    weight: 6,
    value: {
      item: {
        name: 'Glow Pod',
        type: ItemType.Herb,
        description: 'A glowing flower that grows in frozen radioactive zones.',
        quantity: 2,
        rarity: 'Rare',
      },
    },
  },
  {
    id: 'lottery-material-legend',
    name: 'Ash Rose',
    type: 'item',
    rarity: 'Legendary',
    weight: 4,
    value: {
      item: {
        name: 'Ash Rose',
        type: ItemType.Herb,
        description: 'An ancient root containing immense biological data.',
        quantity: 2,
        rarity: 'Legendary',
      },
    },
  },
  {
    id: 'lottery-material-phoenix-feather',
    name: 'Scorchbeast Wing',
    type: 'item',
    rarity: 'Legendary',
    weight: 2,
    value: {
      item: {
        name: 'Scorchbeast Wing',
        type: ItemType.Material,
        description: 'A wing membrane that never stops smoldering with phoenix energy.',
        quantity: 1,
        rarity: 'Legendary',
      },
    },
  },

  // Common Rewards - Weapons
  {
    id: 'lottery-weapon-iron',
    name: 'Refined Machete',
    type: 'item',
    rarity: 'Common',
    weight: 10,
    value: {
      item: {
        name: 'Refined Machete',
        type: ItemType.Weapon,
        description: 'A sharp machete forged from refined steel.',
        quantity: 1,
        rarity: 'Common',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Weapon,
        effect: { attack: 10 },
      },
    },
  },
  {
    id: 'lottery-weapon-bronze',
    name: 'Combat Knife',
    type: 'item',
    rarity: 'Common',
    weight: 9,
    value: {
      item: {
        name: 'Combat Knife',
        type: ItemType.Weapon,
        description: 'A standard-issue combat knife, still very sharp.',
        quantity: 1,
        rarity: 'Common',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Weapon,
        effect: { attack: 12 },
      },
    },
  },
  {
    id: 'lottery-weapon-frost',
    name: 'Cryo-Blade',
    type: 'item',
    rarity: 'Rare',
    weight: 6,
    value: {
      item: {
        name: 'Cryo-Blade',
        type: ItemType.Weapon,
        description: 'A blade that emits a chilling aura, cutting through armor easily.',
        quantity: 1,
        rarity: 'Rare',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Weapon,
        effect: { attack: 15 },
      },
    },
  },
  {
    id: 'lottery-weapon-fire',
    name: 'Flame Spear',
    type: 'item',
    rarity: 'Rare',
    weight: 5,
    value: {
      item: {
        name: 'Flame Spear',
        type: ItemType.Weapon,
        description: 'A spear burning with high-intensity thermal energy.',
        quantity: 1,
        rarity: 'Rare',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Weapon,
        effect: { attack: 18, hp: 20 },
      },
    },
  },
  {
    id: 'lottery-weapon-thunder',
    name: 'Volt-Sword',
    type: 'item',
    rarity: 'Rare',
    weight: 4,
    value: {
      item: {
        name: 'Volt-Sword',
        type: ItemType.Weapon,
        description: 'A sword crackling with electrical energy, incredibly fast.',
        quantity: 1,
        rarity: 'Rare',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Weapon,
        effect: { attack: 20, speed: 10 },
      },
    },
  },
  {
    id: 'lottery-weapon-sky',
    name: 'Apex Cleaver',
    type: 'item',
    rarity: 'Legendary',
    weight: 2,
    value: {
      item: {
        name: 'Apex Cleaver',
        type: ItemType.Weapon,
        description: 'A legendary cleaver that slices through reality itself.',
        quantity: 1,
        rarity: 'Legendary',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Weapon,
        effect: { attack: 200, defense: 50 },
      },
    },
  },
  {
    id: 'lottery-weapon-dragon',
    name: 'Wyrm Slayer',
    type: 'item',
    rarity: 'Legendary',
    weight: 2,
    value: {
      item: {
        name: 'Wyrm Slayer',
        type: ItemType.Weapon,
        description: 'A massive blade said to have slain prime mutants.',
        quantity: 1,
        rarity: 'Legendary',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Weapon,
        effect: { attack: 220, defense: 40, hp: 100 },
      },
    },
  },
  {
    id: 'lottery-weapon-immortal',
    name: 'God-Killer Blade',
    type: 'item',
    rarity: 'Mythic',
    weight: 2,
    value: {
      item: {
        name: 'God-Killer Blade',
        type: ItemType.Weapon,
        description: 'A mythic blade capable of slaying even the most ascended entities.',
        quantity: 1,
        rarity: 'Mythic',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Weapon,
        effect: { attack: 3000, defense: 200, hp: 500, spirit: 100 },
      },
    },
  },

  // Common Rewards - Armor
  {
    id: 'lottery-armor-cloth',
    name: 'Scavenger Vest',
    type: 'item',
    rarity: 'Common',
    weight: 10,
    value: {
      item: {
        name: 'Scavenger Vest',
        type: ItemType.Armor,
        description: 'A basic vest patched together from various scraps.',
        quantity: 1,
        rarity: 'Common',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Chest,
        effect: { defense: 5, hp: 20 },
      },
    },
  },
  {
    id: 'lottery-armor-leather',
    name: 'Leathery Plate',
    type: 'item',
    rarity: 'Common',
    weight: 9,
    value: {
      item: {
        name: 'Leathery Plate',
        type: ItemType.Armor,
        description: 'Reinforced leather armor, tougher than a simple vest.',
        quantity: 1,
        rarity: 'Common',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Chest,
        effect: { defense: 8, hp: 30 },
      },
    },
  },
  {
    id: 'lottery-armor-cloud',
    name: 'Tactical Plating',
    type: 'item',
    rarity: 'Rare',
    weight: 6,
    value: {
      item: {
        name: 'Tactical Plating',
        type: ItemType.Armor,
        description: 'High-density tactical plating used by elite scouts.',
        quantity: 1,
        rarity: 'Rare',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Chest,
        effect: { defense: 15, hp: 50 },
      },
    },
  },
  {
    id: 'lottery-armor-iron',
    name: 'Steel Carapace',
    type: 'item',
    rarity: 'Rare',
    weight: 5,
    value: {
      item: {
        name: 'Steel Carapace',
        type: ItemType.Armor,
        description: 'A heavy steel carapace that provides excellent defense.',
        quantity: 1,
        rarity: 'Rare',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Chest,
        effect: { defense: 20, hp: 60 },
      },
    },
  },
  {
    id: 'lottery-armor-dragon',
    name: 'Primal Plate',
    type: 'item',
    rarity: 'Legendary',
    weight: 2,
    value: {
      item: {
        name: 'Primal Plate',
        type: ItemType.Armor,
        description: 'Plate armor crafted from the scales of a prime mutant.',
        quantity: 1,
        rarity: 'Legendary',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Chest,
        effect: { defense: 150, hp: 500, attack: 30 },
      },
    },
  },
  {
    id: 'lottery-armor-phoenix',
    name: 'Thermal Mesh',
    type: 'item',
    rarity: 'Legendary',
    weight: 2,
    value: {
      item: {
        name: 'Thermal Mesh',
        type: ItemType.Armor,
        description: 'Advanced thermal mesh that regulates body temperature and absorbs impacts.',
        quantity: 1,
        rarity: 'Legendary',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Chest,
        effect: { defense: 140, hp: 450, speed: 30, spirit: 40 },
      },
    },
  },
  {
    id: 'lottery-armor-immortal',
    name: 'Aegis Exoskeleton',
    type: 'item',
    rarity: 'Mythic',
    weight: 2,
    value: {
      item: {
        name: 'Aegis Exoskeleton',
        type: ItemType.Armor,
        description: 'A mythic exoskeleton containing pre-war aegis technology.',
        quantity: 1,
        rarity: 'Mythic',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Chest,
        effect: { defense: 800, hp: 3000, attack: 100, spirit: 200 },
      },
    },
  },

  // Common Rewards - Equipment (Accessories)
  {
    id: 'lottery-ring-copper',
    name: 'Dilapidated Ring',
    type: 'item',
    rarity: 'Common',
    weight: 9,
    value: {
      item: {
        name: 'Dilapidated Ring',
        type: ItemType.Ring,
        description: 'A worn-out ring found in the ruins, providing minor protection.',
        quantity: 1,
        rarity: 'Common',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Ring1,
        effect: { attack: 2, defense: 2 },
      },
    },
  },
  {
    id: 'lottery-ring-silver',
    name: 'Alloy Ring',
    type: 'item',
    rarity: 'Common',
    weight: 8,
    value: {
      item: {
        name: 'Alloy Ring',
        type: ItemType.Ring,
        description: 'A ring made from basic alloys, polished slightly.',
        quantity: 1,
        rarity: 'Common',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Ring1,
        effect: { defense: 5 },
      },
    },
  },
  {
    id: 'lottery-ring-gold',
    name: 'Golden-Hued Ring',
    type: 'item',
    rarity: 'Rare',
    weight: 5,
    value: {
      item: {
        name: 'Golden-Hued Ring',
        type: ItemType.Ring,
        description: 'A ring made from a high-quality alloy with a golden sheen.',
        quantity: 1,
        rarity: 'Rare',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Ring1,
        effect: { attack: 15, defense: 15 },
      },
    },
  },
  {
    id: 'lottery-ring-star',
    name: 'Starlight Ring',
    type: 'item',
    rarity: 'Legendary',
    weight: 2,
    value: {
      item: {
        name: 'Starlight Ring',
        type: ItemType.Ring,
        description: 'A ring that pulses with faint starlight-like energy.',
        quantity: 1,
        rarity: 'Legendary',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Ring1,
        effect: { attack: 40, defense: 40, speed: 20 },
      },
    },
  },
  {
    id: 'lottery-ring-daopath',
    name: 'Nova Ring',
    type: 'item',
    rarity: 'Mythic',
    weight: 2,
    value: {
      item: {
        name: 'Nova Ring',
        type: ItemType.Ring,
        description: 'A ring that harnesses the power of a dying star.',
        quantity: 1,
        rarity: 'Mythic',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Ring1,
        effect: { attack: 1000, defense: 1000, speed: 1000, spirit: 1000 },
      },
    },
  },
  {
    id: 'lottery-accessory-protect',
    name: 'Luck Bead',
    type: 'item',
    rarity: 'Common',
    weight: 5,
    value: {
      item: {
        name: 'Luck Bead',
        type: ItemType.Accessory,
        description: 'A simple bead said to bring luck to survivors.',
        quantity: 1,
        rarity: 'Common',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Accessory1,
        effect: { defense: 3, hp: 15 },
      },
    },
  },
  {
    id: 'lottery-accessory-jade',
    name: 'Focus Lens',
    type: 'item',
    rarity: 'Rare',
    weight: 4,
    value: {
      item: {
        name: 'Focus Lens',
        type: ItemType.Accessory,
        description: 'A glass lens that helps survivors concentrate their thoughts.',
        quantity: 1,
        rarity: 'Rare',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Accessory1,
        effect: { spirit: 30, hp: 80, defense: 15 },
      },
    },
  },
  {
    id: 'lottery-accessory-immortal',
    name: 'Primal Lens',
    type: 'item',
    rarity: 'Legendary',
    weight: 2,
    value: {
      item: {
        name: 'Primal Lens',
        type: ItemType.Accessory,
        description: 'A legendary lens infused with primal biological energy.',
        quantity: 1,
        rarity: 'Legendary',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Accessory1,
        effect: { attack: 50, defense: 50, hp: 300, spirit: 80 },
      },
    },
  },
  {
    id: 'lottery-accessory-shenpath',
    name: 'Bio-Resonance Bead',
    type: 'item',
    rarity: 'Mythic',
    weight: 2,
    value: {
      item: {
        name: 'Bio-Resonance Bead',
        type: ItemType.Accessory,
        description: 'A bead that resonates with the deep biological code of the world.',
        quantity: 1,
        rarity: 'Mythic',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Accessory1,
        effect: { attack: 2000, defense: 400, hp: 500, spirit: 30000 },
      },
    },
  },

  // Common Rewards - Artifacts
  {
    id: 'lottery-artifact-common-1',
    name: 'Energy Siphon',
    type: 'item',
    rarity: 'Common',
    weight: 6,
    value: {
      item: {
        name: 'Energy Siphon',
        type: ItemType.Artifact,
        description: 'A device that siphons energy from the environment, slightly boosting progression.',
        quantity: 1,
        rarity: 'Common',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Artifact1,
        effect: { spirit: 10, exp: 5 },
      },
    },
  },
  {
    id: 'lottery-artifact-common-2',
    name: 'Shield Generator',
    type: 'item',
    rarity: 'Common',
    weight: 6,
    value: {
      item: {
        name: 'Shield Generator',
        type: ItemType.Artifact,
        description: 'A small deflector that provides basic protection against impacts.',
        quantity: 1,
        rarity: 'Common',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Artifact1,
        effect: { defense: 10, hp: 30 },
      },
    },
  },
  {
    id: 'lottery-artifact-rare-1',
    name: 'Neural Mirror',
    type: 'item',
    rarity: 'Rare',
    weight: 4,
    value: {
      item: {
        name: 'Neural Mirror',
        type: ItemType.Artifact,
        description: 'A mirror that reflects neural signals, boosting perception and defense.',
        quantity: 1,
        rarity: 'Rare',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Artifact1,
        effect: { spirit: 30, defense: 20 },
      },
    },
  },
  {
    id: 'lottery-artifact-rare-2',
    name: 'Pulse Emitter',
    type: 'item',
    rarity: 'Rare',
    weight: 4,
    value: {
      item: {
        name: 'Pulse Emitter',
        type: ItemType.Artifact,
        description: 'Emits high-frequency pulses that disorient mutants and protect the user.',
        quantity: 1,
        rarity: 'Rare',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Artifact1,
        effect: { attack: 100, defense: 50, hp: 200, spirit: 20 },
      },
    },
  },
  {
    id: 'lottery-artifact-rare-3',
    name: 'Flux Device',
    type: 'item',
    rarity: 'Rare',
    weight: 3,
    value: {
      item: {
        name: 'Flux Device',
        type: ItemType.Artifact,
        description: 'A device that manipulates local energy flux for offense and defense.',
        quantity: 1,
        rarity: 'Rare',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Artifact1,
        effect: { attack: 90, defense: 70, hp: 220 },
      },
    },
  },
  {
    id: 'lottery-artifact-legend-1',
    name: 'Starlight Matrix',
    type: 'item',
    rarity: 'Legendary',
    weight: 2,
    value: {
      item: {
        name: 'Starlight Matrix',
        type: ItemType.Artifact,
        description: 'A complex matrix that taps into stellar radiation for power.',
        quantity: 1,
        rarity: 'Legendary',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Artifact1,
        effect: { attack: 50, defense: 50, spirit: 50 },
      },
    },
  },
  {
    id: 'lottery-artifact-legend-2',
    name: 'Void Obelisk',
    type: 'item',
    rarity: 'Legendary',
    weight: 2,
    value: {
      item: {
        name: 'Void Obelisk',
        type: ItemType.Artifact,
        description: 'A dark obelisk that suppresses enemy energy signatures.',
        quantity: 1,
        rarity: 'Legendary',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Artifact1,
        effect: { attack: 500, defense: 300, hp: 1000, spirit: 80 },
      },
    },
  },
  {
    id: 'lottery-artifact-legend-3',
    name: 'Void Crucible',
    type: 'item',
    rarity: 'Legendary',
    weight: 1,
    value: {
      item: {
        name: 'Void Crucible',
        type: ItemType.Artifact,
        description: 'A crucible that distills the power of the void into combat enhancements.',
        quantity: 1,
        rarity: 'Legendary',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Artifact1,
        effect: { attack: 550, defense: 250, hp: 1100, spirit: 120 },
      },
    },
  },
  {
    id: 'lottery-artifact-immortal-1',
    name: 'Primal Sphere',
    type: 'item',
    rarity: 'Mythic',
    weight: 1,
    value: {
      item: {
        name: 'Primal Sphere',
        type: ItemType.Artifact,
        description: 'An essence sphere pulsing with the life force of the world.',
        quantity: 1,
        rarity: 'Mythic',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Artifact1,
        effect: { attack: 150, defense: 150, spirit: 150, hp: 500 },
      },
    },
  },
  {
    id: 'lottery-artifact-immortal-2',
    name: 'Balance Matrix',
    type: 'item',
    rarity: 'Mythic',
    weight: 1,
    value: {
      item: {
        name: 'Balance Matrix',
        type: ItemType.Artifact,
        description: 'A mythic matrix that perfectly balances internal and external energies.',
        quantity: 1,
        rarity: 'Mythic',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Artifact1,
        effect: { attack: 2000, defense: 1000, hp: 5000, spirit: 600 },
      },
    },
  },
  {
    id: 'lottery-artifact-immortal-3',
    name: 'Void Sigil',
    type: 'item',
    rarity: 'Mythic',
    weight: 1,
    value: {
      item: {
        name: 'Void Sigil',
        type: ItemType.Artifact,
        description: 'A sigil containing the primordial power of the beginning and end.',
        quantity: 1,
        rarity: 'Mythic',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Artifact1,
        effect: { attack: 2200, defense: 1100, hp: 5500, spirit: 550 },
      },
    },
  },

  // Common Rewards - Headgear
  {
    id: 'lottery-head-cloth',
    name: 'Scavenger Cap',
    type: 'item',
    rarity: 'Common',
    weight: 8,
    value: {
      item: {
        name: 'Scavenger Cap',
        type: ItemType.Armor,
        description: 'A basic cap patched together from rags.',
        quantity: 1,
        rarity: 'Common',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Head,
        effect: { defense: 3, hp: 15 },
      },
    },
  },
  {
    id: 'lottery-head-iron',
    name: 'Refined Helmet',
    type: 'item',
    rarity: 'Common',
    weight: 7,
    value: {
      item: {
        name: 'Refined Helmet',
        type: ItemType.Armor,
        description: 'A helmet made from refined steel, offering decent protection.',
        quantity: 1,
        rarity: 'Common',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Head,
        effect: { defense: 8, hp: 30 },
      },
    },
  },
  {
    id: 'lottery-head-mystic',
    name: 'Tactical Helmet',
    type: 'item',
    rarity: 'Rare',
    weight: 4,
    value: {
      item: {
        name: 'Tactical Helmet',
        type: ItemType.Armor,
        description: 'An advanced tactical helmet with built-in sensors.',
        quantity: 1,
        rarity: 'Rare',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Head,
        effect: { defense: 25, hp: 60, spirit: 10 },
      },
    },
  },
  {
    id: 'lottery-head-star',
    name: 'Resonance Visor',
    type: 'item',
    rarity: 'Legendary',
    weight: 2,
    value: {
      item: {
        name: 'Resonance Visor',
        type: ItemType.Armor,
        description: 'A high-tech visor that resonates with background energy.',
        quantity: 1,
        rarity: 'Legendary',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Head,
        effect: { defense: 60, hp: 150, spirit: 20, attack: 10 },
      },
    },
  },
  {
    id: 'lottery-head-immortal',
    name: 'Apex Helm',
    type: 'item',
    rarity: 'Mythic',
    weight: 1,
    value: {
      item: {
        name: 'Apex Helm',
        type: ItemType.Armor,
        description: 'An apex-tier helmet containing advanced pre-war technology.',
        quantity: 1,
        rarity: 'Mythic',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Head,
        effect: { defense: 150, hp: 400, spirit: 50, attack: 30 },
      },
    },
  },

  // Common Rewards - Shoulders
  {
    id: 'lottery-shoulder-cloth',
    name: 'Scavenger Pauldrons',
    type: 'item',
    rarity: 'Common',
    weight: 8,
    value: {
      item: {
        name: 'Scavenger Pauldrons',
        type: ItemType.Armor,
        description: 'Basic shoulder protection made from salvaged materials.',
        quantity: 1,
        rarity: 'Common',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Shoulder,
        effect: { defense: 3, hp: 15 },
      },
    },
  },
  {
    id: 'lottery-shoulder-iron',
    name: 'Refined Pauldrons',
    type: 'item',
    rarity: 'Common',
    weight: 7,
    value: {
      item: {
        name: 'Refined Pauldrons',
        type: ItemType.Armor,
        description: 'Shoulder guards made from refined steel.',
        quantity: 1,
        rarity: 'Common',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Shoulder,
        effect: { defense: 8, hp: 30 },
      },
    },
  },
  {
    id: 'lottery-shoulder-mystic',
    name: 'Tactical Pauldrons',
    type: 'item',
    rarity: 'Rare',
    weight: 4,
    value: {
      item: {
        name: 'Tactical Pauldrons',
        type: ItemType.Armor,
        description: 'Reinforced tactical shoulder guards for extra protection.',
        quantity: 1,
        rarity: 'Rare',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Shoulder,
        effect: { defense: 25, hp: 60, spirit: 10 },
      },
    },
  },
  {
    id: 'lottery-shoulder-star',
    name: 'Resonance Pauldrons',
    type: 'item',
    rarity: 'Legendary',
    weight: 2,
    value: {
      item: {
        name: 'Resonance Pauldrons',
        type: ItemType.Armor,
        description: 'Shoulder guards that resonate with high-intensity radiation.',
        quantity: 1,
        rarity: 'Legendary',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Shoulder,
        effect: { defense: 60, hp: 150, spirit: 20, attack: 10 },
      },
    },
  },
  {
    id: 'lottery-shoulder-immortal',
    name: 'Apex Pauldrons',
    type: 'item',
    rarity: 'Mythic',
    weight: 1,
    value: {
      item: {
        name: 'Apex Pauldrons',
        type: ItemType.Armor,
        description: 'Apex-tier shoulder guards belonging to the legendary protectors.',
        quantity: 1,
        rarity: 'Mythic',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Shoulder,
        effect: { defense: 150, hp: 400, spirit: 50, attack: 30 },
      },
    },
  },

  // Common Rewards - Gloves
  {
    id: 'lottery-gloves-cloth',
    name: 'Scavenger Gloves',
    type: 'item',
    rarity: 'Common',
    weight: 8,
    value: {
      item: {
        name: 'Scavenger Gloves',
        type: ItemType.Armor,
        description: 'Simple gloves for handling rough materials.',
        quantity: 1,
        rarity: 'Common',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Gloves,
        effect: { defense: 3, hp: 15 },
      },
    },
  },
  {
    id: 'lottery-gloves-iron',
    name: 'Refined Gauntlets',
    type: 'item',
    rarity: 'Common',
    weight: 7,
    value: {
      item: {
        name: 'Refined Gauntlets',
        type: ItemType.Armor,
        description: 'Gauntlets made from refined steel for better protection.',
        quantity: 1,
        rarity: 'Common',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Gloves,
        effect: { defense: 8, hp: 30 },
      },
    },
  },
  {
    id: 'lottery-gloves-mystic',
    name: 'Tactical Gauntlets',
    type: 'item',
    rarity: 'Rare',
    weight: 4,
    value: {
      item: {
        name: 'Tactical Gauntlets',
        type: ItemType.Armor,
        description: 'Tactical gauntlets with enhanced grip and protection.',
        quantity: 1,
        rarity: 'Rare',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Gloves,
        effect: { defense: 25, hp: 60, spirit: 10 },
      },
    },
  },
  {
    id: 'lottery-gloves-star',
    name: 'Resonance Gauntlets',
    type: 'item',
    rarity: 'Legendary',
    weight: 2,
    value: {
      item: {
        name: 'Resonance Gauntlets',
        type: ItemType.Armor,
        description: 'Gauntlets that channel high-intensity energy for the wearer.',
        quantity: 1,
        rarity: 'Legendary',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Gloves,
        effect: { defense: 60, hp: 150, spirit: 20, attack: 10 },
      },
    },
  },
  {
    id: 'lottery-gloves-immortal',
    name: 'Apex Gauntlets',
    type: 'item',
    rarity: 'Mythic',
    weight: 1,
    value: {
      item: {
        name: 'Apex Gauntlets',
        type: ItemType.Armor,
        description: 'Apex-tier gauntlets capable of handling immense power.',
        quantity: 1,
        rarity: 'Mythic',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Gloves,
        effect: { defense: 150, hp: 400, spirit: 50, attack: 30 },
      },
    },
  },

  // Common Rewards - Legs
  {
    id: 'lottery-legs-cloth',
    name: 'Scavenger Trousers',
    type: 'item',
    rarity: 'Common',
    weight: 8,
    value: {
      item: {
        name: 'Scavenger Trousers',
        type: ItemType.Armor,
        description: 'Basic trousers patched together from various fabrics.',
        quantity: 1,
        rarity: 'Common',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Legs,
        effect: { defense: 4, hp: 18 },
      },
    },
  },
  {
    id: 'lottery-legs-iron',
    name: 'Refined Leg-Guards',
    type: 'item',
    rarity: 'Common',
    weight: 7,
    value: {
      item: {
        name: 'Refined Leg-Guards',
        type: ItemType.Armor,
        description: 'Leg guards made from refined steel.',
        quantity: 1,
        rarity: 'Common',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Legs,
        effect: { defense: 10, hp: 40 },
      },
    },
  },
  {
    id: 'lottery-legs-mystic',
    name: 'Tactical Leg-Guards',
    type: 'item',
    rarity: 'Rare',
    weight: 4,
    value: {
      item: {
        name: 'Tactical Leg-Guards',
        type: ItemType.Armor,
        description: 'Reinforced tactical leg guards for extra protection.',
        quantity: 1,
        rarity: 'Rare',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Legs,
        effect: { defense: 30, hp: 80 },
      },
    },
  },
  {
    id: 'lottery-legs-star',
    name: 'Resonance Leg-Guards',
    type: 'item',
    rarity: 'Legendary',
    weight: 2,
    value: {
      item: {
        name: 'Resonance Leg-Guards',
        type: ItemType.Armor,
        description: 'Leg guards that resonate with high-intensity radiation.',
        quantity: 1,
        rarity: 'Legendary',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Legs,
        effect: { defense: 75, hp: 200, attack: 15 },
      },
    },
  },
  {
    id: 'lottery-legs-immortal',
    name: 'Apex Trousers',
    type: 'item',
    rarity: 'Mythic',
    weight: 1,
    value: {
      item: {
        name: 'Apex Trousers',
        type: ItemType.Armor,
        description: 'Apex-tier trousers containing advanced pre-war technology.',
        quantity: 1,
        rarity: 'Mythic',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Legs,
        effect: { defense: 180, hp: 500, spirit: 60 },
      },
    },
  },

  // Common Rewards - Boots
  {
    id: 'lottery-boots-cloth',
    name: 'Scavenger Boots',
    type: 'item',
    rarity: 'Common',
    weight: 8,
    value: {
      item: {
        name: 'Scavenger Boots',
        type: ItemType.Armor,
        description: 'Simple boots patched together from various scraps.',
        quantity: 1,
        rarity: 'Common',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Boots,
        effect: { defense: 3, speed: 2 },
      },
    },
  },
  {
    id: 'lottery-boots-iron',
    name: 'Refined Sabatons',
    type: 'item',
    rarity: 'Common',
    weight: 7,
    value: {
      item: {
        name: 'Refined Sabatons',
        type: ItemType.Armor,
        description: 'Sabatons made from refined steel.',
        quantity: 1,
        rarity: 'Common',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Boots,
        effect: { defense: 8, speed: 5 },
      },
    },
  },
  {
    id: 'lottery-boots-mystic',
    name: 'Tactical Sabatons',
    type: 'item',
    rarity: 'Rare',
    weight: 4,
    value: {
      item: {
        name: 'Tactical Sabatons',
        type: ItemType.Armor,
        description: 'Reinforced tactical sabatons for extra protection.',
        quantity: 1,
        rarity: 'Rare',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Boots,
        effect: { defense: 25, speed: 10 },
      },
    },
  },
  {
    id: 'lottery-boots-star',
    name: 'Resonance Boots',
    type: 'item',
    rarity: 'Legendary',
    weight: 2,
    value: {
      item: {
        name: 'Resonance Boots',
        type: ItemType.Armor,
        description: 'Boots that resonate with environmental energy for extreme speed.',
        quantity: 1,
        rarity: 'Legendary',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Boots,
        effect: { defense: 60, hp: 150, speed: 25 },
      },
    },
  },
  {
    id: 'lottery-boots-immortal',
    name: 'Apex Sabatons',
    type: 'item',
    rarity: 'Mythic',
    weight: 1,
    value: {
      item: {
        name: 'Apex Sabatons',
        type: ItemType.Armor,
        description: 'Apex-tier sabatons with integrated propulsion systems.',
        quantity: 1,
        rarity: 'Mythic',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Boots,
        effect: { defense: 150, hp: 400, speed: 60 },
      },
    },
  },

  // Common Rewards - Pets (Higher weight for better odds)
  {
    id: 'lottery-pet-fox',
    name: 'Spirit Fox',
    type: 'pet',
    rarity: 'Common',
    weight: 20,
    value: { petId: 'pet-spirit-fox' },
  },
  {
    id: 'lottery-pet-tiger',
    name: 'Thunder Tiger',
    type: 'pet',
    rarity: 'Rare',
    weight: 15,
    value: { petId: 'pet-thunder-tiger' },
  },
  {
    id: 'lottery-pet-phoenix',
    name: 'Phoenix',
    type: 'pet',
    rarity: 'Mythic',
    weight: 6,
    value: { petId: 'pet-phoenix' },
  },

  // Common Rewards - Recruitment Tickets
  {
    id: 'lottery-ticket-1',
    name: '1x Ticket',
    type: 'ticket',
    rarity: 'Common',
    weight: 15,
    value: { tickets: 1 },
  },
  {
    id: 'lottery-ticket-3',
    name: '3x Tickets',
    type: 'ticket',
    rarity: 'Rare',
    weight: 6,
    value: { tickets: 3 },
  },
  {
    id: 'lottery-ticket-5',
    name: '5x Tickets',
    type: 'ticket',
    rarity: 'Legendary',
    weight: 2,
    value: { tickets: 5 },
  },
  // Advanced Item Rewards (Rare)
  // Foundation Treasures
  ...Object.values(FOUNDATION_TREASURES).map((treasure) => ({
    id: `lottery-foundation-treasure-${treasure.id}`,
    name: treasure.name,
    type: 'item' as const,
    rarity: treasure.rarity as ItemRarity,
    weight: treasure.rarity === 'Mythic' ? 0.5 : treasure.rarity === 'Legendary' ? 1.5 : treasure.rarity === 'Rare' ? 2 : 3,
    value: {
      item: {
        name: treasure.name,
        type: ItemType.AdvancedItem,
        description: treasure.description,
        quantity: 1,
        rarity: treasure.rarity as ItemRarity,
        advancedItemType: 'foundationTreasure' as const,
        advancedItemId: treasure.id,
      },
    },
  })),
  // Heaven-Earth Essences
  ...Object.values(HEAVEN_EARTH_ESSENCES).map((essence) => ({
    id: `lottery-heaven-earth-essence-${essence.id}`,
    name: essence.name,
    type: 'item' as const,
    rarity: essence.rarity as ItemRarity,
    weight: essence.rarity === 'Mythic' ? 0.3 : essence.rarity === 'Legendary' ? 1 : essence.rarity === 'Rare' ? 1.5 : 2,
    value: {
      item: {
        name: essence.name,
        type: ItemType.AdvancedItem,
        description: essence.description,
        quantity: 1,
        rarity: essence.rarity as ItemRarity,
        advancedItemType: 'heavenEarthEssence' as const,
        advancedItemId: essence.id,
      },
    },
  })),
  // Heaven-Earth Marrows
  ...Object.values(HEAVEN_EARTH_MARROWS).map((marrow) => ({
    id: `lottery-heaven-earth-marrow-${marrow.id}`,
    name: marrow.name,
    type: 'item' as const,
    rarity: marrow.rarity as ItemRarity,
    weight: marrow.rarity === 'Mythic' ? 0.2 : marrow.rarity === 'Legendary' ? 0.8 : marrow.rarity === 'Rare' ? 1.2 : 1.5,
    value: {
      item: {
        name: marrow.name,
        type: ItemType.AdvancedItem,
        description: marrow.description,
        quantity: 1,
        rarity: marrow.rarity as ItemRarity,
        advancedItemType: 'heavenEarthMarrow' as const,
        advancedItemId: marrow.id,
      },
    },
  })),
  // Rule Power
  ...Object.values(LONGEVITY_RULES).map((rule) => ({
    id: `lottery-longevity-rule-${rule.id}`,
    name: rule.name,
    type: 'item' as const,
    rarity: 'Mythic' as ItemRarity,
    weight: 0.5,
    value: {
      item: {
        name: rule.name,
        type: ItemType.AdvancedItem,
        description: rule.description,
        quantity: 1,
        rarity: 'Mythic' as ItemRarity,
        advancedItemType: 'longevityRule' as const,
        advancedItemId: rule.id,
      },
    },
  })),
];

// Generate equipment prizes (10 per grade)
const equipmentTypes: ItemType[] = [ItemType.Weapon, ItemType.Armor, ItemType.Accessory, ItemType.Ring, ItemType.Artifact];
const equipmentRarities: Array<{ rarity: ItemRarity; label: string }> = [
  { rarity: 'Common', label: 'common' },
  { rarity: 'Rare', label: 'rare' },
  { rarity: 'Legendary', label: 'legend' },
  { rarity: 'Mythic', label: 'immortal' },
];

equipmentTypes.forEach(type => {
  equipmentRarities.forEach(({ rarity, label }) => {
    const generatedPrizes = generateLotteryPrizes({ type, rarity: rarity as any });
    LOTTERY_PRIZES.push(...generatedPrizes);
  });
});

// Generate shot prizes (10 per grade)
const pillRarities: Array<{ rarity: ItemRarity; weight: number }> = [
  { rarity: 'Common', weight: 15 },
  { rarity: 'Rare', weight: 10 },
  { rarity: 'Legendary', weight: 5 },
  { rarity: 'Mythic', weight: 2 },
];

pillRarities.forEach(({ rarity, weight }) => {
  const generatedPrizes = generateLotteryPrizes({ type: ItemType.Pill, rarity: rarity as any });
  // Adjust weight
  generatedPrizes.forEach(prize => {
    prize.weight = weight;
  });
  LOTTERY_PRIZES.push(...generatedPrizes);
});

// Generate biological sample prizes (10 per grade)
const herbRarities: Array<{ rarity: ItemRarity; weight: number }> = [
  { rarity: 'Common', weight: 15 },
  { rarity: 'Rare', weight: 10 },
  { rarity: 'Legendary', weight: 5 },
  { rarity: 'Mythic', weight: 2 },
];

herbRarities.forEach(({ rarity, weight }) => {
  const generatedPrizes = generateLotteryPrizes({ type: ItemType.Herb, rarity: rarity as any });
  // Adjust weight
  generatedPrizes.forEach(prize => {
    prize.weight = weight;
  });
  LOTTERY_PRIZES.push(...generatedPrizes);
});

// Generate material prizes (10 per grade)
const materialRarities: Array<{ rarity: ItemRarity; weight: number }> = [
  { rarity: 'Common', weight: 20 },
  { rarity: 'Rare', weight: 12 },
  { rarity: 'Legendary', weight: 6 },
  { rarity: 'Mythic', weight: 3 },
];

materialRarities.forEach(({ rarity, weight }) => {
  const generatedPrizes = generateLotteryPrizes({ type: ItemType.Material, rarity: rarity as any });
  // Adjust weight
  generatedPrizes.forEach(prize => {
    prize.weight = weight;
  });
  LOTTERY_PRIZES.push(...generatedPrizes);
});