import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const gameRoomSource = readFileSync(new URL('./GameRoom.jsx', import.meta.url), 'utf8');
const tableHeaderSource = readFileSync(new URL('./TableHeader.jsx', import.meta.url), 'utf8');
const actionDockSource = readFileSync(new URL('./ActionDock.jsx', import.meta.url), 'utf8');
const actionButtonsSource = readFileSync(new URL('./ActionButtons.jsx', import.meta.url), 'utf8');
const globalStylesSource = readFileSync(new URL('../index.css', import.meta.url), 'utf8');

test('GameRoom keeps the dock inside the single-screen main stage stack', () => {
  assert.match(gameRoomSource, /const roomDockRef = useRef\(null\)/);
  assert.match(gameRoomSource, /const \[measuredDockReservePx, setMeasuredDockReservePx\] = useState\(roomViewportLayout\.dockReservePx\)/);
  assert.match(gameRoomSource, /const computedDockBottomPx = Number\.parseFloat\(window\.getComputedStyle\(dockElement\)\.bottom\) \|\| 0/);
  assert.match(gameRoomSource, /new ResizeObserver\(updateDockReserve\)/);
  assert.match(gameRoomSource, /'--room-terminal-dock-reserve': `\$\{measuredDockReservePx\}px`/);
  assert.match(gameRoomSource, /data-hero-dock-style=\{shellView\.heroDockStyle\}/);
  assert.match(gameRoomSource, /data-hero-dock-density=\{shellView\.heroDockDensity\}/);
  assert.match(gameRoomSource, /data-stage-spacing=\{shellView\.stageSpacing\}/);
  assert.match(gameRoomSource, /const isTableCoupledHeroDock = shellView\.heroDockStyle === 'table-coupled-terminal'/);
  assert.match(
    gameRoomSource,
    /const roomTerminalMainClassName = isTableCoupledHeroDock\s*\?\s*'room-terminal-main room-terminal-main--table-apron'\s*:\s*'room-terminal-main';/
  );
  assert.match(
    gameRoomSource,
    /const roomTerminalDockClassName = isTableCoupledHeroDock\s*\?\s*'room-terminal-dock room-terminal-dock--table-apron'\s*:\s*'room-terminal-dock';/
  );
  assert.match(gameRoomSource, /data-support-surface-policy-key=\{roomViewportLayout\.supportSurfacePolicyKey\}/);
  assert.match(gameRoomSource, /data-room-touch-scroll-model=\{/);
  assert.match(gameRoomSource, /hideHeroSeat=\{isTableCoupledHeroDock\}/);
  assert.match(
    gameRoomSource,
    /<div className=\{roomTerminalMainClassName\}>[\s\S]*className=\{roomShellGridClassName\}[\s\S]*<div className=\{roomTerminalDockClassName\}[^>]*ref=\{roomDockRef\}[^>]*>[\s\S]*<\/div>[\s\S]*<\/div>/s
  );
});

test('TableHeader and ActionDock consume the terminal layout policies from the viewport helper', () => {
  assert.match(tableHeaderSource, /viewportLayout\?\.headerActionModel/);
  assert.match(tableHeaderSource, /房间/);
  assert.match(actionDockSource, /data-dock-presentation=\{viewportLayout\?\.dockPresentation\}/);
  assert.match(actionDockSource, /data-hero-dock-style=\{shellView\?\.heroDockStyle\}/);
  assert.match(actionDockSource, /data-hero-dock-density=\{shellView\?\.heroDockDensity\}/);
  assert.match(actionDockSource, /data-support-launcher-density=\{shellView\?\.supportLauncherDensity\}/);
  assert.match(tableHeaderSource, /data-stage-spacing=\{shellView\?\.stageSpacing\}/);
  assert.match(tableHeaderSource, /data-support-surface-policy-key=\{viewportLayout\?\.supportSurfacePolicyKey\}/);
  assert.match(actionDockSource, /data-support-surface-policy-key=\{viewportLayout\?\.supportSurfacePolicyKey\}/);
});

test('TableHeader renders as a thin single-line status spine with badge-like room identity', () => {
  assert.match(tableHeaderSource, /className="room-terminal-header__spine/);
  assert.match(tableHeaderSource, /room-terminal-header__track/);
  assert.match(tableHeaderSource, /room-terminal-header__badge--room-code/);
  assert.match(tableHeaderSource, /room-terminal-header__badge--mode/);
  assert.match(tableHeaderSource, /room-terminal-header__badge--state/);
  assert.match(tableHeaderSource, /room-terminal-header__badge--connection/);
  assert.match(tableHeaderSource, /room-terminal-header__toolbar/);
  assert.match(tableHeaderSource, /data-header-action-model=\{viewportLayout\?\.headerActionModel\}/);
  assert.doesNotMatch(tableHeaderSource, /rounded-\[1\.75rem\]/);
  assert.doesNotMatch(tableHeaderSource, /shadow-\[0_24px_60px_rgba\(0,0,0,0\.28\)\]/);
  assert.match(
    globalStylesSource,
    /\.room-terminal-header__spine\s*\{[\s\S]*display:\s*flex;[\s\S]*align-items:\s*center;[\s\S]*justify-content:\s*space-between;[\s\S]*overflow:\s*hidden;/s
  );
  assert.match(
    globalStylesSource,
    /\.room-terminal-header__track\s*\{[\s\S]*display:\s*flex;[\s\S]*overflow-x:\s*auto;[\s\S]*flex-wrap:\s*nowrap;[\s\S]*white-space:\s*nowrap;/s
  );
  assert.match(
    globalStylesSource,
    /\.room-terminal-header__track::-webkit-scrollbar\s*\{[\s\S]*display:\s*none;/s
  );
});

test('TableHeader collapses room identity into a single-line status spine', () => {
  assert.match(tableHeaderSource, /room-terminal-header__spine/);
  assert.match(tableHeaderSource, /room-terminal-header__track/);
  assert.match(tableHeaderSource, /room-terminal-header__toolbar/);
  assert.match(tableHeaderSource, /room-terminal-header__badge--room-code/);
  assert.doesNotMatch(tableHeaderSource, /text-2xl/);
  assert.match(
    globalStylesSource,
    /\.room-terminal-header__spine\s*\{[\s\S]*display:\s*flex;[\s\S]*align-items:\s*center;[\s\S]*justify-content:\s*space-between;/s
  );
  assert.match(
    globalStylesSource,
    /\.room-terminal-header__track\s*\{[\s\S]*overflow-x:\s*auto;[\s\S]*flex-wrap:\s*nowrap;[\s\S]*white-space:\s*nowrap;/s
  );
  assert.match(
    globalStylesSource,
    /\.room-terminal-header__track::-webkit-scrollbar\s*\{[\s\S]*display:\s*none;/s
  );
});

test('ActionDock exposes primary quick actions when header actions collapse into room-sheet-first mode', () => {
  assert.match(actionDockSource, /const showsPrimaryQuickActions = supportsSecondaryPanels && viewportLayout\?\.headerActionModel !== 'toolbar'/);
  assert.match(
    actionDockSource,
    /const showsInlineQuickActions =\s*showsPrimaryQuickActions && !\(gameStarted && viewportLayout\?\.viewportModel === 'phone-terminal'\);/s
  );
  assert.match(actionDockSource, /const showsApronRail = showsPrimaryQuickActions \|\| supportsSecondaryPanels;/);
  assert.match(actionDockSource, /const dockLayout = !showsDecisionCenter && showsApronRail \? 'waiting-apron' : showsApronRail \? 'decision-apron' : 'core-only';/);
  assert.match(actionDockSource, /tactical-dock--table-apron/);
  assert.match(actionDockSource, /tactical-dock__apron-rail/);
  assert.match(actionDockSource, /data-dock-layout=\{dockLayout\}/);
  assert.match(actionDockSource, /tactical-dock__quick-actions/);
  assert.match(actionDockSource, /onOpenRebuy/);
  assert.match(actionDockSource, /onLeaveSeat/);
  assert.match(actionDockSource, /onShare/);
  assert.match(actionDockSource, /onLeaveRoom/);
  assert.match(actionDockSource, /快速操作/);
});

test('ActionDock collapses waiting-state hero info into a denser strip so the table keeps more visible depth', () => {
  assert.match(actionDockSource, /const isWaitingDockState = !gameStarted;/);
  assert.match(actionDockSource, /data-dock-state=\{isWaitingDockState \? 'waiting' : 'live'\}/);
  assert.match(actionDockSource, /isWaitingDockState \? \(\s*<div className="tactical-dock__waiting-strip">/s);
  assert.match(actionDockSource, /tactical-dock__waiting-metric/);
  assert.match(
    globalStylesSource,
    /\.room-terminal-dock-panel\[data-dock-state="waiting"\]\s+\.tactical-dock__quick-actions\s*\{[\s\S]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\);/s
  );
  assert.match(
    globalStylesSource,
    /\.tactical-dock__waiting-strip\s*\{[\s\S]*display:\s*flex;[\s\S]*flex-wrap:\s*wrap;/s
  );
});

test('room shell css uses a two-row frame with an overlay dock reserve', () => {
  assert.match(globalStylesSource, /\.room-terminal-frame\s*\{[\s\S]*grid-template-rows:\s*auto minmax\(0, 1fr\);/s);
  assert.match(
    globalStylesSource,
    /\.room-terminal-main\s*\{[\s\S]*position:\s*relative;[\s\S]*padding-bottom:\s*var\(--room-terminal-dock-reserve,\s*0px\);/s
  );
  assert.match(
    globalStylesSource,
    /\.room-terminal-dock\s*\{[\s\S]*position:\s*absolute;[\s\S]*left:\s*0;[\s\S]*right:\s*0;[\s\S]*bottom:\s*0;/s
  );
  assert.match(
    globalStylesSource,
    /\.room-terminal-main--table-apron::after\s*\{[\s\S]*bottom:\s*max\(0px,\s*calc\(var\(--room-terminal-dock-reserve,\s*0px\)\s*-\s*0\.7rem\)\);/s
  );
  assert.match(
    globalStylesSource,
    /\.room-terminal-dock--table-apron\s*>\s*\.tactical-dock\s*\{[\s\S]*border-top:\s*1px solid/s
  );
  assert.match(
    globalStylesSource,
    /\.room-terminal-dock--table-apron\s*\{[^}]*bottom:\s*0;/s
  );
  assert.doesNotMatch(
    globalStylesSource,
    /\.room-terminal-dock--table-apron\s*\{[^}]*transform:/s
  );
  assert.match(
    globalStylesSource,
    /\.tactical-dock__hero-stats\s*\{[\s\S]*display:\s*grid;[\s\S]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);/s
  );
  assert.match(
    globalStylesSource,
    /\.tactical-dock__stat\s*\{[\s\S]*min-width:\s*0;/s
  );
  assert.match(
    globalStylesSource,
    /\.tactical-dock__apron-rail\s*\{[\s\S]*display:\s*grid;[\s\S]*align-content:\s*end;/s
  );
  assert.match(
    globalStylesSource,
    /\.room-terminal-dock-panel\[data-dock-layout="waiting-apron"\]\s+\.tactical-dock__grid\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1\.05fr\)\s*minmax\(19rem,\s*0\.95fr\);/s
  );
});

test('ActionButtons preserves 44px touch targets for primary and commit actions', () => {
  assert.match(
    actionButtonsSource,
    /className=\{buildActionCommandClass\('fold'\)\}/
  );
  assert.match(
    actionButtonsSource,
    /className=\{buildActionCommandClass\('check'\)\}/
  );
  assert.match(
    actionButtonsSource,
    /className=\{buildActionCommandClass\('call'\)\}/
  );
  assert.match(
    actionButtonsSource,
    /className=\{buildActionCommandClass\('raise', showRaiseInput \? 'table-action-command--selected' : ''\)\}/
  );
  assert.match(
    actionButtonsSource,
    /className=\{buildActionCommandClass\('allin'\)\}/
  );
  assert.match(
    actionButtonsSource,
    /className=\{buildActionCommandClass\(\s*sliderValue === maxRaiseAmount \? 'allin' : 'confirm',\s*'table-action-command--wide'\s*\)\}/s
  );
  assert.match(
    actionButtonsSource,
    /className=\{buildActionCommandClass\('cancel', 'table-action-command--wide'\)\}/
  );
  assert.match(globalStylesSource, /\.table-action-command\s*\{[\s\S]*min-height:\s*4rem;/s);
});

test('ActionDock keeps the live-hand action frame wired to ActionButtons', () => {
  assert.match(
    actionDockSource,
    /gameStarted && \(\s*<motion\.div[\s\S]*<ActionButtons/s
  );
  assert.match(
    actionDockSource,
    /const handCardSize = viewportLayout\?\.viewportModel === 'phone-terminal' \? 'small' : 'large';/
  );
});

test('ActionButtons fail-closes when player or gameState is temporarily unavailable', () => {
  assert.match(
    actionButtonsSource,
    /useEffect\(\(\) => \{\s*if \(gameState\) \{\s*setIsSubmitting\(false\);\s*\}\s*\}, \[gameState\]\);/s
  );
  assert.match(
    actionButtonsSource,
    /const hasResolvedActionState = Boolean\(player && gameState\);[\s\S]*useKeyboardShortcuts\(\{[\s\S]*\}\);\s*if \(!hasResolvedActionState\) \{\s*return \(\s*<div className="table-action-console table-action-console--inactive">[\s\S]*等待牌局状态同步[\s\S]*\);\s*\}/s
  );
});

test('phone-terminal live hand collapses the dock stack back toward the table', () => {
  assert.match(
    globalStylesSource,
    /\.room-terminal-dock-panel\[data-viewport-model="phone-terminal"\]\[data-dock-state="live"\]\s+\.tactical-dock__quick-actions-block\s*\{\s*display:\s*none;/s
  );
  assert.match(
    globalStylesSource,
    /\.room-terminal-dock-panel\[data-viewport-model="phone-terminal"\]\[data-dock-state="live"\]\s+\.table-action-console__stats\s*\{[\s\S]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\);/s
  );
  assert.match(
    globalStylesSource,
    /\.room-terminal-dock-panel\[data-viewport-model="phone-terminal"\]\[data-dock-state="live"\]\s+\.table-action-console__command-row\s*\{[\s\S]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\);/s
  );
});
