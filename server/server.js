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

// 设备ID和Socket ID的映射管理
const deviceSocketMap = new Map(); // deviceId -> socketId
const socketDeviceMap = new Map(); // socketId -> deviceId

// 导入游戏逻辑
const GameLogic = require('./gameLogic/GameLogic');
const RoomManager = require('./gameLogic/RoomManager');

// 初始化房间管理器
const roomManager = new RoomManager(io, gameRooms, deviceSocketMap, socketDeviceMap);

// Socket.IO 连接处理
io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);

  // 注册设备ID
  socket.on('registerDevice', ({ deviceId, socketId }) => {
    console.log('注册设备:', { deviceId, socketId });

    // 如果设备之前已连接，清除旧的映射
    if (deviceSocketMap.has(deviceId)) {
      const oldSocketId = deviceSocketMap.get(deviceId);
      socketDeviceMap.delete(oldSocketId);
    }

    // 建立新的映射关系
    deviceSocketMap.set(deviceId, socketId);
    socketDeviceMap.set(socketId, deviceId);

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
  socket.on('joinRoom', ({ roomId, deviceId }) => {
    try {
      // 如果没有传递deviceId，从映射中获取
      const actualDeviceId = deviceId || socketDeviceMap.get(socket.id);
      if (!actualDeviceId) {
        throw new Error('设备未注册');
      }

      roomManager.joinRoom(socket, roomId, actualDeviceId);
      console.log(`设备 ${actualDeviceId} 加入房间 ${roomId}`);
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
      if (!deviceId) {
        throw new Error('设备未注册');
      }
      roomManager.handleLeaveSeat(deviceId);
    } catch (error) {
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
      // deviceSocketMap.delete(deviceId);
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

  res.json({
    exists: true,
    id: room.id,
    playerCount: room.players.length,
    maxPlayers: room.settings.maxPlayers,
    gameStarted: room.gameStarted,
    canJoin: !room.gameStarted && room.players.length < room.settings.maxPlayers,
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
  const deviceMappings = Array.from(deviceSocketMap.entries()).map(([deviceId, socketId]) => ({
    deviceId,
    socketId,
  }));

  res.json({
    deviceCount: deviceSocketMap.size,
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
