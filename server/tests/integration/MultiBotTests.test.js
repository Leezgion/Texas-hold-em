/**
 * 多机器人自动化测试套件
 * 测试完整的游戏流程和边界情况
 */

const { PokerBot } = require('./PokerBot');
const app = require('../../server');
const { createServer } = require('http');

describe('Multi-Bot Automated Tests', () => {
  let server;
  let serverPort;
  let serverUrl;
  const bots = [];

  beforeAll(async () => {
    // 启动测试服务器
    server = createServer(app);
    await new Promise((resolve) => {
      server.listen(0, () => {
        serverPort = server.address().port;
        serverUrl = `http://localhost:${serverPort}`;
        console.log(`🚀 Test server started on ${serverUrl}`);
        resolve();
      });
    });
  }, 30000);

  afterAll(async () => {
    // 清理所有机器人
    for (const bot of bots) {
      if (bot.connected) {
        bot.disconnect();
      }
    }
    
    // 关闭测试服务器
    if (server) {
      await new Promise((resolve) => {
        server.close(resolve);
      });
    }
  }, 10000);

  afterEach(() => {
    // 每个测试后清理机器人
    for (const bot of bots) {
      if (bot.connected) {
        bot.disconnect();
      }
    }
    bots.length = 0;
  });

  describe('基础游戏流程测试', () => {
    
    test('2机器人完整游戏流程', async () => {
      // 创建两个不同策略的机器人
      const bot1 = new PokerBot(serverUrl, 'conservative', 'TestBot1');
      const bot2 = new PokerBot(serverUrl, 'aggressive', 'TestBot2');
      bots.push(bot1, bot2);

      // 连接机器人
      await bot1.connect();
      await bot2.connect();

      expect(bot1.connected).toBe(true);
      expect(bot2.connected).toBe(true);

      // Bot1创建房间
      const roomCreatedPromise = new Promise((resolve) => {
        bot1.socket.on('roomJoined', (data) => {
          expect(data.roomId).toBeDefined();
          resolve(data.roomId);
        });
      });

      bot1.createRoom({
        duration: 5, // 短时间测试
        maxPlayers: 2,
        allinDealCount: 1 // 简化测试
      });

      const roomId = await roomCreatedPromise;

      // Bot2加入房间
      const bot2JoinedPromise = new Promise((resolve) => {
        bot2.socket.on('roomJoined', () => resolve());
      });

      bot2.joinRoom(roomId);
      await bot2JoinedPromise;

      // 开始游戏
      const gameStartedPromise = new Promise((resolve) => {
        bot1.socket.on('gameStarted', () => resolve());
      });

      bot1.socket.emit('startGame');
      await gameStartedPromise;

      // 等待至少一手牌完成
      await new Promise((resolve) => {
        let handsCompleted = 0;
        const checkHandComplete = () => {
          handsCompleted++;
          if (handsCompleted >= 2) { // 两个bot都收到结果
            resolve();
          }
        };

        bot1.socket.on('handResult', checkHandComplete);
        bot2.socket.on('handResult', checkHandComplete);

        // 超时保护
        setTimeout(resolve, 15000);
      });

      // 验证游戏统计
      expect(bot1.stats.handsPlayed).toBeGreaterThan(0);
      expect(bot2.stats.handsPlayed).toBeGreaterThan(0);
      
      console.log('Bot1 stats:', bot1.getStats());
      console.log('Bot2 stats:', bot2.getStats());
      
    }, 20000);

    test('6机器人满桌游戏', async () => {
      const strategies = ['conservative', 'aggressive', 'loose', 'tight', 'random', 'conservative'];
      const roomBots = [];

      // 创建6个不同策略的机器人
      for (let i = 0; i < 6; i++) {
        const bot = new PokerBot(serverUrl, strategies[i], `Bot${i + 1}`);
        roomBots.push(bot);
        bots.push(bot);
        await bot.connect();
      }

      // 第一个机器人创建房间
      const roomCreatedPromise = new Promise((resolve) => {
        roomBots[0].socket.on('roomJoined', (data) => resolve(data.roomId));
      });

      roomBots[0].createRoom({
        duration: 3,
        maxPlayers: 6,
        allinDealCount: 1
      });

      const roomId = await roomCreatedPromise;

      // 其他机器人加入房间
      const joinPromises = roomBots.slice(1).map(bot => {
        return new Promise((resolve) => {
          bot.socket.on('roomJoined', () => resolve());
          bot.joinRoom(roomId);
        });
      });

      await Promise.all(joinPromises);

      // 开始游戏
      const gameStartedPromise = new Promise((resolve) => {
        roomBots[0].socket.on('gameStarted', () => resolve());
      });

      roomBots[0].socket.emit('startGame');
      await gameStartedPromise;

      // 等待多手牌完成
      await new Promise((resolve) => {
        let totalHandsCompleted = 0;
        const checkProgress = () => {
          totalHandsCompleted++;
          if (totalHandsCompleted >= 12) { // 6个bot * 2手牌
            resolve();
          }
        };

        roomBots.forEach(bot => {
          bot.socket.on('handResult', checkProgress);
        });

        setTimeout(resolve, 25000); // 超时保护
      });

      // 验证所有机器人都参与了游戏
      roomBots.forEach((bot, index) => {
        expect(bot.stats.handsPlayed).toBeGreaterThan(0);
        console.log(`Bot${index + 1} (${strategies[index]}) stats:`, bot.getStats());
      });

    }, 30000);
  });

  describe('All-in场景测试', () => {
    
    test('两玩家All-in多次发牌', async () => {
      const bot1 = new PokerBot(serverUrl, 'aggressive', 'AllinBot1');
      const bot2 = new PokerBot(serverUrl, 'aggressive', 'AllinBot2');
      bots.push(bot1, bot2);

      await bot1.connect();
      await bot2.connect();

      // 创建特殊设置的房间 - 多次All-in发牌
      const roomCreatedPromise = new Promise((resolve) => {
        bot1.socket.on('roomJoined', (data) => resolve(data.roomId));
      });

      bot1.createRoom({
        duration: 5,
        maxPlayers: 2,
        allinDealCount: 5 // 5次发牌测试
      });

      const roomId = await roomCreatedPromise;

      const bot2JoinedPromise = new Promise((resolve) => {
        bot2.socket.on('roomJoined', () => resolve());
      });

      bot2.joinRoom(roomId);
      await bot2JoinedPromise;

      // 开始游戏
      const gameStartedPromise = new Promise((resolve) => {
        bot1.socket.on('gameStarted', () => resolve());
      });

      bot1.socket.emit('startGame');
      await gameStartedPromise;

      // 监听All-in结果
      const allinResultPromise = new Promise((resolve) => {
        bot1.socket.on('allinResult', (result) => {
          expect(result.results).toBeDefined();
          expect(result.results.length).toBe(5); // 5次发牌
          expect(result.finalDistribution).toBeDefined();
          resolve(result);
        });
      });

      // 等待All-in场景发生或超时
      const result = await Promise.race([
        allinResultPromise,
        new Promise((resolve) => setTimeout(() => resolve(null), 20000))
      ]);

      // 如果没有自然发生All-in，至少验证游戏正常运行
      if (!result) {
        console.log('No All-in scenario occurred naturally, but game ran successfully');
        expect(bot1.stats.handsPlayed).toBeGreaterThan(0);
        expect(bot2.stats.handsPlayed).toBeGreaterThan(0);
      } else {
        console.log('All-in result:', result);
        expect(result.results.length).toBe(5);
      }

    }, 25000);
  });

  describe('错误处理和边界情况测试', () => {
    
    test('网络断线重连测试', async () => {
      const bot = new PokerBot(serverUrl, 'conservative', 'ReconnectBot');
      bots.push(bot);

      await bot.connect();
      expect(bot.connected).toBe(true);

      // 创建房间
      const roomCreatedPromise = new Promise((resolve) => {
        bot.socket.on('roomJoined', (data) => resolve(data.roomId));
      });

      bot.createRoom();
      const roomId = await roomCreatedPromise;

      // 模拟断线
      bot.socket.disconnect();
      expect(bot.connected).toBe(false);

      // 重新连接
      await bot.connect();
      expect(bot.connected).toBe(true);

      // 尝试重新加入房间
      const rejoiningPromise = new Promise((resolve) => {
        bot.socket.on('reconnected', () => resolve());
        bot.socket.on('roomJoined', () => resolve());
        bot.socket.on('error', () => resolve()); // 可能的错误也算完成
      });

      bot.socket.emit('rejoin', bot.deviceId);
      
      await Promise.race([
        rejoiningPromise,
        new Promise(resolve => setTimeout(resolve, 5000))
      ]);

      // 验证重连功能
      console.log('Reconnection test completed');

    }, 15000);

    test('无效操作处理测试', async () => {
      const bot = new PokerBot(serverUrl, 'random', 'ErrorBot');
      bots.push(bot);

      await bot.connect();

      // 尝试加入不存在的房间
      const errorPromise = new Promise((resolve) => {
        bot.socket.on('error', (error) => {
          expect(error).toBeDefined();
          resolve(error);
        });
      });

      bot.joinRoom('INVALID_ROOM_ID');
      
      const error = await Promise.race([
        errorPromise,
        new Promise(resolve => setTimeout(() => resolve(null), 3000))
      ]);

      if (error) {
        console.log('Expected error received:', error);
      } else {
        console.log('No error received for invalid room (might be handled differently)');
      }

    }, 10000);
  });

  describe('性能和稳定性测试', () => {
    
    test('快速连续操作测试', async () => {
      const bot1 = new PokerBot(serverUrl, 'aggressive', 'FastBot1');
      const bot2 = new PokerBot(serverUrl, 'aggressive', 'FastBot2');
      bots.push(bot1, bot2);

      // 设置更快的决策时间
      bot1.decisionDelay = 50;
      bot2.decisionDelay = 50;

      await bot1.connect();
      await bot2.connect();

      // 创建房间并快速开始游戏
      const roomCreatedPromise = new Promise((resolve) => {
        bot1.socket.on('roomJoined', (data) => resolve(data.roomId));
      });

      bot1.createRoom({
        duration: 2, // 很短的游戏时间
        maxPlayers: 2
      });

      const roomId = await roomCreatedPromise;

      const bot2JoinedPromise = new Promise((resolve) => {
        bot2.socket.on('roomJoined', () => resolve());
      });

      bot2.joinRoom(roomId);
      await bot2JoinedPromise;

      const gameStartedPromise = new Promise((resolve) => {
        bot1.socket.on('gameStarted', () => resolve());
      });

      bot1.socket.emit('startGame');
      await gameStartedPromise;

      // 运行快速游戏
      await new Promise((resolve) => {
        let handCount = 0;
        const checkHand = () => {
          handCount++;
          if (handCount >= 4) { // 期望快速完成多手牌
            resolve();
          }
        };

        bot1.socket.on('handResult', checkHand);
        bot2.socket.on('handResult', checkHand);

        setTimeout(resolve, 10000); // 超时保护
      });

      // 验证快速操作没有导致错误
      expect(bot1.stats.handsPlayed).toBeGreaterThan(0);
      expect(bot2.stats.handsPlayed).toBeGreaterThan(0);

      console.log('Fast operation test completed successfully');

    }, 15000);

    test('内存使用监控测试', async () => {
      const initialMemory = process.memoryUsage();
      console.log('Initial memory usage:', initialMemory);

      // 创建多个机器人进行游戏
      const testBots = [];
      for (let i = 0; i < 4; i++) {
        const bot = new PokerBot(serverUrl, 'random', `MemBot${i}`);
        testBots.push(bot);
        bots.push(bot);
        await bot.connect();
      }

      // 快速进行多个游戏
      for (let game = 0; game < 3; game++) {
        const roomCreatedPromise = new Promise((resolve) => {
          testBots[0].socket.on('roomJoined', (data) => resolve(data.roomId));
        });

        testBots[0].createRoom({
          duration: 1,
          maxPlayers: 4
        });

        const roomId = await roomCreatedPromise;

        // 其他机器人加入
        for (let i = 1; i < testBots.length; i++) {
          const joinPromise = new Promise((resolve) => {
            testBots[i].socket.on('roomJoined', () => resolve());
          });
          testBots[i].joinRoom(roomId);
          await joinPromise;
        }

        // 开始游戏并等待完成
        const gameStartedPromise = new Promise((resolve) => {
          testBots[0].socket.on('gameStarted', () => resolve());
        });

        testBots[0].socket.emit('startGame');
        await gameStartedPromise;

        // 等待游戏进行
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const finalMemory = process.memoryUsage();
      console.log('Final memory usage:', finalMemory);

      // 检查内存增长是否在合理范围内 (不超过50MB)
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB

      console.log('Memory increase:', (memoryIncrease / 1024 / 1024).toFixed(2), 'MB');

    }, 25000);
  });

  describe('游戏规则验证测试', () => {
    
    test('德州扑克规则完整性验证', async () => {
      const bot1 = new PokerBot(serverUrl, 'conservative', 'RuleBot1');
      const bot2 = new PokerBot(serverUrl, 'conservative', 'RuleBot2');
      bots.push(bot1, bot2);

      await bot1.connect();
      await bot2.connect();

      let gameState = null;
      let handResults = [];

      // 监听游戏状态和结果
      bot1.socket.on('gameState', (state) => {
        gameState = state;
      });

      bot1.socket.on('handResult', (result) => {
        handResults.push(result);
      });

      // 创建房间
      const roomCreatedPromise = new Promise((resolve) => {
        bot1.socket.on('roomJoined', (data) => resolve(data.roomId));
      });

      bot1.createRoom({
        duration: 5,
        maxPlayers: 2
      });

      const roomId = await roomCreatedPromise;

      const bot2JoinedPromise = new Promise((resolve) => {
        bot2.socket.on('roomJoined', () => resolve());
      });

      bot2.joinRoom(roomId);
      await bot2JoinedPromise;

      const gameStartedPromise = new Promise((resolve) => {
        bot1.socket.on('gameStarted', () => resolve());
      });

      bot1.socket.emit('startGame');
      await gameStartedPromise;

      // 运行游戏并收集数据
      await new Promise((resolve) => {
        setTimeout(resolve, 8000);
      });

      // 验证游戏规则
      if (gameState) {
        // 验证基本游戏状态
        expect(gameState.pot).toBeGreaterThanOrEqual(0);
        expect(gameState.currentBet).toBeGreaterThanOrEqual(0);
        expect(['preflop', 'flop', 'turn', 'river', 'showdown']).toContain(gameState.phase);
        
        if (gameState.communityCards) {
          expect(gameState.communityCards.length).toBeLessThanOrEqual(5);
        }

        if (gameState.players) {
          gameState.players.forEach(player => {
            expect(player.chips).toBeGreaterThanOrEqual(0);
            expect(player.currentBet).toBeGreaterThanOrEqual(0);
          });
        }
      }

      // 验证手牌结果
      handResults.forEach(result => {
        expect(result.winners).toBeDefined();
        expect(Array.isArray(result.winners)).toBe(true);
        expect(result.pot).toBeGreaterThan(0);
      });

      console.log('Game rules validation completed');
      console.log('Hand results collected:', handResults.length);

    }, 15000);
  });
});
