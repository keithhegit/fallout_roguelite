import React, { useState, useMemo } from 'react';
import { X, Trash2, AlertTriangle, Filter } from 'lucide-react';
import { PlayerStats, ItemRarity } from '../types';
import { getRarityTextColor } from '../utils/rarityUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  onReleasePets: (petIds: string[]) => void;
}

type RarityFilter = 'all' | ItemRarity;
type EvolutionFilter = 'all' | '0' | '1' | '2'; // 0=Juvenile, 1=Mature, 2=Apex
type ActiveFilter = 'all' | 'active' | 'inactive';

const BatchReleaseModal: React.FC<Props> = ({
  isOpen,
  onClose,
  player,
  onReleasePets,
}) => {
  const [selectedPets, setSelectedPets] = useState<Set<string>>(new Set());
  const [confirmRelease, setConfirmRelease] = useState(false);

  // Filter state
  const [selectedRarity, setSelectedRarity] = useState<RarityFilter>('all');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('all');
  const [selectedEvolution, setSelectedEvolution] = useState<EvolutionFilter>('all');
  const [selectedActive, setSelectedActive] = useState<ActiveFilter>('all');
  const [minLevel, setMinLevel] = useState<number>(0);
  const [maxLevel, setMaxLevel] = useState<number>(100);

  // Get all pet species
  const allSpecies = useMemo(() => {
    const speciesSet = new Set<string>();
    player.pets.forEach((pet) => {
      speciesSet.add(pet.species);
    });
    return Array.from(speciesSet).sort();
  }, [player.pets]);

  // Filtered pet list
  const filteredPets = useMemo(() => {
    return player.pets.filter((pet) => {
      // Rarity filter
      if (selectedRarity !== 'all' && pet.rarity !== selectedRarity) {
        return false;
      }

      // Species filter
      if (selectedSpecies !== 'all' && pet.species !== selectedSpecies) {
        return false;
      }

      // Evolution stage filter
      if (selectedEvolution !== 'all') {
        const stage = pet.evolutionStage.toString();
        if (stage !== selectedEvolution) {
          return false;
        }
      }

      // Active status filter
      if (selectedActive !== 'all') {
        const isActive = pet.id === player.activePetId;
        if (selectedActive === 'active' && !isActive) {
          return false;
        }
        if (selectedActive === 'inactive' && isActive) {
          return false;
        }
      }

      // Level range filter
      if (pet.level < minLevel || pet.level > maxLevel) {
        return false;
      }

      return true;
    });
  }, [player.pets, selectedRarity, selectedSpecies, selectedEvolution, selectedActive, minLevel, maxLevel, player.activePetId]);

  // Must return early after all hooks
  if (!isOpen) return null;

  const handleTogglePet = (petId: string) => {
    setSelectedPets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(petId)) {
        newSet.delete(petId);
      } else {
        newSet.add(petId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedPets.size === filteredPets.length) {
      setSelectedPets(new Set());
    } else {
      setSelectedPets(new Set(filteredPets.map((p) => p.id)));
    }
  };

  const handleRelease = () => {
    if (selectedPets.size === 0) return;
    if (!confirmRelease) {
      setConfirmRelease(true);
      return;
    }

    const petIds = Array.from(selectedPets);
    onReleasePets(petIds);
    setSelectedPets(new Set());
    setConfirmRelease(false);
    onClose();
  };

  // Use unified utility for rarity color (BatchReleaseModal needs special gray handling)
  const getRarityColor = (rarity: string) => {
    if (rarity === 'common') {
      return 'text-gray-400';
    }
    return getRarityTextColor(rarity as ItemRarity);
  };

  // Calculate total compensation
  const totalCompensation = Array.from(selectedPets).reduce((total: number, petId) => {
    const pet = player.pets.find((p) => p.id === petId);
    if (!pet) return total;
    const baseCompensation = 100;
    const levelMultiplier = 1 + pet.level * 0.1;
    const rarityMultiplier = {
      'common': 1,
      'uncommon': 2,
      'rare': 5,
      'legendary': 10,
    }[pet.rarity] || 1;
    return total + Math.floor(baseCompensation * levelMultiplier * rarityMultiplier);
  }, 0);

  // Check if active pet is included
  const includesActivePet = selectedPets.has(player.activePetId || '');

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-stone-800 w-full max-w-2xl rounded-lg border border-stone-600 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-stone-600 bg-ink-800 rounded-t flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Trash2 className="text-red-400" size={20} />
            <h3 className="text-xl font-serif text-amber-400">Bulk Companion Release</h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {confirmRelease ? (
            <div className="space-y-4">
              <div className="bg-red-900/20 border border-red-700 rounded p-4 flex items-start gap-3">
                <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" size={24} />
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-red-400 mb-2">Confirm Release</h4>
                  <p className="text-stone-300 mb-2">
                    Are you sure you want to release <span className="text-red-400 font-bold">{selectedPets.size}</span> companions?
                  </p>
                  {includesActivePet && (
                    <p className="text-yellow-400 text-sm mb-2">
                      ⚠️ Note: This includes your active companion. Releasing it will dismiss it.
                    </p>
                  )}
                  <div className="bg-stone-900 rounded p-3 mt-3">
                    <div className="text-sm text-stone-400 mb-2">Companions to be released:</div>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {Array.from(selectedPets).map((petId) => {
                        const pet = player.pets.find((p) => p.id === petId);
                        if (!pet) return null;
                        return (
                          <div
                            key={petId}
                            className="text-sm text-stone-300 flex items-center justify-between"
                          >
                            <span>
                              {pet.name} (Lv.{pet.level}, {pet.rarity})
                              {petId === player.activePetId && (
                                <span className="text-yellow-400 ml-2">[Active]</span>
                              )}
                            </span>
                            <span className="text-stone-500">
                              {Math.floor(100 * (1 + pet.level * 0.1) * ({
                                'common': 1,
                                'uncommon': 2,
                                'rare': 5,
                                'legendary': 10,
                              }[pet.rarity] || 1))} Caps
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 pt-3 border-t border-stone-700 flex justify-between items-center">
                      <span className="text-stone-300 font-bold">Total Compensation:</span>
                      <span className="text-yellow-400 text-lg font-bold">
                        {totalCompensation} Caps
                      </span>
                    </div>
                  </div>
                  <p className="text-stone-400 text-sm mt-3">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmRelease(false)}
                  className="flex-1 px-4 py-2 bg-stone-700 hover:bg-stone-600 rounded border border-stone-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRelease}
                  className="flex-1 px-4 py-2 bg-red-900 hover:bg-red-800 rounded border border-red-700 text-white font-bold"
                >
                  Confirm Release
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-stone-300 mb-1">
                      Select companions to release (Selected {selectedPets.size} / {filteredPets.length})
                      {filteredPets.length !== player.pets.length && (
                        <span className="text-stone-500 text-xs ml-2">
                          (Total {player.pets.length})
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-stone-500">
                      Releasing companions grants Caps compensation based on level and rarity.
                    </p>
                  </div>
                  <button
                    onClick={handleSelectAll}
                    className="px-3 py-1.5 bg-stone-700 hover:bg-stone-600 rounded border border-stone-600 text-sm"
                  >
                    {selectedPets.size === filteredPets.length && filteredPets.length > 0 ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                {/* Filters */}
                <div className="bg-stone-900 rounded p-3 border border-stone-700 space-y-3">
                  <div className="flex items-center gap-2 text-stone-400 text-sm">
                    <Filter size={16} />
                    <span>Filter Criteria:</span>
                  </div>

                  {/* Rarity Filter */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-stone-500">Rarity:</span>
                    {(['all', 'common', 'uncommon', 'rare', 'legendary'] as RarityFilter[]).map((rarity) => (
                      <button
                        key={rarity}
                        onClick={() => {
                          setSelectedRarity(rarity);
                          setSelectedPets(new Set());
                        }}
                        className={`px-2 py-1 rounded text-xs border transition-colors ${selectedRarity === rarity
                            ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                            : 'bg-stone-800 border-stone-600 text-stone-400 hover:bg-stone-700'
                          }`}
                      >
                        {rarity === 'all' ? 'All' : rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* Species Filter */}
                  {allSpecies.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-stone-500">Species:</span>
                      <button
                        onClick={() => {
                          setSelectedSpecies('all');
                          setSelectedPets(new Set());
                        }}
                        className={`px-2 py-1 rounded text-xs border transition-colors ${selectedSpecies === 'all'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                            : 'bg-stone-800 border-stone-600 text-stone-400 hover:bg-stone-700'
                          }`}
                      >
                        All
                      </button>
                      {allSpecies.map((species) => (
                        <button
                          key={species}
                          onClick={() => {
                            setSelectedSpecies(species);
                            setSelectedPets(new Set());
                          }}
                          className={`px-2 py-1 rounded text-xs border transition-colors ${selectedSpecies === species
                              ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                              : 'bg-stone-800 border-stone-600 text-stone-400 hover:bg-stone-700'
                            }`}
                        >
                          {species}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Evolution Stage Filter */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-stone-500">Evolution Stage:</span>
                    {(['all', '0', '1', '2'] as EvolutionFilter[]).map((stage) => (
                      <button
                        key={stage}
                        onClick={() => {
                          setSelectedEvolution(stage);
                          setSelectedPets(new Set());
                        }}
                        className={`px-2 py-1 rounded text-xs border transition-colors ${selectedEvolution === stage
                            ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                            : 'bg-stone-800 border-stone-600 text-stone-400 hover:bg-stone-700'
                          }`}
                      >
                        {stage === 'all' ? 'All' : stage === '0' ? 'Juvenile' : stage === '1' ? 'Mature' : 'Apex'}
                      </button>
                    ))}
                  </div>

                  {/* Active Status Filter */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-stone-500">Active Status:</span>
                    {(['all', 'active', 'inactive'] as ActiveFilter[]).map((active) => (
                      <button
                        key={active}
                        onClick={() => {
                          setSelectedActive(active);
                          setSelectedPets(new Set());
                        }}
                        className={`px-2 py-1 rounded text-xs border transition-colors ${selectedActive === active
                            ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                            : 'bg-stone-800 border-stone-600 text-stone-400 hover:bg-stone-700'
                          }`}
                      >
                        {active === 'all' ? 'All' : active === 'active' ? 'Active' : 'Inactive'}
                      </button>
                    ))}
                  </div>

                  {/* Level Range Filter */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-stone-500">Level Range:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={minLevel}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                          setMinLevel(val);
                          setSelectedPets(new Set());
                        }}
                        className="w-16 px-2 py-1 bg-stone-800 border border-stone-600 rounded text-xs text-stone-300"
                        placeholder="Min"
                      />
                      <span className="text-stone-500 text-xs">~</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={maxLevel}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 100));
                          setMaxLevel(val);
                          setSelectedPets(new Set());
                        }}
                        className="w-16 px-2 py-1 bg-stone-800 border border-stone-600 rounded text-xs text-stone-300"
                        placeholder="Max"
                      />
                    </div>
                  </div>

                  {/* Clear Filters */}
                  {(selectedRarity !== 'all' || selectedSpecies !== 'all' || selectedEvolution !== 'all' || selectedActive !== 'all' || minLevel > 0 || maxLevel < 100) && (
                    <button
                      onClick={() => {
                        setSelectedRarity('all');
                        setSelectedSpecies('all');
                        setSelectedEvolution('all');
                        setSelectedActive('all');
                        setMinLevel(0);
                        setMaxLevel(100);
                        setSelectedPets(new Set());
                      }}
                      className="px-3 py-1 bg-stone-700 hover:bg-stone-600 rounded border border-stone-600 text-xs text-stone-300"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>

              {filteredPets.length === 0 ? (
                <div className="text-center py-8 text-stone-500">
                  {player.pets.length === 0 ? 'No companions to release' : 'No companions matching criteria'}
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredPets.map((pet) => {
                    const isSelected = selectedPets.has(pet.id);
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
                      <div
                        key={pet.id}
                        className={`p-3 rounded border cursor-pointer transition-colors ${isSelected
                            ? 'bg-red-900/30 border-red-600'
                            : 'bg-stone-900 border-stone-700 hover:bg-stone-800'
                          }`}
                        onClick={() => handleTogglePet(pet.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleTogglePet(pet.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`font-bold ${getRarityColor(pet.rarity)}`}>
                                  {pet.name}
                                </span>
                                {isActive && (
                                  <span className="text-xs bg-yellow-600 text-black px-2 py-0.5 rounded">
                                    Active
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-stone-400 mt-1">
                                {pet.species} · Lv.{pet.level} · {pet.rarity}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-yellow-400 font-bold">
                              {compensation} Caps
                            </div>
                            <div className="text-xs text-stone-500">Refund</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedPets.size > 0 && (
                <div className="bg-stone-900 rounded p-4 border border-stone-700">
                  <div className="flex justify-between items-center">
                    <span className="text-stone-300">
                      Selected <span className="font-bold text-white">{selectedPets.size}</span> companions
                    </span>
                    <span className="text-yellow-400 text-lg font-bold">
                      Total Compensation: {totalCompensation} Caps
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-stone-700 hover:bg-stone-600 rounded border border-stone-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRelease}
                  disabled={selectedPets.size === 0}
                  className={`flex-1 px-4 py-2 rounded border font-bold ${selectedPets.size === 0
                      ? 'bg-stone-800 text-stone-600 border-stone-700 cursor-not-allowed'
                      : 'bg-red-900 hover:bg-red-800 border-red-700 text-white'
                    }`}
                >
                  Release ({selectedPets.size})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchReleaseModal;
