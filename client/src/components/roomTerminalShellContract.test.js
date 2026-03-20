import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const gameRoomSource = readFileSync(new URL('./GameRoom.jsx', import.meta.url), 'utf8');
const tableHeaderSource = readFileSync(new URL('./TableHeader.jsx', import.meta.url), 'utf8');
const actionDockSource = readFileSync(new URL('./ActionDock.jsx', import.meta.url), 'utf8');
const globalStylesSource = readFileSync(new URL('../index.css', import.meta.url), 'utf8');

test('GameRoom keeps the dock inside the single-screen main stage stack', () => {
  assert.match(gameRoomSource, /const roomDockRef = useRef\(null\)/);
  assert.match(gameRoomSource, /const \[measuredDockReservePx, setMeasuredDockReservePx\] = useState\(roomViewportLayout\.dockReservePx\)/);
  assert.match(gameRoomSource, /const computedDockBottomPx = Number\.parseFloat\(window\.getComputedStyle\(dockElement\)\.bottom\) \|\| 0/);
  assert.match(gameRoomSource, /new ResizeObserver\(updateDockReserve\)/);
  assert.match(gameRoomSource, /'--room-terminal-dock-reserve': `\$\{measuredDockReservePx\}px`/);
  assert.match(gameRoomSource, /data-support-surface-policy-key=\{roomViewportLayout\.supportSurfacePolicyKey\}/);
  assert.match(gameRoomSource, /data-room-touch-scroll-model=\{/);
  assert.match(
    gameRoomSource,
    /<div className="room-terminal-main">[\s\S]*className=\{roomShellGridClassName\}[\s\S]*<div className="room-terminal-dock"[^>]*ref=\{roomDockRef\}[^>]*>[\s\S]*<\/div>[\s\S]*<\/div>/s
  );
});

test('TableHeader and ActionDock consume the terminal layout policies from the viewport helper', () => {
  assert.match(tableHeaderSource, /viewportLayout\?\.headerActionModel/);
  assert.match(actionDockSource, /data-dock-presentation=\{viewportLayout\?\.dockPresentation\}/);
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
});
