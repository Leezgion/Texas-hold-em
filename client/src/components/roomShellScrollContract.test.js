import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const gameRoomSource = readFileSync(new URL('./GameRoom.jsx', import.meta.url), 'utf8');
const shellCssSource = readFileSync(new URL('../index.css', import.meta.url), 'utf8');

test('GameRoom threads the viewport room scroll contract into the shell data attribute', () => {
  assert.match(gameRoomSource, /data-room-scroll-contract=\{roomViewportLayout\.roomScrollContract\}/);
  assert.doesNotMatch(
    gameRoomSource,
    /data-room-scroll-contract=\{roomViewportLayout\.viewportModel === 'phone-terminal' \? 'single-screen' : 'default'\}/
  );
});

test('room routes lock the outer shell height without depending on phone-only viewport selectors', () => {
  assert.match(shellCssSource, /\.mode-shell\[data-shell-route="room"\]\s*\{/);
  assert.match(shellCssSource, /\.mode-shell\[data-shell-route="room"\]\s+\.mode-shell__content,/);
  assert.match(shellCssSource, /\.mode-shell\[data-shell-route="room"\]\s+\.mode-app-shell\s*\{/);
  assert.doesNotMatch(
    shellCssSource,
    /\.mode-shell\[data-shell-route="room"\]\[data-shell-motion-viewport="phone-terminal"\]\s*\{/
  );
});
