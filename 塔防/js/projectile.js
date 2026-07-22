let projectiles = [];

function spawnProjectile(fromTower, targetEnemy) {

    let originX = fromTower.x;
    let originY = fromTower.y;
    if (fromTower.isEvolved) {
    originX += CONFIG.CELL_SIZE;
    originY += CONFIG.CELL_SIZE;
    }
    // 自動根據屬性構建 effects 陣列（素材塔相容）
  let effects = fromTower.effects || [];
  if (fromTower.splashRadius && fromTower.splashRadius > 0 && !effects.includes('splash')) {
    effects = [...effects, 'splash'];
  }
  if (fromTower.slowAmount && fromTower.slowAmount > 0 && !effects.includes('slow')) {
    effects = [...effects, 'slow'];
  }
  if (effects.length === 0) {
    effects = ['default'];
  }

  projectiles.push({
    effects: effects,
    x: originX, y: originY,
    target: targetEnemy,
        damage: (() => {
      let dmg = fromTower.damage;
      if (fromTower.sellBonusAccumulated) {
        dmg += fromTower.sellBonusAccumulated;
        if (fromTower.sellPercentAccumulated) {
          dmg = Math.floor(dmg * (1 + fromTower.sellPercentAccumulated));
        }
      }
      if (fromTower.goldDamageRatio) {
        dmg += Math.floor(gold * fromTower.goldDamageRatio);
      }
      return dmg;
    })(),
    speed: fromTower.projectileSpeed || 6,
    size: fromTower.projectileSize || 4,
    color: fromTower.projectileColor || '#f1c40f',
    splashRadius: fromTower.splashRadius || 0,
    splashDamageRatio: fromTower.splashDamageRatio || 0,
    slowAmount: fromTower.slowAmount || 0,
    slowDuration: fromTower.slowDuration || 0,
    bonusGold: fromTower.bonusGold || 0,
    knockbackDistance: fromTower.knockbackDistance || 0,
    stealChance: fromTower.stealChance || 0,
    stealGold: fromTower.stealGold || 0,
    burnDuration: fromTower.burnDuration || 0,
    burnDamage: fromTower.burnDamage || 0,
  });
}

function updateProjectiles() {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];

    // 目標無效 → 移除子彈
    if (!p.target || p.target.hp <= 0 || !enemies.includes(p.target)) {
      projectiles.splice(i, 1);
      continue;
    }

    const dx = p.target.x - p.x;
    const dy = p.target.y - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= p.speed) {
      if (p.target.hp <= 0) {
      projectiles.splice(i, 1);
      continue;
      }
      // 擊中目標
      p.target.hp -= p.damage;
      p.target.hitFlash = 4;

            // 查表呼叫所有效果（支持复合效果如 ['splash', 'slow']）
            // 階段一：執行「命中時」效果
      const effectKeys = p.effects || ['default'];
      for (let key of effectKeys) {
        const effect = PROJECTILE_EFFECTS[key] || PROJECTILE_EFFECTS.default;
        if (effect.timing === 'onHit' || !effect.timing) {
          effect.fn(p, p.target);
        }
      }

      projectiles.splice(i, 1);

      // 目標死亡
            if (p.target.hp <= 0) {
        if (p.target.enemyType === 'boss') {
          bossKills++;
          window.diamonds += CONFIG.BOSS_DIAMOND_REWARD;
          PlayerData.essence += CONFIG.ESSENCE_PER_BOSS;
          window.bossAlive = false;
        }
        gold += CONFIG.KILL_REWARD;
        totalKills++;
        enemies.splice(enemies.indexOf(p.target), 1);
              // 階段二：執行「擊殺後」效果（目標已死亡時才觸發）
      for (let key of effectKeys) {
        const effect = PROJECTILE_EFFECTS[key] || PROJECTILE_EFFECTS.default;
        if (effect.timing === 'onKill') {
          effect.fn(p, p.target);
        }
      }
      }
      
    } else {
      // 移動子彈
      p.x += (dx / dist) * p.speed;
      p.y += (dy / dist) * p.speed;
    }
  }
}

function drawProjectiles(ctx) {
  for (let p of projectiles) {
    const half = p.size / 2;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - half, p.y - half, p.size, p.size);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(p.x - half, p.y - half, p.size, p.size);
  }
}