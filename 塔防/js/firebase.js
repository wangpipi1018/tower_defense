// ========== Firebase 封裝層 ==========


const firebaseConfig = {
  apiKey: "AIzaSyCGLrSYtEUwGBdDMkfYrEQ6cJQDmv50Go0",
  authDomain: "tower-defense-190aa.firebaseapp.com",
  databaseURL: "https://tower-defense-190aa-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tower-defense-190aa",
  storageBucket: "tower-defense-190aa.firebasestorage.app",
  messagingSenderId: "1016899335954",
  appId: "1:1016899335954:web:92dceaae4484bd3b38a5cb"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ---------- 存檔代碼相關 ----------

async function checkCodeExists(code) {
  const snap = await db.ref('saves/' + code).once('value');
  return snap.exists();
}

async function uploadSaveData(code, data) {
  await db.ref('saves/' + code).set({
    ...data,
    updatedAt: Date.now()
  });
}

async function downloadSaveData(code) {
  const snap = await db.ref('saves/' + code).once('value');
  if (!snap.exists()) return null;
  return snap.val();
}

// ---------- 排行榜相關 ----------

async function uploadLeaderboard(code, data) {
  await db.ref('leaderboard/' + code).set({
    ...data,
    updatedAt: Date.now()
  });
}

async function getTopPlayers(n = 10) {
  const snap = await db.ref('leaderboard').orderByChild('maxWaveRecord').limitToLast(n).once('value');
  const result = [];
  snap.forEach(child => {
    result.unshift({ code: child.key, ...child.val() });
  });
  return result;
}

// ---------- 好友相關 ----------

async function getFriendData(code) {
  const snap = await db.ref('leaderboard/' + code).once('value');
  if (!snap.exists()) return null;
  return snap.val();
}

async function sendFriendRequest(targetFriendCode) {
  // 在自己的雲端資料中加入 pending
  const myData = {
    friendCode: PlayerData.friendCode,
    playerName: PlayerData.playerName
  };
  // 儲存到對方的 pendingRequests 中
  await db.ref('pending/' + targetFriendCode + '/' + PlayerData.friendCode).set(myData);
}

async function acceptFriendRequestOnCloud(friendCode) {
  // 移除 pending 中的邀請
  await db.ref('pending/' + PlayerData.friendCode + '/' + friendCode).remove();
  // 可以選擇通知對方（非必須）
}

async function getPendingRequests() {
  const snap = await db.ref('pending/' + PlayerData.friendCode).once('value');
  if (!snap.exists()) return [];
  const result = [];
  snap.forEach(child => {
    result.push(child.val());
  });
  return result;
}