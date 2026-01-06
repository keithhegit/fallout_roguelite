import { AdventureResult, AdventureType, ItemRarity, RealmType, EquipmentSlot, ItemType } from '../types';
import {
  REALM_ORDER,
  LOTTERY_PRIZES,
  PET_TEMPLATES,
  getPillDefinition,
  DISCOVERABLE_RECIPES,
  PILL_RECIPES,
  INITIAL_ITEMS,
  SECT_SHOP_ITEMS,
  FOUNDATION_TREASURES,
  HEAVEN_EARTH_ESSENCES,
  HEAVEN_EARTH_MARROWS,
  HEAVEN_EARTH_SOUL_BOSSES,
  LONGEVITY_RULES,
} from '../constants/index';
import { logger } from '../utils/logger';
import { ITEM_TEMPLATES } from '../constants/itemTemplates';
import { getPlayerTotalStats } from '../utils/statUtils';
import { PlayerStats } from '../types';

/**
 * 事件模板接口
 */
interface AdventureEventTemplate {
  story: string;
  hpChange: number;
  expChange: number;
  spiritStonesChange: number;
  eventColor: 'normal' | 'gain' | 'danger' | 'special';
  adventureType: AdventureType;
  riskLevel?: 'Low' | 'Medium' | 'High' | 'Extremely Dangerous';
  // 可选字段
  itemObtained?: AdventureResult['itemObtained'];
  itemsObtained?: AdventureResult['itemsObtained'];
  petObtained?: string;
  petOpportunity?: AdventureResult['petOpportunity'];
  attributeReduction?: AdventureResult['attributeReduction'];
  reputationChange?: number;
  reputationEvent?: AdventureResult['reputationEvent'];
  inheritanceLevelChange?: number;
  triggerSecretRealm?: boolean;
  spiritualRootsChange?: AdventureResult['spiritualRootsChange'];
  lifespanChange?: number;
  lotteryTicketsChange?: number;
  longevityRuleObtained?: string; // 获得的规则之力ID
  heavenEarthSoulEncounter?: string; // 遇到的天地之魄BOSS ID
}

/**
 * 事件模板库
 */
let eventTemplateLibrary: AdventureEventTemplate[] = [];

/**
 * 事件模板库是否已初始化
 */
let isInitialized = false;

/**
 * 事件模板数量配置
 */
const TEMPLATE_COUNTS = {
  NORMAL: 1500,        // 普通历练事件 (60%)
  LUCKY: 500,         // 大机缘事件 (10%)
  SECRET_REALM: 700,  // 秘境探索事件 (25%)
  SECT_CHALLENGE: 300, // 宗门挑战事件 (5%)
} as const;

/**
 * 确定性随机数生成器（基于种子）
 * 确保相同种子生成相同序列的随机数
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * 基于索引的确定性随机数生成器
 */
function deterministicRandom(index: number, offset: number = 0): number {
  return seededRandom(index * 1000 + offset);
}

/**
 * 从数组中确定性选择一个元素（增加随机性）
 */
function selectFromArray<T>(array: T[], index: number): T {
  if (array.length === 0) {
    throw new Error('Cannot select from empty array');
  }
  // 使用确定性随机数而不是简单的取模，增加随机性
  const randomValue = deterministicRandom(index, 600);
  const selectedIndex = Math.floor(randomValue * array.length);
  return array[selectedIndex];
}

/**
 * 生成确定性随机整数（范围：[min, max)）
 */
function randomInt(index: number, min: number, max: number, offset: number = 0): number {
  const range = max - min;
  return Math.floor(deterministicRandom(index, offset) * range) + min;
}

/**
 * 生成确定性随机浮点数（范围：[min, max)）
 */
function randomFloat(index: number, min: number, max: number, offset: number = 0): number {
  const range = max - min;
  return deterministicRandom(index, offset) * range + min;
}

/**
 * 基于概率的确定性判断
 */
function randomChance(index: number, probability: number, offset: number = 0): boolean {
  return deterministicRandom(index, offset) < probability;
}

/**
 * 生成事件模板库（3000个事件）
 */
export function generateEventTemplateLibrary(): AdventureEventTemplate[] {
  const templates: AdventureEventTemplate[] = [];

  // 普通历练事件 (600个，60%)
  for (let i = 0; i < TEMPLATE_COUNTS.NORMAL; i++) {
    templates.push(generateNormalEventTemplate(i));
  }

  // Lucky events (100 events, 10%)
  for (let i = 0; i < TEMPLATE_COUNTS.LUCKY; i++) {
    templates.push(generateLuckyEventTemplate(i));
  }

  // Secret Realm events (250 events, 25%)
  for (let i = 0; i < TEMPLATE_COUNTS.SECRET_REALM; i++) {
    templates.push(generateSecretRealmEventTemplate(i));
  }

  // Sect Challenge events (50 events, 5%)
  for (let i = 0; i < TEMPLATE_COUNTS.SECT_CHALLENGE; i++) {
    templates.push(generateSectChallengeEventTemplate(i));
  }

  return templates;
}

/**
 * 生成普通历练事件模板
 */
function generateNormalEventTemplate(index: number): AdventureEventTemplate {
  // 增加功法和灵宠的出现频率，提高获得概率
  const eventTypes = [
    'battle', // Combat
    'herb', // Found herbs/chems
    'cultivator', // Met wastelander
    'cave', // Small vault/ruins
    'enlightenment', // Sudden insight
    'cultivationArt', // Protocol unlock
    'cultivationArt',
    'danger', // Hazard
    'spiritStone', // Bottle cap stash
    'rescue', // Rescue mission
    'spiritSpring', // Pure water spring
    'pet', // Companion
    'pet',
    'pet',
    'petOpportunity', // Companion opportunity
    'petOpportunity',
    'foundationTreasure', // Pre-war artifact
    'heavenEarthEssence', // Quantum Essence
    'heavenEarthMarrow', // Quantum Marrow
    'heavenEarthMarrow',
    'heavenEarthSoul', // Legendary entity (Level 5+)
    'heavenEarthSoul',
    'heavenEarthSoul',
    'heavenEarthSoul',
    'longevityRule', // Wasteland rule (Endgame)
    'trap', // Trap
    'evilCultivator', // Raider/Feral Ghoul
    'reputation', // Karma event
    'reputation',
    'reputation',
    'lottery', // Nuka-Cola tickets
  ];

  const eventType = selectFromArray(eventTypes, index);
  const rarityRoll = deterministicRandom(index, 1);
  const rarity: ItemRarity = rarityRoll < 0.6 ? 'Common' : rarityRoll < 0.9 ? 'Rare' : 'Legendary';

  const baseTemplate: AdventureEventTemplate = {
    story: '',
    hpChange: 0,
    expChange: 0,
    spiritStonesChange: 0,
    eventColor: 'normal',
    adventureType: 'normal',
  };

  switch (eventType) {
    case 'battle': {
      const stories = [
        `You were trekking through a dense, irradiated forest when you heard a low growl from ahead. Moving carefully through the mutated shrubbery, you spotted a ${['Glowing Wolf', 'Yao Guai', 'Deathclaw', 'Rad-Panther', 'Giant Rad-Python'][index % 5]} tearing into its prey, eyes flickering with feral hunger. Deciding to strike first, you readied your weapon and, after a fierce struggle, eventually brought the beast down.`,
        `In the rugged Wasteland, you were following a jagged mountain path when low snarls echoed around you. A group of ${['Feral Ghouls', 'Raiders', 'Mutated Beasts', 'Abominations', 'Renegades'][index % 5]} surrounded you from all sides, eyes gleaming with greed and bloodlust. Keeping your cool, you deployed your equipment, and after a heart-pounding battle, successfully fought them off.`,
        `You were exploring the ruins of a pre-war battlefield, rusted weaponry scattered everywhere. Suddenly, a dry "click-clack" of bone echoed from the depths of the rubble. A ${['Skeletal Soldier', 'Specter', 'Withered Ghoul', 'Ghostly Entity', 'Nightstalker'][index % 5]} crawled out from the debris, eyes burning with a sickly green fire. You immediately activated your protective gear and, after a tough fight, completely neutralized the threat.`,
        `In a dark, shadowed canyon, you were moving cautiously when you felt a sudden chill from behind. Turning quickly, you found a massive ${['Rad-Snake', 'Giant Scorpion', 'Bloatfly', 'Centipede', 'Vampire Bat'][index % 5]} looming over you, venom dripping from its fangs and corroding the ground. Not daring to be careless, you utilized your agility and, after a perilous encounter, finally defeated it.`,
        `While resting in a cave, you were just entering a meditative state when you felt a surge of murderous intent. Snapping your eyes open, you found a ${['Lone Mutant Bear', 'Wild Rad-Boar', 'Stalker Bird', 'Giant Mutant Ape', 'Feral Fox'][index % 5]} silently approaching, eyes glinting with cunning. You sprang up and, after a short but intense duel, pushed it back into the darkness.`,
      ];
      return {
        ...baseTemplate,
        story: selectFromArray(stories, index),
        hpChange: -randomInt(index, 10, 40, 10),
        expChange: randomInt(index, 20, 70, 20),
        spiritStonesChange: randomInt(index, 10, 40, 30),
        eventColor: 'danger',
        itemObtained: randomChance(index, 0.3, 40) ? generateRandomItem(rarity, index) : undefined,
      };
    }

    case 'herb': {
      // 从常量池中获取草药
      const allItems = getAllItemsFromConstants();
      const herbs = allItems.filter(item => item.type === ItemType.Herb);
      // 使用确定性随机数选择草药，增加随机性
      const selectedHerb = herbs.length > 0
        ? (() => {
          const herbRandom = deterministicRandom(index, 500);
          const herbIndex = Math.floor(herbRandom * herbs.length);
          return herbs[herbIndex] || herbs[0];
        })()
        : {
          name: 'Rad-Herb',
          type: ItemType.Herb,
          description: 'A rare irradiated herb containing concentrated vital energy.',
          rarity: 'Common' as ItemRarity,
          effect: { hp: 50, exp: 10 },
          permanentEffect: { spirit: 1, maxHp: 10 },
        };

      const stories = [
        `Trekking along a mountain path, a gentle breeze brought a faint medicinal scent, revitalizing your senses. You stopped, sniffed carefully, and followed the aroma to a hidden crevice. You found a ${selectedHerb.name}, its leaves still damp with glowing dew. You carefully harvested it, feeling the dense energy within.`,
        `While pushing through thick irradiated brush, your eyes caught a faint glint—a ${selectedHerb.name} swaying in the breeze. You knelt down to examine it; its leaves were clear as jade, and its stem was strong, indicating it had grown for years. You carefully placed it in your bag.`,
        `Resting by a waterfall, you noticed a ${selectedHerb.name} growing near the spray. It seemed to have absorbed the pure moisture of the falls, its leaves glistening with water. You harvested it, hearing the faint hum of life within.`,
        `Exploring ancient ruins, you found a stubborn ${selectedHerb.name} growing through the rubble. Despite the harsh environment, it thrived, its leaves covered in ancient dust. You collected it, moved by the resilience of life in the wasteland.`,
        `Near a clear spring, you discovered a ${selectedHerb.name} that had absorbed the spring's essence. Its leaves shimmered with a spectrum of colors, and liquid energy seemed to flow through its stem. You carefully harvested this mutant specimen, feeling a surge of joy.`,
      ];
      return {
        ...baseTemplate,
        story: selectFromArray(stories, index),
        hpChange: randomInt(index, 10, 30, 50),
        expChange: randomInt(index, 15, 45, 60),
        eventColor: 'gain',
        itemObtained: {
          name: selectedHerb.name,
          type: selectedHerb.type, // 常量池中的类型应该是正确的
          description: selectedHerb.description || 'A mysterious wasteland herb.',
          rarity: selectedHerb.rarity || 'Common',
          effect: selectedHerb.effect,
          permanentEffect: selectedHerb.permanentEffect,
        },
      };
    }

    case 'cultivator': {
      const stories = [
        `On the road, you encountered a ${['Scavenger', 'Sectarian Follower', 'Wandering Trader', 'Hermit Sage', 'Caravan Guard'][index % 5]}. Seeing you are a fellow traveler, they struck up a conversation. Sitting under a withered tree, you exchanged stories of survival and cultivation. Their unique insights gave you a new understanding of the path ahead.`,
        `At a roadside shack, you were sipping some radioactive tea when an ${['Old Survivor', 'Young Swordsman', 'Alchemist', 'Technician', 'Scribe'][index % 5]} approached and asked to join you. You had a pleasant conversation about the Wasteland, and they shared valuable experience that left you enlightened. Before departing, they gave you some caps as a gesture of goodwill.`,
        `While browsing a bazaar, you overheard a ${['Trader', 'Blacksmith', 'Doctor', 'Scholar', 'Ranger'][index % 5]} discussing survival techniques. You joined in, and they were happy to swap information and items. They even shared some valuable local rumors with you.`,
        `During your journey, you met a ${['Fellow Disciple', 'Traveler', 'Senior', 'Junior', 'Stranger'][index % 5]} who offered to walk with you for a while. You exchanged tales of your travels, and their broad knowledge provided warnings about hazardous areas and potential opportunities nearby.`,
        `While resting at an inn, you were looking out the window when a ${['Mysterious Figure', 'Elder', 'Brave Youth', 'Woman', 'Monk'][index % 5]} sat down across from you. Their extraordinary vision and understanding of the wasteland left you inspired, clarifying your goals for the future.`,
      ];
      return {
        ...baseTemplate,
        story: selectFromArray(stories, index),
        hpChange: 0,
        expChange: randomInt(index, 20, 60, 70),
        spiritStonesChange: randomChance(index, 0.5, 80) ? randomInt(index, 20, 70, 90) : 0,
        eventColor: 'normal',
        itemObtained: randomChance(index, 0.2, 100) ? generateRandomItem(rarity, index) : undefined,
      };
    }

    case 'cave': {
      const stories = [
        `Below a cliff, you found a concealed entrance hidden by vines and rubble. Clearing the debris, you entered what appeared to be an abandoned ${['Pre-War Shelter', 'Mini-Vault', 'Temporary Hive', 'Meditation Chamber', 'Hidden Cache'][index % 5]}. Though derelict for years, a faint hum of energy remained. Searching carefully, you uncovered some dusty but functional gear.`,
        `Exploring a cavern, you found ancient runes etched into the walls. Though faded, they pulsed with a faint rhythm. You realized this was once the home of a ${['Hermit', 'Survivor', 'Veteran', 'Sage', 'Scholar'][index % 5]}. Searching the ruins, you found several useful items that had survived the test of time.`,
        `You stumbled upon a small hatch overgrown with mutated vines. Inside, it was a miniature vault, simple but well-organized. You found some ${['Books', 'Chems', 'Materials', 'Caps', 'Gadgets'][index % 5]} that, although old, were remarkably well-preserved. You gathered the items with a sense of triumph.`,
        `In a remote valley, you found an abandoned bunker with a faded sign reading "Sanctuary". Entering, you felt the lingering presence of its former owner. You salvaged some useful materials and a stash of bottle caps from the dusty corners.`,
        `You discovered a small gap in a rock wall that led to a tiny meditation room. It was exquisitely decorated, with survival tips carved into the stone. Searching the area, you found several glowing items that were clearly of high quality.`,
      ];
      return {
        ...baseTemplate,
        story: selectFromArray(stories, index),
        hpChange: randomInt(index, 5, 20, 110),
        expChange: randomInt(index, 30, 90, 120),
        spiritStonesChange: randomInt(index, 40, 120, 130),
        eventColor: 'gain',
        itemObtained: randomChance(index, 0.6, 140) ? generateRandomItem(rarity, index) : undefined,
      };
    }

    case 'enlightenment': {
      const stories = [
        `You were meditating at a ${['mountain peak', 'waterfall', 'withered grove', 'pre-war altar', 'rusty platform'][index % 5]}, the silence of the wasteland broken only by the radioactive wind. Closing your eyes and focusing your energy, a sudden flash of insight struck—a new understanding of the path to power. Your energy flow smoothed out, and your grasp of survival techniques deepened significantly.`,
        `While resting in ${['a crystal spring', 'an ancient bunker', 'pre-war ruins', 'a mutated forest', 'a secret vault'][index % 5]}, the background radiation seemed to pulse in a rhythmic frequency. You fell into a trance-like state, merging your consciousness with the echoes of the world. In this state, you grasped the fundamental laws of the wasteland, and previously confusing concepts became crystal clear.`,
        `Watching the ${['sea of clouds', 'starry sky', 'nuclear sunrise', 'toxic moonrise', 'irregular tides'][index % 5]}, you were awestruck by the raw, untamed power of nature. Standing still, you synchronized your breath with the world's rhythm, suddenly perceiving the hidden cycles of energy. Survival isn't just about gaining strength; it's about harmonizing with the wasteland's chaotic beauty.`,
        `Inside ${['a quiet room', 'a decommissioned bunker', 'a mountaintop', 'a dry lakebed', 'a dead forest'][index % 5]}, you sat in silence, listening only to your own breathing. Focusing inward, your energy flowed through you like a river of liquid fire, and a spark of realization ignited. The answer to a problem that had long troubled you was right there, waiting to be seen.`,
        `In the midst of ${['battle', 'exploration', 'meditation', 'deep thought', 'observation'][index % 5]}, you experienced a sudden breakthrough. Like a lightning strike to the brain, your perspective on survival shifted. It's not just about linear growth; it's about constant adaptation and evolution. This insight left your mind preternaturally sharp, as if the world was suddenly in high definition.`,
      ];
      return {
        ...baseTemplate,
        story: selectFromArray(stories, index),
        hpChange: 0,
        expChange: randomInt(index, 50, 130, 150),
        spiritStonesChange: 0,
        eventColor: 'gain',
      };
    }

    case 'cultivationArt': {
      // 从常量池中获取功法（虽然系统会自动解锁，但事件描述要匹配）
      const stories = [
        `In deep ${['Vault Ruins', 'Remnants', 'Bunkers', 'Secret Labs', 'Forbidden Zones'][index % 5]}, you found a ${['fragmented', 'ancient', 'mysterious', 'valuable', 'rare'][index % 5]} Combat Protocol data-chip. Though the chip was slightly degraded, the data remained accessible. You carefully downloaded and decrypted it, finding survival techniques and combat maneuvers far beyond what you had previously known. You became absorbed in the data, absorbing its essence.`,
        `You encountered a ${['Hermit Sage', 'Veteran Ranger', 'Mysterious Elder', 'Sect Overseer', 'Legendary Scavenger'][index % 5]} who seemed impressed by your aptitude. Sitting in a quiet corner of the wasteland, they began transmitting a specialized Protocol to you. Their explanation was clear and precise, and you quickly grasped the intricate maneuvers. Before leaving, they urged you to practice diligently.`,
        `While exploring a ${['Pre-War Grave', 'Old Research Center', 'Bunker', 'Vault', 'Hazardous Zone'][index % 5]}, you unexpectedly discovered a ${['lost', 'ancient', 'mysterious', 'legendary', 'rare'][index % 5]} Combat Schematic. It was preserved in a sealed container, unscathed by time. You opened the container and extracted the schematic, discovering high-level techniques that must have belonged to a pre-war master. You quickly mastered its core concepts.`,
        `On ${['a rock wall', 'a rusted monument', 'an old terminal', 'a jade tablet', 'a data scroll'][index % 5]}, you found encrypted Combat Protocols. Though the data was partially corrupted, the core logic remained elegant. You stood there for hours, deciphering the code, discovering deep combat insights that far surpassed your current training. You became lost in the intricate patterns of power.`,
        `In ${['an ancient bunker', 'pre-war ruins', 'a mutated forest', 'a secret vault', 'a hazardous zone'][index % 5]}, you stumbled upon a ${['fragmented', 'ancient', 'mysterious', 'valuable', 'rare'][index % 5]} protocol chip. It was housed in a reinforced case, perfectly preserved. You extracted the chip and accessed its data, finding a profound combat system recorded by an unknown master. You spent days integrating its logic into your own style.`,
      ];
      return {
        ...baseTemplate,
        story: selectFromArray(stories, index),
        hpChange: 0,
        expChange: randomInt(index, 50, 150, 160),
        spiritStonesChange: 0,
        eventColor: 'special',
      };
    }

    case 'danger': {
      const stories = [
        `As you were exploring, a sharp "snap" echoed beneath your feet. Your heart sank as you realized a ${['trap', 'tripwire', 'pressure plate', 'turret', 'gas vent'][index % 5]} had been triggered. You desperately tried to dive away, but the shockwave caught you, leaving you wounded. You immediately administered first aid while scanning for further hazards.`,
        `In a ${['hazardous zone', 'forbidden area', 'danger pocket', 'feral ghoul nest', 'deathclaw territory'][index % 5]}, the air was thick with tension. You moved cautiously, but an accident was inevitable. Suddenly, an attack came from the shadows; though you reacted quickly, you were grazed and suffered minor injuries. You stayed vigilant for the next threat.`,
        `Exploring a ${['pre-war tomb', 'ruin', 'bunker', 'vault', 'forbidden zone'][index % 5]}, the silence was terrifying, broken only by your footsteps. Suddenly, a metallic "click" sounded. You tried to back away, but the mechanism had already fired. You were hit and significantly hurt, forcing you to focus on stabilization while staying on high alert.`,
        `During ${['combat', 'exploration', 'rest', 'travel', 'scavenging'][index % 5]}, an unexpected accident occurred. Although you managed to brace yourself, you still took substantial damage. You tended to your wounds, wary of any predators drawn to the scent of blood.`,
        `Deep in a ${['perilous area', 'wasteland gap', 'no-man\'s land', 'irradiated zone', 'death valley'][index % 5]}, the air felt like it was carrying murderous intent. You moved with extreme care, yet a trap still snared you. A sudden burst of energy or a physical spike hit you; you survived, but your strength was severely drained. You focused on recovery while watching the shadows.`,
      ];
      return {
        ...baseTemplate,
        story: selectFromArray(stories, index),
        hpChange: -randomInt(index, 20, 60, 170),
        expChange: randomInt(index, 10, 40, 180),
        eventColor: 'danger',
      };
    }

    case 'spiritStone': {
      const stories = [
        `While searching in ${['a cave', 'a mine', 'an underground tunnel', 'a canyon', 'a rocky cliff'][index % 5]}, you suddenly noticed a localized drop in interference. Following the signal, you found a hidden stash of Pre-War bottle caps, gleaming under your flashlight. You carefully collected them, knowing they'd be valuable for trade.`,
        `You inadvertently stumbled upon a ${['exposed', 'partially buried', 'hidden', 'small', 'abandoned'][index % 5]} bottle cap stash. The caps were relatively clean and clearly ancient. You gathered them all, feeling a surge of mercantile excitement.`,
        `During your exploration, you felt a slight vibration from your Pip-Boy. Searching the area, you found a small cache of caps hidden in a loose floorboard. Though not a fortune, every cap helps in the wasteland.`,
        `Underground in ${['a drain', 'a bunker', 'a mine', 'a cellar', 'a rock crevice'][index % 5]}, your beam caught the glint of metal scattered on the ground. A collection of caps, preserved by the dry air, lay waiting. You scooped them into your pack with satisfaction.`,
        `In ${['a collapsed mine', 'a deep cavern', 'a maintenance tunnel', 'a narrow passage', 'a shadowed ledge'][index % 5]}, the background noise of the wasteland seemed to fade. You discovered a small container filled with caps, likely a scavenger's forgotten stash. You claimed it as your own.`,
      ];
      return {
        ...baseTemplate,
        story: selectFromArray(stories, index),
        hpChange: 0,
        expChange: randomInt(index, 20, 60, 190),
        spiritStonesChange: randomInt(index, 50, 150, 200),
        eventColor: 'gain',
      };
    }

    case 'rescue': {
      const stories = [
        `On the road, you encountered a ${['wounded survivor', 'trapped merchant', 'distressed villager', 'injured scavenger', 'lost traveler'][index % 5]}, looking battered from a recent attack. Seeing they needed help, you stepped in. They explained they had been ambushed, and you used your medical skills and strength to get them back on their feet. Grateful, they thanked you profusely.`,
        `In ${['a forest', 'a mountain pass', 'the wilderness', 'a valley', 'a riverbank'][index % 5]}, you met someone in desperate need. They seemed frantic, clearly facing a crisis. You approached, and seeing your willing help, they shared their plight. You resolved their problem, and they were relieved beyond words.`,
        `You found someone ${['surrounded by feral ghouls', 'caught in a trap', 'injured on the ground', 'hopelessly lost', 'facing a threat'][index % 5]}. They were in immediate danger, so you intervened. Using your combat skills and tools, you rescued them. They were immensely thankful for your timely arrival.`,
        `On your journey, you found someone needing aid. They looked haggard, likely having escaped a raider camp. You provided support, and in return for your kindness, they gave you a small reward from their meager belongings.`,
        `In a ${['hazardous zone', 'forbidden area', 'danger pocket', 'mutated zone', 'deadly valley'][index % 5]}, you encountered someone in distress. You bravely stepped in, using your abilities to clear the path for them. Beyond simple thanks, they shared valuable intel about the local terrain.`,
      ];
      return {
        ...baseTemplate,
        story: selectFromArray(stories, index),
        hpChange: randomChance(index, 0.3, 210) ? -randomInt(index, 10, 30, 220) : 0,
        expChange: randomInt(index, 30, 80, 230),
        spiritStonesChange: randomChance(index, 0.5, 240) ? randomInt(index, 30, 90, 250) : 0,
        eventColor: 'gain',
        reputationChange: randomInt(index, 10, 30, 260),
        itemObtained: randomChance(index, 0.3, 270) ? generateRandomItem(rarity, index) : undefined,
      };
    }

    case 'spiritSpring': {
      const stories = [
        `Exploring a ${['valley', 'cave', 'forest', 'cliff', 'underground area'][index % 5]}, you heard the sound of trickling water. Following it, you discovered a hidden spring of pure, non-irradiated water. The air around it felt preternaturally clean. You cupped your hands and drank deeply, feeling a surge of vitality wash over you, as if the wasteland's grime and fatigue had been instantly purged.`,
        `You inadvertently stumbled upon a ${['clear', 'warm', 'cool', 'sweet', 'energy-rich'][index % 5]} radioactive-free spring. The water bubbled from a rock crevice, shimmering with a soft light. You drank the pure liquid and felt your core energy stabilize, your body feeling lighter and more resilient than ever before.`,
        `In a ${['concealed', 'mysterious', 'ancient', 'precious', 'rare'][index % 5]} location, you found a pristine water source. You drank your fill, and the purity of the water seemed to accelerate your cellular repair. You felt a wave of energy and clarity, your focus sharpening for the challenges ahead.`,
        `Searching through a ${['mountainside', 'canyon', 'thicket', 'ridge', 'basement'][index % 5]}, you found a spring of "Healing Water". It wasn't just clean; it seemed to possess a faint, life-giving property. After drinking, you felt a warmth spread through your chest, revitalizing your tired muscles.`,
        `You discovered a hidden oasis in the middle of a desolate zone. The water from the central spring was refreshingly cool and untainted. Drinking it, you felt your internal radiation levels drop and your spirit lift, ready to continue your journey through the wasteland.`,
      ];
      return {
        ...baseTemplate,
        story: selectFromArray(stories, index),
        hpChange: randomInt(index, 20, 50, 280),
        expChange: randomInt(index, 25, 65, 290),
        eventColor: 'gain',
      };
    }

    case 'pet': {
      // 从常量池中获取灵宠模板
      const availablePets = PET_TEMPLATES.map(pet => pet.id);
      const petId = selectFromArray(availablePets, index);
      const stories = [
        `While searching in a ${['forest', 'cave', 'valley', 'riverbank', 'cliff'][index % 5]}, you heard a small whimper. Investigating, you found a ${['wounded', 'small', 'cute', 'mysterious', 'rare'][index % 5]} mutant animal watching you with intelligent, fearful eyes. You approached slowly, projecting peace and offering a bit of food. The mutant seemed to sense your kindness and gradually relaxed. It nudged your hand—it’s now your loyal companion.`,
        `In a ${['concealed', 'mysterious', 'ancient', 'precious', 'rare'][index % 5]} location, you sensed the presence of a mutant creature. Following the aura, you found a majestic beast watching you. You reached out with your mind and spirit, showing you were no threat. The creature stepped forward and accepted you. You’ve gained a new partner in this desolate world.`,
        `Exploring a ${['shady grove', 'deep bunker', 'winding canyon', 'marshy bank', 'high ridge'][index % 5]}, you came across a mutant creature. It didn’t attack; instead, it seemed curious. After a few minutes of careful interaction, it decided you were a friend. It’s now following you through the wasteland.`,
        `You inadvertently saved a ${['wounded', 'infant', 'unique', 'strange', 'mythical'][index % 5]} mutant from a larger predator. It was weak and needed care. You provided food and tended its wounds, and in gratitude, it has decided to stay by your side forever.`,
        `In the depths of a ${['forgotten vault', 'monolith park', 'ancient petrified forest', 'hidden oasis', 'toxic dump'][index % 5]}, you met a rare mutant. It possessed an eerie intelligence and seemed to be waiting for someone. You shared your goals, and it apparently approved, choosing to join you on your journey.`,
      ];
      return {
        ...baseTemplate,
        story: selectFromArray(stories, index),
        hpChange: 0,
        expChange: randomInt(index, 20, 50, 300),
        eventColor: 'special',
        petObtained: petId,
      };
    }

    case 'petOpportunity': {
      const opportunityTypes: Array<'evolution' | 'level' | 'stats' | 'exp'> = ['evolution', 'level', 'stats', 'exp'];
      const type = selectFromArray(opportunityTypes, index);
      const stories = [
        `While your companion was searching a ${['spring', 'vault ruin', 'ancient ruin', 'mountain peak', 'secret zone'][index % 5]}, they were exposed to a surge of concentrated energy. Following the pulse, they found a catalyst of growth. Your companion stayed there for hours, absorbing the radiation, and ${type === 'evolution' ? 'successfully mutated! Their form shifted dramatically, and their power reached a new peak' : type === 'level' ? 'gained a level! They feel stronger and more focused' : type === 'stats' ? 'received a stat boost! Their combat capabilities have significantly improved' : 'gained valuable experience, deepening their bond with you'}. You watched their transformation with pride.`,
        `In a ${['shielded', 'mysterious', 'ancient', 'dense', 'rare'][index % 5]} location, your companion suddenly became excited. They led you to a hidden energy node. Your companion bathed in the light, and ${type === 'evolution' ? 'mutated into a more powerful form! Their strength has increased exponentially' : type === 'level' ? 'their level increased! They are now more formidable in battle' : type === 'stats' ? 'their attributes were enhanced across the board' : 'they gained a massive amount of experience'}. You were thrilled to see their growth.`,
        `While exploring, your companion found a pocket of high-energy particles. Spending time in the field, they ${type === 'evolution' ? 'underwent a significant mutation, evolving their physical structure' : type === 'level' ? 'gained a new level of power' : type === 'stats' ? 'strengthened their core attributes' : 'sharpened their survival instincts with newfound experience'}. You noticed the difference immediately and felt a deeper connection with your loyal partner.`,
        `Near a ${['pre-war lab', 'mysterious monolith', 'ancient tree', 'crystal formation', 'technological relic'][index % 5]}, your companion encountered a unique environmental trigger. They interacted with it and ${type === 'evolution' ? 'evolved into a legendary mutant! Their presence now commands respect' : type === 'level' ? 'reached a new plateau of strength' : type === 'stats' ? 'increased their physical and mental capacity' : 'gained a wealth of experience from the encounter'}. Their growth is truly impressive.`,
        `During a trek through a ${['radiated valley', 'deep bunker', 'high ridge', 'ruined city', 'hazardous plain'][index % 5]}, your companion found an opportunity for growth. Through intense exposure or effort, they ${type === 'evolution' ? 'shook off their old form and mutated into something far more powerful' : type === 'level' ? 'became more experienced, raising their level' : type === 'stats' ? 'became faster and stronger than ever before' : 'honed their skills, gaining significant experience'}. You shared in the joy of their accomplishment.`,
      ];
      const petOpportunity: AdventureResult['petOpportunity'] = type === 'evolution'
        ? { type: 'evolution' }
        : type === 'level'
          ? { type: 'level', levelGain: randomInt(index, 1, 4, 310) }
          : type === 'stats'
            ? {
              type: 'stats',
              statsBoost: {
                attack: randomInt(index, 10, 30, 320),
                defense: randomInt(index, 8, 23, 330),
                hp: randomInt(index, 30, 80, 340),
                speed: randomInt(index, 5, 15, 350),
              }
            }
            : { type: 'exp', expGain: randomInt(index, 50, 150, 360) };

      return {
        ...baseTemplate,
        story: selectFromArray(stories, index),
        hpChange: 0,
        expChange: randomInt(index, 10, 30, 370),
        eventColor: 'special',
        petOpportunity,
      };
    }

    case 'trap': {
      const stories = [
        `As you were exploring, a sharp "snap" echoed beneath your feet. Your heart sank as you realized a ${['trap', 'tripwire', 'pressure plate', 'turret', 'gas vent'][index % 5]} had been triggered. You desperately tried to dive away, but the shockwave caught you, leaving you wounded. You immediately administered first aid while scanning for further hazards.`,
        `Exploring a ${['pre-war tomb', 'ruin', 'bunker', 'vault', 'forbidden zone'][index % 5]}, the silence was terrifying, broken only by your footsteps. Suddenly, a metallic "click" sounded. You tried to back away, but the mechanism had already fired. You were hit and significantly hurt, forcing you to focus on stabilization while staying on high alert.`,
        `While ${['exploring', 'traveling', 'resting', 'scavenging', 'scouting'][index % 5]}, you felt a sudden change underfoot. Realizing a trap was triggered, you moved fast, but the mechanism was faster. You were hit and took damage, prompting you to quickly retreat and treat your injuries while watching for more threats.`,
        `In a ${['hazardous zone', 'forbidden area', 'danger pocket', 'mutated zone', 'deadly valley'][index % 5]}, the air felt like it was carrying murderous intent. You moved with extreme care, yet a trap still snared you. A sudden burst of energy or a physical spike hit you; you survived, but your strength was severely drained. You focused on recovery while watching the shadows.`,
        `During ${['travel', 'exploration', 'rest', 'combat', 'scavenging'][index % 5]}, an unexpected accident occurred. Although you managed to brace yourself, you still took substantial damage. You tended to your wounds, wary of any predators drawn to the scent of blood.`,
      ];
      return {
        ...baseTemplate,
        story: selectFromArray(stories, index),
        hpChange: -randomInt(index, 30, 80, 380),
        expChange: randomInt(index, 10, 30, 390),
        eventColor: 'danger',
      };
    }

    case 'evilCultivator': {
      const stories = [
        `Deep in a ${['desolate', 'dark', 'perilous', 'forbidden', 'hazardous'][index % 5]} zone, you felt a surge of cold, focused bloodlust. Turning, you saw a ${['Raider', 'Renegade', 'Wasteland Thug', 'Mercenary', 'Shadowy Entity'][index % 5]} watching you with greed. Without a word, they attacked. You drew your weapon and engaged in a brutal struggle. You eventually emerged victorious, though the encounter left you bruised and bloody.`,
        `In ${['a barren mountain', 'a jagged ridge', 'a pre-war tomb', 'ruins', 'a high-risk zone'][index % 5]}, you heard a chilling laugh. Looking toward the sound, a ${['Raider', 'Mutant Marauder', 'Evil Survivor', 'Renegade', 'Hostile Scout'][index % 5]} stood watching from a distance. Realizing they were spotted, they charged. A fierce battle ensued, and while you defeated them, you sustained significant damage in the process.`,
        `You encountered a ${['hostile scavenger', 'renegade soldier', 'cold-blooded killer', 'desperate survivor', 'ruthless enemy'][index % 5]} who saw you as an easy target. They struck first, forcing you into a life-or-death duel. You managed to kill your attacker, but your gear was damaged and you were left weakened. Checking their body, you found some useful scraps.`,
        `In a ${['shadowed valley', 'toxic swamp', 'ruined factory', 'sewers', 'dead city'][index % 5]}, you were ambushed by a ${['vicious raider', 'renegade mercenary', 'feral survivor', 'shadowy stalker', 'hardened criminal'][index % 5]}. The battle was short but intense, ending with you standing over their remains. You took a moment to treat your wounds and salvage what you could.`,
        `While searching ${['broken hills', 'a ruined bunker', 'an ancient burial site', 'crumbling remains', 'a dead zone'][index % 5]}, you were challenged by a ${['raider captain', 'rogue warrior', 'vile murderer', 'hostile scout', 'merciless killer'][index % 5]}. The struggle was grueling, testing your survival skills to the limit. You were the one left standing, though victory came at a high cost to your physical state.`,
      ];
      return {
        ...baseTemplate,
        story: selectFromArray(stories, index),
        hpChange: -randomInt(index, 40, 100, 400),
        expChange: randomInt(index, 40, 100, 410),
        spiritStonesChange: randomInt(index, 50, 130, 420),
        eventColor: 'danger',
        itemObtained: randomChance(index, 0.4, 430) ? generateRandomItem(rarity, index) : undefined,
      };
    }

    case 'reputation': {
      const reputationEvents = [
        {
          title: 'Rescue a Wounded Wastelander',
          description: 'You found a wounded person on the road begging for your help.',
          choices: [
            { text: 'Help them', reputationChange: 15, expChange: 30, description: 'You assisted them and received gratitude and some supplies.' },
            { text: 'Ignore them', reputationChange: -10, description: 'You turned away, but felt a pang of guilt.' },
            { text: 'Demanded Payment', reputationChange: -5, spiritStonesChange: 50, description: 'You helped them, but only after they agreed to pay you.' },
          ],
        },
        {
          title: 'Found a Secret',
          description: 'You stumbled upon a hidden truth that could affect many in the wasteland.',
          choices: [
            { text: 'Make it public', reputationChange: 20, description: 'You revealed the truth, earning respect from the community.' },
            { text: 'Keep it secret', reputationChange: 5, description: 'You chose silence to avoid unnecessary chaos.' },
            { text: 'Exploit it', reputationChange: -15, spiritStonesChange: 100, description: 'You used the secret for your own profit, but your reputation took a hit.' },
          ],
        },
        {
          title: 'Justice in the Wasteland',
          description: 'You witnessed a group of thugs bullying a weak scavenger.',
          choices: [
            { text: 'Intervene', reputationChange: 25, hpChange: -20, description: 'You fought the thugs off and saved the scavenger.' },
            { text: 'Help secretly', reputationChange: 10, description: 'You helped the scavenger escape without drawing attention.' },
            { text: 'Walk away', reputationChange: -20, description: 'You did nothing, and word of your apathy spread.' },
          ],
        },
      ];
      const event = selectFromArray(reputationEvents, index);
      return {
        ...baseTemplate,
        story: `You encountered a situation that requires a choice: ${event.description}`,
        hpChange: 0,
        expChange: randomInt(index, 20, 50, 440),
        eventColor: 'normal',
        reputationEvent: event,
      };
    }

    case 'foundationTreasure': {
      // 从筑基奇物中随机选择一个
      const allTreasures = Object.values(FOUNDATION_TREASURES);
      const selectedTreasure = selectFromArray(allTreasures, index);

      const stories = [
        `While searching through ${['Vault ruins', 'pre-war remnants', 'ancient bunkers', 'secret labs', 'forbidden zones'][index % 5]}, you felt a strange energy resonance. Following the signal, you found a ${['concealed', 'mysterious', 'ancient', 'precious', 'rare'][index % 5]} safe. You carefully cracked it to find a high-tech ${selectedTreasure.name}! This is a legendary pre-war artifact, and you quickly secured it.`,
        `During your ${['travels', 'scavenging', 'training', 'adventures', 'searching'][index % 5]}, you met a ${['Wasteland Legend', 'Veteran Ranger', 'Mysterious Trader', 'Old Scribe', 'Hermit Genius'][index % 5]}. Impressed by your potential, they gifted you a ${selectedTreasure.name}. You were stunned by the gesture, knowing this is a vital component for high-level survival.`,
        `Deep within a ${['pre-war burial site', 'ruin complex', 'bunker network', 'decayed vault', 'hazardous zone'][index % 5]}, you found an ancient, high-tech altar. Resting on a pedestal was a ${selectedTreasure.name}. Its energy readout was off the charts, and you quickly recovered the artifact for your own use.`,
        `You inadvertently discovered a ${['shielded', 'mysterious', 'ancient', 'dense', 'rare'][index % 5]} research area. In a ${['locked locker', 'reinforced crate', 'maintenance hatch', 'data terminal', 'shielded container'][index % 5]}, you found a ${selectedTreasure.name}. Its sophisticated design spoke of a lost era of technology.`,
        `In an ${['ancient bunker', 'ruined factory', 'hidden research station', 'vault', 'monolith'][index % 5]}, you accidentally triggered a ${['primitive', 'sophisticated', 'defensive', 'automated', 'hidden'][index % 5]} mechanism. A secure compartment opened, revealing a ${selectedTreasure.name}! You secured the valuable item with trembling hands.`,
      ];
      // 将筑基奇物转换为Item格式
      const permanentEffect: any = {};
      if (selectedTreasure.effects.hpBonus) permanentEffect.maxHp = selectedTreasure.effects.hpBonus;
      if (selectedTreasure.effects.attackBonus) permanentEffect.attack = selectedTreasure.effects.attackBonus;
      if (selectedTreasure.effects.defenseBonus) permanentEffect.defense = selectedTreasure.effects.defenseBonus;
      if (selectedTreasure.effects.spiritBonus) permanentEffect.spirit = selectedTreasure.effects.spiritBonus;
      if (selectedTreasure.effects.physiqueBonus) permanentEffect.physique = selectedTreasure.effects.physiqueBonus;
      if (selectedTreasure.effects.speedBonus) permanentEffect.speed = selectedTreasure.effects.speedBonus;

      return {
        ...baseTemplate,
        story: selectFromArray(stories, index),
        hpChange: randomInt(index, 10, 30, 460),
        expChange: randomInt(index, 30, 80, 470),
        eventColor: 'special',
        itemObtained: {
          name: selectedTreasure.name,
          type: ItemType.AdvancedItem,
          description: selectedTreasure.description,
          rarity: selectedTreasure.rarity,
          permanentEffect: Object.keys(permanentEffect).length > 0 ? permanentEffect : undefined,
          advancedItemType: 'foundationTreasure',
          advancedItemId: selectedTreasure.id,
        },
      };
    }

    case 'heavenEarthEssence': {
      // 从天地精华中随机选择一个
      const allEssences = Object.values(HEAVEN_EARTH_ESSENCES);
      const selectedEssence = selectFromArray(allEssences, index);

      const stories = [
        `During your ${['travels', 'scavenging', 'training', 'scouting', 'searching'][index % 5]}, you felt a massive surge of high-frequency energy. Following the source, you found a ${['derelict', 'ancient', 'mysterious', 'shielded', 'hidden'][index % 5]} ${['terminal', 'pod', 'pedestal', 'array', 'chamber'][index % 5]} in a ${['Vault ruin', 'forbidden zone', 'bunker', 'hazardous area', 'monolith park'][index % 5]}. In the center was a glowing cloud of ${selectedEssence.name}. You carefully collected the volatile essence, knowing it was vital for high-level survival.`,
        `In the deepest part of ${['a pre-war burial site', 'a ruin complex', 'a bunker network', 'a decayed vault', 'a hazardous zone'][index % 5]}, you found an area where energy had pooled after centuries of isolation. A shimmering mass of ${selectedEssence.name} floated in the zero-gravity field. You harvested the precious material with extreme caution.`,
        `You met a ${['legendary survivor', 'veteran ranger', 'mysterious elder', 'sect master', 'hermit scientist'][index % 5]} who saw you were on the verge of a breakthrough and shared the location of ${selectedEssence.name}. You followed the coordinates and found the essence just as they described, securing it for your future growth.`,
        `While searching ${['an old bunker', 'ruins', 'a monolith site', 'a dead city', 'a hazardous plain'][index % 5]}, you felt a localized atmospheric disturbance. Investigating, you uncovered a ${['shielded', 'mysterious', 'ancient', 'dense', 'rare'][index % 5]} storage area for ${selectedEssence.name}. You secured the material, knowing its immense value.`,
        `In ${['a pre-war burial site', 'a research facility', 'a bunker', 'a vault', 'a forbidden zone'][index % 5]}, you found a ${['sophisticated', 'ancient', 'sharded', 'locked', 'shielded'][index % 5]} containment unit. Inside was a stable sample of ${selectedEssence.name}. You retrieved the sample, your hands glowing from the background energy it radiated.`,
      ];
      // 将天地精华转换为Item格式
      const permanentEffect: any = {};
      if (selectedEssence.effects.hpBonus) permanentEffect.maxHp = selectedEssence.effects.hpBonus;
      if (selectedEssence.effects.attackBonus) permanentEffect.attack = selectedEssence.effects.attackBonus;
      if (selectedEssence.effects.defenseBonus) permanentEffect.defense = selectedEssence.effects.defenseBonus;
      if (selectedEssence.effects.spiritBonus) permanentEffect.spirit = selectedEssence.effects.spiritBonus;
      if (selectedEssence.effects.physiqueBonus) permanentEffect.physique = selectedEssence.effects.physiqueBonus;
      if (selectedEssence.effects.speedBonus) permanentEffect.speed = selectedEssence.effects.speedBonus;

      return {
        ...baseTemplate,
        story: selectFromArray(stories, index),
        hpChange: randomInt(index, 20, 50, 480),
        expChange: randomInt(index, 50, 120, 490),
        eventColor: 'special',
        itemObtained: {
          name: selectedEssence.name,
          type: ItemType.AdvancedItem,
          description: selectedEssence.description,
          rarity: selectedEssence.rarity,
          permanentEffect: Object.keys(permanentEffect).length > 0 ? permanentEffect : undefined,
          advancedItemType: 'heavenEarthEssence',
          advancedItemId: selectedEssence.id,
        },
      };
    }

    case 'heavenEarthMarrow': {
      // 从天地之髓中随机选择一个
      const allMarrows = Object.values(HEAVEN_EARTH_MARROWS);
      const selectedMarrow = selectFromArray(allMarrows, index);

      const stories = [
        `In your ${['travels', 'scavenging', 'training', 'scouting', 'searching'][index % 5]}, you felt a massive surge of quantum-level energy. Following the source, you found a ${['derelict', 'ancient', 'mysterious', 'shielded', 'hidden'][index % 5]} ${['terminal', 'pod', 'pedestal', 'array', 'chamber'][index % 5]} in the deepest part of a ${['Vault ruin', 'forbidden zone', 'bunker', 'hazardous area', 'monolith park'][index % 5]}. In the center was a glowing cloud of ${selectedMarrow.name}. You carefully collected the volatile substance, knowing it was vital for the next stage of evolution.`,
        `In the deepest part of ${['a high-risk burial site', 'a ruin complex', 'the core of a bunker network', 'an experimental vault', 'a hazardous zone'][index % 5]}, you found an area where quantum energy had distilled over centuries. A shimmering mass of ${selectedMarrow.name} pulsed within a stabilized field. You harvested the precious marrow with extreme caution.`,
        `You met a ${['legendary survivor', 'veteran ranger', 'mysterious elder', 'sect leader', 'hermit scientist'][index % 5]} who saw you were on the verge of your final breakthrough and told you the location of ${selectedMarrow.name}. You followed their directions and found a stash of the marrow exactly where they said. It was more valuable than you could have imagined.`,
        `While searching ${['an old experimental bunker', 'ruins', 'the Forbidden City', 'a dead city', 'a hazardous crater'][index % 5]}, you felt a localized reality distortion. Investigating, you uncovered a ${['shielded', 'mysterious', 'ancient', 'dense', 'rare'][index % 5]} storage area for ${selectedMarrow.name}. You secured the material, each gram humming with immense power.`,
        `In ${['a high-security burial site', 'a research facility', 'an ancient bunker', 'a secure vault', 'a forbidden zone'][index % 5]}, you found a ${['high-tech', 'pre-war', 'encoded', 'shielded', 'advanced'][index % 5]} containment unit. Inside was a pure sample of ${selectedMarrow.name}. You retrieved it, its glow illuminating the dark corridor with a sickly green light.`,
      ];
      // 将天地之髓转换为Item格式
      const permanentEffect: any = {};
      if (selectedMarrow.effects.hpBonus) permanentEffect.maxHp = selectedMarrow.effects.hpBonus;
      if (selectedMarrow.effects.attackBonus) permanentEffect.attack = selectedMarrow.effects.attackBonus;
      if (selectedMarrow.effects.defenseBonus) permanentEffect.defense = selectedMarrow.effects.defenseBonus;
      if (selectedMarrow.effects.spiritBonus) permanentEffect.spirit = selectedMarrow.effects.spiritBonus;
      if (selectedMarrow.effects.physiqueBonus) permanentEffect.physique = selectedMarrow.effects.physiqueBonus;
      if (selectedMarrow.effects.speedBonus) permanentEffect.speed = selectedMarrow.effects.speedBonus;

      return {
        ...baseTemplate,
        story: selectFromArray(stories, index),
        hpChange: randomInt(index, 30, 70, 500),
        expChange: randomInt(index, 80, 150, 510),
        eventColor: 'special',
        itemObtained: {
          name: selectedMarrow.name,
          type: ItemType.AdvancedItem,
          description: selectedMarrow.description,
          rarity: selectedMarrow.rarity,
          permanentEffect: Object.keys(permanentEffect).length > 0 ? permanentEffect : undefined,
          advancedItemType: 'heavenEarthMarrow',
          advancedItemId: selectedMarrow.id,
        },
      };
    }

    case 'heavenEarthSoul': {
      // 从天地之魄BOSS中随机选择一个
      const allBosses = Object.values(HEAVEN_EARTH_SOUL_BOSSES);
      const selectedBoss = selectFromArray(allBosses, index);

      const stories = [
        `While searching ${['Vault ruins', 'ancient remains', 'the Great Crater', 'secret bunkers', 'dead cities'][index % 5]}, you felt a preternatural atmospheric pressure. Following the signal, you discovered a ${['derelict', 'ancient', 'mysterious', 'shining', 'sharded'][index % 5]} altar. In front of it stood a legendary entity—the ${selectedBoss.name}! This is the physical manifestation of a Quantum Soul. Only by defeating it can you prove your worth for the next stage of evolution. You steeled your nerves for the challenge.`,
        `In the deepest part of ${['a secure bunker', 'the ruins of a titan', 'a high-security vault', 'an experimental site', 'the Forbidden City'][index % 5]}, you felt a surge of reality-bending power. In the center of a ${['shattered', 'pristine', 'shadowed', 'humming', 'ancient'][index % 5]} field, ${selectedBoss.name} slowly materialized. Defeating this legendary being is the only way to prove you can handle the raw power of the wasteland.`,
        `While trekking through ${['hazardous zones', 'the Dead Sea', 'ancient ruins', 'broken territory', 'shadowed ridges'][index % 5]}, the sky suddenly darkened and a massive presence loomed. ${selectedBoss.name} appeared before you, a true legend of the wasteland. ${selectedBoss.description}. You realized this was your trial, your chance to ascend to legal status in the higher tiers of power.`,
        `In ${['a high-risk burial site', 'a ruin complex', 'the core of a bunker network', 'an experimental vault', 'a hazardous zone'][index % 5]}, you felt a localized atmospheric disturbance. An automated beacon or ritual activated, and ${selectedBoss.name} materialized from the shimmering air. This is a Quantum Soul manifestation; defeating it is your ultimate test.`,
        `At the very edge of ${['civilization', 'the known wasteland', 'sanity', 'human territory', 'the old world'][index % 5]}, you encountered the ${selectedBoss.name}. ${selectedBoss.description}. It is a force of pure energy, a legend of the wasteland. You braced yourself, knowing this battle would define your future.`,
      ];

      return {
        ...baseTemplate,
        story: selectFromArray(stories, index),
        hpChange: 0,
        expChange: 0,
        spiritStonesChange: 0,
        eventColor: 'danger',
        adventureType: 'dao_combining_challenge', // 标记为合道挑战类型
        heavenEarthSoulEncounter: selectedBoss.id, // 标记遇到的BOSS ID
      };
    }

    case 'longevityRule': {
      // 从规则之力中随机选择一个
      const allRules = Object.values(LONGEVITY_RULES);
      const selectedRule = selectFromArray(allRules, index);

      const stories = [
        `While ${['exploring', 'scavenging', 'training', 'scouting', 'searching'][index % 5]}, you felt a surge of absolute atmospheric control. Following the pulse, you found the source of a ${selectedRule.name} in a ${['Vault ruin', 'forbidden zone', 'bunker', 'hazardous area', 'monolith park'][index % 5]}. This is a fundamental law of the wasteland itself. You attempted to synchronize with it and eventually succeeded.`,
        `In the deepest part of ${['a high-risk burial site', 'a ruin complex', 'the core of a bunker network', 'an experimental vault', 'a hazardous zone'][index % 5]}, you felt a localized reality distortion. In the center of a ${['shattered', 'pristine', 'shadowed', 'humming', 'ancient'][index % 5]} field, the logic of ${selectedRule.name} became visible. ${selectedRule.description}. You mediated on this absolute truth and successfully mastered it.`,
        `While trekking through ${['hazardous zones', 'the Dead Sea', 'ancient ruins', 'broken territory', 'shadowed ridges'][index % 5]}, the sky suddenly warped as a fundamental law manifested. The pattern of ${selectedRule.name} unfolded before your eyes. ${selectedRule.description}. You spent days in deep contemplation, eventually mastering this rule—a power that commands the wasteland itself.`,
        `In ${['a secure bunker', 'the ruins of a titan', 'a high-security vault', 'an experimental site', 'the Forbidden City'][index % 5]}, you felt a localized reality pulse. An automated beacon or ancient ritual site activated, revealing the ${selectedRule.name}. You realized this was the pinnacle of wasteland power and, after intense effort, you made this rule your own.`,
        `At the very edge of ${['human knowledge', 'the known world', 'the physical wasteland', 'rationality', 'existence'][index % 5]}, the rule of ${selectedRule.name} manifested as a physical force. ${selectedRule.description}. You dove into the core of the pattern, eventually integrating this fundamental law into your own being. You are now one with the wasteland.`,
      ];

      return {
        ...baseTemplate,
        story: selectFromArray(stories, index),
        hpChange: randomInt(index, 50, 100, 520),
        expChange: randomInt(index, 200, 400, 530),
        spiritStonesChange: randomInt(index, 500, 1000, 540),
        eventColor: 'special',
        longevityRuleObtained: selectedRule.id, // 标记获得的规则之力ID
      };
    }

    case 'lottery': {
      const stories = [
        `While searching through ${['a path', 'a cave', 'ruins', 'a bunker', 'a vault'][index % 5]}, you found several Nuka-Cola lottery tickets scattered on the ground. They were dusty but the bar-codes remained legible. You gathered them up, hoping they might still be redeemable for some wasteland treasure.`,
        `In a ${['shielded', 'mysterious', 'ancient', 'precious', 'rare'][index % 5]} location, you found a small box containing several lottery tickets. They were preserved perfectly by the climate control systems of the pre-war era. You pocketed them with a stroke of luck.`,
        `You inadvertently stumbled upon a stash of lottery tickets in a rusted safe. They seemed to be from a pre-war promotion that never finished. You collected them all, curious about what rewards they might still hold.`,
        `Exploring a ${['pre-war grave', 'ruin complex', 'bunker network', 'decayed vault', 'hazardous zone'][index % 5]}, you found some old tickets hidden in a desk drawer. You checked them—they were valid Nuka-Cola lottery tickets. You pocketed them with a grin.`,
        `In a ${['concealed', 'mysterious', 'ancient', 'precious', 'rare'][index % 5]} search, you discovered a few tickets inside a locked locker. You took them with you, perhaps they'll bring you some good fortune at the next trading post.`,
      ];
      return {
        ...baseTemplate,
        story: selectFromArray(stories, index),
        hpChange: 0,
        expChange: 0,
        spiritStonesChange: 0,
        eventColor: 'gain',
        lotteryTicketsChange: randomInt(index, 1, 11, 450),
      };
    }

    case 'lucky': {
      const rarity: ItemRarity = selectFromArray(['Common', 'Rare', 'Legendary', 'Mythic'], index);
      const luckyResult = generateLuckyEventTemplate(index, rarity);
      return {
        ...baseTemplate,
        story: luckyResult.story,
        hpChange: luckyResult.hpChange,
        expChange: luckyResult.expChange,
        spiritStonesChange: luckyResult.spiritStonesChange,
        eventColor: luckyResult.eventColor,
        isLucky: true,
        itemObtained: luckyResult.itemObtained,
      };
    }

    default:
      return baseTemplate;
  }
}

/**
 * Generates lucky event templates
 * @param index Random seed offset
 * @param forcedRarity Optional forced rarity
 */
function generateLuckyEventTemplate(index: number, forcedRarity?: ItemRarity): AdventureEventTemplate {
  const rarity: ItemRarity = forcedRarity || (randomChance(index, 0.5, 460) ? 'Legendary' : 'Mythic');

  const stories = {
    Common: 'You found a small pre-war stash containing some basic supplies and bottle caps. It’s not much, but it’s a lucky find in the wasteland.',
    Rare: 'You discovered a hidden cache of pre-war technology and specialized chems! The items are in excellent condition and will be very useful.',
    Legendary: 'A true windfall! You stumbled upon an abandoned high-tech research facility. Along with rusted machinery, you found a pristine piece of equipment and a significant amount of valuable resources.',
    Mythic: 'The ultimate luck of the wasteland! You found a perfectly preserved pre-war "Sanctuary" vault. Inside, you discovered a legendary artifact and vast wealth that will significantly accelerate your progress.',
  };

  return {
    story: stories[rarity] || stories.Common,
    hpChange: randomInt(index, 30, 80, 470),
    expChange: rarity === 'Mythic' ? 2000 : rarity === 'Legendary' ? 500 : 150,
    spiritStonesChange: rarity === 'Mythic' ? 5000 : rarity === 'Legendary' ? 1000 : 300,
    eventColor: 'special',
    adventureType: 'lucky',
    itemObtained: generateRandomItem(rarity, index),
    inheritanceLevelChange: randomChance(index, 0.1, 510) ? 1 : undefined,
    triggerSecretRealm: randomChance(index, 0.05, 530),
  };
}

/**
 * 生成秘境探索事件模板
 */
function generateSecretRealmEventTemplate(index: number): AdventureEventTemplate {
  const riskLevels: Array<'Low' | 'Medium' | 'High' | 'Extremely Dangerous'> = ['Low', 'Medium', 'High', 'Extremely Dangerous'];
  const riskLevel = selectFromArray(riskLevels, index);

  const encounters = ['guardian beast', 'extinct treasure', 'trap mechanism', 'treasury inheritance', 'other cultivators'];
  const locations = ['ancient ruins', 'strange terrain', 'mysterious forbidden zone', 'natural wonder', 'dangerous area'];

  const encounter = selectFromArray(encounters, index);
  const location = selectFromArray(locations, index);

  const stories = [
    `As you explore the secret realm, rich spiritual energy permeates the surroundings, and the air itself seems to carry a mysterious aura. You proceed cautiously, suddenly discovering a ${encounter}. A powerful aura emanates from it, clearly indicating it's no ordinary object. You observe carefully, finding many precious treasures and inheritances, but also immense danger.`,
    `Deep within the secret realm, the scenery becomes increasingly bizarre, and the air is filled with a powerful Dao韵. You proceed cautiously, suddenly discovering a ${location}. A rich glow emanates from it, clearly indicating it's no ordinary place. You observe carefully, finding many precious treasures and inheritances, but also immense danger.`,
    `While exploring the secret realm, you suddenly feel a strong sense of danger. You quickly circulate your cultivation technique, vigilantly observing your surroundings, and realize you've encountered a ${encounter}. You dare not be careless, immediately activating your cultivation technique, preparing to face the impending danger.`,
    `Deep within the secret realm, the scenery becomes increasingly bizarre, and the air is filled with a powerful Dao韵. You proceed cautiously, discovering many precious treasures and inheritances, but also immense danger.`,
    `As you explore the secret realm, rich spiritual energy permeates the surroundings, and the air itself seems to carry a mysterious aura. You proceed cautiously, suddenly discovering a ${encounter}. A powerful aura emanates from it, clearly indicating it's no ordinary object. You observe carefully, finding many precious treasures and inheritances, but also immense danger.`,
  ];

  const rarity: ItemRarity = (riskLevel === 'Low' || riskLevel === 'Medium') ? 'Rare' : 'Legendary';

  const baseRewards = {
    Low: { exp: [50, 300], stones: [100, 600] },
    Medium: { exp: [100, 500], stones: [200, 1000] },
    High: { exp: [200, 800], stones: [400, 1500] },
    'Extremely Dangerous': { exp: [400, 1200], stones: [800, 2500] },
  } as const;

  const rewards = baseRewards[riskLevel];

  return {
    story: selectFromArray(stories, index),
    hpChange: riskLevel === 'Extremely Dangerous'
      ? -randomInt(index, 50, 150, 540)
      : -randomInt(index, 20, 80, 550),
    expChange: randomInt(index, rewards.exp[0], rewards.exp[1], 560),
    spiritStonesChange: randomInt(index, rewards.stones[0], rewards.stones[1], 570),
    eventColor: riskLevel === 'Extremely Dangerous' ? 'danger' : 'gain',
    adventureType: 'secret_realm',
    riskLevel,
    itemObtained: randomChance(index, 0.6, 580) ? generateRandomItem(rarity, index) : undefined,
    attributeReduction: riskLevel === 'Extremely Dangerous' && randomChance(index, 0.3, 590) ? {
      attack: randomInt(index, 20, 70, 600),
      defense: randomInt(index, 15, 45, 610),
    } : undefined,
  };
}

/**
 * 生成宗门挑战事件模板
 */
function generateSectChallengeEventTemplate(index: number): AdventureEventTemplate {
  const missions = ['mission', 'challenge', 'trial', 'test', 'commission'];
  const locations = ['perilous land', 'forbidden zone', 'dangerous area', 'demon realm', 'dead zone'];
  const threats = ['enemies', 'demonic beasts', 'traps', 'mechanisms', 'dangers'];

  const mission = selectFromArray(missions, index);
  const location = selectFromArray(locations, index);
  const threat = selectFromArray(threats, index);

  const stories = [
    `You accepted the sect's ${mission}, an important task related to the sect's reputation and interests. You packed your bags and set off to execute the mission. Along the way, you encountered many difficulties and challenges, but with your strength and wisdom, you overcame them one by one, successfully completing the mission.`,
    `You are performing a sect mission in a ${location}, which is full of dangers, and the air is filled with killing intent. You proceed cautiously, suddenly encountering a ${threat}. You dare not be careless, immediately activating your cultivation technique, and engaging in a fierce battle with the opponent. After an intense struggle, you finally defeated it, but you also sustained some injuries.`,
    `You accepted the sect's ${mission}, an important task related to the sect's reputation and interests. You packed your bags and set off to execute the mission. Along the way, you encountered many difficulties and challenges, but with your strength and wisdom, you overcame them one by one, successfully completing the mission. The sect was very satisfied with your performance and gave generous rewards.`,
    `You are performing a sect mission in a ${location}, which is full of dangers, and the air is filled with killing intent. You proceed cautiously, encountering many difficulties and challenges, but with your strength and wisdom, you overcame them one by one, successfully completing the mission.`,
    `You accepted the sect's ${mission}, an important task related to the sect's reputation and interests. You packed your bags and set off to execute the mission. Along the way, you encountered many difficulties and challenges, but with your strength and wisdom, you overcame them one by one, successfully completing the mission.`,
  ];

  return {
    story: selectFromArray(stories, index),
    hpChange: randomChance(index, 0.5, 620) ? -randomInt(index, 20, 60, 630) : 0,
    expChange: randomInt(index, 50, 150, 640),
    spiritStonesChange: randomInt(index, 100, 250, 650),
    eventColor: 'gain',
    adventureType: 'sect_challenge',
    reputationChange: randomInt(index, 10, 30, 660),
    itemObtained: randomChance(index, 0.4, 670) ? generateRandomItem('Rare', index) : undefined,
  };
}

/**
 * 生成随机物品
 */
/**
 * 从常量池中获取所有可用物品（缓存）
 */
let cachedItems: Array<{
  name: string;
  type: ItemType | string;
  description: string;
  rarity: ItemRarity;
  effect?: any;
  permanentEffect?: any;
  isEquippable?: boolean;
  equipmentSlot?: EquipmentSlot | string;
  advancedItemType?: 'foundationTreasure' | 'heavenEarthEssence' | 'heavenEarthMarrow' | 'longevityRule';
  advancedItemId?: string;
}> | null = null;

function getAllItemsFromConstants(): Array<{
  name: string;
  type: ItemType | string;
  description: string;
  rarity: ItemRarity;
  effect?: any;
  permanentEffect?: any;
  isEquippable?: boolean;
  equipmentSlot?: EquipmentSlot | string;
  advancedItemType?: 'foundationTreasure' | 'heavenEarthEssence' | 'heavenEarthMarrow' | 'longevityRule';
  advancedItemId?: string;
}> {
  // 使用缓存
  if (cachedItems) {
    return cachedItems;
  }

  const items: Array<{
    name: string;
    type: ItemType | string;
    description: string;
    rarity: ItemRarity;
    effect?: any;
    permanentEffect?: any;
    isEquippable?: boolean;
    equipmentSlot?: EquipmentSlot | string;
    advancedItemType?: 'foundationTreasure' | 'heavenEarthEssence' | 'heavenEarthMarrow' | 'longevityRule';
    advancedItemId?: string;
  }> = [];
  const itemNames = new Set<string>();

  // 从INITIAL_ITEMS中提取物品
  INITIAL_ITEMS.forEach(item => {
    if (itemNames.has(item.name)) return;
    itemNames.add(item.name);
    items.push({
      name: item.name,
      type: item.type,
      description: item.description,
      rarity: (item.rarity || 'Common') as ItemRarity,
      effect: item.effect,
      permanentEffect: item.permanentEffect,
      isEquippable: item.isEquippable,
      equipmentSlot: item.equipmentSlot,
    });
  });

  // 从ITEM_TEMPLATES中提取生成的物品
  ITEM_TEMPLATES.forEach(item => {
    if (itemNames.has(item.name)) return;
    itemNames.add(item.name);
    items.push({
      name: item.name,
      type: item.type,
      description: item.description,
      rarity: item.rarity,
      effect: item.effect,
      permanentEffect: item.permanentEffect,
      isEquippable: item.isEquippable,
      equipmentSlot: item.equipmentSlot,
    });
  });

  // 从所有丹方中提取丹药（避免重复）
  [...PILL_RECIPES, ...DISCOVERABLE_RECIPES].forEach(recipe => {
    if (recipe.result && !itemNames.has(recipe.result.name)) {
      itemNames.add(recipe.result.name);
      items.push({
        name: recipe.result.name,
        type: recipe.result.type,
        description: recipe.result.description,
        rarity: recipe.result.rarity as ItemRarity,
        effect: recipe.result.effect,
        permanentEffect: recipe.result.permanentEffect,
      });
    }
  });

  // 从抽奖奖品中提取物品
  LOTTERY_PRIZES.forEach(prize => {
    if (prize.type === 'item' && prize.value.item) {
      const item = prize.value.item;
      // 避免重复
      if (itemNames.has(item.name)) return;
      itemNames.add(item.name);

      // 如果是丹药，优先从常量中获取完整定义
      if (item.type === ItemType.Pill) {
        const pillDef = getPillDefinition(item.name);
        if (pillDef) {
          items.push({
            name: pillDef.name,
            type: pillDef.type,
            description: pillDef.description,
            rarity: pillDef.rarity as ItemRarity,
            effect: pillDef.effect,
            permanentEffect: pillDef.permanentEffect,
          });
          return;
        }
      }
      // 非丹药或常量中没有定义的物品，使用原始定义
      items.push({
        name: item.name,
        type: item.type,
        description: item.description,
        rarity: (item.rarity || 'Common') as ItemRarity,
        effect: item.effect,
        permanentEffect: item.permanentEffect,
        isEquippable: item.isEquippable,
        equipmentSlot: item.equipmentSlot,
      });
    }
  });

  // 从宗门商店物品中提取
  SECT_SHOP_ITEMS.forEach(shopItem => {
    const item = shopItem.item;
    if (itemNames.has(item.name)) return;
    itemNames.add(item.name);

    // 如果是丹药，优先从常量中获取完整定义
    if (item.type === ItemType.Pill) {
      const pillDef = getPillDefinition(item.name);
      if (pillDef) {
        items.push({
          name: pillDef.name,
          type: pillDef.type,
          description: pillDef.description,
          rarity: pillDef.rarity as ItemRarity,
          effect: pillDef.effect,
          permanentEffect: pillDef.permanentEffect,
        });
        return;
      }
    }

    items.push({
      name: item.name,
      type: item.type,
      description: item.description,
      rarity: (item.rarity || 'Common') as ItemRarity,
      effect: item.effect,
      permanentEffect: item.permanentEffect,
      isEquippable: item.isEquippable,
      equipmentSlot: item.equipmentSlot,
    });
  });

  // 从筑基奇物中提取物品
  Object.values(FOUNDATION_TREASURES).forEach(treasure => {
    if (itemNames.has(treasure.name)) return;
    itemNames.add(treasure.name);

    // 将effects转换为Item格式的permanentEffect
    const permanentEffect: any = {};
    if (treasure.effects.hpBonus) permanentEffect.maxHp = treasure.effects.hpBonus;
    if (treasure.effects.attackBonus) permanentEffect.attack = treasure.effects.attackBonus;
    if (treasure.effects.defenseBonus) permanentEffect.defense = treasure.effects.defenseBonus;
    if (treasure.effects.spiritBonus) permanentEffect.spirit = treasure.effects.spiritBonus;
    if (treasure.effects.physiqueBonus) permanentEffect.physique = treasure.effects.physiqueBonus;
    if (treasure.effects.speedBonus) permanentEffect.speed = treasure.effects.speedBonus;

    items.push({
      name: treasure.name,
      type: ItemType.AdvancedItem,
      description: treasure.description,
      rarity: treasure.rarity,
      permanentEffect: Object.keys(permanentEffect).length > 0 ? permanentEffect : undefined,
      advancedItemType: 'foundationTreasure',
      advancedItemId: treasure.id,
    });
  });

  // 从天地精华中提取物品
  Object.values(HEAVEN_EARTH_ESSENCES).forEach(essence => {
    if (itemNames.has(essence.name)) return;
    itemNames.add(essence.name);

    // 将effects转换为Item格式的permanentEffect
    const permanentEffect: any = {};
    if (essence.effects.hpBonus) permanentEffect.maxHp = essence.effects.hpBonus;
    if (essence.effects.attackBonus) permanentEffect.attack = essence.effects.attackBonus;
    if (essence.effects.defenseBonus) permanentEffect.defense = essence.effects.defenseBonus;
    if (essence.effects.spiritBonus) permanentEffect.spirit = essence.effects.spiritBonus;
    if (essence.effects.physiqueBonus) permanentEffect.physique = essence.effects.physiqueBonus;
    if (essence.effects.speedBonus) permanentEffect.speed = essence.effects.speedBonus;

    items.push({
      name: essence.name,
      type: ItemType.AdvancedItem,
      description: essence.description,
      rarity: essence.rarity,
      permanentEffect: Object.keys(permanentEffect).length > 0 ? permanentEffect : undefined,
      advancedItemType: 'heavenEarthEssence',
      advancedItemId: essence.id,
    });
  });

  // 从天地之髓中提取物品
  Object.values(HEAVEN_EARTH_MARROWS).forEach(marrow => {
    if (itemNames.has(marrow.name)) return;
    itemNames.add(marrow.name);

    // 将effects转换为Item格式的permanentEffect
    const permanentEffect: any = {};
    if (marrow.effects.hpBonus) permanentEffect.maxHp = marrow.effects.hpBonus;
    if (marrow.effects.attackBonus) permanentEffect.attack = marrow.effects.attackBonus;
    if (marrow.effects.defenseBonus) permanentEffect.defense = marrow.effects.defenseBonus;
    if (marrow.effects.spiritBonus) permanentEffect.spirit = marrow.effects.spiritBonus;
    if (marrow.effects.physiqueBonus) permanentEffect.physique = marrow.effects.physiqueBonus;
    if (marrow.effects.speedBonus) permanentEffect.speed = marrow.effects.speedBonus;

    items.push({
      name: marrow.name,
      type: ItemType.AdvancedItem,
      description: marrow.description,
      rarity: marrow.rarity,
      permanentEffect: Object.keys(permanentEffect).length > 0 ? permanentEffect : undefined,
      advancedItemType: 'heavenEarthMarrow',
      advancedItemId: marrow.id,
    });
  });

  cachedItems = items;
  return items;
}

/**
 * 从常量池中根据名称获取物品
 * @param itemName 物品名称
 * @returns 物品数据，如果未找到则返回 null
 */
export function getItemFromConstants(itemName: string): {
  name: string;
  type: ItemType;
  description: string;
  rarity: ItemRarity;
  effect?: any;
  permanentEffect?: any;
  isEquippable?: boolean;
  equipmentSlot?: EquipmentSlot | string;
} | null {
  const allItems = getAllItemsFromConstants();
  const item = allItems.find(i => i.name === itemName);

  if (!item) {
    return null;
  }

  // 验证物品类型是否为有效的 ItemType
  const itemType = Object.values(ItemType).includes(item.type as ItemType)
    ? (item.type as ItemType)
    : ItemType.Material;

  return {
    name: item.name,
    type: itemType,
    description: item.description,
    rarity: item.rarity,
    effect: item.effect,
    permanentEffect: item.permanentEffect,
    isEquippable: item.isEquippable,
    equipmentSlot: item.equipmentSlot,
  };
}

/**
 * 从常量池中获取随机物品
 */
function generateRandomItem(rarity: ItemRarity, index: number): AdventureResult['itemObtained'] {
  const allItems = getAllItemsFromConstants();

  // 根据稀有度筛选物品
  let filteredItems = allItems.filter(item => item.rarity === rarity);

  // 如果该稀有度的物品太少，放宽条件
  if (filteredItems.length < 3) {
    // 允许使用相邻稀有度的物品
    const rarityOrder: ItemRarity[] = ['Common', 'Rare', 'Legendary', 'Mythic'];
    const currentIndex = rarityOrder.indexOf(rarity);
    const allowedRarities: ItemRarity[] = [rarity];
    if (currentIndex > 0) allowedRarities.push(rarityOrder[currentIndex - 1]);
    if (currentIndex < rarityOrder.length - 1) allowedRarities.push(rarityOrder[currentIndex + 1]);
    filteredItems = allItems.filter(item => allowedRarities.includes(item.rarity));
  }

  // 如果还是没有，使用所有物品
  if (filteredItems.length === 0) {
    filteredItems = allItems;
  }

  // 使用确定性随机数生成器选择物品，增加随机性
  // 使用多个偏移量组合，避免固定模式
  const randomOffset1 = deterministicRandom(index, 100);
  const randomOffset2 = deterministicRandom(index, 200);
  const randomOffset3 = deterministicRandom(index, 300);
  // 组合多个随机数，增加随机性
  let combinedRandom = (randomOffset1 + randomOffset2 + randomOffset3) / 3;

  // 如果物品池较大，进行二次随机化
  if (filteredItems.length > 10) {
    // 使用额外的随机偏移，增加随机性
    const additionalRandom = deterministicRandom(index, 400);
    combinedRandom = (combinedRandom + additionalRandom) / 2;
  }

  // 使用 Fisher-Yates 风格的随机选择，增加随机性
  // 先打乱数组顺序（基于确定性随机数）
  const shuffleSeed = deterministicRandom(index, 500);
  const shuffledItems = [...filteredItems];
  for (let i = shuffledItems.length - 1; i > 0; i--) {
    const j = Math.floor(deterministicRandom(index, 500 + i) * (i + 1));
    [shuffledItems[i], shuffledItems[j]] = [shuffledItems[j], shuffledItems[i]];
  }

  const selectedIndex = Math.floor(combinedRandom * shuffledItems.length);
  const selectedItem = shuffledItems[selectedIndex];

  if (!selectedItem) {
    // If no item in pool, return a default item
    return {
      name: 'Unknown Item',
      type: ItemType.Material,
      description: 'A mysterious item.',
      rarity: 'Common',
    };
  }

  // 验证物品类型是否为有效的 ItemType（常量池中的类型应该是正确的）
  const itemType = Object.values(ItemType).includes(selectedItem.type as ItemType)
    ? (selectedItem.type as ItemType)
    : ItemType.Material; // 如果类型无效，默认为材料

  // 构建返回的物品对象（直接使用常量池中的数据，不需要推断）
  const result: AdventureResult['itemObtained'] = {
    name: selectedItem.name,
    type: itemType,
    description: selectedItem.description || 'A mysterious item.',
    rarity: selectedItem.rarity || 'Common',
  };

  // 添加效果（常量池中的效果已经是正确的）
  if (selectedItem.effect && typeof selectedItem.effect === 'object') {
    result.effect = selectedItem.effect;
  }

  if (selectedItem.permanentEffect && typeof selectedItem.permanentEffect === 'object') {
    result.permanentEffect = selectedItem.permanentEffect;
  }

  // 如果草药或丹药没有效果，尝试从丹药定义中获取
  if ((itemType === ItemType.Herb || itemType === ItemType.Pill) &&
    !result.effect && !result.permanentEffect) {
    const pillDef = getPillDefinition(selectedItem.name);
    if (pillDef) {
      if (pillDef.effect) {
        result.effect = pillDef.effect;
      }
      if (pillDef.permanentEffect) {
        result.permanentEffect = pillDef.permanentEffect;
      }
    }
  }

  // 添加装备相关属性（常量池中的装备信息应该是正确的）
  if (selectedItem.isEquippable) {
    result.isEquippable = true;
    if (selectedItem.equipmentSlot) {
      // 验证 equipmentSlot 是否为有效的 EquipmentSlot
      const validSlots = Object.values(EquipmentSlot);
      if (validSlots.includes(selectedItem.equipmentSlot as EquipmentSlot)) {
        result.equipmentSlot = selectedItem.equipmentSlot as EquipmentSlot;
      }
    }
  }

  // 添加进阶物品相关属性（如果物品是进阶物品）
  if (itemType === ItemType.AdvancedItem) {
    if ((selectedItem as any).advancedItemType) {
      result.advancedItemType = (selectedItem as any).advancedItemType;
    }
    if ((selectedItem as any).advancedItemId) {
      result.advancedItemId = (selectedItem as any).advancedItemId;
    }
  }

  // 测试环境验证物品数据
  if (import.meta.env.DEV) {
    // 验证物品类型和稀有度的匹配
    const typeRarityValid = result.type && result.rarity;
    if (!typeRarityValid) {
      logger.warn('【Item Validation Warning】Missing item type or rarity:', {
        name: result.name,
        type: result.type,
        rarity: result.rarity,
      });
    }

    // 验证装备物品必须有槽位
    if (result.isEquippable && !result.equipmentSlot) {
      logger.warn('【Item Validation Warning】Equippable item missing slot:', {
        name: result.name,
        type: result.type,
      });
    }

    // 验证草药和丹药必须有 effect 或 permanentEffect
    // 如果仍然没有效果，提供默认效果（避免警告，但记录日志）
    if ((result.type === ItemType.Herb || result.type === ItemType.Pill) &&
      !result.effect && !result.permanentEffect) {
      // 为草药和丹药提供默认效果，避免游戏逻辑错误
      if (result.type === ItemType.Herb) {
        result.effect = { hp: 50, exp: 10 };
        result.permanentEffect = { spirit: 1 };
      } else if (result.type === ItemType.Pill) {
        result.effect = { exp: 50 };
        result.permanentEffect = { spirit: 1 };
      }

      // Only log warnings in dev environment, production uses default effect
      if (process.env.NODE_ENV === 'development') {
        logger.warn('【Item Validation Warning】Herb or Pill missing effect, default effect used:', {
          name: result.name,
          type: result.type,
        });
      }
    }
  }

  return result;
}

/**
 * 初始化事件模板库（同步版本，用于直接生成）
 */
export function initializeEventTemplateLibrary(): void {
  if (eventTemplateLibrary.length === 0 && !isInitialized) {
    eventTemplateLibrary = generateEventTemplateLibrary();
    isInitialized = true;
  }
}

/**
 * 从外部设置事件模板库（用于从 IndexedDB 加载）
 */
export function setEventTemplateLibrary(templates: AdventureEventTemplate[]): void {
  eventTemplateLibrary = templates;
  isInitialized = true;
}

/**
 * 获取当前事件模板库
 */
export function getEventTemplateLibrary(): AdventureEventTemplate[] {
  return eventTemplateLibrary;
}

/**
 * 检查事件模板库是否已初始化
 */
export function isEventTemplateLibraryInitialized(): boolean {
  return isInitialized && eventTemplateLibrary.length > 0;
}

/**
 * 从模板库中随机获取一个事件模板
 * 根据玩家境界调整事件类型和风险等级的分布
 */
export function getRandomEventTemplate(
  adventureType: AdventureType = 'normal',
  riskLevel?: 'Low' | 'Medium' | 'High' | 'Extremely Dangerous',
  playerRealm?: RealmType,
  playerRealmLevel?: number
): AdventureEventTemplate | null {
  if (eventTemplateLibrary.length === 0) {
    initializeEventTemplateLibrary();
  }

  // 计算玩家境界指数（0-6，对应7个境界）
  const realmIndex = playerRealm ? REALM_ORDER.indexOf(playerRealm) : 0;
  const validRealmIndex = realmIndex >= 0 ? realmIndex : 0;
  const realmLevel = playerRealmLevel || 1;

  // 境界进度：0.0（最低）到 1.0（最高）
  // 考虑境界和境界等级，最高境界9层时接近1.0
  const realmProgress = (validRealmIndex + (realmLevel - 1) / 9) / REALM_ORDER.length;

  // 根据类型和风险等级筛选
  let filtered = eventTemplateLibrary.filter(t => t.adventureType === adventureType);

  // 根据玩家境界过滤特殊事件
  if (playerRealm) {
    const spiritSeveringIndex = REALM_ORDER.indexOf(RealmType.SpiritSevering);
    const longevityRealmIndex = REALM_ORDER.indexOf(RealmType.LongevityRealm);
    const currentRealmIndex = REALM_ORDER.indexOf(playerRealm);

    filtered = filtered.filter(template => {
      // Heaven Earth Soul events: only allowed for Spirit Severing and above
      if (template.heavenEarthSoulEncounter) {
        return currentRealmIndex >= spiritSeveringIndex;
      }

      // Longevity Rule events: only allowed for Longevity Realm
      if (template.longevityRuleObtained) {
        return currentRealmIndex >= longevityRealmIndex;
      }

      // Other events are not restricted
      return true;
    });
  }

  // If risk level is specified (Secret Realm exploration), adjust risk level distribution
  if (riskLevel && adventureType === 'secret_realm') {
    filtered = filtered.filter(t => t.riskLevel === riskLevel);
  } else if (adventureType === 'secret_realm' && !riskLevel) {
    // If no risk level is specified, adjust risk level distribution based on realm
    // Higher realm players are more likely to encounter high-risk events
    const riskWeights = {
      Low: Math.max(0.25, 1.0 - realmProgress * 1.5),      // Low realm: high probability, High realm: low probability
      Medium: 1.0 - realmProgress * 0.5,                      // Medium probability
      High: 0.3 + realmProgress * 0.7,                      // High realm: high probability
      'Extremely Dangerous': Math.min(0.8, realmProgress * 1.2),       // Only high realm players are likely to encounter
    };

    // Randomly select risk level based on weights
    const totalWeight = Object.values(riskWeights).reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    let selectedRiskLevel: 'Low' | 'Medium' | 'High' | 'Extremely Dangerous' = 'Low';

    for (const [level, weight] of Object.entries(riskWeights)) {
      random -= weight;
      if (random <= 0) {
        selectedRiskLevel = level as 'Low' | 'Medium' | 'High' | 'Extremely Dangerous';
        break;
      }
    }

    filtered = filtered.filter(t => t.riskLevel === selectedRiskLevel);
  }

  // If type is normal, adjust event type distribution based on realm
  // Higher realm players are more likely to encounter high-value events (lucky, secret realm, sect challenge)
  if (adventureType === 'normal' && filtered.length > 0) {
    // Adjust filtering weights based on realm
    // High realm players: more high-value events (lucky, secret realm, sect challenge)
    // Low realm players: more normal events

    const valueWeights = filtered.map(template => {
      // Calculate weight based on event value and rarity
      let weight = 1.0;

      // Check for rare items
      const hasRareItem = template.itemObtained || (template.itemsObtained && template.itemsObtained.length > 0);
      if (hasRareItem) {
        const itemRarity = template.itemObtained?.rarity || template.itemsObtained?.[0]?.rarity || 'Common';
        if (itemRarity === 'Mythic') weight *= 0.1 + realmProgress * 2.0; // Higher realm: more likely
        else if (itemRarity === 'Legendary') weight *= 0.3 + realmProgress * 1.5;
        else if (itemRarity === 'Rare') weight *= 0.5 + realmProgress * 1.0;
        else weight *= 1.0 - realmProgress * 0.3; // Common items, lower probability for high realm
      }

      // Check reward values (high rewards are more suitable for high realms)
      const totalReward = Math.abs(template.expChange) + Math.abs(template.spiritStonesChange);
      if (totalReward > 500) {
        weight *= 0.2 + realmProgress * 1.5; // High rewards, more likely for high realm
      } else if (totalReward > 200) {
        weight *= 0.5 + realmProgress * 1.0;
      } else {
        weight *= 1.0 - realmProgress * 0.3; // Low rewards, lower probability for high realm
      }

      // Check for special rewards (pets, etc.)
      if (template.petObtained) {
        weight *= 0.3 + realmProgress * 1.2;
      }

      return { template, weight };
    });

    // Randomly select based on weights
    const totalWeight = valueWeights.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;

    for (const { template, weight } of valueWeights) {
      random -= weight;
      if (random <= 0) {
        return template;
      }
    }

    // If weighted selection fails, use random selection
    return filtered[Math.floor(Math.random() * filtered.length)];
  }

  if (filtered.length === 0) {
    // If no match, return any event of the same type
    filtered = eventTemplateLibrary.filter(t => t.adventureType === adventureType);
  }

  if (filtered.length === 0) {
    // If still no match, return any event
    filtered = eventTemplateLibrary;
  }

  if (filtered.length === 0) {
    return null;
  }

  return filtered[Math.floor(Math.random() * filtered.length)];
}

/**
 * Adjust item rarity based on realm
 * Higher realm players are more likely to obtain rare items
 * @param baseRarity Base rarity
 * @param realm Player's realm
 * @param realmLevel Realm level
 * @param itemSeed Item seed (for deterministic randomness)
 * @returns Adjusted rarity
 */
function adjustRarityByRealm(
  baseRarity: ItemRarity,
  realm: RealmType,
  realmLevel: number,
  itemSeed: number = 0
): ItemRarity {
  const realmIndex = REALM_ORDER.indexOf(realm);
  const validRealmIndex = realmIndex >= 0 ? realmIndex : 0;

  // Calculate realm progress (0.0 to 1.0)
  // Considering realm and realm level, close to 1.0 at max realm level 9
  const realmProgress = (validRealmIndex + (realmLevel - 1) / 9) / REALM_ORDER.length;

  // Rarity order
  const rarityOrder: ItemRarity[] = ['Common', 'Rare', 'Legendary', 'Mythic'];
  const currentRarityIndex = rarityOrder.indexOf(baseRarity);

  // If already highest rarity, do not upgrade
  if (currentRarityIndex >= rarityOrder.length - 1) {
    return baseRarity;
  }

  // 根据境界进度计算稀有度提升概率
  // 基础概率：低境界5%，高境界40%
  const baseUpgradeChance = 0.05 + realmProgress * 0.35;

  // 使用确定性随机数（基于境界、等级和物品种子）
  const randomSeed = validRealmIndex * 1000 + realmLevel * 100 + itemSeed;
  const randomValue = seededRandom(randomSeed);

  // 计算升级概率（考虑当前稀有度）
  // 普通->稀有：基础概率
  // 稀有->传说：基础概率 * 0.8
  // 传说->仙品：基础概率 * 0.5
  const rarityMultipliers = [1.0, 0.8, 0.5];
  const upgradeChance = baseUpgradeChance * (rarityMultipliers[currentRarityIndex] || 0.3);

  if (randomValue < upgradeChance) {
    // 升级到下一个稀有度
    return rarityOrder[currentRarityIndex + 1];
  } else if (randomValue < upgradeChance * 0.2 && currentRarityIndex < rarityOrder.length - 2) {
    // 小概率（20%的升级概率）直接升级两级（仅对普通和稀有）
    return rarityOrder[currentRarityIndex + 2];
  }

  // 保持原稀有度
  return baseRarity;
}

/**
 * 将模板转换为AdventureResult（根据玩家境界调整数值）
 */
export function templateToAdventureResult(
  template: AdventureEventTemplate,
  player: { realm: RealmType; realmLevel: number; maxHp: number }
): AdventureResult {
  // 计算境界倍数
  const realmIndex = REALM_ORDER.indexOf(player.realm);
  const realmBaseMultipliers = [1, 2, 4, 8, 16, 32, 64];
  const realmBaseMultiplier = realmBaseMultipliers[realmIndex] || 1;
  const levelMultiplier = 1 + (player.realmLevel - 1) * 0.3;
  const realmMultiplier = realmBaseMultiplier * levelMultiplier;

  // 调整数值
  const result: AdventureResult = {
    story: template.story,
    hpChange: Math.floor(template.hpChange * realmMultiplier),
    expChange: Math.floor(template.expChange * realmMultiplier),
    spiritStonesChange: Math.floor(template.spiritStonesChange * realmMultiplier),
    eventColor: template.eventColor,
    adventureType: template.adventureType, // 传递adventureType，用于判断是否需要触发战斗
  };

  // 确保hpChange不超过maxHp的50%
  const maxHpChange = Math.floor(player.maxHp * 0.5);
  if (Math.abs(result.hpChange) > maxHpChange) {
    result.hpChange = result.hpChange > 0 ? maxHpChange : -maxHpChange;
  }

  // 根据境界调整物品稀有度
  if (template.itemObtained !== undefined) {
    // 使用物品名称和类型作为种子，确保相同物品的稀有度调整是确定的
    const itemSeed = template.itemObtained.name.length * 100 + template.itemObtained.type.length;
    const adjustedRarity = adjustRarityByRealm(
      template.itemObtained.rarity as ItemRarity,
      player.realm,
      player.realmLevel,
      itemSeed
    );

    // 如果稀有度提升了，尝试找到相同类型但更高稀有度的物品
    // 如果找不到，保持原物品但提升稀有度（属性会在后续处理中调整）
    if (adjustedRarity !== template.itemObtained.rarity) {
      // 尝试从常量池中找到相同类型但更高稀有度的物品
      const allItems = getAllItemsFromConstants();
      const sameTypeItems = allItems.filter(
        item => item.type === template.itemObtained!.type && item.rarity === adjustedRarity
      );

      if (sameTypeItems.length > 0) {
        // 找到相同类型的高稀有度物品，使用它
        const selectedItem = selectFromArray(sameTypeItems, itemSeed);
        result.itemObtained = {
          name: selectedItem.name,
          type: selectedItem.type as ItemType,
          description: selectedItem.description,
          rarity: adjustedRarity,
          effect: selectedItem.effect,
          permanentEffect: selectedItem.permanentEffect,
          isEquippable: selectedItem.isEquippable,
          equipmentSlot: selectedItem.equipmentSlot as EquipmentSlot | undefined,
          // 保留进阶物品相关字段
          advancedItemType: template.itemObtained.advancedItemType,
          advancedItemId: template.itemObtained.advancedItemId,
        };
      } else {
        // 找不到相同类型的高稀有度物品，保持原物品但提升稀有度
        result.itemObtained = {
          ...template.itemObtained,
          rarity: adjustedRarity,
        };
      }
    } else {
      result.itemObtained = template.itemObtained;
    }

    // 对丹药和草药的效果根据境界倍数进行调整（提高属性值）
    if (result.itemObtained && (result.itemObtained.type === ItemType.Pill || result.itemObtained.type === ItemType.Herb)) {
      const adjustedEffect = result.itemObtained.effect ? { ...result.itemObtained.effect } : undefined;
      const adjustedPermanentEffect = result.itemObtained.permanentEffect ? { ...result.itemObtained.permanentEffect } : undefined;

      // 调整临时效果（effect）
      if (adjustedEffect) {
        // 使用较大的倍数调整（境界倍数 * 2，使丹药效果更明显）
        const pillEffectMultiplier = realmMultiplier * 2;
        if (adjustedEffect.exp !== undefined) adjustedEffect.exp = Math.floor(adjustedEffect.exp * pillEffectMultiplier);
        if (adjustedEffect.hp !== undefined) adjustedEffect.hp = Math.floor(adjustedEffect.hp * pillEffectMultiplier);
        if (adjustedEffect.attack !== undefined) adjustedEffect.attack = Math.floor(adjustedEffect.attack * pillEffectMultiplier);
        if (adjustedEffect.defense !== undefined) adjustedEffect.defense = Math.floor(adjustedEffect.defense * pillEffectMultiplier);
        if (adjustedEffect.spirit !== undefined) adjustedEffect.spirit = Math.floor(adjustedEffect.spirit * pillEffectMultiplier);
        if (adjustedEffect.physique !== undefined) adjustedEffect.physique = Math.floor(adjustedEffect.physique * pillEffectMultiplier);
        if (adjustedEffect.speed !== undefined) adjustedEffect.speed = Math.floor(adjustedEffect.speed * pillEffectMultiplier);
      }

      // 调整永久效果（permanentEffect）
      if (adjustedPermanentEffect) {
        // 使用较大的倍数调整（境界倍数 * 1.5，永久效果略小一些）
        const pillPermanentMultiplier = realmMultiplier * 1.5;
        if (adjustedPermanentEffect.maxHp !== undefined) adjustedPermanentEffect.maxHp = Math.floor(adjustedPermanentEffect.maxHp * pillPermanentMultiplier);
        if (adjustedPermanentEffect.attack !== undefined) adjustedPermanentEffect.attack = Math.floor(adjustedPermanentEffect.attack * pillPermanentMultiplier);
        if (adjustedPermanentEffect.defense !== undefined) adjustedPermanentEffect.defense = Math.floor(adjustedPermanentEffect.defense * pillPermanentMultiplier);
        if (adjustedPermanentEffect.spirit !== undefined) adjustedPermanentEffect.spirit = Math.floor(adjustedPermanentEffect.spirit * pillPermanentMultiplier);
        if (adjustedPermanentEffect.physique !== undefined) adjustedPermanentEffect.physique = Math.floor(adjustedPermanentEffect.physique * pillPermanentMultiplier);
        if (adjustedPermanentEffect.speed !== undefined) adjustedPermanentEffect.speed = Math.floor(adjustedPermanentEffect.speed * pillPermanentMultiplier);
        if ((adjustedPermanentEffect as any).maxLifespan !== undefined) (adjustedPermanentEffect as any).maxLifespan = Math.floor((adjustedPermanentEffect as any).maxLifespan * pillPermanentMultiplier);
      }

      result.itemObtained.effect = adjustedEffect;
      result.itemObtained.permanentEffect = adjustedPermanentEffect;
    }
  }

  if (template.itemsObtained !== undefined) {
    // 对多个物品也应用稀有度调整
    result.itemsObtained = template.itemsObtained.map((item, index) => {
      const itemSeed = item.name.length * 100 + item.type.length + index * 10;
      const adjustedRarity = adjustRarityByRealm(
        item.rarity as ItemRarity,
        player.realm,
        player.realmLevel,
        itemSeed
      );

      if (adjustedRarity !== item.rarity) {
        // 尝试找到相同类型但更高稀有度的物品
        const allItems = getAllItemsFromConstants();
        const sameTypeItems = allItems.filter(
          i => i.type === item.type && i.rarity === adjustedRarity
        );

        if (sameTypeItems.length > 0) {
          const selectedItem = selectFromArray(sameTypeItems, itemSeed);
          const adjustedItem = {
            name: selectedItem.name,
            type: selectedItem.type as ItemType,
            description: selectedItem.description,
            rarity: adjustedRarity,
            effect: selectedItem.effect,
            permanentEffect: selectedItem.permanentEffect,
            isEquippable: selectedItem.isEquippable,
            equipmentSlot: selectedItem.equipmentSlot as EquipmentSlot | undefined,
          };

          // 对丹药和草药的效果根据境界倍数进行调整
          if (adjustedItem.type === ItemType.Pill || adjustedItem.type === ItemType.Herb) {
            const adjustedEffect = adjustedItem.effect ? { ...adjustedItem.effect } : undefined;
            const adjustedPermanentEffect = adjustedItem.permanentEffect ? { ...adjustedItem.permanentEffect } : undefined;

            if (adjustedEffect) {
              const pillEffectMultiplier = realmMultiplier * 2;
              if (adjustedEffect.exp !== undefined) adjustedEffect.exp = Math.floor(adjustedEffect.exp * pillEffectMultiplier);
              if (adjustedEffect.hp !== undefined) adjustedEffect.hp = Math.floor(adjustedEffect.hp * pillEffectMultiplier);
              if (adjustedEffect.attack !== undefined) adjustedEffect.attack = Math.floor(adjustedEffect.attack * pillEffectMultiplier);
              if (adjustedEffect.defense !== undefined) adjustedEffect.defense = Math.floor(adjustedEffect.defense * pillEffectMultiplier);
              if (adjustedEffect.spirit !== undefined) adjustedEffect.spirit = Math.floor(adjustedEffect.spirit * pillEffectMultiplier);
              if (adjustedEffect.physique !== undefined) adjustedEffect.physique = Math.floor(adjustedEffect.physique * pillEffectMultiplier);
              if (adjustedEffect.speed !== undefined) adjustedEffect.speed = Math.floor(adjustedEffect.speed * pillEffectMultiplier);
            }

            if (adjustedPermanentEffect) {
              const pillPermanentMultiplier = realmMultiplier * 1.5;
              if (adjustedPermanentEffect.maxHp !== undefined) adjustedPermanentEffect.maxHp = Math.floor(adjustedPermanentEffect.maxHp * pillPermanentMultiplier);
              if (adjustedPermanentEffect.attack !== undefined) adjustedPermanentEffect.attack = Math.floor(adjustedPermanentEffect.attack * pillPermanentMultiplier);
              if (adjustedPermanentEffect.defense !== undefined) adjustedPermanentEffect.defense = Math.floor(adjustedPermanentEffect.defense * pillPermanentMultiplier);
              if (adjustedPermanentEffect.spirit !== undefined) adjustedPermanentEffect.spirit = Math.floor(adjustedPermanentEffect.spirit * pillPermanentMultiplier);
              if (adjustedPermanentEffect.physique !== undefined) adjustedPermanentEffect.physique = Math.floor(adjustedPermanentEffect.physique * pillPermanentMultiplier);
              if (adjustedPermanentEffect.speed !== undefined) adjustedPermanentEffect.speed = Math.floor(adjustedPermanentEffect.speed * pillPermanentMultiplier);
              if ((adjustedPermanentEffect as any).maxLifespan !== undefined) (adjustedPermanentEffect as any).maxLifespan = Math.floor((adjustedPermanentEffect as any).maxLifespan * pillPermanentMultiplier);
            }

            adjustedItem.effect = adjustedEffect;
            adjustedItem.permanentEffect = adjustedPermanentEffect;
          }

          return adjustedItem;
        } else {
          // 保持原物品但提升稀有度
          const adjustedItem = {
            ...item,
            rarity: adjustedRarity,
          };

          // 对丹药和草药的效果根据境界倍数进行调整
          if (adjustedItem.type === ItemType.Pill || adjustedItem.type === ItemType.Herb) {
            const adjustedEffect = adjustedItem.effect ? { ...adjustedItem.effect } : undefined;
            const adjustedPermanentEffect = adjustedItem.permanentEffect ? { ...adjustedItem.permanentEffect } : undefined;

            if (adjustedEffect) {
              const pillEffectMultiplier = realmMultiplier * 2;
              if (adjustedEffect.exp !== undefined) adjustedEffect.exp = Math.floor(adjustedEffect.exp * pillEffectMultiplier);
              if (adjustedEffect.hp !== undefined) adjustedEffect.hp = Math.floor(adjustedEffect.hp * pillEffectMultiplier);
              if (adjustedEffect.attack !== undefined) adjustedEffect.attack = Math.floor(adjustedEffect.attack * pillEffectMultiplier);
              if (adjustedEffect.defense !== undefined) adjustedEffect.defense = Math.floor(adjustedEffect.defense * pillEffectMultiplier);
              if (adjustedEffect.spirit !== undefined) adjustedEffect.spirit = Math.floor(adjustedEffect.spirit * pillEffectMultiplier);
              if (adjustedEffect.physique !== undefined) adjustedEffect.physique = Math.floor(adjustedEffect.physique * pillEffectMultiplier);
              if (adjustedEffect.speed !== undefined) adjustedEffect.speed = Math.floor(adjustedEffect.speed * pillEffectMultiplier);
            }

            if (adjustedPermanentEffect) {
              const pillPermanentMultiplier = realmMultiplier * 1.5;
              if (adjustedPermanentEffect.maxHp !== undefined) adjustedPermanentEffect.maxHp = Math.floor(adjustedPermanentEffect.maxHp * pillPermanentMultiplier);
              if (adjustedPermanentEffect.attack !== undefined) adjustedPermanentEffect.attack = Math.floor(adjustedPermanentEffect.attack * pillPermanentMultiplier);
              if (adjustedPermanentEffect.defense !== undefined) adjustedPermanentEffect.defense = Math.floor(adjustedPermanentEffect.defense * pillPermanentMultiplier);
              if (adjustedPermanentEffect.spirit !== undefined) adjustedPermanentEffect.spirit = Math.floor(adjustedPermanentEffect.spirit * pillPermanentMultiplier);
              if (adjustedPermanentEffect.physique !== undefined) adjustedPermanentEffect.physique = Math.floor(adjustedPermanentEffect.physique * pillPermanentMultiplier);
              if (adjustedPermanentEffect.speed !== undefined) adjustedPermanentEffect.speed = Math.floor(adjustedPermanentEffect.speed * pillPermanentMultiplier);
              if ((adjustedPermanentEffect as any).maxLifespan !== undefined) (adjustedPermanentEffect as any).maxLifespan = Math.floor((adjustedPermanentEffect as any).maxLifespan * pillPermanentMultiplier);
            }

            adjustedItem.effect = adjustedEffect;
            adjustedItem.permanentEffect = adjustedPermanentEffect;
          }

          return adjustedItem;
        }
      }

      // 对原始物品也应用倍数调整（如果是丹药或草药）
      if (item.type === ItemType.Pill || item.type === ItemType.Herb) {
        const adjustedEffect = item.effect ? { ...item.effect } : undefined;
        const adjustedPermanentEffect = item.permanentEffect ? { ...item.permanentEffect } : undefined;

        if (adjustedEffect) {
          const pillEffectMultiplier = realmMultiplier * 2;
          if (adjustedEffect.exp !== undefined) adjustedEffect.exp = Math.floor(adjustedEffect.exp * pillEffectMultiplier);
          if (adjustedEffect.hp !== undefined) adjustedEffect.hp = Math.floor(adjustedEffect.hp * pillEffectMultiplier);
          if (adjustedEffect.attack !== undefined) adjustedEffect.attack = Math.floor(adjustedEffect.attack * pillEffectMultiplier);
          if (adjustedEffect.defense !== undefined) adjustedEffect.defense = Math.floor(adjustedEffect.defense * pillEffectMultiplier);
          if (adjustedEffect.spirit !== undefined) adjustedEffect.spirit = Math.floor(adjustedEffect.spirit * pillEffectMultiplier);
          if (adjustedEffect.physique !== undefined) adjustedEffect.physique = Math.floor(adjustedEffect.physique * pillEffectMultiplier);
          if (adjustedEffect.speed !== undefined) adjustedEffect.speed = Math.floor(adjustedEffect.speed * pillEffectMultiplier);
        }

        if (adjustedPermanentEffect) {
          const pillPermanentMultiplier = realmMultiplier * 1.5;
          if (adjustedPermanentEffect.maxHp !== undefined) adjustedPermanentEffect.maxHp = Math.floor(adjustedPermanentEffect.maxHp * pillPermanentMultiplier);
          if (adjustedPermanentEffect.attack !== undefined) adjustedPermanentEffect.attack = Math.floor(adjustedPermanentEffect.attack * pillPermanentMultiplier);
          if (adjustedPermanentEffect.defense !== undefined) adjustedPermanentEffect.defense = Math.floor(adjustedPermanentEffect.defense * pillPermanentMultiplier);
          if (adjustedPermanentEffect.spirit !== undefined) adjustedPermanentEffect.spirit = Math.floor(adjustedPermanentEffect.spirit * pillPermanentMultiplier);
          if (adjustedPermanentEffect.physique !== undefined) adjustedPermanentEffect.physique = Math.floor(adjustedPermanentEffect.physique * pillPermanentMultiplier);
          if (adjustedPermanentEffect.speed !== undefined) adjustedPermanentEffect.speed = Math.floor(adjustedPermanentEffect.speed * pillPermanentMultiplier);
          if ((adjustedPermanentEffect as any).maxLifespan !== undefined) (adjustedPermanentEffect as any).maxLifespan = Math.floor((adjustedPermanentEffect as any).maxLifespan * pillPermanentMultiplier);
        }

        return {
          ...item,
          effect: adjustedEffect,
          permanentEffect: adjustedPermanentEffect,
        };
      }

      return item;
    });
  }
  if (template.petObtained !== undefined) result.petObtained = template.petObtained;
  if (template.petOpportunity !== undefined) result.petOpportunity = template.petOpportunity;
  if (template.attributeReduction !== undefined) result.attributeReduction = template.attributeReduction;
  if (template.reputationChange !== undefined) result.reputationChange = template.reputationChange;
  if (template.reputationEvent !== undefined) result.reputationEvent = template.reputationEvent;
  if (template.inheritanceLevelChange !== undefined) result.inheritanceLevelChange = template.inheritanceLevelChange;
  if (template.triggerSecretRealm !== undefined) result.triggerSecretRealm = template.triggerSecretRealm;
  if (template.spiritualRootsChange !== undefined) result.spiritualRootsChange = template.spiritualRootsChange;
  if (template.lifespanChange !== undefined) result.lifespanChange = template.lifespanChange;
  if (template.lotteryTicketsChange !== undefined) result.lotteryTicketsChange = template.lotteryTicketsChange;
  if (template.longevityRuleObtained !== undefined) result.longevityRuleObtained = template.longevityRuleObtained;
  if (template.heavenEarthSoulEncounter !== undefined) result.heavenEarthSoulEncounter = template.heavenEarthSoulEncounter;
  if (template.adventureType !== undefined) result.adventureType = template.adventureType;

  // 测试环境打印事件模板返回结果
  if (import.meta.env.DEV) {
    logger.log('=== 事件模板返回结果 ===');
    logger.log('【模板信息】');
    logger.log('  事件类型:', template.adventureType);
    logger.log('  风险等级:', template.riskLevel || '无');
    logger.log('  事件描述:', template.story);
    logger.log('  原始数值:', {
      hpChange: template.hpChange,
      expChange: template.expChange,
      spiritStonesChange: template.spiritStonesChange,
    });
    logger.log('【玩家信息】');
    logger.log('  境界:', player.realm);
    logger.log('  境界等级:', player.realmLevel);
    logger.log('  最大气血:', player.maxHp);
    logger.log('  境界倍数:', realmMultiplier.toFixed(2));
    logger.log('【转换结果】');
    logger.log('  事件描述:', result.story);
    logger.log('  气血变化:', result.hpChange);
    logger.log('  修为变化:', result.expChange);
    logger.log('  灵石变化:', result.spiritStonesChange);
    logger.log('  事件颜色:', result.eventColor);
    if (result.itemObtained) {
      logger.log('  获得物品:', {
        name: result.itemObtained.name,
        type: result.itemObtained.type,
        rarity: result.itemObtained.rarity,
      });
    }
    if (result.itemsObtained && result.itemsObtained.length > 0) {
      logger.log('  获得多个物品:', result.itemsObtained.map(item => ({
        name: item.name,
        type: item.type,
        rarity: item.rarity,
      })));
    }
    if (result.petObtained) {
      logger.log('  获得灵宠:', result.petObtained);
    }
    if (result.petOpportunity) {
      logger.log('  灵宠机缘:', result.petOpportunity);
    }
    if (result.attributeReduction) {
      logger.log('  属性降低:', result.attributeReduction);
    }
    if (result.reputationChange) {
      logger.log('  声望变化:', result.reputationChange);
    }
    if (result.reputationEvent) {
      logger.log('  声望事件:', result.reputationEvent);
    }
    if (result.inheritanceLevelChange) {
      logger.log('  传承等级变化:', result.inheritanceLevelChange);
    }
    if (result.triggerSecretRealm) {
      logger.log('  触发秘境:', result.triggerSecretRealm);
    }
    if (result.spiritualRootsChange) {
      logger.log('  灵根变化:', result.spiritualRootsChange);
    }
    if (result.lifespanChange) {
      logger.log('  寿命变化:', result.lifespanChange);
    }
    if (result.lotteryTicketsChange) {
      logger.log('  抽奖券变化:', result.lotteryTicketsChange);
    }
    logger.log('======================');
  }

  return result;
}

