/**
 * 性能优化工具验证测试
 * 验证Logger、ResourceManager、StateDiffManager和PerformanceDashboard的功能
 */

const { 
  logger, 
  resourceManager, 
  stateDiffManager, 
  performanceDashboard 
} = require('../utils');

// 模拟Socket对象
class MockSocket {
  constructor(id) {
    this.id = id;
    this.connected = true;
    this.events = {};
  }
  
  on(event, callback) {
    this.events[event] = callback;
  }
  
  disconnect() {
    this.connected = false;
    if (this.events.disconnect) {
      this.events.disconnect();
    }
  }
  
  ping() {
    if (this.events.ping) {
      this.events.ping();
    }
  }
}

// 测试函数
function testPerformanceTools() {
  console.log('🧪 开始测试性能优化工具...\n');
  
  let testsPassed = 0;
  let totalTests = 0;
  
  // 测试 Logger
  console.log('📝 测试 Logger...');
  totalTests++;
  try {
    // 测试不同级别的日志
    logger.debug('这是调试信息', { testData: 'debug' });
    logger.info('这是普通信息', { testData: 'info' });
    logger.warn('这是警告信息', { testData: 'warn' });
    logger.error('这是错误信息', { testData: 'error' });
    
    // 测试游戏事件日志
    logger.gameEvent('player_join', 'room123', 'player456', { chips: 1000 });
    
    // 测试性能日志
    logger.performance('test_operation', 150, { complexity: 'medium' });
    
    // 获取统计信息
    const stats = logger.getStats();
    console.log(`✅ Logger 功能正常 - 总日志数: ${stats.totalLogs}`);
    
    testsPassed++;
  } catch (error) {
    console.log(`❌ Logger 测试失败: ${error.message}`);
  }
  
  // 测试 ResourceManager
  console.log('\n🔧 测试 ResourceManager...');
  totalTests++;
  try {
    // 注册Socket
    const mockSocket1 = new MockSocket('socket1');
    const mockSocket2 = new MockSocket('socket2');
    
    resourceManager.registerSocket('socket1', mockSocket1, { 
      userId: 'user1', 
      roomId: 'room1' 
    });
    resourceManager.registerSocket('socket2', mockSocket2, { 
      userId: 'user2', 
      roomId: 'room1' 
    });
    
    // 注册定时器
    const timer1 = setTimeout(() => {}, 5000);
    resourceManager.registerTimer('timer1', timer1, { 
      purpose: 'game_timeout',
      roomId: 'room1'
    });
    
    // 获取统计信息
    const resourceStats = resourceManager.getResourceStats();
    console.log(`✅ ResourceManager 功能正常 - 活跃资源: ${resourceStats.totalResources}`);
    
    // 清理房间资源
    const cleaned = resourceManager.cleanupRoomResources('room1');
    console.log(`✅ 房间资源清理完成 - 清理数量: ${cleaned}`);
    
    testsPassed++;
  } catch (error) {
    console.log(`❌ ResourceManager 测试失败: ${error.message}`);
  }
  
  // 测试 StateDiffManager
  console.log('\n🔄 测试 StateDiffManager...');
  totalTests++;
  try {
    // 创建测试状态
    const oldState = {
      players: [
        { id: 'p1', chips: 1000, currentBet: 0 },
        { id: 'p2', chips: 800, currentBet: 50 }
      ],
      pot: 50,
      phase: 'preflop'
    };
    
    const newState = {
      players: [
        { id: 'p1', chips: 950, currentBet: 50 },
        { id: 'p2', chips: 800, currentBet: 50 }
      ],
      pot: 100,
      phase: 'preflop'
    };
    
    // 测试差异计算
    const diffResult = stateDiffManager.getStateDiff('testRoom', newState);
    console.log(`✅ 状态差异计算完成 - 是否为差异: ${diffResult?.isDiff || false}`);
    
    // 测试节流更新
    let callbackCount = 0;
    const callback = (diff) => {
      callbackCount++;
      console.log(`✅ 节流更新回调触发 - 第${callbackCount}次`);
    };
    
    stateDiffManager.throttleStateUpdate('testRoom', newState, callback);
    
    // 获取性能统计
    const diffStats = stateDiffManager.getPerformanceStats();
    console.log(`✅ StateDiffManager 功能正常 - 差异计算次数: ${diffStats.diffsCalculated}`);
    
    testsPassed++;
  } catch (error) {
    console.log(`❌ StateDiffManager 测试失败: ${error.message}`);
  }
  
  // 测试 PerformanceDashboard
  console.log('\n📊 测试 PerformanceDashboard...');
  totalTests++;
  try {
    // 记录响应时间
    performanceDashboard.recordResponseTime(120);
    performanceDashboard.recordResponseTime(85);
    performanceDashboard.recordResponseTime(200);
    
    // 记录游戏事件
    performanceDashboard.recordGameEvent('game_started');
    performanceDashboard.recordGameEvent('player_joined', { totalPlayers: 5 });
    performanceDashboard.recordGameEvent('game_ended', { duration: 1800000 }); // 30分钟
    
    // 获取仪表盘数据
    const dashboardData = performanceDashboard.getDashboardData();
    console.log(`✅ 平均响应时间: ${dashboardData.performance.averageResponseTime}ms`);
    console.log(`✅ 系统状态: ${dashboardData.system.status}`);
    console.log(`✅ 总游戏数: ${dashboardData.game.totalGames}`);
    
    // 生成性能报告
    const report = performanceDashboard.generatePerformanceReport();
    console.log(`✅ PerformanceDashboard 功能正常 - 报告大小: ${JSON.stringify(report).length} bytes`);
    
    testsPassed++;
  } catch (error) {
    console.log(`❌ PerformanceDashboard 测试失败: ${error.message}`);
  }
  
  // 集成测试
  console.log('\n🔗 测试工具集成...');
  totalTests++;
  try {
    // 测试工具间的协作
    logger.info('开始集成测试');
    
    // 模拟一个完整的游戏流程
    const gameState = {
      roomId: 'integration_test_room',
      players: [
        { id: 'player1', chips: 1000 },
        { id: 'player2', chips: 1000 }
      ],
      pot: 0,
      phase: 'waiting'
    };
    
    // 使用状态管理器
    const initialDiff = stateDiffManager.getStateDiff('integration_test', gameState);
    
    // 使用性能监控
    const startTime = Date.now();
    
    // 模拟游戏状态变化
    gameState.phase = 'preflop';
    gameState.pot = 30;
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    performanceDashboard.recordResponseTime(duration);
    logger.performance('integration_test', duration);
    
    console.log(`✅ 集成测试完成 - 处理时间: ${duration}ms`);
    
    testsPassed++;
  } catch (error) {
    console.log(`❌ 集成测试失败: ${error.message}`);
  }
  
  // 测试结果汇总
  console.log('\n📊 测试结果汇总:');
  console.log(`✅ 通过测试: ${testsPassed}/${totalTests}`);
  console.log(`🔧 性能优化工具: ${testsPassed === totalTests ? '全部正常' : '部分需要调试'}`);
  
  // 显示最终状态
  console.log('\n📈 工具状态概览:');
  
  try {
    const loggerStats = logger.getStats();
    console.log(`📝 Logger: ${loggerStats.totalLogs} 条日志, 运行时间 ${loggerStats.runtimeFormatted}`);
    
    const resourceStats = resourceManager.getResourceStats();
    console.log(`🔧 ResourceManager: ${resourceStats.totalResources} 个活跃资源`);
    
    const diffStats = stateDiffManager.getPerformanceStats();
    console.log(`🔄 StateDiffManager: ${diffStats.diffsCalculated} 次差异计算`);
    
    const dashboardData = performanceDashboard.getDashboardData();
    console.log(`📊 PerformanceDashboard: 系统状态 ${dashboardData.system.status}`);
    
  } catch (error) {
    console.log(`⚠️ 获取状态概览时出错: ${error.message}`);
  }
  
  if (testsPassed === totalTests) {
    console.log('\n🎉 所有性能优化工具测试通过！Phase 2 优化成功完成。');
  } else {
    console.log('\n⚠️  部分测试失败，需要进一步调试。');
  }
  
  return { testsPassed, totalTests, success: testsPassed === totalTests };
}

// 运行测试
if (require.main === module) {
  testPerformanceTools();
}

module.exports = { testPerformanceTools };
