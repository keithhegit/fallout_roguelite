import { SecretRealm, RealmType, Item, ItemType, EquipmentSlot } from '../types';
import { REALM_ORDER, SectInfo, SectGrade, getPillDefinition } from '../constants/index';
import { getItemFromConstants } from '../utils/itemConstantsUtils';

const randomId = () => Math.random().toString(36).slice(2, 9);

// 秘境名称池 - 按风险等级分类
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

// 秘境描述池 - 按风险等级分类
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

// 掉落物池
const DROP_ITEMS = [
  '妖兽材料',
  '稀有草药',
  '攻击法器',
  '剑修功法',
  '残破灵宝',
  '剑意草',
  '雷属性至宝',
  '仙品丹药材料',
  '天阶功法',
  '上古遗物',
  '灵兽内丹',
  '炼器材料',
  '符箓',
  '阵法图',
  '传承玉简',
  '仙草',
  '灵矿',
  '法宝碎片',
];

// 宗门名称和描述绑定池（名称和描述一一对应）
const SECT_DATA: Array<{ name: string; description: string }> = [
  { name: '云灵宗', description: '正道大宗，门风清正，适合大部分修士。' },
  { name: '烈阳宗', description: '坐落于火山之上，专修火法，行事霸道。' },
  { name: '万剑门', description: '一剑破万法。门徒皆为剑痴，攻击力极强。' },
  { name: '天音寺', description: '佛门圣地，慈悲为怀，防御力出众。' },
  { name: '太虚观', description: '道门正统，修炼速度极快。' },
  { name: '血魔宗', description: '魔道宗门，行事狠辣，但实力强大。' },
  { name: '青莲剑派', description: '剑修圣地，剑法精妙。' },
  { name: '玄天宗', description: '正道大宗，底蕴深厚。' },
  { name: '九幽门', description: '魔道宗门，阴险狡诈。' },
  { name: '星辰阁', description: '神秘组织，掌握星辰之力。' },
  { name: '龙族圣地', description: '龙族后裔建立的宗门，血脉强大。' },
  { name: '凤凰宫', description: '凤凰血脉传承，涅槃重生。' },
  { name: '雷神殿', description: '专修雷法，攻击力极强。' },
  { name: '冰魄宗', description: '冰属性修士的圣地，防御力强。' },
  { name: '毒王谷', description: '毒修聚集地，擅长用毒。' },
  { name: '幻月门', description: '幻术宗门，擅长迷惑敌人。' },
  { name: '金刚寺', description: '体修宗门，肉身强大。' },
  { name: '阴阳教', description: '阴阳调和，攻防兼备。' }
];

// 任务名称池（按类型分类）
const TASK_NAMES_BY_TYPE: Record<TaskType, string[]> = {
  patrol: ['山门巡逻', '宗门巡视', '边界巡查', '治安维护'],
  donate_stone: ['上交灵石', '捐献灵石', '资助宗门'],
  donate_herb: ['上交草药', '捐献灵草', '提供药材'],
  collect: ['收集材料', '采集资源', '收集物资'],
  hunt: ['猎杀妖兽', '除妖任务', '妖兽清剿', '除魔卫道'],
  alchemy: ['炼制丹药', '炼丹任务', '炼制灵丹', '炼制仙丹'],
  forge: ['炼制法宝', '炼器任务', '锻造法器', '炼制灵宝'],
  teach: ['教导弟子', '指导修炼', '传授功法', '培养新人'],
  defend: ['守护宗门', '防御任务', '宗门守卫', '护山大阵'],
  explore: ['探索遗迹', '遗迹探索', '古墓探索', '秘境探索'],
  trade: ['贸易任务', '护送商队', '交易任务', '商业往来'],
  research: ['研究功法', '功法研究', '参悟心法', '钻研道法'],
  cultivate: ['培育灵草', '种植灵药', '培育仙草', '灵田管理'],
  maintain: ['维护阵法', '修复法阵', '阵法维护', '护山大阵维护'],
  diplomacy: ['外交任务', '宗门交流', '友好往来', '结盟任务'],
  trial: ['试炼任务', '宗门试炼', '考验任务', '历练任务'],
  rescue: ['救援任务', '营救同门', '救援行动', '紧急救援'],
  investigate: ['调查任务', '情报收集', '探查任务', '侦查任务'],
  battle: ['宗门比武', '挑战同门', '切磋交流', '实力证明'],
  treasure_hunt: ['寻宝任务', '寻找遗宝', '探宝行动', '寻获机缘'],
  escort: ['护送要人', '护送长老', '护送物资', '护送任务'],
  assassination: ['暗杀任务', '清除威胁', '秘密行动', '刺杀目标'],
  artifact_repair: ['修复法宝', '重铸法器', '法宝维护', '法器修复'],
  spirit_beast: ['驯服灵兽', '捕捉妖兽', '灵兽契约', '收服坐骑'],
  sect_war: ['宗门战争', '征伐任务', '攻伐行动', '战争任务'],
  inheritance: ['传承试炼', '接受传承', '传承考验', '获得传承'],
  tribulation: ['渡劫护法', '天劫试炼', '渡劫任务', '天劫考验'],
  alchemy_master: ['炼丹大师', '炼制仙丹', '丹道考验', '炼丹宗师'],
};

// 任务描述池（按类型分类）
const TASK_DESCRIPTIONS_BY_TYPE: Record<TaskType, string[]> = {
  patrol: [
    '在宗门附近巡视，驱逐野兽，维护治安。',
    '巡查宗门边界，确保安全。',
    '维护宗门周边的秩序。',
  ],
  donate_stone: [
    '为宗门捐献灵石，支持宗门发展。',
    '上交灵石以换取贡献。',
    '资助宗门的日常运营。',
  ],
  donate_herb: [
    '为宗门提供草药，支持炼丹。',
    '上交收集的灵草，换取贡献。',
    '捐献药材以支持宗门炼丹。',
  ],
  collect: [
    '收集宗门需要的炼器材料。',
    '前往指定地点采集资源。',
    '收集任务所需的物资。',
  ],
  hunt: [
    '猎杀威胁宗门安全的妖兽。',
    '清除宗门附近的妖兽威胁。',
    '执行除妖任务，维护宗门安全。',
  ],
  alchemy: [
    '为宗门炼制指定丹药，需要丹方和材料。',
    '使用宗门提供的材料炼制丹药。',
    '炼制高级丹药，需要一定的炼丹造诣。',
  ],
  forge: [
    '为宗门炼制法宝，需要炼器材料。',
    '使用珍贵材料锻造法器。',
    '炼制强大的法宝，需要炼器技能。',
  ],
  teach: [
    '指导新入门的弟子修炼，需要一定境界。',
    '传授修炼心得，培养新人。',
    '为弟子答疑解惑，指导修炼。',
  ],
  defend: [
    '守护宗门，抵御外敌入侵，可能触发战斗。',
    '参与宗门防御，保护同门。',
    '守卫宗门要地，防止敌人破坏。',
  ],
  explore: [
    '探索附近的遗迹，寻找宝物，可能获得意外收获。',
    '深入古墓探索，寻找传承。',
    '探索秘境，寻找机缘。',
  ],
  trade: [
    '护送重要物资到指定地点，可能遭遇劫匪。',
    '执行贸易任务，促进宗门交流。',
    '护送商队，确保物资安全。',
  ],
  research: [
    '研究宗门功法，需要时间，可获得修为提升。',
    '参悟心法，提升修炼速度。',
    '钻研道法，加深对修炼的理解。',
  ],
  cultivate: [
    '培育灵草，需要时间，可获得草药奖励。',
    '管理灵田，培育珍稀灵药。',
    '种植仙草，需要耐心和技巧。',
  ],
  maintain: [
    '维护宗门的护山大阵，需要材料。',
    '修复损坏的阵法，确保宗门安全。',
    '维护防御法阵，需要阵法知识。',
  ],
  diplomacy: [
    '执行外交任务，需要高境界，可能获得特殊奖励。',
    '代表宗门与其他势力交流。',
    '促进宗门间的友好关系。',
  ],
  trial: [
    '参加宗门试炼，高风险高回报。',
    '接受宗门考验，证明实力。',
    '完成试炼任务，获得丰厚奖励。',
  ],
  rescue: [
    '救援遇险的同门，可能遭遇战斗。',
    '执行紧急救援任务。',
    '营救被困的宗门弟子。',
  ],
  investigate: [
    '调查异常情况，需要强大的神识。',
    '收集情报，探查敌情。',
    '侦查任务，需要谨慎和智慧。',
  ],
  battle: [
    '与同门切磋，提升实战能力，可能获得战斗经验。',
    '参加宗门比武，证明自己的实力。',
    '挑战同门高手，检验修炼成果。',
  ],
  treasure_hunt: [
    '寻找传说中的宝物，需要运气和实力，可能获得稀有物品。',
    '探索未知区域，寻找遗落的宝物。',
    '根据线索寻找珍贵物品，考验智慧和运气。',
  ],
  escort: [
    '护送重要人物或物资，可能遭遇敌人袭击。',
    '护送宗门长老前往目的地，责任重大。',
    '护送珍贵物资，确保安全送达。',
  ],
  assassination: [
    '执行秘密刺杀任务，需要强大的实力和隐蔽能力。',
    '清除对宗门有威胁的目标，高风险高回报。',
    '执行暗杀任务，需要谨慎和实力。',
  ],
  artifact_repair: [
    '修复损坏的法宝，需要炼器材料和技能。',
    '重铸破损的法器，恢复其威力。',
    '维护宗门的法宝，确保其正常运转。',
  ],
  spirit_beast: [
    '驯服强大的灵兽，需要实力和耐心，可能获得灵宠。',
    '捕捉妖兽，将其收为坐骑或灵宠。',
    '与灵兽建立契约，获得强大的伙伴。',
  ],
  sect_war: [
    '参与宗门战争，与敌对势力战斗，可能获得大量奖励。',
    '征伐敌对宗门，为宗门开疆拓土。',
    '参与大规模战斗，考验实力和勇气。',
  ],
  inheritance: [
    '接受宗门传承，获得强大的功法和技能。',
    '通过传承试炼，获得前辈的传承。',
    '接受传承考验，证明自己的资质。',
  ],
  tribulation: [
    '为同门护法渡劫，需要强大的实力，可能获得天劫奖励。',
    '参与天劫试炼，获得天劫之力。',
    '协助同门渡劫，获得功德和奖励。',
  ],
  alchemy_master: [
    '炼制传说中的仙丹，需要极高的炼丹造诣，可能获得稀有丹药。',
    '接受炼丹大师的考验，证明炼丹实力。',
    '炼制顶级丹药，考验炼丹技艺。',
  ],
};

// 任务类型配置接口
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

// 物品池定义
const ITEM_POOLS = {
  herbs: ['聚灵草', '紫猴花', '天灵草', '血参', '灵芝'],
  materials: ['炼器石', '妖兽内丹', '灵矿', '符纸', '精铁', '玄铁', '星辰石'],
  alchemy: ['聚灵草', '紫猴花', '天灵草', '血参'],
  forge: ['炼器石', '精铁', '灵矿', '妖兽内丹'],
  maintain: ['炼器石', '符纸', '灵矿'],
  repair: ['炼器石', '精铁', '玄铁', '星辰石'],
  masterAlchemy: ['万年灵乳', '九叶芝草', '龙鳞果', '仙晶'],
};

// 任务类型详细配置
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
      items: [{ name: '聚气丹', quantity: Math.floor(diff * qual) }]
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
      items: [{ name: '聚气丹', quantity: Math.floor((2 + Math.random() * 3) * diff * qual) }]
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
      items: [{ name: '聚灵草', quantity: Math.floor((3 + Math.random() * 5) * diff * qual) }]
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
      items: [{ name: '强化石', quantity: Math.floor((1 + Math.random() * 2) * diff * qual) }]
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

// 任务品质配置
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

// 任务品质类型
export type TaskQuality = 'Common' | 'Rare' | 'Legendary' | 'Mythic';

// 任务类型扩展
export type TaskType =
  | 'patrol'           // 巡逻
  | 'donate_stone'     // 上交灵石
  | 'donate_herb'      // 上交草药
  | 'collect'          // 收集
  | 'hunt'             // 猎杀
  | 'alchemy'          // 炼制丹药
  | 'forge'            // 炼制法宝
  | 'teach'            // 教导弟子
  | 'defend'           // 守护宗门
  | 'explore'          // 探索遗迹
  | 'trade'            // 贸易任务
  | 'research'         // 研究功法
  | 'cultivate'        // 培育灵草
  | 'maintain'         // 维护阵法
  | 'diplomacy'        // 外交任务
  | 'trial'            // 试炼任务
  | 'rescue'           // 救援任务
  | 'investigate'      // 调查任务
  | 'battle'           // 战斗任务（新增）
  | 'treasure_hunt'    // 寻宝任务（新增）
  | 'escort'           // 护送任务（新增）
  | 'assassination'    // 刺杀任务（新增）
  | 'artifact_repair'  // 法宝修复（新增）
  | 'spirit_beast'     // 灵兽驯服（新增）
  | 'sect_war'         // 宗门战争（新增）
  | 'inheritance'      // 传承任务（新增）
  | 'tribulation'      // 渡劫任务（新增）
  | 'alchemy_master';  // 炼丹大师（新增）

export interface RandomSectTask {
  id: string;
  name: string;
  description: string;
  type: TaskType;
  difficulty: 'Easy' | 'Normal' | 'Hard' | 'Extreme'; // 任务难度
  quality: TaskQuality; // 任务品质
  minRealm?: RealmType; // 最低境界要求
  recommendedRealm?: RealmType; // 推荐境界
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
  // 新增字段
  completionBonus?: { // 完美完成奖励
    contribution?: number;
    exp?: number;
    spiritStones?: number;
    items?: { name: string; quantity: number }[];
  };
  specialReward?: { // 特殊奖励（低概率触发）
    type: 'equipment' | 'cultivationArt' | 'rareMaterial' | 'title';
    item?: { name: string; quantity: number };
  };
  requiresCombat?: boolean; // 是否需要战斗
  successRate?: number; // 成功率（0-100），影响是否完美完成
  isDailySpecial?: boolean; // 是否为每日特殊任务
  recommendedFor?: { // 推荐给特定属性的玩家
    highAttack?: boolean; // 高攻击力
    highDefense?: boolean; // 高防御力
    highSpirit?: boolean; // 高神识
    highSpeed?: boolean; // 高速度
  };
  typeBonus?: number; // 任务类型连续完成加成（百分比）
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

// 生成随机秘境
export const generateRandomRealms = (
  playerRealm: RealmType,
  count: number = 6
): SecretRealm[] => {
  const playerRealmIndex = REALM_ORDER.indexOf(playerRealm);
  const realms: SecretRealm[] = [];

  for (let i = 0; i < count; i++) {
    // 随机选择境界要求（不能超过玩家境界太多）
    const maxRealmIndex = Math.min(
      playerRealmIndex + 2,
      REALM_ORDER.length - 1
    );
    const minRealmIndex = Math.max(0, playerRealmIndex - 1);
    const realmIndex =
      Math.floor(Math.random() * (maxRealmIndex - minRealmIndex + 1)) +
      minRealmIndex;
    const minRealm = REALM_ORDER[realmIndex];

    // 随机选择风险等级
    const riskLevels: ('Low' | 'Medium' | 'High' | 'Extreme')[] = [
      'Low',
      'Medium',
      'High',
      'Extreme',
    ];
    const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];

    // 根据风险等级和境界计算成本
    const baseCost = 50 + realmIndex * 50;
    const riskMultiplier =
      riskLevel === '低'
        ? 0.8
        : riskLevel === '中'
          ? 1
          : riskLevel === '高'
            ? 1.5
            : 2;
    const cost = Math.floor(
      baseCost * riskMultiplier * (0.9 + Math.random() * 0.2)
    );

    // 根据风险等级选择对应的名称和描述
    const availableNames = REALM_NAMES_BY_RISK[riskLevel];
    const availableDescriptions = REALM_DESCRIPTIONS_BY_RISK[riskLevel];
    const name = availableNames[Math.floor(Math.random() * availableNames.length)];
    const description = availableDescriptions[Math.floor(Math.random() * availableDescriptions.length)];

    // 随机生成掉落物（2-4个）
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

// 生成随机宗门
export const generateRandomSects = (
  playerRealm: RealmType,
  count: number = 6
): SectInfo[] => {
  const playerRealmIndex = REALM_ORDER.indexOf(playerRealm);
  const sects: SectInfo[] = [];

  for (let i = 0; i < count; i++) {
    // 随机选择境界要求
    const maxRealmIndex = Math.min(
      playerRealmIndex + 1,
      REALM_ORDER.length - 1
    );
    const realmIndex = Math.floor(Math.random() * (maxRealmIndex + 1));
    const reqRealm = REALM_ORDER[realmIndex];

    // 随机选择一个宗门（名称和描述绑定）
    const sectData = SECT_DATA[Math.floor(Math.random() * SECT_DATA.length)];
    const name = sectData.name;
    const description = sectData.description;

    // 根据境界随机分配宗门等级
    const grades: SectGrade[] = ['C', 'B', 'A', 'S'];
    const gradeWeights = [0.4, 0.3, 0.2, 0.1]; // C最多，S最少
    let grade: SectGrade = 'C';
    const rand = Math.random();
    if (rand < gradeWeights[0]) grade = 'C';
    else if (rand < gradeWeights[0] + gradeWeights[1]) grade = 'B';
    else if (rand < gradeWeights[0] + gradeWeights[1] + gradeWeights[2]) grade = 'A';
    else grade = 'S';

    // 根据等级设置退出代价
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
        items: [{ name: '聚灵草', quantity: Math.floor(5 * exitCostMultiplier) }],
      },
    });
  }

  return sects;
};

// 根据玩家境界计算任务收益倍数
const getRealmMultiplier = (playerRealm: RealmType, taskRealm: RealmType): number => {
  const playerIndex = REALM_ORDER.indexOf(playerRealm);
  const taskIndex = REALM_ORDER.indexOf(taskRealm);
  const diff = playerIndex - taskIndex;

  if (diff < -1) return 0.5;      // 境界太低，收益减半
  if (diff === -1) return 0.8;   // 境界略低，收益80%
  if (diff === 0) return 1.0;    // 境界匹配，正常收益
  if (diff === 1) return 0.9;    // 境界略高，收益90%
  return 0.7;                     // 境界太高，收益70%
};

// 根据任务类型和玩家境界确定推荐境界
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

// 生成任务品质
const generateTaskQuality = (): TaskQuality => {
  const rand = Math.random();
  if (rand < 0.6) return '普通';
  if (rand < 0.85) return '稀有';
  if (rand < 0.97) return '传说';
  return '仙品';
};

// 生成随机宗门任务
export const generateRandomSectTasks = (
  playerRank: string,
  playerRealm: RealmType,
  count: number = 3
): RandomSectTask[] => {
  const tasks: RandomSectTask[] = [];

  // 所有任务类型
  const allTaskTypes: TaskType[] = [
    'patrol', 'donate_stone', 'donate_herb', 'collect', 'hunt',
    'alchemy', 'forge', 'teach', 'defend', 'explore',
    'trade', 'research', 'cultivate', 'maintain',
    'diplomacy', 'trial', 'rescue', 'investigate',
    'battle', 'treasure_hunt', 'escort', 'assassination',
    'artifact_repair', 'spirit_beast', 'sect_war', 'inheritance',
    'tribulation', 'alchemy_master',
  ];

  // 根据等级调整奖励基数
  const rankMultiplier =
    playerRank === '外门弟子'
      ? 1
      : playerRank === '内门弟子'
        ? 1.5
        : playerRank === '真传弟子'
          ? 2
          : 3;

  // 难度配置
  const difficulties: Array<'简单' | '普通' | '困难' | '极难'> = ['简单', '普通', '困难', '极难'];

  for (let i = 0; i < count; i++) {
    // 随机选择任务类型
    const type = allTaskTypes[Math.floor(Math.random() * allTaskTypes.length)];

    // 从对应类型的名称和描述池中选择
    const names = TASK_NAMES_BY_TYPE[type];
    const descriptions = TASK_DESCRIPTIONS_BY_TYPE[type];
    let name = names[Math.floor(Math.random() * names.length)];
    const description = descriptions[Math.floor(Math.random() * descriptions.length)];

    // 生成任务品质
    const quality = generateTaskQuality();
    const qualityConfig = TASK_QUALITY_CONFIG[quality];

    // 确定推荐境界
    const recommendedRealm = getRecommendedRealm(type, playerRealm);
    const minRealm = recommendedRealm; // 最低境界等于推荐境界

    // 随机选择难度
    const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    const difficultyMultiplier = {
      '简单': 0.7,
      '普通': 1.0,
      '困难': 1.5,
      '极难': 2.5,
    }[difficulty];

    // 计算境界收益倍数
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

    // 使用 TASK_TYPE_CONFIGS 配置来生成奖励和消耗，避免重复代码
    const taskConfig = TASK_TYPE_CONFIGS[type];
    if (taskConfig) {
      // 使用配置中的 getCost 函数生成消耗
      if (taskConfig.getCost) {
        const configCost = taskConfig.getCost(difficultyMultiplier);
        cost = { ...cost, ...configCost };
      }

      // 使用配置中的 getReward 函数生成奖励
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
      // 如果没有配置，使用默认值（防御性处理）
      reward.contribution = Math.floor(
        (10 + Math.random() * 40) * rankMultiplier * difficultyMultiplier * qualityConfig.rewardMultiplier * realmMultiplier
      ) + qualityConfig.contributionBonus;
    }

    // 确定是否需要战斗（使用配置中的信息）
    const requiresCombat = taskConfig?.requiresCombat ?? false;

    // 计算成功率（基于难度和品质）
    const baseSuccessRate = {
      '简单': 90,
      '普通': 75,
      '困难': 60,
      '极难': 45,
    }[difficulty];
    const qualityBonus = {
      '普通': 0,
      '稀有': 5,
      '传说': 10,
      '仙品': 15,
    }[quality];
    const successRate = Math.min(100, baseSuccessRate + qualityBonus);

    // 生成完美完成奖励（基础奖励的20-50%）
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

    // 特殊奖励（低概率，仅高品质任务）
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

    // 每日特殊任务（5%概率，高奖励）
    const isDailySpecial = Math.random() < 0.05;
    if (isDailySpecial) {
      // 特殊任务奖励翻倍
      reward.contribution = Math.floor(reward.contribution * 2);
      if (reward.exp) reward.exp = Math.floor(reward.exp * 2);
      if (reward.spiritStones) reward.spiritStones = Math.floor(reward.spiritStones * 2);
      name = `【每日特殊】${name}`;
    }

    // 任务推荐系统（使用配置中的信息）
    const recommendedFor: RandomSectTask['recommendedFor'] = taskConfig?.recommendedFor || {};

    // 任务类型连续完成加成（根据任务类型计算）
    const typeBonus = Math.floor(Math.random() * 20) + 5; // 5-25%加成

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
  // 优先从常量池获取
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

  // 如果常量池中没有，尝试从丹药定义获取
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

  // 如果常量中没有，使用默认值（如回血丹）
  if (defaultItem) {
    return { name: pillName, cost, item: { ...defaultItem, name: pillName, quantity: 1 } as Omit<Item, 'id'> };
  }
  throw new Error(`物品定义未找到: ${pillName}`);
};

/**
 * 从常量池创建物品项（用于商店）
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

// 宗门商店物品池（用于生成藏宝阁物品）- 从常量池获取
const SECT_SHOP_ITEM_POOL: Array<{ name: string; cost: number; item: Omit<Item, 'id'> }> = [
  // 从常量池获取的物品
  createItemFromConstants('Scrap Metal', 10) || { name: 'Scrap Metal', cost: 10, item: { name: 'Scrap Metal', type: ItemType.Material, description: 'Basic material for crafting.', quantity: 1, rarity: 'Common' } },
  createPillItem('Energy Drink', 20),
  createItemFromConstants('Mutant Flower', 50) || { name: 'Mutant Flower', cost: 50, item: { name: 'Mutant Flower', type: ItemType.Herb, description: 'A rare flower from the wasteland.', quantity: 1, rarity: 'Rare' } },
  createPillItem('洗髓丹', 100),
  createPillItem('筑基丹', 1000),
  createItemFromConstants('高阶妖丹', 500) || { name: '高阶妖丹', cost: 500, item: { name: '高阶妖丹', type: ItemType.Material, description: '强大妖兽的内丹，灵气逼人。', quantity: 1, rarity: '稀有' } },
  createItemFromConstants('聚灵草', 25) || { name: '聚灵草', cost: 25, item: { name: '聚灵草', type: ItemType.Herb, description: '吸收天地灵气的草药。', quantity: 1, rarity: '普通' } },
  createItemFromConstants('玄铁', 40) || { name: '玄铁', cost: 40, item: { name: '玄铁', type: ItemType.Material, description: '珍贵的炼器材料。', quantity: 1, rarity: '稀有' } },
  createItemFromConstants('星辰石', 60) || { name: '星辰石', cost: 60, item: { name: '星辰石', type: ItemType.Material, description: '蕴含星辰之力的稀有矿石。', quantity: 1, rarity: '稀有' } },
  createItemFromConstants('精铁', 20) || { name: '精铁', cost: 20, item: { name: '精铁', type: ItemType.Material, description: '优质的炼器材料。', quantity: 1, rarity: '普通' } },
  createItemFromConstants('天灵草', 35) || { name: '天灵草', cost: 35, item: { name: '天灵草', type: ItemType.Herb, description: '珍贵的灵草，可用于炼制高级丹药。', quantity: 1, rarity: '稀有' } },
  createPillItem('凝神丹', 80),
  createPillItem('强体丹', 80),
  // 回血丹可能不在常量池，使用默认值
  createPillItem('回血丹', 15, { type: ItemType.Pill, description: '快速恢复气血。', rarity: '普通', effect: { hp: 50 } }),
  // 装备类物品 - 尝试从常量池获取，如果不存在则使用默认值
  createItemFromConstants('青钢剑', 300) || { name: '青钢剑', cost: 300, item: { name: '青钢剑', type: ItemType.Weapon, description: '青钢锻造的利剑，攻击力不俗。', quantity: 1, rarity: '稀有', isEquippable: true, equipmentSlot: EquipmentSlot.Weapon, effect: { attack: 35, speed: 5 } } },
  // 其他不在常量池的物品保留原样（这些可能是特殊物品，需要后续添加到常量池）
  { name: '强化石', cost: 30, item: { name: '强化石', type: ItemType.Material, description: '用于强化法宝的珍贵材料。', quantity: 1, rarity: '稀有' } },
  { name: '宗门制式剑', cost: 150, item: { name: '宗门制式剑', type: ItemType.Weapon, description: '宗门统一配发的制式武器，基础攻击力。', quantity: 1, rarity: '普通', isEquippable: true, equipmentSlot: EquipmentSlot.Weapon, effect: { attack: 15 } } },
  { name: '宗门制式甲', cost: 120, item: { name: '宗门制式甲', type: ItemType.Armor, description: '宗门统一配发的制式护甲，基础防御力。', quantity: 1, rarity: '普通', isEquippable: true, equipmentSlot: EquipmentSlot.Chest, effect: { defense: 12, hp: 30 } } },
  { name: '玄铁甲', cost: 400, item: { name: '玄铁甲', type: ItemType.Armor, description: '玄铁打造的护甲，防御力强劲。', quantity: 1, rarity: '稀有', isEquippable: true, equipmentSlot: EquipmentSlot.Chest, effect: { defense: 40, hp: 80 } } },
  { name: '灵玉护符', cost: 250, item: { name: '灵玉护符', type: ItemType.Accessory, description: '蕴含灵气的护符，可提升神识。', quantity: 1, rarity: '稀有', isEquippable: true, equipmentSlot: EquipmentSlot.Accessory1, effect: { spirit: 20, hp: 50 } } },
  { name: '经验符', cost: 200, item: { name: '经验符', type: ItemType.Material, description: '使用后下次修炼获得双倍经验。', quantity: 1, rarity: '稀有' } },
  { name: '幸运符', cost: 180, item: { name: '幸运符', type: ItemType.Material, description: '使用后短时间内提升幸运值，增加奇遇概率。', quantity: 1, rarity: '稀有' } },
  { name: '护体符', cost: 150, item: { name: '护体符', type: ItemType.Material, description: '使用后短时间内提升防御力。', quantity: 1, rarity: '普通' } },
  { name: '聚灵符', cost: 220, item: { name: '聚灵符', type: ItemType.Material, description: '使用后短时间内提升修炼速度。', quantity: 1, rarity: '稀有' } },
  createItemFromConstants('妖兽内丹', 80) || { name: '妖兽内丹', cost: 80, item: { name: '妖兽内丹', type: ItemType.Material, description: '妖兽的内丹，可用于炼丹或炼器。', quantity: 1, rarity: '普通' } },
  createItemFromConstants('符纸', 30) || { name: '符纸', cost: 30, item: { name: '符纸', type: ItemType.Material, description: '制作符箓的基础材料。', quantity: 1, rarity: '普通' } },
  createItemFromConstants('灵矿', 45) || { name: '灵矿', cost: 45, item: { name: '灵矿', type: ItemType.Material, description: '蕴含灵气的矿石，炼器材料。', quantity: 1, rarity: '普通' } },
].filter((item): item is { name: string; cost: number; item: Omit<Item, 'id'> } => item !== null);

// 二楼高级物品池 - 从常量池获取
const SECT_SHOP_ITEM_POOL_FLOOR2: Array<{ name: string; cost: number; item: Omit<Item, 'id'> }> = [
  // 从常量池获取的物品
  createItemFromConstants('天外陨铁', 800) || { name: '天外陨铁', cost: 800, item: { name: '天外陨铁', type: ItemType.Material, description: '来自天外的神秘金属，炼制仙器的材料。', quantity: 1, rarity: '传说' } },
  createItemFromConstants('仙晶', 1500) || { name: '仙晶', cost: 1500, item: { name: '仙晶', type: ItemType.Material, description: '蕴含仙气的晶石，极其珍贵。', quantity: 1, rarity: '仙品' } },
  createPillItem('九转金丹', 3000),
  createPillItem('天元丹', 2000),
  createItemFromConstants('万年灵乳', 1200) || { name: '万年灵乳', cost: 1200, item: { name: '万年灵乳', type: ItemType.Material, description: '万年灵脉中凝聚的精华，炼制仙丹的珍贵材料。', quantity: 1, rarity: '传说' } },
  createItemFromConstants('九叶芝草', 1000) || { name: '九叶芝草', cost: 1000, item: { name: '九叶芝草', type: ItemType.Herb, description: '九叶灵芝，炼制仙丹的顶级材料。', quantity: 1, rarity: '传说' } },
  createItemFromConstants('龙鳞果', 900) || { name: '龙鳞果', cost: 900, item: { name: '龙鳞果', type: ItemType.Herb, description: '龙族栖息地生长的灵果，蕴含龙族血脉之力。', quantity: 1, rarity: '传说' } },
  // 装备类物品 - 尝试从常量池获取
  createItemFromConstants('星辰剑', 2000) || { name: '星辰剑', cost: 2000, item: { name: '星辰剑', type: ItemType.Weapon, description: '蕴含星辰之力的宝剑，威力强大。', quantity: 1, rarity: '传说', isEquippable: true, equipmentSlot: EquipmentSlot.Weapon, effect: { attack: 80, spirit: 30, speed: 15 } } },
  // 其他不在常量池的物品保留原样（这些可能是特殊物品，需要后续添加到常量池）
  { name: '龙鳞甲', cost: 2500, item: { name: '龙鳞甲', type: ItemType.Armor, description: '龙鳞制成的护甲，防御力极强。', quantity: 1, rarity: '传说', isEquippable: true, equipmentSlot: EquipmentSlot.Chest, effect: { defense: 90, hp: 200, physique: 25 } } },
  { name: '仙灵护符', cost: 1800, item: { name: '仙灵护符', type: ItemType.Accessory, description: '仙气缭绕的护符，可大幅提升属性。', quantity: 1, rarity: '传说', isEquippable: true, equipmentSlot: EquipmentSlot.Accessory1, effect: { spirit: 50, hp: 150, exp: 100 } } },
  { name: '天阶功法残卷', cost: 3500, item: { name: '天阶功法残卷', type: ItemType.Material, description: '天阶功法的残卷，可用于学习或研究。', quantity: 1, rarity: '传说' } },
  { name: '仙品法宝碎片', cost: 4000, item: { name: '仙品法宝碎片', type: ItemType.Material, description: '仙品法宝的碎片，可用于修复或炼制。', quantity: 1, rarity: '仙品' } },
  { name: '传承玉简', cost: 3000, item: { name: '传承玉简', type: ItemType.Material, description: '记录着强大传承的玉简，使用后可获得传承。', quantity: 1, rarity: '传说' } },
  { name: '仙品丹药材料包', cost: 2500, item: { name: '仙品丹药材料包', type: ItemType.Material, description: '包含多种仙品丹药材料的礼包。', quantity: 1, rarity: '仙品' } },
  { name: '灵兽契约符', cost: 2200, item: { name: '灵兽契约符', type: ItemType.Material, description: '用于与灵兽建立契约的符箓。', quantity: 1, rarity: '传说' } },
  { name: '天劫护符', cost: 2800, item: { name: '天劫护符', type: ItemType.Accessory, description: '可抵御天劫的护符，渡劫时使用。', quantity: 1, rarity: '传说', isEquippable: true, equipmentSlot: EquipmentSlot.Accessory2, effect: { defense: 60, hp: 300 } } },
].filter((item): item is { name: string; cost: number; item: Omit<Item, 'id'> } => item !== null);

// 生成宗门商店物品（藏宝阁物品，每次刷新4-8个）
export const generateSectShopItems = (floor: 1 | 2 = 1): Array<{ name: string; cost: number; item: Omit<Item, 'id'> }> => {
  const itemCount = 4 + Math.floor(Math.random() * 5); // 4-8个物品
  const items: Array<{ name: string; cost: number; item: Omit<Item, 'id'> }> = [];
  const usedItems = new Set<string>();

  // 根据楼层选择物品池
  const itemPool = floor === 2 ? SECT_SHOP_ITEM_POOL_FLOOR2 : SECT_SHOP_ITEM_POOL;

  for (let i = 0; i < itemCount; i++) {
    // 随机选择一个物品
    let selectedItem = itemPool[Math.floor(Math.random() * itemPool.length)];

    // 避免重复（但如果池子不够大，允许少量重复）
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

