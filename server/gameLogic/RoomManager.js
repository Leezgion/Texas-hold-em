const GameLogic = require('./GameLogic');

class RoomManager {
  constructor(io, gameRooms, deviceSocketMap, socketDeviceMap) {
    this.io = io;
    this.gameRooms = gameRooms;
    this.deviceSocketMap = deviceSocketMap;
    this.socketDeviceMap = socketDeviceMap;
  }

  // 生成唯一房间ID
  generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // 创建新房间
  createRoom(socket, settings) {
    const roomId = this.generateRoomId();

    // 验证设置
    this.validateRoomSettings(settings);

    const room = {
      id: roomId,
      settings: {
        duration: settings.duration || 60, // 默认60分钟
        maxPlayers: settings.maxPlayers || 6,
        allowStraddle: settings.allowStraddle || false,
        allinDealCount: settings.allinDealCount || 1,
        initialChips: 1000,
      },
      players: [],
      gameStarted: false,
      gameLogic: null,
      startTime: null,
      createdAt: Date.now(),
    };

    // 获取设备ID
    const deviceId = this.socketDeviceMap.get(socket.id);
    if (!deviceId) {
      throw new Error('设备未注册');
    }

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
      waitingForNextRound: false,
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
    if (settings.maxPlayers < 2 || settings.maxPlayers > 10) {
      throw new Error('游戏人数必须在2-10人之间');
    }

    if (settings.duration < 30 || settings.duration > 300) {
      throw new Error('游戏时长必须在30-300分钟之间');
    }

    if (settings.allinDealCount < 1 || settings.allinDealCount > 4) {
      throw new Error('All-in发牌次数必须在1-4次之间');
    }
  }

  // 加入房间 - 支持观战模式和中途入座
  joinRoom(socket, roomId, deviceId, playerName = null) {
    const room = this.gameRooms.get(roomId);
    if (!room) {
      throw new Error('房间不存在');
    }

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
      if (playerName) {
        existingPlayer.nickname = playerName;
      }
      socket.join(roomId);
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
      waitingForNextRound: availableSeat !== -1 && isGameInProgress, // 有座位但游戏进行中时等待下一轮
    };

    room.players.push(player);
    socket.join(roomId);

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

    if (player.isSpectator || player.seat === -1) {
      throw new Error('只有入座玩家可以开始游戏');
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
    room.gameLogic.startNewHand();

    // 通知所有玩家游戏开始
    this.broadcastRoomState(room);

    // 启动游戏计时器
    this.startGameTimer(roomId);
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

    // 检查玩家是否可以换座（观战状态）
    if (player.isActive && !player.folded) {
      throw new Error('只有观战状态的玩家可以换座');
    }

    player.seat = toSeat;
    this.broadcastRoomState(room);
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

    // 如果玩家已经在座位上，先离座
    if (player.seat !== -1) {
      player.isActive = false;
      player.seat = -1;
    }

    // 入座
    player.seat = seatIndex;

    // 如果游戏未开始，立即激活玩家
    if (!room.gameStarted) {
      player.isActive = true;
    } else {
      // 游戏进行中，标记为等待下轮
      player.isActive = false;
      player.waitingForNextRound = true;
    }

    this.broadcastRoomState(room);
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

    // 如果游戏进行中且玩家正在参与且未弃牌，先自动弃牌
    if (room.gameStarted && player.isActive && !player.folded) {
      player.folded = true;
      player.currentBet = 0;
      
      // 如果有游戏逻辑，通知游戏逻辑玩家弃牌
      if (room.gameLogic) {
        try {
          room.gameLogic.playerAction(playerId, 'fold', 0);
        } catch (error) {
          // 忽略弃牌错误，继续离座
          console.log('离座时弃牌失败:', error.message);
        }
      }
    }

    // 离座：设置为观战状态
    player.seat = -1;
    player.isActive = false;
    player.isSpectator = true;
    player.waitingForNextRound = false;
    player.hand = [];
    player.currentBet = 0;
    player.folded = false;
    player.allIn = false;
    player.lastAction = null;

    this.broadcastRoomState(room);
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

    // 检查是否在当前牌局中（只能在弃牌时补码）
    if (room.gameStarted && room.gameLogic && room.gameLogic.isPlayerInCurrentHand(player)) {
      throw new Error('当前牌局中无法补码，请先弃牌');
    }

    // 执行补码
    player.chips += amount;
    this.broadcastRoomState(room);
  }

  // 处理亮牌
  handleShowHand(playerId) {
    const room = this.findRoomByPlayerId(playerId);
    if (!room) {
      throw new Error('房间不存在');
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player) {
      throw new Error('玩家不存在');
    }

    player.showHand = true;
    this.broadcastRoomState(room);
  }

  // 处理盖牌
  handleMuckHand(playerId) {
    const room = this.findRoomByPlayerId(playerId);
    if (!room) {
      throw new Error('房间不存在');
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player) {
      throw new Error('玩家不存在');
    }

    player.showHand = false;
    this.broadcastRoomState(room);
  }

  // 处理玩家断开连接
  handlePlayerDisconnect(playerId) {
    const room = this.findRoomByPlayerId(playerId);
    if (!room) return;

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return;

    // 标记玩家为断线状态
    player.isActive = false;
    player.disconnected = true;
    player.socketId = null; // 清除socket ID
    
    // 如果游戏中且玩家未弃牌，自动弃牌
    if (room.gameStarted && !player.folded && !player.isSpectator) {
      player.folded = true;
    }

    // 如果游戏已开始，检查是否需要结束当前牌局
    if (room.gameStarted && room.gameLogic) {
      room.gameLogic.handlePlayerDisconnect(playerId);
    }

    this.broadcastRoomState(room);
  }

  // 处理设备重连
  handleDeviceReconnect(deviceId, socket) {
    console.log(`检查设备重连: ${deviceId}, 当前房间数量: ${this.gameRooms.size}`);

    // 查找设备所在的房间
    for (const room of this.gameRooms.values()) {
      console.log(`检查房间 ${room.id}, 玩家数量: ${room.players.length}`);
      const player = room.players.find((p) => p.id === deviceId);
      if (player) {
        console.log(`设备 ${deviceId} 重连到房间 ${room.id}, 玩家信息:`, player);
        // 更新Socket ID并恢复连接状态
        player.socketId = socket.id;
        player.isActive = true;
        player.disconnected = false;

        // 加入房间
        socket.join(room.id);

        // 广播房间状态给所有玩家（包括重连的玩家）
        console.log(`设备 ${deviceId} 重连成功`);
        this.broadcastRoomState(room);
        return; // 找到了就返回
      }
    }

    console.log(`设备 ${deviceId} 不在任何房间中`);
  }

  // 根据玩家ID查找房间
  findRoomByPlayerId(playerId) {
    for (const room of this.gameRooms.values()) {
      if (room.players.some((p) => p.id === playerId)) {
        return room;
      }
    }
    return null;
  }

  // 获取房间状态（用于发送给客户端）
  getRoomState(room, viewerPlayerId = null) {
    return {
      id: room.id,
      settings: room.settings,
      players: room.players.map((p) => ({
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
        waitingForNextRound: p.waitingForNextRound || false,
        // 玩家可以看到自己的手牌，或者在摊牌阶段看到别人亮牌的手牌
        hand: (viewerPlayerId && p.id === viewerPlayerId) || p.showHand ? p.hand : [],
      })),
      gameStarted: room.gameStarted,
      gameState: room.gameLogic ? room.gameLogic.getGameState() : null,
      startTime: room.startTime,
    };
  }

  // 广播房间状态给所有玩家（每个玩家收到个性化的状态）
  broadcastRoomState(room) {
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
