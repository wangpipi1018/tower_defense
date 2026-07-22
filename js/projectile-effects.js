// ========== projectile-effects.js ==========
// 每種命中效果獨立成一個函式
// timing: 'onHit' = 命中時執行, 'onKill' = 擊殺後執行

const PROJECTILE_EFFECTS = {

  default: {
    timing: 'onHit',
    fn: (p, target) => {}
  },

  // 濺射
  splash: {
    timing: 'onHit',
    fn: (p, target) => {
      if (!p.splashRadius || p.splashRadius <= 0) return;
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        if (e === target) continue;
        if (distance(target, e) <= p.splashRadius) {
          e.hp -= p.damage * (p.splashDamageRatio || 0.5);
          e.hitFlash = 3;
                    // 對濺射目標觸發其他命中效果（排除 splash 自身）
          const otherEffects = (p.effects || []).filter(eff => eff !== 'splash');
          for (let key of otherEffects) {
            const eff = PROJECTILE_EFFECTS[key];
            if (eff && (eff.timing === 'onHit' || !eff.timing)) {
              eff.fn(p, e);
            }
          }
          if (e.hp <= 0) {
            if (e.enemyType === 'boss') {
              bossKills++;
              window.diamonds += CONFIG.BOSS_DIAMOND_REWARD;
              PlayerData.essence += CONFIG.ESSENCE_PER_BOSS;
              window.bossAlive = false;
            }
            gold += CONFIG.KILL_REWARD;
            totalKills++;
            enemies.splice(j, 1);
                          // 濺射擊殺後也執行 onKill 效果
              const effectKeys = p.effects || ['default'];
              for (let key of effectKeys) {
                const effect = PROJECTILE_EFFECTS[key] || PROJECTILE_EFFECTS.default;
                if (effect.timing === 'onKill') {
                  effect.fn(p, e);
                }
              }
          }
        }
      }
      spawnWaveEffect(target.x, target.y, p.splashRadius, 20, 'rgba(255, 80, 20, 0.8)', 3);
      spawnWaveEffect(target.x, target.y, p.splashRadius * 0.5, 15, 'rgba(255, 200, 50, 0.6)', 2);
    }
  },

  // 緩速
  slow: {
    timing: 'onHit',
    fn: (p, target) => {
      if (!p.slowAmount || p.slowAmount <= 0) return;
      const type = CONFIG.ENEMY_TYPES[target.enemyType];
      const resistance = type ? (type.slowResistance || 0) : 0;
      const finalSlow = p.slowAmount + (1 - p.slowAmount) * resistance;
      if (finalSlow < target.slowPower) {
        target.slowPower = finalSlow;
        target.slowTimer = p.slowDuration || 60;
      }
    }
  },

  // 額外金幣（金幣獵手）— 擊殺時才觸發
  bonus_gold: {
    timing: 'onKill',
    fn: (p, target) => {
      if (p.bonusGold && p.bonusGold > 0) {
        gold += p.bonusGold;
        spawnFloatingText(target.x, target.y - 10, '+' + p.bonusGold, '#f1c40f', 30);
      }
    }
  },
    knockback: {
    timing: 'onHit',
    fn: (p, target) => {
      const kbDist = p.knockbackDistance || 120;
      if (kbDist <= 0) return;
      // 减少终身行走距离（但不小于0）
      target.totalDistance = Math.max(0, target.totalDistance - kbDist);
      // 根据新距离重新设置敌人位置
      setEnemyPositionByDistance(target, target.totalDistance);
      // 清除移动锁定的残留状态，防止瞬移后卡顿
      target.slowTimer = Math.max(target.slowTimer, 0);
      // 击退特效
      spawnWaveEffect(target.x, target.y, 25, 12, 'rgba(255, 200, 50, 0.7)', 3);
    }
  },
    steal_gold: {
    timing: 'onHit',
    fn: (p, target) => {
      if (!p.stealChance || !p.stealGold) return;
      if (Math.random() < p.stealChance) {
        gold += p.stealGold;
        spawnFloatingText(target.x, target.y - 10, '+' + p.stealGold, '#f1c40f', 30);
      }
    }
  },
    burn: {
    timing: 'onHit',
    fn: (p, target) => {
      if (!target.statusEffects) target.statusEffects = [];
      target.statusEffects.push({
        type: 'burn',
        timer: p.burnDuration || 90,
        damage: p.burnDamage || 5
      });
    }
  },

  // ========== 未來新增效果 ==========



  freeze: {
    timing: 'onHit',
    fn: (p, target) => {
      target.slowPower = 0;
      target.slowTimer = p.freezeDuration || 60;
      spawnWaveEffect(target.x, target.y, 25, 15, 'rgba(100, 200, 255, 0.7)', 3);
    }
  },

  
};