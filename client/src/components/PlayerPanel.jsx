import { ChevronDown, ChevronUp, Crown, Eye, Users, Gamepad2 } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

const PlayerPanel = ({ players = [], roomSettings = {}, currentPlayerId }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const panelRef = useRef(null);

  // 点击外部区域关闭面板
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isExpanded]);

  // 分类玩家
  // 添加空值检查
  if (!roomSettings) {
    return (
      <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white">
        <div className="flex items-center space-x-2">
          <Users size={16} className="text-purple-400" />
          <span className="text-sm font-medium">连接中...</span>
        </div>
      </div>
    );
  }

  // 如果players未定义，使用空数组
  const playersArray = players || [];

  const seatedPlayers = playersArray.filter(player => player.seat !== -1 && !player.isSpectator);
  const spectators = playersArray.filter(player => player.seat === -1 || player.isSpectator);
  
  const maxPlayers = roomSettings.maxPlayers || 6;
  const totalPlayers = playersArray.length;

  // 获取玩家状态文本和图标
  const getPlayerStatus = (player) => {
    if (player.isSpectator) return { text: '观战中', icon: Eye };
    if (player.waitingForNextRound) return { text: '等待下轮', icon: null };
    if (player.folded) return { text: '已弃牌', icon: null };
    if (player.allIn) return { text: 'All-in', icon: null };
    if (!player.isActive) return { text: '未激活', icon: null };
    return { text: '游戏中', icon: Gamepad2 };
  };

  // 获取状态颜色
  const getStatusColor = (player) => {
    if (player.isSpectator) return 'text-purple-400';
    if (player.waitingForNextRound) return 'text-yellow-400';
    if (player.folded) return 'text-red-400';
    if (player.allIn) return 'text-orange-400';
    if (!player.isActive) return 'text-gray-400';
    return 'text-green-400';
  };

  // 获取玩家显示名称
  const getDisplayName = (player) => {
    if (player.nickname.startsWith('房主-')) {
      return '房主';
    }
    if (player.nickname.length > 12) {
      return player.nickname.slice(0, 8) + '...';
    }
    return player.nickname;
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* 主按钮 - 显示人数统计 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`bg-gray-800/90 backdrop-blur-sm px-3 py-2 rounded-lg border transition-all duration-200 ${
          isExpanded 
            ? 'border-blue-500 shadow-lg shadow-blue-500/20' 
            : 'border-gray-600 hover:border-gray-500'
        }`}
      >
        <div className="flex items-center space-x-2 text-sm">
          <Users size={16} className={isExpanded ? 'text-blue-400' : 'text-gray-400'} />
          <span className="text-gray-300">
            {totalPlayers}/{maxPlayers}
          </span>
          {totalPlayers > 0 && (
            <span className="text-xs text-gray-400">
              ({seatedPlayers.length}座 {spectators.length > 0 ? `${spectators.length}观` : ''})
            </span>
          )}
          {isExpanded ? 
            <ChevronUp size={14} className="text-blue-400" /> : 
            <ChevronDown size={14} className="text-gray-400" />
          }
        </div>
      </button>

      {/* 展开的玩家列表面板 */}
      {isExpanded && (
        <div className="absolute top-full left-0 mt-2 w-80 max-w-[90vw] bg-gray-800/95 backdrop-blur-sm rounded-lg border border-gray-600 shadow-xl z-20 max-h-96 overflow-y-auto player-panel-scrollbar">
          <div className="p-4">
            {/* 标题 */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                <Users size={16} className="text-blue-400" />
                <span>房间成员</span>
              </h3>
              <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                {totalPlayers}/{maxPlayers}
              </span>
            </div>

            {/* 入座玩家列表 */}
            {seatedPlayers.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center space-x-1 mb-2">
                  <Gamepad2 size={14} className="text-green-400" />
                  <span className="text-xs font-medium text-green-400">
                    入座玩家 ({seatedPlayers.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {seatedPlayers
                    .sort((a, b) => a.seat - b.seat)
                    .map(player => {
                      const status = getPlayerStatus(player);
                      const StatusIcon = status.icon;
                      return (
                      <div
                        key={player.id}
                        className={`flex items-center justify-between p-2 rounded-md transition-colors ${
                          player.id === currentPlayerId 
                            ? 'bg-blue-500/20 border border-blue-500/30' 
                            : 'bg-gray-700/50 hover:bg-gray-700/70'
                        }`}
                      >
                        <div className="flex items-center space-x-2 min-w-0">
                          <div className="flex items-center space-x-1 flex-shrink-0">
                            <span className="text-xs bg-gray-600 px-1.5 py-0.5 rounded text-gray-300">
                              座{player.seat + 1}
                            </span>
                            {player.isHost && <Crown size={12} className="text-yellow-400" />}
                            {player.id === currentPlayerId && (
                              <span className="text-xs text-blue-400">(我)</span>
                            )}
                          </div>
                          <span className="text-sm text-white truncate" title={player.nickname}>
                            {getDisplayName(player)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <span className="text-xs text-yellow-400 font-mono">
                            {player.chips.toLocaleString()}
                          </span>
                          <div className={`flex items-center space-x-1 ${getStatusColor(player)}`}>
                            {StatusIcon && <StatusIcon size={12} />}
                            <span className="text-xs">
                              {status.text}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 观战玩家列表 */}
            {spectators.length > 0 && (
              <div>
                <div className="flex items-center space-x-1 mb-2">
                  <Eye size={14} className="text-purple-400" />
                  <span className="text-xs font-medium text-purple-400">
                    观战玩家 ({spectators.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {spectators.map(player => {
                    const status = getPlayerStatus(player);
                    const StatusIcon = status.icon;
                    return (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-2 rounded-md transition-colors ${
                        player.id === currentPlayerId 
                          ? 'bg-purple-500/20 border border-purple-500/30' 
                          : 'bg-gray-700/30 hover:bg-gray-700/50'
                      }`}
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          {player.isHost && <Crown size={12} className="text-yellow-400" />}
                          {player.id === currentPlayerId && (
                            <span className="text-xs text-purple-400">(我)</span>
                          )}
                          {StatusIcon && <StatusIcon size={12} className="text-purple-400" />}
                        </div>
                        <span className="text-sm text-gray-300 truncate" title={player.nickname}>
                          {getDisplayName(player)}
                        </span>
                      </div>
                      <span className={`text-xs ${getStatusColor(player)} flex items-center space-x-1`}>
                        <span>{status.text}</span>
                      </span>
                    </div>
                  );
                })}
                </div>
              </div>
            )}

            {/* 无玩家时的提示 */}
            {totalPlayers === 0 && (
              <div className="text-center py-4">
                <Users size={24} className="text-gray-500 mx-auto mb-2" />
                <p className="text-sm text-gray-400">暂无玩家</p>
              </div>
            )}

            {/* 座位状态提示 */}
            {seatedPlayers.length < maxPlayers && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <p className="text-xs text-gray-400 text-center">
                  还有 {maxPlayers - seatedPlayers.length} 个空座位
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerPanel;
