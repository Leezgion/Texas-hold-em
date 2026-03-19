const RoomManager = require('../../gameLogic/RoomManager');
const { GAME_PHASES, TABLE_STATES } = require('../../types/GameTypes');

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

function createSpectator(deviceId, socketId, chips = 1000) {
  return {
    id: deviceId,
    socketId,
    nickname: deviceId,
    seat: -1,
    chips,
    isHost: false,
    isActive: false,
    isSpectator: true,
    disconnected: false,
    hand: [],
    currentBet: 0,
    totalBet: 0,
    folded: false,
    allIn: false,
    showHand: false,
    waitingForNextRound: false,
    inHand: false,
    lastAction: null,
    hasLeftRoom: false,
    needsRebuy: chips <= 0,
    tableState: chips <= 0 ? TABLE_STATES.BUSTED_WAIT_REBUY : TABLE_STATES.SPECTATING,
  };
}

describe('RoomManager seat state transitions', () => {
  it('keeps a healthy spectator out of the current action order when joining mid-hand', () => {
    const { io, gameRooms, socketDeviceMap, roomManager } = createManager();
    const hostSocket = registerDevice(io, socketDeviceMap, 'socket-host', 'device-host');
    const guestSocket = registerDevice(io, socketDeviceMap, 'socket-guest', 'device-guest');
    const lateSocket = registerDevice(io, socketDeviceMap, 'socket-late', 'device-late');

    const roomId = roomManager.createRoom(hostSocket, {
      duration: 60,
      maxPlayers: 4,
      allinDealCount: 1,
    });

    roomManager.joinRoom(guestSocket, roomId, 'device-guest', 'Guest');

    const room = gameRooms.get(roomId);
    room.players.push(createSpectator('device-late', 'socket-late', 1000));
    room.gameStarted = true;
    room.gameLogic = {
      currentPlayerIndex: 0,
      isGameInProgress: () => true,
      isPlayerInCurrentHand: () => false,
      getGameState: () => ({
        phase: GAME_PHASES.PREFLOP,
        currentPlayerId: 'device-host',
      }),
    };

    const result = roomManager.handleTakeSeat('device-late', 2);

    const latePlayer = room.players.find((player) => player.id === 'device-late');
    expect(latePlayer.seat).toBe(2);
    expect(latePlayer.tableState).toBe(TABLE_STATES.SEATED_WAIT_NEXT_HAND);
    expect(room.gameLogic.currentPlayerIndex).toBe(0);
    expect(result).toEqual({
      seatIndex: 2,
      tableState: TABLE_STATES.SEATED_WAIT_NEXT_HAND,
      roomState: room.roomState,
    });
  });

  it('keeps zero-chip players out of live seats when they try to take a seat mid-hand', () => {
    const { io, gameRooms, socketDeviceMap, roomManager } = createManager();
    const hostSocket = registerDevice(io, socketDeviceMap, 'socket-host', 'device-host');
    const guestSocket = registerDevice(io, socketDeviceMap, 'socket-guest', 'device-guest');

    const roomId = roomManager.createRoom(hostSocket, {
      duration: 60,
      maxPlayers: 4,
      allinDealCount: 1,
    });

    roomManager.joinRoom(guestSocket, roomId, 'device-guest', 'Guest');

    const room = gameRooms.get(roomId);
    const bustedPlayer = createSpectator('device-busted', 'socket-busted', 0);
    registerDevice(io, socketDeviceMap, 'socket-busted', 'device-busted');
    room.players.push(bustedPlayer);
    room.gameStarted = true;
    room.gameLogic = {
      currentPlayerIndex: 0,
      isGameInProgress: () => true,
      isPlayerInCurrentHand: () => false,
      getGameState: () => ({
        phase: GAME_PHASES.PREFLOP,
        currentPlayerId: 'device-host',
      }),
    };

    const result = roomManager.handleTakeSeat('device-busted', 2);

    expect(bustedPlayer.seat).toBe(-1);
    expect(bustedPlayer.tableState).toBe(TABLE_STATES.BUSTED_WAIT_REBUY);
    expect(room.gameLogic.currentPlayerIndex).toBe(0);
    expect(result).toEqual({
      seatIndex: 2,
      tableState: TABLE_STATES.BUSTED_WAIT_REBUY,
      roomState: room.roomState,
    });
  });

  it('normalizes zero-chip seated players into busted_wait_rebuy', () => {
    const { io, gameRooms, socketDeviceMap, roomManager } = createManager();
    const hostSocket = registerDevice(io, socketDeviceMap, 'socket-host', 'device-host');

    const roomId = roomManager.createRoom(hostSocket, {
      duration: 60,
      maxPlayers: 4,
      allinDealCount: 1,
    });

    const room = gameRooms.get(roomId);
    room.players.push({
      ...createSpectator('device-dead-seat', 'socket-dead-seat', 0),
      seat: 1,
      isSpectator: false,
      tableState: TABLE_STATES.SEATED_WAIT_NEXT_HAND,
      needsRebuy: false,
    });

    roomManager.normalizePlayerStates(roomId);

    const deadSeatPlayer = room.players.find((player) => player.id === 'device-dead-seat');
    expect(deadSeatPlayer.seat).toBe(-1);
    expect(deadSeatPlayer.isSpectator).toBe(true);
    expect(deadSeatPlayer.needsRebuy).toBe(true);
    expect(deadSeatPlayer.tableState).toBe(TABLE_STATES.BUSTED_WAIT_REBUY);
  });

  it('returns the new seat after a successful seat change', () => {
    const { io, gameRooms, socketDeviceMap, roomManager } = createManager();
    const hostSocket = registerDevice(io, socketDeviceMap, 'socket-host', 'device-host');
    const guestSocket = registerDevice(io, socketDeviceMap, 'socket-guest', 'device-guest');

    const roomId = roomManager.createRoom(hostSocket, {
      duration: 60,
      maxPlayers: 4,
      allinDealCount: 1,
    });

    roomManager.joinRoom(guestSocket, roomId, 'device-guest', 'Guest');

    const result = roomManager.handleSeatChange('device-guest', 1, 3);
    const guest = gameRooms.get(roomId).players.find((player) => player.id === 'device-guest');

    expect(guest.seat).toBe(3);
    expect(result).toEqual({
      fromSeat: 1,
      toSeat: 3,
      tableState: TABLE_STATES.SEATED_READY,
      roomState: gameRooms.get(roomId).roomState,
    });
  });

  it('returns whether leaveSeat had to auto-fold the player', () => {
    const { io, gameRooms, socketDeviceMap, roomManager } = createManager();
    const hostSocket = registerDevice(io, socketDeviceMap, 'socket-host', 'device-host');
    const guestSocket = registerDevice(io, socketDeviceMap, 'socket-guest', 'device-guest');

    const roomId = roomManager.createRoom(hostSocket, {
      duration: 60,
      maxPlayers: 4,
      allinDealCount: 1,
    });

    roomManager.joinRoom(guestSocket, roomId, 'device-guest', 'Guest');

    const room = gameRooms.get(roomId);
    room.gameStarted = true;
    room.gameLogic = {
      isPlayerInCurrentHand: (player) => player.id === 'device-guest',
      forceFoldPlayer: jest.fn(),
      getGameState: () => ({
        phase: GAME_PHASES.PREFLOP,
        currentPlayerId: 'device-host',
      }),
    };

    const result = roomManager.handleLeaveSeat('device-guest');
    const guest = room.players.find((player) => player.id === 'device-guest');

    expect(room.gameLogic.forceFoldPlayer).toHaveBeenCalledWith('device-guest', 'leave_seat');
    expect(guest.tableState).toBe(TABLE_STATES.SPECTATING);
    expect(result).toEqual({
      forcedFold: true,
      tableState: TABLE_STATES.SPECTATING,
      roomState: room.roomState,
    });
  });

  it('returns leave-room metadata when the player exits mid-hand', () => {
    const { io, gameRooms, socketDeviceMap, roomManager } = createManager();
    const hostSocket = registerDevice(io, socketDeviceMap, 'socket-host', 'device-host');
    const guestSocket = registerDevice(io, socketDeviceMap, 'socket-guest', 'device-guest');

    const roomId = roomManager.createRoom(hostSocket, {
      duration: 60,
      maxPlayers: 4,
      allinDealCount: 1,
    });

    roomManager.joinRoom(guestSocket, roomId, 'device-guest', 'Guest');

    const room = gameRooms.get(roomId);
    room.gameStarted = true;
    room.gameLogic = {
      isPlayerInCurrentHand: (player) => player.id === 'device-guest',
      forceFoldPlayer: jest.fn(),
      getGameState: () => ({
        phase: GAME_PHASES.PREFLOP,
        currentPlayerId: 'device-host',
      }),
    };

    const result = roomManager.handleLeaveRoom('device-guest');
    const guest = room.players.find((player) => player.id === 'device-guest');

    expect(room.gameLogic.forceFoldPlayer).toHaveBeenCalledWith('device-guest', 'leave_room');
    expect(guest.hasLeftRoom).toBe(true);
    expect(result).toEqual({
      roomId,
      forcedFold: true,
      roomClosed: false,
    });
  });

  it('reports when leave-room closes the room entirely', () => {
    const { io, socketDeviceMap, roomManager } = createManager();
    const hostSocket = registerDevice(io, socketDeviceMap, 'socket-host', 'device-host');

    const roomId = roomManager.createRoom(hostSocket, {
      duration: 60,
      maxPlayers: 4,
      allinDealCount: 1,
    });

    const result = roomManager.handleLeaveRoom('device-host');

    expect(result).toEqual({
      roomId,
      forcedFold: false,
      roomClosed: true,
    });
  });
});
