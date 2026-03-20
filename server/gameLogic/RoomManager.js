const GameLogic = require('./GameLogic');
const { ERROR_CODES, GAME_PHASES, REVEAL_MODES, REVEAL_POLICIES, ROOM_STATES, TABLE_STATES } = require('../types/GameTypes');

class RoomManager {
  constructor(io, gameRooms, socketDeviceMap, options = {}) {
    this.io = io;
    this.gameRooms = gameRooms;
    this.socketDeviceMap = socketDeviceMap;
    this.roomDefaults = options.roomDefaults || {};
  }

  deriveRoomState(room) {
    if (!room) {
      return ROOM_STATES.CLOSED;
    }

    if (room.roomState === ROOM_STATES.RECOVERY_REQUIRED) {
      return ROOM_STATES.RECOVERY_REQUIRED;
    }

    if (room.roomState === ROOM_STATES.SETTLING) {
      return ROOM_STATES.SETTLING;
    }

    if (!room.gameStarted) {
      return ROOM_STATES.IDLE;
    }

    if (room.gameLogic && typeof room.gameLogic.isGameInProgress === 'function') {
      return room.gameLogic.isGameInProgress() ? ROOM_STATES.IN_HAND : ROOM_STATES.IDLE;
    }

    return ROOM_STATES.IN_HAND;
  }

  derivePlayerTableState(player) {
    if (player.disconnected) {
      return TABLE_STATES.DISCONNECTED;
    }

    if (player.needsRebuy) {
      return TABLE_STATES.BUSTED_WAIT_REBUY;
    }

    if (player.seat === -1 || player.isSpectator) {
      return TABLE_STATES.SPECTATING;
    }

    if (player.waitingForNextRound) {
      return TABLE_STATES.SEATED_WAIT_NEXT_HAND;
    }

    if (player.inHand && player.allIn) {
      return TABLE_STATES.ALL_IN_THIS_HAND;
    }

    if (player.inHand && player.folded) {
      return TABLE_STATES.FOLDED_THIS_HAND;
    }

    if (player.inHand) {
      return TABLE_STATES.ACTIVE_IN_HAND;
    }

    if (player.chips <= 0) {
      return TABLE_STATES.BUSTED_WAIT_REBUY;
    }

    return TABLE_STATES.SEATED_READY;
  }

  transitionPlayerState(player, nextState, overrides = {}) {
    const baseState = {
      seat: player.seat,
      isActive: false,
      isSpectator: player.isSpectator,
      waitingForNextRound: false,
      inHand: false,
      folded: false,
      allIn: false,
      disconnected: false,
      needsRebuy: false,
    };

    switch (nextState) {
      case TABLE_STATES.SPECTATING:
        Object.assign(baseState, {
          seat: -1,
          isSpectator: true,
        });
        break;
      case TABLE_STATES.SEATED_READY:
        Object.assign(baseState, {
          isActive: true,
          isSpectator: false,
        });
        break;
      case TABLE_STATES.SEATED_WAIT_NEXT_HAND:
        Object.assign(baseState, {
          isSpectator: false,
          waitingForNextRound: true,
        });
        break;
      case TABLE_STATES.ACTIVE_IN_HAND:
        Object.assign(baseState, {
          isActive: true,
          isSpectator: false,
          inHand: true,
        });
        break;
      case TABLE_STATES.FOLDED_THIS_HAND:
        Object.assign(baseState, {
          isSpectator: false,
          inHand: true,
          folded: true,
        });
        break;
      case TABLE_STATES.ALL_IN_THIS_HAND:
        Object.assign(baseState, {
          isSpectator: false,
          inHand: true,
          allIn: true,
        });
        break;
      case TABLE_STATES.DISCONNECTED:
        Object.assign(baseState, {
          seat: player.seat,
          isSpectator: player.seat === -1 || player.isSpectator,
          waitingForNextRound: player.waitingForNextRound,
          inHand: player.inHand,
          folded: player.folded,
          allIn: player.allIn,
          disconnected: true,
          needsRebuy: player.needsRebuy || false,
        });
        break;
      case TABLE_STATES.BUSTED_WAIT_REBUY:
        Object.assign(baseState, {
          seat: -1,
          isSpectator: true,
          needsRebuy: true,
        });
        break;
      default:
        break;
    }

    Object.assign(player, baseState, overrides, { tableState: nextState });
    return player;
  }

  normalizePlayerStates(roomOrId) {
    const room = typeof roomOrId === 'string' ? this.gameRooms.get(roomOrId) : roomOrId;
    if (!room) {
      return null;
    }

    room.players.forEach((player) => {
      const shouldBumpToRebuy =
        !player.hasLeftRoom &&
        player.seat !== -1 &&
        player.chips <= 0 &&
        !player.inHand &&
        !player.allIn;

      if (shouldBumpToRebuy) {
        this.transitionPlayerState(player, TABLE_STATES.BUSTED_WAIT_REBUY);
      }
    });

    room.roomState = this.deriveRoomState(room);
    room.players.forEach((player) => {
      this.syncPlayerLedger(player);
      player.tableState = this.derivePlayerTableState(player);
    });
    return room;
  }

  syncRoomState(room) {
    return this.normalizePlayerStates(room);
  }

  createError(message, code) {
    const error = new Error(message);
    error.code = code;
    return error;
  }

  createPlayerLedger(initialBuyIn, currentChips = initialBuyIn) {
    return {
      initialBuyIn,
      rebuyTotal: 0,
      totalBuyIn: initialBuyIn,
      currentChips,
      sessionNet: currentChips - initialBuyIn,
      handStartChips: currentChips,
      handDelta: 0,
      showdownDelta: 0,
    };
  }

  syncPlayerLedger(player) {
    const ledger = player.ledger || this.createPlayerLedger(player.chips, player.chips);
    const totalBuyIn = ledger.initialBuyIn + ledger.rebuyTotal;
    const handStartChips = ledger.handStartChips ?? player.chips;

    player.ledger = {
      initialBuyIn: ledger.initialBuyIn,
      rebuyTotal: ledger.rebuyTotal,
      totalBuyIn,
      currentChips: player.chips,
      sessionNet: player.chips - totalBuyIn,
      handStartChips,
      handDelta: player.chips - handStartChips,
      showdownDelta: ledger.showdownDelta ?? 0,
    };

    return player.ledger;
  }

  resetPlayerAfterRecovery(player) {
    player.hand = [];
    player.currentBet = 0;
    player.totalBet = 0;
    player.lastAction = null;
    player.showHand = false;
    player.revealMode = REVEAL_MODES.HIDE;
    player.revealedCardIndices = [];
    player.waitingForNextRound = false;
    player.inHand = false;
    player.folded = false;
    player.allIn = false;

    if (player.ledger) {
      player.ledger.handStartChips = player.chips;
      player.ledger.showdownDelta = 0;
    }

    if (player.hasLeftRoom) {
      player.isActive = false;
      return;
    }

    if (player.chips <= 0 || player.needsRebuy) {
      this.transitionPlayerState(player, TABLE_STATES.BUSTED_WAIT_REBUY);
      return;
    }

    if (player.seat === -1 || player.isSpectator) {
      this.transitionPlayerState(player, TABLE_STATES.SPECTATING);
      return;
    }

    this.transitionPlayerState(player, TABLE_STATES.SEATED_READY, { seat: player.seat });
  }

  roomRequiresRecovery(room) {
    if (!room?.gameStarted || !room.gameLogic || typeof room.gameLogic.getGameState !== 'function') {
      return false;
    }

    const gameState = room.gameLogic.getGameState();
    return gameState.phase === GAME_PHASES.WAITING && !gameState.currentPlayerId;
  }

  recoverRoom(roomId, playerId) {
    const room = this.gameRooms.get(roomId);
    if (!room) {
      throw new Error('房间不存在');
    }

    const player = room.players.find((entry) => entry.id === playerId);
    if (!player) {
      throw new Error('玩家不存在');
    }

    if (!player.isHost) {
      throw this.createError('只有房主可以恢复房间', ERROR_CODES.HOST_ONLY_ACTION);
    }

    const shouldRecover =
      room.roomState === ROOM_STATES.RECOVERY_REQUIRED || this.roomRequiresRecovery(room);
    if (!shouldRecover) {
      throw this.createError('房间当前不需要恢复', ERROR_CODES.ROOM_RECOVERY_REQUIRED);
    }

    if (room.timer) {
      clearInterval(room.timer);
      room.timer = null;
    }

    if (room.gameLogic) {
      room.gameLogic.clearPlayerTimer?.();
      room.gameLogic.clearNextHandTimeout?.();
      room.gameLogic.clearSettlementState?.();
    }

    room.gameStarted = false;
    room.roomState = ROOM_STATES.IDLE;
    room.startTime = null;
    room.gameLogic = null;

    room.players.forEach((entry) => {
      this.resetPlayerAfterRecovery(entry);
      this.syncPlayerLedger(entry);
    });

    this.broadcastRoomState(room);
    return {
      roomId,
      roomState: room.roomState,
    };
  }

  canPlayerRebuy(player) {
    const tableState = player.tableState || this.derivePlayerTableState(player);
    return ![TABLE_STATES.ACTIVE_IN_HAND, TABLE_STATES.ALL_IN_THIS_HAND].includes(tableState);
  }

  // 生成唯一房间ID
  generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // 创建新房间
  createRoom(socket, settings) {
    const roomId = this.generateRoomId();
    const mergedSettings = {
      ...this.roomDefaults,
      ...(settings || {}),
    };

    // 验证设置
    this.validateRoomSettings(mergedSettings);

    const room = {
      id: roomId,
      settings: {
        duration: mergedSettings.duration || 60, // 默认60分钟
        maxPlayers: mergedSettings.maxPlayers || 6,
        allowStraddle: mergedSettings.allowStraddle || false,
        allinDealCount: mergedSettings.allinDealCount || 1,
        roomMode: ['club', 'pro', 'study'].includes(mergedSettings.roomMode) ? mergedSettings.roomMode : 'pro',
        settleMs: mergedSettings.settleMs ?? 3000,
        revealPolicy: mergedSettings.revealPolicy || REVEAL_POLICIES.SHOWDOWN_ONLY,
        initialChips: 1000,
      },
      players: [],
      gameStarted: false,
      roomState: ROOM_STATES.IDLE,
      gameLogic: null,
      startTime: null,
      createdAt: Date.now(),
    };

    // 获取设备ID
    const deviceId = this.socketDeviceMap.get(socket.id);
    if (!deviceId) {
      throw new Error('设备未注册');
    }

    this.leaveOtherRoomsForDevice(deviceId);

    // 创建者作为第一个玩家加入
    const player = {
      id: deviceId, // 使用设备ID而不是Socket ID
      socketId: socket.id, // 保存当前Socket ID
      nickname: `房主-${deviceId}`, // 使用设备ID作为昵称，添加房主前缀便于识别
      seat: 0, // 房主自动入座第一个位置
      chips: room.settings.initialChips,
      isHost: true,
      isActive: true,
      isSpectator: false,
      disconnected: false,
      hand: [],
      currentBet: 0,
      totalBet: 0,
      folded: false,
      allIn: false,
      showHand: false,
      revealMode: REVEAL_MODES.HIDE,
      revealedCardIndices: [],
      waitingForNextRound: false,
      inHand: false,
      lastAction: null,
      hasLeftRoom: false,
      needsRebuy: false,
      ledger: this.createPlayerLedger(room.settings.initialChips),
      tableState: TABLE_STATES.SEATED_READY,
    };

    room.players.push(player);
    this.gameRooms.set(roomId, room);

    // 将socket加入房间
    socket.join(roomId);

    // 立即发送游戏状态更新给房主
    socket.emit('gameStateUpdate', this.getRoomState(room, deviceId));

    return roomId;
  }

  // 验证房间设置
  validateRoomSettings(settings) {
    if (settings.maxPlayers < 2 || settings.maxPlayers > 9) {
      throw new Error('游戏人数必须在2-9人之间');
    }

    if (settings.duration < 30 || settings.duration > 300) {
      throw new Error('游戏时长必须在30-300分钟之间');
    }

    if (settings.allinDealCount < 1 || settings.allinDealCount > 4) {
      throw new Error('All-in发牌次数必须在1-4次之间');
    }

    if (settings.settleMs !== undefined && (!Number.isInteger(settings.settleMs) || settings.settleMs < 0 || settings.settleMs > 15000)) {
      throw new Error('结算停留时间必须是0-15000毫秒之间的整数');
    }

    if (
      settings.revealPolicy !== undefined &&
      !Object.values(REVEAL_POLICIES).includes(settings.revealPolicy)
    ) {
      throw new Error('无效的亮牌策略');
    }

    if (settings.roomMode !== undefined && !['club', 'pro', 'study'].includes(settings.roomMode)) {
      throw new Error('无效的房间模式');
    }
  }

  // 加入房间 - 支持观战模式和中途入座
  joinRoom(socket, roomId, deviceId, playerName = null) {
    const room = this.gameRooms.get(roomId);
    if (!room) {
      throw new Error('房间不存在');
    }

    this.leaveOtherRoomsForDevice(deviceId, roomId);

    // 移除游戏已开始的限制，支持观战模式
    // if (room.gameStarted) {
    //   throw new Error('游戏已开始，无法加入');
    // }

    // 移除房间已满的硬性限制，允许观战
    // if (room.players.length >= room.settings.maxPlayers) {
    //   throw new Error('房间已满');
    // }

    // 检查设备是否已在房间中
    const existingPlayer = room.players.find((p) => p.id === deviceId);
    if (existingPlayer) {
      // 设备重连，更新Socket ID和名称
      existingPlayer.socketId = socket.id;
      existingPlayer.hasLeftRoom = false;
      existingPlayer.disconnected = false;
      if (playerName) {
        existingPlayer.nickname = playerName;
      }
      socket.join(roomId);
      this.syncRoomState(room);
      socket.emit('joinedRoom', {
        roomId,
        seat: existingPlayer.seat,
        spectator: existingPlayer.isSpectator || existingPlayer.seat === -1,
      });
      this.broadcastRoomState(room);
      return;
    }

    // 自动分配空闲座位
    const findAvailableSeat = () => {
      for (let i = 0; i < room.settings.maxPlayers; i++) {
        if (!room.players.some((p) => p.seat === i)) {
          return i;
        }
      }
      return -1; // 没有可用座位，将处于观战状态
    };

    const availableSeat = findAvailableSeat();
    const isGameInProgress = room.gameStarted && room.gameLogic && room.gameLogic.isGameInProgress();

    // 新玩家创建
    const player = {
      id: deviceId,
      socketId: socket.id,
      nickname: playerName || deviceId,
      seat: availableSeat, // 自动分配座位，-1表示观战
      chips: availableSeat !== -1 ? room.settings.initialChips : 0, // 观战者不给筹码
      isHost: false,
      isActive: availableSeat !== -1 && !isGameInProgress, // 有座位且游戏未进行时激活
      isSpectator: availableSeat === -1, // 标记为观战者
      disconnected: false,
      hand: [],
      currentBet: 0,
      totalBet: 0,
      folded: false,
      allIn: false,
      showHand: false,
      revealMode: REVEAL_MODES.HIDE,
      revealedCardIndices: [],
      waitingForNextRound: availableSeat !== -1 && isGameInProgress, // 有座位但游戏进行中时等待下一轮
      inHand: false,
      lastAction: null,
      hasLeftRoom: false,
      needsRebuy: false,
      ledger: this.createPlayerLedger(
        availableSeat !== -1 ? room.settings.initialChips : 0,
        availableSeat !== -1 ? room.settings.initialChips : 0
      ),
      tableState:
        availableSeat === -1
          ? TABLE_STATES.SPECTATING
          : isGameInProgress
          ? TABLE_STATES.SEATED_WAIT_NEXT_HAND
          : TABLE_STATES.SEATED_READY,
    };

    room.players.push(player);
    socket.join(roomId);
    socket.emit('joinedRoom', {
      roomId,
      seat: player.seat,
      spectator: player.isSpectator || player.seat === -1,
    });

    // 如果玩家有座位但游戏正在进行，通知他们将在下一轮加入
    if (availableSeat !== -1 && isGameInProgress) {
      socket.emit('waitingForNextRound', {
        message: '您已入座，将在下一轮游戏开始时加入',
        seat: availableSeat,
      });
    } else if (availableSeat === -1) {
      socket.emit('spectatorMode', {
        message: '座位已满，您正在观战模式。有座位空出时可以入座',
      });
    }

    // 通知房间内所有玩家
    this.broadcastRoomState(room);
  }

  // 开始游戏
  startGame(roomId, playerId) {
    const room = this.gameRooms.get(roomId);
    if (!room) {
      throw new Error('房间不存在');
    }

    // 检查玩家是否在座位上（不是观战者）
    const player = room.players.find((p) => p.id === playerId);
    if (!player) {
      throw new Error('玩家不存在');
    }

    if (!player.isHost) {
      throw this.createError('只有房主可以开始游戏', ERROR_CODES.HOST_ONLY_ACTION);
    }

    if (this.roomRequiresRecovery(room)) {
      room.roomState = ROOM_STATES.RECOVERY_REQUIRED;
      this.broadcastRoomState(room);
      throw this.createError('房间状态异常，需要恢复', ERROR_CODES.ROOM_RECOVERY_REQUIRED);
    }

    // 检查入座玩家数量
    const seatedPlayers = room.players.filter((p) => p.seat !== -1 && !p.isSpectator);
    if (seatedPlayers.length < 2) {
      throw new Error('至少需要2名入座玩家才能开始游戏');
    }

    if (room.gameStarted) {
      throw new Error('游戏已开始');
    }

    room.gameStarted = true;
    room.startTime = Date.now();
    room.gameLogic = new GameLogic(room, this.io, this);

    // 开始游戏逻辑
    const handStarted = room.gameLogic.startNewHand();
    if (!handStarted) {
      this.broadcastRoomState(room);
      return {
        roomId,
        handStarted: false,
        roomState: room.roomState,
      };
    }

    // 通知所有玩家游戏开始
    this.io.to(roomId).emit('gameStarted', { roomId });
    this.broadcastRoomState(room);

    // 启动游戏计时器
    this.startGameTimer(roomId);
    return {
      roomId,
      handStarted: true,
      roomState: room.roomState,
    };
  }

  // 启动游戏计时器
  startGameTimer(roomId) {
    const room = this.gameRooms.get(roomId);
    if (!room) return;

    const durationMs = room.settings.duration * 60 * 1000;
    const endTime = room.startTime + durationMs;

    const timer = setInterval(() => {
      const now = Date.now();
      if (now >= endTime) {
        this.endGame(roomId);
        clearInterval(timer);
      } else {
        // 发送剩余时间
        const remainingTime = Math.ceil((endTime - now) / 1000 / 60);
        this.io.to(roomId).emit('timeUpdate', { remainingMinutes: remainingTime });
      }
    }, 60000); // 每分钟检查一次

    room.timer = timer;
  }

  // 结束游戏
  endGame(roomId) {
    const room = this.gameRooms.get(roomId);
    if (!room) return;

    if (room.timer) {
      clearInterval(room.timer);
    }

    // 计算最终排名
    const finalRanking = room.players
      .map((p) => ({
        nickname: p.nickname,
        chips: p.chips,
        profit: p.chips - room.settings.initialChips,
      }))
      .sort((a, b) => b.chips - a.chips);

    this.io.to(roomId).emit('gameEnded', { finalRanking });

    // 清理房间
    this.gameRooms.delete(roomId);
  }

  // 处理玩家动作
  handlePlayerAction(playerId, action, amount) {
    const room = this.findRoomByPlayerId(playerId);
    if (!room || !room.gameStarted) {
      throw new Error('游戏未开始');
    }

    room.gameLogic.handlePlayerAction(playerId, action, amount);
    this.broadcastRoomState(room);
    return {
      roomId: room.id,
      roomState: room.roomState,
      action,
      amount: amount || 0,
    };
  }

  // 处理换座
  handleSeatChange(playerId, fromSeat, toSeat) {
    const room = this.findRoomByPlayerId(playerId);
    if (!room) {
      throw new Error('房间不存在');
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player) {
      throw new Error('玩家不存在');
    }

    // 检查目标座位是否可用
    if (room.players.some((p) => p.seat === toSeat)) {
      throw new Error('目标座位已被占用');
    }

    // 当前手牌中不能换座
    if (room.gameStarted && room.gameLogic && room.gameLogic.isPlayerInCurrentHand(player)) {
      throw new Error('当前手牌进行中，无法换座');
    }

    player.seat = toSeat;
    this.broadcastRoomState(room);
    return {
      fromSeat,
      toSeat,
      tableState: player.tableState,
      roomState: room.roomState,
    };
  }

  // 处理入座
  handleTakeSeat(playerId, seatIndex) {
    const room = this.findRoomByPlayerId(playerId);
    if (!room) {
      throw new Error('房间不存在');
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player) {
      throw new Error('玩家不存在');
    }

    // 检查座位是否可用
    if (room.players.some((p) => p.seat === seatIndex && p.id !== playerId)) {
      throw new Error('座位已被占用');
    }

    // 检查座位范围
    if (seatIndex < 0 || seatIndex >= room.settings.maxPlayers) {
      throw new Error('无效的座位号');
    }

    if (player.chips <= 0 || player.needsRebuy) {
      this.transitionPlayerState(player, TABLE_STATES.BUSTED_WAIT_REBUY);
      this.broadcastRoomState(room);
      return {
        seatIndex,
        tableState: player.tableState,
        roomState: room.roomState,
      };
    }

    // 如果玩家已经在座位上，先离座到统一的观战状态
    if (player.seat !== -1) {
      this.transitionPlayerState(player, TABLE_STATES.SPECTATING);
    }

    // 如果游戏未开始，立即激活玩家
    if (!room.gameStarted) {
      this.transitionPlayerState(player, TABLE_STATES.SEATED_READY, { seat: seatIndex });
    } else {
      // 游戏进行中，标记为等待下轮
      this.transitionPlayerState(player, TABLE_STATES.SEATED_WAIT_NEXT_HAND, { seat: seatIndex });
    }

    this.broadcastRoomState(room);
    return {
      seatIndex,
      tableState: player.tableState,
      roomState: room.roomState,
    };
  }

  // 处理离座
  handleLeaveSeat(playerId) {
    const room = this.findRoomByPlayerId(playerId);
    if (!room) {
      throw new Error('房间不存在');
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player) {
      throw new Error('玩家不存在');
    }

    let forcedFold = false;

    // 如果游戏进行中且玩家正在参与当前手牌，先强制弃牌
    if (room.gameStarted && room.gameLogic && room.gameLogic.isPlayerInCurrentHand(player)) {
      room.gameLogic.forceFoldPlayer(playerId, 'leave_seat');
      forcedFold = true;
    }

    // 离座：设置为观战状态
    this.transitionPlayerState(player, TABLE_STATES.SPECTATING);
    player.hand = [];
    player.currentBet = 0;
    player.totalBet = 0;
    player.lastAction = null;

    this.broadcastRoomState(room);
    return {
      forcedFold,
      tableState: player.tableState,
      roomState: room.roomState,
    };
  }

  // 处理补码请求
  handleRebuyRequest(playerId, amount) {
    const room = this.findRoomByPlayerId(playerId);
    if (!room) {
      throw new Error('房间不存在');
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player) {
      throw new Error('玩家不存在');
    }

    // 验证补码金额（1000-9000的整数倍）
    if (amount < 1000 || amount > 9000 || amount % 1000 !== 0) {
      throw new Error('补码金额必须是1000-9000之间的1000整数倍');
    }

    this.syncRoomState(room);

    if (!this.canPlayerRebuy(player)) {
      throw new Error('当前状态无法补码');
    }

    // 执行补码
    const wasWaitingForRebuy = player.needsRebuy;
    player.chips += amount;
    player.ledger.rebuyTotal += amount;
    this.syncPlayerLedger(player);

    if (wasWaitingForRebuy && player.chips > 0) {
      this.transitionPlayerState(player, TABLE_STATES.SPECTATING);
    }

    if (player.socketId) {
      const socket = this.io.sockets.sockets.get(player.socketId);
      socket?.emit('rebuySuccess', { amount, chips: player.chips });
    }
    this.broadcastRoomState(room);
  }

  // 处理亮牌
  handleShowHand(playerId) {
    this.revealHand(playerId, REVEAL_MODES.SHOW_ALL);
  }

  // 处理盖牌
  handleMuckHand(playerId) {
    this.revealHand(playerId, REVEAL_MODES.HIDE);
  }

  revealHand(playerId, mode, cardIndex = null) {
    const room = this.findRoomByPlayerId(playerId);
    if (!room) {
      throw new Error('房间不存在');
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player) {
      throw new Error('玩家不存在');
    }

    if (!room.gameLogic || typeof room.gameLogic.handleRevealSelection !== 'function') {
      throw new Error('当前牌局不支持亮牌');
    }

    room.gameLogic.handleRevealSelection(playerId, mode, cardIndex);
    this.broadcastRoomState(room);
    return {
      roomId: room.id,
      mode,
      cardIndex,
    };
  }

  getVisibleHandForViewer(player, viewerPlayerId = null) {
    if (viewerPlayerId && player.id === viewerPlayerId) {
      return player.hand;
    }

    if (!player.showHand) {
      return [];
    }

    if (player.revealMode === REVEAL_MODES.SHOW_ONE && Array.isArray(player.revealedCardIndices)) {
      return player.hand.filter((_, index) => player.revealedCardIndices.includes(index));
    }

    return player.hand;
  }

  // 处理玩家断开连接
  handlePlayerDisconnect(playerId) {
    const room = this.findRoomByPlayerId(playerId);
    if (!room) return;

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return;

    player.isActive = false;
    player.disconnected = true;
    player.socketId = null; // 清除socket ID

    if (room.gameStarted && room.gameLogic) {
      room.gameLogic.handlePlayerDisconnect(playerId);
    }

    this.broadcastRoomState(room);
  }

  // 处理设备重连
  handleDeviceReconnect(deviceId, socket) {
    // 查找设备所在的房间
    for (const room of this.gameRooms.values()) {
      const player = room.players.find((p) => p.id === deviceId && !p.hasLeftRoom);
      if (player) {
        // 更新Socket ID并恢复连接状态
        player.socketId = socket.id;
        player.disconnected = false;
        player.hasLeftRoom = false;
        player.isActive = player.seat !== -1 && !player.isSpectator && !player.waitingForNextRound && player.chips > 0;

        // 加入房间
        socket.join(room.id);

        // 广播房间状态给所有玩家（包括重连的玩家）
        this.broadcastRoomState(room);
        return; // 找到了就返回
      }
    }
  }

  // 根据玩家ID查找房间
  findRoomByPlayerId(playerId) {
    for (const room of this.gameRooms.values()) {
      if (room.players.some((p) => p.id === playerId && !p.hasLeftRoom)) {
        return room;
      }
    }
    return null;
  }

  leaveOtherRoomsForDevice(playerId, targetRoomId = null) {
    for (const room of this.gameRooms.values()) {
      if (room.id === targetRoomId) {
        continue;
      }

      const player = room.players.find((entry) => entry.id === playerId && !entry.hasLeftRoom);
      if (!player) {
        continue;
      }

      this.handleLeaveRoomInRoom(room, playerId);
    }
  }

  handleLeaveRoom(playerId) {
    const room = this.findRoomByPlayerId(playerId);
    if (!room) {
      throw new Error('房间不存在');
    }

    return this.handleLeaveRoomInRoom(room, playerId);
  }

  handleLeaveRoomInRoom(room, playerId) {
    if (!room) {
      throw new Error('房间不存在');
    }

    const player = room.players.find((entry) => entry.id === playerId);
    if (!player) {
      throw new Error('玩家不存在');
    }

    const playerSocket = player.socketId ? this.io.sockets.sockets.get(player.socketId) : null;
    playerSocket?.leave(room.id);
    let forcedFold = false;

    if (room.gameStarted) {
      if (room.gameLogic && room.gameLogic.isPlayerInCurrentHand(player)) {
        room.gameLogic.forceFoldPlayer(playerId, 'leave_room');
        forcedFold = true;
      }

      player.hasLeftRoom = true;
      player.seat = -1;
      player.isSpectator = true;
      player.isActive = false;
      player.waitingForNextRound = false;
      player.socketId = null;
      player.disconnected = true;
      player.inHand = false;
      player.hand = [];
      player.currentBet = 0;
      player.totalBet = 0;
    } else {
      room.players = room.players.filter((entry) => entry.id !== playerId);
    }

    this.reassignHostIfNeeded(room);
    this.cleanupRoomIfEmpty(room.id);
    const roomClosed = !this.gameRooms.has(room.id);

    if (!roomClosed) {
      this.broadcastRoomState(room);
    }

    return {
      roomId: room.id,
      forcedFold,
      roomClosed,
    };
  }

  reassignHostIfNeeded(room) {
    const currentHosts = room.players.filter((player) => player.isHost && !player.hasLeftRoom);
    if (currentHosts.length > 0) {
      return;
    }

    room.players.forEach((player) => {
      player.isHost = false;
    });

    const nextHost = room.players.find((player) => !player.hasLeftRoom);
    if (nextHost) {
      nextHost.isHost = true;
    }
  }

  cleanupRoomIfEmpty(roomId) {
    const room = this.gameRooms.get(roomId);
    if (!room) {
      return;
    }

    const activePlayers = room.players.filter((player) => !player.hasLeftRoom);
    if (activePlayers.length > 0) {
      return;
    }

    if (room.timer) {
      clearInterval(room.timer);
    }
    if (room.gameLogic) {
      room.gameLogic.clearPlayerTimer();
      room.gameLogic.clearNextHandTimeout();
    }

    this.gameRooms.delete(roomId);
  }

  // 获取房间状态（用于发送给客户端）
  getRoomState(room, viewerPlayerId = null) {
    this.syncRoomState(room);
    const visiblePlayers = room.players.filter((player) => !player.hasLeftRoom);
    return {
      id: room.id,
      roomState: room.roomState,
      settings: room.settings,
      players: visiblePlayers.map((p) => ({
        id: p.id,
        nickname: p.nickname,
        seat: p.seat,
        chips: p.chips,
        isHost: p.isHost,
        isActive: p.isActive,
        isSpectator: p.isSpectator || p.seat === -1,
        disconnected: p.disconnected || false,
        currentBet: p.currentBet,
        totalBet: p.totalBet,
        folded: p.folded,
        allIn: p.allIn,
        showHand: p.showHand,
        revealMode: p.revealMode || REVEAL_MODES.HIDE,
        revealedCardIndices: p.revealedCardIndices || [],
        waitingForNextRound: p.waitingForNextRound || false,
        inHand: p.inHand || false,
        ledger: p.ledger || null,
        tableState: p.tableState,
        lastAction: p.lastAction || null,
        // 玩家可以看到自己的手牌，或者在摊牌阶段看到别人亮牌的手牌
        hand: this.getVisibleHandForViewer(p, viewerPlayerId),
      })),
      gameStarted: room.gameStarted,
      gameState: room.gameLogic ? room.gameLogic.getGameState() : null,
      startTime: room.startTime,
    };
  }

  // 广播房间状态给所有玩家（每个玩家收到个性化的状态）
  broadcastRoomState(room) {
    this.syncRoomState(room);
    room.players.forEach((player) => {
      if (player.socketId) {
        const socket = this.io.sockets.sockets.get(player.socketId);
        if (socket) {
          socket.emit('gameStateUpdate', this.getRoomState(room, player.id));
        }
      }
    });
  }
}

module.exports = RoomManager;
