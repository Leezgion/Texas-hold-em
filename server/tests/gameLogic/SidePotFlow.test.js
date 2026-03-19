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

function createThreePlayerRoom({ settleMs = 10 } = {}) {
  const io = createIo();
  const gameRooms = new Map();
  const socketDeviceMap = new Map();
  const roomManager = new RoomManager(io, gameRooms, socketDeviceMap);
  roomManager.startGameTimer = jest.fn();

  const hostSocket = registerDevice(io, socketDeviceMap, 'socket-host', 'device-host');
  const p2Socket = registerDevice(io, socketDeviceMap, 'socket-p2', 'device-p2');
  const p3Socket = registerDevice(io, socketDeviceMap, 'socket-p3', 'device-p3');

  const roomId = roomManager.createRoom(hostSocket, {
    duration: 60,
    maxPlayers: 3,
    allinDealCount: 1,
    settleMs,
  });

  roomManager.joinRoom(p2Socket, roomId, 'device-p2', 'P2');
  roomManager.joinRoom(p3Socket, roomId, 'device-p3', 'P3');

  return { io, gameRooms, socketDeviceMap, roomManager, room: gameRooms.get(roomId) };
}

describe('Side pot flow regression', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('settles a 1000 / 2000 / 4000 preflop all-in into a main pot and one side pot', () => {
    const { roomManager, room } = createThreePlayerRoom({ settleMs: 10 });

    roomManager.handleRebuyRequest('device-p2', 1000);
    roomManager.handleRebuyRequest('device-p3', 3000);
    roomManager.startGame(room.id, 'device-host');

    const host = room.players.find((player) => player.id === 'device-host');
    const p2 = room.players.find((player) => player.id === 'device-p2');
    const p3 = room.players.find((player) => player.id === 'device-p3');

    host.hand = [
      { rank: 14, suit: 'clubs' },
      { rank: 14, suit: 'diamonds' },
    ];
    p2.hand = [
      { rank: 13, suit: 'clubs' },
      { rank: 13, suit: 'diamonds' },
    ];
    p3.hand = [
      { rank: 12, suit: 'clubs' },
      { rank: 12, suit: 'diamonds' },
    ];

    const scriptedBoardDrawOrder = [
      { rank: 3, suit: 'spades' },
      { rank: 2, suit: 'hearts' },
      { rank: 6, suit: 'diamonds' },
      { rank: 8, suit: 'clubs' },
      { rank: 4, suit: 'hearts' },
      { rank: 9, suit: 'spades' },
      { rank: 5, suit: 'clubs' },
      { rank: 11, suit: 'hearts' },
    ];
    room.gameLogic.deck.cards = [...scriptedBoardDrawOrder].reverse();

    roomManager.handlePlayerAction('device-host', 'allin');
    roomManager.handlePlayerAction('device-p2', 'allin');
    roomManager.handlePlayerAction('device-p3', 'call');

    expect(room.roomState).toBe(ROOM_STATES.SETTLING);
    expect(room.players.reduce((sum, player) => sum + player.chips, 0)).toBe(7000);
    expect(host.chips).toBe(3000);
    expect(p2.chips).toBe(2000);
    expect(p3.chips).toBe(2000);

    const handRecord = room.gameLogic.handHistory.at(-1);
    expect(handRecord.totalPot).toBe(5000);
    expect(handRecord.pots).toEqual([
      expect.objectContaining({
        amount: 3000,
        eligiblePlayers: ['device-host', 'device-p2', 'device-p3'],
      }),
      expect.objectContaining({
        amount: 2000,
        eligiblePlayers: ['device-p2', 'device-p3'],
      }),
    ]);
    expect(handRecord.winners).toEqual([
      expect.objectContaining({
        playerId: 'device-host',
        winnings: 3000,
      }),
      expect.objectContaining({
        playerId: 'device-p2',
        winnings: 2000,
      }),
    ]);
  });
});
