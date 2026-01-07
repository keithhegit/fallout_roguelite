import React, { useState, useMemo, useRef,  } from 'react';
import { CultivationArt, RealmType, PlayerStats, ArtGrade } from '../types';
import { ASSETS } from '../constants/assets';
import { CULTIVATION_ARTS, REALM_ORDER } from '../constants/index';
import { X, BookOpen, Check, Lock, Search } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  onLearnArt: (art: CultivationArt) => void;
  onActivateArt: (art: CultivationArt) => void;
}

const CultivationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  player,
  onLearnArt,
  onActivateArt,
}) => {
  const [gradeFilter, setGradeFilter] = useState<ArtGrade | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'mental' | 'body'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'learned' | 'obtained' | 'unobtained'>('all');
  const [learningArtId, setLearningArtId] = useState<string | null>(null); // 防止重复点击
  const learningArtIdRef = useRef<string | null>(null); // 同步检查用
  const [searchQuery, setSearchQuery] = useState(''); // 搜索关键词
  const scrollContainerRef = useRef<HTMLDivElement>(null); // 滚动容器引用

  const getRealmIndex = (r: RealmType) => REALM_ORDER.indexOf(r);

  // 处理学习功法的点击，确保传递正确的 art 对象
  const handleLearnClick = (art: CultivationArt, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 防止重复点击（双重检查）
    if (learningArtIdRef.current === art.id || learningArtId === art.id) {
      return;
    }

    // 检查是否已经学习过
    if (player.cultivationArts.includes(art.id)) {
      return;
    }

    // 保存当前滚动位置
    const scrollContainer = scrollContainerRef.current;
    const scrollTop = scrollContainer?.scrollTop || 0;

    learningArtIdRef.current = art.id;
    setLearningArtId(art.id);
    onLearnArt(art);

    // 恢复滚动位置（使用 requestAnimationFrame 确保在 DOM 更新后恢复）
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollTop;
        }
      });
    });

    // 1000ms 后重置，允许再次点击（给状态更新足够的时间）
    setTimeout(() => {
      learningArtIdRef.current = null;
      setLearningArtId(null);
    }, 1000);
  };

  // 传承技能系统尚未实现，暂时返回空数组
  const inheritanceArts = useMemo(() => {
    return [];
  }, []);

  // 合并普通功法和传承功法
  const allArts = useMemo(() => {
    return [...CULTIVATION_ARTS, ...inheritanceArts];
  }, [inheritanceArts]);

  // 使用 useMemo 直接计算并排序功法列表（包含未解锁的功法，用于"未获得"筛选）
  const sortedArts = useMemo(() => {
    if (!isOpen) return [];

    const learnedSet = new Set(player.cultivationArts || []);
    const unlockedSet = new Set(player.unlockedArts || []);
    // 传承技能自动解锁和学习
    inheritanceArts.forEach(art => {
      learnedSet.add(art.id);
      unlockedSet.add(art.id);
    });

    const gradeOrder = { 天: 4, 地: 3, 玄: 2, 黄: 1 };

    // 排序权重：已激活 < 已学习 < 已解锁未学 < 未解锁
    const statusWeight = (artId: string) => {
      if (player.activeArtId === artId) return 0;
      if (learnedSet.has(artId)) return 1;
      if (unlockedSet.has(artId)) return 2;
      return 3;
    };

    return allArts.map((art, idx) => ({ art, idx }))
      .sort((a, b) => {
        const wa = statusWeight(a.art.id);
        const wb = statusWeight(b.art.id);
        if (wa !== wb) return wa - wb;

        // 同状态下，如果都是已学习，按品级排序；否则保持原顺序
        if (wa <= 1) {
          const ga = gradeOrder[a.art.grade] || 0;
          const gb = gradeOrder[b.art.grade] || 0;
          if (ga !== gb) return gb - ga; // 高品级在前
        }

        return a.idx - b.idx; // 保持原有次序
      })
      .map((item) => item.art);
  }, [isOpen, player.unlockedArts, player.cultivationArts, player.activeArtId, allArts, inheritanceArts]);

  // 过滤功法 - 基于已排序的列表进行过滤
  const filteredArts = useMemo(() => {
    const learnedSet = new Set(player.cultivationArts);
    const unlockedSet = new Set(player.unlockedArts || []);
    // 传承技能自动解锁和学习
    inheritanceArts.forEach(art => {
      learnedSet.add(art.id);
      unlockedSet.add(art.id);
    });

    return sortedArts.filter((art) => {
      // 兼容性处理：如果功法没有 grade 字段，默认显示
      const artGrade = art.grade || '黄';
      if (gradeFilter !== 'all' && artGrade !== gradeFilter) return false;
      if (typeFilter !== 'all' && art.type !== typeFilter) return false;

      // 状态筛选：已学习、已获得（已解锁但未学习）、未获得（未解锁）
      if (statusFilter !== 'all') {
        const isLearned = learnedSet.has(art.id);
        const isUnlocked = unlockedSet.has(art.id);
        if (statusFilter === 'learned' && !isLearned) return false; // 已学习：已学习的功法
        if (statusFilter === 'obtained' && (!isUnlocked || isLearned)) return false; // 已获得：已解锁但未学习的功法
        if (statusFilter === 'unobtained' && (isUnlocked || isLearned)) return false; // 未获得：未解锁的功法（已学习也应排除）
      }

      // 搜索过滤（按名称和描述）
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = art.name.toLowerCase().includes(query);
        const descMatch = art.description?.toLowerCase().includes(query);
        if (!nameMatch && !descMatch) return false;
      }

      return true;
    });
  }, [gradeFilter, typeFilter, statusFilter, sortedArts, player.cultivationArts, player.unlockedArts, searchQuery]);

  // 必须在所有 hooks 之后才能有条件返回
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-end md:items-center justify-center z-50 p-0 md:p-4 backdrop-blur-sm touch-manipulation font-mono"
      onClick={onClose}
    >
      <div
        className="bg-ink-950 w-full h-[80vh] md:h-auto md:max-w-3xl rounded-none border-0 md:border border-stone-800 shadow-2xl flex flex-col md:max-h-[85vh] overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
        {/* CRT 效果层 */}
        <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none z-50"></div>
        <div className="crt-noise"></div>
        <div className="crt-vignette"></div>

        <div className="p-3 md:p-4 border-b border-stone-800 flex justify-between items-center bg-stone-950 rounded-none relative z-10">
          <h3 className="text-lg md:text-xl font-mono text-mystic-gold flex items-center gap-2 uppercase tracking-widest">
            <BookOpen size={18} className="md:w-5 md:h-5" /> Library of Evolution
          </h3>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div ref={scrollContainerRef} className="modal-scroll-container modal-scroll-content p-3 md:p-4 bg-ink-950 relative z-10">
          <div className="mb-3 md:mb-4 text-[10px] md:text-xs text-stone-500 bg-stone-900/30 p-3 rounded-none border border-stone-800 uppercase tracking-tighter">
            <p>• MENTAL ART: Primary protocols. Increases evolution efficiency when active.</p>
            <p>• BODY ART: Secondary protocols. Permanently enhances physical attributes.</p>
          </div>

          {/* 搜索框 */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-600" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search protocols by name or description..."
                className="w-full pl-10 pr-10 py-2 bg-ink-950 border border-stone-800 rounded-none text-stone-300 placeholder-stone-700 focus:outline-none focus:border-stone-600 transition-colors font-mono text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stone-600 hover:text-stone-400"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* 筛选器 */}
          <div className="mb-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <span className="text-[10px] text-stone-600 self-center uppercase tracking-widest min-w-[60px]">Tier:</span>
              {(['all', '天', '地', '玄', '黄'] as const).map((grade) => (
                <button
                  key={grade}
                  onClick={() => setGradeFilter(grade === 'all' ? 'all' : grade)}
                  className={`px-3 py-1 rounded-none text-[10px] transition-all uppercase tracking-tighter border font-mono ${
                    gradeFilter === grade
                      ? grade === '天'
                        ? 'bg-yellow-950/40 border-yellow-700/50 text-yellow-500'
                        : grade === '地'
                        ? 'bg-purple-950/40 border-purple-700/50 text-purple-500'
                        : grade === '玄'
                        ? 'bg-blue-950/40 border-blue-700/50 text-blue-500'
                        : grade === '黄'
                        ? 'bg-stone-900/40 border-stone-700/50 text-stone-400'
                        : 'bg-mystic-gold/20 text-mystic-gold border-mystic-gold'
                      : 'bg-ink-950 text-stone-500 border-stone-800 hover:border-stone-600 hover:text-stone-400'
                  }`}
                >
                  {grade === 'all' ? 'ALL' : `${grade} GRADE`}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-[10px] text-stone-600 self-center uppercase tracking-widest min-w-[60px]">Type:</span>
              {(['all', 'mental', 'body'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3 py-1 rounded-none text-[10px] transition-all uppercase tracking-tighter border font-mono ${
                    typeFilter === type
                      ? type === 'mental'
                        ? 'bg-blue-950/40 border-blue-700/50 text-blue-500'
                        : type === 'body'
                        ? 'bg-red-950/40 border-red-700/50 text-red-500'
                        : 'bg-mystic-gold/20 text-mystic-gold border-mystic-gold'
                      : 'bg-ink-950 text-stone-500 border-stone-800 hover:border-stone-600 hover:text-stone-400'
                  }`}
                >
                  {type === 'all' ? 'ALL' : type === 'mental' ? 'MENTAL' : 'BODY'}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-[10px] text-stone-600 self-center uppercase tracking-widest min-w-[60px]">Status:</span>
              {(['all', 'learned', 'obtained', 'unobtained'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 rounded-none text-[10px] transition-all uppercase tracking-tighter border font-mono ${
                    statusFilter === status
                      ? status === 'learned'
                        ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-500'
                        : status === 'obtained'
                        ? 'bg-yellow-950/40 border-yellow-700/50 text-yellow-500'
                        : status === 'unobtained'
                        ? 'bg-stone-900/40 border-stone-700/50 text-stone-500'
                        : 'bg-mystic-gold/20 text-mystic-gold border-mystic-gold'
                      : 'bg-ink-950 text-stone-500 border-stone-800 hover:border-stone-600 hover:text-stone-400'
                  }`}
                >
                  {status === 'all' ? 'ALL' : status === 'learned' ? 'INSTALLED' : status === 'obtained' ? 'OBTAINED' : 'UNKNOWN'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:gap-4">
            {filteredArts.length === 0 ? (
              <div className="text-center text-stone-600 py-12 font-mono text-xs uppercase tracking-widest border border-dashed border-stone-800/20">
                No matching protocols found
              </div>
            ) : (
              filteredArts.map((art) => {
                if (!art) return null; // 安全处理
                // 传承技能自动视为已学习和已解锁
                const isInheritanceArt = inheritanceArts.some(ia => ia.id === art.id);
                const isLearned = player.cultivationArts.includes(art.id) || isInheritanceArt;
                const isActive = player.activeArtId === art.id;
                const unlockedArts = player.unlockedArts || [];
                const isUnlocked = unlockedArts.includes(art.id) || isInheritanceArt;
                const canLearn =
                  !isLearned &&
                  isUnlocked && // 必须已解锁
                  player.spiritStones >= art.cost &&
                  getRealmIndex(player.realm) >=
                    getRealmIndex(art.realmRequirement);
                const locked = !isLearned && !canLearn;

              return (
                <div
                  key={art.id}
                  className={`
                    relative p-4 rounded-none border transition-all flex flex-col sm:flex-row justify-between gap-4 group overflow-hidden
                    ${isActive ? 'bg-ink-950 border-mystic-gold/30 shadow-lg' : 'bg-stone-900/30 border-stone-800 hover:border-stone-700'}
                    ${locked ? 'opacity-60 grayscale' : ''}
                  `}
                >
                  <div className="absolute inset-0 opacity-[0.01] pointer-events-none" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
                  <div className="relative z-10 flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h4
                        className={`text-base md:text-lg font-mono uppercase tracking-widest ${isActive ? 'text-mystic-gold' : 'text-stone-200'}`}
                      >
                        {art.name}
                      </h4>
                      <span
                        className={`text-[9px] md:text-[10px] px-1.5 py-0.5 rounded-none border font-bold uppercase tracking-tighter ${
                          (art.grade || '黄') === '天'
                            ? 'border-yellow-700/50 text-yellow-500 bg-yellow-900/10'
                            : (art.grade || '黄') === '地'
                            ? 'border-purple-700/50 text-purple-500 bg-purple-900/10'
                            : (art.grade || '黄') === '玄'
                            ? 'border-blue-700/50 text-blue-500 bg-blue-900/10'
                            : 'border-stone-700/50 text-stone-500 bg-stone-800/10'
                        }`}
                      >
                        {art.grade || '黄'} GRADE
                      </span>
                      <span
                        className={`text-[9px] md:text-[10px] px-1.5 py-0.5 rounded-none border uppercase tracking-tighter ${art.type === 'mental' ? 'border-blue-800/50 text-blue-500 bg-blue-900/10' : 'border-red-800/50 text-red-500 bg-red-900/10'}`}
                      >
                        {art.type === 'mental' ? 'MENTAL' : 'BODY'}
                      </span>
                      {isActive && (
                        <span className="text-[9px] md:text-[10px] text-mystic-gold flex items-center uppercase tracking-widest animate-pulse">
                          <Check size={10} className="md:w-3 md:h-3 mr-1" />{' '}
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-xs md:text-sm text-stone-500 mb-3 font-mono leading-relaxed group-hover:text-stone-400 transition-colors">
                      {art.description}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] md:text-[11px] text-stone-600 font-mono uppercase tracking-tighter">
                      <span>
                        RANK REQ:{' '}
                        <span
                          className={
                            getRealmIndex(player.realm) >=
                            getRealmIndex(art.realmRequirement)
                              ? 'text-stone-400'
                              : 'text-red-500'
                          }
                        >
                          {art.realmRequirement}
                        </span>
                      </span>
                      {!isLearned && (
                        <span>
                          CAPS COST:{' '}
                          <span
                            className={
                              player.spiritStones >= art.cost
                                ? 'text-stone-400'
                                : 'text-red-500'
                            }
                          >
                            {art.cost}
                          </span>
                        </span>
                      )}
                    </div>

                    <div className="mt-3 text-[10px] md:text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono uppercase tracking-tighter">
                      {art.effects.expRate && (
                        <span className="text-emerald-600">
                          +{(art.effects.expRate * 100).toFixed(0)}% EVOLUTION
                        </span>
                      )}
                      {(art.effects.attack || art.effects.attackPercent) && (
                        <span className="text-stone-400">
                          {art.effects.attack ? `+${art.effects.attack} ` : ''}
                          {art.effects.attackPercent ? `+${(art.effects.attackPercent * 100).toFixed(0)}% ` : ''}
                          FP
                        </span>
                      )}
                      {(art.effects.defense || art.effects.defensePercent) && (
                        <span className="text-stone-400">
                          {art.effects.defense ? `+${art.effects.defense} ` : ''}
                          {art.effects.defensePercent ? `+${(art.effects.defensePercent * 100).toFixed(0)}% ` : ''}
                          DR
                        </span>
                      )}
                      {(art.effects.hp || art.effects.hpPercent) && (
                        <span className="text-stone-400">
                          {art.effects.hp ? `+${art.effects.hp} ` : ''}
                          {art.effects.hpPercent ? `+${(art.effects.hpPercent * 100).toFixed(0)}% ` : ''}
                          HP
                        </span>
                      )}
                      {(art.effects.spirit || art.effects.spiritPercent) && (
                        <span className="text-stone-400">
                          {art.effects.spirit ? `+${art.effects.spirit} ` : ''}
                          {art.effects.spiritPercent ? `+${(art.effects.spiritPercent * 100).toFixed(0)}% ` : ''}
                          PER
                        </span>
                      )}
                      {(art.effects.physique || art.effects.physiquePercent) && (
                        <span className="text-stone-400">
                          {art.effects.physique ? `+${art.effects.physique} ` : ''}
                          {art.effects.physiquePercent ? `+${(art.effects.physiquePercent * 100).toFixed(0)}% ` : ''}
                          END
                        </span>
                      )}
                      {(art.effects.speed || art.effects.speedPercent) && (
                        <span className="text-stone-400">
                          {art.effects.speed ? `+${art.effects.speed} ` : ''}
                          {art.effects.speedPercent ? `+${(art.effects.speedPercent * 100).toFixed(0)}% ` : ''}
                          AGI
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end sm:w-32 shrink-0 mt-2 sm:mt-0 relative z-20">
                    {isLearned ? (
                      art.type === 'mental' ? (
                        isActive ? (
                          <button
                            disabled
                            className="px-4 py-2 bg-mystic-gold/10 border border-mystic-gold text-mystic-gold rounded-none text-xs md:text-sm font-mono uppercase tracking-widest cursor-default min-h-[44px] md:min-h-0 w-full"
                          >
                            ACTIVE
                          </button>
                        ) : (
                          <button
                            onClick={() => onActivateArt(art)}
                            className="px-4 py-2 bg-ink-950 hover:bg-stone-900 text-stone-300 rounded-none text-xs md:text-sm font-mono uppercase tracking-widest transition-all border border-stone-700 hover:border-mystic-gold min-h-[44px] md:min-h-0 w-full touch-manipulation"
                          >
                            INITIALIZE
                          </button>
                        )
                      ) : (
                        <span className="text-stone-600 text-xs md:text-sm font-mono italic uppercase tracking-widest">
                          INSTALLED
                        </span>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleLearnClick(art, e)}
                        disabled={locked || learningArtId === art.id}
                        className={`
                          px-4 py-2 rounded-none text-xs md:text-sm font-mono uppercase tracking-widest transition-all flex items-center justify-center gap-2 min-h-[44px] md:min-h-0 w-full touch-manipulation
                          ${
                            locked || learningArtId === art.id
                              ? 'bg-ink-950 text-stone-700 cursor-not-allowed border border-stone-900'
                              : 'bg-emerald-900/20 text-emerald-500 border border-emerald-900 hover:border-emerald-500 hover:bg-emerald-900/40 active:bg-emerald-900/60'
                          }
                        `}
                        title={!isUnlocked ? 'Protocol locked. Exploration required.' : undefined}
                      >
                        {locked ? <Lock size={14} /> : <BookOpen size={14} />}
                        {!isUnlocked ? 'LOCKED' : art.cost === 0 ? 'FREE' : 'INSTALL'}
                      </button>
                    )}
                  </div>
                </div>
              );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(CultivationModal);
