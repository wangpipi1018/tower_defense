// ----- 基本數學 -----
function distance(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}





// ----- 大塔位 / 小塔位計算 -----
// 取得所有小塔位的中心座標 (用於建造)
function getAllSmallSlotCenters() {
  const centers = [];
  const slotW = CONFIG.CELL_SIZE * 2; // 一個大塔位 = 2x2 小格
  const slotH = CONFIG.CELL_SIZE * 2;
  const startX = CONFIG.TOWER_SLOTS.OFFSET_X;
  const startY = CONFIG.TOWER_SLOTS.OFFSET_Y;

  for (let bigRow = 0; bigRow < CONFIG.TOWER_SLOTS.ROWS; bigRow++) {
    for (let bigCol = 0; bigCol < CONFIG.TOWER_SLOTS.COLS; bigCol++) {
      // 大塔位的左上角像素
      const bigX = startX + bigCol * slotW;
      const bigY = startY + bigRow * slotH;

      // 四個小塔位中心
      const halfCell = CONFIG.CELL_SIZE / 2;
      centers.push({ x: bigX + halfCell, y: bigY + halfCell });               // 左上小格
      centers.push({ x: bigX + CONFIG.CELL_SIZE + halfCell, y: bigY + halfCell }); // 右上
      centers.push({ x: bigX + halfCell, y: bigY + CONFIG.CELL_SIZE + halfCell }); // 左下
      centers.push({ x: bigX + CONFIG.CELL_SIZE + halfCell, y: bigY + CONFIG.CELL_SIZE + halfCell }); // 右下
    }
  }
  return centers;
}

// 根據滑鼠點擊的像素座標，找出對應的小塔位中心，若點歪則回傳 null
function getSmallSlotCenter(mx, my) {
  const centers = getAllSmallSlotCenters();
  // 容許誤差：小格的半徑
  const tolerance = CONFIG.CELL_SIZE / 2;
  for (let c of centers) {
    if (Math.abs(mx - c.x) < tolerance && Math.abs(my - c.y) < tolerance) {
      return c;
    }
  }
  return null;
}

// 取得大格子索引（根據小塔位中心座標）
function getBigSlotIndex(slotX, slotY) {
  const startX = CONFIG.TOWER_SLOTS.OFFSET_X;
  const startY = CONFIG.TOWER_SLOTS.OFFSET_Y;
  const slotW = CONFIG.CELL_SIZE * 2;
  const slotH = CONFIG.CELL_SIZE * 2;
  
  const col = Math.floor((slotX - startX) / slotW);
  const row = Math.floor((slotY - startY) / slotH);
  
  if (col < 0 || col >= CONFIG.TOWER_SLOTS.COLS || row < 0 || row >= CONFIG.TOWER_SLOTS.ROWS) {
    return null;
  }
  return { col, row };
}

// 取得大格子內四個小塔位的中心座標
function getBigSlotCenters(bigCol, bigRow) {
  const startX = CONFIG.TOWER_SLOTS.OFFSET_X;
  const startY = CONFIG.TOWER_SLOTS.OFFSET_Y;
  const slotW = CONFIG.CELL_SIZE * 2;
  const slotH = CONFIG.CELL_SIZE * 2;
  const halfCell = CONFIG.CELL_SIZE / 2;
  
  const bigX = startX + bigCol * slotW;
  const bigY = startY + bigRow * slotH;
  
  return [
    { x: bigX + halfCell, y: bigY + halfCell },                          // 左上
    { x: bigX + CONFIG.CELL_SIZE + halfCell, y: bigY + halfCell },       // 右上
    { x: bigX + halfCell, y: bigY + CONFIG.CELL_SIZE + halfCell },       // 左下
    { x: bigX + CONFIG.CELL_SIZE + halfCell, y: bigY + CONFIG.CELL_SIZE + halfCell } // 右下
  ];
}

// 根據塔的座標，找出它屬於哪個大格子的哪個小格
// 回傳 { bigCol, bigRow, smallIndex }，若不在任何大格子內則回傳 null
function getTowerSlotInfo(tx, ty) {
  const startX = CONFIG.TOWER_SLOTS.OFFSET_X;
  const startY = CONFIG.TOWER_SLOTS.OFFSET_Y;
  const slotW = CONFIG.CELL_SIZE * 2;
  const slotH = CONFIG.CELL_SIZE * 2;
  const halfCell = CONFIG.CELL_SIZE / 2;

  // 計算相對於塔位區域的偏移
  const relX = tx - startX;
  const relY = ty - startY;

  // 計算大格子索引
  const bigCol = Math.floor(relX / slotW);
  const bigRow = Math.floor(relY / slotH);

  if (bigCol < 0 || bigCol >= CONFIG.TOWER_SLOTS.COLS ||
      bigRow < 0 || bigRow >= CONFIG.TOWER_SLOTS.ROWS) {
    return null;
  }

  // 計算在大格子內部的偏移
  const innerX = relX - bigCol * slotW;
  const innerY = relY - bigRow * slotH;

  // 判斷是四個小格中的哪一格 (0=左上, 1=右上, 2=左下, 3=右下)
  const isRight = innerX >= CONFIG.CELL_SIZE;
  const isBottom = innerY >= CONFIG.CELL_SIZE;
  let smallIndex;
  if (!isRight && !isBottom) smallIndex = 0;
  else if (isRight && !isBottom) smallIndex = 1;
  else if (!isRight && isBottom) smallIndex = 2;
  else smallIndex = 3;

  return { bigCol, bigRow, smallIndex };
}

// 交換兩個大格子的全部內容（大塔、小塔們），小塔保持原相對位置
function swapBigSlots(colA, rowA, colB, rowB) {
  const centersA = getBigSlotCenters(colA, rowA);
  const centersB = getBigSlotCenters(colB, rowB);

  // 收集 A 格子的所有塔，並記錄小塔的原始索引
  const towersA = [];
  for (let i = 0; i < centersA.length; i++) {
    const c = centersA[i];
    const t = towers.find(t2 => t2.x === c.x && t2.y === c.y && !t2.isEvolved);
    if (t) towersA.push({ tower: t, smallIndex: i });
  }
  // 檢查大塔
  const bigA = towers.find(t => {
    if (!t.isEvolved) return false;
    const idx = getBigSlotIndex(t.x, t.y);
    return idx && idx.col === colA && idx.row === rowA;
  });
  if (bigA) towersA.push({ tower: bigA, isBig: true });

  // 收集 B 格子的所有塔
  const towersB = [];
  for (let i = 0; i < centersB.length; i++) {
    const c = centersB[i];
    const t = towers.find(t2 => t2.x === c.x && t2.y === c.y && !t2.isEvolved);
    if (t) towersB.push({ tower: t, smallIndex: i });
  }
  const bigB = towers.find(t => {
    if (!t.isEvolved) return false;
    const idx = getBigSlotIndex(t.x, t.y);
    return idx && idx.col === colB && idx.row === rowB;
  });
  if (bigB) towersB.push({ tower: bigB, isBig: true });

  // 從 towers 中移除這些塔
  for (let item of towersA) {
    const idx = towers.indexOf(item.tower);
    if (idx >= 0) towers.splice(idx, 1);
  }
  for (let item of towersB) {
    const idx = towers.indexOf(item.tower);
    if (idx >= 0) towers.splice(idx, 1);
  }

  // 放置 A 的內容到 B 格子
  const bigAItem = towersA.find(item => item.isBig);
  const smallAItems = towersA.filter(item => !item.isBig);

  if (bigAItem) {
    // 大塔直接放在 B 格子左上角
    const startX_B = CONFIG.TOWER_SLOTS.OFFSET_X + colB * CONFIG.CELL_SIZE * 2;
    const startY_B = CONFIG.TOWER_SLOTS.OFFSET_Y + rowB * CONFIG.CELL_SIZE * 2;
    bigAItem.tower.x = startX_B;
    bigAItem.tower.y = startY_B;
    towers.push(bigAItem.tower);
  } else {
    // 小塔依照原始索引放到 B 的對應位置
    for (let item of smallAItems) {
      const idx = item.smallIndex;
      if (idx < centersB.length) {
        item.tower.x = centersB[idx].x;
        item.tower.y = centersB[idx].y;
        towers.push(item.tower);
      }
    }
  }

  // 放置 B 的內容到 A 格子
  const bigBItem = towersB.find(item => item.isBig);
  const smallBItems = towersB.filter(item => !item.isBig);

  if (bigBItem) {
    const startX_A = CONFIG.TOWER_SLOTS.OFFSET_X + colA * CONFIG.CELL_SIZE * 2;
    const startY_A = CONFIG.TOWER_SLOTS.OFFSET_Y + rowA * CONFIG.CELL_SIZE * 2;
    bigBItem.tower.x = startX_A;
    bigBItem.tower.y = startY_A;
    towers.push(bigBItem.tower);
  } else {
    for (let item of smallBItems) {
      const idx = item.smallIndex;
      if (idx < centersA.length) {
        item.tower.x = centersA[idx].x;
        item.tower.y = centersA[idx].y;
        towers.push(item.tower);
      }
    }
  }
}

// 根据终身行走距离重新设置敌人的路径位置（用于击退效果）
function setEnemyPositionByDistance(enemy, targetDistance) {
  const path = CONFIG.PATH;
  const totalLength = getPathPerimeter(); // 路徑總周長
  // 将目标距离映射到 [0, totalLength) 区间
  let dist = targetDistance % totalLength;
  if (dist < 0) dist += totalLength; // 处理负值

  // 遍历路径段，找到 dist 落在哪一段
  let accumulated = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const segStart = path[i];
    const segEnd = path[i + 1];
    const segDx = segEnd.x - segStart.x;
    const segDy = segEnd.y - segStart.y;
    const segLength = Math.sqrt(segDx * segDx + segDy * segDy);

    if (accumulated + segLength >= dist) {
      const remain = dist - accumulated;
      const ratio = remain / segLength;
      enemy.x = segStart.x + segDx * ratio;
      enemy.y = segStart.y + segDy * ratio;
      enemy.waypointIndex = i;
      return;
    }
    accumulated += segLength;
  }

  // 如果由于浮点数精度未找到，放在最后一个点
  const last = path[path.length - 1];
  enemy.x = last.x;
  enemy.y = last.y;
  enemy.waypointIndex = path.length - 2;
}

