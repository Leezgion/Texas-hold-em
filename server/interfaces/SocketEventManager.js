/**
 * Socket事件接口标准化 - 统一Socket.IO事件处理和数据格式
 * 提供类型安全的事件发送和接收机制
 */

const { EVENT_TYPES, ERROR_CODES } = require('../types/GameTypes');
const Validator = require('../validators/Validator');
const { logger, resourceManager } = require('../utils');

class SocketEventManager {
  constructor() {
    this.eventHandlers = new Map();
    this.middlewares = [];
    this.eventHistory = new Map(); // 用于调试和性能分析
    
    // 事件统计
    this.stats = {
      eventsReceived: 0,
      eventsSent: 0,
      errorsCount: 0,
      lastEventTime: null
    };
    
    this.setupEventValidation();
  }

  /**
   * 设置事件验证规则
   */
  setupEventValidation() {
    this.eventValidationRules = {
      // 房间相关事件
      'join_room': {
        required: ['roomId'],
        optional: ['password'],
        validate: (data) => this.validateJoinRoom(data)
      },
      'create_room': {
        required: ['roomName', 'settings'],
        optional: ['password'],
        validate: (data) => this.validateCreateRoom(data)
      },
      'leave_room': {
        required: ['roomId'],
        optional: [],
        validate: (data) => this.validateLeaveRoom(data)
      },
      
      // 游戏相关事件
      'player_action': {
        required: ['action'],
        optional: ['amount'],
        validate: (data) => this.validatePlayerAction(data)
      },
      'ready_to_play': {
        required: [],
        optional: [],
        validate: () => ({ valid: true })
      },
      'request_game_state': {
        required: [],
        optional: [],
        validate: () => ({ valid: true })
      },
      
      // 聊天相关事件
      'chat_message': {
        required: ['message'],
        optional: ['type'],
        validate: (data) => this.validateChatMessage(data)
      }
    };
  }

  /**
   * 注册Socket连接
   * @param {Object} socket - Socket实例
   * @param {Object} metadata - 连接元数据
   */
  registerSocket(socket, metadata = {}) {
    const socketId = socket.id;
    
    // 注册到资源管理器
    resourceManager.registerSocket(socketId, socket, metadata);
    
    // 设置中间件
    this.setupSocketMiddleware(socket);
    
    // 注册基础事件处理器
    this.setupBaseEventHandlers(socket);
    
    logger.connection('socket_registered', socketId, metadata);
  }

  /**
   * 设置Socket中间件
   * @param {Object} socket - Socket实例
   */
  setupSocketMiddleware(socket) {
    // 事件预处理中间件
    socket.use((packet, next) => {
      const [eventName, eventData] = packet;
      
      // 记录事件接收
      this.stats.eventsReceived++;
      this.stats.lastEventTime = Date.now();
      
      // 验证事件格式
      const validationResult = this.validateIncomingEvent(eventName, eventData, socket);
      
      if (!validationResult.valid) {
        logger.warn('Invalid event received', {
          socketId: socket.id,
          eventName,
          error: validationResult.error
        });
        
        this.sendError(socket, ERROR_CODES.VALIDATION_ERROR, validationResult.error);
        return; // 不调用next()，阻止事件处理
      }
      
      // 应用自定义中间件
      this.applyMiddlewares(socket, eventName, validationResult.data, next);
    });
  }

  /**
   * 设置基础事件处理器
   * @param {Object} socket - Socket实例
   */
  setupBaseEventHandlers(socket) {
    // 连接事件
    socket.on('connect', () => {
      this.sendEvent(socket, EVENT_TYPES.CONNECTION_STATUS, {
        status: 'connected',
        socketId: socket.id
      });
    });
    
    // 断开连接事件
    socket.on('disconnect', (reason) => {
      logger.connection('socket_disconnected', socket.id, { reason });
      this.cleanupSocketEvents(socket.id);
    });
    
    // 错误事件
    socket.on('error', (error) => {
      logger.error('Socket error', {
        socketId: socket.id,
        error: error.message
      });
      this.stats.errorsCount++;
    });
    
    // Ping/Pong for connection health
    socket.on('ping', () => {
      resourceManager.updateSocketActivity(socket.id);
    });
  }

  /**
   * 验证入站事件
   * @param {string} eventName - 事件名称
   * @param {*} eventData - 事件数据
   * @param {Object} socket - Socket实例
   * @returns {ValidationResult} 验证结果
   */
  validateIncomingEvent(eventName, eventData, socket) {
    // 检查事件名称
    if (!eventName || typeof eventName !== 'string') {
      return {
        valid: false,
        error: '事件名称必须是非空字符串'
      };
    }
    
    // 获取验证规则
    const rule = this.eventValidationRules[eventName];
    if (!rule) {
      // 允许未定义的事件，但记录警告
      logger.debug('Unknown event type', { eventName, socketId: socket.id });
      return {
        valid: true,
        data: eventData
      };
    }
    
    // 验证数据结构
    if (!eventData || typeof eventData !== 'object') {
      return {
        valid: false,
        error: '事件数据必须是对象'
      };
    }
    
    // 检查必需字段
    for (const field of rule.required) {
      if (!(field in eventData)) {
        return {
          valid: false,
          error: `缺少必需字段: ${field}`
        };
      }
    }
    
    // 应用自定义验证
    if (rule.validate) {
      const customResult = rule.validate(eventData, socket);
      if (!customResult.valid) {
        return customResult;
      }
    }
    
    // 添加标准字段
    const standardizedData = {
      ...eventData,
      timestamp: Date.now(),
      socketId: socket.id
    };
    
    return {
      valid: true,
      data: standardizedData
    };
  }

  /**
   * 应用中间件
   * @param {Object} socket - Socket实例
   * @param {string} eventName - 事件名称
   * @param {Object} eventData - 事件数据
   * @param {Function} next - 下一步回调
   */
  applyMiddlewares(socket, eventName, eventData, next) {
    let index = 0;
    
    const runMiddleware = () => {
      if (index >= this.middlewares.length) {
        return next(); // 所有中间件都执行完毕
      }
      
      const middleware = this.middlewares[index++];
      middleware(socket, eventName, eventData, runMiddleware);
    };
    
    runMiddleware();
  }

  /**
   * 添加中间件
   * @param {Function} middleware - 中间件函数
   */
  addMiddleware(middleware) {
    if (typeof middleware !== 'function') {
      throw new Error('Middleware must be a function');
    }
    this.middlewares.push(middleware);
  }

  /**
   * 发送事件到客户端
   * @param {Object} socket - Socket实例
   * @param {string} eventType - 事件类型
   * @param {*} payload - 事件数据
   * @param {Object} options - 发送选项
   */
  sendEvent(socket, eventType, payload, options = {}) {
    const eventData = this.createStandardEvent(eventType, payload, options);
    
    try {
      socket.emit(eventType, eventData);
      
      this.stats.eventsSent++;
      this.recordEventHistory(socket.id, 'sent', eventType, eventData);
      
      logger.debug('Event sent', {
        socketId: socket.id,
        eventType,
        payloadSize: JSON.stringify(payload).length
      });
      
    } catch (error) {
      logger.error('Failed to send event', {
        socketId: socket.id,
        eventType,
        error: error.message
      });
      this.stats.errorsCount++;
    }
  }

  /**
   * 广播事件到房间
   * @param {Object} io - Socket.IO实例
   * @param {string} roomId - 房间ID
   * @param {string} eventType - 事件类型
   * @param {*} payload - 事件数据
   * @param {Object} options - 发送选项
   */
  broadcastToRoom(io, roomId, eventType, payload, options = {}) {
    const eventData = this.createStandardEvent(eventType, payload, options);
    
    try {
      io.to(roomId).emit(eventType, eventData);
      
      this.stats.eventsSent++;
      
      logger.debug('Event broadcasted to room', {
        roomId,
        eventType,
        payloadSize: JSON.stringify(payload).length
      });
      
    } catch (error) {
      logger.error('Failed to broadcast event', {
        roomId,
        eventType,
        error: error.message
      });
      this.stats.errorsCount++;
    }
  }

  /**
   * 发送错误到客户端
   * @param {Object} socket - Socket实例
   * @param {string} errorCode - 错误代码
   * @param {string} message - 错误消息
   * @param {*} details - 错误详情
   */
  sendError(socket, errorCode, message, details = null) {
    const errorData = Validator.createGameError(errorCode, message, details);
    this.sendEvent(socket, 'error', errorData);
  }

  /**
   * 创建标准事件对象
   * @param {string} eventType - 事件类型
   * @param {*} payload - 事件数据
   * @param {Object} options - 选项
   * @returns {Object} 标准事件对象
   */
  createStandardEvent(eventType, payload, options = {}) {
    return {
      type: eventType,
      payload: payload || {},
      timestamp: Date.now(),
      version: options.version || '1.0',
      sequence: options.sequence || null
    };
  }

  /**
   * 记录事件历史
   * @param {string} socketId - Socket ID
   * @param {string} direction - 方向（sent/received）
   * @param {string} eventType - 事件类型
   * @param {Object} eventData - 事件数据
   */
  recordEventHistory(socketId, direction, eventType, eventData) {
    if (!this.eventHistory.has(socketId)) {
      this.eventHistory.set(socketId, []);
    }
    
    const history = this.eventHistory.get(socketId);
    history.push({
      direction,
      eventType,
      timestamp: Date.now(),
      dataSize: JSON.stringify(eventData).length
    });
    
    // 限制历史记录长度
    if (history.length > 100) {
      history.shift();
    }
  }

  /**
   * 清理Socket事件历史
   * @param {string} socketId - Socket ID
   */
  cleanupSocketEvents(socketId) {
    this.eventHistory.delete(socketId);
  }

  // 验证方法
  validateJoinRoom(data) {
    const roomIdResult = Validator.validatePlayerId(data.roomId);
    if (!roomIdResult.valid) {
      return { valid: false, error: '房间ID无效' };
    }
    
    if (data.password && typeof data.password !== 'string') {
      return { valid: false, error: '房间密码必须是字符串' };
    }
    
    return { valid: true };
  }

  validateCreateRoom(data) {
    if (!data.roomName || typeof data.roomName !== 'string' || data.roomName.trim().length < 1) {
      return { valid: false, error: '房间名称不能为空' };
    }
    
    const settingsResult = Validator.validateRoomSettings(data.settings);
    if (!settingsResult.valid) {
      return settingsResult;
    }
    
    return { valid: true };
  }

  validateLeaveRoom(data) {
    return Validator.validatePlayerId(data.roomId);
  }

  validatePlayerAction(data) {
    const validActions = ['fold', 'check', 'call', 'raise', 'allin'];
    if (!validActions.includes(data.action)) {
      return { valid: false, error: '无效的玩家动作' };
    }
    
    if (['raise', 'allin'].includes(data.action) && typeof data.amount !== 'number') {
      return { valid: false, error: '加注和All-in需要指定金额' };
    }
    
    return { valid: true };
  }

  validateChatMessage(data) {
    if (!data.message || typeof data.message !== 'string') {
      return { valid: false, error: '聊天消息必须是非空字符串' };
    }
    
    const trimmed = data.message.trim();
    if (trimmed.length === 0 || trimmed.length > 200) {
      return { valid: false, error: '聊天消息长度必须在1-200字符之间' };
    }
    
    return { valid: true };
  }

  /**
   * 获取事件统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      ...this.stats,
      activeConnections: this.eventHistory.size,
      middlewareCount: this.middlewares.length,
      eventTypeCount: Object.keys(this.eventValidationRules).length
    };
  }

  /**
   * 重置统计信息
   */
  resetStats() {
    this.stats = {
      eventsReceived: 0,
      eventsSent: 0,
      errorsCount: 0,
      lastEventTime: null
    };
    
    logger.info('Socket event manager statistics reset');
  }
}

// 创建全局Socket事件管理器实例
const socketEventManager = new SocketEventManager();

module.exports = { SocketEventManager, socketEventManager };
