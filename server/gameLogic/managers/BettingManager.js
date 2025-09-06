/**
 * 下注管理器 - 负责所有下注相关逻辑和验证
 * 遵循单一职责原则，专注于下注机制
 */

class BettingManager {
  /**
   * 创建下注管理器实例
   * @param {Object} gameState - 游戏状态引用
   * @param {PlayerManager} playerManager - 玩家管理器实例
   */
  constructor(gameState, playerManager) {
    this.gameState = gameState;
    this.playerManager = playerManager;
  }

  /**
   * 处理玩家弃牌动作
   * @param {Object} player - 玩家对象
   * @returns {Object} 动作结果
   */
  processFold(player) {
    player.folded = true;
    
    return {
      success: true,
      action: 'fold',
      playerId: player.id,
      message: `玩家 ${player.nickname} 弃牌`
    };
  }

  /**
   * 处理玩家过牌动作
   * @param {Object} player - 玩家对象
   * @returns {Object} 动作结果
   */
  processCheck(player) {
    if (!this.playerManager.canCheck(player.id, this.gameState.currentBet)) {
      throw new Error('无法过牌，需要跟注或加注');
    }

    return {
      success: true,
      action: 'check',
      playerId: player.id,
      message: `玩家 ${player.nickname} 过牌`
    };
  }

  /**
   * 处理玩家跟注动作
   * @param {Object} player - 玩家对象
   * @returns {Object} 动作结果
   */
  processCall(player) {
    const callAmount = this.playerManager.getCallAmount(player.id, this.gameState.currentBet);
    
    if (callAmount === 0) {
      return this.processCheck(player);
    }

    if (callAmount > player.chips) {
      // 筹码不足，自动All-in
      return this.processAllIn(player, 'call_allin');
    }

    if (callAmount === player.chips) {
      // 刚好All-in
      return this.processAllIn(player, 'call_exact_allin');
    }

    // 正常跟注
    player.chips -= callAmount;
    player.currentBet = this.gameState.currentBet;
    player.totalBet += callAmount;
    this.gameState.pot += callAmount;

    return {
      success: true,
      action: 'call',
      playerId: player.id,
      amount: callAmount,
      message: `玩家 ${player.nickname} 跟注 ${callAmount}`
    };
  }

  /**
   * 处理玩家加注动作
   * @param {Object} player - 玩家对象
   * @param {number} raiseAmount - 加注金额
   * @returns {Object} 动作结果
   */
  processRaise(player, raiseAmount) {
    // 验证加注金额
    const validation = this.validateRaise(player, raiseAmount);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const totalAmount = this.gameState.currentBet + raiseAmount - player.currentBet;
    
    if (totalAmount === player.chips) {
      // 加注到All-in
      return this.processAllIn(player, 'raise_allin');
    }

    // 正常加注
    player.chips -= totalAmount;
    const newBet = player.currentBet + totalAmount;
    player.currentBet = newBet;
    player.totalBet += totalAmount;
    this.gameState.pot += totalAmount;
    this.gameState.currentBet = newBet;
    this.gameState.minRaise = raiseAmount;
    this.gameState.lastRaiseIndex = this.gameState.currentPlayerIndex;
    this.gameState.roundStartIndex = this.gameState.currentPlayerIndex;

    return {
      success: true,
      action: 'raise',
      playerId: player.id,
      amount: raiseAmount,
      newBet: newBet,
      message: `玩家 ${player.nickname} 加注到 ${newBet}`
    };
  }

  /**
   * 处理玩家All-in动作
   * @param {Object} player - 玩家对象
   * @param {string} reason - All-in原因
   * @returns {Object} 动作结果
   */
  processAllIn(player, reason = 'voluntary') {
    const allinAmount = player.chips;
    const previousBet = player.currentBet;
    
    player.chips = 0;
    player.currentBet += allinAmount;
    player.totalBet += allinAmount;
    this.gameState.pot += allinAmount;
    player.allIn = true;

    // 如果All-in金额超过当前下注，更新下注水平
    if (player.currentBet > this.gameState.currentBet) {
      const raiseAmount = player.currentBet - this.gameState.currentBet;
      this.gameState.currentBet = player.currentBet;
      this.gameState.minRaise = Math.max(this.gameState.minRaise, raiseAmount);
      this.gameState.lastRaiseIndex = this.gameState.currentPlayerIndex;
      this.gameState.roundStartIndex = this.gameState.currentPlayerIndex;
    }

    // 将玩家添加到All-in列表
    if (!this.gameState.allinPlayers.find(p => p.id === player.id)) {
      this.gameState.allinPlayers.push(player);
    }

    const reasonMessages = {
      'voluntary': 'All-in',
      'call_allin': '筹码不足，自动All-in',
      'call_exact_allin': '跟注All-in',
      'raise_allin': '加注All-in'
    };

    return {
      success: true,
      action: 'allin',
      playerId: player.id,
      amount: allinAmount,
      reason: reason,
      message: `玩家 ${player.nickname} ${reasonMessages[reason] || 'All-in'} ${allinAmount}`
    };
  }

  /**
   * 验证加注金额的有效性
   * @param {Object} player - 玩家对象
   * @param {number} raiseAmount - 加注金额
   * @returns {Object} 验证结果 {valid: boolean, error?: string}
   */
  validateRaise(player, raiseAmount) {
    if (typeof raiseAmount !== 'number' || raiseAmount <= 0) {
      return { valid: false, error: '加注金额必须是正数' };
    }

    if (raiseAmount < this.gameState.minRaise) {
      return { valid: false, error: `加注金额必须至少为 ${this.gameState.minRaise}` };
    }

    const callAmount = this.playerManager.getCallAmount(player.id, this.gameState.currentBet);
    const totalAmount = callAmount + raiseAmount;

    if (totalAmount > player.chips) {
      return { valid: false, error: '筹码不足' };
    }

    return { valid: true };
  }

  /**
   * 计算大盲注金额
   * @param {number} initialChips - 初始筹码
   * @returns {number} 大盲注金额
   */
  calculateBigBlind(initialChips) {
    return Math.floor(initialChips / 50);
  }

  /**
   * 计算小盲注金额
   * @param {number} initialChips - 初始筹码
   * @returns {number} 小盲注金额
   */
  calculateSmallBlind(initialChips) {
    return Math.floor(initialChips / 100);
  }

  /**
   * 处理盲注下注
   * @param {Object} smallBlindPlayer - 小盲注玩家
   * @param {Object} bigBlindPlayer - 大盲注玩家
   * @param {number} initialChips - 初始筹码
   * @returns {Object} 盲注结果
   */
  postBlinds(smallBlindPlayer, bigBlindPlayer, initialChips) {
    const smallBlind = this.calculateSmallBlind(initialChips);
    const bigBlind = this.calculateBigBlind(initialChips);

    // 下小盲注
    smallBlindPlayer.chips -= smallBlind;
    smallBlindPlayer.currentBet = smallBlind;
    smallBlindPlayer.totalBet = smallBlind;
    this.gameState.pot += smallBlind;

    // 下大盲注
    bigBlindPlayer.chips -= bigBlind;
    bigBlindPlayer.currentBet = bigBlind;
    bigBlindPlayer.totalBet = bigBlind;
    this.gameState.pot += bigBlind;

    this.gameState.currentBet = bigBlind;
    this.gameState.minRaise = bigBlind;

    return {
      smallBlind: {
        player: smallBlindPlayer.nickname,
        amount: smallBlind
      },
      bigBlind: {
        player: bigBlindPlayer.nickname,
        amount: bigBlind
      },
      pot: this.gameState.pot
    };
  }

  /**
   * 处理Straddle下注（可选规则）
   * @param {Object} utgPlayer - Under the Gun玩家
   * @returns {Object|null} Straddle结果或null
   */
  processStraddle(utgPlayer) {
    if (!utgPlayer || utgPlayer.chips < this.gameState.currentBet * 2) {
      return null;
    }

    const straddleAmount = this.gameState.currentBet;
    utgPlayer.chips -= straddleAmount;
    utgPlayer.currentBet = this.gameState.currentBet * 2;
    utgPlayer.totalBet = this.gameState.currentBet * 2;
    this.gameState.pot += straddleAmount;
    this.gameState.currentBet = this.gameState.currentBet * 2;
    this.gameState.minRaise = this.gameState.currentBet;

    return {
      player: utgPlayer.nickname,
      amount: straddleAmount,
      newBet: utgPlayer.currentBet
    };
  }

  /**
   * 检查轮次是否完成
   * @returns {Object} 轮次检查结果 {completed: boolean, reason: string}
   */
  checkRoundCompletion() {
    const activePlayers = this.playerManager.getActivePlayers();
    const allinPlayers = this.playerManager.getAllInPlayers();
    
    // 没有活跃玩家，轮次完成
    if (activePlayers.length === 0) {
      return { 
        completed: true, 
        reason: 'no_active_players',
        message: '没有活跃玩家，轮次完成'
      };
    }

    // 只有一个活跃玩家
    if (activePlayers.length === 1) {
      const lastPlayer = activePlayers[0];
      if (lastPlayer.currentBet >= this.gameState.currentBet) {
        return { 
          completed: true, 
          reason: 'last_player_matched',
          message: '最后一个活跃玩家已匹配下注，轮次完成'
        };
      } else {
        return { 
          completed: false, 
          reason: 'last_player_needs_call',
          message: '最后一个活跃玩家需要决定跟注，轮次未完成'
        };
      }
    }

    // 检查所有活跃玩家的下注是否相等
    const allBetsEqual = this.playerManager.areAllBetsEqual(this.gameState.currentBet);
    
    if (!allBetsEqual) {
      const needingToCall = this.playerManager.getPlayersNeedingToCall(this.gameState.currentBet);
      return { 
        completed: false, 
        reason: 'unequal_bets',
        message: `还有 ${needingToCall.length} 个玩家需要跟注`
      };
    }

    return { 
      completed: true, 
      reason: 'all_bets_equal',
      message: '所有活跃玩家下注相等，轮次完成'
    };
  }

  /**
   * 重置下注轮状态
   */
  resetBettingRound() {
    this.gameState.currentBet = 0;
    this.gameState.minRaise = this.calculateBigBlind(this.gameState.room.settings.initialChips);
    this.gameState.lastRaiseIndex = -1;
    
    this.playerManager.resetPlayerBets();
  }

  /**
   * 获取下注统计信息
   * @returns {Object} 下注统计
   */
  getBettingStats() {
    const playerStats = this.playerManager.getBettingStats();
    
    return {
      ...playerStats,
      pot: this.gameState.pot,
      currentBet: this.gameState.currentBet,
      minRaise: this.gameState.minRaise,
      lastRaiseIndex: this.gameState.lastRaiseIndex,
      playersNeedingAction: this.playerManager.getPlayersNeedingToCall(this.gameState.currentBet).length
    };
  }

  /**
   * 验证下注系统完整性
   * @returns {Array} 发现的问题列表
   */
  validateBettingIntegrity() {
    const issues = [];
    
    // 验证筹码守恒
    const totalChips = this.playerManager.players.reduce((sum, player) => 
      sum + player.chips + player.totalBet, 0
    );
    
    const expectedTotal = this.playerManager.players.length * this.gameState.room.settings.initialChips;
    if (totalChips !== expectedTotal) {
      issues.push(`Chip conservation violation: expected ${expectedTotal}, got ${totalChips}`);
    }

    // 验证底池一致性
    const calculatedPot = this.playerManager.players.reduce((sum, player) => 
      sum + player.totalBet, 0
    );
    
    if (this.gameState.pot !== calculatedPot) {
      issues.push(`Pot inconsistency: gameState.pot=${this.gameState.pot}, calculated=${calculatedPot}`);
    }

    // 验证下注逻辑
    if (this.gameState.currentBet < 0) {
      issues.push('Current bet cannot be negative');
    }

    if (this.gameState.minRaise < 0) {
      issues.push('Min raise cannot be negative');
    }

    return issues;
  }
}

module.exports = BettingManager;
