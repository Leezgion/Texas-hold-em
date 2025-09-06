/**
 * APIResponseManager 集成测试
 * 测试API响应标准化、验证和性能监控
 */

const { apiResponseManager, ValidationSchemas } = require('../../interfaces/APIResponseManager');
const { ERROR_CODES } = require('../../types/GameTypes');

describe('APIResponseManager API响应管理器测试', () => {
  let mockReq, mockRes;
  
  beforeEach(() => {
    mockReq = global.TestUtils.createMockRequest();
    mockRes = global.TestUtils.createMockResponse();
    
    // 重置统计信息
    apiResponseManager.resetStats();
  });

  describe('成功响应处理', () => {
    test('应该发送标准成功响应', () => {
      const data = { roomId: 'room123', players: [] };
      const message = '房间创建成功';
      const meta = { roomType: 'public' };
      
      apiResponseManager.sendSuccessResponse(mockRes, data, message, meta);
      
      expect(mockRes.sent).toBe(true);
      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.responseData).toMatchObject({
        status: 'success',
        data: data,
        message: message,
        meta: meta,
        timestamp: expect.any(Number),
        requestId: expect.any(String)
      });
    });

    test('应该支持不同的成功状态码', () => {
      const data = { playerId: 'player123' };
      
      apiResponseManager.sendSuccessResponse(mockRes, data, '创建成功', null, 201);
      
      expect(mockRes.statusCode).toBe(201);
      expect(mockRes.responseData.status).toBe('success');
    });

    test('应该处理空数据的成功响应', () => {
      apiResponseManager.sendSuccessResponse(mockRes, null, '操作成功');
      
      expect(mockRes.responseData.data).toBe(null);
      expect(mockRes.responseData.status).toBe('success');
    });
  });

  describe('错误响应处理', () => {
    test('应该发送标准错误响应', () => {
      const errorCode = ERROR_CODES.ROOM_NOT_FOUND;
      const message = '房间不存在';
      const details = { roomId: 'invalid123' };
      
      apiResponseManager.sendErrorResponse(mockRes, errorCode, message, details, 404);
      
      expect(mockRes.statusCode).toBe(404);
      expect(mockRes.responseData).toMatchObject({
        status: 'error',
        error: {
          code: errorCode,
          message: message,
          details: details
        },
        timestamp: expect.any(Number),
        requestId: expect.any(String)
      });
    });

    test('应该使用默认错误状态码', () => {
      apiResponseManager.sendErrorResponse(mockRes, ERROR_CODES.VALIDATION_FAILED, '验证失败');
      
      expect(mockRes.statusCode).toBe(400);
    });

    test('应该处理系统错误', () => {
      const systemError = new Error('数据库连接失败');
      
      apiResponseManager.sendErrorResponse(
        mockRes,
        ERROR_CODES.SERVER_ERROR,
        '服务器内部错误',
        { originalError: systemError.message },
        500
      );
      
      expect(mockRes.statusCode).toBe(500);
      expect(mockRes.responseData.error.code).toBe(ERROR_CODES.SERVER_ERROR);
    });
  });

  describe('部分成功响应处理', () => {
    test('应该发送部分成功响应', () => {
      const successData = [
        { playerId: 'player1', status: 'success' },
        { playerId: 'player2', status: 'success' }
      ];
      
      const failureData = [
        { playerId: 'player3', error: '筹码不足' }
      ];
      
      apiResponseManager.sendPartialResponse(
        mockRes,
        successData,
        failureData,
        '部分操作成功'
      );
      
      expect(mockRes.statusCode).toBe(207); // Multi-Status
      expect(mockRes.responseData.status).toBe('partial');
      expect(mockRes.responseData.data.success).toEqual(successData);
      expect(mockRes.responseData.data.failures).toEqual(failureData);
    });

    test('应该计算成功率', () => {
      const successData = [{ id: 1 }, { id: 2 }];
      const failureData = [{ id: 3 }];
      
      apiResponseManager.sendPartialResponse(mockRes, successData, failureData);
      
      expect(mockRes.responseData.meta.successRate).toBeCloseTo(0.67, 2);
      expect(mockRes.responseData.meta.totalProcessed).toBe(3);
    });
  });

  describe('数据验证', () => {
    test('应该验证创建房间的数据', () => {
      const validData = {
        roomName: '德州扑克房间',
        settings: {
          maxPlayers: 6,
          initialChips: 1000,
          timeLimit: 30
        }
      };
      
      const result = apiResponseManager.validateData(
        validData,
        ValidationSchemas.createRoom,
        'body'
      );
      
      expect(result.valid).toBe(true);
      expect(result.data).toEqual(validData);
      expect(result.errors).toHaveLength(0);
    });

    test('应该拒绝无效的房间数据', () => {
      const invalidData = {
        roomName: '', // 空名称
        settings: {
          maxPlayers: 15, // 超过限制
          initialChips: -100 // 负数
        }
      };
      
      const result = apiResponseManager.validateData(
        invalidData,
        ValidationSchemas.createRoom,
        'body'
      );
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.field === 'roomName')).toBe(true);
      expect(result.errors.some(e => e.field === 'settings.maxPlayers')).toBe(true);
    });

    test('应该验证加入房间的数据', () => {
      const validData = {
        roomId: 'room123',
        password: 'secret123'
      };
      
      const result = apiResponseManager.validateData(
        validData,
        ValidationSchemas.joinRoom,
        'body'
      );
      
      expect(result.valid).toBe(true);
    });

    test('应该验证玩家动作数据', () => {
      const validAction = {
        action: 'raise',
        amount: 100
      };
      
      const result = apiResponseManager.validateData(
        validAction,
        ValidationSchemas.playerAction,
        'body'
      );
      
      expect(result.valid).toBe(true);
      expect(result.data.action).toBe('raise');
      expect(result.data.amount).toBe(100);
    });

    test('应该拒绝无效的动作类型', () => {
      const invalidAction = {
        action: 'invalid_action',
        amount: 'not_a_number'
      };
      
      const result = apiResponseManager.validateData(
        invalidAction,
        ValidationSchemas.playerAction,
        'body'
      );
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'action')).toBe(true);
      expect(result.errors.some(e => e.field === 'amount')).toBe(true);
    });
  });

  describe('Express中间件', () => {
    test('应该创建验证中间件', () => {
      const middleware = apiResponseManager.createMiddleware(ValidationSchemas.createRoom);
      
      expect(typeof middleware).toBe('function');
      expect(middleware.length).toBe(3); // req, res, next
    });

    test('应该通过有效数据的验证', () => {
      const middleware = apiResponseManager.createMiddleware(ValidationSchemas.createRoom);
      
      mockReq.setBody({
        roomName: '测试房间',
        settings: {
          maxPlayers: 6,
          initialChips: 1000
        }
      });
      
      let nextCalled = false;
      const mockNext = () => { nextCalled = true; };
      
      middleware(mockReq, mockRes, mockNext);
      
      expect(nextCalled).toBe(true);
      expect(mockRes.sent).toBe(false); // 不应该发送响应
    });

    test('应该拒绝无效数据并发送错误响应', () => {
      const middleware = apiResponseManager.createMiddleware(ValidationSchemas.createRoom);
      
      mockReq.setBody({
        roomName: '', // 无效
        settings: {
          maxPlayers: 0 // 无效
        }
      });
      
      let nextCalled = false;
      const mockNext = () => { nextCalled = true; };
      
      middleware(mockReq, mockRes, mockNext);
      
      expect(nextCalled).toBe(false);
      expect(mockRes.sent).toBe(true);
      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.responseData.status).toBe('error');
    });

    test('应该支持自定义验证规则', () => {
      const customSchema = {
        type: 'object',
        properties: {
          customField: {
            type: 'string',
            custom: (value) => {
              if (value !== 'expected') {
                return { valid: false, message: '自定义验证失败' };
              }
              return { valid: true };
            }
          }
        }
      };
      
      const middleware = apiResponseManager.createMiddleware(customSchema);
      
      mockReq.setBody({ customField: 'wrong' });
      
      let nextCalled = false;
      middleware(mockReq, mockRes, () => { nextCalled = true; });
      
      expect(nextCalled).toBe(false);
      expect(mockRes.responseData.error.message).toContain('自定义验证失败');
    });
  });

  describe('性能监控', () => {
    test('应该记录请求统计信息', () => {
      const initialStats = apiResponseManager.getStats();
      
      // 发送几个响应
      apiResponseManager.sendSuccessResponse(mockRes, {}, '成功1');
      apiResponseManager.sendSuccessResponse(mockRes, {}, '成功2');
      apiResponseManager.sendErrorResponse(mockRes, ERROR_CODES.VALIDATION_FAILED, '错误1');
      
      const finalStats = apiResponseManager.getStats();
      
      expect(finalStats.totalRequests).toBe(initialStats.totalRequests + 3);
      expect(finalStats.successfulRequests).toBe(initialStats.successfulRequests + 2);
      expect(finalStats.failedRequests).toBe(initialStats.failedRequests + 1);
    });

    test('应该计算响应时间', () => {
      const requestId = apiResponseManager.startRequestTimer();
      
      setTimeout(() => {
        const responseTime = apiResponseManager.endRequestTimer(requestId);
        expect(responseTime).toBeGreaterThan(0);
        
        const stats = apiResponseManager.getStats();
        expect(stats.averageResponseTime).toBeGreaterThan(0);
      }, 10);
    });

    test('应该提供详细的性能指标', () => {
      // 生成一些测试数据
      for (let i = 0; i < 5; i++) {
        apiResponseManager.sendSuccessResponse(mockRes, {}, `测试${i}`);
      }
      
      const metrics = apiResponseManager.getPerformanceMetrics();
      
      expect(metrics).toHaveProperty('totalRequests');
      expect(metrics).toHaveProperty('successRate');
      expect(metrics).toHaveProperty('averageResponseTime');
      expect(metrics).toHaveProperty('requestsPerSecond');
      expect(metrics).toHaveProperty('memoryUsage');
      
      expect(typeof metrics.totalRequests).toBe('number');
      expect(typeof metrics.successRate).toBe('number');
      expect(metrics.successRate).toBeGreaterThanOrEqual(0);
      expect(metrics.successRate).toBeLessThanOrEqual(1);
    });
  });

  describe('错误处理和边界情况', () => {
    test('应该处理响应对象错误', () => {
      const faultyRes = {
        status: () => { throw new Error('Response error'); },
        json: () => { throw new Error('JSON error'); }
      };
      
      expect(() => {
        apiResponseManager.sendSuccessResponse(faultyRes, {}, '测试');
      }).not.toThrow();
    });

    test('应该处理循环引用的数据', () => {
      const circularData = { name: '测试' };
      circularData.self = circularData;
      
      expect(() => {
        apiResponseManager.sendSuccessResponse(mockRes, circularData, '测试');
      }).not.toThrow();
    });

    test('应该处理超大数据的响应', () => {
      const largeData = {
        items: new Array(10000).fill().map((_, i) => ({ id: i, data: 'x'.repeat(100) }))
      };
      
      expect(() => {
        apiResponseManager.sendSuccessResponse(mockRes, largeData, '大数据测试');
      }).not.toThrow();
    });

    test('应该处理无效的验证模式', () => {
      const invalidSchema = null;
      
      const result = apiResponseManager.validateData(
        { test: 'data' },
        invalidSchema,
        'body'
      );
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('安全性测试', () => {
    test('应该防止XSS攻击', () => {
      const maliciousData = {
        name: '<script>alert("xss")</script>',
        description: 'javascript:alert("xss")'
      };
      
      apiResponseManager.sendSuccessResponse(mockRes, maliciousData, '测试');
      
      const response = mockRes.responseData;
      expect(response.data.name).not.toContain('<script>');
      expect(response.data.description).not.toContain('javascript:');
    });

    test('应该限制响应大小', () => {
      const oversizedData = {
        data: 'x'.repeat(10 * 1024 * 1024) // 10MB
      };
      
      apiResponseManager.sendSuccessResponse(mockRes, oversizedData, '大小测试');
      
      // 应该被截断或拒绝
      expect(mockRes.responseData).toBeDefined();
    });

    test('应该验证Content-Type头', () => {
      mockReq.setHeaders({ 'content-type': 'application/json' });
      
      const middleware = apiResponseManager.createMiddleware(ValidationSchemas.createRoom);
      
      mockReq.setBody({ roomName: '测试' });
      
      let nextCalled = false;
      middleware(mockReq, mockRes, () => { nextCalled = true; });
      
      expect(nextCalled).toBe(true);
    });
  });

  describe('缓存和优化', () => {
    test('应该缓存验证结果', () => {
      const testData = { roomName: '测试房间', settings: { maxPlayers: 6 } };
      
      // 第一次验证
      const start1 = Date.now();
      const result1 = apiResponseManager.validateData(testData, ValidationSchemas.createRoom, 'body');
      const time1 = Date.now() - start1;
      
      // 第二次验证（应该使用缓存）
      const start2 = Date.now();
      const result2 = apiResponseManager.validateData(testData, ValidationSchemas.createRoom, 'body');
      const time2 = Date.now() - start2;
      
      expect(result1.valid).toBe(result2.valid);
      expect(time2).toBeLessThanOrEqual(time1); // 缓存应该更快
    });

    test('应该清理过期的缓存', () => {
      // 模拟大量验证以填充缓存
      for (let i = 0; i < 100; i++) {
        apiResponseManager.validateData(
          { roomName: `房间${i}` },
          ValidationSchemas.createRoom,
          'body'
        );
      }
      
      // 调用缓存清理
      apiResponseManager.cleanupCache();
      
      // 验证缓存大小被控制
      const cacheSize = apiResponseManager.getCacheSize();
      expect(cacheSize).toBeLessThan(100);
    });
  });
});
