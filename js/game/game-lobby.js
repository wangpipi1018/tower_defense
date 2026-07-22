// ========== game-lobby.js ==========
// 局外大廳、頁面切換、結算、抽取、圖鑑

// ---- 頁面切換 ----
const navBtns = document.querySelectorAll('.nav-btn');
const pages = {
  home: document.getElementById('page-home'),
  growth: document.getElementById('page-growth'),
  collection: document.getElementById('page-collection'),
  friends: document.getElementById('page-friends'),
  leaderboard: document.getElementById('page-leaderboard')
};

function switchPage(pageId) {
  // 隱藏所有頁面
  document.querySelectorAll('.lobby-page').forEach(p => p.classList.remove('active'));
  // 顯示目標頁面
  const target = document.getElementById(pageId);
  if (target) target.classList.add('active');
  // 更新底部導航高亮
  navBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === pageId);
  });
  // 切換到特定頁面時載入資料
  if (pageId === 'page-leaderboard') loadLeaderboard();
  if (pageId === 'page-friends') {
  loadPendingRequests();
  renderFriends();
  }
  if (pageId === 'page-collection') renderCollection();
  if (pageId === 'page-growth') renderLobby(); // 更新升級與精華顯示
}

async function loadPendingRequests() {
  try {
    const requests = await getPendingRequests();
    PlayerData.pendingRequests = requests;
    savePlayerData();
  } catch (e) {
    // 雲端讀取失敗，使用本地資料
  }
}

// 綁定底部導航事件
navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    switchPage(btn.dataset.page);
  });
});

// ---- 設定彈窗 ----
const settingsOverlay = document.getElementById('settings-overlay');
const settingsBtn = document.getElementById('settings-btn');
const settingsCloseBtn = document.getElementById('settings-close-btn');

function openSettings() {
  settingsOverlay.style.display = 'flex';
  // 更新存檔代碼顯示
  document.getElementById('save-code-display').textContent = PlayerData.saveCode || '無';
  document.getElementById('player-name-input').value = PlayerData.playerName || '';
}

function savePlayerName() {
  const input = document.getElementById('player-name-input');
  const newName = input.value.trim().substring(0, 8);
  if (newName) {
    PlayerData.playerName = newName;
    savePlayerData();
    syncToCloud().catch(() => {});
    renderLobby();
    alert('✅ 名稱已更新！');
  }
}

function closeSettings() {
  settingsOverlay.style.display = 'none';
}

settingsBtn.addEventListener('click', openSettings);
settingsCloseBtn.addEventListener('click', closeSettings);
settingsOverlay.addEventListener('click', (e) => {
  if (e.target === settingsOverlay) closeSettings();
});

// 複製代碼
document.getElementById('copy-code-btn').addEventListener('click', () => {
  const code = document.getElementById('save-code-display').textContent;
  if (code && code !== '無') {
    navigator.clipboard.writeText(code).then(() => {
      alert('✅ 代碼已複製！');
    }).catch(() => {
      // 降級方案
      const input = document.createElement('input');
      input.value = code;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      alert('✅ 代碼已複製！');
    });
  }
});

// ---- 還原存檔 ----
document.getElementById('restore-code-btn').addEventListener('click', async () => {
  const code = document.getElementById('restore-code-input').value.trim().toUpperCase();
  if (!code) return;
  const success = await restoreFromCloud(code);
  if (success) {
    alert('✅ 進度已還原！');
    renderLobby();
    document.getElementById('restore-code-input').value = '';
  } else {
    alert('❌ 找不到這組代碼');
  }
});
document.getElementById('save-name-btn').addEventListener('click', savePlayerName);

document.getElementById('copy-friend-code-btn').addEventListener('click', () => {
  const code = PlayerData.friendCode;
  if (code) {
    navigator.clipboard.writeText(code).then(() => {
      alert('✅ 好友碼已複製！');
    }).catch(() => {
      // 降級方案
      const input = document.createElement('input');
      input.value = code;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      alert('✅ 好友碼已複製！');
    });
  }
});

// ---- renderLobby：升級 + 精華顯示 ----
function renderLobby() {
  // 更新首頁資訊
    document.getElementById('home-player-name').textContent = PlayerData.playerName || '玩家';
    document.getElementById('home-maxwave').textContent = PlayerData.maxWaveRecord;
    document.getElementById('home-stardust').textContent = PlayerData.starDust;
    document.getElementById('home-essence').textContent = PlayerData.essence;

    // 更新頂部資訊列
    document.getElementById('lobby-player-name').textContent = PlayerData.playerName || '玩家';
    document.getElementById('lobby-maxwave').textContent = PlayerData.maxWaveRecord;
    document.getElementById('lobby-stardust').textContent = PlayerData.starDust;
    document.getElementById('lobby-essence').textContent = PlayerData.essence;

  // 更新抽取區的精華顯示
  document.getElementById('draw-essence-display').textContent = PlayerData.essence;

  // 更新配方數量
  const totalRecipes = CONFIG.EVOLUTION_RECIPES.length;
  const ownedCount = Object.keys(PlayerData.unlockedRecipes).filter(k => PlayerData.unlockedRecipes[k]).length;
  document.getElementById('home-recipe-count-num').textContent = ownedCount;
  document.getElementById('home-recipe-total').textContent = totalRecipes;

  // 生成升級按鈕
  const upgradeContainer = document.getElementById('lobby-upgrades');
  upgradeContainer.innerHTML = '';
  for (let key in CONFIG.PERMANENT_UPGRADES) {
    const def = CONFIG.PERMANENT_UPGRADES[key];
    const currentLevel = getUpgradeLevel(key);
    const isMax = currentLevel >= def.levels.length - 1;
    const nextLevel = isMax ? currentLevel : currentLevel + 1;
    const cost = isMax ? '-' : def.levels[nextLevel].cost;
    const value = def.levels[currentLevel].value;

    const btn = document.createElement('button');
    btn.textContent = `${def.name} Lv.${currentLevel + 1} (${value}) - ${isMax ? 'MAX' : '💫' + cost}`;
    btn.disabled = isMax || PlayerData.starDust < cost;
    btn.addEventListener('click', () => {
      if (buyUpgrade(key)) {
        syncToCloud().catch(() => {});
        renderLobby();
      }
    });
    upgradeContainer.appendChild(btn);
  }
}

// ---- 抽取配方 ----
document.getElementById('draw-recipe-btn').addEventListener('click', () => {
  const recipe = drawRecipe();
  const resultDiv = document.getElementById('draw-result');
  if (!recipe) {
    resultDiv.textContent = '✨ 精華不足！';
    resultDiv.style.color = '#e74c3c';
  } else if (PlayerData.unlockedRecipes[recipe.id]) {
  resultDiv.textContent = `🔁 已擁有！獲得 ${recipe.name} 碎片 +${CONFIG.DUPLICATE_FRAGMENTS[recipe.tier]}`;
  resultDiv.style.color = '#f39c12';
} else {
  resultDiv.textContent = `🎉 解鎖新配方：${recipe.name}！`;
  resultDiv.style.color = '#2ecc71';
}
  renderLobby();
});

// ---- drawRecipe（從 storage.js 搬過來，確保可用） ----
function drawRecipe() {
  if (PlayerData.essence < CONFIG.DRAW_COST) return null;

  const tiers = Object.entries(CONFIG.RECIPE_TIERS);
  const totalWeight = tiers.reduce((sum, [, t]) => sum + t.weight, 0);
  let roll = Math.random() * totalWeight;
  let selectedTier = null;
  for (const [tierKey, tierData] of tiers) {
    roll -= tierData.weight;
    if (roll <= 0) { selectedTier = tierKey; break; }
  }

  const pool = CONFIG.EVOLUTION_RECIPES.filter(r => r.tier === selectedTier);
  if (pool.length === 0) return null;
  const recipe = pool[Math.floor(Math.random() * pool.length)];

  PlayerData.essence -= CONFIG.DRAW_COST;

  if (PlayerData.unlockedRecipes[recipe.id]) {
    const fragments = CONFIG.DUPLICATE_FRAGMENTS[selectedTier] || 0;
    PlayerData.recipeFragments[recipe.id] = (PlayerData.recipeFragments[recipe.id] || 0) + fragments;
  } else {
    PlayerData.unlockedRecipes[recipe.id] = true;
    PlayerData.recipeLevels[recipe.id] = 1;
    PlayerData.recipeFragments[recipe.id] = 0;
  }

  savePlayerData();
  syncToCloud().catch(() => {});
  return recipe;
}
// ---- renderCollection：圖鑑（點擊卡片彈窗） ----
let collectionFilter = 'all';

function renderCollection() {
  // 確保標籤列存在
  let tabsContainer = document.getElementById('collection-tabs');
  if (!tabsContainer) {
    const container = document.getElementById('page-collection');
    const header = container.querySelector('.page-header');
    const tabs = document.createElement('div');
    tabs.id = 'collection-tabs';
    header.after(tabs);
    buildCollectionTabs();
  }

  const list = document.getElementById('collection-list');
  const allRecipes = CONFIG.EVOLUTION_RECIPES;
  let filteredRecipes = allRecipes;
  if (collectionFilter !== 'all') {
    filteredRecipes = allRecipes.filter(r => r.tier === collectionFilter);
  }

  // 更新標籤高亮
  document.querySelectorAll('.collection-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tier === collectionFilter);
  });

  let html = '';
  for (let recipe of filteredRecipes) {
    if (!recipe) return;
    const owned = PlayerData.unlockedRecipes[recipe.id];
    const level = PlayerData.recipeLevels[recipe.id] || 1;
    const fragments = PlayerData.recipeFragments[recipe.id] || 0;
    const tierData = CONFIG.RECIPE_TIERS[recipe.tier];
    const color = tierData ? tierData.color : '#fff';
    const tierName = tierData ? tierData.name : '?';
    const upgradeCosts = CONFIG.UPGRADE_FRAGMENTS[recipe.tier];
    const need = (upgradeCosts && level < upgradeCosts.length) ? upgradeCosts[level] : 0;
    const progressPercent = need > 0 ? Math.min(100, Math.floor((fragments / need) * 100)) : 100;

    // 卡片 HTML
    html += `<div class="recipe-card" data-recipe="${recipe.name}" style="border-left: 4px solid ${color};">`;
    // 左：預覽
    html += `<div class="recipe-preview" style="background:${recipe.result.color}; color:#fff;">`;
    html += `<span>${recipe.result.icon || '?'}</span>`;
    html += `</div>`;
    // 中：名稱/階層/等級
    html += `<div class="recipe-info">`;
    html += `<div class="recipe-name">${owned ? '✅' : '🔒'} ${recipe.name}</div>`;
    html += `<div class="recipe-tier" style="color:${color};">${tierName}</div>`;
    html += `<div class="recipe-level">Lv.${level}</div>`;
    html += `</div>`;
    // 右：血條進度（只對已擁有顯示）
    html += `<div class="recipe-progress-wrapper">`;
    if (owned) {
      if (need === 0) {
        html += `<div class="recipe-progress-bar" style="border-color:#27ae60;">`;
        html += `<div class="recipe-progress-fill" style="width:100%; background:#27ae60;"></div>`;
        html += `<span class="recipe-progress-text" style="color:#2ecc71;">已滿級</span>`;
        html += `</div>`;
      } else {
        html += `<div class="recipe-progress-bar">`;
        html += `<div class="recipe-progress-fill" style="width:${progressPercent}%;"></div>`;
        html += `<span class="recipe-progress-text">${fragments} / ${need}</span>`;
        html += `</div>`;
      }
    } else {
      html += `<div style="font-size:12px; color:#666; padding-top:8px;">未解鎖</div>`;
    }
    html += `</div>`;
    html += `</div>`;
  }
  list.innerHTML = html || '尚無配方';

  // 綁定卡片點擊事件（打開詳情彈窗）
  list.querySelectorAll('.recipe-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // 避免點擊內部按鈕（目前沒有，但保留安全）
      const recipeName = card.dataset.recipe;
      openRecipeDetail(recipeName);
    });
  });
}

// ---- 打開配方詳情彈窗 ----
function openRecipeDetail(recipeName) {
  const recipe = CONFIG.EVOLUTION_RECIPES.find(r => r.name === recipeName);
  if (!recipe) return;

  const effects = CONFIG.RECIPE_UPGRADE_EFFECTS[recipe.id];
  const owned = PlayerData.unlockedRecipes[recipe.id];
  const level = PlayerData.recipeLevels[recipe.id] || 1;
  const fragments = PlayerData.recipeFragments[recipe.id] || 0;
  const tierData = CONFIG.RECIPE_TIERS[recipe.tier];
  const tierColor = tierData ? tierData.color : '#fff';
  const tierName = tierData ? tierData.name : '?';
  const upgradeCosts = CONFIG.UPGRADE_FRAGMENTS[recipe.tier];
  const maxLevel = upgradeCosts ? upgradeCosts.length : 5;
  const need = (upgradeCosts && level < upgradeCosts.length) ? upgradeCosts[level] : 0;
  const progressPercent = need > 0 ? Math.min(100, Math.floor((fragments / need) * 100)) : 100;

  // 填充彈窗內容
  document.getElementById('detail-preview-icon').style.background = recipe.result.color;
  document.getElementById('detail-preview-icon').textContent = recipe.result.icon || '?';
  document.getElementById('detail-title').textContent = recipe.name;
  document.getElementById('detail-tier-badge').textContent = tierName;
  document.getElementById('detail-tier-badge').style.color = tierColor;
  document.getElementById('detail-tier-badge').style.borderColor = tierColor;

  // 描述（取自 config，若無則顯示預設）
  const desc = recipe.description || '一座強大的進化塔。';
  document.getElementById('detail-description').textContent = desc;

// ===== 合成配方 + 屬性面板（左右兩欄） =====
const slotsContainer = document.getElementById('detail-recipe-slots');
slotsContainer.innerHTML = '';
slotsContainer.style.display = 'flex';
slotsContainer.style.gap = '20px';
slotsContainer.style.alignItems = 'flex-start';
slotsContainer.style.flexWrap = 'wrap';

// ---- 左欄：2×2 合成配方 ----
const leftCol = document.createElement('div');
leftCol.style.display = 'grid';
leftCol.style.gridTemplateColumns = '1fr 1fr';
leftCol.style.gap = '6px';
leftCol.style.maxWidth = '160px';
leftCol.style.flexShrink = '0';

const qualityColors = { basic: '#888', standard: '#fff', perfect: '#f1c40f' };
const positionLabels = ['左上', '右上', '左下', '右下'];

for (let i = 0; i < 4; i++) {
  const slot = recipe.slots[i];
  const matCat = CONFIG.MATERIAL_CATEGORIES[slot.category];
  const qColor = qualityColors[slot.quality] || '#888';
  
  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';
  wrapper.style.alignItems = 'center';
  wrapper.style.gap = '2px';
  
  const div = document.createElement('div');
  div.style.width = '44px';
  div.style.height = '44px';
  div.style.borderRadius = '6px';
  div.style.background = matCat.color;
  div.style.border = `2px solid ${qColor}`;
  div.title = `${matCat.name} ${slot.quality}`;
  
  const label = document.createElement('span');
  label.style.fontSize = '9px';
  label.style.color = '#666';
  label.textContent = positionLabels[i];
  
  wrapper.appendChild(div);
  wrapper.appendChild(label);
  leftCol.appendChild(wrapper);
}

// ---- 右欄：屬性面板 ----
const rightCol = document.createElement('div');
rightCol.style.flex = '1';
rightCol.style.minWidth = '140px';
rightCol.style.display = 'flex';
rightCol.style.flexDirection = 'column';
rightCol.style.gap = '4px';
rightCol.style.background = 'rgba(0,0,0,0.2)';
rightCol.style.padding = '10px 14px';
rightCol.style.borderRadius = '10px';
rightCol.style.border = '1px solid rgba(255,255,255,0.04)';

// 計算當前等級的實際數值
const baseResult = recipe.result;
const lvIndex = level - 1;

const dmgMult = effects?.damage?.[lvIndex] ?? 1;
const rngMult = effects?.range?.[lvIndex] ?? 1;
const spdMult = effects?.fireRate?.[lvIndex] ?? 1;

const currentDamage = Math.floor((baseResult.damage || 0) * dmgMult);
const currentRange = Math.floor((baseResult.range || 0) * rngMult);
const currentFireRate = Math.floor((baseResult.fireRate || 999) / spdMult);


// Lv.1 的基礎值（用於計算成長差異）
const baseDmg = Math.floor(baseResult.damage || 0);
const baseRng = Math.floor(baseResult.range || 0);
const baseFireRate = Math.floor(baseResult.fireRate || 999);


const dmgDiff = currentDamage - baseDmg;
const rngDiff = currentRange - baseRng;
const fireRateDiff = currentFireRate - baseFireRate;


// ---- 判斷是否可以升級 ----
const canUpgrade = (need > 0 && fragments >= need);

// ---- 組裝屬性 HTML（統一使用金色） ----
let attrHtml = ''; 

// 傷害
attrHtml += `<div style="display:flex; justify-content:space-between; font-size:13px; color:#ecf0f1;">`;
attrHtml += `<span>⚔️ 傷害</span>`;
attrHtml += `<span style="color:#f1c40f;">${currentDamage}`;
if (canUpgrade && dmgDiff > 0) {
  attrHtml += ` <span style="color:#2ecc71; font-size:11px;">+${dmgDiff}</span>`;
}
attrHtml += `</span></div>`;

// 範圍
attrHtml += `<div style="display:flex; justify-content:space-between; font-size:13px; color:#ecf0f1;">`;
attrHtml += `<span>📏 範圍</span>`;
attrHtml += `<span style="color:#f1c40f;">${currentRange}`;
if (canUpgrade && rngDiff > 0) {
  attrHtml += ` <span style="color:#2ecc71; font-size:11px;">+${rngDiff}</span>`;
}
attrHtml += `</span></div>`;

// 攻速
const attackSpeed = currentFireRate > 0 ? (60 / currentFireRate).toFixed(1) : 'N/A';
const baseSpeed = baseFireRate > 0 ? (60 / baseFireRate).toFixed(1) : 'N/A';
const speedDiff = currentFireRate > 0 && baseFireRate > 0 ? parseFloat((60/currentFireRate - 60/baseFireRate).toFixed(1)) : 0;
attrHtml += `<div style="display:flex; justify-content:space-between; font-size:13px; color:#ecf0f1;">`;
attrHtml += `<span>⚡ 攻速</span>`;
attrHtml += `<span style="color:#f1c40f;">${attackSpeed}/s`;
if (canUpgrade && speedDiff > 0) {
  attrHtml += ` <span style="color:#2ecc71; font-size:11px;">+${speedDiff}</span>`;
}
attrHtml += `</span></div>`;


rightCol.innerHTML = attrHtml;

// ---- 組裝到容器 ----
slotsContainer.appendChild(leftCol);
slotsContainer.appendChild(rightCol);

  // 等級 / 進度（血條）
  document.getElementById('detail-current-level').textContent = `Lv.${level} / ${maxLevel}`;
  const fill = document.getElementById('detail-level-fill');
  const text = document.getElementById('detail-level-text');
  if (need === 0 || level >= maxLevel) {
    fill.style.width = '100%';
    fill.style.background = '#27ae60';
    text.textContent = '已滿級';
  } else {
    fill.style.width = progressPercent + '%';
    fill.style.background = 'linear-gradient(90deg, #3498db, #9b59b6)';
    text.textContent = `${fragments} / ${need}`;
  }
  
    // ===== 升級按鈕（置中） =====
  let existingBtn = document.getElementById('detail-upgrade-btn');
  if (existingBtn) existingBtn.remove();

  if (need > 0 && fragments >= need) {
    const upgradeBtn = document.createElement('button');
    upgradeBtn.id = 'detail-upgrade-btn';
    upgradeBtn.textContent = '⬆️ 升級';
    upgradeBtn.style.display = 'block';
    upgradeBtn.style.margin = '10px auto 0 auto';
    upgradeBtn.style.padding = '8px 32px';
    upgradeBtn.style.fontSize = '14px';
    upgradeBtn.style.fontWeight = 'bold';
    upgradeBtn.style.fontFamily = "'Courier New', monospace";
    upgradeBtn.style.background = 'linear-gradient(135deg, #2980b9, #3498db)';
    upgradeBtn.style.color = '#fff';
    upgradeBtn.style.border = 'none';
    upgradeBtn.style.borderRadius = '10px';
    upgradeBtn.style.cursor = 'pointer';
    upgradeBtn.style.boxShadow = '0 2px 16px rgba(41, 128, 185, 0.3)';
    upgradeBtn.style.transition = 'all 0.2s';
    upgradeBtn.addEventListener('mouseenter', () => {
      upgradeBtn.style.transform = 'scale(1.03)';
    });
    upgradeBtn.addEventListener('mouseleave', () => {
      upgradeBtn.style.transform = 'scale(1)';
    });
    upgradeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      upgradeRecipe(recipeName);
      openRecipeDetail(recipeName);
    });
    
    const progressSection = document.querySelector('.detail-level-progress');
    if (progressSection) {
      progressSection.parentElement.appendChild(upgradeBtn);
    }
  }

  // 升級詳細列表（讀取 config 中的數值與客製化文字）
  const listContainer = document.getElementById('detail-upgrade-list');
  listContainer.innerHTML = '';
  if (effects) {
    for (let lv = 1; lv <= 5; lv++) {
      const idx = lv - 1;
      const dmg = effects.damage ? effects.damage[idx] : 1;
      const rng = effects.range ? effects.range[idx] : 1;
      const spd = effects.fireRate ? effects.fireRate[idx] : 1;
      const gold = effects.goldPerWave ? effects.goldPerWave[idx] : null;
      // 客製化文字（若有）
      const custom = (effects.customDisplay && effects.customDisplay[idx]) ? effects.customDisplay[idx] : null;

      let descText = custom;
      if (!descText) {
        let parts = [];
        if (dmg !== 1) parts.push(`傷害 ×${dmg.toFixed(2)}`);
        if (rng !== 1) parts.push(`範圍 ×${rng.toFixed(2)}`);
        if (spd !== 1) parts.push(`攻速 ×${spd.toFixed(2)}`);
        if (gold !== null && gold !== 1) parts.push(`金幣 ×${gold.toFixed(2)}`);
        descText = parts.length > 0 ? parts.join('、') : '無變化';
      }

      const isCurrent = (lv === level);
      const div = document.createElement('div');
      div.className = 'detail-upgrade-item' + (isCurrent ? ' current' : '');
      div.innerHTML = `<span class="upgrade-lv">Lv${lv}</span><span class="upgrade-desc">${descText}</span>`;
      listContainer.appendChild(div);
    }
  } else {
    listContainer.innerHTML = '<div style="color:#666; font-size:13px;">尚無升級數據</div>';
  }

  // 顯示彈窗
  document.getElementById('recipe-detail-overlay').classList.add('active');
}

// ---- 綁定關閉按鈕（在頁面載入時執行一次） ----
document.getElementById('detail-close-btn').addEventListener('click', closeRecipeDetail);

// 點擊彈窗外層也可以關閉
document.getElementById('recipe-detail-overlay').addEventListener('click', function(e) {
  if (e.target === this) closeRecipeDetail();
});

// ---- 關閉配方詳情彈窗 ----
function closeRecipeDetail() {
  document.getElementById('recipe-detail-overlay').classList.remove('active');
}

// ---- 在 switchPage 中確保圖鑑渲染 ----
// （你原本的 switchPage 已經有呼叫 renderCollection，保持原樣即可）

// ---- 建立圖鑑分類標籤 ----
function buildCollectionTabs() {
  const tabsContainer = document.getElementById('collection-tabs');
  if (!tabsContainer) return;
  
  const tiers = [
    { key: 'all', label: '📋 全部', color: '#ecf0f1' },
    { key: 'common', label: '普通', color: '#ffffff' },
    { key: 'rare', label: '稀有', color: '#3498db' },
    { key: 'epic', label: '史詩', color: '#9b59b6' },
    { key: 'legendary', label: '傳說', color: '#f1c40f' },
    { key: 'mythic', label: '神話', color: '#e74c3c' }
  ];
  
  tabsContainer.innerHTML = '';
  tiers.forEach(tier => {
    const btn = document.createElement('button');
    btn.className = 'collection-tab' + (tier.key === 'all' ? ' active' : '');
    btn.dataset.tier = tier.key;
    if (tier.key !== 'all') {
      btn.innerHTML = `<span class="tab-dot" style="background:${tier.color};"></span>${tier.label}`;
    } else {
      btn.textContent = tier.label;
    }
    btn.addEventListener('click', () => {
      collectionFilter = tier.key;
      renderCollection();
    });
    tabsContainer.appendChild(btn);
  });
}

// ---- 在 switchPage 中觸發圖鑑渲染時確保標籤存在 ----
// 修改 switchPage 函數，在切換到圖鑑頁面時呼叫 renderCollection
// 如果你原本的 switchPage 已經有呼叫 renderCollection，就不需要額外修改

// ---- upgradeRecipe ----
function upgradeRecipe(recipeName) {
  const recipe = CONFIG.EVOLUTION_RECIPES.find(r => r.name === recipeName);
  if (!recipe) return;

  const currentLevel = PlayerData.recipeLevels[recipe.id] || 1;
  const upgradeCosts = CONFIG.UPGRADE_FRAGMENTS[recipe.tier];
  if (!upgradeCosts || currentLevel >= upgradeCosts.length) return;

  const cost = upgradeCosts[currentLevel];
  const fragments = PlayerData.recipeFragments[recipe.id] || 0;

  if (fragments >= cost) {
    PlayerData.recipeFragments[recipe.id] -= cost;
    PlayerData.recipeLevels[recipe.id] = currentLevel + 1;
    savePlayerData();
    syncToCloud().catch(() => {});
    renderCollection();
    renderLobby();
  }
}

// ---- loadLeaderboard：排行榜 ----
async function loadLeaderboard() {
  const list = document.getElementById('leaderboard-list');
  try {
    const top = await getTopPlayers(10);
    if (top.length === 0) {
      list.innerHTML = '尚無紀錄';
      return;
    }
    let html = '';
    top.forEach((p, i) => {
      const isMe = p.friendCode === PlayerData.friendCode;
      const displayName = (p.playerName || '玩家') + ' ' + (p.friendCode || '????');
      html += `<div class="${isMe ? 'highlight' : ''}">`;
      html += `${i + 1}. ${displayName} - 🌊 ${p.maxWaveRecord || 0} 波`;
      if (!isMe && p.friendCode) {
      html += ` <button class="add-friend-from-leaderboard-btn" data-code="${p.friendCode}" title="加好友">➕</button>`;
      }
      html += `</div>`;
    });
    list.innerHTML = html;

    // 綁定加好友按鈕
    list.querySelectorAll('.add-friend-from-leaderboard-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.dataset.code;
        if (addFriend(code)) {
          alert('✅ 已加入好友！');
          renderFriends();
        } else {
          alert('已在好友列表中');
        }
      });
    });
  } catch (e) {
    list.innerHTML = '無法載入排行榜';
  }
}

// ---- renderFriends：好友 ----
async function renderFriends() {
  document.getElementById('my-friend-code').textContent = PlayerData.friendCode || '----';

  const list = document.getElementById('friends-list');
  const friends = getFriends();

  let html = '';

  // ---- 待處理邀請區塊 ----
  const pending = PlayerData.pendingRequests || [];
  if (pending.length > 0) {
    html += `<div style="color:#f1c40f; font-size:14px; margin-bottom:8px;">📩 待處理邀請</div>`;
    for (let req of pending) {
      html += `<div style="display:flex; align-items:center; justify-content:space-between; padding:8px 12px; margin-bottom:6px; background:#1a2a4a; border-radius:8px; border-left:3px solid #f39c12;">`;
      html += `<span>${req.playerName || '玩家'} (${req.friendCode})</span>`;
      html += `<div>`;
      html += `<button class="accept-request-btn" data-code="${req.friendCode}" data-name="${req.playerName}" style="background:#27ae60; color:#fff; border:none; border-radius:4px; padding:4px 10px; cursor:pointer; margin-right:4px;">✅</button>`;
      html += `<button class="reject-request-btn" data-code="${req.friendCode}" style="background:#c0392b; color:#fff; border:none; border-radius:4px; padding:4px 10px; cursor:pointer;">✕</button>`;
      html += `</div></div>`;
    }
    html += `<div style="margin-bottom:12px;"></div>`;
  }

  // ---- 好友列表 ----
  html += `<div style="color:#f1c40f; font-size:14px; margin-bottom:8px;">👥 我的好友</div>`;
  if (friends.length === 0) {
    html += '尚無好友';
  } else {
    for (let code of friends) {
      try {
        const data = await getFriendData(code);
        const displayName = (data?.playerName || '玩家') + ' ' + code;
        html += `<div style="display:flex; align-items:center; justify-content:space-between; padding:8px 12px; margin-bottom:6px; background:#16213e; border-radius:8px;">`;
        html += `<span>${displayName} - 🌊 ${data ? data.maxWaveRecord || 0 : '?'} 波</span>`;
        html += `<button class="remove-friend-btn" data-code="${code}" style="background:#c0392b; color:#fff; border:none; border-radius:4px; padding:4px 10px; cursor:pointer;">✕</button>`;
        html += `</div>`;
      } catch (e) {
        html += `<div style="display:flex; align-items:center; justify-content:space-between; padding:8px 12px; margin-bottom:6px; background:#16213e; border-radius:8px;">${code} - 無法讀取 <button class="remove-friend-btn" data-code="${code}" style="background:#c0392b; color:#fff; border:none; border-radius:4px; padding:4px 10px; cursor:pointer;">✕</button></div>`;
      }
    }
  }

  list.innerHTML = html;

  // 綁定刪除好友按鈕
  list.querySelectorAll('.remove-friend-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      removeFriend(btn.dataset.code);
      renderFriends();
    });
  });

  // 綁定接受邀請按鈕
  list.querySelectorAll('.accept-request-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      acceptFriendRequest(btn.dataset.code, btn.dataset.name);
      renderFriends();
      alert('✅ 已接受好友邀請！');
    });
  });

  // 綁定拒絕邀請按鈕
  list.querySelectorAll('.reject-request-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      rejectFriendRequest(btn.dataset.code);
      renderFriends();
    });
  });
}

// ---- 新增好友 ----
document.getElementById('add-friend-btn').addEventListener('click', () => {
  const code = document.getElementById('add-friend-input').value.trim().toUpperCase();
  if (!code) return;
  if (addFriend(code)) {
    document.getElementById('add-friend-input').value = '';
    renderFriends();
  } else {
    alert('已在好友列表中');
  }
});

// ---- 開始遊戲 ----
document.getElementById('start-game-btn').addEventListener('click', () => {
  gold = getUpgradeValue('startGold');
  enemies = [];
  towers = [];
  projectiles = [];
  wave = 0;
  spawnQueue = [];
  waveTimer = CONFIG.TIME_BETWEEN_WAVES;
  spawnTimer = 0;
  gameOver = false;
  totalKills = 0;
  bossKills = 0;
  window.diamonds = 0;
  window.bossAlive = false;
  selectedTower = null;
  buildPanelOpen = false;
  draggingTower = null;
  isDragging = false;

  document.getElementById('lobby-screen').style.display = 'none';
  document.getElementById('game-screen').style.display = 'block';
  updateUI();
  gameLoop();
});

// ---- 返回主畫面 ----
document.getElementById('back-to-lobby-btn').addEventListener('click', () => {
  document.getElementById('result-screen').style.display = 'none';
  document.getElementById('lobby-screen').style.display = 'flex';
  renderLobby();
  // 切回首頁
  switchPage('page-home');
});

// ---- endGame：結算 ----
function endGame() {
  const stardust = wave * CONFIG.STARDUST_FORMULA.perWave
    + bossKills * CONFIG.STARDUST_FORMULA.perBoss
    + Math.floor(totalKills / 100) * CONFIG.STARDUST_FORMULA.per100Kills;

  if (wave > PlayerData.maxWaveRecord) {
    PlayerData.maxWaveRecord = wave;
  }
  PlayerData.starDust += stardust;
  PlayerData.totalBossKills += bossKills;
  PlayerData.totalKills += totalKills;
  savePlayerData();
  syncToCloud().catch(() => {});

  document.getElementById('result-wave').textContent = wave;
  document.getElementById('result-kills').textContent = totalKills;
  document.getElementById('result-bosses').textContent = bossKills;
  document.getElementById('result-stardust').textContent = stardust;
  document.getElementById('result-essence').textContent = bossKills * CONFIG.ESSENCE_PER_BOSS;
  document.getElementById('game-screen').style.display = 'none';
  document.getElementById('result-screen').style.display = 'block';
}

// ---- 頁面載入初始化 ----
window.addEventListener('load', () => {
  document.getElementById('lobby-screen').style.display = 'flex';
  renderLobby();
  switchPage('page-home');
});