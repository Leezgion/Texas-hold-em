/**
 * SocketEventManager 集成测试
 * 测试Socket事件管理、验证和性能监控
 */

const { socketEventManager } = require('../../interfaces/SocketEventManager');
const { EVENT_TYPES, ERROR_CODES } = require('../../types/GameTypes');

describe('SocketEventManager 事件管理器测试', () => {
  let mockSocket1, mockSocket2;
  
  beforeEach(() => {
    // 创建测试用的模拟Socket
    mockSocket1 = global.TestUtils.createMockSocket('socket1');
    mockSocket2 = global.TestUtils.createMockSocket('socket2');
    
    // 重置事件管理器状态
    socketEventManager.reset();
  });

  afterEach(() => {
    // 清理Socket连接
    if (mockSocket1) {
      socketEventManager.unregisterSocket(mockSocket1.id);
    }
    if (mockSocket2) {
      socketEventManager.unregisterSocket(mockSocket2.id);
    }
  });

  describe('Socket注册和管理', () => {
    test('应该成功注册Socket', () => {
      const metadata = {
        userId: 'user123',
        roomId: 'room456'
      };
      
      const result = socketEventManager.registerSocket(mockSocket1, metadata);
      
      expect(result).toBe(true);
      expect(socketEventManager.isSocketRegistered(mockSocket1.id)).toBe(true);
      
      const socketInfo = socketEventManager.getSocketInfo(mockSocket1.id);
      expect(socketInfo.metadata).toEqual(metadata);
      expect(socketInfo.connectedAt).toBeDefined();
    });

    test('应该防止重复注册同一Socket', () => {
      socketEventManager.registerSocket(mockSocket1, { userId: 'user1' });
      
      // 尝试重复注册
      const result = socketEventManager.registerSocket(mockSocket1, { userId: 'user2' });
      
      expect(result).toBe(false);
      
      // 元数据不应该被覆盖
      const socketInfo = socketEventManager.getSocketInfo(mockSocket1.id);
      expect(socketInfo.metadata.userId).toBe('user1');
    });

    test('应该成功注销Socket', () => {
      socketEventManager.registerSocket(mockSocket1, { userId: 'user1' });
      
      const result = socketEventManager.unregisterSocket(mockSocket1.id);
      
      expect(result).toBe(true);
      expect(socketEventManager.isSocketRegistered(mockSocket1.id)).toBe(false);
    });

    test('应该处理不存在Socket的注销', () => {
      const result = socketEventManager.unregisterSocket('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('事件验证', () => {
    beforeEach(() => {
      socketEventManager.registerSocket(mockSocket1, {
        userId: 'user1',
        roomId: 'room1'
      });
    });

    test('应该验证有效的事件', () => {
      const validEvents = [
        ['join_room', { roomId: 'room123', password: 'test' }],
        ['player_action', { action: 'call', amount: 50 }],
        ['leave_room', {}],
        ['chat_message', { message: 'Hello world' }]
      ];
      
      validEvents.forEach(([eventName, data]) => {
        const result = socketEventManager.validateIncomingEvent(eventName, data, mockSocket1);
        expect(result.valid).toBe(true);
      });
    });

    test('应该拒绝无效的事件', () => {
      const invalidEvents = [
        ['unknown_event', {}],
        ['join_room', {}], // 缺少roomId
        ['player_action', { action: 'invalid_action' }],
        ['chat_message', { message: '' }] // 空消息
      ];
      
      invalidEvents.forEach(([eventName, data]) => {
        const result = socketEventManager.validateIncomingEvent(eventName, data, mockSocket1);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    test('应该验证事件参数类型', () => {
      const typeValidationTests = [
        ['join_room', { roomId: 123 }], // roomId应该是字符串
        ['player_action', { amount: '50' }], // amount应该是数字
        ['chat_message', { message: null }] // message应该是字符串
      ];
      
      typeValidationTests.forEach(([eventName, data]) => {
        const result = socketEventManager.validateIncomingEvent(eventName, data, mockSocket1);
        expect(result.valid).toBe(false);
      });
    });
  });

  describe('事件发送', () => {
    beforeEach(() => {
      socketEventManager.registerSocket(mockSocket1, { userId: 'user1' });
      socketEventManager.registerSocket(mockSocket2, { userId: 'user2' });
    });

    test('应该成功发送单个事件', () => {
      const eventData = { gameId: 'game123', status: 'started' };
      
      const result = socketEventManager.sendEvent(
        mockSocket1,
        EVENT_TYPES.GAME_STARTED,
        eventData
      );
      
      expect(result).toBe(true);
      
      const emittedEvents = mockSocket1.getEmittedEvents(EVENT_TYPES.GAME_STARTED);
      expect(emittedEvents).toHaveLength(1);
      expect(emittedEvents[0].args[0]).toEqual(eventData);
    });

    test('应该验证发送事件的数据', () => {
      // 尝试发送无效数据
      const result = socketEventManager.sendEvent(
        mockSocket1,
        EVENT_TYPES.GAME_STARTED,
        null // 无效数据
      );
      
      expect(result).toBe(false);
      expect(mockSocket1.getEmittedEvents()).toHaveLength(0);
    });

    test('应该支持批量发送事件', () => {
      const events = [
        { event: EVENT_TYPES.GAME_STARTED, data: { gameId: 'game1' } },
        { event: EVENT_TYPES.PLAYER_TURN, data: { playerId: 'player1' } },
        { event: EVENT_TYPES.POT_UPDATED, data: { amount: 100 } }
      ];
      
      const results = socketEventManager.sendMultipleEvents(mockSocket1, events);
      
      expect(results.every(r => r === true)).toBe(true);
      expect(mockSocket1.getEmittedEvents()).toHaveLength(3);
    });
  });

  describe('房间广播', () => {
    const roomId = 'test_room';
    
    beforeEach(() => {
      socketEventManager.registerSocket(mockSocket1, {
        userId: 'user1',
        roomId: roomId
      });
      socketEventManager.registerSocket(mockSocket2, {
        userId: 'user2',
        roomId: roomId
      });
    });

    test('应该向房间内所有Socket广播', () => {
      const eventData = { message: '游戏开始了！' };
      
      const result = socketEventManager.broadcastToRoom(
        roomId,
        EVENT_TYPES.GAME_STARTED,
        eventData
      );
      
      expect(result.sent).toBe(2);
      expect(result.failed).toBe(0);
      
      // 验证两个Socket都收到了事件
      expect(mockSocket1.getEmittedEvents(EVENT_TYPES.GAME_STARTED)).toHaveLength(1);
      expect(mockSocket2.getEmittedEvents(EVENT_TYPES.GAME_STARTED)).toHaveLength(1);
    });

    test('应该支持排除特定Socket的广播', () => {
      const eventData = { message: '其他玩家加入了游戏' };
      
      const result = socketEventManager.broadcastToRoom(
        roomId,
        EVENT_TYPES.ROOM_PLAYER_JOINED,
        eventData,
        [mockSocket1.id] // 排除socket1
      );
      
      expect(result.sent).toBe(1);
      expect(result.failed).toBe(0);
      
      // 只有socket2应该收到事件
      expect(mockSocket1.getEmittedEvents(EVENT_TYPES.ROOM_PLAYER_JOINED)).toHaveLength(0);
      expect(mockSocket2.getEmittedEvents(EVENT_TYPES.ROOM_PLAYER_JOINED)).toHaveLength(1);
    });

    test('应该处理不存在房间的广播', () => {
      const result = socketEventManager.broadcastToRoom(
        'nonexistent_room',
        EVENT_TYPES.GAME_STARTED,
        {}
      );
      
      expect(result.sent).toBe(0);
      expect(result.failed).toBe(0);
    });
  });

  describe('中间件系统', () => {
    test('应该支持事件验证中间件', async () => {
      let middlewareExecuted = false;
      
      // 添加自定义中间件
      socketEventManager.addMiddleware('validation', (eventName, data, socket, next) => {
        middlewareExecuted = true;
        
        if (eventName === 'restricted_event') {
          return next(new Error('访问被拒绝'));
        }
        
        next();
      });
      
      socketEventManager.registerSocket(mockSocket1, { userId: 'user1' });
      
      // 测试允许的事件
      const allowedResult = await socketEventManager.processEventWithMiddleware(
        'join_room',
        { roomId: 'test' },
        mockSocket1
      );
      
      expect(middlewareExecuted).toBe(true);
      expect(allowedResult.success).toBe(true);
      
      // 测试被拒绝的事件
      middlewareExecuted = false;
      const restrictedResult = await socketEventManager.processEventWithMiddleware(
        'restricted_event',
        {},
        mockSocket1
      );
      
      expect(middlewareExecuted).toBe(true);
      expect(restrictedResult.success).toBe(false);
      expect(restrictedResult.error).toBeDefined();
    });

    test('应该支持多个中间件的链式执行', async () => {
      const executionOrder = [];
      
      socketEventManager.addMiddleware('first', (eventName, data, socket, next) => {
        executionOrder.push('first');
        next();
      });
      
      socketEventManager.addMiddleware('second', (eventName, data, socket, next) => {
        executionOrder.push('second');
        next();
      });
      
      socketEventManager.registerSocket(mockSocket1, { userId: 'user1' });
      
      await socketEventManager.processEventWithMiddleware(
        'test_event',
        {},
        mockSocket1
      );
      
      expect(executionOrder).toEqual(['first', 'second']);
    });
  });

  describe('性能监控', () => {
    beforeEach(() => {
      socketEventManager.registerSocket(mockSocket1, { userId: 'user1' });
    });

    test('应该记录事件统计信息', () => {
      const initialStats = socketEventManager.getStats();
      
      // 发送几个事件
      socketEventManager.sendEvent(mockSocket1, EVENT_TYPES.GAME_STARTED, {});
      socketEventManager.sendEvent(mockSocket1, EVENT_TYPES.PLAYER_TURN, {});
      
      // 模拟接收事件
      socketEventManager.recordIncomingEvent('join_room', mockSocket1);
      socketEventManager.recordIncomingEvent('player_action', mockSocket1);
      
      const finalStats = socketEventManager.getStats();
      
      expect(finalStats.eventsSent).toBe(initialStats.eventsSent + 2);
      expect(finalStats.eventsReceived).toBe(initialStats.eventsReceived + 2);
      expect(finalStats.connectedSockets).toBeGreaterThan(0);
    });

    test('应该追踪事件延迟', () => {
      const eventId = socketEventManager.startEventTimer('test_event');
      
      // 模拟一些处理时间
      setTimeout(() => {
        const latency = socketEventManager.endEventTimer(eventId);
        expect(latency).toBeGreaterThan(0);
      }, 10);
    });

    test('应该提供详细的性能指标', () => {
      const metrics = socketEventManager.getPerformanceMetrics();
      
      expect(metrics).toHaveProperty('totalEvents');
      expect(metrics).toHaveProperty('averageLatency');
      expect(metrics).toHaveProperty('eventsPerSecond');
      expect(metrics).toHaveProperty('errorRate');
      expect(metrics).toHaveProperty('memoryUsage');
      
      expect(typeof metrics.totalEvents).toBe('number');
      expect(typeof metrics.averageLatency).toBe('number');
      expect(typeof metrics.eventsPerSecond).toBe('number');
      expect(typeof metrics.errorRate).toBe('number');
    });
  });

  describe('错误处理', () => {
    test('应该优雅处理Socket断开连接', () => {
      socketEventManager.registerSocket(mockSocket1, { userId: 'user1' });
      
      // 模拟Socket断开连接
      mockSocket1.disconnect('test disconnect');
      
      // 尝试向断开的Socket发送事件
      const result = socketEventManager.sendEvent(
        mockSocket1,
        EVENT_TYPES.GAME_STARTED,
        {}
      );
      
      expect(result).toBe(false);
    });

    test('应该处理事件发送错误', () => {
      socketEventManager.registerSocket(mockSocket1, { userId: 'user1' });
      
      // 模拟emit错误
      const originalEmit = mockSocket1.emit;
      mockSocket1.emit = () => {
        throw new Error('Socket emit error');
      };
      
      const result = socketEventManager.sendEvent(
        mockSocket1,
        EVENT_TYPES.GAME_STARTED,
        {}
      );
      
      expect(result).toBe(false);
      
      // 恢复原始emit方法
      mockSocket1.emit = originalEmit;
    });

    test('应该记录错误统计', () => {
      const initialStats = socketEventManager.getStats();
      
      // 触发一些错误
      socketEventManager.sendEvent(null, EVENT_TYPES.GAME_STARTED, {}); // 无效socket
      socketEventManager.validateIncomingEvent('invalid_event', {}, mockSocket1); // 无效事件
      
      const finalStats = socketEventManager.getStats();
      
      expect(finalStats.errors).toBeGreaterThan(initialStats.errors);
    });
  });

  describe('内存管理', () => {
    test('应该清理断开连接的Socket', () => {
      socketEventManager.registerSocket(mockSocket1, { userId: 'user1' });
      
      const initialCount = socketEventManager.getStats().connectedSockets;
      
      // 断开连接并清理
      mockSocket1.disconnect();
      socketEventManager.cleanup();
      
      const finalCount = socketEventManager.getStats().connectedSockets;
      
      expect(finalCount).toBeLessThan(initialCount);
    });

    test('应该限制事件历史记录数量', () => {
      socketEventManager.registerSocket(mockSocket1, { userId: 'user1' });
      
      // 发送大量事件
      for (let i = 0; i < 1500; i++) {
        socketEventManager.sendEvent(mockSocket1, EVENT_TYPES.TIMER_UPDATE, { time: i });
      }
      
      const history = socketEventManager.getEventHistory(mockSocket1.id);
      
      // 应该限制在配置的最大数量内
      expect(history.length).toBeLessThanOrEqual(1000);
    });
  });
});
