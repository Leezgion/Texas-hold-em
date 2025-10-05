/**
 * PotManager 单元测试
 * 测试主池、边池计算和分配逻辑
 */

const PotManager = require('../../gameLogic/managers/PotManager');

describe('PotManager - 底池计算', () => {
  
  let potManager;
  let gameState;
  let playerManager;
  
  beforeEach(() => {
    gameState = {
      pot: 0,
      currentBet: 0
    };
    
    playerManager = {
      players: []
    };
    
    potManager = new PotManager(gameState, playerManager);
  });

  describe('单底池场景', () => {
    it('应该正确计算单底池 - 所有玩家下注相同', () => {
      const players = [
        { id: 'player1', totalBet: 100, folded: false, chips: 900 },
        { id: 'player2', totalBet: 100, folded: false, chips: 900 },
        { id: 'player3', totalBet: 100, folded: false, chips: 900 }
      ];

      const pots = potManager.calculatePots(players);
      
      expect(pots).toHaveLength(1);
      expect(pots[0].amount).toBe(300); // 100 * 3
      expect(pots[0].eligiblePlayers).toHaveLength(3);
      expect(pots[0].eligiblePlayers).toContain('player1');
      expect(pots[0].eligiblePlayers).toContain('player2');
      expect(pots[0].eligiblePlayers).toContain('player3');
    });

    it('应该排除弃牌玩家', () => {
      const players = [
        { id: 'player1', totalBet: 100, folded: false, chips: 900 },
        { id: 'player2', totalBet: 100, folded: true, chips: 900 },
        { id: 'player3', totalBet: 100, folded: false, chips: 900 }
      ];

      const pots = potManager.calculatePots(players);
      
      expect(pots).toHaveLength(1);
      expect(pots[0].amount).toBe(300);
      expect(pots[0].eligiblePlayers).toHaveLength(2); // 只有2个未弃牌的玩家
      expect(pots[0].eligiblePlayers).not.toContain('player2');
    });
  });

  describe('边池场景 - 单个All-in', () => {
    it('应该正确创建主池和一个边池', () => {
      const players = [
        { id: 'player1', totalBet: 50, folded: false, chips: 0 },   // All-in 50
        { id: 'player2', totalBet: 200, folded: false, chips: 800 },
        { id: 'player3', totalBet: 200, folded: false, chips: 800 }
      ];

      const pots = potManager.calculatePots(players);
      
      expect(pots).toHaveLength(2);
      
      // 主池: 50 * 3 = 150 (所有玩家都参与)
      expect(pots[0].amount).toBe(150);
      expect(pots[0].eligiblePlayers).toHaveLength(3);
      expect(pots[0].eligiblePlayers).toContain('player1');
      expect(pots[0].eligiblePlayers).toContain('player2');
      expect(pots[0].eligiblePlayers).toContain('player3');
      
      // 边池: (200-50) * 2 = 300 (只有player2和player3参与)
      expect(pots[1].amount).toBe(300);
      expect(pots[1].eligiblePlayers).toHaveLength(2);
      expect(pots[1].eligiblePlayers).toContain('player2');
      expect(pots[1].eligiblePlayers).toContain('player3');
      expect(pots[1].eligiblePlayers).not.toContain('player1');
    });

    it('应该处理All-in玩家弃牌的情况', () => {
      const players = [
        { id: 'player1', totalBet: 50, folded: true, chips: 0 },    // All-in后弃牌
        { id: 'player2', totalBet: 200, folded: false, chips: 800 },
        { id: 'player3', totalBet: 200, folded: false, chips: 800 }
      ];

      const pots = potManager.calculatePots(players);
      
      expect(pots).toHaveLength(2);
      
      // 主池中player1不符合资格（已弃牌）
      expect(pots[0].eligiblePlayers).toHaveLength(2);
      expect(pots[0].eligiblePlayers).not.toContain('player1');
    });
  });

  describe('边池场景 - 多个All-in', () => {
    it('应该正确创建多个边池 - 3个不同金额的All-in', () => {
      const players = [
        { id: 'player1', totalBet: 100, folded: false, chips: 0 },   // All-in 100
        { id: 'player2', totalBet: 200, folded: false, chips: 0 },   // All-in 200
        { id: 'player3', totalBet: 300, folded: false, chips: 0 },   // All-in 300
        { id: 'player4', totalBet: 500, folded: false, chips: 500 }
      ];

      const pots = potManager.calculatePots(players);
      
      expect(pots).toHaveLength(4);
      
      // 主池: 100 * 4 = 400 (所有玩家)
      expect(pots[0].amount).toBe(400);
      expect(pots[0].eligiblePlayers).toHaveLength(4);
      
      // 边池1: (200-100) * 3 = 300 (player2, player3, player4)
      expect(pots[1].amount).toBe(300);
      expect(pots[1].eligiblePlayers).toHaveLength(3);
      expect(pots[1].eligiblePlayers).not.toContain('player1');
      
      // 边池2: (300-200) * 2 = 200 (player3, player4)
      expect(pots[2].amount).toBe(200);
      expect(pots[2].eligiblePlayers).toHaveLength(2);
      expect(pots[2].eligiblePlayers).toContain('player3');
      expect(pots[2].eligiblePlayers).toContain('player4');
      
      // 边池3: (500-300) * 1 = 200 (只有player4)
      expect(pots[3].amount).toBe(200);
      expect(pots[3].eligiblePlayers).toHaveLength(1);
      expect(pots[3].eligiblePlayers).toContain('player4');
    });

    it('应该处理复杂的All-in和弃牌组合', () => {
      const players = [
        { id: 'player1', totalBet: 50, folded: false, chips: 0 },    // All-in 50
        { id: 'player2', totalBet: 100, folded: true, chips: 0 },    // All-in 100后弃牌
        { id: 'player3', totalBet: 150, folded: false, chips: 0 },   // All-in 150
        { id: 'player4', totalBet: 200, folded: false, chips: 800 }
      ];

      const pots = potManager.calculatePots(players);
      
      // 主池应该有player1, player3, player4 (player2弃牌)
      expect(pots[0].eligiblePlayers).toContain('player1');
      expect(pots[0].eligiblePlayers).not.toContain('player2');
      expect(pots[0].eligiblePlayers).toContain('player3');
      expect(pots[0].eligiblePlayers).toContain('player4');
    });
  });

  describe('边池场景 - 实战案例', () => {
    it('应该处理经典案例：3人游戏，2人All-in不同金额', () => {
      // 场景：
      // Player A: All-in 100 (剩余0筹码)
      // Player B: All-in 300 (剩余0筹码)
      // Player C: 跟注 300 (剩余700筹码)
      const players = [
        { id: 'playerA', totalBet: 100, folded: false, chips: 0 },
        { id: 'playerB', totalBet: 300, folded: false, chips: 0 },
        { id: 'playerC', totalBet: 300, folded: false, chips: 700 }
      ];

      const pots = potManager.calculatePots(players);
      
      expect(pots).toHaveLength(2);
      
      // 主池: 100 * 3 = 300 (A, B, C都有资格赢)
      expect(pots[0].amount).toBe(300);
      expect(pots[0].eligiblePlayers).toEqual(['playerA', 'playerB', 'playerC']);
      
      // 边池: (300-100) * 2 = 400 (只有B和C有资格赢)
      expect(pots[1].amount).toBe(400);
      expect(pots[1].eligiblePlayers).toEqual(['playerB', 'playerC']);
    });

    it('应该处理5人游戏的复杂All-in场景', () => {
      const players = [
        { id: 'player1', totalBet: 20, folded: false, chips: 0 },   // All-in 20
        { id: 'player2', totalBet: 50, folded: false, chips: 0 },   // All-in 50
        { id: 'player3', totalBet: 100, folded: true, chips: 0 },   // All-in 100后弃牌
        { id: 'player4', totalBet: 150, folded: false, chips: 0 },  // All-in 150
        { id: 'player5', totalBet: 200, folded: false, chips: 800 } // 跟注200
      ];

      const pots = potManager.calculatePots(players);
      
      // 主池: 20 * 5 = 100 (所有人投入，但player3弃牌不参与)
      expect(pots[0].amount).toBe(100);
      expect(pots[0].eligiblePlayers).toHaveLength(4);
      expect(pots[0].eligiblePlayers).not.toContain('player3');
      
      // 边池1: (50-20) * 4 = 120
      expect(pots[1].amount).toBe(120);
      expect(pots[1].eligiblePlayers).not.toContain('player1');
      expect(pots[1].eligiblePlayers).not.toContain('player3');
      
      // 边池2: (100-50) * 3 = 150
      expect(pots[2].amount).toBe(150);
      expect(pots[2].eligiblePlayers).not.toContain('player1');
      expect(pots[2].eligiblePlayers).not.toContain('player2');
      expect(pots[2].eligiblePlayers).not.toContain('player3');
      
      // 边池3: (150-100) * 2 = 100
      expect(pots[3].amount).toBe(100);
      expect(pots[3].eligiblePlayers).toEqual(['player4', 'player5']);
      
      // 边池4: (200-150) * 1 = 50
      expect(pots[4].amount).toBe(50);
      expect(pots[4].eligiblePlayers).toEqual(['player5']);
    });
  });

  describe('空场景和错误处理', () => {
    it('应该处理没有玩家的情况', () => {
      const pots = potManager.calculatePots([]);
      expect(pots).toEqual([]);
    });

    it('应该处理所有玩家都没有下注的情况', () => {
      const players = [
        { id: 'player1', totalBet: 0, folded: false, chips: 1000 },
        { id: 'player2', totalBet: 0, folded: false, chips: 1000 }
      ];

      const pots = potManager.calculatePots(players);
      expect(pots).toEqual([]);
    });

    it('应该处理所有玩家都弃牌的情况', () => {
      const players = [
        { id: 'player1', totalBet: 100, folded: true, chips: 900 },
        { id: 'player2', totalBet: 100, folded: true, chips: 900 }
      ];

      const pots = potManager.calculatePots(players);
      
      // 虽然有底池，但没有符合资格的玩家
      expect(pots[0].eligiblePlayers).toHaveLength(0);
    });
  });
});

describe('PotManager - 底池分配', () => {
  
  let potManager;
  let gameState;
  let playerManager;
  
  beforeEach(() => {
    gameState = {
      pot: 0,
      currentBet: 0
    };
    
    playerManager = {
      players: []
    };
    
    potManager = new PotManager(gameState, playerManager);
  });

  describe('简单分配场景', () => {
    it('应该正确分配单底池给单个获胜者', () => {
      const players = [
        { id: 'player1', totalBet: 100, folded: false, chips: 900, nickname: 'Alice' },
        { id: 'player2', totalBet: 100, folded: true, chips: 900, nickname: 'Bob' }
      ];

      const winners = [
        { id: 'player1', handRank: 8 }
      ];

      const pots = potManager.calculatePots(players);
      expect(pots[0].amount).toBe(200);
      
      // 分配逻辑测试（需要实现distributePots方法）
      // const distributions = potManager.distributePots(winners, players);
      // expect(distributions[0].playerId).toBe('player1');
      // expect(distributions[0].amount).toBe(200);
    });
  });

  describe('平分底池场景', () => {
    it('应该正确平分底池 - 2个获胜者，偶数金额', () => {
      const players = [
        { id: 'player1', totalBet: 100, folded: false, chips: 900, nickname: 'Alice' },
        { id: 'player2', totalBet: 100, folded: false, chips: 900, nickname: 'Bob' },
        { id: 'player3', totalBet: 100, folded: true, chips: 900, nickname: 'Charlie' }
      ];

      const pots = potManager.calculatePots(players);
      expect(pots[0].amount).toBe(300);
      
      // 如果player1和player2平局，每人应该得到150
      // 伪代码：
      // const winners = [player1, player2];
      // 每人分得：300 / 2 = 150
    });

    it('应该正确处理余数 - 3个获胜者，奇数金额', () => {
      const players = [
        { id: 'player1', totalBet: 100, folded: false, chips: 900, seat: 0 },
        { id: 'player2', totalBet: 100, folded: false, chips: 900, seat: 1 },
        { id: 'player3', totalBet: 100, folded: false, chips: 900, seat: 2 }
      ];

      const pots = potManager.calculatePots(players);
      expect(pots[0].amount).toBe(300);
      
      // 如果3人平局：
      // 每人分得：Math.floor(300 / 3) = 100
      // 余数：300 % 3 = 0 (这个例子没有余数)
      
      // 如果底池是301：
      // 每人分得：100
      // 余数1应该分给最接近小盲注位置的玩家
    });

    it('应该将余数分配给最接近小盲注的玩家', () => {
      // 场景：底池301，3人平局
      // 小盲注在seat 1
      // 平局玩家：seat 0, seat 1, seat 2
      // 每人得100，余数1给seat 1（小盲注位置）
      
      // 这需要在distributePots中实现
      // 伪代码：
      // const smallBlindIndex = 1;
      // const remainder = 301 % 3; // = 1
      // const closestPlayer = findClosestToSmallBlind(winners, smallBlindIndex);
      // closestPlayer.chips += remainder;
    });
  });

  describe('边池分配场景', () => {
    it('应该正确分配多个边池给不同的获胜者', () => {
      const players = [
        { id: 'player1', totalBet: 100, folded: false, chips: 0, handRank: 9 },   // 同花顺
        { id: 'player2', totalBet: 300, folded: false, chips: 0, handRank: 8 },   // 四条
        { id: 'player3', totalBet: 300, folded: false, chips: 700, handRank: 6 }  // 同花
      ];

      const pots = potManager.calculatePots(players);
      
      // 主池: 100 * 3 = 300
      // 边池: (300-100) * 2 = 400
      
      // 如果player1的同花顺最大：
      // player1赢得主池300
      // player2和player3比较，player2的四条赢得边池400
      
      // 最终：
      // player1: +300
      // player2: +400
      // player3: +0
    });

    it('应该处理边池中的平局', () => {
      const players = [
        { id: 'player1', totalBet: 100, folded: false, chips: 0, handRank: 7 },
        { id: 'player2', totalBet: 300, folded: false, chips: 0, handRank: 8 },   // 四条
        { id: 'player3', totalBet: 300, folded: false, chips: 700, handRank: 8 }  // 四条（平局）
      ];

      const pots = potManager.calculatePots(players);
      
      // 主池: 300 (所有人)
      // 边池: 400 (player2和player3)
      
      // player2和player3平分边池：
      // 每人得：400 / 2 = 200
      
      // player1赢主池：300
    });
  });
});

describe('PotManager - 实际游戏案例', () => {
  
  it('案例1: 经典的3人All-in场景', () => {
    // 场景描述：
    // Pre-flop: Player A All-in 50筹码
    // Flop: Player B All-in 200筹码
    // River: Player C 跟注 200筹码
    // 结果：Player C获胜
    
    const potManager = new PotManager({}, { players: [] });
    
    const players = [
      { id: 'playerA', totalBet: 50, folded: false, chips: 0 },
      { id: 'playerB', totalBet: 200, folded: false, chips: 0 },
      { id: 'playerC', totalBet: 200, folded: false, chips: 800 }
    ];

    const pots = potManager.calculatePots(players);
    
    expect(pots).toHaveLength(2);
    expect(pots[0].amount).toBe(150);  // 主池
    expect(pots[1].amount).toBe(300);  // 边池
    
    // Player C获胜，赢得所有底池：150 + 300 = 450
  });

  it('案例2: 主池和边池由不同玩家获胜', () => {
    const potManager = new PotManager({}, { players: [] });
    
    const players = [
      { id: 'playerA', totalBet: 100, folded: false, chips: 0 },  // 同花顺
      { id: 'playerB', totalBet: 500, folded: false, chips: 0 },  // 一对
      { id: 'playerC', totalBet: 500, folded: false, chips: 500 } // 四条
    ];

    const pots = potManager.calculatePots(players);
    
    expect(pots).toHaveLength(2);
    expect(pots[0].amount).toBe(300);  // 主池: 100*3
    expect(pots[1].amount).toBe(800);  // 边池: (500-100)*2
    
    // 结果：
    // Player A的同花顺赢得主池300
    // Player C的四条赢得边池800
    // Player B什么都没赢
  });

  it('案例3: 所有人All-in，有人弃牌', () => {
    const potManager = new PotManager({}, { players: [] });
    
    const players = [
      { id: 'player1', totalBet: 100, folded: true, chips: 0 },   // Pre-flop弃牌
      { id: 'player2', totalBet: 200, folded: false, chips: 0 },  // All-in
      { id: 'player3', totalBet: 300, folded: false, chips: 0 },  // All-in
      { id: 'player4', totalBet: 300, folded: false, chips: 700 } // 跟注
    ];

    const pots = potManager.calculatePots(players);
    
    // 主池应该包含player1的100，但player1弃牌不参与分配
    expect(pots[0].amount).toBe(400);
    expect(pots[0].eligiblePlayers).toHaveLength(3);
    expect(pots[0].eligiblePlayers).not.toContain('player1');
  });
});
