import { Check, TrendingUp, X, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import PlayerTimer from './PlayerTimer';
import SliderInput from './SliderInput';
import { useGame } from '../contexts/GameContext';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { getDisplayModeTheme } from '../utils/productMode';
import { buildProActionStatRows, deriveProActionSummary, deriveRequestErrorFeedback } from '../view-models/gameViewModel';

function translateActionStatLabel(label, effectiveDisplayMode) {
  const labelMap = {
    'To Call': effectiveDisplayMode === 'study' ? '需跟注' : 'TO CALL',
    'Min Raise': effectiveDisplayMode === 'study' ? '最小加注' : 'MIN RAISE',
    Pot: effectiveDisplayMode === 'study' ? '底池' : 'POT',
    Eff: effectiveDisplayMode === 'study' ? '有效后手' : 'EFF',
  };

  if (effectiveDisplayMode === 'club') {
    return {
      'To Call': '跟注',
      'Min Raise': '最小加',
      Pot: '底池',
      Eff: '后手',
    }[label] || label;
  }

  return labelMap[label] || label;
}

const ActionButtons = ({ player, gameState, currentPlayerId, players, effectiveDisplayMode = 'pro' }) => {
  const { playerAction } = useGame();
  const [raiseAmount, setRaiseAmount] = useState('');
  const [showRaiseInput, setShowRaiseInput] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 检查是否是当前玩家的回合
  const isCurrentTurn = gameState && gameState.currentPlayerIndex !== undefined && gameState.currentPlayerIndex === players.findIndex((p) => p.id === currentPlayerId);

  // 检查玩家是否可以操作（添加isSubmitting检查防止重复提交）
  const canAct = isCurrentTurn && !player.folded && !player.allIn && !isSubmitting;

  // 检查是否可以过牌
  const canCheck = canAct && player.currentBet >= gameState.currentBet;

  // 计算底池大小
  const potSize = gameState?.pot || 0;

  // 计算需要跟注的金额
  const callAmount = Math.max(0, gameState.currentBet - player.currentBet);
  const maxRaiseAmount = Math.max(0, player.chips - callAmount);

  // 检查是否可以加注
  const canRaise = canAct && maxRaiseAmount >= gameState.minRaise;

  // 获取大盲注作为步进单位
  const bigBlind = gameState?.bigBlind || gameState?.minRaise || 20;
  const stepSize = bigBlind;
  const theme = getDisplayModeTheme(effectiveDisplayMode);
  const proActionSummary =
    gameState
      ? deriveProActionSummary({
          currentPlayer: player,
          players,
          gameState,
        })
      : null;
  const proActionStats = buildProActionStatRows(proActionSummary);

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
  ].filter((raise) => raise.amount <= maxRaiseAmount);

  // 初始化滑块值为最小加注（对齐到大盲）
  useEffect(() => {
    if (canRaise && gameState?.minRaise && sliderValue === 0) {
      const alignedMinRaise = alignToBigBlind(gameState.minRaise);
      setSliderValue(alignedMinRaise);
      setRaiseAmount(alignedMinRaise.toString());
    }
  }, [canRaise, gameState?.minRaise, sliderValue, bigBlind]);

  useEffect(() => {
    if (!canRaise) {
      setShowRaiseInput(false);
      setSliderValue(0);
      return;
    }

    if (sliderValue > maxRaiseAmount) {
      setSliderValue(maxRaiseAmount);
      setRaiseAmount(maxRaiseAmount.toString());
    }
  }, [canRaise, sliderValue, maxRaiseAmount]);

  // 收到新游戏状态时解锁UI
  useEffect(() => {
    if (gameState) {
      setIsSubmitting(false);
    }
  }, [gameState]);

  // 超时保护（防止卡死）
  useEffect(() => {
    if (isSubmitting) {
      const timeout = setTimeout(() => {
        console.warn('操作超时，自动解锁UI');
        setIsSubmitting(false);
      }, 5000); // 5秒超时

      return () => clearTimeout(timeout);
    }
  }, [isSubmitting]);

  const handleAction = async (action, amount = 0) => {
    if (canAct && !isSubmitting) {
      setIsSubmitting(true);  // 立即锁定UI
      setShowRaiseInput(false);
      setRaiseAmount('');
      setSliderValue(canRaise ? gameState?.minRaise || 0 : 0);

      try {
        await playerAction(action, amount);
      } catch (error) {
        setIsSubmitting(false);
        const notice = deriveRequestErrorFeedback({
          scope: 'playerAction',
          fallbackPrefix: '操作失败',
          error,
        });
        window.dispatchEvent(new CustomEvent(notice.channel, { detail: notice.detail }));
      }
    }
  };

  const handleSliderChange = (value) => {
    setSliderValue(value);
    setRaiseAmount(value.toString());
  };

  const handleQuickRaise = async (amount) => {
    if (amount <= maxRaiseAmount) {
      await handleAction('raise', amount);
    }
  };

  const handleCustomRaise = async () => {
    const amount = sliderValue;
    if (amount && amount >= gameState.minRaise && amount <= maxRaiseAmount) {
      if (amount === maxRaiseAmount) {
        await handleAction('allin');
      } else {
        await handleAction('raise', amount);
      }
    }
  };

  // 键盘快捷键
  useKeyboardShortcuts({
    canAct,
    canCheck,
    canRaise,
    onFold: () => handleAction('fold'),
    onCheck: () => handleAction('check'),
    onCall: () => handleAction('call'),
    onRaise: () => setShowRaiseInput(true),
    onAllIn: () => handleAction('allin'),
    onCancel: () => setShowRaiseInput(false),
  });

  if (!canAct) {
    return (
      <div className="flex items-center justify-center h-12 px-4 bg-gray-800/90 backdrop-blur-sm rounded-xl border border-gray-600">
        <div className="text-center text-gray-400 text-sm">{player.folded ? '已弃牌' : player.allIn ? 'All-in' : '等待其他玩家'}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-3 max-w-sm mx-auto">
      {canAct && proActionStats.length > 0 && theme.room.actionStatStyle === 'grid' && (
        <div className="grid w-full grid-cols-4 gap-2 rounded-2xl border border-gray-700/70 bg-gray-900/95 p-2 shadow-xl">
          {proActionStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-gray-700/70 bg-black/20 px-2 py-2 text-center"
            >
              <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-gray-400">
                {translateActionStatLabel(stat.label, effectiveDisplayMode)}
              </div>
              <div className="mt-1 text-sm font-semibold text-white">{stat.value}</div>
            </div>
          ))}
        </div>
      )}

      {canAct && proActionStats.length > 0 && theme.room.actionStatStyle === 'pills' && (
        <div className="flex w-full flex-wrap justify-center gap-2 rounded-2xl border border-amber-200/15 bg-amber-200/5 px-3 py-2 shadow-xl">
          {proActionStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-xs font-medium text-slate-100"
            >
              {translateActionStatLabel(stat.label, effectiveDisplayMode)} {stat.value}
            </div>
          ))}
        </div>
      )}

      {canAct && proActionStats.length > 0 && theme.room.actionStatStyle === 'annotated' && (
        <div className="grid w-full grid-cols-2 gap-2 rounded-2xl border border-sky-300/15 bg-sky-300/5 p-3 shadow-xl">
          {proActionStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-white/10 bg-black/25 px-3 py-2"
            >
              <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-sky-200">
                {translateActionStatLabel(stat.label, effectiveDisplayMode)}
              </div>
              <div className="mt-1 text-sm font-semibold text-white">{stat.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* 提交状态提示 */}
      {isSubmitting && (
        <div className="text-xs text-yellow-400 animate-pulse font-medium">
          处理中...
        </div>
      )}

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
          title="弃牌 (F)"
        >
          弃
        </button>

        {/* 过牌/跟注 */}
        {canCheck ? (
          <button
            onClick={() => handleAction('check')}
            className="h-11 px-4 bg-green-600/90 hover:bg-green-500 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-green-500/30 transform hover:scale-105 text-sm font-bold"
            title="过牌 (C)"
          >
            过牌
          </button>
        ) : (
          <button
            onClick={() => handleAction('call')}
            className="h-11 px-4 bg-blue-600/90 hover:bg-blue-500 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/30 transform hover:scale-105 text-sm font-bold"
            title={`跟注 ${callAmount} (C)`}
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
            title="加注 (R)"
          >
            加
          </button>
        )}

        {/* All-in */}
        {canRaise && (
          <button
            onClick={() => handleAction('allin')}
            className="h-11 px-3 bg-purple-600/90 hover:bg-purple-500 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-purple-500/30 transform hover:scale-105 text-sm font-bold"
            title={`All-in ${player.chips} (A)`}
          >
            梭
          </button>
        )}
      </div>

      {/* 自定义加注滑块和输入 */}
      {showRaiseInput && canRaise && (
        <div className="w-full bg-gray-800/95 backdrop-blur-sm p-4 rounded-xl border border-gray-600 shadow-lg">
          <div className="text-sm text-gray-300 text-center mb-3 font-medium">自定义加注</div>

          {/* 快捷加注按钮组 */}
          {quickRaiseSizes.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-gray-400 text-center mb-2 font-medium">快捷加注 (底池: {potSize})</div>
              <div className="grid grid-cols-2 gap-2">
                {quickRaiseSizes.map((raise, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickRaise(raise.amount)}
                    className="quick-raise-btn flex flex-col items-center justify-center h-12 text-white rounded-lg border border-orange-500/30 hover:bg-orange-600/20 transition-all duration-200"
                  >
                    <div className="text-xs font-medium opacity-90">{raise.label}</div>
                    <div className="text-sm font-bold">{raise.amount}</div>
                    <div className="text-xs opacity-75">{Math.round(raise.amount / bigBlind)}BB</div>
                  </button>
                ))}
              </div>
              <div className="border-t border-gray-600 my-3"></div>
            </div>
          )}

          {/* 滑块 */}
          <div className="mb-4">
            <SliderInput
              min={gameState.minRaise}
              max={maxRaiseAmount}
              value={sliderValue}
              step={stepSize}
              onChange={handleSliderChange}
              colorScheme={sliderValue === player.chips ? "purple" : "gold"}
              label={`步进: ${stepSize} (1大盲) | 大盲: ${bigBlind}`}
              quickButtons={[]}
              showQuickButtons={false}
              showMinMaxLabels={true}
              minLabel={`最小: ${gameState.minRaise}`}
              maxLabel={`All-in: ${maxRaiseAmount}`}
              formatValue={(value) => value === maxRaiseAmount ? 'All-in' : value}
            />
            {sliderValue === maxRaiseAmount && <div className="text-center text-purple-400 text-sm font-bold mt-1 animate-pulse">🚀 全押！</div>}
          </div>

          {/* 当前加注金额显示 */}
          <div className="text-center mb-3">
            <div className="text-lg font-bold text-yellow-400">{sliderValue === maxRaiseAmount ? 'All-in' : `加注 ${sliderValue}`}</div>
            <div className="text-xs text-gray-400">
              {sliderValue === maxRaiseAmount ? '全部筹码' : `本轮总投入: ${callAmount + sliderValue}`}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCustomRaise}
              className={`flex-1 h-10 ${
                sliderValue === maxRaiseAmount ? 'bg-purple-600 hover:bg-purple-500' : 'bg-green-600 hover:bg-green-500'
              } text-white rounded-lg text-sm font-bold transition-all duration-200 shadow-md hover:shadow-lg`}
            >
              {sliderValue === maxRaiseAmount ? 'All-in' : '确认加注'}
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
            范围: {gameState.minRaise} - {maxRaiseAmount} 筹码
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
