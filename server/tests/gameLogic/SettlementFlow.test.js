const GameLogic = require('../../gameLogic/GameLogic');
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

function createSettlingRoom({ revealPolicy = 'showdown_only', settleMs = 10 } = {}) {
  const io = createIo();
  const gameRooms = new Map();
  const socketDeviceMap = new Map();
  const roomManager = new RoomManager(io, gameRooms, socketDeviceMap);

  const hostSocket = registerDevice(io, socketDeviceMap, 'socket-host', 'device-host');
  const guestSocket = registerDevice(io, socketDeviceMap, 'socket-guest', 'device-guest');

  const roomId = roomManager.createRoom(hostSocket, {
    duration: 60,
    maxPlayers: 6,
    allinDealCount: 1,
    revealPolicy,
    settleMs,
  });

  roomManager.joinRoom(guestSocket, roomId, 'device-guest', 'Guest');

  const room = gameRooms.get(roomId);
  room.gameStarted = true;
  room.gameLogic = new GameLogic(room, io, roomManager);
  room.gameLogic.handNumber = 7;

  const host = room.players.find((player) => player.id === 'device-host');
  const guest = room.players.find((player) => player.id === 'device-guest');

  host.inHand = true;
  host.folded = false;
  host.hand = [
    { rank: 14, suit: 'spades' },
    { rank: 13, suit: 'hearts' },
  ];
  guest.inHand = true;
  guest.folded = true;
  guest.hand = [
    { rank: 12, suit: 'clubs' },
    { rank: 2, suit: 'diamonds' },
  ];

  return { io, gameRooms, socketDeviceMap, roomManager, room, host, guest };
}

describe('Settling window and reveal policies', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('lets only showdown players reveal in showdown_only rooms', () => {
    const { roomManager, room, host, guest } = createSettlingRoom({ revealPolicy: 'showdown_only' });

    room.gameLogic.beginSettlement({
      eligibleRevealPlayerIds: [host.id],
      reason: 'test',
    });

    expect(() => roomManager.revealHand(guest.id, 'show_all')).toThrow('玩家当前无法亮牌');
  });

  it('allows post-hand reveal choices in free_reveal_after_hand rooms', () => {
    const { roomManager, room, guest } = createSettlingRoom({ revealPolicy: 'free_reveal_after_hand' });

    room.gameLogic.beginSettlement({
      eligibleRevealPlayerIds: [room.players[0].id],
      reason: 'test',
    });

    roomManager.revealHand(guest.id, 'show_one', 0);

    expect(guest.revealMode).toBe('show_one');
    expect(guest.revealedCardIndices).toEqual([0]);
  });

  it('auto-advances from settling to the next hand after the timer expires', () => {
    const { room, host, guest } = createSettlingRoom({ revealPolicy: 'showdown_only', settleMs: 10 });

    room.gameLogic.beginSettlement({
      eligibleRevealPlayerIds: [host.id, guest.id],
      reason: 'test',
    });
    room.gameLogic.scheduleNextHand();

    expect(room.roomState).toBe(ROOM_STATES.SETTLING);

    jest.advanceTimersByTime(10);

    expect(room.roomState).toBe(ROOM_STATES.IN_HAND);
    expect(room.gameLogic.handNumber).toBe(8);
  });

  it('restores settling state and reveal eligibility when a player reconnects during settlement', () => {
    const { io, socketDeviceMap, roomManager, room, guest } = createSettlingRoom({
      revealPolicy: 'showdown_only',
      settleMs: 3000,
    });

    room.gameLogic.beginSettlement({
      eligibleRevealPlayerIds: [guest.id],
      reason: 'test',
    });

    const endsAt = room.gameLogic.settlementWindowEndsAt;

    roomManager.handlePlayerDisconnect(guest.id);

    const reconnectSocket = registerDevice(io, socketDeviceMap, 'socket-guest-reconnect', guest.id);
    roomManager.handleDeviceReconnect(guest.id, reconnectSocket);

    expect(reconnectSocket.join).toHaveBeenCalledWith(room.id);
    expect(reconnectSocket.emit).toHaveBeenCalledWith(
      'gameStateUpdate',
      expect.objectContaining({
        roomState: ROOM_STATES.SETTLING,
        gameState: expect.objectContaining({
          settlementWindowEndsAt: endsAt,
          eligibleRevealPlayerIds: [guest.id],
          revealLocked: false,
        }),
      })
    );
  });
});
