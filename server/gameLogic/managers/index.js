/**
 * 游戏逻辑管理器模块索引
 * 统一导出所有管理器类，便于使用
 */

const PlayerManager = require('./PlayerManager');
const BettingManager = require('./BettingManager');
const PotManager = require('./PotManager');
const PhaseManager = require('./PhaseManager');

module.exports = {
  PlayerManager,
  BettingManager,
  PotManager,
  PhaseManager
};
