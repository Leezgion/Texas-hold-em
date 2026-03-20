import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const emptySeatSource = readFileSync(new URL('./EmptySeat.jsx', import.meta.url), 'utf8');
const seatCardSource = readFileSync(new URL('./SeatCard.jsx', import.meta.url), 'utf8');
const settlementOverlaySource = readFileSync(new URL('./SettlementOverlay.jsx', import.meta.url), 'utf8');

test('EmptySeat exposes a real button trigger with disabled semantics and an accessible label', () => {
  assert.match(emptySeatSource, /<button/);
  assert.match(emptySeatSource, /type="button"/);
  assert.match(emptySeatSource, /disabled=\{seatRequestPending\}/);
  assert.match(emptySeatSource, /aria-label=/);
});

test('SettlementOverlay routes reveal actions through an async pending-aware handler', () => {
  assert.match(settlementOverlaySource, /deriveRequestErrorFeedback/);
  assert.match(settlementOverlaySource, /const handleRevealSelection = async/);
  assert.match(settlementOverlaySource, /disabled=\{revealRequestPending\}/);
});

test('SeatCard renders embedded plaque class names instead of floating card classes', () => {
  assert.match(seatCardSource, /arena-seat-plaque/);
  assert.match(seatCardSource, /arena-seat-plaque--current-turn/);
  assert.doesNotMatch(seatCardSource, /arena-seat-card/);
});
