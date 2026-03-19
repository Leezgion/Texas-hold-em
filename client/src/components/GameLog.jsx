import React, { useEffect, useRef } from 'react';

import { ScrollText } from 'lucide-react';

/**
 * 游戏日志组件
 * 显示玩家操作历史，自动滚动到最新消息
 */
const GameLog = ({ logs = [], title = '游戏日志', emptyText = '暂无操作记录' }) => {
  const logEndRef = useRef(null);

  // 自动滚动到最新消息
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getActionText = (log) => {
    switch (log.action) {
      case 'fold':
        return '弃牌';
      case 'check':
        return '过牌';
      case 'call':
        return `跟注 ${log.amount}`;
      case 'raise':
        return `加注至 ${log.amount}`;
      case 'bet':
        return `下注 ${log.amount}`;
      case 'allin':
        return `All-in ${log.amount}`;
      case 'win':
        return `获胜，赢得 ${log.amount}`;
      case 'join':
        return '加入游戏';
      case 'leave':
        return '离开游戏';
      default:
        return log.action;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'fold':
        return 'text-red-400';
      case 'check':
        return 'text-gray-400';
      case 'call':
        return 'text-blue-400';
      case 'raise':
      case 'bet':
        return 'text-yellow-400';
      case 'allin':
        return 'text-purple-400';
      case 'win':
        return 'text-green-400';
      default:
        return 'text-gray-300';
    }
  };

  if (logs.length === 0) {
    return (
      <div className="bg-gray-800/90 backdrop-blur-xs rounded-lg p-4 border border-gray-700">
        <div className="flex items-center space-x-2 mb-3">
          <ScrollText size={18} className="text-poker-gold" />
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
        <div className="text-sm text-gray-400 text-center py-4">
          {emptyText}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/90 backdrop-blur-xs rounded-lg p-4 border border-gray-700">
      <div className="flex items-center space-x-2 mb-3">
        <ScrollText size={18} className="text-poker-gold" />
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>

      <div className="max-h-48 overflow-y-auto space-y-1 game-log-scrollbar">
        {logs.map((log, index) => (
          <div
            key={index}
            className="text-xs py-1 px-2 rounded bg-gray-700/50 hover:bg-gray-700/70 transition-colors"
          >
            <span className="text-poker-gold font-medium">{log.player}</span>
            <span className={`ml-2 ${getActionColor(log.action)}`}>
              {getActionText(log)}
            </span>
            {log.timestamp && (
              <span className="text-gray-500 ml-2">
                {new Date(log.timestamp).toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  );
};

export default GameLog;
