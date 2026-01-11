/**
 * Advanced Item System Constants
 * Contains definitions for Foundation Treasures, Heaven Earth Essences, Heaven Earth Marrows, and Laws of Longevity.
 */

import { FoundationTreasure, HeavenEarthEssence, HeavenEarthMarrow, LongevityRule } from '../types';

// Foundation Treasure System
export const FOUNDATION_TREASURES: Record<string, FoundationTreasure> = {
  // Common Foundation Treasures (10 types)
  'ft_001': {
    id: 'ft_001',
    name: 'Green-Bio Graft',
    description: 'A bioluminescent graft infused with plant-based DNA, enhancing vitality.',
    rarity: 'Common',
    effects: { hpBonus: 500, spiritBonus: 50 },
    battleEffect: {
      type: 'heal',
      name: 'Bio-Recovery',
      description: 'Spend 10 survival days to restore 30% of max health.',
      cost: { lifespan: 10 },
      effect: {
        heal: { percentOfMaxHp: 0.3 }
      },
      cooldown: 3
    }
  },
  'ft_002': {
    id: 'ft_002',
    name: 'Thermal Core',
    description: 'A crystalline battery housing intense radioactive heat, boosting attack power.',
    rarity: 'Common',
    effects: { attackBonus: 100, physiqueBonus: 30 },
    battleEffect: {
      type: 'damage',
      name: 'Thermal Burn',
      description: 'Spend 5% max HP to deal 2.5x attack damage.',
      cost: { maxHp: 0.05 },
      effect: {
        damage: { multiplier: 2.5 }
      },
      cooldown: 2
    }
  },
  'ft_003': {
    id: 'ft_003',
    name: 'Deep-Void Essence',
    description: 'Condensed essence from the radioactive depths, boosting mental fortitude.',
    rarity: 'Common',
    effects: { spiritBonus: 80, defenseBonus: 40 },
    battleEffect: {
      type: 'buff',
      name: 'Dark-Water Guard',
      description: 'Spend 8 survival days to gain +40% defense for 2 turns.',
      cost: { lifespan: 8 },
      effect: {
        buff: { defense: 0.4, duration: 2 }
      },
      cooldown: 3
    }
  },
  'ft_004': {
    id: 'ft_004',
    name: 'Tectonic Core',
    description: 'A dense core salvaged from deep planetary crusts, enhancing physical armor.',
    rarity: 'Common',
    effects: { defenseBonus: 80, hpBonus: 300 },
    battleEffect: {
      type: 'heal',
      name: 'Tectonic Recovery',
      description: 'Spend 12 survival days to restore 25% of max health.',
      cost: { lifespan: 12 },
      effect: {
        heal: { percentOfMaxHp: 0.25 }
      },
      cooldown: 4
    }
  },
  'ft_005': {
    id: 'ft_005',
    name: 'Alloy Edge',
    description: 'A metallic shell infused with hyper-vibrating particles, boosting speed.',
    rarity: 'Common',
    effects: { speedBonus: 20, attackBonus: 60 },
    battleEffect: {
      type: 'damage',
      name: 'Armor-Pierce Slash',
      description: 'Spend 6 survival days to deal 2x attack damage, ignoring 20% defense.',
      cost: { lifespan: 6 },
      effect: {
        damage: { multiplier: 2, ignoreDefense: 0.2 }
      },
      cooldown: 2
    }
  },
  'ft_006': {
    id: 'ft_006',
    name: 'Ion-Feather',
    description: 'A feather charged with ionic energy, enhancing agility.',
    rarity: 'Common',
    effects: { speedBonus: 30, spiritBonus: 40 },
    battleEffect: {
      type: 'buff',
      name: 'Ion Surge',
      description: 'Spend 7 survival days to gain +50% speed for 3 turns.',
      cost: { lifespan: 7 },
      effect: {
        buff: { speed: 0.5, duration: 3 }
      },
      cooldown: 4
    }
  },
  'ft_007': {
    id: 'ft_007',
    name: 'Cryo-Marrow',
    description: 'A crystalline marrow harvested from sub-zero ruins, focusing mental energy.',
    rarity: 'Common',
    effects: { spiritBonus: 70, defenseBonus: 30 },
    battleEffect: {
      type: 'debuff',
      name: 'Cryo Burst',
      description: 'Spend 9 survival days to deal 1.8x attack damage and reduce enemy speed by 30% for 2 turns.',
      cost: { lifespan: 9 },
      effect: {
        damage: { multiplier: 1.8 },
        debuff: { speed: -0.3, duration: 2 }
      },
      cooldown: 3
    }
  },
  'ft_008': {
    id: 'ft_008',
    name: 'Magma Heart',
    description: 'A pulsing core salvaged from a volcanic fissure, boosting endurance.',
    rarity: 'Common',
    effects: { physiqueBonus: 50, hpBonus: 400 },
    battleEffect: {
      type: 'damage',
      name: 'Lava Eruption',
      description: 'Spend 10 survival days to deal 2.2x attack damage with a burning effect.',
      cost: { lifespan: 10 },
      effect: {
        damage: { multiplier: 2.2 },
        debuff: { hp: -0.05, duration: 2 }
      },
      cooldown: 3
    }
  },
  'ft_009': {
    id: 'ft_009',
    name: 'Pulsar Shard',
    description: 'A fragment of a meteorite emitting rhythmic energy pulses, boosting focus.',
    rarity: 'Common',
    effects: { spiritBonus: 60, speedBonus: 15 },
    battleEffect: {
      type: 'buff',
      name: 'Stellar Might',
      description: 'Spend 8 survival days to gain +40% spirit and +20% speed for 2 turns.',
      cost: { lifespan: 8 },
      effect: {
        buff: { spirit: 0.4, speed: 0.2, duration: 2 }
      },
      cooldown: 3
    }
  },
  'ft_010': {
    id: 'ft_010',
    name: 'Lunar Mist',
    description: 'A rare luminescent condensation found in moonlit ruins, enhancing vitality.',
    rarity: 'Common',
    effects: { hpBonus: 350, spiritBonus: 45 },
    battleEffect: {
      type: 'heal',
      name: 'Lunar Blessing',
      description: 'Spend 10 survival days to restore 20% max health and boost spirit by 20% for 2 turns.',
      cost: { lifespan: 10 },
      effect: {
        heal: { percentOfMaxHp: 0.2 },
        buff: { spirit: 0.2, duration: 2 }
      },
      cooldown: 3
    }
  },

  // Rare Foundation Treasures (10 types)
  'ft_011': {
    id: 'ft_011',
    name: 'Nano-Pulse Shot',
    description: 'A refined nanoparticle injection that hardens the survival base.',
    rarity: 'Rare',
    effects: { hpBonus: 800, attackBonus: 150, defenseBonus: 100 },
    battleEffect: {
      type: 'buff',
      name: 'Pulse Power',
      description: 'Spend 20 survival days to gain +50% attack and +30% defense for 3 turns.',
      cost: { lifespan: 20 },
      effect: {
        buff: { attack: 0.5, defense: 0.3, duration: 3 }
      },
      cooldown: 5
    }
  },
  'ft_012': {
    id: 'ft_012',
    name: 'Bio-Loom Bloom',
    description: 'A mutant flora that thrives on radiation, enhancing neural pathways.',
    rarity: 'Rare',
    effects: { spiritBonus: 120, hpBonus: 600, specialEffect: 'Spirit recovery rate increased by 20%.' },
    battleEffect: {
      type: 'heal',
      name: 'Blooming Vigor',
      description: 'Spend 15 survival days to restore 35% max health and boost spirit by 30% for 3 turns.',
      cost: { lifespan: 15 },
      effect: {
        heal: { percentOfMaxHp: 0.35 },
        buff: { spirit: 0.3, duration: 3 }
      },
      cooldown: 4
    }
  },
  'ft_013': {
    id: 'ft_013',
    name: 'Mutant-Hulk Bone',
    description: 'A crystalline bone fragment from a massive mutant, boosting raw endurance.',
    rarity: 'Rare',
    effects: { physiqueBonus: 80, hpBonus: 1000, attackBonus: 120 },
    battleEffect: {
      type: 'buff',
      name: 'Mutant Might',
      description: 'Spend 18 survival days to gain +60% attack and +40% endurance for 3 turns.',
      cost: { lifespan: 18 },
      effect: {
        buff: { attack: 0.6, physique: 0.4, duration: 3 }
      },
      cooldown: 5
    }
  },
  'ft_014': {
    id: 'ft_014',
    name: 'Phoenix Circuit',
    description: 'Advanced circuitry salvaged from a pre-war "Phoenix" drone, boosting mental power.',
    rarity: 'Rare',
    effects: { spiritBonus: 150, speedBonus: 25, specialEffect: 'Skill damage increased by 15%.' },
    battleEffect: {
      type: 'damage',
      name: 'Phoenix Flare',
      description: 'Spend 16 survival days to deal 3.5x attack damage and increase spirit by 50% for 2 turns.',
      cost: { lifespan: 16 },
      effect: {
        damage: { multiplier: 3.5 },
        buff: { spirit: 0.5, duration: 2 }
      },
      cooldown: 4
    }
  },
  'ft_015': {
    id: 'ft_015',
    name: 'Chimera Horn',
    description: 'The horn of a rare chimera creature, enhancing overall defense.',
    rarity: 'Rare',
    effects: { defenseBonus: 150, hpBonus: 700, physiqueBonus: 60 },
    battleEffect: {
      type: 'buff',
      name: 'Chimera Guard',
      description: 'Spend 17 survival days to gain +50% defense and +30% max HP for 4 turns.',
      cost: { lifespan: 17 },
      effect: {
        buff: { defense: 0.5, maxHp: 0.3, duration: 4 }
      },
      cooldown: 5
    }
  },
  'ft_016': {
    id: 'ft_016',
    name: 'Titan Plate',
    description: 'A massive chitinous plate from a Titan-class mutant, greatly enhancing defense.',
    rarity: 'Rare',
    effects: { defenseBonus: 200, hpBonus: 900, specialEffect: 'Damage taken reduced by 10%.' },
    battleEffect: {
      type: 'buff',
      name: 'Titan Aegis',
      description: 'Spend 20 survival days to gain +60% defense and reflect 30% of damage taken for 4 turns.',
      cost: { lifespan: 20 },
      effect: {
        buff: { defense: 0.6, reflectDamage: 0.3, duration: 4 }
      },
      cooldown: 6
    }
  },
  'ft_017': {
    id: 'ft_017',
    name: 'Sabertooth Fang',
    description: 'A razor-sharp fang from an apex predator, boosting offensive power.',
    rarity: 'Rare',
    effects: { attackBonus: 200, speedBonus: 30, physiqueBonus: 70 },
    battleEffect: {
      type: 'damage',
      name: 'Savage Rend',
      description: 'Spend 18 survival days to deal 4x attack damage, ignoring 40% defense.',
      cost: { lifespan: 18 },
      effect: {
        damage: { multiplier: 4, ignoreDefense: 0.4 }
      },
      cooldown: 4
    }
  },
  'ft_018': {
    id: 'ft_018',
    name: 'Sun-Flare Feather',
    description: 'A feather glowing with concentrated solar radiation, boosting energy attacks.',
    rarity: 'Rare',
    effects: { spiritBonus: 180, attackBonus: 130, specialEffect: 'Fire-type skill damage increased by 25%.' },
    battleEffect: {
      type: 'damage',
      name: 'Solar Strike',
      description: 'Spend 19 survival days to deal 3.8x attack damage with a 3-turn burn effect.',
      cost: { lifespan: 19 },
      effect: {
        damage: { multiplier: 3.8 },
        debuff: { hp: -0.08, duration: 3 }
      },
      cooldown: 4
    }
  },
  'ft_019': {
    id: 'ft_019',
    name: 'Jade Scale',
    description: 'A rare jade-like scale from a river-dwelling mutant, enhancing vitality.',
    rarity: 'Rare',
    effects: { hpBonus: 1200, spiritBonus: 100, speedBonus: 20 },
    battleEffect: {
      type: 'heal',
      name: 'Coastal Regeneration',
      description: 'Spend 17 survival days to restore 40% max health and boost speed by 30% for 3 turns.',
      cost: { lifespan: 17 },
      effect: {
        heal: { percentOfMaxHp: 0.4 },
        buff: { speed: 0.3, duration: 3 }
      },
      cooldown: 4
    }
  },
  'ft_020': {
    id: 'ft_020',
    name: 'Singularity Stone',
    description: 'A dense stone with a minor gravitational pull, balancing survival stats.',
    rarity: 'Rare',
    effects: { hpBonus: 500, attackBonus: 100, defenseBonus: 100, spiritBonus: 100, physiqueBonus: 50 },
    battleEffect: {
      type: 'buff',
      name: 'Gravitational Focus',
      description: 'Spend 20 survival days to gain +25% for all primary attributes for 4 turns.',
      cost: { lifespan: 20 },
      effect: {
        buff: { attack: 0.25, defense: 0.25, spirit: 0.25, physique: 0.25, speed: 0.25, duration: 4 }
      },
      cooldown: 5
    }
  },

  // Legendary Foundation Treasures (10 types)
  'ft_021': {
    id: 'ft_021',
    name: 'Primal Bio-Womb',
    description: 'A pre-war biological incubator housing ancient evolutionary data, creating a supreme foundation.',
    rarity: 'Legendary',
    effects: { hpBonus: 1500, attackBonus: 300, defenseBonus: 200, spiritBonus: 250, physiqueBonus: 150, specialEffect: 'All primary attributes increased by 10%.' },
    battleEffect: {
      type: 'buff',
      name: 'Primal Might',
      description: 'Spend 30 survival days to gain +40% for all primary attributes for 5 turns.',
      cost: { lifespan: 30 },
      effect: {
        buff: { attack: 0.4, defense: 0.4, spirit: 0.4, physique: 0.4, speed: 0.4, duration: 5 }
      },
      cooldown: 6
    }
  },
  'ft_022': {
    id: 'ft_022',
    name: 'Primordial Vapor',
    description: 'A swirling purple mist harvested from the dawn of the apocalypse, strengthening your core.',
    rarity: 'Legendary',
    effects: { spiritBonus: 400, hpBonus: 1000, specialEffect: 'Max spirit increased by 30%, learning rate increased by 20%.' },
    battleEffect: {
      type: 'buff',
      name: 'Vapor Burst',
      description: 'Spend 35 survival days to gain +80% spirit and +50% max HP for 5 turns.',
      cost: { lifespan: 35 },
      effect: {
        buff: { spirit: 0.8, maxHp: 0.5, duration: 5 }
      },
      cooldown: 7
    }
  },
  'ft_023': {
    id: 'ft_023',
    name: 'Genesis Core-Disk',
    description: 'A crystalline disk containing the blueprints of life itself, allowing for deep enhancement.',
    rarity: 'Legendary',
    effects: { hpBonus: 1200, attackBonus: 250, defenseBonus: 180, spiritBonus: 300, speedBonus: 40, specialEffect: 'Breakthrough success rate increased by 15%.' },
    battleEffect: {
      type: 'buff',
      name: 'Genesis Protocol',
      description: 'Spend 32 survival days to gain +35% for all primary stats and +30% crit chance for 5 turns.',
      cost: { lifespan: 32 },
      effect: {
        buff: { attack: 0.35, defense: 0.35, spirit: 0.35, physique: 0.35, speed: 0.35, critChance: 0.3, duration: 5 }
      },
      cooldown: 6
    }
  },
  'ft_024': {
    id: 'ft_024',
    name: 'Cycle Sigil',
    description: 'A neural imprint that allows for temporary biological resets, greatly enhancing longevity.',
    rarity: 'Legendary',
    effects: { hpBonus: 2000, physiqueBonus: 200, specialEffect: '30% chance to revive with 50% HP upon death.' },
    battleEffect: {
      type: 'heal',
      name: 'Neural Reset',
      description: 'Spend 40 survival days to restore 50% max HP and gain a Revive Mark.',
      cost: { lifespan: 40 },
      effect: {
        heal: { percentOfMaxHp: 0.5 },
        buff: { revive: 1, duration: 999 }
      },
      cooldown: 8
    }
  },
  'ft_025': {
    id: 'ft_025',
    name: 'Chronos Sandglass',
    description: 'An artifact that disrupts the flow of local time and space, boosting speed.',
    rarity: 'Legendary',
    effects: { speedBonus: 60, spiritBonus: 200, specialEffect: 'Initiative increased by 25%, dodge rate increased by 15%.' },
    battleEffect: {
      type: 'buff',
      name: 'Temporal Surge',
      description: 'Spend 30 survival days to gain +100% speed and +50% dodge rate for 4 turns.',
      cost: { lifespan: 30 },
      effect: {
        buff: { speed: 1.0, dodge: 0.5, duration: 4 }
      },
      cooldown: 6
    }
  },
  'ft_026': {
    id: 'ft_026',
    name: 'Wheel of Fate',
    description: 'A mechanical device that influences the probability of survival, enhancing luck.',
    rarity: 'Legendary',
    effects: { hpBonus: 800, attackBonus: 200, defenseBonus: 150, spiritBonus: 180, specialEffect: 'Crit chance increased by 20%, crit damage increased by 30%.' },
    battleEffect: {
      type: 'buff',
      name: 'Favored Path',
      description: 'Spend 28 survival days to gain +50% crit chance and +80% crit damage for 5 turns.',
      cost: { lifespan: 28 },
      effect: {
        buff: { critChance: 0.5, critDamage: 0.8, duration: 5 }
      },
      cooldown: 6
    }
  },
  'ft_027': {
    id: 'ft_027',
    name: 'Causality Threads',
    description: 'Microscopic fibers that connect survival data, boosting cognitive reach.',
    rarity: 'Legendary',
    effects: { spiritBonus: 350, hpBonus: 900, specialEffect: 'Skill hit rate increased by 25%, skill crit rate increased by 15%.' },
    battleEffect: {
      type: 'damage',
      name: 'Cause and Effect',
      description: 'Spend 33 survival days to deal 4.5x attack damage. Guaranteed hit and reflects 50% of next damage taken.',
      cost: { lifespan: 33 },
      effect: {
        damage: { multiplier: 4.5, guaranteedHit: true },
        buff: { reflectDamage: 0.5, duration: 1 }
      },
      cooldown: 5
    }
  },
  'ft_028': {
    id: 'ft_028',
    name: 'Void Mirror',
    description: 'A lens that reveals the hidden truths of the wasteland, boosting insight.',
    rarity: 'Legendary',
    effects: { defenseBonus: 250, spiritBonus: 220, specialEffect: '20% chance to completely dodge attacks, reveals enemy weaknesses.' },
    battleEffect: {
      type: 'buff',
      name: 'Ghostly Mirage',
      description: 'Spend 31 survival days to gain +80% dodge rate and ignore enemy defense for 4 turns.',
      cost: { lifespan: 31 },
      effect: {
        buff: { dodge: 0.8, ignoreDefense: true, duration: 4 }
      },
      cooldown: 6
    }
  },
  'ft_029': {
    id: 'ft_029',
    name: 'Eternal Flame',
    description: 'A nuclear fire that never extinguishes, fueling pure aggression.',
    rarity: 'Legendary',
    effects: { attackBonus: 350, spiritBonus: 280, specialEffect: 'Attacks inflict a continuous burning effect.' },
    battleEffect: {
      type: 'damage',
      name: 'Eternal Burn',
      description: 'Spend 34 survival days to deal 5x attack damage with a 5-turn severe burn effect.',
      cost: { lifespan: 34 },
      effect: {
        damage: { multiplier: 5 },
        debuff: { hp: -0.1, duration: 5 }
      },
      cooldown: 5
    }
  },
  'ft_030': {
    id: 'ft_030',
    name: 'Undying Core-Tree',
    description: 'A petrified tree core that pulses with infinite life energy, enhancing endurance.',
    rarity: 'Legendary',
    effects: { hpBonus: 1800, defenseBonus: 220, specialEffect: 'HP recovery rate increased by 50%, toxin resistance increased.' },
    battleEffect: {
      type: 'heal',
      name: 'Undying Vigor',
      description: 'Spend 32 survival days to restore 60% max HP and gain 10% regen for 5 turns.',
      cost: { lifespan: 32 },
      effect: {
        heal: { percentOfMaxHp: 0.6 },
        buff: { regen: 0.1, duration: 5 }
      },
      cooldown: 6
    }
  },

  // Mythic Foundation Treasures (10 types)
  'ft_031': {
    id: 'ft_031',
    name: 'God-Mode Shard',
    description: 'A fragment of the ultimate override code for reality, granting near-divine power.',
    rarity: 'Mythic',
    effects: { hpBonus: 2500, attackBonus: 500, defenseBonus: 400, spiritBonus: 600, physiqueBonus: 300, speedBonus: 80, specialEffect: 'All primary attributes increased by 20%, breakthrough rate increased by 25%.' },
    battleEffect: {
      type: 'buff',
      name: 'God-Protocol',
      description: 'Spend 50 survival days to gain +60% for all primary attributes for 6 turns.',
      cost: { lifespan: 50 },
      effect: {
        buff: { attack: 0.6, defense: 0.6, spirit: 0.6, physique: 0.6, speed: 0.6, duration: 6 }
      },
      cooldown: 8
    }
  },
  'ft_032': {
    id: 'ft_032',
    name: 'Singularity Bloom',
    description: 'A botanical construct born from a gravitational singularity, perfect for a supreme base.',
    rarity: 'Mythic',
    effects: { hpBonus: 3000, spiritBonus: 800, specialEffect: 'Max spirit increased by 50%, learning rate increased by 40%, skill power increased by 30%.' },
    battleEffect: {
      type: 'buff',
      name: 'Singularity Bloom',
      description: 'Spend 55 survival days to gain +100% spirit and +70% max HP for 6 turns.',
      cost: { lifespan: 55 },
      effect: {
        buff: { spirit: 1.0, maxHp: 0.7, duration: 6 }
      },
      cooldown: 8
    }
  },
  'ft_033': {
    id: 'ft_033',
    name: 'Apex Bloodline',
    description: 'Concetrated genetic material of a legendary pre-war titan, vastly increasing endurance.',
    rarity: 'Mythic',
    effects: { physiqueBonus: 500, hpBonus: 4000, attackBonus: 600, defenseBonus: 500, specialEffect: 'HP recovery rate increased by 100%, physical damage increased by 40%.' },
    battleEffect: {
      type: 'buff',
      name: 'Apex Override',
      description: 'Spend 60 survival days to gain +80% attack, +70% endurance, and 15% HP regen per turn for 6 turns.',
      cost: { lifespan: 60 },
      effect: {
        buff: { attack: 0.8, physique: 0.7, regen: 0.15, duration: 6 }
      },
      cooldown: 8
    }
  },
  'ft_034': {
    id: 'ft_034',
    name: 'Genesis Stone',
    description: 'An ancient relic said to have the power to reshape the world, boosting mental energy.',
    rarity: 'Mythic',
    effects: { spiritBonus: 1000, defenseBonus: 600, hpBonus: 2000, specialEffect: 'Spirit recovery rate increased by 80%, mental defense increased by 50%.' },
    battleEffect: {
      type: 'buff',
      name: 'Genesis Mend',
      description: 'Spend 52 survival days to gain +90% spirit, +70% defense, and +60% mental defense for 6 turns.',
      cost: { lifespan: 52 },
      effect: {
        buff: { spirit: 0.9, defense: 0.7, magicDefense: 0.6, duration: 6 }
      },
      cooldown: 8
    }
  },
  'ft_035': {
    id: 'ft_035',
    name: 'Aegis Resonance',
    description: 'The harmonic essence of an impenetrable pre-war shield system, boosting defense.',
    rarity: 'Mythic',
    effects: { defenseBonus: 800, hpBonus: 3500, specialEffect: 'Damage taken reduced by 30%, reflects 20% of damage taken.' },
    battleEffect: {
      type: 'buff',
      name: 'Aegis Field',
      description: 'Spend 58 survival days to gain +80% defense, 50% damage reduction, and 40% reflect for 6 turns.',
      cost: { lifespan: 58 },
      effect: {
        buff: { defense: 0.8, damageReduction: 0.5, reflectDamage: 0.4, duration: 6 }
      },
      cooldown: 8
    }
  },
  'ft_036': {
    id: 'ft_036',
    name: 'Sword-Protocol Sigma',
    description: 'Terminal combat data of a legendary pre-war blade-master, boosting attack.',
    rarity: 'Mythic',
    effects: { attackBonus: 800, speedBonus: 100, specialEffect: 'Attack increased by 50%, crit rate by 30%, double damage against mutants.' },
    battleEffect: {
      type: 'damage',
      name: 'Sigma Strike',
      description: 'Spend 56 survival days to deal 6x attack damage, ignoring 50% defense. Multiplied against mutants.',
      cost: { lifespan: 56 },
      effect: {
        damage: { multiplier: 6, ignoreDefense: 0.5, demonMultiplier: 2.0 }
      },
      cooldown: 6
    }
  },
  'ft_037': {
    id: 'ft_037',
    name: 'Oracle Lens',
    description: 'A high-tech optical implant that predicts enemy combat patterns, boosting insight.',
    rarity: 'Mythic',
    effects: { spiritBonus: 700, speedBonus: 120, specialEffect: 'Initiative increased by 40%, dodge rate by 25%, sees through enemy moves.' },
    battleEffect: {
      type: 'buff',
      name: 'Oracle Insights',
      description: 'Spend 54 survival days to gain +100% speed, +70% dodge, and ignore defense for 5 turns.',
      cost: { lifespan: 54 },
      effect: {
        buff: { speed: 1.0, dodge: 0.7, ignoreDefense: true, duration: 5 }
      },
      cooldown: 7
    }
  },
  'ft_038': {
    id: 'ft_038',
    name: 'Harmonic Pulse',
    description: 'A sonic emitter that tunes biological frequencies, boosting mental energy.',
    rarity: 'Mythic',
    effects: { spiritBonus: 900, hpBonus: 1800, specialEffect: 'Max spirit increased by 60%, sonic skill damage increased by 50%.' },
    battleEffect: {
      type: 'damage',
      name: 'Frequency Bloom',
      description: 'Spend 57 survival days to deal 5.5x attack damage and reduce enemy attributes by 30% for 4 turns.',
      cost: { lifespan: 57 },
      effect: {
        damage: { multiplier: 5.5 },
        debuff: { attack: -0.3, defense: -0.3, spirit: -0.3, duration: 4 }
      },
      cooldown: 6
    }
  },
  'ft_039': {
    id: 'ft_039',
    name: 'Bio-Furnace Heat',
    description: 'The molecular heat of an ancient synthesizer, granting incredible vitality.',
    rarity: 'Mythic',
    effects: { hpBonus: 5000, physiqueBonus: 400, specialEffect: 'HP recovery rate increased by 150%, toxin resistance increased by 100%.' },
    battleEffect: {
      type: 'heal',
      name: 'Furnace Rebirth',
      description: 'Spend 59 survival days to restore 80% max HP, cleanse debuffs, and gain 20% regen for 6 turns.',
      cost: { lifespan: 59 },
      effect: {
        heal: { percentOfMaxHp: 0.8 },
        buff: { regen: 0.2, cleanse: true, duration: 6 }
      },
      cooldown: 8
    }
  },
  'ft_040': {
    id: 'ft_040',
    name: 'Yin-Yang Registry',
    description: 'A comprehensive map of bio-mechanical synergy, balancing all forces.',
    rarity: 'Mythic',
    effects: { hpBonus: 2200, attackBonus: 400, defenseBonus: 400, spiritBonus: 500, physiqueBonus: 300, speedBonus: 60, specialEffect: 'All primary attributes increased by 25%. Perfect balance.' },
    battleEffect: {
      type: 'buff',
      name: 'Registry Balance',
      description: 'Spend 60 survival days to gain +70% for all primary stats, status immunity, and 50% reflect for 7 turns.',
      cost: { lifespan: 60 },
      effect: {
        buff: { attack: 0.7, defense: 0.7, spirit: 0.7, physique: 0.7, speed: 0.7, immunity: true, reflectDamage: 0.5, duration: 7 }
      },
      cooldown: 9
    }
  },
};

// Fusion Core Synthesis Configuration
export const GOLDEN_CORE_METHOD_CONFIG = {
  // Relationship between number of methods and Tribulation difficulty
  methodDifficultyMultiplier: {
    1: 1.0,   // 1-Way Fusion: Base difficulty
    2: 1.5,   // 2-Way Fusion: Difficulty +50%
    3: 2.0,   // 3-Way Fusion: Difficulty +100%
    4: 2.5,   // 4-Way Fusion: Difficulty +150%
    5: 3.0,   // 5-Way Fusion: Difficulty +200%
    6: 3.5,   // 6-Way Fusion: Difficulty +250%
    7: 4.0,   // 7-Way Fusion: Difficulty +300%
    8: 4.5,   // 8-Way Fusion: Difficulty +350%
    9: 5.0,   // 9-Way Fusion: Difficulty +400%
  },

  // Relationship between number of methods and attribute bonus multiplier
  methodBonusMultiplier: {
    1: 1.0,   // Base bonus
    2: 1.8,   // 2-Way Fusion: Bonus +80%
    3: 2.5,   // 3-Way Fusion: Bonus +150%
    4: 3.1,   // 4-Way Fusion: Bonus +210%
    5: 3.6,   // 5-Way Fusion: Bonus +260%
    6: 4.0,   // 6-Way Fusion: Bonus +300%
    7: 4.3,   // 7-Way Fusion: Bonus +330%
    8: 4.5,   // 8-Way Fusion: Bonus +350%
    9: 4.6,   // 9-Way Fusion: Bonus +360%
  },

  // Titles for different Fusion Core levels
  methodTitles: {
    1: 'One-Way Fusion Core',
    2: 'Two-Way Fusion Core',
    3: 'Three-Way Fusion Core',
    4: 'Four-Way Fusion Core',
    5: 'Five-Way Fusion Core',
    6: 'Six-Way Fusion Core',
    7: 'Seven-Way Fusion Core',
    8: 'Eight-Way Fusion Core',
    9: 'Nine-Way Fusion Core',
  }
};

// Heaven Earth Essence System (40 types)
export const HEAVEN_EARTH_ESSENCES: Record<string, HeavenEarthEssence> = {
  // Common Heaven Earth Essences (10 types)
  'hee_001': {
    id: 'hee_001',
    name: 'Radioactive Bloom',
    description: 'A glowing mutant flower that thrives on radiation, purging biological impurities.',
    rarity: 'Common',
    quality: 30,
    effects: { attackBonus: 200, spiritBonus: 100, specialEffect: 'Attacks inflict radioactive burn, dealing continuous damage.' },
    battleEffect: {
      type: 'damage',
      name: 'Rad-Purge',
      description: 'Spend 15 survival days to deal 3x attack damage, ignoring 30% defense.',
      cost: { lifespan: 15 },
      effect: {
        damage: { multiplier: 3, ignoreDefense: true }
      },
      cooldown: 3
    }
  },
  'hee_002': {
    id: 'hee_002',
    name: 'Tectonic Essence',
    description: 'Pure mineral essence harvested from deep mountain ridges, boosting physical armor.',
    rarity: 'Common',
    quality: 35,
    effects: { defenseBonus: 250, hpBonus: 500, specialEffect: 'A chance to trigger Tectonic Guard when taking damage.' },
    battleEffect: {
      type: 'buff',
      name: 'Mountain Guard',
      description: 'Spend 20 survival days to gain +50% defense and 30% damage reduction for 4 turns.',
      cost: { lifespan: 20 },
      effect: {
        buff: { defense: 0.5, damageReduction: 0.3, duration: 4 }
      },
      cooldown: 5
    }
  },
  'hee_003': {
    id: 'hee_003',
    name: 'Synergy Core',
    description: 'A core housing stable pockets of varying energy types, balancing all forces.',
    rarity: 'Common',
    quality: 40,
    effects: { hpBonus: 400, attackBonus: 150, defenseBonus: 150, spiritBonus: 120, physiqueBonus: 80 },
    battleEffect: {
      type: 'buff',
      name: 'Energy Balance',
      description: 'Spend 22 survival days to gain +30% for all primary attributes for 4 turns.',
      cost: { lifespan: 22 },
      effect: {
        buff: { attack: 0.3, defense: 0.3, spirit: 0.3, physique: 0.3, speed: 0.3, duration: 4 }
      },
      cooldown: 5
    }
  },
  'hee_004': {
    id: 'hee_004',
    name: 'Crimson Sigil',
    description: 'A mysterious pre-war sigil infused with eldritch data energy.',
    rarity: 'Common',
    quality: 45,
    effects: { spiritBonus: 200, speedBonus: 30, specialEffect: 'Increases hit rate and has a chance to confuse targets.' },
    battleEffect: {
      type: 'debuff',
      name: 'Neural Confusion',
      description: 'Spend 21 survival days to deal 2.5x attack damage and reduce enemy attack/speed.',
      cost: { lifespan: 21 },
      effect: {
        damage: { multiplier: 2.5 },
        debuff: { attack: -0.3, speed: -0.2, duration: 3 }
      },
      cooldown: 4
    }
  },
  'hee_005': {
    id: 'hee_005',
    name: 'Ethereal Fuel',
    description: 'A ghostly green fuel source salvaged from old labs, emitting eerie light.',
    rarity: 'Common',
    quality: 50,
    effects: { attackBonus: 180, spiritBonus: 150, specialEffect: 'Attacks erode enemy defense over time.' },
    battleEffect: {
      type: 'damage',
      name: 'Fuel Erosion',
      description: 'Spend 23 survival days to deal 3.2x attack damage and reduce enemy defense by 40% for 3 turns.',
      cost: { lifespan: 23 },
      effect: {
        damage: { multiplier: 3.2 },
        debuff: { defense: -0.4, duration: 3 }
      },
      cooldown: 4
    }
  },
  'hee_006': {
    id: 'hee_006',
    name: 'Blood-Moon Essence',
    description: 'Condensed radiation from a blood-red moon cycle.',
    rarity: 'Common',
    quality: 55,
    effects: { physiqueBonus: 100, hpBonus: 600, specialEffect: 'Greatly increases HP recovery rate.' },
    battleEffect: {
      type: 'heal',
      name: 'Sanguine Rebirth',
      description: 'Spend 24 survival days to restore 35% max HP and boost attack by 40%.',
      cost: { lifespan: 24 },
      effect: {
        heal: { percentOfMaxHp: 0.35 },
        buff: { attack: 0.4, duration: 3 }
      },
      cooldown: 4
    }
  },
  'hee_007': {
    id: 'hee_007',
    name: 'Stellar Tear',
    description: 'A crystalline droplet formed during meteor impacts, boosting cognitive reach.',
    rarity: 'Common',
    quality: 60,
    effects: { spiritBonus: 180, speedBonus: 25, specialEffect: 'Increases max spirit and skill damage.' },
    battleEffect: {
      type: 'buff',
      name: 'Cosmic Surge',
      description: 'Spend 25 survival days to gain +50% spirit and +30% speed for 4 turns.',
      cost: { lifespan: 25 },
      effect: {
        buff: { spirit: 0.5, speed: 0.3, duration: 4 }
      },
      cooldown: 4
    }
  },
  'hee_008': {
    id: 'hee_008',
    name: 'Cryo-Isotope',
    description: 'Extreme cold-tech essence salvaged from sub-zero research sites.',
    rarity: 'Common',
    quality: 65,
    effects: { defenseBonus: 200, spiritBonus: 160, specialEffect: 'Freeze-tech enhancement. Chance to freeze targets.' },
    battleEffect: {
      type: 'debuff',
      name: 'Cryo-Burst',
      description: 'Spend 26 survival days to deal 3x attack damage and reduce enemy speed by 50% for 3 turns.',
      cost: { lifespan: 26 },
      effect: {
        damage: { multiplier: 3 },
        debuff: { speed: -0.5, duration: 3 }
      },
      cooldown: 4
    }
  },
  'hee_009': {
    id: 'hee_009',
    name: 'Tribulation Shard',
    description: 'A fragment of power left behind by persistent electrical storms.',
    rarity: 'Common',
    quality: 70,
    effects: { attackBonus: 220, speedBonus: 35, specialEffect: 'Boosts crit rate and electrical damage.' },
    battleEffect: {
      type: 'damage',
      name: 'Ion-Tide Strike',
      description: 'Spend 27 survival days to deal 3.5x attack damage with 50% extra crit chance.',
      cost: { lifespan: 27 },
      effect: {
        damage: { multiplier: 3.5, ignoreDefense: 0.35 },
        buff: { critChance: 0.5, duration: 2 }
      },
      cooldown: 4
    }
  },
  'hee_010': {
    id: 'hee_010',
    name: 'Singularity Vapor',
    description: 'Concentrated vapor from the heart of a gravitational anomaly.',
    rarity: 'Common',
    quality: 75,
    effects: { physiqueBonus: 120, attackBonus: 190, specialEffect: 'Physical attacks erode enemy defense.' },
    battleEffect: {
      type: 'damage',
      name: 'Gravitational Pulse',
      description: 'Spend 28 survival days to deal 3.8x attack damage with residual erosion damage.',
      cost: { lifespan: 28 },
      effect: {
        damage: { multiplier: 3.8 },
        debuff: { hp: -0.08, duration: 3 }
      },
      cooldown: 4
    }
  },

  // Rare Heaven Earth Essences (10 types)
  'hee_011': {
    id: 'hee_011',
    name: 'Neural Oracle Eye',
    description: 'A pre-war optical implant that predicts biological outcomes.',
    rarity: 'Rare',
    quality: 80,
    effects: { spiritBonus: 300, hpBonus: 800, specialEffect: 'Grants a chance to revive. Faster insight into enemy weaknesses.' },
    battleEffect: {
      type: 'heal',
      name: 'Neural Reset',
      description: 'Spend 35 survival days to restore 45% max HP and gain a Revive Mark.',
      cost: { lifespan: 35 },
      effect: {
        heal: { percentOfMaxHp: 0.45 },
        buff: { revive: 1, duration: 999 }
      },
      cooldown: 6
    }
  },
  'hee_012': {
    id: 'hee_012',
    name: 'Phase-Shift Fragment',
    description: 'A fragment of tech that allows for minor spatial manipulation.',
    rarity: 'Rare',
    quality: 85,
    effects: { speedBonus: 50, spiritBonus: 250, specialEffect: 'Initiative and dodge rate significantly increased.' },
    battleEffect: {
      type: 'buff',
      name: 'Phase Surge',
      description: 'Spend 36 survival days to gain +80% speed and +60% dodge for 5 turns.',
      cost: { lifespan: 36 },
      effect: {
        buff: { speed: 0.8, dodge: 0.6, duration: 5 }
      },
      cooldown: 6
    }
  },
  'hee_013': {
    id: 'hee_013',
    name: 'Strand of Paradox',
    description: 'A microscopic thread that seems to alter local probability.',
    rarity: 'Rare',
    quality: 90,
    effects: { hpBonus: 1000, spiritBonus: 280, specialEffect: 'Greatly increases critical fortune and luck.' },
    battleEffect: {
      type: 'buff',
      name: 'Paradox Vigor',
      description: 'Spend 37 survival days to gain +60% crit chance and +70% crit damage for 5 turns.',
      cost: { lifespan: 37 },
      effect: {
        buff: { critChance: 0.6, critDamage: 0.7, duration: 5 }
      },
      cooldown: 6
    }
  },
  'hee_014': {
    id: 'hee_014',
    name: 'Wheel of Retribution',
    description: 'A mechanical disc that reflects energy back at its source.',
    rarity: 'Rare',
    quality: 95,
    effects: { attackBonus: 350, defenseBonus: 200, specialEffect: 'Attacks reflect damage back to the attacker.' },
    battleEffect: {
      type: 'damage',
      name: 'Retribution Blast',
      description: 'Spend 38 survival days to deal 4.5x attack damage and reflect 60% of next damage taken.',
      cost: { lifespan: 38 },
      effect: {
        damage: { multiplier: 4.5 },
        buff: { reflectDamage: 0.6, duration: 1 }
      },
      cooldown: 5
    }
  },
  'hee_015': {
    id: 'hee_015',
    name: 'Void Matrix Mirror',
    description: 'A lens that bends light and reality to hide the user.',
    rarity: 'Rare',
    quality: 100,
    effects: { defenseBonus: 300, spiritBonus: 320, specialEffect: 'High chance to completely dodge incoming fire.' },
    battleEffect: {
      type: 'buff',
      name: 'Matrix Shading',
      description: 'Spend 39 survival days to gain +80% dodge and ignore enemy defense for 5 turns.',
      cost: { lifespan: 39 },
      effect: {
        buff: { dodge: 0.8, ignoreDefense: true, duration: 5 }
      },
      cooldown: 6
    }
  },
  'hee_016': {
    id: 'hee_016',
    name: 'Thermal Isotope Flare',
    description: 'A nuclear flare that burns with an eternal heat.',
    rarity: 'Rare',
    quality: 105,
    effects: { attackBonus: 380, spiritBonus: 300, specialEffect: 'Attacks inflict Eternal Burn which cannot be cleansed.' },
    battleEffect: {
      type: 'damage',
      name: 'Eternal Flare',
      description: 'Spend 40 survival days to deal 5x attack damage with 10% max HP erosion for 5 turns.',
      cost: { lifespan: 40 },
      effect: {
        damage: { multiplier: 5 },
        debuff: { hp: -0.1, duration: 5 }
      },
      cooldown: 5
    }
  },
  'hee_017': {
    id: 'hee_017',
    name: 'Bio-Mesh Marrow',
    description: 'Regenerative biological matter harvested from ancient flora.',
    rarity: 'Rare',
    quality: 110,
    effects: { hpBonus: 1500, defenseBonus: 250, specialEffect: 'Greatly increases passive HP recovery rate.' },
    battleEffect: {
      type: 'heal',
      name: 'Duro-Regen',
      description: 'Spend 41 survival days to restore 55% max HP and gain 12% regen for 5 turns.',
      cost: { lifespan: 41 },
      effect: {
        heal: { percentOfMaxHp: 0.55 },
        buff: { regen: 0.12, duration: 5 }
      },
      cooldown: 6
    }
  },
  'hee_018': {
    id: 'hee_018',
    name: 'Reality Crack Shard',
    description: 'A shard containing fragments of the world\'s core programming.',
    rarity: 'Rare',
    quality: 115,
    effects: { spiritBonus: 400, attackBonus: 300, defenseBonus: 280, specialEffect: 'Increases the power of all skills.' },
    battleEffect: {
      type: 'buff',
      name: 'System Override',
      description: 'Spend 42 survival days to gain +45% for all primary attributes for 5 turns.',
      cost: { lifespan: 42 },
      effect: {
        buff: { attack: 0.45, defense: 0.45, spirit: 0.45, physique: 0.45, speed: 0.45, duration: 5 }
      },
      cooldown: 6
    }
  },
  'hee_019': {
    id: 'hee_019',
    name: 'Fusion Bloom Bloom',
    description: 'A rare plant construct born from nuclear fusion energy.',
    rarity: 'Rare',
    quality: 120,
    effects: { hpBonus: 1200, spiritBonus: 450, specialEffect: 'Spirit capacity and learning rate significantly increased.' },
    battleEffect: {
      type: 'buff',
      name: 'Fusion Bloom',
      description: 'Spend 43 survival days to gain +70% spirit and +50% max HP for 6 turns.',
      cost: { lifespan: 43 },
      effect: {
        buff: { spirit: 0.7, maxHp: 0.5, duration: 6 }
      },
      cooldown: 7
    }
  },
  'hee_020': {
    id: 'hee_020',
    name: 'Titan Hero Serum',
    description: 'Concentrated essence of pre-war super soldiers.',
    rarity: 'Rare',
    quality: 125,
    effects: { physiqueBonus: 200, hpBonus: 2000, attackBonus: 400, specialEffect: 'Physical damage significantly increased.' },
    battleEffect: {
      type: 'buff',
      name: 'Titan Mode',
      description: 'Spend 44 survival days to gain +70% attack/endurance and 12% regen for 6 turns.',
      cost: { lifespan: 44 },
      effect: {
        buff: { attack: 0.7, physique: 0.6, regen: 0.12, duration: 6 }
      },
      cooldown: 7
    }
  },

  // Legendary Heaven Earth Essences (10 types)
  'hee_021': {
    id: 'hee_021',
    name: 'Genesis Stone Extract',
    description: 'Concentrated essence from an ancient relic capable of reshaping the world.',
    rarity: 'Legendary',
    quality: 130,
    effects: { defenseBonus: 500, spiritBonus: 600, specialEffect: 'Greatly increases mental defense and spirit recovery.' },
    battleEffect: {
      type: 'buff',
      name: 'Genesis Mend',
      description: 'Spend 50 survival days to gain +80% spirit, +70% defense, and +60% mental defense for 6 turns.',
      cost: { lifespan: 50 },
      effect: {
        buff: { spirit: 0.8, defense: 0.7, magicDefense: 0.6, duration: 6 }
      },
      cooldown: 8
    }
  },
  'hee_022': {
    id: 'hee_022',
    name: 'Aegis Resonance Plate',
    description: 'The harmonic core from an impenetrable pre-war shield system.',
    rarity: 'Legendary',
    quality: 135,
    effects: { defenseBonus: 600, hpBonus: 1800, specialEffect: 'Greatly reduces damage taken and reflects it back.' },
    battleEffect: {
      type: 'buff',
      name: 'Aegis Field',
      description: 'Spend 55 survival days to gain +80% defense, 50% damage reduction, and 40% reflect for 6 turns.',
      cost: { lifespan: 55 },
      effect: {
        buff: { defense: 0.8, damageReduction: 0.5, reflectDamage: 0.4, duration: 6 }
      },
      cooldown: 8
    }
  },
  'hee_023': {
    id: 'hee_023',
    name: 'Sword-Protocol Sigma Shard',
    description: 'Concentrated tactical data of a legendary pre-war combat interface.',
    rarity: 'Legendary',
    quality: 140,
    effects: { attackBonus: 700, speedBonus: 80, specialEffect: 'Attack significantly increased. Double damage against mutants.' },
    battleEffect: {
      type: 'damage',
      name: 'Sigma Strike',
      description: 'Spend 52 survival days to deal 6x attack damage, ignoring 50% defense. Multiplied against mutants.',
      cost: { lifespan: 52 },
      effect: {
        damage: { multiplier: 6, ignoreDefense: 0.5, demonMultiplier: 2.0 }
      },
      cooldown: 6
    }
  },
  'hee_024': {
    id: 'hee_024',
    name: 'Oracle Lens Matrix',
    description: 'A high-tech matrix that predicts and counters enemy moves.',
    rarity: 'Legendary',
    quality: 145,
    effects: { spiritBonus: 700, speedBonus: 100, specialEffect: 'Initiative significantly increased. Sees through all enemy moves.' },
    battleEffect: {
      type: 'buff',
      name: 'Oracle Insights',
      description: 'Spend 53 survival days to gain +100% speed, +70% dodge, and ignore defense for 5 turns.',
      cost: { lifespan: 53 },
      effect: {
        buff: { speed: 1.0, dodge: 0.7, ignoreDefense: true, duration: 5 }
      },
      cooldown: 7
    }
  },
  'hee_025': {
    id: 'hee_025',
    name: 'Harmonic Pulse Emitter',
    description: 'A sonic emitter that tunes reality through precise biological frequencies.',
    rarity: 'Legendary',
    quality: 150,
    effects: { spiritBonus: 800, hpBonus: 1500, specialEffect: 'Significantly increases the power of sonic skills.' },
    battleEffect: {
      type: 'damage',
      name: 'Frequency Bloom',
      description: 'Spend 54 survival days to deal 5.5x attack damage and reduce enemy attributes by 30% for 4 turns.',
      cost: { lifespan: 54 },
      effect: {
        damage: { multiplier: 5.5 },
        debuff: { attack: -0.3, defense: -0.3, spirit: -0.3, duration: 4 }
      },
      cooldown: 6
    }
  },
  'hee_026': {
    id: 'hee_026',
    name: 'Bio-Furnace Core',
    description: 'The primary heat source of a pre-war molecular synthesizer.',
    rarity: 'Legendary',
    quality: 155,
    effects: { hpBonus: 3000, physiqueBonus: 300, specialEffect: 'Ultimate recovery rate and toxin resistance.' },
    battleEffect: {
      type: 'heal',
      name: 'Furnace Rebirth',
      description: 'Spend 56 survival days to restore 70% max HP, cleanse debuffs, and gain 18% regen.',
      cost: { lifespan: 56 },
      effect: {
        heal: { percentOfMaxHp: 0.7 },
        buff: { regen: 0.18, cleanse: true, duration: 6 }
      },
      cooldown: 8
    }
  },
  'hee_027': {
    id: 'hee_027',
    name: 'Yin-Yang Registry Module',
    description: 'A comprehensive module of bio-mechanical balance and synergy.',
    rarity: 'Legendary',
    quality: 160,
    effects: { hpBonus: 2000, attackBonus: 500, defenseBonus: 500, spiritBonus: 600, specialEffect: 'Perfect balance of attributes. Total status protection.' },
    battleEffect: {
      type: 'buff',
      name: 'Registry Balance',
      description: 'Spend 57 survival days to gain +60% stats, immunity, and 50% reflect for 7 turns.',
      cost: { lifespan: 57 },
      effect: {
        buff: { attack: 0.6, defense: 0.6, spirit: 0.6, physique: 0.6, speed: 0.6, immunity: true, reflectDamage: 0.5, duration: 7 }
      },
      cooldown: 9
    }
  },
  'hee_028': {
    id: 'hee_028',
    name: 'Sword-Protocol Omega',
    description: 'The ultimate offensive combat protocol used in the late stages of the war.',
    rarity: 'Legendary',
    quality: 165,
    effects: { attackBonus: 800, speedBonus: 120, specialEffect: 'Infused with Omega blades, dealing massive critical damage.' },
    battleEffect: {
      type: 'damage',
      name: 'Omega Strike',
      description: 'Spend 58 survival days to deal 7x attack damage, ignoring 60% defense. Guaranteed crit.',
      cost: { lifespan: 58 },
      effect: {
        damage: { multiplier: 7, ignoreDefense: 0.6, guaranteedCrit: true }
      },
      cooldown: 6
    }
  },
  'hee_029': {
    id: 'hee_029',
    name: 'Star-Field Algorithm',
    description: 'An advanced algorithm that coordinates energy from orbital satellites.',
    rarity: 'Legendary',
    quality: 170,
    effects: { spiritBonus: 900, defenseBonus: 400, specialEffect: 'Greatly boosts the power of orbital skills.' },
    battleEffect: {
      type: 'buff',
      name: 'Star-Tide Field',
      description: 'Spend 59 survival days to gain +90% spirit, +60% defense, and periodic orbital damage.',
      cost: { lifespan: 59 },
      effect: {
        buff: { spirit: 0.9, defense: 0.6, duration: 6 },
        debuff: { hp: -1.0, duration: 6 }
      },
      cooldown: 8
    }
  },
  'hee_030': {
    id: 'hee_030',
    name: 'Chaos-Protocol Alpha',
    description: 'A protocol that unleashes pure entropic energy to destabilize targets.',
    rarity: 'Legendary',
    quality: 175,
    effects: { attackBonus: 750, physiqueBonus: 400, specialEffect: 'Physical attacks inflict entropy erosion.' },
    battleEffect: {
      type: 'damage',
      name: 'Alpha Havoc',
      description: 'Spend 60 survival days to deal 6.5x attack damage and reduce all enemy stats by 40%.',
      cost: { lifespan: 60 },
      effect: {
        damage: { multiplier: 6.5, ignoreDefense: 0.55 },
        debuff: { attack: -0.4, defense: -0.4, spirit: -0.4, duration: 4 }
      },
      cooldown: 6
    }
  },

  // Mythic Heaven Earth Essences (10 types)
  'hee_031': {
    id: 'hee_031',
    name: 'Primordial Vapor Cloud',
    description: 'A cloud of purple mist from the dawn of the apocalypse.',
    rarity: 'Mythic',
    quality: 180,
    effects: { spiritBonus: 1200, hpBonus: 2500, specialEffect: 'Extreme spirit capacity and growth speed.' },
    battleEffect: {
      type: 'buff',
      name: 'Vapor Burst',
      description: 'Spend 70 survival days to gain +120% spirit and +80% max HP for 7 turns.',
      cost: { lifespan: 70 },
      effect: {
        buff: { spirit: 1.2, maxHp: 0.8, duration: 7 }
      },
      cooldown: 9
    }
  },
  'hee_032': {
    id: 'hee_032',
    name: 'Genesis Core-Disk Pro',
    description: 'The ultimate blueprint disk of biological life.',
    rarity: 'Mythic',
    quality: 185,
    effects: { hpBonus: 3000, attackBonus: 900, defenseBonus: 700, spiritBonus: 1000, specialEffect: 'Extreme boost for all primary attributes.' },
    battleEffect: {
      type: 'buff',
      name: 'Genesis Protocol',
      description: 'Spend 72 survival days to gain +80% for all stats and +60% crit chance for 7 turns.',
      cost: { lifespan: 72 },
      effect: {
        buff: { attack: 0.8, defense: 0.8, spirit: 0.8, physique: 0.8, speed: 0.8, critChance: 0.6, duration: 7 }
      },
      cooldown: 9
    }
  },
  'hee_033': {
    id: 'hee_033',
    name: 'Singularity Aegis',
    description: 'A defensive construct born from a gravitational singularity.',
    rarity: 'Mythic',
    quality: 190,
    effects: { defenseBonus: 1000, hpBonus: 4000, specialEffect: 'Ultimate defense. Can withstand fatal strikes.' },
    battleEffect: {
      type: 'buff',
      name: 'Singularity Guard',
      description: 'Spend 75 survival days to gain +100% defense, 70% damage reduction, and death immunity.',
      cost: { lifespan: 75 },
      effect: {
        buff: { defense: 1.0, damageReduction: 0.7, immunity: true, duration: 7 }
      },
      cooldown: 9
    }
  },
  'hee_034': {
    id: 'hee_034',
    name: 'Apex Titan Blade',
    description: 'The most powerful pre-war weapon, capable of carving through any defense.',
    rarity: 'Mythic',
    quality: 195,
    effects: { attackBonus: 1500, speedBonus: 150, specialEffect: 'Ultimate offense. Shatters all biological armor.' },
    battleEffect: {
      type: 'damage',
      name: 'Titan Slash',
      description: 'Spend 73 survival days to deal 8x attack damage, ignoring 80% defense. Guaranteed crit.',
      cost: { lifespan: 73 },
      effect: {
        damage: { multiplier: 8, ignoreDefense: 0.8, guaranteedCrit: true }
      },
      cooldown: 7
    }
  },
  'hee_035': {
    id: 'hee_035',
    name: 'Molecular Refiner',
    description: 'An advanced synthesizer capable of refining any matter into pure vitality.',
    rarity: 'Mythic',
    quality: 200,
    effects: { spiritBonus: 1500, hpBonus: 3500, specialEffect: 'Extreme spirit recovery and refining power.' },
    battleEffect: {
      type: 'buff',
      name: 'Refinement Mode',
      description: 'Spend 74 survival days to gain +110% spirit and 25% HP regen per turn.',
      cost: { lifespan: 74 },
      effect: {
        buff: { spirit: 1.1, regen: 0.25, duration: 7 }
      },
      cooldown: 9
    }
  },
  'hee_036': {
    id: 'hee_036',
    name: 'World-Map Processor',
    description: 'A quantum processor containing a complete map of the wasteland.',
    rarity: 'Mythic',
    quality: 205,
    effects: { hpBonus: 5000, defenseBonus: 800, specialEffect: 'Extreme vitality. Acts as an independent pocket world.' },
    battleEffect: {
      type: 'heal',
      name: 'Map Shielding',
      description: 'Spend 76 survival days to restore 100% max HP and gain +90% defense.',
      cost: { lifespan: 76 },
      effect: {
        heal: { percentOfMaxHp: 1.0 },
        buff: { defense: 0.9, duration: 8 }
      },
      cooldown: 10
    }
  },
  'hee_037': {
    id: 'hee_037',
    name: 'Genetic Purifier',
    description: 'A device that purges all mutations and harmful data from the body.',
    rarity: 'Mythic',
    quality: 210,
    effects: { spiritBonus: 1800, defenseBonus: 900, specialEffect: 'Ultimate spirit defense. Immune to all status effects.' },
    battleEffect: {
      type: 'buff',
      name: 'Pure Genesis',
      description: 'Spend 77 survival days to gain +130% spirit and total immunity for 8 turns.',
      cost: { lifespan: 77 },
      effect: {
        buff: { spirit: 1.3, magicDefense: 1.0, immunity: true, duration: 8 }
      },
      cooldown: 10
    }
  },
  'hee_038': {
    id: 'hee_038',
    name: 'Bio-Disrupter',
    description: 'A pre-war weapon that disrupts the molecular stability of targets.',
    rarity: 'Mythic',
    quality: 215,
    effects: { attackBonus: 1200, spiritBonus: 1600, specialEffect: 'Ultimate mental offense. Disables enemy relics.' },
    battleEffect: {
      type: 'damage',
      name: 'Disruption Wave',
      description: 'Spend 78 survival days to deal 7.5x attack damage and reduce enemy attack by 50%.',
      cost: { lifespan: 78 },
      effect: {
        damage: { multiplier: 7.5, ignoreDefense: 0.7 },
        debuff: { attack: -0.5, duration: 5 }
      },
      cooldown: 7
    }
  },
  'hee_039': {
    id: 'hee_039',
    name: 'Gravitonic Orbs',
    description: 'Condensed gravitational spheres that can pin any target.',
    rarity: 'Mythic',
    quality: 220,
    effects: { spiritBonus: 2000, speedBonus: 200, specialEffect: 'Ultimate spirit control. Can freeze any target in place.' },
    battleEffect: {
      type: 'debuff',
      name: 'Gravity Well',
      description: 'Spend 79 survival days to deal 6x attack damage and reduce enemy speed by 100%.',
      cost: { lifespan: 79 },
      effect: {
        damage: { multiplier: 6 },
        debuff: { speed: -1.0, duration: 4 }
      },
      cooldown: 7
    }
  },
  'hee_040': {
    id: 'hee_040',
    name: 'Singularity Sphere',
    description: 'The ultimate singularity construct, containing infinite energy.',
    rarity: 'Mythic',
    quality: 225,
    effects: { hpBonus: 6000, attackBonus: 1800, defenseBonus: 1200, spiritBonus: 2500, specialEffect: 'All attributes reached their peak. Eternal stability.' },
    battleEffect: {
      type: 'buff',
      name: 'Singularity Reset',
      description: 'Spend 80 survival days to gain +100% stats, total immunity, and 30% regen for 9 turns.',
      cost: { lifespan: 80 },
      effect: {
        buff: { attack: 1.0, defense: 1.0, spirit: 1.0, physique: 1.0, speed: 1.0, immunity: true, regen: 0.3, duration: 9 }
      },
      cooldown: 10
    }
  },
};

// Heaven Earth Marrow System (40 types)
export const HEAVEN_EARTH_MARROWS: Record<string, HeavenEarthMarrow> = {
  // Common Heaven Earth Marrows (10 types)
  'hem_001': {
    id: 'hem_001',
    name: 'Starlight Marrow',
    description: 'Biological marrow infused with the energy of distant stars.',
    rarity: 'Common',
    quality: 30,
    refiningTime: 30,
    effects: { spiritBonus: 300, speedBonus: 40, specialEffect: 'Increases the power of orbital skills and night meditation.' },
    battleEffect: {
      type: 'buff',
      name: 'Star-Tide Flow',
      description: 'Spend 25 survival days to gain +60% spirit and +40% speed for 5 turns.',
      cost: { lifespan: 25 },
      effect: {
        buff: { spirit: 0.6, speed: 0.4, duration: 5 }
      },
      cooldown: 5
    }
  },
  'hem_002': {
    id: 'hem_002',
    name: 'Lunar Marrow',
    description: 'A cold, glowing essence harvested during peak lunar cycles.',
    rarity: 'Common',
    quality: 35,
    refiningTime: 35,
    effects: { spiritBonus: 350, hpBonus: 800, specialEffect: 'Increases spirit recovery and night survival efficiency.' },
    battleEffect: {
      type: 'heal',
      name: 'Lunar Vigor',
      description: 'Spend 28 survival days to restore 40% max HP and boost spirit by 50%.',
      cost: { lifespan: 28 },
      effect: {
        heal: { percentOfMaxHp: 0.4 },
        buff: { spirit: 0.5, duration: 4 }
      },
      cooldown: 5
    }
  },
  'hem_003': {
    id: 'hem_003',
    name: 'Solar Marrow',
    description: 'A searing essence condensed from direct solar isotopes.',
    rarity: 'Common',
    quality: 40,
    refiningTime: 40,
    effects: { attackBonus: 400, physiqueBonus: 200, specialEffect: 'Increases attack power and daytime efficiency.' },
    battleEffect: {
      type: 'damage',
      name: 'Solar Purge',
      description: 'Spend 30 survival days to deal 4.5x attack damage. Multiplied against mutants.',
      cost: { lifespan: 30 },
      effect: {
        damage: { multiplier: 4.5, ignoreDefense: 0.4, demonMultiplier: 1.5 }
      },
      cooldown: 5
    }
  },
  'hem_004': {
    id: 'hem_004',
    name: 'Tectonic Marrow',
    description: 'Marrow harvested from the deepest tectonic veins of the wasteland.',
    rarity: 'Common',
    quality: 45,
    refiningTime: 45,
    effects: { defenseBonus: 500, hpBonus: 1000, specialEffect: 'Greatly increases physical and structural defense.' },
    battleEffect: {
      type: 'buff',
      name: 'Earth-Shield Guard',
      description: 'Spend 32 survival days to gain +70% defense and 40% damage reduction for 5 turns.',
      cost: { lifespan: 32 },
      effect: {
        buff: { defense: 0.7, damageReduction: 0.4, duration: 5 }
      },
      cooldown: 6
    }
  },
  'hem_005': {
    id: 'hem_005',
    name: 'Aero Marrow',
    description: 'A lightweight essence harvested from high-altitude currents.',
    rarity: 'Common',
    quality: 50,
    refiningTime: 50,
    effects: { speedBonus: 60, spiritBonus: 400, specialEffect: 'Increases movement speed and aero-tech power.' },
    battleEffect: {
      type: 'buff',
      name: 'Wind-Step Surge',
      description: 'Spend 33 survival days to gain +90% speed and +50% dodge for 5 turns.',
      cost: { lifespan: 33 },
      effect: {
        buff: { speed: 0.9, dodge: 0.5, duration: 5 }
      },
      cooldown: 5
    }
  },
  'hem_006': {
    id: 'hem_006',
    name: 'Ion Marrow',
    description: 'Marrow condensed from the heart of a high-voltage electrical storm.',
    rarity: 'Common',
    quality: 55,
    refiningTime: 55,
    effects: { attackBonus: 450, spiritBonus: 380, specialEffect: 'Increases electrical skill power and survival success.' },
    battleEffect: {
      type: 'damage',
      name: 'Ion Storm Strike',
      description: 'Spend 35 survival days to deal 5x attack damage with 60% extra crit chance.',
      cost: { lifespan: 35 },
      effect: {
        damage: { multiplier: 5, ignoreDefense: 0.45 },
        buff: { critChance: 0.6, duration: 3 }
      },
      cooldown: 5
    }
  },
  'hem_007': {
    id: 'hem_007',
    name: 'Thermal Marrow',
    description: 'Marrow infused with pure radioactive heat.',
    rarity: 'Common',
    quality: 60,
    refiningTime: 60,
    effects: { attackBonus: 500, physiqueBonus: 250, specialEffect: 'Increases fire skill power. Attacks inflict burn.' },
    battleEffect: {
      type: 'damage',
      name: 'Thermal Purge',
      description: 'Spend 36 survival days to deal 5.2x attack damage with persistent heat erosion.',
      cost: { lifespan: 36 },
      effect: {
        damage: { multiplier: 5.2 },
        debuff: { hp: -0.09, duration: 4 }
      },
      cooldown: 5
    }
  },
  'hem_008': {
    id: 'hem_008',
    name: 'Hydro Marrow',
    description: 'A dense liquid marrow harvested from deep industrial reservoirs.',
    rarity: 'Common',
    quality: 65,
    refiningTime: 65,
    effects: { spiritBonus: 450, defenseBonus: 350, specialEffect: 'Increases industrial-liquid skill power and defense.' },
    battleEffect: {
      type: 'buff',
      name: 'Sump Shield',
      description: 'Spend 37 survival days to gain +60% defense and +50% spirit for 5 turns.',
      cost: { lifespan: 37 },
      effect: {
        buff: { defense: 0.6, spirit: 0.5, duration: 5 }
      },
      cooldown: 5
    }
  },
  'hem_009': {
    id: 'hem_009',
    name: 'Bio-Marrow',
    description: 'Living biological marrow extracted from ancient mutant trees.',
    rarity: 'Common',
    quality: 70,
    refiningTime: 70,
    effects: { hpBonus: 1200, spiritBonus: 420, specialEffect: 'Increases biological recovery and plant-tech power.' },
    battleEffect: {
      type: 'heal',
      name: 'Bio-Pulse Regen',
      description: 'Spend 38 survival days to restore 50% max HP and gain 12% regen for 5 turns.',
      cost: { lifespan: 38 },
      effect: {
        heal: { percentOfMaxHp: 0.5 },
        buff: { regen: 0.12, duration: 5 }
      },
      cooldown: 6
    }
  },
  'hem_010': {
    id: 'hem_010',
    name: 'Fusion Marrow',
    description: 'Synthetic marrow infused with concentrated metallic isotopes.',
    rarity: 'Common',
    quality: 75,
    refiningTime: 75,
    effects: { attackBonus: 550, defenseBonus: 400, specialEffect: 'Increases metallic skill power and armor piercing.' },
    battleEffect: {
      type: 'damage',
      name: 'Fusion Penetrator',
      description: 'Spend 39 survival days to deal 5.5x attack damage, ignoring 50% defense.',
      cost: { lifespan: 39 },
      effect: {
        damage: { multiplier: 5.5, ignoreDefense: 0.5 }
      },
      cooldown: 5
    }
  },

  // Rare Heaven Earth Marrows (10 types)
  'hem_011': {
    id: 'hem_011',
    name: 'Phase Marrow',
    description: 'Biological marrow infused with spatial phase-shifting data.',
    rarity: 'Rare',
    quality: 80,
    refiningTime: 80,
    effects: { speedBonus: 100, spiritBonus: 600, specialEffect: 'Significantly increases speed and allows for minor time manipulation.' },
    battleEffect: {
      type: 'buff',
      name: 'Phase Control',
      description: 'Spend 45 survival days to gain +100% speed and +70% dodge for 6 turns.',
      cost: { lifespan: 45 },
      effect: {
        buff: { speed: 1.0, dodge: 0.7, duration: 6 }
      },
      cooldown: 7
    }
  },
  'hem_012': {
    id: 'hem_012',
    name: 'Flux Marrow',
    description: 'Marrow that exists in a state of constant probability flux.',
    rarity: 'Rare',
    quality: 85,
    refiningTime: 85,
    effects: { hpBonus: 2000, spiritBonus: 700, specialEffect: 'Ultimate fortune. Massive increase in mission success rates.' },
    battleEffect: {
      type: 'buff',
      name: 'Flux Vigor',
      description: 'Spend 42 survival days to gain +40% for all stats and +60% crit chance for 6 turns.',
      cost: { lifespan: 42 },
      effect: {
        buff: { attack: 0.4, defense: 0.4, spirit: 0.4, physique: 0.4, speed: 0.4, critChance: 0.6, duration: 6 }
      },
      cooldown: 7
    }
  },
  'hem_013': {
    id: 'hem_013',
    name: 'Echo Marrow',
    description: 'Marrow that absorbs energy and echoes it back at attackers.',
    rarity: 'Rare',
    quality: 90,
    refiningTime: 90,
    effects: { attackBonus: 800, defenseBonus: 600, specialEffect: 'Attacks inflict Retribution and defense reflects damage.' },
    battleEffect: {
      type: 'buff',
      name: 'Echo Retribution',
      description: 'Spend 44 survival days to gain +50% attack and +50% reflect for 6 turns.',
      cost: { lifespan: 44 },
      effect: {
        buff: { attack: 0.5, reflectDamage: 0.5, duration: 6 }
      },
      cooldown: 7
    }
  },
  'hem_014': {
    id: 'hem_014',
    name: 'Revive Marrow',
    description: 'Highly regenerative marrow capable of re-initializing biological life.',
    rarity: 'Rare',
    quality: 95,
    refiningTime: 95,
    effects: { hpBonus: 2500, spiritBonus: 800, specialEffect: 'Can re-initialize life upon death, retaining power.' },
    battleEffect: {
      type: 'heal',
      name: 'System Rebirth',
      description: 'Spend 46 survival days to restore 70% max HP and gain a permanent Revive Mark.',
      cost: { lifespan: 46 },
      effect: {
        heal: { percentOfMaxHp: 0.7 },
        buff: { revive: 1, duration: -1 }
      },
      cooldown: 8
    }
  },
  'hem_015': {
    id: 'hem_015',
    name: 'Ghost Marrow',
    description: 'Marrow that allows the body to pass through solid matter and energy.',
    rarity: 'Rare',
    quality: 100,
    refiningTime: 100,
    effects: { defenseBonus: 800, spiritBonus: 900, specialEffect: 'Can phase into a ghost state, immune to most physical fire.' },
    battleEffect: {
      type: 'buff',
      name: 'Ghost Form',
      description: 'Spend 48 survival days to gain +100% defense and +60% dodge for 5 turns.',
      cost: { lifespan: 48 },
      effect: {
        buff: { defense: 1.0, dodge: 0.6, duration: 5 }
      },
      cooldown: 7
    }
  },
  'hem_016': {
    id: 'hem_016',
    name: 'Eternal Marrow',
    description: 'Biological marrow that never degrades, granting ultimate longevity.',
    rarity: 'Rare',
    quality: 105,
    refiningTime: 105,
    effects: { hpBonus: 3000, physiqueBonus: 500, specialEffect: 'Biological life is effectively eternal. Greatly extends lifespan.' },
    battleEffect: {
      type: 'heal',
      name: 'Eternal Pulse',
      description: 'Spend 50 survival days to restore 80% max HP and gain 20% regen for 7 turns.',
      cost: { lifespan: 50 },
      effect: {
        heal: { percentOfMaxHp: 0.8 },
        buff: { regen: 0.2, duration: 7 }
      },
      cooldown: 8
    }
  },
  'hem_017': {
    id: 'hem_017',
    name: 'Genesis Marrow',
    description: 'Marrow containing the blueprints for cellular creation.',
    rarity: 'Rare',
    quality: 110,
    refiningTime: 110,
    effects: { spiritBonus: 1200, attackBonus: 900, specialEffect: 'Can create organic constructs. Massive increase in skill power.' },
    battleEffect: {
      type: 'buff',
      name: 'Genesis Might',
      description: 'Spend 52 survival days to gain +120% spirit and +80% attack for 6 turns.',
      cost: { lifespan: 52 },
      effect: {
        buff: { spirit: 1.2, attack: 0.8, duration: 6 }
      },
      cooldown: 8
    }
  },
  'hem_018': {
    id: 'hem_018',
    name: 'Havoc Marrow',
    description: 'Unstable marrow that unleashes destructive entropy upon contact.',
    rarity: 'Rare',
    quality: 115,
    refiningTime: 115,
    effects: { attackBonus: 1500, speedBonus: 120, specialEffect: 'Ultimate destruction. Attack power reached to the peak.' },
    battleEffect: {
      type: 'damage',
      name: 'Havoc Strike',
      description: 'Spend 54 survival days to deal 12x attack damage, ignoring 80% defense.',
      cost: { lifespan: 54 },
      effect: {
        damage: { multiplier: 12, ignoreDefense: 0.8 }
      },
      cooldown: 7
    }
  },
  'hem_019': {
    id: 'hem_019',
    name: 'Aegis Marrow',
    description: 'Marrow that establishes an unbreakable field of biological order.',
    rarity: 'Rare',
    quality: 120,
    refiningTime: 120,
    effects: { defenseBonus: 1000, spiritBonus: 1100, specialEffect: 'Establishes an Aegis Field. Ultimate defensive capacity.' },
    battleEffect: {
      type: 'buff',
      name: 'Aegis Field',
      description: 'Spend 56 survival days to gain +120% defense and 60% damage reduction for 7 turns.',
      cost: { lifespan: 56 },
      effect: {
        buff: { defense: 1.2, damageReduction: 0.6, duration: 7 }
      },
      cooldown: 8
    }
  },
  'hem_020': {
    id: 'hem_020',
    name: 'Singularity Marrow',
    description: 'Marrow that has collapsed into a stable biological singularity.',
    rarity: 'Rare',
    quality: 125,
    refiningTime: 125,
    effects: { hpBonus: 3500, attackBonus: 1200, defenseBonus: 900, specialEffect: 'Eternal singularity. All primary attributes balanced and boosted.' },
    battleEffect: {
      type: 'buff',
      name: 'Singularity Vigor',
      description: 'Spend 58 survival days to gain +70% stats and 15% regen per turn for 7 turns.',
      cost: { lifespan: 58 },
      effect: {
        buff: { attack: 0.7, defense: 0.7, spirit: 0.7, physique: 0.7, speed: 0.7, regen: 0.15, duration: 7 }
      },
      cooldown: 8
    }
  },

  // Legendary Heaven Earth Marrows (10 types)
  'hem_021': {
    id: 'hem_021',
    name: 'Zenith Marrow',
    description: 'The pinnacle of biological evolution, condensed into a single marrow sample.',
    rarity: 'Legendary',
    quality: 130,
    refiningTime: 130,
    effects: { spiritBonus: 2000, hpBonus: 4000, specialEffect: 'Ultimate growth potential. Massive increase in adaptation speed.' }
  },
  'hem_022': {
    id: 'hem_022',
    name: 'Geo Marrow',
    description: 'A dense essence harvested from the world\'s core foundations.',
    rarity: 'Legendary',
    quality: 135,
    refiningTime: 135,
    effects: { defenseBonus: 1500, hpBonus: 5000, specialEffect: 'Ultimate structural defense and vitality.' }
  },
  'hem_023': {
    id: 'hem_023',
    name: 'Hero Marrow',
    description: 'Marrow extracted from the remnants of a legendary pre-war soldier.',
    rarity: 'Legendary',
    quality: 140,
    refiningTime: 140,
    effects: { attackBonus: 1800, physiqueBonus: 800, specialEffect: 'Ultimate offensive capability and physical robustness.' }
  },
  'hem_024': {
    id: 'hem_024',
    name: 'Wraith Marrow',
    description: 'Marrow infused with the energy of the shadow realm.',
    rarity: 'Legendary',
    quality: 145,
    refiningTime: 145,
    effects: { spiritBonus: 2200, speedBonus: 180, specialEffect: 'Ultimate spirit power and movement speed.' }
  },
  'hem_025': {
    id: 'hem_025',
    name: 'Mutant Marrow',
    description: 'Marrow harvested from the most stable mutated organisms.',
    rarity: 'Legendary',
    quality: 150,
    refiningTime: 150,
    effects: { attackBonus: 2000, hpBonus: 4500, specialEffect: 'Ultimate offensive power and biological regeneration.' }
  },
  'hem_026': {
    id: 'hem_026',
    name: 'Entropy Marrow',
    description: 'Marrow that thrives on the breakdown of biological order.',
    rarity: 'Legendary',
    quality: 155,
    refiningTime: 155,
    effects: { attackBonus: 2200, spiritBonus: 2400, specialEffect: 'Ultimate attack power and spirit capacity.' }
  },
  'hem_027': {
    id: 'hem_027',
    name: 'Zen Marrow',
    description: 'Marrow that achieves perfect harmony between body and mind.',
    rarity: 'Legendary',
    quality: 160,
    refiningTime: 160,
    effects: { defenseBonus: 1800, spiritBonus: 2600, specialEffect: 'Ultimate defensive capacity and spirit focus.' }
  },
  'hem_028': {
    id: 'hem_028',
    name: 'Celestial Marrow',
    description: 'Marrow harvested from high-orbit research remains.',
    rarity: 'Legendary',
    quality: 165,
    refiningTime: 165,
    effects: { hpBonus: 6000, spiritBonus: 2800, specialEffect: 'Ultimate vitality and spirit resonance.' }
  },
  'hem_029': {
    id: 'hem_029',
    name: 'Divine Marrow',
    description: 'Marrow containing the ultimate blueprint for biological perfection.',
    rarity: 'Legendary',
    quality: 170,
    refiningTime: 170,
    effects: { attackBonus: 2500, defenseBonus: 2000, specialEffect: 'Ultimate offense and defense. Beyond biological limits.' }
  },
  'hem_030': {
    id: 'hem_030',
    name: 'Oracle Marrow',
    description: 'Marrow that has attained perfect foresight through genetic memory.',
    rarity: 'Legendary',
    quality: 175,
    refiningTime: 175,
    effects: { hpBonus: 8000, spiritBonus: 3000, specialEffect: 'Ultimate vitality and spirit mastery.' }
  },

  // Mythic Heaven Earth Marrows (10 types)
  'hem_031': {
    id: 'hem_031',
    name: 'Primordial Marrow',
    description: 'Genetic marrow from the dawn of creation, before the breakdown.',
    rarity: 'Mythic',
    quality: 180,
    refiningTime: 180,
    effects: { hpBonus: 10000, attackBonus: 3000, defenseBonus: 2500, spiritBonus: 4000, specialEffect: 'Primordial stability. All primary attributes reached their peak.' }
  },
  'hem_032': {
    id: 'hem_032',
    name: 'Chaos Marrow',
    description: 'Marrow that thrives within the heart of chaotic biological energy.',
    rarity: 'Mythic',
    quality: 185,
    refiningTime: 185,
    effects: { attackBonus: 3500, spiritBonus: 4500, specialEffect: 'Chaos convergence. Extreme offensive and spirit capabilities.' }
  },
  'hem_033': {
    id: 'hem_033',
    name: 'Genesis Marrow Pro',
    description: 'The definitive blueprint for biological life constructs.',
    rarity: 'Mythic',
    quality: 190,
    refiningTime: 190,
    effects: { defenseBonus: 3000, hpBonus: 12000, specialEffect: 'Genesis protection. Extreme defense and vitality.' }
  },
  'hem_034': {
    id: 'hem_034',
    name: 'Weaver Marrow',
    description: 'Marrow that can weave and reshape biological reality at will.',
    rarity: 'Mythic',
    quality: 195,
    refiningTime: 195,
    effects: { spiritBonus: 5000, speedBonus: 300, specialEffect: 'Infinite creation. Extreme spirit and movement capacity.' }
  },
  'hem_035': {
    id: 'hem_035',
    name: 'Destiny Marrow',
    description: 'Marrow that has been genetically programmed for an ultimate purpose.',
    rarity: 'Mythic',
    quality: 200,
    refiningTime: 200,
    effects: { hpBonus: 15000, spiritBonus: 5500, specialEffect: 'Master of destiny. Extreme vitality and spirit Mastery.' }
  },
  'hem_036': {
    id: 'hem_036',
    name: 'Karma Marrow',
    description: 'Marrow that balances all biological actions with equivalent responses.',
    rarity: 'Mythic',
    quality: 205,
    refiningTime: 205,
    effects: { attackBonus: 4000, defenseBonus: 3500, specialEffect: 'Cycle of karma. Extreme offense and defense capability.' }
  },
  'hem_037': {
    id: 'hem_037',
    name: 'Samsara Marrow',
    description: 'Marrow that perpetually cycles through life and rebirth.',
    rarity: 'Mythic',
    quality: 210,
    refiningTime: 210,
    effects: { hpBonus: 20000, physiqueBonus: 1500, specialEffect: 'Eternal Samsara. Extreme vitality and robustness.' }
  },
  'hem_038': {
    id: 'hem_038',
    name: 'Chronos Marrow',
    description: 'Marrow that exists independently of the standard biological clock.',
    rarity: 'Mythic',
    quality: 215,
    refiningTime: 215,
    effects: { speedBonus: 500, spiritBonus: 6000, specialEffect: 'Temporal Mastery. Extreme speed and spirit capacity.' }
  },
  'hem_039': {
    id: 'hem_039',
    name: 'Eternal Marrow Pro',
    description: 'The ultimate persistent biological construct.',
    rarity: 'Mythic',
    quality: 220,
    refiningTime: 220,
    effects: { hpBonus: 25000, defenseBonus: 4000, specialEffect: 'Absolute eternity. Extreme vitality and defense.' }
  },
  'hem_040': {
    id: 'hem_040',
    name: 'Origin Marrow',
    description: 'The source of all biological information in the wasteland.',
    rarity: 'Mythic',
    quality: 225,
    refiningTime: 225,
    effects: { hpBonus: 30000, attackBonus: 5000, defenseBonus: 4500, spiritBonus: 7000, speedBonus: 600, specialEffect: 'True convergence. All primary attributes reached their peak.' }
  },
};

// Rule Power System
export const LONGEVITY_RULES: Record<string, LongevityRule> = {
  'lr_001': {
    id: 'lr_001',
    name: 'Temporal Prototype',
    description: 'A experimental pre-war device capable of manipulating local time flow.',
    power: 100,
    effects: { speedPercent: 0.5, specialEffect: 'Can manipulate time flow, gaining massive initiative in battle.' },
    battleEffect: {
      type: 'buff',
      name: 'Time Acceleration',
      description: 'Spend 50 survival days to gain +150% speed and +50% attack for 6 turns.',
      cost: { lifespan: 50 },
      effect: {
        buff: { speed: 1.5, attack: 0.5, duration: 6 }
      },
      cooldown: 8
    }
  },
  'lr_002': {
    id: 'lr_002',
    name: 'Spatial Protocol',
    description: 'A tactical protocol enabling short-range spatial warping.',
    power: 95,
    effects: { defensePercent: 0.4, specialEffect: 'Enables spatial jumping, significantly increasing dodge rates.' },
    battleEffect: {
      type: 'buff',
      name: 'Blink Warp',
      description: 'Spend 48 survival days to gain +80% dodge and +60% defense for 6 turns.',
      cost: { lifespan: 48 },
      effect: {
        buff: { dodge: 0.8, defense: 0.6, duration: 6 }
      },
      cooldown: 8
    }
  },
  'lr_003': {
    id: 'lr_003',
    name: 'Vitality Mesh',
    description: 'A nanite mesh that actively repairs and preserves biological life.',
    power: 90,
    effects: { hpPercent: 0.6, specialEffect: 'Ultimate recovery speed. Can re-initialize life once.' },
    battleEffect: {
      type: 'heal',
      name: 'Mesh Overdrive',
      description: 'Spend 45 survival days to restore 60% max HP and gain 15% regen for 6 turns.',
      cost: { lifespan: 45 },
      effect: {
        heal: { percentOfMaxHp: 0.6 },
        buff: { regen: 0.15, duration: 6 }
      },
      cooldown: 7
    }
  },
  'lr_004': {
    id: 'lr_004',
    name: 'Entropy Trigger',
    description: 'A device that triggers accelerated entropic collapse in biological targets.',
    power: 85,
    effects: { attackPercent: 0.5, specialEffect: 'Attacks carry entropic decay, with a chance to instantly disable targets.' },
    battleEffect: {
      type: 'damage',
      name: 'Entropy Execution',
      description: 'Spend 42 survival days to deal 8x attack damage, ignoring 60% defense.',
      cost: { lifespan: 42 },
      effect: {
        damage: { multiplier: 8, ignoreDefense: 0.6 }
      },
      cooldown: 7
    }
  },
  'lr_005': {
    id: 'lr_005',
    name: 'Logic Matrix',
    description: 'A high-level matrix that calculates and forces specific combat outcomes.',
    power: 80,
    effects: { spiritPercent: 0.4, specialEffect: 'Can alter causal logic, ensuring attacks always hit.' },
    battleEffect: {
      type: 'buff',
      name: 'Logic Inversion',
      description: 'Spend 40 survival days to gain +60% attack and +70% crit chance for 5 turns.',
      cost: { lifespan: 40 },
      effect: {
        buff: { attack: 0.6, critChance: 0.7, duration: 5 }
      },
      cooldown: 7
    }
  },
  'lr_006': {
    id: 'lr_006',
    name: 'Probability Core',
    description: 'A core that manipulates probability fields to favor the user.',
    power: 75,
    effects: { hpPercent: 0.3, attackPercent: 0.3, specialEffect: 'Ultimate fortune. Massive increase in scavenger luck.' },
    battleEffect: {
      type: 'buff',
      name: 'Fortunate Strike',
      description: 'Spend 38 survival days to gain +50% stats and +100% crit damage for 5 turns.',
      cost: { lifespan: 38 },
      effect: {
        buff: { attack: 0.5, defense: 0.5, spirit: 0.5, physique: 0.5, speed: 0.5, critDamage: 1.0, duration: 5 }
      },
      cooldown: 7
    }
  },
  'lr_007': {
    id: 'lr_007',
    name: 'Synthesis Array',
    description: 'An array capable of synthesizing materials and energy from thin air.',
    power: 70,
    effects: { spiritPercent: 0.5, specialEffect: 'Can create complex artifacts. Significant increase in skill power.' },
    battleEffect: {
      type: 'buff',
      name: 'Synthesis Might',
      description: 'Spend 35 survival days to gain +100% spirit and +70% attack for 5 turns.',
      cost: { lifespan: 35 },
      effect: {
        buff: { spirit: 1.0, attack: 0.7, duration: 5 }
      },
      cooldown: 6
    }
  },
  'lr_008': {
    id: 'lr_008',
    name: 'Havoc Signal',
    description: 'A signal inhibitor that generates massive entropic havoc in targets.',
    power: 65,
    effects: { attackPercent: 0.6, specialEffect: 'Triggers total havoc. Attack power reaches to the peak.' },
    battleEffect: {
      type: 'damage',
      name: 'Havoc Strike',
      description: 'Spend 33 survival days to deal 10x attack damage, ignoring 70% defense.',
      cost: { lifespan: 33 },
      effect: {
        damage: { multiplier: 10, ignoreDefense: 0.7 }
      },
      cooldown: 6
    }
  },
  'lr_009': {
    id: 'lr_009',
    name: 'System Order',
    description: 'A system-level override that enforces rigid physical order.',
    power: 60,
    effects: { defensePercent: 0.5, specialEffect: 'Establishes a System Order field. Ultimate defensive capacity.' },
    battleEffect: {
      type: 'buff',
      name: 'System Guard',
      description: 'Spend 30 survival days to gain +100% defense and 50% damage reduction for 6 turns.',
      cost: { lifespan: 30 },
      effect: {
        buff: { defense: 1.0, damageReduction: 0.5, duration: 6 }
      },
      cooldown: 6
    }
  },
  'lr_010': {
    id: 'lr_010',
    name: 'Chaos Flux',
    description: 'A generator that harnesses the power of chaotic radioactive flux.',
    power: 55,
    effects: { hpPercent: 0.4, attackPercent: 0.4, defensePercent: 0.4, specialEffect: 'Eternal flux. All attributes balanced and boosted.' },
    battleEffect: {
      type: 'buff',
      name: 'Flux Surge',
      description: 'Spend 28 survival days to gain +60% stats and 10% regen per turn for 6 turns.',
      cost: { lifespan: 28 },
      effect: {
        buff: { attack: 0.6, defense: 0.6, spirit: 0.6, physique: 0.6, speed: 0.6, regen: 0.1, duration: 6 }
      },
      cooldown: 6
    }
  }
};

