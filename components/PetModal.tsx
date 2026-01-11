import React, { useState } from 'react';
import {
  X,
  Heart,
  Zap,
  Shield,
  Swords,
  Droplet,
  Package,
  Sparkles,
  Layers,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { PlayerStats, Pet, ItemRarity } from '../types';
import { PET_TEMPLATES, RARITY_MULTIPLIERS, REALM_ORDER } from '../constants/index';
import BatchFeedModal from './BatchFeedModal';
import BatchReleaseModal from './BatchReleaseModal';
import { getRarityTextColor } from '../utils/rarityUtils';
import { ASSETS } from '../constants/assets';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  onActivatePet: (petId: string) => void;
  onDeactivatePet?: () => void;
  onFeedPet: (
    petId: string,
    feedType: 'hp' | 'item' | 'exp',
    itemId?: string
  ) => void;
  onBatchFeedItems?: (petId: string, itemIds: string[]) => void;
  onBatchFeedHp?: (petId: string) => void;
  onEvolvePet: (petId: string) => void;
  onReleasePet?: (petId: string) => void;
  onBatchReleasePets?: (petIds: string[]) => void;
}

const PetModal: React.FC<Props> = ({
  isOpen,
  onClose,
  player,
  onActivatePet,
  onDeactivatePet,
  onFeedPet,
  onBatchFeedItems,
  onBatchFeedHp,
  onEvolvePet,
  onReleasePet,
  onBatchReleasePets,
}) => {
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [feedType, setFeedType] = useState<'hp' | 'item' | 'exp' | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isBatchFeedOpen, setIsBatchFeedOpen] = useState(false);
  const [batchFeedPetId, setBatchFeedPetId] = useState<string | null>(null);
  const [expandedPetIds, setExpandedPetIds] = useState<Set<string>>(new Set());
  const [isBatchReleaseOpen, setIsBatchReleaseOpen] = useState(false);
  const [releaseConfirmPetId, setReleaseConfirmPetId] = useState<string | null>(null);

  if (!isOpen) return null;

  const activePet = player.pets.find((p) => p.id === player.activePetId);

  // Get creature image
  const getPetImage = (pet: Pet) => {
    const template = PET_TEMPLATES.find((t) => t.species === pet.species);
    return template?.image || '🐾';
  };

  // Feedable items (all unequipped items)
  const equippedItemIds = new Set(Object.values(player.equippedItems).filter(Boolean));
  const feedableItems = player.inventory.filter(item =>
    !equippedItemIds.has(item.id) && item.quantity > 0
  );

  const handleFeedClick = (petId: string) => {
    setSelectedPetId(petId);
    setFeedType(null);
    setSelectedItemId(null);
  };

  const handleFeedConfirm = () => {
    if (!selectedPetId || !feedType) return;
    if (feedType === 'item' && !selectedItemId) return;

    onFeedPet(selectedPetId, feedType, selectedItemId || undefined);
    setSelectedPetId(null);
    setFeedType(null);
    setSelectedItemId(null);
  };

  const handleFeedCancel = () => {
    setSelectedPetId(null);
    setFeedType(null);
    setSelectedItemId(null);
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-end md:items-center justify-center z-50 p-0 md:p-4 backdrop-blur-sm touch-manipulation"
      onClick={onClose}
    >
      <div
        className="bg-ink-950 w-full h-[80vh] md:h-auto md:max-w-3xl md:rounded-none border-0 md:border border-stone-800 shadow-2xl flex flex-col md:max-h-[90vh] relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
        {/* CRT Scanline Effect */}
        <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none z-50"></div>
        
        <div className="p-3 md:p-4 border-b border-stone-800 flex justify-between items-center bg-stone-950 z-10">
          <h2 className="text-lg md:text-xl font-serif text-amber-400">
            Creature Taming System
          </h2>
          <button
            title="Close"
            onClick={onClose}
            className="text-stone-400 active:text-white min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
          >
            <X size={24} />
          </button>
        </div>

        <div className="modal-scroll-container modal-scroll-content p-6 space-y-6 bg-ink-950/50 z-10">
          {/* Currently Active Creature */}
          {activePet && (
            <div className="bg-stone-900 rounded p-4 border-2 border-yellow-600">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-4xl">{getPetImage(activePet)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-yellow-400">
                      {activePet.name}
                    </span>
                    <span className="text-xs text-stone-500">
                      ({activePet.species})
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-xs bg-yellow-600 text-black px-2 py-1 rounded">
                        Active
                      </span>
                      {onDeactivatePet && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeactivatePet();
                          }}
                          className="text-xs px-2 py-1 bg-stone-700 hover:bg-stone-600 rounded text-stone-300"
                          title="Dismiss"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <Swords className="text-red-400" size={16} />
                  <span className="text-sm">
                    FP: {Math.floor(activePet.stats.attack)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="text-blue-400" size={16} />
                  <span className="text-sm">
                    DR: {Math.floor(activePet.stats.defense)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="text-green-400" size={16} />
                  <span className="text-sm">HP: {Math.floor(activePet.stats.hp)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="text-yellow-400" size={16} />
                  <span className="text-sm">AGI: {Math.floor(activePet.stats.speed)}</span>
                </div>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>Level: {activePet.level}</span>
                  <span>
                    Experience: {activePet.exp} / {activePet.maxExp}
                  </span>
                </div>
                <div className="w-full bg-stone-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min(100, (activePet.exp / activePet.maxExp) * 100)}%`,
                    }}
                  />
                </div>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>Affinity</span>
                  <span>{activePet.affection} / 100</span>
                </div>
                <div className="w-full bg-stone-700 rounded-full h-2">
                  <div
                    className="bg-pink-500 h-2 rounded-full"
                    style={{ width: `${activePet.affection}%` }}
                  />
                </div>
                <div className="text-xs text-stone-400 mt-1">
                  Affinity Bonus: Healing effectiveness +{Math.floor(activePet.affection / 2)}%, Standard attacks +{Math.floor(activePet.affection * 0.5)} DMG
                </div>
              </div>
              {/* Evolution Stage Display */}
              <div className="mb-3">
                <div className="text-sm mb-1">
                  <span>Evolution Stage: </span>
                  <span className="font-bold">
                    {activePet.evolutionStage === 0 ? 'Juvenile' : activePet.evolutionStage === 1 ? 'Mature' : 'Apex'}
                  </span>
                </div>
              </div>
              {/* Ability List */}
              {activePet.skills && activePet.skills.length > 0 && (
                <div className="mb-3">
                  <div className="text-sm font-bold mb-2">Abilities</div>
                  <div className="space-y-2">
                    {activePet.skills.map((skill) => {
                      const cooldown = activePet.skillCooldowns?.[skill.id] || 0;
                      const getSkillTypeColor = (type: string) => {
                        switch (type) {
                          case 'attack': return 'text-red-400';
                          case 'defense': return 'text-blue-400';
                          case 'support': return 'text-green-400';
                          case 'passive': return 'text-purple-400';
                          default: return 'text-stone-400';
                        }
                      };
                      const getSkillTypeName = (type: string) => {
                        switch (type) {
                          case 'attack': return 'Offense';
                          case 'defense': return 'Defense';
                          case 'support': return 'Support';
                          case 'passive': return 'Passive';
                          default: return type;
                        }
                      };
                      return (
                        <div key={skill.id} className="bg-stone-800 rounded p-2 border border-stone-700">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-sm">{skill.name}</span>
                            <span className={`text-xs ${getSkillTypeColor(skill.type)}`}>
                              {getSkillTypeName(skill.type)}
                            </span>
                          </div>
                          <div className="text-xs text-stone-400 mb-1">{skill.description}</div>
                          <div className="text-xs text-stone-500">
                            {skill.effect.damage && `DMG: ${skill.effect.damage} `}
                            {skill.effect.heal && `Heal: ${skill.effect.heal} `}
                            {skill.effect.buff && (
                              <>
                                {skill.effect.buff.attack && `FP+${skill.effect.buff.attack} `}
                                {skill.effect.buff.defense && `DR+${skill.effect.buff.defense} `}
                                {skill.effect.buff.hp && `HP+${skill.effect.buff.hp}`}
                              </>
                            )}
                            {skill.cooldown && (
                              <span className="ml-2">
                                {cooldown > 0 ? (
                                  <span className="text-yellow-400">CD: {cooldown} Turns</span>
                                ) : (
                                  <span className="text-green-400">CD: {skill.cooldown} Turns</span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Evolution Requirements Display */}
              {activePet.evolutionStage < 2 && (() => {
                const template = PET_TEMPLATES.find((t) => t.species === activePet.species);
                if (!template?.evolutionRequirements) return null;
                const nextStage = activePet.evolutionStage + 1;
                const requirements = nextStage === 1
                  ? (template.evolutionRequirements.stage1 || template.evolutionRequirements)
                  : (template.evolutionRequirements.stage2 || template.evolutionRequirements);
                const hasLevel = activePet.level >= (requirements.level || 0);
                const missingItems: string[] = [];
                if (requirements.items) {
                  requirements.items.forEach((req) => {
                    const item = player.inventory.find((i) => i.name === req.name);
                    if (!item || item.quantity < req.quantity) {
                      missingItems.push(`${req.name} x${req.quantity}`);
                    }
                  });
                }
                const canEvolve = hasLevel && missingItems.length === 0;
                return (
                  <div className="mb-3 p-2 bg-stone-800 rounded border border-stone-700">
                    <div className="text-sm font-bold mb-2">
                      Requirements for Evolution into {nextStage === 1 ? 'Mature' : 'Apex'}:
                    </div>
                    <div className="text-xs space-y-1">
                      <div className={hasLevel ? 'text-green-400' : 'text-red-400'}>
                        ✓ Level: {activePet.level} / {requirements.level || 0} {hasLevel ? '✓' : '✗'}
                      </div>
                      {requirements.items && requirements.items.length > 0 && (
                        <div>
                          <div className="mb-1">Required Materials:</div>
                          {requirements.items.map((req, idx) => {
                            const item = player.inventory.find((i) => i.name === req.name);
                            const hasItem = item && item.quantity >= req.quantity;
                            return (
                              <div key={idx} className={hasItem ? 'text-green-400' : 'text-red-400'}>
                                {hasItem ? '✓' : '✗'} {req.name} x{req.quantity}
                                {item && ` (Own: ${item.quantity})`}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {canEvolve && (
                        <div className="text-green-400 font-bold mt-2">✓ Ready for Evolution!</div>
                      )}
                    </div>
                  </div>
                );
              })()}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => handleFeedClick(activePet.id)}
                  className="flex-1 px-4 py-2 bg-green-900 hover:bg-green-800 rounded border border-green-700 text-sm"
                >
                  Process
                </button>
                {onBatchFeedItems && (
                  <button
                    onClick={() => {
                      setBatchFeedPetId(activePet.id);
                      setIsBatchFeedOpen(true);
                    }}
                    className="px-4 py-2 bg-blue-900 hover:bg-blue-800 rounded border border-blue-700 text-sm"
                    title="Bulk Process"
                  >
                    <Layers size={16} />
                  </button>
                )}
                {activePet.evolutionStage < 2 && (
                  <button
                    onClick={() => onEvolvePet(activePet.id)}
                    className="flex-1 px-4 py-2 bg-purple-900 hover:bg-purple-800 rounded border border-purple-700 text-sm"
                  >
                    Evolve
                  </button>
                )}
                {onReleasePet && (
                  <button
                    onClick={() => setReleaseConfirmPetId(activePet.id)}
                    className="px-4 py-2 bg-red-900 hover:bg-red-800 rounded border border-red-700 text-sm"
                    title="Release"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* All Captured Creatures List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold">
                Captured Creatures ({player.pets.length})
              </h3>
              {onBatchReleasePets && player.pets.length > 0 && (
                <button
                  onClick={() => setIsBatchReleaseOpen(true)}
                  className="px-3 py-1.5 bg-red-900 hover:bg-red-800 rounded border border-red-700 text-sm flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Bulk Release
                </button>
              )}
            </div>
            {player.pets.length === 0 ? (
              <div className="bg-stone-900 rounded p-4 border border-stone-700 text-center text-stone-500">
                No creatures captured. Explore the wasteland or use the lottery to find companions!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {player.pets.map((pet) => (
                  <div
                    key={pet.id}
                    className={`bg-stone-900 rounded p-4 border ${pet.id === player.activePetId
                      ? 'border-yellow-600'
                      : 'border-stone-700'
                      }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-3xl">{getPetImage(pet)}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <span
                              className={`font-bold ${getRarityTextColor(pet.rarity as ItemRarity)}`}
                            >
                              {pet.name}
                            </span>
                            <span className="text-xs text-stone-500 ml-2">
                              Lv.{pet.level}
                            </span>
                          </div>
                          {pet.id === player.activePetId ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-yellow-600 text-black px-2 py-1 rounded">
                                Active
                              </span>
                              {onDeactivatePet && (
                                <button
                                  onClick={() => onDeactivatePet()}
                                  className="text-xs px-2 py-1 bg-stone-700 hover:bg-stone-600 rounded text-stone-300"
                                  title="Dismiss"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => onActivatePet(pet.id)}
                              className="text-xs px-2 py-1 bg-stone-700 hover:bg-stone-600 rounded"
                            >
                              Call
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-stone-400 mb-2">
                      {pet.species}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                      <div>FP: {Math.floor(pet.stats.attack)}</div>
                      <div>DR: {Math.floor(pet.stats.defense)}</div>
                      <div>HP: {Math.floor(pet.stats.hp)}</div>
                      <div>AGI: {Math.floor(pet.stats.speed)}</div>
                    </div>
                    <div className="text-xs text-stone-500 mb-2">
                      Experience: {pet.exp} / {pet.maxExp}
                    </div>
                    <div className="w-full bg-stone-700 rounded-full h-1.5 mb-2">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, (pet.exp / pet.maxExp) * 100)}%` }}
                      />
                    </div>
                    {/* Evolution Stage */}
                    <div className="text-xs text-stone-400 mb-1">
                      Stage: {pet.evolutionStage === 0 ? 'Juvenile' : pet.evolutionStage === 1 ? 'Mature' : 'Apex'}
                    </div>
                    {/* Skill Count Hint */}
                    {pet.skills && pet.skills.length > 0 && (
                      <div className="text-xs text-stone-400 mb-1">
                        Skills: {pet.skills.length}
                      </div>
                    )}
                    {/* Expand/Collapse Button */}
                    <button
                      onClick={() => {
                        setExpandedPetIds((prev) => {
                          const newSet = new Set(prev);
                          if (newSet.has(pet.id)) {
                            newSet.delete(pet.id);
                          } else {
                            newSet.add(pet.id);
                          }
                          return newSet;
                        });
                      }}
                      className="w-full mb-2 px-2 py-1 text-xs bg-stone-800 hover:bg-stone-700 rounded border border-stone-600"
                    >
                      {expandedPetIds.has(pet.id) ? 'Collapse' : 'Details'}
                    </button>
                    {/* Expanded Details */}
                    {expandedPetIds.has(pet.id) && (
                      <div className="mb-2 space-y-2 border-t border-stone-700 pt-2">
                        {/* Affinity */}
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Affinity</span>
                            <span>{pet.affection} / 100</span>
                          </div>
                          <div className="w-full bg-stone-700 rounded-full h-1.5">
                            <div
                              className="bg-pink-500 h-1.5 rounded-full"
                              style={{ width: `${pet.affection}%` }}
                            />
                          </div>
                          <div className="text-xs text-stone-400 mt-1">
                            Bonus: Healing +{Math.floor(pet.affection / 2)}%, Attack +{Math.floor(pet.affection * 0.5)} DMG
                          </div>
                        </div>
                        {/* Ability List */}
                        {pet.skills && pet.skills.length > 0 && (
                          <div>
                            <div className="text-xs font-bold mb-1">Abilities</div>
                            <div className="space-y-1">
                              {pet.skills.map((skill) => {
                                const cooldown = pet.skillCooldowns?.[skill.id] || 0;
                                const getSkillTypeColor = (type: string) => {
                                  switch (type) {
                                    case 'attack': return 'text-red-400';
                                    case 'defense': return 'text-blue-400';
                                    case 'support': return 'text-green-400';
                                    case 'passive': return 'text-purple-400';
                                    default: return 'text-stone-400';
                                  }
                                };
                                const getSkillTypeName = (type: string) => {
                                  switch (type) {
                                    case 'attack': return 'Offense';
                                    case 'defense': return 'Defense';
                                    case 'support': return 'Support';
                                    case 'passive': return 'Passive';
                                    default: return type;
                                  }
                                };
                                return (
                                  <div key={skill.id} className="bg-stone-800 rounded p-1.5 border border-stone-700">
                                    <div className="flex items-center justify-between mb-0.5">
                                      <span className="font-bold text-xs">{skill.name}</span>
                                      <span className={`text-xs ${getSkillTypeColor(skill.type)}`}>
                                        {getSkillTypeName(skill.type)}
                                      </span>
                                    </div>
                                    <div className="text-xs text-stone-400 mb-0.5">{skill.description}</div>
                                    <div className="text-xs text-stone-500">
                                      {skill.effect.damage && `DMG: ${skill.effect.damage} `}
                                      {skill.effect.heal && `Heal: ${skill.effect.heal} `}
                                      {skill.effect.buff && (
                                        <>
                                          {skill.effect.buff.attack && `FP+${skill.effect.buff.attack} `}
                                          {skill.effect.buff.defense && `DR+${skill.effect.buff.defense} `}
                                          {skill.effect.buff.hp && `HP+${skill.effect.buff.hp}`}
                                        </>
                                      )}
                                      {skill.cooldown && (
                                        <span className="ml-1">
                                          {cooldown > 0 ? (
                                            <span className="text-yellow-400">CD: {cooldown} Turns</span>
                                          ) : (
                                            <span className="text-green-400">CD: {skill.cooldown} Turns</span>
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {/* Evolution Requirements */}
                        {pet.evolutionStage < 2 && (() => {
                          const template = PET_TEMPLATES.find((t) => t.species === pet.species);
                          if (!template?.evolutionRequirements) return null;
                          const nextStage = pet.evolutionStage + 1;
                          const requirements = nextStage === 1
                            ? (template.evolutionRequirements.stage1 || template.evolutionRequirements)
                            : (template.evolutionRequirements.stage2 || template.evolutionRequirements);
                          const hasLevel = pet.level >= (requirements.level || 0);
                          return (
                            <div className="p-1.5 bg-stone-800 rounded border border-stone-700">
                              <div className="text-xs font-bold mb-1">
                                Requirements for Evolution into {nextStage === 1 ? 'Mature' : 'Apex'}:
                              </div>
                              <div className="text-xs space-y-0.5">
                                <div className={hasLevel ? 'text-green-400' : 'text-red-400'}>
                                  {hasLevel ? '✓' : '✗'} Level: {pet.level} / {requirements.level || 0}
                                </div>
                                {requirements.items && requirements.items.length > 0 && (
                                  <div>
                                    {requirements.items.map((req, idx) => {
                                      const item = player.inventory.find((i) => i.name === req.name);
                                      const hasItem = item && item.quantity >= req.quantity;
                                      return (
                                        <div key={idx} className={hasItem ? 'text-green-400' : 'text-red-400'}>
                                          {hasItem ? '✓' : '✗'} {req.name} x{req.quantity}
                                          {item && ` (${item.quantity})`}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleFeedClick(pet.id)}
                        className="flex-1 px-3 py-1.5 bg-green-900 hover:bg-green-800 rounded border border-green-700 text-xs"
                      >
                        Process
                      </button>
                      {onBatchFeedItems && (
                        <button
                          onClick={() => {
                            setBatchFeedPetId(pet.id);
                            setIsBatchFeedOpen(true);
                          }}
                          className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 rounded border border-blue-700 text-xs"
                          title="Bulk Process"
                        >
                          <Layers size={14} />
                        </button>
                      )}
                      {pet.evolutionStage < 2 && (
                        <button
                          onClick={() => onEvolvePet(pet.id)}
                          className="flex-1 px-3 py-1.5 bg-purple-900 hover:bg-purple-800 rounded border border-purple-700 text-xs"
                        >
                          Evolve
                        </button>
                      )}
                      {onReleasePet && (
                        <button
                          onClick={() => setReleaseConfirmPetId(pet.id)}
                          className="px-3 py-1.5 bg-red-900 hover:bg-red-800 rounded border border-red-700 text-xs"
                          title="Release"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Processing Selection Modal */}
        {selectedPetId && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4">
            <div className="bg-stone-800 rounded-lg border border-stone-700 w-full max-w-md p-6">
              <h3 className="text-lg font-bold mb-4 text-amber-400">
                Select Processing Method
              </h3>

              {!feedType ? (
                <div className="space-y-3">
                  <button
                    onClick={() => setFeedType('hp')}
                    className="w-full px-4 py-3 bg-red-900 hover:bg-red-800 rounded border border-red-700 flex items-center gap-3"
                  >
                    <Droplet className="text-red-400" size={20} />
                    <div className="flex-1 text-left">
                      <div className="font-bold">Biotic Processing</div>
                      <div className="text-xs text-stone-400">Consume 200 HP (Experience based on Rank, +2~5 Affinity)</div>
                    </div>
                  </button>

                  {onBatchFeedHp && (
                    <button
                      onClick={() => {
                        if (!selectedPetId) return;
                        onBatchFeedHp(selectedPetId);
                        setSelectedPetId(null);
                        setFeedType(null);
                      }}
                      className="w-full px-4 py-3 bg-red-800 hover:bg-red-700 rounded border border-red-600 flex items-center gap-3"
                      title={`Bulk Process: Can process ${Math.floor(player.hp / 200)} times`}
                    >
                      <Droplet className="text-red-300" size={20} />
                      <div className="flex-1 text-left">
                        <div className="font-bold">Bulk Biotic Processing</div>
                        <div className="text-xs text-stone-400">
                          Consume all available HP (Can process {Math.floor(player.hp / 200)} times, 200 HP each)
                        </div>
                      </div>
                    </button>
                  )}

                  <button
                    onClick={() => setFeedType('item')}
                    className="w-full px-4 py-3 bg-blue-900 hover:bg-blue-800 rounded border border-blue-700 flex items-center gap-3"
                    disabled={feedableItems.length === 0}
                  >
                    <Package className="text-blue-400" size={20} />
                    <div className="flex-1 text-left">
                      <div className="font-bold">Material Processing</div>
                      <div className="text-xs text-stone-400">
                        {feedableItems.length === 0
                          ? 'No processable items in inventory'
                          : `Consume items (Experience based on Rank and Item Rarity, +2~5 Affinity)`}
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setFeedType('exp')}
                    className="w-full px-4 py-3 bg-purple-900 hover:bg-purple-800 rounded border border-purple-700 flex items-center gap-3"
                  >
                    <Sparkles className="text-purple-400" size={20} />
                    <div className="flex-1 text-left">
                      <div className="font-bold">Neural Processing</div>
                      <div className="text-xs text-stone-400">Consume 5% Current Neural Data (Experience based on Rank, +2~5 Affinity)</div>
                    </div>
                  </button>
                </div>
              ) : feedType === 'item' ? (
                <div className="space-y-3">
                  <div className="text-sm text-stone-400 mb-3">
                    Select materials to process:
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {feedableItems.length === 0 ? (
                      <div className="text-center text-stone-500 py-4">
                        No processable items in inventory
                      </div>
                    ) : (
                      feedableItems.map(item => {
                        // Calculate estimated XP
                        const rarity = item.rarity || 'common';
                        const rarityMultiplier = RARITY_MULTIPLIERS[rarity] || 1;
                        const realmIndex = REALM_ORDER.indexOf(player.realm);
                        const realmMultiplier = 1 + realmIndex * 0.5;
                        const levelMultiplier = 1 + player.realmLevel * 0.1;
                        const baseExp = Math.floor(10 * realmMultiplier * levelMultiplier);
                        const estimatedExp = Math.floor(baseExp * rarityMultiplier);

                        return (
                          <button
                            key={item.id}
                            onClick={() => setSelectedItemId(item.id)}
                            className={`w-full px-3 py-2 rounded border text-left ${selectedItemId === item.id
                              ? 'bg-blue-900 border-blue-600'
                              : 'bg-stone-700 border-stone-600 hover:bg-stone-600'
                              }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="font-bold text-sm">{item.name}</div>
                              <div className={`text-xs px-1.5 py-0.5 rounded ${getRarityTextColor(rarity as ItemRarity)}`}>
                                {rarity}
                              </div>
                            </div>
                            <div className="text-xs text-stone-400 mt-1">
                              Qty: {item.quantity} · Est. EXP: {estimatedExp}~{Math.floor(estimatedExp * 1.2)}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : null}

              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleFeedCancel}
                  className="flex-1 px-4 py-2 bg-stone-700 hover:bg-stone-600 rounded border border-stone-600"
                >
                  Cancel
                </button>
                {feedType && (feedType !== 'item' || selectedItemId) && (
                  <button
                    onClick={handleFeedConfirm}
                    className="flex-1 px-4 py-2 bg-green-900 hover:bg-green-800 rounded border border-green-700"
                  >
                    Confirm Process
                  </button>
                )}
                {feedType && feedType !== 'item' && (
                  <button
                    onClick={() => setFeedType(null)}
                    className="px-4 py-2 bg-stone-700 hover:bg-stone-600 rounded border border-stone-600"
                  >
                    Back
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Batch Feed Modal */}
        {onBatchFeedItems && batchFeedPetId && (
          <BatchFeedModal
            isOpen={isBatchFeedOpen}
            onClose={() => {
              setIsBatchFeedOpen(false);
              setBatchFeedPetId(null);
            }}
            player={player}
            petId={batchFeedPetId}
            onFeedItems={onBatchFeedItems}
          />
        )}

        {/* Batch Release Modal */}
        {onBatchReleasePets && (
          <BatchReleaseModal
            isOpen={isBatchReleaseOpen}
            onClose={() => setIsBatchReleaseOpen(false)}
            player={player}
            onReleasePets={onBatchReleasePets}
          />
        )}

        {/* Single Release Confirmation Modal */}
        {onReleasePet && releaseConfirmPetId && (() => {
          const pet = player.pets.find((p) => p.id === releaseConfirmPetId);
          if (!pet) return null;
          const isActive = pet.id === player.activePetId;
          const compensation = Math.floor(
            100 * (1 + pet.level * 0.1) * ({
              'common': 1,
              'uncommon': 2,
              'rare': 5,
              'legendary': 10,
            }[pet.rarity] || 1)
          );

          return (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
              <div
                className="bg-stone-800 w-full max-w-md rounded-lg border border-stone-600 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b border-stone-600 bg-ink-800 rounded-t flex justify-between items-center">
                  <h3 className="text-lg font-serif text-red-400 flex items-center gap-2">
                    <AlertTriangle size={20} />
                    Confirm Release
                  </h3>
                  <button
                    title="Close"
                    onClick={() => setReleaseConfirmPetId(null)}
                    className="text-stone-400 hover:text-white"
                  >
                    <X size={24} />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="bg-red-900/20 border border-red-700 rounded p-4">
                    <p className="text-stone-300 mb-2">
                      Are you sure you want to release creature <span className="text-red-400 font-bold">[{pet.name}]</span>?
                    </p>
                    {isActive && (
                      <p className="text-yellow-400 text-sm mb-2">
                        ⚠️ Note: This is your active companion. Releasing it will dismiss it.
                      </p>
                    )}
                    <div className="bg-stone-900 rounded p-3 mt-3">
                      <div className="text-sm text-stone-400 mb-1">Creature Info:</div>
                      <div className="text-sm text-stone-300 space-y-1">
                        <div>Level: {pet.level}</div>
                        <div>Rarity: {pet.rarity}</div>
                        <div>Species: {pet.species}</div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-stone-700 flex justify-between items-center">
                        <span className="text-stone-300">Compensation:</span>
                        <span className="text-yellow-400 text-lg font-bold">
                          {compensation} Caps
                        </span>
                      </div>
                    </div>
                    <p className="text-stone-400 text-sm mt-3">
                      This action cannot be undone.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setReleaseConfirmPetId(null)}
                      className="flex-1 px-4 py-2 bg-stone-700 hover:bg-stone-600 rounded border border-stone-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        onReleasePet(releaseConfirmPetId);
                        setReleaseConfirmPetId(null);
                      }}
                      className="flex-1 px-4 py-2 bg-red-900 hover:bg-red-800 rounded border border-red-700 text-white font-bold"
                    >
                      Confirm Release
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default React.memo(PetModal);
