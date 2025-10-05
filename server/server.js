const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

// 游戏房间管理
const gameRooms = new Map();

// Socket ID到设备ID的映射管理（基于服务器生成的socketId，更安全）
const socketDeviceMap = new Map(); // socketId -> deviceId

// 导入游戏逻辑
const RoomManager = require('./gameLogic/RoomManager');

// 初始化房间管理器
const roomManager = new RoomManager(io, gameRooms, socketDeviceMap);

// Socket.IO 连接处理
io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);

  // 注册设备ID
  socket.on('registerDevice', ({ deviceId }) => {
    console.log('注册设备:', { deviceId, socketId: socket.id });

    // 如果设备之前已连接，清除旧的socket映射（遍历查找相同deviceId）
    for (const [oldSocketId, devId] of socketDeviceMap.entries()) {
      if (devId === deviceId && oldSocketId !== socket.id) {
        socketDeviceMap.delete(oldSocketId);
        console.log('清除旧的socket映射:', { oldSocketId, deviceId });
        break;
      }
    }

    // 建立新的映射关系
    socketDeviceMap.set(socket.id, deviceId);

    // 发送注册成功事件
    socket.emit('deviceRegistered', { deviceId, socketId: socket.id });

    // 检查设备是否在某个房间中，如果是则恢复状态
    roomManager.handleDeviceReconnect(deviceId, socket);
  });

  // 创建房间
  socket.on('createRoom', (settings) => {
    try {
      const roomId = roomManager.createRoom(socket, settings);
      socket.emit('roomCreated', { roomId });
      console.log(`房间创建成功: ${roomId}`);
    } catch (error) {
      socket.emit('error', error.message);
    }
  });

  // 加入房间
  socket.on('joinRoom', ({ roomId, deviceId, playerName }) => {
    try {
      // 如果没有传递deviceId，从映射中获取
      const actualDeviceId = deviceId || socketDeviceMap.get(socket.id);
      if (!actualDeviceId) {
        throw new Error('设备未注册');
      }

      roomManager.joinRoom(socket, roomId, actualDeviceId, playerName);
      console.log(`设备 ${actualDeviceId} (${playerName || '未知玩家'}) 加入房间 ${roomId}`);
    } catch (error) {
      socket.emit('error', error.message);
    }
  });

  // 开始游戏
  socket.on('startGame', (roomId) => {
    try {
      const deviceId = socketDeviceMap.get(socket.id);
      if (!deviceId) {
        throw new Error('设备未注册');
      }
      roomManager.startGame(roomId, deviceId);
      console.log(`房间 ${roomId} 开始游戏`);
    } catch (error) {
      socket.emit('error', error.message);
    }
  });

  // 玩家动作
  socket.on('playerAction', ({ action, amount }) => {
    try {
      const deviceId = socketDeviceMap.get(socket.id);
      if (!deviceId) {
        throw new Error('设备未注册');
      }
      roomManager.handlePlayerAction(deviceId, action, amount);
    } catch (error) {
      socket.emit('error', error.message);
    }
  });

  // 换座
  socket.on('changeSeat', ({ fromSeat, toSeat }) => {
    try {
      const deviceId = socketDeviceMap.get(socket.id);
      if (!deviceId) {
        throw new Error('设备未注册');
      }
      roomManager.handleSeatChange(deviceId, fromSeat, toSeat);
    } catch (error) {
      socket.emit('error', error.message);
    }
  });

  // 入座
  socket.on('takeSeat', ({ seatIndex }) => {
    try {
      const deviceId = socketDeviceMap.get(socket.id);
      if (!deviceId) {
        throw new Error('设备未注册');
      }
      roomManager.handleTakeSeat(deviceId, seatIndex);
    } catch (error) {
      socket.emit('error', error.message);
    }
  });

  // 离座
  socket.on('leaveSeat', () => {
    try {
      const deviceId = socketDeviceMap.get(socket.id);
      console.log('收到离座请求:', { socketId: socket.id, deviceId });
      if (!deviceId) {
        throw new Error('设备未注册');
      }
      roomManager.handleLeaveSeat(deviceId);
      console.log('离座处理完成:', deviceId);
    } catch (error) {
      console.log('离座处理失败:', error.message);
      socket.emit('error', error.message);
    }
  });

  // 补码请求
  socket.on('requestRebuy', (amount) => {
    try {
      const deviceId = socketDeviceMap.get(socket.id);
      if (!deviceId) {
        throw new Error('设备未注册');
      }
      roomManager.handleRebuyRequest(deviceId, amount);
    } catch (error) {
      socket.emit('error', error.message);
    }
  });

  // 亮牌/盖牌
  socket.on('showHand', () => {
    try {
      const deviceId = socketDeviceMap.get(socket.id);
      if (!deviceId) {
        throw new Error('设备未注册');
      }
      roomManager.handleShowHand(deviceId);
    } catch (error) {
      socket.emit('error', error.message);
    }
  });

  socket.on('muckHand', () => {
    try {
      const deviceId = socketDeviceMap.get(socket.id);
      if (!deviceId) {
        throw new Error('设备未注册');
      }
      roomManager.handleMuckHand(deviceId);
    } catch (error) {
      socket.emit('error', error.message);
    }
  });

  // 断开连接
  socket.on('disconnect', () => {
    console.log('用户断开连接:', socket.id);

    // 获取设备ID
    const deviceId = socketDeviceMap.get(socket.id);
    if (deviceId) {
      console.log('设备断开连接:', deviceId);
      // 暂时保留设备映射，允许重连
      // 注意：如果需要清理映射，可以设置超时后删除
      // socketDeviceMap.delete(socket.id);
    }

    roomManager.handlePlayerDisconnect(deviceId);
  });
});

// 路由处理
app.get('/api/rooms', (req, res) => {
  const rooms = Array.from(gameRooms.values()).map((room) => ({
    id: room.id,
    playerCount: room.players.length,
    maxPlayers: room.settings.maxPlayers,
    gameStarted: room.gameStarted,
    settings: room.settings,
  }));
  res.json(rooms);
});

// 验证房间是否存在
app.get('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = gameRooms.get(roomId);

  if (!room) {
    return res.status(404).json({
      error: '房间不存在',
      exists: false,
    });
  }

  // 支持观战模式：即使游戏已开始，也允许加入观战
  // 只有座位已满且游戏进行中时，新加入的玩家才处于观战模式
  const seatedPlayers = room.players.filter((p) => p.seat !== -1).length;
  const hasAvailableSeats = seatedPlayers < room.settings.maxPlayers;

  res.json({
    exists: true,
    id: room.id,
    playerCount: room.players.length,
    seatedPlayers: seatedPlayers,
    maxPlayers: room.settings.maxPlayers,
    gameStarted: room.gameStarted,
    canJoin: true, // 总是允许加入，观战或入座由服务器判断
    hasAvailableSeats: hasAvailableSeats,
    canSit: hasAvailableSeats, // 是否有空座位可以入座
  });
});

// 调试端点 - 查看房间详细信息
app.get('/api/debug/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = gameRooms.get(roomId);

  if (!room) {
    return res.status(404).json({ error: '房间不存在' });
  }

  res.json({
    id: room.id,
    settings: room.settings,
    players: room.players.map((p) => ({
      id: p.id,
      socketId: p.socketId,
      nickname: p.nickname,
      seat: p.seat,
      chips: p.chips,
      isHost: p.isHost,
      isActive: p.isActive,
    })),
    gameStarted: room.gameStarted,
    gameState: room.gameLogic ? room.gameLogic.getGameState() : null,
    createdAt: room.createdAt,
  });
});

// 调试端点 - 查看设备映射
app.get('/api/debug/devices', (req, res) => {
  const deviceMappings = Array.from(socketDeviceMap.entries()).map(([socketId, deviceId]) => ({
    socketId,
    deviceId,
  }));

  res.json({
    socketCount: socketDeviceMap.size,
    mappings: deviceMappings,
  });
});

// 前端路由处理
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0'; // 监听所有网络接口

server.listen(PORT, HOST, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`本地访问: http://localhost:${PORT}`);
  console.log(`局域网访问: http://192.168.1.106:${PORT}`);
  console.log(`其他设备可通过局域网IP访问游戏`);
});
