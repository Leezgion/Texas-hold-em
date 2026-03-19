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

function createManagerWithDefaults(roomDefaults = {}) {
  const io = createIo();
  const gameRooms = new Map();
  const socketDeviceMap = new Map();
  const roomManager = new RoomManager(io, gameRooms, socketDeviceMap, { roomDefaults });

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

  it('applies configured default settleMs when the room creator does not provide one', () => {
    const { io, gameRooms, socketDeviceMap, roomManager } = createManagerWithDefaults({
      settleMs: 8000,
    });
    const hostSocket = registerDevice(io, socketDeviceMap, 'socket-host', 'device-host');

    const roomId = roomManager.createRoom(hostSocket, {
      duration: 60,
      maxPlayers: 6,
      allinDealCount: 1,
    });

    const room = gameRooms.get(roomId);
    expect(room.settings.settleMs).toBe(8000);
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

  it('allows the host to start from spectator mode without joining the hand', () => {
    jest.useFakeTimers();
    try {
      const { io, gameRooms, socketDeviceMap, roomManager } = createManager();
      const hostSocket = registerDevice(io, socketDeviceMap, 'socket-host', 'device-host');
      const guestSocket = registerDevice(io, socketDeviceMap, 'socket-guest', 'device-guest');
      const thirdSocket = registerDevice(io, socketDeviceMap, 'socket-third', 'device-third');

      roomManager.startGameTimer = jest.fn();

      const roomId = roomManager.createRoom(hostSocket, {
        duration: 60,
        maxPlayers: 6,
        allinDealCount: 1,
      });

      roomManager.joinRoom(guestSocket, roomId, 'device-guest', 'Guest');
      roomManager.joinRoom(thirdSocket, roomId, 'device-third', 'Third');
      roomManager.handleLeaveSeat('device-host');

      const room = gameRooms.get(roomId);
      const host = room.players.find((player) => player.id === 'device-host');

      expect(host.tableState).toBe(TABLE_STATES.SPECTATING);
      expect(host.seat).toBe(-1);

      expect(() => roomManager.startGame(roomId, 'device-host')).not.toThrow();

      expect(room.gameStarted).toBe(true);
      expect(host.inHand).toBe(false);
      expect(host.hand).toEqual([]);
      expect(host.tableState).toBe(TABLE_STATES.SPECTATING);
      expect(room.players.filter((player) => player.inHand)).toHaveLength(2);
    } finally {
      jest.clearAllTimers();
      jest.useRealTimers();
    }
  });

  it('returns the room to a clean idle state when the next hand cannot start', () => {
    jest.useFakeTimers();
    try {
      const { io, gameRooms, socketDeviceMap, roomManager } = createManager();
      const hostSocket = registerDevice(io, socketDeviceMap, 'socket-host', 'device-host');
      const guestSocket = registerDevice(io, socketDeviceMap, 'socket-guest', 'device-guest');
      const thirdSocket = registerDevice(io, socketDeviceMap, 'socket-third', 'device-third');

      roomManager.startGameTimer = jest.fn();

      const roomId = roomManager.createRoom(hostSocket, {
        duration: 60,
        maxPlayers: 6,
        allinDealCount: 1,
      });

      roomManager.joinRoom(guestSocket, roomId, 'device-guest', 'Guest');
      roomManager.joinRoom(thirdSocket, roomId, 'device-third', 'Third');
      roomManager.handleLeaveSeat('device-host');
      roomManager.startGame(roomId, 'device-host');

      const room = gameRooms.get(roomId);
      room.startTime = Date.now();
      room.timer = setInterval(() => {}, 1000);
      room.players[1].chips = 2000;
      room.players[2].chips = 0;
      room.players[2].seat = -1;
      room.players[2].isSpectator = true;
      room.players[2].needsRebuy = true;

      room.gameLogic.startNewHand();

      expect(room.roomState).toBe(ROOM_STATES.IDLE);
      expect(room.gameStarted).toBe(false);
      expect(room.startTime).toBeNull();
      expect(room.timer).toBeNull();
      expect(roomManager.roomRequiresRecovery(room)).toBe(false);
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

  it('rejects recoverRoom from a non-host player', () => {
    const { io, gameRooms, socketDeviceMap, roomManager } = createManager();
    const hostSocket = registerDevice(io, socketDeviceMap, 'socket-host', 'device-host');
    const guestSocket = registerDevice(io, socketDeviceMap, 'socket-guest', 'device-guest');

    const roomId = roomManager.createRoom(hostSocket, {
      duration: 60,
      maxPlayers: 6,
      allinDealCount: 1,
    });

    roomManager.joinRoom(guestSocket, roomId, 'device-guest', 'Guest');

    const room = gameRooms.get(roomId);
    room.roomState = ROOM_STATES.RECOVERY_REQUIRED;

    expect(() => roomManager.recoverRoom(roomId, 'device-guest')).toThrow('只有房主可以恢复房间');
  });

  it('recovers dirty rooms back to idle and allows the host to restart', () => {
    jest.useFakeTimers();
    try {
      const { io, gameRooms, socketDeviceMap, roomManager } = createManager();
      const hostSocket = registerDevice(io, socketDeviceMap, 'socket-host', 'device-host');
      const guestSocket = registerDevice(io, socketDeviceMap, 'socket-guest', 'device-guest');

      roomManager.startGameTimer = jest.fn();

      const roomId = roomManager.createRoom(hostSocket, {
        duration: 60,
        maxPlayers: 6,
        allinDealCount: 1,
      });

      roomManager.joinRoom(guestSocket, roomId, 'device-guest', 'Guest');

      const room = gameRooms.get(roomId);
      const dirtyGameLogic = {
        clearPlayerTimer: jest.fn(),
        clearNextHandTimeout: jest.fn(),
        clearSettlementState: jest.fn(),
        getGameState: () => ({
          phase: GAME_PHASES.WAITING,
          currentPlayerId: null,
        }),
        isGameInProgress: () => false,
      };

      room.gameStarted = true;
      room.roomState = ROOM_STATES.RECOVERY_REQUIRED;
      room.startTime = Date.now();
      room.timer = setInterval(() => {}, 1000);
      room.gameLogic = dirtyGameLogic;

      room.players[0].inHand = true;
      room.players[0].currentBet = 50;
      room.players[0].totalBet = 50;
      room.players[0].hand = ['AS', 'KH'];
      room.players[0].lastAction = { action: 'raise' };

      room.players[1].waitingForNextRound = true;
      room.players[1].folded = true;
      room.players[1].allIn = true;
      room.players[1].currentBet = 100;
      room.players[1].totalBet = 100;
      room.players[1].hand = ['QC', 'QD'];

      roomManager.recoverRoom(roomId, 'device-host');

      expect(dirtyGameLogic.clearPlayerTimer).toHaveBeenCalled();
      expect(dirtyGameLogic.clearNextHandTimeout).toHaveBeenCalled();
      expect(dirtyGameLogic.clearSettlementState).toHaveBeenCalled();
      expect(room.gameStarted).toBe(false);
      expect(room.roomState).toBe(ROOM_STATES.IDLE);
      expect(room.gameLogic).toBeNull();
      expect(room.startTime).toBeNull();
      expect(room.timer).toBeNull();

      room.players.forEach((player) => {
        expect(player.inHand).toBe(false);
        expect(player.waitingForNextRound).toBe(false);
        expect(player.folded).toBe(false);
        expect(player.allIn).toBe(false);
        expect(player.currentBet).toBe(0);
        expect(player.totalBet).toBe(0);
        expect(player.hand).toEqual([]);
        expect(player.tableState).toBe(TABLE_STATES.SEATED_READY);
      });

      expect(() => roomManager.startGame(roomId, 'device-host')).not.toThrow();
      expect(room.gameStarted).toBe(true);
    } finally {
      jest.clearAllTimers();
      jest.useRealTimers();
    }
  });

  it('rejects recoverRoom when the room is not dirty', () => {
    const { io, socketDeviceMap, roomManager } = createManager();
    const hostSocket = registerDevice(io, socketDeviceMap, 'socket-host', 'device-host');

    const roomId = roomManager.createRoom(hostSocket, {
      duration: 60,
      maxPlayers: 6,
      allinDealCount: 1,
    });

    expect(() => roomManager.recoverRoom(roomId, 'device-host')).toThrow('房间当前不需要恢复');
  });
});

