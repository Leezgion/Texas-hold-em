const GameLogic = require('../../gameLogic/GameLogic');

function createPlayer({
  id,
  totalBet,
  currentBet = totalBet,
  chips = 1000 - totalBet,
  allIn = false,
  folded = false,
} = {}) {
  return {
    id,
    nickname: id,
    seat: 0,
    chips,
    currentBet,
    totalBet,
    allIn,
    folded,
    isActive: true,
    inHand: true,
  };
}

describe('GameLogic pot state projection', () => {
  it('does not create side pots for normal unmatched bets when nobody is all-in', () => {
    const room = {
      settings: { maxPlayers: 2 },
      players: [
        createPlayer({ id: 'p1', totalBet: 10, currentBet: 10, chips: 990 }),
        createPlayer({ id: 'p2', totalBet: 20, currentBet: 20, chips: 980 }),
      ],
    };

    const gameLogic = new GameLogic(room, {}, {});

    gameLogic.refreshPotState();

    expect(gameLogic.pot).toBe(30);
    expect(gameLogic.sidePots).toEqual([]);
  });

  it('keeps side pots when an all-in player caps a contested contribution', () => {
    const room = {
      settings: { maxPlayers: 3 },
      players: [
        createPlayer({ id: 'p1', totalBet: 100, currentBet: 100, chips: 0, allIn: true }),
        createPlayer({ id: 'p2', totalBet: 200, currentBet: 200, chips: 800 }),
        createPlayer({ id: 'p3', totalBet: 200, currentBet: 200, chips: 800 }),
      ],
    };

    const gameLogic = new GameLogic(room, {}, {});

    gameLogic.refreshPotState();

    expect(gameLogic.pot).toBe(500);
    expect(gameLogic.sidePots).toEqual([
      {
        id: 1,
        amount: 200,
        eligiblePlayers: ['p2', 'p3'],
      },
    ]);
  });
});
