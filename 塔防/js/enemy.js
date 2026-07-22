

function getHPModifier(wave) {
  if (wave <= 0) return 1;
  if (wave <= 15) {
    return (100 + (wave - 1) * 15) / 100;
  } else if (wave <= 50) {
    const hpW15 = 100 + 14 * 15; // 310
    return (hpW15 * Math.pow(1.09, wave - 15)) / 100;
  } else {
    const hpW15 = 100 + 14 * 15;
    const hpW50 = hpW15 * Math.pow(1.09, 35);
    return (hpW50 * Math.pow(1.14, wave - 50)) / 100;
  }
}

// 生成指定類型的敵人
function spawnEnemy(typeKey, currentWave) {
  const type = CONFIG.ENEMY_TYPES[typeKey];
  if (!type) return;

  const start = CONFIG.PATH[0];
  const modifier = getHPModifier(currentWave || 1);
  const hp = Math.floor(type.hp * modifier);

  enemies.push({
    x: start.x,
    y: start.y,
    hp: hp,
    maxHp: hp,
    waypointIndex: 0,
    totalDistance: 0,
    size: type.size,
    color: type.color,
    speed: type.speed,
    reward: CONFIG.KILL_REWARD,
    slowMultiplier: 1,
    slowPower: 1,
    slowTimer: 0,
    hitFlash: 0,
    enemyType: typeKey
  });
}

// 更新敵人：移動 + 減少閃白計時器
function updateEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];

    if (e.hitFlash > 0) {
      e.hitFlash--;
    }

        // 緩速計時器倒數與恢復
    if (e.slowTimer > 0) {
      e.slowTimer--;
      if (e.slowTimer <= 0) {
        e.slowPower = 1;   // 時間到，恢復原速
      }
    }
    e.slowMultiplier = e.slowPower;  // 同步到移動使用的倍率

    if (e.waypointIndex >= CONFIG.PATH.length - 1) {
      // 循環：回到路徑起點
      e.waypointIndex = 0;
    }

    const target = CONFIG.PATH[e.waypointIndex + 1];
    const dx = target.x - e.x;
    const dy = target.y - e.y;

    if (Math.abs(dx) <= e.speed && Math.abs(dy) <= e.speed) {
      e.totalDistance += Math.sqrt(dx * dx + dy * dy);
      e.x = target.x;
      e.y = target.y;
      e.waypointIndex++;
      continue;
    }

    const moveSpeed = e.speed * e.slowMultiplier;

    if (Math.abs(dx) > 0.1) {
      e.totalDistance += moveSpeed;
      e.y = target.y;
      e.x += Math.sign(dx) * moveSpeed;
      if (Math.sign(dx) * (target.x - e.x) < 0) {
        e.x = target.x;
      }
    } else if (Math.abs(dy) > 0.1) {
      e.totalDistance += moveSpeed;
      e.x = target.x;
      e.y += Math.sign(dy) * moveSpeed;
      if (Math.sign(dy) * (target.y - e.y) < 0) {
        e.y = target.y;
      }
    }
  }
}

// 繪製敵人：閃白時變亮
function drawEnemies(ctx) {
  for (let e of enemies) {
    const half = e.size / 2;
    const bodyColor = e.hitFlash > 0 ? '#ffffff' : e.color;
    ctx.fillStyle = bodyColor;
    ctx.fillRect(e.x - half, e.y - half, e.size, e.size);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(e.x - half, e.y - half, e.size, e.size);

    const hpPct = e.hp / e.maxHp;
    const bw = e.size, bh = 4, bx = e.x - bw / 2, by = e.y - half - 6;
    ctx.fillStyle = '#555';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(bx, by, bw * hpPct, bh);
        // Boss 金色邊框
    if (e.enemyType === 'boss') {
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 3;
      ctx.strokeRect(e.x - half - 2, e.y - half - 2, e.size + 4, e.size + 4);
    }
  }
}