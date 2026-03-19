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

function createSixPlayerRoom({ settleMs = 10 } = {}) {
  const io = createIo();
  const gameRooms = new Map();
  const socketDeviceMap = new Map();
  const roomManager = new RoomManager(io, gameRooms, socketDeviceMap);
  roomManager.startGameTimer = jest.fn();

  const hostSocket = registerDevice(io, socketDeviceMap, 'socket-host', 'device-host');
  const roomId = roomManager.createRoom(hostSocket, {
    duration: 60,
    maxPlayers: 6,
    allinDealCount: 1,
    settleMs,
  });

  for (let seat = 1; seat < 6; seat += 1) {
    const deviceId = `device-p${seat + 1}`;
    const socketId = `socket-p${seat + 1}`;
    const socket = registerDevice(io, socketDeviceMap, socketId, deviceId);
    roomManager.joinRoom(socket, roomId, deviceId, `P${seat + 1}`);
  }

  const room = gameRooms.get(roomId);
  return { io, gameRooms, socketDeviceMap, roomManager, room };
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
});
