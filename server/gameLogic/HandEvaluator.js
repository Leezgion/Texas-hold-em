class HandEvaluator {
  // 手牌类型枚举
  static HAND_RANKS = {
    HIGH_CARD: 1,        // 高牌
    PAIR: 2,             // 一对
    TWO_PAIR: 3,         // 两对
    THREE_OF_A_KIND: 4,  // 三条
    STRAIGHT: 5,         // 顺子
    FLUSH: 6,            // 同花
    FULL_HOUSE: 7,       // 葫芦
    FOUR_OF_A_KIND: 8,   // 四条
    STRAIGHT_FLUSH: 9,   // 同花顺
    ROYAL_FLUSH: 10      // 皇家同花顺
  };

  // 评估手牌
  static evaluateHand(holeCards, communityCards) {
    const allCards = [...holeCards, ...communityCards];
    const combinations = this.getCombinations(allCards, 5);
    
    let bestHand = null;
    let bestRank = 0;

    for (const combination of combinations) {
      const handRank = this.evaluateCombination(combination);
      if (handRank.rank > bestRank) {
        bestRank = handRank.rank;
        bestHand = handRank;
      } else if (handRank.rank === bestRank) {
        // 同等级别，比较踢脚
        if (this.compareKickers(handRank, bestHand) > 0) {
          bestHand = handRank;
        }
      }
    }

    return bestHand;
  }

  // 获取所有5张牌的组合
  static getCombinations(cards, size) {
    if (size === 0) return [[]];
    if (cards.length === 0) return [];

    const [first, ...rest] = cards;
    const combinations = [];

    // 包含第一张牌的组合
    const withFirst = this.getCombinations(rest, size - 1);
    for (const combo of withFirst) {
      combinations.push([first, ...combo]);
    }

    // 不包含第一张牌的组合
    const withoutFirst = this.getCombinations(rest, size);
    combinations.push(...withoutFirst);

    return combinations;
  }

  // 评估5张牌的组合
  static evaluateCombination(cards) {
    const sortedCards = [...cards].sort((a, b) => b.rank - a.rank);
    const ranks = sortedCards.map(card => card.rank);
    const suits = sortedCards.map(card => card.suit);

    // 检查是否为皇家同花顺
    if (this.isRoyalFlush(sortedCards)) {
      return {
        rank: this.HAND_RANKS.ROYAL_FLUSH,
        name: '皇家同花顺',
        cards: sortedCards,
        kickers: []
      };
    }

    // 检查是否为同花顺
    if (this.isStraightFlush(sortedCards)) {
      return {
        rank: this.HAND_RANKS.STRAIGHT_FLUSH,
        name: '同花顺',
        cards: sortedCards,
        kickers: []
      };
    }

    // 检查是否为四条
    if (this.isFourOfAKind(ranks)) {
      const fourRank = this.getFourOfAKindRank(ranks);
      const kicker = ranks.find(rank => rank !== fourRank);
      return {
        rank: this.HAND_RANKS.FOUR_OF_A_KIND,
        name: '四条',
        cards: sortedCards,
        kickers: [kicker]
      };
    }

    // 检查是否为葫芦
    if (this.isFullHouse(ranks)) {
      const threeRank = this.getThreeOfAKindRank(ranks);
      const pairRank = this.getPairRank(ranks, threeRank);
      return {
        rank: this.HAND_RANKS.FULL_HOUSE,
        name: '葫芦',
        cards: sortedCards,
        kickers: [threeRank, pairRank]
      };
    }

    // 检查是否为同花
    if (this.isFlush(suits)) {
      return {
        rank: this.HAND_RANKS.FLUSH,
        name: '同花',
        cards: sortedCards,
        kickers: ranks
      };
    }

    // 检查是否为顺子
    if (this.isStraight(ranks)) {
      return {
        rank: this.HAND_RANKS.STRAIGHT,
        name: '顺子',
        cards: sortedCards,
        kickers: ranks
      };
    }

    // 检查是否为三条
    if (this.isThreeOfAKind(ranks)) {
      const threeRank = this.getThreeOfAKindRank(ranks);
      const kickers = ranks.filter(rank => rank !== threeRank).sort((a, b) => b - a);
      return {
        rank: this.HAND_RANKS.THREE_OF_A_KIND,
        name: '三条',
        cards: sortedCards,
        kickers: kickers
      };
    }

    // 检查是否为两对
    if (this.isTwoPair(ranks)) {
      const pairs = this.getTwoPairRanks(ranks);
      const kicker = ranks.find(rank => !pairs.includes(rank));
      return {
        rank: this.HAND_RANKS.TWO_PAIR,
        name: '两对',
        cards: sortedCards,
        kickers: [...pairs, kicker]
      };
    }

    // 检查是否为一对
    if (this.isPair(ranks)) {
      const pairRank = this.getPairRank(ranks);
      const kickers = ranks.filter(rank => rank !== pairRank).sort((a, b) => b - a);
      return {
        rank: this.HAND_RANKS.PAIR,
        name: '一对',
        cards: sortedCards,
        kickers: [pairRank, ...kickers]
      };
    }

    // 高牌
    return {
      rank: this.HAND_RANKS.HIGH_CARD,
      name: '高牌',
      cards: sortedCards,
      kickers: ranks
    };
  }

  // 检查是否为皇家同花顺
  static isRoyalFlush(cards) {
    return this.isStraightFlush(cards) && cards[0].rank === 14;
  }

  // 检查是否为同花顺
  static isStraightFlush(cards) {
    return this.isFlush(cards.map(c => c.suit)) && this.isStraight(cards.map(c => c.rank));
  }

  // 检查是否为四条
  static isFourOfAKind(ranks) {
    const rankCounts = this.getRankCounts(ranks);
    return Object.values(rankCounts).some(count => count === 4);
  }

  // 检查是否为葫芦
  static isFullHouse(ranks) {
    const rankCounts = this.getRankCounts(ranks);
    const counts = Object.values(rankCounts);
    return counts.includes(3) && counts.includes(2);
  }

  // 检查是否为同花
  static isFlush(suits) {
    return suits.every(suit => suit === suits[0]);
  }

  // 检查是否为顺子
  static isStraight(ranks) {
    const uniqueRanks = [...new Set(ranks)].sort((a, b) => a - b);
    
    // 特殊情况：A-2-3-4-5
    if (uniqueRanks.length === 5 && 
        uniqueRanks[0] === 2 && 
        uniqueRanks[4] === 14) {
      return true;
    }

    // 普通顺子
    for (let i = 0; i < uniqueRanks.length - 1; i++) {
      if (uniqueRanks[i + 1] - uniqueRanks[i] !== 1) {
        return false;
      }
    }
    return uniqueRanks.length === 5;
  }

  // 检查是否为三条
  static isThreeOfAKind(ranks) {
    const rankCounts = this.getRankCounts(ranks);
    return Object.values(rankCounts).some(count => count === 3);
  }

  // 检查是否为两对
  static isTwoPair(ranks) {
    const rankCounts = this.getRankCounts(ranks);
    const pairCount = Object.values(rankCounts).filter(count => count === 2).length;
    return pairCount === 2;
  }

  // 检查是否为一对
  static isPair(ranks) {
    const rankCounts = this.getRankCounts(ranks);
    return Object.values(rankCounts).some(count => count === 2);
  }

  // 获取点数计数
  static getRankCounts(ranks) {
    const counts = {};
    for (const rank of ranks) {
      counts[rank] = (counts[rank] || 0) + 1;
    }
    return counts;
  }

  // 获取四条的点数
  static getFourOfAKindRank(ranks) {
    const rankCounts = this.getRankCounts(ranks);
    for (const [rank, count] of Object.entries(rankCounts)) {
      if (count === 4) return parseInt(rank);
    }
    return null;
  }

  // 获取三条的点数
  static getThreeOfAKindRank(ranks) {
    const rankCounts = this.getRankCounts(ranks);
    for (const [rank, count] of Object.entries(rankCounts)) {
      if (count === 3) return parseInt(rank);
    }
    return null;
  }

  // 获取一对的点数
  static getPairRank(ranks, excludeRank = null) {
    const rankCounts = this.getRankCounts(ranks);
    for (const [rank, count] of Object.entries(rankCounts)) {
      if (count === 2 && parseInt(rank) !== excludeRank) {
        return parseInt(rank);
      }
    }
    return null;
  }

  // 获取两对的点数
  static getTwoPairRanks(ranks) {
    const rankCounts = this.getRankCounts(ranks);
    const pairs = [];
    for (const [rank, count] of Object.entries(rankCounts)) {
      if (count === 2) {
        pairs.push(parseInt(rank));
      }
    }
    return pairs.sort((a, b) => b - a);
  }

  // 比较踢脚
  static compareKickers(hand1, hand2) {
    const kickers1 = hand1.kickers;
    const kickers2 = hand2.kickers;
    
    for (let i = 0; i < Math.min(kickers1.length, kickers2.length); i++) {
      if (kickers1[i] !== kickers2[i]) {
        return kickers1[i] - kickers2[i];
      }
    }
    return 0;
  }

  // 获取手牌名称（中文）
  static getHandName(rank) {
    const names = {
      [this.HAND_RANKS.HIGH_CARD]: '高牌',
      [this.HAND_RANKS.PAIR]: '一对',
      [this.HAND_RANKS.TWO_PAIR]: '两对',
      [this.HAND_RANKS.THREE_OF_A_KIND]: '三条',
      [this.HAND_RANKS.STRAIGHT]: '顺子',
      [this.HAND_RANKS.FLUSH]: '同花',
      [this.HAND_RANKS.FULL_HOUSE]: '葫芦',
      [this.HAND_RANKS.FOUR_OF_A_KIND]: '四条',
      [this.HAND_RANKS.STRAIGHT_FLUSH]: '同花顺',
      [this.HAND_RANKS.ROYAL_FLUSH]: '皇家同花顺'
    };
    return names[rank] || '未知';
  }
}

module.exports = HandEvaluator; 