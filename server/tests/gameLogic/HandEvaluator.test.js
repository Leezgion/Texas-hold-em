/**
 * 德州扑克牌型评估测试
 * 测试HandEvaluator.js的所有牌型识别功能
 */

const HandEvaluator = require('../../gameLogic/HandEvaluator');

describe('HandEvaluator Tests', () => {
  
  describe('标准牌型识别测试', () => {
    
    test('高牌 (High Card) 识别', () => {
      const hand = [
        { rank: 14, suit: 'hearts' },   // A♥
        { rank: 7, suit: 'clubs' }      // 7♣
      ];
      const communityCards = [
        { rank: 2, suit: 'diamonds' },  // 2♦
        { rank: 5, suit: 'spades' },    // 5♠
        { rank: 9, suit: 'hearts' },    // 9♥
        { rank: 11, suit: 'clubs' },    // J♣
        { rank: 3, suit: 'diamonds' }   // 3♦
      ];
      
      const result = HandEvaluator.evaluateHand(hand, communityCards);
      
      expect(result.handType).toBe('HIGH_CARD');
      expect(result.rank).toBeDefined();
      expect(result.description).toContain('高牌');
    });

    test('一对 (One Pair) 识别', () => {
      const hand = [
        { rank: 14, suit: 'hearts' },   // A♥
        { rank: 14, suit: 'clubs' }     // A♣
      ];
      const communityCards = [
        { rank: 2, suit: 'diamonds' },  // 2♦
        { rank: 5, suit: 'spades' },    // 5♠
        { rank: 9, suit: 'hearts' },    // 9♥
        { rank: 11, suit: 'clubs' },    // J♣
        { rank: 3, suit: 'diamonds' }   // 3♦
      ];
      
      const result = HandEvaluator.evaluateHand(hand, communityCards);
      
      expect(result.handType).toBe('ONE_PAIR');
      expect(result.rank).toBeGreaterThan(0);
      expect(result.description).toContain('一对');
    });

    test('两对 (Two Pair) 识别', () => {
      const hand = [
        { rank: 14, suit: 'hearts' },   // A♥
        { rank: 14, suit: 'clubs' }     // A♣
      ];
      const communityCards = [
        { rank: 11, suit: 'diamonds' }, // J♦
        { rank: 11, suit: 'spades' },   // J♠
        { rank: 9, suit: 'hearts' },    // 9♥
        { rank: 5, suit: 'clubs' },     // 5♣
        { rank: 3, suit: 'diamonds' }   // 3♦
      ];
      
      const result = HandEvaluator.evaluateHand(hand, communityCards);
      
      expect(result.handType).toBe('TWO_PAIR');
      expect(result.description).toContain('两对');
    });

    test('三条 (Three of a Kind) 识别', () => {
      const hand = [
        { rank: 14, suit: 'hearts' },   // A♥
        { rank: 14, suit: 'clubs' }     // A♣
      ];
      const communityCards = [
        { rank: 14, suit: 'diamonds' }, // A♦
        { rank: 11, suit: 'spades' },   // J♠
        { rank: 9, suit: 'hearts' },    // 9♥
        { rank: 5, suit: 'clubs' },     // 5♣
        { rank: 3, suit: 'diamonds' }   // 3♦
      ];
      
      const result = HandEvaluator.evaluateHand(hand, communityCards);
      
      expect(result.handType).toBe('THREE_OF_A_KIND');
      expect(result.description).toContain('三条');
    });

    test('顺子 (Straight) 识别 - 普通顺子', () => {
      const hand = [
        { rank: 10, suit: 'hearts' },   // 10♥
        { rank: 11, suit: 'clubs' }     // J♣
      ];
      const communityCards = [
        { rank: 12, suit: 'diamonds' }, // Q♦
        { rank: 13, suit: 'spades' },   // K♠
        { rank: 14, suit: 'hearts' },   // A♥
        { rank: 5, suit: 'clubs' },     // 5♣
        { rank: 3, suit: 'diamonds' }   // 3♦
      ];
      
      const result = HandEvaluator.evaluateHand(hand, communityCards);
      
      expect(result.handType).toBe('STRAIGHT');
      expect(result.description).toContain('顺子');
    });

    test('顺子 (Straight) 识别 - A-2-3-4-5 最小顺子', () => {
      const hand = [
        { rank: 14, suit: 'hearts' },   // A♥
        { rank: 2, suit: 'clubs' }      // 2♣
      ];
      const communityCards = [
        { rank: 3, suit: 'diamonds' },  // 3♦
        { rank: 4, suit: 'spades' },    // 4♠
        { rank: 5, suit: 'hearts' },    // 5♥
        { rank: 10, suit: 'clubs' },    // 10♣
        { rank: 9, suit: 'diamonds' }   // 9♦
      ];
      
      const result = HandEvaluator.evaluateHand(hand, communityCards);
      
      expect(result.handType).toBe('STRAIGHT');
      expect(result.description).toContain('顺子');
    });

    test('同花 (Flush) 识别', () => {
      const hand = [
        { rank: 14, suit: 'hearts' },   // A♥
        { rank: 7, suit: 'hearts' }     // 7♥
      ];
      const communityCards = [
        { rank: 2, suit: 'hearts' },    // 2♥
        { rank: 5, suit: 'hearts' },    // 5♥
        { rank: 9, suit: 'hearts' },    // 9♥
        { rank: 11, suit: 'clubs' },    // J♣
        { rank: 3, suit: 'diamonds' }   // 3♦
      ];
      
      const result = HandEvaluator.evaluateHand(hand, communityCards);
      
      expect(result.handType).toBe('FLUSH');
      expect(result.description).toContain('同花');
    });

    test('葫芦 (Full House) 识别', () => {
      const hand = [
        { rank: 14, suit: 'hearts' },   // A♥
        { rank: 14, suit: 'clubs' }     // A♣
      ];
      const communityCards = [
        { rank: 14, suit: 'diamonds' }, // A♦
        { rank: 11, suit: 'spades' },   // J♠
        { rank: 11, suit: 'hearts' },   // J♥
        { rank: 5, suit: 'clubs' },     // 5♣
        { rank: 3, suit: 'diamonds' }   // 3♦
      ];
      
      const result = HandEvaluator.evaluateHand(hand, communityCards);
      
      expect(result.handType).toBe('FULL_HOUSE');
      expect(result.description).toContain('葫芦');
    });

    test('四条 (Four of a Kind) 识别', () => {
      const hand = [
        { rank: 14, suit: 'hearts' },   // A♥
        { rank: 14, suit: 'clubs' }     // A♣
      ];
      const communityCards = [
        { rank: 14, suit: 'diamonds' }, // A♦
        { rank: 14, suit: 'spades' },   // A♠
        { rank: 11, suit: 'hearts' },   // J♥
        { rank: 5, suit: 'clubs' },     // 5♣
        { rank: 3, suit: 'diamonds' }   // 3♦
      ];
      
      const result = HandEvaluator.evaluateHand(hand, communityCards);
      
      expect(result.handType).toBe('FOUR_OF_A_KIND');
      expect(result.description).toContain('四条');
    });

    test('同花顺 (Straight Flush) 识别', () => {
      const hand = [
        { rank: 9, suit: 'hearts' },    // 9♥
        { rank: 10, suit: 'hearts' }    // 10♥
      ];
      const communityCards = [
        { rank: 11, suit: 'hearts' },   // J♥
        { rank: 12, suit: 'hearts' },   // Q♥
        { rank: 13, suit: 'hearts' },   // K♥
        { rank: 5, suit: 'clubs' },     // 5♣
        { rank: 3, suit: 'diamonds' }   // 3♦
      ];
      
      const result = HandEvaluator.evaluateHand(hand, communityCards);
      
      expect(result.handType).toBe('STRAIGHT_FLUSH');
      expect(result.description).toContain('同花顺');
    });

    test('皇家同花顺 (Royal Flush) 识别', () => {
      const hand = [
        { rank: 14, suit: 'hearts' },   // A♥
        { rank: 13, suit: 'hearts' }    // K♥
      ];
      const communityCards = [
        { rank: 12, suit: 'hearts' },   // Q♥
        { rank: 11, suit: 'hearts' },   // J♥
        { rank: 10, suit: 'hearts' },   // 10♥
        { rank: 5, suit: 'clubs' },     // 5♣
        { rank: 3, suit: 'diamonds' }   // 3♦
      ];
      
      const result = HandEvaluator.evaluateHand(hand, communityCards);
      
      expect(result.handType).toBe('ROYAL_FLUSH');
      expect(result.description).toContain('皇家同花顺');
    });
  });

  describe('牌型比较测试', () => {
    
    test('不同牌型比较 - 四条 vs 葫芦', () => {
      // 四条A
      const hand1 = [
        { rank: 14, suit: 'hearts' },
        { rank: 14, suit: 'clubs' }
      ];
      const community1 = [
        { rank: 14, suit: 'diamonds' },
        { rank: 14, suit: 'spades' },
        { rank: 2, suit: 'hearts' },
        { rank: 3, suit: 'clubs' },
        { rank: 4, suit: 'diamonds' }
      ];
      
      // 葫芦 K满J
      const hand2 = [
        { rank: 13, suit: 'hearts' },
        { rank: 13, suit: 'clubs' }
      ];
      const community2 = [
        { rank: 13, suit: 'diamonds' },
        { rank: 11, suit: 'spades' },
        { rank: 11, suit: 'hearts' },
        { rank: 3, suit: 'clubs' },
        { rank: 4, suit: 'diamonds' }
      ];
      
      const result1 = HandEvaluator.evaluateHand(hand1, community1);
      const result2 = HandEvaluator.evaluateHand(hand2, community2);
      
      expect(result1.rank).toBeGreaterThan(result2.rank);
    });

    test('相同牌型比较 - 高对vs低对', () => {
      // 一对A
      const hand1 = [
        { rank: 14, suit: 'hearts' },
        { rank: 14, suit: 'clubs' }
      ];
      const community1 = [
        { rank: 2, suit: 'diamonds' },
        { rank: 3, suit: 'spades' },
        { rank: 5, suit: 'hearts' },
        { rank: 7, suit: 'clubs' },
        { rank: 9, suit: 'diamonds' }
      ];
      
      // 一对K
      const hand2 = [
        { rank: 13, suit: 'hearts' },
        { rank: 13, suit: 'clubs' }
      ];
      const community2 = [
        { rank: 2, suit: 'diamonds' },
        { rank: 3, suit: 'spades' },
        { rank: 5, suit: 'hearts' },
        { rank: 7, suit: 'clubs' },
        { rank: 9, suit: 'diamonds' }
      ];
      
      const result1 = HandEvaluator.evaluateHand(hand1, community1);
      const result2 = HandEvaluator.evaluateHand(hand2, community2);
      
      expect(result1.rank).toBeGreaterThan(result2.rank);
    });

    test('Kicker比较测试', () => {
      // A-K高牌
      const hand1 = [
        { rank: 14, suit: 'hearts' },
        { rank: 13, suit: 'clubs' }
      ];
      const community1 = [
        { rank: 2, suit: 'diamonds' },
        { rank: 4, suit: 'spades' },
        { rank: 6, suit: 'hearts' },
        { rank: 8, suit: 'clubs' },
        { rank: 10, suit: 'diamonds' }
      ];
      
      // A-Q高牌
      const hand2 = [
        { rank: 14, suit: 'hearts' },
        { rank: 12, suit: 'clubs' }
      ];
      const community2 = [
        { rank: 2, suit: 'diamonds' },
        { rank: 4, suit: 'spades' },
        { rank: 6, suit: 'hearts' },
        { rank: 8, suit: 'clubs' },
        { rank: 10, suit: 'diamonds' }
      ];
      
      const result1 = HandEvaluator.evaluateHand(hand1, community1);
      const result2 = HandEvaluator.evaluateHand(hand2, community2);
      
      expect(result1.rank).toBeGreaterThan(result2.rank);
    });
  });

  describe('边界情况测试', () => {
    
    test('空手牌处理', () => {
      expect(() => {
        HandEvaluator.evaluateHand([], []);
      }).not.toThrow();
    });

    test('不足7张牌处理', () => {
      const hand = [{ rank: 14, suit: 'hearts' }];
      const community = [
        { rank: 2, suit: 'diamonds' },
        { rank: 3, suit: 'spades' }
      ];
      
      expect(() => {
        HandEvaluator.evaluateHand(hand, community);
      }).not.toThrow();
    });

    test('重复牌检测 (如果实现)', () => {
      const hand = [
        { rank: 14, suit: 'hearts' },
        { rank: 14, suit: 'hearts' } // 重复牌
      ];
      const community = [
        { rank: 2, suit: 'diamonds' },
        { rank: 3, suit: 'spades' },
        { rank: 5, suit: 'hearts' },
        { rank: 7, suit: 'clubs' },
        { rank: 9, suit: 'diamonds' }
      ];
      
      // 根据实际实现调整测试逻辑
      // 可能抛出错误或忽略重复牌
    });

    test('无效牌数据处理', () => {
      const hand = [
        { rank: 15, suit: 'hearts' }, // 无效rank
        { rank: 14, suit: 'invalid' } // 无效suit
      ];
      
      expect(() => {
        HandEvaluator.evaluateHand(hand, []);
      }).not.toThrow(); // 或根据实际实现调整
    });
  });

  describe('性能测试', () => {
    
    test('大量牌型评估性能', () => {
      const startTime = Date.now();
      
      // 评估1000次不同的手牌
      for (let i = 0; i < 1000; i++) {
        const hand = [
          { rank: 2 + (i % 13), suit: 'hearts' },
          { rank: 2 + ((i + 1) % 13), suit: 'clubs' }
        ];
        const community = [
          { rank: 2 + ((i + 2) % 13), suit: 'diamonds' },
          { rank: 2 + ((i + 3) % 13), suit: 'spades' },
          { rank: 2 + ((i + 4) % 13), suit: 'hearts' },
          { rank: 2 + ((i + 5) % 13), suit: 'clubs' },
          { rank: 2 + ((i + 6) % 13), suit: 'diamonds' }
        ];
        
        HandEvaluator.evaluateHand(hand, community);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // 应该在合理时间内完成 (例如1秒内)
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('实际游戏场景测试', () => {
    
    test('德州扑克经典场景 - 皇家同花顺 vs 四条A', () => {
      // 皇家同花顺
      const royalHand = [
        { rank: 14, suit: 'spades' },
        { rank: 13, suit: 'spades' }
      ];
      const royalCommunity = [
        { rank: 12, suit: 'spades' },
        { rank: 11, suit: 'spades' },
        { rank: 10, suit: 'spades' },
        { rank: 14, suit: 'hearts' },
        { rank: 14, suit: 'diamonds' }
      ];
      
      // 四条A
      const quadsHand = [
        { rank: 14, suit: 'clubs' },
        { rank: 2, suit: 'clubs' }
      ];
      const quadsCommunity = [
        { rank: 12, suit: 'spades' },
        { rank: 11, suit: 'spades' },
        { rank: 10, suit: 'spades' },
        { rank: 14, suit: 'hearts' },
        { rank: 14, suit: 'diamonds' }
      ];
      
      const royalResult = HandEvaluator.evaluateHand(royalHand, royalCommunity);
      const quadsResult = HandEvaluator.evaluateHand(quadsHand, quadsCommunity);
      
      expect(royalResult.handType).toBe('ROYAL_FLUSH');
      expect(quadsResult.handType).toBe('FOUR_OF_A_KIND');
      expect(royalResult.rank).toBeGreaterThan(quadsResult.rank);
    });

    test('复杂场景 - 公共牌上的最佳组合', () => {
      // 玩家手牌很普通，但公共牌形成强牌
      const hand = [
        { rank: 2, suit: 'clubs' },
        { rank: 7, suit: 'diamonds' }
      ];
      const community = [
        { rank: 14, suit: 'hearts' },
        { rank: 14, suit: 'spades' },
        { rank: 14, suit: 'clubs' },
        { rank: 14, suit: 'diamonds' },
        { rank: 13, suit: 'hearts' }
      ];
      
      const result = HandEvaluator.evaluateHand(hand, community);
      
      // 应该识别为四条A（使用公共牌）
      expect(result.handType).toBe('FOUR_OF_A_KIND');
    });
  });
});
