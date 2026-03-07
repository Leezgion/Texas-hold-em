import test from 'node:test';
import assert from 'node:assert/strict';

import {
  deriveLeaveSeatDialog,
  derivePlayerStateView,
  deriveSeatSelectionNotice,
  formatSignedChips,
} from './gameViewModel.js';

test('labels busted players as waiting for rebuy', () => {
  const view = derivePlayerStateView(
    {
      tableState: 'busted_wait_rebuy',
      ledger: { sessionNet: -1000 },
    },
    'idle'
  );

  assert.equal(view.statusLabel, '等待补码');
  assert.equal(view.canRequestRebuy, true);
  assert.equal(view.netLabel, '-1,000');
});

test('marks active in-hand players as unable to rebuy', () => {
  const view = derivePlayerStateView(
    {
      tableState: 'active_in_hand',
      ledger: { sessionNet: 250 },
    },
    'in_hand'
  );

  assert.equal(view.statusLabel, '游戏中');
  assert.equal(view.canRequestRebuy, false);
  assert.equal(view.netLabel, '+250');
});

test('labels waiting seats with authoritative table semantics', () => {
  const view = derivePlayerStateView(
    {
      tableState: 'seated_wait_next_hand',
      ledger: { sessionNet: 0 },
    },
    'in_hand'
  );

  assert.equal(view.statusLabel, '下一手加入');
  assert.equal(view.isSeated, true);
  assert.equal(view.isSpectator, false);
});

test('maps recovery-required seats to waiting-for-recovery labels', () => {
  const view = derivePlayerStateView(
    {
      tableState: 'seated_ready',
      ledger: { sessionNet: 0 },
    },
    'recovery_required'
  );

  assert.equal(view.statusLabel, '等待恢复');
});

test('derives seat selection notices from the authoritative room state', () => {
  assert.deepEqual(deriveSeatSelectionNotice('idle', 1), {
    channel: 'game-success',
    detail: '已选择座位 2',
  });

  assert.deepEqual(deriveSeatSelectionNotice('settling', 1), {
    channel: 'game-info',
    detail: '本手正在结算，入座后会在下一手自动加入',
  });

  assert.deepEqual(deriveSeatSelectionNotice('recovery_required', 1), {
    channel: 'game-info',
    detail: '房间状态异常，入座会在牌桌恢复后生效',
  });
});

test('derives leave-seat dialogs from current hand participation instead of gameStarted alone', () => {
  assert.deepEqual(
    deriveLeaveSeatDialog({ tableState: 'active_in_hand' }, 'in_hand', false),
    {
      isDangerous: true,
      message: '您正在当前手牌中，离座将自动弃牌。确认要离开座位吗？',
      warning: '注意：此操作将导致您自动弃牌',
    }
  );

  assert.deepEqual(
    deriveLeaveSeatDialog({ tableState: 'seated_wait_next_hand' }, 'in_hand', false),
    {
      isDangerous: false,
      message: '您当前未参与本手，确认要离开座位进入观战模式吗？',
      warning: null,
    }
  );
});

test('handles missing currentPlayer when deriving leave-seat dialogs', () => {
  assert.deepEqual(deriveLeaveSeatDialog(null, 'idle', true), {
    isDangerous: false,
    message: '确认要退出房间吗？',
    warning: null,
  });
});

test('formats signed chip values for the table UI', () => {
  assert.equal(formatSignedChips(0), '0');
  assert.equal(formatSignedChips(3200), '+3,200');
  assert.equal(formatSignedChips(-450), '-450');
});
