class Card {
  constructor(suit, rank) {
    this.suit = suit;   // 花色: 'hearts', 'diamonds', 'clubs', 'spades'
    this.rank = rank;   // 点数: 2-14 (14 = Ace)
  }

  // 获取花色符号
  getSuitSymbol() {
    const symbols = {
      'hearts': '♥',
      'diamonds': '♦',
      'clubs': '♣',
      'spades': '♠'
    };
    return symbols[this.suit] || '';
  }

  // 获取点数显示
  getRankDisplay() {
    if (this.rank === 14) return 'A';
    if (this.rank === 13) return 'K';
    if (this.rank === 12) return 'Q';
    if (this.rank === 11) return 'J';
    return this.rank.toString();
  }

  // 获取完整显示名称
  getDisplayName() {
    return `${this.getRankDisplay()}${this.getSuitSymbol()}`;
  }

  // 获取花色名称（中文）
  getSuitName() {
    const names = {
      'hearts': '红桃',
      'diamonds': '方块',
      'clubs': '梅花',
      'spades': '黑桃'
    };
    return names[this.suit] || '';
  }

  // 获取点数名称（中文）
  getRankName() {
    if (this.rank === 14) return 'A';
    if (this.rank === 13) return 'K';
    if (this.rank === 12) return 'Q';
    if (this.rank === 11) return 'J';
    return this.rank.toString();
  }

  // 获取完整中文名称
  getChineseName() {
    return `${this.getSuitName()}${this.getRankName()}`;
  }

  // 检查是否为红色牌
  isRed() {
    return this.suit === 'hearts' || this.suit === 'diamonds';
  }

  // 检查是否为黑色牌
  isBlack() {
    return this.suit === 'clubs' || this.suit === 'spades';
  }

  // 转换为JSON
  toJSON() {
    return {
      suit: this.suit,
      rank: this.rank,
      displayName: this.getDisplayName(),
      chineseName: this.getChineseName(),
      isRed: this.isRed()
    };
  }
}

module.exports = Card; 