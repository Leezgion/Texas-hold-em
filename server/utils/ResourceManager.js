/**
 * 资源管理器 - 统一管理Socket连接、定时器和内存资源
 * 防止内存泄漏，提供自动清理机制
 */

const { logger } = require('./Logger');

class ResourceManager {
  constructor() {
    this.resources = new Map();
    this.timers = new Map();
    this.sockets = new Map();
    this.intervals = new Map();
    this.watchers = new Map();
    
    // 资源类型常量
    this.RESOURCE_TYPES = {
      SOCKET: 'socket',
      TIMER: 'timer',
      INTERVAL: 'interval',
      WATCHER: 'watcher',
      CUSTOM: 'custom'
    };
    
    // 统计信息
    this.stats = {
      socketsCreated: 0,
      socketsDestroyed: 0,
      timersCreated: 0,
      timersDestroyed: 0,
      intervalsCreated: 0,
      intervalsDestroyed: 0,
      memoryLeaksDetected: 0
    };
    
    // 自动清理配置
    this.config = {
      autoCleanupInterval: 60000, // 60秒
      maxSocketIdleTime: 300000,  // 5分钟
      maxTimerLifetime: 600000,   // 10分钟
      enableMemoryMonitoring: true
    };
    
    this.startAutoCleanup();
    this.startMemoryMonitoring();
  }

  /**
   * 注册Socket连接
   * @param {string} socketId - Socket ID
   * @param {Object} socket - Socket实例
   * @param {Object} metadata - 元数据
   */
  registerSocket(socketId, socket, metadata = {}) {
    const resource = {
      id: socketId,
      type: this.RESOURCE_TYPES.SOCKET,
      instance: socket,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      metadata: {
        ...metadata,
        userId: metadata.userId || null,
        roomId: metadata.roomId || null
      }
    };
    
    this.sockets.set(socketId, resource);
    this.resources.set(socketId, resource);
    this.stats.socketsCreated++;
    
    logger.connection('register', socketId, { 
      totalSockets: this.sockets.size,
      metadata 
    });
    
    // 监听Socket断开事件
    socket.on('disconnect', () => {
      this.unregisterSocket(socketId);
    });
    
    // 定期更新活跃时间
    socket.on('ping', () => {
      this.updateSocketActivity(socketId);
    });
  }

  /**
   * 注销Socket连接
   * @param {string} socketId - Socket ID
   */
  unregisterSocket(socketId) {
    const resource = this.sockets.get(socketId);
    if (!resource) return false;
    
    try {
      // 清理Socket相关资源
      if (resource.instance && resource.instance.connected) {
        resource.instance.disconnect(true);
      }
      
      this.sockets.delete(socketId);
      this.resources.delete(socketId);
      this.stats.socketsDestroyed++;
      
      logger.connection('unregister', socketId, { 
        totalSockets: this.sockets.size,
        lifetime: Date.now() - resource.createdAt
      });
      
      return true;
    } catch (error) {
      logger.error(`Error unregistering socket ${socketId}`, { error: error.message });
      return false;
    }
  }

  /**
   * 更新Socket活跃时间
   * @param {string} socketId - Socket ID
   */
  updateSocketActivity(socketId) {
    const resource = this.sockets.get(socketId);
    if (resource) {
      resource.lastActivity = Date.now();
    }
  }

  /**
   * 注册定时器
   * @param {string} timerId - 定时器ID
   * @param {NodeJS.Timeout} timer - 定时器实例
   * @param {Object} metadata - 元数据
   */
  registerTimer(timerId, timer, metadata = {}) {
    const resource = {
      id: timerId,
      type: this.RESOURCE_TYPES.TIMER,
      instance: timer,
      createdAt: Date.now(),
      metadata: {
        ...metadata,
        purpose: metadata.purpose || 'unknown'
      }
    };
    
    this.timers.set(timerId, resource);
    this.resources.set(timerId, resource);
    this.stats.timersCreated++;
    
    logger.debug(`Timer registered: ${timerId}`, { 
      totalTimers: this.timers.size,
      purpose: metadata.purpose 
    });
  }

  /**
   * 注销定时器
   * @param {string} timerId - 定时器ID
   */
  unregisterTimer(timerId) {
    const resource = this.timers.get(timerId);
    if (!resource) return false;
    
    try {
      clearTimeout(resource.instance);
      this.timers.delete(timerId);
      this.resources.delete(timerId);
      this.stats.timersDestroyed++;
      
      logger.debug(`Timer unregistered: ${timerId}`, { 
        totalTimers: this.timers.size,
        lifetime: Date.now() - resource.createdAt
      });
      
      return true;
    } catch (error) {
      logger.error(`Error unregistering timer ${timerId}`, { error: error.message });
      return false;
    }
  }

  /**
   * 注册循环定时器
   * @param {string} intervalId - 循环定时器ID
   * @param {NodeJS.Timeout} interval - 循环定时器实例
   * @param {Object} metadata - 元数据
   */
  registerInterval(intervalId, interval, metadata = {}) {
    const resource = {
      id: intervalId,
      type: this.RESOURCE_TYPES.INTERVAL,
      instance: interval,
      createdAt: Date.now(),
      metadata: {
        ...metadata,
        frequency: metadata.frequency || 'unknown'
      }
    };
    
    this.intervals.set(intervalId, resource);
    this.resources.set(intervalId, resource);
    this.stats.intervalsCreated++;
    
    logger.debug(`Interval registered: ${intervalId}`, { 
      totalIntervals: this.intervals.size,
      frequency: metadata.frequency 
    });
  }

  /**
   * 注销循环定时器
   * @param {string} intervalId - 循环定时器ID
   */
  unregisterInterval(intervalId) {
    const resource = this.intervals.get(intervalId);
    if (!resource) return false;
    
    try {
      clearInterval(resource.instance);
      this.intervals.delete(intervalId);
      this.resources.delete(intervalId);
      this.stats.intervalsDestroyed++;
      
      logger.debug(`Interval unregistered: ${intervalId}`, { 
        totalIntervals: this.intervals.size,
        lifetime: Date.now() - resource.createdAt
      });
      
      return true;
    } catch (error) {
      logger.error(`Error unregistering interval ${intervalId}`, { error: error.message });
      return false;
    }
  }

  /**
   * 清理房间相关资源
   * @param {string} roomId - 房间ID
   */
  cleanupRoomResources(roomId) {
    logger.info(`Cleaning up resources for room: ${roomId}`);
    
    let cleaned = 0;
    
    // 清理该房间的Socket连接
    for (const [socketId, resource] of this.sockets) {
      if (resource.metadata.roomId === roomId) {
        this.unregisterSocket(socketId);
        cleaned++;
      }
    }
    
    // 清理该房间的定时器
    for (const [timerId, resource] of this.timers) {
      if (resource.metadata.roomId === roomId) {
        this.unregisterTimer(timerId);
        cleaned++;
      }
    }
    
    // 清理该房间的循环定时器
    for (const [intervalId, resource] of this.intervals) {
      if (resource.metadata.roomId === roomId) {
        this.unregisterInterval(intervalId);
        cleaned++;
      }
    }
    
    logger.info(`Room cleanup completed`, { roomId, resourcesCleaned: cleaned });
    return cleaned;
  }

  /**
   * 强制垃圾回收（如果可用）
   */
  forceGarbageCollection() {
    if (global.gc && typeof global.gc === 'function') {
      const beforeMemory = process.memoryUsage();
      global.gc();
      const afterMemory = process.memoryUsage();
      
      const freed = beforeMemory.heapUsed - afterMemory.heapUsed;
      logger.debug('Forced garbage collection', { 
        freedBytes: freed,
        freedMB: (freed / 1024 / 1024).toFixed(2)
      });
    } else {
      logger.debug('Garbage collection not available');
    }
  }

  /**
   * 检查并清理空闲资源
   */
  cleanupIdleResources() {
    const now = Date.now();
    let cleaned = 0;
    
    // 清理空闲Socket
    for (const [socketId, resource] of this.sockets) {
      const idleTime = now - resource.lastActivity;
      if (idleTime > this.config.maxSocketIdleTime) {
        logger.warn(`Cleaning up idle socket: ${socketId}`, { idleTime });
        this.unregisterSocket(socketId);
        cleaned++;
      }
    }
    
    // 清理长期存在的定时器
    for (const [timerId, resource] of this.timers) {
      const lifetime = now - resource.createdAt;
      if (lifetime > this.config.maxTimerLifetime) {
        logger.warn(`Cleaning up long-lived timer: ${timerId}`, { lifetime });
        this.unregisterTimer(timerId);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      logger.info(`Cleanup completed: ${cleaned} idle resources removed`);
      this.forceGarbageCollection();
    }
    
    return cleaned;
  }

  /**
   * 启动自动清理
   */
  startAutoCleanup() {
    const cleanupInterval = setInterval(() => {
      this.cleanupIdleResources();
    }, this.config.autoCleanupInterval);
    
    this.registerInterval('auto-cleanup', cleanupInterval, { 
      purpose: 'automatic resource cleanup',
      frequency: this.config.autoCleanupInterval 
    });
    
    logger.info('Auto cleanup started', { 
      interval: this.config.autoCleanupInterval 
    });
  }

  /**
   * 启动内存监控
   */
  startMemoryMonitoring() {
    if (!this.config.enableMemoryMonitoring) return;
    
    const monitoringInterval = setInterval(() => {
      const memUsage = process.memoryUsage();
      const stats = this.getResourceStats();
      
      // 检查内存使用情况
      const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
      const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
      const heapUsagePercent = (heapUsedMB / heapTotalMB) * 100;
      
      // 如果内存使用率过高，发出警告
      if (heapUsagePercent > 85) {
        logger.warn('High memory usage detected', {
          heapUsedMB: heapUsedMB.toFixed(2),
          heapTotalMB: heapTotalMB.toFixed(2),
          usagePercent: heapUsagePercent.toFixed(1),
          activeResources: stats.totalResources
        });
        
        this.stats.memoryLeaksDetected++;
        this.cleanupIdleResources();
      }
      
      // 定期记录内存状态
      logger.debug('Memory status', {
        heapUsedMB: heapUsedMB.toFixed(2),
        heapTotalMB: heapTotalMB.toFixed(2),
        usagePercent: heapUsagePercent.toFixed(1),
        ...stats
      });
      
    }, 30000); // 每30秒监控一次
    
    this.registerInterval('memory-monitor', monitoringInterval, { 
      purpose: 'memory usage monitoring',
      frequency: 30000 
    });
    
    logger.info('Memory monitoring started');
  }

  /**
   * 获取资源统计信息
   * @returns {Object} 统计信息
   */
  getResourceStats() {
    return {
      totalResources: this.resources.size,
      activeSockets: this.sockets.size,
      activeTimers: this.timers.size,
      activeIntervals: this.intervals.size,
      ...this.stats
    };
  }

  /**
   * 获取详细的资源报告
   * @returns {Object} 详细报告
   */
  getDetailedReport() {
    const memUsage = process.memoryUsage();
    const stats = this.getResourceStats();
    
    return {
      timestamp: new Date().toISOString(),
      memory: {
        heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        external: `${(memUsage.external / 1024 / 1024).toFixed(2)} MB`,
        rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`
      },
      resources: stats,
      activeConnections: Array.from(this.sockets.values()).map(resource => ({
        id: resource.id,
        createdAt: new Date(resource.createdAt).toISOString(),
        lastActivity: new Date(resource.lastActivity).toISOString(),
        userId: resource.metadata.userId,
        roomId: resource.metadata.roomId
      }))
    };
  }

  /**
   * 优雅关闭，清理所有资源
   */
  shutdown() {
    logger.info('Resource manager shutting down...');
    
    // 清理所有Socket连接
    for (const socketId of this.sockets.keys()) {
      this.unregisterSocket(socketId);
    }
    
    // 清理所有定时器
    for (const timerId of this.timers.keys()) {
      this.unregisterTimer(timerId);
    }
    
    // 清理所有循环定时器
    for (const intervalId of this.intervals.keys()) {
      this.unregisterInterval(intervalId);
    }
    
    // 强制垃圾回收
    this.forceGarbageCollection();
    
    const finalStats = this.getResourceStats();
    logger.info('Resource manager shutdown completed', finalStats);
  }
}

// 创建全局资源管理器实例
const resourceManager = new ResourceManager();

// 进程退出时自动清理
process.on('SIGINT', () => {
  logger.info('Received SIGINT, performing graceful shutdown...');
  resourceManager.shutdown();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, performing graceful shutdown...');
  resourceManager.shutdown();
  process.exit(0);
});

module.exports = { ResourceManager, resourceManager };
