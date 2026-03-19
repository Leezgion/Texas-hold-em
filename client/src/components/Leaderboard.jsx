import React, { useState } from 'react';
import { deriveProPlayerSummary } from '../view-models/gameViewModel';

const Leaderboard = ({
  players,
  roomState = 'idle',
  gameState = null,
  currentPlayerId = null,
  effectiveDisplayMode = 'pro',
}) => {
  // 按筹码排序
  const sortedPlayers = [...players].sort((a, b) => b.chips - a.chips);
  const [isExpanded, setIsExpanded] = useState(false); // 默认收起，节省空间
  const isProMode = effectiveDisplayMode === 'pro';

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-600 overflow-hidden">
      {/* 标题栏 - 可点击展开/收起 */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-700 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-xl font-bold text-poker-gold">排行榜</h3>
        <div className="flex items-center space-x-2">
          {/* 玩家数量指示器 */}
          <span className="text-sm bg-poker-gold text-black px-2 py-1 rounded-full font-semibold">{players.length}</span>
          {/* 收起时显示领先者信息 */}
          {!isExpanded && sortedPlayers.length > 0 && (
            <div className="max-w-[11rem] truncate text-sm text-gray-300">
              👑 {sortedPlayers[0].nickname}: {sortedPlayers[0].chips}
            </div>
          )}
          {/* 展开/收起图标 */}
          <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
            <svg
              className="w-5 h-5 text-poker-gold"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* 可折叠的内容区域 */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-4 pt-0">
          {/* 玩家列表 */}
          <div className="space-y-2 mb-4 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            {sortedPlayers.map((player, index) => {
              const proSummary = deriveProPlayerSummary(player, {
                roomState,
                players,
                gameState,
              });

              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    index === 0
                      ? 'border-poker-gold bg-yellow-900 bg-opacity-20'
                      : index === 1
                      ? 'border-gray-400 bg-gray-700 bg-opacity-20'
                      : index === 2
                      ? 'border-yellow-600 bg-yellow-800 bg-opacity-20'
                      : 'border-gray-600 bg-gray-700'
                  } ${player.id === currentPlayerId ? 'ring-1 ring-blue-400/50' : ''}`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-poker-gold text-black' : index === 1 ? 'bg-gray-400 text-black' : index === 2 ? 'bg-yellow-600 text-black' : 'bg-gray-600 text-white'
                      }`}
                    >
                      {index + 1}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1 font-semibold text-white">
                        <span className="truncate">{player.nickname}</span>
                        {player.isHost && <span className="text-poker-gold ml-1">👑</span>}
                        {player.id === currentPlayerId && <span className="ml-1 text-xs text-blue-300">(我)</span>}
                      </div>

                      {isProMode ? (
                        <div className="text-xs text-gray-400">
                          {[proSummary.seatLabel, proSummary.positionLabel, proSummary.statusLabel].filter(Boolean).join(' · ')}
                        </div>
                      ) : (
                        <div className="text-xs">
                          {player.folded ? (
                            <span className="text-red-400">已弃牌</span>
                          ) : player.allIn ? (
                            <span className="text-poker-gold">All-in</span>
                          ) : player.currentBet > 0 ? (
                            <span className="text-blue-400">下注: {player.currentBet}</span>
                          ) : (
                            <span className="text-gray-400">等待中</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-poker-gold font-bold text-lg">{isProMode ? proSummary.chipsLabel : player.chips}</div>
                    {isProMode ? (
                      <div className={`text-xs ${player.ledger?.sessionNet >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {proSummary.netLabel}
                      </div>
                    ) : (
                      player.currentBet > 0 && <div className="text-blue-400 text-sm">下注: {player.currentBet}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 统计信息 */}
          <div className="pt-4 border-t border-gray-600">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="text-gray-400">总玩家</div>
                <div className="text-white font-semibold">{players.length}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">总筹码</div>
                <div className="text-white font-semibold">{players.reduce((sum, p) => sum + p.chips, 0)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
