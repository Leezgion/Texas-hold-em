import assert from 'node:assert/strict';
import test from 'node:test';

import { buildQuickRaiseSizes } from './betSizing.js';

test('deduplicates quick raise sizes after big-blind alignment', () => {
  assert.deepEqual(
    buildQuickRaiseSizes({
      potSize: 30,
      minRaise: 20,
      maxRaiseAmount: 990,
      bigBlind: 20,
    }),
    [
      { label: '1/3池', amount: 20 },
      { label: '1x池', amount: 40 },
    ]
  );
});

test('keeps the full quick raise ladder when aligned amounts stay unique', () => {
  assert.deepEqual(
    buildQuickRaiseSizes({
      potSize: 120,
      minRaise: 40,
      maxRaiseAmount: 300,
      bigBlind: 20,
    }),
    [
      { label: '1/3池', amount: 40 },
      { label: '1/2池', amount: 60 },
      { label: '1x池', amount: 120 },
      { label: '1.2x池', amount: 160 },
    ]
  );
});

test('filters quick raise sizes above the remaining stack', () => {
  assert.deepEqual(
    buildQuickRaiseSizes({
      potSize: 120,
      minRaise: 40,
      maxRaiseAmount: 80,
      bigBlind: 20,
    }),
    [
      { label: '1/3池', amount: 40 },
      { label: '1/2池', amount: 60 },
    ]
  );
});
