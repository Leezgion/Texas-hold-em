import React, { useState } from 'react';

import Card from './Card';
import { useGame } from '../contexts/GameContext';

const Player = ({ player, isCurrentPlayer, isCurrentTurn, gameState, gameStarted, isActiveTimer, getPositionLabel }) => {
  const [showHand, setShowHand] = useState(false);
  const { changeSeat } = useGame();

  const handleCardClick = () => {
    if (isCurrentPlayer && player.hand.length > 0) {
      setShowHand(!showHand);
    }
  };

  const handleSeatChange = (newSeat) => {
    if (player.folded || !player.isActive) {
      changeSeat(player.seat, newSeat);
    }
  };

  const getStatusText = () => {
    if (!gameStarted) return '等待开始';
    if (player.isSpectator) return '观战中';
    if (player.waitingForNextRound) return '等待下轮';
    if (player.folded) return '已弃牌';
    if (player.allIn) return 'All-in';
    if (player.currentBet > 0) return `下注: ${player.currentBet}`;
    return '等待中';
  };

  const getStatusColor = () => {
    if (player.isSpectator) return 'text-purple-400';
    if (player.waitingForNextRound) return 'text-yellow-400';
    if (player.folded) return 'text-red-400';
    if (player.allIn) return 'text-poker-gold';
    if (player.currentBet > 0) return 'text-blue-400';
    return 'text-gray-400';
  };

  // 简化设备ID显示
  const getDisplayName = (nickname) => {
    if (nickname.startsWith('房主-')) {
      return '房主';
    }
    // 如果是设备ID，显示前6位
    if (nickname.length > 10) {
      return nickname.slice(0, 6) + '...';
    }
    return nickname;
  };

  // 如果不是当前玩家，使用简化布局
  if (!isCurrentPlayer) {
    return (
      <div className="text-center relative ">
        {/* 紧凑的玩家信息卡片 */}
        <div
          className={`bg-gray-800/90 backdrop-blur-sm rounded-lg p-2 border ${
            player.allIn
              ? 'border-purple-500 shadow-lg shadow-purple-500/40'
              : isActiveTimer 
              ? 'border-yellow-400 shadow-lg shadow-yellow-400/30 animate-pulse' 
              : isCurrentTurn 
              ? 'border-blue-400 shadow-lg shadow-blue-400/20' 
              : 'border-gray-600'
          } ${player.folded ? 'opacity-60' : ''} ${player.allIn ? 'bg-purple-900/30' : ''}`}
        >
          {/* 玩家昵称 */}
          <div className="flex items-center justify-center mb-1">
            <span className="font-semibold text-white text-sm truncate max-w-[50px]" title={player.nickname}>
              {getDisplayName(player.nickname)}
            </span>
            {player.isHost && <span className="text-poker-gold ml-1 text-xs">👑</span>}
            {player.allIn && <span className="text-purple-400 ml-1 text-xs">🚀</span>}
          </div>

          {/* 筹码数量 */}
          <div className={`font-semibold text-xs mb-1 ${player.allIn ? 'text-purple-400' : 'text-poker-gold'}`}>
            {player.chips}
          </div>

          {/* 状态指示 */}
          {player.folded ? (
            <div className="text-red-400 text-xs font-medium">弃牌</div>
          ) : player.allIn ? (
            <div className="text-purple-400 text-xs font-medium animate-pulse">All-in</div>
          ) : (
            <div className="w-2 h-2 bg-green-400 rounded-full mx-auto"></div>
          )}
        </div>

        {/* 当前回合指示器 */}
        {isCurrentTurn && !player.allIn && (
          <div className={`absolute -top-1 -left-1 w-3 h-3 ${
            isActiveTimer ? 'bg-yellow-400' : 'bg-blue-400'
          } rounded-full animate-pulse`}></div>
        )}

        {/* All-in特效 */}
        {player.allIn && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full animate-ping"></div>
        )}

        {/* 位置标记 - 只在游戏开始后显示 */}
        {gameStarted && getPositionLabel && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <div className={`text-white text-xs px-2 py-0.5 rounded-full border ${
              player.allIn 
                ? 'bg-purple-700/90 border-purple-500' 
                : 'bg-gray-700/90 border-gray-600'
            }`}>
              {getPositionLabel(player.seat)}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 当前玩家保持原有的详细显示（实际上当前玩家信息已移到底部面板）
  return (
    <div className="text-center relative min-w-[120px]">
      {/* 玩家昵称 */}
      <div className="mb-2">
        <div className="font-semibold text-white truncate" title={player.nickname}>
          {getDisplayName(player.nickname)}
          {player.isHost && <span className="text-poker-gold ml-1">👑</span>}
        </div>

        {/* 状态指示器 */}
        <div className={`text-sm ${getStatusColor()}`}>{getStatusText()}</div>
      </div>

      {/* 筹码信息 */}
      <div className="mb-2">
        <div className="text-poker-gold font-semibold">{player.chips}</div>
        {player.currentBet > 0 && <div className="text-blue-400 text-sm">当前下注: {player.currentBet}</div>}
      </div>

      {/* 操作按钮 */}
      <div className="space-y-1">
        {/* 换座按钮 */}
        {!gameState && (player.folded || !player.isActive) && (
          <button
            onClick={() => {
              const newSeat = prompt('请输入目标座位号 (0-9):');
              if (newSeat && !isNaN(newSeat)) {
                handleSeatChange(parseInt(newSeat));
              }
            }}
            className=" warning text-xs px-2 py-1 w-full"
          >
            换座
          </button>
        )}

        {/* 亮牌/盖牌按钮 */}
        {gameState?.phase === 'showdown' && (
          <div className="flex space-x-1">
            <button
              onClick={() => useGame.getState().showHand()}
              className=" success text-xs px-2 py-1 flex-1"
            >
              亮牌
            </button>
            <button
              onClick={() => useGame.getState().muckHand()}
              className=" danger text-xs px-2 py-1 flex-1"
            >
              盖牌
            </button>
          </div>
        )}
      </div>

      {/* 当前回合指示器 */}
      {isCurrentTurn && <div className="absolute -top-2 -left-2 w-4 h-4 bg-poker-blue rounded-full animate-pulse"></div>}

      {/* 房主标识 */}
      {player.isHost && <div className="absolute -top-2 -right-2 text-poker-gold text-lg">👑</div>}
    </div>
  );
};

export default Player;
