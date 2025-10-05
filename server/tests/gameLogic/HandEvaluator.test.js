/**
 * HandEvaluator 单元测试
 * 测试所有牌型识别、比较和踢脚逻辑
 */

const HandEvaluator = require('../../gameLogic/HandEvaluator');
const Card = require('../../gameLogic/Card');

describe('HandEvaluator - 牌型识别', () => {
  
  describe('皇家同花顺 (Royal Flush)', () => {
    it('应该正确识别皇家同花顺', () => {
      const holeCards = [
        new Card('hearts', 14), // A♥
        new Card('hearts', 13)  // K♥
      ];
      const communityCards = [
        new Card('hearts', 12), // Q♥
        new Card('hearts', 11), // J♥
        new Card('hearts', 10), // 10♥
        new Card('clubs', 2),
        new Card('diamonds', 3)
      ];

      const result = HandEvaluator.evaluateHand(holeCards, communityCards);
      expect(result.rank).toBe(HandEvaluator.HAND_RANKS.ROYAL_FLUSH);
      expect(result.name).toBe('皇家同花顺');
    });
  });

  describe('同花顺 (Straight Flush)', () => {
    it('应该正确识别同花顺', () => {
      const holeCards = [
        new Card('spades', 9),
        new Card('spades', 8)
      ];
      const communityCards = [
        new Card('spades', 7),
        new Card('spades', 6),
        new Card('spades', 5),
        new Card('hearts', 2),
        new Card('diamonds', 3)
      ];

      const result = HandEvaluator.evaluateHand(holeCards, communityCards);
      expect(result.rank).toBe(HandEvaluator.HAND_RANKS.STRAIGHT_FLUSH);
      expect(result.name).toBe('同花顺');
    });

    it('应该正确识别A-2-3-4-5同花顺（轮子同花顺）', () => {
      const holeCards = [
        new Card('diamonds', 14), // A♦
        new Card('diamonds', 2)   // 2♦
      ];
      const communityCards = [
        new Card('diamonds', 3),  // 3♦
        new Card('diamonds', 4),  // 4♦
        new Card('diamonds', 5),  // 5♦
        new Card('hearts', 10),
        new Card('clubs', 10)
      ];

      const result = HandEvaluator.evaluateHand(holeCards, communityCards);
      expect(result.rank).toBe(HandEvaluator.HAND_RANKS.STRAIGHT_FLUSH);
      expect(result.name).toBe('同花顺');
    });
  });

  describe('四条 (Four of a Kind)', () => {
    it('应该正确识别四条', () => {
      const holeCards = [
        new Card('hearts', 10),
        new Card('diamonds', 10)
      ];
      const communityCards = [
        new Card('clubs', 10),
        new Card('spades', 10),
        new Card('hearts', 14), // A作为踢脚
        new Card('diamonds', 2),
        new Card('clubs', 3)
      ];

      const result = HandEvaluator.evaluateHand(holeCards, communityCards);
      expect(result.rank).toBe(HandEvaluator.HAND_RANKS.FOUR_OF_A_KIND);
      expect(result.name).toBe('四条');
      expect(result.kickers).toContain(14); // 踢脚应该是A
    });
  });

  describe('葫芦 (Full House)', () => {
    it('应该正确识别葫芦', () => {
      const holeCards = [
        new Card('hearts', 8),
        new Card('diamonds', 8)
      ];
      const communityCards = [
        new Card('clubs', 8),
        new Card('spades', 3),
        new Card('hearts', 3),
        new Card('diamonds', 2),
        new Card('clubs', 7)
      ];

      const result = HandEvaluator.evaluateHand(holeCards, communityCards);
      expect(result.rank).toBe(HandEvaluator.HAND_RANKS.FULL_HOUSE);
      expect(result.name).toBe('葫芦');
      expect(result.kickers).toEqual([8, 3]); // 三条8和一对3
    });

    it('应该选择最大的葫芦组合', () => {
      const holeCards = [
        new Card('hearts', 10),
        new Card('diamonds', 10)
      ];
      const communityCards = [
        new Card('clubs', 10),
        new Card('spades', 8),
        new Card('hearts', 8),
        new Card('diamonds', 8),
        new Card('clubs', 2)
      ];

      const result = HandEvaluator.evaluateHand(holeCards, communityCards);
      expect(result.rank).toBe(HandEvaluator.HAND_RANKS.FULL_HOUSE);
      // 应该选择三条10和一对8，而不是三条8和一对10
    });
  });

  describe('同花 (Flush)', () => {
    it('应该正确识别同花', () => {
      const holeCards = [
        new Card('hearts', 14),
        new Card('hearts', 10)
      ];
      const communityCards = [
        new Card('hearts', 7),
        new Card('hearts', 5),
        new Card('hearts', 2),
        new Card('clubs', 13),
        new Card('diamonds', 12)
      ];

      const result = HandEvaluator.evaluateHand(holeCards, communityCards);
      expect(result.rank).toBe(HandEvaluator.HAND_RANKS.FLUSH);
      expect(result.name).toBe('同花');
    });
  });

  describe('顺子 (Straight)', () => {
    it('应该正确识别顺子', () => {
      const holeCards = [
        new Card('hearts', 9),
        new Card('diamonds', 8)
      ];
      const communityCards = [
        new Card('clubs', 7),
        new Card('spades', 6),
        new Card('hearts', 5),
        new Card('diamonds', 2),
        new Card('clubs', 3)
      ];

      const result = HandEvaluator.evaluateHand(holeCards, communityCards);
      expect(result.rank).toBe(HandEvaluator.HAND_RANKS.STRAIGHT);
      expect(result.name).toBe('顺子');
    });

    it('应该正确识别A-2-3-4-5顺子（轮子顺）', () => {
      const holeCards = [
        new Card('hearts', 14), // A
        new Card('diamonds', 2)
      ];
      const communityCards = [
        new Card('clubs', 3),
        new Card('spades', 4),
        new Card('hearts', 5),
        new Card('diamonds', 10),
        new Card('clubs', 11)
      ];

      const result = HandEvaluator.evaluateHand(holeCards, communityCards);
      expect(result.rank).toBe(HandEvaluator.HAND_RANKS.STRAIGHT);
      expect(result.name).toBe('顺子');
    });

    it('应该正确识别10-J-Q-K-A顺子', () => {
      const holeCards = [
        new Card('hearts', 14), // A
        new Card('diamonds', 13) // K
      ];
      const communityCards = [
        new Card('clubs', 12), // Q
        new Card('spades', 11), // J
        new Card('hearts', 10), // 10
        new Card('diamonds', 2),
        new Card('clubs', 3)
      ];

      const result = HandEvaluator.evaluateHand(holeCards, communityCards);
      expect(result.rank).toBe(HandEvaluator.HAND_RANKS.STRAIGHT);
    });
  });

  describe('三条 (Three of a Kind)', () => {
    it('应该正确识别三条', () => {
      const holeCards = [
        new Card('hearts', 7),
        new Card('diamonds', 7)
      ];
      const communityCards = [
        new Card('clubs', 7),
        new Card('spades', 14), // A踢脚
        new Card('hearts', 13), // K踢脚
        new Card('diamonds', 2),
        new Card('clubs', 3)
      ];

      const result = HandEvaluator.evaluateHand(holeCards, communityCards);
      expect(result.rank).toBe(HandEvaluator.HAND_RANKS.THREE_OF_A_KIND);
      expect(result.name).toBe('三条');
      expect(result.kickers).toContain(14);
      expect(result.kickers).toContain(13);
    });
  });

  describe('两对 (Two Pair)', () => {
    it('应该正确识别两对', () => {
      const holeCards = [
        new Card('hearts', 11),
        new Card('diamonds', 11)
      ];
      const communityCards = [
        new Card('clubs', 5),
        new Card('spades', 5),
        new Card('hearts', 14), // A踢脚
        new Card('diamonds', 2),
        new Card('clubs', 3)
      ];

      const result = HandEvaluator.evaluateHand(holeCards, communityCards);
      expect(result.rank).toBe(HandEvaluator.HAND_RANKS.TWO_PAIR);
      expect(result.name).toBe('两对');
      expect(result.kickers[0]).toBe(11); // 高对J
      expect(result.kickers[1]).toBe(5);  // 低对5
      expect(result.kickers[2]).toBe(14); // 踢脚A
    });
  });

  describe('一对 (Pair)', () => {
    it('应该正确识别一对', () => {
      const holeCards = [
        new Card('hearts', 9),
        new Card('diamonds', 9)
      ];
      const communityCards = [
        new Card('clubs', 14),
        new Card('spades', 13),
        new Card('hearts', 12),
        new Card('diamonds', 2),
        new Card('clubs', 3)
      ];

      const result = HandEvaluator.evaluateHand(holeCards, communityCards);
      expect(result.rank).toBe(HandEvaluator.HAND_RANKS.PAIR);
      expect(result.name).toBe('一对');
      expect(result.kickers[0]).toBe(9);  // 对子
      expect(result.kickers[1]).toBe(14); // 最高踢脚A
      expect(result.kickers[2]).toBe(13); // 第二踢脚K
      expect(result.kickers[3]).toBe(12); // 第三踢脚Q
    });
  });

  describe('高牌 (High Card)', () => {
    it('应该正确识别高牌', () => {
      const holeCards = [
        new Card('hearts', 14),
        new Card('diamonds', 12)
      ];
      const communityCards = [
        new Card('clubs', 9),
        new Card('spades', 7),
        new Card('hearts', 5),
        new Card('diamonds', 3),
        new Card('clubs', 2)
      ];

      const result = HandEvaluator.evaluateHand(holeCards, communityCards);
      expect(result.rank).toBe(HandEvaluator.HAND_RANKS.HIGH_CARD);
      expect(result.name).toBe('高牌');
      expect(result.kickers[0]).toBe(14); // A
      expect(result.kickers[1]).toBe(12); // Q
    });
  });
});

describe('HandEvaluator - 牌型比较', () => {
  
  describe('同类型牌型比较', () => {
    it('应该正确比较同花顺：K-high > 9-high', () => {
      const hand1HoleCards = [
        new Card('hearts', 13),
        new Card('hearts', 12)
      ];
      const hand1CommunityCards = [
        new Card('hearts', 11),
        new Card('hearts', 10),
        new Card('hearts', 9),
        new Card('clubs', 2),
        new Card('diamonds', 3)
      ];

      const hand2HoleCards = [
        new Card('spades', 9),
        new Card('spades', 8)
      ];
      const hand2CommunityCards = [
        new Card('spades', 7),
        new Card('spades', 6),
        new Card('spades', 5),
        new Card('hearts', 2),
        new Card('diamonds', 3)
      ];

      const result1 = HandEvaluator.evaluateHand(hand1HoleCards, hand1CommunityCards);
      const result2 = HandEvaluator.evaluateHand(hand2HoleCards, hand2CommunityCards);

      expect(result1.rank).toBe(HandEvaluator.HAND_RANKS.STRAIGHT_FLUSH);
      expect(result2.rank).toBe(HandEvaluator.HAND_RANKS.STRAIGHT_FLUSH);
      expect(result1.kickers[0]).toBeGreaterThan(result2.kickers[0]);
    });

    it('应该正确比较四条：A-A-A-A > K-K-K-K', () => {
      const hand1HoleCards = [
        new Card('hearts', 14),
        new Card('diamonds', 14)
      ];
      const hand1CommunityCards = [
        new Card('clubs', 14),
        new Card('spades', 14),
        new Card('hearts', 2),
        new Card('diamonds', 3),
        new Card('clubs', 4)
      ];

      const hand2HoleCards = [
        new Card('hearts', 13),
        new Card('diamonds', 13)
      ];
      const hand2CommunityCards = [
        new Card('clubs', 13),
        new Card('spades', 13),
        new Card('hearts', 2),
        new Card('diamonds', 3),
        new Card('clubs', 4)
      ];

      const result1 = HandEvaluator.evaluateHand(hand1HoleCards, hand1CommunityCards);
      const result2 = HandEvaluator.evaluateHand(hand2HoleCards, hand2CommunityCards);

      expect(result1.rank).toBe(HandEvaluator.HAND_RANKS.FOUR_OF_A_KIND);
      expect(result2.rank).toBe(HandEvaluator.HAND_RANKS.FOUR_OF_A_KIND);
      // 四条A应该胜过四条K
    });
  });

  describe('踢脚比较', () => {
    it('应该正确比较踢脚：A-K > A-Q（一对A）', () => {
      const hand1HoleCards = [
        new Card('hearts', 14), // A
        new Card('diamonds', 13) // K
      ];
      const hand1CommunityCards = [
        new Card('clubs', 14), // A
        new Card('spades', 10),
        new Card('hearts', 7),
        new Card('diamonds', 5),
        new Card('clubs', 2)
      ];

      const hand2HoleCards = [
        new Card('hearts', 14), // A
        new Card('diamonds', 12) // Q
      ];
      const hand2CommunityCards = [
        new Card('clubs', 14), // A
        new Card('spades', 10),
        new Card('hearts', 7),
        new Card('diamonds', 5),
        new Card('clubs', 2)
      ];

      const result1 = HandEvaluator.evaluateHand(hand1HoleCards, hand1CommunityCards);
      const result2 = HandEvaluator.evaluateHand(hand2HoleCards, hand2CommunityCards);

      expect(result1.rank).toBe(HandEvaluator.HAND_RANKS.PAIR);
      expect(result2.rank).toBe(HandEvaluator.HAND_RANKS.PAIR);
      
      const comparison = HandEvaluator.compareKickers(result1, result2);
      expect(comparison).toBeGreaterThan(0); // hand1应该获胜
    });

    it('应该正确比较踢脚：K-K-A-Q-J > K-K-A-Q-T', () => {
      const hand1HoleCards = [
        new Card('hearts', 13), // K
        new Card('diamonds', 11) // J
      ];
      const hand1CommunityCards = [
        new Card('clubs', 13), // K
        new Card('spades', 14), // A
        new Card('hearts', 12), // Q
        new Card('diamonds', 5),
        new Card('clubs', 2)
      ];

      const hand2HoleCards = [
        new Card('hearts', 13), // K
        new Card('diamonds', 10) // T
      ];
      const hand2CommunityCards = [
        new Card('clubs', 13), // K
        new Card('spades', 14), // A
        new Card('hearts', 12), // Q
        new Card('diamonds', 5),
        new Card('clubs', 2)
      ];

      const result1 = HandEvaluator.evaluateHand(hand1HoleCards, hand1CommunityCards);
      const result2 = HandEvaluator.evaluateHand(hand2HoleCards, hand2CommunityCards);

      expect(result1.rank).toBe(HandEvaluator.HAND_RANKS.PAIR);
      expect(result2.rank).toBe(HandEvaluator.HAND_RANKS.PAIR);
      
      const comparison = HandEvaluator.compareKickers(result1, result2);
      expect(comparison).toBeGreaterThan(0); // hand1应该获胜
    });
  });

  describe('平局场景', () => {
    it('应该正确识别完全平局：同样的公共牌顺子', () => {
      const communityCards = [
        new Card('hearts', 10),
        new Card('diamonds', 9),
        new Card('clubs', 8),
        new Card('spades', 7),
        new Card('hearts', 6)
      ];

      const hand1HoleCards = [
        new Card('clubs', 2),
        new Card('diamonds', 3)
      ];

      const hand2HoleCards = [
        new Card('hearts', 4),
        new Card('spades', 5)
      ];

      const result1 = HandEvaluator.evaluateHand(hand1HoleCards, communityCards);
      const result2 = HandEvaluator.evaluateHand(hand2HoleCards, communityCards);

      expect(result1.rank).toBe(HandEvaluator.HAND_RANKS.STRAIGHT);
      expect(result2.rank).toBe(HandEvaluator.HAND_RANKS.STRAIGHT);
      
      const comparison = HandEvaluator.compareKickers(result1, result2);
      expect(comparison).toBe(0); // 应该是平局
    });

    it('应该正确识别完全平局：同样的一对和踢脚', () => {
      const hand1HoleCards = [
        new Card('hearts', 10),
        new Card('diamonds', 9)
      ];
      const hand1CommunityCards = [
        new Card('clubs', 14),
        new Card('spades', 14),
        new Card('hearts', 13),
        new Card('diamonds', 12),
        new Card('clubs', 11)
      ];

      const hand2HoleCards = [
        new Card('spades', 8),
        new Card('hearts', 7)
      ];
      const hand2CommunityCards = hand1CommunityCards;

      const result1 = HandEvaluator.evaluateHand(hand1HoleCards, hand1CommunityCards);
      const result2 = HandEvaluator.evaluateHand(hand2HoleCards, hand2CommunityCards);

      expect(result1.rank).toBe(HandEvaluator.HAND_RANKS.PAIR);
      expect(result2.rank).toBe(HandEvaluator.HAND_RANKS.PAIR);
      
      const comparison = HandEvaluator.compareKickers(result1, result2);
      expect(comparison).toBe(0); // 应该是平局
    });
  });

  describe('不同牌型比较', () => {
    it('同花顺 > 四条', () => {
      expect(HandEvaluator.HAND_RANKS.STRAIGHT_FLUSH).toBeGreaterThan(
        HandEvaluator.HAND_RANKS.FOUR_OF_A_KIND
      );
    });

    it('四条 > 葫芦', () => {
      expect(HandEvaluator.HAND_RANKS.FOUR_OF_A_KIND).toBeGreaterThan(
        HandEvaluator.HAND_RANKS.FULL_HOUSE
      );
    });

    it('葫芦 > 同花', () => {
      expect(HandEvaluator.HAND_RANKS.FULL_HOUSE).toBeGreaterThan(
        HandEvaluator.HAND_RANKS.FLUSH
      );
    });

    it('同花 > 顺子', () => {
      expect(HandEvaluator.HAND_RANKS.FLUSH).toBeGreaterThan(
        HandEvaluator.HAND_RANKS.STRAIGHT
      );
    });

    it('顺子 > 三条', () => {
      expect(HandEvaluator.HAND_RANKS.STRAIGHT).toBeGreaterThan(
        HandEvaluator.HAND_RANKS.THREE_OF_A_KIND
      );
    });

    it('三条 > 两对', () => {
      expect(HandEvaluator.HAND_RANKS.THREE_OF_A_KIND).toBeGreaterThan(
        HandEvaluator.HAND_RANKS.TWO_PAIR
      );
    });

    it('两对 > 一对', () => {
      expect(HandEvaluator.HAND_RANKS.TWO_PAIR).toBeGreaterThan(
        HandEvaluator.HAND_RANKS.PAIR
      );
    });

    it('一对 > 高牌', () => {
      expect(HandEvaluator.HAND_RANKS.PAIR).toBeGreaterThan(
        HandEvaluator.HAND_RANKS.HIGH_CARD
      );
    });
  });
});

describe('HandEvaluator - 边缘情况', () => {
  
  it('应该从7张牌中选择最好的5张组合', () => {
    const holeCards = [
      new Card('hearts', 14),
      new Card('hearts', 13)
    ];
    const communityCards = [
      new Card('hearts', 12),
      new Card('hearts', 11),
      new Card('hearts', 10),
      new Card('hearts', 9),
      new Card('hearts', 8)
    ];

    const result = HandEvaluator.evaluateHand(holeCards, communityCards);
    expect(result.rank).toBe(HandEvaluator.HAND_RANKS.ROYAL_FLUSH);
    // 应该选择A-K-Q-J-10的皇家同花顺，而不是K-Q-J-10-9的普通同花顺
  });

  it('应该处理手牌和公共牌都参与的葫芦', () => {
    const holeCards = [
      new Card('hearts', 7),
      new Card('diamonds', 7)
    ];
    const communityCards = [
      new Card('clubs', 7),
      new Card('spades', 10),
      new Card('hearts', 10),
        new Card('diamonds', 2),
        new Card('clubs', 3)
    ];

    const result = HandEvaluator.evaluateHand(holeCards, communityCards);
    expect(result.rank).toBe(HandEvaluator.HAND_RANKS.FULL_HOUSE);
    expect(result.kickers).toEqual([7, 10]); // 三条7，一对10
  });

  it('应该处理多个可能的两对组合', () => {
    const holeCards = [
      new Card('hearts', 14), // A
      new Card('diamonds', 14) // A
    ];
    const communityCards = [
      new Card('clubs', 13),   // K
      new Card('spades', 13),  // K
      new Card('hearts', 12),  // Q
      new Card('diamonds', 12), // Q
      new Card('clubs', 2)
    ];

    const result = HandEvaluator.evaluateHand(holeCards, communityCards);
    expect(result.rank).toBe(HandEvaluator.HAND_RANKS.TWO_PAIR);
    // 应该选择A-A-K-K-Q，而不是其他组合
    expect(result.kickers[0]).toBe(14); // 高对A
    expect(result.kickers[1]).toBe(13); // 低对K
  });
});
