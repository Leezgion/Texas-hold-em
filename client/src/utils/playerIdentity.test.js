import assert from 'node:assert/strict';
import test from 'node:test';

import { getPlayerDisplayName, sanitizeDisplayName, truncateDisplayName } from './playerIdentity.js';

test('sanitizes raw device identities into stable product-facing labels', () => {
  assert.equal(sanitizeDisplayName('device_123456', { fallback: '玩家' }), '玩家');
  assert.equal(sanitizeDisplayName('房主-device_abcdef', { fallback: '玩家', isHost: true }), '房主');
  assert.equal(sanitizeDisplayName('AceKing', { fallback: '玩家' }), 'AceKing');
});

test('derives player display names from player objects without leaking device ids', () => {
  assert.equal(
    getPlayerDisplayName({ nickname: 'device_abcdef', id: 'device_abcdef' }, { fallback: '玩家' }),
    '玩家'
  );
  assert.equal(
    getPlayerDisplayName({ nickname: '房主-device_abcdef', id: 'device_abcdef', isHost: true }, { fallback: '玩家' }),
    '房主'
  );
  assert.equal(
    getPlayerDisplayName({ nickname: 'RiverKing', id: 'device_abcdef' }, { fallback: '玩家' }),
    'RiverKing'
  );
});

test('truncates long display names without altering short names', () => {
  assert.equal(truncateDisplayName('职业玩家小明', 14), '职业玩家小明');
  assert.equal(truncateDisplayName('ThisNameIsWayTooLongToFit', 14), 'ThisNameIsW...');
});
