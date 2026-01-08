import React, { useState, useMemo } from 'react';
import { PlayerStats, SectRank, RealmType, Item, AdventureResult } from '../types';
import { SECTS, SECT_RANK_REQUIREMENTS, REALM_ORDER, SECT_RANK_DATA } from '../constants/index';
import { generateRandomSects, generateRandomSectTasks, generateSectShopItems, RandomSectTask } from '../services/randomService';
import { ASSETS } from '../constants/assets';
import {
  X, Users, ShoppingBag, Shield, Scroll, ArrowUp, RefreshCw } from 'lucide-react';
import SectTaskModal from './SectTaskModal';
import { showConfirm } from '../utils/toastUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  onJoinSect: (sectId: string, sectName?: string, sectInfo?: { exitCost?: { spiritStones?: number; items?: { name: string; quantity: number }[] } }) => void;
  onLeaveSect: () => void;
  onSafeLeaveSect: () => void;
  onTask: (task: RandomSectTask, encounterResult?: AdventureResult, isPerfectCompletion?: boolean) => void;
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
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm font-mono">
        <div className="bg-ink-950 w-full max-w-4xl rounded-none border border-stone-800 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden relative">
          {/* 背景纹理 */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
          
          {/* CRT 效果层 */}
          <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none z-50"></div>
          <div className="crt-noise"></div>
          <div className="crt-vignette"></div>

          <div className="p-4 border-b border-stone-800 flex justify-between items-center bg-stone-950 rounded-none z-10">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-2">
                <Users size={20} /> Faction_Recruitment_Terminal
              </h3>
              <div className="hidden md:block px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] uppercase tracking-widest">Scanning_Factions...</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 rounded-none text-xs flex items-center gap-1.5 transition-colors uppercase tracking-widest relative z-10"
                title="Refresh Faction List"
              >
                <RefreshCw size={16} />
                <span className="hidden md:inline">[ RE-SCAN ]</span>
              </button>
              <button
                onClick={onClose}
                className="text-stone-500 hover:text-white transition-colors relative z-10"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="modal-scroll-container modal-scroll-content p-6 grid grid-cols-1 md:grid-cols-3 gap-4 bg-ink-950/50 z-10">
            {availableSects.map((sect) => {
              const canJoin =
                getRealmIndex(player.realm) >= getRealmIndex(sect.reqRealm);
              return (
                <div
                  key={sect.id}
                  className="bg-stone-900/40 border border-stone-800 p-4 rounded-none flex flex-col relative group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-stone-800/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <div className="relative z-10 flex flex-col h-full">
                    <h4 className="text-lg font-bold text-emerald-400 mb-2 uppercase tracking-wider">
                      {sect.name}
                    </h4>
                    <p className="text-stone-500 text-xs mb-4 flex-1 uppercase tracking-tighter leading-relaxed">
                      {sect.description}
                    </p>

                    <div className="text-[10px] text-stone-600 mb-4 uppercase tracking-widest">
                      MIN_NEURAL_LINK:{' '}
                      <span
                        className={canJoin ? 'text-stone-400' : 'text-red-900'}
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
                        w-full py-2 rounded-none font-bold text-xs transition-colors border touch-manipulation uppercase tracking-widest relative z-10
                        ${canJoin
                          ? 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700 active:bg-stone-600'
                          : 'bg-stone-950 text-stone-800 border-stone-900 cursor-not-allowed'
                        }
                      `}
                    >
                      {canJoin ? '[ ENLIST_NOW ]' : '[ LINK_INSUFFICIENT ]'}
                    </button>
                  </div>
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
        className="bg-ink-950 w-full h-[80vh] md:h-auto md:max-w-4xl md:rounded-none border-0 md:border border-stone-800 shadow-2xl flex flex-col md:h-[80vh] relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
        {/* CRT Visual Layers */}
        <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none z-50"></div>
        {/* Header */}
        <div className="p-3 md:p-4 border-b border-stone-800 bg-stone-950 md:rounded-none flex justify-between items-start relative z-10">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-xl md:text-2xl font-bold text-emerald-500 uppercase tracking-wider">
                {currentSect?.name}
              </h3>
              <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] uppercase tracking-widest flex items-center gap-1">
                <Shield size={10} className="text-emerald-500" />
                {SECT_RANK_DATA[player.sectRank]?.title || player.sectRank}
              </div>
            </div>
            <div className="text-[10px] md:text-xs text-stone-500 flex gap-4 uppercase tracking-tighter">
              <span>
                Commendations_Accumulated:{' '}
                <span className="text-emerald-400 font-bold">
                  {player.sectContribution}
                </span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === 'mission' && (
              <button
                onClick={handleRefresh}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 rounded-none text-[10px] flex items-center gap-1.5 transition-colors min-h-[44px] md:min-h-0 touch-manipulation uppercase tracking-widest relative z-10"
                title="Refresh Ops List"
              >
                <RefreshCw size={14} />
                <span className="hidden md:inline">[ RE-SCAN_OPS ]</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-stone-500 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation transition-colors relative z-10"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex border-b border-stone-800 bg-ink-950 relative z-10">
          <button
            onClick={() => setActiveTab('hall')}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${activeTab === 'hall' ? 'text-emerald-400 bg-stone-900/40 border-b-2 border-emerald-500' : 'text-stone-600 hover:text-stone-400 hover:bg-stone-900/20'}`}
          >
            <Shield size={14} /> Headquarters
          </button>
          <button
            onClick={() => setActiveTab('mission')}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${activeTab === 'mission' ? 'text-emerald-400 bg-stone-900/40 border-b-2 border-emerald-500' : 'text-stone-600 hover:text-stone-400 hover:bg-stone-900/20'}`}
          >
            <Scroll size={14} /> Ops_Center
          </button>
          <button
            onClick={() => setActiveTab('shop')}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${activeTab === 'shop' ? 'text-emerald-400 bg-stone-900/40 border-b-2 border-emerald-500' : 'text-stone-600 hover:text-stone-400 hover:bg-stone-900/20'}`}
          >
            <ShoppingBag size={14} /> Quartermaster
          </button>
        </div>

        {/* Content */}
        <div className="modal-scroll-container modal-scroll-content p-6 bg-ink-950/50 max-h-[68vh] z-10">
          {/* Main Hall */}
          {activeTab === 'hall' && (
            <div className="space-y-6">
              <div className="bg-stone-900/40 p-4 rounded-none border border-stone-800 relative overflow-hidden group">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
                <h4 className="font-bold text-xs text-stone-400 mb-2 border-b border-stone-800 pb-2 uppercase tracking-widest relative z-10">
                  Personnel_Promotion_Protocol
                </h4>
                {nextRank ? (
                  <div className="relative z-10">
                    <p className="text-[10px] text-stone-500 mb-4 uppercase tracking-tighter">
                      Next_Rank_Designation:
                      <span className="text-emerald-400 font-bold ml-1">
                        {SECT_RANK_DATA[nextRank]?.title || nextRank}
                      </span>
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-[10px] mb-4 uppercase tracking-widest">
                      <div className="bg-stone-950 p-2 border border-stone-800">
                        <span className="text-stone-600 block mb-1">REQ_COMMENDATIONS</span>
                        <span
                          className={
                            player.sectContribution >=
                              (nextReq?.contribution || 0)
                              ? 'text-emerald-400'
                              : 'text-red-900'
                          }
                        >
                          {player.sectContribution} / {nextReq?.contribution}
                        </span>
                      </div>
                      <div className="bg-stone-950 p-2 border border-stone-800">
                        <span className="text-stone-600 block mb-1">REQ_NEURAL_LINK</span>
                        <span
                          className={
                            getRealmIndex(player.realm) >=
                              (nextReq?.realmIndex || 0)
                              ? 'text-emerald-400'
                              : 'text-red-900'
                          }
                        >
                          {Object.values(RealmType)[nextReq?.realmIndex || 0]}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (!canPromote) return;
                        if (nextRank === SectRank.Leader) {
                          showConfirm(
                            'Leading this faction requires challenging the current Overseer in the wastes.\n\nDefeat will result in lost commendations and health. Confirm challenge?',
                            'Overseer Challenge',
                            () => {
                              onChallengeLeader();
                            }
                          );
                        } else {
                          onPromote();
                        }
                      }}
                      disabled={!canPromote}
                      className={`
                         w-full py-2 rounded-none font-bold text-xs transition-colors flex items-center justify-center gap-2 border uppercase tracking-widest relative z-10
                         ${canPromote
                          ? 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                          : 'bg-stone-950 text-stone-800 border-stone-900 cursor-not-allowed'
                        }
                       `}
                    >
                      <ArrowUp size={16} /> [ EXECUTE_PROMOTION ]
                    </button>
                  </div>
                ) : (
                  <div className="relative z-10">
                    {player.sectRank === SectRank.Elder && (
                      <div className="mt-4 pt-4 border-t border-stone-800">
                        <p className="text-[10px] text-stone-600 mb-2 text-center uppercase tracking-tighter">
                          AMBITION_DETECTED. CHALLENGE_OVERSEER?
                        </p>
                        <button
                          onClick={onChallengeLeader}
                          className="w-full py-3 bg-red-950/20 text-red-700 border border-red-900/50 hover:bg-red-950/40 rounded-none font-bold text-sm transition-all animate-pulse uppercase tracking-[0.2em] relative z-10"
                        >
                          [ 🔥 CHALLENGE_OVERSEER 🔥 ]
                        </button>
                      </div>
                    )}
                    <p className="text-emerald-500/60 text-center py-4 text-xs uppercase tracking-widest relative z-10">
                      {player.sectRank === SectRank.Leader ? (
                        <div className="space-y-4">
                          <p>OVERSEER_STATUS: ACTIVE. COMMAND_CONFIRMED.</p>
                          <div className="bg-emerald-500/5 p-4 border border-emerald-500/20">
                            <h5 className="text-emerald-500 font-bold mb-2 text-[10px] tracking-[0.2em]">OVERSEER_PRIVILEGES</h5>
                            <ul className="text-[9px] text-stone-600 text-left space-y-1 uppercase tracking-tighter">
                              <li>• QUARTERMASTER_DISCOUNT: <span className="text-emerald-400">50%_REDUCTION</span></li>
                              <li>• ADDITIONAL_PROTOCOLS: <span className="text-emerald-500/40">LOCKED_BY_ENCRYPT_ID</span></li>
                            </ul>
                          </div>
                        </div>
                      ) : 'FACTION_PILLAR_STATUS_CONFIRMED.'}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-stone-900/40 p-4 rounded-none border border-stone-800 relative overflow-hidden group">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
                <h4 className="font-bold text-xs text-stone-400 mb-2 border-b border-stone-800 pb-2 uppercase tracking-widest relative z-10">
                  Personnel_Discharge_Protocol
                </h4>
                <p className="text-[10px] text-stone-600 mb-4 uppercase tracking-tighter leading-relaxed relative z-10">
                  TERMINATING_FACTION_STATUS_WILL_WIPE_COMMENDATIONS. SELECT_PROTOCOL:
                </p>
                {currentSect && currentSect.exitCost ? (
                  <div className="mb-4 p-3 bg-stone-950 border border-stone-800 relative z-10">
                    <p className="text-[9px] text-stone-600 mb-2 uppercase tracking-widest">Honorable_Discharge_Fee:</p>
                    <div className="text-[10px] text-stone-400 space-y-1 uppercase tracking-tighter">
                      {currentSect.exitCost.spiritStones && (
                        <div>• CAPS: {currentSect.exitCost.spiritStones}</div>
                      )}
                      {currentSect.exitCost.items && Array.isArray(currentSect.exitCost.items) && currentSect.exitCost.items.map((item, idx) => (
                        <div key={idx}>• {item.name.toUpperCase()} x{item.quantity}</div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 p-3 bg-stone-950 border border-stone-800 relative z-10">
                    <p className="text-[9px] text-stone-600 mb-2 uppercase tracking-widest">Standard_Discharge_Fee:</p>
                    <div className="text-[10px] text-stone-400 space-y-1 uppercase tracking-tighter">
                      <div>• CAPS: 300</div>
                      <div>• MUTANT_WEED x5</div>
                    </div>
                  </div>
                )}
                <div className="flex gap-2 relative z-10">
                  <button
                    onClick={onSafeLeaveSect}
                    className="flex-1 px-4 py-2 border border-emerald-900/50 text-emerald-500/80 hover:bg-emerald-900/20 rounded-none text-[10px] uppercase tracking-widest transition-colors font-bold"
                  >
                    [ HONORABLE_DISCHARGE ]
                  </button>
                  <button
                    onClick={onLeaveSect}
                    className="flex-1 px-4 py-2 border border-red-900/50 text-red-500/80 hover:bg-red-900/20 rounded-none text-[10px] uppercase tracking-widest transition-colors font-bold"
                  >
                    [ DESERT_FACTION ]
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mission Hall */}
          {activeTab === 'mission' && (
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-4 flex-shrink-0 flex-wrap gap-2 relative z-10">
                <h4 className="font-bold text-sm text-emerald-500 uppercase tracking-widest">OPERATIONS_CENTER_V2.0</h4>
                <div className="flex items-center gap-2">
                  <select
                    value={realmFilter}
                    onChange={(e) => setRealmFilter(e.target.value as RealmType | 'all')}
                    className="px-3 py-1.5 bg-stone-900 text-emerald-500 border border-stone-800 rounded-none text-[10px] uppercase tracking-widest transition-colors cursor-pointer outline-none focus:border-emerald-500/50"
                    title="Filter Ops by Rank"
                  >
                    <option value="all">[ ALL_RANKS ]</option>
                    {REALM_ORDER.map((realm) => (
                      <option key={realm} value={realm}>
                        [ {realm.toUpperCase()} ]
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleRefresh}
                    className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-emerald-500 border border-stone-800 rounded-none text-[10px] flex items-center gap-1.5 transition-colors uppercase tracking-widest"
                    title="Refresh Ops List"
                  >
                    <RefreshCw size={14} />
                    <span>[ REFRESH ]</span>
                  </button>
                </div>
              </div>
              <div className="modal-scroll-container modal-scroll-content grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
                {filteredTasks.length === 0 ? (
                  <div className="col-span-full text-center text-stone-600 py-10 uppercase tracking-widest text-[10px]">
                    NO_OPERATIONS_AVAILABLE_FOR_CURRENT_PARAMETERS
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
                          reasons.push('RANK_INSUFFICIENT');
                        }
                      }
                      if (
                        task.cost?.spiritStones &&
                        player.spiritStones < task.cost.spiritStones
                      ) {
                        reasons.push('CAPS_INSUFFICIENT');
                      }
                      if (task.cost?.items && Array.isArray(player.inventory)) {
                        for (const itemReq of task.cost.items) {
                          const item = player.inventory.find(
                            (i) => i.name === itemReq.name
                          );
                          if (!item || item.quantity < itemReq.quantity) {
                            reasons.push(`MISSING_${itemReq.name.toUpperCase().replace(/\s+/g, '_')}`);
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
                          reasons.push(`DAILY_LIMIT_REACHED_${TASK_DAILY_LIMIT}`);
                        }
                      }
                      return {
                        canComplete: reasons.length === 0,
                        reasons: reasons.join(' / '),
                      };
                    })();

                    const timeCostText = {
                      instant: 'INSTANT',
                      short: 'SHORT',
                      medium: 'MEDIUM',
                      long: 'LONG',
                    }[task.timeCost];

                    // Op quality color config
                    const qualityColors = {
                      Common: 'text-stone-400 border-stone-800 bg-stone-900/40',
                      Rare: 'text-blue-400 border-blue-900/30 bg-blue-900/10',
                      Legendary: 'text-purple-400 border-purple-900/30 bg-purple-900/10',
                      Mythic: 'text-yellow-400 border-yellow-900/30 bg-yellow-900/10',
                    };

                    // Difficulty color config
                    const difficultyColors = {
                      Easy: 'text-green-500',
                      Normal: 'text-blue-500',
                      Hard: 'text-orange-500',
                      Extreme: 'text-red-500',
                    };

                    // Check rank requirement
                    const meetsRealmRequirement = task.minRealm
                      ? REALM_ORDER.indexOf(player.realm) >= REALM_ORDER.indexOf(task.minRealm)
                      : true;

                    return (
                      <div
                        key={task.id}
                        className={`bg-stone-900/40 p-4 rounded-none border relative overflow-hidden flex flex-col group ${task.quality === 'Mythic'
                          ? 'border-yellow-600/30'
                          : task.quality === 'Legendary'
                            ? 'border-purple-600/30'
                            : 'border-stone-800'
                          }`}
                      >
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
                        <div className="flex items-start justify-between mb-2 relative z-10">
                          <h4 className="font-bold text-stone-300 flex-1 uppercase tracking-wider text-xs">
                            {task.name.replace(/\s+/g, '_')}
                            {task.isDailySpecial && (
                              <span className="text-[9px] text-yellow-500 ml-2 animate-pulse">
                                [ DAILY_SPECIAL ]
                              </span>
                            )}
                          </h4>
                          {task.quality && (
                            <span className={`text-[9px] px-1.5 py-0.5 border rounded-none uppercase tracking-widest font-bold ${qualityColors[task.quality]}`}>
                              {task.quality === 'Mythic' ? 'LEGENDARY' : task.quality === 'Legendary' ? 'EPIC' : task.quality === 'Rare' ? 'RARE' : 'COMMON'}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-stone-500 mb-4 flex-1 uppercase tracking-tighter leading-relaxed relative z-10">
                          {task.description}
                        </p>

                        {/* 任务标签 */}
                        <div className="flex flex-wrap gap-2 mb-4 relative z-10">
                          <span className={`text-[9px] px-1.5 py-0.5 border border-stone-800 bg-stone-950/50 uppercase tracking-widest ${difficultyColors[task.difficulty]}`}>
                            DIFF: {task.difficulty === 'Easy' ? 'EASY' : task.difficulty === 'Normal' ? 'NORMAL' : task.difficulty === 'Hard' ? 'HARD' : 'EXTREME'}
                          </span>
                          {task.minRealm && (
                            <span className={`text-[9px] px-1.5 py-0.5 border uppercase tracking-widest ${meetsRealmRequirement
                              ? 'text-emerald-500 border-emerald-900/30 bg-emerald-900/10'
                              : 'text-red-500 border-red-900/30 bg-red-900/10'
                              }`}>
                              RANK: {task.minRealm.toUpperCase()}
                              {!meetsRealmRequirement && ' [INSUFFICIENT]'}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5 mb-4 p-2 bg-stone-950/50 border border-stone-800/50 relative z-10">
                          {task.cost && (
                            <div className="text-[9px] text-red-400 uppercase tracking-widest flex flex-wrap gap-x-2">
                              <span className="text-red-900">COST:</span>
                              {task.cost.spiritStones && (
                                <span>{task.cost.spiritStones} CAPS</span>
                              )}
                              {task.cost.items &&
                                task.cost.items && Array.isArray(task.cost.items) && task.cost.items.map((item, idx) => (
                                  <span key={idx}>
                                    {item.quantity} {item.name.toUpperCase().replace(/\s+/g, '_')}
                                  </span>
                                ))}
                            </div>
                          )}
                          <div className="text-[9px] text-stone-400 uppercase tracking-widest flex flex-wrap gap-x-2">
                            <span className="text-stone-700">REWARD:</span>
                            <span className="text-emerald-600">
                              {task.reward.contribution} COMMENDS
                            </span>
                            {task.reward.exp && (
                              <span className="text-blue-600">{task.reward.exp} DATA</span>
                            )}
                            {task.reward.spiritStones && (
                              <span className="text-yellow-600">{task.reward.spiritStones} CAPS</span>
                            )}
                          </div>
                          <div className="text-[9px] text-stone-600 uppercase tracking-widest">
                            TIME: {timeCostText}
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedTask(task)}
                          className={`w-full py-2 rounded-none text-[10px] font-bold uppercase tracking-widest transition-colors relative z-10 ${!taskStatus.canComplete
                            ? 'bg-stone-900 text-stone-600 border border-stone-800 cursor-not-allowed'
                            : 'bg-emerald-900/20 hover:bg-emerald-900/40 text-emerald-500 border border-emerald-800/50'
                            }`}
                          title={!taskStatus.canComplete ? `SYSTEM_ERROR: ${taskStatus.reasons}` : ''}
                        >
                          {!taskStatus.canComplete ? '[ INCOMPLETE ]' : '[ ACCEPT_OPERATION ]'}
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
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="font-bold text-sm text-emerald-500 uppercase tracking-widest">QUARTERMASTER_V4.2</h4>
                  <div className="text-[10px] text-stone-500 mt-2 flex items-center gap-2">
                    <button
                      onClick={() => setShopFloor(1)}
                      className={`px-2 py-1 rounded-none border text-[9px] uppercase tracking-widest transition-colors ${shopFloor === 1 ? 'bg-emerald-900/20 text-emerald-500 border-emerald-800/50' : 'bg-stone-900 text-stone-600 border-stone-800 hover:text-stone-400'}`}
                    >
                      [ LEVEL_01 ]
                    </button>
                    <button
                      onClick={() => player.sectContribution >= 5000 && setShopFloor(2)}
                      disabled={player.sectContribution < 5000}
                      className={`px-2 py-1 rounded-none border text-[9px] uppercase tracking-widest transition-colors ${shopFloor === 2 ? 'bg-emerald-900/20 text-emerald-500 border-emerald-800/50' : 'bg-stone-900 text-stone-600 border-stone-800'} ${player.sectContribution < 5000 ? 'opacity-30 cursor-not-allowed' : 'hover:text-stone-400'}`}
                    >
                      [ LEVEL_02 {player.sectContribution >= 5000 ? '[ ACCESS_GRANTED ]' : '[ ACCESS_DENIED_5000_COMMENDS ]'} ]
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {shopRefreshCooldown > 0 ? (
                    <span className="text-[9px] text-stone-600 uppercase tracking-widest">
                      {Math.floor(shopRefreshCooldown / 60)}:{(shopRefreshCooldown % 60).toString().padStart(2, '0')} UNTIL_RESTOCK
                    </span>
                  ) : (
                    <span className="text-[9px] text-emerald-600 uppercase tracking-widest animate-pulse">RESTOCK_AVAILABLE</span>
                  )}
                  <button
                    onClick={handleShopRefresh}
                    disabled={shopRefreshCooldown > 0}
                    className={`px-3 py-1.5 rounded-none text-[10px] border flex items-center gap-1.5 transition-colors uppercase tracking-widest font-bold ${shopRefreshCooldown > 0
                      ? 'bg-stone-900 text-stone-700 border-stone-800 cursor-not-allowed'
                      : 'bg-emerald-900/20 hover:bg-emerald-900/40 text-emerald-500 border-emerald-800/50'
                      }`}
                    title={shopRefreshCooldown > 0 ? `WAIT ${Math.floor(shopRefreshCooldown / 60)}M ${shopRefreshCooldown % 60}S` : 'RESTOCK_QUARTERMASTER_5MIN_CD'}
                  >
                    <RefreshCw size={14} />
                    <span>[ RESTOCK ]</span>
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {(shopFloor === 1 ? sectShopItems : sectShopItemsFloor2).map((item, idx) => {
                  const quantity = buyQuantities[idx] || 1;
                  // Overseer enjoys 50% discount
                  const baseCost = player.sectRank === SectRank.Leader ? Math.ceil(item.cost * 0.5) : item.cost;
                  const totalCost = baseCost * quantity;
                  const canBuy = player.sectContribution >= totalCost;

                  return (
                    <div
                      key={idx}
                      className="bg-stone-900/40 p-3 rounded-none border border-stone-800 relative overflow-hidden flex items-center justify-between group"
                    >
                      <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
                      <div className="relative z-10 flex-1">
                        <div className="font-bold text-stone-300 uppercase tracking-wider text-xs flex items-center gap-2">
                          {item.name.replace(/\s+/g, '_')}
                          {player.sectRank === SectRank.Leader && (
                            <span className="text-[8px] px-1 bg-yellow-900/20 text-yellow-500 border border-yellow-900/50 rounded-none">
                              OVERSEER_PERK: 50% OFF
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-stone-600 mt-1 uppercase tracking-tighter max-w-md">
                          {item.item.description}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 relative z-10">
                        <div className="text-right">
                          <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">
                            {baseCost} COMMENDS
                          </div>
                          {quantity > 1 && (
                            <div className="text-[8px] text-stone-600 uppercase tracking-widest">
                              TOTAL: {totalCost}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center border border-stone-800 bg-stone-950">
                            <button
                              onClick={() =>
                                setBuyQuantities((prev) => ({
                                  ...prev,
                                  [idx]: Math.max(1, (prev[idx] || 1) - 1),
                                }))
                              }
                              className="px-2 py-1 text-stone-600 hover:text-emerald-500 transition-colors"
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
                              className="w-10 text-center bg-transparent text-emerald-500 border-0 focus:outline-none text-[10px] font-bold"
                            />
                            <button
                              onClick={() =>
                                setBuyQuantities((prev) => ({
                                  ...prev,
                                  [idx]: (prev[idx] || 1) + 1,
                                }))
                              }
                              className="px-2 py-1 text-stone-600 hover:text-emerald-500 transition-colors"
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
                              px-3 py-1.5 rounded-none text-[10px] border font-bold uppercase tracking-widest transition-colors
                              ${canBuy
                                ? 'bg-emerald-900/20 hover:bg-emerald-900/40 text-emerald-500 border-emerald-800/50'
                                : 'bg-stone-900 text-stone-700 border-stone-800 cursor-not-allowed'
                              }
                            `}
                          >
                            [ EXCHANGE ]
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
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
