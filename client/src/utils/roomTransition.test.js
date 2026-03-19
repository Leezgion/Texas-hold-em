import assert from 'node:assert/strict';
import test from 'node:test';

import { shouldApplyIncomingRoomPayload } from './roomTransition.js';

test('rejects room payloads from unrelated rooms during steady state', () => {
  assert.equal(
    shouldApplyIncomingRoomPayload({
      previousRoomId: 'AAAAAA',
      incomingRoomId: 'BBBBBB',
      isCreatingRoom: false,
      intentionalJoin: false,
      navigationTarget: null,
    }),
    false
  );
});

test('accepts the first payload for a newly created room while the client is still creating it', () => {
  assert.equal(
    shouldApplyIncomingRoomPayload({
      previousRoomId: 'AAAAAA',
      incomingRoomId: 'BBBBBB',
      isCreatingRoom: true,
      intentionalJoin: false,
      navigationTarget: null,
    }),
    true
  );
});

test('accepts the target room payload while navigating into a newly joined room', () => {
  assert.equal(
    shouldApplyIncomingRoomPayload({
      previousRoomId: 'AAAAAA',
      incomingRoomId: 'BBBBBB',
      isCreatingRoom: false,
      intentionalJoin: false,
      navigationTarget: '/game/BBBBBB',
    }),
    true
  );
});
