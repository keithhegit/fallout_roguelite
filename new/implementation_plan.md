# Wasteland Survivor: Game Transformation Plan

> Transform the React Xiuxian (Cultivation) Game into a post-apocalyptic themed vertical mobile H5 game for Western markets, deployed on Cloudflare Pages.

## Executive Summary

This plan transforms `cloud-spirit-cultivation` into **Wasteland Survivor** - a post-apocalyptic themed idle/roguelike text adventure game. The core game mechanics remain unchanged; only the theming, localization, and deployment infrastructure need modification.

---

## 1. Project Overview

### Source Analysis

| Category | Count | Key Files |
|----------|-------|-----------|
| **Constants (Game Data)** | 22 files | `realms.ts`, `talents.ts`, `sects.ts`, `items.ts`, `pets.ts`, `lottery.ts`, etc. |
| **Components** | 42+ files | Modals, panels, game views |
| **Views** | 47 files | Screen layouts, game sections |
| **Total Lines** | ~55K+ | App.tsx alone is 1,780 lines |

### Current Tech Stack

- **Frontend**: React 19.2.0 + TypeScript 5.8.2
- **Build Tool**: Vite 6.2.0
- **Styling**: TailwindCSS 4.x
- **AI Service**: GLM/SiliconFlow/OpenAI (configurable)
- **State**: React Hooks + localStorage persistence

---

## 2. Theme Mapping: Xiuxian → Wasteland

### Core Concept Translation

| Original (修仙) | Wasteland Equivalent | Notes |
|-----------------|---------------------|-------|
| 境界 (Realm) | Survival Tier | Evolution/mutation levels |
| 修为 (Cultivation) | Experience/XP | Same concept |
| 灵石 (Spirit Stones) | Scrap/Caps | In-game currency |
| 气血 (Qi/HP) | Health/HP | Same concept |
| 宗门 (Sect) | Faction/Outpost | Survivor settlements |
| 灵宠 (Spirit Pet) | Mutant Companion | Post-apocalyptic creatures |
| 丹药 (Pills) | Stims/Chems | Medical items |
| 法宝 (Artifact) | Relic/Tech | Pre-war technology |
| 功法 (Cultivation Art) | Skill/Perk | Character abilities |
| 炼丹 (Alchemy) | Crafting | Same concept |
| 历练 (Adventure) | Scavenge/Explore | Same concept |
| 打坐 (Meditation) | Rest/Train | Recovery mechanic |
| 突破 (Breakthrough) | Evolve/Mutate | Level up mechanic |
| 天劫 (Tribulation) | Radiation Storm | Boss event |

### Realm System Translation

| Chinese Realm | English Name | Wasteland Name | Description |
|---------------|--------------|----------------|-------------|
| 炼气期 | Qi Refining | Scavenger | Basic survivor |
| 筑基期 | Foundation | Wastelander | Established survivor |
| 金丹期 | Golden Core | Mutant | Radiation-enhanced |
| 元婴期 | Nascent Soul | Evolved | Significantly mutated |
| 化神期 | Spirit Severing | Apex | Near-superhuman |
| 合道期 | Dao Combining | Transcendent | Beyond human limits |
| 长生期 | Longevity | Immortal | Radiation god |

### Faction Translation (Sects → Outposts)

| Chinese Sect | Wasteland Faction | Description |
|--------------|-------------------|-------------|
| 云灵宗 | Haven Outpost | Peaceful survivor settlement |
| 烈阳宗 | Inferno Gang | Fire-wielding raiders |
| 万剑门 | Steel Brotherhood | Weapon specialists |
| 天音寺 | The Sanctuary | Healer community |
| 太虚观 | Tech Cult | Pre-war tech worshippers |
| 血魔宗 | Blood Raiders | Violent raider faction |
| 雷神殿 | Thunder Legion | Power generator controllers |
| 九幽门 | Shadow Syndicate | Stealth assassins |

---

## 3. Implementation Phases

### Phase 1: Internationalization (i18n) Infrastructure

> **Priority: HIGH** | **Estimated: 2-3 days**

#### 1.1 Create Localization System

- [x] Create `locales/` directory structure
- [x] Implement i18n context (`LocaleContext`)
- [x] Create translation JSON files (en) and wire basic usage

```
locales/
├── en/
│   ├── achievements.json
│   ├── common.json
│   ├── companions.json
│   ├── events.json
│   ├── factions.json
│   ├── items.json
│   ├── realms.json
│   └── talents.json
└── zh/ (planned mirror; not yet created)
```

#### 1.2 Key Files to Modify

| File | Changes |
|------|---------|
| [realms.ts](file:///d:/Code/fallout_roguelike/constants/realms.ts) | Add English names/descriptions |
| [talents.ts](file:///d:/Code/fallout_roguelike/constants/talents.ts) | Translate 20 talents, 18 titles, 25+ achievements |
| [sects.ts](file:///d:/Code/fallout_roguelike/constants/sects.ts) | Translate 18 factions |
| [items.ts](file:///d:/Code/fallout_roguelike/constants/items.ts) | Translate all items |
| [itemTemplates.ts](file:///d:/Code/fallout_roguelike/constants/itemTemplates.ts) | Translate 53KB of item data |
| [pets.ts](file:///d:/Code/fallout_roguelike/constants/pets.ts) | Translate pet data |
| [lottery.ts](file:///d:/Code/fallout_roguelike/constants/lottery.ts) | Translate lottery rewards |
| [cultivation.ts](file:///d:/Code/fallout_roguelike/constants/cultivation.ts) | Translate skill trees |

---

### Phase 2: Vertical Mobile H5 Optimization

> **Priority: HIGH** | **Estimated: 2-3 days**

#### 2.1 Layout Changes

- [x] Convert desktop-first layout to mobile-first
- [x] Implement single-column vertical layout
- [x] Add bottom navigation bar (like mobile games)
- [x] Optimize modal sizes for mobile screens
- [x] Implement touch-friendly button sizes (min 44px)

#### 2.2 Key CSS/Component Changes

| File | Changes |
|------|---------|
| [index.css](file:///d:/Code/fallout_roguelike/index.css) | Mobile-first breakpoints, vertical layout |
| [tailwind.config.js](file:///d:/Code/fallout_roguelike/tailwind.config.js) | Add mobile game design tokens |
| [GameView.tsx](file:///d:/Code/fallout_roguelike/components/GameView.tsx) | Vertical stack layout |
| [ActionBar.tsx](file:///d:/Code/fallout_roguelike/components/ActionBar.tsx) | Bottom fixed navigation |
| [GameHeader.tsx](file:///d:/Code/fallout_roguelike/components/GameHeader.tsx) | Compact mobile header |
| All modal components | Full-screen or slide-up sheets |

#### 2.3 Mobile UX Enhancements

- [ ] Safe area handling (notch, home indicator)
- [ ] Pull-to-refresh gestures
- [ ] Swipe navigation hints
- [ ] Haptic feedback integration (optional)

---

### Phase 3: Theme Replacement (Re-skinning)

> **Priority: MEDIUM** | **Estimated: 3-4 days**

#### 3.0 Current Status (as-is in repo)

- CRT/Pip-Boy screen material layer is available (scanlines/noise/vignette utilities exist) and is being applied incrementally across key screens/modals.
- Some core modals are already terminalized (e.g. AutoAdventureConfig, Battle result/log), but many legacy components still use `mystic-gold` and older border/spacing patterns.

#### 3.1 Visual Theme Changes

| Element | Xiuxian Style | Wasteland Style |
|---------|---------------|-----------------|
| Color Palette | Jade greens, golds, purples | Rust, amber, toxic green, steel gray |
| Typography | Noto Serif SC | Industrial fonts (Bebas, Orbitron, Roboto Condensed) |
| Iconography | Eastern mystical | Industrial, hazmat, skull icons |
| Backgrounds | Mountains, clouds, temples | Ruined cities, wastelands, bunkers |
| Currency Icon | 灵石 jade | Bottle caps / scrap metal |

#### 3.2 File Changes

| File | Changes |
|------|---------|
| [index.html](file:///d:/Code/fallout_roguelike/index.html) | Update title, fonts, favicon |
| [index.css](file:///d:/Code/fallout_roguelike/index.css) | New color variables, theme tokens |
| [tailwind.config.js](file:///d:/Code/fallout_roguelike/tailwind.config.js) | Wasteland color palette |
| `public/assets/` | Replace all visual assets |
| Component files | Update class names, icons |

#### 3.3 AI Event Generation

- [ ] Update AI prompts in [aiService.ts](file:///d:/Code/fallout_roguelike/services/aiService.ts) to generate wasteland-themed events
- [ ] Create fallback event templates with wasteland theme

---

### Phase 4: Cloudflare Pages Deployment

> **Priority: HIGH** | **Estimated: 1 day**

#### 4.1 Build Configuration

- [ ] Create `wrangler.toml` for Cloudflare
- [ ] Update [vite.config.ts](file:///d:/Code/fallout_roguelike/vite.config.ts) for static export
- [ ] Configure environment variables

#### 4.2 Deployment Setup

```toml
# wrangler.toml
name = "wasteland-survivor"
compatibility_date = "2024-01-01"

[site]
bucket = "./dist"
```

#### 4.3 CI/CD Pipeline

- [ ] Create GitHub Actions workflow for auto-deploy
- [ ] Configure Cloudflare Pages integration
- [ ] Set up custom domain (optional)

---

## 4. Detailed File Change List（Updated）

### 4.1 Constants & Game Data（已基本完成废土化）

| File | Lines | Changes |
|------|-------|---------|
| [realms.ts](file:///d:/Code/fallout_roguelike/constants/realms.ts) | 102 | Add English realm names |
| [talents.ts](file:///d:/Code/fallout_roguelike/constants/talents.ts) | 702 | Translate all talents, titles, achievements |
| [sects.ts](file:///d:/Code/fallout_roguelike/constants/sects.ts) | 416 | Translate faction names & descriptions |
| [items.ts](file:///d:/Code/fallout_roguelike/constants/items.ts) | 17KB | Translate item definitions |
| [itemTemplates.ts](file:///d:/Code/fallout_roguelike/constants/itemTemplates.ts) | 54KB | Translate equipment templates |
| [pets.ts](file:///d:/Code/fallout_roguelike/constants/pets.ts) | 32KB | Translate pet data |
| [lottery.ts](file:///d:/Code/fallout_roguelike/constants/lottery.ts) | 45KB | Translate lottery rewards |
| [cultivation.ts](file:///d:/Code/fallout_roguelike/constants/cultivation.ts) | 32KB | Translate cultivation arts |
| [advanced.ts](file:///d:/Code/fallout_roguelike/constants/advanced.ts) | 74KB | Translate advanced content |
| [battle.ts](file:///d:/Code/fallout_roguelike/constants/battle.ts) | 5KB | Translate battle messages |
| [dailyQuest.ts](file:///d:/Code/fallout_roguelike/constants/dailyQuest.ts) | 10KB | Translate quest descriptions |
| [grotto.ts](file:///d:/Code/fallout_roguelike/constants/grotto.ts) | 11KB | Translate grotto content |
| [heavenEarth.ts](file:///d:/Code/fallout_roguelike/constants/heavenEarth.ts) | 14KB | Translate special events |
| [tribulation.ts](file:///d:/Code/fallout_roguelike/constants/tribulation.ts) | 5KB | Translate tribulation events |
| [secretRealms.ts](file:///d:/Code/fallout_roguelike/constants/secretRealms.ts) | 5KB | Translate secret realm content |
| [shop.ts](file:///d:/Code/fallout_roguelike/constants/shop.ts) | 8KB | Translate shop items |
| [spiritualRoots.ts](file:///d:/Code/fallout_roguelike/constants/spiritualRoots.ts) | 3KB | Translate to mutation types |

> 当前代码中，核心常量和文案已基本完成英文化+废土主题重构（参考 `new/题材改版初稿.md` 及 `constants/` 目录）。后续以“查漏补缺”为主，而不是大规模翻译。

### 4.2 Component Files（UI / UX 优先级）

| Component | Changes / Status |
|-----------|------------------|
| [WelcomeScreen.tsx](file:///d:/Code/fallout_roguelike/components/WelcomeScreen.tsx) | 首屏体验，使用废土主题与新 Logo，已基础完成，后续配合新美术迭代 |
| [StartScreen.tsx](file:///d:/Code/fallout_roguelike/components/StartScreen.tsx) | 角色创建/开局，引导进入废土世界，已英文化，需强化品牌感与背景图 |
| [GameView.tsx](file:///d:/Code/fallout_roguelike/views/GameView.tsx) | 主游戏视图，负责布局、日志流与 Stats/MobileSidebar，目前为“上日志+下操作栏”结构，后续需要与底部 Tab 导航整合 |
| [GameHeader.tsx](file:///d:/Code/fallout_roguelike/views/GameHeader.tsx) | 顶部导航，含菜单与核心入口，需收敛为移动端紧凑版（保留语言切换、设置等） |
| [ActionBar.tsx](file:///d:/Code/fallout_roguelike/views/ActionBar.tsx) | 核心操作按钮区（Train/Scavenge/Explore/Craft/Faction），后续与底部 Tab 分工：Tab 负责“系统级入口”，ActionBar 负责“当前频道内操作” |
| [MobileSidebar.tsx](file:///d:/Code/fallout_roguelike/components/MobileSidebar.tsx) | 移动端抽屉，目前承担过多入口角色，计划收敛为“更多/设置”与部分次要入口 |
| [NotificationToast.tsx](file:///d:/Code/fallout_roguelike/views/NotificationToast.tsx) | 奖励提示与操作反馈，需统一颜色/阴影/动效，与美术规范对齐 |
| [StatsPanel.tsx](file:///d:/Code/fallout_roguelike/components/StatsPanel.tsx) | 属性面板，将作为底部 Tab 中 Status 的主内容，需要适配竖屏全屏/抽屉样式 |
| [InventoryModal.tsx](file:///d:/Code/fallout_roguelike/components/InventoryModal.tsx) | 已有 PIP-BOY 风格 Header/筛选区与部分物品卡壳；仍残留 `mystic-gold` 与细节风格漂移，需继续收敛 tokens 并完善“物品卡体系” |
| [EquipmentPanel.tsx](file:///d:/Code/fallout_roguelike/components/EquipmentPanel.tsx) | 已终端化：扫描线层、槽位网格、术语与按钮一致；后续接入“图标位/稀有度框”美术资源提升识别度 |
| [CharacterModal.tsx](file:///d:/Code/fallout_roguelike/components/CharacterModal.tsx) | 大部分区域已偏终端风（字体/术语/扫描线层）；仍存在局部粗边框与旧配色，需统一为同一套组件规范 |
| [AutoAdventureConfigModal.tsx](file:///d:/Code/fallout_roguelike/components/AutoAdventureConfigModal.tsx) | 已终端化：协议配置弹窗统一扫描线/术语/按钮与输入控件风格 |
| [BattleModal.tsx](file:///d:/Code/fallout_roguelike/components/BattleModal.tsx) | 已终端化：战斗结果/日志展示重排，信息区与交互按钮统一；后续与回合制界面做一致化 |
| [TurnBasedBattleModal.tsx](file:///d:/Code/fallout_roguelike/components/TurnBasedBattleModal.tsx) | 回合制交互仍保留较多旧风格（如 `mystic-gold`），需要按终端规范重构 |
| [SectModal.tsx](file:///d:/Code/fallout_roguelike/components/SectModal.tsx) | 派系系统 UI，后续配合派系徽章与装饰元素 |
| [PetModal.tsx](file:///d:/Code/fallout_roguelike/components/PetModal.tsx) | 伙伴系统 UI，展示伙伴插画/图标与技能 |
| [LotteryModal.tsx](file:///d:/Code/fallout_roguelike/components/LotteryModal.tsx) | 抽奖/补给箱 UI，后续结合掉落动画与奖励卡片 |
| [AlchemyModal.tsx](file:///d:/Code/fallout_roguelike/components/AlchemyModal.tsx) | 制作/炼制 UI，配合药剂/部件图标 |
| 所有 *Modal.tsx | 统一走“全屏或 Bottom Sheet + 固定 Header + 滚动内容”样式（参考 `views/README.md` 与 `new/H5移动端UI与美术升级计划.md`） |

---

## 5. Numerical Values Preservation

> [!IMPORTANT]
> The following numerical systems remain **UNCHANGED**:

- ✅ Realm stat requirements and progression
- ✅ Item stat bonuses and multipliers
- ✅ Pet/Companion base stats
- ✅ Combat formulas
- ✅ Experience curves
- ✅ Drop rates and RNG
- ✅ Economy values (costs, rewards)

Only display names and descriptions change, not underlying mechanics.

---

## 6. Verification & Deployment Plan（Updated）

### 6.1 Automated Tests

Currently no automated tests exist in the repository. Recommend adding:

- [ ] Unit tests for i18n hook
- [ ] Snapshot tests for key components

### 6.1.1 Current Quality Gates

- ESLint: currently failing (existing backlog of unused vars / prefer-const, etc.)
- TypeScript typecheck: currently failing (mixed localized string unions and legacy typing debt)

### 6.2 Manual Verification（功能 & 视觉）

1. **Language Check**: All UI shows English text
2. **Theme Check**: All visuals match wasteland aesthetic
3. **Mobile Check**: Game playable on 375px width (iPhone SE)
4. **Gameplay Check**: Complete one full game loop (create character → adventure → breakthrough)
5. **Deploy Check**: Site accessible on Cloudflare Pages URL（含 AI 事件正常工作）

### 6.3 Cloudflare Pages Deployment（当前方案）

本项目已采用 **Cloudflare Pages + Wrangler Action** 的标准部署流程，配置位于：  
- GitHub Actions Workflow: [deploy.yml](file:///d:/Code/fallout_roguelike/.github/workflows/deploy.yml)  
- 构建工具：Vite（`pnpm build`）  
- 静态资源输出目录：`dist/`

**部署流水线：**

1. 推送到 `main` 或 `master` 分支，触发 `Deploy to Cloudflare Pages` workflow
2. Workflow 步骤：
   - Checkout 代码
   - 安装 Node.js 20 与 pnpm 8
   - `pnpm install --frozen-lockfile`
   - `pnpm build`（带上 AI 相关环境变量）
   - 使用 `cloudflare/wrangler-action@v3` 执行：`pages deploy dist --project-name=wasteland-survivor`

**Cloudflare 侧环境变量建议：**

- Secrets（机密）
  - `VITE_AI_KEY`：AI 提供商的 API Key（在 Actions 中作为 `secrets.VITE_AI_KEY`，同时在 Cloudflare Pages 项目中也配置同名环境变量）
  - `CLOUDFLARE_API_TOKEN`：用于 wrangler action 部署权限
  - `CLOUDFLARE_ACCOUNT_ID`：Cloudflare 账户 ID

- Vars（非机密配置）
  - `VITE_AI_PROVIDER`：`glm` / `siliconflow` / `openai` 等，默认 `glm`
  - 如需自定义代理网关：`VITE_AI_API_URL`（会被 `vite.config.ts` 中的 `getProxyTarget` 解析）

**本地开发环境变量：**

在项目根目录创建 `.env.local`（不提交到 Git）：

```bash
VITE_AI_KEY=your-local-dev-key
# 可选
VITE_AI_PROVIDER=glm
# VITE_AI_API_URL=https://your-proxy-gateway.example.com/v1
```

### 6.4 Domain & Routing

- Cloudflare Pages 项目名：`wasteland-survivor`
- 默认访问域名：`https://wasteland-survivor.pages.dev`（具体以 Cloudflare 面板显示为准）
- SPA 路由：当前为单入口应用，Vite 默认入口为 `index.html`，Cloudflare Pages 对 Vite 有内置支持，如未来引入前端路由方案，可在 Pages 项目设置中开启 SPA 模式（All routes → `index.html`）

---

## 7. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI events still generate Chinese | Medium | Update AI prompts, add language parameter |
| localStorage save format changes | High | Implement save migration or reset |
| Missing translations | Medium | Default to English keys, track coverage |
| Performance on mobile | Medium | Lazy load modals, optimize re-renders |

---

## 8. Recommended Execution Order

1. **Setup**: Create localization infrastructure
2. **Core**: Translate constants files (realms, talents, items)
3. **UI**: Update components to use translations
4. **Theme**: Apply wasteland visual theme
5. **Mobile**: Implement vertical H5 layout
6. **Deploy**: Configure Cloudflare Pages
7. **Test**: Full game loop verification

---

## 9. Estimated Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| i18n Infrastructure | 2-3 days | None |
| Theme Translation | 3-4 days | i18n |
| Mobile H5 Layout | 2-3 days | None (parallel) |
| Visual Re-theming | 2-3 days | i18n |
| Cloudflare Deployment | 1 day | Build working |
| Testing & Polish | 2 days | All above |

**Total Estimate**: 10-14 days for complete transformation

---

## Appendix: Quick Start Commands

```bash
# Development
pnpm install
pnpm dev

# Production Build
pnpm build

# Deploy to Cloudflare Pages
npx wrangler pages deploy dist
```
