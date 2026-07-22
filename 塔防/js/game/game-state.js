// ========== game-state.js ==========
// Canvas、UI 元素、遊戲狀態變數

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const goldDisplay = document.getElementById('gold-display');
const livesDisplay = document.getElementById('lives-display');
const waveDisplay = document.getElementById('wave-display');

const SMALL_SLOTS = getAllSmallSlotCenters();

let gold = CONFIG.START_GOLD;
let enemies = [];
let towers = [];
let wave = 0;
let spawnQueue = [];
let waveTimer = CONFIG.TIME_BETWEEN_WAVES;
let spawnTimer = 0;
let gameOver = false;
let totalKills = 0;
let bossKills = 0;
window.diamonds = 0;
window.bossAlive = false;

let selectedTower = null;
let buildPanelOpen = false;
let buildSlot = null;

let mouseX = 0, mouseY = 0;
let mouseOnSlot = null;
let draggingTower = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let isDragging = false;
let mouseDownX = 0, mouseDownY = 0;