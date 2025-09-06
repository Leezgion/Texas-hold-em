/**
 * 性能优化工具集索引
 * 统一导出所有性能优化相关工具
 */

const { Logger, logger, logPerformance } = require('./Logger');
const { ResourceManager, resourceManager } = require('./ResourceManager');
const { StateDiffManager, stateDiffManager } = require('./StateDiffManager');
const { PerformanceDashboard, performanceDashboard, createPerformanceMiddleware } = require('./PerformanceDashboard');

module.exports = {
  // 日志系统
  Logger,
  logger,
  logPerformance,
  
  // 资源管理
  ResourceManager,
  resourceManager,
  
  // 状态差异管理
  StateDiffManager,
  stateDiffManager,
  
  // 性能监控
  PerformanceDashboard,
  performanceDashboard,
  createPerformanceMiddleware
};
