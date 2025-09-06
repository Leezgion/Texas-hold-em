/**
 * 德州扑克AI机器人 - 用于自动化测试
 * 实现多种策略的智能机器人
 */

const io = require('socket.io-client');
const deviceIdManager = require('../../utils/deviceId');

class PokerBot {
  constructor(serverUrl, strategy = 'conservative', name = null) {
    this.serverUrl = serverUrl;
    this.strategy = strategy;
    this.name = name || `Bot_${strategy}_${Math.random().toString(36).substr(2, 6)}`;
    this.deviceId = `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.socket = null;
    this.connected = false;
    
    // 游戏状态
    this.roomId = null;
    this.playerId = null;
    this.chips = 0;
    this.hand = [];
    this.gameState = null;
    this.isMyTurn = false;
    
    // 决策参数
    this.decisionDelay = 500 + Math.random() * 1500; // 0.5-2秒决策时间
    this.decisions = new DecisionEngine(strategy);
    
    // 统计数据
    this.stats = {
      handsPlayed: 0,
      handsWon: 0,
      totalWinnings: 0,
      decisions: { fold: 0, check: 0, call: 0, raise: 0, allin: 0 }
    };
  }

  // 连接到服务器
  async connect() {
    return new Promise((resolve, reject) => {
      this.socket = io(this.serverUrl, {
        transports: ['websocket']
      });

      this.socket.on('connect', () => {
        this.connected = true;
        console.log(`🤖 Bot ${this.name} connected`);
        
        // 注册设备
        this.socket.emit('register', this.deviceId);
        resolve();
      });

      this.socket.on('disconnect', () => {
        this.connected = false;
        console.log(`🤖 Bot ${this.name} disconnected`);
      });

      this.socket.on('connect_error', (error) => {
        reject(error);
      });

      this.setupEventHandlers();
    });
  }

  // 设置事件监听
  setupEventHandlers() {
    // 房间加入成功
    this.socket.on('roomJoined', (data) => {
      this.roomId = data.roomId;
      this.playerId = data.playerId;
      console.log(`🤖 Bot ${this.name} joined room ${this.roomId}`);
    });

    // 游戏状态更新
    this.socket.on('gameState', (gameState) => {
      this.gameState = gameState;
      this.updatePlayerInfo(gameState);
      this.checkIfMyTurn(gameState);
    });

    // 房间状态更新
    this.socket.on('roomState', (roomState) => {
      this.updatePlayerInfo(roomState);
    });

    // 新手牌开始
    this.socket.on('newHand', (data) => {
      this.hand = data.hand || [];
      this.stats.handsPlayed++;
      console.log(`🤖 Bot ${this.name} received new hand: ${this.formatCards(this.hand)}`);
    });

    // 手牌结果
    this.socket.on('handResult', (result) => {
      if (result.winners && result.winners.some(w => w.id === this.playerId)) {
        this.stats.handsWon++;
        this.stats.totalWinnings += result.pot || 0;
        console.log(`🤖 Bot ${this.name} won hand! Pot: ${result.pot}`);
      }
    });

    // 错误处理
    this.socket.on('error', (error) => {
      console.error(`🤖 Bot ${this.name} error:`, error);
    });
  }

  // 更新玩家信息
  updatePlayerInfo(state) {
    if (state.players) {
      const myPlayer = state.players.find(p => p.id === this.playerId);
      if (myPlayer) {
        this.chips = myPlayer.chips;
      }
    }
  }

  // 检查是否轮到我
  checkIfMyTurn(gameState) {
    if (!gameState || !gameState.players) return;
    
    const currentPlayerIndex = gameState.currentPlayerIndex;
    if (currentPlayerIndex !== undefined) {
      const currentPlayer = gameState.players[currentPlayerIndex];
      if (currentPlayer && currentPlayer.id === this.playerId) {
        this.isMyTurn = true;
        this.makeDecision(gameState);
      } else {
        this.isMyTurn = false;
      }
    }
  }

  // 做出决策
  async makeDecision(gameState) {
    if (!this.isMyTurn) return;

    // 模拟思考时间
    await this.sleep(this.decisionDelay);

    try {
      const decision = this.decisions.decide({
        hand: this.hand,
        communityCards: gameState.communityCards || [],
        gamePhase: gameState.phase || 'preflop',
        currentBet: gameState.currentBet || 0,
        pot: gameState.pot || 0,
        myChips: this.chips,
        myCurrentBet: this.getCurrentBet(gameState),
        players: gameState.players || [],
        minRaise: gameState.minRaise || 0
      });

      this.executeDecision(decision);
      this.stats.decisions[decision.action]++;
      
      console.log(`🤖 Bot ${this.name} decision: ${decision.action}${decision.amount ? ` (${decision.amount})` : ''}`);
      
    } catch (error) {
      console.error(`🤖 Bot ${this.name} decision error:`, error);
      // 默认弃牌
      this.executeDecision({ action: 'fold' });
    }
  }

  // 获取当前下注金额
  getCurrentBet(gameState) {
    if (!gameState.players) return 0;
    const myPlayer = gameState.players.find(p => p.id === this.playerId);
    return myPlayer ? myPlayer.currentBet : 0;
  }

  // 执行决策
  executeDecision(decision) {
    this.isMyTurn = false;
    
    this.socket.emit('playerAction', {
      action: decision.action,
      amount: decision.amount || 0
    });
  }

  // 格式化牌显示
  formatCards(cards) {
    if (!cards || cards.length === 0) return 'No cards';
    
    return cards.map(card => {
      const rankMap = {
        14: 'A', 13: 'K', 12: 'Q', 11: 'J',
        10: 'T', 9: '9', 8: '8', 7: '7', 6: '6',
        5: '5', 4: '4', 3: '3', 2: '2'
      };
      const suitMap = {
        'hearts': '♥', 'diamonds': '♦',
        'clubs': '♣', 'spades': '♠'
      };
      
      return `${rankMap[card.rank] || card.rank}${suitMap[card.suit] || card.suit}`;
    }).join(' ');
  }

  // 工具方法
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 加入房间
  joinRoom(roomId) {
    if (!this.connected) {
      throw new Error('Bot not connected');
    }
    
    this.socket.emit('joinRoom', {
      roomId: roomId,
      deviceId: this.deviceId,
      nickname: this.name
    });
  }

  // 创建房间
  createRoom(settings = {}) {
    if (!this.connected) {
      throw new Error('Bot not connected');
    }

    const defaultSettings = {
      duration: 60,
      maxPlayers: 6,
      allowStraddle: false,
      allinDealCount: 3
    };

    this.socket.emit('createRoom', {
      settings: { ...defaultSettings, ...settings },
      deviceId: this.deviceId,
      nickname: this.name
    });
  }

  // 断开连接
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.connected = false;
    }
  }

  // 获取统计信息
  getStats() {
    return {
      ...this.stats,
      winRate: this.stats.handsPlayed > 0 ? 
        (this.stats.handsWon / this.stats.handsPlayed * 100).toFixed(2) + '%' : '0%',
      averageWinnings: this.stats.handsWon > 0 ?
        (this.stats.totalWinnings / this.stats.handsWon).toFixed(2) : '0'
    };
  }
}

// 决策引擎
class DecisionEngine {
  constructor(strategy) {
    this.strategy = strategy;
  }

  decide(context) {
    switch (this.strategy) {
      case 'aggressive':
        return this.aggressiveStrategy(context);
      case 'conservative':
        return this.conservativeStrategy(context);
      case 'loose':
        return this.looseStrategy(context);
      case 'tight':
        return this.tightStrategy(context);
      case 'random':
        return this.randomStrategy(context);
      default:
        return this.conservativeStrategy(context);
    }
  }

  // 激进策略 - 喜欢加注和诈唬
  aggressiveStrategy(context) {
    const handStrength = this.evaluateHandStrength(context);
    const callAmount = context.currentBet - context.myCurrentBet;
    const potOdds = context.pot > 0 ? callAmount / (context.pot + callAmount) : 0;

    if (handStrength >= 0.7) {
      // 强牌 - 加注
      const raiseAmount = Math.min(
        context.pot * 0.8,
        context.myChips * 0.3,
        context.myChips - callAmount
      );
      return { action: 'raise', amount: Math.max(raiseAmount, context.minRaise) };
    } else if (handStrength >= 0.4) {
      // 中等牌力 - 随机加注或跟注
      if (Math.random() < 0.4) {
        const raiseAmount = Math.min(context.pot * 0.5, context.myChips * 0.2);
        return { action: 'raise', amount: Math.max(raiseAmount, context.minRaise) };
      } else {
        return callAmount === 0 ? { action: 'check' } : { action: 'call' };
      }
    } else if (handStrength >= 0.2) {
      // 弱牌 - 偶尔诈唬
      if (Math.random() < 0.2 && callAmount < context.myChips * 0.1) {
        return callAmount === 0 ? { action: 'check' } : { action: 'call' };
      } else {
        return { action: 'fold' };
      }
    } else {
      return { action: 'fold' };
    }
  }

  // 保守策略 - 只玩强牌
  conservativeStrategy(context) {
    const handStrength = this.evaluateHandStrength(context);
    const callAmount = context.currentBet - context.myCurrentBet;

    if (handStrength >= 0.8) {
      // 超强牌 - 加注
      const raiseAmount = Math.min(context.pot * 0.6, context.myChips * 0.2);
      return { action: 'raise', amount: Math.max(raiseAmount, context.minRaise) };
    } else if (handStrength >= 0.6) {
      // 强牌 - 跟注或小加注
      if (callAmount <= context.myChips * 0.1) {
        return callAmount === 0 ? { action: 'check' } : { action: 'call' };
      } else {
        return { action: 'fold' };
      }
    } else if (handStrength >= 0.4 && callAmount === 0) {
      // 中等牌力且免费 - 过牌
      return { action: 'check' };
    } else {
      return { action: 'fold' };
    }
  }

  // 松散策略 - 玩很多手牌
  looseStrategy(context) {
    const handStrength = this.evaluateHandStrength(context);
    const callAmount = context.currentBet - context.myCurrentBet;

    if (handStrength >= 0.6) {
      const raiseAmount = Math.min(context.pot * 0.5, context.myChips * 0.15);
      return { action: 'raise', amount: Math.max(raiseAmount, context.minRaise) };
    } else if (handStrength >= 0.2) {
      return callAmount === 0 ? { action: 'check' } : { action: 'call' };
    } else if (callAmount <= context.myChips * 0.05) {
      // 便宜的话也跟注
      return callAmount === 0 ? { action: 'check' } : { action: 'call' };
    } else {
      return { action: 'fold' };
    }
  }

  // 紧密策略 - 很少玩牌
  tightStrategy(context) {
    const handStrength = this.evaluateHandStrength(context);
    const callAmount = context.currentBet - context.myCurrentBet;

    if (handStrength >= 0.9) {
      const raiseAmount = Math.min(context.pot, context.myChips * 0.3);
      return { action: 'raise', amount: Math.max(raiseAmount, context.minRaise) };
    } else if (handStrength >= 0.7) {
      if (callAmount <= context.myChips * 0.05) {
        return callAmount === 0 ? { action: 'check' } : { action: 'call' };
      } else {
        return { action: 'fold' };
      }
    } else {
      return { action: 'fold' };
    }
  }

  // 随机策略 - 完全随机决策
  randomStrategy(context) {
    const callAmount = context.currentBet - context.myCurrentBet;
    const actions = [];

    // 总是可以弃牌
    actions.push({ action: 'fold' });

    // 如果可以过牌
    if (callAmount === 0) {
      actions.push({ action: 'check' });
    }

    // 如果有足够筹码跟注
    if (callAmount <= context.myChips) {
      actions.push({ action: 'call' });
    }

    // 如果可以加注
    if (context.myChips > callAmount + context.minRaise) {
      const raiseAmount = Math.min(
        context.minRaise + Math.random() * context.pot,
        context.myChips - callAmount
      );
      actions.push({ action: 'raise', amount: raiseAmount });
    }

    return actions[Math.floor(Math.random() * actions.length)];
  }

  // 简单的手牌评估 (0-1之间的分数)
  evaluateHandStrength(context) {
    if (!context.hand || context.hand.length < 2) return 0;

    let strength = 0;
    const [card1, card2] = context.hand;

    // 基础牌力评估
    const rank1 = card1.rank;
    const rank2 = card2.rank;
    const highRank = Math.max(rank1, rank2);
    const lowRank = Math.min(rank1, rank2);
    const isPair = rank1 === rank2;
    const isSuited = card1.suit === card2.suit;

    // 对子加分
    if (isPair) {
      strength += 0.3 + (highRank - 2) * 0.05; // AA=0.9, KK=0.85...
    } else {
      // 高牌加分
      strength += (highRank - 2) * 0.02; // A=0.24, K=0.22...
      strength += (lowRank - 2) * 0.01;
    }

    // 同花加分
    if (isSuited) {
      strength += 0.1;
    }

    // 连牌加分
    if (Math.abs(rank1 - rank2) === 1 || (rank1 === 14 && rank2 === 2)) {
      strength += 0.05;
    }

    // 根据公共牌调整 (简化版本)
    if (context.communityCards && context.communityCards.length > 0) {
      // 这里可以实现更复杂的牌型识别
      // 暂时简化处理
      strength += 0.1;
    }

    return Math.min(strength, 1.0);
  }
}

module.exports = { PokerBot, DecisionEngine };
