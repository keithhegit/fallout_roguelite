- 品牌与安装体验
  - App Icon：`pwa-192x192.png`、`pwa-512x512.png`（方形、安全边距 ≥ 10%）
    pwa-192x192.png：
  
  https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/pwa-192x192.png
  
  pwa-512x512.png：
  
   https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/pwa-512x512.png
  
  - Favicon：`favicon.svg`（浅色）、`favicon-white.svg`（深色）
  
  - Logo：`logo.png`（透明背景，建议横版/竖版各 1）
  
    Logo：https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/main_logo.png
  
  - 启动背景（Welcome）：竖屏 1 张（推荐设计 1080×1920，兼容导出一档 720×1280）
  
    background: https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/init_background01.jpg
  
- 全局 UI 材质层（统一“屏幕质感”）
  - 扫描线 / 噪点 / 暗角：优先 CSS 实现；如用贴图，提供 1 张可平铺小纹理（推荐 256×256 或 512×512）
  
    优先 CSS 实现，暂时不补图
  
  - 通用面板背景：卡片/弹窗背景用同一套材质（推荐 1024×1024，可平铺/拉伸，避免每个界面“各画各的”）
  
    panel_frame: https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/panel_frame01.png
  
- 导航与通用图标（先覆盖 80% 操作）
  - 底部 Tab 图标：5 枚（Status / Inv / Radio / Data / Map），矢量优先；如出位图，设计画布 128×128，实际显示约 28~32px
  
  Data:
  
  https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/bottom_tab_data.png
  
  Status 
  
  https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/bottom_tab_status.png
  
  Inv
  
  https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/bottom_tab_inv.png
  
  Radio 
  
  https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/bottom_tab_radio.png
  
  Map
  
  https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/bottom_tab_map.png
  
  - 顶部栏图标：3~5 枚（Menu / Back / Close / Settings / Help），设计画布 96×96，实际显示约 24px
  
  Back :
  
  https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/top_tab_back.png
  
  Menu /
  
  https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/top_tab_menu.png
  
  Close / 
  
  https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/top_tab_close.png
  
  Settings / 
  
  https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/top_tab_settings.png
  
  Help/
  
  https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/top_tab_help.png
  
  
  
  - 通用功能图标：12~20 枚（背包、装备、任务、派系、商店、制作、抽奖、伙伴、成就、保存、警告），设计画布 128×128，实际显示约 32~40px
  
  成就：
  
  https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/common_icon_achievements.png
  
  背包：
  
  https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/common_icon_backpack.png
  
  装备：
  
  https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/common_icon_equipment.png
  
  任务：
  
  https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/common_icon_quests.png
  
  派系：
  
  https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/common_icon_factions.png
  
  商店：
  
  https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/common_icon_shop.png
  
  制作：
  
  https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/common_icon_crafting.png
  
  伙伴：
  
  https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/common_icon_companions.png
  
  抽奖：
  
  https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/common_icon_gacha.png
  
  保存：
  
  https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/common_icon_save.png
  
  警告：
  
  https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/common_icon_warning.png
  
  
  
  
  
  - 状态图标：6~10 枚（HP、EXP、Attack、Defense、Speed、Luck、辐射/中毒/流血等），设计画布 96×96，实际显示约 24~28px
  
    
  
    HP：
  
    https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/status_icon_attack.png
  
    
  
    EXP：
  
    https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/common_icon_hp.png
  
    
  
    Attack：
  
    https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/status_icon_attack.png
  
    
  
    Defense：
  
    https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/status_icon_defense.png
  
    
  
    Speed：
  
    https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/status_icon_speed.png
  
    
  
    Luck：
  
    https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/status_icon_luck.png
  
    
  
    辐射：
  
    https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/status_icon_radiation.png
  
    中毒：
  
    https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/status_icon_poisoning.png
  
    流血：
  
    https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/status_icon_bleeding.png


关键界面“头图/占位插画”（让弹窗不再像表单）

- Radio（主界面）背景：竖屏 1 张（推荐 1080×1920，可与 Welcome 同系列，但层级更弱，可适当压暗）

  cdn: https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/radio_background.jpg

- Factions（派系）头图占位：1 张（推荐宽 1080，高 360~480，例如 1080×400 的长横幅通用派系插画）

  cdn: https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/banner_factions_background.png

- Inventory（背包）头图占位：1 张（推荐宽 1080，高 280~360，例如 1080×320，视觉权重低于 Radio/Factions）

  cdn: https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/banner_inventory_background.png


## 1) Vault / 地点（Secret Realm / Zone）资源清单

**主要使用位置**

- Zone 列表卡片： [SecretRealmModal.tsx](file:///D:/Code/fallout_roguelike/components/SecretRealmModal.tsx)
- Zone 数据来源： [secretRealms.ts](file:///D:/Code/fallout_roguelike/constants/secretRealms.ts)

**每个地点需要 2 张图**

1. **地点缩略图（用于列表卡片）**

- 尺寸：512×512（推荐输出），同时可再导出 256×256
- 宽高比：1:1
- 用途：Zone 卡片左侧/顶部图位（未来接入时），也可用于日志里“进入区域”提示图

1. **地点横幅（用于进入/详情头图）**

- 尺寸：1080×360（或 960×320）
- 宽高比：3:1
- 用途：进入 Zone 时的标题区、结算弹窗头图、地图页头部

**需要做的地点列表（全量：13 个）**

- realm-vault-111 Vault 111 Surroundings

  横幅：https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/banner_zone_big_mt.png
  缩略图：https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/thumbnail_zone_vault111.png

- realm-sanctuary Sanctuary Hills

  横幅：https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/banner_zone_sanctuary_hills.png
  缩略图：https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/thumbnail_zone_sanctuary_hills.png

- realm-concord Concord Ruins

  横幅：https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/banner_zone_concord_ruins.png
  缩略图：https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/thumbnail_zone_concord_ruins.png

- realm-diamond-city Diamond City Outskirts

  横幅：https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/banner_zone_diamond_city.png
  缩略图：https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/thumbnail_zone_diamond_city.png

- realm-super-duper-mart Super-Duper Mart

  横幅：https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/banner_zone_super_duper_mart.png
  缩略图：https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/thumbnail_zone_super_duper_mart.png

- realm-corvega Corvega Assembly Plant

  横幅：https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/banner_zone_corvega_assembly_plant.png
  缩略图：https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/thumbnail_zone_corvega_assembly_plant.png

- realm-west-tek West-Tek Research Facility

  横幅：https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/banner_zone_west_tek.png
  缩略图：https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/thumbnail_zone_west_tek.png

- realm-mass-fusion Mass Fusion Building

  横幅：https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/banner_zone_mass_fusion.png
  缩略图：https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/thumbnail_zone_mass_fusion.png

- realm-institute The Institute

  横幅：https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/banner_zone_the_institute.png
  缩略图：https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/thumbnail_zone_the_institute.png

- realm-glowing-sea The Glowing Sea

  横幅：https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/banner_zone_glowing_sea.png
  缩略图：https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/thumbnail_zone_glowing_sea.png

- realm-prydwen The Prydwen

  横幅：https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/banner_zone_the_prydwen.png
  缩略图：https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/thumbnail_zone_the_prydwen.png

- realm-enclave-rig Enclave Oil Rig

  横幅：https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/banner_zone_enclave_rig.png
  缩略图：https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/thumbnail_zone_enclave_rig.png

- realm-big-mt Big MT Research Center

  横幅：https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/banner_zone_big_mt.png
  缩略图：https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/thumbnail_zone_big_mt.png


## 2) 补充地点素材需求（Remaining Locations）

以下地点已在游戏字典中，但尚未分配美术素材。请补充 **缩略图 (512x512)** 和 **横幅 (1080x360)**。

**Low Risk**
- Abandoned Shack, Farm Ruins, Dry Riverbed, Scavenger Camp, Small Vault Access
- Old Gas Station, Collapsed Tunnel, Rust Yard, Makeshift Shelter, Highway Underpass
- Junk Heap, Radio Tower Base, Cracked Reservoir, Overgrown Park, Burnt Forest
- Empty Silo, Broken Bridge, Train Yard, Subway Station, Water Treatment Plant
- Drive-In Theater, Diner Ruins, Trailer Park, Roadside Motel, Ranger Cabin, Picnic Area

**Medium Risk**
- Metro Tunnel, Raider Outpost, Medical Facility, Relay Tower, Armory Cache
- Red Rocket Station, Vault 111 Entrance, Lexington Ruins
- Saugus Ironworks, Dunwich Borers, Hubris Comics, Trinity Tower, Boston Public Library
- General Atomics Galleria, RobCo Sales Center, Poseidon Energy, Hallucigen, Inc.
- Vault 81, Hardware Town, Beantown Brewery, Faneuil Hall, Combat Zone, Satellite Station

**High Risk**
- Irradiated Plant, Blacksite Lab, Toxic Marsh, Super Mutant Nest, Collapsed Reactor
- Glowing Sea Edge, Crater of Atom, Sentinel Site, Mass Pike Tunnel, Kendall Hospital
- Malden Middle School, Parsons State Insane Asylum, Spectacle Island, Fort Strong, The Castle
- Boston Airport, Libertalia, Quincy Ruins, Gunners Plaza
- Fort Hagen, Vault 95, Huntersville, The Burrows, Abandoned Bog

**Extreme Risk**
- Ground Zero, Quarantine Vault, FEV Lab Core, Dead Zone, Containment Breach Site
- Glowing Sea Crater, Institute Reactor, Mariposa Military Base, The Divide
- Sierra Madre Casino, Lonesome Road, Vault 87, Raven Rock
- Adams Air Force Base, Mobile Crawler, Liberty Prime Hangar, Zeta Mothership, The Master's Lair
- Glassed Cavern, Site Alpha, Whitespring Bunker, Watoga Underground, The Deep, Wendigo Cave