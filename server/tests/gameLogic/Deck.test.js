/**
 * Deck 单元测试
 * 测试牌组初始化、洗牌和发牌逻辑
 */

const Deck = require('../../gameLogic/Deck');
const Card = require('../../gameLogic/Card');

describe('Deck - 牌组初始化', () => {
  
  it('应该创建52张完整的牌', () => {
    const deck = new Deck();
    expect(deck.cards.length).toBe(52);
  });

  it('应该包含所有4种花色', () => {
    const deck = new Deck();
    const suits = new Set(deck.cards.map(card => card.suit));
    
    expect(suits.size).toBe(4);
    expect(suits.has('hearts')).toBe(true);
    expect(suits.has('diamonds')).toBe(true);
    expect(suits.has('clubs')).toBe(true);
    expect(suits.has('spades')).toBe(true);
  });

  it('应该包含所有13个点数（2-14，其中14是A）', () => {
    const deck = new Deck();
    const ranks = new Set(deck.cards.map(card => card.rank));
    
    expect(ranks.size).toBe(13);
    for (let rank = 2; rank <= 14; rank++) {
      expect(ranks.has(rank)).toBe(true);
    }
  });

  it('应该不包含重复的牌', () => {
    const deck = new Deck();
    const cardSignatures = deck.cards.map(card => `${card.suit}-${card.rank}`);
    const uniqueSignatures = new Set(cardSignatures);
    
    expect(cardSignatures.length).toBe(uniqueSignatures.size);
  });

  it('每种花色应该恰好有13张牌', () => {
    const deck = new Deck();
    const suitCounts = {
      hearts: 0,
      diamonds: 0,
      clubs: 0,
      spades: 0
    };

    deck.cards.forEach(card => {
      suitCounts[card.suit]++;
    });

    expect(suitCounts.hearts).toBe(13);
    expect(suitCounts.diamonds).toBe(13);
    expect(suitCounts.clubs).toBe(13);
    expect(suitCounts.spades).toBe(13);
  });

  it('每个点数应该恰好有4张牌', () => {
    const deck = new Deck();
    const rankCounts = {};

    deck.cards.forEach(card => {
      rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
    });

    for (let rank = 2; rank <= 14; rank++) {
      expect(rankCounts[rank]).toBe(4);
    }
  });
});

describe('Deck - 洗牌功能', () => {
  
  it('洗牌后应该仍有52张牌', () => {
    const deck = new Deck();
    deck.shuffle();
    expect(deck.cards.length).toBe(52);
  });

  it('洗牌后应该改变牌的顺序', () => {
    const deck1 = new Deck();
    const deck2 = new Deck();
    
    // 记录原始顺序
    const originalOrder = deck1.cards.map(card => `${card.suit}-${card.rank}`);
    
    // 洗牌多次，至少有一次会改变顺序
    let orderChanged = false;
    for (let i = 0; i < 10; i++) {
      deck2.shuffle();
      const newOrder = deck2.cards.map(card => `${card.suit}-${card.rank}`);
      
      let samePosition = 0;
      for (let j = 0; j < 52; j++) {
        if (originalOrder[j] === newOrder[j]) {
          samePosition++;
        }
      }
      
      // 如果少于52张牌在原位，说明顺序改变了
      if (samePosition < 52) {
        orderChanged = true;
        break;
      }
    }
    
    expect(orderChanged).toBe(true);
  });

  it('洗牌后应该保持所有牌的完整性', () => {
    const deck = new Deck();
    deck.shuffle();
    
    // 检查是否仍有所有花色和点数
    const suits = new Set(deck.cards.map(card => card.suit));
    const ranks = new Set(deck.cards.map(card => card.rank));
    
    expect(suits.size).toBe(4);
    expect(ranks.size).toBe(13);
  });

  it('多次洗牌应该产生不同的顺序', () => {
    const deck = new Deck();
    
    deck.shuffle();
    const order1 = deck.cards.map(card => `${card.suit}-${card.rank}`);
    
    deck.shuffle();
    const order2 = deck.cards.map(card => `${card.suit}-${card.rank}`);
    
    deck.shuffle();
    const order3 = deck.cards.map(card => `${card.suit}-${card.rank}`);
    
    // 至少应该有一个顺序不同
    const allSame = 
      JSON.stringify(order1) === JSON.stringify(order2) &&
      JSON.stringify(order2) === JSON.stringify(order3);
    
    expect(allSame).toBe(false);
  });
});

describe('Deck - 发牌功能', () => {
  
  it('应该正确发出一张牌', () => {
    const deck = new Deck();
    const initialCount = deck.cards.length;
    
    const card = deck.drawCard();
    
    expect(card).toBeInstanceOf(Card);
    expect(deck.cards.length).toBe(initialCount - 1);
  });

  it('应该从牌堆顶部发牌', () => {
    const deck = new Deck();
    const topCard = deck.cards[deck.cards.length - 1];
    
    const drawnCard = deck.drawCard();
    
    expect(drawnCard.suit).toBe(topCard.suit);
    expect(drawnCard.rank).toBe(topCard.rank);
  });

  it('应该正确发出多张牌', () => {
    const deck = new Deck();
    const initialCount = deck.cards.length;
    
    const cards = deck.drawCards(5);
    
    expect(cards.length).toBe(5);
    expect(deck.cards.length).toBe(initialCount - 5);
    
    cards.forEach(card => {
      expect(card).toBeInstanceOf(Card);
    });
  });

  it('连续发牌不应该有重复', () => {
    const deck = new Deck();
    const drawnCards = [];
    
    for (let i = 0; i < 10; i++) {
      drawnCards.push(deck.drawCard());
    }
    
    const signatures = drawnCards.map(card => `${card.suit}-${card.rank}`);
    const uniqueSignatures = new Set(signatures);
    
    expect(signatures.length).toBe(uniqueSignatures.size);
  });

  it('应该能发完所有52张牌', () => {
    const deck = new Deck();
    const allCards = [];
    
    while (!deck.isEmpty()) {
      allCards.push(deck.drawCard());
    }
    
    expect(allCards.length).toBe(52);
    expect(deck.cards.length).toBe(0);
  });

  it('牌堆空时应该抛出错误', () => {
    const deck = new Deck();
    
    // 发完所有牌
    while (!deck.isEmpty()) {
      deck.drawCard();
    }
    
    // 尝试再发一张应该抛出错误
    expect(() => {
      deck.drawCard();
    }).toThrow('牌堆已空');
  });

  it('drawCards超过剩余牌数时应该只发剩余的牌', () => {
    const deck = new Deck();
    
    // 先发掉50张
    deck.drawCards(50);
    
    // 尝试发5张，但只剩2张
    const cards = deck.drawCards(5);
    
    expect(cards.length).toBe(2);
    expect(deck.isEmpty()).toBe(true);
  });
});

describe('Deck - 状态管理', () => {
  
  it('应该正确报告剩余牌数', () => {
    const deck = new Deck();
    
    expect(deck.getRemainingCards()).toBe(52);
    
    deck.drawCard();
    expect(deck.getRemainingCards()).toBe(51);
    
    deck.drawCards(10);
    expect(deck.getRemainingCards()).toBe(41);
  });

  it('应该正确报告牌堆是否为空', () => {
    const deck = new Deck();
    
    expect(deck.isEmpty()).toBe(false);
    
    deck.drawCards(52);
    expect(deck.isEmpty()).toBe(true);
  });

  it('应该正确返回牌堆状态', () => {
    const deck = new Deck();
    
    const state = deck.getDeckState();
    
    expect(state.remainingCards).toBe(52);
    expect(state.totalCards).toBe(52);
    expect(state.isEmpty).toBe(false);
    
    deck.drawCards(30);
    
    const newState = deck.getDeckState();
    expect(newState.remainingCards).toBe(22);
    expect(newState.totalCards).toBe(52);
    expect(newState.isEmpty).toBe(false);
  });

  it('reset应该重新创建完整的牌堆', () => {
    const deck = new Deck();
    
    // 发掉一些牌
    deck.drawCards(20);
    expect(deck.getRemainingCards()).toBe(32);
    
    // 重置
    deck.reset();
    expect(deck.getRemainingCards()).toBe(52);
    expect(deck.isEmpty()).toBe(false);
  });

  it('reset后应该重新洗牌', () => {
    const deck = new Deck();
    
    const order1 = deck.cards.map(card => `${card.suit}-${card.rank}`);
    
    deck.reset();
    
    const order2 = deck.cards.map(card => `${card.suit}-${card.rank}`);
    
    // 重置后应该有不同的顺序（大概率）
    // 注意：理论上可能相同，但概率极低
    const allSame = JSON.stringify(order1) === JSON.stringify(order2);
    
    // 如果相同，再试一次
    if (allSame) {
      deck.reset();
      const order3 = deck.cards.map(card => `${card.suit}-${card.rank}`);
      const stillSame = JSON.stringify(order1) === JSON.stringify(order3);
      expect(stillSame).toBe(false);
    }
  });
});

describe('Deck - 实际游戏场景', () => {
  
  it('应该能模拟德州扑克发牌流程', () => {
    const deck = new Deck();
    
    // 4个玩家，每人2张手牌
    const player1Hand = deck.drawCards(2);
    const player2Hand = deck.drawCards(2);
    const player3Hand = deck.drawCards(2);
    const player4Hand = deck.drawCards(2);
    
    expect(player1Hand.length).toBe(2);
    expect(player2Hand.length).toBe(2);
    expect(player3Hand.length).toBe(2);
    expect(player4Hand.length).toBe(2);
    
    expect(deck.getRemainingCards()).toBe(44);
    
    // 烧一张牌（Burn card）
    deck.drawCard();
    
    // 发翻牌（Flop）- 3张
    const flop = deck.drawCards(3);
    expect(flop.length).toBe(3);
    expect(deck.getRemainingCards()).toBe(40);
    
    // 烧一张牌
    deck.drawCard();
    
    // 发转牌（Turn）- 1张
    const turn = deck.drawCard();
    expect(turn).toBeInstanceOf(Card);
    expect(deck.getRemainingCards()).toBe(38);
    
    // 烧一张牌
    deck.drawCard();
    
    // 发河牌（River）- 1张
    const river = deck.drawCard();
    expect(river).toBeInstanceOf(Card);
    expect(deck.getRemainingCards()).toBe(36);
    
    // 验证所有发出的牌都不重复
    const allDrawnCards = [
      ...player1Hand,
      ...player2Hand,
      ...player3Hand,
      ...player4Hand,
      ...flop,
      turn,
      river
    ];
    
    const signatures = allDrawnCards.map(card => `${card.suit}-${card.rank}`);
    const uniqueSignatures = new Set(signatures);
    
    expect(signatures.length).toBe(uniqueSignatures.size);
  });

  it('应该能模拟10人桌的发牌', () => {
    const deck = new Deck();
    const players = 10;
    const hands = [];
    
    // 给10个玩家发牌
    for (let i = 0; i < players; i++) {
      hands.push(deck.drawCards(2));
    }
    
    // 应该发出20张牌
    expect(deck.getRemainingCards()).toBe(32);
    
    // 所有手牌应该不重复
    const allCards = hands.flat();
    const signatures = allCards.map(card => `${card.suit}-${card.rank}`);
    const uniqueSignatures = new Set(signatures);
    
    expect(signatures.length).toBe(20);
    expect(uniqueSignatures.size).toBe(20);
  });

  it('应该能处理多局游戏', () => {
    const deck = new Deck();
    
    // 第一局
    deck.drawCards(14); // 5个玩家手牌 + 5张公共牌 - 烧牌
    expect(deck.getRemainingCards()).toBe(38);
    
    // 重置开始第二局
    deck.reset();
    expect(deck.getRemainingCards()).toBe(52);
    
    // 第二局
    deck.drawCards(14);
    expect(deck.getRemainingCards()).toBe(38);
  });
});
