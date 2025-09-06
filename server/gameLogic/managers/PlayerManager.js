/**
 * 玩家管理器 - 负责所有玩家状态管理和验证
 * 遵循单一职责原则，专注于玩家相关逻辑
 */

class PlayerManager {
  /**
   * 创建玩家管理器实例
   * @param {Array} players - 玩家数组引用
   */
  constructor(players) {
    this.players = players;
  }

  /**
   * 获取活跃玩家列表（未弃牌且未All-in）
   * @returns {Array} 活跃玩家数组
   */
  getActivePlayers() {
    return this.players.filter(player => !player.folded && !player.allIn);
  }

  /**
   * 获取All-in玩家列表
   * @returns {Array} All-in玩家数组
   */
  getAllInPlayers() {
    return this.players.filter(player => !player.folded && player.allIn);
  }

  /**
   * 获取未弃牌玩家列表
   * @returns {Array} 未弃牌玩家数组
   */
  getUnfoldedPlayers() {
    return this.players.filter(player => !player.folded);
  }

  /**
   * 获取可行动玩家列表（活跃且有筹码）
   * @returns {Array} 可行动玩家数组
   */
  getActionablePlayers() {
    return this.players.filter(player => 
      !player.folded && !player.allIn && player.chips > 0
    );
  }

  /**
   * 根据ID查找玩家
   * @param {string} playerId - 玩家ID
   * @returns {Object|null} 玩家对象或null
   */
  findPlayerById(playerId) {
    return this.players.find(player => player.id === playerId) || null;
  }

  /**
   * 根据座位号查找玩家
   * @param {number} seatIndex - 座位索引
   * @returns {Object|null} 玩家对象或null
   */
  findPlayerBySeat(seatIndex) {
    return this.players.find(player => player.seat === seatIndex) || null;
  }

  /**
   * 获取下一个活跃玩家的索引
   * @param {number} currentIndex - 当前玩家索引
   * @returns {number} 下一个活跃玩家索引
   */
  getNextActivePlayerIndex(currentIndex) {
    const activePlayers = this.getActivePlayers();
    if (activePlayers.length === 0) return -1;

    let nextIndex = (currentIndex + 1) % this.players.length;
    let attempts = 0;
    
    while (attempts < this.players.length) {
      const player = this.players[nextIndex];
      if (player && !player.folded && !player.allIn) {
        return nextIndex;
      }
      nextIndex = (nextIndex + 1) % this.players.length;
      attempts++;
    }
    
    return -1; // 没有找到活跃玩家
  }

  /**
   * 获取庄家后的第一个活跃玩家索引
   * @param {number} dealerIndex - 庄家索引
   * @returns {number} 第一个活跃玩家索引
   */
  getFirstActivePlayerAfterDealer(dealerIndex) {
    return this.getNextActivePlayerIndex(dealerIndex);
  }

  /**
   * 验证玩家是否可以执行指定动作
   * @param {string} playerId - 玩家ID
   * @param {string} action - 动作类型
   * @param {number} currentPlayerIndex - 当前行动玩家索引
   * @returns {Object} 验证结果 {valid: boolean, error?: string}
   */
  validatePlayerAction(playerId, action, currentPlayerIndex) {
    const player = this.findPlayerById(playerId);
    
    if (!player) {
      return { valid: false, error: '玩家不存在' };
    }

    if (player.folded) {
      return { valid: false, error: '玩家已弃牌，无法行动' };
    }

    if (player.allIn) {
      return { valid: false, error: '玩家已All-in，无法行动' };
    }

    const playerIndex = this.players.findIndex(p => p.id === playerId);
    if (playerIndex !== currentPlayerIndex) {
      return { valid: false, error: '不是你的回合' };
    }

    return { valid: true };
  }

  /**
   * 重置所有玩家的下注状态（新的下注轮开始时）
   */
  resetPlayerBets() {
    this.players.forEach(player => {
      if (!player.folded && !player.allIn) {
        player.currentBet = 0;
      }
    });
  }

  /**
   * 重置所有玩家的手牌状态（新手牌开始时）
   */
  resetPlayerHands() {
    this.players.forEach(player => {
      player.hand = [];
      player.currentBet = 0;
      player.totalBet = 0;
      player.folded = false;
      player.allIn = false;
      player.showHand = false;
    });
  }

  /**
   * 获取玩家下注统计信息
   * @returns {Object} 下注统计 {totalCurrentBets: number, maxBet: number, minBet: number}
   */
  getBettingStats() {
    const activePlayers = this.getActivePlayers();
    const currentBets = activePlayers.map(player => player.currentBet);
    
    return {
      totalCurrentBets: currentBets.reduce((sum, bet) => sum + bet, 0),
      maxBet: Math.max(...currentBets, 0),
      minBet: Math.min(...currentBets, Infinity) || 0,
      playerCount: activePlayers.length
    };
  }

  /**
   * 检查是否所有活跃玩家的下注都相等
   * @param {number} targetBet - 目标下注金额
   * @returns {boolean} 是否所有下注都相等
   */
  areAllBetsEqual(targetBet) {
    const activePlayers = this.getActivePlayers();
    return activePlayers.every(player => player.currentBet === targetBet);
  }

  /**
   * 获取需要跟注的玩家列表
   * @param {number} currentBet - 当前下注水平
   * @returns {Array} 需要跟注的玩家列表
   */
  getPlayersNeedingToCall(currentBet) {
    const activePlayers = this.getActivePlayers();
    return activePlayers.filter(player => player.currentBet < currentBet);
  }

  /**
   * 计算指定玩家的跟注金额
   * @param {string} playerId - 玩家ID
   * @param {number} currentBet - 当前下注水平
   * @returns {number} 跟注金额
   */
  getCallAmount(playerId, currentBet) {
    const player = this.findPlayerById(playerId);
    if (!player) return 0;
    
    return Math.max(0, currentBet - player.currentBet);
  }

  /**
   * 检查玩家是否可以过牌
   * @param {string} playerId - 玩家ID
   * @param {number} currentBet - 当前下注水平
   * @returns {boolean} 是否可以过牌
   */
  canCheck(playerId, currentBet) {
    const player = this.findPlayerById(playerId);
    if (!player) return false;
    
    return player.currentBet >= currentBet;
  }

  /**
   * 检查玩家是否可以加注
   * @param {string} playerId - 玩家ID
   * @param {number} currentBet - 当前下注水平
   * @param {number} minRaise - 最小加注金额
   * @returns {Object} 加注检查结果 {canRaise: boolean, maxRaise: number}
   */
  canRaise(playerId, currentBet, minRaise) {
    const player = this.findPlayerById(playerId);
    if (!player) return { canRaise: false, maxRaise: 0 };
    
    const callAmount = this.getCallAmount(playerId, currentBet);
    const remainingChips = player.chips;
    const maxRaise = remainingChips - callAmount;
    
    return {
      canRaise: maxRaise >= minRaise,
      maxRaise: Math.max(0, maxRaise)
    };
  }

  /**
   * 获取玩家状态摘要（用于调试和日志）
   * @returns {Array} 玩家状态摘要数组
   */
  getPlayersSummary() {
    return this.players.map(player => ({
      id: player.id,
      nickname: player.nickname,
      seat: player.seat,
      chips: player.chips,
      currentBet: player.currentBet,
      totalBet: player.totalBet,
      status: player.folded ? 'folded' : 
              player.allIn ? 'allin' : 'active'
    }));
  }

  /**
   * 验证玩家数据完整性
   * @returns {Array} 发现的问题列表
   */
  validatePlayersIntegrity() {
    const issues = [];
    
    this.players.forEach((player, index) => {
      if (!player.id) {
        issues.push(`Player at index ${index} missing ID`);
      }
      
      if (typeof player.chips !== 'number' || player.chips < 0) {
        issues.push(`Player ${player.id} has invalid chips: ${player.chips}`);
      }
      
      if (typeof player.currentBet !== 'number' || player.currentBet < 0) {
        issues.push(`Player ${player.id} has invalid currentBet: ${player.currentBet}`);
      }
      
      if (player.currentBet > player.chips + player.totalBet) {
        issues.push(`Player ${player.id} currentBet exceeds available chips`);
      }
    });
    
    return issues;
  }
}

module.exports = PlayerManager;
