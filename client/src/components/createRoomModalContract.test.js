import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./CreateRoomModal.jsx', import.meta.url), 'utf8');

test('CreateRoomModal limits the exposed room-size slider to 9 players', () => {
  assert.match(source, /<SliderInput[\s\S]*min=\{2\}[\s\S]*max=\{9\}/);
  assert.match(source, /maxLabel="9"/);
  assert.doesNotMatch(source, /max=\{10\}/);
  assert.doesNotMatch(source, /maxLabel="10"/);
});
