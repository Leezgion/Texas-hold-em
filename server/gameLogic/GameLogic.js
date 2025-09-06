const Card = require('./Card');
const Deck = require('./Deck');
const HandEvaluator = require('./HandEvaluator');

class GameLogic {
  constructor(room, io, roomManager) {
    this.room = room;
    this.io = io;
    this.roomManager = roomManager;
    this.deck = new Deck();
    this.communityCards = [];
    this.pot = 0;
    this.sidePots = [];
    this.currentBet = 0;
    this.minRaise = 0;
    this.currentPlayerIndex = 0;
    this.dealerIndex = 0;
    this.smallBlindIndex = 0;
    this.bigBlindIndex = 0;
    this.gamePhase = 'preflop'; // preflop, flop, turn, river, showdown
    this.lastRaiseIndex = -1;
    this.roundStartIndex = 0;
    this.allinPlayers = [];
    this.allinResults = [];
    this.currentAllinRound = 0;
    this.maxAllinRounds = room.settings.allinDealCount;
    
    // 倒计时相关属性
    this.playerTimer = null;
    this.timeRemaining = 0;
    this.actionTimeLimit = 60; // 60秒行动时间
  }

  // 开始新的一手牌
  startNewHand() {
    this.resetHand();
    this.dealCards();
    this.postBlinds();
    this.gamePhase = 'preflop';
    this.currentPlayerIndex = this.getNextActivePlayerIndex(this.bigBlindIndex);
    this.minRaise = this.room.settings.initialChips / 50; // 最小加注为大盲注
    
    // 处理Straddle（如果启用）
    if (this.room.settings.allowStraddle) {
      this.handleStraddle();
    }

    // 为第一个行动的玩家启动计时器
    this.startPlayerTimer();
  }

  // 重置手牌状态
  resetHand() {
    this.deck = new Deck();
    this.communityCards = [];
    this.pot = 0;
    this.sidePots = [];
    this.currentBet = 0;
    this.minRaise = 0;
    this.lastRaiseIndex = -1;
    this.roundStartIndex = 0;
    this.allinPlayers = [];
    this.allinResults = [];
    this.currentAllinRound = 0;

    // 处理等待下轮的玩家，让他们加入游戏
    this.room.players.forEach(player => {
      if (player.waitingForNextRound && player.seat !== -1) {
        console.log(`玩家 ${player.nickname} 从等待状态加入游戏`);
        player.isActive = true;
        player.waitingForNextRound = false;
      }
    });

    // 重置所有玩家状态
    this.room.players.forEach(player => {
      player.hand = [];
      player.currentBet = 0;
      player.totalBet = 0;
      player.folded = false;
      player.allIn = false;
      player.showHand = false;
    });
  }

  // 发牌
  dealCards() {
    this.room.players.forEach(player => {
      if (player.isActive) {
        player.hand = [this.deck.drawCard(), this.deck.drawCard()];
      }
    });
  }

  // 下盲注
  postBlinds() {
    const smallBlind = this.room.settings.initialChips / 100;
    const bigBlind = this.room.settings.initialChips / 50;

    // 小盲注
    this.room.players[this.smallBlindIndex].chips -= smallBlind;
    this.room.players[this.smallBlindIndex].currentBet = smallBlind;
    this.room.players[this.smallBlindIndex].totalBet = smallBlind;
    this.pot += smallBlind;

    // 大盲注
    this.room.players[this.bigBlindIndex].chips -= bigBlind;
    this.room.players[this.bigBlindIndex].currentBet = bigBlind;
    this.room.players[this.bigBlindIndex].totalBet = bigBlind;
    this.pot += bigBlind;

    this.currentBet = bigBlind;
  }

  // 处理Straddle
  handleStraddle() {
    const utgIndex = this.getNextActivePlayerIndex(this.bigBlindIndex);
    const utgPlayer = this.room.players[utgIndex];
    
    if (utgPlayer && utgPlayer.chips >= this.currentBet * 2) {
      utgPlayer.chips -= this.currentBet;
      utgPlayer.currentBet = this.currentBet * 2;
      utgPlayer.totalBet = this.currentBet * 2;
      this.pot += this.currentBet;
      this.currentBet = this.currentBet * 2;
      this.minRaise = this.currentBet;
    }
  }

  // 处理玩家动作
  handlePlayerAction(playerId, action, amount) {
    const player = this.room.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error('玩家不存在');
    }

    if (player.folded || player.allIn) {
      throw new Error('玩家已弃牌或All-in');
    }

    if (this.getCurrentPlayer().id !== playerId) {
      throw new Error('不是你的回合');
    }

    // 玩家行动时清除计时器
    this.clearPlayerTimer();

    switch (action) {
      case 'fold':
        this.fold(player);
        break;
      case 'check':
        this.check(player);
        break;
      case 'call':
        this.call(player);
        break;
      case 'raise':
        this.raise(player, amount);
        break;
      default:
        throw new Error('无效的动作');
    }

    // 检查是否需要进入下一阶段
    this.checkNextPhase();
  }

  // 弃牌
  fold(player) {
    player.folded = true;
    console.log(`玩家 ${player.nickname} 弃牌`);
    this.checkRoundCompletion();
  }

  // 过牌
  check(player) {
    if (player.currentBet < this.currentBet) {
      throw new Error('无法过牌，需要跟注或加注');
    }
    console.log(`玩家 ${player.nickname} 过牌`);
    this.checkRoundCompletion();
  }

  // 跟注
  call(player) {
    const callAmount = this.currentBet - player.currentBet;
    
    if (callAmount <= 0) {
      // 已经匹配下注，直接移动到下一个玩家
      console.log(`玩家 ${player.nickname} 已匹配下注，无需跟注`);
      this.moveToNextPlayer();
      return;
    }
    
    if (callAmount > player.chips) {
      // 筹码不足，自动All-in
      console.log(`玩家 ${player.nickname} 筹码不足，自动All-in`);
      this.allIn(player);
    } else if (callAmount === player.chips) {
      // 刚好All-in
      console.log(`玩家 ${player.nickname} 跟注All-in`);
      this.allIn(player);
    } else {
      // 正常跟注
      player.chips -= callAmount;
      player.currentBet = this.currentBet;
      player.totalBet += callAmount;
      this.pot += callAmount;
      console.log(`玩家 ${player.nickname} 跟注 ${callAmount}`);
      
      // 检查是否完成轮次
      this.checkRoundCompletion();
    }
  }

  // 加注
  raise(player, amount) {
    if (amount < this.minRaise) {
      throw new Error(`加注金额必须至少为 ${this.minRaise}`);
    }

    const totalAmount = this.currentBet + amount - player.currentBet;
    if (totalAmount > player.chips) {
      throw new Error('筹码不足');
    }

    if (totalAmount === player.chips) {
      // 加注到All-in
      console.log(`玩家 ${player.nickname} 加注All-in`);
      this.allIn(player);
    } else {
      // 正常加注
      player.chips -= totalAmount;
      const newBet = player.currentBet + totalAmount;
      player.currentBet = newBet;
      player.totalBet += totalAmount;
      this.pot += totalAmount;
      this.currentBet = newBet;
      this.minRaise = amount;
      this.lastRaiseIndex = this.currentPlayerIndex;
      this.roundStartIndex = this.currentPlayerIndex;

      console.log(`玩家 ${player.nickname} 加注到 ${newBet}`);
      this.checkRoundCompletion();
    }
  }

  // All-in
  allIn(player) {
    const allinAmount = player.chips;
    const previousBet = player.currentBet;
    
    player.chips = 0;
    player.currentBet += allinAmount;
    player.totalBet += allinAmount;
    this.pot += allinAmount;
    player.allIn = true;

    // 如果All-in金额超过当前下注，更新下注水平
    if (player.currentBet > this.currentBet) {
      this.currentBet = player.currentBet;
      this.minRaise = Math.max(this.minRaise, player.currentBet - previousBet);
      this.lastRaiseIndex = this.currentPlayerIndex;
      this.roundStartIndex = this.currentPlayerIndex;
    }

    // 将玩家添加到All-in列表
    if (!this.allinPlayers.find(p => p.id === player.id)) {
      this.allinPlayers.push(player);
    }

    console.log(`玩家 ${player.nickname} All-in ${allinAmount}，当前下注: ${this.currentBet}`);
    
    // 检查游戏状态
    this.checkGameStateAfterAllin();
  }

  // 检查轮次完成
  checkRoundCompletion() {
    console.log('\n=== 检查轮次完成状态 ===');
    console.log('当前游戏阶段:', this.gamePhase);
    console.log('当前轮到玩家索引:', this.currentPlayerIndex);
    
    const activePlayers = this.room.players.filter(p => !p.folded && !p.allIn);
    const allinPlayers = this.room.players.filter(p => !p.folded && p.allIn);
    
    console.log(`玩家状态分析:`);
    console.log(`- 活跃玩家: ${activePlayers.length}个`, activePlayers.map(p => ({ 
      name: p.nickname, 
      bet: p.currentBet, 
      chips: p.chips 
    })));
    console.log(`- All-in玩家: ${allinPlayers.length}个`, allinPlayers.map(p => ({ 
      name: p.nickname, 
      bet: p.currentBet, 
      chips: p.chips 
    })));
    
    // 如果没有活跃玩家了，说明所有人都All-in或弃牌
    if (activePlayers.length === 0) {
      if (allinPlayers.length >= 2) {
        console.log('所有剩余玩家都All-in，进入发牌阶段');
        this.handleAllInSituation();
      } else {
        console.log('只剩一个玩家，游戏结束');
        this.showdown();
      }
      console.log('=== 轮次检查完成 (无活跃玩家) ===\n');
      return;
    }
    
    // 如果只有一个活跃玩家
    if (activePlayers.length === 1) {
      const lastPlayer = activePlayers[0];
      console.log(`只有一个活跃玩家: ${lastPlayer.nickname}, 当前下注: ${lastPlayer.currentBet}, 目标下注: ${this.currentBet}`);
      
      if (lastPlayer.currentBet < this.currentBet) {
        // 最后一个玩家需要决定跟注
        this.currentPlayerIndex = this.room.players.findIndex(p => p.id === lastPlayer.id);
        console.log(`最后一个活跃玩家 ${lastPlayer.nickname} 需要决定跟注`);
        this.startPlayerTimer();
        console.log('=== 轮次检查完成 (等待玩家跟注) ===\n');
        return;
      } else {
        // 最后一个玩家已匹配下注，进入下一阶段
        console.log('最后一个活跃玩家已匹配下注，检查是否进入下一阶段');
        if (allinPlayers.length > 0) {
          this.handleAllInSituation();
        } else {
          this.nextPhase();
        }
        console.log('=== 轮次检查完成 (单玩家匹配下注) ===\n');
        return;
      }
    }
    
    // 多个活跃玩家，检查是否所有人都匹配了下注
    const hasCompletedRound = this.hasCompletedRound();
    console.log('多玩家轮次检查结果:', hasCompletedRound);
    
    if (hasCompletedRound) {
      console.log('下注轮完成，进入下一阶段');
      this.nextPhase();
    } else {
      console.log('继续下注轮');
      this.moveToNextPlayer();
    }
    console.log('=== 轮次检查完成 ===\n');
  }

  // 处理All-in情况
  handleAllInSituation() {
    console.log('\n=== 处理All-in情况 ===');
    console.log('当前游戏阶段:', this.gamePhase);
    
    const activePlayers = this.room.players.filter(p => !p.folded && !p.allIn);
    const allinPlayers = this.room.players.filter(p => !p.folded && p.allIn);
    
    console.log(`活跃玩家: ${activePlayers.length}个`);
    console.log(`All-in玩家: ${allinPlayers.length}个`);
    
    // 如果有多个玩家（All-in + 活跃），并且只剩All-in玩家，发完剩余公牌
    if (activePlayers.length === 0 && allinPlayers.length >= 2) {
      console.log('所有剩余玩家都All-in，发完剩余公牌并进入摊牌');
      this.dealRemainingCards();
      this.showdown();
    } else if (activePlayers.length === 0 && allinPlayers.length === 1) {
      console.log('只剩一个All-in玩家，直接摊牌');
      this.showdown();
    } else {
      console.log('还有活跃玩家，继续正常游戏流程');
    }
    console.log('=== All-in处理完成 ===\n');
  }

  // 检查游戏状态
  checkGameStateAfterAllin() {
    // 直接使用统一的轮次完成检查
    this.checkRoundCompletion();
  }

  // 发完剩余的公牌
  dealRemainingCards() {
    console.log(`当前阶段: ${this.gamePhase}, 公牌数量: ${this.communityCards.length}`);
    
    while (this.communityCards.length < 5) {
      this.communityCards.push(this.deck.drawCard());
      console.log(`发出公牌，现在共有 ${this.communityCards.length} 张`);
    }
    
    // 设置为河牌阶段
    this.gamePhase = 'river';
    
    // 通知所有玩家状态更新
    this.roomManager.broadcastRoomState(this.room);
  }
  // 移动到下一个玩家
  moveToNextPlayer() {
    const activePlayers = this.room.players.filter(p => !p.folded && !p.allIn);
    
    // 如果没有活跃玩家，使用统一的检查逻辑
    if (activePlayers.length === 0) {
      this.checkRoundCompletion();
      return;
    }

    // 找到下一个活跃玩家
    let nextPlayerFound = false;
    let attempts = 0;
    const maxAttempts = this.room.players.length;
    
    do {
      this.currentPlayerIndex = this.getNextActivePlayerIndex(this.currentPlayerIndex);
      attempts++;
      
      if (!this.room.players[this.currentPlayerIndex].folded && 
          !this.room.players[this.currentPlayerIndex].allIn) {
        nextPlayerFound = true;
      }
      
      // 防止无限循环
      if (attempts >= maxAttempts) {
        console.log('无法找到下一个活跃玩家，检查轮次完成');
        this.checkRoundCompletion();
        return;
      }
    } while (!nextPlayerFound);

    // 检查是否完成一轮下注
    if (this.currentPlayerIndex === this.roundStartIndex) {
      console.log('回到起始玩家，检查轮次是否完成');
      if (this.hasCompletedRound()) {
        console.log('轮次完成，进入下一阶段');
        this.nextPhase();
        return;
      }
    }

    // 为新的当前玩家启动计时器
    this.startPlayerTimer();
  }

  // 进入下一阶段
  nextPhase() {
    switch (this.gamePhase) {
      case 'preflop':
        this.dealFlop();
        break;
      case 'flop':
        this.dealTurn();
        break;
      case 'turn':
        this.dealRiver();
        break;
      case 'river':
        this.showdown();
        break;
    }
  }

  // 发翻牌
  dealFlop() {
    this.communityCards = [
      this.deck.drawCard(),
      this.deck.drawCard(),
      this.deck.drawCard()
    ];
    this.gamePhase = 'flop';
    this.resetBettingRound();
    // 通知所有玩家状态更新
    this.roomManager.broadcastRoomState(this.room);
  }

  // 发转牌
  dealTurn() {
    this.communityCards.push(this.deck.drawCard());
    this.gamePhase = 'turn';
    this.resetBettingRound();
    // 通知所有玩家状态更新
    this.roomManager.broadcastRoomState(this.room);
  }

  // 发河牌
  dealRiver() {
    this.communityCards.push(this.deck.drawCard());
    this.gamePhase = 'river';
    this.resetBettingRound();
    // 通知所有玩家状态更新
    this.roomManager.broadcastRoomState(this.room);
  }

  // 重置下注轮
  resetBettingRound() {
    this.currentBet = 0;
    this.minRaise = this.room.settings.initialChips / 50;
    this.lastRaiseIndex = -1;
    
    // 重置所有非All-in玩家的当前下注
    this.room.players.forEach(player => {
      if (!player.folded && !player.allIn) {
        player.currentBet = 0;
      }
    });
    
    // 在翻牌后阶段，第一个行动的玩家是小盲注左边的第一个活跃玩家
    if (this.gamePhase !== 'preflop') {
      this.currentPlayerIndex = this.getFirstActivePlayerAfterDealer();
    }
    
    this.roundStartIndex = this.currentPlayerIndex;
    
    // 检查是否还有活跃玩家需要行动
    const activePlayers = this.room.players.filter(p => !p.folded && !p.allIn);
    if (activePlayers.length <= 1) {
      console.log('重置下注轮时发现活跃玩家不足，直接发完剩余公牌');
      this.dealRemainingCards();
      this.showdown();
      return;
    }

    // 为当前玩家启动计时器
    this.startPlayerTimer();
  }

  // 获取庄家后的第一个活跃玩家
  getFirstActivePlayerAfterDealer() {
    let index = this.smallBlindIndex;
    while (this.room.players[index].folded || this.room.players[index].allIn) {
      index = this.getNextActivePlayerIndex(index);
      // 防止无限循环
      if (index === this.smallBlindIndex) {
        break;
      }
    }
    return index;
  }

  // 摊牌
  showdown() {
    this.gamePhase = 'showdown';
    
    // 摊牌阶段清除计时器
    this.clearPlayerTimer();
    
    // 确保所有公牌都已发出
    while (this.communityCards.length < 5) {
      this.communityCards.push(this.deck.drawCard());
    }
    
    console.log('开始摊牌阶段');
    
    // 检查是否有All-in玩家需要多次发牌
    if (this.allinPlayers.length > 0 && this.maxAllinRounds > 1) {
      this.handleAllinShowdown();
    } else {
      this.handleNormalShowdown();
    }
  }

  // 处理All-in摊牌（多次发牌）
  handleAllinShowdown() {
    this.currentAllinRound = 0;
    this.allinResults = [];
    
    console.log(`开始All-in多次发牌，总共${this.maxAllinRounds}次`);
    
    // 保存当前的牌堆状态和公牌
    const originalCommunityCards = [...this.communityCards];
    
    // 进行多次发牌
    for (let round = 0; round < this.maxAllinRounds; round++) {
      // 重新创建牌堆并发完5张公牌
      const tempDeck = new Deck();
      const tempCommunityCards = [];
      
      // 发出5张公牌
      for (let i = 0; i < 5; i++) {
        tempCommunityCards.push(tempDeck.drawCard());
      }
      
      const roundResult = this.evaluateShowdown(tempCommunityCards);
      this.allinResults.push({
        round: round + 1,
        communityCards: tempCommunityCards,
        ...roundResult
      });
      
      console.log(`第${round + 1}轮发牌完成`);
    }

    // 分配底池
    this.distributeAllinPot();
    
    // 发送结果并开始新手牌
    this.sendAllinResults();
  }

  // 发送All-in结果
  sendAllinResults() {
    // 发送All-in结果给客户端
    this.io.to(this.room.id).emit('allinResult', {
      results: this.allinResults.map((result) => ({
        round: result.round,
        winners: result.winners.map(w => w.nickname),
        communityCards: result.communityCards
      })),
      finalDistribution: this.calculateFinalDistribution()
    });
    
    // 3秒后开始下一轮
    setTimeout(() => {
      this.startNewHand();
      this.roomManager.broadcastRoomState(this.room);
    }, 3000);
  }

  // 计算最终分配
  calculateFinalDistribution() {
    const playerWins = new Map();
    
    this.allinResults.forEach(result => {
      result.winners.forEach(winner => {
        const currentWins = playerWins.get(winner.id) || 0;
        playerWins.set(winner.id, currentWins + 1);
      });
    });

    const totalRounds = this.allinResults.length;
    const originalPot = this.pot;
    
    return Array.from(playerWins.entries()).map(([playerId, wins]) => {
      const player = this.room.players.find(p => p.id === playerId);
      return {
        nickname: player.nickname,
        wins: wins,
        winnings: Math.floor((wins / totalRounds) * originalPot)
      };
    });
  }

  // 处理普通摊牌
  handleNormalShowdown() {
    const result = this.evaluateShowdown(this.communityCards);
    this.distributePot(result);
    
    // 开始新的一手牌
    setTimeout(() => {
      this.startNewHand();
    }, 3000);
  }

  // 评估摊牌结果
  evaluateShowdown(communityCards) {
    const activePlayers = this.room.players.filter(p => !p.folded);
    const playerHands = activePlayers.map(player => ({
      player: player,
      hand: HandEvaluator.evaluateHand(player.hand, communityCards)
    }));

    // 按牌力排序
    playerHands.sort((a, b) => b.hand.rank - a.hand.rank);
    
    return {
      winners: [playerHands[0].player],
      hands: playerHands,
      communityCards: communityCards
    };
  }

  // 分配底池
  distributePot(result) {
    const winner = result.winners[0];
    winner.chips += this.pot;
    this.pot = 0;
    
    // 发送结果给客户端
    this.io.to(this.room.id).emit('handResult', {
      winners: result.winners.map(w => w.nickname),
      hands: result.hands.map(h => ({
        player: h.player.nickname,
        hand: h.hand,
        cards: h.player.showHand ? h.player.hand : []
      })),
      communityCards: result.communityCards,
      pot: this.pot
    });
    
    // 3秒后开始下一轮
    setTimeout(() => {
      this.startNewHand();
      this.roomManager.broadcastRoomState(this.room);
    }, 3000);
  }

  // 分配All-in底池
  distributeAllinPot() {
    // 根据多次发牌结果计算平均赢取金额
    const playerWins = new Map();
    
    this.allinResults.forEach(result => {
      result.winners.forEach(winner => {
        const currentWins = playerWins.get(winner.id) || 0;
        playerWins.set(winner.id, currentWins + 1);
      });
    });

    // 按获胜次数分配底池
    const totalRounds = this.allinResults.length;
    const originalPot = this.pot;
    
    playerWins.forEach((wins, playerId) => {
      const player = this.room.players.find(p => p.id === playerId);
      if (player) {
        const winnings = Math.floor((wins / totalRounds) * originalPot);
        player.chips += winnings;
        console.log(`玩家 ${player.nickname} 获得 ${winnings} 筹码 (${wins}/${totalRounds} 胜率)`);
      }
    });

    this.pot = 0;
  }

  // 检查是否完成了一轮下注
  hasCompletedRound() {
    const activePlayers = this.room.players.filter(p => !p.folded && !p.allIn);
    const allinPlayers = this.room.players.filter(p => !p.folded && p.allIn);
    const foldedPlayers = this.room.players.filter(p => p.folded);
    
    console.log('详细的轮次完成检查:', {
      gamePhase: this.gamePhase,
      currentBet: this.currentBet,
      activePlayers: activePlayers.map(p => ({ 
        name: p.nickname, 
        bet: p.currentBet, 
        chips: p.chips 
      })),
      allinPlayers: allinPlayers.map(p => ({ 
        name: p.nickname, 
        bet: p.currentBet, 
        chips: p.chips 
      })),
      foldedPlayers: foldedPlayers.length,
      totalPlayers: this.room.players.length
    });
    
    // 如果没有活跃玩家，轮次完成
    if (activePlayers.length === 0) {
      console.log('没有活跃玩家，轮次完成');
      return true;
    }
    
    // 如果只有一个活跃玩家，检查其是否需要跟注
    if (activePlayers.length === 1) {
      const lastPlayer = activePlayers[0];
      if (lastPlayer.currentBet >= this.currentBet) {
        console.log('最后一个活跃玩家已匹配下注，轮次完成');
        return true;
      } else {
        console.log('最后一个活跃玩家需要决定跟注，轮次未完成');
        return false;
      }
    }
    
    // 所有活跃玩家的下注必须相等
    const targetBet = this.currentBet;
    const allBetsEqual = activePlayers.every(player => player.currentBet === targetBet);
    
    console.log('多玩家下注检查:', { 
      targetBet, 
      allBetsEqual,
      playerBets: activePlayers.map(p => ({ name: p.nickname, bet: p.currentBet }))
    });
    
    if (!allBetsEqual) {
      console.log('下注不相等，轮次未完成');
      return false;
    }
    
    console.log('所有检查通过，轮次完成');
    return true;
  }

  // 检查下一阶段
  checkNextPhase() {
    const activePlayers = this.room.players.filter(p => !p.folded && !p.allIn);
    
    if (activePlayers.length === 0) {
      // 没有活跃玩家，进入下一阶段
      this.nextPhase();
    } else if (activePlayers.length === 1) {
      // 只剩一个玩家，直接获胜
      this.handleLastPlayerStanding(activePlayers[0]);
    }
    // 注意：不在这里检查是否回到起始玩家，这个检查在moveToNextPlayer中进行
  }

  // 处理最后一个站立的玩家
  handleLastPlayerStanding(player) {
    player.chips += this.pot;
    this.pot = 0;
    
    this.io.to(this.room.id).emit('handResult', {
      winners: [player.nickname],
      hands: [],
      communityCards: this.communityCards,
      pot: 0,
      reason: '其他玩家全部弃牌'
    });
    
    setTimeout(() => {
      this.startNewHand();
    }, 3000);
  }

  // 获取下一个活跃玩家索引
  getNextActivePlayerIndex(currentIndex) {
    let nextIndex = (currentIndex + 1) % this.room.players.length;
    let attempts = 0;
    while ((this.room.players[nextIndex].folded || !this.room.players[nextIndex].isActive) && attempts < this.room.players.length) {
      nextIndex = (nextIndex + 1) % this.room.players.length;
      attempts++;
    }
    return nextIndex;
  }

  // 获取当前玩家
  getCurrentPlayer() {
    return this.room.players[this.currentPlayerIndex];
  }

  // 检查玩家是否在当前手牌中
  isPlayerInCurrentHand(player) {
    return !player.folded && !player.allIn;
  }

  // 处理玩家断开连接
  handlePlayerDisconnect(playerId) {
    const player = this.room.players.find(p => p.id === playerId);
    if (player && this.isPlayerInCurrentHand(player)) {
      player.folded = true;
      this.checkNextPhase();
    }
  }

  // 获取游戏状态
  getGameState() {
    const bigBlind = this.room.settings.initialChips / 50;
    const smallBlind = this.room.settings.initialChips / 100;
    
    return {
      phase: this.gamePhase,
      communityCards: this.communityCards,
      pot: this.pot,
      currentBet: this.currentBet,
      minRaise: this.minRaise,
      bigBlind: bigBlind,
      smallBlind: smallBlind,
      currentPlayerIndex: this.currentPlayerIndex,
      dealerIndex: this.dealerIndex,
      smallBlindIndex: this.smallBlindIndex,
      bigBlindIndex: this.bigBlindIndex,
      allinPlayers: this.allinPlayers.map(p => p.nickname),
      allinResults: this.allinResults,
      timeRemaining: this.timeRemaining
    };
  }

  // 检查游戏是否正在进行中
  isGameInProgress() {
    // 如果没有游戏实例，说明游戏还没开始
    if (!this) return false;
    
    // 检查游戏阶段
    const gamePhases = ['preflop', 'flop', 'turn', 'river', 'showdown'];
    return gamePhases.includes(this.gamePhase);
  }

  // 启动玩家行动计时器
  startPlayerTimer() {
    this.clearPlayerTimer(); // 清除之前的计时器
    this.timeRemaining = this.actionTimeLimit;
    
    console.log(`为玩家 ${this.getCurrentPlayer().nickname} 启动 ${this.actionTimeLimit} 秒计时器`);
    
    // 立即广播计时器状态
    this.broadcastTimerUpdate();
    
    this.playerTimer = setInterval(() => {
      this.timeRemaining--;
      
      // 每秒广播倒计时更新
      this.broadcastTimerUpdate();
      
      if (this.timeRemaining <= 0) {
        console.log(`玩家 ${this.getCurrentPlayer().nickname} 操作超时，执行自动行动`);
        this.handlePlayerTimeout();
      }
    }, 1000);
  }

  // 清除计时器
  clearPlayerTimer() {
    if (this.playerTimer) {
      clearInterval(this.playerTimer);
      this.playerTimer = null;
    }
    this.timeRemaining = 0;
  }

  // 广播计时器更新
  broadcastTimerUpdate() {
    const currentPlayer = this.getCurrentPlayer();
    if (currentPlayer) {
      this.roomManager.broadcastRoomState(this.room);
    }
  }

  // 处理玩家超时
  handlePlayerTimeout() {
    this.clearPlayerTimer();
    
    const currentPlayer = this.getCurrentPlayer();
    if (!currentPlayer || currentPlayer.folded || currentPlayer.allIn) {
      return;
    }

    console.log(`处理玩家 ${currentPlayer.nickname} 超时行动`);

    // 根据德州扑克规则决定自动行动
    const canCheck = currentPlayer.currentBet >= this.currentBet;
    
    if (canCheck) {
      // 可以过牌时自动过牌
      console.log(`玩家 ${currentPlayer.nickname} 超时自动过牌`);
      this.check(currentPlayer);
    } else {
      // 不能过牌时自动弃牌
      console.log(`玩家 ${currentPlayer.nickname} 超时自动弃牌`);
      this.fold(currentPlayer);
    }

    // 广播状态更新
    this.roomManager.broadcastRoomState(this.room);
  }
}

module.exports = GameLogic; 