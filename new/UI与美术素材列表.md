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

