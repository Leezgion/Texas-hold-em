import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./GameRoom.jsx', import.meta.url), 'utf8');
const seatRingSource = readFileSync(new URL('./SeatRing.jsx', import.meta.url), 'utf8');
const seatCardSource = readFileSync(new URL('./SeatCard.jsx', import.meta.url), 'utf8');

test('GameRoom threads canonical slots into the seat ring view', () => {
  assert.match(source, /canonicalSlots:\s*roomGeometryContract\.canonicalSlots/);
});

test('GameRoom drives both stage chrome and seat ring from the live seat entries', () => {
  assert.match(source, /seatGuides=\{seatRingEntries\}/);
  assert.doesNotMatch(source, /seatGuides=\{roomGeometryContract\.seatGuides\}/);
});

test('GameRoom derives current-turn styling from the authoritative current player entry', () => {
  assert.match(source, /currentTurnPlayer/);
  assert.match(source, /seat\.player\.id === currentTurnPlayer\.id/);
  assert.doesNotMatch(source, /playersList\.indexOf\(seat\.player\)/);
});

test('SeatRing and SeatCard expose canonical slot metadata instead of count-driven fallbacks', () => {
  assert.doesNotMatch(seatRingSource, /seats\[0\]\?\.position\?\.profile/);
  assert.match(seatRingSource, /geometryContract\?\.tableSurfaceLayout\?\.profile \|\| 'desktop-oval'/);
  assert.match(seatCardSource, /data-anchor-slot-id/);
  assert.match(seatCardSource, /data-canonical-slot-index/);
});
