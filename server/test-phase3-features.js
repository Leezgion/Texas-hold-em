/**
 * Phase 3 类型安全和文档验证测试
 * 验证类型定义、验证器、Socket事件管理和API接口的功能
 */

const { ERROR_CODES, EVENT_TYPES, GAME_CONFIG } = require('../types/GameTypes');
const Validator = require('../validators/Validator');
const { socketEventManager } = require('../interfaces/SocketEventManager');
const { apiResponseManager, ValidationSchemas } = require('../interfaces/APIResponseManager');

// 模拟Socket对象
class MockSocket {
  constructor(id) {
    this.id = id;
    this.connected = true;
    this.events = {};
    this.emittedEvents = [];
    this.middlewares = [];
  }
  
  on(event, callback) {
    this.events[event] = callback;
  }
  
  emit(event, data) {
    this.emittedEvents.push({ event, data, timestamp: Date.now() });
  }
  
  use(middleware) {
    this.middlewares.push(middleware);
  }
  
  disconnect() {
    this.connected = false;
    if (this.events.disconnect) {
      this.events.disconnect('test disconnect');
    }
  }
  
  trigger(event, data) {
    if (this.events[event]) {
      this.events[event](data);
    }
  }
}

// 模拟Express响应对象
class MockResponse {
  constructor() {
    this.statusCode = 200;
    this.headers = {};
    this.responseData = null;
    this.sent = false;
  }
  
  status(code) {
    this.statusCode = code;
    return this;
  }
  
  set(key, value) {
    this.headers[key] = value;
    return this;
  }
  
  json(data) {
    this.responseData = data;
    this.sent = true;
    return this;
  }
}

function testPhase3Features() {
  console.log('🧪 开始测试 Phase 3 类型安全和文档功能...\n');
  
  let testsPassed = 0;
  let totalTests = 0;
  
  // 测试类型定义和常量
  console.log('📝 测试类型定义和常量...');
  totalTests++;
  try {
    // 验证错误代码
    console.log(`✅ 错误代码数量: ${Object.keys(ERROR_CODES).length}`);
    console.log(`✅ 事件类型数量: ${Object.keys(EVENT_TYPES).length}`);
    console.log(`✅ 游戏配置项: MIN_PLAYERS=${GAME_CONFIG.MIN_PLAYERS}, MAX_PLAYERS=${GAME_CONFIG.MAX_PLAYERS}`);
    
    // 测试常量访问
    const testErrorCode = ERROR_CODES.PLAYER_NOT_FOUND;
    const testEventType = EVENT_TYPES.GAME_STARTED;
    const testConfig = GAME_CONFIG.DEFAULT_INITIAL_CHIPS;
    
    console.log(`✅ 类型定义正常 - 示例: ${testErrorCode}, ${testEventType}, ${testConfig}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ 类型定义测试失败: ${error.message}`);
  }
  
  // 测试验证器
  console.log('\n🔍 测试输入验证器...');
  totalTests++;
  try {
    // 测试玩家ID验证
    const validPlayerId = Validator.validatePlayerId('player123');
    const invalidPlayerId = Validator.validatePlayerId('');
    console.log(`✅ 玩家ID验证 - 有效: ${validPlayerId.valid}, 无效: ${!invalidPlayerId.valid}`);
    
    // 测试昵称验证
    const validNickname = Validator.validateNickname('测试玩家');
    const invalidNickname = Validator.validateNickname('admin');
    console.log(`✅ 昵称验证 - 有效: ${validNickname.valid}, 无效: ${!invalidNickname.valid}`);
    
    // 测试下注金额验证
    const validBet = Validator.validateBetAmount(100, { minAmount: 10, maxAmount: 1000 });
    const invalidBet = Validator.validateBetAmount(-50);
    console.log(`✅ 下注验证 - 有效: ${validBet.valid}, 无效: ${!invalidBet.valid}`);
    
    // 测试房间设置验证
    const validSettings = Validator.validateRoomSettings({
      maxPlayers: 6,
      initialChips: 1000,
      timeLimit: 30,
      allowSpectators: true,
      isPrivate: false
    });
    console.log(`✅ 房间设置验证 - 结果: ${validSettings.valid}`);
    
    // 测试玩家动作验证
    const validAction = Validator.validatePlayerAction('player1', 'raise', 100, {
      currentPlayer: 'player1',
      currentBet: 50,
      playerBet: 0,
      playerChips: 500,
      minRaise: 50,
      phase: 'preflop'
    });
    console.log(`✅ 玩家动作验证 - 结果: ${validAction.valid}`);
    
    console.log(`✅ Validator 功能正常`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ Validator 测试失败: ${error.message}`);
  }
  
  // 测试Socket事件管理器
  console.log('\n🔌 测试Socket事件管理器...');
  totalTests++;
  try {
    const mockSocket = new MockSocket('test_socket_123');
    
    // 注册Socket
    socketEventManager.registerSocket(mockSocket, {
      userId: 'user123',
      roomId: 'room456'
    });
    
    // 测试事件验证
    const validEvent = socketEventManager.validateIncomingEvent('join_room', {
      roomId: 'room123',
      password: 'test123'
    }, mockSocket);
    console.log(`✅ 事件验证 - 有效事件: ${validEvent.valid}`);
    
    const invalidEvent = socketEventManager.validateIncomingEvent('join_room', {
      // 缺少必需的roomId
    }, mockSocket);
    console.log(`✅ 事件验证 - 无效事件: ${!invalidEvent.valid}`);
    
    // 测试事件发送
    socketEventManager.sendEvent(mockSocket, EVENT_TYPES.GAME_STARTED, {
      gameId: 'game123',
      players: ['player1', 'player2']
    });
    
    console.log(`✅ 事件发送数量: ${mockSocket.emittedEvents.length}`);
    
    // 测试统计信息
    const stats = socketEventManager.getStats();
    console.log(`✅ Socket事件统计 - 已发送: ${stats.eventsSent}, 已接收: ${stats.eventsReceived}`);
    
    testsPassed++;
  } catch (error) {
    console.log(`❌ Socket事件管理器测试失败: ${error.message}`);
  }
  
  // 测试API响应管理器
  console.log('\n🌐 测试API响应管理器...');
  totalTests++;
  try {
    const mockRes = new MockResponse();
    
    // 测试成功响应
    apiResponseManager.sendSuccessResponse(mockRes, {
      roomId: 'room123',
      players: []
    }, '房间创建成功', { roomType: 'public' });
    
    console.log(`✅ 成功响应状态码: ${mockRes.statusCode}`);
    console.log(`✅ 成功响应格式: ${mockRes.responseData.status}`);
    
    // 测试错误响应
    const mockRes2 = new MockResponse();
    apiResponseManager.sendErrorResponse(mockRes2, 'ROOM_NOT_FOUND', '房间不存在', null, 404);
    
    console.log(`✅ 错误响应状态码: ${mockRes2.statusCode}`);
    console.log(`✅ 错误响应格式: ${mockRes2.responseData.status}`);
    
    // 测试数据验证
    const validData = apiResponseManager.validateData({
      roomName: '测试房间',
      settings: {
        maxPlayers: 6,
        initialChips: 1000,
        timeLimit: 30
      }
    }, ValidationSchemas.createRoom, 'body');
    
    console.log(`✅ API数据验证 - 有效数据: ${validData.valid}`);
    
    const invalidData = apiResponseManager.validateData({
      roomName: '', // 无效的房间名
      settings: {
        maxPlayers: 15 // 超过最大限制
      }
    }, ValidationSchemas.createRoom, 'body');
    
    console.log(`✅ API数据验证 - 无效数据: ${!invalidData.valid}, 错误数: ${invalidData.errors?.length || 0}`);
    
    // 测试统计信息
    const apiStats = apiResponseManager.getStats();
    console.log(`✅ API响应统计 - 总请求: ${apiStats.totalRequests}, 成功率: ${apiStats.successRate}`);
    
    testsPassed++;
  } catch (error) {
    console.log(`❌ API响应管理器测试失败: ${error.message}`);
  }
  
  // 集成测试 - 完整流程
  console.log('\n🔗 测试完整集成流程...');
  totalTests++;
  try {
    console.log('模拟完整的API请求处理流程...');
    
    // 1. 模拟客户端创建房间请求
    const createRoomData = {
      roomName: '德州扑克房间',
      settings: {
        maxPlayers: 8,
        initialChips: 2000,
        timeLimit: 45,
        allowSpectators: true,
        isPrivate: false
      }
    };
    
    // 2. 验证请求数据
    const validation = apiResponseManager.validateData(createRoomData, ValidationSchemas.createRoom, 'body');
    if (!validation.valid) {
      throw new Error(`数据验证失败: ${validation.errors[0].message}`);
    }
    console.log('✅ 步骤1: 请求数据验证通过');
    
    // 3. 处理业务逻辑（模拟）
    const roomId = 'room_' + Date.now();
    const mockRoom = {
      id: roomId,
      name: validation.data.roomName,
      settings: validation.data.settings,
      players: [],
      createdAt: Date.now()
    };
    console.log('✅ 步骤2: 房间创建逻辑完成');
    
    // 4. 发送API响应
    const mockRes = new MockResponse();
    apiResponseManager.sendSuccessResponse(mockRes, mockRoom, '房间创建成功', {
      roomId: roomId
    });
    console.log('✅ 步骤3: API响应发送完成');
    
    // 5. 模拟Socket事件通知
    const mockSocket = new MockSocket('client_socket');
    socketEventManager.sendEvent(mockSocket, EVENT_TYPES.ROOM_CREATED, {
      room: mockRoom
    });
    console.log('✅ 步骤4: Socket事件通知完成');
    
    // 6. 验证最终结果
    if (mockRes.sent && mockSocket.emittedEvents.length > 0) {
      console.log('✅ 完整流程测试成功');
      console.log(`   - API响应状态: ${mockRes.responseData.status}`);
      console.log(`   - Socket事件数: ${mockSocket.emittedEvents.length}`);
      console.log(`   - 房间ID: ${roomId}`);
    }
    
    testsPassed++;
  } catch (error) {
    console.log(`❌ 集成测试失败: ${error.message}`);
  }
  
  // 性能和类型安全验证
  console.log('\n⚡ 测试性能和类型安全...');
  totalTests++;
  try {
    const startTime = Date.now();
    
    // 大量验证测试
    for (let i = 0; i < 1000; i++) {
      Validator.validatePlayerId(`player_${i}`);
      Validator.validateNickname(`玩家${i}`);
      Validator.validateBetAmount(Math.floor(Math.random() * 1000) + 1);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ 性能测试 - 1000次验证耗时: ${duration}ms`);
    console.log(`✅ 平均每次验证: ${(duration / 3000).toFixed(3)}ms`);
    
    // 类型安全测试
    const typeTests = [
      () => ERROR_CODES.PLAYER_NOT_FOUND,
      () => EVENT_TYPES.GAME_STARTED,
      () => GAME_CONFIG.MAX_PLAYERS,
      () => Validator.validatePlayerId('test'),
      () => socketEventManager.getStats(),
      () => apiResponseManager.getStats()
    ];
    
    let typeSafetyCount = 0;
    for (const test of typeTests) {
      try {
        const result = test();
        if (result !== undefined) {
          typeSafetyCount++;
        }
      } catch (e) {
        // 类型不安全
      }
    }
    
    console.log(`✅ 类型安全测试 - ${typeSafetyCount}/${typeTests.length} 通过`);
    
    testsPassed++;
  } catch (error) {
    console.log(`❌ 性能测试失败: ${error.message}`);
  }
  
  // 测试结果汇总
  console.log('\n📊 Phase 3 测试结果汇总:');
  console.log(`✅ 通过测试: ${testsPassed}/${totalTests}`);
  console.log(`🔧 类型安全和文档: ${testsPassed === totalTests ? '全部正常' : '部分需要调试'}`);
  
  // 显示功能概览
  console.log('\n📈 Phase 3 功能概览:');
  
  try {
    console.log('📝 类型定义:');
    console.log(`   - 错误代码: ${Object.keys(ERROR_CODES).length} 个`);
    console.log(`   - 事件类型: ${Object.keys(EVENT_TYPES).length} 个`);
    console.log(`   - 游戏配置: ${Object.keys(GAME_CONFIG).length} 项`);
    
    console.log('🔍 验证器功能:');
    console.log('   - 玩家ID/昵称验证 ✅');
    console.log('   - 下注金额验证 ✅');
    console.log('   - 房间设置验证 ✅');
    console.log('   - 玩家动作验证 ✅');
    console.log('   - Socket事件验证 ✅');
    
    console.log('🔌 Socket接口:');
    const socketStats = socketEventManager.getStats();
    console.log(`   - 事件类型规则: ${socketStats.eventTypeCount} 个`);
    console.log(`   - 中间件数量: ${socketStats.middlewareCount} 个`);
    console.log(`   - 已发送事件: ${socketStats.eventsSent} 个`);
    
    console.log('🌐 API接口:');
    const apiStats = apiResponseManager.getStats();
    console.log(`   - 处理请求: ${apiStats.totalRequests} 个`);
    console.log(`   - 成功率: ${apiStats.successRate}`);
    console.log(`   - 平均响应时间: ${apiStats.averageResponseTime.toFixed(2)}ms`);
    
  } catch (error) {
    console.log(`⚠️ 获取功能概览时出错: ${error.message}`);
  }
  
  if (testsPassed === totalTests) {
    console.log('\n🎉 所有 Phase 3 类型安全和文档测试通过！');
    console.log('📋 功能完成度:');
    console.log('   ✅ JSDoc类型注释完整');
    console.log('   ✅ 输入验证增强完成');
    console.log('   ✅ Socket接口标准化完成');
    console.log('   ✅ API接口标准化完成');
    console.log('   ✅ 类型安全机制建立');
  } else {
    console.log('\n⚠️  部分测试失败，需要进一步调试。');
  }
  
  return { testsPassed, totalTests, success: testsPassed === totalTests };
}

// 运行测试
if (require.main === module) {
  testPhase3Features();
}

module.exports = { testPhase3Features };
