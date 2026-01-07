import React, { useState, useEffect } from 'react';
import { X, Github, Check } from 'lucide-react';
import { ASSETS } from '../constants/assets';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface VersionChange {
  category: string;
  items: string[];
}

interface VersionInfo {
  version: string;
  date: string;
  changes: VersionChange[];
}

const ChangelogModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const currentVersion = import.meta.env.VITE_APP_VERSION || '-';

  useEffect(() => {
    if (isOpen) {
      loadChangelog();
    }
  }, [isOpen]);

  const loadChangelog = async () => {
    setLoading(true);
    try {
      // Try to load from public directory
      const response = await fetch('/CHANGELOG.md');
      if (!response.ok) {
        throw new Error('Failed to fetch changelog');
      }
      const content = await response.text();
      const parsed = parseChangelog(content);
      setVersions(parsed.slice(0, 5));
    } catch (error) {
      console.error('Failed to load changelog:', error);
      // If loading fails, use default version info
      setVersions([
        {
          version: currentVersion,
          date: new Date().toISOString().split('T')[0],
          changes: [
            {
              category: 'Version Update',
              items: [`Version updated to ${currentVersion}`],
            },
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const parseChangelog = (content: string): VersionInfo[] => {
    const versions: VersionInfo[] = [];
    const lines = content.split('\n');

    let currentVersion: VersionInfo | null = null;
    let currentCategory: VersionChange | null = null;
    let skipUntilNextVersion = false;

    for (let i = 0; i < lines.length; i++) {
      const originalLine = lines[i];
      const line = originalLine.trim();

      // Match version line: ## [0.2.4] - 2025-12-17
      const versionMatch = line.match(/^## \[([^\]]+)\]\s*-\s*(.+)$/);
      if (versionMatch) {
        // Save previous version
        if (currentVersion && currentCategory) {
          currentVersion.changes.push(currentCategory);
        }
        if (currentVersion) {
          versions.push(currentVersion);
        }

        // Start new version
        currentVersion = {
          version: versionMatch[1],
          date: versionMatch[2] || '',
          changes: [],
        };
        currentCategory = null;
        skipUntilNextVersion = false;
        continue;
      }

      // If skipped to planned features, stop parsing
      if (
        line.includes('[Planned Features]') ||
        line.includes('## Release Notes') ||
        line.includes('## Feedback') ||
        line.includes('## Legacy Versions')
      ) {
        skipUntilNextVersion = true;
        continue;
      }

      if (skipUntilNextVersion || !currentVersion) {
        continue;
      }

      // Match category title: ### 🎉 Feature
      const categoryMatch = line.match(/^###\s+(.+)$/);
      if (categoryMatch) {
        // Save previous category
        if (currentCategory) {
          currentVersion.changes.push(currentCategory);
        }

        // Start new category
        currentCategory = {
          category: categoryMatch[1].trim(),
          items: [],
        };
        continue;
      }

      // Match list item: - **Combat**: Add Stats
      // Check if list item (may have indentation)
      if (originalLine.match(/^\s*-\s+/)) {
        if (currentCategory) {
          // Remove "- " and leading spaces
          const item = originalLine.replace(/^\s*-\s+/, '').trim();
          // Add non-empty items only
          if (item) {
            currentCategory.items.push(item);
          }
        }
      }
    }

    // Save last version and category
    if (currentVersion) {
      if (currentCategory) {
        currentVersion.changes.push(currentCategory);
      }
      versions.push(currentVersion);
    }

    return versions;
  };

  const formatCategoryName = (category: string): string => {
    // Remove emojis, keep text only
    return category.replace(/^[🎉🐛🔧📚🎯🎨💥🔒]+\s*/, '').trim();
  };

  const getCategoryIcon = (category: string): string => {
    if (category.includes('Added') || category.includes('New')) return '🎉';
    if (category.includes('Bug') || category.includes('Fix')) return '🐛';
    if (category.includes('Optimization') || category.includes('Improved')) return '🔧';
    if (category.includes('Code')) return '📚';
    if (category.includes('Stable')) return '🎯';
    if (category.includes('UI') || category.includes('Interface')) return '🎨';
    return '📝';
  };

  if (!isOpen) return null;

  const latestVersion = versions[0];
  const isLatest = latestVersion?.version === currentVersion;

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4 crt-screen"
      onClick={onClose}
    >
      <div
        className="bg-ink-950 w-full max-w-4xl rounded-none border border-stone-800 shadow-2xl relative overflow-hidden flex flex-col font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 背景纹理层 */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03] z-0"
          style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
        />
        
        {/* CRT Visual Layers */}
        <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none z-50"></div>
        <div className="crt-noise"></div>
        <div className="crt-vignette"></div>

        {/* 头部 */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-stone-800 bg-stone-950/50 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-stone-900 border border-stone-800 flex items-center justify-center text-emerald-500/80 shadow-inner relative group overflow-hidden">
              <div 
                className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
                style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
              />
              <Github size={24} className="relative z-10" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-200 tracking-[0.2em] uppercase">REVISION_CHRONICLES</h2>
              <p className="text-[10px] text-stone-600 tracking-widest uppercase">FIRMWARE_V{currentVersion} // STABLE_BUILD</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-stone-600 hover:text-red-500 hover:bg-red-950/10 transition-all border border-stone-800 hover:border-red-900/50 relative group overflow-hidden"
            aria-label="ABORT"
          >
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] transition-opacity"
              style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
            />
            <X size={24} className="relative z-10" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-8 relative z-10 max-h-[80vh]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-12 h-12 border-2 border-emerald-900 border-t-emerald-500 animate-spin"></div>
              <div className="text-emerald-500 font-bold uppercase tracking-[0.2em] text-xs animate-pulse">SYNCHRONIZING_DATA...</div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* 当前版本状态 */}
              {isLatest && latestVersion && (
                <div className="bg-emerald-900/10 border border-emerald-800/50 rounded-none p-4 flex items-center gap-4">
                  <div className="w-10 h-10 flex items-center justify-center bg-emerald-900/20 border border-emerald-800/50 text-emerald-500">
                    <Check size={24} />
                  </div>
                  <div>
                    <div className="text-emerald-500 font-bold uppercase tracking-widest text-sm">
                      > STATUS_OPTIMAL
                    </div>
                    <div className="text-[10px] text-emerald-600/80 uppercase tracking-widest font-bold">
                      Running latest firmware build v{currentVersion}
                    </div>
                  </div>
                </div>
              )}

              {/* 前往仓库按钮 */}
              <a
                href="https://github.com/JeasonLoop/react-xiuxian-game"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full bg-stone-900/40 hover:bg-stone-800 text-stone-300 border border-stone-800 rounded-none px-4 py-3.5 transition-all font-bold uppercase tracking-widest text-xs"
              >
                <Github size={18} className="text-emerald-500" />
                <span>[ VISIT_CENTRAL_REPOSITORY ]</span>
                <Check size={16} className="ml-auto text-emerald-500" />
              </a>

              {/* 变更日志 */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-stone-800 pb-2">
                  <div className="w-1.5 h-4 bg-emerald-500"></div>
                  <h3 className="text-sm font-bold text-stone-100 uppercase tracking-widest">
                    CHRONOLOGICAL_LOGS
                  </h3>
                </div>
                
                <div className="space-y-8">
                  {versions.map((version, idx) => (
                    <div
                      key={version.version}
                      className={`rounded-none overflow-hidden relative group/version ${idx === 0 && isLatest
                          ? 'border-l-4 border-emerald-500 bg-emerald-900/5'
                          : 'border-l-4 border-stone-800 bg-stone-900/40'
                        }`}
                    >
                      {/* 版本标题 */}
                      <div className="px-4 py-3 flex items-center justify-between border-b border-stone-800/30">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-mono font-bold text-emerald-500">
                            v{version.version}
                          </span>
                          {idx === 0 && isLatest && (
                            <span className="text-[10px] bg-emerald-900/30 text-emerald-500 border border-emerald-800/50 px-2 py-0.5 font-bold uppercase tracking-widest">
                              ACTIVE_BUILD
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-stone-600 font-bold uppercase tracking-widest">
                          {version.date}
                        </span>
                      </div>

                      {/* 版本内容 */}
                      <div className="p-5 space-y-6">
                        {version.changes.map((change, changeIdx) => (
                          <div key={changeIdx} className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-lg grayscale opacity-70">
                                {getCategoryIcon(change.category)}
                              </span>
                              <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em]">
                                > {formatCategoryName(change.category)}
                              </h4>
                            </div>
                            <ul className="space-y-2 ml-4">
                              {change.items.map((item, itemIdx) => (
                                <li
                                  key={itemIdx}
                                  className="text-xs text-stone-400 flex items-start gap-3 group/item"
                                >
                                  <span className="text-emerald-900 mt-1 font-bold flex-shrink-0 group-hover/item:text-emerald-500 transition-colors">>></span>
                                  <span
                                    className="flex-1 leading-relaxed tracking-wide"
                                    dangerouslySetInnerHTML={{
                                      __html: item
                                        .replace(/\*\*(.+?)\*\*/g, '<strong class="text-stone-200 font-bold">$1</strong>')
                                        .replace(/`(.+?)`/g, '<code class="bg-stone-950 border border-stone-800 px-1.5 py-0.5 rounded-none text-emerald-500 font-mono text-[10px]">$1</code>'),
                                    }}
                                  />
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangelogModal;

