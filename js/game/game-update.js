// ========== game-update.js ==========
// 波次、UI 更新、主遊戲迴圈

function nextWave() {
  for (let t of towers) {
    if (t.goldPerWave > 0) {
      gold += t.goldPerWave;
      const center = getTowerCenter(t);
      spawnWaveEffect(center.x, center.y, 25, 18, 'rgba(255, 215, 0, 0.7)', 2);
      spawnFloatingText(center.x, center.y - 10, '+' + t.goldPerWave, '#ffd700', 40);
    }
  }

  if (wave > 0 && wave % CONFIG.WAVE_BONUS_INTERVAL === 0) {
    const bonus = CONFIG.WAVE_BONUS_BASE + wave * CONFIG.WAVE_BONUS_PER_WAVE;
    gold += bonus;
  }

  if ((wave + 1) % CONFIG.BOSS_WAVE_INTERVAL === 0) {
    spawnEnemy('boss', wave + 1);
    window.bossAlive = true;
  }

  wave++;
  const waveIndex = Math.min(wave - 1, CONFIG.WAVES.length - 1);
  const waveDef = CONFIG.WAVES[waveIndex];

  spawnQueue = [];
  for (let spawn of waveDef.spawns) {
    for (let i = 0; i < spawn.count; i++) {
      spawnQueue.push({ type: spawn.type });
    }
  }

  waveTimer = CONFIG.TIME_BETWEEN_WAVES;
  spawnTimer = 0;
}

function updateUI() {
  goldDisplay.textContent = '💰 金幣: ' + gold;
  document.getElementById('diamond-display').textContent = '💎 ' + window.diamonds;
  livesDisplay.textContent = '👾 敵人: ' + enemies.length + '/' + CONFIG.MAX_ENEMIES;

  const secondsLeft = Math.ceil(waveTimer / 60);
  waveDisplay.textContent = '🌊 第 ' + wave + ' 波 - 剩餘 ' + secondsLeft + ' 秒';
}

function update() {
    frameCount++;
  if (gameOver) return;

  updateProjectiles();
  updateEffects();

  if (enemies.length >= CONFIG.MAX_ENEMIES) {
    gameOver = true;
    endGame();
    updateUI();
    return;
  }

  waveTimer--;
  if (waveTimer <= 0) {
    if (window.bossAlive && (wave % CONFIG.BOSS_WAVE_INTERVAL === 0)) {
      gameOver = true;
      endGame();
      updateUI();
      return;
    }
    nextWave();
  }

  if (spawnQueue.length > 0) {
    spawnTimer--;
    if (spawnTimer <= 0) {
      const nextSpawn = spawnQueue.shift();
      spawnEnemy(nextSpawn.type, wave);
      spawnTimer = CONFIG.SPAWN_INTERVAL;
    }
  }

  applyTowerEffects();
  updateEnemies();
  updateTowers();
  updateUI();
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}