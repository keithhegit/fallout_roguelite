import React from 'react';
import {
  PlayerStats,
  AdventureResult,
  AdventureType,
  Item,
  ItemType,
  ItemRarity,
  EquipmentSlot,
  Pet,
  RealmType,
  RiskLevel,
  AdventureItemData,
} from '../../types';
import {
  REALM_ORDER,
  TALENTS,
  CULTIVATION_ARTS,
  PET_TEMPLATES,
  DISCOVERABLE_RECIPES,
  PET_EVOLUTION_MATERIALS,
  getRandomPetName,
  FOUNDATION_TREASURES,
  HEAVEN_EARTH_ESSENCES,
  HEAVEN_EARTH_MARROWS,
  HEAVEN_EARTH_SOUL_BOSSES,
  LONGEVITY_RULES,
  SECTS,
} from '../../constants/index';
import { SectRank } from '../../types';
import { BattleReplay } from '../../services/battleService';
import { uid } from '../../utils/gameUtils';
import {
  initializeEventTemplateLibrary,
  getRandomEventTemplate,
  templateToAdventureResult,
} from '../../services/adventureTemplateService';
import { getAllArtifacts, getItemFromConstants, ItemConstantData } from '../../utils/itemConstantsUtils';
import {
  normalizeItemEffect,
  inferItemTypeAndSlot,
  adjustItemStatsByRealm,
} from '../../utils/itemUtils';
import { normalizeRarityValue } from '../../utils/rarityUtils';
import { getPlayerTotalStats } from '../../utils/statUtils';

interface ExecuteAdventureCoreProps {
  result: AdventureResult;
  battleContext: BattleReplay | null;
  petSkillCooldowns?: Record<string, number>;
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
  triggerVisual: (type: string, text?: string, className?: string) => void;
  onOpenBattleModal: (replay: BattleReplay) => void;
  realmName?: string;
  adventureType: AdventureType;
  skipBattle?: boolean;
  skipReputationEvent?: boolean; // Whether to skip reputation event
  onReputationEvent?: (event: AdventureResult['reputationEvent']) => void;
  onPauseAutoAdventure?: () => void; // Pause auto adventure callback (for Heaven Earth Soul etc.)
}

// Removed ensureEquipmentAttributes function
// No longer adjusting equipment attributes, using raw attributes from constant pool directly

/**
 * Core Player State Update Logic (Refactored)
 */
const applyResultToPlayer = (
  prev: PlayerStats,
  result: AdventureResult,
  options: {
    isSecretRealm: boolean;
    adventureType: AdventureType;
    realmName?: string;
    riskLevel?: RiskLevel;
    battleContext?: BattleReplay | null;
    petSkillCooldowns?: Record<string, number>;
    addLog: (msg: string, type?: string) => void;
    triggerVisual: (type: string, text?: string, className?: string) => void;
  }
): PlayerStats => {
  const { isSecretRealm, adventureType, realmName, riskLevel, battleContext, petSkillCooldowns, addLog, triggerVisual } = options;
  if (!prev) return prev;

  const realmIndex = REALM_ORDER.indexOf(prev.realm);
  const realmMultiplier = 1 + realmIndex * 0.3 + (prev.realmLevel - 1) * 0.1;

  const newInv = [...prev.inventory];
  const newArts = [...prev.cultivationArts];
  // Use Set to ensure uniqueness, then convert back to array
  // Fix: Include prev.unlockedArts when initializing Set to ensure previously unlocked arts are not lost
  const unlockedArtsSet = new Set([...(prev.unlockedArts || []), ...prev.cultivationArts]);
  let newUnlockedArts = Array.from(unlockedArtsSet);

  let newTalentId = prev.talentId;
  let newAttack = prev.attack;
  let newDefense = prev.defense;
  let newMaxHp = prev.maxHp;
  let newHp = prev.hp;
  let newLuck = prev.luck;
  let newLotteryTickets = prev.lotteryTickets;
  let newInheritanceLevel = prev.inheritanceLevel;
  let newPets = [...prev.pets];
  let newReputation = prev.reputation || 0;
  let newSpirit = prev.spirit;
  let newPhysique = prev.physique;
  let newSpeed = prev.speed;
  let newLifespan = prev.lifespan ?? prev.maxLifespan ?? 100;
  let newSpiritualRoots = { ...prev.spiritualRoots };
  let newExp = prev.exp;
  let newStones = prev.spiritStones;

  const newStats = { ...(prev.statistics || { killCount: 0, meditateCount: 0, adventureCount: 0, equipCount: 0, petCount: 0, recipeCount: 0, artCount: 0, breakthroughCount: 0, secretRealmCount: 0 }) };
  newStats.adventureCount += 1;
  if (realmName || isSecretRealm) newStats.secretRealmCount += 1;
  if (battleContext?.victory) newStats.killCount += 1;

  // Pet cooldowns
  if (petSkillCooldowns && prev.activePetId) {
    newPets = newPets.map(p => {
      if (p.id === prev.activePetId) {
        const cooldowns = { ...p.skillCooldowns };
        Object.entries(petSkillCooldowns).forEach(([id, cd]) => { if (cd > 0) cooldowns[id] = Math.max(cooldowns[id] || 0, cd); });
        const finalCds: Record<string, number> = {};
        Object.entries(cooldowns).forEach(([id, cd]) => { if (cd > 0) finalCds[id] = cd; });
        return { ...p, skillCooldowns: Object.keys(finalCds).length > 0 ? finalCds : undefined };
      }
      return p;
    });
  }

  // Item processing logic
  const itemsToProcess = [...(result.itemsObtained || [])];
  if (result.itemObtained) itemsToProcess.push(result.itemObtained);

  const currentBatchNames = new Set<string>();
  itemsToProcess.forEach((itemData: AdventureItemData) => {
    // Fix: Check if itemData is valid early to avoid processing failure due to invalid data
    if (!itemData || !itemData.name) {
      console.error('Item data is null/undefined or has no name, skipping:', itemData);
      return;
    }

    // Move variable declarations outside try block so catch block can access them
    let itemName = '';
    let itemType = ItemType.Material;
    let itemRarity: ItemRarity = 'Common';
    let isEquippable = false;
    let equipmentSlot: EquipmentSlot | undefined = undefined;
    let finalEffect: any = undefined;
    let finalPermanentEffect: any = undefined;
    let recipeData: any = undefined;

    try {
      itemName = itemData.name.trim();
      itemType = (itemData.type as ItemType) || ItemType.Material;
      isEquippable = !!itemData.isEquippable;
      equipmentSlot = itemData.equipmentSlot as EquipmentSlot | undefined;

      // Fix: Mystery Artifact logic only applies to basic items to avoid replacing advanced items
      // Check for existence of advanced properties safely
      const hasAdvancedType = !!itemData.advancedItemType;
      const hasAdvancedId = !!itemData.advancedItemId;
      const hasRecipeData = !!itemData.recipeName;
      
      const isBasicItem = !hasAdvancedType && !hasAdvancedId && !hasRecipeData;

      if (isBasicItem && (itemName.includes('Relic') || itemName.includes('Artifact'))) {
        // Get random artifact from constant pool
        const artifacts = getAllArtifacts();
        if (artifacts.length > 0) {
          const randomArtifact = artifacts[Math.floor(Math.random() * artifacts.length)];
          itemName = randomArtifact.name;
          itemType = randomArtifact.type;
          isEquippable = randomArtifact.isEquippable || true;
          equipmentSlot = (randomArtifact.equipmentSlot as EquipmentSlot) || (Math.random() < 0.5 ? EquipmentSlot.Artifact1 : EquipmentSlot.Artifact2);
          // Use description and effects from constant pool
          if (randomArtifact.description) {
            itemData.description = randomArtifact.description;
          }
          if (randomArtifact.effect) {
            itemData.effect = randomArtifact.effect;
          }
          if (randomArtifact.permanentEffect) {
            itemData.permanentEffect = randomArtifact.permanentEffect;
          }
          if (randomArtifact.rarity) {
            itemData.rarity = randomArtifact.rarity;
          }
        } else {
          // If no artifacts in constant pool, use default processing
          itemName = 'Unknown Relic';
          itemType = ItemType.Artifact;
          isEquippable = true;
          equipmentSlot = Math.random() < 0.5 ? EquipmentSlot.Artifact1 : EquipmentSlot.Artifact2;
        }
      } else {
        // Non-basic items (already have advanced info), skip relic logic
      }

      // Priority: Get full info from constants (if exists, skip inference)
      itemRarity = (itemData.rarity as ItemRarity) || 'Common';
      const itemFromConstants = getItemFromConstants(itemName);
      if (itemFromConstants) {
        // Constant pool exists, use it
        itemType = itemFromConstants.type as ItemType;
        itemRarity = itemFromConstants.rarity;
        // If equipment slot info is in the constant pool, use it
        if (itemFromConstants.equipmentSlot) {
          equipmentSlot = itemFromConstants.equipmentSlot as EquipmentSlot;
          isEquippable = itemFromConstants.isEquippable || true;
        }
        // If description is in the constant pool, use it
        if (itemFromConstants.description && !itemData.description) {
          itemData.description = itemFromConstants.description;
        }
        // If advanced item info is in the constant pool, use it (prioritize constant pool data)
        if (itemFromConstants.advancedItemType && !itemData.advancedItemType) {
          itemData.advancedItemType = itemFromConstants.advancedItemType;
        }
        if (itemFromConstants.advancedItemId && !itemData.advancedItemId) {
          itemData.advancedItemId = itemFromConstants.advancedItemId;
        }

        // Validate equipment slot: even if a slot is in the constant pool, infer to verify correctness
        // If the inferred slot differs from the constant pool and is more reasonable (based on item name), use the inferred result
        if (isEquippable && equipmentSlot) {
          const inferred = inferItemTypeAndSlot(itemName, itemType, itemData.description || '', isEquippable);
          if (inferred.equipmentSlot && inferred.equipmentSlot !== equipmentSlot) {
            // If the inferred slot differs from the constant pool, prioritize the inferred result (as it's based on item name and more accurate)
            // This can fix potentially incorrect slot definitions in the constant pool
            equipmentSlot = inferred.equipmentSlot;
            if (import.meta.env.DEV) {
              console.warn(`[Slot Correction] Item "${itemName}" slot corrected from "${itemFromConstants.equipmentSlot}" to "${inferred.equipmentSlot}"`);
            }
          } else if (!equipmentSlot && inferred.equipmentSlot) {
            // If no slot in constant pool but one is inferred, use the inferred result
            equipmentSlot = inferred.equipmentSlot;
          }
        }
      } else {
        // Only infer type if not found in constant pool
        const inferred = inferItemTypeAndSlot(itemName, itemType, itemData.description || '', isEquippable);
        itemType = inferred.type;
        isEquippable = inferred.isEquippable;
        equipmentSlot = inferred.equipmentSlot || equipmentSlot;
      }

      // Effect normalization (using raw attributes from the constant pool)
      const normalized = normalizeItemEffect(itemName, itemData.effect, itemData.permanentEffect, itemType, itemRarity);
      finalEffect = normalized.effect;
      finalPermanentEffect = normalized.permanentEffect;

      // Equipment should not have permanent effects; if they do, convert them to temporary effects
      if (isEquippable && finalPermanentEffect) {
        // Merge permanentEffect properties into effect
        if (!finalEffect) {
          finalEffect = {};
        }
        // Property mapping table to reduce repetitive code
        const permEffectMap: Array<{ permKey: keyof typeof finalPermanentEffect; effectKey: keyof typeof finalEffect }> = [
          { permKey: 'attack', effectKey: 'attack' },
          { permKey: 'defense', effectKey: 'defense' },
          { permKey: 'spirit', effectKey: 'spirit' },
          { permKey: 'physique', effectKey: 'physique' },
          { permKey: 'speed', effectKey: 'speed' },
        ];
        permEffectMap.forEach(({ permKey, effectKey }) => {
          const permValue = finalPermanentEffect?.[permKey];
          if (permValue !== undefined && typeof permValue === 'number') {
            finalEffect[effectKey] = (finalEffect[effectKey] || 0) + permValue;
          }
        });
        // Special handling for maxHp, convert to hp
        if (finalPermanentEffect.maxHp !== undefined) {
          finalEffect.hp = (finalEffect.hp || 0) + finalPermanentEffect.maxHp;
        }
        // Equipment should not have permanent effects
        finalPermanentEffect = undefined;
      }

      // Adjust all item attributes based on realm to ensure attributes keep up with character growth
      // For equipment, use adjustEquipmentStatsByRealm; for other items, use general adjustItemStatsByRealm
      if (finalEffect || finalPermanentEffect) {
        const adjusted = adjustItemStatsByRealm(
          finalEffect,
          finalPermanentEffect,
          prev.realm,
          prev.realmLevel,
          itemType,
          itemRarity
        );
        finalEffect = adjusted.effect;
        finalPermanentEffect = adjusted.permanentEffect;
      }

      // Handle duplicate equipment names
      if (isEquippable && equipmentSlot) {
        const baseName = itemName;
        const suffixes = [' (Mod)', ' (Alt)', ' (Ver 2)', ' (New)', ' (Alpha)', ' (Beta)', ' (Gamma)'];
        let attempts = 0;
        while (attempts < suffixes.length && (newInv.some(i => i.name === itemName) || currentBatchNames.has(itemName))) {
          itemName = baseName + suffixes[attempts++];
          // Add to currentBatchNames to ensure items in the current batch are not duplicated
          currentBatchNames.add(itemName);
        }
        // Fix: Adjust condition check order to ensure attempts are checked first, avoiding skipping additions
        if (attempts >= suffixes.length && (newInv.some(i => i.name === itemName) || currentBatchNames.has(itemName))) return;
      }
      currentBatchNames.add(itemName);

      // Recipe handling
      if (itemType === ItemType.Recipe) {
        const recipeName = itemData.recipeName || itemName.replace(/Recipe$/, '');
        recipeData = DISCOVERABLE_RECIPES.find(r => r.name === recipeName);
      }

      const existingIdx = newInv.findIndex(i => i.name === itemName);
      if (existingIdx >= 0 && !isEquippable && itemType !== ItemType.Recipe) {
        newInv[existingIdx] = { ...newInv[existingIdx], quantity: newInv[existingIdx].quantity + 1 };
      } else {
        let reviveChances = itemData.reviveChances;
        if (reviveChances === undefined && (itemRarity === 'Legendary' || itemRarity === 'Mythic') && (itemType === ItemType.Weapon || itemType === ItemType.Artifact)) {
          if (Math.random() < (itemRarity === 'Legendary' ? 0.3 : 0.6)) reviveChances = Math.floor(Math.random() * 3) + 1;
        }
        // Ensure equipment does not have permanentEffect
        const equipmentPermanentEffect = isEquippable ? undefined : finalPermanentEffect;
        // Pass advanced item related fields
        const advancedItemType = itemData.advancedItemType;
        const advancedItemId = itemData.advancedItemId;
        newInv.push({ id: uid(), name: itemName, type: itemType, description: itemData.description, quantity: 1, rarity: itemRarity, level: 0, isEquippable, equipmentSlot, effect: finalEffect, permanentEffect: equipmentPermanentEffect, recipeData, reviveChances, advancedItemType, advancedItemId });
      }
    } catch (e) {
      console.error('Item processing error:', e);
      // Ensure item is added even if an error occurs (using default values)
      const fallbackItem: Item = {
        id: uid(),
        name: itemName,
        type: itemType,
        description: itemData?.description || 'Undescribed Item',
        quantity: 1,
        rarity: itemRarity,
        level: itemData.level || 0,
        isEquippable: false,
        effect: finalEffect || {},
        permanentEffect: undefined,
        // Add missing equipment properties
        equipmentSlot: equipmentSlot || undefined,
        recipeData: recipeData, // Use the recipeData calculated above
        reviveChances: itemData.reviveChances,
        advancedItemType: itemData.advancedItemType,
        advancedItemId: itemData.advancedItemId
      };
      newInv.push(fallbackItem);
    }
  });

  // Cultivation Art unlock logic
  // Check if event description contains cultivation art related keywords (to ensure cultivationArt type events unlock correctly)
  const storyHasArtKeywords = result.story && (
    result.story.includes('Combat Protocol') ||
    result.story.includes('Schematic') ||
    result.story.includes('Manual') ||
    result.story.includes('Learned') ||
    result.story.includes('Taught') ||
    result.story.includes('Inherited')
  );

  // If event description contains cultivation art keywords, guarantee unlock; otherwise, unlock probabilistically (lower chance)
  const artChance = storyHasArtKeywords ? 1.0 : (isSecretRealm ? 0.08 : (adventureType === 'lucky' ? 0.10 : 0.04));
  let artUnlocked = false;

  // Add randomness: combine deterministic random numbers with true random numbers
  // Use the sum of character codes of the event description as a base seed
  const storyHash = result.story ? result.story.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) : 0;
  // Add more varying factors to make each adventure result more unique
  const deterministicSeed = storyHash + (prev.exp || 0) + (prev.spiritStones || 0) + (prev.realm?.length || 0) + (prev.hp || 0) + (prev.attack || 0);
  const deterministicRandom = Math.abs(Math.sin(deterministicSeed)) % 1;
  // Add true random number to increase variability (70% deterministic + 30% random)
  const trueRandom = Math.random();
  const artRandom = deterministicRandom * 0.7 + trueRandom * 0.3;
  const shouldUnlock = artRandom < artChance;

  // Use a Set to track arts unlocked in this run to avoid duplicates
  const unlockedInThisRun = new Set<string>();

  if (shouldUnlock) {
    const availableArts = CULTIVATION_ARTS.filter(art => {
      // Exclude already learned arts
      if (newArts.includes(art.id)) return false;
      // Exclude already unlocked arts (to avoid duplicate unlocks)
      if (newUnlockedArts.includes(art.id)) return false;
      // Exclude arts unlocked in this current run
      if (unlockedInThisRun.has(art.id)) return false;
      const artRealmIdx = REALM_ORDER.indexOf(art.realmRequirement);
      const playerRealmIdx = REALM_ORDER.indexOf(prev.realm);
      return artRealmIdx >= 0 && playerRealmIdx >= artRealmIdx && (!art.sectId || art.sectId === prev.sectId);
    });
    if (availableArts.length > 0) {
      // Add randomness: combine deterministic random numbers with true random numbers to select an art
      const selectionSeed = deterministicSeed + availableArts.length;
      const deterministicSelection = Math.abs(Math.sin(selectionSeed)) % 1;
      const randomSelection = Math.random();
      const combinedSelection = deterministicSelection * 0.6 + randomSelection * 0.4;
      const artIndex = Math.floor(combinedSelection * availableArts.length);
      const randomArt = availableArts[artIndex];
      // Comprehending an art only unlocks it, doesn't directly learn it (requires spirit stones to learn)
      // Multiple checks to ensure no duplicate additions
      if (!newUnlockedArts.includes(randomArt.id) &&
        !newArts.includes(randomArt.id) &&
        !unlockedInThisRun.has(randomArt.id)) {
        // Ensure it's added to the unlocked list (using array spread to avoid reference issues)
        newUnlockedArts = [...newUnlockedArts, randomArt.id];
        unlockedInThisRun.add(randomArt.id);
        newStats.artCount += 1;
        artUnlocked = true;
        triggerVisual('special', `🎉 Gained Protocol: 【${randomArt.name}】`, 'special');
        // Always log for transparency
        addLog(`🎉 You decoded Combat Protocol 【${randomArt.name}】! You can now access it in the Training center.`, 'special');

        // Dev info
        if (import.meta.env.DEV) {
          console.log('[Protocol Unlocked]', {
            artId: randomArt.id,
            artName: randomArt.name,
            newUnlockedArts: newUnlockedArts,
            prevUnlockedArts: prev.unlockedArts,
          });
        }
      } else {
        // If already unlocked, log debug info
        if (import.meta.env.DEV) {
          console.log('[Protocol Unlock Skipped]', {
            artId: randomArt.id,
            artName: randomArt.name,
            reason: newUnlockedArts.includes(randomArt.id) ? 'Already unlocked' :
              newArts.includes(randomArt.id) ? 'Already learned' :
                unlockedInThisRun.has(randomArt.id) ? 'Unlocked this run' : 'Unknown',
          });
        }
      }
    } else {
      // If no available arts, log debug info
      if (import.meta.env.DEV) {
        console.log('[Protocol Unlock Failed]', {
          reason: 'No available protocols',
          availableArtsCount: availableArts.length,
          prevUnlockedArtsCount: prev.unlockedArts?.length || 0,
          prevCultivationArtsCount: prev.cultivationArts?.length || 0,
        });
      }
    }
  }

  // Pet Reward
  if (result.petObtained) {
    const template = PET_TEMPLATES.find(t => t.id === result.petObtained);
    if (template) {
      // Check if already own this species
      const hasPet = newPets.some(p => p.species === template.species);
      if (!hasPet) {
        const newPet: Pet = { id: uid(), name: getRandomPetName(template), species: template.species, level: 1, exp: 0, maxExp: 60, rarity: template.rarity, stats: { ...template.baseStats }, skills: [...template.skills], evolutionStage: 0, affection: 50 };
        newPets.push(newPet);
        newStats.petCount += 1;
        // Event description already mentions pet (e.g., "You bonded with it"), so no duplicate prompt here
        // Only prompt if event description doesn't mention pet related keywords
        const storyHasPet = result.story && (
          result.story.includes('Mutant') ||
          result.story.includes('Companion') ||
          result.story.includes('bond') ||
          result.story.includes('follow')
        );
        if (!storyHasPet) {
          addLog(`✨ You gained a Mutant Companion: 【${newPet.name}】!`, 'special');
        }
      } else {
        // If already have it, no duplicate and no log
        addLog(`You encountered a ${template.species}, but you already have one of its kind.`, 'normal');
      }
    }
  }

  // Pet Opportunity
  if (result.petOpportunity && newPets.length > 0) {
    const targetPetId = result.petOpportunity.petId || prev.activePetId;
    const petIdx = newPets.findIndex(p => p.id === targetPetId);
    const pet = petIdx >= 0 ? { ...newPets[petIdx] } : { ...newPets[0] };
    const opp = result.petOpportunity;
    if (opp.type === 'evolution' && pet.evolutionStage < 2) {
      pet.evolutionStage += 1; pet.stats = { attack: pet.stats.attack * 3, defense: pet.stats.defense * 3, hp: pet.stats.hp * 3, speed: pet.stats.speed * 1.5 };
      addLog(`✨ 【${pet.name}】EVOLVED!`, 'special');
    } else if (opp.type === 'level' && opp.levelGain) {
      const gain = Math.min(opp.levelGain, 5); pet.level += gain;
      for (let i = 0; i < gain; i++) { pet.stats.attack *= 1.1; pet.stats.defense *= 1.1; pet.stats.hp *= 1.1; pet.stats.speed *= 1.05; }
      addLog(`✨ 【${pet.name}】LEVELED UP!`, 'special');
    } else if (opp.type === 'stats' && opp.statsBoost) {
      const b = opp.statsBoost; pet.stats.attack += b.attack || 0; pet.stats.defense += b.defense || 0; pet.stats.hp += b.hp || 0; pet.stats.speed += b.speed || 0;
      addLog(`✨ 【${pet.name}】Stats Boosted!`, 'special');
    } else if (opp.type === 'exp' && opp.expGain) {
      pet.exp += opp.expGain;
      while (pet.exp >= pet.maxExp && pet.level < 100) {
        pet.exp -= pet.maxExp; pet.level += 1; pet.maxExp *= 1.5;
        pet.stats.attack *= 1.1; pet.stats.defense *= 1.1; pet.stats.hp *= 1.1; pet.stats.speed *= 1.05;
      }
      // Limit exp if level 100
      if (pet.level >= 100) {
        pet.exp = Math.min(pet.exp, pet.maxExp);
      }
      addLog(`✨ 【${pet.name}】Gained XP!`, 'special');
    }
    newPets[petIdx >= 0 ? petIdx : 0] = pet;
  }

  // Attribute Reduction
  if (result.attributeReduction) {
    const r = result.attributeReduction;
    const totalR = (r.attack || 0) + (r.defense || 0) + (r.spirit || 0) + (r.physique || 0) + (r.speed || 0) + (r.maxHp || 0);
    const totalStats = prev.attack + prev.defense + prev.spirit + prev.physique + prev.speed + prev.maxHp;
    const maxR = totalStats * 0.15;
    const scale = totalR > maxR ? maxR / totalR : 1;

    if (r.attack) newAttack = Math.max(0, newAttack - Math.floor(Math.min(r.attack * scale, prev.attack * 0.1)));
    if (r.defense) newDefense = Math.max(0, newDefense - Math.floor(Math.min(r.defense * scale, prev.defense * 0.1)));
    if (r.spirit) newSpirit = Math.max(0, newSpirit - Math.floor(Math.min(r.spirit * scale, prev.spirit * 0.1)));
    if (r.physique) newPhysique = Math.max(0, newPhysique - Math.floor(Math.min(r.physique * scale, prev.physique * 0.1)));
    if (r.speed) newSpeed = Math.max(0, newSpeed - Math.floor(Math.min(r.speed * scale, prev.speed * 0.1)));
    if (r.maxHp) {
      // Use actual max HP (including bonuses) for calculation
      const totalStats = getPlayerTotalStats(prev);
      const actualMaxHp = totalStats.maxHp;
      const red = Math.floor(Math.min(r.maxHp * scale, actualMaxHp * 0.1));
      newMaxHp = Math.max(actualMaxHp * 0.5, newMaxHp - red);
      newHp = Math.min(newHp, newMaxHp);
    }

    if (isSecretRealm) {
      const hasComp = result.itemObtained || (result.expChange || 0) > 100 * realmMultiplier || (result.spiritStonesChange || 0) > 200 * realmMultiplier;
      if (!hasComp && totalR > 0) { newExp += Math.floor(50 * realmMultiplier); newStones += Math.floor(100 * realmMultiplier); }
    }
  }

  // Talents (Non-Vault only)
  if (!isSecretRealm && !newTalentId && Math.random() < (adventureType === 'lucky' ? 0.05 : realmName ? 0.03 : 0.02)) {
    const available = TALENTS.filter(t => t.id !== 'talent-ordinary' && t.rarity !== 'Mythic');
    if (available.length > 0) {
      const t = available[Math.floor(Math.random() * available.length)];
      newTalentId = t.id; newAttack += t.effects.attack || 0; newDefense += t.effects.defense || 0; newMaxHp += t.effects.hp || 0; newHp += t.effects.hp || 0; newLuck += t.effects.luck || 0;
      addLog(`🌟 You awakened the Perk: 【${t.name}】!`, 'special');
    }
  }

  // Evolutionary material chance
  if (Math.random() < (isSecretRealm ? 0.08 : 0.05)) {
    const m = PET_EVOLUTION_MATERIALS[Math.floor(Math.random() * PET_EVOLUTION_MATERIALS.length)];
    const idx = newInv.findIndex(i => i.name === m.name);
    if (idx >= 0) newInv[idx] = { ...newInv[idx], quantity: newInv[idx].quantity + 1 };
    else newInv.push({ id: uid(), name: m.name, type: ItemType.Material, description: m.description, quantity: 1, rarity: m.rarity as ItemRarity, level: 0 });
    addLog(`🎁 Found Mutant Evolution Material: 【${m.name}】!`, 'gain');
  }

  // Advanced item acquisition logic (changed to add to inventory)
  const currentRealmIndex = REALM_ORDER.indexOf(prev.realm);

  // Pre-War Artifacts: Scavenger/Wastelander stages
  if (currentRealmIndex <= REALM_ORDER.indexOf(RealmType.Foundation)) {
    const foundationChance = isSecretRealm ? 0.08 : (adventureType === 'lucky' ? 0.06 : 0.03);
    if (Math.random() < foundationChance) {
      const treasures = Object.values(FOUNDATION_TREASURES);
      const availableTreasures = treasures.filter(t =>
        !t.requiredLevel || prev.realmLevel >= t.requiredLevel
      );
      if (availableTreasures.length > 0) {
        const selected = availableTreasures[Math.floor(Math.random() * availableTreasures.length)];
        addLog(`✨ You found a Pre-War Artifact: 【${selected.name}】! This is key for reaching the next clearance level!`, 'special');
        // Add to inventory
        newInv.push({
          id: uid(),
          name: selected.name,
          type: ItemType.AdvancedItem,
          description: selected.description,
          quantity: 1,
          rarity: selected.rarity,
          advancedItemType: 'foundationTreasure',
          advancedItemId: selected.id,
        });
      }
    }
  }

  // Nuclear Essence: Mutant/Evolved stages
  if (currentRealmIndex >= REALM_ORDER.indexOf(RealmType.GoldenCore) && currentRealmIndex <= REALM_ORDER.indexOf(RealmType.NascentSoul)) {
    const essenceChance = isSecretRealm ? 0.06 : (adventureType === 'lucky' ? 0.05 : 0.025);
    if (Math.random() < essenceChance) {
      const essences = Object.values(HEAVEN_EARTH_ESSENCES);
      if (essences.length > 0) {
        const selected = essences[Math.floor(Math.random() * essences.length)];
        addLog(`✨ You found Nuclear Essence: 【${selected.name}】! Essential for evolving your mutations!`, 'special');
        // Add to inventory
        newInv.push({
          id: uid(),
          name: selected.name,
          type: ItemType.AdvancedItem,
          description: selected.description,
          quantity: 1,
          rarity: selected.rarity,
          advancedItemType: 'heavenEarthEssence',
          advancedItemId: selected.id,
        });
      }
    }
  }

  // Quantum Marrow: Evolved/Apex stages
  const nascentSoulIndex = REALM_ORDER.indexOf(RealmType.NascentSoul);
  if (currentRealmIndex >= nascentSoulIndex) {
    const isNascentSoul = currentRealmIndex === nascentSoulIndex;
    const marrowChance = isNascentSoul
      ? (isSecretRealm ? 0.15 : (adventureType === 'lucky' ? 0.08 : 0.08))
      : (isSecretRealm ? 0.10 : (adventureType === 'lucky' ? 0.12 : 0.08));
    if (Math.random() < marrowChance) {
      const marrows = Object.values(HEAVEN_EARTH_MARROWS);
      if (marrows.length > 0) {
        const selected = marrows[Math.floor(Math.random() * marrows.length)];
        addLog(`✨ You found Quantum Marrow: 【${selected.name}】! You feel your genetic code rewrite itself!`, 'special');
        // Add to inventory
        newInv.push({
          id: uid(),
          name: selected.name,
          type: ItemType.AdvancedItem,
          description: selected.description,
          quantity: 1,
          rarity: selected.rarity,
          advancedItemType: 'heavenEarthMarrow',
          advancedItemId: selected.id,
        });
      }
    }
  }

  // Wasteland Rule: from event templates
  if (result.longevityRuleObtained) {
    const ruleId = result.longevityRuleObtained;
    const rule = LONGEVITY_RULES[ruleId];
    if (rule) {
      const currentRules = prev.longevityRules || [];
      const maxRules = prev.maxLongevityRules || 3;
      if (!currentRules.includes(ruleId) && currentRules.length < maxRules) {
        addLog(`✨ You mastered a Wasteland Rule: 【${rule.name}】! You now command the elements of the wastes!`, 'special');
        // Add to inventory
        newInv.push({
          id: uid(),
          name: rule.name,
          type: ItemType.AdvancedItem,
          description: rule.description,
          quantity: 1,
          rarity: 'Mythic',
          advancedItemType: 'longevityRule',
          advancedItemId: rule.id,
        });
      } else if (currentRules.includes(ruleId)) {
        addLog(`You already master the Rule: 【${rule.name}】.`, 'normal');
      } else if (currentRules.length >= maxRules) {
        addLog(`You have reached the limit of Wasteland Rules you can master.`, 'normal');
      }
    }
  } else if (currentRealmIndex >= REALM_ORDER.indexOf(RealmType.LongevityRealm)) {
    const rulesChance = isSecretRealm && riskLevel === 'Extreme' ? 0.12 : (adventureType === 'dao_combining_challenge' ? 0.4 : 0.02);
    if (Math.random() < rulesChance) {
      const rules = Object.values(LONGEVITY_RULES);
      const currentRules = prev.longevityRules || [];
      const availableRules = rules.filter(r => !currentRules.includes(r.id));
      if (availableRules.length > 0) {
        const selected = availableRules[Math.floor(Math.random() * availableRules.length)];
        const maxRules = prev.maxLongevityRules || 3;
        if (currentRules.length < maxRules) {
          addLog(`✨ You mastered a Wasteland Rule: 【${selected.name}】! You now command the elements of the wastes!`, 'special');
          // Add to inventory
          newInv.push({
            id: uid(),
            name: selected.name,
            type: ItemType.AdvancedItem,
            description: selected.description,
            quantity: 1,
            rarity: 'Mythic',
            advancedItemType: 'longevityRule',
            advancedItemId: selected.id,
          });
        }
      }
    }
  }

  // Victory in Heaven Earth Soul challenge: grant corresponding Heaven Earth Soul Art (displayed as advanced item)
  if (adventureType === 'dao_combining_challenge' && battleContext?.victory && battleContext?.bossId) {
    const bossId = battleContext.bossId;
    const boss = HEAVEN_EARTH_SOUL_BOSSES[bossId];

    if (boss) {
      // Find corresponding Heaven Earth Soul Art based on bossId
      const soulArt = CULTIVATION_ARTS.find(art =>
        (art as any).isHeavenEarthSoulArt && (art as any).bossId === bossId
      );

      if (soulArt && !newUnlockedArts.includes(soulArt.id)) {
        // Add to unlocked arts list
        newUnlockedArts.push(soulArt.id);

        // Also add to inventory as advanced item (for display in advanced items)
        // Note: Art's hp property needs to be converted to permanentEffect's maxHp
        const permanentEffect: any = {
          attack: soulArt.effects.attack,
          defense: soulArt.effects.defense,
          hp: soulArt.effects.hp,
          spirit: soulArt.effects.spirit,
          physique: soulArt.effects.physique,
          speed: soulArt.effects.speed,
          expRate: soulArt.effects.expRate,
          maxHp: soulArt.effects.hp || 0,
        };

        const soulArtItem: Item = {
          id: uid(),
          name: soulArt.name,
          type: ItemType.AdvancedItem,
          description: soulArt.description,
          quantity: 1,
          rarity: 'Mythic',
          isEquippable: false,
          effect: {},
          permanentEffect: permanentEffect,
          advancedItemType: 'heavenEarthEssence' as const,
          advancedItemId: soulArt.id,
        };

        // Check if item with same name already exists
        const existingIdx = newInv.findIndex(i => i.name === soulArt.name);
        if (existingIdx >= 0) {
          newInv[existingIdx] = { ...newInv[existingIdx], quantity: newInv[existingIdx].quantity + 1 };
        } else {
          newInv.push(soulArtItem);
        }

        addLog(`🌟 You decoded the essence of the Wasteland Entity 【${boss.name}】! You gained the protocol: 【${soulArt.name}】!`, 'special');
        addLog(`✨ Protocol added to Advanced Tech. View details in the Advanced interface.`, 'gain');
      }
    }
  }

  // Lottery tickets settlement (prioritize changes from event template)
  if (result.lotteryTicketsChange !== undefined) {
    newLotteryTickets = Math.max(0, newLotteryTickets + result.lotteryTicketsChange);
    if (result.lotteryTicketsChange > 0) {
      addLog(`🎫 Found ${result.lotteryTicketsChange} Lottery Tickets!`, 'gain');
    }
  } else {
    // 5% chance if not in template
    if (Math.random() < 0.05) {
      const count = Math.floor(Math.random() * 10) + 1;
      newLotteryTickets = Math.max(0, newLotteryTickets + count);
      addLog(`🎫 Found ${count} Lottery Tickets!`, 'gain');
    }
  }

  // Inheritance level acquisition (only via event template, not random)
  // If event template specifies inheritance level change, apply it
  if ((result.inheritanceLevelChange || 0) > 0) {
    const oldLevel = newInheritanceLevel;
    // Inheritance level increases by 1 each time, up to max 4
    newInheritanceLevel = Math.min(4, newInheritanceLevel + 1);
    if (newInheritanceLevel > oldLevel) {
      addLog(`🌟 You found an Ancient Inheritance! Vault Level increased to ${newInheritanceLevel}!`, 'special');
    }
  }

  // Lifespan loss
  const lifespanLoss = isSecretRealm ? 1.0 : (riskLevel === 'Low' ? 0.3 : riskLevel === 'Medium' ? 0.6 : riskLevel === 'High' ? 1.0 : riskLevel === 'Extreme' ? 1.5 : 0.4);
  newLifespan = Math.max(0, Math.min(prev.maxLifespan, newLifespan + (result.lifespanChange || 0) - lifespanLoss));

  // Spiritual Roots change
  if (result.spiritualRootsChange) {
    const src = result.spiritualRootsChange;
    newSpiritualRoots = {
      metal: Math.min(100, Math.max(0, (newSpiritualRoots.metal || 0) + (src.metal || 0))),
      wood: Math.min(100, Math.max(0, (newSpiritualRoots.wood || 0) + (src.wood || 0))),
      water: Math.min(100, Math.max(0, (newSpiritualRoots.water || 0) + (src.water || 0))),
      fire: Math.min(100, Math.max(0, (newSpiritualRoots.fire || 0) + (src.fire || 0))),
      earth: Math.min(100, Math.max(0, (newSpiritualRoots.earth || 0) + (src.earth || 0))),
    };
  }

  // Cultivation and Spirit Stones settlement
  newExp = Math.max(0, newExp + (result.expChange || 0));
  newStones = Math.max(0, newStones + (result.spiritStonesChange || 0));
  newReputation = Math.max(0, newReputation + (result.reputationChange || 0));

  // Calculate actual max HP (including art bonuses etc.)
  // First build updated player state to calculate actual max HP
  const updatedPlayer = {
    ...prev,
    maxHp: newMaxHp,
    hp: newHp,
    attack: newAttack,
    defense: newDefense,
    spirit: newSpirit,
    physique: newPhysique,
    speed: newSpeed,
    cultivationArts: newArts,
    activeArtId: prev.activeArtId,
    goldenCoreMethodCount: prev.goldenCoreMethodCount,
    spiritualRoots: newSpiritualRoots,
  };
  const totalStats = getPlayerTotalStats(updatedPlayer);
  const actualMaxHp = totalStats.maxHp;

  // Calculate HP change: calculate based directly on actual max HP
  // Adjust current HP proportionally to actual max HP (if art increased max HP)
  const baseMaxHp = newMaxHp || 1; // Avoid division by zero
  const hpRatio = baseMaxHp > 0 ? newHp / baseMaxHp : 0; // Current HP ratio
  const adjustedHp = Math.floor(actualMaxHp * hpRatio); // Adjust proportionally to actual max HP

  // Apply HP change, use actual max HP as upper limit
  let finalHp = adjustedHp + (result.hpChange || 0);
  // Limit between 0 and actual max HP
  finalHp = Math.max(0, Math.min(actualMaxHp, finalHp));

  // Secret realm: Ensure HP is non-negative
  if (isSecretRealm) {
    finalHp = Math.max(0, finalHp);
  }

  // Sync newly learned arts to unlocked list (ensure newly learned arts are also in unlocked list)
  // Use Set to ensure uniqueness
  const finalUnlockedArtsSet = new Set(newUnlockedArts);
  newArts.forEach(id => finalUnlockedArtsSet.add(id));
  newUnlockedArts = Array.from(finalUnlockedArtsSet);

  return {
    ...prev, hp: finalHp, exp: newExp, spiritStones: newStones, inventory: newInv, cultivationArts: newArts, unlockedArts: newUnlockedArts,
    talentId: newTalentId, attack: newAttack, defense: newDefense, maxHp: newMaxHp, spirit: newSpirit, physique: newPhysique, speed: newSpeed,
    luck: newLuck, lotteryTickets: newLotteryTickets, inheritanceLevel: newInheritanceLevel, pets: newPets, statistics: newStats, lifespan: newLifespan, spiritualRoots: newSpiritualRoots, reputation: newReputation
  };
};

export async function executeAdventureCore({
  result, battleContext, petSkillCooldowns, player, setPlayer, addLog, triggerVisual, onOpenBattleModal, realmName, adventureType, riskLevel, skipBattle, skipReputationEvent, onReputationEvent, onPauseAutoAdventure
}: ExecuteAdventureCoreProps & { riskLevel?: RiskLevel; }) {
  // Visual Effects
  const safeHpChange = result.hpChange || 0;
  if (safeHpChange < 0) {
    triggerVisual('damage', String(safeHpChange), 'text-red-500');
    document.body?.classList.add('animate-shake'); setTimeout(() => document.body?.classList.remove('animate-shake'), 500);
  } else if (safeHpChange > 0) {
    triggerVisual('heal', `+${safeHpChange}`, 'text-emerald-400');
  }
  if (result.eventColor === 'danger' || adventureType === 'secret_realm') triggerVisual('slash');

  // Apply Main Result
  // Determine if it is a Secret Realm
  const isSecretRealm = adventureType === 'secret_realm';

  // Before applying result, check if Heaven Earth Soul is triggered, if so pause auto adventure immediately
  if ((result.adventureType === 'dao_combining_challenge' || result.heavenEarthSoulEncounter)) {
    onPauseAutoAdventure?.();
  }

  // Handle Hunt Battle Result (Only handle here if in hunt state, normal sect challenge not handled here)
  // Note: Must apply battle result (including HP change) first, then handle hunt special logic
  const isHuntBattle = adventureType === 'sect_challenge' &&
    player.sectHuntSectId &&
    player.sectHuntEndTime &&
    player.sectHuntEndTime > Date.now() &&
    player.sectId === null; // Ensure not challenging inside own sect

  if (isHuntBattle && battleContext && battleContext.victory) {
    const huntLevel = player.sectHuntLevel || 0;
    const huntSectId = player.sectHuntSectId;

    // Apply battle result first (including HP change), then update hunt status
    setPlayer((prev) => {
      // Apply battle result first
      const updatedPlayer = applyResultToPlayer(prev, result, { isSecretRealm, adventureType, realmName, riskLevel, battleContext, petSkillCooldowns, addLog, triggerVisual });

      if (huntLevel >= 3) {
        // Defeated Overseer, become Overseer
        // Prioritize saved sect name, otherwise find in SECTS, lastly use ID
        let sectName = player.sectHuntSectName;
        if (!sectName) {
          const sect = SECTS.find((s) => s.id === huntSectId);
          sectName = sect ? sect.name : huntSectId;
        }

        addLog(`🎉 You defeated the Overseer of 【${sectName}】! The entire Faction is in shock. You have taken control of the Faction as the new Overseer!`, 'special');

        return {
          ...updatedPlayer,
          sectId: huntSectId,
          sectRank: SectRank.Leader,
          sectMasterId: 'player-leader', // Set to player ID when becoming leader
          sectHuntEndTime: null, // Clear hunt status
          sectHuntLevel: 0,
          sectHuntSectId: null,
          sectHuntSectName: null,
          sectContribution: 0,
        };
      } else {
        // Defeated disciples/elders, increase hunt intensity
        const newHuntLevel = Math.min(3, huntLevel + 1);
        const levelNames = ['Recruit', 'Veteran', 'Paladin', 'Overseer'];
        // Prioritize saved sect name, otherwise find in SECTS, lastly use ID
        let sectName = player.sectHuntSectName;
        if (!sectName) {
          const sect = SECTS.find((s) => s.id === huntSectId);
          sectName = sect ? sect.name : huntSectId;
        }

        addLog(`⚠️ You neutralized a ${levelNames[huntLevel]} of 【${sectName}】! The Faction is enraged and will send stronger hunters!`, 'danger');

        return {
          ...updatedPlayer,
          sectHuntLevel: newHuntLevel,
        };
      }
    });
  } else {
    // Non-hunt battle or non-victory, apply result directly (including HP change)
    setPlayer(prev => applyResultToPlayer(prev, result, { isSecretRealm, adventureType, realmName, riskLevel, battleContext, petSkillCooldowns, addLog, triggerVisual }));
  }

  // Events & Logs
  if (result.reputationEvent) {
    if (skipReputationEvent) {
      const eventTitle = result.reputationEvent.title || result.reputationEvent.text || 'Wasteland Event';
      addLog(`📜 Encountered: ${eventTitle}, Skipping...`, 'normal');
    } else if (onReputationEvent) {
      const eventTitle = result.reputationEvent.title || result.reputationEvent.text || 'Wasteland Event';
      addLog(`📜 Encountered: ${eventTitle}`, 'special');

      if (import.meta.env.MODE === 'development') {
        console.log('[Wasteland Event Triggered]', {
          hasEvent: !!result.reputationEvent,
          hasCallback: !!onReputationEvent,
          event: result.reputationEvent,
          choicesCount: result.reputationEvent.choices?.length || 0,
        });
      }

      onReputationEvent(result.reputationEvent);
    } else {
      if (import.meta.env.MODE === 'development') {
        console.warn('[Wasteland Event Warning] Event present but no callback', result.reputationEvent);
      }
    }
  }

  // Ensure event description is added to log
  if (result.story && result.story.trim()) {
    addLog(result.story, result.eventColor || 'normal');
  } else {
    addLog('Nothing unusual happened during your trek through the wastes.', 'normal');
  }

  if (import.meta.env.MODE === 'development' && (result.expChange || result.spiritStonesChange || result.hpChange)) {
    const changes: string[] = [];
    if (result.expChange) changes.push(`XP ${result.expChange > 0 ? '+' : ''}${result.expChange}`);
    if (result.spiritStonesChange) changes.push(`Caps ${result.spiritStonesChange > 0 ? '+' : ''}${result.spiritStonesChange}`);
    if (result.hpChange) changes.push(`HP ${result.hpChange > 0 ? '+' : ''}${result.hpChange}`);
    if (changes.length > 0) {
      addLog(`📊 ${changes.join(' | ')}`, result.eventColor || 'normal');
    }
  }

  if (result.lifespanChange) addLog(result.lifespanChange > 0 ? `✨ Lifespan increased by ${result.lifespanChange.toFixed(1)} days` : `⚠️ Lifespan decreased by ${Math.abs(result.lifespanChange).toFixed(1)} days`, result.lifespanChange > 0 ? 'gain' : 'danger');
  if (result.spiritualRootsChange) {
    const names: any = { metal: 'STR', wood: 'PER', water: 'END', fire: 'CHA', earth: 'INT' };
    Object.entries(result.spiritualRootsChange).forEach(([k, v]) => { if (v) addLog(v > 0 ? `✨ ${names[k]} Affiliation increased by ${v}` : `⚠️ ${names[k]} Affiliation decreased by ${Math.abs(v)}`, v > 0 ? 'gain' : 'danger'); });
  }

  const items = [...(result.itemsObtained || [])]; if (result.itemObtained) items.push(result.itemObtained);
  items.forEach(i => { if (i?.name) addLog(`Gained: ${normalizeRarityValue(i.rarity) ? `【${normalizeRarityValue(i.rarity)}】` : ''}${i.name}`, 'gain'); });

  // Battle modal delayed opening (if not skipped)
  if (battleContext && !skipBattle) {
    setTimeout(() => {
      onOpenBattleModal(battleContext);
    }, 2000);
  }

  // Trigger Secret Realm
  if (result.triggerSecretRealm) {
    setTimeout(() => {
      addLog(`Entering the depths of the Vault...`, 'special');
      initializeEventTemplateLibrary();
      const srTemplate = getRandomEventTemplate('secret_realm', undefined, player.realm, player.realmLevel);

      if (srTemplate) {
        // Use actual max HP (including bonuses)
        const totalStats = getPlayerTotalStats(player);
        const srResult = templateToAdventureResult(srTemplate, {
          realm: player.realm,
          realmLevel: player.realmLevel,
          maxHp: totalStats.maxHp,
        });
        setPlayer(prev => applyResultToPlayer(prev, srResult, { isSecretRealm: true, adventureType: 'secret_realm', addLog, triggerVisual }));
        addLog(srResult.story, srResult.eventColor);
        const srItems = [...(srResult.itemsObtained || [])]; if (srResult.itemObtained) srItems.push(srResult.itemObtained);
        srItems.forEach(i => { if (i?.name) addLog(`Gained: ${normalizeRarityValue(i.rarity) ? `【${normalizeRarityValue(i.rarity)}】` : ''}${i.name}`, 'gain'); });
      } else {
        const defaultSrResult: AdventureResult = {
          story: 'You explored the depths of the Vault, but found nothing special.',
          hpChange: 0,
          expChange: Math.floor(50 * (1 + REALM_ORDER.indexOf(player.realm) * 0.3)),
          spiritStonesChange: Math.floor(100 * (1 + REALM_ORDER.indexOf(player.realm) * 0.3)),
          eventColor: 'normal',
        };
        setPlayer(prev => applyResultToPlayer(prev, defaultSrResult, { isSecretRealm: true, adventureType: 'secret_realm', addLog, triggerVisual }));
        addLog(defaultSrResult.story, defaultSrResult.eventColor);
      }
    }, 1000);
  }
}
