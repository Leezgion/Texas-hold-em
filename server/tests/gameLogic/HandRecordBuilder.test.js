const GameLogic = require('../../gameLogic/GameLogic');
const HandRecordBuilder = require('../../gameLogic/HandRecordBuilder');

describe('HandRecordBuilder', () => {
  it('groups actions by street and captures chip deltas', () => {
    const record = HandRecordBuilder.buildHandRecord({
      handNumber: 7,
      startedAt: 1000,
      endedAt: 2000,
      players: [
        { id: 'p1', nickname: 'P1', chips: 1120, ledger: { handStartChips: 1000 } },
        { id: 'p2', nickname: 'P2', chips: 880, ledger: { handStartChips: 1000 } },
      ],
      actions: [
        { playerId: 'p1', action: 'raise', amount: 60, street: 'preflop' },
        { playerId: 'p2', action: 'call', amount: 60, street: 'preflop' },
        { playerId: 'p1', action: 'check', amount: 0, street: 'flop' },
      ],
      communityCards: [{ rank: 14, suit: 'spades' }],
      pots: [{ id: 0, amount: 120, eligiblePlayers: ['p1', 'p2'] }],
      winners: [{ playerId: 'p1', nickname: 'P1', winnings: 120 }],
      reason: null,
    });

    expect(record.handNumber).toBe(7);
    expect(record.actionsByStreet.preflop).toHaveLength(2);
    expect(record.actionsByStreet.flop).toHaveLength(1);
    expect(record.chipDeltas).toEqual({
      p1: 120,
      p2: -120,
    });
    expect(Object.isFrozen(record)).toBe(true);
  });

  it('stores a hand record when GameLogic emits a hand result', () => {
    const emit = jest.fn();
    const io = {
      to: jest.fn(() => ({ emit })),
    };
    const room = {
      id: 'ROOM1',
      settings: {
        initialChips: 1000,
        allinDealCount: 1,
      },
      players: [
        {
          id: 'p1',
          nickname: 'P1',
          chips: 1120,
          showHand: true,
          hand: [],
          ledger: { handStartChips: 1000, rebuyTotal: 0, initialBuyIn: 1000 },
        },
        {
          id: 'p2',
          nickname: 'P2',
          chips: 880,
          showHand: false,
          hand: [],
          ledger: { handStartChips: 1000, rebuyTotal: 0, initialBuyIn: 1000 },
        },
      ],
    };

    const gameLogic = new GameLogic(room, io, { broadcastRoomState: jest.fn() });
    gameLogic.handNumber = 7;
    gameLogic.handStartedAt = 1000;
    gameLogic.actionHistory = [
      { playerId: 'p1', nickname: 'P1', action: 'raise', amount: 60, street: 'preflop', totalBet: 60, timestamp: 1200 },
      { playerId: 'p2', nickname: 'P2', action: 'call', amount: 60, street: 'preflop', totalBet: 60, timestamp: 1300 },
    ];

    gameLogic.emitHandResult({
      boardResult: {
        hands: [],
        communityCards: [{ rank: 14, suit: 'spades' }],
      },
      winnings: new Map([
        ['p1', 120],
        ['p2', 0],
      ]),
      pots: [{ id: 0, amount: 120, eligiblePlayers: ['p1', 'p2'] }],
      totalPot: 120,
      reason: 'test',
    });

    expect(gameLogic.handHistory).toHaveLength(1);
    expect(gameLogic.handHistory[0].handNumber).toBe(7);
    expect(gameLogic.handHistory[0].actionsByStreet.preflop).toHaveLength(2);
    expect(gameLogic.handHistory[0].winners[0].nickname).toBe('P1');
  });
});
