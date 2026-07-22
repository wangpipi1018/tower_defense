// ========== game-events.js ==========
// Canvas 事件處理

function getCanvasCoords(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  };
}

function handleClick(clickX, clickY) {
  if (gameOver) return;

  // 販賣按鈕
  if (selectedTower && !selectedTower.isEvolved) {
    const panelX = canvas.width - 160;
    const panelY = 10;
    const btnX = panelX + 20;
    const btnY = panelY + 104;
    const btnW = 110;
    const btnH = 26;
    if (clickX >= btnX && clickX <= btnX + btnW && clickY >= btnY && clickY <= btnY + btnH) {
      sellTower(selectedTower);
      selectedTower = null;
      buildPanelOpen = false;
      updateUI();
      return;
    }
  }

  // 建造面板按鈕
  if (buildPanelOpen && buildSlot) {
    const categories = ['attack', 'disrupt', 'support'];
    const btnW = 70, btnH = 70, gap = 10;
    const panelW = categories.length * btnW + (categories.length - 1) * gap + 20;
    const panelH = btnH + 20;

    let drawX = buildSlot.x - panelW / 2;
    let drawY = buildSlot.y - panelH - 10;
    if (drawX < 5) drawX = 5;
    if (drawY < 5) drawY = buildSlot.y + 10;
    if (drawX + panelW > canvas.width - 5) drawX = canvas.width - panelW - 5;

    for (let i = 0; i < categories.length; i++) {
      const ix = drawX + 10 + i * (btnW + gap);
      const iy = drawY + 10;
      if (clickX >= ix && clickX <= ix + btnW && clickY >= iy && clickY <= iy + btnH) {
        const catKey = categories[i];
        const cat = CONFIG.MATERIAL_CATEGORIES[catKey];
        const materialDef = { category: catKey, color: cat.color };
        placeTower(buildSlot.x, buildSlot.y, materialDef);
        buildPanelOpen = false;
        const bigIdx = getBigSlotIndex(buildSlot.x, buildSlot.y);
        if (bigIdx) checkAndEvolveAt(bigIdx.col, bigIdx.row);
        updateUI();
        return;
      }
    }
    buildPanelOpen = false;
    return;
  }

  // 點到塔
  const clickedTower = getTowerAt(clickX, clickY);
  if (clickedTower) {
    selectedTower = (selectedTower === clickedTower) ? null : clickedTower;
    buildPanelOpen = false;
    return;
  }
  selectedTower = null;

  // 點到小塔位
  const slot = getSmallSlotCenter(clickX, clickY);
  if (slot) {
    const alreadyHasTower = towers.some(t => t.x === slot.x && t.y === slot.y);
    if (!alreadyHasTower) {
      if (buildPanelOpen && buildSlot && buildSlot.x === slot.x && buildSlot.y === slot.y) {
        buildPanelOpen = false;
        return;
      }
      buildPanelOpen = true;
      buildSlot = slot;
    } else {
      buildPanelOpen = false;
    }
    return;
  }
  buildPanelOpen = false;
}

// Pointer Events
canvas.addEventListener('pointermove', (e) => {
  e.preventDefault();
  const coords = getCanvasCoords(e.clientX, e.clientY);
  mouseX = coords.x;
  mouseY = coords.y;
  mouseOnSlot = getSmallSlotCenter(mouseX, mouseY);
  if (draggingTower) {
    const dx = mouseX - mouseDownX;
    const dy = mouseY - mouseDownY;
    if (!isDragging && (Math.abs(dx) > 15 || Math.abs(dy) > 15)) {
      isDragging = true;
      selectedTower = null;
      buildPanelOpen = false;
    }
  }
});

canvas.addEventListener('pointerup', (e) => {
  e.preventDefault();
  const coords = getCanvasCoords(e.clientX, e.clientY);
  const mx = coords.x;
  const my = coords.y;

  if (draggingTower && isDragging) {
    

    const srcBig = getBigSlotIndex(draggingTower.x, draggingTower.y);
    if (!srcBig) {
      draggingTower = null;
      isDragging = false;
      return;
    }

    if (draggingTower.isEvolved) {
      const targetBig = getBigSlotIndex(mx, my);
      if (targetBig && (targetBig.col !== srcBig.col || targetBig.row !== srcBig.row)) {
        swapBigSlots(srcBig.col, srcBig.row, targetBig.col, targetBig.row);
        const cx1 = CONFIG.TOWER_SLOTS.OFFSET_X + srcBig.col * CONFIG.CELL_SIZE * 2 + CONFIG.CELL_SIZE;
        const cy1 = CONFIG.TOWER_SLOTS.OFFSET_Y + srcBig.row * CONFIG.CELL_SIZE * 2 + CONFIG.CELL_SIZE;
        const cx2 = CONFIG.TOWER_SLOTS.OFFSET_X + targetBig.col * CONFIG.CELL_SIZE * 2 + CONFIG.CELL_SIZE;
        const cy2 = CONFIG.TOWER_SLOTS.OFFSET_Y + targetBig.row * CONFIG.CELL_SIZE * 2 + CONFIG.CELL_SIZE;
        spawnWaveEffect(cx1, cy1, 30, 15, 'rgba(255,255,255,0.5)', 2);
        spawnWaveEffect(cx2, cy2, 30, 15, 'rgba(255,255,255,0.5)', 2);
        checkAndEvolveAt(srcBig.col, srcBig.row);
        checkAndEvolveAt(targetBig.col, targetBig.row);
      }
    } else {
      const targetSlot = getSmallSlotCenter(mx, my);
      if (targetSlot) {
        const targetBig = getBigSlotIndex(targetSlot.x, targetSlot.y);
        const targetHasBig = targetBig && towers.some(t => {
          if (!t.isEvolved) return false;
          const idx = getBigSlotIndex(t.x, t.y);
          return idx && idx.col === targetBig.col && idx.row === targetBig.row;
        });

        if (targetHasBig) {
          if (targetBig.col !== srcBig.col || targetBig.row !== srcBig.row) {
            swapBigSlots(srcBig.col, srcBig.row, targetBig.col, targetBig.row);
            const cx1 = CONFIG.TOWER_SLOTS.OFFSET_X + srcBig.col * CONFIG.CELL_SIZE * 2 + CONFIG.CELL_SIZE;
            const cy1 = CONFIG.TOWER_SLOTS.OFFSET_Y + srcBig.row * CONFIG.CELL_SIZE * 2 + CONFIG.CELL_SIZE;
            const cx2 = CONFIG.TOWER_SLOTS.OFFSET_X + targetBig.col * CONFIG.CELL_SIZE * 2 + CONFIG.CELL_SIZE;
            const cy2 = CONFIG.TOWER_SLOTS.OFFSET_Y + targetBig.row * CONFIG.CELL_SIZE * 2 + CONFIG.CELL_SIZE;
            spawnWaveEffect(cx1, cy1, 30, 15, 'rgba(255,255,255,0.5)', 2);
            spawnWaveEffect(cx2, cy2, 30, 15, 'rgba(255,255,255,0.5)', 2);
            checkAndEvolveAt(srcBig.col, srcBig.row);
            checkAndEvolveAt(targetBig.col, targetBig.row);
          }
        } else {
          const targetSmall = towers.find(t => t.x === targetSlot.x && t.y === targetSlot.y && !t.isEvolved);
          if (!targetSmall) {
            draggingTower.x = targetSlot.x;
            draggingTower.y = targetSlot.y;
          } else if (targetSmall !== draggingTower) {
            const tempX = draggingTower.x;
            const tempY = draggingTower.y;
            draggingTower.x = targetSmall.x;
            draggingTower.y = targetSmall.y;
            targetSmall.x = tempX;
            targetSmall.y = tempY;
            spawnWaveEffect(targetSmall.x, targetSmall.y, 18, 12, 'rgba(255,255,255,0.5)', 2);
          }
          spawnWaveEffect(draggingTower.x, draggingTower.y, 18, 12, 'rgba(255,255,255,0.5)', 2);
          const big1 = getBigSlotIndex(draggingTower.x, draggingTower.y);
          if (big1) checkAndEvolveAt(big1.col, big1.row);
          if (targetSmall && targetSmall !== draggingTower) {
            const big2 = getBigSlotIndex(targetSmall.x, targetSmall.y);
            if (big2) checkAndEvolveAt(big2.col, big2.row);
          }
        }
      }
    }
    

    // 移動觸發蓄能效果（通用機制）：只要真的發生拖曳放開就檢查，
    // 不管該塔是普通小塔還是進化後的大塔（例如極凍女王）。
    // 注意：不能只放在下面 !srcBig 的分支裡——進化塔本來就佔在合法大塔位上，
    // srcBig 一定存在，會直接跳去 isEvolved 分支，永遠碰不到這段判斷。
    if (draggingTower.onMoveRelease && draggingTower.charge >= (draggingTower.chargeTime || Infinity)) {
      draggingTower.onMoveRelease(draggingTower);
      draggingTower.charge = 0;
    }
    
    draggingTower = null;
    isDragging = false;
    return;
  }

  if (draggingTower && !isDragging) {
    handleClick(mx, my);
  } else if (!draggingTower) {
    handleClick(mx, my);
  }
  draggingTower = null;
  isDragging = false;
});

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  const coords = getCanvasCoords(e.clientX, e.clientY);
  const mx = coords.x;
  const my = coords.y;
  mouseDownX = mx;
  mouseDownY = my;
  mouseX = mx;
  mouseY = my;
  const tower = getTowerAt(mx, my);
  if (tower) {
    draggingTower = tower;
    dragOffsetX = mx - tower.x;
    dragOffsetY = my - tower.y;
    isDragging = false;
  } else {
    draggingTower = null;
  }
});

canvas.addEventListener('pointerleave', () => {
  mouseOnSlot = null;
});

canvas.addEventListener('pointercancel', (e) => {
  e.preventDefault();
  // 取消當前的拖曳狀態
  if (draggingTower) {
    draggingTower = null;
    isDragging = false;
  }
});

// 局內配方圖鑑按鈕
document.getElementById('in-game-collection-btn').addEventListener('click', () => {
  const panel = document.getElementById('in-game-collection-panel');
  if (panel.style.display === 'none') {
    renderInGameCollection();
    panel.style.display = 'block';
  } else {
    panel.style.display = 'none';
  }
});

document.getElementById('in-game-collection-close-btn').addEventListener('click', () => {
  document.getElementById('in-game-collection-panel').style.display = 'none';
});

// 局內配方圖鑑：點擊展開/折疊詳細資訊
document.getElementById('in-game-collection-list').addEventListener('click', (e) => {
  // 檢查是否點到展開按鈕或整行
  const btn = e.target.closest('.mini-expand-btn');
  const row = e.target.closest('.mini-recipe');
  if (!btn && !row) return;
  
  const recipeId = (btn || row).dataset.recipeId;
  const detail = document.getElementById('inline-detail-' + recipeId);
  if (!detail) return;
  
  const isHidden = detail.style.display === 'none';
  detail.style.display = isHidden ? 'block' : 'none';
  
  // 更新按鈕圖示（如果有按鈕）
  if (btn) {
    btn.textContent = isHidden ? '🔼' : '🔽';
  } else {
    const expandBtn = row.querySelector('.mini-expand-btn');
    if (expandBtn) {
      expandBtn.textContent = isHidden ? '🔼' : '🔽';
    }
  }
});