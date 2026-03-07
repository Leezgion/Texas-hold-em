import test from 'node:test';
import assert from 'node:assert/strict';

import { buildHandHistoryView, buildHandSummary } from './handHistoryViewModel.js';

test('summarizes main pot, side pots, and reveal choices', () => {
  const summary = buildHandSummary({
    handNumber: 9,
    winners: [
      { playerId: 'p1', nickname: 'Alice', amount: 3000, potType: 'main' },
      { playerId: 'p1', nickname: 'Alice', amount: 1000, potType: 'side' },
    ],
    reveals: [
      { playerId: 'p2', nickname: 'Bob', reveal: 'show_one', cards: ['A♠'] },
    ],
  });

  assert.equal(summary.title, '第 9 手');
  assert.match(summary.lines[0], /主池/);
  assert.match(summary.lines[1], /边池/);
  assert.match(summary.lines[2], /亮牌/);
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
