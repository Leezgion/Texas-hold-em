import { formatSignedChips } from './gameViewModel.js';

function getPlayerName(record, playerId) {
  return record.players?.find((player) => player.id === playerId)?.nickname || playerId;
}

function formatRevealLine(reveal) {
  const name = reveal.nickname || reveal.playerId;
  if ((reveal.reveal || reveal.mode) === 'show_one') {
    return `${name} 亮牌 ${reveal.cards?.join(' ') || ''}`.trim();
  }
  if ((reveal.reveal || reveal.mode) === 'show_all') {
    return `${name} 全亮 ${reveal.cards?.join(' ') || ''}`.trim();
  }
  return `${name} 盖牌`;
}

function formatWinnerLine(winner) {
  const potType = winner.potType === 'main' ? '主池' : winner.potType === 'side' ? '边池' : '底池';
  const amount = winner.amount ?? winner.winnings ?? 0;
  return `${winner.nickname || winner.playerId} 赢得${potType} ${formatSignedChips(amount)}`;
}

function buildChipDeltaLines(record) {
  return Object.entries(record.chipDeltas || {})
    .filter(([, delta]) => delta !== 0)
    .map(([playerId, delta]) => `${getPlayerName(record, playerId)} 净赢亏 ${formatSignedChips(delta)}`);
}

export function buildHandSummary(record) {
  const winnerLines = (record.winners || []).map(formatWinnerLine);
  const revealLines = (record.reveals || [])
    .filter((reveal) => (reveal.reveal || reveal.mode) !== 'hide')
    .map(formatRevealLine);
  const chipDeltaLines = buildChipDeltaLines(record);

  return {
    handNumber: record.handNumber,
    title: `第 ${record.handNumber} 手`,
    communityCards: record.communityCards || [],
    reason: record.reason || null,
    lines: [...winnerLines, ...revealLines, ...chipDeltaLines],
  };
}

export function buildHandHistoryView(records = []) {
  return [...records]
    .sort((left, right) => (right.handNumber || 0) - (left.handNumber || 0))
    .map(buildHandSummary);
}

export function getLatestHandSummary(records = []) {
  return buildHandHistoryView(records)[0] || null;
}
