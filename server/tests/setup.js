/**
 * Jest 测试环境设置
 * 配置测试环境、模拟对象和通用测试工具
 */

const { EventEmitter } = require('events');

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.TEST_MODE = 'true';

// 测试超时设置
jest.setTimeout(30000);

// 全局测试配置
global.TEST_CONFIG = {
  // 测试超时
  DEFAULT_TIMEOUT: 5000,
  SOCKET_TIMEOUT: 3000,
  API_TIMEOUT: 2000,
  
  // 测试数据
  TEST_ROOM_ID: 'test_room_123',
  TEST_PLAYER_ID: 'test_player_123',
  TEST_SOCKET_ID: 'test_socket_123',
  
  // 测试用户
  TEST_USERS: [
    { id: 'player1', nickname: '测试玩家1', chips: 1000 },
    { id: 'player2', nickname: '测试玩家2', chips: 1000 },
    { id: 'player3', nickname: '测试玩家3', chips: 1000 }
  ],
  
  // 测试房间设置
  TEST_ROOM_SETTINGS: {
    maxPlayers: 6,
    initialChips: 1000,
    smallBlind: 10,
    bigBlind: 20,
    timeLimit: 30,
    allowSpectators: true,
    allowRebuy: true
  }
};

// Socket.IO 模拟类
class MockSocket extends EventEmitter {
  constructor(id = 'mock_socket') {
    super();
    this.id = id;
    this.connected = true;
    this.rooms = new Set();
    this.emittedEvents = [];
    this.joinedRooms = [];
    this.leftRooms = [];
  }
  
  emit(event, ...args) {
    this.emittedEvents.push({ event, args, timestamp: Date.now() });
    return super.emit(event, ...args);
  }
  
  join(room) {
    this.rooms.add(room);
    this.joinedRooms.push(room);
    return Promise.resolve();
  }
  
  leave(room) {
    this.rooms.delete(room);
    this.leftRooms.push(room);
    return Promise.resolve();
  }
  
  disconnect(reason = 'test') {
    this.connected = false;
    this.emit('disconnect', reason);
  }
  
  // 获取发送的事件
  getEmittedEvents(eventName) {
    if (eventName) {
      return this.emittedEvents.filter(e => e.event === eventName);
    }
    return this.emittedEvents;
  }
  
  // 清空事件历史
  clearEvents() {
    this.emittedEvents = [];
    this.joinedRooms = [];
    this.leftRooms = [];
  }
  
  // 模拟客户端事件
  simulateClientEvent(event, data) {
    super.emit(event, data);
  }
}

// Express Response 模拟类
class MockResponse {
  constructor() {
    this.statusCode = 200;
    this.headers = {};
    this.responseData = null;
    this.sent = false;
    this.ended = false;
  }
  
  status(code) {
    this.statusCode = code;
    return this;
  }
  
  set(key, value) {
    if (typeof key === 'object') {
      Object.assign(this.headers, key);
    } else {
      this.headers[key] = value;
    }
    return this;
  }
  
  json(data) {
    this.responseData = data;
    this.sent = true;
    return this;
  }
  
  send(data) {
    this.responseData = data;
    this.sent = true;
    return this;
  }
  
  end(data) {
    if (data !== undefined) {
      this.responseData = data;
    }
    this.ended = true;
    return this;
  }
  
  // 验证响应
  expectStatus(expectedStatus) {
    expect(this.statusCode).toBe(expectedStatus);
    return this;
  }
  
  expectJson(expectedData) {
    expect(this.responseData).toEqual(expectedData);
    return this;
  }
  
  expectSent() {
    expect(this.sent).toBe(true);
    return this;
  }
}

// Express Request 模拟类
class MockRequest {
  constructor(options = {}) {
    this.method = options.method || 'GET';
    this.url = options.url || '/';
    this.headers = options.headers || {};
    this.body = options.body || {};
    this.query = options.query || {};
    this.params = options.params || {};
    this.user = options.user || null;
    this.session = options.session || {};
  }
  
  // 设置请求数据
  setBody(body) {
    this.body = body;
    return this;
  }
  
  setQuery(query) {
    this.query = query;
    return this;
  }
  
  setParams(params) {
    this.params = params;
    return this;
  }
  
  setHeaders(headers) {
    this.headers = { ...this.headers, ...headers };
    return this;
  }
}

// 控制台输出控制
const originalLog = console.log;
console.log = (...args) => {
  // 只显示重要的测试信息
  if (args.some(arg => 
    typeof arg === 'string' && 
    (arg.includes('🤖') || arg.includes('🚀') || arg.includes('Test') || arg.includes('Error') || arg.includes('✅') || arg.includes('❌'))
  )) {
    originalLog(...args);
  }
};

// 全局睡眠函数
global.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 测试工具函数
global.TestUtils = {
  // 创建模拟Socket
  createMockSocket: (id) => new MockSocket(id),
  
  // 创建模拟Response
  createMockResponse: () => new MockResponse(),
  
  // 创建模拟Request
  createMockRequest: (options) => new MockRequest(options),
  
  // 创建测试玩家
  createTestPlayer: (overrides = {}) => ({
    id: global.TEST_CONFIG.TEST_PLAYER_ID,
    nickname: '测试玩家',
    chips: 1000,
    cards: [],
    currentBet: 0,
    totalBet: 0,
    folded: false,
    allIn: false,
    isReady: false,
    lastActionTime: Date.now(),
    lastAction: null,
    ...overrides
  }),
  
  // 创建测试房间
  createTestRoom: (overrides = {}) => ({
    id: global.TEST_CONFIG.TEST_ROOM_ID,
    name: '测试房间',
    players: [],
    settings: global.TEST_CONFIG.TEST_ROOM_SETTINGS,
    gameState: null,
    isActive: true,
    createdBy: global.TEST_CONFIG.TEST_PLAYER_ID,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    ...overrides
  }),
  
  // 创建测试卡牌
  createTestCard: (suit = 'hearts', rank = 'A') => ({
    suit,
    rank,
    display: `${rank} of ${suit}`
  }),
  
  // 创建测试手牌
  createTestHand: () => [
    global.TestUtils.createTestCard('hearts', 'A'),
    global.TestUtils.createTestCard('spades', 'K')
  ],
  
  // 等待异步操作
  wait: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // 模拟网络延迟
  simulateNetworkDelay: () => global.TestUtils.wait(Math.random() * 100),
  
  // 断言助手
  expectEventEmitted: (socket, eventName, times = 1) => {
    const events = socket.getEmittedEvents(eventName);
    expect(events).toHaveLength(times);
    return events;
  },
  
  expectValidationError: (result, expectedCode) => {
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    if (expectedCode) {
      expect(result.errors.some(e => e.code === expectedCode)).toBe(true);
    }
  },
  
  expectValidationSuccess: (result) => {
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  }
};

// 兼容性支持 - 保持原有的 testUtils
global.testUtils = {
  createMockPlayer: (id, nickname, chips = 1000) => ({
    id,
    nickname,
    chips,
    seat: 0,
    isActive: true,
    hand: [],
    currentBet: 0,
    totalBet: 0,
    folded: false,
    allIn: false,
    showHand: false
  }),

  createMockRoom: (players = []) => ({
    id: 'TEST_ROOM',
    settings: {
      duration: 60,
      maxPlayers: 6,
      allowStraddle: false,
      allinDealCount: 3,
      initialChips: 1000
    },
    players,
    gameStarted: true,
    gameLogic: null,
    startTime: Date.now()
  }),

  createMockCard: (rank, suit) => ({
    rank,
    suit,
    isRed: suit === 'hearts' || suit === 'diamonds'
  }),

  // 验证牌的有效性
  isValidCard: (card) => {
    return card &&
           typeof card.rank === 'number' &&
           card.rank >= 2 && card.rank <= 14 &&
           ['hearts', 'diamonds', 'clubs', 'spades'].includes(card.suit);
  },

  // 验证手牌的有效性
  isValidHand: (hand) => {
    return Array.isArray(hand) &&
           hand.length === 2 &&
           hand.every(global.testUtils.isValidCard);
  }
};

// 全局模拟对象
global.MockSocket = MockSocket;
global.MockResponse = MockResponse;
global.MockRequest = MockRequest;

// 清理函数
global.cleanup = () => {
  // 清理所有模拟对象
  jest.clearAllMocks();
  jest.resetAllMocks();
  jest.restoreAllMocks();
};

// Jest 钩子
beforeEach(() => {
  // 每个测试前清理
  global.cleanup();
});

afterAll(() => {
  // 所有测试后清理
  global.cleanup();
});

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('测试中发现未处理的Promise拒绝:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('测试中发现未捕获的异常:', error);
});

console.log('✅ Jest 测试环境设置完成');
console.log(`📊 测试配置: 超时=${global.TEST_CONFIG.DEFAULT_TIMEOUT}ms, 环境=${process.env.NODE_ENV}`);
