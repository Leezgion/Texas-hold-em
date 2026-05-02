const RoomManager = require('../../gameLogic/RoomManager');
const { ROOM_STATES } = require('../../types/GameTypes');

function createSocket(id) {
  return {
    id,
    join: jest.fn(),
    leave: jest.fn(),
    emit: jest.fn(),
  };
}

function createIo() {
  return {
    to: jest.fn(() => ({ emit: jest.fn() })),
    sockets: {
      sockets: new Map(),
    },
  };
}

function registerDevice(io, socketDeviceMap, socketId, deviceId) {
  socketDeviceMap.set(socketId, deviceId);
  const socket = createSocket(socketId);
  io.sockets.sockets.set(socketId, socket);
  return socket;
}

function createRoomWithPlayers({ maxPlayers = 6, seatedPlayers = maxPlayers, settleMs = 10 } = {}) {
  const io = createIo();
  const gameRooms = new Map();
  const socketDeviceMap = new Map();
  const roomManager = new RoomManager(io, gameRooms, socketDeviceMap);
  roomManager.startGameTimer = jest.fn();

  const hostSocket = registerDevice(io, socketDeviceMap, 'socket-host', 'device-host');
  const roomId = roomManager.createRoom(hostSocket, {
    duration: 60,
    maxPlayers,
    allinDealCount: 1,
    settleMs,
  });

  for (let seat = 1; seat < seatedPlayers; seat += 1) {
    const deviceId = `device-p${seat + 1}`;
    const socketId = `socket-p${seat + 1}`;
    const socket = registerDevice(io, socketDeviceMap, socketId, deviceId);
    roomManager.joinRoom(socket, roomId, deviceId, `P${seat + 1}`);
  }

  const room = gameRooms.get(roomId);
  return { io, gameRooms, socketDeviceMap, roomManager, room };
}

function createSixPlayerRoom(options = {}) {
  return createRoomWithPlayers({ ...options, maxPlayers: 6, seatedPlayers: 6 });
}

function getPlayerAtSeat(room, seat) {
  return room.players.find((player) => player.seat === seat);
}

function playFoldOnlyHand(roomManager, room) {
  const actedPlayerIds = [];

  while (room.roomState !== ROOM_STATES.SETTLING) {
    const currentPlayerId = room.gameLogic.getGameState().currentPlayerId;
    if (!currentPlayerId) {
      throw new Error('Expected a current player while the hand is still running');
    }

    roomManager.handlePlayerAction(currentPlayerId, 'fold');
    actedPlayerIds.push(currentPlayerId);

    expect(room.gameLogic.sidePots).toEqual([]);
  }

  return actedPlayerIds;
}

function putHostInNonFullAllInCallOnlySpot(roomManager, room) {
  roomManager.handleRebuyRequest('device-host', 2000);
  roomManager.handleRebuyRequest('device-p3', 2000);
  roomManager.startGame(room.id, 'device-host');

  roomManager.handlePlayerAction('device-host', 'raise', 600);
  roomManager.handlePlayerAction('device-p2', 'allin');
  roomManager.handlePlayerAction('device-p3', 'call');

  expect(room.gameLogic.getGameState().currentPlayerId).toBe('device-host');
  expect(room.gameLogic.getGameState().currentPlayerActionMode).toBe('call_only');
}

describe('Gameplay smoke regression', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('returns authoritative action metadata after accepting a player action', () => {
    const { roomManager, room } = createSixPlayerRoom({ settleMs: 10 });

    roomManager.startGame(room.id, 'device-host');

    const currentPlayerId = room.gameLogic.getGameState().currentPlayerId;
    const result = roomManager.handlePlayerAction(currentPlayerId, 'fold');

    expect(result).toEqual({
      roomId: room.id,
      roomState: room.roomState,
      action: 'fold',
      amount: 0,
    });
  });

  it('plays three six-player hands without seat drift or phantom side pots', () => {
    const { roomManager, room } = createSixPlayerRoom({ settleMs: 10 });

    roomManager.startGame(room.id, 'device-host');

    const initialSeatMap = room.players
      .map((player) => [player.id, player.seat])
      .sort(([leftId], [rightId]) => leftId.localeCompare(rightId));

    for (let completedHands = 1; completedHands <= 3; completedHands += 1) {
      const actedPlayerIds = playFoldOnlyHand(roomManager, room);

      expect(actedPlayerIds).toHaveLength(5);
      expect(room.roomState).toBe(ROOM_STATES.SETTLING);
      expect(room.gameLogic.sidePots).toEqual([]);
      expect(room.gameLogic.handHistory).toHaveLength(completedHands);
      expect(room.players.reduce((sum, player) => sum + player.chips, 0)).toBe(6000);
      expect(room.players.every((player) => player.seat !== -1)).toBe(true);
      expect(
        room.players
          .map((player) => [player.id, player.seat])
          .sort(([leftId], [rightId]) => leftId.localeCompare(rightId))
      ).toEqual(initialSeatMap);

      jest.advanceTimersByTime(10);

      expect(room.roomState).toBe(ROOM_STATES.IN_HAND);
      expect(room.gameLogic.handNumber).toBe(completedHands + 1);
      expect(room.gameLogic.sidePots).toEqual([]);
    }
  });

  it('plays heads-up with button-small-blind action order and one-screen table cap semantics', () => {
    const { io, socketDeviceMap, roomManager, room } = createRoomWithPlayers({
      maxPlayers: 2,
      seatedPlayers: 2,
      settleMs: 10,
    });
    const spectatorSocket = registerDevice(io, socketDeviceMap, 'socket-spectator', 'device-spectator');

    roomManager.joinRoom(spectatorSocket, room.id, 'device-spectator', 'Spectator');
    roomManager.startGame(room.id, 'device-host');

    const spectator = room.players.find((player) => player.id === 'device-spectator');
    expect(spectator.seat).toBe(-1);
    expect(spectator.chips).toBe(0);
    expect(spectator.inHand).toBe(false);

    const host = getPlayerAtSeat(room, 0);
    const guest = getPlayerAtSeat(room, 1);
    expect(room.gameLogic.dealerIndex).toBe(room.players.indexOf(host));
    expect(room.gameLogic.smallBlindIndex).toBe(room.players.indexOf(host));
    expect(room.gameLogic.bigBlindIndex).toBe(room.players.indexOf(guest));
    expect(room.gameLogic.getGameState().currentPlayerId).toBe(host.id);

    const firstHandActors = playFoldOnlyHand(roomManager, room);
    expect(firstHandActors).toEqual([host.id]);
    expect(room.roomState).toBe(ROOM_STATES.SETTLING);
    expect(room.players.reduce((sum, player) => sum + player.chips, 0)).toBe(2000);

    jest.advanceTimersByTime(10);

    expect(room.roomState).toBe(ROOM_STATES.IN_HAND);
    expect(room.gameLogic.dealerIndex).toBe(room.players.indexOf(guest));
    expect(room.gameLogic.smallBlindIndex).toBe(room.players.indexOf(guest));
    expect(room.gameLogic.bigBlindIndex).toBe(room.players.indexOf(host));
    expect(room.gameLogic.getGameState().currentPlayerId).toBe(guest.id);
    expect(spectator.inHand).toBe(false);
  });

  it('starts and settles a full nine-player table without seat drift or phantom side pots', () => {
    const { roomManager, room } = createRoomWithPlayers({
      maxPlayers: 9,
      seatedPlayers: 9,
      settleMs: 10,
    });

    roomManager.startGame(room.id, 'device-host');

    const initialSeatMap = room.players
      .map((player) => [player.id, player.seat])
      .sort(([leftId], [rightId]) => leftId.localeCompare(rightId));
    const dealer = getPlayerAtSeat(room, 0);
    const smallBlind = getPlayerAtSeat(room, 1);
    const bigBlind = getPlayerAtSeat(room, 2);
    const underTheGun = getPlayerAtSeat(room, 3);

    expect(room.players.filter((player) => player.inHand)).toHaveLength(9);
    expect(room.players.every((player) => player.hand.length === 2)).toBe(true);
    expect(room.gameLogic.dealerIndex).toBe(room.players.indexOf(dealer));
    expect(room.gameLogic.smallBlindIndex).toBe(room.players.indexOf(smallBlind));
    expect(room.gameLogic.bigBlindIndex).toBe(room.players.indexOf(bigBlind));
    expect(room.gameLogic.getGameState().currentPlayerId).toBe(underTheGun.id);

    const actedPlayerIds = playFoldOnlyHand(roomManager, room);

    expect(actedPlayerIds).toHaveLength(8);
    expect(room.roomState).toBe(ROOM_STATES.SETTLING);
    expect(room.gameLogic.sidePots).toEqual([]);
    expect(room.players.reduce((sum, player) => sum + player.chips, 0)).toBe(9000);
    expect(
      room.players
        .map((player) => [player.id, player.seat])
        .sort(([leftId], [rightId]) => leftId.localeCompare(rightId))
    ).toEqual(initialSeatMap);
  });

  it('reopens raises when an all-in shove is a complete raise', () => {
    const { roomManager, room } = createRoomWithPlayers({
      maxPlayers: 4,
      seatedPlayers: 4,
      settleMs: 10,
    });

    const host = getPlayerAtSeat(room, 0);
    const smallBlind = getPlayerAtSeat(room, 1);
    const bigBlind = getPlayerAtSeat(room, 2);
    const underTheGun = getPlayerAtSeat(room, 3);
    smallBlind.chips = 230;

    roomManager.startGame(room.id, host.id);

    expect(room.gameLogic.getGameState().currentPlayerId).toBe(underTheGun.id);

    roomManager.handlePlayerAction(underTheGun.id, 'raise', 100);
    roomManager.handlePlayerAction(host.id, 'call');
    roomManager.handlePlayerAction(smallBlind.id, 'allin');

    expect(room.gameLogic.getGameState().currentBet).toBe(230);
    expect(room.gameLogic.getGameState().minRaise).toBe(110);
    expect(room.gameLogic.getGameState().currentPlayerId).toBe(bigBlind.id);

    roomManager.handlePlayerAction(bigBlind.id, 'call');

    expect(room.gameLogic.getGameState().currentPlayerId).toBe(underTheGun.id);
    expect(room.gameLogic.getGameState().currentPlayerActionMode).toBe('open');
    expect(() => roomManager.handlePlayerAction(underTheGun.id, 'raise', 110)).not.toThrow();
    expect(room.gameLogic.getGameState().currentBet).toBe(340);
    expect(room.gameLogic.getGameState().currentPlayerId).toBe(host.id);
  });

  it('returns action to the opener to call a non-full all-in raise without reopening raises', () => {
    const { roomManager, room } = createRoomWithPlayers({
      maxPlayers: 3,
      seatedPlayers: 3,
      settleMs: 10,
    });

    putHostInNonFullAllInCallOnlySpot(roomManager, room);

    expect(room.gameLogic.getGameState().currentBet).toBe(1000);
    expect(room.gameLogic.getGameState().minRaise).toBe(600);

    expect(room.roomState).toBe(ROOM_STATES.IN_HAND);
    expect(room.gameLogic.getGameState().currentPlayerId).toBe('device-host');
    expect(room.gameLogic.getGameState().currentPlayerActionMode).toBe('call_only');
    expect(room.gameLogic.getGameState().currentBet).toBe(1000);
    expect(() => roomManager.handlePlayerAction('device-host', 'raise', 600)).toThrow('当前只能跟注或弃牌');

    roomManager.handlePlayerAction('device-host', 'call');

    expect(room.roomState).toBe(ROOM_STATES.IN_HAND);
    expect(room.gameLogic.getGameState().phase).toBe('flop');
    expect(room.gameLogic.getGameState().currentBet).toBe(0);

    while (room.roomState !== ROOM_STATES.SETTLING) {
      const { currentPlayerId } = room.gameLogic.getGameState();
      expect(currentPlayerId).toBeTruthy();
      roomManager.handlePlayerAction(currentPlayerId, 'check');
    }

    expect(room.roomState).toBe(ROOM_STATES.SETTLING);
    expect(
      room.gameLogic.handHistory
        .at(-1)
        .actionsByStreet.preflop.map((action) => [action.playerId, action.action, action.amount])
    ).toEqual([
      ['device-host', 'raise', 600],
      ['device-p2', 'allin', 990],
      ['device-p3', 'call', 980],
      ['device-host', 'call', 380],
    ]);
    expect(room.gameLogic.handHistory.at(-1).totalPot).toBe(3000);
  });

  it('auto-folds a call-only current player on timeout and records the forced decision', () => {
    const { roomManager, room } = createRoomWithPlayers({
      maxPlayers: 3,
      seatedPlayers: 3,
      settleMs: 10,
    });

    putHostInNonFullAllInCallOnlySpot(roomManager, room);

    jest.advanceTimersByTime(room.gameLogic.actionTimeLimit * 1000);

    expect(room.roomState).toBe(ROOM_STATES.SETTLING);
    expect(room.gameLogic.handHistory.at(-1).actionsByStreet.preflop.at(-1)).toEqual(
      expect.objectContaining({
        playerId: 'device-host',
        action: 'fold',
        amount: 0,
        auto: true,
        reason: 'timeout',
      })
    );
  });

  it('force-folds a disconnected call-only current player and records the disconnect reason', () => {
    const { roomManager, room } = createRoomWithPlayers({
      maxPlayers: 3,
      seatedPlayers: 3,
      settleMs: 10,
    });

    putHostInNonFullAllInCallOnlySpot(roomManager, room);

    roomManager.handlePlayerDisconnect('device-host');

    expect(room.roomState).toBe(ROOM_STATES.SETTLING);
    expect(room.gameLogic.handHistory.at(-1).actionsByStreet.preflop.at(-1)).toEqual(
      expect.objectContaining({
        playerId: 'device-host',
        action: 'fold',
        amount: 0,
        auto: true,
        reason: 'disconnect',
      })
    );
  });
});
