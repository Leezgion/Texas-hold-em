const { GAME_PHASES } = require('../types/GameTypes');

const STREET_ORDER = [
  GAME_PHASES.PREFLOP,
  GAME_PHASES.FLOP,
  GAME_PHASES.TURN,
  GAME_PHASES.RIVER,
  GAME_PHASES.SHOWDOWN,
];

function cloneCard(card) {
  return card ? { ...card } : card;
}

function clonePot(pot) {
  return {
    ...pot,
    eligiblePlayers: [...(pot.eligiblePlayers || [])],
  };
}

function clonePlayerLedger(ledger) {
  return ledger ? { ...ledger } : null;
}

function clonePlayerSnapshot(player) {
  return {
    id: player.id,
    nickname: player.nickname,
    chips: player.chips,
    seat: player.seat ?? -1,
    tableState: player.tableState ?? null,
    ledger: clonePlayerLedger(player.ledger),
  };
}

function cloneAction(action) {
  return { ...action };
}

function cloneBoardResult(boardResult) {
  return {
    round: boardResult.round,
    communityCards: (boardResult.communityCards || []).map(cloneCard),
    winners: (boardResult.winners || []).map((winner) => ({ ...winner })),
  };
}

function buildEmptyStreetBuckets() {
  return STREET_ORDER.reduce((accumulator, street) => {
    accumulator[street] = [];
    return accumulator;
  }, {});
}

function buildActionsByStreet(actions = []) {
  const grouped = buildEmptyStreetBuckets();

  actions.forEach((action) => {
    const street = STREET_ORDER.includes(action.street) ? action.street : GAME_PHASES.PREFLOP;
    grouped[street].push(cloneAction(action));
  });

  return grouped;
}

function buildChipDeltas(players = []) {
  return players.reduce((accumulator, player) => {
    const handStartChips = player.ledger?.handStartChips ?? player.chips;
    accumulator[player.id] = player.chips - handStartChips;
    return accumulator;
  }, {});
}

function buildReveals(players = []) {
  return players.map((player) => ({
    playerId: player.id,
    nickname: player.nickname,
    reveal: player.revealMode || (player.showHand ? 'show_all' : 'hide'),
    cards:
      player.showHand && player.revealMode === 'show_one'
        ? (player.hand || []).filter((_, index) => (player.revealedCardIndices || []).includes(index)).map(cloneCard)
        : player.showHand
        ? (player.hand || []).map(cloneCard)
        : [],
  }));
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
    return value;
  }

  Object.freeze(value);
  Object.getOwnPropertyNames(value).forEach((key) => {
    deepFreeze(value[key]);
  });

  return value;
}

function buildHandRecord(snapshot) {
  const record = {
    handNumber: snapshot.handNumber,
    startedAt: snapshot.startedAt ?? null,
    endedAt: snapshot.endedAt ?? null,
    totalPot: snapshot.totalPot ?? 0,
    reason: snapshot.reason ?? null,
    communityCards: (snapshot.communityCards || []).map(cloneCard),
    players: (snapshot.players || []).map(clonePlayerSnapshot),
    actions: (snapshot.actions || []).map(cloneAction),
    actionsByStreet: buildActionsByStreet(snapshot.actions),
    pots: (snapshot.pots || []).map(clonePot),
    winners: (snapshot.winners || []).map((winner) => ({ ...winner })),
    chipDeltas: snapshot.chipDeltas ? { ...snapshot.chipDeltas } : buildChipDeltas(snapshot.players),
    reveals: snapshot.reveals ? snapshot.reveals.map((reveal) => ({ ...reveal })) : buildReveals(snapshot.players),
    boardResults: (snapshot.boardResults || []).map(cloneBoardResult),
  };

  return deepFreeze(record);
}

module.exports = {
  buildHandRecord,
};
