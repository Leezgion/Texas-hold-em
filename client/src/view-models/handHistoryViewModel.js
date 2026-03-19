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

function formatPotTypeLabel(potResult, index) {
  if ((potResult.potType || '').toLowerCase() === 'main' || potResult.potId === 0) {
    return '主池';
  }

  return `边池 ${index}`;
}

function formatPotWinnerShare(winner) {
  return `${winner.nickname || winner.playerId} ${formatSignedChips(winner.amount ?? 0)}`;
}

function buildPotResultLines(record) {
  let sideIndex = 1;

  return (record.potResults || []).map((potResult) => {
    const label = formatPotTypeLabel(potResult, sideIndex);
    if (label.startsWith('边池')) {
      sideIndex += 1;
    }

    const winners = potResult.winners || [];
    const winnerSummary = winners.map(formatPotWinnerShare).join('、');
    const splitLabel = winners.length > 1 ? ' 平分' : '';
    return `${label} ${formatSignedChips(potResult.amount ?? 0)}${splitLabel}: ${winnerSummary}`.trim();
  });
}

function buildChipDeltaLines(record) {
  return Object.entries(record.chipDeltas || {})
    .filter(([, delta]) => delta !== 0)
    .map(([playerId, delta]) => `${getPlayerName(record, playerId)} 净赢亏 ${formatSignedChips(delta)}`);
}

export function buildHandSummary(record) {
  const potLines = buildPotResultLines(record);
  const winnerLines = potLines.length > 0 ? potLines : (record.winners || []).map(formatWinnerLine);
  const revealLines = (record.reveals || [])
    .filter((reveal) => (reveal.reveal || reveal.mode) !== 'hide')
    .map(formatRevealLine);
  const chipDeltaLines = buildChipDeltaLines(record);
  const totalLine = Number.isFinite(record.totalPot) && record.totalPot > 0 ? `总池 ${formatSignedChips(record.totalPot)}` : null;

  return {
    handNumber: record.handNumber,
    title: `第 ${record.handNumber} 手`,
    communityCards: record.communityCards || [],
    reason: record.reason || null,
    lines: [totalLine, ...winnerLines, ...revealLines, ...chipDeltaLines].filter(Boolean),
  };
}

export function buildTablePotSummary(gameState) {
  const totalPot = Number(gameState?.pot) || 0;
  const sidePots = Array.isArray(gameState?.sidePots) ? gameState.sidePots : [];
  const items = [
    {
      label: sidePots.length > 0 ? '总池' : '底池',
      amount: totalPot,
      detail: sidePots.length > 0 ? `含 ${sidePots.length} 个附加层级` : null,
    },
  ];

  let sideIndex = 1;
  sidePots.forEach((pot) => {
    const eligibleCount = pot.eligiblePlayers?.length || 0;

    if (eligibleCount <= 1) {
      items.push({
        label: '待匹配差额',
        amount: pot.amount || 0,
        detail: '仍需其他玩家补齐',
      });
      return;
    }

    items.push({
      label: `边池 ${sideIndex}`,
      amount: pot.amount || 0,
      detail: `${eligibleCount}人争夺`,
    });
    sideIndex += 1;
  });

  return {
    totalPot,
    items,
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
