/**
 * 管理器类功能验证测试
 * 验证新创建的管理器类的基本功能
 */

const { PlayerManager, BettingManager, PotManager, PhaseManager } = require('../gameLogic/managers');

// 模拟游戏状态
function createMockGameState() {
  return {
    phase: 'preflop',
    pot: 0,
    currentBet: 0,
    minRaise: 20,
    currentPlayerIndex: 0,
    dealerIndex: 0,
    roundStartIndex: 0,
    lastRaiseIndex: -1,
    communityCards: [],
    allinPlayers: [],
    room: {
      settings: {
        initialChips: 1000
      }
    }
  };
}

// 模拟玩家数据
function createMockPlayers() {
  return [
    {
      id: 'player1',
      nickname: '玩家1',
      chips: 1000,
      currentBet: 0,
      totalBet: 0,
      holeCards: [],
      folded: false,
      allIn: false
    },
    {
      id: 'player2',
      nickname: '玩家2',
      chips: 1000,
      currentBet: 0,
      totalBet: 0,
      holeCards: [],
      folded: false,
      allIn: false
    },
    {
      id: 'player3',
      nickname: '玩家3',
      chips: 1000,
      currentBet: 0,
      totalBet: 0,
      holeCards: [],
      folded: false,
      allIn: false
    }
  ];
}

// 测试函数
function testManagerClasses() {
  console.log('🧪 开始测试管理器类功能...\n');
  
  const gameState = createMockGameState();
  const players = createMockPlayers();
  
  // 创建管理器实例
  const playerManager = new PlayerManager(gameState, players);
  const bettingManager = new BettingManager(gameState, playerManager);
  const potManager = new PotManager(gameState, playerManager);
  const phaseManager = new PhaseManager(gameState, playerManager, bettingManager, potManager);
  
  let testsPassed = 0;
  let totalTests = 0;
  
  // 测试 PlayerManager
  console.log('📋 测试 PlayerManager...');
  totalTests++;
  try {
    const activePlayers = playerManager.getActivePlayers();
    console.log(`✅ getActivePlayers(): ${activePlayers.length} 个活跃玩家`);
    
    const canCheck = playerManager.canCheck('player1', 0);
    console.log(`✅ canCheck(): 玩家1可以过牌 = ${canCheck}`);
    
    const callAmount = playerManager.getCallAmount('player1', 50);
    console.log(`✅ getCallAmount(): 玩家1需要跟注 ${callAmount} 筹码`);
    
    testsPassed++;
  } catch (error) {
    console.log(`❌ PlayerManager 测试失败: ${error.message}`);
  }
  
  // 测试 BettingManager
  console.log('\n💰 测试 BettingManager...');
  totalTests++;
  try {
    const checkResult = bettingManager.processCheck(players[0]);
    console.log(`✅ processCheck(): ${checkResult.message}`);
    
    const bigBlind = bettingManager.calculateBigBlind(1000);
    const smallBlind = bettingManager.calculateSmallBlind(1000);
    console.log(`✅ 盲注计算: 小盲注=${smallBlind}, 大盲注=${bigBlind}`);
    
    const validation = bettingManager.validateRaise(players[0], 50);
    console.log(`✅ validateRaise(): 加注验证 = ${validation.valid}`);
    
    testsPassed++;
  } catch (error) {
    console.log(`❌ BettingManager 测试失败: ${error.message}`);
  }
  
  // 测试 PotManager
  console.log('\n🎯 测试 PotManager...');
  totalTests++;
  try {
    // 设置一些下注来测试奖池计算
    players[0].totalBet = 100;
    players[1].totalBet = 200;
    players[2].totalBet = 150;
    
    const pots = potManager.calculatePots(players);
    console.log(`✅ calculatePots(): 计算出 ${pots.length} 个奖池`);
    
    const simplePot = potManager.calculateSimplePot();
    console.log(`✅ calculateSimplePot(): 总奖池 = ${simplePot.total}`);
    
    const validation = potManager.validatePotCalculation();
    console.log(`✅ validatePotCalculation(): 奖池验证 = ${validation.valid}`);
    
    testsPassed++;
  } catch (error) {
    console.log(`❌ PotManager 测试失败: ${error.message}`);
  }
  
  // 测试 PhaseManager
  console.log('\n🎮 测试 PhaseManager...');
  totalTests++;
  try {
    const phaseInfo = phaseManager.getCurrentPhaseInfo();
    console.log(`✅ getCurrentPhaseInfo(): 当前阶段 = ${phaseInfo.phaseName}`);
    
    const transition = phaseManager.validatePhaseTransition('preflop', 'flop');
    console.log(`✅ validatePhaseTransition(): preflop->flop = ${transition}`);
    
    const endConditions = phaseManager.checkGameEndConditions();
    console.log(`✅ checkGameEndConditions(): 游戏应结束 = ${endConditions.shouldEnd}`);
    
    testsPassed++;
  } catch (error) {
    console.log(`❌ PhaseManager 测试失败: ${error.message}`);
  }
  
  // 测试结果汇总
  console.log('\n📊 测试结果汇总:');
  console.log(`✅ 通过测试: ${testsPassed}/${totalTests}`);
  console.log(`🔧 管理器类功能: ${testsPassed === totalTests ? '正常' : '需要调试'}`);
  
  if (testsPassed === totalTests) {
    console.log('\n🎉 所有管理器类测试通过！Phase 1 重构成功完成。');
  } else {
    console.log('\n⚠️  部分测试失败，需要进一步调试。');
  }
  
  return { testsPassed, totalTests, success: testsPassed === totalTests };
}

// 运行测试
if (require.main === module) {
  testManagerClasses();
}

module.exports = { testManagerClasses, createMockGameState, createMockPlayers };
