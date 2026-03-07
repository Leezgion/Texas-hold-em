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

describe('RoomManager player ledger and rebuy eligibility', () => {
  it('creates a ledger for newly seated players', () => {
    const { io, gameRooms, socketDeviceMap, roomManager } = createManager();
    const hostSocket = registerDevice(io, socketDeviceMap, 'socket-host', 'device-host');

    const roomId = roomManager.createRoom(hostSocket, {
      duration: 60,
      maxPlayers: 6,
      allinDealCount: 1,
    });

    const room = gameRooms.get(roomId);
    expect(room.players[0].ledger).toEqual({
      initialBuyIn: 1000,
      rebuyTotal: 0,
      totalBuyIn: 1000,
      currentChips: 1000,
      sessionNet: 0,
      handStartChips: 1000,
      handDelta: 0,
      showdownDelta: 0,
    });
  });

  it('allows rebuy after fold and updates ledger totals', () => {
    const { io, gameRooms, socketDeviceMap, roomManager } = createManager();
    const hostSocket = registerDevice(io, socketDeviceMap, 'socket-host', 'device-host');

    const roomId = roomManager.createRoom(hostSocket, {
      duration: 60,
      maxPlayers: 6,
      allinDealCount: 1,
    });

    const room = gameRooms.get(roomId);
    const hostPlayer = room.players[0];
    room.gameStarted = true;
    room.gameLogic = {
      isGameInProgress: () => true,
      isPlayerInCurrentHand: (player) => player.inHand,
      getGameState: () => ({
        phase: GAME_PHASES.PREFLOP,
        currentPlayerId: null,
      }),
    };

    hostPlayer.inHand = true;
    hostPlayer.folded = true;
    roomManager.syncRoomState(room);

    expect(hostPlayer.tableState).toBe(TABLE_STATES.FOLDED_THIS_HAND);

    roomManager.handleRebuyRequest('device-host', 1000);

    expect(hostPlayer.chips).toBe(2000);
    expect(hostPlayer.ledger).toEqual({
      initialBuyIn: 1000,
      rebuyTotal: 1000,
      totalBuyIn: 2000,
      currentChips: 2000,
      sessionNet: 0,
      handStartChips: 1000,
      handDelta: 1000,
      showdownDelta: 0,
    });
    expect(hostPlayer.tableState).toBe(TABLE_STATES.FOLDED_THIS_HAND);
  });

  it('rejects rebuy while the player is still active in hand', () => {
    const { io, gameRooms, socketDeviceMap, roomManager } = createManager();
    const hostSocket = registerDevice(io, socketDeviceMap, 'socket-host', 'device-host');

    const roomId = roomManager.createRoom(hostSocket, {
      duration: 60,
      maxPlayers: 6,
      allinDealCount: 1,
    });

    const room = gameRooms.get(roomId);
    const hostPlayer = room.players[0];
    room.gameStarted = true;
    room.gameLogic = {
      isGameInProgress: () => true,
      isPlayerInCurrentHand: (player) => player.inHand,
      getGameState: () => ({
        phase: GAME_PHASES.PREFLOP,
        currentPlayerId: 'device-host',
      }),
    };

    hostPlayer.inHand = true;
    roomManager.syncRoomState(room);

    expect(hostPlayer.tableState).toBe(TABLE_STATES.ACTIVE_IN_HAND);
    expect(() => roomManager.handleRebuyRequest('device-host', 1000)).toThrow('当前状态无法补码');
  });
});
