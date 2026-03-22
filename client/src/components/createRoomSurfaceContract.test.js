import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const createRoomModalSource = readFileSync(new URL('./CreateRoomModal.jsx', import.meta.url), 'utf8');
const modePreviewCardSource = readFileSync(new URL('./ModePreviewCard.jsx', import.meta.url), 'utf8');
const sliderInputSource = readFileSync(new URL('./SliderInput.jsx', import.meta.url), 'utf8');
const globalStylesSource = readFileSync(new URL('../index.css', import.meta.url), 'utf8');

test('CreateRoomModal uses a terminal layout instead of a stacked tall-card form', () => {
  assert.match(createRoomModalSource, /maxWidth="max-w-5xl"/);
  assert.match(createRoomModalSource, /contentProps=\{\{[\s\S]*'data-create-room-density': createRoomCopy\.densityModel,[\s\S]*\}\}/s);
  assert.match(createRoomModalSource, /contentProps=\{\{[\s\S]*'data-create-room-tile-height': createRoomCopy\.modeTileHeight,[\s\S]*\}\}/s);
  assert.match(createRoomModalSource, /create-room-modal__layout/);
  assert.match(createRoomModalSource, /create-room-modal__mode-strip/);
  assert.match(createRoomModalSource, /create-room-modal__main-grid/);
  assert.match(createRoomModalSource, /create-room-modal__settings-panel/);
  assert.match(createRoomModalSource, /create-room-modal__mode-sidebar/);
  assert.match(createRoomModalSource, /surfaceVariant=\"create-room-tile\"/);
});

test('CreateRoomModal keeps the quick summary focused on opening parameters instead of repeating the mode identity', () => {
  assert.match(createRoomModalSource, /create-room-modal__quick-summary/);
  assert.match(createRoomModalSource, /create-room-modal__quick-summary-headline/);
  assert.match(createRoomModalSource, /create-room-modal__summary-grid/);
  assert.match(createRoomModalSource, /create-room-modal__summary-stat/);
  assert.match(createRoomModalSource, /create-room-modal__summary-stat-label/);
  assert.match(createRoomModalSource, /create-room-modal__summary-stat-value/);
  assert.doesNotMatch(createRoomModalSource, /create-room-modal__quick-summary-copy/);
  assert.doesNotMatch(createRoomModalSource, /create-room-modal__mode-summary/);
  assert.doesNotMatch(createRoomModalSource, /selectedModeMeta\.detail/);
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
    /\.create-room-modal\[data-create-room-density="compact-terminal"\]\s+\.create-room-modal__section\s*\{\s*@apply rounded-\[1\.3rem\] border border-white\/10 bg-white\/5 p-3 sm:p-3\.5;/s
  );
  assert.match(
    globalStylesSource,
    /\.create-room-modal__mode-sidebar\s*\{\s*@apply mt-2;/s
  );
  assert.match(
    globalStylesSource,
    /\.create-room-modal__main-grid\s*\{\s*@apply grid gap-2\.5 lg:grid-cols-\[minmax\(0,1\.18fr\)_minmax\(16\.5rem,0\.82fr\)\];/s
  );
});

test('create-room compact summary styles collapse the verbose right rail into a tighter grid', () => {
  assert.match(
    globalStylesSource,
    /\.create-room-modal__quick-summary\s*\{\s*@apply grid gap-1\.5 rounded-\[1rem\] border border-white\/10 bg-black\/25 p-2;/s
  );
  assert.match(
    globalStylesSource,
    /\.create-room-modal__quick-summary-headline\s*\{\s*@apply text-sm font-semibold text-white;/s
  );
  assert.match(
    globalStylesSource,
    /\.create-room-modal__quick-summary-copy\s*\{\s*@apply text-\[12px\] leading-4 text-slate-300;/s
  );
  assert.match(
    globalStylesSource,
    /\.create-room-modal__summary-grid\s*\{\s*@apply grid gap-1 md:grid-cols-3;/s
  );
  assert.match(
    globalStylesSource,
    /\.create-room-modal__summary-stat\s*\{\s*@apply rounded-\[0\.85rem\] border border-white\/10 bg-slate-950\/60 px-2\.5 py-2;/s
  );
  assert.doesNotMatch(globalStylesSource, /\.create-room-modal__mode-summary\s*\{/);
  assert.doesNotMatch(globalStylesSource, /\.create-room-modal__mode-summary-label\s*\{/);
  assert.doesNotMatch(globalStylesSource, /\.create-room-modal__mode-summary-copy\s*\{/);
});

test('create-room quick-open desktop contract further compresses tiles, summary, and advanced toggle height', () => {
  assert.match(
    globalStylesSource,
    /\.mode-preview-card--terminal-tile-short\s*\{\s*min-height:\s*6\.6rem;/s
  );
  assert.match(
    globalStylesSource,
    /\.mode-preview-card--terminal-tile-compact\s+\.mode-preview-card__tile-copy\s*\{\s*@apply text-\[11px\] leading-4 text-slate-300 line-clamp-1;/s
  );
  assert.match(
    globalStylesSource,
    /\.create-room-modal__quick-summary\s*\{\s*@apply grid gap-1\.5 rounded-\[1rem\] border border-white\/10 bg-black\/25 p-2;/s
  );
  assert.match(
    globalStylesSource,
    /\.create-room-modal__summary-grid\s*\{\s*@apply grid gap-1 md:grid-cols-3;/s
  );
  assert.match(
    globalStylesSource,
    /\.create-room-modal__section-toggle\s*\{\s*@apply flex w-full items-center justify-between gap-3 rounded-\[1\.05rem\] border border-white\/10 bg-black\/20 px-3 py-2 text-left transition hover:border-amber-400\/30 hover:bg-black\/30;/s
  );
});

test('CreateRoomModal uses a compact slider density for the player-count field', () => {
  assert.match(createRoomModalSource, /<SliderInput[\s\S]*className=\"create-room-modal__player-count-slider\"/s);
  assert.match(createRoomModalSource, /<SliderInput[\s\S]*density=\"compact\"/s);
});

test('SliderInput exposes a compact density branch for tighter vertical rhythm', () => {
  assert.match(sliderInputSource, /density = 'default'/);
  assert.match(sliderInputSource, /const isCompact = density === 'compact';/);
  assert.match(sliderInputSource, /const rootClassName = isCompact \? 'space-y-2\.5' : 'space-y-4';/);
  assert.match(sliderInputSource, /const valueClassName = isCompact \? 'text-xl' : 'text-2xl';/);
});

test('create-room modal uses a tighter desktop chrome budget before forcing body scroll', () => {
  assert.match(
    globalStylesSource,
    /\.create-room-modal\s*\{\s*background:[\s\S]*max-height:\s*calc\(100vh - 1rem\);/s
  );
  assert.match(
    globalStylesSource,
    /\.create-room-modal__header\s*\{\s*@apply px-4 py-2\.5 sm:px-5 sm:py-3;/s
  );
  assert.match(
    globalStylesSource,
    /\.create-room-modal__body\s*\{\s*@apply px-4 py-1\.5 sm:px-5;/s
  );
  assert.match(
    globalStylesSource,
    /\.create-room-modal__footer\s*\{\s*@apply px-4 py-2 sm:px-5 sm:py-2\.5;/s
  );
});
