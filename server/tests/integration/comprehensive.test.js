/**
 * Stage 4 综合集成测试
 * 测试所有 Phase 3 功能的集成和端到端流程
 */

const { ERROR_CODES, EVENT_TYPES, GAME_CONFIG } = require('../../types/GameTypes');
const Validator = require('../../validators/Validator');
const { socketEventManager } = require('../../interfaces/SocketEventManager');
const { apiResponseManager } = require('../../interfaces/APIResponseManager');

describe('Stage 4 - 综合集成测试', () => {
  let mockSocket1, mockSocket2, mockSocket3;
  let mockReq, mockRes;
  
  beforeEach(() => {
    // 创建测试用的模拟对象
    mockSocket1 = global.TestUtils.createMockSocket('socket1');
    mockSocket2 = global.TestUtils.createMockSocket('socket2');
    mockSocket3 = global.TestUtils.createMockSocket('socket3');
    
    mockReq = global.TestUtils.createMockRequest();
    mockRes = global.TestUtils.createMockResponse();
    
    // 重置所有管理器状态
    socketEventManager.reset();
    apiResponseManager.resetStats();
  });

  afterEach(() => {
    // 清理资源
    [mockSocket1, mockSocket2, mockSocket3].forEach(socket => {
      if (socket) {
        socketEventManager.unregisterSocket(socket.id);
      }
    });
  });

  describe('完整的房间创建和加入流程', () => {
    test('应该完成完整的房间创建和玩家加入流程', async () => {
      // 1. API 请求验证 - 创建房间
      const createRoomData = {
        roomName: '德州扑克房间',
        settings: {
          maxPlayers: 6,
          initialChips: 1000,
          timeLimit: 30,
          allowSpectators: true,
          isPrivate: false
        }
      };
      
      // 验证创建房间数据
      const createValidation = Validator.validateRoomSettings(createRoomData.settings);
      expect(createValidation.valid).toBe(true);
      
      // API 响应创建房间成功
      const roomId = `room_${Date.now()}`;
      const createdRoom = {
        id: roomId,
        name: createRoomData.roomName,
        settings: createValidation.data,
        players: [],
        createdAt: Date.now()
      };
      
      apiResponseManager.sendSuccessResponse(
        mockRes,
        createdRoom,
        '房间创建成功',
        { roomId: roomId }
      );
      
      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.responseData.status).toBe('success');
      expect(mockRes.responseData.data.id).toBe(roomId);
      
      // 2. Socket 连接和房间加入
      const user1Metadata = { userId: 'user1', roomId: roomId };
      const user2Metadata = { userId: 'user2', roomId: roomId };
      
      // 注册 Socket 连接
      expect(socketEventManager.registerSocket(mockSocket1, user1Metadata)).toBe(true);
      expect(socketEventManager.registerSocket(mockSocket2, user2Metadata)).toBe(true);
      
      // 3. 验证加入房间事件
      const joinRoomData1 = { roomId: roomId, nickname: '玩家1' };
      const joinRoomData2 = { roomId: roomId, nickname: '玩家2' };
      
      const joinValidation1 = socketEventManager.validateIncomingEvent(
        'join_room',
        joinRoomData1,
        mockSocket1
      );
      const joinValidation2 = socketEventManager.validateIncomingEvent(
        'join_room',
        joinRoomData2,
        mockSocket2
      );
      
      expect(joinValidation1.valid).toBe(true);
      expect(joinValidation2.valid).toBe(true);
      
      // 4. 发送房间加入事件
      socketEventManager.sendEvent(
        mockSocket1,
        EVENT_TYPES.ROOM_JOINED,
        { roomId: roomId, player: { id: 'user1', nickname: '玩家1' } }
      );
      
      socketEventManager.sendEvent(
        mockSocket2,
        EVENT_TYPES.ROOM_JOINED,
        { roomId: roomId, player: { id: 'user2', nickname: '玩家2' } }
      );
      
      // 5. 广播玩家加入消息
      const playerJoinedData = {
        player: { id: 'user2', nickname: '玩家2' },
        totalPlayers: 2
      };
      
      const broadcastResult = socketEventManager.broadcastToRoom(
        roomId,
        EVENT_TYPES.ROOM_PLAYER_JOINED,
        playerJoinedData,
        [mockSocket2.id] // 排除加入者自己
      );
      
      expect(broadcastResult.sent).toBe(1);
      expect(broadcastResult.failed).toBe(0);
      
      // 验证事件是否正确发送
      expect(mockSocket1.getEmittedEvents(EVENT_TYPES.ROOM_JOINED)).toHaveLength(1);
      expect(mockSocket2.getEmittedEvents(EVENT_TYPES.ROOM_JOINED)).toHaveLength(1);
      expect(mockSocket1.getEmittedEvents(EVENT_TYPES.ROOM_PLAYER_JOINED)).toHaveLength(1);
      expect(mockSocket2.getEmittedEvents(EVENT_TYPES.ROOM_PLAYER_JOINED)).toHaveLength(0);
    });

    test('应该处理房间创建失败的情况', () => {
      // 无效的房间设置
      const invalidRoomData = {
        roomName: '', // 空名称
        settings: {
          maxPlayers: 15, // 超过最大限制
          initialChips: -100, // 负数
          timeLimit: 200 // 超时
        }
      };
      
      // 验证应该失败
      const validation = Validator.validateRoomSettings(invalidRoomData.settings);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      
      // API 返回错误响应
      apiResponseManager.sendErrorResponse(
        mockRes,
        ERROR_CODES.VALIDATION_FAILED,
        '房间设置验证失败',
        validation.errors,
        400
      );
      
      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.responseData.status).toBe('error');
      expect(mockRes.responseData.error.code).toBe(ERROR_CODES.VALIDATION_FAILED);
    });
  });

  describe('完整的游戏动作处理流程', () => {
    const roomId = 'test_game_room';
    
    beforeEach(() => {
      // 设置游戏环境
      socketEventManager.registerSocket(mockSocket1, { userId: 'player1', roomId });
      socketEventManager.registerSocket(mockSocket2, { userId: 'player2', roomId });
    });

    test('应该完成完整的玩家动作处理流程', () => {
      // 1. 游戏开始
      const gameStartData = {
        gameId: 'game123',
        players: [
          { id: 'player1', nickname: '玩家1', chips: 1000, position: 0 },
          { id: 'player2', nickname: '玩家2', chips: 1000, position: 1 }
        ],
        smallBlind: 10,
        bigBlind: 20,
        dealerPosition: 0
      };
      
      socketEventManager.broadcastToRoom(
        roomId,
        EVENT_TYPES.GAME_STARTED,
        gameStartData
      );
      
      // 2. 验证玩家动作
      const playerActionData = {
        action: 'raise',
        amount: 50
      };
      
      const gameContext = {
        currentPlayer: 'player1',
        currentBet: 20,
        playerBet: 0,
        playerChips: 1000,
        minRaise: 20,
        phase: 'preflop'
      };
      
      const actionValidation = Validator.validatePlayerAction(
        'player1',
        playerActionData.action,
        playerActionData.amount,
        gameContext
      );
      
      expect(actionValidation.valid).toBe(true);
      
      // 3. 处理玩家动作
      if (actionValidation.valid) {
        // 发送动作确认
        socketEventManager.sendEvent(
          mockSocket1,
          EVENT_TYPES.PLAYER_ACTION,
          {
            playerId: 'player1',
            action: playerActionData.action,
            amount: playerActionData.amount,
            success: true
          }
        );
        
        // 广播游戏状态更新
        const gameStateUpdate = {
          currentPlayer: 'player2',
          currentBet: 50,
          pot: 80, // 小盲 + 大盲 + 加注
          phase: 'preflop'
        };
        
        socketEventManager.broadcastToRoom(
          roomId,
          EVENT_TYPES.GAME_STATE_UPDATED,
          gameStateUpdate
        );
        
        // 通知下一个玩家
        socketEventManager.sendEvent(
          mockSocket2,
          EVENT_TYPES.PLAYER_TURN,
          {
            playerId: 'player2',
            timeLimit: 30,
            validActions: ['call', 'raise', 'fold'],
            currentBet: 50
          }
        );
      }
      
      // 验证事件发送
      expect(mockSocket1.getEmittedEvents(EVENT_TYPES.PLAYER_ACTION)).toHaveLength(1);
      expect(mockSocket1.getEmittedEvents(EVENT_TYPES.GAME_STATE_UPDATED)).toHaveLength(1);
      expect(mockSocket2.getEmittedEvents(EVENT_TYPES.GAME_STATE_UPDATED)).toHaveLength(1);
      expect(mockSocket2.getEmittedEvents(EVENT_TYPES.PLAYER_TURN)).toHaveLength(1);
    });

    test('应该处理无效玩家动作', () => {
      const invalidActionData = {
        action: 'invalid_action',
        amount: -50 // 负数
      };
      
      const gameContext = {
        currentPlayer: 'player2', // 不是当前玩家
        currentBet: 20,
        playerBet: 0,
        playerChips: 1000,
        minRaise: 20,
        phase: 'preflop'
      };
      
      // 验证应该失败
      const actionValidation = Validator.validatePlayerAction(
        'player1', // 尝试以非当前玩家身份操作
        invalidActionData.action,
        invalidActionData.amount,
        gameContext
      );
      
      expect(actionValidation.valid).toBe(false);
      
      // 发送错误响应
      socketEventManager.sendEvent(
        mockSocket1,
        EVENT_TYPES.ERROR_OCCURRED,
        {
          code: ERROR_CODES.PLAYER_INVALID_ACTION,
          message: '无效的玩家动作',
          details: actionValidation.errors
        }
      );
      
      expect(mockSocket1.getEmittedEvents(EVENT_TYPES.ERROR_OCCURRED)).toHaveLength(1);
    });
  });

  describe('错误处理和恢复机制', () => {
    test('应该处理Socket连接丢失', () => {
      const roomId = 'test_disconnect_room';
      
      // 注册Socket
      socketEventManager.registerSocket(mockSocket1, { userId: 'user1', roomId });
      socketEventManager.registerSocket(mockSocket2, { userId: 'user2', roomId });
      
      // 模拟连接丢失
      mockSocket1.disconnect('connection lost');
      
      // 验证连接状态
      expect(mockSocket1.connected).toBe(false);
      
      // 通知其他玩家
      socketEventManager.broadcastToRoom(
        roomId,
        EVENT_TYPES.PLAYER_DISCONNECTED,
        {
          playerId: 'user1',
          reason: 'connection lost',
          timestamp: Date.now()
        },
        [mockSocket1.id] // 排除断开的Socket
      );
      
      expect(mockSocket2.getEmittedEvents(EVENT_TYPES.PLAYER_DISCONNECTED)).toHaveLength(1);
    });

    test('应该处理API响应错误', () => {
      // 模拟响应对象错误
      const faultyRes = {
        status: () => { throw new Error('Response error'); },
        json: () => { throw new Error('JSON error'); }
      };
      
      // 应该优雅处理错误
      expect(() => {
        apiResponseManager.sendSuccessResponse(faultyRes, {}, '测试');
      }).not.toThrow();
      
      // 验证错误统计
      const stats = apiResponseManager.getStats();
      expect(stats.failedRequests).toBeGreaterThan(0);
    });

    test('应该处理验证器异常', () => {
      // 测试极端输入
      const extremeInputs = [null, undefined, {}, [], function() {}, Symbol('test')];
      
      extremeInputs.forEach(input => {
        expect(() => {
          Validator.validatePlayerId(input);
          Validator.validateNickname(input);
          Validator.validateBetAmount(input);
        }).not.toThrow();
      });
    });
  });

  describe('性能和负载测试', () => {
    test('应该处理大量并发连接', () => {
      const startTime = Date.now();
      const sockets = [];
      
      // 创建100个模拟连接
      for (let i = 0; i < 100; i++) {
        const socket = global.TestUtils.createMockSocket(`socket_${i}`);
        sockets.push(socket);
        
        socketEventManager.registerSocket(socket, {
          userId: `user_${i}`,
          roomId: `room_${i % 10}` // 分布到10个房间
        });
      }
      
      const registrationTime = Date.now() - startTime;
      expect(registrationTime).toBeLessThan(1000); // 应该在1秒内完成
      
      // 发送大量事件
      const eventStartTime = Date.now();
      sockets.forEach(socket => {
        socketEventManager.sendEvent(socket, EVENT_TYPES.TIMER_UPDATE, { time: Date.now() });
      });
      
      const eventTime = Date.now() - eventStartTime;
      expect(eventTime).toBeLessThan(500); // 100个事件应该在500ms内完成
      
      // 清理
      sockets.forEach(socket => {
        socketEventManager.unregisterSocket(socket.id);
      });
    });

    test('应该处理大量验证请求', () => {
      const startTime = Date.now();
      
      // 执行1000次验证
      for (let i = 0; i < 1000; i++) {
        Validator.validatePlayerId(`player_${i}`);
        Validator.validateNickname(`玩家${i}`);
        Validator.validateBetAmount(Math.floor(Math.random() * 1000) + 1);
      }
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // 1000次验证应该在1秒内完成
    });

    test('应该处理大量API请求', () => {
      const startTime = Date.now();
      
      // 模拟100个API请求
      for (let i = 0; i < 100; i++) {
        const res = global.TestUtils.createMockResponse();
        apiResponseManager.sendSuccessResponse(res, { id: i }, `响应${i}`);
      }
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // 100个响应应该在1秒内完成
      
      const stats = apiResponseManager.getStats();
      expect(stats.totalRequests).toBeGreaterThanOrEqual(100);
    });
  });

  describe('内存管理和资源清理', () => {
    test('应该正确清理断开的连接', () => {
      const initialStats = socketEventManager.getStats();
      
      // 创建一些连接
      const sockets = [];
      for (let i = 0; i < 10; i++) {
        const socket = global.TestUtils.createMockSocket(`temp_socket_${i}`);
        sockets.push(socket);
        socketEventManager.registerSocket(socket, { userId: `temp_user_${i}` });
      }
      
      const afterConnectStats = socketEventManager.getStats();
      expect(afterConnectStats.connectedSockets).toBe(initialStats.connectedSockets + 10);
      
      // 断开所有连接
      sockets.forEach(socket => {
        socket.disconnect();
        socketEventManager.unregisterSocket(socket.id);
      });
      
      // 执行清理
      socketEventManager.cleanup();
      
      const finalStats = socketEventManager.getStats();
      expect(finalStats.connectedSockets).toBe(initialStats.connectedSockets);
    });

    test('应该限制事件历史大小', () => {
      const roomId = 'memory_test_room';
      socketEventManager.registerSocket(mockSocket1, { userId: 'user1', roomId });
      
      // 发送大量事件
      for (let i = 0; i < 1500; i++) {
        socketEventManager.sendEvent(mockSocket1, EVENT_TYPES.TIMER_UPDATE, { count: i });
      }
      
      const history = socketEventManager.getEventHistory(mockSocket1.id);
      
      // 应该限制历史记录数量
      expect(history.length).toBeLessThanOrEqual(GAME_CONFIG.EVENT_HISTORY_LIMIT);
    });
  });

  describe('系统集成验证', () => {
    test('所有组件应该正确协作', async () => {
      const integrationStartTime = Date.now();
      
      // 1. 验证类型定义
      expect(typeof ERROR_CODES.PLAYER_NOT_FOUND).toBe('string');
      expect(typeof EVENT_TYPES.GAME_STARTED).toBe('string');
      expect(typeof GAME_CONFIG.MIN_PLAYERS).toBe('number');
      
      // 2. 验证器功能
      const validationResult = Validator.validatePlayerId('test_player');
      expect(validationResult.valid).toBe(true);
      
      // 3. Socket事件管理
      socketEventManager.registerSocket(mockSocket1, { userId: 'integration_user' });
      const eventResult = socketEventManager.sendEvent(
        mockSocket1,
        EVENT_TYPES.GAME_STARTED,
        { gameId: 'integration_test' }
      );
      expect(eventResult).toBe(true);
      
      // 4. API响应管理
      apiResponseManager.sendSuccessResponse(mockRes, { test: 'integration' }, '集成测试');
      expect(mockRes.sent).toBe(true);
      
      // 5. 性能指标
      const socketStats = socketEventManager.getStats();
      const apiStats = apiResponseManager.getStats();
      
      expect(socketStats.eventsSent).toBeGreaterThan(0);
      expect(apiStats.totalRequests).toBeGreaterThan(0);
      
      const integrationTime = Date.now() - integrationStartTime;
      console.log(`✅ 系统集成验证完成，耗时: ${integrationTime}ms`);
      
      expect(integrationTime).toBeLessThan(100); // 集成测试应该很快完成
    });
  });
});
