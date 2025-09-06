const io = require('socket.io-client');
const { v4: uuidv4 } = require('uuid');

console.log('🚀 启动增强版德州扑克机器人自动测试...');
console.log('📊 包含详细操作记录和发牌阶段跟踪');

// 游戏状态跟踪
let gameState = {
  roomId: null,
  gamePhase: 'waiting',
  pot: 0,
  communityCards: [],
  currentBet: 0,
  dealer: -1,
  currentPlayer: -1,
  players: []
};

// 操作记录
let actionLog = [];
let dealingLog = [];

// 记录操作
function logAction(playerName, action, amount = 0, details = '') {
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = `[${timestamp}] 🎯 ${playerName}: ${action}${amount > 0 ? ` $${amount}` : ''}${details ? ` (${details})` : ''}`;
  actionLog.push(logEntry);
  console.log(logEntry);
}

// 记录发牌阶段
function logDealing(phase, cards = []) {
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = `[${timestamp}] 🃏 发牌阶段: ${phase}${cards.length > 0 ? ` - 公共牌: ${cards.join(', ')}` : ''}`;
  dealingLog.push(logEntry);
  console.log(logEntry);
}

// AlphaBot - 激进型机器人
class AlphaBot {
  constructor() {
    this.socket = io('http://localhost:3001');
    this.deviceId = `alpha_bot_${uuidv4().slice(0, 8)}`;
    this.name = 'AlphaBot';
    this.stats = {
      handsPlayed: 0,
      wins: 0,
      totalActions: 0,
      folds: 0,
      calls: 0,
      raises: 0,
      allIns: 0,
      bluffs: 0
    };
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('🤖 [AlphaBot] 已连接到服务器');
      this.socket.emit('registerDevice', { deviceId: this.deviceId });
    });

    this.socket.on('deviceRegistered', () => {
      console.log('🤖 [AlphaBot] 设备注册完成');
      setTimeout(() => this.createRoom(), 1000);
    });

    this.socket.on('roomCreated', (data) => {
      gameState.roomId = data.roomId;
      console.log(`🏠 AlphaBot 成功创建房间: ${data.roomId}`);
      console.log(`🌐 访问链接: http://192.168.110.69:5173/game/${data.roomId}`);
      logAction('AlphaBot', '创建房间', 0, `房间ID: ${data.roomId}`);
    });

    // 监听所有可能的游戏事件
    this.socket.onAny((eventName, ...args) => {
      console.log(`🎮 [AlphaBot] 接收到事件: ${eventName}`, args.length > 0 ? args[0] : '');
    });

    this.socket.on('gameStateUpdate', (state) => {
      console.log('🔄 [AlphaBot] 游戏状态更新:', state);
      this.handleGameState(state);
    });

    this.socket.on('gameStarted', (data) => {
      console.log('🎮 游戏开始！');
      logDealing('游戏开始', []);
      gameState.gamePhase = 'preflop';
    });

    this.socket.on('handStarted', (data) => {
      console.log('🃏 新一轮开始 - 发手牌');
      logDealing('发手牌 (Preflop)');
      this.stats.handsPlayed++;
    });

    this.socket.on('flopDealt', (data) => {
      gameState.communityCards = data.communityCards || [];
      console.log('🃏 翻牌 (Flop):', gameState.communityCards.slice(0, 3));
      logDealing('翻牌 (Flop)', gameState.communityCards.slice(0, 3));
      gameState.gamePhase = 'flop';
    });

    this.socket.on('turnDealt', (data) => {
      gameState.communityCards = data.communityCards || [];
      console.log('🃏 转牌 (Turn):', gameState.communityCards[3]);
      logDealing('转牌 (Turn)', [gameState.communityCards[3]]);
      gameState.gamePhase = 'turn';
    });

    this.socket.on('riverDealt', (data) => {
      gameState.communityCards = data.communityCards || [];
      console.log('🃏 河牌 (River):', gameState.communityCards[4]);
      logDealing('河牌 (River)', [gameState.communityCards[4]]);
      gameState.gamePhase = 'river';
    });

    this.socket.on('yourTurn', (data) => {
      console.log('🎯 AlphaBot 的回合', data);
      setTimeout(() => this.makeDecision(data), 1000);
    });

    this.socket.on('handEnded', (data) => {
      if (data.winner && data.winner.includes(this.deviceId)) {
        this.stats.wins++;
        logAction('AlphaBot', '赢得底池', data.pot || 0);
      }
      console.log('🏁 本轮结束');
      logDealing('本轮结束');
    });

    // 添加错误处理
    this.socket.on('error', (error) => {
      console.log('❌ [AlphaBot] 错误:', error);
    });
  }

  createRoom() {
    console.log('🏠 AlphaBot 创建游戏房间...');
    this.socket.emit('createRoom', {
      maxPlayers: 6,
      initialChips: 1000,
      smallBlind: 10,
      bigBlind: 20
    });
  }

  handleGameState(state) {
    gameState.players = state.players || [];
    gameState.pot = state.pot || 0;
    gameState.currentBet = state.currentBet || 0;
    
    // 如果有足够玩家且游戏未开始，则开始游戏
    if (state.players && state.players.length >= 2 && !state.gameStarted && !this.gameStartRequested) {
      this.gameStartRequested = true;
      setTimeout(() => {
        console.log('🎮 启动游戏...');
        this.socket.emit('startGame', gameState.roomId);
        logAction('AlphaBot', '启动游戏');
      }, 2000);
    }
  }

  makeDecision(data) {
    const availableActions = data.availableActions || ['fold', 'call', 'raise'];
    const callAmount = data.callAmount || 0;
    const minRaise = data.minRaise || 20;
    
    // AlphaBot 激进策略
    let action, amount = 0;
    
    if (Math.random() < 0.7) { // 70% 概率激进
      if (availableActions.includes('raise')) {
        action = 'raise';
        amount = minRaise + Math.floor(Math.random() * 50); // 加注
        this.stats.raises++;
        logAction('AlphaBot', '加注', amount, '激进策略');
      } else if (availableActions.includes('call')) {
        action = 'call';
        amount = callAmount;
        this.stats.calls++;
        logAction('AlphaBot', '跟注', amount);
      } else {
        action = 'fold';
        this.stats.folds++;
        logAction('AlphaBot', '弃牌');
      }
    } else {
      if (Math.random() < 0.3 && availableActions.includes('call')) {
        action = 'call';
        amount = callAmount;
        this.stats.calls++;
        logAction('AlphaBot', '跟注', amount, '保守行动');
      } else {
        action = 'fold';
        this.stats.folds++;
        logAction('AlphaBot', '弃牌', 0, '策略性弃牌');
      }
    }

    this.stats.totalActions++;
    
    // 执行动作
    this.socket.emit('playerAction', {
      action: action,
      amount: amount
    });
  }
}

// BetaBot - 保守型机器人
class BetaBot {
  constructor() {
    this.socket = io('http://localhost:3001');
    this.deviceId = `beta_bot_${uuidv4().slice(0, 8)}`;
    this.name = 'BetaBot';
    this.stats = {
      handsPlayed: 0,
      wins: 0,
      totalActions: 0,
      folds: 0,
      calls: 0,
      raises: 0,
      allIns: 0,
      bluffs: 0
    };
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('🤖 [BetaBot] 已连接到服务器');
      this.socket.emit('registerDevice', { deviceId: this.deviceId });
    });

    this.socket.on('deviceRegistered', () => {
      console.log('🤖 [BetaBot] 设备注册完成');
      // 等待AlphaBot创建房间后再加入
      setTimeout(() => {
        if (gameState.roomId) {
          this.joinRoom();
        } else {
          // 如果还没有房间，等待更长时间再试
          setTimeout(() => this.joinRoom(), 2000);
        }
      }, 5000);
    });

    // 监听所有可能的游戏事件
    this.socket.onAny((eventName, ...args) => {
      console.log(`🎮 [BetaBot] 接收到事件: ${eventName}`, args.length > 0 ? args[0] : '');
    });

    this.socket.on('gameStateUpdate', (state) => {
      if (!this.hasJoined && state.players && state.players.length === 1) {
        setTimeout(() => this.joinRoom(), 1000);
      }
    });

    this.socket.on('yourTurn', (data) => {
      console.log('🎯 BetaBot 的回合', data);
      setTimeout(() => this.makeDecision(data), 1500);
    });

    this.socket.on('handEnded', (data) => {
      if (data.winner && data.winner.includes(this.deviceId)) {
        this.stats.wins++;
        logAction('BetaBot', '赢得底池', data.pot || 0);
      }
    });

    // 添加错误处理
    this.socket.on('error', (error) => {
      console.log('❌ [BetaBot] 错误:', error);
    });
  }

  joinRoom() {
    if (gameState.roomId && !this.hasJoined) {
      console.log(`👥 BetaBot 加入游戏房间: ${gameState.roomId}`);
      this.socket.emit('joinRoom', {
        roomId: gameState.roomId,
        deviceId: this.deviceId,
        playerName: 'BetaBot'
      });
      this.hasJoined = true;
      logAction('BetaBot', '加入房间', 0, `房间ID: ${gameState.roomId}`);
    }
  }

  makeDecision(data) {
    const availableActions = data.availableActions || ['fold', 'call', 'raise'];
    const callAmount = data.callAmount || 0;
    const minRaise = data.minRaise || 20;
    
    // BetaBot 保守策略
    let action, amount = 0;
    
    if (callAmount === 0) { // 免费看牌
      action = 'call';
      this.stats.calls++;
      logAction('BetaBot', '过牌', 0, '免费看牌');
    } else if (callAmount <= 30) { // 小额跟注
      if (Math.random() < 0.6) {
        action = 'call';
        amount = callAmount;
        this.stats.calls++;
        logAction('BetaBot', '跟注', amount, '保守跟注');
      } else {
        action = 'fold';
        this.stats.folds++;
        logAction('BetaBot', '弃牌', 0, '保守弃牌');
      }
    } else { // 大额下注
      if (Math.random() < 0.2) { // 20% 概率跟注
        action = 'call';
        amount = callAmount;
        this.stats.calls++;
        logAction('BetaBot', '跟注', amount, '冒险跟注');
      } else {
        action = 'fold';
        this.stats.folds++;
        logAction('BetaBot', '弃牌', 0, '理性弃牌');
      }
    }

    this.stats.totalActions++;
    
    // 执行动作
    this.socket.emit('playerAction', {
      action: action,
      amount: amount
    });
  }
}

// 启动机器人
console.log('📡 连接机器人到服务器...');

const alphaBot = new AlphaBot();
const betaBot = new BetaBot();

// 定期输出统计信息
setInterval(() => {
  console.log('\n📈 === 实时游戏状态 ===');
  console.log(`🏠 房间: ${gameState.roomId || '等待创建'}`);
  console.log(`🎮 阶段: ${gameState.gamePhase}`);
  console.log(`💰 底池: $${gameState.pot}`);
  console.log(`🃏 公共牌: ${gameState.communityCards.join(', ') || '暂无'}`);
  console.log(`👥 玩家数量: ${gameState.players.length}`);
  
  console.log('\n📊 机器人统计:');
  console.log(`🤖 [AlphaBot] 胜率: ${alphaBot.stats.handsPlayed > 0 ? (alphaBot.stats.wins / alphaBot.stats.handsPlayed * 100).toFixed(1) : 0}% | 行动: ${alphaBot.stats.totalActions} | 弃牌: ${alphaBot.stats.folds} | 跟注: ${alphaBot.stats.calls} | 加注: ${alphaBot.stats.raises}`);
  console.log(`🤖 [BetaBot] 胜率: ${betaBot.stats.handsPlayed > 0 ? (betaBot.stats.wins / betaBot.stats.handsPlayed * 100).toFixed(1) : 0}% | 行动: ${betaBot.stats.totalActions} | 弃牌: ${betaBot.stats.folds} | 跟注: ${betaBot.stats.calls} | 加注: ${betaBot.stats.raises}`);
  
  if (actionLog.length > 0) {
    console.log('\n📝 最近操作记录:');
    actionLog.slice(-5).forEach(log => console.log(log));
  }
  
  console.log('=============================\n');
}, 10000);

console.log('✅ 增强版机器人测试已启动！');
console.log('🎮 将自动开始游戏并进行详细记录');
console.log('📊 测试将持续运行，按 Ctrl+C 停止');
