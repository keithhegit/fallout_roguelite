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
import { getAllArtifacts, getItemFromConstants } from '../../utils/itemConstantsUtils';
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
  skipReputationEvent?: boolean; // 是否跳过声望事件
  onReputationEvent?: (event: AdventureResult['reputationEvent']) => void;
  onPauseAutoAdventure?: () => void; // 暂停自动历练回调（用于天地之魄等特殊事件）
}

// 已移除 ensureEquipmentAttributes 函数
// 不再调整装备属性，直接使用常量池中的原始属性

/**
 * 核心玩家状态更新逻辑 (Refactored)
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

  let newInv = [...prev.inventory];
  let newArts = [...prev.cultivationArts];
  // 使用 Set 确保唯一性，然后转回数组
  // 修复：初始化 Set 时应包含 prev.unlockedArts，确保之前已解锁的功法不被丢失
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

  // 灵宠冷却
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

  // 物品处理逻辑
  const itemsToProcess = [...(result.itemsObtained || [])];
  if (result.itemObtained) itemsToProcess.push(result.itemObtained);

  const currentBatchNames = new Set<string>();
  itemsToProcess.forEach(itemData => {
    // 修复：提前检查 itemData 是否有效，避免无效数据导致处理失败
    if (!itemData || !itemData.name) {
      console.error('Item data is null/undefined or has no name, skipping:', itemData);
      return;
    }

    // 将变量声明移到 try 块外部，以便 catch 块也能访问
    let itemName = '';
    let itemType = ItemType.Material;
    let itemRarity: ItemRarity = 'Common';
    let isEquippable = false;
    let equipmentSlot: EquipmentSlot | undefined = undefined;
    let finalEffect: any = undefined;
    let finalPermanentEffect: any = undefined;

    try {
      itemName = itemData.name.trim();
      itemType = (itemData.type as ItemType) || ItemType.Material;
      isEquippable = !!itemData.isEquippable;
      equipmentSlot = itemData.equipmentSlot as EquipmentSlot | undefined;

      // 修复：神神秘法宝处理只对普通物品生效，避免高级物品被替换
      const isBasicItem = !(itemData as any).advancedItemType &&
        !(itemData as any).advancedItemId &&
        !(itemData as any).recipeData;

      if (isBasicItem && (itemName.includes('Relic') || itemName.includes('Artifact'))) {
        // 从常量池获取随机法宝
        const artifacts = getAllArtifacts();
        if (artifacts.length > 0) {
          const randomArtifact = artifacts[Math.floor(Math.random() * artifacts.length)];
          itemName = randomArtifact.name;
          itemType = randomArtifact.type;
          isEquippable = randomArtifact.isEquippable || true;
          equipmentSlot = (randomArtifact.equipmentSlot as EquipmentSlot) || (Math.random() < 0.5 ? EquipmentSlot.Artifact1 : EquipmentSlot.Artifact2);
          // 使用常量池中的描述和效果
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
          // 如果常量池中没有法宝，使用默认处理
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
        if ((itemFromConstants as any).advancedItemType && !(itemData as any).advancedItemType) {
          (itemData as any).advancedItemType = (itemFromConstants as any).advancedItemType;
        }
        if ((itemFromConstants as any).advancedItemId && !(itemData as any).advancedItemId) {
          (itemData as any).advancedItemId = (itemFromConstants as any).advancedItemId;
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
        let baseName = itemName;
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
      let recipeData = undefined;
      if (itemType === ItemType.Recipe) {
        let recipeName = (itemData as any).recipeName || itemName.replace(/Recipe$/, '');
        recipeData = DISCOVERABLE_RECIPES.find(r => r.name === recipeName);
      }

      const existingIdx = newInv.findIndex(i => i.name === itemName);
      if (existingIdx >= 0 && !isEquippable && itemType !== ItemType.Recipe) {
        newInv[existingIdx] = { ...newInv[existingIdx], quantity: newInv[existingIdx].quantity + 1 };
      } else {
        let reviveChances = (itemData as any).reviveChances;
        if (reviveChances === undefined && (itemRarity === 'Legendary' || itemRarity === 'Mythic') && (itemType === ItemType.Weapon || itemType === ItemType.Artifact)) {
          if (Math.random() < (itemRarity === 'Legendary' ? 0.3 : 0.6)) reviveChances = Math.floor(Math.random() * 3) + 1;
        }
        // Ensure equipment does not have permanentEffect
        const equipmentPermanentEffect = isEquippable ? undefined : finalPermanentEffect;
        // Pass advanced item related fields
        const advancedItemType = (itemData as any).advancedItemType;
        const advancedItemId = (itemData as any).advancedItemId;
        newInv.push({ id: uid(), name: itemName, type: itemType, description: itemData.description, quantity: 1, rarity: itemRarity, level: 0, isEquippable, equipmentSlot, effect: finalEffect, permanentEffect: equipmentPermanentEffect, recipeData, reviveChances, advancedItemType, advancedItemId });
      }
    } catch (e) {
      console.error('Item processing error:', e);
      // Ensure item is added even if an error occurs (using default values)
      const fallbackItem = {
        id: uid(),
        name: itemName,
        type: itemType,
        description: itemData?.description || 'Undescribed Item',
        quantity: 1,
        rarity: itemRarity,
        level: (itemData as any)?.level || 0,
        isEquippable: false,
        effect: finalEffect || {},
        permanentEffect: undefined,
        // Add missing equipment properties
        equipmentSlot: equipmentSlot || undefined,
        recipeData: (itemData as any)?.recipeData,
        reviveChances: (itemData as any)?.reviveChances,
        advancedItemType: (itemData as any)?.advancedItemType,
        advancedItemId: (itemData as any)?.advancedItemId
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
        console.log('【功法解锁失败】', {
          reason: '没有可用的功法',
          availableArtsCount: availableArts.length,
          prevUnlockedArtsCount: prev.unlockedArts?.length || 0,
          prevCultivationArtsCount: prev.cultivationArts?.length || 0,
        });
      }
    }
  }

  // 灵宠奖励
  if (result.petObtained) {
    const template = PET_TEMPLATES.find(t => t.id === result.petObtained);
    if (template) {
      // 检查是否已拥有该种类的灵宠
      const hasPet = newPets.some(p => p.species === template.species);
      if (!hasPet) {
        const newPet: Pet = { id: uid(), name: getRandomPetName(template), species: template.species, level: 1, exp: 0, maxExp: 60, rarity: template.rarity, stats: { ...template.baseStats }, skills: [...template.skills], evolutionStage: 0, affection: 50 };
        newPets.push(newPet);
        newStats.petCount += 1;
        // 事件描述中已经提到了灵宠（如"你与它建立了联系"），这里不再重复提示
        // 只在事件描述中没有提到灵宠相关词汇时才添加提示
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

  // 灵宠机缘
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

  // 属性降低
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
      // 使用实际最大血量（包含金丹法数加成等）进行计算
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

  // 进阶物品获取逻辑（改为添加到背包）
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

  // 天地之魄挑战胜利：给予对应天地之魄功法（作为进阶物品显示）
  if (adventureType === 'dao_combining_challenge' && battleContext?.victory && battleContext?.bossId) {
    const bossId = battleContext.bossId;
    const boss = HEAVEN_EARTH_SOUL_BOSSES[bossId];

    if (boss) {
      // 根据bossId查找对应的天地之魄功法
      const soulArt = CULTIVATION_ARTS.find(art =>
        (art as any).isHeavenEarthSoulArt && (art as any).bossId === bossId
      );

      if (soulArt && !newUnlockedArts.includes(soulArt.id)) {
        // 添加到功法解锁列表
        newUnlockedArts.push(soulArt.id);

        // 同时作为进阶物品添加到背包（用于在进阶物品中显示）
        // 注意：功法的 hp 属性需要转换为 permanentEffect 的 maxHp
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

        // 检查是否已存在同名物品
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

  // 抽奖券结算（优先处理事件模板中的抽奖券变化）
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

  // 传承等级获取（只能通过事件模板获得，不能随机获得）
  // 如果事件模板中指定了传承等级变化，则应用
  if ((result.inheritanceLevelChange || 0) > 0) {
    const oldLevel = newInheritanceLevel;
    // 传承等级每次只能增加1级，最多到4级
    newInheritanceLevel = Math.min(4, newInheritanceLevel + 1);
    if (newInheritanceLevel > oldLevel) {
      addLog(`🌟 You found an Ancient Inheritance! Vault Level increased to ${newInheritanceLevel}!`, 'special');
    }
  }

  // Lifespan loss
  const lifespanLoss = isSecretRealm ? 1.0 : (riskLevel === 'Low' ? 0.3 : riskLevel === 'Medium' ? 0.6 : riskLevel === 'High' ? 1.0 : riskLevel === 'Extreme' ? 1.5 : 0.4);
  newLifespan = Math.max(0, Math.min(prev.maxLifespan, newLifespan + (result.lifespanChange || 0) - lifespanLoss));

  // 灵根变化
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

  // 修为灵石结算
  newExp = Math.max(0, newExp + (result.expChange || 0));
  newStones = Math.max(0, newStones + (result.spiritStonesChange || 0));

  // 计算实际最大血量（包含功法加成等）
  // 先构建更新后的玩家状态来计算实际最大血量
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

  // 计算血量变化：直接基于实际最大血量进行计算
  // 按比例调整当前血量到实际最大血量（如果功法增加了最大血量）
  const baseMaxHp = newMaxHp || 1; // 避免除零
  const hpRatio = baseMaxHp > 0 ? newHp / baseMaxHp : 0; // 当前血量比例
  const adjustedHp = Math.floor(actualMaxHp * hpRatio); // 按比例调整到实际最大血量

  // 应用血量变化，使用实际最大血量作为上限
  let finalHp = adjustedHp + (result.hpChange || 0);
  // 限制在 0 到实际最大血量之间
  finalHp = Math.max(0, Math.min(actualMaxHp, finalHp));

  // Secret realm: Ensure HP is non-negative
  if (isSecretRealm) {
    finalHp = Math.max(0, finalHp);
  }

  // 同步新学习的功法到解锁列表（确保新学习的功法也在解锁列表中）
  // 使用 Set 确保唯一性
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
  // 根据 adventureType 判断是否为秘境
  const isSecretRealm = adventureType === 'secret_realm';

  // 在应用结果之前，检查是否触发了天地之魄，如果是则立即暂停自动历练
  if ((result.adventureType === 'dao_combining_challenge' || result.heavenEarthSoulEncounter)) {
    onPauseAutoAdventure?.();
  }

  // 处理追杀战斗结果（只有在追杀状态下才处理，正常挑战宗主不在这里处理）
  // 注意：必须先应用战斗结果（包括血量变化），然后再处理追杀相关的特殊逻辑
  const isHuntBattle = adventureType === 'sect_challenge' &&
    player.sectHuntSectId &&
    player.sectHuntEndTime &&
    player.sectHuntEndTime > Date.now() &&
    player.sectId === null; // 确保不是在宗门内正常挑战

  if (isHuntBattle && battleContext && battleContext.victory) {
    const huntLevel = player.sectHuntLevel || 0;
    const huntSectId = player.sectHuntSectId;

    // 先应用战斗结果（包括血量变化），然后再更新追杀相关状态
    setPlayer((prev) => {
      // 先应用战斗结果，包括血量变化
      const updatedPlayer = applyResultToPlayer(prev, result, { isSecretRealm, adventureType, realmName, riskLevel, battleContext, petSkillCooldowns, addLog, triggerVisual });

      if (huntLevel >= 3) {
        // 战胜宗主，成为宗主
        // 优先使用保存的宗门名称，否则从SECTS中查找，最后使用ID
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
          sectMasterId: 'player-leader', // 玩家成为宗主时，设置为玩家标识
          sectHuntEndTime: null, // 清除追杀状态
          sectHuntLevel: 0,
          sectHuntSectId: null,
          sectHuntSectName: null,
          sectContribution: 0,
        };
      } else {
        // Defeated disciples/elders, increase hunt intensity
        const newHuntLevel = Math.min(3, huntLevel + 1);
        const levelNames = ['Recruit', 'Veteran', 'Paladin', 'Overseer'];
        // 优先使用保存的宗门名称，否则从SECTS中查找，最后使用ID
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
    // 非追杀战斗或非胜利情况，直接应用结果（包括血量变化）
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

  // 确保事件描述被添加到日志
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

  // 战斗弹窗延迟2秒后打开（如果跳过了战斗则不打开弹窗）
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
        // 使用实际最大血量（包含金丹法数加成等）
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
