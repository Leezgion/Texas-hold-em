import React, { useEffect, useState } from 'react';

import PlayerTimer from './PlayerTimer';
import SliderInput from './SliderInput';
import { useGame } from '../contexts/GameContext';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { getDisplayModeTheme } from '../utils/productMode';
import {
  buildProActionStatRows,
  deriveProActionSummary,
  deriveRequestErrorFeedback,
} from '../view-models/gameViewModel';

function translateActionStatLabel(label, effectiveDisplayMode) {
  if (effectiveDisplayMode === 'club') {
    return {
      'To Call': '跟注',
      'Min Raise': '最小加',
      Pot: '底池',
      Eff: '后手',
    }[label] || label;
  }

  if (effectiveDisplayMode === 'study') {
    return {
      'To Call': '需跟注',
      'Min Raise': '最小加注',
      Pot: '底池',
      Eff: '有效后手',
    }[label] || label;
  }

  return {
    'To Call': '需跟注',
    'Min Raise': '最小加',
    Pot: '底池',
    Eff: '后手',
  }[label] || label;
}

function buildActionCommandClass(tone, extra = '') {
  return ['table-action-command', `table-action-command--${tone}`, extra].filter(Boolean).join(' ');
}

const ActionButtons = ({ player, gameState, currentPlayerId, players, effectiveDisplayMode = 'pro' }) => {
  const { playerAction } = useGame();
  const [showRaiseInput, setShowRaiseInput] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const safePlayers = Array.isArray(players) ? players : [];
  const hasResolvedActionState = Boolean(player && gameState);
  const resolvedPlayer = player ?? {
    folded: false,
    allIn: false,
    currentBet: 0,
    chips: 0,
  };
  const resolvedGameState = gameState ?? {
    currentPlayerIndex: -1,
    currentBet: 0,
    pot: 0,
    minRaise: 0,
    bigBlind: 20,
    timeRemaining: 0,
  };

  const isCurrentTurn =
    resolvedGameState.currentPlayerIndex !== undefined &&
    resolvedGameState.currentPlayerIndex === safePlayers.findIndex((p) => p.id === currentPlayerId);

  const showsDecisionConsole =
    hasResolvedActionState && isCurrentTurn && !resolvedPlayer.folded && !resolvedPlayer.allIn;
  const canAct = showsDecisionConsole && !isSubmitting;
  const canCheck = showsDecisionConsole && resolvedPlayer.currentBet >= resolvedGameState.currentBet;
  const potSize = resolvedGameState.pot || 0;
  const callAmount = Math.max(0, resolvedGameState.currentBet - resolvedPlayer.currentBet);
  const maxRaiseAmount = Math.max(0, resolvedPlayer.chips - callAmount);
  const canRaise = showsDecisionConsole && maxRaiseAmount >= resolvedGameState.minRaise;
  const bigBlind = resolvedGameState.bigBlind || resolvedGameState.minRaise || 20;
  const theme = getDisplayModeTheme(effectiveDisplayMode);
  const actionConsoleState = !hasResolvedActionState ? 'sync' : showsDecisionConsole ? 'decision' : 'watch';
  const proActionSummary = hasResolvedActionState
    ? deriveProActionSummary({
        currentPlayer: resolvedPlayer,
        players: safePlayers,
        gameState: resolvedGameState,
      })
    : null;
  const proActionStats = buildProActionStatRows(proActionSummary);

  const alignToBigBlind = (value) => {
    if (!bigBlind || bigBlind <= 0) return value;
    const minValue = Math.max(resolvedGameState.minRaise, bigBlind);
    if (value < minValue) return minValue;
    const remainder = value % bigBlind;
    if (remainder === 0) return value;
    return value + (bigBlind - remainder);
  };

  const quickRaiseSizes = [
    { label: '1/3池', amount: alignToBigBlind(Math.max(resolvedGameState.minRaise, Math.floor(potSize / 3))) },
    { label: '1/2池', amount: alignToBigBlind(Math.max(resolvedGameState.minRaise, Math.floor(potSize / 2))) },
    { label: '1x池', amount: alignToBigBlind(Math.max(resolvedGameState.minRaise, potSize)) },
    { label: '1.2x池', amount: alignToBigBlind(Math.max(resolvedGameState.minRaise, Math.floor(potSize * 1.2))) },
  ].filter((raise) => raise.amount <= maxRaiseAmount);

  useEffect(() => {
    if (canRaise && resolvedGameState.minRaise && sliderValue === 0) {
      setSliderValue(alignToBigBlind(resolvedGameState.minRaise));
    }
  }, [canRaise, resolvedGameState.minRaise, sliderValue, bigBlind]);

  useEffect(() => {
    if (!canRaise) {
      setShowRaiseInput(false);
      setSliderValue(0);
      return;
    }

    if (sliderValue > maxRaiseAmount) {
      setSliderValue(maxRaiseAmount);
    }
  }, [canRaise, sliderValue, maxRaiseAmount]);

  useEffect(() => {
    if (gameState) {
      setIsSubmitting(false);
    }
  }, [gameState]);

  useEffect(() => {
    if (isSubmitting) {
      const timeout = setTimeout(() => {
        console.warn('操作超时，自动解锁UI');
        setIsSubmitting(false);
      }, 5000);

      return () => clearTimeout(timeout);
    }

    return undefined;
  }, [isSubmitting]);

  const handleAction = async (action, amount = 0) => {
    if (canAct && !isSubmitting) {
      setIsSubmitting(true);
      setShowRaiseInput(false);
      setSliderValue(canRaise ? resolvedGameState.minRaise || 0 : 0);

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
  };

  const handleQuickRaise = async (amount) => {
    if (amount <= maxRaiseAmount) {
      await handleAction('raise', amount);
    }
  };

  const handleCustomRaise = async () => {
    const amount = sliderValue;
    if (amount && amount >= resolvedGameState.minRaise && amount <= maxRaiseAmount) {
      if (amount === maxRaiseAmount) {
        await handleAction('allin');
      } else {
        await handleAction('raise', amount);
      }
    }
  };

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

  if (!hasResolvedActionState) {
    return (
      <div
        className="table-action-console table-action-console--inactive"
        data-action-console-state={actionConsoleState}
      >
        <div className="table-action-console__empty-state">等待牌局状态同步</div>
      </div>
    );
  }

  if (!showsDecisionConsole) {
    const watchLabel = resolvedPlayer.folded
      ? '本手已弃牌'
      : resolvedPlayer.allIn
      ? '本手已全下'
      : '等待其他玩家行动';
    const watchMeta =
      resolvedPlayer.folded || resolvedPlayer.allIn
        ? '继续关注桌面结算与轮转'
        : `需跟注 ${callAmount.toLocaleString()} · 底池 ${potSize.toLocaleString()}`;

    return (
      <div
        className="table-action-console table-action-console--watch"
        data-action-console-state={actionConsoleState}
      >
        <div className="table-action-console__watch-state">
          <div className="table-action-console__watch-label">{watchLabel}</div>
          <div className="table-action-console__watch-meta">{watchMeta}</div>
        </div>
      </div>
    );
  }

  const primaryActionLabel = canCheck ? '过牌' : '跟注';
  const primaryActionMeta = canCheck ? '无需补码' : `${callAmount.toLocaleString()} 筹码`;
  const raiseLabel = showRaiseInput ? '收起加注' : '加注';
  const raiseMeta = showRaiseInput
    ? `当前 ${sliderValue.toLocaleString()}`
    : `最小 ${resolvedGameState.minRaise.toLocaleString()}`;
  const allInMeta = `${resolvedPlayer.chips.toLocaleString()} 筹码`;
  const confirmRaiseLabel = sliderValue === maxRaiseAmount ? '确认全下' : '确认加注';
  const confirmRaiseMeta =
    sliderValue === maxRaiseAmount
      ? `投入 ${resolvedPlayer.chips.toLocaleString()}`
      : `总投入 ${(callAmount + sliderValue).toLocaleString()}`;

  return (
    <div
      className={`table-action-console ${showRaiseInput ? 'table-action-console--raise-open' : ''} ${
        isSubmitting ? 'table-action-console--submitting' : ''
      }`}
      data-action-console-state={actionConsoleState}
    >
      {proActionStats.length > 0 && (
        <div
          className={`table-action-console__stats table-action-console__stats--${
            theme.room.actionStatStyle || 'grid'
          }`}
        >
          {proActionStats.map((stat) => (
            <div key={stat.label} className="table-action-console__stat">
              <span className="table-action-console__stat-label">
                {translateActionStatLabel(stat.label, effectiveDisplayMode)}
              </span>
              <span className="table-action-console__stat-value">{stat.value}</span>
            </div>
          ))}
        </div>
      )}

      {isSubmitting && <div className="table-action-console__notice">动作已发送，等待牌局确认</div>}

      <div className="table-action-console__main">
        <div className="table-action-console__timer-shell">
          <PlayerTimer
            timeRemaining={resolvedGameState.timeRemaining || 0}
            isCurrentTurn={isCurrentTurn}
          />
        </div>

        <div className="table-action-console__command-row" data-command-count={canRaise ? '4' : '2'}>
          <button
            type="button"
            onClick={() => handleAction('fold')}
            className={buildActionCommandClass('fold')}
            title="弃牌 (F)"
            disabled={isSubmitting}
          >
            <span className="table-action-command__label">弃牌</span>
            <span className="table-action-command__meta">放弃本手</span>
          </button>

          {canCheck ? (
            <button
              type="button"
              onClick={() => handleAction('check')}
              className={buildActionCommandClass('check')}
              title="过牌 (C)"
              disabled={isSubmitting}
            >
              <span className="table-action-command__label">过牌</span>
              <span className="table-action-command__meta">{primaryActionMeta}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleAction('call')}
              className={buildActionCommandClass('call')}
              title={`跟注 ${callAmount} (C)`}
              disabled={isSubmitting}
            >
              <span className="table-action-command__label">{primaryActionLabel}</span>
              <span className="table-action-command__meta">{primaryActionMeta}</span>
            </button>
          )}

          {canRaise && (
            <button
              type="button"
              onClick={() => setShowRaiseInput((value) => !value)}
              className={buildActionCommandClass('raise', showRaiseInput ? 'table-action-command--selected' : '')}
              aria-pressed={showRaiseInput}
              title="加注 (R)"
              disabled={isSubmitting}
            >
              <span className="table-action-command__label">{raiseLabel}</span>
              <span className="table-action-command__meta">{raiseMeta}</span>
            </button>
          )}

          {canRaise && (
            <button
              type="button"
              onClick={() => handleAction('allin')}
              className={buildActionCommandClass('allin')}
              title={`All-in ${resolvedPlayer.chips} (A)`}
              disabled={isSubmitting}
            >
              <span className="table-action-command__label">全下</span>
              <span className="table-action-command__meta">{allInMeta}</span>
            </button>
          )}
        </div>
      </div>

      {showRaiseInput && canRaise && (
        <div className="table-action-console__raise-surface">
          <div className="table-action-console__raise-header">
            <div>
              <div className="table-action-console__raise-kicker">加注控制台</div>
              <div className="table-action-console__raise-title">
                {sliderValue === maxRaiseAmount ? '全下线' : `加注 ${sliderValue.toLocaleString()}`}
              </div>
            </div>
            <div className="table-action-console__raise-summary">
              <span>总投入</span>
              <strong>{(callAmount + sliderValue).toLocaleString()}</strong>
            </div>
          </div>

          {quickRaiseSizes.length > 0 && (
            <div className="table-action-console__quick-grid">
              {quickRaiseSizes.map((raise) => (
                <button
                  key={raise.label}
                  type="button"
                  onClick={() => handleQuickRaise(raise.amount)}
                  className="table-action-quick"
                  disabled={isSubmitting}
                >
                  <span className="table-action-quick__label">{raise.label}</span>
                  <span className="table-action-quick__value">{raise.amount.toLocaleString()}</span>
                  <span className="table-action-quick__meta">{Math.round(raise.amount / bigBlind)}BB</span>
                </button>
              ))}
            </div>
          )}

          <SliderInput
            min={resolvedGameState.minRaise}
            max={maxRaiseAmount}
            value={sliderValue}
            step={bigBlind}
            onChange={handleSliderChange}
            density="compact"
            showValue={false}
            showSteps={false}
            colorScheme={sliderValue === maxRaiseAmount ? 'purple' : 'gold'}
            className="table-action-console__slider"
            formatLabel={(value) => value.toLocaleString()}
          />

          <div className="table-action-console__raise-range">
            <span>最小 {resolvedGameState.minRaise.toLocaleString()}</span>
            <span>{sliderValue === maxRaiseAmount ? '触发全下' : `后手 ${maxRaiseAmount.toLocaleString()}`}</span>
          </div>

          <div className="table-action-console__raise-actions">
            <button
              type="button"
              onClick={handleCustomRaise}
              className={buildActionCommandClass(
                sliderValue === maxRaiseAmount ? 'allin' : 'confirm',
                'table-action-command--wide'
              )}
              disabled={isSubmitting}
            >
              <span className="table-action-command__label">{confirmRaiseLabel}</span>
              <span className="table-action-command__meta">{confirmRaiseMeta}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const alignedMinRaise = alignToBigBlind(resolvedGameState.minRaise || 0);
                setShowRaiseInput(false);
                setSliderValue(alignedMinRaise);
              }}
              className={buildActionCommandClass('cancel', 'table-action-command--wide')}
              disabled={isSubmitting}
            >
              <span className="table-action-command__label">取消</span>
              <span className="table-action-command__meta">返回主动作区</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionButtons;
