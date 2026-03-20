import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const createRoomModalSource = readFileSync(new URL('./CreateRoomModal.jsx', import.meta.url), 'utf8');
const modePreviewCardSource = readFileSync(new URL('./ModePreviewCard.jsx', import.meta.url), 'utf8');
const globalStylesSource = readFileSync(new URL('../index.css', import.meta.url), 'utf8');

test('CreateRoomModal uses a terminal layout instead of a stacked tall-card form', () => {
  assert.match(createRoomModalSource, /create-room-modal__layout/);
  assert.match(createRoomModalSource, /create-room-modal__mode-strip/);
  assert.match(createRoomModalSource, /create-room-modal__main-grid/);
  assert.match(createRoomModalSource, /create-room-modal__settings-panel/);
  assert.match(createRoomModalSource, /create-room-modal__mode-sidebar/);
  assert.match(createRoomModalSource, /surfaceVariant=\"create-room-tile\"/);
});

test('ModePreviewCard exposes a dedicated terminal tile variant for the create-room surface', () => {
  assert.match(modePreviewCardSource, /surfaceVariant === 'create-room-tile'/);
  assert.match(modePreviewCardSource, /mode-preview-card--terminal-tile/);
});

test('create-room desktop layout promotes the terminal split before xl breakpoints', () => {
  assert.match(globalStylesSource, /\.create-room-modal__mode-strip\s*\{\s*@apply grid gap-3 lg:grid-cols-3;/s);
  assert.match(
    globalStylesSource,
    /\.create-room-modal__mode-sidebar\s*\{\s*@apply mt-4 grid gap-3 lg:grid-cols-\[minmax\(0,1\.1fr\)_minmax\(16rem,0\.9fr\)\];/s
  );
  assert.match(
    globalStylesSource,
    /\.create-room-modal__main-grid\s*\{\s*@apply grid gap-4 lg:grid-cols-\[minmax\(0,1\.15fr\)_minmax\(20rem,0\.85fr\)\];/s
  );
});
