/**
 * Mutant Pet System Constants
 */

import { PetTemplate, PetSkill, ItemRarity } from '../types';

export const PET_SKILLS: PetSkill[] = [
  {
    id: 'skill-bite',
    name: 'Bite',
    description: 'A basic attack with sharp fangs.',
    type: 'attack',
    effect: { damage: 10 },
  },
  {
    id: 'skill-heal',
    name: 'Field Medic',
    description: 'Heals the owner using basic medical supplies.',
    type: 'support',
    effect: { heal: 50 },
  },
  {
    id: 'skill-protect',
    name: 'Guard',
    description: 'Provides cover and increases owner defense.',
    type: 'defense',
    effect: { buff: { defense: 100 } },
  },
  {
    id: 'skill-blessing',
    name: 'Inspiration',
    description: 'Boosts morale, increasing both attack and defense.',
    type: 'support',
    effect: { buff: { attack: 150, defense: 75 } },
  },
];

// Pet Evolution Material Pool
// Evolution materials for pets
export const PET_EVOLUTION_MATERIALS = [
  // Juvenile -> Adult materials
  { name: 'Energy Cell', rarity: 'Common' as ItemRarity, description: 'A small battery pack containing a charge. Essential for various tech blueprints.' },
  { name: 'Mutant Core', rarity: 'Common' as ItemRarity, description: 'A core found within mutant creatures, containing raw power.' },
  { name: 'Mutant Blood', rarity: 'Rare' as ItemRarity, description: 'Concentrated mutant blood, containing immense vitality.' },
  { name: 'Glow Stone', rarity: 'Rare' as ItemRarity, description: 'A stone that glows with an eerie light, helpful for evolution.' },
  { name: 'Meteor Fragment', rarity: 'Rare' as ItemRarity, description: 'A fragment of a fallen star, vibrating with mysterious energy.' },
  { name: 'Tough Scale', rarity: 'Legendary' as ItemRarity, description: 'A thick, near-indestructible scale from a prime mutant.' },
  { name: 'Fiery Feather', rarity: 'Legendary' as ItemRarity, description: 'A feather that never stops smoldering.' },
  { name: 'Mythic Horn', rarity: 'Legendary' as ItemRarity, description: 'A horn from a legendary wasteland beast.' },
  // Adult -> Elder materials
  { name: 'Mutant Fruit', rarity: 'Rare' as ItemRarity, description: 'A rare fruit that grew in a high-radiation zone.' },
  { name: 'Super Stim', rarity: 'Legendary' as ItemRarity, description: 'A highly concentrated healing stimulant.' },
  { name: 'Rare Relic', rarity: 'Legendary' as ItemRarity, description: 'A pre-war relic of immense value and power.' },
  { name: 'Essence of Power', rarity: 'Legendary' as ItemRarity, description: 'Concentrated power from an apex mutant.' },
  { name: 'Chaos Core', rarity: 'Mythic' as ItemRarity, description: 'A glowing core from the heart of the chaos zone.' },
  { name: 'Code Fragment', rarity: 'Mythic' as ItemRarity, description: 'A piece of a master control unit, containing advanced logic.' },
  { name: 'Pure Essence', rarity: 'Mythic' as ItemRarity, description: 'The purest form of energy found in the wasteland.' },
  { name: 'Origin Fluid', rarity: 'Mythic' as ItemRarity, description: 'A mysterious fluid that can reshape organic matter.' },
];

// Randomly select a name from the template variants
export const getRandomPetName = (template: PetTemplate): string => {
  if (template.nameVariants && template.nameVariants.length > 0) {
    return template.nameVariants[Math.floor(Math.random() * template.nameVariants.length)];
  }
  return template.name;
};


export const PET_TEMPLATES: PetTemplate[] = [
  {
    id: 'pet-spirit-fox',
    name: 'Radroach',
    nameVariants: ['Radroach', 'Giant Radroach', 'Glowing Radroach', 'Alpha Radroach'],
    species: 'Insect',
    description: 'A common wasteland pest. Weak but numerous. Makes a surprisingly loyal companion.',
    rarity: 'Common',
    image: '🦊',
    stageImages: {
      stage1: '🦊',
      stage2: '🎑',
    },
    baseStats: { attack: 50, defense: 25, hp: 500, speed: 30 },
    skills: [
      {
        id: 'skill-bite',
        name: 'Spirit Bite',
        description: 'A basic bite infused with spiritual energy.',
        type: 'attack',
        effect: { damage: 50 },
      },
      {
        id: 'skill-heal',
        name: 'Healing Glow',
        description: 'Restores a small amount of vitality.',
        type: 'support',
        effect: { heal: 250 },
      },
    ],
    stageSkills: {
      stage1: [
        {
          id: 'skill-fox-fire',
          name: 'Spirit Flame',
          description: 'Launches a burst of spiritual fire at the enemy.',
          type: 'attack',
          effect: { damage: 150 },
          cooldown: 3,
        }
      ],
      stage2: [
        {
          id: 'skill-fox-enchant',
          name: 'Mesmerize',
          description: 'Distracts the enemy, dealing mental damage.',
          type: 'attack',
          effect: { damage: 200 },
          cooldown: 5,
        }
      ]
    },
    evolutionRequirements: {
      stage1: {
        level: 10,
        items: [{ name: 'Energy Cell', quantity: 10 }],
      },
      stage2: {
        level: 30,
        items: [{ name: 'Mutant Blood', quantity: 5 }, { name: 'Glow Stone', quantity: 3 }],
      },
    },
    evolutionNames: {
      stage1: 'Nine-Tailed Spirit Fox',
      stage2: 'Empyrean Fox',
    },
  },
  {
    id: 'pet-thunder-tiger',
    name: 'Yao Guai',
    nameVariants: ['Yao Guai', 'Irradiated Yao Guai', 'Stunted Yao Guai', 'Glowing Yao Guai'],
    species: 'Bear',
    description: 'A massive mutated bear. Extremely powerful and territorial. Only the brave can tame one.',
    rarity: 'Rare',
    image: '🐅',
    stageImages: {
      stage1: '🐆',
      stage2: '⚡',
    },
    baseStats: { attack: 100, defense: 50, hp: 1000, speed: 40 },
    skills: [
      {
        id: 'skill-bite',
        name: 'Thunder Bite',
        description: 'A powerful bite that deals physical damage.',
        type: 'attack',
        effect: { damage: 150 },
      },
      {
        id: 'skill-thunder',
        name: 'Ion Bolt',
        description: 'A focused discharge of electrical energy.',
        type: 'attack',
        effect: { damage: 50 },
        cooldown: 3,
      },
    ],
    stageSkills: {
      stage1: [
        {
          id: 'skill-thunder-roar',
          name: 'Thunder Roar',
          description: 'Intimidates the enemy while dealing massive damage.',
          type: 'attack',
          effect: { damage: 300 },
          cooldown: 4,
        }
      ],
      stage2: [
        {
          id: 'skill-heavenly-thunder',
          name: 'Celestial Strike',
          description: 'Calls down a massive lightning bolt from the sky.',
          type: 'attack',
          effect: { damage: 800 },
          cooldown: 6,
        }
      ]
    },
    evolutionRequirements: {
      stage1: {
        level: 20,
        items: [{ name: 'Mutant Core', quantity: 5 }, { name: 'Meteor Fragment', quantity: 3 }],
      },
      stage2: {
        level: 50,
        items: [{ name: 'Tough Scale', quantity: 3 }, { name: 'Essence of Power', quantity: 2 }],
      },
    },
    evolutionNames: {
      stage1: 'Volt Tiger King',
      stage2: 'Thunder God Tiger',
    },
  },
  {
    id: 'pet-phoenix',
    name: 'Deathclaw',
    nameVariants: ['Deathclaw', 'Alpha Deathclaw', 'Glowing Deathclaw', 'Matriarch Deathclaw'],
    species: 'Reptile',
    description: 'The apex predator of the wasteland. Incredibly deadly claws and near-impenetrable hide.',
    rarity: 'Mythic',
    image: '🦖',
    stageImages: {
      stage1: '🔥',
      stage2: '🌅',
    },
    baseStats: { attack: 200, defense: 100, hp: 2500, speed: 50 },
    skills: [
      {
        id: 'skill-blessing',
        name: 'Inspiration',
        description: 'Boosts combat stats',
        type: 'support',
        effect: { buff: { attack: 250, defense: 150 } },
        cooldown: 5,
      },
      {
        id: 'skill-rebirth',
        name: 'Rebirth',
        description: 'Vastly restores vitality',
        type: 'support',
        effect: { heal: 5000 },
        cooldown: 10,
      },
    ],
    stageSkills: {
      stage1: [
        {
          id: 'skill-phoenix-fire',
          name: 'Ignition Pulse',
          description: 'A burst of high-intensity solar heat',
          type: 'attack',
          effect: { damage: 600 },
          cooldown: 4,
        }
      ],
      stage2: [
        {
          id: 'skill-immortal-aura',
          name: 'Eternal Field',
          description: 'Radiates energy that boosts all stats',
          type: 'support',
          effect: { buff: { attack: 1000, defense: 500, hp: 2000 } },
          cooldown: 8,
        }
      ]
    },
    evolutionRequirements: {
      stage1: {
        level: 30,
        items: [{ name: 'Fiery Feather', quantity: 5 }, { name: 'Super Stim', quantity: 3 }],
      },
      stage2: {
        level: 70,
        items: [{ name: 'Chaos Core', quantity: 2 }, { name: 'Code Fragment', quantity: 2 }, { name: 'Pure Essence', quantity: 1 }],
      },
    },
    evolutionNames: {
      stage1: 'Immortal Fire Hawk',
      stage2: 'Solar Deity Hawk',
    },
  },
  // Additional Pet Templates
  {
    id: 'pet-ice-dragon',
    name: 'Feral Ghoul',
    nameVariants: ['Feral Ghoul', 'Glowing One', 'Reaver', 'Ghoul Roamer'],
    species: 'Humanoid',
    description: 'A radiation-twisted human. Fast, relentless, and surprisingly resilient.',
    rarity: 'Legendary',
    image: '🧟',
    stageImages: {
      stage1: '🐲',
      stage2: '🧊',
    },
    baseStats: { attack: 150, defense: 75, hp: 2000, speed: 50 },
    skills: [
      {
        id: 'skill-ice-breath',
        name: 'Frost Breath',
        description: 'Area of effect frost damage',
        type: 'attack',
        effect: { damage: 400 },
        cooldown: 4,
      },
      {
        id: 'skill-ice-shield',
        name: 'Frost Shield',
        description: 'Increases owner protection with ice',
        type: 'defense',
        effect: { buff: { defense: 200 } },
        cooldown: 5,
      },
    ],
    stageSkills: {
      stage1: [
        {
          id: 'skill-ice-prison',
          name: 'Frost Prison',
          description: 'Traps the enemy and deals high damage',
          type: 'attack',
          effect: { damage: 800 },
          cooldown: 5,
        }
      ],
      stage2: [
        {
          id: 'skill-absolute-zero',
          name: 'Absolute Zero',
          description: 'A field of extreme cold that freezes everything',
          type: 'attack',
          effect: { damage: 2000 },
          cooldown: 8,
        }
      ]
    },
    evolutionRequirements: {
      stage1: {
        level: 25,
        items: [{ name: 'Tough Scale', quantity: 5 }, { name: 'Meteor Fragment', quantity: 5 }],
      },
      stage2: {
        level: 60,
        items: [{ name: 'Essence of Power', quantity: 3 }, { name: 'Rare Relic', quantity: 2 }],
      },
    },
    evolutionNames: {
      stage1: 'Glacier King Drake',
      stage2: 'Primal Frost God',
    },
  },
  {
    id: 'pet-fire-bird',
    name: 'Blaze Wing',
    nameVariants: ['Blaze Wing', 'Ember Bird', 'Flare Wing', 'Inferno Bird', 'Cinder Bird', 'Scorch Bird', 'Ignite Bird', 'Pyro Bird'],
    species: 'Bird',
    description: 'A glowing bird that controls the destructive power of fire.',
    rarity: 'Rare',
    image: '🔥',
    stageImages: {
      stage1: '🐥',
      stage2: '🐦',
    },
    baseStats: { attack: 100, defense: 50, hp: 1000, speed: 40 },
    skills: [
      {
        id: 'skill-fire-storm',
        name: 'Inferno Burst',
        description: 'Area of effect fire damage',
        type: 'attack',
        effect: { damage: 70 },
        cooldown: 3,
      },
    ],
    stageSkills: {
      stage1: [
        {
          id: 'skill-fire-wing',
          name: 'Flame Wing',
          description: 'Slashes with wings of fire',
          type: 'attack',
          effect: { damage: 300 },
          cooldown: 3,
        }
      ],
      stage2: [
        {
          id: 'skill-vermilion-bird-strike',
          name: 'Phoenix Strike',
          description: 'A devastating solar-powered charge',
          type: 'attack',
          effect: { damage: 1200 },
          cooldown: 6,
        }
      ]
    },
    evolutionRequirements: {
      stage1: {
        level: 15,
        items: [{ name: 'Mutant Core', quantity: 8 }, { name: 'Mutant Blood', quantity: 3 }],
      },
      stage2: {
        level: 40,
        items: [{ name: 'Fiery Feather', quantity: 3 }, { name: 'Mutant Fruit', quantity: 5 }],
      },
    },
    evolutionNames: {
      stage1: 'Inferno Blaze Wing',
      stage2: 'Ember Lord',
    },
  },
  {
    id: 'pet-earth-turtle',
    name: 'Armored Shell',
    nameVariants: ['Armored Shell', 'Stone Turtle', 'Mountain Back', 'Geo Tortoise', 'Iron Shell', 'Shield Turtle', 'Guardian Turtle', 'Earth Tortoise'],
    species: 'Turtle',
    description: 'A heavily armored turtle that provides absolute protection.',
    rarity: 'Common',
    image: '🐢',
    stageImages: {
      stage1: '🛡️',
      stage2: '⛰️',
    },
    baseStats: { attack: 30, defense: 50, hp: 500, speed: 20 },
    skills: [
      {
        id: 'skill-earth-shield',
        name: 'Tectonic Barrier',
        description: 'Massively increases defense and vitality',
        type: 'defense',
        effect: { buff: { defense: 300, hp: 500 } },
        cooldown: 6,
      },
    ],
    stageSkills: {
      stage1: [
        {
          id: 'skill-iron-defense',
          name: 'Iron Guard',
          description: 'Absolute defense, reflects some damage',
          type: 'defense',
          effect: { buff: { defense: 800 } },
          cooldown: 8,
        }
      ],
      stage2: [
        {
          id: 'skill-world-turtle',
          name: 'Pillar of the Waste',
          description: 'Channels earth energy for unbreakable defense',
          type: 'defense',
          effect: { buff: { defense: 2000, hp: 5000 } },
          cooldown: 12,
        }
      ]
    },
    evolutionRequirements: {
      stage1: {
        level: 12,
        items: [{ name: 'Energy Cell', quantity: 15 }],
      },
      stage2: {
        level: 35,
        items: [{ name: 'Glow Stone', quantity: 5 }, { name: 'Meteor Fragment', quantity: 5 }],
      },
    },
    evolutionNames: {
      stage1: 'Elder Turtle',
      stage2: 'World Guardian',
    },
  },
  {
    id: 'pet-wind-wolf',
    name: 'Cyber Wolf',
    nameVariants: ['Cyber Wolf', 'Wind Wolf', 'Swift Wolf', 'Storm Wolf', 'Neon Wolf', 'Ghost Wolf', 'Holo Wolf', 'Alpha Wolf'],
    species: 'Wolf',
    description: 'An incredibly fast mutant wolf, skilled in lightning attacks.',
    rarity: 'Rare',
    image: '🐺',
    stageImages: {
      stage1: '🐕',
      stage2: '💨',
    },
    baseStats: { attack: 100, defense: 50, hp: 1000, speed: 55 },
    skills: [
      {
        id: 'skill-wind-blade',
        name: 'Wind Blade',
        description: 'High-speed cutting attack',
        type: 'attack',
        effect: { damage: 275 },
        cooldown: 2,
      },
    ],
    stageSkills: {
      stage1: [
        {
          id: 'skill-howl',
          name: 'Lunar Howl',
          description: 'Increases attack and speed significantly',
          type: 'support',
          effect: { buff: { attack: 500, speed: 50 } },
          cooldown: 6,
        }
      ],
      stage2: [
        {
          id: 'skill-celestial-wolf-slash',
          name: 'Nova Slash',
          description: 'A burst of ultra-fast charging attacks',
          type: 'attack',
          effect: { damage: 2500 },
          cooldown: 5,
        }
      ]
    },
    evolutionRequirements: {
      stage1: {
        level: 18,
        items: [{ name: 'Mutant Core', quantity: 6 }, { name: 'Mutant Blood', quantity: 2 }],
      },
      stage2: {
        level: 45,
        items: [{ name: 'Meteor Fragment', quantity: 8 }, { name: 'Mutant Fruit', quantity: 3 }],
      },
    },
    evolutionNames: {
      stage1: 'Omega Wolf',
      stage2: 'Celestial Wolf',
    },
  },
  {
    id: 'pet-water-serpent',
    name: 'Aqua Viper',
    nameVariants: ['Aqua Viper', 'Sea Serpent', 'Mist Snake', 'River Viper', 'Hydro Serpent', 'Flow Snake', 'Wave Viper', 'Tide Serpent'],
    species: 'Serpent',
    description: 'A flexible serpent skilled in field medicine and support.',
    rarity: 'Common',
    image: '🐍',
    baseStats: { attack: 50, defense: 25, hp: 500, speed: 30 },
    skills: [
      {
        id: 'skill-water-heal',
        name: 'Bio-Mist',
        description: 'Restores vitality',
        type: 'support',
        effect: { heal: 400 },
        cooldown: 4,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 10,
        items: [{ name: 'Energy Cell', quantity: 12 }],
      },
      stage2: {
        level: 30,
        items: [{ name: 'Glow Stone', quantity: 4 }, { name: 'Mutant Blood', quantity: 3 }],
      },
    },
    evolutionNames: {
      stage1: 'Hydro Serpent',
      stage2: 'Abyssal Wyrm',
    },
  },
  {
    id: 'pet-shadow-cat',
    name: 'Night Stalker',
    nameVariants: ['Night Stalker', 'Shadow Cat', 'Void Cougar', 'Ghost Lynx', 'Dark Cat', 'Midnight Stalker', 'Umbra Cat', 'Panther'],
    species: 'Cat',
    description: 'A mysterious cat that strikes from the shadows.',
    rarity: 'Rare',
    image: '🐱',
    baseStats: { attack: 100, defense: 50, hp: 1000, speed: 50 },
    skills: [
      {
        id: 'skill-shadow-strike',
        name: 'Shadow Strike',
        description: 'High-damage covert attack',
        type: 'attack',
        effect: { damage: 450 },
        cooldown: 4,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 20,
        items: [{ name: 'Mutant Core', quantity: 7 }, { name: 'Meteor Fragment', quantity: 4 }],
      },
      stage2: {
        level: 50,
        items: [{ name: 'Mythic Horn', quantity: 2 }, { name: 'Super Stim', quantity: 2 }],
      },
    },
    evolutionNames: {
      stage1: 'Shadow King',
      stage2: 'Phantom Panther',
    },
  },
  {
    id: 'pet-light-rabbit',
    name: 'Glow Rabbit',
    nameVariants: ['Glow Rabbit', 'Neon Bouncer', 'Rad-Hare', 'Beam Bunny', 'Lumen Rabbit', 'Nova Hare', 'Pulse Rabbit', 'Shine Bunny'],
    species: 'Rabbit',
    description: 'A glowing rabbit that emits a soothing light to heal allies.',
    rarity: 'Common',
    image: '🐰',
    baseStats: { attack: 50, defense: 30, hp: 500, speed: 35 },
    skills: [
      {
        id: 'skill-light-blessing',
        name: 'Solar Flare',
        description: 'Restores vitality and boosts minor stats',
        type: 'support',
        effect: { heal: 300, buff: { attack: 100, defense: 75 } },
        cooldown: 5,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 12,
        items: [{ name: 'Energy Cell', quantity: 15 }],
      },
      stage2: {
        level: 35,
        items: [{ name: 'Glow Stone', quantity: 5 }, { name: 'Mutant Fruit', quantity: 3 }],
      },
    },
    evolutionNames: {
      stage1: 'Neon Hare',
      stage2: 'Star Bunny',
    },
  },
  {
    id: 'pet-thunder-eagle',
    name: 'Storm Eagle',
    nameVariants: ['Storm Eagle', 'Thunder Hawk', 'Volt Talon', 'Sky Bolt', 'Circuit Bird', 'Static Eagle', 'Flash Hawk', 'Turbo Wing'],
    species: 'Bird',
    description: 'A high-flying predator that channels lightning through its feathers.',
    rarity: 'Legendary',
    image: '🦅',
    baseStats: { attack: 150, defense: 75, hp: 2000, speed: 50 },
    skills: [
      {
        id: 'skill-thunder-bolt',
        name: 'Ion Discharge',
        description: 'Powerful electric area-of-effect attack',
        type: 'attack',
        effect: { damage: 600 },
        cooldown: 4,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 25,
        items: [{ name: 'Tough Scale', quantity: 4 }, { name: 'Meteor Fragment', quantity: 6 }],
      },
      stage2: {
        level: 60,
        items: [{ name: 'Essence of Power', quantity: 3 }, { name: 'Rare Relic', quantity: 3 }],
      },
    },
    evolutionNames: {
      stage1: 'Titan Eagle',
      stage2: 'Storm God Raptor',
    },
  },
  {
    id: 'pet-poison-spider',
    name: 'Venom Weaver',
    nameVariants: ['Venom Weaver', 'Acid Spider', 'Toxin Spinner', 'Shadow Widow', 'Bio-Spider', 'Noxious Crawler', 'Fangs', 'Web Weaver'],
    species: 'Spider',
    description: 'A mutant spider that uses toxic chemicals to dissolve its enemies.',
    rarity: 'Rare',
    image: '🕷️',
    baseStats: { attack: 100, defense: 50, hp: 1000, speed: 40 },
    skills: [
      {
        id: 'skill-poison-bite',
        name: 'Toxic Bite',
        description: 'A bite that deals damage over time with poison',
        type: 'attack',
        effect: { damage: 325 },
        cooldown: 3,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 18,
        items: [{ name: 'Mutant Core', quantity: 8 }, { name: 'Mutant Blood', quantity: 3 }],
      },
      stage2: {
        level: 45,
        items: [{ name: 'Mythic Horn', quantity: 2 }, { name: 'Mutant Fruit', quantity: 4 }],
      },
    },
    evolutionNames: {
      stage1: 'Toxin Queen',
      stage2: 'Absolute Venom Monarch',
    },
  },
  {
    id: 'pet-forest-deer',
    name: 'Rad-Stag',
    nameVariants: ['Rad-Stag', 'Forest Deer', 'Horned Beast', 'Wild Stag', 'Nature Deer', 'Evolved Doe', 'Jade Deer', 'Bloom Deer'],
    species: 'Deer',
    description: 'A gentle-looking deer that can channel nature energy for healing.',
    rarity: 'Common',
    image: '🦌',
    baseStats: { attack: 50, defense: 30, hp: 500, speed: 35 },
    skills: [
      {
        id: 'skill-nature-heal',
        name: 'Glow Rejuvenation',
        description: 'Heals a large amount of vitality',
        type: 'support',
        effect: { heal: 500 },
        cooldown: 4,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 12,
        items: [{ name: 'Energy Cell', quantity: 15 }],
      },
      stage2: {
        level: 35,
        items: [{ name: 'Glow Stone', quantity: 5 }, { name: 'Mutant Blood', quantity: 4 }],
      },
    },
    evolutionNames: {
      stage1: 'Elder Rad-Stag',
      stage2: 'Primal Nature Deer',
    },
  },
  {
    id: 'pet-iron-bear',
    name: 'Mecha Bear',
    nameVariants: ['Mecha Bear', 'Steel Bear', 'Alloy Beast', 'Iron Paw', 'Tank Bear', 'Heavy Grizzly', 'Chrome Bear', 'Power Claw'],
    species: 'Bear',
    description: 'A bear with cybernetic enhancements and heavy armor plating.',
    rarity: 'Rare',
    image: '🐻',
    baseStats: { attack: 80, defense: 60, hp: 1000, speed: 25 },
    skills: [
      {
        id: 'skill-iron-defense',
        name: 'Titan Shield',
        description: 'Greatly increases defense and vitality for a short time',
        type: 'defense',
        effect: { buff: { defense: 400, hp: 750 } },
        cooldown: 6,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 20,
        items: [{ name: 'Mutant Core', quantity: 6 }, { name: 'Meteor Fragment', quantity: 5 }],
      },
      stage2: {
        level: 50,
        items: [{ name: 'Tough Scale', quantity: 3 }, { name: 'Super Stim', quantity: 2 }],
      },
    },
    evolutionNames: {
      stage1: 'Cyber King Bear',
      stage2: 'Divine Steel Mecha Bear',
    },
  },
  {
    id: 'pet-crystal-butterfly',
    name: 'Crystal Moth',
    nameVariants: ['Crystal Moth', 'Quartz Wing', 'Gem Moth', 'Prism Wing', 'Shadow Moth', 'Lumen Flutter', 'Void Wing', 'Shimmer Moth'],
    species: 'Butterfly',
    description: 'A beautiful but dangerous moth that emits shimmering dust.',
    rarity: 'Rare',
    image: '🦋',
    baseStats: { attack: 100, defense: 50, hp: 1000, speed: 45 },
    skills: [
      {
        id: 'skill-crystal-blessing',
        name: 'Prism Shield',
        description: 'Boosts all combat attributes',
        type: 'support',
        effect: { buff: { attack: 150, defense: 125 } },
        cooldown: 5,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 15,
        items: [{ name: 'Glow Stone', quantity: 5 }, { name: 'Mutant Blood', quantity: 3 }],
      },
      stage2: {
        level: 40,
        items: [{ name: 'Meteor Fragment', quantity: 8 }, { name: 'Mutant Fruit', quantity: 4 }],
      },
    },
    evolutionNames: {
      stage1: 'Rainbow Crystal Moth',
      stage2: 'Prismatic Overlord',
    },
  },
  {
    id: 'pet-stone-golem',
    name: 'Sludge Construct',
    nameVariants: ['Sludge Construct', 'Stone Golem', 'Mega Golem', 'Geo Construct', 'Titan Golem', 'Rock Giant', 'Waste Construct', 'Rubble Golem'],
    species: 'Construct',
    description: 'A massive entity made of toxic sludge and rubble.',
    rarity: 'Legendary',
    image: '🗿',
    baseStats: { attack: 150, defense: 100, hp: 2000, speed: 30 },
    skills: [
      {
        id: 'skill-stone-wall',
        name: 'Sludge Wall',
        description: 'Vastly increases defense and vitality for a short time',
        type: 'defense',
        effect: { buff: { defense: 500, hp: 1000 } },
        cooldown: 7,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 30,
        items: [{ name: 'Tough Scale', quantity: 5 }, { name: 'Mythic Horn', quantity: 3 }],
      },
      stage2: {
        level: 65,
        items: [{ name: 'Essence of Power', quantity: 4 }, { name: 'Rare Relic', quantity: 3 }],
      },
    },
    evolutionNames: {
      stage1: 'Mega Golem',
      stage2: 'Colossus of the Waste',
    },
  },
  {
    id: 'pet-void-owl',
    name: 'Abyssal Owl',
    nameVariants: ['Abyssal Owl', 'Void Owl', 'Shadow Owl', 'Phantom Owl', 'Night Owl', 'Aether Owl', 'Cosmic Owl', 'Chaos Owl'],
    species: 'Bird',
    description: 'A mysterious owl that channels the power of the void.',
    rarity: 'Legendary',
    image: '🦉',
    baseStats: { attack: 150, defense: 75, hp: 2000, speed: 50 },
    skills: [
      {
        id: 'skill-void-strike',
        name: 'Void Strike',
        description: 'A strike that bypasses conventional defenses',
        type: 'attack',
        effect: { damage: 550 },
        cooldown: 5,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 28,
        items: [{ name: 'Tough Scale', quantity: 4 }, { name: 'Fiery Feather', quantity: 3 }],
      },
      stage2: {
        level: 65,
        items: [{ name: 'Chaos Core', quantity: 2 }, { name: 'Code Fragment', quantity: 2 }],
      },
    },
    evolutionNames: {
      stage1: 'Shadow Raptor',
      stage2: 'Chaos Monarch',
    },
  },
  {
    id: 'pet-golden-lion',
    name: 'Gilded Lion',
    nameVariants: ['Gilded Lion', 'King Lion', 'Solar Lion', 'Radiant Lion', 'Steel Lion', 'Chrome Lion', 'Brave Lion', 'Apex Lion'],
    species: 'Lion',
    description: 'A majestic golden lion with balanced attack and defense.',
    rarity: 'Legendary',
    image: '🦁',
    baseStats: { attack: 150, defense: 100, hp: 2000, speed: 50 },
    skills: [
      {
        id: 'skill-golden-roar',
        name: 'Golden Roar',
        description: 'Boosts attack and defense significantly',
        type: 'support',
        effect: { buff: { attack: 250, defense: 200 } },
        cooldown: 5,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 25,
        items: [{ name: 'Tough Scale', quantity: 5 }, { name: 'Mythic Horn', quantity: 2 }],
      },
      stage2: {
        level: 60,
        items: [{ name: 'Essence of Power', quantity: 3 }, { name: 'Rare Relic', quantity: 3 }],
      },
    },
    evolutionNames: {
      stage1: 'Solar Lion King',
      stage2: 'Divine Gilded Lion',
    },
  },
  {
    id: 'pet-silver-fox',
    name: 'Neon Fox',
    nameVariants: ['Neon Fox', 'Silver Fox', 'Moon Fox', 'Silver Strike', 'Glitch Fox', 'Lumen Fox', 'Cyber Fox', 'Holo Fox'],
    species: 'Fox',
    description: 'An elegant fox that moves at high speed, providing tactical support.',
    rarity: 'Rare',
    image: '🦊',
    baseStats: { attack: 100, defense: 50, hp: 1000, speed: 55 },
    skills: [
      {
        id: 'skill-silver-flash',
        name: 'Neon Flash',
        description: 'High-speed attack',
        type: 'attack',
        effect: { damage: 70 },
        cooldown: 3,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 18,
        items: [{ name: 'Glow Stone', quantity: 6 }, { name: 'Mutant Blood', quantity: 3 }],
      },
      stage2: {
        level: 45,
        items: [{ name: 'Meteor Fragment', quantity: 8 }, { name: 'Mutant Fruit', quantity: 4 }],
      },
    },
    evolutionNames: {
      stage1: 'Moonlight Fox',
      stage2: 'Cyber Deity Fox',
    },
  },
  {
    id: 'pet-rainbow-peacock',
    name: 'Prism Peacock',
    nameVariants: ['Prism Peacock', 'Rainbow Bird', 'Spectrum Bird', 'Chroma Bird', 'Radiant Bird', 'Aura Peacock', 'Glow Bird', 'Dazzle'],
    species: 'Bird',
    description: 'A beautiful bird that boosts allies with prismatic energy.',
    rarity: 'Rare',
    image: '🦚',
    baseStats: { attack: 100, defense: 60, hp: 1000, speed: 40 },
    skills: [
      {
        id: 'skill-rainbow-dance',
        name: 'Prism Dance',
        description: 'Boosts all combat attributes',
        type: 'support',
        effect: { buff: { attack: 175, defense: 150 } },
        cooldown: 6,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 20,
        items: [{ name: 'Glow Stone', quantity: 7 }, { name: 'Meteor Fragment', quantity: 5 }],
      },
      stage2: {
        level: 50,
        items: [{ name: 'Fiery Feather', quantity: 3 }, { name: 'Mutant Fruit', quantity: 5 }],
      },
    },
    evolutionNames: {
      stage1: 'Spectrum Peacock',
      stage2: 'Solar Deity Peacock',
    },
  },
  {
    id: 'pet-dark-dragon',
    name: 'Void Drake',
    nameVariants: ['Void Drake', 'Dark Wyrm', 'Shadow Dragon', 'Abyssal Dragon', 'Chaos Dragon', 'Obsidian Wyrm', 'Night Dragon', 'Doom Drake'],
    species: 'Dragon',
    description: 'A dragon that commands the forces of entropy and darkness.',
    rarity: 'Mythic',
    image: '🐲',
    baseStats: { attack: 200, defense: 100, hp: 2500, speed: 50 },
    skills: [
      {
        id: 'skill-dark-blast',
        name: 'Void Blast',
        description: 'A powerful blast of chaotic energy',
        type: 'attack',
        effect: { damage: 150 },
        cooldown: 4,
      },
      {
        id: 'skill-dark-shield',
        name: 'Dark Singularity',
        description: 'Boosts defense and absorbs energy for healing',
        type: 'defense',
        effect: { buff: { defense: 300 }, heal: 500 },
        cooldown: 6,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 35,
        items: [{ name: 'Tough Scale', quantity: 8 }, { name: 'Essence of Power', quantity: 3 }],
      },
      stage2: {
        level: 75,
        items: [{ name: 'Chaos Core', quantity: 3 }, { name: 'Code Fragment', quantity: 3 }, { name: 'Origin Fluid', quantity: 1 }],
      },
    },
    evolutionNames: {
      stage1: 'Abyssal King Wyrm',
      stage2: 'God of Entropy',
    },
  },
  {
    id: 'pet-light-unicorn',
    name: 'Solar Unicorn',
    nameVariants: ['Solar Unicorn', 'Holy Steed', 'Lumen Horn', 'Radiant Horse', 'Aether Steed', 'Nova Mare', 'Purity', 'Aurelius'],
    species: 'Divine Beast',
    description: 'A holy creature that brings light and healing to the wasteland.',
    rarity: 'Mythic',
    image: '🦄',
    baseStats: { attack: 200, defense: 120, hp: 2500, speed: 60 },
    skills: [
      {
        id: 'skill-holy-heal',
        name: 'Sunlight Mend',
        description: 'Vastly restores vitality to the owner',
        type: 'support',
        effect: { heal: 1000 },
        cooldown: 4,
      },
      {
        id: 'skill-holy-blessing',
        name: 'Aurelius Blessing',
        description: 'Boosts all combat attributes significantly',
        type: 'support',
        effect: { buff: { attack: 300, defense: 250, hp: 750 } },
        cooldown: 6,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 35,
        items: [{ name: 'Mythic Horn', quantity: 5 }, { name: 'Super Stim', quantity: 4 }],
      },
      stage2: {
        level: 75,
        items: [{ name: 'Pure Essence', quantity: 2 }, { name: 'Origin Fluid', quantity: 1 }],
      },
    },
    evolutionNames: {
      stage1: 'Holy Light Steed',
      stage2: 'Deity of Purity',
    },
  },
  {
    id: 'pet-ice-phoenix',
    name: 'Cryo Phoenix',
    nameVariants: ['Cryo Phoenix', 'Frost Bird', 'Glacier Phoenix', 'Arctic Wing', 'Chill Hawk', 'Boreal Phoenix', 'Snow Phoenix', 'Ice Soul'],
    species: 'Divine Beast',
    description: 'A master of frost and regeneration, guarding the frozen wastes.',
    rarity: 'Mythic',
    image: '❄️',
    baseStats: { attack: 200, defense: 130, hp: 2500, speed: 55 },
    skills: [
      {
        id: 'skill-ice-storm',
        name: 'Cryo Storm',
        description: 'A freezing whirlwind that deals immense damage',
        type: 'attack',
        effect: { damage: 700 },
        cooldown: 5,
      },
      {
        id: 'skill-ice-recovery',
        name: 'Glacial Mend',
        description: 'Restores vitality and increases protection',
        type: 'support',
        effect: { heal: 750, buff: { defense: 250 } },
        cooldown: 5,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 35,
        items: [{ name: 'Fiery Feather', quantity: 8 }, { name: 'Essence of Power', quantity: 3 }],
      },
      stage2: {
        level: 75,
        items: [{ name: 'Chaos Core', quantity: 3 }, { name: 'Code Fragment', quantity: 3 }, { name: 'Pure Essence', quantity: 1 }],
      },
    },
    evolutionNames: {
      stage1: 'Frost Phoenix King',
      stage2: 'Winter Deity',
    },
  },
];
