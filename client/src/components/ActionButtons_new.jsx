import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import PlayerTimer from './PlayerTimer';

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
      <div className="flex items-center justify-center h-10 px-3 bg-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-700/50">
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

      {/* 主要操作按钮 - 横向排列，紧凑设计 */}
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
            className="h-11 px-4 bg-green-600/90 hover:bg-green-500 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-green-500/30 transform hover:scale-105 text-sm font-bold whitespace-nowrap"
            title="过牌"
          >
            过牌
          </button>
        ) : (
          <button
            onClick={() => handleAction('call')}
            className="h-11 px-4 bg-blue-600/90 hover:bg-blue-500 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/30 transform hover:scale-105 text-sm font-bold whitespace-nowrap"
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

      {/* 快捷加注 - 4列网格布局更紧凑 */}
      {canRaise && !showRaiseInput && quickRaiseSizes.length > 0 && (
        <div className="w-full">
          <div className="text-xs text-gray-500 text-center mb-1">快捷加注</div>
          <div className="grid grid-cols-4 gap-1">
            {quickRaiseSizes.map((raise, index) => (
              <button
                key={index}
                onClick={() => handleQuickRaise(raise.amount)}
                className="flex flex-col items-center justify-center h-12 text-white rounded-lg bg-orange-700/60 hover:bg-orange-600/80 border border-orange-600/40 transition-all duration-200 hover:scale-105"
              >
                <div className="text-xs font-medium leading-none">{raise.label}</div>
                <div className="text-sm font-bold leading-none mt-0.5">{raise.amount}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 自定义加注滑块 - 简化设计 */}
      {showRaiseInput && canRaise && (
        <div className="w-full bg-gray-900/95 backdrop-blur-sm p-3 rounded-2xl border border-gray-700/50 shadow-xl">
          <div className="text-sm text-gray-300 text-center mb-2">自定义加注</div>

          {/* 滑块 */}
          <div className="mb-3">
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
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{gameState.minRaise}</span>
              <span className={`${sliderValue === player.chips ? 'text-purple-400' : 'text-gray-400'}`}>{player.chips}</span>
            </div>
          </div>

          {/* 当前加注金额 */}
          <div className="text-center mb-2">
            <div className="text-lg font-bold text-yellow-400">{sliderValue === player.chips ? 'All-in' : sliderValue}</div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCustomRaise}
              className={`flex-1 h-9 ${
                sliderValue === player.chips ? 'bg-purple-600/90 hover:bg-purple-500' : 'bg-green-600/90 hover:bg-green-500'
              } text-white rounded-lg text-sm font-bold transition-all duration-200`}
            >
              {sliderValue === player.chips ? '梭哈' : '确认'}
            </button>
            <button
              onClick={() => {
                const alignedMinRaise = alignToBigBlind(gameState?.minRaise || 0);
                setShowRaiseInput(false);
                setRaiseAmount(alignedMinRaise.toString());
                setSliderValue(alignedMinRaise);
              }}
              className="flex-1 h-9 bg-gray-600/90 hover:bg-gray-500 text-white rounded-lg text-sm font-medium transition-all duration-200"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 状态信息 - 更紧凑 */}
      <div className="flex items-center gap-3 text-xs text-gray-500 bg-gray-900/70 px-3 py-1.5 rounded-xl border border-gray-700/50">
        <span className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
          筹码<span className="font-bold text-green-400">{player.chips}</span>
        </span>
        <span className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
          下注<span className="font-bold text-blue-400">{gameState.currentBet}</span>
        </span>
        <span className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
          底池<span className="font-bold text-yellow-400">{potSize}</span>
        </span>
      </div>
    </div>
  );
};

export default ActionButtons;
