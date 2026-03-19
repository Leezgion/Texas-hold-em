import test from 'node:test';
import assert from 'node:assert/strict';

import { buildHandHistoryView, buildHandSummary, buildTablePotSummary, deriveEventRailView } from './handHistoryViewModel.js';

test('summarizes main pot, side pots, and reveal choices', () => {
  const summary = buildHandSummary({
    handNumber: 9,
    totalPot: 5000,
    chipDeltas: {
      p1: 3000,
      p2: -2000,
    },
    players: [
      { id: 'p1', nickname: 'Alice' },
      { id: 'p2', nickname: 'Bob' },
    ],
    potResults: [
      {
        potId: 0,
        potType: 'main',
        amount: 3000,
        winners: [{ playerId: 'p1', nickname: 'Alice', amount: 3000 }],
      },
      {
        potId: 1,
        potType: 'side',
        amount: 2000,
        winners: [{ playerId: 'p2', nickname: 'Bob', amount: 2000 }],
      },
    ],
    reveals: [
      { playerId: 'p3', nickname: 'Carol', reveal: 'show_one', cards: ['A♠'] },
    ],
    communityCards: ['A♠', 'K♥', '7♦', '2♣', '2♠'],
  });

  assert.equal(summary.title, '第 9 手');
  assert.equal(summary.boardLabel, 'A♠ K♥ 7♦ 2♣ 2♠');
  assert.match(summary.lines[0], /总池/);
  assert.match(summary.lines[1], /主池/);
  assert.match(summary.lines[1], /Alice/);
  assert.match(summary.lines[2], /边池/);
  assert.match(summary.lines[2], /Bob/);
  assert.match(summary.lines[3], /净赢亏/);
  assert.match(summary.lines.at(-1), /亮牌/);
});

test('summarizes split side pots with per-player shares', () => {
  const summary = buildHandSummary({
    handNumber: 10,
    totalPot: 4000,
    potResults: [
      {
        potId: 0,
        potType: 'main',
        amount: 2000,
        winners: [{ playerId: 'p1', nickname: 'Alice', amount: 2000 }],
      },
      {
        potId: 1,
        potType: 'side',
        amount: 2000,
        winners: [
          { playerId: 'p2', nickname: 'Bob', amount: 1000 },
          { playerId: 'p3', nickname: 'Carol', amount: 1000 },
        ],
      },
    ],
  });

  assert.match(summary.lines[2], /边池/);
  assert.match(summary.lines[2], /平分/);
  assert.match(summary.lines[2], /Bob/);
  assert.match(summary.lines[2], /Carol/);
});

test('builds drawer items in reverse hand order with chip delta lines', () => {
  const history = buildHandHistoryView([
    {
      handNumber: 1,
      winners: [{ playerId: 'p1', nickname: 'Alice', winnings: 120 }],
      chipDeltas: { p1: 120, p2: -120 },
      players: [
        { id: 'p1', nickname: 'Alice' },
        { id: 'p2', nickname: 'Bob' },
      ],
      reveals: [],
    },
    {
      handNumber: 2,
      winners: [{ playerId: 'p2', nickname: 'Bob', winnings: 80 }],
      chipDeltas: { p1: -80, p2: 80 },
      players: [
        { id: 'p1', nickname: 'Alice' },
        { id: 'p2', nickname: 'Bob' },
      ],
      reveals: [],
    },
  ]);

  assert.equal(history[0].handNumber, 2);
  assert.equal(history[1].handNumber, 1);
  assert.match(history[0].lines.at(-1), /净赢亏/);
});

test('formats object-based board cards for pro-mode summaries', () => {
  const summary = buildHandSummary({
    handNumber: 3,
    communityCards: [
      { rank: 14, suit: 'spades' },
      { rank: 13, suit: 'hearts' },
      { rank: 10, suit: 'clubs' },
    ],
  });

  assert.equal(summary.boardLabel, 'A♠ K♥ 10♣');
});

test('formats object-based reveal cards in hand summaries', () => {
  const summary = buildHandSummary({
    handNumber: 4,
    reveals: [
      {
        playerId: 'p1',
        nickname: 'Alice',
        reveal: 'show_all',
        cards: [
          { rank: 14, suit: 'spades' },
          { rank: 11, suit: 'diamonds' },
        ],
      },
    ],
  });

  assert.match(summary.lines[0], /Alice/);
  assert.match(summary.lines[0], /A♠/);
  assert.match(summary.lines[0], /J♦/);
});

test('builds a clearer table pot summary for contested and uncontested side pots', () => {
  const summary = buildTablePotSummary({
    pot: 3020,
    sidePots: [
      { id: 1, amount: 1960, eligiblePlayers: ['p1', 'p2'] },
      { id: 2, amount: 1000, eligiblePlayers: ['p2'] },
    ],
  });

  assert.equal(summary.totalPot, 3020);
  assert.equal(summary.items[0].label, '总池');
  assert.equal(summary.items[1].label, '边池 1');
  assert.equal(summary.items[1].detail, '2人争夺');
  assert.equal(summary.items[2].label, '待匹配差额');
  assert.equal(summary.items[2].detail, '仍需其他玩家补齐');
});

test('derives an event-rail summary from the latest hand history and live table pot state', () => {
  const eventRail = deriveEventRailView({
    roomState: 'settling',
    gameState: {
      pot: 5000,
      sidePots: [{ id: 1, amount: 2000, eligiblePlayers: ['p1', 'p2'] }],
      handHistory: [
        {
          handNumber: 11,
          totalPot: 5000,
          reason: '摊牌',
          communityCards: ['A♠', 'K♥', '7♦', '2♣', '2♠'],
          potResults: [
            {
              potId: 0,
              potType: 'main',
              amount: 3000,
              winners: [{ playerId: 'p1', nickname: 'Alice', amount: 3000 }],
            },
          ],
        },
      ],
    },
  });

  assert.equal(eventRail.roomState, 'settling');
  assert.equal(eventRail.livePotSummary.items[0].label, '总池');
  assert.equal(eventRail.latestSummary.handNumber, 11);
  assert.equal(eventRail.latestSummary.boardLabel, 'A♠ K♥ 7♦ 2♣ 2♠');
  assert.equal(eventRail.historyCount, 1);
});
