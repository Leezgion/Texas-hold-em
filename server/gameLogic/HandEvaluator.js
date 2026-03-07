class HandEvaluator {
  static HAND_RANKS = {
    HIGH_CARD: 1,
    PAIR: 2,
    TWO_PAIR: 3,
    THREE_OF_A_KIND: 4,
    STRAIGHT: 5,
    FLUSH: 6,
    FULL_HOUSE: 7,
    FOUR_OF_A_KIND: 8,
    STRAIGHT_FLUSH: 9,
    ROYAL_FLUSH: 10,
  };

  static evaluateHand(holeCards, communityCards) {
    const allCards = [...holeCards, ...communityCards];
    const combinations = this.getCombinations(allCards, 5);

    let bestHand = null;
    for (const combination of combinations) {
      const evaluated = this.evaluateCombination(combination);
      if (!bestHand || this.compareHands(evaluated, bestHand) > 0) {
        bestHand = evaluated;
      }
    }

    return bestHand;
  }

  static getCombinations(cards, size) {
    if (size === 0) return [[]];
    if (cards.length < size) return [];
    if (cards.length === size) return [cards];

    const [first, ...rest] = cards;
    const withFirst = this.getCombinations(rest, size - 1).map((combo) => [first, ...combo]);
    const withoutFirst = this.getCombinations(rest, size);
    return [...withFirst, ...withoutFirst];
  }

  static evaluateCombination(cards) {
    const sortedCards = [...cards].sort((a, b) => b.rank - a.rank);
    const ranks = sortedCards.map((card) => card.rank);
    const rankCounts = this.getRankCounts(ranks);
    const countEntries = Object.entries(rankCounts)
      .map(([rank, count]) => ({ rank: Number(rank), count }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return b.rank - a.rank;
      });

    const isFlush = sortedCards.every((card) => card.suit === sortedCards[0].suit);
    const straightHigh = this.getStraightHighCard(ranks);

    if (isFlush && straightHigh) {
      const isRoyal = straightHigh === 14 && [10, 11, 12, 13, 14].every((rank) => ranks.includes(rank));
      return this.createHandResult(
        isRoyal ? this.HAND_RANKS.ROYAL_FLUSH : this.HAND_RANKS.STRAIGHT_FLUSH,
        isRoyal ? '皇家同花顺' : '同花顺',
        sortedCards,
        [straightHigh]
      );
    }

    if (countEntries[0].count === 4) {
      const quadRank = countEntries[0].rank;
      const kicker = countEntries[1].rank;
      return this.createHandResult(this.HAND_RANKS.FOUR_OF_A_KIND, '四条', sortedCards, [quadRank, kicker]);
    }

    if (countEntries[0].count === 3 && countEntries[1].count === 2) {
      return this.createHandResult(
        this.HAND_RANKS.FULL_HOUSE,
        '葫芦',
        sortedCards,
        [countEntries[0].rank, countEntries[1].rank]
      );
    }

    if (isFlush) {
      return this.createHandResult(this.HAND_RANKS.FLUSH, '同花', sortedCards, [...ranks].sort((a, b) => b - a));
    }

    if (straightHigh) {
      return this.createHandResult(this.HAND_RANKS.STRAIGHT, '顺子', sortedCards, [straightHigh]);
    }

    if (countEntries[0].count === 3) {
      const tripRank = countEntries[0].rank;
      const kickers = countEntries
        .slice(1)
        .map((entry) => entry.rank)
        .sort((a, b) => b - a);
      return this.createHandResult(this.HAND_RANKS.THREE_OF_A_KIND, '三条', sortedCards, [tripRank, ...kickers]);
    }

    if (countEntries[0].count === 2 && countEntries[1].count === 2) {
      const pairRanks = [countEntries[0].rank, countEntries[1].rank].sort((a, b) => b - a);
      const kicker = countEntries[2].rank;
      return this.createHandResult(this.HAND_RANKS.TWO_PAIR, '两对', sortedCards, [...pairRanks, kicker]);
    }

    if (countEntries[0].count === 2) {
      const pairRank = countEntries[0].rank;
      const kickers = countEntries
        .slice(1)
        .map((entry) => entry.rank)
        .sort((a, b) => b - a);
      return this.createHandResult(this.HAND_RANKS.PAIR, '一对', sortedCards, [pairRank, ...kickers]);
    }

    return this.createHandResult(
      this.HAND_RANKS.HIGH_CARD,
      '高牌',
      sortedCards,
      [...ranks].sort((a, b) => b - a)
    );
  }

  static createHandResult(rank, name, cards, kickers) {
    return {
      rank,
      name,
      cards,
      kickers,
      value: kickers.reduce((acc, kicker) => acc * 15 + kicker, 0),
    };
  }

  static getRankCounts(ranks) {
    return ranks.reduce((counts, rank) => {
      counts[rank] = (counts[rank] || 0) + 1;
      return counts;
    }, {});
  }

  static getStraightHighCard(ranks) {
    const uniqueRanks = [...new Set(ranks)].sort((a, b) => a - b);
    if (uniqueRanks.length !== 5) {
      return null;
    }

    const isWheel = uniqueRanks.join(',') === '2,3,4,5,14';
    if (isWheel) {
      return 5;
    }

    for (let i = 0; i < uniqueRanks.length - 1; i++) {
      if (uniqueRanks[i + 1] - uniqueRanks[i] !== 1) {
        return null;
      }
    }

    return uniqueRanks[uniqueRanks.length - 1];
  }

  static compareHands(hand1, hand2) {
    if (!hand2) return 1;
    if (!hand1) return -1;
    if (hand1.rank !== hand2.rank) {
      return hand1.rank - hand2.rank;
    }
    return this.compareKickers(hand1, hand2);
  }

  static compareKickers(hand1, hand2) {
    if (!hand2) return 1;
    if (!hand1) return -1;

    const kickers1 = hand1.kickers || [];
    const kickers2 = hand2.kickers || [];
    const maxLength = Math.max(kickers1.length, kickers2.length);

    for (let i = 0; i < maxLength; i++) {
      const kicker1 = kickers1[i] || 0;
      const kicker2 = kickers2[i] || 0;
      if (kicker1 !== kicker2) {
        return kicker1 - kicker2;
      }
    }

    return 0;
  }

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
      [this.HAND_RANKS.ROYAL_FLUSH]: '皇家同花顺',
    };
    return names[rank] || '未知';
  }
}

module.exports = HandEvaluator;
