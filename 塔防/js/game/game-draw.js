// ========== game-draw.js ==========
// 所有繪圖函數

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 地圖格線
  for (let row = 0; row < CONFIG.MAP_ROWS; row++) {
    for (let col = 0; col < CONFIG.MAP_COLS; col++) {
      const x = col * CONFIG.CELL_SIZE;
      const y = row * CONFIG.CELL_SIZE;
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(x, y, CONFIG.CELL_SIZE, CONFIG.CELL_SIZE);
      if (CONFIG.SHOW_GRID) {
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, CONFIG.CELL_SIZE, CONFIG.CELL_SIZE);
      }
    }
  }

  // 大塔位區域
  const slotW = CONFIG.CELL_SIZE * 2;
  const slotH = CONFIG.CELL_SIZE * 2;
  for (let bigRow = 0; bigRow < CONFIG.TOWER_SLOTS.ROWS; bigRow++) {
    for (let bigCol = 0; bigCol < CONFIG.TOWER_SLOTS.COLS; bigCol++) {
      const x = CONFIG.TOWER_SLOTS.OFFSET_X + bigCol * slotW;
      const y = CONFIG.TOWER_SLOTS.OFFSET_Y + bigRow * slotH;
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(x, y, slotW, slotH);
      ctx.strokeStyle = '#5a7a9a';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 0.5, y + 0.5, slotW - 1, slotH - 1);
    }
  }

  // 小塔位虛線
  for (let s of SMALL_SLOTS) {
    const half = CONFIG.CELL_SIZE / 2;
    ctx.strokeStyle = '#7f8c8d';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(s.x - half, s.y - half, CONFIG.CELL_SIZE, CONFIG.CELL_SIZE);
    ctx.setLineDash([]);
  }

  // 滑鼠指向的小塔位高亮
  if (mouseOnSlot && !gameOver) {
    const alreadyHasTower = towers.some(t => t.x === mouseOnSlot.x && t.y === mouseOnSlot.y);
    if (!alreadyHasTower) {
      const half = CONFIG.CELL_SIZE / 2;
      ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
      ctx.fillRect(mouseOnSlot.x - half, mouseOnSlot.y - half, CONFIG.CELL_SIZE, CONFIG.CELL_SIZE);
    }
  }

  // 路徑
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(CONFIG.PATH[0].x, CONFIG.PATH[0].y);
  for (let i = 1; i < CONFIG.PATH.length; i++) {
    ctx.lineTo(CONFIG.PATH[i].x, CONFIG.PATH[i].y);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // 建造面板高亮
  if (buildPanelOpen && buildSlot) {
    const half = CONFIG.CELL_SIZE / 2;
    ctx.fillStyle = 'rgba(241, 196, 15, 0.35)';
    ctx.fillRect(buildSlot.x - half, buildSlot.y - half, CONFIG.CELL_SIZE, CONFIG.CELL_SIZE);
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 2;
    ctx.strokeRect(buildSlot.x - half + 1, buildSlot.y - half + 1, CONFIG.CELL_SIZE - 2, CONFIG.CELL_SIZE - 2);
  }

  drawTowers(ctx);
  drawEnemies(ctx);
  drawProjectiles(ctx);

  // 拖曳大塔高亮
  if (draggingTower && isDragging && draggingTower.isEvolved) {
    const targetBig = getBigSlotIndex(mouseX, mouseY);
    if (targetBig) {
      const slotX = CONFIG.TOWER_SLOTS.OFFSET_X + targetBig.col * CONFIG.CELL_SIZE * 2;
      const slotY = CONFIG.TOWER_SLOTS.OFFSET_Y + targetBig.row * CONFIG.CELL_SIZE * 2;
      ctx.fillStyle = 'rgba(241, 196, 15, 0.35)';
      ctx.fillRect(slotX, slotY, CONFIG.CELL_SIZE * 2, CONFIG.CELL_SIZE * 2);
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 2;
      ctx.strokeRect(slotX + 1, slotY + 1, CONFIG.CELL_SIZE * 2 - 2, CONFIG.CELL_SIZE * 2 - 2);
    }
  }

  // 拖曳中的塔
  if (draggingTower && isDragging) {
    const t = draggingTower;
    const half = t.size / 2;
    const drawX = mouseX - dragOffsetX;
    const drawY = mouseY - dragOffsetY;

    ctx.globalAlpha = 0.6;
    ctx.fillStyle = t.color;

    if (t.isEvolved) {
      ctx.fillRect(drawX, drawY, t.size, t.size);
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 2;
      ctx.strokeRect(drawX, drawY, t.size, t.size);
    } else {
      ctx.fillRect(drawX - half, drawY - half, t.size, t.size);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeRect(drawX - half, drawY - half, t.size, t.size);
      if (t.quality === 'standard' || t.quality === 'perfect') {
        const inset = 3;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(drawX - half + inset, drawY - half + inset, t.size - inset * 2, t.size - inset * 2);
      }
    }
    ctx.globalAlpha = 1;
  }

  drawEffects(ctx);
  drawBuildPanel();

  // 選中塔資訊面板
  if (selectedTower) {
    let centerX = selectedTower.x;
    let centerY = selectedTower.y;
    if (selectedTower.isEvolved) {
      centerX += CONFIG.CELL_SIZE;
      centerY += CONFIG.CELL_SIZE;
    }

    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, selectedTower.range || 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
    ctx.fill();

    const t = selectedTower;
    const panelX = canvas.width - 160;
    const panelY = 10;
    const panelW = 150;
    const panelH = 120;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    let towerName = '';
    let qualityText = '';
    let damageText = '';
    let rangeText = '';
    let speedText = '';

    if (t.isEvolved) {
      towerName = '⭐ ' + (t.evolvedRecipe || '進化塔');
      qualityText = '進化';
    } else if (t.category) {
      const cat = CONFIG.MATERIAL_CATEGORIES[t.category];
      towerName = cat.icon + ' ' + cat.name + '素材';
      if (t.quality === 'perfect') qualityText = '完美';
      else if (t.quality === 'standard') qualityText = '標準';
      else qualityText = '一般';
    }

    damageText = '傷害: ' + (t.damage || 0);
    rangeText = '範圍: ' + (t.range || 0);
    if (t.fireRate > 0) {
      speedText = '攻速: ' + (60 / t.fireRate).toFixed(1) + '/秒';
    } else {
      speedText = '攻速: N/A';
    }

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px "Courier New"';
    ctx.fillText(towerName, panelX + 10, panelY + 20);
    ctx.font = '12px "Courier New"';
    ctx.fillText(qualityText, panelX + 10, panelY + 38);
    ctx.fillText(damageText, panelX + 10, panelY + 54);
    ctx.fillText(rangeText, panelX + 10, panelY + 68);
    ctx.fillText(speedText, panelX + 10, panelY + 82);

    if (!t.isEvolved) {
      ctx.fillText('賣價: $' + CONFIG.SELL_REFUND, panelX + 10, panelY + 98);
    } else {
      ctx.fillText('不可販賣', panelX + 10, panelY + 98);
    }

    if (!t.isEvolved) {
      const btnX = panelX + 20;
      const btnY = panelY + 104;
      const btnW = 110;
      const btnH = 26;
      const hovering = mouseX >= btnX && mouseX <= btnX + btnW &&
                       mouseY >= btnY && mouseY <= btnY + btnH;
      ctx.fillStyle = hovering ? '#e74c3c' : '#c0392b';
      ctx.fillRect(btnX, btnY, btnW, btnH);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(btnX, btnY, btnW, btnH);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px "Courier New"';
      ctx.textAlign = 'center';
      ctx.fillText('賣 出', btnX + btnW / 2, btnY + 18);
      ctx.textAlign = 'left';
    }
  }

  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 32px "Courier New"';
    const reason = enemies.length >= CONFIG.MAX_ENEMIES ? '敵人數量已達上限！' : '遊戲結束';
    ctx.fillText(reason, canvas.width / 2 - 160, canvas.height / 2);
  }
}

function drawBuildPanel() {
  if (!buildPanelOpen || !buildSlot) return;

  const categories = ['attack', 'disrupt', 'support'];
  const btnW = 70;
  const btnH = 70;
  const gap = 10;
  const panelW = categories.length * btnW + (categories.length - 1) * gap + 20;
  const panelH = btnH + 20;

  let drawX = buildSlot.x - panelW / 2;
  let drawY = buildSlot.y - panelH - 10;
  if (drawX < 5) drawX = 5;
  if (drawY < 5) drawY = buildSlot.y + 10;
  if (drawX + panelW > canvas.width - 5) drawX = canvas.width - panelW - 5;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.fillRect(drawX, drawY, panelW, panelH);
  ctx.strokeStyle = '#ecf0f1';
  ctx.lineWidth = 2;
  ctx.strokeRect(drawX, drawY, panelW, panelH);

  for (let i = 0; i < categories.length; i++) {
    const catKey = categories[i];
    const cat = CONFIG.MATERIAL_CATEGORIES[catKey];
    const ix = drawX + 10 + i * (btnW + gap);
    const iy = drawY + 10;

    ctx.fillStyle = cat.color;
    ctx.fillRect(ix, iy, btnW, btnH);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(ix, iy, btnW, btnH);

    const hover = mouseX >= ix && mouseX <= ix + btnW && mouseY >= iy && mouseY <= iy + btnH;
    if (hover) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(ix, iy, btnW, btnH);
    }

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText(cat.icon + ' ' + cat.name, ix + btnW / 2, iy + 30);
    ctx.font = '12px "Courier New"';
    const currentCost = Math.min(
      CONFIG.TOWER_BASE_COST + totalTowersBuilt * CONFIG.TOWER_COST_INCREMENT,
      CONFIG.TOWER_MAX_COST
    );
    ctx.fillText('$' + currentCost, ix + btnW / 2, iy + 52);
    ctx.textAlign = 'left';
  }
}

function renderInGameCollection() {
  const list = document.getElementById('in-game-collection-list');
  const unlockedRecipes = CONFIG.EVOLUTION_RECIPES.filter(r => PlayerData.unlockedRecipes[r.id]);
  
  if (unlockedRecipes.length === 0) {
    list.innerHTML = '<div style="color:#888;font-size:12px;text-align:center;">尚無已解鎖配方</div>';
    return;
  }

  const qualityColors = { basic: '#888', standard: '#fff', perfect: '#f1c40f' };
  let html = '';
  
  for (let recipe of unlockedRecipes) {
    const tierData = CONFIG.RECIPE_TIERS[recipe.tier];
    const tierColor = tierData ? tierData.color : '#fff';
    const tierName = tierData ? tierData.name : '?';
    const owned = PlayerData.unlockedRecipes[recipe.id];
    const level = PlayerData.recipeLevels[recipe.id] || 1;

    html += `<div class="mini-recipe" data-recipe-id="${recipe.id}">`;
    // 成品預覽
    html += `<div class="mini-preview" style="background:${recipe.result.color};color:#fff;">${recipe.result.icon || '?'}</div>`;
    // 名稱 + 稀有度
    html += `<div class="mini-info">`;
    html += `<div class="mini-name">${recipe.name}</div>`;
    html += `<div class="mini-tier" style="color:${tierColor};">${tierName} Lv.${level}</div>`;
    html += `</div>`;
    // 2×2 素材色塊
    html += '<div class="mini-slots">';
    for (let i = 0; i < 4; i++) {
      const slot = recipe.slots[i];
      const matCat = CONFIG.MATERIAL_CATEGORIES[slot.category];
      const qColor = qualityColors[slot.quality] || '#888';
      html += `<div class="mini-slot" style="background:${matCat.color};border-color:${qColor};" title="${matCat.name} ${slot.quality}"></div>`;
    }
    html += '</div>';
    // 展開按鈕
    html += `<button class="mini-expand-btn" data-recipe-id="${recipe.id}">🔽</button>`;
    html += '</div>';

    // 展開的詳細資訊（預設隱藏）
    html += `<div class="recipe-inline-detail" id="inline-detail-${recipe.id}" style="display:none;">`;
    // 合成配方重複顯示
    html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">';
    html += '<span style="color:#888;">配方：</span>';
    for (let i = 0; i < 4; i++) {
      const slot = recipe.slots[i];
      const matCat = CONFIG.MATERIAL_CATEGORIES[slot.category];
      const qColor = qualityColors[slot.quality] || '#888';
      html += `<div class="mini-slot" style="background:${matCat.color};border-color:${qColor};width:16px;height:16px;" title="${matCat.name} ${slot.quality}"></div>`;
    }
    html += '</div>';
    // 當前數值
    const effects = CONFIG.RECIPE_UPGRADE_EFFECTS[recipe.id];
    const lvIndex = (level || 1) - 1;
    const dmg = Math.floor((recipe.result.damage || 0) * (effects?.damage?.[lvIndex] || 1));
    const rng = Math.floor((recipe.result.range || 0) * (effects?.range?.[lvIndex] || 1));
    const spd = Math.max(1, Math.floor((recipe.result.fireRate || 999) / (effects?.fireRate?.[lvIndex] || 1)));
    html += `<div>⚔️ 傷害: ${dmg} | 📏 範圍: ${rng} | ⚡ 攻速: ${(60/spd).toFixed(1)}/s</div>`;
    // 升級效果簡表
    if (effects?.customDisplay) {
      html += '<div class="detail-upgrades">升級效果：<br>';
      for (let lv = 1; lv <= effects.customDisplay.length; lv++) {
        const highlight = lv === level ? 'color:#f1c40f;' : '';
        html += `<span style="${highlight}">Lv${lv}: ${effects.customDisplay[lv-1]}</span><br>`;
      }
      html += '</div>';
    }
    html += '</div>';
  }
  
  list.innerHTML = html;
}
