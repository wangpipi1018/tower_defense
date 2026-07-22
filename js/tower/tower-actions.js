// ========== tower-actions.js ==========
// 塔的攻擊、光環效果

// 路徑總周長（快取，只算一次）。用來把 totalDistance 換算成「本圈內」的進度，
// 避免敵人繞圈後 totalDistance 一直往上累加，導致跟同圈但更靠前的敵人比較時分數錯亂。
let _pathPerimeter = null;
function getPathPerimeter() {
  if (_pathPerimeter === null) {
    let sum = 0;
    for (let i = 0; i < CONFIG.PATH.length - 1; i++) {
      sum += distance(CONFIG.PATH[i], CONFIG.PATH[i + 1]);
    }
    _pathPerimeter = sum || 1; // 避免除以 0
  }
  return _pathPerimeter;
}

function applyTowerEffects() {
  for (let t of towers) {
    if (!t.hasAura) continue;

     // 蓄能累積（每幀都累加，不受冷卻計時器影響）
     if (t.chargeTime && t.charge !== undefined) {
      t.charge = (t.charge || 0) + 1;
     }

    if (t.auraCooldownTimer > 0) {
      t.auraCooldownTimer--;
      continue;
    }

    // ===== 1. 緩速處理（僅當有緩速數值時） =====
    if (t.auraSlowAmount && t.auraSlowAmount > 0 && t.auraDuration > 0) {
      for (let e of enemies) {
        if (distance(getTowerCenter(t), e) <= t.auraRadius) {
          const type = CONFIG.ENEMY_TYPES[e.enemyType];
          const resistance = type ? (type.slowResistance || 0) : 0;
          const finalSlow = t.auraSlowAmount + (1 - t.auraSlowAmount) * resistance;
          if (finalSlow < e.slowPower) {
            e.slowPower = finalSlow;
            e.slowTimer = t.auraDuration;
          }
        }
      }
    }

    // ===== 2. 光環傷害處理（獨立迴圈，反向安全移除） =====
    if ((t.auraDamage && t.auraDamage > 0) || (t.auraDamagePercent && t.auraDamagePercent > 0)) {
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (distance(getTowerCenter(t), e) <= t.auraRadius) {
          let dmg = 0;
          if (t.auraDamage) dmg += t.auraDamage;
          if (t.auraDamagePercent) dmg += Math.floor(e.maxHp * t.auraDamagePercent);
          if (dmg > 0) {
            e.hp -= dmg;
            e.hitFlash = 2;
          }
          if (e.hp <= 0) {
            spawnWaveEffect(e.x, e.y, 20, 10, 'rgba(39, 174, 96, 0.8)', 2);
            gold += CONFIG.KILL_REWARD;
            totalKills++;
            if (e.enemyType === 'boss') {
              bossKills++;
              window.diamonds += CONFIG.BOSS_DIAMOND_REWARD;
              PlayerData.essence += CONFIG.ESSENCE_PER_BOSS;
              window.bossAlive = false;
            }
            enemies.splice(i, 1);
          }
        }
      }
    }

    // ===== 3. 波紋特效（根據是否有敵人在範圍內） =====
    const hitAny = enemies.some(e => distance(getTowerCenter(t), e) <= t.auraRadius);
    if (hitAny) {
      const center = getTowerCenter(t);
      const color = t.auraColor || '#4488ff';
      const [r, g, b] = [parseInt(color.slice(1,3),16), parseInt(color.slice(3,5),16), parseInt(color.slice(5,7),16)];
      const rgba1 = `rgba(${r},${g},${b},0.7)`;
      const rgba2 = `rgba(${r},${g},${b},0.5)`;
      spawnWaveEffect(center.x, center.y, t.auraRadius, 25, rgba1, 3);
      spawnWaveEffect(center.x, center.y, t.auraRadius * 0.7, 20, rgba2, 2);
    }

    t.auraCooldownTimer = t.auraCooldown;
  }
}

function updateTowers() {
  for (let t of towers) {
    if (t.damage <= 0) continue;
    if (t.cooldown > 0) { t.cooldown--; continue; }

    let target = null;
    let bestScore = -Infinity;

    for (let e of enemies) {
      const dist = distance(getTowerCenter(t), e);
      if (dist > t.range) continue;

      // 计算前进分数：waypointIndex 越大越靠前，同一索引时距离下一路径点越近越靠前
      // 用 totalDistance % 周長 取得「本圈內」的里程，避免繞過圈的舊敵人
      // 因為終身累積距離較大，而蓋過同圈內明明更靠前的新敵人
      const nextIdx = (e.waypointIndex + 1) % CONFIG.PATH.length;
      const nextPoint = CONFIG.PATH[nextIdx];
      const distToNext = distance(e, nextPoint);
      const lapDistance = e.totalDistance % getPathPerimeter();
      const progress = lapDistance + (1 - Math.min(distToNext / CONFIG.CELL_SIZE, 1));

      // 蓝塔：优先攻击未缓速的敌人，但仍在范围内选择最靠前的
      if (t.category === 'disrupt') {
        // 未缓速的敌人加权
        const isSlowed = e.slowTimer > 0;
        const score = progress + (isSlowed ? -1000 : 0); // 未缓速的分数远高于缓速的
        if (score > bestScore) {
          bestScore = score;
          target = e;
        }
      } else {
        // 红、黄塔：只选最靠前的
        if (progress > bestScore) {
          bestScore = progress;
          target = e;
        }
      }
    }

    if (target) {
      spawnProjectile(t, target);
      t.cooldown = t.fireRate;
    }
  }
}