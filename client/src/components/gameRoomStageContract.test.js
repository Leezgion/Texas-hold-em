import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./GameRoom.jsx', import.meta.url), 'utf8');

test('GameRoom threads canonical slots into the seat ring view', () => {
  assert.match(source, /canonicalSlots:\s*roomGeometryContract\.canonicalSlots/);
});

test('GameRoom drives both stage chrome and seat ring from the live seat entries', () => {
  assert.match(source, /seatGuides=\{seatRingEntries\}/);
  assert.doesNotMatch(source, /seatGuides=\{roomGeometryContract\.seatGuides\}/);
});
