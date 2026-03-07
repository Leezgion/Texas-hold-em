const Deck = require('./Deck');
const HandEvaluator = require('./HandEvaluator');
const HandRecordBuilder = require('./HandRecordBuilder');
const PotManager = require('./managers/PotManager');
const { GAME_PHASES, REVEAL_MODES, REVEAL_POLICIES, ROOM_STATES } = require('../types/GameTypes');

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
    this.currentPlayerIndex = -1;
    this.dealerIndex = -1;
    this.smallBlindIndex = -1;
    this.bigBlindIndex = -1;
    this.roundStartIndex = -1;
    this.lastRaiseIndex = -1;
    this.gamePhase = GAME_PHASES.WAITING;
    this.lastAction = null;
    this.actionHistory = [];
    this.handHistory = [];
    this.handNumber = 0;
    this.handStartedAt = 0;
    this.playersToAct = new Set();
    this.allinResults = [];
    this.pendingSettlementSnapshot = null;
    this.settlementWindowEndsAt = null;
    this.eligibleRevealPlayerIds = new Set();
    this.participantRevealPlayerIds = new Set();
    this.revealLocked = false;

    this.playerTimer = null;
    this.timeRemaining = 0;
    this.actionTimeLimit = 60;
    this.nextHandTimeout = null;
  }

  startNewHand() {
    this.clearPlayerTimer();
    this.clearNextHandTimeout();
    this.clearSettlementState();

    this.handNumber += 1;
    this.handStartedAt = Date.now();
    this.lastAction = null;
    this.actionHistory = [];
    this.allinResults = [];
    this.communityCards = [];
    this.currentBet = 0;
    this.minRaise = this.getBigBlind();
    this.currentPlayerIndex = -1;
    this.roundStartIndex = -1;
    this.lastRaiseIndex = -1;
    this.playersToAct = new Set();
    this.deck = new Deck();

    this.preparePlayersForNewHand();
    const eligibleIndices = this.getEligiblePlayerIndices();

    if (eligibleIndices.length < 2) {
      this.gamePhase = GAME_PHASES.WAITING;
      this.room.roomState = ROOM_STATES.IDLE;
      this.refreshPotState();
      return false;
    }

    eligibleIndices.forEach((playerIndex) => {
      const player = this.room.players[playerIndex];
      player.inHand = true;
      player.isActive = true;
      player.folded = false;
      player.allIn = false;
      player.showHand = false;
      player.revealMode = REVEAL_MODES.HIDE;
      player.revealedCardIndices = [];
      player.currentBet = 0;
      player.totalBet = 0;
      player.hand = [];
      player.lastAction = null;
    });

    this.dealerIndex = this.resolveNextDealerIndex(eligibleIndices);
    this.assignBlindIndices(eligibleIndices);
    this.dealHoleCards(eligibleIndices);
    this.postBlinds();

    let actionStartIndex = this.getNextIndexFromList(this.bigBlindIndex, eligibleIndices);
    if (this.room.settings.allowStraddle && eligibleIndices.length > 2) {
      const straddleIndex = this.tryAutoStraddle(actionStartIndex);
      if (straddleIndex !== -1) {
        actionStartIndex = this.getNextIndexFromList(straddleIndex, eligibleIndices);
      }
    }

    this.gamePhase = GAME_PHASES.PREFLOP;
    this.room.roomState = ROOM_STATES.IN_HAND;
    this.setupActionQueue(actionStartIndex);

    if (this.currentPlayerIndex === -1) {
      this.handleCompletedRound();
    } else {
      this.startPlayerTimer();
    }

    return true;
  }

  preparePlayersForNewHand() {
    this.room.players = this.room.players.filter((player) => !player.hasLeftRoom);

    this.room.players.forEach((player) => {
      if (player.waitingForNextRound && this.canPlayerJoinHand(player)) {
        player.waitingForNextRound = false;
      }

      player.hand = [];
      player.currentBet = 0;
      player.totalBet = 0;
      player.folded = false;
      player.allIn = false;
      player.showHand = false;
      player.revealMode = REVEAL_MODES.HIDE;
      player.revealedCardIndices = [];
      player.inHand = false;
      player.lastAction = null;

      const readyForTable =
        player.seat !== -1 &&
        !player.isSpectator &&
        !player.waitingForNextRound &&
        !player.disconnected &&
        player.chips > 0;

      player.isActive = readyForTable;

      if (player.ledger) {
        player.ledger.handStartChips = player.chips;
        player.ledger.handDelta = 0;
        player.ledger.showdownDelta = 0;
      }
    });
  }

  canPlayerJoinHand(player) {
    return player.seat !== -1 && !player.isSpectator && !player.disconnected && player.chips > 0;
  }

  getEligiblePlayerIndices() {
    return this.room.players
      .map((player, index) => ({ player, index }))
      .filter(({ player }) => this.canPlayerJoinHand(player) && !player.waitingForNextRound)
      .sort((a, b) => a.player.seat - b.player.seat)
      .map(({ index }) => index);
  }

  resolveNextDealerIndex(eligibleIndices) {
    if (!eligibleIndices.length) {
      return -1;
    }

    if (this.dealerIndex === -1) {
      return eligibleIndices[0];
    }

    return this.getNextIndexFromList(this.dealerIndex, eligibleIndices);
  }

  assignBlindIndices(eligibleIndices) {
    if (eligibleIndices.length === 2) {
      this.smallBlindIndex = this.dealerIndex;
      this.bigBlindIndex = this.getNextIndexFromList(this.smallBlindIndex, eligibleIndices);
      return;
    }

    this.smallBlindIndex = this.getNextIndexFromList(this.dealerIndex, eligibleIndices);
    this.bigBlindIndex = this.getNextIndexFromList(this.smallBlindIndex, eligibleIndices);
  }

  dealHoleCards(eligibleIndices) {
    const firstCardIndex = this.getNextIndexFromList(this.dealerIndex, eligibleIndices);
    const order = this.rotateOrderedIndices(eligibleIndices, firstCardIndex);

    for (let round = 0; round < 2; round++) {
      order.forEach((playerIndex) => {
        this.room.players[playerIndex].hand.push(this.deck.drawCard());
      });
    }
  }

  postBlinds() {
    const smallBlind = this.getSmallBlind();
    const bigBlind = this.getBigBlind();

    this.commitChips(this.smallBlindIndex, smallBlind);
    this.commitChips(this.bigBlindIndex, bigBlind);

    this.currentBet = Math.max(
      this.room.players[this.smallBlindIndex]?.currentBet || 0,
      this.room.players[this.bigBlindIndex]?.currentBet || 0
    );
    this.minRaise = bigBlind;
    this.lastRaiseIndex = this.bigBlindIndex;
    this.refreshPotState();
  }

  tryAutoStraddle(utgIndex) {
    const player = this.room.players[utgIndex];
    if (!player || player.chips < this.currentBet) {
      return -1;
    }

    const previousBet = this.currentBet;
    this.commitChips(utgIndex, previousBet);
    this.currentBet = player.currentBet;
    this.minRaise = Math.max(this.getBigBlind(), this.currentBet - previousBet);
    this.lastRaiseIndex = utgIndex;

    this.recordAction(utgIndex, 'raise', this.currentBet - previousBet, {
      auto: true,
      label: 'straddle',
      totalBet: player.currentBet,
    });
    this.refreshPotState();
    return utgIndex;
  }

  setupActionQueue(startIndex) {
    const actionableIndices = this.getActionablePlayerIndices();
    this.playersToAct = new Set(actionableIndices);
    this.currentPlayerIndex = this.getPendingPlayerFrom(startIndex);
    this.roundStartIndex = this.currentPlayerIndex;
  }

  handlePlayerAction(playerId, action, amount = 0) {
    const playerIndex = this.room.players.findIndex((player) => player.id === playerId);
    if (playerIndex === -1) {
      throw new Error('玩家不存在');
    }

    const player = this.room.players[playerIndex];
    if (!player.inHand || player.folded || player.allIn) {
      throw new Error('玩家当前无法行动');
    }

    if (this.currentPlayerIndex !== playerIndex) {
      throw new Error('不是你的回合');
    }

    this.clearPlayerTimer();

    let actionResult;
    switch (action) {
      case 'fold':
        actionResult = this.applyFold(playerIndex);
        break;
      case 'check':
        actionResult = this.applyCheck(playerIndex);
        break;
      case 'call':
        actionResult = this.applyCall(playerIndex);
        break;
      case 'raise':
        actionResult = this.applyRaise(playerIndex, amount);
        break;
      case 'allin':
        actionResult = this.applyAllIn(playerIndex);
        break;
      default:
        throw new Error('无效的动作');
    }

    this.refreshPotState();
    this.updatePendingPlayersAfterAction(playerIndex, actionResult.reopensAction);
    this.advanceGameFlow(playerIndex);
  }

  applyFold(playerIndex, meta = {}) {
    const player = this.room.players[playerIndex];
    player.folded = true;
    player.isActive = false;
    this.recordAction(playerIndex, 'fold', 0, meta);
    return { reopensAction: false };
  }

  applyCheck(playerIndex, meta = {}) {
    const player = this.room.players[playerIndex];
    const toCall = this.getAmountToCall(player);
    if (toCall > 0) {
      throw new Error('当前不能过牌');
    }

    this.recordAction(playerIndex, 'check', 0, meta);
    return { reopensAction: false };
  }

  applyCall(playerIndex, meta = {}) {
    const player = this.room.players[playerIndex];
    const toCall = this.getAmountToCall(player);
    if (toCall <= 0) {
      return this.applyCheck(playerIndex, meta);
    }

    const committed = this.commitChips(playerIndex, Math.min(player.chips, toCall));
    const actionName = player.allIn ? 'allin' : 'call';
    this.recordAction(playerIndex, actionName, committed, {
      ...meta,
      totalBet: player.currentBet,
      callAmount: committed,
    });

    return { reopensAction: false };
  }

  applyRaise(playerIndex, raiseAmount, meta = {}) {
    const player = this.room.players[playerIndex];
    if (!Number.isInteger(raiseAmount) || raiseAmount <= 0) {
      throw new Error('加注金额必须是正整数');
    }

    const toCall = this.getAmountToCall(player);
    const totalCommit = toCall + raiseAmount;
    if (totalCommit > player.chips) {
      throw new Error('筹码不足');
    }

    if (raiseAmount < this.minRaise) {
      throw new Error(`加注金额必须至少为 ${this.minRaise}`);
    }

    const previousBet = this.currentBet;
    const committed = this.commitChips(playerIndex, totalCommit);
    const newBet = player.currentBet;
    const raiseDelta = newBet - previousBet;

    this.currentBet = newBet;
    this.minRaise = raiseDelta;
    this.lastRaiseIndex = playerIndex;

    this.recordAction(playerIndex, player.allIn ? 'allin' : 'raise', raiseDelta, {
      ...meta,
      totalBet: player.currentBet,
      committed,
    });

    return { reopensAction: true };
  }

  applyAllIn(playerIndex, meta = {}) {
    const player = this.room.players[playerIndex];
    if (player.chips <= 0) {
      throw new Error('玩家没有可用筹码');
    }

    const previousBet = this.currentBet;
    const previousPlayerBet = player.currentBet;
    const committed = this.commitChips(playerIndex, player.chips);
    const newBet = player.currentBet;
    const raiseDelta = newBet - previousBet;
    const fullRaise = newBet > previousBet && raiseDelta >= this.minRaise;

    if (newBet > previousBet) {
      this.currentBet = newBet;
      if (fullRaise) {
        this.minRaise = raiseDelta;
        this.lastRaiseIndex = playerIndex;
      }
    }

    this.recordAction(playerIndex, 'allin', committed, {
      ...meta,
      totalBet: player.currentBet,
      previousPlayerBet,
      reopensAction: fullRaise,
    });

    return { reopensAction: fullRaise };
  }

  commitChips(playerIndex, amount) {
    const player = this.room.players[playerIndex];
    const committed = Math.min(player.chips, amount);

    player.chips -= committed;
    player.currentBet += committed;
    player.totalBet += committed;
    if (player.chips === 0) {
      player.allIn = true;
      player.isActive = false;
    }

    return committed;
  }

  getAmountToCall(player) {
    return Math.max(0, this.currentBet - player.currentBet);
  }

  updatePendingPlayersAfterAction(playerIndex, reopensAction) {
    this.playersToAct.delete(playerIndex);

    if (reopensAction) {
      const actionablePlayers = this.getActionablePlayerIndices().filter((index) => index !== playerIndex);
      this.playersToAct = new Set(actionablePlayers);
      return;
    }

    [...this.playersToAct].forEach((index) => {
      if (!this.isPlayerActionable(this.room.players[index])) {
        this.playersToAct.delete(index);
      }
    });
  }

  advanceGameFlow(actorIndex) {
    if (this.getContestingPlayerIndices().length === 1) {
      this.awardPotToLastPlayer();
      return;
    }

    if (this.playersToAct.size === 0) {
      this.handleCompletedRound();
      return;
    }

    this.currentPlayerIndex = this.getNextIndexFromList(actorIndex, this.getPendingPlayerIndices());
    if (this.currentPlayerIndex === -1) {
      this.handleCompletedRound();
      return;
    }

    this.startPlayerTimer();
  }

  handleCompletedRound() {
    this.clearPlayerTimer();

    if (this.getContestingPlayerIndices().length === 1) {
      this.awardPotToLastPlayer();
      return;
    }

    if (this.gamePhase === GAME_PHASES.RIVER) {
      this.showdown();
      return;
    }

    this.advanceToNextPhase();
  }

  advanceToNextPhase() {
    switch (this.gamePhase) {
      case GAME_PHASES.PREFLOP:
        this.dealFlop();
        break;
      case GAME_PHASES.FLOP:
        this.dealTurn();
        break;
      case GAME_PHASES.TURN:
        this.dealRiver();
        break;
      default:
        this.showdown();
        return;
    }

    this.prepareBettingRoundAfterStreet();
    if (this.currentPlayerIndex === -1) {
      this.handleCompletedRound();
    } else {
      this.startPlayerTimer();
    }
  }

  dealFlop() {
    this.burnCard();
    this.communityCards.push(this.deck.drawCard(), this.deck.drawCard(), this.deck.drawCard());
    this.gamePhase = GAME_PHASES.FLOP;
  }

  dealTurn() {
    this.burnCard();
    this.communityCards.push(this.deck.drawCard());
    this.gamePhase = GAME_PHASES.TURN;
  }

  dealRiver() {
    this.burnCard();
    this.communityCards.push(this.deck.drawCard());
    this.gamePhase = GAME_PHASES.RIVER;
  }

  prepareBettingRoundAfterStreet() {
    this.currentBet = 0;
    this.minRaise = this.getBigBlind();
    this.roundStartIndex = -1;
    this.lastRaiseIndex = -1;

    this.room.players.forEach((player) => {
      player.currentBet = 0;
    });

    const actionableIndices = this.getActionablePlayerIndices();
    if (actionableIndices.length <= 1) {
      this.playersToAct = new Set();
      this.currentPlayerIndex = -1;
      return;
    }

    this.playersToAct = new Set(actionableIndices);
    const startIndex = this.getNextIndexFromList(this.dealerIndex, actionableIndices);
    this.currentPlayerIndex = this.getPendingPlayerFrom(startIndex);
    this.roundStartIndex = this.currentPlayerIndex;
  }

  showdown() {
    this.clearPlayerTimer();
    this.gamePhase = GAME_PHASES.SHOWDOWN;
    this.currentPlayerIndex = -1;
    this.playersToAct = new Set();
    this.currentBet = 0;

    const contenders = this.getContestingPlayerIndices();
    if (contenders.length <= 1) {
      this.awardPotToLastPlayer();
      return;
    }

    const pendingRunouts =
      this.getContestingPlayerIndices().every((index) => this.room.players[index].allIn) &&
      this.communityCards.length < 5 &&
      (this.room.settings.allinDealCount || 1) > 1;

    if (pendingRunouts) {
      this.handleMultiRunoutShowdown();
      return;
    }

    this.completeBoardToRiver(this.deck, this.communityCards);
    const result = this.evaluateShowdown(this.communityCards);
    const { pots, winnings, totalPot } = this.distributePotsAcrossBoards([{ result, communityCards: [...this.communityCards] }]);

    this.emitHandResult({
      boardResult: result,
      winnings,
      pots,
      totalPot,
    });
    this.beginSettlement({
      eligibleRevealPlayerIds: result.hands.map((entry) => entry.player.id),
    });
    this.scheduleNextHand();
  }

  handleMultiRunoutShowdown() {
    const runCount = Math.max(1, this.room.settings.allinDealCount || 1);
    const deckStub = this.createDeckStub(this.deck.cards);
    const boards = [];

    for (let round = 0; round < runCount; round++) {
      const communityCards = [...this.communityCards];
      this.completeBoardToRiver(deckStub, communityCards);
      boards.push({
        round: round + 1,
        communityCards,
        result: this.evaluateShowdown(communityCards),
      });
    }

    const { pots, winnings, totalPot } = this.distributePotsAcrossBoards(boards);
    this.communityCards = [...boards[0].communityCards];
    this.allinResults = boards.map((board) => ({
      round: board.round,
      winners: board.result.winners.map((winner) => winner.nickname),
      communityCards: board.communityCards,
    }));
    this.captureHandRecord({
      communityCards: boards[0]?.communityCards || [...this.communityCards],
      pots,
      winners: this.buildFinalDistribution(winnings),
      totalPot,
      reason: 'multiple_runouts',
      boardResults: boards.map((board) => ({
        round: board.round,
        communityCards: board.communityCards,
        winners: board.result.winners.map((winner) => ({
          playerId: winner.id,
          nickname: winner.nickname,
        })),
      })),
    });
    this.beginSettlement({
      eligibleRevealPlayerIds: boards[0]?.result?.hands.map((entry) => entry.player.id) || [],
      reason: 'multiple_runouts',
    });

    this.io.to(this.room.id).emit('allinResult', {
      results: this.allinResults,
      finalDistribution: this.buildFinalDistribution(winnings),
      totalPot,
      pots: pots.map((pot) => ({
        id: pot.id,
        amount: pot.amount,
        eligiblePlayers: pot.eligiblePlayers,
      })),
    });

    this.scheduleNextHand();
  }

  distributePotsAcrossBoards(boards) {
    const potManager = new PotManager({ pot: this.pot, sidePots: this.sidePots }, { players: this.room.players });
    const pots = potManager.calculatePots(this.room.players);
    const totalPot = pots.reduce((sum, pot) => sum + pot.amount, 0);
    const winnings = new Map(this.room.players.map((player) => [player.id, 0]));

    pots.forEach((pot) => {
      const boardShares = this.splitAmountEvenly(pot.amount, boards.length);
      boardShares.forEach((share, boardIndex) => {
        if (share <= 0) {
          return;
        }

        const board = boards[boardIndex];
        const eligibleHands = board.result.hands.filter((hand) => pot.eligiblePlayers.includes(hand.player.id));
        const winningHands = this.findWinningHands(eligibleHands);
        this.distributeAmountToWinners(share, winningHands, winnings);
      });
    });

    winnings.forEach((amount, playerId) => {
      const player = this.room.players.find((entry) => entry.id === playerId);
      if (player) {
        player.chips += amount;
      }
    });

    this.pot = 0;
    this.sidePots = [];
    this.currentBet = 0;
    return { pots, winnings, totalPot };
  }

  findWinningHands(hands) {
    if (!hands.length) {
      return [];
    }

    const sorted = [...hands].sort((a, b) => HandEvaluator.compareHands(b.hand, a.hand));
    const best = sorted[0];
    return sorted.filter((entry) => HandEvaluator.compareHands(entry.hand, best.hand) === 0);
  }

  distributeAmountToWinners(amount, winners, winnings) {
    if (!winners.length) {
      return;
    }

    const share = Math.floor(amount / winners.length);
    const remainder = amount % winners.length;

    winners.forEach((winner) => {
      winnings.set(winner.player.id, (winnings.get(winner.player.id) || 0) + share);
    });

    if (remainder > 0) {
      const oddChipWinner = this.findClosestWinnerToSmallBlind(winners);
      if (oddChipWinner) {
        winnings.set(oddChipWinner.player.id, (winnings.get(oddChipWinner.player.id) || 0) + remainder);
      }
    }
  }

  findClosestWinnerToSmallBlind(winners) {
    if (winners.length <= 1) {
      return winners[0] || null;
    }

    const startSeat = this.room.players[this.smallBlindIndex]?.seat ?? 0;
    return winners
      .map((winner) => ({
        winner,
        distance: this.calculateSeatDistance(startSeat, winner.player.seat),
      }))
      .sort((a, b) => a.distance - b.distance)[0].winner;
  }

  buildFinalDistribution(winnings) {
    return this.room.players
      .map((player) => ({
        playerId: player.id,
        nickname: player.nickname,
        winnings: winnings.get(player.id) || 0,
      }))
      .filter((player) => player.winnings > 0);
  }

  ensurePlayerLedger(player) {
    if (player.ledger) {
      return player.ledger;
    }

    const initialBuyIn = this.room.settings.initialChips || player.chips;
    player.ledger = {
      initialBuyIn,
      rebuyTotal: 0,
      totalBuyIn: initialBuyIn,
      currentChips: player.chips,
      sessionNet: player.chips - initialBuyIn,
      handStartChips: player.chips,
      handDelta: 0,
      showdownDelta: 0,
    };

    return player.ledger;
  }

  syncPlayerLedgersForSettlement() {
    this.room.players.forEach((player) => {
      if (this.roomManager?.syncPlayerLedger) {
        this.roomManager.syncPlayerLedger(player);
      } else {
        const ledger = this.ensurePlayerLedger(player);
        const totalBuyIn = ledger.initialBuyIn + ledger.rebuyTotal;
        const handStartChips = ledger.handStartChips ?? player.chips;

        player.ledger = {
          ...ledger,
          totalBuyIn,
          currentChips: player.chips,
          sessionNet: player.chips - totalBuyIn,
          handStartChips,
          handDelta: player.chips - handStartChips,
          showdownDelta: player.chips - handStartChips,
        };
      }

      if (player.ledger) {
        player.ledger.showdownDelta = player.ledger.handDelta;
      }
    });
  }

  getLastHandParticipantIds() {
    return this.room.players.filter((player) => player.inHand).map((player) => player.id);
  }

  beginSettlement({ eligibleRevealPlayerIds = [], reason = null } = {}) {
    this.clearPlayerTimer();
    this.room.roomState = ROOM_STATES.SETTLING;
    this.revealLocked = false;
    this.room.revealLocked = false;
    this.participantRevealPlayerIds = new Set(this.getLastHandParticipantIds());
    this.eligibleRevealPlayerIds = new Set(eligibleRevealPlayerIds);
    this.room.eligibleRevealPlayerIds = [...this.eligibleRevealPlayerIds];
    this.settlementWindowEndsAt = Date.now() + (this.room.settings.settleMs ?? 3000);
    this.room.settlementWindowEndsAt = this.settlementWindowEndsAt;
    this.room.settlementReason = reason;

    this.room.players.forEach((player) => {
      player.showHand = false;
      player.revealMode = REVEAL_MODES.HIDE;
      player.revealedCardIndices = [];
    });

    this.refreshCapturedHandRecord();
  }

  canPlayerReveal(playerId) {
    if (this.room.roomState !== ROOM_STATES.SETTLING || this.revealLocked) {
      return false;
    }

    if (this.room.settings.revealPolicy === REVEAL_POLICIES.FREE_REVEAL_AFTER_HAND) {
      return this.participantRevealPlayerIds.has(playerId);
    }

    return this.eligibleRevealPlayerIds.has(playerId);
  }

  handleRevealSelection(playerId, mode, cardIndex = null) {
    const player = this.room.players.find((entry) => entry.id === playerId);
    if (!player || !this.canPlayerReveal(playerId)) {
      throw new Error('玩家当前无法亮牌');
    }

    switch (mode) {
      case REVEAL_MODES.HIDE:
        player.showHand = false;
        player.revealMode = REVEAL_MODES.HIDE;
        player.revealedCardIndices = [];
        break;
      case REVEAL_MODES.SHOW_ONE:
        if (![0, 1].includes(cardIndex) || !player.hand?.[cardIndex]) {
          throw new Error('请选择要展示的手牌');
        }
        player.showHand = true;
        player.revealMode = REVEAL_MODES.SHOW_ONE;
        player.revealedCardIndices = [cardIndex];
        break;
      case REVEAL_MODES.SHOW_ALL:
        player.showHand = true;
        player.revealMode = REVEAL_MODES.SHOW_ALL;
        player.revealedCardIndices = [0, 1].filter((index) => Boolean(player.hand?.[index]));
        break;
      default:
        throw new Error('无效的亮牌动作');
    }

    this.refreshCapturedHandRecord();
  }

  lockSettlementReveals() {
    this.revealLocked = true;
    this.room.revealLocked = true;
    this.refreshCapturedHandRecord();
  }

  clearSettlementState() {
    this.pendingSettlementSnapshot = null;
    this.settlementWindowEndsAt = null;
    this.eligibleRevealPlayerIds = new Set();
    this.participantRevealPlayerIds = new Set();
    this.revealLocked = false;
    this.room.settlementWindowEndsAt = null;
    this.room.eligibleRevealPlayerIds = [];
    this.room.revealLocked = false;
    this.room.settlementReason = null;
  }

  captureHandRecord({ communityCards, pots = [], winners = [], totalPot = 0, reason = null, boardResults = [] }) {
    this.pendingSettlementSnapshot = {
      communityCards: [...communityCards],
      pots: pots.map((pot) => ({
        ...pot,
        eligiblePlayers: [...(pot.eligiblePlayers || [])],
      })),
      winners: winners.map((winner) => ({ ...winner })),
      totalPot,
      reason,
      boardResults: boardResults.map((board) => ({
        ...board,
        communityCards: [...(board.communityCards || [])],
        winners: (board.winners || []).map((winner) => ({ ...winner })),
      })),
    };

    return this.refreshCapturedHandRecord();
  }

  refreshCapturedHandRecord() {
    if (!this.pendingSettlementSnapshot) {
      return null;
    }

    this.syncPlayerLedgersForSettlement();

    const handRecord = HandRecordBuilder.buildHandRecord({
      handNumber: this.handNumber,
      startedAt: this.handStartedAt,
      endedAt: Date.now(),
      totalPot: this.pendingSettlementSnapshot.totalPot,
      reason: this.pendingSettlementSnapshot.reason,
      players: this.room.players,
      actions: this.actionHistory,
      communityCards: this.pendingSettlementSnapshot.communityCards,
      pots: this.pendingSettlementSnapshot.pots,
      winners: this.pendingSettlementSnapshot.winners,
      boardResults: this.pendingSettlementSnapshot.boardResults,
    });

    const existingIndex = this.handHistory.findIndex((record) => record.handNumber === this.handNumber);
    if (existingIndex === -1) {
      this.handHistory.push(handRecord);
    } else {
      this.handHistory.splice(existingIndex, 1, handRecord);
    }

    return handRecord;
  }

  emitHandResult({ boardResult, winnings, pots, totalPot, reason = null }) {
    const winners = this.buildFinalDistribution(winnings);
    this.captureHandRecord({
      communityCards: boardResult.communityCards,
      pots,
      winners,
      totalPot,
      reason,
    });

    this.io.to(this.room.id).emit('handResult', {
      winners: winners.map((winner) => winner.nickname),
      winnings: winners,
      hands: boardResult.hands.map((entry) => ({
        player: entry.player.nickname,
        hand: entry.hand,
        cards: entry.player.showHand || winners.some((winner) => winner.nickname === entry.player.nickname) ? entry.player.hand : [],
      })),
      communityCards: boardResult.communityCards,
      pots: pots.map((pot) => ({
        id: pot.id,
        amount: pot.amount,
        eligiblePlayers: pot.eligiblePlayers,
      })),
      totalPot,
      pot: totalPot,
      reason,
    });
  }

  awardPotToLastPlayer() {
    const winnerIndex = this.getContestingPlayerIndices()[0];
    if (winnerIndex === undefined) {
      return;
    }

    this.clearPlayerTimer();
    const winner = this.room.players[winnerIndex];
    const totalPot = this.room.players.reduce((sum, player) => sum + player.totalBet, 0);
    winner.chips += totalPot;

    this.room.players.forEach((player) => {
      player.totalBet = 0;
      player.currentBet = 0;
    });

    this.pot = 0;
    this.sidePots = [];
    this.currentBet = 0;
    this.currentPlayerIndex = -1;
    this.playersToAct = new Set();
    this.gamePhase = GAME_PHASES.SHOWDOWN;
    const winners = [{ playerId: winner.id, nickname: winner.nickname, winnings: totalPot }];
    this.captureHandRecord({
      communityCards: [...this.communityCards],
      pots: [],
      winners,
      totalPot,
      reason: '其他玩家全部弃牌',
    });
    this.beginSettlement({
      eligibleRevealPlayerIds: [winner.id],
      reason: '其他玩家全部弃牌',
    });

    this.io.to(this.room.id).emit('handResult', {
      winners: [winner.nickname],
      winnings: winners,
      hands: [],
      communityCards: [...this.communityCards],
      pots: [],
      totalPot,
      pot: totalPot,
      reason: '其他玩家全部弃牌',
    });

    this.scheduleNextHand();
  }

  evaluateShowdown(communityCards) {
    const activePlayers = this.room.players.filter((player) => player.inHand && !player.folded);
    const hands = activePlayers.map((player) => ({
      player,
      hand: HandEvaluator.evaluateHand(player.hand, communityCards),
    }));

    hands.sort((a, b) => HandEvaluator.compareHands(b.hand, a.hand));
    const winners = this.findWinningHands(hands).map((entry) => entry.player);

    return {
      winners,
      hands,
      communityCards,
    };
  }

  splitAmountEvenly(amount, parts) {
    const base = Math.floor(amount / parts);
    const remainder = amount % parts;
    return Array.from({ length: parts }, (_, index) => base + (index < remainder ? 1 : 0));
  }

  completeBoardToRiver(deck, communityCards) {
    if (communityCards.length === 0) {
      this.burnFromDeck(deck);
      communityCards.push(deck.drawCard(), deck.drawCard(), deck.drawCard());
    }

    if (communityCards.length === 3) {
      this.burnFromDeck(deck);
      communityCards.push(deck.drawCard());
    }

    if (communityCards.length === 4) {
      this.burnFromDeck(deck);
      communityCards.push(deck.drawCard());
    }
  }

  createDeckStub(cards) {
    return {
      cards: [...cards],
      drawCard() {
        if (!this.cards.length) {
          throw new Error('牌堆已空');
        }
        return this.cards.pop();
      },
    };
  }

  burnCard() {
    this.burnFromDeck(this.deck);
  }

  burnFromDeck(deck) {
    if (deck.cards.length > 0) {
      deck.drawCard();
    }
  }

  recordAction(playerIndex, action, amount, meta = {}) {
    const player = this.room.players[playerIndex];
    const entry = {
      playerId: player.id,
      nickname: player.nickname,
      action,
      amount,
      street: meta.street || this.gamePhase,
      totalBet: player.currentBet,
      timestamp: Date.now(),
      ...meta,
    };

    player.lastAction = entry;
    this.lastAction = entry;
    this.actionHistory.push(entry);
  }

  refreshPotState() {
    this.pot = this.room.players.reduce((sum, player) => sum + player.totalBet, 0);
    const potManager = new PotManager({ pot: this.pot, sidePots: [] }, { players: this.room.players });
    const pots = potManager.calculatePots(this.room.players);
    this.sidePots = pots.slice(1).map((pot) => ({
      id: pot.id,
      amount: pot.amount,
      eligiblePlayers: pot.eligiblePlayers,
    }));
  }

  getActionablePlayerIndices() {
    return this.room.players
      .map((player, index) => ({ player, index }))
      .filter(({ player }) => this.isPlayerActionable(player))
      .sort((a, b) => a.player.seat - b.player.seat)
      .map(({ index }) => index);
  }

  getContestingPlayerIndices() {
    return this.room.players
      .map((player, index) => ({ player, index }))
      .filter(({ player }) => player.inHand && !player.folded)
      .sort((a, b) => a.player.seat - b.player.seat)
      .map(({ index }) => index);
  }

  getPendingPlayerIndices() {
    return [...this.playersToAct]
      .filter((index) => this.isPlayerActionable(this.room.players[index]))
      .sort((a, b) => this.room.players[a].seat - this.room.players[b].seat);
  }

  getPendingPlayerFrom(startIndex) {
    const pending = this.getPendingPlayerIndices();
    if (!pending.length) {
      return -1;
    }

    if (pending.includes(startIndex)) {
      return startIndex;
    }

    return this.getNextIndexFromList(startIndex, pending);
  }

  getNextIndexFromList(referenceIndex, orderedIndices) {
    if (!orderedIndices.length) {
      return -1;
    }

    const referenceSeat = this.room.players[referenceIndex]?.seat ?? -1;
    const next = orderedIndices.find((playerIndex) => this.room.players[playerIndex].seat > referenceSeat);
    return next !== undefined ? next : orderedIndices[0];
  }

  rotateOrderedIndices(orderedIndices, startIndex) {
    const startPosition = orderedIndices.indexOf(startIndex);
    if (startPosition === -1) {
      return [...orderedIndices];
    }

    return [...orderedIndices.slice(startPosition), ...orderedIndices.slice(0, startPosition)];
  }

  calculateSeatDistance(startSeat, targetSeat) {
    const maxPlayers = this.room.settings.maxPlayers || this.room.players.length || 10;
    return (targetSeat - startSeat + maxPlayers) % maxPlayers;
  }

  isPlayerActionable(player) {
    return Boolean(player && player.inHand && !player.folded && !player.allIn && player.chips > 0);
  }

  handlePlayerDisconnect(playerId) {
    this.forceFoldPlayer(playerId, 'disconnect');
  }

  forceFoldPlayer(playerId, reason = 'forced') {
    const playerIndex = this.room.players.findIndex((player) => player.id === playerId);
    if (playerIndex === -1) {
      return;
    }

    const player = this.room.players[playerIndex];
    if (!player.inHand || player.folded || player.allIn) {
      return;
    }

    this.clearPlayerTimer();
    this.applyFold(playerIndex, { auto: true, reason });
    this.refreshPotState();
    this.updatePendingPlayersAfterAction(playerIndex, false);
    this.advanceGameFlow(playerIndex);
  }

  handlePlayerTimeout() {
    const player = this.getCurrentPlayer();
    if (!player) {
      return;
    }

    this.clearPlayerTimer();
    const playerIndex = this.currentPlayerIndex;
    const canCheck = this.getAmountToCall(player) === 0;

    if (canCheck) {
      this.applyCheck(playerIndex, { auto: true, reason: 'timeout' });
    } else {
      this.applyFold(playerIndex, { auto: true, reason: 'timeout' });
    }

    this.refreshPotState();
    this.updatePendingPlayersAfterAction(playerIndex, false);
    this.advanceGameFlow(playerIndex);
    this.roomManager.broadcastRoomState(this.room);
  }

  getCurrentPlayer() {
    return this.room.players[this.currentPlayerIndex] || null;
  }

  isPlayerInCurrentHand(player) {
    return Boolean(player && player.inHand);
  }

  isGameInProgress() {
    return this.room.gameStarted;
  }

  getSmallBlind() {
    return Math.max(1, Math.floor(this.room.settings.initialChips / 100));
  }

  getBigBlind() {
    return Math.max(2, Math.floor(this.room.settings.initialChips / 50));
  }

  startPlayerTimer() {
    this.clearPlayerTimer();
    if (!this.getCurrentPlayer()) {
      return;
    }

    this.timeRemaining = this.actionTimeLimit;
    this.roomManager.broadcastRoomState(this.room);

    this.playerTimer = setInterval(() => {
      this.timeRemaining -= 1;
      this.roomManager.broadcastRoomState(this.room);

      if (this.timeRemaining <= 0) {
        this.handlePlayerTimeout();
      }
    }, 1000);
  }

  clearPlayerTimer() {
    if (this.playerTimer) {
      clearInterval(this.playerTimer);
      this.playerTimer = null;
    }
    this.timeRemaining = 0;
  }

  scheduleNextHand() {
    this.clearNextHandTimeout();
    this.nextHandTimeout = setTimeout(() => {
      this.lockSettlementReveals();
      this.clearSettlementState();
      this.startNewHand();
      this.roomManager.broadcastRoomState(this.room);
    }, this.room.settings.settleMs ?? 3000);
  }

  clearNextHandTimeout() {
    if (this.nextHandTimeout) {
      clearTimeout(this.nextHandTimeout);
      this.nextHandTimeout = null;
    }
  }

  getGameState() {
    return {
      phase: this.gamePhase,
      communityCards: this.communityCards,
      pot: this.pot,
      sidePots: this.sidePots,
      currentBet: this.currentBet,
      minRaise: this.minRaise,
      bigBlind: this.getBigBlind(),
      smallBlind: this.getSmallBlind(),
      currentPlayerIndex: this.currentPlayerIndex,
      currentPlayerId: this.getCurrentPlayer()?.id || null,
      dealerIndex: this.dealerIndex,
      dealerPosition: this.room.players[this.dealerIndex]?.seat ?? -1,
      smallBlindIndex: this.smallBlindIndex,
      bigBlindIndex: this.bigBlindIndex,
      roundStartIndex: this.roundStartIndex,
      lastRaiseIndex: this.lastRaiseIndex,
      handNumber: this.handNumber,
      handHistory: this.handHistory,
      settlementWindowEndsAt: this.settlementWindowEndsAt,
      revealPolicy: this.room.settings.revealPolicy || REVEAL_POLICIES.SHOWDOWN_ONLY,
      eligibleRevealPlayerIds: [...this.eligibleRevealPlayerIds],
      revealLocked: this.revealLocked,
      allinPlayers: this.room.players.filter((player) => player.inHand && player.allIn).map((player) => player.nickname),
      allinResults: this.allinResults,
      lastAction: this.lastAction,
      timeRemaining: this.timeRemaining,
    };
  }
}

module.exports = GameLogic;
