import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildProActionStatRows,
  deriveTableShellView,
  deriveSeatRingView,
  deriveIntelRailView,
  deriveProActionSummary,
  deriveProPlayerSummary,
  deriveCanStartGame,
  deriveStartGameFeedback,
  deriveLeaveSeatFeedback,
  deriveLeaveRoomFeedback,
  derivePendingJoinBanner,
  deriveRequestErrorFeedback,
  deriveRecoverRoomFeedback,
  deriveSeatChangeFeedback,
  deriveSeatTakeFeedback,
  deriveLeaveSeatDialog,
  derivePlayerStateView,
  deriveRecoveryBanner,
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

test('gives hosts an explicit recovery action when the room is stuck', () => {
  assert.deepEqual(deriveRecoveryBanner({ isHost: true }, 'recovery_required'), {
    title: '房间状态异常',
    detail: '牌桌状态异常，请先恢复房间，再重新开始游戏。',
    actionLabel: '恢复房间',
    canRecover: true,
  });
});

test('shows non-host players a waiting-for-recovery message only', () => {
  assert.deepEqual(deriveRecoveryBanner({ isHost: false }, 'recovery_required'), {
    title: '房间状态异常',
    detail: '牌桌状态异常，等待房主恢复房间后继续。',
    actionLabel: null,
    canRecover: false,
  });
});

test('allows spectator hosts to start when two other players are seated', () => {
  const currentPlayer = {
    isHost: true,
    tableState: 'spectating',
    seat: -1,
  };

  const players = [
    currentPlayer,
    { id: 'guest-a', tableState: 'seated_ready', seat: 0 },
    { id: 'guest-b', tableState: 'seated_ready', seat: 1 },
  ];

  assert.equal(deriveCanStartGame(currentPlayer, players, 'idle'), true);
});

test('keeps spectator non-hosts from starting even when enough players are seated', () => {
  const currentPlayer = {
    isHost: false,
    tableState: 'spectating',
    seat: -1,
  };

  const players = [
    currentPlayer,
    { id: 'guest-a', tableState: 'seated_ready', seat: 0 },
    { id: 'guest-b', tableState: 'seated_ready', seat: 1 },
  ];

  assert.equal(deriveCanStartGame(currentPlayer, players, 'idle'), false);
});

test('explains clearly why a seated next-hand player has no cards yet', () => {
  assert.deepEqual(
    derivePendingJoinBanner(
      {
        tableState: 'seated_wait_next_hand',
      },
      'in_hand'
    ),
    {
      title: '已入座，本手观战',
      detail: '你已经占住座位，会在本手结束后自动加入；当前还没有两张底牌，也不会参与本手底池。',
    }
  );
});

test('shows a settling-specific pending-join explanation', () => {
  assert.deepEqual(
    derivePendingJoinBanner(
      {
        tableState: 'seated_wait_next_hand',
      },
      'settling'
    ),
    {
      title: '已入座，等待下一手',
      detail: '本手正在结算，你会在下一手开始时自动收到手牌并参与行动。',
    }
  );
});

test('derives a warning instead of a success toast when a zero-chip player still cannot sit', () => {
  assert.deepEqual(
    deriveSeatTakeFeedback({
      seatIndex: 2,
      tableState: 'busted_wait_rebuy',
      roomState: 'in_hand',
    }),
    {
      channel: 'game-warning',
      detail: '当前筹码不足，已保留观战状态，请先补码后再入座。',
    }
  );
});

test('derives the post-success seat notice from the authoritative room state', () => {
  assert.deepEqual(
    deriveSeatTakeFeedback({
      seatIndex: 1,
      tableState: 'seated_wait_next_hand',
      roomState: 'settling',
    }),
    {
      channel: 'game-info',
      detail: '本手正在结算，入座后会在下一手自动加入',
    }
  );
});

test('derives change-seat feedback from the confirmed target seat', () => {
  assert.deepEqual(
    deriveSeatChangeFeedback({
      toSeat: 3,
    }),
    {
      channel: 'game-success',
      detail: '已换到座位 4',
    }
  );
});

test('derives leave-seat feedback from whether the server had to auto-fold', () => {
  assert.deepEqual(
    deriveLeaveSeatFeedback({
      forcedFold: true,
    }),
    {
      channel: 'game-warning',
      detail: '已离开座位并进入观战模式，本手已自动弃牌。',
    }
  );

  assert.deepEqual(
    deriveLeaveSeatFeedback({
      forcedFold: false,
    }),
    {
      channel: 'game-info',
      detail: '已离开座位，进入观战模式。',
    }
  );
});

test('derives pro-mode action summary from authoritative current-hand numbers', () => {
  const summary = deriveProActionSummary({
    currentPlayer: {
      id: 'p1',
      chips: 990,
      currentBet: 10,
      folded: false,
      allIn: false,
    },
    players: [
      {
        id: 'p1',
        chips: 990,
        currentBet: 10,
        folded: false,
        allIn: false,
      },
      {
        id: 'p2',
        chips: 980,
        currentBet: 20,
        folded: false,
        allIn: false,
      },
      {
        id: 'p3',
        chips: 400,
        currentBet: 20,
        folded: true,
        allIn: false,
      },
    ],
    gameState: {
      currentBet: 20,
      minRaise: 20,
      pot: 30,
    },
  });

  assert.deepEqual(summary, {
    toCall: 10,
    minRaise: 20,
    pot: 30,
    effectiveStack: 980,
  });
});

test('builds compact pro-mode action stat rows for the decision strip', () => {
  assert.deepEqual(
    buildProActionStatRows({
      toCall: 10,
      minRaise: 20,
      pot: 30,
      effectiveStack: 980,
    }),
    [
      { label: 'To Call', value: '10' },
      { label: 'Min Raise', value: '20' },
      { label: 'Pot', value: '30' },
      { label: 'Eff', value: '980' },
    ]
  );
});

test('derives compact pro-mode player summaries for seated players in the current hand', () => {
  const summary = deriveProPlayerSummary(
    {
      id: 'p1',
      seat: 0,
      chips: 1010,
      tableState: 'active_in_hand',
      ledger: { sessionNet: 10 },
    },
    {
      roomState: 'in_hand',
      players: [
        {
          id: 'p1',
          seat: 0,
          tableState: 'active_in_hand',
        },
        {
          id: 'p2',
          seat: 1,
          tableState: 'active_in_hand',
        },
      ],
      gameState: {
        dealerPosition: 1,
      },
    }
  );

  assert.deepEqual(summary, {
    seatLabel: '座1',
    positionLabel: 'BB',
    statusLabel: '游戏中',
    chipsLabel: '1,010',
    netLabel: '+10',
  });
});

test('derives a poker-os shell summary for the room header and shared banners', () => {
  const shell = deriveTableShellView({
    roomId: 'ABC123',
    roomState: 'settling',
    roomSettings: { roomMode: 'study' },
    connected: true,
    effectiveDisplayMode: 'pro',
    currentPlayer: { isHost: false, tableState: 'seated_wait_next_hand' },
  });

  assert.deepEqual(shell, {
    roomCode: 'ABC123',
    roomState: 'settling',
    roomStateLabel: '结算中',
    connectedLabel: '服务器已连接',
    modeLabel: 'Study',
    modeTitle: '训练复盘',
    effectiveDisplayMode: 'pro',
    pendingJoinBanner: {
      title: '已入座，等待下一手',
      detail: '本手正在结算，你会在下一手开始时自动收到手牌并参与行动。',
    },
    recoveryBanner: null,
  });
});

test('builds ordered seat-ring entries with current-player and empty-seat markers', () => {
  const seatRing = deriveSeatRingView({
    maxPlayers: 4,
    currentPlayerId: 'p2',
    roomState: 'in_hand',
    players: [
      {
        id: 'p1',
        nickname: 'Alice',
        seat: 2,
        chips: 1200,
        tableState: 'active_in_hand',
      },
      {
        id: 'p2',
        nickname: 'Bob',
        seat: 0,
        chips: 980,
        tableState: 'seated_wait_next_hand',
      },
    ],
    gameState: {
      dealerPosition: 2,
    },
  });

  assert.deepEqual(
    seatRing.map((seat) => ({
      seatIndex: seat.seatIndex,
      seatLabel: seat.seatLabel,
      occupied: seat.occupied,
      isCurrentPlayer: seat.isCurrentPlayer,
      statusLabel: seat.statusLabel,
      seatTone: seat.seatTone,
      positionLabel: seat.positionLabel,
    })),
    [
      {
        seatIndex: 0,
        seatLabel: '座1',
        occupied: true,
        isCurrentPlayer: true,
        statusLabel: '下一手加入',
        seatTone: 'hero-pending',
        positionLabel: null,
      },
      {
        seatIndex: 1,
        seatLabel: '座2',
        occupied: false,
        isCurrentPlayer: false,
        statusLabel: '空座',
        seatTone: 'open-seat',
        positionLabel: null,
      },
      {
        seatIndex: 2,
        seatLabel: '座3',
        occupied: true,
        isCurrentPlayer: false,
        statusLabel: '游戏中',
        seatTone: 'occupied-live',
        positionLabel: null,
      },
      {
        seatIndex: 3,
        seatLabel: '座4',
        occupied: false,
        isCurrentPlayer: false,
        statusLabel: '空座',
        seatTone: 'open-seat',
        positionLabel: null,
      },
    ]
  );
});

test('derives intel-rail summaries for occupancy and host controls', () => {
  const intelRail = deriveIntelRailView({
    roomState: 'recovery_required',
    roomSettings: { maxPlayers: 6, roomMode: 'club' },
    currentPlayer: { id: 'host', isHost: true, tableState: 'spectating' },
    players: [
      { id: 'host', isHost: true, tableState: 'spectating' },
      { id: 'p1', tableState: 'seated_ready', seat: 0 },
      { id: 'p2', tableState: 'busted_wait_rebuy', seat: -1 },
    ],
  });

  assert.deepEqual(intelRail, {
    occupancyLabel: '3/6',
    seatedCount: 1,
    spectatorCount: 2,
    modeTitle: '私局辅助',
    canStartGame: false,
    canRecoverRoom: true,
    hostActionLabel: '恢复房间',
  });
});

test('leaves current-hand position blank for seated players who are only waiting for next hand', () => {
  const summary = deriveProPlayerSummary(
    {
      id: 'p3',
      seat: 2,
      chips: 1000,
      tableState: 'seated_wait_next_hand',
      ledger: { sessionNet: 0 },
    },
    {
      roomState: 'in_hand',
      players: [
        {
          id: 'p1',
          seat: 0,
          tableState: 'active_in_hand',
        },
        {
          id: 'p2',
          seat: 1,
          tableState: 'active_in_hand',
        },
        {
          id: 'p3',
          seat: 2,
          tableState: 'seated_wait_next_hand',
        },
      ],
      gameState: {
        dealerPosition: 1,
      },
    }
  );

  assert.deepEqual(summary, {
    seatLabel: '座3',
    positionLabel: null,
    statusLabel: '下一手加入',
    chipsLabel: '1,000',
    netLabel: '0',
  });
});

test('derives leave-room feedback from whether the server had to auto-fold', () => {
  assert.deepEqual(
    deriveLeaveRoomFeedback({
      forcedFold: true,
    }),
    {
      channel: 'game-warning',
      detail: '已退出房间，本手已自动弃牌。',
    }
  );

  assert.deepEqual(
    deriveLeaveRoomFeedback({
      forcedFold: false,
    }),
    {
      channel: 'game-info',
      detail: '已退出房间。',
    }
  );
});

test('derives a fallback start-game notice when the room returns to idle', () => {
  assert.deepEqual(
    deriveStartGameFeedback({
      handStarted: false,
      roomState: 'idle',
    }),
    {
      channel: 'game-info',
      detail: '当前没有足够的可参战玩家，房间已回到等待开始状态。',
    }
  );

  assert.equal(
    deriveStartGameFeedback({
      handStarted: true,
      roomState: 'in_hand',
    }),
    null
  );
});

test('derives recover-room feedback after a successful recovery', () => {
  assert.deepEqual(deriveRecoverRoomFeedback({ roomState: 'idle' }), {
    channel: 'game-success',
    detail: '房间已恢复，可以重新开始游戏。',
  });
});

test('maps out-of-turn action errors to immediate warning feedback', () => {
  assert.deepEqual(
    deriveRequestErrorFeedback({
      scope: 'playerAction',
      fallbackPrefix: '操作失败',
      error: {
        code: 'PLAYER_OUT_OF_TURN',
        message: '不是你的回合',
      },
    }),
    {
      channel: 'game-warning',
      detail: '当前不是你的回合，操作未生效。',
    }
  );
});

test('maps recovery-required start errors to an operator-facing warning', () => {
  assert.deepEqual(
    deriveRequestErrorFeedback({
      scope: 'startGame',
      fallbackPrefix: '开始游戏失败',
      error: {
        code: 'ROOM_RECOVERY_REQUIRED',
        message: '房间状态异常，需要恢复',
      },
    }),
    {
      channel: 'game-warning',
      detail: '当前牌桌状态异常，请先恢复房间，再重新开始游戏。',
    }
  );
});

test('falls back to the original error message when no specialized mapping exists', () => {
  assert.deepEqual(
    deriveRequestErrorFeedback({
      scope: 'seatChange',
      fallbackPrefix: '换座失败',
      error: {
        code: 'SOMETHING_ELSE',
        message: '未知问题',
      },
    }),
    {
      channel: 'game-error',
      detail: '换座失败：未知问题',
    }
  );
});

test('maps stale device-registration failures to a refresh hint', () => {
  assert.deepEqual(
    deriveRequestErrorFeedback({
      scope: 'createRoom',
      fallbackPrefix: '创建房间失败',
      error: {
        message: '设备未注册',
      },
    }),
    {
      channel: 'game-warning',
      detail: '当前页面身份已失效，请刷新页面后重试。',
    }
  );
});
