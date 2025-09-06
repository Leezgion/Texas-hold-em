/**
 * 接口模块索引 - 统一导出所有接口标准化工具
 */

const { SocketEventManager, socketEventManager } = require('./SocketEventManager');
const { APIResponseManager, apiResponseManager, ValidationSchemas } = require('./APIResponseManager');

module.exports = {
  // Socket事件管理
  SocketEventManager,
  socketEventManager,
  
  // API响应管理
  APIResponseManager,
  apiResponseManager,
  ValidationSchemas
};
