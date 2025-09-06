/**
 * 德州扑克游戏逻辑核心测试
 * 测试GameLogic.js的所有核心功能
 */

const GameLogic = require('../../gameLogic/GameLogic');
const RoomManager = require('../../gameLogic/RoomManager');

describe('GameLogic Core Tests', () => {
  let gameLogic;
  let mockRoom;
  let mockIo;
  let mockRoomManager;

  beforeEach(() => {
    // 创建模拟对象
    mockIo = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn()
    };

    mockRoomManager = {
      broadcastRoomState: jest.fn()
    };

    mockRoom = {
      id: 'TEST_ROOM',
      settings: {
        duration: 60,
        maxPlayers: 6,
        allowStraddle: false,
        allinDealCount: 3,
        initialChips: 1000
      },
      players: [
        {
          id: 'player1',
          nickname: 'Alice',
          chips: 1000,
          seat: 0,
          isActive: true,
          hand: [],
          currentBet: 0,
          totalBet: 0,
          folded: false,
          allIn: false,
          showHand: false
        },
        {
          id: 'player2', 
          nickname: 'Bob',
          chips: 1000,
          seat: 1,
          isActive: true,
          hand: [],
          currentBet: 0,
          totalBet: 0,
          folded: false,
          allIn: false,
          showHand: false
        }
      ],
      gameStarted: true,
      gameLogic: null,
      startTime: Date.now()
    };

    gameLogic = new GameLogic(mockRoom, mockIo, mockRoomManager);
  });

  describe('基础游戏流程测试', () => {
    test('新手牌开始流程', () => {
      // 执行新手牌开始
      gameLogic.startNewHand();

      // 验证游戏状态
      expect(gameLogic.gamePhase).toBe('preflop');
      expect(gameLogic.pot).toBeGreaterThan(0); // 盲注已下
      expect(gameLogic.communityCards).toEqual([]);
      
      // 验证玩家手牌
      mockRoom.players.forEach(player => {
        expect(player.hand).toHaveLength(2);
        expect(player.folded).toBe(false);
        expect(player.allIn).toBe(false);
      });

      // 验证盲注
      const smallBlind = mockRoom.settings.initialChips / 100;
      const bigBlind = mockRoom.settings.initialChips / 50;
      expect(gameLogic.currentBet).toBe(bigBlind);
    });

    test('发牌功能验证', () => {
      gameLogic.dealCards();
      
      // 每个活跃玩家应该有2张手牌
      const activePlayers = mockRoom.players.filter(p => p.isActive);
      activePlayers.forEach(player => {
        expect(player.hand).toHaveLength(2);
        // 验证牌的有效性
        player.hand.forEach(card => {
          expect(card).toHaveProperty('rank');
          expect(card).toHaveProperty('suit');
          expect(card.rank).toBeGreaterThanOrEqual(2);
          expect(card.rank).toBeLessThanOrEqual(14);
          expect(['hearts', 'diamonds', 'clubs', 'spades']).toContain(card.suit);
        });
      });
    });

    test('盲注下注逻辑', () => {
      const initialChips = [1000, 1000];
      mockRoom.players.forEach((player, index) => {
        player.chips = initialChips[index];
      });

      gameLogic.postBlinds();

      const smallBlind = mockRoom.settings.initialChips / 100;
      const bigBlind = mockRoom.settings.initialChips / 50;

      // 验证小盲注
      expect(mockRoom.players[0].chips).toBe(initialChips[0] - smallBlind);
      expect(mockRoom.players[0].currentBet).toBe(smallBlind);
      
      // 验证大盲注
      expect(mockRoom.players[1].chips).toBe(initialChips[1] - bigBlind);
      expect(mockRoom.players[1].currentBet).toBe(bigBlind);

      // 验证底池
      expect(gameLogic.pot).toBe(smallBlind + bigBlind);
    });
  });

  describe('玩家动作测试', () => {
    beforeEach(() => {
      gameLogic.startNewHand();
    });

    test('弃牌动作', () => {
      const player = mockRoom.players[0];
      
      gameLogic.fold(player);
      
      expect(player.folded).toBe(true);
    });

    test('过牌动作 - 有效情况', () => {
      const player = mockRoom.players[0];
      player.currentBet = gameLogic.currentBet; // 匹配当前下注
      
      expect(() => {
        gameLogic.check(player);
      }).not.toThrow();
    });

    test('过牌动作 - 无效情况', () => {
      const player = mockRoom.players[0];
      player.currentBet = gameLogic.currentBet - 10; // 未匹配当前下注
      
      expect(() => {
        gameLogic.check(player);
      }).toThrow('无法过牌，需要跟注或加注');
    });

    test('跟注动作 - 正常情况', () => {
      const player = mockRoom.players[0];
      const initialChips = player.chips;
      const callAmount = gameLogic.currentBet - player.currentBet;
      
      gameLogic.call(player);
      
      expect(player.chips).toBe(initialChips - callAmount);
      expect(player.currentBet).toBe(gameLogic.currentBet);
    });

    test('跟注动作 - 筹码不足自动All-in', () => {
      const player = mockRoom.players[0];
      const callAmount = gameLogic.currentBet - player.currentBet;
      player.chips = callAmount - 5; // 筹码不足
      
      gameLogic.call(player);
      
      expect(player.chips).toBe(0);
      expect(player.allIn).toBe(true);
    });

    test('加注动作 - 有效加注', () => {
      const player = mockRoom.players[0];
      const raiseAmount = 50;
      const initialChips = player.chips;
      const totalCost = gameLogic.currentBet + raiseAmount - player.currentBet;
      
      gameLogic.raise(player, raiseAmount);
      
      expect(player.chips).toBe(initialChips - totalCost);
      expect(gameLogic.currentBet).toBe(player.currentBet);
      expect(gameLogic.minRaise).toBe(raiseAmount);
    });

    test('加注动作 - 加注金额不足', () => {
      const player = mockRoom.players[0];
      const raiseAmount = gameLogic.minRaise - 1;
      
      expect(() => {
        gameLogic.raise(player, raiseAmount);
      }).toThrow(`加注金额必须至少为 ${gameLogic.minRaise}`);
    });

    test('All-in动作', () => {
      const player = mockRoom.players[0];
      const initialChips = player.chips;
      
      gameLogic.allIn(player);
      
      expect(player.chips).toBe(0);
      expect(player.allIn).toBe(true);
      expect(gameLogic.allinPlayers).toContain(player);
    });
  });

  describe('轮次管理测试', () => {
    beforeEach(() => {
      gameLogic.startNewHand();
    });

    test('正常轮次完成判断', () => {
      // 设置所有玩家匹配当前下注
      mockRoom.players.forEach(player => {
        if (!player.folded && !player.allIn) {
          player.currentBet = gameLogic.currentBet;
        }
      });

      const isCompleted = gameLogic.hasCompletedRound();
      expect(isCompleted).toBe(true);
    });

    test('单玩家剩余场景', () => {
      // 除了一个玩家外都弃牌
      mockRoom.players[1].folded = true;
      
      const isCompleted = gameLogic.hasCompletedRound();
      expect(isCompleted).toBe(true);
    });

    test('All-in玩家场景', () => {
      // 一个玩家All-in，一个玩家弃牌
      mockRoom.players[0].allIn = true;
      mockRoom.players[1].folded = true;
      
      const isCompleted = gameLogic.hasCompletedRound();
      expect(isCompleted).toBe(true);
    });

    test('混合状态 - 需要继续', () => {
      // 一个玩家下注，另一个玩家未跟注
      mockRoom.players[0].currentBet = gameLogic.currentBet;
      mockRoom.players[1].currentBet = gameLogic.currentBet - 10;
      
      const isCompleted = gameLogic.hasCompletedRound();
      expect(isCompleted).toBe(false);
    });
  });

  describe('游戏阶段推进测试', () => {
    beforeEach(() => {
      gameLogic.startNewHand();
    });

    test('Preflop到Flop推进', () => {
      gameLogic.nextPhase();
      
      expect(gameLogic.gamePhase).toBe('flop');
      expect(gameLogic.communityCards).toHaveLength(3);
    });

    test('Flop到Turn推进', () => {
      gameLogic.dealFlop();
      gameLogic.nextPhase();
      
      expect(gameLogic.gamePhase).toBe('turn');
      expect(gameLogic.communityCards).toHaveLength(4);
    });

    test('Turn到River推进', () => {
      gameLogic.dealFlop();
      gameLogic.dealTurn();
      gameLogic.nextPhase();
      
      expect(gameLogic.gamePhase).toBe('river');
      expect(gameLogic.communityCards).toHaveLength(5);
    });

    test('River到Showdown推进', () => {
      gameLogic.dealFlop();
      gameLogic.dealTurn();
      gameLogic.dealRiver();
      gameLogic.nextPhase();
      
      expect(gameLogic.gamePhase).toBe('showdown');
    });
  });

  describe('All-in复杂场景测试', () => {
    test('两玩家All-in多次发牌', () => {
      // 设置两玩家All-in场景
      mockRoom.players[0].allIn = true;
      mockRoom.players[1].allIn = true;
      gameLogic.allinPlayers = [mockRoom.players[0], mockRoom.players[1]];
      
      // 模拟摊牌
      gameLogic.showdown();
      
      // 验证多次发牌结果
      expect(gameLogic.allinResults).toHaveLength(gameLogic.maxAllinRounds);
      
      // 验证每次发牌都有结果
      gameLogic.allinResults.forEach(result => {
        expect(result).toHaveProperty('round');
        expect(result).toHaveProperty('winners');
        expect(result).toHaveProperty('communityCards');
        expect(result.communityCards).toHaveLength(5);
      });
    });

    test('All-in底池分配逻辑', () => {
      const initialPot = 200;
      gameLogic.pot = initialPot;
      
      // 模拟All-in结果 - player1赢2次，player2赢1次
      gameLogic.allinResults = [
        { round: 1, winners: [mockRoom.players[0]] },
        { round: 2, winners: [mockRoom.players[0]] },
        { round: 3, winners: [mockRoom.players[1]] }
      ];
      
      const initialChips = [mockRoom.players[0].chips, mockRoom.players[1].chips];
      
      gameLogic.distributeAllinPot();
      
      // player1应该获得更多筹码 (赢了2/3)
      const player1Winnings = mockRoom.players[0].chips - initialChips[0];
      const player2Winnings = mockRoom.players[1].chips - initialChips[1];
      
      expect(player1Winnings).toBeGreaterThan(player2Winnings);
      expect(player1Winnings + player2Winnings).toBe(initialPot);
    });
  });

  describe('玩家动作处理统一接口测试', () => {
    beforeEach(() => {
      gameLogic.startNewHand();
      // 设置当前玩家
      gameLogic.currentPlayerIndex = 0;
    });

    test('统一动作接口 - 有效动作', () => {
      const playerId = mockRoom.players[0].id;
      
      expect(() => {
        gameLogic.handlePlayerAction(playerId, 'fold');
      }).not.toThrow();
      
      expect(mockRoom.players[0].folded).toBe(true);
    });

    test('统一动作接口 - 无效玩家', () => {
      expect(() => {
        gameLogic.handlePlayerAction('invalid_player', 'fold');
      }).toThrow('玩家不存在');
    });

    test('统一动作接口 - 非当前回合', () => {
      const playerId = mockRoom.players[1].id; // 非当前玩家
      
      expect(() => {
        gameLogic.handlePlayerAction(playerId, 'fold');
      }).toThrow('不是你的回合');
    });

    test('统一动作接口 - 无效动作', () => {
      const playerId = mockRoom.players[0].id;
      
      expect(() => {
        gameLogic.handlePlayerAction(playerId, 'invalid_action');
      }).toThrow('无效的动作');
    });
  });
});
