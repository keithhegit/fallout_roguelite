import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Circle,
  Sparkles,
  Calendar,
  Filter,
  ArrowUpDown,
  Download,
} from 'lucide-react';
import { PlayerStats, DailyQuest, ItemRarity } from '../types';
import { ASSETS } from '../constants/assets';
import { getRarityTextColor } from '../utils/rarityUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  onClaimReward: (questId: string) => void;
}

const DailyQuestModal: React.FC<Props> = ({
  isOpen,
  onClose,
  player,
  onClaimReward,
}) => {
  const [filterRarity, setFilterRarity] = useState<ItemRarity | 'all'>('all');
  const [sortBy, setSortBy] = useState<
    'default' | 'progress' | 'rarity' | 'reward'
  >('default');
  const [showCompleted, setShowCompleted] = useState<boolean>(true);

  if (!isOpen) return null;

  const dailyQuests = player.dailyQuests || [];
  const completedCount = dailyQuests.filter((q) => q.completed).length;
  const totalCount = dailyQuests.length;
  const completionRate =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Filter bounties
  const filteredQuests = dailyQuests.filter((quest) => {
    if (filterRarity !== 'all' && quest.rarity !== filterRarity) return false;
    if (!showCompleted && quest.completed) return false;
    return true;
  });

  // Sort bounties
  const sortedQuests = [...filteredQuests].sort((a, b) => {
    switch (sortBy) {
      case 'progress':
        // Sort by progress (incomplete first, completed descending by progress)
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return b.progress - a.progress;
      case 'rarity': {
        // Sort by rarity
        const rarityOrder: Record<ItemRarity, number> = {
          Common: 1,
          Rare: 2,
          Legendary: 3,
          Mythic: 4,
        };
        return rarityOrder[b.rarity] - rarityOrder[a.rarity];
      }
      case 'reward': {
        // Sort by reward value
        const rewardA =
          (a.reward.exp || 0) +
          (a.reward.spiritStones || 0) * 0.1 +
          (a.reward.lotteryTickets || 0) * 10;
        const rewardB =
          (b.reward.exp || 0) +
          (b.reward.spiritStones || 0) * 0.1 +
          (b.reward.lotteryTickets || 0) * 10;
        return rewardB - rewardA;
      }
      default:
        return 0;
    }
  });

  // Get claimable bounties
  const claimableQuests = sortedQuests.filter(
    (q) => q.completed && !player.dailyQuestCompleted?.includes(q.id)
  );

  // Claim all completed bounties
  const handleClaimAll = () => {
    claimableQuests.forEach((quest) => {
      onClaimReward(quest.id);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-ink-950 md:rounded-none border border-stone-800 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
        {/* CRT 扫描线效果 */}
        <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none z-50"></div>

        {/* Header */}
        <div className="bg-stone-950 p-4 border-b border-stone-800 flex items-center justify-between flex-shrink-0 z-10">
          <div className="flex items-center gap-3">
            <Calendar className="text-mystic-gold w-6 h-6" />
            <h2 className="text-xl font-serif font-bold text-mystic-gold">
              Daily Bounties
            </h2>
            <span className="text-sm text-stone-400">
              Day {player.gameDays}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="p-4 bg-stone-900/50 border-b border-stone-800 flex-shrink-0 z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-stone-300 text-sm">Today's Progress</span>
            <div className="flex items-center gap-3">
              <span className="text-mystic-gold font-bold">
                {completedCount} / {totalCount}
              </span>
              {claimableQuests.length > 0 && (
                <button
                  onClick={handleClaimAll}
                  className="px-3 py-1.5 bg-mystic-jade hover:bg-mystic-jade/80 text-stone-900 font-bold rounded text-sm transition-colors flex items-center gap-1.5"
                >
                  <Download size={14} />
                  Claim All ({claimableQuests.length})
                </button>
              )}
            </div>
          </div>
          <div className="h-3 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
            <div
              className="h-full bg-gradient-to-r from-mystic-jade to-mystic-gold transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* Filter and Sort Controls */}
        <div className="p-4 bg-stone-900/30 border-b border-stone-800 flex-shrink-0 flex flex-wrap gap-3 items-center z-10">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-stone-400" />
            <span className="text-stone-300 text-sm">Filter:</span>
            <select
              value={filterRarity}
              onChange={(e) =>
                setFilterRarity(e.target.value as ItemRarity | 'all')
              }
              className="px-2 py-1 bg-stone-900 border border-stone-800 rounded text-stone-200 text-sm outline-none focus:border-mystic-gold"
            >
              <option value="all">All Rarities</option>
              <option value="Common">Common</option>
              <option value="Rare">Rare</option>
              <option value="Legendary">Legendary</option>
              <option value="Mythic">Mythic</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <ArrowUpDown size={16} className="text-stone-400" />
            <span className="text-stone-300 text-sm">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-2 py-1 bg-stone-900 border border-stone-800 rounded text-stone-200 text-sm outline-none focus:border-mystic-gold"
            >
              <option value="default">Default</option>
              <option value="progress">Progress</option>
              <option value="rarity">Rarity</option>
              <option value="reward">Reward Value</option>
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="w-4 h-4 rounded border-stone-800 bg-stone-900 text-mystic-jade focus:ring-mystic-jade"
            />
            <span className="text-stone-300 text-sm">Show Completed</span>
          </label>
        </div>

        {/* Quest List */}
        <div className="modal-scroll-container modal-scroll-content p-4 space-y-3 z-10">
          {sortedQuests.length === 0 ? (
            <div className="text-center text-stone-400 py-8">
              <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No bounties match current filters.</p>
            </div>
          ) : (
            sortedQuests.map((quest) => (
              <QuestItem
                key={quest.id}
                quest={quest}
                onClaimReward={onClaimReward}
                isClaimed={
                  player.dailyQuestCompleted?.includes(quest.id) || false
                }
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

interface QuestItemProps {
  quest: DailyQuest;
  onClaimReward: (questId: string) => void;
  isClaimed: boolean; // Whether reward is claimed
}

const QuestItem: React.FC<QuestItemProps> = ({
  quest,
  onClaimReward,
  isClaimed,
}) => {
  const progressPercentage = Math.min(
    (quest.progress / quest.target) * 100,
    100
  );
  const rarityColor = getRarityTextColor(quest.rarity);

  return (
    <div
      className={`bg-ink-800 rounded-lg border-2 p-4 transition-all ${quest.completed && isClaimed
        ? 'border-stone-600 bg-stone-800/50'
        : quest.completed
          ? 'border-mystic-jade bg-mystic-jade/10'
          : 'border-stone-700 hover:border-stone-600'
        }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {quest.completed ? (
              <CheckCircle2 className="text-mystic-jade w-5 h-5 flex-shrink-0" />
            ) : (
              <Circle className="text-stone-500 w-5 h-5 flex-shrink-0" />
            )}
            <h3 className={`font-bold ${rarityColor}`}>{quest.name}</h3>
            <span
              className={`text-xs px-2 py-0.5 rounded border ${rarityColor} border-current`}
            >
              {quest.rarity}
            </span>
          </div>
          <p className="text-stone-400 text-sm mb-2">{quest.description}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
          <span>Progress</span>
          <span>
            {quest.progress} / {quest.target}
          </span>
        </div>
        <div className="h-2 bg-stone-900 rounded-full overflow-hidden border border-stone-700">
          <div
            className={`h-full transition-all duration-300 ${quest.completed
              ? 'bg-mystic-jade'
              : 'bg-gradient-to-r from-mystic-jade to-mystic-gold'
              }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Rewards */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          {!!quest.reward.exp && (
            <div className="flex items-center gap-1 text-mystic-jade">
              <Sparkles size={14} />
              <span>{quest.reward.exp} Data</span>
            </div>
          )}
          {!!quest.reward.spiritStones && (
            <div className="flex items-center gap-1 text-mystic-gold">
              <Sparkles size={14} />
              <span>{quest.reward.spiritStones} Caps</span>
            </div>
          )}
          {!!quest.reward.lotteryTickets && (
            <div className="flex items-center gap-1 text-yellow-400">
              <Sparkles size={14} />
              <span>{quest.reward.lotteryTickets} Tickets</span>
            </div>
          )}
        </div>
        {quest.completed && !isClaimed && (
          <button
            onClick={() => onClaimReward(quest.id)}
            className="px-3 py-1.5 bg-mystic-jade hover:bg-mystic-jade/80 text-stone-900 font-bold rounded text-sm transition-colors"
          >
            Claim Reward
          </button>
        )}
        {quest.completed && isClaimed && (
          <div className="px-3 py-1.5 bg-stone-700 text-stone-400 font-bold rounded text-sm">
            Claimed
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyQuestModal;
