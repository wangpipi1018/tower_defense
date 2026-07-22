// ========== game-synth.js ==========
// 合成進化相關邏輯

function checkEvolution(bigCol, bigRow) {
  const slotTowers = [null, null, null, null];

  for (let t of towers) {
    if (t.isEvolved) continue;
    const info = getTowerSlotInfo(t.x, t.y);
    if (info && info.bigCol === bigCol && info.bigRow === bigRow) {
      slotTowers[info.smallIndex] = t;
    }
  }

  if (slotTowers.some(t => !t)) return null;

  for (let recipe of CONFIG.EVOLUTION_RECIPES) {
    let match = true;
    for (let i = 0; i < 4; i++) {
      const slot = recipe.slots[i];
      const tower = slotTowers[i];
      if (slot.category && tower.category !== slot.category) { match = false; break; }
      if (slot.quality && tower.quality !== slot.quality) { match = false; break; }
    }
    if (match) {
      if (!PlayerData.unlockedRecipes[recipe.id]) return null;
      return recipe;
    }
  }
  return null;
}

function evolveBigSlot(bigCol, bigRow, recipe) {
  const centers = getBigSlotCenters(bigCol, bigRow);

  for (let c of centers) {
    const idx = towers.findIndex(t => t.x === c.x && t.y === c.y);
    if (idx >= 0) towers.splice(idx, 1);
  }

  const startX = CONFIG.TOWER_SLOTS.OFFSET_X;
  const startY = CONFIG.TOWER_SLOTS.OFFSET_Y;
  const slotW = CONFIG.CELL_SIZE * 2;
  const slotH = CONFIG.CELL_SIZE * 2;
  const x = startX + bigCol * slotW;
  const y = startY + bigRow * slotH;

  const result = recipe.result;
  const level = (PlayerData.recipeLevels[recipe.id] || 1) - 1;
  const effects = CONFIG.RECIPE_UPGRADE_EFFECTS[recipe.id];
  let dmgMult = 1, rngMult = 1, spdMult = 1, goldMult = 1;
  if (effects) {
    dmgMult = effects.damage ? effects.damage[level] || 1 : 1;
    rngMult = effects.range ? effects.range[level] || 1 : 1;
    spdMult = effects.fireRate ? effects.fireRate[level] || 1 : 1;
    goldMult = effects.goldPerWave ? effects.goldPerWave[level] || 1 : 1;
  }

  towers.push({
    x: x, y: y,
    category: result.category,
    isEvolved: true,
    evolvedRecipe: recipe.name,
    color: result.color,
    size: CONFIG.CELL_SIZE * 2,
    damage: Math.floor((result.damage || 0) * dmgMult),
    range: Math.floor((result.range || 0) * rngMult),
    fireRate: Math.max(1, Math.floor((result.fireRate || 999) / spdMult)),
    cooldown: 0,
    splashRadius: result.splashRadius || 0,
    splashDamageRatio: result.splashDamageRatio || 0,
    slowAmount: result.slowAmount || 0,
    slowDuration: result.slowDuration || 0,
    hasAura: result.hasAura || false,
    auraSlowAmount: (result.auraSlowAmount || 0) * (effects && effects.auraSlowAmount ? (effects.auraSlowAmount[level] || 1) : 1),
    auraCooldown: Math.max(1, Math.floor((result.auraCooldown || 60) * (effects && effects.auraCooldown ? (effects.auraCooldown[level] || 1) : 1))),
    auraDuration: Math.floor((result.auraDuration || 0) * (effects && effects.auraDuration ? (effects.auraDuration[level] || 1) : 1)),
    auraRadius: Math.floor((result.auraRadius || 0) * (effects && effects.auraRadius ? (effects.auraRadius[level] || 1) : 1)),
    auraDamage: Math.floor((result.auraDamage || 0) * (effects && effects.auraDamage ? (effects.auraDamage[level] || 1) : 1)),
    auraDamagePercent: (result.auraDamagePercent || 0) * (effects && effects.auraDamagePercent ? (effects.auraDamagePercent[level] || 1) : 1),
    auraColor: result.auraColor || '#4488ff',
    auraCooldownTimer: 0,
    chargeTime: Math.floor((result.chargeTime || 900) * (effects && effects.chargeTime ? (effects.chargeTime[level] || 1) : 1)),
    freezeDuration: Math.floor((result.freezeDuration || 120) * (effects && effects.freezeDuration ? (effects.freezeDuration[level] || 1) : 1)),
    freezeRadius: Math.floor((result.freezeRadius || 150) * (effects && effects.freezeRadius ? (effects.freezeRadius[level] || 1) : 1)),
    charge: 0,   // 蓄能計數器初始為 0
        onMoveRelease: result.chargeTime ? function(t) {
      const centerX = t.isEvolved ? t.x + CONFIG.CELL_SIZE : t.x;
      const centerY = t.isEvolved ? t.y + CONFIG.CELL_SIZE : t.y;
      for (let e of enemies) {
        if (distance({x: centerX, y: centerY}, e) <= (t.freezeRadius || 150)) {
          e.slowPower = 0;
          e.slowTimer = t.freezeDuration || 120;
        }
      }
      spawnWaveEffect(centerX, centerY, t.freezeRadius || 150, 30, 'rgba(100, 200, 255, 0.8)', 4);
      spawnWaveEffect(centerX, centerY, (t.freezeRadius || 150) * 0.7, 25, 'rgba(255, 255, 255, 0.6)', 3);
    } : null,
        sellBonusDamage: Math.floor((result.sellBonusDamage || 20) * (effects && effects.sellBonusDamage ? (effects.sellBonusDamage[level] || 1) : 1)),
    sellPercentBonus: (effects && effects.sellPercentBonus) ? (effects.sellPercentBonus[level] || 0) : 0,
    sellCount: 0,
    sellBonusAccumulated: 0,
    sellPercentAccumulated: 0,
    goldPerWave: Math.floor((result.goldPerWave || 0) * goldMult),
    bonusGold: Math.floor((result.bonusGold || 0) * (effects && effects.bonusGold ? (effects.bonusGold[level] || 1) : 1)),
    goldDamageRatio: (result.goldDamageRatio || 0) * (effects && effects.goldDamageRatio ? (effects.goldDamageRatio[level] || 1) : 1),
    knockbackDistance: Math.floor((result.knockbackDistance || 0) * (effects && effects.knockbackDistance ? (effects.knockbackDistance[level] || 1) : 1)),
    stealChance: (result.stealChance || 0) * (effects && effects.stealChance ? (effects.stealChance[level] || 1) : 1),
    stealGold: Math.floor((result.stealGold || 0) * (effects && effects.stealGold ? (effects.stealGold[level] || 1) : 1)),
        burnDuration: Math.floor((result.burnDuration || 0) * (effects && effects.burnDuration ? (effects.burnDuration[level] || 1) : 1)),
    burnDamage: Math.floor((result.burnDamage || 0) * (effects && effects.burnDamage ? (effects.burnDamage[level] || 1) : 1)),
    projectileColor: result.projectileColor || '#ffffff',
    projectileSpeed: 8,
    projectileSize: 6,
    icon: result.icon || '',
    effects: result.effects || ['default'],
  });

  spawnWaveEffect(x + CONFIG.CELL_SIZE, y + CONFIG.CELL_SIZE, 60, 30, 'rgba(255, 215, 0, 0.8)', 4);
  spawnWaveEffect(x + CONFIG.CELL_SIZE, y + CONFIG.CELL_SIZE, 40, 25, 'rgba(255, 255, 255, 0.6)', 3);
}

function checkAndEvolveAt(col, row) {
  const recipe = checkEvolution(col, row);
  if (recipe) {
    evolveBigSlot(col, row, recipe);
  }
}