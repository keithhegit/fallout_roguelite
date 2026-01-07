# Wasteland Survivor：H5 移动端 UI + 美术升级计划（执行版）

本计划的目标是：在保持现有核心数值与系统逻辑不变的前提下，把当前“文字玩法为主”的 Demo，升级为“UI 体验统一、动效与美术完成度高、适配竖屏移动端、可 PWA 安装”的可上线版本。

## 0. 现状盘点（已具备的基础）

- 技术栈：React 19 + TypeScript + Vite + TailwindCSS 4（见 [README.md](file:///d:/Code/fallout_roguelike/README.md)）
- 已做的方向性改造（以代码现状为准）：
  - 竖屏/移动端基础：viewport 锁定、safe-area 处理（见 [index.html](file:///d:/Code/fallout_roguelike/index.html) / [index.css](file:///d:/Code/fallout_roguelike/index.css)）
  - 主题与动效：wasteland/pip 配色与动效 keyframes（见 [tailwind.config.js](file:///d:/Code/fallout_roguelike/tailwind.config.js) / [CRTOverlay.tsx](file:///d:/Code/fallout_roguelike/components/CRTOverlay.tsx)）
  - 本地化基础：自研 `LocaleContext` + `locales/` JSON（见 [LocaleContext.tsx](file:///d:/Code/fallout_roguelike/context/LocaleContext.tsx) / [locales](file:///d:/Code/fallout_roguelike/locales)）
  - PWA：已引入 `vite-plugin-pwa` 且 manifest 已配置（见 [vite.config.ts](file:///d:/Code/fallout_roguelike/vite.config.ts)）
- 现有规划文档（作为上位约束与背景材料）：
  - 题材与移动端规范（见 [题材改版初稿.md](file:///d:/Code/fallout_roguelike/new/%E9%A2%98%E6%9D%90%E6%94%B9%E7%89%88%E5%88%9D%E7%A8%BF.md)）
  - 工程化改造阶段（见 [implementation_plan.md](file:///d:/Code/fallout_roguelike/new/implementation_plan.md)）

## 1. 本次升级的交付标准（“看起来像手游”的最低线）

- **信息架构清晰**：3 秒内找到“状态/背包/探索/派系/设置”等核心入口
- **移动端可单手操作**：所有关键按钮可触达；点击热区 ≥ 44px；滑动/抽屉交互稳定
- **UI 统一**：颜色、字体、按钮、卡片、弹窗、列表的层级规范一致
- **美术可识别**：有统一的 Pip-Boy/废土 UI 语言；关键系统有专属图标/插画占位
- **性能可用**：中低端机（4GB RAM）首屏可用；滚动/动画不明显掉帧
- **上线友好**：PWA 可安装；离线至少能进入主界面并读取存档

## 2. 产品与 UI 结构（先定“壳”，再填“肉”）

### 2.1 竖屏信息架构（建议目标形态）

- **底部 Tab（4~5 个）**：Status / Inv / Radio / Data / Map
  - Radio：默认主界面（日志流 + 探索按钮 + 快捷操作）
  - Status：S.P.E.C.I.A.L. 面板 + 负面状态（辐射/流血/饥饿的“展示层”，数值仍沿用现有）
  - Inv：背包 + 装备 + 物品使用/批量操作
  - Data：派系/任务/成就/设定
  - Map：探索地点列表（即现有“历练/秘境/区域”入口的重包装）

### 2.2 交互模式（移动端优先）

- **主界面保持“单柱信息流”**：日志是核心体验，探索/挂机与掉落反馈都围绕日志展开
- **抽屉与底部弹层统一规范**：
  - 轻量面板：Bottom Sheet（80~90vh，带拖拽关闭）
  - 重交互：Full Screen Modal（带固定 Header + 可滚动内容区）
  - 二级确认：小弹窗（居中、少文字）
- **把“MobileSidebar”角色收敛**：从“功能集合”改为“更多/设置入口”，避免与底部 Tab 功能重叠（现状见 [MobileSidebar](file:///d:/Code/fallout_roguelike/components/MobileSidebar.tsx)）

### 2.3 关键页面的“美术承载点”

- Welcome / Start：需要完整的品牌感（Logo、短文案、动效、背景）
- Radio（主界面）：需要“屏幕材质感”（玻璃/扫描线/暗角/噪点）、更强的反馈（掉落浮字、击杀闪烁、危机警告）
- Inventory：需要“物品卡片体系”（稀有度框、图标、属性信息密度可控）
- Factions：需要“派系徽章体系”（每个派系一枚徽章 + 一套 UI 装饰）

### 2.4 现有系统清单（需要 UI + 美术美化）

按当前代码中的模块与弹窗划分，**玩家侧需要做 UI 与美术美化的系统/界面共 30 个**：

1. Welcome（欢迎/继续/新开局）
2. Start（角色创建/开局流程）
3. Tutorial（新手引导/系统介绍）
4. Main / Radio（主界面信息流：日志 + 快捷操作）
5. Header / Navigation（顶部栏与全局导航）
6. Action Bar（主操作区：训练/拾荒/探索/制作/派系等）
7. Status / Stats（属性面板：S.P.E.C.I.A.L.、状态、成长概览）
8. Meditation / Train（训练/冥想）
9. Adventure / Scavenge（历练/拾荒事件流）
10. Breakthrough / Evolve（突破/进化）
11. Battle（战斗触发与结果展示）
12. Turn-Based Battle（回合制战斗交互界面）
13. Combat FX Layer（战斗视觉效果层：伤害数字/闪烁/击杀反馈）
14. Inventory（背包：列表、筛选、批量操作）
15. Equipment（装备：槽位、对比、穿戴/卸下）
16. Craft / Alchemy（制作/炼制：配方、材料、结果反馈）
17. Upgrade / Artifact强化（强化：材料消耗、成功/失败反馈）
18. Shop（商店：购买/出售、数量选择、刷新）
19. Lottery（抽奖/补给箱：抽取动画、奖励展示）
20. Realm / Secret Realm（秘境/副本：入口、风险、战利品）
21. Factions（派系：加入/晋升/商店入口）
22. Faction Tasks（派系任务：列表、结算、连锁事件）
23. Daily Quests（每日任务：进度、领取、提示）
24. Base / Grotto（基地：种植/收获/升级/自动化）
25. Treasure Vault（宝库：挑选、已取记录、规则说明）
26. Reputation Events（声望/对话事件：选项、后果、奖励）
27. Companions / Pets（伙伴：编队/喂养/进化/技能展示）
28. Achievements（成就：分类、进度、奖励提示）
29. Settings（设置：语言、画质/动效、自动化、音量等）
30. Save Manager（存档管理：导入/导出/对比/恢复）

## 3. 视觉规范（Design Tokens 先行）

### 3.1 主题分层（建议拆成 3 套，可随设置切换）

- **Pip-Green（经典）**：单色荧光绿 + 黑底（更接近 Fallout）
- **Bunker-Dark（默认）**：深色背景 + 锈红/琥珀/毒绿点缀（现有 tailwind 方向）
- **Amber-Terminal（可选）**：琥珀屏（便于长时间阅读，减少“绿屏疲劳”）

### 3.2 UI 组件库（先补“原子组件”）

- Button（primary/secondary/ghost/danger）
- Card（信息卡/物品卡/任务卡）
- ListRow（带图标、主副文案、右侧数值/箭头）
- Tabs（底部 Tab 与面板内 Tab）
- Progress（经验条、突破条、耐久条）
- Badge（稀有度、状态、数量）
- Modal / Sheet（统一尺寸、动画、滚动、Header）

目标：把散落在各组件的 Tailwind class 收敛为“可复用的组合”，减少风格漂移。

## 4. 美术资源清单（MVP → 上线 → 精品化）

### 4.1 MVP（必须有，先替换“纯文本感”）

MVP 的目标是：让游戏“像一个完成度不错的手游 UI”，即便内容仍以文字为主，也要有清晰结构、统一风格与稳定触控体验。

- 品牌与安装体验
  - App Icon：`pwa-192x192.png`、`pwa-512x512.png`（方形、安全边距 ≥ 10%）
  - Favicon：`favicon.svg`（浅色）、`favicon-white.svg`（深色）
  - Logo：`logo.png`（透明背景，建议横版/竖版各 1）
  - 启动背景（Welcome）：竖屏 1 张（推荐设计 1080×1920，兼容导出一档 720×1280）
- 全局 UI 材质层（统一“屏幕质感”）
  - 扫描线 / 噪点 / 暗角：优先 CSS 实现；如用贴图，提供 1 张可平铺小纹理（推荐 256×256 或 512×512）
  - 通用面板背景：卡片/弹窗背景用同一套材质（推荐 1024×1024，可平铺/拉伸，避免每个界面“各画各的”）
- 导航与通用图标（先覆盖 80% 操作）
  - 底部 Tab 图标：5 枚（Status / Inv / Radio / Data / Map），矢量优先；如出位图，设计画布 128×128，实际显示约 28~32px
  - 顶部栏图标：3~5 枚（Menu / Back / Close / Settings / Help），设计画布 96×96，实际显示约 24px
  - 通用功能图标：12~20 枚（背包、装备、任务、派系、商店、制作、抽奖、伙伴、成就、保存、警告），设计画布 128×128，实际显示约 32~40px
  - 状态图标：6~10 枚（HP、EXP、Attack、Defense、Speed、Luck、辐射/中毒/流血等），设计画布 96×96，实际显示约 24~28px
- 物品“图标位”与稀有度体系（先做框架，后补全量物品）
  - 物品大类图标（MVP 版）：8~12 枚（Weapon/Armor/Chem/Material/Blueprint/Relic/Currency/Quest），设计画布 128×128，实际显示约 40~56px
  - 稀有度框/发光：4 套（Common/Rare/Legendary/Mythic），推荐单框画布 256×256（或导出 512×512 以便高分屏），支持 9-slice/拉伸，要求可在深色背景下清晰可辨
  - 数值标签样式：稀有度色 + 小标签（Badge）一套（用于物品卡、奖励弹窗、日志），推荐高度 24~32px（如需位图，设计画布 256×64，方便拉伸）
- 关键界面“头图/占位插画”（让弹窗不再像表单）
  - Radio（主界面）背景：竖屏 1 张（推荐 1080×1920，可与 Welcome 同系列，但层级更弱，可适当压暗）
  - Factions（派系）头图占位：1 张（推荐宽 1080，高 360~480，例如 1080×400 的长横幅通用派系插画）
  - Inventory（背包）头图占位：1 张（推荐宽 1080，高 280~360，例如 1080×320，视觉权重低于 Radio/Factions）
- 必须覆盖的系统优先级（MVP 必美化的界面）
  - Welcome / Start / Main(Radio) / Action Bar / Inventory / Factions / Settings / Lottery Rewards（奖励展示）

### 4.2 上线版（增强识别度）

上线版的目标是：玩家截图一眼知道“这是废土 Pip-Boy 风格游戏”，并且主要系统都有独立识别符号（图标/徽章/头图），减少重复与审美疲劳。

- 物品图标（从“图标位”升级为“可收藏”）
  - 总量建议：80~120 枚（先覆盖常用掉落与商店展示）
  - 分类建议（每类先做 10~20 枚，优先常见）
    - 武器：Pipe、Laser、Melee、Explosive
    - 护甲：衣装、头盔、护甲片、动力装甲部件（可先做通用部件）
    - 药品/化学品：Stimpak、RadAway、Buffout 等风格化系列
    - 材料：金属、电子、布料、化学、稀有核心（Glow/Meteor/Mutant Core 等）
    - 蓝图/磁带：Blueprint、Holotape、Dog Tag 等
    - 货币与票券：Caps、Lottery Ticket、芯片
- 派系徽章体系（让“派系”有脸）
  - 徽章：6~10 枚（矢量/扁平优先，保证小尺寸可读）
  - 派系 UI 装饰：每个派系一套“章纹/边框色/纹理点缀”
  - 派系任务卡：任务类型小图标 6~10 枚（护送/清剿/搜刮/侦察/交易/防守）
- 地点与副本缩略图（支持“Map/探索”视觉化）
  - 地点缩略图：12~20 张（Vault、Ruins、Subway、Factory、Bunker 等）
  - 风险等级视觉：危险条/辐射标识/推荐等级标签（同一套组件）
- 遭遇与怪物小图（让日志“可扫描”）
  - 遭遇小图：20~40 枚（Raiders/Ghouls/Mutants/Animals/Robots）
  - 用法：日志行左侧 24~32px 图标；战斗结算头图；事件弹窗头图
- UI 纹理与动态反馈（从“有质感”到“有反馈”）
  - 屏幕材质升级：更细的噪点/磨损边缘（控制体积，避免大 PNG）
  - 掉落反馈：稀有度闪烁、拾取弹出条、关键掉落可截图展示
  - 升级/突破反馈：进度条 + 结果动效（成功/失败两套）
- 上线版必须覆盖的系统优先级（比 MVP 更完整）
  - Inventory + Equipment + Shop + Craft + Factions + Daily Quests + Achievements + Realm/Secret Realm + Battle/Turn-Based Battle

### 4.3 精品化（可选，做“质感差异”）

- 角色/Pip-Boy 状态小人（分状态：健康/受伤/辐射/中毒）
- 章节式背景（废土地点插画系列）
- 简短音效：点击、掉落、升级、警告、抽奖（WebAudio 或静态音频）

### 4.4 资源规格建议（降低包体与加载风险）

- 图标：优先 SVG（统一描边粗细与圆角风格）
- 背景：WebP（优先）/PNG（兜底），竖屏 1080×1920 与 720×1280 两档
- 纹理：优先 CSS 生成；必须用图时控制为小尺寸可平铺（≤ 64KB）
- 托管：大图与音频建议走 CDN/R2（当前 PWA icon 已使用外链，见 [vite.config.ts](file:///d:/Code/fallout_roguelike/vite.config.ts)）

## 5. 工程实施路线图（从“能玩”到“好玩好看”）

### 里程碑 A（1 周）：统一移动端骨架与组件规范 [已完成]

- [x] 收敛主入口：底部 Tab + 主界面信息流
- [x] 统一 Modal/Sheet：固定 Header + 滚动区 + 关闭手势
- [x] 建立 UI primitives：Button/Card/ListRow/Badge/Progress
- [x] 产出验收：
  - [x] iPhone SE（375×667）可单手操作
  - [x] 核心路径：开始游戏 → 探索 → 获得掉落 → 打开背包使用 → 返回

### 里程碑 B（1~2 周）：美术替换与“质感层”上线 [进行中]

- [ ] Welcome/Start 全面换皮：背景、字体、按钮风格统一
- [x] Radio 主界面加入“屏幕材质层”：CRT、噪点、暗角、危险提示（已完成基础 CSS 实现）
- [x] AutoAdventureConfig（自动化配置）弹窗终端化：扫描线/噪点/统一按钮与术语
- [x] Battle（战斗结果/日志）弹窗终端化：日志呈现与状态信息区统一风格
- [ ] Turn-Based Battle（回合制交互）界面终端化：统一配色/按钮/信息密度
- [ ] Inventory/Equipment 完成物品卡体系：稀有度框、图标位、属性密度控制
- [ ] 产出验收：
  - 关键界面截图 10 张对比（改造前/后）
  - 视觉一致性检查：颜色/字号/间距/阴影/边框统一

### 里程碑 C（1 周）：内容展示升级（仍不改数值）

- 事件呈现：为“探索结果/战斗结果/突破结果”增加结构化 UI（标题、风险、奖励、按钮）
- 关键系统增强反馈：掉落浮字、升级动效、低血量/低寿命/高辐射提示
- 产出验收：
  - 日志不再是“纯文字堆叠”，而是信息可扫描（颜色、标签、图标、分组）

### 里程碑 D（1 周）：性能、PWA 与上线准备

- 资源加载策略：首屏关键资源预加载；非关键延迟加载；图像压缩与缓存
- PWA：离线可进主界面；更新策略不打断用户；安装体验完善（Icon/名称/主题色）
- 工程质量门禁：ESLint / TypeScript typecheck 清零（当前仍有存量问题，需在上线前收敛）
- 产出验收：
  - Lighthouse（移动端）性能/最佳实践可接受
  - 低端安卓机（实机）滚动与打开弹窗不卡顿

## 6. 建议的代码落点（方便你拆任务）

- 主题与基础 UI：
  - [tailwind.config.js](file:///d:/Code/fallout_roguelike/tailwind.config.js)
  - [index.css](file:///d:/Code/fallout_roguelike/index.css)
  - [CRTOverlay.tsx](file:///d:/Code/fallout_roguelike/components/CRTOverlay.tsx)
- 布局与导航：
  - [GameView.tsx](file:///d:/Code/fallout_roguelike/views/GameView.tsx)
  - [ActionBar.tsx](file:///d:/Code/fallout_roguelike/views/ActionBar.tsx)
  - [MobileSidebar.tsx](file:///d:/Code/fallout_roguelike/components/MobileSidebar.tsx)
- 首屏体验：
  - [WelcomeScreen.tsx](file:///d:/Code/fallout_roguelike/components/WelcomeScreen.tsx)
  - [StartScreen.tsx](file:///d:/Code/fallout_roguelike/components/StartScreen.tsx)
- 资源：
  - [public/assets/images](file:///d:/Code/fallout_roguelike/public/assets/images)
  - 资源盘点参考：[art_assets.md](file:///d:/Code/fallout_roguelike/new/art_assets.md)

## 7. 任务清单（可直接贴到项目管理工具）

- 设计系统：确定 3 套主题与组件规范
- 导航重构：底部 Tab 结构落地，主界面定型
- 弹层统一：Modal/Sheet 交互与滚动规范统一
- 美术一期：Logo/Icon/背景/稀有度框交付并接入
- 物品卡体系：Inventory/Equipment 信息密度与视觉统一
- 反馈层：掉落/升级/危险状态动效与提示
- 性能与缓存：图片压缩、懒加载、PWA 离线与更新策略

