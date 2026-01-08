import { SecretRealm, RealmType, Item, ItemType, EquipmentSlot } from '../types';
import { REALM_ORDER, SectInfo, SectGrade, getPillDefinition } from '../constants/index';
import { getItemFromConstants } from '../utils/itemConstantsUtils';

const randomId = () => Math.random().toString(36).slice(2, 9);

// Realm Name Pool - Categorized by Risk Level
const REALM_NAMES_BY_RISK: Record<'Low' | 'Medium' | 'High' | 'Extreme', string[]> = {
  'Low': [
    'Mystic Realm', 'Star Ruins', 'Beast Mountain Outer', 'Herb Garden', 'Breeze Valley',
    'Jade Pool', 'Purple Bamboo Forest', 'Bird Habitat', 'Spirit Stone Mine', 'Ancient Cave',
    'Flower Valley', 'Moonlit Pool', 'Cloud Peak', 'Bamboo Ridge', 'Spring Cave',
    'Crane Lake', 'Rainbow Bridge', 'Medicine Field', 'Quiet Pavilion', 'Waterfall Cliff'
  ],
  'Medium': [
    'Ancient Sword Tomb', 'Frozen Snowfield', 'Illusion Cave', 'Dragon Tomb', 'Beast Mountain Deep',
    'Battlefield Ruins', 'Echo Valley', 'Mist Forest', 'Spirit Cave', 'Trial Tower',
    'Thunder Valley', 'Flame Mountain', 'Ice Cave', 'Snake Valley', 'Beast Lair',
    'Tomb Maze', 'Sword Peak', 'Dragon Vein', 'Inheritance Hall', 'Trial Realm'
  ],
  'High': [
    'Lava Flow', 'Toxic Swamp', 'Nether Cave', 'Time Rift', 'Death Canyon',
    'Blood Sea Edge', 'Thunder Valley', 'Demon Cave', 'Black Wind Mountain', 'White Bone Ridge',
    'Demon Flame Abyss', 'Ghost Ridge', 'Blood Moon Cave', 'Shadow Forest', 'Cursed Land',
    'Despair Abyss', 'Dragon Lair', 'Evil Altar', 'Necro Domain', 'Void Fracture'
  ],
  'Extreme': [
    'Thunder Purgatory', 'Blood Sea Abyss', 'Nine Nether Abyss', 'Heavenly Tribulation Pool', 'Chaos Void',
    'God Demon Battlefield', 'World Extinction Forbidden Land', 'Kingdom of the Dead', 'Void Rift', 'Eternal Demon Domain',
    'Heavenly Dao Forbidden Zone', 'Reincarnation Land', 'Eternal Purgatory', 'Nothingness Realm', 'Source of Destruction',
    'Taboo Land', 'Punishment Domain', 'Demon Origin', 'Death Core', 'Ultimate Abyss'
  ]
};

// Realm Description Pool - Categorized by Risk Level
const REALM_DESCRIPTIONS_BY_RISK: Record<'Low' | 'Medium' | 'High' | 'Extreme', string[]> = {
  'Low': [
    'Rich in spiritual energy, suitable for cultivation, relatively safe.',
    'Gathering power of stars, full of spiritual energy.',
    'The outer area is relatively safe.',
    'Herbs are everywhere, suitable for gathering.',
    'Gentle breeze, pleasant environment.',
    'Clear water, misty spiritual energy.',
    'Purple bamboo swaying, quiet environment.',
    'Where spiritual birds gather.',
    'Spirit stone mine, watch out for guardians.',
    'Ancient cultivator cave, structurally intact.',
    'Flowers blooming, fragrant.',
    'Moonlight like water.',
    'Clouds rolling.',
    'Bamboo forest.',
    'Spring water bubbling.',
    'Cranes dancing.',
    'Rainbow spanning across.',
    'Medicinal herbs in patches.',
    'Quiet pavilion.',
    'Waterfall like silk.'
  ],
  'Medium': [
    'Burial ground of ancient sword cultivators.',
    'Icy and snowy.',
    'Illusions abound.',
    'Dragon ruins.',
    'Deep in the mountains.',
    'Ancient battlefield ruins.',
    'Echoes of heaven.',
    'Heavy fog.',
    'Spirit stone cave.',
    'Trial tower.',
    'Wind and thunder.',
    'Raging flames.',
    'Biting cold.',
    'Venomous snakes.',
    'Beast lair.',
    'Tomb maze.',
    'Soaring sword intent.',
    'Dragon vein land.',
    'Inheritance hall.',
    'Trial realm.'
  ],
  'High': [
    'Lava surging.',
    'Toxic gas permeating.',
    'Gloomy and cold.',
    'Time distortion.',
    'Deadly atmosphere.',
    'Edge of the blood sea.',
    'Thunder valley.',
    'Evil gathering place.',
    'Black wind mountain.',
    'White bone ridge.',
    'Demon flame burning.',
    'Ghostly wailing.',
    'Blood moon hanging high.',
    'Shadow shrouded.',
    'Cursed power permeating.',
    'Despair atmosphere.',
    'Demon dragon coiling.',
    'Evil god altar.',
    'Necro domain.',
    'Space shattered.'
  ],
  'Extreme': [
    'Thunder never ceases.',
    'Monstrous demonic energy.',
    'Land of Nine Nether.',
    'Remnant power of heavenly tribulation.',
    'Chaotic power.',
    'Ruins of ancient god-demon war.',
    'Forbidden land of extinction.',
    'Kingdom of the dead.',
    'Void rift.',
    'Eternal demon domain.',
    'Forbidden zone of heavenly dao.',
    'Land of reincarnation.',
    'Eternal purgatory.',
    'Realm of nothingness.',
    'Source of destruction.',
    'Taboo land.',
    'Domain of heavenly punishment.',
    'Origin of demonic path.',
    'Core of death.',
    'Ultimate abyss.'
  ]
};

// Drop Item Pool
const DROP_ITEMS = [
  'Mutant Parts',
  'Bio Sample',
  'Rare Herbs',
  'Med Supplies',
  'Weapon Mod',
  'Damaged Relic',
  'Pre-War Artifact',
  'Circuit Diagram',
  'Data Holotape',
  'Fusion Core',
  'Energy Cell',
  'Alloy Plate',
  'Scrap Metal',
  'Rare Mineral',
  'Fusion Cell',
  'Stimpak',
  'Rad-X',
  'Mentats',
  'Buffout',
];

// Faction Data Pool (Names and Descriptions)
const SECT_DATA: Array<{ name: string; description: string }> = [
  { name: 'Haven Outpost', description: 'A stable settlement. Trades food, meds, and clean water.' },
  { name: 'Sunfire Gang', description: 'Pyromaniacs and raiders. Known for arson and ambushes.' },
  { name: 'Brotherhood of Steel', description: 'Military order. Hoards advanced tech. Heavy armor presence.' },
  { name: 'The Sanctuary Clinic', description: 'Field medics and caretakers. Neutral… until threatened.' },
  { name: 'The Institute', description: 'Covert research network. Synth rumors persist.' },
  { name: 'Bloodcap Raiders', description: 'Raiders with a taste for violence. No negotiations.' },
  { name: 'Greenblade Company', description: 'Mercenary outfit. Fast strikes, close-quarters specialists.' },
  { name: 'The Minutemen', description: 'Citizen militia. Answers distress calls—sometimes.' },
  { name: 'The Railroad', description: 'Underground operators. Codes, safehouses, and secrets.' },
  { name: 'Starlight Surveyors', description: 'Scavengers of satellites and signal towers. Obsessed with data.' },
  { name: 'Dragonblood Tribe', description: 'Heavily modified humans. Tough, proud, territorial.' },
  { name: 'Phoenix Reclaimers', description: 'Salvage-and-rebuild zealots. "Nothing stays broken."' },
  { name: 'Thunder Legion', description: 'Generator lords. Controls power grids and energy weapons.' },
  { name: 'Cryo Wardens', description: 'Cold storage keepers. Guards of sealed facilities and vaults.' },
  { name: 'Venom Works', description: 'Chem-brewers. Poison, antidotes, and everything between.' },
  { name: 'Mirage Syndicate', description: 'Scammers and infiltrators. Masters of misdirection.' },
  { name: 'Iron Temple', description: 'Hardcore survivalists. Armor plating, discipline, endurance.' },
  { name: 'The Balance Collective', description: 'Pragmatists. Trades in favors, intel, and uneasy alliances.' }
];

// Task Name Pool (Categorized by Type)
const TASK_NAMES_BY_TYPE: Record<TaskType, string[]> = {
  patrol: ['Perimeter Patrol', 'Security Sweep', 'Border Watch', 'Night Watch'],
  donate_stone: ['Contribute Caps', 'Fund the Outpost', 'Donation Run', 'Supply Donation'],
  donate_herb: ['Donate Meds', 'Medical Supply Drop', 'Chem Donation', 'Clinic Support'],
  collect: ['Scavenge Run', 'Material Collection', 'Scrap Pickup', 'Resource Harvest'],
  hunt: ['Hostile Hunt', 'Creature Cull', 'Threat Removal', 'Clean the Zone'],
  alchemy: ['Cook Chems', 'Synth Lab Shift', 'Med Production', 'Chem Batch'],
  forge: ['Forge Gear', 'Weapon Mod Build', 'Workshop Shift', 'Arms Assembly'],
  teach: ['Train Recruits', 'Drill Session', 'Combat Basics', 'Field Training'],
  defend: ['Outpost Defense', 'Hold the Line', 'Fortify the Gate', 'Defensive Stand'],
  explore: ['Ruins Expedition', 'Site Survey', 'Facility Recon', 'Deep Dive'],
  trade: ['Caravan Trade', 'Trade Mission', 'Market Run', 'Exchange Deal'],
  research: ['Tech Research', 'Data Analysis', 'Signal Study', 'Lab Report'],
  cultivate: ['Greenhouse Duty', 'Crop Tending', 'Hydroponics Shift', 'Farm Maintenance'],
  maintain: ['System Maintenance', 'Generator Repair', 'Turret Service', 'Infrastructure Fix'],
  diplomacy: ['Faction Liaison', 'Negotiation Run', 'Alliance Talk', 'Neutral Meeting'],
  trial: ['Proving Grounds', 'Survival Trial', 'Hazard Course', 'Combat Trial'],
  rescue: ['Rescue Op', 'Emergency Extraction', 'Recovery Mission', 'Search & Rescue'],
  investigate: ['Incident Report', 'Strange Signal', 'Missing Supplies', 'Intel Check'],
  battle: ['Combat Operation', 'Arena Spar', 'Firefight', 'Proof of Strength'],
  treasure_hunt: ['Relic Recovery', 'Lost Tech Hunt', 'Cache Search', 'Artifact Retrieval'],
  escort: ['VIP Escort', 'Supply Escort', 'Courier Guard', 'Caravan Protection'],
  assassination: ['Target Elimination', 'Covert Hit', 'Silent Strike', 'Remove the Threat'],
  artifact_repair: ['Repair Pre-War Tech', 'Restore Relic', 'Fix Equipment', 'Restoration Job'],
  spirit_beast: ['Tame the Beast', 'Capture Specimen', 'Companion Bond', 'Creature Handling'],
  sect_war: ['Faction Skirmish', 'Territory Clash', 'Offensive Push', 'War Campaign'],
  inheritance: ['Legacy Protocol', 'Secure the Archive', 'Holotape Recovery', 'Claim the Record'],
  tribulation: ['Rad Storm Run', 'Exposure Event', 'Containment Breach', 'Storm Survival'],
  alchemy_master: ['Master Chemist Trial', 'Legendary Chem Batch', 'Prototype Synthesis', 'Expert Cook'],
};

// Task Description Pool (Categorized by Type)
const TASK_DESCRIPTIONS_BY_TYPE: Record<TaskType, string[]> = {
  patrol: [
    'Patrol the perimeter and report any movement near [LOCATION].',
    'Clear minor threats and keep the route to [LOCATION] safe.',
    'Check checkpoints. No heroics—just keep it quiet.',
  ],
  donate_stone: [
    'Donate caps to support repairs and ammo stock.',
    'The outpost needs funding. Every cap counts.',
    'Drop off caps. Keep the receipt—trust no one.',
  ],
  donate_herb: [
    'Deliver meds to the clinic. No questions asked.',
    'Donate chems and bandages. Sickbay is overflowing.',
    'Supplies first. Sentiment later.',
  ],
  collect: [
    'Collect usable scrap from [LOCATION].',
    'Retrieve parts and bring them back intact.',
    'Keep an eye on [ENEMY]. They like shiny things too.',
  ],
  hunt: [
    'Hunt down [ENEMY] near [LOCATION].',
    'Eliminate the threat before it spreads.',
    'Bring proof. No proof, no pay.',
  ],
  alchemy: [
    'Cook a batch of chems using the provided recipe.',
    'Produce meds for field kits. Quality matters.',
    'Keep the lab sealed. Contamination kills.',
  ],
  forge: [
    'Assemble weapon mods from collected parts.',
    'Craft gear for patrol units. Test before delivery.',
    'If it jams, it’s on you.',
  ],
  teach: [
    'Train new recruits. They need to survive their first week.',
    'Run drills and improve [TARGET] morale.',
    'Teach them to reload before they pray.',
  ],
  defend: [
    'Defend the outpost from [ENEMY].',
    'Hold positions until the alarm clears.',
    'Protect civilians. Everything else is expendable.',
  ],
  explore: [
    'Explore [LOCATION] and mark hazards on the map.',
    'Retrieve any usable tech you can carry.',
    'Signal may drop. Plan your exit.',
  ],
  trade: [
    'Escort a trade deal to [LOCATION].',
    'Keep the caravan alive. Merchants talk.',
    'No shots unless necessary.',
  ],
  research: [
    'Analyze recovered data from [LOCATION].',
    'Research improves survival odds. Keep it documented.',
    'If you can’t explain it, you don’t understand it.',
  ],
  cultivate: [
    'Tend crops and keep the greenhouse stable.',
    'Harvest supplies for rations and meds.',
    'Pests are small. Problems are not.',
  ],
  maintain: [
    'Repair critical systems. Power outages attract trouble.',
    'Maintain turrets around [LOCATION].',
    'Bring tools. Borrowing gets you killed.',
  ],
  diplomacy: [
    'Meet a faction contact at [LOCATION].',
    'Keep it civil. Words are cheaper than bullets.',
    'Bring caps. And backup.',
  ],
  trial: [
    'Complete a survival trial in [LOCATION].',
    'This is a test. Failure is expensive.',
    'Do it clean. Do it fast.',
  ],
  rescue: [
    'Rescue [TARGET] from [LOCATION].',
    'Extraction window is short. Move.',
    'Leave no one behind—unless you must.',
  ],
  investigate: [
    'Investigate suspicious activity near [LOCATION].',
    'Follow the trail. Document everything.',
    'Assume someone is lying. Start there.',
  ],
  battle: [
    'Engage in a controlled fight to gain experience.',
    'Win clean. No collateral damage.',
    'Treat wounds after. Not before.',
  ],
  treasure_hunt: [
    'Find the cache rumored at [LOCATION].',
    'Bring back [ITEM]. If it exists.',
    'Luck helps. Preparation helps more.',
  ],
  escort: [
    'Escort [TARGET] to [DESTINATION].',
    'Ambush likely near [LOCATION]. Stay sharp.',
    'If the client dies, you don’t get paid.',
  ],
  assassination: [
    'Eliminate the target at [LOCATION]. Quiet preferred.',
    'No witnesses. No signatures.',
    'In and out. Don’t make it personal.',
  ],
  artifact_repair: [
    'Repair damaged equipment using recovered parts.',
    'Restoration requires patience and clean tools.',
    'Test it twice before handing it over.',
  ],
  spirit_beast: [
    'Capture a specimen near [LOCATION].',
    'Non-lethal preferred. Dead specimens teach less.',
    'If it bites, it’s yours.',
  ],
  sect_war: [
    'Participate in a faction clash near [LOCATION].',
    'Hold territory. Deny resources.',
    'War is logistics. Start with ammo.',
  ],
  inheritance: [
    'Recover archived knowledge from [LOCATION].',
    'Bring back holotapes intact. Data is fragile.',
    'History is power. Treat it that way.',
  ],
  tribulation: [
    'Survive the rad storm at [LOCATION].',
    'Radiation spiking. Keep your mask sealed.',
    'If you pass out, you fail.',
  ],
  alchemy_master: [
    'Synthesize a high-grade chem with strict quality control.',
    'One mistake ruins the batch—and your lungs.',
    'Deliver the prototype. Keep a sample.',
  ],
};

// Task Type Configuration Interface
interface TaskTypeConfig {
  realmOffset: number;
  requiresCombat?: boolean;
  recommendedFor?: {
    highAttack?: boolean;
    highDefense?: boolean;
    highSpirit?: boolean;
    highSpeed?: boolean;
  };
  getCost?: (difficultyMultiplier: number) => RandomSectTask['cost'];
  getReward?: (
    rankMultiplier: number,
    difficultyMultiplier: number,
    qualityMultiplier: number,
    realmMultiplier: number,
    quality: TaskQuality
  ) => RandomSectTask['reward'];
}

// Item Pool Definitions
const ITEM_POOLS = {
  herbs: ['Mutfruit', 'Glowing Fungus', 'Bloodleaf', 'Healing Herb', 'Brain Fungus'],
  materials: ['Scrap Metal', 'Mutant Parts', 'Rare Mineral', 'Circuit Board', 'Steel', 'Tungsten', 'Star Core'],
  alchemy: ['Mutfruit', 'Glowing Fungus', 'Bloodleaf', 'Healing Herb'],
  forge: ['Scrap Metal', 'Steel', 'Rare Mineral', 'Mutant Parts'],
  maintain: ['Scrap Metal', 'Circuit Board', 'Rare Mineral'],
  repair: ['Scrap Metal', 'Steel', 'Tungsten', 'Star Core'],
  masterAlchemy: ['Pure Water', 'Rare Isotope', 'Fusion Cell', 'Quantum Particle'],
};

// Detailed Task Type Configurations
const TASK_TYPE_CONFIGS: Record<TaskType, TaskTypeConfig> = {
  patrol: {
    realmOffset: 0,
    recommendedFor: { highSpeed: true },
    getReward: (rank, diff, qual, realm) => ({
      contribution: Math.floor((10 + Math.random() * 20) * rank * diff * qual * realm)
    })
  },
  donate_stone: {
    realmOffset: 0,
    getCost: (diff) => ({ spiritStones: Math.floor((50 + Math.random() * 150) * diff) }),
    getReward: (rank, diff, qual, realm) => {
      const stones = Math.floor((50 + Math.random() * 150) * diff);
      return {
        contribution: Math.floor((20 + Math.random() * 30) * rank * diff * qual * realm),
        spiritStones: Math.floor(stones * 0.3)
      };
    }
  },
  donate_herb: {
    realmOffset: 0,
    getCost: (diff) => ({
      items: [{
        name: ITEM_POOLS.herbs[Math.floor(Math.random() * ITEM_POOLS.herbs.length)],
        quantity: Math.floor((1 + Math.random() * 3) * diff)
      }]
    }),
    getReward: (rank, diff, qual, realm) => ({
      contribution: Math.floor((15 + Math.random() * 25) * rank * diff * qual * realm)
    })
  },
  collect: {
    realmOffset: 0,
    getCost: (diff) => ({
      items: [{
        name: ITEM_POOLS.materials[Math.floor(Math.random() * ITEM_POOLS.materials.length)],
        quantity: Math.floor((1 + Math.random() * 2) * diff)
      }]
    }),
    getReward: (rank, diff, qual, realm) => ({
      contribution: Math.floor((25 + Math.random() * 35) * rank * diff * qual * realm),
      items: [{ name: 'Stimpak', quantity: Math.floor(diff * qual) }]
    })
  },
  hunt: {
    realmOffset: 0,
    requiresCombat: true,
    recommendedFor: { highAttack: true },
    getReward: (rank, diff, qual, realm) => ({
      contribution: Math.floor((30 + Math.random() * 40) * rank * diff * qual * realm),
      exp: Math.floor((50 + Math.random() * 100) * rank * diff * qual * realm)
    })
  },
  alchemy: {
    realmOffset: 1,
    recommendedFor: { highSpirit: true },
    getCost: (diff) => ({
      items: [{
        name: ITEM_POOLS.alchemy[Math.floor(Math.random() * ITEM_POOLS.alchemy.length)],
        quantity: Math.floor((2 + Math.random() * 3) * diff)
      }]
    }),
    getReward: (rank, diff, qual, realm) => ({
      contribution: Math.floor((30 + Math.random() * 40) * rank * diff * qual * realm),
      items: [{ name: 'Stimpak', quantity: Math.floor((2 + Math.random() * 3) * diff * qual) }]
    })
  },
  forge: {
    realmOffset: 1,
    recommendedFor: { highSpirit: true },
    getCost: (diff) => ({
      items: [{
        name: ITEM_POOLS.forge[Math.floor(Math.random() * ITEM_POOLS.forge.length)],
        quantity: Math.floor((2 + Math.random() * 3) * diff)
      }]
    }),
    getReward: (rank, diff, qual, realm) => ({
      contribution: Math.floor((35 + Math.random() * 45) * rank * diff * qual * realm),
      spiritStones: Math.floor((50 + Math.random() * 100) * diff * qual)
    })
  },
  teach: {
    realmOffset: 2,
    getReward: (rank, diff, qual, realm) => ({
      contribution: Math.floor((25 + Math.random() * 35) * rank * diff * qual * realm),
      exp: Math.floor((30 + Math.random() * 60) * rank * diff * qual * realm)
    })
  },
  defend: {
    realmOffset: 0,
    requiresCombat: true,
    recommendedFor: { highDefense: true },
    getReward: (rank, diff, qual, realm) => ({
      contribution: Math.floor((40 + Math.random() * 50) * rank * diff * qual * realm),
      exp: Math.floor((60 + Math.random() * 120) * rank * diff * qual * realm)
    })
  },
  explore: {
    realmOffset: 1,
    getReward: (rank, diff, qual, realm, quality) => {
      const items = [{ name: 'Scrap Metal', quantity: Math.floor((1 + Math.random() * 2) * diff * qual) }];
      if (quality === 'Legendary' || quality === 'Mythic') {
        items.push({ name: quality === 'Mythic' ? 'Mythic Material' : 'Legendary Material', quantity: 1 });
      }
      return {
        contribution: Math.floor((35 + Math.random() * 45) * rank * diff * qual * realm),
        items
      };
    }
  },
  trade: {
    realmOffset: 0,
    getReward: (rank, diff, qual, realm) => ({
      contribution: Math.floor((30 + Math.random() * 40) * rank * diff * qual * realm),
      spiritStones: Math.floor((100 + Math.random() * 200) * diff * qual)
    })
  },
  research: {
    realmOffset: 1,
    recommendedFor: { highSpirit: true },
    getReward: (rank, diff, qual, realm) => ({
      contribution: Math.floor((20 + Math.random() * 30) * rank * diff * qual * realm),
      exp: Math.floor((80 + Math.random() * 150) * rank * diff * qual * realm)
    })
  },
  cultivate: {
    realmOffset: 0,
    getReward: (rank, diff, qual, realm) => ({
      contribution: Math.floor((15 + Math.random() * 25) * rank * diff * qual * realm),
      items: [{ name: 'Healing Herb', quantity: Math.floor((3 + Math.random() * 5) * diff * qual) }]
    })
  },
  maintain: {
    realmOffset: 1,
    getCost: (diff) => ({
      items: [{
        name: ITEM_POOLS.maintain[Math.floor(Math.random() * ITEM_POOLS.maintain.length)],
        quantity: Math.floor((1 + Math.random() * 2) * diff)
      }]
    }),
    getReward: (rank, diff, qual, realm) => ({
      contribution: Math.floor((25 + Math.random() * 35) * rank * diff * qual * realm)
    })
  },
  diplomacy: {
    realmOffset: 3,
    getReward: (rank, diff, qual, realm, quality) => {
      const reward: RandomSectTask['reward'] = {
        contribution: Math.floor((50 + Math.random() * 70) * rank * diff * qual * realm),
        spiritStones: Math.floor((200 + Math.random() * 300) * diff * qual)
      };
      if (quality === 'Legendary' || quality === 'Mythic') {
        reward.items = [{ name: 'Diplomatic Token', quantity: 1 }];
      }
      return reward;
    }
  },
  trial: {
    realmOffset: 2,
    getReward: (rank, diff, qual, realm) => ({
      contribution: Math.floor((45 + Math.random() * 55) * rank * diff * qual * realm),
      exp: Math.floor((100 + Math.random() * 200) * rank * diff * qual * realm),
      spiritStones: Math.floor((150 + Math.random() * 250) * diff * qual)
    })
  },
  rescue: {
    realmOffset: 1,
    getReward: (rank, diff, qual, realm) => ({
      contribution: Math.floor((40 + Math.random() * 50) * rank * diff * qual * realm),
      exp: Math.floor((70 + Math.random() * 130) * rank * diff * qual * realm)
    })
  },
  investigate: {
    realmOffset: 1,
    recommendedFor: { highSpeed: true },
    getReward: (rank, diff, qual, realm) => ({
      contribution: Math.floor((30 + Math.random() * 40) * rank * diff * qual * realm),
      exp: Math.floor((40 + Math.random() * 80) * rank * diff * qual * realm)
    })
  },
  battle: {
    realmOffset: 0,
    requiresCombat: true,
    recommendedFor: { highAttack: true },
    getReward: (rank, diff, qual, realm) => ({
      contribution: Math.floor((35 + Math.random() * 45) * rank * diff * qual * realm),
      exp: Math.floor((60 + Math.random() * 120) * rank * diff * qual * realm)
    })
  },
  treasure_hunt: {
    realmOffset: 1,
    getReward: (rank, diff, qual, realm, quality) => {
      const items = [{ name: 'Scrap Metal', quantity: Math.floor((2 + Math.random() * 3) * diff * qual) }];
      if (quality === 'Legendary' || quality === 'Mythic') {
        items.push({ name: quality === 'Mythic' ? 'Mythic Artifact Fragment' : 'Legendary Artifact Fragment', quantity: 1 });
      }
      return {
        contribution: Math.floor((40 + Math.random() * 50) * rank * diff * qual * realm),
        items
      };
    }
  },
  escort: {
    realmOffset: 0,
    requiresCombat: true,
    recommendedFor: { highDefense: true },
    getReward: (rank, diff, qual, realm) => ({
      contribution: Math.floor((45 + Math.random() * 55) * rank * diff * qual * realm),
      spiritStones: Math.floor((150 + Math.random() * 250) * diff * qual)
    })
  },
  assassination: {
    realmOffset: 1,
    recommendedFor: { highSpeed: true },
    getReward: (rank, diff, qual, realm) => ({
      contribution: Math.floor((50 + Math.random() * 70) * rank * diff * qual * realm),
      exp: Math.floor((80 + Math.random() * 150) * rank * diff * qual * realm),
      spiritStones: Math.floor((200 + Math.random() * 300) * diff * qual)
    })
  },
  artifact_repair: {
    realmOffset: 1,
    recommendedFor: { highSpirit: true },
    getCost: (diff) => ({
      items: [{
        name: ITEM_POOLS.repair[Math.floor(Math.random() * ITEM_POOLS.repair.length)],
        quantity: Math.floor((2 + Math.random() * 3) * diff)
      }]
    }),
    getReward: (rank, diff, qual, realm) => ({
      contribution: Math.floor((30 + Math.random() * 40) * rank * diff * qual * realm),
      items: [{ name: 'Weapon Mod', quantity: Math.floor((1 + Math.random() * 2) * diff * qual) }]
    })
  },
  spirit_beast: {
    realmOffset: 1,
    requiresCombat: true,
    getReward: (rank, diff, qual, realm, quality) => {
      const reward: RandomSectTask['reward'] = {
        contribution: Math.floor((40 + Math.random() * 50) * rank * diff * qual * realm),
        exp: Math.floor((70 + Math.random() * 130) * rank * diff * qual * realm)
      };
      if (quality === 'Legendary' || quality === 'Mythic') {
        reward.items = [{ name: quality === 'Mythic' ? 'Mythic Beast Core' : 'Legendary Beast Core', quantity: 1 }];
      }
      return reward;
    }
  },
  sect_war: {
    realmOffset: 2,
    requiresCombat: true,
    getReward: (rank, diff, qual, realm) => ({
      contribution: Math.floor((60 + Math.random() * 80) * rank * diff * qual * realm),
      exp: Math.floor((100 + Math.random() * 200) * rank * diff * qual * realm),
      spiritStones: Math.floor((300 + Math.random() * 500) * diff * qual)
    })
  },
  inheritance: {
    realmOffset: 2,
    getReward: (rank, diff, qual, realm, quality) => {
      const reward: RandomSectTask['reward'] = {
        contribution: Math.floor((50 + Math.random() * 70) * rank * diff * qual * realm),
        exp: Math.floor((150 + Math.random() * 300) * rank * diff * qual * realm)
      };
      if (quality === 'Legendary' || quality === 'Mythic') {
        reward.items = [{ name: 'Inheritance Jade', quantity: 1 }];
      }
      return reward;
    }
  },
  tribulation: {
    realmOffset: 3,
    getReward: (rank, diff, qual, realm) => ({
      contribution: Math.floor((55 + Math.random() * 75) * rank * diff * qual * realm),
      exp: Math.floor((200 + Math.random() * 400) * rank * diff * qual * realm),
      spiritStones: Math.floor((250 + Math.random() * 450) * diff * qual)
    })
  },
  alchemy_master: {
    realmOffset: 2,
    recommendedFor: { highSpirit: true },
    getCost: (diff) => ({
      items: [{
        name: ITEM_POOLS.masterAlchemy[Math.floor(Math.random() * ITEM_POOLS.masterAlchemy.length)],
        quantity: Math.floor((1 + Math.random() * 2) * diff)
      }]
    }),
    getReward: (rank, diff, qual, realm, quality) => ({
      contribution: Math.floor((40 + Math.random() * 60) * rank * diff * qual * realm),
      items: [{ name: quality === 'Mythic' ? 'Nine-Cycle Golden Pill' : quality === 'Legendary' ? 'Heavenly Pill' : 'Foundation Pill', quantity: Math.floor((1 + Math.random() * 2) * diff * qual) }]
    })
  }
};

// Task Quality Configuration
const TASK_QUALITY_CONFIG: Record<TaskQuality, {
  probability: number;
  rewardMultiplier: number;
  contributionBonus: number;
}> = {
  'Common': {
    probability: 0.6,
    rewardMultiplier: 1.0,
    contributionBonus: 0,
  },
  'Rare': {
    probability: 0.25,
    rewardMultiplier: 1.5,
    contributionBonus: 50,
  },
  'Legendary': {
    probability: 0.12,
    rewardMultiplier: 2.5,
    contributionBonus: 200,
  },
  'Mythic': {
    probability: 0.03,
    rewardMultiplier: 8.0,
    contributionBonus: 3000,
  },
};

// Task Quality Types
export type TaskQuality = 'Common' | 'Rare' | 'Legendary' | 'Mythic';

// Task Type Extensions
export type TaskType =
  | 'patrol'           // Patrol
  | 'donate_stone'     // Donate Caps
  | 'donate_herb'      // Donate Meds
  | 'collect'          // Collect
  | 'hunt'             // Hunt
  | 'alchemy'          // Cook Chems
  | 'forge'            // Forge Gear
  | 'teach'            // Train Recruits
  | 'defend'           // Defend Outpost
  | 'explore'          // Explore Ruins
  | 'trade'            // Trade Mission
  | 'research'         // Tech Research
  | 'cultivate'        // Greenhouse Duty
  | 'maintain'         // System Maintenance
  | 'diplomacy'        // Faction Liaison
  | 'trial'            // Survival Trial
  | 'rescue'           // Rescue Op
  | 'investigate'      // Investigate
  | 'battle'           // Combat Operation (New)
  | 'treasure_hunt'    // Cache Search (New)
  | 'escort'           // VIP Escort (New)
  | 'assassination'    // Elimination (New)
  | 'artifact_repair'  // Tech Repair (New)
  | 'spirit_beast'     // Creature Tame (New)
  | 'sect_war'         // Faction War (New)
  | 'inheritance'      // Legacy Protocol (New)
  | 'tribulation'      // Rad Storm Run (New)
  | 'alchemy_master';  // Master Chemist (New)

export interface RandomSectTask {
  id: string;
  name: string;
  description: string;
  type: TaskType;
  difficulty: 'Easy' | 'Normal' | 'Hard' | 'Extreme'; // Task Difficulty
  quality: TaskQuality; // Task Quality
  minRealm?: RealmType; // Min Realm Requirement
  recommendedRealm?: RealmType; // Recommended Realm
  cost?: {
    spiritStones?: number;
    items?: { name: string; quantity: number }[];
  };
  reward: {
    contribution: number;
    exp?: number;
    spiritStones?: number;
    items?: { name: string; quantity: number }[];
  };
  timeCost: 'instant' | 'short' | 'medium' | 'long';
  // New Fields
  completionBonus?: { // Perfect Completion Bonus
    contribution?: number;
    exp?: number;
    spiritStones?: number;
    items?: { name: string; quantity: number }[];
  };
  specialReward?: { // Special Reward (Low Chance)
    type: 'equipment' | 'cultivationArt' | 'rareMaterial' | 'title';
    item?: { name: string; quantity: number };
  };
  requiresCombat?: boolean; // Requires Combat
  successRate?: number; // Success Rate (0-100), affects Perfect Completion
  isDailySpecial?: boolean; // Is Daily Special Task
  recommendedFor?: { // Recommended for specific attributes
    highAttack?: boolean; // High Attack
    highDefense?: boolean; // High Defense
    highSpirit?: boolean; // High Spirit
    highSpeed?: boolean; // High Speed
  };
  typeBonus?: number; // Streak Bonus (Percentage)
}

// Helper to get random item by quality
const getRandomItemByQuality = (quality: TaskQuality): { name: string } | undefined => {
  // Simple implementation: pick from drop items
  // In a real implementation this would filter a larger item database
  if (Math.random() > 0.5) return undefined;

  const rareItems = ['Mutant Flower', 'Scrap Metal', 'Energy Drink'];
  const legendItems = ['Plasma Rifle', 'Power Armor Helmet', 'Fusion Core'];
  const mythicItems = ['Alien Blaster', 'Experimental MIRV', 'G.E.C.K.'];

  if (quality === 'Mythic') return { name: mythicItems[Math.floor(Math.random() * mythicItems.length)] };
  if (quality === 'Legendary') return { name: legendItems[Math.floor(Math.random() * legendItems.length)] };
  if (quality === 'Rare') return { name: rareItems[Math.floor(Math.random() * rareItems.length)] };
  return undefined;
};

// Generate Random Realms
export const generateRandomRealms = (
  playerRealm: RealmType,
  count: number = 6
): SecretRealm[] => {
  const playerRealmIndex = REALM_ORDER.indexOf(playerRealm);
  const realms: SecretRealm[] = [];

  for (let i = 0; i < count; i++) {
    // Randomly choose realm requirement (cannot exceed player realm too much)
    const maxRealmIndex = Math.min(
      playerRealmIndex + 2,
      REALM_ORDER.length - 1
    );
    const minRealmIndex = Math.max(0, playerRealmIndex - 1);
    const realmIndex =
      Math.floor(Math.random() * (maxRealmIndex - minRealmIndex + 1)) +
      minRealmIndex;
    const minRealm = REALM_ORDER[realmIndex];

    // Randomly choose risk level
    const riskLevels: ('Low' | 'Medium' | 'High' | 'Extreme')[] = [
      'Low',
      'Medium',
      'High',
      'Extreme',
    ];
    const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];

    // Calculate cost based on risk level and realm
    const baseCost = 50 + realmIndex * 50;
    const riskMultiplier =
      riskLevel === 'Low'
        ? 0.8
        : riskLevel === 'Medium'
          ? 1
          : riskLevel === 'High'
            ? 1.5
            : 2;
    const cost = Math.floor(
      baseCost * riskMultiplier * (0.9 + Math.random() * 0.2)
    );

    // Choose corresponding name and description based on risk level
    const availableNames = REALM_NAMES_BY_RISK[riskLevel];
    const availableDescriptions = REALM_DESCRIPTIONS_BY_RISK[riskLevel];
    const name = availableNames[Math.floor(Math.random() * availableNames.length)];
    const description = availableDescriptions[Math.floor(Math.random() * availableDescriptions.length)];

    // Randomly generate drops (2-4 items)
    const dropCount = 2 + Math.floor(Math.random() * 3);
    const drops: string[] = [];
    const usedDrops = new Set<string>();
    for (let j = 0; j < dropCount; j++) {
      let drop = DROP_ITEMS[Math.floor(Math.random() * DROP_ITEMS.length)];
      while (usedDrops.has(drop) && usedDrops.size < DROP_ITEMS.length) {
        drop = DROP_ITEMS[Math.floor(Math.random() * DROP_ITEMS.length)];
      }
      usedDrops.add(drop);
      drops.push(drop);
    }

    realms.push({
      id: `realm-${randomId()}`,
      name,
      description,
      minRealm,
      cost,
      riskLevel,
      drops,
    });
  }

  return realms;
};

// Generate Random Factions
export const generateRandomSects = (
  playerRealm: RealmType,
  count: number = 6
): SectInfo[] => {
  const playerRealmIndex = REALM_ORDER.indexOf(playerRealm);
  const sects: SectInfo[] = [];

  for (let i = 0; i < count; i++) {
    // Randomly choose realm requirement
    const maxRealmIndex = Math.min(
      playerRealmIndex + 1,
      REALM_ORDER.length - 1
    );
    const realmIndex = Math.floor(Math.random() * (maxRealmIndex + 1));
    const reqRealm = REALM_ORDER[realmIndex];

    // Randomly choose a faction (Name and Description bound)
    const sectData = SECT_DATA[Math.floor(Math.random() * SECT_DATA.length)];
    const name = sectData.name;
    const description = sectData.description;

    // Randomly assign faction grade based on realm
    const grades: SectGrade[] = ['C', 'B', 'A', 'S'];
    const gradeWeights = [0.4, 0.3, 0.2, 0.1]; // C is most common, S is rarest
    let grade: SectGrade = 'C';
    const rand = Math.random();
    if (rand < gradeWeights[0]) grade = 'C';
    else if (rand < gradeWeights[0] + gradeWeights[1]) grade = 'B';
    else if (rand < gradeWeights[0] + gradeWeights[1] + gradeWeights[2]) grade = 'A';
    else grade = 'S';

    // Set exit cost based on grade
    const exitCostMultiplier = {
      'C': 1,
      'B': 2,
      'A': 5,
      'S': 10,
    }[grade];

    sects.push({
      id: `sect-${randomId()}`,
      name,
      description,
      reqRealm,
      grade,
      exitCost: {
        spiritStones: Math.floor(300 * exitCostMultiplier),
        items: [{ name: 'Healing Herb', quantity: Math.floor(5 * exitCostMultiplier) }],
      },
    });
  }

  return sects;
};

// Calculate reward multiplier based on player realm
const getRealmMultiplier = (playerRealm: RealmType, taskRealm: RealmType): number => {
  const playerIndex = REALM_ORDER.indexOf(playerRealm);
  const taskIndex = REALM_ORDER.indexOf(taskRealm);
  const diff = playerIndex - taskIndex;

  if (diff < -1) return 0.5;      // Realm too low, reward halved
  if (diff === -1) return 0.8;   // Realm slightly low, 80% reward
  if (diff === 0) return 1.0;    // Realm matches, normal reward
  if (diff === 1) return 0.9;    // Realm slightly high, 90% reward
  return 0.7;                     // Realm too high, 70% reward
};

// Determine recommended realm based on task type and player realm
const getRecommendedRealm = (type: TaskType, playerRealm: RealmType): RealmType => {
  const playerIndex = REALM_ORDER.indexOf(playerRealm);
  const config = TASK_TYPE_CONFIGS[type];
  const offset = config?.realmOffset || 0;
  const recommendedIndex = Math.min(
    playerIndex + offset,
    REALM_ORDER.length - 1
  );
  return REALM_ORDER[recommendedIndex];
};

// Generate Task Quality
const generateTaskQuality = (): TaskQuality => {
  const rand = Math.random();
  if (rand < 0.6) return 'Common';
  if (rand < 0.85) return 'Rare';
  if (rand < 0.97) return 'Legendary';
  return 'Mythic';
};

// Generate Random Faction Tasks
export const generateRandomSectTasks = (
  playerRank: string,
  playerRealm: RealmType,
  count: number = 3
): RandomSectTask[] => {
  const tasks: RandomSectTask[] = [];

  // All task types
  const allTaskTypes: TaskType[] = [
    'patrol', 'donate_stone', 'donate_herb', 'collect', 'hunt',
    'alchemy', 'forge', 'teach', 'defend', 'explore',
    'trade', 'research', 'cultivate', 'maintain',
    'diplomacy', 'trial', 'rescue', 'investigate',
    'battle', 'treasure_hunt', 'escort', 'assassination',
    'artifact_repair', 'spirit_beast', 'sect_war', 'inheritance',
    'tribulation', 'alchemy_master',
  ];

  // Adjust reward base based on rank
  const rankMultiplier =
    playerRank === 'Candidate'
      ? 1
      : playerRank === 'Member'
        ? 1.5
        : playerRank === 'Elite'
          ? 2
          : 3;

  // Difficulty configurations
  const difficulties: Array<'Easy' | 'Normal' | 'Hard' | 'Extreme'> = ['Easy', 'Normal', 'Hard', 'Extreme'];

  for (let i = 0; i < count; i++) {
    // Randomly choose task type
    const type = allTaskTypes[Math.floor(Math.random() * allTaskTypes.length)];

    // Choose from corresponding name and description pool
    const names = TASK_NAMES_BY_TYPE[type];
    const descriptions = TASK_DESCRIPTIONS_BY_TYPE[type];
    let name = names[Math.floor(Math.random() * names.length)];
    const description = descriptions[Math.floor(Math.random() * descriptions.length)];

    // Generate task quality
    const quality = generateTaskQuality();
    const qualityConfig = TASK_QUALITY_CONFIG[quality];

    // Determine recommended realm
    const recommendedRealm = getRecommendedRealm(type, playerRealm);
    const minRealm = recommendedRealm; // Min realm equals recommended realm

    // Randomly choose difficulty
    const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    const difficultyMultiplier = {
      'Easy': 0.7,
      'Normal': 1.0,
      'Hard': 1.5,
      'Extreme': 2.5,
    }[difficulty];

    // Calculate realm reward multiplier
    const realmMultiplier = getRealmMultiplier(playerRealm, recommendedRealm);

    let cost: RandomSectTask['cost'] = {};
    let reward: RandomSectTask['reward'] = {
      contribution: 0,
    };

    const timeCosts: Array<'instant' | 'short' | 'medium' | 'long'> = [
      'instant',
      'short',
      'medium',
      'long',
    ];
    const timeCost = timeCosts[Math.floor(Math.random() * timeCosts.length)];

    // Use TASK_TYPE_CONFIGS configuration to generate rewards and costs, avoiding duplicate code
    const taskConfig = TASK_TYPE_CONFIGS[type];
    if (taskConfig) {
      // Use getCost function from config to generate cost
      if (taskConfig.getCost) {
        const configCost = taskConfig.getCost(difficultyMultiplier);
        cost = { ...cost, ...configCost };
      }

      // Use getReward function from config to generate reward
      if (taskConfig.getReward) {
        const configReward = taskConfig.getReward(
          rankMultiplier,
          difficultyMultiplier,
          qualityConfig.rewardMultiplier,
          realmMultiplier,
          quality
        );
        reward = {
          ...configReward,
          contribution: (configReward.contribution || 0) + qualityConfig.contributionBonus,
        };
      }
    } else {
      // If no config, use default values (defensive handling)
      reward.contribution = Math.floor(
        (10 + Math.random() * 40) * rankMultiplier * difficultyMultiplier * qualityConfig.rewardMultiplier * realmMultiplier
      ) + qualityConfig.contributionBonus;
    }

    // Determine if combat is required (using info from config)
    const requiresCombat = taskConfig?.requiresCombat ?? false;

    // Calculate success rate (based on difficulty and quality)
    const baseSuccessRate = {
      'Easy': 90,
      'Normal': 75,
      'Hard': 60,
      'Extreme': 45,
    }[difficulty];
    const qualityBonus = {
      'Common': 0,
      'Rare': 5,
      'Legendary': 10,
      'Mythic': 15,
    }[quality];
    const successRate = Math.min(100, baseSuccessRate + qualityBonus);

    // Generate perfect completion reward (20-50% of base reward)
    const completionBonusMultiplier = 0.2 + Math.random() * 0.3;
    const completionBonus: RandomSectTask['completionBonus'] = {
      contribution: Math.floor(reward.contribution * completionBonusMultiplier),
    };
    if (reward.exp) {
      completionBonus.exp = Math.floor(reward.exp * completionBonusMultiplier);
    }
    if (reward.spiritStones) {
      completionBonus.spiritStones = Math.floor(reward.spiritStones * completionBonusMultiplier);
    }

    // Special reward (low probability, high quality tasks only)
    let specialReward: RandomSectTask['specialReward'] | undefined;
    if (quality === 'Legendary' || quality === 'Mythic') {
      const specialItem = getRandomItemByQuality(quality);
      if (specialItem) {
        reward.items = reward.items || [];
        reward.items.push({ name: specialItem.name, quantity: 1 });
      }
      const specialTypes: Array<'equipment' | 'cultivationArt' | 'rareMaterial' | 'title'> =
        ['equipment', 'rareMaterial'];
      specialReward = {
        type: specialTypes[Math.floor(Math.random() * specialTypes.length)],
        item: {
          name: quality === 'Mythic' ? 'Mythic Artifact' : 'Legendary Artifact',
          quantity: 1,
        },
      };
    }

    // Daily special task (5% chance, high reward)
    const isDailySpecial = Math.random() < 0.05;
    if (isDailySpecial) {
      // Double rewards for special tasks
      reward.contribution = Math.floor(reward.contribution * 2);
      if (reward.exp) reward.exp = Math.floor(reward.exp * 2);
      if (reward.spiritStones) reward.spiritStones = Math.floor(reward.spiritStones * 2);
      name = `[Daily Special] ${name}`;
    }

    // Task recommendation system (using info from config)
    const recommendedFor: RandomSectTask['recommendedFor'] = taskConfig?.recommendedFor || {};

    // Streak bonus (calculated by task type)
    const typeBonus = Math.floor(Math.random() * 20) + 5; // 5-25% bonus

    tasks.push({
      id: `task-${randomId()}`,
      name,
      description,
      type,
      difficulty,
      quality,
      minRealm,
      recommendedRealm,
      cost,
      reward,
      timeCost,
      completionBonus,
      specialReward,
      requiresCombat,
      successRate,
      isDailySpecial,
      recommendedFor,
      typeBonus,
    });
  }

  return tasks;
};

const createPillItem = (pillName: string, cost: number, defaultItem?: Partial<Item>): { name: string; cost: number; item: Omit<Item, 'id'> } => {
  // Priority: get from constants pool
  const itemFromConstants = getItemFromConstants(pillName);
  if (itemFromConstants) {
    return {
      name: pillName,
      cost,
      item: {
        name: itemFromConstants.name,
        type: itemFromConstants.type,
        description: itemFromConstants.description,
        rarity: itemFromConstants.rarity,
        quantity: 1,
        effect: itemFromConstants.effect,
        permanentEffect: itemFromConstants.permanentEffect,
        isEquippable: itemFromConstants.isEquippable,
        equipmentSlot: itemFromConstants.equipmentSlot as EquipmentSlot | undefined,
      },
    };
  }

  // If not in constants pool, try to get from chem definitions
  const pillDef = getPillDefinition(pillName);
  if (pillDef) {
    return {
      name: pillName,
      cost,
      item: {
        name: pillDef.name,
        type: pillDef.type,
        description: pillDef.description,
        rarity: pillDef.rarity,
        quantity: 1,
        effect: pillDef.effect,
        permanentEffect: pillDef.permanentEffect,
      },
    };
  }

  // If still not found, use default (e.g., Healing Pill)
  if (defaultItem) {
    return { name: pillName, cost, item: { ...defaultItem, name: pillName, quantity: 1 } as Omit<Item, 'id'> };
  }
  throw new Error(`Item definition not found: ${pillName}`);
};

/**
 * Create item entry from constants pool (for shops)
 */
const createItemFromConstants = (itemName: string, cost: number): { name: string; cost: number; item: Omit<Item, 'id'> } | null => {
  const itemFromConstants = getItemFromConstants(itemName);
  if (!itemFromConstants) {
    return null;
  }

  return {
    name: itemName,
    cost,
    item: {
      name: itemFromConstants.name,
      type: itemFromConstants.type,
      description: itemFromConstants.description,
      rarity: itemFromConstants.rarity,
      quantity: 1,
      effect: itemFromConstants.effect,
      permanentEffect: itemFromConstants.permanentEffect,
      isEquippable: itemFromConstants.isEquippable,
      equipmentSlot: itemFromConstants.equipmentSlot as EquipmentSlot | undefined,
    },
  };
};

// Faction shop item pool (used to generate armory items)
const SECT_SHOP_ITEM_POOL: Array<{ name: string; cost: number; item: Omit<Item, 'id'> }> = [
  createItemFromConstants('Reinforcement Kit', 10),
  createPillItem('Energy Drink', 20),
  createItemFromConstants('Mutant Flower', 50),
  createPillItem('Bone-Hardener', 100),
  createPillItem('Evolution Catalyst', 1000),
  createItemFromConstants('High-Grade Core', 500),
].filter((item): item is { name: string; cost: number; item: Omit<Item, 'id'> } => item !== null);

// Floor 2 high-tier pool
const SECT_SHOP_ITEM_POOL_FLOOR2: Array<{ name: string; cost: number; item: Omit<Item, 'id'> }> = [
  createPillItem('Survival Protocol', 2000),
  createPillItem('Breakthrough Cocktail', 3000),
  createPillItem('Apex Serum', 3500),
  createPillItem('Phoenix Protocol', 4000),
  createPillItem('Eternity Serum', 5000),
];

// Generate faction shop items (refresh 4-8 items each time)
export const generateSectShopItems = (floor: 1 | 2 = 1): Array<{ name: string; cost: number; item: Omit<Item, 'id'> }> => {
  const itemCount = 4 + Math.floor(Math.random() * 5); // 4-8 items
  const items: Array<{ name: string; cost: number; item: Omit<Item, 'id'> }> = [];
  const usedItems = new Set<string>();

  // Choose pool by floor
  const itemPool = floor === 2 ? SECT_SHOP_ITEM_POOL_FLOOR2 : SECT_SHOP_ITEM_POOL;

  for (let i = 0; i < itemCount; i++) {
    // Randomly select an item
    let selectedItem = itemPool[Math.floor(Math.random() * itemPool.length)];

    // Avoid duplicates (allow limited repeats if pool is too small)
    let attempts = 0;
    while (usedItems.has(selectedItem.name) && attempts < 10 && usedItems.size < itemPool.length) {
      selectedItem = itemPool[Math.floor(Math.random() * itemPool.length)];
      attempts++;
    }

    usedItems.add(selectedItem.name);
    items.push({ ...selectedItem });
  }

  return items;
};
