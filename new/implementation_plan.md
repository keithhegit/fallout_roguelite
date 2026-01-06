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

- [ ] Create `locales/` directory structure
- [ ] Implement i18n hook or context
- [ ] Create translation JSON files (en/zh)

```
locales/
├── en/
│   ├── common.json      # UI strings
│   ├── realms.json      # Realm names & descriptions
│   ├── talents.json     # Talent names & descriptions
│   ├── items.json       # Item names & descriptions
│   ├── pets.json        # Pet names & descriptions
│   ├── sects.json       # Faction names & descriptions
│   └── events.json      # Event text
└── zh/
    └── ... (mirror structure)
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

- [ ] Convert desktop-first layout to mobile-first
- [ ] Implement single-column vertical layout
- [ ] Add bottom navigation bar (like mobile games)
- [ ] Optimize modal sizes for mobile screens
- [ ] Implement touch-friendly button sizes (min 44px)

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

## 4. Detailed File Change List

### Constants Files (22 files)

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

### Component Files (Priority)

| Component | Changes |
|-----------|---------|
| [StartScreen.tsx](file:///d:/Code/fallout_roguelike/components/StartScreen.tsx) | New wasteland intro, English text |
| [WelcomeScreen.tsx](file:///d:/Code/fallout_roguelike/components/WelcomeScreen.tsx) | Wasteland theme, English |
| [CharacterModal.tsx](file:///d:/Code/fallout_roguelike/components/CharacterModal.tsx) | Use translated strings |
| [InventoryModal.tsx](file:///d:/Code/fallout_roguelike/components/InventoryModal.tsx) | Use translated strings |
| [SectModal.tsx](file:///d:/Code/fallout_roguelike/components/SectModal.tsx) | Rename to FactionModal |
| [PetModal.tsx](file:///d:/Code/fallout_roguelike/components/PetModal.tsx) | Rename to CompanionModal |
| [LotteryModal.tsx](file:///d:/Code/fallout_roguelike/components/LotteryModal.tsx) | Rename to SalvageModal |
| [AlchemyModal.tsx](file:///d:/Code/fallout_roguelike/components/AlchemyModal.tsx) | Rename to CraftingModal |

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

## 6. Verification Plan

### Automated Tests

Currently no automated tests exist in the repository. Recommend adding:

- [ ] Unit tests for i18n hook
- [ ] Snapshot tests for key components

### Manual Verification

1. **Language Check**: All UI shows English text
2. **Theme Check**: All visuals match wasteland aesthetic
3. **Mobile Check**: Game playable on 375px width (iPhone SE)
4. **Gameplay Check**: Complete one full game loop (create character → adventure → breakthrough)
5. **Deploy Check**: Site accessible on Cloudflare Pages URL

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
