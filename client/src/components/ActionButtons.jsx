import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import PlayerTimer from './PlayerTimer';
import { X, Check, TrendingUp, Zap } from 'lucide-react';

const ActionButtons = ({ player, gameState, currentPlayerId, players }) => {
  const { playerAction } = useGame();
  const [raiseAmount, setRaiseAmount] = useState('');
  const [showRaiseInput, setShowRaiseInput] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);

  // 检查是否是当前玩家的回合
  const isCurrentTurn = gameState && gameState.currentPlayerIndex !== undefined && gameState.currentPlayerIndex === players.findIndex((p) => p.id === currentPlayerId);

  // 检查玩家是否可以操作
  const canAct = isCurrentTurn && !player.folded && !player.allIn;

  // 检查是否可以过牌
  const canCheck = canAct && player.currentBet >= gameState.currentBet;

  // 检查是否可以加注
  const canRaise = canAct && player.chips > gameState.currentBet;

  // 计算底池大小
  const potSize = gameState?.pot || 0;

  // 计算需要跟注的金额
  const callAmount = gameState.currentBet - player.currentBet;

  // 获取大盲注作为步进单位
  const bigBlind = gameState?.bigBlind || gameState?.minRaise || 20;
  const stepSize = bigBlind;

  // 辅助函数：将值对齐到大盲的倍数
  const alignToBigBlind = (value) => {
    if (!bigBlind || bigBlind <= 0) return value;

    // 确保不低于最小加注
    const minValue = Math.max(gameState.minRaise, bigBlind);
    if (value < minValue) return minValue;

    // 对齐到大盲的倍数
    const remainder = value % bigBlind;
    if (remainder === 0) return value;

    // 向上舍入到最近的大盲倍数
    return value + (bigBlind - remainder);
  };

  // 计算快捷加注金额（对齐到大盲倍数）
  const quickRaiseSizes = [
    { label: '1/3池', amount: alignToBigBlind(Math.max(gameState.minRaise, Math.floor(potSize / 3))) },
    { label: '1/2池', amount: alignToBigBlind(Math.max(gameState.minRaise, Math.floor(potSize / 2))) },
    { label: '1x池', amount: alignToBigBlind(Math.max(gameState.minRaise, potSize)) },
    { label: '1.2x池', amount: alignToBigBlind(Math.max(gameState.minRaise, Math.floor(potSize * 1.2))) },
  ].filter((raise) => raise.amount <= player.chips);

  // 初始化滑块值为最小加注（对齐到大盲）
  useEffect(() => {
    if (gameState?.minRaise && sliderValue === 0) {
      const alignedMinRaise = alignToBigBlind(gameState.minRaise);
      setSliderValue(alignedMinRaise);
      setRaiseAmount(alignedMinRaise.toString());
    }
  }, [gameState?.minRaise, sliderValue, bigBlind]);

  const handleAction = (action, amount = 0) => {
    if (canAct) {
      playerAction(action, amount);
      setShowRaiseInput(false);
      setRaiseAmount('');
      setSliderValue(gameState?.minRaise || 0);
    }
  };

  const handleSliderChange = (e) => {
    const value = parseInt(e.target.value);
    setSliderValue(value);
    setRaiseAmount(value.toString());
  };

  const handleQuickRaise = (amount) => {
    if (amount <= player.chips) {
      handleAction('raise', amount);
    }
  };

  const handleCustomRaise = () => {
    const amount = sliderValue;
    if (amount && amount >= gameState.minRaise && amount <= player.chips) {
      // 如果滑到最大值，执行All-in
      if (amount === player.chips) {
        handleAction('call', player.chips);
      } else {
        handleAction('raise', amount);
      }
    }
  };

  if (!canAct) {
    return (
      <div className="flex items-center justify-center h-12 px-4 bg-gray-800/90 backdrop-blur-sm rounded-xl border border-gray-600">
        <div className="text-center text-gray-400 text-sm">{player.folded ? '已弃牌' : player.allIn ? 'All-in' : '等待其他玩家'}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-3 max-w-sm mx-auto">
      {/* 玩家计时器 */}
      <PlayerTimer
        timeRemaining={gameState?.timeRemaining || 0}
        isCurrentTurn={isCurrentTurn}
      />

      {/* 主要操作按钮 - 横向排列 */}
      <div className="flex items-center gap-2 bg-gray-900/95 backdrop-blur-sm px-3 py-2 rounded-2xl border border-gray-700/50 shadow-xl">
        {/* 弃牌 */}
        <button
          onClick={() => handleAction('fold')}
          className="w-11 h-11 bg-red-600/90 hover:bg-red-500 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-red-500/30 transform hover:scale-105 flex items-center justify-center text-sm font-bold"
          title="弃牌"
        >
          弃
        </button>

        {/* 过牌/跟注 */}
        {canCheck ? (
          <button
            onClick={() => handleAction('check')}
            className="h-11 px-4 bg-green-600/90 hover:bg-green-500 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-green-500/30 transform hover:scale-105 text-sm font-bold"
            title="过牌"
          >
            过牌
          </button>
        ) : (
          <button
            onClick={() => handleAction('call')}
            className="h-11 px-4 bg-blue-600/90 hover:bg-blue-500 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/30 transform hover:scale-105 text-sm font-bold"
            title={`跟注 ${callAmount}`}
          >
            跟{callAmount}
          </button>
        )}

        {/* 加注 */}
        {canRaise && (
          <button
            onClick={() => setShowRaiseInput(!showRaiseInput)}
            className={`w-11 h-11 ${
              showRaiseInput ? 'bg-yellow-500/90' : 'bg-yellow-600/90 hover:bg-yellow-500'
            } text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-yellow-500/30 transform hover:scale-105 flex items-center justify-center text-sm font-bold`}
            title="加注"
          >
            加
          </button>
        )}

        {/* All-in */}
        {canRaise && (
          <button
            onClick={() => handleAction('call', player.chips)}
            className="h-11 px-3 bg-purple-600/90 hover:bg-purple-500 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-purple-500/30 transform hover:scale-105 text-sm font-bold"
            title={`All-in (${player.chips})`}
          >
            梭
          </button>
        )}
      </div>

      {/* 快捷加注按钮组 */}
      {canRaise && !showRaiseInput && quickRaiseSizes.length > 0 && (
        <div className="w-full">
          <div className="text-xs text-gray-400 text-center mb-2 font-medium">快捷加注 (底池: {potSize})</div>
          <div className="grid grid-cols-2 gap-2">
            {quickRaiseSizes.map((raise, index) => (
              <button
                key={index}
                onClick={() => handleQuickRaise(raise.amount)}
                className="quick-raise-btn flex flex-col items-center justify-center h-16 text-white rounded-lg border border-orange-500/30"
              >
                <div className="text-xs font-medium opacity-90">{raise.label}</div>
                <div className="text-sm font-bold">{raise.amount}</div>
                <div className="text-xs opacity-75">{Math.round(raise.amount / bigBlind)}BB</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 自定义加注滑块和输入 */}
      {showRaiseInput && canRaise && (
        <div className="w-full bg-gray-800/95 backdrop-blur-sm p-4 rounded-xl border border-gray-600 shadow-lg">
          <div className="text-sm text-gray-300 text-center mb-3 font-medium">自定义加注</div>

          {/* 滑块 */}
          <div className="mb-4">
            <input
              type="range"
              min={gameState.minRaise}
              max={player.chips}
              step={stepSize}
              value={sliderValue}
              onChange={handleSliderChange}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer slider ${sliderValue === player.chips ? 'all-in-slider' : ''}`}
              style={{
                background:
                  sliderValue === player.chips
                    ? `linear-gradient(to right, #a855f7 0%, #a855f7 100%)`
                    : `linear-gradient(to right, #f59e0b 0%, #f59e0b ${((sliderValue - gameState.minRaise) / (player.chips - gameState.minRaise)) * 100}%, #374151 ${
                        ((sliderValue - gameState.minRaise) / (player.chips - gameState.minRaise)) * 100
                      }%, #374151 100%)`,
              }}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>最小: {gameState.minRaise}</span>
              <span className={`font-medium ${sliderValue === player.chips ? 'text-purple-400 animate-pulse' : 'text-purple-400'}`}>All-in: {player.chips}</span>
            </div>
            <div className="text-center text-xs text-gray-500 mt-1">
              步进: {stepSize} (1大盲) | 大盲: {bigBlind}
            </div>
            {sliderValue === player.chips && <div className="text-center text-purple-400 text-sm font-bold mt-1 animate-pulse">🚀 全押！</div>}
          </div>

          {/* 当前加注金额显示 */}
          <div className="text-center mb-3">
            <div className="text-lg font-bold text-yellow-400">{sliderValue === player.chips ? 'All-in' : `加注 ${sliderValue}`}</div>
            <div className="text-xs text-gray-400">{sliderValue === player.chips ? '全部筹码' : `总下注: ${sliderValue}`}</div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCustomRaise}
              className={`flex-1 h-10 ${
                sliderValue === player.chips ? 'bg-purple-600 hover:bg-purple-500' : 'bg-green-600 hover:bg-green-500'
              } text-white rounded-lg text-sm font-bold transition-all duration-200 shadow-md hover:shadow-lg`}
            >
              {sliderValue === player.chips ? 'All-in' : '确认加注'}
            </button>
            <button
              onClick={() => {
                const alignedMinRaise = alignToBigBlind(gameState?.minRaise || 0);
                setShowRaiseInput(false);
                setRaiseAmount(alignedMinRaise.toString());
                setSliderValue(alignedMinRaise);
              }}
              className="flex-1 h-10 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm font-medium transition-all duration-200"
            >
              取消
            </button>
          </div>

          <div className="text-xs text-gray-400 mt-2 text-center">
            范围: {gameState.minRaise} - {player.chips} 筹码
          </div>
        </div>
      )}

      {/* 状态信息 */}
      <div className="flex items-center space-x-4 text-xs text-gray-400 bg-gray-800/70 px-4 py-2 rounded-xl border border-gray-700">
        <span className="flex items-center">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
          筹码: <span className="font-bold ml-1">{player.chips}</span>
        </span>
        <span className="flex items-center">
          <div className="w-2 h-2 bg-blue-400 rounded-full mr-1"></div>
          当前下注: <span className="font-bold ml-1">{gameState.currentBet}</span>
        </span>
        <span className="flex items-center">
          <div className="w-2 h-2 bg-yellow-400 rounded-full mr-1"></div>
          底池: <span className="font-bold ml-1">{potSize}</span>
        </span>
      </div>
    </div>
  );
};

export default ActionButtons;
