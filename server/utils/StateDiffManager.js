/**
 * 状态差异管理器 - 优化状态更新和广播性能
 * 实现增量更新、状态diff算法和事件节流
 */

const { logger } = require('./Logger');

class StateDiffManager {
  constructor() {
    this.previousStates = new Map(); // 存储每个房间的上一个状态
    this.stateSnapshots = new Map(); // 状态快照，用于回滚
    this.updateQueue = new Map();    // 更新队列，用于批处理
    this.throttleTimers = new Map(); // 节流定时器
    
    // 配置
    this.config = {
      enableDiffing: true,
      enableThrottling: true,
      throttleDelay: 100,        // 100ms 节流延迟
      maxQueueSize: 50,          // 最大队列大小
      enableCompression: true,   // 启用状态压缩
      snapshotInterval: 5000,    // 5秒快照间隔
      maxSnapshotsPerRoom: 10    // 每房间最大快照数
    };
    
    // 性能统计
    this.stats = {
      diffsCalculated: 0,
      statesCompressed: 0,
      updatesBatched: 0,
      bytesReduced: 0,
      averageDiffTime: 0
    };
    
    // 状态字段权重（用于优化diff算法）
    this.fieldWeights = {
      // 高频变化字段
      'currentPlayerIndex': 1,
      'pot': 1,
      'currentBet': 1,
      'timer': 1,
      
      // 中频变化字段
      'players.chips': 2,
      'players.currentBet': 2,
      'players.folded': 2,
      
      // 低频变化字段
      'communityCards': 3,
      'phase': 3,
      'dealerIndex': 3,
      
      // 很少变化字段
      'room.settings': 5,
      'handHistory': 5
    };
    
    this.startSnapshotScheduler();
  }

  /**
   * 计算两个状态之间的差异
   * @param {Object} oldState - 旧状态
   * @param {Object} newState - 新状态
   * @param {string} path - 当前路径（用于递归）
   * @returns {Object} 差异对象
   */
  calculateDiff(oldState, newState, path = '') {
    const startTime = Date.now();
    const diff = {};
    let hasChanges = false;
    
    // 如果新状态为null或undefined
    if (newState === null || newState === undefined) {
      if (oldState !== null && oldState !== undefined) {
        diff['__deleted__'] = true;
        hasChanges = true;
      }
      return { diff, hasChanges };
    }
    
    // 如果旧状态为null或undefined
    if (oldState === null || oldState === undefined) {
      diff['__added__'] = newState;
      hasChanges = true;
      return { diff, hasChanges };
    }
    
    // 处理不同类型
    if (typeof oldState !== typeof newState) {
      diff['__replaced__'] = newState;
      hasChanges = true;
      return { diff, hasChanges };
    }
    
    // 处理基础类型
    if (typeof newState !== 'object') {
      if (oldState !== newState) {
        diff['__value__'] = newState;
        hasChanges = true;
      }
      return { diff, hasChanges };
    }
    
    // 处理数组
    if (Array.isArray(newState)) {
      const arrayDiff = this.calculateArrayDiff(oldState, newState, path);
      if (arrayDiff.hasChanges) {
        Object.assign(diff, arrayDiff.diff);
        hasChanges = true;
      }
      return { diff, hasChanges };
    }
    
    // 处理对象
    const allKeys = new Set([...Object.keys(oldState), ...Object.keys(newState)]);
    
    for (const key of allKeys) {
      const currentPath = path ? `${path}.${key}` : key;
      const oldValue = oldState[key];
      const newValue = newState[key];
      
      const fieldDiff = this.calculateDiff(oldValue, newValue, currentPath);
      
      if (fieldDiff.hasChanges) {
        diff[key] = fieldDiff.diff;
        hasChanges = true;
      }
    }
    
    // 更新性能统计
    const diffTime = Date.now() - startTime;
    this.stats.diffsCalculated++;
    this.stats.averageDiffTime = (this.stats.averageDiffTime + diffTime) / 2;
    
    return { diff, hasChanges };
  }

  /**
   * 计算数组差异
   * @param {Array} oldArray - 旧数组
   * @param {Array} newArray - 新数组
   * @param {string} path - 路径
   * @returns {Object} 数组差异
   */
  calculateArrayDiff(oldArray, newArray, path) {
    const diff = {};
    let hasChanges = false;
    
    // 检查长度变化
    if (oldArray.length !== newArray.length) {
      diff['__length__'] = newArray.length;
      hasChanges = true;
    }
    
    // 检查元素变化
    const maxLength = Math.max(oldArray.length, newArray.length);
    
    for (let i = 0; i < maxLength; i++) {
      const oldItem = oldArray[i];
      const newItem = newArray[i];
      
      if (i >= oldArray.length) {
        // 新增元素
        diff[i] = { '__added__': newItem };
        hasChanges = true;
      } else if (i >= newArray.length) {
        // 删除元素
        diff[i] = { '__deleted__': true };
        hasChanges = true;
      } else {
        // 检查元素变化
        const itemDiff = this.calculateDiff(oldItem, newItem, `${path}[${i}]`);
        if (itemDiff.hasChanges) {
          diff[i] = itemDiff.diff;
          hasChanges = true;
        }
      }
    }
    
    return { diff, hasChanges };
  }

  /**
   * 应用差异到状态
   * @param {Object} baseState - 基础状态
   * @param {Object} diff - 差异对象
   * @returns {Object} 新状态
   */
  applyDiff(baseState, diff) {
    if (!diff || typeof diff !== 'object') {
      return baseState;
    }
    
    // 处理特殊标记
    if (diff.hasOwnProperty('__deleted__')) {
      return undefined;
    }
    
    if (diff.hasOwnProperty('__added__')) {
      return diff['__added__'];
    }
    
    if (diff.hasOwnProperty('__replaced__')) {
      return diff['__replaced__'];
    }
    
    if (diff.hasOwnProperty('__value__')) {
      return diff['__value__'];
    }
    
    // 处理数组
    if (Array.isArray(baseState)) {
      const newArray = [...baseState];
      
      if (diff.hasOwnProperty('__length__')) {
        newArray.length = diff['__length__'];
      }
      
      for (const key in diff) {
        if (key.startsWith('__')) continue;
        
        const index = parseInt(key);
        if (!isNaN(index)) {
          newArray[index] = this.applyDiff(newArray[index], diff[key]);
        }
      }
      
      return newArray;
    }
    
    // 处理对象
    const newState = { ...baseState };
    
    for (const key in diff) {
      if (key.startsWith('__')) continue;
      
      newState[key] = this.applyDiff(newState[key], diff[key]);
    }
    
    return newState;
  }

  /**
   * 获取状态差异用于广播
   * @param {string} roomId - 房间ID
   * @param {Object} newState - 新状态
   * @returns {Object|null} 差异对象或null（如果无变化）
   */
  getStateDiff(roomId, newState) {
    if (!this.config.enableDiffing) {
      return { fullState: newState, isDiff: false };
    }
    
    const previousState = this.previousStates.get(roomId);
    
    if (!previousState) {
      // 第一次状态，存储并返回完整状态
      this.previousStates.set(roomId, this.deepClone(newState));
      return { fullState: newState, isDiff: false };
    }
    
    const { diff, hasChanges } = this.calculateDiff(previousState, newState);
    
    if (!hasChanges) {
      return null; // 无变化
    }
    
    // 计算压缩比
    const originalSize = JSON.stringify(newState).length;
    const diffSize = JSON.stringify(diff).length;
    const compressionRatio = diffSize / originalSize;
    
    // 如果差异太大，直接发送完整状态
    if (compressionRatio > 0.8) {
      this.previousStates.set(roomId, this.deepClone(newState));
      return { fullState: newState, isDiff: false };
    }
    
    // 更新存储的状态
    this.previousStates.set(roomId, this.deepClone(newState));
    
    // 更新统计
    this.stats.statesCompressed++;
    this.stats.bytesReduced += originalSize - diffSize;
    
    return { 
      diff, 
      isDiff: true, 
      compressionRatio: compressionRatio.toFixed(3),
      originalSize,
      diffSize
    };
  }

  /**
   * 节流状态更新
   * @param {string} roomId - 房间ID
   * @param {Object} newState - 新状态
   * @param {Function} callback - 回调函数
   */
  throttleStateUpdate(roomId, newState, callback) {
    if (!this.config.enableThrottling) {
      callback(this.getStateDiff(roomId, newState));
      return;
    }
    
    // 将更新添加到队列
    if (!this.updateQueue.has(roomId)) {
      this.updateQueue.set(roomId, []);
    }
    
    const queue = this.updateQueue.get(roomId);
    queue.push({ state: newState, callback, timestamp: Date.now() });
    
    // 限制队列大小
    if (queue.length > this.config.maxQueueSize) {
      queue.shift(); // 移除最旧的更新
    }
    
    // 如果已有定时器，取消它
    if (this.throttleTimers.has(roomId)) {
      clearTimeout(this.throttleTimers.get(roomId));
    }
    
    // 设置新的定时器
    const timer = setTimeout(() => {
      this.flushUpdateQueue(roomId);
    }, this.config.throttleDelay);
    
    this.throttleTimers.set(roomId, timer);
  }

  /**
   * 刷新更新队列
   * @param {string} roomId - 房间ID
   */
  flushUpdateQueue(roomId) {
    const queue = this.updateQueue.get(roomId);
    if (!queue || queue.length === 0) return;
    
    // 获取最新的状态更新
    const latestUpdate = queue[queue.length - 1];
    const stateDiff = this.getStateDiff(roomId, latestUpdate.state);
    
    // 批量处理所有回调
    queue.forEach(update => {
      try {
        update.callback(stateDiff);
      } catch (error) {
        logger.error('Error in state update callback', { 
          roomId, 
          error: error.message 
        });
      }
    });
    
    // 清理
    this.updateQueue.delete(roomId);
    this.throttleTimers.delete(roomId);
    this.stats.updatesBatched += queue.length;
  }

  /**
   * 创建状态快照
   * @param {string} roomId - 房间ID
   * @param {Object} state - 状态对象
   */
  createSnapshot(roomId, state) {
    if (!this.stateSnapshots.has(roomId)) {
      this.stateSnapshots.set(roomId, []);
    }
    
    const snapshots = this.stateSnapshots.get(roomId);
    
    // 添加新快照
    snapshots.push({
      timestamp: Date.now(),
      state: this.deepClone(state)
    });
    
    // 限制快照数量
    if (snapshots.length > this.config.maxSnapshotsPerRoom) {
      snapshots.shift();
    }
    
    logger.debug(`State snapshot created for room ${roomId}`, {
      snapshotCount: snapshots.length
    });
  }

  /**
   * 启动快照调度器
   */
  startSnapshotScheduler() {
    setInterval(() => {
      // 为所有有状态的房间创建快照
      for (const roomId of this.previousStates.keys()) {
        const state = this.previousStates.get(roomId);
        if (state) {
          this.createSnapshot(roomId, state);
        }
      }
    }, this.config.snapshotInterval);
    
    logger.info('State snapshot scheduler started', {
      interval: this.config.snapshotInterval
    });
  }

  /**
   * 深度克隆对象
   * @param {Object} obj - 要克隆的对象
   * @returns {Object} 克隆后的对象
   */
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepClone(item));
    }
    
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }
    
    return cloned;
  }

  /**
   * 清理房间状态
   * @param {string} roomId - 房间ID
   */
  cleanupRoom(roomId) {
    this.previousStates.delete(roomId);
    this.updateQueue.delete(roomId);
    this.stateSnapshots.delete(roomId);
    
    if (this.throttleTimers.has(roomId)) {
      clearTimeout(this.throttleTimers.get(roomId));
      this.throttleTimers.delete(roomId);
    }
    
    logger.debug(`State cleanup completed for room ${roomId}`);
  }

  /**
   * 获取性能统计
   * @returns {Object} 统计信息
   */
  getPerformanceStats() {
    return {
      ...this.stats,
      activeRooms: this.previousStates.size,
      queuedUpdates: Array.from(this.updateQueue.values()).reduce((sum, queue) => sum + queue.length, 0),
      totalSnapshots: Array.from(this.stateSnapshots.values()).reduce((sum, snapshots) => sum + snapshots.length, 0)
    };
  }

  /**
   * 重置统计信息
   */
  resetStats() {
    this.stats = {
      diffsCalculated: 0,
      statesCompressed: 0,
      updatesBatched: 0,
      bytesReduced: 0,
      averageDiffTime: 0
    };
    
    logger.info('State diff manager statistics reset');
  }
}

// 创建全局状态差异管理器实例
const stateDiffManager = new StateDiffManager();

module.exports = { StateDiffManager, stateDiffManager };
