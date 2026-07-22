const CONFIG = {
  // ----- 地圖設定 -----
  CELL_SIZE: 40,                    // 每個小格的像素大小
  SHOW_GRID: true,

  // 大地圖尺寸 (格數)
  MAP_COLS: 12,                     // 寬 12 格
  MAP_ROWS: 8,                     // 高 12 格

  // 塔位定義：5x3 個「大塔位」
  TOWER_SLOTS: {
    COLS: 5,                        // 寬 5 個大塔位
    ROWS: 3,                        // 高 3 個大塔位
    SUB_PER_SLOT: 4,                // 每個大塔位可以切成 4 個小塔位 (2x2)
    // 大塔位在整個地圖上的左上角偏移 (像素)
    OFFSET_X: 40,                  // 讓塔位置中在地圖中央
    OFFSET_Y: 40
  },

  // ----- 路徑設定 (環形) -----
  // 路徑由多個點構成，敵人會依序沿著這些點移動，形成一個封閉迴路
  PATH: [
    { x: 20, y: 20 },               // 左上角起點
    { x: 460, y: 20 },              // 右上角
    { x: 460, y: 300 },             // 右下角
    { x: 20, y: 300 },              // 左下角
    { x: 20, y: 20 }                // 回到起點，形成封閉迴路
  ],

  // ----- 敵人設定 -----
  // 敵人會無限循環行走，直到數量達到上限
  MAX_ENEMIES: 50,                  // 場上敵人大於等於此數量 → 遊戲結束

  ENEMY_TYPES: {
    normal: {
      name: '普通怪',
      hp: 100,
      speed: 1.2,
      size: 16,
      color: '#e74c3c',
      slowResistance: 0
    },
    fast: {
      name: '高速小怪',
      hp: 40,
      speed: 2.4,
      size: 12,
      color: '#f39c12',
      slowResistance: 0.5
    },
    heavy: {
      name: '重型怪',
      hp: 300,
      speed: 0.8,
      size: 24,
      color: '#8e44ad',
      slowResistance: 0.2
    },
        boss: {
      name: 'Boss',
      hp: 2000,               // 基礎血量（後續可由動態倍率增加）
      speed: 0.6,
      size: 30,               // 特別大
      color: '#c0392b',       // 深紅色
      slowResistance: 0.8     // 高抗性
    },
  },

  // ----- 波次 / 生成設定 -----
  // 敵人會隨時間持續生成
  SPAWN_INTERVAL: 120,              // 每 120 幀 (2秒) 生成一隻敵人
  WAVES: [
    // 第 1 波
    { spawns: [{ type: 'normal', count: 5 }] },
    // 第 2 波
    { spawns: [{ type: 'normal', count: 3 }, { type: 'fast', count: 3 }] },
    // 第 3 波
    { spawns: [{ type: 'fast', count: 8 }] },
    // 第 4 波
    { spawns: [
        { type: 'normal', count: 3 },
        { type: 'fast', count: 4 },
        { type: 'heavy', count: 2 }
    ]},
    // 第 5 波
    { spawns: [{ type: 'heavy', count: 5 }] }
  ],

    // ---------- 素材系統 ----------
  // 三種素材類別
  MATERIAL_CATEGORIES: {
    attack: { name: '攻擊', color: '#e74c3c', icon: '🔥' },    // 紅色
    disrupt: { name: '干擾', color: '#3498db', icon: '🌀' },   // 藍色
    support: { name: '輔助', color: '#f1c40f', icon: '💎' }    // 黃色
  },

  BASE_MATERIAL: {
    size: 36,                  // 小塔繪製大小
  },

  

    // 素材塔攻擊屬性（依類別與稀有度）
    MATERIAL_STATS: {
    attack: {
      basic:  { damage: 15, range: 100, fireRate: 20, splashRadius: 0 },
      standard:    { damage: 22, range: 100, fireRate: 20, splashRadius: 30, splashDamageRatio: 0.5 },
      perfect: { damage: 30, range: 110, fireRate: 18, splashRadius: 45, splashDamageRatio: 0.5 }
    },
    disrupt: {
      basic:  { damage: 4, range: 90, fireRate: 25, slowAmount: 0.5, slowDuration: 60, hasAura: false },
      standard:    { damage: 6, range: 90, fireRate: 25, slowAmount: 0.4, slowDuration: 60, hasAura: true,
                 auraSlowAmount: 0.8, auraCooldown: 120, auraDuration: 60, auraRadius: 90 },
      perfect: { damage: 8, range: 100, fireRate: 22, slowAmount: 0.3, slowDuration: 60, hasAura: true,
                   auraSlowAmount: 0.6, auraCooldown: 90, auraDuration: 60, auraRadius: 100 }
    },
    support: {
      basic:  { damage: 10, range: 110, fireRate: 45, goldPerWave: 15 },
      standard:    { damage: 14, range: 110, fireRate: 45, goldPerWave: 30 },
      perfect: { damage: 18, range: 120, fireRate: 40, goldPerWave: 50 }
    }
  },

  // 投射物顏色對照
  PROJECTILE_COLORS: {
    attack: '#ff4444',
    disrupt: '#4488ff',
    support: '#ffcc00'
  },

  // 配方表（先留簡單範例，階段三再細調）
  // 每個配方定義：大格子內需滿足的四小格組合，以及進化後的大塔屬性
   EVOLUTION_RECIPES: [
    {
      id: 'tower_flame_turret',
      name: '火焰砲塔',
      tier: 'common',
      description: '專注於範圍傷害，清兵神器。',
      slots: [
        { category: 'attack', quality: 'basic' },
        { category: 'attack', quality: 'basic' },
        { category: 'attack', quality: 'basic' },
        { category: 'attack', quality: 'basic' }
      ],
      result: {
        name: '火焰砲塔',
        damage: 80,
        range: 140,
        fireRate: 12,
        splashRadius: 60,
        splashDamageRatio: 0.5,
        color: '#c0392b',
        category: 'attack',
        projectileColor: '#ff4444',
        icon: '🔥',
        effects: ['splash']
      }
    },
    {
      id: 'tower_ice_fortress',
      name: '冰霜要塞',
      tier: 'common',
      description: '造成範圍緩速控制。',
      slots: [
        { category: 'disrupt', quality: 'basic' },
        { category: 'disrupt', quality: 'basic' },
        { category: 'disrupt', quality: 'basic' },
        { category: 'disrupt', quality: 'basic' }
      ],
      result: {
        name: '冰霜要塞',
        damage: 25,
        range: 120,
        fireRate: 20,
        slowAmount: 0.3,
        slowDuration: 120,
        color: '#2471a3',
        category: 'disrupt',
        projectileColor: '#85c1e9',
        icon: '🌀',
        effects: ['slow'] 
      }
    },
    {
      id: 'tower_gold_mine',
      name: '黃金礦場',
      tier: 'common',
      description: '回合結算時獲得金錢',
      slots: [
        { category: 'support', quality: 'basic' },
        { category: 'support', quality: 'basic' },
        { category: 'support', quality: 'basic' },
        { category: 'support', quality: 'basic' }
      ],
      result: {
        name: '黃金礦場',
        damage: 35,
        range: 130,
        fireRate: 30,
        goldPerWave: 100,
        color: '#d4ac0d',
        category: 'support',
        projectileColor: '#f9e79f',
        icon: '💎',
        effects: ['default']
      }
    },
        {
      id: 'tower_coin_hunter',
      name: '金幣獵手',
      tier: 'rare',
      description: '擊殺敵人時獲得額外金幣。',
      slots: [
        { category: 'attack', quality: 'standard' },
        { category: 'attack', quality: 'basic' },
        { category: 'attack', quality: 'basic' },
        { category: 'support', quality: 'basic' }
      ],
      result: {
        name: '金幣獵手',
        damage: 60,
        range: 120,
        fireRate: 25,
        bonusGold: 30,
        color: '#e67e22',
        category: 'attack',
        projectileColor: '#f39c12',
        icon: '💰',
        effects: ['bonus_gold']
      }
    },
        {
      id: 'tower_toxic_mist',
      name: '劇毒迷霧',
      tier: 'rare',
      description: '散發毒霧造成範圍傷害。',
      slots: [
        { category: 'disrupt', quality: 'standard' },
        { category: 'disrupt', quality: 'basic' },
        { category: 'attack', quality: 'basic' },
        { category: 'attack', quality: 'basic' }
      ],
      result: {
        name: '劇毒迷霧',
        damage: 0,             // 不攻擊，只靠光環
        range: 0,              // 不攻擊，無範圍
        fireRate: 999,         // 不攻擊
        hasAura: true,
        auraRadius: 90,
        auraCooldown: 50,      // 每 50 幀觸發一次
        auraDuration: 0,       // 不緩速
        auraSlowAmount: 0,     // 不緩速
        auraDamage: 80,         // 每次脈衝固定傷害
        auraDamagePercent: 0.02, // 每次脈衝 2% 最大血量
        auraColor: '#27ae60',  // 綠色波紋
        color: '#1e8449',
        category: 'disrupt',
        icon: '☠️',
        effects: ['default']   // 命中無效果（不攻擊）
      }
    },
        {
      id: 'tower_shock_cannon',
      name: '衝擊炮塔',
      tier: 'rare',
      description: '擊中時將敵人擊退。',
      slots: [
        { category: 'disrupt', quality: 'standard' },
        { category: 'disrupt', quality: 'basic' },
        { category: 'disrupt', quality: 'basic' },
        { category: 'attack', quality: 'basic' }
      ],
      result: {
        name: '衝擊炮塔',
        damage: 40,
        range: 110,
        fireRate: 40,
        knockbackDistance: 120,   // 击退距离 120 像素
        color: '#e7b13c',
        category: 'disrupt',
        projectileColor: '#e7b13c',
        icon: '💥',
        effects: ['knockback']
      }
    },
        {
      id: 'tower_thief_king',
      name: '盜賊之王',
      tier: 'epic',
      description: '攻擊命中時有機率獲得金幣。',
      slots: [
        { category: 'attack', quality: 'perfect' },
        { category: 'support', quality: 'basic' },
        { category: 'support', quality: 'basic' },
        { category: 'support', quality: 'basic' }
      ],
      result: {
        name: '盜賊之王',
        damage: 100,
        range: 120,
        fireRate: 60,
        stealChance: 0.3,
        stealGold: 15,
        color: '#f1c40f',
        category: 'attack',
        projectileColor: '#ffcc00',
        icon: '🤑',
        effects: ['steal_gold']
      }
    },
        {
      id: 'tower_lava_walker',
      name: '熔岩行者',
      tier: 'epic',
      description: '濺射攻擊並造成燃燒，持續傷害敵人。',
      slots: [
        { category: 'attack', quality: 'perfect' },
        { category: 'attack', quality: 'basic' },
        { category: 'attack', quality: 'basic' },
        { category: 'disrupt', quality: 'basic' }
      ],
      result: {
        name: '熔岩行者',
        damage: 35,
        range: 110,
        fireRate: 25,
        splashRadius: 55,
        splashDamageRatio: 0.3,
        burnDuration: 60,        // 每 10 幀 燃燒一次
        burnDamage: 10,
        color: '#e67e22',
        category: 'attack',
        projectileColor: '#ff6600',
        icon: '🌋',
        effects: ['splash','burn']
      }
    },
        {
      id: 'tower_frost_queen',
      name: '極凍女皇',
      tier: 'epic',
      description: '造成範圍緩速。蓄能滿後，移動時觸發大範圍冰凍。',
      slots: [
        { category: 'disrupt', quality: 'perfect' },
        { category: 'support', quality: 'basic' },
        { category: 'support', quality: 'basic' },
        { category: 'disrupt', quality: 'basic' }
      ],
      result: {
        name: '極凍女皇',
        damage: 25,
        range: 110,
        fireRate: 30,
        hasAura: true,
        auraSlowAmount: 0.4,
        auraCooldown: 60,
        auraDuration: 120,
        auraRadius: 100,
        chargeTime: 900,
        chargedColor: '#d0ecff',   // 冰藍色（蓄滿時閃爍用）
        freezeDuration: 120,
        freezeRadius: 150,
        color: '#4baff1',
        category: 'disrupt',
        projectileColor: '#4baff1',
        icon: '❄️',
        effects: ['default']
      }
    },
        {
      id: 'tower_millionaire',
      name: '百萬富翁',
      tier: 'legendary',
      description: '傷害隨當前金幣增加。',
      slots: [
        { category: 'support', quality: 'standard' },
        { category: 'support', quality: 'standard' },
        { category: 'attack', quality: 'standard' },
        { category: 'attack', quality: 'standard' }
      ],
      result: {
        name: '百萬富翁',
        damage: 30,
        range: 110,
        fireRate: 25,
        goldDamageRatio: 0.1,  // 每 1 金幣增加 0.1 傷害（每 100 金幣 +10 傷害）
        color: '#f39c12',
        category: 'support',
        projectileColor: '#f1c40f',
        icon: '💰',
        effects: ['default']
      }
    },
        {
      id: 'tower_blood_beast',
      name: '嗜血猛獸',
      tier: 'legendary',
      description: '每販售攻擊系塔，永久提升傷害。',
      slots: [
        { category: 'attack', quality: 'standard' },
        { category: 'attack', quality: 'standard' },
        { category: 'attack', quality: 'standard' },
        { category: 'attack', quality: 'standard' }
      ],
      result: {
        name: '嗜血猛獸',
        damage: 40,
        range: 110,
        fireRate: 28,
        sellBonusDamage: 20,       // 每次販賣攻擊塔基礎傷害加成
        sellPercentBonus: 0,       // Lv.3 以上才啟動百分比加成，基礎為 0
        color: '#8b0000',
        category: 'attack',
        projectileColor: '#ff4444',
        icon: '🩸',
        effects: ['default']
      }
    },


  ],

    // 配方升級效果（每級相對於 1 級的倍率）
  RECIPE_UPGRADE_EFFECTS: {
    'tower_flame_turret': {
      damage:    [1.0, 1.20, 1.45, 1.75, 2.10],
      fireRate:  [1.0, 1.00, 1.00, 1.00, 1.00],  // 攻速倍率（數字越大越快）
      customDisplay: [ 
    '攻擊會造成50%濺射傷害',
    '傷害 +20%',
    '傷害 +25%，射程提升',
    '傷害 +30%',
    '傷害 +35%'
  ]
    },
    'tower_ice_fortress': {
      damage:    [1.0, 1.15, 1.35, 1.60, 1.90],
      fireRate:  [1.0, 1.00, 1.00, 1.20, 1.40],
      customDisplay: [ 
    '攻擊造成緩速，優先攻擊沒被緩速的敵人',
    '傷害 +20%',
    '傷害 +25%，射程提升',
    '傷害 +20%，攻速 +20%',
    '傷害 +20%，攻速 +20%'
  ]
    },
    'tower_gold_mine': {
      damage:    [1.0, 1.20, 1.45, 1.75, 2.10],
      fireRate:  [1.0, 1.0, 1.0, 1.0, 1.0],
      goldPerWave: [1.0, 2.0, 3.0, 4.0, 5.0],  // 金幣產量倍率
      customDisplay: [ 
    '回合結束時獲得100金幣',
    '傷害 +20%，金幣 +100',
    '傷害 +25%，金幣 +100',
    '傷害 +30%，金幣 +100',
    '傷害 +35%，金幣 +100'
  ]
    },
        'tower_coin_hunter': {
      damage:     [1.0, 1.15, 1.35, 1.60, 1.90],
      bonusGold:  [1.0, 1.5, 2.0, 2.5, 3.0],
      customDisplay: [
        '擊殺獲得額外金幣 30',
        '傷害 +15%，額外金幣 45',
        '傷害 +35%，額外金幣 60',
        '傷害 +60%，額外金幣 75',
        '傷害 +90%，額外金幣 90'
      ]
    },
        'tower_toxic_mist': {
      auraDamage:         [1.0, 1.3, 1.7, 2.2, 2.8],
      auraDamagePercent:  [0.0, 0.0, 1.0, 1.0, 2.0],
      auraCooldown:       [1.0, 1.0, 1.0, 1.0, 1.0],  // 倍率越小越快
      auraRadius:         [1.0, 1.00, 1.10, 1.15, 1.20],
      customDisplay: [
        '毒霧造成80傷害',
        '傷害 +30%',
        '傷害 +40%，毒霧額外造成2%生命傷害',
        '傷害 +50%',
        '傷害 +60%，額外傷害+2%'
      ]
    },
        'tower_shock_cannon': {
      damage:        [1.0, 1.20, 1.45, 1.75, 2.10],
      fireRate:      [1.0, 1.0, 1.20, 1.20, 1.40],
      knockbackDistance: [1.0, 1.25, 1.5, 1.8, 2.2],
      customDisplay: [
        '攻擊附帶擊退120px的效果',
        '傷害 +20%，擊退 +25%',
        '傷害 +25%，攻速 +20%，擊退 +25%',
        '傷害 +30%，擊退 +30%',
        '傷害 +35%，攻速 +20%，擊退 +30%'
      ]
    },
      
        'tower_thief_king': {
      damage:      [1.0, 1.15, 1.35, 1.60, 1.90],
      stealChance: [1.0, 1.3, 1.6, 2.0, 2.3],   // 機率倍率
      stealGold:   [1.0, 1.3, 2.0, 3.0, 4.0],     // 金幣倍率（15→20→30→45→60）
      customDisplay: [
        '攻擊命中有30%機率 偷取 15 金幣）',
        '機率+10%，金幣+5',
        '機率+10%，金幣+5',
        '機率+10%，金幣+5',
        '機率+10%，金幣+5'
      ]
    },
        'tower_lava_walker': {
      damage:       [1.0, 1.15, 1.35, 1.60, 1.90],
      burnDamage:   [1.0, 1.2, 1.4, 1.75, 2.1],
      burnDuration: [1.0, 1.0, 1.5, 1.5, 2.0],
      customDisplay: [
        '燃燒造成 10 傷害',
        '燃燒傷害+20%',
        '燃燒傷害+20%，燃燒持續時間增加',
        '燃燒傷害+35%',
        '燃燒傷害+35%，燃燒持續時間增加'
      ]
    },
        'tower_frost_queen': {
      damage:        [1.0, 1.10, 1.25, 1.45, 1.70],
      auraSlowAmount:[1.0, 0.85, 0.75, 0.65, 0.55],
      auraRadius:    [1.0, 1.0, 1.0, 1.2, 1.2],
      chargeTime:    [1.0, 0.85, 0.7, 0.6, 0.5],
      freezeDuration:[1.0, 1.15, 1.35, 1.60, 1.90],
      freezeRadius:  [1.0, 1.0, 1.15, 1.15, 1.25],
      customDisplay: [
        '蓄能 15 秒',
        '蓄能 12.75 秒，冰凍 2.3 秒',
        '蓄能 10.5 秒，冰凍 2.7 秒，冰凍範圍擴大',
        '蓄能 9 秒，冰凍 3.2 秒，緩速範圍擴大',
        '蓄能 7.5 秒，冰凍 3.8 秒，冰凍範圍擴大'
      ]
    },
      'tower_millionaire': {
      fireRate:         [1.0, 1.1, 1.2, 1.3, 1.4],
      goldDamageRatio:  [1.0, 1.5, 2.0, 2.5, 3.0],
      customDisplay: [
        '攻擊額外提升當前金幣量的10% ',
        '攻速+10%，提升量 +5%',
        '攻速+10%，提升量 +5%',
        '攻速+10%，提升量 +5%',
        '攻速+10%，提升量 +5%'
      ]
    },
        'tower_blood_beast': {
      damage:           [1.0, 1.15, 1.35, 1.60, 1.90],
      fireRate:         [1.0, 1.08, 1.16, 1.24, 1.32],
      sellBonusDamage:  [1.0, 1.3, 1.7, 2.2, 2.8],   // 20→26→34→44→56
      sellPercentBonus: [0, 0, 0.05, 0.05, 0.10],      // Lv.3 以上啟動
      customDisplay: [
        '販賣攻擊塔 +20 傷害',
        '販賣加成 +26 傷害',
        '販賣加成 +34 傷害，每賣 10 座總傷 +5%',
        '販賣加成 +44 傷害',
        '販賣加成 +56 傷害，總傷額外 +5%（合計 +10%）'
      ]
    },

    // 未來新增配方時在此補上
  },

  // ----- 時間與通知 -----
  TIME_BETWEEN_WAVES: 900,    // 每波持續 15 秒（60fps × 15 = 900）
  SPAWN_INTERVAL: 30,          // 每 1 秒生成一隻敵人（加快節奏，可自行調整）


  // ----- 資源 -----
  START_GOLD: 300,
    // ---------- 經濟系統 ----------
  TOWER_BASE_COST: 50,            // 第一座塔的費用
  TOWER_COST_INCREMENT: 15,       // 每多建一座塔，費用增加量
  TOWER_MAX_COST: 350,            // 建造費用上限
  SELL_REFUND: 30,                // 販賣固定返還
  KILL_REWARD: 15,                // 擊殺怪物固定獎勵
  WAVE_BONUS_BASE: 100,           // 每 5 波獎勵基礎值
  WAVE_BONUS_PER_WAVE: 2,         // 每 5 波獎勵隨波次加成
  WAVE_BONUS_INTERVAL: 5,         // 獎勵間隔（波次）
  BOSS_WAVE_INTERVAL: 10,          // 每10波出一隻Boss
  BOSS_DIAMOND_REWARD: 1,          // 擊殺Boss獲得鑽石數量

    // ---------- 局外星塵與永久升級 ----------
  STARDUST_FORMULA: {
    perWave: 10,
    perBoss: 50,
    per100Kills: 5
  },
  
    // ---------- 局內素材品質 ----------
  MATERIAL_QUALITIES: {
    basic:    { name: '一般', chance: 0.60 },
    standard: { name: '標準', chance: 0.30 },
    perfect:  { name: '完美', chance: 0.10 }
  },

  // ---------- 局外配方階層 ----------
  RECIPE_TIERS: {
    common:    { name: '普通', color: '#ffffff', weight: 60 },
    rare:      { name: '稀有', color: '#3498db', weight: 25 },
    epic:      { name: '史詩', color: '#9b59b6', weight: 10 },
    legendary: { name: '傳說', color: '#f1c40f', weight: 4 },
    mythic:    { name: '神話', color: '#e74c3c', weight: 1 }
  },

  // ---------- 升級碎片需求 ----------
  UPGRADE_FRAGMENTS: {
    common:    [0, 8, 42, 120, 330],
    rare:      [0, 6, 34, 100, 260],
    epic:      [0, 5, 25, 70, 200],
    legendary: [0, 3, 17, 50, 130],
    mythic:    [0, 2, 8, 25, 65]
  },

  // ---------- 重複抽取轉換碎片 ----------
  DUPLICATE_FRAGMENTS: {
    common:    10,
    rare:      8,
    epic:      6,
    legendary: 4,
    mythic:    2
  },

  // ---------- 通用碎片轉換率（預留）----------
  UNIVERSAL_FRAGMENT_RATIO: {
    common:    2,
    rare:      5,
    epic:      10,
    legendary: 25,
    mythic:    60
  },

  // 精華掉落
  ESSENCE_PER_BOSS: 1,
  // 每次抽取花費精華
  DRAW_COST: 1,

  PERMANENT_UPGRADES: {
    startGold: {
      name: '起始金幣',
      levels: [
        { cost: 0, value: 300 },
        { cost: 100, value: 400 },
        { cost: 250, value: 520 },
        { cost: 500, value: 660 },
        { cost: 1000, value: 820 },
        { cost: 2000, value: 1000 }
      ]
    },
    damageBonus: {
      name: '塔傷害加成',
      levels: [
        { cost: 0, value: 1.0 },
        { cost: 150, value: 1.15 },
        { cost: 350, value: 1.30 },
        { cost: 700, value: 1.50 },
        { cost: 1500, value: 1.75 },
        { cost: 3000, value: 2.0 }
      ]
    },
    rareChance: {
      name: '稀有機率加成',
      levels: [
        { cost: 0, value: 0 },
        { cost: 200, value: 0.05 },
        { cost: 500, value: 0.10 },
        { cost: 1200, value: 0.15 }
      ]
    }
  }

};