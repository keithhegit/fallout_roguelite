import React, { useState, useMemo } from 'react';
import { PlayerStats, SectRank, RealmType, Item, AdventureResult } from '../types';
import { SECTS, SECT_RANK_REQUIREMENTS, REALM_ORDER, SECT_RANK_DATA } from '../constants/index';
import { generateRandomSects, generateRandomSectTasks, generateSectShopItems, RandomSectTask } from '../services/randomService';
import { X, Users, ShoppingBag, Shield, Scroll, ArrowUp, RefreshCw } from 'lucide-react';
import SectTaskModal from './SectTaskModal';
import { showConfirm } from '../utils/toastUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  onJoinSect: (sectId: string, sectName?: string, sectInfo?: { exitCost?: { spiritStones?: number; items?: { name: string; quantity: number }[] } }) => void;
  onLeaveSect: () => void;
  onSafeLeaveSect: () => void;
  onTask: (task: RandomSectTask, encounterResult?: AdventureResult) => void;
  onPromote: () => void;
  onBuy: (item: Partial<Item>, cost: number, quantity?: number) => void;
  onChallengeLeader: () => void;
  setItemActionLog?: (log: { text: string; type: string } | null) => void;
}

const SectModal: React.FC<Props> = ({
  isOpen,
  onClose,
  player,
  onJoinSect,
  onLeaveSect,
  onSafeLeaveSect,
  onTask,
  onPromote,
  onBuy,
  onChallengeLeader,
  setItemActionLog,
}) => {
  const [activeTab, setActiveTab] = useState<'hall' | 'mission' | 'shop'>(
    'hall'
  );
  const [selectedTask, setSelectedTask] = useState<RandomSectTask | null>(null);
  const [buyQuantities, setBuyQuantities] = useState<Record<number, number>>(
    {}
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [realmFilter, setRealmFilter] = useState<RealmType | 'all'>('all');

  // Quartermaster restock states
  const [sectShopItems, setSectShopItems] = useState<Array<{ name: string; cost: number; item: Omit<Item, 'id'> }>>(() => generateSectShopItems(1));
  const [sectShopItemsFloor2, setSectShopItemsFloor2] = useState<Array<{ name: string; cost: number; item: Omit<Item, 'id'> }>>(() => generateSectShopItems(2));
  const [shopFloor, setShopFloor] = useState<1 | 2>(1);
  const [shopRefreshTime, setShopRefreshTime] = useState<number>(() => Date.now() + 5 * 60 * 1000); // 5分钟后可刷新
  const [shopRefreshCooldown, setShopRefreshCooldown] = useState<number>(() => {
    // 初始化时计算剩余倒计时
    const now = Date.now();
    const refreshTime = Date.now() + 5 * 60 * 1000;
    return Math.max(0, Math.floor((refreshTime - now) / 1000));
  }); // 倒计时（秒）

  // Generate random faction list (when not in a faction)
  const availableSects = useMemo(() => {
    if (player.sectId) return SECTS;
    // 生成更多宗门以确保能选出6个唯一的
    const allSects = generateRandomSects(player.realm, 12);
    const uniqueSects: typeof SECTS = [];
    const seenNames = new Set<string>();

    // Deduplicate by faction name, keep first occurrence
    for (const sect of allSects) {
      if (!seenNames.has(sect.name)) {
        seenNames.add(sect.name);
        uniqueSects.push(sect);
        if (uniqueSects.length >= 6) break;
      }
    }

    return uniqueSects.slice(0, 6); // 确保最多返回6个
  }, [player.realm, player.sectId, refreshKey]);

  // Generate random ops list (when in a faction)
  const randomTasks = useMemo(() => {
    if (!player.sectId) return [];
    return generateRandomSectTasks(player.sectRank, player.realm, 12);
  }, [player.sectId, player.sectRank, player.realm, refreshKey]);

  // Filter ops by rank rank
  const filteredTasks = useMemo(() => {
    if (realmFilter === 'all') return randomTasks;
    const filterRealmIndex = REALM_ORDER.indexOf(realmFilter);
    return randomTasks.filter((task) => {
      // If no rank requirement, show all ops
      if (!task.minRealm) return true;
      // Only show ops with rank requirement <= selected rank
      const taskRealmIndex = REALM_ORDER.indexOf(task.minRealm);
      return taskRealmIndex <= filterRealmIndex;
    });
  }, [randomTasks, realmFilter]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Quartermaster restock handling
  const handleShopRefresh = React.useCallback(() => {
    const now = Date.now();
    if (now >= shopRefreshTime) {
      setSectShopItems(generateSectShopItems(1));
      if (player.sectContribution >= 5000) {
        setSectShopItemsFloor2(generateSectShopItems(2));
      }
      const newRefreshTime = now + 5 * 60 * 1000; // 设置下次刷新时间
      setShopRefreshTime(newRefreshTime);
      setShopRefreshCooldown(5 * 60); // 重置倒计时
      setBuyQuantities({}); // 清空购买数量
    }
  }, [shopRefreshTime, player.sectContribution]);

  // Quartermaster restock countdown update
  React.useEffect(() => {
    if (activeTab !== 'shop' || !isOpen) return;

    const updateCooldown = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((shopRefreshTime - now) / 1000));
      setShopRefreshCooldown(remaining);

      // If countdown ends, auto-restock
      if (remaining === 0 && now >= shopRefreshTime) {
        const newItems = generateSectShopItems();
        setSectShopItems(newItems);
        const newRefreshTime = now + 5 * 60 * 1000;
        setShopRefreshTime(newRefreshTime);
        setShopRefreshCooldown(5 * 60);
        setBuyQuantities({});
      }
    };

    // 立即更新一次
    updateCooldown();

    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  }, [activeTab, isOpen, shopRefreshTime]);

  if (!isOpen) return null;

  // Get current faction info, prioritize saved info (for random factions)
  const currentSect =
    (player.currentSectInfo ? {
      id: player.currentSectInfo.id,
      name: player.currentSectInfo.name,
      description: '',
      reqRealm: RealmType.QiRefining,
      grade: '黄',
      exitCost: player.currentSectInfo.exitCost,
    } : null) ||
    availableSects.find((s) => s.id === player.sectId) ||
    SECTS.find((s) => s.id === player.sectId);
  const getRealmIndex = (r: RealmType) => REALM_ORDER.indexOf(r);

  // -- Selection View (Not in a sect) --
  if (!player.sectId) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-paper-800 w-full max-w-4xl rounded border border-stone-600 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
          <div className="p-4 border-b border-stone-600 flex justify-between items-center bg-ink-800 rounded-t">
            <h3 className="text-xl font-serif text-mystic-gold flex items-center gap-2">
              <Users size={20} /> Enlist with Factions
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="px-3 py-1.5 bg-stone-700 hover:bg-stone-600 text-stone-200 border border-stone-600 rounded text-sm flex items-center gap-1.5 transition-colors"
                title="Refresh Faction List"
              >
                <RefreshCw size={16} />
                <span className="hidden md:inline">Refresh</span>
              </button>
              <button
                onClick={onClose}
                className="text-stone-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="modal-scroll-container modal-scroll-content p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {availableSects.map((sect) => {
              const canJoin =
                getRealmIndex(player.realm) >= getRealmIndex(sect.reqRealm);
              return (
                <div
                  key={sect.id}
                  className="bg-ink-800 border border-stone-700 p-4 rounded flex flex-col"
                >
                  <h4 className="text-xl font-serif font-bold text-stone-200 mb-2">
                    {sect.name}
                  </h4>
                  <p className="text-stone-400 text-sm mb-4 flex-1">
                    {sect.description}
                  </p>

                  <div className="text-xs text-stone-500 mb-4">
                    Minimum Requirement:{' '}
                    <span
                      className={canJoin ? 'text-stone-300' : 'text-red-400'}
                    >
                      {sect.reqRealm}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (canJoin) {
                        onJoinSect(sect.id, sect.name, { exitCost: sect.exitCost });
                      }
                    }}
                    disabled={!canJoin}
                    className={`
                      w-full py-2 rounded font-serif text-sm transition-colors border touch-manipulation
                      ${canJoin
                        ? 'bg-mystic-jade/20 text-mystic-jade border-mystic-jade hover:bg-mystic-jade/30 active:bg-mystic-jade/40'
                        : 'bg-stone-800 text-stone-600 border-stone-700 cursor-not-allowed'
                      }
                    `}
                  >
                    {canJoin ? 'Enlist' : 'Rank Insufficient'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // -- Dashboard View (In a sect) --

  // Promotion Logic
  const ranks = Object.values(SectRank);
  const currentRankIdx = ranks.indexOf(player.sectRank);
  const nextRank =
    currentRankIdx < ranks.length - 1 ? ranks[currentRankIdx + 1] : null;
  const nextReq = nextRank ? SECT_RANK_REQUIREMENTS[nextRank] : null;

  const canPromote =
    nextRank &&
    nextReq &&
    player.sectContribution >= nextReq.contribution &&
    getRealmIndex(player.realm) >= nextReq.realmIndex;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-end md:items-center justify-center z-50 p-0 md:p-4 backdrop-blur-sm touch-manipulation"
      onClick={onClose}
    >
      <div
        className="bg-paper-800 w-full h-[80vh] md:h-auto md:max-w-4xl md:rounded-t-2xl md:rounded-b-lg border-0 md:border border-stone-600 shadow-2xl flex flex-col md:h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-3 md:p-4 border-b border-stone-600 bg-ink-800 md:rounded-t flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-xl md:text-2xl font-serif text-mystic-gold">
                {currentSect?.name}
              </h3>
              <span className="text-[10px] md:text-xs px-2 py-0.5 rounded bg-stone-700 text-stone-300 border border-stone-600 flex items-center gap-1">
                <Shield size={10} className="text-blue-400" />
                {SECT_RANK_DATA[player.sectRank]?.title || player.sectRank}
              </span>
            </div>
            <div className="text-xs md:text-sm text-stone-400 flex gap-4">
              <span>
                Commendations:{' '}
                <span className="text-white font-bold">
                  {player.sectContribution}
                </span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === 'mission' && (
              <button
                onClick={handleRefresh}
                className="px-3 py-1.5 bg-stone-700 hover:bg-stone-600 text-stone-200 border border-stone-600 rounded text-sm flex items-center gap-1.5 transition-colors min-h-[44px] md:min-h-0 touch-manipulation"
                title="Refresh Ops List"
              >
                <RefreshCw size={16} />
                <span className="hidden md:inline">Refresh</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-stone-400 active:text-white min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex border-b border-stone-700 bg-ink-900">
          <button
            onClick={() => setActiveTab('hall')}
            className={`flex-1 py-3 text-sm font-serif transition-colors flex items-center justify-center gap-2 ${activeTab === 'hall' ? 'text-mystic-gold bg-paper-800 border-t-2 border-mystic-gold' : 'text-stone-500 hover:text-stone-300'}`}
          >
            <Shield size={16} /> Headquarters
          </button>
          <button
            onClick={() => setActiveTab('mission')}
            className={`flex-1 py-3 text-sm font-serif transition-colors flex items-center justify-center gap-2 ${activeTab === 'mission' ? 'text-mystic-gold bg-paper-800 border-t-2 border-mystic-gold' : 'text-stone-500 hover:text-stone-300'}`}
          >
            <Scroll size={16} /> Ops Center
          </button>
          <button
            onClick={() => setActiveTab('shop')}
            className={`flex-1 py-3 text-sm font-serif transition-colors flex items-center justify-center gap-2 ${activeTab === 'shop' ? 'text-mystic-gold bg-paper-800 border-t-2 border-mystic-gold' : 'text-stone-500 hover:text-stone-300'}`}
          >
            <ShoppingBag size={16} /> Quartermaster
          </button>
        </div>

        {/* Content */}
        <div className="modal-scroll-container modal-scroll-content p-6 bg-paper-800 max-h-[68vh]">
          {/* Main Hall */}
          {activeTab === 'hall' && (
            <div className="space-y-6">
              <div className="bg-ink-800 p-4 rounded border border-stone-700">
                <h4 className="font-serif text-lg text-stone-200 mb-2 border-b border-stone-700 pb-2">
                  Promotion
                </h4>
                {nextRank ? (
                  <div>
                    <p className="text-sm text-stone-400 mb-4">
                      Next Rank:
                      <span className="text-stone-200 font-bold ml-1">
                        {SECT_RANK_DATA[nextRank]?.title || nextRank}
                      </span>
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div className="bg-ink-900 p-2 rounded">
                        <span className="text-stone-500 block">Required Commendations</span>
                        <span
                          className={
                            player.sectContribution >=
                              (nextReq?.contribution || 0)
                              ? 'text-mystic-jade'
                              : 'text-red-400'
                          }
                        >
                          {player.sectContribution} / {nextReq?.contribution}
                        </span>
                      </div>
                      <div className="bg-ink-900 p-2 rounded">
                        <span className="text-stone-500 block">Required Rank</span>
                        <span
                          className={
                            getRealmIndex(player.realm) >=
                              (nextReq?.realmIndex || 0)
                              ? 'text-mystic-jade'
                              : 'text-red-400'
                          }
                        >
                          {Object.values(RealmType)[nextReq?.realmIndex || 0]}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (!canPromote) return;
                        // 如果是晋升到宗主，弹出确认对话框
                        if (nextRank === SectRank.Leader) {
                          showConfirm(
                            'Leading this faction requires challenging the current Overseer in the wastes.\n\nDefeat will result in lost commendations and health. Confirm challenge?',
                            'Overseer Challenge',
                            () => {
                              onChallengeLeader();
                            }
                          );
                        } else {
                          // 其他等级直接晋升
                          onPromote();
                        }
                      }}
                      disabled={!canPromote}
                      className={`
                         w-full py-2 rounded font-serif text-sm transition-colors flex items-center justify-center gap-2
                         ${canPromote
                          ? 'bg-mystic-gold/20 text-mystic-gold border border-mystic-gold hover:bg-mystic-gold/30'
                          : 'bg-stone-800 text-stone-600 border border-stone-700 cursor-not-allowed'
                        }
                       `}
                    >
                      <ArrowUp size={16} /> Request Promotion
                    </button>
                  </div>
                ) : (
                  <div>
                    {player.sectRank === SectRank.Elder && (
                      <div className="mt-4 pt-4 border-t border-stone-700">
                        <p className="text-sm text-stone-400 mb-2 text-center">
                          You are an Officer. Do you have the ambition to challenge the current Overseer?
                        </p>
                        <button
                          onClick={onChallengeLeader}
                          className="w-full py-3 bg-red-900/30 text-red-400 border border-red-900 hover:bg-red-900/50 rounded font-serif text-base transition-all animate-pulse"
                        >
                          🔥 CHALLENGE OVERSEER 🔥
                        </button>
                      </div>
                    )}
                    <p className="text-mystic-gold text-center py-4">
                      {player.sectRank === SectRank.Leader ? (
                        <div className="space-y-4">
                          <p>You have become the Overseer, commander of all.</p>
                          <div className="bg-mystic-gold/10 p-4 rounded border border-mystic-gold/30">
                            <h5 className="text-mystic-gold font-bold mb-2">Overseer Privileges</h5>
                            <ul className="text-xs text-stone-400 text-left space-y-1 list-disc list-inside">
                              <li>Quartermaster exchanges enjoy a <span className="text-mystic-gold">50% discount</span></li>
                              <li>Further faction management functions will be unlocked later...</li>
                            </ul>
                          </div>
                        </div>
                      ) : 'You are a vital pillar of the community.'}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-ink-800 p-4 rounded border border-stone-700">
                <h4 className="font-serif text-lg text-stone-200 mb-2 border-b border-stone-700 pb-2">
                  Discharge
                </h4>
                <p className="text-sm text-stone-500 mb-4">
                  Leaving the faction will reset all commendations. You can choose Honorable Discharge (pay a fee) or simply Desert (become a target).
                </p>
                {currentSect && currentSect.exitCost ? (
                  <div className="mb-4 p-3 bg-ink-900 rounded border border-stone-600">
                    <p className="text-xs text-stone-400 mb-2">Honorable Discharge Cost:</p>
                    <div className="text-xs text-stone-300 space-y-1">
                      {currentSect.exitCost.spiritStones && (
                        <div>Caps: {currentSect.exitCost.spiritStones}</div>
                      )}
                      {currentSect.exitCost.items && Array.isArray(currentSect.exitCost.items) && currentSect.exitCost.items.map((item, idx) => (
                        <div key={idx}>{item.name} x{item.quantity}</div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 p-3 bg-ink-900 rounded border border-stone-600">
                    <p className="text-xs text-stone-400 mb-2">Honorable Discharge Cost:</p>
                    <div className="text-xs text-stone-300 space-y-1">
                      <div>Caps: 300</div>
                      <div>Mutant Weed x5</div>
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={onSafeLeaveSect}
                    className="flex-1 px-4 py-2 border border-yellow-900 text-yellow-400 hover:bg-yellow-900/20 rounded text-sm transition-colors"
                  >
                    Honorable Discharge
                  </button>
                  <button
                    onClick={onLeaveSect}
                    className="flex-1 px-4 py-2 border border-red-900 text-red-400 hover:bg-red-900/20 rounded text-sm transition-colors"
                  >
                    Desert Faction
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mission Hall */}
          {activeTab === 'mission' && (
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-4 flex-shrink-0 flex-wrap gap-2">
                <h4 className="font-serif text-lg text-stone-200">Operations List</h4>
                <div className="flex items-center gap-2">
                  <select
                    value={realmFilter}
                    onChange={(e) => setRealmFilter(e.target.value as RealmType | 'all')}
                    className="px-3 py-1.5 bg-stone-700 hover:bg-stone-600 text-stone-200 border border-stone-600 rounded text-sm transition-colors cursor-pointer"
                    title="Filter Ops by Rank"
                  >
                    <option value="all">All Ranks</option>
                    {REALM_ORDER.map((realm) => (
                      <option key={realm} value={realm}>
                        {realm}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleRefresh}
                    className="px-3 py-1.5 bg-stone-700 hover:bg-stone-600 text-stone-200 border border-stone-600 rounded text-sm flex items-center gap-1.5 transition-colors"
                    title="Refresh Ops List"
                  >
                    <RefreshCw size={16} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>
              <div className="modal-scroll-container modal-scroll-content grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
                {filteredTasks.length === 0 ? (
                  <div className="col-span-full text-center text-stone-500 py-10 font-serif">
                    No operations matching current filters
                  </div>
                ) : (
                  filteredTasks.map((task) => {
                    // Check if op can be completed (but don't block click)
                    const taskStatus = (() => {
                      const reasons: string[] = [];

                      // Check rank requirement
                      if (task.minRealm) {
                        const realmIndex = REALM_ORDER.indexOf(player.realm);
                        const minRealmIndex = REALM_ORDER.indexOf(task.minRealm);
                        if (realmIndex < minRealmIndex) {
                          reasons.push('Rank Insufficient');
                        }
                      }
                      if (
                        task.cost?.spiritStones &&
                        player.spiritStones < task.cost.spiritStones
                      ) {
                        reasons.push('Caps Insufficient');
                      }
                      if (task.cost?.items && Array.isArray(player.inventory)) {
                        for (const itemReq of task.cost.items) {
                          const item = player.inventory.find(
                            (i) => i.name === itemReq.name
                          );
                          if (!item || item.quantity < itemReq.quantity) {
                            reasons.push(`Missing ${itemReq.name}`);
                            break;
                          }
                        }
                      }
                      // Check daily op limit (per individual op)
                      const today = new Date().toISOString().split('T')[0];
                      const lastReset = player.lastTaskResetDate || today;
                      const TASK_DAILY_LIMIT = 3; // 每个任务每天最多3次

                      if (lastReset === today) {
                        const dailyTaskCount = player.dailyTaskCount || {};
                        const currentCount = dailyTaskCount[task.id] || 0;
                        if (currentCount >= TASK_DAILY_LIMIT) {
                          reasons.push(`Today's completion limit (${TASK_DAILY_LIMIT}) reached`);
                        }
                      }
                      return {
                        canComplete: reasons.length === 0,
                        reasons: reasons.join('、'),
                      };
                    })();

                    const timeCostText = {
                      instant: 'Instant',
                      short: 'Short',
                      medium: 'Medium',
                      long: 'Long',
                    }[task.timeCost];

                    // Op quality color config
                    const qualityColors = {
                      普通: 'text-stone-400 border-stone-600 bg-stone-900/20',
                      稀有: 'text-blue-400 border-blue-600 bg-blue-900/20',
                      传说: 'text-purple-400 border-purple-600 bg-purple-900/20',
                      仙品: 'text-yellow-400 border-yellow-600 bg-yellow-900/20',
                    };

                    // Difficulty color config
                    const difficultyColors = {
                      简单: 'text-green-400',
                      普通: 'text-blue-400',
                      困难: 'text-orange-400',
                      极难: 'text-red-400',
                    };

                    // Check rank requirement
                    const meetsRealmRequirement = task.minRealm
                      ? REALM_ORDER.indexOf(player.realm) >= REALM_ORDER.indexOf(task.minRealm)
                      : true;

                    return (
                      <div
                        key={task.id}
                        className={`bg-ink-800 p-4 rounded border flex flex-col ${task.quality === '仙品'
                          ? 'border-yellow-600/50 shadow-lg shadow-yellow-900/20'
                          : task.quality === '传说'
                            ? 'border-purple-600/50 shadow-md shadow-purple-900/10'
                            : 'border-stone-700'
                          }`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-serif font-bold text-stone-200 flex-1">
                            {task.name}
                            {task.isDailySpecial && (
                              <span className="text-xs text-yellow-400 ml-2 animate-pulse">
                                ⭐ Daily Special
                              </span>
                            )}
                          </h4>
                          {task.quality && (
                            <span className={`text-xs px-2 py-0.5 rounded border ${qualityColors[task.quality]}`}>
                              {task.quality === '仙品' ? 'Legendary' : task.quality === '传说' ? 'Epic' : task.quality === '稀有' ? 'Rare' : 'Common'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-500 mb-3 flex-1">
                          {task.description}
                        </p>

                        {/* 任务标签 */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className={`text-xs px-2 py-0.5 rounded border ${difficultyColors[task.difficulty]} bg-stone-900/30 border-stone-600`}>
                            Diff: {task.difficulty === '简单' ? 'Easy' : task.difficulty === '普通' ? 'Normal' : task.difficulty === '困难' ? 'Hard' : 'Extreme'}
                          </span>
                          {task.minRealm && (
                            <span className={`text-xs px-2 py-0.5 rounded border ${meetsRealmRequirement
                              ? 'text-green-400 border-green-600 bg-green-900/20'
                              : 'text-red-400 border-red-600 bg-red-900/20'
                              }`}>
                              Rank: {task.minRealm}
                              {!meetsRealmRequirement && ' (Low)'}
                            </span>
                          )}
                        </div>

                        <div className="space-y-2 mb-4">
                          {task.cost && (
                            <div className="text-xs text-red-400">
                              Cost:{' '}
                              {task.cost.spiritStones && (
                                <span>{task.cost.spiritStones} Caps</span>
                              )}
                              {task.cost.items &&
                                task.cost.items && Array.isArray(task.cost.items) && task.cost.items.map((item, idx) => (
                                  <span key={idx}>
                                    {idx > 0 && '、'}
                                    {item.quantity} {item.name}
                                  </span>
                                ))}
                            </div>
                          )}
                          <div className="text-xs text-stone-400">
                            Reward:{' '}
                            <span className="text-mystic-gold">
                              {task.reward.contribution} Commends
                            </span>
                            {task.reward.exp && (
                              <span>、{task.reward.exp} Data</span>
                            )}
                            {task.reward.spiritStones && (
                              <span>、{task.reward.spiritStones} Caps</span>
                            )}
                            {task.reward.items &&
                              task.reward.items.map((item, idx) => (
                                <span key={idx}>
                                  {idx === 0 && '、'}
                                  {item.quantity} {item.name}
                                </span>
                              ))}
                          </div>
                          <div className="text-xs text-stone-500">
                            Time: {timeCostText}
                          </div>
                          {task.successRate && (
                            <div className="text-xs text-yellow-400">
                              Perfect Success Probability: {task.successRate}%
                            </div>
                          )}
                          {task.completionBonus && (
                            <div className="text-xs text-purple-400">
                              Extra rewards for perfect execution
                            </div>
                          )}
                          {task.typeBonus && player.lastCompletedTaskType === task.type && (
                            <div className="text-xs text-green-400 font-bold">
                              ⚡ Consecutive Op Bonus: +{task.typeBonus}%
                            </div>
                          )}
                          {task.recommendedFor && (() => {
                            const recommendations: string[] = [];
                            if (task.recommendedFor.highAttack && player.attack > 50) {
                              recommendations.push('High FP');
                            }
                            if (task.recommendedFor.highDefense && player.defense > 50) {
                              recommendations.push('High DR');
                            }
                            if (task.recommendedFor.highSpirit && player.spirit > 50) {
                              recommendations.push('High PER');
                            }
                            if (task.recommendedFor.highSpeed && player.speed > 50) {
                              recommendations.push('High AGI');
                            }
                            return recommendations.length > 0 ? (
                              <div className="text-xs text-blue-400">
                                💡 Rec: {recommendations.join(', ')}
                              </div>
                            ) : null;
                          })()}
                          {(() => {
                            const today = new Date().toISOString().split('T')[0];
                            const lastReset = player.lastTaskResetDate || today;
                            const TASK_DAILY_LIMIT = 3; // Max 3 times per op per day

                            if (lastReset === today) {
                              const dailyTaskCount = player.dailyTaskCount || {};
                              const currentCount = dailyTaskCount[task.id] || 0;
                              return (
                                <div className="text-xs text-stone-500">
                                  Today's Completions: {currentCount} / {TASK_DAILY_LIMIT}
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>

                        <button
                          onClick={() => {
                            if (!taskStatus.canComplete && taskStatus.reasons) {
                              // If incomplete, show tooltip but allow click for details
                              // Actual check performed on op execution
                            }
                            setSelectedTask(task);
                          }}
                          className={`w-full py-2 rounded text-sm ${!taskStatus.canComplete
                            ? 'bg-stone-800 text-stone-400 border border-stone-600 hover:bg-stone-700'
                            : 'bg-stone-700 hover:bg-stone-600 text-stone-200'
                            }`}
                          title={!taskStatus.canComplete ? `Requirement Not Met: ${taskStatus.reasons}` : ''}
                        >
                          {!taskStatus.canComplete ? `Incomplete (${taskStatus.reasons})` : 'Accept Op'}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Treasure Pavilion */}
          {activeTab === 'shop' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h4 className="font-serif text-lg text-stone-200">Quartermaster</h4>
                  <div className="text-xs text-stone-400 mt-1 flex items-center gap-2">
                    <button
                      onClick={() => setShopFloor(1)}
                      className={`px-2 py-1 rounded text-xs ${shopFloor === 1 ? 'bg-stone-700 text-stone-200' : 'bg-stone-800 text-stone-500'}`}
                    >
                      Level 1
                    </button>
                    <button
                      onClick={() => player.sectContribution >= 5000 && setShopFloor(2)}
                      disabled={player.sectContribution < 5000}
                      className={`px-2 py-1 rounded text-xs ${shopFloor === 2 ? 'bg-stone-700 text-stone-200' : 'bg-stone-800 text-stone-500'} ${player.sectContribution < 5000 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Level 2 {player.sectContribution >= 5000 ? '✓' : '(Requires 5000 Commendations)'}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {shopRefreshCooldown > 0 ? (
                    <span className="text-xs text-stone-400">
                      {Math.floor(shopRefreshCooldown / 60)}:{(shopRefreshCooldown % 60).toString().padStart(2, '0')} until restock
                    </span>
                  ) : (
                    <span className="text-xs text-green-400">Restock Available</span>
                  )}
                  <button
                    onClick={handleShopRefresh}
                    disabled={shopRefreshCooldown > 0}
                    className={`px-3 py-1.5 rounded text-sm border flex items-center gap-1.5 transition-colors ${shopRefreshCooldown > 0
                      ? 'bg-stone-800 text-stone-600 border-stone-700 cursor-not-allowed'
                      : 'bg-blue-700 hover:bg-blue-600 text-stone-200 border-blue-600'
                      }`}
                    title={shopRefreshCooldown > 0 ? `Wait ${Math.floor(shopRefreshCooldown / 60)}m ${shopRefreshCooldown % 60}s` : 'Refresh Quartermaster (5min CD)'}
                  >
                    <RefreshCw size={16} />
                    <span>Restock</span>
                  </button>
                </div>
              </div>
              {(shopFloor === 1 ? sectShopItems : sectShopItemsFloor2).map((item, idx) => {
                const quantity = buyQuantities[idx] || 1;
                // Overseer enjoys 50% discount
                const baseCost = player.sectRank === SectRank.Leader ? Math.ceil(item.cost * 0.5) : item.cost;
                const totalCost = baseCost * quantity;
                const canBuy = player.sectContribution >= totalCost;

                return (
                  <div
                    key={idx}
                    className="bg-ink-800 p-3 rounded border border-stone-700 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-stone-200">
                        {item.name}
                        {player.sectRank === SectRank.Leader && (
                          <span className="text-[10px] ml-2 px-1 bg-mystic-gold/20 text-mystic-gold border border-mystic-gold/30 rounded">
                            Overseer Perk: 50% Off
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-stone-500">
                        {item.item.description}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-mystic-gold font-bold">
                        {baseCost} Commends
                        {quantity > 1 && (
                          <span className="text-xs text-stone-400 ml-1">
                            x{quantity} = {totalCost}
                          </span>
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 border border-stone-600 rounded">
                          <button
                            onClick={() =>
                              setBuyQuantities((prev) => ({
                                ...prev,
                                [idx]: Math.max(1, (prev[idx] || 1) - 1),
                              }))
                            }
                            className="px-2 py-1 text-stone-400 hover:text-white"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => {
                              const val = Math.max(
                                1,
                                parseInt(e.target.value) || 1
                              );
                              setBuyQuantities((prev) => ({
                                ...prev,
                                [idx]: val,
                              }));
                            }}
                            className="w-12 text-center bg-transparent text-stone-200 border-0 focus:outline-none"
                          />
                          <button
                            onClick={() =>
                              setBuyQuantities((prev) => ({
                                ...prev,
                                [idx]: (prev[idx] || 1) + 1,
                              }))
                            }
                            className="px-2 py-1 text-stone-400 hover:text-white"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            onBuy(item.item, baseCost, quantity);
                            setBuyQuantities((prev) => ({ ...prev, [idx]: 1 }));
                          }}
                          disabled={!canBuy}
                          className={`
                            px-3 py-1.5 rounded text-xs border
                            ${canBuy
                              ? 'bg-stone-700 hover:bg-stone-600 text-stone-200 border-stone-600'
                              : 'bg-stone-900 text-stone-600 border-stone-800 cursor-not-allowed'
                            }
                          `}
                        >
                          Exchange
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Op Execution Modal */}
      {selectedTask && (
        <SectTaskModal
          isOpen={true}
          onClose={() => {
            setSelectedTask(null);
          }}
          task={selectedTask}
          player={player}
          setItemActionLog={setItemActionLog}
          onTaskComplete={(task, encounterResult, isPerfectCompletion) => {
            onTask(task, encounterResult, isPerfectCompletion);
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
};

export default React.memo(SectModal);
