// ========== 儲存模組（本地 + 雲端預留） ==========

// 玩家永久資料結構
let PlayerData = {
  saveCode: null,
  playerName: '',          // 玩家自訂名稱
  friendCode: null,        // 好友碼（可公開）
  starDust: 0,
  upgrades: {
    startGold: 0,
    damageBonus: 0,
    rareChance: 0
  },
  maxWaveRecord: 0,
  totalBossKills: 0,
  totalKills: 0,
  essence: 0,
  unlockedRecipes: {},     // { '巨型箭塔': true, ... }
  recipeFragments: {},     // { '巨型箭塔': 0, ... }
  recipeLevels: {},         // { '巨型箭塔': 1, ... }
   friends: [],
   pendingRequests: [] 

};

// 嘗試從 localStorage 讀取
function loadPlayerData() {
  try {
    const saved = localStorage.getItem('td_player_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      PlayerData = { ...PlayerData, ...parsed };
      
      // ===== 🆕 自動遷移：將舊版「名稱版」存檔轉為「ID版」 =====
      if (PlayerData.unlockedRecipes) {
        const oldKeys = Object.keys(PlayerData.unlockedRecipes);
        let needsMigration = false;
        
        for (let oldKey of oldKeys) {
          // 檢查這個 key 是不是「名稱」（而不是 ID）
          // 方法：看它是否在 CONFIG 的配方名稱清單中
          const recipeNames = CONFIG.EVOLUTION_RECIPES.map(r => r.name);
          if (recipeNames.includes(oldKey)) {
            // 找到對應的配方 ID
            const matchedRecipe = CONFIG.EVOLUTION_RECIPES.find(r => r.name === oldKey);
            if (matchedRecipe && matchedRecipe.id) {
              // 把舊 key 的資料移到新 id 上
              PlayerData.unlockedRecipes[matchedRecipe.id] = PlayerData.unlockedRecipes[oldKey];
              delete PlayerData.unlockedRecipes[oldKey];
              needsMigration = true;
            }
          }
        }
        
        if (needsMigration) {
          // 順便處理等級和碎片
          for (let recipe of CONFIG.EVOLUTION_RECIPES) {
            const oldName = recipe.name;
            const newId = recipe.id;
            
            if (PlayerData.recipeLevels && PlayerData.recipeLevels[oldName] !== undefined) {
              PlayerData.recipeLevels[newId] = PlayerData.recipeLevels[oldName];
              delete PlayerData.recipeLevels[oldName];
            }
            if (PlayerData.recipeFragments && PlayerData.recipeFragments[oldName] !== undefined) {
              PlayerData.recipeFragments[newId] = PlayerData.recipeFragments[oldName];
              delete PlayerData.recipeFragments[oldName];
            }
          }
          
          savePlayerData(); // 存回 localStorage
          console.log('✅ 存檔已自動升級為 ID 版');
        }
      }
    }
  } catch (e) {
    console.warn('讀取存檔失敗', e);
  }
}

// 儲存到 localStorage
function savePlayerData() {
  try {
    localStorage.setItem('td_player_data', JSON.stringify(PlayerData));
  } catch (e) {
    console.warn('儲存失敗', e);
  }
}

// 產生存檔代碼（6 位英數字）
function generateSaveCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// 產生並儲存存檔代碼
function createSaveCode() {
  if (PlayerData.saveCode) return PlayerData.saveCode;
  const code = generateSaveCode();
  PlayerData.saveCode = code;
  savePlayerData();
  // 自動上傳到雲端（若可用）
  syncToCloud().catch(() => {});
  return code;
}

// 還原存檔代碼（將現有資料掛到新代碼上）
function restoreSaveCode(code) {
  PlayerData.saveCode = code.toUpperCase();
  savePlayerData();
}

// 取得玩家的公開紀錄（用於排行榜）
function getPublicRecord() {
  return {
    saveCode: PlayerData.saveCode,
    playerName: PlayerData.playerName,
    friendCode: PlayerData.friendCode,
    maxWaveRecord: PlayerData.maxWaveRecord,
    totalBossKills: PlayerData.totalBossKills,
    essence: PlayerData.essence,
    starDust: PlayerData.starDust
  };
}

// ---------- 升級相關 ----------

// 取得某個升級的當前等級
function getUpgradeLevel(upgradeKey) {
  return PlayerData.upgrades[upgradeKey] || 0;
}

// 購買升級（返回是否成功）
function buyUpgrade(upgradeKey) {
  const upgradeDef = CONFIG.PERMANENT_UPGRADES[upgradeKey];
  if (!upgradeDef) return false;
  const currentLevel = getUpgradeLevel(upgradeKey);
  if (currentLevel >= upgradeDef.levels.length - 1) return false; // 已滿級
  const nextLevel = currentLevel + 1;
  const cost = upgradeDef.levels[nextLevel].cost;
  if (PlayerData.starDust < cost) return false;
  PlayerData.starDust -= cost;
  PlayerData.upgrades[upgradeKey] = nextLevel;
  savePlayerData();
  return true;
}

// 取得升級效果值（用於遊戲內加成）
function getUpgradeValue(upgradeKey) {
  const upgradeDef = CONFIG.PERMANENT_UPGRADES[upgradeKey];
  if (!upgradeDef) return 0;
  const level = getUpgradeLevel(upgradeKey);
  return upgradeDef.levels[level].value;
}

// ---------- 雲端同步（Firebase 實作）----------

// 產生新存檔代碼並上傳


// 從雲端還原進度
async function restoreFromCloud(code) {
  const data = await downloadSaveData(code);
  if (!data) return false;

  PlayerData = {
    ...PlayerData,            // 保留本地預設結構
    saveCode: code,
    starDust: data.starDust || 0,
    essence: data.essence || 0,
    upgrades: data.upgrades || {},
    unlockedRecipes: data.unlockedRecipes || {},
    recipeFragments: data.recipeFragments || {},
    recipeLevels: data.recipeLevels || {},
    maxWaveRecord: data.maxWaveRecord || 0,
    totalBossKills: data.totalBossKills || 0,
    totalKills: data.totalKills || 0,
    friends: data.friends || []
  };
  savePlayerData();
  return true;
}

// 上傳目前的 PlayerData 到雲端
async function syncToCloud() {
  if (!PlayerData.saveCode) return; // 代碼應已自動產生，若無則跳過
  await uploadSaveData(PlayerData.saveCode, {
  playerName: PlayerData.playerName,
  friendCode: PlayerData.friendCode,
  starDust: PlayerData.starDust,
  essence: PlayerData.essence,
  upgrades: PlayerData.upgrades,
  unlockedRecipes: PlayerData.unlockedRecipes,
  recipeFragments: PlayerData.recipeFragments,
  recipeLevels: PlayerData.recipeLevels,
  maxWaveRecord: PlayerData.maxWaveRecord,
  totalBossKills: PlayerData.totalBossKills,
  totalKills: PlayerData.totalKills,
  friends: PlayerData.friends,
  updatedAt: Date.now()
});
  await uploadLeaderboard(PlayerData.friendCode, {
    playerName: PlayerData.playerName,
    maxWaveRecord: PlayerData.maxWaveRecord,
    friendCode: PlayerData.friendCode, 
    updatedAt: Date.now()
  });
}

// ---------- 好友管理 ----------

// 初始化好友列表
if (!PlayerData.friends) PlayerData.friends = [];

function addFriend(code) {
  code = code.toUpperCase();
  if (code === PlayerData.friendCode) return 'own';           // 不能加自己
  if (PlayerData.friends.includes(code)) return 'already';     // 已是好友
  if (PlayerData.pendingRequests.some(r => r.friendCode === code)) return 'pending'; // 已在待處理

  // 發送邀請到對方的雲端
  sendFriendRequest(code).catch(() => {});
  return 'sent';
}

// 接受好友邀請
function acceptFriendRequest(friendCode, playerName) {
  // 加入自己的好友列表
  if (!PlayerData.friends.includes(friendCode)) {
    PlayerData.friends.push(friendCode);
  }
  // 從待處理列表中移除
  PlayerData.pendingRequests = PlayerData.pendingRequests.filter(r => r.friendCode !== friendCode);
  savePlayerData();

  // 通知對方：把我加入他的好友列表
  acceptFriendRequestOnCloud(friendCode).catch(() => {});
}

// 拒絕好友邀請
function rejectFriendRequest(friendCode) {
  PlayerData.pendingRequests = PlayerData.pendingRequests.filter(r => r.friendCode !== friendCode);
  savePlayerData();
}

function removeFriend(code) {
  const idx = PlayerData.friends.indexOf(code);
  if (idx === -1) return false;
  PlayerData.friends.splice(idx, 1);
  savePlayerData();
  return true;
}

function getFriends() {
  return PlayerData.friends;
}

function generateFriendCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ---------- 初始化 ----------
loadPlayerData();
if (!PlayerData.saveCode) {
  createSaveCode();
}
if (!PlayerData.friendCode) {
  PlayerData.friendCode = generateFriendCode();
  savePlayerData();
}
if (!PlayerData.playerName) {
  PlayerData.playerName = '玩家' + PlayerData.friendCode;
  savePlayerData();
}
