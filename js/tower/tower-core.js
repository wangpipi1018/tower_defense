// ========== tower-core.js ==========
// 塔的建造、販賣、繪製、點擊偵測

let frameCount = 0;

function getTowerCenter(t) {
  if (t.isEvolved) {
    return { x: t.x + CONFIG.CELL_SIZE, y: t.y + CONFIG.CELL_SIZE };
  }
  return { x: t.x, y: t.y };
}

let totalTowersBuilt = 0;

function getTowerAt(mx, my) {
  for (let t of towers) {
    if (t.isEvolved) {
      if (mx >= t.x && mx <= t.x + t.size &&
          my >= t.y && my <= t.y + t.size) {
        return t;
      }
    } else {
      const half = t.size / 2;
      if (mx >= t.x - half && mx <= t.x + half &&
          my >= t.y - half && my <= t.y + half) {
        return t;
      }
    }
  }
  return null;
}

function placeTower(slotX, slotY, materialDef) {
  const cx = slotX;
  const cy = slotY;
  const cost = Math.min(
    CONFIG.TOWER_BASE_COST + totalTowersBuilt * CONFIG.TOWER_COST_INCREMENT,
    CONFIG.TOWER_MAX_COST
  );
  if (gold < cost) return false;
  if (towers.some(t => t.x === cx && t.y === cy)) return false;

  const roll = Math.random();
  let quality;
  if (roll < CONFIG.MATERIAL_QUALITIES.perfect.chance) {
    quality = 'perfect';
  } else if (roll < CONFIG.MATERIAL_QUALITIES.perfect.chance + CONFIG.MATERIAL_QUALITIES.standard.chance) {
    quality = 'standard';
  } else {
    quality = 'basic';
  }
  const stats = CONFIG.MATERIAL_STATS[materialDef.category][quality];

  gold -= cost;
  totalTowersBuilt++;
  towers.push({
    x: cx, y: cy,
    category: materialDef.category,
    quality: quality,
    color: materialDef.color,
    size: CONFIG.BASE_MATERIAL.size,
    damage: stats.damage || 0,
    range: stats.range || 0,
    fireRate: stats.fireRate || 999,
    cooldown: 0,
    splashRadius: stats.splashRadius || 0,
    splashDamageRatio: stats.splashDamageRatio || 0,
    slowAmount: stats.slowAmount || 0,
    slowDuration: stats.slowDuration || 0,
    hasAura: stats.hasAura || false,
    auraSlowAmount: stats.auraSlowAmount || 0,
    auraCooldown: stats.auraCooldown || 0,
    auraDuration: stats.auraDuration || 0,
    auraRadius: stats.auraRadius || 0,
    auraCooldownTimer: 0,
    goldPerWave: stats.goldPerWave || 0,
    projectileColor: CONFIG.PROJECTILE_COLORS[materialDef.category] || '#ffffff',
    projectileSpeed: 6,
    projectileSize: 4,
  });
  return true;
}

function sellTower(tower) {
  // 販賣攻擊系塔時，場上所有擁有 sellBonusDamage 屬性的塔獲得加成
  if (tower.category === 'attack') {
    for (let t of towers) {
      // 跳過被販賣的塔本身
      if (t === tower) continue;
      // 如果這座塔有 sellBonusDamage 屬性，觸發加成
      if (t.sellBonusDamage && t.sellBonusDamage > 0) {
        t.sellCount = (t.sellCount || 0) + 1;
        t.sellBonusAccumulated = (t.sellBonusAccumulated || 0) + t.sellBonusDamage;
        if (t.sellPercentBonus > 0 && t.sellCount % 10 === 0) {
          t.sellPercentAccumulated = (t.sellPercentAccumulated || 0) + t.sellPercentBonus;
        }
      }
    }
  }

  gold += CONFIG.SELL_REFUND;
  towers.splice(towers.indexOf(tower), 1);
}

function drawTowers(ctx) {
  for (let t of towers) {
    const half = t.size / 2;

    // 繪製進化大塔
    if (t.isEvolved) {
      let drawX = t.x;
      let drawY = t.y;

      // 蓄能滿時：微微浮動 
      if (t.chargeTime && t.charge >= t.chargeTime) {
        // 上下浮動 ±3 像素，週期約 1.5 秒
        const floatOffset = Math.sin(frameCount * 0.07) * 1.5;
        drawY += floatOffset;

        
      }

      // 塔本體（蓄滿時若有 chargedColor 則變色）
      ctx.fillStyle = (t.chargedColor && t.charge >= t.chargeTime) ? t.chargedColor : t.color;
      ctx.fillRect(drawX, drawY, t.size, t.size);
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 3;
      ctx.strokeRect(drawX, drawY, t.size, t.size);

      // 中央徽章
      if (t.icon) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px "Courier New"';
        ctx.textAlign = 'center';
        const centerX = drawX + CONFIG.CELL_SIZE;
        const centerY = drawY + CONFIG.CELL_SIZE;
        ctx.fillText(t.icon || '?', centerX, centerY + 7);
        ctx.textAlign = 'left';
      }
    } else {
      ctx.fillStyle = t.color;
      ctx.fillRect(t.x - half, t.y - half, t.size, t.size);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeRect(t.x - half, t.y - half, t.size, t.size);

      if (t.quality === 'standard') {
        const inset = 3;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(t.x - half + inset, t.y - half + inset,
                       t.size - inset * 2, t.size - inset * 2);
      } else if (t.quality === 'perfect') {
        const inset = 2;
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(t.x - half + inset, t.y - half + inset,
                       t.size - inset * 2, t.size - inset * 2);
        
      }
    }
  }
}