import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const joinRoomModalSource = readFileSync(new URL('./JoinRoomModal.jsx', import.meta.url), 'utf8');
const globalStylesSource = readFileSync(new URL('../index.css', import.meta.url), 'utf8');

test('JoinRoomModal uses a compact Poker OS terminal surface instead of the legacy gray form', () => {
  assert.match(joinRoomModalSource, /className="join-room-modal"/);
  assert.match(joinRoomModalSource, /bodyClassName="join-room-modal__body"/);
  assert.match(joinRoomModalSource, /headerClassName="join-room-modal__header"/);
  assert.match(joinRoomModalSource, /contentProps=\{\{[\s\S]*'data-join-room-density': 'compact-terminal'[\s\S]*\}\}/s);
  assert.match(joinRoomModalSource, /join-room-modal__hero/);
  assert.match(joinRoomModalSource, /join-room-modal__code-panel/);
  assert.match(joinRoomModalSource, /join-room-modal__code-value/);
  assert.match(joinRoomModalSource, /join-room-modal__signal-grid/);
  assert.match(joinRoomModalSource, /join-room-modal__submit/);
  assert.doesNotMatch(joinRoomModalSource, /form-label/);
  assert.doesNotMatch(joinRoomModalSource, /form-button/);
  assert.doesNotMatch(joinRoomModalSource, /bg-gray-/);
});

test('JoinRoomModal keeps retry copy concise and avoids the old long instruction list', () => {
  assert.match(joinRoomModalSource, /席位策略/);
  assert.match(joinRoomModalSource, /空位入座/);
  assert.match(joinRoomModalSource, /满员观战/);
  assert.match(joinRoomModalSource, /网络稳定/);
  assert.doesNotMatch(joinRoomModalSource, /游戏说明/);
  assert.doesNotMatch(joinRoomModalSource, /自动使用设备ID作为玩家标识/);
  assert.doesNotMatch(joinRoomModalSource, /支持换座和补码功能/);
});

test('JoinRoomModal CSS provides compact terminal chrome and phone-safe retry density', () => {
  assert.match(
    globalStylesSource,
    /\.join-room-modal\s*\{\s*background:[\s\S]*max-height:\s*min\(calc\(100vh - 1rem\),\s*34rem\);/s
  );
  assert.match(
    globalStylesSource,
    /\.join-room-modal__body\s*\{\s*@apply px-4 py-3 sm:px-5 sm:py-4;/s
  );
  assert.match(
    globalStylesSource,
    /\.join-room-modal__code-value\s*\{[\s\S]*font-family:\s*"IBM Plex Mono",\s*"Consolas",\s*monospace;/s
  );
  assert.match(
    globalStylesSource,
    /\.join-room-modal__submit\[data-join-request-state="pending"\]\s*\{/s
  );
  assert.match(
    globalStylesSource,
    /@media \(max-width: 767px\) \{[\s\S]*\.join-room-modal\s*\{[\s\S]*max-height:\s*min\(calc\(100dvh - 1rem\),\s*31rem\);/s
  );
});
