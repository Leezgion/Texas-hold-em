const RoomManager = require('../../gameLogic/RoomManager');
const { GAME_PHASES, ROOM_STATES, TABLE_STATES } = require('../../types/GameTypes');

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

function createManager() {
  const io = createIo();
  const gameRooms = new Map();
  const socketDeviceMap = new Map();
  const roomManager = new RoomManager(io, gameRooms, socketDeviceMap);

  return { io, gameRooms, socketDeviceMap, roomManager };
}

function registerDevice(io, socketDeviceMap, socketId, deviceId) {
  socketDeviceMap.set(socketId, deviceId);
  const socket = createSocket(socketId);
  io.sockets.sockets.set(socketId, socket);
  return socket;
}

describe('RoomManager state vocabularies', () => {
  it('creates rooms in the idle state and marks the host as seated_ready', () => {
    const { io, gameRooms, socketDeviceMap, roomManager } = createManager();
    const hostSocket = registerDevice(io, socketDeviceMap, 'socket-host', 'device-host');

    const roomId = roomManager.createRoom(hostSocket, {
      duration: 60,
      maxPlayers: 6,
      allinDealCount: 1,
    });

    const room = gameRooms.get(roomId);
    expect(room.roomState).toBe(ROOM_STATES.IDLE);
    expect(room.players[0].tableState).toBe(TABLE_STATES.SEATED_READY);

    const roomState = roomManager.getRoomState(room, 'device-host');
    expect(roomState.roomState).toBe(ROOM_STATES.IDLE);
    expect(roomState.players[0].tableState).toBe(TABLE_STATES.SEATED_READY);
  });

  it('marks a mid-hand join with an open seat as seated_wait_next_hand', () => {
    const { io, gameRooms, socketDeviceMap, roomManager } = createManager();
    const hostSocket = registerDevice(io, socketDeviceMap, 'socket-host', 'device-host');
    const guestSocket = registerDevice(io, socketDeviceMap, 'socket-guest', 'device-guest');
    const lateSocket = registerDevice(io, socketDeviceMap, 'socket-late', 'device-late');

    const roomId = roomManager.createRoom(hostSocket, {
      duration: 60,
      maxPlayers: 3,
      allinDealCount: 1,
    });

    roomManager.joinRoom(guestSocket, roomId, 'device-guest', 'Guest');

    const room = gameRooms.get(roomId);
    room.gameStarted = true;
    room.gameLogic = {
      isGameInProgress: () => true,
      getGameState: () => ({ phase: 'preflop' }),
    };

    roomManager.joinRoom(lateSocket, roomId, 'device-late', 'Late');

    const latePlayer = room.players.find((player) => player.id === 'device-late');
    expect(latePlayer.seat).toBe(2);
    expect(latePlayer.tableState).toBe(TABLE_STATES.SEATED_WAIT_NEXT_HAND);

    const roomState = roomManager.getRoomState(room, 'device-late');
    const projectedLatePlayer = roomState.players.find((player) => player.id === 'device-late');
    expect(roomState.roomState).toBe(ROOM_STATES.IN_HAND);
    expect(projectedLatePlayer.tableState).toBe(TABLE_STATES.SEATED_WAIT_NEXT_HAND);
  });

  it('rejects startGame from a non-host player', () => {
    jest.useFakeTimers();
    try {
      const { io, socketDeviceMap, roomManager } = createManager();
      const hostSocket = registerDevice(io, socketDeviceMap, 'socket-host', 'device-host');
      const guestSocket = registerDevice(io, socketDeviceMap, 'socket-guest', 'device-guest');

      roomManager.startGameTimer = jest.fn();

      const roomId = roomManager.createRoom(hostSocket, {
        duration: 60,
        maxPlayers: 6,
        allinDealCount: 1,
      });

      roomManager.joinRoom(guestSocket, roomId, 'device-guest', 'Guest');

      expect(() => roomManager.startGame(roomId, 'device-guest')).toThrow('只有房主可以开始游戏');
    } finally {
      jest.clearAllTimers();
      jest.useRealTimers();
    }
  });

  it('marks dirty rooms as recovery_required instead of silently no-oping', () => {
    const { io, gameRooms, socketDeviceMap, roomManager } = createManager();
    const hostSocket = registerDevice(io, socketDeviceMap, 'socket-host', 'device-host');

    const roomId = roomManager.createRoom(hostSocket, {
      duration: 60,
      maxPlayers: 6,
      allinDealCount: 1,
    });

    const room = gameRooms.get(roomId);
    room.gameStarted = true;
    room.gameLogic = {
      isGameInProgress: () => false,
      getGameState: () => ({
        phase: GAME_PHASES.WAITING,
        currentPlayerId: null,
      }),
    };

    expect(() => roomManager.startGame(roomId, 'device-host')).toThrow('房间状态异常，需要恢复');
    expect(room.roomState).toBe(ROOM_STATES.RECOVERY_REQUIRED);
    expect(roomManager.getRoomState(room, 'device-host').roomState).toBe(ROOM_STATES.RECOVERY_REQUIRED);
  });
});
