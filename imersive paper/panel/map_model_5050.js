document.addEventListener('DOMContentLoaded', function () {
  // 動態引入 CSS
  const cssLink = document.createElement('link');
  cssLink.rel = 'stylesheet';
  cssLink.href = './panel/map_model_5050_style.css';
  document.head.appendChild(cssLink);

  // 其他邏輯
  const clickableBox = document.getElementById('clickable-box-5050');
  const solutionDropdown = document.getElementById('solution-5050');
  const statusBar = document.getElementById('status-bar-5050');
  const gbestDisplay = document.getElementById('gbest-5050');
  const mapCheck = document.getElementById('map-check-5050');
  // 讀檔功能
  const fileInput = document.getElementById('file-input');
  // 看threshold功能
  const thresholdBtn = document.getElementById('threshold-btn-5050');
  // 連線功能
  const connectBtn = document.getElementById('connect-btn-5050');
  //播放暫停
  const playPauseBtn = document.getElementById('play-pause-btn-5050');
  // 獲取進度條和顯示的元素
  const generationSlider = document.getElementById('generation-slider-5050');
  const currentGenerationDisplay = document.getElementById('current-generation-5050');
  // 加減速功能
  const speedUpBtn = document.getElementById('speed-up-btn');
  const speedDownBtn = document.getElementById('speed-down-btn');
  const speedDisplay = document.getElementById('speed-display');


  let sensorCount = 0; // 追蹤 sensor 的總數量
  let gridSize = 50; // 初始 Grid 大小
  let mapSize = 50;
  let sensingRange = 5; // 預設感測範圍
  let connectDistance = 8; // 預設連線距離
  let limitThreshold = []; // 儲存 threshold 資訊
  let generations = {}; // 儲存每一代的感測器位置
  const sensors = []; // 儲存所有 sensor 位置
  let probabilitiesCache = null; // 儲存機率狀態

  //初始sensor擺放位置
  const sensorLayouts = {
    1: [{ x: 10, y: 0 }, { x: 18, y: 0 }, { x: 36, y: 1 }, { x: 2, y: 2 }, { x: 22, y: 2 }, { x: 29, y: 2 }, { x: 42, y: 2 }, { x: 48, y: 3 }, { x: 15, y: 6 }, { x: 9, y: 7 }, { x: 2, y: 9 }, { x: 22, y: 9 }, { x: 34, y: 9 }, { x: 27, y: 10 }, { x: 40, y: 10 }, { x: 47, y: 10 }, { x: 16, y: 13 }, { x: 9, y: 14 }, { x: 25, y: 15 }, { x: 2, y: 16 }, { x: 33, y: 16 }, { x: 24, y: 17 }, { x: 32, y: 17 }, { x: 40, y: 17 }, { x: 47, y: 17 }, { x: 17, y: 19 }, { x: 9, y: 21 }, { x: 38, y: 22 }, { x: 1, y: 23 }, { x: 46, y: 23 }, { x: 24, y: 24 }, { x: 30, y: 24 }, { x: 16, y: 26 }, { x: 8, y: 28 }, { x: 38, y: 28 }, { x: 46, y: 29 }, { x: 0, y: 30 }, { x: 30, y: 30 }, { x: 23, y: 31 }, { x: 15, y: 33 }, { x: 39, y: 33 }, { x: 7, y: 34 }, { x: 32, y: 35 }, { x: 46, y: 35 }, { x: 2, y: 38 }, { x: 17, y: 38 }, { x: 24, y: 38 }, { x: 10, y: 39 }, { x: 31, y: 39 }, { x: 39, y: 40 }, { x: 46, y: 41 }, { x: 4, y: 42 }, { x: 24, y: 45 }, { x: 6, y: 46 }, { x: 15, y: 46 }, { x: 19, y: 46 }, { x: 28, y: 46 }, { x: 34, y: 46 }, { x: 2, y: 47 }, { x: 9, y: 47 }, { x: 40, y: 47 }, { x: 47, y: 47 }], // 50 × 50 找到的最佳解
    2: [{ x: 2, y: 2 }] // 50 × 50 測試用初始解
  };

  // 根據 Threshold 統一顯示顏色，這裡設置 threshold = 0.3
  const threshold = 0.3;

  //功能按鈕
  // 判斷是否為 Threshold 模式
  let isThresholdMode = false; 
  // 判斷是否處於 Connect 模式
  let isConnectMode = false; 
  let connectionLines = []; // 儲存所有連線元素
  // 判斷是否處於播放狀態
  let isPlaying = false; 
  let currentGeneration = 0; // 當前播放的代數
  let playInterval; // 播放的計時器
  // 初始化進度條的最大值
  generationSlider.max = Object.keys(generations).length;
  // 加減速功能變數
  let playbackSpeed = 1; // 默認速度倍率
  const maxSpeed = 4; // 最大速度倍率
  const minSpeed = 1; // 最小速度倍率

  // 清空狀態條內部
  statusBar.innerHTML = '';
  // 生成 0~1 的刻度，每間隔 0.1
  for (let i = 0; i <= 10; i++) {
    const value = (1 - i / 10).toFixed(1); // 倒序顯示 1 -> 0

    // 刻度線
    const scaleLine = document.createElement('div');
    scaleLine.classList.add('scale-line');
    scaleLine.style.top = `${(i / 10) * 100}%`;

    // 刻度數字
    const scaleText = document.createElement('div');
    scaleText.classList.add('status-bar-scale');
    scaleText.style.top = `${(i / 10) * 100}%`;
    scaleText.textContent = value;

    // 添加到狀態條
    statusBar.appendChild(scaleLine);
    statusBar.appendChild(scaleText);
  }

  // 包装 clickableBox 与 x/y 轴
  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.display = 'inline-block';

  // 创建 X 和 Y 轴容器
  const xAxis = document.createElement('div');
  xAxis.id = 'x-axis-5050';
  xAxis.style.position = 'absolute';
  xAxis.style.top = '-20px'; // X 軸應該在 clickableBox 下方對齊
  xAxis.style.left = '-5px'; // 對齊 clickableBox 左側
  xAxis.style.width = `${gridSize * 30}px`; // 動態寬度：格子數量 * 格子大小
  xAxis.style.display = 'grid';
  xAxis.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`; // 每個格子一個區間

  const yAxis = document.createElement('div');
  yAxis.id = 'y-axis-5050';
  yAxis.style.position = 'absolute';
  yAxis.style.top = '0'; // 與 clickableBox 頂部對齊
  yAxis.style.left = '-20'; // 在 clickableBox 左側
  yAxis.style.height = `${gridSize * 30}px`; // 動態高度：格子數量 * 格子大小
  yAxis.style.display = 'grid';
  yAxis.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`; // 每個格子一個區間

  // 添加 X 和 Y 轴容器到父级容器
  container.appendChild(clickableBox);
  container.appendChild(xAxis);
  container.appendChild(yAxis);

  // 将容器插入页面
  document.querySelector('.interactive-panel-5050').prepend(container);

  // 滑鼠事件
  const tooltip = document.createElement('div');
  tooltip.id = 'tooltip';
  tooltip.style.position = 'absolute';
  tooltip.style.display = 'none'; // 預設不顯示
  tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  tooltip.style.color = 'white';
  tooltip.style.padding = '5px 10px';
  tooltip.style.borderRadius = '5px';
  tooltip.style.fontSize = '12px';
  tooltip.style.pointerEvents = 'none'; // 防止 tooltip 擋到滑鼠事件
  document.body.appendChild(tooltip);

  // QTS優化後的epin檔
  const fileContent = `
  Map :
  50x50
  Sensing_range : 5
  Connect : 8
  Limit :
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3
  Generation :
  *1 []
  *2 [{ x: 2, y: 2 }]
  *3 [{ x: 2, y: 2 },{ x: 2, y: 7 }]
  *4 [{ x: 2, y: 2 },{ x: 2, y: 7 },{ x: 2, y: 12 }]
  *5 [{ x: 2, y: 2 },{ x: 2, y: 7 },{ x: 2, y: 12 },{ x: 2, y: 17 }]
  *6 [{ x: 2, y: 2 },{ x: 2, y: 7 },{ x: 2, y: 12 },{ x: 2, y: 17 },{ x: 2, y: 22 }]
  *7 [{ x: 2, y: 2 },{ x: 2, y: 7 },{ x: 2, y: 12 },{ x: 2, y: 17 },{ x: 2, y: 22 },{ x: 2, y: 27 }]
  `;

  // 生成每個格子
  function renderGrid(size, layout = []) {
    clickableBox.innerHTML = ''; // 清空原本內容
    clickableBox.style.display = 'grid';
    clickableBox.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    clickableBox.style.gridTemplateRows = `repeat(${size}, 1fr)`;
  
    // 計算每個格子的大小
    const boxSize = 600; // 黑色框框大小 (已在CSS固定300px)
    const cellSize = Math.floor(boxSize / size);
    const cells = []; // 儲存格子狀態

    // 渲染轴标签
    renderAxes(size);

    // 清空 sensors 與計數
    sensors.length = 0;
    sensorCount = 0;
    gbestDisplay.textContent = `Sensor Count: ${sensorCount}`;

    // 生成格子
    for (let i = 0; i < size * size; i++) {
      const cell = document.createElement('div');
      cell.classList.add('grid-cell');
      cell.dataset.index = i; // 設置格子索引
      cell.style.backgroundColor = 'rgb(0, 45, 255)'; // 預設為深藍色
      cells[i] = false; // 初始狀態：沒有 sensor

      const x = i % size;
      const y = Math.floor(i / size);

      // 檢查是否需要擺放初始 sensor
      const isSensor = layout.some(sensor => sensor.x === x && sensor.y === y);
      if (isSensor) {
        cell.classList.add('sensor');
        sensors.push({ x, y });
        sensorCount++;
      }

      // 點擊事件：添加/移除 sensor
      cell.addEventListener('click', function () {
        // 點擊邏輯：添加/移除 sensor
        if (cell.classList.contains('sensor')) {
          cell.classList.remove('sensor');
          sensors.splice(sensors.findIndex(s => s.x === x && s.y === y), 1);
          sensorCount--;
        } else {
          cell.classList.add('sensor');
          sensors.push({ x, y });
          sensorCount++;
        }

        // 更新 Gbest 顯示
        gbestDisplay.textContent = `${sensorCount}`;
        calculateDetectionProbability(size, sensors, clickableBox);

        // 自動更新連線
        if (isConnectMode) {
          connectSensors();
        }
      });
      // 滑鼠靠近時顯示 Tooltip
      cell.addEventListener('mousemove', function (e) {
        const probability = cell.dataset.probability || 0; // 取得當前機率
        // 計算當前格子的 threshold 值
        let currentThreshold = 0.3; // 預設值
        if (limitThreshold && limitThreshold[y] && limitThreshold[y][x] !== undefined) {
          currentThreshold = limitThreshold[y][x]; // 從 limitThreshold 中取得對應值
        }
      
        // 更新 Tooltip 內容
        tooltip.innerHTML = `
          Row: ${x+1}, Column: ${y+1}<br>
          Detection Probability: ${parseFloat(probability).toFixed(3)}<br>
          Threshold: ${currentThreshold.toFixed(2)}
        `;
      
        // 設置 Tooltip 位置（滑鼠右上角）
        tooltip.style.left = `${e.pageX + 10}px`;
        tooltip.style.top = `${e.pageY - 10}px`;
        tooltip.style.display = 'block';
      });
      // 滑鼠離開時隱藏 Tooltip
      cell.addEventListener('mouseleave', function () {
        tooltip.style.display = 'none';
      });

      clickableBox.appendChild(cell);
    }
    gbestDisplay.textContent = `${sensorCount}`;
    calculateDetectionProbability(size, sensors, clickableBox);
    // 如果處於連線模式，自動觸發連線功能
    if (isConnectMode) {
      connectSensors();
    }
    // 更新進度條的generation
    generationSlider.max = Object.keys(generations).length;
    updateProgressBar(0); // 同步更新進度條
  }
  // 生成xy軸標籤
  function renderAxes(gridSize) {
    // 獲取 clickableBox 的寬度和高度
    let boxWidth = clickableBox.offsetWidth - 8;
    let boxHeight = clickableBox.offsetHeight - 8;
    // 計算每個格子的大小
    if(boxWidth === -8) boxWidth = 600 - 8;
    if(boxHeight === -8) boxHeight = 600 - 8;
    const cellWidth = boxWidth / gridSize;
    const cellHeight = boxHeight / gridSize;

    let fontSize = Math.min(cellWidth, cellHeight) * 0.7; // 字體大小為格子大小的 70%

    // 清空 X 和 Y 軸內容
    xAxis.innerHTML = '';
    yAxis.innerHTML = '';

    // 生成 X 軸標籤（從左到右）
    for (let i = 0; i < gridSize; i++) {
      const label = document.createElement('div');
      label.style.position = 'absolute';
      label.style.top = `5px`; // 固定在網格正下方
      label.style.left = `${8 + i * cellWidth}px`; // 動態計算每個標籤的位置
      label.style.width = `${cellWidth}px`;
      label.style.textAlign = 'center';
      label.style.fontSize = `${fontSize}px`; // 動態設置字體大小

      // 每 5 格顯示一次標籤
      if (i % 5 === 0) {
        label.textContent = i + 1; // 從 1 開始
      } else {
        label.textContent = ''; // 中間不顯示
      }

      xAxis.appendChild(label);
    }

    // 生成 Y 軸標籤（從上到下）
    for (let i = 0; i < gridSize; i++) {
      const label = document.createElement('div');
      label.style.position = 'absolute';
      label.style.top = `${4 + i * cellHeight}px`; // 動態計算每個標籤的位置
      label.style.left = `20px`; // 固定在 clickableBox 左側
      label.style.height = `${cellHeight}px`;
      label.style.textAlign = 'right';
      label.style.fontSize = `${fontSize}px`; // 動態設置字體大小
      label.style.lineHeight = `${cellHeight}px`; // 垂直置中

      // 每 5 格顯示一次標籤
      if (i % 5 === 0) {
        label.textContent = i + 1; // 從 1 開始
      } else {
        label.textContent = ''; // 中間不顯示
      }

      yAxis.appendChild(label);
    }
  }
  // 依據世代數，更新格子資訊
  function updateGrid(generationData) {
    // 1. 清空現有的感測器標記
    sensors.length = 0;
    sensorCount = 0;
    const cells = clickableBox.childNodes;
    cells.forEach(cell => {
      cell.classList.remove('sensor'); // 移除感測器標記
      cell.style.backgroundColor = 'rgb(0, 45, 255)'; // 恢復預設顏色
      cell.classList.remove('dissatisfy'); // 移除不滿足標記
      cell.dataset.probability = 0; // 重置機率
    });
  
    // 2. 根據 generationData 更新感測器位置
    generationData.forEach(sensor => {
      const index = sensor.y * gridSize + sensor.x; // 計算格子索引
      const cell = cells[index];
      cell.classList.add('sensor'); // 標記為感測器
      sensorCount++;
      sensors.push(sensor);
      cell.style.backgroundColor = 'black'; // 更新顏色
    });

    // 更新 Gbest 顯示
    gbestDisplay.textContent = `${sensorCount}`;
    calculateDetectionProbability(gridSize, sensors, clickableBox);
  }
  // 計算map的偵測機率
  function calculateDetectionProbability(gridSize, sensors, grid) {
    // 初始化所有格子的機率為 0
    const probabilities = Array(gridSize * gridSize).fill(0);
  
    
    sensors.forEach(sensor => {
      const sensorX = sensor.x;
      const sensorY = sensor.y;
  
      for (let dx = -sensingRange; dx <= sensingRange; dx++) {
        for (let dy = -sensingRange; dy <= sensingRange; dy++) {
          const distance = Math.sqrt(dx * dx + dy * dy); // 計算歐幾里得距離
          if (distance > sensingRange || distance === 0) continue; // 超出範圍或自身略過
  
          const prob = 1 / distance; // 偵測機率是距離的倒數
          const targetX = sensorX + dx;
          const targetY = sensorY + dy;
  
          if (targetX >= 0 && targetX < gridSize && targetY >= 0 && targetY < gridSize) {
            const index = targetY * gridSize + targetX;
            probabilities[index] = 1 - (1 - probabilities[index]) * (1 - prob); // 疊加公式
          }
        }
      }
    });

    // 將放置 sensor 的格子機率設為 1
    grid.childNodes.forEach((cell, index) => {
      const x = index % gridSize;
      const y = Math.floor(index / gridSize);

      const isSensor = sensors.some(sensor => sensor.x === x && sensor.y === y);
      if (isSensor) {
        probabilities[index] = 1; // 強制設為 1
      }

      // 儲存機率到格子 dataset
      cell.dataset.probability = probabilities[index];
    });
  
    probabilitiesCache = probabilities; // 更新 cache
    applyProbabilitiesToGrid(probabilities, grid);

    // 更新完成率
    const completionRate = calculateCompletionRate(grid);
    mapCheck.textContent = `${completionRate}% Completed`;
  }
  // 更新格子的狀態
  function applyProbabilitiesToGrid(probabilities, grid) {
    let currentThreshold = threshold; // 預設為 0.3

    // 過濾出所有格子，排除連線等其他元素
    const cells = Array.from(grid.childNodes).filter(cell => cell.classList.contains('grid-cell'));

    // 根據機率更新格子顏色
    cells.forEach((cell, index) => {
      const rows = Math.sqrt(cells.length); // 假設 grid 為正方形
      const row = Math.floor(index / rows); // 計算該格子的行號
      const col = index % rows; // 計算該格子的列號

      // 如果有檔案中的 limitThreshold，取對應的值
      if (limitThreshold && limitThreshold[row] && limitThreshold[row][col] !== undefined) {
        currentThreshold = limitThreshold[row][col];
      }
      // 更新格子樣式
      if (cell.classList.contains('sensor')) {
        // 如果是 sensor，顏色保持黑色
        cell.style.backgroundColor = 'black';
        cell.classList.remove('dissatisfy'); // 移除紅色斜線
      } else {
        const probability = probabilities[index];
        cell.dataset.probability = probability; // 儲存機率

        if (probability > currentThreshold) {
          // 機率大於 Threshold，顯示機率顏色
          cell.style.backgroundColor = getColorFromProbability(probability);
          cell.classList.remove('dissatisfy'); // 移除紅色斜線
        } else {
          if (!isThresholdMode) {
            // 非 Threshold 模式時，顯示機率顏色
            cell.style.backgroundColor = getColorFromProbability(probability);
          } else {
            // 機率小於等於 Threshold，顯示 Threshold 顏色並加紅色斜線
            cell.style.backgroundColor = lightenColor(getColorFromProbability(currentThreshold), 0.6);
          }
          cell.classList.add('dissatisfy'); // 添加紅色斜線
        }
      }
    });
  }
  // 更新 getColorFromProbability 函數
  function getColorFromProbability(prob) {
    const colors = [
      { stop: 0.0, r: 0, g: 45, b: 255 },     // 深藍色
      { stop: 0.2, r: 0, g: 95, b: 255 },     // 藍色
      { stop: 0.33, r: 0, g: 255, b: 255 },    // 淺藍色
      { stop: 0.4, r: 0, g: 255, b: 130 },    // 藍綠色
      { stop: 0.45, r: 84, g: 255, b: 0 },     // 綠色
      { stop: 0.55, r: 255, g: 255, b: 0 },    // 黃色
      { stop: 0.7, r: 255, g: 125, b: 0 },    // 橘色
      { stop: 0.8, r: 255, g: 29, b: 0 },     // 橘紅色
      { stop: 0.9, r: 234, g: 0, b: 0 },      // 紅色
      { stop: 1.0, r: 198, g: 0, b: 0 }       // 深紅色
    ];

    // 遍歷顏色區間，找到當前機率所在範圍
    for (let i = 0; i < colors.length - 1; i++) {
      const start = colors[i];
      const end = colors[i + 1];

      if (prob >= start.stop && prob <= end.stop) {
        const ratio = (prob - start.stop) / (end.stop - start.stop); // 計算插值比例

        // 線性插值計算 RGB 值
        const r = Math.floor(start.r + ratio * (end.r - start.r));
        const g = Math.floor(start.g + ratio * (end.g - start.g));
        const b = Math.floor(start.b + ratio * (end.b - start.b));

        return `rgb(${r}, ${g}, ${b})`;
      }
    }

    return `rgb(0, 45, 255)`; // 預設返回深藍色
  }
  // 機率小於Threshold，顯示淡色
  function lightenColor(color, factor) {
    // 假設 color 是 RGB 格式，例如 "rgb(255, 0, 0)"
    const colorValues = color.match(/\d+/g).map(Number); // 提取 RGB 值
    const [r, g, b] = colorValues;
  
    // 根據 factor 計算變淡的顏色
    const newR = Math.min(255, r + (255 - r) * factor);
    const newG = Math.min(255, g + (255 - g) * factor);
    const newB = Math.min(255, b + (255 - b) * factor);
  
    return `rgb(${Math.round(newR)}, ${Math.round(newG)}, ${Math.round(newB)})`;
  }
  // 計算完成率
  function calculateCompletionRate(grid) {
    // 過濾出所有格子元素，排除連線元素
    const cells = Array.from(grid.childNodes).filter(cell => cell.classList.contains('grid-cell'));

    const totalCells = cells.length; // 格子總數
    let nonDissatisfyCount = 0;
  
    // 遍歷所有格子，計算非 dissatisfy 的數量
    grid.childNodes.forEach(cell => {
      if (!cell.classList.contains('dissatisfy')) {
        nonDissatisfyCount++;
      }
    });
  
    // 計算完成率並返回百分比
    const completionRate = ((nonDissatisfyCount / totalCells) * 100).toFixed(2); // 保留兩位小數
    return completionRate; // 保證寬度一致
  }
  // 繪製連線
  function connectSensors() {
    clearConnections(); // 確保連線不重疊

    const cellSize = (clickableBox.offsetWidth-8) / gridSize; // 計算每個格子的大小

    sensors.forEach((sensorA, indexA) => {
      sensors.forEach((sensorB, indexB) => {
        if (indexA >= indexB) return; // 避免重複計算或自連

        const distance = Math.sqrt(
          Math.pow(sensorA.x - sensorB.x, 2) + Math.pow(sensorA.y - sensorB.y, 2)
        );

        if (distance <= connectDistance) {
          const line = document.createElement('div');
          line.classList.add('connection-line');

          // 起點與終點位置計算
          const startX = (sensorA.x + 0.5) * cellSize + 4;
          const startY = (sensorA.y + 0.5) * cellSize + 4;
          const endX = (sensorB.x + 0.5) * cellSize + 4;
          const endY = (sensorB.y + 0.5) * cellSize + 4;

          const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
          const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);

          // 設置線條位置與角度
          line.style.width = `${length}px`;
          line.style.height = `2px`; // 固定高度
          line.style.transform = `rotate(${angle}deg)`;
          line.style.backgroundColor = `black`; // 確保顏色為黑色
          line.style.left = `${startX}px`;
          line.style.top = `${startY}px`;

          clickableBox.appendChild(line); // 添加到 clickable-box 中
          connectionLines.push(line);
        }
      });
    });
  }
  // 清除所有連線
  function clearConnections() {
    connectionLines.forEach(line => line.remove());
    connectionLines = [];
  }
  // 解析檔案內容
  function parseFileContent(content) {
    const lines = content.split('\n').map(line => line.trim());
    let currentSection = null;
    let generation = 0;
    generations = {}; // 重置 generations
    limitThreshold = []; // 重置 limitThreshold


    lines.forEach(line => {
      if (line.startsWith('Map')) {
        currentSection = 'Map';
      } else if (line.startsWith('Sensing_range')) {
        currentSection = 'Sensing_range';
      } else if (line.startsWith('Connect')) {
        currentSection = 'Connect';
      } else if (line.startsWith('Limit')) {
        currentSection = 'Limit';
      } else if (line.startsWith('Generation')) {
        currentSection = 'Generation';
      } else if (line.startsWith('*')) {
        currentSection = 'GenerationData';
      }

      switch (currentSection) {
        case 'Map':
          const sizeMatch = line.match(/(\d+)x(\d+)/);
          if (sizeMatch) {
            mapSize = parseInt(sizeMatch[1]);
          }
          break;

        case 'Sensing_range':
          const rangeMatch = line.match(/(\d+)/);
          if (rangeMatch) {
            sensingRange = parseInt(rangeMatch[1]);
          }
          break;

        case 'Connect':
          const connectMatch = line.match(/(\d+)/);
          if (connectMatch) {
            connectDistance = parseInt(connectMatch[1]);
          }
          break;

        case 'Limit':
          if (!line.startsWith('Limit')) {
            limitThreshold.push(line.split(' ').map(Number));
          }
          break;

        case 'GenerationData':
          line = line.trim(); // 移除多餘空白
          const generationMatch = line.match(/\[.*\]/);
          if (generationMatch) {
            // 找到包含感測器座標的 JSON 區域
            const dataMatch = line.match(/\[.*\]/);
            if (dataMatch) {
              // 將座標 JSON 字串轉為陣列
              const sensorData = JSON.parse(dataMatch[0].replace(/(\w+):/g, '"$1":'));
              generations[generation] = sensorData;
            }
            generation++;
          }
          break;
      }
    });
    updateMap(mapSize, sensingRange, connectDistance, limitThreshold, generations);
  }
  // 更新地圖
  function updateMap(mapSize, sensingRange, connectDistance, limitThreshold, generations) {
    // console.log('Map Size:', mapSize);
    // console.log('Sensing Range:', sensingRange);
    // console.log('Connect Distance:', connectDistance);
    // console.log('Limit Threshold:', limitThreshold);
    // console.log('Generations:', generations);

    // 更新地圖大小和格子配置
    gridSize = mapSize; // 更新全域變數
    renderGrid(gridSize, generations[0] || []); // 預設顯示第一代感測器擺放位置
  }
  // 更新進度條的值和顯示的 generation 數
  function updateProgressBar(generation) {
    generationSlider.value = generation + 1; // 更新滑桿位置
    currentGenerationDisplay.textContent = generation + 1; // 更新顯示的 generation
  }
  // 開始播放功能
  function startPlayback() {
    playInterval = setInterval(() => {
      // 如果已播放到最後一代，自動暫停
      if (currentGeneration >= Object.keys(generations).length) {
        clearInterval(playInterval); // 清除計時器
        isPlaying = false;
        playPauseBtn.textContent = 'Play'; // 更新按鈕文字
        currentGeneration = 0;
      } else {
        updateGrid(generations[currentGeneration] || []); // 更新格子資訊
        updateProgressBar(currentGeneration); // 同步更新進度條
        currentGeneration++; // 進入下一代
      }
    }, 1000 / playbackSpeed); // 根據速度倍率調整間隔
  }
  // 根據選項更新格子
  solutionDropdown.addEventListener('change', function () {
    const selectedValue = parseInt(this.value);
    limitThreshold = [];
    generations = {};

    if (selectedValue === 1){
      gridSize = 50;  // 預設map大小
      sensingRange = 5; // 預設感測範圍
      connectDistance = 8; // 預設連線距離
      // 傳入對應的初始 sensor 位置
      renderGrid(gridSize, sensorLayouts[selectedValue] || []);
    }
    else if (selectedValue === 2) {
      parseFileContent(fileContent);
    }
  });
  renderGrid(gridSize, sensorLayouts[1] || []);
  // 切換threshold / detection probability 模式
  thresholdBtn.addEventListener('click', function () {
    isThresholdMode = !isThresholdMode;
    thresholdBtn.textContent = isThresholdMode ? 'Detection Probability' : 'Threshold';

    applyProbabilitiesToGrid(probabilitiesCache, clickableBox);
  });
  // 連線與移除連線
  connectBtn.addEventListener('click', function () {
    isConnectMode = !isConnectMode;
    connectBtn.textContent = isConnectMode ? 'Disconnect' : 'Connect';

    if (isConnectMode) {
      connectSensors();
    } else {
      clearConnections();
    }
  });
  // 檔案讀取
  fileInput.addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function (e) {
      const content = e.target.result;
      parseFileContent(content); // 解析檔案內容
    };
    reader.readAsText(file);

    // **重置 input 的值**
    fileInput.value = ''; // 讓相同檔案再次被選取時能觸發事件
  }); 
  // 按下播放/暫停按鈕時觸發
  playPauseBtn.addEventListener('click', function () {
    if (isPlaying) {
      // 如果正在播放，則暫停播放
      clearInterval(playInterval); // 清除計時器
      isPlaying = false;
      playPauseBtn.textContent = 'Play'; // 更新按鈕文字
    } else {
      // 如果暫停，則開始播放
      isPlaying = true;
      playPauseBtn.textContent = 'Pause'; // 更新按鈕文字
  
      startPlayback(); // 開始播放
    }
  });
  // 拖曳進度條可選擇generation，更新進度條的值和顯示的 generation 數
  generationSlider.addEventListener('input', function () {
    const generation = parseInt(generationSlider.value, 10) - 1; // 取得滑桿的值
    currentGeneration = generation;
    updateProgressBar(currentGeneration); // 更新進度條顯示
    updateGrid(generations[currentGeneration] || []); // 更新格子資訊
  });
  // 加速功能
  speedUpBtn.addEventListener('click', () => {
    if (playbackSpeed < maxSpeed) {
      playbackSpeed++;
      speedDisplay.textContent = `Speed: ${playbackSpeed}x`;

      // 如果正在播放，重新調整播放間隔
      if (isPlaying) {
        clearInterval(playInterval); // 清除當前計時器
        startPlayback(); // 使用新的速度重新啟動播放
      }
    }
  });
  // 減速功能
  speedDownBtn.addEventListener('click', () => {
    if (playbackSpeed > minSpeed) {
      playbackSpeed--;
      speedDisplay.textContent = `Speed: ${playbackSpeed}x`;

      // 如果正在播放，重新調整播放間隔
      if (isPlaying) {
        clearInterval(playInterval); // 清除當前計時器
        startPlayback(); // 使用新的速度重新啟動播放
      }
    }
  });
});