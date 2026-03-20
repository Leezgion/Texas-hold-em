import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const createRoomModalSource = readFileSync(new URL('./CreateRoomModal.jsx', import.meta.url), 'utf8');
const modePreviewCardSource = readFileSync(new URL('./ModePreviewCard.jsx', import.meta.url), 'utf8');
const globalStylesSource = readFileSync(new URL('../index.css', import.meta.url), 'utf8');

test('CreateRoomModal uses a terminal layout instead of a stacked tall-card form', () => {
  assert.match(createRoomModalSource, /contentProps=\{\{[\s\S]*'data-create-room-density': createRoomCopy\.densityModel,[\s\S]*\}\}/s);
  assert.match(createRoomModalSource, /contentProps=\{\{[\s\S]*'data-create-room-tile-height': createRoomCopy\.modeTileHeight,[\s\S]*\}\}/s);
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
  assert.match(modePreviewCardSource, /surfaceDensity === 'compact-terminal'/);
  assert.match(modePreviewCardSource, /tileHeight === 'short'/);
  assert.match(modePreviewCardSource, /mode-preview-card--terminal-tile-compact/);
  assert.match(modePreviewCardSource, /mode-preview-card--terminal-tile-short/);
});

test('create-room desktop layout promotes the terminal split before xl breakpoints', () => {
  assert.match(globalStylesSource, /\.create-room-modal__mode-strip\s*\{\s*@apply grid gap-2\.5 lg:grid-cols-3;/s);
  assert.match(
    globalStylesSource,
    /\.create-room-modal\[data-create-room-density="compact-terminal"\]\s+\.create-room-modal__section\s*\{\s*@apply rounded-\[1\.35rem\] border border-white\/10 bg-white\/5 p-3\.5 sm:p-4;/s
  );
  assert.match(
    globalStylesSource,
    /\.create-room-modal__mode-sidebar\s*\{\s*@apply mt-3 grid gap-2\.5 lg:grid-cols-\[minmax\(0,1\.1fr\)_minmax\(15rem,0\.9fr\)\];/s
  );
  assert.match(
    globalStylesSource,
    /\.create-room-modal__main-grid\s*\{\s*@apply grid gap-3 lg:grid-cols-\[minmax\(0,1\.15fr\)_minmax\(19rem,0\.85fr\)\];/s
  );
});
