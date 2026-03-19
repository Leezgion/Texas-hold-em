import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const modalSource = readFileSync(new URL('./Modal.jsx', import.meta.url), 'utf8');
const roomPanelSheetSource = readFileSync(new URL('./RoomPanelSheet.jsx', import.meta.url), 'utf8');

test('Modal declares dialog semantics in its surface markup', () => {
  assert.match(modalSource, /role="dialog"/);
  assert.match(modalSource, /aria-modal="true"/);
  assert.match(modalSource, /aria-labelledby=/);
});

test('RoomPanelSheet declares dialog semantics in its surface markup', () => {
  assert.match(roomPanelSheetSource, /role="dialog"/);
  assert.match(roomPanelSheetSource, /aria-modal="true"/);
  assert.match(roomPanelSheetSource, /aria-labelledby=/);
});
