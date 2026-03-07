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

export function formatSignedChips(value = 0) {
  const normalized = Number(value) || 0;
  if (normalized === 0) {
    return '0';
  }

  const prefix = normalized > 0 ? '+' : '-';
  return `${prefix}${Math.abs(normalized).toLocaleString()}`;
}

export function mapTableStateToLabel(tableState, roomState = 'idle') {
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

  const currentPlayerView = derivePlayerStateView(currentPlayer, roomState);
  if (!currentPlayerView.isSeated || roomState !== 'idle') {
    return false;
  }

  const seatedCount = players.filter((player) => derivePlayerStateView(player, roomState).isSeated).length;
  return seatedCount >= 2;
}
