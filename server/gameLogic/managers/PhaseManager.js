/**
 * 游戏阶段管理器 - 负责游戏各阶段的转换和逻辑控制
 * 包括preflop, flop, turn, river和摊牌阶段
 */

class PhaseManager {
  /**
   * 创建游戏阶段管理器实例
   * @param {Object} gameState - 游戏状态引用
   * @param {PlayerManager} playerManager - 玩家管理器实例
   * @param {BettingManager} bettingManager - 下注管理器实例
   * @param {PotManager} potManager - 奖池管理器实例
   */
  constructor(gameState, playerManager, bettingManager, potManager) {
    this.gameState = gameState;
    this.playerManager = playerManager;
    this.bettingManager = bettingManager;
    this.potManager = potManager;
    
    // 游戏阶段常量
    this.PHASES = {
      WAITING: 'waiting',
      PREFLOP: 'preflop',
      FLOP: 'flop',
      TURN: 'turn',
      RIVER: 'river',
      SHOWDOWN: 'showdown',
      FINISHED: 'finished'
    };
  }

  /**
   * 开始新的游戏手牌
   * @param {Array} players - 参与玩家列表
   * @param {Object} deck - 牌组对象
   * @returns {Object} 开始结果
   */
  startNewHand(players, deck) {
    // 重置游戏状态
    this.gameState.phase = this.PHASES.PREFLOP;
    this.gameState.communityCards = [];
    this.gameState.currentPlayerIndex = 0;
    this.gameState.dealerIndex = this.getNextDealerIndex();
    this.gameState.pot = 0;
    this.gameState.currentBet = 0;
    this.gameState.minRaise = this.bettingManager.calculateBigBlind(this.gameState.room.settings.initialChips);
    this.gameState.lastRaiseIndex = -1;
    this.gameState.allinPlayers = [];

    // 重置玩家状态
    this.playerManager.resetPlayersForNewHand();

    // 处理盲注
    const blindResult = this.postBlinds(players);

    // 发牌
    this.dealHoleCards(players, deck);

    // 设置行动顺序
    this.setActionOrder();

    return {
      success: true,
      phase: this.gameState.phase,
      dealerIndex: this.gameState.dealerIndex,
      blinds: blindResult,
      message: '新手牌开始'
    };
  }

  /**
   * 下盲注
   * @param {Array} players - 玩家列表
   * @returns {Object} 盲注结果
   */
  postBlinds(players) {
    const playerCount = players.length;
    
    if (playerCount < 2) {
      throw new Error('At least 2 players required');
    }

    let smallBlindIndex, bigBlindIndex;

    if (playerCount === 2) {
      // 两人游戏：庄家是小盲注
      smallBlindIndex = this.gameState.dealerIndex;
      bigBlindIndex = (this.gameState.dealerIndex + 1) % playerCount;
    } else {
      // 多人游戏：庄家左边是小盲注
      smallBlindIndex = (this.gameState.dealerIndex + 1) % playerCount;
      bigBlindIndex = (this.gameState.dealerIndex + 2) % playerCount;
    }

    const smallBlindPlayer = players[smallBlindIndex];
    const bigBlindPlayer = players[bigBlindIndex];

    return this.bettingManager.postBlinds(
      smallBlindPlayer, 
      bigBlindPlayer, 
      this.gameState.room.settings.initialChips
    );
  }

  /**
   * 发底牌
   * @param {Array} players - 玩家列表
   * @param {Object} deck - 牌组对象
   */
  dealHoleCards(players, deck) {
    // 每个玩家发两张牌
    for (let i = 0; i < 2; i++) {
      for (const player of players) {
        if (!player.folded) {
          player.holeCards.push(deck.drawCard());
        }
      }
    }
  }

  /**
   * 设置行动顺序（UTG开始）
   */
  setActionOrder() {
    const playerCount = this.playerManager.getActivePlayers().length;
    
    if (playerCount <= 2) {
      // 两人游戏：大盲注先行动
      this.gameState.currentPlayerIndex = this.gameState.dealerIndex;
    } else {
      // 多人游戏：UTG（大盲注左边）先行动
      this.gameState.currentPlayerIndex = (this.gameState.dealerIndex + 3) % playerCount;
    }

    this.gameState.roundStartIndex = this.gameState.currentPlayerIndex;
  }

  /**
   * 进入下一个游戏阶段
   * @param {Object} deck - 牌组对象
   * @returns {Object} 阶段转换结果
   */
  advanceToNextPhase(deck) {
    const currentPhase = this.gameState.phase;
    
    switch (currentPhase) {
      case this.PHASES.PREFLOP:
        return this.advanceToFlop(deck);
      case this.PHASES.FLOP:
        return this.advanceToTurn(deck);
      case this.PHASES.TURN:
        return this.advanceToRiver(deck);
      case this.PHASES.RIVER:
        return this.advanceToShowdown();
      case this.PHASES.SHOWDOWN:
        return this.finishHand();
      default:
        throw new Error(`Cannot advance from phase: ${currentPhase}`);
    }
  }

  /**
   * 进入翻牌阶段
   * @param {Object} deck - 牌组对象
   * @returns {Object} 翻牌结果
   */
  advanceToFlop(deck) {
    this.gameState.phase = this.PHASES.FLOP;
    
    // 烧掉一张牌
    deck.drawCard();
    
    // 发三张公共牌
    for (let i = 0; i < 3; i++) {
      this.gameState.communityCards.push(deck.drawCard());
    }

    // 重置下注轮
    this.bettingManager.resetBettingRound();
    this.setPostFlopActionOrder();

    return {
      phase: this.PHASES.FLOP,
      communityCards: this.gameState.communityCards,
      message: '翻牌阶段开始'
    };
  }

  /**
   * 进入转牌阶段
   * @param {Object} deck - 牌组对象
   * @returns {Object} 转牌结果
   */
  advanceToTurn(deck) {
    this.gameState.phase = this.PHASES.TURN;
    
    // 烧掉一张牌
    deck.drawCard();
    
    // 发一张公共牌
    this.gameState.communityCards.push(deck.drawCard());

    // 重置下注轮
    this.bettingManager.resetBettingRound();
    this.setPostFlopActionOrder();

    return {
      phase: this.PHASES.TURN,
      communityCards: this.gameState.communityCards,
      message: '转牌阶段开始'
    };
  }

  /**
   * 进入河牌阶段
   * @param {Object} deck - 牌组对象
   * @returns {Object} 河牌结果
   */
  advanceToRiver(deck) {
    this.gameState.phase = this.PHASES.RIVER;
    
    // 烧掉一张牌
    deck.drawCard();
    
    // 发最后一张公共牌
    this.gameState.communityCards.push(deck.drawCard());

    // 重置下注轮
    this.bettingManager.resetBettingRound();
    this.setPostFlopActionOrder();

    return {
      phase: this.PHASES.RIVER,
      communityCards: this.gameState.communityCards,
      message: '河牌阶段开始'
    };
  }

  /**
   * 进入摊牌阶段
   * @returns {Object} 摊牌结果
   */
  advanceToShowdown() {
    this.gameState.phase = this.PHASES.SHOWDOWN;

    const activePlayers = this.playerManager.getActivePlayers();
    const allinPlayers = this.playerManager.getAllInPlayers();
    
    // 评估所有未弃牌玩家的手牌
    const playersInShowdown = [...activePlayers, ...allinPlayers].filter(player => !player.folded);
    
    return {
      phase: this.PHASES.SHOWDOWN,
      playersInShowdown: playersInShowdown.length,
      message: '摊牌阶段开始'
    };
  }

  /**
   * 结束当前手牌
   * @returns {Object} 结束结果
   */
  finishHand() {
    this.gameState.phase = this.PHASES.FINISHED;

    return {
      phase: this.PHASES.FINISHED,
      message: '手牌结束'
    };
  }

  /**
   * 设置翻牌后的行动顺序（小盲注开始）
   */
  setPostFlopActionOrder() {
    const playerCount = this.playerManager.getActivePlayers().length;
    
    if (playerCount <= 1) {
      return; // 不需要设置行动顺序
    }

    // 找到小盲注位置
    let smallBlindIndex;
    if (playerCount === 2) {
      smallBlindIndex = this.gameState.dealerIndex;
    } else {
      smallBlindIndex = (this.gameState.dealerIndex + 1) % this.playerManager.players.length;
    }

    // 找到第一个未弃牌的玩家（从小盲注开始）
    for (let i = 0; i < this.playerManager.players.length; i++) {
      const index = (smallBlindIndex + i) % this.playerManager.players.length;
      const player = this.playerManager.players[index];
      
      if (!player.folded && !player.allIn) {
        this.gameState.currentPlayerIndex = index;
        this.gameState.roundStartIndex = index;
        break;
      }
    }
  }

  /**
   * 获取下一个庄家位置
   * @returns {number} 庄家索引
   */
  getNextDealerIndex() {
    const playerCount = this.playerManager.players.length;
    return (this.gameState.dealerIndex + 1) % playerCount;
  }

  /**
   * 检查游戏是否应该结束
   * @returns {Object} 检查结果
   */
  checkGameEndConditions() {
    const activePlayers = this.playerManager.getActivePlayers();
    const allinPlayers = this.playerManager.getAllInPlayers();
    const playersWithChips = this.playerManager.players.filter(p => p.chips > 0 || p.allIn);

    // 只有一个玩家有筹码
    if (playersWithChips.length <= 1) {
      return {
        shouldEnd: true,
        reason: 'single_player_remaining',
        winner: playersWithChips[0] || null
      };
    }

    // 所有玩家都All-in
    if (activePlayers.length === 0 && allinPlayers.length > 1) {
      return {
        shouldEnd: false,
        reason: 'all_players_allin',
        action: 'proceed_to_showdown'
      };
    }

    // 只有一个活跃玩家
    if (activePlayers.length === 1 && allinPlayers.length === 0) {
      return {
        shouldEnd: false,
        reason: 'single_active_player',
        action: 'award_pot_to_last_player'
      };
    }

    return {
      shouldEnd: false,
      reason: 'game_continues'
    };
  }

  /**
   * 检查是否可以跳过下注轮
   * @returns {Object} 检查结果
   */
  checkSkipBettingRound() {
    const activePlayers = this.playerManager.getActivePlayers();
    const allinPlayers = this.playerManager.getAllInPlayers();

    // 没有活跃玩家，跳过
    if (activePlayers.length === 0) {
      return {
        shouldSkip: true,
        reason: 'no_active_players'
      };
    }

    // 只有一个活跃玩家
    if (activePlayers.length === 1) {
      return {
        shouldSkip: true,
        reason: 'single_active_player'
      };
    }

    return {
      shouldSkip: false,
      reason: 'multiple_active_players'
    };
  }

  /**
   * 获取当前阶段信息
   * @returns {Object} 阶段信息
   */
  getCurrentPhaseInfo() {
    const phaseNames = {
      [this.PHASES.WAITING]: '等待开始',
      [this.PHASES.PREFLOP]: '翻牌前',
      [this.PHASES.FLOP]: '翻牌',
      [this.PHASES.TURN]: '转牌',
      [this.PHASES.RIVER]: '河牌',
      [this.PHASES.SHOWDOWN]: '摊牌',
      [this.PHASES.FINISHED]: '已结束'
    };

    return {
      phase: this.gameState.phase,
      phaseName: phaseNames[this.gameState.phase] || '未知',
      communityCardsCount: this.gameState.communityCards.length,
      isPreflop: this.gameState.phase === this.PHASES.PREFLOP,
      isPostflop: [this.PHASES.FLOP, this.PHASES.TURN, this.PHASES.RIVER].includes(this.gameState.phase),
      isShowdown: this.gameState.phase === this.PHASES.SHOWDOWN,
      isFinished: this.gameState.phase === this.PHASES.FINISHED
    };
  }

  /**
   * 验证阶段转换的有效性
   * @param {string} fromPhase - 源阶段
   * @param {string} toPhase - 目标阶段
   * @returns {boolean} 是否有效
   */
  validatePhaseTransition(fromPhase, toPhase) {
    const validTransitions = {
      [this.PHASES.WAITING]: [this.PHASES.PREFLOP],
      [this.PHASES.PREFLOP]: [this.PHASES.FLOP, this.PHASES.SHOWDOWN, this.PHASES.FINISHED],
      [this.PHASES.FLOP]: [this.PHASES.TURN, this.PHASES.SHOWDOWN, this.PHASES.FINISHED],
      [this.PHASES.TURN]: [this.PHASES.RIVER, this.PHASES.SHOWDOWN, this.PHASES.FINISHED],
      [this.PHASES.RIVER]: [this.PHASES.SHOWDOWN, this.PHASES.FINISHED],
      [this.PHASES.SHOWDOWN]: [this.PHASES.FINISHED],
      [this.PHASES.FINISHED]: [this.PHASES.WAITING, this.PHASES.PREFLOP]
    };

    return validTransitions[fromPhase]?.includes(toPhase) || false;
  }

  /**
   * 重置游戏阶段（新游戏）
   */
  reset() {
    this.gameState.phase = this.PHASES.WAITING;
    this.gameState.communityCards = [];
    this.gameState.currentPlayerIndex = 0;
    this.gameState.dealerIndex = 0;
    this.gameState.roundStartIndex = 0;
  }
}

module.exports = PhaseManager;
