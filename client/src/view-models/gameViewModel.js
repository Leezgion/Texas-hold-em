import { ROOM_MODE_META } from '../utils/productMode.js';

const REBUY_BLOCKED_STATES = new Set(['active_in_hand', 'all_in_this_hand', 'disconnected']);
const SEATED_STATES = new Set([
  'seated_ready',
  'seated_wait_next_hand',
  'active_in_hand',
  'folded_this_hand',
  'all_in_this_hand',
  'disconnected',
]);
const SPECTATOR_STATES = new Set(['spectating', 'busted_wait_rebuy']);
const CURRENT_HAND_STATES = new Set(['active_in_hand', 'all_in_this_hand', 'disconnected']);
const POSITIONED_HAND_STATES = new Set(['active_in_hand', 'folded_this_hand', 'all_in_this_hand', 'disconnected']);

function mapRoomStateToLabel(roomState = 'idle') {
  switch (roomState) {
    case 'in_hand':
      return '牌局进行中';
    case 'settling':
      return '结算中';
    case 'recovery_required':
      return '等待恢复';
    case 'idle':
    default:
      return '等待开始';
  }
}

export function formatSignedChips(value = 0) {
  const normalized = Number(value) || 0;
  if (normalized === 0) {
    return '0';
  }

  const prefix = normalized > 0 ? '+' : '-';
  return `${prefix}${Math.abs(normalized).toLocaleString()}`;
}

export function mapTableStateToLabel(tableState, roomState = 'idle') {
  if (roomState === 'recovery_required' && tableState !== 'busted_wait_rebuy') {
    return '等待恢复';
  }

  switch (tableState) {
    case 'busted_wait_rebuy':
      return '等待补码';
    case 'spectating':
      return '观战中';
    case 'seated_wait_next_hand':
      return '下一手加入';
    case 'active_in_hand':
      return '游戏中';
    case 'folded_this_hand':
      return '本手已弃牌';
    case 'all_in_this_hand':
      return 'All-in';
    case 'disconnected':
      return '离线';
    case 'seated_ready':
      return roomState === 'idle' ? '等待开始' : '已入座';
    default:
      return roomState === 'idle' ? '等待开始' : '等待中';
  }
}

export function derivePlayerStateView(player = {}, roomState = 'idle') {
  const tableState = player.tableState || 'spectating';
  const ledger = player.ledger || {};
  const isSpectator = SPECTATOR_STATES.has(tableState);
  const isSeated = SEATED_STATES.has(tableState);

  return {
    tableState,
    roomState,
    statusLabel: mapTableStateToLabel(tableState, roomState),
    canRequestRebuy: !REBUY_BLOCKED_STATES.has(tableState),
    canLeaveSeat: isSeated,
    isSpectator,
    isSeated,
    isWaitingNextHand: tableState === 'seated_wait_next_hand',
    needsRebuy: tableState === 'busted_wait_rebuy',
    netLabel: formatSignedChips(ledger.sessionNet ?? 0),
    stackLabel: (player.chips ?? 0).toLocaleString(),
    totalBuyInLabel: (ledger.totalBuyIn ?? 0).toLocaleString(),
  };
}

export function deriveRoomOccupancy(players = [], roomState = 'idle') {
  const playerViews = players.map((player) => ({
    player,
    view: derivePlayerStateView(player, roomState),
  }));

  return {
    seatedPlayers: playerViews.filter(({ view }) => view.isSeated).map(({ player }) => player),
    spectators: playerViews.filter(({ view }) => view.isSpectator).map(({ player }) => player),
  };
}

export function deriveCanStartGame(currentPlayer, players = [], roomState = 'idle') {
  if (!currentPlayer?.isHost) {
    return false;
  }

  if (roomState !== 'idle') {
    return false;
  }

  const seatedCount = players.filter((player) => derivePlayerStateView(player, roomState).isSeated).length;
  return seatedCount >= 2;
}

export function deriveProActionSummary({ currentPlayer = null, players = [], gameState = null } = {}) {
  if (!currentPlayer || !gameState) {
    return null;
  }

  const toCall = Math.max(0, (Number(gameState.currentBet) || 0) - (Number(currentPlayer.currentBet) || 0));
  const minRaise = Number(gameState.minRaise) || 0;
  const pot = Number(gameState.pot) || 0;

  const liveOpponents = (Array.isArray(players) ? players : []).filter((player) => {
    if (!player || player.id === currentPlayer.id) {
      return false;
    }

    return !player.folded && !player.allIn;
  });

  const highestLiveOpponentStack = liveOpponents.reduce((maxChips, player) => {
    return Math.max(maxChips, Number(player.chips) || 0);
  }, 0);

  return {
    toCall,
    minRaise,
    pot,
    effectiveStack: Math.min(Number(currentPlayer.chips) || 0, highestLiveOpponentStack),
  };
}

export function buildProActionStatRows(summary = null) {
  if (!summary) {
    return [];
  }

  return [
    { label: 'To Call', value: (Number(summary.toCall) || 0).toLocaleString() },
    { label: 'Min Raise', value: (Number(summary.minRaise) || 0).toLocaleString() },
    { label: 'Pot', value: (Number(summary.pot) || 0).toLocaleString() },
    { label: 'Eff', value: (Number(summary.effectiveStack) || 0).toLocaleString() },
  ];
}

function deriveProPositionLabel(player = {}, players = [], gameState = null) {
  const seat = Number(player?.seat);
  if (!Number.isInteger(seat) || seat < 0) {
    return null;
  }

  if (!gameState || gameState.dealerPosition === undefined) {
    return null;
  }

  if (!POSITIONED_HAND_STATES.has(player.tableState || 'spectating')) {
    return null;
  }

  const activeSeats = (Array.isArray(players) ? players : [])
    .filter((candidate) => POSITIONED_HAND_STATES.has(candidate?.tableState || 'spectating'))
    .map((candidate) => Number(candidate.seat))
    .filter((candidateSeat) => Number.isInteger(candidateSeat) && candidateSeat >= 0)
    .sort((left, right) => left - right);

  if (activeSeats.length < 2) {
    return null;
  }

  const dealerPosition = Number(gameState.dealerPosition);
  if (!Number.isInteger(dealerPosition) || dealerPosition < 0) {
    return null;
  }

  if (activeSeats.length === 2) {
    return seat === dealerPosition ? 'SB/BTN' : 'BB';
  }

  if (seat === dealerPosition) {
    return 'BTN';
  }

  const dealerSeatIndex = activeSeats.indexOf(dealerPosition);
  const currentSeatIndex = activeSeats.indexOf(seat);

  if (dealerSeatIndex === -1 || currentSeatIndex === -1) {
    return null;
  }

  const positionFromDealer = (currentSeatIndex - dealerSeatIndex + activeSeats.length) % activeSeats.length;

  if (positionFromDealer === 1) {
    return 'SB';
  }

  if (positionFromDealer === 2) {
    return 'BB';
  }

  if (positionFromDealer === activeSeats.length - 1) {
    return 'CO';
  }

  if (positionFromDealer === activeSeats.length - 2 && activeSeats.length > 6) {
    return 'HJ';
  }

  if (positionFromDealer <= 3) {
    return 'EP';
  }

  return 'MP';
}

export function deriveProPlayerSummary(player = {}, { roomState = 'idle', players = [], gameState = null } = {}) {
  const stateView = derivePlayerStateView(player, roomState);
  const safeSeat = Number(player?.seat);

  return {
    seatLabel: Number.isInteger(safeSeat) && safeSeat >= 0 ? `座${safeSeat + 1}` : null,
    positionLabel: deriveProPositionLabel(player, players, gameState),
    statusLabel: stateView.statusLabel,
    chipsLabel: (Number(player?.chips) || 0).toLocaleString(),
    netLabel: stateView.netLabel,
  };
}

export function deriveTableShellView({
  roomId = null,
  roomState = 'idle',
  roomSettings = null,
  connected = false,
  effectiveDisplayMode = 'pro',
  currentPlayer = null,
} = {}) {
  const roomMode = roomSettings?.roomMode || 'pro';
  const modeMeta = ROOM_MODE_META[roomMode] || ROOM_MODE_META.pro;

  return {
    roomCode: roomId || '------',
    roomState,
    roomStateLabel: mapRoomStateToLabel(roomState),
    connectedLabel: connected ? '服务器已连接' : '服务器未连接',
    modeLabel: modeMeta.label,
    modeTitle: modeMeta.title,
    effectiveDisplayMode,
    pendingJoinBanner: derivePendingJoinBanner(currentPlayer, roomState),
    recoveryBanner: deriveRecoveryBanner(currentPlayer, roomState),
  };
}

export function deriveSeatRingView({
  players = [],
  maxPlayers = 6,
  currentPlayerId = null,
  roomState = 'idle',
  gameState = null,
} = {}) {
  const safePlayers = Array.isArray(players) ? players : [];
  const safeMaxPlayers = Math.max(2, Number(maxPlayers) || 6);

  return Array.from({ length: safeMaxPlayers }, (_, seatIndex) => {
    const player = safePlayers.find((candidate) => Number(candidate?.seat) === seatIndex);

    if (!player) {
      return {
        seatIndex,
        seatLabel: `座${seatIndex + 1}`,
        occupied: false,
        isCurrentPlayer: false,
        statusLabel: '空座',
        positionLabel: null,
        player: null,
      };
    }

    const summary = deriveProPlayerSummary(player, {
      roomState,
      players: safePlayers,
      gameState,
    });

    return {
      seatIndex,
      seatLabel: summary.seatLabel || `座${seatIndex + 1}`,
      occupied: true,
      isCurrentPlayer: player.id === currentPlayerId,
      statusLabel: summary.statusLabel,
      positionLabel: summary.positionLabel,
      chipsLabel: summary.chipsLabel,
      netLabel: summary.netLabel,
      player,
    };
  });
}

export function deriveIntelRailView({
  roomState = 'idle',
  roomSettings = null,
  currentPlayer = null,
  players = [],
} = {}) {
  const safePlayers = Array.isArray(players) ? players : [];
  const occupancy = deriveRoomOccupancy(safePlayers, roomState);
  const safeMaxPlayers = Math.max(2, Number(roomSettings?.maxPlayers) || 6);
  const modeMeta = ROOM_MODE_META[roomSettings?.roomMode || 'pro'] || ROOM_MODE_META.pro;
  const recoveryBanner = deriveRecoveryBanner(currentPlayer, roomState);

  return {
    occupancyLabel: `${safePlayers.length}/${safeMaxPlayers}`,
    seatedCount: occupancy.seatedPlayers.length,
    spectatorCount: occupancy.spectators.length,
    modeTitle: modeMeta.title,
    canStartGame: deriveCanStartGame(currentPlayer, safePlayers, roomState),
    canRecoverRoom: Boolean(recoveryBanner?.canRecover),
    hostActionLabel: recoveryBanner?.actionLabel || (deriveCanStartGame(currentPlayer, safePlayers, roomState) ? '开始游戏' : null),
  };
}

export function deriveRecoveryBanner(currentPlayer = {}, roomState = 'idle') {
  if (roomState !== 'recovery_required') {
    return null;
  }

  const isHost = Boolean(currentPlayer?.isHost);

  return {
    title: '房间状态异常',
    detail: isHost
      ? '牌桌状态异常，请先恢复房间，再重新开始游戏。'
      : '牌桌状态异常，等待房主恢复房间后继续。',
    actionLabel: isHost ? '恢复房间' : null,
    canRecover: isHost,
  };
}

export function derivePendingJoinBanner(player = {}, roomState = 'idle') {
  if ((player?.tableState || 'spectating') !== 'seated_wait_next_hand') {
    return null;
  }

  if (roomState === 'settling') {
    return {
      title: '已入座，等待下一手',
      detail: '本手正在结算，你会在下一手开始时自动收到手牌并参与行动。',
    };
  }

  return {
    title: '已入座，本手观战',
    detail: '你已经占住座位，会在本手结束后自动加入；当前还没有两张底牌，也不会参与本手底池。',
  };
}

export function isPlayerCommittedToCurrentHand(player = {}, roomState = 'idle') {
  if (roomState !== 'in_hand') {
    return false;
  }

  return CURRENT_HAND_STATES.has(player.tableState || 'spectating');
}

export function deriveSeatSelectionNotice(roomState = 'idle', seatIndex = 0) {
  if (roomState === 'in_hand') {
    return {
      channel: 'game-info',
      detail: '当前手牌进行中，入座后会在下一手自动加入',
    };
  }

  if (roomState === 'settling') {
    return {
      channel: 'game-info',
      detail: '本手正在结算，入座后会在下一手自动加入',
    };
  }

  if (roomState === 'recovery_required') {
    return {
      channel: 'game-info',
      detail: '房间状态异常，入座会在牌桌恢复后生效',
    };
  }

  return {
    channel: 'game-success',
    detail: `已选择座位 ${seatIndex + 1}`,
  };
}

export function deriveSeatTakeFeedback(result = {}) {
  if ((result?.tableState || 'spectating') === 'busted_wait_rebuy') {
    return {
      channel: 'game-warning',
      detail: '当前筹码不足，已保留观战状态，请先补码后再入座。',
    };
  }

  return deriveSeatSelectionNotice(result?.roomState || 'idle', result?.seatIndex || 0);
}

export function deriveSeatChangeFeedback(result = {}) {
  const safeSeat = Math.max(0, Number(result?.toSeat) || 0);
  return {
    channel: 'game-success',
    detail: `已换到座位 ${safeSeat + 1}`,
  };
}

export function deriveLeaveSeatFeedback(result = {}) {
  if (result?.forcedFold) {
    return {
      channel: 'game-warning',
      detail: '已离开座位并进入观战模式，本手已自动弃牌。',
    };
  }

  return {
    channel: 'game-info',
    detail: '已离开座位，进入观战模式。',
  };
}

export function deriveLeaveRoomFeedback(result = {}) {
  if (result?.forcedFold) {
    return {
      channel: 'game-warning',
      detail: '已退出房间，本手已自动弃牌。',
    };
  }

  return {
    channel: 'game-info',
    detail: '已退出房间。',
  };
}

export function deriveStartGameFeedback(result = {}) {
  if (result?.handStarted === false && (result?.roomState || 'idle') === 'idle') {
    return {
      channel: 'game-info',
      detail: '当前没有足够的可参战玩家，房间已回到等待开始状态。',
    };
  }

  return null;
}

export function deriveRecoverRoomFeedback(result = {}) {
  if ((result?.roomState || 'idle') === 'idle') {
    return {
      channel: 'game-success',
      detail: '房间已恢复，可以重新开始游戏。',
    };
  }

  return {
    channel: 'game-info',
    detail: '房间恢复请求已完成。',
  };
}

export function deriveRequestErrorFeedback({ scope = 'generic', fallbackPrefix = '操作失败', error = null } = {}) {
  const code = error?.code || null;
  const message = error?.message || '请求未成功，请稍后重试。';
  const normalizedMessage = String(message);

  const mappedByCode = {
    PLAYER_OUT_OF_TURN: {
      channel: 'game-warning',
      detail: '当前不是你的回合，操作未生效。',
    },
    GAME_NOT_STARTED: {
      channel: 'game-warning',
      detail: '当前牌局尚未开始，这个操作没有生效。',
    },
    ROOM_RECOVERY_REQUIRED: {
      channel: 'game-warning',
      detail: '当前牌桌状态异常，请先恢复房间，再重新开始游戏。',
    },
    HOST_ONLY_ACTION: {
      channel: 'game-warning',
      detail: scope === 'startGame' ? '只有房主可以开始游戏。' : '只有房主可以执行这个操作。',
    },
    INVALID_GAME_PHASE: {
      channel: 'game-warning',
      detail: scope === 'revealHand' ? '当前还不能执行这个亮牌选择。' : '当前阶段不能执行这个操作。',
    },
    INVALID_ACTION: {
      channel: 'game-warning',
      detail: '当前操作无效，请等待最新桌面状态后再试。',
    },
    INVALID_BET_AMOUNT: {
      channel: 'game-warning',
      detail: '下注金额无效，请按当前最小加注和筹码范围重新选择。',
    },
    INSUFFICIENT_CHIPS: {
      channel: 'game-warning',
      detail: '当前筹码不足，操作未生效。',
    },
    CANNOT_CHECK: {
      channel: 'game-warning',
      detail: '当前不能过牌，请选择跟注、加注或弃牌。',
    },
    CANNOT_RAISE: {
      channel: 'game-warning',
      detail: '当前不能加注，请检查最小加注和剩余筹码。',
    },
    PLAYER_NOT_IN_ROOM: {
      channel: 'game-error',
      detail: '当前设备已经不在这个房间里，请刷新页面后重试。',
    },
    PLAYER_NOT_FOUND: {
      channel: 'game-error',
      detail: '当前玩家状态已失效，请刷新页面后重试。',
    },
  };

  if (mappedByCode[code]) {
    return mappedByCode[code];
  }

  if (normalizedMessage.includes('设备未注册')) {
    return {
      channel: 'game-warning',
      detail: '当前页面身份已失效，请刷新页面后重试。',
    };
  }

  return {
    channel: 'game-error',
    detail: `${fallbackPrefix}：${normalizedMessage}`,
  };
}

export function deriveLeaveSeatDialog(player = {}, roomState = 'idle', isExitingRoom = false) {
  const normalizedPlayer = player || {};

  if (isPlayerCommittedToCurrentHand(normalizedPlayer, roomState)) {
    return {
      isDangerous: true,
      message: isExitingRoom
        ? '您正在当前手牌中，退出房间将自动弃牌。确认要退出房间吗？'
        : '您正在当前手牌中，离座将自动弃牌。确认要离开座位吗？',
      warning: '注意：此操作将导致您自动弃牌',
    };
  }

  if (normalizedPlayer.tableState === 'seated_wait_next_hand') {
    return {
      isDangerous: false,
      message: isExitingRoom
        ? '您当前未参与本手，确认要退出房间吗？'
        : '您当前未参与本手，确认要离开座位进入观战模式吗？',
      warning: null,
    };
  }

  if (roomState === 'recovery_required') {
    return {
      isDangerous: false,
      message: isExitingRoom
        ? '牌桌正在等待恢复，确认要退出房间吗？'
        : '牌桌正在等待恢复，确认要离开座位进入观战模式吗？',
      warning: null,
    };
  }

  return {
    isDangerous: false,
    message: isExitingRoom ? '确认要退出房间吗？' : '确认要离开座位进入观战模式吗？',
    warning: null,
  };
}
