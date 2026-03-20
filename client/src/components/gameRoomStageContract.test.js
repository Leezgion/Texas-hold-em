import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./GameRoom.jsx', import.meta.url), 'utf8');
const tableStageSource = readFileSync(new URL('./TableStage.jsx', import.meta.url), 'utf8');
const seatRingSource = readFileSync(new URL('./SeatRing.jsx', import.meta.url), 'utf8');
const seatCardSource = readFileSync(new URL('./SeatCard.jsx', import.meta.url), 'utf8');
const tableStageChromeSource = readFileSync(new URL('./TableStageChrome.jsx', import.meta.url), 'utf8');

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
  assert.match(
    seatRingSource,
    /geometryContract\?\.tableSurfaceLayout\?\.profile \|\| seats\[0\]\?\.position\?\.profile \|\| 'desktop-oval'/
  );
  assert.match(seatCardSource, /data-anchor-slot-id/);
  assert.match(seatCardSource, /data-canonical-slot-index/);
  assert.match(seatCardSource, /Number\.isInteger\(seat\.canonicalSlotIndex\)/);
  assert.doesNotMatch(seatCardSource, /Number\(seat\.canonicalSlotIndex\)/);
});

test('TableStageChrome exposes broadcast material language instead of HUD shell language', () => {
  assert.match(tableStageChromeSource, /data-table-family/);
  assert.match(tableStageChromeSource, /deep-green-velvet|black-gold|broadcast-clean-center/);
  assert.doesNotMatch(tableStageChromeSource, /shellOrientation/);
  assert.doesNotMatch(tableStageChromeSource, /orbitRingPath/);
  assert.doesNotMatch(tableStageChromeSource, /haloShell/);
});

test('TableStage threads broadcast center material hooks through the pot capsule render', () => {
  assert.match(tableStageSource, /className="table-stage-pot-capsule"[\s\S]*data-center-surface-model=\{centerSurfaceModel\}/);
  assert.match(tableStageSource, /className="table-stage-pot-capsule"[\s\S]*data-table-material-felt-tone=\{tableFeltTone\}/);
  assert.match(tableStageSource, /className="table-stage-pot-capsule"[\s\S]*data-table-material-rail-tone=\{tableRailTone\}/);
});
