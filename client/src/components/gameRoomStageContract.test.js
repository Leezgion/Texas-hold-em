import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import test from 'node:test';
import React from 'react';
import { build } from 'esbuild';
import { renderToStaticMarkup } from 'react-dom/server';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);

const source = readFileSync(new URL('./GameRoom.jsx', import.meta.url), 'utf8');
const seatRingSource = readFileSync(new URL('./SeatRing.jsx', import.meta.url), 'utf8');
const seatCardSource = readFileSync(new URL('./SeatCard.jsx', import.meta.url), 'utf8');
const bundledModuleCache = new Map();
const bundledTempDirs = [];
const bundledExternal = [
  'react',
  'react-dom',
  'react-dom/server',
  'motion',
  'motion/*',
  'motion/react',
  'react-router-dom',
  'socket.io-client',
  'lucide-react',
];
const gameContextStubPlugin = {
  name: 'game-context-stub',
  setup(buildApi) {
    buildApi.onResolve({ filter: /GameContext(\.jsx)?$/ }, (args) => ({
      path: path.join(args.resolveDir, '__game_context_stub__.js'),
      namespace: 'game-context-stub',
    }));
    buildApi.onLoad({ filter: /.*/, namespace: 'game-context-stub' }, () => ({
      contents: 'export const useGame = () => ({ gameState: null });',
      loader: 'js',
    }));
  },
};

function renderComponent(element) {
  return renderToStaticMarkup(element);
}

async function loadBundledModule(relativePath) {
  const cached = bundledModuleCache.get(relativePath);

  if (cached) {
    return cached;
  }

  const entryFilePath = fileURLToPath(new URL(relativePath, import.meta.url));
  const tempDir = mkdtempSync(path.join(process.cwd(), '.tmp-stage-contract-'));
  const outfile = path.join(tempDir, `${path.basename(relativePath, '.jsx')}.cjs`);

  await build({
    entryPoints: [entryFilePath],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    outfile,
    jsx: 'automatic',
    logLevel: 'silent',
    external: bundledExternal,
    plugins: relativePath === './TableStage.jsx' ? [gameContextStubPlugin] : [],
  });

  const module = require(outfile);
  const loaded = { module, tempDir };
  bundledModuleCache.set(relativePath, loaded);
  bundledTempDirs.push(tempDir);
  return loaded;
}

test.after(() => {
  for (const tempDir of bundledTempDirs) {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

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

test('TableStageChrome renders the broadcast material contract and rail structure', async () => {
  const { module } = await loadBundledModule('./TableStageChrome.jsx');
  const chrome = renderComponent(
    React.createElement(module.default, {
      seatGuides: [],
      viewportWidth: 1280,
      viewportHeight: 900,
      tableDiameter: 352,
    })
  );

  assert.match(chrome, /data-table-family="broadcast-tactical-9max"/);
  assert.match(chrome, /data-center-surface-model="broadcast-clean-center"/);
  assert.match(chrome, /data-table-material-felt-tone="deep-green-velvet"/);
  assert.match(chrome, /data-table-material-rail-tone="black-gold"/);
  assert.match(chrome, /table-stage-chrome__outer-rail/);
  assert.match(chrome, /table-stage-chrome__transition-rail/);
  assert.match(chrome, /table-stage-chrome__felt/);
  assert.match(chrome, /table-stage-chrome__center-frame-shell/);
  assert.doesNotMatch(chrome, /data-table-rail-flow/);
  assert.doesNotMatch(chrome, /<defs>/);
});

test('TableStage threads broadcast center material hooks through the pot capsule render', async () => {
  const { module } = await loadBundledModule('./TableStage.jsx');
  const stage = renderComponent(
    React.createElement(module.default, {
      shellView: {
        stagePulseTone: 'idle',
        roomStateLabel: 'Ready',
        stageLabel: 'Stage',
        stageCaption: 'Caption',
        modeLabel: 'Pro',
        phaseLabel: 'Preflop',
        currentTurnSeatLabel: 'Seat 1',
        stageActionLabel: 'Act',
        lastActionLabel: 'Bet',
      },
      tablePotSummary: {
        items: [
          { label: 'Pot', amount: '1200' },
          { label: 'Side A', amount: '600' },
        ],
      },
      seatRing: React.createElement('div', { 'data-seat-ring': 'true' }),
      effectiveDisplayMode: 'pro',
      viewportWidth: 1280,
      viewportHeight: 900,
      tableDiameter: 352,
      seatGuides: [],
    })
  );

  assert.match(stage, /class="table-stage-pot-capsule"/);
  assert.match(stage, /data-center-surface-model="broadcast-clean-center"/);
  assert.match(stage, /data-table-material-felt-tone="deep-green-velvet"/);
  assert.match(stage, /data-table-material-rail-tone="black-gold"/);
});
