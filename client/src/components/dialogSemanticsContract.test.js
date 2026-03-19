import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('Modal source emits real dialog semantics and focus handling', () => {
  const source = readFileSync(new URL('./Modal.jsx', import.meta.url), 'utf8');

  assert.match(source, /role:\s*'dialog'/);
  assert.match(source, /['"]aria-modal['"]:\s*'true'/);
  assert.match(source, /['"]aria-labelledby['"]:\s*title \? titleId : undefined/);
  assert.match(source, /tabIndex:\s*-1/);
  assert.match(source, /onKeyDown:\s*handleKeyDown/);
  assert.match(source, /Escape/);
  assert.match(source, /previousActiveElement/);
  assert.match(source, /focus\(\)/);
});

test('RoomPanelSheet source emits real dialog semantics and focus handling', () => {
  const source = readFileSync(new URL('./RoomPanelSheet.jsx', import.meta.url), 'utf8');

  assert.match(source, /role="dialog"|role:\s*'dialog'/);
  assert.match(source, /['"]aria-modal['"]:\s*'true'|aria-modal="true"/);
  assert.match(source, /aria-labelledby=\{title \? titleId : undefined\}/);
  assert.match(source, /tabIndex=\{-1\}/);
  assert.match(source, /onKeyDown=\{handleKeyDown\}/);
  assert.match(source, /Escape/);
  assert.match(source, /previousActiveElement/);
  assert.match(source, /focus\(\)/);
});

test('dialog surfaces keep a visible focus treatment instead of removing focus cues outright', () => {
  const source = readFileSync(new URL('../index.css', import.meta.url), 'utf8');

  assert.match(source, /\.modal-content:focus-visible,/);
  assert.match(source, /\.room-panel-sheet__surface:focus-visible/);
  assert.match(source, /outline:\s*2px solid/);
  assert.match(source, /outline-offset:\s*3px/);
});
