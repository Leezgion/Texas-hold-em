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
    /const roomTerminalMainClassName = isTableCoupledHeroDock\s*\?\s*'room-terminal-main room-terminal-main--table-coupled'\s*:\s*'room-terminal-main';/
  );
  assert.match(
    gameRoomSource,
    /const roomTerminalDockClassName = isTableCoupledHeroDock\s*\?\s*'room-terminal-dock room-terminal-dock--lower-rail-coupled'\s*:\s*'room-terminal-dock';/
  );
  assert.match(gameRoomSource, /data-support-surface-policy-key=\{roomViewportLayout\.supportSurfacePolicyKey\}/);
  assert.match(gameRoomSource, /data-room-touch-scroll-model=\{/);
  assert.match(
    gameRoomSource,
    /<div className=\{roomTerminalMainClassName\}>[\s\S]*className=\{roomShellGridClassName\}[\s\S]*<div className=\{roomTerminalDockClassName\}[^>]*ref=\{roomDockRef\}[^>]*>[\s\S]*<\/div>[\s\S]*<\/div>/s
  );
});

test('TableHeader and ActionDock consume the terminal layout policies from the viewport helper', () => {
  assert.match(tableHeaderSource, /viewportLayout\?\.headerActionModel/);
  assert.match(actionDockSource, /data-dock-presentation=\{viewportLayout\?\.dockPresentation\}/);
  assert.match(actionDockSource, /data-hero-dock-style=\{shellView\?\.heroDockStyle\}/);
  assert.match(actionDockSource, /data-hero-dock-density=\{shellView\?\.heroDockDensity\}/);
  assert.match(actionDockSource, /data-support-launcher-density=\{shellView\?\.supportLauncherDensity\}/);
  assert.match(tableHeaderSource, /data-stage-spacing=\{shellView\?\.stageSpacing\}/);
  assert.match(tableHeaderSource, /data-support-surface-policy-key=\{viewportLayout\?\.supportSurfacePolicyKey\}/);
  assert.match(actionDockSource, /data-support-surface-policy-key=\{viewportLayout\?\.supportSurfacePolicyKey\}/);
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
    /\.room-terminal-main--table-coupled::after\s*\{[\s\S]*bottom:\s*max\(0px,\s*calc\(var\(--room-terminal-dock-reserve,\s*0px\)\s*-\s*1rem\)\);/s
  );
  assert.match(
    globalStylesSource,
    /\.room-terminal-dock--lower-rail-coupled\s*>\s*\.tactical-dock\s*\{[\s\S]*border-top:\s*1px solid/s
  );
  assert.match(
    globalStylesSource,
    /\.room-terminal-dock--lower-rail-coupled\s*\{[^}]*bottom:\s*0\.15rem;/s
  );
  assert.doesNotMatch(
    globalStylesSource,
    /\.room-terminal-dock--lower-rail-coupled\s*\{[^}]*transform:/s
  );
});

test('ActionButtons preserves 44px touch targets for primary and commit actions', () => {
  assert.match(
    actionButtonsSource,
    /className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-600\/90/
  );
  assert.match(
    actionButtonsSource,
    /className="h-11 rounded-lg bg-green-600\/90 px-3\.5 text-sm font-bold text-white/
  );
  assert.match(
    actionButtonsSource,
    /className="h-11 rounded-lg bg-blue-600\/90 px-3\.5 text-sm font-bold text-white/
  );
  assert.match(
    actionButtonsSource,
    /className=\{`h-11 w-11 \$\{/
  );
  assert.match(
    actionButtonsSource,
    /className="h-11 rounded-lg bg-purple-600\/90 px-2\.5 text-sm font-bold text-white/
  );
  assert.match(
    actionButtonsSource,
    /className=\{`h-11 flex-1 \$\{/
  );
  assert.match(
    actionButtonsSource,
    /className="h-11 flex-1 rounded-lg bg-gray-600 text-sm font-medium text-white/
  );
  assert.doesNotMatch(actionButtonsSource, /className=\{`h-9 flex-1 \$\{/);
});

test('ActionDock keeps the live-hand action frame wired to ActionButtons', () => {
  assert.match(
    actionDockSource,
    /gameStarted && \(\s*<motion\.div[\s\S]*<ActionButtons/s
  );
});

test('ActionButtons fail-closes when player or gameState is temporarily unavailable', () => {
  assert.match(
    actionButtonsSource,
    /useEffect\(\(\) => \{\s*if \(gameState\) \{\s*setIsSubmitting\(false\);\s*\}\s*\}, \[gameState\]\);/s
  );
  assert.match(
    actionButtonsSource,
    /const hasResolvedActionState = Boolean\(player && gameState\);[\s\S]*useKeyboardShortcuts\(\{[\s\S]*\}\);\s*if \(!hasResolvedActionState\) \{\s*return \(\s*<div className="flex h-10 items-center justify-center rounded-xl border border-gray-600 bg-gray-800\/90 px-3 backdrop-blur-xs">[\s\S]*等待牌局状态同步[\s\S]*\);\s*\}/s
  );
});
