const Card = require('./Card');

class Deck {
  constructor() {
    this.cards = [];
    this.initializeDeck();
    this.shuffle();
  }

  // 初始化牌堆
  initializeDeck() {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]; // 2到A

    for (const suit of suits) {
      for (const rank of ranks) {
        this.cards.push(new Card(suit, rank));
      }
    }
  }

  // 洗牌算法 (Fisher-Yates)
  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  // 抽一张牌
  drawCard() {
    if (this.cards.length === 0) {
      throw new Error('牌堆已空');
    }
    return this.cards.pop();
  }

  // 抽多张牌
  drawCards(count) {
    const drawnCards = [];
    for (let i = 0; i < count; i++) {
      if (this.cards.length === 0) break;
      drawnCards.push(this.drawCard());
    }
    return drawnCards;
  }

  // 获取剩余牌数
  getRemainingCards() {
    return this.cards.length;
  }

  // 重置牌堆
  reset() {
    this.initializeDeck();
    this.shuffle();
  }

  // 检查牌堆是否为空
  isEmpty() {
    return this.cards.length === 0;
  }

  // 获取牌堆状态
  getDeckState() {
    return {
      remainingCards: this.cards.length,
      totalCards: 52,
      isEmpty: this.isEmpty()
    };
  }
}

module.exports = Deck; 