/**
 * 分级日志系统 - 性能优化的日志管理
 * 支持不同环境的日志级别控制和格式化输出
 */

class Logger {
  constructor() {
    this.levels = {
      DEBUG: 0,
      INFO: 1,
      WARN: 2,
      ERROR: 3,
      NONE: 4
    };
    
    // 根据环境设置日志级别
    this.currentLevel = process.env.NODE_ENV === 'production' 
      ? this.levels.WARN 
      : this.levels.DEBUG;
    
    // 日志输出配置
    this.config = {
      timestamp: true,
      colorize: !process.env.NODE_ENV || process.env.NODE_ENV !== 'production',
      maxMessageLength: 1000,
      enableFileLogging: process.env.ENABLE_FILE_LOGGING === 'true'
    };
    
    // 颜色代码
    this.colors = {
      DEBUG: '\x1b[36m', // Cyan
      INFO: '\x1b[32m',  // Green
      WARN: '\x1b[33m',  // Yellow
      ERROR: '\x1b[31m', // Red
      RESET: '\x1b[0m'   // Reset
    };
    
    // 性能统计
    this.stats = {
      debugCount: 0,
      infoCount: 0,
      warnCount: 0,
      errorCount: 0,
      startTime: Date.now()
    };
  }

  /**
   * 格式化日志消息
   * @param {string} level - 日志级别
   * @param {string} message - 日志消息
   * @param {Object} context - 上下文信息
   * @returns {string} 格式化后的消息
   */
  formatMessage(level, message, context = {}) {
    let formatted = '';
    
    // 添加时间戳
    if (this.config.timestamp) {
      const timestamp = new Date().toISOString();
      formatted += `[${timestamp}] `;
    }
    
    // 添加级别标识
    const levelStr = `[${level}]`;
    if (this.config.colorize) {
      formatted += `${this.colors[level]}${levelStr}${this.colors.RESET} `;
    } else {
      formatted += `${levelStr} `;
    }
    
    // 限制消息长度（防止过长日志影响性能）
    if (message.length > this.config.maxMessageLength) {
      message = message.substring(0, this.config.maxMessageLength) + '...';
    }
    
    formatted += message;
    
    // 添加上下文信息
    if (Object.keys(context).length > 0) {
      formatted += ` | Context: ${JSON.stringify(context)}`;
    }
    
    return formatted;
  }

  /**
   * 检查是否应该输出日志
   * @param {number} level - 日志级别数值
   * @returns {boolean} 是否应该输出
   */
  shouldLog(level) {
    return level >= this.currentLevel;
  }

  /**
   * 输出日志到控制台和文件
   * @param {string} level - 日志级别
   * @param {string} formatted - 格式化后的消息
   */
  output(level, formatted) {
    // 控制台输出
    if (level === 'ERROR') {
      console.error(formatted);
    } else if (level === 'WARN') {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
    
    // 文件输出（如果启用）
    if (this.config.enableFileLogging) {
      this.writeToFile(level, formatted);
    }
  }

  /**
   * 写入日志文件（异步，不阻塞主线程）
   * @param {string} level - 日志级别
   * @param {string} message - 日志消息
   */
  writeToFile(level, message) {
    // 简化版本，生产环境可以使用专业日志库如winston
    const fs = require('fs').promises;
    const path = require('path');
    
    const logDir = path.join(__dirname, '../../logs');
    const logFile = path.join(logDir, `${level.toLowerCase()}.log`);
    
    // 异步写入，避免阻塞
    setImmediate(async () => {
      try {
        await fs.mkdir(logDir, { recursive: true });
        await fs.appendFile(logFile, message + '\n');
      } catch (error) {
        console.error('Failed to write log file:', error.message);
      }
    });
  }

  /**
   * 调试级别日志（仅开发环境）
   * @param {string} message - 日志消息
   * @param {Object} context - 上下文信息
   */
  debug(message, context = {}) {
    if (!this.shouldLog(this.levels.DEBUG)) return;
    
    this.stats.debugCount++;
    const formatted = this.formatMessage('DEBUG', message, context);
    this.output('DEBUG', formatted);
  }

  /**
   * 信息级别日志
   * @param {string} message - 日志消息
   * @param {Object} context - 上下文信息
   */
  info(message, context = {}) {
    if (!this.shouldLog(this.levels.INFO)) return;
    
    this.stats.infoCount++;
    const formatted = this.formatMessage('INFO', message, context);
    this.output('INFO', formatted);
  }

  /**
   * 警告级别日志
   * @param {string} message - 日志消息
   * @param {Object} context - 上下文信息
   */
  warn(message, context = {}) {
    if (!this.shouldLog(this.levels.WARN)) return;
    
    this.stats.warnCount++;
    const formatted = this.formatMessage('WARN', message, context);
    this.output('WARN', formatted);
  }

  /**
   * 错误级别日志
   * @param {string} message - 日志消息
   * @param {Object} context - 上下文信息
   */
  error(message, context = {}) {
    if (!this.shouldLog(this.levels.ERROR)) return;
    
    this.stats.errorCount++;
    const formatted = this.formatMessage('ERROR', message, context);
    this.output('ERROR', formatted);
  }

  /**
   * 游戏事件专用日志
   * @param {string} event - 事件类型
   * @param {string} roomId - 房间ID
   * @param {string} playerId - 玩家ID
   * @param {Object} details - 事件详情
   */
  gameEvent(event, roomId, playerId, details = {}) {
    const context = {
      event,
      roomId,
      playerId,
      timestamp: Date.now(),
      ...details
    };
    
    this.info(`Game Event: ${event}`, context);
  }

  /**
   * 性能监控日志
   * @param {string} operation - 操作名称
   * @param {number} duration - 执行时间（毫秒）
   * @param {Object} details - 详细信息
   */
  performance(operation, duration, details = {}) {
    const level = duration > 1000 ? 'WARN' : 'INFO';
    const message = `Performance: ${operation} took ${duration}ms`;
    
    if (level === 'WARN') {
      this.warn(message, { duration, operation, ...details });
    } else {
      this.debug(message, { duration, operation, ...details });
    }
  }

  /**
   * 网络连接日志
   * @param {string} action - 动作（connect/disconnect）
   * @param {string} socketId - Socket ID
   * @param {Object} details - 连接详情
   */
  connection(action, socketId, details = {}) {
    const message = `Socket ${action}: ${socketId}`;
    this.info(message, { action, socketId, ...details });
  }

  /**
   * 获取日志统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const runtime = Date.now() - this.stats.startTime;
    return {
      ...this.stats,
      runtime: runtime,
      runtimeFormatted: this.formatDuration(runtime),
      totalLogs: this.stats.debugCount + this.stats.infoCount + 
                this.stats.warnCount + this.stats.errorCount
    };
  }

  /**
   * 格式化持续时间
   * @param {number} ms - 毫秒数
   * @returns {string} 格式化后的时间
   */
  formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }

  /**
   * 设置日志级别
   * @param {string} level - 新的日志级别
   */
  setLevel(level) {
    if (this.levels.hasOwnProperty(level)) {
      this.currentLevel = this.levels[level];
      this.info(`Log level changed to: ${level}`);
    } else {
      this.warn(`Invalid log level: ${level}`);
    }
  }

  /**
   * 清理日志统计（重置计数器）
   */
  resetStats() {
    this.stats = {
      debugCount: 0,
      infoCount: 0,
      warnCount: 0,
      errorCount: 0,
      startTime: Date.now()
    };
    this.info('Log statistics reset');
  }
}

// 创建全局日志实例
const logger = new Logger();

// 性能监控装饰器
function logPerformance(target, propertyName, descriptor) {
  const method = descriptor.value;
  
  descriptor.value = function (...args) {
    const start = Date.now();
    const result = method.apply(this, args);
    const duration = Date.now() - start;
    
    logger.performance(`${target.constructor.name}.${propertyName}`, duration);
    
    return result;
  };
  
  return descriptor;
}

module.exports = { Logger, logger, logPerformance };
