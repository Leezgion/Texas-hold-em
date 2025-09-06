/**
 * 德州扑克游戏类型定义
 * 提供完整的类型注释和接口定义，增强代码的类型安全性
 */

/**
 * @typedef {Object} Player
 * @property {string} id - 玩家唯一标识符
 * @property {string} nickname - 玩家昵称
 * @property {number} chips - 当前筹码数量
 * @property {number} currentBet - 当前轮下注金额
 * @property {number} totalBet - 总下注金额
 * @property {Card[]} holeCards - 手牌（底牌）
 * @property {boolean} folded - 是否已弃牌
 * @property {boolean} allIn - 是否All-in
 * @property {boolean} isReady - 是否准备就绪
 * @property {number} lastActionTime - 最后动作时间戳
 * @property {PlayerAction|null} lastAction - 最后执行的动作
 */

/**
 * @typedef {Object} Card
 * @property {('hearts'|'diamonds'|'clubs'|'spades')} suit - 花色
 * @property {('2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'10'|'J'|'Q'|'K'|'A')} rank - 点数
 * @property {string} display - 显示名称
 */

/**
 * @typedef {Object} HandRank
 * @property {number} rank - 手牌排名（1-10，1为最强）
 * @property {number} value - 手牌数值（用于比较同排名手牌）
 * @property {string} name - 手牌名称
 * @property {Card[]} cards - 组成手牌的卡牌
 * @property {string} description - 手牌描述
 */

/**
 * @typedef {Object} GameRoom
 * @property {string} id - 房间唯一标识符
 * @property {string} name - 房间名称
 * @property {Player[]} players - 房间内玩家列表
 * @property {RoomSettings} settings - 房间设置
 * @property {GameState} gameState - 游戏状态
 * @property {boolean} isActive - 房间是否活跃
 * @property {string} createdBy - 房间创建者ID
 * @property {number} createdAt - 创建时间戳
 * @property {number} lastActivity - 最后活动时间
 */

/**
 * @typedef {Object} RoomSettings
 * @property {number} maxPlayers - 最大玩家数量（2-10）
 * @property {number} initialChips - 初始筹码数量
 * @property {number} timeLimit - 行动时间限制（秒）
 * @property {boolean} allowSpectators - 是否允许观众
 * @property {boolean} isPrivate - 是否为私人房间
 * @property {string|null} password - 房间密码
 * @property {BlindStructure} blinds - 盲注结构
 */

/**
 * @typedef {Object} BlindStructure
 * @property {number} smallBlind - 小盲注金额
 * @property {number} bigBlind - 大盲注金额
 * @property {boolean} autoIncrease - 是否自动增长
 * @property {number} increaseInterval - 增长间隔（分钟）
 * @property {number} increaseRate - 增长倍率
 */

/**
 * @typedef {Object} GameState
 * @property {GamePhase} phase - 游戏阶段
 * @property {Card[]} communityCards - 公共牌
 * @property {number} pot - 奖池总额
 * @property {SidePot[]} sidePots - 边池列表
 * @property {number} currentBet - 当前下注额
 * @property {number} minRaise - 最小加注额
 * @property {number} currentPlayerIndex - 当前行动玩家索引
 * @property {number} dealerIndex - 庄家索引
 * @property {number} smallBlindIndex - 小盲注玩家索引
 * @property {number} bigBlindIndex - 大盲注玩家索引
 * @property {number} roundStartIndex - 轮次开始玩家索引
 * @property {number} lastRaiseIndex - 最后加注玩家索引
 * @property {Player[]} allinPlayers - All-in玩家列表
 * @property {HandHistory[]} handHistory - 手牌历史
 * @property {number} handNumber - 手牌编号
 */

/**
 * @typedef {('waiting'|'preflop'|'flop'|'turn'|'river'|'showdown'|'finished')} GamePhase
 */

/**
 * @typedef {Object} SidePot
 * @property {number} id - 边池ID
 * @property {number} amount - 边池金额
 * @property {string[]} eligiblePlayers - 有资格的玩家ID列表
 * @property {number} level - 边池层级
 * @property {number} maxBet - 最大下注额
 */

/**
 * @typedef {Object} PlayerAction
 * @property {('fold'|'check'|'call'|'raise'|'allin')} type - 动作类型
 * @property {number} amount - 动作金额
 * @property {number} timestamp - 动作时间戳
 * @property {string} playerId - 执行动作的玩家ID
 * @property {number} previousBet - 动作前的下注额
 * @property {number} newBet - 动作后的下注额
 */

/**
 * @typedef {Object} HandHistory
 * @property {number} handNumber - 手牌编号
 * @property {PlayerAction[]} actions - 所有玩家动作
 * @property {Card[]} communityCards - 公共牌
 * @property {Player[]} winners - 获胜者列表
 * @property {PotDistribution[]} potDistribution - 奖池分配
 * @property {number} startTime - 开始时间
 * @property {number} endTime - 结束时间
 * @property {number} totalPot - 总奖池
 */

/**
 * @typedef {Object} PotDistribution
 * @property {string} playerId - 玩家ID
 * @property {number} amount - 获得金额
 * @property {HandRank} handRank - 手牌排名
 * @property {string} reason - 获胜原因
 */

/**
 * @typedef {Object} GameStateUpdate
 * @property {GameState} gameState - 更新后的游戏状态
 * @property {Player[]} players - 更新后的玩家列表
 * @property {string[]} events - 事件列表
 * @property {boolean} handCompleted - 手牌是否完成
 * @property {PotDistribution[]|null} winners - 获胜者（如果手牌完成）
 */

/**
 * @typedef {Object} SocketEvent
 * @property {string} type - 事件类型
 * @property {*} payload - 事件数据
 * @property {number} timestamp - 时间戳
 * @property {string} [playerId] - 玩家ID（可选）
 * @property {string} [roomId] - 房间ID（可选）
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - 是否有效
 * @property {string} [error] - 错误信息（如果无效）
 * @property {*} [data] - 验证后的数据（如果有效）
 */

/**
 * @typedef {Object} PerformanceMetrics
 * @property {number} responseTime - 响应时间（毫秒）
 * @property {number} memoryUsage - 内存使用量（MB）
 * @property {number} cpuUsage - CPU使用率（百分比）
 * @property {number} activeConnections - 活跃连接数
 * @property {number} throughput - 吞吐量（请求/分钟）
 */

/**
 * @typedef {Object} SystemHealth
 * @property {('healthy'|'warning'|'critical')} status - 系统状态
 * @property {MemoryInfo} memory - 内存信息
 * @property {ResponseTimeInfo} responseTime - 响应时间信息
 * @property {number} uptime - 运行时间（秒）
 */

/**
 * @typedef {Object} MemoryInfo
 * @property {string} used - 已使用内存
 * @property {string} total - 总内存
 * @property {string} percentage - 使用百分比
 */

/**
 * @typedef {Object} ResponseTimeInfo
 * @property {string} average - 平均响应时间
 * @property {('normal'|'slow')} status - 响应时间状态
 */

/**
 * @typedef {Object} GameError
 * @property {string} code - 错误代码
 * @property {string} message - 错误消息
 * @property {*} [details] - 错误详情
 * @property {number} timestamp - 错误时间戳
 */

/**
 * 游戏错误代码常量
 */
const ERROR_CODES = {
  // 玩家相关错误
  PLAYER_NOT_FOUND: 'PLAYER_NOT_FOUND',
  PLAYER_NOT_IN_ROOM: 'PLAYER_NOT_IN_ROOM',
  PLAYER_ALREADY_IN_ROOM: 'PLAYER_ALREADY_IN_ROOM',
  PLAYER_NOT_ACTIVE: 'PLAYER_NOT_ACTIVE',
  PLAYER_OUT_OF_TURN: 'PLAYER_OUT_OF_TURN',
  
  // 房间相关错误
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  ROOM_FULL: 'ROOM_FULL',
  ROOM_PASSWORD_REQUIRED: 'ROOM_PASSWORD_REQUIRED',
  ROOM_PASSWORD_INCORRECT: 'ROOM_PASSWORD_INCORRECT',
  
  // 游戏状态错误
  GAME_NOT_STARTED: 'GAME_NOT_STARTED',
  GAME_ALREADY_STARTED: 'GAME_ALREADY_STARTED',
  INVALID_GAME_PHASE: 'INVALID_GAME_PHASE',
  
  // 动作相关错误
  INVALID_ACTION: 'INVALID_ACTION',
  INSUFFICIENT_CHIPS: 'INSUFFICIENT_CHIPS',
  INVALID_BET_AMOUNT: 'INVALID_BET_AMOUNT',
  CANNOT_CHECK: 'CANNOT_CHECK',
  CANNOT_RAISE: 'CANNOT_RAISE',
  
  // 系统错误
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR'
};

/**
 * 游戏事件类型常量
 */
const EVENT_TYPES = {
  // 房间事件
  ROOM_CREATED: 'room_created',
  ROOM_DESTROYED: 'room_destroyed',
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  PLAYER_READY: 'player_ready',
  
  // 游戏事件
  GAME_STARTED: 'game_started',
  GAME_ENDED: 'game_ended',
  HAND_STARTED: 'hand_started',
  HAND_ENDED: 'hand_ended',
  PHASE_CHANGED: 'phase_changed',
  
  // 玩家动作事件
  PLAYER_FOLDED: 'player_folded',
  PLAYER_CHECKED: 'player_checked',
  PLAYER_CALLED: 'player_called',
  PLAYER_RAISED: 'player_raised',
  PLAYER_ALLIN: 'player_allin',
  
  // 发牌事件
  CARDS_DEALT: 'cards_dealt',
  FLOP_DEALT: 'flop_dealt',
  TURN_DEALT: 'turn_dealt',
  RIVER_DEALT: 'river_dealt',
  
  // 奖池事件
  POT_UPDATED: 'pot_updated',
  POT_DISTRIBUTED: 'pot_distributed',
  SIDE_POT_CREATED: 'side_pot_created',
  
  // 系统事件
  TIMER_STARTED: 'timer_started',
  TIMER_WARNING: 'timer_warning',
  TIMER_EXPIRED: 'timer_expired',
  CONNECTION_STATUS: 'connection_status'
};

/**
 * 游戏配置常量
 */
const GAME_CONFIG = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 10,
  MIN_CHIPS: 100,
  MAX_CHIPS: 1000000,
  DEFAULT_TIME_LIMIT: 30,
  MAX_TIME_LIMIT: 120,
  MIN_TIME_LIMIT: 10,
  DEFAULT_INITIAL_CHIPS: 1000,
  CARDS_PER_PLAYER: 2,
  COMMUNITY_CARDS_COUNT: 5,
  FLOP_CARDS: 3,
  TURN_CARDS: 1,
  RIVER_CARDS: 1
};

module.exports = {
  ERROR_CODES,
  EVENT_TYPES,
  GAME_CONFIG
};
