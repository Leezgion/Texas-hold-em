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
const communityCardsSource = readFileSync(new URL('./CommunityCards.jsx', import.meta.url), 'utf8');
const tableStageSource = readFileSync(new URL('./TableStage.jsx', import.meta.url), 'utf8');
const stageStylesSource = readFileSync(new URL('../index.css', import.meta.url), 'utf8');
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
    plugins:
      relativePath === './TableStage.jsx' || relativePath === './ActionDock.jsx' ? [gameContextStubPlugin] : [],
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
  assert.match(source, /visualSeatCount:\s*roomGeometryContract\.visualSeatCount/);
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
        centerPriority: 'board-pot-street',
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

  assert.match(stage, /table-stage-center-shell/);
  assert.match(stage, /data-center-shell-density="compact"/);
  assert.match(stage, /table-stage-center-shell__pot/);
  assert.match(stage, /table-stage-center-shell__board/);
  assert.match(stage, /table-stage-center-shell__street/);
  assert.match(stage, /table-stage-pot-capsule/);
  assert.match(stage, /data-center-priority="board-pot-street"/);
  assert.match(stage, /data-center-surface-model="broadcast-clean-center"/);
  assert.match(stage, /data-table-material-felt-tone="deep-green-velvet"/);
  assert.match(stage, /data-table-material-rail-tone="black-gold"/);
});

test('TableStage keeps pro mode board-first by dropping the duplicate summary rail and explanatory caption copy', async () => {
  const { module } = await loadBundledModule('./TableStage.jsx');
  const stage = renderComponent(
    React.createElement(module.default, {
      shellView: {
        stagePulseTone: 'idle',
        roomStateLabel: '等待开始',
        stageCaption: '这段解释不应该出现在职业桌主舞台里',
        modeLabel: '职业',
        phaseLabel: null,
        currentTurnSeatLabel: null,
        stageActionLabel: null,
        lastActionLabel: null,
      },
      tablePotSummary: {
        centerPriority: 'board-pot-street',
        items: [{ label: '底池', amount: '0' }],
      },
      seatRing: React.createElement('div', { 'data-seat-ring': 'true' }),
      effectiveDisplayMode: 'pro',
      viewportWidth: 1280,
      viewportHeight: 900,
      tableDiameter: 352,
      seatGuides: [],
    })
  );

  assert.doesNotMatch(stage, /这段解释不应该出现在职业桌主舞台里/);
  assert.doesNotMatch(stage, /poker-shell-stat-card/);
});

test('TableStage turns compact and pro layouts into an overlay badge row instead of a standalone headline block', async () => {
  const { module } = await loadBundledModule('./TableStage.jsx');
  const stage = renderComponent(
    React.createElement(module.default, {
      shellView: {
        stagePulseTone: 'idle',
        roomStateLabel: '牌局进行中',
        stageLabel: '牌桌主舞台',
        stageCaption: '这段说明不该再占走桌面高度',
        modeLabel: '职业',
        phaseLabel: 'PREFLOP',
        currentTurnSeatLabel: '座1',
        stageActionLabel: '轮到 座1 · 需跟注 10',
        lastActionLabel: null,
      },
      tablePotSummary: {
        centerPriority: 'board-pot-street',
        items: [{ label: '底池', amount: '30' }],
      },
      seatRing: React.createElement('div', { 'data-seat-ring': 'true' }),
      effectiveDisplayMode: 'pro',
      viewportLayout: {
        headerDensity: 'compact',
      },
      viewportWidth: 390,
      viewportHeight: 844,
      tableDiameter: 320,
      seatGuides: [],
    })
  );

  assert.match(stage, /table-stage-panel__overlay-row/);
  assert.match(stage, /table-stage-panel__overlay-track/);
  assert.match(stage, /table-stage-panel__overlay-badge/);
  assert.doesNotMatch(stage, /牌桌主舞台/);
  assert.doesNotMatch(stage, /table-stage-panel__header/);
  assert.doesNotMatch(stage, /这段说明不该再占走桌面高度/);
});

test('Settlement sheet stays above center-shell layers to preserve reveal-button interactions', () => {
  assert.match(stageStylesSource, /\.table-stage-center-shell__pot\s*\{[\s\S]*?z-index:\s*21;/);
  assert.match(stageStylesSource, /\.settlement-sheet\s*\{[\s\S]*?z-index:\s*22;/);
});

test('CommunityCards and TableStage use the cleaned center-shell naming and avoid HUD-ring language', () => {
  assert.match(communityCardsSource, /community-cards-center-shell/);
  assert.match(communityCardsSource, /community-cards-center-shell--compact-density/);
  assert.match(communityCardsSource, /community-cards-center-shell__phase/);
  assert.match(communityCardsSource, /community-cards-center-shell__tray/);
  assert.match(communityCardsSource, /community-cards-area__slot/);
  assert.match(communityCardsSource, /const showsIdleBoardSlots = !gameState \|\| !gameState\.communityCards;/);
  assert.match(communityCardsSource, /const showsIdleBoardSlot = !isVisible && !isAnimating;/);
  assert.doesNotMatch(communityCardsSource, /community-cards-center-shell__pot/);
  assert.doesNotMatch(communityCardsSource, /if \(!gameState \|\| !gameState\.communityCards\)[\s\S]*poker-card community back/s);
  assert.match(tableStageSource, /table-stage-center-shell/);
  assert.match(tableStageSource, /data-center-shell-density=\{centerShellDensity\}/);
  assert.match(tableStageSource, /table-stage-center-shell__pot/);
  assert.match(tableStageSource, /table-stage-center-shell__board/);
  assert.match(tableStageSource, /table-stage-center-shell__street/);
  assert.doesNotMatch(communityCardsSource, /shell-orbit|orbitRingPath|guide-ring|hud-ring|hud ring/i);
  assert.doesNotMatch(tableStageSource, /shell-orbit|orbitRingPath|guide-ring|hud-ring|hud ring/i);
});

test('center-shell css encodes a compact board-first density pass', () => {
  assert.match(stageStylesSource, /\.table-stage-center-shell\[data-center-shell-density="compact"\]\s*\{/);
  assert.match(stageStylesSource, /\.community-cards-center-shell--compact-density\s+\.community-cards-area__tray\s*\{/);
  assert.match(stageStylesSource, /\.community-cards-area__slot\s*\{/);
  assert.match(stageStylesSource, /\.community-cards-area__slot--idle\s*\{/);
  assert.match(stageStylesSource, /\.table-stage-panel__overlay-row\s*\{[\s\S]*position:\s*absolute;[\s\S]*top:\s*0\.72rem;[\s\S]*left:\s*0\.72rem;[\s\S]*right:\s*0\.72rem;/);
  assert.match(stageStylesSource, /\.table-stage-panel__overlay-track\s*\{[\s\S]*display:\s*flex;[\s\S]*gap:\s*0\.35rem;[\s\S]*flex-wrap:\s*wrap;/);
  assert.match(stageStylesSource, /\.table-stage-panel__overlay-badge\s*\{[\s\S]*border-radius:\s*999px;[\s\S]*padding:\s*0\.3rem 0\.55rem;/);
  assert.match(stageStylesSource, /\.table-stage-panel\[data-stage-header-density="compact"\]\s*\{[\s\S]*padding-block:\s*0\.72rem;/);
});

test('ActionDock renders a sync placeholder instead of blanking the center during live-hand state transitions', async () => {
  const { module } = await loadBundledModule('./ActionDock.jsx');
  const dock = renderComponent(
    React.createElement(module.default, {
      currentPlayer: {
        id: 'hero-1',
        nickname: 'Hero',
        chips: 960,
        currentBet: 20,
        isHost: true,
        hand: [],
      },
      currentPlayerView: {
        statusLabel: '游戏中',
      },
      gameStarted: true,
      canStartGame: false,
      onStartGame: () => {},
      gameState: null,
      currentPlayerId: 'hero-1',
      players: [],
      effectiveDisplayMode: 'pro',
      roomState: 'in_hand',
      viewportLayout: {
        viewportModel: 'desktop-terminal',
        supportSurfacePolicyKey: 'desktop',
      },
      shellView: {
        heroDockPriority: 'table-first',
        heroDockStyle: 'table-coupled-terminal',
        heroDockDensity: 'high-efficiency',
      },
    })
  );

  assert.match(dock, /等待牌局状态同步/);
  assert.match(dock, /tactical-dock__action-frame/);
});
