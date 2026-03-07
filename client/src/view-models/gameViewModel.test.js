import test from 'node:test';
import assert from 'node:assert/strict';

import { derivePlayerStateView, formatSignedChips } from './gameViewModel.js';

test('labels busted players as waiting for rebuy', () => {
  const view = derivePlayerStateView(
    {
      tableState: 'busted_wait_rebuy',
      ledger: { sessionNet: -1000 },
    },
    'idle'
  );

  assert.equal(view.statusLabel, '等待补码');
  assert.equal(view.canRequestRebuy, true);
  assert.equal(view.netLabel, '-1,000');
});

test('marks active in-hand players as unable to rebuy', () => {
  const view = derivePlayerStateView(
    {
      tableState: 'active_in_hand',
      ledger: { sessionNet: 250 },
    },
    'in_hand'
  );

  assert.equal(view.statusLabel, '游戏中');
  assert.equal(view.canRequestRebuy, false);
  assert.equal(view.netLabel, '+250');
});

test('labels waiting seats with authoritative table semantics', () => {
  const view = derivePlayerStateView(
    {
      tableState: 'seated_wait_next_hand',
      ledger: { sessionNet: 0 },
    },
    'in_hand'
  );

  assert.equal(view.statusLabel, '下一手加入');
  assert.equal(view.isSeated, true);
  assert.equal(view.isSpectator, false);
});

test('formats signed chip values for the table UI', () => {
  assert.equal(formatSignedChips(0), '0');
  assert.equal(formatSignedChips(3200), '+3,200');
  assert.equal(formatSignedChips(-450), '-450');
});
