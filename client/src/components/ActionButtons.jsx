import React, { useState } from 'react';
import { X, Check, TrendingUp, Zap } from 'lucide-react';

import { useGame } from '../contexts/GameContext';
import PlayerTimer from './PlayerTimer';

const ActionButtons = ({ player, gameState, currentPlayerId, players }) => {
  const { playerAction } = useGame();
  const [raiseAmount, setRaiseAmount] = useState('');
  const [showRaiseInput, setShowRaiseInput] = useState(false);

  // 检查是否是当前玩家的回合
  const isCurrentTurn = gameState && gameState.currentPlayerIndex !== undefined && gameState.currentPlayerIndex === players.findIndex((p) => p.id === currentPlayerId);

  // 检查玩家是否可以操作
  const canAct = isCurrentTurn && !player.folded && !player.allIn;

  // 检查是否可以过牌
  const canCheck = canAct && player.currentBet >= gameState.currentBet;

  // 检查是否可以加注
  const canRaise = canAct && player.chips > gameState.currentBet;

  const handleAction = (action, amount = 0) => {
    if (canAct) {
      playerAction(action, amount);
      setShowRaiseInput(false);
      setRaiseAmount('');
    }
  };

  const handleRaise = () => {
    const amount = parseInt(raiseAmount);
    if (amount && amount >= gameState.minRaise && amount <= player.chips) {
      handleAction('raise', amount);
    } else {
      alert(`加注金额必须在 ${gameState.minRaise} 到 ${player.chips} 之间`);
    }
  };

  if (!canAct) {
    return (
      <div className="flex items-center justify-center h-12 px-4 bg-gray-800/90 backdrop-blur-sm rounded-full border border-gray-600">
        <div className="text-center text-gray-400 text-sm">
          {player.folded ? '已弃牌' : player.allIn ? 'All-in' : '等待其他玩家'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-3">
      {/* 计时器 */}
      <PlayerTimer 
        timeRemaining={gameState?.timeRemaining || 0}
        isCurrentTurn={isCurrentTurn}
      />
      {/* 快速操作按钮 - 水平排列 */}
      <div className="flex items-center space-x-2 bg-gray-800/95 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-600">
        {/* 弃牌 */}
        <div
          onClick={() => handleAction('fold')}
          className="w-10 h-10 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-colors"
          title="弃牌"
        >
          <X size={18} />
        </div>

        {/* 过牌/跟注 */}
        {canCheck ? (
          <div
            onClick={() => handleAction('check')}
            className="w-10 h-10 bg-green-600 hover:bg-green-500 text-white rounded-full flex items-center justify-center transition-colors"
            title="过牌"
          >
            <Check size={18} />
          </div>
        ) : (
          <div
            onClick={() => handleAction('call')}
            className="px-4 h-10 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center transition-colors text-sm font-semibold"
            title={`跟注 ${gameState.currentBet - player.currentBet}`}
          >
            跟注 {gameState.currentBet - player.currentBet}
          </div>
        )}

        {/* 加注 */}
        {canRaise && (
          <div
            onClick={() => setShowRaiseInput(!showRaiseInput)}
            className="w-10 h-10 bg-yellow-600 hover:bg-yellow-500 text-white rounded-full flex items-center justify-center transition-colors"
            title="加注"
          >
            <TrendingUp size={18} />
          </div>
        )}

        {/* All-in */}
        {canRaise && (
          <button
            onClick={() => handleAction('call', player.chips)}
            className="px-4 h-10 bg-purple-600 hover:bg-purple-500 text-white rounded-full flex items-center justify-center transition-colors text-sm font-semibold"
            title={`All-in (${player.chips})`}
          >
            <Zap size={16} className="mr-1" />
            All-in
          </button>
        )}
      </div>

      {/* 加注输入框 */}
      {showRaiseInput && canRaise && (
        <div className="bg-gray-800/95 backdrop-blur-sm p-3 rounded-lg border border-gray-600 w-full max-w-xs">
          <div className="flex items-center space-x-2 mb-2">
            <input
              type="number"
              value={raiseAmount}
              onChange={(e) => setRaiseAmount(e.target.value)}
              placeholder={`最小 ${gameState.minRaise}`}
              min={gameState.minRaise}
              max={player.chips}
              className="form-input flex-1 h-8 text-sm"
              autoFocus
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <button
              onClick={handleRaise}
              className="flex-1 h-8 bg-green-600 hover:bg-green-500 text-white rounded text-sm font-semibold transition-colors"
            >
              确认
            </button>
            <button
              onClick={() => {
                setShowRaiseInput(false);
                setRaiseAmount('');
              }}
              className="flex-1 h-8 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm transition-colors"
            >
              取消
            </button>
          </div>
          <div className="text-xs text-gray-400 mt-1 text-center">
            {gameState.minRaise} - {player.chips}
          </div>
        </div>
      )}

      {/* 简化的状态信息 */}
      <div className="text-xs text-gray-400 text-center bg-gray-800/70 px-3 py-1 rounded-full">
        筹码: {player.chips} | 下注: {gameState.currentBet}
      </div>
    </div>
  );
};

export default ActionButtons;
