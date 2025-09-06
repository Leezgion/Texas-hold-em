/**
 * 性能监控仪表盘 - 集成所有性能监控工具
 * 提供统一的性能指标收集、分析和报告功能
 */

const { logger } = require('./Logger');
const { resourceManager } = require('./ResourceManager');
const { stateDiffManager } = require('./StateDiffManager');

class PerformanceDashboard {
  constructor() {
    this.metrics = {
      system: {
        uptime: process.uptime(),
        startTime: Date.now(),
        nodeVersion: process.version,
        platform: process.platform
      },
      performance: {
        responseTime: [],
        throughput: 0,
        errorRate: 0,
        activeConnections: 0
      },
      game: {
        activeRooms: 0,
        totalGames: 0,
        averageGameDuration: 0,
        peakConcurrentPlayers: 0
      },
      alerts: []
    };
    
    this.thresholds = {
      responseTime: 1000,      // 1秒
      errorRate: 0.05,         // 5%
      memoryUsage: 0.85,       // 85%
      cpuUsage: 0.8            // 80%
    };
    
    this.history = {
      responseTime: [],
      memoryUsage: [],
      cpuUsage: [],
      throughput: [],
      maxHistoryLength: 100
    };
    
    this.startMonitoring();
  }

  /**
   * 开始性能监控
   */
  startMonitoring() {
    // 每5秒收集一次系统指标
    setInterval(() => {
      this.collectSystemMetrics();
    }, 5000);
    
    // 每分钟生成性能报告
    setInterval(() => {
      this.generatePerformanceReport();
    }, 60000);
    
    // 每小时清理历史数据
    setInterval(() => {
      this.cleanupHistory();
    }, 3600000);
    
    logger.info('Performance monitoring started');
  }

  /**
   * 收集系统指标
   */
  collectSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // 内存使用率
    const memoryUsagePercent = memUsage.heapUsed / memUsage.heapTotal;
    this.addToHistory('memoryUsage', memoryUsagePercent);
    
    // CPU使用率 (简化计算)
    const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000 / process.uptime();
    this.addToHistory('cpuUsage', Math.min(cpuPercent, 1));
    
    // 检查阈值并生成警报
    this.checkThresholds(memoryUsagePercent, cpuPercent);
    
    // 更新系统指标
    this.metrics.system.uptime = process.uptime();
    this.metrics.performance.activeConnections = resourceManager.getResourceStats().activeSockets;
  }

  /**
   * 添加数据到历史记录
   * @param {string} metric - 指标名称
   * @param {number} value - 值
   */
  addToHistory(metric, value) {
    if (!this.history[metric]) {
      this.history[metric] = [];
    }
    
    this.history[metric].push({
      timestamp: Date.now(),
      value: value
    });
    
    // 限制历史长度
    if (this.history[metric].length > this.maxHistoryLength) {
      this.history[metric].shift();
    }
  }

  /**
   * 检查性能阈值
   * @param {number} memoryUsage - 内存使用率
   * @param {number} cpuUsage - CPU使用率
   */
  checkThresholds(memoryUsage, cpuUsage) {
    const now = Date.now();
    
    // 检查内存使用率
    if (memoryUsage > this.thresholds.memoryUsage) {
      this.addAlert('HIGH_MEMORY_USAGE', `Memory usage: ${(memoryUsage * 100).toFixed(1)}%`, 'warning');
    }
    
    // 检查CPU使用率
    if (cpuUsage > this.thresholds.cpuUsage) {
      this.addAlert('HIGH_CPU_USAGE', `CPU usage: ${(cpuUsage * 100).toFixed(1)}%`, 'warning');
    }
    
    // 检查响应时间
    const avgResponseTime = this.getAverageResponseTime();
    if (avgResponseTime > this.thresholds.responseTime) {
      this.addAlert('SLOW_RESPONSE', `Average response time: ${avgResponseTime}ms`, 'warning');
    }
    
    // 检查错误率
    if (this.metrics.performance.errorRate > this.thresholds.errorRate) {
      this.addAlert('HIGH_ERROR_RATE', `Error rate: ${(this.metrics.performance.errorRate * 100).toFixed(1)}%`, 'error');
    }
  }

  /**
   * 添加警报
   * @param {string} type - 警报类型
   * @param {string} message - 警报消息
   * @param {string} severity - 严重程度
   */
  addAlert(type, message, severity) {
    const alert = {
      type,
      message,
      severity,
      timestamp: Date.now(),
      id: `${type}_${Date.now()}`
    };
    
    this.metrics.alerts.unshift(alert);
    
    // 限制警报数量
    if (this.metrics.alerts.length > 50) {
      this.metrics.alerts.pop();
    }
    
    // 记录到日志
    if (severity === 'error') {
      logger.error(`Performance Alert: ${message}`, { type, severity });
    } else {
      logger.warn(`Performance Alert: ${message}`, { type, severity });
    }
  }

  /**
   * 记录API响应时间
   * @param {number} responseTime - 响应时间（毫秒）
   */
  recordResponseTime(responseTime) {
    this.metrics.performance.responseTime.push({
      timestamp: Date.now(),
      duration: responseTime
    });
    
    this.addToHistory('responseTime', responseTime);
    
    // 限制响应时间记录数量
    if (this.metrics.performance.responseTime.length > 1000) {
      this.metrics.performance.responseTime.shift();
    }
  }

  /**
   * 获取平均响应时间
   * @returns {number} 平均响应时间
   */
  getAverageResponseTime() {
    const recent = this.metrics.performance.responseTime.slice(-10);
    if (recent.length === 0) return 0;
    
    const sum = recent.reduce((total, record) => total + record.duration, 0);
    return Math.round(sum / recent.length);
  }

  /**
   * 记录游戏事件
   * @param {string} event - 事件类型
   * @param {Object} data - 事件数据
   */
  recordGameEvent(event, data = {}) {
    switch (event) {
      case 'game_started':
        this.metrics.game.totalGames++;
        break;
      case 'game_ended':
        if (data.duration) {
          const currentAvg = this.metrics.game.averageGameDuration;
          const totalGames = this.metrics.game.totalGames;
          this.metrics.game.averageGameDuration = 
            (currentAvg * (totalGames - 1) + data.duration) / totalGames;
        }
        break;
      case 'player_joined':
        // 记录峰值并发玩家数
        if (data.totalPlayers > this.metrics.game.peakConcurrentPlayers) {
          this.metrics.game.peakConcurrentPlayers = data.totalPlayers;
        }
        break;
    }
  }

  /**
   * 生成性能报告
   */
  generatePerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      uptime: this.formatUptime(process.uptime()),
      system: this.getSystemHealth(),
      performance: this.getPerformanceMetrics(),
      resources: resourceManager.getResourceStats(),
      stateDiff: stateDiffManager.getPerformanceStats(),
      game: this.metrics.game,
      alerts: this.getRecentAlerts()
    };
    
    logger.info('Performance Report Generated', {
      reportSize: JSON.stringify(report).length,
      alertCount: report.alerts.length,
      systemHealth: report.system.status
    });
    
    return report;
  }

  /**
   * 获取系统健康状态
   * @returns {Object} 系统健康信息
   */
  getSystemHealth() {
    const memUsage = process.memoryUsage();
    const memoryPercent = memUsage.heapUsed / memUsage.heapTotal;
    
    let status = 'healthy';
    if (memoryPercent > 0.9 || this.getAverageResponseTime() > 2000) {
      status = 'critical';
    } else if (memoryPercent > 0.75 || this.getAverageResponseTime() > 1000) {
      status = 'warning';
    }
    
    return {
      status,
      memory: {
        used: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        percentage: `${(memoryPercent * 100).toFixed(1)}%`
      },
      responseTime: {
        average: `${this.getAverageResponseTime()}ms`,
        status: this.getAverageResponseTime() > this.thresholds.responseTime ? 'slow' : 'normal'
      }
    };
  }

  /**
   * 获取性能指标
   * @returns {Object} 性能指标
   */
  getPerformanceMetrics() {
    return {
      averageResponseTime: this.getAverageResponseTime(),
      throughput: this.calculateThroughput(),
      errorRate: this.metrics.performance.errorRate,
      activeConnections: this.metrics.performance.activeConnections,
      trends: this.calculateTrends()
    };
  }

  /**
   * 计算吞吐量
   * @returns {number} 每分钟请求数
   */
  calculateThroughput() {
    const oneMinuteAgo = Date.now() - 60000;
    const recentRequests = this.metrics.performance.responseTime.filter(
      record => record.timestamp > oneMinuteAgo
    );
    return recentRequests.length;
  }

  /**
   * 计算趋势
   * @returns {Object} 趋势信息
   */
  calculateTrends() {
    const trends = {};
    
    ['responseTime', 'memoryUsage', 'throughput'].forEach(metric => {
      const history = this.history[metric] || [];
      if (history.length >= 2) {
        const recent = history.slice(-5);
        const older = history.slice(-10, -5);
        
        const recentAvg = recent.reduce((sum, item) => sum + item.value, 0) / recent.length;
        const olderAvg = older.reduce((sum, item) => sum + item.value, 0) / older.length;
        
        const change = ((recentAvg - olderAvg) / olderAvg) * 100;
        
        trends[metric] = {
          direction: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
          change: `${change.toFixed(1)}%`
        };
      }
    });
    
    return trends;
  }

  /**
   * 获取最近的警报
   * @returns {Array} 最近的警报列表
   */
  getRecentAlerts() {
    const oneHourAgo = Date.now() - 3600000;
    return this.metrics.alerts.filter(alert => alert.timestamp > oneHourAgo);
  }

  /**
   * 格式化运行时间
   * @param {number} seconds - 秒数
   * @returns {string} 格式化的时间
   */
  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return `${days}d ${hours}h ${minutes}m`;
  }

  /**
   * 清理历史数据
   */
  cleanupHistory() {
    const oneHourAgo = Date.now() - 3600000;
    
    Object.keys(this.history).forEach(metric => {
      if (Array.isArray(this.history[metric])) {
        this.history[metric] = this.history[metric].filter(
          item => item.timestamp > oneHourAgo
        );
      }
    });
    
    // 清理旧的响应时间记录
    this.metrics.performance.responseTime = this.metrics.performance.responseTime.filter(
      record => record.timestamp > oneHourAgo
    );
    
    logger.debug('Performance history cleanup completed');
  }

  /**
   * 获取实时仪表盘数据
   * @returns {Object} 仪表盘数据
   */
  getDashboardData() {
    return {
      system: this.getSystemHealth(),
      performance: this.getPerformanceMetrics(),
      game: this.metrics.game,
      alerts: this.getRecentAlerts().slice(0, 10),
      charts: {
        responseTime: this.history.responseTime.slice(-20),
        memoryUsage: this.history.memoryUsage.slice(-20),
        throughput: this.history.throughput.slice(-20)
      }
    };
  }

  /**
   * 重置所有指标
   */
  reset() {
    this.metrics.performance = {
      responseTime: [],
      throughput: 0,
      errorRate: 0,
      activeConnections: 0
    };
    
    this.metrics.game = {
      activeRooms: 0,
      totalGames: 0,
      averageGameDuration: 0,
      peakConcurrentPlayers: 0
    };
    
    this.metrics.alerts = [];
    
    Object.keys(this.history).forEach(key => {
      this.history[key] = [];
    });
    
    logger.info('Performance dashboard metrics reset');
  }
}

// 创建中间件用于记录API响应时间
function createPerformanceMiddleware(dashboard) {
  return (req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      dashboard.recordResponseTime(responseTime);
      
      // 记录错误
      if (res.statusCode >= 400) {
        const currentErrorRate = dashboard.metrics.performance.errorRate;
        dashboard.metrics.performance.errorRate = (currentErrorRate * 0.9) + (0.1);
      } else {
        dashboard.metrics.performance.errorRate *= 0.99;
      }
    });
    
    next();
  };
}

// 创建全局性能仪表盘实例
const performanceDashboard = new PerformanceDashboard();

module.exports = { 
  PerformanceDashboard, 
  performanceDashboard, 
  createPerformanceMiddleware 
};
