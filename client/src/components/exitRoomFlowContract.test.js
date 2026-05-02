import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const gameRoomSource = readFileSync(new URL('./GameRoom.jsx', import.meta.url), 'utf8');

test('GameRoom suppresses automatic URL rejoin while the user is exiting a live room', () => {
  assert.match(gameRoomSource, /const isExitingRoomRef = useRef\(false\);/);
  assert.match(
    gameRoomSource,
    /if\s*\(\s*isExitingRoomRef\.current\s*\)\s*\{\s*console\.log\('正在退出房间，跳过自动房间恢复'\);\s*return;\s*\}/s
  );
  assert.match(
    gameRoomSource,
    /isExitingRoomRef\.current\s*=\s*true;[\s\S]*const result = await leaveRoom\(\);/
  );
  assert.match(
    gameRoomSource,
    /catch\s*\(error\)\s*\{[\s\S]*isExitingRoomRef\.current\s*=\s*false;/
  );
});
