import { RealmType, AdventureType } from '../types';
import { REALM_ORDER } from '../constants/index';

/**
 * Breakthrough Description Template Interface
 */
export interface BreakthroughDescriptionTemplate {
  realm: string;
  template: string; // Use {playerName} and {realm} as placeholders
}

/**
 * Enemy Name Template Interface
 */
export interface EnemyNameTemplate {
  realm: RealmType;
  adventureType: AdventureType;
  name: string;
  title: string;
}

/**
 * Breakthrough Description Template Library
 */
let breakthroughDescriptionLibrary: BreakthroughDescriptionTemplate[] = [];

/**
 * Enemy Name Template Library
 */
let enemyNameLibrary: EnemyNameTemplate[] = [];

/**
 * Initialization Status
 */
let isBreakthroughInitialized = false;
let isEnemyNameInitialized = false;

/**
 * Generate Breakthrough Description Library (500 entries)
 */
export function generateBreakthroughDescriptionLibrary(): BreakthroughDescriptionTemplate[] {
  const templates: BreakthroughDescriptionTemplate[] = [];
  const realms = ['Scavenger', 'Wastelander', 'Mutant', 'Evolved', 'Apex', 'Transcendent', 'Immortal'];

  // Generate ~71 descriptions per realm (500/7≈71)
  const descriptionsPerRealm = Math.floor(500 / realms.length);

  const baseTemplates: Record<string, string[]> = {
    'Scavenger': [ // Scavenger
      '{playerName} sat among the ruins, sorting through the day\'s haul. Suddenly, a strange device hummed to life, integrating with their Pip-Boy. {playerName} felt a surge of data, successfully upgrading to {realm}!',
      '{playerName} focused on the Geiger counter\'s rhythmic clicking. Through the radiation haze, they found clarity. The body adapted, pushing past the limits. {playerName} has reached the rank of {realm}!',
      '{playerName} spent days scavenging the wasteland, surviving on cram and dirty water. Finally, the body hardened against the elements. {playerName} evolved into a {realm}!',
      '{playerName} analyzed the pre-war manuals, optimizing their survival protocols. With a click of understanding, the mind expanded. {playerName} is now a {realm}!',
      '{playerName} felt the radiation coursing through their veins, not as a poison, but as fuel. The mutation took hold. {playerName} mutated into a {realm}!',
    ],
    'Wastelander': [ // Wastelander
      '{playerName} established a secure perimeter, the hum of the generator providing comfort. As the base stabilized, so did their genetic code. {playerName} evolved into a {realm}!',
      'Radiation storms raged outside, but {playerName} remained calm, absorbing the ambient energy. The core temperature rose, fusing flesh and purpose. {playerName} has become a {realm}!',
      '{playerName} calibrated their gear, the weapon feeling like an extension of their arm. A sudden synchronization occurred. With a mechanical whir, {playerName} upgraded to {realm}!',
      '{playerName} consumed a rare isotope, feeling the heat spread. It wasn\'t sickness, it was power. The DNA rewrote itself. {playerName} is now a {realm}!',
      '{playerName} studied the ancient holotapes, unlocking secrets of the old world. The knowledge catalyzed a physical change. {playerName} broke through to {realm}!',
    ],
    'Mutant': [ // Mutant
      '{playerName} concentrated, the internal radiation coalescing into a dense core. A shockwave of energy blasted outward. {playerName} has formed a Core and become a {realm}!',
      'The wasteland energies swirled around {playerName}, drawn to the singularity within. With a roar that shook the ruins, the transformation completed. {playerName} is now a {realm}!',
      '{playerName} stood in the heart of the glowing sea, unharmed. The radiation was no longer a threat, but a battery. {playerName} surged to the level of {realm}!',
      '{playerName} merged with the experimental armor, flesh and steel becoming one. The reactor pulsed in sync with their heart. {playerName} upgraded to {realm}!',
      '{playerName} injected the experimental serum. Pain turned to ecstasy as the body rebuilt itself at a cellular level. {playerName} mutated into a powerful {realm}!',
    ],
    'Evolved': [ // Evolved
      'A digital avatar manifested beside {playerName}, a projection of their enhanced consciousness. The mind had transcended the flesh. {playerName} has evolved into a {realm}!',
      '{playerName} tapped into the global satellite network, their mind expanding across the wasteland. Data streams became visible. {playerName} reached the {realm} stage!',
      'Under the pale moonlight, {playerName} glowed with an ethereal light. The radiation had unlocked latent psychic potential. {playerName} ascended to {realm}!',
      '{playerName} fought through the horde, every kill feeding the internal reactor. In the heat of battle, a new form emerged. {playerName} broke through to {realm}!',
      'The ground trembled as {playerName} released the limiters. A second heartbeat, a nuclear one, began to thump. {playerName} is now a terrifying {realm}!',
    ],
    'Apex': [ // Apex
      'Thunder crashed, but {playerName} did not flinch. They channeled the storm, becoming a conduit for nature\'s fury. {playerName} has become an {realm}!',
      'Orbital lasers targeted {playerName}, but the beams refracted off their energy shield. They are no longer just a survivor, but a force of nature. {playerName} is now an {realm}!',
      'On the brink of death, {playerName}\'s emergency protocols kicked in, overwriting mortality. They rose from the ashes, reborn. {playerName} achieved {realm} status!',
      '{playerName} interfaced with the mainframe of a lost vault, downloading centuries of tactical data. The mind became a supercomputer. {playerName} is an {realm}!',
      'Reality seemed to bend around {playerName}. Their mere presence caused geiger counters to explode. {playerName} has stepped into the realm of {realm}!',
    ],
    'Transcendent': [ // Transcendent
      'Space rippled around {playerName}. They stepped through the void, ignoring distance. The laws of physics no longer applied. {playerName} is a {realm}!',
      'The very fabric of the wasteland bowed to {playerName}\'s will. Radiation bent and twisted at their command. {playerName} has transcended to {realm}!',
      'A localized nuclear detonation engulfed {playerName}, but they emerged unscathed, glowing with star-fire. {playerName} has become a {realm}!',
      'Pre-war defense systems recognized {playerName} not as a target, but as a commander. The machines bowed. {playerName} is now a {realm}!',
      '{playerName} stared into the abyss of the atom, and the abyss blinked. They have become one with the glow. {playerName} reached the {realm}!',
    ],
    'Immortal': [ // Immortal
      'The sky split open, a barrage of orbital strikes raining down. {playerName} stood firm, catching the warheads. They have surpassed humanity. {playerName} is a Wasteland Legend!',
      'The ancient FEV vats boiled, acknowledging their master. {playerName} has become the ultimate lifeform. {playerName} ascended to {realm}!',
      'Time stopped. {playerName} saw the past, present, and future of the wasteland. They stepped out of the cycle of decay. {playerName} is Eternal!',
      'The entire wasteland shook as {playerName} took the final step. They are no longer a scavenger, but a god of the wastes. {playerName} achieved {realm}!',
      'Legends will be told of this day. {playerName} has conquered the wasteland, the radiation, and death itself. {playerName} is now {realm}!',
    ],
  };

  // Generate descriptions for each realm
  realms.forEach(realm => {
    const baseTemplatesForRealm = baseTemplates[realm] || baseTemplates['Mutant'];

    // Generate variations
    for (let i = 0; i < descriptionsPerRealm; i++) {
      const baseTemplate = baseTemplatesForRealm[i % baseTemplatesForRealm.length];

      // Variations
      const variations = [
        baseTemplate,
        baseTemplate.replace('sat among the ruins', 'meditated in the ruins'),
        baseTemplate.replace('sorting through', 'organizing'),
        baseTemplate.replace('hummed to life', 'activated'),
        baseTemplate.replace('surge of data', 'rush of information'),
        baseTemplate.replace('successfully upgrading', 'finally upgrading'),
      ];

      const template = variations[i % variations.length];
      templates.push({
        realm,
        template,
      });
    }
  });

  // Ensure total count reaches 500
  while (templates.length < 500) {
    const realm = realms[Math.floor(Math.random() * realms.length)];
    const baseTemplatesForRealm = baseTemplates[realm] || baseTemplates['Mutant'];
    const baseTemplate = baseTemplatesForRealm[Math.floor(Math.random() * baseTemplatesForRealm.length)];
    templates.push({
      realm,
      template: baseTemplate,
    });
  }

  return templates.slice(0, 500);
}

/**
 * Generate Enemy Name Template Library (500 entries)
 */
export function generateEnemyNameLibrary(): EnemyNameTemplate[] {
  const templates: EnemyNameTemplate[] = [];
  const realms: RealmType[] = REALM_ORDER;
  const adventureTypes: AdventureType[] = ['normal', 'lucky', 'secret_realm'];

  // Enemy Name Prefixes and Suffixes (Expanded for Wasteland Cultivation style)
  const namePrefixes = [
    // Basic Attributes
    'Radioactive', 'Irradiated', 'Feral', 'Glowing', 'Alpha', 'Prime', 'Legendary', 'Mythic', 'Rusty', 'Armored',
    'Cybernetic', 'Synthesized', 'Mutated', 'Enraged', 'Rabid', 'Ancient', 'Pre-War', 'Toxic', 'Venomous', 'Caustic',
    'Scorched', 'Charred', 'Frozen', 'Cryo', 'Electric', 'Shock', 'Plasma', 'Laser', 'Quantum', 'Atomic',
    'Heavy', 'Light', 'Reinforced', 'Hardened', 'Jagged', 'Spiked', 'Serrated', 'Barbed', 'Sharp', 'Dull',
    // Expanded Attributes
    'Elite', 'Veteran', 'Master', 'Grandmaster', 'Supreme', 'Ultimate', 'Deadly', 'Lethal', 'Vicious', 'Savage',
    'Brutal', 'Cruel', 'Merciless', 'Ruthless', 'Fierce', 'Wild', 'Untamed', 'Unstoppable', 'Invincible', 'Immortal',
    'Corrupted', 'Infected', 'Diseased', 'Plagued', 'Blighted', 'Cursed', 'Damned', 'Doomed', 'Fallen', 'Lost',
    'Dark', 'Shadow', 'Night', 'Midnight', 'Black', 'Grim', 'Obsidian', 'Void', 'Abyssal', 'Nether',
    'Blood', 'Gore', 'Flesh', 'Bone', 'Skull', 'Death', 'Doom', 'Terror', 'Horror', 'Fear',
    // Status
    'Broken', 'Damaged', 'Defective', 'Malfunctioning', 'Glitchy', 'Erratic', 'Unstable', 'Volatile', 'Explosive', 'Critical',
    'New', 'Prototype', 'Experimental', 'Advanced', 'Upgraded', 'Enhanced', 'Augmented', 'Modified', 'Custom', 'Unique',
    'Lone', 'Solitary', 'Wandering', 'Roaming', 'Drifting', 'Stray', 'Lost', 'Exiled', 'Banished', 'Outcast',
    // Emotional
    'Mad', 'Insane', 'Crazy', 'Lunatic', 'Psycho', 'Maniac', 'Deranged', 'Demented', 'Hysterical', 'Delirious',
    'Angry', 'Furious', 'Wrathful', 'Raging', 'Seething', 'Fuming', 'Storming', 'Boiling', 'Burning', 'Blazing',
  ];

  const nameMiddles = [
    // Generally empty for English names, or simple connectors
    '', '', '', '', '', // Weight towards no middle name
    'the', 'of the',
  ];

  const nameSuffixes = [
    // Creatures
    'Raider', 'Scavenger', 'Ghoul', 'Mutant', 'Beast', 'Hound', 'Rat', 'Roach', 'Fly', 'Scorpion',
    'Deathclaw', 'Robot', 'Protectron', 'Sentry', 'Synth', 'Soldier', 'Knight', 'Paladin', 'Sentinel', 'Guard',
    'Watcher', 'Keeper', 'Hunter', 'Stalker', 'Prowler', 'Killer', 'Slayer', 'Butcher', 'Reaper', 'Destroyer',
    'Devourer', 'Consumer', 'Ravager', 'Wrecker', 'Smasher', 'Crusher', 'Breaker', 'Splitter', 'Ripper', 'Shredder',
    // Double Word Creatures (Simulated by combination)
    'Mirelurk', 'Yao Guai', 'Radscorpion', 'Bloatfly', 'Stingwing', 'Ant', 'Cricket', 'Spider', 'Worm', 'Leech',
    'Wolf', 'Bear', 'Cat', 'Dog', 'Boar', 'Brahmin', 'Bighorner', 'Gecko', 'Cazador', 'Mantis',
    // Roles
    'Sniper', 'Gunner', 'Commando', 'Grenadier', 'Demolitionist', 'Medic', 'Doctor', 'Scientist', 'Engineer', 'Technician',
    'Mechanic', 'Pilot', 'Driver', 'Captain', 'Major', 'Colonel', 'General', 'Commander', 'Leader', 'Chief',
    'Boss', 'King', 'Lord', 'Emperor', 'Overlord', 'Tyrant', 'Dictator', 'Ruler', 'Master', 'God',
    'Priest', 'Monk', 'Cultist', 'Fanatic', 'Zealot', 'Believer', 'Follower', 'Disciple', 'Acolyte', 'Initiate',
    // Spiritual/Ghostly
    'Ghost', 'Spirit', 'Specter', 'Phantom', 'Wraith', 'Poltergeist', 'Apparition', 'Shadow', 'Shade', 'Soul',
    'Demon', 'Devil', 'Fiend', 'Monster', 'Abomination', 'Horror', 'Terror', 'Nightmare', 'Dread', 'Fear',
    // Special
    'One', 'Unit', 'System', 'Core', 'Mind', 'Brain', 'Eye', 'Hand', 'Fist', 'Claw',
    'Tooth', 'Fang', 'Wing', 'Tail', 'Horn', 'Spike', 'Blade', 'Edge', 'Point', 'Tip',
  ];

  const titlePrefixes = [
    // Locations
    'Wasteland', 'Ruins', 'Vault', 'Bunker', 'Shelter', 'Outpost', 'Camp', 'Base', 'Fort', 'Castle',
    'City', 'Town', 'Village', 'Settlement', 'Colony', 'Territory', 'Zone', 'Area', 'Region', 'Sector',
    'District', 'Quarter', 'Ward', 'Block', 'Street', 'Road', 'Highway', 'Freeway', 'Bridge', 'Tunnel',
    'Metro', 'Subway', 'Station', 'Terminal', 'Airport', 'Harbor', 'Port', 'Dock', 'Pier', 'Wharf',
    'Factory', 'Plant', 'Mill', 'Works', 'Shop', 'Lab', 'Center', 'Facility', 'Complex', 'Institute',
    // Paths/Ways
    'Dark', 'Light', 'Blood', 'Death', 'Life', 'War', 'Peace', 'Chaos', 'Order', 'Law',
  ];

  const titleSuffixes = [
    // Creatures
    'Beast', 'Mutant', 'Horror', 'Abomination', 'Entity', 'Creature', 'Monster', 'Fiend', 'Titan', 'Colossus',
    'Predator', 'Hunter', 'Stalker', 'Ravager', 'Devourer', 'Slayer', 'Killer', 'Butcher', 'Reaper', 'Destroyer',
    'Vermin', 'Parasite', 'Leech', 'Worm', 'Insect', 'Bug', 'Critter', 'Pest', 'Swarm', 'Horde',
    // Humanoids/Survivors
    'Survivor', 'Wanderer', 'Nomad', 'Exile', 'Outcast', 'Refugee', 'Scavenger', 'Raider', 'Bandit', 'Thief',
    'Cultist', 'Fanatic', 'Zealot', 'Believer', 'Follower', 'Disciple', 'Acolyte', 'Initiate', 'Member', 'Leader',
    'Psyker', 'Esper', 'Telepath', 'Kinetic', 'Mystic', 'Shaman', 'Seer', 'Oracle', 'Prophet', 'Sage',
    // Ranks/Status
    'Lord', 'King', 'Emperor', 'Overlord', 'Tyrant', 'Dictator', 'Ruler', 'Master', 'Boss', 'Chief',
    'Commander', 'General', 'Captain', 'Major', 'Colonel', 'Lieutenant', 'Sergeant', 'Corporal', 'Private', 'Recruit',
    'Alpha', 'Prime', 'Omega', 'Elite', 'Veteran', 'Champion', 'Hero', 'Legend', 'Myth', 'God',
    // Guardians
    'Guardian', 'Sentinel', 'Warden', 'Keeper', 'Protector', 'Defender', 'Watcher', 'Observer', 'Sentry', 'Guard',
    'Shield', 'Barrier', 'Wall', 'Gate', 'Door', 'Lock', 'Key', 'Anchor', 'Pillar', 'Foundation',
    // Special
    'Construct', 'Machine', 'Robot', 'Android', 'Cyborg', 'Synth', 'Drone', 'Automaton', 'Mechanism', 'Device',
    'Avatar', 'Incarnation', 'Manifestation', 'Projection', 'Illusion', 'Phantom', 'Specter', 'Ghost', 'Spirit', 'Soul',
    'Remnant', 'Echo', 'Shadow', 'Shade', 'Trace', 'Fragment', 'Shard', 'Splinter', 'Piece', 'Part',
    // Combat Styles
    'Sniper', 'Marksman', 'Gunner', 'Rifleman', 'Pistoleer', 'Shotgunner', 'Heavy', 'Demolitionist', 'Grenadier', 'Rocket',
    'Brawler', 'Fighter', 'Warrior', 'Soldier', 'Knight', 'Paladin', 'Berserker', 'Savage', 'Barbarian', 'Gladiator',
    // Elements
    'Pyromancer', 'Cryomancer', 'Electromancer', 'Geomancer', 'Aeromancer', 'Hydromancer', 'Photomancer', 'Umbramancer', 'Necromancer', 'Biomancer',
    'Burner', 'Freezer', 'Shocker', 'Blaster', 'Melter', 'Disintegrator', 'Vaporizer', 'Atomizer', 'Crusher', 'Smasher',
  ];

  // Generate names for each realm and adventure type combination
  realms.forEach(realm => {
    adventureTypes.forEach(adventureType => {
      const countPerCombination = Math.floor(500 / (realms.length * adventureTypes.length));

      for (let i = 0; i < countPerCombination; i++) {
        // Generate English Names
        let name = '';
        
        const prefix = namePrefixes[Math.floor(Math.random() * namePrefixes.length)];
        const suffix = nameSuffixes[Math.floor(Math.random() * nameSuffixes.length)];
        
        // 30% chance to have a middle part
        if (Math.random() < 0.3) {
            const middle = nameMiddles[Math.floor(Math.random() * nameMiddles.length)];
            if (middle) {
                name = `${prefix} ${middle} ${suffix}`;
            } else {
                name = `${prefix} ${suffix}`;
            }
        } else {
            name = `${prefix} ${suffix}`;
        }

        const titlePrefix = titlePrefixes[Math.floor(Math.random() * titlePrefixes.length)];
        const titleSuffix = titleSuffixes[Math.floor(Math.random() * titleSuffixes.length)];
        const title = `${titlePrefix} ${titleSuffix}`;

        templates.push({
          realm,
          adventureType,
          name,
          title,
        });
      }
    });
  });

  // Ensure total count reaches 500
  while (templates.length < 500) {
    const realm = realms[Math.floor(Math.random() * realms.length)];
    const adventureType = adventureTypes[Math.floor(Math.random() * adventureTypes.length)];

    let name = '';
    const prefix = namePrefixes[Math.floor(Math.random() * namePrefixes.length)];
    const suffix = nameSuffixes[Math.floor(Math.random() * nameSuffixes.length)];
    
    if (Math.random() < 0.3) {
        const middle = nameMiddles[Math.floor(Math.random() * nameMiddles.length)];
        if (middle) {
            name = `${prefix} ${middle} ${suffix}`;
        } else {
            name = `${prefix} ${suffix}`;
        }
    } else {
        name = `${prefix} ${suffix}`;
    }

    const titlePrefix = titlePrefixes[Math.floor(Math.random() * titlePrefixes.length)];
    const titleSuffix = titleSuffixes[Math.floor(Math.random() * titleSuffixes.length)];
    const title = `${titlePrefix} ${titleSuffix}`;

    templates.push({
      realm,
      adventureType,
      name,
      title,
    });
  }

  return templates.slice(0, 500);
}

/**
 * Get random breakthrough description
 */
export function getRandomBreakthroughDescription(
  realm: string,
  playerName?: string
): string {
  if (breakthroughDescriptionLibrary.length === 0) {
    // If no templates, return default description
    const name = playerName || 'You';
    return `${name} has successfully broken through to ${realm}!`;
  }

  // Filter templates for the realm
  const realmTemplates = breakthroughDescriptionLibrary.filter(
    t => t.realm === realm
  );

  // If no templates for the realm, use all templates
  const templates = realmTemplates.length > 0
    ? realmTemplates
    : breakthroughDescriptionLibrary;

  const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
  const name = playerName || 'You';

  return randomTemplate.template
    .replace(/{playerName}/g, name)
    .replace(/{realm}/g, realm);
}

/**
 * Get random enemy name
 */
export function getRandomEnemyName(
  realm: RealmType,
  adventureType: AdventureType
): { name: string; title: string } {
  if (enemyNameLibrary.length === 0) {
    // If no templates, return default name
    return { name: 'Unknown Enemy', title: 'Wasteland Beast' };
  }

  // Filter templates for the realm and adventure type
  const matchingTemplates = enemyNameLibrary.filter(
    t => t.realm === realm && t.adventureType === adventureType
  );

  // If no matching templates, use all templates
  const templates = matchingTemplates.length > 0
    ? matchingTemplates
    : enemyNameLibrary;

  const randomTemplate = templates[Math.floor(Math.random() * templates.length)];

  return {
    name: randomTemplate.name,
    title: randomTemplate.title,
  };
}

/**
 * Set breakthrough description library
 */
export function setBreakthroughDescriptionLibrary(templates: BreakthroughDescriptionTemplate[]): void {
  breakthroughDescriptionLibrary = templates;
  isBreakthroughInitialized = true;
}

/**
 * Get breakthrough description library
 */
export function getBreakthroughDescriptionLibrary(): BreakthroughDescriptionTemplate[] {
  return breakthroughDescriptionLibrary;
}

/**
 * Check if breakthrough description library is initialized
 */
export function isBreakthroughDescriptionLibraryInitialized(): boolean {
  return isBreakthroughInitialized && breakthroughDescriptionLibrary.length > 0;
}

/**
 * Set enemy name library
 */
export function setEnemyNameLibrary(templates: EnemyNameTemplate[]): void {
  enemyNameLibrary = templates;
  isEnemyNameInitialized = true;
}

/**
 * Get enemy name library
 */
export function getEnemyNameLibrary(): EnemyNameTemplate[] {
  return enemyNameLibrary;
}

/**
 * Check if enemy name library is initialized
 */
export function isEnemyNameLibraryInitialized(): boolean {
  return isEnemyNameInitialized && enemyNameLibrary.length > 0;
}

