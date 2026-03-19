import test from 'node:test';
import assert from 'node:assert/strict';

import { buildHandHistoryView, buildHandSummary, buildTablePotSummary } from './handHistoryViewModel.js';

test('summarizes main pot, side pots, and reveal choices', () => {
  const summary = buildHandSummary({
    handNumber: 9,
    totalPot: 5000,
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
  });

  assert.equal(summary.title, '第 9 手');
  assert.match(summary.lines[0], /总池/);
  assert.match(summary.lines[1], /主池/);
  assert.match(summary.lines[1], /Alice/);
  assert.match(summary.lines[2], /边池/);
  assert.match(summary.lines[2], /Bob/);
  assert.match(summary.lines[3], /亮牌/);
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
